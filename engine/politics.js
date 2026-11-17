import { CITIES, SPORTS } from './data.js';
import { absorbRival, closeFranchise, createFranchise, journal, relocate, renameFranchise, restoreFranchise } from './franchises.js';
import { activeRivals, activeTeams, budgetUnit, byId, cityName, historicalConditions, marketCandidates, suggestedName } from './world.js';
import { choose, clamp, distance, integer } from './random.js';

export const FORMATS={pennant:'League table',ratification:'Directors’ ratification',split:'Split season',divisional:'Divisional playoffs',playoff:'Four-team playoff',wildcard:'Expanded playoffs'};

const option=(label,detail,action,merit=0,vote=0)=>({label,detail,action,merit,vote});

function draft(s,kind,title,text,choices,context={},major=true) {
  return {id:'d'+(++s.ids.decision),kind,title,text,choices,context,major,year:s.year,phase:s.phase};
}

export function openingDecision(s) {
  return draft(s,'governance','Ratify the founding charter',
    'The owners need a governing agreement before the first fixtures. How much responsibility should the league take for its member clubs?',
    [
      option('Establish a mutual guarantee','Pool a share of gate receipts and build an emergency fund for members.',{type:'charter',choice:'guarantee'},16,.55),
      option('Preserve club independence','Clubs retain their gates and autonomy. Each owner carries their own financial risk.',{type:'charter',choice:'independent'},5,0),
      option('Strengthen the league office','Seek emergency authority to act between meetings. Owners may resist ceding power.',{type:'charter',choice:'office'},8,.62)
    ]);
}

function mergerCandidates(s,rival) {
  return rival.clubs.filter(club=>!s.teams.some(t=>t.status!=='defunct'&&t.market===club.market)&&activeTeams(s).some(t=>distance(CITIES[t.market],CITIES[club.market])<(s.year<1948?850:3250)));
}

function clubInTrouble(s,team,candidate) {
  const choices=[
    option('Arrange bridge financing','League reserves and an owner contribution buy time. The league assumes some of the risk.',{type:'bailout',team:team.id},5,.42)
  ];
  if (candidate) choices.push(option(`Approve a move to ${candidate.city}`,'An investment group will refinance the club. The old market loses its team.',{type:'relocate',team:team.id,market:candidate.id},14,.55));
  const peer=activeTeams(s).filter(t=>t.id!==team.id).sort((a,b)=>distance(CITIES[a.market],CITIES[team.market])-distance(CITIES[b.market],CITIES[team.market]))[0];
  if (peer && activeTeams(s).length>SPORTS[s.sport].min) choices.push(option(`Consolidate with ${peer.name}`,'Combine the clubs’ sporting and financial assets. The original charter is retired.',{type:'consolidate',team:team.id,into:peer.id},2,.56));
  choices.push(option('Require owners to absorb losses','Keep league funds available for other clubs. A withdrawal becomes more likely.',{type:'defer',penalty:3},1,0));
  return draft(s,'finance',`${team.name} face a funding gap`,
    'The directors are struggling to cover wages and venue costs. The board must decide whether to intervene.',choices,{team:team.id});
}

function expansionDecision(s,offer,next) {
  const name=suggestedName(s,offer.id,next);
  return draft(s,'expansion',`Apply for a charter in ${offer.city}`,
    `A local syndicate has secured a venue in a market of roughly ${new Intl.NumberFormat('en-US').format(offer.pop)} residents. The nearest club is ${offer.nearest} miles away.`,
    [
      option(`Admit ${name}`,'Collect a franchise fee and add a full member. Travel costs rise and the talent pool is spread thinner.',{type:'expand',market:offer.id,name},13,.56),
      option('Offer provisional membership','Lower the up-front fee and limit the new club’s initial voting influence.',{type:'expand',market:offer.id,name,provisional:true},10,.46),
      option('Decline the application','Protect current members’ gates. A rival remains free to enter the market.',{type:'defer',rival:true},3,0)
    ],{market:offer.id});
}

function rivalDecision(s,rival,available) {
  const full=({baseball:'Professional Base Ball League',football:'National Football League',basketball:'National Basketball Association',hockey:'Professional Hockey League'})[s.sport];
  const slots = Math.max(0,32-activeTeams(s).length);
  const list=available.slice(0,Math.min(slots,4));
  const small=list.slice(0,2);
  const choices=[];
  if (small.length) choices.push(option(`Admit clubs in ${small.map(club=>cityName(club.market)).join(' and ')}`,
    'Admit selected members, recognise eligible contracts and keep the current league title register.',
    {type:'merge',rival:rival.id,count:small.length},14,.55));
  if (list.length) choices.push(option('Negotiate a united league',
    `Admit ${list.map(club=>cityName(club.market)).join(', ')} under the ${full} name. Rebalance votes and share more revenue.`,
    {type:'merge',rival:rival.id,count:list.length,name:full},12,.63));
  choices.push(option('Compete for players and audiences','Budget for higher payroll to defend the league’s playing talent.',{type:'compete',rival:rival.id},5,.42));
  choices.push(option('Decline negotiations','Keep finances available. The challenger retains its owners and markets.',{type:'defer',rival:true},2,0));
  return draft(s,'rival',`Negotiations with the ${rival.name}`,
    `The independent competition represents ${rival.clubs.length} clubs. Its directors want to know whether a shared structure could work.`,choices,{rival:rival.id});
}

function mediaDecision(s) {
  return draft(s,'media',`${historicalConditions(s).media} rights go to a vote`,
    'A distributor has offered money for a collective rights package. Clubs with established audiences want more control over their own coverage.',
    [
      option('Sell a shared league package','Raise guaranteed media income and pool some of the proceeds.',{type:'broadcast',choice:'share'},17,.55),
      option('Let clubs sell local rights','Keep local autonomy and split less revenue. Large markets gain leverage.',{type:'broadcast',choice:'local'},9,.42),
      option('Protect venue attendance','Limit the deal and keep more fixtures at customary hours.',{type:'defer',bonus:1},3,0)
    ],{},s.year>=1952);
}

function labourDecision(s) {
  const modern=s.year>=1960;
  return draft(s,'labour',modern?'The players request a new agreement':'Players contest contract restrictions',
    modern?'Player representatives question salary restrictions and seek better protections. Club directors are split over costs.':'Clubs want to control their playing lists. Athletes argue that the current terms give owners too much leverage.',
    [
      option(modern?'Negotiate mobility and wage guarantees':'Offer longer guaranteed terms','Labour stability improves. Competitive salaries increase annual costs.',{type:'labour',choice:'open'},15,.46),
      option('Set a shared payroll framework','Lower payroll and improve budget predictability. Players may organise or withhold services.',{type:'labour',choice:'cap'},s.labour>65?13:3,.53),
      option('Table the proposal','Avoid an immediate commitment. Prolonged disagreement raises the risk of work stoppages.',{type:'defer',labour:9},0,0)
    ]);
}

function scheduleDecision(s) {
  const format=s.rules.format;
  const reform=s.year>=1950&&format==='playoff'?'wildcard':'playoff';
  const games=({baseball:s.year<1960?154:162,football:s.year<1935?11:s.year<1965?14:s.year<2000?16:17,basketball:s.year<1960?72:82,hockey:s.year<1942?44:s.year<1967?60:82})[s.sport];
  const choices=[];
  if (s.year>=SPORTS[s.sport].start+4 && format!==reform) choices.push(option(`Adopt a ${FORMATS[reform].toLowerCase()}`,'More clubs stay in contention and postseason gates improve. Top seeds share some advantage.',{type:'format',format:reform},14,.52));
  if (s.rules.games < games) choices.push(option(`Move toward ${games} games per club`,'More fixtures improve gate potential and raise travel and roster costs.',{type:'games',games},9,.45));
  if (s.rules.alignment!=='regional' && activeTeams(s).length>=7 && format!=='split') choices.push(option('Organise regional divisions','Create East and West groups and give regional fixtures more weight.',{type:'alignment'},8,.50));
  if (s.sport==='basketball'&&s.year>=1951&&!s.rules.pace) choices.push(option('Adopt a possession clock','Limit stalling and increase the typical pace of play.',{type:'pace'},14,.55));
  if (s.rules.games>8) choices.push(option('Reduce the schedule','Fewer away trips reduce expenses, while clubs also lose gate dates.',{type:'games',games:Math.max(6,Math.floor(s.rules.games*.82))},6,.46));
  choices.push(option('Retain the existing competition','Preserve the current fixture list and championship method.',{type:'defer'},5,0));
  return draft(s,'competition','Review the competition format','Clubs want a more viable calendar and a championship that brings spectators back. The adopted rules take effect with the next unissued schedule.',choices,{},false);
}

function constitution(s) {
  return draft(s,'governance','Reconsider the league constitution',
    'Directors are debating the powers of the central office, franchise admission and how much of club earnings should be shared.',
    [
      option('Raise revenue sharing','Reduce the gap between high- and low-gate clubs. The richest blocs may vote against it.',{type:'sharing'},16,.53),
      option('Broaden commissioner powers','Grant the office greater latitude in discipline and crisis lending.',{type:'authority'},10,.60),
      option('Require a stronger owners’ vote','Raise the approval threshold for charter and financial changes.',{type:'veto'},7,.49),
      option('Maintain the constitution','Leave existing powers in place for the next round of negotiations.',{type:'defer'},4,0)
    ]);
}

function otherDecision(s,kind,next) {
  if (kind==='draft') {
    return draft(s,'competition','Introduce an entry draft','Directors want a more even means of distributing new talent.',
      [option('Hold a reverse-order entry draft','The weakest clubs select earlier. Athletes have less control over where they begin.',{type:'draft'},12,.5),option('Keep open recruitment','Clubs compete for new players on the market.',{type:'defer'},7,0)],{},false);
  }
  if (kind==='access') {
    return draft(s,'governance','Open competition charter','Advocates and owners are debating barriers to professional participation and attendance.',
      [option('Guarantee equal eligibility','The league adopts an open eligibility policy and supports venues that comply.',{type:'access'},17,.51),option('Leave venue policies to clubs','Keep decisions with local clubs. Uneven access continues to constrain participation.',{type:'defer',labour:3},0,0)]);
  }
  if (kind==='identity') {
    const team=choose(next,activeTeams(s));
    const name=suggestedName(s,team.market,next);
    return draft(s,'identity',`${team.name} propose a new name`,'The owners want an identity that can draw a broader local following.',
      [option(`Approve ${name}`,'The team keeps its charter, championships and records.',{type:'rename',team:team.id,name},11,.43),option('Keep the current name','Preserve the existing connection with supporters.',{type:'defer'},7,0)],{team:team.id},false);
  }
  return constitution(s);
}

export function agenda(s) {
  if (s.status!=='running' || s.pending || (s.current.schedule && !s.current.settled) || s.current.special>=2 || activeTeams(s).length<2) return [];
  const teams=activeTeams(s);
  const options=[
    ['competition','Competition format'],['governance','League constitution'],['labour','Player contracts'],['identity','Franchise identity']
  ];
  if (marketCandidates(s).length && teams.length<32) options.unshift(['expansion','Expansion market']);
  if (activeRivals(s).length) options.push(['rival','Rival league negotiations']);
  if (s.year>=1921) options.push(['media','Media rights']);
  if (!s.rules.draft&&s.year>=1934) options.push(['draft','Entry draft']);
  if (s.rules.access<1.06&&s.year>=1940) options.push(['access','Open eligibility']);
  const weak=teams.some(team=>team.arrears||team.debt>budgetUnit(s)*.50);
  if (weak) options.unshift(['finance','Franchise rescue or relocation']);
  return options;
}

export function makeDecision(s,next,kind=null) {
  const teams=activeTeams(s);
  if (teams.length<2 || s.pending) return null;
  const unit=budgetUnit(s);
  const worst=[...teams].sort((a,b)=>(b.debt-b.cash)-(a.debt-a.cash))[0];
  const open=marketCandidates(s);
  const rival=activeRivals(s).sort((a,b)=>b.reputation-a.reputation)[0];
  const fit=rival?mergerCandidates(s,rival):[];
  const offer=kind==='expansion'?open[0]:choose(next,open.slice(0,Math.min(5,open.length)));
  if (!kind) {
    const wait=(k,years)=>!s.decisions.slice(-years*3).some(d=>d.kind===k&&s.year-d.year<years);
    const inactive=s.teams.find(team=>team.status==='suspended');
    if (inactive && s.year-SPORTS[s.sport].start>=1 && wait('membership',3)) {
      return draft(s,'membership',`${inactive.name} seek active membership`,'The charter holders have put together a venue and an ownership guarantee.',
        [option('Activate the charter','Return the club to active membership and schedule its fixtures.',{type:'restore',team:inactive.id},17,.46),option('Keep the charter in abeyance','Preserve the option while owners seek stronger financial guarantees.',{type:'defer'},2,0)],{team:inactive.id});
    }
    if ((worst.arrears||worst.debt>unit*.66) && (wait('finance',2)||s.warnings>0)) kind='finance';
    else if (rival && s.year-rival.founded>=2 && fit.length && teams.length<31 && wait('rival',4) && next()<.46) kind='rival';
    else if (s.labour<42&&wait('labour',3)) kind='labour';
    else if (s.year>=1948&&s.rules.broadcast<1.28&&wait('media',6)&&next()<.39) kind='media';
    else if (offer && teams.length<Math.min(32, 4+Math.round((s.year-1876)/6)) && wait('expansion',3) && next()<.48) kind='expansion';
    else if (s.year>=1945&&s.rules.access<1.06&&wait('access',9)&&next()<.17) kind='access';
    else if (s.year>=1934&&!s.rules.draft&&wait('competition',4)&&next()<.28) kind='draft';
    else if (s.year>=1955&&s.year%9===0) kind='labour';
    else kind=choose(next,['competition','competition','governance',s.year>=1921?'media':'identity','identity']);
  }
  if (kind==='finance') return clubInTrouble(s,worst,marketCandidates(s,worst.id).find(c=>c.id!==worst.market));
  if (kind==='expansion'&&offer) return expansionDecision(s,offer,next);
  if (kind==='rival'&&rival) return rivalDecision(s,rival,fit);
  if (kind==='media') return mediaDecision(s);
  if (kind==='labour') return labourDecision(s);
  if (kind==='competition') return scheduleDecision(s);
  return otherDecision(s,kind,next);
}

const attitudes={
  Profit:{expand:18,broadcast:17,sharing:-19,bailout:-18,relocate:20,authority:-12,labour:-9,merge:9},
  Prestige:{expand:16,format:19,merge:17,rename:6,draft:8,relocate:-9},
  'Home market':{relocate:-21,merge:-8,consolidate:-17,sharing:11,access:8,rename:-11},
  'Player welfare':{labour:17,draft:-9,compete:12,access:17,consolidate:-15},
  Influence:{authority:-23,sharing:-7,alignment:6,veto:20,broadcast:7}
};

function voteOn(s,decision,choice,next) {
  const {action}=choice;
  if (!choice.vote) return null;
  const unit=budgetUnit(s);
  const owners=activeTeams(s).filter(team=>!team.provisional || team.provisional<=s.year);
  const required=clamp(Math.max(choice.vote,s.rules.threshold)-s.rules.authority*.10,.39,.78);
  const votes=owners.map(team=>{
    const owner=team.owner;
    let score=59+(owner.trust-53)*.47+(s.approval-50)*.22+(attitudes[owner.priority][action.type]??0);
    if (action.type==='charter'&&action.choice==='office') score-=owner.priority==='Influence'?18:7;
    if (action.type==='sharing'||action.type==='bailout') score+=(team.cash-team.debt)/unit<.75?15:-9;
    if (action.type==='labour') score+=action.choice==='cap'?(owner.priority==='Profit'?19:-12):(s.labour<47?12:0);
    if (action.type==='expand') score+=distance(CITIES[team.market],CITIES[action.market])>(s.year<1948?700:1500)?-14:7;
    if (team.id===decision.context.team) score+=action.type==='consolidate'?-21:13;
    const yes=integer(next,11,97)<score;
    return {team:team.id,club:team.name,owner:owner.name,yes};
  });
  const yes=votes.filter(v=>v.yes).length;
  const need=Math.ceil(votes.length*required);
  return {yes,no:votes.length-yes,need,passed:yes>=need,votes};
}

function execute(s,a,next) {
  const u=budgetUnit(s);
  const t=byId(s,a.team);
  const r=s.rivals.find(league=>league.id===a.rival);
  const rules=s.rules;
  switch(a.type) {
    case 'charter':
      if (a.choice==='guarantee') { rules.sharing=.22; s.reserve+=u*.33; s.approval+=4; return 'The founding charter adds gate sharing and a league reserve.'; }
      if (a.choice==='office') { rules.authority=.67; rules.threshold=.57; s.approval-=3; return 'Directors grant the office more power to respond between meetings.'; }
      rules.sharing=.025; rules.authority=.23; s.reserve+=u*.09; return 'Members retain most revenue and decision-making authority.';
    case 'expand': {
      if (activeTeams(s).length>=32 || !marketCandidates(s).some(c=>c.id===a.market)) return '';
      const club=createFranchise(s,{name:a.name,market:a.market},next);
      if (a.provisional) club.provisional=s.year+2;
      s.reserve+=u*(a.provisional?.13:.31);
      s.popularity+=2;
      for (const team of activeTeams(s)) if (team!==club) team.talent=clamp(team.talent-.75,20,94);
      journal(s,'franchise',`${club.name} enter the league`,`The directors granted ${cityName(a.market)} a charter at ${club.venue}.`,{team:club.id});
      return club.name+' join the circuit. New membership adds receipts and travel.';
    }
    case 'bailout':
      if (!t || t.status!=='active') return '';
      s.reserve-=u*.26; t.cash+=u*.52; t.debt*=.77; t.arrears=Math.max(0,t.arrears-1); s.approval+=2;
      return 'The club receives new cash and refinances part of its debt.';
    case 'relocate':
      if (marketCandidates(s,t?.id).some(c=>c.id===a.market)&&relocate(s,t,a.market,next)) return 'The charter moves to '+cityName(a.market)+'. Its previous records stay attached.';
      return '';
    case 'consolidate': {
      const survivor=byId(s,a.into);
      if (!survivor || survivor.status!=='active' || activeTeams(s).length<=SPORTS[s.sport].min || !closeFranchise(s,t,'Board-approved consolidation of assets and contracts.',survivor)) return '';
      s.popularity-=3;
      return 'The league retains the survivor’s charter and records the absorbed club’s lineage.';
    }
    case 'restore': return restoreFranchise(s,t,next)?'The dormant charter is active again.':'';
    case 'merge': {
      const entered=absorbRival(s,r,a.count,a.name,next);
      if (!entered.length) return '';
      journal(s,'rival',`${r.name} merger approved`,`The agreement admits ${entered.map(c=>c.name).join(', ')}, recognises selected player contracts and preserves both organisations’ title ledgers.`,{rival:r.id});
      return 'The combined organisation adds '+entered.length+' franchises and revises its constitution.';
    }
    case 'compete':
      if (!r || r.status!=='active') return '';
      rules.payroll=Math.min(1.50,rules.payroll+.13); s.labour+=5; r.reputation-=4;
      return 'Clubs increase contract offers to defend their rosters.';
    case 'broadcast':
      rules.broadcast=clamp(rules.broadcast+(a.choice==='share'?.22:.11),.52,1.92);
      rules.sharing=clamp(rules.sharing+(a.choice==='share'?.08:-.035),.015,.67); s.popularity+=3;
      return 'The rights contract changes media income and its distribution.';
    case 'labour':
      rules.contracts=a.choice==='open'?(s.year>=1960?'free agency':'guaranteed terms'):(s.year>=1975?'salary cap':'restricted lists');
      rules.payroll=clamp(rules.payroll+(a.choice==='open'?.11:-.16),.70,1.58);
      s.labour+=a.choice==='open'?22:-16; s.approval+=a.choice==='open'?1:-2;
      return a.choice==='open'?'Contract guarantees improve labour relations and raise payroll.':'Wage restrictions reduce immediate costs and increase strike risk.';
    case 'format': rules.format=a.format; s.popularity+=3; return 'The league adopts '+FORMATS[a.format].toLowerCase()+'.';
    case 'games': rules.games=a.games; return 'The next fixture list targets '+a.games+' games per club.';
    case 'alignment': rules.alignment='regional'; return 'The next fixture list uses East and West divisions.';
    case 'pace': rules.pace=true; s.popularity+=4; return 'A possession clock changes the scoring environment.';
    case 'draft': rules.draft=true; s.labour-=4; return 'New talent enters through a reverse-order draft.';
    case 'access': rules.access=1.08; s.labour+=7; s.popularity+=5; return 'The league office introduces equal eligibility and access standards.';
    case 'sharing': rules.sharing=clamp(rules.sharing+.085,0,.67); s.approval+=2; return 'More gate and media income will be pooled.';
    case 'authority': rules.authority=clamp(rules.authority+.14,0,.94); s.approval-=1; return 'The league office gains more power between meetings.';
    case 'veto': rules.threshold=clamp(rules.threshold+.065,.43,.73); rules.authority*=.91; return 'More owners must support future charter changes.';
    case 'rename': return renameFranchise(s,t,a.name)?'The club’s new identity is recorded against its existing charter.':'';
    case 'defer':
      s.approval+=(a.bonus??0)-(a.penalty??0); s.labour-=a.labour??0;
      if (a.rival) for (const rival of activeRivals(s)) rival.reputation=clamp(rival.reputation+2,0,100);
      return choiceDeferred(a);
    default: return '';
  }
}

function choiceDeferred(a) {
  if (a.labour) return 'Terms stay in place and labour discontent grows.';
  if (a.rival) return 'The league retains its current commitments. Rival investors gain time.';
  return 'The board keeps existing policy.';
}

export function resolveDecision(s,index,next,actor='Commissioner') {
  const decision=s.pending;
  const choice=decision?.choices[index];
  if (!choice || s.status!=='running') return null;
  const voting=voteOn(s,decision,choice,next);
  let effect='The directors did not approve the proposal.';
  let enacted=false;
  if (!voting || voting.passed) {
    const outcome=execute(s,choice.action,next);
    enacted=Boolean(outcome);
    effect=outcome||'The circumstances changed before the proposal could take effect.';
    if (enacted) s.approval+=1;
  } else {
    s.approval-=2;
  }
  for (const v of voting?.votes ?? []) {
    const t=byId(s,v.team);
    if (t) t.owner.trust=clamp(t.owner.trust+(enacted?(v.yes?2:-2):v.yes?0:-1),10,98);
  }
  s.labour=clamp(s.labour,0,100);
  s.approval=clamp(s.approval,0,100);
  s.popularity=clamp(s.popularity,0,100);
  const row={...decision,choice:choice.label,action:choice.action,actor,decisionYear:s.year,decisionPhase:s.phase,voting,effect,enacted};
  s.decisions.push(row);
  if (decision.kind==='competition' && !s.current.schedule) s.current.ruleChanges++;
  journal(s,'decision',decision.title,`${choice.label}. ${effect}`,{decision:decision.id,team:decision.context.team,rival:decision.context.rival});
  s.pending=null;
  return row;
}

export function automatedChoice(s,next) {
  const {choices}=s.pending;
  const u=budgetUnit(s);
  const low=activeTeams(s).filter(team=>team.debt>u*.57).length;
  const rows=choices.map((choice,index)=>{
    const a=choice.action;
    const caution=(a.type==='expand'?low*2:0)+(a.type==='authority'&&s.rules.authority>.65?8:0);
    const treasury=a.type==='bailout'&&s.reserve<u*.08?10:0;
    const stability=a.type==='labour'&&a.choice==='open'&&s.labour<50?12:0;
    const leverage=(a.type==='sharing'&&low>1?6:0)+(a.type==='consolidate'&&low>2?9:0)+(a.type==='games'&&a.games>s.rules.games&&s.sport==='football'?5:0);
    return {index,score:choice.merit-caution-treasury+stability+leverage+integer(next,-5,5)};
  });
  return rows.sort((a,b)=>b.score-a.score)[0].index;
}

export function enqueuePolicy(s,kind,next) {
  if (!agenda(s).some(([key])=>key===kind)) return false;
  s.pending=makeDecision(s,next,kind);
  if (!s.pending) return false;
  s.current.special++;
  return true;
}

export function aiOpportunities(s) {
  if (s.status!=='running'||s.pending||(s.current.schedule&&!s.current.settled)||s.current.special>=2) return [];
  const markets=marketCandidates(s).slice(0,6);
  const opportunities=[];
  if (activeTeams(s).length<32) for (const c of markets) {
    opportunities.push({key:'expand:'+c.id,kind:'expansion',market:c.id,city:c.city,population:c.pop});
  }
  for (const team of activeTeams(s).slice(0,6)) {
    opportunities.push({key:'rename:'+team.id,kind:'identity',team:team.id,club:team.name,city:cityName(team.market)});
  }
  for (const [kind,label] of agenda(s).filter(([kind])=>!['identity','expansion'].includes(kind))) opportunities.push({key:'policy:'+kind,kind,label});
  return opportunities;
}

export function enqueueAI(s,proposal,next) {
  const found=aiOpportunities(s).find(o=>o.key===proposal.key);
  if (!found) return false;
  if (found.kind==='expansion') {
    const c=marketCandidates(s).find(row=>row.id===found.market);
    if (!c) return false;
    s.pending=expansionDecision(s,c,next);
    const name=acceptNickname(s,found.city,proposal.nickname);
    if (name) for (const line of s.pending.choices.slice(0,2)) {
      if (!line.action.provisional) line.label='Admit '+name;
      line.action.name=name;
    }
  } else if (found.kind==='identity') {
    const team=byId(s,found.team);
    const name=acceptNickname(s,found.city,proposal.nickname) || suggestedName(s,team.market,next);
    s.pending=draft(s,'identity',`${team.name} discuss their identity`,'Owners bring a naming proposal before the directors.',
      [option('Approve '+name,'Continue the existing charter under a new name.',{type:'rename',team:team.id,name},11,.43),option('Retain the existing name','Maintain the current name and brand.',{type:'defer'},7,0)],{team:team.id},false);
  } else {
    s.pending=makeDecision(s,next,found.kind);
  }
  if (!s.pending) return false;
  s.pending.generated=proposal;
  s.current.special++;
  return true;
}

function acceptNickname(s,city,nickname) {
  if (typeof nickname!=='string'||!/^\p{L}[\p{L} '\-]{1,31}$/u.test(nickname)||nickname.trim()!==nickname) return '';
  const name=city+' '+nickname;
  return s.teams.some(team=>team.lineage.some(row=>row.name.toLowerCase()===name.toLowerCase()))?'':name;
}
