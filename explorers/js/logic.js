/* logic.js — Snake Explorers: pure rules. No DOM, no storage, no audio.
 * Everything that decides "is this right?", "what happened when the code ran?",
 * "what has been earned?" lives here so it can be tested in Node.
 * Answers are always validated by stable ids/values, never by array position.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SE_Logic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---- seeded randomness (so rounds are reproducible in tests) -------------
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function int(rand, lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
  function shuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function sample(arr, n, rand) { return shuffle(arr, rand).slice(0, n); }
  function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }

  // ---- choose (tap / match / multi-select) ---------------------------------
  /* prompt.rule is one of:
   *   { type:"one",  valid:[ids] }            pick one; any valid id counts
   *   { type:"some", valid:[ids], n:k }       pick exactly k, all valid
   *   { type:"all",  valid:[ids] }            pick exactly the valid set
   *   { type:"set",  required:[ids], groups:[{ids:[..], n:1}] }
   *        everything required + exactly n from each group, nothing else
   */
  function allowedIds(rule) {
    const s = new Set(rule.valid || []);
    (rule.required || []).forEach(i => s.add(i));
    (rule.groups || []).forEach(g => g.ids.forEach(i => s.add(i)));
    return s;
  }
  function checkChoice(rule, selected) {
    const sel = Array.from(new Set(selected || []));
    const allowed = allowedIds(rule);
    const wrong = sel.filter(id => !allowed.has(id));
    const right = sel.filter(id => allowed.has(id));
    let ok = false, need = 0;
    if (rule.type === "one") {
      ok = sel.length === 1 && wrong.length === 0;
      need = 1;
    } else if (rule.type === "some") {
      ok = wrong.length === 0 && sel.length === rule.n;
      need = rule.n;
    } else if (rule.type === "all") {
      const missing = rule.valid.filter(id => !sel.includes(id));
      ok = wrong.length === 0 && missing.length === 0;
      need = rule.valid.length;
      return { ok, wrong, right, missing, need, tooMany: false };
    } else if (rule.type === "set") {
      const missing = rule.required.filter(id => !sel.includes(id));
      let groupsOk = true, groupNeed = 0, groupShort = [];
      (rule.groups || []).forEach(g => {
        const c = sel.filter(id => g.ids.includes(id)).length;
        groupNeed += g.n;
        if (c !== g.n) { groupsOk = false; groupShort.push({ ids: g.ids, have: c, n: g.n }); }
      });
      ok = wrong.length === 0 && missing.length === 0 && groupsOk;
      need = rule.required.length + groupNeed;
      return { ok, wrong, right, missing, need, groupShort, tooMany: false };
    }
    return { ok, wrong, right, missing: [], need, tooMany: sel.length > need };
  }
  function choiceNeed(rule) {
    if (rule.type === "one") return 1;
    if (rule.type === "some") return rule.n;
    if (rule.type === "all") return rule.valid.length;
    if (rule.type === "set") return rule.required.length + (rule.groups || []).reduce((s, g) => s + g.n, 0);
    return 1;
  }

  // ---- sequence -------------------------------------------------------------
  /* tiles: [{id, value}], order: [tileId], answers: [[value,...], ...]
   * cyclic: true accepts any rotation (e.g. the seasons have no first one).
   * Duplicate values (the two Ps in APPLE) are interchangeable, because we
   * compare values, not which tile was used.
   */
  function rotations(seq) {
    const out = [];
    for (let i = 0; i < seq.length; i++) out.push(seq.slice(i).concat(seq.slice(0, i)));
    return out;
  }
  function checkSequence(spec, order) {
    const byId = new Map(spec.tiles.map(t => [t.id, t.value]));
    const vals = order.map(id => byId.get(id));
    let answers = spec.answers;
    if (spec.cyclic) answers = answers.flatMap(rotations);
    let best = null;
    for (const ans of answers) {
      const pos = ans.map((v, i) => vals[i] === v);
      const n = pos.filter(Boolean).length;
      if (!best || n > best.inPlace) best = { answer: ans, positions: pos, inPlace: n };
    }
    const complete = vals.length === best.answer.length && vals.every(v => v !== undefined);
    const ok = complete && best.inPlace === best.answer.length;
    const firstWrong = ok ? -1 : best.positions.findIndex(p => !p);
    return { ok, complete, positions: best.positions, inPlace: best.inPlace, firstWrong, total: best.answer.length, expected: best.answer };
  }

  // ---- sort -------------------------------------------------------------------
  function checkSort(item, binId) {
    return { ok: (item.bins || []).includes(binId) };
  }

  // ---- plan & run (Logic Lab) -------------------------------------------------
  const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const key2 = (p) => p.x + "," + p.y;
  /* level: {w,h,start,goal,rocks:[[x,y]],key?:{x,y},maxMoves?}
   * Lenient: the run succeeds the moment the snake stands on the goal (having
   * picked up the key, if there is one); leftover arrows are reported, not punished.
   */
  function runProgram(level, program) {
    const rocks = new Set((level.rocks || []).map(([x, y]) => x + "," + y));
    let pos = { x: level.start.x, y: level.start.y };
    let hasKey = !level.key;
    const steps = [];
    for (let i = 0; i < program.length; i++) {
      const d = DIRS[program[i]];
      if (!d) return { result: "bad-command", at: i, steps, pos, hasKey };
      const nx = pos.x + d.x, ny = pos.y + d.y;
      if (nx < 0 || ny < 0 || nx >= level.w || ny >= level.h)
        return { result: "bump-edge", at: i, steps, pos, hasKey, tried: { x: nx, y: ny } };
      if (rocks.has(nx + "," + ny))
        return { result: "bump-rock", at: i, steps, pos, hasKey, tried: { x: nx, y: ny } };
      pos = { x: nx, y: ny };
      let gotKey = false;
      if (!hasKey && level.key && pos.x === level.key.x && pos.y === level.key.y) { hasKey = true; gotKey = true; }
      steps.push({ x: nx, y: ny, gotKey });
      if (pos.x === level.goal.x && pos.y === level.goal.y && hasKey)
        return { result: "success", at: i, steps, pos, hasKey, extra: program.length - 1 - i };
    }
    const atGoal = pos.x === level.goal.x && pos.y === level.goal.y;
    return { result: atGoal && !hasKey ? "need-key" : "short", at: program.length, steps, pos, hasKey,
      distance: Math.abs(level.goal.x - pos.x) + Math.abs(level.goal.y - pos.y) };
  }
  // Breadth-first search: fewest arrows to solve, and how many different shortest routes.
  function solveLevel(level) {
    const rocks = new Set((level.rocks || []).map(([x, y]) => x + "," + y));
    const start = { x: level.start.x, y: level.start.y, k: level.key ? 0 : 1 };
    const id = (s) => s.x + "," + s.y + "," + s.k;
    const dist = new Map([[id(start), 0]]), ways = new Map([[id(start), 1]]);
    const prev = new Map();
    const q = [start];
    let goalState = null;
    while (q.length) {
      const s = q.shift();
      if (s.x === level.goal.x && s.y === level.goal.y && s.k === 1) { goalState = s; break; }
      for (const [name, d] of Object.entries(DIRS)) {
        const nx = s.x + d.x, ny = s.y + d.y;
        if (nx < 0 || ny < 0 || nx >= level.w || ny >= level.h || rocks.has(nx + "," + ny)) continue;
        const k = s.k || (level.key && nx === level.key.x && ny === level.key.y) ? 1 : 0;
        const n = { x: nx, y: ny, k };
        const nid = id(n), cd = dist.get(id(s)) + 1;
        if (!dist.has(nid)) { dist.set(nid, cd); ways.set(nid, ways.get(id(s))); prev.set(nid, [id(s), name]); q.push(n); }
        else if (dist.get(nid) === cd) ways.set(nid, ways.get(nid) + ways.get(id(s)));
      }
    }
    if (!goalState) return null;
    const path = [];
    let cur = id(goalState);
    while (prev.has(cur)) { const [p, name] = prev.get(cur); path.unshift(name); cur = p; }
    // count shortest routes ending at goal with key
    const gid = id(goalState);
    return { moves: dist.get(gid), path, routes: ways.get(gid) };
  }

  // ---- round summaries & next-round suggestions -----------------------------
  /* results: [{promptId, firstTry:bool, solved:bool, misses:n, hints:n, skipped:bool}] */
  function summarizeRound(results) {
    const total = results.length;
    const firstTry = results.filter(r => r.solved && r.firstTry).length;
    const afterRetry = results.filter(r => r.solved && !r.firstTry).length;
    const skipped = results.filter(r => r.skipped).length;
    const hints = results.reduce((s, r) => s + (r.hints || 0), 0);
    return { total, firstTry, afterRetry, skipped, hints };
  }
  const MODES = ["explore", "practice", "challenge"];
  // Suggests; never changes the round in progress.
  function suggestNext(summary, mode) {
    const graded = summary.total - (summary.ungraded || 0);
    if (graded <= 0) {
      return mode === "challenge" ? { direction: "same", mode } : { direction: "harder", mode: MODES[MODES.indexOf(mode) + 1] };
    }
    const ratio = summary.firstTry / graded;
    const i = MODES.indexOf(mode);
    if (ratio >= 0.8 && summary.skipped === 0 && i < 2) return { direction: "harder", mode: MODES[i + 1] };
    if ((ratio < 0.5 || summary.skipped >= 2) && i > 0) return { direction: "easier", mode: MODES[i - 1] };
    return { direction: "same", mode };
  }

  // ---- progress (discovered vs practiced) -----------------------------------
  function emptyProgress() {
    return {
      concepts: {},          // id -> { seen, practiced }
      stats: { rounds: 0, worlds: {}, modes: {}, sorted: 0, sequences: 0, routes: 0, challengeRounds: 0 },
      best: {},              // optional stopwatch bests, per activity
      last: null             // { activityId, mode }
    };
  }
  function concept(p, id) { return (p.concepts[id] = p.concepts[id] || { seen: 0, practiced: 0 }); }
  // Pure-ish reducer: returns the same object, mutated (simple and predictable).
  function applyEvent(p, ev) {
    if (ev.type === "seen") ev.ids.forEach(id => { concept(p, id).seen++; });
    else if (ev.type === "practiced") ev.ids.forEach(id => { const c = concept(p, id); c.seen = Math.max(1, c.seen); c.practiced++; });
    else if (ev.type === "solved") {
      if (ev.mechanic === "sort") p.stats.sorted++;
      if (ev.mechanic === "sequence") p.stats.sequences++;
      if (ev.mechanic === "plan") p.stats.routes++;
    } else if (ev.type === "round") {
      p.stats.rounds++;
      p.stats.worlds[ev.world] = (p.stats.worlds[ev.world] || 0) + 1;
      p.stats.modes[ev.mode] = (p.stats.modes[ev.mode] || 0) + 1;
      if (ev.mode === "challenge") p.stats.challengeRounds++;
    }
    return p;
  }
  // Derived numbers used by unlock goals. conceptWorld: id -> worldId
  function deriveStats(p, conceptWorld) {
    let discovered = 0, practiced = 0;
    const byWorldSeen = {}, byWorldPracticed = {};
    for (const [id, c] of Object.entries(p.concepts)) {
      const w = conceptWorld[id];
      if (!w) continue;
      if (c.seen > 0) { discovered++; byWorldSeen[w] = (byWorldSeen[w] || 0) + 1; }
      if (c.practiced > 0) { practiced += c.practiced; byWorldPracticed[w] = (byWorldPracticed[w] || 0) + c.practiced; }
    }
    return {
      discovered, practiced,
      rounds: p.stats.rounds,
      worldsVisited: Object.keys(p.stats.worlds).length,
      modesTried: Object.keys(p.stats.modes).length,
      sorted: p.stats.sorted, sequences: p.stats.sequences, routes: p.stats.routes,
      challengeRounds: p.stats.challengeRounds,
      wordPractice: byWorldPracticed.word || 0,
      natureDiscovered: byWorldSeen.nature || 0,
      numberPractice: byWorldPracticed.number || 0
    };
  }
  /* catalog: [{id, goal:{stat, n, text}} | {id, free:true}] */
  function computeUnlocks(derived, catalog) {
    const out = {};
    catalog.forEach(c => {
      if (c.free) { out[c.id] = { unlocked: true, have: 0, need: 0 }; return; }
      const have = derived[c.goal.stat] || 0;
      out[c.id] = { unlocked: have >= c.goal.n, have: Math.min(have, c.goal.n), need: c.goal.n };
    });
    return out;
  }

  return { rng, int, shuffle, sample, pick, checkChoice, choiceNeed, checkSequence, rotations, checkSort,
    DIRS, runProgram, solveLevel, summarizeRound, suggestNext, MODES,
    emptyProgress, applyEvent, deriveStats, computeUnlocks };
});
