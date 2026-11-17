export const LAST_YEAR = 2026;
export const VERSION = 2;
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const SPORTS = {
  baseball: {
    label:'Baseball', modern:'MLB', name:'National League', tag:'NL', start:1876, month:2, day:2, first:2, play:6, close:8,
    format:'pennant', games:70, roster:9, positions:['C','1B','2B','3B','SS','OF','OF','OF','P'], min:4, venue:'park',
    founder:'Morgan Bulkeley', foundingPlace:'New York City', cost:1380000, tickets:27, size:20800, appeal:51,
    description:'Eight clubs sign a charter to bring order to professional baseball. With rail fares due and gate receipts uncertain, can they make it through their first season?',
    context:'The National Association has just given way to a more formal circuit. The new charter relies on club-controlled grounds, rail travel and gate receipts.',
    sources:['https://www.baseball-reference.com/bullpen/National_League_team_history','https://www.baseball-almanac.com/yearly/yr1876n.shtml'],
    rivals:[],
    clubs:[
      ['BOS','boston','Boston Red Caps','South End Grounds',65,7700,48,'Nicholas Appolonio'],
      ['CHI','chicago','Chicago White Stockings','23rd Street Grounds',76,10600,58,'William Hulbert'],
      ['CIN','cincinnati','Cincinnati Red Stockings','Avenue Grounds',43,6500,42],
      ['HAR','hartford','Hartford Dark Blues','Hartford Ball Club Grounds',66,5500,34,'Morgan Bulkeley'],
      ['LOU','louisville','Louisville Grays','Louisville Baseball Park',58,6200,40],
      ['NYM','brooklyn','New York Mutuals','Union Grounds',54,7700,55],
      ['PHA','philadelphia','Philadelphia Athletics','Jefferson Street Grounds',56,7600,50],
      ['STL','stlouis','St. Louis Brown Stockings','Grand Avenue Grounds',67,8000,44]
    ],
    athletes:[['CHI','Cap Anson',1852,'3B',82,'Marshalltown'],['CHI','Al Spalding',1850,'P',86,'Byron'],['BOS','Deacon White',1847,'C',82,'Caton'],['BOS','George Wright',1847,'SS',85,'New York'],['HAR','Tommy Bond',1856,'P',80,'Granard']]
  },
  football: {
    label:'American football', modern:'NFL', name:'American Professional Football Association', tag:'APFA', start:1920, month:9, day:17, first:1, play:3, close:3,
    format:'ratification', games:10, roster:10, positions:['QB','HB','FB','E','E','T','G','C','LB','K'], min:4, venue:'field',
    founder:'Jim Thorpe', foundingPlace:'Canton, Ohio', cost:1850000, tickets:34, size:19600, appeal:43,
    description:'Fourteen clubs come together to curb bidding wars and player jumping. Local crowds and short trips will have to sustain the new association.',
    context:'The owners meet in Canton. There is no formal fixture obligation or postseason. The simulation models the league fixtures and a directors’ ratification.',
    sources:['https://www.nfl.com/100/original-towns/','https://www.profootballhof.com/football-history/football-history/1869-1939/1919','https://www.profootballhof.com/football-history/national-footbal-league-franchise-histories'],
    rivals:[],
    clubs:[
      ['AKR','akron','Akron Pros','League Park',75,4600,45,'Art Ranney'],
      ['BUF','buffalo','Buffalo All-Americans','Canisius Villa',73,6600,47],
      ['CAN','canton','Canton Bulldogs','Lakeside Park',74,5500,44,'Ralph Hay'],
      ['CAR','chicago','Chicago Cardinals','Normal Park',53,5500,52,'Chris O’Brien'],
      ['CTI','chicago','Chicago Tigers','Cubs Park',48,6100,42],
      ['CLE','cleveland','Cleveland Tigers','League Park',55,4900,42],
      ['COL','columbus','Columbus Panhandles','Neil Park',48,4600,38,'Joe Carr'],
      ['DAY','dayton','Dayton Triangles','Triangle Park',63,5000,46,'Carl Storck'],
      ['DEC','decatur','Decatur Staleys','Staley Field',74,4400,49,'A. E. Staley'],
      ['DET','detroit','Detroit Heralds','Navin Field',52,5800,39],
      ['HAM','hammond','Hammond Pros','Harrison Park',52,3600,35],
      ['MUN','muncie','Muncie Flyers','Walnut Park',39,2900,29],
      ['ROC','rochester','Rochester Jeffersons','Edgerton Park',52,4600,37,'Leo Lyons'],
      ['RI','rockisland','Rock Island Independents','Douglas Park',69,4800,41]
    ],
    athletes:[['CAN','Jim Thorpe',1887,'HB',88,'Prague, Oklahoma'],['AKR','Fritz Pollard',1894,'HB',87,'Chicago'],['DEC','George Halas',1895,'E',74,'Chicago']]
  },
  basketball: {
    label:'Basketball', modern:'NBA', name:'Basketball Association of America', tag:'BAA', start:1946, month:6, day:6, first:5, play:5, close:10,
    format:'divisional', games:60, roster:8, positions:['PG','SG','SF','PF','C','G','F','C'], min:4, venue:'arena',
    founder:'Maurice Podoloff', foundingPlace:'New York City', cost:2750000, tickets:31, size:17500, appeal:45,
    description:'Arena owners give professional basketball a stage in eleven cities. Winning the winter gate means taking on established regional circuits.',
    context:'Arena operators start an East–West competition. The National Basketball League and the American Basketball League are already operating.',
    sources:['https://www.nba.com/news/what-were-the-original-nba-teams','https://www.nba.com/news/history-season-review-1946-47'],
    rivals:[['National Basketball League','NBL',['fortwayne','rochester','toledo','indianapolis']],['American Basketball League','ABL',['baltimore','jerseycity','scranton']]],
    clubs:[
      ['BOS','boston','Boston Celtics','Boston Garden',50,11500,46,null,'East'],
      ['CHI','chicago','Chicago Stags','Chicago Stadium',71,14800,54,null,'West'],
      ['CLE','cleveland','Cleveland Rebels','Cleveland Arena',59,9400,42,null,'West'],
      ['DET','detroit','Detroit Falcons','Olympia Stadium',50,10500,41,null,'West'],
      ['NYK','newyork','New York Knickerbockers','Madison Square Garden',65,15000,54,'Ned Irish','East'],
      ['PHW','philadelphia','Philadelphia Warriors','Philadelphia Arena',71,8700,52,'Eddie Gottlieb','East'],
      ['PIT','pittsburgh','Pittsburgh Ironmen','Duquesne Gardens',40,7300,37,null,'West'],
      ['PRO','providence','Providence Steamrollers','Rhode Island Auditorium',58,5200,41,null,'East'],
      ['STL','stlouis','St. Louis Bombers','St. Louis Arena',64,11200,46,null,'West'],
      ['TOR','toronto','Toronto Huskies','Maple Leaf Gardens',49,11300,43,null,'East'],
      ['WAS','washington','Washington Capitols','Uline Arena',74,7200,51,null,'East']
    ],
    athletes:[['PHW','Joe Fulks',1921,'PF',90,'Birmingham, Kentucky'],['CHI','Max Zaslofsky',1925,'SG',83,'Brooklyn'],['WAS','Bob Feerick',1920,'SF',80,'San Francisco'],['PRO','Ernie Calverley',1924,'PG',76,'Pawtucket']]
  },
  hockey: {
    label:'Ice hockey', modern:'NHL', name:'National Hockey League', tag:'NHL', start:1917, month:11, day:26, first:1, play:4, close:4,
    format:'split', games:22, roster:8, positions:['C','LW','RW','D','D','F','F','G'], min:3, venue:'rink',
    founder:'Frank Calder', foundingPlace:'Montréal', cost:1000000, tickets:34, size:17400, appeal:48,
    description:'A new league assembles four active clubs across eastern Canada. Divided owners, a wartime player pool and natural ice make for a precarious debut.',
    context:'The former NHA clubs organise in Montréal. Québec holds a charter in abeyance and Toronto receives a temporary entry. The inaugural title represents the league championship.',
    sources:['https://records.nhl.com/history','https://www.nhl.com/history/a-brief-history-of-the-league'],
    rivals:[['Pacific Coast Hockey Association','PCHA',['vancouver','seattle','portland']]],
    clubs:[
      ['MTL','montreal','Montréal Canadiens','Montréal Arena',74,6500,62,'George Kennedy'],
      ['MW','montreal','Montréal Wanderers','Montréal Arena',49,6500,37,'Sam Lichtenhein'],
      ['OTT','ottawa','Ottawa Senators','The Arena',69,5600,53,'Tommy Gorman'],
      ['TOR','toronto','Toronto Arenas','Arena Gardens',66,7300,50],
      ['QUE','quebec','Québec Bulldogs','Québec Skating Rink',58,3500,43,null,null,'suspended']
    ],
    athletes:[['MTL','Joe Malone',1890,'C',89,'Québec'],['MTL','Newsy Lalonde',1887,'C',87,'Cornwall'],['OTT','Clint Benedict',1892,'G',86,'Ottawa'],['OTT','Cy Denneny',1891,'LW',83,'Farran’s Point'],['TOR','Reg Noble',1896,'LW',79,'Collingwood'],['MW','Harry Hyland',1889,'RW',80,'Montréal']]
  }
};

const cityRows = [
  ['newyork','New York','NY',40.75,-73.98,1206,5620,7782,8008,8420,'Empire,Metropolitans,Knights'],
  ['brooklyn','Brooklyn','NY',40.68,-73.95,566,2018,2627,2465,2700,'Bridge Club,Robins,Bridges'],
  ['boston','Boston','MA',42.36,-71.06,363,748,697,589,675,'Pilgrims,Mariners,Harbor'],
  ['chicago','Chicago','IL',41.88,-87.63,503,2702,3550,2896,2720,'Lake Shores,Railmen,Wind'],
  ['cincinnati','Cincinnati','OH',39.10,-84.51,255,401,503,331,312,'Queen City,Founders,Steamboats'],
  ['hartford','Hartford','CT',41.76,-72.67,42,138,162,122,121,'Charters,Oaks,Comets'],
  ['louisville','Louisville','KY',38.25,-85.76,123,235,391,256,624,'Bourbons,Colonels,Derby'],
  ['philadelphia','Philadelphia','PA',39.95,-75.17,847,1824,2003,1517,1560,'Keystones,Liberties,Bells'],
  ['stlouis','St. Louis','MO',38.63,-90.2,351,773,750,348,279,'Mounds,Explorers,Archers'],
  ['akron','Akron','OH',41.08,-81.52,17,208,290,217,188,'Rubbermen,Goodyears,Treads'],
  ['buffalo','Buffalo','NY',42.88,-78.88,155,507,532,293,276,'Bisons,Lakers,Breakers'],
  ['canton','Canton','OH',40.81,-81.38,13,88,113,81,69,'Furnace Club,Boilermakers,Forge'],
  ['cleveland','Cleveland','OH',41.50,-81.70,160,797,876,478,363,'Forest City,Lake Captains,Guard'],
  ['columbus','Columbus','OH',39.96,-83.00,52,237,471,711,931,'Capitals,Iron Horses,Aviators'],
  ['dayton','Dayton','OH',39.76,-84.19,38,153,262,166,136,'Dayton Club,Flight,Flyers'],
  ['decatur','Decatur','IL',39.84,-88.95,9,43,79,82,69,'Millers,Prairie Club,Harvest'],
  ['detroit','Detroit','MI',42.33,-83.05,116,994,1670,951,645,'Mechanics,Motor Club,Torque'],
  ['hammond','Hammond','IN',41.61,-87.50,1,37,112,83,77,'Steel Club,Steelers,Furnace'],
  ['muncie','Muncie','IN',40.19,-85.39,5,36,68,67,65,'Glassmen,Artisans,Glassworks'],
  ['rochester','Rochester','NY',43.16,-77.61,89,296,318,220,208,'Flour City,Millers,High Falls'],
  ['rockisland','Rock Island','IL',41.51,-90.58,11,36,51,39,36,'Islanders,Arsenal,Rivermen'],
  ['pittsburgh','Pittsburgh','PA',40.44,-80.00,156,588,604,335,306,'Alleghenies,Iron Club,Iron'],
  ['providence','Providence','RI',41.82,-71.41,105,237,207,174,194,'Grays,Steamships,Anchors'],
  ['toronto','Toronto','ON',43.65,-79.38,87,522,680,2480,3030,'York Club,Harbor Lights,Northstars'],
  ['washington','Washington','DC',38.91,-77.04,177,437,764,572,703,'Nationals,Senators,Monuments'],
  ['montreal','Montréal','QC',45.50,-73.57,140,618,1191,1039,1780,'Royals,Mariners,Voyageurs'],
  ['ottawa','Ottawa','ON',45.42,-75.70,27,107,269,790,1100,'Ottawas,Rivermen,Citadel'],
  ['quebec','Québec','QC',46.81,-71.21,62,96,171,476,560,'Citadels,Mariners,Ramparts'],
  ['baltimore','Baltimore','MD',39.29,-76.61,332,734,939,651,568,'Marylands,Clippers,Port'],
  ['jerseycity','Jersey City','NJ',40.72,-74.06,121,299,276,240,299,'Skeeters,Wharfmen,Batteries'],
  ['scranton','Scranton','PA',41.41,-75.66,46,137,111,76,76,'Miners,Coal Barons,Steam'],
  ['fortwayne','Fort Wayne','IN',41.08,-85.14,26,86,161,205,273,'Twine Club,Foresters,Forges'],
  ['toledo','Toledo','OH',41.65,-83.54,50,243,319,313,266,'Mudlarks,Canalmen,Glass'],
  ['indianapolis','Indianapolis','IN',39.77,-86.16,75,314,476,781,891,'Hoosiers,Wheelmen,Speed'],
  ['milwaukee','Milwaukee','WI',43.04,-87.91,116,457,741,597,561,'Cream City,Brewmasters,Barons'],
  ['minneapolis','Minneapolis','MN',44.98,-93.27,47,381,482,383,430,'Millers,Grainmen,North Lights'],
  ['stpaul','St. Paul','MN',44.95,-93.09,42,235,313,287,306,'Saints,Winter Club,Capitals'],
  ['kansascity','Kansas City','MO',39.10,-94.58,56,324,475,442,515,'Stockmen,Railheads,Monarchs'],
  ['omaha','Omaha','NE',41.26,-95.94,31,192,301,390,486,'Omahans,Plainsmen,Stampede'],
  ['richmond','Richmond','VA',37.54,-77.44,63,171,220,198,229,'James River,Foundry,Capitals'],
  ['nashville','Nashville','TN',36.16,-86.78,43,118,171,563,688,'Cumberland,Volunteers,Sound'],
  ['atlanta','Atlanta','GA',33.75,-84.39,37,201,487,416,520,'Gate City,Crackers,Firebirds'],
  ['neworleans','New Orleans','LA',29.95,-90.07,216,387,628,485,364,'Pelicans,Crescents,Crescent'],
  ['dallas','Dallas','TX',32.78,-96.80,10,159,680,1189,1326,'Prairie Club,Mustangs,Mavericks'],
  ['houston','Houston','TX',29.76,-95.37,17,139,938,1954,2390,'Buffaloes,Wildcats,Launch'],
  ['miami','Miami','FL',25.76,-80.19,0,30,292,362,477,'Biscayne Club,Flamingos,Tide'],
  ['tampa','Tampa','FL',27.95,-82.46,1,52,275,303,410,'Cigar City,Smokers,Surge'],
  ['denver','Denver','CO',39.74,-104.99,36,256,494,555,727,'Silver Club,Mountaineers,Altitude'],
  ['phoenix','Phoenix','AZ',33.45,-112.07,2,29,439,1321,1660,'Desert Club,Scorpions,Heatwave'],
  ['losangeles','Los Angeles','CA',34.05,-118.24,11,577,2479,3695,3878,'Angels,Stars,Pacific'],
  ['sanfrancisco','San Francisco','CA',37.77,-122.42,234,507,740,777,829,'Golden Gate,Seals,Fog'],
  ['seattle','Seattle','WA',47.61,-122.33,4,315,557,563,782,'Rainiers,Pilots,Evergreens'],
  ['portland','Portland','OR',45.52,-122.68,18,258,373,529,636,'Webfoots,Loggers,Stags'],
  ['vancouver','Vancouver','BC',49.28,-123.12,1,117,385,545,708,'Terminal Club,Millionaires,Orcas'],
  ['winnipeg','Winnipeg','MB',49.90,-97.14,8,179,266,619,790,'Wheat City,Grain Kings,Northwind'],
  ['calgary','Calgary','AB',51.05,-114.07,0,63,249,879,1490,'Foothills,Wranglers,Chinooks'],
  ['edmonton','Edmonton','AB',53.55,-113.49,0,59,281,666,1150,'River Fort,Trappers,Aurora'],
  ['mexicocity','Mexico City','MX',19.43,-99.13,230,615,2942,8600,9300,'Capital Club,Diablos,Jaguar'],
  ['monterrey','Monterrey','MX',25.69,-100.32,36,88,602,1110,1170,'Sultanes,Industriales,Sierra']
];

export const CITIES = Object.fromEntries(cityRows.map(([id,name,region,lat,lon,...rest]) => [id,{id,name,region,lat,lon,pop:rest.slice(0,5),names:rest[5].split(',')}]));
export const COLORS = ['#914b44','#3c576c','#91662f','#527066','#644e6c','#836052','#4e6b81','#6e3e4a','#416055','#636844','#755836','#5e576d'];
export const WORLD_EVENTS = [
  [1886,'Rail connections widen','New rail links make longer trips affordable for established clubs.',1.04,1,.91,0],
  [1893,'Panic of 1893','Tight credit and job losses hurt demand for tickets.',.82,1.08,1,0],
  [1907,'Panic of 1907','A banking crisis makes it harder for owners to refinance their clubs.',.87,1.05,1,0],
  [1917,'Wartime mobilisation','Military service and transport priorities tighten the player market.',.84,1.16,1.13,0],
  [1918,'Influenza pandemic','Public gathering restrictions and illness disrupt crowds and lineups.',.65,1.13,1.11,0],
  [1921,'Commercial radio','Live radio creates an audience beyond the gate.',1.04,1,1,.04],
  [1929,'Stock market crash','Investors retreat as the country heads into a long downturn.',.89,1.06,1,0],
  [1930,'Great Depression','Unemployment cuts discretionary spending and threatens indebted clubs.',.72,1.09,1,0],
  [1933,'Banking crisis','Credit stays scarce during the worst of the Depression.',.75,1.08,1,0],
  [1942,'Wartime travel restrictions','Wartime rationing and call-ups put pressure on fixtures and payroll.',.83,1.15,1.24,0],
  [1946,'Postwar demand returns','Crowds return to arenas as peacetime commerce resumes.',1.12,.98,.92,0],
  [1952,'Television reaches new homes','More households can watch sport from home. Rights grow more valuable.',1.03,1,1,.13],
  [1958,'Commercial jet service','Coast-to-coast travel becomes more practical for national leagues.',1.04,1,.76,0],
  [1964,'Civil Rights Act','Expanded access reshapes who can travel, attend and participate in sport.',1.05,.97,1,0],
  [1974,'Oil shock and inflation','Rising transport costs and inflation put pressure on club budgets.',.94,1.04,1.24,0],
  [1980,'Cable sports networks','Dedicated networks are looking for more regular programming.',1.03,1,1,.20],
  [1995,'The commercial internet','Coverage and merchandise can reach distant supporters.',1.05,1,1,.12],
  [2008,'Global financial crisis','Ticket sales and corporate spending fall as credit tightens.',.86,1.07,1,0],
  [2012,'Streaming accelerates','Out-of-market fans become a bigger part of the rights business.',1.03,1,1,.22],
  [2020,'COVID-19 pandemic','Capacity limits sharply reduce ticket and concessions revenue.',.29,1.07,1.05,0],
  [2021,'Venues reopen','Supporters gradually return to the stands.',.84,1.02,1,0],
  [2022,'Inflation accelerates','Facilities and travel become more expensive to operate.',.98,1.04,1.13,0]
];

export const NAMES = {
  first:['Albert','Arthur','Walter','Frank','George','Edward','Henry','Joseph','Thomas','Charles','Will','Sam','Jack','Harry','Hugh','Oscar','Louis','Martin','Ernest','Fred','Hector','Léo','Jean','Jules','Marcel','Roy','Eddie','Clarence','Calvin','Ray','Ralph','James','Paul','Dave','Vic','Joel','Jerome','Andre','Isaiah','Marcus','Jamal','Darius','Malik','Mateo','Luis','Diego','Tyler','Trevor','Cole','Mason','Omar','Isaac','Tobias','Noah','Elias','Alex','Dylan','Lucas','Jaden','Nathan','Gabe','Xavier'],
  last:['Abbott','Baker','Miller','Sullivan','Gallagher','Walker','Brown','King','Reed','Brooks','Bell','Simmons','Dawson','Lefebvre','Tremblay','Roy','Gagnon','Marchand','Nash','Casey','Fields','Kennedy','Voss','Carter','Ward','Page','Grant','Murphy','Boone','Nolan','Bennett','Cook','Edwards','Davis','Richards','Ortega','Rivera','Cruz','Lopez','Young','Tucker','Little','Hicks','Dixon','Ellis','Hayes','Sanders','Hughes','Ford','Fletcher','Scott','Allen','Thomas','Jackson','Warren','Hart'],
  firms:['Sporting Syndicate','Recreation Company','Athletic Association','Arena Company','Sports Holdings','Civic Sports Group','Broadcast Partners','Sports and Entertainment']
};

export const DIFFICULTIES = {
  forgiving:{label:'Forgiving',cash:1.45,demand:1.13,cost:.92},
  standard:{label:'Standard',cash:1,demand:1,cost:1},
  hardship:{label:'Hardship',cash:.40,demand:.75,cost:1.16}
};
