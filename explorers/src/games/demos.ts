/* demos.ts — "Show me" demonstrations for Easy rounds, and the Bug Hunt Easy
 * "tap where the snake stops" board.
 * A demo only moves when the child presses Show me (never by itself), always
 * uses a DIFFERENT example from the child's own task, and resets to its start
 * when it finishes, so the child then tries a similar task themselves. */
import { type Api, type Mech, el, esc, icon, DIRS, cap, wait } from "./kit.ts";

type Level = { w: number; h: number; start: { x: number; y: number }; rocks: number[][]; goal?: { x: number; y: number } };
const ARROW: Record<string, string> = { up: "up", down: "down", left: "left", right: "right" };

export function miniBoard(api: Api, lv: Level, cls = "") {
  const board = el(`<div class="mini-board ${cls}" style="--w:${lv.w};--h:${lv.h}" aria-hidden="true"></div>`);
  for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) board.appendChild(el(`<div class="mcell" style="grid-column:${x + 1};grid-row:${y + 1}"></div>`));
  lv.rocks.forEach(([x, y]) => board.appendChild(el(`<div class="mtok" style="grid-column:${x + 1};grid-row:${y + 1}">${api.Art.item("rock", "art")}</div>`)));
  if (lv.goal) board.appendChild(el(`<div class="mtok goal" style="grid-column:${lv.goal.x + 1};grid-row:${lv.goal.y + 1}">${api.Art.item("leaf", "art")}</div>`));
  const trail: HTMLElement[] = [];
  const snake = el(`<div class="mtok snake" style="grid-column:${lv.start.x + 1};grid-row:${lv.start.y + 1}">${api.Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood: "idle" })}</div>`);
  board.appendChild(snake);
  let pos = { ...lv.start };
  return {
    el: board,
    get pos() { return pos; },
    moveTo(x: number, y: number, mark = true) {
      if (mark) { const t = el(`<div class="mtok trail" style="grid-column:${pos.x + 1};grid-row:${pos.y + 1}"></div>`); board.insertBefore(t, snake); trail.push(t); }
      pos = { x, y }; snake.style.gridColumn = String(x + 1); snake.style.gridRow = String(y + 1);
    },
    reset() { trail.splice(0).forEach(t => t.remove()); pos = { ...lv.start }; snake.style.gridColumn = String(lv.start.x + 1); snake.style.gridRow = String(lv.start.y + 1); }
  };
}

/** A route demo: a small board and its arrows; the snake walks them one by one when Show me is pressed. */
export function routeDemo(api: Api, demo: { level: Level; program: string[] }, intro: string): { el: HTMLElement; play(): Promise<void>; isPlaying(): boolean; cancel(): void } {
  const lv = demo.level;
  const wrap = el(`<section class="demo" aria-label="Demonstration">
    <div class="demo-head"><span class="demo-badge">${icon("play")}Watch me</span><p class="demo-text">${esc(intro)}</p></div>
    <div class="demo-body"><div class="demo-board"></div><ol class="demo-prog" aria-label="Example arrows">${demo.program.map((d, i) => `<li data-i="${i}">${icon(d)}<span class="sr-only">${ARROW[d]}</span></li>`).join("")}</ol></div>
    <button type="button" class="btn demo-btn">${icon("play")}<span>Show me</span></button>
    <p class="demo-status sr-only" aria-live="polite"></p>
  </section>`);
  const mb = miniBoard(api, lv);
  wrap.querySelector(".demo-board")!.appendChild(mb.el);
  const btn = wrap.querySelector(".demo-btn") as HTMLButtonElement, status = wrap.querySelector(".demo-status") as HTMLElement;
  let playing = false, run = 0;
  async function play() {
    if (playing) return;
    playing = true; const my = ++run; btn.disabled = true; wrap.classList.add("playing");
    mb.reset(); status.textContent = "Watch: the snake follows each arrow.";
    await api.clip("prompt-watch-me");
    const ms = api.reducedMotion() ? 900 : 700;
    for (let i = 0; i < demo.program.length; i++) {
      if (my !== run) return;
      wrap.querySelectorAll(".demo-prog li").forEach((li, k) => li.classList.toggle("on", k === i));
      const d = DIRS[demo.program[i]]; mb.moveTo(mb.pos.x + d.x, mb.pos.y + d.y); api.sfx("step");
      await wait(ms);
    }
    if (my !== run) return;
    await wait(500);
    // reset: the demo returns to its start; the child's own board was never touched
    mb.reset(); wrap.querySelectorAll(".demo-prog li").forEach(li => li.classList.remove("on"));
    wrap.classList.remove("playing"); playing = false; btn.disabled = false;
    btn.querySelector("span")!.textContent = "Show me again";
    status.textContent = "Now it's your turn.";
    api.clip("prompt-your-turn");
  }
  btn.addEventListener("click", play);
  return { el: wrap, play, isPlaying: () => playing, cancel() { run++; playing = false; btn.disabled = false; mb.reset(); wrap.classList.remove("playing"); } };
}

/** A sequence demo: three example pictures slide into order, one at a time, then go back. */
export function sequenceDemo(api: Api, demo: { title: string; cards: { art: string; label: string }[] }): { el: HTMLElement; play(): Promise<void>; isPlaying(): boolean; cancel(): void } {
  const wrap = el(`<section class="demo seq-demo" aria-label="Demonstration">
    <div class="demo-head"><span class="demo-badge">${icon("play")}Watch me</span><p class="demo-text">${esc(demo.title)}</p></div>
    <div class="demo-body"><ol class="demo-slots">${demo.cards.map((_, i) => `<li class="dslot"><span class="slot-no">${i + 1}</span></li>`).join("")}</ol>
      <div class="demo-pool">${demo.cards.map((c, i) => `<span class="dcard" data-i="${i}">${api.Art.item(c.art, "art")}${api.captions() ? `<span class="lab">${esc(cap(c.label))}</span>` : ""}</span>`).join("")}</div></div>
    <button type="button" class="btn demo-btn">${icon("play")}<span>Show me</span></button>
    <p class="demo-status sr-only" aria-live="polite"></p>
  </section>`);
  const btn = wrap.querySelector(".demo-btn") as HTMLButtonElement, status = wrap.querySelector(".demo-status") as HTMLElement;
  const slots = Array.from(wrap.querySelectorAll<HTMLElement>(".dslot")), pool = wrap.querySelector(".demo-pool") as HTMLElement;
  const cards = Array.from(wrap.querySelectorAll<HTMLElement>(".dcard"));
  // shown scrambled in the pool to begin with
  const scrambled = [2, 0, 1];
  const reset = () => { scrambled.forEach(i => pool.appendChild(cards[i])); slots.forEach(s => s.classList.remove("filled")); };
  reset();
  let playing = false, run = 0;
  async function play() {
    if (playing) return;
    playing = true; const my = ++run; btn.disabled = true; wrap.classList.add("playing"); reset();
    status.textContent = "Watch: first, next, last.";
    await api.clip("prompt-watch-me");
    for (let i = 0; i < cards.length; i++) {
      if (my !== run) return;
      slots[i].appendChild(cards[i]); slots[i].classList.add("filled"); api.sfx("tap");
      api.speak(demo.cards[i].label);
      await wait(api.reducedMotion() ? 1100 : 1000);
    }
    if (my !== run) return;
    await wait(600);
    reset();
    wrap.classList.remove("playing"); playing = false; btn.disabled = false;
    btn.querySelector("span")!.textContent = "Show me again";
    status.textContent = "Now it's your turn.";
    api.clip("prompt-your-turn");
  }
  btn.addEventListener("click", play);
  return { el: wrap, play, isPlaying: () => playing, cancel() { run++; playing = false; btn.disabled = false; reset(); wrap.classList.remove("playing"); } };
}

/** Bug Hunt Easy: read 2–3 arrows, tap the square where the snake will stop. */
export function mountPredict(stage: HTMLElement, api: Api): Mech {
  const p = api.prompt, lv = p.level as Level;
  let done = false; const tried = new Set<string>();
  const demo = routeDemo(api, p.demo, "Here the snake follows " + p.demo.program.length + " arrows, one square each.");
  const node = el(`<div class="predict">
    <div class="pr-main">
      <ol class="pr-prog" aria-label="The arrows: ${p.program.map((d: string) => ARROW[d]).join(", ")}">${p.program.map((d: string) => `<li>${icon(d)}</li>`).join("")}</ol>
      <div class="pr-board" style="--w:${lv.w};--h:${lv.h}" role="grid" aria-label="Tap the square where the snake stops."></div>
    </div>
    <div class="pr-side"></div>
  </div>`);
  stage.appendChild(node);
  node.querySelector(".pr-side")!.appendChild(demo.el);
  const board = node.querySelector(".pr-board") as HTMLElement;
  for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
    const isStart = x === lv.start.x && y === lv.start.y;
    const b = el(`<button type="button" class="pcell-btn${isStart ? " start" : ""}" style="grid-column:${x + 1};grid-row:${y + 1}" data-x="${x}" data-y="${y}" aria-label="${isStart ? "The snake starts here" : "Square, column " + (x + 1) + ", row " + (y + 1)}">${isStart ? api.Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood: "idle" }) : ""}</button>`);
    b.addEventListener("click", () => choose(x, y, b));
    board.appendChild(b);
  }
  function showPath() {
    let q = { ...lv.start };
    p.program.forEach((d: string, i: number) => { q = { x: q.x + DIRS[d].x, y: q.y + DIRS[d].y }; const c = board.querySelector(`[data-x="${q.x}"][data-y="${q.y}"]`); if (c) { c.classList.add("path"); c.setAttribute("data-step", String(i + 1)); } });
  }
  function choose(x: number, y: number, b: HTMLElement) {
    if (done || demo.isPlaying()) return;
    if (x === lv.start.x && y === lv.start.y) { api.feedback({ kind: "info", text: "That's where the snake starts. Follow the arrows from here.", mood: "idle" }); return; }
    if (x === p.answer.x && y === p.answer.y) {
      done = true; b.classList.add("right"); b.innerHTML = api.Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood: "cheer" });
      showPath(); api.sfx("right"); api.practiced(p.concepts || []); api.solved();
      api.feedback({ kind: "right", text: p.explanation, mood: "cheer" }); api.next(); return;
    }
    api.sfx("retry"); b.classList.add("wrong"); setTimeout(() => b.classList.remove("wrong"), 700);
    const k = x + "," + y;
    if (!tried.has(k)) { tried.add(k); api.miss({}); }
  }
  return {
    showHelp() { if (api.helpLevel() >= 2) { showPath(); return true; } demo.play(); return true; },
    destroy() { done = true; demo.cancel(); },
    debug: () => ({ answer: p.answer, done, demoPlaying: demo.isPlaying() })
  };
}
