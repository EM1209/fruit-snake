// Snake Explorers — the selection layer: fresh first, oldest next, bounded, never stuck.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../js/logic.js");
const Deck = require("../js/deck.js");

const items = (n, prefix = "q") => Array.from({ length: n }, (_, i) => ({ cid: prefix + i, topic: "t" + (i % 3) }));

test("never-shown items are dealt before anything is repeated", () => {
  const h = Deck.sanitize(null), key = "a:explore";
  const pool = items(10);
  const shown = [];
  for (let round = 0; round < 3; round++) {
    const got = Deck.pick(pool, 3, Deck.rec(h, key), L.rng(round + 1));
    got.forEach(g => shown.push(g.cid));
    Deck.markShown(h, key, got.map(g => g.cid));
  }
  assert.equal(new Set(shown).size, 9, "9 picks over 3 rounds, all different: " + shown);
});

test("when the pool runs out, the least recently shown come back first", () => {
  const h = Deck.sanitize(null), key = "a:practice";
  const pool = items(4);
  Deck.markShown(h, key, ["q2", "q0", "q3", "q1"]);          // q2 oldest … q1 newest
  const got = Deck.pick(pool, 4, Deck.rec(h, key), L.rng(5)).map(x => x.cid);
  assert.deepEqual(got, ["q2", "q0", "q3", "q1"]);
});

test("asking for more than exists returns what exists — no loop, no duplicates", () => {
  const got = Deck.pick(items(3).concat(items(3)), 10, Deck.emptyRec(), L.rng(1));
  assert.equal(got.length, 3);
  let calls = 0;
  const g = Deck.generate(() => { calls++; return null; }, 5, Deck.emptyRec(), L.rng(1), { tries: 4 });
  assert.deepEqual(g, []);
  assert.ok(calls <= 20, "generator draws are bounded: " + calls);
  const same = Deck.generate(() => ({ cid: "only" }), 5, Deck.emptyRec(), L.rng(1));
  assert.equal(same.length, 1);
});

test("topic spread mixes topics among fresh items", () => {
  const got = Deck.pick(items(9), 3, Deck.emptyRec(), L.rng(3), { spread: true });
  assert.equal(new Set(got.map(g => g.topic)).size, 3);
});

test("a round context never deals the same cid twice, across separate picks", () => {
  const ctx = Deck.context(Deck.emptyRec(), L.rng(9), "practice");
  const a = ctx.pick(items(5), 3), b = ctx.pick(items(5), 5);
  const all = a.concat(b).map(x => x.cid);
  assert.equal(new Set(all).size, all.length);
  assert.equal(all.length, 5);
});

test("history is bounded per activity+mode", () => {
  const h = Deck.sanitize(null);
  for (let i = 0; i < 1000; i++) Deck.markShown(h, "k", ["c" + i]);
  const n = Object.keys(h.keys.k.s).length;
  assert.ok(n <= Deck.MAX_PER_KEY, "kept " + n);
  assert.ok(h.keys.k.s.c999, "the newest survive pruning");
  assert.ok(!h.keys.k.s.c0, "the oldest are dropped first");
});

test("stale or corrupt history is cleaned, never thrown", () => {
  const junk = [undefined, null, 5, "x", [], { keys: 7 }, { keys: { a: null, b: { t: "z", s: { ok: 3, bad: "no", neg: -1, nan: NaN } }, c: { t: 2, s: { future: 99 } } } }];
  for (const j of junk) {
    const h = Deck.sanitize(j);
    assert.ok(h && typeof h.keys === "object");
  }
  const h = Deck.sanitize(junk[junk.length - 1]);
  assert.deepEqual(h.keys.b.s, { ok: 3 });
  assert.ok(h.keys.c.t >= 99, "counter repaired so new marks come after old ones");
  Deck.markShown(h, "c", ["n"]);
  assert.ok(h.keys.c.s.n > h.keys.c.s.future);
});

test("history survives a JSON round trip (reload)", () => {
  const h = Deck.sanitize(null);
  Deck.markShown(h, "x:practice", ["a", "b"]);
  const back = Deck.sanitize(JSON.parse(JSON.stringify(h)));
  assert.deepEqual(back, h);
});

test("marking again (deliberate review) just refreshes recency", () => {
  const h = Deck.sanitize(null);
  Deck.markShown(h, "k", ["a", "b"]);
  Deck.markShown(h, "k", ["a"]);
  assert.ok(h.keys.k.s.a > h.keys.k.s.b);
  assert.equal(Object.keys(h.keys.k.s).length, 2);
});
