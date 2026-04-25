/* Money formatting for revenue scale (B / M / k). */

export function fmtMoneyScaled(n: number | null | undefined, opts: { precision?: number } = {}): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const precision = opts.precision ?? 1;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(precision)}B`;
  if (abs >= 1_000_000)     return `${sign}$${(abs / 1_000_000).toFixed(precision)}M`;
  if (abs >= 1_000)         return `${sign}$${(abs / 1_000).toFixed(precision)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function fmtPctScaled(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(decimals)}%`;
}

export function fmtPlainPct(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
}

export function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString('en-US');
}

export function fmtNumberX(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(decimals)}×`;
}
