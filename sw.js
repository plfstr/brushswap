const CACHE = 'rtbcache';
var REQUIRED_FILES = [
  'index.html?20210223',
  'styles.css?20220429',
  'app.js?20231114',
  'dayjs.min.js',
  'manifest.json'
];

self.addEventListener('install', function(event) {
event.waitUntil(
    caches.open(CACHE)
      .then(function(cache) {
        console.log('[install] Caches opened, adding all core components to cache');
        return cache.addAll(REQUIRED_FILES);
      })
      .then(function() {
        console.log('[install] All required resources have been cached');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(async () => {
      const cache = await caches.open(CACHE);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse !== undefined) {
          return cachedResponse;
      } else {
          return fetch(event.request)
      };
  });
});

self.addEventListener('activate', function(event) {
  console.log('[activate] Activating ServiceWorker!');
  console.log('[activate] Claiming this ServiceWorker!');
  event.waitUntil(self.clients.claim());
});
