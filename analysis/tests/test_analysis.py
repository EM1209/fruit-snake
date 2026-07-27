"""
Tests for the lottery math engine and the official game data.

Run:  python3 -m pytest tests/ -q      (or)   python3 tests/test_analysis.py
These check the FORMULAS and the internal CONSISTENCY of the encoded official
figures -- not that anyone can win. Randomness is not on trial here; arithmetic
is.
"""
import os
import sys
from math import comb, isclose

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import numpy as np  # noqa: E402

import games as G  # noqa: E402
from analysis import Game, PrizeTier, BudgetPlan, PlanLine  # noqa: E402
from simulate import simulate_by_tier, simulate_pick4_digits, _count_ways  # noqa: E402


def test_all_specs_validate():
    G.validate_all()  # raises on bad probs/prizes


def test_pick4_box_ways_and_odds():
    # The heart of task item 4: distinct-digit permutation counts.
    assert _count_ways((1, 2, 3, 4)) == 24          # 4! all distinct
    assert _count_ways((1, 1, 2, 3)) == 12          # 4!/2!
    assert _count_ways((1, 1, 2, 2)) == 6           # 4!/(2!2!)
    assert _count_ways((1, 1, 1, 2)) == 4           # 4!/3!
    assert _count_ways((1, 1, 1, 1)) == 1           # 4!/4!
    # 24-Way Box odds are 24/10,000 ~ 1 in 417.
    assert isclose(G.PICK4_BOX_24WAY.p_any(), 24 / 10_000, rel_tol=1e-9)
    assert isclose(1 / G.PICK4_BOX_24WAY.p_any(), 416.666, rel_tol=1e-3)


def test_ev_formula_matches_hand_calc():
    # Pick 4 Straight: $5,000 at 1/10,000 -> EV $0.50 -> 50% RTP.
    assert isclose(G.PICK4_STRAIGHT.ev_per_play(), 0.5, rel_tol=1e-9)
    assert isclose(G.PICK4_STRAIGHT.ev_per_dollar(), 0.5, rel_tol=1e-9)
    # 24-Way Box: $200 at 24/10,000 -> EV $0.48.
    assert isclose(G.PICK4_BOX_24WAY.ev_per_play(), 0.48, rel_tol=1e-9)


def test_daily_grand_tiers_match_hypergeometric_and_sum_to_published():
    C = comb(49, 5)
    def pmain(k): return comb(5, k) * comb(44, 5 - k) / C
    # Overall any-prize odds must reproduce OLG's published 1 in 6.8.
    assert isclose(1 / G.DAILY_GRAND.p_any(), 6.8, abs_tol=0.05)
    # Free-play tier is GN AND zero main, i.e. 1 in ~12.3 (NOT 1 in 7).
    fp = [t for t in G.DAILY_GRAND.tiers if t.is_free_play][0]
    assert isclose(fp.probability, (1 / 7) * pmain(0), rel_tol=1e-9)
    assert 12.0 < 1 / fp.probability < 12.6


def test_free_play_ev_closed_form():
    # A one-tier game that only ever returns a free play must have EV = 0
    # (a replay of a game that returns only replays is worth nothing in cash).
    g = Game("x", "x", 1.0, (PrizeTier("free", 0.5, 0.0, is_free_play=True),))
    assert g.ev_per_play() == 0.0
    # cash tier + free play: EV = cash/(1-p_free).
    g2 = Game("y", "y", 1.0, (
        PrizeTier("cash", 0.1, 2.0),
        PrizeTier("free", 0.2, 0.0, is_free_play=True),
    ))
    assert isclose(g2.ev_per_play(), 0.2 / 0.8, rel_tol=1e-12)


def test_probability_helpers():
    g = G.PICK4_BOX_24WAY
    # independent-plays formula
    assert isclose(g.p_at_least_one_win(417),
                   1 - (1 - g.p_any()) ** 417, rel_tol=1e-12)
    # threshold filter
    assert g.p_at_least(200) == g.p_any()      # only prize is $200
    assert g.p_at_least(201) == 0.0
    assert g.p_at_least(100) == g.p_any()


def test_no_game_has_positive_ev():
    for g in G.ALL_GAMES:
        assert g.display_rtp() < 1.0, f"{g.key} claims positive EV"


def test_budget_plan_accounting():
    plan = BudgetPlan("t", [PlanLine(G.DAILY_GRAND, 3), PlanLine(G.PICK3_BOX_6WAY, 1)])
    assert isclose(plan.weekly_cost(), 3 * 3 + 1 * 1)
    assert isclose(plan.annual_cost(), plan.weekly_cost() * 52)
    assert isclose(plan.monthly_cost(), plan.weekly_cost() * 52 / 12)
    # RTP between 0 and 1, and expected loss positive.
    assert 0 < plan.rtp() < 1
    assert plan.annual_expected_loss() > 0
    # P(any win) over a year >= over a week.
    assert plan.p_any_win_year() >= plan.p_any_win_week()


def test_simulation_recovers_theory():
    rng = np.random.default_rng(12345)
    n = 500_000
    # 24-Way box empirical odds within 12% of 1 in 417.
    r = simulate_by_tier(G.PICK4_BOX_24WAY, n, rng)
    emp = n / r.n_wins
    assert 417 * 0.88 < emp < 417 * 1.12, emp
    # Authentic digit draw recovers the box odds too.
    d = simulate_pick4_digits((1, 2, 3, 4), n, rng, 5000.0, 200.0)
    assert 417 * 0.85 < d["empirical_box_odds"] < 417 * 1.15


def test_lotto_max_2026_structure():
    g = G.LOTTO_MAX
    assert g.price == 6.0                      # relaunched at $6
    # jackpot odds are per-play (4 selections / C(52,7)).
    assert isclose(g.p_top(), 4 / comb(52, 7), rel_tol=1e-6)
    assert isclose(1 / g.p_top(), 33_446_140, rel_tol=1e-4)


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"\nAll {len(fns)} tests passed.")
