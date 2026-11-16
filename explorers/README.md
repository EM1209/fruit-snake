# Snake Explorers

A learning-through-play garden adventure for all ages, with children as the
main learners. A friendly snake guides players through six worlds, using six
different ways to play. The original Fruit Snake game in `www/` is untouched
and is still playable here as **Classic Snake**.

```bash
npm run serve:explorers     # http://localhost:8770/explorers/  (serves the repo root so Classic Snake can load ../www)
npm run test:explorers      # rules, content, and saving tests (Node, no browser)
npm run test:all            # the above + the original Fruit Snake tests
npm run build:explorers     # one self-contained HTML file → preview/snake-explorers.html
npm run inventory           # recount content → explorers/CONTENT.md
node tools/e2e-explorers.cjs http://localhost:8770/explorers/index.html   # real-browser check (Playwright)
```

## Worlds and activities (19)

New in **More Adventures** are marked ★. Actual counts per world and mode are in **[CONTENT.md](CONTENT.md)**
(generated from the data with `npm run inventory`).

| World | Activity | How you play | Explore → Practice → Challenge |
|---|---|---|---|
| Word Garden | Snack Hunt | steer & collect | eat anything to hear names → find the named snack → find it from a written clue, or “find a food that grows underground” (several right answers) |
| | Letter Line | put in order | copy 3-letter words → spell 4-letter words you hear → spell longer words from a picture, with a spare letter |
| | ★ Sentence Builder | put in order | copy short sentences → build 4–6 word sentences → longer sentences with a spare word |
| Number Meadow | Berry Basket | steer & collect | count to 8 (numeral or dot picture) → up to 12, one more than → sums, doubles, take-aways |
| | Meadow Math | tap to choose | count, compare, one more/less → adding, doubles, tens and ones, patterns → subtraction, missing numbers, two-step and word problems |
| | ★ Fair Shares | tap to choose | sharing, pairs, which is bigger → groups, rows, halves, short stories → leftovers, thirds, multi-step stories |
| Pattern Playground | Pattern Path | tap to choose | two-part patterns → longer patterns, gaps, odd one out → two changes at once, four-part patterns, rule-based odd one out |
| | Shape Sort | sort | by shape → by color, edges, or sides → by sides (3–6), corners, equal sides |
| | ★ Mirror Match | tap to choose | small mirror pictures, +1 growth → bigger mirrors both ways → turned shapes, square/triangle-number growth |
| Nature Trail | Habitat Homes | sort | 2 habitats → 3 → 4, where some animals fit more than one (22 animals) |
| | Life Cycles | put in order | 3 stages → full animal cycles, seasons, days → plants, trees, the water cycle |
| | Nature Walk | explore | discover facts → facts then questions → "Who am I?" riddles |
| | ★ Food Chains | sort / order / choose | living or not living → 3-step food chains → 4-step chains and what-if questions |
| Logic Lab | Code the Snake | plan & run | small grids → route around rocks → get the key first, with an arrow limit (51 levels) |
| | ★ Bug Hunt | choose / plan & run | predict where code stops → find the step that bumps a rock → fix buggy code and run it |
| Everyday Adventures | Step by Step | put in order | 3 steps → full routines (12) → full routines plus a card that doesn't belong |
| | Ready for Weather | tap to choose | pick one helpful thing or safe choice → pick two, pack from a list → pick everything; plan for a twist |
| | Kind Choices | tap to choose | think about kind choices → several fit → find every kind choice (18 scenarios) |
| | ★ Tidy Up | sort | 2 rooms → 3 rooms → 4 rooms, where some things fit more than one |

## Fresh questions, fewer repeats
- Every question has a **canonical content id** (`cid`) naming what it asks, not how it is laid out. The same question
  with shuffled answers, another color, or another character name has the same id.
- For each activity **and** mode, the game keeps a bounded history (cid → when it was last *shown*; at most 400 ids,
  oldest dropped first) inside the existing save, under `history`. Only prompts that actually appear are recorded,
  so leaving a round early doesn't use up the questions you never saw.
- Rounds are dealt by `js/deck.js`: never-shown questions first (in seeded random order, mixing topics), then the
  least recently shown. This works like a shuffle bag that survives reloads, and when a pool runs out it recycles
  the oldest questions instead of looping forever.
- Generated questions (maths, mirrors, code puzzles) also get canonical ids (`add:3+4` is the same as `add:4+3`), and
  the generator draws many candidates and keeps the freshest.
- In Practice, one missed item can come back at the end of a round. It is clearly labelled **Review**.
- **Limits:** the bank is large but finite. Each activity and mode has enough for at least three fresh rounds
  (tested), and many have far more (see CONTENT.md). Habitat and room sets are small on purpose, so the same set of
  baskets can appear again with different animals or things. History is per device. If storage is blocked it lasts
  only for the session, and resetting progress clears it.

Movement speed (one step per press / relaxed / steady / lively) is a separate
setting from the difficulty mode. Nothing is timed unless a player switches on
the optional Challenge stopwatch, and that never limits play.

## How learning is tracked
- **Discovered** means the player met something. **Practiced** means they answered a question about it correctly.
  The Discovery Book shows both, and never claims mastery.
- A wrong answer gets a specific hint and another try. After three tries a "Skip this one" button appears.
  In Practice, one item that needed another look comes back as a quick review at the end of the round.
- The results screen reports first-try answers, answers found after another look, and hints used. It may suggest
  an easier or harder mode for next time. It never changes the round already in progress.
- Answers are checked by stable ids or values (`js/logic.js`), never by position on screen.

## Code map
```
explorers/
  index.html, styles.css   screens and the visual design
  js/deck.js         freshness-aware selection (cids, bounded history)        (tested)
  js/bank.js         the authored content bank (pure data)
  js/levels.js       curated Logic Lab levels (seeded, solver-checked)
  js/logic.js        pure rules: answer checking, code runs, progress, unlocks   (tested)
  js/content.js      curated content + round builders per world/activity/mode   (tested)
  js/art.js          SVG illustration kit + the snake companion
  js/store.js        saving under "snakeExplorers.v1" + session-only fallback  (tested)
  js/audio.js        speech synthesis + sound effects (never the microphone)
  js/ui.js           small DOM helpers and icons
  js/mech-*.js       the six mechanics: collect, choose, sort, sequence, plan, explore
  js/app.js          screens, rounds, hints, results, My Snake, Discovery Book, settings
  tests/             node --test suites
tools/build-explorers.mjs   single-file bundle (embeds www/ as Classic Snake, read-only)
tools/e2e-explorers.cjs     Playwright end-to-end check
tools/content-inventory.cjs content counts → CONTENT.md
tools/gen-logic-levels.cjs  regenerates js/levels.js
```

## Privacy and safety
No accounts, ads, purchases, personal questions, or network calls apart from
Google Fonts (optional). The game never requests the microphone. In the bundled
build, the embedded Classic Snake also has speech recognition switched off, so
its "Say it" mode falls back to tapping.
