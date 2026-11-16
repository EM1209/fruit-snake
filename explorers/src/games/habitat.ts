/* habitat.ts — Build a Habitat (Nature Trail).
 * Place water, shelter and plants in an illustrated scene to make an animal's home.
 *   Easy: one animal, its three needs shown as pictures, guided suggestions.
 *   More challenge: two or three animals that can share a home, in a limited
 *         number of spaces, so pieces have to do double duty. Any arrangement
 *         that meets every need fits — there are always several right answers.
 *   Free play (separate, not a difficulty): build anything, no wrong answers,
 *         save and reload creations on this device.
 * Placing is tap-a-piece then tap-a-space (or keyboard: Tab + Enter), with
 * dragging as an extra; every placed piece can be removed, and Undo steps back. */
import { type Api, type Mech, type Prompt, el, esc, icon, cap, pid } from "./kit.ts";

export type Need = "water" | "shelter" | "plants";
export const NEEDS: Need[] = ["water", "shelter", "plants"];
export const PIECES: Record<string, { label: string; cat: Need }> = {
  pond: { label: "pond", cat: "water" }, stream: { label: "stream", cat: "water" }, puddle: { label: "puddle", cat: "water" },
  nest: { label: "nest", cat: "shelter" }, log: { label: "log", cat: "shelter" }, rock: { label: "rock", cat: "shelter" }, burrow: { label: "burrow", cat: "shelter" },
  hollowtree: { label: "hollow tree", cat: "shelter" }, hive: { label: "hive", cat: "shelter" }, cave: { label: "cave", cat: "shelter" }, leafpile: { label: "pile of leaves", cat: "shelter" },
  grass: { label: "grass", cat: "plants" }, flowers: { label: "flowers", cat: "plants" }, lilypad: { label: "lily pads", cat: "plants" }, reeds: { label: "reeds", cat: "plants" },
  tree: { label: "tree", cat: "plants" }, bush: { label: "berry bush", cat: "plants" }, acorns: { label: "acorns", cat: "plants" }
};
/* What each animal needs. A piece can meet a need in any group (reeds are a plant, and also hide a duck's nest). */
export const ANIMALS: Record<string, { label: string; needs: Record<Need, string[]>; why: Record<Need, string> }> = {
  duck: { label: "duck", needs: { water: ["pond", "stream"], shelter: ["reeds", "nest"], plants: ["grass", "lilypad"] }, why: { water: "Ducks swim and dabble for food.", shelter: "Ducks hide their nests in reeds.", plants: "Ducks nibble grass and water plants." } },
  frog: { label: "frog", needs: { water: ["pond"], shelter: ["log", "rock"], plants: ["lilypad", "reeds"] }, why: { water: "Frogs lay their eggs in still pond water.", shelter: "Frogs hide under logs and rocks.", plants: "Frogs rest on lily pads and among reeds." } },
  turtle: { label: "turtle", needs: { water: ["pond", "stream"], shelter: ["log", "rock"], plants: ["lilypad", "reeds"] }, why: { water: "Pond turtles swim in fresh water.", shelter: "Turtles climb onto logs and rocks to warm up.", plants: "Turtles nibble water plants." } },
  snail: { label: "snail", needs: { water: ["puddle", "pond"], shelter: ["log", "rock", "leafpile"], plants: ["grass", "flowers", "bush"] }, why: { water: "Snails need damp places.", shelter: "Snails hide under logs, rocks and leaves.", plants: "Snails munch leaves and flowers." } },
  rabbit: { label: "rabbit", needs: { water: ["puddle", "stream"], shelter: ["burrow"], plants: ["grass", "flowers"] }, why: { water: "Rabbits need a drink of water.", shelter: "Rabbits sleep in burrows underground.", plants: "Rabbits nibble grass and flowers." } },
  bee: { label: "bee", needs: { water: ["puddle", "pond"], shelter: ["hive"], plants: ["flowers"] }, why: { water: "Bees sip water on hot days.", shelter: "Bees live in a hive.", plants: "Bees visit flowers for nectar." } },
  owl: { label: "owl", needs: { water: ["stream", "pond"], shelter: ["hollowtree"], plants: ["tree", "bush"] }, why: { water: "Owls need water to drink and bathe.", shelter: "Owls nest in hollow trees.", plants: "Owls perch in trees to watch for food." } },
  squirrel: { label: "squirrel", needs: { water: ["stream", "puddle"], shelter: ["hollowtree", "nest"], plants: ["acorns", "tree"] }, why: { water: "Squirrels need water to drink.", shelter: "Squirrels sleep in tree holes and leafy nests.", plants: "Squirrels eat acorns and climb trees." } },
  deer: { label: "deer", needs: { water: ["stream", "pond"], shelter: ["bush", "tree"], plants: ["grass", "acorns"] }, why: { water: "Deer drink from streams and ponds.", shelter: "Deer rest hidden among bushes and trees.", plants: "Deer graze on grass and eat acorns." } },
  fox: { label: "fox", needs: { water: ["stream", "pond", "puddle"], shelter: ["burrow", "cave"], plants: ["bush"] }, why: { water: "Foxes need water to drink.", shelter: "Foxes raise cubs in dens, like a burrow or a cave.", plants: "Bushes give foxes cover — and berries to eat." } }
};
/* Animals that live happily together (no hunters with the hunted). */
export const GROUPS: string[][] = [["duck", "frog"], ["duck", "turtle"], ["frog", "turtle"], ["duck", "frog", "turtle"], ["rabbit", "bee"], ["bee", "snail"], ["rabbit", "snail"], ["rabbit", "bee", "snail"], ["deer", "squirrel"], ["owl", "deer"], ["deer", "fox"], ["bee", "deer"]];

export function needsMet(animal: string, placed: string[]): Record<Need, string | null> {
  const a = ANIMALS[animal]; const out = {} as Record<Need, string | null>;
  NEEDS.forEach(n => { out[n] = a.needs[n].find(x => placed.includes(x)) || null; });
  return out;
}
export const suits = (animal: string, piece: string) => NEEDS.some(n => ANIMALS[animal].needs[n].includes(piece));
export function checkHabitat(animals: string[], placed: string[], slots: number) {
  const unmet = animals.flatMap(a => NEEDS.filter(n => !needsMet(a, placed)[n]).map(n => ({ animal: a, need: n })));
  const unused = Array.from(new Set(placed.filter(x => !animals.some(a => suits(a, x)))));
  return { ok: !unmet.length && !unused.length && placed.length <= slots, unmet, unused, over: placed.length > slots };
}
/** Fewest pieces that meet every need (brute force over small sets). */
export function minCover(animals: string[]): { size: number; examples: string[][] } {
  const pool = Object.keys(PIECES).filter(p => animals.some(a => suits(a, p)));
  for (let size = 1; size <= 9; size++) {
    const found: string[][] = [];
    const rec = (start: number, cur: string[]) => {
      if (found.length >= 50) return;
      if (cur.length === size) { if (checkHabitat(animals, cur, size).ok) found.push(cur.slice()); return; }
      for (let i = start; i < pool.length; i++) { cur.push(pool[i]); rec(i + 1, cur); cur.pop(); }
    };
    rec(0, []);
    if (found.length) return { size, examples: found };
  }
  return { size: 99, examples: [] };
}

/** Every different set of pieces (up to maxSize) that makes a complete home — the accepted answers. */
export function solutions(animals: string[], maxSize: number, limit = 200): string[][] {
  const pool = Object.keys(PIECES).filter(p => animals.some(a => suits(a, p)));
  const out: string[][] = [];
  const rec = (start: number, cur: string[]) => {
    if (out.length >= limit) return;
    if (cur.length && checkHabitat(animals, cur, maxSize).ok) out.push(cur.slice());
    if (cur.length === maxSize) return;
    for (let i = start; i < pool.length; i++) { cur.push(pool[i]); rec(i + 1, cur); cur.pop(); }
  };
  rec(0, []);
  return out;
}
export function habitatPrompt(mode: "easy" | "more" | "free", animals: string[]): Prompt {
  if (mode === "free") return { id: pid("hab"), mechanic: "habitat", kind: "free", graded: false, animals: [], slots: 12,
    instruction: "Free play: build any habitat you like. There are no wrong answers.", say: "Free play. Build any habitat you like. There are no wrong answers.",
    hints: ["Tap a piece, then tap a space. Tap a placed piece to take it away."], explanation: "What a habitat!", concepts: [], seen: ["habitat-needs"] };
  const names = animals.map(a => ANIMALS[a].label);
  const cover = minCover(animals);
  const slots = mode === "easy" ? 6 : cover.size + 1;
  return { id: pid("hab"), mechanic: "habitat", kind: mode, graded: true, animals, slots, minPieces: cover.size,
    instruction: mode === "easy" ? "Build a home for the " + names[0] + ": water, shelter, and plants." : "Make one home for the " + names.join(" and the ") + ". You have " + slots + " spaces, so some pieces must help more than one animal.",
    say: mode === "easy" ? "Build a home for the " + names[0] + ". It needs water, shelter, and plants." : "Make one home for the " + names.join(" and the ") + ". You have " + slots + " spaces.",
    hints: [mode === "easy" ? "Start with water. Which water would a " + names[0] + " like?" : "Look for a piece that more than one animal can use.",
      "One way that works: " + cover.examples[0].map(x => PIECES[x].label).join(", ") + "."],
    explanation: animals.map(a => ANIMALS[a].why.shelter).join(" "), concepts: ["habitat-needs"].concat(animals), seen: ["habitat-needs"].concat(animals) };
}
export function buildHabitat(mode: string, ctx: any): Prompt[] {
  if (mode === "free") return [habitatPrompt("free", [])];
  if (mode === "explore") return ctx.pick(Object.keys(ANIMALS).map(a => ({ cid: "hab:" + a, a })), 3).map((c: any) => Object.assign(habitatPrompt("easy", [c.a]), { cids: [c.cid] }));
  return ctx.pick(GROUPS.map(g => ({ cid: "habg:" + g.join("+"), g, topic: g.length })), 2, { spread: true }).map((c: any) => Object.assign(habitatPrompt("more", c.g), { cids: [c.cid] }));
}

// ------------------------------------------------------------------ Free play saves (own key, so the main save is never touched)
export const SAVE_KEY = "snakeExplorers.habitats";
export type Creation = { id: string; name: string; at: number; slots: (string | null)[] };
const memory: { list: Creation[] } = { list: [] };
export function loadCreations(store: Storage | null | undefined): { list: Creation[]; persistent: boolean } {
  try {
    if (!store) return { list: memory.list, persistent: false };
    const raw = store.getItem(SAVE_KEY); const d = raw ? JSON.parse(raw) : null;
    const list = d && Array.isArray(d.list) ? d.list.filter((c: any) => c && typeof c.id === "string" && Array.isArray(c.slots)) : [];
    return { list, persistent: true };
  } catch { return { list: memory.list, persistent: false }; }
}
export function saveCreations(store: Storage | null | undefined, list: Creation[]): boolean {
  memory.list = list;
  try { if (!store) return false; store.setItem(SAVE_KEY, JSON.stringify({ v: 1, list })); return true; } catch { return false; }
}

// ------------------------------------------------------------------ the scene
const ANIMAL_TOKENS = ["duck", "frog", "turtle", "snail", "rabbit", "bee", "owl", "squirrel", "deer", "fox"];
export function mountHabitat(stage: HTMLElement, api: Api): Mech {
  const p = api.prompt; const free = p.kind === "free"; const easy = p.kind === "easy";
  const slots: (string | null)[] = new Array(p.slots).fill(null);
  const undoStack: (string | null)[][] = [];
  let selected: string | null = null, done = false, tab: string = free ? "water" : "water";
  const missed = new Set<string>();
  const node = el(`<div class="habitat${free ? " free" : ""}">
    <div class="hab-top">
      ${free ? "" : `<div class="hab-who">${p.animals.map((a: string) => `<div class="hab-animal">${api.Art.item(a, "art", ANIMALS[a].label)}<ul class="hab-needs" data-a="${a}"></ul></div>`).join("")}</div>`}
    </div>
    <div class="hab-scene n${p.slots}" role="group" aria-label="Habitat spaces. Choose a piece, then a space.">
      <svg class="hab-bg" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="220" fill="#D7EEF7"/><circle cx="60" cy="40" r="20" fill="#FCE7A8"/><path d="M0 90C80 60 160 80 220 90S340 60 400 80V220H0z" fill="#B7DC94"/><path d="M0 130C90 110 200 125 260 132S360 118 400 124V220H0z" fill="#9CCF7E"/></svg>
      <div class="hab-slots"></div>
    </div>
    <div class="hab-palette">
      <div class="hab-tabs" role="tablist" aria-label="Kinds of piece"></div>
      <div class="hab-pieces" role="group"></div>
    </div>
    <div class="hab-tools">
      <button type="button" class="btn ghost hab-undo">${icon("undo")}<span>Undo</span></button>
      <button type="button" class="btn ghost hab-clear">${icon("trash")}<span>Clear</span></button>
      ${free ? `<button type="button" class="btn ghost hab-save">${icon("star")}<span>Save</span></button><button type="button" class="btn primary hab-done">${icon("check")}<span>Finished</span></button>` : p.kind === "more" ? `<button type="button" class="btn primary hab-check">${icon("check")}<span>Check the home</span></button>` : ""}
    </div>
    ${free ? `<div class="hab-saved"><h2 class="hab-saved-h">Saved habitats</h2><p class="hab-save-note sub"></p><ul class="hab-saved-list"></ul></div>` : ""}
  </div>`);
  stage.appendChild(node);
  const slotBox = node.querySelector(".hab-slots") as HTMLElement, tabsEl = node.querySelector(".hab-tabs") as HTMLElement, piecesEl = node.querySelector(".hab-pieces") as HTMLElement;
  const capOn = api.captions();
  const label = (id: string) => PIECES[id] ? PIECES[id].label : ANIMALS[id] ? ANIMALS[id].label : id;
  const tabs: [string, string][] = [["water", "Water"], ["shelter", "Shelter"], ["plants", "Plants"]].concat(free ? [["animals", "Animals"]] : []) as [string, string][];

  function paintTabs() {
    tabsEl.innerHTML = "";
    tabs.forEach(([id, name]) => {
      const b = el(`<button type="button" role="tab" class="hab-tab${tab === id ? " on" : ""}" aria-selected="${tab === id}">${api.Art.item(id === "water" ? "pond" : id === "shelter" ? "burrow" : id === "plants" ? "flowers" : "rabbit", "art")}<span>${name}</span></button>`);
      b.addEventListener("click", () => { tab = id; paintTabs(); paintPieces(); });
      tabsEl.appendChild(b);
    });
  }
  const suggested = (id: string) => easy && p.animals.some((a: string) => { const met = needsMet(a, slots.filter(Boolean) as string[]); return NEEDS.some(n => !met[n] && ANIMALS[a].needs[n].includes(id)); });
  function paintPieces() {
    piecesEl.innerHTML = "";
    const ids = tab === "animals" ? ANIMAL_TOKENS : Object.keys(PIECES).filter(k => PIECES[k].cat === tab);
    piecesEl.setAttribute("aria-label", tab + " pieces");
    ids.forEach(id => {
      const b = el(`<button type="button" class="hab-piece${selected === id ? " on" : ""}${suggested(id) && api.helpLevel() >= 1 ? " glow" : ""}" aria-pressed="${selected === id}" data-piece="${id}">
        <span class="pic">${api.Art.item(id, "art")}</span>${capOn ? `<span class="lab">${esc(cap(label(id)))}</span>` : `<span class="sr-only">${esc(label(id))}</span>`}</button>`);
      b.addEventListener("click", () => { if (dragMoved) return; selected = selected === id ? null : id; api.sfx("tap"); paintPieces(); paintSlots(); });
      b.addEventListener("pointerdown", (e) => startDrag(e, id));
      piecesEl.appendChild(b);
    });
  }
  function paintSlots() {
    slotBox.innerHTML = "";
    slots.forEach((id, i) => {
      const b = el(`<button type="button" class="hab-slot${id ? " filled" : ""}${selected && !id ? " ready" : ""}" data-slot="${i}" aria-label="${id ? "Space " + (i + 1) + ": " + esc(label(id)) + ". Tap to take it away." : "Space " + (i + 1) + ": empty" + (selected ? ". Tap to place the " + esc(label(selected)) : "")}">
        ${id ? `<span class="pic">${api.Art.item(id, "art")}</span>` : `<span class="plus" aria-hidden="true">+</span>`}</button>`);
      b.addEventListener("click", () => tapSlot(i));
      slotBox.appendChild(b);
    });
    if (!free) paintNeeds();
    (node.querySelector(".hab-undo") as HTMLButtonElement).disabled = !undoStack.length || done;
    (node.querySelector(".hab-clear") as HTMLButtonElement).disabled = !slots.some(Boolean) || done;
  }
  function paintNeeds() {
    p.animals.forEach((a: string) => {
      const ul = node.querySelector(`.hab-needs[data-a="${a}"]`) as HTMLElement; const met = needsMet(a, slots.filter(Boolean) as string[]);
      ul.innerHTML = NEEDS.map(n => `<li class="${met[n] ? "ok" : ""}" aria-label="${n}: ${met[n] ? "done" : "still needed"}">${api.Art.item(met[n] || (n === "water" ? "pond" : n === "shelter" ? "burrow" : "flowers"), "art")}<span>${cap(n)}</span>${met[n] ? icon("check") : ""}</li>`).join("");
    });
  }
  function snapshot() { undoStack.push(slots.slice()); if (undoStack.length > 50) undoStack.shift(); }
  function place(i: number, id: string) {
    if (done) return;
    if (easy && !suits(p.animals[0], id) && !ANIMALS[id]) {
      api.sfx("retry");
      const text = "A " + label(id) + " isn't something a " + ANIMALS[p.animals[0]].label + " needs. Try another piece.";
      if (!missed.has(id)) { missed.add(id); api.miss({ text, noAuto: true }); } else api.feedback({ kind: "info", text, mood: "think" });
      return;
    }
    snapshot(); slots[i] = id; api.sfx("pick"); selected = null;
    paintPieces(); paintSlots();
    if (easy) {
      const r = checkHabitat(p.animals, slots.filter(Boolean) as string[], p.slots);
      const met = needsMet(p.animals[0], slots.filter(Boolean) as string[]);
      const need = NEEDS.find(n => met[n] === id);
      if (need) api.feedback({ kind: "info", text: ANIMALS[p.animals[0]].why[need], mood: "happy" });
      if (r.ok) win();
    }
    if (free) api.feedback({ kind: "info", text: cap(label(id)) + " added.", mood: "happy" });
  }
  function tapSlot(i: number) {
    if (done) return;
    if (selected) { if (slots[i]) { snapshot(); slots[i] = null; } place(i, selected); return; }
    if (slots[i]) { snapshot(); const was = slots[i]; slots[i] = null; api.sfx("tap"); paintSlots(); paintPieces(); api.feedback({ kind: "info", text: cap(label(was!)) + " taken away.", mood: "idle" }); return; }
    api.feedback({ kind: "info", text: "First choose a piece below, then tap a space.", mood: "idle" });
  }
  function check() {
    if (done) return;
    const r = checkHabitat(p.animals, slots.filter(Boolean) as string[], p.slots);
    if (r.ok) { win(); return; }
    api.sfx("retry");
    const parts = r.unmet.map(u => "the " + ANIMALS[u.animal].label + " still needs " + u.need).concat(r.unused.map(x => "nobody here uses the " + label(x)));
    api.miss({ text: cap(parts.slice(0, 3).join("; ")) + "." });
  }
  function win() {
    done = true; api.sfx("right"); api.practiced(p.concepts || []); api.solved();
    node.classList.add("won");
    const used = slots.filter(Boolean).length;
    api.feedback({ kind: "right", text: "Home sweet home! " + p.explanation + (p.kind === "more" ? " (You used " + used + " " + (used === 1 ? "piece" : "pieces") + ".)" : ""), mood: "cheer" });
    paintSlots(); api.next();
  }
  function undo() { const prev = undoStack.pop(); if (!prev || done) return; prev.forEach((v, i) => { slots[i] = v; }); api.sfx("tap"); paintSlots(); paintPieces(); }
  function clearAll() { if (done || !slots.some(Boolean)) return; snapshot(); slots.fill(null); paintSlots(); paintPieces(); }

  // drag as an optional extra: drop a palette piece on a space
  let dragMoved = false, ghost: HTMLElement | null = null;
  function startDrag(e: PointerEvent, id: string) {
    if (done || e.button > 0) return;
    const sx = e.clientX, sy = e.clientY; dragMoved = false;
    const mv = (ev: PointerEvent) => {
      if (!dragMoved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 12) return;
      if (!dragMoved) { dragMoved = true; ghost = el(`<div class="hab-ghost">${api.Art.item(id, "art")}</div>`); document.body.appendChild(ghost); }
      ghost!.style.left = ev.clientX + "px"; ghost!.style.top = ev.clientY + "px";
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up);
      if (ghost) { ghost.remove(); ghost = null; }
      if (dragMoved) {
        const t = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        const s = t && t.closest("[data-slot]") as HTMLElement | null;
        if (s) { const i = +s.dataset.slot!; if (slots[i]) { snapshot(); slots[i] = null; } place(i, id); }
        setTimeout(() => { dragMoved = false; }, 0);
      }
    };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
  }

  // free play saves
  function paintSaved() {
    if (!free) return;
    const { list, persistent } = loadCreations(api.store);
    (node.querySelector(".hab-save-note") as HTMLElement).textContent = persistent ? "Saved on this device only." : "Saving isn't available here, so saved habitats last until this page closes.";
    const ul = node.querySelector(".hab-saved-list") as HTMLElement; ul.innerHTML = list.length ? "" : `<li class="sub">Nothing saved yet.</li>`;
    list.forEach(c => {
      const li = el(`<li class="hab-saved-item"><span class="hs-pics">${c.slots.filter(Boolean).slice(0, 4).map(x => api.Art.item(x!, "art")).join("")}</span><span class="hs-name">${esc(c.name)}</span>
        <button type="button" class="btn small ghost hs-load">${icon("refresh")}<span>Open</span></button><button type="button" class="btn small ghost hs-del" aria-label="Delete ${esc(c.name)}">${icon("trash")}</button></li>`);
      li.querySelector(".hs-load")!.addEventListener("click", () => { snapshot(); c.slots.slice(0, slots.length).forEach((v, i) => { slots[i] = v && (PIECES[v] || ANIMALS[v]) ? v : null; }); paintSlots(); api.feedback({ kind: "info", text: c.name + " is back.", mood: "happy" }); });
      li.querySelector(".hs-del")!.addEventListener("click", () => { saveCreations(api.store, loadCreations(api.store).list.filter(x => x.id !== c.id)); paintSaved(); });
      ul.appendChild(li);
    });
  }
  function saveNow() {
    if (!slots.some(Boolean)) { api.feedback({ kind: "info", text: "Add a piece first, then save.", mood: "idle" }); return; }
    const { list } = loadCreations(api.store);
    const c: Creation = { id: "h" + Date.now().toString(36), name: "Habitat " + (list.length + 1), at: Date.now(), slots: slots.slice() };
    const ok = saveCreations(api.store, [c].concat(list).slice(0, 8));
    api.sfx("right"); api.feedback({ kind: "info", text: ok ? c.name + " saved on this device." : c.name + " kept until this page closes (saving is blocked here).", mood: "happy" });
    paintSaved();
  }

  node.querySelector(".hab-undo")!.addEventListener("click", undo);
  node.querySelector(".hab-clear")!.addEventListener("click", clearAll);
  const cb = node.querySelector(".hab-check"); if (cb) cb.addEventListener("click", check);
  const sb = node.querySelector(".hab-save"); if (sb) sb.addEventListener("click", saveNow);
  const db = node.querySelector(".hab-done"); if (db) db.addEventListener("click", () => { if (done) return; done = true; node.classList.add("won"); api.seen(["habitat-needs"]); api.complete([{ ungraded: true }], "What a habitat! Free play has no wrong answers."); });
  paintTabs(); paintPieces(); paintSlots(); paintSaved();
  return {
    onKey(e) { if (e.key === "Escape" && selected) { selected = null; paintPieces(); paintSlots(); return true; } if ((e.key === "z" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); undo(); return true; } return false; },
    showHelp() {
      if (free) return false;
      const placed = slots.filter(Boolean) as string[];
      for (const a of p.animals) { const met = needsMet(a, placed); const n = NEEDS.find(x => !met[x]); if (n) { tab = PIECES[ANIMALS[a].needs[n][0]].cat; paintTabs(); paintPieces(); piecesEl.querySelectorAll(`[data-piece="${ANIMALS[a].needs[n][0]}"]`).forEach(x => x.classList.add("glow")); return true; } }
      return false;
    },
    destroy() { done = true; if (ghost) ghost.remove(); },
    debug: () => ({ slots: slots.slice(), selected, done, animals: p.animals, kind: p.kind })
  };
}
