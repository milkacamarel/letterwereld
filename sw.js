// Offline werken (alleen actief via https): app-bestanden uit de cache, opnames uit het netwerk als dat kan.
const CACHE = "letterwereld-1795143105";
const FILES = ["./", "index.html", "css/app.css", "manifest.webmanifest", "icons/icon.svg", "icons/icon-180.png",
  "js/app.js", "js/art.js", "js/audio.js", "js/engine.js", "js/glyph.js", "js/letters.js", "js/parent.js", "js/store.js",
  "js/sync.js", "js/trace.js", "js/words.js", "stem/audio-manifest.json"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then(async (c) => {
  await c.addAll(FILES);
  try { // ingesproken zinnen meteen bewaren, zodat ze ook offline klinken
    const idx = await (await fetch("stem/opnames/index.json", { cache: "no-store" })).json();
    await c.addAll(Object.values(idx));
  } catch { /* nog geen opnames meegestuurd */ }
}).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) =>
  Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return; // gezinsopslag niet cachen
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
