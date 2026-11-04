/** Filter chips for the last graded board (all / hits / misses / over / under). */
function init(): void {
  const board = document.getElementById('nba-board');
  if (!board || board.dataset.bound) return;
  board.dataset.bound = '1';
  const chips = Array.from(board.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const rows = Array.from(board.querySelectorAll<HTMLTableRowElement>('tbody tr'));
  const count = board.querySelector<HTMLElement>('[data-board-count]');
  const apply = (f: string): void => {
    let shown = 0;
    let units = 0;
    for (const tr of rows) {
      const on = f === 'all' || tr.dataset.result === f || tr.dataset.side === f;
      tr.hidden = !on;
      if (on) { shown += 1; units += Number(tr.dataset.units) || 0; }
    }
    for (const c of chips) {
      const on = c.dataset.filter === f;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    }
    if (count) {
      const u = `${units > 0 ? '+' : ''}${units.toFixed(2)}u`;
      count.textContent = f === 'all' ? `Showing all ${rows.length} picks · ${u}` : `Showing ${shown} of ${rows.length} picks · ${u}`;
    }
  };
  for (const c of chips) c.addEventListener('click', () => apply(c.dataset.filter || 'all'));
  apply('all');
}

document.addEventListener('astro:page-load', init);
export {};
