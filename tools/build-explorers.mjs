// Bundle Snake Explorers (explorers/) into ONE self-contained HTML file.
//
//   node tools/build-explorers.mjs [out.html] [--fragment]
//        default out: preview/snake-explorers.html
//
// - Inlines explorers/styles.css and every explorers/js/*.js script.
// - Embeds the ORIGINAL Fruit Snake game (www/, read-only) as the Classic Snake
//   view, using the same inlining as tools/build-preview.mjs. The embedded copy
//   gets two preview-only guards: in-memory storage if localStorage is blocked,
//   and speech recognition switched off so the classic game can never ask for
//   the microphone (it falls back to its own tap mode). www/ is never modified.
// - --fragment drops <!doctype>/<html>/<head>/<body> for hosts that add their
//   own document skeleton (a claude.ai Artifact).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "explorers");
const www = join(root, "www");
const args = process.argv.slice(2);
const out = resolve(args.find(a => !a.startsWith("--")) || join(root, "preview", "snake-explorers.html"));
const fragment = args.includes("--fragment");

// ---- the classic game, inlined (www/ is only read) ----
function classicHtml() {
  let html = readFileSync(join(www, "index.html"), "utf8");
  const guard = `<script>
/* Snake Explorers embed only: keep the classic game running where storage is blocked,
   and never let it reach for the microphone. */
(function(){
  try { var k="__fs_probe"; localStorage.setItem(k,"1"); localStorage.removeItem(k); }
  catch(e) {
    var m={}, mem={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null;},
      setItem:function(k,v){m[k]=String(v);}, removeItem:function(k){delete m[k];}, clear:function(){m={};},
      key:function(i){return Object.keys(m)[i]||null;}, get length(){return Object.keys(m).length;}};
    try { Object.defineProperty(window,"localStorage",{configurable:true,get:function(){return mem;}}); } catch(e2) {}
  }
  try { window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; } catch(e) {}
})();
</script>`;
  let n = 0;
  html = html.replace(/<script src="([^"]+\.js)"><\/script>/g, (_, s) => {
    n++;
    return `<script>/* ${s} */\n${readFileSync(join(www, s), "utf8")}\n</script>`;
  });
  if (!n) throw new Error("classic: no scripts inlined — www/index.html changed?");
  return html.replace("</head>", () => guard + "\n</head>");
}

// ---- explorers ----
let html = readFileSync(join(src, "index.html"), "utf8");
const css = readFileSync(join(src, "styles.css"), "utf8");
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`);
let count = 0;
html = html.replace(/<script src="(js\/[^"]+\.js)"><\/script>/g, (_, s) => {
  count++;
  const code = readFileSync(join(src, s), "utf8").replace(/<\/script/gi, "<\\/script");
  return `<script>/* ${s} */\n${code}\n</script>`;
});
if (count < 10) throw new Error("expected the explorers scripts, inlined " + count);
// classic game as a JSON string, safe inside a <script>
const classic = JSON.stringify(classicHtml()).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
html = html.replace('<script>/* js/app.js */', () => `<script>window.SE_CLASSIC_HTML = ${classic};</script>\n<script>/* js/app.js */`);

if (fragment) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  // the host skeleton supplies charset + viewport
  html = head.replace(/<meta charset="utf-8">\s*/, "").replace(/<meta name="viewport"[^>]*>\s*/, "").trim() + "\n" + body.trim() + "\n";
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out} (${count} scripts + styles inlined, classic game embedded, ${(html.length / 1024).toFixed(1)} KB${fragment ? ", fragment" : ""})`);
