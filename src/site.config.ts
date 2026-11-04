/**
 * Everything personal about the site lives here. Edit this file, rebuild, and the
 * whole site (home page, nav, footer, contact dialog, metadata) picks the changes up.
 */
export const site = {
  name: 'Sid Subramanian',
  firstName: 'Sid',
  initials: 'SS',
  role: 'Sports analytics, prediction markets, and the software that runs them',
  tagline: 'I build models for games and markets, then ship them as products people can actually use.',
  description:
    'Portfolio of Sid Subramanian: an NBA player-prop model with a self-grading pipeline, a Kalshi MLB market study with a Rust trading pipeline, an NFL game-totals model, a live fantasy-football draft copilot, and a Java client for the Sleeper API.',
  location: '' as string,

  // Contact. The email is shown in the contact dialog and used by the mailto fallback.
  email: 'sidharth.s.1041@gmail.com',
  github: 'https://github.com/SidSub1041',
  githubHandle: 'SidSub1041',
  tableau: 'https://public.tableau.com/app/profile/sidharth.subramanian7031',
  linkedin: '' as string, // e.g. 'https://www.linkedin.com/in/your-handle' (leave empty to hide)

  // Optional: a form endpoint (Formspree, Basin, Netlify Forms, your own API). When set, the
  // contact form POSTs JSON there; when empty, the form opens the visitor's mail app instead.
  contactEndpoint: '' as string,

  // Drop your headshot at public/images/headshot.jpg (square, at least 800x800) and set this to
  // '/images/headshot.jpg'. While it is empty the home page shows a styled placeholder.
  headshot: '' as string,
  headshotAlt: 'Portrait of Sid Subramanian',

  // Paragraphs for the "About" section of the home page.
  about: [
    'I work at the intersection of sports, markets, and software. Each project here starts with a question about a game or a market, turns it into a model with real data, and ends as something that runs on its own: a nightly pipeline, a web app, a trading simulator, or a draft assistant.',
    'The common thread is honesty about results. Every model on this site publishes its record, grades itself against closing lines or real fills, and keeps the audits that proved an edge was not there alongside the ones that worked.',
  ],

  // Shown in the hero as a short list of what you are doing now. Edit freely.
  now: [
    'Running the NBA prop model every night of the 2026-27 season',
    'Paper-trading MLB markets on Kalshi with the Rust pipeline',
    'Open to analytics and engineering roles',
  ],
} as const;

/** Prefix an internal path with the configured base path. */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
