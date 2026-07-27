# 🍓 Fruit Snake 🐍

A bright, kid-friendly **Snake** game built to ship to the **App Store** and
**Google Play** and earn from ads + an in-app purchase. One HTML5 codebase,
wrapped as a real native app with [Capacitor](https://capacitorjs.com).

- **Play it now (browser):** `npm run serve` → <http://localhost:8080>
- **Ship it:** follow **[PUBLISHING.md](PUBLISHING.md)** step by step.

## Why kids like it (and why that helps retention)
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
  game.js            gameplay, skins, rewarded-ad revive
  money.js           ads + purchase bridge  ← put your real IDs here
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
