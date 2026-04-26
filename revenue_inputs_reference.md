# Revenue Model Inputs — Reference

All revenue inputs live in `lib/revenue/defaults.ts` (+ `starting-state.ts` for the Day-0 snapshot). Organized by category.

## 1. Day-0 starting state (Dec 2025 snapshot, `starting-state.ts`)

| Input | Value | Means |
|---|---|---|
| `self_serve_arr.plus` | $200M | Plus-tier ARR |
| `self_serve_arr.business_small` | $160M | Business (<50 seats) ARR |
| `sales_led_arr.business_large` | $100M | Business (50+) ARR |
| `sales_led_arr.enterprise` | $140M | Enterprise ARR |
| `workspaces.plus` | 417,000 | paying Plus workspaces |
| `workspaces.business_small` | 55,000 | paying Business-small workspaces |
| `logos.business_large` | 4,200 | sales-led BL accounts |
| `logos.enterprise` | 933 | enterprise accounts |
| `free_users` | 90M | free-tier user pool |
| `total_headcount` | 800 | starting employee count |
| `quota_reps` | 50 | starting sales reps |
| `rd_headcount` | 420 | starting engineers |
| `ga_headcount` | 90 | starting G&A |
| `cs_headcount` | 50 | starting CSMs |
| `marketing_headcount` | 90 | starting marketing |

Total starting ARR = $600M (Notion's reported scale).

## 2. Self-serve drivers

| Input | Default | Means |
|---|---|---|
| `free_pool_monthly_growth` | 0.015 (1.5%/mo) | free-user pool growth net of churn |
| `free_to_paid_rate` | 0.00025 (0.025%/mo) | monthly free → paid conversion |
| `tier_mix_on_conversion` | 80/20 | new converts: 80% Plus / 20% Business |
| `initial_seats_per_workspace.plus` | 4 | seats at acquisition |
| `initial_seats_per_workspace.business_small` | 12 | seats at acquisition |
| `legacy_seats_per_workspace.plus` | 4 | Day-0 cohort starting seats |
| `legacy_seats_per_workspace.business_small` | 12 | Day-0 cohort starting seats |
| `monthly_seat_growth_rate.plus` | 0.5%/mo | seat expansion within active workspace |
| `monthly_seat_growth_rate.business_small` | 1.0%/mo | seat expansion |
| `plus_to_business_upgrade_rate` | 0.8%/mo | Plus → Business upgrade |
| `retention.plus` | floor 0.45 / decay 0.20 | new Plus cohort 12-mo retention curve |
| `retention.business_small` | floor 0.70 / decay 0.10 | new Business cohort retention |
| `retention.legacy_plus` | floor 0.65 / decay 0.08 | Day-0 cohort retention (less churn-prone) |
| `retention.legacy_business_small` | floor 0.85 / decay 0.05 | Day-0 cohort retention |
| `pricing.plus.annual` | $10/seat/mo | per-seat list price |
| `pricing.plus.monthly` | $12/seat/mo | per-seat list price |
| `pricing.business_small.annual` | $20/seat/mo | per-seat list price |
| `pricing.business_small.monthly` | $24/seat/mo | per-seat list price |
| `annual_billing_mix.plus` | 0.55 | 55% of Plus on annual prepay |
| `annual_billing_mix.business_small` | 0.70 | 70% of Business on annual |
| `legacy_annual_fraction.plus` | 1.0 | Day-0 cohort 100% annual (priced that way) |
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
| `named_pipeline` | 17 deals | months 1–6 pipeline (editable in UI) |
| `stage_probability.qualified` | 0.10 | win prob by stage |
| `stage_probability.discovery` | 0.25 | |
| `stage_probability.proposal` | 0.50 | |
| `stage_probability.commit` | 0.80 | |
| `pipeline_capacity_seam_month` | 7 | months 1–6 = pipeline; 7+ = capacity |
| `capacity_segment_split` | 60% BL / 40% ENT | new logos by capacity allocation |
| `sales_capacity.hiring_plan` | 3 reps/mo × 24 | rep-hire cadence |
| `sales_capacity.ramp_curve` | 0/0/0/.33/.33/.33/.66/.66/.66/1/1/1 | productivity by month-of-tenure |
| `sales_capacity.fully_ramped_quota_annual` | $1.2M | annual quota per ramped rep |
| `sales_capacity.attainment` | 0.80 | % of quota actually closed |
| `sales_capacity.monthly_attrition_rate` | 0.015 (1.5%/mo) | rep attrition |
| `sales_capacity.replacement_lag_months` | 2 | gap from attrition to backfill |
| `win_rate` | 0.30 | overall win rate (used in pipeline math) |
| `existing_customer_dynamics.business_large.gross_churn` | 0.005/mo | 6%/yr |
| `existing_customer_dynamics.business_large.contraction` | 0.003/mo | downsells |
| `existing_customer_dynamics.business_large.expansion` | 0.015/mo | upsells |
| `existing_customer_dynamics.enterprise.gross_churn` | 0.002/mo | 2.4%/yr |
| `existing_customer_dynamics.enterprise.contraction` | 0.004/mo | |
| `existing_customer_dynamics.enterprise.expansion` | 0.020/mo | |
| `legacy_anniversary_distribution` | 10/0/0/10/0/0/10/0/0/70/0/0 | Day-0 base renewal calendar (Jan/Apr/Jul = 10% each, Oct = 70%) |

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
| `sm.marketing_programs_pct_of_revenue` | 8% | non-headcount marketing spend |
| `sm.marketing_hiring_plan` | 1/mo × 24 | mktg hire cadence |
| `rd.hiring_plan` | 5/mo × 24 | engineer hire cadence |
| `rd.flc_per_eng` | $400k | engineer FLC |
| `rd.tooling_pct_of_revenue` | 2% | tooling/SaaS spend |
| `ga.hiring_plan` | 1/mo × 24 | G&A hire cadence |
| `ga.flc_per_ga` | $250k | G&A FLC |
| `ga.te_pct_of_revenue` | 1.5% | T&E |
| `cs.csm_per_enterprise_logos` | 25 | 1 CSM per 25 ENT |
| `cs.csm_per_business_large_logos` | 100 | 1 CSM per 100 BL |
| `cs.flc_per_csm` | $200k | CSM FLC |
| `cs.cs_in_cogs_pct` | 0.70 | 70% of CS lands in COGS |
| `cogs.hosting_pct_of_revenue` | 8% | infra |
| `cogs.payment_processing_pct_self_serve` | 3% | Stripe/Adyen on self-serve |
| `cogs.payment_processing_pct_sales_led` | 1% | enterprise wire/ACH |
| `cogs.ai_inference_pct_of_business_enterprise_arr` | 6% | LLM compute per Business+ ARR |
| `sbc.rd_sbc_pct` | 65% | R&D SBC as % cash comp |
| `sbc.sm_sbc_pct` | 35% | S&M SBC |
| `sbc.ga_sbc_pct` | 50% | G&A SBC |
| `sbc.cs_sbc_pct` | 30% | CS SBC |
| `da.monthly_da_amount` | $500k | flat D&A placeholder |
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

## Where to edit them in the UI

Most are reachable via the right-drawer on each view:

- **Self-Serve view** → free pool params, conversion, retention, pricing, mix, graduation threshold.
- **Sales-Led view** → starting ARR/logos, capacity, attainment, win rate, dynamics, pipeline (inline edit in the table itself).
- **Scenarios view** → shock multipliers.
- **P&L view** → SBC ratios, D&A, allocation splits.

Cost FLCs, headcount hiring plans, COGS percentages, IPO multiples — currently **not surfaced** in any drawer. Live only in `defaults.ts`. Note as a gap if you want to tune them.
