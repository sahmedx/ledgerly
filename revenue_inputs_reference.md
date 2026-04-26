# Revenue Model Inputs — Reference (V2)

All revenue inputs live in `lib/revenue/defaults.ts` (+ `starting-state.ts` for the Day-0 snapshot). Organized by category. V2 calibration (Apr 2026) rebalances ARR mix toward enterprise, doubles starting reps, bumps AI inference rate, and reconceives named pipeline as a weighted-ACV scalar.

## 1. Day-0 starting state (Dec 2025 snapshot, `starting-state.ts`)

| Input | Value | Means |
|---|---|---|
| `self_serve_arr.plus` | $170M | Plus-tier ARR |
| `self_serve_arr.business_small` | $140M | Business (<50 seats) ARR |
| `sales_led_arr.business_large` | $115M | Business (50+) ARR |
| `sales_led_arr.enterprise` | $175M | Enterprise ARR |
| `workspaces.plus` | 354,000 | paying Plus workspaces ($170M / ($10 × 12 × 4 seats)) |
| `workspaces.business_small` | 48,600 | paying Business-small workspaces ($140M / ($20 × 12 × 12 seats)) |
| `logos.business_large` | 4,800 | sales-led BL accounts ($115M / ($20 × 12 × 100 seats)) |
| `logos.enterprise` | 1,167 | enterprise accounts ($175M / $150k ACV) |
| `free_users` | 90M | free-tier user pool |
| `total_headcount` | 1,100 | starting employee count (informational; bumped with G&A 3× build) |
| `quota_reps` | 100 | starting sales reps (was 50; doubled to match plausible AE productivity) |
| `rd_headcount` | 420 | starting engineers |
| `ga_headcount` | 270 | starting G&A (was 90; tripled — drives 3× cash + SBC) |
| `cs_headcount` | 95 | starting CSMs (informational; engine derives from logos/ratios) |
| `marketing_headcount` | 90 | starting marketing |

Total starting ARR = $170 + $140 + $115 + $175 = $600M. Self-serve / sales-led split = $310M / $290M = 52% / 48%.

Headcount build for 920: S&M (100 reps + 50 SDRs + 30 SEs + 13 mgrs + 90 mktg = 283) + R&D 420 + G&A 90 + CS 95 = 888 + 32 leadership/buffer = 920.

## 2. Self-serve drivers

| Input | Default | Means |
|---|---|---|
| `free_pool_monthly_growth` | 0.015 (1.5%/mo) | free-user pool growth net of churn |
| `free_to_paid_rate` | 0.00025 (0.025%/mo) | monthly free → paid conversion |
| `tier_mix_on_conversion` | 80/20 | new converts: 80% Plus / 20% Business |
| `initial_seats_per_workspace.plus` | 4 | seats at acquisition (preserved per user) |
| `initial_seats_per_workspace.business_small` | 12 | seats at acquisition |
| `legacy_seats_per_workspace.plus` | 4 | Day-0 cohort starting seats (preserved per user) |
| `legacy_seats_per_workspace.business_small` | 12 | Day-0 cohort starting seats |
| `monthly_seat_growth_rate.plus` | 0.5%/mo | seat expansion within active workspace |
| `monthly_seat_growth_rate.business_small` | 1.0%/mo | seat expansion |
| `plus_to_business_upgrade_rate` | 1.0%/mo | Plus → Business upgrade (was 0.8%; reflects enterprise-trending dynamic) |
| `retention.plus` | floor 0.55 / decay 0.20 | new Plus cohort 12-mo retention curve (floor was 0.45; bumped — too harsh) |
| `retention.business_small` | floor 0.70 / decay 0.10 | new Business cohort retention |
| `retention.legacy_plus` | floor 0.65 / decay 0.08 | Day-0 cohort retention (less churn-prone) |
| `retention.legacy_business_small` | floor 0.85 / decay 0.05 | Day-0 cohort retention |
| `pricing.plus.annual` | $10/seat/mo | per-seat list price |
| `pricing.plus.monthly` | $12/seat/mo | per-seat list price |
| `pricing.business_small.annual` | $20/seat/mo | per-seat list price |
| `pricing.business_small.monthly` | $24/seat/mo | per-seat list price |
| `annual_billing_mix.plus` | 0.55 | 55% of Plus on annual prepay |
| `annual_billing_mix.business_small` | 0.70 | 70% of Business on annual |
| `legacy_annual_fraction.plus` | 1.0 | Day-0 cohort 100% annual |
| `legacy_annual_fraction.business_small` | 1.0 | Day-0 cohort 100% annual |
| `graduation_seat_threshold` | 50 | Business-small → sales-led at this seat count |

## 3. Sales-led drivers

| Input | Default | Means |
|---|---|---|
| `avg_seats_per_logo.business_large` | 100 | seats per BL deal |
| `avg_seats_per_logo.enterprise` | 500 | seats per ENT deal |
| `blended_seat_price.business_large` | $20/seat/mo | net price after enterprise discount |
| `blended_seat_price.enterprise` | $25/seat/mo | net enterprise pricing |
| `enterprise_avg_acv` | $150,000/yr | used for capacity-side ACV math |
| `named_pipeline_weighted_acv` | $40M | Weighted pipeline ACV across the taper window (already discounted by stage prob; engine consumes directly). Calibrated to ~14% of sales-led ARR base — typical 6-mo enterprise pipeline coverage |
| `named_pipeline` | 17-deal seed | Illustrative deal list for the inline-edit table & weighted-bookings chart. Stage probabilities apply here for UI display only — engine no longer consumes the deal list |
| `stage_probability.qualified` | 0.10 | UI-only weighting for the deal table |
| `stage_probability.discovery` | 0.25 | |
| `stage_probability.proposal` | 0.50 | |
| `stage_probability.commit` | 0.80 | |
| `pipeline_taper_start_month` | 4 | First month named pipeline begins to fade |
| `pipeline_taper_end_month` | 9 | Last month of named-pipeline contribution; capacity ramps in over the same window as `1 − pipelineWeight` |
| `capacity_segment_split` | 50% BL / 50% ENT | new bookings allocation (was 60/40; shifted toward enterprise) |
| `sales_capacity.hiring_plan` | 6 reps/mo × 24 | rep-hire cadence (was 3; doubled to slow margin expansion) |
| `sales_capacity.ramp_curve` | 0/0/0/.33/.33/.33/.66/.66/.66/1/1/1 | productivity by month-of-tenure |
| `sales_capacity.fully_ramped_quota_annual` | $1.2M | annual quota per ramped rep |
| `sales_capacity.attainment` | 0.80 | % of quota actually closed |
| `sales_capacity.monthly_attrition_rate` | 0.015 (1.5%/mo) | rep attrition |
| `sales_capacity.replacement_lag_months` | 2 | gap from attrition to backfill |
| `win_rate` | 0.30 | UI-only deal-table weighting (engine no longer applies it to capacity — quota × attainment is already closed ARR) |
| `existing_customer_dynamics.business_large.gross_churn` | 0.005/mo | 6%/yr |
| `existing_customer_dynamics.business_large.contraction` | 0.003/mo | downsells |
| `existing_customer_dynamics.business_large.expansion` | 0.015/mo | upsells |
| `existing_customer_dynamics.enterprise.gross_churn` | 0.002/mo | 2.4%/yr |
| `existing_customer_dynamics.enterprise.contraction` | 0.004/mo | |
| `existing_customer_dynamics.enterprise.expansion` | 0.020/mo | |
| `legacy_anniversary_distribution` | 10/0/0/10/0/0/10/0/0/70/0/0 | Day-0 base renewal calendar |

## 4. Cost drivers

| Input | Default | Means |
|---|---|---|
| `sm.sdr_ratio` | 0.5 | 1 SDR per 2 reps |
| `sm.se_ratio` | 0.3 | 1 SE per ~3 reps |
| `sm.reps_per_manager` | 8 | mgmt span |
| `sm.flc.rep` | $300k | fully-loaded comp |
| `sm.flc.sdr` | $150k | |
| `sm.flc.se` | $250k | |
| `sm.flc.manager` | $400k | |
| `sm.flc.mktg` | $250k | marketing FLC |
| `sm.marketing_programs_pct_of_revenue` | 16% | S&M non-HC expense (was 8%; doubled) |
| `sm.marketing_hiring_plan` | 2/mo × 24 | mktg hire cadence (was 1; doubled) |
| `rd.hiring_plan` | 7/mo × 24 | engineer hire cadence (was 5; bumped to 7 to soften margin expansion without overhiring) |
| `rd.flc_per_eng` | $400k | engineer FLC |
| `rd.tooling_pct_of_revenue` | 4% | R&D non-HC expense (was 2%; doubled) |
| `ga.hiring_plan` | 2/mo × 24 | G&A hire cadence (was 1; doubled) |
| `ga.flc_per_ga` | $250k | G&A FLC |
| `ga.te_pct_of_revenue` | 9.0% | G&A non-HC expense (was 1.5% → 4.5% with G&A 3× → 9% doubled here) |
| `cs.csm_per_enterprise_logos` | 25 | 1 CSM per 25 ENT |
| `cs.csm_per_business_large_logos` | 100 | 1 CSM per 100 BL |
| `cs.flc_per_csm` | $200k | CSM FLC |
| `cs.cs_in_cogs_pct` | 0.70 | 70% of CS lands in COGS |
| `cogs.hosting_pct_of_revenue` | 8% | infra |
| `cogs.payment_processing_pct_self_serve` | 3% | Stripe/Adyen on self-serve |
| `cogs.payment_processing_pct_sales_led` | 1% | enterprise wire/ACH |
| `cogs.ai_inference_pct_of_paid_arr` | 12% | NEW. LLM compute as % of total paid ARR (Plus + Business + Enterprise). Was 6% of B+E only |
| `sbc.rd_sbc_pct` | 65% | R&D SBC as % cash comp |
| `sbc.sm_sbc_pct` | 35% | S&M SBC |
| `sbc.ga_sbc_pct` | 50% | G&A SBC |
| `sbc.cs_sbc_pct` | 30% | CS SBC |
| `da.monthly_da_amount` | $1.5M | flat D&A placeholder (was $500k; tripled with G&A scale-up) |
| `allocation.marketing_self_serve_pct` | 70% | mktg cost split |
| `allocation.rd_self_serve_pct` | 60% | R&D cost split |

## 5. Scenario shock multipliers (compound)

| Driver | Base | Upside | Downside |
|---|---|---|---|
| `free_pool_growth` | 1.00 | 1.20 | 0.80 |
| `free_to_paid_rate` | 1.00 | 1.20 | 0.80 |
| `plus_to_business_upgrade_rate` | 1.00 | 1.30 | 0.70 |
| `attainment` | 1.00 | 1.15 | 0.85 |
| `win_rate` | 1.00 | 1.10 | 0.90 |
| `self_serve_churn` | 1.00 | 0.75 | 1.25 |
| `sales_led_churn` | 1.00 | 0.80 | 1.20 |
| `expansion_rate` | 1.00 | 1.20 | 0.80 |

## 6. IPO multiples

- low 10×, mid 12×, high 15× — applied to ending ARR for the Dashboard valuation walk.

## V2 sanity numbers (Day-0)

- Revenue (monthly): ~$50M
- Hosting: $4M (8%)
- Payment processing: ~$1.2M
- AI inference: $6M (12% of $50M paid ARR/mo)
- CS in COGS: ~$1.1M (95 CSMs × $200k / 12 × 70%)
- Total COGS: ~$12.3M → Gross margin ~75%
- AE productivity: $290M sales-led ARR / 100 reps = $2.9M/rep
- SBC / revenue: ~25%

## Where to edit them in the UI

Most are reachable via the right-drawer on each view:

- **Self-Serve view** → free pool params, conversion, retention, pricing, mix, graduation threshold.
- **Sales-Led view** → starting ARR/logos, capacity, attainment, win rate, dynamics, pipeline (inline-edit table is illustrative — engine consumes `named_pipeline_weighted_acv`).
- **Scenarios view** → shock multipliers.
- **P&L view** → SBC ratios, D&A, allocation splits.

Cost FLCs, headcount hiring plans, COGS percentages, IPO multiples — currently **not surfaced** in any drawer. Live only in `defaults.ts`.
