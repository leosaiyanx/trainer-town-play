// world7.js — Chapter 2, part two: Planet Vegeta, home of the Saiyans.
// Like Namek, its scenery is only built while a trainer is there (W.pvLoad / W.pvUnload).
// The area is called "pvegeta" in the code: "vegeta" alone already means the character (and the flag for beating him).
(function () {
  const TT = window.TT, P = TT.P, rand = TT.rand, pick = TT.pick, W = TT.World;
  const { grp } = W.H;
  const PV = W.PVEG = { x0: 2946, x1: 3054, z0: -154, z1: -46, cx: 3000, cz: -100, spawn: [2963, -63] };
  const K = W.PV = { LAND: { x: 2957, z: -57 }, GUARD: { x: 2968, z: -68 }, MEDIC: { x: 2973, z: -57 }, ARENA: { x: 3008, z: -114, r: 14 }, GATE: { x: 3008, z: -97.5 }, KING: { x: 3008, z: -122 }, GRAV: { x: 2972, z: -104 },
    RADITZ: { x: 2996, z: -94 }, NAPPA: { x: 3020, z: -95 }, BARDOCK: { x: 3024, z: -104 } };
  const DOMES = [[2984, -84, 1.1], [2994, -76, 0.9], [2980, -94, 0.9], [3024, -82, 1.2], [3034, -92, 0.9], [2990, -124, 1]];
  const wwP = W.wwCollide;
  W.wwCollide = (x, z, r) => x < 2500 ? wwP(x, z, r) : [TT.clamp(x, PV.x0 + 2, PV.x1 - 2), TT.clamp(z, PV.z0 + 2, PV.z1 - 2)];
  const stP = W.stageAt; W.stageAt = (x, z) => x > 2500 ? 'arenaV' : stP(x, z);

  W.zones.push(
    { name: 'Red Canyon', noGrass: 1, lazy: 'pvegeta', x: 3038, z: -66, r: 11, n: 4, lv: [38, 43], pool: ['larvitar', 'geodude', 'onix', 'machop', 'houndour', 'larvitar'], rare: ['pupitar', 0.14] },
    { name: 'Ash Dunes', noGrass: 1, lazy: 'pvegeta', x: 2966, z: -136, r: 11, n: 4, lv: [39, 44], pool: ['houndour', 'growlithe', 'ponyta', 'vulpix', 'machop', 'houndour'], rare: ['riolu', 0.2] });
  W.PV_NPCS = [['pvguard', 'sguard', 'Saiyan Guard', K.GUARD.x, K.GUARD.z, 0, []], ['pvmedic', 'sguard', 'Saiyan Medic', K.MEDIC.x, K.MEDIC.z, 0, []], ['pvgate', 'sguard', 'Arena Announcer', K.GATE.x + 1.6, K.GATE.z, 0, []], ['pvgrav', 'sguard', 'Gravity Keeper', K.GRAV.x + 3.4, K.GRAV.z + 2.6, 0, []],
    ['pvraditz', 'raditz', 'Raditz', K.RADITZ.x, K.RADITZ.z, 0, []], ['pvnappa', 'nappa', 'Nappa', K.NAPPA.x, K.NAPPA.z, 0, []], ['pvbardock', 'bardock', 'Bardock', K.BARDOCK.x, K.BARDOCK.z, 0, []], ['pvking', 'kingvegeta', 'King Vegeta', K.KING.x, K.KING.z, 0, []]];
  W.PV_PLACES = [
    ['Landing Site', K.LAND.x, K.LAND.z, '🚀', "Bulma's spaceship, and a healing tank for tired Pokémon.", PV.spawn[0], PV.spawn[1]],
    ['Saiyan City', 2986, -86, '🏙️', 'Round steel houses with glowing windows.', 2988, -82],
    ['Royal Arena', K.ARENA.x, K.ARENA.z, '🏟️', 'The Royal Tournament, and then the Endless Tournament.', K.GATE.x, K.GATE.z + 3],
    ['Gravity Room', K.GRAV.x, K.GRAV.z, '🏋️', 'Training under ten times normal gravity.', K.GRAV.x + 3.4, K.GRAV.z + 4.6],
    ['Red Canyon', 3038, -66, '🪨', 'Larvitar, Geodude, Onix, Machop and Houndour.', 3038, -66],
    ['Ash Dunes', 2966, -136, '🌋', 'Houndour, Growlithe, Ponyta, Vulpix, and sometimes Riolu.', 2966, -136]];

  W.pvCanvasGet = () => {
    if (W.pvCanvas) return W.pvCanvas;
    const c = W.pvCanvas = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), k = 1024 / 108, X = v => (v - PV.x0) * k, Z = v => (v - PV.z0) * k;
    x.fillStyle = '#c96a40'; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 260; i++) { const X0 = Math.random() * 1024, Y0 = Math.random() * 1024, R = rand(30, 110), g = x.createRadialGradient(X0, Y0, 0, X0, Y0, R); g.addColorStop(0, i % 2 ? 'rgba(150,62,36,.4)' : 'rgba(232,150,96,.4)'); g.addColorStop(1, 'rgba(201,106,64,0)'); x.fillStyle = g; x.fillRect(X0 - R, Y0 - R, R * 2, R * 2); }
    for (let i = 0; i < 5200; i++) { x.fillStyle = i % 3 ? 'rgba(120,48,30,.35)' : 'rgba(246,190,140,.5)'; x.beginPath(); x.ellipse(Math.random() * 1024, Math.random() * 1024, rand(1, 4), rand(1, 3), rand(0, 3), 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(96,36,24,.5)'; x.lineWidth = 2; for (let i = 0; i < 46; i++) { let px = Math.random() * 1024, py = Math.random() * 1024; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += rand(-34, 34); py += rand(-34, 34); x.lineTo(px, py); } x.stroke(); }          // cracks in the dry ground
    for (const zn of W.zones) if (zn.x > 2500) { const g = x.createRadialGradient(X(zn.x), Z(zn.z), zn.r * k * 0.5, X(zn.x), Z(zn.z), zn.r * k * 1.05); g.addColorStop(0, zn.name === 'Ash Dunes' ? 'rgba(96,84,88,.85)' : 'rgba(150,56,36,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(X(zn.x), Z(zn.z), zn.r * k * 1.05, 0, 7); x.fill(); }
    const trail = (pts, w) => { for (const [lw, col] of [[w * k + 8, 'rgba(110,44,28,.45)'], [w * k, '#ecc09a']]) { x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = x.lineCap = 'round'; x.beginPath(); pts.forEach((q, j) => j ? x.lineTo(X(q[0]), Z(q[1])) : x.moveTo(X(q[0]), Z(q[1]))); x.stroke(); } };
    trail([[2963, -63], [2976, -72], [2992, -86], [3008, -95]], 3.4); trail([[2992, -86], [2980, -100], [2975, -101]], 2.6); trail([[2992, -86], [3020, -72], [3032, -68]], 2.6); trail([[2980, -100], [2970, -126]], 2.6);
    { const A = K.ARENA; x.fillStyle = '#f0d0a0'; x.beginPath(); x.arc(X(A.x), Z(A.z), A.r * k, 0, 7); x.fill(); x.strokeStyle = '#b01c24'; x.lineWidth = 6; x.beginPath(); x.arc(X(A.x), Z(A.z), 6 * k, 0, 7); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(X(A.x - 6), Z(A.z)); x.lineTo(X(A.x + 6), Z(A.z)); x.stroke(); }
    return c;
  };

  let root = null, mine = [];
  const solid = (x, z, r) => { const c = { x, z, r }; W.colliders.push(c); mine.push(c); };
  const clear = (x, z, list, d) => list.every(q => Math.hypot(q[0] - x, q[1] - z) > (q[2] || d));
  W.pvOn = () => !!root;
  W.pvLoad = scene => {
    if (root) return;
    root = new THREE.Group(); scene.add(root);
    const tiles = {}, tile = (x, z) => { const k = Math.floor(x / 27) + '_' + Math.floor(z / 27); return tiles[k] || (tiles[k] = grp(root, 0, 0, 0)); }, at = (x, z) => grp(tile(x, z), x, 0, z);
    { const out = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshLambertMaterial({ color: 0xa85432 })); out.material.userData.own = out.geometry.userData.own = true; out.rotation.x = -Math.PI / 2; out.position.set(PV.cx, 0.004, PV.cz); root.add(out);
      const tex = new THREE.CanvasTexture(W.pvCanvasGet()); tex.anisotropy = 4; const gm = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), new THREE.MeshLambertMaterial({ map: tex })); gm.material.userData.own = gm.geometry.userData.own = true; gm.rotation.x = -Math.PI / 2; gm.position.set(PV.cx, 0.016, PV.cz); gm.receiveShadow = true; root.add(gm); }
    const A = K.ARENA, keep = [[K.LAND.x, K.LAND.z, 9], [K.MEDIC.x, K.MEDIC.z, 5], [K.GUARD.x, K.GUARD.z, 4], [A.x, A.z, A.r + 6], [K.GATE.x, K.GATE.z, 6], [K.GRAV.x, K.GRAV.z, 8], [K.RADITZ.x, K.RADITZ.z, 4], [K.NAPPA.x, K.NAPPA.z, 4], [K.BARDOCK.x, K.BARDOCK.z, 4],
      [2976, -72, 4], [2992, -86, 5], [3020, -72, 4], [2980, -100, 4], [2970, -126, 4], [3038, -66, 5], [2966, -136, 5]].concat(DOMES.map(d => [d[0], d[1], 5]));
    // flat-topped red rocks, boulders and bare trees
    const mesa = (x, z, r, h) => { const g = at(x, z); g.rotation.y = rand(0, 3); P(g, 'cyl', pick([0xa8482c, 0xb85a36, 0x963e28]), [0, h / 2, 0], [r, h, r * 0.85]); P(g, 'cyl', 0xcf7648, [0, h + 0.1, 0], [r * 0.92, 0.2, r * 0.8]); P(g, 'cyl', 0x8a3a24, [0, 0.25, 0], [r * 1.25, 0.5, r * 1.1]); solid(x, z, r * 1.05); };
    for (let i = 0; i < 44; i++) { const x = rand(PV.x0 + 3, PV.x1 - 3), z = rand(PV.z0 + 3, PV.z1 - 3); if (clear(x, z, keep, 5)) mesa(x, z, rand(0.8, 2.2), rand(1.2, 6)); }
    for (let i = 0; i < 60; i++) { const x = rand(PV.x0 + 3, PV.x1 - 3), z = rand(PV.z0 + 3, PV.z1 - 3); if (!clear(x, z, keep, 4)) continue; const g = at(x, z); if (i % 3) { P(g, 'rock', pick([0x9a4a30, 0xb05a3a, 0x7a3a2a]), [0, 0.25, 0], [rand(0.4, 0.9), rand(0.3, 0.6), rand(0.4, 0.9)], [rand(0, 3), rand(0, 3), 0]); solid(x, z, 0.55); }
      else { const k2 = rand(0.9, 1.5); P(g, 'trunk', 0x5a3a30, [0, 1.1 * k2, 0], [0.14 * k2, 2.2 * k2, 0.14 * k2], [0, 0, rand(-0.1, 0.1)]); for (const s of [1, -1]) P(g, 'trunk', 0x5a3a30, [s * 0.35 * k2, 1.9 * k2, 0], [0.07 * k2, 1.0 * k2, 0.07 * k2], [0, 0, -s * 0.8]); solid(x, z, 0.3); } }
    for (let a = 0; a < 6.28; a += 0.24) { const d = rand(72, 96), x = PV.cx + Math.cos(a) * d, z = PV.cz + Math.sin(a) * d, g = at(x, z), r = rand(6, 13), h = rand(10, 30); P(g, 'cyl', pick([0xa8482c, 0x963e28, 0xb85a36]), [0, h / 2, 0], [r, h, r * 0.9]); P(g, 'cyl', 0xcf7648, [0, h + 0.2, 0], [r * 0.9, 0.4, r * 0.82]); }          // a wall of great mesas all round
    // the Saiyan city: steel domes with a ring of orange lights
    for (const [hx, hz, k] of DOMES) { const g = at(hx, hz); P(g, 'sph', 0x5a6478, [0, 0, 0], [3 * k, 2.5 * k, 3 * k]); P(g, 'cyl', 0x3e4658, [0, 0.3 * k, 0], [3.1 * k, 0.6 * k, 3.1 * k]); P(g, 'sph', 0x23262e, [0, 0.95 * k, 2.72 * k], [0.7 * k, 0.95 * k, 0.3 * k]); for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.52; if (Math.sin(a) > 0.8) continue; P(g, 'sph', TT.glow(0xffb040), [Math.cos(a) * 2.5 * k, 1.5 * k, Math.sin(a) * 2.5 * k], 0.3 * k); } P(g, 'cyl', 0x8a92a4, [0, 2.6 * k, 0], [0.08, 1.2 * k, 0.08]); solid(hx, hz, 2.9 * k); }
    // the Royal Arena: a great ring of tiered walls, open to the south, with banners and the King's seat on the north side
    { const g = at(A.x, A.z); for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283; if (Math.abs(a - 1.5708) < 0.3) continue; const c = Math.cos(a), s = Math.sin(a);
        P(g, 'box', 0xb08a6a, [c * (A.r + 1), 1.4, s * (A.r + 1)], [3.6, 2.8, 2.2], [0, -a + 1.5708, 0]); P(g, 'box', 0x9a7658, [c * (A.r + 2.6), 2.6, s * (A.r + 2.6)], [4.0, 5.2, 1.6], [0, -a + 1.5708, 0]); if (i % 3 === 0) { P(g, 'cyl', 0x6a5040, [c * (A.r + 2.6), 6.2, s * (A.r + 2.6)], [0.09, 2.2, 0.09]); P(g, 'box', i % 2 ? 0xb01c24 : 0x2a3a9a, [c * (A.r + 2.6) + 0.6, 6.7, s * (A.r + 2.6)], [1.2, 0.8, 0.06]); }
        solid(A.x + c * (A.r + 1.6), A.z + s * (A.r + 1.6), 2.1); }
      for (const s of [1, -1]) { P(g, 'box', 0x8a6a50, [s * 3.4, 2.6, A.r + 1.6], [1.4, 5.2, 2.6]); P(g, 'sph', TT.glow(0xffb040), [s * 3.4, 5.6, A.r + 1.6], 0.45); }
      P(g, 'box', 0x8a6a50, [0, 0.5, -8.6], [6, 1.0, 3]); P(g, 'box', 0xb01c24, [0, 1.04, -8.6], [5.4, 0.08, 2.5]); P(g, 'box', 0xd8a020, [0, 2.2, -9.6], [2, 2.4, 0.5]); P(g, 'box', 0xb01c24, [0, 1.5, -9.2], [1.7, 0.9, 1.0]); }
    // the Gravity Room: a white capsule with a red band and a round door
    { const G = K.GRAV, g = at(G.x, G.z); P(g, 'sph', 0xe8ecf4, [0, 0, 0], [4, 3.6, 4]); P(g, 'cyl', 0xd21e28, [0, 1.2, 0], [3.86, 0.5, 3.86]); P(g, 'sph', 0x3e4658, [2.3, 1.1, 2.9], [0.8, 1.1, 0.4]); P(g, 'sph', TT.glow(0x6ad8ff), [0, 3.5, 0], [0.7, 0.4, 0.7]); solid(G.x, G.z, 3.9); }
    // the landing site: Bulma's ship and a green healing tank
    { const s = W.shipModel(false); s.position.set(K.LAND.x, 2.3, K.LAND.z); root.add(s); solid(K.LAND.x, K.LAND.z, 2.6);
      const M = K.MEDIC, g = at(M.x + 2.4, M.z - 0.6); P(g, 'cyl', 0x5a6478, [0, 0.25, 0], [1.1, 0.5, 1.1]); P(g, 'cyl', TT.glow(0x6af0a8), [0, 1.5, 0], [0.9, 2.0, 0.9]); P(g, 'cyl', 0x5a6478, [0, 2.7, 0], [1.1, 0.4, 1.1]); solid(M.x + 2.4, M.z - 0.6, 1.2); }
    // red thorn bushes and ash flowers where the wild Pokémon live
    for (const zn of W.zones) if (zn.x > 2500) for (let i = 0; i < 70; i++) { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * (zn.r - 0.5), x = zn.x + Math.cos(a) * r, z = zn.z + Math.sin(a) * r, g = at(x, z); if (i % 4) P(g, 'cone8', pick([0x8a2a22, 0xa83a2a, 0x5a4a50]), [0, 0.22, 0], [0.09, rand(0.35, 0.6), 0.09], [rand(-0.3, 0.3), 0, rand(-0.3, 0.3)]); else P(g, 'sph', pick([0xffb040, 0xf2e2a8, 0xd8d8e0]), [0, 0.28, 0], [0.12, 0.12, 0.12]); }
    for (const k in tiles) { const m = TT.bakeDeep(tiles[k]); if (m) { m.material = TT.swayMat; m.geometry.userData.own = true; m.castShadow = false; } }
    TT.freeze(root);
  };
  W.pvUnload = scene => {
    if (!root) return;
    scene.remove(root); root.traverse(o => { if (o.geometry && o.geometry.userData.own) o.geometry.dispose(); if (o.material && o.material.userData && o.material.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    for (const c of mine) { const i = W.colliders.indexOf(c); if (i >= 0) W.colliders.splice(i, 1); }
    mine = []; root = null;
  };

  const oldStages = W.buildStages;
  W.buildStages = function (scene) {
    oldStages(scene);
    const ST = W.STAGES, base = ST.plateau || ST.meadow;
    ST.pvArea = { tint: { sky: 0xf2a488, fog: 0xeab098, hemi: [0xffdcc4, 0x7a3a2a, 0.64], sun: [0xffcc98, 0.55], near: 60, far: 210 } };
    ST.arenaV = { x: base.x, z: base.z, key: 'arenaV', tint: { sky: 0xf2a488, fog: 0xe8a888, hemi: [0xffd8bc, 0x7a3a2a, 0.62], sun: [0xffc890, 0.6], near: 60, far: 260 } };
    ST.apeNight = { x: base.x, z: base.z, key: 'apeNight', tint: { sky: 0x3a3a78, fog: 0x23264a, hemi: [0xb0b8f0, 0x2a2a50, 0.58], sun: [0xe8ecff, 0.5], near: 50, far: 220 } };          // the arena under a full moon
  };
})();
