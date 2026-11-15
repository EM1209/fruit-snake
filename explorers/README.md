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
node tools/e2e-explorers.cjs http://localhost:8770/explorers/index.html   # real-browser check (Playwright)
```

## Worlds and activities

| World | Activity | How you play | Explore → Practice → Challenge |
|---|---|---|---|
| Word Garden | Snack Hunt | steer & collect | eat anything to hear names → find the named snack → find it from a written clue |
| | Letter Line | put in order | copy 3-letter words → spell 4-letter words you hear → spell longer words from a picture, with a spare letter |
| Number Meadow | Berry Basket | steer & collect | count to 5 with a filling frame → up to 8 → work out a sum, then collect it |
| | Meadow Math | tap to choose | count & compare groups → adding with pictures, number patterns → subtraction, missing numbers, word problems |
| Pattern Playground | Pattern Path | tap to choose | AB patterns → longer patterns + odd one out → two changes at once, rule-based odd one out |
| | Shape Sort | sort | by shape → by color → by number of straight sides |
| Nature Trail | Habitat Homes | sort | 2 habitats → 3 → 4, where some animals fit more than one |
| | Life Cycles | put in order | 3 stages → full butterfly/frog cycles → 5-stage plant + the seasons (any start) |
| | Nature Walk | explore | discover facts → facts then questions → "Who am I?" riddles |
| Logic Lab | Code the Snake | plan & run | small grids → route around rocks → get the key first, with an arrow limit |
| Everyday Adventures | Step by Step | put in order | 3 steps → full routines → full routines plus a card that doesn't belong |
| | Ready for Weather | tap to choose (several) | pick one helpful thing → pick two, pack a picnic list → pick everything; plan for rain |
| | Kind Choices | tap to choose | think about kind choices → several fit → find every kind choice |

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
```

## Privacy and safety
No accounts, ads, purchases, personal questions, or network calls apart from
Google Fonts (optional). The game never requests the microphone. In the bundled
build, the embedded Classic Snake also has speech recognition switched off, so
its "Say it" mode falls back to tapping.
