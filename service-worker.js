const CACHE_NAME = "timetable-v3";
const STATIC_ASSETS = [
  "/studentTimetable/",
  "/studentTimetable/index.html",
  "/studentTimetable/style.css",
  "/studentTimetable/script.js",
  "/studentTimetable/manifest.json",
  "/studentTimetable/welcome.png",
  "/studentTimetable/icon-192.png",
  "/studentTimetable/icon-512.png"
];

// Install – cache static files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); 
});

// Activate – clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// This ensures it works offline, but updates the cache for NEXT time
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});