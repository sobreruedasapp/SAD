// ==============================
// SAD Tickets - Service Worker
// ==============================

const CACHE_NAME = "sad-tickets-v4"; // forzar actualización total
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
//  "./sr-logo-blanco-192.png",      // logo interno de la app
  "./sr-icon-192.png",  // ← nuevos
  "./sr-icon-512.png"   // ← nuevos
];

// ------------------------------
// Instalación: guarda los assets en caché
// ------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ------------------------------
// Activación: limpia cachés antiguas
// ------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ------------------------------
// Interceptar peticiones (fetch)
// ------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = req.url;

  // Ignora las llamadas de Analytics o proxys externos
  if (
  url.includes("google-analytics") ||
  url.includes("api.allorigins") ||
  url.includes("workers.dev") ||
  url.startsWith("chrome-extension://")
) {
  return;
}


  // Estrategia: Cache First, luego red de respaldo
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // actualiza en segundo plano
        fetch(req).then((response) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, response.clone());
          });
        });
        return cached;
      }
      return fetch(req)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

// ------------------------------
// Notificar a los clientes cuando estén offline
// ------------------------------
self.addEventListener("sync", (event) => {
  console.log("Sync event:", event);
});

// ------------------------------
// Manejo de peticiones OPTIONS (CORS preflight)
// ------------------------------
self.addEventListener("fetch", (event) => {
  if (event.request.method === "OPTIONS") {
    event.respondWith(
      new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
    );
  }
});
