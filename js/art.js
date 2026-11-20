// Alle tekeningen als SVG: hulpdiertje, trofeeën, eigen woordplaatjes, iconen en de demo-hand.
let uid = 0;
const id = (p) => `${p}${++uid}`;

// ------------------------------------------------------------------ hulpdiertje: eenhoorn Lila
export function mascot(cls = "") {
  const g = id("horn"), m = id("mane");
  return `<svg class="mascot ${cls}" viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <linearGradient id="${g}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F5C35A"/><stop offset="1" stop-color="#FFE9A8"/></linearGradient>
    <linearGradient id="${m}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F48FC4"/><stop offset="1" stop-color="#B07BEA"/></linearGradient>
  </defs>
  <g class="m-body">
    <ellipse cx="100" cy="186" rx="52" ry="8" fill="#B07BEA" opacity=".15"/>
    <g fill="url(#${m})">
      <circle cx="58" cy="78" r="20"/><circle cx="45" cy="104" r="18"/><circle cx="44" cy="132" r="16"/>
      <circle cx="54" cy="156" r="14"/><circle cx="76" cy="62" r="17"/>
    </g>
    <path d="M70 70 Q100 40 140 62 Q172 82 165 128 Q160 168 118 172 Q80 174 70 140 Z" fill="#FFF9FD" stroke="#EBCBF2" stroke-width="3"/>
    <path d="M86 58 L74 26 L104 50 Z" fill="#FFF9FD" stroke="#EBCBF2" stroke-width="3" stroke-linejoin="round"/>
    <path d="M86 52 L79 36 L96 49 Z" fill="#F9C6E0"/>
    <path class="m-horn" d="M112 56 L136 8 L128 62 Z" fill="url(#${g})" stroke="#E2A93B" stroke-width="2" stroke-linejoin="round"/>
    <path d="M117 47 L131 43 M121 37 L133 33 M125 27 L135 23" stroke="#E2A93B" stroke-width="2.5" stroke-linecap="round"/>
    <g fill="url(#${m})"><circle cx="98" cy="54" r="12"/><circle cx="80" cy="66" r="11"/></g>
    <ellipse class="m-snout" cx="132" cy="142" rx="34" ry="24" fill="#FDE3F1"/>
    <ellipse cx="122" cy="139" rx="3.5" ry="2.5" fill="#D58DB8"/><ellipse cx="144" cy="139" rx="3.5" ry="2.5" fill="#D58DB8"/>
    <path class="m-mouth" d="M120 152 Q132 162 145 152" stroke="#B0569A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <g class="m-eyes-open">
      <ellipse cx="108" cy="104" rx="9" ry="12" fill="#4A2C6E"/><ellipse cx="152" cy="104" rx="9" ry="12" fill="#4A2C6E"/>
      <circle cx="111" cy="99" r="3.5" fill="#fff"/><circle cx="155" cy="99" r="3.5" fill="#fff"/>
    </g>
    <g class="m-eyes-happy" stroke="#4A2C6E" stroke-width="4" fill="none" stroke-linecap="round">
      <path d="M99 106 Q108 95 117 106"/><path d="M143 106 Q152 95 161 106"/>
    </g>
    <circle cx="96" cy="128" r="9" fill="#F7A8D0" opacity=".55"/><circle cx="166" cy="124" r="8" fill="#F7A8D0" opacity=".55"/>
  </g>
  <g class="m-sparkles" fill="#F5C35A">
    <path d="M30 30 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z"/><path d="M178 50 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z"/>
    <path d="M176 160 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z"/>
  </g></svg>`;
}

// ------------------------------------------------------------------ trofeeën
const pedestal = (top, bottom, label = "") => `
  <path d="M30 112 h60 l6 18 h-72 z" fill="${top}"/><rect x="20" y="128" width="80" height="10" rx="4" fill="${bottom}"/>
  ${label ? `<text x="60" y="125" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="Futura, sans-serif">${label}</text>` : ""}`;

export const TROPHIES = [
  { id: "ster", need: { distinct: 1 }, title: "Roze ster", how: "Schrijf je eerste letter.", voice: "trofee_ster", hint: "hoe_ster",
    svg: () => { const g = id("s"); return `<svg viewBox="0 0 120 140"><defs><radialGradient id="${g}" cx=".4" cy=".35"><stop offset="0" stop-color="#FFD1EA"/><stop offset="1" stop-color="#E0479E"/></radialGradient></defs>
      ${pedestal("#C99BEA", "#9A6BD0")}
      <path d="M60 12 L72 42 L104 44 L79 64 L88 96 L60 78 L32 96 L41 64 L16 44 L48 42 Z" fill="url(#${g})" stroke="#C22E83" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="51" cy="56" r="3.5" fill="#4A2C6E"/><circle cx="69" cy="56" r="3.5" fill="#4A2C6E"/>
      <path d="M52 66 Q60 73 68 66" stroke="#4A2C6E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M44 34 L50 26" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`; } },
  { id: "vlinder", need: { distinct: 3 }, title: "Bronzen vlinder", how: "Schrijf drie verschillende letters.", voice: "trofee_vlinder", hint: "hoe_vlinder",
    svg: () => { const g = id("b"); return `<svg viewBox="0 0 120 140"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2C18D"/><stop offset=".5" stop-color="#C9854A"/><stop offset="1" stop-color="#8E5A2B"/></linearGradient></defs>
      ${pedestal("#C9854A", "#8E5A2B")}
      <g fill="url(#${g})" stroke="#7A4A20" stroke-width="2"><ellipse cx="38" cy="44" rx="24" ry="28" transform="rotate(-20 38 44)"/><ellipse cx="82" cy="44" rx="24" ry="28" transform="rotate(20 82 44)"/>
      <ellipse cx="42" cy="84" rx="16" ry="18" transform="rotate(20 42 84)"/><ellipse cx="78" cy="84" rx="16" ry="18" transform="rotate(-20 78 84)"/></g>
      <g fill="#FCE3C6" opacity=".8"><circle cx="36" cy="42" r="8"/><circle cx="84" cy="42" r="8"/><circle cx="43" cy="84" r="5"/><circle cx="77" cy="84" r="5"/></g>
      <rect x="55" y="34" width="10" height="66" rx="5" fill="#6B4020"/>
      <path d="M58 36 Q50 18 44 16 M62 36 Q70 18 76 16" stroke="#6B4020" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`; } },
  { id: "eenhoorn", need: { distinct: 5 }, title: "Zilveren eenhoorn", how: "Schrijf vijf verschillende letters.", voice: "trofee_eenhoorn", hint: "hoe_eenhoorn",
    svg: () => { const g = id("u"); return `<svg viewBox="0 0 120 140"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#C9CFDA"/><stop offset="1" stop-color="#8D96A8"/></linearGradient></defs>
      ${pedestal("#B5BDCB", "#7E8799")}
      <g fill="#A7AFBF"><circle cx="32" cy="46" r="13"/><circle cx="27" cy="66" r="12"/><circle cx="30" cy="86" r="11"/><circle cx="44" cy="34" r="11"/></g>
      <path d="M40 40 Q62 22 84 36 Q102 50 98 78 Q94 104 70 106 Q46 106 40 84 Z" fill="url(#${g})" stroke="#7E8799" stroke-width="2.5"/>
      <path d="M66 32 L80 4 L76 36 Z" fill="#E9EDF3" stroke="#7E8799" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 36 L44 16 L60 30 Z" fill="url(#${g})" stroke="#7E8799" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="78" cy="88" rx="20" ry="14" fill="#E3E7EE"/>
      <ellipse cx="64" cy="64" rx="5" ry="7" fill="#4A4F5C"/><ellipse cx="90" cy="64" rx="5" ry="7" fill="#4A4F5C"/>
      <circle cx="66" cy="61" r="2" fill="#fff"/><circle cx="92" cy="61" r="2" fill="#fff"/>
      <path d="M70 94 Q78 100 86 94" stroke="#4A4F5C" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`; } },
  { id: "regenboog", need: { distinct: 10 }, title: "Gouden regenboog", how: "Schrijf tien verschillende letters.", voice: "trofee_regenboog", hint: "hoe_regenboog",
    svg: () => `<svg viewBox="0 0 120 140">${pedestal("#E9B949", "#B8860B")}
      <g fill="none" stroke-linecap="round"><path d="M14 96 A46 46 0 0 1 106 96" stroke="#F9DC7A" stroke-width="12"/>
      <path d="M26 96 A34 34 0 0 1 94 96" stroke="#E9B949" stroke-width="12"/><path d="M38 96 A22 22 0 0 1 82 96" stroke="#C9971F" stroke-width="12"/></g>
      <g fill="#FFFFFF" stroke="#E7D6F7" stroke-width="2"><path d="M4 104 q0-12 12-12 q4-8 13-5 q9 1 9 11 q6 1 6 6 z"/><path d="M76 104 q0-12 12-12 q4-8 13-5 q9 1 9 11 q6 1 6 6 z"/></g>
      <path d="M60 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFF3C4"/></svg>` },
  { id: "kroon", need: { allLower: true }, title: "Diamanten alfabetkroon", how: "Schrijf alle 26 kleine letters.", voice: "trofee_kroon", hint: "hoe_kroon",
    svg: () => { const g = id("k"), d = id("d"); return `<svg viewBox="0 0 120 140"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset="1" stop-color="#D4A017"/></linearGradient>
      <linearGradient id="${d}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#BFE8FF"/><stop offset="1" stop-color="#E7B8FF"/></linearGradient></defs>
      ${pedestal("#C99BEA", "#9A6BD0")}
      <path d="M16 92 L12 38 L38 62 L60 24 L82 62 L108 38 L104 92 Z" fill="url(#${g})" stroke="#B8860B" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="16" y="88" width="88" height="14" rx="4" fill="#E9B949" stroke="#B8860B" stroke-width="2"/>
      <g fill="url(#${d})" stroke="#8FB8D8" stroke-width="1.5"><path d="M60 50 l9 12 -9 12 -9 -12z"/><path d="M33 70 l7 9 -7 9 -7 -9z"/><path d="M87 70 l7 9 -7 9 -7 -9z"/></g>
      <g fill="#F48FC4"><circle cx="12" cy="36" r="5"/><circle cx="60" cy="22" r="6"/><circle cx="108" cy="36" r="5"/></g></svg>`; } },
  { id: "beker", need: { allUpper: true }, title: "Magische letterkampioenbeker", how: "Schrijf alle 26 hoofdletters.", voice: "trofee_beker", hint: "hoe_beker",
    svg: () => { const g = id("c"); return `<svg viewBox="0 0 120 140"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D4A017"/><stop offset=".45" stop-color="#FFE9A8"/><stop offset="1" stop-color="#C9971F"/></linearGradient></defs>
      ${pedestal("#B07BEA", "#7B4FD8", "KAMPIOEN")}
      <path d="M30 14 h60 v22 q0 34 -30 40 q-30 -6 -30 -40 z" fill="url(#${g})" stroke="#B8860B" stroke-width="2.5"/>
      <path d="M30 22 q-18 0 -16 16 q2 14 20 18 M90 22 q18 0 16 16 q-2 14 -20 18" stroke="#D4A017" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="54" y="76" width="12" height="20" fill="#D4A017"/><rect x="40" y="94" width="40" height="10" rx="3" fill="#E9B949" stroke="#B8860B" stroke-width="2"/>
      <text x="60" y="46" text-anchor="middle" font-size="16" font-weight="700" fill="#B0569A" font-family="Futura, sans-serif">ABC</text>
      <path d="M60 52 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5z" fill="#fff"/></svg>`; } },
];

// ------------------------------------------------------------------ eigen woordplaatjes
export const PICS = {
  fles: `<svg viewBox="0 0 100 100"><rect x="40" y="6" width="20" height="12" rx="3" fill="#E0479E"/>
    <path d="M42 18 h16 v10 q14 8 14 24 v38 q0 6 -6 6 h-32 q-6 0 -6 -6 v-38 q0 -16 14 -24 z" fill="#DDF1FF" stroke="#7FB6E0" stroke-width="3"/>
    <path d="M31 56 h38 v34 q0 3 -3 3 h-32 q-3 0 -3 -3 z" fill="#8CCBF2"/><path d="M36 40 q2 -6 8 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  gieter: `<svg viewBox="0 0 100 100"><path d="M24 40 h44 v40 q0 6 -6 6 h-32 q-6 0 -6 -6 z" fill="#5CC6B8" stroke="#2E9C8E" stroke-width="3"/>
    <path d="M30 40 q16 -26 32 0" stroke="#2E9C8E" stroke-width="6" fill="none"/><path d="M68 50 L90 30" stroke="#2E9C8E" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="91" cy="28" rx="7" ry="4" transform="rotate(-40 91 28)" fill="#2E9C8E"/>
    <g fill="#8CCBF2"><path d="M86 42 q3 5 0 7 q-3 -2 0 -7z"/><path d="M94 46 q3 5 0 7 q-3 -2 0 -7z"/><path d="M88 56 q3 5 0 7 q-3 -2 0 -7z"/></g>
    <path d="M28 52 h40" stroke="#fff" stroke-width="3" opacity=".5"/></svg>`,
  iglo: `<svg viewBox="0 0 100 100"><rect x="0" y="80" width="100" height="20" fill="#EAF6FF"/>
    <path d="M10 82 A40 40 0 0 1 90 82 Z" fill="#F7FBFF" stroke="#9CC9EA" stroke-width="3"/>
    <g stroke="#B8DAF2" stroke-width="2" fill="none"><path d="M14 66 H86 M22 52 H78 M34 40 H66"/><path d="M30 82 V66 M50 66 V52 M70 82 V66 M40 52 V40 M62 52 V40 M50 40 V30"/></g>
    <path d="M38 82 V70 A12 12 0 0 1 62 70 V82 Z" fill="#5B7FA6"/></svg>`,
  lamp: `<svg viewBox="0 0 100 100"><g stroke="#F5C35A" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M50 60 L50 72"/><path d="M30 58 L22 66"/><path d="M70 58 L78 66"/></g>
    <path d="M30 14 h40 l14 38 h-68 z" fill="#F48FC4" stroke="#C22E83" stroke-width="3" stroke-linejoin="round"/>
    <rect x="46" y="52" width="8" height="30" fill="#8E5CC9"/><ellipse cx="50" cy="86" rx="22" ry="7" fill="#8E5CC9"/>
    <path d="M36 22 h10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>`,
  luchtballon: `<svg viewBox="0 0 100 100"><path d="M50 4 C20 4 12 30 20 46 C26 58 40 66 44 72 H56 C60 66 74 58 80 46 C88 30 80 4 50 4Z" fill="#F48FC4"/>
    <path d="M50 4 C38 4 32 30 36 46 C38 58 44 66 46 72 H54 C56 66 62 58 64 46 C68 30 62 4 50 4Z" fill="#FFE07A"/>
    <path d="M50 4 C46 10 45 40 48 72 H52 C55 40 54 10 50 4Z" fill="#B07BEA"/>
    <path d="M44 72 L42 84 M56 72 L58 84" stroke="#8E5A2B" stroke-width="2"/><rect x="40" y="82" width="20" height="14" rx="3" fill="#C9854A" stroke="#8E5A2B" stroke-width="2"/></svg>`,
  quad: `<svg viewBox="0 0 100 100"><path d="M18 56 L30 40 H62 L72 52 H86 L90 62 H14 Z" fill="#E0479E" stroke="#A3226A" stroke-width="3" stroke-linejoin="round"/>
    <path d="M36 40 Q44 30 56 34" stroke="#4A2C6E" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M66 42 L72 28 L80 26" stroke="#4A4F5C" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="26" cy="72" r="15" fill="#3B3B46"/><circle cx="26" cy="72" r="6" fill="#C9CFDA"/>
    <circle cx="76" cy="72" r="15" fill="#3B3B46"/><circle cx="76" cy="72" r="6" fill="#C9CFDA"/></svg>`,
  xylofoon: `<svg viewBox="0 0 100 100"><path d="M8 30 L92 44 M8 80 L92 66" stroke="#8E5A2B" stroke-width="5" stroke-linecap="round"/>
    ${["#E0479E", "#F28C38", "#F5C35A", "#5CC67A", "#4FA3E0", "#8E5CC9"].map((c, i) =>
      `<rect x="${14 + i * 13}" y="${24 + i * 2.2}" width="10" height="${62 - i * 4.4}" rx="3" fill="${c}"/>`).join("")}
    <path d="M60 10 L84 34" stroke="#C9854A" stroke-width="4" stroke-linecap="round"/><circle cx="58" cy="8" r="6" fill="#E0479E"/></svg>`,
  yeti: `<svg viewBox="0 0 100 100"><g fill="#FFFFFF" stroke="#C7D7EA" stroke-width="2.5">
    <path d="M22 92 Q12 60 20 40 Q22 14 50 10 Q78 14 80 40 Q88 60 78 92 Q66 98 50 96 Q34 98 22 92Z"/></g>
    <path d="M16 54 Q4 60 8 72 M84 54 Q96 60 92 72" stroke="#C7D7EA" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="44" rx="20" ry="18" fill="#A9D3F5"/>
    <circle cx="43" cy="40" r="3.5" fill="#2E3A59"/><circle cx="57" cy="40" r="3.5" fill="#2E3A59"/>
    <path d="M42 50 Q50 58 58 50" stroke="#2E3A59" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g fill="#CFE6FA"><circle cx="12" cy="20" r="3"/><circle cx="88" cy="16" r="3"/><circle cx="92" cy="36" r="2"/></g></svg>`,
};

/** Plaatje voor een woord: eigen foto (URL), eigen tekening of emoji-illustratie. */
export function picHTML(pic, photoUrl) {
  if (photoUrl) return `<img class="pic-img" src="${photoUrl}" alt="">`;
  if (pic.startsWith("svg:")) return `<div class="pic-svg">${PICS[pic.slice(4)] || ""}</div>`;
  return `<div class="pic-emoji">${pic}</div>`;
}

// ------------------------------------------------------------------ iconen
const ic = (d, extra = "") => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const ICON = {
  speaker: ic('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: ic('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/>'),
  hand: ic('<path d="M9 11V5a1.5 1.5 0 0 1 3 0v6m0-1.5V4a1.5 1.5 0 0 1 3 0v6m0-1a1.5 1.5 0 0 1 3 0v4.5a7 7 0 0 1-7 7h-.5a6.5 6.5 0 0 1-5.4-2.9L4 15.5a1.6 1.6 0 0 1 2.6-1.9L9 16"/>'),
  restart: ic('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  home: ic('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  next: ic('<path d="M9 5l7 7-7 7"/>'),
  star: ic('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>'),
  trophy: ic('<path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M9 17h6"/>'),
  abc: ic('<path d="M3 17l3-9 3 9M4 14h4M12 8v9h3a2.2 2.2 0 0 0 0-4.5h-3 2.5a2.2 2.2 0 0 0 0-4.5H12M22 9.5A3.5 3.5 0 0 0 16 12a3.5 3.5 0 0 0 6 2.5"/>'),
  lock: ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  play: ic('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  mic: ic('<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  stop: ic('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  check: ic('<path d="M5 12l5 5L20 7"/>'),
  wand: ic('<path d="M4 20L16 8M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.7 1.3 1.3.7-1.3.7L19 15l-.7-1.3L17 13l1.3-.7z"/>'),
  eye: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  crown: ic('<path d="M3 18l2-11 5 5 2-7 2 7 5-5 2 11z" fill="currentColor"/>'),
  upload: ic('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
};

// Linkerhand die voordoet; de vingertop ligt op (0,0) en de hand komt van linksonder.
export const DEMO_HAND = `<g class="demo-hand-inner">
  <path d="M-6 6 Q-14 4 -12 -4 Q-10 -10 -2 -8 L4 -2 Q8 6 2 10 Z" fill="#FFE3D3"/>
  <rect x="-11" y="-6" width="20" height="58" rx="10" transform="rotate(-32)" fill="#FFE3D3" stroke="#E7B8A5" stroke-width="3"/>
  <path d="M-58 64 Q-66 40 -46 30 Q-30 22 -10 34 Q8 46 0 66 Q-8 92 -36 92 Q-56 90 -58 64Z" fill="#FFE3D3" stroke="#E7B8A5" stroke-width="3"/>
  <path d="M-46 32 Q-62 22 -60 10 Q-58 2 -50 6 Q-42 14 -36 28" fill="#FFE3D3" stroke="#E7B8A5" stroke-width="3"/>
  <ellipse cx="-2" cy="2" rx="6" ry="5" transform="rotate(-32)" fill="#FFD1E6"/>
  <circle cx="0" cy="0" r="10" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>
</g>`;

export function sparkle(x, y, r = 8, fill = "#F5C35A") {
  return `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z" fill="${fill}"/>`;
}
