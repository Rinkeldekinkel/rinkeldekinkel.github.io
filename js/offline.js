/* Built-in "almanac" writer: produces the same turn shape as the AI, with no network.
   Used when no OpenRouter key is set, and as the fallback when a call fails. */
(function (root) {
  'use strict';
  var D = root.CommishData || require('./data.js');
  var E = root.CommishEngine || require('./engine.js');
  var pick = E.pick;

  var FIRST = ['Amos', 'Silas', 'Cornelius', 'Jack', 'Eddie', 'Walt', 'Hank', 'Lou', 'Moose', 'Red', 'Buck', 'Otis', 'Ray', 'Gus', 'Clyde', 'Dale', 'Vic', 'Tony', 'Marcus', 'Darnell', 'Luis', 'Andre', 'Miguel', 'Kenji', 'Tyrell', 'Jalen', 'Mateo', 'Nikolai', 'Declan', 'Pierre'];
  var LAST = ['Hargrove', 'Pettibone', 'Kowalski', "O'Dowd", 'Vandermeer', 'Castellano', 'Brannigan', 'Thibodeau', 'Lindqvist', 'Okafor', 'Whitlock', 'Delacroix', 'Sandoval', 'Mahoney', 'Yamada', 'Gruber', 'Ashby', 'Fontaine', 'Rasmussen', 'Tolliver', 'Quinlan', 'Baptiste', 'Novak', 'Eastman'];
  var FEATS = ['carried the club through the stretch', 'was the talk of every sporting page', 'rewrote the record book', 'played through injury to finish the job', 'outshone every rival in the deciding weeks', 'drew crowds wherever the club travelled'];

  function fx(p, f, i, l, o) { return { popularity: p, finances: f, integrity: i, labor: l, owners: o }; }
  function opt(label, detail, effects, outcome, actions) {
    return { label: label, detail: detail, effects: effects, outcome: outcome, actions: actions || [] };
  }
  /* A gamble: one of two outcomes, rolled when the turn is written. */
  function risky(label, detail, chance, good, bad) {
    var r = Math.random() < chance ? good : bad;
    return opt(label, detail, r[0], r[1], r[2]);
  }

  function expansionCity(s) {
    var taken = {};
    s.teams.forEach(function (t) { taken[t.city] = (taken[t.city] || 0) + 1; });
    var pool = D.EXPANSION.filter(function (c) {
      return c[1] <= s.year && !taken[c[0]] ||
        (c[1] <= s.year && taken[c[0]] === 1 && (D.MARKETS[c[0]] || 1) >= 2.5 && s.teams.length > 14 &&
          !s.teams.some(function (t) { return t.name === c[2]; }));
    });
    return pool.length ? pick(pool) : null;
  }
  function weakTeam(s) {
    var st = s.lastSeason.standings;
    var id = st[st.length - 1 - Math.floor(Math.random() * Math.min(2, st.length - 1))].id;
    return s.teams.filter(function (t) { return t.id === id; })[0];
  }

  /* Each entry: id, from/to years, optional when(s,c) gate, optional force (must fire), make(s,c). */
  var DECK = [
    { id: 'war', from: 1917, to: 1945, force: true,
      when: function (s) { return s.year === 1918 || s.year === 1942 || s.year === 1944; },
      make: function (s, c) {
        return { title: 'The war and the game', natural: 1,
          text: 'The nation is at war. ' + cap(c.sp.player) + 's are enlisting by the dozen, trains are reserved for troops, and editorial pages ask whether grown men should be playing games at all.',
          options: [
            opt('Suspend play for the duration', 'Shut the gates until peace comes.', fx(-8, -10, 4, 2, -6), 'The gates were chained. The country approved, but the clubs bled money and the public found other habits.'),
            opt('Play on with whoever is left', 'Old men, boys and the medically unfit — but the schedule goes ahead.', fx(3, -2, 2, 0, 2), 'The quality was thin and everyone knew it, yet the games gave war workers something to cheer and the league kept its place in daily life.'),
            opt('Shorten the season and donate the gate', 'A reduced schedule with receipts pledged to war relief.', fx(4, -6, 6, 1, -3), 'The relief games won the league real goodwill. The owners grumbled over the lost receipts.', [{ type: 'rule', text: 'Wartime relief games established' }])
          ] };
      } },
    { id: 'pandemic', from: 2020, to: 2020, force: true,
      make: function (s, c) {
        return { title: 'A season in a pandemic', natural: 1,
          text: 'A global pandemic has shut down public life. Health officials forbid crowds; broadcasters still want their inventory.',
          options: [
            opt('Cancel the season outright', 'No games until it is plainly safe.', fx(-6, -12, 5, 3, -8), 'The cancellation was praised as responsible and was ruinous on the balance sheet.'),
            opt('Play in a sealed bubble, no fans', 'Isolate every club at one site and play for television.', fx(4, -3, 3, -2, 3), 'The bubble held. Empty-arena games felt strange, but the league was one of the few things on television and the audience was grateful.'),
            risky('Open the gates as normal', 'Sell every seat and trust to luck.', 0.25,
              [fx(5, 6, -2, -3, 4), 'Against the odds, the season passed without a major outbreak. Critics called it reckless; the owners called it profitable.'],
              [fx(-8, -5, -10, -9, -3), 'Outbreaks tore through three clubhouses and one sold-out crowd. Games were forfeited and the league was denounced from every pulpit.'])
          ] };
      } },
    { id: 'colorline', from: 0, to: 1975, force: true,
      when: function (s) { return !s.flags.integrated && s.year >= 1946 && (s.year - 1946) % 3 === 0; },
      make: function (s, c) {
        return { title: 'The colour line', natural: 0,
          text: 'By unwritten agreement the league has never signed a Black ' + c.sp.player + '. A club president now tells you he intends to sign one of the finest talents in the country. Several owners demand you stop him.',
          options: [
            opt('Approve the signing and end the colour line', 'Declare that every club may sign any player on merit.', fx(6, 3, 12, 6, -5), 'The signing went ahead. It was hard, and some owners never forgave you, but a wave of talent entered the league and history recorded the decision as its finest hour.', [{ type: 'flag', name: 'integrated' }, { type: 'rule', text: 'The colour line is abolished' }]),
            opt('Leave it to each club', 'Neither forbid nor endorse it.', fx(2, 1, 3, 2, -1), 'A few clubs signed Black players; most waited. Change came slowly, and club by club.', [{ type: 'flag', name: 'integrated' }]),
            opt('Block the signing', 'Side with the owners who want the old arrangement kept.', fx(-4, 0, -10, -5, 4), 'The signing was voided. The owners were content. The press was not, and the best unsigned players in the country went on playing elsewhere.')
          ] };
      } },
    { id: 'strike', from: 1965, to: 9999,
      when: function (s) { return s.metrics.labor < 40; },
      make: function (s, c) {
        return { title: 'Strike deadline', natural: 2,
          text: 'The players’ union has set a strike date. They want a larger share of revenue; the owners want you to break them.',
          options: [
            opt('Meet the union’s terms', 'Give the players most of what they ask.', fx(3, -8, 1, 14, -8), 'Play continued without interruption. The players were jubilant and the owners furious at the cost.'),
            risky('Lock the players out', 'Shut down first and wait for them to fold.', 0.35,
              [fx(-4, 3, 0, -6, 9), 'After six weeks the union cracked and signed on the owners’ terms. The owners toasted you. The players did not forget.'],
              [fx(-12, -10, -3, -12, -3), 'The lockout dragged for months. Half a season vanished, fans burned their tickets, and the eventual deal was no better than the one first offered.']),
            opt('Bring in a federal mediator', 'Split the difference with outside help.', fx(1, -3, 2, 8, -2), 'The mediator produced a deal nobody loved and everybody signed.', [{ type: 'rule', text: 'Collective bargaining agreement signed' }])
          ] };
      } },
    { id: 'dynasty', from: 0, to: 9999,
      when: function (s) { return !!E.dynasty(s); },
      make: function (s, c) {
        var d = E.dynasty(s);
        return { title: 'One club wins everything', natural: 0,
          text: 'The ' + d + ' have turned the championship into a formality. Attendance elsewhere is sagging and rival owners want something done.',
          options: [
            opt(s.year < 1935 ? 'Share gate receipts with weaker clubs' : s.year < 1985 ? 'Give the worst clubs first pick of new talent' : 'Tighten the salary cap and luxury tax', 'Level the field by rule.', fx(4, -1, 2, 1, 2), 'The reform took a few years to bite, but the league grew more even and the turnstiles in the smaller cities began to click again.', [{ type: 'rule', text: 'Competitive-balance measures adopted' }]),
            opt('Let greatness be', 'A dynasty is good copy. Do nothing.', fx(-4, 1, 0, 0, -3), 'The ' + d + ' kept winning. Their park was full; several others were not.'),
            opt('Quietly force them to sell stars', 'Lean on their owner in private.', fx(2, 0, -8, -4, -2), 'The stars were sold off under pressure. The story leaked, and it looked exactly like what it was.')
          ] };
      } },
    { id: 'gambling', from: 0, to: 1990,
      make: function (s, c) {
        return { title: 'The fix is in', natural: 0,
          text: 'A newspaperman brings you sworn statements: several ' + c.sp.player + 's on the ' + c.weakName + ' took gamblers’ money to throw ' + c.sp.contest + 's.',
          options: [
            opt('Ban them for life, publicly', 'Make an example whatever the courts say.', fx(-2, -2, 13, -4, 2), 'The bans landed like a thunderclap. The public was shocked, then reassured that somebody was in charge.', [{ type: 'rule', text: 'Lifetime ban for consorting with gamblers' }]),
            opt('Suspend them quietly for a season', 'Punish them, but keep it out of the papers.', fx(0, 0, -4, 1, 1), 'The suspensions were explained as “injuries”. The rumours never quite went away.'),
            risky('Bury the story', 'Buy the newspaperman’s silence.', 0.4,
              [fx(1, -2, -3, 2, 3), 'The story stayed buried, this time.'],
              [fx(-8, -3, -15, 0, -6), 'A rival paper printed everything, including your attempt to hush it up.'])
          ] };
      } },
    { id: 'rival', from: 0, to: 1988,
      when: function (s, c) { return !!c.exp && s.teams.length < 31; },
      make: function (s, c) {
        var second = expansionCity(s) || c.exp;
        var acts = [{ type: 'add_team', city: c.exp[0], name: c.exp[2] }];
        if (second[0] !== c.exp[0]) acts.push({ type: 'add_team', city: second[0], name: second[2] });
        return { title: 'A rival league', natural: 1,
          text: 'A syndicate of wealthy men has announced a competing league and is offering your best ' + c.sp.player + 's double their pay to jump.',
          options: [
            risky('Fight them to the death', 'Blacklist jumpers and match every offer.', 0.5,
              [fx(2, -8, 0, 5, 3), 'Two expensive years later the rival league collapsed. Salaries never came back down.'],
              [fx(-6, -14, -2, 6, -7), 'The bidding war was ruinous. The rival survived, your stars left, and the owners blamed you.']),
            opt('Absorb their strongest clubs', 'Negotiate peace and take in the best of them.', fx(5, -3, 1, -3, 3), 'Peace was signed in a hotel suite. The strongest rival clubs joined and the rest were left to wither.', acts),
            opt('Ignore them', 'They will fold on their own.', fx(-5, -4, 0, 3, -5), 'They did not fold quickly. For three seasons the public had two leagues to choose from, and many chose the other.')
          ] };
      } },
    { id: 'expand', from: 0, to: 9999,
      when: function (s, c) { return !!c.exp && s.teams.length < 32; },
      make: function (s, c) {
        return { title: c.exp[0] + ' wants in', natural: 0,
          text: 'A delegation from ' + c.exp[0] + ' has a ' + c.sp.venue + ', a backer and a name — the ' + c.exp[2] + ' — and is petitioning for a franchise.',
          options: [
            opt('Admit them', 'Grant the franchise for a fair fee.', fx(4, 5, 0, 2, 0), 'The ' + c.exp[0] + ' ' + c.exp[2] + ' took the field to a brass band and a full house.', [{ type: 'add_team', city: c.exp[0], name: c.exp[2] }]),
            risky('Demand a punishing entry fee', 'Make them pay dearly for the privilege.', 0.5,
              [fx(3, 10, -1, 1, 4), 'They paid. The existing owners split the windfall with broad smiles.', [{ type: 'add_team', city: c.exp[0], name: c.exp[2] }]],
              [fx(-2, -1, -2, 0, -2), 'The backers walked away insulted, and said so to the newspapers.']),
            opt('Turn them down', 'Keep the circle small.', fx(-2, 0, 0, -1, 1), 'The petition was declined. ' + c.exp[0] + ' went on supporting its local semi-professional club instead.')
          ] };
      } },
    { id: 'relocate', from: 0, to: 9999,
      when: function (s, c) { return !!c.exp && s.teams.length > 5; },
      make: function (s, c) {
        return { title: 'The ' + c.weakName + ' are failing', natural: 0,
          text: 'The ' + c.weakName + ' cannot meet payroll. Their owner wants to move the club to ' + c.exp[0] + ', where a new ' + c.sp.venue + ' is promised.',
          options: [
            opt('Approve the move', 'Let the club follow the money.', fx(1, 5, -2, 0, 3), 'The vans left at night. ' + c.weak.city + ' was bitter; ' + c.exp[0] + ' was delighted.', [{ type: 'relocate_team', team: c.weakName, city: c.exp[0], name: c.exp[2] }]),
            opt('Prop them up from league funds', 'Keep faith with the home city.', fx(3, -7, 2, 1, -3), 'The league covered the losses. The fans stayed loyal; the other owners counted what it cost them.'),
            opt('Let the club fold', 'A weak club drags everyone down.', fx(-4, 2, 0, -4, -1), 'The franchise was dissolved and its players scattered.', [{ type: 'remove_team', team: c.weakName }])
          ] };
      } },
    { id: 'union', from: 1885, to: 1964,
      make: function (s, c) {
        return { title: 'The players organise', natural: 2,
          text: 'The ' + c.sp.player + 's have formed a brotherhood and present demands: a minimum wage, an end to fines at the owner’s whim, and a say in their own sale.',
          options: [
            opt('Recognise the brotherhood', 'Negotiate with them as equals.', fx(1, -5, 2, 13, -8), 'The players won a seat at the table. The owners considered it a betrayal.', [{ type: 'rule', text: 'Players’ association recognised' }]),
            opt('Crush it', 'Release the ringleaders and blacklist them.', fx(-2, 2, -3, -13, 6), 'The leaders were cut and no club would sign them. The resentment went underground.'),
            opt('Grant the small demands', 'A minimum wage, nothing more.', fx(0, -2, 1, 6, -1), 'A modest concession bought a few quiet years.')
          ] };
      } },
    { id: 'freeagency', from: 1965, to: 1985,
      when: function (s) { return !s.flags.freeagency; },
      make: function (s, c) {
        return { title: 'The reserve clause on trial', natural: 2,
          text: 'A veteran ' + c.sp.player + ' refuses to be traded and is suing: the clause binding a player to one club for life, he says, makes him property.',
          options: [
            opt('Grant free agency', 'Let players sell their services after a term of years.', fx(4, -7, 3, 14, -9), 'Salaries leapt and the off-season became a spectacle of its own.', [{ type: 'flag', name: 'freeagency' }, { type: 'rule', text: 'Free agency established' }]),
            risky('Fight it to the highest court', 'The clause has stood for generations.', 0.3,
              [fx(-1, 2, -2, -8, 7), 'The court upheld the clause. The owners cheered and the players seethed.'],
              [fx(-3, -9, -5, 5, -8), 'The court struck the clause down entirely, on worse terms than you could have negotiated.', [{ type: 'flag', name: 'freeagency' }]]),
            opt('Negotiate a limited version', 'Free agency after six seasons, with compensation.', fx(2, -3, 2, 8, -2), 'Both sides claimed victory.', [{ type: 'flag', name: 'freeagency' }, { type: 'rule', text: 'Limited free agency after six seasons' }])
          ] };
      } },
    { id: 'radio', from: 1922, to: 1940,
      when: function (s) { return !s.flags.radio; },
      make: function (s, c) {
        return { title: 'The wireless question', natural: 2,
          text: 'Radio stations want to broadcast your ' + c.sp.contest + 's live. Owners fear nobody will buy a ticket for what they can hear free in the parlour.',
          options: [
            opt('Broadcast everything', 'Put every game on the air.', fx(11, 3, 0, 0, -2), 'Listeners who had never seen a game became devoted followers. Attendance rose rather than fell.', [{ type: 'flag', name: 'radio' }, { type: 'rule', text: 'Radio broadcasts permitted' }]),
            opt('Ban the microphones', 'Protect the gate.', fx(-6, 0, 0, 0, 3), 'The ban held. Other entertainments filled the airwaves and the public’s evenings.'),
            opt('Road games only', 'Broadcast away games; keep home games exclusive.', fx(6, 2, 0, 0, 2), 'The compromise spread the game without frightening the owners.', [{ type: 'flag', name: 'radio' }])
          ] };
      } },
    { id: 'tv', from: 1947, to: 1968,
      when: function (s) { return !s.flags.tv; },
      make: function (s, c) {
        return { title: 'Television money', natural: 0,
          text: 'The networks are bidding for rights. Big-city clubs want to sell their own games; small-city clubs say that would bury them.',
          options: [
            opt('One national contract, shared equally', 'The league sells everything and divides the cheque evenly.', fx(9, 10, 1, 1, 2), 'The pooled deal made every club solvent and put the league in every living room.', [{ type: 'flag', name: 'tv' }, { type: 'rule', text: 'National TV revenue shared equally' }]),
            opt('Each club sells its own', 'Let the market decide.', fx(5, 3, 0, 0, -3), 'The big-city clubs grew rich, and the gap to everyone else grew with them.', [{ type: 'flag', name: 'tv' }]),
            opt('Keep cameras out', 'Television will empty the stands.', fx(-8, -3, 0, 0, -4), 'Other sports took the airtime and the audience that went with it.')
          ] };
      } },
    { id: 'depression', from: 1930, to: 1938,
      make: function (s, c) {
        return { title: 'Hard times at the gate', natural: 2,
          text: 'Breadlines stretch around the block and the turnstiles are rusting. Several clubs say they will not see out the year.',
          options: [
            opt('Slash ticket prices', 'Fill the seats at any price.', fx(7, -5, 1, 0, -3), 'The cheap seats filled, and the league kept its place in people’s lives when they had little else.'),
            opt('Cut every salary by a third', 'The players can share the pain.', fx(-1, 6, 0, -10, 4), 'The books balanced. The players took note.'),
            opt('Try games under the lights', 'Let working men come after their shift.', fx(6, 3, 0, 0, 2), 'Purists scoffed at night games, and the crowds came anyway.', [{ type: 'rule', text: 'Night games introduced' }])
          ] };
      } },
    { id: 'safety', from: 0, to: 9999,
      make: function (s, c) {
        return { title: 'A death on the field', natural: 0,
          text: 'A young ' + c.sp.player + ' has died of injuries suffered in play. Reformers call the game barbaric and legislators are drafting bills to ban it.',
          options: [
            opt('Rewrite the rules for safety', 'Outlaw the most dangerous plays and require protective equipment.', fx(1, -2, 7, 5, 0), 'Traditionalists complained the game had gone soft. The legislators put away their bills.', [{ type: 'rule', text: 'Safety rules and equipment mandated' }]),
            opt('Express regret and change nothing', 'It is a hard game for hard men.', fx(-3, 0, -7, -5, 1), 'The statement of regret satisfied nobody.'),
            opt('Fine the offending club heavily', 'Punish the incident rather than the game.', fx(0, 1, 2, 1, -2), 'One club paid, and the conditions that caused the death were left as they were.')
          ] };
      } },
    { id: 'peds', from: 1988, to: 2015,
      make: function (s, c) {
        return { title: 'Chemistry in the clubhouse', natural: 2,
          text: 'Records are falling at an impossible rate and a trainer has told a grand jury why. Fans love the numbers. Do you want to know what is behind them?',
          options: [
            opt('Mandatory testing, real suspensions', 'Clean it up and take the consequences.', fx(-4, -2, 13, -5, -1), 'The first suspensions were stars, and the record chase ended overnight.', [{ type: 'rule', text: 'Mandatory drug testing' }]),
            risky('See nothing', 'The turnstiles are spinning.', 0.4,
              [fx(6, 6, -5, 2, 4), 'The records kept falling and the money kept coming.'],
              [fx(-7, -3, -15, -2, -5), 'A congressional hearing put you under oath on live television. It went badly.']),
            opt('Negotiate testing with the union', 'Go slower, with the players on board.', fx(0, -1, 6, 2, 0), 'A phased programme began. It was late, and it was a start.', [{ type: 'rule', text: 'Joint drug programme' }])
          ] };
      } },
    { id: 'stadium', from: 1950, to: 9999,
      make: function (s, c) {
        return { title: 'Who pays for the palace?', natural: 0,
          text: 'The ' + c.weakName + ' play in a crumbling ' + c.sp.venue + '. The owner wants a new one, built largely with ' + c.weak.city + '’s tax money.',
          options: [
            opt('Lobby the city for public funds', 'Lend the league’s weight to the campaign.', fx(1, 6, -3, 0, 5), 'The bond issue passed narrowly. The new building is handsome and the city will be paying for it for thirty years.'),
            opt('Insist the owner pays', 'Private profit, private cost.', fx(2, -3, 4, 0, -5), 'The public approved of your stand. The owners, to a man, did not.'),
            opt('Hint the club may leave', 'Let the city know other towns are interested.', fx(-4, 5, -5, 0, 4), 'The threat worked, and it was remembered.')
          ] };
      } },
    { id: 'playoffs', from: 0, to: 9999,
      when: function (s) { return s.playoffTeams * 2 <= s.teams.length && s.playoffTeams < 16; },
      make: function (s, c) {
        var n = s.playoffTeams === 1 ? 2 : Math.min(16, s.playoffTeams * 2);
        return { title: 'A bigger postseason', natural: 0,
          text: s.playoffTeams === 1
            ? 'The title simply goes to the club with the best record. Promoters propose a championship series between the top two.'
            : 'Too many clubs are out of the race by midsummer. A proposal would enlarge the postseason from ' + s.playoffTeams + ' clubs to ' + n + '.',
          options: [
            opt('Adopt it', 'More clubs in the hunt, more big games to sell.', fx(6, 5, -1, 0, 3), 'The new format produced an upset in its first year, and a great deal of money.', [{ type: 'set_playoff_teams', count: n }]),
            opt('Keep the old way', 'The long season should decide it.', fx(-2, -1, 2, 0, -2), 'Tradition was preserved, and so were the dull late-season weeks.')
          ] };
      } },
    { id: 'schedule', from: 0, to: 9999,
      when: function (s) { var lim = { baseball: 162, hockey: 82, football: 17, basketball: 82 }[s.sport]; return s.games < lim; },
      make: function (s, c) {
        var lim = { baseball: 162, hockey: 82, football: 17, basketball: 82 }[s.sport];
        var n = Math.min(lim, s.sport === 'football' ? s.games + 1 + (s.year > 1960 ? 1 : 0) : Math.round(s.games * 1.25));
        return { title: 'A longer schedule', natural: 0,
          text: 'The owners want more dates to sell: ' + n + ' ' + c.sp.contest + 's a season instead of ' + s.games + '. The players want to be paid for them.',
          options: [
            opt('Lengthen it and raise pay', 'More games, with a share for the players.', fx(3, 5, 0, 2, 2), 'The longer season was a success at the gate.', [{ type: 'set_games', count: n }]),
            opt('Lengthen it, same pay', 'A contract is a contract.', fx(2, 8, 0, -8, 4), 'The extra dates were pure profit. The players noticed who kept it.', [{ type: 'set_games', count: n }]),
            opt('Leave the schedule alone', 'Scarcity has value.', fx(0, -1, 0, 1, -3), 'Nothing changed, to the owners’ irritation.')
          ] };
      } },
    { id: 'sunday', from: 0, to: 1932,
      when: function (s) { return !s.flags.sunday; },
      make: function (s, c) {
        return { title: 'Games on the Sabbath', natural: 2,
          text: 'Working people have only Sunday free, but the clergy and the law in several cities forbid Sunday ' + c.sp.contest + 's.',
          options: [
            opt('Play on Sundays everywhere', 'Defy the blue laws.', fx(9, 6, -5, 0, 1), 'Crowds were enormous. So were the sermons against you, and two club presidents were arrested.', [{ type: 'flag', name: 'sunday' }]),
            opt('Forbid Sunday play', 'Keep the league respectable.', fx(-4, -3, 5, 0, -2), 'The league kept its good name and its empty Sundays.'),
            opt('Let each city decide', 'Play where it is legal.', fx(5, 3, 0, 0, 2), 'Sunday games took root wherever the law allowed.', [{ type: 'flag', name: 'sunday' }])
          ] };
      } },
    { id: 'antitrust', from: 1910, to: 1965,
      make: function (s, c) {
        return { title: 'Summoned to the capital', natural: 0,
          text: 'A legislative committee wants to know why your league should not be broken up as an unlawful monopoly.',
          options: [
            opt('Testify and seek an exemption', 'Argue that sport is not ordinary commerce.', fx(0, 2, 3, -2, 6), 'Your testimony was smooth and the exemption was granted.', [{ type: 'rule', text: 'Antitrust exemption secured' }]),
            opt('Offer reforms', 'Loosen the league’s grip on players and territories.', fx(2, -3, 5, 6, -6), 'The committee was satisfied. The owners felt you had given away the store.'),
            risky('Refuse to appear', 'This is no business of government.', 0.25,
              [fx(0, 0, -2, 0, 3), 'The committee lost interest and moved on to the railways.'],
              [fx(-3, -6, -9, 0, -6), 'A subpoena followed, then hostile hearings, then a costly consent decree.'])
          ] };
      } },
    { id: 'owner', from: 0, to: 9999,
      make: function (s, c) {
        return { title: 'An owner disgraces himself', natural: 1,
          text: 'The owner of the ' + c.weakName + ' has been caught ' + pick(['skimming gate receipts owed to visiting clubs', 'making vile remarks about his own players', 'betting on league games through a relative', 'selling his best players to pay private debts']) + '.',
          options: [
            opt('Force him to sell', 'Remove him from the league.', fx(3, -1, 9, 5, -7), 'He went, loudly. His fellow owners wondered which of them would be next.'),
            opt('Fine and suspend him', 'A year away and a heavy fine.', fx(0, 1, 3, 1, -1), 'He served his suspension and returned unchanged.'),
            opt('Stand by him', 'The owners are your employers.', fx(-3, 0, -9, -5, 6), 'The owners appreciated your loyalty, and nobody else did.')
          ] };
      } },
    { id: 'rulechange', from: 0, to: 9999,
      make: function (s, c) {
        return { title: 'A radical rule proposal', natural: 1,
          text: 'Scoring is down, ' + c.sp.contest + 's are dragging, and a committee has proposed the biggest rules change in a generation to speed things up.',
          options: [
            risky('Adopt it at once', 'The game must move with the times.', 0.6,
              [fx(8, 3, 0, 0, 1), 'The change was a sensation. Within three years nobody could imagine the game without it.', [{ type: 'rule', text: 'Major scoring reform (' + s.year + ')' }]],
              [fx(-5, -1, -2, -2, -3), 'The change produced farce. It was repealed after one embarrassing season.']),
            opt('Trial it for a year first', 'Test it in exhibition play.', fx(3, 0, 1, 1, 0), 'The trial ironed out the flaws, and a sensible version was adopted.', [{ type: 'rule', text: 'Scoring reform after trial (' + s.year + ')' }]),
            opt('Reject it', 'The game is fine as it is.', fx(-4, 0, 1, 0, -1), 'The game stayed as it was, and the crowds kept thinning.')
          ] };
      } },
    { id: 'streaming', from: 2006, to: 9999,
      when: function (s) { return !s.flags.streaming; },
      make: function (s, c) {
        return { title: 'The cord is being cut', natural: 0,
          text: 'Young fans do not own televisions. A technology giant offers a fortune for exclusive streaming rights; your cable partners threaten to walk.',
          options: [
            opt('Build the league’s own service', 'Own the audience directly.', fx(6, 3, 0, 0, 1), 'The launch was rocky and the long-term bet looks sound.', [{ type: 'flag', name: 'streaming' }]),
            opt('Sell exclusively to the tech giant', 'Take the largest cheque.', fx(-2, 12, 0, 1, 5), 'The cheque cleared. Older fans could not find the games.', [{ type: 'flag', name: 'streaming' }]),
            opt('Stay with cable', 'It has paid the bills for forty years.', fx(-7, 2, 0, 0, -2), 'The audience aged another year.')
          ] };
      } },
    { id: 'betting', from: 2018, to: 9999,
      when: function (s) { return !s.flags.betting; },
      make: function (s, c) {
        return { title: 'The sportsbooks come calling', natural: 0,
          text: 'Wagering is now legal in most of the country. Betting firms offer sponsorships worth more than your television deal.',
          options: [
            opt('Sign league-wide partnerships', 'Odds on the broadcast, logos on the boards.', fx(3, 12, -7, -1, 6), 'The money was extraordinary. The first betting scandal involving a player followed within two years.', [{ type: 'flag', name: 'betting' }]),
            opt('Refuse all of it', 'The league spent a century keeping gamblers out.', fx(-1, -4, 6, 0, -7), 'The owners watched other leagues bank the money.'),
            opt('Accept, with a strict integrity unit', 'Take the money and police it hard.', fx(2, 7, -1, -2, 3), 'A monitoring unit was funded from the proceeds, and has been busy.', [{ type: 'flag', name: 'betting' }, { type: 'rule', text: 'Integrity monitoring unit' }])
          ] };
      } },
    { id: 'abroad', from: 1988, to: 9999,
      make: function (s, c) {
        return { title: 'The game abroad', natural: 0,
          text: 'Promoters in London, Tokyo and Mexico City want regular-season ' + c.sp.contest + 's. Players dread the travel.',
          options: [
            opt('Stage a few games overseas each year', 'Plant the flag.', fx(5, 4, 0, -3, 2), 'The overseas dates sold out in minutes.', [{ type: 'rule', text: 'Annual international series' }]),
            opt('Stay home', 'Look after the fans you have.', fx(0, -1, 0, 2, -2), 'The league remained a domestic affair.'),
            risky('Announce a full overseas franchise', 'Think bigger.', 0.3,
              [fx(8, 6, 0, -5, 3), 'Against every prediction, the overseas club thrived.'],
              [fx(-3, -8, 0, -8, -4), 'The plan collapsed over travel and tax before a game was played.'])
          ] };
      } }
  ];

  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }

  function generateTurn(s) {
    var sp = D.SPORTS[s.sport], ls = s.lastSeason;
    var weak = weakTeam(s);
    var c = { sp: sp, exp: expansionCity(s), weak: weak, weakName: E.fullName(weak) };
    var ok = DECK.filter(function (d) {
      return s.year >= d.from && s.year <= d.to && (!d.when || d.when(s, c));
    });
    var forced = ok.filter(function (d) { return d.force; });
    var fresh = ok.filter(function (d) { return s.recent.indexOf(d.id) < 0; });
    var urgent = fresh.filter(function (d) { return d.id === 'strike' || d.id === 'dynasty'; });
    var chosen = forced[0] || (urgent.length && Math.random() < 0.6 ? pick(urgent) : null) || pick(fresh.length ? fresh : ok);
    s.recent.push(chosen.id);
    if (s.recent.length > 7) s.recent.shift();
    var dilemma = chosen.make(s, c);

    var top = ls.standings[0], champRow = ls.standings.filter(function (r) { return r.id === ls.championId; })[0];
    var star = { name: pick(FIRST) + ' ' + pick(LAST), team: ls.champion, feat: pick(FEATS) };
    var upset = ls.champion !== top.name;
    var headline = pick(upset
      ? [ls.champion + ' stun ' + top.name + ' to seize the title', 'Upset! ' + ls.champion + ' are champions']
      : [ls.champion + ' claim ' + sp.trophy, ls.champion + ' finish what they started', 'Nobody could catch the ' + ls.champion]);
    var recap = 'The ' + ls.champion + ' (' + champRow.w + '–' + champRow.l + ') are champions of the ' + s.leagueName + ' for ' + s.year + '.' +
      (upset ? ' The ' + top.name + ' owned the best record at ' + top.w + '–' + top.l + ' but fell when it mattered.' : ls.runnerUp ? ' The ' + ls.runnerUp + ' pushed them hardest.' : '') +
      ' ' + star.name + ' ' + star.feat + '.';
    return { source: 'almanac', headline: headline, recap: recap, star: star, dilemma: dilemma };
  }

  function epitaph(s) {
    var L = E.legacy(s), yrs = s.year - s.startYear + 1;
    var tally = {};
    s.history.forEach(function (h) { tally[h.champion] = (tally[h.champion] || 0) + 1; });
    var best = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; })[0];
    var text = s.over.type === 'legacy'
      ? 'After ' + yrs + ' seasons the ' + s.leagueName + ' stands at ' + s.teams.length + ' clubs. Under ' + s.commissioner + ' it outlasted wars, rivals and its own worst instincts.'
      : 'The ' + s.leagueName + ' lasted ' + yrs + ' season' + (yrs === 1 ? '' : 's') + ', from ' + s.startYear + ' to ' + s.year + '. ' + s.over.text;
    if (best) text += ' Its most decorated club was the ' + best + ', with ' + tally[best] + ' title' + (tally[best] === 1 ? '' : 's') + '.';
    return { title: s.over.type === 'legacy' ? 'A league for the ages' : 'The final edition', text: text, grade: L.grade, score: L.score };
  }

  var api = { generateTurn: generateTurn, epitaph: epitaph, DECK: DECK };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CommishOffline = api;
})(typeof window !== 'undefined' ? window : globalThis);
