/// <reference types="vitest/config" />
// Snake Explorers build: Vite 8 + TypeScript, exported as ONE self-contained HTML
// file (vite-plugin-singlefile) so the game runs offline, inside an Artifact's
// CSP, or from disk — no CDN or network at runtime.
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const here = resolve(import.meta.dirname);
const www = resolve(here, "..", "www");

/* The first-release modules in js/ are UMD files that attach browser globals
 * (window.SE_Logic, …) and also export via CommonJS for the Node tests. In a
 * bundle, `module` could look defined, so we pin the browser branch: the
 * browser path is exactly what shipped before. */
function legacyGlobals(): Plugin {
  return {
    name: "explorers-legacy-globals",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]explorers[\\/]js[\\/][^\\/]+\.js$/.test(id)) return null;
      return { code: code.replace(/typeof module === "object" && module\.exports/g, "false"), map: null };
    }
  };
}

/* Classic Snake: the ORIGINAL www/ game, read-only, inlined into one HTML string
 * shown in an iframe. Two embed-only guards (also used by the previous release):
 * in-memory storage if localStorage is blocked, and speech recognition switched
 * off so the classic game can never ask for the microphone. */
function classicHtml(): Plugin {
  const VID = "virtual:classic-html", RID = "\0" + VID;
  return {
    name: "explorers-classic-html",
    resolveId(id) { return id === VID ? RID : null; },
    load(id) {
      if (id !== RID) return null;
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
      html = html.replace(/<script src="([^"]+\.js)"><\/script>/g, (_m, s: string) => { n++; return `<script>/* ${s} */\n${readFileSync(join(www, s), "utf8")}\n</script>`; });
      if (!n) throw new Error("classic: no scripts inlined — www/index.html changed?");
      html = html.replace("</head>", () => guard + "\n</head>");
      this.addWatchFile(join(www, "index.html"));
      return `export default ${JSON.stringify(html)};`;
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [legacyGlobals(), classicHtml(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: "dist",
    target: "es2022",
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000,
    reportCompressedSize: false
  },
  server: { port: 8790, strictPort: true, fs: { allow: [resolve(here, "..")] } },
  preview: { port: 8791, strictPort: true },
  test: {
    include: ["tests-ts/**/*.test.ts"],
    environment: "node"
  }
});
