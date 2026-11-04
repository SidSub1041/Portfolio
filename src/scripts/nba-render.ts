/**
 * Pure rendering helpers for the NBA tab. The page uses them at build time and
 * src/scripts/nba-live.ts uses the same functions after a live refresh, so the
 * snapshot and the live view are drawn by identical code.
 * The aggregations mirror scripts/extract_data.py (totals, cumulative units).
 */
import { lineChart, barChart } from '../lib/chart';
import { fmtUnits, fmtDate, fmtShortDate } from '../lib/format';

export interface DayRow { date: string; season: string; picks: number; hits: number; misses: number; voided: number; units: number }
export interface DayRef { date: string; units: number }
export interface SeasonTotals {
  picks: number; hits: number; misses: number; voided: number; units: number; hitRate: number | null; gradedDays: number;
  bestDay: DayRef | null; worstDay: DayRef | null; first: string | null; last: string | null;
}
export interface CumPoint { date: string; cum: number }

export const round = (v: number, d: number): number => Math.round(v * 10 ** d) / 10 ** d;
export const signed = (v: number, d = 2): string => `${v > 0 ? '+' : ''}${v.toFixed(d)}`;
export const pct1 = (p: number | null | undefined): string => (p == null ? '—' : `${(p * 100).toFixed(1)}%`);
export const tone = (v: number): string => (v > 0 ? 'text-pos' : v < 0 ? 'text-neg' : '');
/** October starts a new season (src/config.py derives the season from the run date). */
export const seasonOf = (date: string): string => {
  const y = Number(date.slice(0, 4));
  const start = Number(date.slice(5, 7)) >= 10 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};
export const spanOf = (s: { first: string | null; last: string | null }): string =>
  s.first && s.last ? `${fmtShortDate(s.first)} – ${fmtDate(s.last)}` : '—';

/** Season totals, computed the way scripts/extract_data.py computes them. */
export function totals(rows: DayRow[]): SeasonTotals {
  const picks = rows.reduce((a, x) => a + x.picks, 0);
  const hits = rows.reduce((a, x) => a + x.hits, 0);
  const misses = rows.reduce((a, x) => a + x.misses, 0);
  const voided = rows.reduce((a, x) => a + x.voided, 0);
  const units = round(rows.reduce((a, x) => a + (x.units || 0), 0), 2);
  const gradedDays = rows.filter((x) => x.picks > 0).length;
  let best: DayRow | null = null;
  let worst: DayRow | null = null;
  for (const x of rows) {
    if (!best || x.units > best.units) best = x;
    if (!worst || x.units < worst.units) worst = x;
  }
  return {
    picks, hits, misses, voided, units,
    hitRate: picks ? round(hits / picks, 4) : null,
    gradedDays,
    bestDay: best ? { date: best.date, units: best.units } : null,
    worstDay: worst ? { date: worst.date, units: worst.units } : null,
    first: rows[0]?.date ?? null,
    last: rows[rows.length - 1]?.date ?? null,
  };
}

export function cumulative(rows: DayRow[]): CumPoint[] {
  let run = 0;
  return rows.map((d) => { run += d.units || 0; return { date: d.date, cum: round(run, 2) }; });
}

/** `.draw` animates strokes by dash offset, which needs pathLength="1" on the path. */
const drawable = (svg: string): string => svg.replace(/<path class="ch-line"/g, '<path class="ch-line" pathLength="1"');

/** The hero backdrop: the season's cumulative units as a large, label-free area chart. */
export function heroChartSvg(cum: CumPoint[], seasonKey: string, units: number): string {
  return drawable(lineChart({
    width: 1400, height: 400, pad: { t: 40, r: 0, b: 0, l: 0 },
    series: [{ points: cum.map((d, i) => ({ x: i, y: d.cum })), color: 'var(--accent)', area: true, width: 3 }],
    zeroLine: true, grid: false, xTicks: 1, yTicks: 1,
    ariaLabel: `Cumulative units by graded day, ${seasonKey} season, ending at ${fmtUnits(units)}`,
    className: 'nba-hero__svg',
  }));
}

/** Cumulative units by graded day for the current season, with last season dashed for scale. */
export function recordChartSvg(cur: CumPoint[], prev: CumPoint[], curKey: string, prevKey: string): string {
  const endCur = cur[cur.length - 1]?.cum ?? 0;
  const endPrev = prev[prev.length - 1]?.cum ?? 0;
  return lineChart({
    width: 800, height: 340, fontSize: 12,
    series: [
      { points: prev.map((d, i) => ({ x: i + 1, y: d.cum })), color: 'var(--hl)', width: 2, dash: '6 5', label: prevKey, dots: true, opacity: 0.9 },
      { points: cur.map((d, i) => ({ x: i + 1, y: d.cum })), color: 'var(--accent)', width: 2.5, area: true, label: curKey, dots: true },
    ],
    zeroLine: true, endLabels: true, xTicks: 7,
    xFmt: (v) => `Day ${Math.round(v)}`,
    yFmt: (v) => `${v > 0 ? '+' : ''}${v}u`,
    ariaLabel: `Cumulative units by graded day: ${curKey} ends at ${fmtUnits(endCur)} after ${cur.length} days; ${prevKey} ended at ${fmtUnits(endPrev)} after ${prev.length} days`,
  });
}

/** Units won or lost on each graded day of a season. */
export function dailyChartSvg(days: DayRow[], seasonKey: string): string {
  return barChart({
    width: 800, height: 280, fontSize: 11, gap: 0.34, pad: { l: 48 },
    categories: days.map((d) => fmtShortDate(d.date)),
    series: [{ values: days.map((d) => d.units), color: days.map((d) => (d.units >= 0 ? 'var(--pos)' : 'var(--neg)')) }],
    valueFmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`,
    ariaLabel: `Units won or lost on each graded day of the ${seasonKey} season`,
  });
}

/** Rows of the seasons table (season rows, then all time). */
export function seasonsRowsHtml(seasons: [string, SeasonTotals][], all: SeasonTotals, current: string): string {
  const day = (d: DayRef | null) => (d ? `${fmtUnits(d.units)} <span class="muted">${fmtShortDate(d.date)}</span>` : '—');
  const row = (label: string, s: SeasonTotals, isCur: boolean, isAll = false) =>
    `<tr${isAll ? ' class="nba-seasons__all"' : ''}>` +
    `<th scope="row"><span class="nba-seasons__name">${label}${isCur ? ' <span class="badge badge--live">live</span>' : ''}</span><span class="nba-seasons__span">${spanOf(s)}</span></th>` +
    `<td class="num">${s.picks}</td>` +
    `<td class="num"><b>${s.hits}–${s.misses}</b></td>` +
    `<td class="num">${s.voided}</td>` +
    `<td class="num">${pct1(s.hitRate)}</td>` +
    `<td class="num ${tone(s.units)}"><b>${fmtUnits(s.units)}</b></td>` +
    `<td class="num">${s.gradedDays}</td>` +
    `<td class="num text-pos">${day(s.bestDay)}</td>` +
    `<td class="num text-neg">${day(s.worstDay)}</td>` +
    `</tr>`;
  return seasons.map(([k, s]) => row(k, s, k === current)).join('') + row('All time', all, false, true);
}
