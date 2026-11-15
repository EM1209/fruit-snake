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
