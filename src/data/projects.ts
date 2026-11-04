/**
 * The project registry. Nav tabs, home-page cards, footers and the project pages
 * all read from here so names, links and colors stay consistent.
 * Every fact below was taken from the project repositories (README files, source,
 * data exports); keep it that way when editing.
 */
export type ThemeId = 'nba' | 'draft' | 'kalshi' | 'nfl' | 'sleeper';

export interface ProjectLink { label: string; url: string; kind: 'live' | 'repo' | 'dashboard' | 'doc' }

export interface Project {
  id: ThemeId;
  name: string;
  tab: string;
  href: string;
  color: string;
  /** A darker variant of `color` for lines and text on light backgrounds (the home page). */
  ink: string;
  period: string;
  status: string;
  summary: string;
  oneLiner: string;
  stack: string[];
  languages: string[];
  links: ProjectLink[];
  facts: { label: string; value: string }[];
}

export const projects: Project[] = [
  {
    id: 'nba',
    name: 'NBA Player Prop Model',
    tab: 'NBA Props',
    href: '/projects/nba-player-prop-model',
    color: '#e8622d',
    ink: '#b9471a',
    period: 'Apr 2026 – present',
    status: 'Live, runs nightly',
    oneLiner: 'A self-grading edge model for NBA player props.',
    summary:
      'Every player with a line is projected from two seasons of game logs, adjusted for the matchup, turned into a probability and priced against the de-vigged market at the best book. Picks publish to a dashboard, get graded against the closing line every morning, and feed a learning loop that writes its own post-mortem.',
    stack: ['Python', 'NBA.com tracking data', 'The Odds API', 'GitHub Actions', 'Next.js', 'Tableau Public'],
    languages: ['Python', 'TypeScript'],
    links: [
      { label: 'Live board', url: 'https://sidsub1041.github.io/NBA-Player-Prop-Model/', kind: 'live' },
      { label: 'Tableau dashboard', url: 'https://public.tableau.com/app/profile/sidharth.subramanian7031/viz/NBAPlayerPropModel/Dashboard1', kind: 'dashboard' },
      { label: 'Source on GitHub', url: 'https://github.com/SidSub1041/NBA-Player-Prop-Model', kind: 'repo' },
    ],
    facts: [
      { label: 'Scheduled runs', value: 'Board, two fill runs, 30-minute closing-line snapshots, and a grading run every day' },
      { label: 'Learner', value: 'Walk-forward logistic model over 27 features, gated before it may act' },
      { label: 'Grading', value: 'Every pick scored against the close, with closing-line value' },
    ],
  },
  {
    id: 'draft',
    name: 'Draft Copilot',
    tab: 'Draft Copilot',
    href: '/projects/draft-copilot',
    color: '#a3e635',
    ink: '#4d7c0f',
    period: 'Aug 2026',
    status: 'Shipped: web app, Chrome extension, MCP server',
    oneLiner: 'A live fantasy-football draft assistant that advises and never picks.',
    summary:
      'Watches a Sleeper draft (Yahoo in beta), mirrors every pick, ranks the best available by position under a tunable strategy, and runs 400 simulated drafts per pick to say whether a player will still be there at your next turn. Ships as a web app, a Chrome sidebar extension and an 18-tool MCP server for Claude.',
    stack: ['Python (standard library only)', 'SQLite', 'Monte Carlo simulation', 'Chrome extension (Manifest V3)', 'MCP server', 'Docker · Fly.io · Vercel'],
    languages: ['Python', 'JavaScript'],
    links: [
      { label: 'Source on GitHub', url: 'https://github.com/SidSub1041/ff-draft-bot', kind: 'repo' },
      { label: 'Hosted app', url: 'https://sids-draft-copilot.fly.dev/app', kind: 'live' },
    ],
    facts: [
      { label: 'Model', value: 'Value curves fit to a draft guide, ADP consumption curves, Monte Carlo survival and VONA lookahead' },
      { label: 'Tests', value: '72 tests across the engine, parser, accounts and public server' },
      { label: 'Honesty rule', value: 'No code path can submit a pick' },
    ],
  },
  {
    id: 'kalshi',
    name: 'Kalshi MLB Market Analysis',
    tab: 'Kalshi MLB',
    href: '/projects/kalshi-mlb-market-analysis',
    color: '#2be38b',
    ink: '#0f8a55',
    period: 'Jul – Sep 2026',
    status: 'Research complete, paper-trading pipeline built',
    oneLiner: 'How prediction-market prices react to every pitch, and a Rust pipeline to trade it on paper.',
    summary:
      'An event study of Kalshi MLB moneyline and totals markets around 455 plate-appearance events found momentum, not overreaction: prices keep drifting after scoring plays. That led to a Rust collector and paper trader with a win-probability engine, maker-side entries, fee-aware exits and a pure risk layer with no bypass.',
    stack: ['Python · pandas · SciPy · scikit-learn', 'Rust (async collector and paper trader)', 'Kalshi REST and WebSocket APIs', 'MLB Stats API (GUMBO)', 'launchd agents'],
    languages: ['Rust', 'Python'],
    links: [
      { label: 'Source on GitHub', url: 'https://github.com/SidSub1041/kalshi-mlb-market-analysis', kind: 'repo' },
      { label: 'Pilot report', url: 'https://github.com/SidSub1041/kalshi-mlb-market-analysis/blob/main/REPORT.md', kind: 'doc' },
    ],
    facts: [
      { label: 'Pilot study', value: '6 games, 455 plate-appearance events, 1-minute candles' },
      { label: 'Season collection', value: '882 games and 66k+ events via the Rust collector' },
      { label: 'Key result', value: 'Immediate move and drift positively correlated (ρ = 0.17, p = 0.03)' },
    ],
  },
  {
    id: 'nfl',
    name: 'NFL Game Totals Model',
    tab: 'NFL Totals',
    href: '/projects/nfl-game-totals',
    color: '#2563eb',
    ink: '#1d4ed8',
    period: 'Jan – Aug 2026',
    status: 'Live dashboard',
    oneLiner: 'Projected game totals versus the Vegas line, built on nflfastR play-by-play.',
    summary:
      'A linear-regression model over team EPA, yardage and turnover features projects the total for each playoff game and compares it with the sportsbook line to flag over, under or hold. The Next.js dashboard shows every game card, the model metrics and the injury report behind the numbers.',
    stack: ['Python · scikit-learn · nflfastR', 'The Odds API', 'ESPN injury scrape', 'Next.js 16 · React · Tailwind · Radix UI'],
    languages: ['Python', 'TypeScript'],
    links: [
      { label: 'Live dashboard', url: 'https://model-game-totals.vercel.app', kind: 'live' },
      { label: 'Source on GitHub', url: 'https://github.com/SidSub1041/model-game-totals', kind: 'repo' },
    ],
    facts: [
      { label: 'Data', value: '49,000+ plays from the 2024 and 2025 seasons, weighted 30/70' },
      { label: 'Historical check', value: '854 games from 2022–2024, test R² 0.55 and MAE 6.7 points' },
      { label: 'Rule', value: 'A pick needs a 2-point edge against the line' },
    ],
  },
  {
    id: 'sleeper',
    name: 'Sleeper API Java Client',
    tab: 'Sleeper Client',
    href: '/projects/sleeper-api-client',
    color: '#4fe3ff',
    ink: '#0e7490',
    period: '2024',
    status: 'Fork, extended',
    oneLiner: 'A typed Java client for the Sleeper fantasy-football API.',
    summary:
      'A fork of the sdcalmes/sleeper-api client: Users, Leagues, Drafts, Players and Stats endpoints mapped to plain Java objects, built with Gradle and tested with JUnit on CircleCI. It was the first step toward a draft assistant, an idea that later became Draft Copilot.',
    stack: ['Java', 'Gradle', 'JUnit', 'CircleCI', 'Sleeper REST API'],
    languages: ['Java'],
    links: [
      { label: 'Source on GitHub', url: 'https://github.com/SidSub1041/Fantasy-Football-Draft-Assistant', kind: 'repo' },
      { label: 'Upstream project', url: 'https://github.com/sdcalmes/sleeper-api', kind: 'doc' },
      { label: 'Sleeper API docs', url: 'https://docs.sleeper.app/', kind: 'doc' },
    ],
    facts: [
      { label: 'Surface', value: '45 Java source files across Draft, League, Player, Stats, User and Other groups' },
      { label: 'Tests', value: '7 JUnit test classes' },
      { label: 'Lineage', value: 'Precursor to Draft Copilot' },
    ],
  },
];

export const projectById = Object.fromEntries(projects.map((p) => [p.id, p])) as Record<ThemeId, Project>;
