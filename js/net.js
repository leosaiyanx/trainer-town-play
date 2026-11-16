// net.js — multiplayer. Two transports, same message shape:
//   * home server (node server.js): WebSocket relay on the same host
//   * anywhere (public site): peer-to-peer via PeerJS, grouped by a private family room code
// Only positions/character/partner are ever sent. Silently stays solo if nothing connects.
(function () {
  const TT = window.TT;
  const N = TT.Net = { peers: {}, id: 0, on: false, mode: '', room: '' };
  const q = new URLSearchParams(location.search);
  const got = (id, d) => { const p = N.peers[id] || (N.peers[id] = { id }); p.d = d; p.last = performance.now(); p.gone = false; };
  const bye = id => { if (N.peers[id]) N.peers[id].gone = true; };
  const allGone = () => { for (const k in N.peers) N.peers[k].gone = true; };

  function readRoom() {
    const m = /room=([A-Za-z0-9]{3,12})/.exec(location.hash) || /room=([A-Za-z0-9]{3,12})/.exec(location.search);
    let r = m ? m[1].toUpperCase() : '';
    try { if (r) localStorage.setItem('tt_room', r); else r = localStorage.getItem('tt_room') || ''; } catch (e) { }
    return r;
  }
  N.setRoom = function (code) {
    code = (code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
    if (code.length < 3) return false;
    try { localStorage.setItem('tt_room', code); } catch (e) { }
    N.room = code; if (N.mode !== 'ws') p2p(); return true;
  };

  N.connect = function () {
    if (location.protocol === 'file:') return;
    const local = /^(localhost$|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
    if (local && q.get('net') !== 'p2p') return wsConnect();
    N.mode = 'p2p'; N.room = readRoom();
    if (N.room) p2p();
  };

  // ---- home server ----
  let ws = null, retry = 0;
  function wsConnect() {
    N.mode = 'ws';
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host); } catch (e) { return; }
    ws.onopen = () => { N.on = true; retry = 0; };
    ws.onmessage = e => {
      let m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.hello) { N.id = m.hello; return; }
      if (m.bye) return bye(m.id);
      if (m.d) got(m.id, m.d);
    };
    ws.onclose = ws.onerror = () => {
      if (ws) { ws.onclose = ws.onerror = null; ws = null; }
      N.on = false; allGone();
      if (retry++ < 40) setTimeout(wsConnect, 3000);
    };
  }

  // ---- peer-to-peer: first device in the room is the hub, the rest connect to it ----
  let peer = null, conns = {}, hub = null, isHub = false, lt = null;
  function cleanup() { try { if (peer) peer.destroy(); } catch (e) { } peer = null; conns = {}; hub = null; N.on = false; allGone(); }
  function later() { if (lt) return; lt = setTimeout(() => { lt = null; p2p(); }, 2500 + Math.random() * 2500); }
  function p2p() {
    if (!window.Peer || !N.room) return;
    cleanup(); isHub = true;
    const hubId = 'tt-llj-' + N.room.toLowerCase() + '-hub', me = peer = new Peer(hubId);
    me.on('open', () => { if (peer === me) N.on = true; });
    me.on('connection', c => {
      c.on('open', () => { conns[c.peer] = c; });
      c.on('data', d => { if (!d || typeof d !== 'object') return; got(c.peer, d); for (const k in conns) if (k !== c.peer && conns[k].open) conns[k].send({ id: c.peer, d }); });
      const gone = () => { if (!conns[c.peer]) return; delete conns[c.peer]; bye(c.peer); for (const k in conns) if (conns[k].open) conns[k].send({ id: c.peer, bye: 1 }); };
      c.on('close', gone); c.on('error', gone);
    });
    me.on('error', e => { if (peer !== me) return; if (e.type === 'unavailable-id') join(hubId); else if (!N.on) later(); });
    me.on('disconnected', () => { if (peer === me) try { me.reconnect(); } catch (e) { } });
  }
  function join(hubId) {
    cleanup(); isHub = false;
    const me = peer = new Peer();
    me.on('open', () => {
      if (peer !== me) return;
      const c = hub = me.connect(hubId, { reliable: false, serialization: 'json' });
      const lost = () => { if (hub !== c) return; hub = null; N.on = false; allGone(); later(); };
      c.on('open', () => { if (hub === c) N.on = true; });
      c.on('data', m => { if (!m) return; if (m.bye) bye(m.id); else if (m.d) got(m.id, m.d); });
      c.on('close', lost); c.on('error', lost);
      setTimeout(() => { if (hub === c && !c.open) lost(); }, 9000);
    });
    me.on('error', () => { if (peer === me && !N.on) later(); });
  }

  N.send = o => {
    if (N.mode === 'ws') { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); return; }
    if (!N.on) return;
    if (isHub) { for (const k in conns) if (conns[k].open) conns[k].send({ id: 'hub', d: o }); }
    else if (hub && hub.open) hub.send(o);
  };
  N.count = () => Object.values(N.peers).filter(p => !p.gone && p.d).length;
})();
