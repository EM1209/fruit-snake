/* store.js — Snake Explorers persistence.
 * One JSON record under its own key, so it can never touch Fruit Snake's
 * "fs_*" saves. If storage is blocked (private window, sandboxed frame), play
 * continues with a session-only copy and the UI shows a small note.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./logic.js"));
  else root.SE_Store = factory(root.SE_Logic);
})(typeof self !== "undefined" ? self : this, function (L) {
  "use strict";
  const KEY = "snakeExplorers.v1";
  const DEFAULT_SETTINGS = { voice: true, sound: true, motion: "system", speed: "relaxed", textSize: "standard", mode: "explore" };
  const DEFAULT_LOOK = { color: "purple", pattern: "plain", accessory: "none" };

  function create(storage) {
    let persistent = true;
    let data = null;

    function fresh() {
      return { v: 1, settings: Object.assign({}, DEFAULT_SETTINGS), look: Object.assign({}, DEFAULT_LOOK), progress: L.emptyProgress(), seenUnlocks: [] };
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
            data.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings);
            data.look = Object.assign({}, DEFAULT_LOOK, d.look);
            data.progress = Object.assign(L.emptyProgress(), d.progress);
            data.progress.stats = Object.assign(L.emptyProgress().stats, d.progress && d.progress.stats);
            data.seenUnlocks = Array.isArray(d.seenUnlocks) ? d.seenUnlocks : [];
          }
        } catch (e) { /* corrupt save: start fresh, don't crash */ }
      }
      // a write probe catches "readable but not writable" storage
      if (persistent) {
        try { storage.setItem(KEY, JSON.stringify(data)); } catch (e) { persistent = false; }
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
