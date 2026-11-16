/* ui.js — Snake Explorers small DOM helpers + interface icons. */
(function (root) {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  const P = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    home: `<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" ${P}/>`,
    back: `<path d="M15 5l-7 7 7 7" ${P}/>`,
    speaker: `<path d="M4 9h4l5-4v14l-5-4H4z" ${P}/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" ${P}/>`,
    help: `<circle cx="12" cy="12" r="9" ${P}/><path d="M9.5 9.5a2.6 2.6 0 115 1c-.8 1-2.5 1.5-2.5 3" ${P}/><circle cx="12" cy="17" r="1.2" fill="currentColor"/>`,
    pause: `<path d="M9 5v14M15 5v14" ${P} stroke-width="3"/>`,
    play: `<path d="M8 5l11 7-11 7z" ${P}/>`,
    check: `<path d="M5 12.5l4.5 4.5L19 7.5" ${P} stroke-width="3"/>`,
    cross: `<path d="M7 7l10 10M17 7L7 17" ${P} stroke-width="3"/>`,
    lock: `<rect x="5" y="11" width="14" height="9" rx="2" ${P}/><path d="M8 11V8a4 4 0 018 0v3" ${P}/>`,
    book: `<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" ${P}/><path d="M12 6v14" ${P}/>`,
    palette: `<path d="M12 3a9 9 0 100 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 004-4c0-4.5-4-8-9-8z" ${P}/><circle cx="7.5" cy="11" r="1.3" fill="currentColor"/><circle cx="10" cy="7" r="1.3" fill="currentColor"/><circle cx="15" cy="7" r="1.3" fill="currentColor"/>`,
    gear: `<circle cx="12" cy="12" r="3" ${P}/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" ${P}/>`,
    snake: `<path d="M4 18c3 2 6 1 7-2s2-6 6-5 3 5 0 6" ${P}/><circle cx="17.5" cy="7.5" r="3" ${P}/>`,
    refresh: `<path d="M19 8a8 8 0 10.5 6" ${P}/><path d="M19.5 3.5V8H15" ${P}/>`,
    up: `<path d="M12 19V5M6 11l6-6 6 6" ${P} stroke-width="3"/>`,
    down: `<path d="M12 5v14M6 13l6 6 6-6" ${P} stroke-width="3"/>`,
    left: `<path d="M19 12H5M11 6l-6 6 6 6" ${P} stroke-width="3"/>`,
    right: `<path d="M5 12h14M13 6l6 6-6 6" ${P} stroke-width="3"/>`,
    undo: `<path d="M9 7L4 12l5 5" ${P}/><path d="M4 12h10a6 6 0 010 12" ${P}/>`,
    trash: `<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" ${P}/>`,
    star: `<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" ${P}/>`,
    clock: `<circle cx="12" cy="12" r="9" ${P}/><path d="M12 7v5l3 2" ${P}/>`,
    skip: `<path d="M6 6l8 6-8 6zM17 6v12" ${P}/>`,
    leaf: `<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l8-8" ${P}/>`
  };
  const icon = (name, label) => `<svg class="ico" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"'}>${ICONS[name] || ""}</svg>`;

  // Picture/label content shared by option buttons, tiles, sort items, bins.
  function content(o, Art, opts) {
    const small = opts && opts.small;
    let pic = "";
    if (o.shape) pic = Art.shapeSvg(o.shape.shape, o.shape.color, "art");
    else if (o.art) pic = Art.item(o.art, "art");
    else if (o.dots) pic = `<span class="dots" data-n="${o.dots.n}">` + Array.from({ length: o.dots.n }, () => Art.item(o.dots.art, "dot")).join("") + `</span>`;
    else if (o.cells) pic = Art.cells(o.cells, "art cells");
    else if (o.swatch) pic = `<span class="swatch sw-${o.swatch}">${Art.shapeSvg("circle", o.swatch, "art")}</span>`;
    const big = o.text != null && !o.art && !o.shape && !o.dots ? `<span class="big-text${String(o.text).length > 14 ? " long" : ""}">${esc(o.text)}</span>` : "";
    const lab = (o.text != null && big) ? "" : `<span class="lab">${esc(o.label)}</span>`;
    const note = o.note && !small ? `<span class="note">${esc(o.note)}</span>` : "";
    return (pic ? `<span class="pic">${pic}</span>` : "") + big + lab + note;
  }
  // A result badge that never relies on color alone: icon + words.
  const badge = (ok, text) => `<span class="badge ${ok ? "ok" : "no"}">${icon(ok ? "check" : "cross")}<span>${esc(text || (ok ? "Yes!" : "Not this one"))}</span></span>`;

  function shuffleInPlace(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  root.SE_UI = { esc, el, icon, content, badge, shuffleInPlace };
  root.SE_Mech = root.SE_Mech || {};
})(typeof self !== "undefined" ? self : this);
