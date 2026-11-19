// Service worker: app shell em cache-first; mídia externa em stale-while-revalidate.
const VERSION = 'abc-v1';
const SHELL = `${VERSION}-shell`;
const MEDIA = `${VERSION}-media`;
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Imagens/GIFs externos: devolve o cache na hora e atualiza em segundo plano
  if (url.origin !== self.location.origin) {
    if (req.destination === 'image') {
      e.respondWith(
        caches.open(MEDIA).then(async (cache) => {
          const cached = await cache.match(req);
          const network = fetch(req)
            .then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; })
            .catch(() => cached);
          return cached || network;
        })
      );
    }
    return;
  }

  // Navegação: rede primeiro, cache se offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // Assets do app (JS/CSS com hash): cache-first e guarda o que vier da rede
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
