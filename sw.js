
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Periodic Background Sync or other background tasks could be added here
// Note: Real-time GPS tracking while the browser is FULLY CLOSED is extremely limited for web apps.
// This Service Worker helps keep the app context alive in the background on some mobile browsers.
