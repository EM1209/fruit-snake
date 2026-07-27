"""
games.py -- Official OLG / Interprovincial Lottery Corporation game data.

DATA PROVENANCE (read this before trusting a number)
-----------------------------------------------------
Every figure below is sourced to OLG (olg.ca) or its ILC partner corporations
(WCLC, BCLC, Loto-Quebec, Atlantic Lottery), which sell the SAME national games
under identical rules. Each game records the official source URL(s).

Figures are tagged with a confirmation status:
  CONFIRMED  -- surfaced in full from the official OLG page / game conditions.
  CURRENT-2026 -- reflects a 2026 rule change, corroborated across multiple
                  official/affiliated releases (Lotto 6/49 $5M Classic;
                  the April 14 2026 Lotto Max relaunch).
  PUBLISHED  -- long-standing, widely published OLG payout consistent with the
                CONFIRMED sibling game's structure, but the exact dollar cell
                could not be re-fetched live in this environment (OLG's domain
                is blocked by this run's egress proxy). Flagged in `note`.

Nothing here implies any number can be predicted. Odds are long-run frequencies
of independent draws. See README "Data & reproducibility" for the full
disclosure and the list of cells to re-verify against olg.ca directly.

All money is Canadian dollars. Top-annuity prizes use OLG's published lump-sum
cash-option values so that "expected financial return" is a present-value.
"""

from __future__ import annotations

from math import comb

from analysis import Game, PrizeTier

# --- official sources (cited in README / DATA_SOURCES.md) ------------------
S_PICK2 = "https://www.olg.ca/en/lottery/play-pick-2/pick-2-game-conditions.html"
S_PICK3 = "https://www.olg.ca/en/lottery/play-pick-3/pick-3-game-conditions.html"
S_PICK4 = "https://www.olg.ca/content/dam/olg/web/product/rules-game-conditions/pick-4-game-conditions.pdf"
S_DG = "https://www.olg.ca/en/lottery/play-daily-grand-encore/how-to-play.html"
S_649 = "https://www.olg.ca/en/lottery/play-lotto-649-encore/odds-and-payouts.html"
S_MAX = "https://www.olg.ca/en/lottery/play-lotto-max-encore/about.html"


def _p(odds_denom: float) -> float:
    """Convert '1 in N' odds to a probability 1/N."""
    return 1.0 / odds_denom


# ===========================================================================
# PICK 2, 3, 4  -- fixed-prize daily digit games, drawn twice a day (14/week)
# ===========================================================================

# PICK 4 -- CONFIRMED in full from olg.ca (the accuracy-critical table).
# 10,000 equally likely ordered outcomes (0000-9999). A Box wins if the drawn
# digits match your set in any order; # of orderings = the "ways".
PICK4_STRAIGHT = Game(
    key="pick4_straight", name="Pick 4 - Straight ($1)", price=1.0, source=S_PICK4,
    draws_per_week=14,
    tiers=(PrizeTier("Exact order (ABCD in order)", _p(10_000), 5_000.0),),
    notes="CONFIRMED. 1 in 10,000. $2M per-draw prize cap.",
)
PICK4_BOX_4WAY = Game(
    key="pick4_box4", name="Pick 4 - 4-Way Box ($1)", price=1.0, source=S_PICK4,
    draws_per_week=14,
    tiers=(PrizeTier("AAAB, any order (4 orderings)", 4/10_000, 1_250.0),),
    notes="CONFIRMED. 4 in 10,000 = 1 in 2,500. Digits: three identical + one.",
)
PICK4_BOX_6WAY = Game(
    key="pick4_box6", name="Pick 4 - 6-Way Box ($1)", price=1.0, source=S_PICK4,
    draws_per_week=14,
    tiers=(PrizeTier("AABB, any order (6 orderings)", 6/10_000, 800.0),),
    notes="CONFIRMED. 6 in 10,000 = 1 in 1,667. Digits: two pairs.",
)
PICK4_BOX_12WAY = Game(
    key="pick4_box12", name="Pick 4 - 12-Way Box ($1)", price=1.0, source=S_PICK4,
    draws_per_week=14,
    tiers=(PrizeTier("AABC, any order (12 orderings)", 12/10_000, 400.0),),
    notes="CONFIRMED. 12 in 10,000 = 1 in 833. Digits: one pair + two singles.",
)
PICK4_BOX_24WAY = Game(
    key="pick4_box24", name="Pick 4 - 24-Way Box ($1)", price=1.0, source=S_PICK4,
    draws_per_week=14,
    tiers=(PrizeTier("ABCD, any order (24 orderings)", 24/10_000, 200.0),),
    notes="CONFIRMED. 24 in 10,000 = 1 in 417. Digits: four unique -> 4! = 24 ways.",
)

# PICK 3 -- odds & structure CONFIRMED from olg.ca; dollar cells are the
# long-standing PUBLISHED OLG payouts, consistent with the CONFIRMED Pick 4
# ladder (Straight ~50% RTP, boxes ~48%). Flagged for direct re-verification.
PICK3_STRAIGHT = Game(
    key="pick3_straight", name="Pick 3 - Straight ($1)", price=1.0, source=S_PICK3,
    draws_per_week=14,
    tiers=(PrizeTier("Exact order (ABC in order)", _p(1_000), 500.0),),
    notes="Odds CONFIRMED 1 in 1,000. Prize $500 PUBLISHED (verify at source).",
)
PICK3_BOX_3WAY = Game(
    key="pick3_box3", name="Pick 3 - 3-Way Box ($1)", price=1.0, source=S_PICK3,
    draws_per_week=14,
    tiers=(PrizeTier("AAB, any order (3 orderings)", 3/1_000, 160.0),),
    notes="Odds CONFIRMED 1 in 333. Prize $160 PUBLISHED (verify at source).",
)
PICK3_BOX_6WAY = Game(
    key="pick3_box6", name="Pick 3 - 6-Way Box ($1)", price=1.0, source=S_PICK3,
    draws_per_week=14,
    tiers=(PrizeTier("ABC, any order (6 orderings)", 6/1_000, 80.0),),
    notes="Odds CONFIRMED 1 in 167. Prize $80 PUBLISHED (verify at source).",
)

# PICK 2 -- price/odds/overall payout CONFIRMED from olg.ca; the per-bet dollar
# table did not surface and OLG's surfaces conflict on the headline ($99 vs
# $100). Modelled with the published ~58.5% payout as the RTP anchor; the
# Straight cell is illustrative. Flagged: do not treat EV as exact.
PICK2_STRAIGHT = Game(
    key="pick2_straight", name="Pick 2 - Straight ($2)", price=2.0, source=S_PICK2,
    draws_per_week=14,
    tiers=(PrizeTier("Exact order (AB in order)", _p(100), 99.0,
                     note="top prize $99 (some OLG copy: $100)"),),
    ev_complete=False, official_rtp=0.585,
    notes="Odds CONFIRMED 1 in 100; price $2 CONFIRMED; OLG-published overall "
          "payout ~58.5%. Exact per-bet table NOT confirmable here.",
)

PICK_GAMES = [
    PICK2_STRAIGHT,
    PICK3_STRAIGHT, PICK3_BOX_3WAY, PICK3_BOX_6WAY,
    PICK4_STRAIGHT, PICK4_BOX_4WAY, PICK4_BOX_6WAY, PICK4_BOX_12WAY, PICK4_BOX_24WAY,
]

# ===========================================================================
# DAILY GRAND  -- $3, 5/49 + Grand Number 1-7, drawn Mon & Thu (2/week).
# ALL PRIZES FIXED -> expected value is fully computable. CONFIRMED.
# Annuity top prizes valued at OLG's published lump-sum cash options.
# ===========================================================================
DAILY_GRAND = Game(
    key="daily_grand", name="Daily Grand ($3)", price=3.0, source=S_DG,
    draws_per_week=2,
    tiers=(
        PrizeTier("5/5 + Grand No.  ($1,000/day for life; $7M cash)", _p(13_348_188), 7_000_000.0),
        PrizeTier("5/5              ($25,000/yr for life; $500k cash)", _p(2_224_698), 500_000.0),
        PrizeTier("4/5 + Grand No.", _p(60_674), 1_000.0),
        PrizeTier("4/5", _p(10_112), 500.0),
        PrizeTier("3/5 + Grand No.", _p(1_411), 100.0),
        PrizeTier("3/5", _p(235), 20.0),
        PrizeTier("2/5 + Grand No.", _p(101), 10.0),
        PrizeTier("1/5 + Grand No.", _p(20), 4.0),
        # Free play = match the Grand No. AND zero main numbers. NOTE: 1-in-7
        # is P(match Grand No. at all), which guarantees >= a free play; the
        # EXACTLY-here tier is (1/7) * C(44,5)/C(49,5) = 1 in 12.3. Using 1/7
        # would double-count the "+Grand No." cash tiers and wrongly inflate
        # the overall odds to 1 in 4.8 instead of OLG's published 1 in 6.8.
        PrizeTier("Grand No. only, 0 main (Free Play)",
                  (1.0 / 7.0) * comb(44, 5) / comb(49, 5), 0.0, is_free_play=True),
    ),
    notes="CONFIRMED; every tier matches exact hypergeometric math and the "
          "tiers sum to OLG's published 1 in 6.8. All fixed -> EV computable.",
)

# ===========================================================================
# LOTTO 6/49  -- $3, 6/49, drawn Wed & Sat (2/week). CURRENT-2026 structure:
#   * Classic Draw: FIXED $5,000,000 jackpot (6/6); fixed low tiers; three
#     middle tiers (5/6+B, 5/6, 4/6) are PARI-MUTUEL pool shares (not priceable).
#   * Gold Ball Draw: separate, one GUARANTEED winner/draw of $1,000,000 or the
#     rolling Gold Ball Jackpot ($10M -> $68M). Per-ticket EV of the Gold Ball
#     prize depends on sales volume and is not computable from fixed data.
# => ev_complete=False: ev_*() is a FIXED-TIER LOWER BOUND only.
# ===========================================================================
LOTTO_649 = Game(
    key="lotto649", name="Lotto 6/49 ($3)", price=3.0, source=S_649,
    draws_per_week=2,
    tiers=(
        PrizeTier("6/6  (Classic jackpot, fixed)", _p(13_983_816), 5_000_000.0),
        PrizeTier("3/6", _p(56.7), 10.0),
        PrizeTier("2/6 + Bonus", _p(81.2), 5.0),
        PrizeTier("2/6 (Free Play)", _p(8.3), 0.0, is_free_play=True),
    ),
    p_any_override=1.0 / 6.6,   # OLG-published overall odds (incl. pari-mutuel)
    ev_complete=False, official_rtp=0.48,  # 18.33% Prize + 29.67% Draw fund
    notes="CURRENT-2026. Classic $5M fixed. Middle tiers 5/6+B, 5/6, 4/6 are "
          "PARI-MUTUEL (excluded from EV). Gold Ball guarantees a $1M+ winner "
          "every draw (odds depend on ticket volume). EV shown = fixed-tier "
          "lower bound only.",
)

# ===========================================================================
# LOTTO MAX  -- CURRENT-2026 (relaunched Apr 14 2026): $6 per play = FOUR
# selections of 7 numbers from 1-52; drawn Tue & Fri (2/week). Jackpot cap
# $90M. Published jackpot odds 1 in 33,446,140 are PER PLAY (4 lines):
#   per selection P(7/7) = 1 / C(52,7) = 1 / 133,784,560;  4 / 133,784,560
#   = 1 / 33,446,140 per $6 play.  Overall any-prize 1 in 5.8 per play.
# Most middle tiers are PARI-MUTUEL; only 4/7 and 3/7+Bonus ($20) are fixed,
# plus 3/7 free play. => ev_complete=False (fixed-tier lower bound only).
# Modelled at the PLAY level ($6, 4 selections).
# ===========================================================================
_MAX_C = 133_784_560  # C(52,7), odds of 7/7 on ONE selection
LOTTO_MAX = Game(
    key="lottomax", name="Lotto Max ($6, 4 selections)", price=6.0, source=S_MAX,
    draws_per_week=2,
    tiers=(
        # Play-level jackpot prob = 4 selections / C(52,7) = 1/33,446,140.
        PrizeTier("7/7  (jackpot; $10M-$90M cap; play-level odds)", _p(33_446_140), 30_000_000.0,
                  note="jackpot varies; $30M used only for >= threshold analysis"),
        # Two fixed $20 tiers (4/7, 3/7+Bonus), each ~1 in 82.9 per selection.
        # P(>= one $20 win on a 4-selection play) = 1 - (1 - 2/82.9)^4.
        PrizeTier("$20 win (4/7 or 3/7+Bonus, any of 4 selections)",
                  1.0 - (1.0 - 2.0 / 82.9) ** 4, 20.0),
    ),
    p_any_override=1.0 / 5.8,   # OLG-published overall odds per $6 play
    ev_complete=False, official_rtp=0.48,  # OLG Prize Fund >= 48% of sales
    notes="CURRENT-2026 relaunch (Apr 14 2026). $6 = 4 selections, 7 from 1-52. "
          "Five middle tiers PARI-MUTUEL (excluded). Jackpot value illustrative. "
          "RTP = OLG's published >=48% prize-fund allocation.",
)

JACKPOT_GAMES = [DAILY_GRAND, LOTTO_649, LOTTO_MAX]

ALL_GAMES = PICK_GAMES + JACKPOT_GAMES
GAMES_BY_KEY = {g.key: g for g in ALL_GAMES}


def validate_all() -> None:
    for g in ALL_GAMES:
        g.validate()


if __name__ == "__main__":
    validate_all()
    print("All game specs validated OK.")
    for g in ALL_GAMES:
        print(f"{g.key:16s} price ${g.price:>5.2f}  "
              f"P(any)={g.p_any():.4g}  EV/$={g.ev_per_dollar():.3f}  "
              f"{'(fixed-tier lower bound)' if not g.ev_complete else ''}")
