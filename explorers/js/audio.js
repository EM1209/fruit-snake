/* audio.js — Snake Explorers voice (speech synthesis) and sound effects.
 * Voice and sound are independent switches. Nothing here ever listens:
 * no microphone, no speech recognition. If speech synthesis is missing,
 * everything still works on screen.
 */
(function (root) {
  "use strict";
  const synth = (typeof window !== "undefined" && window.speechSynthesis) || null;
  let voiceOn = true, soundOn = true, chosen = null, ac = null;

  function pickVoice() {
    if (!synth) return;
    let list = [];
    try { list = synth.getVoices() || []; } catch (e) { list = []; }
    const en = list.filter(v => /^en(-|_|$)/i.test(v.lang));
    const prefer = ["Samantha", "Google US English", "Karen", "Moira", "Tessa", "Microsoft Aria", "Microsoft Jenny"];
    chosen = prefer.map(n => en.find(v => v.name.indexOf(n) === 0)).find(Boolean) || en.find(v => v.localService) || en[0] || null;
  }
  if (synth) {
    pickVoice();
    try { synth.addEventListener ? synth.addEventListener("voiceschanged", pickVoice) : (synth.onvoiceschanged = pickVoice); } catch (e) {}
  }

  function speak(text, opts) {
    if (!voiceOn || !synth || !text) return false;
    const o = opts || {};
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (chosen) u.voice = chosen;
      u.lang = (chosen && chosen.lang) || "en-US";
      u.rate = o.rate || 0.92;
      u.pitch = o.pitch || 1.1;
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function stop() { try { synth && synth.cancel(); } catch (e) {} }

  function tone(freqs, dur, type, gain) {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const t0 = ac.currentTime;
      freqs.forEach((f, i) => {
        const osc = ac.createOscillator(), g = ac.createGain();
        osc.type = type || "sine"; osc.frequency.value = f;
        const s = t0 + i * dur * 0.85;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(gain || 0.12, s + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
        osc.connect(g).connect(ac.destination); osc.start(s); osc.stop(s + dur + 0.02);
      });
    } catch (e) { /* no audio available: visuals carry the feedback */ }
  }
  const sfx = {
    tap: () => tone([660], 0.06, "triangle", 0.06),
    pick: () => tone([523, 784], 0.1, "triangle", 0.12),
    right: () => tone([659, 880, 1047], 0.12, "sine", 0.12),
    retry: () => tone([392, 330], 0.14, "sine", 0.08),   // soft, never harsh
    done: () => tone([523, 659, 784, 1047], 0.14, "sine", 0.12),
    step: () => tone([440], 0.05, "square", 0.03)
  };

  root.SE_Audio = {
    speak, stop, sfx,
    setVoice(v) { voiceOn = !!v; if (!voiceOn) stop(); },
    setSound(v) { soundOn = !!v; },
    voiceAvailable: () => !!synth
  };
})(typeof self !== "undefined" ? self : this);
