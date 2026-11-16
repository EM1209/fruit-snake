/* Drives each mechanic the way a child would (clicks, taps, key presses), using the
 * page's read-only debug view only to know which answer is right. */
import { type Page, expect } from "@playwright/test";
import { SE } from "./helpers.ts";
import { solutions } from "../src/games/habitat.ts";

const DIRV: Record<string, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function route(from: { x: number; y: number }, to: { x: number; y: number }) {
  const out: string[] = [];
  for (let x = from.x; x !== to.x; x += Math.sign(to.x - from.x)) out.push(to.x > from.x ? "right" : "left");
  for (let y = from.y; y !== to.y; y += Math.sign(to.y - from.y)) out.push(to.y > from.y ? "down" : "up");
  return out;
}

export async function wrongThenRight(page: Page): Promise<void> {
  const p = await SE(page).prompt();
  const m = await SE(page).mech();
  if (p.mechanic === "safari" || p.mechanic === "listenfind") {
    const wrong = p.options.find((o: any) => !m.valid.includes(o.id));
    await page.locator(`.pcard[data-id="${wrong.id}"] .pcard-main`).click();
    await expect(page.locator("#feedback")).toHaveClass(/fb-wrong/);
  } else if (p.mechanic === "detect") {
    const wrong = p.spots.find((s: any) => s.animal !== p.target);
    await page.locator(`[data-spot="${wrong.id}"]`).click();
    await expect(page.locator("#feedback")).toHaveClass(/fb-wrong/);
  } else if (p.mechanic === "predict") {
    for (let y = 0; y < p.level.h; y++) for (let x = 0; x < p.level.w; x++) {
      if ((x !== p.answer.x || y !== p.answer.y) && (x !== p.level.start.x || y !== p.level.start.y)) { await page.locator(`.pcell-btn[data-x="${x}"][data-y="${y}"]`).click(); await expect(page.locator("#feedback")).toHaveClass(/fb-wrong/); return solve(page); }
    }
  }
  await solve(page);
}

export async function solve(page: Page): Promise<void> {
  const p = await SE(page).prompt();
  const m = await SE(page).mech();
  switch (p.mechanic) {
    case "safari": case "listenfind":
      await page.locator(`.pcard[data-id="${m.valid[0]}"] .pcard-main`).click(); break;
    case "detect":
      await page.locator(`[data-spot="${p.spots.find((s: any) => s.animal === p.target).id}"]`).click(); break;
    case "predict":
      await page.locator(`.pcell-btn[data-x="${p.answer.x}"][data-y="${p.answer.y}"]`).click(); break;
    case "rescue": {
      for (const d of m.solution) {
        const before = (await SE(page).mech()).state.moves;
        await page.keyboard.press({ up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[d as "up"]);
        expect((await SE(page).mech()).state.moves).toBe(before + 1);    // exactly one step per press
      }
      break;
    }
    case "market": {
      for (const [art, n] of Object.entries(m.need as Record<string, number>)) for (let i = 0; i < n; i++) await page.locator(`.mk-item[data-art="${art}"]`).click();
      await page.locator(".mk-check").click();
      if (p.kind === "budget") {
        // pick coins that add up exactly
        const purse: number[] = m.purse; let best: number[] | null = null;
        const rec = (i: number, sum: number, used: number[]) => { if (best) return; if (sum === m.cost) { best = used.slice(); return; } if (i >= purse.length || sum > m.cost) return; rec(i + 1, sum + purse[i], used.concat(i)); rec(i + 1, sum, used); };
        rec(0, 0, []);
        for (const i of best!) await page.locator(`.mk-coin[data-i="${i}"]`).click();
      }
      break;
    }
    case "habitat": {
      if (p.kind === "free") { await page.locator(".hab-done").click(); break; }
      const set = p.kind === "easy" ? null : solutions(p.animals, p.slots)[0];
      const pieces: string[] = set || (await page.evaluate((a) => { const H = (window as any).__habNeeds; return H; }, p.animals[0])) || [];
      const want = set || await easyPieces(page, p.animals[0]);
      let slot = 0;
      for (const piece of want) await placePiece(page, piece, slot++);
      void pieces;
      if (p.kind === "more") await page.locator(".hab-check").click();
      break;
    }
    case "sequence": {
      for (const v of p.answers[0]) {
        const t = p.tiles.find((t: any) => t.value === v && true);
        await page.locator(`.pool .tile[data-id="${t.id}"]`).click();
      }
      if (await page.locator(".sequence .check").isEnabled()) await page.locator(".sequence .check").click();
      break;
    }
    case "plan": {
      const lv = p.level;
      const prog = lv.rocks.length || lv.key ? null : route(lv.start, lv.goal);
      if (!prog) throw new Error("plan solver only handles open boards");
      for (const d of prog) await page.locator(`[data-add="${d}"]`).click();
      await page.locator(".plan .run").click();
      await expect(page.locator("#nextBtn")).toBeVisible({ timeout: 15_000 });
      return;
    }
    default: throw new Error("no solver for " + p.mechanic);
  }
  await expect(page.locator("#nextBtn")).toBeVisible({ timeout: 10_000 });
}

const NEED_FIRST: Record<string, string[]> = {
  duck: ["pond", "reeds", "grass"], frog: ["pond", "log", "lilypad"], turtle: ["pond", "log", "lilypad"], snail: ["puddle", "log", "grass"], rabbit: ["puddle", "burrow", "grass"],
  bee: ["puddle", "hive", "flowers"], owl: ["stream", "hollowtree", "tree"], squirrel: ["stream", "hollowtree", "acorns"], deer: ["stream", "bush", "grass"], fox: ["stream", "burrow", "bush"]
};
async function easyPieces(_page: Page, animal: string) { return NEED_FIRST[animal]; }
const CAT: Record<string, string> = { pond: "Water", stream: "Water", puddle: "Water", nest: "Shelter", log: "Shelter", rock: "Shelter", burrow: "Shelter", hollowtree: "Shelter", hive: "Shelter", cave: "Shelter", leafpile: "Shelter",
  grass: "Plants", flowers: "Plants", lilypad: "Plants", reeds: "Plants", tree: "Plants", bush: "Plants", acorns: "Plants" };
export async function placePiece(page: Page, piece: string, slot: number) {
  await page.locator(".hab-tab", { hasText: CAT[piece] || "Animals" }).click();
  await page.locator(`.hab-piece[data-piece="${piece}"]`).click();
  await page.locator(`[data-slot="${slot}"]`).click();
}

/** Play a whole round to the results screen. */
export async function playRound(page: Page, id: string, mode: string, opts: { wrongFirst?: boolean } = {}) {
  await SE(page).start(id, mode);
  await expect(page.locator("#scr-play")).toBeVisible();
  for (let i = 0; i < 12; i++) {
    const st = await SE(page).state();
    if (i === 0 && opts.wrongFirst) await wrongThenRight(page); else await solve(page);
    const last = st.round.i >= st.round.n - 1;
    await page.locator("#nextBtn").click();
    if (last && (await SE(page).state()).screen === "results") break;
  }
  await expect(page.locator("#scr-results")).toBeVisible();
}
export { DIRV };
