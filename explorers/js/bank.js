/* bank.js — Snake Explorers: the authored content bank (pure data).
 * Every record has a stable id. Builders in content.js turn these into
 * prompts; ids become the canonical "cid" used to avoid repeats.
 * Facts were written to be accurate without sweeping "all/never" claims.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SE_Bank = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ------------------------------------------------------------------ WORD GARDEN
  const FOODS = [
    { id: "apple", name: "apple", look: "round and red, with a little stem", clue: "a round fruit that grows on trees and has a crunchy bite", fact: "Apples grow on trees and can be red, green, or yellow." },
    { id: "banana", name: "banana", look: "long, curved, and yellow", clue: "a long, curved fruit inside a peel you open", fact: "Bananas grow in big bunches called hands." },
    { id: "grapes", name: "grapes", look: "small, round, and purple, in a bunch", clue: "small round fruits that grow together in a bunch", fact: "Grapes grow on climbing plants called vines.", plural: true },
    { id: "strawberry", name: "strawberry", look: "red, with tiny seeds on the outside", clue: "a red berry that wears its seeds on the outside", fact: "A strawberry has about 200 tiny seeds on its skin." },
    { id: "orange", name: "orange", look: "round and orange, like a ball", clue: "a round fruit with the same name as its color", fact: "Inside an orange are sections called segments." },
    { id: "pear", name: "pear", look: "green, wide at the bottom and narrow at the top", clue: "a fruit that is wide at the bottom and narrow at the top", fact: "Pears ripen from the inside out." },
    { id: "carrot", name: "carrot", look: "long and orange, with green leaves on top", clue: "a long orange root that crunches", fact: "A carrot is a root: the part of the plant that grows under the soil." },
    { id: "broccoli", name: "broccoli", look: "green, like a tiny tree", clue: "a green vegetable that looks like a little tree", fact: "Broccoli heads are made of many tiny flower buds." },
    { id: "corn", name: "corn", look: "yellow, with rows of kernels", clue: "a yellow vegetable with rows of kernels on a cob", fact: "The kernels on a cob of corn grow in rows." },
    { id: "tomato", name: "tomato", look: "round, red, and shiny, with a green top", clue: "a red, juicy food full of seeds, often made into sauce", fact: "Tomatoes grow on vines and are full of seeds." },
    { id: "peas", name: "peas", look: "little green balls in a pod", clue: "small green balls that grow lined up in a pod", fact: "Peas grow inside a pod, lined up in a row.", plural: true },
    { id: "lemon", name: "lemon", look: "yellow and oval, with pointy ends", clue: "a yellow fruit that tastes very sour", fact: "Lemons taste sour because of citric acid." },
    { id: "cherries", name: "cherries", look: "small, round, and red, on long stems", clue: "small red fruits that hang in pairs on long stems", fact: "Each cherry has one hard stone inside.", plural: true },
    { id: "watermelon", name: "watermelon", look: "big and green outside, red inside", clue: "a big fruit that is green outside and red inside", fact: "A watermelon is mostly water." },
    { id: "potato", name: "potato", look: "lumpy and brown, with little spots", clue: "a brown vegetable that grows under the ground and can be mashed", fact: "Potatoes grow underground. Their little spots are called eyes." },
    { id: "mushroom", name: "mushroom", look: "a round cap on a short stem", clue: "a food with a round cap and a stem that is not a plant at all", fact: "A mushroom is not a plant — it is a fungus." },
    { id: "cucumber", name: "cucumber", look: "long and green, with bumpy skin", clue: "a long green vegetable that is cool and crunchy inside", fact: "Cucumbers grow on climbing vines." },
    { id: "peach", name: "peach", look: "round and orange-pink, with fuzzy skin", clue: "a round fruit with soft, fuzzy skin and one big stone inside", fact: "A peach has fuzzy skin and one big stone in the middle." }
  ];
  // "Find a food that…" — several answers can be right; distractors clearly are not.
  const FOOD_CATEGORIES = [
    { id: "underground", ask: "something that grows under the ground", valid: ["carrot", "potato"], not: ["apple", "cherries", "grapes", "pear", "peach", "orange", "lemon", "strawberry"], why: "Carrots and potatoes both grow under the soil." },
    { id: "tree-fruit", ask: "a fruit that grows on a tree", valid: ["apple", "pear", "orange", "lemon", "cherries", "peach"], not: ["carrot", "potato", "broccoli", "peas", "corn", "mushroom", "strawberry", "watermelon"], why: "Apples, pears, oranges, lemons, cherries, and peaches all grow on trees." },
    { id: "pod", ask: "a vegetable that grows in a pod", valid: ["peas"], not: ["carrot", "potato", "tomato", "corn", "broccoli", "cucumber", "mushroom"], why: "Peas grow lined up inside a pod." },
    { id: "fungus", ask: "the food that is not a plant at all", valid: ["mushroom"], not: ["carrot", "apple", "peas", "corn", "tomato", "pear", "broccoli"], why: "A mushroom is a fungus, not a plant." },
    { id: "sour", ask: "a fruit that tastes very sour", valid: ["lemon"], not: ["banana", "strawberry", "watermelon", "peach", "pear"], why: "Lemons are famous for tasting sour." },
    { id: "seeds-out", ask: "a fruit with its seeds on the outside", valid: ["strawberry"], not: ["apple", "orange", "pear", "peach", "watermelon", "banana", "cherries"], why: "A strawberry's seeds sit on its skin." },
    { id: "green-veg", ask: "a green vegetable", valid: ["broccoli", "peas", "cucumber"], not: ["carrot", "corn", "tomato", "potato", "strawberry", "banana", "orange"], why: "Broccoli, peas, and cucumbers are green vegetables." },
    { id: "one-stone", ask: "a fruit with one big stone inside", valid: ["peach", "cherries"], not: ["banana", "grapes", "strawberry", "orange", "watermelon", "pear"], why: "Peaches and cherries each have one hard stone." },
    { id: "vine", ask: "something that grows on a climbing vine", valid: ["grapes", "cucumber", "tomato"], not: ["apple", "carrot", "potato", "pear", "mushroom", "broccoli"], why: "Grapes, cucumbers, and tomatoes grow on vines." }
  ];

  // Letter Line words: [word, art, concept]. Grouped by length band per mode.
  const WORDS = {
    explore: [["sun", "summer", "sun"], ["bee", "bee", "bee"], ["owl", "owl", "owl"], ["cow", "cow", "cow"], ["hat", "sunhat", "hat"],
      ["cup", "cup", "word-cup"], ["egg", "egg", "word-egg"], ["fox", "fox", "fox"], ["bat", "bat", "bat"], ["key", "key", "word-key"],
      ["cat", "cat", "word-cat"], ["dog", "dog", "word-dog"], ["pig", "pig", "word-pig"], ["ant", "ant", "word-ant"], ["hen", "hen", "word-hen"], ["bed", "room-bedroom", "word-bed"], ["tub", "room-bathroom", "word-tub"]],
    practice: [["pear", "pear", "pear"], ["corn", "corn", "corn"], ["frog", "frog", "frog"], ["fish", "fish", "fish"], ["duck", "duck", "duck"],
      ["leaf", "leaf", "leaf"], ["peas", "peas", "peas"], ["crab", "crab", "crab"], ["rock", "rock", "word-rock"], ["soap", "soap", "word-soap"],
      ["ball", "ball", "word-ball"], ["rain", "rain", "word-rain"], ["snow", "snow", "word-snow"], ["moon", "moon", "word-moon"], ["deer", "deer", "deer"], ["seed", "seed", "word-seed"]],
    challenge: [["apple", "apple", "apple"], ["lemon", "lemon", "lemon"], ["grapes", "grapes", "grapes"], ["carrot", "carrot", "carrot"], ["banana", "banana", "banana"],
      ["tomato", "tomato", "tomato"], ["orange", "orange", "orange"], ["camel", "camel", "camel"], ["snail", "snail", "snail"], ["mouse", "mouse", "mouse"],
      ["robin", "robin", "robin"], ["whale", "whale", "whale"], ["turtle", "turtle", "turtle"], ["penguin", "penguin", "penguin"], ["rabbit", "rabbit", "rabbit"],
      ["flower", "flower", "word-flower"], ["bread", "bread", "word-bread"], ["boots", "boots", "word-boots"], ["scarf", "scarf", "word-scarf"], ["shovel", "shovel", "word-shovel"],
      ["pillow", "pillow", "word-pillow"], ["basket", "basket", "word-basket"], ["potato", "potato", "potato"], ["peach", "peach", "peach"]]
  };
  const WORD_FACTS = {
    "word-cup": "A cup holds a drink.", "word-egg": "Birds, turtles, and many other animals hatch from eggs.", "word-key": "A key opens a lock.",
    "word-rock": "Rocks are not alive; they are made of minerals.", "word-soap": "Soap helps lift dirt and germs off your skin.", "word-ball": "A ball is round, so it rolls.",
    "word-rain": "Rain is water falling from clouds.", "word-snow": "Snow is made of tiny ice crystals.", "word-moon": "The Moon shines because it reflects sunlight.",
    "word-seed": "A seed can grow into a new plant.", "word-flower": "Flowers help plants make seeds.", "word-bread": "Bread is baked from flour and water.",
    "word-boots": "Boots protect your feet.", "word-scarf": "A scarf keeps your neck warm.", "word-shovel": "A shovel helps you dig.",
    "word-pillow": "A pillow is soft to rest your head on.", "word-basket": "A basket is woven to carry things.",
    "word-cat": "Cats use their whiskers to sense the space around them.", "word-dog": "Dogs have a strong sense of smell.", "word-pig": "Pigs roll in mud to keep cool.",
    "word-ant": "Ants can carry things much heavier than their own bodies.", "word-hen": "A hen is a grown-up female chicken.", "word-bed": "A bed is where you sleep.", "word-tub": "A tub holds water for a bath."
  };

  // Sentence Builder. words: tiles in correct order. alt: other accepted orders.
  // A capital first word and a full stop on the last word keep each answer clear.
  const SENTENCES = {
    explore: [
      { id: "frog-hops", art: "frog", words: ["The", "frog", "hops."] },
      { id: "duck-swims", art: "duck", words: ["The", "duck", "swims."] },
      { id: "bee-buzzes", art: "bee", words: ["The", "bee", "buzzes."] },
      { id: "owl-hoots", art: "owl", words: ["The", "owl", "hoots."] },
      { id: "sun-shines", art: "summer", words: ["The", "sun", "shines."] },
      { id: "snail-crawls", art: "snail", words: ["The", "snail", "crawls."] },
      { id: "cow-moos", art: "cow", words: ["The", "cow", "moos."] },
      { id: "rain-falls", art: "rain", words: ["The", "rain", "falls."] },
      { id: "crab-walks", art: "crab", words: ["The", "crab", "walks."] },
      { id: "fox-runs", art: "fox", words: ["The", "fox", "runs."] }
    ],
    practice: [
      { id: "robin-sings", art: "robin", words: ["The", "robin", "can", "sing."] },
      { id: "fish-fins", art: "fish", words: ["The", "fish", "has", "fins."] },
      { id: "penguin-swims", art: "penguin", words: ["The", "penguin", "can", "swim."] },
      { id: "camel-humps", art: "camel", words: ["The", "camel", "has", "humps."] },
      { id: "squirrel-climbs", art: "squirrel", words: ["The", "squirrel", "climbs", "trees."] },
      { id: "bees-flowers", art: "bee", words: ["Bees", "visit", "the", "flowers."] },
      { id: "moon-night", art: "moon", words: ["The", "moon", "shines", "at", "night."] },
      { id: "wash-hands", art: "soap", words: ["I", "wash", "my", "hands."] },
      { id: "whale-big", art: "whale", words: ["The", "whale", "is", "very", "big."] },
      { id: "deer-woods", art: "deer", words: ["The", "deer", "lives", "in", "woods."] },
      { id: "frog-log", art: "frog", words: ["The", "frog", "sits", "on", "a", "log."] },
      { id: "cow-grass", art: "cow", words: ["The", "cow", "eats", "green", "grass."] },
      { id: "bats-night", art: "bat", words: ["Bats", "fly", "at", "night."] },
      { id: "turtle-shell", art: "turtle", words: ["The", "turtle", "has", "a", "shell."] }
    ],
    challenge: [
      { id: "caterpillar-butterfly", art: "butterfly", words: ["The", "caterpillar", "turns", "into", "a", "butterfly."], spare: "We" },
      { id: "polar-ice", art: "polarbear", words: ["Polar", "bears", "hunt", "on", "the", "sea", "ice."], spare: "They" },
      { id: "tadpole-frog", art: "tadpole", words: ["A", "tadpole", "grows", "legs", "and", "becomes", "a", "frog."], spare: "Is" },
      { id: "seeds-need", art: "sprout", words: ["Seeds", "need", "water", "and", "light", "to", "grow."], alt: [["Seeds", "need", "light", "and", "water", "to", "grow."]], spare: "We" },
      { id: "owl-night", art: "owl", words: ["The", "owl", "hunts", "for", "mice", "at", "night."], spare: "They" },
      { id: "penguin-wings", art: "penguin", words: ["Penguins", "use", "their", "wings", "to", "swim."], spare: "We" },
      { id: "bats-hang", art: "bat", words: ["Bats", "hang", "upside", "down", "to", "sleep."], spare: "Is" },
      { id: "whale-blowhole", art: "whale", words: ["Whales", "breathe", "air", "through", "a", "blowhole."], spare: "They" },
      { id: "snail-shell", art: "snail", words: ["The", "snail", "carries", "its", "shell", "everywhere."], spare: "We" },
      { id: "wash-before-eat", art: "soap", words: ["Wash", "your", "hands", "before", "you", "eat."], spare: "They" },
      { id: "bees-pollen", art: "bee", words: ["Bees", "carry", "pollen", "from", "flower", "to", "flower."], spare: "We" },
      { id: "fox-tail", art: "fox", words: ["The", "fox", "wraps", "its", "tail", "around", "itself."], spare: "They" },
      { id: "robins-worms", art: "robin", words: ["Robins", "pull", "worms", "out", "of", "the", "ground."], spare: "Is" },
      { id: "turtles-shells", art: "turtle", words: ["Turtles", "cannot", "take", "off", "their", "shells."], spare: "We" }
    ]
  };

  // ------------------------------------------------------------------ NUMBER MEADOW
  // Everyday quantities and multi-step problems. ans is a number unless opts are given.
  const COMPARE_AMOUNTS = [
    { id: "heavier-rock", q: "Which is heavier: a feather or a rock?", opts: ["a rock", "a feather"], ans: "a rock", why: "A rock is much heavier than a feather." },
    { id: "longer-bus", q: "Which is longer: a pencil or a bus?", opts: ["a bus", "a pencil"], ans: "a bus", why: "A bus is many times longer than a pencil." },
    { id: "holds-bathtub", q: "Which holds more water: a cup or a bathtub?", opts: ["a bathtub", "a cup"], ans: "a bathtub", why: "A bathtub holds far more water than a cup." },
    { id: "taller-giraffe", q: "Which is taller: a giraffe or a cat?", opts: ["a giraffe", "a cat"], ans: "a giraffe", why: "A giraffe is one of the tallest animals." },
    { id: "longer-sleep", q: "Which takes longer: brushing your teeth or a night's sleep?", opts: ["a night's sleep", "brushing your teeth"], ans: "a night's sleep", why: "Sleep lasts hours; brushing takes about two minutes." },
    { id: "colder-ice", q: "Which is colder: an ice cube or a cup of warm cocoa?", opts: ["an ice cube", "warm cocoa"], ans: "an ice cube", why: "Ice is frozen water, so it is colder." },
    { id: "lighter-leaf", q: "Which is lighter: a leaf or a watermelon?", opts: ["a leaf", "a watermelon"], ans: "a leaf", why: "A leaf weighs very little; a watermelon is heavy." },
    { id: "shorter-minute", q: "Which is shorter: a minute or a day?", opts: ["a minute", "a day"], ans: "a minute", why: "A day has 1,440 minutes in it." },
    { id: "more-days", q: "Which is more: a week or 5 days?", opts: ["a week", "5 days"], ans: "a week", why: "A week is 7 days, which is more than 5." },
    { id: "longer-hour", q: "Which is longer: 1 hour or 50 minutes?", opts: ["1 hour", "50 minutes"], ans: "1 hour", why: "1 hour is 60 minutes, which is more than 50." },
    { id: "bigger-elephant", q: "Which is bigger: an elephant or a mouse?", opts: ["an elephant", "a mouse"], ans: "an elephant", why: "Elephants are among the biggest land animals." },
    { id: "warmer-beach", q: "Which is warmer: a sunny beach or a snowy hill?", opts: ["a sunny beach", "a snowy hill"], ans: "a sunny beach", why: "Snow only stays where it is cold." },
    { id: "faster-car", q: "Which is faster: walking or riding in a car?", opts: ["riding in a car", "walking"], ans: "riding in a car", why: "A car on the road goes many times faster than walking." },
    { id: "holds-bucket", q: "Which holds more: a bucket or a spoon?", opts: ["a bucket", "a spoon"], ans: "a bucket", why: "A bucket holds far more than a spoon." },
    { id: "longer-month", q: "Which is longer: a week or a month?", opts: ["a month", "a week"], ans: "a month", why: "A month is about four weeks." },
    { id: "heavier-pumpkin", q: "Which is heavier: an apple or a big pumpkin?", opts: ["a big pumpkin", "an apple"], ans: "a big pumpkin", why: "A big pumpkin weighs as much as many apples." },
    { id: "taller-house", q: "Which is taller: a house or a flower?", opts: ["a house", "a flower"], ans: "a house", why: "Houses are much taller than flowers." },
    { id: "earlier-breakfast", q: "Which comes earlier in the day: breakfast or dinner?", opts: ["breakfast", "dinner"], ans: "breakfast", why: "Breakfast is the first meal of the day." }
  ];
  const STORY_PROBLEMS = [
    { id: "spider-legs", q: "A spider has 8 legs. How many legs do 2 spiders have?", ans: 16, hint: "Add 8 and 8.", why: "8 + 8 = 16.", c: "groups" },
    { id: "two-weeks", q: "A week has 7 days. How many days are in 2 weeks?", ans: 14, hint: "Two weeks is 7 days, then 7 more.", why: "7 + 7 = 14.", c: "groups" },
    { id: "half-hour", q: "An hour has 60 minutes. How many minutes are in half an hour?", ans: 30, hint: "Half means splitting into 2 equal parts.", why: "Half of 60 is 30.", c: "share" },
    { id: "pages-days", q: "Juno reads 3 pages each day. How many pages after 5 days?", ans: 15, hint: "Count by threes, five times.", why: "3, 6, 9, 12, 15.", c: "groups" },
    { id: "eggs-left", q: "A box has 6 eggs. Pip uses 2 for breakfast and 1 for a cake. How many eggs are left?", ans: 3, hint: "Take away 2, then take away 1 more.", why: "6 − 2 − 1 = 3.", c: "subtract" },
    { id: "acorn-bags", q: "Moss has 4 bags with 5 acorns in each. How many acorns?", ans: 20, hint: "Count by fives, four times.", why: "5, 10, 15, 20.", c: "groups" },
    { id: "bus-seats", q: "A bus has 20 seats. 12 people are sitting. How many seats are empty?", ans: 8, hint: "Count up from 12 to 20.", why: "20 − 12 = 8.", c: "subtract" },
    { id: "half-stickers", q: "Juno has 10 stickers and gives half to Pip. How many does Juno keep?", ans: 5, hint: "Half of 10 means two equal groups.", why: "Half of 10 is 5.", c: "share" },
    { id: "lily-jumps", q: "A frog jumps 3 lily pads at a time. How many jumps to go 12 lily pads?", ans: 4, hint: "Count by threes until you reach 12.", why: "3, 6, 9, 12 — that's 4 jumps.", c: "groups" },
    { id: "duck-legs", q: "Ducks have 2 legs. How many legs do 5 ducks have?", ans: 10, hint: "Count by twos, five times.", why: "2, 4, 6, 8, 10.", c: "groups" },
    { id: "crayon-boxes", q: "A box holds 10 crayons. How many crayons are in 3 full boxes?", ans: 30, hint: "Count by tens, three times.", why: "10, 20, 30.", c: "groups" },
    { id: "muffin-plates", q: "12 muffins are shared equally on 3 plates. How many on each plate?", ans: 4, hint: "Deal them out one plate at a time.", why: "12 ÷ 3 = 4.", c: "share" },
    { id: "seeds-planted", q: "Pip had 15 seeds, planted 6, then found 4 more. How many seeds does Pip have now?", ans: 13, hint: "First take away 6, then add 4.", why: "15 − 6 = 9, and 9 + 4 = 13.", c: "subtract" },
    { id: "tricycles", q: "A tricycle has 3 wheels. How many wheels are on 4 tricycles?", ans: 12, hint: "Count by threes, four times.", why: "3, 6, 9, 12.", c: "groups" },
    { id: "older-moss", q: "Juno is 7. Moss is 3 years older. How old is Moss?", ans: 10, hint: "Older means add.", why: "7 + 3 = 10.", c: "add" },
    { id: "cake-slices", q: "A cake is cut into 8 equal slices. 3 are eaten. How many are left?", ans: 5, hint: "Take 3 away from 8.", why: "8 − 3 = 5.", c: "subtract" },
    { id: "apple-coins", q: "One apple costs 2 coins. How many coins for 4 apples?", ans: 8, hint: "Count by twos, four times.", why: "2, 4, 6, 8.", c: "groups" },
    { id: "steps-back", q: "Pip walks 5 steps forward and 2 steps back. Then Pip does it again. How far forward is Pip now?", ans: 6, hint: "Each time, Pip ends up 3 steps further.", why: "5 − 2 = 3, and 3 + 3 = 6.", c: "add" },
    { id: "clock-later", q: "It is 3 o'clock. What time will it be in 4 hours?", ans: 7, unit: " o'clock", hint: "Count on 4 hours from 3.", why: "4, 5, 6, 7 — 7 o'clock.", c: "add" },
    { id: "pairs-socks", q: "Juno has 9 socks. How many full pairs can Juno make?", ans: 4, hint: "A pair is 2. How many twos fit in 9?", why: "4 pairs use 8 socks; 1 sock is left over.", c: "share" }
  ];

  // ------------------------------------------------------------------ NATURE TRAIL
  const ANIMALS = [
    { id: "fish", name: "fish", homes: ["ocean", "pond"], note: "Fish live in salty oceans, and many kinds live in ponds, lakes, and rivers.", hint: "Fish need water all the time.", fact: "Fish breathe underwater using gills.", q: "breathes underwater using gills", riddle: "I breathe underwater with gills and steer with my fins." },
    { id: "frog", name: "frog", homes: ["pond", "forest"], note: "Frogs live in and near ponds, and many live in damp forests.", hint: "Frogs like wet places.", fact: "Frogs start life in water as tadpoles.", q: "starts life in water as a tadpole", riddle: "I began life as a tadpole with a tail. Now I hop and catch insects." },
    { id: "duck", name: "duck", homes: ["pond", "farm"], note: "Ducks swim on ponds, and many live on farms too.", hint: "Ducks love to paddle on fresh water.", fact: "Ducks have waterproof feathers.", q: "has waterproof feathers", riddle: "I paddle with webbed feet and my feathers keep the water out." },
    { id: "camel", name: "camel", homes: ["desert"], note: "Camels live in deserts and can cope with heat and little water.", hint: "Camels need dry, sandy places.", fact: "Camels can go many days without drinking water.", q: "can go many days without drinking", riddle: "I live where it is dry and sandy. I can go days without a drink, and I may have one or two humps." },
    { id: "polarbear", name: "polar bear", homes: ["ice", "ocean"], note: "Polar bears live on sea ice and are strong swimmers in the cold ocean.", hint: "Polar bears need very cold places.", fact: "Polar bears have black skin under their white fur.", q: "has black skin under white fur", riddle: "I have white fur but black skin. I hunt on sea ice and swim in cold water." },
    { id: "penguin", name: "penguin", homes: ["ice", "ocean"], note: "Many penguins live on icy coasts and find their food in the ocean.", hint: "Penguins live where it is cold, close to the sea.", fact: "Penguins can't fly, but they are excellent swimmers.", q: "is a bird that swims but can't fly", riddle: "I am a bird, but I can't fly. I use my wings to swim." },
    { id: "owl", name: "owl", homes: ["forest", "farm"], note: "Many owls live in forests, and barn owls often live on farms.", hint: "Owls nest in trees — or in barns.", fact: "Many owls hunt at night and fly almost silently.", q: "hunts at night and flies almost silently", riddle: "I am often awake at night. My soft feathers help me fly almost without a sound." },
    { id: "squirrel", name: "squirrel", homes: ["forest"], note: "Squirrels live in trees in forests and parks.", hint: "Squirrels climb trees and bury nuts.", fact: "Squirrels bury nuts to eat later.", q: "buries nuts to eat later", riddle: "I bury nuts and seeds to eat later, and I climb trees fast." },
    { id: "cow", name: "cow", homes: ["farm"], note: "Cows live on farms and eat grass in the fields.", hint: "Cows graze in fields.", fact: "A cow's stomach has four parts.", q: "has a stomach with four parts", riddle: "I eat grass in the field all day, and my stomach has four parts." },
    { id: "lizard", name: "lizard", homes: ["desert", "forest"], note: "Lots of lizards live in deserts, and many others live in forests.", hint: "Many lizards love warm, sunny spots.", fact: "Lizards warm up by lying in the sun.", q: "warms up by lying in the sun", riddle: "I lie on warm rocks to heat up. Some of my kind can regrow a tail." },
    { id: "rabbit", name: "rabbit", homes: ["forest", "farm"], note: "Wild rabbits live in burrows at the edges of woods and fields.", hint: "Rabbits dig burrows near grass to nibble.", fact: "Rabbits live in underground homes called burrows.", q: "lives in an underground burrow", riddle: "I dig an underground home called a burrow and have long ears." },
    { id: "crab", name: "crab", homes: ["ocean"], note: "Many crabs live in the ocean and on sandy beaches.", hint: "Crabs live by the salty sea.", fact: "Crabs often walk sideways.", q: "often walks sideways", riddle: "I have a hard shell and pincers, and I often walk sideways." },
    { id: "fox", name: "fox", homes: ["forest", "farm"], note: "Foxes live in woods and fields, and some live near farms and towns.", hint: "Foxes like woods and fields.", fact: "Foxes wrap their bushy tails around themselves to keep warm.", q: "wraps its bushy tail around itself to keep warm", riddle: "I have pointed ears and a bushy tail that I wrap around me to keep warm." },
    { id: "mouse", name: "mouse", homes: ["forest", "farm"], note: "Wild mice live in woods and fields, and some live in barns.", hint: "Mice find shelter in fields, woods, and barns.", fact: "Mice use their whiskers to feel their way in the dark.", q: "uses its whiskers to feel its way in the dark", riddle: "I am small with a long tail, and my whiskers help me find my way in the dark." },
    { id: "robin", name: "robin", homes: ["forest", "farm"], note: "Robins live in woods, gardens, and fields.", hint: "Robins hop around woods, gardens, and fields.", fact: "Robins often pull earthworms out of the ground to eat.", q: "pulls earthworms out of the ground", riddle: "I am a small bird that tugs worms out of the ground." },
    { id: "whale", name: "whale", homes: ["ocean"], note: "Whales live in the ocean.", hint: "Whales need the big, salty sea.", fact: "Whales are mammals that breathe air through a blowhole.", q: "breathes air through a blowhole", riddle: "I am huge and live in the sea, but I breathe air through a blowhole on my head." },
    { id: "turtle", name: "turtle", homes: ["pond", "ocean"], note: "Some turtles live in ponds and rivers; sea turtles live in the ocean.", hint: "Turtles live in or near water.", fact: "A turtle's shell is part of its skeleton.", q: "has a shell that is part of its skeleton", riddle: "My shell is part of my skeleton, so I can never take it off." },
    { id: "bat", name: "bat", homes: ["forest"], note: "Many bats roost in trees in forests; others live in caves.", hint: "Many bats sleep in trees.", fact: "Bats are the only mammals that can truly fly.", q: "is a mammal that can truly fly", riddle: "I am a mammal that can fly, and I sleep hanging upside down." },
    { id: "deer", name: "deer", homes: ["forest"], note: "Deer live in woods and nearby meadows.", hint: "Deer hide among the trees.", fact: "Male deer of many kinds grow new antlers every year.", q: "grows new antlers every year (the males of many kinds)", riddle: "I live in the woods, and the males of many of my kinds grow new antlers every year." },
    { id: "snail", name: "snail", homes: ["forest", "pond"], note: "Many snails live in damp woods, and some live in ponds.", hint: "Snails like damp places.", fact: "A snail carries its shell — its home — on its back.", q: "carries its home on its back", riddle: "I glide along on one foot and carry my home on my back." },
    { id: "bee", name: "bee", homes: [], fact: "Bees make honey from the nectar of flowers.", q: "makes honey from flower nectar", riddle: "I visit flowers to collect nectar and help plants make seeds." },
    { id: "butterfly", name: "butterfly", homes: [], fact: "A butterfly tastes with its feet.", q: "tastes with its feet", riddle: "I used to be a caterpillar. I taste with my feet." }
  ];
  const HABITATS = [
    { id: "pond", name: "Pond", note: "fresh water" }, { id: "forest", name: "Forest", note: "lots of trees" },
    { id: "desert", name: "Desert", note: "dry and sandy" }, { id: "ice", name: "Ice", note: "very cold" },
    { id: "ocean", name: "Ocean", note: "salty sea" }, { id: "farm", name: "Farm", note: "fields and barns" }
  ];
  const HABITAT_SETS = {
    explore: [["pond", "desert"], ["ice", "farm"], ["ocean", "forest"], ["desert", "ocean"], ["ice", "forest"], ["pond", "farm"]],
    practice: [["pond", "desert", "ice"], ["forest", "ocean", "desert"], ["farm", "ice", "ocean"], ["pond", "desert", "farm"], ["forest", "ice", "desert"]],
    challenge: [["pond", "forest", "desert", "farm"], ["ice", "ocean", "forest", "farm"], ["ocean", "desert", "pond", "forest"], ["pond", "ice", "farm", "ocean"]]
  };

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
    chicken: { concept: "cycle-chicken", title: "How does a chicken grow?", steps: [
      { v: "egg-hen", label: "egg", hint: "A chick grows inside an egg that the hen keeps warm." },
      { v: "chick", label: "chick", hint: "A fluffy chick hatches out of the egg." },
      { v: "hen", label: "grown chicken", hint: "The chick grows feathers and becomes a grown chicken." }] },
    ladybug: { concept: "cycle-ladybug", title: "How does a ladybug grow?", steps: [
      { v: "egg", label: "eggs", hint: "Ladybugs start as tiny eggs on a leaf." },
      { v: "larva", label: "larva", hint: "A spiky larva hatches and eats tiny insects called aphids." },
      { v: "pupa", label: "pupa", hint: "The larva sticks to a leaf and becomes a pupa." },
      { v: "ladybug", label: "ladybug", hint: "A grown ladybug comes out of the pupa." }] },
    tree: { concept: "cycle-tree", title: "How does a tree grow?", steps: [
      { v: "seed", label: "seed", hint: "A tree starts as a seed." },
      { v: "sprout", label: "sprout", hint: "The seed sprouts a tiny shoot." },
      { v: "seedling", label: "young tree", hint: "The shoot grows into a young tree, called a sapling." },
      { v: "tree", label: "tall tree", hint: "After many years it becomes a tall tree." }] },
    appleyear: { concept: "apple-year", title: "Follow an apple tree through the year.", cyclic: true, steps: [
      { v: "spring", label: "blossoms open", hint: "In spring the tree is covered in blossoms." },
      { v: "apple", label: "apples grow", hint: "Through summer the apples grow bigger." },
      { v: "autumn", label: "leaves fall", hint: "In autumn the apples are picked and leaves fall." },
      { v: "winter", label: "the tree rests", hint: "In winter the bare tree rests until spring." }] },
    seasons: { concept: "seasons", title: "Put the seasons in order.", cyclic: true, steps: [
      { v: "spring", label: "spring", hint: "Spring has new blossoms." },
      { v: "summer", label: "summer", hint: "Summer is usually the warmest season." },
      { v: "autumn", label: "autumn (fall)", hint: "In autumn many leaves change color and fall." },
      { v: "winter", label: "winter", hint: "Winter is usually the coldest season." }] },
    water: { concept: "water-cycle", title: "Follow the water cycle.", cyclic: true, steps: [
      { v: "evaporate", label: "sun warms water into vapor", hint: "The sun's warmth turns some water into invisible vapor that rises." },
      { v: "cloud", label: "vapor cools into clouds", hint: "High up, the vapor cools into tiny droplets that make clouds." },
      { v: "rain", label: "rain falls", hint: "When droplets get heavy, they fall as rain or snow." },
      { v: "hab-ocean", label: "water collects in seas and rivers", hint: "Rain gathers in rivers, lakes, and seas, ready to warm up again." }] },
    day: { concept: "day-cycle", title: "Put a day in order.", cyclic: true, steps: [
      { v: "sunrise", label: "sunrise", hint: "The sun rises in the morning." },
      { v: "summer", label: "midday sun", hint: "Around midday the sun is high in the sky." },
      { v: "sunset", label: "sunset", hint: "In the evening the sun sets." },
      { v: "moon", label: "night", hint: "At night it's dark and the moon may shine." }] }
  };

  // Food chains: each arrow means "is eaten by".
  const CHAINS = [
    { id: "grass-rabbit-fox", links: ["grass", "rabbit", "fox"], labels: ["grass", "rabbit", "fox"] },
    { id: "leaf-caterpillar-robin", links: ["leaf", "caterpillar", "robin"], labels: ["leaf", "caterpillar", "robin"] },
    { id: "seed-mouse-owl", links: ["seed", "mouse", "owl"], labels: ["seeds", "mouse", "owl"] },
    { id: "seed-mouse-fox", links: ["seed", "mouse", "fox"], labels: ["seeds", "mouse", "fox"] },
    { id: "seed-mouse-snake", links: ["seed", "mouse", "snake"], labels: ["seeds", "mouse", "snake"] },
    { id: "grass-grasshopper-frog", links: ["grass", "grasshopper", "frog"], labels: ["grass", "grasshopper", "frog"] },
    { id: "grass-grasshopper-frog-snake", links: ["grass", "grasshopper", "frog", "snake"], labels: ["grass", "grasshopper", "frog", "snake"] },
    { id: "seed-mouse-snake-owl", links: ["seed", "mouse", "snake", "owl"], labels: ["seeds", "mouse", "snake", "owl"] },
    { id: "grass-grasshopper-mouse-owl", links: ["grass", "grasshopper", "mouse", "owl"], labels: ["grass", "grasshopper", "mouse", "owl"] },
    { id: "leaf-caterpillar-robin-fox", links: ["leaf", "caterpillar", "robin", "fox"], labels: ["leaf", "caterpillar", "robin", "fox"] },
    { id: "grass-deer-wolf", links: ["grass", "deer", "wolf"], labels: ["grass", "deer", "wolf"] },
    { id: "algae-fish-penguin", links: ["algae", "fish", "penguin"], labels: ["algae", "small fish", "penguin"] },
    { id: "grass-grasshopper-robin", links: ["grass", "grasshopper", "robin"], labels: ["grass", "grasshopper", "robin"] },
    { id: "nuts-squirrel-fox", links: ["seed", "squirrel", "fox"], labels: ["nuts and seeds", "squirrel", "fox"] },
    { id: "grass-grasshopper-frog-owl", links: ["grass", "grasshopper", "frog", "owl"], labels: ["grass", "grasshopper", "frog", "owl"] },
    { id: "grass-grasshopper-robin-fox", links: ["grass", "grasshopper", "robin", "fox"], labels: ["grass", "grasshopper", "robin", "fox"] }
  ];
  const LIVING = [
    { id: "frog", label: "frog", living: true }, { id: "flower", label: "flower", living: true }, { id: "bee", label: "bee", living: true },
    { id: "tree", label: "tree", living: true }, { id: "rabbit", label: "rabbit", living: true }, { id: "snail", label: "snail", living: true },
    { id: "mushroom", label: "mushroom", living: true }, { id: "fish", label: "fish", living: true }, { id: "grass", label: "grass", living: true },
    { id: "rock", label: "rock", living: false }, { id: "ball", label: "ball", living: false }, { id: "cup", label: "cup", living: false },
    { id: "boots", label: "boots", living: false }, { id: "umbrella", label: "umbrella", living: false }, { id: "key", label: "key", living: false },
    { id: "pillow", label: "pillow", living: false }, { id: "bottle", label: "water bottle", living: false },
    { id: "spoon", label: "spoon", living: false }, { id: "book", label: "book", living: false }, { id: "toothbrush", label: "toothbrush", living: false }, { id: "shovel", label: "shovel", living: false },
    { id: "cow", label: "cow", living: true }, { id: "owl", label: "owl", living: true }, { id: "mouse", label: "mouse", living: true }
  ];
  // Short reasoning questions about living things and food chains.
  const NATURE_QUESTIONS = [
    { id: "plant-eaters", m: ["challenge"], q: "Which of these animals eat only plants?", opts: ["rabbit", "cow", "deer", "fox", "owl"], valid: ["rabbit", "cow", "deer"], all: true, why: "Rabbits, cows, and deer eat plants. Foxes and owls eat other animals.", wrong: { fox: "Foxes hunt other animals, like mice.", owl: "Owls hunt mice and other small animals." } },
    { id: "fox-eats", m: ["explore", "practice"], q: "In grass → rabbit → fox, what does the fox eat?", opts: ["rabbit", "grass", "owl"], valid: ["rabbit"], why: "The arrow from rabbit points to fox: the fox eats the rabbit.", wrong: { grass: "The rabbit eats the grass. Follow the arrow to the fox.", owl: "The owl isn't in this chain." } },
    { id: "energy-start", m: ["explore", "practice"], q: "Where does the energy in a food chain start?", opts: ["summer", "fox", "rock"], labels: { summer: "the sun", fox: "a fox", rock: "a rock" }, valid: ["summer"], why: "Plants use sunlight to make food, so a food chain's energy starts with the sun.", wrong: { fox: "Foxes get energy by eating other animals.", rock: "Rocks don't make or hold food." } },
    { id: "plants-need", m: ["challenge"], q: "Which of these do plants need to make their food? Pick all that fit.", opts: ["summer", "rain", "air", "ball", "pillow"], labels: { summer: "sunlight", rain: "water", air: "air", ball: "a ball", pillow: "a pillow" }, valid: ["summer", "rain", "air"], all: true, why: "Plants use sunlight, water, and air to make their food.", wrong: { ball: "A ball doesn't help a plant grow.", pillow: "A pillow doesn't help a plant grow." } },
    { id: "mushroom-living", m: ["explore"], q: "Which of these is alive?", opts: ["mushroom", "rock", "ball"], valid: ["mushroom"], why: "A mushroom is a living fungus. Rocks and balls are not alive.", wrong: { rock: "Rocks don't grow, eat, or have young.", ball: "A ball is made by people and isn't alive." } },
    { id: "grasshopper-eats", m: ["practice"], q: "In grass → grasshopper → frog, what eats the grasshopper?", opts: ["frog", "grass", "fox"], valid: ["frog"], why: "The arrow from grasshopper points to frog.", wrong: { grass: "Grass is eaten by the grasshopper.", fox: "The fox isn't in this chain." } },
    { id: "producer", m: ["explore", "practice"], q: "Which of these makes its own food from sunlight?", opts: ["grass", "rabbit", "owl"], valid: ["grass"], why: "Plants like grass make their own food from sunlight. Animals have to eat.", wrong: { rabbit: "Rabbits eat plants to get energy.", owl: "Owls eat other animals." } },
    { id: "deer-eater", m: ["explore"], q: "Which of these eats plants?", opts: ["deer", "fox", "owl"], valid: ["deer"], why: "Deer eat leaves, grass, and other plants.", wrong: { fox: "Foxes mostly hunt small animals.", owl: "Owls hunt mice and other small animals." } },
    { id: "rabbit-food", m: ["explore"], q: "What do rabbits mostly eat?", opts: ["grass", "mouse", "fish"], valid: ["grass"], why: "Rabbits nibble grass and other plants.", wrong: { mouse: "Rabbits don't hunt mice.", fish: "Rabbits don't eat fish." } },
    { id: "not-living", m: ["explore"], q: "Which of these is NOT alive?", opts: ["rock", "tree", "frog"], valid: ["rock"], why: "A rock doesn't grow, eat, or have young.", wrong: { tree: "Trees are alive: they grow and need water.", frog: "Frogs are alive: they eat, grow, and have young." } },
    { id: "top-predator", m: ["practice"], q: "In seeds → mouse → owl, which one is not eaten by anything in this chain?", opts: ["owl", "mouse", "seed"], labels: { seed: "seeds" }, valid: ["owl"], why: "The owl is at the end of the chain: nothing in it eats the owl.", wrong: { mouse: "The owl eats the mouse.", seed: "The mouse eats the seeds." } },
    { id: "sunlight-food", m: ["practice"], q: "Which of these makes its own food using sunlight?", opts: ["tree", "owl", "rock"], valid: ["tree"], why: "Trees, like other plants, make food from sunlight, water, and air.", wrong: { owl: "Owls get food by hunting.", rock: "Rocks aren't alive." } },
    { id: "caterpillar-eats", m: ["practice"], q: "In leaf → caterpillar → robin, what does the caterpillar eat?", opts: ["leaf", "robin", "fox"], valid: ["leaf"], why: "The arrow from leaf points to caterpillar: caterpillars munch leaves.", wrong: { robin: "The robin eats the caterpillar, not the other way round.", fox: "The fox isn't in this chain." } },
    { id: "meat-eaters", m: ["challenge"], q: "Which of these animals eat other animals? Pick all that fit.", opts: ["fox", "owl", "snake", "rabbit", "cow"], valid: ["fox", "owl", "snake"], all: true, why: "Foxes, owls, and snakes hunt other animals. Rabbits and cows eat plants.", wrong: { rabbit: "Rabbits eat plants.", cow: "Cows eat grass." } },
    { id: "no-grass", m: ["challenge"], q: "In grass → rabbit → fox, if the grass died, which animal would go hungry first?", opts: ["rabbit", "fox", "owl"], valid: ["rabbit"], why: "Rabbits eat the grass directly, so they'd feel it first — and then the foxes.", wrong: { fox: "The fox would go hungry later, once rabbits became scarce.", owl: "The owl isn't in this chain." } },
    { id: "no-rabbits", m: ["challenge"], q: "If all the rabbits left the meadow, which animal in grass → rabbit → fox would have less food?", opts: ["fox", "grass", "cow"], valid: ["fox"], why: "Foxes eat rabbits in this chain, so they'd have less food.", wrong: { grass: "The grass might actually grow taller without rabbits eating it.", cow: "Cows aren't in this chain." } }
  ];

  // ------------------------------------------------------------------ EVERYDAY ADVENTURES
  const ROUTINES = {
    handwashing: { title: "Wash your hands", concept: "handwashing", steps: [
      { v: "wet", label: "Wet hands", hint: "Hands get wet first, so the soap can lather." },
      { v: "soap", label: "Add soap", hint: "Soap goes on after your hands are wet." },
      { v: "scrub", label: "Scrub for 20 seconds", hint: "Scrub once the soap is on — bubbles everywhere!" },
      { v: "rinse", label: "Rinse", hint: "Rinse after scrubbing to wash the bubbles away." },
      { v: "dry", label: "Dry with a towel", hint: "Drying comes last." }], explore: ["wet", "soap", "rinse"] },
    teeth: { title: "Brush your teeth", concept: "teeth", steps: [
      { v: "toothpaste", label: "Put toothpaste on the brush", hint: "The brush needs toothpaste before brushing." },
      { v: "brush", label: "Brush all your teeth", hint: "Brush once there's toothpaste on the brush." },
      { v: "spit", label: "Spit into the sink", hint: "Spit after brushing." },
      { v: "cup", label: "Rinse the brush", hint: "Rinsing the brush is the last tidy-up step." }], explore: ["toothpaste", "brush", "spit"] },
    planting: { title: "Plant a seed", concept: "planting", steps: [
      { v: "shovel", label: "Dig a small hole", hint: "You need a hole before the seed can go in." },
      { v: "seed", label: "Drop in the seed", hint: "The seed goes into the hole." },
      { v: "soil", label: "Cover with soil", hint: "Cover the seed once it's in the hole." },
      { v: "wateringcan", label: "Water it", hint: "Water the soil after the seed is covered." }], explore: ["shovel", "seed", "wateringcan"] },
    sandwich: { title: "Make a sandwich", concept: "sandwich", steps: [
      { v: "bread", label: "Lay out a slice of bread", hint: "Start with bread to build on." },
      { v: "spread", label: "Add a spread", hint: "Spread goes on the bread." },
      { v: "filling", label: "Add the filling", hint: "The filling goes on top of the spread." },
      { v: "sandwich", label: "Put the top slice on", hint: "The top slice goes on last." }], explore: ["bread", "filling", "sandwich"] },
    crossing: { title: "Cross the street", concept: "crossing", steps: [
      { v: "cross-stop", art: "s-stop", label: "Stop at the edge of the road", hint: "First you stop before stepping into the road." },
      { v: "cross-look", art: "s-look", label: "Look and listen both ways", hint: "After stopping, look and listen for traffic." },
      { v: "cross-wait", art: "clock", label: "Wait until it's safe", hint: "If anything is coming, you wait." },
      { v: "cross-walk", art: "s-walk", label: "Walk across, still looking", hint: "Only cross once it's safe — and keep watching." }], explore: ["cross-stop", "cross-look", "cross-walk"] },
    dishes: { title: "Wash the dishes", concept: "dishes", steps: [
      { v: "dish-scrape", label: "Scrape off leftover food", hint: "Clear the leftovers before washing." },
      { v: "dish-wash", art: "soap", label: "Wash in soapy water", hint: "Washing comes after scraping." },
      { v: "dish-rinse", art: "rinse", label: "Rinse off the bubbles", hint: "Rinse after washing to remove soap." },
      { v: "dish-dry", art: "dry", label: "Dry and put away", hint: "Drying and putting away come last." }], explore: ["dish-scrape", "dish-wash", "dish-dry"] },
    smoothie: { title: "Make a fruit smoothie", concept: "smoothie", steps: [
      { v: "smo-wash", art: "rinse", label: "Wash the fruit", hint: "Fruit gets washed first." },
      { v: "smo-cut", label: "Cut it up, with a grown-up", hint: "Cut the fruit after washing it." },
      { v: "smo-blend", label: "Blend it", hint: "Blend once the pieces are in." },
      { v: "smo-pour", art: "cup", label: "Pour into a cup", hint: "Pouring comes after blending." }], explore: ["smo-wash", "smo-blend", "smo-pour"] },
    spill: { title: "Clean up a spill", concept: "spill", steps: [
      { v: "spill-stand", label: "Stand the cup back up", hint: "Stop more from spilling first." },
      { v: "spill-cloth", art: "dry", label: "Get a cloth", hint: "Fetch something to wipe with." },
      { v: "spill-wipe", label: "Wipe up the spill", hint: "Wipe once you have the cloth." },
      { v: "spill-rinse", art: "rinse", label: "Rinse the cloth", hint: "Rinse the cloth when you're done wiping." }], explore: ["spill-stand", "spill-cloth", "spill-wipe"] },
    gift: { title: "Wrap a present", concept: "gift", steps: [
      { v: "gift-box", label: "Put the gift in a box", hint: "The gift goes in the box first." },
      { v: "gift-wrap", art: "gift", label: "Fold paper around it", hint: "Wrap the box after the gift is inside." },
      { v: "gift-tape", label: "Tape the paper down", hint: "Tape holds the paper once it's folded." },
      { v: "gift-tag", label: "Add a name tag", hint: "The tag goes on last, on the outside." }], explore: ["gift-box", "gift-wrap", "gift-tag"] },
    letter: { title: "Send a letter", concept: "letter", steps: [
      { v: "let-write", art: "book", label: "Write the letter", hint: "You need a letter before anything else." },
      { v: "let-fold", label: "Fold it into an envelope", hint: "The letter goes in the envelope after it's written." },
      { v: "let-stamp", label: "Add the address and a stamp", hint: "Address and stamp go on the envelope once it's closed." },
      { v: "let-post", label: "Post it", hint: "Posting comes last." }], explore: ["let-write", "let-fold", "let-post"] },
    scrape: { title: "Care for a small scrape", concept: "scrape", steps: [
      { v: "scr-tell", label: "Tell a grown-up", hint: "First, let a grown-up know." },
      { v: "scr-rinse", art: "rinse", label: "Rinse it with clean water", hint: "Clean the scrape before covering it." },
      { v: "scr-dry", art: "dry", label: "Pat it dry", hint: "Dry it gently after rinsing." },
      { v: "scr-bandage", label: "Put on a bandage", hint: "The bandage goes on a clean, dry scrape." }], explore: ["scr-tell", "scr-rinse", "scr-bandage"] },
    muffins: { title: "Bake muffins with a grown-up", concept: "muffins", steps: [
      { v: "muf-mix", label: "Mix the batter", hint: "The batter is mixed first." },
      { v: "muf-fill", label: "Spoon it into the tray", hint: "Fill the tray once the batter is mixed." },
      { v: "muf-bake", label: "A grown-up bakes them", hint: "They go in the oven after the tray is filled." },
      { v: "muf-cool", art: "muffin", label: "Let them cool", hint: "Hot muffins need to cool before eating." }], explore: ["muf-mix", "muf-bake", "muf-cool"] }
  };

  const GEAR_LABEL = { raincoat: "raincoat", boots: "boots", umbrella: "umbrella", sunglasses: "sunglasses", shorts: "shorts", tshirt: "T-shirt", coat: "warm coat", mittens: "mittens", scarf: "scarf", sunhat: "sun hat",
    blanket: "blanket", sandwich: "sandwich", bottle: "water bottle", pillow: "pillow", toothbrush: "toothbrush", apple: "apple", ball: "ball", dry: "towel", sunscreen: "sunscreen", book: "book" };
  const WEATHER = [
    { id: "rain", concept: "rain-gear", art: "rain", scene: "It's raining hard outside.", need: "keep you dry", valid: ["raincoat", "boots", "umbrella"], invalid: ["sunglasses", "shorts", "tshirt"],
      why: { sunglasses: "Sunglasses shade your eyes, but they won't keep rain off.", shorts: "Shorts are comfy, but they won't keep you dry.", tshirt: "A T-shirt soaks up rain — it won't keep you dry." } },
    { id: "snow", concept: "snow-gear", art: "snow", scene: "It's cold and snowy today.", need: "keep you warm", valid: ["coat", "mittens", "scarf", "boots"], invalid: ["sunglasses", "shorts", "tshirt"],
      why: { sunglasses: "Sunglasses can help with bright snow, but they don't keep you warm.", shorts: "Shorts leave your legs out in the cold.", tshirt: "A T-shirt alone is too thin for snow." } },
    { id: "sun", concept: "sun-gear", art: "summer", scene: "It's hot and very sunny.", need: "protect you from strong sun", valid: ["sunhat", "sunglasses", "sunscreen"], invalid: ["mittens", "scarf", "coat"],
      why: { mittens: "Mittens are for cold hands, not sun.", scarf: "A scarf keeps your neck warm — you won't need that in the heat.", coat: "A winter coat would make you too hot." } },
    { id: "wind", concept: "wind-gear", art: "windy", scene: "It's cool and windy.", need: "keep the chilly wind off", valid: ["coat", "scarf"], invalid: ["sunglasses", "shorts"],
      why: { sunglasses: "Sunglasses won't keep you warm in the wind.", shorts: "Shorts leave your legs out in the chilly wind." } },
    { id: "hot-park", concept: "hot-day", art: "summer", scene: "It's a hot day and you're playing at the park.", need: "help you stay cool and safe", valid: ["bottle", "sunhat", "sunscreen"], invalid: ["coat", "mittens", "scarf"],
      why: { coat: "A coat would make you hotter.", mittens: "Mittens are for cold days.", scarf: "A scarf traps heat around your neck." } },
    { id: "puddles", concept: "rain-gear", art: "rain", scene: "The rain has stopped, but there are big puddles everywhere.", need: "keep your feet dry", valid: ["boots"], invalid: ["sunhat", "sunglasses", "tshirt"],
      why: { sunhat: "A sun hat won't help your feet.", sunglasses: "Sunglasses won't help with puddles.", tshirt: "A T-shirt won't keep your feet dry." } }
  ];
  // Safety choices (not clothes). Several answers can be sensible.
  const SAFETY = [
    { id: "thunder", concept: "storm-safety", art: "rain", scene: "You hear thunder and see lightning.", ask: "What's a safe choice?",
      good: ["Go inside a building", "Wait indoors until the storm passes"], bad: [{ t: "Stand under a tall tree", h: "Lightning often strikes tall things, like trees. Indoors is safer." }, { t: "Keep swimming outside", h: "Water and storms don't mix — get out and go indoors." }],
      why: "During thunder and lightning, going inside a building is the safest choice." },
    { id: "icy", concept: "icy-safety", art: "snow", scene: "The path outside is icy and slippery.", ask: "What's a sensible choice?",
      good: ["Walk slowly with small steps", "Hold a handrail or a grown-up's hand"], bad: [{ t: "Run as fast as you can", h: "Running on ice makes slipping more likely." }],
      why: "Small, slow steps and something to hold make icy paths safer." },
    { id: "lost-store", concept: "lost-safety", art: "s-look", scene: "You can't see your grown-up in a busy shop.", ask: "What could you do?",
      good: ["Stay where you are and look around", "Ask a staff member for help"], bad: [{ t: "Leave the shop to search outside", h: "Leaving makes you harder to find. Staying put or asking staff is safer." }],
      why: "Staying put or asking a worker for help makes it easier for your grown-up to find you." },
    { id: "hot-stove", concept: "kitchen-safety", art: "room-kitchen", scene: "A pot is bubbling on the stove.", ask: "What's a safe choice?",
      good: ["Stay back and let a grown-up handle it", "Tell a grown-up if it's boiling over"], bad: [{ t: "Touch the pot to see if it's hot", h: "Pots on the stove can burn. Let a grown-up handle them." }],
      why: "Hot pots can burn, so staying back and getting a grown-up is safest." }
  ];
  const PACKING = [
    { id: "picnic", concept: "picnic", art: "basket", title: "Picnic list", list: ["blanket", "sandwich", "bottle"], extras: ["pillow", "toothbrush", "ball", "mittens"] },
    { id: "beach", concept: "beach-trip", art: "hab-ocean", title: "Beach list", list: ["sunhat", "dry", "bottle"], extras: ["mittens", "pillow", "coat", "scarf"] },
    { id: "sleepover", concept: "sleepover", art: "pillow", title: "Sleepover list", list: ["pillow", "toothbrush", "book"], extras: ["umbrella", "ball", "sunglasses", "shorts"] },
    { id: "snow-day", concept: "snow-gear", art: "snow", title: "Snow-day list", list: ["coat", "mittens", "boots"], extras: ["sunhat", "shorts", "sunglasses", "ball"] }
  ];

  const KIND = [
    { id: "crayons", who: "rabbit", text: "Juno the rabbit dropped a whole box of crayons on the floor.",
      good: ["Help pick them up", "Ask, “Do you want some help?”"], nuance: ["Tell a grown-up if you can't reach them all"],
      not: [{ t: "Walk over them and keep going", h: "Walking over them could break the crayons. What could help Juno?" }], expl: "Helping, or asking if Juno wants help, are both kind ways to respond." },
    { id: "new-duckling", who: "duck", text: "Pip the duckling is new and standing alone at the playground.",
      good: ["Say hello and ask Pip to play", "Show Pip where the swings are"], nuance: ["Smile and wave, then let Pip choose"],
      not: [{ t: "Point at Pip and whisper", h: "Whispering about someone can make them feel left out. What would make Pip feel welcome?" }], expl: "Saying hello or showing Pip around helps someone new feel welcome." },
    { id: "tower-fell", who: "squirrel", text: "Moss the squirrel's block tower fell down. Moss looks upset.",
      good: ["Ask Moss what happened", "Offer to help build it again"], nuance: ["Give Moss some space if Moss asks for it"],
      not: [{ t: "Say, “It wasn't a good tower anyway”", h: "Those words might make Moss feel worse. What could help instead?" }], expl: "Asking, offering help, or giving space if asked are all caring choices." },
    { id: "red-paint", who: "rabbit", text: "You and Juno both want to use the red paint.",
      good: ["Take turns with it", "Share the paint pot between you"], nuance: ["Pick a different color for now"],
      not: [{ t: "Grab the paint and run off", h: "Grabbing means Juno misses out. How could you both get a go?" }], expl: "Taking turns or sharing means you both get to paint." },
    { id: "bumped-book", who: "duck", text: "You bump into Pip by accident and Pip's book falls down.",
      good: ["Say sorry and pick up the book", "Ask, “Are you okay?”"], nuance: ["Check that the book isn't damaged"],
      not: [{ t: "Pretend it didn't happen", h: "It was an accident, and saying so helps. What could you say or do?" }], expl: "Accidents happen. Saying sorry and helping fix it is a kind response." },
    { id: "different-idea", who: "squirrel", text: "Moss has an idea for the game that's different from yours.",
      good: ["Listen to Moss's idea", "Say, “Let's try both ideas”"], nuance: ["Explain your idea calmly too"],
      not: [{ t: "Say, “Your idea is silly”", h: "Calling an idea silly can hurt. How could you show you're listening?" }], expl: "Listening and trying both ideas helps everyone feel heard." },
    { id: "heavy-bag", who: "fox", text: "Rory the fox is carrying a heavy bag and drops some apples.",
      good: ["Help gather the apples", "Offer to carry something"], nuance: ["Hold the door open for Rory"],
      not: [{ t: "Take an apple without asking", h: "Taking without asking isn't fair. How could you help Rory instead?" }], expl: "Gathering the apples or offering a hand are helpful choices." },
    { id: "lost-game", who: "mouse", text: "Tilly the mouse lost the race and looks disappointed.",
      good: ["Say, “That was a great try!”", "Ask Tilly to race again later"], nuance: ["Sit with Tilly for a moment"],
      not: [{ t: "Laugh and say, “You're the slowest”", h: "Teasing after a loss can sting. What could cheer Tilly up?" }], expl: "Encouraging words and a friendly offer help after a disappointment." },
    { id: "sharing-snack", who: "robin", text: "Ruby the robin forgot her snack, and you have extra berries.",
      good: ["Offer Ruby some berries", "Ask, “Would you like to share?”"], nuance: ["Check with a grown-up about allergies first"],
      not: [{ t: "Eat them in front of Ruby and say no", h: "Ruby might feel left out. How could you include her?" }], expl: "Offering to share is a kind way to include someone." },
    { id: "quiet-friend", who: "turtle", text: "Toby the turtle is quiet today and sitting alone.",
      good: ["Ask Toby if he'd like company", "Invite Toby to join your game"], nuance: ["Let Toby know you're around if he wants to talk"],
      not: [{ t: "Tell everyone Toby is boring", h: "That could hurt Toby's feelings. What might help him feel included?" }], expl: "Checking in or inviting someone shows you care, and they can choose." },
    { id: "spilled-drink", who: "deer", text: "Dot the deer spilled juice on the table at lunch.",
      good: ["Pass Dot some napkins", "Help wipe it up"], nuance: ["Tell a grown-up so they can help"],
      not: [{ t: "Point and shout, “Look what Dot did!”", h: "That could embarrass Dot. What could help instead?" }], expl: "Helping clean up, or getting a grown-up, are both kind." },
    { id: "taking-turns", who: "owl", text: "Olive the owl has been waiting a long time for a turn on the swing.",
      good: ["Let Olive have a turn", "Count together and then swap"], nuance: ["Ask Olive if she'd like to swing next"],
      not: [{ t: "Keep swinging and ignore Olive", h: "Olive has waited a long time. How could you both get a turn?" }], expl: "Taking turns means everyone gets to play." },
    { id: "made-mistake", who: "frog", text: "Finn the frog spelled a word wrong on the board.",
      good: ["Say, “Everyone makes mistakes”", "Help Finn sound out the word"], nuance: ["Wait and let Finn try again"],
      not: [{ t: "Laugh loudly at Finn", h: "Laughing at a mistake can make it hard to try again. What could help Finn?" }], expl: "Kind words and help make it easier to learn from mistakes." },
    { id: "new-language", who: "penguin", text: "Penny the penguin just moved here and is still learning your language.",
      good: ["Speak slowly and smile", "Show Penny with pictures or gestures"], nuance: ["Ask Penny to teach you a word from her language"],
      not: [{ t: "Ignore Penny because she's hard to understand", h: "Being left out feels lonely. How could you include Penny?" }], expl: "Patience, gestures, and curiosity help everyone communicate." },
    { id: "broken-toy", who: "squirrel", text: "Moss's favorite toy broke, and Moss is crying.",
      good: ["Ask if Moss wants a hug or some space", "Offer to help fix it with a grown-up"], nuance: ["Sit nearby quietly"],
      not: [{ t: "Say, “Stop crying, it's just a toy”", h: "It matters to Moss. What could show you understand?" }], expl: "Asking what Moss needs respects how Moss feels." },
    { id: "unfair-team", who: "fox", text: "When teams are picked, Rory is chosen last again.",
      good: ["Say, “I'm glad you're on our team!”", "Suggest a fairer way to pick teams"], nuance: ["Pass the ball to Rory during the game"],
      not: [{ t: "Groan when Rory joins", h: "Groaning can make Rory feel unwanted. How could you welcome Rory?" }], expl: "Welcoming words and fair ways to pick help everyone belong." },
    { id: "thank-helper", who: "cow", text: "The lunch helper, Mr. Moo, gave you your tray.",
      good: ["Say, “Thank you!”", "Smile and wave"], nuance: ["Ask how his day is going"],
      not: [{ t: "Grab it without a word", h: "A thank-you shows you noticed his help. What could you say?" }], expl: "Thanking people shows you value what they do." },
    { id: "sad-news", who: "rabbit", text: "Juno says her pet fish died last night.",
      good: ["Say, “I'm sorry, that sounds sad”", "Ask if she wants to tell you about her fish"], nuance: ["Draw Juno a picture"],
      not: [{ t: "Say, “Just get a new one”", h: "Juno may be sad about this fish. What could show you care?" }], expl: "Listening and saying sorry show you care about how Juno feels." }
  ];

  // Tidy Up: where could each thing go? Several rooms can be right.
  const ROOMS = [
    { id: "kitchen", name: "Kitchen", note: "cooking and eating" }, { id: "bathroom", name: "Bathroom", note: "washing" },
    { id: "bedroom", name: "Bedroom", note: "sleeping and clothes" }, { id: "garden", name: "Garden", note: "outdoors" }
  ];
  const TIDY = [
    { id: "cup", label: "cup", rooms: ["kitchen", "bathroom"], hint: "Cups are for drinking — or for rinsing at the sink." },
    { id: "sandwich", label: "sandwich", rooms: ["kitchen"], hint: "Food usually belongs where meals are made." },
    { id: "bread", label: "bread", rooms: ["kitchen"], hint: "Bread is kept with the food." },
    { id: "soap", label: "soap", rooms: ["bathroom", "kitchen"], hint: "Soap goes where you wash." },
    { id: "toothbrush", label: "toothbrush", rooms: ["bathroom"], hint: "You brush your teeth at the bathroom sink." },
    { id: "toothpaste", label: "toothpaste", rooms: ["bathroom"], hint: "Toothpaste lives with the toothbrush." },
    { id: "dry", label: "towel", rooms: ["bathroom", "kitchen"], hint: "Towels are for drying — hands, bodies, or dishes." },
    { id: "pillow", label: "pillow", rooms: ["bedroom"], hint: "Pillows are for sleeping." },
    { id: "blanket", label: "blanket", rooms: ["bedroom"], hint: "Blankets keep you warm in bed." },
    { id: "tshirt", label: "T-shirt", rooms: ["bedroom"], hint: "Clothes are kept where you get dressed." },
    { id: "shorts", label: "shorts", rooms: ["bedroom"], hint: "Clothes are kept where you get dressed." },
    { id: "shovel", label: "shovel", rooms: ["garden"], hint: "A shovel is for digging outside." },
    { id: "wateringcan", label: "watering can", rooms: ["garden"], hint: "Watering cans water plants outside." },
    { id: "ball", label: "ball", rooms: ["garden", "bedroom"], hint: "Balls are for playing — outside, or kept with toys." },
    { id: "book", label: "book", rooms: ["bedroom"], hint: "Books are often kept by the bed for reading." },
    { id: "spoon", label: "spoon", rooms: ["kitchen"], hint: "Spoons are for eating and cooking." },
    { id: "apple", label: "apple", rooms: ["kitchen"], hint: "Fruit is kept with the food." },
    { id: "bottle", label: "water bottle", rooms: ["kitchen"], hint: "Bottles get filled and washed where the sink and food are." },
    { id: "seed", label: "seeds", rooms: ["garden"], hint: "Seeds get planted outdoors." },
    { id: "flower", label: "flower", rooms: ["garden"], hint: "Flowers grow outside in the soil." },
    { id: "mittens", label: "mittens", rooms: ["bedroom"], hint: "Clothes are kept where you get dressed." },
    { id: "scarf", label: "scarf", rooms: ["bedroom"], hint: "Clothes are kept where you get dressed." },
    { id: "coat", label: "coat", rooms: ["bedroom"], hint: "Coats are kept with your clothes." },
    { id: "sunhat", label: "sun hat", rooms: ["bedroom", "garden"], hint: "A sun hat is kept with clothes — or used out in the garden." }
  ];

  return { FOODS, FOOD_CATEGORIES, WORDS, WORD_FACTS, SENTENCES, COMPARE_AMOUNTS, STORY_PROBLEMS, ANIMALS, HABITATS, HABITAT_SETS,
    CYCLES, CHAINS, LIVING, NATURE_QUESTIONS, ROUTINES, GEAR_LABEL, WEATHER, SAFETY, PACKING, KIND, ROOMS, TIDY };
});
