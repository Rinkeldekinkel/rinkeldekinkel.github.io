import { CITIES, DIFFICULTIES, LAST_YEAR, SPORTS, VERSION } from './data.js';
import { FORMATS } from './politics.js';

const assert=(condition,text)=>{ if (!condition) throw new Error(text); };
const object = value => value && typeof value==='object' && !Array.isArray(value);
const finite=(v)=>typeof v==='number'&&Number.isFinite(v);
const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const id=(v,prefix)=>typeof v==='string'&&new RegExp('^'+prefix+'[1-9][0-9]*$').test(v);
const keys=(o,list)=>object(o)&&list.every(k=>Object.hasOwn(o,k));
const boundedString=(v,max)=>typeof v==='string'&&v.length<=max;
const failure='This save contains an inconsistent league record.';

export function validateGame(s,{verifyMatches=true}={}) {
  assert(object(s)&&s.version===VERSION,'This save format is unsupported.');
  assert(Object.hasOwn(SPORTS,s.sport)&&Object.hasOwn(DIFFICULTIES,s.difficulty),'This save uses an unknown sport or difficulty.');
  const start=SPORTS[s.sport].start;
  assert(int(s.year,start,LAST_YEAR)&&int(s.phase,0,11)&&int(s.random,0,4294967295)&&['running','completed','collapsed'].includes(s.status)&&boundedString(s.name,200)&&boundedString(s.tag,16)&&boundedString(s.seed,100),failure);
  assert(finite(s.reserve)&&[s.popularity,s.labour,s.approval].every(n=>finite(n)&&n>=0&&n<=100),failure);
  assert(keys(s.rules,['authority','threshold','sharing','games','broadcast','access','contracts'])&&Object.hasOwn(FORMATS,s.rules.format)&&int(s.rules.games,4,200),failure);
  assert(Object.values(s.rules).filter(v=>typeof v==='number').every(finite),failure);
  assert(keys(s.settings,['mode','pauseMajor','inflation'])&&['active','hybrid','observer'].includes(s.settings.mode),failure);
  assert(keys(s.ids,['team','person','rival','event','decision'])&&Object.values(s.ids).every(n=>int(n,0,10000000)),failure);
  assert(Array.isArray(s.teams)&&Array.isArray(s.events)&&Array.isArray(s.rivals)&&Array.isArray(s.decisions)&&Array.isArray(s.commissioners)&&s.commissioners.length>0&&Array.isArray(s.leagueNames)&&Array.isArray(s.hall)&&Array.isArray(s.aiProposals)&&object(s.annotations),failure);
  assert(object(s.people)&&object(s.seasons)&&object(s.current)&&keys(s.metrics,['games','titleCount']),failure);
  const teamIds=new Set(s.teams.map(t=>t.id));
  assert(teamIds.size===s.teams.length&&[...teamIds].every(t=>id(t,'t')&&Number(t.slice(1))<=s.ids.team),failure);
  const rosters=new Set();
  for (const team of s.teams) {
    assert(Object.hasOwn(CITIES,team.market)&&['active','defunct','suspended'].includes(team.status)&&[team.cash,team.debt,team.talent,team.fans,team.capacity].every(finite)&&team.cash>=0&&team.debt>=0&&team.capacity>=0&&boundedString(team.name,200),failure);
    assert(Array.isArray(team.roster)&&Array.isArray(team.lineage)&&team.lineage.length&&Array.isArray(team.titles)&&keys(team.owner,['id','trust','name','priority'])&&['Profit','Prestige','Home market','Player welfare','Influence'].includes(team.owner.priority)&&team.coach&&object(team.ledger)&&object(team.records)&&object(team.rivalries),failure);
    assert(team.status==='active'||team.roster.length===0,failure);
    for (const row of team.lineage) assert(int(row.year,start,s.year)&&Object.hasOwn(CITIES,row.market)&&boundedString(row.name,200),failure);
    for (const p of team.roster) {
      const player=s.people[p];
      assert(!rosters.has(p)&&player?.team===team.id&&player.role==='Athlete'&&object(player.contract)&&finite(player.contract.salary)&&!player.rival&&!player.retired,'An athlete is assigned to multiple teams or has an invalid contract.');
      rosters.add(p);
    }
    for (const value of Object.values(team.ledger)) assert(object(value)&&Object.values(value).every(finite),'A franchise financial record contains invalid values.');
  }
  for (const [pid,player] of Object.entries(s.people)) {
    assert(id(pid,'p')&&pid===player.id&&Number(pid.slice(1))<=s.ids.person&&boundedString(player.name,150)&&int(player.birth,1800,s.year)&&Array.isArray(player.career),failure);
    if (player.role==='Athlete') {
      assert((player.team===null||rosters.has(pid))&&object(player.stats)&&Array.isArray(player.honours)&&finite(player.skill)&&finite(player.fragility),failure);
      for (const [year,stats] of Object.entries(player.stats)) {
        assert(int(+year,start,s.year)&&object(stats),failure);
        for (const [club,line] of Object.entries(stats)) assert(teamIds.has(club)&&object(line)&&Object.values(line).every(n=>int(n,0,10000000)),failure);
      }
    }
  }
  const rivalIds=new Set(s.rivals.map(r=>r.id));
  assert(rivalIds.size===s.rivals.length,failure);
  for (const rival of s.rivals) {
    assert(id(rival.id,'r')&&boundedString(rival.name,200)&&['active','defunct','merged'].includes(rival.status)&&finite(rival.cash)&&Array.isArray(rival.clubs)&&Array.isArray(rival.history)&&Array.isArray(rival.recruits),failure);
    for (const club of rival.clubs) assert(Object.hasOwn(CITIES,club.market)&&boundedString(club.name,200)&&(!club.admitted||teamIds.has(club.admitted)),failure);
  }
  const membersOf=members=>{
    assert(Array.isArray(members)&&members.length<=40,failure);
    const list=new Set();
    for (const m of members) {
      assert(teamIds.has(m.id)&&!list.has(m.id)&&Object.hasOwn(CITIES,m.market)&&boundedString(m.name,200),failure);
      list.add(m.id);
    }
    return list;
  };
  const validMatch=(match,members)=>{
    assert(Array.isArray(match)&&match.length===6&&members.has(match[0])&&members.has(match[1])&&match[0]!==match[1]&&int(match[2],0,300)&&int(match[3],0,300)&&int(match[4],0,250000)&&int(match[5],0,11),'A fixture contains an invalid matchup, score or date.');
  };
  const validSeries=(list,members)=>{
    assert(Array.isArray(list),failure);
    for (const series of list) {
      assert(members.has(series.a)&&members.has(series.b)&&[series.a,series.b].includes(series.winner)&&Array.isArray(series.matches),failure);
      if (verifyMatches) series.matches.forEach(m=>validMatch(m,members));
    }
  };
  const current=membersOf(s.current.members);
  assert(Array.isArray(s.current.matches)&&(s.current.schedule===null||Array.isArray(s.current.schedule))&&Array.isArray(s.current.worldYears)&&int(s.current.special,0,2),failure);
  if (verifyMatches) {
    for (const [home,away] of s.current.schedule ?? []) assert(current.has(home)&&current.has(away)&&home!==away,failure);
    for (const [index,match] of s.current.matches.entries()) {
      validMatch(match,current);
      assert(s.current.schedule?.[index]?.[0]===match[0]&&s.current.schedule?.[index]?.[1]===match[1],failure);
    }
  }
  validSeries(s.current.bracket,current);
  let n=0;
  for (const [year,row] of Object.entries(s.seasons)) {
    assert(int(+year,start,s.year)&&+year===row.year&&Array.isArray(row.records)&&Array.isArray(row.matches),failure);
    assert(!row.finance||Object.values(row.finance).every(finite),failure);
    const members=membersOf(row.members);
    assert(row.champion===null?row.partial:members.has(row.champion)&&s.teams.find(t=>t.id===row.champion).titles.includes(+year),'A championship does not match the recorded franchises.');
    assert(!row.runnerUp||(members.has(row.runnerUp)&&row.runnerUp!==row.champion),failure);
    let totalGames=0;
    for (const line of row.records) {
      assert(members.has(line.id)&&int(line.g,0,250)&&[line.w,line.l,line.t].every(v=>int(v,0,250))&&line.w+line.l+line.t===line.g,failure);
      totalGames+=line.g;
    }
    assert(totalGames===row.matches.length*2,failure);
    validSeries(row.bracket,members);
    if (verifyMatches) {
      const counts=new Map([...members].map(t=>[t,[0,0,0,0,0]]));
      for (const match of row.matches) {
        validMatch(match,members);
        const [h,a,x,y]=match;
        const hLine=counts.get(h);
        const aLine=counts.get(a);
        hLine[x>y?0:x<y?1:2]++; aLine[y>x?0:y<x?1:2]++;
        hLine[3]+=x; hLine[4]+=y; aLine[3]+=y; aLine[4]+=x;
      }
      assert(row.records.every(r=>counts.get(r.id).every((value,i)=>value===[r.w,r.l,r.t,r.for,r.against][i])),failure);
    }
    if (row.champion) n++;
  }
  assert(s.metrics.titleCount===n,failure);
  for (const team of s.teams) for (const year of team.titles) assert(s.seasons[year]?.champion===team.id,failure);
  for (const e of s.events) assert(id(e.id,'e')&&int(e.year,start,s.year)&&int(e.phase,0,11)&&boundedString(e.title,500)&&boundedString(e.text,5000),failure);
  if (s.pending) assert(id(s.pending.id,'d')&&Array.isArray(s.pending.choices)&&s.pending.choices.length>=2&&s.pending.choices.every(c=>boundedString(c.label,300)&&object(c.action)&&boundedString(c.action.type,40)),failure);
  return s;
}

export function migrateGame(game) {
  if (!object(game)) throw new Error('This file does not contain a league save.');
  if (game.version===1) {
    game={...game,version:2,aiProposals:[],annotations:game.annotations??{},settings:{inflation:false,...game.settings}};
  }
  return validateGame(game);
}

export function exportGame(game,name) {
  return JSON.stringify({format:'sports-league-commissioner',schema:VERSION,name,game});
}

export function parseSave(text) {
  if (typeof text!=='string'||text.length>64*1024*1024) throw new Error('Save exports must be smaller than 64 MB.');
  let data;
  try { data=JSON.parse(text); }
  catch { throw new Error('This file contains invalid JSON.'); }
  if (data.format!=='sports-league-commissioner'||!int(data.schema,1,VERSION)||data.game?.version!==data.schema) throw new Error('This file is not a supported Commissioner save.');
  return {game:migrateGame(data.game),name:typeof data.name==='string'?data.name.slice(0,80):data.game.name};
}
