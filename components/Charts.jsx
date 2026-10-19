function fmtK(v) {
  return Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(Math.round(v));
}

export function ForecastCharts({ forecast }) {
  const rows = forecast?.rows || [];
  if (!rows.length) return null;

  const W = 680, H = 250, P = 44;
  const vals = rows.flatMap((r) => [r.revenue, r.gross_profit, r.net_profit]);
  const max = Math.max(...vals, 1);
  const min = Math.min(0, ...vals);
  const ix = (i) => P + (i * (W - P - 16)) / Math.max(rows.length - 1, 1);
  const iy = (v) => 12 + (H - P - 12) * (1 - (v - min) / (max - min || 1));
  const line = (k) => rows.map((r, i) => `${i ? 'L' : 'M'}${ix(i).toFixed(1)} ${iy(r[k]).toFixed(1)}`).join(' ');
  const bw = Math.max(6, (W - P - 16) / rows.length - 6);

  return (
    <div className="charts">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="12-month financial chart">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = min + (max - min) * f;
          return (
            <g key={f}>
              <line x1={P} x2={W - 16} y1={iy(v)} y2={iy(v)} stroke="var(--border)" strokeDasharray="3 4" />
              <text x={4} y={iy(v) + 4} fontSize="10" fill="var(--muted)">{fmtK(v)}</text>
            </g>
          );
        })}
        <line x1={P} x2={W - 16} y1={iy(0)} y2={iy(0)} stroke="var(--muted)" />
        {rows.map((r, i) => (
          <rect key={'b' + i} x={ix(i) - bw / 2} y={Math.min(iy(r.net_profit), iy(0))} width={bw}
            height={Math.max(Math.abs(iy(r.net_profit) - iy(0)), 1)} rx="2"
            fill={r.net_profit >= 0 ? 'var(--ok)' : 'var(--err)'} opacity="0.5">
            <title>{`Month ${r.month}: net ${r.net_profit.toLocaleString()}`}</title>
          </rect>
        ))}
        <path d={line('revenue')} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <path d={line('gross_profit')} fill="none" stroke="var(--accent-text)" strokeWidth="2" strokeDasharray="6 4" />
        {rows.map((r, i) => (
          <circle key={'c' + i} cx={ix(i)} cy={iy(r.revenue)} r="3" fill="var(--accent)">
            <title>{`Month ${r.month}: revenue ${r.revenue.toLocaleString()}`}</title>
          </circle>
        ))}
        {rows.map((r, i) => (i % 2 === 0 ? <text key={'x' + i} x={ix(i)} y={H - 6} fontSize="10" fill="var(--muted)" textAnchor="middle">M{r.month}</text> : null))}
      </svg>
      <div className="row muted" style={{ justifyContent: 'center', gap: 16 }}>
        <span title="Total sales per month"><i className="lg" style={{ background: 'var(--accent)' }} />Revenue</span>
        <span title="Revenue minus cost of goods"><i className="lg" style={{ background: 'var(--accent-text)' }} />Gross profit</span>
        <span title="Profit after fixed costs (bars)"><i className="lg" style={{ background: 'var(--ok)' }} />Net profit</span>
      </div>
    </div>
  );
}