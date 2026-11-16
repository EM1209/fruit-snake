import { type Page, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DIST = resolve(import.meta.dirname, "..", "dist", "index.html");
export const ORIGIN = "https://artifact.test";
/* An artifact-like Content Security Policy: no network, inline code only, data: media. */
export const CSP = [
  "default-src 'none'", "script-src 'unsafe-inline'", "style-src 'unsafe-inline'", "img-src data: blob:", "font-src data:",
  "media-src data: blob:", "connect-src 'none'", "frame-src 'self' about: data:", "base-uri 'none'", "form-action 'none'"
].join("; ");

/** Open the built game behind the CSP. Collects page errors, console errors and CSP violations. */
export async function open(page: Page, opts: { init?: string; storage?: Record<string, string>; noCsp?: boolean } = {}) {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  const html = readFileSync(DIST, "utf8");
  await page.route(ORIGIN + "/**", route => route.fulfill({ status: 200, contentType: "text/html", body: html, headers: opts.noCsp ? {} : { "content-security-policy": CSP } }));
  await page.route(/^https?:\/\/(?!artifact\.test)/, route => { errors.push("network: " + route.request().url()); return route.abort(); });
  if (opts.storage) await page.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, opts.storage);
  if (opts.init) await page.addInitScript(opts.init);
  await page.addInitScript(() => { document.addEventListener("securitypolicyviolation", (e) => { (window as any).__csp = ((window as any).__csp || []).concat(e.violatedDirective + " " + e.blockedURI); }); });
  await page.goto(ORIGIN + "/index.html");
  await expect(page.locator("#scr-home")).toBeVisible();
  return errors;
}
export const SE = (page: Page) => ({
  start: (id: string, mode: string) => page.evaluate(([i, m]) => (window as any).SnakeExplorers.start(i, m), [id, mode]),
  prompt: () => page.evaluate(() => (window as any).SnakeExplorers.prompt()),
  mech: () => page.evaluate(() => (window as any).SnakeExplorers.mech()),
  state: () => page.evaluate(() => (window as any).SnakeExplorers.state()),
  data: () => page.evaluate(() => (window as any).SnakeExplorers.data())
});
/** Go through Next / See how it went. */
export async function next(page: Page) { await page.locator("#nextBtn").click(); }
export async function noOverflow(page: Page, where: string) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
  expect(r.sw, where + ": no sideways scrolling").toBeLessThanOrEqual(r.w + 1);
}
