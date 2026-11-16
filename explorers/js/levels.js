/* levels.js — Logic Lab level list, curated by tools/gen-logic-levels.cjs (seeded, solver-checked).
 * Do not hand-edit without re-running the content tests: every level must stay solvable. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SE_Levels = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  return {
    explore: [
      {w:4,h:4,start:{x:1,y:3},goal:{x:0,y:0},rocks:[]},
      {w:4,h:4,start:{x:0,y:3},goal:{x:3,y:3},rocks:[]},
      {w:4,h:4,start:{x:3,y:1},goal:{x:2,y:2},rocks:[]},
      {w:4,h:4,start:{x:0,y:0},goal:{x:0,y:2},rocks:[]},
      {w:4,h:4,start:{x:3,y:2},goal:{x:2,y:0},rocks:[]},
      {w:4,h:4,start:{x:3,y:1},goal:{x:1,y:3},rocks:[]},
      {w:4,h:4,start:{x:0,y:3},goal:{x:1,y:2},rocks:[]},
      {w:4,h:4,start:{x:3,y:3},goal:{x:0,y:1},rocks:[]},
      {w:4,h:4,start:{x:2,y:2},goal:{x:0,y:2},rocks:[]},
      {w:4,h:4,start:{x:1,y:3},goal:{x:3,y:1},rocks:[]},
      {w:4,h:4,start:{x:1,y:0},goal:{x:3,y:1},rocks:[]},
      {w:4,h:4,start:{x:3,y:0},goal:{x:1,y:3},rocks:[]}
    ],
    practice: [
      {w:5,h:5,start:{x:2,y:0},goal:{x:2,y:4},rocks:[[1,3],[2,1],[0,2]]},
      {w:5,h:5,start:{x:2,y:4},goal:{x:0,y:1},rocks:[[3,1],[0,4],[2,3]]},
      {w:5,h:5,start:{x:2,y:0},goal:{x:0,y:3},rocks:[[3,3],[0,2],[3,0],[2,2]]},
      {w:5,h:5,start:{x:1,y:1},goal:{x:3,y:4},rocks:[[2,1],[2,2],[0,1],[0,4],[0,3]]},
      {w:5,h:5,start:{x:4,y:0},goal:{x:3,y:4},rocks:[[2,1],[3,0],[2,4],[3,1],[1,1]]},
      {w:5,h:5,start:{x:4,y:4},goal:{x:0,y:0},rocks:[[1,3],[4,3],[2,4]]},
      {w:5,h:5,start:{x:3,y:4},goal:{x:2,y:0},rocks:[[3,2],[1,1],[2,1],[2,3],[0,2]]},
      {w:5,h:5,start:{x:4,y:4},goal:{x:2,y:0},rocks:[[4,1],[3,2],[0,3],[1,2]]},
      {w:5,h:5,start:{x:4,y:0},goal:{x:1,y:4},rocks:[[2,1],[2,0],[0,4]]},
      {w:5,h:5,start:{x:0,y:2},goal:{x:4,y:1},rocks:[[4,2],[1,1],[2,3],[3,4]]},
      {w:5,h:5,start:{x:4,y:1},goal:{x:1,y:4},rocks:[[0,2],[3,3],[3,1],[2,4],[0,4]]},
      {w:5,h:5,start:{x:0,y:2},goal:{x:3,y:4},rocks:[[2,3],[0,1],[1,2]]},
      {w:5,h:5,start:{x:2,y:1},goal:{x:0,y:4},rocks:[[4,3],[0,3],[0,1]]},
      {w:5,h:5,start:{x:2,y:0},goal:{x:4,y:4},rocks:[[2,3],[4,2],[4,1],[3,1]]}
    ],
    challenge: [
      {w:5,h:5,start:{x:2,y:3},goal:{x:2,y:2},key:{x:4,y:0},rocks:[[0,0],[4,3],[1,3],[3,4],[0,2],[3,0]]},
      {w:5,h:5,start:{x:0,y:2},goal:{x:3,y:3},key:{x:3,y:0},rocks:[[0,4],[3,2],[1,4],[2,4],[4,3]]},
      {w:5,h:5,start:{x:0,y:4},goal:{x:1,y:2},key:{x:4,y:2},rocks:[[1,0],[0,0],[2,3],[3,0],[1,4]]},
      {w:5,h:5,start:{x:2,y:3},goal:{x:2,y:2},key:{x:3,y:0},rocks:[[4,0],[2,1],[3,2]]},
      {w:5,h:5,start:{x:3,y:4},goal:{x:4,y:3},key:{x:0,y:2},rocks:[[3,2],[1,4],[0,0],[3,0]]},
      {w:5,h:5,start:{x:0,y:2},goal:{x:3,y:4},key:{x:3,y:0},rocks:[[0,3],[2,2],[2,3],[4,0]]},
      {w:5,h:5,start:{x:1,y:0},goal:{x:2,y:4},key:{x:4,y:0},rocks:[[0,2],[2,3],[1,4],[1,1],[2,2],[4,3]]},
      {w:5,h:5,start:{x:3,y:2},goal:{x:3,y:1},key:{x:0,y:1},rocks:[[1,2],[2,3],[4,1],[2,1],[0,4],[1,4]]},
      {w:5,h:5,start:{x:1,y:0},goal:{x:0,y:2},key:{x:3,y:2},rocks:[[3,4],[0,1],[1,4],[2,2],[4,1],[3,0]]},
      {w:5,h:5,start:{x:1,y:4},goal:{x:1,y:2},key:{x:4,y:1},rocks:[[2,3],[1,0],[0,3],[0,1],[3,1],[0,0]]},
      {w:5,h:5,start:{x:0,y:2},goal:{x:0,y:4},key:{x:3,y:4},rocks:[[4,3],[1,4],[1,1],[2,0],[1,0],[3,3]]},
      {w:5,h:5,start:{x:4,y:1},goal:{x:3,y:0},key:{x:0,y:3},rocks:[[2,1],[1,4],[0,0]]}
    ]
  };
});
