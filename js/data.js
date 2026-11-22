/* Static data: the four sports, founding clubs, markets, expansion pool. */
(function (root) {
  'use strict';

  var SPORTS = {
    baseball: {
      key: 'baseball', label: 'Baseball', startYear: 1876,
      anchor: 'the National League (1876)',
      defaultLeague: 'National Base Ball League',
      trophy: 'the Pennant Cup', player: 'ballplayer', venue: 'ballpark', contest: 'game',
      startGames: 70, startPlayoffs: 1, k: 30,
      blurb: 'Gaslight, gamblers and wooden grandstands.',
      teams: [
        ['Boston', 'Beacons'], ['Chicago', 'Drovers'], ['Cincinnati', 'Riverkings'],
        ['Hartford', 'Charter Oaks'], ['Louisville', 'Falls'], ['New York', 'Empires'],
        ['Philadelphia', 'Liberties'], ['St. Louis', 'Steamers']
      ]
    },
    hockey: {
      key: 'hockey', label: 'Hockey', startYear: 1917,
      anchor: 'the National Hockey League (1917)',
      defaultLeague: 'Dominion Hockey League',
      trophy: 'the Dominion Cup', player: 'skater', venue: 'arena', contest: 'match',
      startGames: 24, startPlayoffs: 2, k: 20,
      blurb: 'Five clubs, natural ice and a war on.',
      teams: [
        ['Montreal', 'Voyageurs'], ['Montreal', 'Mountaineers'], ['Toronto', 'Loyalists'],
        ['Ottawa', 'Lumber Kings'], ['Quebec', 'Citadels']
      ]
    },
    football: {
      key: 'football', label: 'Football', startYear: 1920,
      anchor: 'the NFL, founded as the APFA (1920)',
      defaultLeague: 'American Gridiron Association',
      trophy: 'the Founders Trophy', player: 'gridder', venue: 'stadium', contest: 'game',
      startGames: 11, startPlayoffs: 1, k: 12,
      blurb: 'Mill-town clubs meeting in a car showroom.',
      teams: [
        ['Akron', 'Rubbermen'], ['Canton', 'Forge'], ['Cleveland', 'Ironclads'],
        ['Dayton', 'Aviators'], ['Decatur', 'Millers'], ['Chicago', 'Stockyards'],
        ['Rochester', 'Flour Kings'], ['Rock Island', 'Railsplitters'],
        ['Buffalo', 'Lakemen'], ['Detroit', 'Motormen']
      ]
    },
    basketball: {
      key: 'basketball', label: 'Basketball', startYear: 1946,
      anchor: 'the NBA, founded as the BAA (1946)',
      defaultLeague: 'Continental Basketball Association',
      trophy: 'the Continental Trophy', player: 'cager', venue: 'arena', contest: 'game',
      startGames: 60, startPlayoffs: 6, k: 12,
      blurb: 'Hockey-arena owners filling empty nights.',
      teams: [
        ['Boston', 'Minutemen'], ['Chicago', 'Gales'], ['Cleveland', 'Forgers'],
        ['Detroit', 'Dynamos'], ['New York', 'Skyliners'], ['Philadelphia', 'Founders'],
        ['Pittsburgh', 'Smelters'], ['Providence', 'Lanterns'], ['St. Louis', 'Gateways'],
        ['Toronto', 'Northmen'], ['Washington', 'Federals']
      ]
    }
  };

  // Rough market weight; anything unlisted is 1.
  var MARKETS = {
    'New York': 3, 'Los Angeles': 2.8, 'Chicago': 2.5, 'Philadelphia': 2, 'Toronto': 1.9,
    'Boston': 1.8, 'San Francisco': 1.8, 'Dallas': 1.8, 'Houston': 1.8, 'Washington': 1.7,
    'Detroit': 1.6, 'Montreal': 1.6, 'Atlanta': 1.6, 'Brooklyn': 1.6, 'Miami': 1.5,
    'Seattle': 1.4, 'Phoenix': 1.4, 'Minneapolis': 1.3, 'Denver': 1.3, 'St. Louis': 1.3,
    'Cleveland': 1.2, 'Pittsburgh': 1.2, 'Baltimore': 1.2, 'San Diego': 1.2, 'Vancouver': 1.2,
    'Akron': 0.6, 'Canton': 0.5, 'Decatur': 0.4, 'Rock Island': 0.4, 'Dayton': 0.6,
    'Hartford': 0.7, 'Louisville': 0.8, 'Providence': 0.7, 'Quebec': 0.7, 'Rochester': 0.7
  };

  // [city, earliest plausible year, nickname] used by the built-in writer.
  var EXPANSION = [
    ['Pittsburgh', 1880, 'Ironmasters'], ['Cleveland', 1880, 'Lakeshores'],
    ['Baltimore', 1880, 'Chesapeakes'], ['Washington', 1885, 'Statesmen'],
    ['Brooklyn', 1885, 'Bridgemen'], ['Detroit', 1888, 'Straits'],
    ['Milwaukee', 1895, 'Brewmasters'], ['Kansas City', 1900, 'Plainsmen'],
    ['Minneapolis', 1900, 'Polars'], ['Buffalo', 1900, 'Nickels'],
    ['New York', 1900, 'Metropolitans'], ['Boston', 1900, 'Harbormen'],
    ['Chicago', 1900, 'Prairie Fire'], ['Philadelphia', 1900, 'Quarrymen'],
    ['Toronto', 1905, 'Tecumsehs'], ['Montreal', 1905, 'Royaux'],
    ['Los Angeles', 1930, 'Condors'], ['San Francisco', 1930, 'Fog'],
    ['Houston', 1950, 'Wildcatters'], ['Dallas', 1950, 'Longriders'],
    ['Atlanta', 1955, 'Firebirds'], ['Seattle', 1955, 'Emeralds'],
    ['Denver', 1955, 'Summit'], ['Miami', 1960, 'Tropics'],
    ['San Diego', 1960, 'Breakers'], ['Vancouver', 1960, 'Totems'],
    ['Phoenix', 1965, 'Scorch'], ['Portland', 1965, 'Pioneers'],
    ['Tampa', 1975, 'Gulls'], ['Salt Lake City', 1975, 'Summiteers'],
    ['Charlotte', 1985, 'Monarchs'], ['Nashville', 1985, 'Strummers'],
    ['Las Vegas', 1995, 'High Rollers'], ['Austin', 2000, 'Outlaws']
  ];

  var ERAS = [
    { key: 'gaslight', from: 0, label: 'Gaslight era' },
    { key: 'newsreel', from: 1920, label: 'Newsreel era' },
    { key: 'technicolor', from: 1946, label: 'Television era' },
    { key: 'cable', from: 1980, label: 'Cable era' },
    { key: 'digital', from: 2005, label: 'Digital era' }
  ];

  var METRICS = [
    { key: 'popularity', label: 'Fan interest', fail: 'The stands emptied. With nobody left watching, the clubs quietly disbanded.' },
    { key: 'finances', label: 'Treasury', fail: 'The league treasury ran dry and the clubs folded one after another.' },
    { key: 'integrity', label: 'Integrity', fail: 'Scandal swallowed the league whole. Press, public and politicians shut it down.' },
    { key: 'labor', label: 'Player relations', fail: 'The players walked out for good and founded a league of their own — without you.' },
    { key: 'owners', label: 'Owner confidence', fail: 'The club owners met without you and voted, unanimously, to dissolve your office and the league with it.' }
  ];

  var api = { SPORTS: SPORTS, MARKETS: MARKETS, EXPANSION: EXPANSION, ERAS: ERAS, METRICS: METRICS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CommishData = api;
})(typeof window !== 'undefined' ? window : globalThis);
