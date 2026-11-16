// Export the built single file (dist/index.html) as an Artifact page fragment:
// the host supplies <!doctype>, <html>, <head> charset/viewport and <body>, so we
// keep the title, styles and scripts from <head> and everything in <body>.
//   npm run build:artifact   ->   dist/artifact.html
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const dir = resolve(import.meta.dirname, "..", "dist");
const html = readFileSync(resolve(dir, "index.html"), "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/);
const body = html.match(/<body>([\s\S]*)<\/body>/);
if (!head || !body) throw new Error("dist/index.html: no head/body — build first");
const out = head[1].replace(/<meta charset="utf-8">\s*/, "").replace(/<meta name="viewport"[^>]*>\s*/, "").trim() + "\n" + body[1].trim() + "\n";
if (/https?:\/\/(?!www\.w3\.org)[a-z]/i.test(out.replace(/xmlns(:\w+)?="[^"]*"/g, "")) && /<(script|link)[^>]*\s(src|href)="https?:/i.test(out)) throw new Error("artifact must not load anything from the network");
writeFileSync(resolve(dir, "artifact.html"), out);
console.log(`wrote dist/artifact.html (${(out.length / 1024).toFixed(1)} KB)`);
