# Commissioner

A browser game. You are the commissioner of a fictional professional league — baseball, hockey, football or basketball — founded in the same year as its real counterpart (1876, 1917, 1920, 1946). Each turn is one season: the season is simulated, a newspaper reports it, and one decision lands on your desk. Keep five gauges above zero (fan interest, treasury, integrity, player relations, owner confidence) until the present day, or the league dies early.

You can run the league yourself or switch on **Watch** and let it take the course history would most likely have taken.

## Storytellers

- **OpenRouter AI** — paste an [OpenRouter API key](https://openrouter.ai/keys) on the start screen and pick any chat model (`openrouter/auto` by default). The model writes each season's report and dilemma, judges free-text decrees you write yourself, and writes the closing retrospective. One request per season, so a full baseball run is about 150 requests.
- **Built-in almanac** — no key needed. A fixed deck of period dilemmas. Also used automatically for any season where the OpenRouter call fails.

The start screen (and Settings in-game) has a **Test connection** button, which sends one tiny request to check the key, model and network, and a **Debug mode** switch, which shows every request body and raw response in a log under the page. The key never appears in the log.

The key is stored in your browser's `localStorage` and sent only to `openrouter.ai`. There is no server.

## Put it on GitHub Pages

The site is plain static files with no build step.

1. Create a repository and push these files to the `main` branch (keep `index.html` at the root).
2. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. After a minute it is live at `https://<user>.github.io/<repo>/`.

To run locally, open `index.html` in a browser.

## Layout

| File | Purpose |
| --- | --- |
| `js/data.js` | Sports, founding clubs, markets, eras |
| `js/engine.js` | Season simulation, gauges, structural actions, endings |
| `js/offline.js` | Built-in almanac writer |
| `js/ai.js` | OpenRouter prompts, parsing and fallbacks |
| `js/ui.js` | Interface, turn loop, saves |
| `test/balance.js` | `node test/balance.js` — survival rates for the almanac deck |
| `test/ui.py` | Playwright smoke test with a mocked OpenRouter |

Difficulty lives in `drift()` in `js/engine.js` (`HI`, `LO`, `SHOCK`).
