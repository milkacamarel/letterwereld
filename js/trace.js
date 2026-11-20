// De magische schrijfplek: voordoen met een vingertje, zelf overtrekken met echte routecontrole.
// Linkshandig: het hele tekenvlak is vrij; alle knoppen staan rechts, buiten de linkerhand.
import { Tracer, TOLERANCES, pointAt, tangentAt } from "./engine.js";
import { getLetter, guides, glyphSVG } from "./glyph.js";
import { state, save, letterStats } from "./store.js";
import * as audio from "./audio.js";
import { ICON, DEMO_HAND, mascot, sparkle } from "./art.js";

export const LEVELS = [
  { icon: "wand", name: "Magisch volgen", voice: "niveau_1" },
  { icon: "hand", name: "Zelf proberen", voice: "niveau_2" },
  { icon: "crown", name: "Letterkampioen", voice: "niveau_3" },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const DEMO_SPEED = 160; // eenheden per seconde: rustig genoeg om te volgen

export function mountTrace(root, opts) {
  const { ch, onDone, onExit, onLevel } = opts;
  const level = opts.level;
  const L = getLetter(ch);
  const n = L.strokes.length;
  const tracer = new Tracer(L, TOLERANCES[state.settings.sensitivity] || TOLERANCES.gebalanceerd);
  // Zo groot mogelijk: de kelder alleen tonen als de letter daar komt (g, j, p, q, y).
  const vbTop = -45, vbH = (L.maxY > 215 ? 345 : 250) - vbTop;
  // Telefoon rechtop (smal en hoog): minder ruimte opzij, zodat de letter de breedte vult.
  const tall = innerHeight > innerWidth * 1.4;
  const vbW = Math.max(L.width + (tall ? 64 : 120), tall ? 170 : 250);
  const vbX = L.width / 2 - vbW / 2;

  root.innerHTML = `
  <div class="screen trace-screen lvl-${level}">
    <div class="canvas-wrap">
      <svg class="canvas" viewBox="${vbX} ${vbTop} ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet">
        ${guides()}
        <g class="track"></g><g class="dots"></g><g class="ink-done"></g>
        <path class="ink-cur" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="demo-ink" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <g class="demo-done"></g>
        <g class="arrows"></g><g class="sparks"></g><g class="startdot"></g>
        <circle class="touch-glow" r="22" cx="-999" cy="-999"/>
        <g class="hand" opacity="0">${DEMO_HAND}</g>
      </svg>
    </div>
    <aside class="side">
      <button class="btn-round home" aria-label="Terug">${ICON.back}</button>
      <div class="side-mascot">${mascot()}<div class="bubble"></div></div>
      <div class="model" aria-label="voorbeeld">${glyphSVG([ch], { width: 24, lines: true })}</div>
      <div class="pips">${L.strokes.map((_, i) => `<span class="pip" data-i="${i}"></span>`).join("")}</div>
      <div class="side-btns">
        <button class="btn-side hear" aria-label="Hoor het nog eens">${ICON.speaker}</button>
        <button class="btn-side demo" aria-label="Doe het voor">${ICON.hand}</button>
        <button class="btn-side again" aria-label="Opnieuw beginnen">${ICON.restart}</button>
      </div>
      <div class="levels">${LEVELS.map((l, i) =>
        `<button class="lvl ${i + 1 === level ? "on" : ""}" data-l="${i + 1}" aria-label="${l.name}">${ICON[l.icon]}</button>`).join("")}</div>
    </aside>
  </div>`;

  const $ = (s) => root.querySelector(s);
  const svg = $(".canvas"), inkCur = $(".ink-cur"), demoInk = $(".demo-ink"), hand = $(".hand");
  const NS = "http://www.w3.org/2000/svg";
  const make = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.appendChild(e); return e; };

  // ---- statische lagen
  L.strokes.forEach((s, i) => {
    if (s.type === "dot") {
      make("circle", { cx: s.start[0], cy: s.start[1], r: 20, class: "track-dot", "data-i": i }, $(".track"));
      make("circle", { cx: s.start[0], cy: s.start[1], r: 14, class: "dot-target", "data-i": i }, $(".dots"));
    } else {
      make("path", { d: s.d, class: "track-path", "data-i": i }, $(".track"));
      make("path", { d: s.d, class: "dot-path", "data-i": i }, $(".dots"));
    }
  });

  let phase = "ready", destroyed = false, demoToken = 0, idleTimer = null, idleCount = 0;
  let activePointer = null, curPts = [], lastHelp = 0, offToggle = 0;
  const errs = new Array(n).fill(0), hinted = new Array(n).fill(false), forced = new Array(n).fill(false);
  const drawing = [];
  const stats = letterStats(ch);
  let counted = false;

  // ---- tekenen van de toestand
  function renderStroke() {
    const i = tracer.idx, s = L.strokes[i];
    root.querySelectorAll(".pip").forEach((p, k) => p.classList.toggle("on", k < i));
    root.querySelectorAll(".dot-path, .track-path, .dot-target, .track-dot").forEach((p) =>
      p.classList.toggle("current", +p.dataset.i === i));
    inkCur.setAttribute("d", s && s.type !== "dot" ? s.d : "");
    setInk(0);
    drawStart();
    drawArrows();
  }
  function setInk(progress) { inkCur.style.strokeDasharray = `${progress} 99999`; }
  function drawStart() {
    const g = $(".startdot");
    g.innerHTML = "";
    const s = L.strokes[tracer.idx];
    if (!s || phase === "done") return;
    const [x, y] = s.start;
    g.innerHTML = `<g class="start" transform="translate(${x} ${y})"><circle class="halo" r="38"/><circle class="dot" r="25"/>
      ${n > 1 ? `<text y="9" text-anchor="middle">${tracer.idx + 1}</text>` : `<circle r="7" fill="#fff"/>`}</g>`;
  }
  function arrowsVisible(i) { return level === 1 || forced[i]; }
  function drawArrows() {
    const g = $(".arrows");
    g.innerHTML = "";
    if (phase === "done") return;
    L.strokes.forEach((s, i) => {
      const cur = i === tracer.idx;   // alleen pijltjes bij de lijn die nu aan de beurt is: rustiger
      if (s.type === "dot" || !cur || !arrowsVisible(i)) return;
      const count = Math.max(1, Math.floor((s.len - 40) / 64));
      for (let k = 0; k < count; k++) {
        const at = count === 1 ? s.len * 0.55 : 34 + k * ((s.len - 60) / (count - 1 || 1));
        const [x, y] = pointAt(s, at), [dx, dy] = tangentAt(s, at);
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        g.insertAdjacentHTML("beforeend", `<g class="arrow ${cur ? "cur" : ""}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(0)})">
          <circle r="13"/><path d="M-4 -6.5 L4.5 0 L-4 6.5"/></g>`);
      }
    });
  }
  function drawSparks(progress) {
    const g = $(".sparks");
    const s = L.strokes[tracer.idx];
    if (!s || s.type === "dot" || level === 3 && !forced[tracer.idx] || phase !== "drawing") { g.innerHTML = ""; return; }
    g.innerHTML = [24, 48, 72].map((d, k) => {
      if (progress + d > s.len) return "";
      const [x, y] = pointAt(s, progress + d);
      return `<g class="spark s${k}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${sparkle(0, 0, 11 - k * 2)}</g>`;
    }).join("");
  }
  function addDoneInk(i) {
    const s = L.strokes[i];
    if (s.type === "dot") make("circle", { cx: s.start[0], cy: s.start[1], r: 17, class: "ink-dot" }, $(".ink-done"));
    else make("path", { d: s.d, class: "ink-solid" }, $(".ink-done"));
  }

  // ---- demo-vingertje
  function placeHand([x, y], lifted, opacity = 1) {
    hand.setAttribute("transform", `translate(${x} ${y - (lifted ? 16 : 0)}) scale(${lifted ? 1.12 : 1})`);
    hand.setAttribute("opacity", opacity);
  }
  function animate(ms, fn, tok) {
    return new Promise((res) => {
      const t0 = performance.now();
      const frame = (t) => {
        if (tok !== demoToken || destroyed) return res(false);
        const k = Math.min(1, (t - t0) / ms);
        fn(k);
        k < 1 ? requestAnimationFrame(frame) : res(true);
      };
      requestAnimationFrame(frame);
    });
  }
  async function demo(from = tracer.idx, only = null) {
    const tok = ++demoToken;
    phase = phase === "done" ? "done" : "demo";
    demoInk.setAttribute("d", "");
    $(".demo-done").innerHTML = "";
    const list = only != null ? [only] : [...Array(n).keys()].slice(from);
    for (const i of list) {
      const s = L.strokes[i];
      placeHand(s.start, true, 0);
      if (!(await animate(260, (k) => placeHand(s.start, true, k), tok))) return false;
      if (!(await animate(200, (k) => placeHand(s.start, k < 1, 1), tok))) return false;
      if (s.type === "dot") {
        make("circle", { cx: s.start[0], cy: s.start[1], r: 16, class: "demo-dot" }, $(".demo-done"));
        await wait(350);
      } else {
        demoInk.setAttribute("d", s.d);
        const ok = await animate((s.len / DEMO_SPEED) * 1000, (k) => {
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          demoInk.style.strokeDasharray = `${s.len * e} 99999`;
          placeHand(pointAt(s, s.len * e), false, 1);
        }, tok);
        if (!ok) return false;
        make("path", { d: s.d, class: "demo-solid" }, $(".demo-done"));
        demoInk.setAttribute("d", "");
      }
      if (!(await animate(260, (k) => placeHand(s.end, true, 1), tok))) return false;
      await wait(220);
    }
    await animate(300, (k) => hand.setAttribute("opacity", 1 - k), tok);
    await wait(350);
    if (tok !== demoToken) return false;
    $(".demo-done").innerHTML = "";
    if (phase === "demo") phase = "ready";
    return true;
  }
  function cancelDemo() {
    demoToken++;
    hand.setAttribute("opacity", 0);
    demoInk.setAttribute("d", "");
    $(".demo-done").innerHTML = "";
    if (phase === "demo") phase = "ready";
  }
  async function liftHint(at) {
    const tok = ++demoToken;
    await animate(500, (k) => placeHand([at[0], at[1] - k * 30], true, 1 - k * 0.6), tok);
    hand.setAttribute("opacity", 0);
  }

  // ---- gesproken hulp (niet te vaak)
  function help(id, { force = false } = {}) {
    const now = Date.now();
    if (!force && now - lastHelp < 1400) return;
    lastHelp = now;
    audio.say(id);
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    if (phase !== "ready" || idleCount >= 2) return;
    idleTimer = setTimeout(() => {
      if (phase !== "ready" || destroyed) return;
      idleCount++;
      if (level >= 2) { forced[tracer.idx] = true; drawArrows(); }
      $(".startdot .start")?.classList.add("call");
      audio.sayIfIdle("roze_stip");
      resetIdle();
    }, 8000);
  }

  function onError(e) {
    const i = tracer.idx;
    errs[i]++;
    stats.errors++;
    phase = "ready";
    setInk(0);
    curPts = [];
    drawSparks(0);
    if (level >= 2 && errs[i] >= (level === 2 ? 1 : 2)) forced[i] = true;
    drawArrows();
    $(".startdot .start")?.classList.add("call");
    if (errs[i] >= 3 && errs[i] % 3 === 0) {
      forced[i] = true;
      drawArrows();
      audio.say("nog_eens_voordoen").then(() => !destroyed && demo(i, i));
      return;
    }
    const voice = { "off-path": (offToggle++ % 2 ? "bijna_stip" : "dicht_bij_lijn"), reverse: "andere_kant",
      "lift-early": "vinger_weg", "wrong-order": "eerst_dit_stipje", "not-at-start": "begin_stipje", miss: "begin_stipje" }[e.type];
    help(voice, { force: e.type === "reverse" || e.type === "off-path" });
  }

  function handle(evs, p) {
    for (const e of evs) {
      switch (e.type) {
        case "start":
          phase = "drawing";
          clearTimeout(idleTimer);
          if (!counted) { counted = true; stats.attempts++; stats.last = Date.now(); save(); }
          curPts = [p];
          $(".startdot").innerHTML = "";
          drawSparks(0);
          if (errs[e.stroke] > 0 && !hinted[e.stroke]) { hinted[e.stroke] = true; audio.sayIfIdle(pick(["inzet_1", "inzet_3", "inzet_4"])); }
          else if (level === 1 && !hinted[e.stroke]) { hinted[e.stroke] = true; audio.sayIfIdle(e.stroke === 0 ? "volg_sterretjes" : L.strokes[e.stroke].hint); }
          break;
        case "progress":
          setInk(e.progress);
          drawSparks(e.progress);
          break;
        case "tap-start":
          phase = "ready";
          forced[e.stroke] = level < 3 || forced[e.stroke];
          drawArrows();
          drawStart();
          audio.sayIfIdle("volg_sterretjes");
          break;
        case "stroke-done": {
          const s = L.strokes[e.stroke];
          drawing[e.stroke] = s.type === "dot" ? [p.map(Math.round)] : curPts.map((q) => q.map(Math.round));
          addDoneInk(e.stroke);
          audio.chime("stroke");
          if (errs[e.stroke] > 0) audio.sayIfIdle(pick(["inzet_7", "inzet_2", "inzet_5"]));
          if (tracer.done) break;
          renderStroke();
          if (tracer.awaitLift) {
            phase = "lift";
            $(".startdot").innerHTML = "";
            liftHint(s.end);
            if (level === 1) audio.say("til_op", { interrupt: false });
          } else nextStroke();
          break;
        }
        case "lifted":
          nextStroke();
          break;
        case "letter-done":
          finish();
          break;
        case "far":
          break;
        default:
          onError(e);
      }
    }
  }
  function nextStroke() {
    phase = "ready";
    drawStart();
    drawArrows();
    const left = n - tracer.idx;
    if (level < 3) audio.say(left === 1 ? "nog_een_lijn" : "volgende_stip", { interrupt: false });
    resetIdle();
  }
  function finish() {
    phase = "done";
    clearTimeout(idleTimer);
    root.querySelector(".pips").querySelectorAll(".pip").forEach((p) => p.classList.add("on"));
    $(".startdot").innerHTML = ""; $(".arrows").innerHTML = ""; $(".sparks").innerHTML = "";
    inkCur.setAttribute("d", "");
    svg.classList.add("glow");
    audio.chime("letter");
    stats.successes++;
    stats.levels[level - 1]++;
    stats.last = Date.now();
    stats.drawing = drawing;
    save();
    setTimeout(() => !destroyed && onDone({ level, drawing }), 1300);
  }

  // ---- aanraken (Pointer Events, één vinger tegelijk, grote vlakken = handpalm → negeren)
  function toUnits(ev) {
    const m = svg.getScreenCTM();
    const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    return [pt.x, pt.y];
  }
  const glow = $(".touch-glow");
  svg.addEventListener("pointerdown", (ev) => {
    if (destroyed || phase === "done") return;
    if (activePointer !== null) return;
    if (ev.pointerType === "touch" && (ev.width > 80 || ev.height > 80)) return;
    ev.preventDefault();
    if (phase === "demo") cancelDemo();
    activePointer = ev.pointerId;
    try { svg.setPointerCapture(ev.pointerId); } catch {}
    tracer.setPxPerUnit(svg.getScreenCTM().a);
    const p = toUnits(ev);
    glow.setAttribute("cx", p[0]); glow.setAttribute("cy", p[1]); glow.classList.add("on");
    handle(tracer.down(p[0], p[1]), p);
  });
  svg.addEventListener("pointermove", (ev) => {
    if (ev.pointerId !== activePointer) return;
    const list = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev];
    for (const ce of list.length ? list : [ev]) {
      const p = toUnits(ce);
      glow.setAttribute("cx", p[0]); glow.setAttribute("cy", p[1]);
      if (!tracer.active) continue;
      const last = curPts[curPts.length - 1];
      if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 4) curPts.push(p);
      handle(tracer.move(p[0], p[1]), p);
    }
  });
  const end = (ev) => {
    if (ev.pointerId !== activePointer) return;
    activePointer = null;
    glow.classList.remove("on");
    if (phase === "done") return;
    handle(tracer.up(), toUnits(ev));
    if (phase === "ready") resetIdle();
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
  svg.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---- knoppen (rechts)
  $(".home").onclick = () => { destroy(); onExit(); };
  $(".hear").onclick = () => {
    const s = L.strokes[tracer.idx];
    audio.say(s ? ["roze_stip", s.hint] : ["roze_stip"]);
  };
  $(".demo").onclick = () => { audio.say("voordoen"); demo(tracer.idx); };
  $(".again").onclick = () => {
    cancelDemo();
    tracer.restart();
    $(".ink-done").innerHTML = "";
    errs.fill(0); hinted.fill(false); forced.fill(false); drawing.length = 0; curPts = [];
    svg.classList.remove("glow");
    phase = "ready";
    renderStroke();
    audio.say("opnieuw");
    resetIdle();
  };
  root.querySelectorAll(".lvl").forEach((b) => (b.onclick = () => {
    const l = +b.dataset.l;
    if (l === level) return;
    destroy();
    onLevel(l);
  }));

  // ---- start: eerst voordoen, dan zelf
  renderStroke();
  (async () => {
    if (level === 1 && opts.introDemo !== false && state.settings.autoDemo) {
      await audio.say("voordoen");
      if (destroyed) return;
      const ok = await demo(0);
      if (!ok || destroyed) return;
      audio.say(["nu_jij", "roze_stip"]);
    } else if (opts.levelChanged) {
      audio.say([LEVELS[level - 1].voice, "roze_stip"]);
    } else {
      audio.say(level === 3 ? "weet_je_nog" : "roze_stip");
    }
    resetIdle();
  })();

  function destroy() {
    destroyed = true;
    demoToken++;
    clearTimeout(idleTimer);
  }
  return { destroy };
}
