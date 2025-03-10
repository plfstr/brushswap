const CACHE = 'rtbcache';
var REQUIRED_FILES = [
  'index.html?20210223',
  'styles.css?20220429',
  'app.js?20240919',
  'dayjs.min.js?20240831',
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
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key.startsWith("rtbcache") && !CACHE.includes(key)) {
          return caches.delete(key);
        }
      })
    ))
  );
});
});

self.addEventListener('error', err => {
  console.error(err.message);
});
