/* voice.js — clear, friendly speech for young children.
 *
 * Uses the device's built-in speech synthesis (free, offline on most devices,
 * works in browsers and inside the Capacitor webview). Tuned for kids:
 * slightly slower rate, bright pitch, and a preference for a natural English
 * voice. Speaking the item name is the core learning moment, so it is spoken
 * on its own first, then the fun reaction sentence.
 *
 * If speech is unavailable (rare, or muted), the game still shows the big word
 * on screen and plays a cheerful chime, so nothing is lost.
 */
(function () {
  "use strict";

  const synth = window.speechSynthesis || null;
  let voice = null;
  let enabled = localStorage.getItem("fs_voice") !== "0";

  function pickVoice() {
    if (!synth) return;
    const vs = synth.getVoices() || [];
    if (!vs.length) return;
    const en = vs.filter(v => /^en(-|_|$)/i.test(v.lang));
    const pool = en.length ? en : vs;
    // prefer voices that tend to sound friendly/natural
    const preferred = ["samantha","karen","moira","tessa","google us english",
                       "microsoft aria","microsoft jenny","microsoft zira","female"];
    for (const want of preferred) {
      const hit = pool.find(v => v.name.toLowerCase().includes(want));
      if (hit) { voice = hit; return; }
    }
    voice = pool[0];
  }

  if (synth) {
    pickVoice();
    if (typeof synth.onvoiceschanged !== "undefined") {
      synth.onvoiceschanged = pickVoice;
    }
  }

  function speak(text, opts) {
    if (!enabled || !synth || !text) return false;
    const o = opts || {};
    try {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || "en-US";
      u.rate = o.rate || 0.9;    // a little slower for clarity
      u.pitch = o.pitch || 1.25; // bright and playful
      u.volume = 1;
      if (o.onDone) {
        let fired = false;
        const once = () => { if (!fired) { fired = true; o.onDone(); } };
        u.onend = once;
        u.onerror = once;
        // some webviews never fire onend — don't leave the caller waiting
        setTimeout(once, Math.max(1200, text.length * 130));
      }
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }

  // Say the NAME clearly, then the fun sentence just after. `onDone` (optional)
  // fires when the last utterance finishes — the say-it-back turn waits for it
  // so the microphone never hears the game talking to itself.
  function sayItem(name, sentence, onDone) {
    if (!enabled || !synth) { if (onDone) setTimeout(onDone, 0); return false; }
    cancel();
    const said = speak(name, { rate: 0.78, pitch: 1.3, onDone: sentence ? null : onDone });
    if (sentence) {
      // small gap so the name lands on its own first
      setTimeout(() => {
        const ok = speak(sentence, { rate: 0.92, pitch: 1.22, onDone });
        if (!ok && onDone) onDone();
      }, 30);
    } else if (!said && onDone) setTimeout(onDone, 0);
    return said;
  }

  // Say something and then run a callback (used before we start listening).
  function sayThen(text, onDone, opts) {
    const o = Object.assign({}, opts || {}, { onDone });
    if (!speak(text, o) && onDone) setTimeout(onDone, 0);
  }

  function cancel() { try { synth && synth.cancel(); } catch (e) {} }

  function setEnabled(v) {
    enabled = !!v;
    localStorage.setItem("fs_voice", enabled ? "1" : "0");
    if (!enabled) cancel();
  }

  // Browsers require a user gesture before audio; call once on first tap.
  function unlock() {
    if (!synth || !enabled) return;
    try { speak(" ", { rate: 1 }); } catch (e) {}
  }

  window.Voice = {
    speak, sayItem, sayThen, cancel, unlock,
    setEnabled,
    isEnabled: () => enabled,
    available: () => !!synth
  };
})();
