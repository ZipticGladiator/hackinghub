// Hacking Hub — PWA bootstrap
// Loaded on every page (like nav.js / partials.js). Registers the service
// worker that makes the site installable and offline-capable. Kept separate
// from nav.js so the "install / offline" concern is easy to find and reason
// about on its own.
//
// The service worker itself (service-worker.js) is network-first for pages,
// so there is no stale-content trap and no need to nag the visitor to
// "reload for updates" — a fresh page is fetched on the next navigation and
// the new worker takes over silently.

(function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // file:// (opening index.html directly) can't host a service worker, and
  // there's no benefit registering one off a preview IP. https + localhost only.
  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  if (protocol !== 'https:' && !isLocalhost) return;

  // Was this page already under SW control when it loaded? If not, the first
  // controllerchange is just the initial worker claiming the page — no reload
  // wanted. If it was, a controllerchange means a genuinely newer worker took
  // over and a one-time reload keeps asset versions consistent.
  const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller);

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        // When an updated worker has finished installing, let it activate
        // straight away rather than waiting for every tab to close.
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });

    // A new worker took control — reload once so the page is served by it
    // consistently. Guarded so it only ever happens a single time.
    let hasReloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasReloaded || !hadControllerAtLoad) return;
      hasReloaded = true;
      window.location.reload();
    });
  });
})();
