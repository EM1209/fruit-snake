# Snake Explorers — Playful Worlds

A learning-through-play adventure for all ages, with young children as the main learners. A friendly snake guides
players through six illustrated worlds: **23 activities**, chosen as **Easy** or **More challenge**, plus a separate
**Free play** where it makes sense (Build a Habitat). The original Fruit Snake game in `../www/` is untouched and
still plays as **Classic Snake**, inside its own frame.

## Commands (run in `explorers/`)

```bash
npm ci                    # exact versions from package-lock.json
npm run dev               # Vite dev server  → http://localhost:8790/
npm run build             # one self-contained file → dist/index.html (no CDN, no network)
npm run build:artifact    # also writes dist/artifact.html (fragment for an Artifact host page)
npm run typecheck         # TypeScript, no emit
npm test                  # vitest rule/content tests + the original node --test suites
npm run test:e2e          # build + Playwright browser tests (CSP, phone/tablet/desktop, large text)
npm run check             # typecheck + all unit tests + artifact build
```

From the repo root, `npm test` still runs the 14 original Fruit Snake tests, and `npm run test:all` runs those plus these.

## Toolchain, and why

| Tool | Version | Why it's here |
|---|---|---|
| **Vite** | 8.3.5 | Current, maintained dev server and bundler; fast reloads; builds ES2022 for current browsers. |
| **vite-plugin-singlefile** | 2.3.4 | Inlines all JS, CSS, fonts and audio into one HTML file, so the game runs offline, from disk, or inside an Artifact's strict CSP. |
| **TypeScript** | 7.0.2 (`tsc --noEmit`) | Type-checks the new modules (`src/`) and the tests. Vite strips types at build time. |
| **Vitest** | 5.0.5 | Fast unit tests that import the TypeScript game rules directly. |
| **@playwright/test** | 1.63.0 | Browser tests against the *built* file under an artifact-like CSP, at 360×640, 390×844, 820×1180 and 1280×800. |
| **@fontsource** Fredoka + Atkinson Hyperlegible | 5.3.0 | Fonts are bundled (Latin subset), so there are no Google Fonts requests at runtime. |

No UI framework was added. The existing game is plain DOM modules with a working round, progress and save system, and
it's kept as it is. The six new games and the new art, audio, demos and scenery are TypeScript modules in `src/`. They
register into the existing game (`SE_Content.registerActivity`, `SE_Mech`, `SE_Art.register`). The original
`js/*.js` modules still load unchanged in Node for the original tests. In the browser bundle, a small Vite plugin pins
them to their browser branch. `.npmrc` sets `legacy-peer-deps` because Vitest's optional peer list confuses npm's
resolver. The lockfile pins everything.

## What changed in Playful Worlds

**Replaced**
* **Letter Line → Sound Safari.**
  * Easy: hear an animal or world sound and tap one of 2–3 big pictures.
  * More challenge: beginning sounds, delivered as *spoken example words* ("mouse… moon… which one starts the same way?").
  * Every card has a "hear its name" button, and the sound can be replayed.
  * For holdable sounds only (/m/ /s/ /f/ /sh/ /l/), there is an optional "just the first sound" button. Stop sounds (b, p, k, r, d) are never isolated.
* **Sentence Builder → Listen and Find.**
  * Easy: "Find the apple" among picture choices.
  * More challenge: descriptive and combined clues ("an animal that can fly and comes out at night"). Every acceptable answer is accepted.

**Changed**
* **Life Cycles and Step by Step, Easy:**
  * Exactly three large picture cards, with spoken prompts and hints.
  * A *Show me* demo of a different example. It moves only when pressed, then resets.
  * The three-stage examples are accurate: chicken, duck, grasshopper, turtle, snail, tree, robin, fish, penguin. Routines merge steps honestly, e.g. "soap and scrub", "rinse and dry". Nothing essential is dropped.
  * The longer picture cycles stay in More challenge. These activities never use word tiles.
* **Food Chains:**
  * Living/not living sorting, plant-eater/hunter sorting, chain questions shown as pictures, and what-if questions.
  * **No ordering prompts** (tested).
* **Code the Snake and Bug Hunt, Easy:**
  * 3×3 boards with 2–3 arrows.
  * *Show me* replays a similar example.
  * In Bug Hunt Easy, you tap the square where the snake stops. No lettered or coordinate questions for beginners.
  * More challenge keeps the richer puzzles (rocks, keys, bump-finding, fixing buggy code).
* **Movement:** every learning game moves one step per press, tap or swipe, including old saves that had "lively".
  Nothing moves while a child is thinking. Programmed routes move only after **Run**. Holding a key doesn't auto-repeat.
  Classic Snake keeps its own original movement.

**New**
* **Snake Rescue** (Logic Lab)
  * Step the snake to a lost animal. It follows you, and you bring it to the home that suits it.
  * More challenge adds a key and a locked gate, a river with one bridge, rocks and a decoy home, or two rescues.
  * Every mission is generated and then checked by a breadth-first search over the full mission state. The tests also check that the key/gate and the bridge really matter.
* **Animal Detectives** (Nature Trail)
  * Animals peek out from behind trees, logs, leaves, reeds and grass in six illustrated scenes.
  * Easy: an uncluttered scene with an obvious head peeking out.
  * More challenge: footprints, a sound, or a spoken combined clue. Each clue fits exactly one hidden animal, and scenes that would make a clue debatable are excluded.
* **Little Market** (Number Meadow)
  * Fill a basket from a picture list. Tap the basket to take something out; Undo steps back.
  * Easy: two items.
  * More challenge: exact quantities shown as pictures; a small budget paid with exact play coins (1, 2, 5); a sold-out item with a sensible swap shown on the list.
  * Pretend only: nothing is bought.
* **Build a Habitat** (Nature Trail)
  * Place water, shelter and plants in an illustrated scene.
  * Easy: one animal, with its needs shown and checked off.
  * More challenge: 2–3 compatible animals share one home in limited spaces. Any valid set is accepted, and every group has several.
  * **Free play** (separate, not a difficulty level): build anything, with no wrong answers. Save and reopen creations on this device, under their own key `snakeExplorers.habitats`.
  * Placing works by tap-a-piece then tap-a-space, by keyboard (Tab + Enter), or by dragging (optional). Pieces can be removed and Undo steps back.

All new and replaced games draw their questions through the saved anti-repeat deck (`js/deck.js`). Fresh items come
first, across rounds and reloads.

### Content variety (new games)
| Game | Easy pool | More-challenge pool |
|---|---|---|
| Sound Safari | 20 sounds (14 animals, 6 world sounds) | 47 example-word pictures over 10 beginning sounds |
| Listen and Find | 81 spoken picture names | 26 descriptive/combined clues |
| Snake Rescue | generated short trips; 8 animal→home pairs | 4 mission types (key+gate, bridge, decoy home, double rescue), all generated |
| Animal Detectives | 6 scenes × their animals | 5 track types, 11 sound animals, 8 spoken clue types |
| Little Market | 18 goods | exact quantities, coin budgets (paying exactly), 10 sensible swaps |
| Build a Habitat | 10 animals, 18 pieces | 12 compatible groups, each with several valid homes |
| Life Cycles / Step by Step (Easy) | 9 three-stage cycles / 11 three-step routines | unchanged longer picture sequences |
| Code the Snake / Bug Hunt (Easy) | 44 small boards | unchanged |

## Look and feel
* Layered scenic backdrops, drawn as SVG with no image files: sky, far hills, near hills, and details per world.
* A trail map of the six worlds, and illustrated activity stations.
* Tactile 3D buttons, big picture cards, and a calmer win screen.
* All art matches the original illustration kit (one outline weight, soft fills). No emoji are used as artwork.
* Fonts: Fredoka for headings and Atkinson Hyperlegible for reading.
* Reduced motion (system or Settings) stops all animation.
* Accessibility:
  * Large text keeps the layout on screen, and focus is always visible.
  * Voice and sound effects have separate switches, and a quick mute sits in the play bar.
  * Word labels under pictures are optional, and no beginner task needs reading.

## Audio — what it is, and what was not checked
See `src/assets/audio/ATTRIBUTION.md`. All 225 clips are generated by `tools/audio/build_audio.py` and bundled into
the file as data:
* **Speech** (words, prompts, clues): SVOX Pico TTS, rendered offline. If a clip can't be decoded, the game uses the device voice, and the on-screen words always say the same thing.
* **Animal and world sounds are synthesised sound designs**, made from simple models. **They are not recordings.** The game labels them "a made-up sound effect". Hints name the answer, and each picture can say its name.
* **Isolated phonemes** (/m/ /l/ /s/ /sh/) are cut from Pico words and looped; /f/ is synthesised. They are an optional extra. Spoken example words are the main delivery.
* **Checks that were run:**
  * Automatic speech recognition (pocketsphinx, constrained grammar) matched 163 of 200 speech clips. The misses are mostly isolated short words, and that check is a weak proxy.
  * Spectral sanity checks passed for every phoneme and sound effect.
  * In the browser, every clip decodes and plays.
* **Limitation:** none of these checks proves a child can recognise a sound. **No clip has been listened to by a person.** Please listen before relying on them, especially the phonemes and the synthesised animal sounds.

## Saving and old progress
* Saves stay under `snakeExplorers.v1`, schema v1, and changes are **additive only**. New settings (`difficulty`, `captions`) get defaults, and unknown fields are kept.
* Retired Letter Line and Sentence Builder records are kept under their own names, and Continue maps them safely:
  * **Continue** goes to Sound Safari or Listen and Find, with a note on the home screen.
  * Old achievements are never relabelled. "Building sentences" stays in the Discovery Book only if it was earned.
* Easy plays the original Explore pools. More challenge takes turns between the original Practice and Challenge pools, so earlier progress and history keep their meaning.
* If storage is blocked, play continues for the session, and the game says so.

## Code map
```
explorers/
  index.html              screens (Vite entry: src/main.ts)
  styles.css              original design layer
  js/                     original modules (rules, content, deck, store, mechanics, app) — still Node-testable
  src/main.ts             bundles fonts, CSS, the original modules, Classic Snake, and Playful Worlds
  src/setup.ts            registers new art, audio, demos, mechanics and the 6 new activities
  src/games/*.ts          listening (Sound Safari, Listen and Find), rescue, detect, market, habitat, demos, kit
  src/scenes.ts           layered scenic backdrops
  src/art-extra.ts        new illustrations in the same style
  src/clips.ts            bundled audio: base64 → WebAudio, voice/effects switches, fallbacks
  src/theme.css           the Playful Worlds visual layer
  src/data/audio-spec.json  every word, clue, prompt, sound and phoneme (one source of truth)
  tools/audio/build_audio.py  regenerates src/assets/audio (needs pico2wave, ffmpeg, numpy/scipy, pocketsphinx)
  tools/export-artifact.mjs   dist/index.html → dist/artifact.html
  tests/                  original node --test suites (updated for Playful Worlds)
  tests-ts/               vitest suites for the new rules and content
  e2e/                    Playwright browser tests
```
`CONTENT.md` is the older inventory of the original modules, and is kept for reference.
`../tools/build-explorers.mjs` built the previous releases; this release builds with Vite.

## Privacy and safety
* No accounts, ads, purchases, personal questions, or network calls. Fonts and audio are bundled.
* The game never requests the microphone. The embedded Classic Snake has speech recognition switched off, so its "Say it" mode falls back to tapping.
* Little Market uses play coins only.
