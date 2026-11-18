// world4.js — the Sky Pass: a valley of snowy peaks that you fly through on a Pokémon's back.
// It sits far away from every other place (with the battle stages), so while you fly nothing else is drawn.
(function () {
  const TT = window.TT, P = TT.P, W = TT.World;
  const { grp, chunk } = W.H;
  // a fixed sequence of "random" numbers, so the pass is the same every time and on every device
  let seed = 11; const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (b - a) * (seed / 2147483647); };
  // you fly north, from z0 to z1; cx(z) is the middle of the valley, half is how far you may stray to either side; lo and hi are the lowest and highest you can fly
  const S = W.SKY = { z0: 1480, z1: 1100, cx: z => 700 + Math.sin((z - 1100) * 0.021) * 15, half: 12.5, lo: 5.5, hi: 17.5, peaks: [], rings: [] };
  const FLOOR = -9;
  const peak = (x, z, r, h, obst) => { const g = grp(chunk(x, z), x, FLOOR, z), H = h - FLOOR; P(g, 'cone', obst ? 0x9aa0b0 : 0x8d93a3, [0, H / 2, 0], [r, H, r]); P(g, 'cone', 0xf4f8ff, [0, H - H * 0.17, 0], [r * 0.36, H * 0.36, r * 0.36]); if (obst) S.peaks.push({ x, z, r: r * (h / H), h }); };
  // the walls of the valley
  for (let z = S.z1 - 40; z <= S.z0 + 40; z += 8) for (const s of [1, -1]) peak(S.cx(z) + s * (S.half + 7 + rnd(0, 9)), z + rnd(-2, 2), rnd(8, 13), rnd(18, 36), false);
  // lone spires in the way: fly round the tall ones, or over the short ones
  for (let i = 0; i < 10; i++) { const z = S.z0 - 46 - i * 32 + rnd(-5, 5); peak(S.cx(z) + rnd(-7.5, 7.5), z, rnd(2.8, 3.8), rnd(9, 22), true); }
  // the snowy floor far below, with a river winding along it
  P(grp(chunk(700, 1290), 700, FLOOR - 0.3, 1290), 'box', 0xe6eef6, [0, 0, 0], [110, 0.5, 470]);
  for (let z = S.z1 - 30; z < S.z0 + 30; z += 10) P(grp(chunk(S.cx(z), z), S.cx(z + 5), FLOOR + 0.05, z + 5), 'box', 0x7ab8ee, [0, 0, 0], [5, 0.12, 10.6], [0, Math.atan2(S.cx(z + 10) - S.cx(z), 10), 0]);
  // clouds to fly through
  for (let i = 0; i < 26; i++) { const z = S.z1 - 10 + rnd(0, S.z0 - S.z1 + 20), g = grp(chunk(S.cx(z), z), S.cx(z) + rnd(-20, 20), rnd(2, 21), z); for (let j = 0; j < 3; j++) P(g, 'sph', 0xffffff, [(j - 1) * 1.7, rnd(-0.3, 0.3), rnd(-0.6, 0.6)], [rnd(1.4, 2.2), rnd(0.8, 1.1), rnd(1.1, 1.6)]); }
  // golden rings: [x, y, z]
  for (let i = 0; i < 12; i++) { const z = S.z0 - 30 - i * 29; let x = S.cx(z) + rnd(-7, 7); const y = rnd(7.5, 15.5); for (const o of S.peaks) if (Math.hypot(o.x - x, o.z - z) < o.r + 3.2) x = o.x + (x >= o.x ? 1 : -1) * (o.r + 3.4); S.rings.push([x, y, z]); }
})();
