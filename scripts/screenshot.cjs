// Screenshots every page at desktop and phone widths against a running server.
// Screenshots every page at desktop and phone widths against a running server.
// Usage: node scripts/screenshot.mjs http://localhost:4321 [outDir]
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
async function main() {
const base = (process.argv[2] || 'http://localhost:4321').replace(/\/$/, '');
const out = process.argv[3] || 'screenshots';
mkdirSync(out, { recursive: true });
const pages = ['/', '/projects/nba-player-prop-model', '/projects/draft-copilot', '/projects/kalshi-mlb-market-analysis', '/projects/nfl-game-totals', '/projects/sleeper-api-client'];
const browser = await chromium.launch();
const problems = [];
for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${label} console error: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`${label} page error: ${e.message}`));
  for (const p of pages) {
    const name = p === '/' ? 'home' : p.split('/').pop();
    const res = await page.goto(base + p, { waitUntil: 'networkidle' });
    if (!res || res.status() >= 400) problems.push(`${label} ${p}: HTTP ${res?.status()}`);
    await page.evaluate(async () => { // trigger reveals
      document.querySelectorAll('.reveal, .draw').forEach((el) => el.classList.add('is-in'));
      window.scrollTo(0, document.body.scrollHeight); await new Promise((r) => setTimeout(r, 300)); window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflow) problems.push(`${label} ${p}: horizontal overflow (scrollWidth ${await page.evaluate(() => document.documentElement.scrollWidth)})`);
    const emoji = await page.evaluate(() => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(document.body.innerText));
    if (emoji) problems.push(`${label} ${p}: emoji character found in page text`);
    await page.screenshot({ path: `${out}/${name}-${label}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'no problems detected');
console.log(`screenshots in ${out}/`);
}
main().catch((e) => { console.error(e); process.exit(1); });
