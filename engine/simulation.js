import { CITIES, DIFFICULTIES, LAST_YEAR, MONTHS, SPORTS, VERSION } from './data.js';
import { decideChampion, emptyRecord, playMonth, standings } from './competition.js';
import { closeFranchise, createFranchise, journal, makeRival, updateRivals, updateTalent } from './franchises.js';
import { automatedChoice, makeDecision, openingDecision, resolveDecision } from './politics.js';
import { account, activeRivals, activeTeams, budgetUnit, byId, cityName, dateOf, era, health, historicalConditions, marketCandidates, money, normalCapacity, seasonLabel } from './world.js';
import { clamp, hashSeed, integer, mean, rng, round } from './random.js';

function createSeason() {
  return {members:[],schedule:null,matches:[],bracket:[],settled:false,special:0,ruleChanges:0,worldYears:[]};
}

export function createGame(sport='baseball',seed='1876-charter',difficulty='standard') {
  const cfg=SPORTS[sport];
  if (!cfg || !Object.hasOwn(DIFFICULTIES,difficulty)) throw new Error('Choose a supported sport and difficulty.');
  const random=hashSeed(seed);
  const s={
    version:VERSION,sport,difficulty,seed:String(seed).slice(0,100),random,
    year:cfg.start,phase:0,name:cfg.name,tag:cfg.tag,status:'running',retrospective:null,
    rules:{format:cfg.format,games:cfg.games,alignment:sport==='basketball'?'regional':'single',ties:['hockey','football'].includes(sport),overtime:false,authority:.32,threshold:.51,sharing:.08,payroll:1,broadcast:1,draft:false,pace:false,access:1,contracts:'club lists'},
    popularity:cfg.appeal,approvingYears:0,approval:62,labour:65,reserve:0,lossYears:0,warnings:0,strikeThrough:0,
    commissioners:[{name:cfg.founder,start:cfg.start,ended:null}],leagueNames:[{year:cfg.start,name:cfg.name}],
    ids:{team:0,person:0,rival:0,event:0,decision:0},teams:[],people:{},rivals:[],
    events:[],decisions:[],seasons:{},current:createSeason(),hall:[],annotations:{},aiProposals:[],
    pending:null,settings:{mode:'active',pauseMajor:true,inflation:false},metrics:{games:0,titleCount:0}
  };
  const next=rng(s);
  s.reserve=budgetUnit(s)*.50*DIFFICULTIES[difficulty].cash;
  for (const [code,market,name,venue,talent,capacity,fans,owner,division,status] of cfg.clubs) {
    const athletes=cfg.athletes.filter(row=>row[0]===code).map(row=>row.slice(1));
    const team=createFranchise(s,{code,market,name,venue,talent,capacity,fans,owner,division,status,athletes},next);
    team.color=({CHI:'#425a7d',BOS:'#a34c47',CIN:'#a3544d',HAR:'#4c6581',LOU:'#897656',NYM:'#56766b',PHA:'#61577a',STL:'#875a51'})[code] ?? team.color;
    team.lineage[0].color=team.color;
  }
  for (const [name,tag,markets] of cfg.rivals) makeRival(s,name,tag,markets,next,true);
  journal(s,'founding',`${cfg.name} is founded`,
    `${cfg.founder} and the directors meet in ${cfg.foundingPlace}. ${activeTeams(s).length} clubs will take the field in the inaugural season. ${cfg.context}`);
  s.pending=openingDecision(s);
  return s;
}

function align(s) {
  const teams=activeTeams(s).sort((a,b)=>a.market.localeCompare(b.market));
  if (s.rules.alignment==='single') {
    for (const team of teams) team.division='';
  } else {
    const existing=SPORTS[s.sport].start===s.year&&s.sport==='basketball';
    if (!existing) {
      const ranked=teams.sort((a,b)=>byMarketLongitude(a,b));
      ranked.forEach((t,i)=>{t.division=i<Math.ceil(teams.length/2)?'East':'West';});
    }
  }
  if (s.sport==='football'&&s.rules.format!=='ratification'&&s.year>=1965) s.rules.overtime=true;
}

function byMarketLongitude(a,b) {
  return CITIES[b.market].lon-CITIES[a.market].lon || a.id.localeCompare(b.id,'en',{numeric:true});
}

function worldChange(s) {
  const event=historicalConditions(s).event;
  if (!event || s.current.worldYears.includes(event[0]) || s.events.some(row=>row.worldYear===event[0])) return null;
  s.current.worldYears.push(event[0]);
  return journal(s,'world',event[1],event[2],{worldYear:event[0]});
}

function filesFor(s,teams,next) {
  const rows=teams.map(team=>({team,details:account(s,team,next)}));
  const pooled=mean(rows.map(({details:d})=>d.ticket*.60+d.media*.90));
  const unit=budgetUnit(s);
  let revenue=0;
  let expense=0;
  let cash=0;
  let debt=0;
  let media=0;
  let attendance=0;
  let gates=0;
  for (const {team,details:d} of rows) {
    const shared=(pooled-d.ticket*.60-d.media*.90)*s.rules.sharing;
    const dues=(d.revenue+shared)*(.036+s.rules.authority*.025);
    const contracts=team.roster.reduce((sum,id)=>sum+(s.people[id].contract?.salary??0),0);
    const payroll=d.payroll*.74+contracts*.46*historicalConditions(s).payroll;
    const fees=d.expense-d.payroll+payroll+dues;
    const margin=d.revenue+shared-fees;
    const investment=margin < -unit*.12 && team.arrears<2 ? Math.min(unit*.25,-margin*.24)*team.owner.wealth : 0;
    const contribution=s.reserve>unit*.75 && s.rules.sharing>.14 && team.debt>unit*.27 ? Math.min(unit*.10,s.reserve*.06) : 0;
    const net=margin+investment+contribution;
    s.reserve+=dues-contribution;
    team.cash+=net;
    if (team.cash<0) {
      team.debt+=-team.cash*.98;
      team.cash=0;
      team.arrears++;
    } else {
      const repay=Math.min(Math.max(0,team.cash-unit*.12)*.33,team.debt);
      const dividend=Math.max(0,team.cash-unit*2.30)*.50;
      team.debt=Math.max(0,team.debt-repay);
      team.cash=Math.max(0,team.cash-repay-dividend);
      if (team.debt<unit*.40) team.arrears=Math.max(0,team.arrears-1);
    }
    if (team.debt>unit*.95&&margin<0&&team.cash<unit*.22) team.arrears++;
    const occupancy=d.attendance/Math.max(1,d.games*team.capacity);
    const wins=(team.record.w+team.record.t*.5)/Math.max(1,team.record.g);
    team.fans=clamp(team.fans*.94+(team.founded===s.year?2.5:1.6)+occupancy*2.3+(wins-.51)*7.3+integer(next,-2,2),15,95);
    const valuation=Math.max(0,(d.revenue+shared)*(s.year<1950?1.8:s.year<1980?2.6:4.7)+team.cash-team.debt);
    const values={...d,payroll,dues,expense:fees,revenue:d.revenue+shared,shared,margin,investment,assistance:contribution,cash:team.cash,debt:team.debt,valuation,realRevenue:d.revenue+shared,realExpense:fees,realMargin:margin};
    const currency=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,/^real|^(attendance|games)$/.test(k)?round(value):money(value,s.year)]));
    team.ledger[s.year]=currency;
    team.records[s.year]={...team.record};
    revenue+=d.revenue+shared;
    expense+=fees;
    cash+=team.cash;
    debt+=team.debt;
    media+=d.media;
    attendance+=d.attendance;
    gates+=d.games;
    if (s.year-team.entered>=3&&team.cash>unit*1.44&&occupancy>.68&&next()<.28&&team.capacity<normalCapacity(s.sport,s.year)*1.35) {
      team.capacity=Math.min(Math.round(normalCapacity(s.sport,s.year)*1.4),Math.round(team.capacity*1.12));
      team.cash-=unit*.24;
    }
  }
  const operating=unit*(.045+teams.length*.013);
  s.reserve=clamp(s.reserve-operating,-unit*4,unit*Math.max(4,teams.length)*1.08);
  return {
    revenue:money(revenue,s.year),expense:money(expense+operating,s.year),media:money(media,s.year),cash:money(cash,s.year),debt:money(debt,s.year),reserve:money(s.reserve,s.year),
    margin:money(revenue-expense-operating,s.year),realRevenue:round(revenue),realExpense:round(expense+operating),realMargin:round(revenue-expense-operating),attendance,gates,average:Math.round(attendance/Math.max(1,gates))
  };
}

export function peopleLeaders(s,year,limit=8) {
  const key=({baseball:'hits',football:'td',basketball:'points',hockey:'goals'})[s.sport];
  const leaders=[];
  for (const p of Object.values(s.people)) {
    const season=p.stats?.[year];
    if (!season) continue;
    const lines=Object.entries(season);
    const sum=lines.reduce((value,[,line])=>value+(line[key]??0),0);
    const games=lines.reduce((value,[,line])=>value+line.games,0);
    if (games) leaders.push({id:p.id,name:p.name,position:p.pos,team:lines.at(-1)[0],sum,key,games});
  }
  return leaders.sort((a,b)=>b.sum-a.sum||a.name.localeCompare(b.name)).slice(0,limit);
}

export function snapshot(s) {
  const members=s.current.members.length?s.current.members:activeTeams(s).map(t=>({id:t.id,name:t.name,market:t.market,color:t.color,code:t.code,division:t.division}));
  const records=standings(members.map(({id})=>byId(s,id)?.record).filter(Boolean));
  return {year:s.year,name:s.name,tag:s.tag,champion:null,runnerUp:null,members,records,bracket:[],matches:s.current.matches,rules:{...s.rules},finance:null,leaders:[],phase:s.phase,partial:true,popularity:s.popularity,health:health(s).value,approval:s.approval,labour:s.labour};
}

function finish(s,next) {
  const cfg=SPORTS[s.sport];
  const old=activeTeams(s);
  const win=decideChampion(s,next);
  const standingsRows=standings(old.map(team=>team.record));
  const last=s.current.bracket.at(-1);
  const runner=last?(win.id===last.a?last.b:last.a):standingsRows.find(row=>row.id!==win?.id)?.id;
  const finance=filesFor(s,old,next);
  const leaderRows=peopleLeaders(s,s.year);
  const champ=win ? byId(s,win.id) : null;
  if (champ) {
    champ.titles.push(s.year);
    s.metrics.titleCount++;
    s.metrics.games+=s.current.matches.length+s.current.bracket.reduce((sum,series)=>sum+series.matches.length,0);
    for (const id of champ.roster) {
      const p=s.people[id];
      if (p.stats[s.year]?.[champ.id]) p.honours.push({year:s.year,type:'Champion',team:champ.id});
    }
    const detail=last?`The ${champ.name} take the title over ${byId(s,runner).name} in the ${last.round.toLowerCase()}.`:
      `The ${champ.name} finish ${win.w}–${win.l}${win.t?'–'+win.t:''} to win the league title.`;
    journal(s,'championship',`${champ.name} win the ${seasonLabel(s.sport,s.year)} title`,detail,{team:champ.id});
  }
  if (leaderRows[0]) {
    const p=s.people[leaderRows[0].id];
    p.honours.push({year:s.year,type:'Statistical leader',team:leaderRows[0].team});
  }
  const statement={
    ...snapshot(s),partial:false,champion:win?.id??null,runnerUp:runner??null,finance,leaders:leaderRows,bracket:s.current.bracket
  };
  s.current.settled=true;
  s.seasons[s.year]=statement;
  const turnstile=finance.average/Math.max(1,mean(old.map(team=>team.capacity)));
  const titleMomentum=.85+(win && win.w / Math.max(1,win.g)<.67?.66:0);
  const losses=finance.margin<0;
  const rivals=activeRivals(s);
  s.popularity=clamp(s.popularity + (turnstile-.59)*8+titleMomentum - (losses?.85:0) - rivals.length*.51 + integer(next,-2,2),4,98);
  s.approval=clamp(s.approval+(losses?-3:1.7)+(turnstile-.54)*3 - (s.labour<30?1:0),2,99);
  s.labour=clamp(s.labour+(s.rules.payroll>1.08?3:s.rules.payroll<.92?-3:1)+(rivals.length?1:0)+integer(next,-4,3),0,99);
  if (s.labour < 23 && s.year+1>s.strikeThrough && next()<.50) {
    s.strikeThrough=s.year+1;
    s.popularity=clamp(s.popularity-6,0,100);
    journal(s,'labour','Players authorise a work stoppage','The opening of the next season is disrupted. Clubs prepare a shortened calendar and risk losing crowds.');
    s.labour+=8;
  }
  const unit=budgetUnit(s);
  for (const team of old) {
    const failed=team.arrears>=2 && team.debt>unit*(s.year<1950?1.20:1.53) && team.cash<unit*.17;
    if (!failed) continue;
    if (s.reserve>unit*.52 && s.rules.sharing>.15 && s.rules.authority>.26 && s.difficulty!=='hardship') {
      s.reserve-=unit*.43; team.cash+=unit*.28; team.debt*=.74; team.arrears=0;
      journal(s,'finance',`${team.name} receive a guarantee`,'The league reserve covered immediate obligations under the charter.',{team:team.id});
    } else {
      closeFranchise(s,team,'Mounting debt and operating losses exhausted the club’s credit.');
      s.popularity=clamp(s.popularity-3,0,100);
      s.approval=clamp(s.approval-4,0,100);
    }
  }
  const measure=health(s);
  const remaining=activeTeams(s).length;
  const below=remaining<cfg.min;
  const emergency=measure.value<28 || measure.distressed>=remaining*.60&&s.reserve<unit*.22 || s.labour<18&&s.popularity<24;
  s.lossYears=losses?s.lossYears+1:0;
  s.warnings=emergency||below?s.warnings+1:Math.max(0,s.warnings-1);
  if (s.warnings && (below||s.warnings>1)) {
    journal(s,'finance','Directors warn of a league-wide solvency crisis',
      `${remaining} active clubs remain. ${measure.distressed} are in financial distress, and the league reserve is ${s.reserve<0?'overdrawn':'under pressure'}.`);
  }
  s.seasons[s.year].health=measure.value;
  s.seasons[s.year].popularity=round(s.popularity);
  s.seasons[s.year].approval=round(s.approval);
  s.seasons[s.year].labour=round(s.labour);
  if (remaining<2 || below && s.warnings>=2 || emergency && s.warnings>=4 && s.lossYears>=3) {
    conclude(s,'collapsed',remaining<cfg.min?'Too few solvent franchises remained to form a viable competition.':'Years of operating losses and institutional stress exhausted the league’s ability to finance a season.');
    return;
  }
  if (Object.keys(s.seasons).length%10===0) {
    const ten=Object.values(s.seasons).slice(-10);
    const names=Object.entries(ten.reduce((map,row)=>{ if (row.champion) map[row.champion]=(map[row.champion]??0)+1; return map; },{})).sort((a,b)=>b[1]-a[1]);
    const top=names[0];
    journal(s,'chronicle','Ten seasons in the books',`${top?byId(s,top[0]).name+' claimed '+top[1]+' titles. ':''}${remaining} clubs remain active after the latest season. The last completed season averaged ${finance.average.toLocaleString('en-US')} at the gate.`);
  }
}

function newSeason(s,next) {
  s.year++;
  s.phase=0;
  s.current=createSeason();
  updateTalent(s,next);
  updateRivals(s,marketCandidates(s,null,true),next);
  if (s.year-s.commissioners.at(-1).start>=23 || s.approval<14 && s.year-s.commissioners.at(-1).start>=4) {
    const prior=s.commissioners.at(-1);
    prior.ended=s.year;
    const actor=s.approval<14?'Replaced by the directors':'Retired after a full term';
    prior.reason=actor;
    const successor=activeTeams(s).sort((a,b)=>b.owner.trust-a.owner.trust)[0]?.owner.name ?? 'Interim board';
    s.commissioners.push({name:successor,start:s.year,ended:null});
    s.approval=clamp(s.approval+14,30,76);
    journal(s,'governance',`${successor} takes office`,`${prior.name} leaves the league office. ${actor}.`);
  }
  s.pending=makeDecision(s,next);
}

function conclude(s,status,reason) {
  s.status=status;
  s.pending=null;
  const {year,month}=dateOf(s);
  const completed=Object.values(s.seasons).filter(row=>!row.partial);
  s.retrospective={reason,calendarYear:year,month,season:s.year,seasons:completed.length,franchises:s.teams.length,
    active:activeTeams(s).length,titles:completed.length,majorDecisions:s.decisions.filter(d=>d.major&&d.enacted).length,
    rivals:s.rivals.length,latest:completed.at(-1)?.year??null,official:s.commissioners.at(-1).name};
  journal(s,status==='collapsed'?'collapse':'chronicle',status==='collapsed'?`${s.name} dissolves`:'The historical record closes',reason);
}

export function shouldReview(s,allowAuto=false) {
  if (!s.pending) return false;
  if (!allowAuto || s.settings.mode==='active') return true;
  return (s.settings.mode==='hybrid'||s.settings.pauseMajor) && s.pending.major;
}

export function advanceMonth(s,{allowAuto=s.settings.mode!=='active'}={}) {
  if (s.status!=='running'||shouldReview(s,allowAuto)) return false;
  const next=rng(s);
  if (s.pending) resolveDecision(s,automatedChoice(s,next),next,'Delegated office');
  const cfg=SPORTS[s.sport];
  const date=dateOf(s);
  worldChange(s);
  if (s.phase>=cfg.first && s.phase<cfg.first+cfg.play) {
    if (!s.current.schedule) align(s);
    playMonth(s,next);
  }
  if (s.phase===cfg.close && !s.current.settled) finish(s,next);
  if (s.status!=='running') return true;
  if (date.year===LAST_YEAR && date.month===12) {
    if (!s.current.settled) s.seasons[s.year]=snapshot(s);
    conclude(s,'completed','The historical simulation reached December 2026. Any ongoing winter season is archived through the cutoff.');
    return true;
  }
  if (s.phase<11) {
    s.phase++;
    if (s.current.settled && s.phase===cfg.close+1 && s.warnings && !s.pending&&cfg.close<10) {
      s.pending=makeDecision(s,next,'finance');
    }
  } else newSeason(s,next);
  return true;
}

export function goalReached(s,goal,start) {
  if (s.status!=='running') return true;
  if (goal.type==='month') return s.year!==start.year||s.phase!==start.phase;
  if (goal.type==='event') return s.events.length>start.events;
  if (goal.type==='season') return s.year>=start.goalYear&&(s.current.settled||s.seasons[start.goalYear]?.year===start.goalYear);
  if (goal.type==='end') return false;
  return s.year >= goal.year;
}

export function startGoal(s,goal) {
  return {year:s.year,phase:s.phase,events:s.events.length,goalYear:goal.type==='season'&&s.current.settled?s.year+1:s.year};
}

export function simulate(s,goal={type:'end'},limit=2200) {
  const start=startGoal(s,goal);
  let months=0;
  while (!goalReached(s,goal,start)&&months<limit) {
    if (!advanceMonth(s)) break;
    months++;
  }
  return {months,done:goalReached(s,goal,start),pending:s.pending?.id??null};
}

export function dateText(s,short=false) {
  const {year,month,day}=dateOf(s);
  return `${short?MONTHS[month-1].slice(0,3):MONTHS[month-1]} ${day}, ${year}`;
}

export function currentPhase(s) {
  if (s.status==='collapsed') return 'League dissolved';
  if (s.status==='completed') return 'Archive complete';
  const cfg=SPORTS[s.sport];
  if (s.current.settled) return 'Offseason';
  if (s.phase<cfg.first) return s.year===cfg.start?'Founding season':'Preseason';
  if (s.phase>=cfg.first+cfg.play) return 'Postseason';
  return 'Regular season';
}

export function chronicle(s) {
  const rows=Object.values(s.seasons).filter(row=>row.champion);
  const names=new Map();
  let streak=0;
  let last=null;
  let dynasty={count:0};
  let gameStreak={count:0};
  for (const row of rows) {
    const id=row.champion;
    const entry=names.get(id)??{id,count:0,years:[]};
    entry.count++; entry.years.push(row.year);
    names.set(id,entry);
    streak = id===last ? streak+1 : 1;
    if (streak>dynasty.count) dynasty={id,count:streak,year:row.year};
    last=id;
    for (const line of row.records) if (line.best>gameStreak.count) gameStreak={id:line.id,count:line.best,year:row.year};
  }
  return {titles:[...names.values()].sort((a,b)=>b.count-a.count),dynasty,gameStreak};
}

export function fallbackArticle(event) {
  const year=event.worldYear ?? event.year;
  const edition=year<1900?'The Sporting Gazette':year<1950?'The Sporting Dispatch':year<1980?'The League Chronicle':year<2000?'Sporting Weekly':'The League Wire';
  const titles={founding:'Charter edition',world:era(year),championship:'The title race',decision:'From the directors’ room',rival:'The rival circuits',franchise:'Club notices'};
  return {title:event.title,body:event.text,edition,desk:titles[event.kind]??'League desk'};
}

export function describeFranchise(team) {
  return `${team.name} hold a charter dating to ${team.founded}. ${team.status==='active'?'They currently play in '+cityName(team.market)+'.':team.status==='suspended'?'The charter is held in abeyance.':'The charter closed in '+team.ended+'.'} ${team.titles.length?`Their title seasons are ${team.titles.join(', ')}.`:'The club has yet to record a league title.'}`;
}
