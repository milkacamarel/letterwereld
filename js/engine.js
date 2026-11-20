// Schrijfroute-controle. Geen letterherkenning: elke beweging wordt vergeleken met de vaste route
// uit letters.js (startpunt, richting, volgorde, voortgang langs het pad, eindpunt, optillen).
import { strokesFor } from "./letters.js";

const rad = (t) => (t * Math.PI) / 180;
const arcPt = (cx, cy, rx, ry, t) => [cx + rx * Math.sin(rad(t)), cy - ry * Math.cos(rad(t))];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function reverseSeg(g) {
  if (g[0] === "L") return ["L", g[3], g[4], g[1], g[2]];
  if (g[0] === "A") return ["A", g[1], g[2], g[3], g[4], g[6], g[5]];
  return g;
}

function samplePts(segs) {
  const pts = [];
  for (const g of segs) {
    let seg = [];
    if (g[0] === "L") {
      const [, x1, y1, x2, y2] = g;
      const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
      for (let i = 0; i <= n; i++) seg.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
    } else if (g[0] === "A") {
      const [, cx, cy, rx, ry, t0, t1] = g;
      const n = Math.max(2, Math.ceil(Math.abs(t1 - t0) / 2));
      for (let i = 0; i <= n; i++) seg.push(arcPt(cx, cy, rx, ry, t0 + ((t1 - t0) * i) / n));
    } else if (g[0] === "D") seg = [[g[1], g[2]]];
    if (pts.length && seg.length && dist(pts[pts.length - 1], seg[0]) < 0.5) seg = seg.slice(1);
    pts.push(...seg);
  }
  return pts;
}

function finishStroke(raw, pts) {
  const isDot = raw.segs.length === 1 && raw.segs[0][0] === "D";
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const len = cum[cum.length - 1];
  const s = { type: isDot ? "dot" : "line", hint: raw.hint, pts, cum, len, start: pts[0], end: pts[pts.length - 1] };
  s.d = isDot ? "" : "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  s.startTangent = isDot ? [0, 1] : tangentAt(s, 0);
  return s;
}

/** Bouwt een letter uit de bibliotheek: bemonsterde streken, SVG-paden, start/eindpunten. */
export function buildLetter(char, cfg = {}) {
  const raw = strokesFor(char, cfg).map((s) =>
    cfg.leftyBars && s.bar ? { ...s, segs: [...s.segs].reverse().map(reverseSeg) } : s);
  const sampled = raw.map((s) => samplePts(s.segs));
  const xs = sampled.flat().map((p) => p[0]);
  const ys = sampled.flat().map((p) => p[1]);
  const minX = Math.min(...xs);
  const strokes = raw.map((s, i) => finishStroke(s, sampled[i].map(([x, y]) => [x - minX, y])));
  return { char, isUpper: char !== char.toLowerCase(), strokes, width: Math.max(...xs) - minX,
    minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Punt en richting op afstand `s` langs een streek. */
export function pointAt(stroke, s) {
  const { pts, cum } = stroke;
  if (pts.length === 1) return pts[0];
  s = Math.max(0, Math.min(stroke.len, s));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
}

export function tangentAt(stroke, s) {
  const a = pointAt(stroke, s - 4), b = pointAt(stroke, s + 4);
  const n = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / n, (b[1] - a[1]) / n];
}

/** Vroegste plek langs het pad (binnen [lo, hi]) die hooguit maxD van p ligt; anders null. */
function earliestWithin(stroke, p, lo, hi, maxD) {
  const { pts, cum } = stroke;
  for (let i = 0; i < pts.length - 1; i++) {
    if (cum[i + 1] < lo || cum[i] > hi) continue;
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * vx + (p[1] - ay) * vy) / L2));
    const along = cum[i] + t * (cum[i + 1] - cum[i]);
    if (along < lo || along > hi) continue;
    if (Math.hypot(p[0] - (ax + t * vx), p[1] - (ay + t * vy)) <= maxD) return along;
  }
  return null;
}

/** Dichtstbijzijnde punt op een streek, optioneel alleen binnen [lo, hi] langs het pad. */
export function nearest(stroke, p, lo = -Infinity, hi = Infinity) {
  const { pts, cum } = stroke;
  if (pts.length === 1) return { d: dist(p, pts[0]), s: 0 };
  let best = { d: Infinity, s: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    if (cum[i + 1] < lo || cum[i] > hi) continue;
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
    let t = ((p[0] - ax) * vx + (p[1] - ay) * vy) / L2;
    t = Math.max(0, Math.min(1, t));
    let along = cum[i] + t * (cum[i + 1] - cum[i]);
    if (along < lo || along > hi) {
      along = Math.max(lo, Math.min(hi, along));
      const q = pointAt(stroke, along);
      const d = dist(p, q);
      if (d < best.d) best = { d, s: along };
      continue;
    }
    const d = Math.hypot(p[0] - (ax + t * vx), p[1] - (ay + t * vy));
    if (d < best.d) best = { d, s: along };
  }
  return best;
}

// Toleranties in letter-eenheden (x-hoogte = 100). Ondergrens in pixels voor kleine schermen.
export const TOLERANCES = {
  ruim:         { path: 36, start: 44, back: 30, end: 20, liftEnd: 30 },
  gebalanceerd: { path: 27, start: 36, back: 26, end: 14, liftEnd: 22 },
  precies:      { path: 19, start: 27, back: 20, end: 9, liftEnd: 14 },
};
const MIN_PX = { path: 22, start: 30, back: 20, end: 8, liftEnd: 14 };
const AHEAD = 45;      // zo ver mag de vinger per stapje vooruit langs het pad (voorkomt overslaan)
const SUBSTEP = 5;     // snelle bewegingen worden in kleine stapjes gecontroleerd
const OFF_GRACE = 16;  // zoveel eenheden mag de vinger kort buiten de marge komen

/**
 * Volgt één poging om een letter te schrijven.
 * down/move/up geven een lijst gebeurtenissen terug:
 *   start, tap-start, progress, stroke-done, letter-done, lifted,
 *   off-path, reverse, lift-early, wrong-order, not-at-start, miss, far
 */
export class Tracer {
  constructor(letter, tol = TOLERANCES.gebalanceerd) {
    this.letter = letter;
    this.tolBase = { ...tol };
    this.pxPerUnit = 1;
    this.restart();
  }
  setPxPerUnit(k) { this.pxPerUnit = k || 1; }
  tol(name) { return Math.max(this.tolBase[name], MIN_PX[name] / this.pxPerUnit); }

  restart() { this.idx = 0; this.progress = 0; this.active = false; this.awaitLift = false; this.offDist = 0; this.last = null; }
  get stroke() { return this.letter.strokes[this.idx]; }
  get done() { return this.idx >= this.letter.strokes.length; }

  down(x, y) {
    if (this.done) return [];
    const p = [x, y], s = this.stroke;
    this.awaitLift = false;
    if (dist(p, s.start) <= this.tol("start") * (s.type === "dot" ? 1.15 : 1)) {
      if (s.type === "dot") return this._complete(false);
      this.active = true; this.progress = 0; this.offDist = 0; this.last = p;
      return [{ type: "start", stroke: this.idx }];
    }
    const strokes = this.letter.strokes;
    for (let j = this.idx + 1; j < strokes.length; j++)
      if (dist(p, strokes[j].start) <= this.tol("start")) return [{ type: "wrong-order", stroke: this.idx, touched: j }];
    if (s.type !== "dot" && nearest(s, p).d <= this.tol("path") * 1.5) return [{ type: "not-at-start", stroke: this.idx }];
    const closest = Math.min(...strokes.map((st) => nearest(st, p).d));
    return [{ type: closest > 120 ? "far" : "miss", stroke: this.idx }];
  }

  move(x, y) {
    if (!this.active || !this.last) return [];
    const [lx, ly] = this.last;
    const n = Math.max(1, Math.ceil(Math.hypot(x - lx, y - ly) / SUBSTEP));
    for (let i = 1; i <= n; i++) {
      const q = [lx + ((x - lx) * i) / n, ly + ((y - ly) * i) / n];
      const r = this._step(q, Math.hypot(x - lx, y - ly) / n);
      this.last = q;
      if (r) return r;
    }
    return [{ type: "progress", stroke: this.idx, progress: this.progress }];
  }

  up() {
    if (this.active) {
      if (this.progress >= this.stroke.len - this.tol("liftEnd")) return this._complete(false);
      const tiny = this.progress < 8;
      this._resetStroke();
      return [{ type: tiny ? "tap-start" : "lift-early", stroke: this.idx }];
    }
    if (this.awaitLift) { this.awaitLift = false; return [{ type: "lifted", stroke: this.idx }]; }
    return [];
  }

  _step(p, stepLen) {
    const s = this.stroke, tol = this.tol("path");
    // Eerst vooruit kijken: bij scherpe hoeken (v, w, z) ligt het vorige stuk dichtbij,
    // maar zolang de vinger ook bij het stuk vóór zich past, gaat hij de goede kant op.
    const fwd = nearest(s, p, this.progress - 8, this.progress + AHEAD);
    if (fwd.d <= tol) {
      this.offDist = 0;
      // Voorzichtig vooruit: de vroegste plek die bijna even goed past. Zo springt de voortgang
      // bij een smalle hoek (W, M) niet vooruit naar het volgende been.
      const s2 = earliestWithin(s, p, this.progress - 8, fwd.s, fwd.d + 10) ?? fwd.s;
      if (s2 > this.progress) this.progress = s2;
      // Eindpunt bereikt: de vinger zit bij het einde en de voortgang is er vlak achter.
      if (fwd.s >= s.len - this.tol("end") && this.progress >= s.len - this.tol("end") - 20) return this._complete(true);
    } else {
      const back = nearest(s, p, this.progress - this.tol("back") - 40, this.progress - 8);
      if (back.d <= tol && this.progress - back.s > this.tol("back")) return this._fail(p, "reverse");
      if (back.d > tol) {
        this.offDist += stepLen;
        if (Math.min(fwd.d, back.d) > tol * 1.7 || this.offDist > OFF_GRACE) return this._fail(p);
        return null;
      }
      this.offDist = 0;
    }
    if (this.progress >= s.len - this.tol("end")) return this._complete(true);
    return null;
  }

  _fail(p, kind) {
    const s = this.stroke;
    if (!kind) {
      const v = [p[0] - s.start[0], p[1] - s.start[1]];
      kind = this.progress < 30 && v[0] * s.startTangent[0] + v[1] * s.startTangent[1] < 0 ? "reverse" : "off-path";
    }
    const lost = this.progress;
    this._resetStroke();
    return [{ type: kind, stroke: this.idx, lost }];
  }

  _resetStroke() { this.progress = 0; this.active = false; this.offDist = 0; this.last = null; }

  _complete(fingerStillDown) {
    const ev = [{ type: "stroke-done", stroke: this.idx }];
    this.idx++;
    this._resetStroke();
    this.awaitLift = fingerStillDown;
    if (this.done) ev.push({ type: "letter-done" });
    return ev;
  }
}
