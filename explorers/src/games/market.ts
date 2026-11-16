/* market.ts — Little Market (Number Meadow). Pretend shopping only: play
 * coins with numbers, nothing is ever bought.
 *   Easy: a picture list of two things; tap them on the stall to fill the basket.
 *   More challenge: exact quantities shown as pictures, a small coin budget
 *   (pay with the exact coins), or a sold-out item with a sensible swap shown
 *   on the list. Tap the basket to take one out; Undo steps back. */
import { type Api, type Mech, type Prompt, el, esc, icon, cap, shuffle, sample, pick, int, pid } from "./kit.ts";

export const GOODS: Record<string, { name: string; plural: string; price: number }> = {
  apple: { name: "apple", plural: "apples", price: 1 }, banana: { name: "banana", plural: "bananas", price: 1 }, pear: { name: "pear", plural: "pears", price: 2 },
  carrot: { name: "carrot", plural: "carrots", price: 1 }, corn: { name: "corn", plural: "corn cobs", price: 2 }, tomato: { name: "tomato", plural: "tomatoes", price: 1 },
  lemon: { name: "lemon", plural: "lemons", price: 1 }, peas: { name: "peas", plural: "bags of peas", price: 2 }, milk: { name: "milk", plural: "milk cartons", price: 3 },
  "eggs-box": { name: "box of eggs", plural: "boxes of eggs", price: 4 }, bread: { name: "bread", plural: "loaves of bread", price: 2 }, cherries: { name: "cherries", plural: "bags of cherries", price: 3 },
  watermelon: { name: "watermelon", plural: "watermelons", price: 5 }, potato: { name: "potato", plural: "potatoes", price: 1 }, broccoli: { name: "broccoli", plural: "broccoli", price: 2 },
  strawberry: { name: "strawberry", plural: "strawberries", price: 2 }, orange: { name: "orange", plural: "oranges", price: 2 }, peach: { name: "peach", plural: "peaches", price: 2 }
};
/** Sensible swaps: similar food that does the same job. */
export const SUBS: Record<string, string> = { apple: "pear", pear: "apple", strawberry: "cherries", cherries: "strawberry", broccoli: "peas", peas: "broccoli", orange: "peach", peach: "orange", potato: "carrot", carrot: "potato" };
export type Line = { art: string; qty: number; swap?: string };
export type Basket = Record<string, number>;
export const COINS = [1, 2, 5];
const total = (b: Basket) => Object.entries(b).reduce((t, [a, n]) => t + GOODS[a].price * n, 0);
export const basketTotal = total;
const noun = (a: string, n: number) => n === 1 ? GOODS[a].name : GOODS[a].plural;

/** What the basket must hold: a sold-out item is replaced by its swap. */
export function required(p: { list?: Line[]; soldOut?: string | null; [k: string]: any }): Basket {
  const out: Basket = {};
  (p.list as Line[]).forEach(l => { const a = p.soldOut === l.art && l.swap ? l.swap : l.art; out[a] = (out[a] || 0) + l.qty; });
  return out;
}
export function checkBasket(p: { list?: Line[]; soldOut?: string | null; [k: string]: any }, b: Basket) {
  const need = required(p);
  const missing: { art: string; n: number }[] = [], extra: { art: string; n: number }[] = [];
  for (const [a, n] of Object.entries(need)) { const have = b[a] || 0; if (have < n) missing.push({ art: a, n: n - have }); if (have > n) extra.push({ art: a, n: have - n }); }
  for (const [a, n] of Object.entries(b)) if (n > 0 && !(a in need)) extra.push({ art: a, n });
  return { ok: !missing.length && !extra.length, missing, extra };
}
/** Can these coins pay exactly this amount? (subset sum) */
export function canPayExactly(purse: number[], amount: number): boolean {
  let reach = new Set([0]);
  for (const c of purse) { const nx = new Set(reach); reach.forEach(v => nx.add(v + c)); reach = nx; }
  return reach.has(amount);
}

export function marketPrompt(kind: "easy" | "qty" | "budget" | "swap", rand: () => number): Prompt | null {
  const all = Object.keys(GOODS);
  let list: Line[] = [], soldOut: string | null = null, purse: number[] | null = null;
  if (kind === "easy") list = sample(all, 2, rand).map(a => ({ art: a, qty: 1 }));
  else if (kind === "qty") list = sample(all.filter(a => GOODS[a].price <= 2), 2, rand).map(a => ({ art: a, qty: int(rand, 2, 4) }));
  else if (kind === "budget") {
    list = sample(all.filter(a => GOODS[a].price <= 3), 2, rand).map(a => ({ art: a, qty: int(rand, 1, 2) }));
    const t = list.reduce((s, l) => s + GOODS[l.art].price * l.qty, 0);
    if (t > 10 || t < 3) return null;
    // a small purse that can pay exactly, with a little left over
    purse = shuffle([5, 2, 2, 1, 1, 1], rand).slice(0, int(rand, 4, 6)).sort((a, b) => b - a);
    const sum = purse.reduce((a, b) => a + b, 0);
    if (sum < t || !canPayExactly(purse, t)) return null;
  } else {
    const withSwap = all.filter(a => SUBS[a]);
    const first = pick(withSwap, rand);
    const second = pick(all.filter(a => a !== first && a !== SUBS[first]), rand);
    list = shuffle([{ art: first, qty: int(rand, 1, 3), swap: SUBS[first] }, { art: second, qty: int(rand, 1, 2) }], rand);
    soldOut = first;
  }
  const need = required({ list, soldOut });
  const shelf = shuffle(Array.from(new Set(Object.keys(need).concat(list.map(l => l.art), sample(all.filter(a => !(a in need)), kind === "easy" ? 3 : 4, rand)))), rand);
  const say = kind === "easy" ? "Fill the basket. Get one " + list.map(l => GOODS[l.art].name).join(" and one ") + "."
    : kind === "swap" ? "Fill the basket from the list. One thing is sold out, so get the swap shown on the list."
    : kind === "budget" ? "Fill the basket from the list, then pay with the exact coins."
    : "Get exactly the right number of each thing on the list.";
  return {
    id: pid("shop"), mechanic: "market", graded: true, kind, list, soldOut, purse, shelf, need, cost: total(need),
    instruction: say, say,
    hints: [kind === "budget" ? "Count the coins on each price tag." : "Look at the list: how many of each picture?",
      "You need " + Object.entries(need).map(([a, n]) => n + " " + noun(a, n)).join(" and ") + "."],
    explanation: kind === "budget" ? "Everything on the list, paid with exactly " + total(need) + " coins." : "The basket matches the list!",
    concepts: ["market"].concat(kind === "budget" ? ["coins"] : []), seen: ["market"].concat(kind === "budget" ? ["coins"] : [])
  };
}
export const listKey = (p: Prompt) => p.kind + ":" + p.list.map((l: Line) => l.art + "x" + l.qty).sort().join(",") + (p.soldOut ? ":no-" + p.soldOut : "");
export function buildMarket(mode: string, ctx: any): Prompt[] {
  const kinds: ("easy" | "qty" | "budget" | "swap")[] = mode === "explore" ? ["easy", "easy", "easy"] : shuffle(["qty", "budget", "swap"] as ("qty" | "budget" | "swap")[], ctx.rand);
  return kinds.map(kind => ctx.generate((r: () => number) => { const p = marketPrompt(kind, r); return p && Object.assign(p, { cid: "shop:" + listKey(p), topic: kind }); }, 1, { tries: 80 })[0])
    .filter(Boolean).map((p: any) => Object.assign(p, { cids: [p.cid] }));
}

// ------------------------------------------------------------------ the stall
export function mountMarket(stage: HTMLElement, api: Api): Mech {
  const p = api.prompt;
  const basket: Basket = {}; const history: { op: "add" | "remove"; art: string }[] = [];
  let phase: "shop" | "pay" | "done" = "shop"; let paid: number[] = []; let checkedOnce = false;
  const priced = p.kind === "budget";
  const coinRow = (n: number) => { const out: string[] = []; let left = n; for (const c of [5, 2, 1]) while (left >= c) { out.push(c === 1 ? "coin-1" : c === 2 ? "coin-2" : "coin-5"); left -= c; } return out; };
  const node = el(`<div class="market">
    <div class="mk-list" aria-label="Shopping list">
      <h2 class="mk-h">${icon("check")}<span>List</span></h2><ul class="mk-lines"></ul>
    </div>
    <div class="mk-stall">
      <div class="mk-awning" aria-hidden="true"></div>
      <div class="mk-shelf" role="group" aria-label="Market stall. Tap something to put it in the basket."></div>
    </div>
    <div class="mk-basket-wrap">
      <div class="mk-basket" aria-live="polite" aria-label="Basket"></div>
      <div class="mk-tools">
        <button type="button" class="btn ghost mk-undo">${icon("undo")}<span>Undo</span></button>
        <button type="button" class="btn primary mk-check">${icon("check")}<span>${priced ? "Go to pay" : "Done shopping"}</span></button>
      </div>
      <div class="mk-pay" hidden></div>
    </div>
  </div>`);
  stage.appendChild(node);
  const lines = node.querySelector(".mk-lines") as HTMLElement, shelf = node.querySelector(".mk-shelf") as HTMLElement, bEl = node.querySelector(".mk-basket") as HTMLElement, payEl = node.querySelector(".mk-pay") as HTMLElement;
  const capOn = api.captions();
  // list: pictures repeated for quantity, so no reading is needed
  (p.list as Line[]).forEach(l => {
    const pics = Array.from({ length: l.qty }, () => api.Art.item(l.art, "art")).join("");
    const swap = l.swap && p.soldOut === l.art ? `<span class="mk-or">or</span><span class="mk-qty swap">${Array.from({ length: l.qty }, () => api.Art.item(l.swap!, "art")).join("")}</span>` : "";
    lines.appendChild(el(`<li class="${l.swap && p.soldOut === l.art ? "has-swap" : ""}" aria-label="${l.qty} ${esc(noun(l.art, l.qty))}${swap ? ", or " + l.qty + " " + esc(noun(l.swap!, l.qty)) + " if sold out" : ""}"><span class="mk-qty">${pics}</span><span class="mk-n">${l.qty}</span>${swap}</li>`));
  });
  (p.shelf as string[]).forEach(a => {
    const out = p.soldOut === a;
    const b = el(`<button type="button" class="mk-item${out ? " sold-out" : ""}" data-art="${a}" aria-label="${esc(cap(GOODS[a].name))}${priced ? ", costs " + GOODS[a].price + (GOODS[a].price === 1 ? " coin" : " coins") : ""}${out ? ", sold out" : ""}">
      <span class="pic">${api.Art.item(a, "art")}</span>${capOn ? `<span class="lab">${esc(cap(GOODS[a].name))}</span>` : ""}
      ${priced ? `<span class="mk-price">${coinRow(GOODS[a].price).map(c => api.Art.item(c, "coin")).join("")}</span>` : ""}
      ${out ? `<span class="mk-sold">Sold out</span>` : ""}</button>`);
    b.addEventListener("click", () => add(a));
    shelf.appendChild(b);
  });
  function paintBasket() {
    const entries = Object.entries(basket).filter(([, n]) => n > 0);
    bEl.innerHTML = (entries.length ? entries.map(([a, n]) => Array.from({ length: n }, () =>
      `<button type="button" class="mk-in" data-art="${a}" aria-label="Take out one ${esc(GOODS[a].name)}">${api.Art.item(a, "art")}</button>`).join("")).join("") : `<span class="mk-empty">Basket is empty</span>`) +
      (priced ? `<span class="mk-total">Total: <b>${total(basket)}</b> ${total(basket) === 1 ? "coin" : "coins"}</span>` : "");
    bEl.querySelectorAll<HTMLButtonElement>(".mk-in").forEach(b => b.addEventListener("click", () => remove(b.dataset.art!)));
    (node.querySelector(".mk-undo") as HTMLButtonElement).disabled = !history.length || phase !== "shop";
    (node.querySelector(".mk-check") as HTMLButtonElement).disabled = !entries.length || phase !== "shop";
  }
  function add(a: string) {
    if (phase !== "shop") return;
    if (p.soldOut === a) { api.feedback({ kind: "info", text: "Sold out! Check the list for a swap.", mood: "think" }); api.sfx("tap"); return; }
    basket[a] = (basket[a] || 0) + 1; history.push({ op: "add", art: a }); api.sfx("pick"); api.clip("word-" + a); paintBasket();
  }
  function remove(a: string, fromUndo = false) {
    if (phase !== "shop" || !basket[a]) return;
    basket[a]--; if (!fromUndo) history.push({ op: "remove", art: a }); api.sfx("tap"); paintBasket();
  }
  function undo() {
    const h = history.pop(); if (!h || phase !== "shop") return;
    if (h.op === "add") remove(h.art, true); else { basket[h.art] = (basket[h.art] || 0) + 1; paintBasket(); }
  }
  function check() {
    if (phase !== "shop") return;
    const r = checkBasket(p, basket);
    if (!r.ok) {
      const parts = r.missing.map(m => "one more " + GOODS[m.art].name + (m.n > 1 ? " (" + m.n + " more)" : "")).concat(r.extra.map(x => (p.soldOut && x.art === p.soldOut ? "" : "") + "fewer " + noun(x.art, 2)));
      api.sfx("retry");
      if (!checkedOnce) { checkedOnce = true; api.miss({ text: "Not quite. Look again: you need " + parts.join(", and ") + "." }); }
      else api.feedback({ kind: "wrong", text: "Almost: " + parts.join(", and ") + ".", mood: "think" });
      return;
    }
    if (priced) { phase = "pay"; startPay(); return; }
    win();
  }
  function startPay() {
    paintBasket();
    payEl.hidden = false;
    const purse: number[] = p.purse.slice(); const used = new Array(purse.length).fill(false);
    const draw = () => {
      const sum = paid.reduce((a, b) => a + b, 0);
      payEl.innerHTML = `<p class="mk-pay-h">Pay <b>${p.cost}</b> ${p.cost === 1 ? "coin" : "coins"}. Tap coins from your purse.</p>
        <div class="mk-purse" role="group" aria-label="Your purse">${purse.map((c, i) => `<button type="button" class="mk-coin" data-i="${i}" ${used[i] ? "disabled" : ""} aria-label="${c} coin${c > 1 ? "s" : ""}">${api.Art.item("coin-" + c, "coin")}</button>`).join("")}</div>
        <div class="mk-tray" aria-live="polite">${paid.map((c, i) => `<button type="button" class="mk-coin in" data-j="${i}" aria-label="Take back a ${c}">${api.Art.item("coin-" + c, "coin")}</button>`).join("")}<span class="mk-sum">Paying: <b>${sum}</b></span></div>`;
      payEl.querySelectorAll<HTMLButtonElement>("[data-i]").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i!; used[i] = true; paid.push(purse[i]); (paidIdx as number[]).push(i); api.sfx("tap"); draw(); settle(); }));
      payEl.querySelectorAll<HTMLButtonElement>("[data-j]").forEach(b => b.addEventListener("click", () => { const j = +b.dataset.j!; used[(paidIdx as number[])[j]] = false; paid.splice(j, 1); (paidIdx as number[]).splice(j, 1); draw(); }));
    };
    const paidIdx: number[] = [];
    const settle = () => {
      const sum = paid.reduce((a, b) => a + b, 0);
      if (sum === p.cost) { phase = "done"; win(); }
      else if (sum > p.cost) { api.sfx("retry"); api.feedback({ kind: "wrong", text: "That's " + sum + " — more than " + p.cost + ". Tap a coin in the tray to take it back.", mood: "think" }); }
    };
    api.feedback({ kind: "info", text: "Everything's in the basket! Now pay exactly " + p.cost + ".", mood: "happy" });
    draw();
  }
  function win() {
    phase = "done"; api.sfx("right"); api.practiced(p.concepts || []); api.solved();
    node.classList.add("won"); paintBasket();
    api.feedback({ kind: "right", text: p.explanation, mood: "cheer" }); api.clip("prompt-well-done"); api.next();
  }
  node.querySelector(".mk-undo")!.addEventListener("click", undo);
  node.querySelector(".mk-check")!.addEventListener("click", check);
  paintBasket();
  return {
    onKey(e) { if ((e.key === "z" && (e.ctrlKey || e.metaKey)) || e.key === "Backspace") { e.preventDefault(); undo(); return true; } return false; },
    showHelp() {
      if (api.helpLevel() < 2) return false;
      const need = required(p); const r = checkBasket(p, basket);
      const m = r.missing[0]; if (!m) return false;
      const b = shelf.querySelector(`[data-art="${m.art}"]`); if (b) b.classList.add("glow");
      return !!need;
    },
    destroy() { phase = "done"; },
    debug: () => ({ basket: { ...basket }, phase, need: required(p), cost: p.cost, purse: p.purse, paid: paid.slice() })
  };
}
