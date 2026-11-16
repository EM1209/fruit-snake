/* deck.js — Snake Explorers: freshness-aware content selection.
 *
 * Every prompt carries canonical content ids ("cids") that name the *question*,
 * not its layout: the same question with shuffled answers has the same cid.
 * For each activity+mode we keep a bounded history: cid -> the "tick" it was
 * last SHOWN (the app records a cid only when a prompt actually appears).
 *
 * pick() deals never-shown items first (in seeded random order, spreading
 * topics), then recycles the least-recently-shown ones. That behaves like a
 * shuffle bag that persists across rounds and reloads, and when a pool runs
 * out it degrades gracefully to "oldest first" — never an infinite loop.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./logic.js"));
  else root.SE_Deck = factory(root.SE_Logic);
})(typeof self !== "undefined" ? self : this, function (L) {
  "use strict";
  const MAX_PER_KEY = 400;      // bounded history per activity+mode
  const KEEP_AFTER_PRUNE = 320;
  const VERSION = 1;

  const keyOf = (activityId, mode) => activityId + ":" + mode;
  const emptyRec = () => ({ t: 0, s: {} });

  // Make any stored value safe to use. Corrupt pieces are dropped, never thrown.
  function sanitize(h) {
    const out = { v: VERSION, keys: {} };
    if (!h || typeof h !== "object" || !h.keys || typeof h.keys !== "object") return out;
    for (const [k, rec] of Object.entries(h.keys)) {
      if (typeof k !== "string" || !rec || typeof rec !== "object") continue;
      const r = emptyRec();
      r.t = Number.isFinite(rec.t) && rec.t >= 0 ? Math.floor(rec.t) : 0;
      if (rec.s && typeof rec.s === "object") {
        for (const [cid, tick] of Object.entries(rec.s)) {
          if (typeof cid === "string" && cid.length < 200 && Number.isFinite(tick) && tick >= 0) r.s[cid] = Math.floor(tick);
        }
      }
      // ticks must never exceed the counter (stale/corrupt data)
      const maxTick = Math.max(0, ...Object.values(r.s));
      if (maxTick > r.t) r.t = maxTick;
      out.keys[k] = r;
    }
    return out;
  }

  function rec(history, key) { return (history && history.keys && history.keys[key]) || emptyRec(); }

  function prune(r) {
    const entries = Object.entries(r.s);
    if (entries.length <= MAX_PER_KEY) return;
    entries.sort((a, b) => a[1] - b[1]);
    const drop = entries.length - KEEP_AFTER_PRUNE;
    for (let i = 0; i < drop; i++) delete r.s[entries[i][0]];
  }

  // Record that these cids were SHOWN now. Mutates history; returns it.
  function markShown(history, key, cids) {
    if (!history.keys) history.keys = {};
    const r = history.keys[key] || (history.keys[key] = emptyRec());
    (Array.isArray(cids) ? cids : [cids]).forEach(cid => {
      if (typeof cid !== "string" || !cid) return;
      r.t += 1;
      r.s[cid] = r.t;
    });
    prune(r);
    return history;
  }

  /* Order candidates freshest-first.
   * cands: [{cid, topic?, ...}] (duplicates by cid are collapsed)
   * r: a history record {t, s}
   * Returns a new array; never loops forever (one pass per tier).
   */
  function order(cands, r, rand, opts) {
    const o = opts || {};
    const seen = new Set();
    const uniq = [];
    for (const c of cands) { if (c && typeof c.cid === "string" && !seen.has(c.cid)) { seen.add(c.cid); uniq.push(c); } }
    const shuffled = L.shuffle(uniq, rand);
    const last = (c) => (Object.prototype.hasOwnProperty.call(r.s, c.cid) ? r.s[c.cid] : -1);
    const fresh = shuffled.filter(c => last(c) < 0);
    const old = shuffled.filter(c => last(c) >= 0).sort((a, b) => last(a) - last(b)); // stable: oldest first
    const spread = (list) => {
      if (!o.spread) return list;
      // interleave topics: take one of each topic in turn, keeping relative order
      const byTopic = new Map();
      list.forEach(c => { const t = c.topic || ""; if (!byTopic.has(t)) byTopic.set(t, []); byTopic.get(t).push(c); });
      const queues = Array.from(byTopic.values()), out = [];
      let added = true;
      while (added) { added = false; for (const q of queues) if (q.length) { out.push(q.shift()); added = true; } }
      return out;
    };
    return spread(fresh).concat(old);
  }

  function pick(cands, n, r, rand, opts) { return order(cands, r, rand, opts).slice(0, Math.max(0, n)); }

  /* Draw n prompts from a generator. make(rand) returns an object with a cid
   * (or null when a draw is invalid). We try a bounded number of draws, then
   * choose freshest-first. Bounded: at most n*tries draws. */
  function generate(make, n, r, rand, opts) {
    const o = opts || {};
    const tries = Math.max(n, n * (o.tries || 12));
    const cands = [];
    const ids = new Set();
    let freshCount = 0;
    for (let i = 0; i < tries; i++) {
      const c = make(rand);
      if (!c || !c.cid || ids.has(c.cid)) continue;
      ids.add(c.cid); cands.push(c);
      if (!Object.prototype.hasOwnProperty.call(r.s, c.cid)) freshCount++;
      if (freshCount >= n * 3) break;            // plenty of fresh choices already
    }
    return pick(cands, n, r, rand, o);
  }

  /* The context a round builder receives. Within one round a cid is never
   * dealt twice (the "used" set), even across separate pick()/generate() calls. */
  function context(r, rand, mode) {
    const used = new Set();
    const live = { t: r.t, s: Object.assign({}, r.s) };
    const take = (list) => { list.forEach(c => used.add(c.cid)); return list; };
    const notUsed = (c) => c && !used.has(c.cid);
    return {
      rand, mode,
      pick: (cands, n, opts) => take(pick(cands.filter(notUsed), n, live, rand, opts)),
      generate: (make, n, opts) => take(generate((x) => { const c = make(x); return notUsed(c) ? c : null; }, n, live, rand, opts)),
      isFresh: (cid) => !Object.prototype.hasOwnProperty.call(live.s, cid),
      lastShown: (cid) => (Object.prototype.hasOwnProperty.call(live.s, cid) ? live.s[cid] : -1)
    };
  }

  return { VERSION, MAX_PER_KEY, keyOf, sanitize, rec, markShown, order, pick, generate, context, emptyRec };
});
