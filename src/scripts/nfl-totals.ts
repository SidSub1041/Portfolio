/**
 * NFL Game Totals tab: the edge-threshold slider that re-draws the dumbbell chart's
 * recommendation bands, the hover readout for the EPA scatter, and a brief highlight on
 * the game card a hero slate row points at. Re-initialised on every astro:page-load.
 */
const minus = (s: string) => s.replace('-', '−');
const signed = (v: number, d: number) => minus(`${v > 0 ? '+' : ''}${v.toFixed(d)}`);
const recFor = (edge: number, t: number): 'over' | 'under' | 'hold' => (edge > t ? 'over' : edge < -t ? 'under' : 'hold');

function initThreshold(root: HTMLElement) {
  const slider = root.querySelector<HTMLInputElement>('#nfl-threshold');
  const svg = root.querySelector<SVGSVGElement>('.nfl-db');
  if (!slider || !svg) return;
  const ppp = parseFloat(svg.dataset.ppp || '0');
  const rows = Array.from(svg.querySelectorAll<SVGGElement>('.nfl-db__row'));
  const value = root.querySelector<HTMLElement>('#nfl-threshold-value');
  const counts = {
    over: root.querySelector<HTMLElement>('#nfl-count-over'),
    under: root.querySelector<HTMLElement>('#nfl-count-under'),
    hold: root.querySelector<HTMLElement>('#nfl-count-hold'),
  };
  const note = root.querySelector<HTMLElement>('#nfl-threshold-note');
  const reset = root.querySelector<HTMLButtonElement>('#nfl-threshold-reset');

  const apply = () => {
    const t = parseFloat(slider.value);
    if (value) value.textContent = `±${t.toFixed(1)}`;
    const n = { over: 0, under: 0, hold: 0 };
    for (const row of rows) {
      const edge = parseFloat(row.dataset.edge || '0');
      const vx = parseFloat(row.dataset.vegasX || '0');
      const rec = recFor(edge, t);
      n[rec] += 1;
      row.dataset.rec = rec;
      const band = row.querySelector<SVGRectElement>('.nfl-db__band');
      if (band) {
        band.setAttribute('x', (vx - t * ppp).toFixed(2));
        band.setAttribute('width', (2 * t * ppp).toFixed(2));
      }
      const label = row.querySelector<SVGTextElement>('.nfl-db__rec');
      if (label) { label.textContent = rec.toUpperCase(); label.dataset.rec = rec; }
    }
    (Object.keys(n) as Array<keyof typeof n>).forEach((k) => { const el = counts[k]; if (el) el.textContent = String(n[k]); });
    const isDefault = Math.abs(t - 2) < 1e-9;
    if (note) note.hidden = isDefault;
    if (reset) reset.hidden = isDefault;
    slider.setAttribute('aria-valuetext', `plus or minus ${t.toFixed(1)} points`);
  };
  slider.addEventListener('input', apply);
  reset?.addEventListener('click', () => { slider.value = '2'; apply(); slider.focus(); });
  apply();
}

function initScatter(root: HTMLElement) {
  const readout = root.querySelector<HTMLElement>('#nfl-readout');
  if (!readout) return;
  const idle = readout.innerHTML;
  const points = Array.from(root.querySelectorAll<SVGGElement>('.nfl-pt'));
  const line = (k: string, v: string) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    return [dt, dd];
  };
  const show = (pt: SVGGElement) => {
    const d = pt.dataset;
    readout.replaceChildren();
    const head = document.createElement('div');
    head.className = 'nfl-readout__head';
    const mark = document.createElement('span');
    mark.className = `nfl-tm nfl-tm--sm nfl-tm--${d.abbr}`;
    mark.textContent = d.abbr || '';
    mark.setAttribute('aria-hidden', 'true');
    const name = document.createElement('b');
    name.textContent = `${d.name} (${d.abbr})`;
    head.append(mark, name);
    const dl = document.createElement('dl');
    dl.className = 'nfl-readout__dl';
    dl.append(
      ...line('Off EPA/play', signed(parseFloat(d.off || '0'), 4)),
      ...line('Def EPA/play', signed(parseFloat(d.def || '0'), 4)),
      ...line('Pass / rush EPA', `${signed(parseFloat(d.offPass || '0'), 1)} / ${signed(parseFloat(d.offRush || '0'), 1)}`),
      ...line('Def pass / rush', `${signed(parseFloat(d.defPass || '0'), 1)} / ${signed(parseFloat(d.defRush || '0'), 1)}`),
      ...line('Plays off / def', `${Number(d.playsOff).toLocaleString('en-US')} / ${Number(d.playsDef).toLocaleString('en-US')}`),
    );
    readout.append(head, dl);
    points.forEach((p) => p.classList.toggle('is-active', p === pt));
    readout.classList.add('is-on');
  };
  const hide = () => {
    readout.innerHTML = idle;
    readout.classList.remove('is-on');
    points.forEach((p) => p.classList.remove('is-active'));
  };
  for (const pt of points) {
    pt.addEventListener('mouseenter', () => show(pt));
    pt.addEventListener('focus', () => show(pt));
    pt.addEventListener('mouseleave', hide);
    pt.addEventListener('blur', hide);
    pt.addEventListener('click', () => show(pt));
  }
}

function initSlate(root: HTMLElement) {
  root.querySelectorAll<HTMLAnchorElement>('.slate__row[href^="#"]').forEach((a) => {
    a.addEventListener('click', () => {
      const target = document.getElementById(a.getAttribute('href')!.slice(1));
      if (!target) return;
      target.classList.add('is-flash');
      setTimeout(() => target.classList.remove('is-flash'), 1600);
    });
  });
}

function init() {
  const root = document.getElementById('nfl-page');
  if (!root) return;
  initThreshold(root);
  initScatter(root);
  initSlate(root);
}

document.addEventListener('astro:page-load', init);
export {};
