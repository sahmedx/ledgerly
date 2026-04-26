/* Day-0 (Dec 2025) snapshot — V2 calibration. */

export const STARTING_STATE = {
  self_serve_arr: { plus: 170_000_000, business_small: 140_000_000 },
  sales_led_arr:  { business_large: 115_000_000, enterprise: 175_000_000 },
  workspaces:     { plus: 354_000, business_small: 48_600 },
  logos:          { business_large: 4_800, enterprise: 1_167 },
  free_users:     90_000_000,
  total_headcount: 920,
  quota_reps:      100,
  rd_headcount:    420,
  ga_headcount:    90,
  cs_headcount:    95,
  marketing_headcount: 90,
} as const;

export const TOTAL_STARTING_ARR =
  STARTING_STATE.self_serve_arr.plus +
  STARTING_STATE.self_serve_arr.business_small +
  STARTING_STATE.sales_led_arr.business_large +
  STARTING_STATE.sales_led_arr.enterprise;
// = $600M

export const MONTH_LABELS_REVENUE = [
  'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
  'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26',
  'Jan 27', 'Feb 27', 'Mar 27', 'Apr 27', 'May 27', 'Jun 27',
  'Jul 27', 'Aug 27', 'Sep 27', 'Oct 27', 'Nov 27', 'Dec 27',
];

/** Month index of the current period (Apr 26). Months 1..3 are actuals. */
export const CURRENT_MONTH_INDEX = 4;
export const ACTUALS_THROUGH = 3;
