import { CITIES, COLORS, DIFFICULTIES, NAMES, SPORTS } from './data.js';
import { emptyRecord } from './competition.js';
import { activeRivals, activeTeams, budgetUnit, byId, cityName, marketDemand, nameOf, normalCapacity, suggestedName } from './world.js';
import { choose, clamp, distance, integer, mean } from './random.js';

export function journal(s,kind,title,text,extra={}) {
  const event={id:'e'+(++s.ids.event),year:s.year,phase:s.phase,kind,title,text};
  for (const [key,value] of Object.entries(extra)) if (value!==undefined) event[key]=value;
  s.events.push(event);
  return event;
}

function person(s,fields) {
  const id='p'+(++s.ids.person);
  s.people[id]={id,...fields};
  return s.people[id];
}

function staff(s,market,role,next,team,known=null) {
  return person(s,{
    name:known ?? nameOf(s,next,market),birth:s.year-integer(next,34,59),place:cityName(market),role,
    skill:integer(next,38,81),loyalty:integer(next,35,80),
    team:team.id,career:[{year:s.year,team:team.id,role}]
  });
}

function addAthlete(s,team,next,known=null,rookie=false) {
  const [name,birth,pos,skill,place]=known ?? [];
  const cfg=SPORTS[s.sport];
  const id=team?.id ?? null;
  const start=skill ?? clamp((team?.talent ?? 51)*.42 + next()*44+14,24,86);
  const position=pos ?? cfg.positions[team?.roster.length % cfg.positions.length] ?? choose(next,cfg.positions);
  const debut=s.year-(rookie?integer(next,18,23):integer(next,19,34));
  const athlete=person(s,{
    name:name ?? nameOf(s,next,team?.market),birth:birth ?? debut,role:'Athlete',place:place ?? cityName(team?.market ?? choose(next,Object.keys(CITIES))),
    pos:position,skill:Math.round(start),peak:clamp(Math.round(start)+integer(next,4,19),42,99),
    fragility:next()*.72+.12,ambition:integer(next,20,86),physical:integer(next,38,94),loyalty:integer(next,28,89),
    team:id,contract:team ? {end:s.year+integer(next,0,3),salary:Math.round(budgetUnit(s)*(.023+start/2700))} : null,
    debut:s.year, retired:null, honours:[], stats:{}, career:id ? [{year:s.year,team:id,role:'Athlete'}] : []
  });
  if (team) team.roster.push(athlete.id);
  return athlete;
}

function ownerFor(s,team,next,known) {
  const p=staff(s,team.market,'Owner',next,team,known);
  const priority=choose(next,['Profit','Prestige','Home market','Player welfare','Influence']);
  return {id:p.id,name:p.name,priority,trust:integer(next,42,69),wealth:.58+next()*.86,tenure:s.year,bloc:['Profit','Influence'].includes(priority)?'Commercial':'Club traditionalists'};
}

function lineupFor(s,team,next,known) {
  for (const player of known) addAthlete(s,team,next,player);
  while (team.roster.length < SPORTS[s.sport].roster) addAthlete(s,team,next);
  const position=({baseball:'P',football:'QB',hockey:'G'})[s.sport];
  if (!position || team.roster.some(id=>s.people[id].pos===position)) return;
  const p=s.people[team.roster.at(-1)];
  p.pos=position;
}

export function createFranchise(s,info,next) {
  const {market,name}=info;
  const id='t'+(++s.ids.team);
  const unit=budgetUnit(s);
  const club={
    id,code:info.code ?? CITIES[market].name.replace(/[^a-z]/gi,'').slice(0,3).toUpperCase()+s.ids.team,
    name,market,color:COLORS[(s.ids.team-1)%COLORS.length],status:info.status ?? 'active',
    founded:info.founded ?? s.year,entered:s.year,ended:null,mergedInto:null,source:info.source ?? null,
    venue:info.venue ?? `${cityName(market)} ${({baseball:'Athletic Grounds',football:'Field',basketball:'Arena',hockey:'Rink'})[s.sport]}`,
    capacity:info.capacity ?? Math.round(normalCapacity(s.sport,s.year)*clamp(.55+marketDemand(s,market)*.51,.66,1.28)),
    talent:info.talent ?? integer(next,38,61),fans:info.fans ?? integer(next,28,46),cash:Math.round(unit*(.66+next()*.49)*DIFFICULTIES[s.difficulty].cash),
    debt:0,arrears:0,division:info.division ?? (s.rules.alignment==='regional' ? CITIES[market].lon>-84?'East':'West' : ''),
    titles:[],records:{},ledger:{},roster:[],rivalries:{},lineage:[],staff:[]
  };
  club.owner=ownerFor(s,club,next,info.owner);
  club.coach=staff(s,market,s.sport==='baseball'?'Manager':'Coach',next,club);
  club.coach={id:club.coach.id,name:club.coach.name,skill:club.coach.skill,tenure:s.year};
  const gm=staff(s,market,'General manager',next,club);
  club.staff.push(gm.id);
  club.record=emptyRecord(club);
  stamp(s,club,club.status==='suspended'?'Founding charter held in abeyance':info.source?'Admitted from '+info.source:'Charter granted');
  s.teams.push(club);
  if (club.status==='active') lineupFor(s,club,next,info.athletes ?? []);
  return club;
}

export function stamp(s,team,reason) {
  team.lineage.push({year:s.year,phase:s.phase,name:team.name,market:team.market,venue:team.venue,capacity:team.capacity,owner:team.owner.name,color:team.color,status:team.status,reason});
}

export function renameFranchise(s,team,name) {
  if (!team || team.status!=='active' || !name || s.teams.some(other=>other!==team&&other.name===name&&other.status==='active')) return false;
  const old=team.name;
  team.name=name;
  stamp(s,team,'Rebrand');
  journal(s,'franchise',`${old} rebrand`,`The club will compete as the ${name}.`,{team:team.id});
  return true;
}

export function relocate(s,team,market,next) {
  if (!team || team.status!=='active' || !CITIES[market] || s.teams.some(other=>other.status!=='defunct'&&other.market===market)) return false;
  const old=team.name;
  team.market=market;
  team.name=suggestedName(s,market,next);
  team.color=COLORS[(COLORS.indexOf(team.color)+3)%COLORS.length];
  team.division=s.rules.alignment==='regional' ? (CITIES[market].lon>-84?'East':'West') : '';
  team.venue=`${cityName(market)} ${({baseball:'Athletic Grounds',football:'Municipal Field',basketball:'Arena',hockey:'Ice Palace'})[s.sport]}`;
  team.capacity=Math.round(normalCapacity(s.sport,s.year)*(.71+marketDemand(s,market)*.34));
  team.cash+=budgetUnit(s)*.36;
  team.debt*=.65;
  team.arrears=0;
  team.fans=clamp(team.fans*.58+marketDemand(s,market)*21,22,68);
  for (const id of Object.keys(team.rivalries)) {
    team.rivalries[id]=Math.floor(team.rivalries[id]*.62);
    const other=byId(s,id);
    if (other) other.rivalries[team.id]=team.rivalries[id];
  }
  stamp(s,team,'Relocation');
  s.approval=clamp(s.approval-3,0,100);
  journal(s,'franchise',`${old} move to ${cityName(market)}`,`New investors have acquired local grounds. The club will continue as the ${team.name}; its championships and records carry over.`,{team:team.id});
  return true;
}

export function closeFranchise(s,team,reason,into=null) {
  if (!team || team.status==='defunct') return false;
  team.status='defunct';
  team.ended=s.year;
  team.mergedInto=into?.id ?? null;
  for (const id of team.roster) {
    const player=s.people[id];
    if (into && s.year-player.birth<34 && player.skill>58 && !into.roster.some(slot=>s.people[slot].pos===player.pos&&s.people[slot].skill>=player.skill)) {
      const displaced=into.roster.find(slot=>s.people[slot].pos===player.pos) ?? into.roster.at(-1);
      if (displaced) release(s,s.people[displaced],into,'Released after consolidation');
      employ(s,player,into,'Consolidated charter');
    } else {
      player.team=null;
      player.contract=null;
      player.career.push({year:s.year,team:null,role:'Free agent',note:reason});
    }
  }
  team.roster=[];
  if (into) {
    into.cash+=Math.max(0,team.cash)*.45;
    into.debt+=team.debt*.26;
    into.fans=clamp(into.fans+7,0,100);
    stamp(s,into,'Absorbed '+team.name);
  }
  stamp(s,team,reason);
  journal(s,'franchise',into?`${team.name} consolidate with ${into.name}`:`${team.name} cease operations`,reason,{team:team.id});
  return true;
}

export function restoreFranchise(s,team,next) {
  if (!team || team.status!=='suspended') return false;
  team.status='active';
  team.cash+=budgetUnit(s)*.20;
  lineupFor(s,team,next,[]);
  stamp(s,team,'Charter activated');
  journal(s,'franchise',`${team.name} activate their charter`,`Owners secured ice time and committed funds in ${cityName(team.market)}.`,{team:team.id});
  return true;
}

function release(s,player,team,note) {
  team.roster=team.roster.filter(id=>id!==player.id);
  player.team=null;
  player.contract=null;
  player.career.push({year:s.year,team:null,role:'Free agent',note});
}

function employ(s,player,club,note) {
  player.team=club.id;
  player.contract={end:s.year+2,salary:Math.round(budgetUnit(s)*(.025+player.skill/2550))};
  player.career.push({year:s.year,team:club.id,role:'Athlete',note});
  club.roster.push(player.id);
}

function replaceStaff(s,team,next,vacancies) {
  if (s.year-team.owner.tenure>24 || team.arrears>1 && next()<.22) {
    const old=team.owner.name;
    team.owner=ownerFor(s,team,next);
    stamp(s,team,'Sale by '+old);
    if (team.arrears > 1) {
      team.cash+=budgetUnit(s)*.20*team.owner.wealth;
      journal(s,'franchise',`New owners take over ${team.name}`,`${team.owner.name} led the bid and injected working capital.`,{team:team.id});
    }
  }
  if (s.year-team.coach.tenure<8 || next()>.39) return;
  const graduate=vacancies.find(p=>p.skill>65&&p.career.some(row=>row.team===team.id));
  const coach=graduate ?? staff(s,team.market,s.sport==='baseball'?'Manager':'Coach',next,team);
  if (graduate) {
    coach.career.push({year:s.year,team:team.id,role:'Coach'});
    vacancies.splice(vacancies.indexOf(graduate),1);
  }
  team.coach={id:coach.id,name:coach.name,skill:coach.skill,tenure:s.year};
}

export function updateTalent(s,next) {
  const teams=activeTeams(s);
  const free=[];
  const graduates=[];
  for (const team of teams) {
    for (const id of [...team.roster]) {
      const p=s.people[id];
      const age=s.year-p.birth;
      p.skill=clamp(p.skill + (age<26?integer(next,0,4):age<31?integer(next,-2,2):integer(next,-5,0)),20,p.peak);
      if (age > 40 || age > 32 && next() < (age-31)*.083) {
        p.retired=s.year;
        release(s,p,team,'Retired');
        p.career.at(-1).role='Retired';
        graduates.push(p);
        if (p.honours.length>=3 || p.honours.length && p.skill>=75) {
          s.hall.push(p.id);
          journal(s,'people',`${p.name} leaves the playing ranks`,`The ${p.pos} retires after ${Object.keys(p.stats).length} recorded seasons and earns a place in the league register.`,{person:id});
        }
      } else if (p.contract.end<s.year && next() < (s.rules.contracts==='free agency'?.35:.095)+(s.labour<40?.13:0)) {
        release(s,p,team,'Contract expired');
        free.push(p);
      } else if (p.contract.end<s.year) {
        p.contract={end:s.year+integer(next,1,3),salary:Math.round(budgetUnit(s)*(.025+p.skill/2550)*s.rules.payroll)};
      }
    }
  }
  for (const p of Object.values(s.people)) {
    if (p.role!=='Athlete'||p.team||p.rival||p.retired||free.includes(p)) continue;
    if (s.year-p.birth>38 || s.year-p.debut>2 && next()<.33) p.retired=s.year;
    else free.push(p);
  }
  const remaining=SPORTS[s.sport].roster;
  const ordered=[...teams].sort((a,b)=>s.rules.draft?(a.record?.w??0)-(b.record?.w??0):b.cash-a.cash);
  free.sort((a,b)=>b.skill-a.skill);
  for (const team of ordered) {
    replaceStaff(s,team,next,graduates);
    const slots=remaining-team.roster.length;
    for (let spot=0;spot<slots;spot++) {
      const usePool=free.length && next()<(s.rules.draft?.31:.48);
      if (usePool) {
        const player=free.splice(integer(next,0,Math.min(free.length-1,8)),1)[0];
        employ(s,player,team,'Signed from the open market');
      } else {
        const player=addAthlete(s,team,next,null,true);
        player.contract.salary=Math.round(player.contract.salary*s.rules.payroll);
        if (s.rules.draft && spot===0) { player.skill=clamp(player.skill+integer(next,3,9),20,player.peak); player.career[0].note='Entry draft'; }
      }
    }
    const average=mean(team.roster.map(id=>s.people[id].skill));
    const investment=clamp((team.cash-team.debt*.4)/budgetUnit(s),-2,3)*2.1;
    team.talent=clamp(team.talent*.74 + average*.26 + investment + integer(next,-5,5),28,91);
  }
}

export function absorbRival(s,league,count,name,next) {
  if (!league || league.status!=='active') return [];
  const members=league.clubs.filter(club=>!s.teams.some(team=>team.status!=='defunct'&&team.market===club.market)&&activeTeams(s).some(team=>distance(CITIES[team.market],CITIES[club.market])<(s.year<1948?850:3250))).slice(0,count);
  if (!members.length) return [];
  league.status='merged';
  league.ended=s.year;
  const origin=league.name;
  for (const club of members) {
    const entered=createFranchise(s,{...club,source:origin},next);
    const recruit=league.recruits?.filter(id=>s.people[id]?.rival===league.id&&!s.people[id].team&&!s.people[id].retired) ?? [];
    for (const id of recruit.slice(0,1)) {
      const p=s.people[id];
      const displaced=s.people[entered.roster.at(-1)];
      if (displaced) release(s,displaced,entered,'Replaced by incoming rival contract');
      p.rival=null;
      employ(s,p,entered,'Contract recognised in merger');
    }
    club.admitted=entered.id;
  }
  for (const id of league.recruits ?? []) if (s.people[id]?.rival===league.id) s.people[id].rival=null;
  if (name) {
    s.name=name;
    s.tag=s.sport==='football'?'NFL':s.sport==='basketball'?'NBA':s.sport==='baseball'?'PBL':'PHL';
    s.leagueNames.push({year:s.year,name});
  }
  s.reserve-=budgetUnit(s)*members.length*.16;
  s.rules.sharing=clamp(s.rules.sharing+.08,0,.75);
  s.rules.authority=clamp(s.rules.authority+.07,0,1);
  s.rules.payroll=Math.max(1,s.rules.payroll);
  s.rules.alignment=activeTeams(s).length>=8?'regional':s.rules.alignment;
  s.popularity=clamp(s.popularity+7,0,100);
  s.labour=clamp(s.labour+5,0,100);
  return members;
}

function rivalPerson(s,market,next,role) {
  return person(s,{name:nameOf(s,next,market),role,birth:s.year-integer(next,38,59),place:cityName(market),career:[]});
}

export function makeRival(s,name,tag,markets,next,founding=false) {
  const id='r'+(++s.ids.rival);
  const first=markets[0];
  const chair=rivalPerson(s,first,next,'Rival president');
  const rival={
    id,name,tag,leader:chair.id,markets,clubs:markets.map(market=>({market,name:suggestedName(s,market,next),founded:s.year,talent:integer(next,42,69),fans:integer(next,25,52)})),
    founded:s.year,ended:null,status:'active',cash:budgetUnit(s)*(founding?1.65:1.15),reputation:founding?40:integer(next,25,43),
    media:0,strategy:choose(next,['Recruit established stars','Undercut the gate','Claim neglected markets']),rules:choose(next,['Open contracts','Regional fixture groups','Independent club scheduling']),
    history:[],recruits:[]
  };
  s.rivals.push(rival);
  return rival;
}

export function rivalRaids(s,rival,next) {
  if (next()>.32 || rival.reputation<31 || rival.cash<budgetUnit(s)*.16) return;
  const teams=activeTeams(s).filter(team=>team.roster.length>4&&team.fans<74);
  const team=choose(next,teams);
  if (!team || s.rules.payroll>1.12&&next()<.53) return;
  const athletes=team.roster.map(id=>s.people[id]).filter(p=>p.contract?.end<=s.year+1&&p.skill>=59);
  const p=choose(next,athletes);
  if (!p) return;
  release(s,p,team,'Signed by '+rival.name);
  p.rival=rival.id;
  p.career.at(-1).role='Rival league';
  rival.recruits.push(p.id);
  rival.cash-=budgetUnit(s)*.084;
  rival.reputation=clamp(rival.reputation+2,0,100);
  addAthlete(s,team,next,null,true);
  journal(s,'rival',`${rival.tag} signs ${p.name}`,`The rival competition lured a ${team.name} player whose contract was nearing its end.`,{team:team.id,person:p.id,rival:rival.id});
}

export function updateRivals(s,candidates,next) {
  const rivals=activeRivals(s);
  const unit=budgetUnit(s);
  for (const rival of rivals) {
    const supported=rival.clubs.reduce((n,club)=>n+marketDemand(s,club.market),0)/Math.max(1,rival.clubs.length);
    const competition=activeTeams(s).filter(team=>rival.markets.includes(team.market)).length;
    const media=s.year<1921?0:s.year<1950?.05:s.year<1975?.22:.52;
    const growth=(supported-.73)*.21+(rival.reputation-32)*.006-competition*.075+media*.28+(next()-.52)*.22;
    rival.cash=clamp(rival.cash+unit*(growth-.088),0,unit*5);
    rival.media=unit*media*rival.reputation/65;
    rival.reputation=clamp(rival.reputation+(supported-.66)*4+integer(next,-4,4)-competition*2,8,88);
    const ranked=rival.clubs.map(club=>({name:club.name,score:club.talent+(next()-.5)*32})).sort((a,b)=>b.score-a.score);
    rival.history.push({year:s.year,cash:Math.round(rival.cash),reputation:Math.round(rival.reputation),champion:ranked[0]?.name??null,clubs:rival.clubs.length});
    if (rival.cash<unit*.19 && s.year-rival.founded>3) {
      rival.status='defunct';
      rival.ended=s.year;
      for (const id of rival.recruits) if (s.people[id]?.rival===rival.id) s.people[id].rival=null;
      journal(s,'rival',`${rival.name} closes`,`The independent competition could no longer finance its fixtures after ${s.year-rival.founded} years.`,{rival:rival.id});
    } else {
      if (rival.cash>unit*.64 && rival.clubs.length<8 && next()<.23 && candidates.length) {
        const available=candidates.filter(c=>!rival.markets.includes(c.id)&&rival.clubs.some(club=>distance(CITIES[club.market],CITIES[c.id])<(s.year<1948?780:1700)));
        const site=choose(next,available.slice(0,5));
        if (site) {
          rival.clubs.push({market:site.id,name:suggestedName(s,site.id,next),founded:s.year,talent:integer(next,43,64),fans:integer(next,30,47)});
          rival.markets.push(site.id);
          rival.cash-=unit*.20;
          journal(s,'rival',`${rival.tag} enters ${site.city}`,`The independent league secured a venue and appointed a local ownership group.`,{rival:rival.id});
        }
      }
      rivalRaids(s,rival,next);
    }
  }
  if (rivals.length>=2 || candidates.length<4 || s.rivals.some(rival=>s.year-rival.founded<4) || next()>.14+(s.popularity>60?.08:0)+(s.rules.authority<.33?.04:0)) return;
  const anchor=choose(next,candidates.slice(0,11));
  const radius=s.year<1950?850:1400;
  const others=candidates.filter(c=>c.id!==anchor.id&&distance(CITIES[anchor.id],CITIES[c.id])<radius);
  if (others.length<2) return;
  const region=CITIES[anchor.id].lon<-101?'Pacific':CITIES[anchor.id].lon<-85?'Continental':CITIES[anchor.id].lat>42?'Northern':'Eastern';
  const prefix=choose(next,[region,'Independent','American','Intercity','United','Federal']);
  const sport=({baseball:'Base Ball',football:'Football',basketball:'Basketball',hockey:'Hockey'})[s.sport];
  const suffix=choose(next,['Association','League','Union','Circuit']);
  const full=`${prefix} ${sport} ${suffix}`;
  const name=s.rivals.some(rival=>rival.name===full)?`${full} of ${s.year}`:full;
  const id=prefix[0]+sport[0]+suffix[0];
  const challenger=makeRival(s,name,id,[anchor.id,...others.slice(0,3).map(c=>c.id)],next);
  journal(s,'rival',`${name} launches`,`Investors in ${challenger.markets.map(cityName).join(', ')} are backing a rival circuit. Its strategy is to ${challenger.strategy.toLowerCase()}.`,{rival:challenger.id});
}
