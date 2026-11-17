import { DIFFICULTIES, LAST_YEAR, SPORTS } from '../engine/data.js';
import { enqueueAI, enqueuePolicy, resolveDecision } from '../engine/politics.js';
import { rng } from '../engine/random.js';
import { advanceMonth, createGame, dateText, goalReached, shouldReview, snapshot, startGoal } from '../engine/simulation.js';
import { exportGame, parseSave } from '../engine/validation.js';
import { activeTeams } from '../engine/world.js';
import { annotationKey, generate, getPrefs, listModels, savePrefs } from './ai.js';
import { renderFinance, renderMap } from './charts.js';
import { deleteSave, listSaves, readSave, writeSave } from './persistence.js';
import { btn, esc, icon } from './ui.js';
import { appFrame, clubsView, desk, dialogArticle, dialogDecision, financialSeries, financeView, mapView, newLeague, news, office, personView, records, savesView, settingsView, sources, standingsView, teamView, timeline, titleOf } from './views.js';

const app=document.querySelector('#app');
const dialog=document.querySelector('#dialog');
const status=document.querySelector('#notice');
const fileInput=document.querySelector('#import-file');
const views={desk,standings:standingsView,clubs:clubsView,map:mapView,finance:financeView,office,timeline,news,records,team:teamView,person:personView};
const defaultSeed='1876-charter';
const u={
  view:'desk',year:1876,entity:null,navOpen:false,step:'month',run:null,resume:null,lastSave:0,lastDecision:null,
  standTab:'table',clubTab:'active',recordTab:'titles',clubSearch:'',personSearch:'',mapType:'regional',matchTeam:'',page:0,
  newsKind:'all',newsYear:'all',financeMetric:'income',
  modal:null,modalEntity:null,returnFocus:null,newSport:'baseball',newSeed:'',newDifficulty:'standard',newMode:'active',slots:[],saveName:null,
  settingsTab:'game',ai:getPrefs(),apiKey:'',models:[],modelsBusy:false,aiBusy:false,aiDraft:null,
  usage:{calls:0,tokens:0,cost:0,missing:0},storageError:false
};
let s=createGame('baseball',defaultSeed);
let toastTimer;
let toastText='';
let resizeTimer;
let renderToken=0;
let modalVersion=0;

function notice(message) {
  toastText=message;
  status.textContent=message;
  status.classList.add('show');
  const inDialog=dialog.querySelector('.dialog-notice');
  if (inDialog) inDialog.textContent=message;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{
    toastText='';
    status.classList.remove('show');
    const inDialog=dialog.querySelector('.dialog-notice');
    if (inDialog) inDialog.textContent='';
  },3500);
}

function setStep(step) {
  u.step=step;
  if (step==='target') open('target');
  else render();
}

function drawCurrent() {
  const mini=document.querySelector('#office-map');
  if (mini) renderMap(mini,activeTeams(s));
  const full=document.querySelector('#full-map');
  if (full) renderMap(full,(s.seasons[u.year]??snapshot(s)).members,u.mapType==='continental');
  const chart=document.querySelector('#finance-chart');
  if (chart) renderFinance(chart,financialSeries(s),u.financeMetric);
}

function render({preserve=true}={}) {
  const within=preserve&&app.contains(document.activeElement)?focusSelector(document.activeElement):null;
  app.innerHTML=appFrame(s,u,views[u.view](s,u));
  if (within) app.querySelector(within)?.focus({preventScroll:true});
  const token=++renderToken;
  requestAnimationFrame(()=>{if(token===renderToken) drawCurrent();});
}

function focusSelector(element) {
  if (element.id) return '#'+CSS.escape(element.id);
  const d=element.dataset;
  if (d.action) {
    let selector='[data-action="'+CSS.escape(d.action)+'"]';
    for (const k of ['view','id','target','value','index','year','kind']) if (d[k]) selector+='[data-'+k+'="'+CSS.escape(d[k])+'"]';
    return selector;
  }
  return d.change?'[data-change="'+CSS.escape(d.change)+'"]':null;
}

function go(view,entity=null,year=null) {
  if (!Object.hasOwn(titleOf,view)) return;
  if (dialog.open) close();
  u.view=view;
  u.entity=entity;
  u.navOpen=false;
  u.page=0;
  u.year=year??(view==='map'||view==='standings'||view==='timeline'?u.year:s.year);
  if (!s.seasons[u.year]&&u.year!==s.year) u.year=s.year;
  render({preserve:false});
  window.scrollTo({top:0,behavior:'instant'});
  document.querySelector('#main')?.focus({preventScroll:true});
}

function showDecision(row) {
  if (!row) return;
  u.lastDecision=row;
  render();
  notice(row.enacted?'Decision recorded.':row.voting?.passed===false?'The owners voted down the proposal.':'The proposal lapsed.');
  void autosave();
}

const modalHeaders={new:'Start a new league',saves:'Save & load',settings:'Settings',target:'Advance to a year',sources:'Historical sources',article:'From the league wire',decision:'Owner vote',ai:'Generated proposal',remove:'Delete saved league'};

async function open(key,id=null) {
  if (key==='saves'&&u.modal!=='saves') u.saveName=null;
  u.modal=key;
  u.modalEntity=id;
  const version=++modalVersion;
  if (!dialog.open) u.returnFocus=focusSelector(document.activeElement);
  if (key==='new') {
    u.newSport=s.sport; u.newSeed=''; u.newDifficulty=s.difficulty; u.newMode=s.settings.mode;
  }
  renderDialog();
  if (!dialog.open) dialog.showModal();
  if (key==='saves') {
    try {
      const slots=await listSaves();
      if (u.modal==='saves'&&version===modalVersion) { u.slots=slots; renderDialog(); }
    } catch { notice('Browser storage is unavailable. You can export a save file.'); }
  }
}

function close() {
  if (dialog.open) dialog.close();
  u.modal=null;
  u.modalEntity=null;
  modalVersion++;
  if (u.returnFocus) document.querySelector(u.returnFocus)?.focus({preventScroll:true});
}

function renderDialog() {
  const key=u.modal;
  const id=u.modalEntity;
  let content='';
  if (key==='new') content=newLeague(s,u);
  if (key==='saves') content=savesView(s,u);
  if (key==='settings') content=settingsView(s,u);
  if (key==='sources') content=sources(s);
  if (key==='article') content=dialogArticle(s,u,id);
  if (key==='decision') content=dialogDecision(s,id);
  if (key==='target') content=`<form data-form="target" class="form-stack"><label>Target season<input name="year" type="number" min="${Math.min(s.year+1,LAST_YEAR)}" max="${LAST_YEAR}" value="${Math.min(s.year+5,LAST_YEAR)}" required></label><div class="dialog-actions">${btn('Cancel','close',{style:'light'})}<button type="submit" class="btn dark">${icon('skip',15)} Start simulation</button></div></form>`;
  if (key==='ai'&&u.aiDraft) content=`<div class="article-sheet"><p class="eyebrow">Generated correspondence · ${esc(u.aiDraft.model)}</p><h3>${esc(u.aiDraft.title)}</h3><p>${esc(u.aiDraft.body)}</p></div><div class="dialog-actions">${btn('Dismiss','close',{style:'light'})}${btn('Place on the agenda','accept-ai',{style:'dark',glyph:'gavel'})}</div>`;
  if (key==='remove') {
    const row=u.slots.find(slot=>slot.id===id);
    content=`<p>Delete the saved game <strong>${esc(row?.name)}</strong>?</p><div class="dialog-actions">${btn('Cancel','saves',{style:'light'})}${btn('Delete saved game','confirm-delete',{style:'danger',attr:'data-id="'+esc(id)+'"'})}</div>`;
  }
  dialog.innerHTML=`<header><h2 id="dialog-title">${modalHeaders[key]??'League office'}</h2><button type="button" class="icon-button" aria-label="Close dialog" data-action="close">${icon('close',19)}</button></header><div class="dialog-body"><p class="dialog-notice" role="status">${esc(toastText)}</p>${content}</div>`;
}

function persistSettings() {
  void autosave(u.run?runResume(u.run):u.resume);
}

async function autosave(resume=u.resume) {
  try {
    await writeSave('autosave','Autosave · '+s.name,s,resume);
    u.lastSave=Date.now();
    u.storageError=false;
    const saved=document.querySelector('.saved');
    if (saved) {
      saved.classList.add('is-saved');
      saved.title='Autosaved';
      saved.innerHTML=icon('check',17);
    }
  } catch {
    if (!u.storageError) notice('Autosave is unavailable. Export your league from Save & load.');
    u.storageError=true;
  }
}

function goalFrom(step) {
  if (step==='month'||step==='event'||step==='season'||step==='end') return {type:step};
  return {type:'year',year:Math.min(LAST_YEAR,s.year+(step==='year'?1:Number(step)||1))};
}

function runResume(run) {
  return {goal:run.goal,started:run.started,label:run.label};
}

function labelGoal(goal) {
  if (goal.type==='end') return 'Through 2026';
  if (goal.type==='year') return 'To '+goal.year;
  return {event:'Next event',month:'One month',season:'Finish season'}[goal.type];
}

function progressFor(run) {
  if (run.goal.type==='month'||run.goal.type==='event') return Math.min(96,5+(s.year-run.started.year)*70+s.phase*7);
  const target=run.goal.type==='end'?LAST_YEAR+1:run.goal.type==='season'?run.started.goalYear+1:run.goal.year;
  return Math.max(0,Math.min(99,Math.round((s.year-run.started.year+(s.phase-run.started.phase)/12)/(target-run.started.year||1)*100)));
}

const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

async function runGame(goal,resume=null) {
  if (u.run||s.status!=='running') return;
  const start=resume?.started??startGoal(s,goal);
  if (goalReached(s,goal,start)) { u.resume=null; render(); return; }
  if (shouldReview(s,s.settings.mode!=='active')) {
    u.resume={goal,started:start,label:labelGoal(goal)};
    go('office');
    notice('The directors have a proposal for your review.');
    void autosave(u.resume);
    return;
  }
  const run={goal,started:start,label:resume?.label??labelGoal(goal),progress:0,stop:null};
  u.run=run;
  u.resume=null;
  render();
  await autosave(runResume(run));
  let savedYear=s.year;
  let paint=0;
  let blocked=false;
  let error=null;
  try {
    while (!run.stop&&!goalReached(s,goal,start)) {
      const deadline=performance.now()+24;
      const prior=s.year;
      do {
        if (shouldReview(s,s.settings.mode!=='active')) { blocked=true; break; }
        if (!advanceMonth(s)) { blocked=true; break; }
      } while (!goalReached(s,goal,start)&&performance.now()<deadline&&s.year-savedYear<3);
      if (u.year===prior) u.year=s.year;
      run.progress=progressFor(run);
      if (performance.now()-paint>110) { render(); paint=performance.now(); }
      if (s.year-savedYear>=3) { await autosave(runResume(run)); savedYear=s.year; }
      if (blocked) break;
      await tick();
    }
  } catch (err) {
    console.error(err);
    error=err;
  }
  u.run=null;
  u.resume=null;
  if (!goalReached(s,goal,start)&&run.stop!=='cancel'&&(blocked||run.stop==='pause')) u.resume=runResume(run);
  if (blocked&&s.pending) go('office');
  else render();
  await autosave();
  if (error) notice('The simulation stopped because a league record could not be processed.');
  else if (blocked&&s.pending) notice('The simulation paused for a proposal.');
  else if (run.stop==='cancel') notice('Run cancelled. Progress to '+dateText(s,true)+' was kept.');
  else if (run.stop==='pause') notice('Simulation paused at '+dateText(s,true)+'.');
  else if (s.status==='collapsed') notice('The league has dissolved. Its historical archive is open.');
  else if (s.status==='completed') notice('The historical record reached December 2026.');
  void autoReviews(run);
}

async function autoReviews(run) {
  if (!u.ai.enabled||!u.apiKey||!u.ai.frequency||u.aiBusy||run.stop) return;
  const years=Object.values(s.seasons).filter(row=>!row.partial&&row.year>=run.started.year&&row.year%u.ai.frequency===0);
  const target=s;
  const available=u.ai.budget-u.usage.calls;
  if (available<=0) return;
  const due=years.filter(row=>!s.annotations['season:'+row.year]).slice(-available);
  for (const {year} of due) {
    if (s!==target||u.run||u.aiBusy) break;
    if (!await aiCall({kind:'season',year,span:1},{quiet:true})) break;
  }
}

async function preserveLeague() {
  if (!s.decisions.length&&!Object.keys(s.seasons).length) return;
  try { await writeSave('previous-'+s.sport+'-'+s.seed,s.name+' · '+s.year,s,u.resume); }
  catch { notice('The previous league could not be retained automatically.'); }
}

function loadGame(game,resume=null) {
  s=game;
  u.year=s.year;
  u.lastDecision=null;
  u.resume=validResume(resume);
  u.step='month';
  u.standTab='table';u.clubTab='active';u.recordTab='titles';u.matchTeam='';u.newsKind='all';u.newsYear='all';
  u.clubSearch='';u.personSearch='';
  go('desk');
  void autosave();
}

function validResume(r) {
  const goal=r?.goal;
  const start=r?.started;
  if (!goal||!start||!['end','event','month','season','year'].includes(goal.type)||typeof r.label!=='string') return null;
  if (goal.type==='year'&&(!Number.isInteger(goal.year)||goal.year<SPORTS[s.sport].start||goal.year>LAST_YEAR)) return null;
  return ['year','phase','events','goalYear'].every(key=>Number.isInteger(start[key]))&&!goalReached(s,goal,start)?r:null;
}

function randomSeed() {
  return Array.from(crypto.getRandomValues(new Uint32Array(2)),value=>value.toString(36)).join('-');
}

const uniqueId=()=>crypto.randomUUID?.()??randomSeed();

function locked() {
  if(!u.run) return false;
  notice('Pause the simulation before changing leagues or the agenda.');
  return true;
}

function captureNew() {
  const form=dialog.querySelector('[data-form="new"]');
  if (!form) return;
  const data=new FormData(form);
  u.newSeed=String(data.get('seed'));
  u.newDifficulty=data.get('difficulty');
  u.newMode=data.get('mode');
}

function exportSave() {
  const title=s.name+' '+s.year;
  const filename=title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.slc.json';
  const blob=new Blob([exportGame(s,title)],{type:'application/json'});
  const address=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=address;
  link.download=filename;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(address),2500);
  notice('Save exported.');
}

function changeMode(value) {
  if (locked()||!['active','hybrid','observer'].includes(value)) return;
  if (s.settings.mode!==value) s.settings.pauseMajor=value!=='observer';
  s.settings.mode=value;
  render();
  if (u.modal==='settings') renderDialog();
  persistSettings();
}

function chooseYear(y) {
  const year=Number(y);
  if (!(Number.isInteger(year)&&year>=SPORTS[s.sport].start&&year<=s.year)) return;
  u.year=year;
  u.page=0;
  u.matchTeam='';
  render();
}

function collectPrefs(form) {
  const data=new FormData(form);
  u.apiKey=String(data.get('apiKey')??'').trim();
  u.ai={...u.ai,enabled:data.has('enabled'),model:String(data.get('model')??'').trim(),detailModel:String(data.get('detailModel')??'').trim(),
    temperature:Math.max(0,Math.min(1.5,Number(data.get('temperature'))||0)),maxTokens:Math.min(2000,Math.max(100,Math.round(Number(data.get('maxTokens'))||520))),
    budget:Math.min(100,Math.max(1,Math.round(Number(data.get('budget'))||12))),detail:String(data.get('detail')),frequency:Number(data.get('frequency')),autoProposal:data.has('autoProposal')};
}

async function fetchModelList() {
  if (u.modelsBusy) return;
  if (location.protocol==='file:') { notice('Run the local web server to fetch OpenRouter models.'); return; }
  const form=dialog.querySelector('[data-form="ai-settings"]');
  if (form) collectPrefs(form);
  u.modelsBusy=true;
  renderDialog();
  try {
    u.models=await listModels();
    notice(u.models.length?`${u.models.length} models loaded.`:'OpenRouter returned an empty model list.');
  } catch(err) {
    notice(err.message);
  }
  u.modelsBusy=false;
  if (u.modal==='settings') renderDialog();
}

async function aiCall(request,{quiet=false}={}) {
  if (u.aiBusy) return;
  if (!u.ai.enabled||!u.apiKey||location.protocol==='file:'||u.usage.calls>=u.ai.budget) {
    if (!quiet) notice(!u.ai.enabled||!u.apiKey?'Enter an OpenRouter key in Settings.':location.protocol==='file:'?'Start the game’s local server for OpenRouter.':'The session request budget has been used.');
    return;
  }
  if (request.kind==='proposal'&&locked()) return;
  const target=s;
  u.usage.calls++;
  u.aiBusy=true;
  render();
  if (dialog.open) renderDialog();
  try {
    const reply=await generate(target,request,u.ai,u.apiKey,u.models);
    u.usage.tokens+=reply.prompt+reply.completion;
    if (reply.cost===null) u.usage.missing++;
    else u.usage.cost+=reply.cost;
    if (target!==s) return;
    if (request.kind==='proposal') {
      u.aiDraft=reply;
      if (u.ai.autoProposal) acceptAI();
      else await open('ai');
    } else {
      s.annotations[annotationKey(request)]={...reply,recordedYear:s.year};
      if (!quiet) notice('Generated commentary added to the archive.');
      await autosave();
    }
    return true;
  } catch(err) {
    if (!quiet) notice(err.name==='TimeoutError'?'OpenRouter timed out. The simulation is available.':err.message+' The league record is unchanged.');
  } finally {
    u.aiBusy=false;
    render();
    if (dialog.open) renderDialog();
  }
}

function acceptAI() {
  if (!u.aiDraft||locked()) return;
  if (enqueueAI(s,u.aiDraft,rng(s))) {
    s.aiProposals.push({year:s.year,decision:s.pending.id,...u.aiDraft});
    u.aiDraft=null;
    go('office');
    notice('Generated proposal placed before the directors.');
    void autosave();
  } else {
    close();
    notice('This proposal no longer applies to the current league.');
  }
}

const tabKeys={'stand-tab':'standTab','club-tab':'clubTab','record-tab':'recordTab','map-type':'mapType','finance-metric':'financeMetric'};

document.addEventListener('click',async event=>{
  const control=event.target.closest('button[data-action]');
  if (!control||control.disabled) return;
  const d=control.dataset;
  const action=d.action;
  try {
    if (Object.hasOwn(tabKeys,action)) {u[tabKeys[action]]=d.value;u.page=0;render();return;}
    switch (action) {
      case 'nav': go(d.view); break;
      case 'toggle-nav': u.navOpen=!u.navOpen;render();break;
      case 'team': go('team',d.id);break;
      case 'person': go('person',d.id);break;
      case 'saves': case 'settings': case 'sources': await open(action);break;
      case 'new': if(!locked()) await open('new');break;
      case 'close': close();break;
      case 'article': case 'decision-detail': await open(action==='article'?action:'decision',d.id);break;
      case 'select-year': chooseYear(d.year);break;
      case 'historical-standings': u.standTab='table';go('standings',null,Number(d.year));break;
      case 'pagination': u.page=Math.max(0,Number(d.value));render();break;
      case 'new-sport': captureNew();u.newSport=d.value;renderDialog();break;
      case 'settings-tab': u.settingsTab=d.value;renderDialog();break;
      case 'advance':
        if ((d.target??u.step)==='target') await open('target');
        else { if(d.target) u.step=d.target; await runGame(goalFrom(d.target??u.step)); }
        break;
      case 'pause': case 'cancel': if (u.run) u.run.stop=action;break;
      case 'resume': if(u.resume) await runGame(u.resume.goal,u.resume);break;
      case 'clear-run': u.resume=null;u.step='month';render();void autosave();break;
      case 'choose': if(!locked()) showDecision(resolveDecision(s,Number(d.index),rng(s)));break;
      case 'agenda': if(!locked()&&enqueuePolicy(s,d.value,rng(s))) {render();void autosave();}break;
      case 'export': exportSave();break;
      case 'import': if(!locked()) fileInput.click();break;
      case 'load':
        if (locked()) break;
        { const item=await readSave(d.id); if(item) { if(d.id!=='autosave') await preserveLeague(); loadGame(item.game,item.resume); notice('League loaded.'); } }
        break;
      case 'delete-save': await open('remove',d.id);break;
      case 'confirm-delete': await deleteSave(d.id);await open('saves');notice('Save removed.');break;
      case 'models': await fetchModelList();break;
      case 'generate': await aiCall({kind:d.kind,id:d.id||undefined,year:Number(d.year)||undefined,span:Number(d.span)||1});break;
      case 'accept-ai': acceptAI();break;
    }
  } catch(error) { notice(error.message||'The requested operation could not be completed.'); }
});

document.addEventListener('input',event=>{
  if (event.target.matches('[data-form="save"] input[name="name"]')) u.saveName=event.target.value;
});

document.addEventListener('change',event=>{
  const element=event.target;
  const key=element.dataset.change;
  switch(key) {
    case 'mode': changeMode(element.value); break;
    case 'pauseMajor': s.settings.pauseMajor=element.checked;render();persistSettings();break;
    case 'inflation': s.settings.inflation=element.checked;render();persistSettings();break;
    case 'year': chooseYear(element.value);break;
    case 'step': setStep(element.value);break;
    case 'matchTeam': case 'newsKind': case 'newsYear': u[key]=element.value;u.page=0;render();break;
  }
});

document.addEventListener('submit',async event=>{
  const key=event.target.dataset.form;
  if (!key) return;
  event.preventDefault();
  const form=event.target;
  const data=new FormData(form);
  try {
    if (key==='new'&&!locked()) {
      captureNew();
      if (!Object.hasOwn(DIFFICULTIES,u.newDifficulty)||!Object.hasOwn(SPORTS,u.newSport)) return;
      await preserveLeague();
      const next=createGame(u.newSport,u.newSeed.trim()||randomSeed(),u.newDifficulty);
      next.settings.mode=u.newMode;
      next.settings.pauseMajor=u.newMode!=='observer';
      loadGame(next);
      notice('Founding charter opened.');
    } else if (key==='save') {
      const name=String(data.get('name')).trim();
      if (!name) return;
      await writeSave(uniqueId(),name,s,u.run?runResume(u.run):u.resume);
      u.saveName=null;
      await open('saves');
      notice('League saved.');
    } else if (key==='target') {
      const year=Number(data.get('year'));
      if (!Number.isInteger(year)||year<s.year||year>LAST_YEAR) return;
      close();
      await runGame(year===s.year?{type:'end'}:{type:'year',year});
    } else if(key==='clubs'||key==='people') {
      u[key==='clubs'?'clubSearch':'personSearch']=String(data.get('query')??'');
      render();
    } else if(key==='ai-settings') {
      collectPrefs(form);
      savePrefs(u.ai);
      render();
      renderDialog();
      notice('OpenRouter settings saved for this browser.');
    }
  } catch(error) { notice(error.message||'The requested operation could not be completed.'); }
});

fileInput.addEventListener('change',async()=>{
  const file=fileInput.files[0];
  fileInput.value='';
  if (!file||locked()) return;
  try {
    if (file.size>64*1024*1024) throw new Error('Save exports must be smaller than 64 MB.');
    const {name,game}=parseSave(await file.text());
    await preserveLeague();
    await writeSave(uniqueId(),name,game);
    loadGame(game);
    notice('Save validated and imported.');
  } catch(error) { notice(error.message); }
});

dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
dialog.addEventListener('click',event=>{if(event.target===dialog) close();});
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawCurrent,70);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&u.run) void autosave(runResume(u.run));});

async function initialise() {
  app.innerHTML=`<div class="boot">${icon('shield',29)}<span>Opening the league office…</span></div>`;
  try {
    const saved=await readSave('autosave');
    if (saved) {
      s=saved.game;u.year=s.year;u.lastSave=saved.updated;u.resume=validResume(saved.resume);
    }
  } catch { notice('Autosave could not be opened. You can load a manual save or import a league.'); }
  render({preserve:false});
}

await initialise();
