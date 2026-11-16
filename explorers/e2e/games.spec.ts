/* Functional browser tests of the built game, behind an artifact-like CSP.
 * Run on the desktop project (layout is covered for every viewport in layout.spec.ts). */
import { test, expect } from "@playwright/test";
import { open, SE, next, ORIGIN, CSP } from "./helpers.ts";
import { playRound, solve, wrongThenRight, placePiece } from "./solve.ts";

test.beforeEach(({}, info) => { test.skip(info.project.name !== "desktop", "functional tests run once, on desktop"); });

test("boots under the CSP with no errors, no network, and 23 activities in six worlds", async ({ page }) => {
  const errors = await open(page);
  await page.click("#exploreBtn");
  await expect(page.locator(".map-stop")).toHaveCount(6);
  const ids = await page.evaluate(() => (window as any).SE_Content.ACTIVITIES.map((a: any) => a.id));
  expect(ids.length).toBe(23);
  expect(ids).not.toContain("letter-line"); expect(ids).not.toContain("sentence-builder");
  for (const id of ["sound-safari", "listen-find", "snake-rescue", "animal-detectives", "little-market", "build-habitat"]) expect(ids).toContain(id);
  expect(await page.evaluate(() => (window as any).__csp || [])).toEqual([]);
  expect(errors).toEqual([]);
});

const ROUNDS: [string, string][] = [
  ["sound-safari", "explore"], ["sound-safari", "challenge"], ["listen-find", "explore"], ["listen-find", "challenge"],
  ["snake-rescue", "explore"], ["snake-rescue", "challenge"], ["animal-detectives", "explore"], ["animal-detectives", "challenge"],
  ["little-market", "explore"], ["little-market", "challenge"], ["build-habitat", "explore"], ["build-habitat", "challenge"], ["build-habitat", "free"],
  ["life-cycles", "explore"], ["step-by-step", "explore"], ["code-snake", "explore"], ["bug-hunt", "explore"]
];
for (const [id, mode] of ROUNDS) {
  test(`plays a full round: ${id} (${mode === "explore" ? "Easy" : mode === "free" ? "Free play" : "More challenge"}), including a wrong try first`, async ({ page }) => {
    const errors = await open(page);
    await playRound(page, id, mode, { wrongFirst: true });
    await expect(page.locator("#resTitle")).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test("Sound Safari: replay and hear-the-name buttons on every card; phonics offers the isolated sound only for holdable sounds", async ({ page }) => {
  await open(page);
  await SE(page).start("sound-safari", "explore");
  await expect(page.locator(".listen-btn")).toBeVisible();
  const n = await page.locator(".pcard").count();
  expect(n === 2 || n === 3).toBe(true);
  await expect(page.locator(".pcard .hear-name")).toHaveCount(n);
  await expect(page.locator(".sound-note")).toContainText("not a real recording");
  await SE(page).start("sound-safari", "challenge");
  for (let i = 0; i < 5; i++) {
    const p = await SE(page).prompt();
    await expect(page.locator(".phon-btn")).toHaveCount(["m", "s", "f", "sh", "l"].includes(p.sym) ? 1 : 0);
    expect(p.sayClips.filter((c: string) => c.startsWith("word-")).length).toBe(2);   // spoken example words, always
    await solve(page); await next(page);
  }
});

test("audio: clips decode and play after a tap; a decode failure falls back without errors", async ({ page }) => {
  const errors = await open(page);
  await page.click("#exploreBtn");   // a user gesture
  await page.evaluate(() => (window as any).SE_Clips.prepare(["prompt-well-done", "sfx-cow", "word-apple"]));
  const st = await page.evaluate(() => (window as any).SnakeExplorers.clips());
  expect(st.status).toBe("ready"); expect(st.decoded).toBeGreaterThanOrEqual(3); expect(st.failed).toEqual([]);
  const played = await page.evaluate(() => (window as any).SE_Clips.play("sfx-cow"));
  expect(played).toBe(true);
  // every bundled clip is present in the single file and decodes (no missing audio)
  const all = await page.evaluate(async () => { const C = (window as any).SE_Clips; await C.prepare(C.ids()); return { n: C.ids().length, st: C.getStatus() }; });
  expect(all.n).toBeGreaterThanOrEqual(225); expect(all.st.failed).toEqual([]); expect(all.st.decoded).toBe(all.n);
  expect(errors).toEqual([]);
});
test("audio failure: if decoding fails, the game still plays and says why in Settings", async ({ page }) => {
  const errors = await open(page, { init: `(() => { const P = (window.AudioContext || window.webkitAudioContext).prototype; P.decodeAudioData = function () { return Promise.reject(new Error("no decoder")); }; })();` });
  await page.click("#exploreBtn");
  await page.evaluate(() => (window as any).SE_Clips.prepare(["sfx-cow"]));
  expect((await page.evaluate(() => (window as any).SnakeExplorers.clips())).status).toBe("unavailable");
  await playRound(page, "sound-safari", "explore");
  await page.evaluate(() => (window as any).SnakeExplorers.start("listen-find", "explore"));
  await page.locator("#leaveBtn").click();
  await page.goto(ORIGIN + "/index.html");
  await page.locator(".home-links [data-go='settings']").click();
  await page.evaluate(() => (window as any).SE_Clips.prepare(["sfx-cow"]));
  await page.locator("#scr-settings [data-go='home']").click(); await page.locator(".home-links [data-go='settings']").click();
  await expect(page.locator("#audioStatus")).toContainText("device voice");
  expect(errors).toEqual([]);
});

test("Snake Rescue: one step per key press, nothing moves while thinking, bumps don't move", async ({ page }) => {
  await open(page);
  await SE(page).start("snake-rescue", "challenge");
  const m0 = await SE(page).mech();
  await page.waitForTimeout(2500);
  expect((await SE(page).mech()).state).toEqual(m0.state);   // idle: no autonomous movement
  // hold a key: repeats are ignored, so only one step happens
  const d = m0.solution[0];
  const key = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[d as "up"];
  await page.keyboard.down(key); await page.waitForTimeout(700); await page.keyboard.up(key);
  expect((await SE(page).mech()).state.moves).toBe(1);
  // tap a square next to the snake also steps once
  const s = (await SE(page).mech()).state.pos;
  const sol = (await SE(page).mech()).solution;
  const dd = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[sol[0] as "up"];
  await page.locator(`.rcell[data-x="${s.x + dd[0]}"][data-y="${s.y + dd[1]}"]`).click();
  expect((await SE(page).mech()).state.moves).toBe(2);
});

test("learning games ignore an old fast-speed save: Snack Hunt steps once per press and never moves alone", async ({ page }) => {
  const old = { v: 1, settings: { voice: false, sound: false, motion: "system", speed: "lively", textSize: "standard", mode: "practice" }, look: {}, progress: {}, seenUnlocks: [] };
  await open(page, { storage: { "snakeExplorers.v1": JSON.stringify(old) } });
  await SE(page).start("snack-hunt", "practice");
  const head = page.locator(".sn.head");
  const pos = async () => head.evaluate((e) => [(e as HTMLElement).dataset.x, (e as HTMLElement).dataset.y].join(","));
  const p0 = await pos();
  await page.waitForTimeout(1500);
  expect(await pos()).toBe(p0);
  await page.locator(".dpad .dir.down").click();
  const p1 = await pos(); expect(p1).not.toBe(p0);
  await page.waitForTimeout(1500);
  expect(await pos()).toBe(p1);
});

test("Code the Snake Easy: the demo moves only when Show me is pressed, then resets; the child's board is untouched", async ({ page }) => {
  await open(page);
  await SE(page).start("code-snake", "explore");
  const p = await SE(page).prompt();
  expect(p.level.w).toBe(3); expect(p.minMoves).toBeGreaterThanOrEqual(2); expect(p.minMoves).toBeLessThanOrEqual(3);
  await page.waitForTimeout(1200);
  expect((await SE(page).mech()).demoPlaying).toBe(false);
  await page.locator(".demo-btn").click();
  expect((await SE(page).mech()).demoPlaying).toBe(true);
  await expect(page.locator(".demo-btn")).toContainText("Show me again", { timeout: 15_000 });
  expect((await SE(page).mech()).demoPlaying).toBe(false);
  await expect(page.locator(".demo .mtok.trail")).toHaveCount(0);   // demo reset
  expect((await SE(page).mech()).program).toEqual([]);
  await solve(page);
});

test("Life Cycles and Step by Step Easy: exactly three picture cards, a replayable demo that resets", async ({ page }) => {
  await open(page);
  for (const id of ["life-cycles", "step-by-step"]) {
    await SE(page).start(id, "explore");
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(".pool .tile")).toHaveCount(3);
      await expect(page.locator(".pool .tile .art")).toHaveCount(3);
      await expect(page.locator(".tile .letter, .tile .wordtile")).toHaveCount(0);   // never word tiles
      if (i === 0) {
        await page.locator(".demo-btn").click();
        await expect(page.locator(".demo-btn")).toContainText("Show me again", { timeout: 15_000 });
        await expect(page.locator(".demo-slots .dcard")).toHaveCount(0);         // the demo cards went back
        expect((await SE(page).mech()).slots).toEqual([null, null, null]);       // child's slots untouched
      }
      await solve(page); await next(page);
    }
  }
});

test("Food Chains never asks for ordering, in any mode", async ({ page }) => {
  await open(page);
  for (const mode of ["explore", "practice", "challenge"]) for (let r = 0; r < 3; r++) {
    const prompts = await page.evaluate((m) => (window as any).SE_Content.buildRound("food-chains", m, 100 + Math.floor(Math.random() * 1e6), null), mode);
    for (const p of prompts) { expect(p.mechanic).not.toBe("sequence"); expect(p.instruction).not.toMatch(/order/i); }
  }
});

test("Little Market: wrong item, take it out, undo, then pay exact coins", async ({ page }) => {
  await open(page);
  await SE(page).start("little-market", "explore");
  const m = await SE(page).mech();
  const wrong = (await SE(page).prompt()).shelf.find((a: string) => !(a in m.need));
  await page.locator(`.mk-item[data-art="${wrong}"]`).click();
  expect((await SE(page).mech()).basket[wrong]).toBe(1);
  await page.locator(`.mk-in[data-art="${wrong}"]`).click();        // tap the basket to take it out
  expect((await SE(page).mech()).basket[wrong]).toBe(0);
  await page.locator(".mk-undo").click();                          // undo the removal
  expect((await SE(page).mech()).basket[wrong]).toBe(1);
  await page.locator(".mk-undo").click();                          // undo the add
  expect((await SE(page).mech()).basket[wrong]).toBe(0);
  await solve(page);
});

test("Build a Habitat: unsuitable piece bounces in Easy; keyboard and drag both place pieces; remove and undo", async ({ page }) => {
  await open(page);
  await SE(page).start("build-habitat", "explore");
  const animal = (await SE(page).prompt()).animals[0];
  // an unsuitable piece is not placed
  await page.locator(".hab-tab", { hasText: "Shelter" }).click();
  const bad = animal === "bee" ? "cave" : "hive";
  await page.locator(`.hab-piece[data-piece="${bad}"]`).click();
  await page.locator('[data-slot="0"]').click();
  expect((await SE(page).mech()).slots[0]).toBeNull();
  await expect(page.locator("#feedback")).toHaveClass(/fb-wrong/);
  // keyboard: focus a piece, Enter; focus a space, Enter
  await page.locator(".hab-tab", { hasText: "Water" }).click();
  const water = await page.evaluate((a) => ({ duck: "pond", frog: "pond", turtle: "pond", snail: "puddle", rabbit: "puddle", bee: "puddle", owl: "stream", squirrel: "stream", deer: "stream", fox: "stream" } as any)[a], animal);
  await page.locator(`.hab-piece[data-piece="${water}"]`).focus(); await page.keyboard.press("Enter");
  await page.locator('[data-slot="1"]').focus(); await page.keyboard.press("Enter");
  expect((await SE(page).mech()).slots[1]).toBe(water);
  // tap a placed piece to remove it, then undo brings it back
  await page.locator('[data-slot="1"]').click();
  expect((await SE(page).mech()).slots[1]).toBeNull();
  await page.locator(".hab-undo").click();
  expect((await SE(page).mech()).slots[1]).toBe(water);
  // drag a piece onto a space (an extra, never required)
  await page.locator(".hab-tab", { hasText: "Plants" }).click();
  const plant = await page.evaluate((a) => ({ duck: "grass", frog: "lilypad", turtle: "lilypad", snail: "grass", rabbit: "grass", bee: "flowers", owl: "tree", squirrel: "acorns", deer: "grass", fox: "bush" } as any)[a], animal);
  await page.locator(`.hab-piece[data-piece="${plant}"]`).dragTo(page.locator('[data-slot="4"]'));
  expect((await SE(page).mech()).slots[4]).toBe(plant);
});

test("Build a Habitat Free play: build, save, reload the page, open the saved habitat", async ({ page }) => {
  await open(page);
  await SE(page).start("build-habitat", "free");
  await placePiece(page, "pond", 0); await placePiece(page, "duck", 5); await placePiece(page, "reeds", 2);
  await page.locator(".hab-save").click();
  await expect(page.locator(".hab-saved-item")).toHaveCount(1);
  await page.reload();
  await SE(page).start("build-habitat", "free");
  await expect(page.locator(".hab-saved-item")).toHaveCount(1);
  await page.locator(".hs-load").click();
  const slots = (await SE(page).mech()).slots;
  expect(slots[0]).toBe("pond"); expect(slots[5]).toBe("duck"); expect(slots[2]).toBe("reeds");
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain("snakeExplorers.habitats");
});

test("old saves: progress, unknown fields and retired records are kept; Continue maps Letter Line to Sound Safari", async ({ page }) => {
  const old = { v: 1, mystery: { keep: "me" }, settings: { voice: false, sound: false, motion: "system", speed: "steady", textSize: "standard", mode: "practice", futureFlag: 7 },
    look: { color: "purple", pattern: "plain", accessory: "none" }, seenUnlocks: ["accessory:hat"],
    progress: { last: { activityId: "letter-line", mode: "practice" }, concepts: { sentences: { seen: 3, practiced: 2 }, apple: { seen: 1, practiced: 1 } }, stats: { rounds: 4, worlds: { word: 4 }, modes: { practice: 4 }, sorted: 0, sequences: 5, routes: 0, challengeRounds: 0 }, best: {} },
    history: { v: 1, keys: { "letter-line:practice": { t: 5, s: { "word:frog": 5 } } } }, played: { "letter-line": 4 } };
  const errors = await open(page, { storage: { "snakeExplorers.v1": JSON.stringify(old) } });
  await expect(page.locator("#continueBtn")).toContainText("Sound Safari");
  await expect(page.locator("#continueNote")).toContainText("Letter Line is now Sound Safari");
  await page.locator("#continueBtn").click();
  expect((await SE(page).state()).round.activity).toBe("sound-safari");
  await page.locator("#leaveBtn").click();
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem("snakeExplorers.v1")!));
  expect(saved.mystery).toEqual({ keep: "me" });
  expect(saved.settings.futureFlag).toBe(7);
  expect(saved.progress.concepts.sentences).toEqual({ seen: 3, practiced: 2 });   // retired record kept, not relabelled
  expect(saved.history.keys["letter-line:practice"]).toBeTruthy();
  expect(saved.played["letter-line"]).toBe(4);
  expect(saved.progress.stats.rounds).toBe(4);
  // the Discovery Book still shows the earned retired entry under its own name
  await page.goto(ORIGIN + "/index.html");
  await page.locator(".home-links [data-go='book']").click();
  await page.locator("#tab-word").click();
  await expect(page.locator(".entry", { hasText: "Building sentences" })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("blocked storage: the game still plays, says progress won't be kept, and Free play saves in memory", async ({ page }) => {
  const errors = await open(page, { init: `Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });` });
  await expect(page.locator("#storageNote")).toBeVisible();
  await playRound(page, "listen-find", "explore");
  await SE(page).start("build-habitat", "free");
  await expect(page.locator(".hab-save-note")).toContainText("isn't available");
  await placePiece(page, "log", 0); await page.locator(".hab-save").click();
  await expect(page.locator(".hab-saved-item")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("difficulty: Easy and More challenge map onto the saved modes; More alternates old pools; Free play is separate", async ({ page }) => {
  await open(page);
  await page.click("#exploreBtn"); await page.click('[data-world="nature"]');
  await page.locator('#modePicker label', { hasText: "More challenge" }).click();
  await page.locator('.play-act[data-act="life-cycles"]').click();
  expect((await SE(page).state()).round.mode).toBe("practice");
  await page.locator("#leaveBtn").click();
  await page.locator('.play-act[data-act="life-cycles"]').click();
  expect((await SE(page).state()).round.mode).toBe("challenge");
  await page.locator("#leaveBtn").click();
  await page.locator('.free-act[data-act="build-habitat"]').click();
  expect((await SE(page).state()).round.mode).toBe("free");
  await page.locator("#leaveBtn").click();
  await expect(page.locator('#modePicker input[value="more"]')).toBeChecked();
  await expect(page.locator(".free-act")).toHaveCount(1);   // Free play only where it makes sense
});

test("Classic Snake: opens unchanged in its frame; Play and Pause work", async ({ page }) => {
  const errors = await open(page);
  await page.locator(".home-links [data-go='classic']").click();
  const f = page.frameLocator("#classicFrame");
  await f.locator("#startBtn").click();
  await f.locator("#pauseBtn").click();
  await expect(f.locator("#pauseOverlay")).toBeVisible();
  await f.locator("#resumeBtn").click();
  await expect(f.locator("#pauseOverlay")).toBeHidden();
  expect(errors).toEqual([]);
});

test("settings: separate voice/effects, mute, captions, reduced motion and large text all take effect", async ({ page }) => {
  await open(page);
  await page.locator(".home-links [data-go='settings']").click();
  await page.locator("#setSound").click();
  expect((await SE(page).data()).settings.sound).toBe(false);
  expect((await SE(page).data()).settings.voice).toBe(true);
  await page.locator("#setCaptions").click();
  expect(await page.evaluate(() => document.documentElement.dataset.captions)).toBe("off");
  await page.locator('label', { hasText: "Reduce motion" }).click();
  expect(await page.evaluate(() => document.documentElement.classList.contains("rm"))).toBe(true);
  await page.locator('label', { hasText: "Large" }).click();
  expect(await page.evaluate(() => document.documentElement.dataset.text)).toBe("large");
  await SE(page).start("listen-find", "explore");
  await expect(page.locator(".pcard .lab")).toHaveCount(0);   // labels off: pictures and sound only
  await page.locator("#muteBtn").click();
  const s = (await SE(page).data()).settings; expect(s.voice).toBe(false); expect(s.sound).toBe(false);
  await page.locator("#muteBtn").click();
  expect((await SE(page).data()).settings.voice).toBe(true);
  // keyboard focus is visible
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
});

test("anti-repeat holds across rounds and a reload for the new games", async ({ page }) => {
  await open(page);
  for (const id of ["listen-find", "sound-safari"]) {
    const seen: string[] = [];
    for (let r = 0; r < 3; r++) {
      if (r === 2) await page.reload();
      await SE(page).start(id, "explore");
      const n = (await SE(page).state()).round.n;
      for (let i = 0; i < n; i++) { seen.push((await SE(page).prompt()).cids[0]); await solve(page); await next(page); }
    }
    expect(new Set(seen).size, id).toBe(seen.length);
  }
});
void wrongThenRight;

test("the exported Artifact fragment boots inside a host skeleton under the CSP", async ({ page }) => {
  const { readFileSync } = await import("node:fs");
  const frag = readFileSync(new URL("../dist/artifact.html", import.meta.url), "utf8");
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${frag}</body></html>`;
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.route(ORIGIN + "/frag.html", r => r.fulfill({ status: 200, contentType: "text/html", body: doc, headers: { "content-security-policy": CSP } }));
  await page.goto(ORIGIN + "/frag.html");
  await expect(page.locator("#scr-home")).toBeVisible();
  await playRound(page, "snake-rescue", "explore");
  expect(await page.title()).toBe("Snake Explorers — Playful Worlds");
  expect(errors).toEqual([]);
});

test("Snake Rescue layout: board, mission and every arrow never overlap at in-between sizes (regression)", async ({ page }) => {
  await open(page);
  const sizes: [number, number][] = [[904, 782], [904, 826], [1000, 820], [760, 900], [600, 900], [1100, 1000], [1024, 768], [700, 600], [1366, 700], [480, 860]];
  for (const [w, h] of sizes) for (const mode of ["explore", "challenge"]) {
    await page.setViewportSize({ width: w, height: h });
    await SE(page).start("snake-rescue", mode);
    await page.waitForTimeout(100);
    const boxes = await page.evaluate(() => {
      const r = (e: Element) => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
      return { board: r(document.querySelector(".rescue-board")!), boxEl: r(document.querySelector(".rescue .board-box")!),
        others: [".mission-card", ".dpad .dir.up", ".dpad .dir.down", ".dpad .dir.left", ".dpad .dir.right"].map(s => ({ s, ...r(document.querySelector(s)!) })) };
    });
    const hit = (a: any, b: any) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
    for (const o of boxes.others) expect(hit(boxes.board, o), `${w}x${h} ${mode}: board overlaps ${o.s}`).toBe(false);
    expect(boxes.board.b, `${w}x${h} ${mode}: board stays inside its box`).toBeLessThanOrEqual(boxes.boxEl.b + 1);
    for (const d of ["up", "down", "left", "right"]) {
      const btn = page.locator(`.dpad .dir.${d}`);
      await btn.scrollIntoViewIfNeeded();
      const topmost = await btn.evaluate((b) => { const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && b.contains(e); });
      expect(topmost, `${w}x${h} ${mode}: the ${d} arrow can be pressed`).toBe(true);
    }
  }
});

test("Snake Rescue squares say what is on them, and update as the mission changes (regression)", async ({ page }) => {
  await open(page);
  await SE(page).start("snake-rescue", "explore");
  const m = (await SE(page).mech()).mission;
  const label = (x: number, y: number) => page.locator(`.rcell[data-x="${x}"][data-y="${y}"]`).getAttribute("aria-label");
  const r = m.rescues[0], h = m.homes[0];
  expect(await label(m.start.x, m.start.y)).toMatch(/^The snake \(you\)/);
  expect(await label(r.at.x, r.at.y)).toMatch(/lost/);
  expect(await label(h.at.x, h.at.y)).toContain(h.label);
  // at least one plain grass square still reads as grass, with its position
  const all = await page.locator(".rcell").evaluateAll(els => els.map(e => e.getAttribute("aria-label")!));
  expect(all.some(a => /^Grass, column \d+, row \d+$/.test(a))).toBe(true);
  expect(all.filter(a => /snake/i.test(a)).length).toBe(1);
  // walk the solution: labels follow the snake, the follower and the delivery
  const keys: Record<string, string> = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
  for (const d of (await SE(page).mech()).solution) {
    await page.keyboard.press(keys[d]);
    const st = (await SE(page).mech()).state;
    expect(await label(st.pos.x, st.pos.y)).toMatch(/^The snake \(you\)/);
    if (st.carrying.length) expect(await label(st.pos.x, st.pos.y)).toContain("following");
  }
  expect(await label(h.at.x, h.at.y)).toContain("safe at home");
});
