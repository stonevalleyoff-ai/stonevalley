// Stone Valley — le service worker : la page et ses images sont gardées, pour jouer hors ligne.
// La page passe par le réseau d'abord (une nouvelle version arrive donc au premier chargement),
// le reste par le cache d'abord. Tout ce qui va vers Supabase passe tout droit.
const CACHE = 'stone-valley-1';
const FICHIERS = ['./', './index.html', './manifest.webmanifest',
  './icone-192.png', './icone-512.png', './icone-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  if (page) {
    e.respondWith(fetch(e.request)
      .then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
