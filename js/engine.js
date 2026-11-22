/* League simulation: clubs, seasons, playoffs, metrics, endings. No DOM, no network. */
(function (root) {
  'use strict';
  var D = root.CommishData || require('./data.js');
  var KEYS = D.METRICS.map(function (m) { return m.key; });

  var HI = 9, LO = 25, SHOCK = 0.15;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function gauss() {
    var u = 0, v = Math.random();
    while (!u) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function fullName(t) { return t.city + ' ' + t.name; }
  function eraFor(year) {
    var e = D.ERAS[0];
    D.ERAS.forEach(function (x) { if (year >= x.from) e = x; });
    return e;
  }

  function newGame(o) {
    var sp = D.SPORTS[o.sport];
    var s = {
      v: 1, sport: sp.key,
      leagueName: (o.leagueName || '').trim() || sp.defaultLeague,
      commissioner: (o.commissioner || '').trim() || 'The Commissioner',
      startYear: sp.startYear,
      endYear: Math.max(sp.startYear + 1, o.endYear || new Date().getFullYear()),
      year: sp.startYear - 1,
      teams: [], defunct: [], nextId: 1,
      metrics: { popularity: 40, finances: 36, integrity: 50, labor: 55, owners: 55 },
      games: sp.startGames, playoffTeams: sp.startPlayoffs,
      rules: [], history: [], flags: {}, recent: [],
      lastSeason: null, turn: null, phase: 'idle', over: null
    };
    sp.teams.forEach(function (t) { addTeam(s, t[0], t[1], true); });
    return s;
  }

  function addTeam(s, city, name, founding) {
    city = String(city || '').trim().slice(0, 40);
    name = String(name || '').trim().slice(0, 40);
    if (!city || !name || s.teams.length >= 40) return null;
    var dup = s.teams.some(function (t) { return fullName(t).toLowerCase() === (city + ' ' + name).toLowerCase(); });
    if (dup) return null;
    var t = {
      id: s.nextId++, city: city, name: name,
      rating: founding ? 50 + gauss() * 8 : 40 + gauss() * 4,
      market: D.MARKETS[city] || 1,
      founded: Math.max(s.year, s.startYear), titles: 0, w: 0, l: 0
    };
    s.teams.push(t);
    return t;
  }

  function findTeam(s, q) {
    if (!q) return null;
    q = String(q).toLowerCase().trim();
    var exact = s.teams.filter(function (t) { return fullName(t).toLowerCase() === q; })[0];
    if (exact) return exact;
    return s.teams.filter(function (t) {
      var f = fullName(t).toLowerCase();
      return f.indexOf(q) >= 0 || q.indexOf(f) >= 0 || q.indexOf(t.name.toLowerCase()) >= 0;
    })[0] || null;
  }

  function removeTeam(s, t) {
    if (!t || s.teams.length <= 4) return false;
    s.teams = s.teams.filter(function (x) { return x.id !== t.id; });
    s.defunct.push({ name: fullName(t), from: t.founded, to: s.year, titles: t.titles });
    return true;
  }

  function winProb(a, b, k) { return 1 / (1 + Math.exp(-(a.rating - b.rating) / k)); }

  function simulateSeason(s) {
    var sp = D.SPORTS[s.sport], k = sp.k, T = s.teams, n = T.length;
    s.year += 1;
    T.forEach(function (t) {
      t.rating = clamp(50 + (t.rating - 50) * 0.8 + gauss() * 6 + (t.market - 1) * 1.5, 15, 92);
      t.w = 0; t.l = 0;
    });
    var per = Math.max(1, Math.round(s.games / Math.max(1, n - 1)));
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      var p = winProb(T[i], T[j], k);
      for (var g = 0; g < per; g++) {
        if (Math.random() < p) { T[i].w++; T[j].l++; } else { T[j].w++; T[i].l++; }
      }
    }
    var order = T.slice().sort(function (a, b) {
      return (b.w / (b.w + b.l || 1)) - (a.w / (a.w + a.l || 1)) || b.rating - a.rating;
    });
    var field = order.slice(0, clamp(s.playoffTeams, 1, n));
    var champ = field[0], runner = order[1] || null;
    if (field.length > 1) {
      var alive = field.slice(), seriesK = k * 0.6;
      while (alive.length > 1) {
        var size = 1; while (size < alive.length) size *= 2;
        var byes = size - alive.length, next = alive.slice(0, byes), rest = alive.slice(byes), losers = [];
        while (rest.length > 1) {
          var hi = rest.shift(), lo = rest.pop();
          var w = Math.random() < winProb(hi, lo, seriesK) ? hi : lo;
          next.push(w); losers.push(w === hi ? lo : hi);
        }
        if (rest.length) next.push(rest[0]);
        if (next.length === 1) runner = losers[0];
        alive = next.sort(function (a, b) { return field.indexOf(a) - field.indexOf(b); });
      }
      champ = alive[0];
    }
    champ.titles++;
    s.lastSeason = {
      year: s.year,
      standings: order.map(function (t) { return { id: t.id, name: fullName(t), w: t.w, l: t.l, titles: t.titles }; }),
      champion: fullName(champ), championId: champ.id,
      runnerUp: runner ? fullName(runner) : null,
      playoffTeams: field.length
    };
    return s.lastSeason;
  }

  function dynasty(s) {
    var last = s.history.slice(-3).map(function (h) { return h.champion; });
    if (s.lastSeason) last.push(s.lastSeason.champion);
    last = last.slice(-4);
    var c = {};
    last.forEach(function (x) { c[x] = (c[x] || 0) + 1; });
    var best = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0];
    return best && c[best] >= 3 ? best : null;
  }

  /* Normalise anything (AI output or built-in) into a safe option. */
  function cleanOption(o) {
    o = o || {};
    var fx = {}, src = o.effects || {};
    KEYS.forEach(function (k) {
      var v = Math.round(Number(src[k]));
      fx[k] = isFinite(v) ? clamp(v, -20, 20) : 0;
    });
    return {
      label: String(o.label || 'Do nothing').slice(0, 90),
      detail: String(o.detail || '').slice(0, 320),
      outcome: String(o.outcome || 'The matter was settled and the league moved on.').slice(0, 700),
      effects: fx,
      actions: Array.isArray(o.actions) ? o.actions.slice(0, 6) : []
    };
  }

  function applyAction(s, a, notes) {
    if (!a || typeof a !== 'object') return;
    var t;
    switch (a.type) {
      case 'add_team':
        t = addTeam(s, a.city, a.name);
        if (t) notes.push('The ' + fullName(t) + ' join the league.');
        break;
      case 'remove_team':
        t = findTeam(s, a.team);
        if (t && removeTeam(s, t)) notes.push('The ' + fullName(t) + ' are no more.');
        break;
      case 'relocate_team':
        t = findTeam(s, a.team);
        var city = String(a.city || '').trim().slice(0, 40);
        if (t && city) {
          var old = fullName(t);
          t.city = city;
          if (a.name) t.name = String(a.name).trim().slice(0, 40) || t.name;
          t.market = D.MARKETS[city] || 1;
          notes.push('The ' + old + ' become the ' + fullName(t) + '.');
        }
        break;
      case 'rename_league':
        if (a.name) { s.leagueName = String(a.name).trim().slice(0, 60) || s.leagueName; notes.push('The league is now the ' + s.leagueName + '.'); }
        break;
      case 'rule':
        if (a.text) s.rules.push({ year: s.year, text: String(a.text).slice(0, 160) });
        break;
      case 'set_playoff_teams':
        var c = Math.round(Number(a.count));
        if (isFinite(c)) { s.playoffTeams = clamp(c, 1, 16); notes.push('Postseason field: ' + s.playoffTeams + ' club' + (s.playoffTeams === 1 ? '' : 's') + '.'); }
        break;
      case 'set_games':
        var g = Math.round(Number(a.count));
        if (isFinite(g)) { s.games = clamp(g, 6, 170); notes.push('Schedule: ' + s.games + ' games.'); }
        break;
      case 'flag':
        if (a.name) s.flags[String(a.name).slice(0, 30)] = true;
        break;
    }
  }

  /* The slow background pull on the league, applied once a year after the decision. */
  function drift(s) {
    var m = s.metrics, d = {};
    KEYS.forEach(function (k) { d[k] = 0; });
    d.finances += Math.round((m.popularity - 45) / 14);
    d.owners += Math.round(((m.finances + m.popularity) / 2 - m.owners) * 0.12);
    if (s.year % 2 === 0) d.labor -= 1;
    if (Math.random() < 0.3) d.integrity -= 1;
    if (Math.random() < 0.3) d.popularity -= 1;
    if (dynasty(s)) d.popularity -= 2;
    if (!s.flags.integrated && s.year >= 1955) {
      if (s.year >= 1980) s.flags.integrated = true; // the courts have long since settled it
      else { d.integrity -= 2; d.popularity -= 1; }
    }
    // Success is hard to hold: high marks sag, low marks recover only slowly.
    KEYS.forEach(function (k) {
      d[k] -= m[k] > 50 ? Math.round((m[k] - 50) / HI) : -Math.round((50 - m[k]) / LO);
    });
    // And some years are simply unlucky.
    if (Math.random() < SHOCK) { var k = pick(KEYS); d[k] -= 3 + Math.floor(Math.random() * 5); }
    return d;
  }

  function applyChoice(s, option) {
    var o = cleanOption(option), before = {}, notes = [], deltas = {};
    KEYS.forEach(function (k) { before[k] = s.metrics[k]; });
    o.actions.forEach(function (a) { applyAction(s, a, notes); });
    s.playoffTeams = clamp(s.playoffTeams, 1, s.teams.length);
    var dr = drift(s);
    KEYS.forEach(function (k) {
      s.metrics[k] = clamp(Math.round(before[k] + o.effects[k] + dr[k]), 0, 100);
      deltas[k] = s.metrics[k] - before[k];
    });
    var turn = s.turn || {}, ls = s.lastSeason || {};
    s.history.push({
      year: s.year, champion: ls.champion, runnerUp: ls.runnerUp,
      headline: turn.headline || '', star: turn.star || null,
      decision: turn.dilemma ? turn.dilemma.title : '', choice: o.label, outcome: o.outcome,
      teams: s.teams.length, metrics: JSON.parse(JSON.stringify(s.metrics))
    });
    checkOver(s);
    return { deltas: deltas, notes: notes, option: o };
  }

  function checkOver(s) {
    if (s.over) return s.over;
    var failed = D.METRICS.filter(function (m) { return s.metrics[m.key] <= 0; })[0];
    if (failed) s.over = { type: 'collapse', metric: failed.key, year: s.year, text: failed.fail };
    else if (s.year >= s.endYear) s.over = { type: 'legacy', year: s.year, text: 'The league reached the present day with you still in the chair.' };
    return s.over;
  }

  function legacy(s) {
    var avg = KEYS.reduce(function (a, k) { return a + s.metrics[k]; }, 0) / KEYS.length;
    var span = (s.year - s.startYear + 1) / (s.endYear - s.startYear + 1);
    var score = Math.round(avg * 0.55 + Math.min(s.teams.length, 32) / 32 * 20 + span * 25);
    if (s.over && s.over.type === 'collapse') score = Math.round(score * 0.6);
    var grade = score >= 80 ? 'Immortal' : score >= 65 ? 'Hall of Famer' : score >= 50 ? 'Steady hand' : score >= 35 ? 'Caretaker' : 'Cautionary tale';
    return { score: clamp(score, 0, 100), grade: grade };
  }

  var api = {
    KEYS: KEYS, clamp: clamp, gauss: gauss, pick: pick, fullName: fullName, eraFor: eraFor,
    newGame: newGame, addTeam: addTeam, findTeam: findTeam, simulateSeason: simulateSeason,
    dynasty: dynasty, cleanOption: cleanOption, applyChoice: applyChoice, checkOver: checkOver, legacy: legacy
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CommishEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
