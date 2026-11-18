// world2.js — the Wide World (hills, a river, a forest, Goku's peak, Team Rocket's hideout) and the
// themed battle stages. Uses the prop helpers exported by world.js (W.H).
(function () {
  const TT = window.TT, P = TT.P, rand = TT.rand, pick = TT.pick, W = TT.World;
  const { grp, chunk, tree, bush, rock, flowers, lamp, sign, occ, shade } = W.H;
  const WHITE = 0xffffff;
  const ss = (a, b, v) => { const t = TT.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const WW = W.WW = { x0: 72.5, x1: 249.5, z0: -187.5, z1: -12.5 };
  const MX0 = 56, MX1 = 282, MZ0 = -217, MZ1 = 17;
  W.PLATEAU = { x: 226, z: -100, r: 17.5 };
  W.HIDEOUT = { x: 204, z: -166 };
  W.SNORLAX = { x: 207.4, z: -100, r: 3.2 };
  W.RANGER = { x: 86, z: -104.5 };
  W.riverX = z => 140 + 7 * Math.sin(z * 0.045) + 3 * Math.sin(z * 0.11);
  W.BRIDGES = [-100, -42];
  const RW = 4.2;

  // ---------------- terrain height ----------------
  function wallAt(x, z) {
    const ox = Math.max(WW.x0 - x, x - WW.x1, 0), oz = Math.max(WW.z0 - z, z - WW.z1, 0);
    let w = Math.max(ox, oz);
    if (x < WW.x0 + 0.5) w *= ss(4.2, 9.5, Math.abs(z + 100));                 // the pass from the City stays open
    return Math.min(w, 15) * ss(MX0, MX0 + 7, x) * ss(MZ1, MZ1 - 8, z) * ss(MX1, MX1 - 8, x) * ss(MZ0, MZ0 + 8, z);
  }
  W.h = (x, z) => {
    if (x < MX0 || x > MX1 || z > MZ1 || z < MZ0) return 0;
    let h = (0.95 + 0.55 * Math.sin(x * 0.07 + 1) * Math.cos(z * 0.06) + 0.3 * Math.sin((x - z) * 0.11)) * ss(70, 86, x) + 0.2 * ss(56, 72, x);
    if (x > 90) { const d = Math.abs(x - W.riverX(z)); h = 0.25 + (h - 0.25) * ss(4.6, 16, d); if (d < 4.6) h = 0.25 - 0.85 * (1 - ss(3.0, 4.6, d)); }
    const pk = ss(21.5, 15.5, Math.hypot(x - W.PLATEAU.x, z - W.PLATEAU.z)); h = h * (1 - pk) + 4.6 * pk;
    const kh = ss(22, 15, Math.hypot((x - 204) * 0.8, z + 166)); h = h * (1 - kh) + 0.6 * kh;           // flat ground for the hideout
    const kr = ss(10, 6, Math.hypot(x - 86, z + 112)); h = h * (1 - kr) + 0.9 * kr;                    // and the ranger cabin
    const w = wallAt(x, z);
    if (w > 0) h += Math.pow(w, 1.3) * 0.85 + 1.6 * Math.abs(Math.sin(x * 0.31) * Math.sin(z * 0.27)) * ss(0, 5, w);
    return h;
  };
  // where feet go: the terrain, or a bridge deck
  W.gy = (x, z) => {
    if (x < MX0) return 0;
    let h = W.h(x, z);
    for (const b of W.BRIDGES) if (Math.abs(z - b) < 2.4 && Math.abs(x - W.riverX(b)) < 7.5) h = Math.max(h, 0.58);
    return h;
  };
  // walking rules east of the City: the pass, the Wide World box, and the river (cross on bridges)
  W.wwCollide = (x, z, r) => {
    if (x < WW.x0) { if (Math.abs(z + 100) <= 3.8) return [x, z]; return [x < 63 ? W.CITY.hw : WW.x0, z]; }
    x = TT.clamp(x, WW.x0, WW.x1); z = TT.clamp(z, WW.z0, WW.z1);
    const rx = W.riverX(z), d = x - rx;
    if (Math.abs(d) < RW + r) {
      const near = W.BRIDGES.find(b => Math.abs(z - b) < 3.2);
      if (near == null) x = rx + Math.sign(d || 1) * (RW + r);
      else if (Math.abs(z - near) > 1.9) z = near + Math.sign(z - near) * 1.9;
    }
    return [x, z];
  };

  // ---------------- data: zones, people, places ----------------
  W.zones.push(
    { name: 'Riverbank', x: 120, z: -62, r: 12, n: 4, lv: [9, 12], pool: ['poliwag', 'poliwag', 'magikarp', 'magikarp', 'psyduck', 'squirtle'], rare: ['dratini', 0.15] },
    { name: 'Windy Meadow', x: 100, z: -142, r: 15, n: 4, lv: [9, 12], pool: ['ponyta', 'ponyta', 'pidgeotto', 'eevee', 'growlithe', 'rattata'] },
    { name: 'Whisper Forest', x: 190, z: -48, r: 14, n: 4, lv: [10, 13], pool: ['oddish', 'caterpie', 'bulbasaur', 'eevee', 'pikachu', 'butterfree', 'raichu'], rare: ['abra', 0.15] },
    { name: 'Rocky Slope', x: 180, z: -130, r: 11, n: 4, lv: [10, 13], pool: ['geodude', 'geodude', 'machop', 'ponyta', 'magnemite'] });
  W.NPCS.push(
    ['guard2', 'guard', 'Officer Gail', 51.5, -95.5, 0, ["The Wide World is past this gate.", "Only trainers who beat the City Gym can go through."]],
    ['ranger', 'ranger', 'Ranger Rita', W.RANGER.x, W.RANGER.z, 0, []],
    ['fisher2', 'fisher', 'Fisher Faye', 129, -78, 2, ["A Magikarp splashing around? Keep training it. It becomes a mighty Gyarados!", "I once saw a rare Dratini in this river. It sparkled!", "Use the bridges to cross the river. The water is too fast to swim."]],
    ['hiker2', 'hiker', 'Hiker Hal', 176, -112, 2, ["A huge Snorlax is asleep on the path to the peak. It won't budge!", "Goku trains on top of the peak. You can see Rayquaza flying up there!", "Geodude look like rocks. Watch your step on the slope!"]],
    ['camper', 'kid', 'Camper Kai', 175, -62, 3, ["Whisper Forest is full of Bug and Grass Pokémon.", "Shh! A sparkly Abra might be nearby. If you see one, catch it fast!", "Team Rocket built a hideout south of here. I saw a giant robot!"]],
    ['hideout', 'jessie', 'Jessie', 201.5, -152.4, 0, []],
    ['hideout', 'james', 'James', 206.5, -152.4, 0, []],
    ['goku', 'goku', 'Goku', W.PLATEAU.x, W.PLATEAU.z, 0, []]);
  W.PETS.push(['ponyta', 'Ponyta', 96, -118, 4, 'Neigh! (Its fiery mane flickers.)'], ['poliwag', 'Poliwag', 124, -92, 3, 'Poli! Poliwag! (It wiggles its tail.)']);
  W.WORLD_PLACES = [
    ['Ranger Cabin', 86, -112, '🏕', 'Ranger Rita heals your Pokémon.', 86, -103],
    ['Riverbank', 120, -62, '🎣', 'Poliwag and Magikarp. A rare Dratini lives here!', 120, -62],
    ['Big Bridge', W.riverX(-100), -100, '🌉', 'Cross the river here.', W.riverX(-100) - 7, -100],
    ['Windy Meadow', 100, -142, '🌾', 'Ponyta, Pidgeotto, Eevee and Growlithe.', 100, -142],
    ['Whisper Forest', 190, -48, '🌲', 'Bug and Grass Pokémon. A rare Abra hides here!', 190, -48],
    ['Rocky Slope', 180, -130, '⛰', 'Geodude, Machop and Magnemite.', 180, -130],
    ['Snorlax Pass', 200, -110, '💤', 'A sleepy Snorlax blocks the way to the peak!', 202, -100],
    ["Goku's Peak", 226, -100, '🐉', 'Goku trains here with Rayquaza.', 226, -96],
    ['Rocket Hideout', 204, -166, '🚀', 'Team Rocket is up to something!', 204, -150],
    ['City Gate', 82, -96, '🚧', 'Back to the City.', 76, -100]];
  const BALLS2 = [[90, -96], [110, -120], [124, -70], [102, -150], [150, -78], [172, -96], [196, -60], [188, -122], [216, -140], [160, -150], [120, -175], [232, -30]];

  // ---------------- textures ----------------
  W.waterTex = (rep) => {
    if (!W._wt) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#bfeaff'); g.addColorStop(0.12, '#4aa8e8'); g.addColorStop(0.5, '#2f86d0'); g.addColorStop(0.88, '#4aa8e8'); g.addColorStop(1, '#bfeaff');
      x.fillStyle = g; x.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 70; i++) { x.fillStyle = i % 3 ? 'rgba(200,235,255,.45)' : 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(rand(6, 58), rand(0, 256), rand(2, 7), rand(5, 16), 0, 0, 7); x.fill(); }
      W._wt = c;
    }
    const t = new THREE.CanvasTexture(W._wt); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, rep || 1);
    (W._wts = W._wts || []).push(t); return t;
  };
  const PATHS2 = [[56, -100, 208, -100, 4.4], [163, -100, 190, -60, 3.4], [190, -60, 190, -36, 3], [180, -100, 204, -152, 3.4], [100, -100, 118, -66, 3], [96, -100, 100, -134, 3],
    [118, -60, 160, -42, 3], [160, -42, 182, -46, 3], [86, -100, 86, -108, 2.4], [190, -44, 247, -45, 3.2]];
  function worldTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 2048; const x = c.getContext('2d'), kx = 2048 / (MX1 - MX0), kz = 2048 / (MZ1 - MZ0), X = v => (v - MX0) * kx, Z = v => (v - MZ0) * kz, k = (kx + kz) / 2;
    x.fillStyle = '#74c450'; x.fillRect(0, 0, 2048, 2048);
    for (let i = 0; i < 520; i++) { const X0 = Math.random() * 2048, Y0 = Math.random() * 2048, R = rand(40, 150), g = x.createRadialGradient(X0, Y0, 0, X0, Y0, R); g.addColorStop(0, i % 2 ? 'rgba(150,225,105,.28)' : 'rgba(70,150,62,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(X0 - R, Y0 - R, R * 2, R * 2); }
    const blades = ['rgba(60,150,60,.4)', 'rgba(170,235,120,.4)', 'rgba(95,185,75,.45)'];
    for (let i = 0; i < 15000; i++) { x.fillStyle = blades[i % 3]; x.fillRect(Math.random() * 2048, Math.random() * 2048, 2, rand(4, 9)); }
    // mountains, river banks, plateau
    // rock is painted on its own layer in big soft patches, then blurred into the grass (no more checkerboard squares)
    const ROCK = ['#9a8f80', '#8d8375', '#a89c8a', '#94897a'], rc = document.createElement('canvas'); rc.width = rc.height = 2048; const rx2 = rc.getContext('2d');
    for (let gx = MX0; gx < MX1; gx += 1.5) for (let gz = MZ0; gz < MZ1; gz += 1.5) {
      const cx = gx + 0.75, cz = gz + 0.75, w = wallAt(cx, cz), dp = Math.hypot(cx - W.PLATEAU.x, cz - W.PLATEAU.z);
      const tone = ROCK[Math.min(3, Math.floor((Math.sin(cx * 0.21 + cz * 0.07) + Math.sin(cz * 0.17 - cx * 0.05) + 2) * 0.999))];
      if (w > 0.4) { rx2.globalAlpha = ss(0.4, 3.5, w); rx2.fillStyle = W.h(cx, cz) > 13 ? '#f2f6fa' : tone; rx2.fillRect(X(gx) - 1, Z(gz) - 1, 1.5 * kx + 2, 1.5 * kz + 2); }
      else if (dp < 22) { rx2.globalAlpha = 0.62 * ss(22, 15, dp); rx2.fillStyle = tone; rx2.fillRect(X(gx) - 1, Z(gz) - 1, 1.5 * kx + 2, 1.5 * kz + 2); }
    }
    try { x.filter = 'blur(7px)'; } catch (e) { }
    x.drawImage(rc, 0, 0); x.filter = 'none';
    // pebbles and cracks give the stone some grain
    for (let i = 0; i < 9000; i++) {
      const cx = rand(MX0, MX1), cz = rand(MZ0, MZ1), w = wallAt(cx, cz), dp = Math.hypot(cx - W.PLATEAU.x, cz - W.PLATEAU.z); if (w < 1 && dp > 17) continue;
      x.globalAlpha = 0.35; x.fillStyle = i % 3 ? 'rgba(70,62,54,1)' : 'rgba(225,215,200,1)'; x.beginPath(); x.ellipse(X(cx), Z(cz), rand(1.5, 5), rand(1, 3), rand(0, 3), 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    for (let z = MZ0; z < MZ1; z += 1) { const rx = W.riverX(z); const g = x.createLinearGradient(X(rx - 7), 0, X(rx + 7), 0); g.addColorStop(0, 'rgba(230,212,160,0)'); g.addColorStop(0.25, '#e6d4a0'); g.addColorStop(0.75, '#e6d4a0'); g.addColorStop(1, 'rgba(230,212,160,0)'); x.fillStyle = g; x.fillRect(X(rx - 7), Z(z), 14 * kx, kz + 1); }
    // tall grass patches
    for (const zn of W.zones) if (zn.x > 60) {
      const g = x.createRadialGradient(X(zn.x), Z(zn.z), zn.r * k * 0.8, X(zn.x), Z(zn.z), zn.r * k * 1.05); g.addColorStop(0, zn.name === 'Rocky Slope' ? '#8a9a5a' : '#4a973a'); g.addColorStop(1, 'rgba(74,151,58,0)');
      x.fillStyle = g; x.beginPath(); x.arc(X(zn.x), Z(zn.z), zn.r * k * 1.06, 0, 7); x.fill();
      for (let i = 0; i < 420; i++) { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * zn.r; x.fillStyle = i % 2 ? '#3c8530' : '#57a544'; x.fillRect(X(zn.x + Math.cos(a) * r) - 2, Z(zn.z + Math.sin(a) * r) - 5, 4, 10); }
    }
    // forest floor
    { const g = x.createRadialGradient(X(190), Z(-48), 10 * k, X(190), Z(-48), 26 * k); g.addColorStop(0, 'rgba(50,110,45,.0)'); g.addColorStop(0.5, 'rgba(50,110,45,.55)'); g.addColorStop(1, 'rgba(50,110,45,0)'); x.fillStyle = g; x.fillRect(X(160), Z(-80), 60 * k, 60 * k);
      for (let i = 0; i < 500; i++) { const a = Math.random() * 7, r = rand(10, 24); x.fillStyle = pick(['#c8742a', '#e8a030', '#8a5a2a', '#d85a3a']); x.fillRect(X(190 + Math.cos(a) * r), Z(-48 + Math.sin(a) * r), 4, 3); } }
    // hideout concrete pad
    x.fillStyle = '#b4b6be'; x.fillRect(X(188), Z(-179), 32 * kx, 25 * kz);
    for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#f2c230' : '#2a2a30'; x.fillRect(X(188 + i * 0.8), Z(-155.6), 0.8 * kx, 0.7 * kz); }
    x.strokeStyle = 'rgba(120,122,130,.6)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(X(188 + i * 4), Z(-179)); x.lineTo(X(188 + i * 4), Z(-154)); x.stroke(); }
    // paths
    x.lineCap = 'round';
    for (const pass of [0, 1]) for (const q of PATHS2) { x.strokeStyle = pass ? '#e6cc94' : '#bf9e62'; x.lineWidth = (q[4] + (pass ? 0 : 0.7)) * k; x.beginPath(); x.moveTo(X(q[0]), Z(q[1])); x.lineTo(X(q[2]), Z(q[3])); x.stroke(); }
    for (let i = 0; i < 1800; i++) { const a = PATHS2[i % PATHS2.length], t = Math.random(), w = a[4] * 0.42; x.fillStyle = i % 3 ? 'rgba(200,170,110,.5)' : 'rgba(250,235,190,.6)'; x.beginPath(); x.ellipse(X(a[0] + (a[2] - a[0]) * t + rand(-w, w)), Z(a[1] + (a[3] - a[1]) * t + rand(-w, w)), rand(2, 5), rand(2, 4), 0, 0, 7); x.fill(); }
    // plateau training ring
    x.strokeStyle = '#8a6a4a'; x.lineWidth = 0.5 * k; x.beginPath(); x.arc(X(W.PLATEAU.x), Z(W.PLATEAU.z), 9 * k, 0, 7); x.stroke();
    W.worldCanvas = c; W.worldMap = { x0: MX0, z0: MZ0, w: MX1 - MX0, d: MZ1 - MZ0 };
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; W.worldTex = t; return t;
  }

  // ---------------- the Wide World ----------------
  W.buildWorld = function* (scene) {
    // terrain
    const geo = new THREE.PlaneGeometry(MX1 - MX0, MZ1 - MZ0, 113, 117), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const px = pos.getX(i), py = pos.getY(i), x = (MX0 + MX1) / 2 + px, z = (MZ0 + MZ1) / 2 - py; pos.setXYZ(i, x, W.h(x, z), z); }
    geo.computeVertexNormals();
    const land = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: worldTexture() })); land.receiveShadow = true; scene.add(land); W.wwLand = land;
    yield 'Filling the river';
    // river water (flowing)
    { const segs = 117, wv = [], uv = [], idx = [];
      for (let i = 0; i <= segs; i++) { const z = MZ0 + (MZ1 - MZ0) * i / segs, rx = W.riverX(z); wv.push(rx - 4.5, 0.02, z, rx + 4.5, 0.02, z); uv.push(0, i * 0.5, 1, i * 0.5); if (i < segs) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const tx = W.waterTex(1), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tx })); scene.add(m);
      W.anim.push(t => { tx.offset.y = -t * 0.35; });
      for (let i = 0; i < 26; i++) { const z = rand(-185, -15), rx = W.riverX(z) + rand(-2.6, 2.6); if (W.BRIDGES.some(b => Math.abs(z - b) < 4)) continue; const g2 = grp(chunk(rx, z), rx, -0.15, z); P(g2, 'rock', pick([0x8a8a96, 0x9a9aa4]), [0, 0.2, 0], [rand(0.5, 0.9), rand(0.35, 0.6), rand(0.5, 0.8)], [rand(0, 3), rand(0, 3), 0]); }
    }
    // bridges
    for (const bz of W.BRIDGES) {
      const bx = W.riverX(bz), g = grp(chunk(bx, bz), bx, 0, bz);
      for (let i = 0; i < 14; i++) P(g, 'box', i % 2 ? 0xb08050 : 0xa87646, [-6.5 + i, 0.52, 0], [0.92, 0.14, 4.4]);
      for (const s of [1, -1]) { for (let i = -6; i <= 6; i += 2) { P(g, 'cyl', 0x7a5234, [i, 0.4, s * 2.15], [0.12, 1.8, 0.12]); P(g, 'sph', 0x7a5234, [i, 1.32, s * 2.15], 0.14); } P(g, 'box', 0x8a5a3a, [0, 1.15, s * 2.15], [13, 0.12, 0.12]); P(g, 'box', 0x8a5a3a, [0, 0.82, s * 2.15], [13, 0.08, 0.08]); }
      for (const sx of [-4.5, 4.5]) for (const s of [1, -1]) P(g, 'cyl', 0x6a4226, [sx, -0.2, s * 1.9], [0.22, 1.4, 0.22]);
    }
    yield 'Raising mountains';
    // the pass from the City: gate, fence and signs
    { const g = grp(scene, 55.6, 0, -100);
      for (const s of [1, -1]) { P(g, 'box', 0xcfcfd8, [0, 2.2, s * 4.6], [1.4, 4.4, 1.4]); P(g, 'box', 0xb8b8c2, [0, 0.3, s * 4.6], [1.8, 0.6, 1.8]); P(g, 'pyr', 0x3a8a5a, [0, 5.1, s * 4.6], [1.3, 1.4, 1.3], [0, 0.785, 0]); }
      P(g, 'box', 0x3a8a5a, [0, 4.5, 0], [0.9, 0.7, 9.4]); TT.bakeDeep(g);
      const l = TT.label('WIDE WORLD', 'rgba(0,0,0,0)'); l.material.depthTest = true; l.material.color.setHex(0x1f4a2a); l.position.set(0.6, 4.5, 0); l.scale.set(4.4, 1.1, 1); g.add(l);
      const bar = W.gate2Bar = grp(scene, 55.6, 0, -100); for (let i = 0; i < 7; i++) P(bar, 'box', i % 2 ? 0xe2382e : 0xffd23c, [0.4, 1.05, -3.3 + i * 1.1], [0.2, 0.24, 1.1]); TT.bakeDeep(bar);
      W.gate2Col = { x0: 54.7, x1: 56.6, z0: -104, z1: -96 }; W.colliders.push(W.gate2Col);
      sign(scene, 50.5, -105, 'Wide World ➜'); sign(scene, 77, -95.4, 'Wide World');
    }
    // ranger cabin
    { const x0 = 86, z0 = -112, y = W.h(x0, z0), g = grp(scene, x0, y, z0);
      P(g, 'box', 0x9a9aa4, [0, 0.15, 0], [8.4, 0.3, 6.4]); for (let i = 0; i < 6; i++) { P(g, 'box', i % 2 ? 0x9a6a3a : 0x8a5a30, [0, 0.55 + i * 0.5, 0], [8, 0.5, 6]); }
      P(g, 'prism', 0x3a8a4a, [0, 3.3, 0], [8.8, 2.3, 7]); P(g, 'box', 0x5a3a20, [0, 1.25, 3.05], [1.3, 2.2, 0.1]); for (const s of [1, -1]) { P(g, 'box', 0xfff4c0, [s * 2.4, 1.8, 3.04], [1.3, 1, 0.1]); P(g, 'box', 0x5a3a20, [s * 2.4, 1.8, 3.07], [1.45, 0.1, 0.06]); }
      P(g, 'box', 0x9a9aa4, [2.8, 3.8, -1], [0.7, 1.8, 0.7]); P(g, 'box', 0xe2382e, [-2.8, 0.9, 3.4], [1, 0.8, 0.6]); P(g, 'box', WHITE, [-2.8, 0.9, 3.72], [0.6, 0.15, 0.02]); P(g, 'box', WHITE, [-2.8, 0.9, 3.72], [0.15, 0.6, 0.02]);
      occ(TT.bakeDeep(g), x0, z0, 8.8, 7, 5); W.colliders.push({ x0: x0 - 4.2, x1: x0 + 4.2, z0: z0 - 3.2, z1: z0 + 3.2 });
      sign(scene, 81, -106.5, 'Ranger Cabin');
    }
    yield 'Growing the forest';
    // trees, bushes, flowers
    const dPath = (x, z) => { let m = 1e9; for (const q of PATHS2) { const dx = q[2] - q[0], dz = q[3] - q[1], t = TT.clamp(((x - q[0]) * dx + (z - q[1]) * dz) / (dx * dx + dz * dz), 0, 1); m = Math.min(m, Math.hypot(x - q[0] - dx * t, z - q[1] - dz * t) - q[4] / 2); } return m; };
    const free = (x, z, m) => {
      if (x < WW.x0 + 1 || x > WW.x1 - 1 || z < WW.z0 + 1 || z > WW.z1 - 1) return false;
      if (Math.abs(x - W.riverX(z)) < 7 + m || dPath(x, z) < 3.2 + m) return false;
      if (Math.hypot(x - W.PLATEAU.x, z - W.PLATEAU.z) < 23 + m) return false;
      if (x > 184 && x < 224 && z > -183 && z < -150) return false;
      if (x > 78 && x < 95 && z > -120 && z < -98) return false;
      for (const zn of W.zones) if (zn.x > 60 && Math.hypot(x - zn.x, z - zn.z) < zn.r - 1 + m) return false;
      for (const c of W.colliders) if (c.r != null && Math.hypot(x - c.x, z - c.z) < c.r + 2 + m) return false;
      return true;
    };
    for (let i = 0; i < 46; i++) { const a = rand(0, 6.283), r = rand(15, 25), x = 190 + Math.cos(a) * r, z = -48 + Math.sin(a) * r; if (free(x, z, 0)) tree(x, z, rand(1.1, 1.6), Math.random() < 0.35 ? 'pine' : 'leaf', true); }
    for (let i = 0; i < 230; i++) { const x = rand(WW.x0, WW.x1), z = rand(WW.z0, WW.z1); if (free(x, z, 0.5)) tree(x, z, rand(0.85, 1.35), Math.random() < (x > 165 && z < -110 ? 0.7 : 0.3) ? 'pine' : (Math.random() < 0.08 ? 'blossom' : 'leaf'), true); }
    for (let i = 0; i < 160; i++) { const x = rand(MX0 + 3, MX1 - 3), z = rand(MZ0 + 3, MZ1 - 3), w = wallAt(x, z); if (w > 1 && w < 9 && Math.random() < 0.7) tree(x, z, rand(1.1, 1.7), 'pine'); }
    for (let i = 0; i < 110; i++) { const x = rand(WW.x0, WW.x1), z = rand(WW.z0, WW.z1); if (free(x, z, -0.8)) { if (i % 3) bush(x, z, rand(0.7, 1.2), i % 4 ? null : pick([0xe8402a, 0x6a8ae0])); else rock(x, z, rand(0.6, 1.5)); } }
    for (let i = 0; i < 120; i++) { const x = rand(WW.x0, WW.x1), z = rand(WW.z0, WW.z1); if (free(x, z, -1.5)) flowers(x, z, 5, 0.9); }
    for (let i = 0; i < 24; i++) { const a = rand(0, 6.283), r = rand(6, 20), x = 190 + Math.cos(a) * r, z = -48 + Math.sin(a) * r, g = grp(chunk(x, z), x, W.h(x, z), z); P(g, 'cyl', 0xf4f0e0, [0, 0.12, 0], [0.05, 0.24, 0.05]); P(g, 'sph', pick([0xe2382e, 0xe8a030]), [0, 0.26, 0], [0.16, 0.1, 0.16]); P(g, 'sph', WHITE, [0.06, 0.32, 0.05], 0.03); }
    for (let i = 0; i < 260; i++) { const x = rand(WW.x0, WW.x1), z = rand(WW.z0, WW.z1); if (!free(x, z, -1.4)) continue; const g = grp(chunk(x, z), x, W.h(x, z), z), c = pick([0x5cb84c, 0x69c456, 0x4fa844]); for (let j = 0; j < 3; j++) P(g, 'pyr', c, [rand(-0.15, 0.15), 0.14, rand(-0.15, 0.15)], [0.06, rand(0.25, 0.42), 0.06], [rand(-0.35, 0.35), rand(0, 3), rand(-0.35, 0.35)]); }
    yield "Building Goku's peak";
    // Goku's plateau: a ring of boulders with one opening (where Snorlax sleeps)
    { const p = W.PLATEAU;
      for (let a = 0; a < 6.283; a += 0.15) {
        if (Math.abs(a - Math.PI) < 0.3) continue;
        const x = p.x + Math.cos(a) * p.r, z = p.z + Math.sin(a) * p.r, k = rand(1.5, 2.4), g = grp(chunk(x, z), x, W.h(x, z) - 0.3, z);
        P(g, 'rock', pick([0x9a8f80, 0x8a8072, 0xa89c8a]), [0, k * 0.55, 0], [k, k * rand(0.8, 1.3), k], [rand(0, 3), rand(0, 3), 0]); W.colliders.push({ x, z, r: 1.55 });
      }
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, x = p.x + Math.cos(a) * 9, z = p.z + Math.sin(a) * 9, g = grp(chunk(x, z), x, W.h(x, z), z); P(g, 'box', 0xb8a890, [0, 0.35, 0], [0.9, 0.7, 0.9], [0, a, 0]); }
      for (const [x, z, ry] of [[220, -92, 0.4], [232, -108, -0.6]]) { const g = grp(chunk(x, z), x, W.h(x, z), z); g.rotation.y = ry; P(g, 'cyl', 0x9a6a3a, [0, 0.3, 0], [0.3, 2.2, 0.3], [0, 0, 1.57]); W.colliders.push({ x, z, r: 0.9 }); }
      sign(scene, 199, -95.6, "Goku's Peak");
      // Rayquaza circles high above the peak — you can spot it from far away
      const ray = TT.creature('rayquaza'); ray.scale.setScalar(2.2); ray.userData.live = true; scene.add(ray); W.skyRay = ray;
      W.anim.push(t => { const nearby = W.px === undefined || (W.px != null && Math.hypot(W.px - p.x, W.pz - p.z) < 95); ray.visible = ray.matrixWorldAutoUpdate = nearby; if (!nearby) return; const a = t * 0.18; ray.position.set(p.x + Math.cos(a) * 24, 20 + Math.sin(t * 0.7) * 2.5, p.z + Math.sin(a) * 24); ray.rotation.y = -a; TT.animCreature(ray, t, 1); });
    }
    yield 'Sneaking into the hideout';
    // Team Rocket's hideout
    { const h0 = W.HIDEOUT, y = W.h(h0.x, h0.z) + 0.05;
      const fence = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.4)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n, g = grp(chunk(x, z), x, y, z); P(g, 'box', 0x5a5e68, [0, 0.9, 0], [0.16, 1.8, 0.16]); if (i < n) { g.rotation.y = -Math.atan2(z1 - z0, x1 - x0); P(g, 'box', 0x8a8e98, [len / n / 2, 1.6, 0], [len / n, 0.06, 0.06]); P(g, 'box', 0x8a8e98, [len / n / 2, 0.6, 0], [len / n, 0.06, 0.06]); P(g, 'box', 0xe01818, [len / n / 2, 1.1, 0], [0.5, 0.35, 0.04]); } }
        W.colliders.push({ x0: Math.min(x0, x1) - 0.2, x1: Math.max(x0, x1) + 0.2, z0: Math.min(z0, z1) - 0.2, z1: Math.max(z0, z1) + 0.2 }); };
      fence(189, -155, 200.5, -155); fence(207.5, -155, 219, -155); fence(189, -178, 219, -178); fence(189, -178, 189, -155); fence(219, -178, 219, -155);
      // hangar
      const g = grp(scene, 204, y, -170);
      P(g, 'cyl', 0x9aa0ac, [0, 0, 0], [5.4, 13, 5.4], [0, 0, 1.57]); P(g, 'box', 0x7a808c, [0, 2.4, 0], [13.2, 0.2, 10.9]);
      P(g, 'box', 0x5a5e68, [0, 2.2, 5.1], [8, 4.4, 0.3]); P(g, 'box', 0x3a3e48, [0, 1.9, 5.25], [6.6, 3.8, 0.1]);
      P(g, 'cyl', WHITE, [0, 4.4, 5.3], [1.3, 0.1, 1.3], [1.57, 0, 0]);
      for (const q of [[-0.3, 4.4, 0.18, 1.6, 0], [0.15, 4.95, 0.75, 0.24, 0], [0.45, 4.7, 0.2, 0.55, 0], [0.15, 4.4, 0.75, 0.24, 0], [0.32, 3.95, 0.2, 0.85, 0.55]]) P(g, 'box', 0xe01818, [q[0], q[1], 5.38], [q[2], q[3], 0.06], [0, 0, q[4]]);
      for (const s of [1, -1]) { P(g, 'cone', 0xffe9a0, [s * 4.2, 3.8, 5.6], [0.35, 0.6, 0.35], [-1.2, 0, 0]); }
      occ(TT.bakeDeep(g), 204, -170, 13.2, 11, 6); W.colliders.push({ x0: 197.4, x1: 210.6, z0: -175.5, z1: -164.6 });
      for (const [cx, cz] of [[193, -160], [194.5, -161], [193.6, -162.5], [214, -159.5], [215.5, -161], [192.5, -173]]) { const c2 = grp(chunk(cx, cz), cx, y, cz); P(c2, 'box', 0xa8763a, [0, 0.55, 0], [1.1, 1.1, 1.1], [0, rand(-0.3, 0.3), 0]); P(c2, 'box', 0xe01818, [0, 0.55, 0.56], [0.35, 0.4, 0.02]); W.colliders.push({ x: cx, z: cz, r: 0.8 }); }
      for (const [cx, cz] of [[216, -172], [217, -170.8]]) { const c2 = grp(chunk(cx, cz), cx, y, cz); P(c2, 'cyl', 0x3a6ab8, [0, 0.6, 0], [0.45, 1.2, 0.45]); W.colliders.push({ x: cx, z: cz, r: 0.6 }); }
      // the R banner pole
      { const bp = grp(scene, 196.5, y, -157.2); P(bp, 'cyl', 0x5a5e68, [0, 2.2, 0], [0.1, 4.4, 0.1]); P(bp, 'box', WHITE, [0.95, 3.6, 0], [1.8, 1.4, 0.05]); for (const q of [[-0.3, 0, 0.18, 1, 0], [0.05, 0.38, 0.55, 0.18, 0], [0.28, 0.18, 0.16, 0.42, 0], [0.05, 0, 0.55, 0.18, 0], [0.2, -0.32, 0.16, 0.55, 0.55]]) P(bp, 'box', 0xe01818, [0.95 + q[0], 3.6 + q[1], 0.04], [q[2], q[3], 0.04], [0, 0, q[4]]); TT.bakeDeep(bp); W.colliders.push({ x: 196.5, z: -157.2, r: 0.3 }); }
      // the Meowth balloon, tied up behind the hangar
      const bal = grp(scene, 214, 0, -172);
      P(bal, 'sph', 0xf3e3b0, [0, 9.4, 0], [2.4, 2.6, 2.4]); for (const s of [1, -1]) P(bal, 'cone', 0x1c1c22, [s * 1.45, 11.6, 0], [0.7, 1.4, 0.35], [0, 0, -s * 0.4]);
      P(bal, 'sph', 0xf2c230, [0, 10.6, 2.15], [0.35, 0.55, 0.18]); for (const s of [1, -1]) { P(bal, 'sph', 0x1c1c22, [s * 0.75, 9.7, 2.2], [0.35, 0.45, 0.12]); P(bal, 'box', 0x1c1c22, [s * 2.2, 9.2, 1.6], [1.4, 0.06, 0.06], [0, s * 0.4, 0]); }
      P(bal, 'box', 0x9a6a3a, [0, 5.4, 0], [1.6, 1.1, 1.6]); for (const s of [1, -1]) P(bal, 'cyl', 0x6a5a48, [s * 0.7, 6.8, 0], [0.03, 2.4, 0.03]);
      TT.bakeDeep(bal); W.anim.push(t => { bal.position.y = W.h(214, -172) + Math.sin(t * 0.9) * 0.35; bal.rotation.y = Math.sin(t * 0.3) * 0.15; });
      sign(scene, 210, -151.5, 'KEEP OUT!');
    }
    // Poké Balls lying around out here
    for (const b of BALLS2) { const o = TT.ballModel(0.26), y0 = W.gy(b[0], b[1]); o.position.set(b[0], y0 + 0.55, b[1]); scene.add(o); W.pickups.push({ o, x: b[0], z: b[1], t: 0, y0 }); }
    // painted soft shadows under the Wide World trees
    { const c = W.worldCanvas, x = c.getContext('2d'), kx = c.width / (MX1 - MX0), kz = c.height / (MZ1 - MZ0);
      for (const t of W.trees) { if (t[0] < MX0 + 1 || t[1] < MZ0 || t[1] > MZ1) continue; const X = (t[0] - 0.55 * t[2] - MX0) * kx, Y = (t[1] - 0.65 * t[2] - MZ0) * kz, R = 2.4 * t[2] * kx, g = x.createRadialGradient(X, Y, R * 0.15, X, Y, R); g.addColorStop(0, 'rgba(20,62,36,.34)'); g.addColorStop(1, 'rgba(20,62,36,0)'); x.fillStyle = g; x.fillRect(X - R, Y - R, R * 2, R * 2); }
      W.worldTex.needsUpdate = true; }
  };
  W.setGate2 = open => { W.gate2Bar.visible = !open; const i = W.colliders.indexOf(W.gate2Col); if (open && i >= 0) W.colliders.splice(i, 1); if (!open && i < 0) W.colliders.push(W.gate2Col); };

  // ---------------- battle stages: each place has its own backdrop ----------------
  const ST = W.STAGES = { meadow: { x: 0, z: 400, key: 'meadow' } };
  const TINT = {
    pond: { fog: 0xcfeaff },
    gym: { sky: 0xd8ecff, fog: 0xd8ecff },
    forest: { sky: 0xb8e0b8, fog: 0x8fc890, hemi: [0xd8f0c8, 0x5a7a4a, 0.52], sun: [0xfff0c0, 0.42], near: 30, far: 110 },
    mountain: { sky: 0xe8f2ff, fog: 0xe0ecf4, near: 60, far: 260 },
    plateau: { sky: 0xffb48a, fog: 0xf4a07a, hemi: [0xffd8b8, 0x7a5a6a, 0.6], sun: [0xffa860, 0.62], near: 60, far: 260 },
    hideout: { sky: 0x6a5aa0, fog: 0x4a3a70, hemi: [0xa898e0, 0x3a2a50, 0.55], sun: [0xc8b0ff, 0.38], near: 40, far: 150 }
  };
  function stageTex(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    const base = { pond: '#ecd9a0', city: '#6a6e78', park: '#86d564', gym: '#3a8ad8', forest: '#3f7a38', river: '#7cc858', mountain: '#9a8f80', plateau: '#b08a6a', hideout: '#8a8f9a' }[kind];
    x.fillStyle = base; x.fillRect(0, 0, 512, 512);
    const dots = (n, cols, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(Math.random() * 512, Math.random() * 512, w || 2, h || rand(3, 7)); } };
    if (kind === 'pond') { dots(3000, ['rgba(200,170,110,.5)', 'rgba(255,245,210,.6)'], 2, 2); const g = x.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#c8b27a'); g.addColorStop(1, 'rgba(200,178,122,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 200); }
    else if (kind === 'city') { dots(4000, ['rgba(90,94,104,.6)', 'rgba(130,134,144,.5)'], 2, 2); x.fillStyle = '#c8c8d0'; x.fillRect(0, 0, 512, 60); x.fillStyle = '#f2e9a8'; for (let i = 0; i < 8; i++) x.fillRect(i * 66, 250, 40, 6); x.fillStyle = '#f4f4f4'; for (let i = 0; i < 9; i++) x.fillRect(150 + i * 24, 440, 12, 60); }
    else if (kind === 'park' || kind === 'river') { dots(3000, ['rgba(60,150,60,.35)', 'rgba(170,235,120,.35)']); if (kind === 'park') { x.strokeStyle = '#e6cc94'; x.lineWidth = 26; x.beginPath(); x.arc(256, 256, 210, 0, 7); x.stroke(); } else { x.fillStyle = '#e6d4a0'; x.fillRect(0, 0, 512, 70); dots(300, ['#8a8a96', '#a8a8b0'], 5, 4); } }
    else if (kind === 'gym') { x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 2; for (let i = 0; i <= 512; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); } x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(256, 256, 40, 0, 7); x.fill(); x.fillStyle = 'rgba(226,56,46,.6)'; x.beginPath(); x.arc(256, 256, 40, Math.PI, 0); x.fill(); }
    else if (kind === 'forest') { dots(2500, ['rgba(30,80,30,.5)', 'rgba(90,150,70,.4)']); dots(500, ['#c8742a', '#e8a030', '#8a5a2a', '#d85a3a'], 5, 4); }
    else if (kind === 'mountain' || kind === 'plateau') { dots(2500, ['rgba(80,70,60,.4)', 'rgba(200,190,170,.4)'], 3, 3); x.strokeStyle = 'rgba(60,50,40,.45)'; x.lineWidth = 2; for (let i = 0; i < 18; i++) { let px = rand(0, 512), py = rand(0, 512); x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += rand(-30, 30); py += rand(-30, 30); x.lineTo(px, py); } x.stroke(); } }
    else if (kind === 'hideout') { x.strokeStyle = 'rgba(60,64,74,.7)'; x.lineWidth = 3; for (let i = 0; i <= 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); } x.fillStyle = 'rgba(40,44,54,.7)'; for (let i = 0; i < 512; i += 64) for (let j = 0; j < 512; j += 64) for (const [a, b] of [[6, 6], [58, 6], [6, 58], [58, 58]]) x.fillRect(i + a - 2, j + b - 2, 4, 4); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#f2c230' : '#2a2a30'; x.fillRect(i * 32, 0, 32, 18); x.fillRect(i * 32, 494, 32, 18); } }
    x.strokeStyle = kind === 'hideout' ? 'rgba(226,56,46,.9)' : 'rgba(255,255,255,.85)'; x.lineWidth = 5; x.beginPath(); x.ellipse(256, 256, 120, 76, 0, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(256, 180); x.lineTo(256, 332); x.stroke(); x.beginPath(); x.arc(256, 256, 16, 0, 7); x.stroke();
    return new THREE.CanvasTexture(c);
  }
  W.buildStages = function (scene) {
    const kinds = ['pond', 'city', 'park', 'gym', 'forest', 'river', 'mountain', 'plateau', 'hideout'];
    const baseCol = { pond: 0xe6d4a0, city: 0x7a7e88, park: 0x7ccf58, gym: 0x3f7ab8, forest: 0x3a7a36, river: 0x74c450, mountain: 0x948a7c, plateau: 0xa8846a, hideout: 0x6a6e78 };
    kinds.forEach((kind, i) => {
      const A = ST[kind] = { x: -1200 + i * 200, z: 900, key: kind, tint: TINT[kind] }, ax = A.x, az = A.z;
      const b = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshLambertMaterial({ color: baseCol[kind] })); b.rotation.x = -Math.PI / 2; b.position.set(ax, -0.02, az); scene.add(b);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshLambertMaterial({ map: stageTex(kind) })); f.rotation.x = -Math.PI / 2; f.position.set(ax, 0.01, az); f.receiveShadow = true; scene.add(f);
      const g = grp(scene, ax, 0, az), at = (x, z) => [ax + x, az + z];
      // flat water; alongX makes the ripples flow left-right instead of towards the camera
      const water = (x0, x1, z0, z1, rep, alongX) => {
        const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-Math.PI / 2); const ps = geo.attributes.position, uv = geo.attributes.uv;
        for (let i = 0; i < ps.count; i++) { const u = (ps.getX(i) + (x1 - x0) / 2) / (x1 - x0), v = (ps.getZ(i) + (z1 - z0) / 2) / (z1 - z0); if (alongX) uv.setXY(i, v, u * (rep || 4)); else uv.setXY(i, u, v * (rep || 4)); }
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: W.waterTex(1) })); m.position.set(ax + (x0 + x1) / 2, 0.03, az + (z0 + z1) / 2); scene.add(m); return m; };
      const peaks = (n, z0, snow, col) => { for (let j = 0; j < n; j++) { const x = -70 + j * 140 / (n - 1) + rand(-6, 6), z = z0 - rand(0, 20), h = rand(30, 55), r = rand(18, 30); P(g, 'cone8', col || 0x8a8090, [x, h / 2 - 1, z], [r, h, r]); if (snow) P(g, 'cone8', 0xf4f8ff, [x, h - h * 0.14 - 1, z], [r * 0.3, h * 0.28, r * 0.3]); } };
      if (kind === 'pond') {
        const wm = water(-60, 60, -60, -7, 5); W.anim.push(t => { wm.material.map.offset.y = t * 0.03; });
        for (let j = 0; j < 14; j++) { const [x, z] = at(rand(-16, 16), rand(-7.5, -6)); const r = grp(chunk(x, z), x, 0, z); for (let k = 0; k < 4; k++) { const hh = rand(0.8, 1.6); P(r, 'cyl', 0x5aa84a, [rand(-0.3, 0.3), hh / 2, rand(-0.3, 0.3)], [0.03, hh, 0.03]); } }
        for (let j = 0; j < 8; j++) { const [x, z] = at(rand(-14, 14), rand(-20, -9)); const l = grp(chunk(x, z), x, 0.05, z); P(l, 'cyl', 0x4aa84a, [0, 0, 0], [0.7, 0.03, 0.7]); if (j % 2) P(l, 'sph', 0xf58ab0, [0.15, 0.1, 0], [0.18, 0.12, 0.18]); }
        for (let j = 0; j < 12; j++) { const [x, z] = at(-50 + j * 9 + rand(-2, 2), -36 - rand(0, 6)); tree(x, z, rand(1.1, 1.5), j % 3 ? 'leaf' : 'pine'); }
        for (let j = 0; j < 7; j++) P(g, 'box', j % 2 ? 0xb08050 : 0xa87646, [9 + j * 0.62, 0.3, -9], [0.58, 0.12, 2.4]);
        for (let j = 0; j < 5; j++) { const [x, z] = at(rand(-12, 12), rand(-6, 6)); if (Math.abs(x - ax) > 5) rock(x, z, rand(0.4, 0.8)); }
      } else if (kind === 'city') {
        for (let j = 0; j < 7; j++) { const w = rand(7, 10), h = rand(6, 14), x = -27 + j * 9, z = -16; const col = pick([0xe9f4ff, 0xf6d8c0, 0xd8e8c8, 0xf0d0d8, 0xcfe0f4, 0xf4e8c0]);
          P(g, 'box', col, [x, h / 2, z - 2.5], [w, h, 5]); P(g, 'box', shade(col, 0.8), [x, h + 0.2, z - 2.5], [w + 0.3, 0.4, 5.3]); P(g, 'box', pick([0xe2382e, 0x3a8ad8, 0x2a9a6a, 0xf08030]), [x, 3.1, z + 0.4], [w - 0.4, 0.1, 1.2], [0.3, 0, 0]);
          for (let fl = 0; fl < Math.floor((h - 3) / 2.5); fl++) for (let c2 = 0; c2 < 3; c2++) P(g, 'box', (fl + c2 + j) % 3 ? 0x9adcf8 : 0xffe9a0, [x - w / 3 + c2 * w / 3, 4.6 + fl * 2.5, z + 0.03], [1.2, 1.4, 0.1]);
          P(g, 'box', 0xa8e4ff, [x, 1.4, z + 0.03], [w * 0.6, 1.8, 0.1]); }
        for (const x of [-12, -6, 6, 12]) { const [lx, lz] = at(x, -8); lamp(lx, lz); }
        P(g, 'cyl', 0xe2382e, [-9, 0.4, -6], [0.25, 0.8, 0.25]); P(g, 'sph', 0xe2382e, [-9, 0.85, -6], 0.25);
        for (let j = 0; j < 10; j++) P(g, 'box', pick([0x2a3a6a, 0x5a6a8a, 0x3a4a7a]), [-60 + j * 13, rand(14, 30), -50], [rand(8, 12), rand(28, 60), 8]);
      } else if (kind === 'park') {
        for (let j = 0; j < 10; j++) { const [x, z] = at(-22 + j * 4.8 + rand(-1, 1), -10 - rand(0, 6)); tree(x, z, rand(0.9, 1.3), j % 2 ? 'blossom' : 'leaf'); }
        for (const x of [-7, 7]) { const [bx, bz] = at(x, -7); W.H.bench(bx, bz, 0); }
        P(g, 'cyl', 0xc8c8d2, [-12, 0.3, -6], [1.6, 0.6, 1.6]); P(g, 'cyl', TT.glow(0x6ac8f8), [-12, 0.62, -6], [1.4, 0.04, 1.4]); P(g, 'cyl', 0xc8c8d2, [-12, 1, -6], [0.2, 1.4, 0.2]);
        for (let j = 0; j < 12; j++) P(g, 'box', pick([0x8aa8d8, 0x9ab4e0, 0x7a98c8]), [-66 + j * 12, rand(12, 26), -56], [rand(7, 11), rand(24, 52), 7]);
        for (let j = 0; j < 8; j++) { const [x, z] = at(rand(-14, 14), rand(-5, 6)); if (Math.abs(x - ax) > 6) flowers(x, z, 5, 0.8); }
      } else if (kind === 'gym') {
        water(-40, -9, -30, 20, 3); water(9, 40, -30, 20, 3); const back = water(-9, 9, -30, -9, 3); W.anim.push(t => { back.material.map.offset.y = t * 0.05; });
        for (let j = 0; j < 5; j++) P(g, 'box', j % 2 ? 0xd8dce4 : 0xc8ccd6, [0, 0.6 + j * 1.2, -24 - j * 2], [70, 1.2 + j * 2.4, 2]);
        for (let j = 0; j < 40; j++) P(g, 'sph', pick([0xe2382e, 0x3a8ad8, 0xffd23c, 0x5ab84a, 0xf58ab0]), [rand(-30, 30), 1.6 + Math.floor(rand(0, 5)) * 1.2 + 0.5, -24.5 - Math.floor(rand(0, 5)) * 2], 0.32);
        for (const x of [-16, -6, 6, 16]) { P(g, 'box', x % 12 ? 0x3a8ad8 : 0xf08030, [x, 7.5, -30], [4, 5, 0.2]); P(g, 'cyl', WHITE, [x, 7.5, -29.85], [1.1, 0.1, 1.1], [1.57, 0, 0]); }
        for (const s of [1, -1]) { P(g, 'cyl', 0x8a8e98, [s * 9, 5, -9], [0.2, 10, 0.2]); P(g, 'box', 0x8a8e98, [s * 9, 10, -9], [2, 0.6, 0.8]); }
      } else if (kind === 'forest') {
        for (let j = 0; j < 26; j++) { const a = rand(-0.2, 3.34), r = rand(11, 26); const [x, z] = at(Math.cos(a) * r * 1.4, -Math.sin(a) * r * 0.8 - 4); tree(x, z, rand(1.4, 2.1), j % 3 ? 'leaf' : 'pine'); }
        for (let j = 0; j < 12; j++) { const [x, z] = at(rand(-14, 14), rand(-8, 6)); if (Math.abs(x - ax) < 6 && Math.abs(z - az) < 4) continue; const m = grp(chunk(x, z), x, 0, z); P(m, 'cyl', 0xf4f0e0, [0, 0.14, 0], [0.06, 0.28, 0.06]); P(m, 'sph', pick([0xe2382e, 0xe8a030]), [0, 0.3, 0], [0.2, 0.12, 0.2]); }
        for (const [x, z, r] of [[-8, -7, 0.3], [9, -8, -0.4]]) { P(g, 'cyl', 0x7a5234, [x, 0.35, z], [0.35, 3, 0.35], [0, r, 1.57]); }
        const ff = []; for (let j = 0; j < 14; j++) ff.push(P(scene, 'sphS', TT.glow(0xfff6a0), [ax, 1, az], 0.06));
        W.anim.push(t => ff.forEach((m, j) => m.position.set(ax + Math.sin(t * 0.4 + j * 1.7) * 12, 1.2 + Math.sin(t * 1.3 + j) * 0.8, az - 6 + Math.cos(t * 0.3 + j * 2.1) * 6)));
      } else if (kind === 'river') {
        const rv = water(-80, 80, -18, -9, 14, true); W.anim.push(t => { rv.material.map.offset.y = t * 0.4; });
        for (let j = 0; j < 9; j++) { const [x, z] = at(rand(-18, 18), rand(-17, -10)); P(scene, 'rock', 0x8a8a96, [x, 0.2, z], [rand(0.5, 1), rand(0.4, 0.7), rand(0.5, 0.9)], [rand(0, 3), rand(0, 3), 0]); }
        for (let j = 0; j < 14; j++) { const [x, z] = at(-36 + j * 5.5 + rand(-1, 1), -24 - rand(0, 8)); tree(x, z, rand(1.1, 1.6), j % 3 ? 'leaf' : 'pine'); }
        for (let j = 0; j < 10; j++) { const [x, z] = at(rand(-16, 16), -8 + rand(-0.5, 0.5)); const r = grp(chunk(x, z), x, 0, z); for (let k = 0; k < 3; k++) { const hh = rand(0.7, 1.3); P(r, 'cyl', 0x5aa84a, [rand(-0.3, 0.3), hh / 2, rand(-0.3, 0.3)], [0.03, hh, 0.03]); } }
      } else if (kind === 'mountain') {
        peaks(7, -70, true);
        for (let j = 0; j < 14; j++) { const [x, z] = at(rand(-22, 22), rand(-16, -6)); rock(x, z, rand(0.8, 2.2)); }
        for (let j = 0; j < 12; j++) { const [x, z] = at(j < 6 ? rand(-26, -12) : rand(12, 26), rand(-14, 0)); tree(x, z, rand(1.1, 1.5), 'pine'); }
      } else if (kind === 'plateau') {
        peaks(8, -75, true, 0x9a7a7a);
        for (let a = 0; a < 6.283; a += 0.42) { if (Math.sin(a) > 0.2) continue; const [x, z] = at(Math.cos(a) * 14, Math.sin(a) * 9 - 2); P(scene, 'rock', pick([0x9a8070, 0x8a7062]), [x, 1, z], [rand(1.4, 2.4), rand(1.4, 2.8), rand(1.4, 2.2)], [rand(0, 3), rand(0, 3), 0]); }
        for (const x of [-9, 9]) P(g, 'cyl', 0xb8a890, [x, 1.4, -8], [0.6, 2.8 + rand(-1, 0.5), 0.6]);
        const fl = []; for (let j = 0; j < 8; j++) fl.push(P(scene, 'rock', pick([0x9a8070, 0xa88a72]), [ax, 5, az], [rand(0.6, 1.4), rand(0.4, 0.9), rand(0.6, 1.2)], [rand(0, 3), rand(0, 3), 0]));
        W.anim.push(t => fl.forEach((m, j) => m.position.set(ax - 18 + j * 5.2, 5 + j % 3 * 2 + Math.sin(t * 0.8 + j) * 0.6, az - 14 - (j % 2) * 6)));
      } else if (kind === 'hideout') {
        P(g, 'cyl', 0x9aa0ac, [0, 0, -18], [7, 20, 7], [0, 0, 1.57]); P(g, 'box', 0x3a3e48, [0, 2.6, -11.3], [8, 5.2, 0.2]);
        P(g, 'cyl', WHITE, [0, 5.6, -11.1], [1.6, 0.1, 1.6], [1.57, 0, 0]);
        for (const q of [[-0.38, 0, 0.22, 2, 0], [0.18, 0.7, 0.95, 0.3, 0], [0.56, 0.38, 0.25, 0.7, 0], [0.18, 0, 0.95, 0.3, 0], [0.4, -0.55, 0.25, 1.05, 0.55]]) P(g, 'box', 0xe01818, [q[0], 5.6 + q[1], -11.0], [q[2], q[3], 0.06], [0, 0, q[4]]);
        for (let j = 0; j < 8; j++) { const x = rand(-18, 18), z = rand(-12, -5); if (Math.abs(x) < 6) continue; P(g, 'box', 0xa8763a, [x, 0.6, z], [1.2, 1.2, 1.2], [0, rand(0, 1), 0]); }
        for (let j = 0; j < 4; j++) P(g, 'cyl', 0x3a6ab8, [-14 + j * 1.1, 0.7, -9], [0.5, 1.4, 0.5]);
        for (let j = -6; j <= 6; j++) { P(g, 'box', 0x5a5e68, [j * 4, 1.1, -8.5], [0.15, 2.2, 0.15]); P(g, 'box', 0x8a8e98, [j * 4 + 2, 1.9, -8.5], [4, 0.06, 0.06]); }
        const beams = []; for (const s of [1, -1]) { const b2 = P(scene, 'cone', new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.16, depthWrite: false }), [ax + s * 10, 6, az - 12], [2.5, 14, 2.5]); beams.push([b2, s]); }
        W.anim.push(t => beams.forEach(([b2, s]) => { b2.rotation.z = Math.sin(t * 0.6 * s) * 0.5 + Math.PI; b2.rotation.x = 0.35; }));
      }
      TT.bakeDeep(g);
    });
  };
  // which stage fits where the battle starts
  W.stageAt = (x, z) => {
    if (x > 56 && (z < -60 || x > 64)) {
      if (Math.hypot(x - W.HIDEOUT.x, z - W.HIDEOUT.z) < 24) return 'hideout';
      if (Math.hypot(x - W.PLATEAU.x, z - W.PLATEAU.z) < 24) return 'plateau';
      if (Math.abs(x - W.riverX(z)) < 16 || Math.hypot(x - 120, z + 62) < 16) return 'river';
      if (Math.hypot(x - 190, z + 48) < 26) return 'forest';
      if (Math.hypot(x - 180, z + 130) < 18 || (x > 196 && z < -112)) return 'mountain';
      return 'meadow';
    }
    if (z < -66) return Math.hypot(x + 32, z + 124) < 18 ? 'park' : 'city';
    return Math.hypot(x - W.POND.x, z - W.POND.z) < 15 ? 'pond' : 'meadow';
  };
  // tint the sky, fog and light for a stage; called with null to put everything back
  let saved = null;
  W.applyStage = key => {
    const sc = TT.scene, L = TT.lights; if (!sc || !L) return;
    if (!saved) { saved = { fog: sc.fog.color.getHex(), near: sc.fog.near, far: sc.fog.far, hs: L.hemi.color.getHex(), hg: L.hemi.groundColor.getHex(), hi: L.hemi.intensity, sc: L.sun.color.getHex(), si: L.sun.intensity, mats: [] };
      W.back.traverse(o => { if (o.material && o.material.color) saved.mats.push([o.material, o.material.color.clone()]); }); }
    const tn = key && ST[key] && ST[key].tint;
    for (const [m, c] of saved.mats) { m.color.copy(c); if (tn && tn.sky) m.color.multiply(new THREE.Color(tn.sky)); }
    sc.fog.color.setHex(tn && tn.fog || saved.fog); sc.fog.near = tn && tn.near || saved.near; sc.fog.far = tn && tn.far || saved.far;
    L.hemi.color.setHex(tn && tn.hemi ? tn.hemi[0] : saved.hs); L.hemi.groundColor.setHex(tn && tn.hemi ? tn.hemi[1] : saved.hg); L.hemi.intensity = tn && tn.hemi ? tn.hemi[2] : saved.hi;
    L.sun.color.setHex(tn && tn.sun ? tn.sun[0] : saved.sc); L.sun.intensity = tn && tn.sun ? tn.sun[1] : saved.si;
  };

  // drifting pollen / sparkles around the camera
  W.makeMotes = function (scene) {
    const n = 70, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), seed = [];
    for (let i = 0; i < n; i++) seed.push([rand(-18, 18), rand(0.4, 5), rand(-18, 18), rand(0, 6.28)]);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff8d0, size: 0.13, transparent: true, opacity: 0.75, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
    W.updateMotes = (t, cx, cz, cy) => { for (let i = 0; i < n; i++) { const s = seed[i]; let x = s[0] + Math.sin(t * 0.3 + s[3]) * 1.5 + t * 0.4, z = s[2] + Math.cos(t * 0.23 + s[3]) * 1.5; x = ((x % 36) + 36) % 36 - 18; p[i * 3] = cx + x; p[i * 3 + 1] = (cy || 0) + s[1] + Math.sin(t * 0.8 + s[3]) * 0.4; p[i * 3 + 2] = cz + z; } g.attributes.position.needsUpdate = true; };
    return pts;
  };
})();
