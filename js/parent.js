// Ouderhoek: voortgang, instellingen, lettervormen, opnamestudio en eigen woorden/foto's.
import { ALPHABET, VARIANTS, validateLibrary, strokesFor } from "./letters.js";
import { WORDS } from "./words.js";
import { state, save, idb } from "./store.js";
import * as sync from "./sync.js";
import * as audio from "./audio.js";
import { ICON, picHTML, TROPHIES } from "./art.js";
import { getLetter, guides, letterCfg } from "./glyph.js";

const TABS = [["voortgang", "Voortgang"], ["instellingen", "Instellingen"], ["stem", "Stem opnemen"],
  ["vormen", "Lettervormen"], ["woorden", "Woorden & foto's"], ["apparaten", "Apparaten"]];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const date = (t) => (t ? new Date(t).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "–");

export function mountParent(root, { onExit, forgetPhoto }) {
  let tab = "voortgang", rec = null, alive = true;
  root.innerHTML = `
  <div class="screen parent">
    <header class="bar"><h2>Ouderhoek</h2><button class="btn-round home" aria-label="Sluiten">${ICON.home}</button></header>
    <nav class="ptabs">${TABS.map(([k, t]) => `<button data-t="${k}">${t}</button>`).join("")}</nav>
    <section class="pbody"></section>
  </div>`;
  const body = root.querySelector(".pbody");
  root.querySelector(".home").onclick = () => { stopRec(); alive = false; offSync(); audio.stop(); onExit(); };
  // tijdens het kijken naar Voortgang of Apparaten: bijwerken als er iets binnenkomt
  const offSync = sync.onChange(() => alive && tab === "apparaten" && apparaten());
  const onRemote = () => alive && tab === "voortgang" && voortgang();
  window.addEventListener("meadow:voortgang", onRemote);
  root.querySelectorAll(".ptabs button").forEach((b) => (b.onclick = () => { stopRec(); tab = b.dataset.t; render(); }));

  function render() {
    root.querySelectorAll(".ptabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
    ({ voortgang, instellingen, stem, vormen, woorden, apparaten })[tab]();
  }

  // ------------------------------------------------------------ voortgang
  function voortgang() {
    const row = (k) => {
      const s = state.progress[k];
      if (!s || !s.attempts) return `<td class="muted">–</td>`;
      const best = s.levels[2] ? 3 : s.levels[1] ? 2 : s.levels[0] ? 1 : 0;
      return `<td>${s.successes ? `<b class="ok">✓ ${s.successes}×</b>` : "geoefend"}<br><small>${s.attempts} pogingen · niveau ${best || "–"} · ${date(s.last)}</small></td>`;
    };
    const done = Object.values(state.progress).filter((s) => s.successes).length;
    const tried = Object.values(state.progress).filter((s) => s.attempts).length;
    body.innerHTML = `
      <div class="cards3">
        <div class="pcard"><b>${done}</b><span>van 52 letters gelukt</span></div>
        <div class="pcard"><b>${tried}</b><span>letters geoefend</span></div>
        <div class="pcard"><b>${Object.keys(state.trophies).length}</b><span>van ${TROPHIES.length} trofeeën</span></div>
      </div>
      <p class="muted">Niveau 1 = magisch volgen (met pijltjes), 2 = zelf proberen, 3 = letterkampioen (zonder hulp).</p>
      <table class="ptable"><thead><tr><th></th><th>Hoofdletter</th><th>Kleine letter</th></tr></thead>
      <tbody>${ALPHABET.map((c) => `<tr><th>${c.toUpperCase()}${c}</th>${row(c.toUpperCase())}${row(c)}</tr>`).join("")}</tbody></table>
      <div class="danger">
        <button class="btn-pill ghost reset">Voortgang en trofeeën wissen…</button>
      </div>`;
    body.querySelector(".reset").onclick = () => {
      if (!confirm("Alle voortgang, getekende letters en trofeeën van Meadow wissen? Dit kan niet ongedaan worden gemaakt.")) return;
      state.progress = {}; state.trophies = {}; state.meta.resetAt = Date.now(); save(); voortgang();
    };
  }

  // ------------------------------------------------------------ instellingen
  function radio(name, value, opts) {
    return `<div class="seg">${opts.map(([v, label, hint]) =>
      `<label class="${value === v ? "on" : ""}"><input type="radio" name="${name}" value="${v}" ${value === v ? "checked" : ""}><span>${label}</span>${hint ? `<small>${hint}</small>` : ""}</label>`).join("")}</div>`;
  }
  function toggle(name, value, label, hint = "") {
    return `<label class="tog"><input type="checkbox" name="${name}" ${value ? "checked" : ""}><span class="sw"></span><span>${label}${hint ? `<small>${hint}</small>` : ""}</span></label>`;
  }
  function instellingen() {
    const s = state.settings;
    body.innerHTML = `
      <h3>Welke letters</h3>${radio("cases", s.cases, [["beide", "Hoofd- en kleine letters"], ["klein", "Alleen kleine letters"], ["groot", "Alleen hoofdletters"]])}
      <h3>Gevoeligheid van het overtrekken</h3>${radio("sensitivity", s.sensitivity, [
        ["ruim", "Ruim", "Veel ruimte naast de lijn. Fijn om te beginnen."],
        ["gebalanceerd", "Gebalanceerd", "Route volgen, kleine bibbers mogen. Aanbevolen."],
        ["precies", "Precies", "Dicht bij de lijn blijven."]])}
      <p class="muted">Startpunt, richting, volgorde en optillen worden altijd gecontroleerd; dit bepaalt alleen hoe ver ze van de lijn mag komen.</p>
      <h3>Beloningsanimaties</h3>${radio("rewardAnim", s.rewardAnim, [["feestelijk", "Feestelijk"], ["rustig", "Rustig"], ["uit", "Uit"]])}
      <h3>Geluid en begeleiding</h3>
      ${toggle("voice", s.voice, "Ingesproken stem")}
      ${toggle("effects", s.effects, "Zachte belletjes")}
      ${toggle("autoDemo", s.autoDemo, "Nieuwe letter eerst voordoen", "Het vingertje doet de letter voor, daarna mag Meadow.")}
      ${toggle("autoLevel", s.autoLevel, "Volgend niveau voorstellen", "Na twee keer gelukt stelt de app een niveau met minder hulp voor.")}`;
    body.querySelectorAll("input").forEach((i) => (i.onchange = () => {
      s[i.name] = i.type === "checkbox" ? i.checked : i.value;
      save(); instellingen();
    }));
  }

  // ------------------------------------------------------------ opnamestudio
  const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && window.isSecureContext);
  let filter = "start";
  function stem() {
    const items = audio.getManifest();
    const total = items.length, have = items.filter((m) => audio.has(m.id)).length;
    const groups = [...new Set(items.map((m) => m.groep))];
    const shown = items.filter((m) => filter === "alle" || (filter === "start" ? m.prioriteit === 1 : !audio.has(m.id)));
    body.innerHTML = `
      <div class="studio-head">
        <div class="meter"><div style="width:${(100 * have) / (total || 1)}%"></div></div>
        <p><b>${have}</b> van ${total} zinnen opgenomen.</p>
      </div>
      ${canRecord() ? `<p class="muted">Tik op ${ICON.mic} om op te nemen en op ${ICON.stop} om te stoppen. Luister terug met ${ICON.play}. Opnames blijven op dit apparaat${audio.canUpload() ? " en worden ook in de map <code>stem/opnames</code> bewaard, zodat de iPad ze krijgt" : ""}.</p>`
        : `<p class="warn">Opnemen kan hier niet: de browser geeft de microfoon alleen via een beveiligde verbinding (https) of op de computer zelf via <code>localhost</code>. Neem op de Mac op via http://localhost:8765, of importeer hieronder bestanden (bijv. uit Dictafoon).</p>`}
      <div class="row">
        ${[["start", "★ Om te beginnen"], ["nog", "Nog niet opgenomen"], ["alle", "Alles"]].map(([k, t]) =>
          `<button class="chip ${filter === k ? "on" : ""}" data-f="${k}">${t}</button>`).join("")}
        <label class="btn-pill ghost import">${ICON.upload}<span>Bestanden importeren</span><input type="file" accept="audio/*,.m4a,.mp3,.wav,.webm" multiple hidden></label>
      </div>
      <p class="muted small">Bij importeren moet de bestandsnaam de code zijn, bijv. <code>roze_stip.m4a</code>.</p>
      <div class="lines">${groups.map((g) => {
        const rows = shown.filter((m) => m.groep === g);
        if (!rows.length) return "";
        return `<h4>${esc(g)}</h4>${rows.map((m) => `
          <div class="line ${audio.has(m.id) ? "has" : ""}" data-id="${m.id}">
            <div class="lt"><div>${m.prioriteit === 1 ? '<span class="p1">★</span>' : ""}${esc(m.tekst)}</div>
              <small>${esc(m.tip || "")} <code>${m.id}</code></small></div>
            <div class="lb">
              ${audio.has(m.id) ? `<button class="ib play" aria-label="Afspelen">${ICON.play}</button>` : ""}
              ${canRecord() ? `<button class="ib recb" aria-label="Opnemen">${ICON.mic}</button>` : ""}
              ${audio.isLocal(m.id) || (audio.canUpload() && audio.has(m.id)) ? `<button class="ib del" aria-label="Verwijderen">${ICON.trash}</button>` : ""}
            </div></div>`).join("")}`;
      }).join("") || `<p class="muted">Niets meer te doen in deze lijst. 🎉</p>`}</div>`;
    body.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { filter = c.dataset.f; stem(); }));
    body.querySelector(".import input").onchange = async (e) => {
      const ids = new Set(items.map((m) => m.id));
      let ok = 0, skipped = [];
      for (const f of e.target.files) {
        const idn = f.name.replace(/\.[^.]+$/, "").toLowerCase().trim();
        if (ids.has(idn)) { await audio.saveRecording(idn, f); ok++; } else skipped.push(f.name);
      }
      alert(`${ok} opname(s) bewaard.${skipped.length ? `\nNiet herkend (naam klopt niet): ${skipped.join(", ")}` : ""}`);
      stem();
    };
    body.querySelectorAll(".line").forEach((row) => {
      const id = row.dataset.id;
      row.querySelector(".play")?.addEventListener("click", () => audio.preview(id));
      row.querySelector(".del")?.addEventListener("click", async () => {
        if (!confirm("Deze opname verwijderen?")) return;
        await audio.deleteRecording(id); stem();
      });
      row.querySelector(".recb")?.addEventListener("click", (e) => toggleRec(id, e.currentTarget));
    });
  }
  async function toggleRec(id, btn) {
    if (rec) { const same = rec.id === id; stopRec(); if (same) return; }
    audio.stop();
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch { alert("De microfoon mag niet gebruikt worden. Sta de microfoon toe in de browser en probeer opnieuw."); return; }
    const type = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((t) => MediaRecorder.isTypeSupported(t)) || "";
    const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks = [];
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mr.mimeType || type || "audio/webm" });
      if (blob.size > 800) { await audio.saveRecording(id, blob); if (alive && tab === "stem") { stem(); audio.preview(id); } }
    };
    mr.start();
    rec = { id, mr };
    btn.innerHTML = ICON.stop;
    btn.classList.add("live");
    btn.closest(".line").classList.add("recording");
  }
  function stopRec() { if (rec) { try { rec.mr.stop(); } catch {} rec = null; } }

  // ------------------------------------------------------------ lettervormen
  function preview(ch) {
    const L = getLetter(ch);
    const parts = L.strokes.map((s, i) => {
      const num = `<g transform="translate(${s.start[0]} ${s.start[1]})"><circle r="17" fill="var(--pink)"/><text y="6" text-anchor="middle" fill="#fff" font-size="18" font-weight="700">${i + 1}</text></g>`;
      if (s.type === "dot") return `<circle cx="${s.start[0]}" cy="${s.start[1]}" r="12" fill="var(--lav)"/>${num}`;
      const m = s.pts[Math.floor(s.pts.length * 0.6)], m2 = s.pts[Math.min(s.pts.length - 1, Math.floor(s.pts.length * 0.6) + 3)];
      const deg = (Math.atan2(m2[1] - m[1], m2[0] - m[0]) * 180) / Math.PI;
      return `<path d="${s.d}" fill="none" stroke="var(--lav)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
        <path transform="translate(${m[0]} ${m[1]}) rotate(${deg})" d="M-7 -9 L6 0 L-7 9 Z" fill="var(--purple)"/>${num}`;
    }).join("");
    return `<svg viewBox="-40 -30 ${L.width + 80} 350">${guides(-40, L.width + 80, true)}${parts}</svg>`;
  }
  function vormen() {
    const s = state.settings;
    body.innerHTML = `
      <p class="muted">Elke letter heeft één vaste schrijfroute. De cijfers geven de volgorde, de pijl de richting. Wijkt de methode van school af? Kies hieronder een variant, of exporteer de bibliotheek, pas hem aan en importeer hem weer.</p>
      ${toggle("leftyBars", s.leftyBars, "Dwarsstreepjes van rechts naar links (linkshandig)", "Voor t, f, A, H en T. Trekken is voor linkshandigen makkelijker dan duwen. Zet uit als school het anders wil.")}
      <h3>Varianten</h3>
      ${Object.entries(VARIANTS).map(([ch, vs]) => `<div class="vrow"><b>${ch}</b>${radio("var_" + ch, s.variants[ch], Object.entries(vs).map(([k, v]) => [k, v.label]))}</div>`).join("")}
      <h3>Eigen schrijfroutes</h3>
      <div class="row">
        <button class="btn-pill ghost exp">Exporteer bibliotheek (JSON)</button>
        <label class="btn-pill ghost">${ICON.upload}<span>Importeer bibliotheek</span><input class="imp" type="file" accept=".json,application/json" hidden></label>
        ${s.customLibrary ? `<button class="btn-pill ghost std">Terug naar standaard</button>` : ""}
      </div>
      ${s.customLibrary ? `<p class="ok">Eigen schrijfroutes actief voor: ${Object.keys(s.customLibrary).join(" ")}</p>` : ""}
      <h3>Alle letters</h3>
      <div class="formgrid">${[...ALPHABET.map((c) => c.toUpperCase()), ...ALPHABET].map((c) => `<div class="form">${preview(c)}</div>`).join("")}</div>`;
    body.querySelectorAll("input[name=leftyBars]").forEach((i) => (i.onchange = () => { s.leftyBars = i.checked; save(); vormen(); }));
    body.querySelectorAll("input[name^=var_]").forEach((i) => (i.onchange = () => { s.variants[i.name.slice(4)] = i.value; save(); vormen(); }));
    body.querySelector(".exp").onclick = () => {
      const lib = {};
      [...ALPHABET.map((c) => c.toUpperCase()), ...ALPHABET].forEach((c) => (lib[c] = strokesFor(c, letterCfg())));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(lib, null, 1)], { type: "application/json" }));
      a.download = "letterbibliotheek-meadow.json";
      a.click();
    };
    body.querySelector(".imp").onchange = async (e) => {
      try {
        const lib = JSON.parse(await e.target.files[0].text());
        const errs = validateLibrary(lib);
        if (errs.length) return alert("Deze bibliotheek klopt niet:\n" + errs.slice(0, 8).join("\n"));
        s.customLibrary = lib; save(); vormen();
      } catch { alert("Dit bestand kon niet gelezen worden."); }
    };
    body.querySelector(".std")?.addEventListener("click", () => { s.customLibrary = null; save(); vormen(); });
  }

  // ------------------------------------------------------------ woorden & foto's
  async function woorden() {
    const keys = new Set(await idb.keys("images"));
    const urls = {};
    for (const k of keys) { const b = await idb.get("images", k); if (b) urls[k] = URL.createObjectURL(b); }
    body.innerHTML = `
      <p class="muted">Pas een woord aan of kies een eigen foto (bijvoorbeeld van oma, of de lamp in huis). Een nieuw woord moet je ook opnieuw inspreken onder dezelfde code.</p>
      <div class="wlist">${ALPHABET.map((c) => `<div class="wl-row"><b class="wl-l">${c.toUpperCase()}${c}</b>${WORDS[c].map(([w, pic], k) => {
        const key = `${c}_${k + 1}`;
        return `<div class="wl-item" data-k="${key}"><div class="wl-pic">${picHTML(pic, urls[key])}</div>
          <input value="${esc(state.settings.words[key] || w)}" aria-label="woord">
          <div class="wl-btn"><label class="ib" aria-label="Foto kiezen">${ICON.upload}<input type="file" accept="image/*" hidden></label>
          ${urls[key] || state.settings.words[key] ? `<button class="ib undo" aria-label="Standaard">${ICON.restart}</button>` : ""}</div>
          <small><code>${c}_woord_${k + 1}</code></small></div>`;
      }).join("")}</div>`).join("")}</div>`;
    body.querySelectorAll(".wl-item").forEach((it) => {
      const key = it.dataset.k, [c, k] = key.split("_");
      it.querySelector("input:not([type])").onchange = (e) => {
        const v = e.target.value.trim();
        if (!v || v === WORDS[c][k - 1][0]) delete state.settings.words[key]; else state.settings.words[key] = v;
        save();
      };
      it.querySelector("input[type=file]").onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        await idb.put("images", key, await shrink(f));
        sync.markFile("foto", key); forgetPhoto(key); woorden();
      };
      it.querySelector(".undo")?.addEventListener("click", async () => {
        await idb.del("images", key); sync.markFile("foto", key); delete state.settings.words[key]; save(); forgetPhoto(key); woorden();
      });
    });
  }
  async function shrink(file) {
    const img = await createImageBitmap(file).catch(() => null);
    if (!img) return file;
    const k = Math.min(1, 600 / Math.max(img.width, img.height));
    const cv = Object.assign(document.createElement("canvas"), { width: img.width * k, height: img.height * k });
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    return new Promise((r) => cv.toBlob((b) => r(b || file), "image/jpeg", 0.85));
  }

  // ------------------------------------------------------------ apparaten (synchroniseren)
  function apparaten() {
    const i = sync.info();
    const when = i.at ? new Date(i.at).toLocaleString("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "nog niet";
    if (!i.kind) {
      body.innerHTML = `<div class="pnote"><h3>Synchroniseren is nog niet ingesteld</h3>
        <p>Alles wordt nu alleen op dit apparaat bewaard. Om voortgang, opnames en foto's op meerdere apparaten te delen,
        volg je de stappen in <b>LEESMIJ.md</b> onder "Meerdere apparaten" (eenmalig, ongeveer 10 minuten).</p></div>`;
      return;
    }
    const via = i.kind === "firebase" ? "via internet (Firebase)" : "via de Mac, alleen thuis op dezelfde wifi";
    if (!i.code) {
      body.innerHTML = `<div class="pnote">
        <h3>Dit apparaat koppelen</h3>
        <p>Met één <b>gezinscode</b> delen al je apparaten dezelfde voortgang, trofeeën, instellingen, opnames en foto's (${via}). Er is geen account nodig.</p>
        <h4>Heb je al een gezinscode op een ander apparaat?</h4>
        <p class="muted">Kijk daar in Ouderhoek › Apparaten en typ hem hier over. Wat al op dit apparaat staat, blijft bewaard en wordt samengevoegd.</p>
        <div class="code-row"><input class="code-in" placeholder="XXXX-XXXX-XXXX" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="16" aria-label="Gezinscode">
        <button class="btn-pill join">Koppelen</button></div>
        <p class="msg muted"></p>
        <h4>Is dit het eerste apparaat?</h4>
        <button class="btn-pill ghost make">Nieuwe gezinscode maken</button></div>`;
      const msg = body.querySelector(".msg");
      const doLink = async (code) => {
        msg.textContent = "Bezig met koppelen…";
        try { await sync.link(code); if (alive && tab === "apparaten") apparaten(); }
        catch (e) { msg.textContent = e.message; }
      };
      body.querySelector(".join").onclick = () => doLink(body.querySelector(".code-in").value);
      body.querySelector(".code-in").onkeydown = (e) => e.key === "Enter" && doLink(e.target.value);
      body.querySelector(".make").onclick = () => doLink(sync.newCode());
      return;
    }
    const link = sync.koppelLink();
    body.innerHTML = `<div class="pnote">
      <h3>Gekoppeld ${i.busy ? "· bezig…" : i.error ? "· even niet gelukt" : "✓"}</h3>
      <p>Gezinscode:</p><p class="bigcode">${sync.prettyCode(i.code)}</p>
      <p class="muted">Typ deze code op een ander apparaat in Ouderhoek › Apparaten. Bewaar hem ook ergens veilig; met de code kan iemand de voortgang en opnames bekijken.</p>
      <p>Laatst bijgewerkt: <b>${when}</b> (${via})${i.pending ? ` · nog ${i.pending} te versturen` : ""}</p>
      ${i.error ? `<p class="muted">Niet gelukt: ${esc(i.error)}. De app probeert het vanzelf opnieuw; alles blijft op dit apparaat bewaard.</p>` : ""}
      ${i.skipped.length ? `<p class="muted">Te groot om te delen (opnieuw kort inspreken helpt): ${i.skipped.map(esc).join(", ")}</p>` : ""}
      <div class="code-row"><button class="btn-pill now">Nu bijwerken</button>
      ${navigator.share ? `<button class="btn-pill ghost share">Koppel-link delen</button>` : `<button class="btn-pill ghost copy">Koppel-link kopiëren</button>`}</div>
      <p class="muted small">De koppel-link opent de app en koppelt meteen. Op een iPad werkt dat in Safari; gebruik je de app vanaf het beginscherm, typ de code dan daar in.</p>
      <div class="danger"><button class="btn-pill ghost off">Dit apparaat ontkoppelen</button></div></div>`;
    body.querySelector(".now").onclick = () => sync.syncNow();
    body.querySelector(".share")?.addEventListener("click", () => navigator.share({ title: "Letterwereld koppelen", url: link }).catch(() => {}));
    body.querySelector(".copy")?.addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(link); e.target.textContent = "Gekopieerd ✓"; } catch { prompt("Kopieer deze link:", link); }
    });
    body.querySelector(".off").onclick = () => {
      if (confirm("Dit apparaat ontkoppelen? Alles blijft op dit apparaat staan, maar wordt niet meer gedeeld.")) { sync.unlink(); apparaten(); }
    };
  }

  render();
  return { destroy() { stopRec(); alive = false; offSync(); window.removeEventListener("meadow:voortgang", onRemote); } };
}
