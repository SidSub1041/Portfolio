/**
 * Shared client behaviour: scroll reveals, count-up numbers, pop-up dialogs, the mobile
 * menu, the reading-progress bar, light parallax, and the contact form.
 * Everything re-initialises on every page change (astro:page-load) because the
 * view-transition router swaps the <body>.
 */
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal, .draw'));
  if (!els.length) return;
  if (reduceMotion() || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { (e.target as HTMLElement).classList.add('is-in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}

const formatters: Record<string, (v: number) => string> = {
  int: (v) => Math.round(v).toLocaleString('en-US'),
  dec1: (v) => v.toFixed(1),
  dec2: (v) => v.toFixed(2),
  dec3: (v) => v.toFixed(3),
  pct: (v) => `${Math.round(v)}%`,
  pct1: (v) => `${v.toFixed(1)}%`,
  units: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}u`,
  signed1: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`,
  signed2: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`,
  cents: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}¢`,
  plus: (v) => `${Math.round(v).toLocaleString('en-US')}+`,
  k: (v) => `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`,
};

function initCounters() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
  if (!els.length) return;
  const run = (el: HTMLElement) => {
    const target = parseFloat(el.dataset.count || '0');
    const fmt = formatters[el.dataset.format || 'int'] || formatters.int;
    if (reduceMotion() || !isFinite(target)) { el.textContent = fmt(target); return; }
    const dur = 1300;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased);
      if (t < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { run(e.target as HTMLElement); io.unobserve(e.target); }
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

function closeDialog(d: HTMLDialogElement) {
  if (!d.open) return;
  if (reduceMotion()) { d.close(); return; }
  d.classList.add('is-closing');
  const done = () => { d.classList.remove('is-closing'); d.close(); };
  d.addEventListener('animationend', done, { once: true });
  setTimeout(() => { if (d.classList.contains('is-closing')) done(); }, 260);
}

function initDialogs() {
  document.querySelectorAll<HTMLElement>('[data-dialog-open]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const d = document.getElementById(btn.dataset.dialogOpen || '') as HTMLDialogElement | null;
      if (!d || typeof d.showModal !== 'function') return;
      if (d.open) return;
      d.showModal();
      const focus = d.querySelector<HTMLElement>('[autofocus], input, textarea, a, button:not([data-dialog-close])');
      focus?.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll<HTMLDialogElement>('dialog.dlg').forEach((d) => {
    d.querySelectorAll<HTMLElement>('[data-dialog-close]').forEach((b) => b.addEventListener('click', () => closeDialog(d)));
    d.addEventListener('click', (ev) => { if (ev.target === d) closeDialog(d); });
    d.addEventListener('cancel', (ev) => { ev.preventDefault(); closeDialog(d); });
  });
}

function initNav() {
  const btn = document.querySelector<HTMLButtonElement>('.nav__menu');
  const sheet = document.getElementById('nav-sheet');
  if (!btn || !sheet) return;
  const set = (open: boolean) => { btn.setAttribute('aria-expanded', String(open)); sheet.dataset.open = String(open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  btn.addEventListener('click', () => set(sheet.dataset.open !== 'true'));
  sheet.querySelectorAll('a, button').forEach((a) => a.addEventListener('click', () => set(false)));
}

let globalBound = false;
function bindGlobal() {
  if (globalBound) return;
  globalBound = true;
  let ticking = false;
  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    const bar = document.querySelector<HTMLElement>('.progress');
    if (bar) bar.style.setProperty('--progress', p.toFixed(4));
    const nav = document.getElementById('site-nav');
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
    if (!reduceMotion()) {
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const f = parseFloat(el.dataset.parallax || '0.1');
        const r = el.getBoundingClientRect();
        const centre = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-centre * f).toFixed(1)}px, 0)`;
      });
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('astro:page-load', update);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') document.querySelectorAll<HTMLDialogElement>('dialog.dlg[open]').forEach(closeDialog);
  });
  update();
}

function initContactForm() {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;
  const status = form.querySelector<HTMLElement>('.form__status');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || !email || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      if (status) status.textContent = 'Please add your name, a valid email and a message.';
      return;
    }
    const endpoint = form.dataset.endpoint;
    const btn = form.querySelector<HTMLButtonElement>('button[type=submit]');
    if (endpoint) {
      try {
        if (btn) btn.disabled = true;
        if (status) status.textContent = 'Sending…';
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name, email, message }) });
        if (!res.ok) throw new Error(String(res.status));
        if (status) status.textContent = 'Sent. Thank you, I will get back to you.';
        form.reset();
      } catch {
        if (status) status.textContent = 'That did not go through. Email me directly instead.';
      } finally { if (btn) btn.disabled = false; }
      return;
    }
    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${form.dataset.email}?subject=${subject}&body=${body}`;
    if (status) status.textContent = 'Opening your mail app…';
  });
}

function initExternalLinks() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((a) => {
    if (a.host !== window.location.host) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });
}

function initTabs() {
  // Simple in-page tab groups: [data-tabs] > [role=tab][data-tab-target]
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((group) => {
    const tabs = Array.from(group.querySelectorAll<HTMLElement>('[role="tab"]'));
    const activate = (tab: HTMLElement) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.dataset.tabTarget || '');
        if (panel) panel.hidden = !on;
      });
    };
    tabs.forEach((t) => {
      t.addEventListener('click', () => activate(t));
      t.addEventListener('keydown', (ev) => {
        const i = tabs.indexOf(t);
        if (ev.key === 'ArrowRight') { tabs[(i + 1) % tabs.length].focus(); activate(tabs[(i + 1) % tabs.length]); }
        if (ev.key === 'ArrowLeft') { tabs[(i - 1 + tabs.length) % tabs.length].focus(); activate(tabs[(i - 1 + tabs.length) % tabs.length]); }
      });
    });
  });
}

function initAll() {
  bindGlobal();
  initReveal();
  initCounters();
  initDialogs();
  initNav();
  initContactForm();
  initExternalLinks();
  initTabs();
}

document.addEventListener('astro:page-load', initAll);
if (document.readyState !== 'loading' && !document.body.dataset.uiInit) { document.body.dataset.uiInit = '1'; }
