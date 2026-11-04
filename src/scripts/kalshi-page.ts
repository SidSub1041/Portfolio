/**
 * Client behaviour for the Kalshi MLB tab:
 * - hero chart: a crosshair that follows the pointer and a readout of the price at that
 *   minute, naming the last scoring play when one just happened;
 * - reaction path: legend chips that isolate or hide series;
 * - momentum scatter: a highlight toggle for scoring plays and a hover readout per point.
 * Everything initialises on astro:page-load (the view-transition router swaps the body)
 * and returns early on pages that do not have the elements.
 */
interface PathPt { m: number; p: number }
interface Play { m: number; inning: number; half: string; event: string; rbi: number; score: string }
interface HeroData { series: PathPt[]; plays: Play[]; side: string; away: string; home: string }

const sign = (v: number, digits = 0): string => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

function initHero() {
  const root = document.getElementById('kx-hero-chart');
  const dataEl = document.getElementById('kx-hero-data');
  const readout = document.getElementById('kx-readout');
  if (!root || !dataEl || !readout) return;
  let data: HeroData;
  try { data = JSON.parse(dataEl.textContent || '') as HeroData; } catch { return; }
  if (!data.series?.length) return;
  const idle = readout.innerHTML;

  const describe = (pt: PathPt): string => {
    let play: Play | undefined;
    for (const pl of data.plays) if (pl.m <= pt.m + 0.5 && pt.m - pl.m <= 4) play = pl;
    let html = `<span class="kx-readout__k">min</span> <b>${pt.m}</b> <span class="kx-readout__sep">·</span> <span class="kx-readout__k">${data.side} yes</span> <b class="${pt.p >= 50 ? 'kx-pos' : 'kx-neg'}">${pt.p}¢</b>`;
    if (play) {
      const [as, hs] = play.score.split('-');
      const who = play.half === 'bottom' ? data.home : data.away;
      html += ` <span class="kx-readout__sep">·</span> <span class="kx-readout__play ${play.half === 'bottom' ? 'kx-pos' : 'kx-neg'}">${play.half === 'top' ? 'T' : 'B'}${play.inning} ${play.event}, ${play.rbi} RBI by ${who}: ${data.away} ${as}, ${data.home} ${hs}</span>`;
    }
    return html;
  };

  root.querySelectorAll<SVGSVGElement>('svg.kx-hero-svg').forEach((svg) => {
    const hover = svg.querySelector<SVGGElement>('.kx-hover');
    const cross = svg.querySelector<SVGLineElement>('.kx-cross');
    const dot = svg.querySelector<SVGCircleElement>('.kx-cross-dot');
    if (!hover || !cross || !dot) return;
    const d = svg.dataset;
    const padL = Number(d.padL), padT = Number(d.padT), iw = Number(d.iw), ih = Number(d.ih);
    const x0 = Number(d.x0), x1 = Number(d.x1), y0 = Number(d.y0), y1 = Number(d.y1);
    const sx = (x: number) => padL + ((x - x0) / (x1 - x0)) * iw;
    const sy = (y: number) => padT + ih - ((y - y0) / (y1 - y0)) * ih;
    let raf = 0;
    const move = (ev: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const vb = svg.viewBox.baseVal;
      const vx = ((ev.clientX - r.left) / r.width) * vb.width;
      const t = Math.max(x0, Math.min(x1, x0 + ((vx - padL) / iw) * (x1 - x0)));
      let best = data.series[0];
      for (const pt of data.series) if (Math.abs(pt.m - t) < Math.abs(best.m - t)) best = pt;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = sx(best.m).toFixed(1), y = sy(best.p).toFixed(1);
        cross.setAttribute('x1', x); cross.setAttribute('x2', x);
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        hover.style.display = '';
        readout.innerHTML = describe(best);
      });
    };
    const leave = () => { cancelAnimationFrame(raf); hover.style.display = 'none'; readout.innerHTML = idle; };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerdown', move);
    svg.addEventListener('pointerleave', leave);
    svg.addEventListener('pointercancel', leave);
  });
}

function initReaction() {
  const wrap = document.getElementById('kx-reaction');
  if (!wrap) return;
  const chips = Array.from(wrap.querySelectorAll<HTMLButtonElement>('[data-series-toggle]'));
  const marks = Array.from(wrap.querySelectorAll<SVGElement>('[data-series]'));
  const reset = wrap.querySelector<HTMLButtonElement>('[data-series-reset]');
  if (!chips.length || !marks.length) return;
  const all = chips.map((c) => c.dataset.seriesToggle || '');
  const active = new Set(all);
  const apply = () => {
    const every = active.size === all.length;
    chips.forEach((c) => {
      const on = active.has(c.dataset.seriesToggle || '');
      c.setAttribute('aria-pressed', String(on));
      c.classList.toggle('is-off', !on);
    });
    marks.forEach((m) => { m.style.opacity = active.has(m.dataset.series || '') ? '' : '0.07'; });
    if (reset) reset.hidden = every;
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    const k = c.dataset.seriesToggle || '';
    if (active.size === all.length) { active.clear(); active.add(k); } // first click isolates a series
    else if (active.has(k)) { active.delete(k); if (!active.size) all.forEach((x) => active.add(x)); }
    else active.add(k);
    apply();
  }));
  reset?.addEventListener('click', () => { all.forEach((x) => active.add(x)); apply(); });
  apply();
}

function initMomentum() {
  const wrap = document.getElementById('kx-momentum');
  if (!wrap) return;
  const toggle = wrap.querySelector<HTMLButtonElement>('[data-hl-toggle]');
  const stage = wrap.querySelector<HTMLElement>('.kx-mo');
  if (toggle && stage) {
    toggle.addEventListener('click', () => {
      const on = stage.classList.toggle('is-hl');
      toggle.setAttribute('aria-pressed', String(on));
    });
  }
  const tip = wrap.querySelector<HTMLElement>('.kx-tip');
  const card = wrap.querySelector<HTMLElement>('.kx-tip-host');
  if (!tip || !card) return;
  wrap.querySelectorAll<SVGCircleElement>('.ch-pt[data-imm]').forEach((c) => {
    const show = () => {
      const imm = Number(c.dataset.imm), drift = Number(c.dataset.drift), scoring = c.dataset.scoring === '1';
      tip.innerHTML = `<b>${sign(imm, 1)}¢</b> immediate <span class="kx-readout__sep">·</span> <b class="${drift >= 0 ? 'kx-pos' : 'kx-neg'}">${sign(drift, 1)}¢</b> drift${scoring ? ' <span class="kx-tip__tag">scoring play</span>' : ''}`;
      const r = c.getBoundingClientRect(), h = card.getBoundingClientRect();
      const left = r.left + r.width / 2 - h.left, top = r.top - h.top;
      tip.style.left = `${Math.max(70, Math.min(h.width - 70, left)).toFixed(0)}px`;
      tip.style.top = `${Math.max(0, top - 10).toFixed(0)}px`;
      tip.hidden = false;
    };
    c.addEventListener('pointerenter', show);
    c.addEventListener('pointerleave', () => { tip.hidden = true; });
  });
}

document.addEventListener('astro:page-load', () => {
  initHero();
  initReaction();
  initMomentum();
});
