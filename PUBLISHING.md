# Publishing Fruit Snake to the App Store & Google Play

This is the full, honest, start-to-finish path from this code to two live,
money-making apps. Nothing here is skippable hand-waving — where a step costs
money or needs a Mac, it says so.

> **What you can do without me:** everything below is doable by one person. The
> only hard requirements are a **Mac with Xcode** for the iOS build (Apple does
> not allow iOS builds from Windows/Linux), and paid developer accounts.

---

## 0. What it costs & what you need

| Thing | Cost | Needed for |
|---|---|---|
| Apple Developer Program | **US$99 / year** | App Store |
| Google Play Developer | **US$25 one-time** | Google Play |
| A Mac + Xcode (free) | — (a Mac) | building/submitting iOS |
| Android Studio (free) | — | building/submitting Android |
| AdMob account (free) | — | ad revenue |
| RevenueCat account (free tier) | — | the in-app purchase |
| Privacy-policy URL | free (GitHub Pages) | both stores require it |

**Reality check:** Snake is a saturated genre. Expect small revenue at first.
Money follows downloads × retention × ad/IAP tuning — budget for marketing and
iterate. This project is built to be *shippable and correctly monetized*; it is
not a guarantee of sales.

---

## 1. Get the game running locally (5 minutes)

```bash
npm install
npm run serve            # opens http://localhost:8080 — play it in a browser
```

In the browser, ads and purchases are **simulated** (a confirm dialog stands in
for the ad/store). That's expected — the real SDKs only run inside the native app.

---

## 2. Create the native projects

```bash
npm install                 # installs Capacitor + plugins
npx cap add android         # creates ./android (commit-optional; see .gitignore)
npx cap add ios             # creates ./ios   (Mac only)
npm run sync                # copies www/ + plugins into the native projects
```

Generate all icon/splash sizes from `assets/icon.svg`:

```bash
# export assets/icon.svg to a 1024x1024 assets/icon.png first (any tool / online SVG->PNG),
# then:
npx @capacitor/assets generate --iconBackgroundColor '#eafce9'
```

---

## 3. Set your real app identity

- Edit **`capacitor.config.json`** → `appId` to your own reverse-domain id, e.g.
  `com.yourname.fruitsnake` (this is permanent per store listing — choose well).
- Bump `version` in `package.json` for each release.
- Android version code / iOS build number are set in Android Studio / Xcode.

---

## 4. Set up AdMob (the ad money)

1. Create an **AdMob account** → add two apps (iOS + Android).
2. For each app, create **one Rewarded** and **one Interstitial** ad unit.
3. Put the **App IDs** in `capacitor.config.json` → `plugins.AdMob.appIdAndroid` /
   `appIdIos`.
4. Put the **ad-unit IDs** in `www/money.js` → `CONFIG` (replace the Google test
   IDs). Keep `childDirected: true` for family-safe, non-personalized ads.
5. Android also needs the AdMob App ID in `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
              android:value="ca-app-pub-XXXXXXXX~XXXXXXXX"/>
   ```
   iOS needs it in `ios/App/App/Info.plist` under key `GADApplicationIdentifier`.

**Keep the Google TEST IDs while developing.** Clicking your *own* live ads gets
your AdMob account banned. Only swap to real IDs for the store build, and never
tap them yourself.

---

## 5. Set up the in-app purchase ("Unlock All")

Easiest cross-store path is **RevenueCat** (it wraps both stores' billing):

1. Create the product **`unlock_all`** (a **non-consumable**) in **both**
   App Store Connect and Google Play Console. Set your price (e.g. US$1.99).
2. Create a **RevenueCat** project, connect both stores, add an **Entitlement**
   named `unlock_all` and attach the product, then create an **Offering**.
3. In `www/money.js`, uncomment `Purchases.configure({ apiKey: ... })` in
   `init()` and paste your RevenueCat public API key.
4. That's it — `buyUnlockAll()`, `restore()`, and ownership checks already call
   the plugin. A **Restore purchase** button is in the shop (Apple requires it).

Prefer no RevenueCat? Swap in a native billing plugin (e.g.
`@capacitor-community/in-app-purchases`) and wire the same three functions in
`money.js`. The game only calls `Money.buyUnlockAll/restore/isOwned`.

---

## 6. Build & test on a real device

```bash
npm run sync
npm run open:android     # Android Studio → Run on a device/emulator
npm run open:ios         # Xcode → set your Team, Run on a device (Mac only)
```

Test: rewarded "Continue" shows a **test** ad and revives; interstitial appears
every 3rd game over; buying `unlock_all` (use a **sandbox/tester** account)
removes ads and unlocks skins; **Restore** works on a fresh install.

---

## 7. Store listings

Use the ready copy in **[STORE_LISTING.md](STORE_LISTING.md)** (title, subtitle,
description, keywords) and the screenshot plan there.

- **Privacy policy:** host `PRIVACY_POLICY.md` at a public URL (GitHub Pages is
  free) and paste that URL into both stores. Required because you show ads.
- **Content rating:** complete each store's questionnaire honestly → you'll get
  **Everyone / 4+**. Declare that the app **shows ads** and **has a purchase**.
- **Data safety (Google) / Privacy “nutrition label” (Apple):** AdMob collects
  device/usage data for ads — both consoles have a guided AdMob disclosure;
  follow it. With `childDirected:true` you're requesting non-personalized ads.
- **Kids category:** only opt into Google **“Designed for Families”** / Apple
  **Kids** if you commit to child-safe (non-personalized) ads and stricter
  review. This project's defaults are compatible with that if you choose it.

---

## 8. Submit

**Android (Google Play Console):**
1. Create app → fill listing, rating, data safety, privacy URL.
2. In Android Studio: **Build → Generate Signed Bundle (.aab)** (create & SAFELY
   keep your upload keystore — losing it means you can't update the app).
3. Upload the `.aab` to a **Closed testing** track first → then **Production**.

**iOS (App Store Connect, Mac):**
1. Create the app record (bundle id must match `appId`).
2. Xcode: **Product → Archive → Distribute App → App Store Connect**.
3. Add screenshots, description, privacy answers → submit for review.

Both stores review new apps; approval usually takes hours-to-days. Fix any
rejection notes and resubmit.

---

## 9. After launch (this is where the money actually comes from)

- Watch **AdMob eCPM** and **retention**; tune `interstitialEvery` in
  `money.js` (too many ads → churn; too few → no revenue).
- Add a light **daily reward** or **level goals** to lift retention.
- Localize the listing; ASO (keywords) is free downloads.
- Ship small updates often — stores favor active apps.

---

## File map

| Path | What it is |
|---|---|
| `www/index.html` | The game UI (self-contained, no network needed). |
| `www/game.js` | Gameplay, skins, rewarded-ad revive. |
| `www/money.js` | Ads + IAP bridge — **edit CONFIG with your real IDs**. |
| `capacitor.config.json` | App id/name + AdMob app IDs. |
| `assets/icon.svg` | Master icon → run the assets generator. |
| `STORE_LISTING.md` | Copy-paste store text + screenshot plan. |
| `PRIVACY_POLICY.md` | Host this and link it in both stores. |
| `android/`, `ios/` | Generated native projects (created by `cap add`). |
