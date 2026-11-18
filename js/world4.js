// world4.js — the Sky Pass: a valley of snowy peaks that you fly through on a Pokémon's back.
// It sits far away from every other place (with the battle stages), so while you fly nothing else is drawn.
(function () {
  const TT = window.TT, P = TT.P, W = TT.World;
  const { grp, chunk } = W.H;
  // a fixed sequence of "random" numbers, so the pass is the same every time and on every device
  let seed = 11; const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (b - a) * (seed / 2147483647); };
  // you fly north, from z0 to z1; cx(z) is the middle of the valley, half is how far you may stray to either side; lo and hi are the lowest and highest you can fly
  const S = W.SKY = { z0: 1480, z1: 1100, cx: z => 700 + Math.sin((z - 1100) * 0.021) * 15, half: 12.5, lo: 5.5, hi: 17.5, peaks: [], rings: [] };
  const FLOOR = -9;
  const peak = (x, z, r, h, obst) => { const g = grp(chunk(x, z), x, FLOOR, z), H = h - FLOOR; P(g, 'cone', obst ? 0x9aa0b0 : 0x8d93a3, [0, H / 2, 0], [r, H, r]); P(g, 'cone', 0xf4f8ff, [0, H - H * 0.17, 0], [r * 0.36, H * 0.36, r * 0.36]); if (obst) S.peaks.push({ x, z, r: r * (h / H), h }); };
  // the walls of the valley
  for (let z = S.z1 - 40; z <= S.z0 + 40; z += 8) for (const s of [1, -1]) peak(S.cx(z) + s * (S.half + 7 + rnd(0, 9)), z + rnd(-2, 2), rnd(8, 13), rnd(18, 36), false);
  // lone spires in the way: fly round the tall ones, or over the short ones
  for (let i = 0; i < 10; i++) { const z = S.z0 - 46 - i * 32 + rnd(-5, 5); peak(S.cx(z) + rnd(-7.5, 7.5), z, rnd(2.8, 3.8), rnd(9, 22), true); }
  // the snowy floor far below, with a river winding along it
  P(grp(chunk(700, 1290), 700, FLOOR - 0.3, 1290), 'box', 0xe6eef6, [0, 0, 0], [110, 0.5, 470]);
  for (let z = S.z1 - 30; z < S.z0 + 30; z += 10) P(grp(chunk(S.cx(z), z), S.cx(z + 5), FLOOR + 0.05, z + 5), 'box', 0x7ab8ee, [0, 0, 0], [5, 0.12, 10.6], [0, Math.atan2(S.cx(z + 10) - S.cx(z), 10), 0]);
  // clouds to fly through
  for (let i = 0; i < 26; i++) { const z = S.z1 - 10 + rnd(0, S.z0 - S.z1 + 20), g = grp(chunk(S.cx(z), z), S.cx(z) + rnd(-20, 20), rnd(2, 21), z); for (let j = 0; j < 3; j++) P(g, 'sph', 0xffffff, [(j - 1) * 1.7, rnd(-0.3, 0.3), rnd(-0.6, 0.6)], [rnd(1.4, 2.2), rnd(0.8, 1.1), rnd(1.1, 1.6)]); }
  // golden rings: [x, y, z]
  for (let i = 0; i < 12; i++) { const z = S.z0 - 30 - i * 29; let x = S.cx(z) + rnd(-7, 7); const y = rnd(7.5, 15.5); for (const o of S.peaks) if (Math.hypot(o.x - x, o.z - z) < o.r + 3.2) x = o.x + (x >= o.x ? 1 : -1) * (o.r + 3.4); S.rings.push([x, y, z]); }
})();

// ---------- the lands beyond the Sky Pass: the Cloud Peaks and Sunset Island ----------
// Two more patches of land far to the east, reached only by air the first time.
(function () {
  const TT = window.TT, P = TT.P, rand = TT.rand, pick = TT.pick, W = TT.World;
  const { grp, chunk } = W.H;
  const PK = W.PEAKS = { x0: 500, x1: 608, z0: -154, z1: -46, cx: 554, cz: -100, spawn: [511, -138] };
  const IS = W.ISLE = { cx: 714, cz: -100, r: 46, spawn: [714, -66] };
  W.TEMPLE = { x: 590, z: -64 }; W.SKYE = { x: 514, z: -143 }; W.LAKE = { x: 536, z: -86, rx: 13, rz: 9 }; W.ROSHI = { x: 714, z: -113 };

  // walking rules: stay on the plateau, off the frozen lake's thin middle, and out of the sea
  const ww0 = W.wwCollide;
  W.wwCollide = (x, z, r) => {
    if (x < 470) return ww0(x, z, r);
    if (x < 640) return [TT.clamp(x, PK.x0 + 1.5, PK.x1 - 1.5), TT.clamp(z, PK.z0 + 1.5, PK.z1 - 1.5)];
    const dx = x - IS.cx, dz = z - IS.cz, d = Math.hypot(dx, dz), m = IS.r - 2; return d > m ? [IS.cx + dx / d * m, IS.cz + dz / d * m] : [x, z];
  };
  const gy0 = W.gy; W.gy = (x, z) => x < 470 ? gy0(x, z) : 0;
  const st0 = W.stageAt; W.stageAt = (x, z) => x > 640 ? 'pond' : x > 470 ? 'mountain' : st0(x, z);

  W.zones.push(
    { name: 'Snowfield', noGrass: 1, x: 526, z: -116, r: 12, n: 4, lv: [26, 31], pool: ['pidgeotto', 'machop', 'geodude', 'vulpix', 'eevee', 'dratini'], rare: ['dragonair', 0.15] },
    { name: 'Frozen Shore', noGrass: 1, x: 560, z: -70, r: 11, n: 4, lv: [27, 32], pool: ['psyduck', 'poliwag', 'poliwhirl', 'squirtle', 'magikarp'], rare: ['gyarados', 0.1] },
    { name: 'Sandy Beach', noGrass: 1, x: 692, z: -84, r: 11, n: 4, lv: [29, 34], pool: ['squirtle', 'psyduck', 'quaxly', 'poliwag', 'magikarp', 'wartortle'], rare: ['gyarados', 0.1] },
    { name: 'Palm Grove', noGrass: 1, x: 738, z: -88, r: 11, n: 4, lv: [29, 34], pool: ['oddish', 'butterfree', 'pidgeotto', 'eevee', 'meowth', 'raichu'], rare: ['dragonair', 0.12] });
  W.NPCS.push(['skye', 'skye', 'Ranger Skye', W.SKYE.x + 2.2, W.SKYE.z + 3.4, 0, []], ['roshi', 'roshi', 'Master Roshi', W.ROSHI.x + 0.5, W.ROSHI.z + 4.6, 0, []]);
  W.PEAKS_PLACES = [
    ["Ranger Skye's Hut", W.SKYE.x, W.SKYE.z, '🏠', 'Ranger Skye warms up tired Pokémon.', W.SKYE.x + 2.2, W.SKYE.z + 5],
    ['Snowfield', 526, -116, '❄', 'Pidgeotto, Machop, Geodude, Vulpix, Eevee and Dratini.', 526, -116],
    ['Frozen Lake', W.LAKE.x, W.LAKE.z, '🧊', 'Solid ice. Lovely for sliding.', W.LAKE.x, W.LAKE.z + 11],
    ['Frozen Shore', 560, -70, '🌊', 'Psyduck, Poliwag, Squirtle and Magikarp.', 560, -70],
    ['Sky Temple', W.TEMPLE.x, W.TEMPLE.z, '🏛', 'The Guardian of the Peaks waits here.', W.TEMPLE.x - 5, W.TEMPLE.z + 5]];
  W.ISLE_PLACES = [
    ['Landing Pier', 714, -58, '⚓', 'Where flying Pokémon set you down.', 714, -64],
    ['Sandy Beach', 692, -84, '🏖', 'Squirtle, Psyduck, Quaxly, Poliwag and Magikarp.', 692, -84],
    ['Palm Grove', 738, -88, '🌴', 'Oddish, Butterfree, Eevee, Meowth and Raichu.', 738, -88],
    ['Kame House', W.ROSHI.x, W.ROSHI.z, '🐢', 'Master Roshi, the Turtle Hermit, lives here.', W.ROSHI.x + 0.5, W.ROSHI.z + 6.5]];

  // ---------- ground pictures (also used for the maps) ----------
  function peaksTex() {
    const c = W.peaksCanvas = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), k = 1024 / 108, X = v => (v - PK.x0) * k, Z = v => (v - PK.z0) * k;
    x.fillStyle = '#eef4fb'; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 300; i++) { const X0 = Math.random() * 1024, Y0 = Math.random() * 1024, R = rand(30, 120), g = x.createRadialGradient(X0, Y0, 0, X0, Y0, R); g.addColorStop(0, i % 2 ? 'rgba(190,212,238,.35)' : 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(X0 - R, Y0 - R, R * 2, R * 2); }
    for (let i = 0; i < 5000; i++) { x.fillStyle = i % 3 ? 'rgba(170,196,226,.35)' : 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(Math.random() * 1024, Math.random() * 1024, rand(1, 4), rand(1, 3), rand(0, 3), 0, 7); x.fill(); }
    for (const zn of W.zones) if (zn.x > 470 && zn.x < 640) { const g = x.createRadialGradient(X(zn.x), Z(zn.z), zn.r * k * 0.5, X(zn.x), Z(zn.z), zn.r * k * 1.05); g.addColorStop(0, 'rgba(176,206,236,.9)'); g.addColorStop(1, 'rgba(176,206,236,0)'); x.fillStyle = g; x.beginPath(); x.arc(X(zn.x), Z(zn.z), zn.r * k * 1.05, 0, 7); x.fill(); }
    // the frozen lake
    { const L = W.LAKE, g = x.createRadialGradient(X(L.x), Z(L.z), 4, X(L.x), Z(L.z), L.rx * k); g.addColorStop(0, '#bfe6fb'); g.addColorStop(0.8, '#8fd0f2'); g.addColorStop(1, '#e8f6ff'); x.fillStyle = g; x.beginPath(); x.ellipse(X(L.x), Z(L.z), L.rx * k, L.rz * k, 0, 0, 7); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 2; for (let i = 0; i < 14; i++) { const a = rand(0, 6.28), r0 = rand(0.1, 0.8); x.beginPath(); x.moveTo(X(L.x + Math.cos(a) * L.rx * r0), Z(L.z + Math.sin(a) * L.rz * r0)); x.lineTo(X(L.x + Math.cos(a + 0.4) * L.rx * (r0 + 0.15)), Z(L.z + Math.sin(a + 0.4) * L.rz * (r0 + 0.15))); x.stroke(); } }
    // the trail: from the landing, past the lake, up to the temple
    const trail = (pts, w) => { for (const [lw, col] of [[w * k + 8, 'rgba(150,170,196,.5)'], [w * k, '#cdb89a']]) { x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = x.lineCap = 'round'; x.beginPath(); pts.forEach((q, j) => j ? x.lineTo(X(q[0]), Z(q[1])) : x.moveTo(X(q[0]), Z(q[1]))); x.stroke(); } };
    trail([[511, -138], [530, -132], [548, -112], [556, -92], [572, -76], [W.TEMPLE.x - 4, W.TEMPLE.z + 4]], 3.6); trail([[530, -132], [526, -120]], 2.6); trail([[556, -92], [560, -76]], 2.6);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function isleTex() {
    const c = W.isleCanvas = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), k = 1024 / 108, X = v => (v - (IS.cx - 54)) * k, Z = v => (v - (IS.cz - 54)) * k, cx = X(IS.cx), cz = Z(IS.cz);
    x.fillStyle = '#3f9ee8'; x.fillRect(0, 0, 1024, 1024);
    let g = x.createRadialGradient(cx, cz, IS.r * k * 0.86, cx, cz, IS.r * k * 1.12); g.addColorStop(0, '#9adcf4'); g.addColorStop(1, 'rgba(63,158,232,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cz, IS.r * k * 1.12, 0, 7); x.fill();
    x.fillStyle = '#f4e2a8'; x.beginPath(); x.arc(cx, cz, IS.r * k, 0, 7); x.fill();
    g = x.createRadialGradient(cx, cz, IS.r * k * 0.25, cx, cz, IS.r * k * 0.7); g.addColorStop(0, '#7cc85a'); g.addColorStop(0.8, '#8fd066'); g.addColorStop(1, 'rgba(244,226,168,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cz, IS.r * k * 0.7, 0, 7); x.fill();
    for (let i = 0; i < 4000; i++) { const a = rand(0, 6.28), r = Math.sqrt(Math.random()) * IS.r * k; x.fillStyle = i % 3 ? 'rgba(210,180,110,.35)' : 'rgba(255,250,220,.6)'; x.beginPath(); x.ellipse(cx + Math.cos(a) * r, cz + Math.sin(a) * r, rand(1, 4), rand(1, 3), rand(0, 3), 0, 7); x.fill(); }
    for (const zn of W.zones) if (zn.x > 640) { const gg = x.createRadialGradient(X(zn.x), Z(zn.z), zn.r * k * 0.5, X(zn.x), Z(zn.z), zn.r * k * 1.05); gg.addColorStop(0, zn.name === 'Palm Grove' ? 'rgba(70,160,80,.85)' : 'rgba(232,200,130,.9)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.beginPath(); x.arc(X(zn.x), Z(zn.z), zn.r * k * 1.05, 0, 7); x.fill(); }
    for (const [lw, col] of [[3.4 * k + 8, 'rgba(160,130,80,.45)'], [3.4 * k, '#e8cf98']]) { x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = x.lineCap = 'round'; x.beginPath(); [[714, -60], [714, -84], [704, -96], [714, -107]].forEach((q, j) => j ? x.lineTo(X(q[0]), Z(q[1])) : x.moveTo(X(q[0]), Z(q[1]))); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  // ---------- props ----------
  const solid = (x, z, r) => W.colliders.push({ x, z, r });
  const snowPine = (x, z, k) => { const g = grp(chunk(x, z), x, 0, z); g.rotation.y = rand(0, 6); P(g, 'trunk', 0x6a4a32, [0, 0.5 * k, 0], [0.18 * k, 1.0 * k, 0.18 * k]); for (let i = 0; i < 3; i++) { const r = (1.15 - i * 0.28) * k; P(g, 'cone8', 0x2f7a52, [0, (1.3 + i * 0.75) * k, 0], [r, 1.2 * k, r]); P(g, 'cone8', 0xf4f8ff, [0, (1.62 + i * 0.75) * k, 0], [r * 0.62, 0.56 * k, r * 0.62]); } solid(x, z, 0.5 * k); W.trees.push([x, z, k, 'pine']); };
  const iceRock = (x, z, k) => { const g = grp(chunk(x, z), x, 0, z); g.rotation.y = rand(0, 6); P(g, 'cone8', pick([0xbfe4ff, 0xd8f0ff, 0x9ad0f0]), [0, 0.8 * k, 0], [0.5 * k, 1.6 * k, 0.5 * k]); P(g, 'cone8', 0xd8f0ff, [0.4 * k, 0.5 * k, 0.1], [0.3 * k, 1.0 * k, 0.3 * k], [0, 0, -0.3]); solid(x, z, 0.5 * k); };
  const bigPeak = (x, z, r, h) => { const g = grp(chunk(x, z), x, 0, z); P(g, 'cone', 0x8d93a3, [0, h / 2, 0], [r, h, r]); P(g, 'cone', 0xf4f8ff, [0, h * 0.82, 0], [r * 0.38, h * 0.38, r * 0.38]); };
  const palm = (x, z, k) => { const g = grp(chunk(x, z), x, 0, z); g.rotation.y = rand(0, 6); P(g, 'trunk', 0x9a7a4a, [0.12 * k, 1.5 * k, 0], [0.15 * k, 3.0 * k, 0.15 * k], [0, 0, -0.09]); for (let i = 0; i < 6; i++) { const a = i * 1.047; P(g, 'sph', i % 2 ? 0x3aa84a : 0x4ab85a, [0.28 * k + Math.cos(a) * 0.95 * k, 2.92 * k, Math.sin(a) * 0.95 * k], [1.05 * k, 0.07 * k, 0.3 * k], [0, -a, -0.38]); } for (const q of [[0.42, 0.1], [0.16, -0.14]]) P(g, 'sph', 0x7a4a2a, [q[0] * k, 2.84 * k, q[1] * k], 0.14 * k); solid(x + 0.1, z, 0.32 * k); W.trees.push([x, z, k * 0.8, 'leaf']); };
  const post = (x, z, text) => { const g = grp(chunk(x, z), x, 0, z); P(g, 'cyl', 0x7a5234, [0, 0.6, 0], [0.07, 1.2, 0.07]); P(g, 'box', 0x7a5234, [0, 1.3, -0.02], [2.3, 0.82, 0.08]); const s = TT.label ? TT.label(text, 'rgba(216,176,112,1)') : null; if (s) { s.position.set(x, 1.3, z + 0.12); s.scale.set(2.2, 0.55, 1); s.userData.live = true; W.signs4.push(s); } solid(x, z, 0.3); };
  W.signs4 = [];
  const clear = (x, z, list, d) => list.every(q => Math.hypot(q[0] - x, q[1] - z) > (q[2] || d));

  const oldWorld = W.buildWorld;
  W.buildWorld = function* (scene) {
    if (oldWorld) yield* oldWorld(scene);
    yield 'Raising the Cloud Peaks';
    // ---- the Cloud Peaks ----
    { const under = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0xdfe9f4 })); under.rotation.x = -Math.PI / 2; under.position.set(PK.cx, 0.006, PK.cz); scene.add(under);
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), new THREE.MeshLambertMaterial({ map: peaksTex() })); gm.rotation.x = -Math.PI / 2; gm.position.set(PK.cx, 0.016, PK.cz); gm.receiveShadow = true; scene.add(gm); }
    const keep = [[W.SKYE.x, W.SKYE.z, 8], [W.LAKE.x, W.LAKE.z, 15], [W.TEMPLE.x, W.TEMPLE.z, 11], [511, -138, 6], [526, -116, 5], [560, -70, 5], [530, -132, 4], [548, -112, 4], [556, -92, 4], [572, -76, 4]];
    for (let i = 0; i < 70; i++) { const x = rand(PK.x0 + 3, PK.x1 - 3), z = rand(PK.z0 + 3, PK.z1 - 3); if (clear(x, z, keep, 4)) snowPine(x, z, rand(0.9, 1.5)); }
    for (let i = 0; i < 34; i++) { const x = rand(PK.x0 + 3, PK.x1 - 3), z = rand(PK.z0 + 3, PK.z1 - 3); if (clear(x, z, keep, 4)) iceRock(x, z, rand(0.7, 1.5)); }
    for (let a = 0; a < 6.28; a += 0.21) bigPeak(PK.cx + Math.cos(a) * rand(70, 84), PK.cz + Math.sin(a) * rand(70, 84), rand(11, 17), rand(26, 46));        // a ring of mountains all round
    // Ranger Skye's hut
    { const g = grp(chunk(W.SKYE.x, W.SKYE.z), W.SKYE.x, 0, W.SKYE.z); P(g, 'box', 0x9a6a42, [0, 1.3, 0], [5, 2.6, 4]); P(g, 'box', 0xf4f8ff, [0, 2.85, 0], [5.6, 0.5, 4.6]); P(g, 'box', 0xe2382e, [0, 3.2, 0], [4.4, 0.4, 3.6]); P(g, 'box', 0x5a3a22, [0.8, 0.95, 2.02], [1.1, 1.9, 0.08]); P(g, 'box', 0xbfe4ff, [-1.3, 1.5, 2.02], [1.1, 0.9, 0.08]); solid(W.SKYE.x - 1.2, W.SKYE.z, 2.2); solid(W.SKYE.x + 1.2, W.SKYE.z, 2.2); }
    post(W.SKYE.x + 5.5, W.SKYE.z + 3.4, 'Cloud Peaks');
    // the Sky Temple: a round stone floor, six pillars and a great crystal of ice
    { const T = W.TEMPLE, g = grp(chunk(T.x, T.z), T.x, 0, T.z); P(g, 'cyl', 0xa9b4c8, [0, 0.2, 0], [7, 0.4, 7]); P(g, 'cyl', 0xc4cee0, [0, 0.45, 0], [5.4, 0.2, 5.4]);
      for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.52; P(g, 'cyl', 0xe6eef8, [Math.cos(a) * 5.9, 2.4, Math.sin(a) * 5.9], [0.38, 4.4, 0.38]); P(g, 'box', 0xc4cee0, [Math.cos(a) * 5.9, 4.7, Math.sin(a) * 5.9], [1.1, 0.3, 1.1]); solid(T.x + Math.cos(a) * 5.9, T.z + Math.sin(a) * 5.9, 0.5); }
      const cr = new THREE.Group(); cr.position.set(T.x, 0.55, T.z); P(cr, 'cone8', TT.glow(0x9ae0ff), [0, 1.5, 0], [0.75, 3, 0.75]); P(cr, 'cone8', TT.glow(0xd8f4ff), [0.6, 0.9, 0.2], [0.42, 1.8, 0.42], [0, 0, -0.35]); P(cr, 'cone8', TT.glow(0xbfeaff), [-0.55, 0.8, -0.2], [0.4, 1.6, 0.4], [0, 0, 0.35]); TT.bakeDeep(cr); cr.userData.live = true; scene.add(cr); W.crystal = cr; solid(T.x, T.z, 1.3); }
    post(W.TEMPLE.x - 8.5, W.TEMPLE.z + 7, 'Sky Temple');
    yield 'Warming up Sunset Island';
    // ---- Sunset Island ----
    { const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshLambertMaterial({ color: 0x3f9ee8 })); sea.rotation.x = -Math.PI / 2; sea.position.set(IS.cx, 0.004, IS.cz); scene.add(sea);
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), new THREE.MeshLambertMaterial({ map: isleTex() })); gm.rotation.x = -Math.PI / 2; gm.position.set(IS.cx, 0.016, IS.cz); gm.receiveShadow = true; scene.add(gm); }
    const keep2 = [[W.ROSHI.x, W.ROSHI.z, 9], [714, -66, 6], [692, -84, 5], [738, -88, 5], [714, -84, 4], [704, -96, 4]];
    for (let i = 0; i < 46; i++) { const a = rand(0, 6.28), r = Math.sqrt(Math.random()) * (IS.r - 5), x = IS.cx + Math.cos(a) * r, z = IS.cz + Math.sin(a) * r; if (clear(x, z, keep2, 4)) palm(x, z, rand(0.9, 1.4)); }
    for (let i = 0; i < 18; i++) { const a = rand(0, 6.28), r = rand(IS.r - 6, IS.r - 1.5), x = IS.cx + Math.cos(a) * r, z = IS.cz + Math.sin(a) * r, g = grp(chunk(x, z), x, 0, z); P(g, 'rock', pick([0x9a9aa4, 0xb8b0a0, 0x8a8a96]), [0, 0.25, 0], [rand(0.5, 1.1), rand(0.35, 0.7), rand(0.5, 1)], [rand(0, 3), rand(0, 3), 0]); solid(x, z, 0.6); }
    for (const [ux, uz, col] of [[700, -74, 0xe2382e], [724, -72, 0x3a8ad8], [686, -94, 0xf2c230]]) { const g = grp(chunk(ux, uz), ux, 0, uz); P(g, 'cyl', 0xe8e0d0, [0, 1.1, 0], [0.05, 2.2, 0.05]); P(g, 'cone', col, [0, 2.2, 0], [1.5, 0.6, 1.5]); P(g, 'box', 0xf4f6fa, [0.2, 0.08, 0.9], [0.9, 0.06, 1.9]); solid(ux, uz, 0.3); }      // beach umbrellas and towels
    // the pier where flying Pokémon land
    { const g = grp(chunk(714, -55), 714, 0, -55); P(g, 'box', 0xa87646, [0, 0.25, 4], [3.4, 0.2, 12]); for (const s of [1, -1]) for (let i = 0; i < 4; i++) P(g, 'cyl', 0x7a5234, [s * 1.5, 0.3, i * 3.4 - 1], [0.14, 1.0, 0.14]); }
    // the Kame House: pink walls, a red roof, and a little attic window
    { const R = W.ROSHI, g = grp(chunk(R.x, R.z), R.x, 0, R.z); P(g, 'box', 0xf4a8c0, [0, 1.6, 0], [7, 3.2, 5.4]); P(g, 'box', 0xe2382e, [0, 3.45, 0], [7.8, 0.5, 6.2]); P(g, 'box', 0xf4a8c0, [0, 4.3, 0], [3.4, 1.4, 3]); P(g, 'box', 0xe2382e, [0, 5.15, 0], [4, 0.36, 3.6]);
      P(g, 'box', 0x8a5a3a, [0, 1.05, 2.72], [1.3, 2.1, 0.08]); for (const s of [1, -1]) P(g, 'box', 0xbfe4ff, [s * 2.3, 1.8, 2.72], [1.3, 1.1, 0.08]); P(g, 'box', 0xbfe4ff, [0, 4.35, 1.52], [1, 0.8, 0.08]); solid(R.x - 2, R.z, 2.9); solid(R.x + 2, R.z, 2.9); }
    post(W.ROSHI.x - 5.4, W.ROSHI.z + 4.4, 'KAME HOUSE'); post(718.6, -62, 'Sunset Island');
    // what marks the wild areas here in place of tall grass: frosty tufts on the peaks, beach grass and shells on the island
    for (const zn of W.zones) if (zn.x > 470) for (let i = 0; i < 90; i++) {
      const a = Math.random() * 7, r = Math.sqrt(Math.random()) * (zn.r - 0.5), x = zn.x + Math.cos(a) * r, z = zn.z + Math.sin(a) * r, g = grp(chunk(x, z), x, 0, z), snow = zn.x < 640;
      if (snow) P(g, 'cone8', pick([0xcfe6fa, 0xb4d6f2, 0xe6f2fc]), [0, 0.2, 0], [rand(0.1, 0.18), rand(0.3, 0.55), rand(0.1, 0.18)], [rand(-0.2, 0.2), 0, rand(-0.2, 0.2)]);
      else if (zn.name === 'Palm Grove' || i % 3) P(g, 'cone8', pick([0x4aa84a, 0x5ab85a, 0x3a984a]), [0, 0.22, 0], [0.09, rand(0.35, 0.6), 0.09], [rand(-0.25, 0.25), 0, rand(-0.25, 0.25)]);
      else P(g, 'sph', pick([0xf4a8c0, 0xfff0d8, 0xf2c860]), [0, 0.05, 0], [0.14, 0.05, 0.11], [0, rand(0, 3), 0]);
    }
    for (const s of W.signs4) scene.add(s);
  };
})();
