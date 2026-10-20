function fmtK(value) {
  return Math.abs(value) >= 1000
    ? `${(value / 1000).toFixed(0)}k`
    : String(Math.round(value));
}
export function ForecastCharts({ forecast }) {
  const rows = forecast?.rows || [];
  if (!rows.length) return null;
  const W = 680,
    H = 250,
    P = 44;
  const vals = rows.flatMap((r) => [r.revenue, r.gross_profit, r.net_profit]);
  const max = Math.max(...vals, 1),
    min = Math.min(0, ...vals);
  const ix = (i) => P + (i * (W - P - 16)) / Math.max(rows.length - 1, 1);
  const iy = (v) => 12 + (H - P - 12) * (1 - (v - min) / (max - min || 1));
  const line = (k) =>
    rows
      .map(
        (r, i) => `${i ? "L" : "M"}${ix(i).toFixed(1)} ${iy(r[k]).toFixed(1)}`,
      )
      .join(" ");
  const bw = Math.max(6, (W - P - 16) / rows.length - 6);
  return (
    <div className="w-full min-w-[280px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="12-month financial forecast"
      >
        <g className="text-stone-400 dark:text-stone-500">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const v = min + (max - min) * f;
            return (
              <g key={f}>
                <line
                  x1={P}
                  x2={W - 16}
                  y1={iy(v)}
                  y2={iy(v)}
                  stroke="currentColor"
                  strokeOpacity=".25"
                  strokeDasharray="3 4"
                />
                <text x={4} y={iy(v) + 4} fontSize="10" fill="currentColor">
                  {fmtK(v)}
                </text>
              </g>
            );
          })}
          <line
            x1={P}
            x2={W - 16}
            y1={iy(0)}
            y2={iy(0)}
            stroke="currentColor"
          />
        </g>
        {rows.map((r, i) => (
          <rect
            key={i}
            x={ix(i) - bw / 2}
            y={Math.min(iy(r.net_profit), iy(0))}
            width={bw}
            height={Math.max(Math.abs(iy(r.net_profit) - iy(0)), 1)}
            rx="2"
            className={
              r.net_profit >= 0 ? "fill-emerald-500/50" : "fill-rose-500/50"
            }
          >
            <title>{`Month ${r.month}: net ${r.net_profit.toLocaleString()}`}</title>
          </rect>
        ))}
        <path
          d={line("revenue")}
          className="stroke-wood-500"
          fill="none"
          strokeWidth="2.5"
        />
        <path
          d={line("gross_profit")}
          className="stroke-amber-500"
          fill="none"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        {rows.map((r, i) => (
          <circle
            key={i}
            cx={ix(i)}
            cy={iy(r.revenue)}
            r="3"
            className="fill-wood-500"
          >
            <title>{`Month ${r.month}: revenue ${r.revenue.toLocaleString()}`}</title>
          </circle>
        ))}
        {rows.map((r, i) =>
          i % 2 === 0 ? (
            <text
              key={i}
              x={ix(i)}
              y={H - 6}
              fontSize="10"
              className="fill-stone-500 dark:fill-stone-400"
              textAnchor="middle"
            >
              M{r.month}
            </text>
          ) : null,
        )}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-[11px] text-stone-500 dark:text-stone-400">
        <span>
          <i className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-wood-500" />
          Revenue
        </span>
        <span>
          <i className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-amber-500" />
          Gross profit
        </span>
        <span>
          <i className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-emerald-500" />
          Net profit
        </span>
      </div>
    </div>
  );
}
