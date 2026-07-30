/* Tests for the forgiving word matcher (www/match.js).
 * Run with: npm test
 *
 * The bar these tests defend: a child who said the word should always be
 * cheered, and a child who said something else should never be told they said
 * it. When those two pull against each other, the child gets the benefit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const M = require("../match.js");

const yes = (heard, target) => {
  const r = M.compare(heard, target);
  assert.ok(r.ok, `expected "${heard}" to count as "${target}" (got ${r.quality})`);
};
const no = (heard, target) => {
  const r = M.compare(heard, target);
  assert.ok(!r.ok, `expected "${heard}" NOT to count as "${target}" (got ${r.quality})`);
};

test("says it exactly", () => {
  for (const w of ["apple", "banana", "broccoli", "watermelon", "honey", "sweet potato"]) {
    const r = M.compare(w, w);
    assert.equal(r.quality, "exact");
  }
});

test("case, punctuation and spacing don't matter", () => {
  assert.equal(M.compare("  Apple! ", "apple").quality, "exact");
  assert.equal(M.compare("SWEET   potato.", "sweet potato").quality, "exact");
});

test("the word inside a sentence still counts", () => {
  yes("it's an apple", "apple");
  yes("i said banana", "banana");
  yes("that's a sweet potato mummy", "sweet potato");
  assert.equal(M.compare("um the apple", "apple").quality, "exact");
});

test("plurals go both ways", () => {
  yes("grape", "grapes");
  yes("grapes", "grape");
  yes("cherry", "cherries");
  yes("cherries", "cherry");
  yes("blueberry", "blueberries");
  yes("pea", "peas");
});

test("toddler pronunciation is close enough", () => {
  yes("brockly", "broccoli");
  yes("brockley", "broccoli");
  yes("stawberry", "strawberry");
  yes("strawbewwy", "strawberry");
  yes("nana", "banana");
  yes("bnana", "banana");
  yes("wawamelon", "watermelon");
  yes("pineaple", "pineapple");
  yes("cumber", "cucumber");
  yes("tomatoe", "tomato");
  yes("avacado", "avocado");
});

test("a different word is not accepted", () => {
  no("banana", "apple");
  no("carrot", "cherries");
  no("orange", "onion");
  no("potato", "tomato");        // one edit apart, but genuinely different words
  no("bread", "broccoli");
  no("milk", "honey");
  no("pear", "peach");
  no("corn", "carrot");
});

test("a longer word is not swallowed by its shorter neighbour", () => {
  no("eggplant", "egg");
  no("egg", "eggplant");
  no("peanut", "peas");
  no("pepper", "peas");
});

test("a compound and its head noun count for each other, on purpose", () => {
  // "sweet potato" is the only pair in the game that shares a noun, and both
  // directions are a child saying something true about what they saw.
  yes("potato", "sweet potato");
  yes("sweet potato", "potato");
});

test("nothing heard is never a yes", () => {
  no("", "apple");
  no("   ", "apple");
  no("...", "apple");
});

test("best() picks the winning alternative out of several guesses", () => {
  const r = M.best(["a pill", "apple", "ample"], "apple");
  assert.ok(r.ok);
  assert.equal(r.quality, "exact");
  assert.equal(r.heard, "apple");
});

test("best() reports what it heard even when nothing matched", () => {
  const r = M.best(["dinosaur", "digger"], "apple");
  assert.ok(!r.ok);
  assert.equal(r.heard, "dinosaur");
});

test("best() tolerates junk input", () => {
  assert.ok(!M.best([], "apple").ok);
  assert.ok(!M.best([null, undefined, ""], "apple").ok);
  assert.ok(M.best("apple", "apple").ok);      // a bare string works too
});

// Every word the game can ask for (kept in step with www/data.js).
const NAMES = [
  "apple", "banana", "strawberry", "grapes", "orange", "watermelon", "peach",
  "kiwi", "cherries", "pear", "pineapple", "mango", "carrot", "broccoli",
  "corn", "tomato", "potato", "onion", "lettuce", "pepper", "cucumber",
  "eggplant", "peas", "sweet potato", "peanut", "cheese", "milk",
  "blueberries", "popcorn", "pretzel", "egg", "bread", "avocado", "coconut",
  "chestnut", "honey"
];

test("every word in the game can be matched when said correctly", () => {
  // guards against a stemming rule that mangles one side only
  for (const n of NAMES) assert.equal(M.compare(n, n).quality, "exact", n);
});

test("no two different words in the game can be confused", () => {
  const allowed = new Set(["potato|sweet potato", "sweet potato|potato"]);
  const clashes = [];
  for (const a of NAMES) for (const b of NAMES) {
    if (a === b || allowed.has(`${a}|${b}`)) continue;
    if (M.compare(a, b).ok) clashes.push(`heard "${a}" accepted as "${b}"`);
  }
  assert.deepEqual(clashes, []);
});
