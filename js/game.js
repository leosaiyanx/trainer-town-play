// game.js — main loop, player, townsfolk, wild creatures, egg, Team Rocket, HUD, saving.
(function () {
  const TT = window.TT, $ = TT.$, W = TT.World, P = TT.P, rand = TT.rand, Net = TT.Net;
  const G = TT.Game = {};
  let renderer, scene, camera, S = null, mode = 'title', t = 0, playT = 0, last = 0, lastReal = 0;
  let busy = false, panelOpen = false, battleCd = 0, nextRocket = 150, eggReadyAt = 0, netT = 0, saveT = 0, fireTold = false;
  const player = { x: 0, z: 8, h: Math.PI, mv: 0, root: null };
  let follower = null, eggObj = null, nestEgg = null, starObj = null;
  const npcs = [], wilds = [], respawns = [];
  const input = { x: 0, y: 0, keys: {} };
  let sun, quality = 2, qLock = false, qN = 0, qT = 0, dustT = 0;
  const blobs = [], actors = [], dust = [];
  let miniOn = true, miniT = 0, dest = null, beacon = null, mapBase = null; try { miniOn = localStorage.getItem('tt_mini') !== '0'; } catch (e) { }
  const cam = { x: 0, z: 8 };
  const NAMES = { ash: 'Ash', liko: 'Liko' }, STARTER = { ash: 'pikachu', liko: 'sprigatito' };

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false });
  function wrap(model, r) {
    const root = new THREE.Group(), sh = new THREE.Mesh(TT.G.disc, shadowMat);
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.035; sh.scale.setScalar(r || 0.4);
    sh.visible = quality < 2; blobs.push(sh); root.add(sh); root.add(model); root.userData.model = model; scene.add(root); return root;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

  // ---------- setup ----------
  function init() {
    renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = TT.scene = new THREE.Scene(); scene.background = new THREE.Color(0xcdeeff); scene.fog = new THREE.Fog(0xcdeeff, 55, 135);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa8c4a0, 0.6));
    sun = new THREE.DirectionalLight(0xfff2d8, 0.52); sun.position.set(18, 38, 24); scene.add(sun); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.002; sun.shadow.normalBias = 0.04;
    const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 130;
    quality = +(new URLSearchParams(location.search).get('q') || 2); qLock = location.search.indexOf('q=') >= 0;
    camera = new THREE.PerspectiveCamera(40, 1, 0.5, 900); document.body.classList.toggle('grade', quality >= 2);
    const tm = TT.timing = {}, t0 = performance.now();
    W.build(scene); tm.world = Math.round(performance.now() - t0);
    for (const d of W.NPCS) {
      const root = wrap(TT.human(TT.PEOPLE[d[1]]), 0.42), lab = TT.label(d[2]); lab.position.y = 2.25; root.add(lab);
      npcs.push({ key: d[0], name: d[2], x: d[3], z: d[4], hx: d[3], hz: d[4], r: d[5], lines: d[6], i: 0, h: 0, tx: d[3], tz: d[4], wait: rand(0, 3), root, lab, human: true, mv: 0 });
    }
    for (const d of W.PETS) {
      const root = wrap(TT.creature(d[0]), 0.35);
      npcs.push({ key: 'pet', name: d[1], x: d[2], z: d[3], hx: d[2], hz: d[3], r: d[4], lines: [d[5]], i: 0, h: 0, tx: d[2], tz: d[3], wait: rand(0, 3), root, mv: 0 });
    }
    for (const z of W.zones) for (let i = 0; i < z.n; i++) spawnWild(z);
    nestEgg = TT.eggModel(); nestEgg.position.set(W.NEST.x, 0.12, W.NEST.z); scene.add(nestEgg);
    starObj = TT.starBall(3, 0.34); starObj.position.set(W.STARSPOT.x, 0.7, W.STARSPOT.z); scene.add(starObj);
    eggObj = TT.eggModel(); eggObj.scale.setScalar(0.8); eggObj.visible = false; scene.add(eggObj);

    tm.chars = Math.round(performance.now() - t0);
    const duo = (k, sp) => () => { const g = new THREE.Group(), h = TT.human(TT.PEOPLE[k]), c = TT.creature(sp); h.position.x = -0.3; c.position.set(0.55, 0, 0.3); g.add(h); g.add(c); g.userData.h = 1.75; return g; };
    $('pLiko').src = TT.portrait('t_liko', duo('liko', 'sprigatito'), true); $('pAsh').src = TT.portrait('t_ash', duo('ash', 'pikachu'), true);
    tm.all = Math.round(performance.now() - t0);
    bindInput(); resize(); window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    Net.connect();
    const netNote = () => {
      const p2p = Net.mode === 'p2p'; $('bRoom').classList.toggle('hide', !p2p);
      $('bRoom').textContent = Net.room ? '👫 Family code: ' + Net.room : '👫 Enter family code to play together';
      $('netNote').textContent = Net.on ? (Net.count() ? '👫 Another player is in town — jump in!' : '🟢 Multiplayer ready — waiting for the other player') : (p2p && Net.room ? 'Connecting to your family room…' : '');
    };
    setInterval(netNote, 1000); netNote();
    $('bRoom').onclick = () => { const c = prompt('Family code (the same on every device):', Net.room || ''); if (c != null && !Net.setRoom(c)) alert('The code needs at least 3 letters or numbers.'); netNote(); };
    // dev/test hook: ?play=ash&x=..&z=..&skip=1&evt=battle|rocket|team|map
    const q = new URLSearchParams(location.search);
    if (q.get('play')) {
      startGame(q.get('play'));
      if (q.get('skip')) setInterval(() => { if (TT.dialogOpen && !q.get('hold')) TT.dialogNext(); }, 120);
      if (q.get('x')) { player.x = cam.x = +q.get('x'); player.z = cam.z = +q.get('z'); follower.x = player.x + 1; follower.z = player.z + 0.6; }
      if (q.get('party')) S.party = q.get('party').split(',').map(k => TT.mon(k, 5));
      if (q.get('walk')) setTimeout(() => { input.keys[q.get('walk')] = 1; }, 900);
      const ev = q.get('evt');
      setTimeout(() => { if (ev === 'battle') wildBattle(wilds[+q.get('w') || 0]); if (ev === 'rocket') nextRocket = 0; if (ev === 'team') showTeam(); if (ev === 'map') showMap(); if (ev === 'town') showTownMap(); if (ev === 'menu') showMenu(); if (ev === 'egg') { S.egg = { have: true, warm: 97 }; } }, 600);
    }
    requestAnimationFrame(frame);
    setInterval(() => { if (performance.now() - lastReal > 400) G.tick(performance.now()); }, 200);
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  function newSave(ch) { return { v: 1, ch, party: [TT.mon(STARTER[ch], 5)], box: [], balls: 3, stars: [], egg: { have: false, warm: 0 }, flags: {}, rocket: 0, caught: [] }; }
  function save() { try { localStorage.setItem('tt1_' + S.ch, JSON.stringify(S)); } catch (e) { } }
  function startGame(ch) {
    TT.audioInit();
    let fresh = true;
    try { const j = JSON.parse(localStorage.getItem('tt1_' + ch)); if (j && j.v === 1 && j.party && j.party.length) { S = j; fresh = false; } } catch (e) { }
    if (fresh) S = newSave(ch);
    TT.S = S;
    player.root = wrap(TT.human(TT.PEOPLE[ch]), 0.42); player.x = cam.x = ch === 'ash' ? 1.5 : -1.5; player.z = 8; player.h = Math.PI;
    setFollower();
    $('title').classList.add('hide'); for (const id of ['hud', 'joy', 'act']) $(id).classList.remove('hide');
    mode = 'play'; TT.music('town'); setMini(miniOn); nextRocket = S.caught.length ? 60 : 150; hud();
    if (fresh) intro();
  }
  async function intro() {
    busy = true;
    const p = TT.monName(S.party[0]);
    await TT.say([['Professor Oak', 'Welcome to Trainer Town, ' + NAMES[S.ch] + '!'], ['', p + ' is your partner and will follow you everywhere!'], ['', 'Move with the stick. Press the yellow button to talk to people and Pokémon.'], ['Professor Oak', 'Come see me at the Lab — the big building at the top of town!']]);
    busy = false; save();
  }
  function setFollower() {
    const old = follower;
    if (old) scene.remove(old.root);
    const m = S.party[0];
    follower = { sp: m.sp, x: old ? old.x : player.x + 1, z: old ? old.z : player.z + 1, h: 0, mv: 0, root: wrap(TT.creature(m.sp), 0.35) };
  }

  // ---------- wild creatures ----------
  function zonePoint(z) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * 6.283, r = z.ring ? z.ring + rand(0, z.r - z.ring) : Math.sqrt(Math.random()) * (z.r - 1.2);
      const x = z.x + Math.cos(a) * r, zz = z.z + Math.sin(a) * r;
      if (!W.blocked(x, zz, 0.5)) return [x, zz];
    }
    return [z.x + (z.ring || 0), z.z];
  }
  function spawnWild(z) {
    const sp = TT.pick(z.pool), p = zonePoint(z);
    const bonus = S ? Math.max(0, Math.floor((S.party[0].lvl - 6) / 2)) : 0;
    const w = { sp, lvl: (rand(z.lv[0], z.lv[1] + 1) | 0) + bonus, zone: z, x: p[0], z: p[1], h: rand(0, 6), tx: p[0], tz: p[1], wait: rand(0, 3), mv: 0, root: wrap(TT.creature(sp), 0.35) };
    wilds.push(w);
  }
  function removeWild(w) { scene.remove(w.root); wilds.splice(wilds.indexOf(w), 1); respawns.push({ z: w.zone, at: playT + 18 }); }

  function wander(e, dt, speed, pickTarget) {
    if (e.wait > 0) { e.wait -= dt; e.mv = 0; return; }
    const dx = e.tx - e.x, dz = e.tz - e.z, d = Math.hypot(dx, dz);
    if (d < 0.3) { e.wait = rand(1.5, 5); pickTarget(e); return; }
    const nx = e.x + dx / d * speed * dt, nz = e.z + dz / d * speed * dt;
    if (W.blocked(nx, nz, 0.45)) { e.wait = 0.5; pickTarget(e); return; }
    e.x = nx; e.z = nz; e.h = TT.angLerp(e.h, Math.atan2(dx, dz), Math.min(1, dt * 8)); e.mv = 1;
  }
  function placeEnt(e, isHuman) {
    const r = e.root, m = r.userData.model;
    r.position.set(e.x, 0, e.z); r.rotation.y = e.h;
    const d = Math.hypot(e.x - player.x, e.z - player.z);
    r.visible = d < 48;
    if (!r.visible) return;
    const near = d < 26 && quality > 0, u = m.userData;
    if (u.ols && u.olOn !== near) { u.olOn = near; for (const o of u.ols) o.visible = near; }
    if (isHuman) TT.animHuman(m, t, e.mv); else TT.animCreature(m, t, e.mv);
  }
  function follow(f, tx, tz, dt, gap) {
    const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
    if (d > 14) { f.x = tx; f.z = tz + 1; return; }
    if (d > gap) { const sp = Math.min(9, (d - gap) * 5 + 1.5); f.x += dx / d * sp * dt; f.z += dz / d * sp * dt; f.h = TT.angLerp(f.h, Math.atan2(dx, dz), Math.min(1, dt * 10)); f.mv = 1; }
    else f.mv = 0;
  }

  // ---------- talking ----------
  function nearestNpc() { let best = null, bd = 2.9; for (const n of npcs) { const d = dist(n, player); if (d < bd) { bd = d; best = n; } } return best; }
  async function talk(n) {
    busy = true; n.h = Math.atan2(player.x - n.x, player.z - n.z); player.h = Math.atan2(n.x - player.x, n.z - player.z);
    const mdl = n.root.userData.model; if (n.human) mdl.userData.gesture = 'talk';
    if (n.key === 'prof') await prof(); else if (n.key === 'nurse') await nurse();
    else await TT.say([[n.name, n.lines[n.i++ % n.lines.length]]]);
    mdl.userData.gesture = null; busy = false; hud(); save();
  }
  async function prof() {
    const N = 'Professor Oak', f = S.flags;
    if (!f.profMet) {
      f.profMet = 1; S.balls += 5; TT.sfx.pick();
      await TT.say([[N, 'Ah, ' + NAMES[S.ch] + '! You made it.'], [N, 'I have a mission for you: catch 3 different kinds of Pokémon in the tall grass.'], [N, 'Here are 5 Poké Balls to get you started!'], [N, 'Tip: battle a wild Pokémon until its HP is low, THEN throw a ball.']]);
    } else if (!f.profDone) {
      if (S.caught.length >= 3) {
        f.profDone = 1; await TT.say([[N, 'Wonderful! You caught ' + S.caught.length + ' kinds of Pokémon!'], [N, 'You have earned something very special...']]);
        await giveStar(2); S.balls += 5;
        await TT.say([[N, 'There are seven Dragon Balls. Collect them all and the great Dragon will appear!'], [N, "They say a mighty warrior named Goku guards one. But that's far beyond the City..."], [N, 'Take 5 more Poké Balls too!']]);
      } else await TT.say([[N, 'You have caught ' + S.caught.length + ' of 3 kinds so far. Keep going!'], [N, 'Look in the dark green tall grass, and around the pond.']]);
    } else await TT.say([[N, TT.pick(['Keep training! When your Pokémon level up, they learn stronger moves.', 'The road to the City opens soon. Collect all the Dragon Balls you can find in town first!', 'Have you hatched an egg yet? Look for one in the West Meadow nest.'])]]);
  }
  async function nurse() {
    await TT.say([['Nurse Joy', 'Welcome to the Poké Center! Let me take care of your Pokémon.']]);
    S.party.forEach(m => m.hp = TT.maxHp(m)); TT.sfx.heal(); await TT.wait(0.8);
    await TT.say([['Nurse Joy', 'All better! Your Pokémon are full of energy. ♪']]);
  }
  async function giveStar(n) {
    if (S.stars.indexOf(n) >= 0) return;
    S.stars.push(n); TT.sfx.star(); hud();
    const lines = [['', 'You got the ' + n + '-Star Dragon Ball!  (' + S.stars.length + ' of 7)']];
    if (S.stars.length === 3) lines.push(['', "That's every Dragon Ball hidden in town! The others wait in the City and beyond..."]);
    await TT.say(lines); save();
  }
  function addMon(m) {
    delete m.caughtNow;
    if (S.caught.indexOf(m.sp) < 0) S.caught.push(m.sp);
    if (S.caught.length === 1) nextRocket = Math.min(nextRocket, playT + 25);
    if (S.party.length < 6) S.party.push(m); else { S.box.push(m); TT.toast(TT.monName(m) + ' was sent to the Lab!'); }
  }

  // ---------- events ----------
  async function wildBattle(w) {
    if (!S.party.some(m => m.hp > 0)) { TT.toast('Your Pokémon are tired! Visit Nurse Joy.'); battleCd = 4; return; }
    busy = true; stopInput();
    const foe = TT.mon(w.sp, w.lvl), r = await TT.Battle.start({ foes: [foe], wild: true });
    if (r === 'caught') { foe.hp = TT.maxHp(foe); addMon(foe); removeWild(w); } else if (r === 'win') removeWild(w); else if (r === 'lose') await whiteOut();
    battleCd = 2.5; if (follower.sp !== S.party[0].sp) setFollower(); hud(); save(); busy = false;
  }
  async function whiteOut() {
    S.party.forEach(m => m.hp = TT.maxHp(m)); player.x = W.CENTER.x; player.z = W.CENTER.z + 2.2; follower.x = player.x + 1; follower.z = player.z + 1;
    TT.sfx.heal();
    await TT.say([['Nurse Joy', 'Oh dear, your Pokémon fainted! I carried you back and healed them all up.'], ['Nurse Joy', 'Be careful out there!']]);
  }
  async function hatch() {
    busy = true; stopInput(); S.egg.warm = 100; hud();
    const ex = player.x, ez = player.z + 1.6; eggObj.position.set(ex, 0, ez); player.h = 0;
    await TT.say([['', 'Oh? The egg is moving!']]);
    for (let i = 0; i < 4; i++) { TT.sfx.shake(); await TT.tween(0.4, k => { eggObj.rotation.z = Math.sin(k * 6.28) * (0.2 + i * 0.1); }); await TT.wait(0.3 - i * 0.05); }
    const flash = P(scene, 'sph', TT.glow(0xffffff), [ex, 0.5, ez], 0.2); TT.sfx.evo();
    await TT.tween(0.4, k => flash.scale.setScalar(0.2 + k * 1.4));
    eggObj.visible = false; eggObj.rotation.z = 0;
    const sp = TT.pick(['eevee', 'charmander', 'squirtle', 'bulbasaur'].filter(s => S.caught.indexOf(s) < 0).concat('eevee')), baby = TT.creature(sp);
    baby.position.set(ex, 0, ez); scene.add(baby);
    await TT.tween(0.5, k => { flash.scale.setScalar(1.6 * (1 - k) + 0.01); baby.scale.setScalar(0.2 + 0.8 * k); baby.position.y = Math.sin(k * 3.14) * 0.6; });
    scene.remove(flash);
    const m = TT.mon(sp, 3); S.egg = { have: false, warm: 0 }; eggReadyAt = playT + 240;
    await TT.say([['', 'The egg hatched! It\'s a baby ' + TT.monName(m) + '!'], ['', TT.monName(m) + ' joined your team!']]);
    scene.remove(baby); addMon(m); hud(); save(); busy = false;
  }
  async function rocketEvent() {
    busy = true; stopInput(); TT.music('rocket');
    const pm = S.party[0], pn = TT.monName(pm), me = NAMES[S.ch], n = S.rocket;
    let bx = TT.clamp(player.x, -50, 50), bz = TT.clamp(player.z - 5, -50, 50);
    const g = new THREE.Group(); g.position.set(bx, 14, bz); scene.add(g);
    const je = TT.human(TT.PEOPLE.jessie), ja = TT.human(TT.PEOPLE.james), mw = TT.creature('meowth');
    je.position.set(-0.9, 0, 0); ja.position.set(0.9, 0, 0); mw.position.set(0, 0, 0.9); g.add(je); g.add(ja); g.add(mw); actors.push(je, ja, mw); je.userData.gesture = 'point';
    const bal = new THREE.Group(); bal.position.set(0, 0, -1.2); g.add(bal);
    P(bal, 'sph', 0xf3e3b0, [0, 5.4, 0], [2, 2.2, 2]); for (const s of [1, -1]) P(bal, 'cone', 0x1c1c22, [s * 1.2, 7.4, 0], [0.6, 1.2, 0.3], [0, 0, -s * 0.4]);
    P(bal, 'sph', 0xf2c230, [0, 6.4, 1.8], [0.3, 0.5, 0.15]); for (const s of [1, -1]) P(bal, 'sph', 0x1c1c22, [s * 0.7, 5.7, 1.85], [0.3, 0.4, 0.1]);
    P(bal, 'box', 0x9a6a3a, [0, 1.2, 0], [1.6, 1.1, 1.6]); for (const s of [1, -1]) P(bal, 'cyl', 0x6a5a48, [s * 0.7, 2.6, 0], [0.03, 2.2, 0.03]);
    player.h = Math.PI;
    await TT.tween(1.6, k => { g.position.y = 14 * (1 - TT.ease(k)); });
    const lines = [['???', 'Prepare for trouble!'], ['???', 'And make it double!'], ['Jessie', 'Jessie!'], ['James', 'James!'], ['Meowth', "Meowth, that's right!"]];
    if (n === 1) lines.push(['James', 'And this time our Pumpkaboo evolved into Gourgeist!']);
    lines.push(['Jessie', 'Hand over that ' + pn + ', twerp!']);
    await TT.say(lines);
    const fx = follower.x, fz = follower.z; TT.sfx.throw();
    await TT.tween(0.8, k => { follower.x = fx + (bx - fx) * k; follower.z = fz + (bz + 0.2 - fz) * k; follower.root.position.set(follower.x, Math.sin(k * 3.14) * 2, follower.z); });
    await TT.say([['Meowth', 'Gotcha! ' + pn + ' is ours now!'], [me, 'Hey! Give ' + pn + ' back!'], [pn, '(' + pn + ' broke out of the net!)'], [me, pn + ", let's battle and send them flying!"]]);
    pm.hp = TT.maxHp(pm);
    const L = Math.max(2, pm.lvl - 3);
    const r = await TT.Battle.start({ foes: [TT.mon(n === 0 ? 'pumpkaboo' : 'gourgeist', L), TT.mon('inkay', L), TT.mon('meowth', L)], trainer: 'Team Rocket', people: ['jessie', 'james'], easy: true, music: 'rocket', after: 'rocket' });
    if (r === 'win') await TT.say([['Jessie', 'We lost AGAIN?!'], ['Meowth', "It's not fair!"]]);
    else { S.party.forEach(m => m.hp = TT.maxHp(m)); await TT.say([['James', 'We... won? We actually won?!'], ['Meowth', 'Uh oh. The balloon is leaking!'], [pn, '(' + pn + ' jumped back to you!)']]); }
    TT.sfx.rocket();
    TT.say([['Team Rocket', "Looks like Team Rocket's blasting off agaaaain!"]]);
    await TT.tween(2.2, k => { g.position.set(bx + k * k * 40, k * k * 60, bz - k * 30); g.rotation.z = k * 3; g.scale.setScalar(1 - k * 0.7); });
    scene.remove(g); actors.length = 0; const star = P(scene, 'sph', TT.glow(0xffffff), [player.x + 12, 14, player.z - 30], 0.5); TT.sfx.pick();
    await TT.tween(0.5, k => star.scale.setScalar(0.5 + Math.sin(k * 3.14) * 1.2)); scene.remove(star);
    while (TT.dialogOpen) await TT.wait(0.1);
    follower.x = player.x + 1; follower.z = player.z + 0.5; if (follower.sp !== S.party[0].sp) setFollower();
    S.rocket++;
    if (r === 'win') { if (S.stars.indexOf(1) < 0) { await TT.say([['', 'Team Rocket dropped something shiny...']]); await giveStar(1); } else { S.balls += 3; TT.sfx.pick(); await TT.say([['', 'Team Rocket dropped 3 Poké Balls!']]); } }
    nextRocket = playT + rand(240, 360); battleCd = 2; TT.music('town'); hud(); save(); busy = false;
  }

  // ---------- HUD / panels ----------
  function hud() {
    if (!S) return;
    $('nBall').textContent = S.balls; $('nStar').textContent = S.stars.length;
    $('chipEgg').classList.toggle('hide', !S.egg.have); $('eggBar').style.width = Math.min(100, S.egg.warm) + '%';
    let q;
    if (!S.flags.profMet) q = '➜ Visit Professor Oak at the Lab (top of town)';
    else if (!S.flags.profDone) q = S.caught.length >= 3 ? '➜ Go show Professor Oak!' : '➜ Catch 3 kinds of Pokémon in the tall grass (' + S.caught.length + '/3)';
    else if (S.egg.have) q = '➜ Warm the egg by the campfire';
    else if (S.stars.length < 3) q = '➜ Find the Dragon Balls hidden in town (' + S.stars.length + '/3)';
    else q = '★ You found every Dragon Ball in town! The City opens soon.';
    $('quest').textContent = q;
  }
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  function openPanel(html) { $('panelIn').innerHTML = html; $('panel').classList.remove('hide'); panelOpen = true; stopInput(); const c = $('pClose'); if (c) c.onclick = closePanel; }
  function closePanel() { $('panel').classList.add('hide'); panelOpen = false; }
  function showTeam() {
    let h = '<h3>My Team <button id="pClose">✕</button></h3>';
    S.party.forEach((m, i) => {
      const ty = TT.DEX[m.sp][1], k = m.hp / TT.maxHp(m);
      h += '<button class="mon' + (i ? '' : ' lead') + '" data-i="' + i + '"><img src="' + TT.monPortrait(m.sp) + '"><div class="inf"><b>' + TT.monName(m) + '</b><span class="tag" style="background:' + hex(TT.TYPE_COL[ty]) + '">' + ty + '</span> &nbsp;Lv ' + m.lvl +
        '<div class="hp"><div style="width:' + k * 100 + '%;background:' + (k > 0.5 ? '#4cd964' : k > 0.22 ? '#f2c230' : '#e8402a') + '"></div></div></div><em>' + (i ? 'Make partner' : 'Partner') + '</em></button>';
    });
    if (S.box.length) h += '<p><b>' + S.box.length + '</b> more Pokémon are resting at the Lab.</p>';
    h += '<p style="font-size:13px;opacity:.7;margin:6px 0 0">Tap a Pokémon to make it your partner. Your partner walks with you and battles first.</p>';
    openPanel(h);
    document.querySelectorAll('#panelIn .mon').forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i) { const m = S.party.splice(i, 1)[0]; S.party.unshift(m); setFollower(); save(); TT.sfx.pick(); showTeam(); } });
  }
  function showMap() {
    let h = '<h3>World Map <button id="pClose">✕</button></h3><div class="mapgrid">' +
      '<div class="place go" id="pTown">🏡 Trainer Town<small>You are here! Tap to open the town map ➜</small></div><div class="place lock">🏙️ The City<small>Coming soon</small></div>' +
      '<div class="place lock">🌍 The Wide World<small>Goku waits halfway...</small></div><div class="place lock">🐉 Dragon\'s Lair<small>Needs all 7 Dragon Balls</small></div></div><div class="stars">';
    for (let i = 1; i <= 7; i++) h += '<i class="' + (S.stars.indexOf(i) >= 0 ? 'got' : '') + '">' + '★'.repeat(i > 4 ? 1 : i) + (i > 4 ? i : '') + '</i>';
    h += '</div><p style="text-align:center;font-weight:700;margin:4px 0 10px">Dragon Balls: ' + S.stars.length + ' / 7</p><p style="text-align:center;margin:0"><button id="pReset" style="background:none;text-decoration:underline;font-size:13px;opacity:.6">Start this character over</button></p>';
    openPanel(h);
    $('pTown').onclick = showTownMap;
    $('pReset').onclick = () => { if (confirm('Erase ' + NAMES[S.ch] + "'s saved game and start over?")) { localStorage.removeItem('tt1_' + S.ch); location.reload(); } };
  }

  // ---------- menu, main-menu return ----------
  function showMenu() {
    const lab = () => { $('mSound').textContent = (TT.muted ? '🔇' : '🔊') + ' Sound & music: ' + (TT.muted ? 'Off' : 'On'); $('mVoice').textContent = '🗣 Voices: ' + (TT.voiceOn ? 'On' : 'Off'); $('mMini').textContent = '🗺 Mini-map: ' + (miniOn ? 'On' : 'Off'); };
    openPanel('<h3>Menu <button id="pClose">✕</button></h3><button class="opt" id="mResume">▶ Keep playing</button><button class="opt" id="mSound"></button><button class="opt" id="mVoice"></button><button class="opt" id="mMini"></button><button class="opt red" id="mTitle">🏠 Main menu</button><p style="font-size:13px;opacity:.7;margin:4px 0 0;text-align:center">Your game saves by itself.</p>');
    lab();
    $('mResume').onclick = closePanel;
    $('mSound').onclick = () => { TT.setMuted(!TT.muted); lab(); };
    $('mVoice').onclick = () => { TT.setVoice(!TT.voiceOn); lab(); if (TT.voiceOn) TT.cry(S.party[0].sp); };
    $('mMini').onclick = () => { setMini(!miniOn); lab(); };
    $('mTitle').onclick = toTitle;
  }
  function toTitle() {
    save(); closePanel(); stopInput(); TT.hush(); setDest(null);
    scene.remove(player.root); if (follower) scene.remove(follower.root); follower = null; eggObj.visible = false; player.root = null;
    S = null; TT.S = null; mode = 'title';
    for (const id of ['hud', 'joy', 'act', 'mini', 'miniBtn']) $(id).classList.add('hide');
    $('title').classList.remove('hide');
  }

  // ---------- maps ----------
  const css = n => '#' + n.toString(16).padStart(6, '0'), MS = 512 / 160, mp = v => (v + 80) * MS;
  function baseMap() {
    if (mapBase) return mapBase;
    const c = mapBase = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.drawImage(W.groundCanvas, 0, 0, 512, 512);
    x.fillStyle = '#3fa6ea'; x.beginPath(); x.arc(mp(W.POND.x), mp(W.POND.z), W.POND.r * MS, 0, 7); x.fill(); x.strokeStyle = '#cdeeff'; x.lineWidth = 2; x.stroke();
    for (const t of W.trees) { if (Math.abs(t[0]) > 79 || Math.abs(t[1]) > 79) continue; x.fillStyle = t[3] === 'pine' ? '#2f8048' : t[3] === 'blossom' ? '#f7a8c8' : '#4aa64e'; x.beginPath(); x.arc(mp(t[0]), mp(t[1]), 1.5 * t[2] * MS, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(mp(t[0]) - 1, mp(t[1]) - 1, 0.7 * t[2] * MS, 0, 7); x.fill(); }
    const roof = (cx, cz, w, d, col) => { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(mp(cx - w / 2) - 2, mp(cz - d / 2) - 2, w * MS + 2, d * MS + 2); x.fillStyle = col; x.fillRect(mp(cx - w / 2), mp(cz - d / 2), w * MS, d * MS); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(mp(cx - w / 2), mp(cz) - 1, w * MS, 2); };
    for (const h of W.HOUSES) roof(h[0], h[1], h[2] + 1, h[3] + 1, css(h[5]));
    roof(-18, -10, 11, 9, '#e2382e'); x.fillStyle = '#fff'; x.beginPath(); x.arc(mp(-18), mp(-10), 7, 0, 7); x.fill();
    roof(0, -31, 16, 10, '#5a7ab8'); x.fillStyle = '#8ab8e8'; x.beginPath(); x.arc(mp(-3.5), mp(-31.5), 8, 0, 7); x.fill();
    x.fillStyle = '#e2e2ea'; x.beginPath(); x.arc(mp(0), mp(0), 2.7 * MS, 0, 7); x.fill(); x.fillStyle = '#6ac8f8'; x.beginPath(); x.arc(mp(0), mp(0), 1.9 * MS, 0, 7); x.fill();
    x.fillStyle = '#ff7a1a'; x.beginPath(); x.arc(mp(W.FIRE.x), mp(W.FIRE.z), 3.5, 0, 7); x.fill();
    x.strokeStyle = '#d8b070'; x.lineWidth = 2; x.strokeRect(mp(-57.4), mp(-57.4), 114.8 * MS, 114.8 * MS);
    return c;
  }
  function setMini(on) { miniOn = on; try { localStorage.setItem('tt_mini', on ? '1' : '0'); } catch (e) { } const p = mode === 'play'; $('mini').classList.toggle('hide', !(on && p)); $('miniBtn').classList.toggle('hide', !(!on && p)); }
  function setDest(d) {
    dest = d;
    if (!beacon) { beacon = new THREE.Group(); P(beacon, 'cyl', new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0.35, depthWrite: false }), [0, 4, 0], [0.5, 8, 0.5]); P(beacon, 'cone', TT.glow(0xffb020), [0, 3.2, 0], [0.5, 1, 0.5], [Math.PI, 0, 0]); P(beacon, 'cyl', new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0.5, depthWrite: false }), [0, 0.06, 0], [1.3, 0.04, 1.3]); scene.add(beacon); }
    beacon.visible = !!d; if (d) beacon.position.set(d.x, 0, d.z);
  }
  function drawMini() {
    const c = $('mini'), x = c.getContext('2d'), R = 28, k = 264 / (R * 2), X = v => (v - player.x + R) * k, Z = v => (v - player.z + R) * k;
    x.fillStyle = '#74c456'; x.fillRect(0, 0, 264, 264);
    x.drawImage(baseMap(), mp(player.x - R), mp(player.z - R), R * 2 * MS, R * 2 * MS, 0, 0, 264, 264);
    const dot = (px, pz, col, r) => { x.fillStyle = col; x.strokeStyle = '#23324a'; x.lineWidth = 2; x.beginPath(); x.arc(X(px), Z(pz), r, 0, 7); x.fill(); x.stroke(); };
    for (const w of wilds) dot(w.x, w.z, '#ff5a4a', 5);
    for (const n of npcs) dot(n.x, n.z, n.human ? '#ffd23c' : '#ffa0c0', 5);
    for (const id in Net.peers) { const p = Net.peers[id]; if (p.root) dot(p.x, p.z, '#3aa0e8', 8); }
    if (dest) { const dx = TT.clamp(X(dest.x), 14, 250), dz = TT.clamp(Z(dest.z), 14, 250); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 3; x.setLineDash([8, 6]); x.beginPath(); x.moveTo(132, 132); x.lineTo(dx, dz); x.stroke(); x.setLineDash([]); x.font = '26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('📍', dx, dz - 8); }
    x.save(); x.translate(132, 132); x.rotate(Math.PI - player.h); x.fillStyle = '#fff'; x.strokeStyle = '#23324a'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -15); x.lineTo(11, 11); x.lineTo(0, 5); x.lineTo(-11, 11); x.closePath(); x.fill(); x.stroke(); x.restore();
  }
  function showTownMap() {
    const size = Math.max(240, Math.min(window.innerWidth * 0.86, window.innerHeight * 0.58, 560)) | 0;
    openPanel('<h3>Trainer Town <button id="pClose">✕</button></h3><canvas id="townMap" width="' + size * 2 + '" height="' + size * 2 + '" style="width:' + size + 'px;height:' + size + 'px"></canvas><div id="mapInfo">Tap a place to learn about it.</div><div class="row"><button id="mGo" disabled>📍 Guide me there</button><button id="mClear" class="alt">Stop guiding</button><button id="mBack" class="alt">World map</button></div>');
    const V = 62, c = $('townMap'), x = c.getContext('2d'), k = size * 2 / (V * 2), X = v => (v + V) * k; let sel = null, tick = 0;
    const draw = () => {
      if (!c.isConnected || !S) return clearInterval(iv);
      tick++; x.drawImage(baseMap(), mp(-V), mp(-V), V * 2 * MS, V * 2 * MS, 0, 0, size * 2, size * 2);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const p of W.PLACES) {
        const on = sel && sel.p === p; x.font = (on ? 46 : 36) * size / 500 + 'px sans-serif'; x.fillText(p[3], X(p[1]), X(p[2]));
        x.font = '800 ' + (22 * size / 500) + 'px "Avenir Next","Trebuchet MS",sans-serif'; x.lineWidth = 5; x.strokeStyle = on ? '#ffd23c' : 'rgba(255,255,255,.92)'; x.fillStyle = '#23324a'; x.strokeText(p[0], X(p[1]), X(p[2]) + 30 * size / 500); x.fillText(p[0], X(p[1]), X(p[2]) + 30 * size / 500);
      }
      const dot = (px, pz, col, r) => { x.fillStyle = col; x.strokeStyle = '#23324a'; x.lineWidth = 3; x.beginPath(); x.arc(X(px), X(pz), r, 0, 7); x.fill(); x.stroke(); };
      for (const n of npcs) if (n.human) dot(n.x, n.z, '#ffd23c', 6);
      for (const id in Net.peers) { const p = Net.peers[id]; if (p.root) dot(p.x, p.z, '#3aa0e8', 10); }
      const d = sel || (dest && { x: dest.x, z: dest.z }); if (d) { x.font = 44 * size / 500 + 'px sans-serif'; x.fillText('📍', X(d.x), X(d.z) - 16); }
      const pulse = 10 + Math.sin(tick * 0.5) * 4; x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.arc(X(player.x), X(player.z), pulse + 8, 0, 7); x.fill(); dot(player.x, player.z, '#e8402a', 9);
    };
    const iv = setInterval(draw, 120); draw();
    c.addEventListener('pointerdown', e => {
      e.preventDefault(); const r = c.getBoundingClientRect(), wx = (e.clientX - r.left) / r.width * V * 2 - V, wz = (e.clientY - r.top) / r.height * V * 2 - V;
      let best = null, bd = 9; for (const p of W.PLACES) { const d = Math.hypot(p[1] - wx, p[2] - wz); if (d < bd) { bd = d; best = p; } }
      if (best) { sel = { p: best, x: best[5], z: best[6], n: best[0] }; $('mapInfo').innerHTML = '<b>' + best[3] + ' ' + best[0] + '</b><br>' + best[4]; }
      else { const q = W.collide(TT.clamp(wx, -55, 55), TT.clamp(wz, -55, 55), 0.6); sel = { x: q[0], z: q[1], n: 'that spot' }; $('mapInfo').innerHTML = '<b>📍 This spot</b><br>Tap "Guide me there" to get an arrow to it.'; }
      $('mGo').disabled = false; TT.sfx.blip(); draw();
    });
    $('mGo').onclick = () => { if (!sel) return; setDest({ x: sel.x, z: sel.z, n: sel.n }); clearInterval(iv); closePanel(); TT.sfx.pick(); TT.toast('Follow the 📍 to ' + sel.n + '!'); };
    $('mClear').onclick = () => { setDest(null); sel = null; $('mGo').disabled = true; $('mapInfo').textContent = 'Tap a place to learn about it.'; draw(); };
    $('mBack').onclick = () => { clearInterval(iv); showMap(); };
  }

  // ---------- input ----------
  let joyId = null, ox = 0, oy = 0;
  function stopInput() { joyId = null; input.x = input.y = 0; $('nub').style.transform = ''; }
  function bindInput() {
    const joy = $('joy'), nub = $('nub'), cv = $('c');
    const start = (e, fixed) => {
      TT.audioInit();
      if (TT.dialogOpen) { TT.dialogNext(); return; }
      if (joyId !== null || mode !== 'play') return;
      joyId = e.pointerId;
      if (fixed) { const r = joy.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; } else { ox = e.clientX; oy = e.clientY; }
      move(e);
    };
    const move = e => {
      if (e.pointerId !== joyId) return;
      let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy), m = 48;
      if (d > m) { dx *= m / d; dy *= m / d; }
      input.x = dx / m; input.y = dy / m; nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    };
    const end = e => { if (e.pointerId === joyId) stopInput(); };
    joy.addEventListener('pointerdown', e => { e.preventDefault(); start(e, true); });
    cv.addEventListener('pointerdown', e => { e.preventDefault(); start(e, false); });
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    $('act').addEventListener('pointerdown', e => { e.preventDefault(); TT.audioInit(); interact(); });
    $('bTeam').onclick = () => { if (!busy && S) showTeam(); }; $('bMap').onclick = () => { if (!busy && S) showMap(); };
    $('bMenu').onclick = () => { TT.audioInit(); if (!busy && S) showMenu(); };
    $('mini').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); setMini(false); });
    $('miniBtn').onclick = () => setMini(true);
    $('panel').addEventListener('pointerdown', e => { if (e.target === $('panel')) closePanel(); });
    window.addEventListener('keydown', e => {
      input.keys[e.code] = 1;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); TT.audioInit(); interact(); }
      if (e.code === 'Escape' && panelOpen) closePanel();
    });
    window.addEventListener('keyup', e => { input.keys[e.code] = 0; });
    window.addEventListener('blur', () => { input.keys = {}; stopInput(); });
    document.addEventListener('contextmenu', e => e.preventDefault());
  }
  function interact() {
    if (TT.dialogOpen) { TT.dialogNext(); return; }
    if (mode !== 'play' || busy || panelOpen) return;
    const n = nearestNpc(); if (n) talk(n);
  }

  // ---------- multiplayer avatars ----------
  function updatePeers(dt) {
    for (const id in Net.peers) {
      const p = Net.peers[id], d = p.d;
      if (p.gone || !d || performance.now() - p.last > 8000) { if (p.root) { scene.remove(p.root); scene.remove(p.fol.root); } delete Net.peers[id]; continue; }
      if (!p.root || p.ch !== d.c) {
        if (p.root) scene.remove(p.root);
        p.ch = d.c; p.root = wrap(TT.human(TT.PEOPLE[d.c] || TT.PEOPLE.kid), 0.42); p.x = d.x; p.z = d.z; p.h = d.h;
        const lab = TT.label(NAMES[d.c] || 'Friend', 'rgba(58,160,232,.9)'); lab.position.y = 2.2; p.root.add(lab);
      }
      if (!p.fol || p.sp !== d.p) { if (p.fol) scene.remove(p.fol.root); p.sp = d.p; p.fol = { x: d.x + 1, z: d.z + 1, h: 0, mv: 0, root: wrap(TT.creature(d.p), 0.35) }; }
      const k = Math.min(1, dt * 10); p.x += (d.x - p.x) * k; p.z += (d.z - p.z) * k; p.h = TT.angLerp(p.h, d.h, k); p.mv = d.m;
      placeEnt(p, true); follow(p.fol, p.x, p.z, dt, 1.5); placeEnt(p.fol, false);
    }
    const c = Net.count(); $('chipNet').classList.toggle('hide', !c); if (c) $('netTxt').textContent = '👫 ' + (c + 1);
  }

  // ---------- main update ----------
  function update(dt) {
    W.update(t, camera, mode === 'play' && !TT.Battle.active ? player.x : null, player.z);
    TT.uTime.value = t;
    { const fx = Math.round(TT.Battle.active ? W.ARENA.x : mode === 'play' ? cam.x : 0), fz = Math.round(TT.Battle.active ? W.ARENA.z : mode === 'play' ? cam.z : 0); sun.position.set(fx + 18, 38, fz + 24); sun.target.position.set(fx, 0, fz); sun.target.updateMatrixWorld(); }
    for (const a of actors) { if (a.userData.human) TT.animHuman(a, t, 0); else TT.animCreature(a, t, 0); }
    for (const d of dust) if (d.visible) { d.userData.k += dt * 2.2; const k = d.userData.k; if (k >= 1) d.visible = false; else { d.scale.setScalar(0.12 + k * 0.4); d.position.y = 0.1 + k * 0.5; d.material.opacity = 0.5 * (1 - k); } }
    if (document.body.classList.contains('inbattle') !== TT.Battle.active) document.body.classList.toggle('inbattle', TT.Battle.active);
    for (const n of npcs) {
      if (!(busy && dist(n, player) < 3)) { if (n.r > 0) wander(n, dt, n.human ? 1.1 : 1.4, e => { const a = Math.random() * 6.283, r = Math.random() * e.r; e.tx = e.hx + Math.cos(a) * r; e.tz = e.hz + Math.sin(a) * r; }); }
      else n.mv = 0;
      placeEnt(n, n.human);
      if (n.lab) n.lab.visible = dist(n, player) < 9;
    }
    for (const w of wilds) { wander(w, dt, 1.3, e => { const p = zonePoint(e.zone); e.tx = p[0]; e.tz = p[1]; }); placeEnt(w, false); }
    updatePeers(dt);
    if (TT.Battle.active) { TT.Battle.update(dt, t); TT.Battle.camera(camera, camera.aspect, t); }
    if (mode !== 'play') { camera.position.set(Math.sin(t * 0.12) * 36, 15, Math.cos(t * 0.12) * 36); camera.lookAt(0, 2.5, 0); return; }

    const idle = !busy && !panelOpen && !TT.dialogOpen;
    if (idle) {
      playT += dt; battleCd -= dt;
      const k = input.keys;
      let vx = input.x + (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), vz = input.y + (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
      let mag = Math.hypot(vx, vz);
      if (mag > 0.18) {
        if (mag > 1) { vx /= mag; vz /= mag; mag = 1; }
        const sp = 6.4, p = W.collide(player.x + vx * sp * dt, player.z + vz * sp * dt, 0.4);
        player.x = p[0]; player.z = p[1]; player.h = TT.angLerp(player.h, Math.atan2(vx, vz), Math.min(1, dt * 14)); player.mv = mag;
        if (mag > 0.6 && (dustT += dt) > 0.16) { dustT = 0; let d = dust.find(q => !q.visible); if (!d && dust.length < 8) { d = P(scene, 'sphS', new THREE.MeshBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.5, depthWrite: false }), [0, 0, 0], 0.1); dust.push(d); } if (d) { d.visible = true; d.userData.k = 0; d.position.set(player.x - vx * 0.3 + rand(-0.15, 0.15), 0.1, player.z - vz * 0.3 + rand(-0.15, 0.15)); } }
      } else player.mv = 0;

      // pickups
      for (const b of W.pickups) {
        if (b.t > playT) continue;
        if (!b.o.visible) b.o.visible = true;
        if (Math.hypot(b.x - player.x, b.z - player.z) < 1.3) { b.o.visible = false; b.t = playT + 150; S.balls++; TT.sfx.pick(); TT.toast('+1 Poké Ball!'); hud(); }
      }
      // egg
      nestEgg.visible = !S.egg.have && playT >= eggReadyAt;
      if (nestEgg.visible && dist(W.NEST, player) < 1.5) { S.egg = { have: true, warm: 0 }; TT.sfx.caught(); hud(); busy = true; TT.say([['', 'You found a mysterious egg!'], ['', 'Keep it warm and it will hatch. Try carrying it to the campfire!']]).then(() => { busy = false; save(); }); }
      if (S.egg.have) {
        const nearFire = dist(W.FIRE, player) < 6;
        if (nearFire) { S.egg.warm += dt * 5; if (!fireTold) { fireTold = true; TT.toast('The egg is warming up by the fire!'); } } else { fireTold = false; if (player.mv > 0) S.egg.warm += dt * 0.3; }
        $('eggBar').style.width = Math.min(100, S.egg.warm) + '%';
        if (S.egg.warm >= 100) hatch();
      }
      // hidden dragon ball
      if (S.stars.indexOf(3) < 0 && dist(W.STARSPOT, player) < 1.5) { busy = true; giveStar(3).then(() => { busy = false; }); }
      // wild encounters
      if (battleCd <= 0 && !busy) for (const w of wilds) if (Math.hypot(w.x - player.x, w.z - player.z) < 1.25) { wildBattle(w); break; }
      for (let i = respawns.length - 1; i >= 0; i--) if (respawns[i].at < playT) { spawnWild(respawns[i].z); respawns.splice(i, 1); }
      if (!busy && playT > nextRocket) rocketEvent();
      if ((saveT += dt) > 20) { saveT = 0; save(); }
    } else player.mv = 0;

    starObj.visible = S.stars.indexOf(3) < 0; starObj.rotation.y = t * 1.5; starObj.position.y = 0.7 + Math.sin(t * 2) * 0.12;
    placeEnt(player, true); player.root.visible = true;
    if (!busy || !TT.Battle.active) {
      follow(follower, player.x, player.z, dt, 1.5);
      if (!(busy && follower.root.position.y > 0.05)) placeEnt(follower, false);
    }
    if (S.egg.have && !(busy && S.egg.warm >= 100)) { eggObj.visible = true; const ex = follower.x - Math.sin(follower.h) * 0.8, ez = follower.z - Math.cos(follower.h) * 0.8; eggObj.position.x += (ex - eggObj.position.x) * Math.min(1, dt * 6); eggObj.position.z += (ez - eggObj.position.z) * Math.min(1, dt * 6); eggObj.position.y = Math.abs(Math.sin(t * 5)) * 0.08 * follower.mv; }
    else if (!S.egg.have) eggObj.visible = false;

    if (miniOn && !TT.Battle.active && (miniT += dt) > 0.12) { miniT = 0; drawMini(); }
    if (dest) { beacon.rotation.y = t * 2; beacon.children[1].position.y = 3.2 + Math.sin(t * 4) * 0.4; if (idle && Math.hypot(dest.x - player.x, dest.z - player.z) < 2.6) { TT.sfx.pick(); TT.toast('You made it to ' + dest.n + '!'); setDest(null); } }
    const near = idle && nearestNpc(), act = $('act');
    act.textContent = near ? 'Talk' : 'A'; act.classList.toggle('dim', !near && !TT.dialogOpen);

    if (!TT.Battle.active) {
      const zm = camera.aspect < 1 ? 1.5 : 1, k = Math.min(1, dt * 6);
      cam.x += (player.x - cam.x) * k; cam.z += (player.z - cam.z) * k;
      camera.position.set(cam.x, 12.5 * zm, cam.z + 12.5 * zm); camera.lookAt(cam.x, 1, cam.z - 1);
    }
    if ((netT += dt) > 0.1) { netT = 0; Net.send({ c: S.ch, x: +player.x.toFixed(2), z: +player.z.toFixed(2), h: +player.h.toFixed(2), m: player.mv > 0.1 ? 1 : 0, p: S.party[0].sp }); }
  }

  function setQuality(q) {
    quality = q; sun.castShadow = q >= 2; for (const b of blobs) b.visible = q < 2;
    renderer.setPixelRatio(q >= 2 ? Math.min(window.devicePixelRatio || 1, 1.5) : q === 1 ? 1 : 0.8); document.body.classList.toggle('grade', q >= 2); resize();
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    const now = performance.now(), rdt = now - lastReal; lastReal = now;
    if (!qLock && mode === 'play' && quality > 0 && rdt < 500) { qN++; qT += rdt; if (qN >= 100) { if (qT / qN > 40) setQuality(quality - 1); qN = 0; qT = 0; } }
    G.tick(ts);
  }
  G.tick = function (ts) {
    let dt = (ts - last) / 1000; last = ts;
    if (!(dt > 0)) dt = 0.016; if (dt > 0.05) dt = 0.05;
    t += dt; TT.updateTweens(dt);
    try { update(dt); } catch (e) { console.error(e); }
    renderer.render(scene, camera);
  };
  // test hooks
  G.toTitle = toTitle;
  G.dbg = () => ({ S, player, wilds, npcs, follower, mode, busy, playT, setRocket: v => { nextRocket = v; }, input, start: startGame });

  // The town takes a few seconds to build on a tablet. Let the title paint first, accept taps right away,
  // and start the chosen character the moment the world is ready.
  let ready = false, pending = window.__pick || null; window.__gameLoaded = true;
  document.querySelectorAll('.card').forEach(b => b.addEventListener('click', () => {
    TT.audioInit();
    if (ready) return startGame(b.dataset.ch);
    pending = b.dataset.ch; document.querySelectorAll('.card').forEach(c => c.classList.toggle('picked', c === b));
    $('loading').textContent = 'Getting ' + NAMES[pending] + ' ready…';
  }));
  requestAnimationFrame(() => setTimeout(() => {
    try { init(); } catch (e) { $('loading').textContent = 'Sorry, something went wrong: ' + e.message; throw e; }
    ready = true; $('loading').classList.add('hide'); $('title').classList.remove('wait');
    if (pending) startGame(pending);
  }, 40));
})();
