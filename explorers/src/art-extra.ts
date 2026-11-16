/* art-extra.ts — Playful Worlds illustrations, drawn in the same style as js/art.js:
 * 64×64 viewBox, soft fills, one plum outline weight, round joins, faint ground
 * shadow. Registered into SE_Art so every screen uses one visual language. */
type ArtApi = { register(n: string, f: () => string): void; raw(n: string): string; has(n: string): boolean; INK: string };

export function registerExtraArt(Art: ArtApi): void {
  const INK = Art.INK;
  const O = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
  const T = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  const SH = `<ellipse cx="32" cy="58" rx="17" ry="2.6" fill="${INK}" opacity=".1"/>`;
  const HI = (x: number, y: number, rx: number, ry: number) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45" transform="rotate(-25 ${x} ${y})"/>`;
  const small = (name: string, s: number, x: number, y: number) => `<g transform="translate(${x} ${y}) scale(${s})">${Art.raw(name)}</g>`;
  const egg = (cx: number, cy: number, r: number, fill: string, spots = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.8}" ry="${r}" fill="${fill}" ${O}/>${spots}` + HI(cx - r * 0.3, cy - r * 0.35, r * 0.15, r * 0.3);
  const add = (n: string, f: () => string) => { if (!Art.has(n)) Art.register(n, f); };

  // ---------------------------------------------------------------- life-cycle stages
  add("duck-egg", () => SH + `<path d="M10 52c8-6 36-6 44 0" fill="#C9A66B" ${O}/>` + egg(32, 34, 17, "#EEF3E2"));
  add("duckling", () => SH + small("duck", 0.72, 8, 14) + `<path d="M22 22c2-3 6-3 8-1" fill="none" ${T}/>`);
  add("hopper-eggs", () => SH + `<path d="M6 54c10-8 42-8 52 0z" fill="#B88A5A" ${O}/>` + [[22, 44], [30, 41], [38, 44], [26, 50], [34, 50]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="5" fill="#F3E3B0" ${T} transform="rotate(${(x - 30) * 2} ${x} ${y})"/>`).join(""));
  add("nymph", () => SH + `<path d="M16 42c4-6 14-9 24-7 4 1 7 3 8 6-6 3-21 4-32 1z" fill="#A6D77A" ${O}/><path d="M32 37l7-9 4 16" fill="none" stroke="#7BC062" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="44" cy="37" r="1.8" fill="${INK}"/><path d="M45 34c4-6 8-8 12-8M44 34c2-6 4-9 7-11" fill="none" ${T}/><path d="M20 43l-3 7M27 44l-1 7" ${T}/>`);
  add("turtle-egg", () => SH + `<path d="M6 54c8-10 44-10 52 0z" fill="#EBCB8B" ${O}/>` + egg(32, 38, 12, "#FBF8EE"));
  add("hatchling", () => SH + `<path d="M6 54c8-6 44-6 52 0z" fill="#EBCB8B" ${O}/><path d="M8 50c2-6 8-8 14-6" fill="#FBF8EE" ${O}/>` + small("turtle", 0.62, 18, 16));
  add("snail-eggs", () => SH + `<path d="M6 54c10-10 42-10 52 0z" fill="#8A6A4A" ${O}/>` + [[24, 46], [31, 44], [38, 46], [27, 51], [35, 51], [31, 49]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#F4F0E6" ${T}/>`).join(""));
  add("baby-snail", () => SH + `<path d="M8 50c6-2 12-2 18-2h14" fill="none" stroke="#A6D77A" stroke-width="3" stroke-linecap="round"/>` + small("snail", 0.55, 14, 24));

  add("nestling", () => SH + `<path d="M8 40c0 10 10 16 24 16s24-6 24-16z" fill="#C49060" ${O}/><path d="M10 44c10 4 34 4 44 0" fill="none" stroke="#8A5A2E" stroke-width="2"/>` + small("robin", 0.55, 15, 8));
  add("fish-eggs", () => `<rect x="4" y="14" width="56" height="42" rx="12" fill="#BFE3F5" ${T}/>` + [[20, 30], [28, 26], [36, 32], [24, 38], [32, 40], [40, 26], [44, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#F7C08A" ${T}/><circle cx="${x + 1}" cy="${y - 1}" r="1.2" fill="${INK}"/>`).join(""));
  add("fry", () => `<rect x="4" y="14" width="56" height="42" rx="12" fill="#BFE3F5" ${T}/>` + small("fish", 0.42, 6, 14) + small("fish", 0.36, 30, 28));
  add("penguin-egg", () => SH + `<path d="M6 54c10-6 42-6 52 0z" fill="#EAF6FB" ${O}/>` + egg(32, 38, 13, "#F7F4EC"));
  add("penguin-chick", () => SH + `<ellipse cx="32" cy="38" rx="15" ry="17" fill="#A9A2B6" ${O}/><ellipse cx="32" cy="42" rx="9" ry="11" fill="#E9E6EF"/><circle cx="32" cy="22" r="10" fill="#A9A2B6" ${O}/><ellipse cx="32" cy="24" rx="6" ry="5" fill="#fff"/><circle cx="29" cy="22" r="1.6" fill="${INK}"/><circle cx="35" cy="22" r="1.6" fill="${INK}"/><path d="M30 26l2 3 2-3z" fill="#E9873A"/><path d="M24 55h6M34 55h6" stroke="#E9873A" stroke-width="3" stroke-linecap="round"/>`);

  // ---------------------------------------------------------------- routine steps
  add("plate", () => SH + `<ellipse cx="32" cy="40" rx="24" ry="12" fill="#F4F0E6" ${O}/><ellipse cx="32" cy="38" rx="15" ry="7" fill="#fff" ${T}/><path d="M24 37c2-2 5-2 6 0M34 39c2-1 4-1 5 1" fill="none" stroke="#C4651A" stroke-width="2.4" stroke-linecap="round"/><path d="M50 18l-12 16" stroke="#9AA3B5" stroke-width="4" stroke-linecap="round"/><path d="M50 18l-12 16" fill="none" ${T}/>`);
  add("blender", () => SH + `<path d="M20 14h24l-4 26H24z" fill="#DDEFF7" ${O}/><path d="M23 26h18l-2 13H25z" fill="#E0504E" opacity=".8"/><circle cx="29" cy="30" r="2" fill="#F4CF4E"/><circle cx="35" cy="33" r="2" fill="#A9CF5B"/><rect x="18" y="40" width="28" height="14" rx="4" fill="#7B4FD6" ${O}/><circle cx="32" cy="47" r="3" fill="#fff" ${T}/><rect x="22" y="9" width="20" height="6" rx="2" fill="#9AA3B5" ${O}/>`);
  add("cup-tipped", () => SH + `<path d="M8 44c10 4 30 6 48 4" fill="#BFE3F5" opacity=".8"/><path d="M8 48c12 6 34 8 50 4" fill="none" stroke="#7FB8D6" stroke-width="2.4" stroke-linecap="round"/><g transform="rotate(-70 30 34)"><path d="M18 22h28l-4 28H22z" fill="#7FC7A6" ${O}/><path d="M20 30h24" stroke="#fff" stroke-width="2"/></g>`);
  add("sponge", () => SH + `<path d="M8 50c12 2 36 2 48 0" fill="none" stroke="#7FB8D6" stroke-width="3" stroke-linecap="round" opacity=".7"/><rect x="14" y="26" width="36" height="20" rx="6" fill="#F4CF4E" ${O}/><rect x="14" y="26" width="36" height="7" rx="3" fill="#5DB46E" ${O}/>` + [[22, 39], [30, 42], [40, 38], [44, 43]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#D9A92B"/>`).join(""));
  add("giftbox", () => SH + `<path d="M14 28h36v26H14z" fill="#F7E4C4" ${O}/><path d="M12 22h40v8H12z" fill="#EAD2A8" ${O}/>` + small("ball", 0.42, 19, 2) + `<path d="M20 34h24" stroke="#D9B98F" stroke-width="2"/>`);
  add("tag", () => SH + `<path d="M14 22h26l12 12-12 12H14z" fill="#F2A3C4" ${O}/><circle cx="40" cy="34" r="3" fill="#fff" ${T}/><path d="M20 30h12M20 38h8" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M43 34c6-6 10-12 12-20" fill="none" stroke="#C9416A" stroke-width="2.4" stroke-linecap="round"/>`);
  add("envelope", () => SH + `<rect x="8" y="18" width="48" height="34" rx="4" fill="#F4F0E6" ${O}/><path d="M8 20l24 18 24-18" fill="none" ${O}/><rect x="42" y="23" width="9" height="10" rx="1" fill="#E0504E" ${T}/><path d="M14 44h14" stroke="#9AA3B5" stroke-width="2.4" stroke-linecap="round"/>`);
  add("mailbox", () => SH + `<path d="M30 56V36h4v20" fill="#8A5A2E" ${O}/><path d="M14 36V24c0-7 5-11 11-11h14c7 0 11 4 11 11v12z" fill="#3E86C9" ${O}/><path d="M22 22h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M50 18v-8h8v5h-8" fill="#E0504E" ${T}/>`);
  add("bowl", () => SH + `<path d="M8 30h48c0 14-10 24-24 24S8 44 8 30z" fill="#7FC7A6" ${O}/><ellipse cx="32" cy="30" rx="24" ry="5" fill="#F7E4C4" ${O}/><path d="M38 30L52 8" stroke="#C49060" stroke-width="5" stroke-linecap="round"/><path d="M38 30L52 8" fill="none" ${T}/>` + HI(16, 38, 2, 5));
  add("oven", () => SH + `<rect x="10" y="10" width="44" height="44" rx="6" fill="#E9EDF5" ${O}/><rect x="16" y="24" width="32" height="24" rx="4" fill="#4A4060" ${O}/><path d="M20 40h24" stroke="#F2993A" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="17" r="2.5" fill="${INK}"/><circle cx="28" cy="17" r="2.5" fill="${INK}"/><rect x="36" y="15" width="12" height="4" rx="2" fill="#9AA3B5"/>`);

  // ---------------------------------------------------------------- sound sources
  add("sheep", () => SH + [[18, 30], [26, 24], [36, 24], [44, 30], [40, 38], [24, 38], [32, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#F7F4EC" ${O}/>`).join("") +
    `<path d="M22 44v10M42 44v10" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><ellipse cx="48" cy="26" rx="8" ry="10" fill="#5B5368" ${O}/><circle cx="51" cy="24" r="1.8" fill="#fff"/><path d="M42 20c-4-2-6 0-6 3" fill="#5B5368" ${T}/>`);
  add("storm", () => `<path d="M14 34c-6 0-9-5-7-10 2-4 6-5 9-4 1-7 8-11 15-9 4-5 13-5 17 1 7-1 12 4 11 10 4 2 5 9-1 12z" fill="#8E8AA6" ${O}/><path d="M32 34l-6 12h7l-4 12 13-17h-8l5-7z" fill="#F4CF4E" ${O}/><path d="M16 42l-3 6M48 42l-3 6" stroke="#6FA8DC" stroke-width="3" stroke-linecap="round"/>`);

  // ---------------------------------------------------------------- footprints (Animal Detectives)
  const trail = (one: (x: number, y: number, r: number) => string, pts: number[][]) => `<rect x="2" y="6" width="60" height="52" rx="10" fill="#F1E3C6" ${T}/>` + pts.map(([x, y, r]) => one(x, y, r || 0)).join("");
  const duckFoot = (x: number, y: number, r: number) => `<path transform="rotate(${r} ${x} ${y})" d="M${x} ${y + 6}l-6-9 3 1 3-5 3 5 3-1z" fill="#8A6A4A" ${T}/>`;
  const birdFoot = (x: number, y: number, r: number) => `<path transform="rotate(${r} ${x} ${y})" d="M${x} ${y + 6}v-10M${x} ${y}l-5-5M${x} ${y}l5-5M${x} ${y + 6}l0 3" fill="none" stroke="#8A6A4A" stroke-width="2.4" stroke-linecap="round"/>`;
  const paw = (x: number, y: number, r: number) => `<g transform="rotate(${r} ${x} ${y})" fill="#8A6A4A"><ellipse cx="${x}" cy="${y + 3}" rx="4" ry="3.4"/><circle cx="${x - 4}" cy="${y - 2}" r="1.7"/><circle cx="${x - 1.4}" cy="${y - 4}" r="1.7"/><circle cx="${x + 1.4}" cy="${y - 4}" r="1.7"/><circle cx="${x + 4}" cy="${y - 2}" r="1.7"/></g>`;
  const hoof = (x: number, y: number, r: number) => `<g transform="rotate(${r} ${x} ${y})" fill="#8A6A4A"><path d="M${x - 1} ${y - 5}c-4 1-4 9-1 10z"/><path d="M${x + 1} ${y - 5}c4 1 4 9 1 10z"/></g>`;
  const hop = (x: number, y: number) => `<g fill="#8A6A4A"><ellipse cx="${x - 5}" cy="${y - 4}" rx="2.4" ry="5"/><ellipse cx="${x + 5}" cy="${y - 4}" rx="2.4" ry="5"/><circle cx="${x - 2}" cy="${y + 6}" r="2.2"/><circle cx="${x + 2}" cy="${y + 9}" r="2.2"/></g>`;
  add("tracks-duck", () => trail(duckFoot, [[20, 46, -10], [36, 36, 10], [24, 22, -10], [42, 14, 10]]));
  add("tracks-bird", () => trail(birdFoot, [[18, 48], [26, 48], [30, 30], [38, 30], [42, 14], [50, 14]]));
  add("tracks-fox", () => trail(paw, [[22, 48, 0], [36, 38, 0], [24, 26, 0], [38, 14, 0]]));
  add("tracks-deer", () => trail(hoof, [[22, 46, -8], [38, 36, 8], [24, 22, -8], [40, 12, 8]]));
  add("tracks-rabbit", () => trail((x, y) => hop(x, y), [[22, 44], [42, 22]]));

  // ---------------------------------------------------------------- scene props
  add("bush", () => SH + `<circle cx="20" cy="38" r="13" fill="#4FA764" ${O}/><circle cx="44" cy="38" r="13" fill="#4FA764" ${O}/><circle cx="32" cy="28" r="15" fill="#5DB46E" ${O}/><path d="M8 54h48c0-6-4-9-8-9H16c-4 0-8 3-8 9z" fill="#47A960" ${O}/>` + HI(26, 22, 3, 5) + `<circle cx="22" cy="34" r="2" fill="#E0504E"/><circle cx="42" cy="30" r="2" fill="#E0504E"/>`);
  add("log", () => SH + `<rect x="6" y="30" width="46" height="20" rx="10" fill="#A87444" ${O}/><ellipse cx="52" cy="40" rx="7" ry="10" fill="#E2B886" ${O}/><ellipse cx="52" cy="40" rx="3" ry="5" fill="none" stroke="#A87444" stroke-width="2"/><path d="M14 36h20M18 44h22" stroke="#7E5432" stroke-width="2" stroke-linecap="round"/><path d="M18 30c0-6 4-8 8-6" fill="none" stroke="#5DB46E" stroke-width="3" stroke-linecap="round"/>`);
  add("leafpile", () => SH + [[14, 46, "#E9873A", -20], [26, 40, "#D2456B", 10], [38, 44, "#F4CF4E", -30], [50, 46, "#E9873A", 25], [22, 50, "#F4CF4E", 40], [34, 52, "#D2456B", -10], [44, 52, "#E9873A", 15], [30, 34, "#E9873A", -5]].map(([x, y, c, r]) => `<path transform="rotate(${r} ${x} ${y})" d="M${x as number - 9} ${y}c4-8 14-8 18 0-4 8-14 8-18 0z" fill="${c}" ${T}/>`).join(""));
  add("reeds", () => SH + [[18, 14], [26, 8], [34, 12], [42, 6], [50, 16]].map(([x, t]) => `<path d="M${x} 56V${t + 10}" stroke="#4E9E5C" stroke-width="3" stroke-linecap="round"/><rect x="${x - 2.5}" y="${t}" width="5" height="12" rx="2.5" fill="#8A5A2E" ${T}/>`).join("") + `<path d="M10 56c8-14 10-24 8-32M54 56c-6-10-8-18-4-28" fill="none" stroke="#5DB46E" stroke-width="3" stroke-linecap="round"/>`);
  add("tallgrass", () => [[8, 18], [14, 8], [20, 14], [26, 4], [32, 12], [38, 6], [44, 14], [50, 8], [56, 18]].map(([x, t]) => `<path d="M${x - 4} 58C${x - 2} 40 ${x} 28 ${x + 1} ${t}C${x + 2} 28 ${x + 3} 40 ${x + 4} 58z" fill="${x % 12 ? "#5DB46E" : "#7BC062"}" ${T}/>`).join(""));

  // ---------------------------------------------------------------- Little Market (play coins: dots, not real money)
  const coin = (n: number, fill: string, edge: string) => () => SH + `<circle cx="32" cy="32" r="22" fill="${fill}" ${O}/><circle cx="32" cy="32" r="16" fill="none" stroke="${edge}" stroke-width="2.4"/>` +
    `<text x="32" y="40.5" text-anchor="middle" font-size="22" font-weight="700" font-family="Fredoka, system-ui, sans-serif" fill="${INK}">${n}</text>` + HI(22, 22, 3, 6);
  add("coin-1", coin(1, "#F0C66A", "#C99A35"));
  add("coin-2", coin(2, "#E7C9E8", "#B48BC0"));
  add("coin-5", coin(5, "#BFE3D0", "#6FB08F"));
  add("milk", () => SH + `<path d="M20 20l4-8h16l4 8v34H20z" fill="#F7F4EC" ${O}/><path d="M20 30h24v14H20z" fill="#7FB8D6" ${T}/><path d="M24 12h16" ${T}/><circle cx="32" cy="37" r="3" fill="#fff"/>`);
  add("eggs-box", () => SH + `<path d="M8 34h48l-4 18H12z" fill="#D9B98F" ${O}/>` + [16, 26, 38, 48].map(x => `<ellipse cx="${x}" cy="30" rx="5" ry="6.5" fill="#FBF8EE" ${T}/>`).join("") + `<path d="M12 42h40" stroke="#B88A5A" stroke-width="2"/>`);

  // ---------------------------------------------------------------- Build a Habitat pieces
  add("pond", () => `<ellipse cx="32" cy="40" rx="27" ry="15" fill="#6FB7DD" ${O}/><path d="M16 38c4-2 8-2 12 0M34 44c4-2 8-2 12 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/><ellipse cx="44" cy="34" rx="6" ry="3" fill="#5DB46E" ${T}/>`);
  add("stream", () => `<path d="M2 30c12-8 20 10 32 2s20-10 28-4v14c-8-6-16-4-28 4S14 38 2 46z" fill="#6FB7DD" ${O}/><path d="M12 38c4-2 6-1 10 1M38 34c4-2 7-2 10 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`);
  add("puddle", () => `<ellipse cx="32" cy="46" rx="20" ry="7" fill="#9FD1EA" ${O}/><path d="M24 45c3-1 6-1 9 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`);
  add("icewater", () => `<rect x="4" y="32" width="56" height="24" rx="8" fill="#6FA8DC" ${O}/><path d="M8 32l8-10h14l6 10z" fill="#EAF6FB" ${O}/><path d="M38 32l6-6h10l4 6z" fill="#EAF6FB" ${O}/>`);
  add("burrow", () => SH + `<path d="M4 54c4-22 18-32 28-32s24 10 28 32z" fill="#A87444" ${O}/><path d="M18 54c0-10 6-16 14-16s14 6 14 16z" fill="#4A3424" ${O}/><path d="M10 30c4-4 8-4 12-2M46 28c4-2 8-1 10 2" fill="none" stroke="#5DB46E" stroke-width="3" stroke-linecap="round"/>`);
  add("nest", () => SH + `<path d="M8 36c0 12 10 18 24 18s24-6 24-18z" fill="#C49060" ${O}/><path d="M10 40c10 4 34 4 44 0M12 46c10 3 30 3 40 0" fill="none" stroke="#8A5A2E" stroke-width="2"/>` + egg(26, 33, 6, "#BFE3F5") + egg(38, 33, 6, "#BFE3F5"));
  add("cave", () => SH + `<path d="M2 56c0-30 14-44 30-44s30 14 30 44z" fill="#A9A2B6" ${O}/><path d="M16 56c0-16 7-26 16-26s16 10 16 26z" fill="#4A4060" ${O}/><path d="M14 24c4-3 9-4 14-2" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`);
  add("hollowtree", () => SH + `<path d="M20 58V24h24v34" fill="#8A5A2E" ${O}/><ellipse cx="32" cy="38" rx="6" ry="8" fill="#4A3424" ${T}/><circle cx="32" cy="16" r="15" fill="#47A960" ${O}/><circle cx="18" cy="22" r="9" fill="#3F9B57" ${O}/><circle cx="46" cy="22" r="9" fill="#3F9B57" ${O}/>`);
  add("hive", () => SH + `<path d="M32 10c10 0 16 6 16 12 3 2 4 6 2 9 3 3 3 8 0 11-2 6-8 10-18 10s-16-4-18-10c-3-3-3-8 0-11-2-3-1-7 2-9 0-6 6-12 16-12z" fill="#F4CF4E" ${O}/><path d="M17 22h30M15 31h34M15 42h34" stroke="#D9A92B" stroke-width="2"/><ellipse cx="32" cy="46" rx="4" ry="3" fill="#4A3424"/>`);
  add("snowden", () => SH + `<path d="M2 56c2-24 14-36 30-36s28 12 30 36z" fill="#EAF6FB" ${O}/><path d="M20 56c0-12 6-18 12-18s12 6 12 18z" fill="#6E7FA0" ${O}/><path d="M12 34c4-4 10-6 16-6" fill="none" stroke="#BFE3F5" stroke-width="3" stroke-linecap="round"/>`);
  add("cactus", () => SH + `<path d="M26 56V16c0-6 12-6 12 0v40z" fill="#5DB46E" ${O}/><path d="M26 36H18c-4 0-6-3-6-6v-8c0-4 6-4 6 0v6h8M38 30h6v-8c0-4 6-4 6 0v10c0 3-2 6-6 6h-6" fill="#5DB46E" ${O}/><path d="M32 18v34" stroke="#3F9B57" stroke-width="2"/><circle cx="32" cy="12" r="3" fill="#F2A3C4" ${T}/>`);
  add("lilypad", () => `<ellipse cx="32" cy="44" rx="22" ry="9" fill="#5DB46E" ${O}/><path d="M32 44l14-6" stroke="#3F9B57" stroke-width="2.4"/><circle cx="26" cy="38" r="5" fill="#F7BBD3" ${T}/><circle cx="26" cy="38" r="2" fill="#F4CF4E"/>`);
  add("shrub-berries", () => Art.raw("bush"));
  add("acorns", () => SH + [[22, 42], [36, 46], [44, 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 3}" rx="6" ry="7" fill="#C4864A" ${O}/><path d="M${x - 7} ${y - 1}c2-5 12-5 14 0z" fill="#7E5432" ${O}/>`).join(""));
  add("flowers", () => SH + [[18, 30, "#F2A3C4"], [32, 22, "#F4CF4E"], [46, 30, "#B49CF0"]].map(([x, y, c]) => `<path d="M${x} 56V${y}" stroke="#4E9E5C" stroke-width="3"/>` + [0, 72, 144, 216, 288].map(a => `<circle cx="${(x as number) + 6 * Math.cos(a * Math.PI / 180)}" cy="${(y as number) + 6 * Math.sin(a * Math.PI / 180)}" r="4.5" fill="${c}" ${T}/>`).join("") + `<circle cx="${x}" cy="${y}" r="3.4" fill="#E9873A"/>`).join(""));
  add("seaweed", () => [[20, 0], [32, 6], [44, 2]].map(([x, d]) => `<path d="M${x} 58c-6-8 6-14 0-22s6-14 0-22" fill="none" stroke="#3F9B57" stroke-width="6" stroke-linecap="round" transform="translate(0 ${d})"/>`).join(""));
  add("sand", () => `<path d="M2 50c10-8 22-8 30-2s20 6 30-2v14H2z" fill="#EBCB8B" ${O}/><circle cx="18" cy="52" r="1.4" fill="#C99A35"/><circle cx="40" cy="54" r="1.4" fill="#C99A35"/>`);
  add("palm", () => SH + `<path d="M30 58c2-14 4-26 2-38h4c2 12 0 24-2 38z" fill="#A87444" ${O}/>` + [[-50, "#47A960"], [-10, "#5DB46E"], [30, "#47A960"], [-90, "#5DB46E"], [70, "#5DB46E"]].map(([a, c]) => `<path transform="rotate(${a} 34 20)" d="M34 20c6-6 18-6 24 2-8-2-16-1-24-2z" fill="${c}" ${T}/>`).join(""));
}
