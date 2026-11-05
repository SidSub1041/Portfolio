/**
 * Kalshi tab: three base runners (small squares) advance around the diamond drawing in the
 * hero, one base at a time, while the price path draws. Pure SVG + requestAnimationFrame.
 */
let raf = 0;
const BASES: [number, number][] = [[260, 430], [380, 310], [260, 190], [140, 310], [260, 430]];
function init() {
  cancelAnimationFrame(raf);
  const svg = document.querySelector<SVGSVGElement>('.kx-hero__diamond svg.kx-diamond');
  if (!svg || svg.querySelector('.kx-runner')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ns = 'http://www.w3.org/2000/svg';
  const runners = [0, 1, 2].map((i) => {
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('class', 'kx-runner'); r.setAttribute('width', '14'); r.setAttribute('height', '14');
    r.setAttribute('fill', 'currentColor'); r.setAttribute('opacity', '0');
    r.setAttribute('transform', `translate(${BASES[0][0] - 7} ${BASES[0][1] - 7}) rotate(45 7 7)`);
    svg.appendChild(r);
    return { el: r, start: 1200 + i * 2600, base: 0 };
  });
  const t0 = performance.now();
  const hop = 1100, pause = 650;
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const frame = (now: number) => {
    const t = now - t0;
    let alive = false;
    for (const r of runners) {
      const local = t - r.start;
      if (local < 0) { alive = true; continue; }
      const seg = Math.floor(local / (hop + pause));
      if (seg >= 4) { r.el.setAttribute('opacity', '0'); continue; }
      alive = true;
      const u = Math.min(1, (local - seg * (hop + pause)) / hop);
      const [x0, y0] = BASES[seg], [x1, y1] = BASES[seg + 1];
      const k = ease(u);
      const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 10;
      r.el.setAttribute('opacity', seg === 3 && u > 0.85 ? String((1 - u) / 0.15) : '0.95');
      r.el.setAttribute('transform', `translate(${(x - 7).toFixed(1)} ${(y - 7).toFixed(1)}) rotate(45 7 7)`);
    }
    if (alive) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}
document.addEventListener('astro:page-load', init);
export {};
