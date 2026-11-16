/* scenes.ts — layered scenic backdrops (sky, far hills, near hills, details)
 * for the world map, each world, and the play screen. Pure SVG strings, no
 * images to load. Decorative only (aria-hidden); motion is CSS and respects
 * reduced-motion. */
type Palette = { sky1: string; sky2: string; far: string; mid: string; near: string; accent: string };
export const PALETTES: Record<string, Palette> = {
  word: { sky1: "#FDE8EF", sky2: "#FFF6E9", far: "#E9C9D9", mid: "#A9D98E", near: "#7CC27A", accent: "#F2A3C4" },
  number: { sky1: "#FFF1CF", sky2: "#FFF9EA", far: "#EBD9A5", mid: "#B9DC86", near: "#8CC76E", accent: "#F4CF4E" },
  pattern: { sky1: "#DDEBFB", sky2: "#F3F8FF", far: "#BFD3EE", mid: "#9FD3B9", near: "#73BFA0", accent: "#7FA9E8" },
  nature: { sky1: "#DDF1F7", sky2: "#F2FBF5", far: "#B3D7C2", mid: "#8CCB7D", near: "#5EAE62", accent: "#5DB46E" },
  logic: { sky1: "#E8E1FA", sky2: "#F7F3FF", far: "#CFC3EE", mid: "#A7CF9A", near: "#7DBB80", accent: "#9B7BE0" },
  everyday: { sky1: "#FFE6DA", sky2: "#FFF6EF", far: "#F0CBB6", mid: "#B7D891", near: "#8DC474", accent: "#F2A07A" },
  home: { sky1: "#D9ECFA", sky2: "#FFF7EC", far: "#C5DDEB", mid: "#A6D791", near: "#79C072", accent: "#7B4FD6" }
};
const hills = (p: Palette) => `
  <path d="M0 230C120 170 260 190 380 210S640 160 780 190 1040 170 1200 200V400H0z" fill="${p.far}"/>
  <path d="M0 280C160 240 300 255 460 270S760 230 900 250 1100 240 1200 255V400H0z" fill="${p.mid}"/>
  <path d="M0 330C200 300 380 320 560 326S900 300 1200 318V400H0z" fill="${p.near}"/>`;
const cloud = (x: number, y: number, s: number) => `<g class="sc-cloud" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="46" ry="18" fill="#fff" opacity=".9"/><ellipse cx="-24" cy="4" rx="26" ry="14" fill="#fff" opacity=".9"/><ellipse cx="28" cy="5" rx="24" ry="13" fill="#fff" opacity=".9"/></g>`;
const tree = (x: number, y: number, s: number, c = "#4FA764") => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-10" width="12" height="40" rx="4" fill="#8A5A2E"/><circle cx="0" cy="-30" r="30" fill="${c}"/><circle cx="-20" cy="-14" r="18" fill="${c}"/><circle cx="20" cy="-14" r="18" fill="${c}"/><circle cx="-8" cy="-40" r="8" fill="#fff" opacity=".18"/></g>`;
const flower = (x: number, y: number, c: string) => `<g transform="translate(${x} ${y})"><path d="M0 0v-22" stroke="#4E9E5C" stroke-width="3"/>${[0, 72, 144, 216, 288].map(a => `<circle cx="${7 * Math.cos(a * Math.PI / 180)}" cy="${-22 + 7 * Math.sin(a * Math.PI / 180)}" r="6" fill="${c}"/>`).join("")}<circle cx="0" cy="-22" r="4" fill="#F4CF4E"/></g>`;
const DETAILS: Record<string, (p: Palette) => string> = {
  word: (p) => [80, 210, 330, 900, 1010, 1130].map((x, i) => flower(x, 350 + (i % 2) * 18, i % 2 ? p.accent : "#B49CF0")).join("") + tree(1060, 262, 0.9, "#6CBF6A"),
  number: () => [[120, 300], [300, 318], [980, 300], [1120, 320]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="40" ry="26" fill="#4FA764"/>${[[-14, -6], [6, -12], [18, 4], [-4, 8]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="6" fill="#D2456B"/>`).join("")}</g>`).join(""),
  pattern: (p) => [[160, 120, "#F2A3C4"], [1040, 100, "#F4CF4E"], [880, 150, p.accent]].map(([x, y, c], i) => `<g class="sc-kite" transform="translate(${x} ${y}) rotate(${i * 12 - 10})"><path d="M0 -34L22 0 0 34-22 0z" fill="${c}"/><path d="M0 34c8 20-8 30 4 52" fill="none" stroke="#3A2E4D" stroke-width="2" opacity=".4"/></g>`).join(""),
  nature: () => tree(90, 280, 1.1) + tree(210, 300, 0.8, "#5DB46E") + tree(1000, 270, 1.2, "#47A960") + tree(1120, 296, 0.85) + `<ellipse cx="620" cy="350" rx="120" ry="20" fill="#7EC3E3" opacity=".8"/>`,
  logic: (p) => Array.from({ length: 8 }, (_, i) => `<rect x="${140 + i * 120}" y="${330 - (i % 2) * 14}" width="70" height="24" rx="10" fill="#fff" opacity=".55"/>`).join("") + `<circle cx="1060" cy="110" r="10" fill="${p.accent}" opacity=".5"/><circle cx="1100" cy="80" r="6" fill="${p.accent}" opacity=".5"/>`,
  everyday: () => [[120, 300, "#F2A07A"], [1030, 290, "#7FA9E8"]].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><rect x="-40" y="-40" width="80" height="60" rx="6" fill="#FFF6EF"/><path d="M-50-38L0-80 50-38z" fill="${c}"/><rect x="-10" y="-8" width="20" height="28" rx="4" fill="${c}"/><rect x="-32" y="-28" width="16" height="14" rx="3" fill="#BFE3F5"/></g>`).join(""),
  home: (p) => tree(110, 290, 1) + tree(1080, 280, 1.1, "#5DB46E") + flower(260, 360, "#F2A3C4") + flower(940, 362, p.accent)
};
/** A full-width scenic band for a world (or "home"). */
export function worldScene(id: string): string {
  const p = PALETTES[id] || PALETTES.home;
  const g = "g" + id;
  return `<svg class="scene-svg" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.sky2}"/></linearGradient></defs>
    <rect width="1200" height="400" fill="url(#${g})"/>
    <circle cx="980" cy="90" r="44" fill="#FFE59A" opacity=".85"/>
    ${cloud(220, 90, 1)}${cloud(640, 60, 0.8)}${cloud(1080, 150, 0.7)}
    ${hills(p)}${(DETAILS[id] || DETAILS.home)(p)}
  </svg>`;
}
