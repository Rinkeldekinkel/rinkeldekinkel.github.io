/* Interface and turn loop. */
(function () {
  'use strict';
  var D = window.CommishData, E = window.CommishEngine, O = window.CommishOffline, AI = window.CommishAI;
  var SAVE = 'commissioner.save.v1', SET = 'commissioner.settings.v1';
  var $app = document.getElementById('app');

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: play on without saves */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };

  var settings = Object.assign({ key: '', model: 'openrouter/auto', useAI: true, auto: false, debug: false }, store.get(SET) || {});
  var app = { view: 'start', state: null, tab: 'standings', notice: '', busy: false, form: { sport: 'baseball', league: '', name: '' }, end: null, settingsOpen: false, test: null };
  var autoTimer = null;

  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function aiOn() { return settings.useAI && !!settings.key; }
  function saveSettings() { store.set(SET, settings); }
  function saveGame() { if (app.state) store.set(SAVE, app.state); }

  /* ---------- turn loop ---------- */

  async function playSeason() {
    var s = app.state;
    clearTimeout(autoTimer);
    E.simulateSeason(s);
    s.turn = null; s.phase = 'loading'; app.notice = '';
    render();
    var turn;
    if (aiOn()) {
      try { turn = await AI.generateTurn(s, settings); }
      catch (e) { app.notice = e.message + ' The built-in almanac wrote this season instead.'; }
    }
    if (app.state !== s) return; // the player quit while the presses were rolling
    s.turn = turn || O.generateTurn(s);
    s.phase = 'decision';
    saveGame(); render(); scheduleAuto();
  }

  function resolve(option) {
    var s = app.state;
    clearTimeout(autoTimer);
    var r = E.applyChoice(s, option);
    s.turn.result = { label: r.option.label, outcome: r.option.outcome, deltas: r.deltas, notes: r.notes };
    s.phase = 'outcome';
    saveGame(); render(); scheduleAuto();
    var el = document.getElementById('outcome');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function decree(text) {
    var s = app.state;
    text = text.trim();
    if (!text || app.busy) return;
    clearTimeout(autoTimer);
    app.busy = true; app.notice = ''; s.turn.draft = text; render();
    try {
      var o = await AI.judgeDecree(s, settings, text);
      app.busy = false;
      if (app.state === s && s.phase === 'decision') { delete s.turn.draft; resolve(o); }
    } catch (e) {
      app.busy = false;
      app.notice = e.message + ' Your decree could not be judged — choose one of the listed options, or try again.';
      render();
    }
  }

  function next() {
    var s = app.state;
    if (s.over) showEnd(); else playSeason();
  }

  async function showEnd() {
    var s = app.state;
    clearTimeout(autoTimer);
    app.view = 'end'; app.end = O.epitaph(s); app.end.writing = aiOn();
    saveGame(); render();
    if (aiOn()) {
      try { var e = await AI.epitaph(s, settings); app.end.title = e.title; app.end.text = e.text; } catch (err) { /* keep the built-in one */ }
      app.end.writing = false;
      if (app.view === 'end' && app.state === s) render();
    }
  }

  function scheduleAuto() {
    clearTimeout(autoTimer);
    var s = app.state;
    if (!settings.auto || !s || app.view !== 'game' || app.busy) return;
    var wait = aiOn() ? 4500 : 1400;
    if (s.phase === 'decision') autoTimer = setTimeout(function () {
      var d = s.turn.dilemma; resolve(d.options[d.natural] || d.options[0]);
    }, wait);
    else if (s.phase === 'outcome') autoTimer = setTimeout(next, s.over ? wait * 2 : wait);
  }

  /* ---------- views ---------- */

  function render() {
    var s = app.state;
    var year = app.view === 'start' ? D.SPORTS[app.form.sport].startYear : s.year;
    document.body.dataset.era = E.eraFor(year).key;
    $app.innerHTML = (app.view === 'start' ? viewStart() : app.view === 'end' ? viewEnd() : viewGame()) + '<div id="debug">' + debugHTML() + '</div>' + (app.settingsOpen ? viewSettings() : '');
  }

  function storytellerFields() {
    return '<fieldset class="field"><legend>Storyteller</legend>' +
      '<label class="radio"><input type="radio" name="useAI" value="1" data-set="useAI"' + (settings.useAI ? ' checked' : '') + '> <span><b>OpenRouter AI</b> — every season and dilemma written fresh for your league</span></label>' +
      '<label class="radio"><input type="radio" name="useAI" value="0" data-set="useAI"' + (!settings.useAI ? ' checked' : '') + '> <span><b>Built-in almanac</b> — no key needed, a fixed deck of historical dilemmas</span></label>' +
      '<div class="ai-fields"' + (settings.useAI ? '' : ' hidden') + '>' +
      '<label>OpenRouter API key<input type="password" data-set="key" value="' + esc(settings.key) + '" placeholder="sk-or-…" autocomplete="off" spellcheck="false"></label>' +
      '<label>Model<input type="text" data-set="model" list="models" value="' + esc(settings.model) + '" placeholder="openrouter/auto" spellcheck="false"></label>' +
      '<datalist id="models"></datalist>' +
      '<p class="fine">The key is kept in this browser only and sent only to openrouter.ai. Get one at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>. Any chat model works; <code>openrouter/auto</code> lets OpenRouter choose. One request per season.</p>' +
      '<div class="test-row"><button class="btn small" type="button" data-act="test"' + (app.test && app.test.state === 'busy' ? ' disabled' : '') + '>Test connection</button>' +
      '<span id="test-status" role="status" class="test-status ' + (app.test ? app.test.state : '') + '">' + esc(app.test ? app.test.msg : '') + '</span></div>' +
      '<label class="radio"><input type="checkbox" data-set="debug"' + (settings.debug ? ' checked' : '') + '> <span><b>Debug mode</b> — show exactly what is sent to OpenRouter and what comes back</span></label>' +
      '</div></fieldset>';
  }

  /* ---------- debug log ---------- */

  function pretty(x) { try { return JSON.stringify(x, null, 2); } catch (e) { return String(x); } }
  function debugHTML() {
    if (!settings.debug) return '';
    var rows = AI.log.map(function (e, i) {
      var reply = e.response && e.response.choices && e.response.choices[0] && e.response.choices[0].message && e.response.choices[0].message.content;
      var state = e.ms == null ? 'waiting…' : (e.error ? 'failed' : 'ok') + (e.status ? ' · HTTP ' + e.status : '') + ' · ' + (e.ms / 1000).toFixed(1) + 's';
      return '<details class="dbg' + (e.error ? ' bad' : '') + '"' + (i === 0 ? ' open' : '') + '><summary>' + esc(e.at.toLocaleTimeString()) + ' · ' + esc(e.request.model) + ' · ' + state + '</summary>' +
        (e.error ? '<p class="dbg-err">' + esc(e.error) + '</p>' : '') +
        '<h4>Input — request body</h4><pre>' + esc(pretty(e.request)) + '</pre>' +
        (reply ? '<h4>Output — message content</h4><pre>' + esc(reply) + '</pre>' : '') +
        '<h4>Output — full response</h4><pre>' + esc(e.response ? pretty(e.response) : e.ms == null ? '(waiting for reply)' : '(no response body)') + '</pre></details>';
    }).join('');
    return '<section class="panel debug"><h3>OpenRouter debug log</h3>' +
      (rows || '<p class="fine">No requests yet. Requests appear here as they are sent; the API key is never shown.</p>') + '</section>';
  }
  function updateDebug() { var el = document.getElementById('debug'); if (el) el.innerHTML = debugHTML(); }
  AI.onLog = updateDebug;

  function setTest(state, msg) {
    app.test = { state: state, msg: msg };
    var el = document.getElementById('test-status'), btn = $app.querySelector('[data-act=test]');
    if (el) { el.className = 'test-status ' + state; el.textContent = msg; }
    if (btn) btn.disabled = state === 'busy';
  }
  async function testConnection() {
    if (app.test && app.test.state === 'busy') return;
    setTest('busy', 'Contacting OpenRouter…');
    try {
      var r = await AI.test(settings);
      setTest('ok', 'Connected. ' + r.model + ' replied “' + r.text + '” in ' + (r.ms / 1000).toFixed(1) + 's.');
    } catch (e) { setTest('fail', e.message); }
  }

  function viewStart() {
    var saved = store.get(SAVE), f = app.form, sp = D.SPORTS[f.sport];
    var cards = Object.keys(D.SPORTS).map(function (k) { return D.SPORTS[k]; })
      .sort(function (a, b) { return a.startYear - b.startYear; })
      .map(function (x) {
        return '<label class="sport' + (x.key === f.sport ? ' on' : '') + '"><input type="radio" name="sport" value="' + x.key + '" data-form="sport"' + (x.key === f.sport ? ' checked' : '') + '>' +
          '<span class="sport-year">' + x.startYear + '</span><span class="sport-name">' + x.label + '</span><span class="sport-blurb">' + esc(x.blurb) + '</span></label>';
      }).join('');
    return '<section class="start paper">' +
      '<p class="kicker">An alternate history, one season at a time</p>' +
      '<h1 class="masthead">Commissioner</h1>' +
      '<p class="lede">Found a league in the year the real one began. Keep the fans, the owners, the players and the bank on side until ' + new Date().getFullYear() + ' — or watch it die on your watch.</p>' +
      (saved && saved.sport && !saved.over ? '<button class="btn wide" data-act="resume">Resume the ' + esc(saved.leagueName) + ' (' + saved.year + ')</button>' : '') +
      '<form data-form-root>' +
      '<fieldset class="field"><legend>Choose your game</legend><div class="sports">' + cards + '</div></fieldset>' +
      '<div class="row">' +
      '<label>League name<input type="text" data-form="league" maxlength="60" value="' + esc(f.league) + '" placeholder="' + esc(sp.defaultLeague) + '"></label>' +
      '<label>Your name<input type="text" data-form="name" maxlength="40" value="' + esc(f.name) + '" placeholder="The Commissioner"></label>' +
      '</div>' + storytellerFields() +
      '<fieldset class="field"><legend>Your role</legend>' +
      '<label class="radio"><input type="radio" name="auto" value="0" data-set="auto"' + (!settings.auto ? ' checked' : '') + '> <span><b>Run the league</b> — every decision is yours</span></label>' +
      '<label class="radio"><input type="radio" name="auto" value="1" data-set="auto"' + (settings.auto ? ' checked' : '') + '> <span><b>Just watch</b> — the league takes the course history would likely have taken; step in whenever you like</span></label>' +
      '</fieldset>' +
      '<button class="btn primary wide" type="submit">Call the founding meeting to order — ' + sp.startYear + '</button>' +
      '</form></section>';
  }

  function viewSettings() {
    return '<div class="overlay" data-act="close-settings"><div class="dialog paper" role="dialog" aria-label="Settings" data-stop>' +
      '<h2>Settings</h2>' + storytellerFields() +
      '<div class="actions"><button class="btn primary" data-act="close-settings">Done</button></div></div></div>';
  }

  function gauges(s) {
    var deltas = s.phase === 'outcome' && s.turn && s.turn.result ? s.turn.result.deltas : null;
    return D.METRICS.map(function (m) {
      var v = s.metrics[m.key], d = deltas ? deltas[m.key] : 0;
      return '<div class="gauge' + (v < 20 ? ' danger' : v < 35 ? ' warn' : '') + '"><div class="gauge-head"><span>' + m.label + '</span><span class="gauge-val">' + v +
        (d ? ' <i class="' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + '</i>' : '') + '</span></div>' +
        '<div class="bar" role="meter" aria-label="' + m.label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v + '"><span style="width:' + v + '%"></span></div></div>';
    }).join('');
  }

  function sidebar(s) {
    var body = '';
    if (app.tab === 'standings') {
      var ls = s.lastSeason;
      body = '<table class="standings"><thead><tr><th></th><th>Club</th><th>W</th><th>L</th><th title="Championships">🏆</th></tr></thead><tbody>' +
        ls.standings.map(function (r, i) {
          return '<tr class="' + (r.id === ls.championId ? 'champ' : '') + (i === ls.playoffTeams - 1 && ls.playoffTeams > 1 && i < ls.standings.length - 1 ? ' cut' : '') + '"><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + r.w + '</td><td>' + r.l + '</td><td>' + (r.titles || '') + '</td></tr>';
        }).join('') + '</tbody></table>' +
        '<p class="fine">' + s.games + ' games · ' + (s.playoffTeams > 1 ? 'top ' + ls.playoffTeams + ' reach the postseason' : 'best record takes the title') + '</p>';
    } else if (app.tab === 'history') {
      body = s.history.length ? '<ol class="history">' + s.history.slice().reverse().map(function (h) {
        return '<li><b>' + h.year + '</b> ' + esc(h.champion) + '<br><span class="fine">' + esc(h.decision) + ' → <em>' + esc(h.choice) + '</em></span></li>';
      }).join('') + '</ol>' : '<p class="fine">Nothing yet. History starts with your first ruling.</p>';
    } else {
      body = (s.rules.length ? '<ol class="history">' + s.rules.slice().reverse().map(function (r) { return '<li><b>' + r.year + '</b> ' + esc(r.text) + '</li>'; }).join('') + '</ol>' : '<p class="fine">The rulebook is a single sheet of paper so far.</p>') +
        (s.defunct.length ? '<h4>Departed clubs</h4><ul class="history">' + s.defunct.slice().reverse().map(function (d) { return '<li>' + esc(d.name) + ' <span class="fine">' + d.from + '–' + d.to + (d.titles ? ', ' + d.titles + ' titles' : '') + '</span></li>'; }).join('') + '</ul>' : '');
    }
    var tabs = [['standings', 'Standings'], ['history', 'History'], ['rules', 'Rulebook']].map(function (t) {
      return '<button role="tab" aria-selected="' + (app.tab === t[0]) + '" class="tab' + (app.tab === t[0] ? ' on' : '') + '" data-act="tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('');
    return '<aside class="side"><section class="panel"><h3>State of the league</h3>' + gauges(s) + '<p class="fine">If any gauge reaches zero, the league is finished.</p></section>' +
      '<section class="panel"><div class="tabs" role="tablist">' + tabs + '</div>' + body + '</section></aside>';
  }

  function desk(s) {
    var t = s.turn, d = t.dilemma;
    if (s.phase === 'outcome') {
      var r = t.result;
      return '<section class="desk" id="outcome"><h3 class="desk-title">' + esc(d.title) + '</h3>' +
        '<p class="ruling">Your ruling: <b>' + esc(r.label) + '</b></p><p class="outcome">' + esc(r.outcome) + '</p>' +
        (r.notes.length ? '<ul class="notes">' + r.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') +
        (s.over && s.over.type === 'collapse' ? '<p class="doom">' + esc(s.over.text) + '</p>' : '') +
        '<button class="btn primary wide" data-act="next">' + (s.over ? 'Read the final edition' : 'On to the ' + (s.year + 1) + ' season →') + '</button></section>';
    }
    return '<section class="desk"><p class="kicker">On the commissioner’s desk</p><h3 class="desk-title">' + esc(d.title) + '</h3><p>' + esc(d.text) + '</p>' +
      '<div class="options">' + d.options.map(function (o, i) {
        return '<button class="option" data-act="choose" data-i="' + i + '"' + (app.busy ? ' disabled' : '') + '><b>' + esc(o.label) + '</b>' + (o.detail ? '<span>' + esc(o.detail) + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      (aiOn() ? '<form class="decree" data-decree><label for="decree">Or issue a decree of your own</label><textarea id="decree" rows="2" maxlength="600" placeholder="Write your ruling. The world of ' + s.year + ' will decide how it lands."' + (app.busy ? ' disabled' : '') + '>' + esc(t.draft || '') + '</textarea>' +
        '<button class="btn" type="submit"' + (app.busy ? ' disabled' : '') + '>' + (app.busy ? 'The league office deliberates…' : 'Issue decree') + '</button></form>' : '') +
      '</section>';
  }

  function viewGame() {
    var s = app.state, sp = D.SPORTS[s.sport], t = s.turn, pct = (s.year - s.startYear) / (s.endYear - s.startYear) * 100;
    var head = '<header class="top"><div class="top-id"><span class="top-league">' + esc(s.leagueName) + '</span><span class="fine">' + (s.commissioner === 'The Commissioner' ? 'You are Commissioner' : esc(s.commissioner) + ', Commissioner') + ' · ' + s.teams.length + ' clubs · ' + E.eraFor(s.year).label + '</span></div>' +
      '<div class="top-ctl"><label class="switch" title="Let the league take its natural course"><input type="checkbox" data-set="auto"' + (settings.auto ? ' checked' : '') + '> Watch</label>' +
      '<button class="btn small" data-act="settings">Settings</button><button class="btn small" data-act="quit">Quit</button></div>' +
      '<div class="timeline" aria-label="Season ' + s.year + ' of ' + s.startYear + ' to ' + s.endYear + '"><span class="tl-end">' + s.startYear + '</span><div class="tl-track"><span style="width:' + pct.toFixed(1) + '%"></span></div><span class="tl-end">' + s.endYear + '</span></div></header>';
    var paper;
    if (s.phase === 'loading' || !t) {
      paper = '<article class="paper story"><p class="dateline">Season of ' + s.year + '</p><h2 class="headline loading">The presses are rolling…</h2><p class="fine">The ' + esc(s.lastSeason.champion) + ' have won ' + esc(sp.trophy) + '. Your correspondent is filing the report.</p></article>';
    } else {
      paper = '<article class="paper story"><p class="dateline">Season of ' + s.year + (t.source === 'almanac' ? ' · from the almanac' : '') + '</p>' +
        '<h2 class="headline">' + esc(t.headline) + '</h2><p class="recap">' + esc(t.recap) + '</p>' +
        '<div class="boxes"><div class="box"><span class="box-k">Champions</span><b>' + esc(s.lastSeason.champion) + '</b>' + (s.lastSeason.runnerUp ? '<span class="fine">over the ' + esc(s.lastSeason.runnerUp) + '</span>' : '') + '</div>' +
        (t.star ? '<div class="box"><span class="box-k">Player of the year</span><b>' + esc(t.star.name) + '</b><span class="fine">' + esc(t.star.team) + (t.star.feat ? ' — ' + esc(t.star.feat) : '') + '</span></div>' : '') + '</div>' +
        (app.notice ? '<p class="notice" role="status">' + esc(app.notice) + '</p>' : '') + desk(s) + '</article>';
    }
    return head + '<div class="grid">' + paper + sidebar(s) + '</div>';
  }

  function viewEnd() {
    var s = app.state, e = app.end, tally = {};
    s.history.forEach(function (h) { tally[h.champion] = (tally[h.champion] || 0) + 1; });
    var top = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; }).slice(0, 8);
    return '<section class="paper end"><p class="kicker">' + s.startYear + ' – ' + s.year + ' · ' + esc(s.leagueName) + '</p>' +
      '<h1 class="headline">' + esc(e.title) + '</h1><p class="recap">' + esc(e.text) + '</p>' + (e.writing ? '<p class="fine">A longer retrospective is being written…</p>' : '') +
      '<div class="boxes"><div class="box"><span class="box-k">Verdict on ' + esc(s.commissioner) + '</span><b>' + esc(e.grade) + '</b><span class="fine">Legacy ' + e.score + ' / 100</span></div>' +
      '<div class="box"><span class="box-k">Seasons played</span><b>' + s.history.length + '</b><span class="fine">' + s.teams.length + ' clubs at the end</span></div></div>' +
      '<div class="end-cols"><div><h3>Final state</h3>' + gauges(s) + '</div><div><h3>Most titles</h3><ol class="history">' + top.map(function (n) { return '<li><b>' + tally[n] + '</b> ' + esc(n) + '</li>'; }).join('') + '</ol></div></div>' +
      '<div class="actions"><button class="btn primary" data-act="new">Found another league</button><button class="btn" data-act="copy">Copy the league’s history</button></div></section>';
  }

  function historyText(s) {
    return s.leagueName + ' (' + s.startYear + '–' + s.year + ') — Commissioner: ' + s.commissioner + '\n\n' + s.history.map(function (h) {
      return h.year + ' — Champions: ' + h.champion + '\n  ' + h.headline + '\n  Decision: ' + h.decision + ' → ' + h.choice + '\n  ' + h.outcome;
    }).join('\n\n') + '\n\n' + app.end.title + '\n' + app.end.text;
  }

  /* ---------- events ---------- */

  $app.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act, s = app.state;
    if (act === 'close-settings') {
      if (el.classList.contains('overlay') && ev.target.closest('[data-stop]')) return;
      app.settingsOpen = false; render(); scheduleAuto(); return;
    }
    if (act === 'test') { testConnection(); return; }
    if (act === 'choose' && s.phase === 'decision' && !app.busy) resolve(s.turn.dilemma.options[+el.dataset.i]);
    else if (act === 'next' && s.phase === 'outcome') next();
    else if (act === 'tab') { app.tab = el.dataset.tab; render(); }
    else if (act === 'settings') { clearTimeout(autoTimer); app.settingsOpen = true; render(); loadModels(); }
    else if (act === 'quit') { clearTimeout(autoTimer); app.state = null; app.view = 'start'; app.busy = false; render(); loadModels(); }
    else if (act === 'new') { store.del(SAVE); app.state = null; app.view = 'start'; render(); loadModels(); }
    else if (act === 'resume') {
      app.state = store.get(SAVE); app.view = 'game'; app.busy = false;
      if (app.state.phase === 'decision' || app.state.phase === 'outcome') { render(); scheduleAuto(); } else playSeason();
    }
    else if (act === 'copy') {
      var txt = historyText(s);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { el.textContent = 'Copied'; }, function () { el.textContent = 'Copy failed'; });
    }
  });

  $app.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.dataset.form) { app.form[el.dataset.form] = el.value; if (el.dataset.form === 'sport') render(), loadModels(); return; }
    var k = el.dataset.set;
    if (!k) return;
    if (k === 'useAI') { settings.useAI = el.value === '1'; saveSettings(); render(); loadModels(); }
    else if (k === 'auto') {
      settings.auto = el.type === 'checkbox' ? el.checked : el.value === '1'; saveSettings();
      if (app.view === 'game') scheduleAuto();
    }
    else if (k === 'debug') { settings.debug = el.checked; saveSettings(); updateDebug(); }
    else { settings[k] = el.value.trim(); saveSettings(); app.test = null; }
  });
  $app.addEventListener('input', function (ev) {
    var el = ev.target;
    if (el.dataset.form && el.type === 'text') app.form[el.dataset.form] = el.value;
    if (el.dataset.set === 'key' || el.dataset.set === 'model') { settings[el.dataset.set] = el.value.trim(); saveSettings(); }
    if (el.id === 'decree') clearTimeout(autoTimer); // typing a decree pauses watch mode
  });

  $app.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (ev.target.hasAttribute('data-decree')) { decree(ev.target.querySelector('textarea').value); return; }
    if (ev.target.hasAttribute('data-form-root')) {
      app.state = E.newGame({ sport: app.form.sport, leagueName: app.form.league, commissioner: app.form.name });
      app.view = 'game'; app.tab = 'standings';
      playSeason();
    }
  });

  var modelCache = null;
  function loadModels() {
    var dl = document.getElementById('models');
    if (!dl || !settings.useAI) return;
    var fill = function (ids) { var x = document.getElementById('models'); if (x) x.innerHTML = ids.map(function (id) { return '<option value="' + esc(id) + '">'; }).join(''); };
    if (modelCache) return fill(modelCache);
    AI.listModels().then(function (ids) { modelCache = ids; fill(ids); }, function () { /* free text still works */ });
  }

  render();
  loadModels();
})();
