import { CITIES, DIFFICULTIES, LAST_YEAR, MONTHS, SPORTS } from '../engine/data.js';
import { availableStats } from '../engine/competition.js';
import { agenda, FORMATS } from '../engine/politics.js';
import { chronicle, currentPhase, dateText, describeFranchise, fallbackArticle, peopleLeaders, snapshot } from '../engine/simulation.js';
import { activeRivals, activeTeams, byId, cityName, era, health, historicalConditions, inflation, money, seasonLabel } from '../engine/world.js';
import { annotationKey } from './ai.js';
import { asset, badge, blank, btn, checked, clubBadge, clubLink, crest, esc, icon, navlink, num, percent, personLink, safeColor, selected, smallNum, sportIcon, usd } from './ui.js';

export const titleOf={desk:'Commissioner’s desk',standings:'Standings',clubs:'Franchises',map:'League map',finance:'Finances',office:'Commissioner office',timeline:'Timeline',news:'News centre',records:'League encyclopedia',team:'Franchise profile',person:'Biography'};
const groups=[['League',[['desk','grid'],['standings','trophy'],['clubs','shield'],['map','map'],['finance','chart'],['office','gavel']]],['Archives',[['timeline','history'],['news','news'],['records','book']]]];

export function tabbed(tabs,value,action,label) {
  return `<div class="tabs" aria-label="${esc(label)}">${tabs.map(([key,name])=>`<button type="button" data-action="${action}" data-value="${key}" class="${value===key?'is-selected':''}" aria-pressed="${value===key}">${name}</button>`).join('')}</div>`;
}

export function appFrame(s,u,content) {
  const cfg=SPORTS[s.sport];
  const season=seasonLabel(s.sport,s.year);
  return `<div class="layout">
    <aside class="rail ${u.navOpen?'is-open':''}" id="navigation">
      <button type="button" class="brand" data-action="nav" data-view="desk" aria-label="Sports League Commissioner home">
        ${crest()}<span><span class="wordmark">The Commissioner</span><span class="brand-type">SPORTS LEAGUE SIMULATOR</span></span>
      </button>
      <nav class="rail-nav" aria-label="Main navigation">
        ${groups.map(([head,items])=>`<div class="rail-group"><p>${head}</p>${items.map(([view,glyph])=>{
          const on=u.view===view||u.view==='team'&&view==='clubs'||u.view==='person'&&view==='records';
          const label=view==='desk'?'Overview':titleOf[view];
          return `<button type="button" class="rail-item ${on?'current':''}" ${on?'aria-current="page"':''} data-action="nav" data-view="${view}">${icon(glyph,17)}<span>${label}</span>${view==='office'&&s.pending?'<i class="rail-alert" title="Proposal on the agenda"></i>':''}</button>`;
        }).join('')}</div>`).join('')}
        <div class="rail-group rail-tools"><p>Game</p>
          <button type="button" class="rail-item" data-action="saves">${icon('save',17)}<span>Save &amp; load</span></button>
          <button type="button" class="rail-item" data-action="settings">${icon('settings',17)}<span>Settings</span></button>
        </div>
      </nav>
      <div class="rail-bottom"><div class="rail-sport">${sportIcon(s.sport,19)}<div><span>${esc(cfg.label)}</span><small>EST. ${cfg.start} · ${esc(s.tag)}</small></div></div><button type="button" class="rail-add" data-action="new" title="New league" aria-label="New league">${icon('plus',17)}</button></div>
    </aside>
    ${u.navOpen?'<button type="button" class="nav-scrim" data-action="toggle-nav" aria-label="Close navigation"></button>':''}
    <main class="main-layout" id="main" tabindex="-1">
      <header class="topbar">
        <div class="top-context"><button type="button" class="icon-button menu-button" data-action="toggle-nav" aria-expanded="${u.navOpen}" aria-controls="navigation" aria-label="Navigation">${icon('menu')}</button>
        <button type="button" class="top-sport" data-action="new">${sportIcon(s.sport,17)} <span>${esc(cfg.label)}</span> ${icon('down',12)}</button>
        <i></i><span class="top-league">${esc(s.name)}</span></div>
        <div class="top-actions"><span class="top-date">${icon('calendar',16)} ${esc(dateText(s,true))}</span>
          <button class="icon-button saved ${u.lastSave?'is-saved':''}" type="button" data-action="saves" aria-label="Save and load" title="${u.lastSave?'Autosaved':'Save and load'}">${icon(u.lastSave?'check':'save',17)}</button>
          ${btn('New league','new',{style:'gold top-new',glyph:'plus'})}</div>
      </header>
      <div class="content-wrap">
        <div class="page-title"><div><p class="kicker">${u.view==='desk'?'League headquarters':u.view==='team'||u.view==='person'?'League register':groups[1][1].some(([key])=>u.view===key)?'Historical archive':`Season ${esc(season)}`}</p><h1>${titleOf[u.view]??titleOf.desk}</h1></div>
        <div class="page-aside">${badge(currentPhase(s),s.status==='collapsed'?'danger':'status')}${u.view==='desk'?'<span class="phase-note">Season '+esc(season)+'</span>':''}</div></div>
        ${s.status==='collapsed'&&u.view!=='desk'&&u.view!=='records'?`<div class="warning-banner">${icon('alert',19)} <span>The league has dissolved. Its records remain available.</span>${navlink('View retrospective','records')}</div>`:''}
        ${content}
      </div>
      <footer class="footer">Sports League Commissioner <span>·</span> ${esc(s.seed)} <span>·</span> <button type="button" data-action="sources">Historical sources</button></footer>
    </main>
  </div>`;
}

const heading = (title,detail='',right='')=>`<div class="panel-heading"><div><h2>${title}</h2>${detail?`<p>${detail}</p>`:''}</div>${right}</div>`;
const yearSelect = (s,u,action='year')=>`<label class="select-label"><span>Season</span><select data-change="${action}" aria-label="Season">${Array.from({length:s.year-SPORTS[s.sport].start+1},(_,i)=>s.year-i).map(year=>`<option value="${year}"${selected(u.year,year)}>${seasonLabel(s.sport,year)}${year===s.year?' · current record':''}</option>`).join('')}</select></label>`;

const rating=(value)=>value>=70?'Strong':value>=45?'Stable':value>=28?'Under pressure':'Critical';
const stepAttr=target=>`data-target="${target}"`;
const winPct=r=>r.g?((r.w+r.t*.5)/r.g).toFixed(3).replace(/^0/,''):'—';
const clubFor=(s,row,id)=>row?.members?.find(m=>m.id===id)??byId(s,id);
const seasonFor=(s,year)=>s.seasons[year]??(year===s.year?snapshot(s):null);
const formatOf=(row)=>FORMATS[row.rules.format];

function statusCard({label,value,detail,glyph,tone=''}) {
  return `<div class="metric ${tone}"><div class="metric-head"><span class="metric-icon">${icon(glyph,17)}</span><span>${label}</span></div><div class="metric-body"><strong>${value}</strong><small>${detail}</small></div></div>`;
}

function dashboardStats(s) {
  const measure=health(s);
  const membership=activeTeams(s);
  return `<div class="metric-grid">${[
    {label:'Active franchises',value:num(membership.length),detail:`${new Set(membership.map(team=>team.market)).size} markets`,glyph:'shield'},
    {label:'Financial health',value:percent(measure.value),detail:rating(measure.value),glyph:'wallet',tone:measure.value<42?'poor':'good'},
    {label:'Public interest',value:percent(s.popularity),detail:'League popularity',glyph:'activity'},
    {label:'Commissioner approval',value:percent(s.approval),detail:'Owner confidence',glyph:'people'}
  ].map(statusCard).join('')}</div>`;
}

function controls(s,u) {
  const choices=[['month','One month'],['event','Next event'],['season','Finish season'],['year','One year'],['5','Five years'],['10','Ten years'],['end','Through 2026'],['target','Choose a year…']];
  const modes=[['active','Active commissioner'],['hybrid','Hybrid commissioner'],['observer','Hands-off observer']];
  const running=Boolean(u.run);
  return `<section class="panel sim-panel" aria-label="Simulation controls">
    ${heading('Simulation','',`<span class="sim-status ${running?'is-running':''}"><i></i>${running?'Running':s.status==='running'?'Paused':'Ended'}</span>`)}
    <label class="mode-control"><span>Control mode</span><select data-change="mode" aria-label="Control mode" ${running?'disabled':''}>${modes.map(([key,label])=>`<option value="${key}"${selected(s.settings.mode,key)}>${label}</option>`).join('')}</select></label>
    ${running?`<div class="run-status"><progress max="100" value="${u.run.progress}" aria-label="Simulation progress"></progress><span>${esc(u.run.label)} · ${s.year}</span></div>`:
      u.resume?`<div class="run-status"><span>Run paused at ${esc(dateText(s,true))}</span><div class="resume-buttons">${btn('Resume','resume',{style:'light compact',glyph:'play'})}${btn('Clear','clear-run',{style:'ghost compact'})}</div></div>`:
      `<div class="duration-control"><label class="sr-only" for="duration">Advance by</label><select id="duration" data-change="step" aria-label="Advance by">${choices.map(([key,label])=>`<option value="${key}"${selected(u.step,key)}>${label}</option>`).join('')}</select>${btn('Advance','advance',{style:'dark',glyph:'play',disabled:s.status!=='running'})}</div>`}
    <div class="sim-actions">${running?btn('Pause','pause',{style:'light',glyph:'pause'})+btn('Cancel','cancel',{style:'ghost'}):btn('Simulate 5 years','advance',{style:'ghost compact',glyph:'skip',attr:stepAttr('5'),disabled:s.status!=='running'})}
      <label class="check-row"><input type="checkbox" data-change="pauseMajor"${checked(s.settings.pauseMajor)} ${running||s.settings.mode==='hybrid'?'disabled':''}> Pause for major decisions</label></div>
    </section>`;
}

function pendingCard(s) {
  const p=s.pending;
  if (!p) return `<section class="panel docket"><div class="docket-top">${icon('check',17)} <span>Agenda</span></div><h3>${s.status==='running'?'Agenda clear':'Session closed'}</h3><p>${s.status==='running'?'Advance the simulation to receive the next briefing.':'Review the league’s decisions in the archive.'}</p>${navlink(s.status==='running'?'Open commissioner office':'Browse the timeline',s.status==='running'?'office':'timeline')}</section>`;
  return `<section class="panel docket"><div class="docket-top">${icon('gavel',17)} <span>${p.major?'Decision required':'On the agenda'}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.kind==='governance'&&!s.decisions.length?'The owners are waiting for a decision on the league’s governing agreement.':p.text)}</p>${btn('Review proposal','nav',{style:'light docket-button',attr:'data-view="office"',glyph:'right'})}</section>`;
}

function hero(s) {
  const cfg=SPORTS[s.sport],start=s.year===cfg.start;
  const date=seasonLabel(s.sport,s.year);
  const description=start?cfg.description:`${activeTeams(s).length} active clubs compete under ${formatName(s.rules.format)}. ${historicalConditions(s).media} shapes how supporters follow the league.`;
  return `<section class="hero ${s.sport}" style="--hero:url('${asset(s.sport+'.webp')}')" aria-label="${esc(s.name)}">
    <div class="hero-content"><p class="hero-kicker"><span></span>${esc(era(s.year))} <i>·</i> ${esc(cfg.label)}</p><h2>${esc(s.name)}</h2>
      <p class="hero-description">${esc(description)}</p><div class="hero-tags">${badge(start?'Founding season':date+' season','hero-badge')}${badge(historicalConditions(s).technology+' travel','hero-badge')}</div>
    </div><span class="hero-edition">${esc(start?'Charter edition':date+' edition')}</span>
  </section>`;
}
const formatName=format=>format==='pennant'?'a league table':format==='ratification'?'directors’ ratification':'a '+FORMATS[format].toLowerCase();
const mapBlock=(mapId='office-map')=>`<div class="map-area" id="${mapId}"><canvas aria-label="North America with franchise locations"></canvas><div class="map-pins"></div></div>`;

function miniStandings(s,row,limit) {
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th scope="col">#</th><th scope="col">Franchise</th><th scope="col">W</th><th scope="col">L</th>${s.rules.ties?'<th scope="col">T</th>':''}<th scope="col">PCT</th></tr></thead><tbody>
    ${row.records.slice(0,limit).map((r,i)=>`<tr><td class="rank">${i+1}</td><th scope="row">${clubLink(clubFor(s,row,r.id))}</th><td>${r.w}</td><td>${r.l}</td>${s.rules.ties?`<td>${r.t}</td>`:''}<td>${winPct(r)}</td></tr>`).join('')}
  </tbody></table></div>`;
}

function journalList(s,events,{limit=8,list=true}={}) {
  const icons={world:'map',championship:'trophy',franchise:'shield',finance:'wallet',decision:'gavel',rival:'activity',people:'people',labour:'people',collapse:'alert',founding:'award'};
  return events.length?`<div class="${list?'journal-list':'story-grid'}">${events.slice(0,limit).map(e=>{
    const article=fallbackArticle(e);
    const offset=SPORTS[s.sport].month-1+e.phase;
    const label=`${MONTHS[offset%12].slice(0,3)} ${e.worldYear??e.year+Math.floor(offset/12)}`;
    return `<button type="button" class="journal-row" data-action="article" data-id="${esc(e.id)}"><span class="journal-icon">${icon(icons[e.kind]??'news',17)}</span><span class="journal-copy"><small>${esc(article.desk)} <i>·</i> ${esc(label)}</small><strong>${esc(e.title)}</strong>${list?'':`<span>${esc(e.text)}</span>`}</span>${icon('chevron',15)}</button>`;
  }).join('')}</div>`:blank('No entries for this selection','Choose another year or category.');
}

function retrospective(s) {
  const r=s.retrospective;
  if (!r) return '';
  const legacy=chronicle(s);
  const leader=legacy.titles[0];
  const most=leader?byId(s,leader.id):null;
  const rival=activeRivals(s).sort((a,b)=>b.reputation-a.reputation)[0];
  return `<section class="panel retrospective"><div class="eyebrow">${icon(s.status==='collapsed'?'alert':'award',17)} Historical retrospective</div>
    <h2>${s.status==='collapsed'?esc(s.name)+' dissolves':'A league through the decades'}</h2><p>${esc(r.reason)}</p>
    <div class="retrospective-grid"><span><strong>${SPORTS[s.sport].start}–${r.calendarYear}</strong><small>Years in operation</small></span><span><strong>${r.seasons}</strong><small>Completed seasons</small></span><span><strong>${r.franchises}</strong><small>Franchises chartered</small></span><span><strong>${r.majorDecisions}</strong><small>Major decisions enacted</small></span></div>
    ${most?`<p>${clubLink(most,{withBadge:false})} won ${leader.count} championships, the most in the league’s history.</p>`:''}
    ${s.status==='collapsed'&&rival?`<p>The ${esc(rival.name)} continued operating in ${rival.markets.map(id=>esc(cityName(id))).join(', ')} when the original league closed.</p>`:''}
    <div class="link-row">${navlink('Championship register','records')}${navlink('Historical timeline','timeline')}</div>
  </section>`;
}

export function desk(s,u) {
  const row=seasonFor(s,s.year);
  return `${s.warnings&&s.status==='running'?`<div class="warning-banner">${icon('alert',19)} <span>League finances need attention. ${health(s).distressed} active franchises are in distress.</span> ${navlink('Review the books','finance')}</div>`:''}
  ${retrospective(s)}
  <div class="hero-grid">${hero(s)}<div class="desk-side">${controls(s,u)}${pendingCard(s)}</div></div>
  ${dashboardStats(s)}
  <div class="overview-grid">
    <section class="panel">${heading('League standings',row.matches.length?esc(seasonLabel(s.sport,s.year))+' season':'Opening table',navlink('Full table','standings'))}${miniStandings(s,row,5)}</section>
    <section class="panel map-card">${heading('Franchise footprint',`${activeTeams(s).length} clubs · ${new Set(activeTeams(s).map(t=>t.market)).size} markets`,navlink('Explore map','map'))}${mapBlock()}<div class="map-caption"><i></i> Active franchises <span>${s.year}</span></div></section>
  </div>
  <div class="overview-grid bottom-grid">
    <section class="panel">${heading('League wire','Recent entries',navlink('News centre','news'))}${journalList(s,s.events.slice().reverse(),{limit:4})}</section>
    <section class="panel context-card">${heading('The world around the league',esc(era(s.year)))}<dl><div><dt>${icon('map',15)} Travel</dt><dd>${esc(historicalConditions(s).technology)}</dd></div><div><dt>${icon('news',15)} Media</dt><dd>${esc(historicalConditions(s).media)}</dd></div><div><dt>${icon('gavel',15)} Commissioner</dt><dd>${esc(s.commissioners.at(-1).name)}</dd></div><div><dt>${icon('activity',15)} Rival circuits</dt><dd>${activeRivals(s).length}</dd></div></dl></section>
  </div>`;
}

function tableStandings(s,row) {
  const hockey=s.sport==='hockey';
  const unit=s.sport==='baseball'?'Runs':hockey?'Goals':'Points';
  return `<div class="table-scroll"><table class="data-table big-table"><thead><tr><th scope="col">#</th><th scope="col">Franchise</th><th scope="col">GP</th><th scope="col">W</th><th scope="col">L</th>${row.rules.ties?'<th scope="col">T</th>':''}${hockey?'<th scope="col">PTS</th>':''}<th scope="col">PCT</th><th scope="col">${unit} for</th><th scope="col">Against</th><th scope="col">Avg. gate</th></tr></thead>
  <tbody>${row.records.map((r,i)=>`<tr><td class="rank">${i+1}</td><th scope="row">${clubLink(clubFor(s,row,r.id))}${r.division?`<small class="division-name">${esc(r.division)}</small>`:''}</th><td>${r.g}</td><td>${r.w}</td><td>${r.l}</td>${row.rules.ties?`<td>${r.t}</td>`:''}${hockey?`<td>${r.w*2+r.t}</td>`:''}<td>${winPct(r)}</td><td>${num(r.for)}</td><td>${num(r.against)}</td><td>${r.home?num(r.attendance/r.home):'—'}</td></tr>`).join('')}</tbody></table></div>`;
}

function bracket(s,row) {
  if (!row.bracket.length) return blank(row.champion?'Title decided in the regular season':'No postseason results',row.champion?'See the season table and official champion.':'A postseason draw appears when the rules call for it and fixtures are complete.');
  return `<div class="series-grid">${row.bracket.map(p=>`<article class="series"><span class="eyebrow">${esc(p.round)}${p.aggregate?' · aggregate goals':''}</span>
    ${[p.a,p.b].map((id,index)=>`<div class="${id===p.winner?'series-winner':''}">${clubLink(clubFor(s,row,id),{withBadge:false})}<strong>${p.tally[index]}</strong></div>`).join('')}</article>`).join('')}</div>`;
}

function matches(s,u,row) {
  const all=[...row.matches,...row.bracket.flatMap(series=>series.matches)];
  const pool=u.matchTeam?all.filter(x=>x[0]===u.matchTeam||x[1]===u.matchTeam):all;
  const page=Math.min(Math.max(0,Math.ceil(pool.length/45)-1),u.page);
  const towns=row.members.map(m=>`<option value="${esc(m.id)}"${selected(u.matchTeam,m.id)}>${esc(m.name)}</option>`).join('');
  return `<div class="panel-tools"><label class="select-label"><span>Franchise</span><select data-change="matchTeam"><option value="">All franchises</option>${towns}</select></label><span>${num(pool.length)} fixtures</span></div>
    ${pool.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Month</th><th>Home</th><th>Score</th><th>Away</th><th>Gate</th></tr></thead><tbody>
    ${pool.slice(page*45,(page+1)*45).map(match=>`<tr><td>${MONTHS[(SPORTS[s.sport].month-1+match[5])%12].slice(0,3)}</td><td>${clubLink(clubFor(s,row,match[0]))}</td><td class="score">${match[2]}–${match[3]}</td><td>${clubLink(clubFor(s,row,match[1]))}</td><td>${num(match[4])}</td></tr>`).join('')}
    </tbody></table></div><div class="pagination">${btn('Previous','pagination',{style:'light compact',attr:'data-value="'+(page-1)+'"',disabled:!page})}<span>Page ${page+1} of ${Math.ceil(pool.length/45)}</span>${btn('Next','pagination',{style:'light compact',attr:'data-value="'+(page+1)+'"',disabled:(page+1)*45>=pool.length})}</div>`:blank('No fixtures played','Advance the simulation to the regular season.')}`;
}

function leaders(s,row) {
  const rows=row.leaders.length?row.leaders:peopleLeaders(s,row.year);
  if (!rows.length) return blank('The statistical register is empty','Player totals appear when fixtures have been played.');
  const label=availableStats(s.sport,row.year).find(([key])=>key===rows[0].key)?.[1]??'Total';
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Player</th><th>Position</th><th>Franchise</th><th>GP</th><th>${esc(label)}</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${personLink(r)}</th><td>${esc(r.position)}</td><td>${clubLink(clubFor(s,row,r.team),{withBadge:false})}</td><td>${r.games}</td><td>${num(r.sum)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function standingsView(s,u) {
  const row=seasonFor(s,u.year);
  return `<section class="panel">
  ${heading(`${esc(seasonLabel(s.sport,u.year))} competition`,formatOf(row),yearSelect(s,u))}
  ${row.champion?`<div class="champion-strip">${icon('trophy',18)} <span>League champion</span>${clubLink(clubFor(s,row,row.champion))}</div>`:''}
  ${tabbed([['table','League table'],['playoffs','Postseason'],['fixtures','Fixtures'],['leaders','Stat leaders']],u.standTab,'stand-tab','Competition records')}
  ${u.standTab==='playoffs'?bracket(s,row):u.standTab==='fixtures'?matches(s,u,row):u.standTab==='leaders'?leaders(s,row):tableStandings(s,row)}
  </section>`;
}

export function mapView(s,u) {
  const row=seasonFor(s,u.year);
  return `<section class="panel map-card map-expanded">${heading(`${esc(seasonLabel(s.sport,u.year))} franchise geography`,'Select a marker to open a franchise’s lineage.',yearSelect(s,u))}
    <div class="panel-tools">${tabbed([['regional','Fit franchises'],['continental','North America']],u.mapType,'map-type','Map extent')}<span>${row.members.length} active franchises</span></div>
    ${mapBlock('full-map')}<div class="map-slider"><input type="range" min="${SPORTS[s.sport].start}" max="${s.year}" value="${u.year}" data-change="year" aria-label="Map year"><span>${u.year}</span></div>
    <div class="map-clubs">${row.members.map(t=>clubLink(t)).join('')}</div>
  </section>`;
}

export function clubsView(s,u) {
  const query=u.clubSearch.trim().toLowerCase();
  const searchBar=`<form data-form="clubs" class="search-form"><label class="sr-only" for="club-search">Search franchises</label>${icon('search',17)}<input id="club-search" name="query" value="${esc(u.clubSearch)}" placeholder="Search franchises"><button type="submit">Search</button></form>`;
  const tabs=tabbed([['active','Active'],['former','Defunct & dormant'],['all','All franchises'],['rivals','Rival leagues']],u.clubTab,'club-tab','Franchise directory');
  if (u.clubTab==='rivals') return `<section class="panel">${heading('Rival circuits',`${activeRivals(s).length} operating`)}${tabs}
    ${s.rivals.length?`<div class="rival-list">${[...s.rivals].reverse().map(r=>`<article class="rival-card"><div class="eyebrow">${r.founded}${r.ended?'–'+r.ended:''} · ${esc(r.status)}</div><h3>${esc(r.name)}</h3><p>${esc(r.strategy)} · ${esc(r.rules)}</p><p>President ${personLink(s.people[r.leader])}</p><div class="rival-metrics"><span>Reputation <strong>${num(r.reputation)}</strong></span><span>Media <strong>${usd(money(r.media,s.year))}</strong></span></div>
    <div class="tag-list">${r.clubs.map(c=>c.admitted?clubLink(byId(s,c.admitted),{withBadge:false}):badge(c.name)).join('')}</div>
    <details><summary>Season records</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>Year</th><th>Champion</th><th>Clubs</th></tr></thead><tbody>${[...r.history].reverse().map(row=>`<tr><td>${row.year}</td><td>${esc(row.champion)}</td><td>${row.clubs}</td></tr>`).join('')}</tbody></table></div></details></article>`).join('')}</div>`:blank('No rival circuits recorded','Independent competitions may emerge as markets and investors develop.')}</section>`;
  const teams=s.teams.filter(t=>(u.clubTab==='all'||(u.clubTab==='active'?t.status==='active':t.status!=='active'))&&(!query||[t.name,cityName(t.market),...t.lineage.flatMap(x=>[x.name,cityName(x.market)])].some(value=>value.toLowerCase().includes(query))));
  return `<section class="panel">${heading('Franchise directory',`${s.teams.length} charters issued since ${SPORTS[s.sport].start}`,searchBar)}${tabs}
    ${teams.length?`<div class="club-grid">${teams.map(team=>`<button type="button" class="club-card" data-action="team" data-id="${team.id}" style="--club:${safeColor(team.color)}"><span class="club-card-top">${clubBadge(team)}${badge(team.status,team.status==='active'?'status':'')}</span><strong>${esc(team.name)}</strong><span>${esc(cityName(team.market))} · Est. ${team.founded}</span><span>${icon('trophy',14)} ${team.titles.length} title${team.titles.length===1?'':'s'}</span></button>`).join('')}</div>`:blank('No matching franchises','Try a different name or directory tab.')}</section>`;
}

function annotations(s,ctx,u) {
  const entry=s.annotations[annotationKey(ctx)];
  const tag=entry?`<div class="generated"><span class="eyebrow">${icon('spark',15)} Generated commentary · ${esc(entry.model)}</span><h3>${esc(entry.title)}</h3><p>${esc(entry.body)}</p></div>`:'';
  return `${tag}${u.ai.enabled?btn(entry?'Regenerate commentary':'Generate commentary','generate',{style:'light compact',glyph:'spark',attr:`data-kind="${ctx.kind}" data-id="${esc(ctx.id??'')}" data-year="${ctx.year??''}" data-span="${ctx.span??1}"`,disabled:u.aiBusy}):''}`;
}

export function teamView(s,u) {
  const t=byId(s,u.entity);
  if (!t) return blank('Franchise unavailable','Return to the franchise directory.');
  const ledger=Object.entries(t.ledger).reverse();
  const rivals=Object.entries(t.rivalries).filter(([,weight])=>weight>=4).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const ref=s.teams.find(x=>x.id===t.mergedInto);
  const profiles=t.roster.length?t.roster.map(id=>s.people[id]):Object.values(s.people).filter(p=>p.role==='Athlete'&&p.career.some(r=>r.team===t.id)).sort((a,b)=>b.honours.length-a.honours.length).slice(0,10);
  return `<div class="back-row">${btn('Franchise directory','nav',{style:'ghost',glyph:'left',attr:'data-view="clubs"'})}</div>
    <section class="panel team-header" style="--club:${safeColor(t.color)}"><div>${clubBadge(t)}<div class="eyebrow">Charter ${esc(t.code)} · Established ${t.founded}</div><h2>${esc(t.name)}</h2><p>${esc(describeFranchise(t))}</p>${ref?`<p>Successor charter ${clubLink(ref,{withBadge:false})}</p>`:''}</div>
    <dl><div><dt>Status</dt><dd>${esc(t.status)}</dd></div><div><dt>Home market</dt><dd>${esc(cityName(t.market))}</dd></div><div><dt>Venue</dt><dd>${esc(t.venue)} · ${num(t.capacity)}</dd></div><div><dt>Owner</dt><dd>${personLink({id:t.owner.id,name:t.owner.name})} · ${esc(t.owner.priority)}</dd></div><div><dt>${s.sport==='baseball'?'Manager':'Coach'}</dt><dd>${personLink(t.coach)}</dd></div></dl></section>
    <div class="overview-grid spaced"><section class="panel">${heading('Franchise lineage','Names, owners and home grounds by year')}
    <div class="lineage">${[...t.lineage].reverse().map(row=>`<div><time>${row.year}</time><span><strong>${esc(row.name)}</strong><small>${esc(cityName(row.market))} · ${esc(row.venue)} · ${esc(row.owner)}</small><em>${esc(row.reason)}</em></span></div>`).join('')}</div></section>
    <section class="panel">${heading(t.roster.length?'Featured roster':'Notable alumni',`${t.titles.length} league titles`)}<div class="people-list">${profiles.map(p=>`<div>${personLink(p)}<span>${esc(p.pos)} · ${p.retired?'Retired':s.year-p.birth+' years'}${p.contract?' · through '+p.contract.end:''}</span></div>`).join('')||'<p class="muted">No player records.</p>'}</div></section></div>
    <div class="overview-grid spaced"><section class="panel">${heading('Club accounts','Figures in historical dollars')}${ledger.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Season</th><th>Revenue</th><th>Margin</th><th>Debt</th><th>Valuation</th></tr></thead><tbody>${ledger.map(([yr,r])=>`<tr><td>${yr}</td><td>${usd(r.revenue)}</td><td class="${r.margin<0?'negative':''}">${usd(r.margin)}</td><td>${usd(r.debt)}</td><td>${usd(r.valuation)}</td></tr>`).join('')}</tbody></table></div>`:blank('No accounts filed','Financial history appears after the first completed season.')}</section>
    <section class="panel padded">${heading('Titles and rivalries')}${t.titles.length?`<div class="tag-list">${t.titles.map(yr=>`<button type="button" class="badge" data-action="historical-standings" data-year="${yr}">${seasonLabel(s.sport,yr)}</button>`).join('')}</div>`:'<p class="muted">No league titles recorded.</p>'}${rivals.length?`<div class="people-list">${rivals.map(([id,n])=>`<div>${clubLink(byId(s,id))}<span>${n} rivalry points</span></div>`).join('')}</div>`:''}
    ${annotations(s,{kind:'team',id:t.id,year:s.year},u)}</section></div>`;
}

function statRate(s,line) {
  if (s.sport==='baseball') return [line.atBats?((line.hits??0)/line.atBats).toFixed(3):'—',line.outs?((line.earned??0)*27/line.outs).toFixed(2):'—'];
  if (s.sport==='basketball') return [line.attempts?percent((line.made??0)/line.attempts*100):'—'];
  if (s.sport==='hockey') return [line.shots?((line.saves??0)/line.shots).toFixed(3):'—'];
  return [];
}

export function personView(s,u) {
  const p=s.people[u.entity];
  if (!p) return blank('Biography unavailable','Return to the league encyclopedia.');
  const seasons=Object.keys(p.stats??{}).map(Number).sort((a,b)=>b-a);
  const fields=availableStats(s.sport,s.year);
  const rates=s.sport==='baseball'?['AVG','ERA']:s.sport==='basketball'?['FG%']:s.sport==='hockey'&&s.year>=1955?['SV%']:[];
  return `<div class="back-row">${btn('League encyclopedia','nav',{style:'ghost',glyph:'left',attr:'data-view="records"'})}</div><section class="panel team-header"><div>
    <div class="eyebrow">${esc(p.role)}${p.pos?' · '+esc(p.pos):''}</div><h2>${esc(p.name)}</h2><p>Born ${p.birth} · ${esc(p.place)}${p.retired?' · Retired '+p.retired:''}</p>
    ${p.contract?`<p>Contract through ${p.contract.end} · ${usd(money(p.contract.salary,s.year))} annual salary</p>`:''}</div>
    <dl>${p.role==='Athlete'?`<div><dt>Debut</dt><dd>${p.debut}</dd></div><div><dt>Recorded seasons</dt><dd>${seasons.length}</dd></div><div><dt>Titles</dt><dd>${p.honours.filter(h=>h.type==='Champion').length}</dd></div>`:''}<div><dt>Club</dt><dd>${clubLink(byId(s,p.team),{withBadge:false})}</dd></div></dl></section>
    <section class="panel spaced">${heading('Career statistics',esc(SPORTS[s.sport].label))}
    ${seasons.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Season</th><th>Club</th><th>GP</th>${fields.map(([,label])=>`<th>${esc(label)}</th>`).join('')}${rates.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>
    ${seasons.flatMap(year=>Object.entries(p.stats[year]).map(([id,line])=>`<tr><td>${seasonLabel(s.sport,year)}</td><td>${clubLink(clubFor(s,s.seasons[year],id),{withBadge:false})}</td><td>${line.games}</td>${fields.map(([key])=>`<td>${availableStats(s.sport,year).some(([f])=>f===key)?num(line[key]??0):'—'}</td>`).join('')}${statRate(s,line).slice(0,rates.length).map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`)).join('')}
    </tbody></table></div>`:blank('No recorded playing statistics','This person has no completed league fixtures in the archive.')}</section>
    <div class="overview-grid spaced"><section class="panel">${heading('Career appointments')}<div class="lineage">${[...p.career].reverse().map(row=>`<div><time>${row.year}</time><span><strong>${esc(row.role)}</strong><small>${clubLink(byId(s,row.team),{withBadge:false})} ${esc(row.note??'')}</small></span></div>`).join('')||'<p class="muted">No club appointments.</p>'}</div></section>
    <section class="panel padded">${heading('Honours')}${p.honours?.length?`<div class="tag-list">${p.honours.map(x=>badge(x.year+' · '+x.type)).join('')}</div>`:'<p class="muted">No honours recorded.</p>'}${annotations(s,{kind:'person',id:p.id,year:s.year},u)}</section></div>`;
}

export function financialSeries(s) {
  return Object.values(s.seasons).filter(row=>row.finance).map(row=>{
    const f=row.finance,adj=s.settings.inflation;
    return {year:row.year,revenue:adj?f.realRevenue:f.revenue,expense:adj?f.realExpense:f.expense,margin:adj?f.realMargin:f.margin,
      debt:adj?f.debt/inflation(row.year):f.debt,media:adj?f.media/inflation(row.year):f.media,average:f.average,cash:adj?f.cash/inflation(row.year):f.cash};
  });
}

export function financeView(s,u) {
  const series=financialSeries(s);
  const last=series.at(-1);
  const measure=health(s);
  const year=last?.year;
  const teams=s.teams.filter(t=>t.ledger[year]).sort((a,b)=>b.ledger[year].revenue-a.ledger[year].revenue);
  return `<div class="metric-grid">${[
    {label:'Financial health',value:percent(measure.value),detail:rating(measure.value),glyph:'activity'},
    {label:'League reserve',value:usd(s.settings.inflation?s.reserve:money(s.reserve,s.year)),detail:'Available central funds',glyph:'wallet'},
    {label:'Debt exposure',value:usd(s.settings.inflation?measure.debt:money(measure.debt,s.year)),detail:`${measure.distressed} distressed clubs`,glyph:'alert'},
    {label:'Last average gate',value:last?num(last.average):'—',detail:year?`${year} season`:'No completed season',glyph:'people'}
  ].map(statusCard).join('')}</div>
  <section class="panel finance-chart">${heading('League accounts',s.settings.inflation?'Inflation-adjusted 2026 dollars':'Historical nominal dollars',`<label class="check-row"><input type="checkbox" data-change="inflation"${checked(s.settings.inflation)}> 2026 dollars</label>`)}
  ${tabbed([['income','Revenue and expenses'],['attendance','Attendance']],u.financeMetric,'finance-metric','Financial series')}
  ${last?`<div class="chart-zone"><canvas id="finance-chart" aria-label="Historical league financial series"></canvas><span class="chart-detail">${u.financeMetric==='attendance'?num(last.average)+' per game':usd(last.revenue)+' revenue · '+usd(last.expense)+' expenses'}</span></div>
    ${u.financeMetric==='income'?'<div class="legend"><span><i></i> Revenue</span><span><i></i> Expenses</span></div>':''}`:blank('Accounts open after the first season','Published statements include gates, travel, salaries, media rights and debt.')}</section>
  ${teams.length?`<section class="panel spaced">${heading('Club statements',`Season ${year}`)}<div class="table-scroll"><table class="data-table"><thead><tr><th>Franchise</th><th>Gate revenue</th><th>Media</th><th>Payroll</th><th>Travel</th><th>Operating margin</th><th>Debt</th></tr></thead><tbody>
    ${teams.map(t=>{const f=t.ledger[year];const ratio=s.settings.inflation?1/inflation(year):1;
       return `<tr><th scope="row">${clubLink(clubFor(s,s.seasons[year],t.id))}</th><td>${usd(f.ticket*ratio)}</td><td>${usd(f.media*ratio)}</td><td>${usd(f.payroll*ratio)}</td><td>${usd(f.travel*ratio)}</td><td class="${f.margin<0?'negative':''}">${usd(f.margin*ratio)}</td><td>${usd(f.debt*ratio)}</td></tr>`;}).join('')}
  </tbody></table></div></section>`:''}
  ${series.length?`<section class="panel spaced">${heading('Annual statements','League totals')}<div class="table-scroll"><table class="data-table"><thead><tr><th>Year</th><th>Revenue</th><th>Expenses</th><th>Margin</th><th>Media</th><th>Average gate</th></tr></thead><tbody>${[...series].reverse().map(row=>`<tr><td>${row.year}</td><td>${usd(row.revenue)}</td><td>${usd(row.expense)}</td><td class="${row.margin<0?'negative':''}">${usd(row.margin)}</td><td>${usd(row.media)}</td><td>${num(row.average)}</td></tr>`).join('')}</tbody></table></div></section>`:''}`;
}

function decisionsTable(s,rows,limit=12) {
  return rows.length?`<div class="table-scroll"><table class="data-table decision-table"><thead><tr><th>Year</th><th>Decision</th><th>Proposal selected</th><th>Result</th></tr></thead>
    <tbody>${rows.slice(0,limit).map(row=>`<tr><td>${row.year}</td><th scope="row"><button class="inline-link" type="button" data-action="decision-detail" data-id="${esc(row.id)}">${esc(row.title)}</button></th><td>${esc(row.choice)}</td><td>${badge(row.enacted?'Enacted':row.voting?.passed===false?'Voted down':'Lapsed',row.enacted?'status':'danger')}</td></tr>`).join('')}</tbody></table></div>`:blank('No votes recorded','Decisions and owner votes will be filed here.');
}

const rulesList=(rules)=>`<dl class="rules-list"><div><dt>Competition</dt><dd>${FORMATS[rules.format]}</dd></div><div><dt>Target schedule</dt><dd>${rules.games} games per club</dd></div><div><dt>Alignment</dt><dd>${rules.alignment==='regional'?'East / West divisions':'Single table'}</dd></div><div><dt>Shared receipts</dt><dd>${percent(rules.sharing*100)}</dd></div><div><dt>Owner vote floor</dt><dd>${percent(rules.threshold*100)}</dd></div><div><dt>Central authority</dt><dd>${percent(rules.authority*100)}</dd></div><div><dt>Player contracts</dt><dd>${esc(rules.contracts)}</dd></div><div><dt>Entry draft</dt><dd>${rules.draft?'In force':'Open recruitment'}</dd></div></dl>`;

export function office(s,u) {
  const p=s.pending;
  const options=agenda(s);
  return `<div class="office-grid">
    <section class="panel proposal-panel">${heading('Proposals',p?'Before the directors':'Commissioner’s agenda',p?badge(p.major?'Major decision':'Routine matter','status'):'')}
    ${p?`<div class="proposal-body"><p class="eyebrow">${esc(p.kind)} · ${p.year}</p><h2>${esc(p.title)}</h2><p>${esc(p.text)}</p>
      ${p.generated?`<div class="generated"><span class="eyebrow">${icon('spark',14)} Generated correspondence</span><h3>${esc(p.generated.title)}</h3><p>${esc(p.generated.body)}</p></div>`:''}
      <div class="choices">${p.choices.map((c,index)=>`<button type="button" data-action="choose" data-index="${index}" class="choice" ${u.run?'disabled':''}><span class="choice-mark">${String.fromCharCode(65+index)}</span><span><strong>${esc(c.label)}</strong><small>${esc(c.detail)}</small></span><span class="choice-tail">${c.vote?badge('Owner vote'):badge('Office decision')}${icon('right',16)}</span></button>`).join('')}</div></div>`:
      (s.status==='running'?`<div class="proposal-body"><h2>${options.length?'Bring an item before the board':'No proposal pending'}</h2>
        ${options.length?`<div class="agenda-grid">${options.map(([key,label])=>btn(label,'agenda',{style:'light',attr:'data-value="'+key+'"',glyph:'plus',disabled:Boolean(u.run)})).join('')}</div>`:'<p>The current fixtures are under way. New structural proposals can be filed after the season closes.</p>'}
        ${options.length&&u.ai.enabled?btn('Generate an owner proposal','generate',{style:'ghost',glyph:'spark',attr:'data-kind="proposal"',disabled:u.aiBusy||Boolean(u.run)}):''}</div>`:
      blank('The office is closed','Past owner votes remain available in the decision register.'))}
    </section>
    <div class="office-side"><section class="panel">${heading('League constitution',esc(s.commissioners.at(-1).name)+' · In office')}${rulesList(s.rules)}</section>${controls(s,u)}</div>
  </div>
  ${u.lastDecision?`<div class="decision-result">${icon(u.lastDecision.enacted?'check':'info',18)}<div><strong>${esc(u.lastDecision.choice)}</strong><p>${esc(u.lastDecision.effect)} ${u.lastDecision.voting?`${u.lastDecision.voting.yes} in favour. ${u.lastDecision.voting.need} needed.`:''}</p></div>${btn('Vote record','decision-detail',{style:'light compact',attr:'data-id="'+u.lastDecision.id+'"'})}</div>`:''}
  <section class="panel spaced">${heading('Decision register',`${s.decisions.length} recorded`,navlink('Earlier years','timeline'))}${decisionsTable(s,[...s.decisions].reverse())}</section>`;
}

export function timeline(s,u) {
  const row=seasonFor(s,u.year);
  const events=s.events.filter(e=>e.year===u.year).reverse();
  const decisions=s.decisions.filter(d=>d.year===u.year).reverse();
  const min=Math.max(SPORTS[s.sport].start,u.year-6);
  const max=Math.min(s.year,u.year+6);
  return `<section class="panel timeline-panel">${heading('Season archive',`From ${SPORTS[s.sport].start} to ${s.year}`,yearSelect(s,u))}
    <div class="timeline-rail">${Array.from({length:max-min+1},(_,i)=>min+i).map(year=>`<button type="button" data-action="select-year" data-year="${year}" aria-pressed="${year===u.year}" class="${year===u.year?'is-selected':''}">${year}</button>`).join('')}</div>
    <div class="timeline-feature"><div><p class="eyebrow">${esc(era(u.year))}</p><h2>${esc(seasonLabel(s.sport,u.year))}</h2><p>${esc(row.name)} · ${row.members.length} active members</p></div><div><span class="eyebrow">League champion</span><div>${row.champion?clubLink(clubFor(s,row,row.champion)):'Season in progress'}</div></div>${btn('Season results','historical-standings',{style:'light',attr:'data-year="'+u.year+'"',glyph:'right'})}</div>
    <div class="panel-tools timeline-ai">${annotations(s,{kind:'season',year:u.year,span:1},u)}${u.ai.enabled?btn('Generate decade review','generate',{style:'ghost compact',glyph:'spark',attr:`data-kind="season" data-year="${u.year}" data-span="10"`,disabled:u.aiBusy}):''}</div>
    ${s.annotations[annotationKey({kind:'season',year:u.year,span:10})]?`<div class="padded">${annotations(s,{kind:'season',year:u.year,span:10},{...u,ai:{enabled:false}})}</div>`:''}
  </section>
  <div class="overview-grid spaced"><section class="panel">${heading('Season events',`${events.length} records`)}${journalList(s,events,{limit:24})}</section><section class="panel">${heading('Rules in force')}${rulesList(row.rules)}</section></div>
  <div class="overview-grid spaced"><section class="panel">${heading('League membership')}${`<div class="map-clubs">${row.members.map(t=>clubLink(t)).join('')}</div>`}</section>
  <section class="panel">${heading('Season indicators')}${row.finance?`<dl class="rules-list"><div><dt>Revenue</dt><dd>${usd(row.finance.revenue)}</dd></div><div><dt>Operating margin</dt><dd>${usd(row.finance.margin)}</dd></div><div><dt>Average attendance</dt><dd>${num(row.finance.average)}</dd></div><div><dt>Health</dt><dd>${percent(row.health)}</dd></div></dl>`:blank('Accounts pending','The season’s closing figures will appear here.')}${row.leaders[0]?`<div class="season-leader"><span>Leading player</span>${personLink(row.leaders[0])}</div>`:''}</section></div>
  <section class="panel spaced">${heading('Decisions in this season')}${decisionsTable(s,decisions,24)}</section>`;
}

export function news(s,u) {
  const cats=[['all','All desks'],['founding','Founding'],['championship','Championships'],['decision','Directors'],['franchise','Franchises'],['rival','Rivals'],['world','World events'],['finance','Finances'],['people','People'],['chronicle','Retrospectives']];
  const filtered=s.events.filter(e=>(u.newsYear==='all'||e.year===Number(u.newsYear))&&(u.newsKind==='all'||e.kind===u.newsKind)).reverse();
  const page=Math.min(Math.max(0,Math.ceil(filtered.length/15)-1),u.page);
  return `<section class="panel newspaper ${s.year<1950?'broadsheet':''}"><div class="masthead"><p>${esc(s.name)} <i>·</i> ${esc(dateText(s))}</p><h2>${esc(fallbackArticle({year:s.year}).edition)}</h2><div>${esc(era(s.year))} edition</div></div>
    <div class="panel-tools"><label class="select-label"><span>Desk</span><select data-change="newsKind">${cats.map(([key,label])=>`<option value="${key}"${selected(u.newsKind,key)}>${label}</option>`).join('')}</select></label>
    <label class="select-label"><span>Season</span><select data-change="newsYear"><option value="all">All seasons</option>${Array.from(new Set(s.events.map(e=>e.year))).reverse().map(year=>`<option value="${year}"${selected(u.newsYear,String(year))}>${seasonLabel(s.sport,year)}</option>`).join('')}</select></label></div>
    ${journalList(s,filtered.slice(page*15,(page+1)*15),{list:false,limit:15})}
    ${filtered.length>15?`<div class="pagination">${btn('Previous','pagination',{style:'light compact',attr:'data-value="'+(page-1)+'"',disabled:page===0})}<span>Page ${page+1} of ${Math.ceil(filtered.length/15)}</span>${btn('Next','pagination',{style:'light compact',attr:'data-value="'+(page+1)+'"',disabled:(page+1)*15>=filtered.length})}</div>`:''}
  </section>`;
}

export function records(s,u) {
  const archive=chronicle(s);
  const tab=tabbed([['titles','Champions'],['people','People'],['register','League register']],u.recordTab,'record-tab','Encyclopedia');
  let content='';
  if (u.recordTab==='titles') {
    const years=Object.values(s.seasons).filter(row=>row.champion).reverse();
    content=archive.titles.length?`<div class="record-highlights">${[
      ['Most championships',archive.titles[0].id,archive.titles[0].count+' titles'],
      ['Longest title streak',archive.dynasty.id,archive.dynasty.count+' straight'],
      ['Longest winning streak',archive.gameStreak.id,archive.gameStreak.count+' games']
    ].map(([title,id,value])=>`<div><span class="eyebrow">${title}</span><strong>${value}</strong>${clubLink(byId(s,id),{withBadge:false})}</div>`).join('')}</div><div class="table-scroll"><table class="data-table"><thead><tr><th>Season</th><th>Champion</th><th>Runner-up</th><th>Format</th><th>Average gate</th></tr></thead><tbody>${years.map(row=>`<tr><th scope="row"><button class="inline-link" type="button" data-action="historical-standings" data-year="${row.year}">${seasonLabel(s.sport,row.year)}</button></th><td>${clubLink(clubFor(s,row,row.champion))}</td><td>${clubLink(clubFor(s,row,row.runnerUp),{withBadge:false})}</td><td>${esc(formatOf(row))}</td><td>${num(row.finance?.average)}</td></tr>`).join('')}</tbody></table></div>`:blank('No champions crowned yet','Finish a season to open the championship register.');
  } else if (u.recordTab==='people') {
    const all=Object.values(s.people);
    const query=u.personSearch.trim().toLowerCase();
    const ranked=all.filter(p=>query?p.name.toLowerCase().includes(query)||p.role.toLowerCase().includes(query):s.hall.includes(p.id)||p.honours?.length>=2||p.role!=='Athlete'&&p.birth+70>=s.year).sort((a,b)=>(b.honours?.length??0)-(a.honours?.length??0)||a.name.localeCompare(b.name));
    content=`<div class="panel-tools"><form data-form="people" class="search-form">${icon('search',17)}<label class="sr-only" for="people-search">Search people</label><input id="people-search" name="query" placeholder="Name or role" value="${esc(u.personSearch)}"><button type="submit">Search</button></form><span>${ranked.length} matches · ${s.hall.length} inductees</span></div>
      ${ranked.length?`<div class="people-list">${ranked.slice(0,80).map(p=>`<div>${personLink(p)}<span>${esc(p.role)} · Born ${p.birth}${p.honours?.length?' · '+p.honours.length+' honours':''}</span></div>`).join('')}</div>`:blank('No matching people','Search the recorded name or role.')}`;
  } else {
    content=`<div class="register"><div><h3>League names</h3>${s.leagueNames.map(x=>`<p>${x.year} · ${esc(x.name)}</p>`).join('')}<h3>Commissioners</h3>${s.commissioners.map(x=>`<p>${esc(x.name)} · ${x.start}–${x.ended??'present'}</p>`).join('')}</div><div><h3>Founding context</h3><p>${esc(SPORTS[s.sport].context)}</p><p>${num(s.metrics.games)} matches and ${num(s.metrics.titleCount)} champions in the completed-season record.</p>${btn('Historical sources','sources',{style:'light',glyph:'book'})}</div></div>`;
  }
  return `${retrospective(s)}<section class="panel">${heading('League register',`Established ${SPORTS[s.sport].start}`)}${tab}${content}</section>`;
}

export function dialogArticle(s,u,id) {
  const event=s.events.find(row=>row.id===id);
  if (!event) return blank('Article unavailable','The event does not appear in this save.');
  const article=fallbackArticle(event);
  return `<div class="article-sheet"><p class="eyebrow">${esc(article.edition)} · ${esc(article.desk)} · ${event.worldYear??event.year}</p><h3>${esc(article.title)}</h3><p>${esc(article.body)}</p>
  ${event.team?clubLink(byId(s,event.team)):''}${event.person?personLink(s.people[event.person]):''}
  ${annotations(s,{kind:'news',id:event.id,year:event.year},u)}</div>`;
}

export function dialogDecision(s,id) {
  const row=s.decisions.find(x=>x.id===id);
  if (!row) return blank('Decision unavailable','No entry appears in the register.');
  return `<div class="article-sheet"><p class="eyebrow">${row.year} · ${esc(row.actor)}</p><h3>${esc(row.title)}</h3><p>${esc(row.choice)}. ${esc(row.effect)}</p></div>
    ${row.voting?`<div class="vote-summary">${row.voting.yes} in favour · ${row.voting.no} opposed · ${row.voting.need} required</div><div class="table-scroll"><table class="data-table"><thead><tr><th>Franchise</th><th>Owner</th><th>Vote</th></tr></thead><tbody>
    ${row.voting.votes.map(v=>`<tr><td>${esc(v.club)}</td><td>${esc(v.owner)}</td><td>${badge(v.yes?'In favour':'Opposed',v.yes?'status':'danger')}</td></tr>`).join('')}
    </tbody></table></div>`:'<p class="muted">This item was within the office’s delegated authority.</p>'}`;
}

export function newLeague(s,u) {
  const cfg=SPORTS[u.newSport];
  return `<form data-form="new" class="form-stack"><div class="sport-grid">${Object.entries(SPORTS).map(([key,d])=>`<button type="button" class="sport-choice ${key===u.newSport?'is-selected':''}" data-action="new-sport" data-value="${key}" aria-pressed="${key===u.newSport}">${sportIcon(key,23)}<span><strong>${esc(d.label)}</strong><small>${d.start} · ${d.modern}</small></span>${key===u.newSport?icon('check',15):''}</button>`).join('')}</div>
    <p class="form-note">${esc(cfg.context)}</p>
    <div class="form-grid"><label>World seed<input name="seed" maxlength="100" value="${esc(u.newSeed)}" placeholder="Leave blank for a random seed"></label><label>Difficulty<select name="difficulty">${Object.entries(DIFFICULTIES).map(([k,d])=>`<option value="${k}"${selected(u.newDifficulty,k)}>${d.label}</option>`).join('')}</select></label></div>
    <label>Control mode<select name="mode"><option value="active"${selected(u.newMode,'active')}>Active commissioner</option><option value="hybrid"${selected(u.newMode,'hybrid')}>Hybrid commissioner</option><option value="observer"${selected(u.newMode,'observer')}>Hands-off observer</option></select></label>
    <div class="dialog-actions">${btn('Cancel','close',{style:'light'})}<button class="btn dark" type="submit">${icon('play',15)} Start league</button></div></form>`;
}

export function savesView(s,u) {
  return `<form data-form="save" class="form-stack save-form"><label>Name this save<input name="name" maxlength="80" value="${esc(u.saveName??(s.name+' · '+s.year))}" required></label><button class="btn dark" type="submit">${icon('save',16)} Save game</button></form>
  <div class="save-tools">${btn('Export save','export',{style:'light',glyph:'download'})}${btn('Import save','import',{style:'light',glyph:'upload'})}</div>
  <h3>Saved leagues</h3><div class="save-list">${u.slots.length?u.slots.map(slot=>`<div class="save-slot"><span class="metric-icon">${sportIcon(slot.sport,17)}</span><div><strong>${esc(slot.name)}</strong><small>${esc(SPORTS[slot.sport]?.label)} · ${slot.year} · ${new Date(slot.updated).toLocaleDateString()}</small></div>
    ${btn('Load','load',{style:'light compact',attr:'data-id="'+esc(slot.id)+'"'})}${slot.id==='autosave'?'':btn('Delete','delete-save',{style:'ghost compact',attr:'data-id="'+esc(slot.id)+'"'})}</div>`).join(''):'<p class="muted">No saved leagues yet.</p>'}</div>`;
}

export function settingsView(s,u) {
  return `<div class="settings-tabs">${tabbed([['game','Simulation'],['ai','OpenRouter']],u.settingsTab,'settings-tab','Game settings')}</div>
    ${u.settingsTab==='game'?`<div class="form-stack"><label>Control mode<select data-change="mode"><option value="active"${selected(s.settings.mode,'active')}>Active commissioner</option><option value="hybrid"${selected(s.settings.mode,'hybrid')}>Hybrid commissioner</option><option value="observer"${selected(s.settings.mode,'observer')}>Hands-off observer</option></select></label>
    <label class="check-row"><input type="checkbox" data-change="pauseMajor"${checked(s.settings.pauseMajor)} ${s.settings.mode==='hybrid'?'disabled':''}> Pause for major decisions</label><label class="check-row"><input type="checkbox" data-change="inflation"${checked(s.settings.inflation)}> Display finances in 2026 dollars</label>
    <div class="form-note"><p>Active commissioners review each proposal. Hybrid commissioners delegate routine matters. Observer mode can delegate every item when pausing is off.</p><p>Difficulty <strong>${DIFFICULTIES[s.difficulty].label}</strong> · Seed <strong>${esc(s.seed)}</strong></p></div></div>`:
    `<form data-form="ai-settings" class="form-stack"><label class="check-row"><input type="checkbox" name="enabled"${checked(u.ai.enabled)}> Enable OpenRouter generation</label>
    <label>OpenRouter API key<input name="apiKey" type="password" value="${esc(u.apiKey)}" placeholder="sk-or-v1-…" autocomplete="off"></label>
    <p class="form-note">${location.protocol==='file:'?'OpenRouter is available when the project runs through its web server.':'The key stays in this tab for the session. OpenRouter handles requests through the game server.'}</p>
    <div class="form-grid"><label>Primary model<input name="model" list="models" required maxlength="140" value="${esc(u.ai.model)}"></label><label>Archive model (optional)<input name="detailModel" list="models" maxlength="140" value="${esc(u.ai.detailModel)}"></label></div>
    <datalist id="models">${u.models.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</datalist>
    <div class="form-grid"><label>Temperature<input name="temperature" type="number" min="0" max="1.5" step=".05" value="${u.ai.temperature}"></label><label>Token limit<input name="maxTokens" type="number" min="100" max="2000" value="${u.ai.maxTokens}"></label>
    <label>Detail<select name="detail">${['brief','standard','detailed'].map(x=>`<option${selected(u.ai.detail,x)}>${x}</option>`).join('')}</select></label>
    <label>Automatic season review<select name="frequency">${[[0,'Manual only'],[1,'Every season'],[5,'Every 5 years'],[10,'Every 10 years']].map(([k,label])=>`<option value="${k}"${selected(u.ai.frequency,k)}>${label}</option>`).join('')}</select></label></div>
    <label>Session request budget<input name="budget" type="number" min="1" max="100" value="${u.ai.budget}"></label>
    <label class="check-row"><input type="checkbox" name="autoProposal"${checked(u.ai.autoProposal)}> Automatically place generated proposals on the agenda</label>
    <div class="form-note">This session · ${u.usage.calls} requests · ${num(u.usage.tokens)} tokens · ${u.usage.missing?'known costs ':''}$${u.usage.cost.toFixed(4)}</div>
    <div class="dialog-actions">${btn(u.models.length?'Refresh model list':'Fetch model list','models',{style:'light',glyph:'download',disabled:u.modelsBusy})}<button class="btn dark" type="submit">${icon('check',16)} Save AI settings</button></div></form>`}
  `;
}

export function sources(s) {
  const all=Object.values(SPORTS);
  const names=[['Baseball Reference · National League charter clubs','Baseball Almanac · 1876 National League season'],['NFL · Original towns and clubs','Pro Football Hall of Fame · 1920 account','Pro Football Hall of Fame · Franchise histories'],['NBA · Founding BAA clubs','NBA · Review of 1946–47'],['NHL Records · Year-by-year league history','NHL · League founding history']];
  return `<div class="sources"><p>The founding season uses historical membership, home cities and competition rules. Original venues, selected people and wider historical events inform the scenario. Budgets, capacities, market curves and fixture calendars use simulation estimates.</p>${all.map((d,i)=>`<div><h3>${esc(d.label)} · ${d.start}</h3><ul>${d.sources.map((url,j)=>`<li><a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(names[i][j])} ${icon('upRight',14)}</a></li>`).join('')}</ul></div>`).join('')}<p><a href="https://www.census.gov/library/working-papers/1998/demo/POP-twps0027.html" target="_blank" rel="noreferrer">U.S. Census Bureau · Historical urban population ${icon('upRight',14)}</a></p></div>`;
}
