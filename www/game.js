/* game.js — Fruit Snake gameplay.
 * Kid-friendly Snake: friendly wrap-around walls, smooth motion, gentle speed
 * ramp, sound toggle, best-score save, sellable snake skins, and a rewarded-ad
 * "Continue". Monetization is handled through window.Money (see money.js).
 * Nothing here predicts anything; it's just a fun, honest little arcade game.
 */
(() => {
  "use strict";
  const GRID = 15;
  const cv = document.getElementById("board");
  const ctx = cv.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  // ---- skins (the thing the IAP unlocks) ---------------------------------
  const SKINS = [
    { id:"grape",     name:"Grape",     head:"#9a5cff", headB:"#6a2fe0", body:"#8a4bff", bodyB:"#6f34e6", free:true },
    { id:"apple",     name:"Apple",     head:"#ff7a7a", headB:"#d63b3b", body:"#ff6b6b", bodyB:"#e14b4b", free:true },
    { id:"ocean",     name:"Ocean",     head:"#54c8ff", headB:"#1f8fe0", body:"#3fb8f5", bodyB:"#2a9be0", free:false },
    { id:"lime",      name:"Lime",      head:"#9be24f", headB:"#5fae1f", body:"#8ad63f", bodyB:"#63a01f", free:false },
    { id:"bubblegum", name:"Bubblegum", head:"#ff8bd0", headB:"#e04fa0", body:"#ff7ac6", bodyB:"#e35fb0", free:false },
    { id:"gold",      name:"Golden",    head:"#ffe066", headB:"#d9a800", body:"#ffd23f", bodyB:"#e0b400", free:false },
    { id:"rainbow",   name:"Rainbow",   rainbow:true, free:false }
  ];
  let selSkin = localStorage.getItem("fs_skin") || "grape";
  const skinById = (id) => SKINS.find(s => s.id === id) || SKINS[0];
  const skinUnlocked = (s) => s.free || (window.Money && window.Money.isOwned());

  // ---- crisp canvas ------------------------------------------------------
  let cell = 0, cellCss = 32;
  function sizeCanvas(){
    const cssW = cv.getBoundingClientRect().width || 480;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = cv.height = Math.round(cssW * dpr);
    cell = cv.width / GRID;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cellCss = cssW / GRID;
    render(performance.now());
  }

  // ---- state -------------------------------------------------------------
  // ---- learning content --------------------------------------------------
  const DATA = window.FS_DATA;
  let category = DATA.CATEGORIES.find(c => c.id === (localStorage.getItem("fs_cat") || "fruits"))
                 || DATA.CATEGORIES[0];
  // items the child has collected at least once, per category: {catId: [names]}
  let learned = {};
  try { learned = JSON.parse(localStorage.getItem("fs_learned") || "{}"); } catch(e){ learned = {}; }
  const learnedSet = () => new Set(learned[category.id] || []);
  function markLearned(name){
    const s = learnedSet();
    if (s.has(name)) return false;
    s.add(name);
    learned[category.id] = [...s];
    localStorage.setItem("fs_learned", JSON.stringify(learned));
    return true;                       // brand new discovery!
  }

  let snake, dir, nextDir, food, foodItem, score, best, state, prevSnake, renderFrom;
  let stepMs, lastTick, popAt, cheer, cheerAt, reviveUsed;
  let sparkles = [];
  let muted = localStorage.getItem("fs_muted") === "1";

  best = +(localStorage.getItem("fs_best") || 0);
  $("best").textContent = best;

  function reset(){
    const mid = Math.floor(GRID/2);
    snake = [{x:mid,y:mid},{x:mid-1,y:mid},{x:mid-2,y:mid}];
    prevSnake = snake.map(s => ({...s}));
    renderFrom = snake.map(s => ({...s}));
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    score = 0; stepMs = 220; popAt = 0; cheer = ""; cheerAt = 0; reviveUsed = false;
    sparkles = [];
    $("score").textContent = 0;
    if (window.Voice) window.Voice.cancel();
    placeFood();
  }
  function placeFood(){
    let p;
    do { p = {x:(Math.random()*GRID)|0, y:(Math.random()*GRID)|0}; }
    while (snake.some(s => s.x===p.x && s.y===p.y));
    food = p;
    // prefer something the child hasn't collected yet, so new words keep coming
    const seen = learnedSet();
    const fresh = category.items.filter(i => !seen.has(i.n));
    const pool = fresh.length ? fresh : category.items;
    let next = pool[(Math.random()*pool.length)|0];
    if (foodItem && pool.length > 1 && next.n === foodItem.n)   // avoid repeats
      next = pool[(pool.indexOf(next)+1) % pool.length];
    foodItem = next;
  }

  // ---- sound -------------------------------------------------------------
  let ac = null;
  function beep(freqs, dur, type="sine", gain=0.14){
    if (muted) return;
    try{
      ac = ac || new (window.AudioContext||window.webkitAudioContext)();
      const t0 = ac.currentTime;
      freqs.forEach((f,i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type=type; o.frequency.value=f;
        const s = t0 + i*dur*0.9;
        g.gain.setValueAtTime(0.0001,s);
        g.gain.exponentialRampToValueAtTime(gain,s+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001,s+dur);
        o.connect(g).connect(ac.destination); o.start(s); o.stop(s+dur);
      });
    }catch(e){/* no audio */}
  }
  const sEat=()=>beep([523,784],0.12,"triangle",0.16);
  const sYay=()=>beep([659,988,1319],0.14,"sine",0.15);
  const sOops=()=>beep([440,330,247],0.16,"sine",0.14);

  // ---- input -------------------------------------------------------------
  function setDir(name){
    const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const d=map[name]; if(!d) return;
    if (d.x===-dir.x && d.y===-dir.y) return;
    nextDir=d;
    if (state==="ready") start();
  }
  addEventListener("keydown", e=>{
    const k=e.key.toLowerCase();
    const keys={arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"};
    if (keys[k]){ e.preventDefault(); setDir(keys[k]); }
    else if (k===" "){ e.preventDefault(); togglePause(); }
  }, {passive:false});
  document.querySelectorAll(".pad button").forEach(b=>
    b.addEventListener("click", ()=>setDir(b.dataset.dir)));
  let tsx=0,tsy=0,tracking=false;
  cv.addEventListener("touchstart", e=>{const t=e.changedTouches[0];tsx=t.clientX;tsy=t.clientY;tracking=true;},{passive:true});
  cv.addEventListener("touchend", e=>{
    if(!tracking) return; tracking=false;
    const t=e.changedTouches[0], dx=t.clientX-tsx, dy=t.clientY-tsy;
    if (Math.abs(dx)<18 && Math.abs(dy)<18){ if(state==="ready") start(); return; }
    if (Math.abs(dx)>Math.abs(dy)) setDir(dx>0?"right":"left"); else setDir(dy>0?"down":"up");
  }, {passive:true});

  // ---- overlays / flow ---------------------------------------------------
  const startOv=$("startOverlay"), overOv=$("overOverlay"), pauseOv=$("pauseOverlay"), shopOv=$("shopOverlay");
  function hideAll(){ [startOv,overOv,pauseOv,shopOv].forEach(o=>o.hidden=true); }
  function start(){ hideAll(); state="playing"; lastTick=performance.now(); }
  function togglePause(){
    if (state==="playing"){ state="paused"; pauseOv.hidden=false; }
    else if (state==="paused"){ pauseOv.hidden=true; state="playing"; lastTick=performance.now(); }
  }
  $("startBtn").onclick=()=>{ reset(); start(); };
  $("againBtn").onclick=()=>{ reset(); start(); };
  $("resumeBtn").onclick=togglePause;
  $("pauseBtn").onclick=togglePause;

  const soundBtn=$("soundBtn");
  function paintSound(){ soundBtn.textContent = muted?"🔇 Sound":"🔊 Sound"; soundBtn.setAttribute("aria-pressed", String(!muted)); }
  soundBtn.onclick=()=>{ muted=!muted; localStorage.setItem("fs_muted", muted?"1":"0"); paintSound(); if(!muted) sEat(); };
  paintSound();

  const voiceBtn=$("voiceBtn");
  function paintVoice(){
    const on = window.Voice && window.Voice.isEnabled();
    voiceBtn.textContent = on ? "🗣️ Voice" : "🤐 Voice";
    voiceBtn.setAttribute("aria-pressed", String(!!on));
    voiceBtn.style.opacity = on ? "1" : ".55";
  }
  voiceBtn.onclick=()=>{
    if (!window.Voice) return;
    const on = !window.Voice.isEnabled();
    window.Voice.setEnabled(on);
    paintVoice();
    if (on) window.Voice.speak("Voice on", {rate:0.9});
  };
  paintVoice();

  // ---- shop --------------------------------------------------------------
  $("shopBtn").onclick=()=>{ if(state==="playing") togglePause(); hideAll(); refreshShop(); shopOv.hidden=false; };
  $("shopCloseBtn").onclick=()=>{ shopOv.hidden=true; if(state==="ready"){ startOv.hidden=false; } };
  $("buyBtn").onclick=async()=>{
    $("buyBtn").disabled=true;
    const r= await window.Money.buyUnlockAll();
    $("buyBtn").disabled=false;
    if (r.ok){ sYay(); refreshShop(); buildSkins(); }
  };
  $("restoreBtn").onclick=async()=>{ const has=await window.Money.restore(); refreshShop(); buildSkins(); if(has) sYay(); };
  function refreshShop(){
    const owned = window.Money && window.Money.isOwned();
    $("buyBtn").hidden = owned;
    $("shopMsg").textContent = owned
      ? "You own everything — thank you! All skins unlocked and ads are off."
      : "Unlock every snake skin and turn off all ads — one time, forever.";
  }
  document.addEventListener("fs-ownership", ()=>{ refreshShop(); buildSkins(); });

  // ---- category picker + learning tracker --------------------------------
  function buildCats(){
    const wrap=$("catPicker"); wrap.innerHTML="";
    DATA.CATEGORIES.forEach(c=>{
      const el=document.createElement("button");
      el.className="cat"+(c.id===category.id?" sel":"");
      el.innerHTML=`<span>${c.icon}</span><span>${c.label}</span>`;
      el.setAttribute("aria-pressed", String(c.id===category.id));
      el.onclick=()=>{
        category=c; localStorage.setItem("fs_cat", c.id);
        buildCats(); updateTracker(); placeFood();
        if (window.Voice) { window.Voice.unlock(); window.Voice.speak(c.label, {rate:0.85}); }
      };
      wrap.appendChild(el);
    });
  }

  function updateTracker(){
    const s=learnedSet(), total=category.items.length, got=category.items.filter(i=>s.has(i.n)).length;
    $("trackTitle").textContent = `${category.icon} ${category.label} learned`;
    $("trackCount").textContent = `${got} / ${total}`;
    $("trackFill").style.width = `${Math.round(got/total*100)}%`;
    const found=$("trackFound"); found.innerHTML="";
    category.items.forEach(i=>{
      const sp=document.createElement("span");
      sp.textContent=i.e;
      sp.title = s.has(i.n) ? i.n : "not found yet";
      if (s.has(i.n)) sp.className="got";
      found.appendChild(sp);
    });
  }

  // ---- skin picker -------------------------------------------------------
  function buildSkins(){
    const wrap=$("skinPicker"); wrap.innerHTML="";
    SKINS.forEach(s=>{
      const el=document.createElement("button");
      el.className="skin"+(s.id===selSkin?" sel":"");
      el.setAttribute("aria-label", s.name + (skinUnlocked(s)?"":" (locked)"));
      el.style.background = s.rainbow
        ? "linear-gradient(135deg,#ff6b6b,#ffd23f,#24c98a,#54c8ff,#9a5cff)"
        : `linear-gradient(180deg,${s.head},${s.headB})`;
      if (!skinUnlocked(s)){
        const lk=document.createElement("span"); lk.className="lock"; lk.textContent="🔒"; el.appendChild(lk);
      }
      el.onclick=()=>{
        if (!skinUnlocked(s)){ hideAll(); refreshShop(); shopOv.hidden=false; return; }
        selSkin=s.id; localStorage.setItem("fs_skin", selSkin); buildSkins();
      };
      wrap.appendChild(el);
    });
  }

  // ---- game tick ---------------------------------------------------------
  // The learning moment: say the name, show the word, sparkle, track progress.
  function celebrate(item, atCell){
    const isNew = markLearned(item.n);
    const sentence = DATA.reaction(item);

    // 1) big readable word on screen
    const banner = $("learnBanner");
    banner.innerHTML = "";
    const txt = document.createElement("span");
    txt.textContent = DATA.label(item);
    banner.appendChild(txt);
    if (isNew){
      const tag = document.createElement("span");
      tag.className = "new"; tag.textContent = "NEW!";
      banner.appendChild(tag);
    }
    banner.classList.remove("show"); void banner.offsetWidth;  // restart anim
    banner.classList.add("show");

    // 2) say the name clearly, then the fun reaction
    if (window.Voice) window.Voice.sayItem(item.n, sentence);

    // 3) sparkle burst where it was eaten
    for (let i=0;i<12;i++){
      const ang = (Math.PI*2*i)/12 + Math.random()*0.4;
      const sp = 0.9 + Math.random()*1.1;
      sparkles.push({ x:atCell.x+0.5, y:atCell.y+0.5,
                      vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp,
                      born:performance.now(), life:620 + Math.random()*260,
                      hue:(Math.random()*360)|0 });
    }

    // 4) progress panel
    updateTracker();
    return isNew;
  }

  const CHEERS={3:"Great job!",5:"Wow!",8:"Super!",10:"Amazing! 10!",15:"Fantastic!",20:"Word star! ⭐"};
  function tick(){
    dir=nextDir;
    prevSnake=snake.map(s=>({...s}));
    const head={x:(snake[0].x+dir.x+GRID)%GRID, y:(snake[0].y+dir.y+GRID)%GRID};
    const ate=(head.x===food.x && head.y===food.y);
    const body=ate?snake:snake.slice(0,-1);
    if (body.some(s=>s.x===head.x && s.y===head.y)) return gameOver();
    snake.unshift(head);
    if (ate){
      score++; $("score").textContent=score;
      popAt=performance.now(); stepMs=Math.max(110, stepMs-2.5);
      const isNew = celebrate(foodItem, {x:food.x,y:food.y});
      if (isNew) sYay(); else sEat();
      if (CHEERS[score]){ cheer=CHEERS[score]; cheerAt=performance.now(); }
      placeFood();
    } else snake.pop();
    renderFrom=snake.map((s,i)=> prevSnake[i]?{...prevSnake[i]}:{...s});
  }

  function gameOver(){
    state="over"; sOops();
    if (score>best){ best=score; localStorage.setItem("fs_best",best); $("best").textContent=best; }
    const bonus = score>=best && score>0;
    $("overEmoji").textContent = bonus?"🏆":"🙈";
    $("overTitle").textContent = bonus?"New best!":"Oops!";
    const s=learnedSet(), total=category.items.length;
    const got=category.items.filter(i=>s.has(i.n)).length;
    $("overMsg").textContent = score===0
      ? "So close! Tap Play again to keep learning."
      : `You collected ${score} ${score===1?"thing":"things"}${bonus?" — a new record!":""} ` +
        `You know ${got} of ${total} ${category.label.toLowerCase()}!`;
    // offer a rewarded-ad revive once per run (and only if it's worth it)
    const canRevive = !reviveUsed && score>=3;
    const rb=$("reviveBtn"); rb.hidden=!canRevive;
    overOv.hidden=false;
    // count the death toward interstitial pacing (skipped for paid users inside)
    if (window.Money) window.Money.maybeInterstitial();
  }

  $("reviveBtn").onclick=async()=>{
    const rb=$("reviveBtn"); rb.disabled=true;
    const earned = await window.Money.showRewarded();
    rb.disabled=false;
    if (!earned) return;
    reviveUsed=true;
    // give a little breathing room: trim the tail and back away from the wall
    if (snake.length>4) snake.splice(4);
    prevSnake=snake.map(s=>({...s}));
    renderFrom=snake.map(s=>({...s}));
    // steer toward open space to avoid an instant re-crash
    const h=snake[0];
    const options=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]
      .filter(d=>!(d.x===-dir.x&&d.y===-dir.y))
      .filter(d=>{const nx=(h.x+d.x+GRID)%GRID,ny=(h.y+d.y+GRID)%GRID;return !snake.some(s=>s.x===nx&&s.y===ny);});
    if (options.length) nextDir=options[0];
    hideAll(); state="playing"; lastTick=performance.now();
  };

  // ---- drawing -----------------------------------------------------------
  function roundRect(x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  function rainbowAt(i){ const hues=[0,45,140,200,270]; const h=hues[i%hues.length]; return [`hsl(${h} 90% 65%)`,`hsl(${h} 80% 48%)`]; }

  function render(now){
    const W=cv.clientWidth, c=cellCss, sk=skinById(selSkin);
    for (let y=0;y<GRID;y++) for (let x=0;x<GRID;x++){
      ctx.fillStyle=(x+y)%2 ? category.grassB : category.grassA;
      ctx.fillRect(x*c,y*c,c+0.6,c+0.6);
    }
    let t=1;
    if (state==="playing" && lastTick!=null){ t=Math.min(1,(now-lastTick)/stepMs); if(reduceMotion) t=1; }

    const bob=reduceMotion?0:Math.sin(now/300)*c*0.05;
    let fscale=1; if(popAt){ const p=(now-popAt)/220; fscale=p<1?1+0.35*Math.sin(p*Math.PI):1; }
    ctx.textAlign="center"; ctx.textBaseline="middle";
    // soft glow ring so the item to collect is easy for little eyes to spot
    if (!reduceMotion){
      const pulse = 0.5 + 0.5*Math.sin(now/380);
      ctx.beginPath();
      ctx.arc(food.x*c+c/2, food.y*c+c/2+bob, c*(0.44+0.06*pulse), 0, 7);
      ctx.fillStyle = `rgba(255,255,255,${0.28+0.22*pulse})`;
      ctx.fill();
    }
    ctx.font=`${c*0.82*fscale}px system-ui,"Apple Color Emoji","Segoe UI Emoji"`;
    ctx.fillText(foodItem.e, food.x*c+c/2, food.y*c+c/2+bob);

    for (let i=snake.length-1;i>=0;i--){
      const cur=snake[i], from=renderFrom[i]||cur;
      const jumpX=Math.abs(cur.x-from.x)>1, jumpY=Math.abs(cur.y-from.y)>1;
      const gx=jumpX?cur.x:lerp(from.x,cur.x,t), gy=jumpY?cur.y:lerp(from.y,cur.y,t);
      const px=gx*c, py=gy*c, isHead=i===0, pad=isHead?c*0.04:c*0.10;
      let ca,cb;
      if (sk.rainbow){ [ca,cb]=rainbowAt(i); } else { ca=isHead?sk.head:sk.body; cb=isHead?sk.headB:sk.bodyB; }
      const g=ctx.createLinearGradient(px,py,px,py+c); g.addColorStop(0,ca); g.addColorStop(1,cb);
      ctx.fillStyle=g; ctx.strokeStyle="rgba(40,20,80,.45)"; ctx.lineWidth=Math.max(1,c*0.05);
      roundRect(px+pad,py+pad,c-pad*2,c-pad*2,c*0.32); ctx.fill(); ctx.stroke();
      if (isHead) drawFace(px,py,c,now);
    }

    // sparkle burst from the last thing eaten
    if (sparkles.length){
      sparkles = sparkles.filter(s => now - s.born < s.life);
      sparkles.forEach(s=>{
        const p = (now - s.born) / s.life;
        const x = (s.x + s.vx*p*1.6) * c, y = (s.y + s.vy*p*1.6 + p*p*1.2) * c;
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = `hsl(${s.hue} 90% 62%)`;
        ctx.beginPath(); ctx.arc(x, y, c*0.10*(1-p*0.5), 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    if (cheer && cheerAt){
      const p=(now-cheerAt)/900;
      if (p<1){
        ctx.globalAlpha=1-p; ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(122,63,242,.9)"; ctx.lineWidth=4;
        ctx.font=`700 ${c*0.9}px "Baloo 2","Comic Sans MS",system-ui`;
        const tx=W/2, ty=W*0.34-p*40; ctx.strokeText(cheer,tx,ty); ctx.fillText(cheer,tx,ty); ctx.globalAlpha=1;
      } else cheer="";
    }
  }
  function drawFace(px,py,c,now){
    const cx=px+c/2, cy=py+c/2, ex=dir.x, ey=dir.y, perpx=-ey, perpy=ex;
    const eo=c*0.20, fo=c*0.14, r=c*0.13;
    for (const s of [1,-1]){
      const gx=cx+perpx*eo*s+ex*fo, gy=cy+perpy*eo*s+ey*fo;
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(gx,gy,r,0,7); ctx.fill();
      ctx.fillStyle="#20143a"; ctx.beginPath(); ctx.arc(gx+ex*r*0.4,gy+ey*r*0.4,r*0.55,0,7); ctx.fill();
    }
    if (state==="playing" && !reduceMotion && Math.sin(now/160)>0.4){
      ctx.strokeStyle="#ff5b7f"; ctx.lineWidth=Math.max(1.5,c*0.06); ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(cx+ex*c*0.3,cy+ey*c*0.3); ctx.lineTo(cx+ex*c*0.42,cy+ey*c*0.42); ctx.stroke();
    }
  }

  // ---- main loop ---------------------------------------------------------
  function frame(now){
    if (state==="playing"){
      while (now-lastTick>=stepMs){ lastTick+=stepMs; tick(); if(state!=="playing") break; }
    }
    render(now);
    requestAnimationFrame(frame);
  }

  // ---- boot --------------------------------------------------------------
  if (window.Money) window.Money.init();
  // if the saved skin is locked (e.g. refund), fall back to a free one
  if (!skinUnlocked(skinById(selSkin))) selSkin="grape";
  buildCats(); buildSkins(); updateTracker();
  // browsers need a gesture before audio — unlock voice on the first tap
  ["pointerdown","keydown"].forEach(ev =>
    addEventListener(ev, () => { if (window.Voice) window.Voice.unlock(); }, {once:true}));
  reset(); state="ready"; sizeCanvas();
  addEventListener("resize", sizeCanvas);
  requestAnimationFrame(frame);
})();
