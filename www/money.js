/* money.js — monetization bridge for Fruit Snake.
 *
 * Wraps AdMob (rewarded + interstitial) and a one-time in-app purchase
 * ("unlock_all": removes ads + unlocks every skin). It is written so the game
 * works EVERYWHERE:
 *   - In a plain browser (itch.io, GitHub Pages, testing): everything is a safe
 *     simulation — a rewarded ad "succeeds" after a short confirm, purchases are
 *     stored locally. No real money, no crashes.
 *   - In the native app (Capacitor): if the AdMob / Purchases plugins are
 *     installed and configured (see PUBLISHING.md), the real SDKs are used.
 *
 * Replace the TEST ad unit IDs and product id below with your real values from
 * the AdMob console and App Store / Play Console before you ship. Full steps in
 * PUBLISHING.md.
 */
(function () {
  "use strict";

  // ---- CONFIG: replace before shipping (kept as Google TEST ids for now) ----
  const CONFIG = {
    // AdMob test unit ids (safe to build with; swap for your real ids to earn):
    rewardedAndroid:      "ca-app-pub-3940256099942544/5224354917",
    rewardedIos:          "ca-app-pub-3940256099942544/1712485313",
    interstitialAndroid:  "ca-app-pub-3940256099942544/1033173712",
    interstitialIos:      "ca-app-pub-3940256099942544/4411468910",
    productId:            "unlock_all",      // create this IAP in both stores
    childDirected:        true,              // family-safe, non-personalized ads
    interstitialEvery:    3                  // show an interstitial every N games
  };

  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const plugins  = (window.Capacitor && window.Capacitor.Plugins) || {};
  const AdMob    = plugins.AdMob || null;
  const Purchases= plugins.Purchases || null;         // @revenuecat/purchases-capacitor
  const platform = (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform()) || "web";

  const LS_OWNED = "fs_unlocked_all";
  let owned = localStorage.getItem(LS_OWNED) === "1";
  let deaths = 0;

  const rewardedId     = platform === "ios" ? CONFIG.rewardedIos     : CONFIG.rewardedAndroid;
  const interstitialId = platform === "ios" ? CONFIG.interstitialIos : CONFIG.interstitialAndroid;

  // ------------------------------------------------------------------ init ---
  async function init() {
    if (isNative && AdMob) {
      try {
        await AdMob.initialize({
          requestTrackingAuthorization: false,
          initializeForTesting: false
        });
      } catch (e) { console.warn("AdMob init failed", e); }
    }
    if (isNative && Purchases) {
      try {
        // apiKey comes from RevenueCat; set in PUBLISHING.md step. Left blank to
        // avoid shipping a placeholder that looks real.
        // await Purchases.configure({ apiKey: "YOUR_REVENUECAT_KEY" });
        await refreshOwned();
      } catch (e) { console.warn("Purchases init failed", e); }
    }
  }

  // -------------------------------------------------------------- rewarded ---
  // Returns a Promise<boolean>: true if the user earned the reward.
  async function showRewarded() {
    if (owned) return true;                 // paid users: instant reward, no ad
    if (isNative && AdMob) {
      try {
        await AdMob.prepareRewardVideoAd({ adId: rewardedId, isTesting: false, npa: CONFIG.childDirected });
        const res = await AdMob.showRewardVideoAd();
        // plugin resolves with the reward item when earned
        return !!res;
      } catch (e) { console.warn("rewarded failed", e); return false; }
    }
    // browser fallback: a friendly simulated ad
    return new Promise((resolve) => {
      const ok = window.confirm("📺 (Ad) Watch a short video to continue?\n\n[OK] = reward earned  ·  [Cancel] = skip");
      setTimeout(() => resolve(ok), 250);
    });
  }

  // ---------------------------------------------------------- interstitial ---
  async function maybeInterstitial() {
    deaths += 1;
    if (owned) return;
    if (deaths % CONFIG.interstitialEvery !== 0) return;
    if (isNative && AdMob) {
      try {
        await AdMob.prepareInterstitial({ adId: interstitialId, isTesting: false, npa: CONFIG.childDirected });
        await AdMob.showInterstitial();
      } catch (e) { console.warn("interstitial failed", e); }
    } else {
      // keep the browser build quiet — no fake popups between every few games
    }
  }

  // --------------------------------------------------------------- purchase --
  async function buyUnlockAll() {
    if (owned) return { ok: true, already: true };
    if (isNative && Purchases) {
      try {
        const offerings = await Purchases.getOfferings();
        const pkg = offerings?.current?.availablePackages?.[0];
        if (!pkg) throw new Error("no offering configured");
        const info = await Purchases.purchasePackage({ aPackage: pkg });
        const active = info?.customerInfo?.entitlements?.active || {};
        if (active[CONFIG.productId] || Object.keys(active).length) { setOwned(true); return { ok: true }; }
        return { ok: false };
      } catch (e) { console.warn("purchase failed", e); return { ok: false, error: e }; }
    }
    // browser fallback: simulate a store sheet
    const ok = window.confirm("🛍️ (Store) Unlock All — one-time purchase.\n\n[OK] = simulate successful purchase");
    if (ok) setOwned(true);
    return { ok };
  }

  async function restore() {
    if (isNative && Purchases) {
      try {
        const info = await Purchases.restorePurchases();
        const active = info?.customerInfo?.entitlements?.active || {};
        const has = !!active[CONFIG.productId] || Object.keys(active).length > 0;
        setOwned(has);
        return has;
      } catch (e) { console.warn("restore failed", e); return owned; }
    }
    return owned;
  }

  async function refreshOwned() {
    if (isNative && Purchases) {
      try {
        const info = await Purchases.getCustomerInfo();
        const active = info?.customerInfo?.entitlements?.active || {};
        setOwned(!!active[CONFIG.productId] || Object.keys(active).length > 0);
      } catch (e) {/* ignore */}
    }
  }

  function setOwned(v) {
    owned = !!v;
    localStorage.setItem(LS_OWNED, owned ? "1" : "0");
    document.dispatchEvent(new CustomEvent("fs-ownership", { detail: { owned } }));
  }

  window.Money = {
    init,
    showRewarded,
    maybeInterstitial,
    buyUnlockAll,
    restore,
    isOwned: () => owned,
    isNative,
    productId: CONFIG.productId
  };
})();
