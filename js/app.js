// Meadows Magische Letterwereld — schermen en navigatie.
import { ALPHABET } from "./letters.js";
import { WORDS, SOUND_NOTE } from "./words.js";
import { state, save, letterStats, isDone, idb } from "./store.js";
import * as audio from "./audio.js";
import { mascot, TROPHIES, picHTML, ICON, sparkle } from "./art.js";
import { glyphSVG, drawingSVG } from "./glyph.js";
import { mountTrace, LEVELS } from "./trace.js";
import { mountParent } from "./parent.js";
import * as sync from "./sync.js";

const root = document.getElementById("app");
let current = null;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let lastPraise = "";

// ------------------------------------------------------------------ hulpjes
export function go(name, params = {}) {
  current?.destroy?.();
  current = null;
  root.scrollTop = 0;
  SCREENS[name](params);
}
const wordText = (ch, i) => state.settings.words?.[`${ch}_${i}`] || WORDS[ch][i - 1][0];
const photoCache = {};
async function photoUrl(key) {
  if (key in photoCache) return photoCache[key];
  const b = await idb.get("images", key);
  return (photoCache[key] = b ? URL.createObjectURL(b) : null);
}
export function forgetPhoto(key) { if (photoCache[key]) URL.revokeObjectURL(photoCache[key]); delete photoCache[key]; }
const caseOf = (key) => (key === key.toUpperCase() ? "groot" : "klein");

function suggestLevel(key) {
  if (!state.settings.autoLevel) return 1;
  const lv = state.progress[key]?.levels || [0, 0, 0];
  return lv[1] >= 2 ? 3 : lv[0] >= 2 ? 2 : 1;
}
function allowedCases() {
  return { beide: ["groot", "klein"], groot: ["groot"], klein: ["klein"] }[state.settings.cases] || ["groot", "klein"];
}
function decor() {
  return `<div class="decor" aria-hidden="true">
    <svg class="d1" viewBox="-12 -12 24 24">${sparkle(0, 0, 11, "#F5C35A")}</svg>
    <svg class="d2" viewBox="-12 -12 24 24">${sparkle(0, 0, 11, "#F48FC4")}</svg>
    <svg class="d3" viewBox="-12 -12 24 24">${sparkle(0, 0, 11, "#B07BEA")}</svg>
    <div class="butterfly">🦋</div></div>`;
}

// tekstballon + pratend hulpdiertje
let bubbleTimer;
audio.setHandlers({
  onText: (t) => {
    clearTimeout(bubbleTimer);
    document.querySelectorAll(".bubble").forEach((b) => { if (t) b.textContent = t; b.classList.toggle("show", !!t); });
  },
  onState: (talking) => {
    document.querySelectorAll(".mascot").forEach((m) => m.classList.toggle("talk", talking));
    if (!talking) bubbleTimer = setTimeout(() => document.querySelectorAll(".bubble").forEach((b) => b.classList.remove("show")), 1800);
  },
});

// ------------------------------------------------------------------ trofeeën
export function checkTrophies() {
  const keys = Object.keys(state.progress).filter(isDone);
  const distinct = new Set(keys.map((k) => k.toLowerCase())).size;
  const allLower = ALPHABET.every((c) => isDone(c));
  const allUpper = ALPHABET.every((c) => isDone(c.toUpperCase()));
  const fresh = [];
  for (const t of TROPHIES) {
    if (state.trophies[t.id]) continue;
    const ok = (t.need.distinct && distinct >= t.need.distinct) || (t.need.allLower && allLower) || (t.need.allUpper && allUpper);
    if (ok) { state.trophies[t.id] = Date.now(); fresh.push(t); }
  }
  if (fresh.length) save();
  return fresh;
}

// ------------------------------------------------------------------ schermen
const SCREENS = {
  welcome() {
    root.innerHTML = `
    <div class="screen welcome">${decor()}
      <div class="corner">
        <button class="btn-round sound" aria-label="Geluid">${state.settings.voice ? ICON.speaker : ICON.mute}</button>
        <button class="btn-round parent hold" aria-label="Ouderhoek (ingedrukt houden)">${ICON.lock}<span class="ring"></span></button>
      </div>
      <h1 class="title"><span>Meadows</span> Magische Letterwereld</h1>
      <p class="slogan">Elke letter is een klein avontuur!</p>
      <div class="hero">${mascot("big")}<div class="bubble">Welkom terug in jouw magische letterwereld, Meadow!</div></div>
      <div class="menu">
        <button class="btn-big go-letters">${ICON.wand}<span>Letters oefenen</span></button>
        <div class="menu-row">
          <button class="btn-mid go-trophies">${ICON.trophy}<span>Mijn trofeeën</span></button>
          <button class="btn-mid go-alphabet">${ICON.abc}<span>Mijn alfabet</span></button>
        </div>
      </div>
    </div>`;
    root.querySelector(".go-letters").onclick = () => go("letters");
    root.querySelector(".go-trophies").onclick = () => go("trophies");
    root.querySelector(".go-alphabet").onclick = () => go("alphabet");
    root.querySelector(".hero .mascot").onclick = () => audio.say(["welkom_2"]);
    const snd = root.querySelector(".sound");
    snd.onclick = () => {
      state.settings.voice = !state.settings.voice;
      state.settings.effects = state.settings.voice;
      save();
      snd.innerHTML = state.settings.voice ? ICON.speaker : ICON.mute;
      if (!state.settings.voice) audio.stop();
    };
    parentGate(root.querySelector(".parent"));
    if (started) audio.say("welkom_2");
  },

  letters() {
    const cases = allowedCases();
    root.innerHTML = `
    <div class="screen letters">
      <header class="bar"><h2>Kies een letter</h2><button class="btn-round home" aria-label="Terug">${ICON.home}</button></header>
      <div class="tiles">${ALPHABET.map((c, i) => {
        const chars = cases.length === 2 ? [c.toUpperCase(), c] : cases[0] === "groot" ? [c.toUpperCase()] : [c];
        const done = chars.filter(isDone).length;
        return `<button class="tile ${i % 2 ? "lav" : "pink"}" data-c="${c}" aria-label="${c}">
          ${glyphSVG(chars, { color: "currentColor", width: 26, gap: 40 })}
          ${done ? `<span class="tstar ${done === chars.length ? "full" : ""}">${ICON.star}</span>` : ""}</button>`;
      }).join("")}</div>
    </div>`;
    root.querySelector(".home").onclick = () => go("welcome");
    root.querySelectorAll(".tile").forEach((t) => (t.onclick = () => go("letter", { ch: t.dataset.c })));
    audio.say("kies_letter");
  },

  async letter({ ch }) {
    const U = ch.toUpperCase();
    const cases = allowedCases();
    const pics = await Promise.all([1, 2, 3].map((i) => photoUrl(`${ch}_${i}`)));
    root.innerHTML = `
    <div class="screen letter-page">${decor()}
      <main class="lp-main">
        <div class="lp-head">
          <div class="lp-glyph">${glyphSVG([U, ch], { width: 24, lines: true })}</div>
          <div class="lp-sound">
            <button class="btn-pill hear-klank">${ICON.speaker}<span>klank</span></button>
            <button class="btn-pill hear-words">${ICON.speaker}<span>woorden</span></button>
          </div>
        </div>
        <div class="words">${WORDS[ch].map(([, pic], k) => `
          <button class="word-card" data-i="${k + 1}">
            <div class="pic">${picHTML(pic, pics[k])}</div>
            <div class="wtext">${[...wordText(ch, k + 1)].map((c) => c.toLowerCase() === ch ? `<b>${c}</b>` : c).join("")}</div>
          </button>`).join("")}</div>
        ${SOUND_NOTE[ch] ? `<p class="note">${SOUND_NOTE[ch]}</p>` : ""}
      </main>
      <aside class="side lp-side">
        <button class="btn-round home" aria-label="Terug">${ICON.back}</button>
        <div class="side-mascot">${mascot()}<div class="bubble"></div></div>
        <div class="write-btns">${cases.map((cs) => {
          const key = cs === "groot" ? U : ch;
          const lvl = suggestLevel(key);
          return `<button class="btn-write" data-k="${key}">
            ${glyphSVG([key], { color: "currentColor", width: 28 })}
            <span class="wl">${ICON[LEVELS[lvl - 1].icon]}</span>
            ${isDone(key) ? `<span class="tstar full">${ICON.star}</span>` : ""}</button>`;
        }).join("")}</div>
      </aside>
    </div>`;
    root.querySelector(".home").onclick = () => go("letters");
    root.querySelector(".hear-klank").onclick = () => audio.say(`${ch}_klank`);
    root.querySelector(".hear-words").onclick = () => audio.say([1, 2, 3].map((i) => `${ch}_woord_${i}`));
    root.querySelectorAll(".word-card").forEach((b) => (b.onclick = () => {
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
      audio.say(`${ch}_woord_${b.dataset.i}`);
    }));
    root.querySelectorAll(".btn-write").forEach((b) => (b.onclick = () =>
      go("trace", { ch: b.dataset.k, level: suggestLevel(b.dataset.k) })));
    audio.say(SOUND_NOTE[ch] ? [`${ch}_intro`, "klank_verschilt"] : [`${ch}_intro`, "tik_plaatje"]);
  },

  trace({ ch, level = 1, levelChanged = false, introDemo }) {
    current = mountTrace(root, {
      ch, level, levelChanged, introDemo,
      onDone: (res) => go("success", { ch, ...res }),
      onExit: () => { audio.stop(); go("letter", { ch: ch.toLowerCase() }); },
      onLevel: (l) => go("trace", { ch, level: l, levelChanged: true }),
    });
  },

  success({ ch, level, drawing }) {
    const fresh = checkTrophies();
    const praiseIds = ["gelukt_1", "gelukt_2", "gelukt_3", "gelukt_4", "gelukt_5", "gelukt_6"].filter((x) => x !== lastPraise);
    const praise = (lastPraise = pick(praiseIds));
    const next = ALPHABET[(ALPHABET.indexOf(ch.toLowerCase()) + 1) % 26];
    const nextKey = ch === ch.toUpperCase() ? next.toUpperCase() : next;
    const anim = state.settings.rewardAnim;
    const suggestHarder = level < 3 && state.settings.autoLevel;
    root.innerHTML = `
    <div class="screen success anim-${anim}">
      ${anim !== "uit" ? `<div class="confetti" aria-hidden="true">${Array.from({ length: anim === "rustig" ? 8 : 18 }, (_, i) =>
        `<svg style="--x:${(i * 53) % 100}%;--d:${(i % 6) * 0.18}s;--s:${0.6 + (i % 4) * 0.25}" viewBox="-12 -12 24 24">${sparkle(0, 0, 11, ["#F5C35A", "#F48FC4", "#B07BEA"][i % 3])}</svg>`).join("")}</div>` : ""}
      <main class="succ-main">
        <div class="succ-letter">${drawingSVG(drawing, ch)}</div>
        <h2 class="praise">${audio.text(praise) || "Goed gedaan, Meadow!"}</h2>
        ${fresh.map((t) => `<div class="new-trophy"><div class="tr-art">${t.svg()}</div><div><b>Nieuw!</b><br>${t.title}</div></div>`).join("")}
      </main>
      <aside class="side succ-side">
        <div class="side-mascot">${mascot("cheer")}<div class="bubble"></div></div>
        <button class="btn-act again">${ICON.restart}<span>Nog een keer</span></button>
        ${suggestHarder ? `<button class="btn-act harder">${ICON[LEVELS[level].icon]}<span>${level === 1 ? "Zonder pijltjes" : "Letterkampioen"}</span></button>` : ""}
        <button class="btn-act nextl">${ICON.next}<span>Volgende letter</span></button>
        <button class="btn-round home" aria-label="Letters">${ICON.home}</button>
      </aside>
    </div>`;
    root.querySelector(".again").onclick = () => go("trace", { ch, level, introDemo: false });
    root.querySelector(".harder")?.addEventListener("click", () => go("trace", { ch, level: level + 1, levelChanged: true }));
    root.querySelector(".nextl").onclick = () => go("letter", { ch: nextKey.toLowerCase() });
    root.querySelector(".home").onclick = () => go("letters");
    audio.say([praise, `${ch.toLowerCase()}_${caseOf(ch)}_klaar`, ...fresh.map((t) => t.voice),
      suggestHarder && level === 1 ? "zonder_pijltjes" : pick(["nog_een_letter", "nog_een_keer"])]);
  },

  trophies() {
    root.innerHTML = `
    <div class="screen trophies">${decor()}
      <header class="bar"><h2>Mijn trofeeënkast</h2><button class="btn-round home" aria-label="Terug">${ICON.home}</button></header>
      <div class="shelf">${TROPHIES.map((t) => `
        <button class="trophy ${state.trophies[t.id] ? "won" : "locked"}" data-id="${t.id}">
          <div class="tr-art">${t.svg()}</div><div class="tr-name">${t.title}</div>
          <div class="tr-how">${state.trophies[t.id] ? "Verdiend!" : t.how}</div></button>`).join("")}</div>
    </div>`;
    root.querySelector(".home").onclick = () => go("welcome");
    root.querySelectorAll(".trophy").forEach((b) => (b.onclick = () => {
      const t = TROPHIES.find((x) => x.id === b.dataset.id);
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
      audio.say(state.trophies[t.id] ? t.voice : t.hint);
    }));
    audio.say("mijn_trofeeen");
  },

  alphabet() {
    const cases = allowedCases();
    root.innerHTML = `
    <div class="screen alphabet">
      <header class="bar"><h2>Mijn alfabet</h2><button class="btn-round home" aria-label="Terug">${ICON.home}</button></header>
      <div class="abc">${ALPHABET.map((c) => {
        const keys = cases.map((cs) => (cs === "groot" ? c.toUpperCase() : c));
        return `<button class="abc-card" data-c="${c}">${keys.map((k) => isDone(k) && letterStats(k).drawing
          ? `<div class="mine">${drawingSVG(letterStats(k).drawing, k)}</div>`
          : `<div class="todo">${glyphSVG([k], { color: "var(--todo)", width: 18 })}</div>`).join("")}</button>`;
      }).join("")}</div>
    </div>`;
    root.querySelector(".home").onclick = () => go("welcome");
    root.querySelectorAll(".abc-card").forEach((b) => (b.onclick = () => audio.say(`${b.dataset.c}_intro`)));
    audio.say("mijn_alfabet");
  },

  parent() {
    current = mountParent(root, { onExit: () => go("welcome"), forgetPhoto });
  },
};

// ------------------------------------------------------------------ ouderslot: 2 sec vasthouden + som
function parentGate(btn) {
  let t;
  const startHold = (e) => { e.preventDefault(); btn.classList.add("holding"); t = setTimeout(() => { btn.classList.remove("holding"); askSum(); }, 2000); };
  const cancel = () => { clearTimeout(t); btn.classList.remove("holding"); };
  btn.addEventListener("pointerdown", startHold);
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, cancel));
}
function askSum() {
  const a = 6 + Math.floor(Math.random() * 4), b = 4 + Math.floor(Math.random() * 6), ans = a * b;
  const opts = [ans, ans + a, ans - b, ans + 7].sort(() => Math.random() - 0.5);
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="modal-card"><h3>Ouderhoek</h3><p>Hoeveel is ${a} × ${b}?</p>
    <div class="sum">${opts.map((o) => `<button class="btn-pill" data-v="${o}">${o}</button>`).join("")}</div>
    <button class="link close">Annuleren</button></div>`;
  document.body.appendChild(m);
  m.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { m.remove(); if (+b.dataset.v === ans) go("parent"); }));
  m.querySelector(".close").onclick = () => m.remove();
}

// ------------------------------------------------------------------ opstarten
let started = false;
async function boot() {
  document.addEventListener("contextmenu", (e) => { if (!e.target.closest("input, textarea")) e.preventDefault(); });
  document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
  await audio.initAudio();
  await sync.initSync();
  // foto van een ander apparaat binnengekomen: oude versie vergeten
  window.addEventListener("meadow:bestand", ({ detail }) => detail.kind === "foto" && forgetPhoto(detail.id));
  SCREENS.welcome();
  const splash = document.createElement("div");
  splash.className = "splash";
  splash.innerHTML = `<button class="splash-btn" aria-label="Start">${mascot("big")}<span class="tap">${ICON.wand}</span></button>`;
  document.body.appendChild(splash);
  splash.onclick = () => {
    audio.unlock();
    started = true;
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 450);
    audio.say(["welkom_1", "welkom_2"]);
  };
  if ("serviceWorker" in navigator && window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1")
    navigator.serviceWorker.register("sw.js").catch(() => {});
  // Vraag de browser om voortgang en opnames niet op te ruimen.
  if (window.isSecureContext) navigator.storage?.persist?.().catch(() => {});
}
boot();
