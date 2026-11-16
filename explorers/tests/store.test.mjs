// Snake Explorers — saving: its own namespace, never touching Fruit Snake saves, and a fallback.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Store = require("../js/store.js");
const L = require("../js/logic.js");

function memStorage(init) {
  const m = new Map(Object.entries(init || {}));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), keys: () => [...m.keys()], raw: m };
}

test("saves under its own key and leaves every Fruit Snake key untouched", () => {
  const fs = { fs_best: "12", fs_learned: '{"fruits":["apple"]}', fs_skin: "ocean", fs_saymode: "tap", fs_owned: "1" };
  const st = memStorage(fs);
  const s = Store.create(st);
  const d = s.load();
  L.applyEvent(d.progress, { type: "practiced", ids: ["apple"] });
  d.look.color = "mint";
  s.save();
  assert.equal(Store.KEY, "snakeExplorers.v1");
  for (const [k, v] of Object.entries(fs)) assert.equal(st.getItem(k), v, k + " unchanged");
  assert.deepEqual(st.keys().filter(k => !k.startsWith("fs_")), ["snakeExplorers.v1"]);
  const again = Store.create(st).load();
  assert.equal(again.progress.concepts.apple.practiced, 1);
  assert.equal(again.look.color, "mint");
});

test("blocked storage: play continues with a session-only copy", () => {
  const throwing = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("SecurityError"); } };
  const s = Store.create(throwing);
  const d = s.load();
  assert.equal(s.isPersistent(), false);
  L.applyEvent(d.progress, { type: "seen", ids: ["owl"] });
  assert.equal(s.save(), false);
  assert.equal(s.get().progress.concepts.owl.seen, 1, "kept in memory for this session");
  const none = Store.create(null);
  none.load();
  assert.equal(none.isPersistent(), false);
});

test("read-only storage (quota/full) also falls back instead of crashing", () => {
  const ro = { getItem: () => null, setItem() { throw new Error("QuotaExceededError"); } };
  const s = Store.create(ro);
  s.load();
  assert.equal(s.isPersistent(), false);
});

test("a corrupt or foreign save never crashes the game", () => {
  for (const bad of ["{not json", JSON.stringify({ v: 99, junk: true }), "null"]) {
    const s = Store.create(memStorage({ "snakeExplorers.v1": bad }));
    const d = s.load();
    assert.ok(d.progress && d.settings && d.look);
    assert.equal(d.settings.voice, true);
  }
});

test("reset clears progress and looks but keeps settings", () => {
  const st = memStorage();
  const s = Store.create(st);
  const d = s.load();
  d.settings.speed = "step"; d.look.accessory = "hat";
  L.applyEvent(d.progress, { type: "round", world: "word", mode: "explore" });
  s.save();
  const r = s.reset();
  assert.equal(r.settings.speed, "step");
  assert.equal(r.look.accessory, "none");
  assert.equal(r.progress.stats.rounds, 0);
});

test("a first-release save loads unchanged; new fields are additive; loading never rewrites it", () => {
  const old = { v: 1, settings: { voice: false, sound: true, motion: "reduce", speed: "step", textSize: "large", mode: "challenge" },
    look: { color: "mint", pattern: "spots", accessory: "hat" },
    progress: { concepts: { apple: { seen: 2, practiced: 1 } }, stats: { rounds: 3, worlds: { word: 3 }, modes: { challenge: 3 }, sorted: 0, sequences: 2, routes: 0, challengeRounds: 3 }, best: {}, last: { activityId: "letter-line", mode: "challenge" } },
    seenUnlocks: ["accessory:hat"], futureField: { keep: true } };
  const raw = JSON.stringify(old);
  const st = memStorage({ "snakeExplorers.v1": raw, fs_best: "9" });
  const d = Store.create(st).load();
  assert.equal(st.getItem("snakeExplorers.v1"), raw, "loading alone writes nothing");
  assert.deepEqual(d.progress.concepts, old.progress.concepts);
  assert.equal(d.progress.stats.rounds, 3);
  assert.deepEqual(d.settings, old.settings);
  assert.deepEqual(d.look, old.look);
  assert.deepEqual(d.futureField, { keep: true }, "unknown fields survive");
  assert.deepEqual(d.history, { v: 1, keys: {} });
  assert.deepEqual(d.played, {});
  assert.equal(d.v, 1);
  assert.equal(st.getItem("fs_best"), "9");
});

test("corrupt history or played data in a save is cleaned without touching progress", () => {
  const save = { v: 1, progress: { concepts: { owl: { seen: 1, practiced: 0 } }, stats: { rounds: 1 } }, history: { keys: { "x:practice": { t: "bad", s: { a: "nope", b: 2 } } } }, played: { "kind-choices": 2, junk: "x" } };
  const d = Store.create(memStorage({ "snakeExplorers.v1": JSON.stringify(save) })).load();
  assert.deepEqual(d.history.keys["x:practice"].s, { b: 2 });
  assert.deepEqual(d.played, { "kind-choices": 2 });
  assert.equal(d.progress.concepts.owl.seen, 1);
});
