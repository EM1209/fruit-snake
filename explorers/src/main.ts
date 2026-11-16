/* Snake Explorers — Playful Worlds entry point (Vite + TypeScript).
 * Load order matters: the first-release modules (js/*.js) attach globals that the
 * new TypeScript modules extend, and app.js boots the UI last. */
import "@fontsource/fredoka/latin-500.css";
import "@fontsource/fredoka/latin-600.css";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "../styles.css";
import "./theme.css";

import "../js/logic.js";
import "../js/deck.js";
import "../js/bank.js";
import "../js/levels.js";
import "../js/content.js";
import "../js/art.js";
import "../js/store.js";
import "../js/audio.js";
import "../js/ui.js";
import "../js/mech-collect.js";
import "../js/mech-choose.js";
import "../js/mech-sort.js";
import "../js/mech-sequence.js";
import "../js/mech-plan.js";
import "../js/mech-explore.js";

import classicHtml from "virtual:classic-html";
import { setupPlayfulWorlds } from "./setup.ts";

(window as unknown as { SE_CLASSIC_HTML: string }).SE_CLASSIC_HTML = classicHtml;
setupPlayfulWorlds();

// The UI boots after the new activities, mechanics and art are registered.
await import("../js/icons-static.js");
await import("../js/app.js");
