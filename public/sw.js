/*
 * Service worker – Cabinet Cérès
 * - Ressources statiques (/_next/static, icônes) : cache d'abord (fichiers versionnés, immuables).
 * - Pages publiques : réseau d'abord, repli sur le cache puis sur /offline.html.
 * - Jamais de cache pour /admin, les requêtes non-GET ou les domaines tiers (Firebase, Firestore…).
 * Incrémenter VERSION pour invalider les caches lors d'un changement de stratégie.
 */
const VERSION = "v1";
const STATIC_CACHE = `ceres-static-${VERSION}`;
const PAGES_CACHE = `ceres-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];
const CACHEABLE_PAGES = ["/", "/confidentialite"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/__/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, url));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirstPage(request, url) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && CACHEABLE_PAGES.includes(url.pathname)) {
      cache.put(url.pathname, response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(url.pathname)) ||
      (await caches.match(OFFLINE_URL)) ||
      new Response("Hors ligne", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}
