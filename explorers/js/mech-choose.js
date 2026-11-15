/* mech-choose.js — tap / match / pick-several, no continuous movement.
 * Validates by option id through SE_Logic.checkChoice. Wrong picks are marked
 * with an icon AND words, get a specific hint, and the player tries again.
 */
(function (root) {
  "use strict";
  const { esc, el, icon, content, badge } = root.SE_UI;

  function visualHtml(v, Art) {
    if (!v) return "";
    if (v.kind === "dots") {
      return `<div class="vis vis-dots">` + v.groups.map((g, i) =>
        (i ? `<span class="op" aria-hidden="true">${esc(v.op || "")}</span>` : "") +
        `<span class="dot-group" role="img" aria-label="${g.n} ${g.n === 1 ? "berry" : "berries"}">${Array.from({ length: g.n }, () => Art.item(g.art, "dot")).join("")}</span>`).join("") + `</div>`;
    }
    if (v.kind === "numberline") return `<div class="vis vis-line">` + v.items.map(t => `<span class="nbox${t === "?" ? " blank" : ""}">${esc(t)}</span>`).join("") + `</div>`;
    if (v.kind === "equation") return `<div class="vis vis-eq">${esc(v.text)}</div>`;
    if (v.kind === "pattern") return `<div class="vis vis-pattern" role="list" aria-label="Pattern">` + v.seq.map((s, i) =>
      s ? `<span class="pslot" role="listitem" aria-label="${esc(s.label)}">${Art.shapeSvg(s.shape, s.color, "art")}</span>`
        : `<span class="pslot blank" role="listitem" aria-label="missing piece">?</span>`).join("") + `</div>`;
    return "";
  }

  root.SE_Mech.choose = function mount(stage, api) {
    const p = api.prompt, Art = api.Art, L = api.L;
    const multi = p.rule.type !== "one";
    const need = L.choiceNeed(p.rule);
    let extra = "";
    if (p.story) extra = `<div class="story">${Art.item(p.story.who, "art")}<p>${esc(p.story.text)}</p></div>`;
    else if (p.checklist) extra = `<div class="story checklist">${Art.item(p.scene, "art")}<div><b>Picnic list</b><ul>${p.checklist.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div></div>`;
    else if (p.scene) extra = `<div class="story">${Art.item(p.scene, "art")}<p>${esc(p.instruction.split(". ")[0])}.</p></div>`;
    const wide = p.wide || p.options.some(o => o.text && String(o.text).length > 14) || p.options.some(o => o.dots);
    const node = el(`
      <div class="choose${multi ? " multi" : ""}">
        ${extra}${visualHtml(p.visual, Art)}
        <div class="options ${wide ? "wide" : ""} n${p.options.length}" role="group" aria-label="Answer choices"></div>
        ${multi ? `<div class="choose-foot"><span class="pick-count" aria-live="polite"></span><button type="button" class="btn primary check">${icon("check")}Check</button></div>` : ""}
      </div>`);
    stage.appendChild(node);
    const box = node.querySelector(".options");
    const selected = new Set(), wrongOnce = new Set();
    let done = false;

    p.options.forEach(o => {
      const b = el(`<button type="button" class="opt" data-id="${esc(o.id)}" ${multi ? 'aria-pressed="false"' : ""} aria-label="${esc(o.label)}">${content(o, Art)}<span class="mark"></span></button>`);
      b.addEventListener("click", () => tap(o.id, b));
      box.appendChild(b);
    });
    const btnOf = (id) => box.querySelector(`[data-id="${CSS.escape(id)}"]`);

    function paintCount() {
      if (!multi) return;
      const c = node.querySelector(".pick-count");
      c.textContent = p.rule.type === "all" ? `${selected.size} picked` : `${selected.size} of ${need} picked`;
    }
    function tap(id, b) {
      if (done || b.disabled) return;
      api.sfx("tap");
      if (!multi) { check([id]); return; }
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      b.setAttribute("aria-pressed", String(selected.has(id)));
      b.classList.remove("is-wrong"); b.querySelector(".mark").innerHTML = "";
      paintCount();
    }
    function check(sel) {
      const r = L.checkChoice(p.rule, sel);
      if (r.ok) {
        done = true;
        sel.forEach(id => { const b = btnOf(id); b.classList.add("is-right"); b.querySelector(".mark").innerHTML = badge(true, "Yes!"); });
        box.querySelectorAll(".opt").forEach(b => { b.disabled = true; });
        const cb = node.querySelector(".check"); if (cb) cb.disabled = true;
        api.sfx("right"); api.practiced(p.concepts);
        api.feedback({ kind: "right", text: p.explanation, mood: "cheer" });
        api.next();
        return;
      }
      api.sfx("retry");
      let text = "";
      if (r.wrong.length) {
        r.wrong.forEach(id => {
          const b = btnOf(id);
          b.classList.add("is-wrong"); b.querySelector(".mark").innerHTML = badge(false, "Not this one");
          if (!multi) b.disabled = true;           // one less to think about next try
          selected.delete(id); if (multi) b.setAttribute("aria-pressed", "false");
          wrongOnce.add(id);
        });
        const w = r.wrong.find(id => p.wrongHints && p.wrongHints[id]);
        text = w ? p.wrongHints[w] : "";
        if (multi && r.right.length) text = (text ? text + " " : "") + "Keep the " + (r.right.length === 1 ? "one" : r.right.length + " ") + " that fit" + (r.right.length === 1 ? "s" : "") + ".";
      } else if (multi) {
        const missing = (r.missing && r.missing.length) || Math.max(0, need - sel.length);
        text = sel.length === 0 ? "Pick something first." : (r.groupShort && r.groupShort.length && !r.missing.length)
          ? (r.groupShort[0].have > r.groupShort[0].n ? "Only one rain item is needed." : "Good so far — now add one thing for rain.")
          : "Good so far! " + (p.rule.type === "some" ? "Pick " + need + " in all." : "Something is still missing" + (missing > 0 ? " (" + missing + " more)." : "."));
        if (sel.length === 0) { api.feedback({ kind: "info", text, mood: "think" }); return; }
      }
      api.miss({ text });
      paintCount();
    }
    if (multi) node.querySelector(".check").addEventListener("click", () => { if (!done) check(Array.from(selected)); });
    paintCount();

    return {
      showHelp() {
        if (api.helpLevel() >= 2 && api.mode !== "challenge" && !multi) {
          // narrow the field: fade one remaining wrong choice (never reveals the answer outright)
          const valid = new Set(p.rule.valid || []);
          const fade = Array.from(box.querySelectorAll(".opt:not([disabled])")).find(b => !valid.has(b.dataset.id));
          if (fade) { fade.disabled = true; fade.classList.add("faded"); }
        }
      },
      destroy() { done = true; }
    };
  };
})(typeof self !== "undefined" ? self : this);
