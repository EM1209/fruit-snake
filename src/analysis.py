"""
analysis.py -- Game-agnostic lottery probability & expected-value engine.

Every number this module produces is derived transparently from two inputs:
  1. the base ticket price of a play, and
  2. a list of mutually-exclusive prize tiers, each with
        - probability of landing in that tier on a SINGLE play, and
        - the CA$ prize paid for that tier on the base wager.

No tier here is treated as "predictable". Probabilities describe long-run
frequencies of independent, memoryless draws -- nothing about a past draw
changes the probability of the next one.

Formulas (all elementary, no hidden constants):
  RTP / expected value per $1  =  ( Σ p_i * prize_i ) / price
  P(any prize on one play)     =  Σ p_i                (tiers are exclusive)
  P(win >= T on one play)      =  Σ p_i for prize_i >= T
  P(>=1 win over N plays)      =  1 - (1 - P_any)^N     (independent plays)
  Expected loss over N plays   =  N * price * (1 - RTP)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from math import prod  # noqa: F401  (kept for readers; used conceptually below)


@dataclass(frozen=True)
class PrizeTier:
    """One mutually-exclusive winning outcome of a single play."""

    name: str
    probability: float          # P(a single play lands exactly in this tier)
    prize: float                # CA$ paid for this tier on the base wager
    note: str = ""              # e.g. "pari-mutuel, average" or "fixed"
    is_free_play: bool = False  # prize is another ticket, not cash


@dataclass(frozen=True)
class Game:
    """A game or a specific play-type of a game (e.g. 'Pick 4 -- 24-Way Box')."""

    key: str
    name: str
    price: float                # CA$ cost of one play at the base wager
    tiers: tuple[PrizeTier, ...]
    source: str = ""            # official OLG / ILC URL the figures came from
    draws_per_week: float = 7.0 # how many draws you *could* enter per week
    notes: str = ""
    # When a game has pari-mutuel (pooled) tiers we cannot price, the tuple
    # above holds only the FIXED tiers, so Σp understates the true chance of
    # any prize. `p_any_override` supplies OLG's published overall odds so the
    # frequency math stays correct; and `ev_complete` flags whether ev_*()
    # captures the whole return (True) or only a fixed-tier lower bound (False).
    p_any_override: float | None = None
    ev_complete: bool = True
    # For pari-mutuel / variable-jackpot games whose exact EV is not computable
    # from fixed data, OLG publishes a prize-fund allocation (share of sales
    # returned as prizes). Use it as the cited expected return per $1.
    official_rtp: float | None = None

    # -- core probabilities -------------------------------------------------
    def p_any(self) -> float:
        """Probability a single play wins ANY cash prize (or free play)."""
        if self.p_any_override is not None:
            return self.p_any_override
        return sum(t.probability for t in self.tiers)

    def p_at_least(self, threshold: float) -> float:
        """Probability a single play wins a prize of at least CA$`threshold`."""
        return sum(t.probability for t in self.tiers if t.prize >= threshold)

    def top_prize(self) -> float:
        return max((t.prize for t in self.tiers), default=0.0)

    def top_prize_tier(self) -> PrizeTier | None:
        if not self.tiers:
            return None
        return max(self.tiers, key=lambda t: t.prize)

    def p_top(self) -> float:
        """Probability of the single largest prize tier (jackpot / straight)."""
        top = self.top_prize()
        return sum(t.probability for t in self.tiers if t.prize == top)

    # -- money --------------------------------------------------------------
    def p_free_play(self) -> float:
        return sum(t.probability for t in self.tiers if t.is_free_play)

    def ev_per_play(self) -> float:
        """
        Expected CA$ returned per play.

        A "free play" prize is another ticket, so its cash value is the
        game's own expected return. Writing EV = Σ p_i·prize_i over the cash
        tiers, plus P(free)·EV for the replayed tickets, and solving:

            EV = ( Σ_cash p_i·prize_i ) / ( 1 - P(free play) )

        This is exact (a geometric series of re-plays), not an approximation.
        """
        cash = sum(t.probability * t.prize for t in self.tiers if not t.is_free_play)
        denom = 1.0 - self.p_free_play()
        return cash / denom if denom > 0 else cash

    def ev_per_dollar(self) -> float:
        """Return-to-player: expected CA$ returned per CA$1 wagered."""
        return self.ev_per_play() / self.price

    def display_rtp(self) -> float:
        """
        Best available RTP for reporting:
          * exactly computed from fixed tiers when ev_complete (Pick 3/4,
            Daily Grand), otherwise
          * OLG's published prize-fund allocation (Pick 2, 6/49, Lotto Max).
        """
        if self.ev_complete:
            return self.ev_per_dollar()
        if self.official_rtp is not None:
            return self.official_rtp
        return self.ev_per_dollar()  # fixed-tier lower bound, last resort

    def rtp_basis(self) -> str:
        if self.ev_complete:
            return "computed (all prizes fixed)"
        if self.official_rtp is not None:
            return "OLG prize-fund allocation"
        return "fixed-tier lower bound"

    def house_edge(self) -> float:
        """Fraction of each dollar kept by the lottery, long run."""
        return 1.0 - self.ev_per_dollar()

    # -- multi-play helpers -------------------------------------------------
    def p_at_least_one_win(self, n_plays: int) -> float:
        """P(at least one winning play) over n independent plays."""
        return 1.0 - (1.0 - self.p_any()) ** n_plays

    def p_at_least_one_of(self, threshold: float, n_plays: int) -> float:
        """P(at least one play wins >= CA$`threshold`) over n independent plays."""
        return 1.0 - (1.0 - self.p_at_least(threshold)) ** n_plays

    def odds_string(self, p: float) -> str:
        """Render a probability as '1 in N' (N rounded sensibly)."""
        if p <= 0:
            return "never"
        n = 1.0 / p
        if n >= 100:
            return f"1 in {round(n):,}"
        return f"1 in {n:,.1f}"

    def validate(self) -> None:
        total = sum(t.probability for t in self.tiers)
        assert total <= 1.0 + 1e-9, f"{self.key}: tier probs sum to {total} > 1"
        for t in self.tiers:
            assert 0.0 <= t.probability <= 1.0, f"{self.key}: bad prob {t}"
            assert t.prize >= 0.0, f"{self.key}: bad prize {t}"


# ---------------------------------------------------------------------------
# Budget-plan modelling
# ---------------------------------------------------------------------------

@dataclass
class PlanLine:
    """One line of a weekly budget plan: `plays` plays of `game` each week."""

    game: Game
    plays_per_week: int

    def weekly_cost(self) -> float:
        return self.game.price * self.plays_per_week

    def weekly_ev(self) -> float:
        # Use the best-available RTP (computed for fixed games; OLG prize-fund
        # allocation for pari-mutuel games) so plan EV isn't understated by the
        # fixed-tier-only lower bound of 6/49 and Lotto Max.
        return self.game.display_rtp() * self.weekly_cost()


@dataclass
class BudgetPlan:
    name: str
    lines: list[PlanLine] = field(default_factory=list)
    weeks_per_year: int = 52

    # -- spend --------------------------------------------------------------
    def weekly_cost(self) -> float:
        return sum(l.weekly_cost() for l in self.lines)

    def monthly_cost(self) -> float:
        return self.weekly_cost() * self.weeks_per_year / 12.0

    def annual_cost(self) -> float:
        return self.weekly_cost() * self.weeks_per_year

    # -- return -------------------------------------------------------------
    def weekly_ev(self) -> float:
        return sum(l.weekly_ev() for l in self.lines)

    def annual_ev(self) -> float:
        return self.weekly_ev() * self.weeks_per_year

    def rtp(self) -> float:
        c = self.weekly_cost()
        return self.weekly_ev() / c if c else 0.0

    def weekly_expected_loss(self) -> float:
        return self.weekly_cost() - self.weekly_ev()

    def annual_expected_loss(self) -> float:
        return self.annual_cost() - self.annual_ev()

    def total_plays_per_week(self) -> int:
        return sum(l.plays_per_week for l in self.lines)

    # -- probabilities across the whole basket ------------------------------
    def p_no_win_week(self) -> float:
        """P(zero wins in a week) = Π over every play of (1 - p_any)."""
        p = 1.0
        for l in self.lines:
            p *= (1.0 - l.game.p_any()) ** l.plays_per_week
        return p

    def p_any_win_week(self) -> float:
        return 1.0 - self.p_no_win_week()

    def p_any_win_year(self) -> float:
        return 1.0 - self.p_no_win_week() ** self.weeks_per_year

    def p_at_least_week(self, threshold: float) -> float:
        p = 1.0
        for l in self.lines:
            p *= (1.0 - l.game.p_at_least(threshold)) ** l.plays_per_week
        return 1.0 - p

    def p_at_least_year(self, threshold: float) -> float:
        p_none_week = 1.0
        for l in self.lines:
            p_none_week *= (1.0 - l.game.p_at_least(threshold)) ** l.plays_per_week
        return 1.0 - p_none_week ** self.weeks_per_year

    def p_at_least_over_weeks(self, threshold: float, weeks: int) -> float:
        p_none_week = 1.0
        for l in self.lines:
            p_none_week *= (1.0 - l.game.p_at_least(threshold)) ** l.plays_per_week
        return 1.0 - p_none_week ** weeks

    def expected_max_losing_streak_weeks(self) -> float:
        """
        Expected length (in WEEKS) of the longest run of winless weeks over a
        year, using the standard approximation for the longest success run in
        Bernoulli trials:  E[L_n] ~ log_{1/q}(n*p) + gamma/ln(1/q) - 1/2,
        where here a 'winless week' is the event with probability q = P(no win
        in a week), p = 1-q, n = weeks_per_year. Reported as a guide, not a
        guarantee.
        """
        from math import log, e  # local import keeps module top clean
        q = self.p_no_win_week()      # prob a given week has NO win
        p = 1.0 - q
        n = self.weeks_per_year
        if q <= 0 or q >= 1 or n <= 1:
            return 0.0
        base = 1.0 / q                # runs are of the winless event
        euler_gamma = 0.5772156649
        approx = (log(n * p, base)
                  + euler_gamma / log(base)
                  - 0.5)
        return max(0.0, approx)
