import type { Vendor, VendorSeries, MonthPoint } from './types';

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
export const MONTH_LABELS = ['Jan 26','Feb 26','Mar 26','Apr 26','May 26','Jun 26','Jul 26','Aug 26','Sep 26','Oct 26','Nov 26','Dec 26','Jan 27','Feb 27','Mar 27','Apr 27','May 27','Jun 27'];
export const QUARTERS = ['Q1 26','Q2 26','Q3 26','Q4 26','Q1 27','Q2 27'];

/** Apr 26 is index 3 — anything at or before is Actual, after is Forecast */
export const ACTUAL_THROUGH = 3;

export const VENDORS: Vendor[] = [
  { name: 'AWS',              cat: 'Cloud',        gl: '6210', owner: 'Eng',   method: 'Usage-based',    baseline: 42000, growth: 0.04,  variance: 'over' },
  { name: 'Figma',            cat: 'SaaS',         gl: '6110', owner: 'Design',method: 'Seat-based',     baseline: 1800,  growth: 0.02,  variance: 'good' },
  { name: 'Datadog',          cat: 'Observability', gl: '6220', owner: 'Eng',   method: 'Usage-based',    baseline: 8500,  growth: 0.06,  variance: 'over' },
  { name: 'Gusto',            cat: 'Payroll',       gl: '5410', owner: 'Ops',   method: 'Contract',       baseline: 2400,  growth: 0.00,  variance: 'flat' },
  { name: 'HubSpot',          cat: 'SaaS',         gl: '6110', owner: 'GTM',   method: 'Contract',       baseline: 3200,  growth: 0.01,  variance: 'flat' },
  { name: 'Slack',            cat: 'SaaS',         gl: '6110', owner: 'Ops',   method: 'Seat-based',     baseline: 2100,  growth: 0.015, variance: 'flat' },
  { name: 'GitHub',           cat: 'SaaS',         gl: '6110', owner: 'Eng',   method: 'Seat-based',     baseline: 1900,  growth: 0.02,  variance: 'good' },
  { name: 'Google Workspace', cat: 'SaaS',         gl: '6110', owner: 'Ops',   method: 'Seat-based',     baseline: 2600,  growth: 0.01,  variance: 'flat' },
  { name: 'Snowflake',        cat: 'Data',         gl: '6230', owner: 'Data',  method: 'Usage-based',    baseline: 6200,  growth: 0.08,  variance: 'over' },
  { name: 'Linear',           cat: 'SaaS',         gl: '6110', owner: 'Eng',   method: 'Seat-based',     baseline: 800,   growth: 0.03,  variance: 'flat' },
  { name: 'Notion',           cat: 'SaaS',         gl: '6110', owner: 'Ops',   method: 'Seat-based',     baseline: 650,   growth: 0.02,  variance: 'flat' },
  { name: 'Zoom',             cat: 'SaaS',         gl: '6110', owner: 'Ops',   method: 'Seat-based',     baseline: 900,   growth: 0.00,  variance: 'good' },
  { name: '1Password',        cat: 'Security',     gl: '6310', owner: 'Ops',   method: 'Seat-based',     baseline: 420,   growth: 0.01,  variance: 'flat' },
  { name: 'Stripe fees',      cat: 'Pmt proc.',    gl: '5210', owner: 'Fin',   method: 'Revenue-linked', baseline: 9800,  growth: 0.05,  variance: 'flat' },
  { name: 'WeWork',           cat: 'Facilities',   gl: '5120', owner: 'Ops',   method: 'Contract',       baseline: 14000, growth: 0.00,  variance: 'flat' },
  { name: 'Rippling',         cat: 'HR',           gl: '5420', owner: 'Ops',   method: 'Seat-based',     baseline: 1100,  growth: 0.015, variance: 'flat' },
  { name: 'Sentry',           cat: 'Observability', gl: '6220', owner: 'Eng',   method: 'Usage-based',    baseline: 600,   growth: 0.02,  variance: 'flat' },
  { name: 'Mixpanel',         cat: 'Analytics',    gl: '6240', owner: 'Prod',  method: 'Contract',       baseline: 2200,  growth: 0.00,  variance: 'good' },
  { name: 'Intercom',         cat: 'SaaS',         gl: '6110', owner: 'GTM',   method: 'Contract',       baseline: 1800,  growth: 0.02,  variance: 'flat' },
  { name: 'LinkedIn Ads',     cat: 'Marketing',    gl: '5310', owner: 'GTM',   method: 'Budget cap',     baseline: 5500,  growth: 0.10,  variance: 'over' },
  { name: 'Google Ads',       cat: 'Marketing',    gl: '5310', owner: 'GTM',   method: 'Budget cap',     baseline: 7200,  growth: 0.08,  variance: 'over' },
  { name: 'Contentful',       cat: 'SaaS',         gl: '6110', owner: 'Prod',  method: 'Contract',       baseline: 1400,  growth: 0.00,  variance: 'flat' },
  { name: 'Cloudflare',       cat: 'Infra',        gl: '6210', owner: 'Eng',   method: 'Contract',       baseline: 900,   growth: 0.01,  variance: 'flat' },
  { name: 'Carta',            cat: 'Legal/Fin',    gl: '5220', owner: 'Fin',   method: 'Contract',       baseline: 1600,  growth: 0.00,  variance: 'flat' },
  { name: 'Ironclad',         cat: 'Legal/Fin',    gl: '5220', owner: 'Legal', method: 'Contract',       baseline: 1350,  growth: 0.00,  variance: 'flat' },
];

export function forecastFor(v: Vendor, months = 18): MonthPoint[] {
  const out: MonthPoint[] = [];
  let cur = v.baseline;
  for (let i = 0; i < months; i++) {
    const isActual = i <= ACTUAL_THROUGH;
    const noise = isActual ? (Math.sin(i * 1.7 + v.baseline) * 0.08) : 0;
    const val = cur * (1 + noise);
    out.push({ value: Math.round(val), isActual, budget: Math.round(cur) });
    cur = cur * (1 + v.growth);
  }
  return out;
}

export const VENDOR_SERIES: VendorSeries[] = VENDORS.map(v => ({ ...v, series: forecastFor(v) }));

export const CATEGORIES = Array.from(new Set(VENDORS.map(v => v.cat)));

export function fmtMoney(n: number | null | undefined, { compact = false } = {}): string {
  if (n == null) return '—';
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
    if (Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(1) + 'k';
    return '$' + n;
  }
  return '$' + n.toLocaleString('en-US');
}

export function fmtPct(n: number): string {
  const s = (n * 100).toFixed(1);
  return (n >= 0 ? '+' : '') + s + '%';
}
