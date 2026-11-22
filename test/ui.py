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
    calls = []; stream_mode = ['ok']
    def chat(r):
        body = r.request.post_data_json; calls.append(body)
        if 'Connection test' in body['messages'][-1]['content']: return r.fulfill(json={'model': 'test/model-1', 'choices': [{'message': {'content': 'pong'}}]})
        payload = DECREE if 'decree' in body['messages'][-1]['content'] else AI_TURN
        if 'retrospective' in body['messages'][0]['content']: payload = {'title': 'A Short, Loud Life', 'text': 'It burned brightly.'}
        if len(calls) == 3: return r.fulfill(status=500, json={'error': {'message': 'boom'}})
        text = '```json\n' + json.dumps(payload) + '\n```'
        assert body.get('stream') is True
        mode = stream_mode[0]
        if mode == 'json': return r.fulfill(json={'choices': [{'message': {'content': text}}]})
        sse = ': OPENROUTER PROCESSING\n\n' + ''.join('data: ' + json.dumps({'model': 'test/model-1', 'choices': [{'delta': {'content': text[i:i+37]}}]}) + '\n\n' for i in range(0, len(text), 37))
        if mode == 'cut': sse += 'data: ' + json.dumps({'choices': [{'delta': {}, 'finish_reason': 'length'}]}) + '\n\ndata: [DONE]\n\n'
        elif mode == 'ok': sse += 'data: ' + json.dumps({'choices': [{'delta': {}, 'finish_reason': 'stop'}]}) + '\n\ndata: [DONE]\n\n'
        r.fulfill(status=200, headers={'content-type': 'text/event-stream'}, body=sse)
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
    pg.click('[data-act=test]'); pg.wait_for_selector('.test-status.ok')
    assert 'Connected' in pg.inner_text('#test-status'), pg.inner_text('#test-status')
    assert pg.locator('.debug').count() == 0
    pg.check('[data-set=debug]'); assert pg.locator('.dbg').count() == 1
    assert 'sk-or-test' not in pg.inner_text('#debug') and 'pong' in pg.inner_text('#debug')
    pg.screenshot(path=str(out / '7-test-debug.png'), full_page=True)
    calls.clear()
    pg.click('button[type=submit]'); pg.wait_for_selector('.option')
    assert pg.locator('.dbg').count() == 2 and 'Drovers Take the Flag' in pg.inner_text('.dbg >> nth=0')
    assert 'Drovers Take the Flag' in pg.inner_text('.headline')
    assert calls[0]['messages'][0]['role'] == 'system' and calls[0]['model'] == 'openrouter/auto'
    pg.screenshot(path=str(out / '5-ai.png'), full_page=True)
    pg.fill('#decree', 'Pay their fares from league funds'); pg.click('.decree button'); pg.wait_for_selector('#outcome')
    assert 'trips were made' in pg.inner_text('.outcome')
    pg.click('[data-act=next]'); pg.wait_for_selector('.option')      # call 3 fails -> retry without json mode (call 4) succeeds
    assert 'response_format' in calls[2] and 'response_format' not in calls[3]
    pg.click('.option >> nth=0'); pg.wait_for_selector('#outcome')
    assert 'New York Empires are no more' in pg.inner_text('.notes')
    # no end signal (stream just closes) -> retried once, then the almanac steps in
    stream_mode[0] = 'none'; n = len(calls)
    pg.click('[data-act=next]'); pg.wait_for_selector('.option')
    assert 'closed before the model finished' in pg.inner_text('.notice') and len(calls) == n + 2, pg.inner_text('.notice')
    # cut off by the output limit -> reported, not retried
    pg.click('.option >> nth=1'); pg.wait_for_selector('#outcome'); stream_mode[0] = 'cut'; n = len(calls)
    pg.click('[data-act=next]'); pg.wait_for_selector('.option')
    assert 'output limit' in pg.inner_text('.notice') and len(calls) == n + 1
    # a provider that does not stream still works
    pg.click('.option >> nth=1'); pg.wait_for_selector('#outcome'); stream_mode[0] = 'json'
    pg.click('[data-act=next]'); pg.wait_for_selector('.option'); assert pg.locator('.notice').count() == 0
    pg.click('[data-act=settings]'); pg.wait_for_selector('.dialog'); pg.click('.dialog [data-act=close-settings]')
    pg.set_viewport_size({'width': 390, 'height': 800}); pg.screenshot(path=str(out / '6-mobile.png'), full_page=True)
    b.close()
print('errors:', errors); sys.exit(1 if errors else 0)
