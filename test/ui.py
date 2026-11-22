# Browser smoke test: python3 test/ui.py  (needs playwright + chrome)
import json, sys, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
url = (root / 'index.html').as_uri()
out = root / 'test' / 'shots'
out.mkdir(exist_ok=True)

AI_TURN = {"headline": "Drovers Take the Flag in Maiden Campaign", "recap": "Chicago's nine proved the class of the circuit. Crowds were fair and the cranks spirited.",
           "star": {"name": "Ezra Pickett", "team": "Chicago Drovers", "feat": "pitched every inning"},
           "dilemma": {"title": "Clubs Skip Their Western Trip", "text": "Two clubs refused to make their final road trip to save train fare.",
                       "options": [{"label": "Expel both clubs", "detail": "Make an example.", "outcome": "Both were expelled.", "effects": {"popularity": -3, "finances": -4, "integrity": 9, "labor": 0, "owners": 2}, "actions": [{"type": "remove_team", "team": "New York Empires"}]},
                                   {"label": "Fine them", "detail": "A stiff fine.", "outcome": "Fines were paid.", "effects": {"popularity": 0, "finances": 2, "integrity": 2, "labor": 0, "owners": -1}, "actions": []},
                                   {"label": "Forgive them", "detail": "Times are hard.", "outcome": "Nothing was done.", "effects": {"popularity": 0, "finances": 0, "integrity": -8, "labor": 0, "owners": 1}, "actions": []}], "natural": 0}}
DECREE = {"label": "Pay their fares from league funds", "outcome": "The trips were made.", "effects": {"popularity": 2, "finances": -5, "integrity": 3, "labor": 1, "owners": -2}, "actions": [{"type": "rule", "text": "League travel fund"}]}

errors = []
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.route('**/api/v1/models', lambda r: r.fulfill(json={'data': [{'id': 'openrouter/auto'}, {'id': 'test/model'}]}))
    calls = []
    def chat(r):
        body = r.request.post_data_json; calls.append(body)
        payload = DECREE if 'decree' in body['messages'][-1]['content'] else AI_TURN
        if 'retrospective' in body['messages'][0]['content']: payload = {'title': 'A Short, Loud Life', 'text': 'It burned brightly.'}
        if len(calls) == 3: return r.fulfill(status=500, json={'error': {'message': 'boom'}})
        r.fulfill(json={'choices': [{'message': {'content': '```json\n' + json.dumps(payload) + '\n```'}}]})
    pg.route('**/api/v1/chat/completions', chat)

    # 1. almanac mode, play by hand then watch to the end
    pg.goto(url)
    pg.screenshot(path=str(out / '1-start.png'), full_page=True)
    pg.check('input[name=useAI][value="0"]')
    pg.check('input[name=sport][value=football]')
    pg.fill('[data-form=league]', 'Test <League>')
    pg.click('button[type=submit]')
    pg.wait_for_selector('.option')
    assert pg.locator('.decree').count() == 0
    pg.screenshot(path=str(out / '2-decision.png'), full_page=True)
    pg.click('.option >> nth=0'); pg.wait_for_selector('#outcome')
    pg.screenshot(path=str(out / '3-outcome.png'), full_page=True)
    pg.click('[data-act=tab][data-tab=history]'); pg.click('[data-act=tab][data-tab=rules]')
    pg.click('[data-act=next]'); pg.wait_for_selector('.option')
    pg.reload(); pg.click('[data-act=resume]'); pg.wait_for_selector('.option')   # save/resume
    assert '1921' in pg.inner_text('.dateline')
    pg.evaluate("()=>{const o=setTimeout; window.setTimeout=(f,t)=>o(f,t>20000?t:Math.min(t,5))}")
    pg.check('.switch input')
    seen = set()
    for _ in range(400):
        if pg.locator('.end').count(): break
        seen.add(pg.evaluate('document.body.dataset.era')); pg.wait_for_timeout(30)
    assert pg.locator('.end').count(), 'watch mode did not reach the end'
    print('eras seen:', sorted(seen), '| end:', pg.inner_text('.end .headline'))
    pg.screenshot(path=str(out / '4-end.png'), full_page=True)

    # 2. AI mode with a mocked OpenRouter
    pg.click('[data-act=new]')
    pg.check('input[name=useAI][value="1"]'); pg.fill('[data-set=key]', 'sk-or-test'); pg.check('input[name=auto][value="0"]')
    pg.click('button[type=submit]'); pg.wait_for_selector('.option')
    assert 'Drovers Take the Flag' in pg.inner_text('.headline')
    assert calls[0]['messages'][0]['role'] == 'system' and calls[0]['model'] == 'openrouter/auto'
    pg.screenshot(path=str(out / '5-ai.png'), full_page=True)
    pg.fill('#decree', 'Pay their fares from league funds'); pg.click('.decree button'); pg.wait_for_selector('#outcome')
    assert 'trips were made' in pg.inner_text('.outcome')
    pg.click('[data-act=next]'); pg.wait_for_selector('.option')      # call 3 fails -> retry without json mode (call 4) succeeds
    assert 'response_format' in calls[2] and 'response_format' not in calls[3]
    pg.click('.option >> nth=0'); pg.wait_for_selector('#outcome')
    assert 'New York Empires are no more' in pg.inner_text('.notes')
    pg.click('[data-act=settings]'); pg.wait_for_selector('.dialog'); pg.click('.dialog [data-act=close-settings]')
    pg.set_viewport_size({'width': 390, 'height': 800}); pg.screenshot(path=str(out / '6-mobile.png'), full_page=True)
    b.close()
print('errors:', errors); sys.exit(1 if errors else 0)
