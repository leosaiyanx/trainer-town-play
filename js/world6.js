// world6.js — Chapter 2: the trip through space and Planet Namek.
// The space lane is light and is made with everything else. Namek's scenery is different: it is only built when a trainer
// flies there (W.namekLoad) and is thrown away when they leave (W.namekUnload), so the game starts no slower and the
// tablets do not have to hold a whole planet in memory while the children play at home.
(function () {
  const TT = window.TT, P = TT.P, rand = TT.rand, pick = TT.pick, W = TT.World;
  const { grp, chunk } = W.H;
  let seed = 23; const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (b - a) * (seed / 2147483647); };

  // ---------- the space lane: fly north from z0 to z1 between drifting rocks ----------
  const SP = W.SPACE = { z0: 2380, z1: 1980, cx: z => 2700 + Math.sin((z - 1980) * 0.017) * 12, half: 13, lo: 4, hi: 19, peaks: [], rings: [], space: 1 };
  for (let i = 0; i < 15; i++) {          // rocks in the way: round, so you can go over, under or round them
    const z = SP.z0 - 44 - i * 23 + rnd(-4, 4), x = SP.cx(z) + rnd(-9, 9), y = rnd(6, 17), r = rnd(1.6, 3.2), g = grp(chunk(x, z), x, y, z);
    P(g, 'rock', pick([0x8a7a6a, 0x7a6e66, 0x9a8a78]), [0, 0, 0], [r, r * rnd(0.75, 1), r * rnd(0.8, 1.1)], [rnd(0, 3), rnd(0, 3), rnd(0, 3)]); P(g, 'rock', 0x6a5e56, [r * 0.5, r * 0.3, 0.2], [r * 0.45, r * 0.4, r * 0.45], [rnd(0, 3), rnd(0, 3), 0]);
    SP.peaks.push({ x, y, z, r: r * 0.95 });
  }
  for (let i = 0; i < 70; i++) {          // more rocks out to the sides, just to look at
    const z = SP.z1 - 30 + rnd(0, SP.z0 - SP.z1 + 60), s = rnd(0, 1) < 0.5 ? 1 : -1, x = SP.cx(z) + s * rnd(SP.half + 6, 60), y = rnd(-14, 34), r = rnd(1, 5), g = grp(chunk(x, z), x, y, z);
    P(g, 'rock', pick([0x8a7a6a, 0x7a6e66, 0x9a8a78, 0x6a6470]), [0, 0, 0], [r, r * rnd(0.7, 1), r * rnd(0.8, 1.1)], [rnd(0, 3), rnd(0, 3), rnd(0, 3)]);
  }
  for (let i = 0; i < 12; i++) { const z = SP.z0 - 34 - i * 29; let x = SP.cx(z) + rnd(-8, 8), y = rnd(6.5, 16.5); for (const o of SP.peaks) if (Math.hypot(o.x - x, o.y - y, o.z - z) < o.r + 3.4) { x = o.x + (x >= o.x ? 1 : -1) * (o.r + 3.6); } SP.rings.push([x, y, z]); }

  // the round spaceship Bulma repaired. flying = legs tucked away and an engine glow underneath.
  W.shipModel = flying => {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    P(b, 'sph', 0xf2f4f8, [0, 0, 0], [2.1, 2.1, 2.1]); P(b, 'cyl', 0xd8dde8, [0, 0, 0], [2.22, 0.36, 2.22]); P(b, 'box', 0xd21e28, [0, 1.5, 1.42], [1.1, 0.42, 0.1], [-0.7, 0, 0]);
    for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785; if (flying) P(b, 'cyl', 0x8a92a4, [Math.cos(a) * 1.3, -1.75, Math.sin(a) * 1.3], [0.12, 0.5, 0.12]); else { P(b, 'cyl', 0x8a92a4, [Math.cos(a) * 1.8, -1.65, Math.sin(a) * 1.8], [0.1, 1.4, 0.1], [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]); P(b, 'cyl', 0x4a5062, [Math.cos(a) * 2.15, -2.25, Math.sin(a) * 2.15], [0.36, 0.1, 0.36]); } }
    TT.bakeDeep(b);
    for (let i = 0; i < 6; i++) { const a = i * 1.047; P(g, 'sphS', TT.glow(0x8adfff), [Math.cos(a) * 1.78, 0.8, Math.sin(a) * 1.78], 0.3); }
    if (flying) { g.userData.flame = P(g, 'cone', TT.glow(0xffb040), [0, -2.5, 0], [0.9, 2.2, 0.9], [Math.PI, 0, 0]); P(g, 'cone', TT.glow(0xfff2a0), [0, -2.3, 0], [0.5, 1.4, 0.5], [Math.PI, 0, 0]); }
    return g;
  };

  // ---------- Planet Namek: where things are ----------
  const NK = W.NAMEK = { x0: 1946, x1: 2054, z0: -154, z1: -46, cx: 2000, cz: -100, spawn: [1963, -63] };
  W.NK = { LAND: { x: 1957, z: -57 }, DENDE: { x: 1969, z: -69 }, GUARD: { x: 1987, z: -77 }, ELDER: { x: 1997, z: -90.6 }, ALTAR: { x: 2006, z: -74 }, LAKE: { x: 2030, z: -68, rx: 13, rz: 9 },
    PICCOLO: { x: 1962, z: -136 }, ZARBON: { x: 2014, z: -116 }, DODORIA: { x: 2036, z: -122 }, FRIEZA: { x: 2031, z: -139 }, FSHIP: { x: 2040, z: -145 }, HID1: { x: 1952, z: -148 }, HID2: { x: 2048, z: -56 } };
  const K = W.NK, HOUSES = [[1989, -88, 1], [2005, -88, 1], [1986, -98, 0.9], [2008, -99, 0.9], [1997, -96, 1.5]];
  const inLake = (x, z, m) => { const L = K.LAKE, dx = (x - L.x) / (L.rx + m), dz = (z - L.z) / (L.rz + m); return dx * dx + dz * dz < 1; };
  const wwN = W.wwCollide;
  W.wwCollide = (x, z, r) => {
    if (x < 1500) return wwN(x, z, r);
    x = TT.clamp(x, NK.x0 + 2, NK.x1 - 2); z = TT.clamp(z, NK.z0 + 2, NK.z1 - 2);
    if (inLake(x, z, 0.4)) { const L = K.LAKE, a = Math.atan2((z - L.z) / L.rz, (x - L.x) / L.rx); x = L.x + Math.cos(a) * (L.rx + 0.5); z = L.z + Math.sin(a) * (L.rz + 0.5); }
    return [x, z];
  };
  const stN = W.stageAt; W.stageAt = (x, z) => x > 1500 ? 'namek' : stN(x, z);

  // wild Pokémon live in these two places. lazy: they are only put there while the planet is loaded.
  W.zones.push(
    { name: 'Blue Meadow', noGrass: 1, lazy: 'namek', x: 1975, z: -110, r: 11, n: 4, lv: [33, 38], pool: ['treecko', 'clefairy', 'oddish', 'butterfree', 'elgyem', 'abra'], rare: ['grovyle', 0.14] },
    { name: 'Green Shore', noGrass: 1, lazy: 'namek', x: 2029, z: -90, r: 10, n: 4, lv: [34, 39], pool: ['staryu', 'psyduck', 'poliwag', 'clefairy', 'dratini', 'elgyem'], rare: ['dragonair', 0.12] });
  // the people of Namek (and Frieza's crew). Like the scenery, they are only made when the planet is loaded.
  W.NAMEK_NPCS = [['dende', 'dende', 'Dende', K.DENDE.x, K.DENDE.z, 0, []], ['nguard', 'fsoldier', "Frieza's Soldier", K.GUARD.x, K.GUARD.z, 0, []], ['elder', 'elder', 'Elder Moori', K.ELDER.x, K.ELDER.z, 0, []],
    ['piccolo', 'piccolo', 'Piccolo', K.PICCOLO.x, K.PICCOLO.z, 0, []], ['zarbon', 'zarbon', 'Zarbon', K.ZARBON.x, K.ZARBON.z, 0, []], ['dodoria', 'dodoria', 'Dodoria', K.DODORIA.x, K.DODORIA.z, 0, []], ['frieza', 'frieza', 'Frieza', K.FRIEZA.x, K.FRIEZA.z, 0, []]];
  W.NAMEK_PLACES = [
    ['Landing Site', K.LAND.x, K.LAND.z, '🚀', "Bulma's spaceship waits here to take you home.", NK.spawn[0], NK.spawn[1]],
    ['Namekian Village', 1997, -92, '🏠', 'Elder Moori and the villagers live in these round houses.', 1997, -84],
    ["The Dragon's Stones", K.ALTAR.x, K.ALTAR.z, '🐉', 'Bring all seven Namekian Dragon Balls here.', K.ALTAR.x - 3, K.ALTAR.z + 3],
    ['Blue Meadow', 1975, -110, '🌿', 'Treecko, Clefairy, Oddish, Butterfree, Elgyem and Abra.', 1975, -110],
    ['Green Shore', 2029, -90, '🌊', 'Staryu, Psyduck, Poliwag, Clefairy, Dratini and Elgyem.', 2029, -90],
    ["Piccolo's Rocks", K.PICCOLO.x, K.PICCOLO.z, '🪨', 'Piccolo trains here, alone.', K.PICCOLO.x + 3, K.PICCOLO.z + 3],
    ["Frieza's Ship", K.FSHIP.x, K.FSHIP.z, '🛸', 'The ruler of space has landed.', K.FRIEZA.x - 3, K.FRIEZA.z + 4]];

  // ---------- the ground picture (also used for the map). Made the first time it is needed. ----------
  W.namekCanvasGet = () => {
    if (W.namekCanvas) return W.namekCanvas;
    const c = W.namekCanvas = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), k = 1024 / 108, X = v => (v - NK.x0) * k, Z = v => (v - NK.z0) * k;
    x.fillStyle = '#53b3ae'; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 260; i++) { const X0 = Math.random() * 1024, Y0 = Math.random() * 1024, R = rand(30, 110), g = x.createRadialGradient(X0, Y0, 0, X0, Y0, R); g.addColorStop(0, i % 2 ? 'rgba(52,150,160,.4)' : 'rgba(120,210,190,.4)'); g.addColorStop(1, 'rgba(83,179,174,0)'); x.fillStyle = g; x.fillRect(X0 - R, Y0 - R, R * 2, R * 2); }
    for (let i = 0; i < 5200; i++) { x.fillStyle = i % 3 ? 'rgba(40,128,140,.35)' : 'rgba(170,236,214,.55)'; x.beginPath(); x.ellipse(Math.random() * 1024, Math.random() * 1024, rand(1, 4), rand(1, 3), rand(0, 3), 0, 7); x.fill(); }
    for (const zn of W.zones) if (zn.x > 1500) { const g = x.createRadialGradient(X(zn.x), Z(zn.z), zn.r * k * 0.5, X(zn.x), Z(zn.z), zn.r * k * 1.05); g.addColorStop(0, zn.name === 'Green Shore' ? 'rgba(150,226,196,.85)' : 'rgba(46,132,150,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(X(zn.x), Z(zn.z), zn.r * k * 1.05, 0, 7); x.fill(); }
    // a sandy rim where the land meets the sea
    for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(226,232,190,' + (0.55 * (1 - i / 26)) + ')'; x.lineWidth = 2; x.strokeRect(i, i, 1024 - i * 2, 1024 - i * 2); }
    // the lake
    { const L = K.LAKE, g = x.createRadialGradient(X(L.x), Z(L.z), 6, X(L.x), Z(L.z), L.rx * k); g.addColorStop(0, '#4fcf96'); g.addColorStop(0.85, '#66dca4'); g.addColorStop(1, '#d4f2c4'); x.fillStyle = g; x.beginPath(); x.ellipse(X(L.x), Z(L.z), L.rx * k, L.rz * k, 0, 0, 7); x.fill(); }
    // paths: landing → village → the stones; village → north to Frieza's ship; village → west to Piccolo
    const trail = (pts, w) => { for (const [lw, col] of [[w * k + 8, 'rgba(60,130,130,.45)'], [w * k, '#e6dcae']]) { x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = x.lineCap = 'round'; x.beginPath(); pts.forEach((q, j) => j ? x.lineTo(X(q[0]), Z(q[1])) : x.moveTo(X(q[0]), Z(q[1]))); x.stroke(); } };
    trail([[1963, -63], [1975, -72], [1987, -80], [1997, -86]], 3.4); trail([[1997, -86], [2006, -76]], 2.6); trail([[1997, -86], [2006, -104], [2014, -113], [2026, -128], [2031, -136]], 3.2); trail([[1987, -98], [1974, -122], [1964, -133]], 2.8);
    { const A = K.ALTAR; x.fillStyle = '#c9cdb8'; x.beginPath(); x.arc(X(A.x), Z(A.z), 4.2 * k, 0, 7); x.fill(); x.strokeStyle = '#8f9a86'; x.lineWidth = 4; x.stroke(); }
    return c;
  };

  // ---------- building and removing the scenery ----------
  let root = null, mine = [], tex = null;
  const solid = (x, z, r) => { const c = { x, z, r }; W.colliders.push(c); mine.push(c); };
  const clear = (x, z, list, d) => list.every(q => Math.hypot(q[0] - x, q[1] - z) > (q[2] || d));
  W.namekOn = () => !!root;
  W.namekLoad = scene => {
    if (root) return;
    root = new THREE.Group(); scene.add(root);
    const tiles = {}, tile = (x, z) => { const k = Math.floor(x / 27) + '_' + Math.floor(z / 27); return tiles[k] || (tiles[k] = grp(root, 0, 0, 0)); }, at = (x, z) => grp(tile(x, z), x, 0, z);
    // the green sea and the land
    { const sea = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshLambertMaterial({ color: 0x62d494 })); sea.material.userData.own = sea.geometry.userData.own = true; sea.rotation.x = -Math.PI / 2; sea.position.set(NK.cx, 0.004, NK.cz); root.add(sea);
      tex = new THREE.CanvasTexture(W.namekCanvasGet()); tex.anisotropy = 4; const gm = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), new THREE.MeshLambertMaterial({ map: tex })); gm.material.userData.own = gm.geometry.userData.own = true; gm.rotation.x = -Math.PI / 2; gm.position.set(NK.cx, 0.016, NK.cz); gm.receiveShadow = true; root.add(gm); }
    const keep = [[K.LAND.x, K.LAND.z, 9], [1997, -92, 16], [K.ALTAR.x, K.ALTAR.z, 12], [K.LAKE.x, K.LAKE.z, 16], [K.PICCOLO.x, K.PICCOLO.z, 8], [K.ZARBON.x, K.ZARBON.z, 5], [K.DODORIA.x, K.DODORIA.z, 5], [K.FSHIP.x, K.FSHIP.z, 13], [K.FRIEZA.x, K.FRIEZA.z, 6], [K.DENDE.x, K.DENDE.z, 4], [K.GUARD.x, K.GUARD.z, 4],
      [1975, -72, 4], [1987, -80, 4], [2006, -104, 4], [2014, -113, 4], [2026, -128, 4], [1974, -122, 4], [1975, -110, 5], [2029, -90, 5], [K.HID1.x, K.HID1.z, 3], [K.HID2.x, K.HID2.z, 3]];
    // Namek's trees: a tall pale trunk with one to three dark blue-green balls of leaves
    const tree = (x, z, k) => { const g = at(x, z); g.rotation.y = rand(0, 6); P(g, 'trunk', 0xd8d2b0, [0, 1.7 * k, 0], [0.13 * k, 3.4 * k, 0.13 * k], [0, 0, rand(-0.06, 0.06)]); const n = 1 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) P(g, 'sph', pick([0x1f7a78, 0x268a80, 0x1a6a70]), [(i - (n - 1) / 2) * 0.55 * k, (3.5 + (i % 2) * 0.5) * k, (i % 2) * 0.3 * k], [0.75 * k, 0.62 * k, 0.75 * k]); solid(x, z, 0.35 * k); W.trees.push([x, z, k, 'leaf']); };
    for (let i = 0; i < 120; i++) { const x = rand(NK.x0 + 3, NK.x1 - 3), z = rand(NK.z0 + 3, NK.z1 - 3); if (clear(x, z, keep, 4) && !inLake(x, z, 2)) tree(x, z, rand(0.85, 1.4)); }
    // tall thin rock spires, alone and in clumps
    const spire = (x, z, r, h) => { const g = at(x, z); P(g, 'cyl', pick([0x8fa8a0, 0x9ab4a8, 0x86a09c]), [0, h / 2, 0], [r, h, r * 0.9]); P(g, 'cone8', 0xa8c0b4, [0, h + r * 0.5, 0], [r, r, r * 0.9]); P(g, 'cyl', 0x7a9690, [0, 0.2, 0], [r * 1.3, 0.4, r * 1.2]); solid(x, z, r * 1.1); };
    for (let i = 0; i < 26; i++) { const x = rand(NK.x0 + 3, NK.x1 - 3), z = rand(NK.z0 + 3, NK.z1 - 3); if (clear(x, z, keep, 5) && !inLake(x, z, 2)) spire(x, z, rand(0.6, 1.3), rand(3, 8)); }
    for (let a = 0.6; a < 5.4; a += 0.5) spire(K.PICCOLO.x + Math.cos(a + 1.3) * 6.6, K.PICCOLO.z + Math.sin(a + 1.3) * 6.6, rand(0.8, 1.3), rand(4, 9));          // a ring of spires round Piccolo's training spot, open to the south-east
    for (const [dx, dz] of [[-2.4, 1.6], [2.2, 1.9], [0.3, -2.6]]) { spire(K.HID1.x + dx, K.HID1.z + dz, 0.8, rand(2.4, 4)); spire(K.HID2.x + dx, K.HID2.z + dz, 0.8, rand(2.4, 4)); }
    // islands with spires far out to sea, all the way round
    for (let a = 0; a < 6.28; a += 0.3) { const d = rand(84, 130), x = NK.cx + Math.cos(a) * d, z = NK.cz + Math.sin(a) * d, g = at(x, z), r = rand(5, 11); P(g, 'cyl', 0x53b3ae, [0, 0.25, 0], [r, 0.5, r]); for (let i = 0; i < 3; i++) P(g, 'cyl', 0x8fa8a0, [rand(-r, r) * 0.5, rand(5, 13), rand(-r, r) * 0.5], [rand(0.8, 2), rand(10, 26), rand(0.8, 2)]); }
    // the village: white round houses with four stubby horns and a dark doorway
    for (const [hx, hz, k] of HOUSES) { const g = at(hx, hz); P(g, 'sph', 0xf2f0e6, [0, 0, 0], [2.6 * k, 2.3 * k, 2.6 * k]); P(g, 'sph', 0x3a4a4a, [0, 0.9 * k, 2.36 * k], [0.62 * k, 0.9 * k, 0.3 * k]); for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785; P(g, 'cone8', 0xe2decc, [Math.cos(a) * 1.9 * k, 1.75 * k, Math.sin(a) * 1.9 * k], [0.34 * k, 0.9 * k, 0.34 * k], [Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75]); }
      for (const s of [1, -1]) P(g, 'sph', 0x8adfd0, [s * 1.5 * k, 1.35 * k, 1.75 * k], [0.3 * k, 0.3 * k, 0.12 * k]); solid(hx, hz, 2.5 * k); }
    // the Dragon's stones: a ring of seven low stones where the Dragon Balls are set down
    { const A = K.ALTAR, g = at(A.x, A.z); P(g, 'cyl', 0xc9cdb8, [0, 0.1, 0], [4.2, 0.2, 4.2]); for (let i = 0; i < 7; i++) { const a = i * 0.898; P(g, 'cyl', 0x9aa890, [Math.cos(a) * 2.6, 0.35, Math.sin(a) * 2.6], [0.5, 0.5, 0.5]); } }
    // Bulma's ship at the landing site, and Frieza's great saucer in the north-east
    { const s = W.shipModel(false); s.position.set(K.LAND.x, 2.3, K.LAND.z); root.add(s); solid(K.LAND.x, K.LAND.z, 2.6); }
    { const F = K.FSHIP, g = at(F.x, F.z); P(g, 'sph', 0xf0ece0, [0, 3.2, 0], [9, 3.4, 9]); P(g, 'sph', 0xd8d2c0, [0, 5.2, 0], [4.6, 2.6, 4.6]); P(g, 'cyl', 0x8a5a9a, [0, 3.2, 0], [9.3, 0.5, 9.3]);
      for (let i = 0; i < 10; i++) { const a = i * 0.628; P(g, 'sph', 0xe8842a, [Math.cos(a) * 7.4, 4.3, Math.sin(a) * 7.4], [0.75, 0.75, 0.5]); } for (let i = 0; i < 5; i++) { const a = i * 1.2566 + 0.5; P(g, 'cyl', 0x7a7a8a, [Math.cos(a) * 6, 0.9, Math.sin(a) * 6], [0.3, 1.8, 0.3]); P(g, 'cyl', 0x5a5a6a, [Math.cos(a) * 6, 0.08, Math.sin(a) * 6], [0.8, 0.16, 0.8]); solid(F.x + Math.cos(a) * 6, F.z + Math.sin(a) * 6, 0.9); }
      P(g, 'box', 0x7a7a8a, [-5.4, 0.8, 5.6], [2.4, 0.16, 5], [0.3, -0.75, 0]); solid(F.x, F.z, 5.2); }
    // bright little plants in place of tall grass, where the wild Pokémon live
    for (const zn of W.zones) if (zn.x > 1500) for (let i = 0; i < 70; i++) { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * (zn.r - 0.5), x = zn.x + Math.cos(a) * r, z = zn.z + Math.sin(a) * r, g = at(x, z); if (i % 4) P(g, 'cone8', pick([0x2a8a90, 0x34a0a0, 0x1f7a80]), [0, 0.24, 0], [0.09, rand(0.4, 0.65), 0.09], [rand(-0.25, 0.25), 0, rand(-0.25, 0.25)]); else P(g, 'sph', pick([0xf8c2d2, 0xfff0a0, 0xc8f4ff]), [0, 0.3, 0], [0.13, 0.13, 0.13]); }
    // merge every tile into one mesh so the whole planet costs only a few draws
    for (const k in tiles) { const m = TT.bakeDeep(tiles[k]); if (m) { m.material = TT.swayMat; m.geometry.userData.own = true; m.castShadow = false; } }
    TT.freeze(root);
  };
  W.namekUnload = scene => {
    if (!root) return;
    scene.remove(root); root.traverse(o => { if (o.geometry && o.geometry.userData.own) o.geometry.dispose(); if (o.material && o.material.userData && o.material.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    for (const c of mine) { const i = W.colliders.indexOf(c); if (i >= 0) W.colliders.splice(i, 1); }
    W.trees = W.trees.filter(t => t[0] < 1500); mine = []; root = null; tex = null;
  };

  // the mood of each new place: a green sky for Namek, black for space
  const oldStages = W.buildStages;          // the battle arenas are made after the world, so this is where the new ones are added
  W.buildStages = function (scene) {
    oldStages(scene);
    const ST = W.STAGES;
    ST.namekArea = { tint: { sky: 0x9af0b4, fog: 0xb4f2c8, hemi: [0xe2ffe8, 0x4a9a8c, 0.64], sun: [0xfff8d8, 0.5], near: 60, far: 210 } };
    ST.space = { tint: { sky: 0x161a38, fog: 0x0a0c1c, hemi: [0x9aa8e8, 0x202448, 0.62], sun: [0xffffff, 0.55], near: 90, far: 420 } };
    const base = ST.river || ST.meadow; ST.namek = { x: base.x, z: base.z, key: 'namek', tint: { sky: 0x9af0b4, fog: 0xb4f2c8, hemi: [0xbff4e4, 0x3a8a9a, 0.66], sun: [0xe8fff0, 0.46], near: 60, far: 210 } };
  };
})();
