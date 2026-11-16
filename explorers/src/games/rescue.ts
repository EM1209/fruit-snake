/* rescue.ts — Snake Rescue (Logic Lab).
 * Guide the snake, one square per press, to a lost animal. It follows the
 * snake, and the snake brings it to the home that suits it.
 *   Easy: a short, open trip with one animal and one home.
 *   More challenge: a key that opens a gate, a river with one safe bridge,
 *   rocks with a decoy home, or two rescues at once.
 * Every mission is generated, then checked with a breadth-first search over
 * the whole mission state (position, who is following, who is home, key,
 * gate), so there is always a way there and a way back. */
import { type Api, type Mech, type Prompt, el, esc, icon, dpad, bindSteps, DIRS, cap, pick, shuffle, int, pid } from "./kit.ts";

export type XY = { x: number; y: number };
export type Rescue = { animal: string; art: string; at: XY; home: string };
export type Home = { id: string; art: string; label: string; at: XY };
export type Mission = { w: number; h: number; variant: string; start: XY; rescues: Rescue[]; homes: Home[]; rocks: XY[]; water: XY[]; bridges: XY[]; gates: XY[]; key: XY | null };
export type State = { pos: XY; trail: XY[]; carrying: number[]; delivered: number[]; hasKey: boolean; gateOpen: boolean; moves: number };

/* Each animal's home. Labels are what the child hears and sees. */
export const HOMES: Record<string, { art: string; label: string; why: string }> = {
  pond: { art: "pond", label: "pond", why: "Ducks swim and find food in ponds." },
  burrow: { art: "burrow", label: "burrow", why: "Rabbits dig burrows under the ground to stay safe." },
  hollowtree: { art: "hollowtree", label: "hollow tree", why: "Owls nest in hollow trees." },
  hive: { art: "hive", label: "hive", why: "Bees live together in a hive." },
  lilypad: { art: "lilypad", label: "lily pad", why: "Frogs rest on lily pads in the pond." },
  nest: { art: "nest", label: "nest", why: "Robins raise their chicks in a nest." },
  cave: { art: "cave", label: "cave", why: "Bats hang upside down in dark caves." },
  snowden: { art: "snowden", label: "snow den", why: "Polar bear cubs are born in snow dens." }
};
export const ANIMAL_HOME: Record<string, { art: string; label: string; home: string }> = {
  duck: { art: "duckling", label: "duckling", home: "pond" },
  rabbit: { art: "rabbit", label: "rabbit", home: "burrow" },
  owl: { art: "owl", label: "owl", home: "hollowtree" },
  bee: { art: "bee", label: "bee", home: "hive" },
  frog: { art: "frog", label: "frog", home: "lilypad" },
  robin: { art: "robin", label: "robin", home: "nest" },
  bat: { art: "bat", label: "bat", home: "cave" },
  polarbear: { art: "polarbear", label: "polar bear cub", home: "snowden" }
};

const k = (p: XY) => p.x + "," + p.y;
const same = (a: XY | null, b: XY | null) => !!a && !!b && a.x === b.x && a.y === b.y;
export function startState(m: Mission): State { return { pos: { ...m.start }, trail: [], carrying: [], delivered: [], hasKey: false, gateOpen: false, moves: 0 }; }

export type StepEvent = "move" | "bump-edge" | "bump-rock" | "bump-water" | "bump-gate" | "pickup" | "key" | "gate-open" | "deliver" | "wrong-home" | "done";
/** Pure rule: one step. Returns the new state and what happened (several events can happen at once). */
export function step(m: Mission, s: State, dir: string): { state: State; events: StepEvent[]; tried: XY; picked?: number; delivered?: number[]; wrongHome?: Home } {
  const d = DIRS[dir]; const t = { x: s.pos.x + d.x, y: s.pos.y + d.y };
  if (t.x < 0 || t.y < 0 || t.x >= m.w || t.y >= m.h) return { state: s, events: ["bump-edge"], tried: t };
  if (m.rocks.some(r => same(r, t))) return { state: s, events: ["bump-rock"], tried: t };
  if (m.water.some(r => same(r, t))) return { state: s, events: ["bump-water"], tried: t };
  const events: StepEvent[] = [];
  let gateOpen = s.gateOpen;
  if (m.gates.some(g => same(g, t)) && !gateOpen) {
    if (!s.hasKey) return { state: s, events: ["bump-gate"], tried: t };
    gateOpen = true; events.push("gate-open");
  }
  const n: State = { pos: t, trail: [{ ...s.pos }].concat(s.trail).slice(0, 4), carrying: s.carrying.slice(), delivered: s.delivered.slice(), hasKey: s.hasKey, gateOpen, moves: s.moves + 1 };
  events.unshift("move");
  let picked: number | undefined;
  if (m.key && same(m.key, t) && !n.hasKey) { n.hasKey = true; events.push("key"); }
  m.rescues.forEach((r, i) => { if (same(r.at, t) && !n.carrying.includes(i) && !n.delivered.includes(i)) { n.carrying.push(i); picked = i; events.push("pickup"); } });
  const home = m.homes.find(h => same(h.at, t));
  const delivered: number[] = [];
  let wrongHome: Home | undefined;
  if (home && n.carrying.length) {
    const fits = n.carrying.filter(i => m.rescues[i].home === home.id);
    if (fits.length) { fits.forEach(i => { delivered.push(i); n.delivered.push(i); }); n.carrying = n.carrying.filter(i => !fits.includes(i)); events.push("deliver"); }
    else { wrongHome = home; events.push("wrong-home"); }
  }
  if (n.delivered.length === m.rescues.length) events.push("done");
  return { state: n, events, tried: t, picked, delivered, wrongHome };
}
export const isDone = (m: Mission, s: State) => s.delivered.length === m.rescues.length;

/** BFS over the full mission state. Returns the shortest list of directions, or null if impossible. */
export function solve(m: Mission, from?: State): string[] | null {
  const s0 = from || startState(m);
  const key = (s: State) => k(s.pos) + "|" + s.carrying.slice().sort().join(".") + "|" + s.delivered.slice().sort().join(".") + "|" + (s.hasKey ? 1 : 0) + (s.gateOpen ? 1 : 0);
  if (isDone(m, s0)) return [];
  const seen = new Set([key(s0)]);
  let frontier: { s: State; path: string[] }[] = [{ s: s0, path: [] }];
  for (let depth = 0; depth < 200 && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { s, path } of frontier) {
      for (const d of ["up", "down", "left", "right"]) {
        const r = step(m, s, d);
        if (!r.events.includes("move")) continue;
        const kk = key(r.state); if (seen.has(kk)) continue; seen.add(kk);
        const p2 = path.concat(d);
        if (isDone(m, r.state)) return p2;
        next.push({ s: r.state, path: p2 });
      }
    }
    frontier = next;
  }
  return null;
}
/** Could the mission be finished WITHOUT the key/bridge? Used to make sure those parts really matter. */
function solvableWithout(m: Mission, what: "gate" | "bridge"): boolean {
  if (what === "gate") return !!solve({ ...m, gates: [], key: null, rocks: m.rocks.concat(m.gates) });
  return !!solve({ ...m, water: m.water.concat(m.bridges), bridges: [] });
}

// ------------------------------------------------------------------ generation
function freeCells(w: number, h: number, taken: XY[]): XY[] {
  const t = new Set(taken.map(k)); const out: XY[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!t.has(x + "," + y)) out.push({ x, y });
  return out;
}
const dist = (a: XY, b: XY) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
function homeOf(animal: string, at: XY): Home { const h = HOMES[ANIMAL_HOME[animal].home]; return { id: ANIMAL_HOME[animal].home, art: h.art, label: h.label, at }; }
function rescueOf(animal: string, at: XY): Rescue { return { animal, art: ANIMAL_HOME[animal].art, at, home: ANIMAL_HOME[animal].home }; }
const ANIMALS = Object.keys(ANIMAL_HOME);

export function makeMission(variant: string, rand: () => number): Mission | null {
  const base = (w: number, h: number): Mission => ({ w, h, variant, start: { x: 0, y: 0 }, rescues: [], homes: [], rocks: [], water: [], bridges: [], gates: [], key: null });
  if (variant === "easy") {
    const m = base(5, 4);
    const a = pick(ANIMALS, rand);
    m.start = { x: int(rand, 0, 4), y: int(rand, 0, 3) };
    const cells = freeCells(5, 4, [m.start]);
    const near = cells.filter(c => dist(c, m.start) >= 2 && dist(c, m.start) <= 3);
    const at = pick(near, rand);
    const homeCells = cells.filter(c => !same(c, at) && dist(c, at) >= 2 && dist(c, at) <= 3);
    if (!homeCells.length) return null;
    m.rescues = [rescueOf(a, at)]; m.homes = [homeOf(a, pick(homeCells, rand))];
    const sol = solve(m); return sol && sol.length <= 7 ? m : null;
  }
  const m = base(6, 6);
  const [a, b] = shuffle(ANIMALS.filter(x => true), rand).filter((x, i, arr) => i === 0 || ANIMAL_HOME[x].home !== ANIMAL_HOME[arr[0]].home).slice(0, 2);
  if (variant === "gate") {
    // a fence down one column with a single gate; the home is behind it, the key in front
    const fx = int(rand, 2, 3), gy = int(rand, 0, 5);
    for (let y = 0; y < 6; y++) (y === gy ? m.gates : m.rocks).push({ x: fx, y });
    m.start = { x: 0, y: int(rand, 0, 5) };
    const left = freeCells(6, 6, [m.start].concat(m.rocks, m.gates)).filter(c => c.x < fx);
    const right = freeCells(6, 6, m.rocks.concat(m.gates)).filter(c => c.x > fx);
    const [kc, ac] = shuffle(left.filter(c => dist(c, m.start) >= 2), rand);
    if (!kc || !ac) return null;
    m.key = kc; m.rescues = [rescueOf(a, ac)];
    m.homes = [homeOf(a, pick(right.filter(c => c.x === 5), rand))];
  } else if (variant === "bridge") {
    // a river across one row with one safe bridge
    const ry = int(rand, 2, 3), bx = int(rand, 0, 5);
    for (let x = 0; x < 6; x++) (x === bx ? m.bridges : m.water).push({ x, y: ry });
    const top = freeCells(6, 6, []).filter(c => c.y < ry), bottom = freeCells(6, 6, []).filter(c => c.y > ry);
    m.start = pick(top, rand);
    const ac = pick(top.filter(c => dist(c, m.start) >= 2), rand);
    const rocks = shuffle(bottom, rand).slice(0, 3).filter(c => !(c.x === bx && c.y === ry + 1));
    m.rocks = rocks;
    const hc = pick(bottom.filter(c => !rocks.some(r => same(r, c)) && dist(c, { x: bx, y: ry }) >= 2), rand);
    if (!ac || !hc) return null;
    m.rescues = [rescueOf(a, ac)]; m.homes = [homeOf(a, hc)];
  } else if (variant === "decoy") {
    // rocks, and a second home that belongs to someone else
    m.start = { x: int(rand, 0, 5), y: int(rand, 0, 5) };
    const cells = shuffle(freeCells(6, 6, [m.start]), rand);
    m.rocks = cells.slice(0, int(rand, 6, 8));
    const rest = cells.slice(m.rocks.length);
    const ac = rest.find(c => dist(c, m.start) >= 3); if (!ac) return null;
    const hc = rest.find(c => !same(c, ac) && dist(c, ac) >= 3); if (!hc) return null;
    const dc = rest.find(c => !same(c, ac) && !same(c, hc) && dist(c, m.start) >= 2); if (!dc) return null;
    m.rescues = [rescueOf(a, ac)]; m.homes = shuffle([homeOf(a, hc), homeOf(b, dc)], rand);
  } else if (variant === "double") {
    m.start = { x: int(rand, 0, 5), y: int(rand, 0, 5) };
    const cells = shuffle(freeCells(6, 6, [m.start]), rand);
    m.rocks = cells.slice(0, int(rand, 3, 5));
    const rest = cells.slice(m.rocks.length).filter(c => dist(c, m.start) >= 2);
    if (rest.length < 4) return null;
    m.rescues = [rescueOf(a, rest[0]), rescueOf(b, rest[1])];
    m.homes = [homeOf(a, rest[2]), homeOf(b, rest[3])];
  } else return null;
  const sol = solve(m);
  if (!sol || sol.length < 5 || sol.length > 24) return null;
  if (variant === "gate" && solvableWithout(m, "gate")) return null;
  if (variant === "bridge" && solvableWithout(m, "bridge")) return null;
  return m;
}
export const signature = (m: Mission) => [m.variant, m.w, m.h, k(m.start), m.rescues.map(r => r.animal + "@" + k(r.at)).join(";"), m.homes.map(h => h.id + "@" + k(h.at)).join(";"),
  m.rocks.map(k).sort().join("_"), m.water.map(k).join("_"), m.gates.map(k).join("_"), m.key ? k(m.key) : "-"].join("|");

export function missionPrompt(m: Mission): Prompt {
  const names = m.rescues.map(r => ANIMAL_HOME[r.animal].label);
  const homes = m.rescues.map(r => HOMES[r.home].label);
  const extra = m.variant === "gate" ? " The gate is locked — find the key first." : m.variant === "bridge" ? " Cross the river on the bridge." : m.variant === "decoy" ? " Choose the right home." : "";
  const instruction = m.rescues.length > 1 ? "Rescue the " + names.join(" and the ") + ". Take each one to its home." + extra
    : "Find the lost " + names[0] + " and take it to the " + homes[0] + "." + extra;
  return {
    id: pid("rescue"), mechanic: "rescue", graded: true, mission: m, minMoves: solve(m)!.length,
    instruction, say: instruction,
    hints: [m.variant === "gate" ? "First the key, then the gate, then home." : "Go to the " + names[0] + " first. It will follow you.",
      "Watch the glowing squares: they show the next steps."],
    explanation: m.rescues.map(r => HOMES[r.home].why).join(" "),
    concepts: ["rescue"].concat(m.rescues.map(r => r.animal).filter(a => a !== "polarbear" || true)), seen: ["rescue"]
  };
}
export function buildRescue(mode: string, ctx: any): Prompt[] {
  if (mode === "explore") return ctx.generate((r: () => number) => { const m = makeMission("easy", r); return m && { cid: "rescue:" + signature(m), m, topic: "easy" }; }, 3, { tries: 60 }).map((c: any) => Object.assign(missionPrompt(c.m), { cids: [c.cid] }));
  const variants = shuffle(["gate", "bridge", "decoy", "double"], ctx.rand).slice(0, 3);
  return variants.map(v => ctx.generate((r: () => number) => { const m = makeMission(v, r); return m && { cid: "rescue:" + signature(m), m, topic: v }; }, 1, { tries: 120 })[0])
    .filter(Boolean).map((c: any) => Object.assign(missionPrompt(c.m), { cids: [c.cid] }));
}

// ------------------------------------------------------------------ the board
export function mountRescue(stage: HTMLElement, api: Api): Mech {
  const p = api.prompt; const m: Mission = p.mission;
  let s = startState(m), done = false, paused = false;
  const wrongHomes = new Set<string>();
  const node = el(`<div class="rescue">
    <div class="board-box"><div class="board rescue-board" style="--w:${m.w};--h:${m.h}" role="grid" aria-label="Rescue map. Use the arrow buttons, arrow keys, swipe, or tap a square next to the snake."></div></div>
    <div class="side">
      <div class="mission-card" aria-live="polite"></div>
      <div class="pad-slot"></div>
    </div>
  </div>`);
  stage.appendChild(node);
  const board = node.querySelector(".rescue-board") as HTMLElement, card = node.querySelector(".mission-card") as HTMLElement;
  const pad = dpad("Move the snake one square"); node.querySelector(".pad-slot")!.appendChild(pad);
  const at = (q: XY) => `grid-column:${q.x + 1};grid-row:${q.y + 1}`;
  const cellEls: HTMLElement[] = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const water = m.water.some(c => c.x === x && c.y === y), bridge = m.bridges.some(c => c.x === x && c.y === y);
    const c = el(`<button type="button" class="rcell${water ? " water" : ""}${bridge ? " bridge" : ""}" style="${at({ x, y })}" data-x="${x}" data-y="${y}" tabindex="-1" aria-label="${water ? "River" : bridge ? "Bridge" : "Grass"}, column ${x + 1}, row ${y + 1}"></button>`);
    c.addEventListener("click", () => tapCell(x, y)); board.appendChild(c); cellEls.push(c);
  }
  const put = (q: XY, html: string, cls: string) => { const e = el(`<div class="rtoken ${cls}" style="${at(q)}">${html}</div>`); board.appendChild(e); return e; };
  m.rocks.forEach(r => put(r, api.Art.item("rock", "art"), "rock"));
  const gateEls = m.gates.map(g => put(g, `<svg viewBox="0 0 64 64" class="art" aria-hidden="true"><rect x="6" y="10" width="52" height="46" rx="6" fill="#C49060" stroke="#3A2E4D" stroke-width="2.5"/><path d="M18 10v46M32 10v46M46 10v46" stroke="#8A5A2E" stroke-width="3"/><circle cx="32" cy="34" r="6" fill="#F4CF4E" stroke="#3A2E4D" stroke-width="2"/></svg>`, "gate"));
  const keyEl = m.key ? put(m.key, api.Art.item("key", "art"), "key") : null;
  m.homes.forEach(h => put(h.at, api.Art.item(h.art, "art") + `<span class="tok-lab">${esc(cap(h.label))}</span>`, "home"));
  const animalEls = m.rescues.map(r => put(r.at, api.Art.item(r.art, "art"), "lost"));
  const snakeEl = put(m.start, api.Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood: "idle" }), "snake");
  const glow: HTMLElement[] = [];

  function paint(mood?: string) {
    snakeEl.setAttribute("style", at(s.pos));
    if (mood) { snakeEl.innerHTML = api.Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood }); }
    m.rescues.forEach((r, i) => {
      const e = animalEls[i];
      if (s.delivered.includes(i)) { e.classList.add("home-safe"); e.setAttribute("style", at(m.homes.find(h => h.id === r.home)!.at)); }
      else if (s.carrying.includes(i)) { e.classList.add("following"); const slot = s.carrying.indexOf(i); e.setAttribute("style", at(s.trail[slot] || s.pos)); }
    });
    if (keyEl) keyEl.classList.toggle("got", s.hasKey);
    gateEls.forEach(g => g.classList.toggle("open", s.gateOpen));
    const rows = m.rescues.map((r, i) => `<li class="${s.delivered.includes(i) ? "ok" : s.carrying.includes(i) ? "on" : ""}">
      <span class="mc-pic">${api.Art.item(r.art, "art")}</span><span class="mc-arrow">${icon("right")}</span><span class="mc-pic">${api.Art.item(HOMES[r.home].art, "art")}</span>
      <span class="mc-text">${s.delivered.includes(i) ? "Home safe!" : s.carrying.includes(i) ? "Following you — now find the " + esc(HOMES[r.home].label) : "Find the " + esc(ANIMAL_HOME[r.animal].label)}</span></li>`).join("");
    card.innerHTML = `<h2 class="mc-title">Mission</h2><ul class="mc-list">${rows}</ul>` + (m.key ? `<p class="mc-key${s.hasKey ? " ok" : ""}">${api.Art.item("key", "art")}<span>${s.hasKey ? (s.gateOpen ? "Gate open" : "You have the key") : "The gate needs the key"}</span></p>` : "");
  }
  function clearGlow() { glow.splice(0).forEach(g => g.classList.remove("glow")); }
  function move(dir: string) {
    if (done || paused) return;
    clearGlow();
    const r = step(m, s, dir);
    if (!r.events.includes("move")) {
      api.sfx("tap");
      const why = r.events[0] === "bump-rock" ? "A rock is in the way." : r.events[0] === "bump-water" ? "That's deep water. Look for the bridge." : r.events[0] === "bump-gate" ? "The gate is locked. Find the key first." : "That's the edge of the map.";
      api.feedback({ kind: "info", text: why, mood: "think" });
      snakeEl.classList.remove("bump"); void snakeEl.offsetWidth; snakeEl.classList.add("bump");
      return;
    }
    s = r.state; api.sfx("step");
    if (r.events.includes("key")) { api.sfx("pick"); api.feedback({ kind: "info", text: "You found the key!", mood: "happy" }); }
    if (r.events.includes("gate-open")) api.feedback({ kind: "info", text: "The key opens the gate.", mood: "happy" });
    if (r.events.includes("pickup")) { const a = m.rescues[r.picked!]; api.sfx("pick"); api.clip("word-" + (a.animal === "duck" ? "duck" : a.animal)); api.feedback({ kind: "info", text: "The " + ANIMAL_HOME[a.animal].label + " is following you. Now find its " + HOMES[a.home].label + ".", mood: "happy" }); }
    if (r.events.includes("deliver")) { api.sfx("right"); const a = m.rescues[r.delivered![0]]; api.feedback({ kind: "info", text: cap(ANIMAL_HOME[a.animal].label) + " is home safe! " + HOMES[a.home].why, mood: "cheer" }); }
    if (r.events.includes("wrong-home")) {
      const h = r.wrongHome!; const carried = m.rescues[s.carrying[0]];
      const kkey = h.id + ":" + carried.animal;
      api.sfx("retry");
      const text = "This " + h.label + " isn't the " + ANIMAL_HOME[carried.animal].label + "'s home. It needs the " + HOMES[carried.home].label + ".";
      if (!wrongHomes.has(kkey)) { wrongHomes.add(kkey); api.miss({ text, noAuto: true }); } else api.feedback({ kind: "info", text, mood: "think" });
    }
    paint(r.events.includes("deliver") ? "cheer" : undefined);
    if (r.events.includes("done")) finish();
  }
  function tapCell(x: number, y: number) {
    const dx = x - s.pos.x, dy = y - s.pos.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) { api.feedback({ kind: "info", text: "Tap a square right next to the snake, or use the arrows.", mood: "idle" }); return; }
    move(dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up");
  }
  function finish() {
    done = true; api.practiced(p.concepts || []); api.solved();
    board.classList.add("won");
    const shortest = p.minMoves;
    api.feedback({ kind: "right", text: "Mission complete! " + p.explanation + (s.moves <= shortest ? " And you found the shortest way!" : ""), mood: "cheer" });
    api.next();
  }
  const keys = bindSteps(pad, board, move);
  paint();
  return {
    onKey: (e) => keys.onKey(e),
    showHelp() {
      clearGlow();
      const path = solve(m, s); if (!path) return false;
      let q = { ...s.pos };
      path.slice(0, api.helpLevel() >= 2 ? 4 : 2).forEach(d => { q = { x: q.x + DIRS[d].x, y: q.y + DIRS[d].y }; const c = cellEls[q.y * m.w + q.x]; c.classList.add("glow"); glow.push(c); });
      return true;
    },
    pause() { paused = true; }, resume() { paused = false; },
    destroy() { done = true; },
    debug: () => ({ state: s, mission: m, done, solution: solve(m, s) })
  };
}
