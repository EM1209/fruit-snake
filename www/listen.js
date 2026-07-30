/* listen.js — the "Little Voices" microphone.
 *
 * The other half of the learning loop: the game says a word, then the child
 * says it back. This wraps the browser's speech recognition and hands the game
 * a single friendly question — "did they say "apple"?" — with all the flakiness
 * (permissions, silence, timeouts, platforms without recognition) absorbed here.
 *
 * Three modes, remembered between sessions:
 *   "off"  — no say-it-back at all (the default; nothing touches the mic)
 *   "mic"  — listen with the microphone and cheer when the word matches
 *   "tap"  — no microphone: show the word, child says it out loud, grown-up or
 *            child taps "I said it!". Used where recognition is unavailable or
 *            when a parent prefers no mic. The learning still happens.
 *
 * Nothing is ever recorded, saved, or uploaded by this game — see
 * PRIVACY_POLICY.md for what the platform's own speech service may do.
 */
(function () {
  "use strict";

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const M = window.FS_MATCH;
  const LS_MODE = "fs_saymode";

  let mode = localStorage.getItem(LS_MODE) || "off";
  if (mode === "mic" && !SR) mode = "tap";        // device can't listen anymore
  let token = 0;                                  // bumped to abandon a turn
  let settle = null;                              // settles the in-flight listen

  const available = () => !!SR;

  function setMode(m) {
    mode = (m === "mic" && !SR) ? "tap" : (m || "off");
    localStorage.setItem(LS_MODE, mode);
    if (mode === "off") abort();
    return mode;
  }

  // Stop listening now. Any in-flight listenFor() resolves with "aborted", so
  // the caller is never left waiting on a promise that can no longer settle.
  function abort() {
    token++;
    const done = settle;
    if (done) done({ ok: false, quality: "none", heard: "", reason: "aborted" });
  }

  /* Listen for one word. Always resolves — never rejects:
   *   { ok, quality, heard, reason }
   * reason is "match" | "mismatch" | "quiet" | "denied" | "network" |
   *          "unavailable" | "aborted"
   */
  function listenFor(target, opts) {
    const o = opts || {};
    const ms = o.ms || 6000;
    if (!SR || mode !== "mic") {
      return Promise.resolve({ ok: false, quality: "none", heard: "", reason: "unavailable" });
    }
    abort();
    const mine = ++token;

    return new Promise((resolve) => {
      let done = false, timer = null, bestHeard = "";

      const finish = (out) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (settle === finish) settle = null;
        try { r.onresult = r.onerror = r.onend = null; r.abort(); } catch (e) {/* fine */}
        resolve(out);
      };
      settle = finish;

      let r;
      try { r = new SR(); } catch (e) {
        return finish({ ok: false, quality: "none", heard: "", reason: "unavailable" });
      }
      r.lang = o.lang || "en-US";
      r.continuous = false;
      r.interimResults = true;      // react the moment the word lands
      r.maxAlternatives = 5;

      r.onresult = (ev) => {
        if (mine !== token) return finish({ ok: false, quality: "none", heard: "", reason: "aborted" });
        const guesses = [];
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          for (let j = 0; j < res.length; j++) guesses.push(res[j].transcript);
        }
        const hit = M.best(guesses, target);
        if (hit.heard) bestHeard = hit.heard;
        if (o.onHeard && bestHeard) o.onHeard(bestHeard);
        if (hit.ok) finish({ ok: true, quality: hit.quality, heard: hit.heard, reason: "match" });
      };

      r.onerror = (ev) => {
        const e = (ev && ev.error) || "";
        const reason = (e === "not-allowed" || e === "service-not-allowed") ? "denied"
                     : (e === "no-speech") ? "quiet"
                     : (e === "network") ? "network"
                     : (e === "aborted") ? "aborted"
                     : "mismatch";
        finish({ ok: false, quality: "none", heard: bestHeard, reason });
      };

      r.onend = () => finish({
        ok: false, quality: "none", heard: bestHeard,
        reason: bestHeard ? "mismatch" : "quiet"
      });

      try { r.start(); } catch (e) {
        return finish({ ok: false, quality: "none", heard: "", reason: "unavailable" });
      }
      timer = setTimeout(() => {
        try { r.stop(); } catch (e) {/* onend will land anyway */}
        finish({ ok: false, quality: "none", heard: bestHeard, reason: bestHeard ? "mismatch" : "quiet" });
      }, ms);
    });
  }

  // Stop listening if the app goes to the background mid-turn.
  document.addEventListener("visibilitychange", () => { if (document.hidden) abort(); });

  window.Listen = {
    available, listenFor, abort,
    mode: () => mode,
    setMode,
    isOn: () => mode !== "off"
  };
})();
