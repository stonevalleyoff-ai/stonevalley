// Stone Valley — le service worker : la page et ses images sont gardées, pour jouer hors ligne.
// La page passe par le réseau d'abord (une nouvelle version arrive donc au premier chargement),
// le reste par le cache d'abord. Tout ce qui va vers Supabase passe tout droit.
const CACHE = 'stone-valley-217';   // (§236) la même version que les scripts de index.html (src="….js?v=217")
const FICHIERS = ['./', './index.html', './donjon.js', './rouages.js', './forge.js', './nomades.js', './etats.js', './brume.js', './roi.js', './trone.js', './achromie.js', './vyrel.js', './village.js', './volcan.js', './dons.js', './coop.js', './faune.js', './flore.js', './lignees.js', './conduites.js', './pouvoirs.js', './orvane/corps.js', './orvane/tampon.js', './orvane/correspondance.js', './orvane/secours.js', './orvane/orvane-sv.js', './manifest.webmanifest',
  './icone-192.png', './icone-512.png', './icone-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));   // (§236) jamais une copie d'hier
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE && !k.startsWith('stone-valley:')).map(k => caches.delete(k))))   // (§217) le monde d'Orvane garde son cache
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  if (page) {
    e.respondWith(fetch(u.href, { cache: 'no-cache' })   // (§236) le serveur dit si la page a changé : jamais celle du cache du navigateur
      .then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Le code (donjon.js…) suit la page : réseau d'abord, sinon une page neuve tournerait avec un
  // module d'hier. (§236) Et le réseau sans le cache du navigateur : GitHub Pages y garde un script dix
  // minutes, et une page neuve avec l'orvane-sv.js d'hier n'avait plus que des automates. La page
  // demande ses scripts avec sa version (….js?v=206) ; hors ligne, n'importe quelle version gardée.
  if (u.pathname.endsWith('.js')) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' })
      .then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match(e.request, { ignoreSearch: true }))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
