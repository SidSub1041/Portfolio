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
  /** Case-study fields (template: Role, Context, The challenge, The process, Outcome). */
  role: string;
  context: string;
  challenge: string;
  process: string;
  outcome: string;
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
    oneLiner: "A model for NBA player props that grades itself every morning.",
    summary: "Every player with a line gets a projection from two seasons of game logs, adjusted for the matchup. That becomes a probability and gets priced against the de-vigged market. Picks publish to a board, get graded against the closing line the next morning, and feed a learner that writes its own post-mortem.",
    role: "Solo. Model, pipeline, grading, dashboard.",
    context: "Personal project \u00b7 April 2026 to now \u00b7 runs nightly on GitHub Actions",
    challenge: "Most prop models are filters dressed up as models. Mine was too, until I measured it: the published picks hit 48% while the props left on the board hit 52%. I needed a projection, a probability, a price, and a way to grade all three.",
    process: "Blend two seasons of game logs by sample size. Scale by the matchup. Turn the projection into a distribution, compare it with the de-vigged market, and keep only picks that clear the price. Grade every pick against the box score and the closing line. Let a learner study the results, but keep it in shadow mode until it beats the market.",
    outcome: "A pipeline that runs five schedules a day without me. The current season is losing, and the page says so. The closing-line value and the post-mortems are the parts I trust most.",
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
    oneLiner: "A live draft assistant that advises and never picks.",
    summary: "It watches a Sleeper draft, mirrors every pick, ranks the best available under a strategy you can change mid-draft, and runs 400 simulated drafts per pick to say whether a player will still be there next turn. It ships as a web app, a Chrome sidebar and an MCP server for Claude.",
    role: "Solo. Engine, server, web panel, extension, MCP server, hosting.",
    context: "Personal project \u00b7 August 2026 \u00b7 Python standard library only",
    challenge: "A cheat sheet goes stale on the first pick. I wanted something that keeps the math current as the room drafts, explains itself, and never clicks anything on my behalf.",
    process: "Fit value curves to a draft guide. Build an ADP baseline that does not depend on the guide. Simulate the picks between my turns with an opponent model. Score every candidate on value now, the expected board next turn, and urgency. Put it in a web panel, dock it beside the draft room, and expose the same engine to Claude as 18 tools.",
    outcome: "A hosted app, a Chrome extension and an MCP server that run the same engine, with 72 tests behind them. Every suggestion comes with its reasoning. The pick is always mine.",
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
    oneLiner: "How Kalshi prices react to every pitch, and a Rust pipeline to trade it on paper.",
    summary: "I measured how moneyline and totals prices moved around 455 plate appearances. Prices kept drifting after scoring plays instead of snapping back. That finding became a Rust collector and paper trader with a win-probability engine, maker-side entries, fee-aware exits and a risk layer with no bypass.",
    role: "Solo. Research, Rust pipeline, risk layer, dashboard.",
    context: "Personal project \u00b7 July to September 2026 \u00b7 882 games collected",
    challenge: "Prediction markets react to live games in seconds. I wanted to know whether those reactions were right, and whether anything was left after fees.",
    process: "Align one-minute candles to play-by-play for six games. Measure the immediate move and the drift after each kind of play. Test for overreaction. Then build a collector for the full season, a paper trader that fills against live books, and a risk module that cannot be talked around.",
    outcome: "The pilot found momentum, not overreaction. The season backtest then showed the original edge did not survive a survivorship-bias audit, so I dropped it. The pipeline, the risk layer and the honest record stayed.",
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
    oneLiner: "Projected game totals against the Vegas line, built on nflfastR play-by-play.",
    summary: "A linear regression over team EPA, yardage and turnover features projects the total for each playoff game. It compares the number with the sportsbook line and flags over, under or hold. The dashboard shows the cards, the model metrics and the injury report.",
    role: "Solo. Data pipeline, model, Next.js dashboard.",
    context: "Personal project \u00b7 January to August 2026 \u00b7 Divisional Round 2026",
    challenge: "I wanted a totals model I could explain in one dialog, with its errors on the same page as its picks.",
    process: "Pull 49,000+ plays from nflfastR. Weight the current season at 70%. Compute offensive and defensive EPA, split by pass and rush. Fit a regression, project each game, and compare with The Odds API line. Check the approach on three held-out seasons.",
    outcome: "A live dashboard with four game cards and a 2-point rule for calls. The single-season fit explains little on its own, so the page shows the 854-game test next to it.",
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
    oneLiner: "A typed Java client for the Sleeper API, and where it led.",
    summary: "A fork of sdcalmes/sleeper-api: users, leagues, drafts, players and stats mapped to plain Java objects, built with Gradle and tested on CircleCI. I added the first piece of a draft assistant here. The idea later became Draft Copilot.",
    role: "Fork and extension.",
    context: "January 2024 \u00b7 Java 8, Retrofit, Gson",
    challenge: "I wanted draft data from Sleeper in a form I could build on. The upstream client had the endpoints. It did not have a draft model yet.",
    process: "Read the client group by group. Add a football draft subclass as the starting point. Then step back, pick Python, and build the assistant as its own project.",
    outcome: "A small change, honestly labelled, and a clear line from it to Draft Copilot. This page also runs the client's three main calls live against the API.",
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
