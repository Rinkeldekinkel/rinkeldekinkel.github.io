# Sports League Commissioner

A browser strategy game about the life of a professional sports league. Run the league from its founding charter, delegate its administration, or follow the alternate history as an observer. One run can reach 31 December 2026 or end early when the league can no longer field or finance a viable competition.

| Sport | Opening league | Founding year | Opening membership |
| --- | --- | --- | --- |
| Baseball | National League | 1876 | 8 clubs |
| American football | American Professional Football Association | 1920 | 14 clubs |
| Basketball | Basketball Association of America | 1946 | 11 clubs in two divisions |
| Ice hockey | National Hockey League | 1917 | 4 operating clubs and a dormant Québec charter |

## Run locally

Use Node.js 20 or later. The project uses native browser modules and the Node standard library, with zero npm dependencies.

```sh
npm run dev
```

Open [127.0.0.1:4173](http://127.0.0.1:4173/). The server listens on loopback by default. Set `HOST` and `PORT` to override the bind address and port for your own environment.

```sh
npm test
npm run build
npm run preview
```

The production build produces `dist/server/index.js`, a self-contained Fetch-compatible ES module Worker with the application and its assets built in. `npm run preview` serves that same Worker locally. The build also produces `dist/Sports-League-Commissioner.html`, a single offline file. Open it in a current browser to play without a server. The HTML copy supports save export and import and uses IndexedDB when the browser permits file-origin storage. OpenRouter runs through the game server.

## Play

The first visit opens the 1876 baseball charter. Use **New league** to pick a different sport, difficulty or world seed. A seed and the same approved actions reproduce the same sporting and economic history.

- **Active commissioner** reviews every proposal. Use **Commissioner office** to read trade-offs and see owners’ votes after each decision.
- **Hybrid commissioner** delegates routine proposals and pauses for major ones.
- **Hands-off observer** delegates the agenda. Turn on **Pause for major decisions** to intervene at major votes.
- Pick the simulation interval on the desk or in the office. **Next event** runs to the next recorded development or batch of related developments. **Finish season** stops at the closing accounts and recorded championship. **Through 2026** advances to the end of the historical calendar, including the data available through December for a winter season in progress.
- Pause and resume a run, or cancel the original target and keep the months already processed. While the season is between schedules, use the office to bring an expansion, constitutional amendment, media offer or other eligible question before the board.

The standings include fixtures, postseason series and sport-specific leaders. The directory preserves former names and markets, old venues, owner records and title history. The map and timeline show past franchise memberships. The encyclopedia and newspaper archive stay accessible after a league dissolves.

## How the game works

The engine schedules round-robin league fixtures with rotating home assignments and era-appropriate target lengths. Baseball starts with a pennant, football uses an approximation of directors’ ratification, the basketball charter runs a two-division postseason, and hockey begins with a split-season title. Future competition formats require approvals. Sport-specific scoring takes account of roster talent, coaching, home advantage, injuries, travel fatigue and a seeded probability distribution.

Gate receipts reflect venue size, market demand, team performance, public appeal and historical shocks. Owners pay for salaries, travel, venues, interest and central dues. League policy changes revenue sharing and media income. Sustained losses exhaust credit, reduce confidence and can force relocation, consolidation, shutdown or league dissolution. Policies and historical shocks affect future seasons as well as the current agenda.

Market populations use rounded historical knots and interpolation. Era technology constrains travel and media income. Owners cast votes using priorities such as profitability, prestige, loyalty to their market, and player welfare. Rival associations raise capital, recruit players, claim markets, operate their own compact competition records and can merge or fail. Admitted charters keep their entry history and rival results remain in the rival register.

Selected founding athletes appear alongside generated, persistent featured athletes. The engine follows their age, contracts, season statistics, awards, transfers, retirement and occasional coaching appointments. Player lineups are representative rosters. Match scores are simulated as full scores and player stats are allocated by role and era. Venue capacities, budget units, population curves, historical purchasing power and rival finances are calibrated gameplay estimates. Exact match days, complete historical rosters, exhaustive sport rules, independent exhibition schedules, rival box scores and detailed labour negotiations sit outside this model. The interactive geography uses a simplified coastline and city coordinates.

## OpenRouter

In the server-hosted game, open **Settings → OpenRouter** and enter an OpenRouter API key. Select an ID from **Fetch model list** or enter a compatible chat model ID. For a model with reasoning tokens, increase the token limit if the response is incomplete. The archive model field lets you pick a different model for biographies and retrospectives.

With generation enabled, use the commentary controls in news articles, franchise biographies, individual biographies and the timeline. The office can generate a proposal whenever the agenda has space. A proposal must match a current eligible action. Approved drafts enter the same owner votes and validation as the game’s own proposals. News and biographies are saved as generated commentary attached to the game’s records.

Automatic reviews run after progression at the selected cadence, up to the session request budget. The panel reports request count, token use and reported or estimated cost when available. Each request sends a compact description of the relevant in-game records. The same-origin server calls the fixed OpenRouter endpoint and relays structured content. The key lives in tab memory for the session. The app uses its built-in event and news generators while OpenRouter is disabled, unreachable, rate-limited or returns unusable output.

- [OpenRouter chat completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)
- [OpenRouter model catalogue](https://openrouter.ai/models)

## Saves

The application stores saves per browser origin in IndexedDB. Use **Save & load** to name a manual checkpoint, switch campaigns, or export a JSON file. Export before moving between the hosted game, a local server and the offline file, since these contexts use separate browser storage.

The current league autosaves after decisions, settings changes, simulation commands and every three seasons during longer runs. After closing or refreshing the tab, a saved in-progress run offers **Resume**. An export includes the structured league history, fixture results, player and team records, policies, random state and generated annotations. OpenRouter keys and connection settings are outside the save format. Schema 2 loads validated schema 1 exports through migration.

## Development and verification

- `engine/` holds the seeded game, economic and sporting rules, governance, roster development, and save validation.
- `web/` holds navigation, UI, visualisations, browser persistence and the OpenRouter client.
- `server/` holds the local host and same-origin OpenRouter relay.
- `scripts/build.js` builds the Worker and the standalone edition.
- `test/` covers authentic starts, all four complete runs, schedule and roster integrity, decisions, relocation, collapse, deterministic restoration, malformed imports, and OpenRouter responses with a test provider.

## Historical references

- [Baseball Reference, National League charter membership](https://www.baseball-reference.com/bullpen/National_League_team_history) and [Baseball Almanac, 1876 National League](https://www.baseball-almanac.com/yearly/yr1876n.shtml).
- [NFL, Original towns and clubs](https://www.nfl.com/100/original-towns/) and [Pro Football Hall of Fame, 1920 timeline](https://www.profootballhof.com/football-history/football-history/1869-1939/1919).
- [NBA, original BAA teams](https://www.nba.com/news/what-were-the-original-nba-teams) and [NBA, 1946–47 season review](https://www.nba.com/news/history-season-review-1946-47).
- [NHL Records, year-by-year history](https://records.nhl.com/history).
- [U.S. Census Bureau, historic urban populations](https://www.census.gov/library/working-papers/1998/demo/POP-twps0027.html).

The four banner illustrations are generated period reconstructions. Font notices are included with the assets.
