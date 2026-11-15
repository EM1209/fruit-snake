// Snake Explorers — real-browser end-to-end test (Playwright/Chromium).
//
//   python3 -m http.server 8770            (from the repo root, so ../www resolves)
//   node tools/e2e-explorers.cjs http://localhost:8770/explorers/index.html
//   node tools/e2e-explorers.cjs file:///path/to/bundle.html       (published bundle)
//
// Plays every activity through a complete round in Explore, Practice and
// Challenge, deliberately answering wrong first, then checks hints, pause,
// settings, the Discovery Book, unlocks, persistence, blocked storage, missing
// speech, reduced motion, layout at several sizes, and that nothing ever asks
// for the microphone. Screenshots go to $SHOT_DIR (default: OS temp dir).
const { chromium } = require("playwright");
const os = require("os"), fs = require("fs"), path = require("path");
const URL = process.argv[2] || "http://localhost:8770/explorers/index.html";
const SHOTS = process.env.SHOT_DIR || path.join(os.tmpdir(), "explorers-shots");
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else failures++; console.log((c ? "PASS " : "FAIL ") + msg); };

const TRAP = () => {
  window.__mic = [];
  const md = navigator.mediaDevices;
  if (md) md.getUserMedia = async () => { window.__mic.push("getUserMedia"); throw new Error("blocked by test"); };
  class SR { start() { window.__mic.push("SpeechRecognition.start"); } stop() {} abort() {} addEventListener() {} }
  window.SpeechRecognition = SR; window.webkitSpeechRecognition = SR;
};
const ACTS = [["word", 0, "snack-hunt"], ["word", 1, "letter-line"], ["number", 0, "berry-count"], ["number", 1, "number-questions"],
  ["pattern", 0, "pattern-path"], ["pattern", 1, "shape-sort"], ["nature", 0, "habitat-homes"], ["nature", 1, "life-cycles"], ["nature", 2, "nature-walk"],
  ["logic", 0, "code-snake"], ["everyday", 0, "step-by-step"], ["everyday", 1, "ready-weather"], ["everyday", 2, "kind-choices"]];

async function newPage(browser, opts) {
  const o = opts || {};
  const ctx = await browser.newContext({ viewport: o.viewport || { width: 1280, height: 800 }, reducedMotion: o.reducedMotion || "no-preference", hasTouch: !!o.hasTouch });
  await ctx.addInitScript(TRAP);
  if (o.blockStorage) await ctx.addInitScript(() => { Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("blocked", "SecurityError"); } }); });
  if (o.noSpeech) await ctx.addInitScript(() => { try { delete window.speechSynthesis; } catch (e) {} Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined }); });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", e => page.errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) page.errors.push("console: " + m.text()); });
  await page.goto(URL);
  return { ctx, page };
}

const prompt = (page) => page.evaluate(() => window.SnakeExplorers.prompt());
const mech = (page) => page.evaluate(() => window.SnakeExplorers.mech());
const state = (page) => page.evaluate(() => window.SnakeExplorers.state());
async function fbKind(page) { return page.evaluate(() => (document.querySelector("#feedback").className.match(/fb-(\w+)/) || [])[1] || ""); }
async function waitNext(page, ms) {
  try { await page.waitForSelector("#nextBtn", { timeout: ms || 15000 }); }
  catch (e) {
    const dump = await page.evaluate(() => ({ fb: document.querySelector("#feedback").textContent, instr: document.querySelector("#instr").textContent,
      tray: Array.from(document.querySelectorAll(".tray .sitem")).map(x => x.dataset.id), prompt: window.SnakeExplorers.prompt(), mech: window.SnakeExplorers.mech() }));
    console.log("STUCK:", JSON.stringify(dump).slice(0, 1500));
    throw e;
  }
}

async function setSpeed(page, v) {
  await page.goto(URL);
  await page.click('#scr-home [data-go="settings"]');
  await page.check(`input[name="speed"][value="${v}"]`, { force: true });
  await page.click('#scr-settings [data-go="home"]');
}
async function openActivity(page, world, idx, mode) {
  await page.goto(URL);
  await page.click("#exploreBtn");
  await page.click(`[data-world="${world}"]`);
  await page.check(`#modePicker input[value="${mode}"]`, { force: true });
  await page.locator(".play-act").nth(idx).click();
  await page.waitForSelector("#scr-play:not([hidden])");
}

// ---------------- solvers ----------------
function bfs(N, from, dir, goal, blocked) {
  const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, OPP = { up: "down", down: "up", left: "right", right: "left" };
  const key = (x, y) => x + "," + y;
  const q = [[from.x, from.y, []]], seen = new Set([key(from.x, from.y)]);
  while (q.length) {
    const [x, y, p] = q.shift();
    for (const [d, [dx, dy]] of Object.entries(D)) {
      if (p.length === 0 && d === OPP[dir]) continue;
      const nx = (x + dx + N) % N, ny = (y + dy + N) % N, k = key(nx, ny);
      if (nx === goal.x && ny === goal.y) return p.concat([d]);
      if (seen.has(k) || blocked.has(k)) continue;
      seen.add(k); q.push([nx, ny, p.concat([d])]);
    }
  }
  return null;
}
const KEY = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
async function steerTo(page, pred, blockPred) {
  for (let guard = 0; guard < 6; guard++) {
    const m = await mech(page);
    const goal = m.items.find(pred);
    if (!goal) return false;
    const blocked = new Set(m.items.filter(i => i !== goal && blockPred(i)).map(i => i.x + "," + i.y));
    const route = bfs(m.N, m.snake[0], m.dir, goal, blocked);
    if (!route) return false;
    for (const d of route) await page.keyboard.press(KEY[d]);
    const after = await mech(page);
    if (after.snake[0].x === goal.x && after.snake[0].y === goal.y) return true;
  }
  return false;
}

async function solveCollect(page, p, tryWrong) {
  if (p.kind === "explore") {
    for (let k = 0; k < p.goal; k++) {
      await steerTo(page, i => i.kind === "food", () => false);
      await page.waitForTimeout(30);
    }
    await page.waitForSelector("#nextBtn", { timeout: 6000 });
    return;
  }
  if (p.kind === "find") {
    if (tryWrong) {
      await steerTo(page, i => i.id !== p.target, i => i.id === p.target);
      ok((await fbKind(page)) === "wrong", "collect: wrong snack gives a 'Not yet' hint and the snake waits");
    }
    await steerTo(page, i => i.id === p.target, () => true);
    return waitNext(page);
  }
  // count
  if (tryWrong) {
    await steerTo(page, i => i.kind === "basket", () => true);
    ok((await fbKind(page)) === "wrong", "count: visiting the basket too early explains what's missing");
  }
  for (let n = 0; n < p.target; n++) await steerTo(page, i => i.kind === "berry", i => true);
  if (tryWrong) {   // one too many, then put one back
    await steerTo(page, i => i.kind === "berry", i => true);
    await steerTo(page, i => i.kind === "basket", () => true);
    ok((await fbKind(page)) === "wrong" && /more than/.test(await page.textContent("#feedback")), "count: too many berries → explains and offers Put one back");
    await page.click(".putback");
    ok((await mech(page)).have === p.target, "count: Put one back returns a berry");
  }
  await steerTo(page, i => i.kind === "basket", () => true);
  return waitNext(page);
}
function goodSelection(rule) {
  if (rule.type === "one") return [rule.valid[0]];
  if (rule.type === "some") return rule.valid.slice(0, rule.n);
  if (rule.type === "all") return rule.valid.slice();
  return rule.required.concat(rule.groups.map(g => g.ids[0]));
}
const allowed = (rule) => new Set((rule.valid || []).concat(rule.required || [], ...(rule.groups || []).map(g => g.ids)));
async function solveChoose(page, p, tryWrong) {
  const multi = p.rule.type !== "one";
  if (tryWrong) {
    const bad = p.options.find(o => !allowed(p.rule).has(o.id));
    await page.click(`.opt[data-id="${bad.id}"]`);
    if (multi) await page.click(".choose .check");
    ok((await fbKind(page)) === "wrong", "choose: wrong pick marked 'Not yet' with a hint" + (p.wrongHints && p.wrongHints[bad.id] ? " (specific)" : ""));
    ok(await page.locator(`.opt[data-id="${bad.id}"] .badge.no`).count() === 1, "choose: the wrong choice shows a ✕ + words, not just color");
    await page.click("#helpBtn");
    ok((await fbKind(page)) === "hint", "choose: Hint button gives a hint");
  }
  for (const id of goodSelection(p.rule)) {
    const b = page.locator(`.opt[data-id="${id}"]`);
    if (multi && (await b.getAttribute("aria-pressed")) === "true") continue;
    await b.click();
  }
  if (multi) await page.click(".choose .check");
  return waitNext(page);
}
async function solveSequence(page, p, tryWrong) {
  const fixed = new Set(p.fixed || []);
  if (tryWrong) {
    // fill in reverse order, then check
    const order = p.tiles.map(t => t.id).reverse();
    for (const id of order) { const b = page.locator(`.pool .tile[data-id="${id}"]`); if (await b.count()) { await b.click(); if (!(await page.locator(".slot:not(.filled)").count())) break; } }
    await page.click(".sequence .check");
    const k = await fbKind(page);
    if (k === "wrong") ok(true, "sequence: wrong order gets specific feedback and a retry");
    else ok(k === "right", "sequence: (reverse happened to be right)");
    if (k === "right") return waitNext(page);
    await page.click(".sequence .clear");
  }
  // place the remaining correct values in order, skipping locked slots
  for (let i = 0; i < p.slots; i++) {
    const slot = page.locator(".slots .slot").nth(i);
    const cls = await slot.getAttribute("class");
    if (/locked|given/.test(cls)) continue;
    if (/filled/.test(cls)) { await slot.locator(".slot-btn").click(); }
    const want = p.answers[0][i];
    const tiles = await page.$$eval(".pool .tile", (ts) => ts.map(t => t.dataset.id));
    const t = tiles.find(id => p.tiles.find(x => x.id === id).value === want);
    await page.click(`.pool .tile[data-id="${t}"]`);
  }
  await page.click(".sequence .check");
  return waitNext(page);
}
async function solveSort(page, p, tryWrong) {
  let first = true;
  for (const it of p.items) {
    if (tryWrong && first) {
      const wrongBin = p.bins.find(b => !it.bins.includes(b.id));
      await page.click(`.sitem[data-id="${it.id}"]`);
      await page.click(`.bin[data-bin="${wrongBin.id}"]`);
      ok((await fbKind(page)) === "wrong", "sort: wrong basket → item returns with a hint");
      ok(await page.locator(`.sitem[data-id="${it.id}"]`).count() === 1, "sort: the item is still there to try again");
      first = false;
    }
    if (it === p.items[1]) {
      // keyboard: focus the item, Enter, Tab to the bin, Enter
      await page.focus(`.sitem[data-id="${it.id}"]`);
      await page.keyboard.press("Enter");
      await page.focus(`.bin[data-bin="${it.bins[0]}"]`);
      await page.keyboard.press("Enter");
      ok(await page.locator(`.sitem[data-id="${it.id}"]`).count() === 0, "sort: keyboard (Enter on item, Enter on basket) works");
      continue;
    }
    if (it === p.items[2]) {
      // drag with the pointer
      const a = await page.locator(`.sitem[data-id="${it.id}"]`).boundingBox();
      const b = await page.locator(`.bin[data-bin="${it.bins[0]}"]`).boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(a.x + 40, a.y + 40, { steps: 4 });
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 }); await page.mouse.up();
      ok(await page.locator(`.sitem[data-id="${it.id}"]`).count() === 0, "sort: drag and drop works");
      continue;
    }
    await page.click(`.sitem[data-id="${it.id}"]`);
    await page.click(`.bin[data-bin="${it.bins[it.bins.length - 1]}"]`);
  }
  return waitNext(page);
}
async function solvePlan(page, p, tryWrong) {
  const lv = p.level;
  if (tryWrong) {
    const off = lv.start.x === 0 ? "left" : lv.start.y === 0 ? "up" : lv.start.x === lv.w - 1 ? "right" : "down";
    await page.click(`[data-add="${off}"]`);
    await page.click(".plan .run");
    await page.waitForFunction(() => document.querySelector("#feedback").className.includes("fb-"), null, { timeout: 8000 });
    ok((await fbKind(page)) === "wrong", "plan: a bad route stops, marks the step, and explains");
    ok(await page.locator(".chip.fail").count() === 1, "plan: the failing arrow is highlighted for fixing");
    await page.click(".plan .clear");
  }
  const sol = await page.evaluate((lv) => window.SE_Logic.solveLevel(lv), lv);
  // use the keyboard for arrows on every other level, buttons otherwise
  for (const [k, d] of sol.path.entries()) {
    if (k % 2) await page.keyboard.press(KEY[d]); else await page.click(`[data-add="${d}"]`);
  }
  await page.click(".plan .run");
  return waitNext(page, 30000);
}
async function solveExplore(page, p) {
  for (const c of p.cards) await page.click(`.fcard[data-id="${c.id}"]`);
  await page.click(".explore .done");
  return waitNext(page);
}

async function playRound(page, world, idx, aid, mode) {
  await openActivity(page, world, idx, mode);
  const st0 = await state(page);
  ok(st0.round.activity === aid && st0.round.mode === mode, `${aid}/${mode}: round started`);
  let guard = 0, wrongTried = false;
  while ((await state(page)).screen === "play" && guard++ < 20) {
    const p = await prompt(page);
    const tryWrong = !wrongTried && p.graded !== false;
    if (tryWrong) wrongTried = true;
    if (p.mechanic === "collect") await solveCollect(page, p, tryWrong);
    else if (p.mechanic === "choose") await solveChoose(page, p, tryWrong);
    else if (p.mechanic === "sequence") await solveSequence(page, p, tryWrong);
    else if (p.mechanic === "sort") await solveSort(page, p, tryWrong);
    else if (p.mechanic === "plan") await solvePlan(page, p, tryWrong);
    else if (p.mechanic === "explore") await solveExplore(page, p);
    if (guard === 1) ok((await fbKind(page)) === "right" || p.graded === false, `${aid}/${mode}: correct answer confirmed with ✓ and explanation`);
    await page.click("#nextBtn");
  }
  await page.waitForSelector("#scr-results:not([hidden])", { timeout: 5000 });
  const title = await page.textContent("#resTitle");
  ok(/complete|walk/i.test(title), `${aid}/${mode}: results screen ("${title}")`);
  return page.textContent("#resLine");
}

// ---------------- main ----------------
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await newPage(browser);

  // home
  ok(await page.isVisible("#exploreBtn"), "home: Let’s explore is visible");
  ok(await page.isHidden("#continueBtn"), "home: no Continue before any play");
  ok((await page.$$("[data-go]")).length >= 4, "home: My Snake, Discovery Book, Settings, Classic Snake links");
  ok(await page.evaluate(() => window.SnakeExplorers.persistent()), "storage: persistent in a normal browser");

  await setSpeed(page, "step");
  for (const mode of ["explore", "practice", "challenge"]) {
    for (const [w, i, aid] of ACTS) {
      if (aid === "code-snake") { await setSpeed(page, "lively"); }
      const line = await playRound(page, w, i, aid, mode);
      if (aid === "code-snake") { await setSpeed(page, "step"); }
      if (mode === "practice" && aid === "number-questions") ok(/after another look/.test(line), "results: retries are reported honestly (" + line + ")");
    }
  }
  const d = await page.evaluate(() => window.SnakeExplorers.data());
  ok(d.progress.stats.rounds === 39, "progress: 39 rounds recorded (" + d.progress.stats.rounds + ")");
  const seen = Object.values(d.progress.concepts).filter(c => c.seen > 0).length, prac = Object.values(d.progress.concepts).filter(c => c.practiced > 0).length;
  ok(seen > prac && prac > 10, `progress: discovered (${seen}) is tracked separately from practiced (${prac})`);
  const walk = d.progress.concepts;
  ok(Object.keys(d.progress.stats.worlds).length === 6, "progress: all six worlds have finished rounds");

  // results suggestion & play again
  await page.screenshot({ path: SHOTS + "/results-desktop.png" });
  ok(await page.locator("#resPrac .mini-entry").count() > 0 || await page.locator("#resNew .mini-entry").count() > 0, "results: discoveries / practice listed");
  await page.click("#againBtn");
  ok((await state(page)).screen === "play", "results: Play again starts a new round");

  // replay, help, pause/resume, speed change, leave, restart
  await openActivity(page, "word", 0, "practice");
  await page.click("#replayBtn");
  ok(await page.evaluate(() => document.querySelector("#instr").classList.contains("flash")), "play: Repeat replays the instruction (visual flash + voice when on)");
  await page.keyboard.press("Escape");
  ok(await page.isVisible("#pauseOverlay"), "pause: Escape pauses");
  await page.check('input[name="pspeed"][value="lively"]', { force: true });
  ok((await page.evaluate(() => window.SnakeExplorers.data().settings.speed)) === "lively", "pause: movement speed can be changed without leaving");
  await page.click("#resumeBtn");
  ok(await page.isHidden("#pauseOverlay"), "pause: Keep going resumes");
  const h0 = (await mech(page)).snake[0];
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(900);
  const h1 = (await mech(page)).snake[0];
  ok(Math.abs(h1.y - h0.y) + Math.abs(h1.x - h0.x) >= 2 || h1.y !== h0.y, "movement: continuous mode keeps moving after one press");
  await page.click("#pauseBtn");
  const frozen = (await mech(page)).snake[0];
  await page.waitForTimeout(800);
  const still = (await mech(page)).snake[0];
  ok(frozen.x === still.x && frozen.y === still.y, "pause: the snake does not move while paused");
  await page.click("#restartBtn");
  ok((await state(page)).round.i === 0 && (await page.isHidden("#pauseOverlay")), "pause: Start this round again works");
  // swipe on the board (pointer)
  const bb = await page.locator(".board").boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2 - 80, { steps: 4 }); await page.mouse.up();
  await page.waitForTimeout(400);
  ok((await mech(page)).dir === "up", "touch: swiping up on the board steers up");
  await page.click("#leaveBtn");
  ok((await state(page)).screen === "world", "play: Leave returns to the world screen");
  await setSpeed(page, "relaxed");

  // mode changes really change content
  await openActivity(page, "logic", 0, "explore");
  const e = await prompt(page);
  await openActivity(page, "logic", 0, "challenge");
  const c = await prompt(page);
  ok(e.level.w === 4 && !e.level.key && c.level.key && c.level.w === 5, "modes: Explore and Challenge give different puzzles (not just labels)");
  ok(await page.isVisible("#playMode") && (await page.textContent("#playMode")) === "Challenge", "modes: current mode is shown in the activity");

  // home: continue adventure
  await page.goto(URL);
  ok(await page.isVisible("#continueBtn"), "home: Continue adventure appears after playing");
  ok(/Code the Snake/.test(await page.textContent("#continueBtn")), "home: Continue names the last activity");

  // My Snake unlocks
  await page.click('[data-go="mysnake"]');
  const unlockedCount = await page.locator(".look-opt:not(.locked)").count();
  ok(unlockedCount >= 6, "My Snake: earned looks unlocked after play (" + unlockedCount + " available)");
  const hat = page.locator("#lookAccessories .look-opt").nth(1);
  await hat.click();
  ok((await page.evaluate(() => window.SnakeExplorers.data().look.accessory)) === "hat", "My Snake: choosing the Explorer hat saves it");
  ok(await page.locator("#snakePreview svg").count() === 1, "My Snake: live preview");
  await page.screenshot({ path: SHOTS + "/mysnake-desktop.png", fullPage: true });

  // Discovery Book
  await page.click('#scr-mysnake [data-go="home"]');
  await page.click('[data-go="book"]');
  const found = await page.locator(".entry:not(.unknown)").count();
  const totalSeen = (await page.$$eval(".bt-count", els => els.map(e => +e.textContent.split("/")[0]))).reduce((a, b) => a + b, 0);
  ok(found >= 1 && totalSeen > 30, "Book: discovered entries are shown (" + totalSeen + " across worlds; opens on the last world played)");
  await page.locator(".entry:not(.unknown)").first().click();
  ok(await page.isVisible("#entryDetail") && await page.isVisible("#edHear"), "Book: entry opens with fact and Hear it");
  await page.click("#edHear");
  await page.click("#tab-logic");
  ok(/Logic Lab/.test(await page.textContent("#bookSummary")), "Book: world tabs switch pages");
  await page.keyboard.press("ArrowRight");
  ok(/Everyday/.test(await page.textContent("#bookSummary")), "Book: arrow keys move between tabs");
  await page.screenshot({ path: SHOTS + "/book-desktop.png", fullPage: true });

  // persistence after reload
  const before = await page.evaluate(() => window.SnakeExplorers.data().progress.stats.rounds);
  await page.reload();
  const after = await page.evaluate(() => window.SnakeExplorers.data().progress.stats.rounds);
  ok(before === after && after >= 39, "persistence: progress survives reload (" + after + " rounds)");
  const keys = await page.evaluate(() => Object.keys(localStorage));
  ok(keys.includes("snakeExplorers.v1") && !keys.some(k => k.startsWith("fs_")), "persistence: own namespace, no Fruit Snake (fs_*) keys touched: " + JSON.stringify(keys));

  // settings
  await page.click('[data-go="settings"]');
  await page.click("#setVoice");
  ok((await page.getAttribute("#setVoice", "aria-checked")) === "false", "settings: voice switch turns off (shows Off text)");
  await page.click("#setSound");
  ok((await page.getAttribute("#setSound", "aria-checked")) === "false", "settings: sound switch is independent of voice");
  await page.check('input[name="textSize"][value="large"]', { force: true });
  ok((await page.evaluate(() => document.documentElement.dataset.text)) === "large", "settings: large text applies");
  await page.check('input[name="motion"][value="reduce"]', { force: true });
  ok(await page.evaluate(() => document.documentElement.classList.contains("rm")), "settings: reduce motion applies");
  await page.click("#resetBtn");
  ok(await page.isVisible("#resetConfirm"), "settings: reset asks for confirmation in the page");
  await page.click("#resetNo");
  ok((await page.evaluate(() => window.SnakeExplorers.data().progress.stats.rounds)) >= 39, "settings: 'Keep my progress' keeps it");
  await page.check('input[name="textSize"][value="standard"]', { force: true });
  await page.check('input[name="motion"][value="system"]', { force: true });
  await page.click("#setVoice"); await page.click("#setSound");

  // Classic Snake, and the way back
  await page.click('#scr-settings [data-go="home"]');
  await page.click('[data-go="classic"]');
  const frame = page.frameLocator("#classicFrame");
  await frame.locator("#startBtn").waitFor({ timeout: 8000 });
  ok(await frame.locator("h1").textContent().then(t => /Fruit Snake/.test(t)), "classic: the original Fruit Snake game loads");
  await frame.locator("#startBtn").click();
  await page.waitForTimeout(400);
  ok(await frame.locator("#startOverlay").isHidden(), "classic: the original game starts and plays");
  await page.screenshot({ path: SHOTS + "/classic-desktop.png" });
  await page.click('#scr-classic [data-go="home"]');
  ok((await state(page)).screen === "home", "classic: Back to Snake Explorers returns home");

  const mic = await page.evaluate(() => window.__mic);
  ok(mic.length === 0, "privacy: microphone never requested " + JSON.stringify(mic));
  ok(page.errors.length === 0, "no JS errors " + JSON.stringify(page.errors.slice(0, 5)));
  await ctx.close();

  // ---- blocked storage + no speech + reduced motion ----
  {
    const { ctx, page } = await newPage(browser, { blockStorage: true, noSpeech: true, reducedMotion: "reduce" });
    ok(await page.isVisible("#storageNote"), "blocked storage: a small note explains progress lasts this session");
    ok(!(await page.evaluate(() => window.SnakeExplorers.persistent())), "blocked storage: session-only fallback");
    ok(await page.evaluate(() => document.documentElement.classList.contains("rm")), "reduced motion: follows the device setting");
    await setSpeed(page, "step");
    await playRound(page, "number", 1, "number-questions", "practice");
    await page.click("#breakBtn");
    await page.click('[data-go="book"]');
    ok(await page.locator(".entry:not(.unknown)").count() > 0, "blocked storage: discoveries still recorded for this session");
    await page.click('#scr-book [data-go="home"]');
    await page.click('[data-go="settings"]');
    ok(/no built-in voice/.test(await page.textContent("#voiceNote")), "no speech: settings explain voice is unavailable; text carries everything");
    ok(/until you close/.test(await page.textContent("#storageStatus")), "blocked storage: settings explain saving isn't available");
    ok(page.errors.length === 0, "blocked storage / no speech: no JS errors " + JSON.stringify(page.errors.slice(0, 5)));
    ok((await page.evaluate(() => window.__mic)).length === 0, "blocked storage: no microphone requests");
    await ctx.close();
  }

  // ---- layouts ----
  const SIZES = [["phone", { width: 390, height: 844 }, true], ["small-phone", { width: 360, height: 640 }, true], ["tablet", { width: 820, height: 1180 }, true],
    ["desktop", { width: 1440, height: 900 }, false], ["short-landscape", { width: 740, height: 360 }, true]];
  for (const [name, vp, touch] of SIZES) {
    const { ctx, page } = await newPage(browser, { viewport: vp, hasTouch: touch });
    const noHScroll = async (where) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no sideways scroll on ${where}`);
    await noHScroll("home");
    const t = await page.locator("#homeTitle").boundingBox();
    ok(t && t.y >= 0 && t.y + t.height <= vp.height, `${name}: title visible on home`);
    await page.screenshot({ path: `${SHOTS}/${name}-home.png` });
    await page.click("#exploreBtn"); await noHScroll("worlds");
    await page.screenshot({ path: `${SHOTS}/${name}-worlds.png` });
    for (const [w, i, aid, mode] of [["word", 0, "snack-hunt", "practice"], ["logic", 0, "code-snake", "practice"], ["pattern", 1, "shape-sort", "challenge"], ["everyday", 0, "step-by-step", "challenge"], ["number", 1, "number-questions", "challenge"]]) {
      await openActivity(page, w, i, mode);
      await noHScroll(aid);
      if (aid === "snack-hunt" || aid === "code-snake") {
        const b = await page.locator(".board").boundingBox();
        const pad = await page.locator(aid === "snack-hunt" ? ".dpad" : ".palette").boundingBox();
        const run = aid === "code-snake" ? await page.locator(".plan .run").boundingBox() : pad;
        const side = await page.locator(".side").boundingBox();
        const hit = (r) => !(r.x >= b.x + b.width || r.x + r.width <= b.x || r.y >= b.y + b.height || r.y + r.height <= b.y);
        const overlap = hit(pad) || hit(side);
        ok(!overlap, `${name}/${aid}: controls never cover the board`);
        ok(b.y + b.height <= vp.height + 1 && pad.y + pad.height <= vp.height + 1 && run.y + run.height <= vp.height + 1, `${name}/${aid}: board and controls fit the screen height`);
        ok(b.width >= Math.min(160, vp.width * .4), `${name}/${aid}: board is a usable size (${Math.round(b.width)}px)`);
      }
      const tb = await page.locator(".playbar").boundingBox();
      ok(tb.x >= 0 && tb.x + tb.width <= vp.width + 1, `${name}/${aid}: top bar fits (pause/help/leave reachable)`);
      await page.screenshot({ path: `${SHOTS}/${name}-${aid}.png` });
    }
    await page.goto(URL); await page.click('[data-go="book"]'); await noHScroll("book");
    await page.screenshot({ path: `${SHOTS}/${name}-book.png`, fullPage: true });
    await page.goto(URL); await page.click('[data-go="mysnake"]'); await noHScroll("my snake");
    await page.goto(URL); await page.click('[data-go="settings"]'); await noHScroll("settings");
    ok(page.errors.length === 0, `${name}: no JS errors ` + JSON.stringify(page.errors.slice(0, 3)));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${passes} passed, ${failures} failed. Screenshots: ${SHOTS}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
