// battle.js — turn-based battles: attack, catch, swap, run, XP, evolution — with proper animation.
(function () {
  const TT = window.TT, $ = TT.$, P = TT.P, rand = TT.rand, ease = TT.ease;
  const B = TT.Battle = { active: false, shake: 0 };
  let st = null, camK = 1;
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const glowT = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o == null ? 0.7 : o, depthWrite: false });

  // Battles are simulated by their owner. Everything visible is also sent as small events so a friend
  // who joins sees the same fight and can send in helper attacks.
  const emit = (t, d) => { const N = TT.Net; if (N && N.on && st && !st.watch) N.send(Object.assign({ e: 'b', t }, d || {})); };
  const setMsg = x => { $('bmsg').textContent = x; emit('msg', { x }); };
  const mxOf = m => m.mx || TT.maxHp(m);
  const sideOf = o => o === st.obj.me ? 'me' : o === st.obj.foe ? 'foe' : 'ally';
  const NAMES = { ash: 'Ash', liko: 'Liko', dad: 'Dad' };
  function spot(side) { const A = TT.World.ARENA; return [A.x + side * 2.4, A.z]; }
  function placeAlly(sp) {
    if (st.obj.ally) TT.scene.remove(st.obj.ally);
    const A = TT.World.ARENA, o = TT.creature(sp); o.userData.s0 = o.scale.x; o.userData.ry = 1.57 - 0.75;
    o.position.set(A.x - 3.3, 0, A.z + 1.7); o.rotation.y = o.userData.ry; TT.scene.add(o); st.obj.ally = o; TT.cry(sp); return o;
  }
  function addHuman(key, x, z, ry) { const A = TT.World.ARENA, h = TT.human(TT.PEOPLE[key] || TT.PEOPLE.kid); h.position.set(A.x + x, 0, A.z + z); h.rotation.y = ry; TT.scene.add(h); st.extras.push(h); st.humans.push(h); return h; }
  const setS = (o, sx, sy) => { const s = o.userData.s0; o.scale.set(s * sx, s * (sy == null ? sx : sy), s * sx); };
  const mid = o => o.position.y + (o.userData.h || 1) * 0.42;
  function parts(n, col, x, y, z, r) { const a = []; for (let i = 0; i < n; i++) a.push(P(TT.scene, 'sphS', TT.glow(Array.isArray(col) ? col[i % col.length] : col), [x, y, z], r || 0.1)); return a; }
  const kill = a => a.forEach(m => TT.scene.remove(m));

  async function place(side, m, pop) {
    const k = side < 0 ? 'me' : 'foe';
    if (st.obj[k]) TT.scene.remove(st.obj[k]);
    const o = TT.creature(m.sp), s = spot(side);
    o.userData.s0 = o.scale.x; o.userData.ry = side < 0 ? 1.57 - 0.5 : -1.57 + 0.5;
    o.position.set(s[0], 0, s[1]); o.rotation.y = o.userData.ry;
    TT.scene.add(o); st.obj[k] = o;
    emit('mon', { s: k, sp: m.sp, lvl: m.lvl, hp: m.hp, mx: mxOf(m), pop: !!pop });
    if (pop) {
      setS(o, 0.01); TT.sfx.open();
      const fl = P(TT.scene, 'sph', glowT(0xffffff, 0.9), [s[0], 0.5, s[1]], 0.2), sp = parts(8, [0xffffff, 0xffe060], s[0], 0.5, s[1], 0.08);
      await TT.tween(0.42, q => {
        const e = ease(q), b = 1 + Math.sin(q * 3.14) * 0.25; setS(o, Math.max(0.01, e) * (2 - b), Math.max(0.01, e) * b); o.position.y = Math.sin(q * 3.14) * 0.35;
        fl.scale.setScalar(0.2 + q * 1.5); fl.material.opacity = 0.9 * (1 - q);
        sp.forEach((p, i) => { const a = i * 0.785; p.position.set(s[0] + Math.cos(a) * q * 1.6, 0.5 + Math.sin(a) * q * 1.6, s[1] + 0.2); p.scale.setScalar(0.09 * (1 - q)); });
      });
      TT.scene.remove(fl); kill(sp); setS(o, 1); o.position.y = 0; TT.cry(m.sp);
    }
    return o;
  }
  function bars() {
    const me = st.me, foe = st.foe;
    const set = (el, m) => { const k = m.hp / mxOf(m); el.style.width = (k * 100) + '%'; el.style.background = k > 0.5 ? '#4cd964' : k > 0.22 ? '#f2c230' : '#e8402a'; };
    $('myName').textContent = TT.monName(me); $('myLvl').textContent = 'Lv ' + me.lvl; set($('myHp'), me);
    $('myHpTxt').textContent = me.hp + ' / ' + mxOf(me) + ' HP'; $('myXp').style.width = Math.min(100, (me.xp || 0) / TT.xpNeed(me) * 100) + '%';
    $('foeName').textContent = (st.wild ? 'Wild ' : '') + TT.monName(foe); $('foeLvl').textContent = 'Lv ' + foe.lvl; set($('foeHp'), foe);
    $('foeDots').textContent = st.wild ? '' : st.foes.map(f => f.hp > 0 ? '●' : '○').join('');
  }
  async function say(t, d) { setMsg(t); await TT.wait(d == null ? 1.15 : d); }
  const gesture = (g, k) => { if (st.me_h) st.me_h.userData.gesture = g; if (k) setTimeout(() => { if (st && st.me_h && st.me_h.userData.gesture === g) st.me_h.userData.gesture = null; }, k * 1000); };

  function choose() {
    return new Promise(res => {
      const menu = $('bmenu'); menu.innerHTML = ''; menu.classList.remove('off');
      const add = (html, bg, act, alt) => {
        const b = document.createElement('button'); b.innerHTML = html; if (alt) b.className = 'alt'; else b.style.background = bg;
        b.addEventListener('pointerdown', e => { e.preventDefault(); if (!st || st.wake !== res) return; st.wake = null; TT.audioInit(); TT.sfx.blip(); menu.classList.add('off'); res(act); });
        menu.appendChild(b);
      };
      TT.moves(st.me).forEach(mv => add(mv[0] + '<small>' + mv[1] + '</small>', hex(TT.TYPE_COL[mv[1]]), { t: 'move', mv }));
      if (st.wild) add('Poké Ball<small>× ' + TT.S.balls + '</small>', '#e8402a', { t: 'ball' });
      if (TT.S.party.filter(m => m.hp > 0).length > 1) add('Swap', '', { t: 'swap' }, true);
      add('Run', '', { t: 'run' }, true);
      setMsg('What will ' + TT.monName(st.me) + ' do?'); st.wake = res;
    });
  }

  // ---- move visuals ----
  async function special(type, ao, dobj, dir) {
    const col = TT.TYPE_COL[type], x0 = ao.position.x, z = ao.position.z, y0 = mid(ao), x1 = dobj.position.x, y1 = mid(dobj);
    // charge-up: sparks gather on the attacker
    const ch = parts(7, [col, 0xffffff], x0, y0, z, 0.08);
    await TT.tween(0.3, q => { setS(ao, 1 + 0.1 * q, 1 - 0.14 * q); ch.forEach((p, i) => { const a = i * 0.9 + q * 4, r = 1.2 * (1 - q); p.position.set(x0 + Math.cos(a) * r, y0 + Math.sin(a) * r, z + 0.3); }); });
    kill(ch);
    if (type === 'electric') {
      TT.sfx.zap();
      const segs = []; for (let i = 0; i < 8; i++) segs.push(P(TT.scene, 'box', TT.glow(i % 2 ? 0xfff27a : 0xffffff), [0, 0, 0], [0.5, 0.09, 0.09]));
      const fl = P(TT.scene, 'sph', glowT(0xfff27a, 0.8), [x1, y1, z], 0.3);
      await TT.tween(0.36, q => {
        setS(ao, 1 - 0.1 * (1 - q), 1 + 0.16 * (1 - q));
        let px = x0 + dir * 0.4, py = y0;
        segs.forEach((s, i) => { const nx = x0 + dir * 0.4 + (x1 - x0 - dir * 0.4) * (i + 1) / 8, ny = i === 7 ? y1 : y0 + (y1 - y0) * (i + 1) / 8 + rand(-0.35, 0.35); s.position.set((px + nx) / 2, (py + ny) / 2, z + 0.1); s.rotation.z = Math.atan2(ny - py, nx - px); s.scale.x = Math.hypot(nx - px, ny - py); s.visible = Math.random() > 0.15; px = nx; py = ny; });
        fl.scale.setScalar(0.3 + Math.random() * 0.7);
      });
      kill(segs); TT.scene.remove(fl);
    } else {
      TT.sfx.move(type);
      const n = type === 'water' ? 9 : type === 'grass' ? 6 : type === 'flying' ? 4 : 6, ps = [];
      for (let i = 0; i < n; i++) {
        let m;
        if (type === 'grass') m = P(TT.scene, 'sph', TT.glow(i % 2 ? 0x7ad85a : 0x4aa84a), [x0, y0, z], [0.2, 0.03, 0.1]);
        else if (type === 'flying') m = P(TT.scene, 'sph', glowT(0xffffff, 0.8), [x0, y0, z], [0.12, 0.5, 0.3]);
        else if (type === 'fire') m = P(TT.scene, 'sphS', TT.glow(i % 2 ? 0xff7a1a : 0xffe060), [x0, y0, z], 0.2);
        else if (type === 'water') m = P(TT.scene, 'sphS', TT.glow(i % 2 ? 0x6ac0ff : 0xcdeeff), [x0, y0, z], 0.14);
        else m = P(TT.scene, TT.G.torus, glowT(i % 2 ? col : 0xffffff, 0.85), [x0, y0, z], 0.2, [0, 1.57, 0]);
        m.visible = false; ps.push(m);
      }
      await TT.tween(0.62, q => {
        setS(ao, 1 - 0.1 * Math.max(0, 1 - q * 3), 1 + 0.16 * Math.max(0, 1 - q * 3));
        ps.forEach((m, i) => {
          const k = (q - i / n * 0.45) / 0.55; m.visible = k > 0 && k < 1; if (!m.visible) return;
          const wob = type === 'water' ? Math.sin(k * 3.14) * 0.6 : Math.sin(k * 9 + i * 2) * (type === 'grass' ? 0.35 : 0.15);
          m.position.set(x0 + dir * 0.4 + (x1 - x0 - dir * 0.4) * k, y0 + (y1 - y0) * k + wob, z + Math.cos(k * 7 + i) * 0.25);
          if (type === 'grass') m.rotation.set(k * 20 + i, k * 14, 0); else if (type === 'fire') m.scale.setScalar(0.16 + k * 0.3); else if (type !== 'water' && type !== 'flying') m.scale.setScalar(0.15 + k * 0.4);
        });
      });
      kill(ps);
    }
    setS(ao, 1);
  }

  async function hitFx(dobj, dir, type, dmg, eff) {
    const dx = dobj.position.x, y = mid(dobj), z = dobj.position.z;
    TT.sfx.hit(); B.shake = eff > 1 ? 0.45 : 0.25;
    const burst = parts(9, [0xffffff, TT.TYPE_COL[type], 0xffe060], dx, y, z, 0.12);
    const ring = P(TT.scene, TT.G.torus, glowT(0xffffff, 0.9), [dx, y, z + 0.3], 0.2);
    const num = TT.label('-' + dmg, eff > 1 ? 'rgba(232,64,42,.95)' : 'rgba(35,50,74,.9)'); num.position.set(dx, y + 0.9, z + 0.5); num.scale.set(1.6, 0.4, 1); TT.scene.add(num);
    await TT.tween(0.42, q => {
      const kb = Math.sin(Math.min(1, q * 1.6) * 3.14);
      dobj.position.x = dx + dir * 0.5 * kb + Math.sin(q * 50) * 0.05 * (1 - q); setS(dobj, 1 - 0.14 * kb, 1 + 0.1 * kb); dobj.rotation.z = -dir * 0.3 * kb;
      dobj.visible = q > 0.7 || (q * 12 | 0) % 2 === 0;
      burst.forEach((b, i) => { const a = i * 0.7; b.position.set(dx + Math.cos(a) * q * 1.4, y + Math.sin(a) * q * 1.4, z + 0.3); b.scale.setScalar(0.14 * (1 - q)); });
      ring.scale.setScalar(0.2 + q * 1.3); ring.material.opacity = 0.9 * (1 - q);
      num.position.y = y + 0.9 + q * 0.8; num.material.opacity = q < 0.7 ? 1 : (1 - q) / 0.3;
    });
    kill(burst); TT.scene.remove(ring); TT.scene.remove(num); num.material.map.dispose();
    dobj.position.x = dx; dobj.rotation.z = 0; setS(dobj, 1); dobj.visible = true;
  }

  // the visible part of an attack; `apply` runs at the moment of impact
  async function animAtk(ao, dobj, type, dmg, eff, apply) {
    const x0 = ao.position.x, dir = dobj.position.x > x0 ? 1 : -1, phys = type === 'normal' || type === 'dark' || type === 'bug' || type === 'fighting';
    if (phys) {
      await TT.tween(0.2, q => { ao.position.x = x0 - dir * 0.4 * ease(q); setS(ao, 1 + 0.12 * q, 1 - 0.16 * q); });           // wind-up
      TT.sfx.whoosh();
      const reach = Math.abs(dobj.position.x - x0) - 0.8;
      await TT.tween(0.13, q => { ao.position.x = x0 - dir * 0.4 + dir * (reach + 0.4) * q; setS(ao, 1 - 0.1, 1 + 0.12); ao.position.y = Math.sin(q * 3.14) * 0.25; ao.rotation.z = -dir * 0.35 * q; });   // dash
      apply();
      const back = TT.tween(0.36, q => { ao.position.x = x0 + dir * reach * (1 - ease(q)); ao.position.y = Math.sin(q * 3.14) * 0.7; ao.rotation.z = -dir * 0.35 * (1 - q); setS(ao, 1); });
      await hitFx(dobj, dir, type, dmg, eff); await back;
      ao.position.x = x0; ao.position.y = 0; ao.rotation.z = 0;
    } else {
      await special(type, ao, dobj, dir);
      apply();
      await hitFx(dobj, dir, type, dmg, eff);
    }
  }
  async function attack(att, def, mv, ao, dobj, mult, who) {
    if (ao === st.obj.me) gesture('point', 0.9);
    await say((who ? who + "'s " : '') + TT.monName(att) + ' used ' + mv[0] + '!', 0.5);
    const eff = TT.eff(mv[1], TT.DEX[def.sp][1]);
    const dmg = Math.max(1, Math.floor(mv[2] * TT.stat(att, 3) / TT.stat(def, 4) * 0.3 * (mult || 1) * eff * TT.rand(0.85, 1)));
    const hp = Math.max(0, def.hp - dmg);
    emit('atk', { s: sideOf(ao), ty: mv[1], dmg, hp, eff });
    await animAtk(ao, dobj, mv[1], dmg, eff, () => { def.hp = hp; bars(); });
    if (eff > 1) await say("It's super effective!", 0.8); else if (eff < 1) await say("It's not very effective...", 0.8);
  }
  async function faint(o, dir) {
    emit('faint', { s: sideOf(o) });
    TT.cry(o.userData.sp, 0.6);
    await TT.tween(0.3, q => { o.rotation.z = dir * 1.45 * ease(q); o.position.y = Math.sin(q * 3.14) * 0.15; });
    await TT.wait(0.25);
    await TT.tween(0.35, q => { setS(o, Math.max(0.01, 1 - q)); o.position.y = -q * 0.2; });
    o.visible = false;
  }

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
    await say('What? ' + old + ' is evolving!', 1.3); TT.sfx.evo();
    const glow = P(TT.scene, 'sph', glowT(0xffffff, 0), [x, 0.6, z], 1), sp = parts(12, [0xffffff, 0xbfe8ff, 0xffe060], x, 0, z, 0.09);
    await TT.tween(2.0, q => {
      const pulse = 0.5 + 0.5 * Math.sin(q * q * 40); setS(o, 1 + pulse * 0.2 * q); o.rotation.y = o.userData.ry + q * q * 12;
      glow.material.opacity = Math.min(1, q * 1.2) * (0.6 + 0.4 * pulse); glow.scale.setScalar(0.5 + q * 0.7);
      sp.forEach((p, i) => { const a = i * 0.52 + q * 9, r = 1.8 * (1 - q) + 0.2; p.position.set(x + Math.cos(a) * r, 0.2 + (i % 4) * 0.4, z + Math.sin(a) * r); });
    });
    const hpK = m.hp / TT.maxHp(m); m.sp = ev[0]; m.hp = Math.max(1, Math.round(TT.maxHp(m) * Math.max(hpK, 0.5)));
    o = await place(-1, m); bars(); TT.sfx.caught(); B.shake = 0.3;
    await TT.tween(0.6, q => { glow.scale.setScalar(1.2 + q * 2.5); glow.material.opacity = 1 - q; setS(o, 0.6 + 0.4 * ease(q) + Math.sin(q * 3.14) * 0.15); sp.forEach((p, i) => { const a = i * 0.52; p.position.set(x + Math.cos(a) * q * 2.4, 0.7 + Math.sin(a * 2) * q, z + Math.sin(a) * q * 2.4); p.scale.setScalar(0.1 * (1 - q)); }); });
    TT.scene.remove(glow); kill(sp); setS(o, 1);
    gesture('cheer', 2);
    await say('Wow! ' + old + ' evolved into ' + TT.monName(m) + '!', 2.2);
  }

  // the visible part of a ball throw (same on the owner's and a watcher's screen)
  async function ballAnim(ok, shakes) {
    const fo = st.obj.foe, A = TT.World.ARENA, fs = spot(1), fy = mid(fo), tr = st.me_h, gy = 0.2;
    tr.userData.gesture = 'throw'; tr.userData.gk = 0;
    await TT.tween(0.3, q => { tr.userData.gk = q * 0.5; });
    TT.sfx.throw();
    const ball = TT.ballModel(0.2), bx = A.x - 4.2, by = 1.5; TT.scene.add(ball); st.extras.push(ball);
    await TT.tween(0.5, q => { tr.userData.gk = 0.5 + q * 0.5; ball.position.set(bx + (fs[0] - bx) * q, by + (fy + 0.3 - by) * q + Math.sin(q * 3.14) * 1.6, fs[1] + 0.3); ball.rotation.x -= 0.5; });
    tr.userData.gesture = null;
    const fl = P(TT.scene, 'sph', glowT(0xff5a4a, 0.85), [fs[0], fy, fs[1]], 0.3); TT.sfx.open();
    await TT.tween(0.35, q => { setS(fo, Math.max(0.01, 1 - q)); fo.position.y = q * fy; fl.scale.setScalar(0.9 * (1 - q) + 0.12); ball.rotation.x = 0; ball.rotation.z = Math.sin(q * 12) * 0.2; });
    fo.visible = false; TT.scene.remove(fl);
    await TT.tween(0.6, q => { const h = (fy + 0.3 - gy); ball.position.y = gy + h * Math.abs(Math.cos(q * 4.7)) * (1 - q); });
    ball.position.y = gy; TT.sfx.shake();
    for (let i = 0; i < shakes; i++) { await TT.wait(0.35); TT.sfx.shake(); await TT.tween(0.4, q => { ball.rotation.z = Math.sin(q * 6.28) * 0.55; ball.position.x = fs[0] + Math.sin(q * 6.28) * 0.08; }); }
    await TT.wait(0.3);
    if (ok) {
      TT.sfx.caught(); gesture('cheer', 2.5);
      const stars = parts(7, [0xffe060, 0xffffff], fs[0], gy, fs[1] + 0.3, 0.1);
      await TT.tween(0.7, q => { ball.position.y = gy + Math.sin(q * 3.14) * 0.15; stars.forEach((s, i) => { const a = i * 0.9 + 0.3; s.position.set(fs[0] + Math.cos(a) * q * 1.3, gy + Math.abs(Math.sin(a)) * q * 1.5 + 0.2, fs[1] + 0.3); s.scale.setScalar(0.12 * (1 - q * 0.8)); }); });
      kill(stars); return;
    }
    TT.sfx.bad(); const fl2 = P(TT.scene, 'sph', glowT(0xffffff, 0.9), [fs[0], gy, fs[1]], 0.2); TT.scene.remove(ball); fo.visible = true;
    await TT.tween(0.3, q => { setS(fo, Math.max(0.01, ease(q)) * (1 + Math.sin(q * 3.14) * 0.2)); fo.position.y = Math.sin(q * 3.14) * 0.4; fl2.scale.setScalar(0.2 + q * 1.4); fl2.material.opacity = 0.9 * (1 - q); });
    TT.scene.remove(fl2); setS(fo, 1); fo.position.y = 0;
  }
  async function throwBall() {
    const S = TT.S, foe = st.foe;
    S.balls--; setMsg('You threw a Poké Ball!');
    const k0 = foe.hp / TT.maxHp(foe), chance = k0 < 0.3 ? 1 : TT.clamp(0.3 + 0.75 * (1 - k0), 0, 1), ok = Math.random() < chance, shakes = ok ? 3 : 1 + (Math.random() * 2 | 0);
    emit('ball', { ok, shakes });
    await ballAnim(ok, shakes);
    await say(ok ? 'Gotcha! ' + TT.monName(foe) + ' was caught!' : 'Oh no! ' + TT.monName(foe) + ' broke free!', ok ? 1.6 : 1);
    return ok;
  }

  // opts: { foes:[mon], wild:bool, trainer:'name', people:[peopleKeys], easy:bool } -> 'win' | 'lose' | 'caught' | 'run'
  B.start = async function (opts) {
    const S = TT.S, A = TT.World.ARENA;
    st = { foes: opts.foes, fi: 0, wild: !!opts.wild, easy: !!opts.easy, obj: {}, extras: [], humans: [], assists: [], trainer: opts.trainer || '', people: opts.people || [] };
    st.foe = st.foes[0]; st.me = S.party.find(m => m.hp > 0);
    B.active = true; camK = 0; TT.sfx.battle(); TT.music(opts.music || 'battle');
    const me = st.me_h = TT.human(TT.PEOPLE[S.ch]); me.position.set(A.x - 4.7, 0, A.z - 0.9); me.rotation.y = 1.25; TT.scene.add(me); st.extras.push(me); st.humans.push(me);
    (opts.people || []).forEach((k, i) => { const p = TT.human(TT.PEOPLE[k]); p.position.set(A.x + 4.3 + i * 1.5, 0, A.z + 0.1 - i * 1.9); p.rotation.y = -1.25; TT.scene.add(p); st.extras.push(p); st.humans.push(p); });
    if (opts.ally) { placeAlly('lugia'); addHuman(opts.ally, -5.8, 1.5, 1.25); st.npcAlly = { sp: 'lugia', lvl: st.me.lvl + 4, mv: ['Aeroblast', 'flying', 55], n: 'Gohan' }; st.turn = 0; }
    $('battle').classList.remove('hide'); $('bmenu').innerHTML = '';
    await place(1, st.foe, !st.wild); if (st.wild) TT.cry(st.foe.sp); await place(-1, st.me); st.obj.me.visible = false; bars();
    TT.tween(1.1, q => { camK = ease(q); });
    await say(st.wild ? 'A wild ' + TT.monName(st.foe) + ' appeared!' : opts.trainer + ' sent out ' + TT.monName(st.foe) + '!', 1.3);
    setMsg('Go, ' + TT.monName(st.me) + '!'); gesture('point', 0.8); await place(-1, st.me, true); await TT.wait(0.35);
    let result = null;
    // a foe ran out of HP: faint, XP, next foe. Returns true when the battle is won.
    const foeDown = async () => {
      await faint(st.obj.foe, 1); await say((st.wild ? 'The wild ' : "The foe's ") + TT.monName(st.foe) + ' fainted!', 0.9);
      await gainXp(st.me, Math.round((st.foe.lvl * 9 + 6) * (st.wild ? 1 : 1.4)));
      if (++st.fi < st.foes.length) { st.foe = st.foes[st.fi]; bars(); setMsg(opts.trainer + ' sent out ' + TT.monName(st.foe) + '!'); await place(1, st.foe, true); await TT.wait(0.5); return false; }
      return true;
    };
    while (!result) {
      const act = st.assists.length ? { t: 'assist' } : await choose(); let foeTurn = true;
      if (act.t === 'assist') {            // a friend's helper attack: a free bonus hit
        const a = st.assists.shift(); foeTurn = false; $('bmenu').classList.add('off');
        if (a && st.foe.hp > 0) { if (!st.obj.ally || st.obj.ally.userData.sp !== a.sp) placeAlly(a.sp); await attack({ sp: a.sp, lvl: a.lvl }, st.foe, a.mv, st.obj.ally, st.obj.foe, st.easy ? 1.5 : 1, a.n); if (st.foe.hp <= 0 && await foeDown()) { result = 'win'; break; } }
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
      }
      if (act.t !== 'assist' && st.npcAlly && st.foe.hp > 0 && (++st.turn % 2 === 1)) st.assists.push(st.npcAlly);   // Gohan's Lugia swoops in every other turn
      if (foeTurn) {
        await attack(st.foe, st.me, TT.pick(TT.moves(st.foe)), st.obj.foe, st.obj.me, st.easy ? 0.35 : 0.7);
        if (st.me.hp <= 0) {
          await faint(st.obj.me, -1); await say(TT.monName(st.me) + ' fainted!', 1);
          const nx = S.party.find(m => m.hp > 0);
          if (nx) { st.me = nx; bars(); setMsg('Go, ' + TT.monName(nx) + '!'); await place(-1, nx, true); await TT.wait(0.3); } else result = 'lose';
        }
      }
    }
    if (result === 'win' || result === 'caught') {
      TT.sfx.win(); gesture('cheer', 1.6); await TT.wait(result === 'win' ? 1.2 : 0.2);
      for (const m of S.party.slice()) if (m.hp > 0) await evolve(m);
    }
    emit('end', { r: result });
    $('battle').classList.add('hide');
    for (const k of ['me', 'foe', 'ally']) if (st.obj[k]) TT.scene.remove(st.obj[k]);
    st.extras.forEach(o => TT.scene.remove(o));
    st = null; B.active = false; TT.music(opts.after || 'town');
    return result;
  };

  // ---- network: owner side receives joins and helper attacks; watcher side receives the event stream ----
  B.onNet = function (id, d) {
    if (!st) return;
    if (st.watch) { if (String(id) === String(st.owner)) { st.q.push(d); if (st.qw) { const w = st.qw; st.qw = null; w(); } } return; }
    if (d.t === 'join') {
      placeAlly(d.sp); addHuman(d.ch, -5.8, 1.5, 1.25); TT.sfx.pick(); TT.toast(d.n + ' joined the battle!');
      const snap = m => ({ sp: m.sp, lvl: m.lvl, hp: m.hp, mx: TT.maxHp(m) });
      TT.Net.send({ e: 'b', t: 'sync', to: id, me: snap(st.me), foe: snap(st.foe), wild: st.wild, tr: st.trainer, ppl: st.people, ch: TT.S.ch, dots: $('foeDots').textContent });
    } else if (d.t === 'assist' && d.mv && TT.DEX[d.sp]) {
      if (st.assists.length < 2) st.assists.push({ sp: d.sp, lvl: Math.min(60, d.lvl | 0), mv: [String(d.mv[0]), d.mv[1], Math.min(90, +d.mv[2] || 35)], n: d.n });
      if (st.wake) { const w = st.wake; st.wake = null; w({ t: 'assist' }); }
    }
  };
  B.owning = () => B.active && st && !st.watch;

  // Join a friend's battle: watch it live and send helper attacks. stillOn() says whether they are still fighting.
  B.watch = async function (owner, name, stillOn) {
    const S = TT.S, lead = S.party.find(m => m.hp > 0) || S.party[0], myName = TT.playerName || NAMES[S.ch] || 'Friend';
    st = { watch: true, owner, q: [], obj: {}, extras: [], humans: [], foes: [], wild: true };
    B.active = true; camK = 1; TT.music('battle'); TT.sfx.battle();
    $('battle').classList.remove('hide'); $('bmenu').innerHTML = ''; $('bmsg').textContent = 'Joining ' + name + "'s battle…";
    for (const id of ['myName', 'myLvl', 'myHpTxt', 'foeName', 'foeLvl', 'foeDots']) $(id).textContent = '';
    let left = null; const leaveP = new Promise(r => { left = r; });
    const next = () => new Promise(res => { if (st.q.length) return res(st.q.shift()); const to = setTimeout(() => { st.qw = null; res(null); }, 2500); st.qw = () => { clearTimeout(to); res(st.q.shift()); }; });
    const menu = () => {
      const m = $('bmenu'); m.innerHTML = ''; m.classList.remove('off');
      TT.moves(lead).forEach(mv => {
        const b = document.createElement('button'); b.innerHTML = '⚡ Help: ' + mv[0] + '<small>' + TT.monName(lead) + ' · ' + mv[1] + '</small>'; b.style.background = hex(TT.TYPE_COL[mv[1]]);
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
        st.me = ev.me; st.foe = ev.foe; st.wild = ev.wild;
        st.me_h = addHuman(ev.ch, -4.7, -0.9, 1.25); (ev.ppl || []).forEach((k, i) => addHuman(k, 4.3 + i * 1.5, 0.1 - i * 1.9, -1.25)); addHuman(S.ch, -5.8, 1.5, 1.25);
        await place(-1, st.me); await place(1, st.foe); placeAlly(lead.sp); bars(); $('foeDots').textContent = ev.dots || ''; $('bmsg').textContent = 'You joined ' + name + '! Tap a move to help.'; menu();
      } else if (!st.me) continue;
      else if (ev.t === 'mon') { const m = { sp: ev.sp, lvl: ev.lvl, hp: ev.hp, mx: ev.mx }; if (ev.s === 'me') st.me = m; else st.foe = m; await place(ev.s === 'me' ? -1 : 1, m, ev.pop); bars(); }
      else if (ev.t === 'msg') $('bmsg').textContent = String(ev.x).replace(/^What will .*/, name + ' is choosing a move…').replace(/^You threw/, name + ' threw');
      else if (ev.t === 'atk') { const ao = st.obj[ev.s], dobj = ev.s === 'foe' ? st.obj.me : st.obj.foe, df = ev.s === 'foe' ? st.me : st.foe; if (ao && dobj) await animAtk(ao, dobj, ev.ty, ev.dmg, ev.eff, () => { df.hp = ev.hp; bars(); }); }
      else if (ev.t === 'faint') { const o = st.obj[ev.s]; if (o) await faint(o, ev.s === 'foe' ? 1 : -1); }
      else if (ev.t === 'ball') await ballAnim(!!ev.ok, ev.shakes | 0);
      else if (ev.t === 'end') { result = ev.r; break; }
    }
    $('bmenu').innerHTML = '';
    if (result === 'win' || result === 'caught') {
      TT.sfx.win(); $('bmsg').textContent = name + (result === 'win' ? ' won the battle!' : ' caught it!'); await TT.wait(1.3);
      if (helped && lead.hp > 0) {
        const xp = 8 + (st.foe ? st.foe.lvl : 3) * 5; lead.xp += xp; let up = false;
        while (lead.xp >= TT.xpNeed(lead)) { lead.xp -= TT.xpNeed(lead); lead.lvl++; lead.hp = TT.maxHp(lead); up = true; }
        if (up) TT.sfx.level(); $('bmsg').textContent = TT.monName(lead) + ' got ' + xp + ' XP for helping!' + (up ? ' It grew to level ' + lead.lvl + '!' : ''); await TT.wait(1.8);
      }
    } else if (result) { $('bmsg').textContent = result === 'run' ? name + ' ran away.' : name + "'s Pokémon fainted!"; await TT.wait(1.3); }
    $('battle').classList.add('hide');
    for (const k of ['me', 'foe', 'ally']) if (st.obj[k]) TT.scene.remove(st.obj[k]);
    st.extras.forEach(o => TT.scene.remove(o));
    st = null; B.active = false; TT.music('town');
    return result;
  };

  B.update = function (dt, t) {
    if (!st) return;
    for (const k of ['me', 'foe', 'ally']) { const o = st.obj[k]; if (o && o.visible) TT.animCreature(o, t, 0); }
    for (const h of st.humans) TT.animHuman(h, t, 0);
    B.shake = Math.max(0, B.shake - dt * 1.4);
  };
  B.camera = function (cam, aspect, t) {
    const A = TT.World.ARENA, d = aspect < 1 ? 7.4 / Math.max(aspect, 0.45) * 0.8 : 7.4, s = B.shake;
    const x = A.x + Math.sin(t * 0.35) * 0.5 + (1 - camK) * 2.2 + rand(-s, s) * 0.35, y = 2.3 + d * 0.12 - (1 - camK) * 0.9 + rand(-s, s) * 0.35, z = A.z + d - (1 - camK) * 3.2;
    cam.position.set(x, y, z); cam.lookAt(A.x + (1 - camK) * 1.6, 0.9, A.z);
  };
  B.focus = () => TT.World.ARENA;
})();
