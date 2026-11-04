/**
 * Page-only chart helpers for the Kalshi MLB tab.
 *
 * - heroPathChart(): the hand-drawn SVG of one real moneyline price path with scoring
 *   plays pinned on it. Every stroke carries pathLength="1" so the shared `.draw`
 *   animation traces it on entry, and the root carries the scale as data attributes so
 *   the page script can map a pointer position back to a minute.
 * - drawable() / tagInOrder(): small post-processors for the shared chart module's
 *   output (src/lib/chart.ts) so its lines animate and its elements carry data attributes.
 * - round() / cents() / signed() / times(): display formatting with half-up rounding and a
 *   real minus sign.
 *
 * Pure functions returning markup; used at build time in the page's frontmatter.
 */
import type { Pad } from '../../lib/chart';

export interface PathPt { m: number; p: number }
export interface ScoringPlay { m: number; inning: number; half: string; event: string; rbi: number; score: string }
export interface HeroOpts {
  id: string;
  width?: number;
  height?: number;
  fontSize?: number;
  pad?: Partial<Pad>;
  series: PathPt[];
  plays: ScoringPlay[];
  ariaLabel: string;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v: number): string => (Math.round(v * 100) / 100).toString();

/** Round half away from zero to `digits` decimals without binary-float surprises (12.35 -> 12.4). */
export const round = (v: number, digits = 1): number => {
  const f = 10 ** digits;
  return Math.round(v * f + (v >= 0 ? 1e-9 : -1e-9)) / f;
};
/** Signed number with a real minus sign: +7.4, −1.5, 0.0 */
export const signed = (v: number, digits = 1): string => {
  const r = round(v, digits);
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toFixed(digits)}`;
};
/** Signed cents: +7.4¢, −1.5¢ */
export const cents = (v: number, digits = 1): string => `${signed(v, digits)}¢`;
/** Ratio: 4.5× */
export const times = (v: number): string => `${round(v, 1).toFixed(1)}×`;

export function heroPathChart(o: HeroOpts): string {
  const W = o.width ?? 1100, H = o.height ?? 380, fs = o.fontSize ?? 11;
  const pad: Pad = { t: 52, r: 58, b: 36, l: 14, ...o.pad };
  const pts = o.series;
  if (!pts.length) return '';
  const x0 = 0, x1 = pts[pts.length - 1].m, y0 = 0, y1 = 100;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * iw;
  const sy = (y: number) => pad.t + ih - ((y - y0) / (y1 - y0)) * ih;
  const first = pts[0], last = pts[pts.length - 1];
  const gid = `${o.id}-fill`;

  let out = `<svg class="ch kx-hero-svg" id="${esc(o.id)}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.ariaLabel)}" preserveAspectRatio="xMidYMid meet"`
    + ` data-pad-l="${n(pad.l)}" data-pad-t="${n(pad.t)}" data-iw="${n(iw)}" data-ih="${n(ih)}" data-x0="${x0}" data-x1="${x1}" data-y0="${y0}" data-y1="${y1}">`;
  out += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity="0.32"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;

  // Price ladder on the right, like a terminal: grid at 0/25/50/75/100¢, the 50¢ line dashed.
  for (const v of [0, 25, 50, 75, 100]) {
    const y = sy(v);
    if (v === 50) out += `<line class="ch-zero" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(y)}" y2="${n(y)}"/>`;
    else out += `<line class="ch-grid" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(y)}" y2="${n(y)}" pathLength="1"/>`;
    // Skip a tick label that would collide with the closing-price label.
    if (Math.abs(y - sy(last.p)) > fs * 1.3) out += `<text class="ch-tick" x="${n(W - pad.r + 10)}" y="${n(y + fs * 0.35)}" font-size="${fs}">${v}¢</text>`;
  }
  for (let v = 0; v <= x1; v += 30) {
    out += `<text class="ch-tick" x="${n(sx(v))}" y="${n(H - pad.b + 18)}" text-anchor="${v === 0 ? 'start' : 'middle'}" font-size="${fs}">${v === 0 ? 'min 0' : v}</text>`;
  }
  out += `<line class="ch-axis" x1="${n(pad.l)}" x2="${n(W - pad.r)}" y1="${n(pad.t + ih)}" y2="${n(pad.t + ih)}" pathLength="1"/>`;

  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${n(sx(p.m))} ${n(sy(p.p))}`).join(' ');
  out += `<path class="kx-area" d="${d} L${n(sx(last.m))} ${n(sy(0))} L${n(sx(first.m))} ${n(sy(0))} Z" fill="url(#${gid})"/>`;

  // Scoring plays: a vertical rule and a numbered pin, coloured by who scored
  // (bottom half = home team, whose yes price this is; top half = the visitors).
  let prevX = -Infinity, prevY = 0;
  o.plays.forEach((pl, i) => {
    const x = sx(pl.m), home = pl.half === 'bottom', col = home ? 'var(--pos)' : 'var(--neg)';
    out += `<line class="kx-ev" x1="${n(x)}" x2="${n(x)}" y1="${n(pad.t - 4)}" y2="${n(pad.t + ih)}" style="stroke:${col}" pathLength="1"/>`;
    const py = x - prevX < 26 ? prevY + 22 : pad.t - 34; // stack pins that would overlap
    prevX = x; prevY = py;
    out += `<g class="kx-pin"><circle cx="${n(x)}" cy="${n(py)}" r="9" style="fill:var(--bg-elev);stroke:${col};stroke-width:1.5"/>`
      + `<text x="${n(x)}" y="${n(py + 3.6)}" text-anchor="middle" font-size="10" font-weight="700" style="fill:${col}">${i + 1}</text></g>`;
  });

  out += `<path class="kx-glow" d="${d}" fill="none" style="stroke:var(--accent);stroke-width:8;opacity:.16" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>`;
  out += `<path class="ch-line kx-line" d="${d}" fill="none" style="stroke:var(--accent);stroke-width:2.2" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>`;
  out += `<circle class="kx-end-halo" cx="${n(sx(last.m))}" cy="${n(sy(last.p))}" r="10" style="fill:var(--accent)"/>`;
  out += `<circle class="kx-end" cx="${n(sx(last.m))}" cy="${n(sy(last.p))}" r="4" style="fill:var(--accent)"/>`;
  out += `<text class="kx-end-label" x="${n(W - pad.r + 10)}" y="${n(sy(last.p) + fs * 0.35)}" font-size="${fs}" font-weight="700" style="fill:var(--accent)">${n(last.p)}¢</text>`;

  // Hover crosshair (driven by scripts/kalshi-page.ts) and the hit area.
  out += `<g class="kx-hover" style="display:none"><line class="kx-cross" x1="0" x2="0" y1="${n(pad.t)}" y2="${n(pad.t + ih)}"/><circle class="kx-cross-dot" cx="0" cy="0" r="5"/></g>`;
  out += `<rect class="kx-hit" x="${n(pad.l)}" y="${n(pad.t)}" width="${n(iw)}" height="${n(ih)}" fill="transparent"/>`;
  return out + '</svg>';
}

/**
 * Give every <path> and <line> a pathLength="1" so the shared `.draw` CSS (stroke-dasharray 1,
 * offset 1 -> 0) traces it. Dashed helper lines (zero line, trend, markers) are left alone so
 * they keep their dash pattern.
 */
export function drawable(svg: string): string {
  return svg.replace(/<(path|line)\b[^>]*>/g, (tag) => {
    if (/\bpathLength=/.test(tag) || /ch-(zero|trend|marker)/.test(tag)) return tag;
    return tag.replace(/^<(path|line)\b/, '<$1 pathLength="1"');
  });
}

/** Add attributes to the i-th occurrence of an opening tag prefix, e.g. '<circle class="ch-pt"'. */
export function tagInOrder(svg: string, open: string, attrs: (i: number) => string): string {
  let i = 0;
  return svg.split(open).reduce((acc, chunk, idx) => (idx === 0 ? chunk : `${acc}${open} ${attrs(i++)}${chunk}`), '');
}
