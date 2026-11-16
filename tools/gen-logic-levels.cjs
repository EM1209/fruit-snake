// Generate the curated Logic Lab level list (run once; output is pasted into explorers/js/levels.js).
//   node tools/gen-logic-levels.cjs > explorers/js/levels.js
// Every level is checked by the breadth-first solver: solvable, the right
// length for its mode, more than one shortest route (practice/challenge), and
// no duplicate layouts (mirror images are counted as duplicates too).
const L = require("../explorers/js/logic.js");
const rand = L.rng(20261115);
const R = (a, b) => L.int(rand, a, b);

function canon(lv) {
  // layout identity ignoring mirror images
  const f = (x, y, w) => [x, y];
  const enc = (m) => JSON.stringify([m(lv.start), m(lv.goal), lv.key ? m(lv.key) : null, lv.rocks.map(([x, y]) => m({ x, y })).sort()]);
  const id = (p) => [p.x, p.y], mx = (p) => [lv.w - 1 - p.x, p.y], my = (p) => [p.x, lv.h - 1 - p.y], mxy = (p) => [lv.w - 1 - p.x, lv.h - 1 - p.y];
  return [id, mx, my, mxy].map(enc).sort()[0];
}
function make(spec) {
  const out = [], seen = new Set();
  let guard = 0;
  while (out.length < spec.count && guard++ < 200000) {
    const w = spec.w, h = spec.h;
    const cell = () => ({ x: R(0, w - 1), y: R(0, h - 1) });
    const start = cell(), goal = cell();
    if (start.x === goal.x && start.y === goal.y) continue;
    const key = spec.key ? cell() : null;
    const used = new Set([start.x + "," + start.y, goal.x + "," + goal.y].concat(key ? [key.x + "," + key.y] : []));
    if (key && used.size < 3) continue;
    const rocks = [];
    const nr = R(spec.rocks[0], spec.rocks[1]);
    for (let i = 0; i < nr * 4 && rocks.length < nr; i++) {
      const c = cell(); const k = c.x + "," + c.y;
      if (!used.has(k)) { used.add(k); rocks.push([c.x, c.y]); }
    }
    const lv = { w, h, start, goal, rocks };
    if (key) lv.key = key;
    const s = L.solveLevel(lv);
    if (!s || s.moves < spec.moves[0] || s.moves > spec.moves[1]) continue;
    if (spec.minRoutes && s.routes < spec.minRoutes) continue;
    if (spec.detour) {   // rocks must matter: shortest path longer than the plain distance, or rocks block the straight lines
      const man = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
      const lvNo = Object.assign({}, lv, { rocks: [] });
      const plain = L.solveLevel(lvNo).moves;
      if (s.moves === plain && rocks.filter(([x, y]) => Math.min(start.x, goal.x) <= x && x <= Math.max(start.x, goal.x) && Math.min(start.y, goal.y) <= y && y <= Math.max(start.y, goal.y)).length < 2) continue;
      if (man < 4) continue;
    }
    const c = canon(lv);
    if (seen.has(c)) continue;
    seen.add(c); out.push(lv);
  }
  return out;
}
const LEVELS = {
  explore: make({ count: 12, w: 4, h: 4, rocks: [0, 0], moves: [2, 5] }),
  practice: make({ count: 14, w: 5, h: 5, rocks: [3, 5], moves: [5, 9], minRoutes: 2, detour: true }),
  challenge: make({ count: 12, w: 5, h: 5, rocks: [3, 6], moves: [9, 14], minRoutes: 2, key: true })
};
const fmt = (lv) => "{w:" + lv.w + ",h:" + lv.h + ",start:{x:" + lv.start.x + ",y:" + lv.start.y + "},goal:{x:" + lv.goal.x + ",y:" + lv.goal.y + "}" +
  (lv.key ? ",key:{x:" + lv.key.x + ",y:" + lv.key.y + "}" : "") + ",rocks:" + JSON.stringify(lv.rocks) + "}";
console.log(`/* levels.js — Logic Lab level list, curated by tools/gen-logic-levels.cjs (seeded, solver-checked).
 * Do not hand-edit without re-running the content tests: every level must stay solvable. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SE_Levels = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  return {
${Object.entries(LEVELS).map(([m, list]) => "    " + m + ": [\n" + list.map(lv => "      " + fmt(lv)).join(",\n") + "\n    ]").join(",\n")}
  };
});`);
console.error(Object.entries(LEVELS).map(([m, l]) => m + ":" + l.length + " moves " + l.map(x => L.solveLevel(x).moves).join(",")).join("\n"));
