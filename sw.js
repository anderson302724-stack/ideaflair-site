// Ideaflair: pass-through service worker (no caching), for Add to Home Screen support.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
