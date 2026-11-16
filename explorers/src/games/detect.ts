/* detect.ts — Animal Detectives (Nature Trail).
 * Animals hide behind trees, rocks, leaves and grass in an illustrated scene,
 * with part of them peeking out. Tap a hiding place to look.
 *   Easy: an uncluttered scene, a big "who we're looking for" picture, and the
 *         animal's ears, tail or head clearly peeking out.
 *   More challenge: busier scenes and only a clue — footprints, a sound, or a
 *         spoken clue that combines facts ("an animal with a shell"). Other
 *         animals hide too, so the clue has to be used.
 * Hiding places are large buttons (never tiny targets). */
import spec from "../data/audio-spec.json";
import { type Api, type Mech, type Prompt, el, esc, icon, cap, shuffle, sample, pick, pid } from "./kit.ts";

export type Scene = { id: string; name: string; sky: string; ground: string; props: string[]; animals: string[] };
export const SCENES: Scene[] = [
  { id: "forest", name: "in the forest", sky: "#CFE8F5", ground: "#8FC77A", props: ["bush", "log", "tree", "leafpile", "rock"], animals: ["owl", "fox", "deer", "squirrel", "rabbit", "mouse"] },
  { id: "pond", name: "by the pond", sky: "#D7EEF7", ground: "#9CD08A", props: ["reeds", "log", "rock", "bush", "tallgrass"], animals: ["duck", "frog", "snail", "turtle", "mouse"] },
  { id: "meadow", name: "in the meadow", sky: "#E2F2FA", ground: "#A9D67E", props: ["tallgrass", "flowers", "bush", "rock", "log"], animals: ["rabbit", "bee", "ladybug", "butterfly", "mouse", "snail"] },
  { id: "farm", name: "on the farm", sky: "#F6E9CF", ground: "#B9D88A", props: ["bush", "tree", "tallgrass", "log", "rock"], animals: ["cow", "pig", "sheep", "hen", "cat", "dog"] },
  { id: "beach", name: "at the beach", sky: "#D5EEF8", ground: "#EBD39B", props: ["rock", "seaweed", "palm", "bush", "log"], animals: ["crab", "turtle", "fish"] },
  { id: "snow", name: "in the snowy hills", sky: "#E6EEF7", ground: "#F4F8FB", props: ["rock", "tree", "bush", "log"], animals: ["polarbear", "fox", "rabbit"] }
];
const NAME: Record<string, string> = { polarbear: "polar bear", ladybug: "ladybug" };
export const animalName = (a: string) => NAME[a] || a;

/* Clue types for More challenge. Each clue lists exactly which animals it fits;
 * a scene only uses a clue when ONE hidden animal fits it. */
export const TRACKS: Record<string, string[]> = { "tracks-duck": ["duck"], "tracks-bird": ["hen", "robin", "penguin"], "tracks-fox": ["fox", "dog", "cat"], "tracks-deer": ["deer", "sheep", "pig"], "tracks-rabbit": ["rabbit"] };
export const SOUNDS: Record<string, string> = { cow: "sfx-cow", sheep: "sfx-sheep", cat: "sfx-cat", dog: "sfx-dog", duck: "sfx-duck", owl: "sfx-owl", frog: "sfx-frog", bee: "sfx-bee", pig: "sfx-pig", hen: "sfx-hen", mouse: "sfx-mouse" };
export const CLUE_FITS: Record<string, string[]> = {
  "shell": ["snail", "turtle", "crab"], "can-fly": ["owl", "duck", "bee", "butterfly", "ladybug"],
  "hops": ["rabbit", "frog"], "long-ears": ["rabbit"], "honey": ["bee"], "spots": ["ladybug"], "moo": ["cow"], "fly-night": ["owl"]
};

/** Animals that make a clue debatable: a scene with one of these never uses that clue. */
export const CLUE_BLOCK: Record<string, string[]> = { "hops": ["squirrel", "mouse"], "long-ears": ["deer", "mouse"], "can-fly": ["hen"] };
export type Spot = { id: string; prop: string; animal: string | null; peek: string };
export function detectPrompt(scene: Scene, mode: "easy" | "more", rand: () => number, clueKind?: string): Prompt | null {
  const nSpots = mode === "easy" ? 3 : 6;
  const nAnimals = mode === "easy" ? 1 : Math.min(3, scene.animals.length);
  const hidden = sample(scene.animals, nAnimals, rand);
  const props = shuffle(Array.from({ length: nSpots }, (_, i) => scene.props[i % scene.props.length]), rand);
  const peeks = ["top", "left", "right"];
  const spots: Spot[] = props.map((prop, i) => ({ id: "s" + i, prop, animal: i < hidden.length ? hidden[i] : null, peek: mode === "easy" ? "top" : pick(peeks, rand) }));
  const order = shuffle(spots, rand);
  let target = hidden[0];
  let clue: Record<string, any> = { kind: "name" };
  if (mode === "more") {
    const kinds = clueKind ? [clueKind] : shuffle(["tracks", "sound", "clue"], rand);
    clue = { kind: "none" };
    for (const kind of kinds) {
      if (kind === "tracks") {
        const opts = Object.entries(TRACKS).filter(([, fits]) => hidden.filter(a => fits.includes(a)).length === 1);
        if (opts.length) { const [art, fits] = pick(opts, rand); target = hidden.find(a => fits.includes(a))!; clue = { kind, art }; break; }
      } else if (kind === "sound") {
        const opts = hidden.filter(a => SOUNDS[a]);
        if (opts.length) { target = pick(opts, rand); clue = { kind, clip: SOUNDS[target] }; break; }
      } else {
        const opts = Object.entries(CLUE_FITS).filter(([id, fits]) => hidden.filter(a => fits.includes(a)).length === 1 && !hidden.some(a => (CLUE_BLOCK[id] || []).includes(a)));
        if (opts.length) { const [id, fits] = pick(opts, rand); target = hidden.find(a => fits.includes(a))!; clue = { kind, id }; break; }
      }
    }
    if (clue.kind === "none") return null;
  }
  const name = animalName(target);
  const sayClips = clue.kind === "name" ? ["find-" + target] : clue.kind === "tracks" ? ["prompt-detect-tracks"] : clue.kind === "sound" ? ["prompt-detect-sound", clue.clip] : ["clue-" + clue.id];
  const instruction = clue.kind === "name" ? "Find the " + name + ". It's hiding " + scene.name + "."
    : clue.kind === "tracks" ? "Who made these tracks? Find them " + scene.name + "."
    : clue.kind === "sound" ? "Who is making this sound? Find them!"
    : (spec.clues as Record<string, string>)[clue.id];
  const hintClue = clue.kind === "tracks" ? "Look at the shape of each footprint." : clue.kind === "sound" ? "Play the sound again and think who makes it." : "Listen to every part of the clue.";
  return {
    id: pid("detect"), mechanic: "detect", graded: true, scene: scene.id, spots: order, target, clue, sayClips, instruction,
    hints: [mode === "easy" ? "Look for a little bit of the " + name + " peeking out." : hintClue, "The " + name + " is behind the " + propName(spots.find(s => s.animal === target)!.prop) + "."],
    explanation: clue.kind === "tracks" ? "Those were " + name + " tracks." : clue.kind === "sound" ? "The " + name + " made that sound." : "You found the " + name + "!",
    concepts: ["detective"].concat(target === "dog" || target === "cat" || target === "pig" || target === "sheep" || target === "hen" ? [] : [target]), seen: ["detective"].concat(hidden.filter(a => !["dog", "cat", "pig", "sheep", "hen"].includes(a)))
  };
}
export const propName = (p: string) => ({ leafpile: "pile of leaves", tallgrass: "tall grass", seaweed: "seaweed", palm: "palm tree", flowers: "flowers", reeds: "reeds" } as Record<string, string>)[p] || p;

export function buildDetect(mode: string, ctx: any): Prompt[] {
  if (mode === "explore") {
    return ctx.generate((r: () => number) => { const sc = pick(SCENES, r); const p = detectPrompt(sc, "easy", r); return p && Object.assign(p, { cid: "det:" + sc.id + ":" + p.target, topic: sc.id }); }, 4, { spread: true, tries: 60 })
      .map((p: any) => Object.assign(p, { cids: [p.cid] }));
  }
  const kinds = shuffle(["tracks", "sound", "clue", "tracks", "sound", "clue"], ctx.rand).slice(0, 4);
  return kinds.map(kind => ctx.generate((r: () => number) => { const sc = pick(SCENES, r); const p = detectPrompt(sc, "more", r, kind); return p && Object.assign(p, { cid: "det2:" + kind + ":" + sc.id + ":" + p.target + ":" + (p.clue.art || p.clue.id || p.clue.clip), topic: kind }); }, 1, { tries: 80 })[0])
    .filter(Boolean).map((p: any) => Object.assign(p, { cids: [p.cid] }));
}

// ------------------------------------------------------------------ the scene
export function sceneBackdrop(sc: Scene): string {
  return `<svg class="det-bg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="240" fill="${sc.sky}"/>
    <circle cx="340" cy="44" r="22" fill="#FCE7A8" opacity=".9"/>
    <path d="M0 120C60 90 120 100 180 112S300 92 400 104V240H0z" fill="${sc.ground}" opacity=".55"/>
    <path d="M0 150C80 130 160 140 240 150S340 136 400 142V240H0z" fill="${sc.ground}"/>
    ${sc.id === "pond" || sc.id === "beach" ? `<ellipse cx="${sc.id === "beach" ? 300 : 200}" cy="${sc.id === "beach" ? 150 : 190}" rx="${sc.id === "beach" ? 160 : 110}" ry="26" fill="#7EC3E3" opacity=".85"/>` : ""}
    ${sc.id === "snow" ? `<path d="M0 130l60-50 50 40 70-60 80 70 60-40 80 60V240H0z" fill="#fff" opacity=".7"/>` : ""}
  </svg>`;
}
export function mountDetect(stage: HTMLElement, api: Api): Mech {
  const p = api.prompt; const sc = SCENES.find(s => s.id === p.scene)!;
  let done = false; const looked = new Set<string>();
  const clueHtml = p.clue.kind === "name" ? "" : p.clue.kind === "tracks" ? `<div class="det-clue">${api.Art.item(p.clue.art, "art", "Footprints")}<span>Tracks</span></div>`
    : `<button type="button" class="btn det-clue-btn">${icon("speaker")}<span>${p.clue.kind === "sound" ? "Play the sound" : "Hear the clue"}</span></button>`;
  const node = el(`<div class="detect">
    <div class="det-head">
      ${p.clue.kind === "name" ? `<div class="det-target">${api.Art.item(p.target, "art", "Looking for: " + animalName(p.target))}<span class="lab">${esc(cap(animalName(p.target)))}</span></div>` : clueHtml}
      <button type="button" class="btn ghost small det-hear">${icon("speaker")}<span>Hear it again</span></button>
    </div>
    <div class="det-scene n${p.spots.length}">${sceneBackdrop(sc)}<div class="det-spots" role="group" aria-label="Hiding places ${esc(sc.name)}"></div></div>
  </div>`);
  stage.appendChild(node);
  const replay = () => api.chain(p.sayClips);
  node.querySelector(".det-hear")!.addEventListener("click", replay);
  const cb = node.querySelector(".det-clue-btn"); if (cb) cb.addEventListener("click", () => p.clue.kind === "sound" ? api.clip(p.clue.clip) : replay());
  const box = node.querySelector(".det-spots") as HTMLElement;
  (p.spots as Spot[]).forEach((sp, i) => {
    const b = el(`<button type="button" class="det-spot peek-${sp.peek}" data-spot="${sp.id}" aria-label="Look behind the ${esc(propName(sp.prop))} (${i + 1})">
      ${sp.animal ? `<span class="det-animal">${api.Art.item(sp.animal, "art")}</span>` : ""}
      <span class="det-prop">${api.Art.item(sp.prop, "art")}</span><span class="det-found" aria-hidden="true"></span></button>`);
    b.addEventListener("click", () => look(sp, b));
    box.appendChild(b);
  });
  function look(sp: Spot, b: HTMLElement) {
    if (done) return;
    if (sp.animal === p.target) {
      done = true; b.classList.add("revealed", "right"); api.sfx("right");
      api.clip("word-" + p.target);
      api.practiced(p.concepts || []); api.solved();
      api.feedback({ kind: "right", text: p.explanation, mood: "cheer" });
      api.next(); return;
    }
    b.classList.add("revealed"); api.sfx("retry");
    const first = !looked.has(sp.id); looked.add(sp.id);
    const text = sp.animal ? "That's a " + animalName(sp.animal) + (p.clue.kind === "name" ? "." : " — it doesn't match the clue.") : "Just " + propName(sp.prop) + " here.";
    if (first) api.miss({ text }); else api.feedback({ kind: "info", text, mood: "think" });
  }
  return {
    showHelp() {
      if (api.helpLevel() < 2) return false;
      const tgt = box.querySelector(`[data-spot="${(p.spots as Spot[]).find(s => s.animal === p.target)!.id}"]`);
      if (tgt) tgt.classList.add("glow");
      return true;
    },
    destroy() { done = true; api.stopAudio(); },
    debug: () => ({ target: p.target, spots: p.spots, clue: p.clue, done })
  };
}
