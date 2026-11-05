/**
 * Everything personal about the site lives here. Edit this file, rebuild, and the whole
 * site (home page, nav, footer, contact pop-up, metadata) picks the changes up.
 */
export const site = {
  name: 'Sid Subramanian',
  firstName: 'Sid',
  initials: 'SS',
  profession: 'Sports analytics, prediction markets and software',
  role: 'Sports analytics, prediction markets and software',
  // The one-line statement under your name on the home page.
  tagline: 'I build models for games and markets, then ship them as things people can use.',
  description:
    'Portfolio of Sid Subramanian: an NBA player-prop model that grades itself, a Kalshi MLB market study with a Rust trading pipeline, an NFL game-totals model, a live fantasy-football draft assistant, and a Java client for the Sleeper API.',

  // Profile row (template: Based in / Focus / Availability). Leave a field empty to hide it.
  basedIn: '' as string,
  focus: 'Sports analytics, prediction markets, data pipelines',
  availability: 'Open to analytics and engineering roles',
  years: '2024 – 2026',

  // Contact. The email is shown in the contact dialog and used by the mailto fallback.
  email: 'sidharth.s.1041@gmail.com',
  github: 'https://github.com/SidSub1041',
  githubHandle: 'SidSub1041',
  tableau: 'https://public.tableau.com/app/profile/sidharth.subramanian7031',
  linkedin: '' as string, // e.g. 'https://www.linkedin.com/in/your-handle' (leave empty to hide)
  website: '' as string, // your purchased domain once it is live, e.g. 'https://sidsubramanian.com'

  // Optional: a form endpoint (Formspree, Basin, Netlify Forms, your own API). When set, the
  // contact form POSTs JSON there; when empty, the form opens the visitor's mail app instead.
  contactEndpoint: '' as string,

  // Drop your headshot at public/images/headshot.jpg (square, at least 800x800) and set this to
  // '/images/headshot.jpg'. While it is empty the home page shows a plain placeholder.
  headshot: '' as string,
  headshotAlt: 'Portrait of Sid Subramanian',

  // "01 / Profile" on the home page. Short sentences, your own voice.
  about: [
    'I work where sports, markets and software meet. Each project here started as a question about a game or a market. I turned it into a model with real data, then made it run on its own: a nightly pipeline, a web app, a trading simulator, a draft assistant.',
    'I care about honest results. Every model on this site shows its record. It grades itself against closing lines or real fills, and it keeps the audits that killed an edge next to the ones that held.',
  ],

  // Shown in the profile section as "Now". Edit freely.
  now: [
    'Running the NBA prop model every night this season',
    'Paper-trading MLB markets on Kalshi with the Rust pipeline',
    'Open to analytics and engineering roles',
  ],

  // "Background" section (template: Experience & education). The section is hidden while
  // both lists are empty. Example entry: { years: '2025 – 2026', title: 'Role · Organization', detail: 'One line on what you did.' }
  experience: [] as { years: string; title: string; detail: string }[],
  education: [] as { title: string; detail: string }[],
} as const;

/** Prefix an internal path with the configured base path. */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
