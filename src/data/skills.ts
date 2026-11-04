import type { ThemeId } from './projects';

export interface Application { project: ThemeId; detail: string }
export interface Skill { id: string; name: string; blurb: string; applications: Application[] }
export interface SkillGroup { id: string; title: string; skills: Skill[] }

/** Skills and where each one was applied. Every application points at something in a repository. */
export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    title: 'Languages',
    skills: [
      { id: 'python', name: 'Python', blurb: 'The working language for every model and pipeline here, from pandas research scripts to a dependency-free production server.', applications: [
        { project: 'nba', detail: 'Roughly 11,000 lines: projection, matchup, pricing, grading and learner modules, plus the GitHub Actions entry points.' },
        { project: 'draft', detail: 'A standard-library-only HTTP server, SQLite store, Monte Carlo engine and MCP server, so the bot installs with nothing but Python.' },
        { project: 'kalshi', detail: 'The pilot event study (pandas, SciPy t-tests and correlations) and the walk-forward training script.' },
        { project: 'nfl', detail: 'nflfastR ingestion, EPA feature engineering and scikit-learn regression.' },
      ] },
      { id: 'rust', name: 'Rust', blurb: 'Used where throughput and durability matter: long-running collectors and a live paper trader.', applications: [
        { project: 'kalshi', detail: 'A three-crate workspace: an async, resumable season collector, a paper trader with queue-accurate fill simulation, and a shared crate with auth signing, portfolio reads and the risk layer.' },
      ] },
      { id: 'typescript', name: 'TypeScript and React', blurb: 'Dashboards that make a model legible to people who will never read the code.', applications: [
        { project: 'nba', detail: 'A Next.js board with pick cards, grade badges, on-hold and cut-by-the-model panels, deployed to GitHub Pages after every data push.' },
        { project: 'nfl', detail: 'A Next.js 16 dashboard with game cards, model metrics and injury dialogs built on Radix UI and Tailwind.' },
      ] },
      { id: 'java', name: 'Java', blurb: 'Object-oriented API clients and the Gradle and JUnit toolchain around them.', applications: [
        { project: 'sleeper', detail: 'A fork of a Sleeper API client: endpoint groups mapped to POJOs, Gradle build, JUnit tests on CircleCI.' },
      ] },
    ],
  },
  {
    id: 'modeling',
    title: 'Modeling and statistics',
    skills: [
      { id: 'probability', name: 'Probability and pricing', blurb: 'Turning a projection into a probability, then asking whether the price pays.', applications: [
        { project: 'nba', detail: 'Normal and negative-binomial distributions per stat, push probability removed on integer lines, de-vigged market prices, a blended probability and a break-even test at the price actually taken.' },
        { project: 'kalshi', detail: 'A state-based win-probability engine (RE24 run expectancy, season team ratings, logistic calibration) producing fair values on every play.' },
      ] },
      { id: 'regression', name: 'Regression and calibration', blurb: 'Fitting simple, inspectable models and reporting how wrong they are.', applications: [
        { project: 'nfl', detail: 'Linear regression over EPA, yardage and turnover features; reported R², MAE and RMSE, and a 2022–2024 historical check (test R² 0.55, MAE 6.7 points).' },
        { project: 'nba', detail: 'An L2-regularized logistic learner over 27 features, retrained nightly and compared walk-forward against two baselines before it may act.' },
        { project: 'draft', detail: 'Power-law value curves (ppg = A(rank + r0)^-b + C) fit to a guide’s adjusted points-per-game tables; r² of 0.98 for RB and WR.' },
      ] },
      { id: 'event-study', name: 'Event studies and market microstructure', blurb: 'Measuring how prices react to news, net of spreads and fees.', applications: [
        { project: 'kalshi', detail: 'Immediate (0–2 min) and drift (2–7 min) reactions by event type, overreaction tests, inning splits, volume and spread around events, and a fee analysis that forced maker-side execution.' },
        { project: 'nba', detail: 'Closing-line value on every graded pick, with a close only counted when the market was re-priced within 90 minutes of tip.' },
      ] },
      { id: 'simulation', name: 'Simulation', blurb: 'Answering questions that have no closed form by simulating them many times.', applications: [
        { project: 'draft', detail: '400 simulated futures per pick using an opponent model, giving survival odds and the expected board at your next pick (VONA).' },
        { project: 'kalshi', detail: 'Fill simulation that tracks displayed queue position before a paper fill is credited.' },
      ] },
      { id: 'validation', name: 'Validation and self-audit', blurb: 'Holding every result to a baseline, and keeping the audits that said no.', applications: [
        { project: 'kalshi', detail: 'Weekly walk-forward validation; a survivorship-bias audit that invalidated the project’s original edge; recency and streak weighting rejected when the data said no.' },
        { project: 'nba', detail: 'Pre-registered segment cuts with Wilson intervals, nightly post-mortems, and a gate that keeps the learner in shadow mode until it beats the de-vigged price.' },
      ] },
    ],
  },
  {
    id: 'data',
    title: 'Data engineering',
    skills: [
      { id: 'collection', name: 'API collection at scale', blurb: 'Pulling from rate-limited sports and market APIs without losing a run.', applications: [
        { project: 'kalshi', detail: 'Rust collector at ~8 requests per second under Kalshi’s public limit, resumable, joined to pitch-level timestamps.' },
        { project: 'nba', detail: 'One league-wide game-log request per season cached on disk, an HTTP layer with timeouts, retries and a circuit breaker, and credit guards on the odds API.' },
        { project: 'sleeper', detail: 'Typed wrappers for the Sleeper REST endpoints, including the once-a-day players dump.' },
      ] },
      { id: 'pipelines', name: 'Scheduled pipelines', blurb: 'Jobs that run unattended, commit their own data and refuse to publish bad output.', applications: [
        { project: 'nba', detail: 'Five cron schedules on GitHub Actions in two concurrency groups; a run that aborts mid-way publishes nothing, and a failed step blocks the data commit.' },
        { project: 'kalshi', detail: 'launchd agents that run the paper trader and tracker from an isolated live clone, with a one-shot deploy job to swap binaries.' },
        { project: 'nfl', detail: 'A numbered script pipeline from odds fetch to model export, with weekly scheduling.' },
      ] },
      { id: 'storage', name: 'Storage and exports', blurb: 'Keeping the record straight: line history, snapshots, fact tables.', applications: [
        { project: 'nba', detail: 'Line-history snapshots on every save, per-day graded logs, and CSV fact tables exported for Tableau.' },
        { project: 'draft', detail: 'A SQLite store of every observed draft that refits the ADP curves and tracks where the user overruled the bot.' },
      ] },
    ],
  },
  {
    id: 'product',
    title: 'Product and infrastructure',
    skills: [
      { id: 'web', name: 'Web apps and dashboards', blurb: 'Interfaces that show the reasoning, not just the answer.', applications: [
        { project: 'draft', detail: 'A live board, best-available shortlists, a plain-English chat and account features, plus a landing site with privacy and terms pages.' },
        { project: 'nba', detail: 'Pick cards that show model, market, blend and break-even side by side, with every failed guard named.' },
        { project: 'nfl', detail: 'Game cards with EPA, totals, edge and moneyline, and modals that explain the model.' },
      ] },
      { id: 'deploy', name: 'Deployment and operations', blurb: 'Docker images, edge rewrites, security headers and custom domains.', applications: [
        { project: 'draft', detail: 'Dockerfile, Fly.io and Render configs, Vercel rewrites to the API with a strict Content-Security-Policy, session rate limiting by forwarded IP.' },
        { project: 'nba', detail: 'GitHub Pages deploys triggered by data pushes; proxy and probe tasks for datacenter-blocked APIs.' },
        { project: 'sleeper', detail: 'CircleCI build pipeline.' },
      ] },
      { id: 'extensions', name: 'Browser extensions and AI tooling', blurb: 'Meeting users where they already are: the draft room, or a Claude conversation.', applications: [
        { project: 'draft', detail: 'A Manifest V3 Chrome extension that docks the panel beside Sleeper drafts and reads nothing from the page; an 18-tool MCP server so Claude can run the whole draft; an LLM chat with a non-LLM fallback parser.' },
      ] },
      { id: 'risk', name: 'Risk controls', blurb: 'Hard limits that cannot be talked around at runtime.', applications: [
        { project: 'kalshi', detail: 'Exposure, per-market and daily-loss caps, order-rate and price-distance checks, durable lockout files and a dead-man switch, all in a pure module with no bypass.' },
        { project: 'nba', detail: 'Price, book-count, line-size and minutes guards, then board caps of 15 plays, 3 per game and 1 per player.' },
      ] },
    ],
  },
];
