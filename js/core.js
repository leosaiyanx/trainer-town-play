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
  // ink outline: back faces pushed out along the normal
  TT.olMat = new THREE.MeshBasicMaterial({ color: 0x2b2438, side: THREE.BackSide });
  TT.olMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.016;'); };

  const flat = g => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
  const prism = (() => { // gable roof: ridge along x, base 1x1, height 1
    const A = [-.5, 0, .5], B = [.5, 0, .5], C = [.5, 0, -.5], D = [-.5, 0, -.5], E = [-.5, 1, 0], F = [.5, 1, 0];
    const v = [A, B, F, A, F, E, C, D, E, C, E, F, D, A, E, B, C, F, A, D, C, A, C, B].flat();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  })();
  TT.G = {
    sph: new THREE.SphereGeometry(1, 18, 12),
    sphS: new THREE.SphereGeometry(1, 9, 6),
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
    torus: new THREE.TorusGeometry(1, 0.32, 8, 16)
  };
  const gc2 = {};
  TT.capsule = (r, len) => { const k = 'c' + r + '_' + len; return gc2[k] || (gc2[k] = new THREE.CapsuleGeometry(r, len, 4, 10)); };
  TT.taper = (rt, rb, h) => { const k = 't' + rt + '_' + rb + '_' + h; return gc2[k] || (gc2[k] = new THREE.CylinderGeometry(rt, rb, h, 14)); };
  // P(parent, geo, colorOrMaterial, [x,y,z], scale|[sx,sy,sz], [rx,ry,rz])
  TT.P = (parent, geo, col, p, s, r) => {
    if (geo === 'sph' && s != null && (typeof s === 'number' ? s : Math.max(s[0], s[1], s[2])) < 0.085) geo = 'sphS';
    const m = new THREE.Mesh(typeof geo === 'string' ? TT.G[geo] : geo, typeof col === 'number' ? TT.mat(col) : col);
    if (p) m.position.set(p[0], p[1], p[2]);
    if (s != null) { if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(s[0], s[1], s[2]); }
    if (r) m.rotation.set(r[0], r[1], r[2]);
    parent.add(m); return m;
  };

  // ---- baking: merge many primitive meshes into one vertex-coloured mesh ----
  const _v = new THREE.Vector3(), _n3 = new THREE.Matrix3();
  function merge(list) { // list: [{mesh, matrix}]
    let n = 0;
    const gs = list.map(e => { const g0 = e.mesh.geometry, g = g0.index ? (g0._ni || (g0._ni = g0.toNonIndexed())) : g0; n += g.attributes.position.count; return g; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
    list.forEach((e, i) => {
      const g = gs[i], pa = g.attributes.position, na = g.attributes.normal, c = e.mesh.material.color, mx = e.matrix;
      _n3.getNormalMatrix(mx);
      for (let j = 0; j < pa.count; j++, o += 3) {
        _v.fromBufferAttribute(pa, j).applyMatrix4(mx); pos[o] = _v.x; pos[o + 1] = _v.y; pos[o + 2] = _v.z;
        _v.fromBufferAttribute(na, j).applyMatrix3(_n3).normalize(); nor[o] = _v.x; nor[o + 1] = _v.y; nor[o + 2] = _v.z;
        col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
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
    const m = merge(ms); ms.forEach(e => node.remove(e.mesh)); node.add(m);
    if (ol && !node.userData.noOl) { const o = new THREE.Mesh(m.geometry, TT.olMat); m.add(o); if (ols) ols.push(o); }
  };
  // flattens a whole static subtree into ONE mesh (root must be at its final transform's parent space)
  TT.bakeDeep = function (root) {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), ms = [];
    root.traverse(ch => { if (bakeable(ch)) ms.push({ mesh: ch, matrix: new THREE.Matrix4().multiplyMatrices(inv, ch.matrixWorld) }); });
    if (!ms.length) return null;
    ms.forEach(e => e.mesh.parent.remove(e.mesh));
    const m = merge(ms); root.add(m); return m;
  };
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
  let ac = null, master, musicBus, sfxBus, echo, noiseBuf; TT.muted = false;
  TT.audioInit = () => {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      master = ac.createGain(); master.gain.value = TT.muted ? 0 : 0.9;
      const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.gain.value = 0.42; musicBus.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.85; sfxBus.connect(master);
      echo = ac.createDelay(0.5); echo.delayTime.value = 0.19;
      const fb = ac.createGain(); fb.gain.value = 0.28; const eg = ac.createGain(); eg.gain.value = 0.3;
      echo.connect(fb); fb.connect(echo); echo.connect(eg); eg.connect(musicBus);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
  };
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
  const MOVE = { fire: 'fire', water: 'water', grass: 'leaf', flying: 'wind', psychic: 'psy', ghost: 'psy', electric: 'zap' };
  TT.sfx.move = type => (TT.sfx[MOVE[type]] || TT.sfx.whoosh)();
  // creature voices: a short synthetic call, different per species
  TT.cry = (sp, pitch) => {
    if (!ac || TT.muted) return; const t = ac.currentTime + 0.01, k = pitch || 1;
    if (sp === 'pikachu') { voice(sfxBus, 'square', 950 * k, t, 0.09, 0.1, { slide: 1350 * k }); voice(sfxBus, 'square', 1150 * k, t + 0.11, 0.12, 0.1, { slide: 800 * k }); voice(sfxBus, 'square', 1000 * k, t + 0.27, 0.2, 0.09, { slide: 620 * k, vib: 18 }); return; }
    let h = 7; for (let i = 0; i < sp.length; i++) h = (h * 31 + sp.charCodeAt(i)) >>> 0;
    const n = 2 + (h % 2), type = h & 4 ? 'square' : 'sawtooth';
    for (let i = 0; i < n; i++) { const f = (380 + ((h >> (i * 3)) & 7) * 115) * k; voice(sfxBus, type, f, t + i * 0.12, 0.14, 0.09, { slide: f * (0.65 + ((h >> (i * 2 + 9)) & 3) * 0.28), vib: h & 8 ? 16 : 0 }); }
  };

  // --- music: tiny tracker. Original tunes written for this game. ---
  const CH = { C: [0, 0], G: [7, 0], Am: [9, 1], F: [5, 0], Dm: [2, 1], Em: [4, 1], E: [4, 0], Bb: [10, 0], A: [9, 0] };
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parse(str) {
    const ev = {}, tk = str.trim().split(/\s+/).filter(x => x !== '|'); let lastEv = null;
    tk.forEach((x, i) => { if (x === '-') { if (lastEv) lastEv.len++; } else if (x === '.') lastEv = null; else { const m = /^([A-G])(#|b)?(\d)$/.exec(x); lastEv = ev[i] = { n: PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12, len: 1 }; } });
    return { ev, len: tk.length };
  }
  const TUNES = {
    town: { bpm: 126, style: 0, ch: 'C G Am F C G F G Am F C G Am F G G', lead:
      'E5 . G5 . C6 . B5 A5 | G5 . D5 . G5 . A5 B5 | C6 . A5 . E5 . A5 G5 | F5 . A5 . C6 - - . | E5 . G5 . C6 . D6 E6 | D6 . B5 . G5 . A5 B5 | C6 . A5 . F5 . A5 C6 | B5 . D6 . G5 - - . | ' +
      'A5 . C6 . E6 . D6 C6 | A5 . C6 . F6 . E6 D6 | E6 . C6 . G5 . C6 E6 | D6 - - . B5 . G5 . | A5 . C6 . E6 . D6 C6 | C6 . A5 . F5 . G5 A5 | B5 . G5 . D6 . B5 . | G5 A5 B5 D6 G6 - - .' },
    battle: { bpm: 172, style: 1, ch: 'Am Am F G Am Am F E', lead:
      'A5 . A5 C6 E6 . D6 C6 | B5 . C6 . A5 . E5 . | F5 . F5 A5 C6 . B5 A5 | G5 . B5 . D6 . B5 . | A5 . A5 C6 E6 . G6 E6 | D6 . C6 . A5 . C6 . | F6 . E6 . C6 . A5 . | G#5 . B5 . E6 . G#6 .' },
    rocket: { bpm: 138, style: 2, ch: 'Dm Dm Bb A', lead: 'D5 . F5 . A5 . G#5 A5 | D6 . C6 . A5 . F5 . | Bb5 . D6 . F6 . D6 . | A5 . C#6 . E6 . A6 .' }
  };
  for (const k in TUNES) { const tn = TUNES[k], p = parse(tn.lead); tn.ev = p.ev; tn.len = p.len; tn.ch = tn.ch.split(' ').map(c => CH[c]); }
  function drum(kind, t, v) {
    if (kind === 0) voice(musicBus, 'sine', 130, t, 0.16, 0.5 * v, { slide: 42, sus: 0.5 });
    else if (kind === 1) { noise(musicBus, t, 0.12, 0.3 * v, 'bandpass', 1800, 0, 0.8); voice(musicBus, 'triangle', 200, t, 0.08, 0.15 * v, { slide: 120 }); }
    else noise(musicBus, t, 0.04, 0.12 * v, 'highpass', 7000);
  }
  function playStep(tn, i, t, sd) {
    const bar = (i / 8) | 0, s = i % 8, c = tn.ch[bar % tn.ch.length], root = c[0], tri = [root, root + (c[1] ? 3 : 4), root + 7], st = tn.style, e = tn.ev[i];
    if (e) { voice(musicBus, 'square', N(e.n), t, sd * e.len * 0.95, 0.085, { vib: e.len > 1 ? 6 : 0, echo: 1 }); voice(musicBus, 'triangle', N(e.n - 12), t, sd * e.len * 0.9, 0.06); }
    if (st === 0) {
      if (s % 2 === 0) voice(musicBus, 'triangle', N(36 + (s % 4 ? tri[2] : root)), t, sd * 1.7, 0.2);
      voice(musicBus, 'triangle', N(60 + tri[[0, 1, 2, 1, 0, 1, 2, 1][s]]), t, sd * 0.9, 0.035);
      if (s === 0 || s === 4) drum(0, t, 0.7); if (s === 2 || s === 6) drum(1, t, 0.6); if (s % 2 === 1) drum(2, t, 0.7);
    } else if (st === 1) {
      voice(musicBus, 'sawtooth', N(36 + root + (s % 2 ? 12 : 0)), t, sd * 0.85, 0.11);
      voice(musicBus, 'square', N(60 + tri[[0, 2, 1, 2][s % 4]]), t, sd * 0.5, 0.03); voice(musicBus, 'square', N(72 + tri[[1, 0, 2, 0][s % 4]]), t + sd / 2, sd * 0.45, 0.022);
      if (s === 0 || s === 3 || s === 4) drum(0, t, 0.9); if (s === 2 || s === 6) drum(1, t, 0.9); drum(2, t, 1); drum(2, t + sd / 2, 0.6);
    } else {
      if (s === 0 || s === 3 || s === 4 || s === 6) voice(musicBus, 'sawtooth', N(36 + (s === 3 ? tri[2] : root)), t, sd * 0.6, 0.13);
      if (s % 2) voice(musicBus, 'square', N(60 + tri[(s >> 1) % 3]), t, sd * 0.4, 0.035);
      if (s === 0 || s === 4) drum(0, t, 0.8); if (s === 2 || s === 6) drum(1, t, 0.7); if (s % 2) drum(2, t, 0.8);
    }
  }
  let cur = null, tune = null, stepI = 0, nextT = 0, timer = null;
  function pump() {
    if (!ac || !tune || TT.muted || document.hidden) { nextT = 0; return; }
    const now = ac.currentTime, sd = 60 / tune.bpm / 2; if (nextT < now) nextT = now + 0.06;
    while (nextT < now + 0.3) { try { playStep(tune, stepI, nextT, sd); } catch (e) { } stepI = (stepI + 1) % tune.len; nextT += sd; }
  }
  TT.music = name => { if (cur === name) return; cur = name; tune = name ? TUNES[name] : null; stepI = 0; nextT = 0; if (!timer) timer = setInterval(pump, 70); };

  // --- toast + dialog ---
  let toastT = null;
  TT.toast = msg => { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); };

  let dq = null;
  // TT.say([[who, text], ...]) -> Promise resolved when the player taps through.
  TT.say = lines => new Promise(res => {
    if (typeof lines[0] === 'string') lines = [lines];
    dq = { lines, i: 0, res };
    TT.dialogOpen = true; show();
  });
  function show() {
    const l = dq.lines[dq.i];
    $('dwho').textContent = l[0] || ''; $('dtext').textContent = l[1];
    $('dialog').classList.remove('hide'); TT.sfx.blip();
  }
  TT.dialogNext = () => {
    if (!dq) return;
    if (++dq.i >= dq.lines.length) { const r = dq.res; dq = null; TT.dialogOpen = false; $('dialog').classList.add('hide'); r(); }
    else show();
  };
  $('dialog').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); TT.audioInit(); TT.dialogNext(); });
})();
