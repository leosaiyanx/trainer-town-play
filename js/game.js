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
  let sun, quality = 2, qLock = false, qN = 0, qT = 0, qSkip = 60, dustT = 0, qDown = false, qGood = 0, qUpT = 0;
  const blobs = [], actors = [], dust = [];
  let miniOn = true, miniT = 0, dest = null, beacon = null, mapBase = null; try { miniOn = localStorage.getItem('tt_mini') !== '0'; } catch (e) { }
  const cam = { x: 0, z: 8 };
  const NAMES = { ash: 'Ash', liko: 'Liko', dad: 'Dad', gary: 'Gary', leaf: 'Leaf' }, STARTER = { ash: 'pikachu', liko: 'sprigatito', dad: 'charmander', gary: 'squirtle', leaf: 'bulbasaur' };
  let slot = '', pname = '', cloudDirty = false, kidsList = [];
  let viewX = 30, viewZ = 31, viewS = 11, flying = false, goal = null;
  // Free-roam camera: it always faces north (so the stick stays simple), but its distance and tilt change with what is happening.
  let camD = 13, camP = 0.6, camTy = 1, stillT = 0, talkTo = null; const CAMV = { d: [13, 12], p: [0.59, 0.5] };      // [slower devices, faster devices]: a lower view shows more ground, which the kids' tablets cannot afford (measured: +15–30% drawing), so only faster devices get it
  const CAM_AREA = { town: [0, 0, 0], city: [0.6, 0.06, 0.03], world: [1.2, 0, 0], volcano: [1.2, -0.01, -0.07] };      // per area: [extra distance, extra tilt on faster devices, extra tilt on slower ones] — the Volcano is cheap to draw so everyone gets the low view there; the City looks down more so buildings don't hide the trainer
  let actKey = '', netShown = -1, eggShown = -1, inB = false;
  let comps = [], snorlaxNpc = null, areaNow = '', camY = 0, runT = 0, lean = 0; const vel = { x: 0, z: 0 };
  const areaKey = (x, z) => x > 300 ? 'volcano' : x > 54 && (z < -60 || x > 64) ? 'world' : z < -66 ? 'city' : 'town';
  const allies = () => { const a = []; if (S.flags.gohan) a.push({ h: 'gohan', sp: 'lugia', n: 'Gohan', mv: ['Aeroblast', 'flying', 55] }); if (S.flags.goku) a.push({ h: 'goku', sp: 'rayquaza', n: 'Goku', mv: ['Dragon Pulse', 'dragon', 60] }); if (S.flags.vegeta) a.push({ h: 'vegeta', sp: 'mewtwo', n: 'Vegeta', mv: ['Psystrike', 'psychic', 60] }); return a; };
  const stageHere = () => W.stageAt(player.x, player.z);

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false });
  function wrap(model, r) {
    const root = new THREE.Group(), sh = new THREE.Mesh(TT.G.disc, shadowMat);
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.035; sh.scale.setScalar(r || 0.4);
    sh.visible = quality < 2; blobs.push(sh); root.add(sh); root.add(model); root.userData.model = model; scene.add(root); return root;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

  // ---------- setup ----------
  const frameWait = () => new Promise(r => { let d = false; const f = () => { if (!d) { d = true; setTimeout(r, 0); } }; requestAnimationFrame(f); setTimeout(f, 60); });
  async function init() {
    const LP = window.LP || (() => { });
    renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = TT.scene = new THREE.Scene(); scene.matrixAutoUpdate = false;   // the scene itself never moves; without this three.js force-updates every object every frame
    scene.background = new THREE.Color(0xcdeeff); scene.fog = new THREE.Fog(0xcdeeff, 55, 135);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xa8c4a0, 0.6); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff2d8, 0.52); sun.position.set(18, 38, 24); scene.add(sun); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.002; sun.shadow.normalBias = 0.04;
    const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 130;
    quality = +(new URLSearchParams(location.search).get('q') || 2); qLock = location.search.indexOf('q=') >= 0;
    if (!qLock) try { const j = JSON.parse(localStorage.getItem('tt_q')); if (j && j.q >= 0 && j.q < 2 && Date.now() - j.t < 14 * 864e5) { quality = j.q; qUpT = j.up || 0; } } catch (e) { }   // what this device managed last time
    camera = new THREE.PerspectiveCamera(40, 1, 0.5, 900); document.body.classList.toggle('grade', quality >= 2);
    const tm = TT.timing = {}, t0 = performance.now();
    TT.lights = { hemi, sun };
    let pct = 30; LP(pct, 'Building Trainer Town'); await frameWait();
    const pre = new Set(scene.children), steps = W.build(scene);
    for (let r = steps.next(); !r.done; r = steps.next()) { pct = Math.min(90, pct + 4.5); LP(pct, r.value); await frameWait(); }
    tm.frozen = W.freezeStatic(scene, pre);
    TT.wipeInit(scene);
    tm.world = Math.round(performance.now() - t0);
    LP(92, 'Waking up the Pokémon'); await frameWait();
    W.makeMotes(scene);
    for (const d of W.NPCS) {
      const root = wrap(TT.human(TT.PEOPLE[d[1]]), 0.42), lab = TT.label(d[2]); lab.position.y = 2.25; root.add(lab);
      npcs.push({ key: d[0], name: d[2], x: d[3], z: d[4], hx: d[3], hz: d[4], r: d[5], lines: d[6], i: 0, h: 0, tx: d[3], tz: d[4], wait: rand(0, 3), root, lab, human: true, mv: 0 });
    }
    for (const d of W.PETS) {
      const root = wrap(TT.creature(d[0]), 0.35);
      npcs.push({ key: 'pet', name: d[1], x: d[2], z: d[3], hx: d[2], hz: d[3], r: d[4], lines: [d[5]], i: 0, h: 0, tx: d[2], tz: d[3], wait: rand(0, 3), root, mv: 0 });
    }
    { // the sleeping Snorlax that blocks the way to Goku's Peak
      const sx = W.SNORLAX, root = wrap(TT.creature('snorlax'), 1.4), zz = [];
      for (let i = 0; i < 3; i++) { const z = TT.label('Z', 'rgba(0,0,0,0)'); z.material.color.setHex(0x3a6ab8); z.scale.set(1.2, 0.3, 1); scene.add(z); zz.push(z); }
      snorlaxNpc = { key: 'snorlax', name: 'Snorlax', x: sx.x, z: sx.z, hx: sx.x, hz: sx.z, r: 0, lines: [], i: 0, h: -0.55, tx: sx.x, tz: sx.z, wait: 0, root, mv: 0, reach: 4.8, zz };
      npcs.push(snorlaxNpc); W.snorlaxCol = { x: sx.x, z: sx.z, r: sx.r }; W.colliders.push(W.snorlaxCol);
    }
    for (const z of W.zones) for (let i = 0; i < z.n; i++) spawnWild(z);
    nestEgg = TT.eggModel(); nestEgg.position.set(W.NEST.x, 0.12, W.NEST.z); scene.add(nestEgg);
    starObj = TT.starBall(3, 0.34); starObj.position.set(W.STARSPOT.x, 0.7, W.STARSPOT.z); scene.add(starObj);
    eggObj = TT.eggModel(); eggObj.scale.setScalar(0.8); eggObj.visible = false; scene.add(eggObj);

    tm.chars = Math.round(performance.now() - t0);
    kidsList = readKids(); if (kidsList.length) buildProfiles();
    if ($('pLiko')) { $('pLiko').src = bustPic('liko'); $('pAsh').src = bustPic('ash'); }
    buildShow();
    setQuality(quality);
    tm.all = Math.round(performance.now() - t0); LP(100, 'Ready!');
    $('title').addEventListener('pointerdown', () => { TT.audioInit(); if (mode === 'title') TT.music('title'); });
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
      if (q.get('flags')) { for (const f of q.get('flags').split(',')) S.flags[f] = 1; applyFlags(); hud(); }
      if (q.get('stars')) { S.stars = [1, 2, 3, 4, 5, 6, 7].slice(0, +q.get('stars')); hud(); }
      if (q.get('lvl')) S.party.forEach(m => { m.lvl = +q.get('lvl'); m.hp = TT.maxHp(m); });
      if (q.get('party')) S.party = q.get('party').split(',').map(k => TT.mon(k, 5));
      if (q.get('far')) S.camFar = +q.get('far');
      if (q.get('fx')) { let on = 0; setInterval(() => { if (on || !TT.Battle.active || !/^What will/.test($('bmsg').textContent)) return; on = 1; const o = TT.tween, k = +(q.get('fxs') || 6); TT.tween = (d, f) => o(d * k, f); (async () => { for (;;) { await TT.Battle.fxTest(q.get('fx'), 1.5); } })(); }, 200); }      // test: loop one move's effect in slow motion
      if (q.get('duo')) { duoForce = q.get('duo'); duoWait = 1.2; }
      if (q.get('walk')) setTimeout(() => { input.keys[q.get('walk')] = 1; }, 900);
      if (q.get('zoom')) setInterval(() => { if (!TT.Battle.active && !flying) TT.camZoom = +q.get('zoom'); }, 50);      // test: bring the camera close to check a model
      if (q.get('gest')) setInterval(() => { if (player.root) player.root.userData.model.userData.gesture = q.get('gest'); }, 100);
      const ev = q.get('evt');
      setTimeout(() => { if (ev === 'battle') wildBattle(wilds[+q.get('w') || 0]); if (ev === 'rocket') nextRocket = 0; if (ev === 'team') showTeam(); if (ev === 'map') showMap(); if (ev === 'town') showAreaMap('town'); if (ev === 'city') showAreaMap('city'); if (ev === 'world') showAreaMap('world'); if (ev && ev.startsWith('talk:')) { const n = npcs.find(n2 => n2.key === ev.slice(5)); if (n) { player.x = n.x - (n.reach || 2) + 0.4; player.z = n.z; talk(n); } } if (ev === 'menu') showMenu(); if (ev === 'wish') { busy = true; wish().then(() => { busy = false; }); } if (ev && ev.startsWith('wipe:')) { const w = ev.split(':'); TT.wipeTo(+w[1], 0.01, +w[2], w[3] ? parseInt(w[3], 16) : null); } if (ev === 'egg') { S.egg = { have: true, warm: 97 }; } }, 600);
    }
    requestAnimationFrame(frame);
    setInterval(() => { if (performance.now() - lastReal > 400) G.tick(performance.now()); }, 200);
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    TT.wipeAsp(w / h); TT.Battle.lift = h < 500 && w > h ? 0.55 : 0;
    const zm = w < h ? 1.5 : 1; viewX = 15 * zm * (w / h) + 5; viewZ = 27 * zm + 4; viewS = 8 * zm + 3;
  }

  function newSave(ch) { return { v: 1, ch, party: [TT.mon(STARTER[ch], 5)], box: [], balls: 3, stars: [], egg: { have: false, warm: 0 }, flags: {}, rocket: 0, caught: [] }; }
  function save() { if (!S) return; S.ts = Date.now(); S.nm = pname; if (mode === 'play' && !TT.Battle.active) S.pos = [Math.round(player.x * 10) / 10, Math.round(player.z * 10) / 10]; try { localStorage.setItem(slot, JSON.stringify(S)); } catch (e) { } cloudDirty = true; }
  // ---- online saves (only when js/config.js has a database address and a family code is set) ----
  const CLOUD = String(window.TT_CLOUD || '').replace(/\/$/, '');
  const cloudUrl = () => CLOUD && Net.room ? CLOUD + '/saves/' + Net.room + '/' + encodeURIComponent(slot) + '.json' : '';
  function cloudLoad() {
    const u = cloudUrl(), my = slot; if (!u) return;
    fetch(u).then(r => r.json()).then(j => {
      if (!j || !S || slot !== my || busy || TT.Battle.active || !j.party || !j.party.length || !(j.ts > (S.ts || 0))) return;
      if (j.ch !== S.ch) { scene.remove(player.root); player.root = wrap(TT.human(TT.PEOPLE[j.ch] || TT.PEOPLE.ash), 0.42); }
      S = j; TT.S = S; setFollower(); applyFlags(); hud(); TT.toast('☁ Loaded your saved adventure');
      try { localStorage.setItem(slot, JSON.stringify(S)); } catch (e) { }
    }).catch(() => { });
  }
  function cloudPush() { const u = cloudUrl(); if (!u || !cloudDirty || !S) return; cloudDirty = false; fetch(u, { method: 'PUT', body: JSON.stringify(S), keepalive: true }).catch(() => { cloudDirty = true; }); }
  document.addEventListener('visibilitychange', () => { if (document.hidden && S) { save(); cloudPush(); } });

  function startGame(ch, key, name) {
    TT.audioInit();
    slot = key || 'tt1_' + ch; pname = name || NAMES[ch] || 'Trainer'; TT.playerName = pname;
    let fresh = true;
    try { const j = JSON.parse(localStorage.getItem(slot)); if (j && j.v === 1 && j.party && j.party.length) { S = j; fresh = false; } } catch (e) { }
    if (fresh) S = newSave(ch);
    ch = S.ch; TT.S = S;
    player.root = wrap(TT.human(TT.PEOPLE[ch] || TT.PEOPLE.ash), 0.42); player.x = cam.x = ch === 'ash' ? 1.5 : -1.5; player.z = cam.z = 8; player.h = Math.PI;
    { const f = S.flags; for (const n of S.stars) f['s' + n] = 1; if (f.profDone) f.s2 = 1; if (f.gym) f.s4 = 1; if (f.goku) f.s5 = 1; if (f.hideout) f.s6 = 1; if (f.vegeta) f.s7 = 1; }
    applyFlags(); placeBalls();
    if (S.pos && isFinite(S.pos[0]) && isFinite(S.pos[1])) { const q2 = W.collide(S.pos[0], S.pos[1], 0.4); player.x = cam.x = q2[0]; player.z = cam.z = q2[1]; }   // pick up where they left off
    camY = W.gy(player.x, player.z); vel.x = vel.z = 0;
    setFollower(); follower.x = player.x + 1; follower.z = player.z + 0.8; applyFlags();
    $('title').classList.add('hide'); for (const id of ['hud', 'joy', 'act', 'bPause']) $(id).classList.remove('hide');
    famLoad(); famT = 4;
    mode = 'play'; areaNow = ''; TT.music(TT.areaMusic()); setMini(miniOn); friendsDirty = true; nextRocket = S.caught.length ? 60 : 150; hud();
    if (fresh) intro();
    cloudLoad();
  }
  // ---- family profiles: a link with kids=Name,Name gives each child their own save and character ----
  // The kids list belongs to a family code, so opening a different family's link never mixes the two.
  function readKids() {
    const src = location.hash + '&' + location.search, rm = /room=([A-Za-z0-9]{3,12})/.exec(src), km = /kids=([^&#]+)/.exec(src); let room = rm ? rm[1].toUpperCase() : '', k = '';
    try {
      localStorage.removeItem('tt_kids');                                   // old, shared-by-mistake setting
      if (!room) room = localStorage.getItem('tt_room') || '';
      if (rm && km) { k = decodeURIComponent(km[1]); localStorage.setItem('tt_kids_' + room, k); }
      else k = localStorage.getItem('tt_kids_' + room) || '';
    } catch (e) { if (km) k = decodeURIComponent(km[1]); }
    return k.split(',').map(x => x.trim().replace(/[^A-Za-z0-9 '-]/g, '').slice(0, 14)).filter(Boolean).slice(0, 6);
  }
  // a close-up of a trainer's face for the round picture on a title button
  const bustPic = ch => TT.portrait('b_' + ch, () => { const g = new THREE.Group(), h = TT.human(TT.PEOPLE[ch] || TT.PEOPLE.ash); h.position.y = -1.08; g.add(h); g.userData.h = 0.72; return g; }, true);
  // ---------- title screen: the heroes and their partners stand in the plaza, alive ----------
  const SHOW_Z = 15; let show = null, starting = false;
  // test hook: ?solo=ash&pose=walk|run|cheer|talk|point|throw&turn=0.6&dist=3.2 shows one character close up on the title screen
  const TEST = (() => { const q = new URLSearchParams(location.search), p = q.get('pose') || ''; return { idle: q.get('idle') ? q.get('idle').split(',').map(Number) : null, solo: q.get('solo'), pose: p, mv: p === 'walk' ? 1 : p === 'run' ? 1.4 : 0, gest: ['cheer', 'talk', 'point', 'throw'].indexOf(p) >= 0 ? p : null, turn: +(q.get('turn') || 0), dist: +(q.get('dist') || 3.4), mons: !!q.get('mons'), gap: +(q.get('gap') || 1.2) }; })();
  const readSave = k => { try { const j = JSON.parse(localStorage.getItem(k)); return j && j.v === 1 && j.party && j.party.length ? j : null; } catch (e) { return null; } };
  const kidKey = name => 'tt1_p_' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
  function buildShow() {
    if (show) { scene.remove(show.g); for (const e of show.list) { TT.dispose(e.h); TT.dispose(e.p); const bi = blobs.indexOf(e.sh); if (bi >= 0) blobs.splice(bi, 1); } }
    const cast = [];
    if (kidsList.length) kidsList.slice(0, 4).forEach((name, i) => { const sv = readSave(kidKey(name)); cast.push(sv ? [sv.ch, sv.party[0].sp, name] : [['liko', 'ash', 'leaf', 'gary'][i], null, name]); });
    else for (const ch of ['liko', 'ash']) { const sv = readSave('tt1_' + ch); cast.push([ch, sv && sv.party[0].sp, ch]); }
    if (TEST.solo) { cast.length = 0; for (const k of TEST.solo.split(',')) cast.push([k, null, k]); }       // test: one character, close up, in a chosen pose
    const g = new THREE.Group(), list = [];
    for (const [ch, sp0, id] of cast) {
      const mon = TEST.mons && TT.DEX[ch], sp = sp0 && TT.DEX[sp0] ? sp0 : STARTER[ch] || 'pikachu', h = mon ? TT.creature(ch) : TT.human(TT.PEOPLE[ch] || TT.PEOPLE.ash), p = mon ? new THREE.Group() : TT.creature(sp);
      const sh = new THREE.Mesh(TT.G.disc, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.035; sh.scale.setScalar(0.45); sh.visible = quality < 2; blobs.push(sh);
      g.add(h); g.add(p); g.add(sh); list.push({ h, p, sh, ch, sp, id, mon, wave: rand(1.5, 4), gt: 0 });
    }
    g.position.set(0, 0, SHOW_Z); scene.add(g); show = { g, list };
  }
  // a tapped hero cheers and their partner calls out, then the adventure starts
  function pickHero(id, fn) {
    if (starting) return; starting = true; TT.sfx.pick();
    const e = show && show.list.find(x => x.id === id); if (e) { e.h.userData.gesture = 'cheer'; e.gt = 3; e.wave = 9; TT.cry(e.sp); }
    TT.wait(e ? 0.55 : 0.05).then(() => { starting = false; if (mode === 'title') fn(); });
  }
  function updateShow(dt) {
    const asp = camera.aspect, n = show.list.length, tight = asp < 1, gap = TEST.solo ? TEST.gap : tight ? 1.5 : 2.1, po = tight ? 0.5 : 0.8;
    show.list.forEach((e, i) => {
      const x = (i - (n - 1) / 2) * gap, side = i < (n - 1) / 2 ? -1 : 1;
      e.h.position.set(x, 0, 0); e.sh.position.set(x, 0.035, 0); e.p.position.set(x + side * po, 0, 0.9); e.p.rotation.y = -side * 0.3;
      if (e.gt > 0 && (e.gt -= dt) <= 0) e.h.userData.gesture = null;
      if (!TEST.solo && !e.mon) { if (e.jt == null) e.jt = rand(5, 14); if ((e.jt -= dt) < -2.2) { e.jt = rand(9, 18); e.h.userData.idleForce = e.p.userData.idleForce = null; } else if (e.jt < 0) { e.h.userData.idleForce = 7; e.p.userData.idleForce = 7; } }      // now and then a trainer and partner jump for joy together
      if (TEST.pose) { e.h.userData.gesture = TEST.gest; e.h.rotation.y = TEST.turn; e.p.visible = false; }
      if (TEST.idle) { const k = TEST.idle[i % TEST.idle.length]; if (TEST.mv) e.h.userData.walkForce = k; else e.h.userData.idleForce = k; e.h.userData.actForce = k; }
      if (e.mon) { TT.animCreature(e.h, t, TEST.mv); return; }
      TT.animHuman(e.h, t, TEST.mv); TT.animCreature(e.p, t, 0);
    });
    const hw = (n - 1) / 2 * gap + po + 0.9, d = TEST.solo ? TEST.dist : Math.max(6.4, hw / (0.364 * asp)), short = window.innerHeight < 500 && asp > 1;
    if (TEST.solo) { const cy = +(new URLSearchParams(location.search).get('cy') || (TEST.mons ? 0.5 : d < 2.4 ? 1.48 : 0.9)); camera.position.set(0, cy + 0.3, SHOW_Z + d); camera.lookAt(0, cy, SHOW_Z); return; }
    camera.position.set(Math.sin(t * 0.3) * 0.7, 1.75 + d * 0.05, SHOW_Z + d); camera.lookAt(0, 0.95 - (short ? 0.2 : tight ? 0.03 : 0.06) * 0.728 * d, SHOW_Z);
  }
  const duoPic = ch => TT.portrait('t_' + ch, () => { const g = new THREE.Group(), h = TT.human(TT.PEOPLE[ch]), c = TT.creature(STARTER[ch]); h.position.x = -0.3; c.position.set(0.55, 0, 0.3); g.add(h); g.add(c); g.userData.h = 1.75; return g; }, true);
  function buildProfiles() {
    const kids = kidsList, box = $('chars'); box.innerHTML = ''; box.classList.toggle('many', kids.length > 2);
    document.querySelector('#title h2').textContent = (kids.length > 1 ? kids.slice(0, -1).join(', ') + ' & ' + kids[kids.length - 1] : kids[0]) + "'s Adventure";
    document.querySelector('#title .fine').textContent = 'A family fan game — made with love';
    for (const name of kids) {
      const key = kidKey(name), sv = readSave(key);
      const b = document.createElement('button'); b.className = 'card';
      b.innerHTML = (sv ? '<img src="' + bustPic(sv.ch) + '" alt="">' : '<div class="newp">＋</div>') + '<b></b><span>' + (sv ? 'Lv ' + sv.party[0].lvl + ' ' + TT.monName(sv.party[0]) + ' · ' + sv.stars.length + '★' : 'New adventure') + '</span>';
      b.querySelector('b').textContent = name;
      b.onclick = () => { TT.audioInit(); if (!ready) return; if (sv) pickHero(name, () => startGame(sv.ch, key, name)); else chooseChar(name, key); };
      box.appendChild(b);
    }
  }
  function chooseChar(name, key) {
    let h = '<h3>' + name.replace(/[<>&]/g, '') + ', pick your trainer <button id="pClose">✕</button></h3><div class="pickrow">';
    for (const ch of ['liko', 'ash', 'leaf', 'gary']) h += '<button class="card" data-pc="' + ch + '"><img src="' + duoPic(ch) + '" alt=""><b>' + NAMES[ch] + '</b><span>with ' + TT.DEX[STARTER[ch]][0] + '</span></button>';
    openPanel(h + '</div>');
    document.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { closePanel(); startGame(b.dataset.pc, key, name); });
  }
  async function intro() {
    busy = true;
    const p = TT.monName(S.party[0]);
    await TT.say([['Professor Oak', 'Welcome to Trainer Town, ' + NAMES[S.ch] + '!'], ['', p + ' is your partner and will follow you everywhere!'], ['', 'Move with the stick. Press the yellow button to talk to people and Pokémon.'], ['Professor Oak', 'Come see me at the Lab — the big building at the top of town!']]);
    busy = false; save();
  }
  // world state that depends on this player's progress: gates, Snorlax, Team Rocket, who follows you
  function applyFlags() {
    const f = S.flags;
    W.setGate(!!f.city); W.setGate2(!!f.world); W.setTunnel(!!f.tunnel);
    { const vi = W.colliders.indexOf(vegCol); if (f.vegeta && vi >= 0) W.colliders.splice(vi, 1); if (!f.vegeta && vi < 0) W.colliders.push(vegCol); }
    const ci = W.colliders.indexOf(W.snorlaxCol); snorlaxNpc.hidden = !!f.snorlax;
    if (f.snorlax && ci >= 0) W.colliders.splice(ci, 1); if (!f.snorlax && ci < 0) W.colliders.push(W.snorlaxCol);
    for (const n of npcs) { if (n.key === 'hideout') n.hidden = !!f.hideout; if (n.key === 'goku') n.hidden = !!f.goku; if (n.key === 'gohan') n.hidden = !!f.gohan; if (n.key === 'vegeta') n.hidden = !!f.vegeta; }
    for (const c of comps) { scene.remove(c.root); TT.dispose(c.root); } comps = [];
    for (const [k, on] of [['gohan', f.gohan], ['goku', f.goku], ['vegeta', f.vegeta]]) if (on) comps.push({ key: k, x: player.x - 1 - comps.length, z: player.z + 1.5, h: 0, mv: 0, root: wrap(TT.human(TT.PEOPLE[k]), 0.42) });
  }
  // However you got somewhere (walking, flying, jumping to a friend), being there unlocks it: gates open, Fly works,
  // and the goal line moves on to the next thing that is really left to do.
  function arrive(ak) {
    const f = S.flags; let ch = false;
    if (ak !== 'town' && !f.city) { f.city = 1; ch = true; }
    if ((ak === 'world' || ak === 'volcano') && !f.world) { f.world = 1; ch = true; }
    if (ak === 'volcano' && !f.tunnel) { f.tunnel = 1; ch = true; }
    if (ch) { f.profMet = f.profDone = 1; applyFlags(); hud(); save(); }
  }
  // ---- fair fights: bosses match the whole team, and ease off a little each time you lose to them ----
  const teamLvl = () => { const l = S.party.map(m => m.lvl).sort((a, b) => b - a); return Math.round(l.length > 1 ? l[0] * 0.5 + (l[1] + (l[2] != null ? l[2] : l[1])) / 2 * 0.5 : l[0]); };
  const tries = k => (S.tries && S.tries[k]) || 0, lost = k => { S.tries = S.tries || {}; S.tries[k] = Math.min(5, tries(k) + 1); };
  const bossL = (k, min, plus) => Math.max(min, teamLvl() + plus - tries(k) * 2);
  const bossHp = (k, mul) => mul * Math.max(0.6, 1 - tries(k) * 0.1) * (S.easy ? 0.75 : 1);
  function setFollower() {
    const old = follower;
    if (old) { scene.remove(old.root); TT.dispose(old.root); }
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
    let sp = TT.pick(z.pool); const p = zonePoint(z), rare = z.rare && Math.random() < z.rare[1]; if (rare) sp = z.rare[0];
    const bonus = S ? Math.max(0, Math.floor((S.party[0].lvl - 6) / 2)) : 0;
    const w = { sp, lvl: (rand(z.lv[0], z.lv[1] + 1) | 0) + bonus, zone: z, x: p[0], z: p[1], h: rand(0, 6), tx: p[0], tz: p[1], wait: rand(0, 3), mv: 0, root: wrap(TT.creature(sp), 0.35) };
    if (rare) { const sg = new THREE.Group(); for (let i = 0; i < 4; i++) P(sg, 'sphS', TT.glow(i % 2 ? 0xfff27a : 0xffffff), [Math.cos(i * 1.57) * 0.55, i * 0.15, Math.sin(i * 1.57) * 0.55], 0.06); w.root.add(sg); w.spark = sg; }
    wilds.push(w);
  }
  function removeWild(w) { scene.remove(w.root); TT.dispose(w.root); wilds.splice(wilds.indexOf(w), 1); respawns.push({ z: w.zone, at: playT + 18 }); }

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
    r.position.set(e.x, W.gy(e.x, e.z) + (e.lift || 0), e.z); r.rotation.y = e.h;
    const dx = e.x - cam.x, dz = e.z - cam.z, d = mode === 'play' ? Math.hypot(e.x - player.x, e.z - player.z) : Math.hypot(e.x, e.z - SHOW_Z);
    // only what the camera can see (plus a margin) is shown and animated; everything else costs nothing at all
    r.visible = !e.hidden && (mode === 'play' && !TT.Battle.active ? Math.abs(dx) < viewX && dz > -viewZ && dz < viewS : d < 48); r.matrixWorldAutoUpdate = r.visible;
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

  // ---------- little moments between the trainer and the partner while standing around ----------
  // After a few seconds of standing still one of these starts: a high five, a ride on the shoulder, sitting down together, jumping for joy, or the partner racing in a circle.
  let duo = null, duoIdle = 0, duoWait = 7, duoLast = '', duoForce = null; const _sv = new THREE.Vector3(), mix = (a, b, k) => a + (b - a) * k;
  function duoEnd() {
    if (!duo) return;
    const pm = player.root && player.root.userData.model.userData, f = duo.f; if (pm) { pm.idleForce = null; pm.lookYaw = null; }
    if (f && f.root) { const m = f.root.userData.model; m.userData.idleForce = null; f.lift = 0; if (duo.s0) { m.scale.setScalar(duo.s0); f.root.children[0].visible = quality < 2; } }
    duo = null; duoIdle = 0; duoWait = 9 + Math.random() * 7;
  }
  function duoTick(dt) {
    if (!follower || !player.root || mode !== 'play') return false;
    const pm = player.root.userData.model.userData, fm = follower.root.userData.model.userData;
    const calm = !busy && !TT.dialogOpen && !TT.Battle.active && !flying && !talkTo, still = calm && player.mv === 0;
    if (duo && duo.f !== follower) duoEnd();
    if (!duo) {
      if (!still) { duoIdle = 0; return false; }
      if ((duoIdle += dt) < duoWait) return false;
      const ground = fm.kind === 'quad' || fm.kind === 'biped' || fm.kind === 'hop', small = ground && (fm.h || 2) <= 1.4;
      const opts = ['joy', 'zoom']; if (ground) opts.push('five', 'sit'); if (small) opts.push('ride', 'ride');
      let k = duoForce; if (!k) do k = TT.pick(opts); while (k === duoLast && opts.length > 1);
      duoLast = k; duo = { k, t: 0, f: follower, x0: follower.x, z0: follower.z, a0: Math.atan2(follower.x - player.x, follower.z - player.z), r0: Math.hypot(follower.x - player.x, follower.z - player.z), hit: 0, side: follower.x >= player.x ? 1 : -1 };
    }
    const d = duo, f = follower, fx = Math.sin(player.h), fz = Math.cos(player.h), rx = -Math.cos(player.h), rz = Math.sin(player.h);      // forward of the trainer, and to the trainer's right
    const face = h => { f.h = TT.angLerp(f.h, h == null ? Math.atan2(player.x - f.x, player.z - f.z) : h, Math.min(1, dt * 10)); };
    const turn = h => { player.h = TT.angLerp(player.h, h, Math.min(1, dt * 7)); };          // the trainer turns so the camera can see the moment
    d.t += dt;
    if (!calm || (!still && d.k !== 'ride' && d.k !== 'down')) { duoEnd(); return false; }
    if (d.k === 'five') {
      const tx = player.x + fx * 0.6 + rx * 0.17, tz = player.z + fz * 0.6 + rz * 0.17;
      turn(d.side * Math.PI / 2);
      if (d.t < 1.1) follow(f, tx, tz, dt, 0.06);
      else if (d.t < 2.3) { f.x = tx; f.z = tz; f.mv = 0; face(); pm.idleForce = 16; fm.idleForce = 14; const q = (d.t - 1.5) / 0.55; f.lift = q > 0 && q < 1 ? Math.sin(q * Math.PI) * 0.42 : 0; if (q > 0.5 && !d.hit) { d.hit = 1; TT.sfx.star(); poof(tx - fx * 0.2, tz - fz * 0.2); } }
      else if (d.t < 4.2) { f.lift = 0; face(); pm.idleForce = 12; fm.idleForce = 7; }
      else duoEnd();
    } else if (d.k === 'joy') {
      turn(d.side * Math.PI / 2 * 0.7); f.mv = 0; face(); pm.idleForce = 7; fm.idleForce = 7; if (!d.hit) { d.hit = 1; TT.cry(f.sp); } if (d.t > 2.2) duoEnd();
    } else if (d.k === 'zoom') {
      turn(0); const a = d.a0 + d.t * 3.3, r = mix(d.r0, 1.5, Math.min(1, d.t * 2)); f.x = player.x + Math.sin(a) * r; f.z = player.z + Math.cos(a) * r; f.h = a + Math.PI / 2; f.mv = 1.3;
      let rel = a - player.h; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); pm.lookYaw = Math.abs(rel) < 1.9 ? rel : 0; pm.idleForce = 19;
      if (d.t > 4.2) duoEnd();
    } else if (d.k === 'sit') {
      const tx = player.x - rx * 0.75 + fx * 0.15, tz = player.z - rz * 0.75 + fz * 0.15; pm.idleForce = 17; turn(0.75);
      if (Math.hypot(tx - f.x, tz - f.z) > 0.12 && d.t < 3) follow(f, tx, tz, dt, 0.06); else { f.mv = 0; face(player.h); fm.idleForce = d.t > 7 ? 5 : 15; }
      if (d.t > 16) duoEnd();
    } else if (d.k === 'ride' || d.k === 'down') {
      const sh = pm.rig.armR.sh.getWorldPosition(_sv), gy = W.gy(player.x, player.z), sx = sh.x - fx * 0.03 + rx * 0.02, sz = sh.z - fz * 0.03 + rz * 0.02, sy = sh.y - gy + 0.03;
      if (d.k === 'down') {            // hop back down beside the trainer
        const q = Math.min(1, d.t / 0.45), e = q * q * (3 - 2 * q), gx = player.x + rx * 0.95, gz = player.z + rz * 0.95; if (d.s0) f.root.userData.model.scale.setScalar(d.s0 * mix(0.6, 1, e)); f.x = mix(sx, gx, e); f.z = mix(sz, gz, e); f.lift = sy * (1 - e) + Math.sin(q * Math.PI) * 0.3; f.mv = 0; fm.idleForce = null; pm.idleForce = null; pm.lookYaw = null; if (q >= 1) duoEnd();
      } else if (d.t < 0.55) { const q = d.t / 0.55, e = q * q * (3 - 2 * q), m = f.root.userData.model; if (!d.s0) { d.s0 = m.scale.x; f.root.children[0].visible = false; } m.scale.setScalar(d.s0 * mix(1, 0.6, e)); f.x = mix(d.x0, sx, e); f.z = mix(d.z0, sz, e); f.lift = sy * e + Math.sin(q * Math.PI) * 0.45; f.mv = 0; face(player.h); }
      else { if (still && d.t < 1.6) turn(0.35); f.x = sx; f.z = sz; f.lift = sy; f.h = player.h; f.mv = 0; fm.idleForce = 16; pm.lookYaw = still && d.t < 3.5 ? -0.85 : null; pm.idleForce = still && d.t < 3.5 ? 18 : null; if (!d.hit) { d.hit = 1; TT.cry(f.sp); }
        if (d.t > 11 || player.mv > 1.1) { d.k = 'down'; d.t = 0; } }
    }
    return true;
  }

  // ---------- saying things in more than one way ----------
  // vary(key, options): each option is a list of lines [[who, text], ...]. Options are dealt like a shuffled pack: nothing comes round again until all the
  // others have been heard. A text given as a list of wordings picks one, so even a repeat sounds a little different.
  // While voices are on, an option whose lines have not been recorded yet is left out, so nobody suddenly goes silent.
  function vary(key, options, optional) {
    const made = options.map(o => { const out = []; for (const l of o) { const ts = (Array.isArray(l[1]) ? l[1] : [l[1]]).filter(t => TT.canSay(l[0], t)); if (!ts.length) return null; out.push([l[0], TT.pick(ts)]); } return out; });
    const id = o => TT.voiceKey(o[0][0], Array.isArray(o[0][1]) ? o[0][1][0] : o[0][1]), ok = options.map((o, i) => i).filter(i => made[i]);
    if (!ok.length) return optional ? [] : options[0].map(l => [l[0], Array.isArray(l[1]) ? l[1][0] : l[1]]);
    const mem = S.said || (S.said = {}); let used = mem[key] || (mem[key] = []);
    let pool = ok.filter(i => used.indexOf(id(options[i])) < 0);
    if (!pool.length) { const last = used[used.length - 1]; used = mem[key] = ok.length > 1 ? [last] : []; pool = ok.filter(i => used.indexOf(id(options[i])) < 0); }
    const i = TT.pick(pool); used.push(id(options[i])); if (used.length > 40) used.shift();
    return made[i];
  }
  // Team Rocket's lines. J, M, R = Jessie, James, Meowth.
  const RK = (() => {
    const J = 'Jessie', M = 'James', R = 'Meowth', T = 'Team Rocket';
    return {
      intro: [
        [['???', 'Prepare for trouble!'], ['???', 'And make it double!'], [J, 'Jessie!'], [M, 'James!'], [R, "Meowth, that's right!"]],
        [[J, 'Prepare for trouble, twerp!'], [M, 'And make it double trouble!'], [R, 'Meowth is here too!']],
        [[J, 'To save the world from boring days!'], [M, 'To grab rare Pokémon in sneaky ways!'], [R, 'Team Rocket, at your service!']],
        [[M, 'Guess who just dropped in?'], [J, 'Your favourite villains, of course!'], [R, 'And the brains of the team. Me!']],
        [[J, 'Did you miss us, twerp?'], [M, 'We practised our entrance all morning.'], [R, 'Just get on with it, you two!']],
        [[R, 'Surprise! You did not see this balloon coming.'], [J, 'It is a very sneaky balloon.'], [M, 'It is huge, and it has your face on it, Meowth.']],
      ],
      place: {
        town: [[[M, 'What a sleepy little town. Perfect for a quick snatch.']], [[J, 'Nobody will notice one missing Pokémon in a town this small.']], [[R, 'Nice pond. Shame we are too busy to go fishing.']], [[M, 'I rather like it here. Can we stay for lunch?'], [J, 'No!']]],
        city: [[[J, 'The big City! So many shiny things to take.']], [[M, 'Ooh, is that a bakery?'], [R, 'Focus, James!']], [[J, 'Even Officer Gus cannot catch us up here.']], [[R, 'City folk never look up. Lucky for us!']]],
        world: [[[M, 'We followed you across the whole Wide World.'], [R, 'My paws hurt!']], [[J, 'Out here there is nobody to help you, twerp!']], [[R, 'Mountains, rivers, forests. Too much nature for me.']], [[M, 'The view from the balloon is lovely today.'], [J, 'We are not here for the view!']]],
        volcano: [[[R, 'It is way too hot here! My fur is going frizzy.']], [[M, 'The balloon nearly melted on the way in.']], [[J, 'A little heat will not stop Team Rocket!']], [[R, 'Who builds a home next to a volcano?']]],
      },
      gohan: [[[J, 'You brought a little friend along? How sweet.'], [R, 'Uh, Jessie. That kid has a Lugia.']]],
      goku: [[[M, 'Is that Goku? With a Rayquaza?'], [R, 'We are going to need a bigger balloon.']]],
      vegeta: [[[R, 'Now there are three of them? This is not fair!']], [[M, 'That spiky one keeps glaring at me.']]],
      balls: [[[J, 'And those Dragon Balls you carry will make a lovely bonus!']], [[M, 'Look at all those Dragon Balls. We could wish for a new balloon!']]],
      robot: [[[R, 'You broke our robot, twerp. That thing was expensive!']]],
      many: [[[M, 'I have lost count of how many times we have tried this.'], [J, 'Then this is the time it works!']], [[R, 'New plan, same as the old plan. Grab and go!']]],
      demand: [[[J, 'Hand over your partner, twerp!']], [[M, 'We will be taking that Pokémon now. Thank you kindly.']], [[R, 'Net time! Say goodbye to your little pal.']]],
      grab: [[[R, 'Gotcha! Right in the net!']], [[M, 'Caught it! I actually caught it!']], [[J, 'Ha! Easy as pie.']]],
      win: [
        [[J, ['We lost AGAIN?!', 'We lost? AGAIN?!']], [R, ["It's not fair!", 'So not fair!']]],
        [[M, 'But we practised so hard!'], [J, 'Stop crying, James!']],
        [[R, 'I knew we should have stayed in bed today.']],
        [[J, 'This is all your fault, Meowth!'], [R, 'My fault?!']],
        [[M, 'That twerp keeps getting stronger.'], [J, 'And we keep getting flatter!']],
        [[R, 'The boss is not going to like this.']],
        [[J, 'Next time, twerp. Next time!']],
      ],
      lose: [
        [[M, 'We... won? We actually won?!'], [R, 'Uh oh. The balloon is leaking!']],
        [[J, 'We won! Quick, somebody take a picture!'], [M, 'Wait. The net has a hole in it.']],
        [[R, 'Victory! Hold on, why is the balloon going down?']],
      ],
      blast: [[[T, "Looks like Team Rocket's blasting off agaaaain!"]], [[T, "We're blasting off agaaaain!"]], [[T, 'Up, up and away we go agaaaain!']], [[T, 'See you next time, twerp! Whoaaaa!']], [[T, 'Not the sky agaaaain!']]],
    };
  })();

  // ---------- the Dragon Radar and grown-up help ----------
  // Bulma gives the real radar after the first wish. Dad always has one, and a grown-up can lend it to a child for a while (from Dad mode, or from the menu on the child's own device).
  const radarOn = () => !!S && !!(S.flags.radar || S.ch === 'dad' || (S.radarUntil || 0) > Date.now());
  const AREA_NAME = { town: 'Trainer Town', city: 'the City', world: 'the Wide World', volcano: 'the Volcano' };
  function radarSpots() {            // every Dragon Ball this player does not have yet, and where it is
    if (!S) return [];
    if (S.wishes) return (S.scat || []).map(b => ({ n: b.n, x: b.x, z: b.z, t: 'lying near ' + (b.h || 'somewhere') + ' in ' + (AREA_NAME[areaKey(b.x, b.z)] || 'the world') }));
    const where = [null, null, [3.5, -21.5, 'Professor Oak gives it to you at the Lab, after you catch 3 kinds of Pokémon'], [W.STARSPOT.x, W.STARSPOT.z, 'hidden inside the ring of trees just past the town pond (east side of Trainer Town)'], [0, -159.5, 'win it from Leader Misty at the City Gym'],
      [W.PLATEAU.x - 2.5, W.PLATEAU.z, "Goku gives it to you on Goku's Peak in the Wide World"], [204, -149.5, "beat the robot at Team Rocket's hideout in the Wide World"], [W.VEGETA.x - 2.2, W.VEGETA.z, 'beat Vegeta at the lava bridge in the Volcano']];
    const out = []; for (let n = 1; n <= 7; n++) { if (S.stars.indexOf(n) >= 0) continue; const q = where[n]; out.push(q ? { n, x: q[0], z: q[1], t: q[2] } : { n, t: 'Team Rocket drop it the first time you beat them. They swoop in by themselves, so keep exploring.' }); }
    return out;
  }
  function showRadar() {
    const on = radarOn(), sp = radarSpots(), left = (S.radarUntil || 0) - Date.now();
    let h = '<h3>📡 Dragon Radar <button id="pClose">✕</button></h3><p style="margin:0 0 8px">You have <b>' + S.stars.length + ' of 7</b> Dragon Balls.</p>';
    if (!on) h += '<p style="opacity:.75;margin:0">The radar is switched off. A grown-up can lend it to you from the menu (☰ → Grown-up help), or Bulma gives you one after your first wish.</p>';
    else {
      if (!S.flags.radar && S.ch !== 'dad' && left > 0) h += '<p style="opacity:.75;margin:0 0 8px">Borrowed for ' + Math.ceil(left / 60000) + ' more minute' + (left > 60000 ? 's' : '') + '.</p>';
      if (!sp.length) h += '<p style="margin:0">You have all seven! Take them to the altar in the Volcano.</p>';
      sp.forEach((b, i) => { h += '<button class="opt" data-i="' + i + '">⭐ <b>' + b.n + '-Star:</b> ' + b.t + (b.x != null ? ' <span style="color:#c2410c">➜ Show me</span>' : '') + '</button>'; });
    }
    openPanel(h);
    sp.forEach((b, i) => { const el = $('panelIn').querySelector('[data-i="' + i + '"]'); if (el && b.x != null) el.onclick = () => { setDest({ x: b.x, z: b.z }); closePanel(); TT.sfx.pick(); TT.toast('📍 Follow the dotted line on the little map'); }; });
  }
  function lendRadar(min, who) { S.radarUntil = Date.now() + min * 60000; save(); hud(); TT.sfx.caught(); TT.toast('📡 ' + who + ' lent you the Dragon Radar for ' + min + ' minutes! Tap the Dragon Ball counter at the top.'); }
  function healTeam(who) { S.party.forEach(m => m.hp = TT.maxHp(m)); save(); TT.sfx.heal(); TT.toast('💖 ' + who + ' healed your whole team!'); }
  // Grown-up help on the child's own device, behind a sum a small child will not know
  function showHelp() {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4), ans = a * b, opts = [ans, ans + (Math.random() < 0.5 ? 6 : -6), ans + (Math.random() < 0.5 ? 9 : -8)].sort(() => Math.random() - 0.5);
    openPanel('<h3>🧰 Grown-up help <button id="pClose">✕</button></h3><p style="margin:0 0 8px">For grown-ups: what is <b>' + a + ' × ' + b + '</b>?</p>' + opts.map((o, i) => '<button class="opt" data-a="' + o + '">' + o + '</button>').join(''));
    $('panelIn').querySelectorAll('[data-a]').forEach(el => { el.onclick = () => { if (+el.dataset.a === ans) helpTools(); else { closePanel(); TT.toast('Not quite. Ask a grown-up!'); } }; });
  }
  function helpTools() {
    openPanel('<h3>🧰 Grown-up help <button id="pClose">✕</button></h3><button class="opt" id="hRadar">📡 Lend the Dragon Radar for 15 minutes</button><button class="opt" id="hWay">🧭 Show the way to the next goal</button><button class="opt" id="hHeal">💖 Heal the whole team</button><button class="opt" id="hBalls">🎁 Add 10 Poké Balls</button><button class="opt" id="hUnstick">🏥 Stuck somewhere? Carry the trainer to the Poké Center</button><p style="font-size:13px;opacity:.7;margin:4px 0 0">The radar shows every missing Dragon Ball on the maps. Tap the Dragon Ball counter at the top to open it.</p>');
    $('hRadar').onclick = () => { closePanel(); lendRadar(15, 'A grown-up'); showRadar(); };
    $('hWay').onclick = () => { closePanel(); if (goal) { setDest(goal); TT.toast('📍 Follow the dotted line on the little map'); } else TT.toast($('quest').textContent); };
    $('hHeal').onclick = () => { closePanel(); healTeam('A grown-up'); };
    $('hBalls').onclick = () => { closePanel(); S.balls += 10; hud(); save(); TT.sfx.caught(); TT.toast('🎁 10 Poké Balls added!'); };
    $('hUnstick').onclick = () => { closePanel(); if (busy || TT.Battle.active) return; const q = W.collide(W.CENTER.x + 1.5, W.CENTER.z + 4.5, 0.4); poof(player.x, player.z); player.x = cam.x = q[0]; player.z = cam.z = q[1]; camY = W.gy(q[0], q[1]); vel.x = vel.z = 0; if (follower) { follower.x = player.x + 0.9; follower.z = player.z + 0.7; } areaNow = 'town'; arrive('town'); poof(player.x, player.z); save(); TT.toast('🏥 Back at the Poké Center in Trainer Town'); };
  }

  // ---------- talking ----------
  function nearestWild() { let best = null, bd = 3.6; for (const w of wilds) { const d = Math.hypot(w.x - player.x, w.z - player.z); if (d < bd) { bd = d; best = w; } } return best; }
  function nearestNpc() { let best = null, bd = 2.9; for (const n of npcs) { if (n.hidden) continue; const d = dist(n, player) - (n.reach ? n.reach - 2.9 : 0); if (d < bd) { bd = d; best = n; } } return best; }
  async function talk(n) {
    busy = true; talkTo = n; n.h = Math.atan2(player.x - n.x, player.z - n.z); player.h = Math.atan2(n.x - player.x, n.z - player.z);
    const mdl = n.root.userData.model; if (n.human) mdl.userData.gesture = 'talk';
    if (n.key === 'krillin') await krillin(); else if (n.key === 'bulma') await bulma(); else if (n.key === 'vegeta') await vegetaTalk(); else if (n.key === 'prof') await prof(); else if (n.key === 'nurse') await nurse(); else if (n.key === 'guard') await gus(n); else if (n.key === 'gohan') await gohan(); else if (n.key === 'misty') await misty(); else if (n.key === 'clerk') await clerk(); else if (n.key === 'guard2') await gail(n); else if (n.key === 'ranger') await ranger(); else if (n.key === 'goku') await gokuTalk(); else if (n.key === 'hideout') await hideout(); else if (n.key === 'snorlax') await snorlaxTalk();
    else if (!n.human) {
      await TT.say([[n.name, n.lines[0]]]);
      if (S.party.some(m => m.hp > 0) && await petAsk(n)) {
        const foe = TT.mon(mdl.userData.sp, Math.max(3, S.party[0].lvl - 1)), r = await TT.Battle.start({ foes: [foe], wild: true, stage: stageHere() });
        if (r === 'caught') { foe.hp = TT.maxHp(foe); addMon(foe); scene.remove(n.root); npcs.splice(npcs.indexOf(n), 1); } else if (r === 'lose') await whiteOut();
        battleCd = 2.5; if (follower.sp !== S.party[0].sp) setFollower();
      }
    }
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
  async function gus(n) {
    const N = 'Officer Gus', f = S.flags;
    if (f.city) return TT.say([[N, TT.pick(['The City is straight ahead. Have fun!', 'Visit the City Gym if you want a real challenge.'])]]);
    if (!f.profDone) return TT.say([[N, n.lines[n.i++ % n.lines.length]]]);
    await TT.say([[N, 'Professor Oak says you are ready for the City!'], [N, 'Opening the gate. Good luck, trainer!']]);
    f.city = 1; TT.sfx.star(); const bar = W.gateBar; await TT.tween(0.9, k => { bar.position.y = k * 3.2; }); W.setGate(true); bar.position.y = 0;
  }
  async function gohan() {
    const N = 'Gohan', f = S.flags;
    if (!f.gym) return TT.say([[N, "Hi! I'm Gohan. My dad Goku sent me to look for the Dragon Balls."], [N, "Leader Misty has one! Beat her at the Gym, and I'll join your team."], [N, "My partner Lugia is a legendary Pokémon. We're super strong together!"]]);
    if (!f.gohan) {
      await TT.say([[N, 'You beat the Gym! That was amazing!'], [N, 'From now on, Lugia and I will help you in big battles.'], [N, "Let's find my dad together. He's out in the Wide World!"]]);
      f.gohan = 1; TT.sfx.caught(); TT.cry('lugia'); await TT.say([['', 'Gohan and Lugia joined your team!']]); applyFlags(); return;
    }
    return TT.say([[N, TT.pick(["I'm right behind you!", "Team Rocket doesn't stand a chance against us!", "I can't wait for you to meet my dad!"])]]);
  }
  async function misty() {
    const N = 'Leader Misty', f = S.flags;
    if (f.gym) return TT.say([[N, TT.pick(['You earned that Dragon Ball. Take good care of it!', 'Have you met Gohan in the plaza?'])]]);
    if (!S.party.some(m => m.hp > 0)) return TT.say([[N, 'Your Pokémon look tired. Visit Nurse Joy by the plaza first!']]);
    await TT.say([[N, "I'm Misty, the City Gym Leader! My Water Pokémon are tough."], [N, 'Ready for a Gym battle? Here we go!']]);
    const L = bossL('gym', 5, 0);
    const r = await TT.Battle.start({ foes: [TT.mon('psyduck', L - 2), TT.mon('squirtle', L - 1), TT.mon('quaxly', L)], trainer: 'Leader Misty', people: ['misty'], stage: 'gym' });
    if (follower.sp !== S.party[0].sp) setFollower();
    if (r === 'win') {
      f.gym = 1; await TT.say([[N, "Wow, you really beat me! You're a great trainer."], [N, 'Take this. It fell from the sky into my pool one day.']]);
      await giveStar(4); S.balls += 5; TT.sfx.pick(); await TT.say([['', 'You got 5 Poké Balls too!']]);
    } else if (r === 'lose') { lost('gym'); await whiteOut(); }
  }
  async function clerk() {
    const N = 'Clerk Kim', f = S.flags, now = Date.now();
    if (!f.mart || now - f.mart > 180000) { f.mart = now; S.balls += 5; TT.sfx.pick(); return TT.say([[N, 'Welcome to the Poké Mart! Young trainers get free Poké Balls.'], [N, 'Here are 5 Poké Balls. Come back later for more!']]); }
    return TT.say([[N, "I'm restocking the shelves. Come back in a few minutes!"]]);
  }
  async function gail(n) {
    const N = 'Officer Gail', f = S.flags;
    if (f.world) return TT.say([[N, TT.pick(['The Wide World is huge. Ranger Rita at the cabin can heal your Pokémon.', 'Watch out for Team Rocket out there!'])]]);
    if (!f.gym) return TT.say([[N, n.lines[n.i++ % n.lines.length]]]);
    await TT.say([[N, 'You beat the City Gym! You and Gohan are ready for the Wide World.'], [N, 'Opening the gate. Good luck!']]);
    f.world = 1; TT.sfx.star(); const bar = W.gate2Bar; await TT.tween(0.9, k => { bar.position.y = k * 3.2; }); W.setGate2(true); bar.position.y = 0; save();
  }
  async function ranger() {
    const N = 'Ranger Rita';
    await TT.say([[N, 'Welcome to the Wide World, trainer! Let me patch up your Pokémon.']]);
    S.party.forEach(m => m.hp = TT.maxHp(m)); TT.sfx.heal(); await TT.wait(0.8);
    await TT.say([[N, TT.pick(['All better! Goku trains on the peak past the big bridge.', 'All better! A sleepy Snorlax blocks the way to the peak. You will have to battle it!', 'All better! Team Rocket built a hideout in the south. Be careful!'])]]);
  }
  async function snorlaxTalk() {
    if (!S.party.some(m => m.hp > 0)) return TT.say([['', 'Your Pokémon are too tired. Visit Ranger Rita at the cabin first!']]);
    await TT.say([['', 'A huge Snorlax is fast asleep, blocking the path to the peak!'], ['Snorlax', 'Zzz... Zzz...'], ['', "Let's wake it up!"]]);
    const L = bossL('snorlax', 10, 2), foe = TT.Battle.bossMon('snorlax', L, bossHp('snorlax', 2.2));
    const r = await TT.Battle.start({ foes: [foe], wild: true, easy: true, stage: 'mountain', allies: allies(), bossTitle: 'The Sleepy Giant' });
    if (follower.sp !== S.party[0].sp) setFollower();
    if (r === 'lose') { lost('snorlax'); return whiteOut(); }
    if (r === 'run') return TT.say([['', 'Snorlax yawned and went back to sleep.']]);
    if (r === 'caught') { delete foe.boss; delete foe.mx; delete foe.raged; foe.hp = TT.maxHp(foe); addMon(foe); }
    else await TT.say([['Snorlax', 'Snorrr... (Snorlax yawned, stretched and waddled away!)']]);
    S.flags.snorlax = 1; applyFlags(); TT.sfx.star(); await TT.say([['', 'The path to the peak is open!']]); save();
  }
  async function hideout() {
    if (!S.party.some(m => m.hp > 0)) return TT.say([['Jessie', 'Ha! Your Pokémon are too tired to fight us, twerp!']]);
    TT.music('rocket');
    await TT.say([['Jessie', 'Well, well! The twerp found our secret hideout!'], ['James', 'Prepare for trouble... a really BIG one!'], ['Meowth', 'Meowth! Fire up the Mecha-Meowth!']]);
    const L = bossL('mecha', 10, 3), foe = TT.Battle.bossMon('mecha', L, bossHp('mecha', 2.4));
    const r = await TT.Battle.start({ foes: [foe], trainer: 'Team Rocket', people: ['jessie', 'james'], easy: true, stage: 'hideout', allies: allies(), bossTitle: "Team Rocket's giant robot", music: 'rocket' });
    if (follower.sp !== S.party[0].sp) setFollower();
    if (r === 'win') {
      await TT.say([['James', 'Our beautiful robot!'], ['Jessie', 'Not again!']]);
      TT.sfx.rocket(); TT.say([['Team Rocket', "Looks like Team Rocket's blasting off agaaaain!"]]);
      S.flags.hideout = 1; applyFlags();
      const star = P(scene, 'sph', TT.glow(0xffffff), [player.x + 10, camY + 16, player.z - 30], 0.5); TT.sfx.pick(); await TT.tween(0.8, k => star.scale.setScalar(0.5 + Math.sin(k * 3.14) * 1.4)); scene.remove(star);
      while (TT.dialogOpen) await TT.wait(0.1);
      await TT.say([['', 'Team Rocket left something behind...']]); await giveStar(6); S.balls += 5; TT.sfx.pick(); await TT.say([['', 'You got 5 Poké Balls too!']]);
    } else { lost('mecha'); S.party.forEach(m => m.hp = TT.maxHp(m)); await TT.say([['Meowth', 'Ha! Come back when you are stronger, twerp!'], ['', 'Your Pokémon rested and feel better. Try again!']]); }
    save();
  }
  async function gokuTalk() {
    const N = 'Goku';
    await TT.say([[N, 'Hey there! You must be the trainer Gohan keeps talking about!'], [N, "I'm Goku. This is my partner, Rayquaza. It's a legendary Pokémon!"], [N, "Let's have a battle! I want to see how strong you are!"]]);
    const L = bossL('goku', 12, 1);
    const r = await TT.Battle.start({ foes: [TT.mon('machoke', L), TT.Battle.bossMon('rayquaza', L + 3, bossHp('goku', 2.2))], trainer: 'Goku', people: ['goku'], easy: true, stage: 'plateau', allies: allies(), music: 'goku', bossMusic: 'goku', bossTitle: "Goku's legendary partner", transform: { at: 1, to: 'goku_ss', say: 'Goku turned Super Saiyan!' } });
    S.party.forEach(m => m.hp = TT.maxHp(m)); if (follower.sp !== S.party[0].sp) setFollower();
    await TT.say(r === 'win' ? [[N, 'Wow! You beat me! You and your Pokémon are amazing!']] : [[N, "Ha ha! That was a great fight! You've got a strong heart."]]);
    await TT.say([[N, 'Here, take this Dragon Ball. I found it while training.']]); await giveStar(5);
    await TT.say([[N, "And I'm coming with you! Rayquaza and I will help you in big battles."], [N, "Let's find the last Dragon Ball and meet the Dragon!"], ['', 'Goku and Rayquaza joined your team!']]);
    S.flags.goku = 1; applyFlags(); TT.sfx.caught(); TT.cry('rayquaza'); save();
  }
  async function nurse() {
    await TT.say(vary('nurseHi', [[['Nurse Joy', 'Welcome to the Poké Center! Let me take care of your Pokémon.']], [['Nurse Joy', 'Hello again! Your Pokémon look like they need a rest.']], [['Nurse Joy', 'Welcome back! Let me look after your team.']], [['Nurse Joy', 'Oh, what brave Pokémon! Let me patch them up.']]]));
    S.party.forEach(m => m.hp = TT.maxHp(m)); TT.sfx.heal(); await TT.wait(0.8);
    await TT.say(vary('nurseDone', [[['Nurse Joy', 'All better! Your Pokémon are full of energy. ♪']], [['Nurse Joy', 'There we go! Good as new. ♪']], [['Nurse Joy', 'All healed up and ready for adventure!']], [['Nurse Joy', 'Your Pokémon feel wonderful again. Take care out there!']]]));
  }
  async function giveStar(n) {
    if (S.stars.indexOf(n) >= 0) return;
    S.stars.push(n); S.flags['s' + n] = 1; TT.sfx.star(); hud();
    const lines = [['', 'You got the ' + n + '-Star Dragon Ball!  (' + S.stars.length + ' of 7)']];
    if (n <= 3 && [1, 2, 3].every(q => S.stars.indexOf(q) >= 0)) lines.push(['', "That's every Dragon Ball hidden in town! The others wait in the City and beyond..."]);
    await TT.say(lines); save();
  }
  function addMon(m) {
    delete m.caughtNow;
    if (S.caught.indexOf(m.sp) < 0) S.caught.push(m.sp);
    if (S.caught.length === 1) nextRocket = Math.min(nextRocket, playT + 25);
    if (S.party.length < 6) S.party.push(m); else { S.box.push(m); TT.toast(TT.monName(m) + ' was sent to the Lab!'); }
  }

  // ---------- the Volcano, Vegeta, the Dragon and the wish ----------
  const vegCol = { x: 390.4, z: -100, r: 2.6 };
  let tunnelCd = 0, altarCd = 0, ballObjs = [], summoning = false;
  const ask = (title, opts) => new Promise(res => {       // a list of big buttons; resolves with the index picked (the first one if the panel is closed)
    openPanel('<h3>' + title + '</h3>' + opts.map((o, i) => '<button class="opt" data-w="' + i + '">' + o + '</button>').join(''));
    panelDone = () => res(0);
    document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { panelDone = null; closePanel(); TT.sfx.pick(); res(+b.dataset.w); });
  });
  async function travel(x, z, h) {      // through a tunnel: the screen closes and you come out the other side
    busy = true; stopInput(); TT.sfx.whoosh(); await TT.wipeTo(1, 0.4, 1);
    player.x = cam.x = x; player.z = cam.z = z; player.h = h; camY = W.gy(x, z); vel.x = vel.z = 0;
    follower.x = x - Math.sin(h) * 1.2; follower.z = z - Math.cos(h) * 1.2 + 0.6; comps.forEach((c, i) => { c.x = x - Math.sin(h) * (2.2 + i); c.z = z - Math.cos(h) * (2.2 + i) + 0.9; });
    await TT.wait(0.25); TT.wipeTo(0, 0.45, 1); tunnelCd = 2.5; busy = false; save();
  }
  async function tunnelIn() {
    const f = S.flags;
    if (f.tunnel) return travel(W.VOL_IN.x, W.VOL_IN.z, Math.PI / 2);
    busy = true; stopInput(); tunnelCd = 5;
    if (!f.goku) { await TT.say([['', 'Huge boulders block the tunnel. Someone very strong could move them...']]); busy = false; return; }
    await TT.say([['Goku', 'Boulders? Leave them to me. Stand back!'], ['Goku', 'Ka... me... ha... me... HA!']]);
    TT.sfx.zap(); await TT.wipeTo(1, 0.22, 1, 0xffffff); f.tunnel = 1; applyFlags(); TT.sfx.hit(); await TT.wipeTo(0, 0.5, 1, 0xffffff);
    TT.sfx.star(); await TT.say([['Krillin', 'Whoa! The tunnel is open! The Volcano is on the other side.'], ['', 'The way to the Volcano is open!']]);
    busy = false; tunnelCd = 1.2; hud(); save();
  }
  async function krillin() {
    const N = 'Krillin', f = S.flags;
    if (f.tunnel) return TT.say([[N, TT.pick(['The last Dragon Ball is in the Volcano. Vegeta is guarding it!', 'Vegeta is tough, but he respects strong trainers.', 'Seven Dragon Balls call the Dragon. It grants one wish!'])]]);
    if (f.goku) return TT.say([[N, "Goku is with you? Great! Walk up to the boulders and he'll blast them away."]]);
    return TT.say([[N, "Hi, I'm Krillin! This tunnel leads to the Volcano, but boulders fell and blocked it."], [N, 'My friend Goku could blast them away. He trains on the peak!']]);
  }
  async function bulma() {
    const N = 'Bulma', f = S.flags; f.bulma = 1;
    if (!S.wishes) return TT.say([[N, "Hi! I'm Bulma, the smartest inventor in the City."], [N, "I'm building a Dragon Radar. It finds Dragon Balls wherever they are!"], [N, "Come back after you have met the Dragon. You'll need it then."]]);
    if (!f.radar) {
      await TT.say([[N, 'The Dragon Balls scattered? Perfect timing!'], [N, 'Here, take my Dragon Radar. The balls show up as orange dots on your map.']]);
      f.radar = 1; TT.sfx.caught(); await TT.say([['', 'You got the Dragon Radar!']]); return;
    }
    const left = (S.scat || []).length;
    return TT.say([[N, left ? 'The radar shows ' + left + (left > 1 ? ' Dragon Balls' : ' Dragon Ball') + ' still out there. Tap your goal line to follow it!' : 'You found them all! Take them to the altar in the Volcano.']]);
  }
  async function vegetaTalk() {
    const N = 'Vegeta';
    if (!S.party.some(m => m.hp > 0)) return TT.say([[N, 'Hmph. Your Pokémon can barely stand. Heal them first.']]);
    await TT.say([[N, 'Hmph. So you are the trainer Goku keeps talking about.'], [N, 'I am Vegeta, the Saiyan prince. The last Dragon Ball is mine!'], [N, "If you want it, beat me and my partner Mewtwo. I won't go easy!"]]);
    const L = bossL('vegeta', 16, 0);
    const r = await TT.Battle.start({ foes: [TT.mon('gyarados', L), TT.mon('machoke', L), TT.Battle.bossMon('mewtwo', L + 2, bossHp('vegeta', 2.0))], trainer: 'Vegeta', people: ['vegeta'], easy: true, stage: 'volcano', allies: allies(), music: 'goku', bossMusic: 'goku', bossTitle: "Vegeta's legendary partner" });
    S.party.forEach(m => m.hp = TT.maxHp(m)); if (follower.sp !== S.party[0].sp) setFollower();
    if (r !== 'win') { lost('vegeta'); return TT.say([[N, 'Ha! Is that all? Train harder and come back.'], ['', 'Your Pokémon rested and feel better. Try again!']]); }
    await TT.say([[N, 'Impossible... You actually beat me.'], [N, 'Hmph. A promise is a promise. Take the Dragon Ball.']]); await giveStar(7);
    await TT.say([[N, "Don't get the wrong idea. I'm coming along because I want to see this Dragon myself."], ['', 'Vegeta and Mewtwo joined your team!']]);
    S.flags.vegeta = 1; applyFlags(); TT.sfx.caught(); TT.cry('mewtwo'); save();
  }
  async function altar() {
    busy = true; stopInput(); altarCd = 6;
    if (S.stars.length < 7) { await TT.say([['', 'A stone altar with seven empty hollows. It is waiting for all 7 Dragon Balls.']]); busy = false; return; }
    // --- the summoning ---
    await TT.say([['', 'The seven Dragon Balls begin to glow...']]);
    summoning = true; TT.music(null);
    for (let i = 0; i < 7; i++) {
      const b = W.pedBalls[i], to = W.PEDS[i], x0 = player.x, z0 = player.z; b.visible = true; TT.sfx.pick();
      await TT.tween(0.28, q => { b.position.set(x0 + (to[0] - x0) * q, 1.2 + Math.sin(q * 3.14) * 2.2 + (to[1] - 1.2) * q, z0 + (to[2] - z0) * q); b.rotation.y += 0.4; });
    }
    TT.tween(1.6, q => { TT.camZoom = 1 + 0.3 * q; W.altarBeam.material.opacity = 0.75 * q; W.altarBeam.scale.x = W.altarBeam.scale.z = 1.6 + Math.sin(q * 40) * 0.3; for (const b of W.pedBalls) b.rotation.y += 0.3; });
    for (let i = 0; i < 3; i++) { TT.sfx.zap(); TT.wipeTo(0.0, 0.01, 1); const fl = $('flash'); if (fl) { fl.style.transition = 'none'; fl.style.background = '#fff'; fl.style.opacity = 0.8; requestAnimationFrame(() => { fl.style.transition = 'opacity .35s'; fl.style.opacity = 0; }); } await TT.wait(0.5); }
    await TT.say([['', 'The sky goes dark. Lightning cracks!'], ['Shenron', 'I am the Eternal Dragon. Who has gathered the seven Dragon Balls?'], ['Shenron', 'Show me your strength, and I will grant you one wish!']]);
    const n = S.wishes || 0, L = bossL('dragon', 18, 4 + n * 3), foe = TT.Battle.bossMon('shenron', L, bossHp('dragon', 2.6 + n * 0.3));
    const r = await TT.Battle.start({ foes: [foe], wild: true, noCatch: true, easy: true, stage: 'lair', allies: allies(), music: 'dragon', bossMusic: 'dragon', bossTitle: 'The Eternal Dragon' });
    summoning = false; TT.camZoom = 1; W.altarBeam.material.opacity = 0; for (const b of W.pedBalls) b.visible = false;
    S.party.forEach(m => m.hp = TT.maxHp(m)); if (follower.sp !== S.party[0].sp) setFollower();
    if (r === 'win') await wish();
    else if (r === 'run') await TT.say([['Shenron', 'Return when you are ready.']]);
    else { lost('dragon'); await TT.say([['Shenron', 'You are not ready yet. Return when you are stronger.'], ['', 'Your Pokémon rested and feel better. Try again!']]); }
    busy = false; altarCd = 6; hud(); save();
  }
  async function wish() {
    await TT.say([['Shenron', 'You have proven yourself. Speak your wish!']]);
    const lead = S.party[0], ty = TT.DEX[lead.sp][1], sup = TT.SUPER[ty] || 'Giga Impact', have = sp => S.party.concat(S.box).some(m => m.sp === sp);
    const birds = ['articuno', 'zapdos', 'moltres'].filter(sp => !have(sp)), opts = [], acts = [];
    if (birds.length) { opts.push('🦅 A legendary Pokémon joins my team'); acts.push('bird'); }
    if (!lead.sup) { opts.push('💥 Teach ' + TT.monName(lead) + ' the super move ' + sup); acts.push('sup'); }
    opts.push('⭐ Make my whole team 3 levels stronger'); acts.push('lvl');
    opts.push('🎒 50 Poké Balls'); acts.push('balls');
    const a = acts[await ask('🐉 Make a wish!', opts)];
    if (a === 'bird') {
      const names = { articuno: '❄ Articuno, the ice bird', zapdos: '⚡ Zapdos, the thunder bird', moltres: '🔥 Moltres, the fire bird' };
      const sp = birds[await ask('Which legendary Pokémon?', birds.map(b => '<img src="' + TT.monPortrait(b) + '" style="width:52px;height:52px;vertical-align:middle"> ' + names[b]))];
      const m = TT.mon(sp, Math.max(20, lead.lvl - 3)); addMon(m); TT.cry(sp); TT.sfx.caught(); await TT.say([['', TT.monName(m) + ' joined your team!']]);
    } else if (a === 'sup') { lead.sup = [sup, ty, 100]; TT.sfx.level(); TT.toast(TT.monName(lead) + ' learned ' + sup + '!'); await TT.say([['', 'Your partner learned a super move!']]); }
    else if (a === 'lvl') { S.party.forEach(m => { m.lvl = Math.min(99, m.lvl + 3); m.hp = TT.maxHp(m); }); TT.sfx.level(); await TT.say([['', 'Your whole team grew 3 levels!']]); }
    else { S.balls += 50; TT.sfx.pick(); await TT.say([['', 'You got 50 Poké Balls!']]); }
    await TT.say([['Shenron', 'Your wish is granted. Farewell!']]);
    S.wishes = (S.wishes || 0) + 1; scatter(); TT.sfx.star();
    await TT.say([['', 'The seven Dragon Balls shoot into the sky and scatter across the world!'], ['', S.flags.radar ? 'Use the Dragon Radar to find them again.' : 'Bulma in the City is building a Dragon Radar. Go and see her!']]);
  }
  // after a wish the balls land in seven new hiding places, different every time
  function scatter() {
    const idx = W.SCATTER.map((s, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; }
    S.scat = idx.slice(0, 7).map((si, i) => { const sp = W.SCATTER[si], q = W.collide(sp[0], sp[1], 0.6); return { n: i + 1, x: +q[0].toFixed(1), z: +q[1].toFixed(1), h: sp[2] }; });
    S.stars = []; placeBalls(); hud();
  }
  function placeBalls() {
    for (const b of ballObjs) scene.remove(b.o); ballObjs = [];
    for (const d of (S && S.scat) || []) { const o = TT.starBall(d.n, 0.3); o.position.set(d.x, W.gy(d.x, d.z) + 0.6, d.z); scene.add(o); ballObjs.push({ o, d }); }
  }
  // ---------- family progress: every player's game tells the others how far along it is ----------
  // Dad's device remembers the last report from each child, so he can look any time, not only while they play.
  const AKEYS = ['town', 'city', 'world', 'volcano'];
  const REAL = { Liko: 'Llorianne (Liko)', Ash: 'LJ (Ash)' };      // this family's two original cards
  let fam = {}, famT = 0, famIv = null;
  const famKey = () => 'tt_fam_' + (Net.room || 'home');
  const famLoad = () => { try { fam = JSON.parse(localStorage.getItem(famKey())) || {}; } catch (e) { fam = {}; } };
  const famSave = () => { try { localStorage.setItem(famKey(), JSON.stringify(fam)); } catch (e) { } };
  const withFlags = SV => { const f = SV.flags = SV.flags || {}; for (const n of SV.stars || []) f['s' + n] = 1; if (f.profDone) f.s2 = 1; if (f.gym) f.s4 = 1; if (f.goku) f.s5 = 1; if (f.hideout) f.s6 = 1; if (f.vegeta) f.s7 = 1; return SV; };
  function summary(SV, name) {       // a small, safe description of one saved game
    const pr = AKEYS.map(k => areaProgress(k, SV).pct), lead = SV.party && SV.party[0];
    return { n: String(name || 'Trainer').slice(0, 14), ch: SV.ch, sp: lead ? lead.sp : '', lvl: lead ? lead.lvl : 0, stars: (SV.stars || []).length, wishes: SV.wishes || 0, kinds: (SV.caught || []).length,
      pr, whole: Math.round(pr.reduce((a, b) => a + b, 0) / pr.length), goal: questOf(SV)[0].replace(/^[➜★]\s*/, '').slice(0, 90), ts: SV.ts || Date.now() };
  }
  function famSet(d, live) {
    if (!d || typeof d.n !== 'string' || !Array.isArray(d.pr)) return;
    const k = d.n.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14); if (!k) return;
    const old = fam[k]; if (old && !live && old.ts >= (+d.ts || 0)) return;        // an online copy never replaces something newer
    fam[k] = { n: d.n.replace(/[<>&]/g, '').slice(0, 14), ch: String(d.ch || '').slice(0, 8), sp: TT.DEX[d.sp] ? d.sp : '', lvl: Math.min(99, d.lvl | 0), stars: Math.min(7, d.stars | 0), wishes: Math.min(99, d.wishes | 0), kinds: Math.min(99, d.kinds | 0),
      pr: d.pr.slice(0, 4).map(v => TT.clamp(v | 0, 0, 100)), whole: TT.clamp(d.whole | 0, 0, 100), goal: String(d.goal || '').replace(/[<>&]/g, '').slice(0, 90), ts: +d.ts || Date.now(), seen: live ? Date.now() : (old && old.seen) || 0 };
    famSave();
  }
  const ago = t => { const m = (Date.now() - t) / 60000; return m < 1.5 ? 'just now' : m < 60 ? Math.round(m) + ' minutes ago' : m < 60 * 36 ? Math.round(m / 60) + ' hours ago' : Math.round(m / 1440) + ' days ago'; };
  // online saves (only when a database address is set in js/config.js): read every saved game in the family room
  function famCloud() {
    if (!CLOUD || !Net.room) return Promise.resolve(false);
    return fetch(CLOUD + '/saves/' + Net.room + '.json').then(r => r.json()).then(all => {
      for (const slot in all || {}) { const SV = all[slot]; if (!SV || !SV.party || !SV.party.length || SV.ch === 'dad') continue; famSet(summary(withFlags(SV), SV.nm || NAMES[SV.ch] || slot.replace(/^tt1_(p_)?/, '')), false); }
      return true;
    }).catch(() => false);
  }
  function showFamily() {
    famLoad();
    const draw = () => {
      const list = Object.keys(fam).map(k => fam[k]).filter(e => e.ch !== 'dad').sort((a, b) => a.n.localeCompare(b.n));
      let h = '<h3>Kids\' progress <button id="pClose">✕</button></h3>';
      if (!list.length) h += '<p style="font-weight:700">Nothing yet.</p><p>Open the game on a child\'s tablet while you are in Daddy mode. Their progress appears here within a few seconds, and this device remembers it for later.</p>';
      for (const e of list) {
        const live = Date.now() - e.seen < 25000;
        h += '<div class="kid"><div class="kh">' + (e.sp ? '<img src="' + TT.monPortrait(e.sp) + '">' : '') + '<div><b>' + (!kidsList.length && REAL[e.n] || e.n) + '</b><span>' + (e.sp ? 'Lv ' + e.lvl + ' ' + TT.DEX[e.sp][0] + ' · ' : '') + e.stars + ' of 7 Dragon Balls · ' + e.kinds + ' kinds caught' + (e.wishes ? ' · ' + e.wishes + (e.wishes > 1 ? ' wishes' : ' wish') : '') + '</span></div><em class="' + (live ? 'on' : '') + '">' + (live ? '🟢 playing now' : 'seen ' + ago(e.seen || e.ts)) + '</em></div>' +
          '<div class="kw"><b>Whole adventure</b>' + pbar(e.whole) + '</div><div class="kareas">' + AKEYS.map((k, i) => '<div><span>' + AREAS[k].name + '</span>' + pbar(e.pr[i] || 0) + '</div>').join('') + '</div>' +
          (e.goal ? '<p class="kgoal">Next: ' + e.goal + '</p>' : '') + '</div>';
      }
      h += '<p style="font-size:13px;opacity:.7;margin:8px 0 0">' + (CLOUD ? 'Online saves are on: this also shows what each child last saved, even when they are not playing.' : 'Updates arrive while a child is playing in your family room. Between sessions this shows the last update this device received.') + '</p>';
      const top = $('panelIn').scrollTop; openPanel(h); $('panelIn').scrollTop = top; $('panelIn').dataset.fam = '1';
    };
    draw(); famCloud().then(ok => { if (ok && $('panelIn').dataset.fam && panelOpen) draw(); });
    clearInterval(famIv); famIv = setInterval(() => { if (!panelOpen || !$('panelIn').dataset.fam || !$('panelIn').querySelector('.kid,p')) { clearInterval(famIv); delete $('panelIn').dataset.fam; return; } draw(); }, 3000);
  }
  // ---------- how much of each area is done (shown on the map) ----------
  function areaProgress(key, SV) {
    SV = SV || S; const f = SV.flags || {}, items = [], kinds = [];
    for (const z of W.zones) if (areaKey(z.x, z.z) === key) for (const sp of z.pool) if (kinds.indexOf(sp) < 0) kinds.push(sp);
    const got = kinds.filter(sp => SV.caught.indexOf(sp) >= 0).length, add = (t, done) => items.push({ t, done: !!done });
    if (key === 'town') { add('Help Professor Oak', f.profDone); add('Hatch an egg', f.hatched); add('Beat Team Rocket', f.s1 || SV.rocket > 0); add('Find the hidden Dragon Ball', f.s3); }
    else if (key === 'city') { add('Win the City Gym', f.gym); add('Team up with Gohan', f.gohan); add('Meet Bulma the inventor', f.bulma); }
    else if (key === 'world') { add('Wake up Snorlax', f.snorlax); add('Battle Goku', f.goku); add("Stop Team Rocket's robot", f.hideout); add('Open the Volcano Tunnel', f.tunnel); }
    else { add('Beat Vegeta', f.vegeta); add('Call the Dragon and make a wish', SV.wishes > 0); add('Find all 7 Dragon Balls again', SV.wishes > 1 || (SV.wishes > 0 && SV.stars.length >= 7)); }
    items.push({ t: 'Catch every kind of Pokémon here (' + got + ' of ' + kinds.length + ')', done: got >= kinds.length, part: kinds.length ? got / kinds.length : 1 });
    return { pct: Math.round(items.reduce((a, it) => a + (it.done ? 1 : it.part || 0), 0) / items.length * 100), items };
  }
  const pbar = pct => '<span class="pbar"><i style="width:' + pct + '%"></i></span><small class="pct">' + (pct >= 100 ? '⭐ All done!' : pct + '% done') + '</small>';
  const todoList = key => { const p = areaProgress(key); return '<div class="todo"><b>' + AREAS[key].name + ': ' + (p.pct >= 100 ? '⭐ all done!' : p.pct + '% done') + '</b>' + pbar(p.pct).replace(/<small.*$/, '') + p.items.map(it => '<span class="' + (it.done ? 'ok' : '') + '">' + (it.done ? '✅ ' : '⬜ ') + it.t + '</span>').join('') + '</div>'; };

  // ---------- events ----------
  async function wildBattle(w) {
    if (!S.party.some(m => m.hp > 0)) { TT.toast('Your Pokémon are tired! Visit Nurse Joy.'); battleCd = 4; return; }
    busy = true; stopInput();
    const foe = TT.mon(w.sp, w.lvl), r = await TT.Battle.start({ foes: [foe], wild: true, stage: stageHere() });
    if (r === 'caught') { foe.hp = TT.maxHp(foe); addMon(foe); removeWild(w); } else if (r === 'win') removeWild(w); else if (r === 'lose') await whiteOut();
    battleCd = 2.5; if (follower.sp !== S.party[0].sp) setFollower(); hud(); save(); busy = false;
  }
  async function whiteOut() {
    const a = areaKey(player.x, player.z);
    S.party.forEach(m => m.hp = TT.maxHp(m)); if (a === 'volcano') { player.x = W.VOL_IN.x + 1; player.z = W.VOL_IN.z; } else if (a === 'world') { player.x = W.RANGER.x + 1.5; player.z = W.RANGER.z + 2; } else if (a === 'city') { player.x = W.NURSE2.x + 1; player.z = W.NURSE2.z + 1.8; } else { player.x = W.CENTER.x; player.z = W.CENTER.z + 2.2; } follower.x = player.x + 1; follower.z = player.z + 1; cam.x = player.x; cam.z = player.z;
    TT.sfx.heal();
    if (a === 'volcano') await TT.say([['', 'Your Pokémon fainted! Goku carried you back to the tunnel and they rested up.']]);
    else if (a === 'world') await TT.say([['Ranger Rita', 'Oh no, your Pokémon fainted! I brought you back to my cabin and healed them.'], ['Ranger Rita', 'Be careful out there!']]);
    else await TT.say([['Nurse Joy', 'Oh dear, your Pokémon fainted! I carried you back and healed them all up.'], ['Nurse Joy', 'Be careful out there!']]);
  }
  async function hatch() {
    busy = true; stopInput(); S.egg.warm = 100; hud();
    const ex = player.x, ez = player.z + 1.6; eggObj.position.set(ex, W.gy(ex, ez), ez); player.h = 0;
    await TT.say([['', 'Oh? The egg is moving!']]);
    for (let i = 0; i < 4; i++) { TT.sfx.shake(); await TT.tween(0.4, k => { eggObj.rotation.z = Math.sin(k * 6.28) * (0.2 + i * 0.1); }); await TT.wait(0.3 - i * 0.05); }
    const flash = P(scene, 'sph', TT.glow(0xffffff), [ex, 0.5, ez], 0.2); TT.sfx.evo();
    await TT.tween(0.4, k => flash.scale.setScalar(0.2 + k * 1.4));
    eggObj.visible = false; eggObj.rotation.z = 0;
    const sp = TT.pick(['eevee', 'charmander', 'squirtle', 'bulbasaur'].filter(s => S.caught.indexOf(s) < 0).concat('eevee')), baby = TT.creature(sp);
    baby.position.set(ex, 0, ez); scene.add(baby);
    await TT.tween(0.5, k => { flash.scale.setScalar(1.6 * (1 - k) + 0.01); baby.scale.setScalar(0.2 + 0.8 * k); baby.position.y = Math.sin(k * 3.14) * 0.6; });
    scene.remove(flash);
    const m = TT.mon(sp, 3); S.egg = { have: false, warm: 0 }; S.flags.hatched = 1; eggReadyAt = playT + 240;
    await TT.say([['', 'The egg hatched! It\'s a baby ' + TT.monName(m) + '!'], ['', TT.monName(m) + ' joined your team!']]);
    scene.remove(baby); addMon(m); hud(); save(); busy = false;
  }
  async function rocketEvent() {
    busy = true; stopInput(); TT.music('rocket');
    const pm = S.party[0], pn = TT.monName(pm), me = NAMES[S.ch], n = S.rocket;
    const bx = player.x, bz = W.collide(player.x, player.z - 5, 1)[1], by = W.gy(bx, bz);
    const g = new THREE.Group(); g.position.set(bx, by + 14, bz); scene.add(g);
    const je = TT.human(TT.PEOPLE.jessie), ja = TT.human(TT.PEOPLE.james), mw = TT.creature('meowth');
    je.position.set(-0.9, 0, 0); ja.position.set(0.9, 0, 0); mw.position.set(0, 0, 0.9); g.add(je); g.add(ja); g.add(mw); actors.push(je, ja, mw); je.userData.gesture = 'point';
    const bal = new THREE.Group(); bal.position.set(0, 0, -1.2); g.add(bal);
    P(bal, 'sph', 0xf3e3b0, [0, 5.4, 0], [2, 2.2, 2]); for (const s of [1, -1]) P(bal, 'cone', 0x1c1c22, [s * 1.2, 7.4, 0], [0.6, 1.2, 0.3], [0, 0, -s * 0.4]);
    P(bal, 'sph', 0xf2c230, [0, 6.4, 1.8], [0.3, 0.5, 0.15]); for (const s of [1, -1]) P(bal, 'sph', 0x1c1c22, [s * 0.7, 5.7, 1.85], [0.3, 0.4, 0.1]);
    P(bal, 'box', 0x9a6a3a, [0, 1.2, 0], [1.6, 1.1, 1.6]); for (const s of [1, -1]) P(bal, 'cyl', 0x6a5a48, [s * 0.7, 2.6, 0], [0.03, 2.2, 0.03]);
    player.h = Math.PI;
    await TT.tween(1.6, k => { g.position.y = by + 14 * (1 - TT.ease(k)); });
    // what they say changes every time: a different entrance, a remark about this place or about how far the trainer has come, and a different demand
    const area = areaKey(player.x, player.z), fl = S.flags, lines = vary('rkIntro', RK.intro).slice();
    if (n === 1) lines.push(['James', 'And this time our Pumpkaboo evolved into Gourgeist!']);
    else { let ctx = (RK.place[area] || RK.place.town).slice(); if (fl.vegeta) ctx = ctx.concat(RK.vegeta); else if (fl.goku) ctx = ctx.concat(RK.goku); else if (fl.gohan) ctx = ctx.concat(RK.gohan);
      if (S.stars.length >= 4) ctx = ctx.concat(RK.balls); if (fl.hideout) ctx = ctx.concat(RK.robot); if (n >= 4) ctx = ctx.concat(RK.many); lines.push(...vary('rkCtx', ctx, true)); }
    lines.push(...vary('rkDemand', [[['Jessie', 'Hand over that ' + pn + ', twerp!']]].concat(RK.demand)));
    await TT.say(lines);
    const fx = follower.x, fz = follower.z; TT.sfx.throw();
    await TT.tween(0.8, k => { follower.x = fx + (bx - fx) * k; follower.z = fz + (bz + 0.2 - fz) * k; follower.root.position.set(follower.x, by + Math.sin(k * 3.14) * 2, follower.z); });
    await TT.say([].concat(vary('rkGrab', [[['Meowth', 'Gotcha! ' + pn + ' is ours now!']]].concat(RK.grab)),
      vary('rkCry', [[[me, 'Hey! Give ' + pn + ' back!']], [[me, 'Hey! That is my partner!']], [[me, 'Let go of my friend!']], [[me, 'Not again, Team Rocket!']]]),
      [[pn, '(' + pn + TT.pick([' broke out of the net!', ' wriggled out of the net!', ' chewed through the net!', ' slipped free and ran back!']) + ')']],
      vary('rkCall', [[[me, pn + ", let's battle and send them flying!"]], [[me, "Okay team, let's send them flying!"]], [[me, 'Time to teach Team Rocket a lesson!']]])));
    pm.hp = TT.maxHp(pm);
    const L = Math.max(2, pm.lvl - 3);
    const r = await TT.Battle.start({ foes: [TT.mon(n === 0 ? 'pumpkaboo' : 'gourgeist', L), TT.mon('inkay', L), TT.mon('meowth', L)], trainer: 'Team Rocket', people: ['jessie', 'james'], easy: true, music: 'rocket', after: 'rocket', allies: allies(), stage: stageHere() });
    if (r === 'win') await TT.say(vary('rkWin', RK.win));
    else { S.party.forEach(m => m.hp = TT.maxHp(m)); await TT.say(vary('rkLose', RK.lose).concat([[pn, '(' + pn + ' jumped back to you!)']])); }
    TT.sfx.rocket();
    TT.say(vary('rkBlast', RK.blast));
    await TT.tween(2.2, k => { g.position.set(bx + k * k * 40, by + k * k * 60, bz - k * 30); g.rotation.z = k * 3; g.scale.setScalar(1 - k * 0.7); });
    scene.remove(g); actors.length = 0; const star = P(scene, 'sph', TT.glow(0xffffff), [player.x + 12, by + 14, player.z - 30], 0.5); TT.sfx.pick();
    await TT.tween(0.5, k => star.scale.setScalar(0.5 + Math.sin(k * 3.14) * 1.2)); scene.remove(star);
    while (TT.dialogOpen) await TT.wait(0.1);
    follower.x = player.x + 1; follower.z = player.z + 0.5; if (follower.sp !== S.party[0].sp) setFollower();
    S.rocket++;
    if (r === 'win') { if (S.stars.indexOf(1) < 0 && !S.wishes) { await TT.say([['', 'Team Rocket dropped something shiny...']]); await giveStar(1); } else { S.balls += 3; TT.sfx.pick(); await TT.say([['', 'Team Rocket dropped 3 Poké Balls!']]); } }
    nextRocket = playT + rand(240, 360); battleCd = 2; TT.music(TT.areaMusic()); hud(); save(); busy = false;
  }

  // ---------- HUD / panels ----------
  // what a saved game should do next: [text, place to guide to]
  function questOf(SV) {
    let q, g = null; const f = SV.flags || {}, at = (x, z, n) => ({ x, z, n });
    if (!f.profMet) { q = '➜ Visit Professor Oak at the Lab (top of town)'; g = at(3.5, -21.5, "Professor Oak's Lab"); }
    else if (!f.profDone) { if (SV.caught.length >= 3) { q = '➜ Go show Professor Oak!'; g = at(3.5, -21.5, "Professor Oak's Lab"); } else { q = '➜ Catch 3 kinds of Pokémon in the tall grass (' + SV.caught.length + '/3)'; g = at(-40, 30, 'the West Meadow grass'); } }
    else if (!f.city) { q = '➜ Talk to Officer Gus at the north gate to enter the City'; g = at(3.2, -50.5, 'the north gate'); }
    else if ((SV.egg && SV.egg.have)) { q = '➜ Warm the egg by the campfire'; g = at(W.FIRE.x, W.FIRE.z + 2, 'the campfire'); }
    else if (!f.gym) { q = '➜ Challenge the City Gym at the far end of the avenue'; g = at(0, -159.5, 'the City Gym'); }
    else if (!f.gohan) { q = '➜ Tell Gohan in the Clock Plaza!'; g = at(5, -117, 'Gohan'); }
    else if (!f.world) { q = "➜ Ask Officer Gail at the City's east gate about the Wide World"; g = at(49.5, -95.5, 'the east gate'); }
    else if (!f.snorlax) { q = '➜ Cross the big bridge and wake up the sleeping Snorlax'; g = at(W.SNORLAX.x - 5, W.SNORLAX.z, 'the sleeping Snorlax'); }
    else if (!f.goku) { q = "➜ Climb to Goku's Peak and meet Goku"; g = at(W.PLATEAU.x - 2.5, W.PLATEAU.z, "Goku's Peak"); }
    else if (!f.hideout) { q = '➜ Stop Team Rocket at their hideout in the south'; g = at(204, -149.5, "Team Rocket's hideout"); }
    else if (!f.tunnel) { q = '➜ Find the Volcano Tunnel, north-east of the Whisper Forest'; g = at(W.TUNNEL.x - 3, W.TUNNEL.z, 'the Volcano Tunnel'); }
    else if (!f.vegeta) { q = '➜ Cross the Volcano and challenge Vegeta for the last Dragon Ball'; g = at(W.VEGETA.x - 2.2, W.VEGETA.z, 'Vegeta'); }
    else if (SV.stars.length >= 7) { q = "➜ Take all 7 Dragon Balls to the altar in the Dragon's Lair"; g = at(W.ALTAR.x - 4.2, W.ALTAR.z, "the Dragon's altar"); }
    else if (!SV.wishes && SV.stars.indexOf(3) < 0) { q = '➜ Something shiny is hiding in the trees behind the town pond...'; g = at(W.STARSPOT.x - 2, W.STARSPOT.z, 'the hiding place'); }
    else if (!SV.wishes && SV.stars.indexOf(1) < 0) q = '➜ Beat Team Rocket when they swoop in, and they might drop something!';
    else if (SV.wishes && !f.radar) { q = '➜ The Dragon Balls scattered! Ask Bulma in the City for her Dragon Radar'; g = at(14.5, -99.2, 'Bulma'); }
    else if (SV.wishes && SV.scat && SV.scat.length) { let b = SV.scat[0], bd = 1e9; const here = areaKey(player.x, player.z); for (const c of SV.scat) { const d = Math.hypot(c.x - player.x, c.z - player.z) + (areaKey(c.x, c.z) === here ? 0 : 500); if (d < bd) { bd = d; b = c; } } q = '➜ Find the Dragon Balls with the radar (' + SV.stars.length + '/7)'; g = at(b.x, b.z, 'a Dragon Ball near ' + b.h); }
    else q = '★ Keep exploring!';
    return [q, g];
  }
  function hud() {
    if (!S) return;
    $('nBall').textContent = S.balls; $('nStar').textContent = S.stars.length; $('chipStar').classList.toggle('radar', radarOn());
    $('chipEgg').classList.toggle('hide', !S.egg.have); { const wv = Math.round(Math.min(100, S.egg.warm)); if (wv !== eggShown) { eggShown = wv; $('eggBar').style.width = wv + '%'; } }
    const qg = questOf(S); let q = qg[0]; const g = qg[1];
    goal = g; if (g) q += '  📍';
    $('quest').textContent = q;
  }
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  function openPanel(html) { delete $('panelIn').dataset.fam; $('panelIn').innerHTML = html; $('panel').classList.remove('hide'); panelOpen = true; stopInput(); const c = $('pClose'); if (c) c.onclick = closePanel; }
  let panelDone = null;
  function closePanel() { $('panel').classList.add('hide'); panelOpen = false; if (panelDone) { const f = panelDone; panelDone = null; f(false); } }
  // friendly Pokémon in town: after saying hello, the player can choose to battle (and even catch) it
  function petAsk(n) {
    return new Promise(res => {
      openPanel('<h3>' + n.name + ' wants to play! <button id="pClose">✕</button></h3><button class="opt" id="pbY">⚔ Battle ' + n.name + '</button><button class="opt" id="pbN">👋 Not now</button>');
      panelDone = res; $('pbY').onclick = () => { panelDone = null; closePanel(); res(true); }; $('pbN').onclick = closePanel;
    });
  }
  function showTeam() {
    let h = '<h3>My Team <button id="pClose">✕</button></h3>';
    S.party.forEach((m, i) => {
      const ty = TT.DEX[m.sp][1], k = m.hp / TT.maxHp(m);
      h += '<button class="mon' + (i ? '' : ' lead') + '" data-i="' + i + '"><img src="' + TT.monPortrait(m.sp) + '"><div class="inf"><b>' + TT.monName(m) + '</b><span class="tag" style="background:' + hex(TT.TYPE_COL[ty]) + '">' + ty + '</span> &nbsp;Lv ' + m.lvl +
        '<div class="hp"><div style="width:' + k * 100 + '%;background:' + (k > 0.5 ? '#4cd964' : k > 0.22 ? '#f2c230' : '#e8402a') + '"></div></div></div><em>' + (i ? 'Make partner' : 'Partner') + '</em></button>' +
        '<button class="mvrow" data-m="' + i + '">⚔ ' + TT.moves(m).map(v => v[0]).join(' · ') + (TT.known(m).length > 4 ? ' <b>(' + TT.known(m).length + ' learned — tap to choose)</b>' : '') + '</button>';
    });
    h += '<p style="font-size:13px;opacity:.7;margin:6px 0 0">Tap a Pokémon to make it your partner. Your partner walks with you and battles first.</p>';
    if (S.box.length) {
      const lab = S.box.map((m, i) => [m, i]).sort((a, b) => b[0].lvl - a[0].lvl).slice(0, 18);
      h += '<h3 style="margin-top:14px">At the Lab <button id="bBest" class="best">⭐ Pick my strongest team</button></h3><p style="font-size:13px;opacity:.7;margin:0 0 8px">Tap one to bring it onto your team. It swaps places with your weakest team member.</p><div class="labgrid">';
      for (const [m, i] of lab) h += '<button class="labmon" data-b="' + i + '"><img src="' + TT.monPortrait(m.sp) + '"><b>' + TT.monName(m) + '</b><span>Lv ' + m.lvl + '</span></button>';
      h += '</div>' + (S.box.length > lab.length ? '<p style="font-size:13px;opacity:.7">…and ' + (S.box.length - lab.length) + ' more resting.</p>' : '');
    }
    openPanel(h);
    const done = () => { setFollower(); hud(); save(); TT.sfx.pick(); showTeam(); };
    document.querySelectorAll('#panelIn .mvrow').forEach(b => b.onclick = () => showMoves(+b.dataset.m));
    document.querySelectorAll('#panelIn .mon').forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i) { const m = S.party.splice(i, 1)[0]; S.party.unshift(m); done(); } });
    document.querySelectorAll('#panelIn .labmon').forEach(b => b.onclick = () => {
      const m = S.box.splice(+b.dataset.b, 1)[0]; m.hp = TT.maxHp(m);
      if (S.party.length < 6) S.party.push(m);
      else { let w = 1; for (let i = 2; i < S.party.length; i++) if (S.party[i].lvl < S.party[w].lvl) w = i; S.box.push(S.party[w]); S.party[w] = m; }
      TT.toast(TT.monName(m) + ' joined your team!'); done();
    });
    const best = $('bBest'); if (best) best.onclick = () => {
      const lead = S.party[0], rest = S.party.slice(1).concat(S.box).sort((a, b) => b.lvl - a.lvl);
      S.party = [lead].concat(rest.slice(0, 5)); S.box = rest.slice(5); S.party.forEach(m => { if (m.hp <= 0) m.hp = 1; });
      TT.toast('⭐ Your strongest team is ready!'); done();
    };
  }
  function showMap() {
    const here = areaKey(player.x, player.z), f = S.flags;
    const card = (key, icon, name, open, lockMsg) => open ? '<div class="place go" data-a="' + key + '">' + icon + ' ' + name + '<small>' + (here === key ? '📍 You are here' : 'Tap Fly to jump there') + '</small>' + pbar(areaProgress(key).pct) + '<span class="prow">' + (here !== key ? '<button class="fly" data-fly="' + key + '">✈ Fly here</button>' : '') + '<button class="seemap">🗺 Map</button></span></div>' : '<div class="place lock">' + icon + ' ' + name + '<small>' + lockMsg + '</small></div>';
    const keys = ['town', 'city', 'world', 'volcano'], all = Math.round(keys.reduce((a, k) => a + areaProgress(k).pct, 0) / keys.length);
    let h = '<h3>World Map <button id="pClose">✕</button></h3><div class="whole"><b>My whole adventure</b>' + pbar(all) + '</div><div class="mapgrid">' + card('town', '🏡', 'Trainer Town', true) + card('city', '🏙️', 'The City', f.city, 'Ask Officer Gus at the gate') +
      card('world', '🌍', 'The Wide World', f.world, 'Beat the City Gym first') + card('volcano', '🌋', 'The Volcano', f.tunnel, 'Find the tunnel in the Wide World') + '</div><div class="stars">';
    for (let i = 1; i <= 7; i++) h += '<i class="' + (S.stars.indexOf(i) >= 0 ? 'got' : '') + '">' + '★'.repeat(i > 4 ? 1 : i) + (i > 4 ? i : '') + '</i>';
    h += '</div><p style="text-align:center;font-weight:700;margin:4px 0 10px">Dragon Balls: ' + S.stars.length + ' / 7</p><p style="text-align:center;margin:0"><button id="pReset" style="background:none;text-decoration:underline;font-size:13px;opacity:.6">Start this character over</button></p>';
    openPanel(h);
    document.querySelectorAll('[data-a]').forEach(el => el.onclick = e => { if (e.target.dataset && e.target.dataset.fly) return; showAreaMap(el.dataset.a); });
    document.querySelectorAll('[data-fly]').forEach(bt => bt.onclick = e => { e.stopPropagation(); flyTo(bt.dataset.fly); });
    $('pReset').onclick = () => { if (confirm('Erase ' + pname + "'s saved game and start over?")) { localStorage.removeItem(slot); const u = cloudUrl(); if (u) fetch(u, { method: 'DELETE', keepalive: true }).catch(() => { }); setTimeout(() => location.reload(), 300); } };
  }
  const SPAWN = { town: [0, 8], city: [0, -80], world: [80, -100], volcano: [333, -100] };
  // Fly: your trainer leaps into the sky, clouds close over the screen, and you drop in at the new place.
  async function flyTo(k) {
    if (busy || !SPAWN[k]) return; closePanel(); busy = flying = true; stopInput(); setDest(null);
    const p = SPAWN[k], h0 = player.h;
    TT.sfx.whoosh(); poof(player.x, player.z); player.root.userData.model.userData.gesture = 'cheer';
    TT.tween(0.75, q => { player.lift = q * q * 16; player.h = h0 + q * 12; follower.lift = Math.max(0, q - 0.15) * 14; TT.camZoom = 1 + q * 0.35; });
    await TT.wait(0.4); await TT.wipeTo(1, 0.4, 1, 0xf4fbff);
    player.x = cam.x = p[0]; player.z = cam.z = p[1]; camY = W.gy(p[0], p[1]); vel.x = vel.z = 0;
    follower.x = p[0] + 1; follower.z = p[1] + 0.8; comps.forEach((c, i) => { c.x = p[0] - 1 - i; c.z = p[1] + 1.5; });
    player.lift = follower.lift = 16; TT.camZoom = 1.35; areaNow = k; TT.music(TT.areaMusic());
    await TT.wait(0.25); TT.sfx.star(); TT.wipeTo(0, 0.45, 1, 0xf4fbff);
    await TT.tween(0.7, q => { const e = 1 - (1 - q) * (1 - q); player.lift = 16 * (1 - e); follower.lift = 16 * (1 - Math.min(1, e * 1.1)); player.h = Math.PI + (1 - e) * 9; TT.camZoom = 1.35 - 0.35 * e; });
    player.lift = follower.lift = 0; player.h = Math.PI; TT.camZoom = 1; player.root.userData.model.userData.gesture = null;
    poof(p[0], p[1]); TT.sfx.pick(); TT.toast('✈ Welcome to ' + AREAS[k].name + '!'); busy = flying = false; save();
  }

  // ---------- new-version check: offer a one-tap update without leaving the game ----------
  let myVer = null;
  const verFetch = () => fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => j && j.v).catch(() => null);
  verFetch().then(v => { myVer = v; });
  setInterval(() => { if (!myVer || document.hidden) return; verFetch().then(v => { if (v && v !== myVer) $('bUpdate').classList.remove('hide'); }); }, 150000);
  function doUpdate() {
    if (TT.Battle.active) { TT.toast('Finish this battle first, then tap update.'); return; }
    if (S) { save(); cloudPush(); try { sessionStorage.setItem('tt_resume', JSON.stringify({ ch: S.ch, slot, name: pname })); } catch (e) { } }
    $('bUpdate').textContent = 'Updating…'; setTimeout(() => location.reload(), 350);
  }

  // ---------- pause ----------
  function setPause(on) {
    if (on && (mode !== 'play' || TT.paused)) return;
    TT.paused = on; stopInput(); input.keys = {};
    $('pause').classList.toggle('hide', !on); TT.audioPause(on);
    if (on) save(); else { last = performance.now(); TT.audioInit(); }
  }

  // ---------- menu, main-menu return ----------
  // choose which four of a Pokémon's moves it takes into battle
  function showMoves(i) {
    const m = S.party[i], known = TT.known(m), cur = TT.moves(m).map(v => v[0]);
    let h = '<h3>' + TT.monName(m) + "'s moves <button id=\"pClose\">✕</button></h3><p style=\"font-size:14px;opacity:.75;margin:0 0 8px\">Pick up to 4 to use in battle. ✦ moves are tricks, not attacks.</p>";
    known.forEach((v, k) => { const on = cur.indexOf(v[0]) >= 0; h += '<button class="opt" data-k="' + k + '" style="' + (on ? 'background:#e9f8e4' : 'opacity:.8') + '">' + (on ? '✅ ' : '⬜ ') + (v[4] ? '✦ ' : '') + '<b>' + v[0] + '</b> <span class="tag" style="background:' + hex(TT.TYPE_COL[v[1]] || 0xa8a890) + '">' + v[1] + '</span> <span style="font-weight:600;font-size:14px">' + (v[4] ? TT.MOVE_FX[v[4]] : 'power ' + v[2]) + '</span></button>'; });
    h += '<button class="opt" id="mvBack">◀ Back to my team</button>';
    openPanel(h);
    $('panelIn').querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const v = known[+b.dataset.k], use = TT.moves(m).map(x => x[0]), at = use.indexOf(v[0]);
      if (at >= 0) { if (use.length <= 1) { TT.toast('Keep at least one move!'); return; } use.splice(at, 1); }
      else { if (use.length >= 4) { TT.toast('That is 4 already. Tap one with a ✅ to take it off first.'); return; } use.push(v[0]); }
      m.use = use; save(); TT.sfx.pick(); showMoves(i);
    });
    $('mvBack').onclick = showTeam;
  }
  function showMenu() {
    const lab = () => { $('mSound').textContent = (TT.muted ? '🔇' : '🔊') + ' Sound & music: ' + (TT.muted ? 'Off' : 'On'); $('mVoice').textContent = '🗣 Voices: ' + (TT.voiceOn ? 'On' : 'Off'); $('mMini').textContent = '🗺 Mini-map: ' + (miniOn ? 'On' : 'Off'); $('mEasy').textContent = '🛟 Easy mode: ' + (S.easy ? 'On — stronger hits, gentler bosses, free healing' : 'Off'); $('mCam').textContent = '🎥 Camera: ' + (S.camFar ? 'Far (see more)' : 'Close (bigger characters)'); };
    openPanel('<h3>Menu <button id="pClose">✕</button></h3><button class="opt" id="mResume">▶ Keep playing</button><button class="opt" id="mSound"></button><button class="opt" id="mVoice"></button><button class="opt" id="mMini"></button><button class="opt" id="mEasy"></button><button class="opt" id="mCam"></button><button class="opt" id="mHelp">🧰 Grown-up help (radar, healing, unstick)</button><button class="opt red" id="mTitle">🏠 Main menu</button><p style="font-size:13px;opacity:.7;margin:4px 0 0;text-align:center">Your game saves by itself.</p>');
    lab();
    $('mResume').onclick = closePanel;
    $('mSound').onclick = () => { TT.setMuted(!TT.muted); lab(); };
    $('mVoice').onclick = () => { TT.setVoice(!TT.voiceOn); lab(); if (TT.voiceOn) TT.cry(S.party[0].sp); };
    $('mMini').onclick = () => { setMini(!miniOn); lab(); };
    $('mEasy').onclick = () => { S.easy = S.easy ? 0 : 1; if (S.easy) S.party.forEach(m => m.hp = TT.maxHp(m)); save(); lab(); TT.sfx.pick(); };
    $('mCam').onclick = () => { S.camFar = S.camFar ? 0 : 1; save(); lab(); TT.sfx.blip(); };
    $('mHelp').onclick = showHelp;
    $('mTitle').onclick = toTitle;
  }
  function toTitle() {
    save(); closePanel(); stopInput(); TT.hush(); setDest(null);
    scene.remove(player.root); TT.dispose(player.root); if (follower) { scene.remove(follower.root); TT.dispose(follower.root); } follower = null; eggObj.visible = false; player.root = null;
    for (const b of ballObjs) scene.remove(b.o); ballObjs = [];
    S = null; TT.S = null; mode = 'title';
    for (const id of ['hud', 'joy', 'act', 'mini', 'miniBtn', 'bPause']) $(id).classList.add('hide');
    $('friends').innerHTML = ''; friendsDirty = true; cloudPush(); if (kidsList.length) buildProfiles(); buildShow();
    for (const c of comps) { scene.remove(c.root); TT.dispose(c.root); } comps = [];
    $('title').classList.remove('hide'); TT.music('title');
  }

  // ---------- maps ----------
  const css = n => '#' + n.toString(16).padStart(6, '0');
  const AREAS = { town: { cx: 0, cz: 0, V: 62, span: 160, name: 'Trainer Town' }, city: { cx: 0, cz: -124, V: 60, span: 160, name: 'The City' }, world: { cx: 161, cz: -100, V: 92, span: 200, name: 'The Wide World' }, volcano: { cx: 380, cz: -100, V: 60, span: 150, name: 'The Volcano' } };
  for (const k in AREAS) AREAS[k].ms = 512 / AREAS[k].span;
  const areaAt = (x, z) => AREAS[areaKey(x, z)];
  // one 512px picture per area, covering span x span units around the area's centre
  function baseMap(a) {
    a = a || AREAS.town; if (a.base) return a.base;
    const MS = a.ms, hs = a.span / 2, c = a.base = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), X = v => (v - a.cx + hs) * MS, Z = v => (v - a.cz + hs) * MS;
    const roof = (cx, cz, w, d, col) => { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(X(cx - w / 2) - 2, Z(cz - d / 2) - 2, w * MS + 2, d * MS + 2); x.fillStyle = col; x.fillRect(X(cx - w / 2), Z(cz - d / 2), w * MS, d * MS); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(X(cx - w / 2), Z(cz) - 1, w * MS, 2); };
    x.fillStyle = '#74c456'; x.fillRect(0, 0, 512, 512);
    if (a === AREAS.town) {
      x.drawImage(W.groundCanvas, 0, 0, 512, 512);
      x.fillStyle = '#3fa6ea'; x.beginPath(); x.arc(X(W.POND.x), Z(W.POND.z), W.POND.r * MS, 0, 7); x.fill(); x.strokeStyle = '#cdeeff'; x.lineWidth = 2; x.stroke();
    } else if (a === AREAS.city) x.drawImage(W.cityCanvas, X(-56), Z(-180), 112 * MS, 112 * MS);
    else if (a === AREAS.volcano) {
      x.fillStyle = '#4a3a36'; x.fillRect(0, 0, 512, 512); x.drawImage(W.volcCanvas, X(305), Z(-175), 150 * MS, 150 * MS);
      x.strokeStyle = '#ff8a2a'; x.lineWidth = 7 * MS; x.beginPath(); for (let z = -175; z <= -25; z += 2) { const px = X(W.lavaX(z)), pz = Z(z); if (z === -175) x.moveTo(px, pz); else x.lineTo(px, pz); } x.stroke();
      x.strokeStyle = '#ffd23c'; x.lineWidth = 2.5 * MS; x.beginPath(); for (let z = -175; z <= -25; z += 2) { const px = X(W.lavaX(z)), pz = Z(z); if (z === -175) x.moveTo(px, pz); else x.lineTo(px, pz); } x.stroke();
      x.fillStyle = '#8a7a70'; x.fillRect(X(W.lavaX(-100) - 6.2), Z(-102.1), 12.4 * MS, 4.2 * MS);
      x.fillStyle = '#8a82a0'; x.beginPath(); x.arc(X(W.ALTAR.x), Z(W.ALTAR.z), W.ALTAR.r * MS, 0, 7); x.fill(); x.fillStyle = '#f2c230'; x.beginPath(); x.arc(X(W.ALTAR.x), Z(W.ALTAR.z), 2 * MS, 0, 7); x.fill();
    } else {
      const m = W.worldMap; x.drawImage(W.worldCanvas, X(m.x0), Z(m.z0), m.w * MS, m.d * MS);
      x.strokeStyle = '#3fa6ea'; x.lineWidth = 8.4 * MS; x.lineCap = 'butt'; x.beginPath(); for (let z = m.z0; z <= m.z0 + m.d; z += 2) { const px = X(W.riverX(z)), pz = Z(z); if (z === m.z0) x.moveTo(px, pz); else x.lineTo(px, pz); } x.stroke();
      for (const bz of W.BRIDGES) { x.fillStyle = '#a87646'; x.fillRect(X(W.riverX(bz) - 6.5), Z(bz - 2.2), 13 * MS, 4.4 * MS); }
    }
    for (const t of W.trees) { const tx = X(t[0]), tz = Z(t[1]); if (tx < -5 || tz < -5 || tx > 517 || tz > 517) continue; x.fillStyle = t[3] === 'pine' ? '#2f8048' : t[3] === 'blossom' ? '#f7a8c8' : '#4aa64e'; x.beginPath(); x.arc(tx, tz, 1.5 * t[2] * MS, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(tx - 1, tz - 1, 0.7 * t[2] * MS, 0, 7); x.fill(); }
    if (a === AREAS.town) {
      for (const h of W.HOUSES) roof(h[0], h[1], h[2] + 1, h[3] + 1, css(h[5]));
      roof(-18, -10, 11, 9, '#e2382e'); x.fillStyle = '#fff'; x.beginPath(); x.arc(X(-18), Z(-10), 7, 0, 7); x.fill();
      roof(0, -31, 16, 10, '#5a7ab8'); x.fillStyle = '#8ab8e8'; x.beginPath(); x.arc(X(-3.5), Z(-31.5), 8, 0, 7); x.fill();
      x.fillStyle = '#e2e2ea'; x.beginPath(); x.arc(X(0), Z(0), 2.7 * MS, 0, 7); x.fill(); x.fillStyle = '#6ac8f8'; x.beginPath(); x.arc(X(0), Z(0), 1.9 * MS, 0, 7); x.fill();
      x.fillStyle = '#ff7a1a'; x.beginPath(); x.arc(X(W.FIRE.x), Z(W.FIRE.z), 3.5, 0, 7); x.fill();
      x.strokeStyle = '#d8b070'; x.lineWidth = 2; x.strokeRect(X(-57.4), Z(-57.4), 114.8 * MS, 114.8 * MS);
    } else if (a === AREAS.city) {
      for (const b of W.buildings) roof(b[0], b[1], b[2], b[3], b[6].shop ? css(b[6].shop) : css(b[5]));
      roof(0, -171, 20, 10, '#f08030'); x.fillStyle = '#8a5a3a'; x.fillRect(X(-1.2), Z(-125.2), 2.4 * MS, 2.4 * MS);
    } else if (a === AREAS.volcano) { x.strokeStyle = '#2a2026'; x.lineWidth = 2; x.strokeRect(X(326), Z(-154), 108 * MS, 108 * MS); }
    else {
      roof(204, -170, 13, 11, '#9aa0ac'); x.fillStyle = '#e01818'; x.font = 'bold ' + (9 * MS) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('R', X(204), Z(-170));
      roof(86, -112, 8.8, 7, '#3a8a4a');
      x.strokeStyle = '#8a7a6a'; x.lineWidth = 3 * MS; x.beginPath(); x.arc(X(W.PLATEAU.x), Z(W.PLATEAU.z), W.PLATEAU.r * MS, Math.PI + 0.3, Math.PI + 6.283 - 0.3); x.stroke();
    }
    return c;
  }
  function setMini(on) { miniOn = on; try { localStorage.setItem('tt_mini', on ? '1' : '0'); } catch (e) { } const p = mode === 'play'; $('mini').classList.toggle('hide', !(on && p)); $('miniBtn').classList.toggle('hide', !(!on && p)); }
  function setDest(d) {
    dest = d;
    if (!beacon) { beacon = new THREE.Group(); P(beacon, 'cyl', new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0.35, depthWrite: false }), [0, 4, 0], [0.5, 8, 0.5]); P(beacon, 'cone', TT.glow(0xffb020), [0, 3.2, 0], [0.5, 1, 0.5], [Math.PI, 0, 0]); P(beacon, 'cyl', new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0.5, depthWrite: false }), [0, 0.06, 0], [1.3, 0.04, 1.3]); scene.add(beacon); }
    beacon.visible = !!d; if (d) beacon.position.set(d.x, W.gy(d.x, d.z), d.z);
  }
  function drawMini() {
    const c = $('mini'), x = c.getContext('2d'), R = 28, k = 264 / (R * 2), X = v => (v - player.x + R) * k, Z = v => (v - player.z + R) * k, a = areaAt(player.x, player.z), MS = a.ms, hs = a.span / 2;
    x.fillStyle = '#74c456'; x.fillRect(0, 0, 264, 264);
    x.drawImage(baseMap(a), (player.x - R - a.cx + hs) * MS, (player.z - R - a.cz + hs) * MS, R * 2 * MS, R * 2 * MS, 0, 0, 264, 264);
    const dot = (px, pz, col, r) => { x.fillStyle = col; x.strokeStyle = '#23324a'; x.lineWidth = 2; x.beginPath(); x.arc(X(px), Z(pz), r, 0, 7); x.fill(); x.stroke(); };
    for (const w of wilds) dot(w.x, w.z, '#ff5a4a', 5);
    for (const n of npcs) if (!n.hidden) dot(n.x, n.z, n.human ? '#ffd23c' : '#ffa0c0', 5);
    for (const w of wilds) if (w.spark) dot(w.x, w.z, '#fff27a', 6);
    for (const id in Net.peers) { const p = Net.peers[id]; if (p.root) dot(p.x, p.z, '#3aa0e8', 8); }
    if (radarOn()) for (const b of radarSpots()) { if (b.x == null) continue; const bx = TT.clamp(X(b.x), 10, 254), bz = TT.clamp(Z(b.z), 10, 254), far = bx !== X(b.x) || bz !== Z(b.z); if (areaKey(b.x, b.z) !== areaKey(player.x, player.z)) continue; x.fillStyle = far ? 'rgba(255,154,31,.75)' : '#ff9a1f'; x.strokeStyle = '#23324a'; x.lineWidth = 2; x.beginPath(); x.arc(bx, bz, far ? 6 : 9, 0, 7); x.fill(); x.stroke(); }
    if (dest) { const dx = TT.clamp(X(dest.x), 14, 250), dz = TT.clamp(Z(dest.z), 14, 250); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 3; x.setLineDash([8, 6]); x.beginPath(); x.moveTo(132, 132); x.lineTo(dx, dz); x.stroke(); x.setLineDash([]); x.font = '26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('📍', dx, dz - 8); }
    x.save(); x.translate(132, 132); x.rotate(Math.PI - player.h); x.fillStyle = '#fff'; x.strokeStyle = '#23324a'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -15); x.lineTo(11, 11); x.lineTo(0, 5); x.lineTo(-11, 11); x.closePath(); x.fill(); x.stroke(); x.restore();
  }
  function showAreaMap(key) {
    const a = AREAS[key], places = key === 'city' ? W.CITY_PLACES : key === 'world' ? W.WORLD_PLACES : key === 'volcano' ? W.VOLC_PLACES : W.PLACES, V = a.V, MS = a.ms, hs = a.span / 2;
    const size = Math.max(240, Math.min(window.innerWidth * 0.86, window.innerHeight * 0.58, 560)) | 0;
    openPanel('<h3>' + a.name + ' <button id="pClose">✕</button></h3><canvas id="townMap" width="' + size * 2 + '" height="' + size * 2 + '" style="width:' + size + 'px;height:' + size + 'px"></canvas><div id="mapInfo">Tap a place to learn about it.</div><div class="row"><button id="mGo" disabled>📍 Guide me there</button><button id="mClear" class="alt">Stop guiding</button><button id="mBack" class="alt">World map</button></div>' + todoList(key));
    const c = $('townMap'), x = c.getContext('2d'), k = size * 2 / (V * 2), X = v => (v - a.cx + V) * k, Z = v => (v - a.cz + V) * k, here = areaAt(player.x, player.z) === a; let sel = null, tick = 0;
    const draw = () => {
      if (!c.isConnected || !S) return clearInterval(iv);
      tick++; x.drawImage(baseMap(a), (hs - V) * MS, (hs - V) * MS, V * 2 * MS, V * 2 * MS, 0, 0, size * 2, size * 2);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const p of places) {
        const on = sel && sel.p === p; x.font = (on ? 46 : 36) * size / 500 + 'px sans-serif'; x.fillText(p[3], X(p[1]), Z(p[2]));
        x.font = '800 ' + (22 * size / 500) + 'px "Avenir Next","Trebuchet MS",sans-serif'; x.lineWidth = 5; x.strokeStyle = on ? '#ffd23c' : 'rgba(255,255,255,.92)'; x.fillStyle = '#23324a'; x.strokeText(p[0], X(p[1]), Z(p[2]) + 30 * size / 500); x.fillText(p[0], X(p[1]), Z(p[2]) + 30 * size / 500);
      }
      const dot = (px, pz, col, r) => { x.fillStyle = col; x.strokeStyle = '#23324a'; x.lineWidth = 3; x.beginPath(); x.arc(X(px), Z(pz), r, 0, 7); x.fill(); x.stroke(); };
      for (const n of npcs) if (n.human && !n.hidden) dot(n.x, n.z, '#ffd23c', 6);
      if (radarOn()) for (const b of radarSpots()) { if (b.x == null || areaKey(b.x, b.z) !== key) continue; dot(b.x, b.z, '#ff9a1f', 11); x.font = 26 * size / 500 + 'px sans-serif'; x.fillStyle = '#c22'; x.fillText('★', X(b.x), Z(b.z) + 1); }
      for (const id in Net.peers) { const p = Net.peers[id]; if (p.root) dot(p.x, p.z, '#3aa0e8', 10); }
      const d = sel || (dest && { x: dest.x, z: dest.z }); if (d) { x.font = 44 * size / 500 + 'px sans-serif'; x.fillText('📍', X(d.x), Z(d.z) - 16); }
      if (here) { const pulse = 10 + Math.sin(tick * 0.5) * 4; x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.arc(X(player.x), Z(player.z), pulse + 8, 0, 7); x.fill(); dot(player.x, player.z, '#e8402a', 9); }
    };
    const iv = setInterval(draw, 120); draw();
    c.addEventListener('pointerdown', e => {
      e.preventDefault(); const r = c.getBoundingClientRect(), wx = (e.clientX - r.left) / r.width * V * 2 - V + a.cx, wz = (e.clientY - r.top) / r.height * V * 2 - V + a.cz;
      let best = null, bd = key === 'world' ? 12 : 9; for (const p of places) { const d = Math.hypot(p[1] - wx, p[2] - wz); if (d < bd) { bd = d; best = p; } }
      if (best) { sel = { p: best, x: best[5], z: best[6], n: best[0] }; $('mapInfo').innerHTML = '<b>' + best[3] + ' ' + best[0] + '</b><br>' + best[4]; }
      else { const q = W.collide(wx, wz, 0.6); sel = { x: q[0], z: q[1], n: 'that spot' }; $('mapInfo').innerHTML = '<b>📍 This spot</b><br>Tap "Guide me there" to get an arrow to it.'; }
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
    // tap the goal line: a guide arrow on the mini-map leads to the next thing to do
    $('chipStar').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); TT.audioInit(); if (!S || busy || mode !== 'play' || TT.Battle.active || panelOpen) return; TT.sfx.blip(); showRadar(); });      // the Dragon Ball counter opens the radar
    $('quest').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); TT.audioInit(); if (!S || busy || mode !== 'play') return; if (!goal) { TT.toast('Keep exploring!'); return; } setMini(true); setDest(goal); TT.sfx.pick(); TT.toast('📍 Follow the arrow to ' + goal.n + '!'); });
    $('bUpdate').onclick = doUpdate;
    $('bPause').onclick = () => setPause(true); $('bResume').onclick = () => setPause(false);
    $('pause').addEventListener('pointerdown', e => { if (e.target === $('pause')) setPause(false); });
    $('mini').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); setMini(false); });
    $('miniBtn').onclick = () => setMini(true);
    $('panel').addEventListener('pointerdown', e => { if (e.target === $('panel')) closePanel(); });
    window.addEventListener('keydown', e => {
      input.keys[e.code] = 1;
      if (TT.paused && e.code !== 'KeyP') { if (e.code === 'Space' || e.code === 'Enter') setPause(false); return; }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); TT.audioInit(); interact(); }
      if (e.code === 'Escape' && panelOpen) closePanel();
      if (e.code === 'KeyP') setPause(!TT.paused);
    });
    window.addEventListener('keyup', e => { input.keys[e.code] = 0; });
    window.addEventListener('blur', () => { input.keys = {}; stopInput(); });
    document.addEventListener('contextmenu', e => e.preventDefault());
  }
  function interact() {
    if (TT.dialogOpen) { TT.dialogNext(); return; }
    if (mode !== 'play' || busy || panelOpen) return;
    const n = nearestNpc(), w = nearestWild();
    if (w && (!n || dist(w, player) < dist(n, player))) wildBattle(w); else if (n) talk(n);
  }

  // ---------- friends: jump to them, join their battle, Dad's cheer + gifts ----------
  let friendsDirty = true, giftAt = -99;
  function drawFriends() {
    const box = $('friends'); box.innerHTML = '';
    for (const id in Net.peers) {
      const p = Net.peers[id]; if (!p.root || !p.d) continue;
      const nm = p.nm || NAMES[p.d.c] || 'Friend', b = document.createElement('button');
      if (p.b === 1) { b.className = 'fight'; b.textContent = '⚔ Join ' + nm + "'s battle!"; b.onclick = () => joinBattle(id, nm); }
      else { b.textContent = '➜ Go to ' + nm; b.onclick = () => jumpTo(id, nm); }
      box.appendChild(b);
    }
    if (S.ch === 'dad') {
      if (box.children.length) {
        const c = document.createElement('button'); c.className = 'dadb'; c.textContent = '📣 Cheer'; c.onclick = cheer; box.appendChild(c);
        const g = document.createElement('button'); g.className = 'dadb'; g.textContent = '🎁 Send Poké Balls'; g.onclick = gift; box.appendChild(g);
        const r = document.createElement('button'); r.className = 'dadb'; r.textContent = '📡 Lend Dragon Radar'; r.onclick = () => { Net.send({ e: 'gift', k: 'radar', m: 15 }); TT.sfx.pick(); TT.toast('📡 You lent the Dragon Radar to everyone for 15 minutes'); }; box.appendChild(r);
        const hl = document.createElement('button'); hl.className = 'dadb'; hl.textContent = '💖 Heal their teams'; hl.onclick = () => { if (playT - healAt < 30) { TT.toast('The medicine bag refills in a moment…'); return; } healAt = playT; Net.send({ e: 'gift', k: 'heal' }); TT.sfx.heal(); TT.toast("💖 You healed everyone's team"); }; box.appendChild(hl);
      }
      const mr = document.createElement('button'); mr.className = 'dadb'; mr.textContent = '📡 My Dragon Radar'; mr.onclick = () => { if (!busy) showRadar(); }; box.appendChild(mr);
      const k = document.createElement('button'); k.className = 'dadb'; k.textContent = "📊 Kids' progress"; k.onclick = () => { if (!busy) showFamily(); }; box.appendChild(k);
    }
  }
  function poof(x, z) { const ps = [], y0 = W.gy(x, z); for (let i = 0; i < 8; i++) ps.push(P(scene, 'sphS', TT.glow(i % 2 ? 0xffffff : 0xbfe8ff), [x, 1 + y0, z], 0.18)); TT.tween(0.45, k => ps.forEach((m, i) => { const a = i * 0.785; m.position.set(x + Math.cos(a) * k * 1.6, y0 + 1 + Math.sin(a * 2) * k, z + Math.sin(a) * k * 1.6); m.scale.setScalar(0.2 * (1 - k)); })).then(() => ps.forEach(m => scene.remove(m))); }
  function jumpTo(id, nm) {
    const p = Net.peers[id]; if (!p || !p.root || busy || panelOpen || mode !== 'play') return;
    poof(player.x, player.z); const q = W.collide(p.x + 1.3, p.z + 0.6, 0.4);
    player.x = cam.x = q[0]; player.z = cam.z = q[1]; follower.x = player.x + 0.9; follower.z = player.z + 0.7; poof(player.x, player.z);
    TT.sfx.star(); TT.toast('Whoosh! You jumped to ' + nm + '!');
  }
  async function joinBattle(id, nm) {
    if (busy || panelOpen || mode !== 'play') return;
    if (!S.party.some(m => m.hp > 0)) { TT.toast('Your Pokémon are tired! Visit Nurse Joy first.'); return; }
    busy = true; stopInput();
    await TT.Battle.watch(id, nm, () => { const p = Net.peers[id]; return !!(p && !p.gone && p.d && p.d.b); });
    battleCd = 2.5; hud(); save(); busy = false;
  }
  function cheer() { const m = TT.pick(['Great job!', 'You can do it!', 'Awesome!', "That's my trainer!", 'Go go go!']); Net.send({ e: 'cheer', x: m }); TT.sfx.star(); TT.toast('📣 You cheered: ' + m); const u = player.root.userData.model.userData; u.gesture = 'cheer'; setTimeout(() => { u.gesture = null; }, 1800); }
  let healAt = -99;
  function gift() { if (playT - giftAt < 45) { TT.toast('The gift bag refills in a moment…'); return; } giftAt = playT; Net.send({ e: 'gift', n: 5 }); TT.sfx.pick(); TT.toast('🎁 You sent 5 Poké Balls to everyone!'); }
  Net.onEvent = (id, d) => {
    if (d.e === 'b') return TT.Battle.onNet(id, d);
    if (!S) return;
    if (d.e === 'prog') { famSet(d.d, true); return; }
    if (d.e === 'cheer') { TT.sfx.star(); TT.toast('📣 Dad: ' + String(d.x).slice(0, 40)); const p = Net.peers[id]; if (p && p.root) { const u = p.root.userData.model.userData; u.gesture = 'cheer'; setTimeout(() => { u.gesture = null; }, 1800); } }
    else if (d.e === 'gift' && S.ch !== 'dad') {
      if (d.k === 'radar') lendRadar(TT.clamp(d.m | 0, 5, 30), 'Dad'); else if (d.k === 'heal') healTeam('Dad');
      else { S.balls += Math.min(5, d.n | 0); TT.sfx.caught(); TT.toast('🎁 Dad sent you 5 Poké Balls!'); hud(); save(); }
    }
  };

  // ---------- multiplayer avatars ----------
  function updatePeers(dt) {
    for (const id in Net.peers) {
      const p = Net.peers[id], d = p.d;
      if (p.gone || !d || performance.now() - p.last > 8000) { if (p.root) { scene.remove(p.root); TT.dispose(p.root); if (p.fol) { scene.remove(p.fol.root); TT.dispose(p.fol.root); } } delete Net.peers[id]; friendsDirty = true; continue; }
      if (!p.root || p.ch !== d.c) {
        if (p.root) { scene.remove(p.root); TT.dispose(p.root); }
        p.ch = d.c; p.root = wrap(TT.human(TT.PEOPLE[d.c] || TT.PEOPLE.kid), 0.42); p.x = d.x; p.z = d.z; p.h = d.h;
        p.b = -1; p.lab = null; friendsDirty = true;
      }
      if (!p.fol || p.sp !== d.p) { if (p.fol) { scene.remove(p.fol.root); TT.dispose(p.fol.root); } p.sp = d.p; p.fol = { x: d.x + 1, z: d.z + 1, h: 0, mv: 0, root: wrap(TT.creature(d.p), 0.35) }; }
      if (p.b !== (d.b ? 1 : 0)) { p.b = d.b ? 1 : 0; friendsDirty = true; if (p.lab) p.root.remove(p.lab); p.nm = String(d.n || NAMES[d.c] || 'Friend').replace(/[<>&]/g, '').slice(0, 14); p.lab = TT.label(p.nm + (p.b ? ' ⚔' : ''), p.b ? 'rgba(232,64,42,.95)' : 'rgba(58,160,232,.9)'); p.lab.position.y = 2.2; p.root.add(p.lab); }
      const k = Math.min(1, dt * 10); p.x += (d.x - p.x) * k; p.z += (d.z - p.z) * k; p.h = TT.angLerp(p.h, d.h, k); p.mv = d.m;
      placeEnt(p, true); follow(p.fol, p.x, p.z, dt, 1.5); placeEnt(p.fol, false);
    }
    const c = Net.count(); if (c !== netShown) { netShown = c; $('chipNet').classList.toggle('hide', !c); if (c) $('netTxt').textContent = '👫 ' + (c + 1); }
    if (friendsDirty && S) { friendsDirty = false; drawFriends(); }
  }

  // ---------- main update ----------
  function update(dt) {
    W.update(t, camera, mode === 'play' && !TT.Battle.active ? player.x : null, player.z);
    W.showAreas(player.x, player.z, TT.Battle.active, mode !== 'play');
    TT.uTime.value = t;
    { const fx = Math.round(TT.Battle.active ? W.ARENA.x : mode === 'play' ? cam.x : 0), fz = Math.round(TT.Battle.active ? W.ARENA.z : mode === 'play' ? cam.z : 0); sun.position.set(fx + 18, 38, fz + 24); sun.target.position.set(fx, 0, fz); sun.target.updateMatrixWorld(); }
    for (const a of actors) { if (a.userData.human) TT.animHuman(a, t, 0); else TT.animCreature(a, t, 0); }
    for (const d of dust) if (d.visible) { d.userData.k += dt * 2.2; const k = d.userData.k; if (k >= 1) d.visible = false; else { d.scale.setScalar(0.12 + k * 0.4); d.position.y = (d.userData.y0 || 0) + 0.1 + k * 0.5; d.material.opacity = 0.5 * (1 - k); } }
    if (inB !== TT.Battle.active) { inB = TT.Battle.active; document.body.classList.toggle('inbattle', inB); }
    for (const n of npcs) {
      if (n.hidden) { n.root.visible = n.root.matrixWorldAutoUpdate = false; if (n.zz) n.zz.forEach(z => { z.visible = false; }); continue; }
      if (n.zz) n.zz.forEach((z, i) => { const k = (t * 0.35 + i / 3) % 1; z.visible = n.root.visible; z.position.set(n.x + 0.6 + k * 1.2, W.gy(n.x, n.z) + 3.1 + k * 1.8, n.z + 0.3); z.material.opacity = Math.sin(k * 3.14); z.scale.set(1.2 * (0.5 + k), 0.3 * (0.5 + k), 1); });
      if (!(busy && dist(n, player) < 3)) { if (n.r > 0) wander(n, dt, n.human ? 1.1 : 1.4, e => { const a = Math.random() * 6.283, r = Math.random() * e.r; e.tx = e.hx + Math.cos(a) * r; e.tz = e.hz + Math.sin(a) * r; }); }
      else n.mv = 0;
      placeEnt(n, n.human);
      if (n.lab) n.lab.visible = dist(n, player) < 9;
    }
    for (const w of wilds) { wander(w, dt, 1.3, e => { const p = zonePoint(e.zone); e.tx = p[0]; e.tz = p[1]; }); placeEnt(w, false); if (w.spark) { w.spark.rotation.y = t * 3; w.spark.position.y = 0.5 + Math.sin(t * 4) * 0.15; } }
    updatePeers(dt);
    if (TT.Battle.active) { TT.Battle.update(dt, t); TT.Battle.camera(camera, camera.aspect, t); W.updateMotes(t, W.ARENA.x, W.ARENA.z - 4, 0); }
    else W.updateMotes(t, cam.x, cam.z - 3, camY);
    if (show) { const on = mode !== 'play' && !TT.Battle.active; if (show.g.visible !== on) show.g.visible = show.g.matrixWorldAutoUpdate = on; }
    if (mode !== 'play') { if (show) updateShow(dt); W.updateMotes(t, 0, SHOW_Z, 0); return; }

    const idle = !busy && !panelOpen && !TT.dialogOpen;
    if (idle) {
      playT += dt; battleCd -= dt;
      const k = input.keys;
      let vx = input.x + (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), vz = input.y + (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
      let mag = Math.hypot(vx, vz);
      if (mag > 1) { vx /= mag; vz /= mag; mag = 1; }
      runT = mag > 0.9 ? runT + dt : 0;                          // push the stick all the way for a moment to run
      const on = mag > 0.18, top = runT > 0.7 ? 8.8 : 6.4, ka = Math.min(1, dt * (on ? 8 : 12));
      vel.x += ((on ? vx * top : 0) - vel.x) * ka; vel.z += ((on ? vz * top : 0) - vel.z) * ka;
      const spd = Math.hypot(vel.x, vel.z);
      if (spd > 0.08) {
        const p = W.collide(player.x + vel.x * dt, player.z + vel.z * dt, 0.4);
        if (dt > 0) { vel.x = (p[0] - player.x) / dt * 0.6 + vel.x * 0.4; vel.z = (p[1] - player.z) / dt * 0.6 + vel.z * 0.4; }
        player.x = p[0]; player.z = p[1];
        const want = on ? Math.atan2(vx, vz) : player.h, nh = TT.angLerp(player.h, want, Math.min(1, dt * 12)); let dh = nh - player.h; while (dh > Math.PI) dh -= 6.283; while (dh < -Math.PI) dh += 6.283;
        lean += (TT.clamp(-dh / Math.max(dt, 0.001) * 0.05, -0.28, 0.28) * Math.min(1, spd / 6) - lean) * Math.min(1, dt * 8); player.h = nh;
        player.mv = Math.min(1.4, spd / 6.4);
        if (mag > 0.6 && (dustT += dt) > (runT > 0.7 ? 0.09 : 0.16)) { dustT = 0; let d = dust.find(q => !q.visible); if (!d && dust.length < 8) { d = P(scene, 'sphS', new THREE.MeshBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.5, depthWrite: false }), [0, 0, 0], 0.1); dust.push(d); } if (d) { d.visible = true; d.userData.k = 0; d.position.set(player.x - vx * 0.3 + rand(-0.15, 0.15), 0.1, player.z - vz * 0.3 + rand(-0.15, 0.15)); d.userData.y0 = W.gy(player.x, player.z); } }
      } else { player.mv = 0; lean *= 0.85; }
      player.root.userData.model.rotation.z = lean; player.root.userData.model.rotation.x = Math.min(0.12, spd * 0.012);

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
        { const wv = Math.round(Math.min(100, S.egg.warm)); if (wv !== eggShown) { eggShown = wv; $('eggBar').style.width = wv + '%'; } }
        if (S.egg.warm >= 100) hatch();
      }
      // hidden dragon ball
      if (S.stars.indexOf(3) < 0 && !S.wishes && dist(W.STARSPOT, player) < 1.5) { busy = true; giveStar(3).then(() => { busy = false; }); }
      // wild encounters
      if (battleCd <= 0 && !busy) for (const w of wilds) if (Math.hypot(w.x - player.x, w.z - player.z) < 1.25) { wildBattle(w); break; }
      for (let i = respawns.length - 1; i >= 0; i--) if (respawns[i].at < playT) { spawnWild(respawns[i].z); respawns.splice(i, 1); }
      // the Volcano: tunnel mouths, the Dragon's altar, and Dragon Balls lying around after a wish
      tunnelCd -= dt; altarCd -= dt;
      if (!busy && tunnelCd <= 0) {
        if (Math.hypot(player.x - (W.TUNNEL.x + 0.4), player.z - W.TUNNEL.z) < (S.flags.tunnel ? 1.7 : 3.15)) tunnelIn();
        else if (dist(W.VOL_EXIT, player) < 1.6) travel(W.TUNNEL.x - 2.6, W.TUNNEL.z, -Math.PI / 2);
      }
      if (!busy && altarCd <= 0 && dist(W.ALTAR, player) < 3.3) altar();
      if (!busy) for (const b of ballObjs) if (Math.hypot(b.d.x - player.x, b.d.z - player.z) < 1.4) { busy = true; scene.remove(b.o); ballObjs.splice(ballObjs.indexOf(b), 1); S.scat.splice(S.scat.indexOf(b.d), 1); giveStar(b.d.n).then(async () => { if (!S.scat.length) await TT.say([['', "That's all seven! Take them back to the altar in the Dragon's Lair."]]); busy = false; hud(); save(); }); break; }
      if (!S.wishes && S.flags.vegeta && S.stars.indexOf(1) < 0 && nextRocket > playT + 25) nextRocket = playT + 25;
      if (!busy && playT > nextRocket) rocketEvent();
      if ((saveT += dt) > 20) { saveT = 0; save(); cloudPush(); }
    } else { player.mv = 0; vel.x = vel.z = 0; }

    starObj.visible = S.stars.indexOf(3) < 0 && !S.wishes; starObj.rotation.y = t * 1.5; starObj.position.y = 0.7 + Math.sin(t * 2) * 0.12;
    placeEnt(player, true); player.root.visible = true;
    if (!busy || !TT.Battle.active) {
      if (talkTo) { duoEnd(); follow(follower, player.x + (player.x >= talkTo.x ? 1.5 : -1.5), player.z - 0.9, dt, 0.25); }      // while talking, the partner steps to the far side so it never blocks the close-up
      else if (!duoTick(dt)) follow(follower, player.x, player.z, dt, 1.5);
      if (flying || !(busy && follower.root.position.y > 0.05 + W.gy(follower.x, follower.z))) placeEnt(follower, false);
      let ld = follower; for (const c of comps) { follow(c, ld.x, ld.z, dt, 1.8); placeEnt(c, true); ld = c; }
    }
    if (S.egg.have && !(busy && S.egg.warm >= 100)) { eggObj.visible = true; const ex = follower.x - Math.sin(follower.h) * 0.8, ez = follower.z - Math.cos(follower.h) * 0.8; eggObj.position.x += (ex - eggObj.position.x) * Math.min(1, dt * 6); eggObj.position.z += (ez - eggObj.position.z) * Math.min(1, dt * 6); eggObj.position.y = W.gy(eggObj.position.x, eggObj.position.z) + Math.abs(Math.sin(t * 5)) * 0.08 * follower.mv; }
    else if (!S.egg.have) eggObj.visible = false;

    if (miniOn && !TT.Battle.active && (miniT += dt) > 0.12) { miniT = 0; drawMini(); }
    if (dest) { beacon.rotation.y = t * 2; beacon.children[1].position.y = 3.2 + Math.sin(t * 4) * 0.4; beacon.position.y = W.gy(beacon.position.x, beacon.position.z); if (idle && Math.hypot(dest.x - player.x, dest.z - player.z) < 2.6) { TT.sfx.pick(); TT.toast('You made it to ' + dest.n + '!'); setDest(null); } }
    const nn = idle && nearestNpc(), nw = idle && nearestWild(), fight = nw && (!nn || dist(nw, player) < dist(nn, player)), near = nn || nw, act = $('act');
    { const lbl = fight ? '⚔ Battle' : nn ? 'Talk' : 'A', dim = !near && !TT.dialogOpen, key = lbl + (dim ? 1 : 0); if (key !== actKey) { actKey = key; act.textContent = lbl; act.classList.toggle('dim', dim); act.classList.toggle('fight', !!fight); } }   // touch the page only when something changed

    if (!TT.Battle.active) {
      const port = camera.aspect < 1, k = Math.min(1, dt * 5), spd = Math.hypot(vel.x, vel.z);
      stillT = spd > 0.3 ? 0 : stillT + dt;
      if (!busy && !TT.dialogOpen) talkTo = null;
      const tk = talkTo && !flying && TT.camZoom === 1 ? talkTo : null;
      let D, Pt, ty = 1, tx = player.x + vel.x * 0.3, tz = player.z + vel.z * 0.3, zm = (port ? 1.5 : 1) * TT.camZoom;
      if (tk) { D = 7.2; Pt = 0.47; tx = (player.x + tk.x) / 2; tz = (player.z + tk.z) / 2 + 0.8; ty = 1.05; if (port) zm = 1.75; }       // talking: move in and frame the two of them
      else if (S && S.camFar) { D = 17.7 * (1 + spd * 0.014); Pt = 0.705; }                                                             // the old high view, for anyone who prefers it
      else if (TT.dialogOpen && !flying && TT.camZoom === 1) { D = 10.5; Pt = 0.56; }                                                    // a story moment: lean in a little
      else {
        const m = CAM_AREA[areaNow] || CAM_AREA.town, run = TT.clamp((spd / 6.4 - 1) / 0.4, 0, 1), idle = TT.clamp((stillT - 2.5) / 2, 0, 1);
        const fast = quality >= 2 ? 1 : 0; D = CAMV.d[fast] + m[0] + run * 2.5 - idle * 1.5; Pt = CAMV.p[fast] + m[fast ? 1 : 2] + run * 0.05 - idle * 0.02;                                           // closer when standing, further and higher when running
        if (goal && goal.x != null) { const gx = goal.x - player.x, gz = goal.z - player.z, gd = Math.hypot(gx, gz); if (gd > 3 && gd < 26) { const w = Math.min(1, (gd - 3) / 5) * Math.min(1, (26 - gd) / 8) * 2.2; tx += gx / gd * w; tz += gz / gd * w; } }      // drift toward the goal when it is near
      }
      const ks = Math.min(1, dt * (tk ? 3.2 : 1.8));
      cam.x += (tx - cam.x) * k; cam.z += (tz - cam.z) * k; camD += (D * zm - camD) * ks; camP += (Pt - camP) * ks; camTy += (ty - camTy) * ks;
      camY += (W.gy(player.x, player.z) - camY) * Math.min(1, dt * 4);
      const ch = Math.sin(camP) * camD, cb = Math.cos(camP) * camD;
      camera.position.set(cam.x, camY + camTy + ch, cam.z - 1 + cb); camera.lookAt(cam.x, camY + camTy, cam.z - 1);
      // how much ground this view shows: only people and Pokémon inside it are drawn and animated
      { const h = ch + camTy, lo = Math.max(0.12, camP - 0.349), far = Math.min(62, h / Math.tan(lo)); viewZ = far - cb + 8; viewS = cb - h / Math.tan(camP + 0.349) + 5; viewX = Math.min(72, h / Math.sin(lo)) * 0.42 * camera.aspect + 5; }
      // area music and a little title card when you arrive somewhere new
      const ak = areaKey(player.x, player.z); if (ak !== areaNow) { if (areaNow) TT.toast({ town: '🏡 Trainer Town', city: '🏙️ The City', world: '🌍 The Wide World', volcano: '🌋 The Volcano' }[ak]); areaNow = ak; arrive(ak); }
      if (!busy && !TT.dialogOpen) { const m = TT.areaMusic(); if (TT.musicName() !== m) TT.music(m); }
      { const want = summoning ? 'summon' : ak === 'volcano' ? 'volcArea' : null; if (W.stageNow !== want) W.applyStage(want); }
      for (const b of ballObjs) { b.o.rotation.y = t * 1.6; b.o.position.y = W.gy(b.d.x, b.d.z) + 0.6 + Math.sin(t * 2.4 + b.d.n) * 0.12; }
    }
    if ((famT += dt) > 6 && S.ch !== 'dad' && Net.on) { famT = 0; S.ts = S.ts || Date.now(); Net.send({ e: 'prog', d: Object.assign(summary(S, pname), { ts: Date.now() }) }); }
    if ((netT += dt) > 0.1) { netT = 0; Net.send({ c: S.ch, x: +player.x.toFixed(2), z: +player.z.toFixed(2), h: +player.h.toFixed(2), m: player.mv > 0.1 ? 1 : 0, p: S.party[0].sp, b: TT.Battle.owning() ? 1 : 0, n: pname }); }
  }

  function setQuality(q) {
    quality = q; sun.castShadow = q >= 2; for (const b of blobs) b.visible = q < 2;
    renderer.setPixelRatio(q >= 2 ? Math.min(window.devicePixelRatio || 1, 1.5) : q === 1 ? 1 : 0.8); document.body.classList.toggle('grade', q >= 2); resize();
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    const now = performance.now(), rdt = now - lastReal; lastReal = now;
    // Automatic picture quality: watch the frame rate for a couple of seconds at a time; if this device cannot keep up,
    // step down (shadows first, then outlines and resolution) and remember that for next time.
    if (!qLock && mode === 'play' && !TT.paused && rdt < 400) {
      if (qSkip > 0) qSkip--;
      else { qN++; qT += rdt; if (qT > 2500) { const ms = qT / qN; qN = 0; qT = 0; const put = () => { try { localStorage.setItem('tt_q', JSON.stringify({ q: quality, t: Date.now(), up: qUpT })); } catch (e) { } };
        if (ms > 38 && quality > 0) { setQuality(quality - 1); qSkip = 30; qDown = true; qGood = 0; put(); }
        // running very smoothly on a lowered setting? Try one step nicer, at most once a day; if that is too slow it steps back down for good.
        else if (ms < 21 && quality < 2 && !qDown && !TT.Battle.active && Date.now() - qUpT > 20 * 3600e3) { if (++qGood >= 4) { qUpT = Date.now(); setQuality(quality + 1); qSkip = 30; qGood = 0; put(); } }
        else qGood = 0; } }
    } else if (rdt >= 400) { qSkip = 30; qN = 0; qT = 0; }
    G.tick(ts);
  }
  G.tick = function (ts) {
    let dt = (ts - last) / 1000; last = ts;
    if (!(dt > 0)) dt = 0.016; if (dt > 0.1) dt = 0.1;
    if (TT.paused) { renderer.render(scene, camera); return; }    // everything (battles too) freezes; the picture stays
    // on a slow frame the world still moves at full speed: take two half-steps instead of running in slow motion
    const n = dt > 0.05 ? 2 : 1; dt /= n;
    for (let i = 0; i < n; i++) {
      let d = dt; if (TT.hitStop > 0) { TT.hitStop -= d; d *= 0.06; }
      t += d; TT.updateTweens(d);
      try { update(d); } catch (e) { console.error(e); }
    }
    renderer.render(scene, camera);
  };
  TT.areaMusic = () => { if (mode !== 'play') return 'title'; const a = areaKey(player.x, player.z); return a === 'world' && Math.hypot(player.x - W.PLATEAU.x, player.z - W.PLATEAU.z) < 24 ? 'goku' : a; };
  G.areaProgress = k => areaProgress(k);
  // test hooks
  G.toTitle = toTitle; G.setPause = setPause;
  G.dbg = () => ({ CAMV, view: () => [viewX, viewZ, viewS, camD, camP], S, player, camera, renderer, quality, wilds, npcs, follower, mode, busy, playT, setRocket: v => { nextRocket = v; }, input, start: startGame, comps, applyFlags, vel });

  // The town takes a few seconds to build on a tablet. Let the title paint first, accept taps right away,
  // and start the chosen character the moment the world is ready.
  let ready = false, pending = window.__pick || null; window.__gameLoaded = true;
  document.querySelectorAll('.card').forEach(b => b.addEventListener('click', () => {
    TT.audioInit();
    if (ready) return b.dataset.ch === 'dad' ? startGame('dad') : pickHero(b.dataset.ch, () => startGame(b.dataset.ch));
    pending = b.dataset.ch; document.querySelectorAll('.card').forEach(c => c.classList.toggle('picked', c === b));
    $('loading').textContent = 'Getting ' + NAMES[pending] + ' ready…';
  }));
  requestAnimationFrame(() => setTimeout(async () => {
    try { await init(); } catch (e) { $('loading').textContent = 'Sorry, something went wrong: ' + e.message; const lt = $('ldText'); if (lt) lt.textContent = 'Sorry, something went wrong: ' + e.message; throw e; }
    ready = true; $('loading').classList.add('hide'); $('title').classList.remove('wait');
    setTimeout(() => { const L = $('loader'); if (L) { L.classList.add('done'); setTimeout(() => L.remove(), 700); } }, 250);
    let rs = null; try { rs = JSON.parse(sessionStorage.getItem('tt_resume')); sessionStorage.removeItem('tt_resume'); } catch (e) { }
    if (rs && rs.ch) startGame(rs.ch, rs.slot, rs.name);      // coming back from a one-tap update
    else if (pending && !(kidsList.length && pending !== 'dad')) startGame(pending);
  }, 40));
})();
