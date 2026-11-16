// Snake Explorers — More Adventures: correctness of every new kind of question.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../js/logic.js");
const C = require("../js/content.js");
const B = require("../js/bank.js");
const I = C._internals;

const SEEDS = Array.from({ length: 60 }, (_, i) => i * 104729 + 17);
function prompts(aid, mode) { return SEEDS.flatMap(s => C.buildRound(aid, mode, s)); }

test("Playful Worlds: 17 activities live here (Letter Line and Sentence Builder retired; 6 more are added from src/ — 23 in all)", () => {
  assert.equal(C.ACTIVITIES.length, 17);
  assert.ok(!C.ACTIVITY["letter-line"] && !C.ACTIVITY["sentence-builder"], "retired activities are not offered");
  assert.deepEqual(Object.keys(C.RETIRED).sort(), ["letter-line", "sentence-builder"]);
  for (const a of C.ACTIVITIES) for (const m of L.MODES) assert.ok(a.modes[m], a.id + " " + m);
  // retired rounds still build, so an old save that points at them can never crash
  for (const id of Object.keys(C.RETIRED)) assert.ok(C.buildRound(id, "explore", 1, null).length > 0);
});

test("sentences: capital first, full stop last, alternates accepted, the spare word can't fit", () => {
  for (const mode of L.MODES) for (const s of B.SENTENCES[mode]) {
    const answers = [s.words].concat(s.alt || []);
    for (const ans of answers) {
      assert.ok(/^[A-Z]/.test(ans[0]), s.id + " starts with a capital");
      assert.equal(ans.slice(1).filter(w => /^[A-Z]/.test(w) && w !== "I").length, 0, s.id + ": only the first word is capitalized");
      assert.ok(ans[ans.length - 1].endsWith("."), s.id + " ends with a full stop");
      assert.equal(ans.filter(w => w.endsWith(".")).length, 1, s.id + ": exactly one word with a full stop");
      assert.deepEqual(ans.slice().sort(), s.words.slice().sort(), s.id + ": alternates use the same words");
    }
    if (s.spare) assert.ok(/^[A-Z]/.test(s.spare) && !s.words.includes(s.spare), s.id + ": spare is a second capitalized word, so it can't fit mid-sentence");
  }
  for (const mode of L.MODES) for (const p of prompts("sentence-builder", mode)) {
    for (const ans of p.answers) {
      const used = new Set();
      const order = ans.map(v => { const t = p.tiles.find(t => t.value === v && !used.has(t.id)); used.add(t.id); return t.id; });
      assert.equal(L.checkSequence(p, order).ok, true, p.cids[0]);
    }
    if (mode === "challenge") assert.equal(p.tiles.length, p.slots + 1);
  }
});

test("Bug Hunt: predicted squares, bump steps, and buggy programs all match a real simulation", () => {
  for (const mode of L.MODES) for (const p of prompts("bug-hunt", mode)) {
    if (p.mechanic === "predict") {
      // Easy: tap the square — the answer is where a real simulation of the arrows ends
      const sim = I.walk(Object.assign({ rocks: [] }, p.level), p.level.start, p.program);
      assert.equal(sim.bump, -1); assert.deepEqual(sim.pos, p.answer);
      assert.ok(p.program.length >= 2 && p.program.length <= 3 && p.level.w === 3, "2–3 arrows on a small board");
      assert.ok(p.demo && p.demo.program.length === p.program.length, "a demo of a similar example");
      assert.notEqual(JSON.stringify(p.demo.level.start) + p.demo.program.join(), JSON.stringify(p.level.start) + p.program.join(), "the demo is a different example");
      continue;
    }
    if (p.mechanic === "plan") {
      assert.ok(p.startProgram && p.startProgram.length <= p.level.maxMoves, "fix: program fits");
      assert.notEqual(L.runProgram(p.level, p.startProgram).result, "success", "fix: the given code really is buggy");
      assert.ok(L.solveLevel(p.level), "fix: level solvable");
      continue;
    }
    const v = p.visual, lv = Object.assign({ rocks: [] }, v.level);
    const sim = I.walk(lv, lv.start, v.program);
    if (p.cids[0].startsWith("bump")) {
      assert.equal(p.rule.valid[0], "step-" + sim.bump, p.cids[0]);
      assert.ok(sim.bump >= 1, "at least one good step before the bug");
    } else {
      assert.equal(sim.bump, -1, "predict programs never hit a rock or wall");
      const endMark = v.marks.find(m => m.x === sim.pos.x && m.y === sim.pos.y);
      assert.ok(endMark, "the true end square is one of the choices");
      assert.equal(v.marks.filter(m => m.x === sim.pos.x && m.y === sim.pos.y).length, 1);
      assert.equal(new Set(v.marks.map(m => m.x + "," + m.y)).size, v.marks.length, "lettered squares are distinct");
      assert.ok(v.marks.every(m => !lv.rocks.some(r => r[0] === m.x && r[1] === m.y)), "no letter on a rock");
      const okOpt = p.options.find(o => o.id === p.rule.valid[0]);
      assert.equal(okOpt.text, endMark.letter);
    }
  }
});

test("Mirror Match: exactly one picture is the true mirror; turned shapes aren't confusable with flips", () => {
  const flip = (g, axis) => (axis === "v" ? g.map(r => r.concat(r.slice().reverse())) : g.concat(g.slice().reverse()));
  for (const mode of L.MODES) for (const p of prompts("mirror-match", mode)) {
    const key = (g) => g.map(r => r.join("")).join("/");
    if (p.cids[0].startsWith("sym")) {
      const truth = key(flip(p.visual.grid, p.visual.axis));
      const keys = p.options.map(o => key(o.cells.grid));
      assert.equal(new Set(keys).size, keys.length, "options are all different pictures");
      assert.equal(keys.filter(k => k === truth).length, 1, "exactly one correct mirror");
      assert.equal(key(p.options.find(o => o.id === p.rule.valid[0]).cells.grid), truth);
    } else if (p.cids[0].startsWith("rot")) {
      const cellsOf = (g) => g.flatMap((r, y) => r.map((v, x) => (v ? [x, y] : null))).filter(Boolean);
      const norm = (cs) => { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return JSON.stringify(cs.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0])); };
      const rots = (cs) => { const out = [cs]; for (let i = 0; i < 3; i++) out.push(out[i].map(([x, y]) => [-y, x])); return out.map(norm); };
      const base = rots(cellsOf(p.visual.grid));
      const matches = p.options.filter(o => base.includes(norm(cellsOf(o.cells.grid))));
      assert.equal(matches.length, 1, "exactly one option is a rotation");
      assert.equal(matches[0].id, p.rule.valid[0]);
    } else {
      const seq = p.visual.groups.filter(g => !g.blank).map(g => g.n);
      const ans = +p.rule.valid[0].slice(1);
      assert.equal(seq.length, 3);
      assert.ok(ans > seq[2], "growing patterns grow");
      assert.equal(p.options.filter(o => o.id === p.rule.valid[0]).length, 1);
    }
  }
});

test("Fair Shares and Berry Basket arithmetic is right", () => {
  for (const mode of L.MODES) for (const p of prompts("fair-shares", mode)) {
    const n = +p.rule.valid[0].replace(/^n/, "").split("-")[0];
    const [kind, arg] = p.cids[0].split(":");
    if (kind === "share") { const [t, k] = arg.split("/").map(Number); assert.equal(n * k, t); }
    if (kind === "groups") { const [t, k] = arg.split("/").map(Number); assert.equal(n * k, t); }
    if (kind === "pairs") assert.equal(n * 2, +arg);
    if (kind === "array") { const [r, c] = arg.split("x").map(Number); assert.equal(n, r * c); }
    if (kind === "half") assert.equal(n * 2, +arg);
    if (kind === "third") assert.equal(n * 3, +arg);
    if (kind === "rem") { const [t, k] = arg.split("/").map(Number); assert.equal(n, t % k); assert.ok(n > 0); }
    if (kind === "story") { const s = B.STORY_PROBLEMS.find(x => "story:" + x.id === p.cids[0]); assert.equal(n, s.ans); }
    if (kind === "amt") { const a = B.COMPARE_AMOUNTS.find(x => "amt:" + x.id === p.cids[0]); assert.equal(p.options.find(o => o.id === p.rule.valid[0]).text.toLowerCase(), a.ans.toLowerCase()); }
  }
  for (const mode of L.MODES) for (const p of prompts("berry-count", mode)) {
    const [kind, arg] = p.cids[0].split(":");
    if (kind === "sum") { const [a, b] = arg.split("+").map(Number); assert.equal(p.target, a + b); }
    if (kind === "diff") { const [a, b] = arg.split("-").map(Number); assert.equal(p.target, a - b); }
    if (kind === "double") assert.equal(p.target, 2 * +arg);
    if (kind === "more") assert.equal(p.target, +arg + 1);
    if (kind === "less") assert.equal(p.target, +arg - 1);
    if (kind === "count" || kind === "match") assert.equal(p.target, +arg);
    assert.ok(p.target >= 1 && p.berries > p.target);
  }
});

test("story problems: every answer is checked against its worked explanation", () => {
  for (const s of B.STORY_PROBLEMS) {
    const nums = s.why.match(/-?\d+/g).map(Number);
    assert.ok(nums.includes(s.ans), s.id + ": explanation mentions the answer");
  }
  const ids = B.STORY_PROBLEMS.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("food chains go plant → plant-eater → predator, and living/non-living sorting is right", () => {
  const plants = new Set(["grass", "leaf", "seed", "algae"]);
  for (const c of B.CHAINS) {
    assert.ok(plants.has(c.links[0]), c.id + " starts with a plant (or plant part)");
    assert.ok(c.links.slice(1).every(x => !plants.has(x)), c.id + ": only the first link is a plant");
    assert.equal(c.links.length, c.labels.length);
  }
  for (const mode of L.MODES) for (const p of prompts("food-chains", mode)) {
    // Playful Worlds: picture sorting and questions only — no ordering prompts at all
    assert.notEqual(p.mechanic, "sequence", "no food-chain ordering");
    assert.ok(!/order/i.test(p.instruction), "no ordering instructions: " + p.instruction);
    if (p.mechanic === "sort" && p.bins[0].id === "living") p.items.forEach(it => assert.deepEqual(it.bins, [B.LIVING.find(x => x.id === it.id).living ? "living" : "not"]));
    if (p.mechanic === "sort" && p.bins[0].id === "plants") p.items.forEach(it => assert.deepEqual(it.bins, [C.DIET.plants.includes(it.id) ? "plants" : "hunts"]));
    if (p.visual && p.visual.kind === "chain") {
      const ch = B.CHAINS.find(c => c.links.join() === p.visual.items.map(x => x.art).join());
      const eaterIdx = ch.labels.findIndex(l => p.instruction.includes("the " + l + " eat"));
      assert.equal(p.rule.valid[0], ch.links[eaterIdx - 1], "the answer is the link just before the eater");
    }
  }
  for (const q of B.NATURE_QUESTIONS) {
    assert.ok(q.m && q.m.length, q.id + " has modes");
    q.valid.forEach(v => assert.ok(q.opts.includes(v), q.id + " valid answer is offered"));
    Object.keys(q.wrong || {}).forEach(w => assert.ok(!q.valid.includes(w), q.id + ": no wrong-hint on a right answer"));
  }
});

test("habitats and rooms: every item has a right home and a wrong one; animals with two homes accept both", () => {
  for (const aid of ["habitat-homes", "tidy-up"]) for (const mode of L.MODES) for (const p of prompts(aid, mode)) {
    const bins = p.bins.map(b => b.id);
    p.items.forEach(it => {
      const truth = aid === "habitat-homes" ? C.ANIMAL[it.id].homes : B.TIDY.find(t => t.id === it.id).rooms;
      assert.deepEqual(it.bins.slice().sort(), truth.filter(h => bins.includes(h)).sort(), it.id + ": every shown home that fits is accepted");
      assert.ok(bins.some(b => !it.bins.includes(b)), it.id + ": there's a wrong home too");
    });
  }
});

test("weather, safety and packing: several sensible answers accepted; wrong ones explained", () => {
  for (const mode of L.MODES) for (const p of prompts("ready-weather", mode)) {
    const valid = p.rule.valid || p.rule.required.concat(p.rule.groups.flatMap(g => g.ids));
    p.options.filter(o => !valid.includes(o.id)).forEach(o => assert.ok(p.wrongHints[o.id], p.cids[0] + ": explain why " + o.id + " doesn't fit"));
  }
  for (const s of B.SAFETY) assert.ok(s.good.length >= 2, s.id + ": more than one safe choice is accepted");
  for (const k of B.KIND) assert.ok(k.good.length >= 2 && k.nuance.length >= 1, k.id + ": several kind choices are accepted");
});

test("Logic Lab: the larger level set is solvable, distinct, and within limits", () => {
  const ids = new Set();
  for (const mode of L.MODES) for (const lv of C.LEVELS[mode]) {
    const id = C.levelId(lv);
    assert.ok(!ids.has(id), "duplicate level " + id); ids.add(id);
    const s = L.solveLevel(lv);
    assert.ok(s, id);
    if (mode === "challenge") assert.ok(lv.key, "challenge levels need the key");
  }
  assert.ok(ids.size >= 45, "levels: " + ids.size);
});

test("Discovery Book: every new concept has art, a label and a fact; old concept ids still exist", () => {
  const OLD = ["apple", "banana", "grapes", "strawberry", "orange", "pear", "carrot", "broccoli", "corn", "tomato", "peas", "lemon", "sun", "hat", "leaf", "count", "compare", "add", "subtract", "sequence", "missing",
    "circle", "square", "triangle", "star", "heart", "diamond", "colors", "patterns", "odd", "fish", "frog", "duck", "camel", "polarbear", "penguin", "owl", "squirrel", "cow", "lizard", "rabbit", "crab", "bee", "butterfly",
    "hab-pond", "hab-forest", "hab-desert", "hab-ice", "hab-ocean", "hab-farm", "cycle-plant", "cycle-butterfly", "cycle-frog", "seasons", "arrows", "obstacles", "keys", "handwashing", "teeth", "planting", "sandwich",
    "rain-gear", "snow-gear", "sun-gear", "wind-gear", "picnic", "kindness"];
  OLD.forEach(id => assert.ok(C.CONCEPT[id], "first-release concept kept: " + id));
  const Art = require("../js/art.js");
  C.CONCEPTS.forEach(c => { assert.ok(Art.has(c.art), c.id + " art " + c.art); assert.ok(c.label && c.fact && c.fact.length > 10, c.id); });
  assert.equal(new Set(C.CONCEPTS.map(c => c.id)).size, C.CONCEPTS.length, "concept ids are unique");
});

test("every world has at least 30 authored items (documented in CONTENT.md)", () => {
  const { AUTHORED } = require("../../tools/content-inventory.cjs");
  for (const w of C.WORLDS) {
    const n = AUTHORED[w.id].reduce((s, r) => s + r[1], 0);
    assert.ok(n >= 30, w.id + ": " + n);
  }
});
