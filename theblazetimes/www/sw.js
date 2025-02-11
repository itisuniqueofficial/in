importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
  const appPrefix = 'www-theblaztimes-app';  // Replace with your app/website name
  const version = new Date().toISOString().split('T')[0];  // Dynamic version based on date

  workbox.core.setCacheNameDetails({
    prefix: `${appPrefix}-sw`,
    suffix: version,
    precache: 'precache-assets',
    runtime: 'runtime-assets',
  });

  const FALLBACK_HTML_URL = 'https://itisuniqueofficial.github.io/com/itisuniqueofficial/www/offline.html';

  // Precache assets
  workbox.precaching.precacheAndRoute([
    { url: FALLBACK_HTML_URL, revision: null },
    { url: 'https://www.theblaztimes.in/assets/fonts.css', revision: null },
    { url: 'https://www.theblaztimes.in/assets/manifest.json', revision: null },
    { url: '/favicon.ico', revision: null },
  ]);

  // Handle service worker updates correctly
  self.addEventListener('install', (event) => {
    self.skipWaiting();  // Activate new SW immediately
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        // Claim clients to ensure immediate control
        await clients.claim();
        // Delete outdated caches
        const cacheKeys = await caches.keys();
        const oldCacheKeys = cacheKeys.filter((key) => !key.includes(version));
        await Promise.all(oldCacheKeys.map((key) => caches.delete(key)));
      })()
    );
  });

  // Use StaleWhileRevalidate for better performance and freshness
  workbox.routing.registerRoute(
    /\.(?:css|js)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `${appPrefix}-assets-css-js-${version}`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60,  // Cache for 30 days
          maxEntries: 100,
        }),
      ],
    }),
    'GET'
  );

  // Cache images with CacheFirst strategy
  workbox.routing.registerRoute(
    /\.(?:png|gif|jpg|svg|ico)$/,
    new workbox.strategies.CacheFirst({
      cacheName: `${appPrefix}-assets-images-${version}`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 60 * 24 * 60 * 60,  // Cache images for 60 days
          maxEntries: 200,
          purgeOnQuotaError: true,
        }),
      ],
    }),
    'GET'
  );

  // Use StaleWhileRevalidate for other assets
  workbox.routing.setDefaultHandler(new workbox.strategies.StaleWhileRevalidate());

  // Improved offline fallback
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match(FALLBACK_HTML_URL);
    }
    return Response.error();
  });

} else {
  console.log('Oops! Workbox did not load');
}
