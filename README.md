# 🍓 Fruit Snake 🐍

> **New: [Snake Explorers](explorers/README.md)** is a learning-through-play garden adventure with six worlds,
> six ways to play, and Explore / Practice / Challenge modes. It lives in `explorers/`
> (`npm run serve:explorers`, `npm run test:explorers`). The original Fruit Snake game below is unchanged
> and is reachable from Snake Explorers as **Classic Snake**.

A bright, kid-friendly **Snake** game built to ship to the **App Store** and
**Google Play** and earn from ads + an in-app purchase. One HTML5 codebase,
wrapped as a real native app with [Capacitor](https://capacitorjs.com).

- **Play it now (browser):** `npm run serve` → <http://localhost:8080>
- **Ship it:** follow **[PUBLISHING.md](PUBLISHING.md)** step by step.

## Learning while playing
Every time the snake collects something, the game **says the word out loud**,
shows it in big friendly letters, and sparkles:

> 🍎 **Apple** — *"Apple… Yummy, an apple!"*
> 🥦 **Broccoli** — *"Broccoli… Mmm, green broccoli!"*

- **4 categories** to collect — 🍎 Fruits · 🥕 Vegetables · 🥨 Healthy Snacks ·
  🌈 Rainbow Mix (36 words total), each with its own board colors.
- **Clear speech first:** the name is spoken alone, then the fun sentence — so
  the word lands before the reaction.
- **"NEW!" badge** the first time a child finds something, plus a **progress
  tracker** ("7 / 12 Fruits learned") with grayed-out emoji filling in as they
  discover each one. Progress is saved between sessions.
- **New words are prioritized** — the game prefers to spawn items the child
  hasn't collected yet, so learning keeps moving.
- 🗣️ **Voice toggle** for quiet time; grammar is handled properly
  ("a red apple", "an orange") since children are learning these words.

## 🎤 Little Voices — the child says it back
Hearing a word teaches it; *saying* it makes it theirs. Turn on **🎤 Say it** and
the loop closes: the snake collects an apple, the game says **"Apple"**, the
board freezes, and it's the child's turn.

- **Nobody crashes while they're talking** — the snake stops dead for the turn,
  so speaking is never punished by losing the game.
- **Forgiving on purpose** — "brockly" counts as *broccoli*, "nana" as *banana*,
  "grape" as *grapes*, and the word inside a sentence ("it's an apple!") counts
  too. The rules live in `www/match.js` and are pinned down by `npm test`,
  including a check that **no two words in the game can be confused** — "apple"
  must never pass as "pineapple".
- **Two tries, then kindness** — a miss is answered by the word said slowly
  again, never a "wrong". A ⭐ for every word they say, a green ring on the
  tracker, and a "🎤 said" count next to the learned count.
- **No microphone? Still works.** Where speech recognition is missing (iOS
  webviews, older Androids) or a parent prefers it, the mode becomes **"say it,
  then tap ⭐"** — same words, same praise, nothing listening.
- **Off by default, behind a grown-up check.** Switching the mic on needs a sum
  a preschooler can't do. Audio is never recorded, stored, or sent anywhere by
  the game — but the platform's recognizer may be a cloud service, which
  [PRIVACY_POLICY.md](PRIVACY_POLICY.md) says plainly. Shipping to a **kids
  category**? Ship tap-only — see [PUBLISHING.md §5b](PUBLISHING.md).

## Why kids stay (and why that helps retention)
- **Friendly walls** — the snake wraps to the other side instead of dying, so
  little players stay in the game.
- **Big controls** — swipe, on-screen arrows, or keyboard.
- **Cute snake** with googly eyes + tongue, happy sounds (mutable), encouraging
  messages, and a **New best! 🏆** moment.
- **Collectable skins** — the hook behind the purchase.

## How it makes money
| Lever | Where | Notes |
|---|---|---|
| Rewarded ad — "❤️ Continue" | after a good run | opt-in; players *choose* to watch |
| Interstitial ad | every 3rd game over | paced; tune in `www/money.js` |
| In-app purchase — "Unlock All" | Shop | removes ads + unlocks all 7 skins |

All ad/IAP calls go through `www/money.js`, which **simulates** them in a browser
and uses the **real SDKs** (AdMob + RevenueCat) in the native app. Swap the test
IDs in `money.js`/`capacitor.config.json` for your own before shipping — see
[PUBLISHING.md §4–5](PUBLISHING.md).

## Project layout
```
www/               the game (self-contained, no network needed)
  index.html         UI + styles
  data.js            the learning content — categories, words, reaction phrases
  voice.js           child-friendly speech (device TTS, offline, free)
  listen.js          🎤 the child's turn — microphone or tap, one seam to swap
  match.js           "is 'brockly' close enough to 'broccoli'?" (pure, tested)
  game.js            gameplay, skins, learning moments, rewarded-ad revive
  money.js           ads + purchase bridge  ← put your real IDs here
  tests/             `npm test` — the matching rules, no browser needed
capacitor.config.json  app id/name + AdMob app IDs
assets/icon.svg    master icon → `npx @capacitor/assets generate`
PUBLISHING.md      full store-submission walkthrough (accounts, ads, IAP, build)
STORE_LISTING.md   ready-to-paste title/description/keywords + screenshot plan
PRIVACY_POLICY.md  host this and link it in both stores (required for ads)
analysis/          a separate, earlier lottery-math study (unrelated to the game)
```

## Quick start
```bash
npm install
npm run serve                 # play in a browser (ads/purchases simulated)
npm test                      # check the "close enough" word-matching rules

npx cap add android           # create native projects
npx cap add ios               # (Mac + Xcode required for iOS)
npm run sync                  # push www/ + plugins into them
npm run open:android          # build/run in Android Studio
npm run open:ios              # build/run in Xcode
```

## Honest expectations
Snake is a crowded category — this repo gives you a *polished, correctly
monetized, submittable* app, not guaranteed sales. Revenue comes from downloads
× retention × ad tuning. Ship, watch AdMob + retention, and iterate
([PUBLISHING.md §9](PUBLISHING.md)).

## License
MIT — do what you like, including selling it. No warranty.
