/**
 * Draft Copilot tab: ADP consumption curves.
 *
 * `logLogCurve` is a line-for-line port of `LogLogCurve` in server/ffbot/curves.py of
 * SidSub1041/ff-draft-bot: monotone piecewise-linear interpolation through anchors in log-log
 * space; beyond the last anchor it extrapolates with the final segment's slope. `adpChart` draws
 * the positional curves from src/data/draft.json as an SVG string, so the same code renders at
 * build time (Astro frontmatter) and again in the browser (draft-adp.ts) when the controls change.
 */

export const POSITIONS = ['RB', 'WR', 'QB', 'TE', 'K', 'DEF'] as const;
export type Pos = (typeof POSITIONS)[number];
export type AnchorMap = Record<string, number[][]>;
export type Curve = (rank: number) => number;

/** The anchors describe a 12-team league (ffbot/adp.py); `ffbot mock` defaults to 15 rounds. */
export const TEAMS = 12;
export const ROUNDS = 15;
export const LAST_PICK = TEAMS * ROUNDS;

/** How deep each curve is read: the guide ranks 60 RB, 60 WR, 32 QB and 32 TE; K and DEF are one per team. */
export const MAX_RANK: Record<Pos, number> = { RB: 60, WR: 60, QB: 32, TE: 32, K: 12, DEF: 12 };
export const POS_NAME: Record<Pos, string> = {
  RB: 'Running backs', WR: 'Wide receivers', QB: 'Quarterbacks', TE: 'Tight ends', K: 'Kickers', DEF: 'Defenses',
};

/**
 * Series colours are theme tokens (or mixes of them) stepped apart in lightness so the pairs stay
 * apart under red-green colour blindness; K and DEF share an ink and differ by dash texture, and
 * every curve carries a direct label, so identity never rests on colour alone.
 */
export const SERIES_COLOR: Record<Pos, string> = {
  RB: 'var(--accent)',
  WR: 'var(--neg)',
  QB: 'color-mix(in srgb, var(--hl) 40%, var(--fg))',
  TE: 'color-mix(in srgb, var(--accent) 65%, var(--bg-elev))',
  K: 'var(--fg-3)',
  DEF: 'var(--fg-3)',
};
export const SERIES_DASH: Partial<Record<Pos, string>> = { K: '7 5', DEF: '2 5' };

function bisectLeft(arr: number[], v: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Port of ffbot.curves.LogLogCurve.__init__ and __call__. */
export function logLogCurve(anchors: number[][]): Curve {
  const pts = anchors
    .filter(([x, y]) => x > 0 && y > 0)
    .map(([x, y]) => [x, y] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 2) throw new Error('need >= 2 anchors');
  const xs = pts.map(([x]) => Math.log(x));
  const ys = pts.map(([, y]) => Math.log(y));
  return (x: number) => {
    if (x <= 0) x = 0.5;
    const lx = Math.log(x);
    let i = bisectLeft(xs, lx);
    if (i === 0) i = 1;
    else if (i >= xs.length) i = xs.length - 1;
    const x0 = xs[i - 1];
    const x1 = xs[i];
    const y0 = ys[i - 1];
    const y1 = ys[i];
    const t = x1 !== x0 ? (lx - x0) / (x1 - x0) : 0;
    return Math.exp(y0 + t * (y1 - y0));
  };
}

export interface AdpState {
  anchors: AnchorMap;
  superflexQb: number[][];
  superflex: boolean;
  selected: Pos;
  rank: number;
  narrow?: boolean;
}

export const anchorsFor = (s: AdpState, pos: Pos): number[][] =>
  (pos === 'QB' && s.superflex ? s.superflexQb : s.anchors[pos]) ?? [];

export function pickToRound(pick: number, teams = TEAMS): { round: number; slot: number } {
  const round = Math.max(1, Math.ceil(pick / teams));
  return { round, slot: pick - (round - 1) * teams };
}

export interface Reading {
  pos: Pos;
  rank: number;
  pick: number;
  exact: number;
  round: number;
  slot: number;
  beyond: boolean;
  kind: 'anchor' | 'between' | 'beyond';
  lo: number;
  hi: number;
}

/** What the selected curve says at the selected rank, plus how that number was produced. */
export function readCurve(s: AdpState): Reading {
  const anchors = [...anchorsFor(s, s.selected)].sort((a, b) => a[0] - b[0]);
  const curve = logLogCurve(anchors);
  const exact = curve(s.rank);
  const pick = Math.round(exact);
  const xs = anchors.map((a) => a[0]);
  const last = xs[xs.length - 1];
  const kind: Reading['kind'] = xs.includes(s.rank) ? 'anchor' : s.rank > last ? 'beyond' : 'between';
  const lo = xs.filter((x) => x < s.rank).pop() ?? xs[0];
  const hi = xs.find((x) => x > s.rank) ?? last;
  const { round, slot } = pickToRound(pick);
  return { pos: s.selected, rank: s.rank, pick, exact, round, slot, beyond: pick > LAST_PICK, kind, lo, hi };
}

/* ---------------------------------------------------------------- drawing */

export interface Geo { W: number; H: number; t: number; r: number; b: number; l: number; fs: number }

export const geometry = (narrow = false): Geo =>
  narrow
    ? { W: 420, H: 500, t: 20, r: 50, b: 50, l: 44, fs: 12 }
    : { W: 820, H: 440, t: 22, r: 80, b: 50, l: 58, fs: 11.5 };

export function scales(g: Geo) {
  const iw = g.W - g.l - g.r;
  const ih = g.H - g.t - g.b;
  const x0 = 1;
  const x1 = 60;
  const y0 = 0;
  const y1 = LAST_PICK;
  return {
    iw, ih, x0, x1, y0, y1,
    sx: (rank: number) => g.l + ((rank - x0) / (x1 - x0)) * iw,
    sy: (pick: number) => g.t + ((pick - y0) / (y1 - y0)) * ih,
    rankAt: (px: number) => x0 + ((px - g.l) / iw) * (x1 - x0),
  };
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v: number): string => (Math.round(v * 100) / 100).toString();

export interface CursorLayout { x: number; y: number; label: string; tag: { x: number; y: number; w: number; h: number }; color: string }

/** Where the crosshair, dot and tag sit for the current state (shared by build-time and client renders). */
export function cursorLayout(s: AdpState): CursorLayout {
  const g = geometry(s.narrow);
  const sc = scales(g);
  const pick = logLogCurve(anchorsFor(s, s.selected))(s.rank);
  const x = sc.sx(s.rank);
  const y = sc.sy(Math.min(pick, LAST_PICK));
  const label = pick > LAST_PICK ? `${s.selected}${s.rank}: past pick ${LAST_PICK}` : `${s.selected}${s.rank}: pick ${Math.round(pick)}`;
  const w = label.length * g.fs * 0.64 + 18;
  const h = g.fs + 12;
  let tx = x + 12;
  if (tx + w > g.W - 2) tx = x - 12 - w;
  let ty = y - h - 10;
  if (ty < 2) ty = y + 14;
  return { x, y, label, tag: { x: tx, y: ty, w, h }, color: SERIES_COLOR[s.selected] };
}

interface Trace {
  pos: Pos;
  d: string;
  end: { rank: number; pick: number; exit: 'right' | 'bottom' | 'end' };
  curve: Curve;
  anchors: number[][];
  color: string;
  dash?: string;
  ghost: boolean;
  label: string;
}

function trace(pos: Pos, anchors: number[][], label: string, ghost: boolean, sc: ReturnType<typeof scales>): Trace {
  const curve = logLogCurve(anchors);
  const maxRank = MAX_RANK[pos];
  let d = '';
  let last = { rank: 1, pick: curve(1) };
  let exit: Trace['end']['exit'] = 'end';
  for (let r = 1; r <= maxRank + 1e-9; r += 0.25) {
    const p = curve(r);
    if (p > LAST_PICK) {
      // cross the bottom edge exactly, then stop
      const t = (LAST_PICK - last.pick) / (p - last.pick);
      const rc = last.rank + t * (r - last.rank);
      d += ` L${n(sc.sx(rc))} ${n(sc.sy(LAST_PICK))}`;
      last = { rank: rc, pick: LAST_PICK };
      exit = 'bottom';
      break;
    }
    d += `${d ? ' L' : 'M'}${n(sc.sx(r))} ${n(sc.sy(p))}`;
    last = { rank: r, pick: p };
  }
  if (exit === 'end' && last.rank >= sc.x1 - 1e-9) exit = 'right';
  return { pos, d, end: { ...last, exit }, curve, anchors, color: SERIES_COLOR[pos], dash: SERIES_DASH[pos], ghost, label };
}

/** The whole chart as an SVG string. */
export function adpChart(s: AdpState): string {
  const g = geometry(s.narrow);
  const sc = scales(g);
  const { sx, sy, iw, ih } = sc;
  const fs = g.fs;
  const order: Pos[] = ['DEF', 'K', 'TE', 'QB', 'WR', 'RB'];
  const traces: Trace[] = [];
  if (s.superflex) traces.push(trace('QB', s.anchors.QB ?? [], 'QB (1-QB)', true, sc));
  for (const pos of order) {
    if (pos === s.selected) continue;
    traces.push(trace(pos, anchorsFor(s, pos), pos === 'QB' && s.superflex ? 'QB (SF)' : pos, false, sc));
  }
  traces.push(trace(s.selected, anchorsFor(s, s.selected), s.selected === 'QB' && s.superflex ? 'QB (SF)' : s.selected, false, sc));

  const reading = readCurve(s);
  const aria = `ADP consumption curves for a ${TEAMS}-team league: overall pick by positional rank for RB, WR, QB${s.superflex ? ' in a superflex room' : ''}, TE, K and DEF. ${s.selected}${s.rank} reads ${reading.beyond ? `past pick ${LAST_PICK}` : `pick ${reading.pick}`}.`;
  let out = `<svg class="ch dc-adp-svg" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="${esc(aria)}" preserveAspectRatio="xMidYMid meet">`;
  out += `<defs><clipPath id="adp-clip"><rect x="${n(g.l)}" y="${n(g.t)}" width="${n(iw)}" height="${n(ih)}"/></clipPath></defs>`;

  // Round bands and labels: the y axis is the draft board, pick 1 at the top.
  for (let r = 1; r <= ROUNDS; r++) {
    const top = sy((r - 1) * TEAMS);
    const bottom = sy(r * TEAMS);
    out += `<rect class="ch-band${r % 2 === 0 ? ' ch-band--alt' : ''}" x="${n(g.l)}" y="${n(top)}" width="${n(iw)}" height="${n(bottom - top)}"/>`;
    out += `<text class="ch-tick" x="${n(g.l - 8)}" y="${n((top + bottom) / 2 + fs * 0.35)}" text-anchor="end" font-size="${fs}">R${r}</text>`;
  }
  // Positional-rank grid.
  for (const r of [1, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60]) {
    out += `<line class="ch-grid" x1="${n(sx(r))}" x2="${n(sx(r))}" y1="${n(g.t)}" y2="${n(g.t + ih)}"/>`;
    out += `<text class="ch-tick" x="${n(sx(r))}" y="${n(g.t + ih + 16)}" text-anchor="middle" font-size="${fs}">${r}</text>`;
  }
  out += `<line class="ch-axis" x1="${n(g.l)}" x2="${n(g.l + iw)}" y1="${n(g.t + ih)}" y2="${n(g.t + ih)}"/>`;
  out += `<line class="ch-axis" x1="${n(g.l)}" x2="${n(g.l)}" y1="${n(g.t)}" y2="${n(g.t + ih)}"/>`;
  out += `<text class="ch-title" x="${n(g.l + iw / 2)}" y="${n(g.H - 8)}" text-anchor="middle" font-size="${fs}">Positional rank: the Nth player taken at the position</text>`;

  // Curves.
  out += `<g clip-path="url(#adp-clip)">`;
  for (const t of traces) {
    const selected = t.pos === s.selected && !t.ghost;
    const style = `stroke:${t.color};stroke-width:${selected ? 3.2 : 2};${t.dash ? `stroke-dasharray:${t.dash};` : ''}${t.ghost ? 'stroke-dasharray:4 4;opacity:.45;' : selected ? '' : 'opacity:.78;'}`;
    out += `<path class="ch-line${selected ? ' is-selected' : ''}" data-pos="${t.pos}" d="${t.d}" style="${style}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  out += `</g>`;

  // Anchor dots on the selected series.
  const sel = traces[traces.length - 1];
  for (const [r, p] of sel.anchors) {
    if (p > LAST_PICK || r > MAX_RANK[sel.pos]) continue;
    out += `<circle class="ch-anchor" cx="${n(sx(r))}" cy="${n(sy(p))}" r="4.5" style="fill:${sel.color}"/>`;
  }

  // Direct labels: at the point where each curve leaves the plot (or ends), K and DEF at their start.
  const labels: { x: number; y: number; text: string; cls: string; anchor: 'start' | 'end' }[] = [];
  for (const t of traces) {
    const cls = `ch-end${t.pos === s.selected && !t.ghost ? ' is-selected' : ''}${t.ghost ? ' is-ghost' : ''}`;
    if (t.pos === 'K') labels.push({ x: sx(1) + 8, y: sy(t.curve(1)) + fs + 4, text: t.label, cls, anchor: 'start' });
    else if (t.pos === 'DEF') labels.push({ x: sx(1) + 8, y: sy(t.curve(1)) - 7, text: t.label, cls, anchor: 'start' });
    else if (t.end.exit === 'bottom') labels.push({ x: sx(t.end.rank) + 7, y: sy(LAST_PICK) - 8, text: t.label, cls, anchor: 'start' });
    else labels.push({ x: sx(t.end.rank) + 8, y: sy(t.end.pick) + fs * 0.35, text: t.label, cls, anchor: 'start' });
  }
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    const a = labels[i - 1];
    const b = labels[i];
    if (Math.abs(a.x - b.x) < 44 && b.y - a.y < fs + 3) b.y = a.y + fs + 3;
  }
  for (const l of labels) out += `<text class="${l.cls}" x="${n(l.x)}" y="${n(l.y)}" text-anchor="${l.anchor}" font-size="${fs}">${esc(l.text)}</text>`;

  // Crosshair, dot and tag for the current reading.
  const c = cursorLayout(s);
  out += `<g id="adp-cursor">`;
  out += `<line id="adp-cur-v" class="ch-cursor" x1="${n(c.x)}" x2="${n(c.x)}" y1="${n(g.t)}" y2="${n(g.t + ih)}"/>`;
  out += `<line id="adp-cur-h" class="ch-cursor" x1="${n(g.l)}" x2="${n(c.x)}" y1="${n(c.y)}" y2="${n(c.y)}"/>`;
  out += `<circle id="adp-cur-dot" class="ch-cursor-dot" cx="${n(c.x)}" cy="${n(c.y)}" r="6.5" style="fill:${c.color}"/>`;
  out += `<g class="ch-tag"><rect id="adp-cur-tag-rect" x="${n(c.tag.x)}" y="${n(c.tag.y)}" width="${n(c.tag.w)}" height="${n(c.tag.h)}" rx="4"/>`;
  out += `<text id="adp-cur-tag-text" x="${n(c.tag.x + 9)}" y="${n(c.tag.y + c.tag.h - 8)}" font-size="${fs}">${esc(c.label)}</text></g>`;
  out += `</g></svg>`;
  return out;
}
