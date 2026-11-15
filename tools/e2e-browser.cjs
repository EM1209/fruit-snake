// Real-browser smoke test (Playwright/Chromium). Serve www/ first, e.g.
//   python3 -m http.server 8765 -d www   then   node tools/e2e-browser.cjs http://localhost:8765/index.html
// The microphone is never requested: SpeechRecognition and getUserMedia are trapped and the test fails if either is called.
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/index.html';
const OUT = process.env.SHOT_DIR || require('os').tmpdir();  // screenshots go here
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 420, height: 1000 }, permissions: [] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => {
    window.__micCalls = [];
    const orig = Math.random; window.__q = [];
    Math.random = () => window.__q.length ? window.__q.shift() : orig();
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => { window.__micCalls.push('gUM'); throw new Error('blocked'); };
    class FakeSR { start(){ window.__micCalls.push('SR.start'); } stop(){} abort(){} }
    window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  });
  const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
  const score = () => page.$eval('#score', e => +e.textContent);
  const waitScore = async (n, ms = 6000) => { try { await page.waitForFunction(n => +document.querySelector('#score').textContent >= n, n, { timeout: ms }); return true; } catch { return false; } };

  await page.goto(URL);
  ok(await page.isVisible('#startOverlay'), 'start overlay visible on load');
  ok((await page.$$('#catPicker .cat')).length === 4, '4 categories rendered');
  await page.screenshot({ path: OUT + '/01-start.png' });

  // category selection
  await page.click('#catPicker .cat:nth-child(2)');
  const t = await page.textContent('#trackTitle');
  ok(/Vegetables/i.test(t), 'category switch updates tracker: ' + t);
  ok(await page.evaluate(() => localStorage.getItem('fs_cat')) === 'veggies', 'category saved');

  // start a round; food forced 3 cells right of head (7,7) -> (10,7)
  await page.evaluate(() => { window.__q = [0.7, 0.5]; });
  await page.click('#startBtn');
  ok(!(await page.isVisible('#startOverlay')), 'round started (overlay hidden)');
  ok(await waitScore(1), 'collected first food (score 1)');
  await page.waitForSelector('#learnBanner.show', { timeout: 2000 }).catch(() => {});
  const banner = await page.textContent('#learnBanner');
  ok(banner.length > 0, 'learning feedback banner: "' + banner + '"');
  ok(/NEW!/.test(banner), 'NEW! badge on first find');
  const tc = await page.textContent('#trackCount');
  ok(/^1 \//.test(tc), 'tracker progress: ' + tc);
  await page.screenshot({ path: OUT + '/02-ate.png' });

  // pause / resume
  await page.click('#pauseBtn');
  ok(await page.isVisible('#pauseOverlay'), 'pause overlay shown');
  const s1 = await score(); await page.waitForTimeout(1200);
  ok(await score() === s1, 'score frozen while paused');
  await page.click('#resumeBtn');
  ok(!(await page.isVisible('#pauseOverlay')), 'resumed via button');
  await page.keyboard.press(' '); ok(await page.isVisible('#pauseOverlay'), 'space pauses');
  await page.keyboard.press(' '); ok(!(await page.isVisible('#pauseOverlay')), 'space resumes');

  // movement: food forced at (7,10), directly BELOW the head; snake starts moving right,
  // so it only gets there if the Down key turns it
  await page.reload();
  ok(/Vegetables/i.test(await page.textContent('#trackTitle')), 'category persisted across reload');
  await page.evaluate(() => { window.__q = [0.5, 0.7]; });
  await page.click('#startBtn');
  await page.keyboard.press('ArrowDown');
  ok(await waitScore(1, 3000), 'movement: arrow-key turn down reached food below');
  // control: food below, no key pressed -> snake keeps going right and should NOT eat it quickly
  await page.reload();
  await page.evaluate(() => { window.__q = [0.5, 0.7]; });
  await page.click('#startBtn');
  ok(!(await waitScore(1, 2500)), 'control: without turning, food below is not reached');
  // on-screen pad turns too
  await page.reload();
  await page.evaluate(() => { window.__q = [0.5, 0.2]; });   // (7,3): above head
  await page.click('#startBtn');
  await page.click('.pad .up');
  ok(await waitScore(1, 3000), 'movement: on-screen ▲ button turn reached food above');
  await page.click('.pad .left');
  await page.waitForTimeout(400);
  ok(errors.length === 0, 'no JS errors during play');

  // Little Voices in tap mode (no microphone)
  await page.reload();
  await page.click('#sayBtn');
  ok(await page.isVisible('#gateOverlay'), 'grown-up gate opens');
  await page.click('#gateTapBtn');
  ok(await page.evaluate(() => localStorage.getItem('fs_saymode')) === 'tap', 'tap mode set (no mic)');
  ok(await page.isVisible('#starChip'), 'SAID chip shown');
  await page.evaluate(() => { window.__q = [0.7, 0.5]; });
  await page.click('#startBtn');
  await page.waitForSelector('#sayOverlay:not([hidden])', { timeout: 5000 });
  ok(true, 'say-it overlay opened after eating');
  await page.waitForSelector('#saidItBtn:not([hidden])', { timeout: 6000 });
  await page.screenshot({ path: OUT + '/03-sayit.png' });
  await page.click('#saidItBtn');
  await page.waitForFunction(() => +document.querySelector('#stars').textContent >= 1, null, { timeout: 3000 });
  ok(true, 'star awarded via tap');
  await page.waitForSelector('#sayOverlay', { state: 'hidden', timeout: 4000 });
  ok(true, 'game resumed after say turn');
  await page.click('#sayBtn');
  ok(await page.evaluate(() => localStorage.getItem('fs_saymode')) === 'off', 'say-it turned off');

  // shop
  await page.click('#shopBtn'); ok(await page.isVisible('#shopOverlay'), 'shop opens');
  await page.click('#shopCloseBtn');

  const mic = await page.evaluate(() => window.__micCalls);
  ok(mic.length === 0, 'microphone never requested: ' + JSON.stringify(mic));
  ok(errors.length === 0, 'no JS errors: ' + JSON.stringify(errors));
  await page.screenshot({ path: OUT + '/04-end.png' });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
