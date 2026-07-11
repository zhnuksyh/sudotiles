// Minimal offline-capable service worker with runtime caching.
// The app's built asset names are content-hashed, so rather than precache a
// fixed list we cache same-origin GET responses as they are requested and
// serve them cache-first, falling back to the network (and, for navigations,
// to the cached app shell) when offline.

const CACHE = "sudotiles-v1";

self.addEventListener("install", (event) => {
  // Warm the cache with the app entry so the first offline launch has a shell.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["./", "./index.html"]).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match("./index.html"));

      return cached || network;
    }),
  );
});
