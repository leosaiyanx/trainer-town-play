// battle.js — turn-based battles with a moving camera, a stage that matches where the battle started,
// type-specific attack effects, cinematic boss fights, allies (Gohan, Goku) and joint battles.
(function () {
  const TT = window.TT, $ = TT.$, P = TT.P, rand = TT.rand, ease = TT.ease, W = TT.World;
  const B = TT.Battle = { active: false, shake: 0 };
  let st = null, camK = 1;
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const glowT = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o == null ? 0.7 : o, depthWrite: false });
  const A = () => W.ARENA;
  const RING = new THREE.TorusGeometry(1, 0.08, 6, 40);     // thin shockwave rings

  // Battles are simulated by their owner. Everything visible is also sent as small events so a friend
  // who joins sees the same fight and can send in helper attacks.
  const emit = (t, d) => { const N = TT.Net; if (N && N.on && st && !st.watch) N.send(Object.assign({ e: 'b', t }, d || {})); };
  const setMsg = x => { $('bmsg').textContent = x; emit('msg', { x }); };
  const mxOf = m => m.mx || TT.maxHp(m);
  const sideOf = o => o === st.obj.me ? 'me' : o === st.obj.foe ? 'foe' : st.allyObjs && st.allyObjs.indexOf(o) >= 0 ? 'a' + st.allyObjs.indexOf(o) : 'ally';
  const objOf = s => s[0] === 'a' && s !== 'ally' ? st.allyObjs[+s.slice(1)] : st.obj[s];
  const NAMES = { ash: 'Ash', liko: 'Liko', dad: 'Dad', gary: 'Gary', leaf: 'Leaf' };
  // where helpers stand: [pokemon x, z, trainer x, z]
  const SLOTS = [[-3.6, -2.1, -6.3, -1.9], [-4.4, 0.7, -6.7, 0.9], [-5.3, -3.8, -7.6, -3.5]], FRIEND = [-3.2, 2.1, -5.8, 1.9];

  function spot(side) { return [A().x + side * 2.4, A().z]; }
  function newMon(sp, x, z, ry) { const o = TT.creature(sp); o.userData.s0 = o.scale.x; o.userData.ry = ry; o.position.set(A().x + x, 0, A().z + z); o.rotation.y = ry; TT.scene.add(o); return o; }
  function placeAlly(sp) { if (st.obj.ally) { TT.scene.remove(st.obj.ally); TT.dispose(st.obj.ally); } st.obj.ally = newMon(sp, FRIEND[0], FRIEND[1], 1.57 - 0.75); TT.cry(sp); return st.obj.ally; }
  function addHuman(key, x, z, ry) { const h = TT.human(TT.PEOPLE[key] || TT.PEOPLE.kid); h.position.set(A().x + x, 0, A().z + z); h.rotation.y = ry; TT.scene.add(h); st.extras.push(h); st.humans.push(h); return h; }
  function placeAllies(list) {
    st.allyObjs = []; list.forEach((a, i) => { const s = SLOTS[i]; addHuman(a.h, s[2], s[3], 1.25); const o = newMon(a.sp, s[0], s[1], 1.57 - 0.6); st.allyObjs.push(o); a.o = o; });
  }
  const setS = (o, sx, sy) => { const s = o.userData.s0; o.scale.set(s * sx, s * (sy == null ? sx : sy), s * sx); };
  const mid = o => o.position.y + (o.userData.h || 1) * 0.42 * (o.userData.boss ? 1.3 : 1);
  function parts(n, col, x, y, z, r) { const a = []; for (let i = 0; i < n; i++) a.push(P(TT.scene, 'sphS', TT.glow(Array.isArray(col) ? col[i % col.length] : col), [x, y, z], r || 0.1)); return a; }
  const kill = a => a.forEach(m => TT.scene.remove(m));
  const flash = (col, k) => { const f = $('flash'); if (!f) return; f.style.background = col || '#fff'; f.style.transition = 'none'; f.style.opacity = k || 0.7; requestAnimationFrame(() => { f.style.transition = 'opacity .45s'; f.style.opacity = 0; }); };

  // ---- camera: drifts toward whoever is acting; bosses can take it over for their entrance ----
  const cam = { f: 0, z: 0, tf: 0, tz: 0, ov: null, lt: 0, ok: 0 };
  const focus = (f, z) => { cam.tf = f; cam.tz = z || 0; };

  // a small Poké Ball flies from a trainer to the battle spot before the Pokémon pops out
  async function throwOut(from, s) {
    if (!from) return;
    const me = from === st.me_h; if (me) { from.userData.gesture = 'throw'; from.userData.gk = 0.5; }
    const b = TT.ballModel(0.18), x0 = from.position.x, z0 = from.position.z; TT.scene.add(b); TT.sfx.throw();
    await TT.tween(0.38, q => { b.position.set(x0 + (s[0] - x0) * q, 1.4 + Math.sin(q * 3.14) * 1.4 - q * 0.9, z0 + (s[1] - z0) * q); b.rotation.x += 0.5; if (me) from.userData.gk = 0.5 + q * 0.5; });
    if (me) from.userData.gesture = null;
    TT.scene.remove(b);
  }
  async function place(side, m, pop) {
    const k = side < 0 ? 'me' : 'foe';
    if (st.obj[k]) { const old = st.obj[k]; if (old.userData.aura) kill(old.userData.aura); TT.scene.remove(old); TT.dispose(old); }
    const o = TT.creature(m.sp), s = spot(side);
    if (m.boss) { o.scale.multiplyScalar(1.45); o.userData.boss = 1; }
    o.userData.s0 = o.scale.x; o.userData.ry = side < 0 ? 1.57 - 0.5 : -1.57 + 0.5;
    o.position.set(s[0], 0, s[1]); o.rotation.y = o.userData.ry;
    TT.scene.add(o); st.obj[k] = o;
    $('foeBox').classList.toggle('boss', !!(st.foe && st.foe.boss));
    emit('mon', { s: k, sp: m.sp, lvl: m.lvl, hp: m.hp, mx: mxOf(m), pop: !!pop, boss: m.boss ? 1 : 0 });
    if (pop && !m.boss) {
      setS(o, 0.01); await throwOut(side < 0 ? st.me_h : st.trainers && st.trainers[0], s); TT.sfx.open();
      const fl = P(TT.scene, 'sph', glowT(0xffffff, 0.9), [s[0], 0.5, s[1]], 0.2), sp = parts(10, [0xffffff, 0xffe060, 0x9adcff], s[0], 0.5, s[1], 0.08);
      await TT.tween(0.45, q => {
        const e = ease(q), b = 1 + Math.sin(q * 3.14) * 0.28; setS(o, Math.max(0.01, e) * (2 - b), Math.max(0.01, e) * b); o.position.y = Math.sin(q * 3.14) * 0.4;
        fl.scale.setScalar(0.2 + q * 1.7); fl.material.opacity = 0.9 * (1 - q);
        sp.forEach((p, i) => { const a = i * 0.628; p.position.set(s[0] + Math.cos(a) * q * 1.8, 0.5 + Math.sin(a) * q * 1.8, s[1] + 0.2); p.scale.setScalar(0.09 * (1 - q)); });
      });
      TT.scene.remove(fl); kill(sp); setS(o, 1); o.position.y = 0; TT.cry(m.sp);
    }
    return o;
  }
  function bars() {
    const me = st.me, foe = st.foe;
    const set = (el, m) => { const k = m.hp / mxOf(m); el.style.width = (k * 100) + '%'; el.style.background = m.boss ? (k > 0.5 ? 'linear-gradient(90deg,#ffb020,#e8402a)' : 'linear-gradient(90deg,#e8402a,#a01818)') : k > 0.5 ? '#4cd964' : k > 0.22 ? '#f2c230' : '#e8402a'; };
    $('myName').textContent = TT.monName(me); $('myLvl').textContent = 'Lv ' + me.lvl; set($('myHp'), me);
    $('myHpTxt').textContent = me.hp + ' / ' + mxOf(me) + ' HP'; $('myXp').style.width = Math.min(100, (me.xp || 0) / TT.xpNeed(me) * 100) + '%';
    $('foeName').textContent = (foe.boss ? '👑 ' : st.wild ? 'Wild ' : '') + TT.monName(foe); $('foeLvl').textContent = 'Lv ' + foe.lvl; set($('foeHp'), foe);
    $('foeDots').textContent = st.wild || !st.foes || st.foes.length < 2 ? '' : st.foes.map(f => f.hp > 0 ? '●' : '○').join('');
  }
  async function say(t, d) { setMsg(t); await TT.wait(d == null ? 1.15 : d); }
  // one of several wordings, never the same one twice running
  const lastSaid = {}; const oneOf = (key, a) => { let i, n = 0; do i = (Math.random() * a.length) | 0; while (i === lastSaid[key] && a.length > 1 && n++ < 8); lastSaid[key] = i; return a[i]; };
  // how a wild Pokémon turns up depends on where the battle is
  const WILD_AT = { pond: ['splashed out of the pond', 'popped up from the water'], river: ['leapt out of the river', 'splashed up the bank'], forest: ['dropped out of a tree', 'crept out of the bushes'], mountain: ['tumbled down the rocks', 'stepped out from behind a boulder'], peak: ['came down from the peak'], volcano: ['stepped out of the smoke', 'climbed out of the ash'], lair: ['stepped out of the smoke'], city: ['ran out of an alley', 'hopped off a rooftop'], park: ['jumped out of a flower bed', 'rolled across the grass'], meadow: ['jumped out of the tall grass', 'rustled out of the grass'] };
  const wildLine = (nm, stage) => { const w = WILD_AT[stage] || WILD_AT.meadow; return oneOf('wild', ['A wild ' + nm + ' appeared!', 'A wild ' + nm + ' ' + oneOf('wildAt', w) + '!', 'Whoa! A wild ' + nm + '!', 'A wild ' + nm + ' wants to battle!', 'Look out! A wild ' + nm + ' ' + oneOf('wildAt', w) + '!']); };
  const goLine = nm => oneOf('go', ['Go, ' + nm + '!', nm + ', I choose you!', "You're up, " + nm + '!', "Let's go, " + nm + '!', 'Show them, ' + nm + '!']);
  const gesture = (g, k) => { if (st.me_h) st.me_h.userData.gesture = g; if (k) setTimeout(() => { if (st && st.me_h && st.me_h.userData.gesture === g) st.me_h.userData.gesture = null; }, k * 1000); };

  function choose() {
    return new Promise(res => {
      const menu = $('bmenu'); menu.innerHTML = ''; menu.classList.remove('off');
      const add = (html, bg, act, alt, cls) => {
        const b = document.createElement('button'); b.innerHTML = html; if (alt) b.className = 'alt'; else b.style.background = bg; if (cls) b.classList.add(cls);
        b.addEventListener('pointerdown', e => { e.preventDefault(); if (!st || st.wake !== res) return; st.wake = null; TT.audioInit(); TT.sfx.blip(); menu.classList.add('off'); res(act); });
        menu.appendChild(b);
      };
      // a star marks the moves that work best against this foe
      const ft = TT.DEX[st.foe.sp][1];
      TT.moves(st.me).forEach(mv => { if (mv[4]) { add('✦ ' + mv[0] + '<small>' + TT.MOVE_FX[mv[4]] + '</small>', hex(TT.TYPE_COL[mv[1]] || 0xa8a890), { t: 'move', mv }); return; }
        const e = TT.eff(mv[1], ft); add((e > 1 ? '★ ' : '') + mv[0] + '<small>' + mv[1] + (e > 1 ? ' · strong here!' : e < 1 ? ' · weak here' : '') + '</small>', hex(TT.TYPE_COL[mv[1]] || 0xa8a890), { t: 'move', mv }, false, e > 1 ? 'best' : e < 1 ? 'weak' : ''); });
      if (TT.S.flags.keystone && TT.MEGA[st.me.sp] && !st.megaUsed) add('✨ Mega Evolve<small>once each battle</small>', 'linear-gradient(90deg,#ff7ab0,#ffd23a,#6ad8ff,#9a7aff)', { t: 'mega' }, false, 'mega');
      if (st.wild && !st.noCatch) add('Poké Ball<small>× ' + TT.S.balls + '</small>', '#e8402a', { t: 'ball' });
      if (TT.S.party.filter(m => m.hp > 0).length > 1) add('Swap', '', { t: 'swap' }, true);
      add('Run', '', { t: 'run' }, true);
      setMsg('What will ' + TT.monName(st.me) + ' do?'); st.wake = res;
    });
  }

  // ---------------- glowing particles ----------------
  // Every spark, flame, droplet and puff of smoke in a battle lives in one buffer and is drawn in one go, so an attack can throw out hundreds of them.
  const MEM = navigator.deviceMemory || 8, FX = { max: 340, p: [], q: MEM <= 2 ? 0.4 : MEM <= 4 ? 0.62 : 1, cap: MEM <= 2 ? 110 : MEM <= 4 ? 160 : 220 };          // slower devices: fewer and smaller particles (measured on the kids' tablets)
  let fxPts = null, fxPos, fxCol, fxSize; const _fc = new THREE.Color(), jit = v => (Math.random() * 2 - 1) * v;
  function fxInit() {
    if (!fxPts) {
      const g = new THREE.BufferGeometry(); fxPos = new Float32Array(FX.max * 3); fxCol = new Float32Array(FX.max * 4); fxSize = new Float32Array(FX.max);
      g.setAttribute('position', new THREE.BufferAttribute(fxPos, 3)); g.setAttribute('col', new THREE.BufferAttribute(fxCol, 4)); g.setAttribute('size', new THREE.BufferAttribute(fxSize, 1)); g.setDrawRange(0, 0);
      // a soft round dot with a white-hot middle; a negative alpha means "no hot middle" (smoke, dust)
      // glowing particles add their light to what is behind them; smoke and dust cover it instead. One blend mode does both: colour is sent already multiplied by alpha.
      fxPts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { scale: { value: 500 }, cap: { value: FX.cap } }, transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        vertexShader: 'attribute float size; attribute vec4 col; varying vec4 vC; uniform float scale; uniform float cap; void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(cap, size * scale / -mv.z); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying vec4 vC; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float glow = step(0.0, vC.a); float a = abs(vC.a) * smoothstep(1.0, 0.25, d); vec3 c = mix(vC.rgb, vec3(1.0), smoothstep(0.65, 0.0, d) * 0.55 * glow); gl_FragColor = vec4(c * a, a * mix(1.0, 0.3, glow)); }' }));
      fxPts.frustumCulled = false; fxPts.renderOrder = 9;
    }
    if (fxPts.parent !== TT.scene) TT.scene.add(fxPts);
  }
  // one particle: where, how fast, how long, size from → to, colour from → to, alpha, gravity, drag
  function fxAdd(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, a, grav, drag) {
    if (FX.p.length >= FX.max) return; _fc.setHex(c0); const r0 = _fc.r, g0 = _fc.g, b0 = _fc.b; _fc.setHex(c1 == null ? c0 : c1);
    FX.p.push({ x, y, z, vx, vy, vz, life, t: 0, s0, s1: s1 == null ? s0 : s1, r0, g0, b0, r1: _fc.r, g1: _fc.g, b1: _fc.b, a: a == null ? 1 : a, g: grav || 0, d: drag || 0 });
  }
  function fxTick(dt) {
    if (!fxPts) return; const L = FX.p; if (!L.length && !fxPts.geometry.drawRange.count) return;
    for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.t += dt; if (p.t >= p.life) { L[i] = L[L.length - 1]; L.pop(); continue; } p.vy -= p.g * dt; const dr = Math.max(0, 1 - p.d * dt); p.vx *= dr; p.vy *= dr; p.vz *= dr; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
    let n = 0; for (const p of L) { const k = p.t / p.life, j = n * 3, c = n * 4; fxPos[j] = p.x; fxPos[j + 1] = p.y; fxPos[j + 2] = p.z; fxCol[c] = p.r0 + (p.r1 - p.r0) * k; fxCol[c + 1] = p.g0 + (p.g1 - p.g0) * k; fxCol[c + 2] = p.b0 + (p.b1 - p.b0) * k; fxCol[c + 3] = p.a * Math.min(1, k * 9) * (1 - k * k); fxSize[n] = p.s0 + (p.s1 - p.s0) * k; n++; }
    const g = fxPts.geometry; g.setDrawRange(0, n); g.attributes.position.needsUpdate = g.attributes.col.needsUpdate = g.attributes.size.needsUpdate = true;
    const cv = $('c'); if (cv) fxPts.material.uniforms.scale.value = cv.height * 1.3737;          // 1 / (2 tan(20°)): the camera's field of view is 40°
  }
  // a burst in all directions (or only upwards with hemi). o: { v speed, up, life, s, s1, cols, c1, a, g, d, r spawn radius, hemi, flat }
  function fxBurst(n, x, y, z, o) {
    n = Math.max(1, Math.round(n * FX.q));
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, e = Math.acos(1 - Math.random() * (o.hemi ? 1 : 2)), sp = o.v * (0.35 + Math.random() * 0.65), r = o.r || 0.1;
      fxAdd(x + jit(r), y + jit(r), z + jit(r), Math.sin(e) * Math.cos(a) * sp, (o.flat ? 0.15 : 1) * Math.cos(e) * sp + (o.up || 0), Math.sin(e) * Math.sin(a) * sp, o.life * (0.55 + Math.random() * 0.45), o.s * (0.7 + Math.random() * 0.6), o.s1 == null ? null : o.s1 * (0.7 + Math.random() * 0.6), o.cols[(Math.random() * o.cols.length) | 0], o.c1, o.a, o.g, o.d); }
  }
  // a stream from a to b: call every frame with the time that passed. Particles live just long enough to arrive.
  function fxJet(rate, dt, a, b, speed, o) {
    let n = rate * dt * FX.q + (o.acc || 0); o.acc = n % 1; n |= 0; const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, sp = o.sp || 0;
    for (let i = 0; i < n; i++) { const v = speed * (0.85 + Math.random() * 0.3); fxAdd(a[0] + jit(o.r || 0.08), a[1] + jit(o.r || 0.08), a[2] + jit(o.r || 0.08), dx / L * v + jit(sp), dy / L * v + jit(sp) + (o.up || 0), dz / L * v + jit(sp), L / v * (o.lifeK || 1), o.s * (0.7 + Math.random() * 0.6), o.s1, o.cols[(Math.random() * o.cols.length) | 0], o.c1, o.a, o.g, o.d); }
  }
  // like TT.tween, but the callback also gets the seconds since its last call
  const run = (dur, f) => { let lq = 0; return TT.tween(dur, q => { const dt = (q - lq) * dur; lq = q; f(q, dt); }); };
  const FIRE = [0xfff2a0, 0xffc23a, 0xff7a1a, 0xff4a12], WATER = [0xeaf7ff, 0x9ad8ff, 0x4a9cf0], VOLT = [0xffffff, 0xfff27a, 0xffd23a], LEAF = [0xb8f070, 0x7ad85a, 0x4aa84a], FROST = [0xffffff, 0xd8f2ff, 0xa8dcff],
    PSY = [0xffd0e6, 0xf06090, 0xc060e0], DRAG = [0xffffff, 0x8ab0ff, 0x8a5af8], GHOST = [0xb48ae8, 0x7a4ac0, 0x4a2a80], DUST = [0xd8c8a8, 0xc0b090, 0xe8dcc0];
  const typeCols = t => t === 'fire' ? FIRE : t === 'water' ? WATER : t === 'electric' ? VOLT : t === 'grass' || t === 'bug' ? LEAF : t === 'ice' ? FROST : t === 'psychic' ? PSY : t === 'dragon' ? DRAG : t === 'ghost' || t === 'dark' ? GHOST : t === 'fighting' ? [0xffffff, 0xff8a5a, 0xe04030] : t === 'steel' ? [0xffffff, 0xdfe8f8, 0xfff0b0] : t === 'rock' ? DUST : [0xffffff, 0xfff2c0, 0xe8e0d0];

  // ---------------- attack visuals ----------------
  // A special move: the attacker gathers power, then lets it go in a way that suits its type. pw (about 0.75–1.8) grows with the move's strength.
  async function special(type, ao, dobj, dir, pw) {
    pw = pw || 1; fxInit();
    const col = TT.TYPE_COL[type] || 0xffffff, C = typeCols(type), x0 = ao.position.x, z = ao.position.z, y0 = mid(ao), x1 = dobj.position.x, z1 = dobj.position.z, y1 = mid(dobj), ax = ao.position.x;
    const lerp = (k, wob) => [x0 + dir * 0.4 + (x1 - x0 - dir * 0.4) * k, y0 + (y1 - y0) * k + (wob || 0), z + (z1 - z) * k];
    const p0 = [x0 + dir * 0.5, y0, z], p1 = [x1, y1, z1];
    // gather power: light streams into the attacker, a ring spreads on the ground, and it leans back
    const ring = P(TT.scene, RING, glowT(col, 0.7), [x0, 0.05, z], 0.3, [1.57, 0, 0]);
    await run(0.36, (q, dt) => {
      setS(ao, 1 + 0.1 * q, 1 - 0.14 * q); ao.position.x = ax - dir * 0.22 * q; ring.scale.setScalar(0.3 + q * 1.2 * pw); ring.material.opacity = 0.7 * (1 - q);
      let n = 70 * pw * dt * FX.q + (ring.userData.acc || 0); ring.userData.acc = n % 1;
      for (let i = 0; i < (n | 0); i++) { const a = Math.random() * 6.283, r = 1.2 + Math.random() * 0.5; fxAdd(x0 + Math.cos(a) * r, y0 + Math.sin(a) * r * 0.8, z + jit(0.3), -Math.cos(a) * r / 0.28, -Math.sin(a) * r * 0.8 / 0.28, 0, 0.28, 0.16, 0.05, C[(Math.random() * C.length) | 0], 0xffffff, 0.9); }
    });
    TT.scene.remove(ring); TT.sfx.move(type);
    fxBurst(10 * pw, p0[0], p0[1], p0[2], { v: 2.5, life: 0.3, s: 0.3, s1: 0.05, cols: C, a: 0.9 });
    const lunge = q => { ao.position.x = ax - dir * 0.22 + dir * 0.5 * Math.min(1, q * 5) - dir * 0.28 * Math.max(0, q - 0.75) * 4; setS(ao, 1 - 0.08 * Math.max(0, 1 - q * 3), 1 + 0.14 * Math.max(0, 1 - q * 3)); };
    if (type === 'fire') {                       // a roaring stream of flame that swells as it goes, with embers
      const o = { sp: 1.2, s: 0.34 * pw, s1: 1.05 * pw, cols: FIRE, c1: 0xe03a0a, a: 1, up: 0.5, lifeK: 1.05 }, e = { sp: 2.2, s: 0.09, s1: 0.03, cols: [0xfff2a0, 0xffb020], a: 1, up: 1.5, g: -2, lifeK: 1.3 };
      await run(0.6, (q, dt) => { lunge(q); fxJet(300 * pw, dt, p0, p1, 10.5, o); fxJet(50, dt, p0, p1, 9, e); });
    } else if (type === 'water') {               // a hard jet of water that arcs and sprays
      const o = { sp: 0.45, s: 0.24 * pw, s1: 0.46 * pw, cols: [0x4a9cf0, 0x3a84e0, 0x6ab8ff], c1: 0x2a6ad0, a: -0.92, up: 1.3, g: 4.5, lifeK: 1.02 }, m = { sp: 1.1, s: 0.12, s1: 0.26, cols: [0xffffff, 0xdff2ff], a: 0.75, up: 1.0, g: 3 };
      await run(0.6, (q, dt) => { lunge(q); fxJet(300 * pw, dt, p0, p1, 12, o); fxJet(110 * pw, dt, p0, p1, 11.5, m); });
    } else if (type === 'electric') {            // forked lightning along the ground, then a bolt from the sky
      const segs = []; for (let i = 0; i < 20; i++) segs.push(P(TT.scene, 'box', TT.glow(i % 2 ? 0xfff27a : 0xffffff), [0, 0, 0], [0.5, i < 10 ? 0.14 : 0.07, 0.1]));
      const zig = (pts, off) => { for (let i = 0; i < 10; i++) { const a = pts[i], b = pts[i + 1], m = segs[off + i]; m.visible = Math.random() > 0.1; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.rotation.set(0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])); m.scale.x = Math.hypot(b[0] - a[0], b[1] - a[1]); } };
      const path = (w, f) => { const pts = []; for (let i = 0; i <= 10; i++) pts.push(f(i / 10, i && i < 10 ? rand(-w, w) : 0)); return pts; };
      const fork = MEM > 2; if (!fork) for (let i = 10; i < 20; i++) segs[i].visible = false;
      await run(0.36, (q, dt) => { lunge(q); zig(path(0.45, lerp), 0); if (fork) zig(path(0.8, lerp), 10); const k = Math.random(), pt = lerp(k); fxBurst(5 * pw, pt[0], pt[1], pt[2], { v: 4, life: 0.25, s: 0.12, s1: 0.03, cols: VOLT, a: 1, g: 5 }); });
      flash('#fff6b0', 0.6); B.shake = Math.max(B.shake, 0.5);
      const sky = (k, w) => [x1 + w, 10 - k * (10 - y1), z1];
      await run(0.24, () => { zig(path(0.5, sky), 0); if (fork) zig(path(0.9, sky), 10); fxBurst(8 * pw, x1, y1, z1, { v: 6, life: 0.3, s: 0.14, s1: 0.03, cols: VOLT, a: 1, g: 8 }); });
      kill(segs);
    } else if (type === 'grass' || type === 'bug') {   // razor leaves spinning in a sparkling green wind
      const ps = []; for (let i = 0; i < 11; i++) { const m = P(TT.scene, 'sph', TT.glow(i % 2 ? 0x7ad85a : 0x4aa84a), [x0, y0, z], [0.26, 0.035, 0.12]); m.visible = false; ps.push(m); }
      const o = { sp: 0.9, s: 0.1, s1: 0.03, cols: LEAF, a: 0.95, up: 0.3 };
      await run(0.62, (q, dt) => { lunge(q); fxJet(90 * pw, dt, p0, p1, 9, o); ps.forEach((m, i) => { const k = (q - i / 11 * 0.45) / 0.55; m.visible = k > 0 && k < 1; if (!m.visible) return; const p = lerp(k, Math.sin(k * 9 + i * 2) * 0.45); m.position.set(p[0], p[1], p[2] + Math.cos(k * 7 + i) * 0.3); m.rotation.set(k * 22 + i, k * 15, 0); }); });
      kill(ps);
    } else if (type === 'ice') {                 // a freezing wind carrying shards of ice
      const sh = []; for (let i = 0; i < 7; i++) { const m = P(TT.scene, 'cone', TT.glow(i % 2 ? 0xd8f2ff : 0xffffff), [x0, y0, z], [0.09, 0.42, 0.09]); m.visible = false; sh.push(m); }
      const o = { sp: 0.8, s: 0.3 * pw, s1: 0.8 * pw, cols: FROST, c1: 0xbfe0ff, a: 0.5, lifeK: 1.05 }, sn = { sp: 1.6, s: 0.07, s1: 0.05, cols: [0xffffff], a: 1, g: 1.5 };
      await run(0.6, (q, dt) => { lunge(q); fxJet(150 * pw, dt, p0, p1, 9.5, o); fxJet(90, dt, p0, p1, 10, sn); sh.forEach((m, i) => { const k = (q - i / 7 * 0.4) / 0.6; m.visible = k > 0 && k < 1; if (!m.visible) return; const p = lerp(k, Math.sin(k * 3.14) * 0.3 * (i % 3 - 1)); m.position.set(p[0], p[1], p[2] + (i % 2 ? 0.25 : -0.25) * Math.sin(k * 3.14)); m.rotation.set(0, 0, -dir * 1.57 + Math.sin(k * 20 + i) * 0.15); }); });
      kill(sh);
    } else if (type === 'psychic') {             // rings of thought that swell as they roll toward the target
      const rs = []; for (let i = 0; i < 5; i++) { const m = P(TT.scene, RING, glowT(i % 2 ? 0xf06090 : 0xc060e0, 0.9), [x0, y0, z], 0.2, [0, 1.57, 0]); m.visible = false; rs.push(m); }
      await run(0.66, (q, dt) => { lunge(q); rs.forEach((m, i) => { const k = (q - i * 0.1) / 0.6; m.visible = k > 0 && k < 1; if (!m.visible) return; const p = lerp(k); m.position.set(p[0], p[1], p[2]); m.scale.setScalar((0.25 + k * 0.75) * pw); m.material.opacity = 0.9 * (1 - k * 0.6); m.rotation.z = k * 6; });
        const k = Math.min(1, q * 1.3), p = lerp(k), a = q * 26; let n = 150 * pw * dt * FX.q; for (let i = 0; i < n; i++) fxAdd(p[0], p[1] + Math.sin(a + i) * 0.5, p[2] + Math.cos(a + i) * 0.5, jit(0.4), jit(0.4), jit(0.4), 0.4, 0.2, 0.04, PSY[(Math.random() * 3) | 0], 0xffffff, 0.9); });
      kill(rs);
    } else if (type === 'dragon') {              // a beam of dragon fire with light spiralling round it
      const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) - 1.5708, mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      const outer = P(TT.scene, 'cyl', glowT(0x9a6aff, 0.8), [mx, my, z], [0.12, L, 0.12], [0, 0, ang]), core = P(TT.scene, 'cyl', TT.glow(0xffffff), [mx, my, z], [0.05, L, 0.05], [0, 0, ang]);
      flash('#c8b0ff', 0.35);
      await run(0.55, (q, dt) => { lunge(q); const w = Math.sin(Math.min(1, q * 4) * 1.57) * (1 - Math.max(0, q - 0.8) * 5) * pw * (1 + Math.sin(q * 60) * 0.12); outer.scale.set(0.13 * w, L, 0.13 * w); core.scale.set(0.055 * w, L, 0.055 * w);
        let n = 260 * pw * dt * FX.q; for (let i = 0; i < n; i++) { const k = Math.random(), p = lerp(k), a = k * 20 + q * 30, r = i % 3 ? 0.32 : 0.05; fxAdd(p[0], p[1] + Math.sin(a) * r, p[2] + Math.cos(a) * r, dir * 3, jit(0.5), jit(0.5), 0.32, i % 3 ? 0.2 : 0.5, 0.05, DRAG[(Math.random() * 3) | 0], 0xffffff, i % 3 ? 0.95 : 0.6); }
        fxBurst(3, x1 - dir * 0.3, y1, z1, { v: 3, life: 0.3, s: 0.35, s1: 0.08, cols: DRAG, a: 0.9 }); });
      TT.scene.remove(outer); TT.scene.remove(core);
    } else if (type === 'ghost' || type === 'dark') {  // three shadowy orbs that weave toward the target, trailing wisps
      const orbs = []; for (let i = 0; i < 3; i++) { const m = P(TT.scene, 'sphS', new THREE.MeshBasicMaterial({ color: 0x2a1648 }), [x0, y0, z], 0.2 * pw); m.visible = false; orbs.push(m); }
      await run(0.68, (q, dt) => { lunge(q); orbs.forEach((m, i) => { const k = (q - i * 0.12) / 0.7; m.visible = k > 0 && k < 1; if (!m.visible) return; const p = lerp(k), a = k * 9 + i * 2.1, r = 0.7 * Math.sin(k * 3.14); m.position.set(p[0], p[1] + Math.sin(a) * r, p[2] + Math.cos(a) * r);
        let n = 70 * dt * FX.q + (m.userData.acc || 0); m.userData.acc = n % 1; for (let j = 0; j < (n | 0); j++) { fxAdd(m.position.x, m.position.y, m.position.z, jit(0.3), 0.4 + jit(0.3), jit(0.3), 0.45, 0.36, 0.08, j % 2 ? 0x3a2060 : 0x2a1648, 0x1a0a30, -0.8); if (j % 2) fxAdd(m.position.x, m.position.y, m.position.z, jit(0.6), jit(0.6), jit(0.6), 0.35, 0.14, 0.03, 0xb48ae8, 0xffffff, 0.9); } }); });
      kill(orbs);
    } else if (type === 'rock') {                // boulders lobbed in a high arc, trailing dust
      const rs = []; for (let i = 0; i < 4; i++) rs.push(P(TT.scene, 'rock', 0x9a8f80, [x0, y0, z], rand(0.3, 0.48) * pw, [rand(0, 3), rand(0, 3), 0]));
      await run(0.66, (q, dt) => { lunge(q); rs.forEach((m, i) => { const k = TT.clamp((q - i * 0.1) / 0.66, 0, 1), p = lerp(k); m.visible = k > 0 && k < 1; m.position.set(p[0] + (i - 1.5) * 0.25 * k, p[1] + Math.sin(k * 3.14) * 2.4, p[2] + (i - 1.5) * 0.35 * k); m.rotation.x += 0.3; m.rotation.z += 0.2; if (m.visible && Math.random() < 0.5) fxAdd(m.position.x, m.position.y, m.position.z, jit(0.4), jit(0.4), jit(0.4), 0.5, 0.25, 0.6, DUST[(Math.random() * 3) | 0], null, -0.45); }); });
      kill(rs);
    } else if (type === 'steel') {               // a volley of spinning blades throwing sparks
      const sh = []; for (let i = 0; i < 9; i++) sh.push(P(TT.scene, 'box', glowT(i % 2 ? 0xe8eef8 : 0xa8b0c8, 0.95), [x0, y0, z], [0.4, 0.06, 0.13]));
      const o = { sp: 1.5, s: 0.08, s1: 0.02, cols: [0xffffff, 0xfff0b0], a: 1, g: 4 };
      await run(0.48, (q, dt) => { lunge(q); fxJet(110 * pw, dt, p0, p1, 13, o); sh.forEach((m, i) => { const k = TT.clamp((q - i * 0.04) / 0.68, 0, 1), p = lerp(k); m.visible = k > 0 && k < 1; m.position.set(p[0], p[1] + (i % 3 - 1) * 0.32 * Math.sin(k * 3.14), p[2] + (i % 4 - 1.5) * 0.26 * Math.sin(k * 3.14)); m.rotation.set(0, 0, k * 14 + i); }); });
      kill(sh);
    } else if (type === 'flying') {              // blades of wind in a rushing gust
      const ps = []; for (let i = 0; i < 6; i++) { const m = P(TT.scene, 'sph', glowT(0xffffff, 0.85), [x0, y0, z], [0.1, 0.62, 0.36]); m.visible = false; ps.push(m); }
      const o = { sp: 1.1, s: 0.12, s1: 0.3, cols: [0xffffff, 0xe6f2ff], a: 0.55, lifeK: 1.05 };
      await run(0.56, (q, dt) => { lunge(q); fxJet(170 * pw, dt, p0, p1, 13, o); ps.forEach((m, i) => { const k = (q - i / 6 * 0.4) / 0.6; m.visible = k > 0 && k < 1; if (!m.visible) return; const p = lerp(k, Math.sin(k * 9 + i * 2) * 0.2); m.position.set(p[0], p[1], p[2] + Math.cos(k * 7 + i) * 0.3); m.rotation.z = dir * 0.3; m.material.opacity = 0.85 * (1 - k * 0.5); }); });
      kill(ps);
    } else {                                     // anything else: bright pulses in the move's own colour
      const rs = []; for (let i = 0; i < 6; i++) { const m = P(TT.scene, RING, glowT(i % 2 ? col : 0xffffff, 0.85), [x0, y0, z], 0.2, [0, 1.57, 0]); m.visible = false; rs.push(m); }
      const o = { sp: 0.8, s: 0.14, s1: 0.04, cols: C, a: 0.9 };
      await run(0.6, (q, dt) => { lunge(q); fxJet(110 * pw, dt, p0, p1, 10, o); rs.forEach((m, i) => { const k = (q - i / 6 * 0.45) / 0.55; m.visible = k > 0 && k < 1; if (!m.visible) return; const p = lerp(k); m.position.set(p[0], p[1], p[2]); m.scale.setScalar(0.15 + k * 0.5); }); });
      kill(rs);
    }
    setS(ao, 1); ao.position.x = ax;
  }
  // what the hit looks like on the target, by type. Particles are thrown straight away; the meshes come back as [mesh, update(mesh, q)]
  function impact(type, dx, y, z, pw) {
    pw = pw || 1; fxInit(); const out = [], C = typeCols(type);
    const ringG = (c, o) => out.push([P(TT.scene, RING, glowT(c, o || 0.9), [dx, 0.08, z], 0.3, [1.57, 0, 0]), (m, q) => { m.scale.setScalar(0.3 + q * 2.6 * pw); m.material.opacity = (o || 0.9) * (1 - q); }]);
    if (type === 'fire') {
      fxBurst(46 * pw, dx, y - 0.2, z, { v: 4.2, up: 2.2, hemi: 1, life: 0.75, s: 0.4, s1: 1.0, cols: FIRE, c1: 0x902008, a: 0.92, g: -1.5, d: 1.5, r: 0.3 });
      fxBurst(14 * pw, dx, y, z, { v: 1.6, up: 2.4, hemi: 1, life: 1.0, s: 0.5, s1: 1.3, cols: [0x4a4038, 0x6a5a50], a: -0.4, g: -1, d: 1, r: 0.3 });
      fxBurst(16, dx, y, z, { v: 6, up: 2, life: 0.7, s: 0.08, s1: 0.03, cols: [0xfff2a0, 0xffb020], a: 1, g: 5 });
      for (let i = 0; i < 7; i++) { const ox = rand(-0.5, 0.5), oz = rand(-0.4, 0.4); out.push([P(TT.scene, 'cone', TT.glow(i % 2 ? 0xffe060 : 0xff6a1a), [dx + ox, 0.2, z + oz], [0.18, 0.1, 0.18]), (m, q) => { m.scale.set(0.24 * (1 - q) + 0.05, 0.2 + Math.sin(q * 3.14) * 1.7 * pw, 0.24 * (1 - q) + 0.05); m.position.y = 0.1 + Math.sin(q * 3.14) * 0.7; }]); }
      ringG(0xff9a3a, 0.8);
    } else if (type === 'water') {
      fxBurst(34 * pw, dx, y - 0.2, z, { v: 5.5, up: 2.5, hemi: 1, life: 0.8, s: 0.2, s1: 0.12, cols: [0x4a9cf0, 0x6ab8ff, 0x3a84e0], a: -0.95, g: 13, r: 0.25 }); fxBurst(18 * pw, dx, y - 0.2, z, { v: 5, up: 3, hemi: 1, life: 0.7, s: 0.12, s1: 0.06, cols: [0xffffff, 0xdff2ff], a: 0.9, g: 13, r: 0.25 });
      fxBurst(14, dx, y, z, { v: 2, up: 1, hemi: 1, life: 0.7, s: 0.4, s1: 1.0, cols: [0xffffff, 0xdff2ff], a: 0.4, d: 2 });
      ringG(0xcdeeff); out.push([P(TT.scene, RING, glowT(0x9ad8ff, 0.8), [dx, 0.08, z], 0.2, [1.57, 0, 0]), (m, q) => { const k = Math.max(0, q * 1.4 - 0.4); m.scale.setScalar(0.2 + k * 2); m.material.opacity = 0.8 * (1 - k); }]);
    } else if (type === 'electric') {
      fxBurst(46 * pw, dx, y, z, { v: 7.5, life: 0.4, s: 0.15, s1: 0.03, cols: VOLT, a: 1, g: 7 });
      fxBurst(8, dx, y, z, { v: 1.5, life: 0.35, s: 0.9, s1: 0.3, cols: [0xfff6b0], a: 0.6 });
      for (let i = 0; i < 6; i++) { const a = i * 1.05; out.push([P(TT.scene, 'box', TT.glow(i % 2 ? 0xfff27a : 0xffffff), [dx, 0.1, z], [0.7, 0.06, 0.06], [0, a, 0]), (m, q) => { m.visible = (q * 14 | 0) % 2 === 0; m.position.set(dx + Math.cos(a) * (0.5 + q * 0.9), 0.1 + Math.random() * 0.25, z - Math.sin(a) * (0.5 + q * 0.9)); }]); }
      ringG(0xfff27a, 0.8);
    } else if (type === 'grass' || type === 'bug') {
      fxBurst(30 * pw, dx, y, z, { v: 4, up: 1.5, life: 0.6, s: 0.12, s1: 0.03, cols: LEAF, a: 1, g: 3 });
      for (let i = 0; i < 12; i++) out.push([P(TT.scene, 'sph', TT.glow(i % 2 ? 0x7ad85a : 0x4aa84a), [dx, y, z], [0.2, 0.03, 0.1]), (m, q) => { const a = i * 0.52 + q * 10; m.position.set(dx + Math.cos(a) * (0.5 + q * 0.8), 0.2 + q * 2.4 + i * 0.05, z + Math.sin(a) * (0.5 + q * 0.8)); m.rotation.set(q * 9, a, 0); m.scale.setScalar(1 - q * 0.6); }]);
    } else if (type === 'ice') {
      fxBurst(36 * pw, dx, y, z, { v: 4, up: 1.5, hemi: 1, life: 0.8, s: 0.1, s1: 0.05, cols: [0xffffff], a: 1, g: 4, r: 0.3 });
      fxBurst(16 * pw, dx, y - 0.2, z, { v: 2, life: 0.8, s: 0.5, s1: 1.2, cols: FROST, a: 0.45, d: 2 });
      for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 0.25 + (i % 3) * 0.22, tilt = rand(-0.35, 0.35); out.push([P(TT.scene, 'cone', TT.glow(i % 2 ? 0xd8f2ff : 0x9ad0ff), [dx + Math.cos(a) * r, 0, z + Math.sin(a) * r * 0.7], [0.16, 0.1, 0.16], [0, 0, tilt]), (m, q) => { const k = q < 0.25 ? q / 0.25 : 1; m.scale.set(0.16, (0.5 + (i % 3) * 0.35) * k * pw * (q > 0.75 ? (1 - q) * 4 : 1) + 0.02, 0.16); m.position.y = m.scale.y * 0.5; }]); }
      ringG(0xd8f2ff, 0.8);
    } else if (type === 'psychic') {
      for (let i = 0; i < 26 * pw * FX.q; i++) { const a = Math.random() * 6.283, e = Math.random() * 3.14, r = 1.6; fxAdd(dx + Math.sin(e) * Math.cos(a) * r, y + Math.cos(e) * r, z + Math.sin(e) * Math.sin(a) * r, -Math.sin(e) * Math.cos(a) * r / 0.35, -Math.cos(e) * r / 0.35, -Math.sin(e) * Math.sin(a) * r / 0.35, 0.35, 0.2, 0.05, PSY[(Math.random() * 3) | 0], 0xffffff, 0.95); }
      for (let i = 0; i < 3; i++) out.push([P(TT.scene, RING, glowT(i % 2 ? 0xc060e0 : 0xf06090, 0.85), [dx, y, z], 0.2, [0, 1.57, 0]), (m, q) => { const k = TT.clamp(q * 1.5 - i * 0.25, 0, 1); m.scale.setScalar(0.2 + k * 1.6 * pw); m.material.opacity = 0.85 * (1 - k); m.rotation.z = k * 3; }]);
    } else if (type === 'dragon') {
      fxBurst(52 * pw, dx, y, z, { v: 5.5, life: 0.6, s: 0.3, s1: 0.06, cols: DRAG, a: 0.95, d: 1.5 });
      fxBurst(8, dx, y, z, { v: 1, life: 0.4, s: 1.2, s1: 0.4, cols: [0xc8b0ff], a: 0.6 });
      for (let i = 0; i < 2; i++) out.push([P(TT.scene, RING, glowT(i ? 0x5ab0ff : 0x8a5af8, 0.85), [dx, y, z], 0.2, [0, 1.57, 0]), (m, q) => { const k = TT.clamp(q * 1.4 - i * 0.3, 0, 1); m.scale.setScalar(0.2 + k * 2 * pw); m.material.opacity = 0.85 * (1 - k); }]);
      ringG(0x8a5af8, 0.8);
    } else if (type === 'ghost' || type === 'dark') {
      fxBurst(30 * pw, dx, y, z, { v: 3.2, life: 0.7, s: 0.45, s1: 0.9, cols: [0x2a1648, 0x3a2060], a: -0.6, d: 2 });
      fxBurst(22 * pw, dx, y - 0.3, z, { v: 1.2, up: 2.6, hemi: 1, life: 0.8, s: 0.26, s1: 0.05, cols: GHOST, a: 0.9, r: 0.5 });
      if (type === 'dark') for (let i = 0; i < 3; i++) out.push([P(TT.scene, 'box', new THREE.MeshBasicMaterial({ color: 0x2a1648 }), [dx + (i - 1) * 0.28, y + 0.1, z + 0.45], [0.06, 1.5, 0.06], [0, 0, 0.6]), (m, q) => { m.scale.y = Math.sin(Math.min(1, q * 2.5) * 3.14) * 1.6 + 0.01; }]);
    } else if (type === 'rock') {
      fxBurst(34 * pw, dx, y - 0.3, z, { v: 3.5, up: 1.2, hemi: 1, life: 0.9, s: 0.45, s1: 1.1, cols: DUST, a: -0.5, d: 2, r: 0.3 });
      for (let i = 0; i < 7; i++) { const a = i * 0.9, sp = rand(1.4, 2.6); out.push([P(TT.scene, 'rock', 0x8a8074, [dx, y, z], rand(0.1, 0.2), [rand(0, 3), rand(0, 3), 0]), (m, q) => { m.position.set(dx + Math.cos(a) * q * sp, Math.max(0.1, y + Math.sin(q * 3.14) * 1.3 - q * y), z + Math.sin(a) * q * sp * 0.7); m.rotation.x += 0.3; }]); }
      ringG(0xe8dcc0, 0.7);
    } else if (type === 'steel') {
      fxBurst(44 * pw, dx, y, z, { v: 8, life: 0.4, s: 0.1, s1: 0.02, cols: [0xffffff, 0xfff0b0, 0xffd060], a: 1, g: 9 }); ringG(0xe8eef8, 0.8);
    } else if (type === 'flying') {          // a little whirlwind
      for (let i = 0; i < 40 * pw * FX.q; i++) { const a = Math.random() * 6.283, r = 0.3 + Math.random() * 0.7, sp = 5; fxAdd(dx + Math.cos(a) * r, 0.1 + Math.random() * 0.4, z + Math.sin(a) * r, -Math.sin(a) * sp, 2.5 + Math.random() * 2.5, Math.cos(a) * sp, 0.6, 0.14, 0.3, 0xffffff, 0xdfeeff, 0.6, 0, 2.2); }
      ringG(0xffffff, 0.7);
    } else {                                 // a solid thump: shockwave, dust and stars in the move's colour
      fxBurst(22 * pw, dx, y - 0.4, z, { v: 3.2, flat: 1, life: 0.6, s: 0.35, s1: 0.8, cols: DUST, a: -0.45, d: 2.5, r: 0.2 });
      fxBurst(24 * pw, dx, y, z, { v: 5.5, life: 0.4, s: 0.16, s1: 0.03, cols: C, a: 1, g: 4 });
      ringG(type === 'fighting' ? 0xff6a4a : 0xffffff, 0.85);
      if (type === 'fighting') out.push([P(TT.scene, RING, glowT(0xffb090, 0.9), [dx, y, z + 0.3], 0.2), (m, q) => { m.scale.setScalar(0.2 + q * 1.8 * pw); m.material.opacity = 0.9 * (1 - q); }]);
    }
    return out;
  }
  async function hitFx(dobj, dir, type, dmg, eff, pw) {
    pw = pw || 1;
    const dx = dobj.position.x, y = mid(dobj), z = dobj.position.z;
    TT.sfx.hit(); B.shake = (eff > 1 ? 0.55 : 0.3) * Math.min(1.5, pw); TT.hitStop = eff > 1 ? 0.13 : 0.08; focus(dx > A().x ? 0.5 : -0.5, 0.15);
    if (eff > 1) flash('#ffffff', 0.6);
    fxInit(); fxBurst(18 * pw, dx, y, z + 0.2, { v: 5, life: 0.35, s: 0.2, s1: 0.04, cols: [0xffffff, TT.TYPE_COL[type] || 0xffffff, 0xffe060], a: 1 }); if (eff > 1) fxBurst(10, dx, y, z + 0.2, { v: 1.5, life: 0.3, s: 1.3, s1: 0.4, cols: [0xffffff], a: 0.55 });
    const star = []; for (let i = 0; i < 4; i++) star.push(P(TT.scene, 'box', TT.glow(0xffffff), [dx, y, z + 0.4], [0.9, 0.07, 0.07], [0, 0, i * 0.785]));
    const ring = P(TT.scene, RING, glowT(0xffffff, 0.9), [dx, y, z + 0.3], 0.2), fx = impact(type, dx, y, z, pw);
    const num = TT.label('-' + dmg, eff > 1 ? 'rgba(232,64,42,.95)' : 'rgba(35,50,74,.9)'); num.position.set(dx, y + 0.9, z + 0.5); num.scale.set(1.6, 0.4, 1); TT.scene.add(num);
    await TT.tween(0.5, q => {
      const kb = Math.sin(Math.min(1, q * 1.6) * 3.14);
      dobj.position.x = dx + dir * 0.55 * Math.min(1.5, pw) * (eff > 1 ? 1.3 : 1) * kb + Math.sin(q * 50) * 0.05 * (1 - q); setS(dobj, 1 - 0.16 * kb, 1 + 0.1 * kb); dobj.rotation.z = -dir * 0.32 * kb;
      dobj.visible = q > 0.7 || (q * 12 | 0) % 2 === 0;
      star.forEach(s => s.scale.set(1.5 * (1 - q) + 0.01, 0.07, 0.07));
      ring.scale.setScalar(0.2 + q * 1.4); ring.material.opacity = 0.9 * (1 - q);
      fx.forEach(([m, f]) => f(m, q));
      num.position.y = y + 0.9 + q * 0.8; num.material.opacity = q < 0.7 ? 1 : (1 - q) / 0.3;
    });
    kill(star); TT.scene.remove(ring); fx.forEach(([m]) => TT.scene.remove(m)); TT.scene.remove(num); num.material.map.dispose();
    dobj.position.x = dx; dobj.rotation.z = 0; setS(dobj, 1); dobj.visible = true;
  }
  // the visible part of an attack; `apply` runs at the moment of impact
  async function animAtk(ao, dobj, type, dmg, eff, apply, pw) {
    pw = pw || 1; fxInit();
    const x0 = ao.position.x, y0 = ao.position.y, dir = dobj.position.x > x0 ? 1 : -1, phys = type === 'normal' || type === 'dark' || type === 'bug' || type === 'fighting';
    focus(x0 > A().x ? 0.55 : -0.55, 0.25);
    if (phys) {
      await TT.tween(0.22, q => { ao.position.x = x0 - dir * 0.45 * ease(q); setS(ao, 1 + 0.14 * q, 1 - 0.2 * q); });        // crouch
      TT.sfx.whoosh(); fxBurst(12, x0, 0.15, ao.position.z, { v: 2.4, flat: 1, life: 0.5, s: 0.3, s1: 0.7, cols: DUST, a: -0.45, d: 2.5 });            // dust where it kicks off
      const TC = typeCols(type);
      const reach = Math.abs(dobj.position.x - x0) - 0.9, lines = []; for (let i = 0; i < 4; i++) lines.push(P(TT.scene, 'box', glowT(0xffffff, 0.6), [x0, mid(ao) + (i - 1.5) * 0.18, ao.position.z], [0.8, 0.04, 0.04]));
      await TT.tween(0.16, q => { ao.position.x = x0 - dir * 0.45 + dir * (reach + 0.45) * q; setS(ao, 0.9, 1.15); ao.position.y = y0 + Math.sin(q * 3.14) * 0.6; ao.rotation.z = -dir * 0.4 * q; for (let i = 0; i < 4; i++) fxAdd(ao.position.x - dir * 0.2, mid(ao) + jit(0.3), ao.position.z + jit(0.2), -dir * 2, jit(0.5), 0, 0.3, 0.3, 0.05, TC[(Math.random() * TC.length) | 0], 0xffffff, 0.8); lines.forEach((l, i) => { l.position.x = ao.position.x - dir * (0.6 + i * 0.15); l.material.opacity = 0.6 * (1 - q); }); });  // leap
      kill(lines); apply();
      const back = TT.tween(0.4, q => { ao.position.x = x0 + dir * reach * (1 - ease(q)); ao.position.y = y0 + Math.sin(q * 3.14) * 0.8; ao.rotation.z = -dir * 0.4 * (1 - q); setS(ao, 1); });
      await hitFx(dobj, dir, type, dmg, eff, pw); await back;
      ao.position.x = x0; ao.position.y = y0; ao.rotation.z = 0;
    } else {
      await special(type, ao, dobj, dir, pw);
      apply();
      await hitFx(dobj, dir, type, dmg, eff, pw);
    }
    focus(0, 0);
  }
  // ---------------- how hard a battle is ----------------
  // Each child picks Easy, Normal or Challenge in the menu. On top of that every battle gets a little sharper the further the story has gone (tier 0–4).
  const hard = () => !!(TT.S && TT.S.hard) && !st.watch, easyOn = () => !!(TT.S && TT.S.easy);
  const tier = () => { const f = TT.S.flags; return (f.city ? 1 : 0) + (f.world ? 1 : 0) + (f.tunnel ? 1 : 0) + (TT.S.wishes ? 1 : 0); };
  const critP = side => side === 'foe' ? (easyOn() ? 0 : 0.03 + tier() * 0.012 + (hard() ? 0.05 : 0)) : 0.07 + tier() * 0.01;
  // Timing taps (not in Easy mode): a ring closes on a circle. Tap as they meet for a stronger hit, or, in Challenge, to brace against the foe's hit.
  function timing(label, col) {
    return new Promise(res => {
      let el = $('tapRing'); if (!el) { el = document.createElement('div'); el.id = 'tapRing'; el.innerHTML = '<i></i><b></b><span></span>'; $('battle').appendChild(el); }
      const ring = el.querySelector('i'), txt = el.querySelector('span'); el.style.setProperty('--tc', col); txt.textContent = label; el.className = 'on';
      const dur = hard() ? 0.72 : 0.9, t0 = performance.now(); let done = false, raf = 0;
      const end = k => { if (done) return; done = true; cancelAnimationFrame(raf); el.removeEventListener('pointerdown', tap); txt.textContent = k > 1.2 ? 'Perfect!' : k > 1 ? 'Good!' : k < 0 ? 'Too late!' : 'Missed!'; el.className = 'on ' + (k > 1.2 ? 'perfect' : k > 1 ? 'good' : 'miss'); if (k > 1) TT.sfx.star(); setTimeout(() => { el.className = ''; res(k > 1.2 ? 2 : k > 1 ? 1 : 0); }, 330); };
      const tap = e => { e.preventDefault(); e.stopPropagation(); const q = (performance.now() - t0) / 1000 / dur, off = Math.abs(q - 1); end(off < 0.11 ? 1.3 : off < 0.27 ? 1.1 : 0.5); };
      const frame = () => { const q = (performance.now() - t0) / 1000 / dur; ring.style.transform = 'scale(' + Math.max(0.55, 2.7 - 1.7 * q) + ')'; if (q > 1.32) end(-1); else raf = requestAnimationFrame(frame); };
      el.addEventListener('pointerdown', tap); frame();
    });
  }
  // ---------------- moves that are not attacks ----------------
  // What a trick has done to each side's Pokémon lasts while that Pokémon stays out: ev = turns of dodging, para = turns of paralysis, atk / def = multipliers, guard = blocks the next hit.
  const modOf = side => { const M = st.mod || (st.mod = {}), cur = side === 'me' ? st.me : st.foe; if (!M[side] || M[side].m !== cur) M[side] = { m: cur, ev: 0, para: 0, atk: 1, def: 1, guard: 0 }; return M[side]; };
  const megaK = m => m && m === B.megaMon ? 1.3 : 1, megaD = m => m && m === B.megaMon ? 1.25 : 1;          // a Mega-Evolved Pokémon hits harder and takes less
  async function dodgeFx(o) {          // a blur of after-images
    fxInit(); const x0 = o.position.x, y = mid(o), z = o.position.z; TT.sfx.whoosh();
    await run(0.42, q => { o.position.x = x0 + Math.sin(q * 19) * 0.55 * (1 - q); for (let i = 0; i < 3; i++) fxAdd(o.position.x + jit(0.2), y + jit(0.4), z + jit(0.2), 0, 0, 0, 0.22, 0.7, 0.3, 0xffffff, 0xcfe8ff, 0.35); });
    o.position.x = x0;
  }
  async function zapFx(o) { fxInit(); const x = o.position.x, y = mid(o), z = o.position.z; TT.sfx.move('electric'); await run(0.4, q => { o.position.x = x + Math.sin(q * 60) * 0.05; fxBurst(4, x, y, z, { v: 3.5, life: 0.25, s: 0.12, s1: 0.03, cols: VOLT, a: 1, g: 5, r: 0.4 }); }); o.position.x = x; }
  async function arrowsFx(o, dir, col) {          // light streaming up (stronger) or down (weaker) around a Pokémon
    fxInit(); const x = o.position.x, z = o.position.z, h = (o.userData.h || 1); const ring = P(TT.scene, RING, glowT(col, 0.8), [x, 0.06, z], 0.4, [1.57, 0, 0]);
    await run(0.6, (q, dt) => { ring.scale.setScalar(0.4 + q * 1.1); ring.material.opacity = 0.8 * (1 - q); let n = 90 * dt * FX.q; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, r = 0.35 + Math.random() * 0.35; fxAdd(x + Math.cos(a) * r, dir > 0 ? 0.1 : h * 1.1, z + Math.sin(a) * r, 0, dir * 2.6, 0, 0.5, 0.2, 0.06, col, 0xffffff, 0.95); } });
    TT.scene.remove(ring);
  }
  async function shieldFx(o) {
    fxInit(); const x = o.position.x, y = mid(o), z = o.position.z, r = (o.userData.h || 1) * 0.75, sh = P(TT.scene, 'sph', glowT(0x7ae8b0, 0.5), [x, y, z], r); TT.sfx.blip();
    fxBurst(16, x, y, z, { v: 2.5, life: 0.4, s: 0.16, s1: 0.04, cols: [0xffffff, 0x9af0c0], a: 1 });
    await run(0.5, q => { sh.scale.setScalar(r * (0.7 + 0.45 * Math.sin(Math.min(1, q * 2) * 1.57))); sh.material.opacity = 0.55 * (1 - q * q); });
    TT.scene.remove(sh);
  }
  async function trick(k, type, am, dm, ao, dobj, att, an, dn) {
    TT.sfx.move(type);
    if (k === 'evade') { if (am) am.ev = 3; await dodgeFx(ao); await say(an + ' is moving too fast to see!', 0.9); }
    else if (k === 'para') { if (dm) dm.para = 3; await zapFx(dobj); await say(dn + ' is paralysed! It might not be able to move.', 1); }
    else if (k === 'atkdn') { if (dm) dm.atk = Math.max(0.5, dm.atk * 0.75); await arrowsFx(dobj, -1, 0x6ab0ff); await say(dn + "'s attacks got weaker!", 0.9); }
    else if (k === 'defdn') { if (dm) dm.def = Math.min(1.7, dm.def * 1.3); await arrowsFx(dobj, -1, 0xc080ff); await say(dn + "'s guard dropped!", 0.9); }
    else if (k === 'atkup') { if (am) am.atk = Math.min(1.8, am.atk * 1.35); await arrowsFx(ao, 1, 0xff8a3a); await say(an + ' powered up!', 0.9); }
    else if (k === 'guard') { if (am) am.guard = 1; await shieldFx(ao); await say(an + ' is ready to block the next hit!', 0.9); }
    else if (k === 'heal') { const mx = mxOf(att), h = Math.max(0, Math.min(mx - att.hp, Math.round(mx * 0.45))); att.hp += h; bars(); await arrowsFx(ao, 1, 0x7ae87a); await say(h ? an + ' healed itself!' : an + ' is already full of energy.', 0.9); }
  }
  // ---------------- Mega Evolution ----------------
  // Once per battle, with the Key Stone: light gathers, the Pokémon spins inside a shining shell, and bursts out in its Mega form. It hits harder and takes less until it leaves the battle.
  const RAINBOW = [0xff6a9a, 0xffd23a, 0x6ad8ff, 0x9a6aff, 0x7ae87a, 0xffffff];
  async function megaEvolve() {
    const m = st.me, M = TT.MEGA[m.sp], old = st.obj.me, x = old.position.x, z = old.position.z, y = mid(old), nm = TT.monName(m); st.megaUsed = true; fxInit();
    gesture('cheer', 2.2); focus(-0.6, 0.4); await say('The Key Stone is shining!', 0.8);
    const glow = P(TT.scene, 'sph', glowT(0xffffff, 0), [x, y, z], 0.3), R = (old.userData.h || 1) * 0.85; TT.sfx.evo();
    await run(1.4, (q, dt) => {
      let n = 190 * dt * FX.q; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, e = Math.random() * 3.14, r = 2.4; fxAdd(x + Math.sin(e) * Math.cos(a) * r, y + Math.cos(e) * r * 0.8, z + Math.sin(e) * Math.sin(a) * r, -Math.sin(e) * Math.cos(a) * r / 0.38, -Math.cos(e) * r * 0.8 / 0.38, -Math.sin(e) * Math.sin(a) * r / 0.38, 0.38, 0.24, 0.05, RAINBOW[(Math.random() * 6) | 0], 0xffffff, 0.95); }
      glow.scale.setScalar(R * (0.3 + q * 1.2)); glow.material.opacity = Math.min(1, q * 1.2); setS(old, 1 + q * 0.12); old.rotation.y = old.userData.ry + q * q * 14;
    });
    flash('#ffffff', 0.95); B.shake = 0.9; TT.hitStop = 0.14;
    const o = TT.creature(M[0]); o.userData.sp = m.sp; o.userData.s0 = o.scale.x; o.userData.ry = old.userData.ry; o.position.set(x, 0, z); o.rotation.y = o.userData.ry;
    TT.scene.remove(old); TT.dispose(old); TT.scene.add(o); st.obj.me = o; B.megaMon = m; bars(); TT.cry(m.sp, 0.8);
    fxBurst(80, x, y, z, { v: 7.5, life: 0.8, s: 0.3, s1: 0.05, cols: RAINBOW, a: 1, d: 1.6 });
    const rings = [0, 1, 2].map(i => P(TT.scene, RING, glowT(RAINBOW[i * 2], 0.9), [x, 0.08 + i * 0.5, z], 0.3, [1.57, 0, 0]));
    await run(0.6, q => { glow.scale.setScalar(R * 1.5 * (1 + q * 1.2)); glow.material.opacity = 1 - q; setS(o, 1.25 - 0.25 * q); rings.forEach((r, i) => { r.scale.setScalar(0.3 + q * (2.2 + i * 0.6)); r.material.opacity = 0.9 * (1 - q); }); });
    TT.scene.remove(glow); kill(rings); setS(o, 1);
    await say(nm + ' Mega Evolved into ' + M[1] + '!', 1.7); focus(0, 0);
  }
  // which move the other side uses: mostly attacks, now and then a trick that would actually help
  const foeMove = () => { const mv = TT.moves(st.foe), hit = mv.filter(v => !v[4]), M = modOf('foe'), tr = mv.filter(v => v[4] && !(v[4] === 'guard' && M.guard) && !(v[4] === 'heal' && st.foe.hp > mxOf(st.foe) * 0.6) && !(v[4] === 'para' && modOf('me').para) && !(v[4] === 'evade' && M.ev) && !(v[4] === 'atkup' && M.atk > 1.3));
    if (tr.length && hit.length && Math.random() < (easyOn() ? 0.06 : 0.12 + tier() * 0.03 + (hard() ? 0.1 : 0))) return TT.pick(tr);
    const pool = hit.length ? hit : mv, my = TT.DEX[st.me.sp][1], best = pool.slice().sort((a, b) => b[2] * TT.eff(b[1], my) - a[2] * TT.eff(a[1], my))[0];
    return Math.random() < TT.clamp(0.2 + tier() * 0.13 + (hard() ? 0.25 : 0) - (easyOn() ? 0.2 : 0), 0, 0.92) ? best : TT.pick(pool); };
  // test hook: play one move's visuals in the current battle without changing anything, e.g. TT.Battle.fxTest('fire', 1.5)
  B.fxTest = (type, pw, foe) => st ? animAtk(foe ? st.obj.foe : st.obj.me, foe ? st.obj.me : st.obj.foe, type, 12, 1, () => { }, pw) : null;
  async function attack(att, def, mv, ao, dobj, mult, who) {
    const as = ao === st.obj.me ? 'me' : ao === st.obj.foe ? 'foe' : null, ds = dobj === st.obj.me ? 'me' : dobj === st.obj.foe ? 'foe' : null;
    const am = as && !st.watch ? modOf(as) : null, dm = ds && !st.watch ? modOf(ds) : null, an = (who ? who + "'s " : '') + TT.monName(att), dn = TT.monName(def);
    if (am && am.para > 0) { am.para--; if (Math.random() < 0.4) { await zapFx(ao); await say(an + " is paralysed! It can't move!", 0.9); return; } }
    if (ao === st.obj.me) gesture('point', 0.9);
    await say(an + ' used ' + mv[0] + '!', 0.5);
    if (mv[4]) return trick(mv[4], mv[1], am, dm, ao, dobj, att, an, dn);
    if (dm && dm.guard) { dm.guard = 0; await shieldFx(dobj); await say(dn + ' blocked it!', 0.8); return; }
    if (dm && dm.ev > 0) { dm.ev--; if (Math.random() < 0.45) { await dodgeFx(dobj); await say(dn + ' dodged it!', 0.8); return; } }
    const eff = TT.eff(mv[1], TT.DEX[def.sp][1]), crit = !st.watch && as && Math.random() < critP(as);
    // Easy mode (a switch in the menu, per child): your side hits harder and takes less
    const ez = TT.S && TT.S.easy && !st.watch ? (dobj === st.obj.foe ? 1.4 : dobj === st.obj.me ? 0.65 : 1) : 1;
    const dmg = Math.max(1, Math.floor(mv[2] * TT.stat(att, 3) / TT.stat(def, 4) * 0.3 * (mult || 1) * eff * ez * (am ? am.atk : 1) * (dm ? dm.def : 1) * megaK(att) / megaD(def) * (crit ? 1.5 : 1) * TT.rand(0.85, 1)));
    const hp = Math.max(0, def.hp - dmg);
    const pw = TT.clamp(mv[2] / 55, 0.75, 1.7) * (att.sup && att.sup[0] === mv[0] ? 1.15 : 1) * (crit ? 1.25 : 1);          // stronger moves look bigger
    emit('atk', { s: sideOf(ao), ty: mv[1], dmg, hp, eff, pw });
    if (crit) { flash('#fff2b0', 0.5); B.shake = Math.max(B.shake, 0.6); }
    await animAtk(ao, dobj, mv[1], dmg, eff, () => { def.hp = hp; bars(); }, pw);
    if (crit) await say(oneOf('crit', ['A critical hit!', 'Right on the weak spot! A critical hit!', 'Wham! A critical hit!']), 0.7);
    if (eff > 1) await say(oneOf('se', ["It's super effective!", 'A super effective hit!', 'That really worked!', 'Super effective! What a hit!']), 0.8); else if (eff < 1) await say(oneOf('nve', ["It's not very effective...", 'That barely tickled...', 'Not very effective. Try another move!']), 0.8);
  }
  async function faint(o, dir) {
    emit('faint', { s: sideOf(o) }); o.userData.shut = true;       // eyes closed
    TT.cry(o.userData.sp, 0.6);
    if (o.userData.aura) { kill(o.userData.aura); o.userData.aura = null; }
    await TT.tween(0.3, q => { o.rotation.z = dir * 1.45 * ease(q); o.position.y = Math.sin(q * 3.14) * 0.15; });
    B.shake = o.userData.boss ? 0.8 : 0.15; if (o.userData.boss) { flash('#ffffff', 0.8); TT.hitStop = 0.25; }
    await TT.wait(0.25);
    const dust = parts(8, [0xd8c8a8, 0xffffff], o.position.x, 0.2, o.position.z, 0.15);
    fxInit(); fxBurst(26, o.position.x, 0.3, o.position.z, { v: 2.6, up: 1, hemi: 1, life: 0.9, s: 0.5, s1: 1.2, cols: DUST, a: -0.5, d: 2, r: 0.4 }); fxBurst(8, o.position.x, 0.8, o.position.z, { v: 1.5, up: 2.5, hemi: 1, life: 0.9, s: 0.16, s1: 0.05, cols: [0xfff27a, 0xffffff], a: 1, g: 2 });
    await TT.tween(0.4, q => { setS(o, Math.max(0.01, 1 - q)); o.position.y = -q * 0.2; dust.forEach((d, i) => { const a = i * 0.785; d.position.set(o.position.x + Math.cos(a) * q * 1.6, 0.2 + q * 0.4, o.position.z + Math.sin(a) * q * 1.6); d.scale.setScalar(0.2 * (1 - q)); }); });
    kill(dust); o.visible = false;
  }

  // ---------------- bosses ----------------
  B.bossMon = (sp, lvl, mul) => { const m = TT.mon(sp, lvl); m.boss = 1; m.mx = Math.round(TT.maxHp(m) * (mul || 2.2)); m.hp = m.mx; return m; };
  async function bossIntro(o, m, title, music) {
    emit('bossintro', { title, music });
    const nm = TT.monName(m), sp = m.sp, bx = o.position.x, bz = o.position.z;
    document.body.classList.add('bossmode'); TT.music(music || 'boss');
    const card = $('bossCard'); card.innerHTML = '<small>⚠ BOSS BATTLE ⚠</small><b></b><span></span>'; card.querySelector('b').textContent = nm; card.querySelector('span').textContent = title || '';
    const style = sp === 'rayquaza' || sp === 'shenron' || sp === 'mewtwo' ? 'descend' : sp === 'mecha' ? 'rise' : 'wake';
    if (sp === 'shenron') for (const d of [300, 900, 1500]) setTimeout(() => { if (st) { flash('#ffffff', 0.7); TT.sfx.zap(); } }, d);
    if (style === 'descend') o.position.y = 12; if (style === 'rise') o.position.y = -4.5;
    const ry = o.rotation.y; cam.ov = (c, t, k) => { const a = ry - 0.75 + k * 0.85, r = 9.5 - k * 2; c.position.set(bx + Math.sin(a) * r, 0.9 + k * 1.6, bz + Math.cos(a) * r); c.lookAt(bx, 1.7 + (1 - k) * 0.5, bz); };
    cam.ok = 0; o.userData.roared = 0;
    // the camera swings right round the boss: everyone else steps out of the picture for a moment
    const hid = (st.allyObjs || []).concat(st.humans || []).filter(q => q && q.visible); hid.forEach(q => { q.visible = false; });
    const ring = P(TT.scene, RING, glowT(0xff6a3a, 0.8), [bx, 0.08, bz], 0.5, [1.57, 0, 0]), dust = parts(12, [0xd8c8a8, 0xc8b898], bx, 0.2, bz, 0.12);
    TT.sfx.battle(); setTimeout(() => card.classList.add('on'), 350);
    await TT.tween(2.6, q => {
      cam.ok = ease(q);
      if (style === 'descend') o.position.y = 12 * Math.pow(1 - TT.clamp(q * 1.4, 0, 1), 2);
      else if (style === 'rise') o.position.y = -4.5 * (1 - ease(TT.clamp(q * 1.3, 0, 1))) + (q > 0.2 && q < 0.78 ? rand(-0.05, 0.05) : 0);
      else { const k = TT.clamp((q - 0.25) * 2, 0, 1); setS(o, 1 + Math.sin(k * 3.14) * 0.18, 1 - Math.sin(k * 3.14) * 0.12); }
      if (q > 0.45 && !o.userData.roared) { o.userData.roared = 1; TT.cry(sp, 0.65); B.shake = 1; TT.hitStop = 0.1; flash('#ffe0c0', 0.5); }
      ring.scale.setScalar(0.5 + Math.max(0, q - 0.45) * 9); ring.material.opacity = q < 0.45 ? 0 : 0.8 * (1 - (q - 0.45) / 0.55);
      dust.forEach((d, i) => { const a = i * 0.52, k = Math.max(0, q - 0.45) / 0.55; d.position.set(bx + Math.cos(a) * k * 4, 0.2 + Math.sin(k * 3.14) * 0.6, bz + Math.sin(a) * k * 4); d.scale.setScalar(0.14 * (1 - k)); });
    });
    TT.scene.remove(ring); kill(dust); o.position.y = 0; setS(o, 1);
    card.classList.remove('on'); cam.ov = null; document.body.classList.remove('bossmode'); hid.forEach(q => { q.visible = true; });
  }
  function addAura(o, col) {
    if (o.userData.aura) return;
    const a = [P(TT.scene, 'sph', glowT(col, 0.18), [0, 0, 0], 1), P(TT.scene, 'sph', glowT(col, 0.1), [0, 0, 0], 1)];
    o.userData.aura = a;
  }
  async function rage(o, m) {
    emit('rage', {});
    m.raged = 1; st.rageMul = 1.3; TT.cry(m.sp, 0.55); flash('#ff4020', 0.45); B.shake = 0.8; TT.hitStop = 0.15;
    addAura(o, 0xff3a1a);
    await say(TT.monName(m) + ' is furious! Its attacks got stronger!', 1.4);
  }
  async function sigAnim(o, target, look, col, apply, dmg) {
    const bx = o.position.x, tx = target.position.x, tz = target.position.z, ty = mid(target), dir = tx > bx ? 1 : -1;
    focus(bx > A().x ? 0.6 : -0.6, 0.2);
    if (look === 'slam') {
      await TT.tween(0.35, q => { setS(o, 1 + 0.2 * q, 1 - 0.25 * q); });
      TT.sfx.whoosh();
      await TT.tween(0.55, q => { o.position.y = Math.sin(q * 3.14) * 4.5; o.position.x = bx + (tx - bx) * 0.75 * q; setS(o, 0.95, 1.1); });
      apply(); TT.sfx.hit(); B.shake = 1.2; TT.hitStop = 0.18; flash('#ffffff', 0.5);
      const rings = [0, 1, 2].map(i => P(TT.scene, RING, glowT(i ? 0xd8c8a8 : 0xffffff, 0.8), [o.position.x, 0.08, tz], 0.4, [1.57, 0, 0])), dust = parts(14, [0xd8c8a8, 0xfff0d0], o.position.x, 0.2, tz, 0.22), sx = o.position.x;
      const back = TT.tween(0.5, q => { o.position.x = bx + (tx - bx) * 0.75 * (1 - ease(q)); o.position.y = Math.sin(q * 3.14) * 0.8; });
      await TT.tween(0.6, q => { rings.forEach((r, i) => { const k = TT.clamp(q * 1.3 - i * 0.15, 0, 1); r.scale.setScalar(0.4 + k * 4.5); r.material.opacity = 0.8 * (1 - k); }); dust.forEach((d, i) => { const a = i * 0.45; d.position.set(sx + Math.cos(a) * q * 3.5, 0.2 + Math.sin(q * 3.14) * 1, tz + Math.sin(a) * q * 3.5); d.scale.setScalar(0.25 * (1 - q)); }); target.position.y = Math.sin(TT.clamp(q * 2, 0, 1) * 3.14) * 0.9; });
      await back; rings.forEach(r => TT.scene.remove(r)); kill(dust); o.position.x = bx; o.position.y = 0; target.position.y = 0;
    } else {
      const mouth = [bx + dir * 0.6 * o.scale.x, mid(o) + 0.3, o.position.z + 0.3];
      const orb = P(TT.scene, 'sph', glowT(col, 0.9), mouth, 0.1), core = P(TT.scene, 'sph', TT.glow(0xffffff), mouth, 0.05), sp = parts(12, [col, 0xffffff], mouth[0], mouth[1], mouth[2], 0.07);
      TT.sfx.zap();
      await TT.tween(0.85, q => { orb.scale.setScalar(0.1 + q * 0.55 + Math.sin(q * 40) * 0.04); core.scale.setScalar(0.05 + q * 0.3); sp.forEach((p, i) => { const a = i * 0.52 + q * 8, r = 1.6 * (1 - q); p.position.set(mouth[0] + Math.cos(a) * r, mouth[1] + Math.sin(a) * r, mouth[2] + Math.sin(a * 1.3) * r * 0.5); }); B.shake = 0.2 * q; });
      kill(sp);
      const dx = tx - mouth[0], dy = ty - mouth[1], len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) - Math.PI / 2, c3 = [(mouth[0] + tx) / 2, (mouth[1] + ty) / 2, (mouth[2] + tz) / 2];
      const beam = P(TT.scene, 'cyl', glowT(col, 0.75), c3, [0.5, len, 0.5], [0, 0, ang]), inner = P(TT.scene, 'cyl', TT.glow(0xffffff), c3, [0.18, len, 0.18], [0, 0, ang]);
      TT.sfx.move('electric'); flash(hex(col), 0.5); B.shake = 1; TT.hitStop = 0.12;
      let done = false;
      await TT.tween(0.7, q => { const w = 0.5 + Math.sin(q * 50) * 0.08; beam.scale.set(w * (1 - q * 0.6), len, w * (1 - q * 0.6)); inner.scale.set(0.18 * (1 - q * 0.6), len, 0.18 * (1 - q * 0.6)); orb.scale.setScalar(0.65 * (1 - q)); if (q > 0.25 && !done) { done = true; apply(); } });
      [orb, core, beam, inner].forEach(m => TT.scene.remove(m));
    }
    await hitFx(target, dir, 'normal', dmg, 1);
    focus(0, 0);
  }
  async function bossSig(m, o, target, def, mult) {
    const sg = TT.BOSS_SIG[m.sp]; if (!sg) return false;
    await say(TT.monName(m) + ' used ' + sg[0] + '!', 0.6);
    const eff = TT.eff(sg[1], TT.DEX[def.sp][1]), dmg = Math.max(1, Math.floor(sg[2] * TT.stat(m, 3) / TT.stat(def, 4) * 0.3 * mult * eff * TT.rand(0.9, 1))), hp = Math.max(0, def.hp - dmg);
    const col = { snorlax: 0xfff0d0, mecha: 0xff3a3a, rayquaza: 0x6aff9a }[m.sp] || 0xffffff;
    emit('sig', { look: sg[3], col, dmg, hp });
    await sigAnim(o, target, sg[3], col, () => { def.hp = hp; bars(); }, dmg);
    return true;
  }
  // a trainer powering up between Pokémon (Goku turning Super Saiyan)
  async function powerUp(h, to) {
    emit('tf', { to });
    if (!h) return;
    const x = h.position.x, z = h.position.z, au = [];
    for (let i = 0; i < 7; i++) au.push(P(TT.scene, 'cone', glowT(i % 2 ? 0xffe060 : 0xfff6c0, 0.45), [x, 1, z], [0.6, 2.4, 0.6]));
    TT.sfx.evo(); B.shake = 0.8; focus(0.7, 0.3);
    await TT.tween(1.4, q => { au.forEach((a, i) => { const k = (q * 3 + i / 7) % 1; a.position.set(x + Math.cos(i) * 0.25, 0.6 + k * 1.6, z + Math.sin(i) * 0.25); a.scale.set(0.5 * (1 - k) + 0.15, 1.8 + k, 0.5 * (1 - k) + 0.15); a.material.opacity = 0.5 * (1 - k); }); h.position.y = Math.sin(q * 30) * 0.03; });
    flash('#fff6b0', 0.9); TT.hitStop = 0.2;
    const i = st.humans.indexOf(h), nh = TT.human(TT.PEOPLE[to]); nh.position.copy(h.position); nh.position.y = 0; nh.rotation.y = h.rotation.y; TT.scene.add(nh);
    TT.scene.remove(h); if (i >= 0) st.humans[i] = nh; st.extras.push(nh); const ti = st.trainers.indexOf(h); if (ti >= 0) st.trainers[ti] = nh; nh.userData.gesture = 'cheer';
    kill(au); const aura = []; for (let k = 0; k < 4; k++) aura.push(P(TT.scene, 'cone', glowT(0xffe060, 0.25), [nh.position.x, 1, nh.position.z], [0.7, 2.6, 0.7])); st.ssAura = { list: aura, h: nh };
    focus(0, 0);
  }

  // ---------------- XP, evolution, catching ----------------
  async function gainXp(m, amount) {
    if (hard()) amount = Math.round(amount * 1.3);          // Challenge pays better
    m.xp += amount; await say(TT.monName(m) + ' got ' + amount + ' XP!' + (hard() ? ' (Challenge bonus)' : ''), 0.8); bars();
    while (m.xp >= TT.xpNeed(m)) {
      m.xp -= TT.xpNeed(m); m.lvl++; m.hp = TT.maxHp(m); TT.sfx.level(); bars();
      const o = st.obj.me, x = o.position.x, z = o.position.z, sp = parts(10, [0xffe060, 0xffffff], x, 0, z, 0.09);
      setMsg(TT.monName(m) + ' grew to level ' + m.lvl + '!');
      await TT.tween(0.9, q => { o.position.y = Math.abs(Math.sin(q * 6.28)) * 0.35; sp.forEach((p, i) => { const a = i * 0.628 + q * 6; p.position.set(x + Math.cos(a) * 0.7, q * 2 + (i % 3) * 0.15, z + Math.sin(a) * 0.7); p.scale.setScalar(0.1 * (1 - q * 0.7)); }); });
      kill(sp); o.position.y = 0; await TT.wait(0.4);
      for (const mv of TT.DEX[m.sp][5]) if (mv[3] === m.lvl) await say(TT.monName(m) + ' learned ' + mv[0] + '!', 1.2);
    }
  }
  async function evolve(m) {
    const ev = TT.DEX[m.sp][6]; if (!ev || m.lvl < ev[1]) return;
    st.me = m; let o = await place(-1, m); bars();
    const old = TT.monName(m), x = o.position.x, z = o.position.z; TT.music(null);
    focus(-0.6, 0.35);
    await say('What? ' + old + ' is evolving!', 1.3); TT.sfx.evo();
    const glow = P(TT.scene, 'sph', glowT(0xffffff, 0), [x, 0.6, z], 1), sp = parts(14, [0xffffff, 0xbfe8ff, 0xffe060], x, 0, z, 0.09);
    await TT.tween(2.2, q => {
      const pulse = 0.5 + 0.5 * Math.sin(q * q * 40); setS(o, 1 + pulse * 0.2 * q); o.rotation.y = o.userData.ry + q * q * 12;
      glow.material.opacity = Math.min(1, q * 1.2) * (0.6 + 0.4 * pulse); glow.scale.setScalar(0.5 + q * 0.7);
      sp.forEach((p, i) => { const a = i * 0.45 + q * 9, r = 1.8 * (1 - q) + 0.2; p.position.set(x + Math.cos(a) * r, 0.2 + (i % 4) * 0.4, z + Math.sin(a) * r); });
    });
    const hpK = m.hp / TT.maxHp(m); m.sp = ev[0]; delete m.use; m.hp = Math.max(1, Math.round(TT.maxHp(m) * Math.max(hpK, 0.5)));
    flash('#ffffff', 0.9);
    o = await place(-1, m); bars(); TT.sfx.caught(); B.shake = 0.3;
    await TT.tween(0.6, q => { glow.scale.setScalar(1.2 + q * 2.5); glow.material.opacity = 1 - q; setS(o, 0.6 + 0.4 * ease(q) + Math.sin(q * 3.14) * 0.15); sp.forEach((p, i) => { const a = i * 0.45; p.position.set(x + Math.cos(a) * q * 2.4, 0.7 + Math.sin(a * 2) * q, z + Math.sin(a) * q * 2.4); p.scale.setScalar(0.1 * (1 - q)); }); });
    TT.scene.remove(glow); kill(sp); setS(o, 1); TT.cry(m.sp);
    gesture('cheer', 2);
    await say('Wow! ' + old + ' evolved into ' + TT.monName(m) + '!', 2.2);
    focus(0, 0);
  }
  // the visible part of a ball throw (same on the owner's and a watcher's screen)
  async function ballAnim(ok, shakes) {
    const fo = st.obj.foe, fs = spot(1), fy = mid(fo), tr = st.me_h, gy = 0.2;
    tr.userData.gesture = 'throw'; tr.userData.gk = 0; focus(0.4, 0.2);
    await TT.tween(0.3, q => { tr.userData.gk = q * 0.5; });
    TT.sfx.throw();
    const ball = TT.ballModel(0.2), bx = tr.position.x + 0.5, by = 1.5; TT.scene.add(ball); st.extras.push(ball);
    await TT.tween(0.5, q => { tr.userData.gk = 0.5 + q * 0.5; ball.position.set(bx + (fs[0] - bx) * q, by + (fy + 0.3 - by) * q + Math.sin(q * 3.14) * 1.6, tr.position.z + (fs[1] + 0.3 - tr.position.z) * q); ball.rotation.x -= 0.5; });
    tr.userData.gesture = null;
    const fl = P(TT.scene, 'sph', glowT(0xff5a4a, 0.85), [fs[0], fy, fs[1]], 0.3); TT.sfx.open();
    await TT.tween(0.35, q => { setS(fo, Math.max(0.01, 1 - q)); fo.position.y = q * fy; fl.scale.setScalar(0.9 * (1 - q) + 0.12); ball.rotation.x = 0; ball.rotation.z = Math.sin(q * 12) * 0.2; });
    fo.visible = false; TT.scene.remove(fl); if (fo.userData.aura) fo.userData.aura.forEach(a => { a.visible = false; });
    await TT.tween(0.6, q => { const h = (fy + 0.3 - gy); ball.position.y = gy + h * Math.abs(Math.cos(q * 4.7)) * (1 - q); });
    ball.position.y = gy; TT.sfx.shake(); focus(0.6, 0.45);
    for (let i = 0; i < shakes; i++) { await TT.wait(0.35); TT.sfx.shake(); await TT.tween(0.4, q => { ball.rotation.z = Math.sin(q * 6.28) * 0.55; ball.position.x = fs[0] + Math.sin(q * 6.28) * 0.08; }); }
    await TT.wait(0.3);
    if (ok) {
      TT.sfx.caught(); gesture('cheer', 2.5); flash('#fff6b0', 0.4);
      const stars = parts(9, [0xffe060, 0xffffff], fs[0], gy, fs[1] + 0.3, 0.1);
      await TT.tween(0.7, q => { ball.position.y = gy + Math.sin(q * 3.14) * 0.15; stars.forEach((s, i) => { const a = i * 0.7 + 0.3; s.position.set(fs[0] + Math.cos(a) * q * 1.3, gy + Math.abs(Math.sin(a)) * q * 1.5 + 0.2, fs[1] + 0.3); s.scale.setScalar(0.12 * (1 - q * 0.8)); }); });
      kill(stars); focus(0, 0); return;
    }
    TT.sfx.bad(); const fl2 = P(TT.scene, 'sph', glowT(0xffffff, 0.9), [fs[0], gy, fs[1]], 0.2); TT.scene.remove(ball); fo.visible = true;
    await TT.tween(0.3, q => { setS(fo, Math.max(0.01, ease(q)) * (1 + Math.sin(q * 3.14) * 0.2)); fo.position.y = Math.sin(q * 3.14) * 0.4; fl2.scale.setScalar(0.2 + q * 1.4); fl2.material.opacity = 0.9 * (1 - q); });
    TT.scene.remove(fl2); setS(fo, 1); fo.position.y = 0; focus(0, 0);
  }
  async function throwBall() {
    const S = TT.S, foe = st.foe;
    S.balls--; setMsg(oneOf('throw', ['You threw a Poké Ball!', 'Poké Ball, go!', 'Here goes a Poké Ball!']));
    const k0 = foe.hp / mxOf(foe), chance = k0 < 0.3 ? 1 : TT.clamp(0.3 + 0.75 * (1 - k0) - (foe.boss ? 0.25 : 0), 0, 1), ok = Math.random() < chance, shakes = ok ? 3 : 1 + (Math.random() * 2 | 0);
    emit('ball', { ok, shakes });
    await ballAnim(ok, shakes);
    await say(ok ? oneOf('caught', ['Gotcha! ' + TT.monName(foe) + ' was caught!', 'Yes! You caught ' + TT.monName(foe) + '!', TT.monName(foe) + ' is yours now!']) : oneOf('free', ['Oh no! ' + TT.monName(foe) + ' broke free!', 'So close! ' + TT.monName(foe) + ' popped out!', TT.monName(foe) + ' shook the ball open!']), ok ? 1.6 : 1);
    return ok;
  }

  // ---------------- a battle ----------------
  // opts: { foes:[mon], wild, trainer, people:[keys], easy, stage, allies:[{h, sp, n, mv}], music, after, bossTitle, bossMusic, transform:{at, to, say} }
  B.start = async function (opts) {
    const S = TT.S, stage = W.STAGES[opts.stage] ? opts.stage : 'meadow';
    // the way in: two flashes, the camera rushes toward your trainer, and a swirl closes over the screen
    TT.sfx.battle(); TT.music(opts.music || 'battle'); flash('#ffffff', 0.75);
    TT.tween(0.62, q => { TT.camZoom = 1 - 0.42 * ease(q); });
    await TT.wait(0.14); flash('#ffffff', 0.55);
    await TT.wipeTo(1, 0.5, 0);
    TT.camZoom = 1; W.ARENA = W.STAGES[stage]; W.applyStage(stage);
    st = { noCatch: !!opts.noCatch, foes: opts.foes, fi: 0, wild: !!opts.wild, easy: !!opts.easy, obj: {}, extras: [], humans: [], assists: [], trainers: [], trainer: opts.trainer || '', people: opts.people || [], allies: (opts.allies || []).map(a => Object.assign({}, a)), stage, rageMul: 1, bt: 0, turn: 0, allyObjs: [] };
    if (S.hard) for (const m of st.foes) { if (m.up) continue; m.up = 1; if (m.boss) { m.mx = Math.round(m.mx * 1.25); m.hp = m.mx; } else { m.lvl += st.wild ? 1 : 2; m.hp = TT.maxHp(m); } }          // Challenge: tougher foes
    st.foe = st.foes[0]; st.me = S.party.find(m => m.hp > 0);
    fxInit(); fxAdd(A().x, 1, A().z, 0, 0, 0, 0.3, 0.05, 0.05, 0xffffff, null, 0.02);          // one faint speck: makes the graphics chip get the particle shader ready now
    B.active = true; camK = 0; cam.f = cam.tf = 0; cam.z = cam.tz = 0;
    st.me_h = addHuman(S.ch, -4.7, -0.9, 1.25);
    st.people.forEach((k, i) => st.trainers.push(addHuman(k, 4.3 + i * 1.5, 0.1 - i * 1.9, -1.25)));
    placeAllies(st.allies);
    $('battle').classList.remove('hide'); $('bmenu').innerHTML = ''; $('bmsg').textContent = '';
    await TT.wipeTo(0, 0.45, 1);      // the stage opens up from the middle
    const fo = await place(1, st.foe, !st.wild && !st.foe.boss); await place(-1, st.me); st.obj.me.visible = false; bars();
    TT.tween(1.2, q => { camK = ease(q); });
    if (st.foe.boss) { await TT.wait(0.4); await bossIntro(fo, st.foe, opts.bossTitle, opts.bossMusic); }
    else if (st.wild) TT.cry(st.foe.sp);
    await say(st.foe.boss ? TT.monName(st.foe) + ' wants to battle!' : st.wild ? wildLine(TT.monName(st.foe), opts.stage) : opts.trainer + ' sent out ' + TT.monName(st.foe) + '!', 1.3);
    if (st.allies.length) await say((st.allies.length > 2 ? st.allies.slice(0, -1).map(a => a.n).join(', ') + ' and ' + st.allies[st.allies.length - 1].n : st.allies.map(a => a.n).join(' and ')) + (st.allies.length > 1 ? ' are' : ' is') + ' here to help!', 1);
    setMsg(goLine(TT.monName(st.me))); gesture('point', 0.8); await place(-1, st.me, true); await TT.wait(0.35);
    let result = null;
    // a foe ran out of HP: faint, XP, next foe. Returns true when the battle is won.
    const foeDown = async () => {
      await faint(st.obj.foe, 1); await say((st.foe.boss ? '' : st.wild ? 'The wild ' : "The foe's ") + TT.monName(st.foe) + (st.foe.boss ? ' was defeated!' : ' fainted!'), 0.9);
      await gainXp(st.me, Math.round((st.foe.lvl * 9 + 6) * (st.wild ? 1 : 1.4) * (st.foe.boss ? 2 : 1)));
      if (++st.fi < st.foes.length) {
        st.foe = st.foes[st.fi]; st.rageMul = 1;
        if (opts.transform && opts.transform.at === st.fi) { await say(opts.trainer + ' is powering up!', 0.6); await powerUp(st.trainers[0], opts.transform.to); if (opts.transform.say) await say(opts.transform.say, 1.4); }
        bars(); setMsg(opts.trainer + ' sent out ' + TT.monName(st.foe) + '!');
        const o = await place(1, st.foe, !st.foe.boss); if (st.foe.boss) await bossIntro(o, st.foe, opts.bossTitle, opts.bossMusic); else await TT.wait(0.5);
        return false;
      }
      return true;
    };
    const checkRage = async () => { if (st.foe.boss && !st.foe.raged && st.foe.hp > 0 && st.foe.hp < mxOf(st.foe) / 2) await rage(st.obj.foe, st.foe); };
    while (!result) {
      if (B.megaMon && B.megaMon !== st.me) B.megaMon = null;          // a Mega form ends when that Pokémon leaves the battle
      const act = st.assists.length ? { t: 'assist' } : await choose(); let foeTurn = true;
      if (act.t === 'assist') {            // a helper attack (a friend, Gohan or Goku): a free bonus hit
        const a = st.assists.shift(); foeTurn = false; $('bmenu').classList.add('off');
        if (a && st.foe.hp > 0) {
          let o = a.o; if (!o) { if (!st.obj.ally || st.obj.ally.userData.sp !== a.sp) placeAlly(a.sp); o = st.obj.ally; }
          await attack({ sp: a.sp, lvl: a.lvl }, st.foe, a.mv, o, st.obj.foe, st.easy ? 1.5 : 1, a.n);
          if (st.foe.hp <= 0) { if (await foeDown()) { result = 'win'; break; } } else await checkRage();
        }
      } else if (act.t === 'mega') { await megaEvolve(); foeTurn = false;
      } else if (act.t === 'run') {
        if (!st.wild) { await say("You can't run from " + opts.trainer + '!', 1); foeTurn = false; }
        else { await say('You got away safely!', 0.9); result = 'run'; break; }
      } else if (act.t === 'swap') {
        const alive = S.party.filter(m => m.hp > 0), nx = alive[(alive.indexOf(st.me) + 1) % alive.length], o = st.obj.me;
        setMsg('Come back, ' + TT.monName(st.me) + '!'); await TT.tween(0.3, q => setS(o, Math.max(0.01, 1 - q)));
        st.me = nx; bars(); setMsg(goLine(TT.monName(nx))); await place(-1, nx, true); await TT.wait(0.3);
      } else if (act.t === 'ball') {
        if (S.balls <= 0) { await say('No Poké Balls left! Find more around town.', 1.3); foeTurn = false; }
        else if (await throwBall()) { result = 'caught'; await gainXp(st.me, st.foe.lvl * 6 + 4); break; }
      } else {
        let tb = 1; if (!easyOn() && !act.mv[4]) { setMsg('Tap as the ring closes!'); const k = await timing('Tap!', '#ffd23a'); tb = k === 2 ? 1.3 : k === 1 ? 1.12 : 1; }
        await attack(st.me, st.foe, act.mv, st.obj.me, st.obj.foe, (st.easy ? (hard() ? 1.15 : 1.5) : 1) * tb);
        if (st.foe.hp <= 0) { if (await foeDown()) { result = 'win'; break; } foeTurn = false; }
        else await checkRage();
      }
      // allies take turns joining in: one helps every turn when there are two, every other turn when there is one
      if (act.t !== 'assist' && st.allies.length && st.foe.hp > 0) { st.turn++; const a = st.allies.length > 1 ? st.allies[st.turn % st.allies.length] : st.turn % 2 ? st.allies[0] : null; if (a) st.assists.push(Object.assign({ lvl: st.me.lvl + 4 }, a)); }
      if (foeTurn) {
        let mult = (hard() ? (st.easy ? 0.6 : 0.9) : st.easy ? 0.35 : 0.7) * st.rageMul;
        const fmx = mxOf(st.foe);
        if (hard() && !st.wild && !st.foe.boss && !st.potion && st.foe.hp < fmx * 0.3 && Math.random() < 0.6) {            // Challenge: a trainer may use one potion
          st.potion = 1; st.foe.hp = Math.min(fmx, st.foe.hp + Math.round(fmx * 0.4)); bars(); await arrowsFx(st.obj.foe, 1, 0x7ae87a); await say(st.trainer + ' used a Super Potion!', 1);
        } else if (hard() && st.foe.boss && !st.wind && st.foe.hp < fmx * 0.25) {                                       // Challenge: a boss finds a second wind
          st.wind = 1; st.foe.hp += Math.round(fmx * 0.2); bars(); TT.cry(st.foe.sp, 0.6); B.shake = 0.8; flash('#ffe0c0', 0.5); await arrowsFx(st.obj.foe, 1, 0xff6a3a); await say(TT.monName(st.foe) + ' found a second wind!', 1.1);
        } else {
          if (hard()) { setMsg('Brace! Tap as the ring closes!'); const k = await timing('Brace!', '#6ad8ff'); mult *= k === 2 ? 0.7 : k === 1 ? 0.85 : 1; }
          if (!(st.foe.boss && ++st.bt % (hard() ? 2 : 3) === 0 && await bossSig(st.foe, st.obj.foe, st.obj.me, st.me, mult)))
            await attack(st.foe, st.me, foeMove(), st.obj.foe, st.obj.me, mult);
        }
        if (st.me.hp <= 0) {
          await faint(st.obj.me, -1); await say(TT.monName(st.me) + ' fainted!', 1);
          const nx = S.party.find(m => m.hp > 0);
          if (nx) { st.me = nx; bars(); setMsg(goLine(TT.monName(nx))); await place(-1, nx, true); await TT.wait(0.3); } else result = 'lose';
        }
      }
    }
    if (result === 'win' || result === 'caught') {
      TT.sfx.win(); gesture('cheer', 1.6); focus(-0.5, 0.3);
      for (const h of st.humans) if (h !== st.me_h && st.trainers.indexOf(h) < 0) h.userData.gesture = 'cheer';
      await TT.wait(result === 'win' ? 1.2 : 0.2);
      for (const m of S.party.slice()) if (m.hp > 0) await evolve(m);
    }
    emit('end', { r: result });
    if (S.easy && result !== 'lose') S.party.forEach(m => { m.hp = TT.maxHp(m); });     // Easy mode: free healing after every battle
    await TT.wipeTo(1, 0.3, 1);
    cleanup();
    TT.music(opts.after || (TT.areaMusic ? TT.areaMusic() : 'town'));
    TT.wipeTo(0, 0.4, 1);
    return result;
  };
  function cleanup() {
    $('battle').classList.add('hide'); $('foeBox').classList.remove('boss'); document.body.classList.remove('bossmode'); $('bossCard').classList.remove('on');
    for (const k of ['me', 'foe', 'ally']) if (st.obj[k]) { const o = st.obj[k]; if (o.userData.aura) kill(o.userData.aura); TT.scene.remove(o); TT.dispose(o); }
    (st.allyObjs || []).forEach(o => { TT.scene.remove(o); TT.dispose(o); });
    if (st.ssAura) kill(st.ssAura.list);
    st.extras.forEach(o => { TT.scene.remove(o); TT.dispose(o); });
    st = null; B.active = false; B.megaMon = null; FX.p.length = 0; if (fxPts) fxPts.geometry.setDrawRange(0, 0); cam.ov = null; W.applyStage(null); W.ARENA = W.STAGES.meadow;
  }

  // ---- network: owner side receives joins and helper attacks; watcher side receives the event stream ----
  B.onNet = function (id, d) {
    if (!st) return;
    if (st.watch) { if (String(id) === String(st.owner)) { st.q.push(d); if (st.qw) { const w = st.qw; st.qw = null; w(); } } return; }
    if (d.t === 'join') {
      placeAlly(d.sp); addHuman(d.ch, FRIEND[2], FRIEND[3], 1.25); TT.sfx.pick(); TT.toast(d.n + ' joined the battle!');
      const snap = m => ({ sp: m.sp, lvl: m.lvl, hp: m.hp, mx: mxOf(m), boss: m.boss ? 1 : 0 });
      TT.Net.send({ e: 'b', t: 'sync', to: id, me: snap(st.me), foe: snap(st.foe), wild: st.wild, tr: st.trainer, ppl: st.people, ch: TT.S.ch, dots: $('foeDots').textContent, stg: st.stage, al: st.allies.map(a => ({ h: a.h, sp: a.sp })) });
    } else if (d.t === 'assist' && d.mv && TT.DEX[d.sp]) {
      if (st.assists.length < 3) st.assists.push({ sp: d.sp, lvl: Math.min(60, d.lvl | 0), mv: [String(d.mv[0]), d.mv[1], Math.min(90, +d.mv[2] || 35)], n: d.n });
      if (st.wake) { const w = st.wake; st.wake = null; w({ t: 'assist' }); }
    }
  };
  B.owning = () => B.active && st && !st.watch;

  // Join a friend's battle: watch it live and send helper attacks. stillOn() says whether they are still fighting.
  B.watch = async function (owner, name, stillOn) {
    const S = TT.S, lead = S.party.find(m => m.hp > 0) || S.party[0], myName = TT.playerName || NAMES[S.ch] || 'Friend';
    st = { watch: true, owner, q: [], obj: {}, extras: [], humans: [], trainers: [], foes: [], wild: true, allyObjs: [] };
    B.active = true; camK = 1; TT.music('battle'); TT.sfx.battle();
    $('battle').classList.remove('hide'); $('bmenu').innerHTML = ''; $('bmsg').textContent = 'Joining ' + name + "'s battle…";
    for (const id of ['myName', 'myLvl', 'myHpTxt', 'foeName', 'foeLvl', 'foeDots']) $(id).textContent = '';
    let left = null; const leaveP = new Promise(r => { left = r; });
    const next = () => new Promise(res => { if (st.q.length) return res(st.q.shift()); const to = setTimeout(() => { st.qw = null; res(null); }, 2500); st.qw = () => { clearTimeout(to); res(st.q.shift()); }; });
    const menu = () => {
      const m = $('bmenu'); m.innerHTML = ''; m.classList.remove('off');
      TT.moves(lead).forEach(mv => {
        const b = document.createElement('button'); b.innerHTML = '⚡ Help: ' + mv[0] + '<small>' + TT.monName(lead) + ' · ' + mv[1] + '</small>'; b.style.background = hex(TT.TYPE_COL[mv[1]] || 0xa8a890);
        b.addEventListener('pointerdown', e => { e.preventDefault(); if (m.classList.contains('off')) return; TT.sfx.blip(); helped = true; TT.Net.send({ e: 'b', t: 'assist', to: owner, sp: lead.sp, lvl: lead.lvl, mv, n: myName }); m.classList.add('off'); setTimeout(() => { if (st && st.watch) m.classList.remove('off'); }, 4000); });
        m.appendChild(b);
      });
      const l = document.createElement('button'); l.className = 'alt'; l.textContent = 'Leave'; l.addEventListener('pointerdown', e => { e.preventDefault(); left('leave'); }); m.appendChild(l);
    };
    TT.Net.send({ e: 'b', t: 'join', to: owner, sp: lead.sp, lvl: lead.lvl, ch: S.ch, n: myName });
    let result = null, helped = false, quiet = 0;
    while (true) {
      const ev = await Promise.race([next(), leaveP]);
      if (ev === 'leave') break;
      if (!ev) { if (!stillOn() || ++quiet > 40 || (!st.me && quiet > 3)) break; continue; }
      quiet = 0;
      if (ev.t === 'sync') {
        const stg = W.STAGES[ev.stg] ? ev.stg : 'meadow'; W.ARENA = W.STAGES[stg]; W.applyStage(stg);
        st.me = ev.me; st.foe = ev.foe; st.wild = ev.wild;
        st.me_h = addHuman(ev.ch, -4.7, -0.9, 1.25); (ev.ppl || []).forEach((k, i) => st.trainers.push(addHuman(k, 4.3 + i * 1.5, 0.1 - i * 1.9, -1.25))); addHuman(S.ch, FRIEND[2], FRIEND[3], 1.25);
        placeAllies(ev.al || []);
        await place(-1, st.me); await place(1, st.foe); placeAlly(lead.sp); bars(); $('foeDots').textContent = ev.dots || ''; $('bmsg').textContent = 'You joined ' + name + '! Tap a move to help.'; menu();
      } else if (!st.me) continue;
      else if (ev.t === 'mon') { const m = { sp: ev.sp, lvl: ev.lvl, hp: ev.hp, mx: ev.mx, boss: ev.boss }; if (ev.s === 'me') st.me = m; else st.foe = m; await place(ev.s === 'me' ? -1 : 1, m, ev.pop); bars(); }
      else if (ev.t === 'msg') $('bmsg').textContent = String(ev.x).replace(/^What will .*/, name + ' is choosing a move…').replace(/^You threw/, name + ' threw');
      else if (ev.t === 'atk') { const ao = objOf(ev.s), dobj = ev.s === 'foe' ? st.obj.me : st.obj.foe, df = ev.s === 'foe' ? st.me : st.foe; if (ao && dobj) await animAtk(ao, dobj, ev.ty, ev.dmg, ev.eff, () => { df.hp = ev.hp; bars(); }, ev.pw); }
      else if (ev.t === 'faint') { const o = objOf(ev.s); if (o) await faint(o, ev.s === 'foe' ? 1 : -1); }
      else if (ev.t === 'ball') await ballAnim(!!ev.ok, ev.shakes | 0);
      else if (ev.t === 'bossintro' && st.obj.foe) await bossIntro(st.obj.foe, st.foe, ev.title, ev.music);
      else if (ev.t === 'rage' && st.obj.foe) { addAura(st.obj.foe, 0xff3a1a); flash('#ff4020', 0.45); B.shake = 0.8; }
      else if (ev.t === 'sig' && st.obj.foe) { const df = st.me; await sigAnim(st.obj.foe, st.obj.me, ev.look, ev.col, () => { df.hp = ev.hp; bars(); }, ev.dmg); }
      else if (ev.t === 'tf') await powerUp(st.trainers[0], ev.to);
      else if (ev.t === 'end') { result = ev.r; break; }
    }
    $('bmenu').innerHTML = '';
    if (result === 'win' || result === 'caught') {
      TT.sfx.win(); $('bmsg').textContent = name + (result === 'win' ? ' won the battle!' : ' caught it!'); await TT.wait(1.3);
      if (helped && lead.hp > 0) {
        const xp = 8 + (st.foe ? st.foe.lvl : 3) * 5 * (st.foe && st.foe.boss ? 2 : 1); lead.xp += xp; let up = false;
        while (lead.xp >= TT.xpNeed(lead)) { lead.xp -= TT.xpNeed(lead); lead.lvl++; lead.hp = TT.maxHp(lead); up = true; }
        if (up) TT.sfx.level(); $('bmsg').textContent = TT.monName(lead) + ' got ' + xp + ' XP for helping!' + (up ? ' It grew to level ' + lead.lvl + '!' : ''); await TT.wait(1.8);
      }
    } else if (result) { $('bmsg').textContent = result === 'run' ? name + ' ran away.' : name + "'s Pokémon fainted!"; await TT.wait(1.3); }
    cleanup();
    TT.music(TT.areaMusic ? TT.areaMusic() : 'town');
    return result;
  };

  B.update = function (dt, t) {
    fxTick(dt);
    if (!st) return;
    for (const k of ['me', 'foe', 'ally']) { const o = st.obj[k]; if (o && o.visible) TT.animCreature(o, t, 0); }
    for (const o of st.allyObjs || []) TT.animCreature(o, t, 0);
    for (const h of st.humans) TT.animHuman(h, t, 0);
    const fo = st.obj.foe;
    if (fo && fo.userData.aura) fo.userData.aura.forEach((a, i) => { const s = (fo.userData.h || 1) * (fo.scale.x / (fo.userData.s0 || 1)) * 1.45 * (0.62 + i * 0.16) * (1 + Math.sin(t * 6 + i) * 0.06); a.scale.set(s * 0.8, s, s * 0.8); a.position.set(fo.position.x, fo.position.y + s * 0.7, fo.position.z); a.visible = fo.visible; });
    if (st.ssAura) { const h = st.ssAura.h; st.ssAura.list.forEach((a, i) => { const k = (t * 1.6 + i / 4) % 1; a.position.set(h.position.x, 0.5 + k * 1.6, h.position.z); a.scale.set(0.75 * (1 - k) + 0.25, 2 + k, 0.75 * (1 - k) + 0.25); a.material.opacity = 0.35 * (1 - k); }); }
    B.shake = Math.max(0, B.shake - dt * 1.4);
  };
  B.camera = function (c, aspect, t) {
    const dt = TT.clamp(t - cam.lt, 0, 0.1); cam.lt = t;
    if (cam.ov) return cam.ov(c, t, cam.ok || 0);
    const k = Math.min(1, dt * 3.5); cam.f += (cam.tf - cam.f) * k; cam.z += (cam.tz - cam.z) * k;
    const a = A(), s = B.shake;
    if (aspect < 0.95) {
      // Upright phone: there is no room side by side, so look over your Pokémon's shoulder — yours near and low, the foe far and high.
      const mh = st && st.obj && st.obj.me ? st.obj.me.userData.h || 1 : 1, tk = Math.max(0, mh - 1.6), tall = 1 + tk * 0.3;      // a tall or flying partner needs the camera further back, or it hides behind the health card
      const th = 0.86, d = TT.clamp(6.3 / aspect, 9, 14.5) * (1 - cam.z * 0.22) * tall, sw = Math.sin(t * 0.35) * 0.04;
      c.position.set(a.x - Math.sin(th + sw) * d + cam.f * 0.5 + rand(-s, s) * 0.35, 4.3 + (1 - camK) * 1.4 + rand(-s, s) * 0.35, a.z + Math.cos(th + sw) * d + (1 - camK) * 2.5);
      c.lookAt(a.x + cam.f * 1.0 - 0.1, (B.lookY != null ? B.lookY : -1.5) + tk * 0.5, a.z - 0.3);
      return;
    }
    const d = 7.4 * (1 - cam.z * 0.3), up = B.lift || 0;      // lift: short, wide phone screens keep the fighters above the buttons
    const x = a.x + cam.f * 1.3 + Math.sin(t * 0.35) * 0.5 + (1 - camK) * 2.2 + rand(-s, s) * 0.35, y = 2.3 + d * 0.12 - (1 - camK) * 0.9 + rand(-s, s) * 0.35, z = a.z + d - (1 - camK) * 3.2;
    c.position.set(x, y, z); c.lookAt(a.x + cam.f * 2.1 + (1 - camK) * 1.6, 0.9 + cam.z * 0.2 - up, a.z);
  };
  B.focus = () => W.ARENA;
})();
