# Data sources & confirmation status

All game figures are Ontario OLG / Interprovincial Lottery Corporation (ILC)
data. These are **national games** sold under identical rules by OLG and its
partner corporations (WCLC, BCLC, Loto‑Québec, Atlantic Lottery), so
partner/press figures corroborate the OLG numbers exactly.

**Environment caveat.** When this repo was built, the sandbox's egress proxy
returned HTTP 403 for `olg.ca` / `about.olg.ca` (organization policy), so OLG
pages and the Game‑Conditions PDFs could not be fetched directly. Figures were
obtained via web search of OLG's own indexed pages plus identical ILC‑partner
publications and official OLG/newswire press releases. **Re‑verify the cells
flagged PUBLISHED against olg.ca directly when the domain is reachable.**

Status legend: **CONFIRMED** (full official table surfaced) ·
**CURRENT‑2026** (2026 rule change, multi‑source corroborated) ·
**PUBLISHED** (long‑standing figure, internally consistent, not re‑fetched live).

---

## Pick 2 / Pick 3 / Pick 4 (twice‑daily digit games)

| Item | Status | Notes |
|---|---|---|
| Pick 4 full table (Straight $5,000 / 4‑Way $1,250 / 6‑Way $800 / 12‑Way $400 / 24‑Way $200) and all odds | **CONFIRMED** | Complete table surfaced from olg.ca; internally consistent with 10,000 ordered outcomes. $2,000,000 per‑draw prize cap. |
| Pick 3 odds (Straight 1 in 1,000; 3‑Way Box 1 in 333; 6‑Way Box 1 in 167) | **CONFIRMED** | Odds from olg.ca. |
| Pick 3 prizes ($500 / $160 / $80) | **PUBLISHED** | Widely published OLG payouts; consistent with the CONFIRMED Pick 4 ladder (Straight ~50% RTP, boxes ~48%). Re‑verify at source. |
| Pick 2: price $2, Straight 1 in 100, top prize $99, ~58.5% payout | **CONFIRMED** (with ambiguity) | OLG surfaces conflict on headline ($99 vs $100). Exact per‑bet box table did not surface — EV modelled from the published ~58.5% payout, not treated as exact. |

Sources:
- <https://www.olg.ca/content/dam/olg/web/product/rules-game-conditions/pick-4-game-conditions.pdf>
- <https://www.olg.ca/en/lottery/play-pick-4/pick-4-game-conditions.html>
- <https://www.olg.ca/en/lottery/play-pick-3/pick-3-game-conditions.html>
- <https://www.olg.ca/en/lottery/play-pick-2/pick-2-game-conditions.html>
- <https://www.olg.ca/en/lottery/play-pick-2/odds-and-payouts.html>

---

## Daily Grand ($3; 5 of 1–49 + Grand Number 1–7; draws Mon & Thu)

| Item | Status | Notes |
|---|---|---|
| Full prize/odds chart (top 1 in 13,348,188; overall 1 in 6.8) | **CONFIRMED** | **Every tier independently reproduced from exact hypergeometric math** (`tests/test_analysis.py`); the tiers sum to OLG's published 1 in 6.8. All prizes fixed → EV computed exactly (46.1%). |
| Top prizes: $1,000/day for life ($7M cash) ; $25,000/yr for life ($500k cash) | **CONFIRMED** | Annuity prizes valued at OLG's published lump‑sum cash options for present‑value EV. |

Sources:
- <https://www.olg.ca/en/lottery/play-daily-grand-encore/how-to-play.html>
- <https://www.olg.ca/en/lottery/play-daily-grand-encore/about.html>
- <https://www.wclc.com/games/daily-grand.htm>

---

## Lotto 6/49 ($3; 6 of 49; draws Wed & Sat)

| Item | Status | Notes |
|---|---|---|
| **Classic Draw jackpot now $5,000,000 fixed** (6/6, 1 in 13,983,816) | **CURRENT‑2026** | Replaces the old $1M Classic premise. |
| Gold Ball Draw: one guaranteed winner/draw of **$1,000,000 or the rolling Gold Ball Jackpot** ($10M → $68M cap) | **CURRENT‑2026** | Per‑ticket EV depends on sales volume — not computable from fixed data. |
| Fixed low tiers (3/6 $10; 2/6+Bonus $5; 2/6 Free Play) | **CURRENT‑2026** | |
| Middle tiers 5/6+Bonus, 5/6, 4/6 | **CURRENT‑2026, pari‑mutuel** | Pool shares — amounts vary by draw; excluded from computed EV. |
| Overall any‑prize 1 in 6.6; RTP ~48% | **CONFIRMED** | Prize Fund 18.33% + Draw Fund 29.67% of sales = ~48% to prizes. |

Sources:
- <https://www.olg.ca/en/lottery/play-lotto-649-encore/odds-and-payouts.html>
- <https://www.olg.ca/en/lottery/play-lotto-649-encore/goldball.html>
- <https://www.wclc.com/games/lotto-649.htm>

---

## Lotto Max — relaunched **April 14 2026** ($6/play; 4 selections of 7 from 1–52; draws Tue & Fri)

| Item | Status | Notes |
|---|---|---|
| Price **$6**; **4 selections** of 7 numbers from **1–52** | **CURRENT‑2026** | Replaces the old $5 / 3 selections / 1–50 premise. |
| Jackpot cap **$90M**; jackpot odds **1 in 33,446,140 per play** | **CURRENT‑2026** | Per selection P(7/7)=1/C(52,7)=1/133,784,560; 4 selections/play ⟹ 1/33,446,140 (verified in `tests`). |
| Overall any‑prize **1 in 5.8**; RTP ~48% (Prize Fund ≥ 48% of sales) | **CURRENT‑2026** | |
| New $100,000 (MAXPLUS) prizes; Maxmillions above $50M jackpot | **CURRENT‑2026** | |
| Fixed tiers 4/7 & 3/7+Bonus $20; 3/7 Free Play | **CURRENT‑2026** | |
| Five middle tiers | **pari‑mutuel** | Pool shares — excluded from computed EV. |

Sources:
- <https://www.olg.ca/en/lottery/play-lotto-max-encore/about.html>
- <https://about.olg.ca/the-new-lotto-max-is-here/>
- <https://about.olg.ca/big-changes-coming-to-lotto-max-bigger-jackpots-more-prizes-and-better-overall-odds-of-winning-are-coming-april-2026/>
- <https://www.newswire.ca/news-releases/the-new-lotto-max-is-here-811676382.html>
- <https://www.wclc.com/games/lotto-max.htm>

---

## Responsible gambling

- **ConnexOntario** — 1‑866‑531‑2600 (free, confidential, 24/7)
- **OLG PlaySmart** — <https://www.playsmart.ca>
