/* mech-sort.js — sort things into baskets.
 * Tap a thing, then tap a basket (works with keyboard: Tab + Enter), or drag it.
 * Each placement is checked by the item's id against the baskets it fits.
 */
(function (root) {
  "use strict";
  const { esc, el, icon, content, badge } = root.SE_UI;

  root.SE_Mech.sort = function mount(stage, api) {
    const p = api.prompt, Art = api.Art, L = api.L;
    const node = el(`
      <div class="sort">
        <div class="tray-wrap"><p class="tray-label" id="trayLabel">Things to sort</p><div class="tray" role="group" aria-labelledby="trayLabel"></div></div>
        <p class="sort-status" aria-live="polite"></p>
        <div class="bins n${p.bins.length}"></div>
      </div>`);
    stage.appendChild(node);
    const tray = node.querySelector(".tray"), bins = node.querySelector(".bins"), statusEl = node.querySelector(".sort-status");
    const misses = {}, results = [];
    let sel = null, done = false, suppressId = null;

    p.items.forEach(it => {
      const b = el(`<button type="button" class="sitem" data-id="${esc(it.id)}" aria-pressed="false" aria-label="${esc(it.label)}">${content(it, Art, { small: true })}<span class="mark"></span></button>`);
      b.addEventListener("click", () => { if (suppressId === it.id) { suppressId = null; return; } select(it.id); });
      b.addEventListener("pointerdown", (e) => startDrag(e, it.id, b));
      tray.appendChild(b);
    });
    p.bins.forEach(bn => {
      const b = el(`<button type="button" class="bin" data-bin="${esc(bn.id)}" aria-label="${esc(bn.label)} basket">
        <span class="bin-head">${content(bn, Art)}</span><span class="bin-items" aria-hidden="true"></span></button>`);
      b.addEventListener("click", () => { if (sel) place(sel, bn.id); else statusEl.textContent = "First pick something from the top, then choose its basket."; });
      bins.appendChild(b);
    });
    const itemBtn = (id) => tray.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const itemOf = (id) => p.items.find(i => i.id === id);

    function select(id) {
      if (done) return;
      sel = sel === id ? null : id;
      tray.querySelectorAll(".sitem").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === sel)));
      api.sfx("tap");
      statusEl.textContent = sel ? "Now choose a basket for the " + itemOf(sel).label + "." : "";
      bins.classList.toggle("ready", !!sel);
    }
    function place(id, binId) {
      const it = itemOf(id), b = itemBtn(id);
      if (!it || !b) return;
      const r = L.checkSort(it, binId);
      if (r.ok) {
        api.sfx("right");
        const binEl = bins.querySelector(`[data-bin="${CSS.escape(binId)}"] .bin-items`);
        binEl.insertAdjacentHTML("beforeend", `<span class="placed" title="${esc(it.label)}">${content(it, Art, { small: true }).replace(/<span class="lab">.*?<\/span>/, "")}</span>`);
        binEl.parentElement.setAttribute("aria-label", binEl.parentElement.getAttribute("aria-label").split(" basket")[0] + " basket, " + binEl.children.length + " inside");
        b.remove();
        api.practiced(it.concepts || []);
        api.solved();
        results.push({ firstTry: !misses[id], solved: true });
        const others = it.bins.filter(x => x !== binId);
        const also = others.length ? " It could also go in " + others.map(o => p.bins.find(z => z.id === o).label).join(" or ") + "." : "";
        api.feedback({ kind: "right", text: it.explain + (it.explain.includes("also") ? "" : also), mood: "happy" });
        sel = null; bins.classList.remove("ready");
        statusEl.textContent = tray.children.length ? tray.children.length + " left to sort." : "";
        if (!tray.children.length) {
          done = true;
          api.feedback({ kind: "right", text: p.explanation, mood: "cheer" });
          api.next({ results });
        } else {
          const first = tray.querySelector(".sitem"); if (first && document.activeElement && document.activeElement.classList.contains("bin")) first.focus();
        }
      } else {
        misses[id] = (misses[id] || 0) + 1;
        api.sfx("retry");
        b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
        b.querySelector(".mark").innerHTML = badge(false, "Try another basket");
        setTimeout(() => { const m = b.querySelector(".mark"); if (m) m.innerHTML = ""; }, 2200);
        api.miss({ text: it.hint, noAuto: true });
        statusEl.textContent = "The " + it.label + " is back on top. Pick it again when you're ready.";
        sel = null; tray.querySelectorAll(".sitem").forEach(x => x.setAttribute("aria-pressed", "false")); bins.classList.remove("ready");
      }
    }

    // ---- drag (optional; tap works everywhere) ----
    function startDrag(e, id, b) {
      if (done || e.button > 0) return;
      const sx = e.clientX, sy = e.clientY;
      let ghost = null;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) {
          ghost = b.cloneNode(true); ghost.classList.add("ghost"); ghost.removeAttribute("id");
          const r = b.getBoundingClientRect(); ghost.style.width = r.width + "px";
          document.body.appendChild(ghost); b.classList.add("lifted");
        }
        if (ghost) {
          ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px";
          const over = document.elementFromPoint(ev.clientX, ev.clientY);
          bins.querySelectorAll(".bin").forEach(x => x.classList.toggle("over", !!over && x.contains(over)));
        }
      };
      const up = (ev) => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
        if (!ghost) return;
        suppressId = id; setTimeout(() => { if (suppressId === id) suppressId = null; }, 400);
        ghost.remove(); b.classList.remove("lifted");
        bins.querySelectorAll(".bin").forEach(x => x.classList.remove("over"));
        const over = document.elementFromPoint(ev.clientX, ev.clientY);
        const bin = over && over.closest && over.closest(".bin");
        if (bin && ev.type === "pointerup") place(id, bin.dataset.bin);
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    }

    return {
      showHelp() {
        const id = sel || (tray.querySelector(".sitem") || {}).dataset && tray.querySelector(".sitem").dataset.id;
        if (id) api.feedback({ kind: "hint", text: itemOf(id).hint, mood: "think" });
        return !!id;
      },
      destroy() { done = true; }
    };
  };
})(typeof self !== "undefined" ? self : this);
