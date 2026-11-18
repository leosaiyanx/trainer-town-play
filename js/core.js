// core.js — shared helpers: toon materials, primitive builder, tweens, audio.
(function () {
  const TT = window.TT = {};
  const $ = TT.$ = id => document.getElementById(id);

  // --- toon shading ramp ---
  const gc = document.createElement('canvas'); gc.width = 4; gc.height = 1;
  const gx = gc.getContext('2d');
  [120, 175, 225, 255].forEach((v, i) => { gx.fillStyle = `rgb(${v},${v},${v})`; gx.fillRect(i, 0, 1, 1); });
  const grad = new THREE.CanvasTexture(gc);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false;

  const mats = {};
  TT.grad = grad;
  TT.mat = (col, o) => {
    const k = col + (o ? JSON.stringify(o) : '');
    if (mats[k]) return mats[k];
    const m = mats[k] = new THREE.MeshToonMaterial(Object.assign({ color: col, gradientMap: grad }, o || {}));
    if (!o) m.userData.bake = true;
    return m;
  };
  const glows = {};
  TT.glow = col => glows[col] || (glows[col] = new THREE.MeshBasicMaterial({ color: col }));
  // one shared vertex-coloured toon material for every baked mesh
  TT.vmat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
  // characters and creatures: same toon look plus a soft rim of light so they pop off the background
  TT.cmat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
  TT.cmat.customProgramCacheKey = () => 'rim';
  TT.cmat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <output_fragment>', `float rimK = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
      outgoingLight += vec3(1.0, 0.96, 0.88) * smoothstep(0.5, 0.95, rimK) * 0.3;
      #include <output_fragment>`);
  };
  // ink outline: back faces pushed out along the normal
  TT.olMat = new THREE.MeshBasicMaterial({ color: 0x2b2438, side: THREE.BackSide });
  TT.olMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.016;'); };

  // foliage material: same look, but greenish vertices sway gently in the wind
  TT.uTime = { value: 0 };
  TT.swayMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
  TT.swayMat.customProgramCacheKey = () => 'sway';
  TT.swayMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = TT.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float gw = step(color.r * 1.1, color.g) * step(color.b * 1.1, color.g) * (0.22 + smoothstep(0.4, 3.2, position.y));
      transformed.x += sin(uTime * 1.3 + position.x * 0.35 + position.z * 0.27) * 0.11 * gw;
      transformed.z += cos(uTime * 1.05 + position.x * 0.3 - position.z * 0.2) * 0.08 * gw;`);
  };

  const flat = g => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
  const prism = (() => { // gable roof: ridge along x, base 1x1, height 1
    const A = [-.5, 0, .5], B = [.5, 0, .5], C = [.5, 0, -.5], D = [-.5, 0, -.5], E = [-.5, 1, 0], F = [.5, 1, 0];
    const v = [A, B, F, A, F, E, C, D, E, C, E, F, D, A, E, B, C, F, A, D, C, A, C, B].flat();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  })();
  TT.G = {
    sph: new THREE.SphereGeometry(1, 16, 11),
    sphM: new THREE.SphereGeometry(1, 10, 7),
    sphS: new THREE.SphereGeometry(1, 7, 5),
    sphT: new THREE.SphereGeometry(1, 5, 3),
    cylS: new THREE.CylinderGeometry(1, 1, 1, 8),
    cylT: new THREE.CylinderGeometry(1, 1, 1, 5),
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
    cone: new THREE.ConeGeometry(1, 1, 12),
    pyr: new THREE.ConeGeometry(1, 1, 4),
    disc: new THREE.CircleGeometry(1, 28),
    ico: flat(new THREE.IcosahedronGeometry(1, 1)),
    rock: flat(new THREE.IcosahedronGeometry(1, 0)),
    trunk: new THREE.CylinderGeometry(0.55, 1, 1, 7),
    cone8: flat(new THREE.ConeGeometry(1, 1, 8)),
    prism,
    torus: new THREE.TorusGeometry(1, 0.32, 8, 16),
    thinTorus: new THREE.TorusGeometry(1, 0.13, 6, 24)
  };
  TT.triStat = /tristat/.test(location.search) ? {} : null;
  const gc2 = {};
  TT.capsule = (r, len) => { const k = 'c' + r + '_' + len; return gc2[k] || (gc2[k] = new THREE.CapsuleGeometry(r, len, 3, r < 0.11 ? 7 : 9)); };
  TT.taper = (rt, rb, h) => { const k = 't' + rt + '_' + rb + '_' + h; return gc2[k] || (gc2[k] = new THREE.CylinderGeometry(rt, rb, h, Math.max(rt, rb) < 0.12 ? 8 : 12)); };
  // P(parent, geo, colorOrMaterial, [x,y,z], scale|[sx,sy,sz], [rx,ry,rz])
  TT.P = (parent, geo, col, p, s, r) => {
    // small parts get lighter geometry: nobody can see 400 triangles in a berry, but a slow tablet has to draw them
    if (s != null && (geo === 'sph' || geo === 'cyl')) {
      const big = typeof s === 'number' ? s : geo === 'cyl' ? Math.max(s[0], s[2]) : Math.max(s[0], s[1], s[2]);
      if (geo === 'sph') geo = big < 0.05 ? 'sphT' : big < 0.13 ? 'sphS' : big < 0.34 ? 'sphM' : 'sph';
      else geo = big < 0.06 ? 'cylT' : big < 0.22 ? 'cylS' : 'cyl';
    }
    const m = new THREE.Mesh(typeof geo === 'string' ? TT.G[geo] : geo, typeof col === 'number' ? TT.mat(col) : col);
    if (p) m.position.set(p[0], p[1], p[2]);
    if (s != null) { if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(s[0], s[1], s[2]); }
    if (r) m.rotation.set(r[0], r[1], r[2]);
    parent.add(m); return m;
  };

  // A smooth tube through a list of rings, top to bottom: [y, rx, rz, colour, w, x, z]. Each ring can have its own colour and
  // its own share "w" (0..1) of a second joint, which is what lets an arm or leg bend smoothly at the elbow or knee.
  const _tc = new THREE.Color();
  TT.tube = (rings, seg, arc) => {        // arc = [from, to] in radians makes an open shell (a vest, a fringe) instead of a closed tube
    seg = seg || 8; const n = rings.length, pos = [], vc = [], w2 = [], idx = [], per = arc ? seg + 1 : seg;
    for (const r of rings) { _tc.setHex(r[3]); for (let j = 0; j < per; j++) { const a = arc ? arc[0] + (arc[1] - arc[0]) * j / seg : j / seg * 6.2832; pos.push((r[5] || 0) + Math.cos(a) * r[1], r[0], (r[6] || 0) + Math.sin(a) * r[2]); vc.push(_tc.r, _tc.g, _tc.b); w2.push(r[4] || 0); } }
    const up = rings[0][0] < rings[n - 1][0];        // rings may be listed bottom-to-top; keep the surface facing outwards either way
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const a = i * per + j, b = i * per + (arc ? j + 1 : (j + 1) % seg), c = a + per, d = b + per; if (up) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
    if (!arc) for (const [ri, top0] of [[0, 1], [n - 1, 0]]) { const top = up ? !top0 : top0; const r = rings[ri], k = pos.length / 3; _tc.setHex(r[3]); pos.push(r[5] || 0, r[0] + (top ? 1 : -1) * Math.min(r[1], r[2]) * 0.35, r[6] || 0); vc.push(_tc.r, _tc.g, _tc.b); w2.push(r[4] || 0); for (let j = 0; j < seg; j++) { const a = ri * seg + j, b = ri * seg + (j + 1) % seg; if (top) idx.push(k, b, a); else idx.push(k, a, b); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('vc', new THREE.Float32BufferAttribute(vc, 3)); g.setAttribute('w2', new THREE.Float32BufferAttribute(w2, 1)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  // ---- baking: merge many primitive meshes into one vertex-coloured mesh ----
  const _v = new THREE.Vector3(), _n3 = new THREE.Matrix3();
  // ---- one shared picture ("atlas") for every drawn face, people and Pokémon alike. Because it lives in the one character
  // material, a face is part of the character's own mesh and costs no extra draw call. Cell 0 is plain white (everything
  // that is not a face points there). Small tablets use half-size cells. ----
  const CELL = navigator.deviceMemory && navigator.deviceMemory <= 4 ? 64 : 128, PER = 16, ATL = CELL * PER;
  const atlasC = document.createElement('canvas'); atlasC.width = atlasC.height = ATL;
  const ax = atlasC.getContext('2d'); ax.fillStyle = '#fff'; ax.fillRect(0, 0, ATL, ATL);
  TT.atlasTex = new THREE.CanvasTexture(atlasC); TT.atlasTex.generateMipmaps = false; TT.atlasTex.minFilter = THREE.LinearFilter; TT.atlasTex.magFilter = THREE.LinearFilter;
  TT.cmat.map = TT.atlasTex; TT.cmat.needsUpdate = true;
  let atlasN = 1; const cellOf = {};
  // draw(ctx) paints a 128x128 face once; returns the cell number to put on a mesh as userData.cell
  TT.faceCell = (key, draw) => {
    if (cellOf[key] != null) return cellOf[key];
    if (atlasN >= PER * PER) return 0;
    const n = atlasN++, cx = (n % PER) * CELL, cy = Math.floor(n / PER) * CELL;
    ax.save(); ax.beginPath(); ax.rect(cx, cy, CELL, CELL); ax.clip(); ax.translate(cx, cy); ax.scale(CELL / 128, CELL / 128); draw(ax); ax.restore();
    TT.atlasTex.needsUpdate = true; return cellOf[key] = n;
  };
  function merge(list, ao, uvs) { // list: [{mesh, matrix}]; ao darkens vertices near the ground for depth; uvs adds atlas coordinates
    let n = 0;
    const gs = list.map(e => { const g0 = e.mesh.geometry, g = g0.index ? (g0._ni || (g0._ni = g0.toNonIndexed())) : g0; n += g.attributes.position.count; if (TT.triStat) { let nm = '?'; for (const k in TT.G) if (TT.G[k] === g0) nm = k; if (nm === '?') nm = g0.type; const sc = e.mesh.scale, big = Math.max(sc.x, sc.y, sc.z); nm += big < 0.12 ? ':tiny' : big < 0.35 ? ':small' : ''; nm = (ao ? 'S ' : 'D ') + nm; TT.triStat[nm] = (TT.triStat[nm] || 0) + g.attributes.position.count / 3; } return g; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = uvs ? new Float32Array(n * 2) : null; let o = 0, q = 0;
    list.forEach((e, i) => {
      const g = gs[i], pa = g.attributes.position, na = g.attributes.normal, c = e.mesh.material.color, mx = e.matrix, vc = g.attributes.vc;
      _n3.getNormalMatrix(mx);
      if (uv) { const cell = e.mesh.userData.cell, ua = cell != null && g.attributes.uv, k = cell || 0, u0 = (k % PER) / PER, v0 = 1 - (Math.floor(k / PER) + 1) / PER, sz = 1 / PER; for (let j = 0; j < pa.count; j++, q += 2) { uv[q] = u0 + (ua ? 0.012 + 0.976 * ua.getX(j) : 0.5) * sz; uv[q + 1] = v0 + (ua ? 0.012 + 0.976 * ua.getY(j) : 0.5) * sz; } }
      for (let j = 0; j < pa.count; j++, o += 3) {
        _v.fromBufferAttribute(pa, j).applyMatrix4(mx); pos[o] = _v.x; pos[o + 1] = _v.y; pos[o + 2] = _v.z;
        _v.fromBufferAttribute(na, j).applyMatrix3(_n3).normalize(); nor[o] = _v.x; nor[o + 1] = _v.y; nor[o + 2] = _v.z;
        let k = 1; if (ao) { const y = Math.min(1, Math.max(0, pos[o + 1] / 1.5)); k = 0.84 + 0.16 * y * y * (3 - 2 * y); }
        if (vc) { col[o] = vc.getX(j) * k; col[o + 1] = vc.getY(j) * k; col[o + 2] = vc.getZ(j) * k; } else { col[o] = c.r * k; col[o + 1] = c.g * k; col[o + 2] = c.b * k; }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const m = new THREE.Mesh(g, TT.vmat); m.castShadow = true; return m;
  }
  const bakeable = ch => ch.isMesh && !ch.isInstancedMesh && ch.material.userData.bake && !ch.userData.keep;
  // keeps the group hierarchy (for rigs): merges each group's own meshes; ols collects outline meshes
  TT.bakeNode = function (node, ol, ols) {
    const ms = [];
    for (const ch of node.children.slice()) {
      if (bakeable(ch)) { ch.updateMatrix(); ms.push({ mesh: ch, matrix: ch.matrix }); }
      else if (!ch.isMesh && !ch.isSprite && ch.children.length) TT.bakeNode(ch, ol && !ch.userData.noOl, ols);
    }
    if (!ms.length) return;
    const m = merge(ms, false, true); m.material = TT.cmat; ms.forEach(e => node.remove(e.mesh)); node.add(m);
    // the baked mesh (and its ink outline) sit exactly on their rig joint, so they borrow its matrix instead of computing their own
    const share = o => { o.matrixAutoUpdate = false; o.matrixWorldAutoUpdate = false; o.matrixWorld = node.matrixWorld; };
    share(m);
    if (ol && !node.userData.noOl) { const o = new THREE.Mesh(m.geometry, TT.olMat); m.add(o); share(o); if (ols) ols.push(o); }
  };
  // Characters and creatures: the whole rig becomes ONE skinned mesh (plus one for the ink outline). Each part follows its own
  // joint rigidly, so it looks exactly like separate parts — but a character is 2 draw calls instead of 15-30, which is what
  // slow tablets care about most.
  const noop = () => { };
  TT.bakeRig = function (root, ols) {
    root.updateMatrixWorld(true);
    const bones = [], main = [], line = [];
    const bidx = node => { let i = bones.indexOf(node); if (i < 0) { i = bones.length; bones.push(node); } return i; };
    const walk = (node, ol) => {
      for (const ch of node.children.slice()) {
        // a mesh may name a second joint (userData.bone2) and carry a per-vertex share "w2" of it: that part bends smoothly
        if (bakeable(ch)) { const e = { mesh: ch, matrix: ch.matrixWorld.clone(), bi: bidx(node), b2: ch.userData.bone2 ? bidx(ch.userData.bone2) : -1 }; main.push(e); if (ol) line.push(e); }
        else if (!ch.isMesh && !ch.isSprite && ch.children.length) walk(ch, ol && !ch.userData.noOl);
      }
    };
    walk(root, !root.userData.noOl);
    if (!main.length) return;
    main.forEach(e => e.mesh.parent.remove(e.mesh));
    const skel = new THREE.Skeleton(bones, bones.map(b => new THREE.Matrix4().copy(b.matrixWorld).invert()));
    const mk = (list, mat) => {
      const g = merge(list, false, mat === TT.cmat).geometry, n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); let o = 0;
      for (const e of list) { const g0 = e.mesh.geometry, gn = g0.index ? g0._ni : g0, cnt = gn.attributes.position.count, wa = e.b2 >= 0 && gn.attributes.w2; for (let j = 0; j < cnt; j++, o += 4) { const w = wa ? wa.getX(j) : 0; si[o] = e.bi; sw[o] = 1 - w; if (wa) { si[o + 1] = e.b2; sw[o + 1] = w; } } }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.userData.own = true;
      const m = new THREE.SkinnedMesh(g, mat); m.castShadow = true; m.frustumCulled = false; m.bindMode = 'detached';
      m.bind(skel, new THREE.Matrix4());
      // vertices are stored in world-at-bind space and the joints carry all movement, so the mesh itself stays at identity forever
      m.matrixAutoUpdate = false; m.matrixWorldAutoUpdate = false; m.updateMatrixWorld = noop;
      root.add(m); return m;
    };
    root.userData.skin = mk(main, TT.cmat);
    if (line.length) { const o = mk(line, TT.olMat); if (ols) ols.push(o); }
  };
  // free the GPU memory of a character that is gone for good (wild Pokémon that left, battle models, other players)
  TT.dispose = root => { if (!root) return; root.traverse(o => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose(); if (o.geometry && o.geometry.userData.own) o.geometry.dispose(); if (o.material && o.material.userData && o.material.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); };
  // flattens a whole static subtree into ONE mesh (root must be at its final transform's parent space)
  TT.bakeDeep = function (root) {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), ms = [];
    root.traverse(ch => { if (bakeable(ch)) ms.push({ mesh: ch, matrix: new THREE.Matrix4().multiplyMatrices(inv, ch.matrixWorld) }); });
    if (!ms.length) return null;
    ms.forEach(e => e.mesh.parent.remove(e.mesh));
    const m = merge(ms, true); root.add(m); return m;
  };
  // scenery that never moves: work out its matrices once, then skip it every frame
  TT.freeze = o => { o.updateMatrixWorld(true); o.matrixWorldAutoUpdate = false; o.traverse(c => { c.matrixAutoUpdate = false; }); return o; };
  TT.rand = (a, b) => a + Math.random() * (b - a);
  TT.pick = a => a[(Math.random() * a.length) | 0];
  TT.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  TT.angLerp = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; };

  // --- tweens driven by the game loop (deterministic, works when rAF is throttled) ---
  const tweens = [];
  TT.tween = (dur, fn) => new Promise(res => { tweens.push({ t: 0, dur: Math.max(dur, 0.001), fn, res }); });
  TT.wait = s => TT.tween(s, null);
  TT.updateTweens = dt => {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i]; w.t += dt;
      const k = Math.min(1, w.t / w.dur);
      if (w.fn) w.fn(k);
      if (k >= 1) { tweens.splice(i, 1); w.res(); }
    }
  };
  TT.ease = k => k * k * (3 - 2 * k);

  // --- text label sprite ---
  TT.label = (text, bg) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const x = c.getContext('2d');
    x.font = '800 34px "Avenir Next","Trebuchet MS",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const w = Math.min(250, x.measureText(text).width + 30);
    x.fillStyle = bg || 'rgba(35,50,74,.85)';
    x.beginPath(); (x.roundRect ? x.roundRect((256 - w) / 2, 8, w, 48, 24) : x.rect((256 - w) / 2, 8, w, 48)); x.fill();
    x.fillStyle = '#fff'; x.fillText(text, 128, 34);
    const t = new THREE.CanvasTexture(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.set(2.4, 0.6, 1); s.renderOrder = 10;
    return s;
  };

  // --- audio: synth voices, noise, echo; original tunes (no samples, no network) ---
  let ac = null, master, musicBus, sfxBus, voiceBus, echo, noiseBuf; TT.muted = false;
  TT.audioInit = () => {
    if (!ac) {
      // Small tablets get a lighter band (see bandInit) and a roomier sound buffer, so music never crackles or drops out.
      try { if (navigator.deviceMemory && navigator.deviceMemory <= 4) TT.audioLite = true; const j = JSON.parse(localStorage.getItem('tt_q')); if (j && j.q < 2) TT.audioLite = true; } catch (e) { }
      const AC = window.AudioContext || window.webkitAudioContext;
      try { ac = TT.audioLite ? new AC({ latencyHint: 'playback' }) : new AC(); } catch (e) { try { ac = new AC(); } catch (e2) { return; } }
      master = ac.createGain(); master.gain.value = TT.muted ? 0 : 0.9;
      const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.gain.value = 0.42; musicBus.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.85; sfxBus.connect(master);
      voiceBus = ac.createGain(); voiceBus.gain.value = 1.5; voiceBus.connect(master);
      echo = ac.createDelay(0.5); echo.delayTime.value = 0.19;
      const fb = ac.createGain(); fb.gain.value = 0.28; const eg = ac.createGain(); eg.gain.value = 0.3;
      echo.connect(fb); fb.connect(echo); echo.connect(eg); eg.connect(musicBus);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    wake();
  };
  // The sound engine can start asleep (after a one-tap update there is no touch yet) or be put to sleep by the system.
  // Wake it on every touch or key, when the page comes back, and from the music timer.
  const wake = () => { if (ac && ac.state !== 'running' && !TT.paused && !document.hidden) try { const p = ac.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } };
  for (const ev of ['pointerdown', 'touchstart', 'touchend', 'keydown']) document.addEventListener(ev, () => { if (ac) wake(); else TT.audioInit(); }, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  TT.audioDbg = () => ac ? { state: ac.state, lite: !!TT.audioLite, rate: ac.sampleRate, base: ac.baseLatency, out: ac.outputLatency, t: +ac.currentTime.toFixed(2), muted: TT.muted, voiceOn: TT.voiceOn, vox: TT.VOX ? Object.keys(TT.VOX.lines).length : 0, music: cur, clips: Object.keys(clips).length, vfail, vplayed } : { state: 'none' };
  TT.audioPause = on => { if (ac) try { on ? ac.suspend() : ac.resume(); } catch (e) { } };
  TT.setMuted = m => { TT.muted = m; if (master) master.gain.value = m ? 0 : 0.9; };
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  function voice(bus, type, f, t, d, vol, o) {
    o = o || {};
    const os = ac.createOscillator(), g = ac.createGain(), a = o.attack || 0.006;
    os.type = type; os.frequency.setValueAtTime(f, t);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + d);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = f * 0.011; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + d + 0.05); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol * (o.sus == null ? 0.7 : o.sus), t + Math.max(a + 0.001, d * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    os.connect(g); g.connect(bus); if (o.echo) g.connect(echo);
    os.start(t); os.stop(t + d + 0.03);
  }
  function noise(bus, t, d, vol, ftype, f0, f1, q) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = ftype; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d); fl.Q.value = q || 1;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  }
  const seq = (t, ns, step, type, vol, o) => ns.forEach((n, i) => { if (n) voice(sfxBus, type, N(n), t + i * step, step * 1.9, vol, o); });
  const fx = {
    blip: t => voice(sfxBus, 'square', 880, t, 0.05, 0.05),
    pick: t => seq(t, [84, 88, 91], 0.06, 'square', 0.08),
    hit: t => { noise(sfxBus, t, 0.2, 0.55, 'lowpass', 1400, 200); voice(sfxBus, 'sine', 170, t, 0.22, 0.5, { slide: 45 }); },
    whoosh: t => noise(sfxBus, t, 0.2, 0.3, 'bandpass', 500, 2200, 2),
    throw: t => { noise(sfxBus, t, 0.25, 0.2, 'bandpass', 600, 2400, 2); voice(sfxBus, 'triangle', 480, t, 0.24, 0.12, { slide: 1150 }); },
    open: t => { noise(sfxBus, t, 0.22, 0.25, 'highpass', 2500, 6000); voice(sfxBus, 'sine', 1300, t, 0.25, 0.14, { slide: 340 }); },
    zap: t => { for (let i = 0; i < 7; i++) voice(sfxBus, 'sawtooth', 500 + Math.random() * 1500, t + i * 0.045, 0.05, 0.13); noise(sfxBus, t, 0.36, 0.22, 'highpass', 3500, 7000); },
    fire: t => { noise(sfxBus, t, 0.55, 0.45, 'lowpass', 350, 2600); voice(sfxBus, 'sawtooth', 90, t, 0.5, 0.12, { slide: 180 }); },
    water: t => { noise(sfxBus, t, 0.5, 0.4, 'bandpass', 450, 1900, 3); voice(sfxBus, 'sine', 380, t, 0.45, 0.12, { slide: 900 }); },
    leaf: t => { for (let i = 0; i < 4; i++) noise(sfxBus, t + i * 0.09, 0.1, 0.25, 'highpass', 3500 + i * 500, 7000); },
    wind: t => noise(sfxBus, t, 0.55, 0.4, 'bandpass', 700, 2600, 1.5),
    psy: t => { voice(sfxBus, 'sine', 520, t, 0.6, 0.15, { slide: 860, vib: 14 }); voice(sfxBus, 'sine', 780, t + 0.05, 0.55, 0.1, { slide: 1300, vib: 11 }); },
    shake: t => { voice(sfxBus, 'square', 240, t, 0.05, 0.1); noise(sfxBus, t, 0.05, 0.2, 'bandpass', 1800, 0, 4); },
    caught: t => { seq(t, [72, 76, 79, 84, 0, 88], 0.09, 'square', 0.09, { echo: 1 }); seq(t, [64, 67, 72, 76, 0, 79], 0.09, 'triangle', 0.08); },
    win: t => { seq(t, [79, 84, 88, 91, 0, 88, 91, 0, 96], 0.11, 'square', 0.09, { echo: 1 }); seq(t, [72, 76, 79, 84, 0, 79, 84, 0, 88], 0.11, 'triangle', 0.09); seq(t, [48, 0, 55, 0, 0, 52, 55, 0, 60], 0.11, 'sawtooth', 0.06); },
    level: t => { seq(t, [76, 79, 84, 88], 0.08, 'square', 0.09, { echo: 1 }); seq(t, [72, 76, 79, 84], 0.08, 'triangle', 0.08); },
    evo: t => { seq(t, [60, 64, 67, 72, 76, 79, 84, 88, 91, 96], 0.13, 'triangle', 0.1, { echo: 1 }); seq(t + 0.065, [72, 76, 79, 84, 88, 91, 96, 100], 0.13, 'sine', 0.06, { vib: 8 }); },
    bad: t => seq(t, [64, 60, 55, 52], 0.13, 'sawtooth', 0.06),
    heal: t => { seq(t, [72, 76, 79, 84, 0, 79, 84, 88], 0.12, 'triangle', 0.1, { echo: 1 }); seq(t, [60, 0, 67, 0, 0, 64, 0, 72], 0.12, 'sine', 0.09); },
    star: t => seq(t, [84, 88, 91, 96, 100, 103, 108], 0.08, 'triangle', 0.09, { echo: 1 }),
    rocket: t => seq(t, [50, 53, 50, 53, 56, 57], 0.12, 'sawtooth', 0.07),
    battle: t => { seq(t, [88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77], 0.035, 'sawtooth', 0.07); noise(sfxBus, t, 0.5, 0.25, 'highpass', 800, 6000); voice(sfxBus, 'sine', 110, t + 0.42, 0.35, 0.4, { slide: 50 }); }
  };
  TT.sfx = {};
  for (const k in fx) TT.sfx[k] = () => { if (ac && !TT.muted) try { fx[k](ac.currentTime + 0.01); } catch (e) { } };
  TT.sfx.up = k => { if (ac && !TT.muted) try { const t = ac.currentTime + 0.01, f = 392 * Math.pow(2, k * 1.25); voice(sfxBus, 'square', f, t, 0.08, 0.07, { slide: f * 1.12 }); voice(sfxBus, 'triangle', f * 2, t, 0.1, 0.06); } catch (e) { } };          // a tick whose pitch climbs with k (0…1): the power taps in battle
  const MOVE = { fire: 'fire', water: 'water', grass: 'leaf', flying: 'wind', psychic: 'psy', ghost: 'psy', electric: 'zap' };
  TT.sfx.move = type => (TT.sfx[MOVE[type]] || TT.sfx.whoosh)();
  // creature voices: a short synthetic call, different per species
  // ---- recorded voices (voice/*.m4a, made by tools/make_voices.py) ----
  TT.voiceOn = true; try { TT.voiceOn = localStorage.getItem('tt_voice') !== '0'; } catch (e) { }
  TT.setVoice = on => { TT.voiceOn = on; try { localStorage.setItem('tt_voice', on ? '1' : '0'); } catch (e) { } if (!on) TT.hush(); };
  // the list of recorded lines; if the first try fails (weak Wi-Fi), keep trying instead of staying silent all session
  TT.VOX = null; let voxAt = 0;
  const loadVox = () => { if (TT.VOX || performance.now() - voxAt < 4000) return; voxAt = performance.now(); fetch('voice/index.json').then(r => r.ok ? r.json() : null).then(j => { if (j && j.lines) TT.VOX = j; }).catch(() => { }); };
  voxAt = -1e9; loadVox();
  const clips = {}; let vsrc = null, vtok = 0, vfail = 0, vplayed = 0;
  // a clip that failed to download is forgotten so the next try can succeed
  const loadClip = f => clips[f] || (clips[f] = fetch('voice/' + f).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => new Promise((res, rej) => ac.decodeAudioData(b, res, rej))).catch(() => { vfail++; delete clips[f]; return null; }));
  // fetch a whole conversation's clips up front, so each line speaks the moment it appears
  TT.preVoice = (who, text) => { loadVox(); const V = TT.VOX; if (!ac || !V || TT.muted || !TT.voiceOn) return; const key = TT.voiceKey(who, text); if (V.lines[key] != null) loadClip(key + '.m4a'); };
  function playClip(buf, rate, bus) { const s = ac.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate || 1; s.connect(bus); s.start(); return s; }
  TT.voiceKey = (who, text) => { const s = who + '|' + text; let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  // true when a line can be spoken as written: it has a recording, or voices are off anyway, or it is a Pokémon's action written in brackets
  TT.canSay = (who, text) => { const V = TT.VOX; return !V || TT.muted || !TT.voiceOn || V.lines[TT.voiceKey(who, text)] != null || text[0] === '('; };          // "(Pikachu broke free!)" lines are sounds, not speech
  const duck = on => { if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.16 : 0.42, ac.currentTime, 0.15); };
  TT.hush = () => { vtok++; if (vsrc) { try { vsrc.stop(); } catch (e) { } vsrc = null; duck(false); } };
  // speak one dialogue line; a Pokémon speaker (or a line with no recording) falls back to its cry
  TT.speak = (who, text) => {
    TT.hush(); loadVox(); if (!ac || TT.muted || !TT.voiceOn) return;
    wake();
    const V = TT.VOX, key = TT.voiceKey(who, text), sp = (who || '').toLowerCase();
    if (!V || V.lines[key] == null) { if (TT.DEX && TT.DEX[sp]) TT.cry(sp); else if (V) (TT.voiceMiss = TT.voiceMiss || []).push(who + '|' + text); return; }
    const tok = ++vtok;
    loadClip(key + '.m4a').then(buf => { if (!buf || tok !== vtok) return; duck(true); vplayed++; const s = vsrc = playClip(buf, V.lines[key], voiceBus); s.onended = () => { if (vsrc === s) { vsrc = null; duck(false); } }; });
  };
  TT.cry = (sp, pitch) => {
    if (!ac || TT.muted) return; const t = ac.currentTime + 0.01, k = pitch || 1;
    const V = TT.VOX, nc = V && V.cries && V.cries[sp];
    if (nc && TT.voiceOn) { const f = 'cry_' + sp + '_' + ((Math.random() * nc) | 0) + '.m4a'; if (clips[f] && clips[f].buf) { playClip(clips[f].buf, ((V.cryRates && V.cryRates[sp]) || V.cryRate) * (k < 1 ? 0.8 : 1), voiceBus); return; } const pr = loadClip(f); pr.then(b => { pr.buf = b; }); }
    if (sp === 'pikachu') { voice(sfxBus, 'square', 950 * k, t, 0.09, 0.1, { slide: 1350 * k }); voice(sfxBus, 'square', 1150 * k, t + 0.11, 0.12, 0.1, { slide: 800 * k }); voice(sfxBus, 'square', 1000 * k, t + 0.27, 0.2, 0.09, { slide: 620 * k, vib: 18 }); return; }
    let h = 7; for (let i = 0; i < sp.length; i++) h = (h * 31 + sp.charCodeAt(i)) >>> 0;
    const n = 2 + (h % 2), type = h & 4 ? 'square' : 'sawtooth';
    for (let i = 0; i < n; i++) { const f = (380 + ((h >> (i * 3)) & 7) * 115) * k; voice(sfxBus, type, f, t + i * 0.12, 0.14, 0.09, { slide: f * (0.65 + ((h >> (i * 2 + 9)) & 3) * 0.28), vib: h & 8 ? 16 : 0 }); }
  };

  // --- music: a small band in code — lead synth, bass, guitar, pads and drums, with reverb.
  //     Every tune here is original, written for this game.
  const CH = { C: [0, 0], D: [2, 0], E: [4, 0], F: [5, 0], G: [7, 0], A: [9, 0], B: [11, 0], Bb: [10, 0], Eb: [3, 0], Ab: [8, 0],
    Cm: [0, 1], 'C#m': [1, 1], Dm: [2, 1], Em: [4, 1], Fm: [5, 1], 'F#m': [6, 1], Gm: [7, 1], Am: [9, 1], Bm: [11, 1] };
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parse(str) {
    const ev = {}, tk = str.trim().split(/\s+/).filter(x => x !== '|'); let lastEv = null;
    tk.forEach((x, i) => { if (x === '-') { if (lastEv) lastEv.len++; } else if (x === '.') lastEv = null; else { const m = /^([A-G])(#|b)?(\d)$/.exec(x); lastEv = ev[i] = { n: PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12, len: 1 }; } });
    return { ev, len: tk.length };
  }
  const TUNES = {
    title: { bpm: 148, style: 3, lv: 0.07, ch: 'D D G A D D G A Bm G D A Bm G A D', lead:
      'D4 . F#4 A4 D5 - C#5 D5 | E5 - D5 . A4 - - . | B4 . D5 . G5 - F#5 E5 | F#5 - E5 . C#5 - - . | D5 . F#5 . A5 - G5 F#5 | E5 . D5 . F#5 - E5 D5 | B4 . D5 . E5 - D5 B4 | A4 - - . E5 - - . | ' +
      'F#5 . F#5 E5 D5 . B4 . | G4 . B4 . D5 - E5 . | F#5 . F#5 E5 D5 . A4 . | C#5 . E5 . A5 - - . | B5 . A5 . F#5 . D5 . | G5 . F#5 . E5 . D5 . | E5 . F#5 . G5 . A5 . | D6 - - - - - - .' },
    town: { bpm: 126, style: 0, lv: 0.055, ch: 'C G Am F C G F G Am F C G Am F G G', lead:
      'E5 . G5 . C6 . B5 A5 | G5 . D5 . G5 . A5 B5 | C6 . A5 . E5 . A5 G5 | F5 . A5 . C6 - - . | E5 . G5 . C6 . D6 E6 | D6 . B5 . G5 . A5 B5 | C6 . A5 . F5 . A5 C6 | B5 . D6 . G5 - - . | ' +
      'A5 . C6 . E6 . D6 C6 | A5 . C6 . F6 . E6 D6 | E6 . C6 . G5 . C6 E6 | D6 - - . B5 . G5 . | A5 . C6 . E6 . D6 C6 | C6 . A5 . F5 . G5 A5 | B5 . G5 . D6 . B5 . | G5 A5 B5 D6 G6 - - .' },
    city: { bpm: 128, style: 7, lv: 0.055, ch: 'F Dm Bb C F Dm Gm C', lead:
      'A5 . C6 A5 F5 . G5 . | A5 . F5 . D5 - - . | D6 . Bb5 . F5 . G5 A5 | Bb5 - A5 . G5 - - . | A5 . C6 . F6 . E6 D6 | C6 . A5 . F5 . A5 . | Bb5 . G5 . D6 . C6 Bb5 | A5 - G5 . E5 - - .' },
    world: { bpm: 112, style: 4, lv: 0.055, ch: 'C G Am F C G F G Am Em F C Dm G C G', lead:
      'E5 - G5 . C6 - - . | D6 - B5 . G5 - - . | C6 . B5 . A5 - E5 . | F5 - A5 . C6 - - . | E6 - D6 . C6 . G5 . | B5 . C6 . D6 - - . | C6 . A5 . F5 . A5 . | G5 - - - - - . . | ' +
      'A5 - C6 . E6 - D6 C6 | B5 - G5 . E5 - - . | F5 . A5 . C6 . F6 . | E6 - - . C6 - - . | D6 . F6 . A6 - G6 F6 | G6 - D6 . B5 - - . | C6 . E6 . G6 . E6 . | D6 - - - B5 - - .' },
    battle: { bpm: 172, style: 1, lv: 0.06, ch: 'Am Am F G Am Am F E', lead:
      'A5 . A5 C6 E6 . D6 C6 | B5 . C6 . A5 . E5 . | F5 . F5 A5 C6 . B5 A5 | G5 . B5 . D6 . B5 . | A5 . A5 C6 E6 . G6 E6 | D6 . C6 . A5 . C6 . | F6 . E6 . C6 . A5 . | G#5 . B5 . E6 . G#6 .' },
    boss: { bpm: 184, style: 5, lv: 0.07, bright: 7, ch: 'Am Am F G Am Am F E Dm Dm Am Am F G E E', lead:
      'A4 . A4 . C5 . B4 A4 | E5 - D5 . C5 . B4 . | F4 . A4 . C5 . F5 . | G5 - F5 . E5 . D5 . | A5 . G5 . E5 . C5 . | D5 . E5 . A4 - - . | C5 . D5 . F5 . E5 . | G#4 . B4 . E5 - - . | ' +
      'D5 . F5 . A5 - G5 F5 | E5 . D5 . A4 - - . | C5 . E5 . A5 - G5 E5 | G5 - E5 . A4 . . . | F5 . E5 . D5 . C5 . | B4 . C5 . D5 . G5 . | G#5 - - . E5 - - . | B4 . D5 . E5 . G#5 .' },
    goku: { bpm: 168, style: 6, lv: 0.07, bright: 7, wave: ['sawtooth', 'sawtooth'], ch: 'E E A B E C D B C#m A E B C#m A B E', lead:
      'E4 . G#4 B4 E5 - - . | D#5 . E5 . F#5 - E5 . | C#5 . E5 . A5 - G#5 F#5 | G#5 - F#5 . D#5 - - . | E5 . E5 F#5 G#5 . B5 . | G5 - E5 . C5 - - . | F#5 . A5 . D6 - C#6 B5 | B5 - - . F#5 G#5 A#5 B5 | ' +
      'G#5 . G#5 F#5 E5 . C#5 . | E5 . A5 . C#6 - B5 A5 | B5 - G#5 . E5 - - . | F#5 . G#5 . A5 . B5 . | C#6 - B5 . G#5 . E5 . | A5 . B5 . C#6 . E6 . | D#6 - - . B5 - - . | E6 - - - - - - .' },
    volcano: { bpm: 112, style: 4, lv: 0.06, ch: 'Dm Dm Bb C Dm Dm Gm A', lead:
      'D5 . F5 . A5 - G5 F5 | E5 . D5 . A4 - - . | D5 . F5 . Bb5 - A5 G5 | G5 - E5 . C5 - - . | F5 . A5 . D6 - C6 A5 | A5 - F5 . D5 - - . | Bb5 . A5 . G5 . D5 . | C#5 . E5 . A5 - - .' },
    dragon: { bpm: 176, style: 5, lv: 0.07, bright: 7, wave: ['sawtooth', 'square'], ch: 'Em Em C D Em Em C B Am Am Em Em C D B B', lead:
      'E5 . E5 . G5 . F#5 E5 | B5 - A5 . G5 . F#5 . | C5 . E5 . G5 . C6 . | D6 - C6 . B5 . A5 . | E6 . D6 . B5 . G5 . | A5 . B5 . E5 - - . | G5 . A5 . C6 . B5 . | D#5 . F#5 . B5 - - . | ' +
      'A5 . C6 . E6 - D6 C6 | B5 . A5 . E5 - - . | G5 . B5 . E6 - D6 B5 | D6 - B5 . E5 . . . | C6 . B5 . A5 . G5 . | F#5 . G5 . A5 . D6 . | D#6 - - . B5 - - . | F#5 . A5 . B5 . D#6 .' },
    rocket: { bpm: 138, style: 2, lv: 0.055, ch: 'Dm Dm Bb A', lead: 'D5 . F5 . A5 . G#5 A5 | D6 . C6 . A5 . F5 . | Bb5 . D6 . F6 . D6 . | A5 . C#6 . E6 . A6 .' },
    // the Cloud Peaks (calm and airy) and Sunset Island (sunny and bouncy)
    peaks: { bpm: 96, style: 3, lv: 0.055, ch: 'F C Dm Bb F C Bb C', lead:
      'A5 - - C6 F6 - - . | E6 - - C6 G5 - - . | F5 - A5 . D6 - - . | D6 - - Bb5 F5 - - . | A5 - - C6 F6 - A6 . | G6 - - E6 C6 - - . | D6 - Bb5 . F5 - G5 . | G5 - - E5 C5 - - .' },
    island: { bpm: 126, style: 1, lv: 0.055, ch: 'C F G C Am F G G', lead:
      'E5 . G5 . C6 . G5 E5 | F5 . A5 . C6 - A5 . | G5 . B5 . D6 . B5 G5 | E6 - C6 . G5 - - . | A5 . C6 . E6 . C6 A5 | F5 . A5 . C6 - D6 . | D6 . B5 . G5 . B5 . | D6 - - . G5 - - .' },
    // the Sky Fortress: a low, sneaky march. And Giovanni's own battle theme: heavy and fast, in a minor key.
    fortress: { bpm: 104, style: 4, lv: 0.055, ch: 'Cm Cm Ab G Cm Cm Fm G', lead:
      'C5 . . Eb5 G5 . F5 . | Eb5 . D5 . C5 - - . | Ab4 . C5 . Eb5 . Ab5 . | G5 - F5 . D5 - - . | C5 . . Eb5 G5 . Bb5 . | Ab5 . G5 . Eb5 - - . | F5 . Ab5 . C6 . Ab5 . | G5 . B4 . D5 - - .' },
    giovanni: { bpm: 178, style: 5, lv: 0.07, bright: 7, wave: ['sawtooth', 'square'], ch: 'Cm Cm Ab Bb Cm Cm Ab G Fm Fm Cm Cm Ab Bb G G', lead:
      'C5 . C5 . Eb5 . D5 C5 | G5 - F5 . Eb5 . D5 . | Ab4 . C5 . Eb5 . Ab5 . | Bb5 - Ab5 . G5 . F5 . | C6 . Bb5 . G5 . Eb5 . | F5 . G5 . C5 - - . | Eb5 . F5 . Ab5 . G5 . | B4 . D5 . G5 - - . | ' +
      'F5 . Ab5 . C6 - Bb5 Ab5 | G5 . F5 . C5 - - . | Eb5 . G5 . C6 - Bb5 G5 | Bb5 - G5 . C5 . . . | Ab5 . G5 . F5 . Eb5 . | D5 . Eb5 . F5 . Bb5 . | B5 - - . G5 - - . | D5 . F5 . G5 . B5 .' }
  };
  for (const k in TUNES) { const tn = TUNES[k], p = parse(tn.lead); tn.ev = p.ev; tn.len = p.len; tn.ch = tn.ch.split(' ').map(c => CH[c]); }

  // instruments
  let revIn = null, distIn = null;
  function bandInit() {
    if (revIn) return;
    revIn = ac.createGain();
    if (TT.audioLite) { revIn.gain.value = 0.5; revIn.connect(echo); }      // small tablets: a simple echo instead of the heavy hall reverb
    else {
      const rv = ac.createConvolver(), len = ac.sampleRate * 1.6 | 0, b = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
      rv.buffer = b; revIn.gain.value = 0.28; revIn.connect(rv); rv.connect(musicBus);
    }
    const ws = ac.createWaveShaper(), cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) cv[i] = Math.tanh((i / 512 - 1) * 7);
    ws.curve = cv; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; const og = ac.createGain(); og.gain.value = 0.13;
    distIn = ac.createGain(); distIn.connect(ws); ws.connect(lp); lp.connect(og); og.connect(musicBus); og.connect(revIn);
  }
  const env = (g, t, vol, a, d, sus) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol * sus, t + Math.max(a + 0.001, d * 0.65)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.06); };
  function osc(type, f, t, d, dest, det) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(t + d + 0.1); return o; }
  function lead(n, t, d, vol, tn) {
    const f0 = N(n), g = ac.createGain(), fl = ac.createBiquadFilter();
    fl.type = 'lowpass'; fl.Q.value = 2.5; fl.frequency.setValueAtTime(f0 * 1.4, t); fl.frequency.linearRampToValueAtTime(f0 * (tn.bright || 5), t + 0.035); fl.frequency.exponentialRampToValueAtTime(f0 * 2.1, t + Math.max(0.09, d));
    env(g, t, vol, 0.012, d, 0.78);
    (TT.audioLite ? (tn.wave || ['square']).slice(0, 1) : tn.wave || ['square', 'sawtooth']).forEach((w, k) => {
      const o = osc(w, f0, t, d, fl, k ? 9 : -6);
      if (d > 0.3 && !TT.audioLite) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f0 * 0.013, t + 0.22); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + 0.1); }
    });
    fl.connect(g); g.connect(musicBus); g.connect(revIn); g.connect(echo);
  }
  function bass(n, t, d, vol) { const g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 650; env(g, t, vol, 0.006, d, 0.7); osc('sawtooth', N(n), t, d, fl); osc('sine', N(n), t, d, g); fl.connect(g); g.connect(musicBus); }
  function gtr(n, t, d, vol) { const g = ac.createGain(); env(g, t, vol, 0.004, d, 0.85); for (const k of TT.audioLite ? [0, 7] : [0, 7, 12]) osc('sawtooth', N(n + k), t, d, g, (k - 6) * 1.6); g.connect(distIn); }
  function pad(ns, t, d, vol) { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.4, d * 0.3)); g.gain.setValueAtTime(vol, t + d * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.3); for (const n of ns) { osc('triangle', N(n), t, d + 0.3, g, -7); if (!TT.audioLite) osc('sine', N(n + 12), t, d + 0.3, g, 6); } g.connect(musicBus); g.connect(revIn); }
  function pluck(n, t, d, vol, type) { const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); osc(type || 'triangle', N(n), t, d, g); g.connect(musicBus); g.connect(revIn); }
  function epiano(ns, t, d, vol) { const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); for (const n of ns) { osc('sine', N(n), t, d, g); osc('triangle', N(n + 12), t, d * 0.4, g); } g.connect(musicBus); g.connect(revIn); }
  const kick = (t, v) => { voice(musicBus, 'sine', 155, t, 0.22, 0.62 * v, { slide: 42, sus: 0.6 }); noise(musicBus, t, 0.02, 0.18 * v, 'highpass', 2500); };
  const snare = (t, v) => { noise(musicBus, t, 0.17, 0.34 * v, 'bandpass', 1900, 0, 0.7); voice(musicBus, 'triangle', 195, t, 0.09, 0.2 * v, { slide: 130 }); };
  const hat = (t, v, open) => noise(musicBus, t, open ? 0.24 : 0.045, 0.1 * v, 'highpass', 8200);
  const crash = (t, v) => noise(musicBus, t, 1.4, 0.15 * v, 'highpass', 5200, 3200);
  const tom = (n, t, v) => voice(musicBus, 'sine', N(n), t, 0.26, 0.42 * v, { slide: N(n) * 0.55 });

  function playStep(tn, i, t, sd) {
    const bar = (i / 8) | 0, s = i % 8, c = tn.ch[bar % tn.ch.length], r = c[0], tri = [r, r + (c[1] ? 3 : 4), r + 7], st = tn.style, e = tn.ev[i];
    const fill = bar % 8 === 7, phrase = bar % 4 === 0 && s === 0;
    if (e) lead(e.n, t, sd * e.len * 0.95, tn.lv || 0.06, tn);
    if (st === 0) {            // town: bouncy and sunny
      if (s % 2 === 0) bass(36 + r + (s % 4 ? 7 : 0), t, sd * 1.6, 0.16);
      pluck(60 + tri[[0, 1, 2, 1, 0, 1, 2, 1][s]] + 12, t, sd * 1.2, 0.03);
      if (s === 0) pad(tri.map(x => 60 + x), t, sd * 8, 0.018);
      if (s === 0 || s === 4) kick(t, 0.7); if (s === 2 || s === 6) snare(t, 0.5); if (s % 2) hat(t, 0.8);
    } else if (st === 1) {     // wild battle: driving
      bass(36 + r + (s % 2 ? 12 : 0), t, sd * 0.85, 0.15);
      gtr(40 + r, t, sd * 0.7, 0.5);
      pluck(72 + tri[[0, 2, 1, 2][s % 4]], t, sd * 0.6, 0.025, 'square');
      if (s === 0 || s === 3 || s === 4) kick(t, 0.9); if (s === 2 || s === 6) snare(t, 0.9); hat(t, 1); hat(t + sd / 2, 0.5);
      if (phrase) crash(t, 0.8);
    } else if (st === 2) {     // Team Rocket: sneaky
      if (s === 0 || s === 3 || s === 4 || s === 6) bass(36 + (s === 3 ? tri[2] : r), t, sd * 0.6, 0.18);
      if (s % 2) pluck(60 + tri[(s >> 1) % 3], t, sd * 0.4, 0.035, 'square');
      if (s === 0 || s === 4) kick(t, 0.8); if (s === 2 || s === 6) snare(t, 0.6); if (s % 2) hat(t, 0.8);
    } else if (st === 3) {     // title: big adventure anthem
      bass(36 + r, t, sd * 0.85, 0.16);
      if (s === 0 || s === 3 || s === 6) gtr(40 + r, t, sd * (s === 6 ? 1.8 : 2.8), 0.55);
      if (s === 0) pad(tri.map(x => 60 + x), t, sd * 8, 0.022);
      pluck(72 + tri[[0, 1, 2, 1][s % 4]] + (s > 3 ? 12 : 0), t, sd * 0.8, 0.018);
      if (s === 0 || s === 3 || s === 4) kick(t, 0.95); if (s === 2 || s === 6) snare(t, 0.9); hat(t, 0.9);
      if (phrase) crash(t, 1);
      if (fill && s >= 5) tom(52 - (s - 5) * 4, t, 0.9);
    } else if (st === 4) {     // wide world: open and hopeful
      if (s === 0 || s === 4) bass(36 + (s ? tri[2] : r), t, sd * 3.6, 0.15);
      if (s === 0) pad(tri.map(x => 60 + x), t, sd * 8, 0.026);
      pluck(60 + tri[[0, 1, 2, 1, 2, 1, 0, 1][s]] + 12 * (s === 4 ? 1 : 0), t, sd * 1.8, 0.03, 'sine');
      if (s === 0 || s === 5) kick(t, 0.6); if (s === 4) snare(t, 0.4); if (s % 2) hat(t, 0.45);
      if (phrase && bar % 8 === 0) crash(t, 0.5);
    } else if (st === 5) {     // boss: heavy and urgent
      bass(36 + r, t, sd * 0.8, 0.18);
      gtr(40 + r + (s === 7 ? 1 : 0), t, sd * 0.55, 0.6);
      if (s === 0) pad(tri.map(x => 48 + x), t, sd * 8, 0.025);
      kick(t, s % 2 ? 0.55 : 1); if (s === 2 || s === 6) snare(t, 1); hat(t + sd / 2, 0.7);
      if (s === 0) crash(t, bar % 2 ? 0.5 : 0.9);
      if (fill && s >= 4) tom(50 - (s - 4) * 3, t, 1);
    } else if (st === 6) {     // Goku: power rock
      bass(36 + r, t, sd * 0.85, 0.17);
      if ([0, 1, 3, 4, 6].includes(s)) gtr(40 + r + (s === 6 ? 2 : 0), t, sd * (s === 1 ? 0.4 : s === 4 ? 1.8 : 0.9), 0.6);
      if (s === 0 || s === 3 || s === 4) kick(t, 1); if (s === 2 || s === 6) snare(t, 1); hat(t, 1); if (s % 2) hat(t + sd / 2, 0.4);
      if (phrase) crash(t, 1);
      if (fill && s >= 4) tom(53 - (s - 4) * 3, t, 1);
    } else if (st === 7) {     // city: bouncy and jazzy
      if ([0, 3, 5, 6].includes(s)) bass(36 + r + (s === 5 ? 12 : s === 6 ? 7 : 0), t, sd * 0.8, 0.16);
      if (s === 1 || s === 4) epiano(tri.map(x => 60 + x).concat(r + 70), t, sd * 1.4, 0.022);
      if (s === 0 || s === 3) kick(t, 0.75); if (s === 2 || s === 6) snare(t, 0.6); hat(t, s % 2 ? 0.5 : 0.9); if (s === 7) hat(t, 0.6, 1);
    }
  }
  let cur = null, tune = null, stepI = 0, nextT = 0, timer = null;
  function pump() {
    if (!ac || !tune || TT.muted || document.hidden || TT.paused) { nextT = 0; return; }
    if (ac.state !== 'running') { wake(); nextT = 0; return; }
    bandInit();
    const now = ac.currentTime, sd = 60 / tune.bpm / 2; if (nextT < now) nextT = now + 0.06;
    while (nextT < now + 0.3) { try { playStep(tune, stepI, nextT, sd); } catch (e) { } stepI = (stepI + 1) % tune.len; nextT += sd; }
  }
  TT.music = name => { if (cur === name) return; cur = name; tune = name ? TUNES[name] : null; stepI = 0; nextT = 0; if (!timer) timer = setInterval(pump, 70); };
  TT.musicName = () => cur;

  // --- full-screen transitions drawn by the GPU: mode 0 = battle swirl (blades sweep round while a ring closes in), mode 1 = iris ---
  let wipeM = null;
  TT.camZoom = 1;
  TT.wipeInit = scene => {
    const u = { k: { value: 0 }, mode: { value: 0 }, asp: { value: 1.6 }, col: { value: new THREE.Color(0x10131f) }, col2: { value: new THREE.Color(0xe8402a) } };
    wipeM = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform float k, mode, asp; uniform vec3 col, col2; varying vec2 vUv;
        void main(){
          vec2 p = (vUv - 0.5) * 2.0 * vec2(asp, 1.0); float d = length(p), mx = length(vec2(asp, 1.0)) + 0.1;
          float r = (1.0 - k) * mx, cover = step(r, d); vec3 c = col;
          float ring = cover * (1.0 - step(r + 0.07, d));
          if (mode < 0.5) {
            float v = (atan(p.y, p.x) / 6.2832 + 0.5) * 6.0 - d * 0.7 + k * 1.6, bl = fract(v);
            cover = max(cover, step(bl, k * 1.2));
            c = mix(mix(col, col2, mod(floor(v), 2.0)), col, smoothstep(0.75, 1.0, k));
          }
          c = mix(c, vec3(1.0), ring * (1.0 - smoothstep(0.85, 1.0, k)));
          if (cover < 0.5) discard; gl_FragColor = vec4(c, 1.0);
        }` }));
    wipeM.frustumCulled = false; wipeM.renderOrder = 9999; wipeM.visible = false; wipeM.matrixAutoUpdate = false; scene.add(wipeM);
  };
  TT.wipeAsp = a => { if (wipeM) wipeM.material.uniforms.asp.value = a; };
  // k: 0 = clear, 1 = fully covered
  TT.wipeTo = (k1, dur, mode, col) => {
    if (!wipeM) return Promise.resolve();
    const u = wipeM.material.uniforms, k0 = u.k.value; u.mode.value = mode || 0; if (col != null) u.col.value.setHex(col); wipeM.visible = true;
    return TT.tween(dur, q => { u.k.value = k0 + (k1 - k0) * (q * q * (3 - 2 * q)); }).then(() => { u.k.value = k1; if (k1 <= 0) { wipeM.visible = false; u.col.value.setHex(0x10131f); } });
  };

  // --- toast + dialog ---
  let toastT = null;
  TT.toast = msg => { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); };

  let dq = null;
  // TT.say([[who, text], ...]) -> Promise resolved when the player taps through.
  TT.say = lines => new Promise(res => {
    if (typeof lines[0] === 'string') lines = [lines];
    dq = { lines, i: 0, res }; for (const l of lines) TT.preVoice(l[0] || '', l[1]);
    TT.dialogOpen = true; show();
  });
  function show() {
    const l = dq.lines[dq.i];
    $('dwho').textContent = l[0] || ''; $('dtext').textContent = l[1];
    $('dialog').classList.remove('hide'); TT.sfx.blip(); TT.speak(l[0] || '', l[1]);
  }
  TT.dialogNext = () => {
    if (!dq) return;
    if (++dq.i >= dq.lines.length) { const r = dq.res; dq = null; TT.dialogOpen = false; $('dialog').classList.add('hide'); TT.hush(); r(); }
    else show();
  };
  $('dialog').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); TT.audioInit(); TT.dialogNext(); });
})();
