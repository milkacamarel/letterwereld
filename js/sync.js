// Synchroniseren tussen apparaten met één gezinscode (geen account, geen persoonsgegevens).
// Voortgang, instellingen, opnames en foto's gaan naar een kleine gezinsopslag:
//   - Google Firestore, als sync-config.json een Firebase-project noemt (werkt overal, via internet);
//   - anders de Mac met server.py (alleen thuis op hetzelfde wifi-netwerk).
// De app werkt altijd eerst op het apparaat zelf. Zonder verbinding wordt het later bijgewerkt.
//
// Samenvoegen verliest nooit voortgang: per letter telt het hoogste aantal, trofeeën blijven,
// instellingen en opnames/foto's: de nieuwste wint. "Voortgang wissen" geldt voor alle apparaten.
import { state, save, saveHooks, idb, normalizeSettings } from "./store.js";

const KEY = "meadow.sync";
export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // zonder 0/O, 1/I/L
const SKEW = 10 * 60 * 1000;     // marge voor klokverschil tussen apparaten
const MAX_DATA = 950_000;        // Firestore: max. ~1 MB per bestand
const EVERY = 60 * 1000;

const ls = loadLocal();
function loadLocal() {
  const base = { code: null, lastPull: 0, lastOk: 0, files: {}, pending: {}, skipped: {} };
  try { return { ...base, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return base; }
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(ls)); } catch {} }

let backend = null, kind = "";            // kind: "firebase" | "mac" | ""
let status = { busy: false, error: "", at: ls.lastOk };
const listeners = new Set();
const emit = () => listeners.forEach((f) => f(info()));

// ------------------------------------------------------------------ gezinscode
export function newCode() {
  const r = crypto.getRandomValues(new Uint8Array(12));
  return [...r].map((x) => CODE_CHARS[x % CODE_CHARS.length]).join("");
}
/** "pret-7kq4 vmn9" → "PRET7KQ4VMN9", of null als het geen geldige code is. */
export function normalizeCode(s) {
  const c = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length === 12 && [...c].every((x) => CODE_CHARS.includes(x)) ? c : null;
}
export const prettyCode = (c) => (c ? c.match(/.{4}/g).join("-") : "");

// ------------------------------------------------------------------ samenvoegen (los te testen)
const thin = (drawing) => (drawing || []).map((pts) => pts.filter((p, i) =>
  i === 0 || i === pts.length - 1 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) >= 1));

export function docOf(st = state) {
  const progress = {};
  for (const [k, e] of Object.entries(st.progress)) progress[k] = { ...e, drawing: e.drawing ? thin(e.drawing) : null };
  return { settings: st.settings, settingsAt: st.meta.settingsAt, resetAt: st.meta.resetAt, progress, trophies: st.trophies };
}

export function mergeDocs(a, b) {
  const resetAt = Math.max(a.resetAt || 0, b.resetAt || 0);
  const live = (e) => (e && (e.last || 0) >= resetAt ? e : null);
  const progress = {};
  for (const k of new Set([...Object.keys(a.progress || {}), ...Object.keys(b.progress || {})])) {
    const x = live(a.progress?.[k]), y = live(b.progress?.[k]);
    if (!x && !y) continue;
    if (!x || !y) { progress[k] = structuredClone(x || y); continue; }
    const newer = (y.last || 0) > (x.last || 0) ? y : x;
    progress[k] = {
      attempts: Math.max(x.attempts || 0, y.attempts || 0),
      successes: Math.max(x.successes || 0, y.successes || 0),
      errors: Math.max(x.errors || 0, y.errors || 0),
      levels: [0, 1, 2].map((i) => Math.max(x.levels?.[i] || 0, y.levels?.[i] || 0)),
      last: Math.max(x.last || 0, y.last || 0),
      drawing: structuredClone(newer.drawing || x.drawing || y.drawing || null),
    };
  }
  const trophies = {};
  for (const src of [a.trophies || {}, b.trophies || {}])
    for (const [id, t] of Object.entries(src)) if (t >= resetAt) trophies[id] = Math.min(trophies[id] || Infinity, t);
  const s = (b.settingsAt || 0) > (a.settingsAt || 0) ? b : a;
  return { settings: structuredClone(s.settings), settingsAt: s.settingsAt || 0, resetAt, progress, trophies };
}
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);

// ------------------------------------------------------------------ opslag-varianten
export function firestore({ apiKey, projectId }) {
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  const key = `key=${encodeURIComponent(apiKey)}`;
  const path = (code, p) => `${base}/gezinnen/${code}/${p}?${key}`;
  const enc = (o) => ({ fields: Object.fromEntries(Object.entries(o).filter(([, v]) => v != null).map(([n, v]) =>
    [n, typeof v === "number" ? { integerValue: String(Math.round(v)) } : typeof v === "boolean" ? { booleanValue: v } : { stringValue: String(v) }])) });
  const dec = (f = {}) => Object.fromEntries(Object.entries(f).map(([n, v]) =>
    [n, "integerValue" in v ? Number(v.integerValue) : "booleanValue" in v ? v.booleanValue : v.stringValue ?? null]));
  async function call(url, opts = {}) {
    const r = await fetch(url, { cache: "no-store", ...opts, headers: opts.body ? { "Content-Type": "application/json" } : {} });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(r.status === 403 ? "geen toegang (kloppen de Firestore-regels?)" : `fout ${r.status} van Firestore`);
    return r.json();
  }
  return {
    async getState(code) { const j = await call(path(code, "data/voortgang")); return j ? JSON.parse(dec(j.fields).json || "null") : null; },
    putState: (code, doc) => call(path(code, "data/voortgang"), { method: "PATCH", body: JSON.stringify(enc({ json: JSON.stringify(doc), t: Date.now() })) }),
    async listFiles(code, since) {
      const j = await call(`${base}/gezinnen/${code}:runQuery?${key}`, { method: "POST", body: JSON.stringify({ structuredQuery: {
        from: [{ collectionId: "bestanden" }],
        select: { fields: ["t", "weg", "type"].map((fieldPath) => ({ fieldPath })) },
        where: { fieldFilter: { field: { fieldPath: "t" }, op: "GREATER_THAN_OR_EQUAL", value: { integerValue: String(since) } } },
      } }) });
      return (j || []).filter((x) => x.document).map((x) => ({ key: decodeURIComponent(x.document.name.split("/").pop()), ...dec(x.document.fields) }));
    },
    async getFile(code, k) { const j = await call(path(code, "bestanden/" + encodeURIComponent(k))); return j && { key: k, ...dec(j.fields) }; },
    putFile: (code, k, rec) => call(path(code, "bestanden/" + encodeURIComponent(k)), { method: "PATCH", body: JSON.stringify(enc(rec)) }),
  };
}

function macServer() {
  const u = (code, p) => `api/sync/${code}/${p}`;
  async function call(url, opts = {}) {
    const r = await fetch(url, { cache: "no-store", ...opts, headers: opts.body ? { "Content-Type": "application/json" } : {} });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`fout ${r.status} van de Mac`);
    return r.json();
  }
  return {
    getState: (code) => call(u(code, "state")),
    putState: (code, doc) => call(u(code, "state"), { method: "PUT", body: JSON.stringify(doc) }),
    listFiles: async (code, since) => (await call(u(code, `files?since=${since}`))) || [],
    getFile: async (code, k) => { const j = await call(u(code, "files/" + encodeURIComponent(k))); return j && { key: k, ...j }; },
    putFile: (code, k, rec) => call(u(code, "files/" + encodeURIComponent(k)), { method: "PUT", body: JSON.stringify(rec) }),
  };
}

// ------------------------------------------------------------------ bestanden (opnames, foto's)
const STORE = { audio: "audio", foto: "images" };
const toB64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(",")[1] || "");
  r.onerror = () => rej(r.error);
  r.readAsDataURL(blob);
});
function fromB64(data, type) {
  const bin = atob(data), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type });
}
async function readLocal(k) {
  const [kd, id] = k.split(/\.(.*)/);
  const v = await idb.get(STORE[kd], id);
  const blob = v?.blob || (v instanceof Blob ? v : null);
  const t = ls.files[k] || Date.now();
  return blob ? { t, weg: false, type: blob.type || v.type || "", data: await toB64(blob) } : { t, weg: true };
}
async function applyFile(rec) {
  const [kd, id] = rec.key.split(/\.(.*)/);
  if (!STORE[kd]) return;
  if (rec.weg) await idb.del(STORE[kd], id);
  else {
    const blob = fromB64(rec.data || "", rec.type || "");
    await idb.put(STORE[kd], id, kd === "audio" ? { blob, type: blob.type, at: rec.t } : blob);
  }
  window.dispatchEvent(new CustomEvent("meadow:bestand", { detail: { kind: kd, id, weg: !!rec.weg } }));
}

/** Aanroepen na elke wijziging van een opname (kind "audio") of foto (kind "foto"). */
export function markFile(kd, id) {
  const k = `${kd}.${id}`;
  ls.files[k] = Date.now();
  ls.pending[k] = true;
  delete ls.skipped[k];
  persist();
  soon();
}

// ------------------------------------------------------------------ synchroniseren
let running = null, again = false, timer = 0, applying = false;
let settingsHash = JSON.stringify(state.settings);

function onLocalSave() {
  if (applying) return;
  const h = JSON.stringify(state.settings);
  if (h !== settingsHash) { settingsHash = h; state.meta.settingsAt = Date.now(); applying = true; save(); applying = false; }
  soon();
}
function soon(ms = 2500) { clearTimeout(timer); if (ls.code && backend) timer = setTimeout(syncNow, ms); }

export function syncNow() {
  if (!backend || !ls.code) return Promise.resolve();
  if (running) { again = true; return running; }
  running = run().finally(() => { running = null; if (again) { again = false; syncNow(); } });
  return running;
}

async function run() {
  const code = ls.code;
  status = { ...status, busy: true }; emit();
  try {
    // 1. voortgang en instellingen
    const remote = await backend.getState(code);
    const local = docOf();
    const merged = remote ? mergeDocs(local, remote) : mergeDocs(local, local);
    if (!same(merged, local)) applyDoc(merged);
    if (!remote || !same(merged, remote)) await backend.putState(code, merged);

    // 2. nieuwe opnames/foto's van andere apparaten ophalen
    const started = Date.now();
    const list = await backend.listFiles(code, ls.lastPull ? Math.max(0, ls.lastPull - SKEW) : 0);
    for (const f of list) {
      if (ls.code !== code) return;
      if ((f.t || 0) <= (ls.files[f.key] || 0)) continue;  // hebben we al, of hier nieuwer
      const full = f.weg ? f : await backend.getFile(code, f.key);
      if (!full || (full.t || 0) <= (ls.files[f.key] || 0)) continue;
      await applyFile({ ...full, key: f.key });
      ls.files[f.key] = f.t; delete ls.pending[f.key]; persist();
    }
    ls.lastPull = started;

    // 3. eigen wijzigingen versturen
    for (const k of Object.keys(ls.pending)) {
      if (ls.code !== code) return;
      const t = ls.files[k], rec = await readLocal(k);
      if (rec.data && rec.data.length > MAX_DATA) { ls.skipped[k] = true; delete ls.pending[k]; persist(); continue; }
      await backend.putFile(code, k, rec);
      if (ls.files[k] === t) { delete ls.pending[k]; persist(); }  // intussen opnieuw gewijzigd? dan straks nog eens
    }
    ls.lastOk = Date.now(); persist();
    status = { busy: false, error: "", at: ls.lastOk };
  } catch (e) {
    status = { busy: false, error: navigator.onLine === false ? "geen internet, later opnieuw" : (e.message || "onbekende fout"), at: ls.lastOk };
  }
  emit();
}

function applyDoc(doc) {
  applying = true;
  state.settings = normalizeSettings(doc.settings);
  state.meta.settingsAt = doc.settingsAt || 0;
  state.meta.resetAt = doc.resetAt || 0;
  state.progress = doc.progress || {};
  state.trophies = doc.trophies || {};
  settingsHash = JSON.stringify(state.settings);
  save();
  applying = false;
  window.dispatchEvent(new CustomEvent("meadow:voortgang"));
}

// ------------------------------------------------------------------ koppelen
/** Koppelt dit apparaat aan een gezin. Wat hier al staat wordt samengevoegd, niet overschreven. */
export async function link(code) {
  code = normalizeCode(code);
  if (!code) throw new Error("Deze code klopt niet. Een gezinscode heeft 12 tekens, bijvoorbeeld PRET-7KQ4-VMN9.");
  Object.assign(ls, { code, lastPull: 0, lastOk: 0, pending: {}, skipped: {} });
  for (const [kd, store] of Object.entries(STORE)) {
    for (const id of await idb.keys(store)) {
      const k = `${kd}.${id}`, v = await idb.get(store, id);
      ls.files[k] ||= v?.at || 1;   // foto's zonder datum: een al bestaande gezinsfoto gaat voor
      ls.pending[k] = true;
    }
  }
  persist();
  return syncNow();
}
export function unlink() { Object.assign(ls, { code: null, lastPull: 0, pending: {}, skipped: {} }); persist(); status = { busy: false, error: "", at: 0 }; emit(); }

export function info() {
  return { kind, code: ls.code, busy: status.busy, error: status.error, at: status.at,
    pending: Object.keys(ls.pending).length, skipped: Object.keys(ls.skipped) };
}
export function onChange(f) { listeners.add(f); return () => listeners.delete(f); }
export const koppelLink = () => (ls.code ? `${location.origin}${location.pathname}#gezin=${prettyCode(ls.code)}` : "");

export async function initSync() {
  try {
    const r = await fetch("sync-config.json", { cache: "no-store" });
    const cfg = r.ok ? await r.json() : null;
    if (cfg?.firebase?.apiKey && cfg.firebase.projectId) { backend = firestore(cfg.firebase); kind = "firebase"; }
  } catch { /* geen instellingen */ }
  if (!backend) {
    try { const r = await fetch("api/sync", { cache: "no-store" }); if (r.ok) { backend = macServer(); kind = "mac"; } } catch {}
  }
  saveHooks.push(onLocalSave);
  // koppel-link: ...#gezin=PRET-7KQ4-VMN9
  const m = location.hash.match(/gezin=([A-Za-z0-9-]+)/);
  if (m) {
    history.replaceState(null, "", location.pathname + location.search);
    if (backend && !ls.code && normalizeCode(m[1])) link(m[1]).catch(() => {});
  }
  if (!backend) return;
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && syncNow());
  window.addEventListener("online", () => syncNow());
  setInterval(() => document.visibilityState === "visible" && syncNow(), EVERY);
  syncNow();
}
