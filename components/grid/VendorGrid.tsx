'use client';

import { useState } from 'react';
import { VENDOR_SERIES, MONTH_LABELS, QUARTERS, ACTUAL_THROUGH, fmtMoney } from '@/lib/data';
import { useOverrides, useTweaks } from '@/lib/contexts';
import type { VendorSeries } from '@/lib/types';
import EditableCell from './EditableCell';
import ForecastPopover from './ForecastPopover';
import VarianceBadge from '@/components/shared/VarianceBadge';

type PopoverState = { vendorName: string; top: number; left: number } | null;

function thStyle(w: number, frozen = false, left = 0): React.CSSProperties {
  return {
    position: 'sticky',
    top: 0,
    zIndex: frozen ? 3 : 2,
    left: frozen ? left : undefined,
    width: w, minWidth: w, maxWidth: w,
    padding: '6px 8px',
    textAlign: 'right',
    borderBottom: '1.5px solid var(--line)',
    borderRight: '1px solid var(--line-softer)',
    background: '#fcfbf7',
    fontWeight: 600,
    color: 'var(--ink-2)',
    fontFamily: 'var(--font-architects-daughter), cursive',
    fontSize: 11,
  };
}

function frozenTdStyle(left: number, bg = '#fff'): React.CSSProperties {
  return {
    position: 'sticky',
    left,
    zIndex: 1,
    padding: '4px 8px',
    textAlign: 'left',
    borderBottom: '1px solid var(--line-softer)',
    borderRight: '1px solid var(--line-softer)',
    background: bg,
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 12,
  };
}

function valueTdStyle(isCurrent: boolean, isActual: boolean): React.CSSProperties {
  return {
    padding: '4px 8px',
    textAlign: 'right',
    borderBottom: '1px solid var(--line-softer)',
    borderRight: '1px solid var(--line-softer)',
    background: isCurrent ? '#fff4b8' : undefined,
    color: isActual ? 'var(--ink)' : 'var(--ink-2)',
    fontWeight: isActual ? 600 : 400,
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 12,
  };
}

function getQuarterlySeries(v: VendorSeries, vOverrides: Record<number, number> | undefined) {
  return Array.from({ length: 6 }, (_, q) => {
    const chunk = v.series.slice(q * 3, q * 3 + 3);
    const value = chunk.reduce((sum, s, ci) => sum + (vOverrides?.[q * 3 + ci] ?? s.value), 0);
    return {
      value,
      isActual: chunk.every(s => s.isActual),
    };
  });
}

interface Props {
  vendors: VendorSeries[];
  sort: { col: 'name' | 'gl' | 'method'; dir: 'asc' | 'desc' } | null;
  onSort: (col: 'name' | 'gl' | 'method') => void;
}

export default function VendorGrid({ vendors, sort, onSort }: Props) {
  const { overrides, setOverride } = useOverrides();
  const { tweaks } = useTweaks();
  const quarterly = tweaks.timeUnit === 'quarterly';
  const rowH = tweaks.density === 'compact' ? 22 : tweaks.density === 'comfy' ? 34 : 28;
  const cols = quarterly ? QUARTERS : MONTH_LABELS.slice(0, 14);

  const [popover, setPopover] = useState<PopoverState>(null);

  const overrideCount = Object.values(overrides).reduce(
    (sum, m) => sum + Object.keys(m).length, 0
  );

  const fy26Total = VENDOR_SERIES.reduce((sum, v) =>
    sum + v.series.slice(0, 12).reduce((s, ms, i) =>
      s + (overrides[v.name]?.[i] ?? ms.value), 0), 0);

  const colTotals = cols.map((_, ci) =>
    VENDOR_SERIES.reduce((sum, v) => {
      if (!quarterly) return sum + (overrides[v.name]?.[ci] ?? v.series[ci].value);
      return sum + v.series.slice(ci * 3, ci * 3 + 3).reduce(
        (s, ms, di) => s + (overrides[v.name]?.[ci * 3 + di] ?? ms.value), 0
      );
    }, 0)
  );

  const sortIcon = (col: 'name' | 'gl' | 'method') => {
    const active = sort?.col === col;
    return (
      <span style={{ marginLeft: 3, color: active ? 'var(--ink)' : 'var(--ink-4)' }}>
        {active ? (sort!.dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Scrollable grid area */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }} className="hide-scroll">
        <table className="num" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
          <thead>
            <tr>
              <th
                style={{ ...thStyle(260, true), textAlign: 'left', cursor: 'pointer' }}
                onClick={() => onSort('name')}
              >
                Vendor{sortIcon('name')}
              </th>
              <th
                style={{ ...thStyle(88, true, 260), cursor: 'pointer', textAlign: 'left' }}
                onClick={() => onSort('gl')}
              >
                GL{sortIcon('gl')}
              </th>
              <th
                style={{ ...thStyle(82, true, 348), cursor: 'pointer', textAlign: 'left' }}
                onClick={() => onSort('method')}
              >
                Method{sortIcon('method')}
              </th>
              <th style={thStyle(70)}>FY26</th>
              {cols.map((c, i) => {
                const isActual = quarterly ? i === 0 : i <= ACTUAL_THROUGH;
                const isCur = quarterly ? i === 1 : i === ACTUAL_THROUGH;
                return (
                  <th key={c} style={{
                    ...thStyle(62),
                    background: isCur ? '#fff4b8' : '#fcfbf7',
                    color: isActual ? 'var(--ink)' : 'var(--ink-3)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{isActual ? 'ACTUAL' : 'FCST'}</div>
                    <div>{c}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const vOverrides = overrides[v.name];
              const fy26 = v.series.slice(0, 12).reduce(
                (sum, s, i) => sum + (vOverrides?.[i] ?? s.value), 0
              );
              const quarterlySeries = quarterly ? getQuarterlySeries(v, vOverrides) : null;

              return (
                <tr key={v.name} style={{ height: rowH }}>
                  {/* Vendor name — frozen left:0 */}
                  <td style={{ ...frozenTdStyle(0), fontFamily: undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--ink-4)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 13 }}>
                        {v.name}
                      </span>
                      {tweaks.varianceColor && (
                        <span style={{ marginLeft: 'auto' }}>
                          <VarianceBadge variance={v.variance} />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* GL — frozen left:260 */}
                  <td style={{ ...frozenTdStyle(260), color: 'var(--ink-3)' }}>{v.gl}</td>

                  {/* Method — frozen left:348, opens popover on click */}
                  <td
                    style={{
                      ...frozenTdStyle(348),
                      color: 'var(--ink-3)',
                      fontFamily: 'var(--font-architects-daughter), cursive',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopover(prev =>
                        prev?.vendorName === v.name
                          ? null
                          : { vendorName: v.name, top: rect.bottom + 2, left: rect.left }
                      );
                    }}
                  >
                    {v.method}
                  </td>

                  {/* FY26 annual total */}
                  <td style={{ ...valueTdStyle(false, false), fontWeight: 600 }}>
                    {fmtMoney(fy26, { compact: true })}
                  </td>

                  {/* Data cells: read-only quarters or editable monthly cells */}
                  {quarterly && quarterlySeries
                    ? quarterlySeries.map((s, i) => {
                        const isCur = i === 1;
                        const tintClass = !s.isActual && tweaks.varianceColor
                          ? (v.variance === 'over' ? 'cell-over' : v.variance === 'good' ? 'cell-under' : '')
                          : '';
                        return (
                          <td key={i} className={tintClass || ''} style={valueTdStyle(isCur, s.isActual)}>
                            {fmtMoney(s.value, { compact: true })}
                          </td>
                        );
                      })
                    : v.series.slice(0, 14).map((s, i) => (
                        <EditableCell
                          key={i}
                          value={vOverrides?.[i] ?? s.value}
                          isOverride={vOverrides?.[i] !== undefined}
                          isActual={s.isActual}
                          isCurrent={i === ACTUAL_THROUGH}
                          variance={v.variance}
                          varianceColor={tweaks.varianceColor}
                          onSave={(val) => setOverride(v.name, i, val)}
                        />
                      ))
                  }
                </tr>
              );
            })}

            {/* Totals row */}
            <tr style={{ background: '#f3f0e3' }}>
              <td style={{ ...frozenTdStyle(0, '#f3f0e3'), fontWeight: 700, borderTop: '2px solid var(--line)' }}>
                TOTAL
              </td>
              <td style={{ ...frozenTdStyle(260, '#f3f0e3'), borderTop: '2px solid var(--line)' }} />
              <td style={{ ...frozenTdStyle(348, '#f3f0e3'), borderTop: '2px solid var(--line)' }} />
              <td style={{ ...valueTdStyle(false, false), background: '#f3f0e3', fontWeight: 700, borderTop: '2px solid var(--line)' }}>
                {fmtMoney(fy26Total, { compact: true })}
              </td>
              {colTotals.map((total, i) => {
                const isCur = quarterly ? i === 1 : i === ACTUAL_THROUGH;
                return (
                  <td key={i} style={{
                    ...valueTdStyle(isCur, false),
                    background: isCur ? '#fff4b8' : '#f3f0e3',
                    fontWeight: 700,
                    borderTop: '2px solid var(--line)',
                  }}>
                    {fmtMoney(total, { compact: true })}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        {/* Post-it annotations */}
        {tweaks.showAnnotations && (
          <>
            <div className="note" style={{ top: 16, right: 20, width: 170, transform: 'rotate(2deg)' }}>
              yellow col = current<br />month (Apr &apos;26)
            </div>
            <div className="note" style={{ top: 230, right: 120, width: 150, transform: 'rotate(-3deg)' }}>
              tint = variance<br />vs prior budget
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        borderTop: '1px solid var(--line-softer)',
        padding: '6px 18px',
        fontSize: 12,
        color: 'var(--ink-3)',
        display: 'flex',
        gap: 18,
        flexShrink: 0,
        background: '#fcfbf7',
      }}>
        <span>⎇ {vendors.length < VENDOR_SERIES.length ? `${vendors.length} of ${VENDOR_SERIES.length}` : VENDOR_SERIES.length} vendors</span>
        <span>✎ edits since save: {overrideCount}</span>
        <span style={{ marginLeft: 'auto' }}>Last synced from NetSuite · 2m ago</span>
      </div>

      {/* Forecast method popover — rendered fixed to escape table overflow clipping */}
      {popover && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setPopover(null)}
          />
          <div style={{ position: 'fixed', top: popover.top, left: popover.left, zIndex: 100 }}>
            <ForecastPopover
              vendorMethod={VENDOR_SERIES.find(v => v.name === popover.vendorName)!.method}
              growth={VENDOR_SERIES.find(v => v.name === popover.vendorName)!.growth}
              onClose={() => setPopover(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
