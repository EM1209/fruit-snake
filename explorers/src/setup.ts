/* setup.ts — plugs the Playful Worlds modules into the existing game:
 * new art, bundled audio, demos, six new mechanics and their activities.
 * Runs after the legacy modules have set up their globals, before app.js boots. */
import { registerExtraArt } from "./art-extra.ts";
import * as Clips from "./clips.ts";
import { routeDemo, sequenceDemo, mountPredict } from "./games/demos.ts";
import { buildSafari, buildListenFind, mountSafari, mountListenFind } from "./games/listening.ts";
import { buildRescue, mountRescue } from "./games/rescue.ts";
import { buildDetect, mountDetect } from "./games/detect.ts";
import { buildMarket, mountMarket } from "./games/market.ts";
import { buildHabitat, mountHabitat } from "./games/habitat.ts";
import { worldScene } from "./scenes.ts";

export const NEW_ACTIVITIES = [
  { id: "sound-safari", world: "word", title: "Sound Safari", mechanic: "safari", art: "sheep", objective: "Listen closely: who made that sound, and which word starts the same way?",
    example: "Moo! Tap the cow.", isNew: true, morePools: "challenge", build: buildSafari,
    modes: { explore: "Hear a sound, tap who made it.", practice: "Which picture starts like the words you hear?", challenge: "Which picture starts like the words you hear?" } },
  { id: "listen-find", world: "word", title: "Listen and Find", mechanic: "listenfind", art: "s-look", objective: "Listen to a clue and find the picture",
    example: "“Find the apple.”", isNew: true, morePools: "challenge", build: buildListenFind,
    modes: { explore: "“Find the apple” — pick from 3 pictures.", practice: "Clues that describe or combine ideas.", challenge: "Clues that describe or combine ideas." } },
  { id: "little-market", world: "number", title: "Little Market", mechanic: "market", art: "basket", objective: "Fill a basket from a picture shopping list",
    example: "Get 3 apples and 2 carrots.", isNew: true, morePools: "challenge", build: buildMarket,
    modes: { explore: "Two things on a picture list.", practice: "Exact amounts, play coins, and swaps.", challenge: "Exact amounts, play coins, and swaps." } },
  { id: "animal-detectives", world: "nature", title: "Animal Detectives", mechanic: "detect", art: "tracks-fox", objective: "Find animals hiding in the scene",
    example: "Who made these tracks?", isNew: true, morePools: "challenge", build: buildDetect,
    modes: { explore: "Spot the animal peeking out.", practice: "Footprints, sounds, and spoken clues.", challenge: "Footprints, sounds, and spoken clues." } },
  { id: "build-habitat", world: "nature", title: "Build a Habitat", mechanic: "habitat", art: "hollowtree", objective: "Give animals water, shelter, and plants",
    example: "Make a home for a duck.", isNew: true, morePools: "challenge", free: true, build: buildHabitat,
    modes: { explore: "One animal, with its needs shown.", practice: "Share one home between animals.", challenge: "Share one home between animals.", free: "Build anything, then save it." } },
  { id: "snake-rescue", world: "logic", title: "Snake Rescue", mechanic: "rescue", art: "duckling", objective: "Guide the snake to a lost animal and bring it home",
    example: "Find the duckling, then take it to the pond.", isNew: true, morePools: "challenge", build: buildRescue,
    modes: { explore: "A short trip, one step per press.", practice: "Keys, gates, bridges, and two rescues.", challenge: "Keys, gates, bridges, and two rescues." } }
];

export function setupPlayfulWorlds(): void {
  const w = window as any;
  registerExtraArt(w.SE_Art);
  w.SE_Clips = Clips;
  w.SE_Scenes = { world: worldScene };
  w.SE_Demo = { route: routeDemo, sequence: sequenceDemo };
  Object.assign(w.SE_Mech, { safari: mountSafari, listenfind: mountListenFind, rescue: mountRescue, detect: mountDetect, market: mountMarket, habitat: mountHabitat, predict: mountPredict });
  const C = w.SE_Content;
  C.addConcept("word", "animal-sounds", "Animal sounds", "sheep", "Many animals use sounds to call to each other: moo, quack, hoot and buzz.");
  C.addConcept("word", "first-sounds", "First sounds", "mouse", "Mouse, moon and mittens all start with the same sound.");
  C.addConcept("word", "listening", "Listening for clues", "s-look", "Listening to every part of a clue helps you find the right thing.");
  C.addConcept("number", "market", "Shopping lists", "basket", "A list helps you get exactly what you need — no more, no less.");
  C.addConcept("number", "coins", "Counting coins", "coin-2", "Coins can add up in different ways: 2 and 1 make 3.");
  C.addConcept("nature", "detective", "Animal detective", "tracks-fox", "Footprints, sounds and hiding places are clues to which animals are near.");
  C.addConcept("nature", "habitat-needs", "What animals need", "pond", "Every animal's home gives it water, shelter, and food.");
  C.addConcept("logic", "rescue", "Rescue missions", "duckling", "Planning a trip in parts — there, then home — makes big jobs easier.");
  // "New" badges mark only this release's games (earlier releases' badges retire).
  C.ACTIVITIES.forEach((a: any) => { a.isNew = false; });
  NEW_ACTIVITIES.forEach(a => C.registerActivity(a));
}
