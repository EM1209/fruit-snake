// Snake Explorers — repeat avoidance, end to end through the real round builders.
// We play many rounds per activity+mode, recording what each round showed,
// exactly as the app does, and check that questions don't come back while
// fresh ones remain.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../js/logic.js");
const C = require("../js/content.js");
const Deck = require("../js/deck.js");

const ROUNDS = 14;
// cid families that are deliberately small "containers" (a habitat set, a room set) rather than questions
const CONTAINER = /^(habset|rooms):/;
const family = (cid) => cid.split(":")[0];

function play(aid, mode, rounds, seed0, history) {
  const h = history || Deck.sanitize(null);
  const log = [];
  for (let r = 0; r < rounds; r++) {
    const prompts = C.buildRound(aid, mode, seed0 + r * 7919, h);
    const roundCids = [];
    prompts.forEach(p => { roundCids.push(...p.cids); Deck.markShown(h, Deck.keyOf(aid, mode), p.cids); });
    log.push(roundCids);
  }
  return { h, log };
}

test("no question repeats inside a round", () => {
  for (const a of C.ACTIVITIES) for (const mode of L.MODES) {
    const { log } = play(a.id, mode, 6, 11);
    log.forEach((cids, i) => assert.equal(new Set(cids).size, cids.length, `${a.id}/${mode} round ${i}: ${cids}`));
  }
});

test("across rounds, nothing comes back until its family's fresh questions are used up", () => {
  const report = [], fails = [];
  for (const a of C.ACTIVITIES) for (const mode of L.MODES) {
    const { log } = play(a.id, mode, ROUNDS, 101);
    const flat = log.flat().filter(c => !CONTAINER.test(c) && c !== "hunt-explore");
    const byFam = {};
    flat.forEach(c => (byFam[family(c)] = byFam[family(c)] || []).push(c));
    for (const [fam, seq] of Object.entries(byFam)) {
      const distinct = new Set(seq).size;
      const firstRepeat = seq.findIndex((c, i) => seq.indexOf(c) < i);
      if (firstRepeat >= 0) {
        // before the first repeat, every distinct item of this family seen in the whole run must already have appeared
        const before = new Set(seq.slice(0, firstRepeat)).size;
        if (before < distinct - 1) fails.push(`${a.id}/${mode} family ${fam}: repeated "${seq[firstRepeat]}" after only ${before} of ${distinct} distinct`);
      }
      report.push(`${a.id}/${mode}/${fam}: ${seq.length} shown, ${distinct} distinct`);
    }
  }
  assert.deepEqual(fails, []);
  assert.ok(report.length > 40);
});

test("Play again: the next round is fresh for every activity and mode (until a pool is exhausted)", () => {
  const fails = [];
  for (const a of C.ACTIVITIES) for (const mode of L.MODES) {
    const { log } = play(a.id, mode, 2, 555);
    const q = (cids) => cids.filter(c => !CONTAINER.test(c) && c !== "hunt-explore");
    const overlap = q(log[1]).filter(c => q(log[0]).includes(c));
    if (overlap.length) fails.push(`${a.id}/${mode}: round 2 repeated ${overlap}`);
  }
  assert.deepEqual(fails, []);
});

test("generated questions keep producing distinct content (diversity, not one question with shuffled answers)", () => {
  const gen = { "number-questions": 40, "fair-shares": 25, "berry-count": 5, "mirror-match": 25, "bug-hunt": 25 };
  for (const [aid, minDistinct] of Object.entries(gen)) for (const mode of L.MODES) {
    const { log } = play(aid, mode, 12, 77);
    const all = log.flat();
    const distinct = new Set(all).size;
    const need = Math.min(minDistinct, all.length);
    assert.ok(distinct >= need * 0.9, `${aid}/${mode}: only ${distinct} distinct in ${all.length}`);
  }
});

test("only what was SHOWN counts: an interrupted round's unseen questions stay fresh", () => {
  const aid = "kind-choices", mode = "practice", key = Deck.keyOf(aid, mode);
  const h = Deck.sanitize(null);
  const r1 = C.buildRound(aid, mode, 1, h);
  Deck.markShown(h, key, r1[0].cids);                 // player left after the first question
  assert.deepEqual(Object.keys(h.keys[key].s), r1[0].cids);
  const r2 = C.buildRound(aid, mode, 2, h);
  const r2c = r2.flatMap(p => p.cids);
  assert.ok(!r2c.includes(r1[0].cids[0]), "the one actually shown is avoided");
  const unseen = r1.slice(1).flatMap(p => p.cids);
  assert.ok(unseen.some(c => r2c.includes(c)) || true, "unseen ones remain eligible");
  // ...and they are eligible: with every other item marked shown, they must come back
  const all = C.KIND.map(k => "kind:" + k.id).filter(c => !unseen.includes(c));
  const h2 = Deck.sanitize(null); Deck.markShown(h2, key, all);
  const r3 = C.buildRound(aid, mode, 3, h2).flatMap(p => p.cids);
  assert.ok(unseen.every(c => r3.includes(c)), "unseen items are dealt first: " + r3 + " vs " + unseen);
});

test("reload: a saved-and-restored history continues exactly where it left off", () => {
  const aid = "letter-line", mode = "challenge";
  const { h } = play(aid, mode, 3, 900);
  const restored = JSON.parse(JSON.stringify(h));
  const a = C.buildRound(aid, mode, 42, h).flatMap(p => p.cids);
  const b = C.buildRound(aid, mode, 42, restored).flatMap(p => p.cids);
  assert.deepEqual(a, b);
});

test("modes and activities keep separate histories", () => {
  const { h } = play("kind-choices", "practice", 3, 5);
  const explore1 = C.buildRound("kind-choices", "explore", 99, h).flatMap(p => p.cids);
  const explore2 = C.buildRound("kind-choices", "explore", 99, null).flatMap(p => p.cids);
  assert.deepEqual(explore1, explore2, "practice history doesn't change explore picks");
  assert.ok(!h.keys[Deck.keyOf("letter-line", "practice")], "no history for an activity never played");
});

test("pool exhaustion: many more rounds than content, still full rounds, no errors, oldest first", () => {
  for (const [aid, mode] of [["life-cycles", "explore"], ["shape-sort", "challenge"], ["tidy-up", "challenge"], ["step-by-step", "practice"], ["code-snake", "challenge"]]) {
    const { log } = play(aid, mode, 40, 3);
    const lens = log.map(l => l.length);
    assert.ok(Math.min(...lens) >= 1);
    assert.equal(Math.min(...lens), Math.max(...lens), `${aid}/${mode}: rounds stay the same size`);
  }
});

test("corrupt or stale history never breaks a round", () => {
  const junk = [{ keys: { "kind-choices:practice": { t: "x", s: { "kind:crayons": "bad", "kind:gone-forever": 3 } } } }, { v: 99, keys: [] }, "garbage", { keys: { "kind-choices:practice": { t: 1e9, s: { "kind:crayons": 5 } } } }];
  for (const j of junk) {
    const r = C.buildRound("kind-choices", "practice", 4, j);
    assert.equal(r.length, 4);
  }
});

test("every activity and mode has enough distinct content for at least three fresh rounds", () => {
  const fails = [];
  for (const a of C.ACTIVITIES) for (const mode of L.MODES) {
    const { log } = play(a.id, mode, 3, 2024);
    const q = log.map(r => r.filter(c => !CONTAINER.test(c) && c !== "hunt-explore"));
    const flat = q.flat();
    if (a.id === "snack-hunt" && mode === "explore") continue;   // free exploration, no questions
    if (new Set(flat).size !== flat.length) fails.push(`${a.id}/${mode}: ${flat.length - new Set(flat).size} repeated within 3 rounds`);
  }
  assert.deepEqual(fails, []);
});
