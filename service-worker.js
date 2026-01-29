/* ANP Puerto Lobos PWA - Service Worker v0.13.0 */
const CACHE_NAME = 'anp-pl-v0.14.0' + self.registration.scope;

const ASSETS = [
  "index.html",
  "404.html",
  "styles.css",
  "app.js",
  "data.json",
  "manifest.json",
  "service-worker.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "images/hero.jpg",
  "images/placeholder.png",
  "images/species/delfin_comun.jpg",
  "images/species/ballena_franca.jpg",
  "images/species/elefante_marino.jpg"
  "images/porqueno/fuego.png",
  "images/porqueno/cuatriciclos.png",
  "images/porqueno/pernocte.png",
  "images/porqueno/perros.png",
  "images/porqueno/basura.png",
  "images/porqueno/no-alimentar.png",
  "images/porqueno/no-acercarse.png",
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      const url = new URL(req.url);
      if (url.origin === self.location.origin) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      const offline = await cache.match('index.html');
      return offline || new Response('Offline', { status: 503 });
    }
  })());
});
