const CACHE_CLEANUP_NAME = 'takhet-pwa-disabled-20260617-white-screen-rollback';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() =>
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: CACHE_CLEANUP_NAME,
              message: 'Takhet service worker cache cleared.'
            });
          });
        })
      )
  );
});

self.addEventListener('fetch', () => {
  return undefined;
});
