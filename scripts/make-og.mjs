// Generates public/images/og-default.png and public/apple-touch-icon.png from inline SVG.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/images', { recursive: true });
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f4f5f7"/>
  <rect x="0" y="0" width="14" height="630" fill="#1f3fe6"/>
  <g font-family="Helvetica, Arial, sans-serif">
    <text x="80" y="140" font-size="26" fill="#6e7484" letter-spacing="4">SID SUBRAMANIAN</text>
    <text x="80" y="250" font-size="74" font-weight="700" fill="#0f1219">Sports analytics,</text>
    <text x="80" y="340" font-size="74" font-weight="700" fill="#0f1219">prediction markets,</text>
    <text x="80" y="430" font-size="74" font-weight="700" fill="#1f3fe6">and the software behind them.</text>
    <text x="80" y="540" font-size="28" fill="#3c4250">NBA props · Kalshi MLB · NFL totals · Draft Copilot · Sleeper client</text>
  </g>
</svg>`;
await sharp(Buffer.from(og)).png().toFile('public/images/og-default.png');
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180"><rect width="64" height="64" fill="#1f3fe6"/><text x="32" y="41" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#fff" letter-spacing="1">SS</text></svg>`;
await sharp(Buffer.from(icon)).png().toFile('public/apple-touch-icon.png');
console.log('wrote og-default.png and apple-touch-icon.png');
