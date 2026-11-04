/**
 * Sleeper tab, live API explorer. Makes the same three calls the README examples wrap,
 * straight from the browser to api.sleeper.app, and renders the results beside the
 * equivalent Java line. Nothing is stored or proxied.
 */
import { java } from '../components/sleeper/highlight';

type Status = 'idle' | 'pending' | 'ok' | 'empty' | 'error';
interface SleeperUser { user_id: string; username: string; display_name?: string; avatar?: string | null }
interface SleeperLeague { league_id: string; name: string; season: string; status?: string; total_rosters?: number; scoring_settings?: Record<string, number>; settings?: Record<string, number>; roster_positions?: string[]; draft_id?: string }
interface SleeperDraft { draft_id: string; league_id?: string; type?: string; status?: string; season?: string; start_time?: number | null; settings?: { rounds?: number; teams?: number }; metadata?: { name?: string; scoring_type?: string } }

const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (ms?: number | null): string => (ms ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'not scheduled');
const title = (s?: string): string => (s ? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');

async function getJson<T>(url: string, ms = 12000): Promise<{ data: T; ms: number }> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const data = (await res.json()) as T;
    return { data, ms: Math.round(performance.now() - t0) };
  } finally {
    window.clearTimeout(timer);
  }
}

function init() {
  const root = document.getElementById('sl-explorer');
  const form = document.getElementById('sl-explorer-form') as HTMLFormElement | null;
  if (!root || !form) return;
  const api = (root.dataset.api || 'https://api.sleeper.app').replace(/\/$/, '');
  const input = document.getElementById('sl-username') as HTMLInputElement;
  const seasonSel = document.getElementById('sl-season') as HTMLSelectElement;
  const run = document.getElementById('sl-run') as HTMLButtonElement;
  const statusEl = document.getElementById('sl-explorer-status') as HTMLElement;
  const steps = {
    user: document.getElementById('sl-step-user') as HTMLElement,
    leagues: document.getElementById('sl-step-leagues') as HTMLElement,
    drafts: document.getElementById('sl-step-drafts') as HTMLElement,
  };
  const labels: Record<Status, string> = { idle: 'waiting', pending: 'calling', ok: 'ok', empty: 'empty', error: 'failed' };

  const setStep = (step: HTMLElement, status: Status, opts: { ms?: number; http?: string; java?: string; out?: string } = {}) => {
    step.dataset.status = status;
    const pill = step.querySelector<HTMLElement>('[data-role=status]');
    if (pill) pill.textContent = labels[status];
    const msEl = step.querySelector<HTMLElement>('[data-role=ms]');
    if (msEl) msEl.textContent = opts.ms !== undefined ? `${opts.ms} ms` : '';
    if (opts.http) { const h = step.querySelector<HTMLElement>('[data-role=http]'); if (h) h.textContent = opts.http; }
    if (opts.java) { const j = step.querySelector<HTMLElement>('[data-role=java]'); if (j) j.innerHTML = java(opts.java); }
    const out = step.querySelector<HTMLElement>('[data-role=out]');
    if (out) out.innerHTML = opts.out ?? '';
  };
  const setStatus = (text: string, tone: '' | 'is-ok' | 'is-error' = '') => { statusEl.textContent = text; statusEl.className = `sl-explorer__status ${tone}`.trim(); };
  const reset = () => {
    setStep(steps.user, 'idle', { http: `GET ${api}/v1/user/{username}`, java: 'User user = sleeper.users().getByUsername({username});' });
    setStep(steps.leagues, 'idle', { http: `GET ${api}/v1/user/{user_id}/leagues/nfl/{season}`, java: 'List<League> leagues = sleeper.leagues().getAllLeaguesForUserBySeason({user_id}, {season});' });
    setStep(steps.drafts, 'idle', { http: `GET ${api}/v1/user/{user_id}/drafts/nfl/{season}`, java: 'List<Draft> drafts = sleeper.drafts().getAllDraftsForUser({user_id}, {season});' });
  };
  const msg = (text: string, kind: '' | 'sl-msg--warn' | 'sl-msg--muted' = '') => `<p class="sl-msg ${kind}">${esc(text)}</p>`;

  const userCard = (u: SleeperUser): string => {
    const name = u.display_name || u.username;
    const avatar = u.avatar ? `<img class="sl-user__mark" src="https://sleepercdn.com/avatars/thumbs/${esc(u.avatar)}" alt="" width="56" height="56" loading="lazy" />` : `<span class="sl-user__mark" aria-hidden="true">${esc(name.slice(0, 2).toUpperCase())}</span>`;
    return `<div class="sl-user">${avatar}<div><div class="sl-user__name">${esc(name)}</div><div class="sl-user__handle">@${esc(u.username)} · user_id ${esc(u.user_id)}</div></div></div>`;
  };
  const leagueCards = (ls: SleeperLeague[]): string => `<div class="sl-res">${ls.map((l) => {
    const rec = l.scoring_settings?.rec;
    const scoring = rec === 1 ? 'PPR' : rec === 0.5 ? 'Half PPR' : rec ? `${rec} PPR` : 'Standard';
    const sf = (l.roster_positions || []).includes('SUPER_FLEX') ? 'Superflex' : null;
    const chips = [`${l.total_rosters ?? '?'} teams`, scoring, sf, title(l.status)].filter(Boolean).map((c) => `<span class="chip">${esc(c)}</span>`).join('');
    return `<div class="sl-res__card"><span class="sl-res__name">${esc(l.name)}</span><span class="sl-res__chips">${chips}</span><span class="sl-res__id"><b>league_id</b> ${esc(l.league_id)}${l.draft_id ? ` · <b>draft_id</b> ${esc(l.draft_id)}` : ''}</span></div>`;
  }).join('')}</div>`;
  const draftCards = (ds: SleeperDraft[]): string => `<div class="sl-res">${ds.map((d) => {
    const chips = [title(d.type), d.settings?.teams ? `${d.settings.teams} teams` : null, d.settings?.rounds ? `${d.settings.rounds} rounds` : null, title(d.status)].filter(Boolean).map((c) => `<span class="chip">${esc(c)}</span>`).join('');
    return `<div class="sl-res__card"><span class="sl-res__name">${esc(d.metadata?.name || 'Draft')}</span><span class="sl-res__chips">${chips}</span><span class="sl-res__id"><b>draft_id</b> ${esc(d.draft_id)} · starts ${esc(fmtDate(d.start_time))}</span></div>`;
  }).join('')}</div>`;

  reset();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const username = input.value.trim();
    const season = seasonSel.value;
    if (!/^[A-Za-z0-9_.-]{1,64}$/.test(username)) { setStatus('Enter a Sleeper username: letters, digits, dots, dashes or underscores.', 'is-error'); input.focus(); return; }
    run.disabled = true;
    reset();
    setStatus(`Calling ${api} from your browser…`);
    try {
      setStep(steps.user, 'pending', { http: `GET ${api}/v1/user/${username}`, java: `User user = sleeper.users().getByUsername("${username}");` });
      const u = await getJson<SleeperUser | null>(`${api}/v1/user/${encodeURIComponent(username)}`);
      if (!u.data || !u.data.user_id) {
        setStep(steps.user, 'empty', { ms: u.ms, out: msg(`Sleeper returned null for "${username}": no user has that username. The Java client would return a null User here and SleeperError on any non-2xx status.`, 'sl-msg--warn') });
        setStatus('No such user. Try a different username.', 'is-error');
        return;
      }
      const user = u.data;
      setStep(steps.user, 'ok', { ms: u.ms, out: userCard(user) });
      const id = user.user_id;
      setStep(steps.leagues, 'pending', { http: `GET ${api}/v1/user/${id}/leagues/nfl/${season}`, java: `List<League> leagues = sleeper.leagues().getAllLeaguesForUserBySeason("${id}", "${season}");` });
      setStep(steps.drafts, 'pending', { http: `GET ${api}/v1/user/${id}/drafts/nfl/${season}`, java: `List<Draft> drafts = sleeper.drafts().getAllDraftsForUser("${id}", "${season}");` });
      const [lg, dr] = await Promise.allSettled([
        getJson<SleeperLeague[]>(`${api}/v1/user/${id}/leagues/nfl/${season}`),
        getJson<SleeperDraft[]>(`${api}/v1/user/${id}/drafts/nfl/${season}`),
      ]);
      if (lg.status === 'fulfilled') {
        const list = Array.isArray(lg.value.data) ? lg.value.data : [];
        setStep(steps.leagues, list.length ? 'ok' : 'empty', { ms: lg.value.ms, out: list.length ? leagueCards(list) : msg(`No NFL leagues for ${season}. The client would return an empty List<League>.`, 'sl-msg--muted') });
      } else setStep(steps.leagues, 'error', { out: msg(`The leagues call failed: ${lg.reason instanceof Error ? lg.reason.message : 'network error'}.`) });
      if (dr.status === 'fulfilled') {
        const list = Array.isArray(dr.value.data) ? dr.value.data : [];
        setStep(steps.drafts, list.length ? 'ok' : 'empty', { ms: dr.value.ms, out: list.length ? draftCards(list) : msg(`No drafts for ${season}. The client would return an empty List<Draft>.`, 'sl-msg--muted') });
      } else setStep(steps.drafts, 'error', { out: msg(`The drafts call failed: ${dr.reason instanceof Error ? dr.reason.message : 'network error'}.`) });
      const nL = lg.status === 'fulfilled' && Array.isArray(lg.value.data) ? lg.value.data.length : 0;
      const nD = dr.status === 'fulfilled' && Array.isArray(dr.value.data) ? dr.value.data.length : 0;
      setStatus(`Done: ${user.display_name || user.username}, ${nL} league${nL === 1 ? '' : 's'} and ${nD} draft${nD === 1 ? '' : 's'} in ${season}.`, 'is-ok');
    } catch (err) {
      const reason = err instanceof DOMException && err.name === 'AbortError' ? 'the request timed out after 12 seconds' : err instanceof Error ? err.message : 'network error';
      setStep(steps.user, 'error', { out: msg(`Could not reach api.sleeper.app from this browser: ${reason}. A blocked network, an ad blocker or a cross-origin policy can cause this; the Java client would throw SleeperError with the status and URL.`) });
      setStatus('The call did not go through.', 'is-error');
    } finally {
      run.disabled = false;
    }
  });
}
document.addEventListener('astro:page-load', init);
