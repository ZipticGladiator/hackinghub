/* Hacking Hub — Service Worker
 *
 * Strategy (chosen deliberately for a site that publishes updates):
 *   - HTML / navigations : network-first. The live community-events feed and
 *     any content edits must never be shadowed by a stale cached page. Cache
 *     is only a fallback for when the network is actually unreachable, and
 *     offline.html is the last resort.
 *   - Same-origin static assets (CSS/JS/images) : stale-while-revalidate.
 *     Instant repeat loads, with a background refresh so the next visit is
 *     current. A version bump (CACHE_VERSION) still forces a clean sweep.
 *   - Whitelisted CDN assets (Google Fonts, Font Awesome) : same SWR treatment
 *     so the app shell still renders correctly offline.
 *   - Everything else (analytics, Supabase, YouTube, AdSense) : not touched —
 *     the request goes straight to the network as if no SW existed.
 *
 * Bump CACHE_VERSION whenever the precache list or this file changes.
 */

const CACHE_VERSION = 'hh-cache-v1';

// The app shell — enough to render any page offline.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/reviews.html',
  '/salaries.html',
  '/quiz.html',
  '/interview-prep.html',
  '/offline.html',
  '/styles.css',
  '/script.js',
  '/nav.js',
  '/partials.js',
  '/pwa.js',
  '/manifest.webmanifest',
  '/images/hacking-hub-logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/icon-maskable-512.png',
  '/images/apple-touch-icon.png',
];

// Cross-origin hosts whose GET responses are safe and useful to cache.
const CACHEABLE_CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // addAll is atomic — one 404 aborts the whole install — so add the
      // shell entries individually and don't let a single miss block SW setup.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// Let the page tell a waiting SW to take over immediately (see pwa.js).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isHtmlRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  );
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Navigations that we've never seen fall back to the offline shell.
    if (isHtmlRequest(request)) {
      const offline = await cache.match('/offline.html');
      if (offline) return offline;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || network || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  // Chrome extension / non-http(s) schemes.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.origin === self.location.origin) {
    event.respondWith(isHtmlRequest(request) ? networkFirst(request) : staleWhileRevalidate(request));
    return;
  }

  if (CACHEABLE_CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Analytics, Supabase, YouTube, AdSense, everything else: leave untouched.
});
