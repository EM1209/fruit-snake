/* mech-plan.js — Logic Lab: line up arrows, press Run, watch each step.
 * The program stays after a run so it can be fixed; the step that went wrong
 * is marked. Any route that reaches the leaf counts.
 */
(function (root) {
  "use strict";
  const { esc, el, icon, badge } = root.SE_UI;
  const NAMES = { up: "up", down: "down", left: "left", right: "right" };

  root.SE_Mech.plan = function mount(stage, api) {
    const p = api.prompt, Art = api.Art, L = api.L, lv = p.level;
    let program = [], running = false, done = false, paused = false, timer = null, failAt = -1;
    const node = el(`
      <div class="plan">
        <div class="board-box"><div class="board plan-board" style="--w:${lv.w};--h:${lv.h}" role="img" aria-label="${esc(describe())}"></div></div>
        <div class="side">
          <div class="program-card">
            <div class="st-row"><span class="st-label">Your program</span><span class="count" aria-live="polite"></span></div>
            <ol class="program" aria-label="Your arrows, in order. Tap an arrow to remove it."></ol>
          </div>
          <div class="palette" role="group" aria-label="Add an arrow">
            ${["up", "left", "right", "down"].map(d => `<button type="button" class="dir ${d}" data-add="${d}" aria-label="Add ${d} arrow">${icon(d)}</button>`).join("")}
          </div>
          <div class="plan-foot">
            <button type="button" class="btn ghost undo" aria-label="Undo last arrow">${icon("undo")}<span class="lbl">Undo</span></button>
            <button type="button" class="btn ghost clear" aria-label="Clear all arrows">${icon("trash")}<span class="lbl">Clear</span></button>
            <button type="button" class="btn primary run">${icon("play")}Run</button>
          </div>
        </div>
      </div>`);
    stage.appendChild(node);
    const board = node.querySelector(".plan-board"), progEl = node.querySelector(".program"), countEl = node.querySelector(".count");

    function describe() {
      const pos = (q) => "column " + (q.x + 1) + ", row " + (q.y + 1);
      return "Grid " + lv.w + " by " + lv.h + ". Snake at " + pos(lv.start) + ". Leaf at " + pos(lv.goal) + "." +
        (lv.key ? " Key at " + pos(lv.key) + "." : "") + (lv.rocks.length ? " Rocks at " + lv.rocks.map(r => pos({ x: r[0], y: r[1] })).join("; ") + "." : "");
    }
    // ---- board ----
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) board.appendChild(el(`<div class="pcell" style="grid-column:${x + 1};grid-row:${y + 1}"></div>`));
    const put = (x, y, html, cls) => { const e = el(`<div class="ptoken ${cls}" style="grid-column:${x + 1};grid-row:${y + 1}">${html}</div>`); board.appendChild(e); return e; };
    lv.rocks.forEach(([x, y]) => put(x, y, Art.item("rock", "art"), "rock"));
    const goalEl = put(lv.goal.x, lv.goal.y, Art.item("leaf", "art"), "goal");
    const keyEl = lv.key ? put(lv.key.x, lv.key.y, Art.item("key", "art"), "key") : null;
    const snakeEl = put(lv.start.x, lv.start.y, Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood: "idle" }), "snake");
    const trail = [];
    function moveSnake(x, y, mood) {
      snakeEl.style.gridColumn = x + 1; snakeEl.style.gridRow = y + 1;
      if (mood) snakeEl.innerHTML = Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood });
    }
    function clearTrail() { trail.splice(0).forEach(t => t.remove()); }
    function resetBoard() {
      clearTrail(); moveSnake(lv.start.x, lv.start.y, "idle");
      if (keyEl) keyEl.classList.remove("got");
      board.querySelectorAll(".bump").forEach(b => b.classList.remove("bump"));
    }

    // ---- program ----
    function renderProgram(active) {
      progEl.innerHTML = "";
      program.forEach((d, i) => {
        const li = el(`<li><button type="button" class="chip${i === active ? " active" : ""}${i === failAt ? " fail" : ""}" aria-label="Step ${i + 1}: ${NAMES[d]}${i === failAt ? " (this step went wrong)" : ""}. Tap to remove.">${icon(d)}<span class="n">${i + 1}</span></button></li>`);
        li.firstChild.addEventListener("click", () => removeAt(i));
        progEl.appendChild(li);
      });
      if (!program.length) progEl.innerHTML = `<li class="empty">Add arrows below</li>`;
      countEl.textContent = program.length + " / " + lv.maxMoves + " arrows";
      node.querySelectorAll("[data-add]").forEach(b => { b.disabled = running || done || program.length >= lv.maxMoves; });
      node.querySelector(".run").disabled = running || done || !program.length;
      node.querySelector(".undo").disabled = running || done || !program.length;
      node.querySelector(".clear").disabled = running || done || !program.length;
    }
    function edited() { if (failAt >= 0 || trail.length) { failAt = -1; resetBoard(); } }
    function add(d) {
      if (running || done || program.length >= lv.maxMoves) return;
      edited(); program.push(d); api.sfx("tap"); renderProgram();
    }
    function removeAt(i) { if (running || done) return; edited(); program.splice(i, 1); api.sfx("tap"); renderProgram(); }
    function undo() { if (running || done || !program.length) return; edited(); program.pop(); renderProgram(); }
    function clearAll() { if (running || done) return; edited(); program = []; renderProgram(); }

    // ---- run, one visible step at a time ----
    function run() {
      if (running || done || !program.length) return;
      resetBoard(); failAt = -1;
      const r = L.runProgram(lv, program);
      running = true; renderProgram(0);
      let i = 0;
      const ms = Math.max(280, api.speedMs() || 520);
      const tick = () => {
        if (paused) return;
        if (i < r.steps.length) {
          const s = r.steps[i];
          const prev = i ? r.steps[i - 1] : lv.start;
          trail.push(put(prev.x, prev.y, "", "trail"));
          moveSnake(s.x, s.y);
          if (s.gotKey && keyEl) { keyEl.classList.add("got"); api.sfx("pick"); } else api.sfx("step");
          renderProgram(i + 1 < program.length ? i + 1 : -1);
          i++;
          return;
        }
        clearInterval(timer); timer = null; running = false;
        finish(r);
      };
      timer = setInterval(tick, ms);
      tick();
    }
    function finish(r) {
      if (r.result === "success") {
        done = true; moveSnake(r.pos.x, r.pos.y, "cheer"); goalEl.classList.add("reached");
        api.sfx("right"); api.practiced(p.concepts); api.solved();
        const extra = r.extra > 0 ? " (The last " + (r.extra === 1 ? "arrow wasn't" : r.extra + " arrows weren't") + " needed.)" : "";
        api.feedback({ kind: "right", text: "You reached the leaf in " + (r.at + 1) + " steps! " + p.explanation + extra, mood: "cheer" });
        renderProgram(); api.next();
        return;
      }
      api.sfx("retry"); moveSnake(r.pos.x, r.pos.y, "oops");
      let text;
      if (r.result === "bump-rock" || r.result === "bump-edge") {
        failAt = r.at;
        if (r.result === "bump-rock") { const rock = Array.from(board.querySelectorAll(".rock")).find(e => +e.style.gridColumn === r.tried.x + 1 && +e.style.gridRow === r.tried.y + 1); if (rock) rock.classList.add("bump"); }
        text = "Step " + (r.at + 1) + " (" + NAMES[program[r.at]] + ") " + (r.result === "bump-rock" ? "walks into a rock." : "would leave the garden.") + " Tap that arrow to remove it, then try a different way.";
      } else if (r.result === "need-key") {
        text = "The snake reached the leaf, but it needs the key first. Plan a stop at the key on the way.";
      } else {
        text = "The snake stopped " + r.distance + " square" + (r.distance === 1 ? "" : "s") + " away from the leaf. Add more arrows" + (lv.key && !r.hasKey ? " — and remember the key" : "") + ".";
      }
      renderProgram();
      api.miss({ text });
    }

    node.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => add(b.dataset.add)));
    node.querySelector(".undo").addEventListener("click", undo);
    node.querySelector(".clear").addEventListener("click", clearAll);
    node.querySelector(".run").addEventListener("click", run);
    renderProgram();

    return {
      onKey(e) {
        const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
        if (map[e.key]) { e.preventDefault(); add(map[e.key]); return true; }
        if (e.key === "Backspace") { e.preventDefault(); undo(); return true; }
        return false;
      },
      pause() { paused = true; },
      resume() { paused = false; },
      destroy() { if (timer) clearInterval(timer); done = true; },
      debug: () => ({ program: program.slice(), running, done, level: lv })
    };
  };
})(typeof self !== "undefined" ? self : this);
