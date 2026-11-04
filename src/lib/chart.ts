/**
 * Tiny dependency-free SVG chart renderer. Pure functions that return markup, so the
 * same code draws charts at build time (Astro frontmatter) and in the browser
 * (live refreshes). Styling hooks: .ch, .ch-grid, .ch-axis, .ch-tick, .ch-label.
 */
export interface Pt { x: number; y: number }
export interface Series {
  points: Pt[];
  color?: string;
  width?: number;
  area?: boolean;
  dash?: string;
  label?: string;
  dots?: boolean;
  opacity?: number;
}
export interface Marker { x: number; label?: string; color?: string; dash?: string }
export interface Pad { t: number; r: number; b: number; l: number }
export interface LineOpts {
  width?: number;
  height?: number;
  pad?: Partial<Pad>;
  series: Series[];
  xDomain?: [number, number];
  yDomain?: [number, number];
  xTicks?: number;
  yTicks?: number;
  xFmt?: (v: number) => string;
  yFmt?: (v: number) => string;
  zeroLine?: boolean;
  grid?: boolean;
  markers?: Marker[];
  ariaLabel: string;
  className?: string;
  endLabels?: boolean;
  yLabel?: string;
  xLabel?: string;
  fontSize?: number;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v: number): string => (Math.round(v * 100) / 100).toString();

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}

function extent(vals: number[]): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (const v of vals) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!isFinite(lo)) return [0, 1];
  return [lo, hi];
}

export function lineChart(o: LineOpts): string {
  const W = o.width ?? 720, H = o.height ?? 300;
  const pad: Pad = { t: 18, r: o.endLabels ? 96 : 18, b: 34, l: 48, ...o.pad };
  const fs = o.fontSize ?? 11;
  const xs = o.series.flatMap((s) => s.points.map((p) => p.x));
  const ys = o.series.flatMap((s) => s.points.map((p) => p.y));
  let [x0, x1] = o.xDomain ?? extent(xs);
  let [y0, y1] = o.yDomain ?? extent(ys);
  if (o.zeroLine) { y0 = Math.min(0, y0); y1 = Math.max(0, y1); }
  if (!o.yDomain) { const padY = (y1 - y0) * 0.08 || 1; y0 -= padY; y1 += padY; }
  if (x0 === x1) { x0 -= 1; x1 += 1; }
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * iw;
  const sy = (y: number) => pad.t + ih - ((y - y0) / (y1 - y0)) * ih;
  const xf = o.xFmt ?? ((v) => n(v));
  const yf = o.yFmt ?? ((v) => n(v));
  const xt = niceTicks(x0, x1, o.xTicks ?? 6).filter((v) => v >= x0 && v <= x1);
  const yt = niceTicks(y0, y1, o.yTicks ?? 5).filter((v) => v >= y0 && v <= y1);
  let out = `<svg class="ch ${o.className ?? ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.ariaLabel)}" preserveAspectRatio="xMidYMid meet">`;
  if (o.grid !== false) {
    for (const v of yt) out += `<line class="ch-grid" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(sy(v))}" y2="${n(sy(v))}"/>`;
  }
  for (const v of yt) out += `<text class="ch-tick" x="${n(pad.l - 8)}" y="${n(sy(v) + fs * 0.35)}" text-anchor="end" font-size="${fs}">${esc(yf(v))}</text>`;
  for (const v of xt) out += `<text class="ch-tick" x="${n(sx(v))}" y="${n(H - pad.b + 18)}" text-anchor="middle" font-size="${fs}">${esc(xf(v))}</text>`;
  out += `<line class="ch-axis" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(pad.t + ih)}" y2="${n(pad.t + ih)}"/>`;
  if (o.zeroLine && y0 < 0 && y1 > 0) out += `<line class="ch-zero" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(sy(0))}" y2="${n(sy(0))}"/>`;
  for (const m of o.markers ?? []) {
    const x = sx(m.x);
    out += `<line class="ch-marker" x1="${n(x)}" x2="${n(x)}" y1="${n(pad.t)}" y2="${n(pad.t + ih)}" style="stroke:${m.color ?? 'currentColor'};stroke-dasharray:${m.dash ?? '3 3'}"/>`;
    if (m.label) out += `<text class="ch-label" x="${n(x + 4)}" y="${n(pad.t + fs)}" font-size="${fs}" style="fill:${m.color ?? 'currentColor'}">${esc(m.label)}</text>`;
  }
  for (const s of o.series) {
    if (!s.points.length) continue;
    const color = s.color ?? 'currentColor';
    const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${n(sx(p.x))} ${n(sy(p.y))}`).join(' ');
    if (s.area) {
      const base = sy(Math.max(y0, Math.min(0, y1)) );
      const first = s.points[0], last = s.points[s.points.length - 1];
      out += `<path class="ch-area" d="${d} L${n(sx(last.x))} ${n(base)} L${n(sx(first.x))} ${n(base)} Z" style="fill:${color};opacity:.14"/>`;
    }
    out += `<path class="ch-line" d="${d}" style="stroke:${color};stroke-width:${s.width ?? 2};${s.dash ? `stroke-dasharray:${s.dash};` : ''}opacity:${s.opacity ?? 1}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (s.dots) for (const p of s.points) out += `<circle class="ch-dot" cx="${n(sx(p.x))}" cy="${n(sy(p.y))}" r="3" style="fill:${color}"/>`;
    if (o.endLabels && s.label) {
      const last = s.points[s.points.length - 1];
      out += `<text class="ch-label" x="${n(sx(last.x) + 8)}" y="${n(sy(last.y) + fs * 0.35)}" font-size="${fs}" style="fill:${color}">${esc(s.label)}</text>`;
    }
  }
  if (o.yLabel) out += `<text class="ch-label" transform="translate(${n(12)} ${n(pad.t + ih / 2)}) rotate(-90)" text-anchor="middle" font-size="${fs}">${esc(o.yLabel)}</text>`;
  if (o.xLabel) out += `<text class="ch-label" x="${n(pad.l + iw / 2)}" y="${n(H - 4)}" text-anchor="middle" font-size="${fs}">${esc(o.xLabel)}</text>`;
  return out + '</svg>';
}

export interface BarSeries { values: number[]; color?: string | string[]; label?: string }
export interface BarOpts {
  width?: number;
  height?: number;
  pad?: Partial<Pad>;
  categories: string[];
  series: BarSeries[];
  horizontal?: boolean;
  valueFmt?: (v: number) => string;
  showValues?: boolean;
  yDomain?: [number, number];
  ariaLabel: string;
  className?: string;
  fontSize?: number;
  gap?: number;
  zeroLine?: boolean;
}

export function barChart(o: BarOpts): string {
  const horizontal = !!o.horizontal;
  const W = o.width ?? 720, H = o.height ?? 300;
  const pad: Pad = horizontal ? { t: 10, r: 56, b: 10, l: 120, ...o.pad } : { t: 22, r: 12, b: 36, l: 44, ...o.pad };
  const fs = o.fontSize ?? 11;
  const all = o.series.flatMap((s) => s.values);
  let [v0, v1] = o.yDomain ?? extent(all);
  v0 = Math.min(0, v0); v1 = Math.max(0, v1);
  if (!o.yDomain) { const p = (v1 - v0) * 0.12 || 1; if (v0 < 0) v0 -= p; v1 += p; }
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const vf = o.valueFmt ?? ((v) => n(v));
  const nCat = o.categories.length, nSer = o.series.length;
  const slot = (horizontal ? ih : iw) / Math.max(1, nCat);
  const gap = o.gap ?? 0.3;
  const bw = (slot * (1 - gap)) / nSer;
  const scale = (v: number) => horizontal ? pad.l + ((v - v0) / (v1 - v0)) * iw : pad.t + ih - ((v - v0) / (v1 - v0)) * ih;
  const ticks = niceTicks(v0, v1, 5).filter((t) => t >= v0 && t <= v1);
  let out = `<svg class="ch ${o.className ?? ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.ariaLabel)}" preserveAspectRatio="xMidYMid meet">`;
  for (const t of ticks) {
    if (horizontal) {
      out += `<line class="ch-grid" x1="${n(scale(t))}" x2="${n(scale(t))}" y1="${n(pad.t)}" y2="${n(pad.t + ih)}"/>`;
      out += `<text class="ch-tick" x="${n(scale(t))}" y="${n(pad.t + ih + 14)}" text-anchor="middle" font-size="${fs}">${esc(vf(t))}</text>`;
    } else {
      out += `<line class="ch-grid" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(scale(t))}" y2="${n(scale(t))}"/>`;
      out += `<text class="ch-tick" x="${n(pad.l - 8)}" y="${n(scale(t) + fs * 0.35)}" text-anchor="end" font-size="${fs}">${esc(vf(t))}</text>`;
    }
  }
  const zero = scale(0);
  if (o.zeroLine !== false) out += horizontal
    ? `<line class="ch-axis" x1="${n(zero)}" x2="${n(zero)}" y1="${n(pad.t)}" y2="${n(pad.t + ih)}"/>`
    : `<line class="ch-axis" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(zero)}" y2="${n(zero)}"/>`;
  o.categories.forEach((cat, ci) => {
    const start = (horizontal ? pad.t : pad.l) + ci * slot + (slot * gap) / 2;
    if (horizontal) out += `<text class="ch-cat" x="${n(pad.l - 10)}" y="${n(start + (slot * (1 - gap)) / 2 + fs * 0.35)}" text-anchor="end" font-size="${fs}">${esc(cat)}</text>`;
    else out += `<text class="ch-cat" x="${n(start + (slot * (1 - gap)) / 2)}" y="${n(H - pad.b + 18)}" text-anchor="middle" font-size="${fs}">${esc(cat)}</text>`;
    o.series.forEach((s, si) => {
      const v = s.values[ci] ?? 0;
      const color = Array.isArray(s.color) ? s.color[ci] ?? 'currentColor' : s.color ?? 'currentColor';
      const a = scale(v);
      if (horizontal) {
        const x = Math.min(a, zero), w = Math.abs(a - zero), y = start + si * bw;
        out += `<rect class="ch-bar" x="${n(x)}" y="${n(y)}" width="${n(Math.max(w, 0.5))}" height="${n(bw)}" style="fill:${color}"/>`;
        if (o.showValues !== false) out += `<text class="ch-val" x="${n(v >= 0 ? a + 6 : a - 6)}" y="${n(y + bw / 2 + fs * 0.35)}" text-anchor="${v >= 0 ? 'start' : 'end'}" font-size="${fs}">${esc(vf(v))}</text>`;
      } else {
        const y = Math.min(a, zero), h = Math.abs(a - zero), x = start + si * bw;
        out += `<rect class="ch-bar" x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="${n(Math.max(h, 0.5))}" style="fill:${color}"/>`;
        if (o.showValues !== false) out += `<text class="ch-val" x="${n(x + bw / 2)}" y="${n(v >= 0 ? y - 5 : y + h + fs + 2)}" text-anchor="middle" font-size="${fs}">${esc(vf(v))}</text>`;
      }
    });
  });
  return out + '</svg>';
}

export interface ScatterPt { x: number; y: number; color?: string; r?: number; label?: string }
export interface ScatterOpts {
  width?: number; height?: number; pad?: Partial<Pad>;
  points: ScatterPt[];
  xDomain?: [number, number]; yDomain?: [number, number];
  xFmt?: (v: number) => string; yFmt?: (v: number) => string;
  xLabel?: string; yLabel?: string;
  trend?: boolean; trendColor?: string;
  quadrants?: boolean;
  ariaLabel: string; className?: string; fontSize?: number;
  labels?: boolean;
}

export function scatterChart(o: ScatterOpts): string {
  const W = o.width ?? 720, H = o.height ?? 360;
  const pad: Pad = { t: 16, r: 16, b: 44, l: 52, ...o.pad };
  const fs = o.fontSize ?? 11;
  let [x0, x1] = o.xDomain ?? extent(o.points.map((p) => p.x));
  let [y0, y1] = o.yDomain ?? extent(o.points.map((p) => p.y));
  if (!o.xDomain) { const p = (x1 - x0) * 0.08 || 1; x0 -= p; x1 += p; }
  if (!o.yDomain) { const p = (y1 - y0) * 0.08 || 1; y0 -= p; y1 += p; }
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * iw;
  const sy = (y: number) => pad.t + ih - ((y - y0) / (y1 - y0)) * ih;
  const xf = o.xFmt ?? ((v) => n(v)), yf = o.yFmt ?? ((v) => n(v));
  let out = `<svg class="ch ${o.className ?? ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.ariaLabel)}" preserveAspectRatio="xMidYMid meet">`;
  for (const v of niceTicks(y0, y1, 5).filter((t) => t >= y0 && t <= y1)) {
    out += `<line class="ch-grid" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(sy(v))}" y2="${n(sy(v))}"/>`;
    out += `<text class="ch-tick" x="${n(pad.l - 8)}" y="${n(sy(v) + fs * 0.35)}" text-anchor="end" font-size="${fs}">${esc(yf(v))}</text>`;
  }
  for (const v of niceTicks(x0, x1, 6).filter((t) => t >= x0 && t <= x1)) {
    out += `<line class="ch-grid" y1="${n(pad.t)}" y2="${n(pad.t + ih)}" x1="${n(sx(v))}" x2="${n(sx(v))}"/>`;
    out += `<text class="ch-tick" x="${n(sx(v))}" y="${n(pad.t + ih + 18)}" text-anchor="middle" font-size="${fs}">${esc(xf(v))}</text>`;
  }
  if (o.quadrants) {
    if (x0 < 0 && x1 > 0) out += `<line class="ch-zero" x1="${n(sx(0))}" x2="${n(sx(0))}" y1="${n(pad.t)}" y2="${n(pad.t + ih)}"/>`;
    if (y0 < 0 && y1 > 0) out += `<line class="ch-zero" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(sy(0))}" y2="${n(sy(0))}"/>`;
  }
  if (o.trend && o.points.length > 2) {
    const m = o.points.length;
    const mx = o.points.reduce((a, p) => a + p.x, 0) / m, my = o.points.reduce((a, p) => a + p.y, 0) / m;
    const sxx = o.points.reduce((a, p) => a + (p.x - mx) ** 2, 0), sxy = o.points.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
    const b = sxx ? sxy / sxx : 0, a = my - b * mx;
    out += `<line class="ch-trend" x1="${n(sx(x0))}" y1="${n(sy(a + b * x0))}" x2="${n(sx(x1))}" y2="${n(sy(a + b * x1))}" style="stroke:${o.trendColor ?? 'currentColor'}"/>`;
  }
  for (const p of o.points) {
    out += `<circle class="ch-pt" cx="${n(sx(p.x))}" cy="${n(sy(p.y))}" r="${p.r ?? 4}" style="fill:${p.color ?? 'currentColor'}"/>`;
    if (o.labels && p.label) out += `<text class="ch-label" x="${n(sx(p.x) + 7)}" y="${n(sy(p.y) - 6)}" font-size="${fs}">${esc(p.label)}</text>`;
  }
  if (o.yLabel) out += `<text class="ch-label" transform="translate(13 ${n(pad.t + ih / 2)}) rotate(-90)" text-anchor="middle" font-size="${fs}">${esc(o.yLabel)}</text>`;
  if (o.xLabel) out += `<text class="ch-label" x="${n(pad.l + iw / 2)}" y="${n(H - 6)}" text-anchor="middle" font-size="${fs}">${esc(o.xLabel)}</text>`;
  return out + '</svg>';
}

/** A compact sparkline with no axes, for cards. */
export function sparkline(points: Pt[], opts: { width?: number; height?: number; color?: string; area?: boolean; zero?: boolean; ariaLabel: string } ): string {
  const W = opts.width ?? 160, H = opts.height ?? 48;
  if (!points.length) return '';
  const [x0, x1] = extent(points.map((p) => p.x));
  let [y0, y1] = extent(points.map((p) => p.y));
  if (opts.zero) { y0 = Math.min(0, y0); y1 = Math.max(0, y1); }
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const sx = (x: number) => 2 + ((x - x0) / ((x1 - x0) || 1)) * (W - 4);
  const sy = (y: number) => 2 + (H - 4) - ((y - y0) / (y1 - y0)) * (H - 4);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${n(sx(p.x))} ${n(sy(p.y))}`).join(' ');
  const color = opts.color ?? 'currentColor';
  let out = `<svg class="ch ch--spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.ariaLabel)}" preserveAspectRatio="none">`;
  if (opts.zero && y0 < 0 && y1 > 0) out += `<line class="ch-zero" x1="0" x2="${W}" y1="${n(sy(0))}" y2="${n(sy(0))}"/>`;
  if (opts.area) out += `<path d="${d} L${n(sx(points[points.length - 1].x))} ${n(sy(opts.zero ? 0 : y0))} L${n(sx(points[0].x))} ${n(sy(opts.zero ? 0 : y0))} Z" style="fill:${color};opacity:.15"/>`;
  out += `<path d="${d}" fill="none" style="stroke:${color};stroke-width:2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  return out + '</svg>';
}
