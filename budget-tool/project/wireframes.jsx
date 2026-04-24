// The 5 wireframe directions.
// Each takes `t` (tweaks) from window.__tweaks via props.

// ─────────────────────────────────────────────────────────────
// V1 — The Grid (Pigment-style)
// ─────────────────────────────────────────────────────────────
function V1Grid({ t, showPopover = false, headless = false }) {
  if (headless) return <V1Body t={t} showPopover={showPopover} />;
  return (
    <WFShell title="Vendor Opex · FY26 + FY27 H1" subtitle="25 vendors · $1.42M annualized" t={t}
      actions={<>
        <div className="btn">⤓ Export</div>
        <div className="btn">⚙ Columns</div>
        <div className="btn btn-primary">+ Vendor</div>
      </>}>
      <WFSidebar active="Vendors" />
      <V1Body t={t} showPopover={showPopover} withTabs />
    </WFShell>
  );
}

function V1Body({ t, showPopover = false, withTabs = false }) {
  const quarterly = t.timeUnit === 'quarterly';
  const cols = quarterly ? QUARTERS : MONTH_LABELS.slice(0, 14);
  const rowH = t.density === 'compact' ? 22 : t.density === 'comfy' ? 34 : 28;
  const visibleVendors = VENDOR_SERIES.slice(0, t.density === 'compact' ? 18 : 14);

  const seriesFor = (v) => {
    if (!quarterly) return v.series.slice(0, 14);
    const q = [];
    for (let i = 0; i < 6; i++) {
      const chunk = v.series.slice(i * 3, i * 3 + 3);
      const sum = chunk.reduce((a, b) => a + b.value, 0);
      q.push({ value: sum, isActual: chunk.every(c => c.isActual), budget: chunk.reduce((a, b) => a + b.budget, 0) });
    }
    return q;
  };

  return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {withTabs && <TabsStrip tabs={['Grid', 'Cards', 'Timeline', 'Variance']} active="Grid" /> }
        <FilterBar chips={[
          { label: 'Category: all', active: false },
          { label: 'Owner: all', active: false },
          { label: 'Method: any', active: false },
          { label: 'Status: working', active: true },
        ]} right={<>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>View</span>
          <div className="btn" style={{ fontSize: 12 }}>Monthly ▾</div>
        </>} />

        {/* The grid */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }} className="hide-scroll">
          <table className="num" style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 12, width: '100%' }}>
            <thead>
              <tr style={{ background: '#fcfbf7' }}>
                <th style={th(260, true)}>Vendor</th>
                <th style={th(88, true, 260)}>GL</th>
                <th style={th(82, true, 348)}>Method</th>
                <th style={th(70)}>FY26</th>
                {cols.map((c, i) => {
                  const isActual = quarterly ? i === 0 : i <= ACTUAL_THROUGH;
                  const isCur = quarterly ? i === 1 : i === 3;
                  return (
                    <th key={c} style={{ ...th(62), background: isCur ? '#fff4b8' : '#fcfbf7', color: isActual ? 'var(--ink)' : 'var(--ink-3)' }}>
                      <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{isActual ? 'ACTUAL' : 'FCST'}</div>
                      <div>{c}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleVendors.map((v, ri) => {
                const series = seriesFor(v);
                const fy26 = v.series.slice(0, 12).reduce((a, b) => a + b.value, 0);
                return (
                  <tr key={v.name} style={{ height: rowH }}>
                    <td style={td(true)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--ink-4)' }} />
                        <span style={{ fontFamily: "'Architects Daughter', cursive", fontSize: 13 }}>{v.name}</span>
                        <span style={{ marginLeft: 'auto' }}>{t.varianceColor && <VarianceBadge variance={v.variance} />}</span>
                      </div>
                    </td>
                    <td style={{ ...td(true, 260), color: 'var(--ink-3)' }}>{v.gl}</td>
                    <td style={{ ...td(true, 348), color: 'var(--ink-3)', fontFamily: "'Architects Daughter', cursive" }}>{v.method}</td>
                    <td style={{ ...td(), fontWeight: 600 }}>{fmtMoney(fy26, { compact: true })}</td>
                    {series.map((s, i) => {
                      const isCur = quarterly ? i === 1 : i === 3;
                      const isOver = !s.isActual && v.variance === 'over';
                      const isUnder = !s.isActual && v.variance === 'good';
                      const tint = t.varianceColor && (isOver ? 'cell-over' : isUnder ? 'cell-under' : '');
                      return (
                        <td key={i} className={tint || ''} style={{
                          ...td(),
                          background: isCur ? '#fff4b8' : undefined,
                          color: s.isActual ? 'var(--ink)' : 'var(--ink-2)',
                          fontWeight: s.isActual ? 600 : 400,
                          position: 'relative',
                        }}>
                          {fmtMoney(s.value, { compact: true })}
                          {showPopover && ri === 2 && i === 5 && <GridPopover />}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr style={{ background: '#f3f0e3', borderTop: '2px solid var(--line)' }}>
                <td style={{ ...td(true), fontWeight: 700 }}>TOTAL</td>
                <td style={td(true, 260)}></td>
                <td style={td(true, 348)}></td>
                <td style={{ ...td(), fontWeight: 700 }}>$1.42M</td>
                {cols.map((c, i) => (
                  <td key={i} style={{ ...td(), fontWeight: 700 }}>
                    {fmtMoney(Math.round(118000 + i * 2400 + Math.sin(i) * 5000), { compact: true })}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <Annot t={t} style={{ top: 16, right: 20, width: 170, transform: 'rotate(2deg)' }}>
            yellow col = current<br/>month (Apr '26)
          </Annot>
          <Annot t={t} style={{ top: 230, right: 120, width: 150, transform: 'rotate(-3deg)' }}>
            tint = variance<br/>vs prior budget
          </Annot>
        </div>

        <div style={{ borderTop: '1px solid var(--line-softer)', padding: '6px 18px', fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 18 }}>
          <span>⎇ 25 vendors</span>
          <span>✎ edits since save: 3</span>
          <span style={{ marginLeft: 'auto' }}>Last synced from NetSuite · 2m ago</span>
        </div>
      </div>
  );
}

function GridPopover() {
  return (
    <div className="sketch-box" style={{
      position: 'absolute', top: '100%', left: -6, zIndex: 20, width: 240, padding: 10, background: '#fff',
      fontFamily: "'Architects Daughter', cursive", fontSize: 12, textAlign: 'left',
    }}>
      <div className="hand" style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Forecast method</div>
      {['Flat run-rate', 'Growth % · baseline', 'Contract schedule', 'Driver: seats × price', 'Manual entry'].map((m, i) => (
        <div key={m} style={{
          padding: '5px 8px', marginBottom: 2,
          background: i === 1 ? '#fff4b8' : 'transparent',
          border: i === 1 ? '1.2px solid var(--line)' : '1.2px solid transparent',
        }}>
          {i === 1 ? '● ' : '○ '}{m}
        </div>
      ))}
      <div style={{ borderTop: '1px dashed var(--line-soft)', margin: '8px 0 6px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>Growth</span>
        <div className="sketch-box" style={{ padding: '1px 6px', fontSize: 12 }}>+4.0%</div>
        <span>/ month</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 6 }}>
        <div className="btn" style={{ fontSize: 11, padding: '2px 8px' }}>Cancel</div>
        <div className="btn btn-primary" style={{ fontSize: 11, padding: '2px 8px' }}>Apply to row</div>
      </div>
    </div>
  );
}

const th = (w, frozen = false, left = 0) => ({
  position: 'sticky', top: 0, zIndex: frozen ? 3 : 2,
  left: frozen ? left : undefined,
  width: w, minWidth: w, maxWidth: w,
  padding: '6px 8px', textAlign: 'right',
  borderBottom: '1.5px solid var(--line)', borderRight: '1px solid var(--line-softer)',
  background: '#fcfbf7', fontWeight: 600, color: 'var(--ink-2)',
  fontFamily: "'Architects Daughter', cursive", fontSize: 11,
});
const td = (frozen = false, left = 0) => ({
  position: frozen ? 'sticky' : undefined, left: frozen ? left : undefined, zIndex: frozen ? 1 : undefined,
  padding: '4px 8px', textAlign: frozen ? 'left' : 'right',
  borderBottom: '1px solid var(--line-softer)', borderRight: '1px solid var(--line-softer)',
  background: frozen ? '#fff' : undefined,
  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
});

// ─────────────────────────────────────────────────────────────
// V2 — Split View (list left, detail right)
// ─────────────────────────────────────────────────────────────
function V2Split({ t, headless = false }) {
  const body = (
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
        {/* Vendor list */}
        <div style={{ width: 320, borderRight: '1.5px solid var(--line-softer)', display: 'flex', flexDirection: 'column', background: '#fff' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-softer)' }}>
            <div className="sketch-box" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--ink-4)' }}>🔍 Search vendors…</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {['All 25', 'Over 5', 'Renew 3'].map((c, i) => (
                <div key={c} style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--line-soft)', background: i === 0 ? '#fff4b8' : '#fff', fontWeight: i === 0 ? 700 : 400 }}>{c}</div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }} className="hide-scroll">
            {VENDOR_SERIES.slice(0, 16).map((v, i) => (
              <div key={v.name} style={{
                padding: '10px 14px', borderBottom: '1px solid var(--line-softer)',
                background: i === 2 ? '#fff4b8' : 'transparent',
                borderLeft: i === 2 ? '3px solid var(--ink)' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'Architects Daughter', cursive", fontSize: 14, fontWeight: i === 2 ? 700 : 500 }}>{v.name}</span>
                  <span style={{ marginLeft: 'auto' }}>{t.varianceColor && <VarianceBadge variance={v.variance} />}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.cat} · GL {v.gl}</span>
                  <span style={{ marginLeft: 'auto' }} className="num">{fmtMoney(v.series[3].value, { compact: true })}/mo</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Sparkline series={v.series.slice(0, 14)} width={280} height={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor detail */}
        <V2Detail t={t} vendor={VENDOR_SERIES[2]} />
      </div>
  );
  if (headless) return body;
  return (
    <WFShell title="Vendors" subtitle="$1.42M annualized · 25 active" t={t}
      actions={<><div className="btn">⤓ Export</div><div className="btn btn-primary">+ Vendor</div></>}>
      <WFSidebar active="Vendors" />
      {body}
    </WFShell>
  );
}

function V2Detail({ t, vendor: v }) {
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '16px 20px', background: 'var(--paper)' }} className="hide-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div className="hand" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{v.name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{v.cat} · GL {v.gl} · Owner: {v.owner} · Method: <u>{v.method}</u></div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div className="btn">Add note</div>
          <div className="btn">Renew contract</div>
          <div className="btn btn-primary">Reforecast</div>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
        {[
          ['FY26 total', fmtMoney(v.series.slice(0, 12).reduce((a, b) => a + b.value, 0), { compact: true }), '+5.2% YoY'],
          ['YTD actuals', fmtMoney(v.series.slice(0, 4).reduce((a, b) => a + b.value, 0), { compact: true }), 'Apr + $1.2k'],
          ['Variance to budget', '+$6.3k', 'over by 7.4%'],
          ['Contract end', 'Nov 12 ’26', '6 months out'],
        ].map(([l, n, s]) => (
          <div key={l} className="sketch-box" style={{ padding: '10px 12px', background: '#fff' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Forecast chart */}
      <div className="sketch-box" style={{ marginTop: 12, padding: '12px 14px', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <div className="hand" style={{ fontSize: 18, fontWeight: 700 }}>Forecast · next 18 months</div>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>— actual  - - forecast</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['Flat', '+2%/mo', '+4%/mo', 'Manual'].map((m, i) => (
              <div key={m} style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--line-soft)', background: i === 2 ? '#fff4b8' : '#fff', fontWeight: i === 2 ? 700 : 400 }}>{m}</div>
            ))}
          </div>
        </div>
        <Sparkline2 series={v.series} width={760} height={120} />
        <Annot t={t} style={{ top: 44, right: 36, width: 160, transform: 'rotate(3deg)' }}>
          forecast = baseline ×<br/>(1 + 4%)^n · edit per-cell
        </Annot>
      </div>

      {/* Monthly edit strip */}
      <div className="sketch-box" style={{ marginTop: 12, background: '#fff', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--line-softer)', fontSize: 13, fontWeight: 700 }}>Monthly override</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)' }}>
          {MONTH_LABELS.slice(0, 14).map((m, i) => {
            const s = v.series[i];
            const isCur = i === 3;
            return (
              <div key={m} style={{
                padding: '8px 4px', borderRight: '1px solid var(--line-softer)', borderBottom: '1px solid var(--line-softer)',
                background: isCur ? '#fff4b8' : s.isActual ? '#fcfbf7' : '#fff',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{s.isActual ? 'ACT' : 'FCST'}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m}</div>
                <div className="num" style={{ fontSize: 13, fontWeight: s.isActual ? 700 : 500, marginTop: 4 }}>{fmtMoney(s.value, { compact: true })}</div>
                {!s.isActual && <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>{fmtPct((s.value - v.series[3].value) / v.series[3].value)}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity */}
      <div className="sketch-box" style={{ marginTop: 12, background: '#fff', padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Activity</div>
        {[
          ['JL', 'Jamie L.', '2h ago', 'Pushed +4%/mo growth through Dec — usage trending up.'],
          ['RP', 'Riya P.',  'yesterday', 'Contract renews Nov; flagged for renegotiation.'],
          ['—',  'System',   '3d ago', 'Auto-synced Mar actual: $8,742 (+$240 vs fcst).'],
        ].map(([a, who, when, msg]) => (
          <div key={when} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: '1px dashed var(--line-softer)', fontSize: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, border: '1.2px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 10 }}>{a}</div>
            <div style={{ flex: 1 }}>
              <div><b>{who}</b> · <span style={{ color: 'var(--ink-3)' }}>{when}</span></div>
              <div style={{ color: 'var(--ink-2)' }}>{msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// V3 — Forecast Canvas (timeline of vendor cards, scenario ribbon)
// ─────────────────────────────────────────────────────────────
function V3Canvas({ t, headless = false }) {
  const body = (
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', background: 'var(--paper)' }} className="hide-scroll">
        {/* Scenario ribbon */}
        <div style={{ padding: '12px 18px', display: 'flex', gap: 10, borderBottom: '1.5px solid var(--line)', background: '#fcfbf7' }}>
          {[
            { n: 'Base', t: '$1.42M', active: true, note: 'Current plan' },
            { n: 'Belt-tight', t: '$1.28M', active: false, note: '-10% headcount' },
            { n: 'Growth', t: '$1.61M', active: false, note: '+Data team' },
          ].map(sc => (
            <div key={sc.n} className="sketch-box" style={{
              flex: 1, padding: '10px 14px', background: sc.active ? '#fff4b8' : '#fff',
              boxShadow: sc.active ? '2px 2px 0 var(--line)' : '1px 1px 0 var(--line)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div className="hand" style={{ fontSize: 18, fontWeight: 700 }}>{sc.n}</div>
                <div style={{ marginLeft: 'auto' }} className="num">{sc.t}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sc.note}</div>
              <div style={{ marginTop: 6 }}>
                <Sparkline series={VENDOR_SERIES[0].series.slice(0, 14)} width={280} height={14} />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline header */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: '1px solid var(--line-softer)', background: '#fcfbf7' }}>
          <div style={{ padding: '6px 14px', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vendor · method</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', borderLeft: '1px solid var(--line-softer)' }}>
            {MONTH_LABELS.map((m, i) => (
              <div key={m} style={{
                padding: '6px 2px', fontSize: 10, textAlign: 'center', color: i <= ACTUAL_THROUGH ? 'var(--ink)' : 'var(--ink-3)',
                borderRight: '1px solid var(--line-softer)',
                background: i === 3 ? '#fff4b8' : 'transparent',
              }}>{m.split(' ')[0]}<br/><span style={{ color: 'var(--ink-4)' }}>{m.split(' ')[1]}</span></div>
            ))}
          </div>
        </div>

        {/* Category groups of cards */}
        {['Cloud', 'SaaS', 'Marketing', 'Facilities'].map(cat => {
          const rows = VENDOR_SERIES.filter(v => v.cat === cat || (cat === 'SaaS' && v.cat === 'SaaS')).slice(0, 5);
          if (rows.length === 0) return null;
          return (
            <div key={cat}>
              <div style={{ padding: '8px 14px', fontSize: 11, background: '#f3f0e3', borderBottom: '1px solid var(--line-softer)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                {cat} · {rows.length} vendors
              </div>
              {rows.map(v => (
                <div key={v.name} style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: '1px dashed var(--line-softer)', alignItems: 'center' }}>
                  <div style={{ padding: '8px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.method}</div>
                  </div>
                  <div style={{ position: 'relative', height: 46, borderLeft: '1px solid var(--line-softer)' }}>
                    {/* card spanning months */}
                    <div className="sketch-box" style={{
                      position: 'absolute', top: 6, bottom: 6, left: '0%', right: '0%',
                      display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', padding: 0, background: '#fff',
                    }}>
                      {v.series.map((s, i) => (
                        <div key={i} className={t.varianceColor && !s.isActual && v.variance === 'over' ? 'cell-over' : t.varianceColor && !s.isActual && v.variance === 'good' ? 'cell-under' : ''} style={{
                          borderRight: i < 17 ? '1px dashed var(--line-softer)' : 'none',
                          padding: '2px 3px', textAlign: 'center',
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                          color: s.isActual ? 'var(--ink)' : 'var(--ink-3)',
                          fontWeight: s.isActual ? 700 : 400,
                          background: i === 3 ? '#fff4b8' : undefined,
                        }}>{fmtMoney(s.value, { compact: true })}</div>
                      ))}
                    </div>
                    {v.name === 'AWS' && t.showAnnotations && (
                      <div className="note" style={{ position: 'absolute', top: -8, right: 10, transform: 'rotate(3deg)', fontSize: 13 }}>
                        ↓ usage-based<br/>spike in Q3
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
  );
  if (headless) return body;
  return (
    <WFShell title="Forecast Canvas" subtitle="Drag cards between scenarios · $1.42M base" t={t}
      actions={<><div className="btn">+ Scenario</div><div className="btn btn-primary">Commit plan</div></>}>
      <WFSidebar active="Scenarios" />
      {body}
    </WFShell>
  );
}

// ─────────────────────────────────────────────────────────────
// V4 — Variance-First (dashboard tiles up top, grid secondary)
// ─────────────────────────────────────────────────────────────
function V4Variance({ t, headless = false }) {
  const over = VENDOR_SERIES.filter(v => v.variance === 'over');
  const under = VENDOR_SERIES.filter(v => v.variance === 'good');

  const body = (
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '16px 18px', background: 'var(--paper)' }} className="hide-scroll">
        {/* Big KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            ['MTD Actual', '$108.4k', '+$11.4k over plan', 'warn'],
            ['YTD Actual', '$412.7k', '+$18.9k over plan', 'warn'],
            ['FY26 Forecast', '$1.42M', '+2.1% vs budget', 'warn'],
            ['Runway impact', '-$62k', 'vs Jan plan', 'neutral'],
          ].map(([l, n, sub, tone]) => (
            <div key={l} className="sketch-box" style={{ padding: '14px 16px', background: '#fff' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>{l}</div>
              <div className="num" style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{n}</div>
              <div style={{ fontSize: 12, marginTop: 2, color: tone === 'warn' && t.varianceColor ? 'var(--accent-warn)' : 'var(--ink-3)' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Two columns: over / under */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <VarianceList t={t} title="Over plan · biggest offenders" rows={over} tone="warn" />
          <VarianceList t={t} title="Under plan · savings"         rows={under} tone="good" />
        </div>

        {/* Category waterfall / grid */}
        <div className="sketch-box" style={{ marginTop: 14, background: '#fff', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div className="hand" style={{ fontSize: 18, fontWeight: 700 }}>By category · FY26 forecast</div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>click a bar to drill in</div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['Cloud', 504, 528, 'over'], ['SaaS', 168, 170, 'flat'], ['Marketing', 152, 180, 'over'], ['Facilities', 168, 168, 'flat'], ['Data', 74, 80, 'over'], ['HR/Payroll', 42, 42, 'flat']].map(([c, bud, act, tone]) => {
              const pct = act / 540 * 100;
              return (
                <div key={c} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <div>{c}</div>
                  <div style={{ height: 18, background: '#f3f0e3', position: 'relative', border: '1px solid var(--line-softer)' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${pct * 0.96}%`, background: tone === 'over' && t.varianceColor ? 'color-mix(in oklch, var(--accent-warn) 40%, white)' : '#e4e1d4' }} />
                    <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${(bud / 540) * 96}%`, width: 2, background: 'var(--ink)' }} title="budget line" />
                  </div>
                  <div className="num" style={{ textAlign: 'right' }}>${act}k <span style={{ color: 'var(--ink-4)' }}>/ ${bud}k</span></div>
                </div>
              );
            })}
          </div>
          <Annot t={t} style={{ top: 70, right: 30, width: 130, transform: 'rotate(2deg)' }}>
            vertical line =<br/>plan
          </Annot>
        </div>
      </div>
  );
  if (headless) return body;
  return (
    <WFShell title="FY26 Variance" subtitle="Apr ’26 close · $11.4k over plan month-to-date" t={t}
      actions={<><div className="btn">⤓ Board pack</div><div className="btn btn-primary">Reforecast</div></>}>
      <WFSidebar active="Overview" />
      {body}
    </WFShell>
  );
}

function VarianceList({ t, title, rows, tone }) {
  return (
    <div className="sketch-box" style={{ background: '#fff' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-softer)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center' }}>
        <span>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>{rows.length} vendors</span>
      </div>
      {rows.map(v => {
        const delta = Math.round(v.series[3].value * (tone === 'warn' ? 0.08 : -0.06));
        return (
          <div key={v.name} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 90px', padding: '8px 14px', borderBottom: '1px dashed var(--line-softer)', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{v.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.cat} · {v.owner}</div>
            </div>
            <Sparkline series={v.series.slice(0, 14)} width={70} height={16} highlightIdx={3} />
            <div className="num" style={{ textAlign: 'right' }}>{fmtMoney(v.series[3].value, { compact: true })}</div>
            <div style={{ textAlign: 'right' }}>
              <span className={`pill ${tone === 'warn' && t.varianceColor ? 'pill-warn' : tone === 'good' && t.varianceColor ? 'pill-good' : 'pill-neutral'}`}>
                {delta > 0 ? '+' : ''}{fmtMoney(delta, { compact: true })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// V5 — Row Expand (compact list, inline expansion)
// ─────────────────────────────────────────────────────────────
function V5RowExpand({ t }) {
  return (
    <WFShell title="Vendor Opex" subtitle="Tap a row to expand the forecast editor inline" t={t}
      actions={<><div className="btn">⚙ Columns</div><div className="btn btn-primary">+ Vendor</div></>}>
      <WFSidebar active="Vendors" />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <FilterBar chips={[
          { label: 'GL: 6110 SaaS', active: true },
          { label: 'Owner: all', active: false },
        ]} right={<span style={{ fontSize: 12, color: 'var(--ink-3)' }}>25 vendors · $1.42M</span>} />
        <div style={{ flex: 1, overflow: 'auto', background: '#fff' }} className="hide-scroll">
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '24px 1.3fr 1fr 0.8fr 0.8fr 100px 120px', padding: '8px 14px', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--line)', background: '#fcfbf7', position: 'sticky', top: 0, zIndex: 2 }}>
            <div></div><div>Vendor</div><div>GL · method</div><div>Owner</div><div>Contract end</div><div style={{ textAlign: 'right' }}>Monthly</div><div style={{ textAlign: 'right' }}>FY26</div>
          </div>
          {VENDOR_SERIES.slice(0, 12).map((v, i) => {
            const expanded = i === 1 || i === 4;
            return (
              <React.Fragment key={v.name}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '24px 1.3fr 1fr 0.8fr 0.8fr 100px 120px',
                  padding: '8px 14px', borderBottom: '1px solid var(--line-softer)',
                  background: expanded ? '#fffdf0' : 'transparent', alignItems: 'center',
                  fontSize: 13,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{expanded ? '▼' : '▸'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{v.name}</span>
                    {t.varianceColor && <VarianceBadge variance={v.variance} />}
                  </div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{v.gl} · {v.method}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{v.owner}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>Nov 12 ’26</div>
                  <div className="num" style={{ textAlign: 'right' }}>{fmtMoney(v.series[3].value, { compact: true })}</div>
                  <div className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(v.series.slice(0, 12).reduce((a, b) => a + b.value, 0), { compact: true })}</div>
                </div>
                {expanded && <V5ExpandedRow t={t} v={v} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </WFShell>
  );
}

function V5ExpandedRow({ t, v }) {
  return (
    <div style={{ padding: '12px 20px 18px 38px', borderBottom: '1px solid var(--line-softer)', background: '#fffdf0', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18 }}>
      {/* Method picker */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Forecast method</div>
        {['Flat run-rate', 'Growth %', 'Contract', 'Driver', 'Manual'].map(m => (
          <div key={m} style={{
            padding: '5px 10px', marginBottom: 3, fontSize: 13,
            background: m === 'Growth %' ? '#fff4b8' : '#fff',
            border: '1px solid ' + (m === 'Growth %' ? 'var(--line)' : 'var(--line-soft)'),
            fontWeight: m === 'Growth %' ? 700 : 400,
          }}>{m === 'Growth %' ? '●' : '○'} {m}</div>
        ))}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span>Rate</span>
          <div className="sketch-box" style={{ padding: '2px 8px', fontSize: 12 }}>+{(v.growth * 100).toFixed(1)}%</div>
          <span>/ month</span>
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span>Baseline</span>
          <div className="sketch-box" style={{ padding: '2px 8px', fontSize: 12 }}>{fmtMoney(v.baseline)}</div>
        </div>
      </div>

      {/* Month cells */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly values · click to override</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>overrides: 0</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', border: '1px solid var(--line-softer)' }}>
          {v.series.slice(0, 14).map((s, i) => {
            const isCur = i === 3;
            const tint = t.varianceColor && !s.isActual && v.variance === 'over' ? 'cell-over' : '';
            return (
              <div key={i} className={tint} style={{
                padding: '6px 4px', borderRight: '1px solid var(--line-softer)',
                background: isCur ? '#fff4b8' : s.isActual ? '#fcfbf7' : '#fff',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{s.isActual ? 'ACT' : 'FCST'}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{MONTH_LABELS[i].split(' ')[0]}</div>
                <div className="num" style={{ fontSize: 12, fontWeight: s.isActual ? 700 : 500, marginTop: 2 }}>
                  {fmtMoney(s.value, { compact: true })}
                </div>
              </div>
            );
          })}
        </div>
        <Annot t={t} style={{ position: 'static', display: 'inline-block', marginTop: 10, transform: 'rotate(-1deg)', fontSize: 13 }}>
          any cell can be manually overridden — breaks from formula &amp; shows a ●
        </Annot>
      </div>
    </div>
  );
}

Object.assign(window, { V1Grid, V1Body, V2Split, V3Canvas, V4Variance, V5RowExpand, UnifiedApp });

// ─────────────────────────────────────────────────────────────
// UnifiedApp — single app with a view switcher for V1–V4
// ─────────────────────────────────────────────────────────────
function UnifiedApp({ t }) {
  const [view, setView] = React.useState('grid');

  const VIEWS = [
    { id: 'grid',      label: 'Grid',      sub: 'edit',     icon: '▦' },
    { id: 'vendor',    label: 'Vendor',    sub: 'drill-in', icon: '◧' },
    { id: 'timeline',  label: 'Timeline',  sub: 'scenarios',icon: '⎯' },
    { id: 'variance',  label: 'Variance',  sub: 'dashboard',icon: '◭' },
  ];

  const viewTitle = {
    grid:     ['Vendor Opex · FY26 + FY27 H1', '25 vendors · $1.42M annualized'],
    vendor:   ['Vendors',                       '$1.42M annualized · 25 active'],
    timeline: ['Forecast Canvas',               'Drag cards between scenarios · $1.42M base'],
    variance: ['FY26 Variance',                 'Apr ’26 close · $11.4k over plan MTD'],
  }[view];

  const viewActions = {
    grid:     <><div className="btn">⤓ Export</div><div className="btn">⚙ Columns</div><div className="btn btn-primary">+ Vendor</div></>,
    vendor:   <><div className="btn">⤓ Export</div><div className="btn btn-primary">+ Vendor</div></>,
    timeline: <><div className="btn">+ Scenario</div><div className="btn btn-primary">Commit plan</div></>,
    variance: <><div className="btn">⤓ Board pack</div><div className="btn btn-primary">Reforecast</div></>,
  }[view];

  const sidebarActive = { grid: 'Vendors', vendor: 'Vendors', timeline: 'Scenarios', variance: 'Overview' }[view];

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column', fontFamily: "'Architects Daughter', cursive" }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1.5px solid var(--line)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, border: '1.5px solid var(--line)', borderRadius: 4, display: 'grid', placeItems: 'center', fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 700 }}>$</div>
          <span className="hand" style={{ fontSize: 20, fontWeight: 700 }}>Ledgerly</span>
          <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>FY26 Plan · Opex</span>
        </div>

        {/* View switcher — center-ish */}
        <div style={{ marginLeft: 28, display: 'flex', gap: 4, border: '1.5px solid var(--line)', padding: 3, background: '#fcfbf7', boxShadow: '1px 1px 0 var(--line)' }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              appearance: 'none', border: 0, cursor: 'pointer', padding: '5px 14px',
              background: view === v.id ? 'var(--ink)' : 'transparent',
              color: view === v.id ? 'var(--paper)' : 'var(--ink-2)',
              fontFamily: "'Architects Daughter', cursive", fontSize: 13, fontWeight: view === v.id ? 700 : 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, opacity: 0.7 }}>{v.icon}</span>
              <span>{v.label}</span>
              <span style={{ fontSize: 10, opacity: 0.55, fontWeight: 400 }}>· {v.sub}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="sketch-box" style={{ padding: '3px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent-good)' }} />
            <span>Working draft</span>
            <span style={{ color: 'var(--ink-4)' }}>· v12</span>
          </div>
          <div className="btn">Share</div>
          <div className="btn btn-primary">Submit for review</div>
          <div style={{ width: 26, height: 26, border: '1.5px solid var(--line)', borderRadius: 13, display: 'grid', placeItems: 'center', fontSize: 12 }}>JL</div>
        </div>
      </div>

      {/* Page title row */}
      <div style={{ padding: '12px 18px 8px', display: 'flex', alignItems: 'flex-end', gap: 12, borderBottom: '1px solid var(--line-softer)' }}>
        <div>
          <div className="hand" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{viewTitle[0]}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{viewTitle[1]}</div>
        </div>
        <div style={{ flex: 1 }} />
        {viewActions}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <WFSidebar active={sidebarActive} />
        {view === 'grid'     && <V1Body t={t} />}
        {view === 'vendor'   && <V2Split t={t} headless />}
        {view === 'timeline' && <V3Canvas t={t} headless />}
        {view === 'variance' && <V4Variance t={t} headless />}
      </div>
    </div>
  );
}
