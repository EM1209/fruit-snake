/* icons-static.js — fill the page's [data-icon] placeholders with SVG icons. */
(function () {
  "use strict";
  document.querySelectorAll("[data-icon]").forEach(n => { n.innerHTML = window.SE_UI.icon(n.dataset.icon); n.classList.add("ico-wrap"); });
})();
