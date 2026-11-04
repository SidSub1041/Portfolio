export const fmtUnits = (u: number | null | undefined, digits = 2): string =>
  u == null ? '—' : `${u > 0 ? '+' : ''}${u.toFixed(digits)}u`;

export const fmtSigned = (v: number | null | undefined, digits = 1, suffix = ''): string =>
  v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(digits)}${suffix}`;

export const fmtPct = (p: number | null | undefined, digits = 0): string =>
  p == null ? '—' : `${(p * 100).toFixed(digits)}%`;

export const fmtInt = (n: number | null | undefined): string =>
  n == null ? '—' : n.toLocaleString('en-US');

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string =>
  new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

export const fmtShortDate = (iso: string): string => fmtDate(iso, { month: 'short', day: 'numeric' });

export const STAT_LABELS: Record<string, string> = {
  points: 'PTS', rebounds: 'REB', assists: 'AST', 'pts+ast': 'PTS+AST', 'pts+reb': 'PTS+REB', 'reb+ast': 'REB+AST', pra: 'PRA',
};
export const statLabel = (s: string): string => STAT_LABELS[s] ?? s.toUpperCase();

export const EVENT_LABELS: Record<string, string> = {
  home_run: 'Home run', scoring_play: 'Any scoring play', walk_hbp: 'Walk / HBP', single: 'Single', xbh: 'Double / triple',
  strikeout: 'Strikeout', out_in_play: 'Out in play',
};
export const eventLabel = (g: string): string => EVENT_LABELS[g] ?? g;
