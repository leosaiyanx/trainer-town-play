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
  const faceCache = new Map();
  function faceCanvas(o) {
    if (faceCache.has(o)) return faceCache.get(o);
    // small tablets get the half-size picture
    const SC = navigator.deviceMemory && navigator.deviceMemory <= 4 ? 1 : 2, c = document.createElement('canvas'); c.width = 512 * SC; c.height = 128 * SC; const x = c.getContext('2d'); x.scale(SC, SC);
    const css = h => '#' + new THREE.Color(h).getHexString(), eye = css(o.eye != null ? o.eye : 0x5a3a22), brow = css(o.brow != null ? o.brow : o.hair), ink = '#1c1820';
    const girl = !!o.lash, EX = 23.5, EY = 47, RX = girl ? 10.5 : 9.6, RY = girl ? 17.5 : 16.5;
    for (let f = 0; f < 4; f++) {
      x.save(); x.translate(f * 128, 0); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const s of [-1, 1]) {
        const ex = 64 + s * EX, ey = EY;
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
      } else { x.strokeStyle = '#6a2a2a'; x.lineWidth = 2.4; x.beginPath(); if (o.grin) { x.moveTo(51, 89); x.quadraticCurveTo(64, 99, 77, 89); } else { x.moveTo(56, 91); x.quadraticCurveTo(64, 96.5, 72, 91); } x.stroke(); }
      if (o.glasses) { x.strokeStyle = '#333340'; x.lineWidth = 2.4; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(64 + s * EX, EY, RX + 4, RY + 3, 0, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(58, EY - 2); x.lineTo(70, EY - 2); x.stroke(); }
      x.restore();
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; faceCache.set(o, t); return t;       // one picture per kind of character; every copy of that character shares it
  }
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
    const tex = faceCanvas(o).clone(); tex.repeat.set(0.25, 1); tex.needsUpdate = true;
    const fm = new THREE.MeshToonMaterial({ map: tex, transparent: true, gradientMap: TT.grad, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); fm.userData.own = true;
    head.add(new THREE.Mesh(FACE_GEO, fm));
    ud.face = { tex, f: 0 };
    rig.eyes = grp(head, 0, 0, 0, 1);            // kept so older code that blinks the eye group still finds something
    const face = grp(head, 0, 0, 0, 1);
    hair(head, o);
    if (o.x) o.x({ g, hips, spine, head, face });
    ud.ols = []; TT.bakeRig(g, ud.ols); ud.h = 1.9; ud.human = true;
    if (o.scale) g.scale.setScalar(o.scale);
    return g;
  }
  const lerp = (a, b, k) => a + (b - a) * k;
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
    // --- write the pose ---
    r.legL.hip.rotation.x = hipL - crouch; r.legR.hip.rotation.x = hipR - crouch;
    r.legL.knee.rotation.x = kneeL + crouch * 2; r.legR.knee.rotation.x = kneeR + crouch * 2;
    r.legL.foot.rotation.x = -s * 0.32 * a - 0.12 * a * Math.max(0, Math.sin(ph - 1.15)) - crouch; r.legR.foot.rotation.x = s * 0.32 * a - 0.12 * a * Math.max(0, Math.sin(ph - 1.15 + Math.PI)) - crouch;
    const sway = Math.sin(t * 0.33 + p) * i;            // standing: the weight drifts from one leg to the other
    r.legL.hip.rotation.z = (0.035 + sway * 0.05) * i; r.legR.hip.rotation.z = (-0.035 + sway * 0.05) * i;
    r.legL.knee.rotation.x += Math.max(0, -sway) * 0.16; r.legR.knee.rotation.x += Math.max(0, sway) * 0.16; r.legL.hip.rotation.x -= Math.max(0, -sway) * 0.08; r.legR.hip.rotation.x -= Math.max(0, sway) * 0.08;
    r.armL.sh.rotation.set(lx, 0, lz); r.armR.sh.rotation.set(rx, 0, rz); r.armL.el.rotation.x = le; r.armR.el.rotation.x = re;
    r.armL.hand.rotation.x = lhx - 0.1; r.armR.hand.rotation.x = rhx - 0.1;
    r.hips.position.y = HIP + bob + hop - (1 - Math.cos(crouch)) * 0.74;
    r.hips.position.x = sway * 0.022;
    r.hips.rotation.y = -s * 0.12 * a; r.hips.rotation.z = -sway * 0.05 + c * 0.03 * a;
    r.spine.rotation.x = P0.lean + crouch * 0.35; r.spine.rotation.y = P0.twist; r.spine.rotation.z = -c * 0.03 * a + sway * 0.045;
    const bs = 1 + br * 0.012 * (i + 0.3); r.spine.scale.set(bs, 1, 1 + br * 0.03 * (i + 0.3)); r.spine.position.y = 0.06 + br * 0.004 * i;
    r.head.rotation.y = hy - P0.twist * 0.7 + s * 0.1 * a; r.head.rotation.x = hx - crouch * 0.2;
    // --- face: blink now and then, move the mouth when talking, grin when cheering ---
    let f = ((t + p) % 3.7) < 0.13 ? 1 : 0;
    if (W.cheer > 0.5) f = 3; else if (W.talk > 0.5) f = Math.sin(t * 17) > 0.1 ? 2 : f;
    if (u.face.f !== f) { u.face.f = f; u.face.tex.offset.x = f * 0.25; }
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
    gohan: { skin: SK[0], hair: BK, hairStyle: 'spiky', kid: 1, top: 0x6a3ab0, trim: 0xe2382e, short: 1, cuff: 0xe2382e, lower: 0x6a3ab0, shoes: 0x3a3a44, scale: 0.82 },
    clerk: { skin: SK[2], hair: 0x3a2a1a, hairStyle: 'short', top: 0x3a8ad8, apron: 1, short: 1, lower: 0x3a4a6a, shoes: 0x3a3a44 },
    lady: { skin: SK[1], hair: 0xe8c060, hairStyle: 'bun', blush: 1, eye: 0x4a8ad0, top: 0x2a9a8a, skirt: 0x2a6a6a, sock: WH, shoes: 0x8a4a3a },
    biz: { skin: SK[3], hair: BK, hairStyle: 'short', glasses: 1, top: 0x3a4a6a, inner: WH, collar: WH, lower: 0x3a4a6a, shoes: 0x22222a },
    goku: { skin: SK[0], hair: BK, hairStyle: 'goku', eye: BK, top: 0xf08a24, collar: 0x2a4ab0, inner: 0x2a4ab0, trim: 0x2a4ab0, sleeveC: 0xf08a24, short: 1, cuff: 0x2a4ab0, lower: 0xf08a24, shoes: 0x2a4ab0, sole: 0xd8c070,
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
    vegeta: { skin: SK[0], hair: BK, hairStyle: 'vegeta', eye: BK, brow: BK, top: 0xf2f2ee, sleeveC: 0x2a3a9a, inner: 0x2a3a9a, trim: 0xd8a020, glove: WH, lower: 0x2a3a9a, shoes: WH, sole: 0xd8a020, scale: 0.95,
      x: q => { for (const s of [1, -1]) P(q.spine, 'sph', 0xd8a020, [s * 0.2, 0.36, 0], [0.11, 0.06, 0.13]); P(q.spine, 'box', 0xd8a020, [0, 0.1, 0.094], [0.17, 0.09, 0.016]); } },
    bulma: { skin: SK[1], hair: 0x3ac4cc, hairStyle: 'ponytail', eye: 0x2a7ab0, blush: 1, top: 0xf06a8a, skirt: 0xf06a8a, short: 1, trim: WH, sock: WH, shoes: 0x7a4a9a, pack: 0xf2c230, scale: 0.94 },
    krillin: { skin: SK[0], hairStyle: 'bald', hair: SK[0], eye: BK, top: 0xf08a24, inner: 0x2a4ab0, trim: 0x2a4ab0, sleeveC: 0xf08a24, short: 1, cuff: 0x2a4ab0, lower: 0xf08a24, shoes: 0x2a4ab0, sole: 0xd8c070, scale: 0.78,
      x: q => { for (const s of [1, -1]) for (let i = 0; i < 3; i++) P(q.head, 'sph', 0x9a6a4a, [s * 0.035, 0.13 + i * 0.035, 0.185 - i * 0.012], 0.011); } }
  });

  // ============ CREATURES ============
  // eye styles: dot | big | tiny | slit
  function mkEyes(head, o, hr) {
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
    P(body, 'sph', c, [0, by, 0], b);
    if (o.belly != null) P(body, 'sph', o.belly, [0, by - b[1] * 0.1, b[2] * 0.2], [b[0] * 0.82, b[1] * 0.82, b[2] * 0.86]);
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
        P(pv, TT.capsule(0.055, Math.max(0.01, lh - 0.1)), c, [0, -lh / 2 + 0.03, 0]); P(pv, 'sph', lc, [0, -lh + 0.045, 0.015], [0.068, 0.05, 0.085]); ud.legs.push(pv);
      }
    } else if (o.legs === 2) {
      const ly = by * 0.7;
      for (const s of [1, -1]) { const pv = grp(g, s * b[0] * (o.legX || 0.5), ly, 0); if (o.legLen) P(pv, TT.capsule(0.055, ly - 0.14), o.shinC != null ? o.shinC : c, [0, -ly / 2 + 0.02, 0]); P(pv, 'sph', lc, [0, -ly + 0.05, 0.05], o.foot || [0.085, 0.055, 0.15]); ud.legs.push(pv); }
    }
    if (o.arms) for (const s of [1, -1]) { const pv = grp(body, s * b[0] * 0.86, by + b[1] * 0.3, b[2] * 0.25); pv.userData.s = s; P(pv, 'sph', o.armC != null ? o.armC : c, [s * 0.02, -0.07, 0.03], [0.05, 0.115, 0.05], [-0.5, 0, s * 0.35]); ud.arms.push(pv); }
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
  B.pikachu = () => crit({ c: 0xffdc32, b: [0.23, 0.26, 0.2], by: 0.36, hy: 0.72, hz: 0.03, hr: 0.25, hs: [0.25, 0.225, 0.23], cheek: 1, legs: 2, legX: 0.55, arms: 1, ear: 'long', earTip: BK, earX: 0.5, earY: 0.6, tail: 'bolt', er: 0.15, ex: 0.105, ey: 0.03, ez: 0.215, eyeTurn: 0.3, tailY: 0.8,
    x: (g, h, body, f) => {
      P(body, 'sph', 0xffdc32, [0, 0.24, -0.01], [0.26, 0.21, 0.23]);
      for (const s of [1, -1]) P(f, 'sph', 0xe8382a, [s * 0.185, -0.075, 0.165], [0.058, 0.058, 0.03], [0, s * 0.8, 0]);
      P(f, 'sph', BK, [0, -0.012, 0.243], [0.017, 0.011, 0.01]);
      for (const s of [1, -1]) P(f, 'box', 0x7a3a2a, [s * 0.022, -0.068, 0.236], [0.045, 0.01, 0.01], [0, 0, s * 0.45]);
      P(body, 'box', 0x9a6a2a, [0, 0.46, -0.185], [0.2, 0.04, 0.05]); P(body, 'box', 0x9a6a2a, [0, 0.34, -0.215], [0.24, 0.04, 0.05]);
    } });
  const sprigFace = (h, f, hr) => {
    P(f, 'sph', 0x56a85a, [0, hr * 0.1, hr * 0.5], [hr * 0.8, hr * 0.42, hr * 0.52]);
    P(f, 'sph', 0xf2a0b8, [0, -hr * 0.16, hr * 0.97], [0.026, 0.018, 0.014]);
    P(f, 'box', 0x3a6a3a, [0, -hr * 0.3, hr * 0.9], [0.05, 0.01, 0.01]);
  };
  B.sprigatito = () => crit({ c: 0xb4e496, b: [0.19, 0.19, 0.29], by: 0.31, hy: 0.57, hz: 0.27, hr: 0.25, hs: [0.26, 0.225, 0.23], cheek: 1, legs: 4, legC: 0xb4e496, ear: 'cat', earIn: 0x56a85a, earX: 0.62, earY: 0.5, eyeS: 'big', eye: 0xe0569a, er: 0.2, ex: 0.1, ey: 0.03, ez: 0.218, eyeTurn: 0.3, tail: 'fluff', tailY: 1.1,
    x: (g, h, body, f) => { sprigFace(h, f, 0.25); for (const s of [1, -1]) { P(body, 'sph', 0x56a85a, [s * 0.15, 0.42, 0.2], [0.1, 0.085, 0.1]); P(body, 'cone', 0x56a85a, [s * 0.22, 0.4, 0.2], [0.05, 0.12, 0.04], [0, 0, -s * 1.9]); } P(body, 'sph', 0x56a85a, [0, 0.36, 0.29], [0.13, 0.09, 0.07]); } });
  B.floragato = () => crit({ c: 0xb4e496, b: [0.17, 0.27, 0.15], by: 0.66, hy: 1.1, hz: 0.04, hr: 0.23, hs: [0.235, 0.21, 0.215], cheek: 1, legs: 2, legLen: 1, legX: 0.45, legC: 0x56a85a, foot: [0.07, 0.05, 0.13], arms: 1, ear: 'cat', earIn: 0x56a85a, earX: 0.62, earY: 0.5, eyeS: 'big', eye: 0xe0569a, er: 0.19, ex: 0.092, ey: 0.03, ez: 0.2, eyeTurn: 0.3, tail: 'thin', tailC: 0x56a85a, tailY: 0.75,
    x: (g, h, body, f) => { sprigFace(h, f, 0.23); P(body, 'sph', 0x56a85a, [0, 0.82, 0.02], [0.2, 0.13, 0.17]); P(body, 'sph', 0x56a85a, [0, 0.5, 0], [0.16, 0.12, 0.14]); P(body, 'sph', 0xf06a9a, [0.03, 0.78, 0.17], 0.065); P(body, 'sph', 0xffe060, [0.03, 0.78, 0.225], 0.028); for (const s of [1, -1]) { P(h, 'cone', 0x56a85a, [s * 0.2, -0.1, 0.02], [0.065, 0.22, 0.05], [0, 0, -s * 2.4]); P(h, 'cone', 0x56a85a, [s * 0.14, -0.16, -0.08], [0.06, 0.2, 0.05], [-0.4, 0, -s * 2.7]); } } });
  B.meowth = () => crit({ c: 0xf5e6b8, b: [0.19, 0.25, 0.165], by: 0.4, hy: 0.84, hz: 0.03, hr: 0.28, hs: [0.31, 0.25, 0.25], legs: 2, legLen: 1, legX: 0.45, legC: 0x9a6a3a, arms: 1, ear: 'cat', earC: BK, earIn: 0xf0a0b8, earX: 0.66, earY: 0.5, eyeS: 'slit', er: 0.2, ex: 0.12, ey: 0.02, ez: 0.228, eyeTurn: 0.35, tail: 'thin', tailTip: 0x9a6a3a, tailY: 0.6,
    x: (g, h, body, f) => {
      P(f, 'sph', 0xf2c230, [0, 0.17, 0.235], [0.05, 0.085, 0.025], [-0.45, 0, 0]);
      for (const s of [1, -1]) { for (const a of [0.18, -0.18]) P(f, 'box', 0xf5e6b8, [s * 0.34, -0.06 + a * 0.2, 0.1], [0.2, 0.012, 0.012], [0, 0, s * a]); P(h, 'box', 0xf5e6b8, [s * 0.06, 0.3, 0.02], [0.012, 0.14, 0.012], [0, 0, -s * 0.2]); P(f, 'cone', WH, [s * 0.04, -0.15, 0.225], [0.013, 0.04, 0.013], [Math.PI, 0, 0]); }
      P(f, 'box', 0x7a3a3a, [0, -0.125, 0.232], [0.1, 0.014, 0.012]);
    } });
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
  const bird = (c, belly, sc, crest) => crit({ c, belly, b: [0.2, 0.22, 0.26], by: 0.36, hy: 0.68, hz: 0.12, hr: 0.18, legs: 2, legLen: 1, shinC: 0xf0a04a, legX: 0.4, legC: 0xf0a04a, foot: [0.06, 0.03, 0.1], scale: sc, er: 0.2,
    x: (g, h, body, f, ud) => {
      P(h, 'cone', 0xf0b8a0, [0, -0.04, 0.2], [0.04, 0.1, 0.035], [1.57, 0, 0]); P(h, 'sph', crest, [0, 0.14, -0.03], [0.07, 0.12, 0.14], [-0.5, 0, 0]);
      for (const s of [1, -1]) { P(f, 'box', 0x3a2a1a, [s * 0.1, 0.03, 0.14], [0.09, 0.016, 0.012], [0, s * 0.7, s * 0.3]); const w = grp(body, s * 0.18, 0.46, -0.02); w.userData.s = s; P(w, 'sph', c, [s * 0.03, -0.1, -0.02], [0.05, 0.17, 0.23]); P(w, 'sph', crest, [s * 0.04, -0.16, -0.12], [0.04, 0.1, 0.16]); (ud.wings = ud.wings || []).push(w); }
      P(body, 'box', crest, [0, 0.36, -0.32], [0.16, 0.03, 0.24], [0.4, 0, 0]);
    } });
  B.pidgey = () => bird(0xc89b5a, 0xf5e6b8, 0.9, 0x9a6a3a);
  B.pidgeotto = () => bird(0xb8834f, 0xf5e6b8, 1.3, 0xe8603a);
  B.rattata = () => crit({ c: 0xa070c0, belly: 0xf5e6b8, b: [0.18, 0.18, 0.28], by: 0.27, hy: 0.47, hz: 0.28, hr: 0.19, snout: 1, snoutC: 0xf5e6b8, legs: 4, legC: 0xf5e6b8, ear: 'round', earIn: 0xf5e6b8, earY: 0.6, eye: 0xc02a2a, er: 0.2, tail: 'curl',
    x: (g, h, body, f) => { P(f, 'box', WH, [0, -0.115, 0.185], [0.055, 0.06, 0.02]); P(f, 'sph', 0x5a3a5a, [0, -0.03, 0.215], 0.018); for (const s of [1, -1]) for (const a of [0.2, -0.2]) P(f, 'box', 0xa070c0, [s * 0.2, -0.05, 0.14], [0.16, 0.008, 0.008], [0, 0, a]); } });
  B.caterpie = () => crit({ c: 0x6ac85a, b: [0.13, 0.13, 0.13], by: 0.15, hy: 0.3, hz: 0.26, hr: 0.19, eyeS: 'big', eye: BK, er: 0.26, kind: 'crawl',
    x: (g, h, body, f, ud) => { ud.segs = []; for (let i = 1; i < 5; i++) { const sg = grp(body, 0, 0, -0.19 * i); P(sg, 'sph', 0x6ac85a, [0, 0.15 - i * 0.008, 0], 0.15 - i * 0.014); P(sg, 'sph', 0xf2e060, [0, 0.045, 0], [0.1, 0.035, 0.08]); for (const s of [1, -1]) P(sg, 'sph', 0xf2e060, [s * 0.1, 0.16, 0], 0.03); if (i === 4) P(sg, 'cone', 0xf2e060, [0, 0.2, -0.08], [0.03, 0.12, 0.03], [-0.5, 0, 0]); ud.segs.push(sg); } for (const s of [1, -1]) P(h, 'cone', 0xe8402a, [s * 0.05, 0.22, 0], [0.03, 0.18, 0.03], [0, 0, -s * 0.4]); } });
  B.butterfree = () => crit({ c: 0x6a5ab0, b: [0.14, 0.2, 0.13], by: 0.5, hy: 0.78, hz: 0.04, hr: 0.19, eyeS: 'dot', eye: 0xe8402a, er: 0.3, float: 0.5,
    x: (g, h, body, f, ud) => { ud.wings = []; for (const s of [1, -1]) { const w = grp(body, s * 0.08, 0.6, -0.1); w.userData.s = s; P(w, 'sph', 0xf8f8ff, [s * 0.3, 0.16, 0], [0.3, 0.32, 0.02]); P(w, 'sph', 0xf8f8ff, [s * 0.22, -0.2, 0], [0.2, 0.2, 0.02]); P(w, 'sph', 0x3a3a5a, [s * 0.3, 0.16, 0.012], [0.2, 0.012, 0.012], [0, 0, s * 0.5]); ud.wings.push(w); P(h, TT.capsule(0.01, 0.16), BK, [s * 0.06, 0.25, 0], null, [0, 0, -s * 0.3]); P(body, 'sph', 0x8adcf0, [s * 0.08, 0.34, 0.05], 0.05); P(body, 'sph', 0x8adcf0, [s * 0.1, 0.56, 0.08], [0.035, 0.07, 0.035]); } P(f, 'sph', 0x8adcf0, [0, -0.08, 0.17], [0.05, 0.035, 0.03]); } });
  B.oddish = () => crit({ c: 0x5a78c8, b: [0.05, 0.05, 0.05], by: 0.3, hy: 0.34, hz: 0, hr: 0.27, legs: 2, legX: 2.6, eye: 0xc02a2a, er: 0.17, kind: 'hop', foot: [0.085, 0.05, 0.12],
    x: (g, h, body, f, ud) => { const lv = grp(h, 0, 0.2, -0.02); ud.tail = lv; for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.5; P(lv, 'sph', i % 2 ? 0x4aa84a : 0x5ab84a, [Math.sin(a) * 0.2, 0.12 + Math.cos(a) * 0.16, 0], [0.075, 0.27, 0.03], [0, 0, -a]); } P(f, 'box', 0x2a3a6a, [0, -0.1, 0.25], [0.07, 0.014, 0.012]); } });
  B.psyduck = () => crit({ c: 0xffd84d, b: [0.24, 0.28, 0.22], by: 0.36, hy: 0.8, hz: 0.03, hr: 0.27, legs: 2, legC: 0xf5e6b8, tail: 'curl', eyeS: 'tiny', er: 0.2, ex: 0.11, ey: 0.06, eyeTurn: 0.35,
    x: (g, h, body, f, ud) => { P(h, 'sph', 0xf5e6b8, [0, -0.08, 0.23], [0.14, 0.055, 0.13]); for (const a of [-0.3, 0, 0.3]) P(h, TT.capsule(0.01, 0.12), BK, [Math.sin(a) * 0.1, 0.31, 0], null, [0, 0, -a]); for (const s of [1, -1]) { const pv = grp(body, s * 0.22, 0.52, 0.04); pv.userData.s = s; pv.userData.hold = 1; P(pv, 'sph', 0xffd84d, [s * 0.04, 0.12, 0.02], [0.055, 0.17, 0.055], [0, 0, -s * 0.45]); ud.arms.push(pv); } } });
  B.eevee = () => crit({ c: 0xb8834f, b: [0.19, 0.19, 0.28], by: 0.31, hy: 0.6, hz: 0.25, hr: 0.22, hs: [0.23, 0.2, 0.205], cheek: 1, legs: 4, legC: 0x8a5a30, ear: 'long', earTip: 0x5a3a20, earA: 0.4, earY: 0.55, tail: 'fluff', tailTip: 0xf5e6b8, eyeS: 'big', eye: 0x5a3018, er: 0.19, ex: 0.092, ey: 0.03, ez: 0.19, eyeTurn: 0.3,
    x: (g, h, body, f) => { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; P(body, 'sph', 0xf5e6b8, [Math.sin(a) * 0.12, 0.4 + Math.cos(a) * 0.06, 0.2 + Math.cos(a) * 0.03], 0.1); } P(f, 'sph', BK, [0, -0.07, 0.21], [0.02, 0.014, 0.012]); } });
  B.charmander = () => crit({ c: 0xff9441, belly: 0xffe9a0, b: [0.2, 0.27, 0.19], by: 0.38, hy: 0.82, hz: 0.05, hr: 0.24, hs: [0.24, 0.22, 0.24], snout: 1, legs: 2, legLen: 1, legX: 0.5, arms: 1, tail: 'flame', tailY: 0.6, eyeS: 'big', eye: 0x2a7a8a, er: 0.17, ex: 0.11, ey: 0.05, ez: 0.19, eyeTurn: 0.5,
    x: (g, h, body, f) => { P(f, 'box', 0x8a3a1a, [0, -0.115, 0.215], [0.09, 0.012, 0.012]); for (const s of [1, -1]) P(f, 'sph', 0x8a3a1a, [s * 0.03, -0.05, 0.255], 0.008); } });
  B.squirtle = () => crit({ c: 0x7fccec, belly: 0xffe9a0, b: [0.2, 0.25, 0.18], by: 0.36, hy: 0.78, hz: 0.05, hr: 0.24, legs: 2, legLen: 1, legX: 0.5, arms: 1, tail: 'curl', eyeS: 'big', eye: 0x8a3a2a, er: 0.18, ex: 0.11, ey: 0.05, eyeTurn: 0.45,
    x: (g, h, body, f) => { P(body, 'sph', 0x9a6a3a, [0, 0.38, -0.1], [0.23, 0.26, 0.15]); P(body, 'sph', 0xf5e6b8, [0, 0.38, -0.06], [0.24, 0.27, 0.1]); P(f, 'box', 0x3a6a8a, [0, -0.11, 0.215], [0.1, 0.012, 0.012]); } });
  B.bulbasaur = () => crit({ c: 0x7fd1b0, b: [0.22, 0.19, 0.3], by: 0.29, hy: 0.44, hz: 0.3, hr: 0.22, hs: [0.24, 0.19, 0.21], legs: 4, ear: 'cat', earY: 0.5, earX: 0.6, eyeS: 'big', eye: 0xc02a2a, er: 0.19, ex: 0.115, ey: 0.03, ez: 0.17, eyeTurn: 0.55,
    x: (g, h, body, f) => { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; P(body, 'sph', 0x4aa84a, [Math.sin(a) * 0.09, 0.5, -0.08 + Math.cos(a) * 0.09], [0.12, 0.2, 0.12]); } P(body, 'cone', 0x3a984a, [0, 0.74, -0.08], [0.09, 0.16, 0.09]); for (const q of [[0.12, 0.36, 0.2], [-0.15, 0.3, 0.1], [0.05, 0.1, 0.16]]) P(q[1] > 0.2 ? body : h, 'sph', 0x4a9a8a, q, [0.05, 0.04, 0.03]); P(f, 'box', 0x2a6a5a, [0, -0.1, 0.195], [0.12, 0.012, 0.012]); } });

  B.growlithe = () => crit({ c: 0xf08a3a, belly: 0xf5e6b8, b: [0.19, 0.19, 0.28], by: 0.31, hy: 0.58, hz: 0.25, hr: 0.21, snout: 1, snoutC: 0xf5e6b8, legs: 4, ear: 'round', earY: 0.6, tail: 'fluff', tailC: 0xf5e6b8, eyeS: 'dot', er: 0.17,
    x: (g, h, body, f) => { P(h, 'sph', 0xf5e6b8, [0, 0.19, 0.02], [0.13, 0.12, 0.13]); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; P(body, 'sph', 0xf5e6b8, [Math.sin(a) * 0.11, 0.4 + Math.cos(a) * 0.05, 0.19], 0.09); } for (const z of [0.05, -0.1]) P(body, 'box', 0x3a2a22, [0, 0.48, z], [0.3, 0.03, 0.05]); P(f, 'sph', 0x3a2a22, [0, -0.04, 0.21], 0.02); } });
  B.jigglypuff = () => crit({ c: 0xf9b8d0, b: [0.05, 0.05, 0.05], by: 0.3, hy: 0.36, hz: 0, hr: 0.3, legs: 2, legX: 2.8, ear: 'cat', earIn: 0x5a3a4a, earY: 0.6, eyeS: 'big', eye: 0x2a9ab8, er: 0.2, kind: 'hop', foot: [0.08, 0.05, 0.12],
    x: (g, h, body, f) => { P(h, 'sph', 0xf9b8d0, [0, 0.2, 0.2], [0.1, 0.1, 0.09]); P(h, 'sph', 0xf9b8d0, [0.05, 0.12, 0.26], 0.07); P(f, 'box', 0x8a3a5a, [0, -0.13, 0.275], [0.06, 0.014, 0.012]); for (const s of [1, -1]) P(body, 'sph', 0xf9b8d0, [s * 0.29, 0.3, 0.04], [0.06, 0.08, 0.06]); } });
  B.machop = () => crit({ c: 0x9ab4c8, b: [0.2, 0.25, 0.17], by: 0.42, hy: 0.84, hz: 0.03, hr: 0.22, legs: 2, legLen: 1, legX: 0.5, arms: 1, tail: 'curl', eyeS: 'dot', eye: 0xc02a2a, er: 0.16,
    x: (g, h, body, f) => { for (const q of [-0.07, 0, 0.07]) P(h, 'sph', 0xe8d8b0, [q, 0.2, -0.02], [0.025, 0.07, 0.13]); P(f, 'box', 0x5a6a7a, [0, -0.1, 0.2], [0.09, 0.012, 0.012]); for (const s of [1, -1]) P(body, 'sph', 0x9ab4c8, [s * 0.23, 0.52, 0.05], [0.09, 0.1, 0.09]); } });
  B.magnemite = () => crit({ c: 0xb8c0cc, b: [0.05, 0.05, 0.05], by: 0.4, hy: 0.42, hz: 0, hr: 0.23, eyeS: 'none', float: 0.45,
    x: (g, h, body, f, ud) => { P(f, 'sph', WH, [0, 0, 0.19], [0.13, 0.13, 0.06]); P(f, 'sph', BK, [0, 0, 0.245], 0.04); for (const s of [1, -1]) { const pv = grp(body, s * 0.2, 0.42, 0); pv.userData.s = s; P(pv, 'box', 0x8a929e, [s * 0.1, 0, 0], [0.16, 0.06, 0.06]); for (const q of [1, -1]) { P(pv, 'box', 0x8a929e, [s * 0.2, q * 0.08, 0], [0.07, 0.1, 0.07]); P(pv, 'box', q > 0 ? 0xe2382e : 0x3a6ad8, [s * 0.2, q * 0.15, 0], [0.07, 0.06, 0.07]); } ud.arms.push(pv); } P(h, 'cyl', 0x8a929e, [0, 0.25, 0], [0.03, 0.1, 0.03]); P(h, 'cyl', 0x8a929e, [0, 0.3, 0], [0.06, 0.02, 0.06]); for (const s of [1, -1]) P(h, 'cyl', 0x8a929e, [s * 0.1, -0.19, 0.1], [0.025, 0.06, 0.025], [0.5, 0, 0]); } });
  B.fuecoco = () => crit({ c: 0xe8503a, belly: 0xf5e6b8, b: [0.22, 0.26, 0.2], by: 0.36, hy: 0.78, hz: 0.06, hr: 0.25, hs: [0.25, 0.21, 0.24], snout: 1, legs: 2, legX: 0.55, arms: 1, tail: 'curl', eyeS: 'big', eye: 0x2a2a2a, er: 0.15, ex: 0.1, ey: 0.09, ez: 0.19, eyeTurn: 0.4,
    x: (g, h, body, f) => { P(h, 'sph', 0xe8503a, [0, -0.07, 0.2], [0.2, 0.1, 0.2]); P(h, 'cone', 0xffd23c, [0, 0.27, -0.02], [0.07, 0.2, 0.06], [-0.3, 0, 0]); P(h, 'cone', 0xff9a1f, [0.06, 0.24, -0.02], [0.04, 0.12, 0.04], [-0.3, 0, -0.4]); P(f, 'box', WH, [0, -0.12, 0.37], [0.2, 0.025, 0.02]); for (const s of [1, -1]) P(f, 'sph', 0x8a2a1a, [s * 0.05, -0.02, 0.385], 0.012); } });
  B.quaxly = () => crit({ c: 0xf4f6fa, b: [0.2, 0.25, 0.19], by: 0.36, hy: 0.76, hz: 0.04, hr: 0.22, legs: 2, legC: 0xf2c230, foot: [0.09, 0.03, 0.14], arms: 1, tail: 'curl', eyeS: 'big', eye: 0x2a6ad0, er: 0.18,
    x: (g, h, body, f) => { P(h, 'sph', 0xf2c230, [0, -0.07, 0.2], [0.11, 0.045, 0.11]); P(h, 'sph', 0x3a8ad8, [0, 0.17, 0.04], [0.15, 0.14, 0.17]); P(h, 'sph', 0x3a8ad8, [0, 0.27, 0.13], [0.09, 0.09, 0.1]); P(h, 'sph', 0x6ad0f0, [0, 0.3, 0.2], 0.05); } });
  B.lugia = () => crit({ c: 0xf2f4fa, belly: 0xdfe8f6, b: [0.3, 0.32, 0.42], by: 0.75, hy: 1.5, hz: 0.42, hr: 0.2, hs: [0.19, 0.17, 0.26], float: 0.45, kind: 'float', eyeS: 'dot', eye: 0xe8402a, er: 0.18, ex: 0.1, ey: 0.03, ez: 0.17, eyeTurn: 0.5, scale: 1.15,
    x: (g, h, body, f, ud) => {
      P(body, TT.capsule(0.11, 0.55), 0xf2f4fa, [0, 1.12, 0.3], null, [0.6, 0, 0]);                                          // long neck
      for (const s of [1, -1]) P(h, 'sph', 0x3a5ac8, [s * 0.09, 0.03, 0.12], [0.08, 0.05, 0.08]);                            // blue eye mask
      P(h, 'cone', 0x3a5ac8, [0, 0.08, -0.22], [0.05, 0.25, 0.05], [-1.9, 0, 0]);
      for (let i = 0; i < 4; i++) P(body, 'cone', 0x3a5ac8, [0, 1.05 - i * 0.04, -0.05 - i * 0.18], [0.06, 0.22, 0.12], [-0.8, 0, 0]);  // back plates
      for (let i = 0; i < 3; i++) P(body, 'sph', 0x5a7ad8, [0, 0.7 - i * 0.08, 0.38 - i * 0.04], [0.14, 0.05, 0.06]);        // belly plates
      P(ud.tail, TT.capsule(0.07, 0.6), 0xf2f4fa, [0, 0.05, -0.35], null, [-1.4, 0, 0]); P(ud.tail, 'cone', 0x3a5ac8, [0, 0.06, -0.75], [0.12, 0.25, 0.05], [-1.57, 0, 0]);
      ud.slowWings = 1; ud.wings = []; for (const s of [1, -1]) { const w = grp(body, s * 0.28, 0.95, 0); w.userData.s = s; P(w, 'sph', 0xf2f4fa, [s * 0.45, 0.05, 0], [0.5, 0.06, 0.22], [0, 0, s * 0.25]); for (let i = 0; i < 4; i++) P(w, 'cone', i % 2 ? 0xf2f4fa : 0x3a5ac8, [s * (0.75 + i * 0.05), -0.05 - i * 0.05, -0.12 + i * 0.08], [0.06, 0.32, 0.05], [0, 0, s * 2.4]); ud.wings.push(w); }
    } });

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
  B.ponyta = () => crit({ c: 0xf8ecc8, b: [0.17, 0.19, 0.34], by: 0.66, hy: 1.12, hz: 0.42, hr: 0.16, hs: [0.15, 0.16, 0.2], snout: 1, snoutC: 0xf8ecc8, legs: 4, legC: 0xd8c8a0, ear: 'cat', earY: 0.7, eyeS: 'big', eye: 0x8a2a5a, er: 0.2, ex: 0.08, ey: 0.03, ez: 0.15, eyeTurn: 0.6, tail: 'flame', tailY: 1.05,
    x: (g, h, body) => { P(body, TT.capsule(0.08, 0.32), 0xf8ecc8, [0, 0.95, 0.32], null, [0.55, 0, 0]); for (let i = 0; i < 5; i++) P(body, 'cone', TT.glow(i % 2 ? 0xffd040 : 0xff7a1a), [0, 1.0 + i * 0.03, 0.27 - i * 0.07], [0.07, 0.28, 0.06], [-0.6, 0, 0]); P(h, 'cone', TT.glow(0xffb020), [0, 0.2, 0.03], [0.05, 0.2, 0.05], [-0.3, 0, 0]); } });
  B.abra = () => crit({ c: 0xf2c230, b: [0.2, 0.24, 0.18], by: 0.4, hy: 0.82, hz: 0.04, hr: 0.21, hs: [0.2, 0.19, 0.2], snout: 1, legs: 2, legLen: 1, legX: 0.5, arms: 1, ear: 'long', earA: 0.35, earY: 0.6, eyeS: 'none', tail: 'thin', tailC: 0xf2c230, tailTip: 0x8a5a2a, float: 0.18, kind: 'float',
    x: (g, h, body, f) => { P(body, 'sph', 0x8a5a2a, [0, 0.5, 0.02], [0.21, 0.13, 0.18]); for (const s of [1, -1]) { P(body, 'sph', 0x8a5a2a, [s * 0.17, 0.56, 0], [0.09, 0.06, 0.09]); P(f, 'box', 0x3a2a1a, [s * 0.08, 0.03, 0.19], [0.08, 0.014, 0.01], [0, s * 0.4, s * 0.15]); } } });
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
  B.charmeleon = () => crit({ c: 0xe0482a, belly: 0xf5d8a0, b: [0.19, 0.32, 0.19], by: 0.47, hy: 1.0, hz: 0.06, hr: 0.23, hs: [0.22, 0.21, 0.26], snout: 1, legs: 2, legLen: 1, legX: 0.5, arms: 1, tail: 'flame', tailY: 0.55, eyeS: 'slit', er: 0.17, ex: 0.11, ey: 0.06, ez: 0.18, eyeTurn: 0.5,
    x: (g, h, body, f) => { P(h, 'cone', 0xe0482a, [0, 0.12, -0.2], [0.06, 0.24, 0.06], [-2.2, 0, 0]); P(f, 'box', 0x7a2a1a, [0, -0.13, 0.24], [0.1, 0.012, 0.012]); for (const s of [1, -1]) P(f, 'cone', WH, [s * 0.04, -0.15, 0.25], [0.012, 0.03, 0.012], [Math.PI, 0, 0]); } });
  B.wartortle = () => crit({ c: 0x8aa8e8, belly: 0xffe9a0, b: [0.21, 0.29, 0.2], by: 0.42, hy: 0.9, hz: 0.05, hr: 0.24, legs: 2, legLen: 1, legX: 0.5, arms: 1, tail: 'fluff', tailC: 0xf4f6fa, tailTip: 0xc8d8f8, eyeS: 'big', eye: 0x5a2a6a, er: 0.17, ex: 0.11, ey: 0.05, eyeTurn: 0.45,
    x: (g, h, body, f) => { P(body, 'sph', 0x9a6a3a, [0, 0.43, -0.1], [0.24, 0.3, 0.16]); P(body, 'sph', 0xf5e6b8, [0, 0.43, -0.07], [0.25, 0.31, 0.1]); for (const s of [1, -1]) P(h, 'cone', 0xf4f6fa, [s * 0.24, 0.12, -0.05], [0.05, 0.24, 0.04], [0.3, 0, -s * 0.9]); P(f, 'box', 0x3a6a8a, [0, -0.11, 0.215], [0.1, 0.012, 0.012]); } });
  B.ivysaur = () => crit({ c: 0x6ac0b0, b: [0.26, 0.22, 0.34], by: 0.34, hy: 0.52, hz: 0.36, hr: 0.25, hs: [0.27, 0.21, 0.24], legs: 4, ear: 'cat', earY: 0.5, earX: 0.6, eyeS: 'big', eye: 0xc02a2a, er: 0.19, ex: 0.13, ey: 0.03, ez: 0.19, eyeTurn: 0.55,
    x: (g, h, body, f) => { P(body, 'sph', 0xf06a9a, [0, 0.72, -0.08], [0.17, 0.2, 0.17]); for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 0.4; P(body, 'sph', 0x3a984a, [Math.sin(a) * 0.22, 0.6, -0.08 + Math.cos(a) * 0.22], [0.2, 0.04, 0.09], [0, a, 0.3]); }
      for (const q of [[0.14, 0.4, 0.22], [-0.17, 0.33, 0.1]]) P(body, 'sph', 0x3a8a7a, q, [0.06, 0.05, 0.03]); P(f, 'box', 0x2a6a5a, [0, -0.1, 0.225], [0.13, 0.012, 0.012]); } });
  B.machoke = () => crit({ c: 0x8a8ab0, b: [0.24, 0.3, 0.19], by: 0.55, hy: 1.08, hz: 0.04, hr: 0.22, legs: 2, legLen: 1, legX: 0.5, arms: 1, eyeS: 'dot', eye: 0xc02a2a, er: 0.16,
    x: (g, h, body, f, ud) => { for (const q of [-0.07, 0, 0.07]) P(h, 'sph', 0x6a6a90, [q, 0.2, -0.02], [0.025, 0.08, 0.13]); P(body, 'cyl', 0x2a2a30, [0, 0.38, 0], [0.25, 0.07, 0.2]); P(body, 'box', 0xf2c230, [0, 0.38, 0.2], [0.1, 0.07, 0.02]);
      for (const a of ud.arms) a.scale.setScalar(1.6); for (const s of [1, -1]) P(body, 'sph', 0x8a8ab0, [s * 0.27, 0.72, 0.05], [0.11, 0.12, 0.11]); P(f, 'box', 0x5a5a7a, [0, -0.1, 0.2], [0.09, 0.012, 0.012]); } });
  B.pidgeot = () => bird(0xc8a060, 0xf5e6b8, 1.75, 0xe84a2a);

  // serpents: a chain of segments laid along path(k), k = 0 (head) .. 1 (tail); they ripple when animated
  function serpent(o) {
    const g = new THREE.Group(), ud = g.userData = { legs: [], ears: [], arms: [], kind: 'serpent', float: o.float || 0, segs: [], path: [], wv: o.wave || [0.15, 0.06] };
    const body = ud.body = grp(g), n = o.n;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), r = o.r0 * (1 - k * (o.taper == null ? 0.7 : o.taper)), q = o.path(k), sg = grp(body, q[0], q[1], q[2]);
      ud.path.push(q); P(sg, 'sph', o.c, [0, 0, 0], [r, r, r * 1.25]);
      if (o.belly != null) P(sg, 'sph', o.belly, o.bellyUp ? [0, 0, r * 0.32] : [0, -r * 0.32, 0], o.bellyUp ? [r * 0.8, r * 0.95, r * 0.8] : [r * 0.82, r * 0.78, r * 1.12]);
      if (o.seg) o.seg(sg, i, r, k);
      ud.segs.push(sg);
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
  B.vulpix = () => crit({ c: 0xc8683a, belly: 0xf5e6b8, b: [0.18, 0.18, 0.27], by: 0.3, hy: 0.57, hz: 0.25, hr: 0.21, snout: 1, snoutC: 0xf5e6b8, legs: 4, legC: 0x9a4a2a, ear: 'long', earA: 0.45, earY: 0.58, tail: 'fluff', tailC: 0xe8a04a, eyeS: 'dot', er: 0.17,
    x: (g, h, body) => { for (const q of [[-0.16, 0.42, -0.34], [0.16, 0.42, -0.34], [-0.09, 0.52, -0.38], [0.09, 0.52, -0.38]]) { P(body, 'sph', 0xe8a04a, q, [0.07, 0.07, 0.12]); P(body, 'sph', 0xf2c860, [q[0] * 1.15, q[1] + 0.05, q[2] - 0.08], 0.05); } for (const q of [-0.05, 0.02, 0.09]) P(h, 'sph', 0xe8a04a, [q, 0.2, 0.05], [0.05, 0.07, 0.07]); } });
  B.onix = () => serpent({ c: 0x8a8a96, n: 10, r0: 0.36, taper: 0.5, hr: 0.38, hs: [0.36, 0.36, 0.42], hz: 0.2, hy: 0.05, top: 2.6, wave: [0.08, 0.03], path: k => [Math.sin(k * 4.5) * 0.35, 0.3 + 2.1 * Math.pow(1 - k, 1.5), 0.3 - k * 1.5], eyeS: 'slit', er: 0.15, ex: 0.17, ey: 0.1, ez: 0.3, eyeTurn: 0.7,
    seg: (sg, i, r) => { if (i % 2) P(sg, 'rock', 0x74747e, [r * 0.5, r * 0.4, 0], r * 0.5, [i, i * 2, 0]); },
    x: (g, h) => { P(h, 'cone', 0x74747e, [0, 0.42, -0.05], [0.09, 0.4, 0.09], [-0.25, 0, 0]); P(h, 'sph', 0x9a9aa6, [0, -0.14, 0.2], [0.26, 0.1, 0.24]); } });
  B.mewtwo = () => crit({ c: 0xe4dcec, belly: 0xa886c8, b: [0.2, 0.3, 0.17], by: 0.58, hy: 1.14, hz: 0.04, hr: 0.2, hs: [0.19, 0.2, 0.22], legs: 2, legLen: 1, legX: 0.5, arms: 1, tail: 'thin', tailC: 0xa886c8, tailTip: 0xa886c8, eyeS: 'slit', eye: 0x8a4ac8, er: 0.16, float: 0.25, kind: 'float', scale: 1.1,
    x: (g, h, body) => { for (const s of [1, -1]) { P(h, 'cone', 0xe4dcec, [s * 0.1, 0.2, -0.02], [0.05, 0.14, 0.05], [0, 0, -s * 0.25]); P(body, 'sph', 0xa886c8, [s * 0.16, 0.5, 0], [0.09, 0.07, 0.09]); } P(body, 'cyl', 0xe4dcec, [0, 0.84, -0.14], [0.05, 0.3, 0.05], [0.5, 0, 0]); P(body, 'sph', 0xa886c8, [0, 0.2, -0.3], [0.12, 0.12, 0.2]); } });
  B.articuno = () => { const g = bird(0x6ab8f0, 0xdff2ff, 2.0, 0x2a6ad8); return g; };
  B.zapdos = () => bird(0xf2c230, 0xfff0a0, 2.0, 0x23232b);
  B.moltres = () => bird(0xf08a24, 0xffe080, 2.0, 0xe8402a);
  // the Eternal Dragon: a huge green serpent with antlers, whiskers and red eyes
  B.shenron = () => serpent({ c: 0x3aa84a, belly: 0xf2e6a8, bellyUp: 1, n: 18, r0: 0.34, taper: 0.5, hr: 0.36, hs: [0.3, 0.27, 0.5], float: 0.45, top: 1.7, scale: 1.3, wave: [0.22, 0.1], path: k => [Math.sin(k * 8) * 0.6, 0.85 * Math.pow(1 - k, 1.2) + 0.42 * Math.sin(k * 5), 0.5 - k * 3.6], eyeS: 'slit', eye: 0xe01818, er: 0.17, ex: 0.16, ey: 0.1, ez: 0.3, eyeTurn: 0.7,
    seg: (sg, i, r) => { if (i > 0 && i < 16) P(sg, 'cone', 0x2a7a36, [0, r * 0.95, -r * 0.2], [r * 0.22, r * 0.6, r * 0.1], [-0.6, 0, 0]); if (i === 4 || i === 11) for (const s of [1, -1]) { P(sg, TT.capsule(0.05, 0.3), 0x3aa84a, [s * r * 1.3, -r * 0.3, 0], null, [0, 0, s * 1.2]); P(sg, 'sph', 0xf2e6a8, [s * (r * 1.3 + 0.24), -r * 0.5, 0], 0.07); } },
    x: (g, h, body, f) => { P(h, 'sph', 0x3aa84a, [0, -0.02, 0.34], [0.2, 0.15, 0.24]); P(h, 'sph', 0xf2e6a8, [0, -0.16, 0.26], [0.2, 0.08, 0.26]);
      for (const s of [1, -1]) { P(h, 'cone', 0x8a6a3a, [s * 0.13, 0.3, -0.16], [0.045, 0.5, 0.045], [-0.7, 0, -s * 0.35]); P(h, 'cone', 0x8a6a3a, [s * 0.22, 0.42, -0.3], [0.03, 0.22, 0.03], [-0.2, 0, -s * 0.9]); P(h, TT.capsule(0.014, 0.7), 0x3aa84a, [s * 0.3, -0.1, 0.5], null, [1.2, 0, s * 0.7]); P(h, 'cone', 0x2a7a36, [s * 0.26, 0.05, -0.2], [0.06, 0.3, 0.03], [-1.2, 0, s * 1.2]); P(f, 'cone', WH, [s * 0.1, -0.14, 0.5], [0.022, 0.09, 0.022], [Math.PI, 0, 0]); } } });

  TT.creature = sp => { const g = (B[sp] || B.rattata)(); g.userData.sp = sp; return g; };

  // gait / idle. mv 0..1
  TT.animCreature = (g, t, mv) => {
    const u = g.userData, p = u.ph || (u.ph = Math.random() * 6.28);
    u.amp = (u.amp || 0) + ((mv || 0) - (u.amp || 0)) * 0.18;
    const a = u.amp, i = 1 - a, ph = t * 11 + p, s = Math.sin(ph), Bd = u.body, L = u.legs;
    let y = 0, rx = 0, rz = 0, sy = 1 + Math.sin(t * 2.2 + p) * 0.02 * i;
    if (u.kind === 'quad') { for (let k = 0; k < L.length; k++) L[k].rotation.x = Math.sin(ph + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.8 * a; y = Math.abs(Math.sin(ph)) * 0.035 * a; rx = Math.sin(ph * 2) * 0.03 * a; }
    else if (u.kind === 'biped') { if (L[0]) { L[0].rotation.x = -s * 0.75 * a; L[1].rotation.x = s * 0.75 * a; } rz = s * 0.09 * a; y = Math.abs(s) * 0.035 * a; }
    else if (u.kind === 'hop') { const h = Math.max(0, Math.sin(ph * 0.55)); y = h * 0.26 * a; sy *= 1 + (h - 0.25) * 0.28 * a; for (const l of L) l.position.y = (l.userData.y0 == null ? (l.userData.y0 = l.position.y) : l.userData.y0) + y; }
    else if (u.kind === 'float') { y = u.float + Math.sin(t * 2.4 + p) * 0.07; rx = 0.22 * a; }
    else if (u.kind === 'serpent') { const sg = u.segs, n = sg.length, w = u.wv; for (let k = 0; k < n; k++) { const q = u.path[k], ph2 = t * (2.2 + a * 3) + p - k * 0.55, kk = k / (n - 1); sg[k].position.set(q[0] + Math.sin(ph2) * w[0] * (0.2 + kk), q[1] + Math.sin(ph2 * 0.8 + 1) * w[1], q[2]); } y = u.float + (u.float ? Math.sin(t * 1.6 + p) * 0.1 : 0); }
    else if (u.kind === 'crawl') { const sg = u.segs; for (let k = 0; k < sg.length; k++) { const w = Math.max(0, Math.sin(ph * 0.7 - k * 0.9)); sg[k].position.y = w * 0.08 * (0.25 + a); sg[k].position.z = -0.19 * (k + 1) + w * 0.05 * a; } }
    const sq = 1 / Math.sqrt(sy);
    Bd.position.y = y; Bd.rotation.x = rx; Bd.rotation.z = rz; Bd.scale.set(sq, sy, sq);
    const hd = u.head; hd.rotation.y = Math.sin(t * 0.7 + p) * 0.3 * i; hd.rotation.z = Math.sin(t * 1.1 + p) * 0.07; hd.rotation.x = -rx * 0.6 + Math.sin(t * 1.9 + p) * 0.04;
    if (u.tail) { u.tail.rotation.y = Math.sin(t * (3 + a * 6) + p) * (0.28 + 0.2 * a); u.tail.rotation.x = Math.sin(t * 2.3 + p) * 0.1; }
    for (const e of u.ears) { const tw = Math.pow(Math.max(0, Math.sin(t * 1.3 + p * 3 + e.userData.s)), 24); e.rotation.z = e.userData.rz + tw * 0.4 * e.userData.s; e.rotation.x = -0.25 * a - tw * 0.2; }
    for (const m of u.arms) { if (m.userData.hold) continue; m.rotation.x = m.userData.s * s * 0.6 * a + Math.sin(t * 2 + p + m.userData.s) * 0.08; }
    if (u.slowWings) for (const w of u.wings) w.rotation.z = w.userData.s * Math.sin(t * 3 + p) * 0.35;
    else if (u.wings) for (const w of u.wings) w.rotation[u.float ? 'y' : 'z'] = u.float ? w.userData.s * (0.5 * Math.sin(t * 15)) : w.userData.s * (0.05 + Math.max(0, Math.sin(t * 14)) * 0.9 * a);
    if (u.eyes) u.eyes.scale.y = ((t + p) % 4.1) < 0.13 ? 0.1 : 1;
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
