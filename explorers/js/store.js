/* store.js — Snake Explorers persistence.
 * One JSON record under its own key, so it can never touch Fruit Snake's
 * "fs_*" saves. If storage is blocked (private window, sandboxed frame), play
 * continues with a session-only copy and the UI shows a small note.
 *
 * Schema changes are ADDITIVE ONLY (still v:1): first-release saves load as-is,
 * new fields (history, played) get safe defaults, and unknown fields are kept.
 * Loading never writes over an existing save; writability is probed with a
 * separate key.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./logic.js"), require("./deck.js"));
  else root.SE_Store = factory(root.SE_Logic, root.SE_Deck);
})(typeof self !== "undefined" ? self : this, function (L, Deck) {
  "use strict";
  const KEY = "snakeExplorers.v1";
  const PROBE = "snakeExplorers.probe";
  const DEFAULT_SETTINGS = { voice: true, sound: true, motion: "system", speed: "relaxed", textSize: "standard", mode: "explore" };
  const DEFAULT_LOOK = { color: "purple", pattern: "plain", accessory: "none" };

  function cleanPlayed(p) {
    const out = {};
    if (p && typeof p === "object") for (const [k, v] of Object.entries(p)) if (typeof k === "string" && Number.isFinite(v) && v >= 0) out[k] = Math.floor(v);
    return out;
  }

  function create(storage) {
    let persistent = true;
    let data = null;

    function fresh() {
      return { v: 1, settings: Object.assign({}, DEFAULT_SETTINGS), look: Object.assign({}, DEFAULT_LOOK), progress: L.emptyProgress(), seenUnlocks: [],
        history: Deck.sanitize(null), played: {} };
    }
    function load() {
      let raw = null;
      try { raw = storage ? storage.getItem(KEY) : null; if (!storage) persistent = false; }
      catch (e) { persistent = false; }
      data = fresh();
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d && d.v === 1) {
            // keep anything we don't know about, then normalize what we do
            data = Object.assign({}, d, data);
            data.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings);
            data.look = Object.assign({}, DEFAULT_LOOK, d.look);
            data.progress = Object.assign(L.emptyProgress(), d.progress);
            data.progress.stats = Object.assign(L.emptyProgress().stats, d.progress && d.progress.stats);
            if (!data.progress.concepts || typeof data.progress.concepts !== "object") data.progress.concepts = {};
            data.seenUnlocks = Array.isArray(d.seenUnlocks) ? d.seenUnlocks : [];
            data.history = Deck.sanitize(d.history);
            data.played = cleanPlayed(d.played);
          }
        } catch (e) { /* unreadable save: play from a fresh copy; the old text is left untouched until the next save */ }
      }
      if (persistent) {
        try { storage.setItem(PROBE, "1"); storage.removeItem && storage.removeItem(PROBE); } catch (e) { persistent = false; }
      }
      return data;
    }
    function save() {
      if (!persistent) return false;
      try { storage.setItem(KEY, JSON.stringify(data)); return true; }
      catch (e) { persistent = false; return false; }
    }
    function reset() {
      const keepSettings = data.settings;
      data = fresh();
      data.settings = keepSettings;
      save();
      return data;
    }
    return { load, save, reset, get: () => data, isPersistent: () => persistent, KEY };
  }

  function browserStorage() {
    try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; }
  }

  return { create, browserStorage, KEY, DEFAULT_SETTINGS, DEFAULT_LOOK };
});
