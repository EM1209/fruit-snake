/* match.js — forgiving word matching for little voices.
 *
 * When a three-year-old says "brockly" and the speech recognizer hears
 * "brockley", the game should still cheer. This file decides whether what was
 * heard is close enough to the word we asked for. It is deliberately generous:
 * a false "yes" costs a child nothing, a false "no" costs them their nerve.
 *
 * Pure logic, no DOM — so it runs in the game and under `npm test`.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FS_MATCH = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Words children (and recognizers) sprinkle around the answer.
  const FILLER = new Set([
    "a", "an", "the", "um", "uh", "er", "hmm", "oh", "ah",
    "i", "its", "it", "is", "was", "that", "thats", "this",
    "said", "say", "saying", "know", "think", "one", "some",
    "yummy", "yay", "please", "mummy", "mommy", "daddy", "look"
  ]);

  const normalize = (s) =>
    String(s || "").toLowerCase().replace(/[^a-z\s]+/g, " ").replace(/\s+/g, " ").trim();

  function words(s) {
    const all = normalize(s).split(" ").filter(Boolean);
    const kept = all.filter((w) => !FILLER.has(w));
    return kept.length ? kept : all;   // "it" alone is better than nothing
  }

  // Rough plural folding. Both sides get the same treatment, so it only has to
  // be consistent — not linguistically perfect ("cheese" → "chees" is fine).
  function stem(w) {
    if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.length > 4 && w.endsWith("oes")) return w.slice(0, -2);
    if (w.length > 4 && w.endsWith("es")) return w.slice(0, -1);
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    return w;
  }

  // A crude "how does it sound" squeeze: collapse doubles and fold letters that
  // children and recognizers swap freely. "broccoli" → "brokoli", "brockly" →
  // "brokli", so the two end up one edit apart.
  function soundish(w) {
    return w
      .replace(/ck/g, "k").replace(/ph/g, "f").replace(/gh/g, "g")
      .replace(/c/g, "k").replace(/q/g, "k").replace(/x/g, "ks")
      .replace(/z/g, "s").replace(/y/g, "i").replace(/w/g, "v")
      .replace(/(.)\1+/g, "$1");
  }

  function lev(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(
          prev[j] + 1,                                   // delete
          cur[j - 1] + 1,                                // insert
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)   // substitute
        );
      }
      prev = cur;
    }
    return prev[b.length];
  }

  const sharedPrefix = (a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  };

  // How wrong is allowed to still count. Longer words earn more slack; short
  // ones must be right, because a single edit is the whole difference between
  // two real words here ("pear"/"peas", and "potato"/"tomato" at two edits).
  const tolerance = (n) => (n <= 4 ? 0 : n <= 6 ? 1 : n <= 9 ? 2 : 3);

  function closeEnough(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    const longest = Math.max(a.length, b.length);
    const shortest = Math.min(a.length, b.length);
    if (longest < 4) return false;                       // tiny words must be right
    // A dropped syllable: "nana" for "banana", "cumber" for "cucumber". Kept
    // tight, or whole other words get swallowed — "apple" is not "pineapple"
    // and "corn" is not "popcorn".
    if (shortest >= 4 && longest - shortest <= 2 && (a.includes(b) || b.includes(a))) return true;
    if (lev(a, b) <= tolerance(longest)) return true;
    const sa = soundish(a), sb = soundish(b);
    if (sa === sb) return true;
    if (lev(sa, sb) <= tolerance(Math.max(sa.length, sb.length))) return true;
    // starts the same and is about the right length ("strawbewwy" / "strawberry")
    if (sharedPrefix(a, b) >= 4 && longest - shortest <= 3) return true;
    return false;
  }

  // Does the target phrase appear somewhere in what was heard?
  function containsSeq(hay, needle) {
    if (needle.length > hay.length) return false;
    for (let i = 0; i <= hay.length - needle.length; i++) {
      let all = true;
      for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) { all = false; break; }
      if (all) return true;
    }
    return false;
  }

  /* Compare what was heard against the word we asked for.
   * → { ok, quality: "exact" | "close" | "none" }
   */
  function compare(heard, target) {
    const h = words(heard), t = words(target);
    if (!h.length || !t.length) return { ok: false, quality: "none" };

    const hs = h.map(stem), ts = t.map(stem);
    if (hs.join(" ") === ts.join(" ")) return { ok: true, quality: "exact" };
    if (containsSeq(hs, ts)) return { ok: true, quality: "exact" };
    if (closeEnough(hs.join(""), ts.join(""))) return { ok: true, quality: "close" };

    // For "sweet potato", accepting just "potato" is a win worth celebrating.
    const main = ts[ts.length - 1];
    if (hs.some((w) => closeEnough(w, main))) return { ok: true, quality: "close" };

    return { ok: false, quality: "none" };
  }

  /* Best result across everything the recognizer offered (it returns several
   * guesses, and the child's word is often not the first one).
   */
  function best(heardList, target) {
    const list = Array.isArray(heardList) ? heardList : [heardList];
    let out = { ok: false, quality: "none", heard: "" };
    for (const heard of list) {
      if (!heard) continue;
      const r = compare(heard, target);
      if (!out.heard) out.heard = normalize(heard);
      if (r.quality === "exact") return { ...r, heard: normalize(heard) };
      if (r.ok && !out.ok) out = { ...r, heard: normalize(heard) };
    }
    return out;
  }

  return { compare, best, normalize, words, stem, soundish, closeEnough, lev };
});
