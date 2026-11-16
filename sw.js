// Service worker: network-first so the game updates itself whenever it is online,
// and still opens from the cache when there is no connection.
const CACHE = 'trainer-town-22f44d9';
const FILES = ['./', 'index.html', 'css/style.css', 'manifest.json', 'js/three.min.js', 'js/peerjs.min.js', 'js/core.js', 'js/dex.js', 'js/world.js', 'js/world2.js', 'js/battle.js', 'js/net.js', 'js/config.js', 'js/game.js', 'icons/icon-192.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => { })); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
