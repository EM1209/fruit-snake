// Bundle www/ into ONE self-contained HTML file for a shareable browser preview.
// The game sources are not modified: this script only inlines them.
//
//   node tools/build-preview.mjs [out.html] [--fragment]   (default: preview/fruit-snake.html)
//
// The preview copy gets one addition: a storage guard that falls back to
// in-memory storage when the host page blocks localStorage (sandboxed iframes,
// private windows), so the game still boots there.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "www");
const out = resolve(process.argv.slice(2).find(a => !a.startsWith("--")) || join(root, "preview", "fruit-snake.html"));

let html = readFileSync(join(www, "index.html"), "utf8");

const storageGuard = `<script>
/* preview-only: keep the game running where localStorage is blocked */
(function(){
  try { var k="__fs_probe"; window.localStorage.setItem(k,"1"); window.localStorage.removeItem(k); return; } catch(e) {}
  var m={}, mem={
    getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null;},
    setItem:function(k,v){m[k]=String(v);}, removeItem:function(k){delete m[k];},
    clear:function(){m={};}, key:function(i){return Object.keys(m)[i]||null;},
    get length(){return Object.keys(m).length;}
  };
  try { Object.defineProperty(window,"localStorage",{configurable:true,get:function(){return mem;}}); } catch(e) {}
})();
</script>`;

// inline every local <script src="x.js"></script>
let count = 0;
html = html.replace(/<script src="([^"]+\.js)"><\/script>/g, (_, src) => {
  count++;
  const code = readFileSync(join(www, src), "utf8").replace(/<\/script/gi, "<\\/script");
  return `<script>/* ${src} */\n${code}\n</script>`;
});
if (count === 0) throw new Error("no scripts found to inline — index.html changed?");

// guard goes first, before any game script touches storage
html = html.replace("</head>", storageGuard + "\n</head>");

// --fragment: drop the <!doctype>/<html>/<head>/<body> wrappers for hosts that
// supply their own document skeleton (e.g. a claude.ai Artifact)
if (process.argv.includes("--fragment")) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  html = head.trim() + "\n" + body.trim() + "\n";
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out} (${count} scripts inlined, ${(html.length / 1024).toFixed(1)} KB)`);
