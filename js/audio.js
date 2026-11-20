// Gesproken begeleiding met ALLEEN eigen opnames (geen computerstem).
// Bronnen, in volgorde: opname op dit apparaat (IndexedDB) → bestand op de server (stem/opnames/).
// Ontbreekt een opname, dan wordt de zin overgeslagen; de tekst verschijnt wel in het tekstballonnetje.
import { idb, state } from "./store.js";
import { markFile } from "./sync.js";

let manifest = [];              // [{id, tekst, groep, tip, prioriteit}]
const textOf = {};
const local = new Set();        // id's met opname in IndexedDB
let server = {};                // id -> url
let serverWritable = false;
const urlCache = {};
const el = new Audio();
el.preload = "auto";
let queue = [], playing = null, onText = () => {}, onState = () => {};

export async function initAudio() {
  try { manifest = await (await fetch("stem/audio-manifest.json")).json(); } catch { manifest = []; }
  manifest.forEach((m) => (textOf[m.id] = m.tekst));
  (await idb.keys("audio")).forEach((k) => local.add(k));
  await refreshServer();
}

export async function refreshServer() {
  try {
    const r = await fetch("api/opnames", { cache: "no-store" });
    if (r.ok) { server = await r.json(); serverWritable = ["localhost", "127.0.0.1"].includes(location.hostname); return; }
  } catch { /* geen server: alleen opnames op dit apparaat */ }
  try { server = await (await fetch("stem/opnames/index.json", { cache: "no-store" })).json(); } catch { server = {}; }
}

export const getManifest = () => manifest;
export const text = (id) => textOf[id] || "";
export const has = (id) => local.has(id) || !!server[id];
export const isLocal = (id) => local.has(id);
export const canUpload = () => serverWritable;
export function setHandlers(h) { onText = h.onText || onText; onState = h.onState || onState; }

async function urlFor(id) {
  if (local.has(id)) {
    if (!urlCache[id]) { const rec = await idb.get("audio", id); if (rec?.blob) urlCache[id] = URL.createObjectURL(rec.blob); }
    if (urlCache[id]) return urlCache[id];
  }
  return server[id] ? server[id] + "?v=" + (server[id].length) : null;
}

/** iOS staat geluid pas toe na een aanraking: roep dit aan bij de eerste tik. */
export function unlock() {
  el.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
  el.play().catch(() => {});
  ctx();
}

/** Speelt zinnen achter elkaar. interrupt=true stopt wat er nu klinkt. Resolvet als alles klaar is. */
export function say(ids, { interrupt = true } = {}) {
  ids = [].concat(ids).filter(Boolean);
  if (interrupt) { const old = queue; queue = []; old.forEach((i) => i.done?.()); stopCurrent(); }
  return new Promise((resolve) => {
    queue.push(...ids.map((id) => ({ id })));
    queue.push({ done: resolve });
    if (!playing) next();
  });
}
/** Alleen afspelen als er niets anders klinkt (voor kleine hulpzinnetjes). */
export function sayIfIdle(id) { if (!playing && !queue.length) return say(id, { interrupt: false }); return Promise.resolve(); }
export const busy = () => !!playing || queue.length > 0;

function stopCurrent() { try { el.pause(); } catch {} if (playing?.resolve) playing.resolve(); playing = null; }
export function stop() { queue = []; stopCurrent(); onState(false); onText(""); }

async function next() {
  const item = queue.shift();
  if (!item) { playing = null; onState(false); return; }
  if (item.done) { item.done(); return next(); }
  const t = text(item.id);
  onText(t);
  const url = state.settings.voice ? await urlFor(item.id) : null;
  if (!url) {
    // geen opname: kort de tekst tonen, dan door
    playing = { id: item.id };
    onState(true);
    await new Promise((r) => { playing.resolve = r; setTimeout(r, Math.min(2600, 700 + t.length * 45)); });
    playing = null;
    return next();
  }
  playing = { id: item.id };
  onState(true);
  await new Promise((r) => {
    playing.resolve = r;
    el.onended = el.onerror = () => r();
    el.src = url;
    el.play().catch(() => r());
  });
  playing = null;
  next();
}

// ------------------------------------------------------------------ opnames beheren (Ouderhoek)
export async function saveRecording(id, blob) {
  await idb.put("audio", id, { blob, type: blob.type, at: Date.now() });
  local.add(id);
  markFile("audio", id);
  if (urlCache[id]) { URL.revokeObjectURL(urlCache[id]); delete urlCache[id]; }
  if (serverWritable) {
    try {
      const r = await fetch("api/opnames/" + id, { method: "PUT", headers: { "Content-Type": blob.type.split(";")[0] }, body: blob });
      if (r.ok) server[id] = (await r.json()).url;
    } catch { /* blijft lokaal bewaard */ }
  }
}
export async function deleteRecording(id) {
  await idb.del("audio", id);
  local.delete(id);
  markFile("audio", id);
  if (urlCache[id]) { URL.revokeObjectURL(urlCache[id]); delete urlCache[id]; }
  if (serverWritable) { try { await fetch("api/opnames/" + id, { method: "DELETE" }); delete server[id]; } catch {} }
}
export async function preview(id) { return say(id); }

// Opname van een ander apparaat binnengekomen (sync.js)
window.addEventListener("meadow:bestand", ({ detail: { kind, id, weg } }) => {
  if (kind !== "audio") return;
  if (urlCache[id]) { URL.revokeObjectURL(urlCache[id]); delete urlCache[id]; }
  if (weg) local.delete(id); else local.add(id);
});

// ------------------------------------------------------------------ zachte belletjes (geen stem)
let ac;
function ctx() {
  try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch { ac = null; }
  return ac;
}
export function chime(kind = "stroke") {
  if (!state.settings.effects) return;
  const a = ctx();
  if (!a) return;
  const notes = kind === "letter" ? [784, 988, 1175, 1568] : kind === "soft" ? [523] : [880, 1175];
  notes.forEach((f, i) => {
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + i * 0.11;
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(kind === "soft" ? 0.05 : 0.09, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + 0.65);
  });
}
