const CACHE_VERSION = "v1";
const CACHE_NAME = `paper-pixels-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/maskable-icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-icon-512.png",
  "./js/pwa.js",
  "./js/main.js",
  "./js/config.js",
  "./js/application/EditorApplication.js",
  "./js/application/PieceVariantPicker.js",
  "./js/model/EditorState.js",
  "./js/model/connectors.js",
  "./js/model/connectorCompatibility.js",
  "./js/visualization/SvgVisualization.js",
  "./js/visualization/pieceGraphics.js",
  "./js/visualization/pieceGeometry.js",
  "./js/visualization/connectorPaths.js",
  "./js/visualization/variantPreview.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }

        const isSameOrigin =
          new URL(event.request.url).origin === self.location.origin;
        if (!isSameOrigin) return response;

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
