const CACHE = 'rtbcache';
var REQUIRED_FILES = [
  'index.html?20210223',
  'styles.css?20220429',
  'app.js?20211204',
  'moment.min.js?20220422',
  'store.modern.min.js',
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

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          console.log(
            '[fetch] Returning from ServiceWorker cache: ',
            event.request.url
          );
          return response;
        }
        console.log('[fetch] Returning from server: ', event.request.url);
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  console.log('[activate] Activating ServiceWorker!');
  console.log('[activate] Claiming this ServiceWorker!');
  event.waitUntil(self.clients.claim());
});