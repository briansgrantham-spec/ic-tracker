// Caches the app so it opens with no internet. Bump CACHE whenever any app file changes.
const CACHE = 'ic-tracker-v4';
const ASSETS = ['./', './index.html', './config.js', './manifest.json', './icon-180.png', './icon-512.png'];
// Fonts and the Firebase library are cached the first time they load, so they work offline too.
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin, cdn = CDN_HOSTS.includes(url.hostname);
  // Leave everything else (the live database connection, sign-in) to the network
  if (!sameOrigin && !cdn) return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: sameOrigin}).then(hit => hit || fetch(e.request).then(res => {
      if (cdn && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => sameOrigin ? caches.match('./index.html') : Response.error()))
  );
});
