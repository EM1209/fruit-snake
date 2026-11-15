// Snake Explorers — rules: answer validation, code runs, progress, unlocks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../js/logic.js");

test("choose 'one': any valid id passes; a wrong id is reported by id", () => {
  const rule = { type: "one", valid: ["kind-0", "kind-1"] };
  assert.equal(L.checkChoice(rule, ["kind-1"]).ok, true);
  assert.equal(L.checkChoice(rule, ["kind-0"]).ok, true);
  const r = L.checkChoice(rule, ["not-0"]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.wrong, ["not-0"]);
});

test("choose 'some': exactly n valid picks; order and duplicates don't matter", () => {
  const rule = { type: "some", valid: ["raincoat", "boots", "umbrella"], n: 2 };
  assert.equal(L.checkChoice(rule, ["umbrella", "boots"]).ok, true);
  assert.equal(L.checkChoice(rule, ["boots", "boots"]).ok, false, "one distinct pick is not two");
  assert.equal(L.checkChoice(rule, ["boots", "sunglasses"]).ok, false);
  assert.equal(L.checkChoice(rule, ["boots", "umbrella", "raincoat"]).ok, false, "three is not two");
});

test("choose 'all': must match the full valid set, reports missing", () => {
  const rule = { type: "all", valid: ["blanket", "sandwich", "bottle"] };
  assert.equal(L.checkChoice(rule, ["bottle", "blanket", "sandwich"]).ok, true);
  const r = L.checkChoice(rule, ["blanket", "sandwich"]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["bottle"]);
  assert.equal(L.checkChoice(rule, ["blanket", "sandwich", "bottle", "pillow"]).ok, false);
});

test("choose 'set': required items plus exactly one from a group (valid alternatives)", () => {
  const rule = { type: "set", required: ["blanket", "sandwich", "bottle"], groups: [{ ids: ["umbrella", "raincoat"], n: 1 }] };
  assert.equal(L.checkChoice(rule, ["blanket", "sandwich", "bottle", "umbrella"]).ok, true);
  assert.equal(L.checkChoice(rule, ["blanket", "sandwich", "bottle", "raincoat"]).ok, true);
  assert.equal(L.checkChoice(rule, ["blanket", "sandwich", "bottle", "umbrella", "raincoat"]).ok, false, "only one rain item");
  assert.equal(L.checkChoice(rule, ["blanket", "sandwich", "bottle"]).ok, false);
  assert.equal(L.choiceNeed(rule), 4);
});

test("sequence: letters compare by value, so either P tile works in APPLE", () => {
  const spec = { tiles: [{ id: "a", value: "A" }, { id: "p1", value: "P" }, { id: "p2", value: "P" }, { id: "l", value: "L" }, { id: "e", value: "E" }],
    answers: [["A", "P", "P", "L", "E"]] };
  assert.equal(L.checkSequence(spec, ["a", "p1", "p2", "l", "e"]).ok, true);
  assert.equal(L.checkSequence(spec, ["a", "p2", "p1", "l", "e"]).ok, true);
  const r = L.checkSequence(spec, ["a", "l", "p1", "p2", "e"]);
  assert.equal(r.ok, false);
  assert.equal(r.firstWrong, 1);
  assert.equal(r.inPlace, 3, "A, P (3rd) and E are already in place");
});

test("sequence: a cycle (seasons) accepts any starting point, but not a wrong order", () => {
  const vals = ["spring", "summer", "autumn", "winter"];
  const spec = { tiles: vals.map(v => ({ id: "c-" + v, value: v })), answers: [vals], cyclic: true };
  assert.equal(L.checkSequence(spec, ["c-autumn", "c-winter", "c-spring", "c-summer"]).ok, true);
  assert.equal(L.checkSequence(spec, ["c-winter", "c-spring", "c-summer", "c-autumn"]).ok, true);
  assert.equal(L.checkSequence(spec, ["c-winter", "c-summer", "c-spring", "c-autumn"]).ok, false);
});

test("sequence: an incomplete answer is never ok", () => {
  const spec = { tiles: [{ id: "a", value: 1 }, { id: "b", value: 2 }], answers: [[1, 2]] };
  assert.equal(L.checkSequence(spec, ["a"]).ok, false);
});

test("sort: items with several suitable homes accept each of them", () => {
  const owl = { id: "owl", bins: ["forest", "farm"] };
  assert.equal(L.checkSort(owl, "forest").ok, true);
  assert.equal(L.checkSort(owl, "farm").ok, true);
  assert.equal(L.checkSort(owl, "desert").ok, false);
});

const level = { w: 5, h: 5, start: { x: 0, y: 2 }, goal: { x: 4, y: 2 }, rocks: [[2, 2]] };
test("plan: a route around the rock succeeds; different valid routes both succeed", () => {
  assert.equal(L.runProgram(level, ["up", "right", "right", "right", "right", "down"]).result, "success");
  assert.equal(L.runProgram(level, ["down", "right", "right", "right", "right", "up"]).result, "success");
});
test("plan: bumping a rock reports the exact step", () => {
  const r = L.runProgram(level, ["right", "right", "right"]);
  assert.equal(r.result, "bump-rock");
  assert.equal(r.at, 1);
  assert.deepEqual(r.tried, { x: 2, y: 2 });
});
test("plan: leaving the grid, stopping short, and arriving without the key", () => {
  assert.equal(L.runProgram(level, ["left"]).result, "bump-edge");
  const s = L.runProgram(level, ["up", "right"]);
  assert.equal(s.result, "short");
  assert.equal(s.distance, 4);
  const keyed = Object.assign({}, level, { key: { x: 0, y: 0 } });
  assert.equal(L.runProgram(keyed, ["up", "right", "right", "right", "right", "down"]).result, "need-key");
  assert.equal(L.runProgram(keyed, ["up", "up", "right", "right", "right", "right", "down", "down"]).result, "success");
});
test("plan: solver finds shortest length and counts alternative routes", () => {
  const s = L.solveLevel(level);
  assert.equal(s.moves, 6);
  assert.ok(s.routes >= 2);
  assert.equal(L.runProgram(level, s.path).result, "success");
});

test("round summary separates first-try, after-retry, and skipped", () => {
  const s = L.summarizeRound([
    { solved: true, firstTry: true }, { solved: true, firstTry: false, hints: 2 }, { solved: false, skipped: true }]);
  assert.deepEqual(s, { total: 3, firstTry: 1, afterRetry: 1, skipped: 1, hints: 2 });
});

test("next-round suggestion: harder after strong rounds, easier after tough ones, never past the ends", () => {
  assert.deepEqual(L.suggestNext({ total: 5, firstTry: 5, skipped: 0 }, "practice"), { direction: "harder", mode: "challenge" });
  assert.deepEqual(L.suggestNext({ total: 5, firstTry: 5, skipped: 0 }, "challenge"), { direction: "same", mode: "challenge" });
  assert.deepEqual(L.suggestNext({ total: 5, firstTry: 1, skipped: 0 }, "practice"), { direction: "easier", mode: "explore" });
  assert.deepEqual(L.suggestNext({ total: 5, firstTry: 1, skipped: 0 }, "explore"), { direction: "same", mode: "explore" });
  assert.deepEqual(L.suggestNext({ total: 5, firstTry: 3, skipped: 0 }, "practice"), { direction: "same", mode: "practice" });
  assert.equal(L.suggestNext({ total: 1, ungraded: 1, firstTry: 0, skipped: 0 }, "explore").mode, "practice");
});

test("progress: seeing is 'discovered', answering is 'practiced' — never mastery from one look", () => {
  const p = L.emptyProgress();
  L.applyEvent(p, { type: "seen", ids: ["apple"] });
  assert.deepEqual(p.concepts.apple, { seen: 1, practiced: 0 });
  L.applyEvent(p, { type: "practiced", ids: ["apple"] });
  assert.deepEqual(p.concepts.apple, { seen: 1, practiced: 1 });
  L.applyEvent(p, { type: "practiced", ids: ["pear"] });
  assert.deepEqual(p.concepts.pear, { seen: 1, practiced: 1 }, "practicing implies it was seen");
});

test("unlocks follow derived stats and report progress toward each goal", () => {
  const p = L.emptyProgress();
  const cw = { apple: "word", pear: "word", owl: "nature" };
  ["apple", "pear"].forEach(id => L.applyEvent(p, { type: "practiced", ids: [id] }));
  L.applyEvent(p, { type: "seen", ids: ["owl"] });
  L.applyEvent(p, { type: "round", world: "word", mode: "practice" });
  L.applyEvent(p, { type: "solved", mechanic: "plan" });
  const d = L.deriveStats(p, cw);
  assert.equal(d.discovered, 3);
  assert.equal(d.practiced, 2);
  assert.equal(d.wordPractice, 2);
  assert.equal(d.natureDiscovered, 1);
  assert.equal(d.routes, 1);
  const u = L.computeUnlocks(d, [{ id: "free", free: true }, { id: "hat", goal: { stat: "rounds", n: 1 } }, { id: "mint", goal: { stat: "discovered", n: 8 } }]);
  assert.equal(u.free.unlocked, true);
  assert.equal(u.hat.unlocked, true);
  assert.deepEqual(u.mint, { unlocked: false, have: 3, need: 8 });
});

test("seeded rounds are reproducible", () => {
  const a = L.rng(42), b = L.rng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
  assert.deepEqual(L.shuffle([1, 2, 3, 4, 5], L.rng(7)), L.shuffle([1, 2, 3, 4, 5], L.rng(7)));
});
