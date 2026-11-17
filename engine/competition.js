import { CITIES, SPORTS } from './data.js';
import { activeTeams, byId, gateForecast } from './world.js';
import { clamp, distance, integer, mean, normal, poisson, shuffle } from './random.js';

export const STAT_FIELDS = {
  baseball:[['hits','H'],['atBats','AB'],['homeRuns','HR'],['strikeouts','SO'],['outs','IP outs'],['earned','ER']],
  football:[['passYds','Pass Yds'],['rushYds','Rush Yds'],['td','TD'],['ints','INT'],['tackles','Tkl']],
  basketball:[['points','PTS'],['rebounds','REB'],['assists','AST'],['made','FG'],['attempts','FGA']],
  hockey:[['goals','G'],['assists','A'],['saves','SV'],['shots','SA'],['pim','PIM']]
};
export const availableStats = (sport,year) => STAT_FIELDS[sport].filter(([key])=>
  (key !== 'rebounds' || year >= 1950) && (key !== 'tackles' || year >= 1975) && (!['saves','shots'].includes(key) || year >= 1955)
);

export function emptyRecord(team) {
  return { id:team.id, g:0, w:0, l:0, t:0, for:0, against:0, home:0, attendance:0, miles:0, firstW:0, firstG:0, lastW:0, lastG:0, streak:0, best:0, division:team.division };
}

export function effectiveGames(s) {
  const config = SPORTS[s.sport];
  const desired = s.rules.games;
  const shock = s.year === 2020 ? .70 : s.strikeThrough >= s.year ? .80 : 1;
  const recovery = s.year === config.start && s.sport === 'football' ? .79 : 1;
  return Math.max(4,Math.round(desired * shock * recovery));
}

export function buildSchedule(teams,next,desired,rules = {}) {
  const original = shuffle(next,teams.map(team=>team.id));
  const ids = [...original];
  if (ids.length % 2) ids.push(null);
  if (ids.length < 2) return [];
  const rounds = [];
  for (let round = 0; round < ids.length - 1; round++) {
    const games = [];
    for (let p = 0; p < ids.length / 2; p++) {
      const a = ids[p];
      const b = ids[ids.length - 1 - p];
      if (a && b) games.push([a,b]);
    }
    rounds.push(games);
    ids.splice(1,0,ids.pop());
  }
  const games = [];
  const counts = Object.fromEntries(original.map(id=>[id,0]));
  const home = {...counts};
  const needed = Math.floor(original.length * desired / 2);
  const stats = Object.fromEntries(original.map(id=>[id,teams.find(team=>team.id===id)]));
  const rivalryRound = rounds.filter(round => round.some(([a,b])=>stats[a].division && stats[a].division === stats[b].division));
  let turn = 0;
  while (games.length < needed) {
    let source = rounds[turn % rounds.length];
    if (original.length % 2 === 0 && rules.alignment === 'regional' && rules.format !== 'split' && turn >= rounds.length && rivalryRound.length && turn % 4 === 0) source = rivalryRound[Math.floor(turn / 4) % rivalryRound.length];
    for (const [a,b] of source) {
      if (games.length === needed) break;
      const aHome = home[a] / (counts[a] || 1);
      const bHome = home[b] / (counts[b] || 1);
      const isAHome = aHome === bHome ? next() < .5 : aHome < bHome;
      const homeId = isAHome ? a : b;
      home[homeId]++;
      counts[a]++;
      counts[b]++;
      games.push([homeId,isAHome ? b : a]);
    }
    turn++;
  }
  return games;
}

export function standings(records, division = null) {
  return records.filter(r=>!division || r.division===division).sort((a,b)=>{
    return (b.w + b.t*.5)/Math.max(1,b.g) - (a.w + a.t*.5)/Math.max(1,a.g) ||
      (b.for-b.against) - (a.for-a.against) || b.w-a.w || a.id.localeCompare(b.id);
  });
}

function scoring(s,next,spread,postseason) {
  const yr = s.year;
  if (s.sport === 'baseball') {
    const baseline = yr < 1885 ? 5.8 : yr < 1920 ? 3.65 : 4.45;
    const h = poisson(next,clamp(baseline+.32+spread*.095,.85,13));
    const a = poisson(next,clamp(baseline-spread*.095,.85,13));
    if (h !== a) return [h,a];
    return next() < clamp(.535 + spread*.009,.15,.85) ? [h+1,a] : [h,a+1];
  }
  if (s.sport === 'hockey') {
    const baseline = yr < 1925 ? 4.35 : yr < 1945 ? 2.8 : yr < 1995 ? 3.55 : 2.93;
    const h = poisson(next,clamp(baseline+.17+spread*.062,.8,9));
    const a = poisson(next,clamp(baseline-spread*.062,.8,9));
    if (h !== a || (s.rules.ties && !postseason)) return [h,a];
    return next() < clamp(.54 + spread*.009,.15,.85) ? [h+1,a] : [h,a+1];
  }
  if (s.sport === 'football') {
    const late = clamp((yr-1920)/65,0,1);
    const build = shift => poisson(next,clamp(1.47+1.28*late+shift,.24,6)) * 7 + poisson(next,.51+late*.94) * 3 + (next() < .026 ? 2 : 0);
    const h = build(.13+spread*.059);
    const a = build(-spread*.059);
    if (h !== a || (s.rules.ties && !postseason && next() < (s.rules.overtime ? .17 : .88))) return [h,a];
    return next() < clamp(.54 + spread*.012,.15,.85) ? [h+3,a] : [h,a+3];
  }
  const baseline = yr < 1955 && !s.rules.pace ? 69 + (yr-1946)*1.18 : yr < 1970 ? 99 : yr < 1994 ? 107 : yr < 2015 ? 98 : 110;
  const h = Math.round(baseline + (s.rules.pace ? 4 : 0) + 2.8 + spread*.66 + normal(next)*10);
  const a = Math.round(baseline + (s.rules.pace ? 4 : 0) - spread*.66 + normal(next)*10);
  if (h !== a) return [h,a];
  return next() < clamp(.55 + spread*.012,.17,.86) ? [h+integer(next,1,9),a] : [h,a+integer(next,1,9)];
}

function lineup(s,team,next) {
  return team.roster.map(id=>s.people[id]).filter(p=>{
    const age = s.year - p.birth;
    return next() > p.fragility * (age > 33 ? .20 : .10) * (s.year >= 1942 && s.year <= 1945 ? 1.32 : 1);
  });
}

function lineFor(player,s,team) {
  const season = player.stats[s.year] ??= {};
  return season[team.id] ??= { games:0 };
}

function add(line,key,value) {
  if (value > 0) line[key] = (line[key] ?? 0) + value;
}

function shares(total,players,next,weight) {
  if (!players.length) return [];
  const rows = players.map(p=>[p,Math.max(.04,weight(p))*(.6+.8*next())]);
  const denominator = rows.reduce((sum,row)=>sum+row[1],0);
  let cum = 0;
  let used = 0;
  return rows.map(([player,w])=>{
    cum += w;
    const to = Math.round(cum*total/denominator);
    const portion = to-used;
    used = to;
    return [player,portion];
  });
}

function playerStats(s,team,players,score,opponent,next) {
  const yr = s.year;
  const lines = new Map(players.map(p=>[p,lineFor(p,s,team)]));
  for (const line of lines.values()) line.games++;
  const record = (p,key,amount) => { if (p) add(lines.get(p),key,amount); };
  if (s.sport === 'basketball') {
    for (const [p,pts] of shares(score,players,next,p=>p.skill/75 * (['SG','SF','PF'].includes(p.pos) ? 1.23 : .88))) {
      const made = Math.floor(pts * (.38 + .11*next()));
      record(p,'points',pts);
      record(p,'made',made);
      record(p,'attempts',Math.round(made/(yr<1950 ? .32+next()*.10 : .42+next()*.14)) + integer(next,0,3));
      if (yr>=1950) record(p,'rebounds',integer(next,1,['PF','C'].includes(p.pos)?12:7));
      record(p,'assists',integer(next,0,['PG','G','SG'].includes(p.pos)?10:5));
    }
  } else if (s.sport === 'hockey') {
    for (const [p,goals] of shares(score,players.filter(p=>p.pos!=='G'),next,p=>p.skill/70 * (p.pos==='D' ? .35 : 1))) record(p,'goals',goals);
    for (const [p,assists] of shares(Math.round(score*(.85+.6*next())),players.filter(p=>p.pos!=='G'),next,p=>p.skill/75)) record(p,'assists',assists);
    for (const p of players.filter(p=>p.pos!=='G')) if (next() < .29) record(p,'pim',next() < .1 ? 5 : 2);
    const g = players.find(p=>p.pos==='G');
    if (yr >= 1955 && g) {
      const shots = opponent + integer(next,16,38);
      record(g,'shots',shots);
      record(g,'saves',shots-opponent);
    }
  } else if (s.sport === 'football') {
    const qb = players.find(p=>p.pos==='QB') ?? players.find(p=>p.pos==='HB');
    if (qb) {
      record(qb,'passYds',Math.round(clamp((yr<1935 ? 52 : yr<1960 ? 136 : 218) + score*1.45 + normal(next)*54,0,490)));
      if (next()<.50) record(qb,'ints',integer(next,1,3));
    }
    const runners = players.filter(p=>['HB','FB','QB'].includes(p.pos));
    for (const [p,yds] of shares(integer(next,42,171) + score,runners,next,p=>p.skill*(p.pos==='QB'?.26:1))) record(p,'rushYds',yds);
    for (const [p,tds] of shares(Math.floor(score/7),players.filter(p=>['E','HB','FB','QB'].includes(p.pos)),next,p=>p.skill)) record(p,'td',tds);
    if (yr>=1975) for (const p of players.filter(p=>['LB','T','G'].includes(p.pos))) record(p,'tackles',integer(next,1,11));
  } else {
    for (const p of players) {
      const attempts = integer(next,3,5);
      const average = clamp(.18 + (p.skill-44)*.002 + score*.007,.13,.45);
      let hits = 0;
      for (let atBat=0;atBat<attempts;atBat++) if (next()<average) hits++;
      record(p,'atBats',attempts);
      record(p,'hits',hits);
      if (hits && next() < (yr<1920 ? .045 : .155)*hits) record(p,'homeRuns',1);
    }
    const pitcher = players.find(p=>p.pos==='P');
    if (pitcher) {
      record(pitcher,'outs',yr<1900 ? integer(next,23,27) : integer(next,12,27));
      record(pitcher,'earned',Math.max(0,opponent-integer(next,0,yr<1900?3:2)));
      record(pitcher,'strikeouts',integer(next,yr<1883?0:1,yr<1883?4:10));
    }
  }
}

function updateRecord(record,own,other,home,crowd,miles,early,tiesCount) {
  record.g++;
  record.for += own;
  record.against += other;
  record.attendance += home ? crowd : 0;
  record.home += home ? 1 : 0;
  record.miles += home ? 0 : miles;
  if (own > other) { record.w++; record.streak = Math.max(0,record.streak)+1; record.best=Math.max(record.streak,record.best); }
  else if (own < other) { record.l++; record.streak = Math.min(0,record.streak)-1; }
  else { record.t++; record.streak=0; }
  const score = own > other ? 1 : own === other && tiesCount ? .5 : 0;
  if (early) { record.firstG++; record.firstW += score; }
  else { record.lastG++; record.lastW += score; }
}

function actualGame(s,home,away,next,{isPost=false,early=false,index=0}={}) {
  const miles = Math.round(distance(CITIES[home.market],CITIES[away.market]));
  const hPlayers = lineup(s,home,next);
  const aPlayers = lineup(s,away,next);
  const merit = (team,players) => team.talent*.40 + (mean(players.map(p=>p.skill)) || 41)*.38 + team.coach.skill*.20 + clamp(team.cash/2000000,-3,6);
  const fatigue = miles / (s.year < 1948 ? 390 : 1000);
  const spread = merit(home,hPlayers)-merit(away,aPlayers)+fatigue+(home.roster.length-away.roster.length)*.28;
  const [h,a] = scoring(s,next,spread,isPost);
  const crowd = clamp(Math.round(home.capacity*gateForecast(s,home)*(.81+.38*next()+(isPost?.25:0)+((home.rivalries[away.id]??0)>8?.10:0))),0,home.capacity);
  if (!isPost) {
    updateRecord(home.record,h,a,true,crowd,miles,early,s.sport==='hockey');
    updateRecord(away.record,a,h,false,crowd,miles,early,s.sport==='hockey');
    playerStats(s,home,hPlayers,h,a,next);
    playerStats(s,away,aPlayers,a,h,next);
    if (next() < .12 || Math.abs(h-a) < 2) {
      home.rivalries[away.id] = (home.rivalries[away.id] ?? 0) + 1;
      away.rivalries[home.id] = (away.rivalries[home.id] ?? 0) + 1;
    }
  }
  return [home.id,away.id,h,a,crowd,index];
}

export function startCompetition(s,next) {
  const teams = activeTeams(s);
  s.current.members = teams.map(team=>({id:team.id,name:team.name,market:team.market,color:team.color,code:team.code,division:team.division}));
  for (const team of teams) team.record = emptyRecord(team);
  s.current.schedule = buildSchedule(teams,next,effectiveGames(s),s.rules);
}

export function playMonth(s,next) {
  const config = SPORTS[s.sport];
  if (!s.current.schedule) startCompetition(s,next);
  const dates = s.current.schedule;
  const progress = (s.phase-config.first+1)/config.play;
  const target = Math.min(dates.length, Math.round(dates.length*progress));
  while (s.current.matches.length<target) {
    const index=s.current.matches.length;
    const [h,a]=dates[index];
    const match=actualGame(s,byId(s,h),byId(s,a),next,{early:index<dates.length/2,index:s.phase});
    s.current.matches.push(match);
  }
}

function playSeries(s,next,a,b,round,length,aggregate=false) {
  if (!a || !b) return a ?? b;
  if (a.id === b.id) return a;
  const teams = [byId(s,a.id),byId(s,b.id)];
  const wins = [0,0];
  const goals=[0,0];
  const matches=[];
  for (let game=0; game<length && (aggregate || Math.max(...wins)<=length/2);game++) {
    const home=game%2;
    const match=actualGame(s,teams[home],teams[1-home],next,{isPost:true,index:s.phase});
    matches.push(match);
    goals[home]+=match[2];
    goals[1-home]+=match[3];
    wins[match[2]>match[3]?home:1-home]++;
  }
  if (aggregate && goals[0]===goals[1]) {
    const tiebreak=actualGame(s,teams[0],teams[1],next,{isPost:true,index:s.phase});
    matches.push(tiebreak);
    goals[0]+=tiebreak[2];
    goals[1]+=tiebreak[3];
  }
  const tally=aggregate?goals:wins;
  const winner=tally[0]>tally[1]?a:b;
  s.current.bracket.push({round,a:a.id,b:b.id,tally,winner:winner.id,matches,aggregate});
  return winner;
}

export function decideChampion(s,next) {
  const raw=activeTeams(s).map(team=>team.record);
  const ranked=standings(raw);
  if (!ranked.length) return null;
  if (s.rules.format==='split') {
    const leaders = ['first','last'].map(half=>[...raw].sort((a,b)=>b[half+'W']/Math.max(1,b[half+'G'])-a[half+'W']/Math.max(1,a[half+'G']) || ranked.indexOf(a)-ranked.indexOf(b))[0]);
    return playSeries(s,next,leaders[0],leaders[1],'League final',2,true);
  }
  if (s.rules.format==='divisional') {
    const east=standings(raw,'East');
    const west=standings(raw,'West');
    if (east.length>1 && west.length>1) {
      const high=playSeries(s,next,east[0],west[0],'Division winners',7);
      const second=playSeries(s,next,east[1],west[1],'Quarterfinal',3);
      const third=playSeries(s,next,east[2],west[2],'Quarterfinal',3);
      const other=playSeries(s,next,second,third,'Semifinal',3);
      return playSeries(s,next,high,other,'Final',7);
    }
  }
  if (['playoff','divisional','wildcard'].includes(s.rules.format)) {
    let qualifiers=ranked.slice(0,s.rules.format==='wildcard'?8:4);
    if (s.rules.alignment==='regional' && s.rules.format!=='divisional') {
      const chiefs=['East','West'].map(division=>standings(raw,division)[0]).filter(Boolean);
      qualifiers=[...new Set([...chiefs,...ranked])].slice(0,s.rules.format==='wildcard'?8:4);
    }
    const length=s.sport==='football'?1:s.rules.format==='wildcard'?7:5;
    let previous = qualifiers.length;
    for (let size = qualifiers.length > 4 ? 8 : 4;size>1;size/=2) {
      const winners=[];
      for (let i=0;i<size/2;i++) {
        const round=size===2?'Final':size===4?'Semifinal':'Quarterfinal';
        const champion=playSeries(s,next,qualifiers[i],qualifiers[size-i-1],round,size===2&&s.sport!=='football'?7:length);
        if (champion) winners.push(champion);
      }
      previous=qualifiers.length;
      qualifiers=winners;
      if (qualifiers.length===1 || previous===0) break;
    }
    return qualifiers[0] ?? ranked[0];
  }
  return ranked[0];
}
