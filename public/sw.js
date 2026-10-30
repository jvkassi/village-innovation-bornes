/* Hors-ligne : l'interface du kiosque reste affichée si le Wi-Fi du salon tombe.
   La configuration est servie réseau d'abord (modifications visibles dès qu'il y a du réseau). */
const V = "kiosque-v5";
const COQUE = ["/kiosk.html", "/assets/kiosk.css", "/assets/kiosk.js", "/config/espaces.json",
  "/brand/lockup-side.svg", "/brand/icon.svg", "/brand/favicon.svg",
  "/fonts/Bricolage-Grotesque.woff2", "/fonts/Orbitron.woff2", "/vendor/qrcode.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(COQUE))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/demo/") || u.pathname.startsWith("/api/") || u.pathname.startsWith("/admin")) return;
  const reseauDabord = u.pathname.endsWith(".json") || u.pathname.endsWith(".html") || u.pathname === "/";
  e.respondWith(reseauDabord
    ? fetch(e.request).then((r) => { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    : caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
