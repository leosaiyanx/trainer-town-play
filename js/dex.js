// dex.js — people and creatures, all built from primitives (no art files), baked + outlined.
(function () {
  const TT = window.TT, P = TT.P;
  const WH = 0xffffff, BK = 0x1c1c22, HIP = 0.85;
  const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();
  const grp = (parent, x, y, z, noOl) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (noOl) g.userData.noOl = 1; parent.add(g); return g; };

  // ============ PEOPLE ============
  function hair(head, o) {
    const h = o.hair, st = o.hairStyle || 'short', bang = (x, y, z, sx, sy, sz, rz) => P(head, 'sph', h, [x, y, z], [sx, sy, sz], [0, 0, rz || 0]);
    const v2 = o.v2 !== 0;       // second-generation heads have a drawn face: hair and hats sit a little higher and further back so they never cover it
    if (st !== 'bald') P(head, 'sph', h, v2 ? [0, 0.05, -0.04] : [0, 0.035, -0.022], v2 ? [0.212, 0.2, 0.205] : [0.213, 0.2, 0.212]);
    if (st === 'liko2') {       // a navy bob that curls in at the chin, a swept fringe with two green clips, and a little bun with a tuft on top
      for (const s of [1, -1]) { P(head, 'sph', h, [s * 0.165, -0.06, -0.02], [0.075, 0.18, 0.135]); P(head, 'sph', h, [s * 0.15, -0.2, 0.03], [0.06, 0.06, 0.085]); P(head, 'sph', h, [s * 0.183, 0.03, 0.06], [0.035, 0.1, 0.07]); }
      P(head, 'sph', h, [0, -0.07, -0.13], [0.2, 0.21, 0.105]);
      P(head, 'sph', h, [-0.075, 0.118, 0.14], [0.115, 0.05, 0.07], [0, 0, 0.28]); P(head, 'sph', h, [0.085, 0.122, 0.135], [0.1, 0.046, 0.07], [0, 0, -0.32]); P(head, 'sph', h, [0, 0.16, 0.1], [0.15, 0.06, 0.1]);
      P(head, 'sph', h, [0, 0.262, -0.07], 0.062); for (const q of [[-0.05, 0.31, -0.1, 0.5], [-0.01, 0.325, -0.11, 0.1], [-0.075, 0.28, -0.085, 1.0]]) P(head, 'cone', h, [q[0], q[1], q[2]], [0.022, 0.09, 0.022], [-0.3, 0, q[3]]);
      for (const q of [[0.075, 0.138], [0.1, 0.118]]) P(head, 'box', 0x6ad24a, [q[0], q[1], 0.196], [0.062, 0.014, 0.014], [0, -0.3, 0.62]);
    } else if (st === 'ash2') {
      const red = 0xd8443c;
      P(head, 'sph', red, [0, 0.128, -0.018], [0.203, 0.118, 0.21]);                                      // cap dome: red all over
      P(head, 'sph', red, [0, 0.245, -0.018], 0.022);                                                     // button on top
      P(head, 'sph', 0xf4f4f8, [0, 0.092, 0.2], [0.168, 0.015, 0.125], [-0.22, 0, 0]);                    // white brim, tipped up a little
      P(head, 'cyl', WH, [0, 0.165, 0.176], [0.06, 0.014, 0.06], [1.05, 0, 0]);                           // a white badge on the front...
      P(head, 'box', 0x2aa85a, [-0.016, 0.172, 0.186], [0.017, 0.062, 0.012], [-0.5, 0, 0]); P(head, 'box', 0x2aa85a, [0.004, 0.146, 0.196], [0.052, 0.017, 0.012], [-0.5, 0, 0]);     // ...with LJ's green "L" 
      // big jagged spikes out to both sides and at the back, and a pointed fringe under the brim
      for (const s of [1, -1]) {
        P(head, 'cone', h, [s * 0.215, 0.015, -0.03], [0.062, 0.25, 0.05], [0.1, 0, -s * 1.85]);
        P(head, 'cone', h, [s * 0.215, -0.06, -0.05], [0.06, 0.27, 0.05], [0, 0, -s * 2.2]);
        P(head, 'cone', h, [s * 0.185, -0.125, -0.09], [0.055, 0.22, 0.05], [-0.2, 0, -s * 2.55]);
        P(head, 'cone', h, [s * 0.14, -0.03, -0.17], [0.065, 0.26, 0.06], [-1.2, 0, -s * 2.0]);
        P(head, 'cone', h, [s * 0.172, 0.01, 0.075], [0.03, 0.12, 0.022], [0.15, 0, -s * 2.75]);            // sideburn in front of each ear
      }
      P(head, 'cone', h, [0, -0.09, -0.215], [0.07, 0.22, 0.06], [-2.3, 0, 0]); P(head, 'cone', h, [0.0, 0.0, -0.225], [0.075, 0.2, 0.06], [-1.75, 0, 0]);
      for (const q of [[-0.1, 0.07, 0.165, 0.032, 0.05, 0.5], [-0.045, 0.072, 0.186, 0.036, 0.062, 0.12], [0.02, 0.074, 0.19, 0.03, 0.045, -0.1], [0.085, 0.072, 0.172, 0.032, 0.05, -0.45]]) P(head, 'cone', h, [q[0], q[1], q[2]], [q[3], q[4], 0.012], [3.0, 0, q[5]]);     // a jagged fringe tucked under the brim, clear of the eyes
    } else if (st === 'ash') {
      const hk = v2 ? 1.4 : 1, hw = v2 ? 1.25 : 1;
      for (const s of [1, -1]) {
        P(head, 'cone', h, [s * 0.2, -0.03, 0.03], [0.05 * hw, 0.16 * hk, 0.05 * hw], [0.3, 0, -s * 2.0]);
        P(head, 'cone', h, [s * 0.21, -0.07, -0.06], [0.05 * hw, 0.17 * hk, 0.05 * hw], [0, 0, -s * 2.25]);
        P(head, 'cone', h, [s * 0.17, -0.1, -0.15], [0.05 * hw, 0.16 * hk, 0.05 * hw], [-0.5, 0, -s * 2.4]);
        P(head, 'cone', h, [s * 0.15, 0.0, 0.14], [0.035, 0.09, 0.03], [0, 0, -s * 2.7]);
        if (v2) { P(head, 'cone', h, [s * 0.215, 0.03, -0.02], [0.05, 0.19, 0.05], [0, 0, -s * 1.75]); P(head, 'cone', h, [s * 0.1, -0.12, -0.2], [0.055, 0.2, 0.055], [-1.4, 0, -s * 2.6]); }
      }
      P(head, 'cone', h, [0, -0.08, -0.22], [0.06 * hw, 0.17 * hk, 0.06 * hw], [-2.2, 0, 0]);
      if (v2) {
        P(head, 'sph', 0xe2382e, [0, 0.155, -0.012], [0.22, 0.128, 0.224]);              // cap dome, sitting above the eyes
        P(head, 'sph', WH, [0, 0.165, 0.1], [0.165, 0.112, 0.128]);                      // white front panel
        P(head, 'sph', 0xe2382e, [0, 0.112, 0.27], [0.168, 0.016, 0.135], [0.16, 0, 0]); // brim, tipped slightly down
      } else {
      P(head, 'sph', 0xe2382e, [0, 0.1, -0.012], [0.222, 0.155, 0.226]);                 // cap dome
      P(head, 'sph', WH, [0, 0.105, 0.105], [0.165, 0.135, 0.125]);                      // white front panel
      P(head, 'sph', 0xe2382e, [0, 0.062, 0.265], [0.165, 0.018, 0.13]);                 // brim
      }
      { const dy = v2 ? 0.055 : 0; P(head, 'box', 0x2aa85a, [0, 0.13 + dy, 0.228], [0.07, 0.022, 0.012]); P(head, 'box', 0x2aa85a, [-0.024, 0.15 + dy, 0.222], [0.022, 0.06, 0.012]); }
    } else if (st === 'liko') {
      bang(0.085, 0.1, 0.15, 0.1, 0.075, 0.07, -0.5); bang(-0.07, 0.105, 0.155, 0.12, 0.07, 0.07, 0.35); bang(0, 0.14, 0.15, 0.08, 0.05, 0.06);
      P(head, 'sph', h, [0, -0.15, -0.115], [0.205, 0.3, 0.115]);
      P(head, 'sph', 0x3fb8a8, [0, -0.2, -0.1], [0.19, 0.27, 0.095]);                    // teal inner layer
      for (const s of [1, -1]) { P(head, TT.capsule(0.04, 0.2), h, [s * 0.185, -0.12, 0.05], null, [0, 0, s * 0.08]); P(head, 'sph', 0x3fb8a8, [s * 0.195, -0.27, 0.05], [0.04, 0.05, 0.04]); }
      P(head, 'cone', h, [0.03, 0.25, 0.0], [0.02, 0.1, 0.02], [0, 0, -0.5]);
      P(head, 'box', 0xd8e84a, [0.15, 0.085, 0.16], [0.07, 0.03, 0.03], [0, 0.6, -0.5]);  // hair clip
    } else if (st === 'spiky') {
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; P(head, 'cone', h, [Math.sin(a) * 0.14, 0.2, Math.cos(a) * 0.12 - 0.03], [0.055, 0.14, 0.055], [Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7]); }
      bang(0, 0.13, 0.16, 0.13, 0.05, 0.06);
    } else if (st === 'long' || st === 'ponytail' || st === 'pigtails') {
      bang(0.07, 0.11, 0.155, 0.11, 0.07, 0.07, -0.4); bang(-0.07, 0.11, 0.155, 0.11, 0.07, 0.07, 0.4);
      if (st === 'long') P(head, 'sph', h, [0, -0.16, -0.11], [0.2, 0.3, 0.115]);
      if (st === 'ponytail') { P(head, 'sph', h, [0, 0.08, -0.25], 0.07); P(head, 'sph', h, [0, -0.08, -0.3], [0.06, 0.2, 0.06]); }
      if (st === 'pigtails') for (const s of [1, -1]) { P(head, 'sph', h, [s * 0.23, -0.02, -0.04], 0.065); P(head, 'sph', h, [s * 0.27, -0.16, -0.04], [0.055, 0.14, 0.055]); }
    } else if (st === 'bun') {
      P(head, 'sph', h, [0, 0.25, -0.07], 0.09); bang(0.06, 0.12, 0.155, 0.12, 0.06, 0.07, -0.3); bang(-0.08, 0.12, 0.15, 0.1, 0.06, 0.07, 0.3);
    } else if (st === 'loops') {
      for (const s of [1, -1]) P(head, TT.G.torus, h, [s * 0.25, -0.08, -0.03], 0.075, [0, 1.57, 0]);
      bang(0.06, 0.12, 0.155, 0.12, 0.06, 0.07, -0.3); bang(-0.07, 0.12, 0.155, 0.11, 0.06, 0.07, 0.3);
    } else if (st === 'jessie') {
      [[0.09, -0.24, 0.14], [0.13, -0.44, 0.13], [0.11, -0.64, 0.12], [0.02, -0.8, 0.105], [-0.1, -0.88, 0.09], [-0.2, -0.84, 0.075], [-0.24, -0.76, 0.05]].forEach(q => P(head, 'sph', h, [0, q[0], q[1]], q[2]));
      bang(0.05, 0.14, 0.16, 0.13, 0.07, 0.08, -0.4); bang(-0.09, 0.12, 0.15, 0.09, 0.06, 0.07, 0.4);
      for (const s of [1, -1]) P(head, 'sph', 0x3ad07a, [s * 0.2, -0.08, 0.01], 0.028);
    } else if (st === 'james') {
      for (const s of [1, -1]) { P(head, 'sph', h, [s * 0.165, -0.04, 0.03], [0.075, 0.17, 0.15]); bang(s * 0.07, 0.11, 0.16, 0.1, 0.075, 0.06, -s * 0.5); }
    } else if (st === 'short') {
      bang(0.05, 0.13, 0.16, 0.13, 0.055, 0.06, -0.2); bang(-0.08, 0.125, 0.155, 0.1, 0.05, 0.06, 0.3);
    } else if (st === 'goku' || st === 'goku_ss') {
      const up = st === 'goku_ss' ? 0.5 : 1;   // Super Saiyan spikes stand up
      const SPK = [[0, 0.27, -0.02, 0.09, 0.38, -0.25 * up, 0], [0.12, 0.25, 0.02, 0.08, 0.34, -0.1 * up, -0.55 * up], [-0.12, 0.25, 0.02, 0.08, 0.34, -0.1 * up, 0.55 * up],
        [0.21, 0.12, -0.02, 0.075, 0.32, 0, -1.25 * up], [-0.21, 0.12, -0.02, 0.075, 0.32, 0, 1.25 * up], [0.18, 0.19, -0.15, 0.075, 0.34, -0.7 * up, -0.8 * up],
        [-0.18, 0.19, -0.15, 0.075, 0.34, -0.7 * up, 0.8 * up], [0, 0.18, -0.22, 0.085, 0.36, -1.2 * up, 0], [0.1, 0.04, -0.22, 0.065, 0.28, -1.6 * up, -0.5], [-0.1, 0.04, -0.22, 0.065, 0.28, -1.6 * up, 0.5]];
      for (const q of SPK) P(head, 'cone', h, [q[0], q[1], q[2]], [q[3], q[4], q[3]], [q[5], 0, q[6]]);
      for (const q of [[0.07, 0.1, 0.17, 0.4], [-0.06, 0.11, 0.17, -0.3], [0.0, 0.13, 0.18, 0.05]]) P(head, 'cone', h, [q[0], q[1], q[2]], [0.035, 0.13, 0.03], [2.5, 0, q[3]]);
    } else if (st === 'vegeta') {      // one tall flame swept straight up, with a sharp peak on the forehead
      for (const q of [[0, 0.36, -0.03, 0.115, 0.56, -0.1, 0], [0.09, 0.31, -0.03, 0.095, 0.46, -0.08, -0.2], [-0.09, 0.31, -0.03, 0.095, 0.46, -0.08, 0.2], [0.165, 0.22, -0.04, 0.08, 0.36, -0.06, -0.42], [-0.165, 0.22, -0.04, 0.08, 0.36, -0.06, 0.42],
        [0, 0.3, -0.13, 0.1, 0.48, -0.42, 0], [0.1, 0.24, -0.14, 0.085, 0.4, -0.48, -0.28], [-0.1, 0.24, -0.14, 0.085, 0.4, -0.48, 0.28]]) P(head, 'cone', h, [q[0], q[1], q[2]], [q[3], q[4], q[3]], [q[5], 0, q[6]]);
      P(head, 'cone', h, [0, 0.125, 0.185], [0.05, 0.11, 0.03], [2.85, 0, 0]);
    } else if (st === 'bald') {
      for (const s of [1, -1]) P(head, 'sph', h, [s * 0.17, 0.0, -0.06], [0.06, 0.1, 0.13]);
      P(head, 'sph', h, [0, -0.02, -0.15], [0.17, 0.1, 0.07]);
    }
    if (o.hat === 'cap') {
      const hc = o.hatColor || 0x2a8a6a;
      if (v2) { P(head, 'sph', hc, [0, 0.128, -0.018], [0.203, 0.118, 0.21]); P(head, 'sph', hc, [0, 0.092, 0.2], [0.168, 0.015, 0.125], [-0.12, 0, 0]); P(head, 'sph', shade(hc, 0.8), [0, 0.245, -0.018], 0.02); }
      else { P(head, 'sph', hc, [0, 0.1, -0.012], [0.222, 0.155, 0.226]); P(head, 'sph', hc, [0, 0.062, 0.265], [0.165, 0.018, 0.13]); }
    } else if (o.hat === 'nurse') {
      P(head, 'box', WH, [0, 0.235, 0.03], [0.2, 0.09, 0.13]);
      P(head, 'box', 0xf0608a, [0, 0.235, 0.1], [0.07, 0.024, 0.012]); P(head, 'box', 0xf0608a, [0, 0.235, 0.1], [0.024, 0.07, 0.012]);
    } else if (o.hat === 'straw') {
      const hy = v2 ? 0.03 : 0; P(head, 'cyl', 0xe9c46a, [0, 0.15 + hy, 0], [0.36, 0.022, 0.36]); P(head, 'sph', 0xe9c46a, [0, 0.17 + hy, 0], [0.2, 0.13, 0.2]); P(head, 'cyl', 0xc0503a, [0, 0.185 + hy, 0], [0.2, 0.04, 0.2]);
    }
  }

  TT.human = function (o) {
    if (o.v2 !== 0) return human2(o);          // every character now uses the second-generation builder
    const g = new THREE.Group(), ud = g.userData, rig = ud.rig = {}, skin = o.skin, lower = o.lower;
    const hips = rig.hips = grp(g, 0, HIP, 0);
    P(hips, 'sph', o.skirt != null ? o.skirt : lower, [0, 0, 0], [0.165, 0.125, 0.118]);
    if (o.skirt != null) P(hips, TT.taper(0.15, 0.27, 0.3), o.skirt, [0, -0.13, 0], [1, 1, 0.8]);
    const bare = o.shorts || o.skirt != null;
    const leg = s => {
      const hip = grp(hips, s * 0.085, -0.03, 0);
      P(hip, TT.capsule(0.072, 0.24), o.skirt != null ? skin : lower, [0, -0.19, 0]);
      const knee = grp(hip, 0, -0.38, 0);
      P(knee, TT.capsule(0.06, 0.24), bare ? skin : lower, [0, -0.17, 0]);
      if (o.sock != null) P(knee, TT.capsule(0.063, 0.1), o.sock, [0, -0.27, 0]);
      P(knee, 'sph', o.shoes || 0x3a3a44, [0, -0.375, 0.045], [0.074, 0.058, 0.135]);
      P(knee, 'box', o.sole != null ? o.sole : 0xf4f4f4, [0, -0.425, 0.045], [0.13, 0.03, 0.25]);
      return { hip, knee };
    };
    rig.legL = leg(1); rig.legR = leg(-1);
    const spine = rig.spine = grp(hips, 0, 0.06, 0);
    P(spine, TT.taper(0.185, 0.15, 0.42), o.top, [0, 0.23, 0], [1, 1, 0.64]);
    P(spine, 'sph', o.top, [0, 0.43, 0], [0.2, 0.09, 0.125]);
    if (o.inner != null) P(spine, 'box', o.inner, [0, 0.29, 0.1], [0.1, 0.34, 0.04]);
    if (o.trim != null) P(spine, TT.taper(0.158, 0.156, 0.05), o.trim, [0, 0.045, 0], [1, 1, 0.67]);
    if (o.coat) P(spine, TT.taper(0.165, 0.23, 0.46), o.top, [0, -0.2, 0], [1, 1, 0.68]);
    if (o.apron) P(spine, 'box', WH, [0, 0.06, 0.105], [0.22, 0.5, 0.03]);
    if (o.badge != null) P(spine, 'box', o.badge, [0, 0.3, 0.118], [0.085, 0.11, 0.02]);
    if (o.hood) P(spine, 'sph', o.top, [0, 0.47, -0.12], [0.16, 0.1, 0.1]);
    if (o.pack != null) P(spine, 'sph', o.pack, [0, 0.27, -0.17], [0.15, 0.19, 0.09]);
    P(spine, 'cyl', skin, [0, 0.52, 0], [0.045, 0.1, 0.045]);
    if (o.collar != null) P(spine, TT.taper(0.07, 0.11, 0.06), o.collar, [0, 0.495, 0]);
    const arm = s => {
      const sc = o.sleeveC != null ? o.sleeveC : o.top, sh = grp(spine, s * 0.215, 0.43, 0);
      P(sh, 'sph', sc, [0, 0, 0], 0.07); P(sh, TT.capsule(0.055, 0.16), sc, [0, -0.14, 0]);
      const el = grp(sh, 0, -0.28, 0);
      P(el, TT.capsule(0.047, 0.16), o.short ? skin : sc, [0, -0.12, 0]);
      if (o.cuff != null) P(el, TT.taper(0.055, 0.055, 0.045), o.cuff, [0, -0.2, 0]);
      P(el, 'sph', o.glove != null ? o.glove : skin, [0, -0.27, 0], [0.052, 0.062, 0.045]);
      return { sh, el, s };
    };
    rig.armL = arm(1); rig.armR = arm(-1);
    const head = rig.head = grp(spine, 0, 0.73, 0);
    P(head, 'sph', skin, [0, 0, 0], [0.2, 0.21, 0.195]); P(head, 'sph', skin, [0, -0.09, 0.02], [0.165, 0.14, 0.165]);
    for (const s of [1, -1]) P(head, 'sph', skin, [s * 0.195, -0.01, 0], [0.03, 0.05, 0.035]);
    const face = grp(head, 0, 0, 0, 1), bc = o.brow != null ? o.brow : o.hair;
    for (const s of [1, -1]) P(face, 'box', bc, [s * 0.078, 0.078, 0.183], [0.06, 0.013, 0.012], [0, s * 0.35, -s * 0.12]);
    P(face, 'sph', shade(skin, 0.86), [0, -0.035, 0.197], 0.013);
    P(face, 'box', 0xb5525a, [0, -0.098, 0.178], [o.kid ? 0.05 : 0.045, 0.013, 0.012]);
    if (o.blush) for (const s of [1, -1]) P(face, 'sph', 0xf5a8a0, [s * 0.118, -0.05, 0.155], [0.03, 0.02, 0.012]);
    if (o.marks) for (const s of [1, -1]) { P(face, 'box', 0x7a4a3a, [s * 0.125, -0.045, 0.152], [0.035, 0.008, 0.01], [0, s * 0.6, 0.5]); P(face, 'box', 0x7a4a3a, [s * 0.125, -0.06, 0.152], [0.035, 0.008, 0.01], [0, s * 0.6, 0.5]); }
    if (o.beard != null) P(head, 'sph', o.beard, [0, -0.15, 0.08], [0.13, 0.1, 0.11]);
    if (o.glasses) for (const s of [1, -1]) P(face, TT.G.torus, 0x333340, [s * 0.078, 0.012, 0.195], 0.04);
    const eyes = rig.eyes = grp(head, 0, 0.012, 0, 1);
    for (const s of [1, -1]) {
      const e = grp(eyes, s * 0.08, 0.004, 0.178); e.rotation.y = s * 0.38; e.scale.set(1.22, 1.26, 1);     // big bright anime eyes
      P(e, 'sph', WH, [0, 0, 0], [0.04, 0.05, 0.012]); P(e, 'sph', o.eye || 0x5a3a22, [0, -0.004, 0.008], [0.028, 0.04, 0.01]);
      P(e, 'sph', BK, [0, -0.004, 0.013], [0.014, 0.022, 0.008]); P(e, 'sph', WH, [0.012, 0.016, 0.017], 0.009);
      P(e, 'box', BK, [0, 0.047, 0.006], [0.085, 0.012, 0.012]);
    }
    hair(head, o);
    if (o.x) o.x({ g, hips, spine, head, face });
    ud.ols = []; TT.bakeRig(g, ud.ols); ud.h = 1.9; ud.human = true;
    if (o.scale) g.scale.setScalar(o.scale);
    return g;
  };

  // walk / idle / gestures. mv 0..1

  // ================= characters, second generation =================
  // Limbs are single smooth tubes that bend at the elbow and knee, hands and shoes are real shapes, and the face is a drawn
  // anime face (a small picture with four expressions) laid over the head. Used when a character has v2: 1.
  // The head is egg-shaped with a pointed chin, like the show's characters: [height, radius] from crown to chin.
  const HEADP = [[0.212, 0.05], [0.186, 0.118], [0.132, 0.166], [0.06, 0.188], [-0.01, 0.19], [-0.07, 0.172], [-0.12, 0.14], [-0.165, 0.094], [-0.198, 0.042]];
  const headR = y => { for (let k = 0; k < HEADP.length - 1; k++) { const a = HEADP[k], b = HEADP[k + 1]; if (y <= a[0] && y >= b[0]) return a[1] + (b[1] - a[1]) * (a[0] - y) / (a[0] - b[0]); } return y > 0 ? HEADP[0][1] : HEADP[HEADP.length - 1][1]; };
  const headZ = y => y < -0.04 ? (-0.04 - y) * 0.16 : 0;                 // the chin sits a little forward
  // the patch of the head that carries the drawn face: it follows the head's own shape exactly
  const FY0 = 0.135, FY1 = -0.195, FSPAN = 1.05;
  const FACE_GEO = (() => {
    const R = 14, C = 12, pos = [], uv = [], idx = [];
    for (let i = 0; i <= R; i++) { const y = FY0 + (FY1 - FY0) * i / R, r = headR(y) * 1.018; for (let k = 0; k <= C; k++) { const f = -FSPAN + 2 * FSPAN * k / C; pos.push(Math.sin(f) * r, y, headZ(y) + Math.cos(f) * r * 0.97); uv.push(k / C, 1 - i / R); } }
    for (let i = 0; i < R; i++) for (let k = 0; k < C; k++) { const a = i * (C + 1) + k, b = a + 1, c = a + C + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  })();
  // drawn faces: four expressions side by side (0 neutral · 1 blink · 2 talking · 3 big grin). 128 px = from the brow to the chin.
  let faceId = 0;
  const css = h => '#' + new THREE.Color(h).getHexString();
  function drawFace(x, o, f) {
    const eye = css(o.eye != null ? o.eye : 0x5a3a22), brow = css(o.brow != null ? o.brow : o.hair), ink = '#1c1820';
    const girl = !!o.lash, EX = 23.5, EY = 47, RX = girl ? 10.5 : 9.6, RY = girl ? 17.5 : 16.5;
    x.fillStyle = css(o.skin); x.fillRect(-2, -2, 132, 132); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const s of [-1, 1]) {
        const ex = 64 + s * EX, ey = EY;
        if (o.dbz && f !== 3) {
          // Dragon Ball style: a sharp-cornered eye with a small black pupil and a heavy top lid. dbz 2 (Vegeta) slants it down toward the nose for a scowl.
          const an = o.dbz === 2, e2 = ey + 3, T = [[-10.5, an ? -1.5 : -6.5], [-5, an ? -5.5 : -9.5], [9.5, an ? -10.5 : -9.5], [12.5, -2], [8.5, 6.5], [-7.5, 6]];
          if (f === 1) { x.strokeStyle = ink; x.lineWidth = 3.4; x.beginPath(); x.moveTo(ex + s * T[0][0], e2 + 2); x.lineTo(ex + s * T[3][0], e2 + 1); x.stroke(); }
          else {
            x.beginPath(); T.forEach((q, n) => n ? x.lineTo(ex + s * q[0], e2 + q[1]) : x.moveTo(ex + s * q[0], e2 + q[1])); x.closePath(); x.fillStyle = '#fff'; x.fill();
            x.save(); x.clip(); x.fillStyle = '#101014'; x.beginPath(); x.ellipse(ex - s * 1.2, e2 - (an ? 0.5 : 1), 4.3, 5.8, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex - s * 2.6, e2 - 3, 1.3, 0, 7); x.fill(); x.restore();
            x.strokeStyle = ink; x.lineWidth = 3.6; x.beginPath(); x.moveTo(ex + s * T[0][0], e2 + T[0][1]); x.lineTo(ex + s * T[1][0], e2 + T[1][1]); x.lineTo(ex + s * T[2][0], e2 + T[2][1]); x.lineTo(ex + s * T[3][0], e2 + T[3][1]); x.stroke();
            x.lineWidth = 1.6; x.beginPath(); x.moveTo(ex + s * T[3][0], e2 + T[3][1]); x.lineTo(ex + s * T[4][0], e2 + T[4][1]); x.lineTo(ex + s * 0, e2 + 6.6); x.stroke();
          }
          // a thick wedge of an eyebrow, low at the nose
          x.fillStyle = ink; x.beginPath(); const b0 = e2 + (an ? -7 : -15), b1 = e2 + (an ? -19 : -19.5);
          x.moveTo(ex - s * 13.5, b0 + 2.5); x.lineTo(ex - s * 12.5, b0 - 4); x.lineTo(ex + s * 14, b1 - 1.5); x.lineTo(ex + s * 14.5, b1 + 1.5); x.closePath(); x.fill();
          if (an) { x.strokeStyle = 'rgba(90,50,40,.5)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(ex - s * 16, e2 + 11); x.lineTo(ex - s * 9, e2 + 13.5); x.stroke(); }
          continue;
        }
        if (f === 1) { x.strokeStyle = ink; x.lineWidth = 3.4; x.beginPath(); x.moveTo(ex - RX, ey + 3); x.quadraticCurveTo(ex, ey + 10, ex + RX, ey + 3); x.stroke(); }
        else if (f === 3) { x.strokeStyle = ink; x.lineWidth = 3.6; x.beginPath(); x.moveTo(ex - RX - 1, ey + 5); x.quadraticCurveTo(ex, ey - 9, ex + RX + 1, ey + 5); x.stroke(); }
        else {
          // a tall anime eye: white, a big iris with a darker top, a large pupil, one bold highlight, a heavy top line
          x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, RX, RY, 0, 0, 7); x.fill();
          x.save(); x.beginPath(); x.ellipse(ex, ey, RX, RY, 0, 0, 7); x.clip();
          const g = x.createLinearGradient(0, ey - RY, 0, ey + RY); g.addColorStop(0, '#2a1410'); g.addColorStop(0.42, eye); g.addColorStop(1, eye);
          x.fillStyle = g; x.beginPath(); x.ellipse(ex, ey + 1.5, RX - 1.6, RY - 1.2, 0, 0, 7); x.fill();
          x.fillStyle = '#140c0c'; x.beginPath(); x.ellipse(ex, ey + 1.5, RX * 0.46, RY * 0.5, 0, 0, 7); x.fill();
          x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.ellipse(ex, ey + RY * 0.62, RX * 0.6, RY * 0.22, 0, 0, 7); x.fill();
          x.restore();
          x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex - 3.4, ey - RY * 0.42, 3.3, 4.1, -0.3, 0, 7); x.fill(); x.beginPath(); x.arc(ex + 3.6, ey + RY * 0.42, 1.5, 0, 7); x.fill();
          x.strokeStyle = ink; x.lineWidth = 3.2; x.beginPath(); x.ellipse(ex, ey, RX + 0.3, RY + 0.3, 0, Math.PI + 0.12, -0.12); x.stroke();
          x.lineWidth = 1.5; x.beginPath(); x.ellipse(ex, ey, RX, RY, 0, -0.12, 0.9); x.stroke(); x.beginPath(); x.ellipse(ex, ey, RX, RY, 0, Math.PI - 0.9, Math.PI + 0.12); x.stroke();
          if (girl) { x.lineWidth = 2.4; x.beginPath(); x.moveTo(ex + s * (RX - 1), ey - RY * 0.55); x.lineTo(ex + s * (RX + 4.5), ey - RY * 0.8); x.stroke(); }
        }
        // eyebrows sit just above the eyes; a grin lifts them
        x.strokeStyle = brow; x.lineWidth = girl ? 2.6 : 4; x.beginPath(); const by = ey - RY - (f === 3 ? 7.5 : 5);
        x.moveTo(ex - s * (RX + 1), by + (girl ? 1.5 : 3.2)); x.quadraticCurveTo(ex + s * 2, by - 2.2, ex + s * (RX + 2.5), by - (girl ? 0 : 1)); x.stroke();
        if (o.blush) { const bg = x.createRadialGradient(ex + s * 5, 74, 1, ex + s * 5, 74, 10); bg.addColorStop(0, 'rgba(240,120,120,.5)'); bg.addColorStop(1, 'rgba(240,120,120,0)'); x.fillStyle = bg; x.fillRect(ex + s * 5 - 11, 63, 22, 22); }
        if (o.marks) { x.strokeStyle = '#5a3020'; x.lineWidth = 1.9; x.beginPath(); const mx = ex + s * 7, my = 71; x.moveTo(mx - 5.5, my - 1.5); x.lineTo(mx - 2, my + 1.5); x.lineTo(mx + 1.5, my - 1.5); x.lineTo(mx + 5, my + 1.5); x.stroke(); }
      }
      x.strokeStyle = 'rgba(110,60,40,.55)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(63, 71); x.lineTo(65.5, 73.5); x.stroke();      // nose
      if (f === 2) { x.fillStyle = '#6a2028'; x.strokeStyle = ink; x.lineWidth = 1.6; x.beginPath(); x.ellipse(64, 93, 6.5, 7.5, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#e8707a'; x.beginPath(); x.ellipse(64, 97, 4.2, 3, 0, 0, 7); x.fill(); }
      else if (f === 3) {          // the big confident grin
        x.beginPath(); x.moveTo(47, 86); x.quadraticCurveTo(64, 90, 81, 86); x.quadraticCurveTo(79, 106, 64, 107); x.quadraticCurveTo(49, 106, 47, 86); x.closePath();
        x.fillStyle = '#6a2028'; x.fill(); x.save(); x.clip(); x.fillStyle = '#fff'; x.fillRect(44, 84, 40, 9.5); x.fillStyle = '#e8707a'; x.beginPath(); x.ellipse(64, 106, 9, 5, 0, 0, 7); x.fill(); x.restore();
        x.strokeStyle = ink; x.lineWidth = 1.8; x.stroke();
      } else if (o.dbz === 2) { x.strokeStyle = '#5a2424'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(54, 93.5); x.lineTo(66, 92.5); x.lineTo(74, 89.5); x.stroke(); }      // a tight smirk
      else { x.strokeStyle = '#6a2a2a'; x.lineWidth = 2.4; x.beginPath(); if (o.grin) { x.moveTo(51, 89); x.quadraticCurveTo(64, 99, 77, 89); } else { x.moveTo(56, 91); x.quadraticCurveTo(64, 96.5, 72, 91); } x.stroke(); }
      if (o.glasses) { x.strokeStyle = '#333340'; x.lineWidth = 2.4; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(64 + s * EX, EY, RX + 4, RY + 3, 0, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(58, EY - 2); x.lineTo(70, EY - 2); x.stroke(); }
  }
  // the four expression cells of one kind of character (made once, shared by every copy of that character)
  const faceCells = o => o._fc || (o._fc = [0, 1, 2, 3].map(f => TT.faceCell('h' + (o._fid || (o._fid = ++faceId)) + '_' + f, x => drawFace(x, o, f))));
  function human2(o) {
    const g = new THREE.Group(), ud = g.userData, rig = ud.rig = {}, skin = o.skin, lower = o.lower, top = o.top, T = (parent, rings, seg, arc) => P(parent, TT.tube(rings, seg, arc), WH);
    ud.v2 = 1;
    const hips = rig.hips = grp(g, 0, HIP, 0), spine = rig.spine = grp(hips, 0, 0.06, 0);
    // ---- torso: one tube from the seat to the neck; the waist blends between hips and chest so it twists naturally ----
    const hipC = o.skirt != null ? o.skirt : lower, belt = o.trim != null && !o.vest ? o.trim : top, st = o.stripe != null ? o.stripe : top, neckC = o.under != null ? o.under : o.collar != null ? o.collar : skin;
    const torso = T(hips, [[-0.14, 0.09, 0.078, hipC, 0], [-0.07, 0.146, 0.108, hipC, 0], [0.0, 0.15, 0.11, hipC, 0.1], [0.022, 0.147, 0.107, hipC, 0.2], [0.026, 0.146, 0.106, belt, 0.22], [0.06, 0.14, 0.1, belt, 0.4], [0.064, 0.139, 0.099, top, 0.42], [0.1, 0.134, 0.095, top, 0.6],
      [0.2, 0.142, 0.099, top, 0.9], [0.27, 0.156, 0.106, top, 1], [0.274, 0.157, 0.107, st, 1], [0.345, 0.166, 0.11, st, 1], [0.349, 0.167, 0.11, top, 1], [0.44, 0.168, 0.108, top, 1], [0.5, 0.142, 0.094, top, 1],
      [0.53, 0.1, 0.078, top, 1], [0.534, 0.096, 0.075, o.collar != null ? o.collar : top, 1], [0.556, 0.066, 0.06, o.collar != null ? o.collar : top, 1], [0.56, 0.062, 0.057, neckC, 1], [0.58, 0.05, 0.05, neckC, 1]], 12);
    torso.userData.bone2 = spine;
    if (o.vest) {            // an open, sleeveless vest worn over the shirt: a shell with a gap down the front and a stand-up collar
      const v = o.vest, gap = 0.52, arc = [Math.PI / 2 + gap, Math.PI * 2.5 - gap];
      const vm = T(hips, [[0.0, 0.164, 0.124, v.c, 0.1], [0.1, 0.152, 0.112, v.c, 0.6], [0.2, 0.158, 0.114, v.c, 0.9], [0.33, 0.181, 0.123, v.c, 1], [0.44, 0.184, 0.121, v.c, 1], [0.505, 0.158, 0.106, v.c, 1], [0.545, 0.108, 0.088, v.c, 1], [0.612, 0.098, 0.086, v.c, 1]], 14, arc);
      vm.userData.bone2 = spine;
      const lin = T(hips, [[0.612, 0.097, 0.085, v.trim, 1], [0.545, 0.106, 0.086, v.trim, 1]], 14, [arc[1], arc[0]]); lin.userData.bone2 = spine;       // the collar's lining, seen from the front
      for (const s of [1, -1]) {
        P(spine, 'box', v.trim, [s * 0.082, 0.21, 0.097], [0.02, 0.5, 0.014], [0.03, 0, -s * 0.05]);                       // trim down each front edge
        P(spine, 'box', shade(v.c, 0.88), [s * 0.128, 0.03, 0.092], [0.078, 0.085, 0.022], [0, s * 0.5, 0]);                  // big pockets
        P(spine, 'box', shade(v.c, 1.12), [s * 0.128, 0.068, 0.097], [0.082, 0.022, 0.024], [0, s * 0.5, 0]);
      }
    }
    if (o.skirt != null) T(hips, [[-0.02, 0.15, 0.11, o.skirt, 0], [-0.16, 0.21, 0.165, o.skirt, 0], [-0.3, 0.26, 0.2, o.skirt, 0]], 12);
    if (o.coat) { const L = o.coat === 1 ? 0.4 : o.coat; T(hips, [[0.03, 0.15, 0.112, top, 0.2], [-L * 0.5, 0.165 + L * 0.06, 0.122 + L * 0.05, top, 0], [-L, 0.17 + L * 0.13, 0.128 + L * 0.08, top, 0]], 12).userData.bone2 = spine; }
    if (o.inner != null) P(spine, 'box', o.inner, [0, 0.29, 0.088], [0.09, 0.34, 0.04]);
    if (o.apron) P(spine, 'box', WH, [0, 0.06, 0.096], [0.2, 0.5, 0.03]);
    if (o.badge != null) P(spine, 'box', o.badge, [0, 0.3, 0.108], [0.085, 0.11, 0.02]);
    if (o.hood) { const hc = o.hoodC != null ? o.hoodC : top; P(spine, 'sph', hc, [0, 0.47, -0.11], [0.15, 0.1, 0.1]); if (o.hoodC != null) for (const s2 of [1, -1]) P(spine, 'sph', hc, [s2 * 0.075, 0.5, 0.045], [0.085, 0.045, 0.06], [0.3, 0, s2 * 0.35]); }
    if (o.pack != null) { P(spine, 'sph', o.pack, [0, 0.25, -0.165], [0.14, 0.19, 0.085]); P(spine, 'sph', shade(o.pack, 0.85), [0, 0.2, -0.235], [0.09, 0.09, 0.035]); for (const s of [1, -1]) { P(spine, 'box', o.pack, [s * 0.118, 0.36, 0.045], [0.036, 0.25, 0.145], [0.1, 0, -s * 0.08]); P(spine, 'box', 0x2a2a30, [s * 0.132, 0.22, 0.104], [0.03, 0.05, 0.02]); } }
    if (o.collar != null && !o.vest) for (const s of [1, -1]) P(spine, 'sph', o.collar, [s * 0.058, 0.482, 0.058], [0.056, 0.024, 0.046], [0.5, s * 0.5, s * 0.55]);
    T(spine, [[0.62, 0.04, 0.04, skin, 0], [0.5, 0.044, 0.044, skin, 0]], 8);      // neck
    // ---- legs: hip -> knee -> ankle in one tube, then a shoe that can roll at the ankle ----
    const bare = o.shorts || o.skirt != null, legC = o.skirt != null ? skin : lower, sockC = o.sock != null ? o.sock : bare ? skin : lower, cut = o.shorts ? (o.shorts === 2 ? -0.36 : -0.2) : 9, wide = o.shorts === 2 ? 1.16 : 1;
    const legRings = [[0.03, 0.07, 0.074], [-0.08, 0.074, 0.078], [-0.2, 0.066, 0.07], [-0.31, 0.057, 0.059], [-0.38, 0.054, 0.056], [-0.45, 0.053, 0.058], [-0.55, 0.051, 0.057], [-0.64, 0.042, 0.046], [-0.74, 0.038, 0.04]];
    const leg = s => {
      const hip = grp(hips, s * 0.078, -0.03, 0), knee = grp(hip, 0, -0.38, 0), foot = grp(knee, 0, -0.355, 0), rings = [];
      for (const q of legRings) {
        const y = q[0], w = y > -0.31 ? 0 : y > -0.36 ? 0.2 : y > -0.4 ? 0.5 : y > -0.5 ? 0.8 : 1, inShort = y > cut, col = y <= -0.6 ? sockC : (o.shorts ? (inShort ? legC : skin) : (bare ? skin : lower)), k = o.shorts && inShort ? wide : 1;
        rings.push([y, q[1] * k, q[2] * k, col, w]);
      }
      if (o.sock != null) { const k = rings.findIndex(q => q[0] <= -0.6); if (k > 0) { const a = rings[k - 1], b = rings[k], t = (a[0] + 0.598) / (a[0] - b[0]), rx = a[1] + (b[1] - a[1]) * t, rz = a[2] + (b[2] - a[2]) * t; rings.splice(k, 0, [-0.596, rx, rz, a[3], 1], [-0.6, rx * 1.04, rz * 1.04, sockC, 1]); } }
      if (o.shorts) { const k = rings.findIndex(q => q[0] <= cut); if (k > 0) { const a = rings[k - 1], t = (a[0] - cut) / (a[0] - rings[k][0]), rx = a[1] / wide + (rings[k][1] - a[1] / wide) * t, rz = a[2] / wide + (rings[k][2] - a[2] / wide) * t, w = a[4] + (rings[k][4] - a[4]) * t; rings.splice(k, 0, [cut + 0.002, rx * wide, rz * wide, legC, w], [cut - 0.002, rx * 0.97, rz * 0.97, skin, w]); } }
      const m = T(hip, rings, 9); m.userData.bone2 = knee;
      const sh = o.shoes || 0x3a3a44;
      P(foot, 'sph', sh, [0, -0.035, 0.028], [0.06, 0.056, 0.094]); P(foot, 'sph', o.toe != null ? o.toe : sh, [0, -0.046, 0.108], [0.058, 0.046, 0.072]); P(foot, 'sph', sh, [0, -0.012, 0.0], [0.05, 0.05, 0.06]);
      if (o.laces != null) for (const a of [0.6, -0.6]) P(foot, 'box', o.laces, [0, -0.002, 0.075], [0.085, 0.012, 0.016], [0.5, a, 0]);
      P(foot, 'box', o.sole != null ? o.sole : 0xf4f4f4, [0, -0.085, 0.052], [0.122, 0.028, 0.256]);
      return { hip, knee, foot };
    };
    rig.legL = leg(1); rig.legR = leg(-1);
    // ---- arms: shoulder -> elbow -> wrist in one tube, then a hand with a thumb ----
    const arm = s => {
      const sc = o.sleeveC != null ? o.sleeveC : top, fore = o.short ? skin : sc, sh = grp(spine, s * 0.186, 0.435, 0), el = grp(sh, 0, -0.27, 0), hand = grp(el, 0, -0.245, 0);
      const cuff = o.cuff != null ? o.cuff : fore;
      const m = T(sh, [[0.028, 0.044, 0.044, sc, 0], [-0.01, 0.062, 0.062, sc, 0], [-0.08, 0.057, 0.057, sc, 0], [-0.128, 0.056, 0.056, sc, 0], [-0.132, 0.045, 0.045, fore, 0], [-0.22, 0.042, 0.042, fore, 0.2], [-0.27, 0.041, 0.043, fore, 0.5],
        [-0.32, 0.041, 0.041, fore, 0.8], [-0.41, 0.038, 0.038, fore, 1], [-0.458, 0.036, 0.036, fore, 1], [-0.462, o.cuff != null ? 0.04 : 0.036, o.cuff != null ? 0.04 : 0.036, cuff, 1], [-0.52, 0.034, 0.034, cuff, 1]], 8);
      m.userData.bone2 = el;
      const hc = o.glove != null ? o.glove : skin;
      P(hand, 'sph', hc, [0, -0.05, 0], [0.035, 0.052, 0.027]); P(hand, 'sph', hc, [0, -0.09, 0.004], [0.032, 0.03, 0.025]); P(hand, 'sph', hc, [-s * 0.027, -0.04, 0.02], [0.014, 0.027, 0.014], [0, 0, s * 0.5]);
      return { sh, el, hand, s };
    };
    rig.armL = arm(1); rig.armR = arm(-1);
    // ---- head: an egg with a pointed chin, ears, then the drawn face on top ----
    const head = rig.head = grp(spine, 0, 0.712, 0); head.scale.setScalar(o.headS || 0.9);
    T(head, HEADP.map(q => [q[0], q[1], q[1] * 0.97, skin, 0, 0, headZ(q[0])]), 14);
    for (const s of [1, -1]) { P(head, 'sph', skin, [s * 0.19, -0.02, -0.005], [0.03, 0.05, 0.034]); P(head, 'sph', shade(skin, 0.84), [s * 0.197, -0.02, 0.002], [0.012, 0.028, 0.018]); }
    if (o.beard != null) P(head, 'sph', o.beard, [0, -0.15, 0.08], [0.12, 0.09, 0.1]);
    // one copy of the face patch per expression, each on its own tiny joint: the one in use is full size, the others are shrunk away
    const fc = faceCells(o); ud.faceF = [];
    for (let f = 0; f < 4; f++) { const fg = grp(head, 0, 0, 0, 1); P(fg, FACE_GEO, WH).userData.cell = fc[f]; if (f) fg.scale.setScalar(0.001); ud.faceF.push(fg); }
    ud.face = { f: 0 };
    rig.eyes = grp(head, 0, 0, 0, 1);            // kept so older code that blinks the eye group still finds something
    const face = grp(head, 0, 0, 0, 1);
    hair(head, o);
    if (o.x) o.x({ g, hips, spine, head, face });
    ud.ols = []; TT.bakeRig(g, ud.ols); ud.h = 1.9; ud.human = true;
    if (o.scale) g.scale.setScalar(o.scale);
    return g;
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  // What a trainer does while standing around. One is picked at random every few seconds and eased in and out, so nobody ever stands like a statue.
  // Each entry is [seconds, pose at progress q (0 → 1) and time t]. lx/rx: arm forward (−) or back (+); lz/rz: arm out to the side; ly/ry: arm twist;
  // le/re: elbow; hy/hx/hz: head turn, nod, tilt; tw: body twist; lean; hop; crouch; kl/kr: hip; nl/nr: knee; ft: foot tap; f: face (2 mouth open, 3 grin).
  const S2 = q => Math.sin(q * 6.2832), UP = q => Math.sin(Math.min(1, q) * Math.PI);
  const IDLES = [
    [3.4, q => ({ hy: S2(q) * 0.85, tw: S2(q) * 0.24, hx: -0.05 })],                                                                                        // 0 look left, then right
    [3.6, q => ({ lx: -2.95, rx: -2.95, lz: 0.32, rz: -0.32, le: -0.3, re: -0.3, lean: -0.2, hx: -0.32, hop: 0.03, f: 2 })],                                 // 1 a big stretch and a yawn
    [4.4, (q, t) => ({ lx: 0.3, rx: 0.3, lz: 0.8, rz: -0.8, ly: -1.25, ry: 1.25, le: -2.0, re: -2.0, lean: -0.07, ft: Math.max(0, Math.sin(t * 7)) * 0.45, hy: 0.3 })],   // 2 arms folded, tapping a foot
    [2.8, (q, t) => ({ rx: -2.75, rz: -0.6, re: -0.55 + Math.sin(t * 9) * 0.45, rh: Math.sin(t * 9) * 0.3, hz: -0.12, f: 3 })],                              // 3 wave hello
    [3.0, (q, t) => ({ rx: -2.55, rz: -0.15, re: -2.25 + Math.sin(t * 11) * 0.12, hz: 0.2, hx: 0.14, hy: -0.2 })],                                           // 4 scratch the head
    [4.2, (q, t) => ({ lx: 0.45, rx: 0.45, lz: 0.75, rz: -0.75, ly: -1.1, ry: 1.1, le: -1.25, re: -1.25, tw: Math.sin(t * 1.5) * 0.18, hy: Math.sin(t * 1.5) * 0.4, lean: -0.06 })],   // 5 hands on hips, looking about
    [3.6, (q, t) => ({ lx: -0.95, le: -1.7, ly: -0.7, lz: 0.05, rx: -0.75, re: -1.75 + Math.sin(t * 8) * 0.12, ry: 0.75, hx: 0.42, hy: 0.12 })],               // 6 check the Pokédex
    [2.2, q => { const h = Math.max(0, Math.sin(q * 12.566)); return { hop: h * 0.17, crouch: Math.max(0, -Math.sin(q * 12.566)) * 0.28, lx: -0.7 - h * 0.6, rx: -0.7 - h * 0.6, le: -1.6, re: -1.6, f: 3 }; }],   // 7 two happy bounces
    [3.8, q => ({ rx: -2.0, rz: -0.3, ry: -0.5, re: -2.15, lean: 0.14, tw: S2(q) * 0.5, hy: S2(q) * 0.3, hx: -0.1 })],                                       // 8 shade the eyes and look far away
    [3.2, q => ({ lx: 0.55, rx: 0.55, lz: -0.12, rz: 0.12, le: -0.75, re: -0.75, kr: -Math.max(0, Math.sin(q * 9.42)) * 0.6, nr: Math.max(0, Math.sin(q * 9.42 - 0.6)) * 0.55, hx: 0.25 })],   // 9 hands behind the back, scuffing a foot
    [2.4, (q, t) => ({ rx: -2.3, rz: -0.2, ry: -0.3, re: -2.2 + Math.sin(t * 6) * 0.08, hx: 0.2, hz: -0.06 })],                                              // 10 straighten the cap or hair
    [1.9, q => ({ lx: -0.3, rx: -0.3, lz: 0.55, rz: -0.55, ly: 1.3, ry: -1.3, le: -1.45, re: -1.45, hz: 0.14, hop: UP(q) * 0.015 })],                        // 11 a shrug
    [2.0, q => { const pc = UP(Math.min(1, q * 1.6)); return { rx: -3.0 * pc - 0.4, re: -1.7 * (1 - pc) - 0.1, rz: -0.2, lx: 0.3, le: -1.4, hop: pc * 0.12, hx: -0.15, f: 3 }; }],   // 12 a fist pump
    [4.2, (q, t) => ({ crouch: 0.8, lean: 0.3, rx: -1.15, re: -0.45, lx: -0.5, le: -1.2, hx: 0.22, hy: Math.sin(t * 1.3) * 0.2, rh: Math.sin(t * 5) * 0.35 })],   // 13 crouch down to pet the partner
    [3.2, q => ({ lx: -0.25, rx: -0.25, lz: 0.6, rz: -0.6, le: -0.35, re: -0.35, tw: S2(q * 2) * 0.55, hy: S2(q * 2) * 0.15 })],                             // 14 warm-up twists
    [3.0, (q, t) => ({ hx: -0.5, lean: -0.08, lx: 0.2, rx: 0.2, hy: Math.sin(t * 0.9) * 0.25 })],                                                            // 15 gaze up at the sky
    // moments shared with the partner: never picked at random, the game asks for them (third entry = 1)
    [600, () => ({ crouch: 0.32, lean: 0.24, rx: -1.05, re: -0.2, rz: -0.12, lx: 0.2, hx: 0.3, f: 3 }), 1],                                                  // 16 hold a hand down for a high five
    [600, (q, t) => ({ sit: 1, lean: -0.04, lx: 0.5, rx: 0.5, lz: 0.22, rz: -0.22, le: -0.12, re: -0.12, hy: Math.sin(t * 0.5) * 0.35, hx: -0.04 }), 1],      // 17 sit on the ground, leaning back on both hands
    [600, () => ({ hz: -0.14, f: 3, lx: -0.1, le: -0.5 }), 1],                                                                                                // 18 smile at the partner on the shoulder
    [600, () => ({ f: 3, lx: 0.3, rx: 0.3, lz: 0.75, rz: -0.75, ly: -1.1, ry: 1.1, le: -1.25, re: -1.25 }), 1],                                               // 19 watch the partner race about
  ];
  // The same idea while walking or running: [seconds, pose, running only?]
  const WALKS = [
    [2.2, q => ({ hy: S2(q) * 0.7 })],                                                                         // glance to each side
    [2.0, () => ({ bob: 1.6, sw: 1.35 })],                                                                    // a skip in the step
    [2.2, (q, t) => ({ rx: -2.7, rz: -0.5, re: -0.5 + Math.sin(t * 9) * 0.4, f: 3 })],                        // wave while walking
    [2.6, () => ({ lx: -2.6, rx: -2.6, lz: 0.45, rz: -0.45, le: -2.3, re: -2.3, hx: -0.1 })],   // hands behind the head
    [2.4, () => ({ lx: 0, rx: 0, lz: 1.35, rz: -1.35, le: -0.05, re: -0.05, f: 3, roll: 1 }), 1],             // arms out like an aeroplane
    [2.2, () => ({ lx: 1.15, rx: 1.15, lz: 0.25, rz: -0.25, le: -0.1, re: -0.1, lean: 0.16 }), 1],            // arms swept back, head down, full speed
    [1.8, () => ({ hx: -0.35 })],                                                                             // look up
  ];
  // run one of the lists above: pick, play, fade
  function act(st, list, ok, t, dt, force, gap) {
    if (force != null && force >= 0 && force < list.length) { if (st.k !== force || t > st.t0 + list[force][0]) { st.k = st.pk = force; st.t0 = t; } st.forced = 1; }
    else if (st.forced) { st.forced = 0; if (st.k >= 0) { st.k = -1; st.next = t + gap[0] + Math.random() * gap[1]; } }
    else if (st.k < 0) { if (ok && t > st.next) { let k, n = 0; do k = Math.floor(Math.random() * list.length); while ((k === st.last || !ok(k)) && n++ < 12); if (ok(k)) { st.k = st.pk = st.last = k; st.t0 = t; } } }
    let on = 0;
    if (st.k >= 0) { const d = list[st.k][0]; st.q = (t - st.t0) / d; on = 1; if (st.q > 1 - 0.38 / d) on = 0; if (st.q >= 1 || (!ok && force == null)) { st.k = -1; st.next = t + gap[0] + Math.random() * gap[1]; on = 0; } }
    st.w += (on - st.w) * Math.min(1, dt * 7);
    return st.w > 0.01 && st.pk >= 0 ? list[st.pk][1](Math.min(1, st.q), t) : null;
  }
  const newAct = t => ({ k: -1, pk: -1, last: -1, q: 0, w: 0, t0: 0, next: t + 0.5 + Math.random() * 3.5 });
  TT.actLists = { IDLES, WALKS };
  function anim2(g, t, mv) {
    const u = g.userData, r = u.rig, p = u.ph || (u.ph = Math.random() * 6.28);
    const dt = TT.clamp(t - (u.lt == null ? t : u.lt), 0, 0.1); u.lt = t;
    u.amp = (u.amp || 0) + ((mv || 0) - (u.amp || 0)) * Math.min(1, dt * 9);
    u.wph = (u.wph || 0) + dt * (7.2 + 4.6 * Math.min(u.amp, 1.4));
    const a = Math.min(u.amp, 1.25), run = TT.clamp((u.amp - 1) / 0.4, 0, 1), i = Math.max(0, 1 - u.amp), ph = u.wph, s = Math.sin(ph), c = Math.cos(ph), ge = u.gesture;
    // how strongly each gesture is "on" eases in and out, so poses melt into each other instead of snapping
    const W = u.gw || (u.gw = { talk: 0, cheer: 0, 'throw': 0, point: 0 }), k = Math.min(1, dt * 10);
    for (const n in W) W[n] = lerp(W[n], ge === n ? 1 : 0, k);
    const P0 = { lx: 0, rx: 0, lz: 0.09, rz: -0.09, le: -0.12, re: -0.12, hop: 0, crouch: 0, lean: 0, twist: 0, headY: 0, headX: 0 };
    // --- walking and running ---
    const swing = (0.5 + 0.42 * run) * a, stride = (0.62 + 0.3 * run) * a;
    const hipL = -s * stride, hipR = s * stride;
    let kneeL = (0.1 + (1.05 + 0.7 * run) * Math.max(0, Math.sin(ph - 1.15))) * a, kneeR = (0.1 + (1.05 + 0.7 * run) * Math.max(0, Math.sin(ph - 1.15 + Math.PI))) * a;
    P0.lx = s * swing; P0.rx = -s * swing;
    P0.le = -(0.22 + 1.0 * run + 0.38 * Math.max(0, -s)) * a - 0.12 * i; P0.re = -(0.22 + 1.0 * run + 0.38 * Math.max(0, s)) * a - 0.12 * i;
    P0.lean = (0.07 + 0.2 * run) * a; P0.twist = s * (0.16 + 0.1 * run) * a;
    let bob = (Math.abs(c) * (0.045 + 0.05 * run) - 0.03) * a;
    // --- standing still: breathing, a slow shift of weight, looking around ---
    const br = Math.sin(t * 1.9 + p);
    P0.lx += Math.sin(t * 1.1 + p) * 0.035 * i; P0.rx += Math.sin(t * 1.1 + p + 1.3) * 0.035 * i; P0.lz += 0.03 * br * i; P0.rz -= 0.03 * br * i;
    P0.headY = (Math.sin(t * 0.43 + p) * 0.3 + Math.sin(t * 0.17 + p * 2) * 0.18) * i; P0.headX = Math.sin(t * 0.7 + p) * 0.05 * i;
    // --- gestures ---
    let lx = P0.lx, rx = P0.rx, lz = P0.lz, rz = P0.rz, le = P0.le, re = P0.re, hop = 0, crouch = 0, hy = P0.headY, hx = P0.headX - 0.08 * a, lhx = 0, rhx = 0;
    if (W.talk > 0.01) { const w = W.talk; rx = lerp(rx, -0.95 + Math.sin(t * 4.2) * 0.22, w); re = lerp(re, -1.35 + Math.sin(t * 4.2 + 1) * 0.3, w); rz = lerp(rz, -0.28, w); lx = lerp(lx, -0.1, w); le = lerp(le, -0.45, w); rhx = Math.sin(t * 6) * 0.3 * w; hy = lerp(hy, Math.sin(t * 1.7) * 0.1, w); hx += Math.sin(t * 3.4) * 0.05 * w; }
    if (W.cheer > 0.01) { const w = W.cheer, q = Math.sin(t * 7.2), up = Math.max(0, q), down = Math.max(0, -q); hop = up * 0.3 * w; crouch = down * 0.5 * w; lx = lerp(lx, -2.75 - up * 0.2 + down * 1.2, w); rx = lerp(rx, -2.75 - up * 0.2 + down * 1.2, w); lz = lerp(lz, 0.45, w); rz = lerp(rz, -0.45, w); le = lerp(le, -0.2 - down * 1.2, w); re = lerp(re, -0.2 - down * 1.2, w); hx -= 0.18 * up * w; hy = lerp(hy, 0, w); }
    if (W['throw'] > 0.01) { const w = W['throw'], q = u.gk || 0, wind = q < 0.4 ? q / 0.4 : 1, rel = q < 0.4 ? 0 : Math.min(1, (q - 0.4) / 0.2); rx = lerp(rx, 1.5 * wind - 3.9 * rel, w); re = lerp(re, -1.5 * wind + 1.3 * rel, w); lx = lerp(lx, -0.7 * wind + 0.9 * rel, w); P0.twist = lerp(P0.twist, -0.5 * wind + 0.9 * rel, w); P0.lean = lerp(P0.lean, -0.08 * wind + 0.25 * rel, w); hy = lerp(hy, 0, w); }
    if (W.point > 0.01) { const w = W.point; rx = lerp(rx, -1.5, w); re = lerp(re, -0.04, w); rz = lerp(rz, -0.05, w); lx = lerp(lx, 0.25, w); le = lerp(le, -1.5, w); lz = lerp(lz, 0.5, w); P0.twist = lerp(P0.twist, 0.22, w); hy = lerp(hy, 0, w); }
    // --- something to do: a random idle action when standing, a random flourish when moving ---
    let ly = 0, ry = 0, hz = 0, kl = 0, kr = 0, nl = 0, nr = 0, ft = 0, fI = 0, roll = 0, sit = 0;
    const gmax = Math.max(W.talk, W.cheer, W['throw'], W.point), calm = gmax < 0.05 && !TT.dialogOpen;
    const I = u.idl || (u.idl = newAct(t)), K = u.wlk || (u.wlk = newAct(t + 2));
    const use = (o, w) => {
      if (o.lx != null) lx = lerp(lx, o.lx, w); if (o.rx != null) rx = lerp(rx, o.rx, w); if (o.lz != null) lz = lerp(lz, o.lz, w); if (o.rz != null) rz = lerp(rz, o.rz, w); if (o.le != null) le = lerp(le, o.le, w); if (o.re != null) re = lerp(re, o.re, w);
      ly += (o.ly || 0) * w; ry += (o.ry || 0) * w; if (o.hy != null) hy = lerp(hy, o.hy, w); hx += (o.hx || 0) * w; hz += (o.hz || 0) * w; P0.twist += (o.tw || 0) * w; P0.lean += (o.lean || 0) * w; hop += (o.hop || 0) * w; crouch += (o.crouch || 0) * w;
      kl += (o.kl || 0) * w; kr += (o.kr || 0) * w; nl += (o.nl || 0) * w; nr += (o.nr || 0) * w; ft += (o.ft || 0) * w; lhx += (o.lh || 0) * w; rhx += (o.rh || 0) * w; if (o.f && w > 0.6) fI = o.f;
      if (o.bob) bob *= 1 + (o.bob - 1) * w; if (o.roll) roll = w; sit += (o.sit || 0) * w;
    };
    { const o = act(I, IDLES, i > 0.95 && calm ? k => !IDLES[k][2] : null, t, dt, u.idleForce, [1.5, 4.5]); if (o) use(o, I.w * i * (1 - gmax)); }
    if (u.lookYaw != null) hy = lerp(hy, TT.clamp(u.lookYaw, -1.15, 1.15), i * (1 - gmax));           // the game can ask a trainer to look at something
    { const o = act(K, WALKS, a > 0.75 && calm ? k => !WALKS[k][2] || run > 0.6 : null, t, dt, u.walkForce, [3, 5]); if (o) use(o, K.w * Math.min(1, a) * (1 - gmax)); }
    // coming to a stop from a run: the knees soak it up
    if (mv > 0.3) u.wasMv = u.amp; else if (u.wasMv) { u.settle = 0.32 * Math.min(1.2, u.wasMv); u.wasMv = 0; }
    if (u.settle > 0.005) { crouch += u.settle; u.settle *= Math.max(0, 1 - dt * 7); }
    // --- write the pose ---
    r.legL.hip.rotation.x = hipL - crouch + kl - sit * 1.45; r.legR.hip.rotation.x = hipR - crouch + kr - sit * 1.45;
    r.legL.knee.rotation.x = kneeL + crouch * 2 + nl + sit * 0.22; r.legR.knee.rotation.x = kneeR + crouch * 2 + nr + sit * 0.12;
    r.legL.foot.rotation.x = -s * 0.32 * a - 0.12 * a * Math.max(0, Math.sin(ph - 1.15)) - crouch; r.legR.foot.rotation.x = s * 0.32 * a - 0.12 * a * Math.max(0, Math.sin(ph - 1.15 + Math.PI)) - crouch - ft;
    const sway = Math.sin(t * 0.33 + p) * i;            // standing: the weight drifts from one leg to the other
    r.legL.hip.rotation.z = (0.035 + sway * 0.05) * i; r.legR.hip.rotation.z = (-0.035 + sway * 0.05) * i;
    r.legL.knee.rotation.x += Math.max(0, -sway) * 0.16; r.legR.knee.rotation.x += Math.max(0, sway) * 0.16; r.legL.hip.rotation.x -= Math.max(0, -sway) * 0.08; r.legR.hip.rotation.x -= Math.max(0, sway) * 0.08;
    r.armL.sh.rotation.set(lx, ly, lz); r.armR.sh.rotation.set(rx, ry, rz); r.armL.el.rotation.x = le; r.armR.el.rotation.x = re;
    r.armL.hand.rotation.x = lhx - 0.1; r.armR.hand.rotation.x = rhx - 0.1;
    r.hips.position.y = HIP + bob + hop - (1 - Math.cos(crouch)) * 0.74 - sit * (HIP - 0.13);
    r.hips.position.x = sway * 0.022;
    r.hips.rotation.y = -s * 0.12 * a; r.hips.rotation.z = -sway * 0.05 + c * 0.03 * a + roll * s * 0.16;
    r.spine.rotation.x = P0.lean + crouch * 0.35; r.spine.rotation.y = P0.twist; r.spine.rotation.z = -c * 0.03 * a + sway * 0.045;
    const bs = 1 + br * 0.012 * (i + 0.3); r.spine.scale.set(bs, 1, 1 + br * 0.03 * (i + 0.3)); r.spine.position.y = 0.06 + br * 0.004 * i;
    r.head.rotation.y = hy - P0.twist * 0.7 + s * 0.1 * a; r.head.rotation.x = hx - crouch * 0.2; r.head.rotation.z = hz;
    // --- face: blink now and then, move the mouth when talking, grin when cheering ---
    let f = ((t + p) % 3.7) < 0.13 ? 1 : 0;
    if (W.cheer > 0.5) f = 3; else if (W.talk > 0.5) f = Math.sin(t * 17) > 0.1 ? 2 : f; else if (fI && !f) f = fI;
    if (u.face.f !== f) { u.faceF[u.face.f].scale.setScalar(0.001); u.faceF[f].scale.setScalar(1); u.face.f = f; }
  }

  TT.animHuman = (g, t, mv) => {
    const u = g.userData, r = u.rig; if (!r) return;
    if (u.v2) return anim2(g, t, mv);
    const p = u.ph || (u.ph = Math.random() * 6.28);
    u.amp = (u.amp || 0) + ((mv || 0) - (u.amp || 0)) * 0.2;
    const dtt = TT.clamp(t - (u.lt == null ? t : u.lt), 0, 0.1); u.lt = t; u.wph = (u.wph || 0) + dtt * (9 + 3.5 * Math.min(u.amp, 1.4));   // stride speeds up when running
    const a = Math.min(u.amp, 1.25), i = Math.max(0, 1 - u.amp), ph = u.wph, s = Math.sin(ph), c = Math.cos(ph), ge = u.gesture;
    r.legL.hip.rotation.x = -s * 0.8 * a; r.legR.hip.rotation.x = s * 0.8 * a;
    r.legL.knee.rotation.x = (0.12 + 1.1 * Math.max(0, c)) * a; r.legR.knee.rotation.x = (0.12 + 1.1 * Math.max(0, -c)) * a;
    let lx = s * 0.7 * a + Math.sin(t * 1.6 + p) * 0.04 * i, rx = -s * 0.7 * a + Math.sin(t * 1.6 + p + 1) * 0.04 * i, lz = 0.1, rz = -0.1;
    let le = -(0.45 + 0.4 * Math.max(0, -s)) * a - 0.1, re = -(0.45 + 0.4 * Math.max(0, s)) * a - 0.1, hop = 0;
    if (ge === 'talk') { rx = -1.0 + Math.sin(t * 5) * 0.2; re = -1.25 + Math.sin(t * 5 + 1) * 0.3; rz = -0.3; }
    else if (ge === 'cheer') { lx = rx = -2.7 + Math.sin(t * 12) * 0.15; lz = 0.4; rz = -0.4; le = re = -0.3; hop = Math.abs(Math.sin(t * 9)) * 0.14; }
    else if (ge === 'throw') { const k = u.gk || 0; rx = k < 0.4 ? 1.3 * (k / 0.4) : 1.3 - 3.7 * Math.min(1, (k - 0.4) / 0.2); re = -0.5; }
    else if (ge === 'point') { rx = -1.45; re = -0.05; }
    r.armL.sh.rotation.set(lx, 0, lz); r.armR.sh.rotation.set(rx, 0, rz); r.armL.el.rotation.x = le; r.armR.el.rotation.x = re;
    r.hips.position.y = HIP + (Math.abs(c) * 0.05 - 0.035) * a + hop;
    r.hips.rotation.y = -s * 0.1 * a; r.hips.rotation.z = Math.sin(t * 0.8 + p) * 0.025 * i;
    r.spine.rotation.x = 0.16 * a; r.spine.rotation.y = s * 0.16 * a; r.spine.position.y = 0.06 + Math.sin(t * 2 + p) * 0.005 * i;
    r.head.rotation.y = -s * 0.1 * a + (ge ? 0 : Math.sin(t * 0.45 + p) * 0.28 * i); r.head.rotation.x = -0.1 * a + Math.sin(t * 0.7 + p) * 0.04 * i;
    r.eyes.scale.y = ((t + p) % 3.9) < 0.12 ? 0.1 : 1;
  };

  const SK = [0xf5cfa6, 0xf8d8bc, 0xc68a5a, 0x8a5a3a, 0xe8c0a0, 0xa87048];
  TT.PEOPLE = {
    // Ash as he looks in the newest series: all-red cap with a white brim, sleeveless blue vest with yellow lining over a white T-shirt
    // with a red stripe, long shorts, bare arms and legs, black-and-blue sneakers, a green backpack.
    ash: { v2: 1, skin: 0xf6c49e, hair: 0x20232c, hairStyle: 'ash2', eye: 0x8a4424, brow: 0x1a1a20, marks: 1, grin: 1, top: WH, stripe: 0xd8504a, sleeveC: WH, short: 1, vest: { c: 0x4a78c8, trim: 0xf0a83a },
      lower: 0x5a5ea8, shorts: 2, shoes: 0x2a2a34, toe: 0x4a7ad0, laces: WH, pack: 0x5ab86a, scale: 0.9 },
    // Liko as she looks in the show: navy bob, light-blue eyes, a teal sleeveless hoodie over black sleeves, white shorts, a yellow sling bag.
    // Llorianne's touch: a gold "L" on the front pocket.
    liko: { v2: 1, skin: 0xfde0d2, hair: 0x1e2648, hairStyle: 'liko2', eye: 0x6ab4e4, brow: 0x1e2648, lash: 1, blush: 1, top: 0x3aa4a4, sleeveC: 0x26262e, collar: 0x9ad2f0, hoodC: 0x9ad2f0, hood: 1, coat: 0.2, lower: 0xf6f6f6, shorts: 1,
      sock: 0x26262e, shoes: 0xf4f4f6, laces: 0x5ac0c0, scale: 0.88,
      x: q => { P(q.spine, 'box', 0x58b8b8, [0, 0.05, 0.1], [0.21, 0.12, 0.02]); P(q.spine, 'box', 0xf2c230, [-0.02, 0.058, 0.113], [0.022, 0.085, 0.012]); P(q.spine, 'box', 0xf2c230, [0.008, 0.024, 0.113], [0.072, 0.022, 0.012]);
        P(q.spine, 'box', 0xf2d040, [0.0, 0.27, 0.103], [0.034, 0.5, 0.016], [0, 0, 0.62]); P(q.spine, 'sph', 0xf2d040, [0.17, 0.06, 0.05], [0.06, 0.07, 0.045]); } },
    dad: { skin: SK[5], hair: BK, hairStyle: 'short', beard: BK, eye: 0x4a3018, top: 0x2a6a4a, collar: WH, trim: 0x22222a, lower: 0x3a4a6a, shoes: 0x5a4030, pack: 0xc8742a },
    gary: { skin: SK[0], hair: 0x8a5a2a, hairStyle: 'spiky', eye: 0x3a5a3a, top: 0x5a3a8a, collar: 0x3a2a5a, lower: 0x3a3a4a, shoes: 0x5a4030, pack: 0xd8c890, scale: 0.9 },
    leaf: { skin: SK[1], hair: 0x7a4a2a, hairStyle: 'long', hat: 'cap', hatColor: 0xf4f4f4, blush: 1, top: 0x6ac0e0, skirt: 0xe2382e, short: 1, sock: WH, shoes: 0xf4f4f4, pack: 0xffd23c, scale: 0.88 },
    misty: { skin: SK[1], hair: 0xf08030, hairStyle: 'ponytail', eye: 0x3a9a8a, top: 0xffd23c, short: 1, lower: 0x4a8ad0, shorts: 1, shoes: 0xe2382e, trim: 0xe2382e, scale: 0.95 },
    gohan: { skin: SK[0], hair: BK, hairStyle: 'spiky', kid: 1, dbz: 1, grin: 1, top: 0x6a3ab0, trim: 0xe2382e, short: 1, cuff: 0xe2382e, lower: 0x6a3ab0, shoes: 0x3a3a44, scale: 0.82 },
    clerk: { skin: SK[2], hair: 0x3a2a1a, hairStyle: 'short', top: 0x3a8ad8, apron: 1, short: 1, lower: 0x3a4a6a, shoes: 0x3a3a44 },
    lady: { skin: SK[1], hair: 0xe8c060, hairStyle: 'bun', blush: 1, eye: 0x4a8ad0, top: 0x2a9a8a, skirt: 0x2a6a6a, sock: WH, shoes: 0x8a4a3a },
    biz: { skin: SK[3], hair: BK, hairStyle: 'short', glasses: 1, top: 0x3a4a6a, inner: WH, collar: WH, lower: 0x3a4a6a, shoes: 0x22222a },
    goku: { skin: SK[0], hair: BK, hairStyle: 'goku', eye: BK, dbz: 1, grin: 1, top: 0xf08a24, collar: 0x2a4ab0, inner: 0x2a4ab0, trim: 0x2a4ab0, sleeveC: 0xf08a24, short: 1, cuff: 0x2a4ab0, lower: 0xf08a24, shoes: 0x2a4ab0, sole: 0xd8c070,
      x: q => { P(q.spine, 'sph', WH, [0.1, 0.32, 0.135], [0.045, 0.045, 0.02]); P(q.spine, 'box', BK, [0.1, 0.32, 0.15], [0.03, 0.04, 0.01]); } },
    goku_ss: { skin: SK[0], hair: 0xffd23c, brow: 0xe8b820, hairStyle: 'goku_ss', eye: 0x2aa898, top: 0xf08a24, collar: 0x2a4ab0, inner: 0x2a4ab0, trim: 0x2a4ab0, sleeveC: 0xf08a24, short: 1, cuff: 0x2a4ab0, lower: 0xf08a24, shoes: 0x2a4ab0, sole: 0xd8c070,
      x: q => { P(q.spine, 'sph', WH, [0.1, 0.32, 0.135], [0.045, 0.045, 0.02]); P(q.spine, 'box', BK, [0.1, 0.32, 0.15], [0.03, 0.04, 0.01]); } },
    ranger: { skin: SK[2], hair: 0x2a1a12, hairStyle: 'ponytail', hat: 'cap', hatColor: 0x3a7a4a, blush: 1, top: 0x4a8a5a, trim: 0x8a6a3a, short: 1, lower: 0x6a5a40, shoes: 0x5a4030, pack: 0xc8742a },
    prof: { skin: SK[4], hair: 0xa8acb4, hairStyle: 'short', brow: 0x8a8e96, top: WH, coat: 1, inner: 0xb04a3a, lower: 0x7a6a50, shoes: 0x5a4030 },
    nurse: { skin: SK[1], hair: 0xf58ab0, hairStyle: 'loops', hat: 'nurse', eye: 0x3a7ad0, blush: 1, top: 0xf7a8c0, skirt: 0xf7a8c0, apron: 1, short: 1, sock: WH, shoes: 0xf0608a },
    jessie: { skin: SK[1], hair: 0xc8327a, hairStyle: 'jessie', eye: 0x3050c0, top: WH, badge: 0xe01818, inner: 0x22222a, skirt: WH, short: 1, glove: 0x22222a, sock: 0x22222a, shoes: 0x22222a, sole: 0x22222a },
    james: { skin: SK[1], hair: 0x6a7ad8, hairStyle: 'james', eye: 0x30a070, top: WH, badge: 0xe01818, inner: 0x22222a, lower: WH, glove: 0x22222a, shoes: 0x22222a, sole: 0x22222a },
    mom: { skin: SK[2], hair: 0x2a1a12, hairStyle: 'bun', blush: 1, top: 0xe86a9a, skirt: 0x5a6ac8, apron: 1, short: 1, shoes: 0x8a4a3a },
    grandpa: { skin: SK[4], hair: 0xe8e8e8, hairStyle: 'bald', hat: 'straw', beard: 0xe8e8e8, brow: 0xe8e8e8, top: 0x6aa85a, trim: 0x7a5a3a, lower: 0x6a5a48, shoes: 0x5a4030 },
    kid: { skin: SK[3], hair: 0x1a1210, hairStyle: 'spiky', kid: 1, top: 0xffb030, short: 1, lower: 0x3a6ac8, shorts: 1, sock: WH, shoes: 0xe8402a, pack: 0x4a9a5a, scale: 0.72 },
    girl: { skin: SK[0], hair: 0xe8a030, hairStyle: 'pigtails', kid: 1, blush: 1, eye: 0x4a8ad0, top: 0x9a6ae0, skirt: 0x9a6ae0, short: 1, sock: WH, shoes: 0xf0608a, scale: 0.75 },
    fisher: { skin: SK[5], hair: 0x5a3a20, hairStyle: 'short', hat: 'cap', hatColor: 0x2a8a6a, beard: 0x5a3a20, top: 0x8a6a3a, inner: 0xd8c890, sleeveC: 0xd8c890, lower: 0x4a5a4a, shoes: 0x3a4a3a },
    guard: { skin: SK[5], hair: BK, hairStyle: 'short', hat: 'cap', hatColor: 0x2a3a8a, top: 0x3a5ac8, badge: 0xffd23c, trim: 0x22222a, lower: 0x2a2a4a, shoes: 0x22222a },
    hiker: { skin: SK[0], hair: 0x7a4a2a, hairStyle: 'spiky', top: 0xc85a3a, short: 1, lower: 0x6a7a4a, shorts: 1, sock: 0xd8c890, shoes: 0x5a4030, pack: 0x3a6ac8 }
  };
  Object.assign(TT.PEOPLE, {
    vegeta: { skin: SK[0], hair: BK, hairStyle: 'vegeta', eye: BK, brow: BK, dbz: 2, top: 0xf2f2ee, sleeveC: 0x2a3a9a, inner: 0x2a3a9a, trim: 0xd8a020, glove: WH, lower: 0x2a3a9a, shoes: WH, sole: 0xd8a020, scale: 0.95,
      x: q => { for (const s of [1, -1]) P(q.spine, 'sph', 0xd8a020, [s * 0.2, 0.36, 0], [0.11, 0.06, 0.13]); P(q.spine, 'box', 0xd8a020, [0, 0.1, 0.094], [0.17, 0.09, 0.016]); } },
    bulma: { skin: SK[1], hair: 0x3ac4cc, hairStyle: 'ponytail', eye: 0x2a7ab0, blush: 1, top: 0xf06a8a, skirt: 0xf06a8a, short: 1, trim: WH, sock: WH, shoes: 0x7a4a9a, pack: 0xf2c230, scale: 0.94 },
    krillin: { skin: SK[0], hairStyle: 'bald', hair: SK[0], eye: BK, dbz: 1, top: 0xf08a24, inner: 0x2a4ab0, trim: 0x2a4ab0, sleeveC: 0xf08a24, short: 1, cuff: 0x2a4ab0, lower: 0xf08a24, shoes: 0x2a4ab0, sole: 0xd8c070, scale: 0.78,
      x: q => { for (const s of [1, -1]) for (let i = 0; i < 3; i++) P(q.head, 'sph', 0x9a6a4a, [s * 0.035, 0.13 + i * 0.035, 0.185 - i * 0.012], 0.011); } }
  });

  // ============ CREATURES ============
  // eye styles: dot | big | tiny | slit
  // Drawn eyes for every Pokémon: an anime eye painted into the shared face picture, wrapped onto the head where the old
  // ball-shaped eyes used to sit. Two versions per species, open and closed, so everyone can blink. (eyeGeo: 1 keeps the old eyes.)
  function drawEye(x, st, cx, cy, rx, ry, col, closed) {
    const ink = '#18141c';
    if (closed) { x.strokeStyle = ink; x.lineWidth = Math.max(2.6, ry * 0.2); x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - rx, cy - ry * 0.05); x.quadraticCurveTo(cx, cy + ry * 0.75, cx + rx, cy - ry * 0.05); x.stroke(); return; }
    if (st === 'dot') {             // a glossy dark eye (Pikachu, Eevee...)
      x.fillStyle = ink; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill();
      x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.clip(); x.fillStyle = 'rgba(150,90,50,.6)'; x.beginPath(); x.ellipse(cx, cy + ry * 0.75, rx * 0.8, ry * 0.5, 0, 0, 7); x.fill(); x.restore();
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx - rx * 0.26, cy - ry * 0.36, rx * 0.42, ry * 0.36, 0, 0, 7); x.fill(); x.beginPath(); x.arc(cx + rx * 0.34, cy + ry * 0.3, rx * 0.16, 0, 7); x.fill();
    } else if (st === 'big') {      // a big bright eye with a coloured iris
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill();
      x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.clip();
      const g = x.createLinearGradient(0, cy - ry, 0, cy + ry); g.addColorStop(0, '#1a1018'); g.addColorStop(0.45, col); g.addColorStop(1, col);
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy + ry * 0.08, rx * 0.82, ry * 0.86, 0, 0, 7); x.fill();
      x.fillStyle = '#140c10'; x.beginPath(); x.ellipse(cx, cy + ry * 0.08, rx * 0.4, ry * 0.46, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.ellipse(cx, cy + ry * 0.62, rx * 0.55, ry * 0.2, 0, 0, 7); x.fill(); x.restore();
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx - rx * 0.3, cy - ry * 0.4, rx * 0.32, ry * 0.26, -0.3, 0, 7); x.fill(); x.beginPath(); x.arc(cx + rx * 0.36, cy + ry * 0.38, rx * 0.14, 0, 7); x.fill();
      x.strokeStyle = ink; x.lineWidth = Math.max(2, rx * 0.2); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI + 0.1, -0.1); x.stroke(); x.lineWidth = 1.2; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); x.stroke();
    } else if (st === 'tiny') {
      const r = Math.min(rx, ry); x.fillStyle = '#fff'; x.strokeStyle = ink; x.lineWidth = 1.6; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.stroke(); x.fillStyle = ink; x.beginPath(); x.arc(cx, cy, r * 0.45, 0, 7); x.fill();
    } else {                        // a fierce eye with a slit pupil
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx, cy, rx, ry * 0.85, 0, 0, 7); x.fill();
      x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx * 0.5, ry * 0.8, 0, 0, 7); x.fill(); x.fillStyle = ink; x.beginPath(); x.ellipse(cx, cy, rx * 0.2, ry * 0.7, 0, 0, 7); x.fill();
      x.strokeStyle = ink; x.lineWidth = Math.max(2.4, rx * 0.22); x.beginPath(); x.ellipse(cx, cy, rx, ry * 0.85, 0, Math.PI, 0); x.stroke(); x.lineWidth = 1.2; x.beginPath(); x.ellipse(cx, cy, rx, ry * 0.85, 0, 0, Math.PI); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - rx * 0.3, cy - ry * 0.3, rx * 0.14, 0, 7); x.fill();
    }
  }
  function mkEyes(head, o, hr) {
    if (o.eyeGeo || /eyegeo=1/.test(location.search)) return mkEyesGeo(head, o, hr);
    const hs = o.hs || [hr, hr * 0.92, hr * 0.95], ex = o.ex || hr * 0.42, ey = o.ey == null ? hr * 0.08 : o.ey, ez = o.ez || hr * 0.84, r = hr * (o.er || 0.18), st = o.eyeS || 'dot';
    const nx = ex / hs[0], ny = ey / hs[1], nz = ez / hs[2], len = Math.hypot(nx, ny, nz), phiE = Math.atan2(nx, nz), thE = Math.acos(TT.clamp(ny / len, -1, 1));
    const rw = r * (st === 'big' ? 1.25 : st === 'dot' ? 1.05 : 1.3), rh = r * (st === 'big' ? 1.5 : st === 'dot' ? 1.38 : 1.25);
    const aw = rw / (hs[0] * Math.max(0.4, Math.sin(thE))), ah = rh / hs[1];
    const phiM = Math.min(1.5, phiE + aw * 1.8), dT = Math.max(0.2, ah * 1.6), t0 = Math.max(0.12, thE - dT), t1 = Math.min(2.7, thE + dT);
    const bg = css(o.eyeBg != null ? o.eyeBg : o.hc != null ? o.hc : o.c), col = css(o.eye != null ? o.eye : 0x1c1c22);
    const X = a => (a + phiM) / (2 * phiM) * 128, px = aw / (2 * phiM) * 128, py = ah / (t1 - t0) * 128, cy = (thE - t0) / (t1 - t0) * 128;
    const key = 'e' + [st, bg, col, ex, ey, ez, r, hs.join('x'), o.mask || '', o.maskC || ''].join('_').replace(/\.|#/g, '');
    const geo = new THREE.SphereGeometry(1, 10, 5, Math.PI / 2 - phiM, phiM * 2, t0, t1 - t0), eg = grp(head, 0, 0, 0, 1), F = [];
    for (let f = 0; f < 2; f++) {
      const fg = grp(eg, 0, 0, 0, 1), m = P(fg, geo, WH, [0, 0, 0], [hs[0] * 1.014, hs[1] * 1.014, hs[2] * 1.014]);
      m.userData.cell = TT.faceCell(key + '_' + f, x => {
        x.fillStyle = bg; x.fillRect(-2, -2, 132, 132);
        if (o.mask) {            // a darker marking around the eyes (Sprigatito's leafy mask, Floragato's pointed one)
          const xl = X(-phiE), xr = X(phiE); x.fillStyle = css(o.maskC); x.beginPath();
          for (const ex2 of [xl, xr]) { x.moveTo(ex2 + px * 1.7, cy); x.ellipse(ex2, cy + py * 0.05, px * 1.7, py * 1.32, 0, 0, 7); }
          x.rect(xl, cy - py * 1.05, xr - xl, py * 1.75);
          const pts = o.mask === 'flora' ? [[-0.55, 1.25], [-0.3, 1.0], [0, 1.58], [0.3, 1.0], [0.55, 1.25]] : [[-0.5, 1.15], [-0.22, 1.0], [0, 1.5], [0.22, 1.0], [0.5, 1.15]];
          x.moveTo(xl - px, cy - py * 0.6); for (const q of pts) x.lineTo(64 + q[0] * (xr - xl), cy - py * q[1]); x.lineTo(xr + px, cy - py * 0.6); x.closePath(); x.fill();
        }
        for (const s of [-1, 1]) drawEye(x, st, X(s * phiE), cy, px, py, col, f === 1);
      });
      if (f) fg.scale.setScalar(0.001); F.push(fg);
    }
    eg.userData.F = F; return eg;
  }
  function mkEyesGeo(head, o, hr) {
    const ex = o.ex || hr * 0.42, ey = o.ey == null ? hr * 0.08 : o.ey, ez = o.ez || hr * 0.84, r = hr * (o.er || 0.18), st = o.eyeS || 'dot', col = o.eye || BK;
    const eg = grp(head, 0, ey, 0, 1);
    for (const s of [1, -1]) {
      const e = grp(eg, s * ex, 0, ez); e.rotation.y = s * (o.eyeTurn == null ? 0.42 : o.eyeTurn);
      if (st === 'dot') { P(e, 'sph', col, [0, 0, 0], [r, r * 1.25, r * 0.42]); P(e, 'sph', WH, [r * 0.28, r * 0.5, r * 0.36], r * 0.36); }
      else if (st === 'big') { P(e, 'sph', WH, [0, 0, 0], [r * 1.2, r * 1.42, r * 0.34]); P(e, 'sph', col, [0, -r * 0.08, r * 0.2], [r * 0.92, r * 1.14, r * 0.3]); P(e, 'sph', BK, [0, -r * 0.1, r * 0.38], [r * 0.48, r * 0.68, r * 0.2]); P(e, 'sph', WH, [r * 0.32, r * 0.48, r * 0.5], r * 0.3); }
      else if (st === 'tiny') { P(e, 'sph', WH, [0, 0, 0], [r * 1.25, r * 1.25, r * 0.34]); P(e, 'sph', BK, [0, 0, r * 0.3], r * 0.3); }
      else { P(e, 'sph', WH, [0, 0, 0], [r * 1.3, r * 1.2, r * 0.34]); P(e, 'sph', BK, [0, 0, r * 0.3], [r * 0.28, r * 0.95, r * 0.2]); }
    }
    return eg;
  }
  // Generic creature. Faces +z. Body parts live in ud.body so the body can bob/squash; legs stay planted on the root.
  function crit(o) {
    const g = new THREE.Group(), c = o.c, b = o.b, by = o.by, hr = o.hr;
    const ud = g.userData = { legs: [], ears: [], arms: [], kind: o.kind || (o.legs === 4 ? 'quad' : o.float ? 'float' : 'biped'), float: o.float || 0 };
    const body = ud.body = grp(g);
    if (!o.noBody) { P(body, 'sph', c, [0, by, 0], b);
      if (o.belly != null) P(body, 'sph', o.belly, [0, by - b[1] * 0.1, b[2] * 0.2], [b[0] * 0.82, b[1] * 0.82, b[2] * 0.86]); }
    const head = ud.head = grp(body, 0, o.hy, o.hz || 0);
    P(head, 'sph', o.hc != null ? o.hc : c, [0, 0, 0], o.hs || [hr, hr * 0.92, hr * 0.95]);
    if (o.cheek) for (const s of [1, -1]) P(head, 'sph', c, [s * hr * 0.42, -hr * 0.3, hr * 0.2], hr * 0.6);
    if (o.snout) P(head, 'sph', o.snoutC != null ? o.snoutC : c, [0, -hr * 0.28, hr * 0.7], [hr * 0.5, hr * 0.34, hr * 0.42]);
    const face = grp(head, 0, 0, 0, 1);
    if (o.eyeS !== 'none') ud.eyes = mkEyes(head, o, hr);
    const ec = o.earC != null ? o.earC : c;
    for (const s of [1, -1]) {
      if (!o.ear) break;
      const e = grp(head, s * hr * (o.earX || 0.58), hr * (o.earY || 0.72), 0); e.userData.s = s; ud.ears.push(e);
      if (o.ear === 'long') { e.userData.rz = -s * (o.earA == null ? 0.55 : o.earA); P(e, 'cone', ec, [0, hr * 0.75, 0], [hr * 0.25, hr * 1.5, hr * 0.17]); if (o.earTip != null) P(e, 'cone', o.earTip, [0, hr * 1.22, 0], [hr * 0.135, hr * 0.58, hr * 0.1]); }
      else if (o.ear === 'cat') { e.userData.rz = -s * 0.3; P(e, 'cone', ec, [0, hr * 0.32, 0], [hr * 0.42, hr * 0.86, hr * 0.24]); if (o.earIn != null) P(e, 'cone', o.earIn, [0, hr * 0.27, hr * 0.1], [hr * 0.26, hr * 0.58, hr * 0.15]); }
      else if (o.ear === 'round') { e.userData.rz = 0; P(e, 'sph', ec, [s * hr * 0.14, hr * 0.05, 0], [hr * 0.42, hr * 0.42, hr * 0.15]); if (o.earIn != null) P(e, 'sph', o.earIn, [s * hr * 0.14, hr * 0.05, hr * 0.06], [hr * 0.28, hr * 0.28, hr * 0.11]); }
      e.rotation.z = e.userData.rz;
    }
    const lc = o.legC != null ? o.legC : c;
    if (o.legs === 4) {
      const lh = Math.max(0.1, by - b[1] * 0.45);
      for (const sx of [1, -1]) for (const sz of [1, -1]) {
        const pv = grp(g, sx * b[0] * 0.56, lh, sz * b[2] * 0.56);
        if (o.legT) { const r = o.legT; P(pv, TT.tube([[0.05, r * 1.25, r * 1.3, c, 0], [-lh * 0.45, r, r, c, 0], [-lh + 0.07, r * 0.86, r * 0.86, lc, 0]], 8), WH); P(pv, 'sph', lc, [0, -lh + 0.05, 0.02], [r * 1.15, 0.052, r * 1.5]); }
        else { P(pv, TT.capsule(0.055, Math.max(0.01, lh - 0.1)), c, [0, -lh / 2 + 0.03, 0]); P(pv, 'sph', lc, [0, -lh + 0.045, 0.015], [0.068, 0.05, 0.085]); }
        ud.legs.push(pv);
      }
    } else if (o.legs === 2) {
      const ly = by * 0.7;
      for (const s of [1, -1]) { const pv = grp(g, s * b[0] * (o.legX || 0.5), ly, 0); if (o.legT) { const r = o.legT; P(pv, TT.tube([[0.06, r * 1.15, r * 1.2, c, 0], [-ly * 0.45, r * 1.05, r * 1.05, c, 0], [-ly + 0.06, r * 0.9, r * 0.95, c, 0]], 8), WH); } else if (o.legLen) P(pv, TT.capsule(0.055, ly - 0.14), o.shinC != null ? o.shinC : c, [0, -ly / 2 + 0.02, 0]); P(pv, 'sph', lc, [0, -ly + 0.05, 0.05], o.foot || [0.085, 0.055, 0.15]); ud.legs.push(pv); }
    }
    if (o.arms) for (const s of [1, -1]) { const pv = grp(body, s * b[0] * 0.86, by + b[1] * 0.3, b[2] * 0.25); pv.userData.s = s; const ac = o.armC != null ? o.armC : c; if (o.armT) { const l = o.armT[0], r = o.armT[1]; P(pv, TT.tube([[0.03, r, r, ac, 0], [-l * 0.55, r * 0.95, r * 0.95, ac, 0], [-l, r * 0.82, r * 0.82, ac, 0]], 7), WH, null, null, [-0.5, 0, s * 0.35]); } else P(pv, 'sph', ac, [s * 0.02, -0.07, 0.03], [0.05, 0.115, 0.05], [-0.5, 0, s * 0.35]); ud.arms.push(pv); }
    const tl = ud.tail = grp(body, 0, by * (o.tailY || 1), -b[2] * 0.88), tc = o.tailC != null ? o.tailC : c;
    if (o.tail === 'bolt') {
      P(tl, 'box', 0x9a6a2a, [0, 0.06, -0.06], [0.045, 0.075, 0.2], [0.95, 0, 0]);
      P(tl, 'box', tc, [0, 0.21, -0.2], [0.045, 0.1, 0.3], [-0.55, 0, 0]);
      P(tl, 'box', tc, [0, 0.36, -0.2], [0.045, 0.12, 0.3], [0.7, 0, 0]);
      P(tl, 'box', tc, [0, 0.58, -0.26], [0.045, 0.3, 0.4], [0.25, 0, 0]);
    } else if (o.tail === 'thin') {
      P(tl, TT.capsule(0.028, 0.34), tc, [0, 0.13, -0.15], null, [-0.9, 0, 0]); P(tl, TT.capsule(0.026, 0.2), tc, [0, 0.36, -0.3], null, [-0.25, 0, 0]);
      if (o.tailTip != null) P(tl, 'sph', o.tailTip, [0, 0.48, -0.32], [0.055, 0.07, 0.055]);
    } else if (o.tail === 'fluff') {
      P(tl, 'sph', tc, [0, 0.13, -0.13], [0.13, 0.19, 0.22], [0.65, 0, 0]);
      if (o.tailTip != null) P(tl, 'sph', o.tailTip, [0, 0.26, -0.27], [0.095, 0.115, 0.125]);
    } else if (o.tail === 'flame') {
      P(tl, TT.capsule(0.045, 0.34), tc, [0, 0.1, -0.17], null, [-1.05, 0, 0]);
      const f = grp(tl, 0, 0.26, -0.36); ud.flame = f; P(f, 'cone', TT.glow(0xff7a1a), [0, 0.13, 0], [0.1, 0.3, 0.1]); P(f, 'cone', TT.glow(0xffe060), [0, 0.09, 0], [0.055, 0.18, 0.055]);
    } else if (o.tail === 'curl') {
      P(tl, 'sph', tc, [0, 0.03, -0.08], 0.085); P(tl, 'sph', tc, [0, 0.13, -0.15], 0.07); P(tl, 'sph', tc, [0, 0.22, -0.1], 0.05);
    }
    if (o.x) o.x(g, head, body, face, ud);
    ud.ols = []; TT.bakeRig(g, ud.ols);
    if (o.scale) g.scale.setScalar(o.scale);
    ud.h = (o.hy + hr + 0.28) * (o.scale || 1) + (o.float || 0);
    return g;
  }

  const B = {};
  const TB = (parent, rings, seg, pos, rot) => P(parent, TT.tube(rings, seg), WH, pos, null, rot);       // a smooth one-piece shape
  const RG = (c, rows, k) => rows.map(r => [r[0] * (k || 1), r[1] * (k || 1), (r[2] == null ? r[1] : r[2]) * (k || 1), c, 0, r[3] || 0, r[4] || 0]);      // rings of one colour: [height, half-width, half-depth, x offset, z offset]
  // a patch of another colour that follows a one-piece body: the same rings a touch larger, covering only an arc of them (the front is PI / 2)
  const SHELL = (parent, rings, c, w, mid, grow, seg, pos, rot) => P(parent, TT.tube(rings.map(r => [r[0], r[1] * grow, r[2] * grow, c, 0, r[5] || 0, r[6] || 0]), seg, [mid - w, mid + w]), WH, pos, null, rot);
  const CREAM = 0xffe9a0;
  const turnTip = (ry, rx) => { const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0, 'YXZ')), 'XYZ'); return [e.x, e.y, e.z]; };      // turn round the upright axis, then tip forward: for leaves set round a centre
  // a curved band over part of a one-piece body (stripes, belts)
  const BAND = (parent, y0, y1, r, c, w, mid, pos, rot) => P(parent, TT.tube([[y0, r[0], r[1], c, 0], [y1, r[0], r[1], c, 0]], 8, [mid - w, mid + w]), WH, pos, null, rot);
  // the usual four-legged body lying along the back-to-front axis, with an optional pale underside
  const QB = (body, c, y, k, belly) => { const R = RG(c, [[-0.29, 0.05, 0.055], [-0.22, 0.13, 0.135], [-0.08, 0.155, 0.162], [0.08, 0.16, 0.168], [0.2, 0.135, 0.14], [0.27, 0.085, 0.09]], k); TB(body, R, 10, [0, y, 0], [Math.PI / 2, 0, 0]); if (belly != null) SHELL(body, R, belly, 1.0, Math.PI / 2, 1.03, 8, [0, y, 0], [Math.PI / 2, 0, 0]); return R; };
  // a leaf-shaped ear that twitches, with an optional inner colour
  const tEar = (h, ud, s, x, y, rz, L, w, c, inC) => { const e = grp(h, s * x, y, -0.01); e.userData.s = s; e.userData.rz = -s * rz; e.rotation.z = e.userData.rz; ud.ears.push(e); TB(e, RG(c, [[0, w * 0.6, 0.035], [L * 0.3, w, 0.04], [L * 0.62, w * 0.8, 0.035], [L * 0.88, w * 0.4, 0.02], [L, 0.008, 0.008]]), 8); if (inC != null) P(e, 'cone', inC, [0, L * 0.47, 0.03], [w * 0.58, L * 0.78, 0.014]); return e; };
  // a ruff of fur round the neck of a four-legged Pokémon
  const ruff = (body, c, n, sz) => { P(body, 'sph', c, [0, 0.37, 0.2], [0.185 * sz, 0.15 * sz, 0.13 * sz]); for (let i = 0; i < n; i++) { const a = -1.6 + i * 3.2 / (n - 1); P(body, 'cone', c, [Math.sin(a) * 0.16, 0.39 - Math.abs(Math.sin(a)) * 0.03, 0.2 + Math.cos(a) * 0.1], [0.11 * sz, 0.2 * sz, 0.075 * sz], [1.9 + Math.cos(a) * 0.55, 0, -Math.sin(a) * 1.25]); } };
  // a tail that curls round on itself (Squirtle), or a big fluffy swirl (Wartortle)
  const curlTail = (tl, c, n, r0, s0, c2) => { P(tl, 'sph', c, [0, 0.03, -0.02], s0 * 0.9); for (let i = 0; i < n; i++) { const a = i * 0.8, R = r0 * (1 - i / (n + 2)); P(tl, 'sph', c2 != null && i % 2 ? c2 : c, [0, r0 + 0.02 - Math.cos(a) * R, -r0 - 0.03 - Math.sin(a) * R], s0 * (1 - i * 0.085)); } };
  // Pikachu: a chubby pear-shaped body in one piece, big cheeks, long black-tipped ears, the lightning-bolt tail.
  B.pikachu = () => crit({ c: 0xffdc32, noBody: 1, b: [0.23, 0.26, 0.2], by: 0.36, hy: 0.75, hz: 0.03, hr: 0.25, hs: [0.262, 0.228, 0.238], cheek: 1, legs: 2, legX: 0.6, foot: [0.085, 0.05, 0.16], arms: 1, earX: 0.5, earY: 0.6, tail: 'bolt', er: 0.155, ex: 0.108, ey: 0.03, ez: 0.218, eyeTurn: 0.3, tailY: 0.8,
    x: (g, h, body, f, ud) => {
      const Y = 0xffdc32;
      TB(body, [[0.04, 0.12, 0.11, Y], [0.1, 0.205, 0.185, Y], [0.2, 0.25, 0.225, Y], [0.32, 0.252, 0.222, Y], [0.44, 0.215, 0.19, Y], [0.54, 0.17, 0.155, Y], [0.62, 0.13, 0.125, Y]], 12);
      for (const s of [1, -1]) {
        P(f, 'sph', 0xe8382a, [s * 0.19, -0.078, 0.168], [0.062, 0.062, 0.03], [0, s * 0.8, 0]);                     // red cheeks
        const e = grp(h, s * 0.125, 0.15, 0); e.userData.s = s; e.userData.rz = -s * 0.5; e.rotation.z = e.userData.rz; ud.ears.push(e);
        TB(e, [[0.0, 0.05, 0.035, Y], [0.12, 0.066, 0.04, Y], [0.3, 0.06, 0.036, Y], [0.375, 0.05, 0.03, Y], [0.38, 0.05, 0.03, BK], [0.47, 0.03, 0.02, BK], [0.53, 0.008, 0.008, BK]], 8);
        P(f, 'box', 0x7a3a2a, [s * 0.024, -0.07, 0.24], [0.048, 0.011, 0.01], [0, 0, s * 0.45]);                       // the little "w" mouth
      }
      P(f, 'sph', BK, [0, -0.014, 0.247], [0.018, 0.012, 0.01]);
      P(body, 'box', 0x9a6a2a, [0, 0.47, -0.168], [0.21, 0.04, 0.05], [0.25, 0, 0]); P(body, 'box', 0x9a6a2a, [0, 0.34, -0.2], [0.25, 0.04, 0.05], [0.1, 0, 0]);     // back stripes
    } });
  const sprigFace = (h, f, hr) => {
    P(f, 'sph', 0xf2a0b8, [0, -hr * 0.16, hr * 0.97], [0.026, 0.018, 0.014]);
    P(f, 'sph', 0x8a3a4a, [0, -hr * 0.36, hr * 0.9], [0.04, 0.028, 0.02]); for (const s of [1, -1]) P(f, 'cone', WH, [s * 0.022, -hr * 0.31, hr * 0.94], [0.008, 0.022, 0.008], [Math.PI, 0, 0]);       // open mouth with two tiny fangs
  };
  // Sprigatito: pale mint cat with a dark green leafy mask and collar, fluffy cheeks, big ears and a soft tail.
  B.sprigatito = () => { const PALE = 0xcdeab2, DARK = 0x58a44c; return crit({ c: PALE, noBody: 1, mask: 'sprig', maskC: DARK, b: [0.17, 0.17, 0.27], by: 0.3, hy: 0.57, hz: 0.25, hr: 0.25, hs: [0.275, 0.232, 0.24], legs: 4, legT: 0.05, legC: PALE,
    ear: 'cat', earC: DARK, earIn: 0xdff0c8, earX: 0.66, earY: 0.5, eyeS: 'big', eye: 0xd0507e, er: 0.215, ex: 0.105, ey: 0.02, ez: 0.222, eyeTurn: 0.3, tail: 'fluff', tailTip: 0x9cba8c, tailY: 1.05,
    x: (g, h, body, f) => {
      sprigFace(h, f, 0.25);
      TB(body, [[-0.29, 0.05, 0.055, PALE], [-0.22, 0.125, 0.13, PALE], [-0.08, 0.15, 0.158, PALE], [0.08, 0.158, 0.165, PALE], [0.2, 0.135, 0.14, PALE], [0.27, 0.085, 0.09, PALE]], 10, [0, 0.31, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 6; i++) { const a = -1.15 + i * 0.46; P(body, 'cone', DARK, [Math.sin(a) * 0.13, 0.4 - Math.abs(Math.sin(a)) * 0.02, 0.2 + Math.cos(a) * 0.1], [0.06, 0.17, 0.028], [1.9 + Math.cos(a) * 0.5, 0, -Math.sin(a) * 1.2]); }       // leafy collar
      for (const s of [1, -1]) for (const q of [[0.25, -0.03, 0.03, 1.75, 0.17], [0.235, -0.1, 0.01, 2.15, 0.15], [0.19, -0.155, 0.0, 2.6, 0.12]]) P(h, 'cone', PALE, [s * q[0], q[1], q[2]], [0.055, q[4], 0.045], [0, 0, -s * q[3]]);          // fluffy cheeks
    } }); };
  // Floragato: the same cat grown up and on two legs. Dark green gloves, boots, chest fur and a pointed mask; a pink flower bud on a vine.
  B.floragato = () => { const PALE = 0xcdeab2, DARK = 0x3f8a3c; return crit({ c: PALE, noBody: 1, mask: 'flora', maskC: DARK, b: [0.16, 0.27, 0.14], by: 0.66, hy: 1.12, hz: 0.03, hr: 0.22, hs: [0.228, 0.2, 0.208], legs: 2, legLen: 1, legX: 0.5, shinC: DARK, legC: DARK, foot: [0.075, 0.05, 0.135],
    arms: 1, armC: DARK, ear: 'cat', earC: DARK, earIn: 0xdff0c8, earX: 0.64, earY: 0.5, eyeS: 'big', eye: 0xd0405e, er: 0.19, ex: 0.09, ey: 0.03, ez: 0.196, eyeTurn: 0.3, tail: 'thin', tailC: PALE, tailTip: DARK, tailY: 0.72,
    x: (g, h, body, f, ud) => {
      sprigFace(h, f, 0.22);
      TB(body, [[0.36, 0.085, 0.08, PALE], [0.46, 0.15, 0.125, PALE], [0.6, 0.158, 0.13, PALE], [0.76, 0.138, 0.118, PALE], [0.9, 0.105, 0.095, PALE], [1.0, 0.075, 0.07, PALE]], 10);
      for (const s of [1, -1]) {
        const pv = ud.arms.find(q => q.userData.s === s); pv.remove(pv.children[0]); pv.position.set(s * 0.15, 0.9, 0.02);
        TB(pv, [[0.02, 0.05, 0.05, PALE], [-0.14, 0.046, 0.046, PALE], [-0.142, 0.05, 0.05, DARK], [-0.3, 0.05, 0.05, DARK], [-0.36, 0.035, 0.035, DARK]], 7, [0, 0, 0], [-0.25, 0, s * 0.3]);      // arms with dark gloves
        P(body, 'cone', PALE, [s * 0.15, 0.86, -0.1], [0.07, 0.24, 0.04], [-2.3, 0, -s * 0.5]); P(body, 'cone', PALE, [s * 0.08, 0.8, -0.13], [0.07, 0.26, 0.04], [-2.5, 0, -s * 0.2]);                     // the fur cape on the back
        P(h, 'cone', WH, [s * 0.21, -0.07, 0.04], [0.035, 0.15, 0.03], [0, 0, -s * 1.9]); P(h, 'cone', WH, [s * 0.2, -0.12, 0.02], [0.03, 0.12, 0.028], [0, 0, -s * 2.3]);                                  // white whisker tufts
        P(body, 'cone', DARK, [s * 0.06, 0.74, 0.115], [0.035, 0.12, 0.02], [0.2, 0, -s * 2.0]);
      }
      P(body, 'sph', DARK, [0, 0.86, 0.085], [0.085, 0.1, 0.04]); P(body, 'cone', DARK, [0, 0.7, 0.115], [0.06, 0.22, 0.03], [Math.PI, 0, 0]);                                                              // chest fur
      P(body, 'sph', 0xf06a9a, [0.07, 0.93, 0.15], 0.06); P(body, 'sph', 0xf8a8c0, [0.07, 0.95, 0.19], [0.035, 0.02, 0.02]); P(body, TT.capsule(0.008, 0.16), DARK, [0.02, 0.93, 0.13], null, [0, 0, 1.2]);     // the flower bud on its vine
    } }); };
  // Meowth: a cream cat on two legs with a wide head, black ears, a gold coin on its forehead, and brown feet and tail tip.
  B.meowth = () => { const CR = 0xf5e6b8, BRN = 0x9a6a3a; return crit({ c: CR, noBody: 1, b: [0.19, 0.25, 0.165], by: 0.4, hy: 0.84, hz: 0.03, hr: 0.28, hs: [0.31, 0.25, 0.25], legs: 2, legT: 0.05, legX: 0.5, legC: BRN, foot: [0.08, 0.045, 0.14], arms: 1, armT: [0.24, 0.042], ear: 'cat', earC: BK, earIn: 0xf0a0b8, earX: 0.66, earY: 0.5, eyeS: 'slit', er: 0.2, ex: 0.12, ey: 0.02, ez: 0.228, eyeTurn: 0.35, tailY: 0.6,
    x: (g, h, body, f, ud) => {
      TB(body, RG(CR, [[0.14, 0.09, 0.08], [0.22, 0.16, 0.14], [0.36, 0.178, 0.152], [0.5, 0.15, 0.13], [0.62, 0.1, 0.095]]), 10);
      TB(ud.tail, [[0, 0.028, 0.028, CR], [0.15, 0.026, 0.026, CR, 0, 0, 0.02], [0.3, 0.024, 0.024, CR, 0, 0, 0.09], [0.4, 0.024, 0.024, CR, 0, 0, 0.2], [0.402, 0.03, 0.03, BRN, 0, 0, 0.2], [0.44, 0.04, 0.04, BRN, 0, 0, 0.27], [0.45, 0.02, 0.02, BRN, 0, 0, 0.33]], 7, null, [-1.0, 0, 0]);
      P(f, 'sph', 0xf2c230, [0, 0.17, 0.235], [0.05, 0.085, 0.025], [-0.45, 0, 0]);
      for (const s of [1, -1]) { for (const a of [0.18, -0.18]) P(f, 'box', CR, [s * 0.34, -0.06 + a * 0.2, 0.1], [0.2, 0.012, 0.012], [0, 0, s * a]); P(h, 'box', CR, [s * 0.06, 0.3, 0.02], [0.012, 0.14, 0.012], [0, 0, -s * 0.2]); P(f, 'cone', WH, [s * 0.04, -0.15, 0.225], [0.013, 0.04, 0.013], [Math.PI, 0, 0]); }
      P(f, 'box', 0x7a3a3a, [0, -0.125, 0.232], [0.1, 0.014, 0.012]);
    } }); };
  const pumpkin = (body, f, y, r, col) => {
    P(body, 'sph', col, [0, y, 0], [r, r * 0.85, r]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.52; P(body, 'sph', col, [Math.sin(a) * r * 0.5, y, Math.cos(a) * r * 0.5], [r * 0.6, r * 0.8, r * 0.6]); }
    for (const s of [1, -1]) P(f, 'sph', TT.glow(0xffe060), [s * r * 0.34, y + r * 0.08, r * 0.97], [r * 0.15, r * 0.13, r * 0.06]);
    P(f, 'box', TT.glow(0xffe060), [0, y - r * 0.26, r * 1.0], [r * 0.42, r * 0.08, r * 0.05]);
  };
  B.pumpkaboo = () => crit({ c: 0x4a3028, b: [0.19, 0.11, 0.19], by: 0.5, hy: 0.68, hz: 0, hr: 0.17, ear: 'cat', earY: 0.55, eye: 0xffd23c, er: 0.2, kind: 'hop',
    x: (g, h, body, f) => { const pf = grp(body, 0, 0, 0, 1); pumpkin(body, pf, 0.29, 0.29, 0xd8742a); P(h, 'sph', 0xf0b89a, [0, 0.13, 0.07], [0.06, 0.12, 0.06], [0.5, 0, 0]); for (const s of [1, -1]) P(f, 'cone', WH, [s * 0.03, -0.09, 0.15], [0.01, 0.03, 0.01], [Math.PI, 0, 0]); } });
  B.gourgeist = () => crit({ c: 0x4a3028, b: [0.1, 0.3, 0.1], by: 0.78, hy: 1.16, hz: 0, hr: 0.18, eye: 0xffd23c, er: 0.2, kind: 'hop', arms: 0,
    x: (g, h, body, f, ud) => { const pf = grp(body, 0, 0, 0, 1); pumpkin(body, pf, 0.36, 0.36, 0xd8742a); P(h, 'sph', 0xf0a07a, [0, 0.2, -0.02], [0.2, 0.2, 0.2]); P(h, 'sph', 0xf0a07a, [0, 0.42, -0.02], [0.11, 0.2, 0.11]); for (const s of [1, -1]) { const pv = grp(body, s * 0.1, 1.0, 0); pv.userData.s = s; P(pv, 'sph', 0xf0a07a, [s * 0.17, -0.18, 0.04], [0.065, 0.32, 0.065], [0, 0, s * 0.7]); P(pv, 'sph', 0xf0a07a, [s * 0.33, -0.38, 0.04], 0.08); ud.arms.push(pv); } } });
  B.inkay = () => crit({ c: 0x8fd0e8, b: [0.17, 0.17, 0.15], by: 0.42, hy: 0.42, hz: 0.02, hr: 0.2, float: 0.35, er: 0.2, eyeS: 'big', eye: 0x2a3a5a,
    x: (g, h, body, f, ud) => {
      P(h, 'sph', new THREE.MeshToonMaterial({ color: 0xffb6d9, transparent: true, opacity: 0.82, gradientMap: TT.grad }), [0, 0.16, -0.01], [0.24, 0.15, 0.23]);
      for (const s of [1, -1]) { P(f, 'sph', TT.glow(0xffe060), [s * 0.12, 0.23, 0.16], 0.025); const pv = grp(body, s * 0.13, 0.32, 0); pv.userData.s = s; P(pv, TT.capsule(0.022, 0.3), 0x8fd0e8, [s * 0.03, -0.17, 0], null, [0, 0, s * 0.2]); P(pv, 'sph', 0xffb6d9, [s * 0.065, -0.36, 0], 0.045); ud.arms.push(pv); P(body, TT.capsule(0.02, 0.14), 0x8fd0e8, [s * 0.05, 0.2, 0.05]); }
      P(f, 'cone', 0xffe9a0, [0, -0.1, 0.19], [0.03, 0.05, 0.03], [1.6, 0, 0]);
    } });
  // Pidgey, Pidgeotto and Pidgeot: a plump brown bird with a cream face and chest, folded wings that flap when it runs, a fan tail and a crest that grows with each evolution.
  const bird = (o) => { const C = o.c, CR = 0xf5e6b8, LEG = 0xe8a890; return crit({ c: C, hc: CR, noBody: 1, b: [0.2, 0.22, 0.26], by: 0.36, hy: 0.7, hz: 0.12, hr: 0.18, hs: [0.185, 0.172, 0.18], legs: 2, legLen: 1, shinC: LEG, legX: 0.4, legC: LEG, foot: [0.05, 0.025, 0.07], scale: o.sc, er: 0.2, tailY: 0.8,
    x: (g, h, body, f, ud) => {
      const R = [[0.13, 0.08, 0.09, C, 0, 0, -0.08], [0.2, 0.17, 0.19, C, 0, 0, -0.05], [0.33, 0.205, 0.235, C, 0, 0, -0.01], [0.47, 0.185, 0.2, C, 0, 0, 0.04], [0.58, 0.14, 0.15, C, 0, 0, 0.09], [0.66, 0.1, 0.11, C, 0, 0, 0.12]];
      TB(body, R, 11); SHELL(body, R, CR, 1.05, Math.PI / 2, 1.025, 8);
      TB(h, RG(C, [[0.035, 0.192, 0.186, 0, -0.012], [0.1, 0.16, 0.16, 0, -0.012], [0.16, 0.09, 0.1, 0, -0.012]]), 10);                         // brown cap
      P(h, 'sph', C, [0, 0.0, -0.045], [0.191, 0.177, 0.16]);                                                                             // and the back of the head
      P(h, 'cone', 0xf0b8a0, [0, -0.04, 0.2], [0.04, 0.1, 0.035], [1.57, 0, 0]);
      for (const s of [1, -1]) {
        P(f, 'box', 0x3a2a1a, [s * 0.1, 0.03, 0.14], [0.09, 0.016, 0.012], [0, s * 0.7, s * 0.3]);
        const w = grp(body, s * 0.19, 0.5, 0.0); w.userData.s = s; (ud.wings = ud.wings || []).push(w);
        P(w, 'sph', C, [s * 0.025, -0.11, -0.03], [0.045, 0.19, 0.22], [0.35, 0, 0]);
        for (let i = 0; i < 3; i++) P(w, 'cone', o.wing, [s * 0.035, -0.2 - i * 0.03, -0.12 - i * 0.055], [0.03, 0.2, 0.06], [-2.35, 0, 0]);         // flight feathers
        for (const dx of [-0.035, 0, 0.035]) P(ud.legs[s > 0 ? 0 : 1], 'cone', LEG, [dx, -0.235, 0.09], [0.014, 0.07, 0.014], [1.57, 0, 0]);       // toes
      }
      for (let i = 0; i < 5; i++) P(ud.tail, 'cone', i % 2 ? o.tail2 : o.tail, [(i - 2) * 0.045, 0.0, -0.13], [0.05, 0.3, 0.018], [-1.95, 0, (i - 2) * 0.16]);
      o.x(h);
    } }); };
  B.pidgey = () => bird({ c: 0xc89b5a, sc: 0.9, wing: 0x9a6a3a, tail: 0x9a6a3a, tail2: 0xc89b5a, x: h => { for (const a of [-0.35, 0, 0.35]) P(h, 'cone', 0xc89b5a, [a * 0.1, 0.17, -0.04], [0.035, 0.13, 0.03], [-0.5, 0, -a]); } });
  B.pidgeotto = () => bird({ c: 0xb8834f, sc: 1.3, wing: 0x8a5a30, tail: 0xe8603a, tail2: 0xf2c860, x: h => { for (const a of [-0.3, 0, 0.3]) TB(h, RG(0xe8705a, [[0, 0.03, 0.02], [0.1, 0.05, 0.022], [0.28, 0.035, 0.018], [0.38, 0.006, 0.006]]), 6, [a * 0.12, 0.15, -0.02], [-1.25, 0, -a * 0.5]); } });
  // Rattata: a purple rat with a cream underside and muzzle, big round ears, buck teeth, whiskers and a thin tail that curls at the end.
  B.rattata = () => { const PU = 0xa070c0, CR = 0xf5e6b8; return crit({ c: PU, noBody: 1, b: [0.18, 0.18, 0.28], by: 0.27, hy: 0.47, hz: 0.27, hr: 0.19, hs: [0.2, 0.18, 0.2], snout: 1, snoutC: CR, legs: 4, legT: 0.04, legC: CR, ear: 'round', earIn: CR, earY: 0.6, eye: 0xc02a2a, er: 0.2, tailY: 1.05,
    x: (g, h, body, f, ud) => {
      QB(body, PU, 0.27, 0.92, CR);
      TB(ud.tail, RG(PU, [[0, 0.03], [0.14, 0.024, 0.024, 0, 0.02], [0.28, 0.02, 0.02, 0, 0.08], [0.38, 0.017, 0.017, 0, 0.17], [0.43, 0.015, 0.015, 0, 0.27]]), 6, null, [-1.1, 0, 0]); P(ud.tail, 'sph', PU, [0, 0.45, -0.235], 0.032);
      P(f, 'box', WH, [0, -0.115, 0.185], [0.055, 0.06, 0.02]); P(f, 'sph', 0x5a3a5a, [0, -0.03, 0.215], 0.018);
      for (const s of [1, -1]) for (const a of [0.2, -0.2]) P(f, 'box', PU, [s * 0.2, -0.05, 0.14], [0.16, 0.008, 0.008], [0, 0, a]);
    } }); };
  B.caterpie = () => crit({ c: 0x6ac85a, b: [0.13, 0.13, 0.13], by: 0.15, hy: 0.3, hz: 0.26, hr: 0.19, eyeS: 'big', eye: BK, er: 0.26, kind: 'crawl',
    x: (g, h, body, f, ud) => { ud.segs = []; for (let i = 1; i < 5; i++) { const sg = grp(body, 0, 0, -0.19 * i); P(sg, 'sph', 0x6ac85a, [0, 0.15 - i * 0.008, 0], 0.15 - i * 0.014); P(sg, 'sph', 0xf2e060, [0, 0.045, 0], [0.1, 0.035, 0.08]); for (const s of [1, -1]) P(sg, 'sph', 0xf2e060, [s * 0.1, 0.16, 0], 0.03); if (i === 4) P(sg, 'cone', 0xf2e060, [0, 0.2, -0.08], [0.03, 0.12, 0.03], [-0.5, 0, 0]); ud.segs.push(sg); } for (const s of [1, -1]) P(h, 'cone', 0xe8402a, [s * 0.05, 0.22, 0], [0.03, 0.18, 0.03], [0, 0, -s * 0.4]); } });
  // Butterfree: a small purple body carried by big white wings with dark veins; red eyes, pale blue hands and feet.
  B.butterfree = () => { const PU = 0x6a5ab0, LB = 0x8adcf0, WG = 0xf8f8ff, VN = 0x3a3a5a; return crit({ c: PU, noBody: 1, b: [0.14, 0.2, 0.13], by: 0.5, hy: 0.78, hz: 0.04, hr: 0.19, hs: [0.2, 0.186, 0.19], eyeS: 'dot', eye: 0xe8402a, er: 0.3, float: 0.5,
    x: (g, h, body, f, ud) => {
      TB(body, RG(PU, [[0.28, 0.05], [0.36, 0.125, 0.115], [0.48, 0.145, 0.13], [0.6, 0.115, 0.105], [0.67, 0.07]]), 9);
      ud.wings = [];
      for (const s of [1, -1]) {
        const w = grp(body, s * 0.08, 0.6, -0.1); w.userData.s = s; ud.wings.push(w);
        P(w, 'sph', WG, [s * 0.33, 0.19, 0], [0.33, 0.35, 0.02], [0, 0, -s * 0.25]); P(w, 'sph', WG, [s * 0.25, -0.2, 0], [0.22, 0.23, 0.02], [0, 0, s * 0.3]);
        for (const q of [[0.3, 0.3, 0.9, 0.5], [0.36, 0.17, 0.35, 0.56], [0.3, 0.04, -0.2, 0.5], [0.24, -0.2, -0.75, 0.36]]) P(w, 'box', VN, [s * q[0], q[1], 0.014], [q[3], 0.014, 0.01], [0, 0, s * q[2]]);         // veins
        P(w, 'sph', VN, [s * 0.52, 0.42, 0.008], [0.09, 0.07, 0.016]);
        P(h, TT.capsule(0.01, 0.16), BK, [s * 0.06, 0.25, 0], null, [0, 0, -s * 0.3]); P(h, 'sph', BK, [s * 0.11, 0.34, 0], 0.022);
        P(body, 'sph', LB, [s * 0.07, 0.3, 0.05], [0.045, 0.06, 0.06]); P(body, 'sph', LB, [s * 0.12, 0.55, 0.1], [0.035, 0.07, 0.035]);
      }
      P(f, 'sph', LB, [0, -0.08, 0.17], [0.05, 0.035, 0.03]); for (const s of [1, -1]) P(f, 'cone', WH, [s * 0.025, -0.11, 0.185], [0.01, 0.025, 0.01], [Math.PI, 0, 0]);
    } }); };
  // Oddish: a round blue body with little feet and five long leaves that sway.
  B.oddish = () => crit({ c: 0x5a78c8, b: [0.05, 0.05, 0.05], by: 0.3, hy: 0.34, hz: 0, hr: 0.27, hs: [0.278, 0.255, 0.265], legs: 2, legX: 2.6, eye: 0xc02a2a, er: 0.17, kind: 'hop', foot: [0.085, 0.05, 0.12],
    x: (g, h, body, f, ud) => { const lv = grp(h, 0, 0.2, -0.02); ud.tail = lv;
      for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.55; TB(lv, RG(i % 2 ? 0x4aa84a : 0x5ab84a, [[0, 0.03, 0.014], [0.14, 0.085, 0.024, Math.sign(a) * 0.01], [0.3, 0.078, 0.02, Math.sign(a) * 0.04], [0.43, 0.04, 0.012, Math.sign(a) * 0.09], [0.5, 0.006, 0.006, Math.sign(a) * 0.14]]), 7, [Math.sin(a) * 0.07, 0, i % 2 ? -0.025 : 0.02], [0, 0, -a]); }
      P(f, 'box', 0x2a3a6a, [0, -0.1, 0.25], [0.07, 0.014, 0.012]); } });
  // Psyduck: a plump yellow duck holding its aching head, with a wide flat bill and three hairs.
  B.psyduck = () => { const Y = 0xffd84d, BILL = 0xf5e6b8; return crit({ c: Y, noBody: 1, b: [0.24, 0.28, 0.22], by: 0.36, hy: 0.82, hz: 0.03, hr: 0.27, hs: [0.275, 0.25, 0.262], legs: 2, legC: BILL, legX: 0.5, foot: [0.115, 0.03, 0.17], eyeS: 'tiny', er: 0.2, ex: 0.115, ey: 0.07, eyeTurn: 0.35, tailY: 0.6,
    x: (g, h, body, f, ud) => {
      TB(body, RG(Y, [[0.06, 0.12, 0.11], [0.14, 0.225, 0.2], [0.27, 0.262, 0.235], [0.4, 0.245, 0.215], [0.52, 0.19, 0.17], [0.62, 0.13, 0.125]]), 12);
      P(h, 'sph', BILL, [0, -0.075, 0.235], [0.155, 0.05, 0.15]); P(h, 'sph', 0xe8d49a, [0, -0.115, 0.215], [0.13, 0.035, 0.12]);                     // the wide flat bill
      for (const s of [1, -1]) P(f, 'sph', 0x8a6a3a, [s * 0.035, -0.045, 0.36], [0.01, 0.006, 0.012]);
      for (const a of [-0.35, 0, 0.35]) P(h, TT.capsule(0.01, 0.13), BK, [Math.sin(a) * 0.1, 0.3, 0], null, [0, 0, -a]);
      for (const s of [1, -1]) { const pv = grp(body, s * 0.2, 0.52, 0.04); pv.userData.s = s; pv.userData.hold = 1; TB(pv, RG(Y, [[-0.02, 0.05], [0.14, 0.05], [0.27, 0.045], [0.33, 0.03]]), 7, null, [0, 0, -s * 0.5]); ud.arms.push(pv); }        // hands on its head
      P(ud.tail, 'cone', Y, [0, 0.04, -0.06], [0.07, 0.18, 0.06], [-1.9, 0, 0]);
    } }); };
  // Eevee: a little brown fox with a cream ruff round its neck, long ears and a big bushy cream-tipped tail.
  B.eevee = () => { const BR = 0xb8834f, DK = 0x6a4426, RUFF = 0xf5e6b8; return crit({ c: BR, noBody: 1, b: [0.19, 0.19, 0.28], by: 0.31, hy: 0.6, hz: 0.25, hr: 0.22, hs: [0.238, 0.2, 0.207], cheek: 1, legs: 4, legT: 0.048, legC: DK, eyeS: 'big', eye: 0x5a3018, er: 0.19, ex: 0.092, ey: 0.03, ez: 0.19, eyeTurn: 0.3, tailY: 1.1,
    x: (g, h, body, f, ud) => {
      TB(body, RG(BR, [[-0.29, 0.05, 0.055], [-0.22, 0.13, 0.135], [-0.08, 0.155, 0.162], [0.08, 0.16, 0.168], [0.2, 0.135, 0.14], [0.27, 0.085, 0.09]]), 10, [0, 0.31, 0], [Math.PI / 2, 0, 0]);
      P(body, 'sph', RUFF, [0, 0.37, 0.2], [0.185, 0.15, 0.13]);
      for (let i = 0; i < 9; i++) { const a = -1.6 + i * 0.4; P(body, 'cone', RUFF, [Math.sin(a) * 0.16, 0.39 - Math.abs(Math.sin(a)) * 0.03, 0.2 + Math.cos(a) * 0.1], [0.11, 0.2, 0.075], [1.9 + Math.cos(a) * 0.55, 0, -Math.sin(a) * 1.25]); }      // the fluffy ruff
      TB(ud.tail, [[0, 0.06, 0.06, BR], [0.1, 0.14, 0.13, BR, 0, 0, 0.01], [0.22, 0.165, 0.15, BR, 0, 0, 0.03], [0.3, 0.15, 0.135, BR, 0, 0, 0.05], [0.305, 0.15, 0.135, RUFF, 0, 0, 0.05], [0.4, 0.09, 0.085, RUFF, 0, 0, 0.08], [0.46, 0.03, 0.03, RUFF, 0, 0, 0.1]], 9, null, [-0.8, 0, 0]);
      for (const s of [1, -1]) {
        const e = grp(h, s * 0.12, 0.13, -0.01); e.userData.s = s; e.userData.rz = -s * 0.6; e.rotation.z = e.userData.rz; ud.ears.push(e);
        TB(e, RG(BR, [[0, 0.055, 0.035], [0.11, 0.085, 0.04], [0.23, 0.07, 0.035], [0.33, 0.035, 0.02], [0.38, 0.008, 0.008]]), 8);
        P(e, 'cone', DK, [0, 0.18, 0.03], [0.05, 0.3, 0.014]);
      }
      P(f, 'sph', BK, [0, -0.07, 0.21], [0.02, 0.014, 0.012]);
    } }); };
  // Charmander and Charmeleon: a lizard standing upright with a cream belly, clawed feet and a thick tail that carries a flame.
  function lizard(o) {
    const C = o.c, K = o.k, by = 0.38 * K, ly = by * 0.7;
    return crit({ c: C, noBody: 1, b: [0.2 * K, 0.27 * K, 0.19 * K], by, hy: 0.82 * K + (o.neck || 0), hz: 0.06, hr: o.hr, hs: o.hs, snout: 1, legs: 2, legT: 0.075 * K, legX: 0.62, foot: [0.095, 0.05, 0.16], arms: 1, armT: [0.2 * K, 0.045], eyeS: o.eyeS, eye: o.eye, er: 0.17, ex: 0.11, ey: 0.05, ez: 0.19, eyeTurn: 0.5, tailY: 0.5,
      x: (g, h, body, f, ud) => {
        const R = RG(C, [[0.1, 0.1, 0.09], [0.18, 0.2, 0.18], [0.3, 0.235, 0.21], [0.42, 0.22, 0.195], [0.54, 0.17, 0.155], [0.66, 0.115, 0.11]], K);
        TB(body, R, 12); SHELL(body, R, CREAM, 0.95, Math.PI / 2, 1.025, 8);
        TB(ud.tail, RG(C, [[0, 0.1], [0.12, 0.088, 0.088, 0, 0.01], [0.26, 0.066, 0.066, 0, 0.05], [0.38, 0.046, 0.046, 0, 0.13], [0.47, 0.03, 0.03, 0, 0.22]], K), 8, [0, 0, 0.03], [-1.25, 0, 0]);
        const F = o.fl, fl = ud.flame = grp(ud.tail, 0, 0.36 * K, -0.34 * K); P(fl, 'cone', TT.glow(0xff7a1a), [0, 0.13 * F, 0], [0.1 * F, 0.3 * F, 0.1 * F]); P(fl, 'cone', TT.glow(0xffe060), [0, 0.09 * F, 0], [0.055 * F, 0.18 * F, 0.055 * F]);
        for (const pv of ud.legs) for (const dx of [-0.05, 0, 0.05]) P(pv, 'cone', WH, [dx, -ly + 0.03, 0.2], [0.018, 0.045, 0.018], [1.57, 0, 0]);       // claws
        o.x(h, f, body, ud);
      } });
  }
  B.charmander = () => lizard({ c: 0xff9441, k: 1, hr: 0.24, hs: [0.245, 0.222, 0.24], eyeS: 'big', eye: 0x2a7a8a, fl: 1,
    x: (h, f) => { P(f, 'box', 0x8a3a1a, [0, -0.115, 0.215], [0.09, 0.012, 0.012]); for (const s of [1, -1]) P(f, 'sph', 0x8a3a1a, [s * 0.03, -0.05, 0.255], 0.008); } });
  // Squirtle and Wartortle: a turtle on two legs. The front is a cream plate, the back a brown shell with a white rim.
  function turtle(o) {
    const C = o.c, K = o.k, PLATE = 0xf8dc8a;
    return crit({ c: C, noBody: 1, b: [0.2 * K, 0.25 * K, 0.18 * K], by: 0.36 * K, hy: 0.79 * K, hz: 0.05, hr: 0.24, hs: [0.245, 0.225, 0.235], legs: 2, legT: 0.07 * K, legX: 0.66, foot: [0.085, 0.05, 0.13], arms: 1, armT: [0.19 * K, 0.05], eyeS: 'big', eye: o.eye, er: 0.18, ex: 0.11, ey: 0.05, eyeTurn: 0.45, tailY: 0.5,
      x: (g, h, body, f, ud) => {
        TB(body, RG(PLATE, [[0.1, 0.11, 0.1], [0.18, 0.2, 0.16], [0.32, 0.235, 0.18], [0.46, 0.215, 0.17], [0.58, 0.15, 0.13], [0.65, 0.09, 0.08]], K), 12);
        P(body, 'sph', 0xf4f6fa, [0, 0.37 * K, -0.045 * K], [0.262 * K, 0.292 * K, 0.15 * K]);      // the shell's white rim
        P(body, 'sph', 0x9a6a3a, [0, 0.37 * K, -0.1 * K], [0.238 * K, 0.268 * K, 0.17 * K]);        // the brown shell
        for (const y of [0.27, 0.45]) P(body, 'box', 0xd9b45c, [0, y * K, 0.172 * K], [0.15 * K, 0.009, 0.012]);      // lines across the plate
        P(f, 'box', 0x3a6a8a, [0, -0.11, 0.215], [0.1, 0.012, 0.012]);
        o.x(h, f, body, ud);
      } });
  }
  B.squirtle = () => turtle({ c: 0x7fccec, k: 1, eye: 0x8a3a2a, x: (h, f, body, ud) => curlTail(ud.tail, 0x7fccec, 6, 0.1, 0.062) });
  // Bulbasaur and Ivysaur: a squat four-legged body with a wide head; a green bulb on the back that becomes a pink bud among big leaves.
  function bulb(o) {
    const C = o.c, K = o.k, SPOT = o.spot;
    return crit({ c: C, noBody: 1, b: [0.22 * K, 0.19 * K, 0.3 * K], by: 0.29 * K, hy: 0.43 * K, hz: 0.3 * K, hr: 0.22 * K, hs: [0.25 * K, 0.188 * K, 0.215 * K], legs: 4, legT: 0.068 * K, ear: 'cat', earY: 0.45, earX: 0.62, eyeS: 'big', eye: 0xc02a2a, er: 0.19, ex: 0.115 * K, ey: 0.03, ez: 0.17 * K, eyeTurn: 0.55,
      x: (g, h, body, f, ud) => {
        TB(body, RG(C, [[-0.3, 0.08, 0.08], [-0.22, 0.19, 0.16], [-0.06, 0.228, 0.188], [0.1, 0.222, 0.182], [0.22, 0.17, 0.15], [0.3, 0.1, 0.1]], K), 10, [0, 0.3 * K, 0], [Math.PI / 2, 0, 0]);
        for (const q of [[0.17, 0.38, 0.12], [-0.19, 0.33, 0.0], [0.2, 0.28, -0.14]]) P(body, 'sph', SPOT, [q[0] * K, q[1] * K, q[2] * K], [0.05, 0.045, 0.05]);
        P(h, 'sph', SPOT, [0.07 * K, 0.15 * K, 0.11 * K], [0.05, 0.03, 0.04]);
        P(f, 'box', o.mouth, [0, -0.1 * K, 0.197 * K], [0.14 * K, 0.012, 0.012]);
        for (const s of [1, -1]) P(f, 'sph', o.mouth, [s * 0.025, -0.045 * K, 0.21 * K], 0.007);
        for (const pv of ud.legs) for (const dx of [-0.04, 0, 0.04]) P(pv, 'cone', WH, [dx, -pv.position.y + 0.025, 0.085 * K], [0.016, 0.035, 0.016], [1.57, 0, 0]);
        o.x(h, f, body, ud);
      } });
  }
  B.bulbasaur = () => bulb({ c: 0x7ad4b4, k: 1, spot: 0x4aa890, mouth: 0x2a6a5a,
    x: (h, f, body) => { TB(body, RG(0x58b858, [[0, 0.1], [0.06, 0.19], [0.16, 0.205], [0.26, 0.15], [0.34, 0.06], [0.39, 0.012]]), 8, [0, 0.43, -0.07], [-0.12, 0, 0]); } });
  // Growlithe: an orange puppy with black stripes over its back, a cream ruff, a tuft on its head and a big cream tail.
  B.growlithe = () => { const OR = 0xf08a3a, CR = 0xf5e6b8, DK = 0x3a2a22; return crit({ c: OR, noBody: 1, b: [0.19, 0.19, 0.28], by: 0.31, hy: 0.58, hz: 0.25, hr: 0.21, hs: [0.222, 0.2, 0.21], snout: 1, snoutC: CR, legs: 4, legT: 0.055, eyeS: 'dot', er: 0.17, tailY: 1.1,
    x: (g, h, body, f, ud) => {
      QB(body, OR, 0.31, 1, CR);
      for (const y of [-0.13, -0.01, 0.1]) BAND(body, y - 0.024, y + 0.024, [0.165, 0.174], DK, 0.8, 4.712, [0, 0.31, 0], [Math.PI / 2, 0, 0]);
      ruff(body, CR, 8, 0.95);
      P(h, 'sph', CR, [0, 0.17, 0.03], [0.12, 0.1, 0.13]); for (const a of [-0.5, 0, 0.5]) P(h, 'cone', CR, [a * 0.1, 0.26, 0.03], [0.05, 0.13, 0.05], [0.2, 0, -a]);
      TB(ud.tail, RG(CR, [[0, 0.06], [0.1, 0.135, 0.125, 0, 0.01], [0.22, 0.16, 0.145, 0, 0.04], [0.34, 0.115, 0.105, 0, 0.09], [0.43, 0.035, 0.035, 0, 0.14]]), 9, null, [-0.55, 0, 0]);
      for (const s of [1, -1]) tEar(h, ud, s, 0.15, 0.11, 0.85, 0.17, 0.075, OR, CR);
      P(f, 'sph', DK, [0, -0.04, 0.21], 0.02);
    } }); };
  B.jigglypuff = () => crit({ c: 0xf9b8d0, b: [0.05, 0.05, 0.05], by: 0.3, hy: 0.36, hz: 0, hr: 0.3, legs: 2, legX: 2.8, ear: 'cat', earIn: 0x5a3a4a, earY: 0.6, eyeS: 'big', eye: 0x2a9ab8, er: 0.2, kind: 'hop', foot: [0.08, 0.05, 0.12],
    x: (g, h, body, f) => { P(h, 'sph', 0xf9b8d0, [0, 0.2, 0.2], [0.1, 0.1, 0.09]); P(h, 'sph', 0xf9b8d0, [0.05, 0.12, 0.26], 0.07); P(f, 'box', 0x8a3a5a, [0, -0.13, 0.275], [0.06, 0.014, 0.012]); for (const s of [1, -1]) P(body, 'sph', 0xf9b8d0, [s * 0.29, 0.3, 0.04], [0.06, 0.08, 0.06]); } });
  // Machop and Machoke: a strong upright fighter with a broad chest, thick arms and three ridges on its head.
  function fighter(o) {
    const C = o.c, K = o.k, LO = o.trunk != null ? o.trunk : C;
    return crit({ c: C, noBody: 1, b: [0.2 * K, 0.25 * K, 0.17 * K], by: 0.42 * K, hy: 0.86 * K, hz: 0.03, hr: 0.22, hs: [0.215, 0.21, 0.21], legs: 2, legT: 0.07 * K, legX: 0.55, foot: [0.085, 0.05, 0.14], arms: 1, armT: [o.arm[0], o.arm[1]], eyeS: 'dot', eye: 0xc02a2a, er: 0.16, tailY: 0.6,
      x: (g, h, body, f, ud) => {
        TB(body, [[0.2, 0.13, 0.11, LO], [0.29, 0.19, 0.15, LO], [0.38, 0.195, 0.152, LO], [0.382, 0.195, 0.152, C], [0.46, 0.2, 0.155, C], [0.58, 0.24, 0.172, C], [0.68, 0.2, 0.15, C], [0.75, 0.1, 0.09, C]].map(r => [r[0] * K, r[1] * K, r[2] * K, r[3]]), 12);
        for (const pv of ud.arms) { const s = pv.userData.s; pv.position.set(s * 0.245 * K, 0.63 * K, 0.02); P(body, 'sph', C, [s * 0.24 * K, 0.64 * K, 0.02], 0.095 * K); P(pv, 'sph', C, [s * (0.05 + o.arm[0] * 0.33), -o.arm[0] * 0.84, o.arm[0] * 0.46], o.arm[1] * 1.15); }       // round shoulders and fists
        for (const q of [-0.07, 0, 0.07]) P(h, 'sph', o.ridge, [q, 0.2, -0.02], [0.025, 0.075, 0.13]);
        P(f, 'box', o.mouth, [0, -0.1, 0.2], [0.09, 0.012, 0.012]);
        o.x(h, f, body, ud);
      } });
  }
  B.machop = () => fighter({ c: 0x9ab4c8, k: 1, arm: [0.27, 0.06], ridge: 0xe8d8b0, mouth: 0x5a6a7a,
    x: (h, f, body, ud) => { P(ud.tail, 'cone', 0x9ab4c8, [0, 0.03, -0.05], [0.06, 0.16, 0.055], [-1.9, 0, 0]); for (const s of [1, -1]) for (const y of [0.5, 0.45, 0.4]) P(body, 'box', 0x6a8498, [s * 0.1, y, 0.152], [0.06, 0.01, 0.012], [0, s * 0.35, s * 0.25]); } });
  B.magnemite = () => crit({ c: 0xb8c0cc, b: [0.05, 0.05, 0.05], by: 0.4, hy: 0.42, hz: 0, hr: 0.23, eyeS: 'none', float: 0.45,
    x: (g, h, body, f, ud) => { P(f, 'sph', WH, [0, 0, 0.19], [0.13, 0.13, 0.06]); P(f, 'sph', BK, [0, 0, 0.245], 0.04); for (const s of [1, -1]) { const pv = grp(body, s * 0.2, 0.42, 0); pv.userData.s = s; P(pv, 'box', 0x8a929e, [s * 0.1, 0, 0], [0.16, 0.06, 0.06]); for (const q of [1, -1]) { P(pv, 'box', 0x8a929e, [s * 0.2, q * 0.08, 0], [0.07, 0.1, 0.07]); P(pv, 'box', q > 0 ? 0xe2382e : 0x3a6ad8, [s * 0.2, q * 0.15, 0], [0.07, 0.06, 0.07]); } ud.arms.push(pv); } P(h, 'cyl', 0x8a929e, [0, 0.25, 0], [0.03, 0.1, 0.03]); P(h, 'cyl', 0x8a929e, [0, 0.3, 0], [0.06, 0.02, 0.06]); for (const s of [1, -1]) P(h, 'cyl', 0x8a929e, [s * 0.1, -0.19, 0.1], [0.025, 0.06, 0.025], [0.5, 0, 0]); } });
  // Fuecoco: a round red croc with a cream tummy, a wide toothy snout and a little flame on its head.
  B.fuecoco = () => { const RD = 0xe8503a, CR = 0xf5e6b8; return crit({ c: RD, noBody: 1, b: [0.22, 0.26, 0.2], by: 0.36, hy: 0.79, hz: 0.06, hr: 0.25, hs: [0.25, 0.21, 0.24], snout: 1, legs: 2, legT: 0.075, legX: 0.58, arms: 1, armT: [0.15, 0.05], eyeS: 'big', eye: 0x2a2a2a, er: 0.15, ex: 0.1, ey: 0.09, ez: 0.19, eyeTurn: 0.4, tailY: 0.5,
    x: (g, h, body, f, ud) => {
      const R = RG(RD, [[0.08, 0.11, 0.1], [0.16, 0.21, 0.19], [0.28, 0.242, 0.218], [0.4, 0.222, 0.198], [0.52, 0.17, 0.155], [0.63, 0.12, 0.115]]);
      TB(body, R, 12); SHELL(body, R.slice(0, 5), CR, 0.7, Math.PI / 2, 1.025, 8);
      P(ud.tail, 'cone', RD, [0, 0.03, -0.07], [0.085, 0.22, 0.075], [-1.85, 0, 0]);
      P(h, 'sph', RD, [0, -0.07, 0.2], [0.2, 0.1, 0.2]); P(h, 'cone', 0xffd23c, [0, 0.27, -0.02], [0.07, 0.2, 0.06], [-0.3, 0, 0]); P(h, 'cone', 0xff9a1f, [0.06, 0.24, -0.02], [0.04, 0.12, 0.04], [-0.3, 0, -0.4]);
      P(f, 'box', WH, [0, -0.12, 0.37], [0.2, 0.025, 0.02]); for (const s of [1, -1]) P(f, 'sph', 0x8a2a1a, [s * 0.05, -0.02, 0.385], 0.012);
    } }); };
  // Quaxly: a tidy white duckling with a swept-up blue cap, a yellow bill and yellow feet.
  B.quaxly = () => { const W2 = 0xf4f6fa, BL = 0x3a86d8, LB = 0x7fd4f0, YL = 0xf2b830; return crit({ c: W2, noBody: 1, b: [0.2, 0.25, 0.19], by: 0.36, hy: 0.78, hz: 0.04, hr: 0.22, hs: [0.228, 0.212, 0.218], legs: 2, legC: YL, legX: 0.5, foot: [0.1, 0.028, 0.15], arms: 1, armT: [0.2, 0.05], eyeS: 'big', eye: 0x2a6ad0, er: 0.18, tailY: 0.75,
    x: (g, h, body, f, ud) => {
      TB(body, RG(W2, [[0.07, 0.1, 0.1], [0.15, 0.2, 0.185], [0.27, 0.228, 0.208], [0.4, 0.2, 0.182], [0.52, 0.15, 0.14], [0.62, 0.1, 0.1]]), 12);
      P(h, 'sph', YL, [0, -0.065, 0.2], [0.105, 0.042, 0.115]); P(h, 'sph', 0xe0a020, [0, -0.095, 0.185], [0.09, 0.03, 0.09]);
      TB(h, RG(BL, [[0.03, 0.232, 0.224], [0.11, 0.205, 0.2], [0.18, 0.14, 0.15, 0, 0.02]]), 10);                                                               // the cap
      TB(h, [[0.13, 0.15, 0.15, BL, 0, 0, 0.02], [0.2, 0.15, 0.15, BL, 0, 0, 0.06], [0.26, 0.125, 0.13, BL, 0, 0, 0.11], [0.3, 0.08, 0.09, BL, 0, 0, 0.16]], 9);      // swept up and forward
      P(h, 'sph', BL, [0, 0.27, 0.19], [0.1, 0.075, 0.1]); P(h, 'sph', LB, [0, 0.245, 0.27], [0.075, 0.06, 0.07]);                                                    // the quiff, with a pale tip
      for (const a of [-0.4, 0, 0.4]) P(ud.tail, 'cone', a ? W2 : BL, [Math.sin(a) * 0.06, 0.07, -0.05], [0.045, 0.17, 0.025], [-0.9, 0, -a]);
    } }); };
  // Lugia: a great white sea bird: one sweeping body and neck, a pale blue front, dark blue plates down its back, and wings like huge hands.
  B.lugia = () => { const W2 = 0xf2f4fa, NV = 0x3a5ac8; return crit({ c: W2, noBody: 1, b: [0.3, 0.32, 0.42], by: 0.75, hy: 1.52, hz: 0.44, hr: 0.2, hs: [0.19, 0.17, 0.26], float: 0.45, kind: 'float', eyeS: 'dot', eye: 0xe8402a, er: 0.18, ex: 0.1, ey: 0.03, ez: 0.17, eyeTurn: 0.5, scale: 1.15,
    x: (g, h, body, f, ud) => {
      const R = [[0.36, 0.1, 0.12, W2, 0, 0, -0.22], [0.48, 0.27, 0.32, W2, 0, 0, -0.12], [0.72, 0.33, 0.4, W2, 0, 0, 0], [0.95, 0.28, 0.32, W2, 0, 0, 0.12], [1.12, 0.165, 0.175, W2, 0, 0, 0.26], [1.3, 0.118, 0.125, W2, 0, 0, 0.36], [1.46, 0.105, 0.112, W2, 0, 0, 0.42]];
      TB(body, R, 12); SHELL(body, R.slice(0, 5), 0xcfdcf4, 0.8, Math.PI / 2, 1.02, 8);
      for (const s of [1, -1]) P(h, 'sph', NV, [s * 0.09, 0.03, 0.12], [0.08, 0.05, 0.08]);                            // blue eye mask
      P(h, 'cone', NV, [0, 0.08, -0.22], [0.05, 0.25, 0.05], [-1.9, 0, 0]);
      for (let i = 0; i < 4; i++) P(body, 'cone', NV, [0, 1.05 - i * 0.04, -0.05 - i * 0.18], [0.06, 0.22, 0.12], [-0.8, 0, 0]);  // back plates
      TB(ud.tail, RG(W2, [[0, 0.11], [0.3, 0.08, 0.08, 0, 0.02], [0.6, 0.05, 0.05, 0, 0.06], [0.8, 0.02, 0.02, 0, 0.1]]), 8, [0, 0.05, 0], [-1.45, 0, 0]);
      for (const s of [1, -1]) P(ud.tail, 'cone', NV, [s * 0.07, 0.12, -0.62], [0.05, 0.22, 0.03], [-1.2, 0, -s * 0.5]);
      ud.slowWings = 1; ud.wings = []; for (const s of [1, -1]) { const w = grp(body, s * 0.28, 0.95, 0); w.userData.s = s; P(w, 'sph', W2, [s * 0.45, 0.05, 0], [0.5, 0.06, 0.22], [0, 0, s * 0.25]); for (let i = 0; i < 4; i++) P(w, 'cone', i % 2 ? W2 : NV, [s * (0.75 + i * 0.05), -0.05 - i * 0.05, -0.12 + i * 0.08], [0.06, 0.32, 0.05], [0, 0, s * 2.4]); ud.wings.push(w); }
    } }); };
  // name, type, hp, atk, def, moves [name,type,power,level], evo [to, level]
  const D = TT.DEX = {
    pikachu: ['Pikachu', 'electric', 35, 55, 40, [['Thunder Shock', 'electric', 40, 1], ['Quick Attack', 'normal', 35, 1], ['Iron Tail', 'normal', 65, 6], ['Thunderbolt', 'electric', 70, 8]]],
    sprigatito: ['Sprigatito', 'grass', 40, 61, 54, [['Leafage', 'grass', 40, 1], ['Scratch', 'normal', 35, 1], ['Magical Leaf', 'grass', 60, 7], ['Bite', 'dark', 50, 9]], ['floragato', 8]],
    floragato: ['Floragato', 'grass', 61, 80, 63, [['Magical Leaf', 'grass', 60, 1], ['Slash', 'normal', 55, 1], ['Seed Bomb', 'grass', 75, 10], ['Bite', 'dark', 50, 1]]],
    meowth: ['Meowth', 'normal', 40, 45, 35, [['Scratch', 'normal', 35, 1], ['Bite', 'dark', 40, 1]]],
    pumpkaboo: ['Pumpkaboo', 'ghost', 49, 50, 45, [['Shadow Sneak', 'ghost', 35, 1], ['Razor Leaf', 'grass', 40, 1]], ['gourgeist', 99]],
    gourgeist: ['Gourgeist', 'ghost', 60, 62, 55, [['Shadow Ball', 'ghost', 50, 1], ['Seed Bomb', 'grass', 50, 1]]],
    inkay: ['Inkay', 'dark', 53, 48, 50, [['Peck', 'flying', 35, 1], ['Psybeam', 'psychic', 40, 1]]],
    pidgey: ['Pidgey', 'flying', 40, 45, 40, [['Tackle', 'normal', 35, 1], ['Gust', 'flying', 40, 1], ['Wing Attack', 'flying', 60, 9]], ['pidgeotto', 9]],
    pidgeotto: ['Pidgeotto', 'flying', 63, 60, 55, [['Wing Attack', 'flying', 60, 1], ['Quick Attack', 'normal', 40, 1], ['Gust', 'flying', 40, 1]]],
    rattata: ['Rattata', 'normal', 30, 56, 35, [['Tackle', 'normal', 35, 1], ['Bite', 'dark', 45, 4], ['Hyper Fang', 'normal', 65, 9]]],
    caterpie: ['Caterpie', 'bug', 45, 30, 35, [['Tackle', 'normal', 35, 1], ['Bug Bite', 'bug', 45, 3]], ['butterfree', 6]],
    butterfree: ['Butterfree', 'bug', 60, 60, 50, [['Gust', 'flying', 40, 1], ['Bug Bite', 'bug', 45, 1], ['Psybeam', 'psychic', 60, 1]]],
    oddish: ['Oddish', 'grass', 45, 50, 55, [['Absorb', 'grass', 35, 1], ['Razor Leaf', 'grass', 50, 5]]],
    psyduck: ['Psyduck', 'water', 50, 52, 48, [['Water Gun', 'water', 40, 1], ['Scratch', 'normal', 35, 1], ['Confusion', 'psychic', 50, 7]]],
    eevee: ['Eevee', 'normal', 55, 55, 50, [['Tackle', 'normal', 35, 1], ['Swift', 'normal', 55, 4], ['Bite', 'dark', 50, 7]]],
    charmander: ['Charmander', 'fire', 39, 52, 43, [['Scratch', 'normal', 35, 1], ['Ember', 'fire', 45, 1], ['Flamethrower', 'fire', 75, 10]]],
    squirtle: ['Squirtle', 'water', 44, 48, 65, [['Tackle', 'normal', 35, 1], ['Water Gun', 'water', 45, 1], ['Bubble Beam', 'water', 65, 9]]],
    growlithe: ['Growlithe', 'fire', 55, 70, 45, [['Bite', 'dark', 45, 1], ['Ember', 'fire', 45, 1], ['Flame Wheel', 'fire', 65, 9]]],
    jigglypuff: ['Jigglypuff', 'normal', 95, 45, 25, [['Pound', 'normal', 40, 1], ['Disarming Voice', 'psychic', 45, 1], ['Body Slam', 'normal', 70, 10]]],
    machop: ['Machop', 'fighting', 70, 80, 50, [['Karate Chop', 'fighting', 50, 1], ['Low Kick', 'fighting', 45, 1], ['Cross Chop', 'fighting', 75, 11]]],
    magnemite: ['Magnemite', 'electric', 25, 60, 70, [['Thunder Shock', 'electric', 40, 1], ['Tackle', 'normal', 35, 1], ['Spark', 'electric', 65, 9]]],
    fuecoco: ['Fuecoco', 'fire', 67, 60, 59, [['Ember', 'fire', 45, 1], ['Bite', 'dark', 45, 1], ['Incinerate', 'fire', 65, 9]]],
    quaxly: ['Quaxly', 'water', 55, 65, 45, [['Water Gun', 'water', 45, 1], ['Wing Attack', 'flying', 50, 1], ['Aqua Cutter', 'water', 70, 10]]],
    lugia: ['Lugia', 'flying', 106, 100, 130, [['Aeroblast', 'flying', 80, 1], ['Hydro Pump', 'water', 80, 1]]],
    bulbasaur: ['Bulbasaur', 'grass', 45, 49, 49, [['Tackle', 'normal', 35, 1], ['Vine Whip', 'grass', 45, 1], ['Razor Leaf', 'grass', 60, 8]]]
  };
  TT.TYPE_COL = { normal: 0xa8a890, fire: 0xf08030, water: 0x4a90e8, grass: 0x5ab84a, electric: 0xf2c230, flying: 0x8aa0f0, bug: 0x98b020, psychic: 0xf06090, ghost: 0x7058a0, dark: 0x5a4a48, fighting: 0xc03028 };
  const SE = { fire: ['grass', 'bug'], water: ['fire'], grass: ['water'], electric: ['water', 'flying'], flying: ['grass', 'bug'], bug: ['grass', 'psychic', 'dark'], ghost: ['psychic', 'ghost'], dark: ['psychic', 'ghost'], fighting: ['normal', 'dark'] };
  const NV = { fire: ['fire', 'water'], water: ['water', 'grass'], grass: ['grass', 'fire', 'flying', 'bug'], electric: ['electric', 'grass'], normal: ['ghost'], psychic: ['dark', 'psychic'], bug: ['fire', 'flying'], dark: ['dark'], fighting: ['flying', 'psychic', 'bug', 'ghost'] };
  TT.eff = (a, d) => (SE[a] && SE[a].includes(d)) ? 1.6 : (NV[a] && NV[a].includes(d)) ? 0.6 : 1;

  // ---------- Wide World: new types, Pokémon and evolutions ----------
  Object.assign(TT.TYPE_COL, { steel: 0xa8b0c8, rock: 0xb8a038, dragon: 0x7038f8 });
  SE.fire.push('steel'); SE.fighting.push('steel', 'rock'); SE.electric.push('steel'); SE.water.push('rock'); SE.grass.push('rock');
  SE.rock = ['fire', 'flying', 'bug']; SE.steel = ['rock']; SE.dragon = ['dragon'];
  NV.rock = ['fighting', 'steel']; NV.steel = ['steel', 'fire', 'water', 'electric']; NV.dragon = ['steel'];
  NV.normal.push('rock', 'steel'); NV.grass.push('steel', 'dragon'); NV.fire.push('rock', 'dragon'); NV.water.push('dragon'); NV.fighting.push('psychic');
  Object.assign(D, {
    poliwag: ['Poliwag', 'water', 40, 50, 40, [['Pound', 'normal', 40, 1], ['Water Gun', 'water', 45, 1], ['Bubble Beam', 'water', 65, 9]], ['poliwhirl', 14]],
    poliwhirl: ['Poliwhirl', 'water', 65, 65, 65, [['Double Slap', 'normal', 55, 1], ['Water Gun', 'water', 45, 1], ['Bubble Beam', 'water', 65, 1], ['Body Slam', 'normal', 70, 16]]],
    magikarp: ['Magikarp', 'water', 25, 15, 55, [['Splash', 'water', 15, 1], ['Tackle', 'normal', 35, 1]], ['gyarados', 12]],
    gyarados: ['Gyarados', 'water', 95, 120, 79, [['Bite', 'dark', 60, 1], ['Aqua Tail', 'water', 80, 1], ['Dragon Rage', 'dragon', 70, 1], ['Hyper Beam', 'normal', 90, 18]]],
    geodude: ['Geodude', 'rock', 40, 80, 100, [['Tackle', 'normal', 35, 1], ['Rock Throw', 'rock', 50, 1], ['Rock Slide', 'rock', 70, 12]]],
    ponyta: ['Ponyta', 'fire', 50, 85, 55, [['Ember', 'fire', 45, 1], ['Stomp', 'normal', 50, 1], ['Flame Charge', 'fire', 65, 11]]],
    abra: ['Abra', 'psychic', 40, 65, 40, [['Confusion', 'psychic', 50, 1], ['Psybeam', 'psychic', 65, 8]]],
    dratini: ['Dratini', 'dragon', 45, 64, 45, [['Wrap', 'normal', 35, 1], ['Twister', 'dragon', 45, 1], ['Dragon Tail', 'dragon', 65, 12]], ['dragonair', 16]],
    dragonair: ['Dragonair', 'dragon', 65, 84, 65, [['Twister', 'dragon', 45, 1], ['Aqua Tail', 'water', 70, 1], ['Dragon Tail', 'dragon', 65, 1], ['Dragon Pulse', 'dragon', 85, 20]]],
    snorlax: ['Snorlax', 'normal', 110, 80, 55, [['Headbutt', 'normal', 60, 1], ['Body Slam', 'normal', 75, 1]]],
    rayquaza: ['Rayquaza', 'dragon', 105, 120, 90, [['Air Slash', 'flying', 70, 1], ['Dragon Pulse', 'dragon', 80, 1]]],
    mecha: ['Mecha-Meowth', 'steel', 100, 80, 70, [['Metal Claw', 'steel', 55, 1], ['Rocket Punch', 'fighting', 60, 1]]],
    charmeleon: ['Charmeleon', 'fire', 58, 64, 58, [['Ember', 'fire', 45, 1], ['Slash', 'normal', 55, 1], ['Flamethrower', 'fire', 75, 1], ['Dragon Rage', 'dragon', 60, 1]]],
    wartortle: ['Wartortle', 'water', 59, 63, 80, [['Water Gun', 'water', 45, 1], ['Bite', 'dark', 50, 1], ['Bubble Beam', 'water', 65, 1], ['Aqua Tail', 'water', 75, 1]]],
    ivysaur: ['Ivysaur', 'grass', 60, 62, 63, [['Tackle', 'normal', 35, 1], ['Vine Whip', 'grass', 45, 1], ['Razor Leaf', 'grass', 60, 1], ['Seed Bomb', 'grass', 75, 1]]],
    machoke: ['Machoke', 'fighting', 80, 100, 70, [['Karate Chop', 'fighting', 50, 1], ['Low Kick', 'fighting', 45, 1], ['Seismic Toss', 'fighting', 60, 1], ['Cross Chop', 'fighting', 75, 1]]],
    pidgeot: ['Pidgeot', 'flying', 83, 80, 75, [['Quick Attack', 'normal', 40, 1], ['Wing Attack', 'flying', 60, 1], ['Gust', 'flying', 40, 1], ['Air Slash', 'flying', 75, 1]]]
  });
  for (const [a, b, l] of [['charmander', 'charmeleon', 14], ['squirtle', 'wartortle', 14], ['bulbasaur', 'ivysaur', 14], ['machop', 'machoke', 16], ['pidgeotto', 'pidgeot', 18]]) D[a][6] = [b, l];
  Object.assign(TT.TYPE_COL, { ice: 0x7ad0e8 });
  SE.ice = ['grass', 'flying', 'dragon']; NV.ice = ['fire', 'water', 'ice', 'steel']; SE.fire.push('ice'); SE.rock.push('ice'); SE.fighting.push('ice');
  Object.assign(D, {
    vulpix: ['Vulpix', 'fire', 38, 58, 40, [['Ember', 'fire', 45, 1], ['Quick Attack', 'normal', 40, 1], ['Flame Wheel', 'fire', 65, 9], ['Flamethrower', 'fire', 85, 20]]],
    onix: ['Onix', 'rock', 40, 55, 120, [['Rock Throw', 'rock', 50, 1], ['Tackle', 'normal', 40, 1], ['Rock Slide', 'rock', 70, 12]]],
    mewtwo: ['Mewtwo', 'psychic', 106, 128, 90, [['Psychic', 'psychic', 85, 1], ['Shadow Ball', 'ghost', 75, 1]]],
    articuno: ['Articuno', 'ice', 90, 92, 100, [['Ice Beam', 'ice', 80, 1], ['Gust', 'flying', 45, 1], ['Blizzard', 'ice', 95, 1]]],
    zapdos: ['Zapdos', 'electric', 90, 106, 85, [['Thunderbolt', 'electric', 85, 1], ['Drill Peck', 'flying', 75, 1], ['Thunder', 'electric', 95, 1]]],
    moltres: ['Moltres', 'fire', 90, 106, 90, [['Flamethrower', 'fire', 85, 1], ['Air Slash', 'flying', 75, 1], ['Fire Blast', 'fire', 95, 1]]],
    shenron: ['Shenron', 'dragon', 122, 122, 100, [['Dragon Breath', 'dragon', 75, 1], ['Thunder', 'electric', 80, 1]]]
  });
  // the Dragon can teach a partner one super move of its own type (a wish)
  TT.SUPER = { electric: 'Volt Tackle', grass: 'Frenzy Plant', fire: 'Blast Burn', water: 'Hydro Cannon', normal: 'Giga Impact', flying: 'Sky Attack', psychic: 'Psycho Boost', fighting: 'Close Combat', rock: 'Rock Wrecker', dragon: 'Draco Meteor', ghost: 'Shadow Force', dark: 'Night Daze', bug: 'Megahorn', steel: 'Meteor Mash', ice: 'Sheer Cold' };
  // boss attacks: [name, type, power, look]
  TT.BOSS_SIG = { snorlax: ['Giga Body Slam', 'normal', 85, 'slam'], mecha: ['Mecha Laser', 'steel', 85, 'beam'], rayquaza: ['Dragon Ascent', 'dragon', 90, 'beam'], mewtwo: ['Psystrike', 'psychic', 92, 'beam'], shenron: ['Dragon Wrath', 'dragon', 95, 'beam'] };

  B.poliwag = () => crit({ c: 0x4a6ad8, b: [0.27, 0.25, 0.25], by: 0.32, hy: 0.5, hz: 0.04, hr: 0.25, hs: [0.25, 0.2, 0.23], legs: 2, legX: 0.55, foot: [0.08, 0.04, 0.1], eyeS: 'big', eye: BK, er: 0.2, ex: 0.1, ey: 0.06, ez: 0.19, eyeTurn: 0.3,
    x: (g, h, body, f, ud) => { P(body, 'sph', 0xf4f6fa, [0, 0.3, 0.2], [0.2, 0.19, 0.08]); for (const [r, y] of [[0.14, 0.3], [0.09, 0.31], [0.04, 0.32]]) P(body, TT.G.thinTorus, BK, [0.005, y, 0.27], [r, r, 0.4]); P(f, 'sph', 0xf08aa0, [0, -0.1, 0.2], [0.07, 0.035, 0.03]); P(ud.tail, 'sph', 0xf0f4ff, [0, 0.12, -0.18], [0.02, 0.2, 0.26], [0.4, 0, 0]); } });
  B.poliwhirl = () => crit({ c: 0x3a5ac8, b: [0.3, 0.3, 0.28], by: 0.46, hy: 0.74, hz: 0.04, hr: 0.25, hs: [0.25, 0.2, 0.23], legs: 2, legLen: 1, legX: 0.5, arms: 1, eyeS: 'big', eye: BK, er: 0.2, ex: 0.1, ey: 0.06, ez: 0.19, eyeTurn: 0.3, scale: 1.1,
    x: (g, h, body, f, ud) => { P(body, 'sph', 0xf4f6fa, [0, 0.44, 0.23], [0.22, 0.22, 0.08]); for (const [r, y] of [[0.16, 0.44], [0.1, 0.45], [0.045, 0.46]]) P(body, TT.G.thinTorus, BK, [0.005, y, 0.3], [r, r, 0.4]); for (const a of ud.arms) P(a, 'sph', 0xf4f6fa, [a.userData.s * 0.05, -0.18, 0.06], 0.08); } });
  B.magikarp = () => crit({ c: 0xf0642a, belly: 0xf5d8a0, b: [0.12, 0.27, 0.31], by: 0.36, hy: 0.4, hz: 0.2, hr: 0.19, hs: [0.12, 0.2, 0.17], kind: 'hop', eyeS: 'tiny', er: 0.36, ex: 0.11, ey: 0.03, ez: 0.07, eyeTurn: 1.3,
    x: (g, h, body, f, ud) => { P(h, 'sph', 0xf8e8c8, [0, -0.09, 0.15], [0.07, 0.04, 0.04]); for (const s of [1, -1]) P(h, TT.capsule(0.012, 0.3), 0xf2d060, [s * 0.06, -0.14, 0.12], null, [0.6, 0, s * 0.5]);
      for (let i = 0; i < 3; i++) P(body, 'cone', 0xf8f0d0, [0, 0.62 - i * 0.02, 0.1 - i * 0.12], [0.03, 0.18, 0.08], [-0.3, 0, 0]); for (const s of [1, -1]) P(body, 'cone', 0xf8f0d0, [s * 0.13, 0.28, 0.08], [0.06, 0.16, 0.03], [0.8, 0, s * 1.2]);
      for (const s of [1, -1]) P(ud.tail, 'cone', 0xf8f0d0, [0, s * 0.14, -0.12], [0.03, 0.26, 0.12], [s > 0 ? -0.9 : -2.2, 0, 0]); } });
  B.geodude = () => crit({ c: 0x9a9488, b: [0.06, 0.06, 0.06], by: 0.5, hy: 0.5, hz: 0, hr: 0.3, hs: [0.3, 0.27, 0.28], float: 0.25, kind: 'float', eyeS: 'dot', er: 0.14, ex: 0.12, ey: 0.04, ez: 0.25, eyeTurn: 0.3,
    x: (g, h, body, f, ud) => { for (const q of [[0.15, 0.15, 0.1], [-0.18, 0.08, 0.12], [0.05, -0.18, 0.14], [-0.1, 0.2, -0.1], [0.2, -0.05, -0.1]]) P(h, 'rock', 0x8a847a, q, 0.07);
      for (const s of [1, -1]) { P(f, 'box', 0x3a3430, [s * 0.12, 0.13, 0.25], [0.12, 0.025, 0.02], [0, 0, s * 0.35]); const a = grp(body, s * 0.3, 0.55, 0.05); a.userData.s = s; P(a, 'sph', 0x9a9488, [s * 0.12, 0, 0.02], [0.15, 0.08, 0.08]); P(a, 'sph', 0x9a9488, [s * 0.22, 0.08, 0.1], [0.12, 0.12, 0.11]); ud.arms.push(a); }
      P(f, 'box', 0x3a3430, [0, -0.1, 0.27], [0.12, 0.015, 0.01]); } });
  // Ponyta: a slender cream horse with grey hooves, and flames for its mane and tail.
  B.ponyta = () => { const C = 0xf8ecc8, HOOF = 0x8a8a94; return crit({ c: C, noBody: 1, b: [0.19, 0.2, 0.34], by: 0.58, hy: 0.99, hz: 0.5, hr: 0.16, hs: [0.15, 0.16, 0.2], snout: 1, snoutC: C, legs: 4, legT: 0.05, legC: HOOF, ear: 'cat', earY: 0.7, eyeS: 'big', eye: 0x8a2a5a, er: 0.2, ex: 0.08, ey: 0.03, ez: 0.15, eyeTurn: 0.6, tailY: 1.08,
    x: (g, h, body, f, ud) => {
      TB(body, RG(C, [[-0.37, 0.07, 0.08], [-0.29, 0.175, 0.18], [-0.1, 0.205, 0.215], [0.1, 0.205, 0.215], [0.27, 0.18, 0.195], [0.36, 0.11, 0.12]]), 10, [0, 0.58, 0], [Math.PI / 2, 0, 0]);
      TB(body, RG(C, [[-0.08, 0.14, 0.16], [0.08, 0.115, 0.13], [0.24, 0.095, 0.105], [0.36, 0.085, 0.095]]), 8, [0, 0.66, 0.26], [0.75, 0, 0]);                 // the neck
      for (let i = 0; i < 6; i++) P(body, 'cone', TT.glow(i % 2 ? 0xffd040 : 0xff7a1a), [0, 1.0 - i * 0.045, 0.36 - i * 0.075], [0.085, 0.3 + (i % 2) * 0.06, 0.07], [-0.75, 0, 0]);       // a mane of flames
      P(h, 'cone', TT.glow(0xffb020), [0, 0.2, 0.0], [0.06, 0.24, 0.06], [-0.4, 0, 0]);
      const fl = ud.flame = grp(ud.tail, 0, 0, -0.04); fl.rotation.x = -2.0;
      P(fl, 'cone', TT.glow(0xff7a1a), [0, 0.24, 0], [0.13, 0.52, 0.13]); P(fl, 'cone', TT.glow(0xffd040), [0, 0.16, 0], [0.075, 0.32, 0.075]);
      for (const s of [1, -1]) P(fl, 'cone', TT.glow(0xff9a2a), [s * 0.07, 0.14, 0], [0.07, 0.3, 0.07], [0, 0, -s * 0.5]);
    } }); };
  // Abra: a golden fox-like Pokémon that hovers with its eyes shut; brown shoulder plates and chest band, wide ears and a thick banded tail.
  B.abra = () => { const Y = 0xf2c230, BR = 0x8a5a2a; return crit({ c: Y, noBody: 1, b: [0.2, 0.24, 0.18], by: 0.4, hy: 0.84, hz: 0.04, hr: 0.21, hs: [0.215, 0.185, 0.2], snout: 1, legs: 2, legT: 0.055, legX: 0.55, foot: [0.075, 0.045, 0.14], arms: 1, armT: [0.24, 0.04], eyeS: 'none', float: 0.18, kind: 'float', tailY: 0.6,
    x: (g, h, body, f, ud) => {
      TB(body, RG(Y, [[0.2, 0.1, 0.09], [0.3, 0.172, 0.152], [0.44, 0.185, 0.16], [0.56, 0.16, 0.14], [0.67, 0.1, 0.095]]), 10);
      BAND(body, 0.46, 0.6, [0.19, 0.165], BR, 3.15, Math.PI / 2);
      TB(ud.tail, [[0, 0.07, 0.07, Y], [0.14, 0.075, 0.075, Y, 0, 0, 0.01], [0.26, 0.068, 0.068, Y, 0, 0, 0.04], [0.262, 0.07, 0.07, BR, 0, 0, 0.04], [0.33, 0.062, 0.062, BR, 0, 0, 0.07], [0.332, 0.06, 0.06, Y, 0, 0, 0.07], [0.42, 0.04, 0.04, Y, 0, 0, 0.13], [0.47, 0.012, 0.012, Y, 0, 0, 0.17]], 8, null, [-1.2, 0, 0]);
      for (const s of [1, -1]) {
        P(body, 'sph', BR, [s * 0.18, 0.6, 0], [0.095, 0.065, 0.095]);
        tEar(h, ud, s, 0.13, 0.1, 0.8, 0.27, 0.1, Y, 0xd8a020);
        P(f, 'box', 0x3a2a1a, [s * 0.08, 0.03, 0.19], [0.08, 0.014, 0.01], [0, s * 0.4, s * 0.15]);
        for (const dx of [-0.03, 0, 0.03]) P(ud.legs[s > 0 ? 0 : 1], 'cone', Y, [dx, -0.24, 0.17], [0.014, 0.05, 0.014], [1.57, 0, 0]);
      }
    } }); };
  B.snorlax = () => crit({ c: 0x2a5a6a, belly: 0xf2e2c0, b: [0.72, 0.78, 0.6], by: 0.82, hy: 1.72, hz: 0.1, hr: 0.46, hs: [0.48, 0.4, 0.42], legs: 2, legX: 0.55, foot: [0.24, 0.12, 0.3], legC: 0xf2e2c0, arms: 1, ear: 'cat', earX: 0.62, earY: 0.6, eyeS: 'none', kind: 'biped',
    x: (g, h, body, f, ud) => { P(h, 'sph', 0xf2e2c0, [0, -0.08, 0.2], [0.36, 0.28, 0.25]); for (const s of [1, -1]) P(f, 'box', 0x1c2a30, [s * 0.15, 0.04, 0.44], [0.14, 0.02, 0.02], [0, 0, s * 0.1]);
      P(f, 'box', 0x6a3a3a, [0, -0.16, 0.44], [0.2, 0.025, 0.02]); for (const s of [1, -1]) P(f, 'cone', WH, [s * 0.07, -0.13, 0.44], [0.025, 0.05, 0.02]); for (const a of ud.arms) a.scale.setScalar(2.6); } });
  B.mecha = () => crit({ c: 0xb4bcc8, b: [0.62, 0.66, 0.5], by: 1.25, hy: 2.25, hz: 0.06, hr: 0.5, hs: [0.55, 0.45, 0.46], hc: 0xf5e6b8, legs: 2, legLen: 1, legX: 0.55, legC: 0x5a6070, shinC: 0x8a92a0, foot: [0.24, 0.14, 0.36], arms: 1, armC: 0x8a92a0, ear: 'cat', earC: 0x2a2a30, earIn: 0xf0a0b8, earX: 0.66, earY: 0.5, eyeS: 'big', eye: 0xe01818, er: 0.2, ex: 0.2, ey: 0.03, ez: 0.4, eyeTurn: 0.35, kind: 'biped',
    x: (g, h, body, f, ud) => {
      P(f, 'sph', TT.glow(0xffd23c), [0, 0.38, 0.32], [0.09, 0.14, 0.04], [-0.4, 0, 0]);
      for (const s of [1, -1]) for (const a of [0.15, -0.15]) P(f, 'box', 0x2a2a30, [s * 0.62, -0.08 + a * 0.3, 0.2], [0.42, 0.02, 0.02], [0, 0, s * a]);
      P(body, 'cyl', 0xf4f4f4, [0, 1.35, 0.46], [0.3, 0.06, 0.3], [1.57, 0, 0]);
      for (const q of [[-0.08, 1.35, 0.06, 0.34, 0], [0.02, 1.47, 0.18, 0.06, 0], [0.1, 1.41, 0.06, 0.13, 0], [0.02, 1.35, 0.18, 0.06, 0], [0.07, 1.24, 0.06, 0.2, 0.5]]) P(body, 'box', 0xe01818, [q[0], q[1], 0.5], [q[2], q[3], 0.03], [0, 0, q[4]]);
      for (const a of ud.arms) { a.scale.setScalar(3.2); const s = a.userData.s; for (const q of [-0.04, 0, 0.04]) P(a, 'cone', 0x5a6070, [s * 0.05 + q, -0.21, 0.07], [0.012, 0.05, 0.012], [Math.PI, 0, 0]); }
      P(body, 'cyl', 0x5a6070, [0, 1.98, 0], [0.18, 0.2, 0.18]); P(body, 'box', 0x5a6070, [0, 1.75, -0.45], [0.5, 0.6, 0.25]);
      for (const s of [1, -1]) P(body, 'cone', TT.glow(0xff8a20), [s * 0.15, 1.35, -0.6], [0.08, 0.25, 0.08], [Math.PI, 0, 0]);
    } });
  B.charmeleon = () => lizard({ c: 0xe24a32, k: 1.18, neck: 0.02, hr: 0.23, hs: [0.222, 0.208, 0.262], eyeS: 'slit', eye: 0x2a6a9a, fl: 1.35,
    x: (h, f, body, ud) => { P(h, 'cone', 0xe24a32, [0, 0.13, -0.2], [0.075, 0.3, 0.075], [-2.15, 0, 0]); P(f, 'box', 0x7a2a1a, [0, -0.13, 0.24], [0.1, 0.012, 0.012]); for (const s of [1, -1]) { P(f, 'cone', WH, [s * 0.04, -0.15, 0.25], [0.012, 0.03, 0.012], [Math.PI, 0, 0]); for (const dx of [-0.025, 0.025]) P(ud.arms.find(q => q.userData.s === s), 'cone', WH, [s * 0.085 + dx, -0.215, 0.125], [0.012, 0.04, 0.012], [2.2, 0, 0]); } } });
  B.wartortle = () => turtle({ c: 0x8f9fe0, k: 1.16, eye: 0x5a2a6a,
    x: (h, f, body, ud) => { curlTail(ud.tail, 0xf4f6fa, 8, 0.17, 0.105, 0xc8d8f8); for (const s of [1, -1]) { for (let i = 0; i < 3; i++) P(h, 'cone', i === 1 ? 0xf4f6fa : 0xc8d8f8, [s * 0.22, 0.1 + i * 0.03, -0.04], [0.055, 0.28 - i * 0.04, 0.03], [0.2, 0, -s * (1.3 - i * 0.4)]); P(f, 'cone', WH, [s * 0.045, -0.125, 0.215], [0.012, 0.03, 0.012], [Math.PI, 0, 0]); } } });
  B.ivysaur = () => bulb({ c: 0x6ab8c8, k: 1.18, spot: 0x4a90a8, mouth: 0x2a5a6a,
    x: (h, f, body) => {
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 0.785; P(body, 'sph', 0x3a984a, [Math.sin(a) * 0.25, 0.585, -0.08 + Math.cos(a) * 0.25], [0.15, 0.04, 0.27], turnTip(a, 0.3)); P(body, 'box', 0x2a7a3a, [Math.sin(a) * 0.25, 0.612, -0.08 + Math.cos(a) * 0.25], [0.014, 0.014, 0.44], turnTip(a, 0.3)); }      // four big leaves
      TB(body, RG(0xf06a9a, [[0, 0.09], [0.07, 0.165], [0.18, 0.175], [0.28, 0.11], [0.35, 0.02]]), 8, [0, 0.58, -0.08]);                                                           // the pink bud
      for (const s of [1, -1]) P(f, 'cone', WH, [s * 0.07, -0.135, 0.225], [0.012, 0.03, 0.012], [Math.PI, 0, 0]);
    } });
  B.machoke = () => fighter({ c: 0x8a8ab0, k: 1.28, trunk: 0x2a2a30, arm: [0.4, 0.085], ridge: 0x6a6a90, mouth: 0x5a5a7a,
    x: (h, f, body) => { P(body, 'box', 0xf2c230, [0, 0.47, 0.2], [0.11, 0.06, 0.03]); BAND(body, 0.445, 0.5, [0.262, 0.204], 0xf2c230, 3.1, Math.PI / 2); P(h, 'sph', 0x8a8ab0, [0, -0.06, 0.15], [0.1, 0.07, 0.09]); } });
  B.pidgeot = () => bird({ c: 0xc8a060, sc: 1.75, wing: 0x8a6030, tail: 0xe84a2a, tail2: 0xe84a2a, x: h => { for (const a of [-0.3, 0, 0.3]) TB(h, RG(a ? 0xe84a2a : 0xf2c040, [[0, 0.03, 0.02], [0.12, 0.055, 0.024], [0.4, 0.04, 0.02], [0.62, 0.006, 0.006]]), 6, [a * 0.13, 0.15, -0.02], [-1.3 - Math.abs(a) * 0.4, 0, -a * 0.45]); } });
  // serpents: a chain of segments laid along path(k), k = 0 (head) .. 1 (tail); they ripple when animated
  // One length of a long body between two joints. Each joint has one ring; neighbouring lengths share their rings exactly, so the body bends without gaps.
  // A and B are { p: [x, y, z], u, v, t (THREE.Vector3), r }. arc = [from, to] makes a strip (the pale underside) instead of a full tube.
  function skinPiece(A, B, col, arc, grow, capA, capB) {
    const m = arc ? 4 : 10, per = arc ? m + 1 : m, pos = [], nor = [], vc = [], w2 = [], idx = [], c = new THREE.Color(col);
    [A, B].forEach((R, ri) => { for (let j = 0; j < per; j++) { const a = arc ? arc[0] + (arc[1] - arc[0]) * j / m : j / m * 6.2832, cx = Math.cos(a), sx = Math.sin(a), nx = R.u.x * cx + R.v.x * sx, ny = R.u.y * cx + R.v.y * sx, nz = R.u.z * cx + R.v.z * sx, r = R.r * grow; pos.push(R.p[0] + nx * r, R.p[1] + ny * r, R.p[2] + nz * r); nor.push(nx, ny, nz); vc.push(c.r, c.g, c.b); w2.push(ri); } });
    for (let j = 0; j < m; j++) { const a = j, b = arc ? j + 1 : (j + 1) % m, c2 = a + per, d = b + per; idx.push(a, c2, b, b, c2, d); }
    if (!arc) for (const [R, ri, sg] of [[A, 0, -1], [B, 1, 1]]) { if (!(ri ? capB : capA)) continue; const k = pos.length / 3; pos.push(R.p[0] + R.t.x * sg * R.r * 0.7, R.p[1] + R.t.y * sg * R.r * 0.7, R.p[2] + R.t.z * sg * R.r * 0.7); nor.push(R.t.x * sg, R.t.y * sg, R.t.z * sg); vc.push(c.r, c.g, c.b); w2.push(ri); for (let j = 0; j < m; j++) { const a = ri * per + j, b = ri * per + (j + 1) % m; if (ri) idx.push(k, b, a); else idx.push(k, a, b); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('vc', new THREE.Float32BufferAttribute(vc, 3)); g.setAttribute('w2', new THREE.Float32BufferAttribute(w2, 1)); g.setIndex(idx);
    return g;
  }
  function serpent(o) {
    const g = new THREE.Group(), ud = g.userData = { legs: [], ears: [], arms: [], kind: 'serpent', float: o.float || 0, segs: [], path: [], wv: o.wave || [0.15, 0.06] };
    const body = ud.body = grp(g), n = o.n;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), r = o.r0 * (1 - k * (o.taper == null ? 0.7 : o.taper)), q = o.path(k), sg = grp(body, q[0], q[1], q[2]);
      ud.path.push(q); sg.userData.r = r;
      if (o.balls) { P(sg, 'sph', o.c, [0, 0, 0], [r, r, r * 1.25]); if (o.belly != null) P(sg, 'sph', o.belly, o.bellyUp ? [0, 0, r * 0.32] : [0, -r * 0.32, 0], o.bellyUp ? [r * 0.8, r * 0.95, r * 0.8] : [r * 0.82, r * 0.78, r * 1.12]); }
      if (o.seg) o.seg(sg, i, r, k);
      ud.segs.push(sg);
    }
    if (!o.balls) {            // one smooth skin over all the joints
      const V = THREE.Vector3, bd = o.bellyUp ? new V(0, 0, 1) : new V(0, -1, 0), fr = [];
      for (let i = 0; i < n; i++) { const a = ud.path[Math.max(0, i - 1)], b = ud.path[Math.min(n - 1, i + 1)], t = new V(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), v = bd.clone().addScaledVector(t, -bd.dot(t)); if (v.length() < 0.2 && i) v.copy(fr[i - 1].v).addScaledVector(t, -fr[i - 1].v.dot(t)); v.normalize(); fr.push({ t, v, u: new V().crossVectors(t, v), r: ud.segs[i].userData.r }); }
      for (let i = 0; i < n - 1; i++) { const q = ud.path[i], q2 = ud.path[i + 1], A = Object.assign({ p: [0, 0, 0] }, fr[i]), Bn = Object.assign({ p: [q2[0] - q[0], q2[1] - q[1], q2[2] - q[2]] }, fr[i + 1]);
        P(ud.segs[i], skinPiece(A, Bn, o.c, null, 1, i === 0, i === n - 2), WH).userData.bone2 = ud.segs[i + 1];
        if (o.belly != null) P(ud.segs[i], skinPiece(A, Bn, o.belly, [0.55, 2.59], 1.03), WH).userData.bone2 = ud.segs[i + 1]; }
    }
    const hr = o.hr, head = ud.head = grp(ud.segs[0], 0, o.hy || 0, o.hz == null ? hr * 0.6 : o.hz);
    P(head, 'sph', o.hc != null ? o.hc : o.c, [0, 0, 0], o.hs || [hr, hr * 0.85, hr * 1.1]);
    if (o.eyeS !== 'none') ud.eyes = mkEyes(head, o, hr);
    const face = grp(head, 0, 0, 0, 1);
    if (o.x) o.x(g, head, body, face, ud);
    ud.ols = []; TT.bakeRig(g, ud.ols);
    if (o.scale) g.scale.setScalar(o.scale);
    ud.h = (o.top || 1) * (o.scale || 1) + (o.float || 0);
    return g;
  }
  B.dratini = () => serpent({ c: 0x8ab8f0, belly: 0xf4f6fa, n: 9, r0: 0.13, taper: 0.6, hr: 0.15, hs: [0.14, 0.13, 0.18], top: 0.6, path: k => [Math.sin(k * 6.28) * 0.18, 0.12 + 0.36 * Math.pow(1 - k, 4), 0.2 - k * 1.1], eyeS: 'big', eye: 0x6a3aa0, er: 0.22, ex: 0.07, ey: 0.03, ez: 0.12, eyeTurn: 0.5,
    x: (g, h) => { P(h, 'sph', 0xf4f6fa, [0, -0.04, 0.12], [0.08, 0.06, 0.07]); for (const s of [1, -1]) for (let i = 0; i < 3; i++) P(h, 'cone', 0xf4f6fa, [s * 0.13, 0.04 - i * 0.04, -0.03], [0.03, 0.12, 0.012], [0, 0, -s * (1.2 + i * 0.3)]); } });
  B.dragonair = () => serpent({ c: 0x4a8ae8, belly: 0xf4f6fa, n: 12, r0: 0.15, taper: 0.5, hr: 0.16, hs: [0.15, 0.14, 0.2], float: 0.35, top: 1.2, wave: [0.12, 0.08], path: k => [Math.sin(k * 5) * 0.3, 0.2 + 0.75 * Math.pow(1 - k, 2), 0.25 - k * 1.6], eyeS: 'big', eye: 0x2a2a6a, er: 0.2, ex: 0.08, ey: 0.03, ez: 0.12, eyeTurn: 0.5,
    seg: (sg, i, r) => { if (i === 2 || i >= 10) P(sg, 'sph', 0x6ab0ff, [0, i === 2 ? r * 0.9 : 0, 0], r * 0.55); },
    x: (g, h) => { P(h, 'cone', 0xf4f6fa, [0, 0.18, 0.04], [0.025, 0.14, 0.025]); for (const s of [1, -1]) { P(h, 'cone', 0xf4f6fa, [s * 0.15, 0.06, -0.04], [0.04, 0.2, 0.015], [0.2, 0, -s * 1.1]); P(h, 'cone', 0xf4f6fa, [s * 0.15, 0.0, -0.08], [0.03, 0.14, 0.012], [0.3, 0, -s * 1.5]); } } });
  B.gyarados = () => serpent({ c: 0x3a7ad8, belly: 0xf2e6a8, bellyUp: 1, n: 11, r0: 0.4, taper: 0.65, hr: 0.38, hs: [0.36, 0.3, 0.46], hz: 0.25, hy: 0.06, top: 2.7, wave: [0.12, 0.04], path: k => [Math.sin(k * 5) * 0.3, 0.35 + 2.0 * Math.pow(1 - k, 1.4), 0.3 - k * 1.4], eyeS: 'slit', er: 0.16, ex: 0.18, ey: 0.12, ez: 0.3, eyeTurn: 0.7,
    seg: (sg, i, r) => { if (i > 0 && i < 9) P(sg, 'cone', 0x2a5aa8, [0, r * 0.95, -r * 0.3], [r * 0.25, r * 0.7, r * 0.1], [-0.6, 0, 0]); if (i === 10) for (const s of [1, -1]) P(sg, 'cone', 0x2a5aa8, [s * 0.15, 0, -0.15], [0.12, 0.35, 0.04], [-1.2, 0, s * 0.6]); },
    x: (g, h, body, f) => { P(h, 'sph', 0xf2e6a8, [0, -0.17, 0.18], [0.3, 0.1, 0.28]); for (let i = -2; i <= 2; i++) P(f, 'cone', WH, [i * 0.07, -0.08, 0.38], [0.025, 0.08, 0.025], [Math.PI, 0, 0]);
      for (const s of [1, -1]) { P(h, TT.capsule(0.02, 0.5), 0xf2e6a8, [s * 0.22, -0.12, 0.3], null, [1.1, 0, s * 0.6]); P(h, 'cone', 0xf4f6fa, [s * 0.3, 0.1, -0.12], [0.08, 0.3, 0.03], [0, 0, -s * 1.3]); }
      for (let i = 0; i < 3; i++) P(h, 'cone', i === 1 ? 0xf4f6fa : 0x2a5aa8, [0, 0.28 + (i === 1 ? 0.05 : 0), -0.08 - i * 0.07], [0.04, 0.3, 0.1], [-0.5, 0, 0]); } });
  B.rayquaza = () => serpent({ c: 0x2a9a58, n: 16, r0: 0.26, taper: 0.55, hr: 0.26, hs: [0.22, 0.2, 0.38], float: 1.0, top: 1.4, scale: 1.25, wave: [0.25, 0.12], path: k => [Math.sin(k * 7) * 0.55, 0.6 * Math.sin(k * 4) + 0.5 * (1 - k), 0.6 - k * 3.4], eyeS: 'big', eye: 0xf2c230, er: 0.18, ex: 0.12, ey: 0.06, ez: 0.2, eyeTurn: 0.7,
    seg: (sg, i, r) => { if (i % 2 === 1) P(sg, TT.G.torus, 0xf2c230, [0, 0, 0], [r * 0.95, r * 0.95, 0.6]); if (i === 3 || i === 9) for (const s of [1, -1]) P(sg, 'cone', 0x1e7a44, [s * r * 1.1, 0, 0], [0.06, 0.45, 0.025], [0, 0, -s * 1.2]); },
    x: (g, h, body, f) => { P(h, 'sph', 0xf2c230, [0, -0.1, 0.26], [0.13, 0.06, 0.12]); for (const s of [1, -1]) { P(h, 'cone', 0x2a9a58, [s * 0.12, 0.12, -0.32], [0.05, 0.55, 0.05], [-1.9, 0, s * 0.35]); P(h, 'cone', 0xf2c230, [s * 0.16, 0.16, -0.62], [0.035, 0.14, 0.035], [-1.9, 0, s * 0.35]); P(h, 'cone', 0x2a9a58, [s * 0.17, 0.02, -0.1], [0.04, 0.3, 0.02], [-1.2, 0, s * 1.2]); } } });

  // ---------- the Volcano and the Dragon's Lair ----------
  // Vulpix: a red-brown fox with a cream underside, curls of orange hair on its head and six curled orange tails.
  B.vulpix = () => { const RB = 0xc8683a, CR = 0xf5e6b8, TL = 0xe8a04a, TIP = 0xf2c860, DK = 0x8a4020; return crit({ c: RB, noBody: 1, b: [0.18, 0.18, 0.27], by: 0.3, hy: 0.57, hz: 0.25, hr: 0.21, hs: [0.225, 0.195, 0.205], snout: 1, legs: 4, legT: 0.045, legC: DK, eyeS: 'big', eye: 0x7a4a20, er: 0.18, ex: 0.09, ey: 0.03, ez: 0.18, eyeTurn: 0.3, tailY: 1.05,
    x: (g, h, body, f, ud) => {
      QB(body, RB, 0.3, 0.95, CR);
      for (let i = 0; i < 6; i++) { const a = (i - 2.5) * 0.38; TB(ud.tail, [[0, 0.035, 0.035, TL], [0.12, 0.062, 0.058, TL, 0, 0, 0.005], [0.25, 0.072, 0.066, TL, 0, 0, 0.02], [0.33, 0.06, 0.056, TL, 0, 0, 0.05], [0.332, 0.06, 0.056, TIP, 0, 0, 0.05], [0.39, 0.04, 0.04, TIP, 0, 0, 0.1], [0.41, 0.015, 0.015, TIP, 0, 0, 0.15]], 7, [a * 0.08, i % 2 ? 0.02 : -0.02, 0], [-0.75 - Math.abs(a) * 0.12, 0, -a]); }
      for (const q of [-0.06, 0.01, 0.08]) { P(h, 'sph', TL, [q, 0.19, 0.06], [0.055, 0.075, 0.075]); P(h, 'sph', TIP, [q, 0.21, 0.12], 0.035); }
      for (const s of [1, -1]) tEar(h, ud, s, 0.13, 0.11, 0.45, 0.26, 0.08, RB, DK);
      P(f, 'sph', 0x3a2a22, [0, -0.045, 0.21], 0.017);
    } }); };
  B.onix = () => serpent({ c: 0x8a8a96, balls: 1, n: 10, r0: 0.36, taper: 0.5, hr: 0.38, hs: [0.36, 0.36, 0.42], hz: 0.2, hy: 0.05, top: 2.6, wave: [0.08, 0.03], path: k => [Math.sin(k * 4.5) * 0.35, 0.3 + 2.1 * Math.pow(1 - k, 1.5), 0.3 - k * 1.5], eyeS: 'slit', er: 0.15, ex: 0.17, ey: 0.1, ez: 0.3, eyeTurn: 0.7,
    seg: (sg, i, r) => { if (i % 2) P(sg, 'rock', 0x74747e, [r * 0.5, r * 0.4, 0], r * 0.5, [i, i * 2, 0]); },
    x: (g, h) => { P(h, 'cone', 0x74747e, [0, 0.42, -0.05], [0.09, 0.4, 0.09], [-0.25, 0, 0]); P(h, 'sph', 0x9a9aa6, [0, -0.14, 0.2], [0.26, 0.1, 0.24]); } });
  // Mewtwo: tall and lean, pale grey with a purple belly and a long heavy purple tail; two blunt horns and a tube from the back of its head to its spine.
  B.mewtwo = () => { const G = 0xe4dcec, PU = 0xa886c8; return crit({ c: G, noBody: 1, b: [0.2, 0.3, 0.17], by: 0.58, hy: 1.16, hz: 0.04, hr: 0.2, hs: [0.19, 0.2, 0.22], legs: 2, legT: 0.065, legX: 0.6, foot: [0.075, 0.045, 0.18], arms: 1, armT: [0.4, 0.038], eyeS: 'slit', eye: 0x8a4ac8, er: 0.16, float: 0.25, kind: 'float', scale: 1.1, tailY: 0.62,
    x: (g, h, body, f, ud) => {
      const R = RG(G, [[0.3, 0.12, 0.11], [0.4, 0.185, 0.16], [0.52, 0.172, 0.15], [0.64, 0.12, 0.105], [0.78, 0.178, 0.135], [0.9, 0.2, 0.142], [1.0, 0.11, 0.09]]);
      TB(body, R, 11); SHELL(body, R.slice(0, 4), PU, 1.15, Math.PI / 2, 1.03, 8);
      TB(ud.tail, RG(PU, [[0, 0.085], [0.2, 0.085, 0.085, 0, 0.02], [0.42, 0.072, 0.072, 0, 0.09], [0.62, 0.062, 0.062, 0, 0.22], [0.76, 0.075, 0.075, 0, 0.38], [0.84, 0.04, 0.04, 0, 0.5]]), 8, null, [-1.3, 0, 0]);
      TB(body, RG(G, [[0, 0.042], [0.34, 0.042]]), 6, [0, 0.86, -0.12], [0.55, 0, 0]);
      for (const pv of ud.legs) P(pv, 'sph', G, [0, -0.06, 0.01], [0.105, 0.17, 0.125]);                                              // strong thighs
      for (const pv of ud.arms) { const s = pv.userData.s; pv.position.set(s * 0.215, 0.9, 0.0); P(body, 'sph', G, [s * 0.2, 0.91, 0], 0.075); for (const dx of [-0.035, 0, 0.035]) P(pv, 'sph', G, [s * 0.14 + dx, -0.36, 0.2], 0.032); }      // three round fingers
      for (const s of [1, -1]) P(h, 'cone', G, [s * 0.1, 0.2, -0.02], [0.055, 0.15, 0.055], [0, 0, -s * 0.25]);
    } }); };
  // The three legendary birds: a leaning body and neck in one piece, great layered wings that beat slowly, and each one's own crest and tail.
  function legendBird(o) {
    const C = o.c;
    return crit({ c: C, noBody: 1, b: [0.22, 0.3, 0.24], by: 0.62, hy: 1.2, hz: 0.2, hr: 0.165, hs: [0.158, 0.152, 0.188], float: 0.4, kind: 'float', eyeS: 'slit', eye: o.eye, er: 0.21, ex: 0.082, ey: 0.03, ez: 0.15, eyeTurn: 0.55, scale: 1.3,
      x: (g, h, body, f, ud) => {
        TB(body, [[0.3, 0.07, 0.08, C, 0, 0, -0.1], [0.42, 0.2, 0.22, C, 0, 0, -0.06], [0.6, 0.235, 0.25, C], [0.78, 0.2, 0.21, C, 0, 0, 0.06], [0.92, 0.12, 0.125, C, 0, 0, 0.13], [1.06, 0.085, 0.09, C, 0, 0, 0.19], [1.16, 0.08, 0.085, C, 0, 0, 0.2]], 10);
        P(body, 'sph', o.belly, [0, 0.6, 0.12], [0.17, 0.2, 0.14]);
        for (const s of [1, -1]) P(body, 'sph', o.leg, [s * 0.09, 0.3, 0.03], [0.045, 0.07, 0.065]);                               // feet tucked up while it hovers
        P(h, 'cone', o.beak, [0, -0.03, 0.2 + o.beakL / 2], [0.04, o.beakL, 0.034], [1.57, 0, 0]);
        ud.slowWings = 1; ud.wings = [];
        for (const s of [1, -1]) {
          const w = grp(body, s * 0.2, 0.86, -0.02); w.userData.s = s; ud.wings.push(w);
          P(w, 'sph', C, [s * 0.38, 0.02, 0.02], [0.42, 0.05, 0.17], [0, 0, s * 0.1]);
          for (let i = 0; i < 6; i++) P(w, 'cone', i % 2 ? o.wing2 : C, [s * (0.16 + i * 0.125), -0.02, -0.14 - i * 0.012], [0.075, 0.3 + i * 0.035, 0.018], [-1.72, 0, s * (0.15 + i * 0.13)]);
          if (o.kind === 'fire') for (let i = 0; i < 3; i++) P(w, 'cone', TT.glow(i % 2 ? 0xffe060 : 0xff7a1a), [s * (0.3 + i * 0.2), 0.14, -0.05], [0.07, 0.3, 0.05], [-0.5, 0, s * 0.4]);
        }
        if (o.kind === 'ice') {            // three long head feathers and a ribbon tail that trails behind
          for (const a of [-0.55, 0, 0.55]) P(h, 'cone', o.crest, [a * 0.08, 0.2, -0.03], [0.035, 0.24, 0.018], [-0.3, 0, -a]);
          for (const sx of [-0.07, 0, 0.07]) TB(body, [[0, 0.05, 0.016, o.crest], [-0.45, 0.062, 0.016, o.crest], [-0.95, 0.04, 0.012, o.crest], [-1.3, 0.01, 0.006, o.crest]], 6, [sx, 0.42, -0.2], [1.0 + Math.abs(sx) * 2, 0, sx * 3]);
        } else if (o.kind === 'zap') {     // a crown of sharp spikes, and spiky tail feathers
          for (let i = 0; i < 5; i++) P(h, 'cone', i % 2 ? BK : C, [(i - 2) * 0.05, 0.16, -0.06 - Math.abs(i - 2) * 0.03], [0.03, 0.22, 0.018], [-0.55, 0, -(i - 2) * 0.38]);
          for (let i = 0; i < 5; i++) P(body, 'cone', i % 2 ? BK : C, [(i - 2) * 0.09, 0.34, -0.3], [0.05, 0.5, 0.016], [-2.15, 0, (i - 2) * 0.3]);
        } else {                           // flames for a crest and a tail
          for (let i = 0; i < 3; i++) { P(h, 'cone', TT.glow(i === 1 ? 0xffe060 : 0xff7a1a), [(i - 1) * 0.06, 0.24, -0.05], [0.05, 0.3 + (i === 1 ? 0.1 : 0), 0.04], [-0.3, 0, -(i - 1) * 0.5]); P(body, 'cone', TT.glow(i === 1 ? 0xffe060 : 0xff7a1a), [(i - 1) * 0.1, 0.3, -0.36], [0.07, 0.55 + (i === 1 ? 0.15 : 0), 0.05], [-2.2, 0, (i - 1) * 0.35]); }
        }
      } });
  }
  B.articuno = () => legendBird({ kind: 'ice', c: 0x6fb8f0, belly: 0xdcefff, wing2: 0x4a8fd8, crest: 0x2a5ad0, beak: 0x9a9aa8, beakL: 0.13, leg: 0x8a8a98, eye: 0x9a2a2a });
  B.zapdos = () => legendBird({ kind: 'zap', c: 0xf5cf2a, belly: 0xf8e27a, wing2: 0x23232b, crest: 0xf5cf2a, beak: 0xf0a040, beakL: 0.24, leg: 0xc8903a, eye: 0x23232b });
  B.moltres = () => legendBird({ kind: 'fire', c: 0xf5a030, belly: 0xffd870, wing2: 0xf06a20, crest: 0xff7a1a, beak: 0xb07040, beakL: 0.17, leg: 0xb07040, eye: 0x23232b });
  // the Eternal Dragon: a huge green serpent with antlers, whiskers and red eyes
  B.shenron = () => serpent({ c: 0x3aa84a, belly: 0xf2e6a8, bellyUp: 1, n: 18, r0: 0.34, taper: 0.5, hr: 0.36, hs: [0.3, 0.27, 0.5], float: 0.45, top: 1.7, scale: 1.3, wave: [0.22, 0.1], path: k => [Math.sin(k * 8) * 0.6, 0.85 * Math.pow(1 - k, 1.2) + 0.42 * Math.sin(k * 5), 0.5 - k * 3.6], eyeS: 'slit', eye: 0xe01818, er: 0.17, ex: 0.16, ey: 0.1, ez: 0.3, eyeTurn: 0.7,
    seg: (sg, i, r) => { if (i > 0 && i < 16) P(sg, 'cone', 0x2a7a36, [0, r * 0.95, -r * 0.2], [r * 0.22, r * 0.6, r * 0.1], [-0.6, 0, 0]); if (i === 4 || i === 11) for (const s of [1, -1]) { P(sg, TT.capsule(0.05, 0.3), 0x3aa84a, [s * r * 1.3, -r * 0.3, 0], null, [0, 0, s * 1.2]); P(sg, 'sph', 0xf2e6a8, [s * (r * 1.3 + 0.24), -r * 0.5, 0], 0.07); } },
    x: (g, h, body, f) => { P(h, 'sph', 0x3aa84a, [0, -0.02, 0.34], [0.2, 0.15, 0.24]); P(h, 'sph', 0xf2e6a8, [0, -0.16, 0.26], [0.2, 0.08, 0.26]);
      for (const s of [1, -1]) { P(h, 'cone', 0x8a6a3a, [s * 0.13, 0.3, -0.16], [0.045, 0.5, 0.045], [-0.7, 0, -s * 0.35]); P(h, 'cone', 0x8a6a3a, [s * 0.22, 0.42, -0.3], [0.03, 0.22, 0.03], [-0.2, 0, -s * 0.9]); P(h, TT.capsule(0.014, 0.7), 0x3aa84a, [s * 0.3, -0.1, 0.5], null, [1.2, 0, s * 0.7]); P(h, 'cone', 0x2a7a36, [s * 0.26, 0.05, -0.2], [0.06, 0.3, 0.03], [-1.2, 0, s * 1.2]); P(f, 'cone', WH, [s * 0.1, -0.14, 0.5], [0.022, 0.09, 0.022], [Math.PI, 0, 0]); } } });

  TT.creature = sp => { const g = (B[sp] || B.rattata)(); g.userData.sp = sp; return g; };

  // gait / idle. mv 0..1
  // What a Pokémon does while it waits: one of these at random every few seconds. y: lift; rx/rz: pitch and roll; spin/barrel: a full turn; sy: squash;
  // hy/hx/hz: head turn, nod, tilt; shut: eyes closed; wag: faster tail; arm: arms; leg: a scratching limb.
  const CIDLES = [
    [2.6, q => ({ hy: S2(q) * 0.9 })],                                                                        // 0 look left and right
    [3.0, (q, t) => ({ hx: 0.55, rx: 0.2, hy: Math.sin(t * 5) * 0.25 })],                                     // 1 sniff the ground
    [1.4, (q, t) => ({ rz: Math.sin(t * 30) * 0.16, hz: Math.sin(t * 30 + 1) * 0.22 })],                      // 2 shake like a wet dog
    [1.6, q => ({ spin: q, y: UP(q) * 0.12 })],                                                               // 3 spin round on the spot
    [3.2, q => ({ rx: 0.32 * UP(q), sy: -0.08 * UP(q), hx: -0.4, wag: 2 })],                                  // 4 a long stretch, front low and tail up
    [4.5, (q, t) => ({ shut: 1, hx: 0.3 + Math.sin(t * 1.5) * 0.06, sy: -0.06, hz: 0.12 })],                  // 5 doze off for a moment
    [2.4, (q, t) => ({ leg: Math.sin(t * 22) * 0.5 - 0.9, hz: 0.35, hx: 0.1, rz: 0.06 })],                    // 6 scratch behind an ear
    [2.0, q => { const h = Math.max(0, Math.sin(q * 18.85)); return { y: h * 0.16, sy: (h - 0.3) * 0.1, arm: -1.6, wag: 3 }; }],   // 7 three excited hops
    [2.6, (q, t) => ({ hx: -0.55, hy: Math.sin(t * 1.2) * 0.2 })],                                            // 8 look up at the sky
    [2.2, q => ({ rx: -0.25 * UP(q), y: UP(q) * 0.05, arm: -2.2, hx: -0.2 })],                                // 9 rear up and reach high
    [2.8, (q, t) => ({ hz: Math.sin(t * 3) * 0.3, wag: 3 })],                                                 // 10 tilt the head from side to side, tail going
    [2.6, (q, t) => ({ rx: 0.34, sy: -0.05, hx: -0.3, wag: 4, y: Math.max(0, Math.sin(t * 9)) * 0.03 })],     // 11 a play bow
    [2.0, q => ({ barrel: q })],                                                                              // 12 a barrel roll (flyers)
    [2.6, q => ({ y: -0.22 * UP(q) + 0.3 * UP(Math.max(0, q * 2 - 1)), rx: 0.25 * S2(q) })],                  // 13 dip down and swoop up (flyers)
    // moments shared with the trainer: the game asks for these
    [600, () => ({ arm: -2.5, hx: -0.4, wag: 3 })],                                                           // 14 reach up for a high five
    [600, (q, t) => ({ sy: -0.1, hy: Math.sin(t * 0.6) * 0.5, hx: 0.05, wag: 0.5 })],                         // 15 settle down beside the trainer
    [600, (q, t) => ({ hy: Math.sin(t * 0.9) * 0.4, wag: 2, sy: -0.04 })],                                    // 16 ride on a shoulder
  ];
  const CKIND = { quad: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11], biped: [0, 1, 2, 3, 5, 6, 7, 8, 9, 10], hop: [0, 2, 3, 5, 7, 8, 10], 'float': [0, 2, 3, 5, 8, 10, 12, 13], serpent: [0, 5, 8, 10], crawl: [0, 5, 8, 10] };
  TT.actLists.CIDLES = CIDLES;
  TT.animCreature = (g, t, mv) => {
    const u = g.userData, p = u.ph || (u.ph = Math.random() * 6.28);
    const dtc = TT.clamp(t - (u.lt == null ? t : u.lt), 0, 0.1); u.lt = t;
    u.amp = (u.amp || 0) + ((mv || 0) - (u.amp || 0)) * Math.min(1, dtc * 9);
    const a = u.amp, i = Math.max(0, 1 - a), ph = t * 11 + p, s = Math.sin(ph), Bd = u.body, L = u.legs;
    const wp = u.wp = (u.wp || p) + dtc * (3 + a * 3);            // wing-beat phase, built up over time so a change of speed never makes it jump
    let y = 0, rx = 0, rz = 0, ry = 0, sy = 1 + Math.sin(t * 2.2 + p) * 0.02 * i;
    // Walking: each foot lifts as it swings forward and reaches down as it pushes back; the body bounces, rocks and twists with the steps.
    if (u.kind === 'quad') {
      for (let k = 0; k < L.length; k++) { const q = ph + (k === 0 || k === 3 ? 0 : Math.PI); L[k].rotation.x = Math.sin(q) * 0.85 * a; L[k].scale.y = 1 - Math.max(0, -Math.cos(q)) * 0.26 * a; }
      const b2 = Math.abs(s); y = b2 * 0.06 * a; sy *= 1 + (b2 - 0.5) * 0.07 * a; rx = Math.sin(ph * 2 + 0.6) * 0.05 * a; rz = s * 0.045 * a; ry = s * 0.07 * a;
    }
    else if (u.kind === 'biped') {
      if (L[0]) { L[0].rotation.x = -s * 0.8 * a; L[1].rotation.x = s * 0.8 * a; const c2 = Math.cos(ph); L[0].scale.y = 1 - Math.max(0, c2) * 0.24 * a; L[1].scale.y = 1 - Math.max(0, -c2) * 0.24 * a; }
      const b2 = Math.abs(s); rz = s * 0.1 * a; ry = -s * 0.14 * a; y = b2 * 0.055 * a; sy *= 1 + (b2 - 0.5) * 0.06 * a;
    }
    else if (u.kind === 'hop') { const h = Math.max(0, Math.sin(ph * 0.55)); y = h * 0.26 * a; sy *= 1 + (h - 0.25) * 0.28 * a; for (const l of L) l.position.y = (l.userData.y0 == null ? (l.userData.y0 = l.position.y) : l.userData.y0) + y; }
    else if (u.kind === 'float') { y = u.float + Math.sin(t * 2.4 + p) * 0.07 + (u.slowWings ? Math.sin(wp - 1.2) * 0.07 : 0); rx = 0.22 * a; rz = Math.sin(t * 1.3 + p) * 0.06 * a; }
    else if (u.kind === 'serpent') { const sg = u.segs, n = sg.length, w = u.wv; for (let k = 0; k < n; k++) { const q = u.path[k], ph2 = t * (2.2 + a * 3) + p - k * 0.55, kk = k / (n - 1); sg[k].position.set(q[0] + Math.sin(ph2) * w[0] * (0.2 + kk), q[1] + Math.sin(ph2 * 0.8 + 1) * w[1], q[2]); } y = u.float + (u.float ? Math.sin(t * 1.6 + p) * 0.1 : 0); }
    else if (u.kind === 'crawl') { const sg = u.segs; for (let k = 0; k < sg.length; k++) { const w = Math.max(0, Math.sin(ph * 0.7 - k * 0.9)); sg[k].position.y = w * 0.08 * (0.25 + a); sg[k].position.z = -0.19 * (k + 1) + w * 0.05 * a; } }
    // standing around: every few seconds a little hop of joy (crouch, spring up, land), and now and then a curious tilt of the head
    let joy = 0, tilt = 0;
    if (u.kind === 'quad' || u.kind === 'biped') {
      const hp = (t * 0.9 + p) % 5.4, q = hp < 0.62 ? hp / 0.62 : -1;
      if (q >= 0 && i > 0.6) { joy = q < 0.25 ? -Math.sin(q / 0.25 * Math.PI) * 0.35 : Math.sin((q - 0.25) / 0.75 * Math.PI); y += Math.max(0, joy) * 0.13 * i; sy *= 1 + joy * 0.09 * i; }
      for (const l of L) { if (l.userData.y0 == null) l.userData.y0 = l.position.y; l.position.y = l.userData.y0 + Math.max(0, joy) * 0.13 * i; }
    }
    { const tp = (t * 0.55 + p * 2) % 7.3; if (tp < 1.7) tilt = Math.sin(tp / 1.7 * Math.PI) * 0.26 * i * (p > 3.14 ? 1 : -1); }
    // something to do while waiting
    const I = u.idl || (u.idl = newAct(t)), kinds = CKIND[u.kind] || CKIND.biped, A = act(I, CIDLES, i > 0.95 && !u.shut && !u.noIdle ? k => kinds.indexOf(k) >= 0 : null, t, dtc, u.idleForce, [2, 5]), aw = A ? I.w * i : 0;
    if (A) { const sm = q => q * q * (3 - 2 * q), full = I.k >= 0 || I.q >= 1 ? 1 : I.w;
      y += (A.y || 0) * aw; rx += (A.rx || 0) * aw; rz += (A.rz || 0) * aw; sy *= 1 + (A.sy || 0) * aw;
      if (A.spin != null) ry += 6.2832 * sm(A.spin) * full; if (A.barrel != null) rz += 6.2832 * sm(A.barrel) * full;
      if (A.y && (u.kind === 'quad' || u.kind === 'biped' || u.kind === 'hop')) for (const l of L) { if (l.userData.y0 == null) l.userData.y0 = l.position.y; l.position.y = l.userData.y0 + Math.max(0, joy) * 0.13 * i + Math.max(0, A.y) * aw; } }
    const sq = 1 / Math.sqrt(sy);
    Bd.position.y = y; Bd.rotation.x = rx + 0.1 * a * (u.kind === 'quad' ? 0 : 1); Bd.rotation.z = rz; Bd.rotation.y = ry; Bd.scale.set(sq, sy, sq);
    const hd = u.head; hd.rotation.y = Math.sin(t * 0.7 + p) * 0.3 * i - (A && A.spin != null ? 0 : ry * 0.8) + (A ? (A.hy || 0) * aw : 0); hd.rotation.z = Math.sin(t * 1.1 + p) * 0.07 + tilt - rz * 0.7; hd.rotation.x = -rx * 0.6 + Math.sin(t * 1.9 + p) * 0.04 - Math.max(0, joy) * 0.18 + Math.sin(ph * 2 - 0.9) * 0.05 * a; if (A) { hd.rotation.x += (A.hx || 0) * aw; hd.rotation.z += (A.hz || 0) * aw; }
    if (u.tail) { u.tgp = (u.tgp || p) + dtc * (3 + a * 6 + Math.max(0, joy) * 9 + (A ? (A.wag || 0) * 4 * aw : 0)); u.tail.rotation.y = Math.sin(u.tgp) * (0.28 + 0.2 * a + Math.max(0, joy) * 0.25); u.tail.rotation.x = Math.sin(t * 2.3 + p) * 0.1 + Math.max(0, joy) * 0.3 + (Math.sin(ph * 2 - 1.4) * 0.16 + 0.12) * a; }
    for (const e of u.ears) { const tw = Math.pow(Math.max(0, Math.sin(t * 1.3 + p * 3 + e.userData.s)), 24); e.rotation.z = e.userData.rz + tw * 0.4 * e.userData.s; e.rotation.x = -0.25 * a - tw * 0.2 + Math.sin(ph * 2 - 1.1) * 0.13 * a; }
    for (const m of u.arms) { if (m.userData.hold) continue; m.rotation.x = m.userData.s * s * 0.6 * a + Math.sin(t * 2 + p + m.userData.s) * 0.08 - Math.max(0, joy) * 1.4 + (A ? (A.arm || 0) * aw : 0); }
    if (A && A.leg != null) { if (u.kind === 'quad' && L[3]) L[3].rotation.x = A.leg * aw; else { const m = u.arms.find(q => !q.userData.hold); if (m) m.rotation.x = (A.leg - 1.4) * aw; } }
    if (u.slowWings) for (const w of u.wings) { const f = Math.sin(wp); w.rotation.z = w.userData.s * (f * (0.38 + 0.2 * a) + 0.08); w.rotation.y = -w.userData.s * 0.25 * a; }
    else if (u.wings) for (const w of u.wings) w.rotation[u.float ? 'y' : 'z'] = u.float ? w.userData.s * (0.5 * Math.sin(t * 15)) : w.userData.s * (0.05 + Math.max(0, Math.sin(t * 14)) * 0.9 * a);
    if (u.eyes) { const cl = ((t + p) % 4.1) < 0.13 || !!u.shut || !!(A && A.shut && aw > 0.5), F = u.eyes.userData.F; if (!F) u.eyes.scale.y = cl ? 0.1 : 1; else if (cl !== !!u.eyeCl) { u.eyeCl = cl; F[0].scale.setScalar(cl ? 0.001 : 1); F[1].scale.setScalar(cl ? 1 : 0.001); } }
    if (u.flame) { u.flame.scale.y = 1 + Math.sin(t * 15 + p) * 0.2; u.flame.rotation.y = t * 4; }
  };

  // ---- monster instances ----
  TT.mon = (sp, lvl) => { const m = { sp, lvl, xp: 0, hp: 0 }; m.hp = TT.maxHp(m); return m; };
  TT.maxHp = m => Math.floor(D[m.sp][2] * (0.5 + m.lvl * 0.08)) + 8;
  TT.stat = (m, i) => D[m.sp][i] * (1 + m.lvl * 0.1);
  TT.moves = m => { const a = D[m.sp][5].filter(v => v[3] <= m.lvl).slice(m.sup ? -3 : -4); return m.sup ? a.concat([[m.sup[0], m.sup[1], m.sup[2], 1]]) : a; };
  TT.monName = m => D[m.sp][0];
  TT.xpNeed = m => 14 + m.lvl * 10;

  // ---- portraits (rendered once with a tiny offscreen renderer, cached) ----
  let pr = null, ps, pc; const cache = {};
  TT.portrait = (key, make, humanoid) => {
    if (cache[key]) return cache[key];
    try {
      if (!pr) {
        pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); pr.setSize(160, 160);
        ps = new THREE.Scene(); ps.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.6));
        const d = new THREE.DirectionalLight(0xffffff, 0.55); d.position.set(2, 4, 5); ps.add(d);
        pc = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      }
      const o = make(); o.rotation.y = 0.5; ps.add(o);
      const h = o.userData.h || 1;
      if (humanoid) { pc.position.set(0, h * 0.62, h * 2.15); pc.lookAt(0, h * 0.5, 0); }
      else { pc.position.set(0, h * 0.62, h * 1.5 + 0.75); pc.lookAt(0, h * 0.47, 0); }
      pr.render(ps, pc); ps.remove(o);
      return cache[key] = pr.domElement.toDataURL();
    } catch (e) { return ''; }
  };
  TT.monPortrait = sp => TT.portrait('m_' + sp, () => TT.creature(sp));
})();
