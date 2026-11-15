/* mech-sequence.js — put steps, letters, or stages in order.
 * Tap a card to drop it in the next open space; tap a placed card to send it
 * back. Check compares values (so two P tiles are interchangeable).
 * Explore/Practice lock in the right spots after a check; Challenge only says
 * how many are in place.
 */
(function (root) {
  "use strict";
  const { esc, el, icon, content, badge } = root.SE_UI;

  root.SE_Mech.sequence = function mount(stage, api) {
    const p = api.prompt, Art = api.Art, L = api.L;
    const letters = p.kind === "letters";
    const lockOnCheck = api.mode !== "challenge";
    const slots = new Array(p.slots).fill(null);   // tile ids
    const locked = new Array(p.slots).fill(false);
    let done = false;

    const pic = p.picture ? `<div class="seq-picture">${Art.item(p.picture, "art", api.mode === "challenge" ? "Picture to spell" : p.word)}
      ${p.sayWord ? `<button type="button" class="btn small ghost hear">${icon("speaker")}Hear the word</button>` : ""}</div>` : "";
    const node = el(`
      <div class="sequence ${letters ? "letters" : "steps"}">
        ${pic}
        <ol class="slots n${p.slots}" aria-label="Your order"></ol>
        <p class="seq-status" aria-live="polite"></p>
        <div class="pool" role="group" aria-label="Cards to place"></div>
        <div class="seq-foot"><button type="button" class="btn ghost clear">${icon("undo")}Clear</button><button type="button" class="btn primary check" disabled>${icon("check")}Check order</button></div>
      </div>`);
    stage.appendChild(node);
    const slotBox = node.querySelector(".slots"), pool = node.querySelector(".pool"), statusEl = node.querySelector(".seq-status");
    const checkBtn = node.querySelector(".check");
    const tileOf = (id) => p.tiles.find(t => t.id === id);
    if (p.sayWord) node.querySelector(".hear").onclick = () => api.speak(p.sayWord, { rate: 0.8 });

    // pre-placed ("given") slots
    (p.fixed || []).forEach(i => {
      const v = p.answers[0][i];
      const t = p.tiles.find(t => t.value === v && !slots.includes(t.id));
      if (t) { slots[i] = t.id; locked[i] = "given"; }
    });

    function tileHtml(t) { return letters ? `<span class="letter">${esc(t.value)}</span>` : content(t, Art, { small: true }); }
    function render() {
      slotBox.innerHTML = "";
      for (let i = 0; i < p.slots; i++) {
        const id = slots[i], t = id && tileOf(id);
        const guide = p.guide ? p.guide[i] : "";
        const li = el(`<li class="slot${t ? " filled" : ""}${locked[i] ? " locked" : ""}${locked[i] === "given" ? " given" : ""}"></li>`);
        const b = el(`<button type="button" class="slot-btn" aria-label="${t ? "Place " + (i + 1) + ": " + esc(t.label) + (locked[i] ? (locked[i] === "given" ? " (given)" : " (correct)") : ", tap to remove") : "Place " + (i + 1) + ": empty" + (guide ? ", the word shows " + guide : "")}">
          <span class="slot-no" aria-hidden="true">${i + 1}</span>${t ? tileHtml(t) : guide ? `<span class="letter ghost-letter" aria-hidden="true">${esc(guide)}</span>` : ""}
          ${locked[i] === true ? `<span class="mark">${badge(true, "")}</span>` : ""}</button>`);
        if (locked[i]) b.disabled = !t ? false : true;
        b.addEventListener("click", () => unplace(i));
        li.appendChild(b); slotBox.appendChild(li);
      }
      pool.innerHTML = "";
      p.tiles.forEach(t => {
        if (slots.includes(t.id)) return;
        const b = el(`<button type="button" class="tile" data-id="${esc(t.id)}" aria-label="${esc(t.label)}">${tileHtml(t)}</button>`);
        b.addEventListener("click", () => placeTile(t.id));
        pool.appendChild(b);
      });
      checkBtn.disabled = slots.some(s => !s) || done;
    }
    function placeTile(id) {
      if (done) return;
      const i = slots.findIndex(s => !s);
      if (i < 0) { statusEl.textContent = "All places are full. Tap a placed card to take it back."; return; }
      slots[i] = id; api.sfx("tap");
      statusEl.textContent = "";
      render();
      const next = pool.querySelector(".tile"); if (next && document.activeElement === document.body) next.focus();
      if (slots.every(Boolean)) { statusEl.textContent = "All placed. Press Check order when you're ready."; checkBtn.focus(); }
      else { const nt = pool.querySelector(".tile"); if (nt) nt.focus(); }
    }
    function unplace(i) {
      if (done || locked[i] || !slots[i]) return;
      slots[i] = null; api.sfx("tap"); render();
    }
    function clearAll() { if (done) return; for (let i = 0; i < slots.length; i++) if (!locked[i]) slots[i] = null; render(); }

    function check() {
      if (done || slots.some(s => !s)) return;
      const r = L.checkSequence(p, slots);
      if (r.ok) {
        done = true; api.sfx("right"); api.practiced(p.concepts); api.solved();
        slotBox.querySelectorAll(".slot").forEach(s => s.classList.add("right"));
        statusEl.innerHTML = badge(true, "In order!");
        api.feedback({ kind: "right", text: p.explanation, mood: "cheer" });
        render(); api.next();
        return;
      }
      api.sfx("retry");
      const wrongVal = tileOf(slots[r.firstWrong]).value;
      let text;
      if (letters) text = r.inPlace + " of " + r.total + " letters are in the right place.";
      else text = (p.stepHints && p.stepHints[wrongVal] ? "Think about “" + tileOf(slots[r.firstWrong]).label + "”: " + p.stepHints[wrongVal] : "") ;
      if (lockOnCheck) {
        // keep the correct ones, send the others back to try again
        r.positions.forEach((ok, i) => { if (ok) { if (!locked[i]) locked[i] = true; } else slots[i] = null; });
        statusEl.innerHTML = badge(false, (r.total - r.inPlace) + " to fix") + " The cards in the right place stay put.";
      } else {
        statusEl.innerHTML = badge(false, r.inPlace + " of " + r.total + " in the right place") + " Swap cards and check again.";
        if (!letters) text = r.inPlace + " of " + r.total + " are in the right place. " + text;
      }
      render();
      api.miss({ text: text.trim() });
    }
    checkBtn.addEventListener("click", check);
    node.querySelector(".clear").addEventListener("click", clearAll);
    render();
    return {
      onKey(e) {
        if (!letters || done || e.ctrlKey || e.metaKey || e.altKey) return false;
        if (e.key === "Backspace") { const i = slots.map((s, k) => (s && !locked[k] ? k : -1)).filter(k => k >= 0).pop(); if (i != null) unplace(i); e.preventDefault(); return true; }
        if (e.key === "Enter" && !checkBtn.disabled && document.activeElement === document.body) { check(); return true; }
        if (/^[a-z]$/i.test(e.key)) {
          const t = p.tiles.find(t => t.value === e.key.toUpperCase() && !slots.includes(t.id));
          if (t) { placeTile(t.id); e.preventDefault(); return true; }
        }
        return false;
      },
      showHelp() {
        if (api.helpLevel() >= 2 && api.mode !== "challenge") {
          // place the next correct card for them, as a worked step (never the whole answer)
          const i = slots.findIndex((s, k) => !locked[k]);
          if (i < 0) return false;
          const want = p.answers[0][i];
          const t = p.tiles.find(t => t.value === want && !slots.slice(0, i).includes(t.id) && !locked.some((l, k) => l && slots[k] === t.id));
          if (t) {
            for (let k = 0; k < slots.length; k++) if (slots[k] === t.id) slots[k] = null;
            if (slots[i] && !locked[i]) slots[i] = null;
            slots[i] = t.id; locked[i] = "given"; render();
            statusEl.textContent = "I placed card " + (i + 1) + " for you: " + t.label + ".";
            return true;
          }
        }
        return false;
      },
      destroy() { done = true; }
    };
  };
})(typeof self !== "undefined" ? self : this);
