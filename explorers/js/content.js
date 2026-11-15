/* content.js — Snake Explorers: curated learning content.
 * Pure data + round builders. Every prompt carries its objective, a concise
 * instruction, the mechanic that plays it, hints (gentle first, then clearer),
 * an explanation, and the concept ids it discovers/practices.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./logic.js"));
  else root.SE_Content = factory(root.SE_Logic);
})(typeof self !== "undefined" ? self : this, function (L) {
  "use strict";
  const { int, shuffle, sample, pick } = L;

  // ======================================================================
  // WORLDS
  // ======================================================================
  const WORLDS = [
    { id: "word",     name: "Word Garden",        art: "w-word",     tint: "#F6E3EA", skill: "Words & reading",       example: "Steer to the pear when you hear “pear”." },
    { id: "number",   name: "Number Meadow",      art: "w-number",   tint: "#FBEFD2", skill: "Counting & math",       example: "Collect exactly five berries for the basket." },
    { id: "pattern",  name: "Pattern Playground", art: "w-pattern",  tint: "#E4EEF9", skill: "Shapes & patterns",     example: "What comes next: circle, square, circle…?" },
    { id: "nature",   name: "Nature Trail",       art: "w-nature",   tint: "#E3F2E6", skill: "Animals & plants",      example: "Help the camel find a dry, sandy home." },
    { id: "logic",    name: "Logic Lab",          art: "w-logic",    tint: "#ECE6F8", skill: "Planning & coding",     example: "Line up arrows, press Run, reach the leaf." },
    { id: "everyday", name: "Everyday Adventures", art: "w-everyday", tint: "#FBE7DC", skill: "Daily life & kindness", example: "Put the handwashing steps in order." }
  ];

  const MODE_INFO = {
    explore:   { name: "Explore",   line: "Relaxed. Tips shown, no timer." },
    practice:  { name: "Practice",  line: "Short goals with helpful feedback." },
    challenge: { name: "Challenge", line: "Harder puzzles. Hints when you ask." }
  };

  // ======================================================================
  // CONCEPTS (Discovery Book entries)
  // ======================================================================
  const FOODS = [
    { id: "apple",      name: "apple",      look: "round and red, with a little stem",           clue: "a round fruit that grows on trees and has a crunchy bite", fact: "Apples grow on trees and can be red, green, or yellow." },
    { id: "banana",     name: "banana",     look: "long, curved, and yellow",                    clue: "a long, curved fruit inside a peel you open",               fact: "Bananas grow in big bunches called hands." },
    { id: "grapes",     name: "grapes",     look: "small, round, and purple, in a bunch",        clue: "small round fruits that grow together in a bunch",          fact: "Grapes grow on climbing plants called vines.", plural: true },
    { id: "strawberry", name: "strawberry", look: "red, with tiny seeds on the outside",         clue: "a red berry that wears its seeds on the outside",           fact: "A strawberry has about 200 tiny seeds on its skin." },
    { id: "orange",     name: "orange",     look: "round and orange, like a ball",               clue: "a round fruit with the same name as its color",             fact: "Inside an orange are sections called segments." },
    { id: "pear",       name: "pear",       look: "green, wide at the bottom and narrow at the top", clue: "a fruit that is wide at the bottom and narrow at the top", fact: "Pears ripen from the inside out." },
    { id: "carrot",     name: "carrot",     look: "long and orange, with green leaves on top",   clue: "a long orange root that crunches",                         fact: "A carrot is a root: the part of the plant that grows under the soil." },
    { id: "broccoli",   name: "broccoli",   look: "green, like a tiny tree",                     clue: "a green vegetable that looks like a little tree",          fact: "Broccoli heads are made of many tiny flower buds." },
    { id: "corn",       name: "corn",       look: "yellow, with rows of kernels",                clue: "a yellow vegetable with rows of kernels on a cob",          fact: "The kernels on a cob of corn grow in rows." },
    { id: "tomato",     name: "tomato",     look: "round, red, and shiny, with a green top",     clue: "a red, juicy food full of seeds, often made into sauce",   fact: "Tomatoes grow on vines and are full of seeds." },
    { id: "peas",       name: "peas",       look: "little green balls in a pod",                 clue: "small green balls that grow lined up in a pod",            fact: "Peas grow inside a pod, lined up in a row.", plural: true },
    { id: "lemon",      name: "lemon",      look: "yellow and oval, with pointy ends",           clue: "a yellow fruit that tastes very sour",                     fact: "Lemons taste sour because of citric acid." }
  ];
  const FOOD = Object.fromEntries(FOODS.map(f => [f.id, f]));

  const ANIMALS = [
    { id: "fish",      name: "fish",       homes: ["ocean", "pond"],   note: "Fish live in salty oceans, and many kinds live in ponds, lakes, and rivers.", hint: "Fish need water all the time.", fact: "Fish breathe underwater using gills.", q: "breathes underwater using gills", riddle: "I breathe underwater with gills and steer with my fins." },
    { id: "frog",      name: "frog",       homes: ["pond", "forest"],  note: "Frogs live in and near ponds, and many live in damp forests.", hint: "Frogs like wet places.", fact: "Frogs start life in water as tadpoles.", q: "starts life in water as a tadpole", riddle: "I began life as a tadpole with a tail. Now I hop and catch insects." },
    { id: "duck",      name: "duck",       homes: ["pond", "farm"],    note: "Ducks swim on ponds, and many live on farms too.", hint: "Ducks love to paddle on fresh water.", fact: "Ducks have waterproof feathers.", q: "has waterproof feathers", riddle: "I paddle with webbed feet and my feathers keep the water out." },
    { id: "camel",     name: "camel",      homes: ["desert"],          note: "Camels live in deserts and can cope with heat and little water.", hint: "Camels need dry, sandy places.", fact: "Camels can go many days without drinking water.", q: "can go many days without drinking", riddle: "I live where it is dry and sandy. I can go days without a drink, and I may have one or two humps." },
    { id: "polarbear", name: "polar bear", homes: ["ice", "ocean"],    note: "Polar bears live on sea ice and are strong swimmers in the cold ocean.", hint: "Polar bears need very cold places.", fact: "Polar bears have black skin under their white fur.", q: "has black skin under white fur", riddle: "I have white fur but black skin. I hunt on sea ice and swim in cold water." },
    { id: "penguin",   name: "penguin",    homes: ["ice", "ocean"],    note: "Many penguins live on icy coasts and find their food in the ocean.", hint: "Penguins live where it is cold, close to the sea.", fact: "Penguins can't fly, but they are excellent swimmers.", q: "is a bird that swims but can't fly", riddle: "I am a bird, but I can't fly. I use my wings to swim." },
    { id: "owl",       name: "owl",        homes: ["forest", "farm"],  note: "Many owls live in forests, and barn owls often live on farms.", hint: "Owls nest in trees — or in barns.", fact: "Many owls hunt at night and fly almost silently.", q: "hunts at night and flies almost silently", riddle: "I am often awake at night. My soft feathers help me fly almost without a sound." },
    { id: "squirrel",  name: "squirrel",   homes: ["forest"],          note: "Squirrels live in trees in forests and parks.", hint: "Squirrels climb trees and bury nuts.", fact: "Squirrels bury nuts to eat later.", q: "buries nuts to eat later", riddle: "I bury nuts and seeds to eat later, and I climb trees fast." },
    { id: "cow",       name: "cow",        homes: ["farm"],            note: "Cows live on farms and eat grass in the fields.", hint: "Cows graze in fields.", fact: "A cow's stomach has four parts.", q: "has a stomach with four parts", riddle: "I eat grass in the field all day, and my stomach has four parts." },
    { id: "lizard",    name: "lizard",     homes: ["desert", "forest"], note: "Lots of lizards live in deserts, and many others live in forests.", hint: "Many lizards love warm, sunny spots.", fact: "Lizards warm up by lying in the sun.", q: "warms up by lying in the sun", riddle: "I lie on warm rocks to heat up. Some of my kind can regrow a tail." },
    { id: "rabbit",    name: "rabbit",     homes: ["forest", "farm"],  note: "Wild rabbits live in burrows at the edges of woods and fields.", hint: "Rabbits dig burrows near grass to nibble.", fact: "Rabbits live in underground homes called burrows.", q: "lives in an underground burrow", riddle: "I dig an underground home called a burrow and have long ears." },
    { id: "crab",      name: "crab",       homes: ["ocean"],           note: "Many crabs live in the ocean and on sandy beaches.", hint: "Crabs live by the salty sea.", fact: "Crabs often walk sideways.", q: "often walks sideways", riddle: "I have a hard shell and pincers, and I often walk sideways." },
    { id: "bee",       name: "bee",        homes: [],                  note: "", hint: "", fact: "Bees make honey from the nectar of flowers.", q: "makes honey from flower nectar", riddle: "I visit flowers to collect nectar and help plants make seeds." },
    { id: "butterfly", name: "butterfly",  homes: [],                  note: "", hint: "", fact: "A butterfly tastes with its feet.", q: "tastes with its feet", riddle: "I used to be a caterpillar. I taste with my feet." }
  ];
  const ANIMAL = Object.fromEntries(ANIMALS.map(a => [a.id, a]));

  const HABITATS = [
    { id: "pond",   name: "Pond",   note: "fresh water" },
    { id: "forest", name: "Forest", note: "lots of trees" },
    { id: "desert", name: "Desert", note: "dry and sandy" },
    { id: "ice",    name: "Ice",    note: "very cold" },
    { id: "ocean",  name: "Ocean",  note: "salty sea" },
    { id: "farm",   name: "Farm",   note: "fields and barns" }
  ];
  const HABITAT = Object.fromEntries(HABITATS.map(h => [h.id, h]));

  const COLORS = {
    berry: { name: "red",    hex: "#D2456B" },
    sky:   { name: "blue",   hex: "#3E86C9" },
    sun:   { name: "yellow", hex: "#E7B22C" },
    leaf:  { name: "green",  hex: "#3D9A63" },
    plum:  { name: "purple", hex: "#7B4FD6" }
  };
  const SHAPES = {
    circle:   { name: "circle",   sides: 0, curved: true,  fact: "A circle is perfectly round, with no corners." },
    square:   { name: "square",   sides: 4, curved: false, fact: "A square has 4 equal straight sides and 4 square corners." },
    triangle: { name: "triangle", sides: 3, curved: false, fact: "A triangle has 3 straight sides and 3 corners." },
    star:     { name: "star",     sides: 10, curved: false, fact: "This star has 5 points and 10 straight edges." },
    heart:    { name: "heart",    sides: 0, curved: true,  fact: "A heart has two round bumps at the top and a point at the bottom." },
    diamond:  { name: "diamond",  sides: 4, curved: false, fact: "A diamond (rhombus) has 4 equal sides and stands on a corner." }
  };
  const piece = (color, shape) => ({ id: color + "-" + shape, color, shape, label: COLORS[color].name + " " + SHAPES[shape].name });

  // Book entries: id, world, label, art, fact
  const CONCEPTS = [];
  const addC = (world, id, label, art, fact) => CONCEPTS.push({ id, world, label, art: art || id, fact });
  FOODS.forEach(f => addC("word", f.id, f.name, f.id, f.fact));
  addC("word", "sun", "sun", "summer", "The sun is a star — the closest one to Earth.");
  addC("word", "hat", "hat", "sunhat", "A hat with a wide brim keeps sun off your face.");
  addC("word", "leaf", "leaf", "leaf", "Leaves use sunlight to make food for the plant.");
  addC("number", "count", "Counting", "s-count", "When you count, the last number you say tells how many.");
  addC("number", "compare", "More and less", "s-compare", "Matching items in pairs shows which group has more.");
  addC("number", "add", "Adding", "s-plus", "Adding puts groups together to make a bigger group.");
  addC("number", "subtract", "Taking away", "s-minus", "Taking away tells how many are left.");
  addC("number", "sequence", "Number patterns", "s-skip", "In a number pattern, the same change happens each step.");
  addC("number", "missing", "Missing numbers", "s-missing", "To find a missing number, count up from what you have.");
  Object.keys(SHAPES).forEach(s => addC("pattern", s, SHAPES[s].name, "shape-" + s, SHAPES[s].fact));
  addC("pattern", "colors", "Colors", "s-colors", "Sorting by color means looking only at color, not shape.");
  addC("pattern", "patterns", "Repeating patterns", "s-pattern", "A repeating pattern has a part that repeats again and again.");
  addC("pattern", "odd", "Odd one out", "s-odd", "To find the odd one out, look for the rule that fits all the others.");
  ANIMALS.forEach(a => addC("nature", a.id, a.name, a.id, a.fact));
  HABITATS.forEach(h => addC("nature", "hab-" + h.id, h.name.toLowerCase(), "hab-" + h.id, "A " + h.name.toLowerCase() + " habitat: " + h.note + "."));
  addC("nature", "cycle-plant", "How a plant grows", "flower", "A seed sprouts, grows leaves, flowers, then makes fruit with new seeds.");
  addC("nature", "cycle-butterfly", "Butterfly life cycle", "butterfly", "Egg, caterpillar, chrysalis, butterfly.");
  addC("nature", "cycle-frog", "Frog life cycle", "tadpole", "Eggs hatch into tadpoles, which grow legs and become frogs.");
  addC("nature", "seasons", "Seasons", "autumn", "Spring, summer, autumn, and winter repeat in a cycle.");
  addC("logic", "arrows", "Arrow code", "s-arrows", "A program is a list of steps that run in order.");
  addC("logic", "obstacles", "Planning around rocks", "rock", "Planning ahead helps you find a path around obstacles.");
  addC("logic", "keys", "Two-stop routes", "key", "Breaking a trip into parts — first the key, then the leaf — makes it easier.");
  addC("everyday", "handwashing", "Washing hands", "soap", "Scrubbing with soap for about 20 seconds helps wash germs away.");
  addC("everyday", "teeth", "Brushing teeth", "toothbrush", "Brushing twice a day helps keep teeth healthy.");
  addC("everyday", "planting", "Planting a seed", "wateringcan", "Seeds need soil, water, and light to grow.");
  addC("everyday", "sandwich", "Making a sandwich", "sandwich", "Following steps in order makes a job easier.");
  addC("everyday", "rain-gear", "Rainy-day gear", "rain", "Waterproof things help keep you dry in the rain.");
  addC("everyday", "snow-gear", "Snowy-day gear", "snow", "Layers and mittens help keep you warm in the snow.");
  addC("everyday", "sun-gear", "Sunny-day gear", "summer", "Hats and sunglasses help protect you from strong sun.");
  addC("everyday", "wind-gear", "Windy-day gear", "windy", "A scarf or a jacket helps on a cool, windy day.");
  addC("everyday", "picnic", "Packing a picnic", "basket", "Checking a list helps you remember everything.");
  addC("everyday", "kindness", "Kind choices", "s-kind", "Asking “Do you want help?” is often a kind first step.");
  const CONCEPT = Object.fromEntries(CONCEPTS.map(c => [c.id, c]));
  const conceptWorld = Object.fromEntries(CONCEPTS.map(c => [c.id, c.world]));

  // ======================================================================
  // shared helpers
  // ======================================================================
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const art = (name) => ({ art: name });
  function nearNumbers(ans, rand, count, spread) {
    const out = new Set([ans]);
    const deltas = shuffle([1, -1, 2, -2, spread || 3, -(spread || 3), 10, -10], rand);
    for (const d of deltas) { if (out.size >= count) break; const v = ans + d; if (v >= 0) out.add(v); }
    let k = 4; while (out.size < count) { out.add(ans + k++); }
    return shuffle(Array.from(out), rand);
  }
  const numOpts = (vals) => vals.map(v => ({ id: "n" + v, text: String(v), label: String(v) }));
  let uid = 0;
  const pid = (p) => p + "-" + (++uid);

  // ======================================================================
  // WORD GARDEN
  // ======================================================================
  function buildSnackHunt(mode, rand) {
    if (mode === "explore") {
      return [{
        id: pid("hunt"), mechanic: "collect", kind: "explore", graded: false,
        instruction: "Steer the snake to any snack to hear its name.",
        say: "Steer the snake to any snack to hear its name.",
        goal: 6, pool: FOODS.map(f => f.id), concepts: [], hints: ["Use the arrows. Any snack is a good choice."],
        explanation: "You met six snacks!"
      }];
    }
    const count = 5, extra = mode === "challenge" ? 3 : 2;
    const targets = sample(FOODS, count, rand);
    return targets.map(t => {
      const others = sample(FOODS.filter(f => f.id !== t.id), extra, rand);
      const challenge = mode === "challenge";
      const instr = challenge ? "Find " + t.clue + "." : "Find the " + t.name + ".";
      return {
        id: pid("hunt"), mechanic: "collect", kind: "find", graded: true,
        instruction: instr, say: instr, target: t.id,
        board: shuffle([t.id].concat(others.map(o => o.id)), rand),
        wrongHints: Object.fromEntries(others.map(o => [o.id, "That's the " + o.name + ". " + (challenge ? "Read the clue again." : "The " + t.name + " is " + t.look + ".")])),
        hints: challenge
          ? ["Read the clue again: " + t.clue + ".", "It's the " + t.name + ": " + t.look + "."]
          : ["The " + t.name + " is " + t.look + ".", "Look for something " + t.look + "."],
        explanation: cap(t.name) + (t.plural ? " are " : " is ") + t.look + ". " + t.fact,
        concepts: [t.id], seen: [t.id].concat(others.map(o => o.id))
      };
    });
  }

  const WORDS = {
    explore:   [["sun", "summer", "sun"], ["bee", "bee", "bee"], ["owl", "owl", "owl"], ["cow", "cow", "cow"], ["hat", "sunhat", "hat"]],
    practice:  [["pear", "pear", "pear"], ["corn", "corn", "corn"], ["frog", "frog", "frog"], ["fish", "fish", "fish"], ["duck", "duck", "duck"], ["leaf", "leaf", "leaf"], ["peas", "peas", "peas"]],
    challenge: [["apple", "apple", "apple"], ["lemon", "lemon", "lemon"], ["grapes", "grapes", "grapes"], ["carrot", "carrot", "carrot"], ["banana", "banana", "banana"], ["tomato", "tomato", "tomato"]]
  };
  function buildLetterLine(mode, rand) {
    const n = mode === "explore" ? 4 : mode === "practice" ? 5 : 5;
    return sample(WORDS[mode], n, rand).map(([word, artId, conceptId]) => {
      const letters = word.toUpperCase().split("");
      let tileLetters = letters.slice();
      if (mode === "challenge") {
        const extra = pick("BDKMRSTW".split("").filter(c => !letters.includes(c)), rand);
        tileLetters.push(extra);
      }
      const tiles = shuffle(tileLetters.map((c, i) => ({ id: "t" + i + c, value: c, label: c })), rand);
      const guide = mode === "explore";
      const instr = mode === "challenge" ? "Spell the name of this picture. One letter isn't needed." : guide ? "Copy the word: tap the letters in order." : "Spell the word you hear.";
      return {
        id: pid("word"), mechanic: "sequence", graded: true, kind: "letters",
        instruction: instr, say: mode === "challenge" ? "Spell the name of this picture." : "Spell " + word + ".",
        picture: artId, word, guide: guide ? word.toUpperCase() : null, sayWord: mode !== "challenge" ? word : null,
        tiles, slots: letters.length, answers: [letters], fixed: mode === "practice" ? [0] : [],
        hints: [
          mode === "challenge" ? "Say the word slowly. What sound do you hear first?" : "Listen to the first sound: " + word[0].toUpperCase() + ".",
          "It starts with " + letters.slice(0, Math.ceil(letters.length / 2)).join("") + "…"
        ],
        explanation: word.toUpperCase() + " spells " + word + ".",
        concepts: [conceptId], seen: [conceptId]
      };
    });
  }

  // ======================================================================
  // NUMBER MEADOW
  // ======================================================================
  function buildBerryCount(mode, rand) {
    const n = mode === "explore" ? 3 : 4;
    const out = [];
    const used = new Set();
    for (let i = 0; i < n; i++) {
      let target, expr = null, a, b;
      let guard = 0;
      do {
        if (mode === "explore") target = int(rand, 1, 5);
        else if (mode === "practice") target = int(rand, 3, 8);
        else { a = int(rand, 2, 6); b = int(rand, 2, 6); target = a + b; expr = a + " + " + b; }
      } while (used.has(target) && guard++ < 20);
      used.add(target);
      const instr = expr ? "Collect " + expr + " berries, then go to the basket." : "Collect exactly " + target + " " + (target === 1 ? "berry" : "berries") + ", then go to the basket.";
      out.push({
        id: pid("count"), mechanic: "collect", kind: "count", graded: true,
        instruction: instr, say: instr, target, expr, display: mode === "explore" ? "frame" : mode === "practice" ? "number" : "expr",
        berries: Math.min(target + 3, 15),
        hints: expr
          ? ["Work out " + expr + " first. Start at " + a + " and count on " + b + ".", expr + " makes " + target + "."]
          : ["Count each berry as the snake eats it.", "Stop when you reach " + target + ", then head to the basket."],
        explanation: (expr ? expr + " = " + target + ". " : "") + "You brought " + target + " " + (target === 1 ? "berry" : "berries") + " — exactly right.",
        concepts: expr ? ["add", "count"] : ["count"], seen: ["count"]
      });
    }
    return out;
  }

  function qCount(rand) {
    const n = int(rand, 1, 6);
    const opts = nearNumbers(n, rand, 3, 2).filter(v => v > 0);
    while (opts.length < 3) opts.push(n + opts.length + 2);
    return {
      instruction: "How many berries?", visual: { kind: "dots", groups: [{ n, art: "berry" }] },
      options: numOpts(shuffle(opts, rand)), rule: { type: "one", valid: ["n" + n] },
      hints: ["Point to each berry as you count — one number for each berry.", "Count again slowly. The last number you say tells how many."],
      explanation: "There " + (n === 1 ? "is 1 berry." : "are " + n + " berries."), concepts: ["count"]
    };
  }
  function qMore(rand) {
    let a, b; do { a = int(rand, 1, 7); b = int(rand, 1, 7); } while (Math.abs(a - b) < 2);
    const valid = a > b ? "left" : "right";
    return {
      instruction: "Which basket has more berries?", visual: null,
      options: [{ id: "left", dots: { n: a, art: "berry" }, label: "Left basket" }, { id: "right", dots: { n: b, art: "berry" }, label: "Right basket" }],
      rule: { type: "one", valid: [valid] }, wide: true,
      hints: ["Pair up berries from each basket. Which one has berries left over?", "Count each basket. The bigger number has more."],
      explanation: Math.max(a, b) + " is more than " + Math.min(a, b) + ".", concepts: ["compare"]
    };
  }
  function qAddPics(rand) {
    const a = int(rand, 1, 5), b = int(rand, 1, 5), s = a + b;
    return {
      instruction: "What is " + a + " + " + b + "?", visual: { kind: "dots", groups: [{ n: a, art: "berry" }, { n: b, art: "berry" }], op: "+" },
      options: numOpts(nearNumbers(s, rand, 4)), rule: { type: "one", valid: ["n" + s] },
      hints: ["Start at " + a + " and count on " + b + " more.", "Count all the berries together, one by one."],
      explanation: a + " + " + b + " = " + s + ".", concepts: ["add"]
    };
  }
  function qSeq(rand, rules) {
    const r = pick(rules, rand);
    const seq = [];
    let v = r.start(rand);
    for (let i = 0; i < 5; i++) { seq.push(v); v = r.next(v); }
    const ans = seq[4];
    return {
      instruction: "What number comes next?", visual: { kind: "numberline", items: seq.slice(0, 4).map(String).concat(["?"]) },
      options: numOpts(nearNumbers(ans, rand, 4, r.spread || 3)), rule: { type: "one", valid: ["n" + ans] },
      hints: ["Compare each number with the one before it. What changes?", r.rule + "."],
      explanation: r.rule + ", so " + seq.slice(0, 4).join(", ") + ", " + ans + ".", concepts: ["sequence"]
    };
  }
  const SEQ_EASY = [
    { start: (r) => int(r, 1, 8), next: (v) => v + 1, rule: "Each number is 1 more than the one before" },
    { start: (r) => 2 * int(r, 1, 4), next: (v) => v + 2, rule: "Each number is 2 more than the one before", spread: 2 },
    { start: () => 10, next: (v) => v + 10, rule: "Each number is 10 more than the one before", spread: 5 }
  ];
  const SEQ_HARD = [
    { start: (r) => 5 * int(r, 1, 3), next: (v) => v + 5, rule: "Each number is 5 more than the one before", spread: 5 },
    { start: (r) => int(r, 1, 6), next: (v) => v + 3, rule: "Each number is 3 more than the one before" },
    { start: (r) => int(r, 18, 24), next: (v) => v - 2, rule: "Each number is 2 less than the one before", spread: 2 },
    { start: (r) => int(r, 1, 3), next: (v) => v * 2, rule: "Each number is double the one before", spread: 4 }
  ];
  function qGreater(rand) {
    let a, b; do { a = int(rand, 3, 20); b = int(rand, 3, 20); } while (a === b);
    return {
      instruction: "Which number is greater?", visual: null,
      options: numOpts([a, b]), rule: { type: "one", valid: ["n" + Math.max(a, b)] },
      hints: ["Imagine counting up from 1. Which number do you reach later?", "Look at the tens first, then the ones."],
      explanation: Math.max(a, b) + " is greater than " + Math.min(a, b) + ".", concepts: ["compare"]
    };
  }
  function qSub(rand) {
    const a = int(rand, 9, 20), b = int(rand, 2, Math.min(9, a - 2)), d = a - b;
    return {
      instruction: "What is " + a + " − " + b + "?", visual: { kind: "equation", text: a + " − " + b + " = ?" },
      options: numOpts(nearNumbers(d, rand, 4)), rule: { type: "one", valid: ["n" + d] },
      hints: ["Start at " + a + " and count back " + b + ".", "Or think: " + b + " + ? = " + a + "."],
      explanation: a + " − " + b + " = " + d + ".", concepts: ["subtract"]
    };
  }
  function qMissing(rand) {
    const a = int(rand, 3, 9), t = int(rand, a + 2, Math.min(18, a + 9)), m = t - a;
    return {
      instruction: "Which number is missing?", visual: { kind: "equation", text: a + " + ? = " + t },
      options: numOpts(nearNumbers(m, rand, 4)), rule: { type: "one", valid: ["n" + m] },
      hints: ["Start at " + a + ". How many more steps to reach " + t + "?", "Count up from " + a + " to " + t + " on your fingers."],
      explanation: a + " + " + m + " = " + t + ".", concepts: ["missing", "add"]
    };
  }
  const WORD_PROBLEMS = [
    (a, b) => ({ text: "Juno has " + a + " berries and finds " + b + " more. How many berries does Juno have now?", ans: a + b, op: "+", c: "add" }),
    (a, b) => ({ text: "Moss has " + a + " acorns and gives " + b + " to a friend. How many acorns are left?", ans: a - b, op: "−", c: "subtract" }),
    (a, b) => ({ text: "There are " + a + " ducks on the pond. " + b + " fly away. How many ducks are still there?", ans: a - b, op: "−", c: "subtract" }),
    (a, b) => ({ text: "Pip plants " + a + " seeds in one row and " + b + " in another. How many seeds in all?", ans: a + b, op: "+", c: "add" })
  ];
  function qWord(rand) {
    const a = int(rand, 7, 14), b = int(rand, 2, 6);
    const w = pick(WORD_PROBLEMS, rand)(a, b);
    return {
      instruction: w.text, visual: null,
      options: numOpts(nearNumbers(w.ans, rand, 4)), rule: { type: "one", valid: ["n" + w.ans] },
      hints: [w.op === "+" ? "Are the groups being put together or taken apart? Together means add." : "Something is taken away, so the number gets smaller.", "Work out " + a + " " + w.op + " " + b + "."],
      explanation: a + " " + w.op + " " + b + " = " + w.ans + ".", concepts: [w.c]
    };
  }
  function qSums(rand) {
    let a, b, c, d; do { a = int(rand, 2, 9); b = int(rand, 1, 9); c = int(rand, 2, 9); d = int(rand, 1, 9); } while (a + b === c + d || Math.abs(a + b - (c + d)) > 3);
    const left = a + " + " + b, right = c + " + " + d;
    return {
      instruction: "Which is more?", visual: null,
      options: [{ id: "left", text: left, label: left }, { id: "right", text: right, label: right }],
      rule: { type: "one", valid: [a + b > c + d ? "left" : "right"] },
      hints: ["Work out each sum first, then compare.", left + " = " + (a + b) + ". Now work out " + right + "."],
      explanation: left + " = " + (a + b) + " and " + right + " = " + (c + d) + ".", concepts: ["add", "compare"]
    };
  }
  function buildNumberQuestions(mode, rand) {
    let makers;
    if (mode === "explore") makers = [qCount, qMore, qCount, qMore];
    else if (mode === "practice") makers = shuffle([qAddPics, (r) => qSeq(r, SEQ_EASY), qGreater, qAddPics, (r) => qSeq(r, SEQ_EASY)], rand);
    else makers = shuffle([qSub, qMissing, (r) => qSeq(r, SEQ_HARD), qWord, qSums, qWord], rand);
    return makers.map(m => Object.assign({ id: pid("num"), mechanic: "choose", graded: true }, m(rand), {}))
      .map(p => Object.assign(p, { say: p.instruction, seen: p.concepts.slice() }));
  }

  // ======================================================================
  // PATTERN PLAYGROUND
  // ======================================================================
  const SHAPE_IDS = ["circle", "square", "triangle", "star", "heart", "diamond"];
  const COLOR_IDS = ["berry", "sky", "sun", "leaf", "plum"];
  function distinctPieces(n, rand) {
    const shapes = sample(SHAPE_IDS, n, rand), colors = sample(COLOR_IDS, n, rand);
    return shapes.map((s, i) => piece(colors[i], s));
  }
  const pOpt = (p) => ({ id: p.id, shape: { shape: p.shape, color: p.color }, label: p.label });
  function patternNext(rand, unit, len, blankAt) {
    const parts = distinctPieces(Math.max(...unit) + 1, rand);
    const seq = [];
    for (let i = 0; i < len; i++) seq.push(parts[unit[i % unit.length]]);
    const at = blankAt == null ? len - 1 : blankAt;
    const ans = seq[at];
    const others = parts.filter(p => p.id !== ans.id);
    const extra = piece(pick(COLOR_IDS.filter(c => !parts.some(p => p.color === c)), rand), pick(SHAPE_IDS.filter(s => !parts.some(p => p.shape === s)), rand));
    const opts = shuffle([ans].concat(others).concat([extra]).slice(0, 4), rand);
    const unitNames = unit.map(i => parts[i].label).slice(0, unit.length);
    return {
      instruction: blankAt == null ? "What comes next in the pattern?" : "What is missing from the pattern?",
      visual: { kind: "pattern", seq: seq.map((p, i) => (i === at ? null : { shape: p.shape, color: p.color, label: p.label })) },
      options: opts.map(pOpt), rule: { type: "one", valid: [ans.id] },
      hints: ["Say the pattern out loud: " + seq.slice(0, Math.min(4, at)).map(p => p.label).join(", ") + "…", "The part that repeats is: " + unitNames.join(", ") + "."],
      explanation: "The pattern repeats " + unitNames.join(", ") + ", so it's the " + ans.label + ".",
      concepts: ["patterns", ans.shape]
    };
  }
  function patternTwoWay(rand) {
    const S = sample(SHAPE_IDS, 2, rand), C = sample(COLOR_IDS, 3, rand);
    const seq = [];
    for (let i = 0; i < 6; i++) seq.push(piece(C[i % 3], S[i % 2]));
    const ans = piece(C[0], S[0]);
    const opts = [ans, piece(C[1], S[0]), piece(C[0], S[1]), piece(C[2], S[1])];
    return {
      instruction: "What comes next? Watch the shapes and the colors.",
      visual: { kind: "pattern", seq: seq.map(p => ({ shape: p.shape, color: p.color, label: p.label })).concat([null]) },
      options: shuffle(opts, rand).map(pOpt), rule: { type: "one", valid: [ans.id] },
      hints: ["Two things are changing. Follow the shapes first, then the colors.", "Shapes repeat every 2. Colors repeat every 3."],
      explanation: "Shapes go " + S.map(s => SHAPES[s].name).join(", ") + " and colors go " + C.map(c => COLORS[c].name).join(", ") + " — so a " + ans.label + ".",
      concepts: ["patterns", ans.shape]
    };
  }
  function oddByShape(rand) {
    const [a, b] = sample(SHAPE_IDS, 2, rand), c = pick(COLOR_IDS, rand);
    const items = [0, 1, 2].map(i => ({ id: "same-" + i, p: piece(c, a) })).concat([{ id: "odd", p: piece(c, b) }]);
    return oddPrompt(items, rand, "These are all " + COLORS[c].name + ". Look at the shapes.", "Three are " + SHAPES[a].name + "s.",
      "The " + items[3].p.label + " is the only " + SHAPES[b].name + ".", ["odd", b]);
  }
  function oddByColor(rand) {
    const shapes = sample(SHAPE_IDS, 4, rand), [c1, c2] = sample(COLOR_IDS, 2, rand);
    const items = shapes.slice(0, 3).map((s, i) => ({ id: "same-" + i, p: piece(c1, s) })).concat([{ id: "odd", p: piece(c2, shapes[3]) }]);
    return oddPrompt(items, rand, "Every shape is different, so shape isn't the rule. What else could it be?", "Three are " + COLORS[c1].name + ".",
      "The " + items[3].p.label + " is the only one that isn't " + COLORS[c1].name + ".", ["odd", "colors"]);
  }
  function oddByCurve(rand) {
    const straight = sample(["square", "triangle", "diamond", "star"], 3, rand), colors = sample(COLOR_IDS, 4, rand);
    const items = straight.map((s, i) => ({ id: "same-" + i, p: piece(colors[i], s) })).concat([{ id: "odd", p: piece(colors[3], "circle") }]);
    return oddPrompt(items, rand, "Colors are all different. Look at the edges: straight or curved?", "Three have only straight edges.",
      "The circle is the only shape with a curved edge.", ["odd", "circle"]);
  }
  function oddPrompt(items, rand, h1, h2, expl, concepts) {
    return {
      instruction: "Which one doesn't belong?", visual: null,
      options: shuffle(items, rand).map(it => ({ id: it.id, shape: { shape: it.p.shape, color: it.p.color }, label: it.p.label })),
      rule: { type: "one", valid: ["odd"] }, hints: [h1, h2], explanation: expl, concepts
    };
  }
  function buildPatternPath(mode, rand) {
    let makers;
    if (mode === "explore") makers = [0, 0, 0, 0].map(() => (r) => patternNext(r, [0, 1], 6));
    else if (mode === "practice") makers = shuffle([(r) => patternNext(r, [0, 1, 1], 7), (r) => patternNext(r, [0, 0, 1], 7), (r) => patternNext(r, [0, 1, 2], 7), (r) => patternNext(r, [0, 1], 6, 3), oddByShape], rand);
    else makers = shuffle([patternTwoWay, (r) => patternNext(r, [0, 1, 2], 7, 4), oddByColor, oddByCurve, (r) => patternNext(r, [0, 0, 1, 1], 8, 5)], rand);
    return makers.map(m => {
      const p = Object.assign({ id: pid("pat"), mechanic: "choose", graded: true }, m(rand));
      p.say = p.instruction; p.seen = p.concepts.slice(); return p;
    });
  }

  function buildShapeSort(mode, rand) {
    let bins, items;
    if (mode === "explore") {
      const [a, b] = sample(["circle", "triangle", "square", "star"], 2, rand);
      bins = [a, b].map(s => ({ id: s, label: cap(SHAPES[s].name) + "s", shape: { shape: s, color: "ink" } }));
      items = [0, 1, 2, 3, 4, 5].map(i => { const s = i % 2 ? b : a; return piece(pick(COLOR_IDS, rand), s); })
        .map((p, i) => ({ id: "s" + i, shape: { shape: p.shape, color: p.color }, label: p.label, bins: [p.shape],
          hint: "This is a " + p.label + ". Find the " + SHAPES[p.shape].name + "s basket.", explain: SHAPES[p.shape].fact, concepts: [p.shape] }));
      return [{ id: pid("sort"), mechanic: "sort", graded: true, instruction: "Sort by shape. Put each one in its basket.", sortBy: "shape",
        bins, items: shuffle(items, rand), hints: ["Look only at the shape, not the color."], explanation: "Every shape is in the right basket.", concepts: [a, b], seen: [a, b] }];
    }
    if (mode === "practice") {
      const cols = sample(COLOR_IDS, 3, rand);
      bins = cols.map(c => ({ id: c, label: cap(COLORS[c].name), swatch: c }));
      items = [0, 1, 2, 3, 4, 5, 6].map(i => piece(cols[i % 3], pick(SHAPE_IDS, rand)))
        .map((p, i) => ({ id: "s" + i, shape: { shape: p.shape, color: p.color }, label: p.label, bins: [p.color],
          hint: "This one is " + COLORS[p.color].name + ". Find the " + COLORS[p.color].name + " basket.", explain: "It's " + COLORS[p.color].name + ", so it goes with the " + COLORS[p.color].name + " things.", concepts: ["colors"] }));
      return [{ id: pid("sort"), mechanic: "sort", graded: true, instruction: "Sort by color. Shape doesn't matter this time.", sortBy: "color",
        bins, items: shuffle(items, rand), hints: ["Look only at the color."], explanation: "Every shape is sorted by color.", concepts: ["colors"], seen: ["colors"] }];
    }
    bins = [
      { id: "three", label: "3 straight sides", note: "count the sides", shape: { shape: "triangle", color: "ink" } },
      { id: "four", label: "4 straight sides", note: "count the sides", shape: { shape: "square", color: "ink" } },
      { id: "curved", label: "Curved edges", note: "some round edges", shape: { shape: "circle", color: "ink" } }
    ];
    const pool = ["triangle", "triangle", "square", "diamond", "square", "diamond", "circle", "heart"];
    items = shuffle(pool, rand).map((s, i) => {
      const p = piece(pick(COLOR_IDS, rand), s);
      const bin = SHAPES[s].curved ? "curved" : SHAPES[s].sides === 3 ? "three" : "four";
      return { id: "s" + i, shape: { shape: p.shape, color: p.color }, label: p.label, bins: [bin],
        hint: SHAPES[s].curved ? "Run your eyes around the " + SHAPES[s].name + "'s edge. Is any part round?" : "Count the straight sides on the " + SHAPES[s].name + ".",
        explain: SHAPES[s].fact, concepts: [s] };
    });
    return [{ id: pid("sort"), mechanic: "sort", graded: true, instruction: "Sort by edges: count the straight sides.", sortBy: "sides",
      bins, items, hints: ["Count the straight sides of each shape."], explanation: "All sorted by their edges.", concepts: ["triangle", "square", "diamond", "circle"], seen: ["triangle", "square", "diamond", "circle", "heart"] }];
  }

  // ======================================================================
  // NATURE TRAIL
  // ======================================================================
  function buildHabitatHomes(mode, rand) {
    const sets = {
      explore:   [["pond", "desert"], ["ice", "farm"], ["ocean", "forest"]],
      practice:  [["pond", "desert", "ice"], ["forest", "ocean", "desert"], ["farm", "ice", "ocean"]],
      challenge: [["pond", "forest", "desert", "farm"], ["ice", "ocean", "forest", "farm"], ["ocean", "desert", "pond", "forest"]]
    };
    const nItems = { explore: 4, practice: 6, challenge: 8 }[mode];
    const binIds = pick(sets[mode], rand);
    const eligible = ANIMALS.filter(a => a.homes.some(h => binIds.includes(h)));
    // every bin gets at least one animal
    const chosen = [];
    binIds.forEach(b => {
      const c = shuffle(eligible.filter(a => a.homes.includes(b) && !chosen.includes(a)), rand)[0];
      if (c) chosen.push(c);
    });
    shuffle(eligible.filter(a => !chosen.includes(a)), rand).forEach(a => { if (chosen.length < nItems) chosen.push(a); });
    const items = shuffle(chosen, rand).map(a => {
      const valid = a.homes.filter(h => binIds.includes(h));
      return {
        id: a.id, art: a.id, label: a.name, bins: valid,
        hint: a.hint + (mode === "explore" ? " Which home has " + HABITAT[valid[0]].note + "?" : ""),
        explain: a.note, concepts: [a.id]
      };
    });
    return [{
      id: pid("hab"), mechanic: "sort", graded: true, sortBy: "habitat",
      instruction: "Help each animal find a home that suits it.", say: "Help each animal find a home that suits it. Some animals can live in more than one place.",
      bins: binIds.map(h => ({ id: h, art: "hab-" + h, label: HABITAT[h].name, note: HABITAT[h].note })),
      items, hints: ["Think about what each animal needs: water, trees, warmth, or cold?"],
      explanation: "Every animal has a home that suits it. Some, like owls and ducks, can live in more than one kind of place.",
      concepts: chosen.map(a => a.id), seen: chosen.map(a => a.id).concat(binIds.map(h => "hab-" + h))
    }];
  }

  const CYCLES = {
    plant: { concept: "cycle-plant", title: "How does a plant grow?", steps: [
      { v: "seed", label: "seed", hint: "Everything starts with a seed in the soil." },
      { v: "sprout", label: "sprout", hint: "A tiny sprout pushes up out of the seed." },
      { v: "seedling", label: "young plant", hint: "The sprout grows more leaves and becomes a young plant." },
      { v: "flower", label: "flower", hint: "A grown plant makes flowers." },
      { v: "fruit", label: "fruit", hint: "Flowers turn into fruit, which holds new seeds." }] },
    butterfly: { concept: "cycle-butterfly", title: "How does a butterfly grow?", steps: [
      { v: "egg", label: "egg", hint: "It starts as a tiny egg on a leaf." },
      { v: "caterpillar", label: "caterpillar", hint: "A caterpillar hatches and eats lots of leaves." },
      { v: "chrysalis", label: "chrysalis", hint: "The caterpillar makes a chrysalis around itself." },
      { v: "butterfly", label: "butterfly", hint: "A butterfly comes out of the chrysalis." }] },
    frog: { concept: "cycle-frog", title: "How does a frog grow?", steps: [
      { v: "frogspawn", label: "eggs", hint: "Frogs start as jelly-covered eggs in water." },
      { v: "tadpole", label: "tadpole", hint: "A tadpole with a tail hatches from the egg." },
      { v: "froglet", label: "froglet", hint: "The tadpole grows legs and becomes a froglet." },
      { v: "frog", label: "frog", hint: "The froglet's tail disappears: now it's a frog." }] },
    seasons: { concept: "seasons", title: "Put the seasons in order.", cyclic: true, steps: [
      { v: "spring", label: "spring", hint: "Spring has new blossoms." },
      { v: "summer", label: "summer", hint: "Summer is usually the warmest season." },
      { v: "autumn", label: "autumn (fall)", hint: "In autumn many leaves change color and fall." },
      { v: "winter", label: "winter", hint: "Winter is usually the coldest season." }] }
  };
  function cyclePrompt(key, mode, rand, subset) {
    const c = CYCLES[key];
    const steps = subset ? c.steps.filter(s => subset.includes(s.v)) : c.steps;
    const fixed = c.cyclic ? [] : mode === "explore" ? [0] : [];
    return {
      id: pid("cyc"), mechanic: "sequence", graded: true, kind: "steps",
      instruction: c.title + (c.cyclic ? " Start with any season." : " Start at the beginning."), say: c.title,
      tiles: shuffle(steps.map(s => ({ id: "c-" + s.v, value: s.v, art: s.v, label: s.label })), rand),
      slots: steps.length, answers: [steps.map(s => s.v)], cyclic: !!c.cyclic, fixed,
      stepHints: Object.fromEntries(steps.map(s => [s.v, s.hint])),
      hints: [c.cyclic ? "Seasons follow each other: what comes after the warm season?" : "What has to happen first?", steps.map(s => s.label).slice(0, 2).join(" comes before ") + "."],
      explanation: steps.map(s => s.label).join(" → ") + (c.cyclic ? " → and round again." : "."),
      concepts: [c.concept], seen: [c.concept].concat(steps.map(s => s.v).filter(v => ANIMAL[v]))
    };
  }
  function buildLifeCycles(mode, rand) {
    if (mode === "explore") return shuffle([
      () => cyclePrompt("plant", mode, rand, ["seed", "sprout", "flower"]),
      () => cyclePrompt("butterfly", mode, rand, ["egg", "caterpillar", "butterfly"]),
      () => cyclePrompt("frog", mode, rand, ["frogspawn", "tadpole", "frog"])], rand).map(f => f());
    if (mode === "practice") return shuffle([
      () => cyclePrompt("butterfly", mode, rand), () => cyclePrompt("frog", mode, rand),
      () => cyclePrompt("plant", mode, rand, ["seed", "sprout", "flower", "fruit"])], rand).map(f => f());
    return shuffle([() => cyclePrompt("plant", mode, rand), () => cyclePrompt("seasons", mode, rand),
      () => cyclePrompt("butterfly", mode, rand), () => cyclePrompt("frog", mode, rand)], rand).map(f => f());
  }

  function buildNatureWalk(mode, rand) {
    if (mode === "explore") {
      const cards = sample(ANIMALS, 6, rand);
      return [{ id: pid("walk"), mechanic: "explore", graded: false,
        instruction: "Tap each animal to discover a fact.", say: "Tap each animal to discover a fact.",
        cards: cards.map(a => ({ id: a.id, art: a.id, label: a.name, fact: a.fact })),
        hints: ["Tap any card. There's no wrong choice."], explanation: "You discovered six animal facts.",
        concepts: [], seen: [] }];
    }
    if (mode === "practice") {
      const cards = sample(ANIMALS, 4, rand);
      const walk = { id: pid("walk"), mechanic: "explore", graded: false,
        instruction: "Tap each animal to read its fact. Questions come next!", say: "Tap each animal to read its fact. Questions come next.",
        cards: cards.map(a => ({ id: a.id, art: a.id, label: a.name, fact: a.fact })),
        hints: ["Read each fact — you'll use them in a moment."], explanation: "Now let's see what you remember.", concepts: [], seen: [] };
      const qs = sample(cards, 3, rand).map(a => {
        const opts = shuffle(cards, rand).slice(0, 3);
        if (!opts.includes(a)) opts[0] = a;
        return { id: pid("walkq"), mechanic: "choose", graded: true,
          instruction: "Which animal " + a.q + "?", say: "Which animal " + a.q + "?",
          options: shuffle(opts, rand).map(o => ({ id: o.id, art: o.id, label: cap(o.name) })), rule: { type: "one", valid: [a.id] },
          hints: ["Think back to the facts you just read.", "This animal's fact: " + a.fact.replace(new RegExp(a.name, "i"), "It")],
          explanation: a.fact, concepts: [a.id], seen: [a.id] };
      });
      return [walk].concat(qs);
    }
    const targets = sample(ANIMALS, 5, rand);
    return targets.map(a => {
      const others = sample(ANIMALS.filter(o => o.id !== a.id), 3, rand);
      return { id: pid("riddle"), mechanic: "choose", graded: true,
        instruction: "Who am I? “" + a.riddle + "”", say: "Who am I? " + a.riddle,
        options: shuffle([a].concat(others), rand).map(o => ({ id: o.id, art: o.id, label: cap(o.name) })), rule: { type: "one", valid: [a.id] },
        wrongHints: Object.fromEntries(others.map(o => [o.id, cap(o.name) + ": " + o.fact + " Read the riddle again."])),
        hints: ["Pick out the most unusual clue in the riddle.", "Clue: " + a.fact],
        explanation: "It's the " + a.name + ". " + a.fact, concepts: [a.id], seen: [a.id] };
    });
  }

  // ======================================================================
  // LOGIC LAB
  // ======================================================================
  const LEVELS = {
    explore: [
      { w: 4, h: 4, start: { x: 0, y: 1 }, goal: { x: 3, y: 1 }, rocks: [] },
      { w: 4, h: 4, start: { x: 1, y: 0 }, goal: { x: 1, y: 3 }, rocks: [] },
      { w: 4, h: 4, start: { x: 0, y: 3 }, goal: { x: 2, y: 1 }, rocks: [] },
      { w: 4, h: 4, start: { x: 3, y: 0 }, goal: { x: 1, y: 2 }, rocks: [] }
    ],
    practice: [
      { w: 5, h: 5, start: { x: 0, y: 2 }, goal: { x: 4, y: 2 }, rocks: [[2, 2]] },
      { w: 5, h: 5, start: { x: 0, y: 0 }, goal: { x: 4, y: 4 }, rocks: [[1, 1], [2, 2], [3, 3]] },
      { w: 5, h: 5, start: { x: 2, y: 4 }, goal: { x: 2, y: 0 }, rocks: [[1, 2], [2, 2], [3, 2]] },
      { w: 5, h: 5, start: { x: 0, y: 4 }, goal: { x: 4, y: 0 }, rocks: [[1, 3], [2, 2], [3, 1]] },
      { w: 5, h: 5, start: { x: 4, y: 4 }, goal: { x: 0, y: 1 }, rocks: [[0, 2], [1, 2], [2, 2], [3, 0]] }
    ],
    challenge: [
      { w: 5, h: 5, start: { x: 0, y: 0 }, key: { x: 4, y: 1 }, goal: { x: 0, y: 4 }, rocks: [[2, 0], [2, 1], [2, 3], [3, 3]] },
      { w: 5, h: 5, start: { x: 2, y: 2 }, key: { x: 0, y: 4 }, goal: { x: 4, y: 0 }, rocks: [[1, 2], [2, 1], [3, 2], [1, 3]] },
      { w: 5, h: 5, start: { x: 0, y: 4 }, key: { x: 2, y: 0 }, goal: { x: 4, y: 4 }, rocks: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]] },
      { w: 5, h: 5, start: { x: 4, y: 4 }, key: { x: 0, y: 0 }, goal: { x: 4, y: 0 }, rocks: [[2, 0], [2, 1], [2, 3], [2, 4]] }
    ]
  };
  function buildCodeSnake(mode, rand) {
    const order = mode === "explore" ? LEVELS.explore : mode === "practice" ? LEVELS.practice : LEVELS.challenge;
    return order.map((lv, i) => {
      const sol = L.solveLevel(lv);
      const level = Object.assign({}, lv, { maxMoves: mode === "challenge" ? sol.moves + 2 : 12 });
      const instr = lv.key ? "Get the key first, then reach the leaf. Use " + level.maxMoves + " arrows or fewer."
        : lv.rocks.length ? "Plan a path around the rocks to the leaf, then press Run." : "Add arrows to reach the leaf, then press Run.";
      return { id: pid("code"), mechanic: "plan", graded: true, level, levelNo: i + 1,
        instruction: instr, say: instr, minMoves: sol.moves,
        hints: [lv.key ? "Plan two trips: start → key, then key → leaf." : "Count the squares: how far across, and how far up or down?",
          "One route that works starts with: " + sol.path.slice(0, Math.min(3, sol.path.length)).map(d => ARROW[d]).join(" ") + " …"],
        explanation: "There's more than one route — any path that reaches the leaf works. The shortest uses " + sol.moves + " arrows.",
        concepts: ["arrows"].concat(lv.rocks.length ? ["obstacles"] : []).concat(lv.key ? ["keys"] : []), seen: ["arrows"] };
    });
  }
  const ARROW = { up: "↑", down: "↓", left: "←", right: "→" };

  // ======================================================================
  // EVERYDAY ADVENTURES
  // ======================================================================
  const ROUTINES = {
    handwashing: { title: "Wash your hands", steps: [
      { v: "wet", label: "Wet hands", hint: "Hands get wet first, so the soap can lather." },
      { v: "soap", label: "Add soap", hint: "Soap goes on after your hands are wet." },
      { v: "scrub", label: "Scrub for 20 seconds", hint: "Scrub once the soap is on — bubbles everywhere!" },
      { v: "rinse", label: "Rinse", hint: "Rinse after scrubbing to wash the bubbles away." },
      { v: "dry", label: "Dry with a towel", hint: "Drying comes last." }], explore: ["wet", "soap", "rinse"] },
    teeth: { title: "Brush your teeth", steps: [
      { v: "toothpaste", label: "Put toothpaste on the brush", hint: "The brush needs toothpaste before brushing." },
      { v: "brush", label: "Brush all your teeth", hint: "Brush once there's toothpaste on the brush." },
      { v: "spit", label: "Spit into the sink", hint: "Spit after brushing." },
      { v: "cup", label: "Rinse the brush", hint: "Rinsing the brush is the last tidy-up step." }], explore: ["toothpaste", "brush", "spit"] },
    planting: { title: "Plant a seed", steps: [
      { v: "shovel", label: "Dig a small hole", hint: "You need a hole before the seed can go in." },
      { v: "seed", label: "Drop in the seed", hint: "The seed goes into the hole." },
      { v: "soil", label: "Cover with soil", hint: "Cover the seed once it's in the hole." },
      { v: "wateringcan", label: "Water it", hint: "Water the soil after the seed is covered." }], explore: ["shovel", "seed", "wateringcan"] },
    sandwich: { title: "Make a sandwich", steps: [
      { v: "bread", label: "Lay out a slice of bread", hint: "Start with bread to build on." },
      { v: "spread", label: "Add a spread", hint: "Spread goes on the bread." },
      { v: "filling", label: "Add the filling", hint: "The filling goes on top of the spread." },
      { v: "sandwich", label: "Put the top slice on", hint: "The top slice goes on last." }], explore: ["bread", "filling", "sandwich"] }
  };
  function routinePrompt(key, mode, rand) {
    const r = ROUTINES[key];
    const steps = mode === "explore" ? r.steps.filter(s => r.explore.includes(s.v)) : r.steps;
    // Challenge: one card from a different routine is mixed in and must be left out.
    const extra = mode === "challenge" ? pick(Object.keys(ROUTINES).filter(k => k !== key).flatMap(k => ROUTINES[k].steps), rand) : null;
    const tileSteps = extra ? steps.concat([extra]) : steps;
    return {
      id: pid("steps"), mechanic: "sequence", graded: true, kind: "steps",
      instruction: r.title + (extra ? ": order the steps. One card belongs to a different job." : ": put the steps in order."),
      say: r.title + ". Put the steps in order." + (extra ? " One card belongs to a different job." : ""),
      tiles: shuffle(tileSteps.map(s => ({ id: "r-" + s.v, value: s.v, art: s.v, label: s.label })), rand),
      slots: steps.length, answers: [steps.map(s => s.v)], fixed: mode === "explore" ? [0] : [],
      stepHints: Object.fromEntries(steps.map(s => [s.v, s.hint])),
      hints: ["What has to happen first, before anything else can?", steps[0].label + " comes first, then " + steps[1].label.toLowerCase() + "."],
      explanation: steps.map(s => s.label).join(" → ") + ".", concepts: [key], seen: [key]
    };
  }
  function buildStepByStep(mode, rand) {
    const keys = mode === "explore" ? sample(Object.keys(ROUTINES), 3, rand) : shuffle(Object.keys(ROUTINES), rand);
    return keys.map(k => routinePrompt(k, mode, rand));
  }

  const WEATHER = {
    rain:  { concept: "rain-gear", art: "rain",  scene: "It's raining hard outside.", need: "keep you dry", valid: ["raincoat", "boots", "umbrella"], invalid: ["sunglasses", "shorts", "tshirt"],
      why: { sunglasses: "Sunglasses shade your eyes, but they won't keep rain off.", shorts: "Shorts are comfy, but they won't keep you dry.", tshirt: "A T-shirt soaks up rain — it won't keep you dry." } },
    snow:  { concept: "snow-gear", art: "snow",  scene: "It's cold and snowy today.", need: "keep you warm", valid: ["coat", "mittens", "scarf", "boots"], invalid: ["sunglasses", "shorts", "tshirt"],
      why: { sunglasses: "Sunglasses can help with bright snow, but they don't keep you warm.", shorts: "Shorts leave your legs out in the cold.", tshirt: "A T-shirt alone is too thin for snow." } },
    sun:   { concept: "sun-gear", art: "summer", scene: "It's hot and very sunny.", need: "protect you from strong sun", valid: ["sunhat", "sunglasses"], invalid: ["mittens", "scarf", "coat"],
      why: { mittens: "Mittens are for cold hands, not sun.", scarf: "A scarf keeps your neck warm — you won't need that in the heat.", coat: "A winter coat would make you too hot." } },
    wind:  { concept: "wind-gear", art: "windy", scene: "It's cool and windy.", need: "keep the chilly wind off", valid: ["coat", "scarf"], invalid: ["sunglasses", "shorts"],
      why: { sunglasses: "Sunglasses won't keep you warm in the wind.", shorts: "Shorts leave your legs out in the chilly wind." } }
  };
  const GEAR_LABEL = { raincoat: "raincoat", boots: "boots", umbrella: "umbrella", sunglasses: "sunglasses", shorts: "shorts", tshirt: "T-shirt", coat: "warm coat", mittens: "mittens", scarf: "scarf", sunhat: "sun hat",
    blanket: "blanket", sandwich: "sandwich", bottle: "water bottle", pillow: "pillow", toothbrush: "toothbrush", apple: "apple", ball: "ball" };
  function weatherPrompt(key, mode, rand) {
    const w = WEATHER[key];
    const k = mode === "explore" ? 1 : 2;
    const validShown = mode === "challenge" ? w.valid.slice() : sample(w.valid, Math.min(w.valid.length, k + 1), rand);
    const invalidShown = sample(w.invalid, mode === "explore" ? 2 : Math.min(3, w.invalid.length), rand);
    const rule = mode === "challenge" ? { type: "all", valid: validShown } : k === 1 ? { type: "one", valid: validShown } : { type: "some", valid: validShown, n: k };
    const instr = mode === "challenge" ? w.scene + " Pick everything that would " + w.need + "."
      : w.scene + " Pick " + (k === 1 ? "one thing" : "two things") + " that would " + w.need + ".";
    return {
      id: pid("wear"), mechanic: "choose", graded: true, scene: w.art,
      instruction: instr, say: instr,
      options: shuffle(validShown.concat(invalidShown), rand).map(id => ({ id, art: id, label: cap(GEAR_LABEL[id]) })),
      rule, wrongHints: w.why,
      hints: ["Think about the weather: what job does each thing do?", "Look for things that " + w.need + "."],
      explanation: validShown.map(v => GEAR_LABEL[v]).join(", ") + (validShown.length > 1 ? " all " : " ") + "help" + (validShown.length > 1 ? "" : "s") + " " + w.need + ".",
      concepts: [w.concept], seen: [w.concept]
    };
  }
  function picnicPrompt(mode, rand) {
    const list = ["blanket", "sandwich", "bottle"];
    const extras = sample(["pillow", "toothbrush", "ball", "mittens"], mode === "challenge" ? 2 : 2, rand);
    const rain = mode === "challenge";
    const opts = list.concat(extras).concat(rain ? ["umbrella", "raincoat"] : []);
    const instr = rain ? "Picnic list: blanket, sandwich, water bottle — plus ONE thing in case it rains. Pack it!" : "Picnic list: blanket, sandwich, water bottle. Pack exactly what's on the list.";
    const why = Object.fromEntries(extras.map(e => [e, "The " + GEAR_LABEL[e] + " isn't on the list. Check the list again."]));
    return {
      id: pid("picnic"), mechanic: "choose", graded: true, scene: "basket", checklist: list.map(l => GEAR_LABEL[l]),
      instruction: instr, say: instr,
      options: shuffle(opts, rand).map(id => ({ id, art: id, label: cap(GEAR_LABEL[id]) })),
      rule: rain ? { type: "set", required: list, groups: [{ ids: ["umbrella", "raincoat"], n: 1 }] } : { type: "all", valid: list },
      wrongHints: why,
      hints: ["Read the list one item at a time and find each thing.", rain ? "Pack all three list items, and then just one rain item: an umbrella or a raincoat." : "There are three things on the list."],
      explanation: rain ? "Blanket, sandwich, water bottle — and an umbrella or raincoat both work for rain." : "Blanket, sandwich, and water bottle: everything on the list.",
      concepts: ["picnic"], seen: ["picnic"]
    };
  }
  function buildWeather(mode, rand) {
    const keys = shuffle(Object.keys(WEATHER), rand).slice(0, mode === "explore" ? 3 : 4);
    const ps = keys.map(k => weatherPrompt(k, mode, rand));
    if (mode !== "explore") ps.push(picnicPrompt(mode, rand));
    return ps;
  }

  const KIND = [
    { who: "rabbit", text: "Juno the rabbit dropped a whole box of crayons on the floor.",
      good: ["Help pick them up", "Ask, “Do you want some help?”"], nuance: ["Tell a grown-up if you can't reach them all"],
      not: [{ t: "Walk over them and keep going", h: "Walking over them could break the crayons. What could help Juno?" }],
      expl: "Helping, or asking if Juno wants help, are both kind ways to respond." },
    { who: "duck", text: "Pip the duckling is new and standing alone at the playground.",
      good: ["Say hello and ask Pip to play", "Show Pip where the swings are"], nuance: ["Smile and wave, then let Pip choose"],
      not: [{ t: "Point at Pip and whisper", h: "Whispering about someone can make them feel left out. What would make Pip feel welcome?" }],
      expl: "Saying hello or showing Pip around helps someone new feel welcome." },
    { who: "squirrel", text: "Moss the squirrel's block tower fell down. Moss looks upset.",
      good: ["Ask Moss what happened", "Offer to help build it again"], nuance: ["Give Moss some space if Moss asks for it"],
      not: [{ t: "Say, “It wasn't a good tower anyway”", h: "Those words might make Moss feel worse. What could help instead?" }],
      expl: "Asking, offering help, or giving space if asked are all caring choices." },
    { who: "rabbit", text: "You and Juno both want to use the red paint.",
      good: ["Take turns with it", "Share the paint pot between you"], nuance: ["Pick a different color for now"],
      not: [{ t: "Grab the paint and run off", h: "Grabbing means Juno misses out. How could you both get a go?" }],
      expl: "Taking turns or sharing means you both get to paint." },
    { who: "duck", text: "You bump into Pip by accident and Pip's book falls down.",
      good: ["Say sorry and pick up the book", "Ask, “Are you okay?”"], nuance: ["Check that the book isn't damaged"],
      not: [{ t: "Pretend it didn't happen", h: "It was an accident, and saying so helps. What could you say or do?" }],
      expl: "Accidents happen. Saying sorry and helping fix it is a kind response." },
    { who: "squirrel", text: "Moss has an idea for the game that's different from yours.",
      good: ["Listen to Moss's idea", "Say, “Let's try both ideas”"], nuance: ["Explain your idea calmly too"],
      not: [{ t: "Say, “Your idea is silly”", h: "Calling an idea silly can hurt. How could you show you're listening?" }],
      expl: "Listening and trying both ideas helps everyone feel heard." }
  ];
  function buildKindChoices(mode, rand) {
    const n = mode === "explore" ? 3 : mode === "practice" ? 4 : 5;
    return sample(KIND, n, rand).map((k, i) => {
      let good = k.good.slice(), options = [];
      if (mode === "explore") options = [pick(good, rand)];
      else if (mode === "practice") options = good.slice();
      else options = good.concat(k.nuance);
      const opts = options.map((t, j) => ({ id: "kind-" + j, text: t, label: t, good: true }))
        .concat(k.not.map((x, j) => ({ id: "not-" + j, text: x.t, label: x.t, good: false })));
      const validIds = opts.filter(o => o.good).map(o => o.id);
      const all = mode === "challenge";
      const instr = all ? "Pick every kind choice. (There's more than one!)" : "What could you do? Pick a kind choice.";
      return {
        id: pid("kind"), mechanic: "choose", graded: true, story: { who: k.who, text: k.text },
        instruction: instr, say: k.text + " " + instr,
        options: shuffle(opts, rand).map(o => ({ id: o.id, text: o.text, label: o.label })),
        rule: all ? { type: "all", valid: validIds } : { type: "one", valid: validIds },
        wrongHints: Object.fromEntries(k.not.map((x, j) => ["not-" + j, x.h])),
        hints: ["Think: which choice would help, include, or show you care?", all ? "There are " + validIds.length + " kind choices here." : "Look for a choice that helps."],
        explanation: k.expl, concepts: ["kindness"], seen: ["kindness"]
      };
    });
  }

  // ======================================================================
  // ACTIVITIES
  // ======================================================================
  const ACTIVITIES = [
    { id: "snack-hunt", world: "word", title: "Snack Hunt", mechanic: "collect", art: "pear",
      objective: "Name fruits and vegetables", example: "Steer the snake to the pear.",
      modes: { explore: "Eat any snack to hear its name.", practice: "Find the snack you hear named.", challenge: "Read a clue, then find the snack." },
      build: buildSnackHunt },
    { id: "letter-line", world: "word", title: "Letter Line", mechanic: "sequence", art: "s-letters",
      objective: "Spell words letter by letter", example: "Put the letters in order to spell FROG.",
      modes: { explore: "Copy 3-letter words.", practice: "Spell 4-letter words you hear.", challenge: "Spell longer words from a picture, with a spare letter." },
      build: buildLetterLine },
    { id: "berry-count", world: "number", title: "Berry Basket", mechanic: "collect", art: "basket",
      objective: "Count an exact amount", example: "Collect exactly five berries.",
      modes: { explore: "Counts to 5 with a filling frame.", practice: "Counts up to 8.", challenge: "Work out a sum, then collect it." },
      build: buildBerryCount },
    { id: "number-questions", world: "number", title: "Meadow Math", mechanic: "choose", art: "s-plus",
      objective: "Compare, add, subtract, and find number patterns", example: "Complete 2, 4, 6, __.",
      modes: { explore: "Count and compare berry groups.", practice: "Adding with pictures, number patterns.", challenge: "Subtraction, missing numbers, word problems." },
      build: buildNumberQuestions },
    { id: "pattern-path", world: "pattern", title: "Pattern Path", mechanic: "choose", art: "s-pattern",
      objective: "Continue patterns and find the odd one out", example: "Red circle, blue square, red circle… what's next?",
      modes: { explore: "Simple two-part patterns.", practice: "Longer patterns and odd-one-out.", challenge: "Two changes at once and trickier rules." },
      build: buildPatternPath },
    { id: "shape-sort", world: "pattern", title: "Shape Sort", mechanic: "sort", art: "s-sort",
      objective: "Sort shapes by a rule", example: "Put each shape in the right basket.",
      modes: { explore: "Sort by shape into 2 baskets.", practice: "Sort by color into 3 baskets.", challenge: "Sort by counting straight sides." },
      build: buildShapeSort },
    { id: "habitat-homes", world: "nature", title: "Habitat Homes", mechanic: "sort", art: "hab-pond",
      objective: "Match animals with habitats that suit them", example: "Where could a duck live?",
      modes: { explore: "2 habitats with clues.", practice: "3 habitats, 6 animals.", challenge: "4 habitats; some animals fit more than one." },
      build: buildHabitatHomes },
    { id: "life-cycles", world: "nature", title: "Life Cycles", mechanic: "sequence", art: "sprout",
      objective: "Order how living things grow and change", example: "Seed, sprout, flower — what comes next?",
      modes: { explore: "3 stages, first one placed.", practice: "Full butterfly and frog cycles.", challenge: "5-stage plants and the seasons cycle." },
      build: buildLifeCycles },
    { id: "nature-walk", world: "nature", title: "Nature Walk", mechanic: "explore", art: "owl",
      objective: "Learn facts about animals", example: "Tap the owl to discover a fact.",
      modes: { explore: "Discover six animal facts.", practice: "Read facts, then answer questions.", challenge: "Solve “Who am I?” riddles." },
      build: buildNatureWalk },
    { id: "code-snake", world: "logic", title: "Code the Snake", mechanic: "plan", art: "s-arrows",
      objective: "Plan a sequence of moves and debug it", example: "→ → ↓ then Run to reach the leaf.",
      modes: { explore: "Small grids, no rocks.", practice: "Plan around rocks.", challenge: "Get the key first, with an arrow limit." },
      build: buildCodeSnake },
    { id: "step-by-step", world: "everyday", title: "Step by Step", mechanic: "sequence", art: "soap",
      objective: "Order everyday routines", example: "Wet hands, soap, scrub, rinse, dry.",
      modes: { explore: "3 steps, first one placed.", practice: "Full 4–5 step routines.", challenge: "Full routines, plus a card that doesn't belong." },
      build: buildStepByStep },
    { id: "ready-weather", world: "everyday", title: "Ready for Weather", mechanic: "choose", art: "umbrella",
      objective: "Choose what helps for the weather, and pack from a list", example: "Pick two things for a rainy day.",
      modes: { explore: "Pick one helpful thing.", practice: "Pick two, then pack a picnic list.", challenge: "Pick everything that helps; plan for rain." },
      build: buildWeather },
    { id: "kind-choices", world: "everyday", title: "Kind Choices", mechanic: "choose", art: "s-kind",
      objective: "Think about kind ways to respond", example: "A friend dropped their crayons. What could you do?",
      modes: { explore: "Two choices to think about.", practice: "Several kind choices fit.", challenge: "Find every kind choice." },
      build: buildKindChoices }
  ];
  const ACTIVITY = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]));

  const ROUND_SIZE_NOTE = { explore: "short round", practice: "a few goals", challenge: "a longer round" };

  function buildRound(activityId, mode, seed) {
    const a = ACTIVITY[activityId];
    if (!a) throw new Error("unknown activity " + activityId);
    const rand = L.rng(seed == null ? Date.now() : seed);
    const prompts = a.build(mode, rand);
    prompts.forEach(p => {
      p.activity = activityId; p.world = a.world; p.mode = mode;
      p.say = p.say || p.instruction;
      p.seen = p.seen || p.concepts || [];
      p.hints = p.hints && p.hints.length ? p.hints : ["Take another look."];
    });
    return prompts;
  }

  // ======================================================================
  // MY SNAKE (earned cosmetics; no purchases)
  // ======================================================================
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

  return { WORLDS, MODE_INFO, CONCEPTS, CONCEPT, conceptWorld, ACTIVITIES, ACTIVITY, buildRound,
    COSMETICS, COSMETIC_LIST, COLORS, SHAPES, FOODS, FOOD, ANIMALS, ANIMAL, HABITATS, LEVELS, CYCLES, ROUTINES, WEATHER, KIND, ARROW, ROUND_SIZE_NOTE };
});
