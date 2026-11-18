// Team Rocket's Sky Fortress: a steel airship above the clouds, far to the east. Reached only by air.
// South to north: the landing pad, two guarded laser gates, Jessie and James at the big door, and the Boss's control room.
(function () {
  const TT = window.TT, P = TT.P, rand = TT.rand, pick = TT.pick, W = TT.World;
  const { grp, chunk } = W.H;
  const FT = W.FORT = { cx: 860, cz: -104, x0: 842, x1: 878, z0: -150, z1: -58, spawn: [860, -63], gates: [-81, -97, -115] };
  W.GRUNT1 = { x: 860.8, z: -78 }; W.GRUNT2 = { x: 859.2, z: -94 }; W.RJJ = { x: 860, z: -111.6 }; W.BOSS = { x: 860, z: -139 }; W.SHIP = { x: 871, z: -125 };
  const CAGED = [['eevee', 849, -70], ['squirtle', 871, -70], ['vulpix', 849, -89], ['butterfree', 871, -89], ['oddish', 849, -106], ['psyduck', 871, -106], ['dratini', 848, -127]];
  W.FORT_CAGED = CAGED;
  let limit = -1e9;          // how far north you may walk: the first laser gate that is still switched on

  const ww0 = W.wwCollide;
  W.wwCollide = (x, z, r) => x < 800 ? ww0(x, z, r) : [TT.clamp(x, FT.x0 + 1.2, FT.x1 - 1.2), TT.clamp(z, Math.max(FT.z0 + 1.2, limit), FT.z1 - 1.2)];
  const st0 = W.stageAt; W.stageAt = (x, z) => x > 800 ? 'hideout' : st0(x, z);

  W.NPCS.push(['grunt1', 'gruntm', 'Rocket Grunt', W.GRUNT1.x, W.GRUNT1.z, 0, []], ['grunt2', 'gruntf', 'Rocket Grunt', W.GRUNT2.x, W.GRUNT2.z, 0, []],
    ['rjj', 'jessie', 'Jessie', W.RJJ.x - 1.3, W.RJJ.z, 0, []], ['rjj', 'james', 'James', W.RJJ.x + 1.3, W.RJJ.z, 0, []], ['giovanni', 'giovanni', 'Giovanni', W.BOSS.x, W.BOSS.z, 0, []]);
  W.FORT_PLACES = [
    ['Landing Pad', 860, -64, '🛬', 'Where flying Pokémon set you down.', 860, -64],
    ['The Cages', 849, -89, '🔒', 'Pokémon that Team Rocket took from every land.', 853, -88],
    ['The Big Door', W.RJJ.x, W.RJJ.z, '🚪', 'Jessie, James and Meowth guard the way in.', 860, -108],
    ['Control Room', W.BOSS.x, W.BOSS.z, '🖥', "Team Rocket's Boss waits here.", 860, -132],
    ['Hangar', W.SHIP.x, W.SHIP.z, '🚀', 'A strange round spaceship.', 867, -125]];

  // ---------- the deck picture (also used for the map) ----------
  function deckTex() {
    const c = W.fortCanvas = document.createElement('canvas'); c.width = 512; c.height = 1024; const x = c.getContext('2d'), kx = 512 / 36, kz = 1024 / 92, X = v => (v - FT.x0) * kx, Z = v => (v - FT.z0) * kz;
    x.fillStyle = '#7d8696'; x.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 23; j++) { x.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; x.fillRect(i * 4 * kx, j * 4 * kz, 4 * kx, 4 * kz); }      // steel plates
    x.strokeStyle = 'rgba(40,46,60,.55)'; x.lineWidth = 2; for (let i = 0; i <= 9; i++) { x.beginPath(); x.moveTo(i * 4 * kx, 0); x.lineTo(i * 4 * kx, 1024); x.stroke(); } for (let j = 0; j <= 23; j++) { x.beginPath(); x.moveTo(0, j * 4 * kz); x.lineTo(512, j * 4 * kz); x.stroke(); }
    for (let i = 0; i < 2600; i++) { x.fillStyle = i % 2 ? 'rgba(30,34,44,.25)' : 'rgba(255,255,255,.22)'; x.fillRect(Math.random() * 512, Math.random() * 1024, rand(1, 3), rand(1, 3)); }                    // rivets and scuffs
    // yellow and black warning stripes round the edge
    for (let i = 0; i < 64; i++) { x.fillStyle = i % 2 ? '#f2c230' : '#23262e'; x.fillRect(i * 8, 0, 8, 12); x.fillRect(i * 8, 1012, 8, 12); } for (let j = 0; j < 128; j++) { x.fillStyle = j % 2 ? '#f2c230' : '#23262e'; x.fillRect(0, j * 8, 10, 8); x.fillRect(502, j * 8, 10, 8); }
    // the walkway down the middle, and a red carpet inside the control room
    x.fillStyle = 'rgba(40,46,60,.5)'; x.fillRect(X(857), Z(-115), 6 * kx, 55 * kz); x.fillStyle = '#b01c24'; x.fillRect(X(857.6), Z(-136), 4.8 * kx, 21 * kz); x.fillStyle = '#f2c230'; x.fillRect(X(857.6), Z(-136), 0.3 * kx, 21 * kz); x.fillRect(X(862.1), Z(-136), 0.3 * kx, 21 * kz);
    x.fillStyle = '#4a5062'; x.fillRect(X(842), Z(-150), 36 * kx, 35 * kz - 6); x.globalAlpha = 0.35; for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { x.fillStyle = (i + j) % 2 ? '#5a6074' : '#3e4454'; x.fillRect(X(842 + i * 4), Z(-150 + j * 4), 4 * kx, 4 * kz); } x.globalAlpha = 1;
    x.fillStyle = '#b01c24'; x.fillRect(X(857.6), Z(-136), 4.8 * kx, 21 * kz); x.fillStyle = '#f2c230'; x.fillRect(X(857.6), Z(-136), 0.3 * kx, 21 * kz); x.fillRect(X(862.1), Z(-136), 0.3 * kx, 21 * kz);
    // the landing pad: a yellow ring and a big red R
    x.strokeStyle = '#f2c230'; x.lineWidth = 7; x.beginPath(); x.ellipse(X(860), Z(-64), 4.6 * kx, 4.6 * kz, 0, 0, 7); x.stroke();
    x.fillStyle = '#d21e28'; x.font = '900 ' + Math.round(6.4 * kz) + 'px Fredoka, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('R', X(860), Z(-63.8));
    // the hangar floor
    x.strokeStyle = '#f2c230'; x.lineWidth = 5; x.setLineDash([14, 10]); x.beginPath(); x.ellipse(X(W.SHIP.x), Z(W.SHIP.z), 4.4 * kx, 4.4 * kz, 0, 0, 7); x.stroke(); x.setLineDash([]);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  const solid = (x, z, r) => W.colliders.push({ x, z, r });
  const live = [];          // things that change with the story (laser gates, cage bars, caged Pokémon): shown only while you are on the fortress
  const gateObj = [], cageObj = [];
  // W.fortSet(flags): switch gates off as their guards are beaten, and open the cages once the Boss is beaten
  W.fortSet = f => {
    limit = !f.fg1 ? FT.gates[0] + 1 : !f.fg2 ? FT.gates[1] + 1 : !f.fjj ? FT.gates[2] + 1 : -1e9;
    gateObj.forEach((g, i) => { g.userData.on = ![f.fg1, f.fg2, f.fjj][i]; });
    cageObj.forEach(c => { c.userData.on = !f.boss; });
    if (W.fortMeowth) W.fortMeowth.userData.on = !f.fjj;
  };
  W.fortShow = on => { for (const o of live) o.visible = on && o.userData.on !== false; };
  W.fortTick = t => { for (const g of gateObj) if (g.visible) g.scale.y = 1 + Math.sin(t * 9 + g.position.z) * 0.05; };

  const oldWorld = W.buildWorld;
  W.buildWorld = function* (scene) {
    if (oldWorld) yield* oldWorld(scene);
    yield "Spotting Team Rocket's Sky Fortress";
    const add = o => { o.userData.live = true; scene.add(o); live.push(o); return o; };
    // a sea of clouds far below
    { const cl = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshLambertMaterial({ color: 0xf4f8ff })); cl.rotation.x = -Math.PI / 2; cl.position.set(FT.cx + 40, -11, FT.cz); scene.add(cl);
      for (let i = 0; i < 46; i++) { const a = rand(0, 6.28), r = rand(34, 120), x = FT.cx + Math.cos(a) * r, z = FT.cz + Math.sin(a) * r * 1.2, g = grp(chunk(x, z), x, 0, z), k = rand(4, 9); P(g, 'sph', 0xffffff, [0, -10.5, 0], [k * 1.6, k * 0.6, k]); P(g, 'sph', 0xf4f8ff, [k, -10.6, k * 0.3], [k, k * 0.45, k * 0.8]); } }
    // the deck and the hull under it
    { const dk = new THREE.Mesh(new THREE.PlaneGeometry(36, 92), new THREE.MeshLambertMaterial({ map: deckTex() })); dk.rotation.x = -Math.PI / 2; dk.position.set(FT.cx, 0.016, FT.cz); dk.receiveShadow = true; scene.add(dk);
      const g = grp(chunk(FT.cx, FT.cz), FT.cx, 0, FT.cz);
      P(g, 'box', 0x3a3f4c, [0, -2.6, 0], [36.6, 5.2, 92.6]); P(g, 'box', 0x2c303a, [0, -6.4, 0], [28, 2.6, 80]); P(g, 'box', 0xd21e28, [0, -1.2, 46.4], [36.8, 1.0, 0.2]); for (const s of [1, -1]) P(g, 'box', 0xd21e28, [s * 18.4, -1.2, 0], [0.2, 1.0, 92.8]);
      for (const s of [1, -1]) for (const z of [-30, 0, 30]) { P(g, 'cyl', 0x4a5062, [s * 21.5, -2.4, z], [2.2, 7, 2.2], [1.57, 0, 0]); P(g, 'cyl', 0x23262e, [s * 21.5, -2.4, z + 3.7], [2.5, 0.4, 2.5], [1.57, 0, 0]); P(g, 'box', 0xe8ecf4, [s * 21.5, -2.4, z + 4.1], [4.6, 0.3, 0.12], [0, 0, 0.6]); P(g, 'box', 0xe8ecf4, [s * 21.5, -2.4, z + 4.1], [4.6, 0.3, 0.12], [0, 0, -0.95]); P(g, 'box', 0x3a3f4c, [s * 19.4, -2.4, z], [2.4, 1.2, 3]); }      // engines with propellers
      for (const s of [1, -1]) { P(g, 'box', 0x23262e, [s * 17.8, 0.95, 0], [0.14, 0.12, 92]); for (let z = -45; z <= 45; z += 5) P(g, 'box', 0x23262e, [s * 17.8, 0.5, z], [0.14, 1.0, 0.14]); }            // railings
      P(g, 'box', 0x23262e, [0, 0.95, 45.8], [36, 0.12, 0.14]);
    }
    // the three walls with a laser gate in each
    FT.gates.forEach((gz, i) => {
      const g = grp(chunk(FT.cx, gz), FT.cx, 0, gz), tall = i === 2 ? 5.2 : 3.2, col = i === 2 ? 0x3e4454 : 0x4a5062;
      for (const s of [1, -1]) { P(g, 'box', col, [s * 11.2, tall / 2, 0], [13.6, tall, 1.1]); P(g, 'box', 0xd21e28, [s * 11.2, tall - 0.5, 0.57], [13.6, 0.3, 0.04]); P(g, 'box', 0x23262e, [s * 4.2, tall / 2 + 0.2, 0], [0.7, tall + 0.4, 1.3]); P(g, 'sph', TT.glow(0xff4040), [s * 4.2, tall + 0.55, 0], 0.22); for (let x = 5; x <= 17.5; x += 1.5) solid(FT.cx + s * x, gz, 0.95); }
      if (i === 2) { P(g, 'box', col, [0, tall - 0.5, 0], [8, 1.0, 1.1]); P(g, 'box', 0xd21e28, [0, tall - 0.5, 0.57], [2.2, 0.8, 0.04]); }
      const lz = new THREE.Group(); lz.position.set(FT.cx, 0, gz); for (let j = 0; j < 5; j++) P(lz, 'box', TT.glow(0xff3030), [0, 0.45 + j * 0.55, 0], [7.7, 0.09, 0.09]); TT.bakeDeep(lz); add(lz); gateObj.push(lz);
    });
    // the cages: a base, a roof and a ring of bars that lifts away when the Boss is beaten
    for (const [sp, cx, cz] of CAGED) {
      const g = grp(chunk(cx, cz), cx, 0, cz); P(g, 'cyl', 0x3a3f4c, [0, 0.12, 0], [1.5, 0.24, 1.5]); solid(cx, cz, 1.55);
      const bars = new THREE.Group(); bars.position.set(cx, 0, cz); P(bars, 'cyl', 0x3a3f4c, [0, 2.3, 0], [1.5, 0.16, 1.5]); for (let j = 0; j < 10; j++) { const a = j * 0.628; P(bars, 'cyl', 0xcfd6e4, [Math.cos(a) * 1.36, 1.25, Math.sin(a) * 1.36], [0.05, 2.1, 0.05]); } TT.bakeDeep(bars); add(bars); cageObj.push(bars);
      const mon = TT.creature(sp); mon.position.set(cx, 0.24, cz); mon.rotation.y = cx < FT.cx ? 1.0 : -1.0; add(mon); cageObj.push(mon);
    }
    // Meowth beside Jessie and James, and the Boss's Persian beside his chair
    { const mw = TT.creature('meowth'); mw.position.set(W.RJJ.x, 0, W.RJJ.z + 1.3); add(mw); W.fortMeowth = mw; const pe = TT.creature('persian'); pe.position.set(W.BOSS.x + 2.3, 0.3, W.BOSS.z + 0.6); pe.rotation.y = -0.4; add(pe); }
    // the control room: side walls, a wall of screens, desks, and the Boss's platform and chair
    { const g = grp(chunk(FT.cx, -134), FT.cx, 0, -134);
      for (const s of [1, -1]) { P(g, 'box', 0x3e4454, [s * 17.4, 2.6, 1.6], [1.0, 5.2, 34.5]); P(g, 'box', 0xd21e28, [s * 16.86, 4.6, 1.6], [0.04, 0.3, 34.5]); }
      P(g, 'box', 0x3e4454, [0, 3.2, -15.5], [35.8, 6.4, 1.0]); P(g, 'box', 0x23262e, [0, 3.4, -14.94], [16, 4.4, 0.1]);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) P(g, 'box', TT.glow(pick([0x3ad0ff, 0x4af0a0, 0x3a9cff])), [(i - 1) * 5.1, 2.5 + j * 2.1, -14.86], [4.6, 1.8, 0.06]);
      P(g, 'box', 0xd21e28, [-13, 3.4, -14.94], [3.6, 5, 0.08]); P(g, 'box', 0xd21e28, [13, 3.4, -14.94], [3.6, 5, 0.08]); P(g, 'box', 0x23262e, [-13, 3.6, -14.88], [1.6, 2.4, 0.06]); P(g, 'box', 0x23262e, [13, 3.6, -14.88], [1.6, 2.4, 0.06]);       // banners
      P(g, 'cyl', 0x2c303a, [0, 0.15, -5.2], [5, 0.3, 5]); P(g, 'cyl', 0x3a3f4c, [0, 0.36, -5.2], [3.9, 0.14, 3.9]);
      P(g, 'box', 0x8a1820, [0, 1.25, -7.2], [1.9, 1.7, 0.5]); P(g, 'box', 0x8a1820, [0, 0.75, -6.5], [1.9, 0.5, 1.6]); for (const s of [1, -1]) P(g, 'box', 0x23262e, [s * 1.1, 0.95, -6.5], [0.3, 0.9, 1.7]); P(g, 'box', 0xf2c230, [0, 2.2, -7.2], [1.9, 0.2, 0.52]);        // the big chair
      for (const s of [1, -1]) { P(g, 'box', 0x4a5062, [s * 9, 0.6, -11], [6, 1.2, 1.6]); P(g, 'box', TT.glow(0x3ad0ff), [s * 9, 1.3, -11.2], [5, 0.5, 0.06], [-0.5, 0, 0]); for (let k = -2; k <= 2; k++) solid(FT.cx + s * 9 + k * 1.3, -145, 1.0); }
      solid(FT.cx, -141.2, 1.3);
    }
    // the hangar: a round white spaceship on four legs
    { const g = grp(chunk(W.SHIP.x, W.SHIP.z), W.SHIP.x, 0, W.SHIP.z);
      P(g, 'sph', 0xf2f4f8, [0, 3.1, 0], [3.1, 3.1, 3.1]); P(g, 'cyl', 0xd8dde8, [0, 3.1, 0], [3.25, 0.5, 3.25]); for (let i = 0; i < 6; i++) { const a = i * 1.047; P(g, 'sph', TT.glow(0x8adfff), [Math.cos(a) * 2.6, 4.2, Math.sin(a) * 2.6], [0.42, 0.42, 0.42]); }
      for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785; P(g, 'cyl', 0x8a92a4, [Math.cos(a) * 2.6, 0.7, Math.sin(a) * 2.6], [0.14, 1.9, 0.14], [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]); P(g, 'cyl', 0x4a5062, [Math.cos(a) * 3.05, 0.06, Math.sin(a) * 3.05], [0.5, 0.12, 0.5]); }
      P(g, 'box', 0x4a5062, [-2.4, 1.0, 1.6], [1.5, 0.12, 2.6], [0.5, -0.6, 0]); P(g, 'box', 0xd21e28, [0, 5.3, 2.05], [1.5, 0.6, 0.1], [-0.6, 0, 0]);
      solid(W.SHIP.x, W.SHIP.z, 3.3); }
    // crates by the landing pad and a sign
    for (const [x, z] of [[848, -62], [849.6, -61], [872, -62], [870.6, -60.6], [853, -77.6], [867, -93.6]]) { const g = grp(chunk(x, z), x, 0, z), k = rand(0.9, 1.3); g.rotation.y = rand(0, 1.5); P(g, 'box', pick([0x8a6a42, 0x7a5a36, 0x5a6074]), [0, 0.55 * k, 0], [1.1 * k, 1.1 * k, 1.1 * k]); P(g, 'box', 0xd21e28, [0, 0.55 * k, 0], [1.14 * k, 0.24, 1.14 * k]); solid(x, z, 0.85 * k); }
    { const x = 865.4, z = -61.4, g = grp(chunk(x, z), x, 0, z); P(g, 'cyl', 0x23262e, [0, 0.6, 0], [0.07, 1.2, 0.07]); P(g, 'box', 0x23262e, [0, 1.3, -0.02], [2.9, 0.82, 0.08]); const s = TT.label ? TT.label('SKY FORTRESS', 'rgba(210,30,40,1)') : null; if (s) { s.position.set(x, 1.3, z + 0.12); s.scale.set(2.8, 0.55, 1); add(s); } solid(x, z, 0.3); }
    W.fortShow(false);
  };
})();
