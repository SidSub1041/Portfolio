// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL: the public origin of the site (set it to your purchased domain, e.g. https://sidsubramanian.com).
// BASE_PATH: only needed when the site is served from a sub-path such as https://user.github.io/repo/.
const SITE_URL = process.env.SITE_URL || 'https://example.com';
const BASE_PATH = process.env.BASE_PATH || '/';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
