/* mech-collect.js — steer the snake to collect things (Snack Hunt, Berry Basket).
 * Forgiving movement: walls wrap, the snake never crashes into itself, it waits
 * for the player after every wrong pick, and speed is a separate setting
 * (including "one step per press"). Controls sit outside the board.
 */
(function (root) {
  "use strict";
  const { esc, el, icon, badge } = root.SE_UI;
  const N = 9;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  root.SE_Mech.collect = function mount(stage, api) {
    const p = api.prompt, Art = api.Art;
    const node = el(`
      <div class="collect">
        <div class="board-box"><div class="board grid-board" role="group" aria-label="Garden board. Use the arrow buttons, arrow keys, or swipe to steer."></div></div>
        <div class="side">
          <div class="status-card" aria-live="polite"></div>
          <div class="dpad" role="group" aria-label="Steer the snake">
            <button type="button" class="dir up" data-dir="up" aria-label="Move up">${icon("up")}</button>
            <button type="button" class="dir left" data-dir="left" aria-label="Move left">${icon("left")}</button>
            <span class="dpad-mid" aria-hidden="true"></span>
            <button type="button" class="dir right" data-dir="right" aria-label="Move right">${icon("right")}</button>
            <button type="button" class="dir down" data-dir="down" aria-label="Move down">${icon("down")}</button>
          </div>
        </div>
      </div>`);
    stage.appendChild(node);
    const board = node.querySelector(".board"), status = node.querySelector(".status-card"), mid = node.querySelector(".dpad-mid");

    // ---- state ----
    let snake = [{ x: 2, y: 4 }, { x: 1, y: 4 }, { x: 0, y: 4 }];
    let dir = "right", nextDir = "right", grow = 0;
    let waiting = true, paused = false, done = false, timer = null;
    let items = [];
    let have = 0, eaten = 0, uid = 0;
    const segEls = [];

    function place(x, y, e) { e.style.left = (x * 100 / N) + "%"; e.style.top = (y * 100 / N) + "%"; }
    function occupied(x, y) { return snake.some(s => s.x === x && s.y === y) || items.some(i => i.x === x && i.y === y); }
    function freeCell() {
      const h = snake[0], ahead = [];
      for (let k = 1; k <= 2; k++) ahead.push(((h.x + DIRS[dir][0] * k) + N) % N + "," + ((h.y + DIRS[dir][1] * k) + N) % N);
      for (let t = 0; t < 400; t++) {
        const x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
        if (!occupied(x, y) && !ahead.includes(x + "," + y) && Math.abs(x - h.x) + Math.abs(y - h.y) > 1) return { x, y };
      }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!occupied(x, y)) return { x, y };
      return { x: 0, y: 0 };
    }
    function addItem(kind, art) {
      const c = freeCell();
      const it = { uid: ++uid, kind, id: art, x: c.x, y: c.y };
      it.el = el(`<div class="cell-item kind-${kind}" data-item="${esc(art)}">${Art.item(art, "art")}</div>`);
      place(it.x, it.y, it.el);
      board.appendChild(it.el);
      items.push(it);
      return it;
    }
    function removeItem(it, pop) {
      items = items.filter(i => i !== it);
      if (pop && !api.reducedMotion()) { it.el.classList.add("eaten"); setTimeout(() => it.el.remove(), 380); }
      else it.el.remove();
    }

    // ---- setup per prompt kind ----
    const explorePool = (p.pool || []).slice();
    function nextExploreArt() {
      const onBoard = new Set(items.map(i => i.id));
      const fresh = explorePool.filter(id => !onBoard.has(id) && !api.isSeen(id));
      const pool = fresh.length ? fresh : explorePool.filter(id => !onBoard.has(id));
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (p.kind === "find") p.board.forEach(id => addItem("food", id));
    else if (p.kind === "explore") for (let i = 0; i < 4; i++) addItem("food", nextExploreArt());
    else if (p.kind === "count") { addItem("basket", "basket"); for (let i = 0; i < p.berries; i++) addItem("berry", "berry"); }

    // ---- snake rendering ----
    function renderSnake() {
      while (segEls.length < snake.length) {
        const i = segEls.length;
        const e = el(i === 0 ? `<div class="sn head">${Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood: "idle" })}</div>` : `<div class="sn body"></div>`);
        board.appendChild(e); segEls.push(e);
        if (i > 0 && snake[i]) place(snake[i].x, snake[i].y, e);
      }
      snake.forEach((s, i) => {
        const e = segEls[i];
        const prevX = +e.dataset.x, prevY = +e.dataset.y;
        const jump = !isNaN(prevX) && (Math.abs(prevX - s.x) > 1 || Math.abs(prevY - s.y) > 1);
        e.classList.toggle("jump", jump);
        e.dataset.x = s.x; e.dataset.y = s.y;
        place(s.x, s.y, e);
        e.style.zIndex = String(50 - Math.min(i, 40));
      });
      segEls[0].dataset.dir = dir;
    }
    function setMood(m) {
      const h = segEls[0]; if (!h) return;
      h.innerHTML = Art.head({ color: "var(--snake)", accessory: api.look.accessory, mood: m });
    }

    // ---- status panel ----
    function frameHtml() {
      const size = Math.max(10, Math.ceil(Math.max(p.target, have) / 5) * 5);
      let cells = "";
      for (let i = 0; i < size; i++) {
        const filled = i < have, tgt = p.display === "frame" && i < p.target;
        cells += `<span class="fc${filled ? " on" : ""}${tgt ? " tgt" : ""}">${filled ? Art.item("berry", "dot") : ""}</span>`;
      }
      return `<div class="frame" role="img" aria-label="${have} ${have === 1 ? "berry" : "berries"} collected">${cells}</div>`;
    }
    function renderStatus() {
      if (p.kind === "count") {
        const goal = p.display === "expr" ? p.expr : String(p.target);
        status.innerHTML = `<div class="st-row"><span class="st-label">Basket needs</span><span class="st-goal">${esc(goal)}</span></div>` +
          frameHtml() + (p.display === "frame" ? `<div class="st-have">Collected: <b>${have}</b></div>` : "") +
          `<button type="button" class="btn small ghost putback" ${have ? "" : "disabled"}>${icon("undo")}Put one back</button>`;
        status.querySelector(".putback").onclick = putBack;
      } else if (p.kind === "explore") {
        status.innerHTML = `<div class="st-row"><span class="st-label">Snacks met</span><span class="st-goal">${eaten} / ${p.goal}</span></div><div class="last-found"></div>`;
      } else {
        status.innerHTML = `<div class="st-row"><span class="st-label">Looking for</span></div><div class="st-target">${esc(api.mode === "challenge" ? "Read the clue" : p.target ? cap(api.foodName(p.target)) : "")}</div>`;
      }
      mid.innerHTML = waiting && !done ? `<span class="go-hint">${api.speedName() === "step" ? "Tap an arrow to step" : "Tap an arrow to go"}</span>` : "";
    }
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    function putBack() {
      if (have <= 0) return;
      have--; addItem("berry", "berry"); api.sfx("tap");
      api.feedback({ kind: "info", text: "One berry back in the meadow. You have " + have + ".", mood: "idle" });
      renderStatus();
    }

    // ---- movement ----
    function setDir(d) {
      if (done || paused) return;
      const [dx, dy] = DIRS[d], [cx, cy] = DIRS[dir];
      if (snake.length > 1 && dx === -cx && dy === -cy) return; // no reversing into yourself
      nextDir = d;
      if (api.speedName() === "step") { waiting = false; step(); waiting = true; renderStatus(); return; }
      if (waiting) { waiting = false; renderStatus(); start(); }
    }
    function start() { stop(); const ms = api.speedMs(); if (ms) timer = setInterval(step, ms); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function halt() { waiting = true; stop(); renderStatus(); }

    function step() {
      if (paused || done || waiting) return;
      dir = nextDir;
      const [dx, dy] = DIRS[dir];
      const h = snake[0];
      const nh = { x: (h.x + dx + N) % N, y: (h.y + dy + N) % N };
      snake.unshift(nh);
      if (grow > 0) grow--; else snake.pop();
      renderSnake();
      const hit = items.find(i => i.x === nh.x && i.y === nh.y);
      if (hit) handle(hit);
    }

    function handle(it) {
      if (p.kind === "find") {
        api.seen([it.id]);
        if (it.id === p.target) {
          removeItem(it, true); grow += 1; done = true; stop();
          setMood("cheer"); api.sfx("right"); api.practiced(p.concepts);
          api.feedback({ kind: "right", text: p.explanation, mood: "cheer", say: cap(api.foodName(it.id)) + "! " + p.explanation });
          api.celebrate(board, it);
          api.next();
        } else {
          halt(); setMood("oops"); api.sfx("retry");
          it.el.classList.remove("wiggle"); void it.el.offsetWidth; it.el.classList.add("wiggle");
          flagWrong(it);
          api.miss({ text: p.wrongHints[it.id] });
          setTimeout(() => setMood("idle"), 1200);
        }
      } else if (p.kind === "explore") {
        removeItem(it, true); eaten++; grow += 1;
        api.seen([it.id]);
        const f = api.food(it.id);
        api.sfx("pick"); setMood("happy");
        api.feedback({ kind: "info", text: cap(f.name) + "! " + f.fact, mood: "happy", say: f.name + ". " + f.fact });
        renderStatus();
        status.querySelector(".last-found").innerHTML = `<span class="pic">${Art.item(it.id, "art")}</span><b>${esc(cap(f.name))}</b>`;
        if (eaten >= p.goal) { done = true; stop(); setTimeout(() => { api.complete([{ ungraded: true }]); }, 1600); }
        else addItem("food", nextExploreArt());
        setTimeout(() => setMood("idle"), 900);
      } else if (p.kind === "count") {
        if (it.kind === "berry") {
          removeItem(it, true); have++; api.sfx("pick"); renderStatus();
        } else {
          if (have === p.target) {
            done = true; stop(); setMood("cheer"); api.sfx("right"); api.practiced(p.concepts);
            api.feedback({ kind: "right", text: p.explanation, mood: "cheer" });
            api.celebrate(board, it); api.next();
          } else {
            halt(); setMood("think"); api.sfx("retry");
            const goal = p.display === "expr" ? p.expr : p.target;
            const text = have < p.target
              ? "You have " + have + ". That's not enough yet — the basket needs " + (p.display === "expr" ? goal : p.target) + "."
              : "You have " + have + ". That's more than " + (p.display === "expr" ? goal : p.target) + ". Tap “Put one back” to return one.";
            api.miss({ text });
            setTimeout(() => setMood("idle"), 1400);
          }
        }
      }
    }
    function flagWrong(it) {
      const tag = el(`<div class="wrong-tag">${badge(false, "Not this")}</div>`);
      it.el.appendChild(tag);
      setTimeout(() => tag.remove(), 1800);
    }

    // ---- input ----
    node.querySelectorAll(".dir").forEach(b => b.addEventListener("click", () => setDir(b.dataset.dir)));
    let sx = 0, sy = 0, tracking = false;
    board.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; tracking = true; });
    board.addEventListener("pointerup", e => {
      if (!tracking) return; tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    });
    board.addEventListener("pointercancel", () => { tracking = false; });

    renderSnake(); renderStatus();

    return {
      onKey(e) {
        const k = e.key;
        const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
        if (map[k]) { e.preventDefault(); setDir(map[k]); return true; }
        return false;
      },
      pause() { paused = true; stop(); },
      resume() { paused = false; if (!waiting && !done) start(); },
      speedChanged() { if (!waiting && !done && !paused) start(); if (api.speedName() === "step") { stop(); waiting = true; } renderStatus(); },
      showHelp() {
        if (p.kind === "find" && api.helpLevel() >= 2) {
          const t = items.find(i => i.id === p.target); if (t) { t.el.classList.add("glow"); }
        }
      },
      destroy() { stop(); done = true; },
      debug: () => ({ snake: snake.map(s => ({ ...s })), dir, items: items.map(i => ({ id: i.id, kind: i.kind, x: i.x, y: i.y })), have, waiting, N })
    };
  };
})(typeof self !== "undefined" ? self : this);
