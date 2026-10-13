// Caches the app so it opens with no internet. Bump CACHE whenever index.html changes.
const CACHE = 'ic-tracker-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

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
  const isFont = FONT_HOSTS.includes(new URL(e.request.url).hostname);
  e.respondWith(
    caches.match(e.request, {ignoreSearch: !isFont}).then(hit => hit || fetch(e.request).then(res => {
      // Keep a copy of the web fonts so they also work offline
      if (isFont && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => isFont ? Response.error() : caches.match('./index.html')))
  );
});
