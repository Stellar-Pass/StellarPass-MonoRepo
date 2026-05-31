// Stellar Pass Scanner Service Worker
const CACHE_NAME = "stellar-pass-scanner-v1";
const OFFLINE_URL = "/scan";

// Assets to cache for offline use
const PRECACHE_ASSETS = [
  "/scan",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Handle API requests - network only with offline queue
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return offline response for API calls
        return new Response(
          JSON.stringify({
            error: "offline",
            message: "You are currently offline. Check-ins will be queued.",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 503,
          }
        );
      })
    );
    return;
  }

  // Handle page requests - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached response or offline page
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Background sync for queued check-ins
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-checkins") {
    event.waitUntil(syncCheckIns());
  }
});

// Sync queued check-ins
async function syncCheckIns() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_START" });
    });

    // Get queued check-ins from IndexedDB or localStorage
    // This would integrate with your offline storage mechanism

    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_COMPLETE" });
    });
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

// Push notification support
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || "New notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/scan",
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Stellar Pass", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || "/scan")
  );
});
