// Lokale opslag: instellingen en voortgang in localStorage, opnames en foto's in IndexedDB.
// Alles werkt op dit apparaat zelf. Met een gezinscode houdt sync.js andere apparaten bij.
const KEY = "meadow.v1";

export const DEFAULT_SETTINGS = {
  cases: "beide",            // "beide" | "klein" | "groot"
  voice: true,               // ingesproken stem
  effects: true,             // zachte belletjes
  sensitivity: "gebalanceerd",
  rewardAnim: "feestelijk",  // "feestelijk" | "rustig" | "uit"
  autoDemo: true,            // nieuwe letter: eerst voordoen
  autoLevel: true,           // volgend niveau voorstellen
  leftyBars: true,           // dwarsstreepjes (t, f, A, H, T) van rechts naar links
  variants: { t: "recht", y: "recht", T: "dak" },
  customLibrary: null,       // eigen schrijfroutes (geïmporteerd)
  words: {},                 // eigen woordteksten, bv. { "a_1": "ananas" }
};

export const normalizeSettings = (s = {}) =>
  ({ ...DEFAULT_SETTINGS, ...s, variants: { ...DEFAULT_SETTINGS.variants, ...(s.variants || {}) }, words: { ...(s.words || {}) } });

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      settings: normalizeSettings(raw.settings),
      progress: raw.progress || {},
      trophies: raw.trophies || {},
      // settingsAt: wanneer de instellingen voor het laatst zijn veranderd; resetAt: wanneer de voortgang is gewist
      meta: { settingsAt: 0, resetAt: 0, ...(raw.meta || {}) },
    };
  } catch {
    return { settings: normalizeSettings(), progress: {}, trophies: {}, meta: { settingsAt: 0, resetAt: 0 } };
  }
}

export const state = load();

/** Functies die na elke save() draaien (synchronisatie). */
export const saveHooks = [];

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* opslag vol of geblokkeerd */ }
  saveHooks.forEach((f) => f());
}

export function letterStats(ch) {
  return (state.progress[ch] ||= { attempts: 0, successes: 0, levels: [0, 0, 0], errors: 0, last: 0, drawing: null });
}

export const isDone = (ch) => (state.progress[ch]?.successes || 0) > 0;

// ------------------------------------------------------------------ IndexedDB
let dbP;
function db() {
  dbP ||= new Promise((res, rej) => {
    const r = indexedDB.open("meadow", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("audio"); r.result.createObjectStore("images"); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbP;
}
async function tx(store, mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
  });
}
export const idb = {
  get: (store, k) => tx(store, "readonly", (s) => s.get(k)).catch(() => undefined),
  put: (store, k, v) => tx(store, "readwrite", (s) => s.put(v, k)),
  del: (store, k) => tx(store, "readwrite", (s) => s.delete(k)),
  keys: (store) => tx(store, "readonly", (s) => s.getAllKeys()).catch(() => []),
};
