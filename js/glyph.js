// Letters tekenen als SVG (altijd uit de letterbibliotheek, nooit uit een lettertype).
import { buildLetter } from "./engine.js";
import { state } from "./store.js";

export const letterCfg = () => ({
  leftyBars: state.settings.leftyBars,
  variants: state.settings.variants,
  customLibrary: state.settings.customLibrary,
});
export const getLetter = (ch) => buildLetter(ch, letterCfg());

/** Vierlijnensysteem (zolder, huis, kelder) over een breed vlak. */
export function guides(x0 = -3000, w = 6000, faint = false) {
  const o = faint ? 0.55 : 1;
  return `<g class="guides" opacity="${o}">
    <rect x="${x0}" y="0" width="${w}" height="100" fill="var(--zone-top)"/>
    <rect x="${x0}" y="100" width="${w}" height="100" fill="var(--zone-mid)"/>
    <rect x="${x0}" y="200" width="${w}" height="100" fill="var(--zone-low)"/>
    <line x1="${x0}" x2="${x0 + w}" y1="0" y2="0" stroke="var(--line-top)" stroke-width="3"/>
    <line x1="${x0}" x2="${x0 + w}" y1="100" y2="100" stroke="var(--line-mid)" stroke-width="3" stroke-dasharray="14 10"/>
    <line x1="${x0}" x2="${x0 + w}" y1="200" y2="200" stroke="var(--line-base)" stroke-width="5"/>
    <line x1="${x0}" x2="${x0 + w}" y1="300" y2="300" stroke="var(--line-top)" stroke-width="3"/></g>`;
}

/** Een of meer letters naast elkaar, als doorgetrokken lijn. */
export function glyphSVG(chars, { color = "var(--pink)", width = 22, lines = false, gap = 50, cls = "" } = {}) {
  let x = 0, body = "";
  for (const ch of chars) {
    const L = getLetter(ch);
    for (const s of L.strokes) {
      body += s.type === "dot"
        ? `<circle cx="${s.start[0] + x}" cy="${s.start[1]}" r="${width * 0.7}" fill="${color}"/>`
        : `<path d="${s.d}" transform="translate(${x} 0)" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    x += Math.max(L.width, 20) + gap;
  }
  const w = x - gap;
  return `<svg class="glyph ${cls}" viewBox="${-30} -25 ${w + 60} 350" aria-label="${chars.join("")}">
    ${lines ? guides(-30, w + 60, true) : ""}${body}</svg>`;
}

/** Wat Meadow zelf schreef (opgeslagen vingerlijnen). */
export function drawingSVG(drawing, ch, { color = "var(--pink)" } = {}) {
  const L = getLetter(ch);
  const paths = (drawing || []).map((pts) => pts.length === 1
    ? `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="15" fill="${color}"/>`
    : `<path d="M${pts.map((p) => p.join(" ")).join(" L")}" fill="none" stroke="${color}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  return `<svg class="glyph" viewBox="-40 -25 ${Math.max(L.width, 20) + 80} 350">${guides(-40, L.width + 80, true)}${paths}</svg>`;
}
