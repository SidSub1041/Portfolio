# Portfolio design and content brief

This file is the single source of truth for anyone (human or agent) building a page in this
site. Read it fully before writing a line. The site is a static Astro 7 project. The shared
foundation (tokens, layout, nav, footer, dialogs, charts, motion) already exists and works;
pages compose it.

## 1. Hard rules

1. **No emojis anywhere** (page text, alt text, comments shown to users). Use `<Icon name="…" />`.
2. **No AI-generated or stock imagery.** Allowed images: the real screenshots and CC0 photos already
   in `public/images/projects/`, and graphics you draw yourself (SVG, CSS, data charts from the JSON).
3. **No purple / violet / indigo gradients, no terracotta-on-cream, no "AI startup" look.** Each page
   uses its theme tokens from `src/styles/global.css` (`body[data-theme=…]`). Never hardcode a new
   palette; add nuance with `color-mix()` on the tokens.
4. **Every number and claim must come from the project repository or the JSON snapshot** in
   `src/data/`. Section 6 lists the verified facts with sources. If you cannot source a claim, cut it.
   Never invent biography details about the author (school, employer, age, location).
5. **Fonts:** only the ones already installed (see section 4). Never load fonts from a CDN.
6. **Accessibility:** semantic headings in order (one `h1`), alt text on images, keyboard-reachable
   controls, `aria-label` on icon-only buttons, visible focus (already styled), colour contrast
   AA on text, `prefers-reduced-motion` respected (the motion utilities already handle this).
7. **Responsive:** every page must work at 390 px wide with no horizontal overflow and at 1440 px.
   Use the grid/split utilities; wrap wide tables in `.table-wrap`; give SVG charts a `viewBox`
   (the chart module does) so they scale.
8. **External links** open in a new tab automatically (ui.ts); never add `target` yourself.
9. **Write for a hiring manager or collaborator:** confident, concrete, plain. Short paragraphs.
   No marketing fluff, no "cutting-edge", no exclamation marks. Results are reported honestly,
   losses included; do not spin a negative record. Dashes inside sentences: use commas or colons.
10. **Do not edit shared files** (`src/layouts/Base.astro`, `src/components/*` at the top level,
    `src/styles/global.css`, `src/scripts/ui.ts`, `src/site.config.ts`, `src/data/*.ts`,
    `src/lib/*`, `astro.config.mjs`). If a shared change is needed, describe it in your report;
    work around it locally in the meantime with page-scoped styles.

## 2. Stack, commands, collision rules

- Astro 7.4 (`output: 'static'`), TypeScript strict, no UI framework; interactivity is vanilla
  TypeScript in `<script>` tags (bundled by Astro) or in `src/scripts/<page>-*.ts`.
- Node 22 is installed; `node_modules` is already installed (do not run `npm install`).
- Playwright is pre-installed globally: `require('playwright')` works from CommonJS (`.cjs`),
  not from ESM `import`. The helper `scripts/screenshot.cjs` screenshots every route.
- **Several people build pages concurrently in this same checkout.** To avoid clobbering:
  - Only write files that belong to your page (section 5 names them).
  - Build into your own output directory and use your own port, e.g.
    `npx astro build --outDir /tmp/build-<page>` then
    `npx astro preview --outDir /tmp/build-<page> --port <your port> --host 127.0.0.1`.
    Never run `astro dev`. Never write to `dist/`.
  - Other pages may be placeholders or half-built while you work; a build error in another
    person's page is not yours to fix. If the whole build fails because of someone else's file,
    temporarily copy the project: `rsync -a --exclude node_modules --exclude dist . /tmp/wt-<page>/`,
    symlink `node_modules`, overwrite the broken page there with a placeholder, and build that copy.
  - `.astro/` type generation is shared and idempotent; concurrent runs are fine.

## 3. Files and what they give you

```
src/site.config.ts          site.name, email, github, tableau, headshot, about[], now[], url(path)
src/data/projects.ts        projects[] registry: id, name, tab, href, color, period, status,
                            oneLiner, summary, stack[], languages[], links[], facts[]; projectById
src/data/skills.ts          skillGroups[] with applications per project (home page skills matrix)
src/data/{nba,kalshi,nfl,draft,sleeper}.json   real data snapshots (shapes in section 7)
src/lib/chart.ts            lineChart, barChart, scatterChart, sparkline → SVG strings
src/lib/format.ts           fmtUnits, fmtSigned, fmtPct, fmtInt, fmtDate, fmtShortDate, statLabel, eventLabel
src/layouts/Base.astro      <Base title description theme ogImage>: head, nav, main (page transition), footer, contact dialog, ui.ts
src/components/Icon.astro   <Icon name size class title>  names: arrow-right arrow-up-right arrow-down external github mail linkedin chart bar-chart table bolt shield layers cpu globe clock check close menu info play search refresh database branch target eye dice book code download trophy wifi lock calendar trending-up trending-down minus plus flag send user
src/components/Dialog.astro <Dialog id title eyebrow wide> … </Dialog>  open with any element carrying data-dialog-open="id"
src/components/SectionHead.astro <SectionHead eyebrow title lead id />
src/components/Stat.astro   <Stat label value count format sub tone />  (count animates; format: int dec1 dec2 dec3 pct pct1 units signed1 signed2 cents plus k)
src/scripts/ui.ts           reveals, counters, dialogs, mobile nav, progress bar, parallax, contact form, in-page tabs ([data-tabs] > [role=tab][data-tab-target])
public/images/projects/     draft-copilot-cockpit.jpg 1400×836 (real app screenshot, mid-draft)
                            draft-copilot-panel.png 1500×940 (real screenshot, light theme panel)
                            draft-copilot-sidebar.png 430×900 (real screenshot, narrow sidebar)
                            draft-copilot-mobile.jpg 360×720 (real screenshot, phone layout)
                            stadium-cc0.jpg 1280×960 (CC0 photo, Rose Bowl stands and field)
                            turf-cc0.jpg 1200×795 (CC0 photo, grass texture)
                            kalshi-reaction-analysis.png 1950×750 (real matplotlib figure from the repo)
```

### Using the chart module (build time, zero runtime JS)

```astro
---
import { lineChart, barChart, scatterChart, sparkline } from '../../lib/chart';
import nba from '../../data/nba.json';
const series = nba.cumulative['2026-27'].map((d, i) => ({ x: i, y: d.cum }));
const svg = lineChart({ series: [{ points: series, color: 'var(--accent)', area: true, width: 2.5 }],
  zeroLine: true, xFmt: (i) => nba.cumulative['2026-27'][Math.round(i)]?.date.slice(5) ?? '',
  yFmt: (v) => `${v > 0 ? '+' : ''}${v}u`, ariaLabel: 'Cumulative units by graded day, 2026-27 season', height: 320 });
---
<div class="chart-card"><div class="chart-card__head"><span class="chart-card__title">Cumulative units</span><span class="chart-card__note">2026-27 · graded days</span></div>
  <Fragment set:html={svg} /></div>
```
Charts inherit the theme through `.ch` CSS (`var(--fg-3)` ticks, `var(--line)` grid). Pass theme
tokens as colours (`'var(--accent)'`, `'var(--pos)'`, `'var(--neg)'`, `'var(--hl)'`). For client-side
re-rendering, import the same functions in a `<script>` and set `innerHTML`.

### Motion and depth (already wired)

- Scroll reveal: add `class="reveal"` (plus `--i:1..n` in `style` for stagger, or `reveal--left`,
  `reveal--scale`). Any `.draw` SVG container animates its strokes on entry.
- Count-up numbers: `<Stat count={…} format="…" />` or any element with `data-count`/`data-format`.
- Parallax: `data-parallax="0.12"` on a decorative layer (keep factors ≤ 0.2).
- Pop-ups: `<Dialog id="x" title="…">` + a trigger with `data-dialog-open="x"`. Use them for
  "more info" on methodology, each project's data sources, and anything that would otherwise
  bloat the page. At least two purposeful dialogs per project page; the home page uses them for
  skill details.
- Page transitions between tabs are automatic (ClientRouter). Because the body is swapped on
  navigation, initialise page scripts inside `document.addEventListener('astro:page-load', …)`
  and guard with `if (!document.getElementById('…')) return;`.
- Hero backgrounds: build vibrant, theme-coloured visuals with layered CSS gradients, SVG patterns
  (court lines, field hashes, a diamond, a price grid, a blueprint grid), and large data charts
  drawn from the JSON. Use `.hero`, `.hero__bg`, `.grain` from global.css. Big, confident type.

### Layout vocabulary (global.css)

`.container` (1180 px), `.container--narrow`, `.container--wide`, `.section`, `.section--tight`,
`.section--bordered`, `.section-head`, `.grid .grid--2/3/4/auto`, `.split`, `.stack`, `.cluster`,
`.row`, `.between`, `.card`, `.card--hover`, `.card--sunk`, `.panel`/`.panel__head`/`.panel__body`,
`.btn .btn--primary/ghost/soft/sm/lg`, `.chip`, `.chip--accent/pos/neg/warn/outline/btn`, `.badge`,
`.badge--live/soft`, `.stat`, `.stat-row`, `.table-wrap` + `table.table` (`td.num`), `.chart-card`,
`.legend`, `.kicker`, `.eyebrow`, `.lead`, `.callout`, `.callout--warn`, `.step-list` + `.step`
(`.step__num` auto-numbers), `.feature`, `.kv` (dl), `.shot` (figure with img + figcaption),
`.external` (adds an arrow to a link), `.proj-bar`, `.hero`, `.hero__bg`, `.hero__actions`,
`.hero__meta`, `.grain`, `.mono`, `.num`, `.muted`, `.small`, `.text-pos/neg/accent`, `.prose`.
Spacing: sections use `var(--section)`; inside cards use 8-px multiples. Max text measure 68ch.

## 4. Themes and fonts per page

| Page | theme prop | display font | body font | page must import |
|---|---|---|---|---|
| Home `/` | `paper` (default) | Schibsted Grotesk | Instrument Sans | nothing extra |
| NBA Props | `nba` | Bebas Neue (uppercase display) | Barlow | `@fontsource/bebas-neue`, `@fontsource/barlow/400.css`, `/500.css`, `/600.css`, `/700.css` |
| Draft Copilot | `draft` | Anton | Poppins | `@fontsource/anton`, `@fontsource/poppins/400.css`, `/500.css`, `/600.css`, `/700.css` |
| Kalshi MLB | `kalshi` | Schibsted Grotesk | Instrument Sans (+ heavy use of Spline Sans Mono for prices) | nothing extra |
| NFL Totals | `nfl` | Schibsted Grotesk (light, airy) | Instrument Sans | nothing extra |
| Sleeper Client | `sleeper` | Schibsted Grotesk | Instrument Sans (+ Spline Sans Mono for code) | nothing extra |

Theme tokens available on every page: `--bg --bg-elev --bg-sunk --fg --fg-2 --fg-3 --line
--line-strong --accent --accent-hover --accent-fg --accent-soft --hl --pos --neg --warn` (NBA also
`--wood --wood-deep`; NFL also `--purple`). The nav, footer and dialogs restyle themselves.

## 5. Page specifications

Each page: `src/pages/<route>.astro` using `<Base title=… description=… theme=…>`. Page-only
components go in `src/components/<page>/`, page scripts in `src/scripts/<page>-*.ts`, page styles in
a `<style>` block (scoped) or `<style is:global>` for chart/innerHTML content, prefixed with the
page class (e.g. `.nba-…`). Every project page starts with a `.proj-bar` row (period, status,
chips of the stack, buttons for the links from `projects.ts`) and ends with a "More from the
portfolio" strip linking the other four tabs, then relies on the shared footer.

### 5.1 Home (`src/pages/index.astro`, theme `paper`, port 4331)
Calmer and more conventional than the project tabs, but still crafted. Sections, in order:
1. **Hero**: kicker (available / what I do), `h1` with the tagline, lead paragraph, two buttons
   (See the projects → `#projects`, Get in touch → `data-dialog-open="contact"`), and the
   headshot slot on the right: if `site.headshot` is set render `<img>`, else a square placeholder
   frame with the initials, a fine grid pattern and a caption "Headshot coming soon" is NOT wanted;
   instead caption nothing, just a tasteful placeholder. Add a subtle decorative background
   (fine grid plus one ultramarine and one yellow (`--hl`) shape, no purple).
2. **Proof strip** (`.stat-row` with `<Stat>`): 5 projects; 3 live deployments; 4 languages
   (Python, Rust, TypeScript, Java); 40k+ lines of code across the repositories.
3. **About**: the two paragraphs from `site.about`, plus a "Now" list from `site.now`, and the
   elsewhere links (GitHub, Tableau, LinkedIn if set).
4. **Projects**: five cards from `projects.ts` (name, oneLiner, period, stack chips, three facts,
   "Open the tab" link, `--swatch` colour accent, a small sparkline/mini-graphic drawn from the
   project's JSON where available: NBA cumulative units, Kalshi price path, NFL model vs Vegas,
   Draft ADP curve, Sleeper a tiny endpoint schematic). Use `.card--hover` and stagger reveals.
   Bento layout on desktop (first card wider), single column on phone.
5. **Skills and where they were applied**: render `skillGroups`. Each skill is a `.chip--btn`
   that opens a `<Dialog>` listing its applications with links to the project tabs. Also show a
   compact matrix table (skill × project with check icons) for scanning.
6. **How I work**: five steps (Collect → Model → Validate → Ship → Monitor), each with one
   concrete example from the facts in section 6.
7. **Contact band**: short invitation, button opens the contact dialog, email shown as text.

### 5.2 NBA Player Prop Model (`src/pages/projects/nba-player-prop-model.astro`, theme `nba`, port 4332)
Keep the project's own identity: hardwood dark palette, Bebas Neue uppercase display headings,
court-line rules (`repeating-linear-gradient` in wood tones), grade badges (A+ … D), OVER in
`--pos`, UNDER in `--warn`/`--hl`. Sections:
1. Hero with a large chart of cumulative units (2026-27) as the backdrop graphic and headline
   stats (season record W-L, units, hit rate, graded days) from `nba.json.seasons['2026-27']`.
   Report the real numbers; the current season is negative. Frame it as a live, self-grading
   system: "published nightly, wins and losses alike".
2. **How a pick is made**: a seven-step `.step-list` from the README methodology (candidates →
   projection → matchup multiplier → probability vs de-vigged market → guards and caps → grading →
   closing-line value). A dialog "Grading thresholds" shows `nba.json.latest.thresholds` and caps.
3. **Record**: chart card (cumulative units line, area), bar chart of daily units, table of
   `seasons` and `allTime`. A "Refresh from the live repo" button fetches
   `nba.json.liveData.resultsHistory` (CORS is open on raw.githubusercontent.com) and re-renders
   the numbers and chart client-side; on failure it says the snapshot date instead. Show the
   snapshot date.
4. **By stat and by grade**: two bar charts from `byStat`, `byGrade` (hit rate, n, units).
5. **Last graded board**: table from `lastBoard.rows` (player, matchup, stat, side, line, price,
   actual, result, grade, units), with the night's totals and CLV summary.
6. **The learning loop**: learner facts (`learner`: 27 features, nRows, nDays, mode shadow,
   trusted false, fail/pass streak) and the post-mortem (`postmortem.wentRight/wentWrong/biggestMisses`).
   Explain the activation gate in two sentences (walk-forward, must beat the de-vigged price).
7. **Pipeline**: the five schedules (night-before board, morning board, two fill runs, 30-minute
   closing-line snapshots, 5:30 AM grading), concurrency groups, "a failed step blocks the data
   commit", the stats.nba.com datacenter-block and proxy/probe tasks, Tableau export.
8. Links: live board, Tableau dashboard, GitHub. Dialog: "Data sources and lines" (The Odds API
   sportsbooks list, DFS backup, credits budget sentence).

### 5.3 Draft Copilot (`src/pages/projects/draft-copilot.astro`, theme `draft`, port 4333)
Port the landing site's identity (turf green, lime, chalk, Anton + Poppins, ruled rows "like
lines on a field", CC0 turf/stadium photos with dark gradient overlays, the field-hash stripe
pattern `repeating-linear-gradient(90deg, rgba(255,255,255,.09) 0 3px, transparent 3px 180px)`).
Sections:
1. Hero: headline from the landing page ("A live assistant for your fantasy draft"), sub, buttons
   (GitHub, hosted app), and the cockpit screenshot in a `.shot` card over the turf photo.
2. **What it does**: survival odds (400 simulated drafts per pick), live board, plain-English
   chat, injury flags, rookie draft-capital logic, strategy presets, "advises only". Ruled rows.
3. **Platforms**: Sleeper live, Yahoo beta (official OAuth), ESPN experimental, NFL.com later.
4. **The model** (four components with the score formula from the README; r² table RB .983,
   WR .981, TE .935, QB .847; projections shrink 28% toward 2025 adjusted PPG; ADP independent of
   the guide; Monte Carlo + VONA). Dialog "Strategy knobs" listing the knob names and six presets.
5. **Interactive: ADP consumption curves**: an SVG chart of positional rank → overall pick using
   `draft.json.anchors` (RB, WR, QB, TE, K, DEF) with a toggle to swap QB to `superflexQb`, hover
   or a range input to read "RB18 is usually gone by pick 32". Port `LogLogCurve` faithfully:
   monotone piecewise-linear interpolation in log-log space between anchors; beyond the last
   anchor extrapolate with the last segment's slope.
6. **Architecture**: Python stdlib server, SQLite, web panel (screenshots: panel, sidebar,
   mobile), Chrome extension that is a viewer only (iframe, no scraping, no clicks), MCP server
   with 18 tools, LLM chat with non-LLM fallback, Google sign-in accounts, Yahoo OAuth, Docker,
   Fly.io/Render, Vercel rewrites and CSP, rate limiting by forwarded IP, 72 tests.
7. **Honesty box**: "It shows its work" and "it never makes a pick". FAQ as `<details>`.
8. Credit line: rankings and strategy built on Joel Smyth's 2026 Draft Guide (not affiliated).

### 5.4 Kalshi MLB Market Analysis (`src/pages/projects/kalshi-mlb-market-analysis.astro`, theme `kalshi`, port 4334)
New design: a trading-terminal feel. Near-black navy, thin grid lines, green/red price colours,
mono numerals, a subtle baseball-diamond line drawing as a hero motif. Sections:
1. Hero: title, one-liner, stat chips (6 games, 455 events, 882 games collected, 66k+ events),
   and the real MIN @ HOU moneyline path (`gamePath.series`, cents vs minutes) as a large chart
   with scoring plays marked (`gamePath.scoringPlays`), drawn in `.draw` so it animates.
2. **How prices react**: table from `summary` (event, n, immediate, drift, volume spike, totals
   immediate) ordered home run, scoring play, walk/HBP, single, double/triple, strikeout, out in
   play; and a grouped bar chart (immediate vs drift).
3. **Reaction path**: line chart of `reactionPath.series` by minute (−3…+8) for home run, scoring
   play, single, walk/HBP, strikeout, out in play.
4. **Momentum, not overreaction**: scatter of `momentum.points` (immediate vs drift, |imm| ≥ 3¢),
   trend line, ρ = 0.173, p = 0.032, n = 151; ride +0.96¢ vs fade −0.96¢ gross; asymmetry
   (`asymmetry`: drift after an up move +2.33¢ vs +0.02¢ after a down move).
5. **Speed and leverage**: `byInning` bars (mean |immediate| 4.1¢ / 3.2¢ / 1.2¢), "87% of a home
   run's 7-minute move completes within 2 minutes", liquidity (median spread 1¢, median 3-minute
   volume about $12.5k, about 1.9× baseline).
6. **Caveats** (from REPORT.md): single slate, timestamp leakage understates reactions, window
   overlap, taker fees (about 1.75¢ at 50¢) would eat the edge so execution must be maker-side.
7. **From study to system**: the Rust workspace (collector, paper-trader, common), win-probability
   engine (RE24, team ratings, logistic calibration, unit-tested against the Python reference),
   maker entries, queue-accurate fills, fee-aware exits, adaptive thresholds, risk controls
   (single-clip sizing, one side per game, salvage exits, per-market loss stops, feed-freshness
   guards), launchd deploy from an isolated live clone, tracker dashboard on :8787.
   Dialog "Risk layer" with the default limits from `risk.rs` ($25 total exposure, $5 per market,
   $5 daily loss lockout, 10 orders/min, 5¢ max distance from mid; durable lockout files; no bypass).
   Dialog "Live execution spec" (two calls, idempotent client_order_id, two-key prod turn).
8. **Research honesty**: the survivorship-bias audit invalidated the original edge; recency and
   streak weighting rejected; paper trading only, no order placement code.
9. Links: GitHub, REPORT.md. Also show the real matplotlib figure (`kalshi-reaction-analysis.png`)
   in a `.shot` with a caption, as a provenance artefact.

### 5.5 NFL Game Totals (`src/pages/projects/nfl-game-totals.astro`, theme `nfl`, port 4335)
Port the dashboard's light look: slate background with soft blue wash, white cards, rounded
corners, blue (Vegas), purple (Model), emerald (Over/edge+), rose (Under/edge−), amber (Pct)
tiles, team initials in coloured circles. Replace the original emojis with icons. Sections:
1. Header like the app: "NFL Game Predictions", playoff weekend from `nfl.json.playoffWeekend`,
   "Data from nflfastR · Vegas lines from The Odds API · generated Jan 15, 2026", a snapshot note.
2. Summary stat cards (games analysed, avg edge, over picks, under picks) and the model
   performance card (R², MAE, RMSE, training samples) from `modelMetrics`/`summaryStats`.
3. Four game cards from `games` reproducing the original card layout (away/home rows with EPA,
   score projections, Vegas/Model/Edge/Pct tiles, recommendation badge).
4. Charts: dumbbell/line of model vs Vegas totals per game; scatter of the 8 playoff teams'
   offensive vs defensive EPA per play (`teams`), labelled, with the league (`league`) as faint dots.
5. **How it works** dialog (data sources, 16 features, linear regression, injury adjustment of 15%
   EPA per high-impact injury, ±2.0 edge threshold, disclaimer) and **Injury report** dialog
   (no high-impact injuries flagged in the snapshot; ESPN source; link).
6. **Pipeline**: numbered scripts from `scripts` (odds fetch → enhanced analysis → injuries →
   model → export), Vercel deploy, weekly scheduler.
7. **Historical validation**: 2022–2024, 148,591 plays, 854 games, 80/20 split, test R² 0.5477,
   MAE 6.70, RMSE 8.61, top features (home pass yards, home off EPA, away def EPA, away pass yards,
   home turnovers). Be clear that the dashboard snapshot's metrics (R² 0.2347, 272 samples) are
   the 2024-season fit and that the historical check is the generalisation test.
8. Links: live dashboard, GitHub.

### 5.6 Sleeper API Java Client (`src/pages/projects/sleeper-api-client.astro`, theme `sleeper`, port 4336)
New design: engineering blueprint. Deep blue, white grid pattern background (`.hero__bg` with a
repeating grid), cyan accents, monospace labels, bracketed section numbers. Sections:
1. Hero: title, one-liner, honest lineage line ("a fork of sdcalmes/sleeper-api, extended toward
   a draft assistant"), buttons (GitHub, upstream, Sleeper docs).
2. **What the client covers**: endpoint groups mapped to the Java packages from
   `sleeper.json.groups` (Draft, League, Player, Stats, User, Other, Errors, root), file counts,
   4,330 lines of Java, 7 JUnit test classes, Gradle, CircleCI.
3. **Code**: the README usage examples in `<pre>` blocks (new client, getByUsername,
   getAllLeaguesForUserBySeason, getAllDraftsForUser, getAllPlayers with the once-a-day note).
4. **Architecture diagram**: an SVG schematic (drawn by you) of Sleeper REST → client groups →
   POJOs → your code, animated with `.draw`.
5. **Interactive: Sleeper API explorer** (`src/scripts/sleeper-explorer.ts`): a form that takes a
   Sleeper username, calls `https://api.sleeper.app/v1/user/<name>` then
   `/v1/user/<user_id>/leagues/nfl/<season>` and `/v1/user/<user_id>/drafts/nfl/<season>`
   (season selector defaulting to 2026), and renders the results as cards while showing the
   equivalent Java call for each step. Handle failures (unknown user, network/CORS) with a clear
   message. Never store anything. Note that it calls Sleeper's public API directly from the browser.
6. **Where it led**: the `footballDraft extends Draft` extension and the idea's continuation in
   Draft Copilot (link to that tab).
7. Dialog "Endpoint reference": a table of the Sleeper endpoints the client wraps.

## 6. Verified facts and their sources

All paths are relative to `/home/user/<repo>/` unless noted. Quote numbers exactly.

**Author**: Sid Subramanian (Sidharth), GitHub `SidSub1041`, Tableau Public profile
`sidharth.subramanian7031`. Nothing else about the author is known; do not add any.

**NBA-Player-Prop-Model** (`README.md`, `.github/workflows/run-model.yml`, `web/`, `logs/`)
- Edge model for points, rebounds, assists and combos; projection from two seasons of game logs
  blended by sample size (this season weight n/(n+10)); matchup multiplier clipped 0.80–1.25
  (defense vs position at half strength, pace, shot zones and playtypes for points, teammates out
  +3% per OUT starter up to two); normal distribution for points/combos, negative binomial for
  rebounds/assists; market = best price across books de-vigged multiplicatively; blend
  MODEL_TRUST 0.5; edge = blended probability − break-even of the price taken.
- Guards: price no worse than −121, at least 3 sportsbooks, line at least 4.0, at least 24
  projected minutes, passing projection for assists; caps 15 plays, 3 per game, 1 per player.
- Grades: A+ ≥ 6 points of edge, A ≥ 3, B+ ≥ 1.5, B > 0, C ≤ 0, HOLD = no line.
- Closing-line value: snapshot runs every 30 minutes; a close counts only when re-priced within
  90 minutes of tip; CLV = closing line minus line taken, and de-vigged closing probability minus
  pick-time probability.
- Learning loop: labels every prop with a line (~100 a night), L2-regularized logistic regression
  retrained nightly, walk-forward check against two baselines (average hit rate and the de-vigged
  price), must beat the stronger baseline by ≥ 1% on ≥ 300 props over ≥ 10 nights on three
  retrains in a row to go active; otherwise shadow mode. Current `logs/learner.json`: 27 features,
  2,979 rows, 41 days, mode shadow, trusted false, fail streak 13.
- Schedules (UTC crons): 30 2 (night-before board), 15 13 (morning), 0 17 and 0 21 (fill runs),
  15,45 15-23,0-3 (snapshots), 30 9 (grading); concurrency groups `pages` and `snapshots`;
  deploy to GitHub Pages at https://sidsub1041.github.io/NBA-Player-Prop-Model/ ; stats.nba.com
  blocks datacenter IPs so runs need an NBA_PROXY secret or a local runner; a failed model/grade
  step blocks the data commit; CSV fact tables exported for Tableau.
- Lines: The Odds API, `us` region books (DraftKings, FanDuel, BetMGM, BetRivers, Bovada,
  BetOnline), `us_dfs` backup (PrizePicks, Underdog, DraftKings Pick6, Betr, Dabble); about
  200–250 credits a day.
- Results snapshot (`src/data/nba.json`, from `web/public/data/daily_results.csv`): 2025-26
  season 28 picks, 15-13, +0.17u over 7 graded days (Apr 8 – Jun 5 2026); 2026-27 season 295
  picks, 137-158 (5 voided), −29.28u over 14 graded days (Oct 20 – Nov 2 2026); all time 323
  picks, 152-171, −29.11u. Best day +4.00u (Oct 20), worst −12.28u (Oct 26). Last graded board
  Nov 2 2026: 15 picks, 9-6, +3.18u.
- Repo stats: about 11,100 lines of Python, 2,000 of TypeScript/TSX; Next.js 14, Tailwind;
  Tableau dashboard link in `projects.ts`.

**kalshi-mlb-market-analysis** (`README.md`, `REPORT.md`, `analyze.py`, `data/`, `kalshi-pipeline/`,
`docs/LIVE_EXECUTION_SPEC.md`, `deploy/README.md`, `kalshi-pipeline/crates/common/src/risk.rs`)
- Pilot: June 30 2026 slate, 6 games, 1-minute candles for KXMLBGAME and KXMLBTOTAL, 455
  plate-appearance events aligned to MLB Stats API timestamps.
- Reactions (cents, batting team's perspective): HR n=22 +7.4 immediate +2.4 drift 4.5× volume;
  walk/HBP n=45 +3.8/+1.5/2.5×; single n=76 +2.8/+1.6/2.3×; double-triple n=10 +1.9/−0.7/1.6×;
  strikeout n=98 −1.5/+0.2/1.4×; out in play n=203 −1.5/+0.3/1.5×; any scoring play n=46
  +7.8/+1.5/4.4× (snapshot computes 6.3× mean ratio; use the report's 4.4× or the snapshot's
  value with its definition, not both). Totals: scoring plays +12.1¢ immediate; outs −2.2¢.
- Momentum: on |ΔP| ≥ 3¢, corr(immediate, drift) ρ = +0.17, p = 0.033 (snapshot 0.173/0.032,
  n = 151); fading loses −0.96¢/event gross, riding wins +0.96¢ gross, +0.37¢ net of half-spread.
- Asymmetry: drift after positive immediate move +2.3¢; after negative ≈ 0.
- Speed: ~87% of a home run's 7-minute move completes within 2 minutes.
- Innings: mean |immediate| 4.1¢ (1–3), 3.2¢ (4–6), 1.2¢ (7+). Median spread 1¢, median
  3-minute event volume ≈ $12.5k, about 2× baseline.
- Caveats: single slate; MLB endTime lags the decisive moment by 30–60 s so reactions are
  understated and one 8th-inning HR sign-flipped; overlapping windows; Kalshi taker fees
  (quadratic, ≈ 1.75¢ at 50¢) eat the ride edge, so execution must be maker-side (no fees).
- Pipeline: Rust workspace (collector ~8 req/s under a ~10/s public limit, resumable; paper
  trader with queue-accurate fill simulation, fee-aware exits, adaptive thresholds; common crate
  with auth signing, portfolio reads, RE24 + team ratings + logistic win-probability engine,
  unit-tested against the Python reference); 882 games and 66k+ events collected; `wp_model.py`
  backtest with the survivorship-bias audit that invalidated the original edge; `train.py`
  weekly walk-forward HistGradientBoosting over 1/3/5/10-minute horizons; `tracker_server.py`
  dashboard on localhost:8787; launchd agents from an isolated live clone; paper trading only,
  no order-placement code in the trader.
- Risk defaults (`risk.rs`): max exposure 2,500¢, per-market cap 500¢, daily loss stop 500¢,
  10 orders per minute, max 5¢ from mid; pure module, lockout files, dead-man switch, no bypass.
- Live execution spec: POST /trade-api/v2/portfolio/orders and DELETE …/orders/{id}; one
  client_order_id per intent reused on retries; must refuse to start on prod hosts unless
  `confirm_prod = true` (two-key turn).
- Repo stats: ~2,300 lines of Rust, ~1,300 of Python; Jul–Sep 2026.

**model-game-totals** (`README.md`, `ADVANCED_README.md`, `HISTORICAL_MODEL.md`, `app/`,
`components/`, `public/data/`, `scripts/`)
- Linear regression (scikit-learn) on game totals; nflfastR 49,000+ plays from 2024–2025
  weighted 30/70; 16 features (EPA passing/rushing/defensive, yards, TDs, turnovers, sack rates,
  head-to-head, injury adjustment −15% EPA per high-impact injury, seasonal weighting); edge
  threshold ±2.0 points for a recommendation.
- Snapshot (`public/data/nfl_analysis.json`, generated Jan 15 2026, Divisional Round Jan 18–19
  2026): metrics R² 0.2347, MAE 8.84, RMSE 11.45, 272 training samples; 4 games: Bills @ Broncos
  (Vegas 45.5, model 50.8, edge +5.3, over), 49ers @ Seahawks (45.5 / 47.4 / +1.9 / hold),
  Texans @ Patriots (40.5 / 43.5 / +3.0 / over), Rams @ Bears (48.5 / 44.4 / −4.1 / under);
  summary avg edge 4.8, 1 over, 1 under, 2 hold. Injury report: no high-impact injuries.
- Historical model (`HISTORICAL_MODEL.md`): 2022–2024, 148,591 plays, 854 games, 683 train /
  171 test, test R² 0.5477, MAE 6.70, RMSE 8.61; top features home pass yards, home off EPA,
  away def EPA, away pass yards, home turnovers.
- Stack: Next.js 16.0.10, React 19, Tailwind, Radix UI (shadcn components), Recharts, Vercel;
  Python 3.13, pandas, scikit-learn, nfl_data_py; scripts list in `nfl.json.scripts`; live at
  https://model-game-totals.vercel.app ; "Designed by Sid Subramanian" in the app header.

**ff-draft-bot** (`README.md`, `site/index.html`, `store/listing.md`, `DEPLOY.md`, `extension/README.md`,
`server/ffbot/*.py`, `server/tests/`, `vercel.json`, `fly.toml`)
- Trained on Joel Smyth's 2026 Draft Guide (parsed from PDF: big boards PPR and half-PPR of 150,
  positional ranks 60 RB / 60 WR / 32 QB / 32 TE per format, 2025 adjusted PPG tables 46 RB /
  48 WR / 32 QB / 28 TE, 36 dynasty rookies, top-50 stats; cross-checked 7 of 8 lists with zero
  mismatches; no DST or kicker rankings and it says so).
- Model: value curves ppg(rank) = A·(rank + r0)^−b + C, r² RB .983 WR .981 TE .935 QB .847;
  projections shrink 28% toward 2025 adjusted PPG; sigma = floor + slope·ppg widened for rookies;
  ADP independent of the guide via Sleeper search_rank through consumption curves (QB3 → pick
  55.0 vs guide 55; Parker Washington ADP 84 vs guide 85); Monte Carlo 400 futures per pick with
  an opponent model; score = value now + 0.85 × expected board at next pick + urgency term.
- Presets: joel_rb_heavy (default), zero_rb, hero_rb, bpa, superflex, dynasty; knobs include
  rb_target_top_n 30, rb_dead_zone (30,40), wr_sweet_rounds (3,5), rb_target_count 3,
  qb_min_round 7, te2_penalty, bench_targets, max_pos, urgency_weight, reach_penalty_per_pick,
  value_bonus_per_pick, upside_weight_late.
- ADP anchors (`src/data/draft.json`): per position lists of (positional rank, overall pick) for
  a 12-team league; superflex QB anchors separate; LogLogCurve interpolation.
- Product: web app, Chrome extension (viewer only: iframe, no page reads, no clicks; permissions
  storage + localhost), MCP server with 18 tools, CLI (`ffbot connect|mock|drafts|review|strategy`),
  learned ADP after ~8 drafts, agreement tracking, player bumps, notes; accounts via Google
  sign-in with draft archive, review chat and saved strategy; Yahoo via official OAuth; sessions
  rate-limited by forwarded client IP; 72 tests; landing site with privacy and terms; Vercel
  rewrites to `sids-draft-copilot.fly.dev` with a strict CSP; Dockerfile, fly.toml, render.yaml;
  "advisory only, it never makes a pick"; stadium and turf photography CC0.
- Repo stats: ~10,600 lines of Python, ~1,900 JS, ~1,100 HTML; Aug 2026.

**Fantasy-Football-Draft-Assistant** (`README.md`, `src/`, `build.gradle`, `.circleci/config.yml`)
- Fork of sdcalmes/sleeper-api: "Java adapter to use the Sleeper API"; groups Users, Leagues,
  Drafts, Players (Stats not yet implemented upstream); POJOs; usage examples in README;
  warning that getAllPlayers is ~5 MB and should run at most once a day.
- Packages (`src/data/sleeper.json`): Draft (8 files), League (15), Player (5), Stats (4),
  User (3), Other (5), Errors (2), root (3: Metadata, Sleeper, SleeperApi); 4,330 lines of Java;
  tests DraftTest, LeagueTest, NflLeagueTest, PlayerTest, StatTest, StatesTest, UserTest.
- The author's commits (Jan 2024) add `footballDraft extends Draft` in Draft/DraftModels: the
  starting point of a draft assistant that was later built as Draft Copilot. Say exactly this;
  do not inflate it.

## 7. Data snapshot shapes

(Generated from the JSON; `[n × {…}]` means an array of n objects shaped like the first.)

### src/data/nba.json
```
{
  snapshotAt: "2026-11-03T19:02:15+00:00"
  source: "web/public/data/*.csv|json and logs/*.json in Si"…
  liveData: {
    resultsHistory: "https://raw.githubusercontent.com/SidSub1041/NBA"…
    latest: "https://raw.githubusercontent.com/SidSub1041/NBA"…
  }
  currentSeason: "2026-27"
  seasons: {
    2025-26: {
      picks: 28
      hits: 15
      misses: 13
      voided: 7
      units: 0.17
      hitRate: 0.5357
      gradedDays: 7
      bestDay: {…}
      worstDay: {…}
      first: "2026-04-08"
      last: "2026-06-05"
    }
    2026-27: {
      picks: 295
      hits: 137
      misses: 158
      voided: 5
      units: -29.28
      hitRate: 0.4644
      gradedDays: 14
      bestDay: {…}
      worstDay: {…}
      first: "2026-10-20"
      last: "2026-11-02"
    }
  }
  allTime: {
    picks: 323
    hits: 152
    misses: 171
    voided: 12
    units: -29.11
    hitRate: 0.4706
    gradedDays: 21
    bestDay: {
      date: "2026-10-20"
      units: 4.0
    }
    worstDay: {
      date: "2026-10-26"
      units: -12.279
    }
    first: "2026-04-08"
    last: "2026-11-02"
  }
  daily: [22 × {
      date: "2026-04-08"
      season: "2025-26"
      picks: 7
      hits: 5
      misses: 2
      voided: 1
      units: 2.852
      clvAvgLine: None
      clvBeat: None
    }]
  cumulative: {
    2025-26: [8 × {…}]
    2026-27: [14 × {…}]
  }
  gradedRows: 323
  byStat: [7 × {
      key: "assists"
      n: 105
      hits: 48
      hitRate: 0.457
      units: -12.33
    }]
  byGrade: [2 × {
      key: "A+"
      n: 212
      hits: 99
      hitRate: 0.467
      units: -21.99
    }]
  bySide: [2 × {
      key: "over"
      n: 194
      hits: 88
      hitRate: 0.454
      units: -17.45
    }]
  lastBoard: {
    date: "2026-11-02"
    picks: 15
    hits: 9
    misses: 6
    voided: 0
    units: 3.18
    clv: {
      n: 6
      unverified: 9
      avg_line: -0.833
      beat_close: 0.0
      pushed_close: 0.667
      avg_prob: -0.0276
    }
    rows: [15 × {…}]
  }
  learner: {
    features: [27 × "hr_line"]
    nRows: 2979
    nDays: 41
    mode: "shadow"
    trusted: False
    trainedAt: "2026-11-03T17:14:44Z"
    passStreak: 0
    failStreak: 13
  }
  latest: {
    date: "2026-11-04"
    runAtIso: "2026-11-03T09:57:53+00:00"
    modelVersion: "edge-1"
    thresholds: {
      condition_pass_rate: 0.8
      condition_pass_rate_points: 0.6
      hitrate: 0.56
      min_edge: 0.03
      strong_edge: 0.06
      max_price: -121
      min_books: 3
      min_line: 4.0
      min_proj_minutes: 24.0
      max_picks: 15
      max_per_game: 3
    }
    caps: {
      max_picks: 15
      max_per_game: 3
      max_per_player: 1
    }
    validCount: 0
    candidates: 3
  }
  postmortem: {
    date: "2026-11-02"
    allProps: {
      hits: 309
      misses: 298
      rate: 0.509
      n: 607
      ci: [2 × 0.469]
    }
    scope: "segments cover every prop with a line that night"…
    wentRight: [3 × {…}]
    wentWrong: [3 × {…}]
    biggestMisses: [5 × {…}]
  }
}
```

### src/data/kalshi.json
```
{
  snapshotAt: "2026-11-03T19:02:15+00:00"
  source: "data/*.csv and REPORT.md in SidSub1041/kalshi-ml"…
  pilot: {
    date: "2026-06-30"
    games: 6
    events: 455
    scoringEvents: 46
  }
  summary: [7 × {
      group: "home_run"
      n: 22
      imm: 7.41
      immMed: 5.5
      drift: 2.36
      volRatio: 4.45
      spread: 1.09
      totImm: 9.68
      immP: 0.001
    }]
  momentum: {
    n: 151
    rho: 0.173
    p: 0.032
    rideCents: 0.96
    fadeCents: -0.96
    points: [151 × {…}]
  }
  asymmetry: {
    afterUp: 2.33
    nUp: 63
    afterDown: 0.02
    nDown: 88
  }
  byInning: [3 × {
      bucket: "1-3"
      n: 161
      meanAbsImm: 4.1
    }]
  liquidity: {
    medianSpread: 1.0
    medianVol3min: 12502.0
    medianVolRatio: 1.9
  }
  reactionPath: {
    minutes: [12 × -3]
    series: {
      home_run: {…}
      scoring_play: {…}
      single: {…}
      walk_hbp: {…}
      strikeout: {…}
      out_in_play: {…}
    }
  }
  gamePath: {
    code: "MINHOU"
    label: "MIN @ HOU, Jun 30 2026"
    side: "HOU"
    ticker: "KXMLBGAME-26JUN302010MINHOU-HOU"
    series: [190 × {…}]
    scoringPlays: [6 × {…}]
  }
  games: [6 × {
      code: "DETNYY"
      away: "DET"
      home: "NYY"
      mlSide: "DET"
      mlResult: "yes"
      winner: "DET"
      totalLine: "12"
      totResult: "yes"
      start: "2026-06-30T23:05:00Z"
      close: "2026-07-01T01:54:31Z"
    }]
}
```

### src/data/nfl.json
```
{
  snapshotAt: "2026-11-03T19:02:15+00:00"
  source: "public/data/*.json in SidSub1041/model-game-tota"…
  generatedAt: "2026-01-15T13:30:07.582005"
  playoffWeekend: "Divisional Round - January 18-19, 2026"
  season: None
  trainingSeasons: [1 × 2024]
  modelMetrics: {
    r2_score: 0.2347
    mae: 8.84
    rmse: 11.45
    training_samples: 272
  }
  summaryStats: {
    gamesAnalyzed: 4
    avgEdge: 4.8
    overPicks: 1
    underPicks: 1
    holdPicks: 2
    avgModelTotal: 44.4
    avgVegasTotal: 45.0
  }
  games: [4 × {
      homeTeam: "Broncos"
      awayTeam: "Bills"
      homeAbbr: "DEN"
      awayAbbr: "BUF"
      gameDate: "Sat, Jan 17"
      gameTime: "TBD"
      vegasTotal: 45.5
      modelTotal: 50.75948577513918
      homeScore: 22.740619519725442
      awayScore: 28.01886625541374
      edge: 5.259485775139183
      recommendation: "over"
      homeOffEpa: 0.014999999664723873
      homeDefEpa: -0.09099999815225601
      awayOffEpa: 0.1899999976158142
      awayDefEpa: 0.008999999612569809
    }]
  teams: {
    DEN: {
      name: "Broncos"
      offEpaPlay: 0.0197
      defEpaPlay: 0.0543
      offPassEpa: 39.0
      offRushEpa: -33.8
      defPassEpa: 26.3
      defRushEpa: 62.7
      playsOff: 1446
      playsDef: 1539
    }
    BUF: {
      name: "Bills"
      offEpaPlay: 0.1396
      defEpaPlay: -0.0076
      offPassEpa: 213.9
      offRushEpa: 25.5
      defPassEpa: -89.4
      defRushEpa: 72.6
      playsOff: 1633
      playsDef: 1592
    }
    SEA: {
      name: "Seahawks"
      offEpaPlay: -0.0095
      defEpaPlay: 0.0102
      offPassEpa: 28.8
      offRushEpa: -45.6
      defPassEpa: -23.2
      defRushEpa: 43.6
      playsOff: 1401
      playsDef: 1418
    }
    SF: {
      name: "49ers"
      offEpaPlay: 0.0234
      defEpaPlay: -0.0642
      offPassEpa: 90.3
      offRushEpa: -25.1
      defPassEpa: -51.5
      defRushEpa: -2.8
      playsOff: 1358
      playsDef: 1336
    }
    NE: {
      name: "Patriots"
      offEpaPlay: -0.0639
      defEpaPlay: -0.0501
      offPassEpa: -11.5
      offRushEpa: -73.8
      defPassEpa: -113.7
      defRushEpa: 21.2
      playsOff: 1380
      playsDef: 1375
    }
    HOU: {
      name: "Texans"
      offEpaPlay: -0.018
      defEpaPlay: 0.0293
      offPassEpa: 4.0
      offRushEpa: -52.0
      defPassEpa: 17.1
      defRushEpa: 65.6
      playsOff: 1581
      playsDef: 1528
    }
    CHI: {
      name: "Bears"
      offEpaPlay: -0.0508
      defEpaPlay: -0.0111
      offPassEpa: -29.8
      offRushEpa: -53.7
      defPassEpa: -11.1
      defRushEpa: 12.4
      playsOff: 1427
      playsDef: 1339
    }
    LAR: {
      name: "LA"
      offEpaPlay: 0.0
      defEpaPlay: 0.0
      offPassEpa: 0.0
      offRushEpa: 0.0
      defPassEpa: 0.0
      defRushEpa: 0.0
      playsOff: 0
      playsDef: 0
    }
  }
  league: [32 × {
      team: "ARI"
      offEpaPlay: 0.0625
      defEpaPlay: -0.0493
    }]
  seasonWeights: {
    2024: 0.3
    2025: 0.7
  }
  injuries: {
    generatedAt: "2026-01-15T17:13:11.843167"
    source: "ESPN Injury Tracker (automated scraping with fil"…
    highImpact: []
    mediumImpact: []
    teams: {
      HOU: []
      NE: []
      BUF: []
      DEN: []
      SF: []
      SEA: []
      LAR: []
      CHI: []
    }
  }
  vegas: {
    generatedAt: "2026-01-15T13:45:09.283185"
    source: "The-Odds-API"
    gamesCount: 4
  }
  scripts: [18 × "01_generate_sample_data.py"]
}
```

### src/data/draft.json
```
{
  snapshotAt: "2026-11-03T19:02:15+00:00"
  source: "server/ffbot/*.py and server/data/*.json in SidS"…
  anchors: {
    RB: [10 × [2 × 1]]
    WR: [10 × [2 × 1]]
    QB: [9 × [2 × 1]]
    TE: [10 × [2 × 1]]
    K: [3 × [2 × 1]]
    DEF: [3 × [2 × 1]]
  }
  superflexQb: [10 × [2 × 1]]
  guide: {
    title: "Joel Smyth's Draft Guide 2026"
    lastUpdate: "2026-08-16"
    bigBoard: {
      ppr: 150
      half_ppr: 150
    }
    positional: {
      ppr: {…}
      half_ppr: {…}
    }
    adjPpg: {
      QB: 32
      TE: 28
      RB: 46
      WR: 48
    }
    dynastyRookies: 36
    top50Stats: 50
    strategyKeys: [4 × "source"]
  }
  rookies: 2
  mcpTools: 18
  tests: 72
  modules: [21 × "accounts"]
  presets: []
}
```

### src/data/sleeper.json
```
{
  snapshotAt: "2026-11-03T19:02:15+00:00"
  source: "src/ in SidSub1041/Fantasy-Football-Draft-Assist"…
  groups: {
    Draft: [8 × "Draft.DraftImpl"]
    Errors: [2 × "Errors.ErrorUtils"]
    League: [15 × "League.League"]
    (root): [3 × "Metadata"]
    Other: [5 × "Other.NflLeague"]
    Player: [5 × "Player.DepthChart"]
    Stats: [4 × "Stats.Stat"]
    User: [3 × "User.User"]
  }
  tests: [7 × "DraftTest"]
  javaLines: 4330
  files: 45
}
```

## 8. Verification checklist (run before you report)

1. `npx astro build --outDir /tmp/build-<page>` succeeds with no warnings about your files.
2. `npx astro preview --outDir /tmp/build-<page> --port <port> --host 127.0.0.1 &` then
   screenshot your route at 1440 and 390 px (adapt `scripts/screenshot.cjs` or write a tiny
   Playwright script in `.cjs`), and LOOK at the images (`Read` the PNG). Check: hierarchy,
   spacing, contrast, that the theme fonts rendered (Bebas Neue / Anton / etc.), no overflow.
3. In the same Playwright session: no console errors; every `data-dialog-open` on your page opens
   its dialog; interactive demos behave (ADP slider, API explorer error path, refresh button).
4. `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" <your files>` returns nothing.
5. Every number on the page is in section 6 or in the JSON; list in your report any claim you
   were unsure about.
