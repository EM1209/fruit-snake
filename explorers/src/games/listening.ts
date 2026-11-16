/* listening.ts — Sound Safari and Listen and Find (Word Garden).
 *
 * Sound Safari
 *   Easy: hear a familiar animal or world sound, tap one of 2–3 big pictures.
 *         The sounds are SYNTHESISED sound designs (see ATTRIBUTION.md), not
 *         field recordings, so every card also has "hear its name" and the
 *         replay button, and hints name the answer — unclear audio never traps.
 *   More challenge: beginning sounds. The main delivery is spoken EXAMPLE WORDS
 *         ("mouse… moon… which one starts the same way?") because isolated
 *         phonemes from a synthetic voice can be unclear. For the five sounds
 *         that can be held (m, s, f, sh, l) an optional "just the sound" button
 *         plays a held phoneme; stop sounds (b, p, k, d, r, w) are never isolated.
 * Listen and Find
 *   Easy: "Find the apple." with picture choices.
 *   More challenge: descriptive and combined clues ("an animal that can fly and
 *         comes out at night"), each with every acceptable answer listed.
 * Both draw through the saved anti-repeat deck. No reading is needed to answer.
 */
import spec from "../data/audio-spec.json";
import { type Api, type Mech, type Prompt, el, esc, icon, pictureCard, hearFor, cap, shuffle, sample, pick, pid } from "./kit.ts";

const VOCAB = spec.vocab as Record<string, string>;
const SFX = spec.sfx as Record<string, { art: string; kind: string; label: string }>;
const INITIAL = spec.initialSounds as Record<string, string[]>;
const PHONEMES = spec.phonemes as Record<string, { example: string }>;
export const nameOf = (art: string) => VOCAB[art] || art;

// ------------------------------------------------------------------ Sound Safari rules
/** Sounds that are easy to confuse are never offered together. */
const SOUND_NAME: Record<string, string> = { bird: "bird", rain: "rain", thunder: "thunderstorm", waves: "sea waves", wind: "wind", tap: "running tap", snake: "snake" };
const SOUND_FAMILY: Record<string, string> = { rain: "water", waves: "water", tap: "water", wind: "air", bee: "buzz", owl: "hoot", whale: "low" };
export function safariSoundPrompt(id: string, rand: () => number, nChoices: number): Prompt {
  const s = SFX[id];
  const pool = Object.keys(SFX).filter(k => k !== id && SFX[k].art !== s.art && (!SOUND_FAMILY[k] || SOUND_FAMILY[k] !== SOUND_FAMILY[id]));
  const same = pool.filter(k => SFX[k].kind === s.kind);
  const others = sample(same.length >= nChoices - 1 ? same : pool, nChoices - 1, rand);
  const opts = shuffle([id].concat(others), rand).map(k => ({ id: k, art: SFX[k].art, label: SOUND_NAME[k] || nameOf(SFX[k].art) }));
  const ans = opts.find(o => o.id === id)!;
  const animal = s.kind === "animal";
  return {
    id: pid("snd"), mechanic: "safari", kind: "sound", graded: true, sound: "sfx-" + id, options: opts, answer: id,
    instruction: animal ? "Listen! Who makes this sound?" : "Listen! What makes this sound?",
    sayClips: [animal ? "prompt-safari-who" : "prompt-safari-what", "sfx-" + id],
    hints: ["Play the sound again, then tap a picture's speaker to hear its name.", "It's the " + ans.label + " — " + s.label + "."],
    explanation: "That was a " + s.label + " sound.", concepts: ["animal-sounds"].concat(animal ? [s.art] : []), seen: ["animal-sounds"]
  };
}
const CONFUSABLE: Record<string, string[]> = { s: ["sh"], sh: ["s"], b: ["p"], p: ["b"], f: [], d: [], k: [], m: [], l: [], r: ["w"], w: ["r"] };
export function firstSoundPrompt(sym: string, target: string, rand: () => number): Prompt {
  const examples = sample(INITIAL[sym].filter(w => w !== target), 2, rand);
  const otherSyms = Object.keys(INITIAL).filter(k => k !== sym && !CONFUSABLE[sym].includes(k));
  const distract = sample(otherSyms, 2, rand).map(k => pick(INITIAL[k].filter(w => !examples.includes(w)), rand));
  const opts = shuffle([target].concat(distract), rand).map(a => ({ id: a, art: a, label: nameOf(a) }));
  const holdable = sym in PHONEMES;
  const exNames = examples.map(nameOf);
  return {
    id: pid("first"), mechanic: "safari", kind: "first", graded: true, sym, examples, options: opts, answer: target,
    phoneme: holdable ? "phoneme-" + sym : null,
    instruction: "Listen to the words: " + exNames.join(", ") + ". Which picture starts the same way?",
    sayClips: ["prompt-safari-chain"].concat(examples.map(w => "word-" + w), ["prompt-safari-same"]),
    hints: ["Say each picture's name. Listen to the very first sound.", cap(nameOf(target)) + " starts like " + exNames.join(" and ") + "."],
    explanation: cap(exNames[0]) + ", " + exNames[1] + " and " + nameOf(target) + " all start with the same sound.",
    concepts: ["first-sounds"], seen: ["first-sounds"]
  };
}
export function buildSafari(mode: string, ctx: any): Prompt[] {
  if (mode === "explore") {
    return ctx.pick(Object.keys(SFX).map(id => ({ cid: "snd:" + id, id, topic: SFX[id].kind })), 5, { spread: true })
      .map((c: any, i: number) => Object.assign(safariSoundPrompt(c.id, ctx.rand, i < 2 ? 2 : 3), { cids: [c.cid] }));
  }
  const cands = Object.entries(INITIAL).flatMap(([sym, words]) => words.map(w => ({ cid: "first:" + sym + ":" + w, sym, w, topic: sym })));
  return ctx.pick(cands, 5, { spread: true }).map((c: any) => Object.assign(firstSoundPrompt(c.sym, c.w, ctx.rand), { cids: [c.cid] }));
}

// ------------------------------------------------------------------ Listen and Find rules
/** Every clue lists ALL acceptable answers from the picture set, and distractors that clearly fail it. */
export const CLUES: Record<string, { valid: string[]; not: string[]; why: string }> = {
  "feet": { valid: ["boots"], not: ["sunhat", "mittens", "scarf", "umbrella", "cup", "book"], why: "Boots go on your feet." },
  "dry-rain": { valid: ["umbrella", "raincoat"], not: ["sunglasses", "shorts", "tshirt", "sunhat", "ball"], why: "Umbrellas and raincoats keep the rain off." },
  "red-fruit": { valid: ["apple", "strawberry", "cherries", "tomato"], not: ["banana", "pear", "lemon", "broccoli", "corn", "peas"], why: "Apples, strawberries, cherries and tomatoes can all be red." },
  "yellow-fruit": { valid: ["banana", "lemon"], not: ["apple", "strawberry", "grapes", "cherries", "watermelon", "broccoli"], why: "Bananas and lemons are yellow." },
  "can-fly": { valid: ["bee", "butterfly", "owl", "robin", "bat", "duck"], not: ["cow", "pig", "crab", "turtle", "snail", "rabbit", "dog"], why: "It has wings and can fly." },
  "sea-animal": { valid: ["whale", "crab", "fish", "turtle"], not: ["cow", "camel", "squirrel", "rabbit", "dog", "owl", "bee"], why: "It lives in the sea." },
  "shell": { valid: ["snail", "turtle", "crab"], not: ["rabbit", "cow", "owl", "frog", "mouse", "duck"], why: "It carries a hard shell." },
  "time": { valid: ["clock"], not: ["book", "ball", "spoon", "cup", "key", "pillow"], why: "A clock tells the time." },
  "dig": { valid: ["shovel"], not: ["book", "pillow", "cup", "ball", "key", "blanket"], why: "A shovel is for digging." },
  "fly-night": { valid: ["bat", "owl"], not: ["cow", "rabbit", "pig", "bee", "butterfly", "snail"], why: "Bats and owls fly about at night." },
  "green-wide": { valid: ["pear"], not: ["banana", "lemon", "strawberry", "cherries", "orange", "peach"], why: "A pear is green and wide at the bottom." },
  "moo": { valid: ["cow"], not: ["sheep", "pig", "dog", "cat", "duck", "hen"], why: "Cows say moo." },
  "sleep-on": { valid: ["pillow"], not: ["cup", "ball", "key", "spoon", "clock"], why: "You rest your head on a pillow." },
  "teeth": { valid: ["toothbrush"], not: ["spoon", "cup", "key", "book", "ball"], why: "A toothbrush cleans your teeth." },
  "underground": { valid: ["carrot", "potato"], not: ["apple", "corn", "peas", "tomato", "cherries", "banana", "broccoli"], why: "Carrots and potatoes grow under the ground." },
  "baby": { valid: ["chick"], not: ["cow", "owl", "fox", "sheep", "pig", "hen"], why: "A chick is a baby chicken." },
  "read": { valid: ["book"], not: ["ball", "cup", "spoon", "key", "pillow"], why: "You read a book." },
  "warm-hands": { valid: ["mittens"], not: ["boots", "sunhat", "sunglasses", "shorts", "tshirt"], why: "Mittens keep your hands warm." },
  "hops": { valid: ["rabbit", "frog"], not: ["cow", "snail", "fish", "turtle", "whale", "pig"], why: "Rabbits and frogs hop." },
  "honey": { valid: ["bee"], not: ["butterfly", "ladybug", "ant", "snail", "owl"], why: "Bees are striped and make honey." },
  "spots": { valid: ["ladybug"], not: ["bee", "ant", "butterfly", "snail"], why: "A ladybug is small and red with black spots." },
  "night-sky": { valid: ["moon"], not: ["summer", "cloud", "tree", "flower", "rock"], why: "The moon shines at night." },
  "long-ears": { valid: ["rabbit"], not: ["cow", "fox", "duck", "fish", "owl", "snail"], why: "Rabbits have long ears and nibble carrots." },
  "drink": { valid: ["cup", "bottle"], not: ["spoon", "book", "ball", "key", "pillow"], why: "You drink from a cup or a bottle." },
  "fungus": { valid: ["mushroom"], not: ["apple", "carrot", "broccoli", "peas", "banana", "corn"], why: "A mushroom is a fungus, not a plant." },
  "icy": { valid: ["polarbear", "penguin"], not: ["camel", "lizard", "cow", "frog", "crab"], why: "Polar bears and penguins live in cold, icy places." }
};
const CLUE_TEXT = spec.clues as Record<string, string>;
export function findPrompt(target: string, rand: () => number): Prompt {
  // two other pictures from different things, never one with the same spoken name
  const pool = Object.keys(VOCAB).filter(k => k !== target && nameOf(k) !== nameOf(target));
  const opts = shuffle([target].concat(sample(pool, 2, rand)), rand).map(a => ({ id: a, art: a, label: nameOf(a) }));
  return {
    id: pid("find"), mechanic: "listenfind", kind: "find", graded: true, options: opts, valid: [target],
    instruction: "Find the " + nameOf(target) + ".", sayClips: ["find-" + target],
    hints: ["Tap a picture's speaker to hear its name.", "Look for the " + nameOf(target) + "."],
    explanation: "That's the " + nameOf(target) + ".", concepts: ["listening"].concat([target]), seen: ["listening"]
  };
}
export function cluePrompt(clue: string, rand: () => number): Prompt {
  const c = CLUES[clue];
  const ans = pick(c.valid, rand);
  const opts = shuffle([ans].concat(sample(c.not, 3, rand)), rand).map(a => ({ id: a, art: a, label: nameOf(a) }));
  return {
    id: pid("clue"), mechanic: "listenfind", kind: "clue", graded: true, options: opts, valid: c.valid.filter(v => opts.some(o => o.id === v)), clue,
    instruction: CLUE_TEXT[clue], sayClips: ["clue-" + clue],
    hints: ["Listen to the whole clue again — every part matters.", "It's the " + nameOf(ans) + ". " + c.why],
    explanation: c.why, concepts: ["listening"], seen: ["listening"]
  };
}
export function buildListenFind(mode: string, ctx: any): Prompt[] {
  if (mode === "explore") return ctx.pick(Object.keys(VOCAB).map(id => ({ cid: "find:" + id, id })), 5).map((c: any) => Object.assign(findPrompt(c.id, ctx.rand), { cids: [c.cid] }));
  return ctx.pick(Object.keys(CLUES).map(id => ({ cid: "clue:" + id, id })), 5).map((c: any) => Object.assign(cluePrompt(c.id, ctx.rand), { cids: [c.cid] }));
}

// ------------------------------------------------------------------ shared mechanic: listen, then tap a picture
function mountListen(stage: HTMLElement, api: Api): Mech {
  const p = api.prompt;
  const valid: string[] = p.mechanic === "safari" ? [p.answer] : p.valid;
  let done = false;
  const listenLabel = p.kind === "sound" ? "Play the sound again" : p.kind === "first" ? "Hear the words again" : "Hear it again";
  const node = el(`<div class="listen">
    <div class="listen-top">
      <button type="button" class="btn listen-btn big">${icon("speaker")}<span>${esc(listenLabel)}</span></button>
      ${p.phoneme ? `<button type="button" class="btn ghost small phon-btn">${icon("speaker")}<span>Just the first sound</span></button>` : ""}
      ${p.kind === "sound" ? `<span class="sound-note">A made-up sound effect — not a real recording.</span>` : ""}
    </div>
    <div class="pcards n${p.options.length}" role="group" aria-label="Pictures to choose from"></div>
  </div>`);
  stage.appendChild(node);
  const cards = node.querySelector(".pcards") as HTMLElement;
  const replay = () => p.kind === "sound" ? api.clip(p.sound) : api.chain(p.sayClips);
  node.querySelector(".listen-btn")!.addEventListener("click", () => { replay(); });
  const ph = node.querySelector(".phon-btn"); if (ph) ph.addEventListener("click", () => api.clip(p.phoneme));
  p.options.forEach((o: any) => {
    const c = pictureCard(api, { id: o.id, art: o.art, label: o.label, hear: hearFor(o.art, o.label) });
    c.querySelector(".pcard-main")!.addEventListener("click", () => choose(o, c));
    cards.appendChild(c);
  });
  function choose(o: any, c: HTMLElement) {
    if (done || c.classList.contains("faded")) return;
    if (valid.includes(o.id)) {
      done = true; c.classList.add("right"); api.sfx("right");
      cards.querySelectorAll(".pcard").forEach(x => x !== c && x.classList.add("dim"));
      api.practiced(p.concepts || []); api.solved();
      api.feedback({ kind: "right", text: p.explanation, mood: "cheer" });
      api.clip("prompt-well-done");
      api.next();
    } else {
      c.classList.add("wrong"); setTimeout(() => c.classList.remove("wrong"), 700);
      api.sfx("retry");
      const why = p.kind === "sound" ? "That's the " + o.label + ". Listen once more." : p.kind === "first" ? cap(o.label) + " starts with a different sound." : "That's the " + o.label + ".";
      api.miss({ text: why });
    }
  }
  return {
    showHelp() {
      if (api.helpLevel() < 2) return false;
      const wrong = Array.from(cards.querySelectorAll<HTMLElement>(".pcard")).find(x => !valid.includes(x.dataset.id!) && !x.classList.contains("faded"));
      if (!wrong || cards.querySelectorAll(".pcard:not(.faded)").length <= 2) return false;
      wrong.classList.add("faded"); (wrong.querySelector(".pcard-main") as HTMLButtonElement).disabled = true;
      return true;
    },
    destroy() { done = true; api.stopAudio(); },
    debug: () => ({ valid, done, options: p.options.map((o: any) => o.id) })
  };
}
export const mountSafari = mountListen;
export const mountListenFind = mountListen;
