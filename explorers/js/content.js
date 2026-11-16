/* content.js — Snake Explorers: worlds, concepts, activities, and round builders.
 * Authored records live in bank.js and levels.js. Every prompt carries:
 *   cids        canonical content ids (what the question IS, not its layout)
 *   instruction, say, hints (gentle → clearer), explanation, concepts, seen
 * Builders draw items through a freshness-aware context (deck.js), so rounds
 * deal unseen questions first and avoid recent ones across rounds and reloads.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./logic.js"), require("./deck.js"), require("./bank.js"), require("./levels.js"));
  else root.SE_Content = factory(root.SE_Logic, root.SE_Deck, root.SE_Bank, root.SE_Levels);
})(typeof self !== "undefined" ? self : this, function (L, Deck, B, LV) {
  "use strict";
  const { int, shuffle, sample, pick } = L;

  // ====================================================================== WORLDS
  const WORLDS = [
    { id: "word", name: "Word Garden", art: "w-word", tint: "#F6E3EA", skill: "Words & reading", example: "Steer to the pear when you hear “pear”." },
    { id: "number", name: "Number Meadow", art: "w-number", tint: "#FBEFD2", skill: "Counting & math", example: "Collect exactly five berries for the basket." },
    { id: "pattern", name: "Pattern Playground", art: "w-pattern", tint: "#E4EEF9", skill: "Shapes & patterns", example: "What comes next: circle, square, circle…?" },
    { id: "nature", name: "Nature Trail", art: "w-nature", tint: "#E3F2E6", skill: "Animals & plants", example: "Help the camel find a dry, sandy home." },
    { id: "logic", name: "Logic Lab", art: "w-logic", tint: "#ECE6F8", skill: "Planning & coding", example: "Line up arrows, press Run, reach the leaf." },
    { id: "everyday", name: "Everyday Adventures", art: "w-everyday", tint: "#FBE7DC", skill: "Daily life & kindness", example: "Put the handwashing steps in order." }
  ];
  const MODE_INFO = {
    explore: { name: "Explore", line: "Relaxed. Tips shown, no timer." },
    practice: { name: "Practice", line: "Short goals with helpful feedback." },
    challenge: { name: "Challenge", line: "Harder puzzles. Extra hints if you ask." }
  };

  // ====================================================================== SHAPES & COLORS
  const COLORS = { berry: { name: "red", hex: "#D2456B" }, sky: { name: "blue", hex: "#3E86C9" }, sun: { name: "yellow", hex: "#E7B22C" }, leaf: { name: "green", hex: "#3D9A63" }, plum: { name: "purple", hex: "#7B4FD6" } };
  const SHAPES = {
    circle: { name: "circle", sides: 0, curved: true, fact: "A circle is perfectly round, with no corners." },
    square: { name: "square", sides: 4, curved: false, equal: true, fact: "A square has 4 equal straight sides and 4 square corners." },
    triangle: { name: "triangle", sides: 3, curved: false, fact: "A triangle has 3 straight sides and 3 corners." },
    star: { name: "star", sides: 10, curved: false, fact: "This star has 5 points and 10 straight edges." },
    heart: { name: "heart", sides: 0, curved: true, fact: "A heart has two round bumps at the top and a point at the bottom." },
    diamond: { name: "diamond", sides: 4, curved: false, equal: true, fact: "A diamond (rhombus) has 4 equal sides and stands on a corner." },
    rectangle: { name: "rectangle", sides: 4, curved: false, equal: false, fact: "A rectangle has 4 square corners, with two long sides and two short sides." },
    pentagon: { name: "pentagon", sides: 5, curved: false, fact: "A pentagon has 5 straight sides." },
    hexagon: { name: "hexagon", sides: 6, curved: false, fact: "A hexagon has 6 straight sides — like a honeycomb cell." },
    oval: { name: "oval", sides: 0, curved: true, fact: "An oval is a stretched circle, with no corners." }
  };
  const BASIC_SHAPES = ["circle", "square", "triangle", "star", "heart", "diamond"];
  const COLOR_IDS = Object.keys(COLORS);
  const piece = (color, shape) => ({ id: color + "-" + shape, color, shape, label: COLORS[color].name + " " + SHAPES[shape].name });

  // ====================================================================== CONCEPTS (Discovery Book)
  const FOOD = Object.fromEntries(B.FOODS.map(f => [f.id, f]));
  const ANIMAL = Object.fromEntries(B.ANIMALS.map(a => [a.id, a]));
  const HABITAT = Object.fromEntries(B.HABITATS.map(h => [h.id, h]));
  const CONCEPTS = [];
  const addC = (world, id, label, art, fact) => CONCEPTS.push({ id, world, label, art: art || id, fact });
  B.FOODS.forEach(f => addC("word", f.id, f.name, f.id, f.fact));
  addC("word", "sun", "sun", "summer", "The sun is a star — the closest one to Earth.");
  addC("word", "hat", "hat", "sunhat", "A hat with a wide brim keeps sun off your face.");
  addC("word", "leaf", "leaf", "leaf", "Leaves use sunlight to make food for the plant.");
  Object.entries(B.WORD_FACTS).forEach(([id, fact]) => {
    const w = [].concat(B.WORDS.explore, B.WORDS.practice, B.WORDS.challenge).find(x => x[2] === id);
    addC("word", id, w[0], w[1], fact);
  });
  addC("word", "sentences", "Building sentences", "s-letters", "A sentence starts with a capital letter and ends with a full stop.");
  addC("number", "count", "Counting", "s-count", "When you count, the last number you say tells how many.");
  addC("number", "compare", "More and less", "s-compare", "Matching items in pairs shows which group has more.");
  addC("number", "add", "Adding", "s-plus", "Adding puts groups together to make a bigger group.");
  addC("number", "subtract", "Taking away", "s-minus", "Taking away tells how many are left.");
  addC("number", "sequence", "Number patterns", "s-skip", "In a number pattern, the same change happens each step.");
  addC("number", "missing", "Missing numbers", "s-missing", "To find a missing number, count up from what you have.");
  addC("number", "share", "Sharing equally", "s-share", "Sharing equally means every group gets the same amount.");
  addC("number", "groups", "Equal groups", "s-groups", "Counting equal groups is faster: 3 groups of 4 make 12.");
  addC("number", "measure", "Comparing amounts", "s-compare", "Heavier, longer, and holds more are ways to compare things.");
  addC("number", "place-value", "Tens and ones", "s-tens", "In 14, the 1 means one ten and the 4 means four ones.");
  Object.keys(SHAPES).filter(s => s !== "oval").forEach(s => addC("pattern", s, SHAPES[s].name, "shape-" + s, SHAPES[s].fact));
  addC("pattern", "colors", "Colors", "s-colors", "Sorting by color means looking only at color, not shape.");
  addC("pattern", "patterns", "Repeating patterns", "s-pattern", "A repeating pattern has a part that repeats again and again.");
  addC("pattern", "odd", "Odd one out", "s-odd", "To find the odd one out, look for the rule that fits all the others.");
  addC("pattern", "symmetry", "Symmetry", "s-mirror", "A shape is symmetric when one half is a mirror image of the other.");
  addC("pattern", "rotation", "Turning shapes", "s-turn", "Turning a shape changes which way it faces, not its shape.");
  addC("pattern", "growing", "Growing patterns", "s-grow", "In a growing pattern, each step adds by a rule.");
  B.ANIMALS.forEach(a => addC("nature", a.id, a.name, a.id, a.fact));
  B.HABITATS.forEach(h => addC("nature", "hab-" + h.id, h.name.toLowerCase(), "hab-" + h.id, "A " + h.name.toLowerCase() + " habitat: " + h.note + "."));
  addC("nature", "cycle-plant", "How a plant grows", "flower", "A seed sprouts, grows leaves, flowers, then makes fruit with new seeds.");
  addC("nature", "cycle-butterfly", "Butterfly life cycle", "butterfly", "Egg, caterpillar, chrysalis, butterfly.");
  addC("nature", "cycle-frog", "Frog life cycle", "tadpole", "Eggs hatch into tadpoles, which grow legs and become frogs.");
  addC("nature", "cycle-chicken", "Chicken life cycle", "chick", "A chick hatches from an egg and grows into a chicken.");
  addC("nature", "seasons", "Seasons", "autumn", "Spring, summer, autumn, and winter repeat in a cycle.");
  addC("nature", "cycle-ladybug", "Ladybug life cycle", "ladybug", "Egg, larva, pupa, ladybug.");
  addC("nature", "cycle-tree", "How a tree grows", "tree", "A seed sprouts, becomes a young sapling, and after years a tall tree.");
  addC("nature", "apple-year", "An apple tree's year", "apple", "Blossoms in spring, apples in summer, falling leaves in autumn, rest in winter.");
  addC("nature", "water-cycle", "The water cycle", "cloud", "Water warms, rises, forms clouds, falls as rain, and collects again.");
  addC("nature", "day-cycle", "Day and night", "moon", "Sunrise, midday, sunset, and night repeat every day.");
  addC("nature", "food-chains", "Food chains", "s-chain", "A food chain shows what eats what, starting with a plant.");
  addC("nature", "living-things", "Living things", "tree", "Living things grow, need food and water, and have young.");
  addC("nature", "plants-need", "What plants need", "sprout", "Plants use sunlight, water, and air to make their food.");
  addC("logic", "arrows", "Arrow code", "s-arrows", "A program is a list of steps that run in order.");
  addC("logic", "obstacles", "Planning around rocks", "rock", "Planning ahead helps you find a path around obstacles.");
  addC("logic", "keys", "Two-stop routes", "key", "Breaking a trip into parts — first the key, then the leaf — makes it easier.");
  addC("logic", "predict", "Predicting code", "s-predict", "Running code in your head, one step at a time, shows where it ends.");
  addC("logic", "debug", "Debugging", "s-bug", "Debugging means finding the step that goes wrong and fixing it.");
  addC("everyday", "handwashing", "Washing hands", "soap", "Scrubbing with soap for about 20 seconds helps wash germs away.");
  addC("everyday", "teeth", "Brushing teeth", "toothbrush", "Brushing twice a day helps keep teeth healthy.");
  addC("everyday", "planting", "Planting a seed", "wateringcan", "Seeds need soil, water, and light to grow.");
  addC("everyday", "sandwich", "Making a sandwich", "sandwich", "Following steps in order makes a job easier.");
  Object.values(B.ROUTINES).forEach(r => { if (!CONCEPTS.some(c => c.id === r.concept)) addC("everyday", r.concept, r.title, routineArt(r), "Doing the steps in order: " + r.steps.map(s => s.label.toLowerCase()).join(", ") + "."); });
  addC("everyday", "rain-gear", "Rainy-day gear", "rain", "Waterproof things help keep you dry in the rain.");
  addC("everyday", "snow-gear", "Snowy-day gear", "snow", "Layers and mittens help keep you warm in the snow.");
  addC("everyday", "sun-gear", "Sunny-day gear", "summer", "Hats, sunglasses, and sunscreen help protect you from strong sun.");
  addC("everyday", "wind-gear", "Windy-day gear", "windy", "A scarf or a jacket helps on a cool, windy day.");
  addC("everyday", "hot-day", "Hot-day care", "bottle", "Water, shade, and a hat help you stay cool on hot days.");
  addC("everyday", "storm-safety", "Storm safety", "rain", "When there's thunder and lightning, go inside a building.");
  addC("everyday", "icy-safety", "Icy paths", "snow", "Small, slow steps help on slippery ice.");
  addC("everyday", "lost-safety", "If you get separated", "s-look", "Stay put or ask a worker for help if you lose your grown-up.");
  addC("everyday", "kitchen-safety", "Kitchen safety", "room-kitchen", "Hot pots and stoves are for grown-ups to handle.");
  addC("everyday", "picnic", "Packing a picnic", "basket", "Checking a list helps you remember everything.");
  addC("everyday", "beach-trip", "Packing for the beach", "hab-ocean", "A list helps you pack for a sunny day out.");
  addC("everyday", "sleepover", "Packing for a sleepover", "pillow", "A list helps you remember everything for a night away.");
  addC("everyday", "kindness", "Kind choices", "s-kind", "Asking “Do you want help?” is often a kind first step.");
  addC("everyday", "tidy-up", "Tidying up", "room-bedroom", "Things are easier to find when each has a place — and some fit in more than one.");
  function routineArt(r) { const s = r.steps.find(x => x.art) || r.steps[0]; return s.art || s.v; }
  const CONCEPT = Object.fromEntries(CONCEPTS.map(c => [c.id, c]));
  const conceptWorld = Object.fromEntries(CONCEPTS.map(c => [c.id, c.world]));

  // ====================================================================== helpers
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let uid = 0;
  const pid = (p) => p + "-" + (++uid);
  function nearNumbers(ans, rand, count, spread) {
    const out = new Set([ans]);
    const deltas = shuffle([1, -1, 2, -2, spread || 3, -(spread || 3), 10, -10], rand);
    for (const d of deltas) { if (out.size >= count) break; const v = ans + d; if (v >= 0) out.add(v); }
    let k = 4; while (out.size < count) out.add(ans + k++);
    return shuffle(Array.from(out), rand);
  }
  const numOpts = (vals, unit) => vals.map(v => ({ id: "n" + v, text: String(v) + (unit || ""), label: String(v) + (unit || "") }));
  const graded = (p) => Object.assign({ graded: true }, p);
  const ARROW = { up: "↑", down: "↓", left: "←", right: "→" };

  // Pick a container (habitat set, room set) so the round gets as many fresh items as possible.
  function pickContainer(ctx, sets, prefix, itemsFor, itemCid, need) {
    const ordered = ctx.pick(sets.map(s => ({ cid: prefix + s.join(","), s })), sets.length);
    let best = null, bestFresh = -1;
    ordered.forEach(c => {
      const freshItems = itemsFor(c.s).filter(x => ctx.isFresh(itemCid(x)));
      const covered = c.s.filter(bin => freshItems.some(x => (x.homes || x.rooms).includes(bin))).length;
      const score = covered * 100 + Math.min(freshItems.length, need);
      if (score > bestFresh) { best = c; bestFresh = score; }
    });
    return best;
  }

  // ====================================================================== WORD GARDEN
  function buildSnackHunt(mode, ctx) {
    const rand = ctx.rand;
    if (mode === "explore") {
      return [{ id: pid("hunt"), cids: ["hunt-explore"], mechanic: "collect", kind: "explore", graded: false,
        instruction: "Steer the snake to any snack to hear its name.", goal: 6, pool: B.FOODS.map(f => f.id), concepts: [],
        hints: ["Use the arrows. Any snack is a good choice."], explanation: "You met six snacks!" }];
    }
    const findPrompt = (t, byClue) => {
      const others = sample(B.FOODS.filter(f => f.id !== t.id), mode === "challenge" ? 3 : 2, rand);
      const instr = byClue ? "Find " + t.clue + "." : "Find the " + t.name + ".";
      return graded({ id: pid("hunt"), mechanic: "collect", kind: "find", instruction: instr, target: t.id, targets: [t.id],
        board: shuffle([t.id].concat(others.map(o => o.id)), rand),
        wrongHints: Object.fromEntries(others.map(o => [o.id, "That's the " + o.name + ". " + (byClue ? "Read the clue again." : "The " + t.name + " is " + t.look + ".")])),
        hints: byClue ? ["Read the clue again: " + t.clue + ".", "It's the " + t.name + ": " + t.look + "."] : ["The " + t.name + " is " + t.look + ".", "Look for something " + t.look + "."],
        explanation: cap(t.name) + (t.plural ? " are " : " is ") + t.look + ". " + t.fact,
        concepts: [t.id], seen: [t.id].concat(others.map(o => o.id)) });
    };
    if (mode === "practice") {
      return ctx.pick(B.FOODS.map(f => ({ cid: "find:" + f.id, f })), 5).map(c => Object.assign(findPrompt(c.f, false), { cids: [c.cid] }));
    }
    const cands = B.FOODS.map(f => ({ cid: "clue:" + f.id, topic: "clue", f })).concat(B.FOOD_CATEGORIES.map(k => ({ cid: "cat:" + k.id, topic: "cat", k })));
    return ctx.pick(cands, 5, { spread: true }).map(c => {
      if (c.f) return Object.assign(findPrompt(c.f, true), { cids: [c.cid] });
      const k = c.k;
      const valid = sample(k.valid, Math.min(k.valid.length, 1 + int(rand, 0, 1)), rand);
      const nots = sample(k.not, 3, rand);
      const instr = "Find " + k.ask + ".";
      return graded({ id: pid("hunt"), cids: [c.cid], mechanic: "collect", kind: "find", instruction: instr, target: valid[0], targets: valid,
        board: shuffle(valid.concat(nots), rand),
        wrongHints: Object.fromEntries(nots.map(n => [n, "That's the " + FOOD[n].name + ". Look for " + k.ask + "."])),
        hints: ["Read the clue again: " + k.ask + ".", "One answer: the " + FOOD[valid[0]].name + "."],
        explanation: k.why, concepts: valid, seen: valid.concat(nots) });
    });
  }

  function buildLetterLine(mode, ctx) {
    const rand = ctx.rand;
    const n = mode === "explore" ? 4 : 5;
    return ctx.pick(B.WORDS[mode].map(w => ({ cid: "word:" + w[0], w })), n).map(({ cid, w: [word, artId, conceptId] }) => {
      const letters = word.toUpperCase().split("");
      const tileLetters = letters.slice();
      if (mode === "challenge") tileLetters.push(pick("BDKMRSTW".split("").filter(c => !letters.includes(c)), rand));
      const tiles = shuffle(tileLetters.map((c, i) => ({ id: "t" + i + c, value: c, label: c })), rand);
      const guide = mode === "explore";
      const instr = mode === "challenge" ? "Spell the name of this picture. One letter isn't needed." : guide ? "Copy the word: tap the letters in order." : "Spell the word you hear.";
      return graded({ id: pid("word"), cids: [cid], mechanic: "sequence", kind: "letters",
        instruction: instr, say: mode === "challenge" ? "Spell the name of this picture." : "Spell " + word + ".",
        picture: artId, word, guide: guide ? word.toUpperCase() : null, sayWord: mode !== "challenge" ? word : null,
        tiles, slots: letters.length, answers: [letters], fixed: mode === "practice" ? [0] : [],
        hints: [mode === "challenge" ? "Say the word slowly. What sound do you hear first?" : "Listen to the first sound: " + word[0].toUpperCase() + ".",
          "It starts with " + letters.slice(0, Math.ceil(letters.length / 2)).join("") + "…"],
        explanation: word.toUpperCase() + " spells " + word + ".", concepts: [conceptId], seen: [conceptId] });
    });
  }

  function buildSentenceBuilder(mode, ctx) {
    const rand = ctx.rand;
    const n = mode === "explore" ? 3 : 4;
    return ctx.pick(B.SENTENCES[mode].map(s => ({ cid: "sent:" + s.id, s })), n).map(({ cid, s }) => {
      const words = s.words.slice();
      const tileWords = s.spare && mode === "challenge" ? words.concat([s.spare]) : words;
      const tiles = shuffle(tileWords.map((w, i) => ({ id: "w" + i, value: w, label: w })), rand);
      const sentence = words.join(" ");
      const instr = mode === "explore" ? "Copy the sentence: tap the words in order." : mode === "practice" ? "Build the sentence that matches the picture." : "Build a sentence about the picture. One word isn't needed.";
      return graded({ id: pid("sent"), cids: [cid], mechanic: "sequence", kind: "words", picture: s.art,
        instruction: instr, say: mode === "challenge" ? instr : instr + " " + sentence, sayWord: mode !== "challenge" ? sentence : null,
        guide: mode === "explore" ? words : null, tiles, slots: words.length, answers: [words].concat(s.alt || []), fixed: [],
        hints: ["The word with a capital letter goes first.", "The word with the full stop goes last. It starts: “" + words.slice(0, 2).join(" ") + " …”"],
        explanation: "“" + sentence + "”" + (s.alt ? " (Other good orders work too.)" : ""),
        concepts: ["sentences"].concat(ANIMAL[s.art] ? [s.art] : []), seen: ["sentences"] });
    });
  }

  // ====================================================================== NUMBER MEADOW
  function buildBerryCount(mode, ctx) {
    const n = mode === "explore" ? 3 : 4;
    const make = (rand) => {
      if (mode === "explore") { const t = int(rand, 1, 8); return rand() < 0.5 ? { cid: "count:" + t, target: t } : { cid: "match:" + t, target: t, show: "dots" }; }
      if (mode === "practice") {
        if (rand() < 0.6) { const t = int(rand, 3, 12); return { cid: "count:" + t, target: t }; }
        const a = int(rand, 3, 9); return { cid: "more:" + a, target: a + 1, expr: "one more than " + a, hints: ["One more than " + a + " is the next number when you count.", "After " + a + " comes " + (a + 1) + "."], c: ["count"] };
      }
      const kind = pick(["sum", "sum", "diff", "double", "more", "less"], rand);
      if (kind === "sum") { const a = int(rand, 2, 7), b = int(rand, 2, 7); if (a + b > 13) return null; return { cid: "sum:" + Math.min(a, b) + "+" + Math.max(a, b), target: a + b, expr: a + " + " + b, hints: ["Work out " + a + " + " + b + " first. Start at " + a + " and count on " + b + ".", a + " + " + b + " makes " + (a + b) + "."], c: ["add", "count"] }; }
      if (kind === "diff") { const a = int(rand, 8, 13), b = int(rand, 2, 6); return { cid: "diff:" + a + "-" + b, target: a - b, expr: a + " − " + b, hints: ["Work out " + a + " − " + b + ". Start at " + a + " and count back " + b + ".", a + " − " + b + " is " + (a - b) + "."], c: ["subtract", "count"] }; }
      if (kind === "double") { const a = int(rand, 2, 6); return { cid: "double:" + a, target: a * 2, expr: "double " + a, hints: ["Double means the same number twice: " + a + " + " + a + ".", "Double " + a + " is " + (2 * a) + "."], c: ["add", "count"] }; }
      if (kind === "more") { const a = int(rand, 3, 9); return { cid: "more:" + a, target: a + 1, expr: "one more than " + a, hints: ["One more than " + a + " is the next number when you count.", "After " + a + " comes " + (a + 1) + "."], c: ["count"] }; }
      const a = int(rand, 3, 10); return { cid: "less:" + a, target: a - 1, expr: "one less than " + a, hints: ["One less than " + a + " is the number just before it.", "Before " + a + " comes " + (a - 1) + "."], c: ["count"] };
    };
    return ctx.generate(make, n, { spread: false }).map(g => {
      const t = g.target, expr = g.expr || null;
      const instr = g.show === "dots" ? "Collect as many berries as the picture shows, then go to the basket."
        : expr ? "Collect " + expr + " berries, then go to the basket." : "Collect exactly " + t + " " + (t === 1 ? "berry" : "berries") + ", then go to the basket.";
      return graded({ id: pid("count"), cids: [g.cid], mechanic: "collect", kind: "count", instruction: instr, target: t, expr,
        display: g.show === "dots" ? "dots" : mode === "explore" ? "frame" : expr ? "expr" : "number", berries: Math.min(t + 3, 16),
        hints: g.hints || ["Count each berry as the snake eats it.", "Stop when you reach " + t + ", then head to the basket."],
        explanation: (expr ? cap(expr) + " is " + t + ". " : "") + "You brought " + t + " " + (t === 1 ? "berry" : "berries") + " — exactly right.",
        concepts: g.c || ["count"], seen: ["count"] });
    });
  }

  // --- Meadow Math question makers. Each returns a prompt with a canonical cid.
  const Q = {
    count(rand) { const n = int(rand, 1, 8); const o = nearNumbers(n, rand, 3, 2).filter(v => v > 0); while (o.length < 3) o.push(n + o.length + 2);
      return { cid: "count:" + n, topic: "count", instruction: "How many berries?", visual: { kind: "dots", groups: [{ n, art: "berry" }] }, options: numOpts(shuffle(o, rand)), rule: { type: "one", valid: ["n" + n] },
        hints: ["Point to each berry as you count — one number for each berry.", "Count again slowly. The last number you say tells how many."], explanation: "There " + (n === 1 ? "is 1 berry." : "are " + n + " berries."), concepts: ["count"] }; },
    more(rand) { let a, b; do { a = int(rand, 1, 8); b = int(rand, 1, 8); } while (Math.abs(a - b) < 2);
      return { cid: "more:" + Math.min(a, b) + "," + Math.max(a, b), topic: "compare", instruction: "Which basket has more berries?", visual: null,
        options: [{ id: "left", dots: { n: a, art: "berry" }, label: "Left basket" }, { id: "right", dots: { n: b, art: "berry" }, label: "Right basket" }], rule: { type: "one", valid: [a > b ? "left" : "right"] }, wide: true,
        hints: ["Pair up berries from each basket. Which one has berries left over?", "Count each basket. The bigger number has more."], explanation: Math.max(a, b) + " is more than " + Math.min(a, b) + ".", concepts: ["compare"] }; },
    oneMore(rand) { const a = int(rand, 2, 12); const less = rand() < 0.5; const ans = less ? a - 1 : a + 1;
      return { cid: (less ? "1less:" : "1more:") + a, topic: "onemore", instruction: "What is one " + (less ? "less" : "more") + " than " + a + "?", visual: { kind: "numberline", items: [String(a - 1 >= 0 ? a - 1 : 0), String(a), String(a + 1)].map((x, i) => (i === (less ? 0 : 2) ? "?" : x)) },
        options: numOpts(nearNumbers(ans, rand, 3, 2)), rule: { type: "one", valid: ["n" + ans] },
        hints: [less ? "One less is the number just before." : "One more is the next number when you count.", (less ? "Just before " : "Just after ") + a + " comes " + ans + "."], explanation: "One " + (less ? "less" : "more") + " than " + a + " is " + ans + ".", concepts: ["count"] }; },
    addPics(rand) { const a = int(rand, 1, 5), b = int(rand, 1, 5), s = a + b;
      return { cid: "add:" + Math.min(a, b) + "+" + Math.max(a, b), topic: "add", instruction: "What is " + a + " + " + b + "?", visual: { kind: "dots", groups: [{ n: a, art: "berry" }, { n: b, art: "berry" }], op: "+" },
        options: numOpts(nearNumbers(s, rand, 4)), rule: { type: "one", valid: ["n" + s] }, hints: ["Start at " + a + " and count on " + b + " more.", "Count all the berries together, one by one."], explanation: a + " + " + b + " = " + s + ".", concepts: ["add"] }; },
    add20(rand) { const a = int(rand, 6, 12), b = int(rand, 3, 8), s = a + b;
      return { cid: "add:" + Math.min(a, b) + "+" + Math.max(a, b), topic: "add", instruction: "What is " + a + " + " + b + "?", visual: { kind: "equation", text: a + " + " + b + " = ?" },
        options: numOpts(nearNumbers(s, rand, 4)), rule: { type: "one", valid: ["n" + s] }, hints: ["Start at the bigger number, " + Math.max(a, b) + ", and count on " + Math.min(a, b) + ".", "Make a ten first: " + a + " + " + (10 - a > 0 && 10 - a <= b ? (10 - a) + " = 10, then add " + (b - (10 - a)) : b) + "."], explanation: a + " + " + b + " = " + s + ".", concepts: ["add"] }; },
    double(rand) { const a = int(rand, 2, 10);
      return { cid: "double:" + a, topic: "double", instruction: "What is double " + a + "?", visual: { kind: "equation", text: a + " + " + a + " = ?" }, options: numOpts(nearNumbers(2 * a, rand, 4)), rule: { type: "one", valid: ["n" + 2 * a] },
        hints: ["Double means the same number twice.", "Add " + a + " and " + a + "."], explanation: "Double " + a + " is " + a + " + " + a + " = " + 2 * a + ".", concepts: ["add"] }; },
    tens(rand) { const t = int(rand, 1, 4), o = int(rand, 1, 9), n = t * 10 + o; const askOnes = rand() < 0.5; const ans = askOnes ? o : t;
      return { cid: "tens:" + n + (askOnes ? "o" : "t"), topic: "tens", instruction: n + " is " + (askOnes ? t + " " + (t === 1 ? "ten" : "tens") + " and how many ones?" : "how many tens and " + o + " ones?"), visual: { kind: "equation", text: String(n) },
        options: numOpts(shuffle(Array.from(new Set([ans, o, t, ans + 1].filter(v => v >= 0))).slice(0, 3), rand)), rule: { type: "one", valid: ["n" + ans] },
        hints: ["The first digit tells the tens; the last digit tells the ones.", "In " + n + ", the " + t + " is tens and the " + o + " is ones."], explanation: n + " = " + t + " " + (t === 1 ? "ten" : "tens") + " and " + o + " ones.", concepts: ["place-value"] }; },
    seq(rand, rules) { const r = pick(rules, rand); const seq = []; let v = r.start(rand); for (let i = 0; i < 5; i++) { seq.push(v); v = r.next(v); } const ans = seq[4];
      return { cid: "seq:" + r.id + ":" + seq[0], topic: "seq", instruction: "What number comes next?", visual: { kind: "numberline", items: seq.slice(0, 4).map(String).concat(["?"]) },
        options: numOpts(nearNumbers(ans, rand, 4, r.spread || 3)), rule: { type: "one", valid: ["n" + ans] }, hints: ["Compare each number with the one before it. What changes?", r.rule + "."], explanation: r.rule + ", so " + seq.slice(0, 4).join(", ") + ", " + ans + ".", concepts: ["sequence"] }; },
    greater(rand) { let a, b; do { a = int(rand, 3, 40); b = int(rand, 3, 40); } while (a === b);
      return { cid: "gt:" + Math.min(a, b) + "," + Math.max(a, b), topic: "compare", instruction: "Which number is greater?", visual: null, options: numOpts([a, b]), rule: { type: "one", valid: ["n" + Math.max(a, b)] },
        hints: ["Imagine counting up from 1. Which number do you reach later?", "Look at the tens first, then the ones."], explanation: Math.max(a, b) + " is greater than " + Math.min(a, b) + ".", concepts: ["compare"] }; },
    sub(rand) { const a = int(rand, 9, 20), b = int(rand, 2, Math.min(9, a - 2)), d = a - b;
      return { cid: "sub:" + a + "-" + b, topic: "sub", instruction: "What is " + a + " − " + b + "?", visual: { kind: "equation", text: a + " − " + b + " = ?" }, options: numOpts(nearNumbers(d, rand, 4)), rule: { type: "one", valid: ["n" + d] },
        hints: ["Start at " + a + " and count back " + b + ".", "Or think: " + b + " + ? = " + a + "."], explanation: a + " − " + b + " = " + d + ".", concepts: ["subtract"] }; },
    missing(rand) { const a = int(rand, 3, 9), t = int(rand, a + 2, Math.min(18, a + 9)), m = t - a;
      return { cid: "miss:" + a + "+?=" + t, topic: "missing", instruction: "Which number is missing?", visual: { kind: "equation", text: a + " + ? = " + t }, options: numOpts(nearNumbers(m, rand, 4)), rule: { type: "one", valid: ["n" + m] },
        hints: ["Start at " + a + ". How many more steps to reach " + t + "?", "Count up from " + a + " to " + t + " on your fingers."], explanation: a + " + " + m + " = " + t + ".", concepts: ["missing", "add"] }; },
    missingSub(rand) { const a = int(rand, 10, 18), m = int(rand, 2, 8), c = a - m;
      return { cid: "msub:" + a + "-?=" + c, topic: "missing", instruction: "Which number is missing?", visual: { kind: "equation", text: a + " − ? = " + c }, options: numOpts(nearNumbers(m, rand, 4)), rule: { type: "one", valid: ["n" + m] },
        hints: ["How far is it from " + c + " up to " + a + "?", "Count up from " + c + " to " + a + "."], explanation: a + " − " + m + " = " + c + ".", concepts: ["missing", "subtract"] }; },
    twoStep(rand) { const a = int(rand, 4, 9), b = int(rand, 2, 6), c = int(rand, 1, Math.min(6, a + b - 1)), r = a + b - c;
      return { cid: "two:" + a + "+" + b + "-" + c, topic: "two", instruction: "What is " + a + " + " + b + " − " + c + "?", visual: { kind: "equation", text: a + " + " + b + " − " + c + " = ?" }, options: numOpts(nearNumbers(r, rand, 4)), rule: { type: "one", valid: ["n" + r] },
        hints: ["Work left to right: first " + a + " + " + b + ".", a + " + " + b + " = " + (a + b) + ". Now take away " + c + "."], explanation: a + " + " + b + " = " + (a + b) + ", and " + (a + b) + " − " + c + " = " + r + ".", concepts: ["add", "subtract"] }; },
    word(rand) { const a = int(rand, 7, 14), b = int(rand, 2, 6); const k = int(rand, 0, WORD_PROBLEMS.length - 1); const w = WORD_PROBLEMS[k](a, b);
      return { cid: "wp:" + k + ":" + a + "," + b, topic: "word", instruction: w.text, visual: null, options: numOpts(nearNumbers(w.ans, rand, 4)), rule: { type: "one", valid: ["n" + w.ans] },
        hints: [w.op === "+" ? "Are the groups being put together or taken apart? Together means add." : "Something is taken away, so the number gets smaller.", "Work out " + a + " " + w.op + " " + b + "."], explanation: a + " " + w.op + " " + b + " = " + w.ans + ".", concepts: [w.c] }; },
    sums(rand) { let a, b, c, d; do { a = int(rand, 2, 9); b = int(rand, 1, 9); c = int(rand, 2, 9); d = int(rand, 1, 9); } while (a + b === c + d || Math.abs(a + b - (c + d)) > 3);
      const left = a + " + " + b, right = c + " + " + d;
      return { cid: "sums:" + [Math.min(a, b) + "+" + Math.max(a, b), Math.min(c, d) + "+" + Math.max(c, d)].sort().join("|"), topic: "sums", instruction: "Which is more?", visual: null,
        options: [{ id: "left", text: left, label: left }, { id: "right", text: right, label: right }], rule: { type: "one", valid: [a + b > c + d ? "left" : "right"] },
        hints: ["Work out each sum first, then compare.", left + " = " + (a + b) + ". Now work out " + right + "."], explanation: left + " = " + (a + b) + " and " + right + " = " + (c + d) + ".", concepts: ["add", "compare"] }; }
  };
  const WORD_PROBLEMS = [
    (a, b) => ({ text: "Juno has " + a + " berries and finds " + b + " more. How many berries does Juno have now?", ans: a + b, op: "+", c: "add" }),
    (a, b) => ({ text: "Moss has " + a + " acorns and gives " + b + " to a friend. How many acorns are left?", ans: a - b, op: "−", c: "subtract" }),
    (a, b) => ({ text: "There are " + a + " ducks on the pond. " + b + " fly away. How many ducks are still there?", ans: a - b, op: "−", c: "subtract" }),
    (a, b) => ({ text: "Pip plants " + a + " seeds in one row and " + b + " in another. How many seeds in all?", ans: a + b, op: "+", c: "add" }),
    (a, b) => ({ text: "A tree has " + a + " apples. " + b + " fall off. How many apples are still on the tree?", ans: a - b, op: "−", c: "subtract" }),
    (a, b) => ({ text: "Ruby sees " + a + " bees and then " + b + " more bees. How many bees does Ruby see?", ans: a + b, op: "+", c: "add" }),
    (a, b) => ({ text: "There were " + a + " muffins. The class ate " + b + ". How many muffins are left?", ans: a - b, op: "−", c: "subtract" }),
    (a, b) => ({ text: "Toby builds a tower of " + a + " blocks and adds " + b + " more. How tall is it now, in blocks?", ans: a + b, op: "+", c: "add" })
  ];
  const SEQ_EASY = [
    { id: "p1", start: (r) => int(r, 1, 12), next: (v) => v + 1, rule: "Each number is 1 more than the one before" },
    { id: "p2", start: (r) => 2 * int(r, 1, 6), next: (v) => v + 2, rule: "Each number is 2 more than the one before", spread: 2 },
    { id: "p10", start: (r) => 10 * int(r, 1, 3), next: (v) => v + 10, rule: "Each number is 10 more than the one before", spread: 5 },
    { id: "m1", start: (r) => int(r, 8, 15), next: (v) => v - 1, rule: "Each number is 1 less than the one before" }
  ];
  const SEQ_HARD = [
    { id: "p5", start: (r) => 5 * int(r, 1, 4), next: (v) => v + 5, rule: "Each number is 5 more than the one before", spread: 5 },
    { id: "p3", start: (r) => int(r, 1, 8), next: (v) => v + 3, rule: "Each number is 3 more than the one before" },
    { id: "m2", start: (r) => int(r, 18, 26), next: (v) => v - 2, rule: "Each number is 2 less than the one before", spread: 2 },
    { id: "x2", start: (r) => int(r, 1, 3), next: (v) => v * 2, rule: "Each number is double the one before", spread: 4 },
    { id: "p4", start: (r) => int(r, 1, 6), next: (v) => v + 4, rule: "Each number is 4 more than the one before" },
    { id: "m5", start: (r) => 5 * int(r, 6, 9), next: (v) => v - 5, rule: "Each number is 5 less than the one before", spread: 5 }
  ];
  function buildNumberQuestions(mode, ctx) {
    let makers, n;
    if (mode === "explore") { makers = [Q.count, Q.more, Q.oneMore]; n = 4; }
    else if (mode === "practice") { makers = [Q.addPics, (r) => Q.seq(r, SEQ_EASY), Q.greater, Q.add20, Q.double, Q.tens]; n = 5; }
    else { makers = [Q.sub, Q.missing, (r) => Q.seq(r, SEQ_HARD), Q.word, Q.sums, Q.twoStep, Q.missingSub]; n = 6; }
    const make = (rand) => makers[int(rand, 0, makers.length - 1)](rand);
    return ctx.generate(make, n, { spread: true, tries: 16 }).map(p => Object.assign({ id: pid("num"), mechanic: "choose", graded: true, cids: [p.cid] }, p, { say: p.instruction, seen: p.concepts.slice() }));
  }

  // --- Fair Shares (new): sharing, equal groups, arrays, halves, everyday amounts, multi-step stories.
  const SHARE = {
    share(rand, maxEach) { const k = int(rand, 2, 3), each = int(rand, 1, maxEach || 4), t = k * each;
      return { cid: "share:" + t + "/" + k, topic: "share", instruction: "Share " + t + " berries equally between " + k + " friends. How many does each friend get?", visual: { kind: "dots", groups: [{ n: t, art: "berry" }] },
        options: numOpts(nearNumbers(each, rand, 3, 2).filter(v => v > 0)), rule: { type: "one", valid: ["n" + each] },
        hints: ["Deal the berries out one at a time: one for each friend, then again.", t + " shared by " + k + " is the number that, added " + k + " times, makes " + t + "."], explanation: t + " shared equally by " + k + " is " + each + " each.", concepts: ["share"] }; },
    pairs(rand) { const p = int(rand, 2, 7), t = 2 * p;
      return { cid: "pairs:" + t, topic: "pairs", instruction: "Here are " + t + " socks. How many pairs can you make?", visual: { kind: "dots", groups: [{ n: t, art: "mittens" }] },
        options: numOpts(nearNumbers(p, rand, 3, 2).filter(v => v > 0)), rule: { type: "one", valid: ["n" + p] }, hints: ["A pair is 2. Circle them two at a time.", "Count by twos up to " + t + "."], explanation: t + " socks make " + p + " pairs.", concepts: ["groups"] }; },
    groups(rand) { const k = int(rand, 2, 5), g = int(rand, 2, 5), t = k * g;
      return { cid: "groups:" + t + "/" + k, topic: "groups", instruction: "How many groups of " + k + " can you make from " + t + " berries?", visual: { kind: "dots", groups: [{ n: t, art: "berry" }] },
        options: numOpts(nearNumbers(g, rand, 4, 2).filter(v => v > 0)), rule: { type: "one", valid: ["n" + g] }, hints: ["Count by " + k + "s until you reach " + t + ".", "Each count of " + k + " is one group."], explanation: t + " makes " + g + " groups of " + k + ".", concepts: ["groups"] }; },
    array(rand) { const r = int(rand, 2, 5), c = int(rand, 2, 5);
      return { cid: "array:" + r + "x" + c, topic: "array", instruction: r + " rows of " + c + " berries. How many berries in all?", visual: { kind: "rows", rows: r, cols: c, art: "berry" },
        options: numOpts(nearNumbers(r * c, rand, 4)), rule: { type: "one", valid: ["n" + r * c] }, hints: ["Count one row, then count by that number for each row.", "Count by " + c + "s, " + r + " times."], explanation: r + " rows of " + c + " make " + r * c + ".", concepts: ["groups"] }; },
    half(rand) { const h = int(rand, 2, 10), t = 2 * h;
      return { cid: "half:" + t, topic: "half", instruction: "What is half of " + t + "?", visual: { kind: "dots", groups: [{ n: t, art: "berry" }] },
        options: numOpts(nearNumbers(h, rand, 4, 2).filter(v => v > 0)), rule: { type: "one", valid: ["n" + h] }, hints: ["Half means 2 equal parts.", "Which number added to itself makes " + t + "?"], explanation: "Half of " + t + " is " + h + ", because " + h + " + " + h + " = " + t + ".", concepts: ["share"] }; },
    remainder(rand) { const k = int(rand, 3, 5), each = int(rand, 2, 4), r = int(rand, 1, k - 1), t = k * each + r;
      return { cid: "rem:" + t + "/" + k, topic: "remainder", instruction: "Share " + t + " berries equally among " + k + " friends. How many berries are left over?", visual: { kind: "dots", groups: [{ n: t, art: "berry" }] },
        options: numOpts(shuffle(Array.from(new Set([r, each, r + 1, Math.max(0, r - 1)])).slice(0, 4), rand)), rule: { type: "one", valid: ["n" + r] },
        hints: ["Give each friend the same number, as many as you can.", "Each friend gets " + each + ". That uses " + k * each + "."], explanation: k + " friends × " + each + " = " + k * each + ", so " + r + " " + (r === 1 ? "is" : "are") + " left over.", concepts: ["share"] }; },
    third(rand) { const e = int(rand, 2, 5), t = 3 * e;
      return { cid: "third:" + t, topic: "third", instruction: "What is one third of " + t + "?", visual: { kind: "dots", groups: [{ n: t, art: "berry" }] }, options: numOpts(nearNumbers(e, rand, 4, 2).filter(v => v > 0)), rule: { type: "one", valid: ["n" + e] },
        hints: ["A third means 3 equal parts.", "Share " + t + " into 3 equal groups."], explanation: "One third of " + t + " is " + e + ".", concepts: ["share"] }; }
  };
  const compareItem = (a) => ({ cid: "amt:" + a.id, topic: "amount", instruction: a.q, visual: null, options: a.opts.map((t, i) => ({ id: "o" + i + "-" + a.id, text: cap(t), label: cap(t) })),
    rule: { type: "one", valid: ["o" + a.opts.indexOf(a.ans) + "-" + a.id] }, hints: ["Picture both things side by side.", "Think about which one is bigger, heavier, or lasts longer."], explanation: a.why, concepts: ["measure"] });
  const storyItem = (s, rand) => ({ cid: "story:" + s.id, topic: "story", instruction: s.q, visual: null, options: numOpts(nearNumbers(s.ans, rand, 4), s.unit), rule: { type: "one", valid: ["n" + s.ans] },
    hints: ["Read the story again. What happens first?", s.hint], explanation: s.why, concepts: [s.c] });
  const STORY_EASY = ["duck-legs", "half-stickers", "older-moss", "cake-slices", "two-weeks", "apple-coins", "muffin-plates", "clock-later", "pairs-socks"];
  function buildFairShares(mode, ctx) {
    const rand = ctx.rand;
    let parts;
    if (mode === "explore") {
      parts = ctx.pick(B.COMPARE_AMOUNTS.map(compareItem), 2).concat(ctx.generate((r) => (r() < 0.5 ? SHARE.share(r, 4) : SHARE.pairs(r)), 2, { spread: true }));
    } else if (mode === "practice") {
      parts = ctx.generate((r) => pick([SHARE.groups, SHARE.array, SHARE.half, SHARE.share], r)(r), 3, { spread: true })
        .concat(ctx.pick(B.STORY_PROBLEMS.filter(s => STORY_EASY.includes(s.id)).map(s => storyItem(s, rand)), 2));
    } else {
      parts = ctx.pick(B.STORY_PROBLEMS.filter(s => !STORY_EASY.includes(s.id)).map(s => storyItem(s, rand)), 3)
        .concat(ctx.generate((r) => pick([SHARE.remainder, SHARE.third, SHARE.array], r)(r), 2, { spread: true }));
    }
    return shuffle(parts, rand).map(p => Object.assign({ id: pid("share"), mechanic: "choose", graded: true, cids: [p.cid] }, p, { say: p.instruction, seen: p.concepts.slice() }));
  }

  // ====================================================================== PATTERN PLAYGROUND
  function distinctPieces(n, rand) { const shapes = sample(BASIC_SHAPES, n, rand), colors = sample(COLOR_IDS, n, rand); return shapes.map((s, i) => piece(colors[i], s)); }
  const pOpt = (p) => ({ id: p.id, shape: { shape: p.shape, color: p.color }, label: p.label });
  function patternFrom(parts, unit, len, blankAt, rand, rule) {
    const seq = []; for (let i = 0; i < len; i++) seq.push(parts[unit[i % unit.length]]);
    const at = blankAt == null ? len - 1 : blankAt, ans = seq[at];
    const others = parts.filter(p => p.id !== ans.id);
    const extraColor = pick(COLOR_IDS.filter(c => !parts.some(p => p.color === c)).concat(parts.length >= 5 ? [ans.color] : []), rand);
    const extraShape = pick(BASIC_SHAPES.filter(s => !parts.some(p => p.shape === s)), rand);
    const extra = piece(extraColor, extraShape);
    const opts = shuffle([ans].concat(others.slice(0, 2)).concat([extra]).filter((p, i, a) => a.findIndex(x => x.id === p.id) === i), rand);
    const unitNames = unit.map(i => parts[i].label);
    return { cid: "pat:" + rule, topic: rule.split("-")[0], instruction: blankAt == null ? "What comes next in the pattern?" : "What is missing from the pattern?",
      visual: { kind: "pattern", seq: seq.map((p, i) => (i === at ? null : { shape: p.shape, color: p.color, label: p.label })) },
      options: opts.map(pOpt), rule: { type: "one", valid: [ans.id] },
      hints: ["Say the pattern out loud: " + seq.slice(0, Math.min(4, at)).map(p => p.label).join(", ") + "…", "The part that repeats is: " + unitNames.join(", ") + "."],
      explanation: "The pattern repeats " + unitNames.join(", ") + ", so it's the " + ans.label + ".", concepts: ["patterns", ans.shape].filter(c => CONCEPT[c]) };
  }
  const PAT = {
    "ab": (r) => patternFrom(distinctPieces(2, r), [0, 1], 6, null, r, "ab"),
    "ab-color": (r) => { const s = pick(BASIC_SHAPES, r), cs = sample(COLOR_IDS, 2, r); return patternFrom(cs.map(c => piece(c, s)), [0, 1], 6, null, r, "ab-color"); },
    "ab-shape": (r) => { const c = pick(COLOR_IDS, r), ss = sample(BASIC_SHAPES, 2, r); return patternFrom(ss.map(s => piece(c, s)), [0, 1], 6, null, r, "ab-shape"); },
    "ab-gap": (r) => patternFrom(distinctPieces(2, r), [0, 1], 6, 3, r, "ab-gap"),
    "abb-easy": (r) => patternFrom(distinctPieces(2, r), [0, 1, 1], 7, null, r, "abb-easy"),
    "aab-easy": (r) => patternFrom(distinctPieces(2, r), [0, 0, 1], 7, null, r, "aab-easy"),
    "abb": (r) => patternFrom(distinctPieces(2, r), [0, 1, 1], 7, null, r, "abb"),
    "aab": (r) => patternFrom(distinctPieces(2, r), [0, 0, 1], 7, null, r, "aab"),
    "abc": (r) => patternFrom(distinctPieces(3, r), [0, 1, 2], 7, null, r, "abc"),
    "abc-gap": (r) => patternFrom(distinctPieces(3, r), [0, 1, 2], 7, 4, r, "abc-gap"),
    "aabb": (r) => patternFrom(distinctPieces(2, r), [0, 0, 1, 1], 8, null, r, "aabb"),
    "aabb-gap": (r) => patternFrom(distinctPieces(2, r), [0, 0, 1, 1], 8, 5, r, "aabb-gap"),
    "abc-color": (r) => { const s = pick(BASIC_SHAPES, r), cs = sample(COLOR_IDS, 3, r); return patternFrom(cs.map(c => piece(c, s)), [0, 1, 2], 7, null, r, "abc-color"); },
    "abcd": (r) => patternFrom(distinctPieces(4, r), [0, 1, 2, 3], 8, null, r, "abcd"),
    "abcb": (r) => patternFrom(distinctPieces(3, r), [0, 1, 2, 1], 8, null, r, "abcb"),
    "abac": (r) => patternFrom(distinctPieces(3, r), [0, 1, 0, 2], 8, null, r, "abac"),
    "abcd-gap": (r) => patternFrom(distinctPieces(4, r), [0, 1, 2, 3], 8, 5, r, "abcd-gap"),
    "ab-first": (r) => patternFrom(distinctPieces(2, r), [0, 1], 6, 0, r, "ab-first"),
    "abc-color-easy": (r) => { const s = pick(BASIC_SHAPES, r), cs = sample(COLOR_IDS, 3, r); return patternFrom(cs.map(c => piece(c, s)), [0, 1, 2], 7, null, r, "abc-color-easy"); },
    "abb-gap": (r) => patternFrom(distinctPieces(2, r), [0, 1, 1], 7, 4, r, "abb-gap"),
    "aab-gap": (r) => patternFrom(distinctPieces(2, r), [0, 0, 1], 7, 3, r, "aab-gap"),
    "abc-shape": (r) => { const c = pick(COLOR_IDS, r), ss = sample(BASIC_SHAPES, 3, r); return patternFrom(ss.map(x => piece(c, x)), [0, 1, 2], 7, null, r, "abc-shape"); },
    "abba": (r) => patternFrom(distinctPieces(2, r), [0, 1, 1, 0], 8, null, r, "abba"),
    "aabc": (r) => patternFrom(distinctPieces(3, r), [0, 0, 1, 2], 8, null, r, "aabc"),
    "abcc": (r) => patternFrom(distinctPieces(3, r), [0, 1, 2, 2], 8, null, r, "abcc"),
    "abcd-gap2": (r) => patternFrom(distinctPieces(4, r), [0, 1, 2, 3], 8, 2, r, "abcd-gap2"),
    "two-way": (r) => {
      const S = sample(BASIC_SHAPES, 2, r), Cc = sample(COLOR_IDS, 3, r); const seq = []; for (let i = 0; i < 6; i++) seq.push(piece(Cc[i % 3], S[i % 2]));
      const ans = piece(Cc[0], S[0]); const opts = [ans, piece(Cc[1], S[0]), piece(Cc[0], S[1]), piece(Cc[2], S[1])];
      return { cid: "pat:two-way", topic: "two", instruction: "What comes next? Watch the shapes and the colors.", visual: { kind: "pattern", seq: seq.map(p => ({ shape: p.shape, color: p.color, label: p.label })).concat([null]) },
        options: shuffle(opts, r).map(pOpt), rule: { type: "one", valid: [ans.id] }, hints: ["Two things are changing. Follow the shapes first, then the colors.", "Shapes repeat every 2. Colors repeat every 3."],
        explanation: "Shapes go " + S.map(s => SHAPES[s].name).join(", ") + " and colors go " + Cc.map(c => COLORS[c].name).join(", ") + " — so a " + ans.label + ".", concepts: ["patterns", ans.shape] };
    },
    "odd-shape": (r) => { const [a, b] = sample(BASIC_SHAPES, 2, r), c = pick(COLOR_IDS, r);
      const items = [0, 1, 2].map(i => ({ id: "same-" + i, p: piece(c, a) })).concat([{ id: "odd", p: piece(c, b) }]);
      return oddPrompt("odd-shape", items, r, "These are all " + COLORS[c].name + ". Look at the shapes.", "Three are " + SHAPES[a].name + "s.", "The " + items[3].p.label + " is the only " + SHAPES[b].name + ".", ["odd", b]); },
    "odd-color-easy": (r) => { const s = pick(BASIC_SHAPES, r), [c1, c2] = sample(COLOR_IDS, 2, r);
      const items = [0, 1, 2].map(i => ({ id: "same-" + i, p: piece(c1, s) })).concat([{ id: "odd", p: piece(c2, s) }]);
      return oddPrompt("odd-color-easy", items, r, "These are all " + SHAPES[s].name + "s. Look at the colors.", "Three are " + COLORS[c1].name + ".", "The " + items[3].p.label + " is the only " + COLORS[c2].name + " one.", ["odd", "colors"]); },
    "odd-color": (r) => { const shapes = sample(BASIC_SHAPES, 4, r), [c1, c2] = sample(COLOR_IDS, 2, r);
      const items = shapes.slice(0, 3).map((s, i) => ({ id: "same-" + i, p: piece(c1, s) })).concat([{ id: "odd", p: piece(c2, shapes[3]) }]);
      return oddPrompt("odd-color", items, r, "Every shape is different, so shape isn't the rule. What else could it be?", "Three are " + COLORS[c1].name + ".", "The " + items[3].p.label + " is the only one that isn't " + COLORS[c1].name + ".", ["odd", "colors"]); },
    "odd-curve": (r) => { const straight = sample(["square", "triangle", "diamond", "star"], 3, r), colors = sample(COLOR_IDS, 4, r);
      const items = straight.map((s, i) => ({ id: "same-" + i, p: piece(colors[i], s) })).concat([{ id: "odd", p: piece(colors[3], "circle") }]);
      return oddPrompt("odd-curve", items, r, "Colors are all different. Look at the edges: straight or curved?", "Three have only straight edges.", "The circle is the only shape with a curved edge.", ["odd", "circle"]); },
    "odd-sides": (r) => { const four = sample(["square", "diamond", "rectangle"], 3, r), colors = sample(COLOR_IDS, 4, r);
      const items = four.map((s, i) => ({ id: "same-" + i, p: piece(colors[i], s) })).concat([{ id: "odd", p: piece(colors[3], "triangle") }]);
      return oddPrompt("odd-sides", items, r, "Count the straight sides of each shape.", "Three have 4 sides.", "The triangle is the only one with 3 sides; the others have 4.", ["odd", "triangle"]); },
    "odd-many": (r) => { const pick3 = sample(["square", "diamond", "rectangle", "triangle"], 3, r), colors = sample(COLOR_IDS, 4, r); const odd = pick(["pentagon", "hexagon"], r);
      const items = pick3.map((s, i) => ({ id: "same-" + i, p: piece(colors[i], s) })).concat([{ id: "odd", p: piece(colors[3], odd) }]);
      return oddPrompt("odd-many", items, r, "Count the sides. Which has more than 4?", "Three have 3 or 4 sides.", "The " + SHAPES[odd].name + " has " + SHAPES[odd].sides + " sides — more than any of the others.", ["odd", odd]); }
  };
  function oddPrompt(rule, items, rand, h1, h2, expl, concepts) {
    return { cid: "pat:" + rule, topic: "odd", instruction: "Which one doesn't belong?", visual: null,
      options: shuffle(items, rand).map(it => ({ id: it.id, shape: { shape: it.p.shape, color: it.p.color }, label: it.p.label })), rule: { type: "one", valid: ["odd"] }, hints: [h1, h2], explanation: expl, concepts };
  }
  const PAT_MODES = {
    explore: ["ab", "ab-color", "ab-shape", "ab-gap", "abb-easy", "aab-easy", "odd-shape", "odd-color-easy", "ab-first", "abc-color-easy"],
    practice: ["abb", "aab", "abc", "abc-gap", "aabb", "abc-color", "odd-shape", "odd-color", "odd-curve", "ab-gap", "abb-gap", "aab-gap", "abc-shape", "abba"],
    challenge: ["two-way", "abcd", "abcb", "abac", "abcd-gap", "aabb-gap", "odd-color", "odd-curve", "odd-sides", "odd-many", "aabc", "abcc", "abcd-gap2"]
  };
  function buildPatternPath(mode, ctx) {
    const n = mode === "explore" ? 3 : 4;
    return ctx.pick(PAT_MODES[mode].map(r => ({ cid: "pat:" + r, topic: r.startsWith("odd") ? "odd" : "seq", r })), n, { spread: true })
      .map(c => { const p = PAT[c.r](ctx.rand); return Object.assign({ id: pid("pat"), mechanic: "choose", graded: true }, p, { cids: [c.cid], say: p.instruction, seen: p.concepts.slice() }); });
  }

  // Shape Sort: a bank of sorting rules.
  const SORT_RULES = {
    explore: [].concat(...["circle", "triangle", "square", "star", "heart"].map((a, i, arr) => arr.slice(i + 1).map(b => ({ id: "pair:" + a + "," + b, kind: "pair", shapes: [a, b] })))),
    practice: [].concat(
      ...["berry", "sky", "sun", "leaf", "plum"].map((a, i, arr) => arr.slice(i + 1).map((b, j) => arr.slice(i + j + 2).map(c => ({ id: "color:" + [a, b, c].join(","), kind: "color", colors: [a, b, c] })))).flat(),
      [{ id: "curve", kind: "curve" }, { id: "three-four", kind: "three-four" }]),
    challenge: [{ id: "sides-3-4-curved", kind: "sides34c" }, { id: "sides-4-5-6", kind: "sides456" }, { id: "equal-sides", kind: "equal" }, { id: "corners", kind: "corners" },
      { id: "sides-3-5-6", kind: "sides356" }, { id: "few-many", kind: "fewmany" }]
  };
  function sortPrompt(rule, mode, rand) {
    const make = (shape, color, bin, hint, explain) => { const p = piece(color, shape); return { shape: { shape, color }, label: p.label, bins: [bin], hint, explain: explain || SHAPES[shape].fact, concepts: CONCEPT[shape] ? [shape] : [] }; };
    let bins, items, instruction, hint;
    if (rule.kind === "pair") {
      const [a, b] = rule.shapes;
      bins = [a, b].map(s => ({ id: s, label: cap(SHAPES[s].name) + "s", shape: { shape: s, color: "ink" } }));
      items = [0, 1, 2, 3].map(i => { const s = i % 2 ? b : a; return make(s, pick(COLOR_IDS, rand), s, "This is a " + SHAPES[s].name + ". Find the " + SHAPES[s].name + "s basket."); });
      instruction = "Sort by shape. Put each one in its basket."; hint = "Look only at the shape, not the color.";
    } else if (rule.kind === "color") {
      bins = rule.colors.map(c => ({ id: c, label: cap(COLORS[c].name), swatch: c }));
      items = [0, 1, 2, 3, 4].map(i => { const c = rule.colors[i % 3]; return make(pick(BASIC_SHAPES, rand), c, c, "This one is " + COLORS[c].name + ". Find the " + COLORS[c].name + " basket.", "It's " + COLORS[c].name + ", so it goes with the " + COLORS[c].name + " things."); });
      items.forEach(it => { it.concepts = ["colors"]; });
      instruction = "Sort by color. Shape doesn't matter this time."; hint = "Look only at the color.";
    } else if (rule.kind === "curve") {
      bins = [{ id: "straight", label: "Straight edges", shape: { shape: "square", color: "ink" } }, { id: "curved", label: "Curved edges", shape: { shape: "circle", color: "ink" } }];
      items = shuffle(["square", "triangle", "diamond", "circle", "heart", "oval"], rand).slice(0, 5).map(s => make(s, pick(COLOR_IDS, rand), SHAPES[s].curved ? "curved" : "straight", "Run your eyes around the edge of the " + SHAPES[s].name + ". Is any part round?"));
      instruction = "Sort by edges: straight or curved?"; hint = "Look at the edges, not the color.";
    } else if (rule.kind === "three-four") {
      bins = [{ id: "three", label: "3 sides", shape: { shape: "triangle", color: "ink" } }, { id: "four", label: "4 sides", shape: { shape: "square", color: "ink" } }];
      items = shuffle(["triangle", "triangle", "square", "diamond", "rectangle"], rand).map(s => make(s, pick(COLOR_IDS, rand), SHAPES[s].sides === 3 ? "three" : "four", "Count the straight sides of the " + SHAPES[s].name + "."));
      instruction = "Sort by counting the sides."; hint = "Count the straight sides.";
    } else if (rule.kind === "sides34c") {
      bins = [{ id: "three", label: "3 straight sides", shape: { shape: "triangle", color: "ink" } }, { id: "four", label: "4 straight sides", shape: { shape: "square", color: "ink" } }, { id: "curved", label: "Curved edges", shape: { shape: "circle", color: "ink" } }];
      items = shuffle(["triangle", "triangle", "square", "diamond", "rectangle", "circle", "heart", "oval"], rand).slice(0, 7).map(s => make(s, pick(COLOR_IDS, rand), SHAPES[s].curved ? "curved" : SHAPES[s].sides === 3 ? "three" : "four", SHAPES[s].curved ? "Look around the " + SHAPES[s].name + "'s edge. Is any part round?" : "Count the straight sides on the " + SHAPES[s].name + "."));
      instruction = "Sort by edges: count the straight sides."; hint = "Count the straight sides of each shape.";
    } else if (rule.kind === "sides456") {
      bins = [{ id: "four", label: "4 sides", shape: { shape: "square", color: "ink" } }, { id: "five", label: "5 sides", shape: { shape: "pentagon", color: "ink" } }, { id: "six", label: "6 sides", shape: { shape: "hexagon", color: "ink" } }];
      items = shuffle(["square", "diamond", "rectangle", "pentagon", "pentagon", "hexagon", "hexagon"], rand).map(s => make(s, pick(COLOR_IDS, rand), { 4: "four", 5: "five", 6: "six" }[SHAPES[s].sides], "Count the sides of the " + SHAPES[s].name + " carefully — touch each one."));
      instruction = "Sort by the number of sides: 4, 5, or 6."; hint = "Count slowly, touching each side.";
    } else if (rule.kind === "equal") {
      bins = [{ id: "equal", label: "All 4 sides equal", shape: { shape: "square", color: "ink" } }, { id: "long-short", label: "Long and short sides", shape: { shape: "rectangle", color: "ink" } }];
      items = shuffle(["square", "square", "diamond", "diamond", "rectangle", "rectangle"], rand).map(s => make(s, pick(COLOR_IDS, rand), SHAPES[s].equal ? "equal" : "long-short", "Compare the sides of the " + SHAPES[s].name + ": are they all the same length?"));
      instruction = "Sort the 4-sided shapes: are all sides equal?"; hint = "Compare each side's length.";
    } else if (rule.kind === "sides356") {
      bins = [{ id: "three", label: "3 sides", shape: { shape: "triangle", color: "ink" } }, { id: "five", label: "5 sides", shape: { shape: "pentagon", color: "ink" } }, { id: "six", label: "6 sides", shape: { shape: "hexagon", color: "ink" } }];
      items = shuffle(["triangle", "triangle", "pentagon", "pentagon", "hexagon", "hexagon"], rand).map(s => make(s, pick(COLOR_IDS, rand), { 3: "three", 5: "five", 6: "six" }[SHAPES[s].sides], "Count the sides of the " + SHAPES[s].name + " — touch each one."));
      instruction = "Sort by sides: 3, 5, or 6."; hint = "Count each side once, going around the shape.";
    } else if (rule.kind === "fewmany") {
      bins = [{ id: "curved", label: "Curved, no corners", shape: { shape: "oval", color: "ink" } }, { id: "upto4", label: "3 or 4 sides", shape: { shape: "square", color: "ink" } }, { id: "more4", label: "More than 4 sides", shape: { shape: "hexagon", color: "ink" } }];
      items = shuffle(["circle", "oval", "triangle", "rectangle", "diamond", "pentagon", "hexagon"], rand).map(s => make(s, pick(COLOR_IDS, rand), SHAPES[s].curved ? "curved" : SHAPES[s].sides <= 4 ? "upto4" : "more4", SHAPES[s].curved ? "Is the edge of the " + SHAPES[s].name + " curved?" : "Count the sides of the " + SHAPES[s].name + "."));
      instruction = "Sort: curved shapes, 3–4 sides, or more than 4 sides."; hint = "Check for curves first, then count sides.";
    } else {
      bins = [{ id: "none", label: "No corners", shape: { shape: "circle", color: "ink" } }, { id: "three", label: "3 corners", shape: { shape: "triangle", color: "ink" } }, { id: "more", label: "4 or more corners", shape: { shape: "hexagon", color: "ink" } }];
      items = shuffle(["circle", "oval", "triangle", "triangle", "square", "pentagon", "hexagon"], rand).map(s => make(s, pick(COLOR_IDS, rand), SHAPES[s].curved ? "none" : SHAPES[s].sides === 3 ? "three" : "more", "Count the pointy corners on the " + SHAPES[s].name + "."));
      instruction = "Sort by counting corners."; hint = "A corner is where two straight sides meet.";
    }
    items = items.map((it, i) => Object.assign({ id: "s" + i }, it));
    const concepts = Array.from(new Set(items.flatMap(i => i.concepts)));
    return { cid: "sort:" + rule.id, mechanic: "sort", graded: true, instruction, sortBy: rule.kind, bins, items, hints: [hint], explanation: "Everything is sorted by the rule.", concepts, seen: concepts };
  }
  function buildShapeSort(mode, ctx) {
    return ctx.pick(SORT_RULES[mode].map(r => ({ cid: "sort:" + r.id, topic: r.kind, r })), 2, { spread: true })
      .map(c => Object.assign({ id: pid("sort") }, sortPrompt(c.r, mode, ctx.rand), { cids: [c.cid] }));
  }

  // --- Mirror Match (new): symmetry, turning shapes, growing patterns.
  const bitsOf = (g) => g.map(r => r.join("")).join("/");
  const sameGrid = (a, b) => bitsOf(a) === bitsOf(b);
  function randomHalf(rand, w, h) {
    for (let t = 0; t < 200; t++) {
      const g = Array.from({ length: h }, () => Array.from({ length: w }, () => (rand() < 0.5 ? 1 : 0)));
      const on = g.flat().filter(Boolean).length;
      const selfMirror = g.every(r => r.join("") === r.slice().reverse().join(""));
      const vSym = g.every((r, i) => r.join("") === g[h - 1 - i].join(""));
      if (on >= 2 && on <= w * h - 1 && !selfMirror && !vSym && g.every(r => r.some(Boolean) || true)) return g;
    }
    return null;
  }
  function symmetryPrompt(rand, w, h, nOpts, axis) {
    const half = randomHalf(rand, w, h); if (!half) return null;
    let full, translated, flipped, offByOne;
    if (axis === "v") {
      full = half.map(r => r.concat(r.slice().reverse()));
      translated = half.map(r => r.concat(r));
      flipped = half.map((r, i) => r.concat(half[h - 1 - i].slice().reverse()));
    } else {
      full = half.concat(half.slice().reverse());
      translated = half.concat(half);
      flipped = half.concat(half.slice().reverse().map(r => r.slice().reverse()));
    }
    offByOne = full.map(r => r.slice());
    const rows = full.length, cols = full[0].length;
    const cells = []; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { if (axis === "v" ? x >= cols / 2 : y >= rows / 2) cells.push([x, y]); }
    const [fx, fy] = pick(cells, rand); offByOne[fy][fx] = offByOne[fy][fx] ? 0 : 1;
    const cand = [["correct", full], ["copied", translated], ["flipped", flipped], ["one-off", offByOne]];
    const uniq = []; cand.forEach(([k, g]) => { if (!uniq.some(u => sameGrid(u[1], g))) uniq.push([k, g]); });
    if (uniq[0][0] !== "correct" || uniq.length < nOpts) return null;
    const chosen = [uniq[0]].concat(shuffle(uniq.slice(1), rand).slice(0, nOpts - 1));
    const opts = shuffle(chosen, rand).map(([k, g], i) => ({ id: "m-" + k, cells: { grid: g, axis }, label: "Picture " + "ABCD"[i] }));
    // re-label in display order
    opts.forEach((o, i) => { o.label = "Picture " + "ABCD"[i]; });
    return { cid: "sym:" + axis + ":" + bitsOf(half), topic: "sym-" + axis, instruction: axis === "v" ? "Which picture finishes the mirror image across the dotted line?" : "Which picture finishes the mirror image below the dotted line?",
      visual: { kind: "cells", grid: half, axis, blankHalf: true }, options: opts, rule: { type: "one", valid: ["m-correct"] }, wide: true,
      hints: [axis === "v" ? "Imagine folding the picture along the dotted line. Each colored square lands on its partner." : "Imagine folding along the dotted line: the top row matches the bottom row.", axis === "v" ? "The square next to the line stays next to the line on the other side." : "Rows closest to the line match each other."],
      explanation: "A mirror image flips across the line, so each square is the same distance from the line on both sides.", concepts: ["symmetry"] };
  }
  const SHAPES4 = [[[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [1, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [0, 1]]];
  const norm = (cs) => { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return cs.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  const rot = (cs) => norm(cs.map(([x, y]) => [-y, x]));
  const mir = (cs) => norm(cs.map(([x, y]) => [-x, y]));
  const key = (cs) => JSON.stringify(norm(cs));
  const toGrid = (cs) => { const g = Array.from({ length: 3 }, () => [0, 0, 0]); norm(cs).forEach(([x, y]) => { g[y][x] = 1; }); return g; };
  function rotationPrompt(rand) {
    const si = int(rand, 0, SHAPES4.length - 1), base = norm(SHAPES4[si]);
    const rots = [base]; for (let i = 0; i < 3; i++) rots.push(rot(rots[rots.length - 1]));
    const rotKeys = new Set(rots.map(key));
    const m = mir(base);
    if (rotKeys.has(key(m))) return null;              // shape must look different in a mirror
    const turns = int(rand, 1, 3);
    const answer = rots[turns];
    if (key(answer) === key(base)) return null;
    let other = null;
    for (const s of shuffle(SHAPES4, rand)) { const n = norm(s); const all = [n]; for (let i = 0; i < 3; i++) all.push(rot(all[all.length - 1])); if (!all.some(a => rotKeys.has(key(a)) || key(a) === key(m))) { other = pick(all, rand); break; } }
    if (!other) return null;
    let mirrored = m; for (let i = 0; i < int(rand, 0, 3); i++) mirrored = rot(mirrored);
    const opts = shuffle([["turned", answer], ["mirror", mirrored], ["other", other]], rand).map(([k, cs], i) => ({ id: "r-" + k, cells: { grid: toGrid(cs) }, label: "Shape " + "ABC"[i] }));
    return { cid: "rot:" + si + ":" + turns, topic: "rot", instruction: "Which shape is the same as this one, just turned?", visual: { kind: "cells", grid: toGrid(base) }, options: opts, rule: { type: "one", valid: ["r-turned"] }, wide: true,
      hints: ["Turning keeps the shape the same; a mirror image flips it over.", "Imagine turning the page a quarter turn at a time."], explanation: "Turning a shape changes which way it faces, but a flipped (mirror) shape can't be made just by turning.", concepts: ["rotation"] };
  }
  const GROW = {
    p1: { start: [1, 2, 3], next: (s, i) => s + 1, rule: "Each step adds 1 more" }, p2: { start: [1, 2, 3], next: (s) => s + 2, rule: "Each step adds 2 more" },
    p3: { start: [1, 2], next: (s) => s + 3, rule: "Each step adds 3 more" }, sq: { fixed: [1, 4, 9, 16], rule: "The steps are square numbers: 1×1, 2×2, 3×3, 4×4" },
    tri: { fixed: [1, 3, 6, 10], rule: "Each step adds one more than last time: +2, +3, +4" }, dbl: { fixed: [1, 2, 4, 8], rule: "Each step doubles" }, p4: { start: [1, 2], next: (s) => s + 4, rule: "Each step adds 4 more" }
  };
  function growPrompt(rand, ids) {
    const id = pick(ids, rand), g = GROW[id];
    const seq = g.fixed ? g.fixed.slice() : (() => { const s0 = pick(g.start, rand); const a = [s0]; for (let i = 0; i < 3; i++) a.push(g.next(a[i], i)); return a; })();
    const ans = seq[3];
    return { cid: "grow:" + id + ":" + seq[0], topic: "grow", instruction: "This pattern grows. How many dots in the next step?", visual: { kind: "dots", groups: seq.slice(0, 3).map(n => ({ n, art: "dot-plum" })).concat([{ blank: true }]), op: "→" },
      options: numOpts(nearNumbers(ans, rand, 4, 2).filter(v => v > 0)), rule: { type: "one", valid: ["n" + ans] }, wide: true,
      hints: ["Count each step. How much does it grow each time?", g.rule + "."], explanation: g.rule + ", so the next step has " + ans + ".", concepts: ["growing"] };
  }
  function buildMirrorMatch(mode, ctx) {
    const n = mode === "explore" ? 3 : 4;
    const makers = mode === "explore" ? [(r) => symmetryPrompt(r, 2, 3, 3, "v"), (r) => growPrompt(r, ["p1", "p2"])]
      : mode === "practice" ? [(r) => symmetryPrompt(r, 2, 4, 4, "v"), (r) => growPrompt(r, ["p2", "p3", "p1"]), (r) => symmetryPrompt(r, 3, 2, 3, "h")]
        : [(r) => symmetryPrompt(r, 3, 4, 4, "v"), (r) => symmetryPrompt(r, 4, 2, 4, "h"), rotationPrompt, (r) => growPrompt(r, ["sq", "tri", "dbl", "p4"])];
    return ctx.generate((r) => makers[int(r, 0, makers.length - 1)](r), n, { spread: true, tries: 20 })
      .map(p => Object.assign({ id: pid("mirror"), mechanic: "choose", graded: true, cids: [p.cid] }, p, { say: p.instruction, seen: p.concepts.slice() }));
  }

  // ====================================================================== NATURE TRAIL
  function buildHabitatHomes(mode, ctx) {
    const rand = ctx.rand;
    const nItems = { explore: 4, practice: 5, challenge: 6 }[mode];
    // an animal that fits every shown home would make the sort a non-question
    const fits = (bins) => B.ANIMALS.filter(a => a.homes.some(h => bins.includes(h)) && !bins.every(h => a.homes.includes(h)));
    const setC = pickContainer(ctx, B.HABITAT_SETS[mode], "habset:", fits, a => "hab:" + a.id, nItems);
    const binIds = setC.s;
    const eligible = fits(binIds);
    const ordered = ctx.pick(eligible.map(a => ({ cid: "hab:" + a.id, topic: a.homes.find(h => binIds.includes(h)), a })), eligible.length, { spread: true });
    const chosen = [];
    // give each home a fresh animal where one exists (a home may stay empty rather than repeat an animal)
    binIds.forEach(b => { const c = ordered.find(o => !chosen.includes(o) && o.a.homes.includes(b) && ctx.isFresh(o.cid)); if (c) chosen.push(c); });
    ordered.forEach(o => { if (chosen.length < nItems && !chosen.includes(o)) chosen.push(o); });
    const items = shuffle(chosen, rand).map(({ a }) => {
      const valid = a.homes.filter(h => binIds.includes(h));
      return { id: a.id, art: a.id, label: a.name, bins: valid, hint: a.hint + (mode === "explore" ? " Which home has " + HABITAT[valid[0]].note + "?" : ""), explain: a.note, concepts: [a.id] };
    });
    return [{ id: pid("hab"), cids: [setC.cid].concat(chosen.map(c => c.cid)), mechanic: "sort", graded: true, sortBy: "habitat",
      instruction: "Help each animal find a home that suits it.", say: "Help each animal find a home that suits it. Some animals can live in more than one place.",
      bins: binIds.map(h => ({ id: h, art: "hab-" + h, label: HABITAT[h].name, note: HABITAT[h].note })), items,
      hints: ["Think about what each animal needs: water, trees, warmth, or cold?"],
      explanation: "Every animal has a home that suits it. Some can live in more than one kind of place.", concepts: chosen.map(c => c.a.id), seen: chosen.map(c => c.a.id).concat(binIds.map(h => "hab-" + h)) }];
  }

  function cyclePrompt(key, mode, rand, subset) {
    const c = B.CYCLES[key];
    const steps = subset ? c.steps.filter(s => subset.includes(s.v)) : c.steps;
    return graded({ id: pid("cyc"), mechanic: "sequence", kind: "steps",
      instruction: c.title + (c.cyclic ? " Start with any one." : " Start at the beginning."), say: c.title,
      tiles: shuffle(steps.map(s => ({ id: "c-" + s.v, value: s.v, art: s.v, label: s.label })), rand),
      slots: steps.length, answers: [steps.map(s => s.v)], cyclic: !!c.cyclic, fixed: c.cyclic ? [] : mode === "explore" ? [0] : [],
      stepHints: Object.fromEntries(steps.map(s => [s.v, s.hint])),
      hints: [c.cyclic ? "This repeats in a circle. Pick any card to start, then ask: what comes next?" : "What has to happen first?", steps.map(s => s.label).slice(0, 2).join(" comes before ") + "."],
      explanation: steps.map(s => s.label).join(" → ") + (c.cyclic ? " → and round again." : "."),
      concepts: [c.concept], seen: [c.concept].concat(steps.map(s => s.v).filter(v => ANIMAL[v])) });
  }
  const CYCLE_SETS = {
    explore: [["plant", ["seed", "sprout", "flower"]], ["plant", ["sprout", "flower", "fruit"]], ["butterfly", ["egg", "caterpillar", "butterfly"]], ["butterfly", ["caterpillar", "chrysalis", "butterfly"]],
      ["frog", ["frogspawn", "tadpole", "frog"]], ["frog", ["tadpole", "froglet", "frog"]], ["chicken", null], ["day", ["sunrise", "summer", "moon"]], ["ladybug", ["egg", "larva", "ladybug"]]],
    practice: [["butterfly", null], ["frog", null], ["plant", ["seed", "sprout", "flower", "fruit"]], ["chicken", null], ["seasons", null], ["day", null], ["ladybug", null], ["tree", null], ["appleyear", null]],
    challenge: [["plant", null], ["seasons", null], ["water", null], ["day", null], ["butterfly", null], ["frog", null], ["ladybug", null], ["appleyear", null], ["tree", null]]
  };
  function buildLifeCycles(mode, ctx) {
    const n = 3;
    return ctx.pick(CYCLE_SETS[mode].map(([k, sub]) => ({ cid: "cyc:" + k + ":" + (sub ? sub.join("-") : "all"), topic: k, k, sub })), n, { spread: true })
      .map(c => Object.assign(cyclePrompt(c.k, mode, ctx.rand, c.sub), { cids: [c.cid] }));
  }

  function buildNatureWalk(mode, ctx) {
    const rand = ctx.rand;
    if (mode === "explore") {
      const cards = ctx.pick(B.ANIMALS.map(a => ({ cid: "card:" + a.id, a })), 6);
      return [{ id: pid("walk"), cids: cards.map(c => c.cid), mechanic: "explore", graded: false, instruction: "Tap each animal to discover a fact.",
        cards: cards.map(({ a }) => ({ id: a.id, art: a.id, label: a.name, fact: a.fact })), hints: ["Tap any card. There's no wrong choice."], explanation: "You discovered six animal facts.", concepts: [], seen: [] }];
    }
    if (mode === "practice") {
      const cards = ctx.pick(B.ANIMALS.map(a => ({ cid: "recall:" + a.id, a })), 4).map(c => c.a);
      const walk = { id: pid("walk"), cids: [], mechanic: "explore", graded: false, instruction: "Tap each animal to read its fact. Questions come next!",
        cards: cards.map(a => ({ id: a.id, art: a.id, label: a.name, fact: a.fact })), hints: ["Read each fact — you'll use them in a moment."], explanation: "Now let's see what you remember.", concepts: [], seen: [] };
      const qs = sample(cards, 3, rand).map(a => {
        const opts = shuffle(cards, rand).slice(0, 3); if (!opts.includes(a)) opts[0] = a;
        return graded({ id: pid("walkq"), cids: ["recall:" + a.id], mechanic: "choose", instruction: "Which animal " + a.q + "?",
          options: shuffle(opts, rand).map(o => ({ id: o.id, art: o.id, label: cap(o.name) })), rule: { type: "one", valid: [a.id] },
          hints: ["Think back to the facts you just read.", "This animal's fact: " + a.fact.replace(new RegExp("^(An? |The )?" + a.name, "i"), "It")],
          explanation: a.fact, concepts: [a.id], seen: [a.id] });
      });
      return [walk].concat(qs);
    }
    return ctx.pick(B.ANIMALS.map(a => ({ cid: "riddle:" + a.id, a })), 5).map(({ cid, a }) => {
      const others = sample(B.ANIMALS.filter(o => o.id !== a.id), 3, rand);
      return graded({ id: pid("riddle"), cids: [cid], mechanic: "choose", instruction: "Who am I? “" + a.riddle + "”", say: "Who am I? " + a.riddle,
        options: shuffle([a].concat(others), rand).map(o => ({ id: o.id, art: o.id, label: cap(o.name) })), rule: { type: "one", valid: [a.id] },
        wrongHints: Object.fromEntries(others.map(o => [o.id, cap(o.name) + ": " + o.fact + " Read the riddle again."])),
        hints: ["Pick out the most unusual clue in the riddle.", "Clue: " + a.fact], explanation: "It's the " + a.name + ". " + a.fact, concepts: [a.id], seen: [a.id] });
    });
  }

  // --- Food Chains (new): living vs not living, ordering food chains, reasoning questions.
  const LIVING = Object.fromEntries(B.LIVING.map(x => [x.id, x]));
  function livingSort(ctx, n) {
    const live = ctx.pick(B.LIVING.filter(x => x.living).map(x => ({ cid: "liv:" + x.id, x })), Math.ceil(n / 2));
    const not = ctx.pick(B.LIVING.filter(x => !x.living).map(x => ({ cid: "liv:" + x.id, x })), Math.floor(n / 2));
    const all = live.concat(not);
    return { id: pid("liv"), cids: all.map(c => c.cid), mechanic: "sort", graded: true, sortBy: "living", instruction: "Sort: living things, and things that are not alive.",
      bins: [{ id: "living", label: "Living", note: "grows, needs food and water", art: "tree" }, { id: "not", label: "Not living", note: "doesn't grow or eat", art: "rock" }],
      items: shuffle(all, ctx.rand).map(({ x }) => ({ id: x.id, art: x.id, label: x.label, bins: [x.living ? "living" : "not"],
        hint: x.living ? "Does a " + x.label + " grow and need food or water?" : "Does a " + x.label + " grow, eat, or have young?",
        explain: x.living ? "A " + x.label + " is alive: it grows and needs water and food." : "A " + x.label + " isn't alive: it doesn't grow, eat, or have young.", concepts: ["living-things"] })),
      hints: ["Living things grow, need food and water, and have young."], explanation: "All sorted: living things grow and need food; the others don't.", concepts: ["living-things"], seen: ["living-things"] };
  }
  function chainPrompt(ch, mode, rand) {
    return graded({ id: pid("chain"), cids: ["chain:" + ch.id], mechanic: "sequence", kind: "steps",
      instruction: "Order the food chain. Start with the plant; each next one eats the one before.", say: "Order the food chain. Start with the plant. Each next one eats the one before.",
      tiles: shuffle(ch.links.map((v, i) => ({ id: "f-" + v, value: v, art: v, label: ch.labels[i] })), rand), slots: ch.links.length, answers: [ch.links.slice()], fixed: mode === "practice" ? [0] : [],
      stepHints: Object.fromEntries(ch.links.map((v, i) => [v, i === 0 ? "The " + ch.labels[0] + " is a plant (or plant part) — food chains start with plants." : "The " + ch.labels[i] + " eats the " + ch.labels[i - 1] + "."])),
      hints: ["Start with the plant. Then ask: who eats it?", "The " + ch.labels[1] + " eats the " + ch.labels[0] + "."], explanation: ch.labels.join(" → ") + ". Each arrow means “is eaten by”.",
      concepts: ["food-chains"].concat(ch.links.filter(v => ANIMAL[v])), seen: ["food-chains"].concat(ch.links.filter(v => ANIMAL[v])) });
  }
  function natureQuestion(q, rand) {
    const multi = !!q.all;
    return graded({ id: pid("nq"), cids: ["nq:" + q.id], mechanic: "choose", instruction: q.q,
      options: shuffle(q.opts, rand).map(o => ({ id: o, art: o, label: cap((q.labels && q.labels[o]) || (ANIMAL[o] ? ANIMAL[o].name : (LIVING[o] && LIVING[o].label) || o)) })),
      rule: multi ? { type: "all", valid: q.valid.slice() } : { type: "one", valid: q.valid.slice() }, wrongHints: q.wrong || {},
      hints: [multi ? "There's more than one answer. Check each picture." : "Think about what each one eats or needs.", q.why], explanation: q.why,
      concepts: q.id === "plants-need" || q.id === "sunlight-food" ? ["plants-need"] : q.id.includes("living") || q.id === "producer" ? ["living-things"] : ["food-chains"], seen: ["food-chains"] });
  }
  function buildFoodChains(mode, ctx) {
    const rand = ctx.rand;
    const Qs = (n) => ctx.pick(B.NATURE_QUESTIONS.filter(q => q.m.includes(mode)).map(q => ({ cid: "nq:" + q.id, q })), n).map(c => natureQuestion(c.q, rand));
    if (mode === "explore") return [livingSort(ctx, 4)].concat(Qs(2));
    if (mode === "practice") {
      const ch = ctx.pick(B.CHAINS.filter(c => c.links.length === 3).map(c => ({ cid: "chain:" + c.id, c })), 2).map(x => chainPrompt(x.c, mode, rand));
      return ch.concat(Qs(2));
    }
    const ch = ctx.pick(B.CHAINS.filter(c => c.links.length === 4).map(c => ({ cid: "chain:" + c.id, c })), 2).map(x => chainPrompt(x.c, mode, rand));
    return ch.concat(Qs(1), [livingSort(ctx, 6)]);
  }

  // ====================================================================== LOGIC LAB
  const ORIGINAL_LEVELS = {
    explore: [{ w: 4, h: 4, start: { x: 0, y: 1 }, goal: { x: 3, y: 1 }, rocks: [] }, { w: 4, h: 4, start: { x: 1, y: 0 }, goal: { x: 1, y: 3 }, rocks: [] }, { w: 4, h: 4, start: { x: 0, y: 3 }, goal: { x: 2, y: 1 }, rocks: [] }, { w: 4, h: 4, start: { x: 3, y: 0 }, goal: { x: 1, y: 2 }, rocks: [] }],
    practice: [{ w: 5, h: 5, start: { x: 0, y: 2 }, goal: { x: 4, y: 2 }, rocks: [[2, 2]] }, { w: 5, h: 5, start: { x: 0, y: 0 }, goal: { x: 4, y: 4 }, rocks: [[1, 1], [2, 2], [3, 3]] }, { w: 5, h: 5, start: { x: 2, y: 4 }, goal: { x: 2, y: 0 }, rocks: [[1, 2], [2, 2], [3, 2]] }, { w: 5, h: 5, start: { x: 0, y: 4 }, goal: { x: 4, y: 0 }, rocks: [[1, 3], [2, 2], [3, 1]] }, { w: 5, h: 5, start: { x: 4, y: 4 }, goal: { x: 0, y: 1 }, rocks: [[0, 2], [1, 2], [2, 2], [3, 0]] }],
    challenge: [{ w: 5, h: 5, start: { x: 0, y: 0 }, key: { x: 4, y: 1 }, goal: { x: 0, y: 4 }, rocks: [[2, 0], [2, 1], [2, 3], [3, 3]] }, { w: 5, h: 5, start: { x: 2, y: 2 }, key: { x: 0, y: 4 }, goal: { x: 4, y: 0 }, rocks: [[1, 2], [2, 1], [3, 2], [1, 3]] }, { w: 5, h: 5, start: { x: 0, y: 4 }, key: { x: 2, y: 0 }, goal: { x: 4, y: 4 }, rocks: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]] }, { w: 5, h: 5, start: { x: 4, y: 4 }, key: { x: 0, y: 0 }, goal: { x: 4, y: 0 }, rocks: [[2, 0], [2, 1], [2, 3], [2, 4]] }]
  };
  const levelId = (lv) => [lv.w, lv.h, lv.start.x, lv.start.y, lv.goal.x, lv.goal.y, lv.key ? lv.key.x + "." + lv.key.y : "-", lv.rocks.map(r => r.join(".")).sort().join("_")].join(":");
  const LEVELS = {};
  for (const m of L.MODES) {
    const seen = new Set(); LEVELS[m] = [];
    ORIGINAL_LEVELS[m].concat(LV[m]).forEach(lv => { const id = levelId(lv); if (!seen.has(id)) { seen.add(id); LEVELS[m].push(lv); } });
  }
  function codePrompt(lv, mode, extra) {
    const sol = L.solveLevel(lv);
    const level = Object.assign({}, lv, { maxMoves: mode === "challenge" ? sol.moves + 2 : Math.max(12, sol.moves + 4) });
    const instr = lv.key ? "Get the key first, then reach the leaf. Use " + level.maxMoves + " arrows or fewer."
      : lv.rocks.length ? "Plan a path around the rocks to the leaf, then press Run." : "Add arrows to reach the leaf, then press Run.";
    return Object.assign(graded({ id: pid("code"), cids: ["lv:" + levelId(lv)], mechanic: "plan", level, instruction: instr, minMoves: sol.moves,
      hints: [lv.key ? "Plan two trips: start → key, then key → leaf." : "Count the squares: how far across, and how far up or down?",
        "One route that works starts with: " + sol.path.slice(0, Math.min(3, sol.path.length)).map(d => ARROW[d]).join(" ") + " …"],
      explanation: "There's more than one route — any path that reaches the leaf works. The shortest uses " + sol.moves + " arrows.",
      concepts: ["arrows"].concat(lv.rocks.length ? ["obstacles"] : []).concat(lv.key ? ["keys"] : []), seen: ["arrows"] }), extra || {});
  }
  function buildCodeSnake(mode, ctx) {
    const n = mode === "practice" ? 5 : 4;
    return ctx.pick(LEVELS[mode].map(lv => ({ cid: "lv:" + levelId(lv), lv })), n).map(c => codePrompt(c.lv, mode));
  }

  // --- Bug Hunt (new): predict where code ends, find the step that bumps, fix a buggy program.
  const DIRV = L.DIRS;
  function walk(lv, start, prog) { let p = { x: start.x, y: start.y }; const rocks = new Set(lv.rocks.map(r => r.join(","))); for (let i = 0; i < prog.length; i++) { const d = DIRV[prog[i]]; const nx = p.x + d.x, ny = p.y + d.y; if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h || rocks.has(nx + "," + ny)) return { bump: i, pos: p }; p = { x: nx, y: ny }; } return { bump: -1, pos: p }; }
  function randomProgram(rand, lv, len, mustBumpAt) {
    const dirs = Object.keys(DIRV);
    for (let t = 0; t < 60; t++) {
      const prog = []; let p = { x: lv.start.x, y: lv.start.y }; let ok = true;
      const rocks = new Set(lv.rocks.map(r => r.join(",")));
      for (let i = 0; i < len; i++) {
        const opts = dirs.filter(d => { const v = DIRV[d]; const nx = p.x + v.x, ny = p.y + v.y; const inb = nx >= 0 && ny >= 0 && nx < lv.w && ny < lv.h; const free = inb && !rocks.has(nx + "," + ny); return mustBumpAt === i ? inb && rocks.has(nx + "," + ny) : free; });
        if (!opts.length) { ok = false; break; }
        const d = pick(opts, rand); prog.push(d);
        if (mustBumpAt === i) { for (let k = i + 1; k < len; k++) prog.push(pick(dirs, rand)); break; }
        p = { x: p.x + DIRV[d].x, y: p.y + DIRV[d].y };
      }
      if (ok && prog.length === len) return prog;
    }
    return null;
  }
  function predictPrompt(rand, lv, len, cidPrefix) {
    const prog = randomProgram(rand, lv, len, -1); if (!prog) return null;
    const end = walk(lv, lv.start, prog).pos;
    if (end.x === lv.start.x && end.y === lv.start.y) return null;
    const rocks = new Set(lv.rocks.map(r => r.join(",")));
    const near = [];
    // plausible wrong ends: one step off, or the end if one arrow were reversed
    for (const d of Object.values(DIRV)) near.push({ x: end.x + d.x, y: end.y + d.y });
    const free = (c) => c.x >= 0 && c.y >= 0 && c.x < lv.w && c.y < lv.h && !rocks.has(c.x + "," + c.y) && !(c.x === lv.start.x && c.y === lv.start.y) && !(c.x === end.x && c.y === end.y);
    const wrong = shuffle(near.filter(free), rand).filter((c, i, a) => a.findIndex(z => z.x === c.x && z.y === c.y) === i).slice(0, 3);
    if (wrong.length < 2) return null;
    const marks = shuffle([{ x: end.x, y: end.y, ok: true }].concat(wrong), rand).map((m, i) => Object.assign(m, { letter: "ABCD"[i] }));
    const okMark = marks.find(m => m.ok);
    return { cid: cidPrefix + ":" + levelId(lv) + ":" + prog.join(""), topic: "predict", instruction: "Run this code in your head. Where does the snake stop?",
      visual: { kind: "grid", level: { w: lv.w, h: lv.h, start: lv.start, rocks: lv.rocks }, marks: marks.map(m => ({ x: m.x, y: m.y, letter: m.letter })), program: prog },
      options: marks.map(m => ({ id: "sq-" + (m.ok ? "end" : m.letter), text: m.letter, label: "Square " + m.letter })), rule: { type: "one", valid: ["sq-end"] },
      hints: ["Put your finger on the snake and move it one arrow at a time.", "After the first arrow, the snake is one square " + prog[0] + "."],
      explanation: "Following " + prog.map(d => ARROW[d]).join(" ") + " one step at a time ends on square " + okMark.letter + ".", concepts: ["predict", "arrows"] };
  }
  function bumpPrompt(rand, lv) {
    const k = int(rand, 1, 4), len = k + 1 + int(rand, 0, 1);
    const prog = randomProgram(rand, lv, len, k); if (!prog) return null;
    if (walk(lv, lv.start, prog).bump !== k) return null;
    return { cid: "bump:" + levelId(lv) + ":" + prog.join(""), topic: "bump", instruction: "This code has a bug. At which step does the snake bump into a rock?",
      visual: { kind: "grid", level: { w: lv.w, h: lv.h, start: lv.start, rocks: lv.rocks, goal: lv.goal }, marks: [], program: prog },
      options: prog.map((d, i) => ({ id: "step-" + i, text: "Step " + (i + 1), label: "Step " + (i + 1) + ": " + d })), rule: { type: "one", valid: ["step-" + k] },
      wrongHints: Object.fromEntries(prog.map((d, i) => [i < k ? "step-" + i : "", i < k ? "Step " + (i + 1) + " moves into an open square. Keep following the arrows." : ""]).filter(e => e[0])),
      hints: ["Trace the arrows one by one. Stop when the next square is a rock.", "Steps 1 to " + k + " are fine. Check the step after that."],
      explanation: "Step " + (k + 1) + " (" + ARROW[prog[k]] + ") points into a rock — that's the bug to fix.", concepts: ["debug", "obstacles"] };
  }
  function fixPrompt(rand, lv) {
    const sol = L.solveLevel(lv); if (!sol || sol.path.length < 3) return null;
    const i = int(rand, 0, sol.path.length - 1);
    const wrong = pick(Object.keys(DIRV).filter(d => d !== sol.path[i]), rand);
    const buggy = sol.path.slice(); buggy[i] = wrong;
    if (L.runProgram(lv, buggy).result === "success") return null;
    return Object.assign(codePrompt(lv, "practice", { startProgram: buggy, maxExtra: true }), {
      cids: ["fix:" + levelId(lv) + ":" + i + wrong], topic: "fix",
      instruction: "This code has one wrong arrow. Run it, find the bug, fix it, and run again.",
      hints: ["Press Run and watch where it goes wrong.", "Arrow " + (i + 1) + " is the one to change."],
      explanation: "Fixed! The bug was arrow " + (i + 1) + ". Any route that reaches the leaf counts.", concepts: ["debug", "arrows"] });
  }
  function buildBugHunt(mode, ctx) {
    if (mode === "explore") return ctx.generate((r) => predictPrompt(r, pick(LEVELS.explore, r), int(r, 2, 3), "pred"), 4, { tries: 20 })
      .map(p => Object.assign({ id: pid("bug"), mechanic: "choose", graded: true, cids: [p.cid] }, p, { say: p.instruction, seen: ["predict"] }));
    if (mode === "practice") return ctx.generate((r) => (r() < 0.5 ? bumpPrompt(r, pick(LEVELS.practice, r)) : predictPrompt(r, pick(LEVELS.practice, r), int(r, 3, 5), "pred5")), 4, { spread: true, tries: 25 })
      .map(p => Object.assign({ id: pid("bug"), mechanic: "choose", graded: true, cids: [p.cid] }, p, { say: p.instruction, seen: ["debug"] }));
    const fixes = ctx.generate((r) => { const p = fixPrompt(r, pick(LEVELS.practice.concat(LEVELS.explore), r)); return p && Object.assign(p, { cid: p.cids[0] }); }, 2, { tries: 20 });
    const bumps = ctx.generate((r) => bumpPrompt(r, pick(LEVELS.practice, r)), 2, { tries: 25 }).map(p => Object.assign({ id: pid("bug"), mechanic: "choose", graded: true, cids: [p.cid] }, p, { say: p.instruction, seen: ["debug"] }));
    return shuffle(fixes.concat(bumps), ctx.rand);
  }

  // ====================================================================== EVERYDAY ADVENTURES
  function routinePrompt(key, mode, rand) {
    const r = B.ROUTINES[key];
    const steps = mode === "explore" ? r.steps.filter(s => r.explore.includes(s.v)) : r.steps;
    const extra = mode === "challenge" ? pick(Object.keys(B.ROUTINES).filter(k => k !== key).flatMap(k => B.ROUTINES[k].steps), rand) : null;
    const tileSteps = extra ? steps.concat([extra]) : steps;
    const legacy = new Set(["handwashing", "teeth", "planting", "sandwich"].flatMap(k => B.ROUTINES[k].steps.map(s => s.v)));
    const artOf = (s) => s.art || (legacy.has(s.v) ? s.v : null);
    return graded({ id: pid("steps"), cids: ["rt:" + key], mechanic: "sequence", kind: "steps",
      instruction: r.title + (extra ? ": order the steps. One card belongs to a different job." : ": put the steps in order."),
      say: r.title + ". Put the steps in order." + (extra ? " One card belongs to a different job." : ""),
      tiles: shuffle(tileSteps.map(s => ({ id: "r-" + s.v, value: s.v, art: artOf(s), label: s.label })), rand),
      slots: steps.length, answers: [steps.map(s => s.v)], fixed: mode === "explore" ? [0] : [],
      stepHints: Object.fromEntries(steps.map(s => [s.v, s.hint])),
      hints: ["What has to happen first, before anything else can?", steps[0].label + " comes first, then " + steps[1].label.toLowerCase() + "."],
      explanation: steps.map(s => s.label).join(" → ") + ".", concepts: [r.concept], seen: [r.concept] });
  }
  function buildStepByStep(mode, ctx) {
    const n = 3;
    return ctx.pick(Object.keys(B.ROUTINES).map(k => ({ cid: "rt:" + k, k })), n).map(c => routinePrompt(c.k, mode, ctx.rand));
  }

  const GL = B.GEAR_LABEL;
  function weatherPrompt(w, mode, rand) {
    const k = mode === "explore" ? 1 : Math.min(2, w.valid.length);
    const validShown = mode === "challenge" ? w.valid.slice() : sample(w.valid, Math.min(w.valid.length, k + 1), rand);
    const invalidShown = sample(w.invalid, mode === "explore" ? 2 : Math.min(3, w.invalid.length), rand);
    const rule = mode === "challenge" ? { type: "all", valid: validShown } : k === 1 ? { type: "one", valid: validShown } : { type: "some", valid: validShown, n: k };
    const instr = mode === "challenge" ? w.scene + " Pick everything that would " + w.need + "." : w.scene + " Pick " + (k === 1 ? "one thing" : "two things") + " that would " + w.need + ".";
    return graded({ id: pid("wear"), cids: ["wx:" + w.id], mechanic: "choose", scene: w.art, instruction: instr,
      options: shuffle(validShown.concat(invalidShown), rand).map(id => ({ id, art: id, label: cap(GL[id]) })), rule, wrongHints: w.why,
      hints: ["Think about the weather: what job does each thing do?", "Look for things that " + w.need + "."],
      explanation: validShown.map(v => GL[v]).join(", ") + (validShown.length > 1 ? " all " : " ") + "help" + (validShown.length > 1 ? "" : "s") + " " + w.need + ".", concepts: [w.concept], seen: [w.concept] });
  }
  function safetyPrompt(s, mode, rand) {
    const good = mode === "explore" ? [pick(s.good, rand)] : s.good.slice();
    const bad = mode === "explore" ? [s.bad[0]] : s.bad;
    const opts = good.map((t, i) => ({ id: "ok-" + i, text: t, label: t })).concat(bad.map((b, i) => ({ id: "no-" + i, text: b.t, label: b.t })));
    const all = mode === "challenge";
    return graded({ id: pid("safe"), cids: ["safe:" + s.id], mechanic: "choose", scene: s.art, instruction: s.scene + " " + (all ? "Pick every safe choice." : s.ask),
      options: shuffle(opts, rand), rule: all ? { type: "all", valid: good.map((_, i) => "ok-" + i) } : { type: "one", valid: good.map((_, i) => "ok-" + i) },
      wrongHints: Object.fromEntries(bad.map((b, i) => ["no-" + i, b.h])), hints: ["Which choice keeps you safest?", s.why], explanation: s.why, concepts: [s.concept], seen: [s.concept] });
  }
  const PACK_TWIST = { picnic: { why: "in case it rains", ids: ["umbrella", "raincoat"] }, beach: { why: "for the strong sun", ids: ["sunglasses", "sunscreen"] },
    sleepover: { why: "in case it's chilly", ids: ["blanket", "scarf"] }, "snow-day": { why: "for your neck", ids: ["scarf"] } };
  function packPrompt(pk, mode, rand) {
    const twist = mode === "challenge" ? PACK_TWIST[pk.id] : null;
    const opts = pk.list.concat(sample(pk.extras, 2, rand)).concat(twist ? twist.ids : []);
    const listNames = pk.list.map(l => GL[l]);
    const instr = twist ? pk.title + ": " + listNames.join(", ") + " — plus ONE thing " + twist.why + ". Pack it!" : pk.title + ": " + listNames.join(", ") + ". Pack exactly what's on the list.";
    return graded({ id: pid("pack"), cids: ["pack:" + pk.id], mechanic: "choose", scene: pk.art, checklist: listNames, checklistTitle: pk.title, instruction: instr,
      options: shuffle(opts, rand).map(id => ({ id, art: id, label: cap(GL[id]) })),
      rule: twist ? (twist.ids.length > 1 ? { type: "set", required: pk.list.slice(), groups: [{ ids: twist.ids, n: 1 }] } : { type: "all", valid: pk.list.concat(twist.ids) }) : { type: "all", valid: pk.list.slice() },
      wrongHints: Object.fromEntries(pk.extras.map(e => [e, "The " + GL[e] + " isn't on the list. Check the list again."])),
      hints: ["Read the list one item at a time and find each thing.", twist ? "Pack the " + pk.list.length + " list items, then one extra thing " + twist.why + "." : "There are " + pk.list.length + " things on the list."],
      explanation: twist ? listNames.join(", ") + " — and " + twist.ids.map(i => "a " + GL[i]).join(" or ") + " " + twist.why + "." : listNames.join(", ") + ": everything on the list.", concepts: [pk.concept], seen: [pk.concept] });
  }
  function buildWeather(mode, ctx) {
    const rand = ctx.rand;
    const cands = B.WEATHER.map(w => ({ cid: "wx:" + w.id, topic: "wx", w })).concat(B.SAFETY.map(s => ({ cid: "safe:" + s.id, topic: "safe", s })))
      .concat(mode === "explore" ? [] : B.PACKING.map(pk => ({ cid: "pack:" + pk.id, topic: "pack", pk })));
    const n = mode === "explore" ? 3 : 4;
    return ctx.pick(cands, n, { spread: true }).map(c => c.w ? weatherPrompt(c.w, mode, rand) : c.s ? safetyPrompt(c.s, mode, rand) : packPrompt(c.pk, mode, rand));
  }

  function buildKindChoices(mode, ctx) {
    const rand = ctx.rand;
    const n = mode === "explore" ? 3 : mode === "practice" ? 4 : 5;
    return ctx.pick(B.KIND.map(k => ({ cid: "kind:" + k.id, k })), n).map(({ cid, k }) => {
      let options = mode === "explore" ? [pick(k.good, rand)] : mode === "practice" ? k.good.slice() : k.good.concat(k.nuance);
      const opts = options.map((t, j) => ({ id: "kind-" + j, text: t, label: t, good: true })).concat(k.not.map((x, j) => ({ id: "not-" + j, text: x.t, label: x.t, good: false })));
      const validIds = opts.filter(o => o.good).map(o => o.id);
      const all = mode === "challenge";
      const instr = all ? "Pick every kind choice. (There's more than one!)" : "What could you do? Pick a kind choice.";
      return graded({ id: pid("kind"), cids: [cid], mechanic: "choose", story: { who: k.who, text: k.text }, instruction: instr, say: k.text + " " + instr,
        options: shuffle(opts, rand).map(o => ({ id: o.id, text: o.text, label: o.label })), rule: all ? { type: "all", valid: validIds } : { type: "one", valid: validIds },
        wrongHints: Object.fromEntries(k.not.map((x, j) => ["not-" + j, x.h])),
        hints: ["Think: which choice would help, include, or show you care?", all ? "There are " + validIds.length + " kind choices here." : "Look for a choice that helps."], explanation: k.expl, concepts: ["kindness"], seen: ["kindness"] });
    });
  }

  // --- Tidy Up (new): where could each thing go? Several rooms can be right.
  const ROOM = Object.fromEntries(B.ROOMS.map(r => [r.id, r]));
  const ROOM_SETS = { explore: [["kitchen", "bedroom"], ["bathroom", "garden"], ["kitchen", "garden"], ["bathroom", "bedroom"]], practice: [["kitchen", "bathroom", "bedroom"], ["kitchen", "bedroom", "garden"], ["bathroom", "bedroom", "garden"]], challenge: [["kitchen", "bathroom", "bedroom", "garden"]] };
  const tidyFits = (roomIds) => B.TIDY.filter(t => t.rooms.some(r => roomIds.includes(r)) && !roomIds.every(r => t.rooms.includes(r)));
  function tidyPrompt(ctx, mode, roomIds, nItems) {
    const eligible = tidyFits(roomIds);
    const ordered = ctx.pick(eligible.map(t => ({ cid: "tidy:" + t.id, topic: t.rooms.find(r => roomIds.includes(r)), t })), nItems, { spread: true });
    return { id: pid("tidy"), cids: ["rooms:" + roomIds.join(",")].concat(ordered.map(o => o.cid)), mechanic: "sort", graded: true, sortBy: "room",
      instruction: "Tidy up! Where could each thing go?", say: "Tidy up! Where could each thing go? Some things fit in more than one room.",
      bins: roomIds.map(r => ({ id: r, art: "room-" + r, label: ROOM[r].name, note: ROOM[r].note })),
      items: shuffle(ordered, ctx.rand).map(({ t }) => ({ id: t.id, art: t.id, label: t.label, bins: t.rooms.filter(r => roomIds.includes(r)), hint: t.hint,
        explain: t.rooms.length > 1 ? "The " + t.label + " can go in the " + t.rooms.map(r => ROOM[r].name.toLowerCase()).join(" or the ") + "." : "The " + t.label + " goes in the " + ROOM[t.rooms[0]].name.toLowerCase() + ".", concepts: ["tidy-up"] })),
      hints: ["Think: where do you use this thing?"], explanation: "All tidied! Many homes keep things in different places, and that's fine.", concepts: ["tidy-up"], seen: ["tidy-up"] };
  }
  function buildTidyUp(mode, ctx) {
    const nItems = { explore: 4, practice: 5, challenge: 6 }[mode];
    const set = pickContainer(ctx, ROOM_SETS[mode], "rooms:", tidyFits, t => "tidy:" + t.id, nItems);
    return [tidyPrompt(ctx, mode, set.s, nItems)];
  }

  // ====================================================================== ACTIVITIES
  const ACTIVITIES = [
    { id: "snack-hunt", world: "word", title: "Snack Hunt", mechanic: "collect", art: "pear", objective: "Name fruits and vegetables", example: "Steer the snake to the pear.",
      modes: { explore: "Eat any snack to hear its name.", practice: "Find the snack you hear named.", challenge: "Read a clue — some have more than one answer." }, build: buildSnackHunt },
    { id: "letter-line", world: "word", title: "Letter Line", mechanic: "sequence", art: "s-letters", objective: "Spell words letter by letter", example: "Put the letters in order to spell FROG.",
      modes: { explore: "Copy 3-letter words.", practice: "Spell 4-letter words you hear.", challenge: "Spell longer words from a picture, with a spare letter." }, build: buildLetterLine },
    { id: "sentence-builder", world: "word", title: "Sentence Builder", mechanic: "sequence", art: "s-sentence", objective: "Put words in order to make a sentence", example: "The · frog · hops.", isNew: true,
      modes: { explore: "Copy short sentences.", practice: "Build 4–5 word sentences.", challenge: "Longer sentences with a spare word." }, build: buildSentenceBuilder },
    { id: "berry-count", world: "number", title: "Berry Basket", mechanic: "collect", art: "basket", objective: "Count an exact amount", example: "Collect exactly five berries.",
      modes: { explore: "Counts to 6 with a filling frame.", practice: "Counts up to 10.", challenge: "Work it out first: sums, doubles, take-aways." }, build: buildBerryCount },
    { id: "number-questions", world: "number", title: "Meadow Math", mechanic: "choose", art: "s-plus", objective: "Compare, add, subtract, and find number patterns", example: "Complete 2, 4, 6, __.",
      modes: { explore: "Count, compare, one more and one less.", practice: "Adding, doubles, tens and ones, number patterns.", challenge: "Subtraction, missing numbers, two-step and word problems." }, build: buildNumberQuestions },
    { id: "fair-shares", world: "number", title: "Fair Shares", mechanic: "choose", art: "s-share", objective: "Share equally, make groups, and compare everyday amounts", example: "Share 6 berries between 2 friends.", isNew: true,
      modes: { explore: "Sharing, pairs, and which is bigger.", practice: "Groups, rows, halves, and short stories.", challenge: "Leftovers, thirds, and multi-step stories." }, build: buildFairShares },
    { id: "pattern-path", world: "pattern", title: "Pattern Path", mechanic: "choose", art: "s-pattern", objective: "Continue patterns and find the odd one out", example: "Red circle, blue square, red circle… what's next?",
      modes: { explore: "Simple two-part patterns.", practice: "Longer patterns and odd-one-out.", challenge: "Two changes at once and trickier rules." }, build: buildPatternPath },
    { id: "shape-sort", world: "pattern", title: "Shape Sort", mechanic: "sort", art: "s-sort", objective: "Sort shapes by a rule", example: "Put each shape in the right basket.",
      modes: { explore: "Sort by shape into 2 baskets.", practice: "Sort by color, edges, or sides.", challenge: "Sort by sides, corners, and equal sides." }, build: buildShapeSort },
    { id: "mirror-match", world: "pattern", title: "Mirror Match", mechanic: "choose", art: "s-mirror", objective: "Spot symmetry, turned shapes, and growing patterns", example: "Which picture finishes the mirror image?", isNew: true,
      modes: { explore: "Small mirror pictures and +1 growing patterns.", practice: "Bigger mirrors, both directions.", challenge: "Turned shapes and number-rule growth." }, build: buildMirrorMatch },
    { id: "habitat-homes", world: "nature", title: "Habitat Homes", mechanic: "sort", art: "hab-pond", objective: "Match animals with habitats that suit them", example: "Where could a duck live?",
      modes: { explore: "2 habitats with clues.", practice: "3 habitats, 5 animals.", challenge: "4 habitats; some animals fit more than one." }, build: buildHabitatHomes },
    { id: "life-cycles", world: "nature", title: "Life Cycles", mechanic: "sequence", art: "sprout", objective: "Order how living things grow and change", example: "Seed, sprout, flower — what comes next?",
      modes: { explore: "3 stages, first one placed.", practice: "Full animal cycles, seasons, and days.", challenge: "Plants, the water cycle, and other cycles." }, build: buildLifeCycles },
    { id: "nature-walk", world: "nature", title: "Nature Walk", mechanic: "explore", art: "owl", objective: "Learn facts about animals", example: "Tap the owl to discover a fact.",
      modes: { explore: "Discover six animal facts.", practice: "Read facts, then answer questions.", challenge: "Solve “Who am I?” riddles." }, build: buildNatureWalk },
    { id: "food-chains", world: "nature", title: "Food Chains", mechanic: "sequence", art: "s-chain", objective: "Living things, and what eats what", example: "Grass → rabbit → fox.", isNew: true,
      modes: { explore: "Living or not living?", practice: "3-step food chains.", challenge: "4-step chains and what-if questions." }, build: buildFoodChains },
    { id: "code-snake", world: "logic", title: "Code the Snake", mechanic: "plan", art: "s-arrows", objective: "Plan a sequence of moves and debug it", example: "→ → ↓ then Run to reach the leaf.",
      modes: { explore: "Small grids, no rocks.", practice: "Plan around rocks.", challenge: "Get the key first, with an arrow limit." }, build: buildCodeSnake },
    { id: "bug-hunt", world: "logic", title: "Bug Hunt", mechanic: "choose", art: "s-bug", objective: "Predict what code does, then find and fix bugs", example: "Where does → → ↓ end?", isNew: true,
      modes: { explore: "Predict where short code ends.", practice: "Find the step that bumps a rock.", challenge: "Fix buggy code, then run it." }, build: buildBugHunt },
    { id: "step-by-step", world: "everyday", title: "Step by Step", mechanic: "sequence", art: "soap", objective: "Order everyday routines", example: "Wet hands, soap, scrub, rinse, dry.",
      modes: { explore: "3 steps, first one placed.", practice: "Full 4–5 step routines.", challenge: "Full routines, plus a card that doesn't belong." }, build: buildStepByStep },
    { id: "ready-weather", world: "everyday", title: "Ready for Weather", mechanic: "choose", art: "umbrella", objective: "Choose what helps for the weather, stay safe, and pack from a list", example: "Pick two things for a rainy day.",
      modes: { explore: "Pick one helpful thing or safe choice.", practice: "Pick two, pack from a list.", challenge: "Pick everything that fits; plan for a twist." }, build: buildWeather },
    { id: "kind-choices", world: "everyday", title: "Kind Choices", mechanic: "choose", art: "s-kind", objective: "Think about kind ways to respond", example: "A friend dropped their crayons. What could you do?",
      modes: { explore: "Two choices to think about.", practice: "Several kind choices fit.", challenge: "Find every kind choice." }, build: buildKindChoices },
    { id: "tidy-up", world: "everyday", title: "Tidy Up", mechanic: "sort", art: "room-bedroom", objective: "Sort things into rooms — some fit in more than one", example: "Where could a towel go?", isNew: true,
      modes: { explore: "2 rooms, 4 things.", practice: "3 rooms, 5 things.", challenge: "4 rooms; some things fit more than one." }, build: buildTidyUp }
  ];
  const ACTIVITY = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]));

  /* Build a round. history is the persisted history object (or null); the
   * deck chooses freshest-first for this activity+mode. Seeded for tests. */
  function buildRound(activityId, mode, seed, history) {
    const a = ACTIVITY[activityId];
    if (!a) throw new Error("unknown activity " + activityId);
    const rand = L.rng(seed == null ? Date.now() : seed);
    const rec = Deck.rec(history ? Deck.sanitize(history) : null, Deck.keyOf(activityId, mode));
    const ctx = Deck.context(rec, rand, mode);
    const prompts = a.build(mode, ctx).filter(Boolean);
    prompts.forEach(p => {
      p.activity = activityId; p.world = a.world; p.mode = mode;
      p.say = p.say || p.instruction;
      p.seen = p.seen || p.concepts || [];
      p.cids = (p.cids || []).filter(Boolean);
      p.hints = p.hints && p.hints.length ? p.hints : ["Take another look."];
      delete p.cid;
    });
    return prompts;
  }

  // ====================================================================== MY SNAKE
  const COSMETICS = {
    color: [
      { id: "purple", name: "Garden purple", hex: "#7B4FD6", dark: "#55309F", free: true },
      { id: "mint", name: "Mint", hex: "#3DB489", dark: "#23835F", goal: { stat: "discovered", n: 8, text: "Discover 8 things" } },
      { id: "berry", name: "Berry", hex: "#C9416A", dark: "#93264A", goal: { stat: "practiced", n: 15, text: "Practice 15 times" } },
      { id: "sky", name: "Sky", hex: "#3E86C9", dark: "#255E96", goal: { stat: "worldsVisited", n: 3, text: "Finish rounds in 3 worlds" } },
      { id: "sunflower", name: "Sunflower", hex: "#E0A82A", dark: "#A87910", goal: { stat: "routes", n: 3, text: "Solve 3 Logic Lab routes" } },
      { id: "coral", name: "Coral", hex: "#E46F55", dark: "#B04A33", goal: { stat: "challengeRounds", n: 1, text: "Finish a Challenge round" } }
    ],
    pattern: [
      { id: "plain", name: "Plain", free: true },
      { id: "spots", name: "Spots", goal: { stat: "rounds", n: 2, text: "Finish 2 rounds" } },
      { id: "stripes", name: "Stripes", goal: { stat: "sorted", n: 10, text: "Sort 10 things correctly" } },
      { id: "zigzag", name: "Zigzag", goal: { stat: "sequences", n: 5, text: "Put 5 sequences in order" } }
    ],
    accessory: [
      { id: "none", name: "None", free: true },
      { id: "hat", name: "Explorer hat", goal: { stat: "rounds", n: 1, text: "Finish your first round" } },
      { id: "crown", name: "Flower crown", goal: { stat: "natureDiscovered", n: 6, text: "Discover 6 nature things" } },
      { id: "glasses", name: "Reading glasses", goal: { stat: "wordPractice", n: 10, text: "Practice 10 words" } },
      { id: "bowtie", name: "Bow tie", goal: { stat: "modesTried", n: 3, text: "Try Explore, Practice, and Challenge" } },
      { id: "scarf", name: "Cozy scarf", goal: { stat: "worldsVisited", n: 6, text: "Finish a round in all 6 worlds" } }
    ]
  };
  const COSMETIC_LIST = [].concat(
    COSMETICS.color.map(c => Object.assign({ kind: "color" }, c, { id: "color:" + c.id, key: c.id })),
    COSMETICS.pattern.map(c => Object.assign({ kind: "pattern" }, c, { id: "pattern:" + c.id, key: c.id })),
    COSMETICS.accessory.map(c => Object.assign({ kind: "accessory" }, c, { id: "accessory:" + c.id, key: c.id })));

  return { WORLDS, MODE_INFO, CONCEPTS, CONCEPT, conceptWorld, ACTIVITIES, ACTIVITY, buildRound, COSMETICS, COSMETIC_LIST, COLORS, SHAPES,
    FOODS: B.FOODS, FOOD, ANIMALS: B.ANIMALS, ANIMAL, HABITATS: B.HABITATS, LEVELS, CYCLES: B.CYCLES, ROUTINES: B.ROUTINES, KIND: B.KIND, ARROW, levelId,
    _internals: { PAT, PAT_MODES, SORT_RULES, symmetryPrompt, rotationPrompt, growPrompt, predictPrompt, bumpPrompt, fixPrompt, walk, Q, SHARE, STORY_EASY, CYCLE_SETS } };
});
