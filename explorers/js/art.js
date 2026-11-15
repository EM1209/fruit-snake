/* art.js — Snake Explorers illustration kit.
 * One consistent style: soft fills, a single plum outline weight, round joins,
 * a faint ground shadow. 64×64 viewBox for items. No platform emoji as artwork.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SE_Art = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const INK = "#3A2E4D";
  const O = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
  const T = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`; // thin
  const SH = `<ellipse cx="32" cy="58" rx="17" ry="2.6" fill="${INK}" opacity=".1"/>`;
  const HI = (x, y, rx, ry, r) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45" transform="rotate(${r || -25} ${x} ${y})"/>`;
  const leaf = (d, f) => `<path d="${d}" fill="${f || "#5DB46E"}" ${O}/>`;

  const A = {
    // ---------------- foods ----------------
    apple: () => SH + `<path d="M32 21c-5-4-17-3-17 10 0 12 8 25 17 23 9 2 17-11 17-23 0-13-12-14-17-10z" fill="#E0504E" ${O}/>` +
      `<path d="M32 21c0-4 1-7 4-10" fill="none" ${O}/>` + leaf("M35 15c4-5 10-4 12-1-4 4-9 4-12 1z") + HI(23, 29, 3, 6),
    banana: () => SH + `<path d="M13 19c3 21 21 33 39 22 2-2 1-5-2-4-14 4-28-5-31-19-1-4-6-3-6 1z" fill="#F4CF4E" ${O}/>` +
      `<path d="M13 19l-1-4 4-1 2 4" fill="#8A6A3A" ${O}/>` + `<path d="M22 31c6 7 14 10 22 9" fill="none" stroke="#D9A92B" stroke-width="2" stroke-linecap="round"/>`,
    grapes: () => SH + `<path d="M32 14c1-3 3-5 6-6" fill="none" ${O}/>` + leaf("M33 13c-4-5-11-4-13 0 5 3 10 3 13 0z") +
      [[25, 22], [39, 22], [32, 28], [20, 32], [44, 32], [26, 38], [38, 38], [32, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#8B5CC9" ${O}/>`).join("") + HI(24, 21, 1.5, 2.5),
    strawberry: () => SH + `<path d="M32 55c-11-6-18-17-16-27 2-6 10-8 16-5 6-3 14-1 16 5 2 10-5 21-16 27z" fill="#E0504E" ${O}/>` +
      [[24, 32], [32, 30], [40, 32], [27, 40], [37, 40], [32, 47], [22, 25], [42, 25]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.3" ry="2" fill="#F8E39A"/>`).join("") +
      `<path d="M22 22l6-2 4-6 4 6 6 2-6 3-4-2-4 2z" fill="#5DB46E" ${O}/>`,
    orange: () => SH + `<circle cx="32" cy="35" r="18" fill="#F2993A" ${O}/>` + leaf("M33 17c3-6 10-6 12-3-4 4-9 5-12 3z") + `<circle cx="32" cy="18" r="1.6" fill="${INK}"/>` +
      [[26, 30], [36, 28], [40, 38], [28, 42], [34, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#C76F18"/>`).join("") + HI(24, 28, 3, 6),
    pear: () => SH + `<path d="M32 15c-5 0-7 4-7 10 0 5-10 9-10 19 0 8 7 12 17 12s17-4 17-12c0-10-10-14-10-19 0-6-2-10-7-10z" fill="#A9CF5B" ${O}/>` +
      `<path d="M32 15c0-3 1-6 3-8" fill="none" ${O}/>` + leaf("M34 11c3-4 9-4 11-1-4 3-8 4-11 1z") + HI(24, 40, 3, 6),
    carrot: () => SH + `<path d="M40 19c5 2 7 7 4 11L25 55c-2 2-5 1-4-2l11-29c2-5 5-7 8-5z" fill="#F08A2C" ${O}/>` +
      `<path d="M30 33l5 2M27 42l4 2M34 26l4 2" fill="none" stroke="#C4651A" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M41 19c-2-6 0-11 4-13M43 21c3-6 8-8 13-7M42 20c-5-3-7-8-5-13" fill="none" stroke="#4E9E5C" stroke-width="3.2" stroke-linecap="round"/>`,
    broccoli: () => SH + `<path d="M27 36h10l3 19h-16z" fill="#A6D77A" ${O}/>` +
      `<circle cx="22" cy="30" r="10" fill="#3F9B57" ${O}/><circle cx="42" cy="30" r="10" fill="#3F9B57" ${O}/><circle cx="32" cy="22" r="11" fill="#47A960" ${O}/><circle cx="32" cy="33" r="8" fill="#3F9B57" ${O}/>` + HI(28, 18, 2, 4),
    corn: () => SH + `<path d="M32 9c7 0 10 10 10 22s-3 22-10 22-10-10-10-22S25 9 32 9z" fill="#F4CF4E" ${O}/>` +
      `<path d="M27 16v32M32 11v42M37 16v32M23 22h18M22 30h20M22 38h20M24 46h16" stroke="#D9A92B" stroke-width="1.6" fill="none"/>` +
      `<path d="M32 55c-8-2-14-12-14-24 4 6 8 10 14 12zM32 55c8-2 14-12 14-24-4 6-8 10-14 12z" fill="#7BC062" ${O}/>`,
    tomato: () => SH + `<ellipse cx="32" cy="36" rx="19" ry="17" fill="#E0504E" ${O}/>` +
      `<path d="M23 21l6 1 3-6 3 6 6-1-4 5-5-1-5 1z" fill="#5DB46E" ${O}/>` + HI(23, 31, 3, 6),
    peas: () => SH + `<path d="M9 40c8-15 37-19 46-8-8 13-37 17-46 8z" fill="#7BC062" ${O}/>` +
      `<circle cx="21" cy="36" r="5" fill="#A8DD7F" ${T}/><circle cx="32" cy="33" r="5" fill="#A8DD7F" ${T}/><circle cx="43" cy="31" r="5" fill="#A8DD7F" ${T}/>` +
      `<path d="M55 32c2-2 4-3 6-3" fill="none" ${O}/>`,
    lemon: () => SH + `<path d="M11 35c0-11 10-19 21-19s21 8 21 19-10 17-21 17-21-6-21-17z" fill="#F6DB55" ${O}/>` +
      `<path d="M11 35l-4-1M53 35l4-1" ${O}/>` + HI(22, 29, 3, 6),
    berry: () => `<ellipse cx="32" cy="57" rx="13" ry="2.4" fill="${INK}" opacity=".1"/><circle cx="32" cy="35" r="15" fill="#C9416A" ${O}/>` +
      `<path d="M28 21c1-4 3-6 6-7M31 21l-5-3M33 21l6-2" fill="none" stroke="#4E9E5C" stroke-width="3" stroke-linecap="round"/>` + HI(26, 30, 3, 5),
    basket: () => SH + `<path d="M17 27c0-11 30-11 30 0" fill="none" stroke="#9A6534" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M10 28h44l-6 26H16z" fill="#D69A5A" ${O}/><path d="M13 36h38M15 45h34M22 28l2 26M32 28v26M42 28l-2 26" stroke="#A86F37" stroke-width="2" fill="none"/>`,
    // ---------------- animals ----------------
    fish: () => SH + `<path d="M12 32c6-11 22-14 32-4l9-7v22l-9-7c-10 10-26 7-32-4z" fill="#4FA3D9" ${O}/>` +
      `<path d="M26 22c4-4 9-4 12 0" fill="#7EC2EA" ${O}/><circle cx="21" cy="30" r="2.6" fill="${INK}"/><path d="M30 28c2 3 2 6 0 9" fill="none" ${T}/>`,
    frog: () => SH + `<ellipse cx="32" cy="40" rx="20" ry="14" fill="#62BB67" ${O}/>` +
      `<circle cx="22" cy="24" r="7" fill="#62BB67" ${O}/><circle cx="42" cy="24" r="7" fill="#62BB67" ${O}/><circle cx="22" cy="24" r="3.6" fill="#fff"/><circle cx="42" cy="24" r="3.6" fill="#fff"/>` +
      `<circle cx="23" cy="24.5" r="1.9" fill="${INK}"/><circle cx="43" cy="24.5" r="1.9" fill="${INK}"/><path d="M23 40c5 4 13 4 18 0" fill="none" ${O}/>` +
      `<circle cx="18" cy="38" r="2.2" fill="#F19BB0" opacity=".6"/><circle cx="46" cy="38" r="2.2" fill="#F19BB0" opacity=".6"/>`,
    duck: () => SH + `<path d="M12 38c0-7 6-10 13-9 6 1 10-1 12-5h14c2 13-6 26-21 26-11 0-18-5-18-12z" fill="#F6D84E" ${O}/>` +
      `<circle cx="40" cy="21" r="10" fill="#F6D84E" ${O}/><path d="M49 21l9 2-8 4z" fill="#F08A2C" ${O}/><circle cx="42" cy="18" r="2" fill="${INK}"/><path d="M22 38c5 3 11 3 15-1" fill="none" ${O}/>`,
    camel: () => SH + `<path d="M10 40c0-10 6-16 12-16 3 0 5 3 7 3s3-6 8-6c6 0 8 8 8 13h4c0-8 2-14 6-14 3 0 5 2 5 5h-3c-1 7-3 14-9 15H18c-5 0-8 1-8 0z" fill="#D9A55B" ${O}/>` +
      `<path d="M16 42v13M24 42v13M38 42v13M45 42v13" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M16 42v13M24 42v13M38 42v13M45 42v13" stroke="#D9A55B" stroke-width="1.8" stroke-linecap="round"/><circle cx="55" cy="25" r="1.6" fill="${INK}"/>`,
    polarbear: () => SH + `<ellipse cx="32" cy="38" rx="20" ry="16" fill="#F7F5EE" ${O}/><circle cx="18" cy="23" r="5" fill="#F7F5EE" ${O}/><circle cx="46" cy="23" r="5" fill="#F7F5EE" ${O}/>` +
      `<ellipse cx="32" cy="41" rx="8" ry="6" fill="#EDE9DD" ${T}/><ellipse cx="32" cy="38" rx="3" ry="2.2" fill="${INK}"/><circle cx="25" cy="31" r="2" fill="${INK}"/><circle cx="39" cy="31" r="2" fill="${INK}"/><path d="M29 44c2 2 4 2 6 0" fill="none" ${T}/>`,
    penguin: () => SH + `<path d="M32 9c11 0 15 12 15 25 0 13-6 21-15 21s-15-8-15-21C17 21 21 9 32 9z" fill="#3B4060" ${O}/>` +
      `<path d="M32 19c7 0 9 8 9 17 0 9-4 15-9 15s-9-6-9-15c0-9 2-17 9-17z" fill="#FAF7F0"/><circle cx="27" cy="20" r="2" fill="#fff"/><circle cx="37" cy="20" r="2" fill="#fff"/>` +
      `<path d="M29 25l3 4 3-4z" fill="#F2A63A" ${T}/><path d="M24 56h7M33 56h7" stroke="#F2A63A" stroke-width="3.5" stroke-linecap="round"/>`,
    owl: () => SH + `<path d="M14 18l6 6c3-2 7-3 12-3s9 1 12 3l6-6v24c0 9-8 15-18 15s-18-6-18-15z" fill="#9C6B45" ${O}/>` +
      `<path d="M22 41c3 6 7 9 10 9s7-3 10-9" fill="#C8A07A"/><circle cx="24" cy="31" r="7" fill="#FFF8E7" ${O}/><circle cx="40" cy="31" r="7" fill="#FFF8E7" ${O}/>` +
      `<circle cx="24" cy="31" r="3.3" fill="${INK}"/><circle cx="40" cy="31" r="3.3" fill="${INK}"/><path d="M30 37l2 4 2-4z" fill="#F2A63A" ${T}/>`,
    squirrel: () => SH + `<path d="M40 54c13 0 18-12 15-24-3-10-12-14-17-8 6 1 9 6 9 12 0 6-4 10-9 10" fill="#D98C4A" ${O}/>` +
      `<ellipse cx="28" cy="43" rx="11" ry="12" fill="#C9773A" ${O}/><circle cx="24" cy="25" r="9" fill="#C9773A" ${O}/><path d="M19 18l-1-6 5 4M28 17l2-6 2 6" fill="#C9773A" ${O}/>` +
      `<circle cx="21" cy="24" r="1.8" fill="${INK}"/><ellipse cx="28" cy="46" rx="5" ry="6" fill="#EBC59B"/><circle cx="16.5" cy="27" r="1.4" fill="${INK}"/>`,
    cow: () => SH + `<path d="M17 18c-5-1-8-4-8-7 4 0 7 1 10 3M47 18c5-1 8-4 8-7-4 0-7 1-10 3" fill="#EADBC8" ${O}/>` +
      `<path d="M16 22c0-8 7-12 16-12s16 4 16 12v14c0 4-3 7-7 7H23c-4 0-7-3-7-7z" fill="#FBF8F2" ${O}/>` +
      `<path d="M18 16c4 0 7 3 6 7-3 2-7 1-8-2zM42 26c4-1 6 2 5 5-3 1-6 0-5-5z" fill="${INK}"/>` +
      `<ellipse cx="32" cy="44" rx="13" ry="9" fill="#F3B7C2" ${O}/><circle cx="27" cy="44" r="1.8" fill="${INK}"/><circle cx="37" cy="44" r="1.8" fill="${INK}"/><circle cx="25" cy="29" r="2.2" fill="${INK}"/><circle cx="39" cy="29" r="2.2" fill="${INK}"/>`,
    bee: () => SH + `<ellipse cx="24" cy="22" rx="8" ry="11" fill="#D7EEFA" ${T} transform="rotate(-25 24 22)" opacity=".95"/><ellipse cx="40" cy="22" rx="8" ry="11" fill="#D7EEFA" ${T} transform="rotate(25 40 22)" opacity=".95"/>` +
      `<ellipse cx="32" cy="38" rx="17" ry="13" fill="#F4CF4E" ${O}/><path d="M26 26c-2 8-2 16 0 24M36 26c-2 8-2 16 0 24" stroke="${INK}" stroke-width="5"/>` +
      `<circle cx="44" cy="35" r="1.8" fill="${INK}"/><path d="M15 38l-4 1" ${O}/>`,
    lizard: () => SH + `<path d="M8 44c6 6 16 4 20-2 4-6 8-9 14-9 7 0 12-4 13-8-2-3-7-4-11-2-6-2-13 1-17 7-3 5-8 9-14 9-3 0-5 2-5 5z" fill="#6BBF59" ${O}/>` +
      `<path d="M26 40l-4 9M36 34l2 10M41 31l-3-8M30 37l-5-6" ${O}/><circle cx="49" cy="25" r="1.8" fill="${INK}"/>`,
    rabbit: () => SH + `<path d="M24 22c-4-8-4-17 0-17s6 9 5 17M40 22c4-8 4-17 0-17s-6 9-5 17" fill="#ECE4DA" ${O}/><path d="M25 19c-2-5-2-10 0-10M39 19c2-5 2-10 0-10" fill="none" stroke="#F3B7C2" stroke-width="3" stroke-linecap="round"/>` +
      `<ellipse cx="32" cy="42" rx="15" ry="13" fill="#ECE4DA" ${O}/><circle cx="32" cy="28" r="11" fill="#ECE4DA" ${O}/><circle cx="28" cy="27" r="1.8" fill="${INK}"/><circle cx="36" cy="27" r="1.8" fill="${INK}"/><path d="M30 32l2 2 2-2" fill="#F3B7C2" ${T}/>`,
    butterfly: () => SH + `<path d="M31 30C25 14 9 12 9 22c0 8 10 12 22 10zM33 30c6-16 22-18 22-8 0 8-10 12-22 10z" fill="#E784B8" ${O}/>` +
      `<path d="M31 33c-10 0-17 4-15 11 2 6 11 4 15-8zM33 33c10 0 17 4 15 11-2 6-11 4-15-8z" fill="#F4A65A" ${O}/>` +
      `<path d="M32 22v28" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M32 22c-2-5-5-8-8-9M32 22c2-5 5-8 8-9" fill="none" ${T}/>`,
    crab: () => SH + `<ellipse cx="32" cy="40" rx="17" ry="11" fill="#E5664D" ${O}/><path d="M24 30v-8M40 30v-8" ${O}/><circle cx="24" cy="21" r="3" fill="#fff" ${T}/><circle cx="40" cy="21" r="3" fill="#fff" ${T}/>` +
      `<path d="M15 38c-6-2-8-8-6-13 3 2 6 1 7-1 3 3 2 9-1 14zM49 38c6-2 8-8 6-13-3 2-6 1-7-1-3 3-2 9 1 14z" fill="#E5664D" ${O}/><path d="M18 46l-5 6M24 50l-3 6M46 46l5 6M40 50l3 6" ${O}/><path d="M28 43c2 2 6 2 8 0" fill="none" ${T}/>`,
    // ---------------- life cycles ----------------
    seed: () => `<path d="M6 46h52" stroke="#9A6534" stroke-width="3" stroke-linecap="round"/><path d="M8 48h48v8H8z" fill="#B98552" opacity=".45"/>` +
      `<path d="M32 26c7 0 10 6 9 11-1 6-6 8-9 8s-8-2-9-8c-1-5 2-11 9-11z" fill="#B98552" ${O}/><path d="M32 30c-2 4-2 8 0 11" fill="none" stroke="#8A5A2E" stroke-width="2"/>`,
    sprout: () => `<path d="M8 50h48v8H8z" fill="#B98552" opacity=".45"/><path d="M6 48h52" stroke="#9A6534" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M32 48V32" ${O}/>` + leaf("M32 34c-8 1-13-4-13-10 7-1 13 3 13 10z") + leaf("M32 32c7 0 12-4 12-10-6 0-12 3-12 10z"),
    seedling: () => `<path d="M8 50h48v8H8z" fill="#B98552" opacity=".45"/><path d="M6 48h52" stroke="#9A6534" stroke-width="3" stroke-linecap="round"/><path d="M32 48V16" ${O}/>` +
      leaf("M32 40c-9 1-14-4-14-10 8-1 14 3 14 10z") + leaf("M32 34c8 0 13-4 13-10-7 0-13 3-13 10z") + leaf("M32 24c-7 0-11-4-11-9 6 0 11 3 11 9z") + leaf("M32 19c6-1 10-5 9-10-5 1-9 4-9 10z"),
    flower: () => `<path d="M8 50h48v8H8z" fill="#B98552" opacity=".45"/><path d="M6 48h52" stroke="#9A6534" stroke-width="3" stroke-linecap="round"/><path d="M32 48V24" ${O}/>` +
      leaf("M32 42c-8 1-13-3-13-9 7-1 13 3 13 9z") +
      [0, 72, 144, 216, 288].map(r => `<ellipse cx="32" cy="12" rx="5.5" ry="7" fill="#F2A3C4" ${T} transform="rotate(${r} 32 19)"/>`).join("") + `<circle cx="32" cy="19" r="5" fill="#F4CF4E" ${O}/>`,
    fruit: () => `<path d="M8 50h48v8H8z" fill="#B98552" opacity=".45"/><path d="M6 48h52" stroke="#9A6534" stroke-width="3" stroke-linecap="round"/><path d="M28 48V14" ${O}/>` +
      leaf("M28 30c8 0 12-4 12-9-7 0-12 3-12 9z") + leaf("M28 40c-8 1-12-3-12-8 7-1 12 2 12 8z") +
      `<path d="M28 22c6 0 8 2 10 6" fill="none" ${T}/><circle cx="40" cy="34" r="8" fill="#E0504E" ${O}/><circle cx="20" cy="22" r="6" fill="#E0504E" ${O}/>`,
    egg: () => SH + leaf("M8 44c10-20 38-24 50-10-10 18-38 22-50 10z", "#7BC062") + `<path d="M12 42c14-4 28-8 42-10" fill="none" stroke="#4E9E5C" stroke-width="2"/>` +
      `<ellipse cx="30" cy="35" rx="4.5" ry="5.5" fill="#FBF6E4" ${T}/><ellipse cx="40" cy="33" rx="4.5" ry="5.5" fill="#FBF6E4" ${T}/>`,
    caterpillar: () => SH + [12, 22, 32, 42].map((x, i) => `<circle cx="${x}" cy="${44 - (i % 2) * 4}" r="7" fill="${i % 2 ? "#8ED16F" : "#6BBF59"}" ${O}/>`).join("") +
      `<circle cx="51" cy="36" r="9" fill="#6BBF59" ${O}/><circle cx="54" cy="33" r="2" fill="${INK}"/><path d="M50 27l-3-6M55 27l2-6" ${T}/><path d="M51 40c2 1 4 1 5-1" fill="none" ${T}/>`,
    chrysalis: () => `<path d="M8 10h48" stroke="#9A6534" stroke-width="4" stroke-linecap="round"/><path d="M32 10v6" ${O}/>` +
      `<path d="M32 16c9 4 11 14 9 24-2 9-6 14-9 14s-7-5-9-14c-2-10 0-20 9-24z" fill="#86C276" ${O}/><path d="M26 28c4 2 8 2 12 0M25 38c5 2 9 2 14 0" fill="none" stroke="#5A9B4C" stroke-width="2"/>`,
    frogspawn: () => SH + [[20, 26], [32, 22], [44, 26], [26, 37], [38, 37], [20, 47], [32, 48], [44, 47]].map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="7" fill="#DDEFF5" ${T}/><circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/>`).join(""),
    tadpole: () => SH + `<path d="M30 34c-8 0-18 6-24 2 4 6 14 8 24 6" fill="#5F6B7E" ${O}/><ellipse cx="38" cy="36" rx="13" ry="11" fill="#5F6B7E" ${O}/>` +
      `<circle cx="43" cy="33" r="3" fill="#fff"/><circle cx="44" cy="33" r="1.6" fill="${INK}"/>`,
    froglet: () => SH + `<path d="M14 44c-6 0-8-2-10-4 4 1 7 0 10-2" fill="#62BB67" ${O}/><ellipse cx="32" cy="42" rx="16" ry="11" fill="#62BB67" ${O}/>` +
      `<circle cx="25" cy="30" r="5.5" fill="#62BB67" ${O}/><circle cx="39" cy="30" r="5.5" fill="#62BB67" ${O}/><circle cx="25" cy="30" r="2.6" fill="#fff"/><circle cx="39" cy="30" r="2.6" fill="#fff"/>` +
      `<circle cx="25.6" cy="30.4" r="1.4" fill="${INK}"/><circle cx="39.6" cy="30.4" r="1.4" fill="${INK}"/><path d="M27 43c3 2 7 2 10 0" fill="none" ${T}/><path d="M20 50l-4 5M44 50l4 5" ${O}/>`,
    // ---------------- seasons & weather ----------------
    spring: () => SH + `<path d="M32 56V34" ${O}/>` + leaf("M32 46c-7 1-11-3-11-8 6-1 11 2 11 8z") +
      [0, 72, 144, 216, 288].map(r => `<circle cx="32" cy="14" r="7" fill="#F7BBD3" ${T} transform="rotate(${r} 32 24)"/>`).join("") + `<circle cx="32" cy="24" r="5" fill="#F4CF4E" ${O}/>`,
    summer: () => `<g stroke="#E7A92C" stroke-width="3.5" stroke-linecap="round">` + [0, 45, 90, 135, 180, 225, 270, 315].map(r => `<path d="M32 6v7" transform="rotate(${r} 32 32)"/>`).join("") + `</g>` +
      `<circle cx="32" cy="32" r="14" fill="#F6CF4A" ${O}/><path d="M26 34c3 3 9 3 12 0" fill="none" ${T}/><circle cx="27" cy="29" r="1.5" fill="${INK}"/><circle cx="37" cy="29" r="1.5" fill="${INK}"/>`,
    autumn: () => SH + `<path d="M32 8l5 10 9-4-2 11 10 3-8 7 5 9-11-2-2 11-6-8-6 8-2-11-11 2 5-9-8-7 10-3-2-11 9 4z" fill="#E9873A" ${O}/>` +
      `<path d="M32 52V20M32 34l-8-6M32 30l8-6" fill="none" stroke="#B4561C" stroke-width="2" stroke-linecap="round"/>`,
    winter: () => `<g stroke="#5E9DD1" stroke-width="3.2" stroke-linecap="round" fill="none">` + [0, 60, 120].map(r =>
      `<g transform="rotate(${r} 32 32)"><path d="M32 8v48M32 16l-6-6M32 16l6-6M32 48l-6 6M32 48l6 6"/></g>`).join("") + `</g><circle cx="32" cy="32" r="4" fill="#DDEFF9" ${T}/>`,
    rain: () => `<path d="M18 36c-6 0-9-4-9-8 0-5 4-8 9-8 1-7 7-11 14-11 8 0 13 5 14 11 6 0 9 4 9 8 0 5-4 8-9 8z" fill="#C9D6E6" ${O}/>` +
      [[20, 44], [32, 46], [44, 44], [26, 54], [38, 55]].map(([x, y]) => `<path d="M${x} ${y}c-2 3-2 5 0 6 2-1 2-3 0-6z" fill="#4FA3D9" ${T}/>`).join(""),
    snow: () => `<path d="M18 36c-6 0-9-4-9-8 0-5 4-8 9-8 1-7 7-11 14-11 8 0 13 5 14 11 6 0 9 4 9 8 0 5-4 8-9 8z" fill="#E4ECF5" ${O}/>` +
      [[20, 46], [32, 50], [44, 46], [26, 57], [38, 58]].map(([x, y]) => `<g stroke="#5E9DD1" stroke-width="2" stroke-linecap="round"><path d="M${x - 3} ${y}h6M${x} ${y - 3}v6"/></g>`).join(""),
    windy: () => `<path d="M8 24h30c5 0 8-3 8-7s-3-6-6-6-5 2-5 4M8 36h40c5 0 8 3 8 7s-3 6-6 6-5-2-5-4M8 48h22" fill="none" stroke="#7A8FB0" stroke-width="3.5" stroke-linecap="round"/>` +
      leaf("M44 28c4-4 10-3 11 0-4 4-9 4-11 0z", "#E9873A"),
    // ---------------- habitats (scenes) ----------------
    "hab-pond": () => `<rect x="4" y="8" width="56" height="50" rx="12" fill="#E3F2E6"/><ellipse cx="32" cy="40" rx="24" ry="12" fill="#6FB7E0" ${O}/>` +
      `<path d="M18 40c4-2 8-2 12 0M34 44c4-2 8-2 12 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M12 36V18M16 36V22M48 34V16" stroke="#4E9E5C" stroke-width="3" stroke-linecap="round"/>` +
      `<ellipse cx="12" cy="16" rx="2.4" ry="5" fill="#9A6534"/><ellipse cx="48" cy="14" rx="2.4" ry="5" fill="#9A6534"/>`,
    "hab-forest": () => `<rect x="4" y="8" width="56" height="50" rx="12" fill="#E3F2E6"/><path d="M20 54V40M44 54V36" stroke="#8A5A2E" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M20 14l11 26H9zM44 12l12 28H32z" fill="#3F9B57" ${O}/><path d="M20 22l8 18H12z" fill="#47A960" opacity=".6"/>`,
    "hab-desert": () => `<rect x="4" y="8" width="56" height="50" rx="12" fill="#FBEFD2"/><circle cx="47" cy="20" r="6" fill="#F6CF4A" ${T}/>` +
      `<path d="M4 46c12-8 26-8 38-2 7 3 12 2 18 0v12H4z" fill="#E9C27D" ${O}/><path d="M20 46V24c0-4 6-4 6 0v22M20 34h-4v-6M26 30h4v-5" fill="none" stroke="#4E9E5C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    "hab-ice": () => `<rect x="4" y="8" width="56" height="50" rx="12" fill="#E4EEF9"/><path d="M4 42h56v16H4z" fill="#8FC1E6"/>` +
      `<path d="M8 42l8-14h14l6 14zM34 42l6-9h12l4 9z" fill="#FBFDFF" ${O}/><path d="M16 28l3 6M42 33l2 4" stroke="#BFD9EE" stroke-width="2"/>`,
    "hab-ocean": () => `<rect x="4" y="8" width="56" height="50" rx="12" fill="#E4EEF9"/><path d="M4 30c6-4 10-4 14 0s10 4 14 0 10-4 14 0 10 4 14 0v28H4z" fill="#4F96D2" ${O}/>` +
      `<path d="M10 42c5-3 9-3 13 0M34 48c5-3 9-3 13 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
    "hab-farm": () => `<rect x="4" y="8" width="56" height="50" rx="12" fill="#FBF0DE"/><path d="M4 48h56v10H4z" fill="#9ACD6B"/>` +
      `<path d="M16 48V28l14-10 14 10v20z" fill="#D9534F" ${O}/><path d="M25 48V36h10v12" fill="#F7F1E6" ${O}/><path d="M25 36l10 12M35 36L25 48" stroke="${INK}" stroke-width="1.6"/><path d="M48 48V34h8v14" fill="#F2D29A" ${O}/>`,
    // ---------------- clothes & picnic ----------------
    raincoat: () => SH + `<path d="M22 12h20l10 10-5 6-3-3v31H20V25l-3 3-5-6z" fill="#F4CF4E" ${O}/><path d="M32 14v42" stroke="#D9A92B" stroke-width="2"/><circle cx="36" cy="30" r="1.6" fill="${INK}"/><circle cx="36" cy="40" r="1.6" fill="${INK}"/><path d="M26 12c0 4 3 6 6 6s6-2 6-6" fill="none" ${T}/>`,
    boots: () => SH + `<path d="M12 14h12v28h10c4 0 6 3 6 6v6H12z" fill="#3E86C9" ${O}/><path d="M34 12h10v28h8c3 0 5 3 5 6v6H34z" fill="#4F96D2" ${O}/><path d="M12 20h12M34 18h10" stroke="#fff" stroke-width="2"/>`,
    umbrella: () => SH + `<path d="M8 32C8 18 19 10 32 10s24 8 24 22c-4-3-8-3-12 0-4-3-8-3-12 0-4-3-8-3-12 0-4-3-8-3-12 0z" fill="#C9416A" ${O}/><path d="M32 10v40c0 4-3 6-6 6s-5-2-5-5" fill="none" ${O}/>`,
    sunhat: () => SH + `<ellipse cx="32" cy="40" rx="26" ry="9" fill="#F2D29A" ${O}/><path d="M18 38c0-12 6-20 14-20s14 8 14 20c-8 3-20 3-28 0z" fill="#F7DFA8" ${O}/><path d="M19 33c8 3 18 3 26 0" stroke="#C9416A" stroke-width="4" fill="none"/>`,
    sunglasses: () => `<path d="M8 28h48" ${O}/><path d="M10 28h18c0 9-3 14-9 14s-9-5-9-14zM36 28h18c0 9-3 14-9 14s-9-5-9-14z" fill="#3B4060" ${O}/>` + HI(16, 33, 2, 4) + HI(42, 33, 2, 4),
    shorts: () => SH + `<path d="M14 14h36l4 36H38l-6-20-6 20H10z" fill="#4FB08A" ${O}/><path d="M14 20h36" stroke="#2F8F6B" stroke-width="2"/>`,
    tshirt: () => SH + `<path d="M22 12l-12 8 5 9 6-3v28h22V26l6 3 5-9-12-8c-2 4-6 6-10 6s-8-2-10-6z" fill="#F2A3C4" ${O}/>`,
    coat: () => SH + `<path d="M22 10h20l12 10-5 8-4-3v31H19V25l-4 3-5-8z" fill="#3E86C9" ${O}/><path d="M19 30h26M19 40h26" stroke="#2D6CA8" stroke-width="2"/><path d="M32 12v44" stroke="${INK}" stroke-width="2"/><path d="M22 10c2 4 5 6 10 6s8-2 10-6" fill="#E9EEF6" ${O}/>`,
    mittens: () => SH + `<path d="M10 28c0-9 4-14 10-14s9 5 9 12l4-2c3 0 3 4 1 6l-5 4v18H12z" fill="#C9416A" ${O}/><path d="M36 30c0-9 4-14 10-14s9 5 9 12v24H38z" fill="#E784B8" ${O}/><path d="M12 46h17M38 46h17" stroke="#fff" stroke-width="3"/>`,
    scarf: () => SH + `<path d="M12 18c10 6 30 6 40 0l2 10c-12 6-32 6-44 0z" fill="#E9873A" ${O}/><path d="M36 26l4 28h10l-4-28z" fill="#E9873A" ${O}/><path d="M40 40h8M41 47h8" stroke="#fff" stroke-width="2.5"/>`,
    blanket: () => SH + `<rect x="8" y="12" width="48" height="40" rx="5" fill="#FBF6EC" ${O}/><path d="M8 25h48M8 38h48M24 12v40M40 12v40" stroke="#D9534F" stroke-width="5" opacity=".75"/><rect x="8" y="12" width="48" height="40" rx="5" fill="none" ${O}/>`,
    sandwich: () => SH + `<path d="M8 40L32 14l24 26z" fill="#F2D29A" ${O}/><path d="M10 44h44" stroke="#7BC062" stroke-width="5" stroke-linecap="round"/><path d="M9 48L33 22l23 26z" fill="#F7DFA8" ${O} transform="translate(0 2)"/>`,
    bottle: () => SH + `<rect x="25" y="8" width="14" height="7" rx="2" fill="#3E86C9" ${O}/><path d="M23 15h18l3 6v31c0 3-2 5-5 5H25c-3 0-5-2-5-5V21z" fill="#BFE0F5" ${O}/><path d="M20 30h24v12H20z" fill="#4FA3D9"/>`,
    pillow: () => SH + `<path d="M10 18c8-4 36-4 44 0 3 10 3 20 0 30-8 4-36 4-44 0-3-10-3-20 0-30z" fill="#E4ECF5" ${O}/><path d="M18 28c6 2 22 2 28 0" fill="none" stroke="#B5C3D6" stroke-width="2"/>`,
    toothbrush: () => SH + `<path d="M8 46L46 16" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M8 46L46 16" stroke="#4FB08A" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M42 10l12 10" stroke="${INK}" stroke-width="1"/><path d="M42 14l3-4M46 16l3-4M50 19l3-4" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M42 14l3-4M46 16l3-4M50 19l3-4" fill="none" ${T}/>`,
    ball: () => SH + `<circle cx="32" cy="34" r="18" fill="#F4CF4E" ${O}/><path d="M14 34c8-4 28-4 36 0M32 16c-6 8-6 28 0 36" fill="none" stroke="#C9416A" stroke-width="3"/>`,
    // ---------------- routine steps ----------------
    wet: () => SH + `<path d="M18 54V30c0-3 4-3 4 0v-8c0-3 4-3 4 0v-2c0-3 4-3 4 0v2c0-3 4-3 4 0v14l3-4c2-3 6-1 4 2l-7 12v8z" fill="#F7D3B6" ${O}/>` +
      [[44, 14], [52, 24], [12, 18]].map(([x, y]) => `<path d="M${x} ${y}c-3 4-3 7 0 8 3-1 3-4 0-8z" fill="#4FA3D9" ${T}/>`).join(""),
    soap: () => SH + `<rect x="12" y="30" width="40" height="22" rx="8" fill="#F2A3C4" ${O}/><path d="M18 36h16" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` +
      [[22, 20, 6], [35, 16, 4.5], [45, 22, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#EAF6FC" ${T}/>`).join(""),
    scrub: () => SH + `<path d="M14 50l8-26c1-3 5-2 5 1l-1 9 9-14c2-3 6-1 5 2l-6 12 10-8c2-2 5 1 3 3l-12 14 10-4c3-1 4 3 1 4l-16 8z" fill="#F7D3B6" ${O}/>` +
      [[12, 22, 5], [24, 12, 4], [48, 14, 5], [52, 30, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#EAF6FC" ${T}/>`).join(""),
    rinse: () => `<path d="M10 16h22c4 0 6 3 6 6v4h-8v-2H10z" fill="#B7C3D3" ${O}/><path d="M16 10h8M20 10v6" ${O}/>` +
      `<path d="M30 30c0 8 2 16 2 22" stroke="#4FA3D9" stroke-width="5" stroke-linecap="round"/><path d="M18 56c4-8 24-8 28 0" fill="#C9D6E6" ${O}/>`,
    dry: () => SH + `<path d="M14 12h36v8H14z" fill="#9A6534" ${O}/><path d="M18 20h28v34c-4 2-24 2-28 0z" fill="#7FC7A6" ${O}/><path d="M18 40h28M18 46h28" stroke="#fff" stroke-width="2.5"/>`,
    toothpaste: () => SH + `<path d="M12 22h30l10 6v8l-10 6H12c-2 0-3-1-3-3V25c0-2 1-3 3-3z" fill="#FBF8F2" ${O}/><path d="M52 28h6v8h-6" fill="#3E86C9" ${O}/><path d="M16 30h20" stroke="#3E86C9" stroke-width="4" stroke-linecap="round"/><path d="M16 36h12" stroke="#C9416A" stroke-width="3" stroke-linecap="round"/>`,
    brush: () => SH + `<path d="M8 46L46 16" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M8 46L46 16" stroke="#4FB08A" stroke-width="5" stroke-linecap="round"/><path d="M40 8c4-2 12 4 14 8 1 3-3 4-6 2-4-2-10-6-8-10z" fill="#EAF6FC" ${T}/><path d="M43 10c2 2 6 4 8 6" stroke="#3E86C9" stroke-width="2"/>`,
    spit: () => `<path d="M8 28h48c0 14-10 24-24 24S8 42 8 28z" fill="#E4ECF5" ${O}/><path d="M8 28h48" ${O}/><circle cx="32" cy="40" r="3" fill="#B7C3D3" ${T}/><path d="M32 8c-3 5-3 9 0 10 3-1 3-5 0-10z" fill="#BFE0F5" ${T}/>`,
    cup: () => SH + `<path d="M16 22h32l-4 32H20z" fill="#7FC7A6" ${O}/><path d="M18 30h28" stroke="#fff" stroke-width="2"/><path d="M28 22L34 6" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M28 22L34 6" stroke="#4FB08A" stroke-width="3" stroke-linecap="round"/>`,
    shovel: () => SH + `<path d="M40 8l-14 30" stroke="#9A6534" stroke-width="5" stroke-linecap="round"/><path d="M36 6h10" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M22 34l10 5-4 12c-2 5-8 6-11 2-2-3-1-7 1-9z" fill="#B7C3D3" ${O}/><path d="M6 56h52" stroke="#9A6534" stroke-width="3" stroke-linecap="round"/>`,
    soil: () => `<path d="M6 46c8-14 44-14 52 0z" fill="#B98552" ${O}/><path d="M6 46h52" stroke="#9A6534" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="40" r="1.6" fill="#8A5A2E"/><circle cx="34" cy="37" r="1.6" fill="#8A5A2E"/><circle cx="44" cy="41" r="1.6" fill="#8A5A2E"/>`,
    wateringcan: () => SH + `<path d="M14 26h26v24c0 3-2 5-5 5H19c-3 0-5-2-5-5z" fill="#4FB08A" ${O}/><path d="M40 32l14-12 3 3-15 15" fill="#4FB08A" ${O}/><path d="M14 30c-6 0-8 4-8 8s3 7 8 7" fill="none" ${O}/>` +
      `<path d="M58 26l2 4M56 30l1 5M60 32l2 4" stroke="#4FA3D9" stroke-width="2.5" stroke-linecap="round"/>`,
    bread: () => SH + `<path d="M12 26c0-10 8-14 20-14s20 4 20 14c0 3-2 4-4 5v20H16V31c-2-1-4-2-4-5z" fill="#F2D29A" ${O}/><path d="M20 30v18h24V30" fill="#FBEBC9"/>`,
    spread: () => SH + `<path d="M10 50L40 20" stroke="#B7C3D3" stroke-width="7" stroke-linecap="round"/><path d="M10 50L40 20" fill="none" ${T}/><path d="M40 20l8-8" stroke="#9A6534" stroke-width="6" stroke-linecap="round"/><path d="M26 30c4-2 8-1 10 2-2 4-6 6-10 4z" fill="#C9416A" ${T}/>`,
    filling: () => SH + `<path d="M8 36c6-10 42-10 48 0-6 6-42 6-48 0z" fill="#7BC062" ${O}/><path d="M14 30l18-12 18 12z" fill="#F4CF4E" ${O}/><circle cx="26" cy="27" r="2" fill="#E9B530"/><circle cx="36" cy="25" r="1.6" fill="#E9B530"/>`,
    // ---------------- logic ----------------
    leaf: () => SH + `<path d="M12 50C12 26 28 12 52 12c0 24-14 40-38 40z" fill="#5DB46E" ${O}/><path d="M14 50L40 24M26 38l-2-8M33 31l6-1" fill="none" stroke="#3D8A4E" stroke-width="2.4" stroke-linecap="round"/>`,
    key: () => SH + `<circle cx="20" cy="30" r="10" fill="#F4CF4E" ${O}/><circle cx="20" cy="30" r="4" fill="#FBF6EC" ${T}/><path d="M30 30h24v6M46 30v8" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 30h24v6M46 30v8" fill="none" stroke="#F4CF4E" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    rock: () => `<path d="M8 50c-2-12 6-26 18-30 8-3 18 0 24 8 6 7 8 16 6 22z" fill="#A9A2B6" ${O}/><path d="M20 30c4-3 10-4 14-2" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`,
    // ---------------- skill icons (Discovery Book) ----------------
    "s-count": () => [[18, 40], [32, 30], [46, 40]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="9" fill="#C9416A" ${O}/><text x="${x}" y="${y + 4}" font-size="11" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">${i + 1}</text>`).join(""),
    "s-compare": () => `<path d="M32 12v40M14 52h36" ${O}/><path d="M10 22h44" ${O}/><path d="M10 22l-4 12h16zM54 22l-4 12h16z" fill="none" ${T}/><path d="M6 34c0 4 4 6 8 6s8-2 8-6zM42 34c0 4 4 6 8 6s8-2 8-6z" fill="#F4CF4E" ${O}/>`,
    "s-plus": () => `<circle cx="32" cy="32" r="22" fill="#FBEFD2" ${O}/><path d="M32 20v24M20 32h24" stroke="#C9416A" stroke-width="6" stroke-linecap="round"/>`,
    "s-minus": () => `<circle cx="32" cy="32" r="22" fill="#E4EEF9" ${O}/><path d="M20 32h24" stroke="#3E86C9" stroke-width="6" stroke-linecap="round"/>`,
    "s-skip": () => `<path d="M6 46h52" ${O}/>` + [10, 24, 38, 52].map(x => `<path d="M${x} 42v8" ${T}/>`).join("") + `<path d="M10 40c2-14 12-14 14 0M24 40c2-14 12-14 14 0M38 40c2-14 12-14 14 0" fill="none" stroke="#7B4FD6" stroke-width="3" stroke-linecap="round"/>`,
    "s-missing": () => `<rect x="14" y="14" width="36" height="36" rx="8" fill="#FBF6EC" ${O} stroke-dasharray="5 4"/><text x="32" y="42" font-size="24" font-weight="700" text-anchor="middle" fill="#7B4FD6" font-family="sans-serif">?</text>`,
    "s-colors": () => [["#D2456B", 20, 24], ["#3E86C9", 44, 24], ["#E7B22C", 20, 44], ["#3D9A63", 44, 44]].map(([c, x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}" ${O}/>`).join(""),
    "s-pattern": () => `<circle cx="12" cy="32" r="7" fill="#D2456B" ${O}/><rect x="22" y="25" width="14" height="14" rx="2" fill="#3E86C9" ${O}/><circle cx="46" cy="32" r="7" fill="#D2456B" ${O}/><rect x="54" y="25" width="8" height="14" rx="2" fill="#3E86C9" ${O} opacity=".5"/>`,
    "s-odd": () => `<rect x="8" y="14" width="16" height="16" rx="3" fill="#3E86C9" ${O}/><rect x="40" y="14" width="16" height="16" rx="3" fill="#3E86C9" ${O}/><rect x="8" y="36" width="16" height="16" rx="3" fill="#3E86C9" ${O}/><circle cx="48" cy="44" r="9" fill="#D2456B" ${O}/>`,
    "s-sort": () => `<path d="M6 40h22l-3 14H9zM36 40h22l-3 14H39z" fill="#D69A5A" ${O}/><circle cx="17" cy="30" r="7" fill="#D2456B" ${O}/><path d="M47 22l8 14H39z" fill="#3E86C9" ${O}/>`,
    "s-letters": () => [["A", 6], ["B", 24], ["C", 42]].map(([c, x]) => `<rect x="${x}" y="20" width="16" height="22" rx="4" fill="#FBF6EC" ${O}/><text x="${x + 8}" y="37" font-size="15" font-weight="700" text-anchor="middle" fill="#7B4FD6" font-family="sans-serif">${c}</text>`).join(""),
    "s-arrows": () => [["M8 32h10m-4-4l4 4-4 4", 4], ["M28 32h10m-4-4l4 4-4 4", 24], ["M50 26v12m-4-4l4 4 4-4", 44]].map(([d, x]) => `<rect x="${x}" y="22" width="18" height="20" rx="5" fill="#ECE6F8" ${T}/><path d="${d}" fill="none" stroke="#7B4FD6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join(""),
    "s-kind": () => SH + `<path d="M32 52C18 42 10 34 10 24c0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 10-8 18-22 28z" fill="#E784B8" ${O}/><path d="M22 22c2-3 5-4 8-3" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`,
    // ---------------- world badges ----------------
    "w-word": () => `<circle cx="32" cy="32" r="28" fill="#F6E3EA"/>` + `<g transform="translate(4 6) scale(.62)">${0}</g>`,
  };
  // world badges compose existing art
  const compose = (bg, parts) => `<circle cx="32" cy="32" r="29" fill="${bg}"/>` + parts.map(([name, x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">${A[name]()}</g>`).join("");
  A["w-word"] = () => compose("#F6E3EA", [["pear", 2, 10, 0.6], ["carrot", 24, 6, 0.62], ["s-letters", 12, 30, 0.6]]);
  A["w-number"] = () => compose("#FBEFD2", [["basket", 14, 22, 0.58], ["berry", 4, 4, 0.42], ["berry", 22, 0, 0.42], ["berry", 40, 4, 0.42]]);
  A["w-pattern"] = () => compose("#E4EEF9", [["s-pattern", 2, 6, 0.95], ["s-sort", 14, 26, 0.6]]);
  A["w-nature"] = () => compose("#E3F2E6", [["owl", 4, 6, 0.58], ["flower", 30, 6, 0.58], ["frog", 16, 28, 0.55]]);
  A["w-logic"] = () => compose("#ECE6F8", [["s-arrows", 4, 6, 0.88], ["leaf", 24, 30, 0.5], ["rock", 6, 32, 0.4]]);
  A["w-everyday"] = () => compose("#FBE7DC", [["umbrella", 4, 4, 0.55], ["soap", 30, 8, 0.52], ["s-kind", 16, 28, 0.55]]);

  // ---------------- shapes ----------------
  const SHAPE_PATH = {
    circle: (f) => `<circle cx="32" cy="32" r="21" fill="${f}" ${O}/>`,
    square: (f) => `<rect x="12" y="12" width="40" height="40" rx="3" fill="${f}" ${O}/>`,
    triangle: (f) => `<path d="M32 9l24 44H8z" fill="${f}" ${O}/>`,
    star: (f) => `<path d="M32 7l7.3 15 16.5 2.3-12 11.6 2.9 16.4L32 44.6l-14.7 7.7 2.9-16.4-12-11.6 16.5-2.3z" fill="${f}" ${O}/>`,
    heart: (f) => `<path d="M32 54C17 43 9 34 9 24c0-7 5-13 12-13 5 0 9 3 11 7 2-4 6-7 11-7 7 0 12 6 12 13 0 10-8 19-23 30z" fill="${f}" ${O}/>`,
    diamond: (f) => `<path d="M32 6l22 26-22 26-22-26z" fill="${f}" ${O}/>`
  };
  const SHAPE_COLORS = { berry: "#D2456B", sky: "#3E86C9", sun: "#E7B22C", leaf: "#3D9A63", plum: "#7B4FD6", ink: "#FBF6EC" };
  // a small symbol inside each colored shape, so color is never the only cue
  const COLOR_MARK = {
    berry: `<circle cx="32" cy="34" r="3" fill="#fff" opacity=".8"/>`,
    sky: `<path d="M27 34h10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
    sun: `<path d="M32 29v10M27 34h10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
    leaf: `<path d="M28 30l8 8M36 30l-8 8" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
    plum: `<path d="M32 29l4 5-4 5-4-5z" fill="#fff" opacity=".85"/>`,
    ink: ""
  };
  function shape(name, color) {
    const f = SHAPE_COLORS[color] || color;
    return (SHAPE_PATH[name] || SHAPE_PATH.circle)(f) + (COLOR_MARK[color] || "");
  }
  ["circle", "square", "triangle", "star", "heart", "diamond"].forEach((s, i) => { A["shape-" + s] = () => shape(s, ["berry", "sky", "sun", "leaf", "plum", "berry"][i]); });

  function svg(inner, cls, label) {
    const aria = label ? `role="img" aria-label="${String(label).replace(/"/g, "&quot;")}"` : `aria-hidden="true" focusable="false"`;
    return `<svg class="${cls || "art"}" viewBox="0 0 64 64" ${aria}>${inner}</svg>`;
  }
  function item(name, cls, label) { return svg(A[name] ? A[name]() : A.leaf(), cls, label); }
  function shapeSvg(name, color, cls, label) { return svg(shape(name, color), cls, label); }
  const has = (name) => !!A[name];

  // ---------------- the snake companion ----------------
  let uid = 0;
  const PATTERN_DEFS = {
    plain: () => "",
    spots: (id, dark) => `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.2" fill="${dark}" opacity=".55"/><circle cx="14" cy="13" r="2.4" fill="#fff" opacity=".35"/></pattern>`,
    stripes: (id, dark) => `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="14" fill="${dark}" opacity=".45"/></pattern>`,
    zigzag: (id, dark) => `<pattern id="${id}" width="16" height="12" patternUnits="userSpaceOnUse"><path d="M0 9l4-5 4 5 4-5 4 5" fill="none" stroke="#fff" stroke-width="2.4" opacity=".55"/></pattern>`
  };
  function accessorySvg(kind, hx, hy, s) {
    // hx,hy: head center; s: scale
    const t = (inner) => `<g transform="translate(${hx} ${hy}) scale(${s})">${inner}</g>`;
    switch (kind) {
      case "hat": return t(`<path d="M-30-14c0-14 12-22 30-22s30 8 30 22z" fill="#D9B77A" ${O}/><path d="M-40-14h80c0 5-18 8-40 8s-40-3-40-8z" fill="#E6C88E" ${O}/><path d="M-28-18h56" stroke="#7B5A2E" stroke-width="5"/>`);
      case "crown": return t([-24, -12, 0, 12, 24].map((x, i) => `<circle cx="${x}" cy="${-24 + Math.abs(x) / 5}" r="6.5" fill="${["#F2A3C4", "#F4CF4E", "#F7BBD3", "#F4CF4E", "#F2A3C4"][i]}" ${T}/><circle cx="${x}" cy="${-24 + Math.abs(x) / 5}" r="2" fill="#E9873A"/>`).join(""));
      case "glasses": return t(`<circle cx="-11" cy="-6" r="11" fill="#fff" fill-opacity=".15" stroke="${INK}" stroke-width="3"/><circle cx="11" cy="-6" r="11" fill="#fff" fill-opacity=".15" stroke="${INK}" stroke-width="3"/><path d="M0-6h0" stroke="${INK}" stroke-width="3"/>`);
      case "bowtie": return t(`<path d="M0 24l-16-9v18zM0 24l16-9v18z" fill="#C9416A" ${O}/><circle cx="0" cy="24" r="4.5" fill="#A8324F" ${T}/>`);
      case "scarf": return t(`<path d="M-26 18c14 9 38 9 52 0l2 10c-16 9-40 9-56 0z" fill="#E9873A" ${O}/><path d="M12 26l6 22h10l-6-24z" fill="#E9873A" ${O}/><path d="M16 36h10" stroke="#fff" stroke-width="3"/>`);
      default: return "";
    }
  }
  /* mood: idle | happy | think | oops | cheer | sleep */
  function face(mood, cx, cy, s) {
    const g = (inner) => `<g transform="translate(${cx} ${cy}) scale(${s})">${inner}</g>`;
    const eyes = {
      idle: `<g class="eyes"><circle cx="-11" cy="-6" r="8.5" fill="#fff" ${T}/><circle cx="11" cy="-6" r="8.5" fill="#fff" ${T}/><circle cx="-9" cy="-5" r="4.6" fill="${INK}"/><circle cx="13" cy="-5" r="4.6" fill="${INK}"/><circle cx="-7.5" cy="-7" r="1.6" fill="#fff"/><circle cx="14.5" cy="-7" r="1.6" fill="#fff"/></g>`,
      think: `<g class="eyes"><circle cx="-11" cy="-6" r="8.5" fill="#fff" ${T}/><circle cx="11" cy="-6" r="8.5" fill="#fff" ${T}/><circle cx="-13" cy="-10" r="4.4" fill="${INK}"/><circle cx="9" cy="-10" r="4.4" fill="${INK}"/></g><path d="M-18-17l9-2M4-19l9 2" ${T}/>`,
      oops: `<g class="eyes"><circle cx="-11" cy="-6" r="8.5" fill="#fff" ${T}/><circle cx="11" cy="-6" r="8.5" fill="#fff" ${T}/><circle cx="-11" cy="-4" r="4.4" fill="${INK}"/><circle cx="11" cy="-4" r="4.4" fill="${INK}"/></g><path d="M-19-15l8 3M19-15l-8 3" ${T}/>`,
      happy: `<path d="M-18-5c3-6 11-6 14 0M4-5c3-6 11-6 14 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      cheer: `<path d="M-18-5c3-6 11-6 14 0M4-5c3-6 11-6 14 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      sleep: `<path d="M-18-5c3 4 11 4 14 0M4-5c3 4 11 4 14 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    }[mood] || "";
    const mouth = {
      idle: `<path d="M-6 9c3 3 9 3 12 0" fill="none" ${T}/>`,
      think: `<path d="M-4 10h8" ${T}/>`,
      oops: `<ellipse cx="0" cy="10" rx="3.5" ry="4" fill="#8A3A52" ${T}/>`,
      happy: `<path d="M-8 7c3 6 13 6 16 0z" fill="#8A3A52" ${T}/>`,
      cheer: `<path d="M-9 6c2 10 16 10 18 0z" fill="#8A3A52" ${T}/><path d="M-3 12c1 4 5 4 6 0" fill="#F2A3C4"/>`,
      sleep: `<path d="M-4 9c2 2 6 2 8 0" fill="none" ${T}/>`
    }[mood] || "";
    return g(eyes + mouth + `<circle cx="-20" cy="6" r="4" fill="#F2A3C4" opacity=".55"/><circle cx="20" cy="6" r="4" fill="#F2A3C4" opacity=".55"/>`);
  }
  function mascot(opts) {
    const o = Object.assign({ color: "#7B4FD6", dark: "#55309F", pattern: "plain", accessory: "none", mood: "idle", label: "Snake guide" }, opts || {});
    const id = "sp" + (++uid);
    const pat = (PATTERN_DEFS[o.pattern] || PATTERN_DEFS.plain)(id, o.dark);
    const body = "M18 112c22 14 46 10 52-6s20-30 42-22 26 30 44 22 18-30 6-42";
    const patStroke = pat ? `<path d="${body}" fill="none" stroke="url(#${id})" stroke-width="22" stroke-linecap="round"/>` : "";
    const hx = 158, hy = 54;
    return `<svg class="mascot mood-${o.mood}" viewBox="0 0 200 140" role="img" aria-label="${o.label}">` +
      (pat ? `<defs>${pat}</defs>` : "") +
      `<ellipse cx="100" cy="128" rx="80" ry="6" fill="${INK}" opacity=".08"/>` +
      `<path d="${body}" fill="none" stroke="${INK}" stroke-width="27" stroke-linecap="round"/>` +
      `<path d="${body}" fill="none" stroke="${o.color}" stroke-width="22" stroke-linecap="round"/>` + patStroke +
      `<path d="M30 116c18 8 34 4 40-6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".28"/>` +
      `<path d="M${hx - 2} ${hy + 26}c3 8 0 12-4 14m4-14c5 6 8 7 12 6" fill="none" stroke="#D2456B" stroke-width="3" stroke-linecap="round" class="tongue"/>` +
      `<ellipse cx="${hx}" cy="${hy}" rx="31" ry="27" fill="${o.color}" ${O}/>` +
      (pat ? `<ellipse cx="${hx}" cy="${hy}" rx="31" ry="27" fill="url(#${id})" opacity=".7"/>` : "") +
      (o.accessory === "scarf" || o.accessory === "bowtie" ? accessorySvg(o.accessory, hx, hy, 1) : "") +
      face(o.mood, hx, hy + 2, 1) +
      (o.accessory !== "scarf" && o.accessory !== "bowtie" ? accessorySvg(o.accessory, hx, hy - (o.accessory === "glasses" ? -2 : 6), 1) : "") +
      `</svg>`;
  }
  // board head: 40×40, facing right by default (rotated by CSS)
  function head(opts) {
    const o = Object.assign({ color: "#7B4FD6", accessory: "none", mood: "idle" }, opts || {});
    return `<svg class="head-svg" viewBox="-32 -32 64 64" aria-hidden="true" focusable="false">` +
      `<ellipse cx="0" cy="0" rx="27" ry="25" fill="${o.color}" ${O}/>` +
      `<g>` + face(o.mood, 0, -2, 0.8) +
      (o.accessory && o.accessory !== "none" ? accessorySvg(o.accessory, 0, o.accessory === "bowtie" || o.accessory === "scarf" ? -6 : -2, 0.7) : "") + `</g></svg>`;
  }

  return { item, shapeSvg, svg, mascot, head, has, names: () => Object.keys(A), SHAPE_COLORS, INK };
});
