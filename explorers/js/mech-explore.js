/* mech-explore.js — discover facts at your own pace. No right or wrong.
 * Each card opened counts as "discovered" (not "practiced").
 */
(function (root) {
  "use strict";
  const { esc, el, icon } = root.SE_UI;

  root.SE_Mech.explore = function mount(stage, api) {
    const p = api.prompt, Art = api.Art;
    const opened = new Set();
    const node = el(`
      <div class="explore">
        <div class="cards n${p.cards.length}"></div>
        <div class="explore-foot"><span class="found-count" aria-live="polite"></span><button type="button" class="btn primary done" hidden>${icon("check")}Done exploring</button></div>
      </div>`);
    stage.appendChild(node);
    const box = node.querySelector(".cards"), countEl = node.querySelector(".found-count"), doneBtn = node.querySelector(".done");
    p.cards.forEach(c => {
      const b = el(`<button type="button" class="fcard" aria-expanded="false" data-id="${esc(c.id)}">
        <span class="pic">${Art.item(c.art, "art")}</span><span class="lab">${esc(c.label.charAt(0).toUpperCase() + c.label.slice(1))}</span>
        <span class="fact" hidden>${esc(c.fact)}</span></button>`);
      b.addEventListener("click", () => {
        const fact = b.querySelector(".fact");
        const first = !opened.has(c.id);
        opened.add(c.id);
        fact.hidden = false; b.setAttribute("aria-expanded", "true"); b.classList.add("open");
        if (first) { api.seen([c.id]); api.sfx("pick"); }
        api.feedback({ kind: "info", text: c.fact, mood: "happy", say: c.label + ". " + c.fact });
        paint();
      });
      box.appendChild(b);
    });
    function paint() {
      countEl.textContent = opened.size + " of " + p.cards.length + " discovered";
      if (opened.size === p.cards.length && doneBtn.hidden) { doneBtn.hidden = false; api.sfx("done"); doneBtn.focus(); }
    }
    doneBtn.addEventListener("click", () => api.complete([{ ungraded: true }], p.explanation));
    paint();
    return { destroy() {} };
  };
})(typeof self !== "undefined" ? self : this);
