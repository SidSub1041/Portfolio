/**
 * Sleeper tab, hero drawing sheet: clicking a treemap cell scrolls to that package group's
 * card and highlights it for a moment. Re-initialised on every page change.
 */
function init() {
  const sheet = document.getElementById('sl-sheet');
  if (!sheet) return;
  const cells = sheet.querySelectorAll<SVGGElement>('.sl-tm__cell');
  const jump = (group: string) => {
    const id = `sl-group-${group.replace(/[()]/g, '') || 'root'}`;
    const card = document.getElementById(id);
    if (!card) return;
    card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    document.querySelectorAll('.sl-card.is-hot').forEach((el) => el.classList.remove('is-hot'));
    card.classList.add('is-hot');
    window.setTimeout(() => card.classList.remove('is-hot'), 2600);
  };
  cells.forEach((cell) => {
    const group = cell.dataset.group || '';
    cell.addEventListener('click', () => jump(group));
    cell.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); jump(group); }
    });
  });
}
document.addEventListener('astro:page-load', init);
export {};
