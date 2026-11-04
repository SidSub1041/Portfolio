#!/usr/bin/env python3
"""Refresh the portfolio's data snapshots from the sibling project checkouts.

The site is static: every chart and number on a project tab comes from the
JSON files in src/data/, which this script rebuilds from the real project
repositories. Run it whenever a project has new data:

    python3 scripts/extract_data.py [--root /path/containing/the/repos]

Expected sibling checkouts (any missing one is skipped with a warning):
    NBA-Player-Prop-Model, kalshi-mlb-market-analysis, model-game-totals,
    ff-draft-bot, Fantasy-Football-Draft-Assistant
"""
from __future__ import annotations

import argparse
import ast
import csv
import json
import math
import re
import statistics
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "src" / "data"


def warn(msg: str) -> None:
    print(f"warning: {msg}", file=sys.stderr)


def dump(name: str, payload: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(payload, indent=1, sort_keys=False) + "\n")
    print(f"wrote {path.relative_to(HERE.parent)} ({path.stat().st_size // 1024} KB)")


def r(x, nd=3):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), nd)


def pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return None, None
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    if sxx == 0 or syy == 0:
        return None, None
    rho = sxy / math.sqrt(sxx * syy)
    # two-sided p-value from the t distribution (normal approximation is fine at n~100)
    t = rho * math.sqrt((n - 2) / max(1e-12, 1 - rho * rho))
    p = 2 * (1 - 0.5 * (1 + math.erf(abs(t) / math.sqrt(2))))
    return rho, p


# ----------------------------------------------------------------------------- NBA
def extract_nba(root: Path) -> None:
    repo = root / "NBA-Player-Prop-Model"
    if not repo.exists():
        return warn("NBA-Player-Prop-Model not found")
    data = repo / "web" / "public" / "data"

    daily = []
    with open(data / "daily_results.csv", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            daily.append({
                "date": row["date"],
                "season": row.get("season") or None,
                "picks": int(row["total_picks"]),
                "hits": int(row["hits"]),
                "misses": int(row["misses"]),
                "voided": int(row["voided"]),
                "units": r(row["units"], 3),
                "clvAvgLine": r(row["clv_avg_line"], 3) if row.get("clv_avg_line") else None,
                "clvBeat": r(row["clv_beat"], 3) if row.get("clv_beat") else None,
            })

    def totals(rows):
        picks = sum(x["picks"] for x in rows)
        hits = sum(x["hits"] for x in rows)
        misses = sum(x["misses"] for x in rows)
        voided = sum(x["voided"] for x in rows)
        units = sum(x["units"] or 0 for x in rows)
        graded_days = sum(1 for x in rows if x["picks"] > 0)
        best = max(rows, key=lambda x: x["units"] or 0) if rows else None
        worst = min(rows, key=lambda x: x["units"] or 0) if rows else None
        return {
            "picks": picks, "hits": hits, "misses": misses, "voided": voided,
            "units": r(units, 2), "hitRate": r(hits / picks, 4) if picks else None,
            "gradedDays": graded_days,
            "bestDay": best and {"date": best["date"], "units": best["units"]},
            "worstDay": worst and {"date": worst["date"], "units": worst["units"]},
            "first": rows[0]["date"] if rows else None, "last": rows[-1]["date"] if rows else None,
        }

    seasons = sorted({x["season"] for x in daily if x["season"]})
    by_season = {s: totals([x for x in daily if x["season"] == s]) for s in seasons}
    current = seasons[-1] if seasons else None

    # cumulative units per season
    cum = {}
    for s in seasons:
        running, series = 0.0, []
        for x in daily:
            if x["season"] != s:
                continue
            running += x["units"] or 0
            series.append({"date": x["date"], "units": x["units"], "cum": r(running, 2), "picks": x["picks"], "hits": x["hits"]})
        cum[s] = series

    # graded picks: by stat / grade / side / price band
    by_stat, by_grade, by_side = defaultdict(lambda: [0, 0, 0.0]), defaultdict(lambda: [0, 0, 0.0]), defaultdict(lambda: [0, 0, 0.0])
    graded_rows = 0
    with open(data / "graded_picks.csv", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            res = row.get("result")
            if res not in ("hit", "miss"):
                continue
            graded_rows += 1
            u = float(row["units"] or 0)
            for key, bucket in ((row["stat"], by_stat), (row["grade"], by_grade), (row["edge"], by_side)):
                bucket[key][0] += 1
                bucket[key][1] += res == "hit"
                bucket[key][2] += u

    def table(b, order=None):
        keys = order or sorted(b, key=lambda k: -b[k][0])
        return [{"key": k, "n": b[k][0], "hits": b[k][1], "hitRate": r(b[k][1] / b[k][0], 3), "units": r(b[k][2], 2)}
                for k in keys if k in b]

    grade_order = ["A+", "A", "B+", "B", "C", "D", "F"]

    # last graded board
    graded_files = sorted((repo / "logs").glob("graded_*.json"))
    last_board = None
    if graded_files:
        g = json.loads(graded_files[-1].read_text())
        last_board = {
            "date": g["date"], "picks": g["total_picks"], "hits": g["hits"], "misses": g["misses"],
            "voided": g.get("voided", 0), "units": r(g.get("units"), 2), "clv": g.get("clv"),
            "rows": [{
                "player": p["player_name"], "team": p["team"], "opp": p["opponent"], "pos": p.get("position"),
                "stat": p["stat"], "side": p["edge"], "line": p.get("line"), "price": p.get("over_odds") if p["edge"] == "over" else p.get("under_odds"),
                "book": p.get("line_book"), "actual": p.get("actual_value"), "result": p.get("result"),
                "grade": p.get("grade"), "units": r(p.get("units"), 2), "pHit": r(p.get("p_hit"), 3),
                "projMu": r(p.get("proj_mu"), 1), "closingLine": p.get("closing_line"), "clvLine": p.get("clv_line"),
                "hitrate": r(p.get("hitrate"), 3), "seasonAvg": p.get("season_avg"),
            } for p in g.get("graded_picks", [])],
        }

    learner = json.loads((repo / "logs" / "learner.json").read_text())
    latest = json.loads((data / "latest.json").read_text())
    pm_files = sorted((repo / "logs").glob("postmortem_*.json"))
    postmortem = None
    if pm_files:
        pm = json.loads(pm_files[-1].read_text())
        postmortem = {
            "date": pm["date"], "allProps": pm.get("all_props"), "scope": pm.get("scope"),
            "wentRight": pm.get("went_right", [])[:3], "wentWrong": pm.get("went_wrong", [])[:3],
            "biggestMisses": pm.get("biggest_misses", [])[:5],
        }

    dump("nba.json", {
        "snapshotAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "web/public/data/*.csv|json and logs/*.json in SidSub1041/NBA-Player-Prop-Model",
        "liveData": {
            "resultsHistory": "https://raw.githubusercontent.com/SidSub1041/NBA-Player-Prop-Model/main/web/public/data/results_history.json",
            "latest": "https://raw.githubusercontent.com/SidSub1041/NBA-Player-Prop-Model/main/web/public/data/latest.json",
        },
        "currentSeason": current,
        "seasons": by_season,
        "allTime": totals(daily),
        "daily": daily,
        "cumulative": cum,
        "gradedRows": graded_rows,
        "byStat": table(by_stat),
        "byGrade": table(by_grade, grade_order),
        "bySide": table(by_side, ["over", "under"]),
        "lastBoard": last_board,
        "learner": {
            "features": learner.get("features", []), "nRows": learner.get("n_rows"), "nDays": learner.get("n_days"),
            "mode": learner.get("mode"), "trusted": learner.get("trusted"), "trainedAt": learner.get("trained_at"),
            "passStreak": learner.get("pass_streak"), "failStreak": learner.get("fail_streak"),
        },
        "latest": {
            "date": latest.get("date"), "runAtIso": latest.get("run_at_iso"), "modelVersion": latest.get("model_version"),
            "thresholds": latest.get("thresholds"), "caps": latest.get("caps", {}).get("limits"),
            "validCount": latest.get("valid_count"), "candidates": latest.get("candidates_analyzed"),
        },
        "postmortem": postmortem,
    })


# --------------------------------------------------------------------------- Kalshi
def extract_kalshi(root: Path) -> None:
    repo = root / "kalshi-mlb-market-analysis"
    if not repo.exists():
        return warn("kalshi-mlb-market-analysis not found")
    data = repo / "data"

    summary = []
    with open(data / "event_summary.csv") as fh:
        for row in csv.DictReader(fh):
            if row["segment"] != "all" or row["group"] == "error":
                continue
            summary.append({
                "group": row["group"], "n": int(row["n"]), "imm": r(row["imm_mean"], 2), "immMed": r(row["imm_med"], 2),
                "drift": r(row["drift_mean"], 2), "volRatio": r(row["vol_ratio"], 2), "spread": r(row["spread_c"], 2),
                "totImm": r(row["tot_imm"], 2), "immP": r(row["imm_p"], 3) if row["imm_p"] else None,
            })

    events = []
    with open(data / "event_study.csv") as fh:
        for row in csv.DictReader(fh):
            events.append({
                "game": row["game"], "t": float(row["t"]), "inning": int(row["inning"]), "half": row["half"],
                "group": row["group"], "event": row["event"], "scoring": row["scoring"] == "True",
                "pre": float(row["pre"]), "imm": float(row["imm_c"]), "drift": float(row["drift_c"]),
                "totImm": float(row["tot_imm_c"]) if row["tot_imm_c"] else None,
                "totDrift": float(row["tot_drift_c"]) if row["tot_drift_c"] else None,
                "vol": float(row["vol_3min"]), "volRatio": float(row["vol_ratio"]) if row["vol_ratio"] else None,
                "spread": float(row["spread_c"]) if row["spread_c"] else None,
            })

    scoring = [e for e in events if e["scoring"]]
    summary.append({
        "group": "scoring_play", "n": len(scoring), "imm": r(statistics.mean(e["imm"] for e in scoring), 2),
        "immMed": r(statistics.median(e["imm"] for e in scoring), 2),
        "drift": r(statistics.mean(e["drift"] for e in scoring), 2),
        "volRatio": r(statistics.mean(e["volRatio"] for e in scoring if e["volRatio"] is not None), 2),
        "spread": r(statistics.mean(e["spread"] for e in scoring if e["spread"] is not None), 2),
        "totImm": r(statistics.mean(e["totImm"] for e in scoring if e["totImm"] is not None), 2), "immP": None,
    })

    big = [e for e in events if abs(e["imm"]) >= 3]
    rho, p = pearson([e["imm"] for e in big], [e["drift"] for e in big])
    ride = statistics.mean(math.copysign(1, e["imm"]) * e["drift"] for e in big)
    momentum = {
        "n": len(big), "rho": r(rho, 3), "p": r(p, 3), "rideCents": r(ride, 2), "fadeCents": r(-ride, 2),
        "points": [{"imm": r(e["imm"], 1), "drift": r(e["drift"], 1), "scoring": e["scoring"]} for e in big],
    }
    pos = [e["drift"] for e in big if e["imm"] > 0]
    neg = [e["drift"] for e in big if e["imm"] < 0]
    asymmetry = {"afterUp": r(statistics.mean(pos), 2), "nUp": len(pos), "afterDown": r(statistics.mean(neg), 2), "nDown": len(neg)}

    def bucket(i):
        return "1-3" if i <= 3 else "4-6" if i <= 6 else "7+"
    by_inn = defaultdict(list)
    for e in events:
        by_inn[bucket(e["inning"])].append(abs(e["imm"]))
    by_inning = [{"bucket": b, "n": len(v), "meanAbsImm": r(statistics.mean(v), 2)} for b, v in (("1-3", by_inn["1-3"]), ("4-6", by_inn["4-6"]), ("7+", by_inn["7+"]))]

    liquidity = {
        "medianSpread": r(statistics.median(e["spread"] for e in events if e["spread"] is not None), 2),
        "medianVol3min": r(statistics.median(e["vol"] for e in events), 0),
        "medianVolRatio": r(statistics.median(e["volRatio"] for e in events if e["volRatio"] is not None), 2),
    }

    # average reaction path by minute (baseline = candle closing two minutes before play end, as in the report figure)
    def load_candles(path):
        rows = {}
        with open(path) as fh:
            for row in csv.DictReader(fh):
                rows[int(row["ts"])] = row
        ts = sorted(rows)
        grid, last = {}, None
        for t in range(ts[0], ts[-1] + 60, 60):
            if t in rows:
                last = rows[t]
            grid[t] = last
        return grid, ts[0]

    def price_at(grid, t):
        keys = [k for k in grid if k <= t]
        return float(grid[max(keys)]["price_close"]) if keys and grid[max(keys)] else None

    ml_side = {"DETNYY": "away", "PITPHI": "home", "TBKC": "away", "MINHOU": "home", "SDCHC": "home", "LAASEA": "home"}
    games = list(csv.DictReader(open(data / "games.csv")))
    path_groups = {"home_run": [], "scoring_play": [], "single": [], "walk_hbp": [], "strikeout": [], "out_in_play": []}
    minutes = list(range(-3, 9))
    candles = {}
    for g in games:
        code = g["game_code"]
        candles[code] = load_candles(data / f"candles_{code}_ML.csv")
    for e in events:
        grid, _ = candles[e["game"]]
        t0 = math.ceil(e["t"] / 60) * 60
        base = price_at(grid, t0 - 120)
        if base is None:
            continue
        batting = "away" if e["half"] == "top" else "home"
        sign = 1.0 if batting == ml_side[e["game"]] else -1.0
        path = []
        for m in minutes:
            pr = price_at(grid, t0 + m * 60)
            path.append(None if pr is None else sign * (pr - base) * 100)
        if any(x is None for x in path):
            continue
        for key in ([e["group"]] if e["group"] in path_groups else []) + (["scoring_play"] if e["scoring"] else []):
            path_groups[key].append(path)
    reaction_path = {
        "minutes": minutes,
        "series": {k: {"n": len(v), "mean": [r(statistics.mean(col), 2) for col in zip(*v)]} for k, v in path_groups.items() if v},
    }

    # one real game: MIN @ HOU moneyline (HOU side), with scoring plays marked
    grid, start = candles["MINHOU"]
    series = [{"m": (t - start) // 60, "p": r(float(row["price_close"]) * 100, 1)} for t, row in sorted(grid.items()) if row]
    plays = list(csv.DictReader(open(data / "plays_MINHOU.csv")))
    marks = []
    for pl in plays:
        if pl["is_scoring"].lower() != "true":
            continue
        t = datetime.fromisoformat(pl["end_time"].replace("Z", "+00:00")).timestamp()
        marks.append({"m": r((t - start) / 60, 1), "inning": int(pl["inning"]), "half": pl["half"], "event": pl["event"], "rbi": int(pl["rbi"] or 0),
                      "score": f'{pl["away_score"]}-{pl["home_score"]}'})
    game_path = {"code": "MINHOU", "label": "MIN @ HOU, Jun 30 2026", "side": "HOU", "ticker": next(g["ml_ticker"] for g in games if g["game_code"] == "MINHOU"),
                 "series": series, "scoringPlays": marks}

    game_rows = []
    for g in games:
        side_team = g["ml_ticker"].rsplit("-", 1)[-1]
        winner = side_team if g["ml_result"] == "yes" else (g["home"] if side_team == g["away"] else g["away"])
        game_rows.append({"code": g["game_code"], "away": g["away"], "home": g["home"], "mlSide": side_team, "mlResult": g["ml_result"],
                          "winner": winner, "totalLine": g["tot_ticker"].rsplit("-", 1)[-1], "totResult": g["tot_result"],
                          "start": g["game_start_utc"], "close": g["market_close_utc"]})

    dump("kalshi.json", {
        "snapshotAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "data/*.csv and REPORT.md in SidSub1041/kalshi-mlb-market-analysis",
        "pilot": {"date": "2026-06-30", "games": len(games), "events": len(events), "scoringEvents": len(scoring)},
        "summary": summary, "momentum": momentum, "asymmetry": asymmetry, "byInning": by_inning, "liquidity": liquidity,
        "reactionPath": reaction_path, "gamePath": game_path, "games": game_rows,
    })


# ----------------------------------------------------------------------------- NFL
def extract_nfl(root: Path) -> None:
    repo = root / "model-game-totals"
    if not repo.exists():
        return warn("model-game-totals not found")
    data = repo / "public" / "data"
    analysis = json.loads((data / "nfl_analysis.json").read_text())
    enhanced = json.loads((data / "enhanced_analysis.json").read_text())
    injuries = json.loads((data / "injury_report.json").read_text())
    vegas = json.loads((data / "vegas_lines.json").read_text())
    teams = {}
    for g in analysis["games"]:
        for abbr, name in ((g["homeAbbr"], g["homeTeam"]), (g["awayAbbr"], g["awayTeam"])):
            st = enhanced["team_stats"].get(abbr) or enhanced["team_stats"].get({"LAR": "LA"}.get(abbr, abbr), {})
            teams[abbr] = {"name": name, "offEpaPlay": r(st.get("off_epa_per_play"), 4), "defEpaPlay": r(st.get("def_epa_per_play"), 4),
                           "offPassEpa": r(st.get("off_pass_epa"), 1), "offRushEpa": r(st.get("off_rush_epa"), 1),
                           "defPassEpa": r(st.get("def_pass_epa"), 1), "defRushEpa": r(st.get("def_rush_epa"), 1),
                           "playsOff": st.get("plays_off"), "playsDef": st.get("plays_def")}
    league = [{"team": k, "offEpaPlay": r(v.get("off_epa_per_play"), 4), "defEpaPlay": r(v.get("def_epa_per_play"), 4)} for k, v in enhanced["team_stats"].items()]
    scripts = sorted(p.name for p in (repo / "scripts").glob("*.py"))
    dump("nfl.json", {
        "snapshotAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "public/data/*.json in SidSub1041/model-game-totals",
        "generatedAt": analysis["generatedAt"], "playoffWeekend": analysis.get("playoffWeekend"), "season": analysis.get("season"),
        "trainingSeasons": analysis.get("trainingSeasons"), "modelMetrics": analysis["modelMetrics"], "summaryStats": analysis["summaryStats"],
        "games": analysis["games"], "teams": teams, "league": league, "seasonWeights": enhanced.get("season_weights"),
        "injuries": {"generatedAt": injuries.get("generated_at"), "source": injuries.get("source"),
                     "highImpact": injuries.get("advisory", {}).get("high_impact", []),
                     "mediumImpact": injuries.get("advisory", {}).get("medium_impact", []),
                     "teams": {k: v.get("key_injuries", []) for k, v in injuries.get("playoff_teams", {}).items()}},
        "vegas": {"generatedAt": vegas.get("generatedAt"), "source": vegas.get("source"), "gamesCount": vegas.get("gamesCount")},
        "scripts": scripts,
    })


# --------------------------------------------------------------------------- Draft
def extract_draft(root: Path) -> None:
    repo = root / "ff-draft-bot"
    if not repo.exists():
        return warn("ff-draft-bot not found")
    src = (repo / "server" / "ffbot" / "adp.py").read_text()
    tree = ast.parse(src)
    anchors = {}
    for node in tree.body:
        targets = []
        if isinstance(node, ast.Assign):
            targets = [t.id for t in node.targets if isinstance(t, ast.Name)]
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            targets = [node.target.id]
        if any(t in ("DEFAULT_ANCHORS", "SUPERFLEX_QB_ANCHORS") for t in targets):
            anchors[targets[0]] = ast.literal_eval(node.value)
    guide = json.loads((repo / "server" / "data" / "guide_2026.json").read_text())
    rookies = json.loads((repo / "server" / "data" / "rookies_2026.json").read_text())
    mcp_src = (repo / "server" / "ffbot" / "mcp_server.py").read_text()
    tools = len(re.findall(r"@server\.tool\(", mcp_src))
    tests = sum(len(re.findall(r"^\s*def test_", p.read_text(), re.M)) for p in (repo / "server" / "tests").glob("test_*.py"))
    modules = sorted(p.stem for p in (repo / "server" / "ffbot").glob("*.py") if p.stem != "__init__")
    strategy = (repo / "server" / "ffbot" / "strategy.py").read_text()
    presets = re.findall(r'"([a-z_]+)":\s*\{', strategy)
    dump("draft.json", {
        "snapshotAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "server/ffbot/*.py and server/data/*.json in SidSub1041/ff-draft-bot",
        "anchors": anchors["DEFAULT_ANCHORS"], "superflexQb": anchors["SUPERFLEX_QB_ANCHORS"],
        "guide": {"title": guide.get("title"), "lastUpdate": guide.get("last_update"),
                  "bigBoard": {k: len(v) for k, v in guide["big_board"].items()},
                  "positional": {fmt: {pos: len(lst) for pos, lst in d.items()} for fmt, d in guide["positional"].items()},
                  "adjPpg": {k: len(v) for k, v in guide["adj_ppg_2025"].items()},
                  "dynastyRookies": len(guide["dynasty_rookies"]), "top50Stats": len(guide["top_50_stats"]),
                  "strategyKeys": list(guide["strategy"].keys())},
        "rookies": len(rookies) if isinstance(rookies, list) else len(rookies.get("players", rookies)),
        "mcpTools": tools, "tests": tests, "modules": modules, "presets": presets,
    })


# -------------------------------------------------------------------------- Sleeper
def extract_sleeper(root: Path) -> None:
    repo = root / "Fantasy-Football-Draft-Assistant"
    if not repo.exists():
        return warn("Fantasy-Football-Draft-Assistant not found")
    base = repo / "src" / "main" / "java" / "com" / "sdcalmes" / "sleeper"
    groups = {}
    for p in sorted(base.rglob("*.java")):
        rel = p.relative_to(base)
        group = rel.parts[0] if len(rel.parts) > 1 else "(root)"
        groups.setdefault(group, []).append(str(rel.with_suffix("")).replace("/", "."))
    tests = sorted(p.stem for p in (repo / "src" / "test" / "java").rglob("*Test.java"))
    loc = sum(len(p.read_text(errors="ignore").splitlines()) for p in base.rglob("*.java"))
    dump("sleeper.json", {
        "snapshotAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "src/ in SidSub1041/Fantasy-Football-Draft-Assistant (fork of sdcalmes/sleeper-api)",
        "groups": groups, "tests": tests, "javaLines": loc, "files": sum(len(v) for v in groups.values()),
    })


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(HERE.parent.parent.parent), help="directory containing the project checkouts")
    args = ap.parse_args()
    root = Path(args.root).resolve()
    print(f"reading project checkouts under {root}")
    for fn in (extract_nba, extract_kalshi, extract_nfl, extract_draft, extract_sleeper):
        try:
            fn(root)
        except Exception as exc:  # keep going; a missing file in one repo should not block the rest
            warn(f"{fn.__name__} failed: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()
