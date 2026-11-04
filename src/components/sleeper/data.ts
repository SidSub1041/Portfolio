/**
 * Page-only data for the Sleeper API client tab. Everything here is read from the
 * Fantasy-Football-Draft-Assistant repository (src/main/java, README.md, build.gradle,
 * .circleci/config.yml) or from src/data/sleeper.json. HTTP paths are quoted exactly as
 * the Retrofit interfaces declare them, including the four that omit the v1 prefix.
 */
export interface Endpoint { group: string; call: string; http: string; returns: string; note?: string }

export const endpoints: Endpoint[] = [
  { group: 'User', call: 'users().getByUsername(username)', http: 'v1/user/{username}', returns: 'User' },
  { group: 'User', call: 'users().getById(id)', http: 'v1/user/{id}', returns: 'User' },
  { group: 'League', call: 'leagues().getAllLeaguesForUserBySeason(userId, season)', http: 'v1/user/{user_id}/leagues/nfl/{season}', returns: 'List<League>' },
  { group: 'League', call: 'leagues().getById(leagueId)', http: 'v1/league/{league_id}', returns: 'League' },
  { group: 'League', call: 'leagues().getAllRostersInLeague(leagueId)', http: 'v1/league/{league_id}/rosters', returns: 'List<Roster>' },
  { group: 'League', call: 'leagues().getAllUsersInLeague(leagueId)', http: 'v1/league/{league_id}/users', returns: 'List<User>' },
  { group: 'League', call: 'leagues().getMatchupsForWeek(leagueId, week)', http: 'v1/league/{league_id}/matchups/{week}', returns: 'List<Matchup>' },
  { group: 'League', call: 'leagues().getTransactions(leagueId, week)', http: 'v1/league/{league_id}/transactions/{week}', returns: 'List<Transaction>' },
  { group: 'League', call: 'leagues().getTradedPicks(leagueId)', http: 'v1/league/{league_id}/traded_picks', returns: 'List<DraftPickTrade>' },
  { group: 'League', call: 'leagues().getPlayoffBracket(leagueId, bracketType)', http: 'v1/league/{league_id}/{bracket_type}_bracket', returns: 'List<PlayoffBracketEntry>', note: 'bracket_type is winners or losers' },
  { group: 'Draft', call: 'drafts().getAllDraftsForUser(userId, season)', http: 'v1/user/{user_id}/drafts/nfl/{season}', returns: 'List<Draft>' },
  { group: 'Draft', call: 'drafts().getDraftsForLeague(leagueId)', http: 'v1/league/{league_id}/drafts', returns: 'List<Draft>' },
  { group: 'Draft', call: 'drafts().getDraft(draftId)', http: 'v1/draft/{draft_id}', returns: 'Draft' },
  { group: 'Draft', call: 'drafts().getDraftPicksFromDraft(draftId)', http: 'v1/draft/{draft_id}/picks', returns: 'List<DraftPick>' },
  { group: 'Draft', call: 'drafts().getTradedPicksForDraft(draftId)', http: 'v1/draft/{draft_id}/traded_picks', returns: 'List<DraftPickTrade>' },
  { group: 'Player', call: 'players().getAllPlayers()', http: 'v1/players/nfl', returns: 'Map<String, Player>', note: 'about 5 MB; Sleeper asks for at most one call a day' },
  { group: 'Player', call: 'players().getPlayerByPlayerId(playerId)', http: 'players/nfl/{player_id}', returns: 'Player', note: 'declared without the v1 prefix' },
  { group: 'Player', call: 'players().getTeamDepthChart(team)', http: 'players/nfl/{team_abbr}/depth_chart', returns: 'DepthChart', note: 'declared without the v1 prefix' },
  { group: 'Stats', call: 'stats().getWeeklyStats(seasonType, season, week)', http: 'v1/stats/nfl/{season_type}/{season}/{week}', returns: 'Map<String, Stat>' },
  { group: 'Stats', call: 'stats().getSeasonStats(seasonType, season)', http: 'v1/stats/nfl/{season_type}/{season}', returns: 'Map<String, Stat>' },
  { group: 'Stats', call: 'stats().getWeeklyProjections(seasonType, season, week)', http: 'v1/projections/nfl/{season_type}/{season}/{week}', returns: 'Map<String, Stat>' },
  { group: 'Stats', call: 'stats().getSeasonProjections(seasonType, season)', http: 'v1/projections/nfl/{season_type}/{season}', returns: 'Map<String, Stat>' },
  { group: 'Stats', call: 'stats().getWeeklyPlayerStatsBySeason(playerId, seasonType, season)', http: 'stats/nfl/player/{player_id}?grouping=week', returns: 'Map<String, WeeklyPlayerStat>', note: 'declared without the v1 prefix' },
  { group: 'Stats', call: 'stats().getSeasonPlayerStatsBySeason(playerId, seasonType, season)', http: 'stats/nfl/player/{player_id}?grouping=season', returns: 'WeeklyPlayerStat', note: 'declared without the v1 prefix' },
  { group: 'Other', call: 'Metadata.getSportState(sport)', http: 'v1/state/{sport}', returns: 'SportState', note: 'states() is protected on SleeperApi; sport is NFL, NBA or LCS' },
];

/** Helpers in LeagueImpl that compose the endpoints above instead of declaring their own. */
export const derivedHelpers = [
  { call: 'leagues().getAllTransactionsForLeague(leagueId)', detail: 'Calls getTransactions for weeks 0 through 18 (Metadata.getNflNumberOfWeeks) and returns a map keyed by week.' },
  { call: 'leagues().getAllCompletedTransactionsForLeagueByTransactionType(leagueId, type)', detail: 'Filters that map to transactions with status complete, by type: trade, waiver, free_agent or all.' },
];

/** Display order and a one-line description of each package group in src/main/java/com/sdcalmes/sleeper. */
export const groupOrder = ['Draft', 'League', 'Player', 'Stats', 'User', 'Other', 'Errors', '(root)'] as const;

export const groupMeta: Record<string, { blurb: string; label: string }> = {
  Draft: { label: 'Draft', blurb: 'Drafts for a user or a league, one draft by id, its picks and its traded picks. Also carries footballDraft, the subclass added in this fork.' },
  League: { label: 'League', blurb: 'Leagues by user and season, one league by id, rosters, users, weekly matchups and transactions, traded picks and playoff brackets.' },
  Player: { label: 'Player', blurb: 'The full NFL player map (about 5 MB, meant for once a day), one player by id, and a team depth chart.' },
  Stats: { label: 'Stats', blurb: 'Weekly and season stats and projections by season type, plus per-player weekly and season lines. The README still calls Stats unimplemented; the source has it.' },
  User: { label: 'User', blurb: 'A user by username or by id. The first call every other example depends on.' },
  Other: { label: 'Other', blurb: 'Sport state for NFL, NBA or LCS, the Sports enum, and NflLeague teams with conference and division lookups.' },
  Errors: { label: 'Errors', blurb: 'ErrorUtils turns any non-2xx response into a SleeperError that carries the status code, message and request URL.' },
  '(root)': { label: 'root', blurb: 'The Sleeper interface, SleeperApi (Retrofit over OkHttp with a 2 MB disk cache, Gson for JSON) and Metadata, a static helper that fixes the NFL season at 18 weeks.' },
};

/** The usage examples from README.md, quoted as written (the braces are the README\'s placeholders). */
export const readmeExamples = [
  { id: 'client', label: '01 · new client', http: 'SleeperApi.java · base URL http://api.sleeper.app/', code: 'Sleeper sleeper = new SleeperApi();' },
  { id: 'user', label: '02 · users()', http: 'GET v1/user/{username}', code: 'User user = sleeper.users().getByUsername({username});' },
  { id: 'leagues', label: '03 · leagues()', http: 'GET v1/user/{user_id}/leagues/nfl/{season}', code: 'List<League> leagues = sleeper.leagues().getAllLeaguesForUserBySeason({userId}, {season_year});' },
  { id: 'drafts', label: '04 · drafts()', http: 'GET v1/user/{user_id}/drafts/nfl/{season}', code: 'List<Draft> drafts = sleeper.drafts().getAllDraftsForUser({user_id}, {season_year});' },
  { id: 'players', label: '05 · players()', http: 'GET v1/players/nfl', code: 'List<Player> players = sleeper.players().getAllPlayers();' },
];

/** build.gradle and .circleci/config.yml, as they stand in the fork. */
export const build = {
  plugins: ['java-library', 'com.github.johnrengelman.shadow 5.1.0', 'maven-publish', 'signing'],
  dependencies: [
    { scope: 'api', artifact: 'org.apache.commons:commons-math3', version: '3.6.1' },
    { scope: 'implementation', artifact: 'com.google.guava:guava', version: '27.1-jre' },
    { scope: 'implementation', artifact: 'com.google.code.gson:gson', version: '2.8.9' },
    { scope: 'implementation', artifact: 'com.squareup.retrofit2:retrofit', version: '2.6.0' },
    { scope: 'implementation', artifact: 'com.squareup.retrofit2:converter-gson', version: '2.6.0' },
    { scope: 'testImplementation', artifact: 'junit:junit', version: '4.12' },
  ],
  java: '1.8',
  version: '1.2.0',
  artifact: 'com.sdcalmes:sleeper-api',
  rootProject: 'SleeperApi',
  ciImage: 'circleci/openjdk:8-jdk',
  ciSteps: ['checkout', 'generate gradle.properties from the environment (environmentSetup.sh)', 'restore the dependency cache keyed on the build.gradle checksum', 'gradle dependencies', 'save the cache', 'gradle test'],
};
