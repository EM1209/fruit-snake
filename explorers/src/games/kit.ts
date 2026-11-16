/* kit.ts — shared pieces for the Playful Worlds mechanics: the app API shape,
 * DOM helpers, picture cards with a "hear its name" button, and step input
 * (arrow keys, on-screen pad, swipe) that moves exactly one square per press. */

export type Prompt = Record<string, any> & { id: string; mechanic: string; instruction: string; hints: string[]; concepts?: string[] };
export interface Api {
  prompt: Prompt; mode: string; Art: any; look: any;
  reducedMotion(): boolean; isSeen(id: string): boolean;
  sfx(n: string): void; speak(t: string, o?: any): void;
  feedback(f: { kind?: string; text?: string; say?: string; mood?: string }): void;
  seen(ids: string[]): void; practiced(ids: string[]): void; solved(): void;
  helpLevel(): number; miss(o?: { text?: string; noAuto?: boolean }): void; next(o?: any): void;
  complete(results: any[], explanation?: string): void;
  clip(id: string): Promise<boolean>; chain(ids: string[], gap?: number): Promise<void>; stopAudio(): void;
  captions(): boolean; store?: Storage | null;
}
export interface Mech { onKey?(e: KeyboardEvent): boolean | void; showHelp?(): boolean; pause?(): void; resume?(): void; destroy?(): void; debug?(): any }

const UI = () => (window as any).SE_UI as { esc(s: any): string; el(h: string): HTMLElement; icon(n: string, l?: string): string; badge(ok: boolean, t?: string): string };
export const esc = (s: unknown) => UI().esc(s);
export const el = (h: string) => UI().el(h);
export const icon = (n: string, l?: string) => UI().icon(n, l);
export const badge = (ok: boolean, t?: string) => UI().badge(ok, t);
/** The clip that speaks a picture's name, or a device-voice fallback when no clip matches the label. */
export function hearFor(art: string, label: string): string {
  const C = (window as any).SE_Clips;
  return C && C.has("word-" + art) && C.textOf("word-" + art).toLowerCase() === label.toLowerCase() ? "word-" + art : "say:" + label;
}
export const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/** A big picture card. The whole card answers; a separate small button speaks its name. */
export function pictureCard(api: Api, o: { id: string; art: string; label: string; hear?: string | null; cls?: string }): HTMLElement {
  const capOn = api.captions();
  const node = el(`<div class="pcard ${o.cls || ""}" data-id="${esc(o.id)}">
    <button type="button" class="pcard-main" aria-label="${esc(cap(o.label))}"><span class="pic">${api.Art.item(o.art, "art")}</span>${capOn ? `<span class="lab">${esc(cap(o.label))}</span>` : ""}</button>
    ${o.hear ? `<button type="button" class="hear-name" aria-label="Hear the name: ${esc(o.label)}" title="Hear the name">${icon("speaker")}</button>` : ""}
  </div>`);
  const h = node.querySelector(".hear-name") as HTMLButtonElement | null;
  if (h && o.hear) h.addEventListener("click", (e) => {
    e.stopPropagation();
    if (o.hear!.startsWith("say:")) { api.speak(o.hear!.slice(4)); return; }
    api.clip(o.hear!).then(ok => { if (!ok) api.speak(o.label); });
  });
  return node;
}

/** One-step movement input. Calls move(dir) once per key press, pad tap, or swipe — never repeats on its own. */
export const DIRS: Record<string, { x: number; y: number }> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export function dpad(label: string): HTMLElement {
  return el(`<div class="dpad" role="group" aria-label="${esc(label)}">
    <button type="button" class="dir up" data-dir="up" aria-label="Step up">${icon("up")}</button>
    <button type="button" class="dir left" data-dir="left" aria-label="Step left">${icon("left")}</button>
    <span class="dpad-mid" aria-hidden="true"></span>
    <button type="button" class="dir right" data-dir="right" aria-label="Step right">${icon("right")}</button>
    <button type="button" class="dir down" data-dir="down" aria-label="Step down">${icon("down")}</button>
  </div>`);
}
export function bindSteps(pad: HTMLElement, board: HTMLElement, move: (d: string) => void): { onKey(e: KeyboardEvent): boolean } {
  pad.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach(b => b.addEventListener("click", () => move(b.dataset.dir!)));
  let sx = 0, sy = 0, active = false;
  board.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; active = true; });
  board.addEventListener("pointerup", (e) => {
    if (!active) return; active = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;            // a tap, not a swipe
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
  board.addEventListener("pointercancel", () => { active = false; });
  const map: Record<string, string> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
  return {
    onKey(e: KeyboardEvent) {
      if (e.repeat) { e.preventDefault(); return true; }                // holding a key never auto-moves
      const d = map[e.key]; if (!d) return false;
      e.preventDefault(); move(d); return true;
    }
  };
}

export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export function shuffle<T>(a: T[], rand: () => number): T[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export const pick = <T>(a: T[], rand: () => number): T => a[Math.floor(rand() * a.length)];
export function sample<T>(a: T[], n: number, rand: () => number): T[] { return shuffle(a, rand).slice(0, n); }
export const int = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
let uid = 0;
export const pid = (p: string) => p + "-" + (++uid);
