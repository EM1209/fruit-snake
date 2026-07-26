"""
budgets.py -- Fixed-budget weekly plans and goal-based recommendations.

Three disciplined weekly budgets (CA$10 / CA$20 / CA$40), each expressed as
three archetype baskets so the frequent-small-wins vs rare-big-prize trade-off
is explicit:

  * "Frequent"  -- steer spend to the best any-prize odds (cheap $3 draws).
  * "Balanced"  -- a spread across daily digit games and the big draws.
  * "Jackpot"   -- steer spend to the seven-figure games.

Every plan reports weekly / monthly / annual spend, chance of >=1 win,
expected value, expected loss, and an approximate maximum losing streak.

The recommendation helpers answer "which single game, if the whole weekly
budget went to it, maximises the chance of >= CA$X?" -- a clean, purely
odds-driven ranking. None of this implies any outcome can be predicted.
"""

from __future__ import annotations

from analysis import BudgetPlan, PlanLine, Game
import games as G


def _plan(name: str, spec: list[tuple[Game, int]]) -> BudgetPlan:
    return BudgetPlan(name=name, lines=[PlanLine(g, n) for g, n in spec])


# ---------------------------------------------------------------------------
# The nine plans (3 budgets x 3 archetypes). Play counts chosen to spend the
# whole weekly budget (draw games priced $3/$6; digit games $1).
# ---------------------------------------------------------------------------
PLANS: dict[int, dict[str, BudgetPlan]] = {
    10: {
        "Frequent": _plan("$10 Frequent", [
            (G.DAILY_GRAND, 3), (G.PICK3_BOX_6WAY, 1),
        ]),
        "Balanced": _plan("$10 Balanced", [
            (G.DAILY_GRAND, 1), (G.LOTTO_649, 1),
            (G.PICK4_BOX_24WAY, 2), (G.PICK3_BOX_6WAY, 2),
        ]),
        "Jackpot": _plan("$10 Jackpot", [
            (G.LOTTO_MAX, 1), (G.LOTTO_649, 1), (G.PICK4_STRAIGHT, 1),
        ]),
    },
    20: {
        "Frequent": _plan("$20 Frequent", [
            (G.DAILY_GRAND, 6), (G.PICK3_BOX_6WAY, 2),
        ]),
        "Balanced": _plan("$20 Balanced", [
            (G.DAILY_GRAND, 2), (G.LOTTO_649, 2),
            (G.PICK4_BOX_24WAY, 4), (G.PICK3_BOX_6WAY, 4),
        ]),
        "Jackpot": _plan("$20 Jackpot", [
            (G.LOTTO_MAX, 2), (G.LOTTO_649, 2), (G.PICK4_STRAIGHT, 2),
        ]),
    },
    40: {
        "Frequent": _plan("$40 Frequent", [
            (G.DAILY_GRAND, 13), (G.PICK3_BOX_6WAY, 1),
        ]),
        "Balanced": _plan("$40 Balanced", [
            (G.DAILY_GRAND, 4), (G.LOTTO_649, 4),
            (G.PICK4_BOX_24WAY, 8), (G.PICK3_BOX_6WAY, 8),
        ]),
        "Jackpot": _plan("$40 Jackpot", [
            (G.LOTTO_MAX, 4), (G.LOTTO_649, 4), (G.PICK4_STRAIGHT, 4),
        ]),
    },
}


# ---------------------------------------------------------------------------
# Goal-based recommendation: for a weekly budget, which single game maximises
# P(at least one win >= threshold) if the entire budget is spent on it?
# ---------------------------------------------------------------------------

def best_game_for(threshold: float, weekly_budget: float,
                  candidates: list[Game] | None = None) -> list[tuple[Game, int, float]]:
    """
    Return candidates ranked by P(>=1 win of at least `threshold`) when the
    whole weekly budget is spent on that one game. Each entry:
    (game, plays_bought, probability). Games that never pay >= threshold are
    dropped.
    """
    if candidates is None:
        candidates = G.ALL_GAMES
    out = []
    for g in candidates:
        if g.p_at_least(threshold) <= 0:
            continue
        plays = int(weekly_budget // g.price)
        if plays <= 0:
            continue
        p = g.p_at_least_one_of(threshold, plays)
        out.append((g, plays, p))
    out.sort(key=lambda x: x[2], reverse=True)
    return out


def best_game_for_any_win(weekly_budget: float,
                          candidates: list[Game] | None = None
                          ) -> list[tuple[Game, int, float]]:
    """Rank games by P(>=1 win of ANY prize) for the whole weekly budget."""
    if candidates is None:
        candidates = G.ALL_GAMES
    out = []
    for g in candidates:
        plays = int(weekly_budget // g.price)
        if plays <= 0:
            continue
        p = g.p_at_least_one_win(plays)
        out.append((g, plays, p))
    out.sort(key=lambda x: x[2], reverse=True)
    return out


# Goal thresholds used in the report (item 8).
GOALS = {
    "Win more frequently (any prize)": None,   # handled by any-win ranker
    "Target at least CA$200": 200.0,
    "Target at least CA$5,000": 5_000.0,
    "Life-changing prize (>= CA$1,000,000)": 1_000_000.0,
}
