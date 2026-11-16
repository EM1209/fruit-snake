/* Layout on phone (360×640, 390×844), tablet and desktop, at standard and large text:
 * no sideways scrolling, key controls reachable, touch targets big enough.
 * Screenshots go to test-results/shots for visual review. */
import { test, expect, type Page } from "@playwright/test";
import { open, SE, noOverflow } from "./helpers.ts";

const SCREENS: [string, string][] = [
  ["sound-safari", "explore"], ["sound-safari", "challenge"], ["listen-find", "challenge"], ["snake-rescue", "explore"], ["snake-rescue", "challenge"],
  ["animal-detectives", "explore"], ["animal-detectives", "challenge"], ["little-market", "explore"], ["little-market", "challenge"],
  ["build-habitat", "explore"], ["build-habitat", "challenge"], ["build-habitat", "free"], ["life-cycles", "explore"], ["step-by-step", "explore"],
  ["code-snake", "explore"], ["bug-hunt", "explore"], ["food-chains", "practice"], ["snack-hunt", "practice"], ["code-snake", "practice"]
];
async function smallTargets(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("#scr-play button, #scr-play [role=button]"))
    .filter(b => b.offsetParent && !b.closest(".demo-body") && !b.closest(".sr-only"))
    .map(b => { const r = b.getBoundingClientRect(); return { c: b.className, w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter(r => (r.w < 40 || r.h < 40)));
}

for (const large of [false, true]) {
  test(`every screen fits${large ? " with large text" : ""}`, async ({ page }, info) => {
    const errors = await open(page, large ? { storage: { "snakeExplorers.v1": JSON.stringify({ v: 1, settings: { textSize: "large", voice: false, sound: false } }) } } : {});
    const tag = info.project.name + (large ? "-large" : "");
    await page.screenshot({ path: `test-results/shots/${tag}-home.png` });
    await noOverflow(page, "home");
    await page.click("#exploreBtn");
    await noOverflow(page, "map");
    await page.screenshot({ path: `test-results/shots/${tag}-map.png`, fullPage: true });
    await page.click('[data-world="nature"]');
    await noOverflow(page, "world");
    await page.screenshot({ path: `test-results/shots/${tag}-world.png`, fullPage: true });
    for (const [id, mode] of SCREENS) {
      await SE(page).start(id, mode);
      await page.waitForTimeout(150);
      await noOverflow(page, id + " " + mode);
      expect(await smallTargets(page), id + " " + mode + ": touch targets").toEqual([]);
      // the main action control is reachable (on screen, or by scrolling the stage)
      const action = page.locator("#stage button:not([disabled])").first();
      await action.scrollIntoViewIfNeeded();
      await expect(action).toBeInViewport();
      await page.screenshot({ path: `test-results/shots/${tag}-${id}-${mode}.png` });
    }
    await page.locator("#leaveBtn").click();
    await page.click('[data-go="worlds"]');
    expect(errors).toEqual([]);
  });
}
