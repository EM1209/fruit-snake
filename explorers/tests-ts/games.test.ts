// Playful Worlds — deterministic rule and content tests for the new and changed games.
import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import spec from "../src/data/audio-spec.json";
import manifest from "../src/assets/audio/manifest.json";
import { buildSafari, buildListenFind, CLUES, safariSoundPrompt, firstSoundPrompt } from "../src/games/listening.ts";
import { makeMission, solve, step, startState, isDone, buildRescue, type Mission } from "../src/games/rescue.ts";
import { buildDetect, detectPrompt, SCENES, TRACKS, CLUE_FITS, CLUE_BLOCK } from "../src/games/detect.ts";
import { marketPrompt, checkBasket, required, canPayExactly, GOODS, SUBS, buildMarket, basketTotal } from "../src/games/market.ts";
import { ANIMALS, GROUPS, PIECES, checkHabitat, minCover, solutions, needsMet, buildHabitat, loadCreations, saveCreations, SAVE_KEY } from "../src/games/habitat.ts";

const require = createRequire(import.meta.url);
const L = require("../js/logic.js");
const Deck = require("../js/deck.js");
const Art = require("../js/art.js");
const ctxFor = (seed: number, mode = "explore", history: any = null, key = "x") => Deck.context(Deck.rec(history ? Deck.sanitize(history) : null, key), L.rng(seed), mode);
const M = manifest as Record<string, any>;
const ARTS = new Set<string>(Art.names().concat(["duckling", "sheep", "storm", "tracks-duck", "tracks-bird", "tracks-fox", "tracks-deer", "tracks-rabbit", "bush", "log", "leafpile", "reeds", "tallgrass",
  "coin-1", "coin-2", "coin-5", "milk", "eggs-box", "pond", "stream", "puddle", "burrow", "nest", "cave", "hollowtree", "hive", "snowden", "lilypad", "acorns", "flowers", "seaweed", "palm"]));

describe("Sound Safari", () => {
  it("every animal/world sound has a clip and a picture, and labels say it is a sound design", () => {
    for (const [id, s] of Object.entries(spec.sfx)) {
      expect(M["sfx-" + id], id).toBeTruthy();
      expect(M["sfx-" + id].source).toMatch(/synthesized|sound design/i);
      expect(ARTS.has((s as any).art), (s as any).art).toBe(true);
    }
  });
  it("Easy offers 2–3 big pictures with exactly one answer, never two pictures of the same thing", () => {
    for (let seed = 0; seed < 200; seed++) {
      const r = buildSafari("explore", ctxFor(seed));
      expect(r.length).toBe(5);
      r.forEach((p, i) => {
        expect(p.options.length).toBe(i < 2 ? 2 : 3);
        expect(p.options.filter((o: any) => o.id === p.answer).length).toBe(1);
        expect(new Set(p.options.map((o: any) => o.art)).size).toBe(p.options.length);
        expect(p.sayClips.every((c: string) => M[c])).toBe(true);
      });
    }
  });
  it("More challenge: the target really starts with the sound; distractors start differently and are never a confusable pair", () => {
    const I = spec.initialSounds as Record<string, string[]>;
    const groupOf = (w: string) => Object.keys(I).find(k => I[k].includes(w));
    for (let seed = 0; seed < 200; seed++) {
      for (const p of buildSafari("challenge", ctxFor(seed, "challenge"))) {
        expect(groupOf(p.answer)).toBe(p.sym);
        p.examples.forEach((w: string) => { expect(groupOf(w)).toBe(p.sym); expect(w).not.toBe(p.answer); });
        p.options.filter((o: any) => o.id !== p.answer).forEach((o: any) => {
          const g = groupOf(o.id)!; expect(g).not.toBe(p.sym);
          expect([["s", "sh"], ["sh", "s"], ["b", "p"], ["p", "b"], ["r", "w"], ["w", "r"]].some(([a, b]) => a === p.sym && b === g)).toBe(false);
        });
        // spoken example words are the main delivery; isolated sounds only for holdable ones
        expect(p.sayClips.filter((c: string) => c.startsWith("word-")).length).toBe(2);
        if (p.phoneme) expect(["m", "s", "f", "sh", "l"]).toContain(p.sym); else expect(["b", "p", "k", "r", "d", "w"]).toContain(p.sym);
        p.sayClips.forEach((c: string) => expect(M[c], c).toBeTruthy());
      }
    }
  });
  it("anti-repeat: consecutive rounds deal different sounds until the pool runs out (also after a save/reload)", () => {
    let h = Deck.sanitize(null); const key = "sound-safari:explore";
    const seen: string[] = [];
    for (let round = 0; round < 4; round++) {
      const r = buildSafari("explore", Deck.context(Deck.rec(h, key), L.rng(round + 7), "explore"));
      r.forEach((p: any) => { Deck.markShown(h, key, p.cids); seen.push(p.cids[0]); });
      h = Deck.sanitize(JSON.parse(JSON.stringify(h)));   // a reload
    }
    expect(new Set(seen.slice(0, 20)).size).toBe(20);
  });
});

describe("Listen and Find", () => {
  it("Easy: one spoken target among three distinct pictures; the clip exists", () => {
    for (let seed = 0; seed < 100; seed++) for (const p of buildListenFind("explore", ctxFor(seed))) {
      expect(p.options.length).toBe(3); expect(p.valid.length).toBe(1);
      expect(M[p.sayClips[0]]).toBeTruthy();
      expect(new Set(p.options.map((o: any) => M["word-" + o.id] ? M["word-" + o.id].text : o.id)).size).toBe(3);
    }
  });
  it("clues: every acceptable answer on screen is accepted, every distractor fails, and each clue has a clip", () => {
    for (const [id, c] of Object.entries(CLUES)) {
      expect(M["clue-" + id], id).toBeTruthy();
      c.valid.concat(c.not).forEach(a => expect(ARTS.has(a), a).toBe(true));
      expect(c.valid.some(v => c.not.includes(v))).toBe(false);
    }
    for (let seed = 0; seed < 300; seed++) for (const p of buildListenFind("challenge", ctxFor(seed, "challenge"))) {
      const c = CLUES[p.clue];
      p.options.forEach((o: any) => expect(p.valid.includes(o.id)).toBe(c.valid.includes(o.id)));
      expect(p.valid.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Snake Rescue", () => {
  const variants = ["easy", "gate", "bridge", "decoy", "double"];
  it("every generated mission is solvable there and back, and its solution actually completes it", () => {
    for (const v of variants) {
      let made = 0;
      for (let seed = 0; seed < 400 && made < 40; seed++) {
        const m = makeMission(v, L.rng(seed)); if (!m) continue; made++;
        const path = solve(m)!; expect(path, v).toBeTruthy();
        let s = startState(m); for (const d of path) s = step(m, s, d).state;
        expect(isDone(m, s)).toBe(true);
        if (v === "easy") { expect(path.length).toBeLessThanOrEqual(7); expect(m.rocks.length + m.water.length + m.gates.length).toBe(0); }
      }
      expect(made, v).toBeGreaterThan(20);
    }
  });
  it("the key/gate and the bridge really matter", () => {
    for (let seed = 0; seed < 200; seed++) {
      const g = makeMission("gate", L.rng(seed));
      if (g) expect(solve({ ...g, key: null, gates: [], rocks: g.rocks.concat(g.gates) })).toBeNull();
      const b = makeMission("bridge", L.rng(seed));
      if (b) expect(solve({ ...b, water: b.water.concat(b.bridges), bridges: [] })).toBeNull();
    }
  });
  it("rules: walls, rocks, water and a locked gate block a step; the animal follows; a wrong home is refused", () => {
    const m: Mission = { w: 4, h: 3, variant: "t", start: { x: 0, y: 0 }, rescues: [{ animal: "duck", art: "duckling", at: { x: 1, y: 0 }, home: "pond" }],
      homes: [{ id: "hive", art: "hive", label: "hive", at: { x: 2, y: 0 } }, { id: "pond", art: "pond", label: "pond", at: { x: 3, y: 0 } }], rocks: [{ x: 0, y: 1 }], water: [], bridges: [], gates: [], key: null };
    let s = startState(m);
    expect(step(m, s, "up").events).toEqual(["bump-edge"]);
    expect(step(m, s, "down").events).toEqual(["bump-rock"]);
    let r = step(m, s, "right"); expect(r.events).toContain("pickup"); s = r.state;
    r = step(m, s, "right"); expect(r.events).toContain("wrong-home"); expect(r.state.carrying).toEqual([0]); s = r.state;
    r = step(m, s, "right"); expect(r.events).toContain("deliver"); expect(r.events).toContain("done");
  });
  it("rounds draw fresh missions through the deck", () => {
    for (const mode of ["explore", "challenge"]) {
      const r = buildRescue(mode, ctxFor(3, mode));
      expect(r.length).toBe(3);
      expect(new Set(r.map((p: any) => p.cids[0])).size).toBe(3);
    }
  });
});

describe("Animal Detectives", () => {
  it("Easy: one animal in an uncluttered scene of 3 big hiding places", () => {
    for (let seed = 0; seed < 100; seed++) for (const p of buildDetect("explore", ctxFor(seed))) {
      expect(p.spots.length).toBe(3);
      expect(p.spots.filter((s: any) => s.animal).length).toBe(1);
      expect(p.clue.kind).toBe("name");
      expect(M["find-" + p.target] || p.target === "sheep").toBeTruthy();
    }
  });
  it("More challenge: the clue fits exactly one hidden animal and is never debatable", () => {
    let kinds = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const sc = SCENES[seed % SCENES.length];
      for (const kind of ["tracks", "sound", "clue"]) {
        const p = detectPrompt(sc, "more", L.rng(seed), kind); if (!p) continue;
        kinds.add(p.clue.kind);
        const hidden = p.spots.filter((s: any) => s.animal).map((s: any) => s.animal);
        expect(hidden).toContain(p.target);
        expect(p.spots.length).toBe(6);
        if (p.clue.kind === "tracks") expect(hidden.filter((a: string) => TRACKS[p.clue.art].includes(a))).toEqual([p.target]);
        if (p.clue.kind === "clue") { expect(hidden.filter((a: string) => CLUE_FITS[p.clue.id].includes(a))).toEqual([p.target]); expect(hidden.some((a: string) => (CLUE_BLOCK[p.clue.id] || []).includes(a))).toBe(false); }
        if (p.clue.kind === "sound") expect(M[p.clue.clip]).toBeTruthy();
        p.sayClips.forEach((c: string) => expect(M[c], c).toBeTruthy());
      }
    }
    expect(kinds).toEqual(new Set(["tracks", "sound", "clue"]));
  });
  it("scenes only hold animals and props that have pictures", () => {
    SCENES.forEach(s => s.animals.concat(s.props).forEach(a => expect(ARTS.has(a), a).toBe(true)));
  });
});

describe("Little Market", () => {
  it("Easy lists have two single items, both on the stall", () => {
    for (let seed = 0; seed < 100; seed++) { const p = marketPrompt("easy", L.rng(seed))!; expect(p.list.length).toBe(2); p.list.forEach((l: any) => { expect(l.qty).toBe(1); expect(p.shelf).toContain(l.art); }); }
  });
  it("basket check: exact quantities only; undo-style removal works; extras are flagged", () => {
    const p = { list: [{ art: "apple", qty: 3 }, { art: "carrot", qty: 2 }], soldOut: null };
    expect(checkBasket(p, { apple: 3, carrot: 2 }).ok).toBe(true);
    expect(checkBasket(p, { apple: 2, carrot: 2 }).missing).toEqual([{ art: "apple", n: 1 }]);
    expect(checkBasket(p, { apple: 4, carrot: 2 }).extra).toEqual([{ art: "apple", n: 1 }]);
    expect(checkBasket(p, { apple: 3, carrot: 2, milk: 1 }).ok).toBe(false);
  });
  it("budgets are small, the purse can pay exactly, and swaps are sensible and in stock", () => {
    for (let seed = 0; seed < 300; seed++) {
      const b = marketPrompt("budget", L.rng(seed));
      if (b) { expect(b.cost).toBeLessThanOrEqual(10); expect(canPayExactly(b.purse, b.cost)).toBe(true); expect(b.purse.every((c: number) => [1, 2, 5].includes(c))).toBe(true); expect(basketTotal(required(b))).toBe(b.cost); }
      const s = marketPrompt("swap", L.rng(seed))!;
      const line = s.list.find((l: any) => l.art === s.soldOut);
      expect(line.swap).toBe(SUBS[s.soldOut]); expect(s.shelf).toContain(line.swap);
      expect(required(s)[s.soldOut] || 0).toBe(0);
      const q = marketPrompt("qty", L.rng(seed))!; q.list.forEach((l: any) => { expect(l.qty).toBeGreaterThanOrEqual(2); expect(l.qty).toBeLessThanOrEqual(4); });
    }
    expect(canPayExactly([5, 2], 4)).toBe(false);
    Object.keys(GOODS).forEach(a => expect(ARTS.has(a), a).toBe(true));
  });
  it("More challenge rounds include quantities, coins and a swap", () => {
    const r = buildMarket("challenge", ctxFor(5, "challenge"));
    expect(new Set(r.map((p: any) => p.kind))).toEqual(new Set(["qty", "budget", "swap"]));
  });
});

describe("Build a Habitat", () => {
  it("every animal's needs use real pieces with pictures", () => {
    Object.entries(ANIMALS).forEach(([a, d]) => { expect(ARTS.has(a)).toBe(true); Object.values(d.needs).flat().forEach(x => { expect(PIECES[x], x).toBeTruthy(); expect(ARTS.has(x), x).toBe(true); }); });
  });
  it("every group can share one home within its spaces, and has more than one valid answer", () => {
    for (const g of GROUPS) {
      const p = buildHabitat("challenge", { pick: (c: any[], n: number) => c.filter((x: any) => x.g.join() === g.join()).slice(0, n), rand: L.rng(1) })[0];
      const cover = minCover(g);
      expect(cover.size).toBeLessThanOrEqual(p.slots);
      expect(solutions(g, p.slots).length, g.join()).toBeGreaterThan(1);
      cover.examples.forEach(ex => expect(checkHabitat(g, ex, p.slots).ok).toBe(true));
    }
  });
  it("checking: unmet needs and unused pieces are reported; alternative answers are accepted", () => {
    expect(checkHabitat(["duck"], ["pond", "reeds", "grass"], 6).ok).toBe(true);
    expect(checkHabitat(["duck"], ["stream", "nest", "lilypad"], 6).ok).toBe(true);
    const r = checkHabitat(["duck"], ["pond", "hive"], 6);
    expect(r.unmet.map(u => u.need)).toEqual(["shelter", "plants"]); expect(r.unused).toEqual(["hive"]);
    expect(needsMet("frog", ["pond", "log", "reeds"])).toEqual({ water: "pond", shelter: "log", plants: "reeds" });
    expect(checkHabitat(["duck", "frog"], ["pond", "reeds", "log", "lilypad", "grass"], 4).ok).toBe(false);   // too many pieces for the space
  });
  it("Free play saves and reloads under its own key, and falls back to memory when storage is blocked", () => {
    const mem: Record<string, string> = {};
    const store = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } } as unknown as Storage;
    expect(saveCreations(store, [{ id: "h1", name: "Habitat 1", at: 1, slots: ["pond", null, "duck"] }])).toBe(true);
    expect(Object.keys(mem)).toEqual([SAVE_KEY]);
    expect(loadCreations(store).list[0].slots).toEqual(["pond", null, "duck"]);
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } as unknown as Storage;
    expect(saveCreations(blocked, [{ id: "h2", name: "Habitat 2", at: 2, slots: ["log"] }])).toBe(false);
    expect(loadCreations(blocked)).toEqual({ list: [{ id: "h2", name: "Habitat 2", at: 2, slots: ["log"] }], persistent: false });
    expect(buildHabitat("free", ctxFor(1))[0].graded).toBe(false);
  });
});

describe("audio manifest", () => {
  it("every spoken word, clue and prompt in the spec has a clip with matching text", () => {
    Object.entries(spec.vocab).forEach(([id, t]) => expect(M["word-" + id]?.text, id).toBe(t));
    Object.entries(spec.clues).forEach(([id, t]) => expect(M["clue-" + id]?.text).toBe(t));
    Object.entries(spec.prompts).forEach(([id, t]) => expect(M["prompt-" + id]?.text).toBe(t));
    Object.keys(spec.phonemes).forEach(id => expect(M["phoneme-" + id]).toBeTruthy());
  });
});

// keep the imported helpers referenced (they are part of the public rule API)
void safariSoundPrompt; void firstSoundPrompt;
