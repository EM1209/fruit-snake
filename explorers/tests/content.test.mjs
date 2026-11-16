// Snake Explorers — every curated/generated prompt is answerable, consistent, and helpful.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../js/logic.js");
const C = require("../js/content.js");

const MECHANICS = new Set(["collect", "choose", "sort", "sequence", "plan", "explore"]);
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 3);

function eachPrompt(fn) {
  for (const a of C.ACTIVITIES) for (const mode of L.MODES) for (const seed of SEEDS) {
    const prompts = C.buildRound(a.id, mode, seed);
    prompts.forEach((p, i) => fn(p, { a, mode, seed, i, prompts }));
  }
}

test("six worlds, each with at least one activity, and at least four mechanics overall", () => {
  assert.equal(C.WORLDS.length, 6);
  for (const w of C.WORLDS) assert.ok(C.ACTIVITIES.some(a => a.world === w.id), w.id);
  const used = new Set(C.ACTIVITIES.map(a => a.mechanic));
  assert.ok(used.size >= 4, [...used].join(","));
});

test("every activity defines an objective, an example, and a line for each mode", () => {
  for (const a of C.ACTIVITIES) {
    assert.ok(a.objective && a.example && a.title, a.id);
    for (const m of L.MODES) assert.ok(a.modes[m], a.id + " " + m);
  }
});

test("every prompt has an instruction, hints, explanation, a known mechanic, and real concept ids", () => {
  eachPrompt((p, ctx) => {
    const where = ctx.a.id + "/" + ctx.mode + "/" + ctx.seed + "#" + ctx.i;
    assert.ok(MECHANICS.has(p.mechanic), where);
    assert.ok(p.instruction && p.instruction.length < 160, where + " instruction");
    assert.ok(p.hints.length >= 1 && p.hints.every(h => typeof h === "string" && h.length > 5), where + " hints");
    assert.ok(p.explanation, where + " explanation");
    for (const id of (p.concepts || []).concat(p.seen || [])) assert.ok(C.CONCEPT[id], where + " unknown concept " + id);
  });
});

test("choose prompts: unique option ids, valid answers present, wrong-answer hints only on wrong options", () => {
  eachPrompt((p, ctx) => {
    if (p.mechanic !== "choose") return;
    const where = ctx.a.id + "/" + ctx.mode + "/" + ctx.seed;
    const ids = p.options.map(o => o.id);
    assert.equal(new Set(ids).size, ids.length, where + " duplicate option ids");
    const labels = p.options.map(o => o.label);
    if ((p.options[0].shape || p.options[0].text) && p.rule.valid[0] !== "odd") assert.equal(new Set(labels).size, labels.length, where + " duplicate labels " + labels);
    const rule = p.rule;
    const valid = rule.valid || rule.required.concat(rule.groups.flatMap(g => g.ids));
    for (const v of valid) assert.ok(ids.includes(v), where + " valid id not offered: " + v);
    if (rule.type === "some") assert.ok(valid.length >= rule.n, where);
    assert.ok(L.choiceNeed(rule) < p.options.length, where + " must leave a real choice");
    for (const k of Object.keys(p.wrongHints || {})) {
      if (!ids.includes(k)) continue;
      assert.ok(!valid.includes(k), where + " wrong-hint on a valid answer " + k);
    }
    // a correct selection actually validates
    const good = rule.type === "one" ? [valid[0]] : rule.type === "some" ? valid.slice(0, rule.n)
      : rule.type === "all" ? valid.slice() : rule.required.concat(rule.groups.map(g => g.ids[0]));
    assert.equal(L.checkChoice(rule, good).ok, true, where);
    const bad = ids.filter(id => !valid.includes(id));
    assert.ok(bad.length >= 1, where + " needs at least one wrong option");
  });
});

test("number questions: the marked answer is mathematically right", () => {
  eachPrompt((p) => {
    if (p.activity !== "number-questions") return;
    const v = p.rule.valid[0];
    const n = v.startsWith("n") ? +v.slice(1) : null;
    let m;
    if ((m = /^What is (\d+) \+ (\d+)\?$/.exec(p.instruction))) assert.equal(n, +m[1] + +m[2]);
    if ((m = /^What is (\d+) − (\d+)\?$/.exec(p.instruction))) assert.equal(n, m[1] - m[2]);
    if (p.visual && p.visual.kind === "equation" && (m = /^(\d+) \+ \? = (\d+)$/.exec(p.visual.text))) assert.equal(n, m[2] - m[1]);
    if (p.visual && p.visual.kind === "dots" && p.visual.groups.length === 1) assert.equal(n, p.visual.groups[0].n);
    if (p.instruction === "Which basket has more berries?") {
      const [l, r] = p.options.map(o => o.dots.n);
      assert.equal(v, l > r ? "left" : "right");
      assert.ok(Math.abs(l - r) >= 2);
    }
    if (p.instruction === "Which number is greater?") assert.equal(n, Math.max(...p.options.map(o => +o.text)));
    if (n !== null) assert.ok(n >= 0);
  });
});

test("patterns: the answer really continues the sequence; odd-one-out has exactly one odd item", () => {
  eachPrompt((p) => {
    if (p.activity !== "pattern-path") return;
    if (p.visual && p.visual.kind === "pattern") {
      const seq = p.visual.seq;
      const blank = seq.indexOf(null);
      // An attribute "repeats" if some period that fits shows up at least twice in full.
      const periodic = (vals) => { for (let per = 1; per * 2 <= vals.length; per++) if (vals.every((v, i) => i < per || v === vals[i - per])) return true; return false; };
      const fits = (full) => periodic(full.map(s => s.shape)) && periodic(full.map(s => s.color));
      const ans = p.options.find(o => o.id === p.rule.valid[0]).shape;
      assert.ok(fits(seq.map((s, i) => (i === blank ? ans : s))), "answer continues the pattern");
      for (const o of p.options) {
        if (o.id === p.rule.valid[0]) continue;
        assert.ok(!fits(seq.map((s, i) => (i === blank ? o.shape : s))), "distractor must not also fit: " + o.label);
      }
    } else {
      assert.deepEqual(p.rule.valid, ["odd"]);
      assert.equal(p.options.filter(o => o.id === "odd").length, 1);
    }
  });
});

test("sequence prompts: tiles can build the answer, fixed slots and step hints are valid", () => {
  eachPrompt((p, ctx) => {
    if (p.mechanic !== "sequence") return;
    const where = ctx.a.id + "/" + ctx.mode;
    assert.equal(p.answers[0].length, p.slots, where);
    const pool = p.tiles.map(t => t.value).sort();
    const need = p.answers[0].slice().sort();
    const rest = pool.slice();
    for (const v of need) { const i = rest.indexOf(v); assert.ok(i >= 0, where + " missing tile " + v); rest.splice(i, 1); }
    (p.fixed || []).forEach(i => assert.ok(i < p.slots, where));
    if (p.stepHints) p.answers[0].forEach(v => assert.ok(p.stepHints[v], where + " step hint " + v));
    // building the answer from tiles validates
    const used = new Set();
    const order = p.answers[0].map(v => { const t = p.tiles.find(t => t.value === v && !used.has(t.id)); used.add(t.id); return t.id; });
    assert.equal(L.checkSequence(p, order).ok, true, where);
    assert.ok(p.tiles.length >= 3, where);
  });
});

test("sort prompts: every item fits at least one shown basket; ids unique", () => {
  eachPrompt((p, ctx) => {
    if (p.mechanic !== "sort") return;
    const bins = new Set(p.bins.map(b => b.id));
    assert.equal(bins.size, p.bins.length);
    assert.equal(new Set(p.items.map(i => i.id)).size, p.items.length);
    p.items.forEach(it => {
      assert.ok(it.bins.length >= 1 && it.bins.every(b => bins.has(b)), ctx.a.id + " " + it.id);
      assert.ok(it.hint && it.explain, ctx.a.id + " " + it.id + " hint/explain");
      assert.ok(p.bins.some(b => !it.bins.includes(b.id)), "there is a wrong basket for " + it.id);
    });
  });
});

test("habitat homes include animals that fit more than one shown habitat (valid alternatives)", () => {
  let multi = 0;
  for (const seed of SEEDS) {
    const [p] = C.buildRound("habitat-homes", "challenge", seed);
    multi += p.items.filter(i => i.bins.length > 1).length;
  }
  assert.ok(multi > 0);
});

test("logic levels: all solvable, within the arrow limit, and with more than one route", () => {
  for (const mode of L.MODES) for (const lv of C.LEVELS[mode]) {
    const s = L.solveLevel(lv);
    assert.ok(s, JSON.stringify(lv));
    if (mode !== "explore") assert.ok(s.routes >= 2, "level should allow different routes: " + JSON.stringify(lv));
  }
  eachPrompt((p) => {
    if (p.mechanic !== "plan") return;
    assert.ok(p.minMoves <= p.level.maxMoves);
    const rocks = new Set(p.level.rocks.map(r => r.join(",")));
    assert.ok(!rocks.has(p.level.start.x + "," + p.level.start.y));
    assert.ok(!rocks.has(p.level.goal.x + "," + p.level.goal.y));
  });
});

test("collect prompts: targets are on the board, berry counts are reachable", () => {
  eachPrompt((p) => {
    if (p.mechanic !== "collect") return;
    if (p.kind === "find") {
      const targets = p.targets || [p.target];
      assert.ok(targets.length >= 1 && targets.every(t => p.board.includes(t)));
      assert.equal(new Set(p.board).size, p.board.length);
      p.board.filter(b => !targets.includes(b)).forEach(b => assert.ok(p.wrongHints[b], "wrong hint for " + b));
      assert.ok(p.board.some(b => !targets.includes(b)), "board needs a wrong choice");
    }
    if (p.kind === "count") { assert.ok(p.berries > p.target && p.target >= 1); }
    if (p.kind === "explore") assert.ok(p.goal > 0 && p.pool.length >= 4);
  });
});

test("modes change the content, not just the label", () => {
  const sig = (id, mode) => JSON.stringify(C.buildRound(id, mode, 99).map(p => [p.mechanic, p.instruction.replace(/\d+/g, "#"), (p.options || p.tiles || p.items || []).length, p.rule && p.rule.type]));
  for (const a of C.ACTIVITIES) {
    const e = sig(a.id, "explore"), pr = sig(a.id, "practice"), ch = sig(a.id, "challenge");
    assert.notEqual(e, pr, a.id + " explore vs practice");
    assert.notEqual(pr, ch, a.id + " practice vs challenge");
  }
});

test("rounds are small, with natural stopping points", () => {
  for (const a of C.ACTIVITIES) for (const m of L.MODES) {
    const n = C.buildRound(a.id, m, 5).length;
    assert.ok(n >= 1 && n <= 6, a.id + " " + m + " " + n);
  }
});

test("cosmetics: free defaults exist and every goal uses a stat the game derives", () => {
  const derived = L.deriveStats(L.emptyProgress(), C.conceptWorld);
  for (const c of C.COSMETIC_LIST) {
    if (c.free) continue;
    assert.ok(c.goal.stat in derived, c.id + " " + c.goal.stat);
    assert.ok(c.goal.text);
  }
  for (const k of ["color", "pattern", "accessory"]) assert.ok(C.COSMETICS[k].some(c => c.free));
});

test("every picture the content refers to exists in the illustration kit", () => {
  const Art = require("../js/art.js");
  const need = new Set();
  C.CONCEPTS.forEach(c => need.add(c.art));
  C.WORLDS.forEach(w => need.add(w.art));
  C.ACTIVITIES.forEach(a => need.add(a.art));
  eachPrompt((p) => {
    (p.options || []).forEach(o => o.art && need.add(o.art));
    (p.tiles || []).forEach(t => t.art && need.add(t.art));
    (p.items || []).forEach(i => i.art && need.add(i.art));
    (p.bins || []).forEach(b => b.art && need.add(b.art));
    (p.cards || []).forEach(c => need.add(c.art));
    (p.board || []).forEach(b => need.add(b));
    (p.pool || []).forEach(b => need.add(b));
    if (p.picture) need.add(p.picture);
    if (p.scene) need.add(p.scene);
    if (p.story) need.add(p.story.who);
  });
  const missing = [...need].filter(n => !Art.has(n));
  assert.deepEqual(missing, []);
  // every illustration renders to well-formed-looking SVG
  for (const n of Art.names()) {
    const s = Art.item(n);
    assert.ok(s.startsWith("<svg") && s.endsWith("</svg>") && !s.includes("undefined") && !s.includes("NaN"), n);
  }
});
