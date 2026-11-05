/**
 * Sleeper tab hero: the README's three calls type themselves out, one line at a time, with a
 * square cursor. Reduced motion shows all three lines at once.
 */
let timer = 0;
const LINES = [
  'Sleeper sleeper = new SleeperApi();',
  'User user = sleeper.users().getByUsername("sidharth");',
  'List<League> leagues = sleeper.leagues().getAllLeaguesForUserBySeason(user.getUserId(), "2026");',
];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function init() {
  window.clearTimeout(timer);
  const el = document.getElementById('sl-type');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.innerHTML = LINES.map(esc).join('\n'); return; }
  let line = 0, ch = 0;
  const render = (cursor: boolean) => {
    const done = LINES.slice(0, line).map(esc).join('\n');
    const cur = esc(LINES[line]?.slice(0, ch) ?? '');
    el.innerHTML = `${done}${done && line < LINES.length ? '\n' : ''}${cur}${cursor ? '<span class="sl-cursor"></span>' : ''}`;
  };
  const step = () => {
    if (line >= LINES.length) { render(true); return; }
    ch++;
    if (ch > LINES[line].length) { line++; ch = 0; render(true); timer = window.setTimeout(step, 520); return; }
    render(true);
    const c = LINES[line][ch - 1];
    timer = window.setTimeout(step, c === '(' || c === '.' ? 90 : 26 + Math.random() * 30);
  };
  timer = window.setTimeout(step, 500);
}
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => window.clearTimeout(timer));
export {};
