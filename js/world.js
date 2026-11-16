// world.js — the starting town. Everything static is baked into a few vertex-coloured meshes.
(function () {
  const TT = window.TT, P = TT.P, rand = TT.rand, pick = TT.pick;
  const S = 160, HALF = 80, LIM = 56, WHITE = 0xffffff;
  const W = TT.World = { colliders: [], LIM, pickups: [], anim: [] };
  const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); parent.add(g); return g; };
  function prune(n) { for (const c of n.children.slice()) { if (c.isMesh || c.isSprite) continue; prune(c); if (!c.children.length) n.remove(c); } }
  const chunks = {};
  const chunk = (x, z) => { const k = Math.floor((x + 320) / 32) + '_' + Math.floor((z + 320) / 32); return chunks[k] || (chunks[k] = new THREE.Group()); };

  W.POND = { x: 32, z: 24, r: 9 };
  W.FIRE = { x: 5, z: 27 };
  W.NEST = { x: -49, z: 41 };
  W.CENTER = { x: -18, z: -4.6 };
  W.STARSPOT = { x: 47, z: 33 };
  W.ARENA = { x: 0, z: 400 };
  W.zones = [
    { name: 'West Meadow', x: -40, z: 30, r: 14, n: 4, lv: [2, 4], pool: ['pidgey', 'pidgey', 'rattata', 'rattata', 'caterpie', 'caterpie', 'oddish'] },
    { name: 'Sunny Grove', x: 40, z: -32, r: 12, n: 3, lv: [4, 6], pool: ['bulbasaur', 'charmander', 'oddish', 'eevee', 'pidgey'] },
    { name: 'North Field', x: -40, z: -36, r: 11, n: 3, lv: [3, 5], pool: ['rattata', 'caterpie', 'pidgey', 'charmander', 'oddish'] },
    { name: 'Pond', x: 32, z: 24, r: 12.5, ring: 10.3, n: 2, lv: [3, 5], pool: ['psyduck', 'psyduck', 'squirtle'] }
  ];
  const BALLS = [[6, -8], [-9, 7], [22, -3], [-25, -3], [-6, -22], [10, 20], [-20, 26], [24, 12], [44, -20], [-46, -30], [-34, 38], [42, 6], [-50, 8], [18, -40], [-3, 44]];
  // x, z, w, d, wall, roof, door, twoStorey
  const HOUSES = [[14, -12, 8, 6.5, 0xfff1d6, 0xd9583a, 0x3f7ac0, 0], [28, -12, 8, 6.5, 0xe9f4ff, 0x4a7fd0, 0xc04a4a, 1], [-33, -12, 8, 6.5, 0xfff7cf, 0x4f9e58, 0x8a5a3a, 0],
  [-15, 15, 8, 6.5, 0xffe6e6, 0x8a62d0, 0x3f8a6a, 1], [15, 13, 8, 6.5, 0xeefbe8, 0xe09a30, 0x3f6ac0, 0], [-29, 13, 8, 6.5, 0xf5ecff, 0xc8486a, 0x7a5234, 0]];
  const PATHS = [[0, -56, 0, 50, 5], [-50, 0, 50, 0, 5], [-18, 0, -18, -5, 4], [0, 24, 5, 24, 3], [22, 0, 30, 13, 3.5], [-50, 0, -42, 18, 3.5], [50, 0, 42, -22, 3.5], [-18, -22, -38, -30, 3], [0, -22, -18, -22, 3]];

  function groundTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 2048;
    const x = c.getContext('2d'), k = 2048 / S, px = v => (v + HALF) * k;
    x.fillStyle = '#79cc58'; x.fillRect(0, 0, 2048, 2048);
    for (let i = 0; i < 520; i++) { const X = Math.random() * 2048, Y = Math.random() * 2048, R = rand(40, 150), g = x.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, i % 2 ? 'rgba(150,225,105,.28)' : 'rgba(80,165,70,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(X - R, Y - R, R * 2, R * 2); }
    const blades = ['rgba(60,150,60,.4)', 'rgba(170,235,120,.4)', 'rgba(95,185,75,.45)'];
    for (let i = 0; i < 14000; i++) { x.fillStyle = blades[i % 3]; x.fillRect(Math.random() * 2048, Math.random() * 2048, 2, rand(4, 9)); }
    for (const z of W.zones) if (!z.ring) {
      const g = x.createRadialGradient(px(z.x), px(z.z), z.r * k * 0.8, px(z.x), px(z.z), z.r * k * 1.04); g.addColorStop(0, '#4a973a'); g.addColorStop(1, 'rgba(74,151,58,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px(z.x), px(z.z), z.r * k * 1.05, 0, 7); x.fill();
      for (let i = 0; i < 500; i++) { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * z.r; x.fillStyle = i % 2 ? '#3c8530' : '#57a544'; x.fillRect(px(z.x + Math.cos(a) * r) - 2, px(z.z + Math.sin(a) * r) - 6, 4, 12); }
    }
    const p = W.POND; let g = x.createRadialGradient(px(p.x), px(p.z), p.r * k, px(p.x), px(p.z), (p.r + 3) * k); g.addColorStop(0, '#e6d096'); g.addColorStop(0.75, '#efdca6'); g.addColorStop(1, 'rgba(239,220,166,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px(p.x), px(p.z), (p.r + 3) * k, 0, 7); x.fill();
    const paths = PATHS.concat(HOUSES.map(h => [h[0], h[1] + h[3] / 2, h[0], h[1] > 0 ? h[1] + h[3] / 2 + 3 : 0, 2.4]));
    x.lineCap = 'round';
    for (const pass of [0, 1]) for (const q of paths) { x.strokeStyle = pass ? '#ecd49c' : '#c2a064'; x.lineWidth = (q[4] + (pass ? 0 : 0.7)) * k; x.beginPath(); x.moveTo(px(q[0]), px(q[1])); x.lineTo(px(q[2]), px(q[3])); x.stroke(); }
    for (let i = 0; i < 2600; i++) { const a = paths[i % paths.length], t = Math.random(), w = a[4] * 0.42; x.fillStyle = i % 3 ? 'rgba(200,170,110,.5)' : 'rgba(250,235,190,.6)'; x.beginPath(); x.ellipse(px(a[0] + (a[2] - a[0]) * t + rand(-w, w)), px(a[1] + (a[3] - a[1]) * t + rand(-w, w)), rand(2, 5), rand(2, 4), 0, 0, 7); x.fill(); }
    // plaza: tiled rings
    x.fillStyle = '#c2a064'; x.beginPath(); x.arc(px(0), px(0), 10 * k, 0, 7); x.fill();
    x.fillStyle = '#f3e2b4'; x.beginPath(); x.arc(px(0), px(0), 9.6 * k, 0, 7); x.fill();
    x.strokeStyle = '#d9c088'; x.lineWidth = 3;
    for (const r of [3.4, 5, 6.6, 8.2]) { x.beginPath(); x.arc(px(0), px(0), r * k, 0, 7); x.stroke(); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; x.beginPath(); x.moveTo(px(Math.cos(a) * 3.4), px(Math.sin(a) * 3.4)); x.lineTo(px(Math.cos(a) * 9.6), px(Math.sin(a) * 9.6)); x.stroke(); }
    x.fillStyle = '#e8b8a0'; for (let i = 0; i < 24; i += 2) { const a = (i + 0.5) / 24 * 6.283; x.beginPath(); x.arc(px(Math.cos(a) * 7.4), px(Math.sin(a) * 7.4), 0.5 * k, 0, 7); x.fill(); }
    g = x.createRadialGradient(px(W.FIRE.x), px(W.FIRE.z), 0, px(W.FIRE.x), px(W.FIRE.z), 5 * k); g.addColorStop(0, '#b89468'); g.addColorStop(0.7, '#d8b888'); g.addColorStop(1, 'rgba(216,184,136,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px(W.FIRE.x), px(W.FIRE.z), 5 * k, 0, 7); x.fill();
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function arenaTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.fillStyle = '#86d564'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) { x.fillStyle = i % 2 ? 'rgba(60,150,60,.35)' : 'rgba(170,235,120,.35)'; x.fillRect(Math.random() * 512, Math.random() * 512, 2, rand(3, 7)); }
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 5; x.beginPath(); x.ellipse(256, 256, 96, 62, 0, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(256, 194); x.lineTo(256, 318); x.stroke(); x.beginPath(); x.arc(256, 256, 14, 0, 7); x.stroke();
    return new THREE.CanvasTexture(c);
  }

  // ---------- props ----------
  const GREENS = [0x4aa64e, 0x57b558, 0x3f984a, 0x66c060, 0x4fae6a], PINES = [0x2f8048, 0x378a50, 0x2a7444], PINKS = [0xf7a8c8, 0xffc0d8, 0xf090b8];
  function tree(x, z, k, kind, solid) {
    const g = grp(chunk(x, z), x, 0, z); g.rotation.y = rand(0, 6.28);
    if (kind === 'pine') {
      P(g, 'trunk', 0x7a5234, [0, 0.7 * k, 0], [0.26 * k, 1.4 * k, 0.26 * k]);
      const c = pick(PINES); for (let i = 0; i < 3; i++) P(g, 'cone8', i === 2 ? shade(c, 1.18) : c, [0, (1.9 + i * 1.05) * k, 0], [(1.55 - i * 0.38) * k, 1.8 * k, (1.55 - i * 0.38) * k], [0, i, 0]);
    } else {
      P(g, 'trunk', 0x8a5a3a, [0, 0.95 * k, 0], [0.3 * k, 1.9 * k, 0.3 * k]);
      P(g, 'trunk', 0x8a5a3a, [0.35 * k, 1.9 * k, 0.1 * k], [0.12 * k, 0.9 * k, 0.12 * k], [0, 0, -0.8]);
      const c = kind === 'blossom' ? PINKS : GREENS;
      for (const b of [[0, 3.0, 0, 1.5], [0.95, 2.5, 0.3, 1.05], [-0.85, 2.6, -0.4, 1.1], [0.1, 3.95, -0.1, 1.0], [-0.2, 2.5, 0.9, 0.95]]) P(g, 'ico', pick(c), [b[0] * k, b[1] * k, b[2] * k], b[3] * k, [rand(0, 3), rand(0, 3), rand(0, 3)]);
    }
    if (solid) W.colliders.push({ x, z, r: 0.55 });
  }
  function bush(x, z, k, berry) {
    const g = grp(chunk(x, z), x, 0, z);
    for (let i = 0; i < 3; i++) P(g, 'ico', pick(GREENS), [rand(-0.4, 0.4) * k, rand(0.3, 0.5) * k, rand(-0.3, 0.3) * k], rand(0.45, 0.65) * k, [rand(0, 3), rand(0, 3), 0]);
    if (berry) for (let i = 0; i < 4; i++) P(g, 'sph', berry, [rand(-0.5, 0.5) * k, rand(0.4, 0.8) * k, rand(0.2, 0.5) * k], 0.09);
  }
  function rock(x, z, k) { const g = grp(chunk(x, z), x, 0, z); P(g, 'rock', pick([0x9a9aa4, 0x8a8a96, 0xa8a8b0]), [0, 0.25 * k, 0], [k * rand(0.5, 0.8), k * rand(0.35, 0.55), k * rand(0.45, 0.7)], [rand(0, 3), rand(0, 3), 0]); }
  function flowers(x, z, n, spread) {
    const g = grp(chunk(x, z), x, 0, z);
    for (let i = 0; i < n; i++) { const fx = rand(-spread, spread), fz = rand(-spread, spread), c = pick([0xff6a8a, 0xffe060, 0xffffff, 0xb08af0, 0xff9a4a]); P(g, 'cyl', 0x4aa84a, [fx, 0.12, fz], [0.015, 0.24, 0.015]); P(g, 'sph', c, [fx, 0.26, fz], [0.08, 0.05, 0.08]); P(g, 'sph', 0xffd23c, [fx, 0.29, fz], 0.03); }
  }
  function lamp(x, z) {
    const g = grp(chunk(x, z), x, 0, z);
    P(g, 'cyl', 0x3a4050, [0, 0.15, 0], [0.16, 0.3, 0.16]); P(g, 'cyl', 0x3a4050, [0, 1.5, 0], [0.055, 2.7, 0.055]); P(g, 'box', 0x3a4050, [0, 2.95, 0], [0.4, 0.06, 0.4]); P(g, 'pyr', 0x3a4050, [0, 3.5, 0], [0.34, 0.25, 0.34], [0, 0.785, 0]);
    P(g, 'sph', TT.glow(0xfff0a8), [0, 3.2, 0], 0.17);
    W.colliders.push({ x, z, r: 0.25 });
  }
  function bench(x, z, ry) {
    const g = grp(chunk(x, z), x, 0, z); g.rotation.y = ry;
    P(g, 'box', 0xb8804a, [0, 0.45, 0], [1.7, 0.08, 0.5]); P(g, 'box', 0xb8804a, [0, 0.8, -0.24], [1.7, 0.4, 0.07]);
    for (const s of [1, -1]) { P(g, 'box', 0x3a4050, [s * 0.7, 0.22, 0], [0.08, 0.45, 0.45]); P(g, 'box', 0x3a4050, [s * 0.7, 0.7, -0.24], [0.08, 0.6, 0.08]); }
    W.colliders.push({ x, z, r: 0.75 });
  }
  function sign(scene, x, z, text) {
    const g = grp(scene, x, 0, z);
    P(g, 'cyl', 0x7a5234, [0, 0.6, 0], [0.07, 1.2, 0.07]); P(g, 'box', 0xd8b070, [0, 1.3, 0], [1.9, 0.7, 0.1]); P(g, 'box', 0x7a5234, [0, 1.3, -0.02], [2.02, 0.82, 0.08]);
    TT.bakeDeep(g);
    const l = TT.label(text, 'rgba(0,0,0,0)'); l.material.depthTest = true; l.position.set(0, 1.3, 0.14); l.scale.set(2.2, 0.55, 1); g.add(l);
    l.material.color.setHex(0x5a3a1a);
    W.colliders.push({ x, z, r: 0.4 });
  }
  const smokes = [];
  W.occ = [];
  // buildings fade when the player walks behind them (camera looks from the south)
  function occ(mesh, x, z, w, d, h) { if (!mesh) return; mesh.material = TT.vmat.clone(); W.occ.push({ m: mesh, x, z, w, d, h, o: 1 }); }
  function house(scene, x, z, w, d, wall, roof, door, tall) {
    const g = grp(scene, x, 0, z), H = tall ? 5 : 3.1, B = 0.4, f = d / 2, wood = 0x7a5234;
    P(g, 'box', 0xa4a4ae, [0, B / 2, 0], [w + 0.25, B, d + 0.25]);
    P(g, 'box', wall, [0, B + H / 2, 0], [w, H, d]);
    for (const sx of [1, -1]) for (const sz of [1, -1]) P(g, 'box', wood, [sx * w / 2, B + H / 2, sz * f], [0.24, H, 0.24]);
    P(g, 'box', wood, [0, B + H - 0.1, f], [w, 0.22, 0.14]); P(g, 'box', wood, [0, B + 0.1, f], [w, 0.2, 0.14]);
    if (tall) P(g, 'box', wood, [0, B + 2.55, f], [w, 0.2, 0.14]);
    // gable + roof slabs
    const half = (d + 1.3) / 2, rh = 2.3, ang = Math.atan2(rh, half), L = Math.hypot(rh, half) + 0.15;
    P(g, 'prism', wall, [0, B + H, 0], [w, rh * (d / (d + 1.3)), d]);
    for (const s of [1, -1]) { P(g, 'box', roof, [0, B + H + rh / 2 + 0.06, s * half / 2], [w + 1.1, 0.2, L], [s * ang, 0, 0]); P(g, 'box', shade(roof, 0.82), [0, B + H + 0.03, s * (half - 0.02)], [w + 1.14, 0.16, 0.14]); }
    for (let i = 1; i < 4; i++) for (const s of [1, -1]) P(g, 'box', shade(roof, 0.9), [0, B + H + rh * (1 - i / 4) + 0.17, s * half * i / 4], [w + 1.12, 0.05, 0.1], [s * ang, 0, 0]);
    P(g, 'box', shade(roof, 0.8), [0, B + H + rh + 0.1, 0], [w + 1.16, 0.2, 0.36]);
    for (const s of [1, -1]) P(g, 'sph', 0xfff7e0, [s * (w / 2 + 0.01), B + H + 0.9, 0], [0.05, 0.42, 0.42]);
    // chimney
    const cx = w * 0.27, cz = -d * 0.22, cy = B + H + rh;
    P(g, 'box', 0xb0553c, [cx, cy - 0.3, cz], [0.75, 1.9, 0.75]); P(g, 'box', 0x8a8a94, [cx, cy + 0.7, cz], [0.95, 0.16, 0.95]);
    smokes.push([x + cx, cy + 0.9, z + cz]);
    // door
    P(g, 'box', WHITE, [0, B + 1.15, f + 0.04], [1.55, 2.35, 0.12]); P(g, 'box', door, [0, B + 1.08, f + 0.09], [1.18, 2.1, 0.1]);
    P(g, 'box', 0xbfe8ff, [0, B + 1.65, f + 0.13], [0.6, 0.5, 0.05]); P(g, 'sph', 0xf2c230, [0.42, B + 1.05, f + 0.17], 0.07);
    P(g, 'box', 0xb8b8c2, [0, 0.13, f + 0.65], [2, 0.26, 1.1]); P(g, 'box', 0xc8c8d0, [0, 0.3, f + 0.4], [1.7, 0.2, 0.6]);
    P(g, 'box', roof, [0, B + 2.62, f + 0.5], [2.1, 0.12, 1.05], [0.28, 0, 0]);
    for (const s of [1, -1]) P(g, 'box', wood, [s * 0.95, B + 2.3, f + 0.5], [0.08, 0.08, 0.95], [0.5, 0, 0]);
    P(g, 'sph', TT.glow(0xfff0a8), [1.15, B + 2.0, f + 0.2], 0.11);
    // windows
    const win = (wx, wy, ww, wh) => {
      P(g, 'box', WHITE, [wx, wy, f + 0.04], [ww + 0.25, wh + 0.25, 0.12]); P(g, 'box', 0x9adcf8, [wx, wy, f + 0.08], [ww, wh, 0.1]);
      P(g, 'box', 0xd8f2ff, [wx - ww * 0.2, wy + wh * 0.18, f + 0.135], [ww * 0.3, wh * 0.4, 0.02], [0, 0, 0.5]);
      P(g, 'box', WHITE, [wx, wy, f + 0.14], [ww, 0.07, 0.04]); P(g, 'box', WHITE, [wx, wy, f + 0.14], [0.07, wh, 0.04]);
      for (const s of [1, -1]) P(g, 'box', door, [wx + s * (ww / 2 + 0.28), wy, f + 0.08], [0.32, wh + 0.2, 0.08]);
    };
    for (const s of [1, -1]) {
      win(s * w * 0.3, B + 1.75, 1.2, 1.15);
      const bx = s * w * 0.3; P(g, 'box', wood, [bx, B + 0.95, f + 0.22], [1.6, 0.26, 0.34]);
      for (let i = 0; i < 5; i++) { P(g, 'sph', pick([0xff6a8a, 0xffe060, 0xffffff, 0xb08af0]), [bx - 0.6 + i * 0.3, B + 1.16, f + 0.24], 0.11); P(g, 'sph', 0x4aa84a, [bx - 0.45 + i * 0.3, B + 1.1, f + 0.2], 0.1); }
      P(g, 'box', WHITE, [s * (w / 2 + 0.03), B + 1.75, 0], [0.1, 1.3, 1.5]); P(g, 'box', 0x9adcf8, [s * (w / 2 + 0.06), B + 1.75, 0], [0.1, 1.05, 1.25]);
    }
    if (tall) for (const q of [-0.3, 0, 0.3]) win(q * w, B + 3.75, 1.0, 1.0);
    // mailbox + bushes
    P(g, 'cyl', wood, [w / 2 - 0.4, 0.5, f + 2.2], [0.06, 1, 0.06]); P(g, 'box', 0xe8402a, [w / 2 - 0.4, 1.05, f + 2.2], [0.3, 0.26, 0.45]);
    occ(TT.bakeDeep(g), x, z, w + 1.2, d + 1.4, B + H + 2.6);
    bush(x - w * 0.42, z + f + 0.9, 0.9, null); bush(x + w * 0.44, z + f + 0.8, 0.8, 0xe8402a);
    W.colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  }

  const topGeo = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  TT.ballModel = s => {
    const g = new THREE.Group();
    P(g, 'sph', WHITE, [0, 0, 0], 0.98); P(g, topGeo, 0xe8402a, [0, 0, 0], 1);
    P(g, 'cyl', 0x23324a, [0, 0, 0], [1.02, 0.12, 1.02]); P(g, 'cyl', 0x23324a, [0, 0, 0.94], [0.3, 0.12, 0.3], [1.57, 0, 0]); P(g, 'sph', WHITE, [0, 0, 0.98], 0.2);
    TT.bakeNode(g, true); g.scale.setScalar(s || 0.25); return g;
  };
  TT.starBall = (n, s) => {
    const g = new THREE.Group();
    P(g, 'sph', new THREE.MeshToonMaterial({ color: 0xffa51f, emissive: 0x7a3a00, gradientMap: TT.grad }), [0, 0, 0], 1);
    P(g, 'sph', new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.6 }), [-0.35, 0.4, 0.75], [0.3, 0.2, 0.1]);
    for (let i = 0; i < n; i++) { const a = i / n * 6.283, r = n === 1 ? 0 : 0.36; for (const z of [0.9, -0.9]) P(g, 'sph', TT.glow(0xe01818), [Math.cos(a) * r, Math.sin(a) * r, z], 0.13); }
    g.scale.setScalar(s || 0.32); return g;
  };
  TT.eggModel = () => {
    const g = new THREE.Group();
    P(g, 'sph', 0xfff3dc, [0, 0.3, 0], [0.23, 0.31, 0.23]);
    for (const p of [[0.12, 0.38, 0.17], [-0.15, 0.25, 0.14], [0.02, 0.18, 0.21], [-0.05, 0.5, 0.13], [0.16, 0.2, -0.12], [-0.14, 0.42, -0.12], [0.0, 0.3, -0.21]]) P(g, 'sph', pick([0x6ac8e0, 0xf58ab0, 0x8adc6a]), p, [0.055, 0.065, 0.03]);
    TT.bakeNode(g, true); return g;
  };

  W.build = function (scene) {
    // ---- sky, clouds, far hills (follow the camera) ----
    const sg = new THREE.SphereGeometry(380, 24, 12), sc = [], top = new THREE.Color(0x3f9cf0), hor = new THREE.Color(0xd4f1ff), tmp = new THREE.Color();
    for (let i = 0; i < sg.attributes.position.count; i++) { const y = sg.attributes.position.getY(i) / 380; tmp.copy(hor).lerp(top, Math.pow(Math.max(0, y), 0.6)); sc.push(tmp.r, tmp.g, tmp.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
    const back = W.back = new THREE.Group(); scene.add(back);
    back.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
    const hazy = c => new THREE.MeshBasicMaterial({ color: c, fog: false });
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + rand(-0.1, 0.1), r = rand(230, 270); P(back, 'cone', hazy(pick([0x9cc4e8, 0xa8cdee, 0x90badf])), [Math.cos(a) * r, 26, Math.sin(a) * r], [rand(45, 75), rand(60, 105), rand(45, 75)]); }
    for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283 + rand(-0.1, 0.1), r = rand(150, 185); P(back, 'sph', hazy(pick([0x8fd08a, 0x9ad894, 0x84c684])), [Math.cos(a) * r, -4, Math.sin(a) * r], [rand(40, 70), rand(18, 34), rand(40, 70)]); }
    const clouds = W.clouds = new THREE.Group(); back.add(clouds); const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283 + rand(-0.2, 0.2), r = rand(140, 240), g = grp(clouds, Math.cos(a) * r, rand(55, 100), Math.sin(a) * r), k = rand(7, 13); for (let j = 0; j < 5; j++) P(g, 'sph', cm, [(j - 2) * k * 0.8, rand(-0.1, 0.25) * k, rand(-0.3, 0.3) * k], [k * rand(0.8, 1.2), k * rand(0.5, 0.7), k * rand(0.7, 1)]); }

    // ---- ground ----
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshLambertMaterial({ map: groundTexture() }));
    gm.rotation.x = -Math.PI / 2; gm.receiveShadow = true; scene.add(gm);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshLambertMaterial({ color: 0x74c456 }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.05; scene.add(outer);

    // ---- buildings ----
    for (const h of HOUSES) house(scene, ...h);
    { // Poke Center
      const g = grp(scene, -18, 0, -10);
      P(g, 'box', 0xa4a4ae, [0, 0.2, 0], [10.3, 0.4, 8.3]); P(g, 'box', 0xfafafa, [0, 2.2, 0], [10, 3.6, 8]);
      P(g, 'box', 0xe2382e, [0, 1.0, 4.03], [10.04, 0.5, 0.06]); P(g, 'box', 0xe2382e, [0, 4.3, 0], [10.9, 0.7, 8.9]); P(g, 'cyl', 0xe2382e, [0, 4.7, 0], [5.2, 0.9, 4.2]); P(g, 'cyl', 0xfafafa, [0, 5.2, 0], [3.4, 0.25, 2.7]);
      P(g, 'box', 0x5a6a7a, [0, 1.6, 4.04], [2.7, 2.6, 0.12]); for (const s of [1, -1]) P(g, 'box', 0xa8e4ff, [s * 0.62, 1.55, 4.1], [1.1, 2.3, 0.06]);
      P(g, 'box', 0xe2382e, [0, 3.15, 4.6], [3.4, 0.16, 1.3]); for (const s of [1, -1]) P(g, 'cyl', 0xd8d8e0, [s * 1.5, 1.75, 5.1], [0.09, 2.7, 0.09]);
      for (const s of [1, -1]) { P(g, 'box', 0x5a6a7a, [s * 3.4, 2.3, 4.03], [2.1, 1.5, 0.1]); P(g, 'box', 0xa8e4ff, [s * 3.4, 2.3, 4.07], [1.85, 1.25, 0.08]); P(g, 'box', 0xfafafa, [s * 3.4, 2.3, 4.12], [0.07, 1.25, 0.04]); P(g, 'box', 0xc89b5a, [s * 3.4, 0.65, 4.4], [2, 0.5, 0.5]); for (let i = 0; i < 4; i++) P(g, 'ico', pick(GREENS), [s * 3.4 - 0.7 + i * 0.47, 1.05, 4.4], 0.3); }
      P(g, 'box', 0xb8b8c2, [0, 0.2, 4.7], [3.2, 0.4, 1.4]);
      occ(TT.bakeDeep(g), -18, -10, 11, 9, 5.8);
      const b = TT.ballModel(0.85); b.position.set(0, 4.15, 4.45); g.add(b);
      W.colliders.push({ x0: -23, x1: -13, z0: -14, z1: -6 });
      sign(scene, -13.5, -4.4, 'Poké Center');
    }
    { // Lab
      const g = grp(scene, 0, 0, -31);
      P(g, 'box', 0xa4a4ae, [0, 0.2, 0], [15.3, 0.4, 9.3]); P(g, 'box', 0xeef2f6, [0, 2.4, 0], [15, 4, 9]);
      P(g, 'box', 0x5a7ab8, [0, 4.6, 0], [15.8, 0.5, 9.8]); P(g, 'box', 0xeef2f6, [0, 5.0, 0], [14, 0.4, 8]);
      P(g, 'cyl', 0xdfe6ee, [-3.5, 5.6, -0.5], [2.6, 1, 2.6]); P(g, 'sph', 0x8ab8e8, [-3.5, 6.1, -0.5], [2.5, 2.1, 2.5]); P(g, 'box', 0x3a4a6a, [-3.5, 7.4, 0.6], [0.7, 1.6, 2.4], [0.7, 0, 0]);
      P(g, 'cyl', 0xeef2f6, [5.6, 3.6, -1], [1.6, 7.2, 1.6]); P(g, 'cone', 0x5a7ab8, [5.6, 8.2, -1], [2, 2.2, 2]); P(g, 'cyl', 0x8a8a94, [5.6, 9.8, -1], [0.04, 1.4, 0.04]); P(g, 'sph', 0xe2382e, [5.6, 10.5, -1], 0.14);
      for (const y of [2.2, 4.4, 6]) P(g, 'box', 0xa8e4ff, [5.6, y, 0.58], [0.8, 0.9, 0.1]);
      P(g, 'box', 0x5a6a7a, [0, 1.6, 4.54], [2.3, 2.6, 0.12]); P(g, 'box', 0x6a5a48, [0, 1.5, 4.6], [1.9, 2.3, 0.08]); P(g, 'sph', 0xf2c230, [0.7, 1.5, 4.68], 0.08);
      P(g, 'box', 0x5a7ab8, [0, 3.1, 5], [3, 0.14, 1.1]); for (const s of [1, -1]) P(g, 'cyl', 0xd8d8e0, [s * 1.3, 1.7, 5.4], [0.09, 2.7, 0.09]);
      for (const s of [1, -1]) for (const q of [2.9, 5.6]) { if (s > 0 && q > 5) continue; P(g, 'box', 0x5a6a7a, [s * q, 2.5, 4.53], [2, 1.9, 0.1]); P(g, 'box', 0xa8e4ff, [s * q, 2.5, 4.57], [1.75, 1.65, 0.08]); P(g, 'box', 0xeef2f6, [s * q, 2.5, 4.62], [1.75, 0.07, 0.04]); P(g, 'box', 0xeef2f6, [s * q, 2.5, 4.62], [0.07, 1.65, 0.04]); }
      P(g, 'box', 0xb8b8c2, [0, 0.13, 5.4], [3.6, 0.26, 1.8]); P(g, 'box', 0xc8c8d0, [0, 0.3, 5.0], [3, 0.2, 1]);
      occ(TT.bakeDeep(g), 0, -31, 16, 10, 9);
      W.colliders.push({ x0: -7.5, x1: 7.5, z0: -35.5, z1: -26.5 });
      sign(scene, -4.5, -24.5, 'Pokémon Lab');
    }
    { // fountain
      const g = grp(scene);
      P(g, 'cyl', 0xc8c8d2, [0, 0.3, 0], [2.6, 0.6, 2.6]); P(g, 'cyl', 0xe2e2ea, [0, 0.62, 0], [2.7, 0.14, 2.7]); P(g, 'cyl', 0xc8c8d2, [0, 0.9, 0], [0.45, 1.2, 0.45]);
      P(g, 'cyl', 0xe2e2ea, [0, 1.5, 0], [1.15, 0.16, 1.15]); P(g, 'cyl', 0xc8c8d2, [0, 1.9, 0], [0.22, 0.8, 0.22]);
      for (let i = 0; i < 8; i++) P(g, 'sph', 0xe2e2ea, [Math.cos(i * 0.785) * 2.65, 0.72, Math.sin(i * 0.785) * 2.65], 0.2);
      TT.bakeDeep(g);
      P(g, 'cyl', TT.glow(0x6ac8f8), [0, 0.66, 0], [2.35, 0.04, 2.35]); P(g, 'cyl', TT.glow(0x8ad8ff), [0, 1.6, 0], [1.0, 0.04, 1.0]);
      const b = TT.ballModel(0.5); b.position.y = 2.75; g.add(b);
      const drops = []; for (let i = 0; i < 10; i++) drops.push(P(g, 'sph', TT.glow(0xbfeaff), [0, 0, 0], 0.09));
      W.anim.push(t => { b.rotation.y = t * 0.8; drops.forEach((d, i) => { const k = (t * 0.9 + i / 10) % 1, a = i * 0.628, r = 1.0 + k * 1.1; d.position.set(Math.cos(a) * r, 1.6 + Math.sin(k * 3.14) * 0.5 - k * 0.9, Math.sin(a) * r); }); });
      W.colliders.push({ x: 0, z: 0, r: 2.8 });
      for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.785; bench(Math.cos(a) * 8.3, Math.sin(a) * 8.3, Math.atan2(-Math.cos(a), -Math.sin(a))); }
    }
    { // market stall
      const x = 6.4, z = -10, g = grp(chunk(x, z), x, 0, z);
      P(g, 'box', 0xb8804a, [0, 0.55, 0], [3, 1.1, 1.3]); for (const sx of [1, -1]) for (const sz of [1, -1]) P(g, 'cyl', 0x7a5234, [sx * 1.45, 1.5, sz * 0.62], [0.06, 3, 0.06]);
      for (let i = 0; i < 6; i++) P(g, 'box', i % 2 ? 0xe2382e : WHITE, [-1.25 + i * 0.5, 3.0, 0.1], [0.5, 0.08, 1.9], [0.25, 0, 0]);
      for (let i = 0; i < 3; i++) { P(g, 'box', 0x9a6a3a, [-0.9 + i * 0.9, 1.2, 0.1], [0.7, 0.22, 0.7]); for (let j = 0; j < 5; j++) P(g, 'sph', [0xe8402a, 0xf2c230, 0x6a8ae0][i], [-0.9 + i * 0.9 + rand(-0.22, 0.22), 1.38, 0.1 + rand(-0.22, 0.22)], 0.11); }
      W.colliders.push({ x0: x - 1.6, x1: x + 1.6, z0: z - 0.8, z1: z + 0.8 });
    }
    { // pond
      const p = W.POND;
      const water = new THREE.Mesh(TT.G.disc, new THREE.MeshBasicMaterial({ color: 0x3fa6ea })); water.rotation.x = -Math.PI / 2; water.scale.setScalar(p.r); water.position.set(p.x, 0.04, p.z); scene.add(water);
      const deep = new THREE.Mesh(TT.G.disc, new THREE.MeshBasicMaterial({ color: 0x2f8ad8 })); deep.rotation.x = -Math.PI / 2; deep.scale.setScalar(p.r * 0.62); deep.position.set(p.x + 0.6, 0.045, p.z + 0.4); scene.add(deep);
      const rings = []; const rgeo = new THREE.RingGeometry(0.86, 1, 28);
      for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({ color: 0xcdf0ff, transparent: true, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(p.x + rand(-4.5, 4.5), 0.06, p.z + rand(-4.5, 4.5)); scene.add(r); rings.push(r); }
      const glints = []; for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(TT.G.disc, new THREE.MeshBasicMaterial({ color: 0xa8e4ff })); s.rotation.x = -Math.PI / 2; s.position.set(p.x + rand(-6, 6), 0.055, p.z + rand(-5.5, 5.5)); scene.add(s); glints.push(s); }
      W.anim.push(t => { rings.forEach((r, i) => { const k = (t * 0.3 + i * 0.25) % 1; r.scale.setScalar(0.3 + k * 2.2); r.material.opacity = (1 - k) * 0.8; }); glints.forEach((s, i) => s.scale.set(1.1 + Math.sin(t * 1.3 + i) * 0.4, 0.14 + Math.sin(t * 1.7 + i * 2) * 0.05, 1)); });
      for (let i = 0; i < 7; i++) { const a = i * 0.95, r = rand(2, 7), g = grp(chunk(p.x, p.z), p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r); P(g, 'cyl', 0x4aa84a, [0, 0.07, 0], [0.6, 0.03, 0.6]); if (i % 2) { P(g, 'sph', 0xf58ab0, [0.1, 0.17, 0], [0.18, 0.12, 0.18]); P(g, 'sph', 0xffe060, [0.1, 0.24, 0], 0.06); } }
      for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + rand(-0.08, 0.08); if (Math.abs(a - Math.PI) < 0.35) continue; const r = p.r + rand(0.1, 0.9); if (i % 3 === 0) rock(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, rand(0.5, 1)); else { const g = grp(chunk(p.x, p.z), p.x + Math.cos(a) * (r - 0.5), 0, p.z + Math.sin(a) * (r - 0.5)); for (let j = 0; j < 4; j++) { const h = rand(0.8, 1.5), rx = rand(-0.25, 0.25), rz = rand(-0.25, 0.25); P(g, 'cyl', 0x5aa84a, [rx, h / 2, rz], [0.025, h, 0.025], [rand(-0.1, 0.1), 0, rand(-0.1, 0.1)]); if (j % 2) P(g, 'cyl', 0x7a5234, [rx, h, rz], [0.05, 0.28, 0.05]); } } }
      const dk = grp(chunk(p.x - 8.5, p.z), p.x - 8.5, 0, p.z);
      for (let i = 0; i < 9; i++) P(dk, 'box', i % 2 ? 0xb08050 : 0xa87646, [-2.1 + i * 0.52, 0.32, 0], [0.48, 0.1, 1.7]);
      for (const sx of [-2, 0, 2]) for (const sz of [1, -1]) P(dk, 'cyl', 0x7a5234, [sx, 0.25, sz * 0.8], [0.1, 0.9, 0.1]);
      W.colliders.push({ x: p.x, z: p.z, r: p.r - 0.3, pond: 1 });
      sign(scene, 23, 14, 'Pond');
    }
    { // campfire + tent
      const f = W.FIRE, g = grp(scene, f.x, 0, f.z);
      for (let i = 0; i < 9; i++) P(g, 'rock', pick([0x9a9aa4, 0x8a8a96]), [Math.cos(i * 0.7) * 0.78, 0.12, Math.sin(i * 0.7) * 0.78], [0.22, 0.16, 0.2], [i, i, 0]);
      for (let i = 0; i < 3; i++) P(g, 'cyl', 0x6a4226, [0, 0.16, 0], [0.09, 1.15, 0.09], [1.3, i * 2.1, 0]);
      TT.bakeDeep(g);
      const fl = P(g, 'cone', TT.glow(0xff7a1a), [0, 0.62, 0], [0.4, 1, 0.4]), fl2 = P(g, 'cone', TT.glow(0xffe060), [0, 0.46, 0], [0.23, 0.6, 0.23]);
      const sparks = []; for (let i = 0; i < 5; i++) sparks.push(P(g, 'sph', TT.glow(0xffc040), [0, 0, 0], 0.045));
      W.anim.push(t => { fl.scale.y = 1 + Math.sin(t * 13) * 0.18; fl2.scale.y = 0.6 + Math.sin(t * 17 + 1) * 0.14; fl.rotation.y = t * 3; sparks.forEach((s, i) => { const k = (t * 0.6 + i * 0.2) % 1; s.position.set(Math.sin(i * 2.4 + k * 3) * 0.3, 0.6 + k * 2, Math.cos(i * 1.7 + k * 2) * 0.3); s.scale.setScalar(0.05 * (1 - k)); }); });
      const tx = f.x + 4.5, tz = f.z + 2, tg = grp(chunk(tx, tz), tx, 0, tz); tg.rotation.y = -0.6;
      P(tg, 'prism', 0xe8a030, [0, 0, 0], [3.4, 2.1, 3]); P(tg, 'prism', 0x7a4a2a, [0.02, 0, 0], [3.42, 1.5, 1.5]); P(tg, 'box', 0xf5e6b8, [0, 2.08, 0], [3.5, 0.08, 0.16]);
      W.colliders.push({ x: f.x, z: f.z, r: 0.95 }, { x: tx, z: tz, r: 1.9 });
      for (const a of [2.2, 3.6]) { const lg = grp(chunk(f.x, f.z), f.x + Math.cos(a) * 2.3, 0, f.z + Math.sin(a) * 2.3); lg.rotation.y = -a + 1.57; P(lg, 'cyl', 0x9a6a3a, [0, 0.24, 0], [0.25, 1.6, 0.25], [0, 0, 1.57]); for (const s of [1, -1]) P(lg, 'cyl', 0xe0b880, [s * 0.81, 0.24, 0], [0.2, 0.02, 0.2], [0, 0, 1.57]); }
      sign(scene, 1.5, 24.5, 'Campfire');
    }
    { // nest
      const n = W.NEST, g = grp(chunk(n.x, n.z), n.x, 0, n.z);
      for (let i = 0; i < 14; i++) P(g, 'cyl', i % 2 ? 0x9a7a4a : 0xb89058, [Math.cos(i * 0.45) * 0.72, 0.13 + (i % 3) * 0.05, Math.sin(i * 0.45) * 0.72], [0.07, 0.75, 0.07], [1.5, -i * 0.45, 0.2]);
      P(g, 'cyl', 0xc8a868, [0, 0.07, 0], [0.7, 0.12, 0.7]);
    }
    { // north gate
      const g = grp(scene, 0, 0, -57);
      for (const s of [1, -1]) { P(g, 'box', 0xcfcfd8, [s * 4.2, 2.2, 0], [1.4, 4.4, 1.4]); P(g, 'box', 0xb8b8c2, [s * 4.2, 0.3, 0], [1.8, 0.6, 1.8]); P(g, 'pyr', 0x5a7ab8, [s * 4.2, 5.1, 0], [1.3, 1.4, 1.3], [0, 0.785, 0]); }
      P(g, 'box', 0x5a7ab8, [0, 4.5, 0], [8.6, 0.7, 0.9]); P(g, 'box', 0xfff7e0, [0, 4.5, 0.48], [5, 0.45, 0.05]);
      for (const s of [1, -1]) P(g, 'cyl', 0x8a8a94, [s * 3.3, 0.6, 0.5], [0.09, 1.2, 0.09]);
      for (let i = 0; i < 6; i++) P(g, 'box', i % 2 ? 0xe2382e : 0xffd23c, [-2.75 + i * 1.1, 1.05, 0.5], [1.1, 0.24, 0.2]);
      TT.bakeDeep(g);
      const l = TT.label('THE CITY', 'rgba(0,0,0,0)'); l.material.depthTest = true; l.material.color.setHex(0x2a3a6a); l.position.set(0, 4.5, 0.6); l.scale.set(4.4, 1.1, 1); g.add(l);
      sign(scene, -5.4, -52, 'City ➜ soon!');
    }

    // ---- lamps, planters, fence ----
    for (const v of [-42, -26, 26, 42]) { lamp(v, 3.6); lamp(-3.6, v); }
    for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.39, x = Math.cos(a) * 10.8, z = Math.sin(a) * 10.8; if (Math.abs(x) < 3.5 || Math.abs(z) < 3.5) continue; const g = grp(chunk(x, z), x, 0, z); P(g, 'cyl', 0xc8c8d2, [0, 0.25, 0], [0.6, 0.5, 0.6]); for (let j = 0; j < 6; j++) P(g, 'sph', pick([0xff6a8a, 0xffe060, 0xb08af0, 0xffffff]), [Math.cos(j) * 0.3, 0.58, Math.sin(j) * 0.3], 0.16); P(g, 'ico', 0x57b558, [0, 0.55, 0], 0.32); W.colliders.push({ x, z, r: 0.7 }); }
    const F = LIM + 1.4;
    for (let i = -F; i <= F + 0.01; i += 2.4) for (const [x, z, ry] of [[i, -F, 0], [i, F, 0], [-F, i, 1.5708], [F, i, 1.5708]]) {
      if (z === -F && Math.abs(x) < 5.2) continue;
      const g = grp(chunk(x, z), x, 0, z); g.rotation.y = ry;
      P(g, 'box', 0xd8b070, [0, 0.6, 0], [0.2, 1.2, 0.2]); P(g, 'pyr', 0xd8b070, [0, 1.3, 0], [0.16, 0.2, 0.16], [0, 0.785, 0]);
      if (i + 2.4 <= F + 0.01) { P(g, 'box', 0xe8c890, [1.2, 0.85, 0], [2.4, 0.13, 0.09]); P(g, 'box', 0xe8c890, [1.2, 0.45, 0], [2.4, 0.13, 0.09]); }
    }

    // ---- trees, bushes, rocks, flowers ----
    const free = (x, z, m) => {
      if (Math.abs(x) < 4.5 + m && Math.abs(z) < 58) return false; if (Math.abs(z) < 4.5 + m && Math.abs(x) < 54) return false;
      if (Math.hypot(x, z) < 15) return false;
      for (const c of W.colliders) { if (c.r != null) { if (Math.hypot(x - c.x, z - c.z) < c.r + 2.5 + m) return false; } else if (x > c.x0 - 2.5 - m && x < c.x1 + 2.5 + m && z > c.z0 - 2.5 - m && z < c.z1 + 5 + m) return false; }
      for (const zn of W.zones) if (Math.hypot(x - zn.x, z - zn.z) < zn.r - 2) return false;
      if (Math.hypot(x - W.FIRE.x, z - W.FIRE.z) < 8) return false;
      if (Math.hypot(x - W.STARSPOT.x, z - W.STARSPOT.z) < 2.5) return false;
      for (const q of PATHS) { const dx = q[2] - q[0], dz = q[3] - q[1], t = TT.clamp(((x - q[0]) * dx + (z - q[1]) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(x - q[0] - dx * t, z - q[1] - dz * t) < q[4] / 2 + 1.5 + m) return false; }
      return true;
    };
    for (const [x, z] of [[11, 11], [-11, 11], [11, -11.5], [-11, -11], [6, -18], [-6, 18]]) { tree(x, z, 0.85, 'blossom', true); }
    for (let i = 0; i < 80; i++) { const x = rand(-54, 54), z = rand(-54, 54); if (free(x, z, 0)) tree(x, z, rand(0.75, 1.05), Math.random() < 0.3 ? 'pine' : 'leaf', true); }
    for (const a of [0.3, 1.5, 4.8, 5.6]) tree(W.STARSPOT.x + Math.cos(a) * 3.2, W.STARSPOT.z + Math.sin(a) * 3.2, 1.15, 'leaf', true);
    for (let r = 0; r < 3; r++) for (let i = -70; i <= 70; i += 4.4) {
      const o = LIM + 4.5 + r * 4.6, j = () => rand(-1.3, 1.3);
      for (const [x, z] of [[i + j(), -o + j()], [i + j(), o + j()], [-o + j(), i + j()], [o + j(), i + j()]]) { if (z < -LIM && Math.abs(x) < 6) continue; tree(x, z, rand(1.1, 1.7), Math.random() < 0.55 ? 'pine' : 'leaf'); }
    }
    for (let i = 0; i < 60; i++) { const x = rand(-55, 55), z = rand(-55, 55); if (free(x, z, -0.8)) { if (i % 3) bush(x, z, rand(0.7, 1.2), i % 4 ? null : pick([0xe8402a, 0x6a8ae0])); else rock(x, z, rand(0.6, 1.3)); } }
    for (let i = 0; i < 90; i++) { const x = rand(-55, 55), z = rand(-55, 55); if (free(x, z, -1.6)) flowers(x, z, 5, 0.9); }
    for (const z of W.zones) if (!z.ring) for (let i = 0; i < 150; i++) {
      const a = Math.random() * 7, r = Math.sqrt(Math.random()) * (z.r - 0.5), x = z.x + Math.cos(a) * r, zz = z.z + Math.sin(a) * r, g = grp(chunk(x, zz), x, 0, zz), c = pick([0x3f8a30, 0x4a9a3a, 0x358028]);
      for (let j = 0; j < 3; j++) P(g, 'pyr', c, [rand(-0.2, 0.2), 0.32, rand(-0.2, 0.2)], [0.13, rand(0.55, 0.85), 0.13], [rand(-0.25, 0.25), rand(0, 3), rand(-0.25, 0.25)]);
    }
    // arena scenery
    const A = W.ARENA;
    const ar = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: arenaTexture() })); ar.rotation.x = -Math.PI / 2; ar.position.set(A.x, 0.02, A.z); ar.receiveShadow = true; scene.add(ar);
    for (let i = 0; i < 13; i++) tree(A.x - 16 + i * 2.7 + rand(-0.5, 0.5), A.z - 8 - rand(0, 4), rand(1, 1.5), i % 3 ? 'leaf' : 'pine');
    for (let i = 0; i < 10; i++) { const x = A.x + rand(-11, 11), z = A.z - rand(5, 7); if (i % 2) bush(x, z, rand(0.7, 1.1), i % 4 === 1 ? 0xe8402a : null); else rock(x, z, rand(0.6, 1.2)); flowers(A.x + rand(-8, 8), A.z + rand(-3, 3.5) + (i % 2 ? 2.6 : -2.6), 4, 0.7); }

    for (const k in chunks) { const ch = chunks[k]; scene.add(ch); TT.bakeDeep(ch); prune(ch); }

    // chimney smoke
    const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }), puffs = [];
    smokes.filter((s, i) => i % 2 === 0).forEach(s => { for (let i = 0; i < 4; i++) puffs.push({ m: P(scene, 'sphS', sm, s, 0.3), s, o: i / 4 }); });
    W.anim.push(t => { for (const p of puffs) { const k = (t * 0.22 + p.o) % 1; p.m.position.set(p.s[0] + k * 1.6 + Math.sin(k * 5 + p.o * 9) * 0.25, p.s[1] + k * 3.4, p.s[2]); p.m.scale.setScalar(0.25 + k * 0.75); } });

    // pickups
    for (const b of BALLS) { const o = TT.ballModel(0.26); o.position.set(b[0], 0.5, b[1]); scene.add(o); W.pickups.push({ o, x: b[0], z: b[1], t: 0 }); }
    W.anim.push(t => { for (const p of W.pickups) { p.o.rotation.y = t * 2; p.o.position.y = 0.55 + Math.sin(t * 3 + p.x) * 0.12; } });
  };

  // push a circle (x,z,r) out of every collider; returns [x,z]
  W.collide = function (x, z, r) {
    for (const c of W.colliders) {
      if (c.r != null) {
        const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
        if (d < m && d > 0.0001) { x = c.x + dx / d * m; z = c.z + dz / d * m; }
      } else if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) {
        const l = x - (c.x0 - r), rr = (c.x1 + r) - x, t = z - (c.z0 - r), b = (c.z1 + r) - z, mn = Math.min(l, rr, t, b);
        if (mn === l) x = c.x0 - r; else if (mn === rr) x = c.x1 + r; else if (mn === t) z = c.z0 - r; else z = c.z1 + r;
      }
    }
    return [TT.clamp(x, -LIM, LIM), TT.clamp(z, -LIM, LIM)];
  };
  W.blocked = (x, z, r) => { const p = W.collide(x, z, r); return Math.abs(p[0] - x) > 0.01 || Math.abs(p[1] - z) > 0.01; };
  W.update = (t, cam, px, pz) => {
    for (const f of W.anim) f(t);
    if (cam) { W.back.position.set(cam.position.x, 0, cam.position.z); W.clouds.rotation.y = t * 0.004; }
    for (const b of W.occ) {
      const gap = b.z - b.d / 2 - pz, hit = px != null && Math.abs(px - b.x) < b.w / 2 + 1 && gap > -0.5 && gap < b.h * 0.95;
      const o = b.o + ((hit ? 0.2 : 1) - b.o) * 0.16;
      if (Math.abs(o - b.o) > 0.001) { b.o = o; b.m.material.opacity = o; const tr = o < 0.98; if (b.m.material.transparent !== tr) { b.m.material.transparent = tr; b.m.material.needsUpdate = true; } }
    }
  };

  // townsfolk: [key, model, name, x, z, wanderRadius, lines]
  W.NPCS = [
    ['prof', 'prof', 'Professor Oak', 3.5, -24, 2, []],
    ['nurse', 'nurse', 'Nurse Joy', -16.2, -4.4, 0, []],
    ['guard', 'guard', 'Officer Gus', 3.2, -53, 0, ["Halt! The road to the City isn't open yet.", "Practice here in town first. The City is coming soon!", "I heard seven Dragon Balls are hidden across the world. Three of them are right here in town!"]],
    ['mom', 'mom', 'Mrs. Rosa', 12, -4.5, 4, ["Welcome to Trainer Town, sweetie!", "If your Pokémon get tired, visit Nurse Joy at the Poké Center. The red roof!", "Look for red-and-white Poké Balls on the ground. You need them to catch Pokémon."]],
    ['grandpa', 'grandpa', 'Grandpa Sol', -10, 5, 5, ["Back in my day we walked through tall grass uphill both ways!", "Wild Pokémon live in the dark green tall grass. Walk up to one to battle it.", "Here's a secret: make a wild Pokémon's HP small BEFORE you throw a ball. It's much easier to catch!"]],
    ['kid', 'kid', 'Max', 7, 9, 6, ["Did you know? Water beats Fire, Fire beats Grass, and Grass beats Water!", "Electric moves are super strong against Water and Flying Pokémon!", "When your Pokémon wins battles it levels up. Some Pokémon even EVOLVE!"]],
    ['girl', 'girl', 'Mia', -6, -9, 6, ["I saw a mysterious egg in a nest! It's in the far corner of the West Meadow.", "Eggs need to be warm to hatch. I bet the campfire would work!", "I wonder what Pokémon is inside an egg? It's always a surprise!"]],
    ['fisher', 'fisher', 'Fisher Finn', 21.5, 21, 0, ["Shhh... the Psyduck get a headache when it's loud.", "Squirtle and Psyduck live around this pond.", "Something shiny is hiding in the trees behind the pond... I can't reach it."]],
    ['hiker', 'hiker', 'Hiker Hank', 9, 30, 2, ["Ahh, nothing like a warm campfire.", "Carry an egg close to this fire and it will warm right up!", "Watch out for Team Rocket! They're always trying to steal Pokémon. But they always lose. Ha!"]]
  ];
  W.PETS = [['eevee', 'Eevee', -4, 6, 6, 'Vee! Eevee! (It wags its fluffy tail.)'], ['psyduck', 'Psyduck', 26, 15.5, 3, 'Psy...? Psy-yi-yi! (It holds its head.)'], ['pidgey', 'Pidgey', 5, -15, 7, 'Pidgey! Pidge! (It flaps happily.)'], ['bulbasaur', 'Bulbasaur', -22, 4, 5, 'Bulba! Bulbasaur! (It smiles at you.)'], ['squirtle', 'Squirtle', 14, 4, 5, 'Squirtle squirt! (It gives you a thumbs up.)']];
})();
