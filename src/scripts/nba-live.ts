/**
 * "Refresh from the live repo": fetches results_history.json from the project's GitHub
 * repository in the visitor's browser (raw.githubusercontent.com allows cross-origin
 * reads), recomputes the season totals the way scripts/extract_data.py does, and
 * re-renders the numbers, charts and table in place. If the fetch fails, the page keeps
 * the build-time snapshot and says which date it is from.
 */
import { totals, cumulative, seasonOf, heroChartSvg, recordChartSvg, dailyChartSvg, seasonsRowsHtml, pct1, tone, spanOf, type DayRow, type SeasonTotals } from './nba-render';
import { fmtUnits, fmtDate, fmtShortDate } from '../lib/format';

interface LiveRow { date?: unknown; season?: unknown; total_picks?: unknown; hits?: unknown; misses?: unknown; voided?: unknown; units?: unknown }

const all = <T extends HTMLElement>(sel: string): T[] => Array.from(document.querySelectorAll<T>(sel));

/** Writes a value into every element tagged data-live="key"; keeps count-up targets in sync. */
function set(key: string, text: string, cls?: string): void {
  for (const el of all(`[data-live="${key}"]`)) {
    el.textContent = text;
    if (cls !== undefined) { el.classList.remove('text-pos', 'text-neg'); if (cls) el.classList.add(cls); }
    if (el.dataset.count !== undefined) el.dataset.count = String(parseFloat(text.replace('−', '-')));
  }
}

function toDay(r: LiveRow): DayRow {
  const date = String(r.date ?? '');
  return {
    date,
    season: typeof r.season === 'string' && r.season ? r.season : seasonOf(date),
    picks: Number(r.total_picks) || 0, hits: Number(r.hits) || 0, misses: Number(r.misses) || 0,
    voided: Number(r.voided) || 0, units: Number(r.units) || 0,
  };
}

async function refresh(root: HTMLElement, btn: HTMLButtonElement, status: HTMLElement): Promise<void> {
  const src = root.dataset.src || '';
  const snapshot = root.dataset.snapshot || 'the build';
  const label = btn.querySelector<HTMLElement>('[data-live-label]');
  btn.disabled = true;
  btn.classList.add('is-loading');
  if (label) label.textContent = 'Refreshing…';
  status.textContent = 'Fetching results_history.json from GitHub…';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(src, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('unexpected file shape');
    const days = (raw as LiveRow[]).map(toDay).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)).sort((a, b) => a.date.localeCompare(b.date));
    if (!days.length) throw new Error('no graded days in the file');

    const keys = Array.from(new Set(days.map((d) => d.season))).sort();
    const cur = keys[keys.length - 1];
    const prev = keys.length > 1 ? keys[keys.length - 2] : cur;
    const bySeason = keys.map((k) => [k, totals(days.filter((d) => d.season === k))] as [string, SeasonTotals]);
    const curT = bySeason[bySeason.length - 1][1];
    const prevT = (bySeason.find(([k]) => k === prev) ?? bySeason[0])[1];
    const allT = totals(days);
    const cumCur = cumulative(days.filter((d) => d.season === cur));
    const cumPrev = cumulative(days.filter((d) => d.season === prev));

    set('season-key', cur);
    set('season-record', `${curT.hits}–${curT.misses}`);
    set('season-voided', String(curT.voided));
    set('season-units', fmtUnits(curT.units), tone(curT.units));
    set('season-hitrate', pct1(curT.hitRate));
    set('season-days', String(curT.gradedDays));
    set('season-picks', String(curT.picks));
    set('season-span', spanOf(curT));
    set('season-best', curT.bestDay ? `${fmtUnits(curT.bestDay.units)} (${fmtShortDate(curT.bestDay.date)})` : '—');
    set('season-worst', curT.worstDay ? `${fmtUnits(curT.worstDay.units)} (${fmtShortDate(curT.worstDay.date)})` : '—');
    set('prev-line', `Last season (${prev}): ${prevT.hits}–${prevT.misses}, ${fmtUnits(prevT.units)} over ${prevT.gradedDays} graded days. All time: ${allT.hits}–${allT.misses}, ${fmtUnits(allT.units)}.`);
    for (const el of all('[data-live="hero-chart"]')) { el.innerHTML = heroChartSvg(cumCur, cur, curT.units); el.classList.add('is-in'); }
    for (const el of all('[data-live="record-chart"]')) el.innerHTML = recordChartSvg(cumCur, cumPrev, cur, prev);
    for (const el of all('[data-live="daily-chart"]')) el.innerHTML = dailyChartSvg(days.filter((d) => d.season === cur), cur);
    for (const el of all('[data-live="seasons-rows"]')) el.innerHTML = seasonsRowsHtml(bySeason, allT, cur);
    const when = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    set('as-of', `Live from GitHub at ${when}`);
    status.textContent = `Refreshed from the repository: ${days.length} graded days through ${fmtDate(allT.last ?? days[days.length - 1].date)}.`;
    root.dataset.liveState = 'live';
    if (label) label.textContent = 'Refreshed from GitHub';
  } catch (err) {
    const e = err as Error;
    const why = e.name === 'AbortError' ? 'timed out after 10 seconds' : e.message || 'network error';
    status.textContent = `Could not reach the live repository (${why}). Showing the snapshot taken ${snapshot}.`;
    root.dataset.liveState = 'error';
    if (label) label.textContent = 'Try again';
  } finally {
    clearTimeout(timer);
    btn.disabled = false;
    btn.classList.remove('is-loading');
  }
}

function init(): void {
  const root = document.getElementById('nba-live');
  if (!root) return;
  const btn = root.querySelector<HTMLButtonElement>('[data-live-button]');
  const status = root.querySelector<HTMLElement>('[data-live-status]');
  if (!btn || !status || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => { void refresh(root, btn, status); });
}

document.addEventListener('astro:page-load', init);
