// world3.js — the Volcano and the Dragon's Lair (reached through a tunnel from the Wide World), plus their battle stages.
// It is a separate patch of land far to the east; you travel there through the tunnel or by flying.
(function () {
  const TT = window.TT, P = TT.P, rand = TT.rand, pick = TT.pick, W = TT.World;
  const { grp, chunk, rock, sign } = W.H;
  const ss = (a, b, v) => { const t = TT.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const V = W.VOLC = { x0: 326, x1: 434, z0: -154, z1: -46, cx: 380, cz: -100 };
  W.TUNNEL = { x: 246.2, z: -45 };          // cave mouth in the Wide World
  W.VOL_IN = { x: 331, z: -100 };           // where you come out in the Volcano
  W.VOL_EXIT = { x: 327.2, z: -100 };       // walk into this to go back
  W.VEGETA = { x: 386, z: -100 };
  W.ALTAR = { x: 420, z: -100, r: 7 };
  W.lavaX = z => 399 + 4 * Math.sin(z * 0.07) + 2 * Math.sin(z * 0.19);
  const LW = 3.4, BRIDGE = -100;

  // ---------- walking rules ----------
  const ww0 = W.wwCollide;
  W.wwCollide = (x, z, r) => {
    if (x < 300) return ww0(x, z, r);
    x = TT.clamp(x, V.x0, V.x1); z = TT.clamp(z, V.z0, V.z1);
    const lx = W.lavaX(z), d = x - lx;
    if (Math.abs(d) < LW + r) {                                        // lava: cross on the stone bridge only
      if (Math.abs(z - BRIDGE) > 3) x = lx + Math.sign(d || 1) * (LW + r);
      else if (Math.abs(z - BRIDGE) > 1.8) z = BRIDGE + Math.sign(z - BRIDGE) * 1.8;
    }
    return [x, z];
  };
  const gy0 = W.gy;
  W.gy = (x, z) => x < 300 ? gy0(x, z) : (Math.abs(z - BRIDGE) < 2.3 && Math.abs(x - W.lavaX(BRIDGE)) < 6 ? 0.42 : Math.hypot(x - W.ALTAR.x, z - W.ALTAR.z) < W.ALTAR.r ? 0.14 : 0);
  const st0 = W.stageAt;
  W.stageAt = (x, z) => x > 300 ? (Math.hypot(x - W.ALTAR.x, z - W.ALTAR.z) < 14 ? 'lair' : 'volcano') : st0(x, z);
  const ap0 = W.applyStage;
  W.applyStage = key => { W.stageNow = key || null; ap0(key); };

  // ---------- data ----------
  W.zones.push(
    { name: 'Ash Field', noGrass: 1, x: 352, z: -70, r: 12, n: 4, lv: [14, 18], pool: ['vulpix', 'vulpix', 'growlithe', 'ponyta', 'charmander', 'magnemite'], rare: ['charmeleon', 0.15] },
    { name: 'Boulder Yard', noGrass: 1, x: 356, z: -132, r: 12, n: 4, lv: [14, 18], pool: ['geodude', 'geodude', 'onix', 'machop', 'onix'], rare: ['machoke', 0.12] });
  W.NPCS.push(
    ['krillin', 'krillin', 'Krillin', 242.5, -47.6, 0, []],
    ['bulma', 'bulma', 'Bulma', 14.5, -101, 0, []],
    ['vegeta', 'vegeta', 'Vegeta', W.VEGETA.x, W.VEGETA.z, 0, []]);
  W.VOLC_PLACES = [
    ['Tunnel', 329, -100, '🕳', 'Back to the Wide World.', 331, -100],
    ['Ash Field', 352, -70, '🔥', 'Vulpix, Growlithe, Ponyta and Charmander.', 352, -70],
    ['Boulder Yard', 356, -132, '🪨', 'Geodude, Onix and Machop.', 356, -132],
    ["Vegeta's Bridge", 392, -92, '⚔', 'Vegeta guards the only way across the lava.', 383, -100],
    ["Dragon's Lair", 420, -110, '🐉', 'Bring all 7 Dragon Balls to the altar.', 414, -100]];
  // hiding places the Dragon Balls fly off to after a wish: [x, z, hint]
  W.SCATTER = [[-49, 44, 'the West Meadow'], [47, 33, 'the trees behind the pond'], [-44, -44, 'the North Field'], [44, -44, 'the Sunny Grove'], [0, 50, 'the south road'],
    [-40, -112, 'City Park'], [40, -150, 'the east side of the City'], [-44, -160, 'the west side of the City'], [24, -76, 'the City shops'],
    [100, -150, 'the Windy Meadow'], [124, -50, 'the Riverbank'], [190, -30, 'the Whisper Forest'], [176, -134, 'the Rocky Slope'], [226, -92, "Goku's Peak"], [214, -176, 'the Rocket hideout'], [236, -28, 'the far corner of the Wide World'],
    [344, -52, 'the Ash Field'], [344, -148, 'the Boulder Yard'], [428, -52, 'the far side of the lava'], [428, -148, 'the far side of the lava']];

  // ---------- textures ----------
  function groundTex() {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), k = 1024 / 150, X = v => (v - (V.cx - 75)) * k, Z = v => (v - (V.cz - 75)) * k;
    x.fillStyle = '#5a4640'; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 380; i++) { const X0 = Math.random() * 1024, Y0 = Math.random() * 1024, R = rand(30, 110), g = x.createRadialGradient(X0, Y0, 0, X0, Y0, R); g.addColorStop(0, i % 2 ? 'rgba(120,96,84,.3)' : 'rgba(40,30,28,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(X0 - R, Y0 - R, R * 2, R * 2); }
    for (let i = 0; i < 9000; i++) { x.fillStyle = i % 3 ? 'rgba(30,22,20,.4)' : 'rgba(170,150,135,.35)'; x.beginPath(); x.ellipse(Math.random() * 1024, Math.random() * 1024, rand(1, 4), rand(1, 3), rand(0, 3), 0, 7); x.fill(); }
    // glowing cracks
    x.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      let px = rand(0, 1024), py = rand(0, 1024); const pts = [[px, py]]; for (let j = 0; j < 5; j++) { px += rand(-46, 46); py += rand(-46, 46); pts.push([px, py]); }
      for (const [w, col] of [[9, 'rgba(255,90,20,.22)'], [4, 'rgba(255,140,40,.6)'], [1.5, 'rgba(255,230,140,.9)']]) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); }
    }
    // the trail: tunnel -> Vegeta's bridge -> the lair, with side trails to the two wild areas
    const trail = (pts, w) => { for (const [lw, col] of [[w * k + 8, 'rgba(60,46,40,.5)'], [w * k, '#9a8474']]) { x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = 'round'; x.beginPath(); pts.forEach((q, j) => j ? x.lineTo(X(q[0]), Z(q[1])) : x.moveTo(X(q[0]), Z(q[1]))); x.stroke(); } };
    trail([[326, -100], [396, -100]], 4.2); trail([[402, -100], [414, -100]], 4.2); trail([[344, -100], [352, -76]], 2.8); trail([[346, -100], [356, -126]], 2.8);
    for (let i = 0; i < 700; i++) { const q = Math.random(), px = 326 + q * 88, pz = -100 + rand(-1.9, 1.9); x.fillStyle = 'rgba(190,170,150,.5)'; x.beginPath(); x.ellipse(X(px), Z(pz), rand(2, 6), rand(1.5, 4), 0, 0, 7); x.fill(); }
    // lava banks: scorched black
    for (let z = V.cz - 75; z < V.cz + 75; z += 0.7) { const lx = W.lavaX(z), g = x.createLinearGradient(X(lx - 7), 0, X(lx + 7), 0); g.addColorStop(0, 'rgba(20,12,10,0)'); g.addColorStop(0.3, 'rgba(20,12,10,.85)'); g.addColorStop(0.7, 'rgba(20,12,10,.85)'); g.addColorStop(1, 'rgba(20,12,10,0)'); x.fillStyle = g; x.fillRect(X(lx - 7), Z(z), 14 * k, 0.7 * k + 1); }
    // tall-grass stand-ins: ash and gravel patches where wild Pokémon live
    for (const zn of W.zones) if (zn.x > 300 && zn.x < 470) { const g = x.createRadialGradient(X(zn.x), Z(zn.z), zn.r * k * 0.6, X(zn.x), Z(zn.z), zn.r * k * 1.05); g.addColorStop(0, zn.name === 'Ash Field' ? 'rgba(150,84,60,.85)' : 'rgba(120,112,108,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(X(zn.x), Z(zn.z), zn.r * k * 1.06, 0, 7); x.fill(); }
    // the altar's stone floor
    { const ax = X(W.ALTAR.x), az = Z(W.ALTAR.z), R = (W.ALTAR.r + 3) * k, g = x.createRadialGradient(ax, az, R * 0.5, ax, az, R); g.addColorStop(0, 'rgba(40,34,52,.9)'); g.addColorStop(1, 'rgba(40,34,52,0)'); x.fillStyle = g; x.fillRect(ax - R, az - R, R * 2, R * 2); }
    W.volcCanvas = c; const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  W.lavaTex = () => {
    if (!W._lt) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#5a1408'); g.addColorStop(0.15, '#e8501a'); g.addColorStop(0.5, '#ffb030'); g.addColorStop(0.85, '#e8501a'); g.addColorStop(1, '#5a1408');
      x.fillStyle = g; x.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 60; i++) { x.fillStyle = i % 3 ? 'rgba(255,240,150,.55)' : 'rgba(90,20,8,.5)'; x.beginPath(); x.ellipse(rand(6, 58), rand(0, 256), rand(2, 8), rand(6, 20), 0, 0, 7); x.fill(); }
      W._lt = c;
    }
    const t = new THREE.CanvasTexture(W._lt); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  };

  // ---------- props ----------
  const ROCKS = [0x6a5850, 0x5a4a44, 0x7a665c, 0x4a3c38];
  function boulder(x, z, k, solid) { const g = grp(chunk(x, z), x, 0, z); P(g, 'rock', pick(ROCKS), [0, 0.3 * k, 0], [k * rand(0.6, 0.9), k * rand(0.5, 0.8), k * rand(0.55, 0.85)], [rand(0, 3), rand(0, 3), 0]); if (solid) W.colliders.push({ x, z, r: 0.55 * k }); }
  function spire(x, z, k) { const g = grp(chunk(x, z), x, 0, z); g.rotation.y = rand(0, 6); P(g, 'cone8', pick(ROCKS), [0, 1.5 * k, 0], [0.9 * k, 3 * k, 0.9 * k]); P(g, 'cone8', pick(ROCKS), [0.6 * k, 0.8 * k, 0.2 * k], [0.5 * k, 1.6 * k, 0.5 * k], [0, 0, -0.2]); W.colliders.push({ x, z, r: 0.8 * k }); }
  function deadTree(x, z, k) { const g = grp(chunk(x, z), x, 0, z); g.rotation.y = rand(0, 6); P(g, 'trunk', 0x3a2c28, [0, 1.1 * k, 0], [0.22 * k, 2.2 * k, 0.22 * k]); for (const [a, b] of [[0.9, 1.5], [-0.8, 1.9], [0.4, 2.3]]) P(g, 'trunk', 0x3a2c28, [a * 0.3 * k, b * k, 0], [0.07 * k, 0.9 * k, 0.07 * k], [0, 0, -a]); W.colliders.push({ x, z, r: 0.4 }); }
  // the cave mouth used at both ends of the tunnel; (x, z) is the opening, ry turns it
  function cave(scene, x, z, ry, y) {
    const g = grp(chunk(x, z), x, y || 0, z); g.rotation.y = ry;
    for (let i = 0; i < 9; i++) { const a = Math.PI * i / 8; P(g, 'rock', ROCKS[i % 4], [Math.cos(a) * 2.6, Math.sin(a) * 2.9 + 0.2, 0], [1.25, 1.1, 1.3], [i, i * 2, 0]); }
    P(g, 'box', 0x0c0a10, [0, 1.5, -0.5], [4.2, 3.6, 0.3]);
    for (const s of [1, -1]) { P(g, 'cyl', 0x5a4030, [s * 2.9, 1.1, 0.9], [0.09, 2.2, 0.09]); P(g, 'sph', 0xff9a1f, [s * 2.9, 2.3, 0.9], 0.2); }
  }

  const oldWorld = W.buildWorld;
  W.buildWorld = function* (scene) {
    // a trail to the tunnel in the Wide World's north-east corner must exist before its trees are planted
    if (oldWorld) yield* oldWorld(scene);
    yield 'Heating up the Volcano';
    // ---- tunnel mouth in the Wide World, blocked by boulders until Goku clears it ----
    cave(scene, W.TUNNEL.x + 2.2, W.TUNNEL.z, -Math.PI / 2, W.h(W.TUNNEL.x + 2.2, W.TUNNEL.z) - 0.2);
    sign(scene, W.TUNNEL.x - 4.5, W.TUNNEL.z + 3.2, 'Volcano Tunnel');
    { const g = new THREE.Group(), y = W.h(W.TUNNEL.x, W.TUNNEL.z); g.position.set(W.TUNNEL.x + 0.6, y, W.TUNNEL.z);
      for (const q of [[0, 0.7, 0, 1.3], [-0.2, 0.6, 1.3, 1.1], [0.1, 0.6, -1.3, 1.1], [0.2, 1.9, 0.5, 1.0], [0, 1.9, -0.7, 0.9], [0.3, 2.9, 0, 0.8]]) P(g, 'rock', ROCKS[(q[3] * 10 | 0) % 4], [q[0], q[1], q[2]], q[3], [q[1], q[2], 0]);
      TT.bakeDeep(g); g.userData.live = true; scene.add(g); W.tunnelRocks = g; W.tunnelCol = { x: W.TUNNEL.x + 0.4, z: W.TUNNEL.z, r: 2.2 }; W.colliders.push(W.tunnelCol); }

    // ---- the Volcano's ground ----
    const under = new THREE.Mesh(new THREE.PlaneGeometry(190, 190), new THREE.MeshLambertMaterial({ color: 0x4a3a36 })); under.rotation.x = -Math.PI / 2; under.position.set(V.cx, 0.006, V.cz); scene.add(under);
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshLambertMaterial({ map: groundTex() })); gm.rotation.x = -Math.PI / 2; gm.position.set(V.cx, 0.016, V.cz); gm.receiveShadow = true; scene.add(gm);
    W.volcLand = [under, gm];
    // ---- lava river (flowing) and its stone bridge ----
    { const segs = 60, z0 = V.cz - 75, z1 = V.cz + 75, wv = [], uv = [], idx = [];
      for (let i = 0; i <= segs; i++) { const z = z0 + (z1 - z0) * i / segs, lx = W.lavaX(z); wv.push(lx - LW - 0.3, 0.05, z, lx + LW + 0.3, 0.05, z); uv.push(0, i * 0.4, 1, i * 0.4); if (i < segs) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const tx = W.lavaTex(), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tx })); scene.add(m); W.volcLand.push(m);
      W.anim.push(t => { tx.offset.y = -t * 0.12; });
      const bx = W.lavaX(BRIDGE), b = grp(chunk(bx, BRIDGE), bx, 0, BRIDGE);
      P(b, 'box', 0x8a7a70, [0, 0.3, 0], [12.4, 0.26, 4.2]); for (const s of [1, -1]) { P(b, 'box', 0x6a5a52, [0, 0.62, s * 2.05], [12.4, 0.4, 0.3]); for (let i = -2; i <= 2; i++) P(b, 'box', 0x5a4a44, [i * 2.9, 0.75, s * 2.05], [0.45, 0.7, 0.45]); }
      for (const s of [1, -1]) P(b, 'box', 0x7a6a60, [s * 6.4, 0.16, 0], [1.2, 0.3, 4.2], [0, 0, -s * 0.22]);
      // bubbles of light on the lava
      const glow = []; for (let i = 0; i < 10; i++) glow.push(P(scene, 'sphS', TT.glow(i % 2 ? 0xffe27a : 0xff8a2a), [0, 0, 0], 0.16));
      W.anim.push(t => glow.forEach((s, i) => { const k = (t * 0.25 + i / 10) % 1, z = -150 + ((i * 37) % 100), lx = W.lavaX(z); s.position.set(lx + Math.sin(i * 2.1) * 2.2, 0.1 + Math.sin(k * 3.14) * 1.1, z + k * 4); s.scale.setScalar(0.22 * (1 - k) + 0.04); })); }
    // ---- cave mouth back to the Wide World ----
    cave(scene, V.x0 - 1.4, -100, Math.PI / 2);
    sign(scene, 331.5, -96.4, 'To the Wide World');
    // ---- the volcano itself (far beyond the walkable land) and the ring of crags ----
    { const g = grp(scene, 392, 0, -8);
      P(g, 'cone8', 0x4a3a36, [0, 21, 0], [44, 46, 44]); P(g, 'cone8', 0x6a4a40, [0, 30, 0], [24, 30, 24]); P(g, 'cyl', 0xff7a1a, [0, 44.2, 0], [5.2, 1.2, 5.2]); P(g, 'cyl', 0xffd23c, [0, 44.6, 0], [3.4, 1.0, 3.4]);
      for (const [a, w] of [[0.4, 1.6], [2.3, 1.2], [4.4, 1.4]]) P(g, 'box', 0xff7a1a, [Math.cos(a) * 9, 30, Math.sin(a) * 9 + 3], [w, 26, 0.5], [0.42 * Math.sin(a + 1.57) + 0.0, -a, 0.42 * Math.cos(a)]);
      TT.bakeDeep(g);
      const puffs = []; for (let i = 0; i < 6; i++) puffs.push(P(scene, 'sphS', new THREE.MeshBasicMaterial({ color: 0x5a5058, transparent: true, opacity: 0.55, depthWrite: false }), [392, 46, -8], 3));
      W.anim.push(t => puffs.forEach((p, i) => { const k = (t * 0.06 + i / 6) % 1; p.position.set(392 + k * 14 + Math.sin(i + k * 4) * 2, 46 + k * 26, -8 - k * 6); p.scale.setScalar(3 + k * 9); p.material.opacity = 0.55 * (1 - k); })); }
    for (let i = 0; i < 150; i++) { const q = i / 150 * 4, side = q | 0, f = q - side, x = side === 0 ? V.x0 - 4 + f * 116 : side === 1 ? V.x1 + 4 : side === 2 ? V.x1 + 4 - f * 116 : V.x0 - 4, z = side === 0 ? V.z0 - 4 : side === 1 ? V.z0 - 4 + f * 116 : side === 2 ? V.z1 + 4 : V.z1 + 4 - f * 116;
      if (side === 3 && Math.abs(z + 100) < 5) continue;
      const g = grp(chunk(x, z), x + rand(-1.5, 1.5), 0, z + rand(-1.5, 1.5)), h = rand(4, 9); g.rotation.y = rand(0, 6); P(g, 'cone8', pick(ROCKS), [0, h / 2 - 0.3, 0], [rand(2.6, 4), h, rand(2.6, 4)]); if (i % 3 === 0) P(g, 'rock', pick(ROCKS), [rand(-2, 2), 0.9, rand(1, 2.5)], rand(1.2, 2)); }
    // ---- scenery inside ----
    const clear = (x, z, m) => Math.abs(z + 100) > 3.4 + (m || 0) && Math.abs(x - W.lavaX(z)) > LW + 1.6 + (m || 0) && Math.hypot(x - W.ALTAR.x, z - W.ALTAR.z) > W.ALTAR.r + 2.5 + (m || 0) && Math.hypot(x - 352, z + 88) > 3 && Math.hypot(x - 354, z + 114) > 3;
    const inZone = (x, z) => W.zones.some(zn => zn.x > 300 && zn.x < 470 && Math.hypot(x - zn.x, z - zn.z) < zn.r + 1);
    for (let i = 0; i < 46; i++) { const x = rand(V.x0 + 2, V.x1 - 2), z = rand(V.z0 + 2, V.z1 - 2); if (!clear(x, z, 1) || inZone(x, z)) continue; if (i % 3 === 0) spire(x, z, rand(0.8, 1.5)); else if (i % 3 === 1) deadTree(x, z, rand(0.9, 1.4)); else boulder(x, z, rand(1.2, 2.2), true); }
    for (let i = 0; i < 120; i++) { const x = rand(V.x0 + 1, V.x1 - 1), z = rand(V.z0 + 1, V.z1 - 1); if (clear(x, z, -1.2)) boulder(x, z, rand(0.25, 0.6)); }
    // gravel tufts where wild Pokémon live (so the kids can see the spots)
    for (const zn of W.zones) if (zn.x > 300 && zn.x < 470) for (let i = 0; i < 110; i++) { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * (zn.r - 0.5), x = zn.x + Math.cos(a) * r, z = zn.z + Math.sin(a) * r, g = grp(chunk(x, z), x, 0, z), c = zn.name === 'Ash Field' ? pick([0x8a4a36, 0xa85a3a, 0x6a3a2c]) : pick([0x8a8480, 0x6a6460, 0x9a948e]);
      for (let j = 0; j < 3; j++) P(g, 'pyr', c, [rand(-0.2, 0.2), 0.28, rand(-0.2, 0.2)], [0.13, rand(0.45, 0.75), 0.13], [rand(-0.25, 0.25), rand(0, 3), rand(-0.25, 0.25)]); }
    // steam vents
    { const vents = [[344, -92], [366, -112], [372, -84], [412, -70], [418, -132]], puffs = [];
      for (const [x, z] of vents) { const g = grp(chunk(x, z), x, 0, z); P(g, 'cyl', 0x3a2c28, [0, 0.12, 0], [0.7, 0.24, 0.7]); P(g, 'cyl', 0xff7a1a, [0, 0.2, 0], [0.4, 0.1, 0.4]); for (let i = 0; i < 2; i++) puffs.push({ m: P(scene, 'sphS', new THREE.MeshBasicMaterial({ color: 0xe8e0d8, transparent: true, opacity: 0.4, depthWrite: false }), [x, 0.4, z], 0.3), x, z, o: i / 2 + Math.random() }); }
      W.anim.push(t => { for (const p of puffs) { const k = (t * 0.3 + p.o) % 1; p.m.position.set(p.x + Math.sin(k * 5 + p.o * 9) * 0.3, 0.4 + k * 3.2, p.z); p.m.scale.setScalar(0.3 + k * 0.9); p.m.material.opacity = 0.4 * (1 - k); } }); }

    // ---- the Dragon's Lair: a round stone altar with seven pedestals ----
    { const A = W.ALTAR, g = grp(chunk(A.x, A.z), A.x, 0, A.z);
      P(g, 'cyl', 0x6a6278, [0, 0.07, 0], [A.r, 0.14, A.r]); P(g, 'cyl', 0x8a82a0, [0, 0.1, 0], [A.r - 0.7, 0.16, A.r - 0.7]); P(g, 'cyl', 0x4a4460, [0, 0.12, 0], [2.6, 0.18, 2.6]); P(g, 'cyl', 0xf2c230, [0, 0.13, 0], [1.9, 0.2, 1.9]);
      for (let i = 0; i < 4; i++) P(g, 'box', 0xe8402a, [0, 0.24, 0], [0.34, 0.04, 3.0], [0, i * 0.785, 0]);
      W.PEDS = [];
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, x = Math.cos(a) * 5.2, z = Math.sin(a) * 5.2; P(g, 'cyl', 0x5a5470, [x, 0.5, z], [0.42, 1.0, 0.42]); P(g, 'cyl', 0x8a82a0, [x, 1.02, z], [0.55, 0.1, 0.55]); P(g, 'cyl', 0x4a4460, [x, 0.12, z], [0.62, 0.2, 0.62]); W.PEDS.push([A.x + x, 1.38, A.z + z]); W.colliders.push({ x: A.x + x, z: A.z + z, r: 0.6 }); }
      for (const s of [1, -1]) for (const q of [1, -1]) { const x = s * 8.6, z = q * 4.6; P(g, 'cyl', 0x4a4460, [x, 2.4, z], [0.5, 4.8, 0.5]); P(g, 'cone8', 0x6a6278, [x, 5.2, z], [0.8, 1.0, 0.8]); P(g, 'sph', 0xffb030, [x, 6.0, z], 0.3); W.colliders.push({ x: A.x + x, z: A.z + z, r: 0.6 }); }
      W.colliders.push({ x: A.x, z: A.z, r: 1.7 });
      // the balls that sit on the pedestals during a summoning (hidden until then)
      W.pedBalls = []; for (let i = 0; i < 7; i++) { const b = TT.starBall(i + 1, 0.3); b.position.set(W.PEDS[i][0], W.PEDS[i][1], W.PEDS[i][2]); b.visible = false; b.userData.live = true; scene.add(b); W.pedBalls.push(b); }
      const beam = P(scene, 'cyl', new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0, depthWrite: false }), [A.x, 20, A.z], [1.6, 40, 1.6]); beam.userData.live = true; W.altarBeam = beam; }
  };
  W.setTunnel = open => { W.tunnelRocks.visible = !open; const i = W.colliders.indexOf(W.tunnelCol); if (open && i >= 0) W.colliders.splice(i, 1); if (!open && i < 0) W.colliders.push(W.tunnelCol); };

  // ---------- battle stages: the Volcano and the Dragon's Lair ----------
  function stageTex(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.fillStyle = kind === 'lair' ? '#5a5470' : '#5a4640'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) { x.fillStyle = i % 2 ? 'rgba(20,16,20,.4)' : 'rgba(200,190,200,.25)'; x.fillRect(Math.random() * 512, Math.random() * 512, 3, 3); }
    if (kind === 'volcano') { x.lineCap = 'round'; for (let i = 0; i < 16; i++) { let px = rand(0, 512), py = rand(0, 512); const pts = [[px, py]]; for (let j = 0; j < 4; j++) { px += rand(-40, 40); py += rand(-40, 40); pts.push([px, py]); } for (const [w, col] of [[8, 'rgba(255,90,20,.25)'], [3.5, 'rgba(255,150,40,.7)'], [1.2, 'rgba(255,235,150,.9)']]) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); } } }
    else { x.strokeStyle = 'rgba(40,34,60,.8)'; x.lineWidth = 3; for (let r = 60; r < 360; r += 50) { x.beginPath(); x.arc(256, 256, r, 0, 7); x.stroke(); } for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; x.beginPath(); x.moveTo(256 + Math.cos(a) * 60, 256 + Math.sin(a) * 60); x.lineTo(256 + Math.cos(a) * 360, 256 + Math.sin(a) * 360); x.stroke(); } }
    x.strokeStyle = kind === 'lair' ? 'rgba(242,194,48,.95)' : 'rgba(255,200,120,.85)'; x.lineWidth = 5; x.beginPath(); x.ellipse(256, 256, 120, 76, 0, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(256, 180); x.lineTo(256, 332); x.stroke(); x.beginPath(); x.arc(256, 256, 16, 0, 7); x.stroke();
    return new THREE.CanvasTexture(c);
  }
  const oldStages = W.buildStages;
  W.buildStages = function (scene) {
    oldStages(scene);
    const ST = W.STAGES;
    const TINT = {
      volcano: { sky: 0xc88468, fog: 0x8a4a3a, hemi: [0xffc8a0, 0x5a2a20, 0.56], sun: [0xff9a60, 0.52], near: 40, far: 150 },
      lair: { sky: 0x4a3c7a, fog: 0x221a3a, hemi: [0xa898e8, 0x2a1a44, 0.52], sun: [0xc0a8ff, 0.4], near: 40, far: 170 }
    };
    ST.volcArea = { tint: { sky: 0xdc9c80, fog: 0xa86a54, hemi: [0xffd4b0, 0x6a3a2c, 0.6], sun: [0xffa870, 0.5], near: 50, far: 130 } };
    ST.summon = { tint: { sky: 0x3a2e66, fog: 0x1a1430, hemi: [0x9a8ae0, 0x2a1a40, 0.5], sun: [0xb8a0ff, 0.36], near: 40, far: 120 } };
    ['volcano', 'lair'].forEach((kind, i) => {
      const A = ST[kind] = { x: 600 + i * 200, z: 900, key: kind, tint: TINT[kind] }, ax = A.x, az = A.z;
      const b = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshLambertMaterial({ color: kind === 'lair' ? 0x3a3450 : 0x4a3a36 })); b.rotation.x = -Math.PI / 2; b.position.set(ax, -0.02, az); scene.add(b);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshLambertMaterial({ map: stageTex(kind) })); f.rotation.x = -Math.PI / 2; f.position.set(ax, 0.01, az); f.receiveShadow = true; scene.add(f);
      const g = grp(scene, ax, 0, az);
      for (let j = 0; j < 7; j++) { const x = -72 + j * 24 + rand(-5, 5), z = -34 - rand(0, 18), h = rand(30, 52), r = rand(18, 28); P(g, 'cone8', kind === 'lair' ? 0x2a2440 : 0x4a3832, [x, h / 2 - 1, z], [r, h, r]); if (kind === 'volcano' && j % 2) { P(g, 'cyl', 0xff7a1a, [x, h - 2.2, z], [r * 0.16, 1, r * 0.16]); } }
      if (kind === 'volcano') {
        const geo = new THREE.PlaneGeometry(120, 11); geo.rotateX(-Math.PI / 2); const uv = geo.attributes.uv, ps = geo.attributes.position; for (let k = 0; k < ps.count; k++) uv.setXY(k, (ps.getZ(k) + 5.5) / 11, (ps.getX(k) + 60) / 120 * 8);
        const tx = W.lavaTex(), lv = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tx })); lv.position.set(ax, 0.04, az - 13); scene.add(lv); W.anim.push(t => { tx.offset.y = t * 0.1; });
        for (let j = 0; j < 12; j++) { const x = rand(-20, 20), z = rand(-7.5, -5.5); P(g, 'rock', pick(ROCKS), [x, 0.5, z], [rand(0.8, 1.6), rand(0.7, 1.3), rand(0.8, 1.4)], [j, j * 2, 0]); }
        for (let j = 0; j < 6; j++) { const x = -22 + j * 9 + rand(-2, 2); P(g, 'cone8', pick(ROCKS), [x, 2.2, -21 - rand(0, 4)], [1.6, 4.6, 1.6]); }
      } else {
        P(g, 'cyl', 0x6a6278, [0, 0.03, 0], [15, 0.06, 15]);
        A.balls = [];
        for (let j = 0; j < 7; j++) { const a = Math.PI * (0.08 + j * 0.84 / 6), x = Math.cos(a) * 12.5, z = -Math.sin(a) * 9.5 - 1; P(g, 'cyl', 0x5a5470, [x, 0.9, z], [0.5, 1.8, 0.5]); P(g, 'cyl', 0x8a82a0, [x, 1.85, z], [0.7, 0.12, 0.7]); const sb = TT.starBall(j + 1, 0.36); sb.position.set(ax + x, 2.35, az + z); sb.userData.live = true; scene.add(sb); A.balls.push(sb); }
        for (const s of [1, -1]) { P(g, 'cyl', 0x4a4460, [s * 16, 4, -6], [0.8, 8, 0.8]); P(g, 'cone8', 0x6a6278, [s * 16, 8.6, -6], [1.3, 1.6, 1.3]); P(g, 'sph', 0xffb030, [s * 16, 9.9, -6], 0.5); }
        W.anim.push(t => A.balls.forEach((sb, j) => { sb.rotation.y = t * 1.5 + j; sb.position.y = 2.35 + Math.sin(t * 2 + j) * 0.1; }));
      }
      TT.bakeDeep(g);
    });
  };
})();
