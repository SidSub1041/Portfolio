/**
 * NBA tab: a basketball rolls along the season's cumulative-units line in the hero as the
 * line draws itself, and settles with a small bounce at the final value.
 */
let raf = 0;
function init() {
  cancelAnimationFrame(raf);
  const wrap = document.querySelector<HTMLElement>('.nba-hero__chart');
  const svg = wrap?.querySelector<SVGSVGElement>('svg');
  const path = svg?.querySelector<SVGPathElement>('path.ch-line');
  if (!wrap || !svg || !path || svg.querySelector('.nba-ball')) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('class', 'nba-ball');
  g.setAttribute('aria-hidden', 'true');
  const r = 16;
  g.innerHTML = `<circle r="${r}" fill="#e8622d" stroke="#2a1309" stroke-width="2.2"/>
    <path d="M-${r} 0H${r}M0 -${r}V${r}" fill="none" stroke="#2a1309" stroke-width="2.2"/>
    <path d="M-${(r * 1.25).toFixed(1)} -${(r * 0.72).toFixed(1)} a${(r * 0.95).toFixed(1)} ${(r * 0.95).toFixed(1)} 0 0 1 0 ${(r * 1.44).toFixed(1)}M${(r * 1.25).toFixed(1)} -${(r * 0.72).toFixed(1)} a${(r * 0.95).toFixed(1)} ${(r * 0.95).toFixed(1)} 0 0 0 0 ${(r * 1.44).toFixed(1)}" fill="none" stroke="#2a1309" stroke-width="2.2"/>`;
  svg.appendChild(g);
  const len = path.getTotalLength();
  const end = path.getPointAtLength(len);
  const place = (t: number, angle: number, lift = 0) => {
    const p = path.getPointAtLength(len * t);
    g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${(p.y - r - 2 - lift).toFixed(1)}) rotate(${angle.toFixed(1)})`);
  };
  if (reduce) { place(1, 0); return; }
  const waitForDraw = (then: () => void) => {
    const t0 = performance.now();
    const tick = () => { if (wrap.classList.contains('is-in') || performance.now() - t0 > 2500) then(); else raf = requestAnimationFrame(tick); };
    tick();
  };
  waitForDraw(() => {
    const dur = 1700, start = performance.now();
    const roll = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 2.2);
      place(e, e * 1080);
      if (t < 1) raf = requestAnimationFrame(roll);
      else {
        const b0 = performance.now();
        const bounce = (n2: number) => {
          const u = (n2 - b0) / 900;
          if (u >= 1) { place(1, 1080); return; }
          const lift = Math.abs(Math.sin(u * Math.PI * 3)) * 26 * (1 - u);
          place(1, 1080 + u * 60, lift);
          raf = requestAnimationFrame(bounce);
        };
        raf = requestAnimationFrame(bounce);
      }
    };
    raf = requestAnimationFrame(roll);
  });
  void end;
}
document.addEventListener('astro:page-load', init);
export {};
