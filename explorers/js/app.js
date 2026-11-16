/* app.js — Snake Explorers: screens, rounds, feedback, progress, settings.
 * Content (content.js), rules (logic.js), art (art.js), storage (store.js),
 * audio (audio.js) and the six mechanics (mech-*.js) are separate modules;
 * this file wires them into a game.
 */
(function () {
  "use strict";
  const L = window.SE_Logic, C = window.SE_Content, Art = window.SE_Art, Store = window.SE_Store, Audio = window.SE_Audio, Deck = window.SE_Deck;
  const { esc, el, icon, badge } = window.SE_UI;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // ---------------------------------------------------------------- state
  const store = Store.create(Store.browserStorage());
  let D = store.load();
  const S = { screen: "home", world: null, round: null, mech: null, paused: false, bookWorld: "word", stopwatchTimer: null };
  const SPEEDS = { step: { name: "One step per press", ms: null }, relaxed: { name: "Relaxed", ms: 560 }, steady: { name: "Steady", ms: 400 }, lively: { name: "Lively", ms: 270 } };
  const MECH_NAME = { collect: "Steer & collect", choose: "Tap to choose", sort: "Sort", sequence: "Put in order", plan: "Plan & run", explore: "Explore" };
  const save = () => store.save();
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const worldOf = (id) => C.WORLDS.find(w => w.id === id);
  const lookColor = () => C.COSMETICS.color.find(c => c.id === D.look.color) || C.COSMETICS.color[0];

  // ---------------------------------------------------------------- settings application
  const mqReduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function reducedMotion() { return D.settings.motion === "reduce" || (D.settings.motion === "system" && mqReduce.matches); }
  function applySettings() {
    const root = document.documentElement;
    root.classList.toggle("rm", reducedMotion());
    root.dataset.text = D.settings.textSize;
    Audio.setVoice(D.settings.voice);
    Audio.setSound(D.settings.sound);
    const c = lookColor();
    root.style.setProperty("--snake", c.hex);
    root.style.setProperty("--snake-dark", c.dark);
    root.dataset.pattern = D.look.pattern;
    const ms = SPEEDS[D.settings.speed].ms;
    root.style.setProperty("--step", ms ? (ms / 1000).toFixed(2) + "s" : ".16s");
  }
  function mascot(mood, extra) {
    const c = lookColor();
    return Art.mascot(Object.assign({ color: c.hex, dark: c.dark, pattern: D.look.pattern, accessory: D.look.accessory, mood }, extra || {}));
  }

  // ---------------------------------------------------------------- progress helpers
  function derived() { return L.deriveStats(D.progress, C.conceptWorld); }
  function unlockState() { return L.computeUnlocks(derived(), C.COSMETIC_LIST); }
  function event(ev) { L.applyEvent(D.progress, ev); save(); }
  const isSeen = (id) => !!(D.progress.concepts[id] && D.progress.concepts[id].seen > 0);

  // ---------------------------------------------------------------- screens
  function show(name) {
    if (S.screen === "play" && name !== "play") endPlayView();
    if (S.screen === "classic" && name !== "classic") unloadClassic();
    S.screen = name;
    $$(".screen").forEach(s => { s.hidden = s.id !== "scr-" + name; });
    document.body.classList.toggle("in-play", name === "play");
    document.body.classList.toggle("in-classic", name === "classic");
    window.scrollTo(0, 0);
    const h = $("#scr-" + name + " [data-focus]");
    if (h) h.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- HOME
  function renderHome() {
    $("#homeMascot").innerHTML = mascot("happy", { label: "Your snake, smiling" });
    const last = D.progress.last && C.ACTIVITY[D.progress.last.activityId];
    const cont = $("#continueBtn");
    cont.hidden = !last;
    if (last) cont.querySelector("span").textContent = "Continue: " + last.title + " · " + C.MODE_INFO[D.progress.last.mode].name;
    const d = derived();
    $("#homeStats").textContent = d.discovered ? d.discovered + " discovered · " + d.practiced + " practiced" : "";
  }

  // ---------------------------------------------------------------- WORLDS
  function renderWorlds() {
    const grid = $("#worldGrid");
    grid.innerHTML = "";
    C.WORLDS.forEach(w => {
      const n = C.ACTIVITIES.filter(a => a.world === w.id).length;
      const b = el(`<button type="button" class="world-card" style="--tint:${w.tint}" data-world="${w.id}">
        <span class="wc-art">${Art.item(w.art, "art")}</span>
        <span class="wc-text"><span class="wc-name">${esc(w.name)}</span><span class="wc-skill">${esc(w.skill)}</span>
        <span class="wc-example">${esc(w.example)}</span><span class="wc-count">${n} ${n === 1 ? "activity" : "activities"}${C.ACTIVITIES.some(x => x.world === w.id && x.isNew && !D.played[x.id]) ? ` <span class="new-chip">New activity</span>` : ""}</span></span></button>`);
      b.addEventListener("click", () => openWorld(w.id));
      grid.appendChild(b);
    });
  }
  function openWorld(id) {
    S.world = id;
    renderWorld();
    show("world");
  }
  function renderWorld() {
    const w = worldOf(S.world);
    $("#worldTitle").textContent = w.name;
    $("#worldSkill").textContent = w.skill;
    $("#worldArt").innerHTML = Art.item(w.art, "art");
    $("#scr-world").style.setProperty("--tint", w.tint);
    // mode picker
    $$("#modePicker input").forEach(r => { r.checked = r.value === D.settings.mode; });
    paintModeLine();
    const list = $("#activityList");
    list.innerHTML = "";
    C.ACTIVITIES.filter(a => a.world === w.id).forEach(a => {
      const card = el(`<article class="act-card">
        <div class="ac-art">${Art.item(a.art, "art")}</div>
        <div class="ac-body"><h3>${esc(a.title)}${a.isNew && !D.played[a.id] ? ` <span class="new-chip">New</span>` : ""}</h3><p class="ac-obj">${esc(a.objective)}</p>
          <p class="ac-mode"><span class="mech-tag">${esc(MECH_NAME[a.mechanic])}</span> <span class="ac-mode-line" data-act="${a.id}"></span></p></div>
        <button type="button" class="btn primary play-act" data-act="${a.id}">${icon("play")}Play <span class="sr-only">${esc(a.title)}</span></button></article>`);
      card.querySelector(".play-act").addEventListener("click", () => startRound(a.id, D.settings.mode));
      list.appendChild(card);
    });
    paintActModes();
  }
  function paintModeLine() {
    $("#modeLine").textContent = C.MODE_INFO[D.settings.mode].line;
    $("#stopwatchRow").hidden = D.settings.mode !== "challenge";
  }
  function paintActModes() { $$(".ac-mode-line").forEach(s => { s.textContent = C.ACTIVITY[s.dataset.act].modes[D.settings.mode]; }); }

  // ---------------------------------------------------------------- PLAY: round controller
  function startRound(activityId, mode) {
    const a = C.ACTIVITY[activityId];
    const prompts = C.buildRound(activityId, mode, (Math.random() * 1e9) | 0, D.history);
    D.played[activityId] = (D.played[activityId] || 0) + 1;
    S.round = { activity: a, mode, prompts, i: 0, results: [], newly: [], practicedIds: [], start: Date.now(), reviewUsed: false,
      stopwatch: mode === "challenge" && $("#stopwatchToggle").checked, beforeUnlocks: unlockState() };
    D.settings.mode = mode;
    D.progress.last = { activityId, mode };
    save();
    $("#playTitle").textContent = a.title;
    $("#playMode").textContent = C.MODE_INFO[mode].name;
    $("#playObjective").textContent = a.objective;
    $("#playGuide").innerHTML = mascot("idle", { label: "Your snake guide" });
    S.paused = false; $("#pauseOverlay").hidden = true;
    show("play");
    startStopwatch();
    renderPrompt();
  }
  function startStopwatch() {
    clearInterval(S.stopwatchTimer);
    const sw = $("#stopwatch");
    sw.hidden = !S.round.stopwatch;
    if (!S.round.stopwatch) return;
    S.round.elapsed = 0; let lastT = Date.now();
    S.stopwatchTimer = setInterval(() => {
      const now = Date.now(); if (!S.paused) S.round.elapsed += now - lastT; lastT = now;
      sw.querySelector("span").textContent = fmtTime(S.round.elapsed);
    }, 250);
  }
  const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  function paintProgress() {
    const r = S.round, n = r.prompts.length;
    const c = $("#playCount");
    c.textContent = Math.min(r.i + 1, n) + " / " + n;
    c.setAttribute("aria-label", "Goal " + Math.min(r.i + 1, n) + " of " + n);
    $("#playPips").innerHTML = r.prompts.map((p, k) => `<span class="pip${k < r.i ? " done" : k === r.i ? " now" : ""}"></span>`).join("");
  }

  function renderPrompt() {
    const r = S.round, p = r.prompts[r.i];
    if (S.mech && S.mech.destroy) S.mech.destroy();
    const stage = $("#stage");
    stage.innerHTML = "";
    stage.className = "stage mech-" + p.mechanic;
    r.cur = { misses: 0, hints: 0, help: 0, answered: false };
    paintProgress();
    $("#instr").innerHTML = (p.review ? `<span class="review-chip">${icon("refresh")}Review</span> ` : "") + esc(p.instruction);
    // record what is actually SHOWN, so the next round can deal fresh material
    if (p.cids && p.cids.length) { Deck.markShown(D.history, Deck.keyOf(r.activity.id, r.mode), p.cids); save(); }
    const tip = $("#tip");
    tip.hidden = r.mode !== "explore" || p.mechanic === "explore" || p.kind === "explore";
    tip.innerHTML = tip.hidden ? "" : `<b>Tip:</b> ${esc(p.hints[0])}`;
    clearFeedback();
    setGuideMood("idle");
    // seeing a prompt's things counts as discovering them
    if (p.mechanic !== "explore" && p.kind !== "explore") noteSeen(p.seen || []);
    S.mech = window.SE_Mech[p.mechanic](stage, makeApi(p));
    if (D.settings.voice) Audio.speak(p.say);
    const focusable = stage.querySelector("button:not([disabled])");
    if (focusable && document.activeElement && document.activeElement.closest && !document.activeElement.closest("#scr-play")) focusable.focus({ preventScroll: true });
  }

  function noteSeen(ids) {
    const fresh = ids.filter(id => C.CONCEPT[id] && !isSeen(id));
    if (!ids.length) return;
    event({ type: "seen", ids: ids.filter(id => C.CONCEPT[id]) });
    fresh.forEach(id => { if (!S.round.newly.includes(id)) S.round.newly.push(id); });
  }

  function setGuideMood(m) {
    $("#playGuide").innerHTML = mascot(m, { label: "Your snake guide" });
  }
  function clearFeedback() {
    const fb = $("#feedback");
    fb.className = "fb"; fb.innerHTML = "";
    $("#bubbleActions").innerHTML = "";
  }
  function feedback(f) {
    const fb = $("#feedback");
    const kind = f.kind || "info";
    const head = kind === "right" ? badge(true, "Yes!") : kind === "wrong" ? badge(false, "Not yet") : kind === "hint" ? `<span class="badge hint">${icon("help")}<span>Hint</span></span>` : "";
    fb.className = "fb fb-" + kind;
    fb.innerHTML = head + `<span class="fb-text">${esc(f.text || "")}</span>`;
    if (!reducedMotion()) { fb.classList.remove("pop"); void fb.offsetWidth; fb.classList.add("pop"); }
    if (f.mood) setGuideMood(f.mood);
    if (D.settings.voice && (f.say || f.text)) Audio.speak(f.say || f.text);
  }

  function makeApi(p) {
    const r = S.round;
    const api = {
      prompt: p, mode: r.mode, Art, L, look: D.look,
      reducedMotion, isSeen,
      speedName: () => D.settings.speed,
      speedMs: () => SPEEDS[D.settings.speed].ms,
      food: (id) => C.FOOD[id] || { name: id, fact: "" },
      foodName: (id) => (C.FOOD[id] || { name: id }).name,
      sfx: (n) => Audio.sfx[n] && Audio.sfx[n](),
      speak: (t, o) => { if (D.settings.voice) Audio.speak(t, o); else feedback({ kind: "info", text: t }); },
      feedback,
      seen: (ids) => noteSeen(ids),
      practiced: (ids) => {
        const ok = (ids || []).filter(id => C.CONCEPT[id]);
        if (!ok.length) return;
        event({ type: "practiced", ids: ok });
        ok.forEach(id => { if (!r.practicedIds.includes(id)) r.practicedIds.push(id); });
      },
      solved: () => event({ type: "solved", mechanic: p.mechanic }),
      celebrate: (container, it) => {
        if (reducedMotion() || !it || !it.el) return;
        const burst = el(`<div class="burst" aria-hidden="true">${"<i></i>".repeat(8)}</div>`);
        burst.style.left = it.el.style.left; burst.style.top = it.el.style.top;
        container.appendChild(burst); setTimeout(() => burst.remove(), 800);
      },
      helpLevel: () => r.cur.help,
      miss: (o) => miss(p, o || {}),
      next: (o) => solved(p, o || {}),
      complete: (results, explanation) => {
        r.cur.answered = true;
        results.forEach(x => r.results.push(Object.assign({ hints: r.cur.hints }, x)));
        if (explanation) feedback({ kind: "right", text: explanation, mood: "cheer" });
        offerNext();
      }
    };
    return api;
  }

  function miss(p, o) {
    const r = S.round, cur = r.cur;
    cur.misses++;
    let extra = "";
    if (!o.noAuto) {
      if (r.mode === "explore") extra = p.hints[Math.min(cur.misses - 1, p.hints.length - 1)];
      else if (r.mode === "practice") extra = cur.misses === 1 ? p.hints[0] : (p.hints[1] || p.hints[0]);
      else if (cur.misses >= 2 || !o.text) extra = p.hints[0];
    }
    const text = [o.text, extra && extra !== o.text ? extra : ""].filter(Boolean).join(" ") || "Not yet — have another look.";
    feedback({ kind: "wrong", text, mood: "think" });
    if (cur.misses >= 3 && !$("#skipBtn")) {
      const sk = el(`<button type="button" class="btn ghost small" id="skipBtn">${icon("skip")}Skip this one</button>`);
      sk.addEventListener("click", () => skip());
      $("#bubbleActions").appendChild(sk);
    }
  }
  function help() {
    const r = S.round; if (!r || r.cur.answered) return;
    const p = r.prompts[r.i];
    r.cur.help++; r.cur.hints++;
    const handled = S.mech && S.mech.showHelp && S.mech.showHelp();
    if (handled && p.mechanic === "sort") return;
    const lvl = Math.min(r.cur.help - 1, p.hints.length - 1);
    const strong = r.cur.help >= 2 && handled ? (p.mechanic === "sequence" ? " I placed one card to get you started." : p.mechanic === "choose" ? " I faded one choice that doesn't fit." : p.mechanic === "collect" ? " Look for the glowing one." : "") : "";
    feedback({ kind: "hint", text: p.hints[lvl] + strong, mood: "think" });
  }
  function skip() {
    const r = S.round; if (!r || r.cur.answered) return;
    r.cur.answered = true;
    r.results.push({ solved: false, skipped: true, hints: r.cur.hints });
    advance();
  }
  function solved(p, o) {
    const r = S.round, cur = r.cur;
    cur.answered = true;
    if (o.results) o.results.forEach(x => r.results.push(Object.assign({ hints: cur.hints }, x)));
    else r.results.push({ solved: true, firstTry: cur.misses === 0, hints: cur.hints });
    // Practice: one varied review of something that needed another look
    if (r.mode === "practice" && cur.misses > 0 && !r.reviewUsed && !p.review && (p.mechanic === "choose" || p.mechanic === "sequence")) {
      r.reviewUsed = true;
      const copy = JSON.parse(JSON.stringify(p));
      copy.id = p.id + "-review"; copy.review = true;
      if (copy.options) window.SE_UI.shuffleInPlace(copy.options);
      if (copy.tiles) window.SE_UI.shuffleInPlace(copy.tiles);
      r.prompts.push(copy);
    }
    offerNext();
  }
  function offerNext() {
    const r = S.round;
    const last = r.i >= r.prompts.length - 1;
    const box = $("#bubbleActions");
    box.innerHTML = "";
    const b = el(`<button type="button" class="btn primary" id="nextBtn">${last ? "See how it went" : "Next"} ${icon("right")}</button>`);
    b.addEventListener("click", advance);
    box.appendChild(b);
    paintProgress();
    setTimeout(() => { if (document.getElementById("nextBtn") === b) b.focus({ preventScroll: true }); }, 60);
  }
  function advance() {
    const r = S.round;
    Audio.stop();
    if (r.i < r.prompts.length - 1) { r.i++; renderPrompt(); }
    else finishRound();
  }

  function finishRound() {
    const r = S.round;
    clearInterval(S.stopwatchTimer);
    if (S.mech && S.mech.destroy) S.mech.destroy();
    S.mech = null;
    event({ type: "round", world: r.activity.world, mode: r.mode });
    const graded = r.results.filter(x => !x.ungraded);
    const sum = L.summarizeRound(graded);
    sum.ungraded = 0;
    const suggestion = L.suggestNext(graded.length ? sum : { total: 1, ungraded: 1, firstTry: 0, skipped: 0 }, r.mode);
    // new unlocks
    const after = unlockState();
    const fresh = C.COSMETIC_LIST.filter(c => after[c.id].unlocked && !r.beforeUnlocks[c.id].unlocked && !D.seenUnlocks.includes(c.id));
    fresh.forEach(c => D.seenUnlocks.push(c.id));
    let timeLine = "";
    if (r.stopwatch) {
      const best = D.progress.best[r.activity.id];
      const isBest = !best || r.elapsed < best;
      if (isBest) D.progress.best[r.activity.id] = r.elapsed;
      timeLine = "Your time: " + fmtTime(r.elapsed) + (best && !isBest ? " (best so far " + fmtTime(best) + ")" : isBest && best ? " — a new best!" : "");
    }
    save();
    renderResults(r, sum, graded.length, suggestion, fresh, timeLine);
    show("results");
  }

  function renderResults(r, sum, graded, suggestion, fresh, timeLine) {
    $("#resMascot").innerHTML = mascot("cheer", { label: "Your snake, celebrating" });
    let title, line;
    if (!graded) { title = "What a walk!"; line = "You explored at your own pace."; }
    else if (sum.firstTry === sum.total) { title = "Round complete!"; line = "All " + sum.total + " solved on the first try."; }
    else {
      const solvedN = sum.firstTry + sum.afterRetry;
      title = "Round complete!";
      line = "You solved " + solvedN + " of " + sum.total + (sum.afterRetry ? " — " + sum.afterRetry + " after another look. Trying again is how ideas stick." : ".");
    }
    $("#resTitle").textContent = title;
    $("#resLine").textContent = line;
    const chips = [];
    if (graded) {
      chips.push(`<li><b>${sum.firstTry}</b> first try</li>`);
      if (sum.afterRetry) chips.push(`<li><b>${sum.afterRetry}</b> after another look</li>`);
      if (sum.skipped) chips.push(`<li><b>${sum.skipped}</b> skipped for now</li>`);
      chips.push(`<li><b>${sum.hints}</b> ${sum.hints === 1 ? "hint" : "hints"} used</li>`);
    }
    if (timeLine) chips.push(`<li>${icon("clock")} ${esc(timeLine)}</li>`);
    $("#resChips").innerHTML = chips.join("");
    const tile = (id, ok) => { const c = C.CONCEPT[id]; return c ? `<li class="mini-entry">${Art.item(c.art, "art")}<span>${esc(cap(c.label))}</span>${ok ? `<span class="tick">${icon("check", "practiced")}</span>` : ""}</li>` : ""; };
    const newly = r.newly.filter(id => C.CONCEPT[id]);
    $("#resNewWrap").hidden = !newly.length;
    $("#resNew").innerHTML = newly.slice(0, 12).map(id => tile(id, false)).join("") + (newly.length > 12 ? `<li class="more">+${newly.length - 12} more</li>` : "");
    const prac = r.practicedIds.filter(id => C.CONCEPT[id]);
    $("#resPracWrap").hidden = !prac.length;
    $("#resPrac").innerHTML = prac.slice(0, 12).map(id => tile(id, true)).join("");
    // earned cosmetics
    $("#resUnlock").hidden = !fresh.length;
    $("#resUnlock").innerHTML = fresh.length ? `<span class="unlock-ico">${icon("star")}</span><span>New for My Snake: <b>${fresh.map(f => esc(f.name)).join(", ")}</b></span> <button type="button" class="btn small ghost" id="resToSnake">${icon("palette")}Try it on</button>` : "";
    if (fresh.length) $("#resToSnake").onclick = () => { renderMySnake(); show("mysnake"); };
    // suggestion for next time (never changes this round)
    const sug = $("#resSuggest");
    sug.innerHTML = "";
    if (suggestion.direction !== "same") {
      const m = C.MODE_INFO[suggestion.mode];
      const msg = suggestion.direction === "harder" ? (graded ? "That went smoothly. Ready for something harder next time?" : "Ready to practice what you discovered?") : "Want a gentler round next? Tips are shown and there's no rush.";
      sug.appendChild(el(`<p>${esc(msg)}</p>`));
      const b = el(`<button type="button" class="btn ghost">Try ${esc(m.name)}</button>`);
      b.onclick = () => startRound(r.activity.id, suggestion.mode);
      sug.appendChild(b);
    }
    $("#againBtn").onclick = () => startRound(r.activity.id, r.mode);
  }

  // pause
  function pause() {
    if (S.screen !== "play" || S.paused) return;
    S.paused = true;
    if (S.mech && S.mech.pause) S.mech.pause();
    Audio.stop();
    $$("#pauseSpeed input").forEach(i => { i.checked = i.value === D.settings.speed; });
    $("#pauseOverlay").hidden = false;
    $("#resumeBtn").focus();
  }
  function resume() {
    if (!S.paused) return;
    S.paused = false;
    $("#pauseOverlay").hidden = true;
    if (S.mech && S.mech.resume) S.mech.resume();
  }
  function endPlayView() {
    if (S.mech && S.mech.destroy) S.mech.destroy();
    S.mech = null; S.paused = false;
    clearInterval(S.stopwatchTimer);
    $("#pauseOverlay").hidden = true;
    Audio.stop();
  }

  // ---------------------------------------------------------------- MY SNAKE
  function renderMySnake() {
    $("#snakePreview").innerHTML = mascot("happy", { label: "Preview of your snake" });
    const u = unlockState();
    const groups = [["color", "Color", $("#lookColors")], ["pattern", "Pattern", $("#lookPatterns")], ["accessory", "Accessory", $("#lookAccessories")]];
    groups.forEach(([kind, , box]) => {
      box.innerHTML = "";
      C.COSMETICS[kind].forEach(c => {
        const st = u[kind + ":" + c.id];
        const on = D.look[kind] === c.id;
        let preview;
        if (kind === "color") preview = `<span class="swatch-dot" style="background:${c.hex}"></span>`;
        else if (kind === "pattern") preview = `<span class="pat-dot pat-${c.id}"></span>`;
        else preview = `<span class="acc-prev">${Art.head({ color: lookColor().hex, accessory: c.id, mood: "idle" })}</span>`;
        const b = el(`<button type="button" class="look-opt${on ? " on" : ""}${st.unlocked ? "" : " locked"}" aria-pressed="${on}" ${st.unlocked ? "" : 'aria-disabled="true"'}>
          ${preview}<span class="lo-name">${esc(c.name)}</span>
          ${st.unlocked ? (on ? `<span class="lo-state">${icon("check")}Wearing</span>` : "") : `<span class="lo-goal">${icon("lock")}${esc(c.goal.text)}</span><span class="meter" role="img" aria-label="${st.have} of ${st.need}"><i style="width:${Math.round(st.have / st.need * 100)}%"></i></span><span class="lo-count">${st.have} / ${st.need}</span>`}
        </button>`);
        b.addEventListener("click", () => {
          if (!st.unlocked) { $("#lookNote").textContent = c.name + " unlocks when you " + c.goal.text.charAt(0).toLowerCase() + c.goal.text.slice(1) + " (" + st.have + " of " + st.need + " so far)."; return; }
          D.look[kind] = c.id; save(); applySettings(); renderMySnake();
          $("#lookNote").textContent = "Now wearing: " + c.name + ".";
          Audio.sfx.pick();
        });
        box.appendChild(b);
      });
    });
  }

  // ---------------------------------------------------------------- DISCOVERY BOOK
  function renderBook() {
    const tabs = $("#bookTabs");
    tabs.innerHTML = "";
    C.WORLDS.forEach(w => {
      const entries = C.CONCEPTS.filter(c => c.world === w.id);
      const seen = entries.filter(c => isSeen(c.id)).length;
      const b = el(`<button type="button" role="tab" class="book-tab" aria-selected="${S.bookWorld === w.id}" id="tab-${w.id}" aria-controls="bookPage" style="--tint:${w.tint}">
        <span class="bt-art">${Art.item(w.art, "art")}</span><span class="bt-name">${esc(w.name)}</span><span class="bt-count">${seen}/${entries.length}</span></button>`);
      b.addEventListener("click", () => { S.bookWorld = w.id; renderBook(); $("#tab-" + w.id).focus(); });
      b.addEventListener("keydown", (e) => {
        const i = C.WORLDS.findIndex(x => x.id === S.bookWorld);
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          S.bookWorld = C.WORLDS[(i + (e.key === "ArrowRight" ? 1 : C.WORLDS.length - 1)) % C.WORLDS.length].id;
          renderBook(); $("#tab-" + S.bookWorld).focus();
        }
      });
      if (S.bookWorld !== w.id) b.tabIndex = -1;
      tabs.appendChild(b);
    });
    const w = worldOf(S.bookWorld);
    const entries = C.CONCEPTS.filter(c => c.world === w.id);
    const seen = entries.filter(c => isSeen(c.id)).length;
    const prac = entries.filter(c => D.progress.concepts[c.id] && D.progress.concepts[c.id].practiced > 0).length;
    $("#bookPage").setAttribute("aria-labelledby", "tab-" + w.id);
    $("#bookSummary").textContent = w.name + ": " + seen + " of " + entries.length + " discovered, " + prac + " practiced.";
    const grid = $("#bookGrid");
    grid.innerHTML = "";
    entries.forEach(c => {
      const st = D.progress.concepts[c.id] || { seen: 0, practiced: 0 };
      const found = st.seen > 0;
      const b = el(`<button type="button" class="entry${found ? "" : " unknown"}" ${found ? "" : 'aria-disabled="true"'} aria-label="${found ? esc(cap(c.label)) + (st.practiced ? ", practiced " + st.practiced + (st.practiced === 1 ? " time" : " times") : ", discovered") : "Not found yet"}">
        <span class="pic">${Art.item(c.art, "art")}</span>
        <span class="lab">${found ? esc(cap(c.label)) : "Not found yet"}</span>
        ${found ? `<span class="tags"><span class="tag seen">${icon("star")}Discovered</span>${st.practiced ? `<span class="tag prac">${icon("check")}Practiced ×${st.practiced}</span>` : ""}</span>` : `<span class="tags"><span class="tag">${icon("leaf")}Keep exploring</span></span>`}
      </button>`);
      if (found) b.addEventListener("click", () => openEntry(c, st));
      grid.appendChild(b);
    });
    $("#entryDetail").hidden = true;
  }
  function openEntry(c, st) {
    const d = $("#entryDetail");
    d.hidden = false;
    d.innerHTML = `<div class="ed-art">${Art.item(c.art, "art")}</div><div class="ed-body"><h3 tabindex="-1">${esc(cap(c.label))}</h3><p>${esc(c.fact)}</p>
      <p class="ed-stats">Seen ${st.seen} ${st.seen === 1 ? "time" : "times"} · practiced ${st.practiced} ${st.practiced === 1 ? "time" : "times"}</p>
      <div class="row"><button type="button" class="btn ghost small" id="edHear">${icon("speaker")}Hear it</button><button type="button" class="btn ghost small" id="edClose">${icon("cross")}Close</button></div></div>`;
    $("#edHear").onclick = () => { if (D.settings.voice && Audio.voiceAvailable()) Audio.speak(cap(c.label) + ". " + c.fact); else { const n = $("#edNote") || d.querySelector(".ed-body").appendChild(el(`<p class="ed-note" id="edNote"></p>`)); n.textContent = D.settings.voice ? "Voice isn't available on this device — the words above say the same thing." : "Voice is off in Settings."; } };
    $("#edClose").onclick = () => { d.hidden = true; };
    d.querySelector("h3").focus();
    d.scrollIntoView({ block: "nearest" });
  }

  // ---------------------------------------------------------------- SETTINGS
  function renderSettings() {
    const s = D.settings;
    $("#setVoice").setAttribute("aria-checked", String(s.voice));
    $("#setSound").setAttribute("aria-checked", String(s.sound));
    $("#voiceNote").textContent = Audio.voiceAvailable() ? "Reads instructions and feedback aloud. You can replay any instruction." : "This device has no built-in voice. All instructions and feedback are shown as text.";
    $$('input[name="speed"]').forEach(i => { i.checked = i.value === s.speed; });
    $$('input[name="motion"]').forEach(i => { i.checked = i.value === s.motion; });
    $$('input[name="textSize"]').forEach(i => { i.checked = i.value === s.textSize; });
    $("#storageStatus").textContent = store.isPersistent()
      ? "Progress is saved on this device only. Nothing is sent anywhere."
      : "Saving isn't available here, so progress lasts until you close this page.";
    $("#resetConfirm").hidden = true;
  }
  function bindSettings() {
    const toggle = (id, key, after) => $(id).addEventListener("click", () => {
      D.settings[key] = !D.settings[key]; save(); applySettings(); renderSettings(); if (after) after();
    });
    toggle("#setVoice", "voice", () => { if (D.settings.voice) Audio.speak("Voice on."); });
    toggle("#setSound", "sound", () => { if (D.settings.sound) Audio.sfx.right(); });
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (t.name === "speed" || t.name === "pspeed") {
        D.settings.speed = t.value; save(); applySettings();
        $$('input[name="speed"], input[name="pspeed"]').forEach(i => { i.checked = i.value === t.value; });
        if (S.mech && S.mech.speedChanged) S.mech.speedChanged();
      } else if (t.name === "motion") { D.settings.motion = t.value; save(); applySettings(); }
      else if (t.name === "textSize") { D.settings.textSize = t.value; save(); applySettings(); }
      else if (t.name === "mode") { D.settings.mode = t.value; save(); paintModeLine(); paintActModes(); }
    });
    $("#resetBtn").addEventListener("click", () => { $("#resetConfirm").hidden = false; $("#resetYes").focus(); });
    $("#resetNo").addEventListener("click", () => { $("#resetConfirm").hidden = true; $("#resetBtn").focus(); });
    $("#resetYes").addEventListener("click", () => {
      D = store.reset(); applySettings(); renderSettings();
      $("#resetDone").textContent = "Progress and My Snake choices were reset. Settings were kept.";
    });
  }

  // ---------------------------------------------------------------- CLASSIC
  function openClassic() {
    const f = $("#classicFrame");
    if (window.SE_CLASSIC_HTML) f.srcdoc = window.SE_CLASSIC_HTML;
    else f.src = "../www/index.html";
    show("classic");
  }
  function unloadClassic() { const f = $("#classicFrame"); f.removeAttribute("srcdoc"); f.src = "about:blank"; }

  // ---------------------------------------------------------------- wiring
  function bind() {
    $("#exploreBtn").addEventListener("click", () => { renderWorlds(); show("worlds"); });
    $("#continueBtn").addEventListener("click", () => { const l = D.progress.last; if (l && C.ACTIVITY[l.activityId]) startRound(l.activityId, l.mode); });
    $$("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
    $("#leaveBtn").addEventListener("click", () => { endPlayView(); openWorld(S.round.activity.world); });
    $("#replayBtn").addEventListener("click", () => {
      const p = S.round.prompts[S.round.i];
      if (D.settings.voice && Audio.voiceAvailable()) Audio.speak(p.say);
      const i = $("#instr"); i.classList.remove("flash"); void i.offsetWidth; i.classList.add("flash");
    });
    $("#helpBtn").addEventListener("click", help);
    $("#pauseBtn").addEventListener("click", pause);
    $("#resumeBtn").addEventListener("click", resume);
    $("#restartBtn").addEventListener("click", () => { const r = S.round; startRound(r.activity.id, r.mode); });
    $("#pauseLeaveBtn").addEventListener("click", () => { endPlayView(); openWorld(S.round.activity.world); });
    $("#newBtn").addEventListener("click", () => { renderWorlds(); show("worlds"); });
    $("#breakBtn").addEventListener("click", () => { renderHome(); show("home"); $("#homeStats").textContent = "Good time for a break. Your discoveries are saved in the Discovery Book."; });
    document.addEventListener("keydown", (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (S.screen !== "play") return;
      if (e.key === "Escape") { e.preventDefault(); S.paused ? resume() : pause(); return; }
      if (S.paused) return;
      if (S.mech && S.mech.onKey) S.mech.onKey(e);
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) { Audio.stop(); if (S.screen === "play") pause(); } });
    if (mqReduce.addEventListener) mqReduce.addEventListener("change", applySettings);
    bindSettings();
    $("#storageDismiss").addEventListener("click", () => { $("#storageNote").hidden = true; });
  }
  function go(where) {
    if (where === "home") { renderHome(); show("home"); }
    else if (where === "worlds") { renderWorlds(); show("worlds"); }
    else if (where === "mysnake") { renderMySnake(); $("#lookNote").textContent = ""; show("mysnake"); }
    else if (where === "book") { const l = D.progress.last && C.ACTIVITY[D.progress.last.activityId]; if (l && !S.bookOpened) S.bookWorld = l.world; S.bookOpened = true; renderBook(); show("book"); }
    else if (where === "settings") { renderSettings(); $("#resetDone").textContent = ""; show("settings"); }
    else if (where === "classic") openClassic();
  }

  // ---------------------------------------------------------------- boot
  applySettings();
  bind();
  renderHome();
  $("#storageNote").hidden = store.isPersistent();
  show("home");

  // Test/inspection hook: read-only views of state (no answers are hidden from the page anyway).
  window.SnakeExplorers = {
    state: () => ({ screen: S.screen, paused: S.paused, round: S.round && { activity: S.round.activity.id, mode: S.round.mode, i: S.round.i, n: S.round.prompts.length, results: S.round.results.slice() } }),
    prompt: () => S.round && S.round.prompts[S.round.i],
    mech: () => S.mech && S.mech.debug && S.mech.debug(),
    data: () => JSON.parse(JSON.stringify(D)),
    history: () => JSON.parse(JSON.stringify(D.history)),
    persistent: () => store.isPersistent()
  };
})();
