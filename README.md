# Ontario OLG Lottery — Mathematics & Responsible-Budget Analysis

A rigorous, reproducible analysis of six Ontario Lottery and Gaming (OLG) /
Interprovincial Lottery Corporation (ILC) games: **Pick 2, Pick 3, Pick 4,
Daily Grand, Lotto 6/49, and Lotto Max**. All money is in **Canadian dollars**.

> **This tool cannot predict any draw, and it never claims to.** Lottery draws
> are independent and memoryless. "Hot", "cold", "overdue", and "pattern"
> numbers, and any AI/ML "prediction", have **zero** effect on the next result —
> the mathematics below shows exactly why, and every random selection generated
> here is labelled *entertainment only*. No strategy in this repository has
> positive expected value. If gambling is causing harm: **ConnexOntario
> 1‑866‑531‑2600** (24/7, free, confidential) · <https://www.playsmart.ca>.

---

## 0. Data provenance & an environment caveat (read first)

Every figure is sourced to **OLG (olg.ca)** or its ILC partner corporations
(WCLC, BCLC, Loto‑Québec, Atlantic Lottery), which sell the **same national
games under identical rules**. Full citation list in **[DATA_SOURCES.md](DATA_SOURCES.md)**.

**Transparency:** in the sandbox where this was built, OLG's own domain
(`olg.ca`, `about.olg.ca`) was blocked by an egress policy, so pages could not
be fetched directly — figures were read via web search of OLG's pages plus
identical ILC-partner publications and official press releases. Each figure
carries a confirmation status:

| Status | Meaning |
|---|---|
| **CONFIRMED** | Surfaced in full from the official OLG page / game conditions (e.g. the entire Pick 4 table; Daily Grand chart). |
| **CURRENT‑2026** | Reflects a 2026 rule change, corroborated across multiple official/affiliated releases. |
| **PUBLISHED** | Long-standing, widely published OLG payout, internally consistent with a CONFIRMED sibling game, but the exact dollar cell could not be re-fetched live. Flagged below. |

**Two premises changed in 2026 — both verified here:**
- **Lotto 6/49:** the fixed Classic jackpot is now **$5,000,000** (not $1M); the
  **$1,000,000** is the guaranteed **Gold Ball** prize. *(CURRENT‑2026)*
- **Lotto Max:** relaunched **April 14 2026** — now **$6/play = 4 selections of
  7 numbers from 1–52**, jackpot cap **$90M**, jackpot odds **1 in 33,446,140
  per play**, overall odds **1 in 5.8**. *(CURRENT‑2026)*

Cells to re-verify directly against olg.ca when reachable: Pick 3 dollar
amounts ($500 / $160 / $80), the Pick 2 per‑bet table, and Lotto Max's
pari‑mutuel split. These are flagged **PUBLISHED** in `src/games.py`.

---

## 1–2. Comparison table — price, odds, and expected value

| Game (base wager) | Price | P(any win) | P(≥ $100) | P(≥ $1,000) | Top prize | Top‑prize odds | RTP / $1 | House edge |
|---|---|---|---|---|---|---|---|---|
| Pick 2 — Straight | $2.00 | 1 in 100 | — | — | $99 | 1 in 100 | ~58.5% | ~41.5% |
| Pick 3 — Straight | $1.00 | 1 in 1,000 | 1 in 1,000 | — | $500 | 1 in 1,000 | 50.0% | 50.0% |
| Pick 3 — 3‑Way Box | $1.00 | 1 in 333 | 1 in 333 | — | $160 | 1 in 333 | 48.0% | 52.0% |
| Pick 3 — 6‑Way Box | $1.00 | 1 in 167 | — | — | $80 | 1 in 167 | 48.0% | 52.0% |
| Pick 4 — Straight | $1.00 | 1 in 10,000 | 1 in 10,000 | 1 in 10,000 | $5,000 | 1 in 10,000 | 50.0% | 50.0% |
| Pick 4 — 4‑Way Box | $1.00 | 1 in 2,500 | 1 in 2,500 | 1 in 2,500 | $1,250 | 1 in 2,500 | 50.0% | 50.0% |
| Pick 4 — 6‑Way Box | $1.00 | 1 in 1,667 | 1 in 1,667 | — | $800 | 1 in 1,667 | 48.0% | 52.0% |
| Pick 4 — 12‑Way Box | $1.00 | 1 in 833 | 1 in 833 | — | $400 | 1 in 833 | 48.0% | 52.0% |
| Pick 4 — 24‑Way Box | $1.00 | 1 in 417 | 1 in 417 | — | $200 | 1 in 417 | 48.0% | 52.0% |
| **Daily Grand** | $3.00 | 1 in 6.8 | 1 in 1,213 | 1 in 58,803 | $1,000/day for life ($7M cash) | 1 in 13,348,188 | 46.1% | 53.9% |
| **Lotto 6/49** | $3.00 | 1 in 6.6 | 1 in 13,983,816 ¹ | 1 in 13,983,816 ¹ | $5,000,000 (Classic) | 1 in 13,983,816 | ~48.0% | ~52.0% |
| **Lotto Max** | $6.00 | 1 in 5.8 | 1 in 33,446,140 ¹ | 1 in 33,446,140 ¹ | Jackpot to $90M | 1 in 33,446,140 | ~48.0% | ~52.0% |

**¹ Important:** for 6/49 and Lotto Max the "≥ $100 / ≥ $1,000" columns show
**fixed tiers only** (the jackpot). Their mid‑range prizes (6/49 4/6 ≈ 1 in
1,033 and 5/6 ≈ 1 in 55,492; Lotto Max 4/7+Bonus ≈ 1 in 1,105 etc.) actually
pay in that range **far more often**, but they are **pari‑mutuel** (the pool is
split among winners, so the dollar amount varies by draw and cannot be pinned
to a fixed threshold). Treat those two columns as *lower bounds* for these two
games only.

**Expected value / RTP basis.** RTP = "return to player" = expected dollars
returned per dollar wagered.
- **Computed exactly** (all prizes fixed): Pick 3, Pick 4, **Daily Grand**.
- **OLG prize‑fund allocation** (pari‑mutuel / variable jackpot, so exact EV is
  not determinable from fixed data): Pick 2 (~58.5%), 6/49 and Lotto Max (~48%
  — 6/49's Prize Fund 18.33% + Draw Fund 29.67% of sales; Lotto Max Prize Fund
  ≥ 48% of sales).

**Headline:** every OLG draw game returns roughly **46–58 cents per dollar**.
The house edge is ~50% and, as Section 10 shows, **no bet or selection method
changes it**.

---

## 3–4. Pick 4: Straight vs Box, and why 4 unique digits = a 24‑Way Box

A Pick 4 result is an **ordered** 4‑digit string, so there are
**10⁴ = 10,000** equally likely outcomes (0000–9999).

- A **Straight** wins only on the exact order → **1 / 10,000**.
- A **Box** wins if the draw is **any arrangement** of your four digits. The
  number of winning arrangements = the number of distinct permutations of your
  multiset of digits:

| Play | Digit pattern | Permutations (ways) | Formula | Odds | Prize ($1) | RTP |
|---|---|---|---|---|---|---|
| Straight | exact order | 1 | — | 1 in 10,000 | $5,000 | 50% |
| 4‑Way Box | AAAB (trips) | 4 | 4!/3! | 1 in 2,500 | $1,250 | 50% |
| 6‑Way Box | AABB (two pair) | 6 | 4!/(2!·2!) | 1 in 1,667 | $800 | 48% |
| 12‑Way Box | AABC (one pair) | 12 | 4!/2! | 1 in 833 | $400 | 48% |
| **24‑Way Box** | **ABCD (all unique)** | **24** | **4! = 4·3·2·1** | **1 in 417** | **$200** | **48%** |

**Why 24, and why ~1 in 417:** four *distinct* digits can be arranged in
**4! = 24** orders, so **24** of the 10,000 ordered outcomes win:

```
P(24-Way Box) = 24 / 10,000 = 0.0024 = 1 in 416.67 ≈ 1 in 417.
```

Repeated digits *collapse* some arrangements (e.g. "1123" has only 12 distinct
orders because swapping the two 1s changes nothing), so fewer ways → rarer box
→ larger prize. But the **RTP stays ~48–50% for every box type** — the bigger
prize exactly offsets the longer odds. Choosing a "wider" or "narrower" box is a
variance choice, **not** a value choice.

---

## 5. Simulation — 1,000,000 draws per game (illustration, not prediction)

`src/simulate.py` runs ≥1,000,000 independent draws with a **fixed seed**
(`20260726`, today's date — chosen for reproducibility, **not** luck). It uses
two independent engines that agree: a tier‑probability sampler for every game,
and an **authentic Pick 4 digit draw** that recovers the box odds from first
principles. Representative results (`python3 src/report.py`):

```
Game                        Wins      Win rate  RTP(sim)  Longest loss streak   Net vs stake
Pick 4 - 24-Way Box       2,342       0.2342%     46.8%             4,222        -$531,600
Pick 4 - Straight           110       0.0110%     55.0%            37,601        -$450,000
Pick 3 - 6-Way Box        6,177       0.6177%     49.4%             1,409        -$505,840
Daily Grand             146,249      14.6249%     21.1%                75      -$2,367,161
Lotto 6/49              151,404      15.1404%    177.4%                89      +$2,322,026  (!)
Lotto Max               172,530      17.2530%     34.8%                59      -$3,913,111

Authentic Pick 4 digit draw:  four unique digits → box hits 2,397 / 1,000,000
                              → empirical 1 in 417  (theory 1 in 417) ✓
```

**Three lessons the simulation teaches (and states it cannot predict draws):**

1. **Losing streaks of hundreds-to-thousands of plays are normal.** The Pick 4
   Straight ran **37,601** losses in a row. This is expected, not "bad luck",
   and no number ever becomes "due".
2. **What you *experience* is worse than the headline RTP.** Daily Grand's
   *realized* return was ~21% vs its 46% theoretical, because the jackpots that
   prop up the theoretical figure essentially never land.
3. **A "winning" simulation proves nothing.** In this seed, 6/49's $5,000,000
   jackpot happened to hit once, making the run look profitable (+$2.3M). That
   is **variance, not an edge** — change the seed and it is a deep loss.

---

## 6–7. Fixed-budget weekly plans ($10 / $20 / $40)

Each budget is shown as three archetypes so the trade-off is explicit:
**Frequent** (chase the best any-prize odds), **Balanced** (a spread), and
**Jackpot** (chase seven figures). Spend, odds, EV, and an approximate maximum
losing streak (weeks) are all computed in `src/budgets.py`.

| Budget | Plan | Plays/wk | Weekly | Monthly | Annual | P(≥1 win / wk) | RTP | Annual E[loss] | ~Max losing streak |
|---|---|---|---|---|---|---|---|---|---|
| **$10** | Frequent | 4 | $10 | $43.33 | $520 | 38.2% | 46% | $279 | ~7 wk |
| | Balanced | 6 | $10 | $43.33 | $520 | 28.8% | 47% | $273 | ~9 wk |
| | Jackpot | 3 | $10 | $43.33 | $520 | 29.8% | 48% | $269 | ~9 wk |
| **$20** | Frequent | 8 | $20 | $86.67 | $1,040 | 61.8% | 46% | $559 | ~4 wk |
| | Balanced | 12 | $20 | $86.67 | $1,040 | 49.3% | 47% | $547 | ~5 wk |
| | Jackpot | 6 | $20 | $86.67 | $1,040 | 50.7% | 48% | $539 | ~5 wk |
| **$40** | Frequent | 14 | $40 | $173.33 | $2,080 | 87.3% | 46% | $1,120 | ~2 wk |
| | Balanced | 24 | $40 | $173.33 | $2,080 | 74.3% | 47% | $1,094 | ~3 wk |
| | Jackpot | 12 | $40 | $173.33 | $2,080 | 75.7% | 48% | $1,077 | ~3 wk |

*Monthly = weekly × 52 / 12; Annual = weekly × 52. Compositions are printed by
`report.py` (e.g. $20 Balanced = 2× Daily Grand + 2× 6/49 + 4× Pick 4 24‑Way Box
+ 4× Pick 3 6‑Way Box).*

**The frequent-vs-rare trade-off**, over a **full year** on the $20 plans:

| Plan | Wins ≥ $100 at least once/yr | ≥ $1,000 | ≥ $5,000 |
|---|---|---|---|
| Frequent | **22.7%** | 0.53% | 0.016% |
| Balanced | **44.3%** | 0.18% | 0.006% |
| Jackpot | 1.0% | **1.04%** | **1.04%** |

"Frequent" gives the best chance of a small win; "Jackpot" concentrates its
~1% into large prizes. **All three still lose ~half of every dollar.** More
frequent small wins and rare large prizes are two ends of the *same* negative‑EV
stick — you cannot have both, and neither wins long‑term.

---

## 8. Mathematically most suitable option per goal

Ranked by putting an entire **$20/week** on the single best game for each goal:

| Your goal | Best choice (odds‑driven) | Why |
|---|---|---|
| **Win more frequently** (any prize) | **Lotto 6/49 or Daily Grand** ($3 draws) → ~62% chance of *some* win/week | Highest any‑prize odds per dollar (1 in 6.6 / 6.8). Caveat: most "wins" are small or a free play. |
| **Target ≥ CA$200** | **Pick 4 — 24‑Way Box** (pays $200 at 1 in 417) | A $200+ hit at ~1 in 417 beats every big‑draw game's odds of *reaching* $200. |
| **Target ≥ CA$5,000** | **Pick 4 — Straight** (pays exactly $5,000 at 1 in 10,000) | 1 in 10,000 for a five‑figure hit is *vastly* better odds than any jackpot game. |
| **Life‑changing (≥ $1M)** | **Daily Grand** (1 in ~40M per $1) ≈ **Lotto 6/49** (1 in ~42M per $1) for best odds; **Lotto Max** for the biggest prize ($90M) but longest odds (1 in ~201M per $1) | Best *odds per dollar* vs biggest *headline*. All are astronomically unlikely. |

---

## 9. Random selections — entertainment only

`report.py` prints reproducible random picks (fixed seed). **Every combination
has exactly the same probability as any other**; none is labelled "more likely",
because none is. Example output:

```
Pick 3 : 912      Pick 4 : 9489
Daily Grand: [14, 17, 19, 22, 27]  Grand No: 3
Lotto 6/49 : [24, 35, 36, 43, 44, 49]
Lotto Max  : four selections of 7 numbers from 1–52 (see report.py)
```

---

## 10. Strategies that raise spend without improving expected return — flagged

Because every game returns a fixed ~46–58% *regardless of how you bet*, the
following **increase spending without proportionally improving expected return**
(all are flagged in `report.py`):

- **Buying more tickets / playing more draws** — linearly more expected **loss**,
  identical ~50% edge. Doubling spend doubles the expected loss.
- **"System"/wheeling, straight‑and‑box combos, wider vs narrower boxes** —
  raise the stake; RTP is unchanged (all Pick 4 boxes are ~48%).
- **Chasing "due"/hot/cold numbers, birthdays, patterns, or AI/ML "predictions"**
  — draws are independent and memoryless, so these change the odds by **exactly
  zero**, while typically nudging people to spend more.
- **Lotto Max at $6 (was $5)** — 20% more spend per play for the same ~48% RTP
  and slightly longer jackpot odds (1 in 33,446,140).

The **only** lever that reliably improves your financial outcome is **spending
less**.

---

## Final recommendation (odds + budget discipline)

1. **Expect to lose ~50%.** No OLG game has positive EV; treat any spend as the
   price of entertainment, never an investment or income plan.
2. **Set a fixed weekly budget you can afford to lose entirely** ($10/$20/$40
   modelled above), pay it from discretionary money, and **never chase losses**
   — a losing streak is normal and carries no information about the next draw.
3. **Match the game to your goal, then stop optimizing** (all options are
   ~48%): frequency → **Daily Grand / 6‑49**; a $200–$5,000 target → **Pick 4**
   (Box for $200, Straight for $5,000); a life‑changing dream → **Daily Grand /
   6‑49** for best odds or **Lotto Max** for the biggest prize.
4. **Ignore every prediction claim.** Hot/cold/overdue/pattern/AI systems do not
   work; if a product claims to predict draws, it is wrong or dishonest.
5. If play stops being fun or starts causing harm: **ConnexOntario
   1‑866‑531‑2600** · <https://www.playsmart.ca>.

---

## Reproducibility — how to run

```bash
pip install -r requirements.txt          # numpy only

python3 src/report.py                    # full report + 1,000,000-draw simulation
python3 src/report.py --sims 5000000     # more draws
python3 src/report.py --no-sim           # tables only (instant)
python3 src/games.py                     # validate official data + summary line
python3 -m pytest tests/ -q              # or: python3 tests/test_analysis.py
```

| File | Purpose |
|---|---|
| `src/games.py` | Official OLG/ILC data — every prize, odd, source URL, and confirmation flag. |
| `src/analysis.py` | Transparent probability & expected‑value engine (formulas below). |
| `src/simulate.py` | Monte Carlo engines (tier sampler + authentic Pick 4 digit draw). |
| `src/budgets.py` | The nine budget plans and the goal‑based recommendation ranker. |
| `src/report.py` | Runs everything and prints the full report. |
| `tests/test_analysis.py` | Verifies the math and the internal consistency of the data. |
| `DATA_SOURCES.md` | Every official source URL with its confirmation status. |

### Transparent formulas (all in `src/analysis.py`)

```
RTP (return per $1)          = ( Σ_i p_i · prize_i ) / price
EV of a free play            = price · RTP   ⟹  RTP = (Σ_cash p_i·prize_i) / (price · (1 − P_free))
P(any prize, one play)       = Σ_i p_i           (tiers are mutually exclusive)
P(win ≥ T, one play)         = Σ_i p_i · [prize_i ≥ T]
P(≥1 win over N plays)       = 1 − (1 − P_any)^N            (independent plays)
Expected loss over N plays   = N · price · (1 − RTP)
Pick-4 Box "ways"            = 4! / (Π_d c_d!)   for digit multiplicities c_d
Longest winless-week run ≈   log_{1/q}(n·p) + γ/ln(1/q) − ½   (q = P(no win/week))
```

*All figures are Canadian dollars. Official sources are listed in
[DATA_SOURCES.md](DATA_SOURCES.md). This repository is an educational
mathematics tool; it does not sell lottery products and cannot predict any draw.*
