/* data.js — the learning content for Fruit Snake.
 * Categories of things a snake can happily collect, each item with an emoji,
 * a clear name, an optional describing word, and kid-friendly reaction phrases.
 * Everything is data so it's easy to add more items or whole new categories.
 */
(function () {
  "use strict";

  // item shape: { e: emoji, n: name, a: adjective?, plural?: true, noart?: true }
  const FRUITS = [
    { e:"🍎", n:"apple",       a:"red"     },
    { e:"🍌", n:"banana",      a:"sweet"   },
    { e:"🍓", n:"strawberry",  a:"juicy"   },
    { e:"🍇", n:"grapes",      a:"sweet", plural:true },
    { e:"🍊", n:"orange",      a:"juicy"   },
    { e:"🍉", n:"watermelon",  a:"big"     },
    { e:"🍑", n:"peach",       a:"soft"    },
    { e:"🥝", n:"kiwi",        a:"green"   },
    { e:"🍒", n:"cherries",    a:"red", plural:true },
    { e:"🍐", n:"pear",        a:"sweet"   },
    { e:"🍍", n:"pineapple",   a:"spiky"   },
    { e:"🥭", n:"mango",       a:"sweet"   }
  ];

  const VEGGIES = [
    { e:"🥕", n:"carrot",    a:"crunchy" },
    { e:"🥦", n:"broccoli",  a:"green", noart:true },
    { e:"🌽", n:"corn",      a:"sweet", noart:true },
    { e:"🍅", n:"tomato",    a:"red"     },
    { e:"🥔", n:"potato",    a:"round"   },
    { e:"🧅", n:"onion",     a:"round"   },
    { e:"🥬", n:"lettuce",   a:"leafy", noart:true },
    { e:"🫑", n:"pepper",    a:"green"   },
    { e:"🥒", n:"cucumber",  a:"cool"    },
    { e:"🍆", n:"eggplant",  a:"purple"  },
    { e:"🫛", n:"peas",      a:"little", plural:true },
    { e:"🍠", n:"sweet potato", a:"warm" }
  ];

  const SNACKS = [
    { e:"🥜", n:"peanut",       a:"crunchy" },
    { e:"🧀", n:"cheese",       a:"yummy", noart:true },
    { e:"🥛", n:"milk",         a:"cool", noart:true },
    { e:"🫐", n:"blueberries",  a:"sweet", plural:true },
    { e:"🍿", n:"popcorn",      a:"fluffy", noart:true },
    { e:"🥨", n:"pretzel",      a:"twisty"  },
    { e:"🥚", n:"egg",          a:"little"  },
    { e:"🍞", n:"bread",        a:"soft", noart:true },
    { e:"🥑", n:"avocado",      a:"creamy"  },
    { e:"🥥", n:"coconut",      a:"big"     },
    { e:"🌰", n:"chestnut",     a:"brown"   },
    { e:"🍯", n:"honey",        a:"sweet", noart:true }
  ];

  const CATEGORIES = [
    { id:"fruits", label:"Fruits",         icon:"🍎", color:"#ff6b6b", grassA:"#ffd0d0", grassB:"#ffbcbc", items:FRUITS },
    { id:"veggies",label:"Vegetables",     icon:"🥕", color:"#24c98a", grassA:"#b7ec8f", grassB:"#a6e178", items:VEGGIES },
    { id:"snacks", label:"Healthy Snacks", icon:"🥨", color:"#ffab3f", grassA:"#ffe6b0", grassB:"#ffd98f", items:SNACKS },
    { id:"mix",    label:"Rainbow Mix",    icon:"🌈", color:"#7a3ff2", grassA:"#e6d6ff", grassB:"#d8c2ff",
      items: FRUITS.concat(VEGGIES, SNACKS) }
  ];

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  // "a" vs "an" must agree with the word that FOLLOWS it — which is the
  // adjective when one is used ("a red apple", not "an red apple").
  const aFor = (word) => /^[aeiou]/i.test(word) ? "an" : "a";
  const article = (it) => (it.plural || it.noart) ? "" : aFor(it.n);

  // Big label shown on screen when eaten, e.g. "🍎 Apple"
  function label(it) { return it.e + "  " + cap(it.n); }

  // A cheerful spoken/printed reaction that always says the name clearly.
  function reaction(it) {
    const a = article(it), name = it.n, adj = it.a;
    const opts = [];
    if (it.plural || it.noart) {
      opts.push(`Yummy! ${cap(name)}!`);
      if (adj) opts.push(`Mmm, ${adj} ${name}!`);
      opts.push(`I found ${name}!`, `Yay! ${cap(name)}!`, `I love ${name}!`);
    } else {
      opts.push(`Yummy, ${a} ${name}!`);
      if (adj) opts.push(`Mmm, ${aFor(adj)} ${adj} ${name}!`);
      opts.push(`Yay! ${cap(a)} ${name}!`, `I found ${a} ${name}!`);
    }
    return pick(opts);
  }

  // total unique item names across everything (for the Rainbow Mix progress)
  const allNames = new Set();
  CATEGORIES.forEach(c => c.items.forEach(i => allNames.add(i.n)));

  window.FS_DATA = { CATEGORIES, reaction, label, cap, allNames };
})();
