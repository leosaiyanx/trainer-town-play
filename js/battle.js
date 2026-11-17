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
      TT.moves(st.me).forEach(mv => { const e = TT.eff(mv[1], ft); add((e > 1 ? '★ ' : '') + mv[0] + '<small>' + mv[1] + (e > 1 ? ' · strong here!' : e < 1 ? ' · weak here' : '') + '</small>', hex(TT.TYPE_COL[mv[1]] || 0xa8a890), { t: 'move', mv }, false, e > 1 ? 'best' : e < 1 ? 'weak' : ''); });
      if (st.wild && !st.noCatch) add('Poké Ball<small>× ' + TT.S.balls + '</small>', '#e8402a', { t: 'ball' });
      if (TT.S.party.filter(m => m.hp > 0).length > 1) add('Swap', '', { t: 'swap' }, true);
      add('Run', '', { t: 'run' }, true);
      setMsg('What will ' + TT.monName(st.me) + ' do?'); st.wake = res;
    });
  }

  // ---------------- attack visuals ----------------
  async function special(type, ao, dobj, dir) {
    const col = TT.TYPE_COL[type] || 0xffffff, x0 = ao.position.x, z = ao.position.z, y0 = mid(ao), x1 = dobj.position.x, z1 = dobj.position.z, y1 = mid(dobj);
    const lerp = (k, wob) => [x0 + dir * 0.4 + (x1 - x0 - dir * 0.4) * k, y0 + (y1 - y0) * k + (wob || 0), z + (z1 - z) * k];
    // charge-up: sparks spiral into the attacker
    const ch = parts(9, [col, 0xffffff], x0, y0, z, 0.08), ring = P(TT.scene, RING, glowT(col, 0.6), [x0, 0.05, z], 0.3, [1.57, 0, 0]);
    await TT.tween(0.34, q => { setS(ao, 1 + 0.1 * q, 1 - 0.14 * q); ring.scale.setScalar(0.3 + q * 0.9); ring.material.opacity = 0.6 * (1 - q); ch.forEach((p, i) => { const a = i * 0.7 + q * 5, r = 1.3 * (1 - q); p.position.set(x0 + Math.cos(a) * r, y0 + Math.sin(a) * r * 0.8, z + 0.3); }); });
    kill(ch); TT.scene.remove(ring);
    TT.sfx.move(type);
    if (type === 'electric') {
      const segs = []; for (let i = 0; i < 10; i++) segs.push(P(TT.scene, 'box', TT.glow(i % 2 ? 0xfff27a : 0xffffff), [0, 0, 0], [0.5, 0.1, 0.1]));
      const zig = pts => { for (let i = 0; i < segs.length; i++) { const a = pts[i], b = pts[i + 1]; if (!b) { segs[i].visible = false; continue; } segs[i].visible = Math.random() > 0.12; segs[i].position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); segs[i].rotation.set(0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])); segs[i].scale.x = Math.hypot(b[0] - a[0], b[1] - a[1]); } };
      await TT.tween(0.32, () => { const pts = []; for (let i = 0; i <= 10; i++) pts.push(lerp(i / 10, i && i < 10 ? rand(-0.4, 0.4) : 0)); zig(pts); setS(ao, 0.95, 1.1); });
      flash('#fff6b0', 0.55);                                    // and a bolt from the sky onto the target
      await TT.tween(0.22, () => { const pts = []; for (let i = 0; i <= 10; i++) pts.push([x1 + (i && i < 10 ? rand(-0.5, 0.5) : 0), 9 - i * (9 - y1) / 10, z1]); zig(pts); });
      kill(segs);
    } else if (type === 'dragon' || type === 'psychic' || type === 'ghost') {
      const n = 14, ps = [], c2 = type === 'dragon' ? [0x8a5af8, 0x5ab0ff, 0xffffff] : type === 'psychic' ? [0xf06090, 0xffb0d0, 0xffffff] : [0x5a3a8a, 0x8a5ac0, 0x2a1a3a];
      for (let i = 0; i < n; i++) ps.push(P(TT.scene, 'sphS', TT.glow(c2[i % 3]), [x0, y0, z], 0.16));
      await TT.tween(0.6, q => ps.forEach((m, i) => { const k = (q - i / n * 0.45) / 0.55; m.visible = k > 0 && k < 1; if (!m.visible) return; const p = lerp(k), a = k * 14 + i * 0.9, r = type === 'ghost' ? 0.6 * (1 - k) : 0.35; m.position.set(p[0], p[1] + Math.sin(a) * r, p[2] + Math.cos(a) * r); m.scale.setScalar(0.12 + 0.12 * Math.sin(k * 3.14)); }));
      kill(ps);
    } else if (type === 'rock') {
      const rs = []; for (let i = 0; i < 3; i++) rs.push(P(TT.scene, 'rock', 0x9a8f80, [x0, y0, z], rand(0.25, 0.4), [rand(0, 3), rand(0, 3), 0]));
      await TT.tween(0.6, q => rs.forEach((m, i) => { const k = TT.clamp((q - i * 0.12) / 0.64, 0, 1), p = lerp(k); m.visible = k > 0 && k < 1; m.position.set(p[0] + (i - 1) * 0.3 * k, p[1] + Math.sin(k * 3.14) * 2.2, p[2] + (i - 1) * 0.4 * k); m.rotation.x += 0.3; }));
      kill(rs);
    } else if (type === 'steel') {
      const sh = []; for (let i = 0; i < 8; i++) sh.push(P(TT.scene, 'box', glowT(i % 2 ? 0xe8eef8 : 0xa8b0c8, 0.95), [x0, y0, z], [0.36, 0.06, 0.12]));
      await TT.tween(0.45, q => sh.forEach((m, i) => { const k = TT.clamp((q - i * 0.04) / 0.7, 0, 1), p = lerp(k); m.position.set(p[0], p[1] + (i % 3 - 1) * 0.3 * Math.sin(k * 3.14), p[2] + (i % 4 - 1.5) * 0.25 * Math.sin(k * 3.14)); m.rotation.set(0, 0, k * 12 + i); }));
      kill(sh);
    } else {
      const n = type === 'water' ? 12 : type === 'grass' ? 9 : type === 'flying' ? 5 : 8, ps = [];
      for (let i = 0; i < n; i++) {
        let m;
        if (type === 'grass') m = P(TT.scene, 'sph', TT.glow(i % 2 ? 0x7ad85a : 0x4aa84a), [x0, y0, z], [0.22, 0.03, 0.11]);
        else if (type === 'flying') m = P(TT.scene, 'sph', glowT(0xffffff, 0.8), [x0, y0, z], [0.12, 0.55, 0.32]);
        else if (type === 'fire') m = P(TT.scene, 'sphS', TT.glow(i % 3 === 0 ? 0xffe060 : i % 3 === 1 ? 0xff7a1a : 0xff4020), [x0, y0, z], 0.22);
        else if (type === 'water') m = P(TT.scene, 'sphS', TT.glow(i % 2 ? 0x6ac0ff : 0xcdeeff), [x0, y0, z], 0.15);
        else m = P(TT.scene, RING, glowT(i % 2 ? col : 0xffffff, 0.85), [x0, y0, z], 0.2, [0, 1.57, 0]);
        m.visible = false; ps.push(m);
      }
      await TT.tween(0.6, q => {
        setS(ao, 1 - 0.1 * Math.max(0, 1 - q * 3), 1 + 0.16 * Math.max(0, 1 - q * 3));
        ps.forEach((m, i) => {
          const k = (q - i / n * 0.45) / 0.55; m.visible = k > 0 && k < 1; if (!m.visible) return;
          const wob = type === 'water' ? Math.sin(k * 3.14) * 0.6 : Math.sin(k * 9 + i * 2) * (type === 'grass' ? 0.4 : 0.15), p = lerp(k, wob);
          m.position.set(p[0], p[1], p[2] + Math.cos(k * 7 + i) * 0.25);
          if (type === 'grass') m.rotation.set(k * 20 + i, k * 14, 0); else if (type === 'fire') m.scale.setScalar(0.16 + k * 0.34); else if (type !== 'water' && type !== 'flying') m.scale.setScalar(0.15 + k * 0.45);
        });
      });
      kill(ps);
    }
    setS(ao, 1);
  }
  // what the hit looks like on the target, by type: [mesh, update(mesh, q)]
  function impact(type, dx, y, z) {
    const out = [];
    if (type === 'fire') for (let i = 0; i < 6; i++) { const ox = rand(-0.4, 0.4), oz = rand(-0.3, 0.3); out.push([P(TT.scene, 'cone', TT.glow(i % 2 ? 0xffe060 : 0xff6a1a), [dx + ox, 0.2, z + oz], [0.18, 0.1, 0.18]), (m, q) => { m.scale.set(0.2 * (1 - q) + 0.05, 0.2 + Math.sin(q * 3.14) * 1.4, 0.2 * (1 - q) + 0.05); m.position.y = 0.1 + Math.sin(q * 3.14) * 0.6; }]); }
    else if (type === 'water') { out.push([P(TT.scene, RING, glowT(0xcdeeff, 0.9), [dx, 0.1, z], 0.3, [1.57, 0, 0]), (m, q) => { m.scale.setScalar(0.3 + q * 2); m.material.opacity = 0.9 * (1 - q); }]); for (let i = 0; i < 8; i++) { const a = i * 0.785; out.push([P(TT.scene, 'sphS', TT.glow(0x9ad8ff), [dx, 0.2, z], 0.1), (m, q) => m.position.set(dx + Math.cos(a) * q * 1.2, 0.2 + Math.sin(q * 3.14) * 1.2, z + Math.sin(a) * q * 1.2)]); } }
    else if (type === 'psychic' || type === 'dragon' || type === 'ghost') { const c = type === 'psychic' ? 0xf06090 : type === 'dragon' ? 0x8a5af8 : 0x6a3a9a; for (let i = 0; i < 3; i++) out.push([P(TT.scene, RING, glowT(c, 0.8), [dx, y, z], 0.2, [0, 1.57, 0]), (m, q) => { const k = TT.clamp(q * 1.5 - i * 0.25, 0, 1); m.scale.setScalar(0.2 + k * 1.4); m.material.opacity = 0.8 * (1 - k); }]); }
    else if (type === 'grass' || type === 'flying') for (let i = 0; i < 10; i++) out.push([P(TT.scene, 'sph', TT.glow(type === 'grass' ? (i % 2 ? 0x7ad85a : 0x4aa84a) : 0xffffff), [dx, y, z], type === 'grass' ? [0.18, 0.03, 0.09] : [0.08, 0.3, 0.08]), (m, q) => { const a = i * 0.63 + q * 9; m.position.set(dx + Math.cos(a) * (0.5 + q * 0.6), 0.2 + q * 2 + i * 0.05, z + Math.sin(a) * (0.5 + q * 0.6)); m.rotation.set(q * 9, a, 0); }]);
    else { out.push([P(TT.scene, RING, glowT(0xffffff, 0.8), [dx, 0.08, z], 0.3, [1.57, 0, 0]), (m, q) => { m.scale.setScalar(0.3 + q * 2.2); m.material.opacity = 0.8 * (1 - q); }]); for (let i = 0; i < 6; i++) { const a = i * 1.05; out.push([P(TT.scene, 'sphS', TT.glow(0xd8c8a8), [dx, 0.15, z], 0.16), (m, q) => { m.position.set(dx + Math.cos(a) * q * 1.4, 0.15 + Math.sin(q * 3.14) * 0.4, z + Math.sin(a) * q * 1.4); m.scale.setScalar(0.18 * (1 - q)); }]); } }
    return out;
  }
  async function hitFx(dobj, dir, type, dmg, eff) {
    const dx = dobj.position.x, y = mid(dobj), z = dobj.position.z;
    TT.sfx.hit(); B.shake = eff > 1 ? 0.55 : 0.3; TT.hitStop = eff > 1 ? 0.13 : 0.08; focus(dx > A().x ? 0.5 : -0.5, 0.15);
    if (eff > 1) flash('#ffffff', 0.6);
    const burst = parts(10, [0xffffff, TT.TYPE_COL[type] || 0xffffff, 0xffe060], dx, y, z, 0.12);
    const star = []; for (let i = 0; i < 4; i++) star.push(P(TT.scene, 'box', TT.glow(0xffffff), [dx, y, z + 0.4], [0.9, 0.07, 0.07], [0, 0, i * 0.785]));
    const ring = P(TT.scene, RING, glowT(0xffffff, 0.9), [dx, y, z + 0.3], 0.2), fx = impact(type, dx, y, z);
    const num = TT.label('-' + dmg, eff > 1 ? 'rgba(232,64,42,.95)' : 'rgba(35,50,74,.9)'); num.position.set(dx, y + 0.9, z + 0.5); num.scale.set(1.6, 0.4, 1); TT.scene.add(num);
    await TT.tween(0.5, q => {
      const kb = Math.sin(Math.min(1, q * 1.6) * 3.14);
      dobj.position.x = dx + dir * 0.55 * kb + Math.sin(q * 50) * 0.05 * (1 - q); setS(dobj, 1 - 0.16 * kb, 1 + 0.1 * kb); dobj.rotation.z = -dir * 0.32 * kb;
      dobj.visible = q > 0.7 || (q * 12 | 0) % 2 === 0;
      burst.forEach((b, i) => { const a = i * 0.63; b.position.set(dx + Math.cos(a) * q * 1.5, y + Math.sin(a) * q * 1.5, z + 0.3); b.scale.setScalar(0.14 * (1 - q)); });
      star.forEach(s => s.scale.set(1.5 * (1 - q) + 0.01, 0.07, 0.07));
      ring.scale.setScalar(0.2 + q * 1.4); ring.material.opacity = 0.9 * (1 - q);
      fx.forEach(([m, f]) => f(m, q));
      num.position.y = y + 0.9 + q * 0.8; num.material.opacity = q < 0.7 ? 1 : (1 - q) / 0.3;
    });
    kill(burst); kill(star); TT.scene.remove(ring); fx.forEach(([m]) => TT.scene.remove(m)); TT.scene.remove(num); num.material.map.dispose();
    dobj.position.x = dx; dobj.rotation.z = 0; setS(dobj, 1); dobj.visible = true;
  }
  // the visible part of an attack; `apply` runs at the moment of impact
  async function animAtk(ao, dobj, type, dmg, eff, apply) {
    const x0 = ao.position.x, y0 = ao.position.y, dir = dobj.position.x > x0 ? 1 : -1, phys = type === 'normal' || type === 'dark' || type === 'bug' || type === 'fighting';
    focus(x0 > A().x ? 0.55 : -0.55, 0.25);
    if (phys) {
      await TT.tween(0.22, q => { ao.position.x = x0 - dir * 0.45 * ease(q); setS(ao, 1 + 0.14 * q, 1 - 0.2 * q); });        // crouch
      TT.sfx.whoosh();
      const reach = Math.abs(dobj.position.x - x0) - 0.9, lines = []; for (let i = 0; i < 4; i++) lines.push(P(TT.scene, 'box', glowT(0xffffff, 0.6), [x0, mid(ao) + (i - 1.5) * 0.18, ao.position.z], [0.8, 0.04, 0.04]));
      await TT.tween(0.16, q => { ao.position.x = x0 - dir * 0.45 + dir * (reach + 0.45) * q; setS(ao, 0.9, 1.15); ao.position.y = y0 + Math.sin(q * 3.14) * 0.6; ao.rotation.z = -dir * 0.4 * q; lines.forEach((l, i) => { l.position.x = ao.position.x - dir * (0.6 + i * 0.15); l.material.opacity = 0.6 * (1 - q); }); });  // leap
      kill(lines); apply();
      const back = TT.tween(0.4, q => { ao.position.x = x0 + dir * reach * (1 - ease(q)); ao.position.y = y0 + Math.sin(q * 3.14) * 0.8; ao.rotation.z = -dir * 0.4 * (1 - q); setS(ao, 1); });
      await hitFx(dobj, dir, type, dmg, eff); await back;
      ao.position.x = x0; ao.position.y = y0; ao.rotation.z = 0;
    } else {
      await special(type, ao, dobj, dir);
      apply();
      await hitFx(dobj, dir, type, dmg, eff);
    }
    focus(0, 0);
  }
  async function attack(att, def, mv, ao, dobj, mult, who) {
    if (ao === st.obj.me) gesture('point', 0.9);
    await say((who ? who + "'s " : '') + TT.monName(att) + ' used ' + mv[0] + '!', 0.5);
    const eff = TT.eff(mv[1], TT.DEX[def.sp][1]);
    // Easy mode (a switch in the menu, per child): your side hits harder and takes less
    const ez = TT.S && TT.S.easy && !st.watch ? (dobj === st.obj.foe ? 1.4 : dobj === st.obj.me ? 0.65 : 1) : 1;
    const dmg = Math.max(1, Math.floor(mv[2] * TT.stat(att, 3) / TT.stat(def, 4) * 0.3 * (mult || 1) * eff * ez * TT.rand(0.85, 1)));
    const hp = Math.max(0, def.hp - dmg);
    emit('atk', { s: sideOf(ao), ty: mv[1], dmg, hp, eff });
    await animAtk(ao, dobj, mv[1], dmg, eff, () => { def.hp = hp; bars(); });
    if (eff > 1) await say("It's super effective!", 0.8); else if (eff < 1) await say("It's not very effective...", 0.8);
  }
  async function faint(o, dir) {
    emit('faint', { s: sideOf(o) }); o.userData.shut = true;       // eyes closed
    TT.cry(o.userData.sp, 0.6);
    if (o.userData.aura) { kill(o.userData.aura); o.userData.aura = null; }
    await TT.tween(0.3, q => { o.rotation.z = dir * 1.45 * ease(q); o.position.y = Math.sin(q * 3.14) * 0.15; });
    B.shake = o.userData.boss ? 0.8 : 0.15; if (o.userData.boss) { flash('#ffffff', 0.8); TT.hitStop = 0.25; }
    await TT.wait(0.25);
    const dust = parts(8, [0xd8c8a8, 0xffffff], o.position.x, 0.2, o.position.z, 0.15);
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
    m.xp += amount; await say(TT.monName(m) + ' got ' + amount + ' XP!', 0.8); bars();
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
    const hpK = m.hp / TT.maxHp(m); m.sp = ev[0]; m.hp = Math.max(1, Math.round(TT.maxHp(m) * Math.max(hpK, 0.5)));
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
    S.balls--; setMsg('You threw a Poké Ball!');
    const k0 = foe.hp / mxOf(foe), chance = k0 < 0.3 ? 1 : TT.clamp(0.3 + 0.75 * (1 - k0) - (foe.boss ? 0.25 : 0), 0, 1), ok = Math.random() < chance, shakes = ok ? 3 : 1 + (Math.random() * 2 | 0);
    emit('ball', { ok, shakes });
    await ballAnim(ok, shakes);
    await say(ok ? 'Gotcha! ' + TT.monName(foe) + ' was caught!' : 'Oh no! ' + TT.monName(foe) + ' broke free!', ok ? 1.6 : 1);
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
    st.foe = st.foes[0]; st.me = S.party.find(m => m.hp > 0);
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
    await say(st.foe.boss ? TT.monName(st.foe) + ' wants to battle!' : st.wild ? 'A wild ' + TT.monName(st.foe) + ' appeared!' : opts.trainer + ' sent out ' + TT.monName(st.foe) + '!', 1.3);
    if (st.allies.length) await say((st.allies.length > 2 ? st.allies.slice(0, -1).map(a => a.n).join(', ') + ' and ' + st.allies[st.allies.length - 1].n : st.allies.map(a => a.n).join(' and ')) + (st.allies.length > 1 ? ' are' : ' is') + ' here to help!', 1);
    setMsg('Go, ' + TT.monName(st.me) + '!'); gesture('point', 0.8); await place(-1, st.me, true); await TT.wait(0.35);
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
      const act = st.assists.length ? { t: 'assist' } : await choose(); let foeTurn = true;
      if (act.t === 'assist') {            // a helper attack (a friend, Gohan or Goku): a free bonus hit
        const a = st.assists.shift(); foeTurn = false; $('bmenu').classList.add('off');
        if (a && st.foe.hp > 0) {
          let o = a.o; if (!o) { if (!st.obj.ally || st.obj.ally.userData.sp !== a.sp) placeAlly(a.sp); o = st.obj.ally; }
          await attack({ sp: a.sp, lvl: a.lvl }, st.foe, a.mv, o, st.obj.foe, st.easy ? 1.5 : 1, a.n);
          if (st.foe.hp <= 0) { if (await foeDown()) { result = 'win'; break; } } else await checkRage();
        }
      } else if (act.t === 'run') {
        if (!st.wild) { await say("You can't run from " + opts.trainer + '!', 1); foeTurn = false; }
        else { await say('You got away safely!', 0.9); result = 'run'; break; }
      } else if (act.t === 'swap') {
        const alive = S.party.filter(m => m.hp > 0), nx = alive[(alive.indexOf(st.me) + 1) % alive.length], o = st.obj.me;
        setMsg('Come back, ' + TT.monName(st.me) + '!'); await TT.tween(0.3, q => setS(o, Math.max(0.01, 1 - q)));
        st.me = nx; bars(); setMsg('Go, ' + TT.monName(nx) + '!'); await place(-1, nx, true); await TT.wait(0.3);
      } else if (act.t === 'ball') {
        if (S.balls <= 0) { await say('No Poké Balls left! Find more around town.', 1.3); foeTurn = false; }
        else if (await throwBall()) { result = 'caught'; await gainXp(st.me, st.foe.lvl * 6 + 4); break; }
      } else {
        await attack(st.me, st.foe, act.mv, st.obj.me, st.obj.foe, st.easy ? 1.5 : 1);
        if (st.foe.hp <= 0) { if (await foeDown()) { result = 'win'; break; } foeTurn = false; }
        else await checkRage();
      }
      // allies take turns joining in: one helps every turn when there are two, every other turn when there is one
      if (act.t !== 'assist' && st.allies.length && st.foe.hp > 0) { st.turn++; const a = st.allies.length > 1 ? st.allies[st.turn % st.allies.length] : st.turn % 2 ? st.allies[0] : null; if (a) st.assists.push(Object.assign({ lvl: st.me.lvl + 4 }, a)); }
      if (foeTurn) {
        const mult = (st.easy ? 0.35 : 0.7) * st.rageMul;
        if (!(st.foe.boss && ++st.bt % 3 === 0 && await bossSig(st.foe, st.obj.foe, st.obj.me, st.me, mult)))
          await attack(st.foe, st.me, TT.pick(TT.moves(st.foe)), st.obj.foe, st.obj.me, mult);
        if (st.me.hp <= 0) {
          await faint(st.obj.me, -1); await say(TT.monName(st.me) + ' fainted!', 1);
          const nx = S.party.find(m => m.hp > 0);
          if (nx) { st.me = nx; bars(); setMsg('Go, ' + TT.monName(nx) + '!'); await place(-1, nx, true); await TT.wait(0.3); } else result = 'lose';
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
    st = null; B.active = false; cam.ov = null; W.applyStage(null); W.ARENA = W.STAGES.meadow;
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
      else if (ev.t === 'atk') { const ao = objOf(ev.s), dobj = ev.s === 'foe' ? st.obj.me : st.obj.foe, df = ev.s === 'foe' ? st.me : st.foe; if (ao && dobj) await animAtk(ao, dobj, ev.ty, ev.dmg, ev.eff, () => { df.hp = ev.hp; bars(); }); }
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
