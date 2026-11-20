// Letterbibliotheek: de exacte schrijfroute van elke letter.
//
// Coördinaten (eenheden): zolderlijn y=0, middellijn y=100, grondlijn y=200, kelderlijn y=300.
// Een letter bestaat uit streken (strokes) in schrijfvolgorde. Elke streek is een lijst segmenten
// in schrijfrichting:
//   ["L", x1, y1, x2, y2]            rechte lijn
//   ["A", cx, cy, rx, ry, t0, t1]    boog; t = klokhoek in graden (0 = 12 uur, 90 = 3 uur),
//                                    t1 < t0 = tegen de klok in, t1 > t0 = met de klok mee
//   ["D", x, y]                      puntje (tikken), bijv. op de i
// hint = id van het gesproken richtingzinnetje (zie stem/audio-manifest.json).
// bar  = losse dwarsstreep; kan voor linkshandigen van rechts naar links (instelling).
//
// Wil je de vormen aanpassen aan de methode van school? Exporteer de bibliotheek in de Ouderhoek,
// pas de JSON aan en importeer hem weer, of wijzig dit bestand.

const B = "richting_beneden", R = "richting_rechts", S = "richting_schuin", O = "richting_rondje",
  G = "richting_boogje", SL = "richting_slangetje", H = "richting_haakje", P = "richting_puntje";

const bowl = () => ["A", 45, 150, 45, 50, 60, -300];

export const LOWER = {
  a: [{ segs: [bowl()], hint: O }, { segs: [["L", 90, 100, 90, 200]], hint: B }],
  b: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["A", 45, 150, 45, 50, -90, 270]], hint: O }],
  c: [{ segs: [["A", 45, 150, 45, 50, 50, -230]], hint: G }],
  d: [{ segs: [bowl()], hint: O }, { segs: [["L", 90, 0, 90, 200]], hint: B }],
  e: [{ segs: [["L", 0, 150, 90, 150], ["A", 45, 150, 45, 50, 90, -230]], hint: R }],
  f: [{ segs: [["A", 62, 35, 35, 35, 75, -90], ["L", 27, 35, 27, 200]], hint: H },
      { segs: [["L", 0, 100, 70, 100]], hint: R, bar: true }],
  g: [{ segs: [bowl()], hint: O }, { segs: [["L", 90, 100, 90, 255], ["A", 45, 255, 45, 45, 90, 255]], hint: B }],
  h: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["A", 45, 145, 45, 45, -90, 90], ["L", 90, 145, 90, 200]], hint: G }],
  i: [{ segs: [["L", 0, 100, 0, 200]], hint: B }, { segs: [["D", 0, 45]], hint: P }],
  j: [{ segs: [["L", 60, 100, 60, 255], ["A", 28, 255, 32, 45, 90, 260]], hint: B }, { segs: [["D", 60, 45]], hint: P }],
  k: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 80, 100, 4, 155], ["L", 4, 155, 85, 200]], hint: S }],
  l: [{ segs: [["L", 0, 0, 0, 200]], hint: B }],
  m: [{ segs: [["L", 0, 100, 0, 200]], hint: B },
      { segs: [["A", 35, 140, 35, 40, -90, 90], ["L", 70, 140, 70, 200]], hint: G },
      { segs: [["A", 105, 140, 35, 40, -90, 90], ["L", 140, 140, 140, 200]], hint: G }],
  n: [{ segs: [["L", 0, 100, 0, 200]], hint: B }, { segs: [["A", 45, 145, 45, 45, -90, 90], ["L", 90, 145, 90, 200]], hint: G }],
  o: [{ segs: [["A", 45, 150, 45, 50, 10, -350]], hint: O }],
  p: [{ segs: [["L", 0, 100, 0, 300]], hint: B }, { segs: [["A", 45, 150, 45, 50, -90, 270]], hint: O }],
  q: [{ segs: [bowl()], hint: O }, { segs: [["L", 90, 100, 90, 300]], hint: B }],
  r: [{ segs: [["L", 0, 100, 0, 200]], hint: B }, { segs: [["A", 40, 145, 40, 45, -90, 55]], hint: G }],
  s: [{ segs: [["A", 45, 125, 40, 25, 65, -180], ["A", 45, 175, 42, 25, 0, 245]], hint: SL }],
  t: [{ segs: [["L", 30, 35, 30, 200]], hint: B }, { segs: [["L", 0, 100, 62, 100]], hint: R, bar: true }],
  u: [{ segs: [["L", 0, 100, 0, 150], ["A", 45, 150, 45, 50, 270, 90], ["L", 90, 150, 90, 100]], hint: B },
      { segs: [["L", 90, 100, 90, 200]], hint: B }],
  v: [{ segs: [["L", 0, 100, 45, 200], ["L", 45, 200, 90, 100]], hint: S }],
  w: [{ segs: [["L", 0, 100, 32, 200], ["L", 32, 200, 65, 105], ["L", 65, 105, 98, 200], ["L", 98, 200, 130, 100]], hint: S }],
  x: [{ segs: [["L", 0, 100, 85, 200]], hint: S }, { segs: [["L", 85, 100, 0, 200]], hint: S }],
  y: [{ segs: [["L", 0, 100, 55, 200]], hint: S }, { segs: [["L", 90, 100, 20, 300]], hint: S }],
  z: [{ segs: [["L", 0, 100, 85, 100], ["L", 85, 100, 0, 200], ["L", 0, 200, 88, 200]], hint: R }],
};

const O_UP = { segs: [["A", 80, 100, 80, 100, 10, -350]], hint: O };
const P_UP = [{ segs: [["L", 0, 0, 0, 200]], hint: B },
  { segs: [["L", 0, 0, 45, 0], ["A", 45, 55, 50, 55, 0, 180], ["L", 45, 110, 0, 110]], hint: G }];
const gEnd = [75 + 75 * Math.sin(-245 * Math.PI / 180), 100 - 100 * Math.cos(-245 * Math.PI / 180)];

export const UPPER = {
  A: [{ segs: [["L", 55, 0, 0, 200]], hint: S }, { segs: [["L", 55, 0, 110, 200]], hint: S },
      { segs: [["L", 21, 125, 89, 125]], hint: R, bar: true }],
  B: [{ segs: [["L", 0, 0, 0, 200]], hint: B },
      { segs: [["L", 0, 0, 45, 0], ["A", 45, 50, 42, 50, 0, 180], ["L", 45, 100, 0, 100]], hint: G },
      { segs: [["L", 0, 100, 50, 100], ["A", 50, 150, 48, 50, 0, 180], ["L", 50, 200, 0, 200]], hint: G }],
  C: [{ segs: [["A", 78, 100, 78, 100, 45, -225]], hint: G }],
  D: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 0, 0, 35, 0], ["A", 35, 100, 80, 100, 0, 180], ["L", 35, 200, 0, 200]], hint: G }],
  E: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 0, 0, 100, 0]], hint: R },
      { segs: [["L", 0, 100, 80, 100]], hint: R }, { segs: [["L", 0, 200, 100, 200]], hint: R }],
  F: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 0, 0, 100, 0]], hint: R }, { segs: [["L", 0, 100, 80, 100]], hint: R }],
  G: [{ segs: [["A", 75, 100, 75, 100, 45, -245], ["L", gEnd[0], gEnd[1], 143, 110], ["L", 143, 110, 95, 110]], hint: G }],
  H: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 110, 0, 110, 200]], hint: B },
      { segs: [["L", 0, 100, 110, 100]], hint: R, bar: true }],
  I: [{ segs: [["L", 0, 0, 0, 200]], hint: B }],
  J: [{ segs: [["L", 80, 0, 80, 150], ["A", 40, 150, 40, 50, 90, 265]], hint: B }],
  K: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 100, 0, 2, 108]], hint: S }, { segs: [["L", 38, 68, 105, 200]], hint: S }],
  L: [{ segs: [["L", 0, 0, 0, 200], ["L", 0, 200, 95, 200]], hint: B }],
  M: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 0, 0, 65, 140], ["L", 65, 140, 130, 0], ["L", 130, 0, 130, 200]], hint: S }],
  N: [{ segs: [["L", 0, 0, 0, 200]], hint: B }, { segs: [["L", 0, 0, 110, 200], ["L", 110, 200, 110, 0]], hint: S }],
  O: [O_UP],
  P: P_UP,
  Q: [O_UP, { segs: [["L", 95, 140, 165, 205]], hint: S }],
  R: [...P_UP, { segs: [["L", 45, 110, 105, 200]], hint: S }],
  S: [{ segs: [["A", 65, 50, 58, 50, 60, -180], ["A", 65, 150, 62, 50, 0, 240]], hint: SL }],
  T: [{ segs: [["L", 0, 0, 110, 0]], hint: R, bar: true }, { segs: [["L", 55, 0, 55, 200]], hint: B }],
  U: [{ segs: [["L", 0, 0, 0, 130], ["A", 55, 130, 55, 70, 270, 90], ["L", 110, 130, 110, 0]], hint: B }],
  V: [{ segs: [["L", 0, 0, 60, 200], ["L", 60, 200, 120, 0]], hint: S }],
  W: [{ segs: [["L", 0, 0, 40, 200], ["L", 40, 200, 80, 60], ["L", 80, 60, 120, 200], ["L", 120, 200, 160, 0]], hint: S }],
  X: [{ segs: [["L", 0, 0, 110, 200]], hint: S }, { segs: [["L", 110, 0, 0, 200]], hint: S }],
  Y: [{ segs: [["L", 0, 0, 55, 100]], hint: S }, { segs: [["L", 110, 0, 55, 100], ["L", 55, 100, 55, 200]], hint: S }],
  Z: [{ segs: [["L", 0, 0, 110, 0], ["L", 110, 0, 0, 200], ["L", 0, 200, 110, 200]], hint: R }],
};

// Vormvarianten die per school verschillen (te kiezen in de Ouderhoek).
export const VARIANTS = {
  t: {
    recht: { label: "t recht", strokes: LOWER.t },
    krul: { label: "t met krulletje", strokes: [
      { segs: [["L", 30, 35, 30, 170], ["A", 60, 170, 30, 30, 270, 120]], hint: B },
      { segs: [["L", 0, 100, 62, 100]], hint: R, bar: true }] },
  },
  y: {
    recht: { label: "y met rechte poten", strokes: LOWER.y },
    staart: { label: "y als u met staart", strokes: [
      { segs: [["L", 0, 100, 0, 150], ["A", 45, 150, 45, 50, 270, 90], ["L", 90, 150, 90, 100]], hint: B },
      { segs: [["L", 90, 100, 90, 255], ["A", 45, 255, 45, 45, 90, 255]], hint: B }] },
  },
  T: {
    dak: { label: "T: eerst het dak", strokes: UPPER.T },
    stok: { label: "T: eerst de stok", strokes: [UPPER.T[1], UPPER.T[0]] },
  },
};

export const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

/** Ruwe streken van een letter, met ouderinstellingen (varianten, eigen bibliotheek) toegepast. */
export function strokesFor(char, cfg = {}) {
  const custom = cfg.customLibrary?.[char];
  if (Array.isArray(custom) && custom.length) return custom;
  const v = cfg.variants?.[char];
  if (v && VARIANTS[char]?.[v]) return VARIANTS[char][v].strokes;
  return (char === char.toUpperCase() ? UPPER : LOWER)[char];
}

/** Controleert een (geïmporteerde) eigen letterbibliotheek. Geeft een lijst met fouten terug. */
export function validateLibrary(lib) {
  const errs = [];
  if (!lib || typeof lib !== "object" || Array.isArray(lib)) return ["Het bestand is geen letterbibliotheek."];
  for (const [ch, strokes] of Object.entries(lib)) {
    if (!/^[a-zA-Z]$/.test(ch)) { errs.push(`'${ch}' is geen letter.`); continue; }
    if (!Array.isArray(strokes) || !strokes.length) { errs.push(`${ch}: geen streken.`); continue; }
    strokes.forEach((s, i) => {
      if (!Array.isArray(s.segs) || !s.segs.length) errs.push(`${ch} streek ${i + 1}: geen segmenten.`);
      else s.segs.forEach((g) => {
        const ok = (g[0] === "L" && g.length === 5) || (g[0] === "A" && g.length === 7) || (g[0] === "D" && g.length === 3);
        if (!ok || g.slice(1).some((n) => typeof n !== "number" || !isFinite(n)))
          errs.push(`${ch} streek ${i + 1}: segment ${JSON.stringify(g)} klopt niet.`);
      });
    });
  }
  return errs;
}
