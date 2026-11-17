import { CITIES, DIFFICULTIES, NAMES, SPORTS, WORLD_EVENTS } from './data.js';
import { clamp, distance, interpolate, mean, round } from './random.js';

const CPI_YEARS = [1876,1900,1917,1920,1933,1942,1950,1960,1970,1980,1990,2000,2010,2020,2026];
const CPI_LEVELS = [12,8.4,12.8,20,13,16.3,24.1,29.6,38.8,82.4,130.7,172.2,218.1,258.8,331];
export const inflation = year => interpolate(year, CPI_YEARS, CPI_LEVELS) / CPI_LEVELS.at(-1);
export const money = (real,year) => round(real * inflation(year));
export const population = (city,year) => Math.max(0,Math.round(interpolate(year,[1880,1920,1960,2000,2026],city.pop) * 1000));
export const activeTeams = s => s.teams.filter(team => team.status === 'active');
export const activeRivals = s => s.rivals.filter(rival => rival.status === 'active');
export const byId = (s,id) => s.teams.find(team => team.id === id);
export const normalCapacity = (sport,year) => SPORTS[sport].size * interpolate(year,[1876,1910,1940,1960,1990,2026],[.34,.50,.66,1,1.42,1.7]);
export const budgetUnit = s => SPORTS[s.sport].cost * (s.sport==='football'
  ? interpolate(s.year,[1920,1946,1965,1985,2005,2026],[.18,.39,1.20,3.90,8.8,16.5])
  : interpolate(s.year,[1876,1917,1946,1965,1985,2005,2026],[.62,.86,1.22,1.84,3.90,8.8,16.5]));

export function era(year) {
  if (year < 1900) return 'The Gilded Age';
  if (year < 1919) return 'The Progressive Era';
  if (year < 1929) return 'The Radio Age';
  if (year < 1940) return 'The Depression Era';
  if (year < 1946) return 'The War Years';
  if (year < 1960) return 'The Television Age';
  if (year < 1980) return 'The Expansion Era';
  if (year < 2000) return 'The Cable Age';
  if (year < 2012) return 'The Internet Age';
  return 'The Streaming Era';
}

export function cityName(market) {
  const c = CITIES[market];
  return c ? c.name : 'Unknown market';
}

export function dateOf(s) {
  const offset = SPORTS[s.sport].month - 1 + s.phase;
  return { year:s.year + Math.floor(offset / 12), month:offset % 12 + 1, day:s.status==='completed' ? 31 : s.phase === 0 && s.year === SPORTS[s.sport].start ? SPORTS[s.sport].day : 1 };
}

export function seasonLabel(sport,year) {
  return ['basketball','hockey'].includes(sport) ? `${year}–${String(year+1).slice(-2)}` : String(year);
}

export function historicalConditions(s) {
  const year = dateOf(s).year;
  const event = WORLD_EVENTS.find(item => item[0] === year);
  const depression = year > 1930 && year < 1938;
  const war = year > 1941 && year < 1946;
  return {
    event,
    demand:event?.[3] ?? (depression ? .86 : war ? .92 : 1),
    payroll:event?.[4] ?? (war ? 1.08 : 1),
    travel:(event?.[5] ?? (war ? 1.17 : 1)) * (year < 1948 ? 1.35 : year < 1960 ? 1.01 : .60),
    technology:year < 1921 ? 'Rail' : year < 1948 ? 'Rail & bus' : year < 1958 ? 'Propeller flight' : 'Jet travel',
    media:year < 1921 ? 'The press' : year < 1952 ? 'Radio' : year < 1980 ? 'Television' : year < 2012 ? 'Cable & television' : 'Streaming & television',
    mediaFactor:interpolate(year,[1876,1921,1946,1960,1985,2005,2026],[0,.025,.105,.42,1.53,3.1,5.7]) + (event?.[6] ?? 0)
  };
}

export function nameOf(s,next,market) {
  const year = s.year;
  const first = NAMES.first;
  let given;
  if (year < 1935) given = first[Math.floor(next() * 32)];
  else if (['montreal','quebec'].includes(market) && next() < .44) given = first[20 + Math.floor(next() * 5)];
  else given = first[Math.floor(next() * (year < 1970 ? 41 : first.length))];
  return `${given} ${NAMES.last[Math.floor(next() * NAMES.last.length)]}`;
}

function marketAffinity(s,city) {
  if (s.sport === 'hockey') return clamp((city.lat - 27) * .033 + (['ON','QC','BC','MB','AB'].includes(city.region) ? .30 : 0),.33,1.16);
  if (s.sport === 'football') return ['OH','IN','IL','PA','MI','TX','WI'].includes(city.region) ? 1.13 : ['ON','QC','BC','MB','AB','MX'].includes(city.region) ? .60 : .95;
  if (s.sport === 'basketball') return ['MA','IN','NY','IL','OH','CA','KY'].includes(city.region) ? 1.13 : .95;
  return ['NY','MA','PA','IL','MO','CA','MX'].includes(city.region) ? 1.12 : .96;
}

export function marketDemand(s,id) {
  const city = CITIES[id];
  return clamp((Math.log2(1 + population(city,s.year) / 24000) * .105 + .24) * marketAffinity(s,city),.22,1.35);
}

export function marketCandidates(s,exclude = null,rival = false) {
  const teams = activeTeams(s).filter(team => team.id !== exclude);
  const currentMarket = exclude ? byId(s,exclude)?.market : null;
  const occupiers = new Set(s.teams.filter(team => team.status !== 'defunct' && team.id !== exclude).map(team=>team.market));
  const contested = new Set(activeRivals(s).flatMap(league => league.clubs.map(club => club.market)));
  const maxHop = s.year < 1920 ? (s.sport === 'hockey' ? 520 : 720) : s.year < 1947 ? 850 : s.year < 1958 ? 1350 : 3300;
  return Object.values(CITIES).flatMap(city => {
    if (city.id===currentMarket || occupiers.has(city.id) || (city.region === 'MX' && s.year < 1980)) return [];
    if (!rival && (city.id === 'newyork' && occupiers.has('brooklyn') || city.id === 'brooklyn' && occupiers.has('newyork'))) return [];
    const pop = population(city,s.year);
    if (pop < (s.year < 1935 ? 39000 : 85000)) return [];
    const nearest = Math.min(...teams.map(team => distance(city,CITIES[team.market])),maxHop * 3);
    if (!rival && nearest > maxHop) return [];
    if (rival && contested.has(city.id)) return [];
    if (!rival && nearest < 55 && !['jerseycity','brooklyn','stpaul'].includes(city.id)) return [];
    const demand = marketDemand(s,city.id);
    if (demand < .40) return [];
    const score = demand + Math.log10(pop) * .055 - (rival ? 0 : nearest/maxHop * .31) - (contested.has(city.id) ? .17 : 0);
    return [{id:city.id,city:city.name,pop,nearest:Math.round(nearest),score,contested:contested.has(city.id)}];
  }).sort((a,b) => b.score - a.score);
}

export function suggestedName(s,market,next) {
  const city = CITIES[market];
  const group = s.year < 1900 ? [0,0,1] : s.year < 1950 ? [0,1,1] : [1,2,2];
  const index = group[Math.floor(next() * group.length)];
  const distinct = city.names.map(nickname=>`${city.name} ${nickname}`).filter(name=>!s.teams.some(team=>team.lineage.some(row=>row.name === name)));
  return distinct.includes(`${city.name} ${city.names[index]}`) ? `${city.name} ${city.names[index]}` : distinct[0] ?? `${city.name} Athletic ${s.year}`;
}

export function health(s) {
  const teams = activeTeams(s);
  const costs = budgetUnit(s);
  const cash = teams.map(team=>team.cash / costs);
  const debts = teams.map(team=>team.debt / costs);
  const distressed = teams.filter(team=>team.debt > costs * 1.05 || team.cash < costs * .10).length;
  const liquidity = mean(cash.map(value=>clamp(value,0,2)));
  const value = clamp(Math.round(49 + liquidity * 16 - mean(debts) * 21 - (distressed / Math.max(1,teams.length)) * 18 + s.reserve / (costs * Math.max(1,teams.length)) * 12),0,100);
  return { value, distressed, debt:debts.length ? teams.reduce((total,team)=>total+team.debt,0) : 0, liquidity };
}

export function gateForecast(s,team) {
  const diff = DIFFICULTIES[s.difficulty];
  const world = historicalConditions(s);
  const market = marketDemand(s,team.market);
  const recent = team.record?.g ? (team.record.w + team.record.t * .5) / team.record.g : .52;
  const rivalry = activeRivals(s).some(league=>league.clubs.some(club=>club.market===team.market)) ? .86 : 1;
  const share = clamp(.215 + team.fans * .0042 + s.popularity * .004 + (recent - .5) * .20 + (market - .75) * .43, .12, .95);
  return share * world.demand * diff.demand * rivalry * (s.year <= s.strikeThrough ? .76 : 1) * s.rules.access;
}

export function account(s,team,next) {
  const d = SPORTS[s.sport];
  const world = historicalConditions(s);
  const diff = DIFFICULTIES[s.difficulty];
  const unit = budgetUnit(s);
  const record = team.record;
  const size = Math.max(1150,team.capacity);
  const travel = record?.miles ?? 0;
  const attendance = record?.attendance ?? 0;
  const games = record?.home ?? 0;
  const ticketPrice = d.tickets * interpolate(s.year,[1876,1917,1946,1965,1985,2005,2026],[.45,.58,.62,.76,1.05,1.60,2.27]) * (.87 + marketDemand(s,team.market) * .24);
  const ticket = attendance * ticketPrice * (d.games >= 60 ? .78 : 1);
  const concessions = ticket * (s.year < 1940 ? .06 : s.year < 1980 ? .14 : .22);
  const media = unit * world.mediaFactor * (.25 + s.popularity * .008) * (.38 + marketDemand(s,team.market) * .30) * s.rules.broadcast;
  const sponsor = (ticket * (s.year < 1950 ? .015 : .17) + unit * (s.year < 1950 ? .028 : .11)) * world.demand;
  const merchandise = ticket * (s.year < 1960 ? .018 : s.year < 1995 ? .065 : .135);
  const payroll = unit * (.32 + team.talent / 235) * world.payroll * s.rules.payroll * diff.cost * (s.year <= s.strikeThrough ? 1.15 : 1);
  const field = s.sport==='football' && s.year<1950 ? .42 : 1;
  const travelCost = (travel * (d.games >= 60 ? 8.5 : 32)*field + (record?.g || 0) * unit * .0018) * world.travel * diff.cost;
  const facility = (size * field * (s.year < 1950 ? 9 : s.year < 1980 ? 21 : 56) + unit * (.17 + .10 * next())) * diff.cost;
  const interest = team.debt * (world.demand < .9 ? .105 : .063);
  const revenue = ticket + concessions + media + merchandise + sponsor;
  const expense = payroll + travelCost + facility + interest;
  return {ticket,concessions,media,sponsor,merchandise,payroll,travel:travelCost,facility,interest,revenue,expense,attendance,games,ticketPrice};
}
