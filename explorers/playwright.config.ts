// Browser tests run against the BUILT single-file game (dist/index.html), the same
// file that is published — served by a tiny route handler so an artifact-like CSP
// header can be applied. Build first: `npm run build && npm run test:e2e`.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { trace: "off", deviceScaleFactor: 1 },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "phone-360", use: { viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true } },
    { name: "phone-390", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: "tablet", use: { viewport: { width: 820, height: 1180 }, hasTouch: true } }
  ]
});
