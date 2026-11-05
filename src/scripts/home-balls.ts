/**
 * Home hero: a basketball, a football and a baseball drop in, bounce along the bottom of the
 * hero, then break into particles that drift into the headline and fill it with ink.
 * Pure Canvas 2D, no images. Skipped (headline shown filled) when the visitor prefers
 * reduced motion. Re-runs on every visit to the home page.
 */
type Kind = 'basketball' | 'football' | 'baseball';
interface Ball { kind: Kind; x: number; y: number; vx: number; vy: number; r: number; angle: number; spin: number; born: number; bounces: number; gone: boolean }
interface Particle { x: number; y: number; sx: number; sy: number; vx: number; vy: number; tx: number; ty: number; size: number; color: string; born: number; life: number }

const PALETTE: Record<Kind, string[]> = {
  basketball: ['#e8622d', '#c94d1d', '#3a1b0c'],
  football: ['#8a4420', '#6b2f14', '#f3efe6'],
  baseball: ['#f3efe6', '#d9d2c4', '#c23b3b'],
};

let raf = 0;
let cleanup: (() => void) | null = null;

function drawBasketball(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#e8622d'; ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.strokeStyle = '#3a1b0c';
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
  ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * 0.95, -0.75, 0.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(r * 1.25, 0, r * 0.95, Math.PI - 0.75, Math.PI + 0.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
}
function drawFootball(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.45, r * 0.88, 0, 0, Math.PI * 2); ctx.fillStyle = '#8a4420'; ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.strokeStyle = '#3a1b0c'; ctx.stroke();
  ctx.strokeStyle = '#f3efe6'; ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
  for (let i = -2; i <= 2; i++) { const x = i * r * 0.22; ctx.beginPath(); ctx.moveTo(x, -r * 0.18); ctx.lineTo(x, r * 0.18); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(-r * 1.05, 0, r * 0.12, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(r * 1.05, 0, r * 0.12, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
}
function drawBaseball(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#f3efe6'; ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.06); ctx.strokeStyle = '#c9c2b4'; ctx.stroke();
  ctx.strokeStyle = '#c23b3b'; ctx.lineWidth = Math.max(1.5, r * 0.08);
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.arc(side * r * 1.05, 0, r * 0.82, side > 0 ? Math.PI - 1.05 : -1.05, side > 0 ? Math.PI + 1.05 : 1.05); ctx.stroke();
    for (let k = -3; k <= 3; k++) {
      const a = (side > 0 ? Math.PI : 0) + k * 0.28;
      const cx = side * r * 1.05 + Math.cos(a) * r * 0.82, cy = Math.sin(a) * r * 0.82;
      const nx = Math.cos(a + Math.PI / 2) * r * 0.1, ny = Math.sin(a + Math.PI / 2) * r * 0.1;
      ctx.beginPath(); ctx.moveTo(cx - nx, cy - ny); ctx.lineTo(cx + nx, cy + ny); ctx.stroke();
    }
  }
}
const DRAW: Record<Kind, (ctx: CanvasRenderingContext2D, r: number) => void> = { basketball: drawBasketball, football: drawFootball, baseball: drawBaseball };

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function init() {
  cleanup?.(); cleanup = null;
  const canvas = document.getElementById('home-balls') as HTMLCanvasElement | null;
  const hero = canvas?.closest<HTMLElement>('.home-hero');
  const h1 = document.querySelector<HTMLElement>('.home-h1');
  if (!canvas || !hero || !h1) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduce || !ctx) { h1.classList.add('is-filled'); canvas.remove(); return; }

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0;
  const size = () => {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  const textRect = () => {
    const hr = hero.getBoundingClientRect(), tr = h1.getBoundingClientRect();
    return { x: tr.left - hr.left, y: tr.top - hr.top, w: tr.width, h: tr.height };
  };
  const narrow = W < 700;
  const R = narrow ? 22 : 30;
  const floor = H - (narrow ? 28 : 40);
  const tr0 = textRect();
  const targetX = tr0.x + tr0.w * 0.5;
  const kinds: Kind[] = ['basketball', 'football', 'baseball'];
  const start = performance.now();
  const balls: Ball[] = kinds.map((kind, i) => {
    const x0 = narrow ? W * (0.2 + 0.3 * i) : Math.min(W * 0.62, tr0.x + tr0.w * (0.1 + 0.4 * i));
    return { kind, x: x0, y: -R * 2 - i * 40, vx: (targetX - x0) * 0.16 + (i - 1) * 18, vy: 60 + i * 30, r: R * (kind === 'baseball' ? 0.78 : kind === 'football' ? 0.95 : 1), angle: i * 1.3, spin: (i % 2 ? -1 : 1) * (2.4 + i * 0.6), born: start + i * 520, bounces: 0, gone: false };
  });
  const particles: Particle[] = [];
  let filled = false, last = start;

  const burst = (b: Ball, now: number) => {
    b.gone = true;
    const tr = textRect();
    const n = narrow ? 48 : 80;
    const pal = PALETTE[b.kind];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 90 + Math.random() * 260;
      particles.push({
        x: b.x, y: b.y, sx: b.x, sy: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 160,
        tx: tr.x + Math.random() * tr.w, ty: tr.y + tr.h * (0.12 + Math.random() * 0.76),
        size: b.r * (0.09 + Math.random() * 0.1), color: pal[i % pal.length], born: now + Math.random() * 180, life: 1050 + Math.random() * 650,
      });
    }
  };

  const frame = (now: number) => {
    const dt = Math.min(0.034, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);
    let active = false;
    for (const b of balls) {
      if (b.gone || now < b.born) { if (!b.gone) active = true; continue; }
      active = true;
      b.vy += 2600 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.spin * dt;
      const ry = b.kind === 'football' ? b.r * 0.88 : b.r;
      if (b.y + ry > floor) {
        b.y = floor - ry; b.vy = -Math.abs(b.vy) * 0.58; b.vx *= 0.82; b.spin *= 0.8; b.bounces++;
        if (Math.abs(b.vy) < 120) b.vy = 0;
      }
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
      const age = now - b.born;
      if (b.bounces >= 4 || age > 2700) { burst(b, now); continue; }
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
      ctx.shadowColor = 'rgba(22,32,47,0.18)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
      DRAW[b.kind](ctx, b.r);
      ctx.restore();
    }
    let arrived = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (now < p.born) { active = true; continue; }
      const t = (now - p.born) / p.life;
      if (t >= 1) { particles.splice(i, 1); arrived++; continue; }
      active = true;
      const k = easeInOut(Math.min(1, t * 1.15));
      const tt = (now - p.born) / 1000;
      const bx = p.sx + p.vx * tt, by = p.sy + p.vy * tt + 0.5 * 900 * tt * tt;
      p.x = bx + (p.tx - bx) * k; p.y = by + (p.ty - by) * k;
      ctx.globalAlpha = 1 - easeOutCubic(Math.max(0, t - 0.55) / 0.45);
      ctx.fillStyle = p.color;
      const s = p.size * (1 - t * 0.6);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      ctx.globalAlpha = 1;
      if (t > 0.5) arrived++;
    }
    if (!filled && arrived > 0 && balls.every((b) => b.gone || now - b.born > 2000)) { filled = true; h1.classList.add('is-filled'); }
    if (!filled && arrived > 30) { filled = true; h1.classList.add('is-filled'); }
    if (active) raf = requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, W, H); h1.classList.add('is-filled'); canvas.classList.add('is-done'); }
  };
  const safety = window.setTimeout(() => h1.classList.add('is-filled'), 6500);
  const onResize = () => size();
  window.addEventListener('resize', onResize);
  raf = requestAnimationFrame(frame);
  cleanup = () => { cancelAnimationFrame(raf); window.clearTimeout(safety); window.removeEventListener('resize', onResize); };
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = null; });
