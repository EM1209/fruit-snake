"""
report.py -- Reproduce the entire analysis: tables, simulation, budgets, picks.

Run:
    python3 src/report.py            # full report + 1,000,000-draw simulation
    python3 src/report.py --sims 2000000
    python3 src/report.py --no-sim   # skip the Monte Carlo (fast)

Everything printed here is derived from src/games.py (official OLG/ILC data)
and the transparent formulas in src/analysis.py. The simulation DOES NOT and
CANNOT predict any future draw; it only illustrates the shape of randomness
and confirms the analytic numbers.
"""

from __future__ import annotations

import argparse

import numpy as np

import games as G
import budgets as B
from simulate import simulate_by_tier, simulate_pick4_digits

SEED = 20260726  # fixed for reproducibility (today's date); NOT a lucky number


def money(x: float) -> str:
    return f"CA${x:,.2f}"


def hr(title: str = "") -> None:
    print("\n" + "=" * 78)
    if title:
        print(title)
        print("=" * 78)


# ---------------------------------------------------------------------------
def table_game_comparison() -> None:
    hr("1-2. VERIFIED GAMES: price, odds, and expected value per CA$1")
    cols = (f"{'Game':30s}{'Price':>9s}{'P(any win)':>13s}"
            f"{'P(>=100)':>16s}{'P(>=1000)':>18s}{'Top prize':>18s}"
            f"{'Top odds':>18s}{'RTP/$1':>9s}")
    print(cols)
    print("-" * len(cols))
    for g in G.ALL_GAMES:
        print(f"{g.name:30s}{money(g.price):>9s}"
              f"{g.odds_string(g.p_any()):>13s}"
              f"{g.odds_string(g.p_at_least(100)):>16s}"
              f"{g.odds_string(g.p_at_least(1000)):>18s}"
              f"{money(g.top_prize()):>18s}"
              f"{g.odds_string(g.p_top()):>18s}"
              f"{g.display_rtp():>8.1%}")
    print("\nRTP basis: Pick 3/4 & Daily Grand are computed exactly (all prizes "
          "fixed).\nPick 2 (~58.5%), 6/49 & Lotto Max (~48%) use OLG's published "
          "prize-fund\nallocation because pari-mutuel/variable-jackpot tiers "
          "have no fixed EV.")


def table_pick4_boxes() -> None:
    hr("3-4. PICK 4: Straight vs Box types (why 4 unique digits = 24-Way)")
    print(f"{'Play type':22s}{'Digit pattern':16s}{'Ways':>6s}"
          f"{'Odds':>15s}{'Prize/$1':>11s}{'RTP':>8s}{'EV/play':>10s}")
    print("-" * 88)
    rows = [
        (G.PICK4_STRAIGHT, "exact order", 1),
        (G.PICK4_BOX_4WAY, "AAAB (trips)", 4),
        (G.PICK4_BOX_6WAY, "AABB (2 pair)", 6),
        (G.PICK4_BOX_12WAY, "AABC (1 pair)", 12),
        (G.PICK4_BOX_24WAY, "ABCD (unique)", 24),
    ]
    for g, pattern, ways in rows:
        t = g.tiers[0]
        print(f"{g.name.replace('Pick 4 - ',''):22s}{pattern:16s}{ways:>6d}"
              f"{g.odds_string(t.probability):>15s}"
              f"{money(t.prize):>11s}{g.ev_per_dollar():>7.1%}"
              f"{money(g.ev_per_play()):>10s}")
    print("\nWhy four unique digits -> 24-Way Box, odds ~1 in 417:")
    print("  A Pick 4 draw is an ORDERED 4-digit string; there are 10^4 = 10,000")
    print("  equally likely results (0000-9999). A Box bet wins if the draw is")
    print("  ANY arrangement of your four digits. The number of arrangements of")
    print("  4 distinct digits is 4! = 4x3x2x1 = 24. So 24 of the 10,000 ordered")
    print("  results win: P = 24/10,000 = 0.0024 = 1 in 416.7 ~ 1 in 417.")
    print("  Repeated digits collapse arrangements: 4!/2! = 12 (one pair),")
    print("  4!/(2!2!) = 6 (two pair), 4!/3! = 4 (trips). Fewer ways => rarer")
    print("  box => bigger box prize, but the RTP stays ~48-50% either way.")


def table_expected_loss() -> None:
    hr("2 (cont). Expected loss per CA$100 wagered (the price of playing)")
    print(f"{'Game':30s}{'RTP':>8s}{'House edge':>12s}{'Lost per CA$100':>18s}")
    print("-" * 68)
    for g in G.ALL_GAMES:
        edge = 1 - g.display_rtp()
        print(f"{g.name:30s}{g.display_rtp():>7.1%}{edge:>11.1%}"
              f"{money(100 * edge):>18s}")


# ---------------------------------------------------------------------------
def run_simulation(n: int) -> None:
    hr(f"5. SIMULATION: {n:,} independent draws per game "
       f"(seed={SEED}; illustration only)")
    print("This CANNOT predict any draw. It only shows what randomness produces:")
    print("realized win rate, longest losing streak, and net position vs stake.\n")
    rng = np.random.default_rng(SEED)

    print(f"{'Game':30s}{'Wins':>9s}{'Win rate':>12s}{'RTP(sim)':>10s}"
          f"{'Longest loss streak':>21s}{'Net /stake':>16s}")
    print("-" * 98)
    sim_games = [G.PICK4_BOX_24WAY, G.PICK4_STRAIGHT, G.PICK3_BOX_6WAY,
                 G.DAILY_GRAND, G.LOTTO_649, G.LOTTO_MAX]
    jackpot_flip = None
    for g in sim_games:
        r = simulate_by_tier(g, n, rng)
        print(f"{g.name:30s}{r.n_wins:>9,d}"
              f"{r.empirical_p_any:>11.4%}{r.empirical_rtp:>10.1%}"
              f"{r.longest_losing_streak:>21,d}"
              f"{money(r.net):>16s}")
        if r.net > 0:
            jackpot_flip = (g, r)
    print("\nInterpretation:")
    print(" * Streaks of hundreds-to-thousands of losing plays are NORMAL, not bad")
    print("   luck and not a 'due' number. The next draw's odds never change.")
    print(" * REALIZED RTP < theoretical for top-heavy games (e.g. Daily Grand")
    print("   ~21% realized vs 46% theoretical) because the jackpots that prop up")
    print("   the theoretical figure essentially never land -- what you actually")
    print("   experience is worse than the headline expected value.")
    if jackpot_flip:
        g, r = jackpot_flip
        print(f" * {g.name} shows a one-off NET GAIN ({money(r.net)}) here only")
        print(f"   because its {money(r.biggest_single_win)} top prize happened to")
        print("   hit once in this seed. That is variance, NOT an edge -- change the")
        print("   seed and the run is a deep loss. A 'winning' sim proves nothing.")

    # Authentic Pick 4 digit draw -- proves the box odds from first principles.
    hr("5 (cont). Pick 4 box odds proven by drawing real digits")
    for chosen, label in [((1, 2, 3, 4), "four unique -> 24-Way"),
                          ((1, 1, 2, 3), "one pair -> 12-Way")]:
        d = simulate_pick4_digits(chosen, n, rng,
                                  straight_prize=5000.0, box_prize=200.0)
        print(f"  chosen {chosen} ({label}):")
        print(f"    box hits {d['box_hits']:,} / {n:,}  -> empirical 1 in "
              f"{d['empirical_box_odds']:,.0f}  (theory 1 in "
              f"{d['theoretical_box_odds']:,.0f})")
        print(f"    straight hits {d['straight_hits']:,}  -> empirical 1 in "
              f"{d['empirical_straight_odds']:,.0f}  (theory 1 in 10,000)")


# ---------------------------------------------------------------------------
def table_budgets() -> None:
    hr("6-7. FIXED-BUDGET WEEKLY PLANS ($10 / $20 / $40)")
    for wk in (10, 20, 40):
        print(f"\n---------- CA${wk}/week ----------")
        print(f"{'Plan':16s}{'Plays':>7s}{'Weekly':>10s}{'Monthly':>10s}"
              f"{'Annual':>11s}{'P(win/wk)':>11s}{'P(win/yr)':>11s}"
              f"{'RTP':>7s}{'Annual E[loss]':>16s}{'~Max losestreak(wk)':>21s}")
        print("-" * 120)
        for arch in ("Frequent", "Balanced", "Jackpot"):
            p = B.PLANS[wk][arch]
            print(f"{arch:16s}{p.total_plays_per_week():>7d}"
                  f"{money(p.weekly_cost()):>10s}{money(p.monthly_cost()):>10s}"
                  f"{money(p.annual_cost()):>11s}"
                  f"{p.p_any_win_week():>10.1%}{p.p_any_win_year():>11.2%}"
                  f"{p.rtp():>6.0%}{money(p.annual_expected_loss()):>16s}"
                  f"{p.expected_max_losing_streak_weeks():>20.1f}")
        # detail: composition of each plan
    print("\nPlan compositions:")
    for wk in (10, 20, 40):
        for arch in ("Frequent", "Balanced", "Jackpot"):
            p = B.PLANS[wk][arch]
            comp = ", ".join(f"{l.plays_per_week}x {l.game.name}" for l in p.lines)
            print(f"  ${wk} {arch:9s}: {comp}")
    print("\nTrade-off: 'Frequent' wins most weeks but the wins are small and it")
    print("still bleeds ~50% of stake; 'Jackpot' almost never wins but buys the")
    print("only realistic shot at a life-changing prize. Neither has positive EV.")


def table_at_least_over_year() -> None:
    hr("7 (cont). Chance a $20/week plan pays >= a target at least once in a YEAR")
    print(f"{'Plan':16s}{'>= CA$100/yr':>14s}{'>= CA$1,000/yr':>16s}"
          f"{'>= CA$5,000/yr':>16s}")
    print("-" * 62)
    for arch in ("Frequent", "Balanced", "Jackpot"):
        p = B.PLANS[20][arch]
        print(f"{arch:16s}"
              f"{p.p_at_least_year(100):>13.2%}"
              f"{p.p_at_least_year(1000):>16.3%}"
              f"{p.p_at_least_year(5000):>16.4%}")


# ---------------------------------------------------------------------------
def recommendations(weekly_budget: float = 20.0) -> None:
    hr(f"8. MATHEMATICALLY BEST OPTION PER GOAL "
       f"(entire CA${weekly_budget:.0f}/week on one game)")

    # (a) win more frequently
    print("\n(a) Win MORE FREQUENTLY (any prize) -- rank by P(>=1 win in a week):")
    for g, plays, p in B.best_game_for_any_win(weekly_budget)[:4]:
        print(f"    {g.name:30s} {plays:>2d} plays/wk -> {p:6.1%} per week")
    print("    => Best odds of *some* win: the $3 draws (Daily Grand / 6-49) and")
    print("       Lotto Max, but most 'wins' are small or a free play.")

    # (b) >= $200
    print("\n(b) Target at least CA$200 -- rank by P(>=1 win >= $200 in a week):")
    for g, plays, p in B.best_game_for(200, weekly_budget)[:4]:
        print(f"    {g.name:30s} {plays:>2d} plays/wk -> {p:7.2%} per week")
    print("    => Pick 4 Boxes dominate: a $200+ hit at ~1 in 417 (24-Way) beats")
    print("       every big-draw game's odds of reaching $200.")

    # (c) >= $5,000
    print("\n(c) Target at least CA$5,000 -- rank by P(>=1 win >= $5,000 in a week):")
    for g, plays, p in B.best_game_for(5000, weekly_budget)[:4]:
        print(f"    {g.name:30s} {plays:>2d} plays/wk -> {p:8.4%} per week")
    print("    => Pick 4 STRAIGHT: pays exactly $5,000 at 1 in 10,000 per $1 --")
    print("       far better odds for a five-figure hit than any jackpot game.")

    # (d) life-changing >= $1,000,000
    print("\n(d) Life-changing prize (>= CA$1,000,000) -- best ODDS per dollar:")
    ranked = B.best_game_for(1_000_000, weekly_budget)
    for g, plays, p in ranked[:4]:
        per_dollar = g.p_at_least(1_000_000) / g.price
        print(f"    {g.name:30s} 1 in {1/per_dollar:>14,.0f} per CA$1"
              f"  ({plays} plays -> {p:.2e}/wk)")
    print("    => Daily Grand and Lotto 6/49 give the BEST odds of a 7-figure")
    print("       prize per dollar; Lotto Max has the BIGGEST top prize ($90M cap)")
    print("       but the longest odds. All are astronomically unlikely.")


def flags() -> None:
    hr("10. STRATEGIES THAT COST MORE WITHOUT IMPROVING EXPECTED RETURN")
    print("Every OLG draw game returns ~46-58 cents per dollar REGARDLESS of how")
    print("you bet. Spending more never improves RTP. Specifically flagged:")
    print("  * Buying MORE tickets: linearly more expected LOSS, same ~50% edge.")
    print("  * 'System'/wheeling, box+straight combos, playing more draws: raise")
    print("    spend, leave RTP unchanged (Pick 4 boxes are all ~48%).")
    print("  * Chasing a 'due'/hot/cold number, birthdays, patterns, AI/ML tips:")
    print("    draws are independent and memoryless -- zero effect on odds, but")
    print("    they often nudge people to spend more. No positive-EV lottery bet")
    print("    exists here; the only spend-independent lever is spending LESS.")
    print("  * Lotto Max at $6 (was $5): 20% more spend per play for the same")
    print("    ~48% RTP and marginally longer jackpot odds (1 in 33.45M).")


def random_entertainment_picks() -> None:
    hr("9. RANDOM SELECTIONS -- ENTERTAINMENT ONLY (NOT more likely to win)")
    print("Generated with a fixed seed for reproducibility. Every combination")
    print("has exactly the same probability as any other. These are NOT tips.\n")
    rng = np.random.default_rng(SEED + 1)
    print("  Pick 3 :", "".join(map(str, rng.integers(0, 10, 3))))
    print("  Pick 4 :", "".join(map(str, rng.integers(0, 10, 4))))
    print("  Daily Grand: 5 of 1-49:",
          sorted(rng.choice(range(1, 50), 5, replace=False).tolist()),
          "| Grand No:", int(rng.integers(1, 8)))
    print("  Lotto 6/49 : 6 of 1-49:",
          sorted(rng.choice(range(1, 50), 6, replace=False).tolist()))
    for i in range(4):
        sel = sorted(rng.choice(range(1, 53), 7, replace=False).tolist())
        print(f"  Lotto Max selection {i+1} (7 of 1-52):", sel)


# ---------------------------------------------------------------------------
def main() -> None:
    ap = argparse.ArgumentParser(description="OLG lottery math & budget report")
    ap.add_argument("--sims", type=int, default=1_000_000,
                    help="draws per game in the Monte Carlo (default 1,000,000)")
    ap.add_argument("--no-sim", action="store_true", help="skip the simulation")
    args = ap.parse_args()

    G.validate_all()
    print("OLG lottery mathematics & responsible-budget report")
    print("Data: official OLG / ILC (see README & DATA_SOURCES.md). CA$ throughout.")
    print("Reminder: draws are independent and random. NOTHING here predicts a draw.")

    table_game_comparison()
    table_expected_loss()
    table_pick4_boxes()
    if not args.no_sim:
        run_simulation(args.sims)
    table_budgets()
    table_at_least_over_year()
    recommendations(20.0)
    random_entertainment_picks()
    flags()

    hr("FINAL")
    print("No OLG game has positive expected value. The house edge is ~50% and is")
    print("unchanged by any selection method. If you choose to play: treat it as")
    print("paid entertainment, pick a FIXED budget you can lose, prefer the game")
    print("that matches your goal (frequency -> Daily Grand; $ target -> Pick 4;")
    print("dream -> Daily Grand/6-49 odds or Lotto Max size), and never chase")
    print("losses. Help: ConnexOntario 1-866-531-2600 / PlaySmart.ca.")


if __name__ == "__main__":
    main()
