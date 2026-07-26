"""
simulate.py -- Monte Carlo simulation of lottery play.

WHAT THIS DOES AND DOES NOT DO
------------------------------
This runs millions of INDEPENDENT random draws to *illustrate* the shape of
real outcomes: how often a play wins, how deep losing streaks get, how the
long-run return converges toward the mathematical expectation.

It does NOT predict any future draw. Each simulated draw is generated fresh
from a pseudo-random generator with no memory. "Hot", "cold", "overdue" and
"pattern" numbers have no effect here because they have no effect in reality:
past results carry zero information about the next result. The simulation only
confirms the analytic formulas in analysis.py and shows what randomness feels
like -- long droughts, occasional clusters, and a steady drain toward the
house edge.

Two independent engines are provided, and they agree:
  * simulate_by_tier(): samples each play's outcome directly from the game's
    prize-tier probabilities (works for every game, including jackpot lotteries
    that are impractical to draw ball-by-ball a million times).
  * simulate_pick4_digits(): draws four real digits 0-9 per play and applies
    the actual Straight / Box matching rules, proving the box odds (e.g. the
    24-Way Box really does hit ~24 times in 10,000) from first principles.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from analysis import Game


@dataclass
class SimResult:
    game_key: str
    n_plays: int
    n_wins: int
    total_staked: float
    total_returned: float
    longest_losing_streak: int
    biggest_single_win: float

    @property
    def empirical_p_any(self) -> float:
        return self.n_wins / self.n_plays

    @property
    def empirical_rtp(self) -> float:
        return self.total_returned / self.total_staked if self.total_staked else 0.0

    @property
    def net(self) -> float:
        return self.total_returned - self.total_staked


def _longest_run_of_zeros(is_win: np.ndarray) -> int:
    """Longest run of consecutive losing (non-winning) plays."""
    longest = cur = 0
    for w in is_win:
        if w:
            cur = 0
        else:
            cur += 1
            if cur > longest:
                longest = cur
    return longest


def simulate_by_tier(game: Game, n_plays: int, rng: np.random.Generator) -> SimResult:
    """
    Simulate `n_plays` plays by sampling each play's outcome from the game's
    tier probabilities. Category 0 = 'no win'; categories 1.. = the tiers.
    """
    probs = np.array([t.probability for t in game.tiers], dtype=float)
    # Value a free play at its cash-equivalent (the expected worth of the
    # replayed ticket) so realized RTP tracks the analytic figure.
    fp_value = game.ev_per_play()
    prizes = np.array(
        [fp_value if t.is_free_play else t.prize for t in game.tiers], dtype=float
    )
    # For pari-mutuel games we only enumerate the fixed tiers, but OLG's
    # published overall odds (p_any) imply more small/minor wins. Lump the
    # difference into a residual "minor prize" bucket so simulated WIN
    # FREQUENCY and losing STREAKS match the official overall odds. Its cash
    # value is set to the game's published RTP per play (an average small win),
    # so realized return stays in the right neighbourhood without pretending
    # the pari-mutuel split is known.
    residual = game.p_any() - probs.sum()
    if residual > 1e-12:
        probs = np.append(probs, residual)
        prizes = np.append(prizes, game.display_rtp() * game.price)
    p_none = 1.0 - probs.sum()
    # Full categorical distribution: index 0 is "no win", then each tier.
    full_p = np.concatenate(([p_none], probs))
    full_prize = np.concatenate(([0.0], prizes))

    draws = rng.choice(len(full_p), size=n_plays, p=full_p)
    returned = full_prize[draws]
    is_win = draws != 0

    return SimResult(
        game_key=game.key,
        n_plays=n_plays,
        n_wins=int(is_win.sum()),
        total_staked=game.price * n_plays,
        total_returned=float(returned.sum()),
        longest_losing_streak=_longest_run_of_zeros(is_win),
        biggest_single_win=float(returned.max()) if n_plays else 0.0,
    )


# ---------------------------------------------------------------------------
# Authentic Pick 4 digit draw -- proves the box odds from first principles
# ---------------------------------------------------------------------------

def _multiset_key(digits: np.ndarray) -> np.ndarray:
    """Sort each row's 4 digits so any ordering maps to one canonical key."""
    return np.sort(digits, axis=1)


def simulate_pick4_digits(
    chosen: tuple[int, int, int, int],
    n_plays: int,
    rng: np.random.Generator,
    straight_prize: float,
    box_prize: float,
) -> dict:
    """
    Draw four real digits (0-9) per play and apply Pick 4 rules against a
    `chosen` combination, counting Straight hits (exact order) and Box hits
    (same digits any order). Demonstrates that, e.g., four distinct digits
    hit the Box about 24 / 10,000 of the time.
    """
    draws = rng.integers(0, 10, size=(n_plays, 4))
    chosen_arr = np.array(chosen)

    straight_hits = int(np.all(draws == chosen_arr, axis=1).sum())

    chosen_sorted = np.sort(chosen_arr)
    box_hits = int(np.all(_multiset_key(draws) == chosen_sorted, axis=1).sum())

    ways = _count_ways(chosen)
    return {
        "chosen": chosen,
        "distinct_ways": ways,
        "n_plays": n_plays,
        "straight_hits": straight_hits,
        "box_hits": box_hits,
        "empirical_straight_odds": n_plays / straight_hits if straight_hits else float("inf"),
        "empirical_box_odds": n_plays / box_hits if box_hits else float("inf"),
        "theoretical_straight_odds": 10000,
        "theoretical_box_odds": 10000 / ways,
        "straight_return": straight_hits * straight_prize,
        "box_return": box_hits * box_prize,
    }


def _count_ways(digits: tuple[int, ...]) -> int:
    """
    Number of distinct orderings (permutations) of a 4-digit multiset.
    4!/(product of factorials of repeat counts):
      4 distinct  -> 24  (24-Way Box)
      one pair    -> 12  (12-Way Box)
      two pair    -> 6   (6-Way Box)
      trips       -> 4   (4-Way Box)
      quads       -> 1   (Straight only)
    """
    from collections import Counter
    from math import factorial

    counts = Counter(digits)
    denom = 1
    for c in counts.values():
        denom *= factorial(c)
    return factorial(len(digits)) // denom
