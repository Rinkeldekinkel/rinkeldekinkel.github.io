// Headless balance check for the built-in writer: node test/balance.js
const E = require('../js/engine.js');
const O = require('../js/offline.js');
const D = require('../js/data.js');

function run(sport, policy) {
  const s = E.newGame({ sport, endYear: 2026 });
  while (!s.over) {
    E.simulateSeason(s);
    s.turn = O.generateTurn(s);
    const d = s.turn.dilemma, opts = d.options.map(E.cleanOption);
    let i;
    if (policy === 'natural') i = d.natural;
    else if (policy === 'random') i = Math.floor(Math.random() * opts.length);
    else i = opts.map((o, k) => [k, E.KEYS.reduce((a, m) => a + o.effects[m], 0)]).sort((a, b) => a[1] - b[1])[0][0];
    E.applyChoice(s, d.options[i]);
  }
  return s;
}
for (const sport of Object.keys(D.SPORTS)) for (const policy of ['natural', 'random', 'worst']) {
  const N = 300; let survive = 0, yrs = 0, teams = 0; const why = {}, m = {};
  for (let n = 0; n < N; n++) {
    const s = run(sport, policy);
    if (s.over.type === 'legacy') { survive++; teams += s.teams.length; E.KEYS.forEach(k => m[k] = (m[k] || 0) + s.metrics[k]); }
    else why[s.over.metric] = (why[s.over.metric] || 0) + 1;
    yrs += s.year - s.startYear + 1;
  }
  console.log(sport.padEnd(10), policy.padEnd(8), 'survive', (survive / N * 100).toFixed(0).padStart(3) + '%', 'avgYears', (yrs / N).toFixed(0).padStart(4),
    'teams', survive ? (teams / survive).toFixed(0) : '-', JSON.stringify(why),
    survive ? E.KEYS.map(k => k.slice(0, 3) + Math.round(m[k] / survive)).join(' ') : '');
}
