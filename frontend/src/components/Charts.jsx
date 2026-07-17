import React from 'react';

/**
 * Custom SVG-based Line Chart for Dashboard.
 * Draws an interactive-looking trend line with a gradient area fill below it.
 */
export function LineChart({ data, xKey, yKey, height = 220 }) {
  if (!data || data.length === 0) return <div className="chart-empty">No trend data available</div>;

  const width = 500;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yValues = data.map(d => d[yKey]);
  const maxY = Math.max(...yValues, 5) * 1.15; // 15% headroom

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d[yKey] / maxY) * chartHeight;
    return { x, y, value: d[yKey], label: d[xKey] };
  });

  const pathD = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  );

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z` 
    : '';

  // Calculate ticks
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks }, (_, i) => (maxY * (i / (yTicks - 1))));

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines (horizontal) */}
        {tickValues.map((val, idx) => {
          const y = paddingTop + chartHeight - (val / maxY) * chartHeight;
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="rgba(30, 48, 80, 0.3)" 
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="#8b9bb4" 
                fontSize={10} 
                textAnchor="end"
                fontFamily="Outfit"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* X Axis labels */}
        {points.map((p, idx) => (
          <text 
            key={idx} 
            x={p.x} 
            y={height - 8} 
            fill="#8b9bb4" 
            fontSize={10} 
            textAnchor="middle"
            fontFamily="Outfit"
          >
            {p.label}
          </text>
        ))}

        {/* Area fill */}
        {areaD && <path d={areaD} fill="url(#lineGrad)" />}

        {/* Trend line */}
        {pathD && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="#dc2626" 
            strokeWidth={3} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Interactive nodes */}
        {points.map((p, idx) => (
          <g key={idx} className="chart-node" style={{ cursor: 'pointer' }}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={5} 
              fill="#050505" 
              stroke="#dc2626" 
              strokeWidth={2.5} 
            />
            {/* Tooltip trigger or simple hover card in actual SVG if needed */}
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={12} 
              fill="transparent" 
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Custom SVG-based Bar Chart for Estimated Costs.
 */
export function BarChart({ data, xKey, yKey, height = 220 }) {
  if (!data || data.length === 0) return <div className="chart-empty">No financial data available</div>;

  const width = 500;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yValues = data.map(d => d[yKey]);
  const maxY = Math.max(...yValues, 500) * 1.15; // 15% headroom

  const barWidth = Math.min(30, (chartWidth / data.length) * 0.5);
  const colWidth = chartWidth / data.length;

  const bars = data.map((d, i) => {
    const x = paddingLeft + (i * colWidth) + (colWidth - barWidth) / 2;
    const barHeight = (d[yKey] / maxY) * chartHeight;
    const y = paddingTop + chartHeight - barHeight;
    return { x, y, width: barWidth, height: barHeight, value: d[yKey], label: d[xKey] };
  });

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks }, (_, i) => (maxY * (i / (yTicks - 1))));

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#111111" />
          </linearGradient>
        </defs>

        {/* Grid lines (horizontal) */}
        {tickValues.map((val, idx) => {
          const y = paddingTop + chartHeight - (val / maxY) * chartHeight;
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="rgba(30, 48, 80, 0.3)" 
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="#8b9bb4" 
                fontSize={9} 
                textAnchor="end"
                fontFamily="Outfit"
              >
                ${Math.round(val) >= 1000 ? `${(val/1000).toFixed(1)}k` : Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bars.map((bar, idx) => (
          <g key={idx}>
            <rect 
              x={bar.x} 
              y={bar.y} 
              width={bar.width} 
              height={bar.height} 
              rx={3}
              fill="url(#barGrad)" 
              stroke="rgba(220, 38, 38, 0.4)"
              strokeWidth={1}
            />
            {/* X Labels */}
            <text 
              x={bar.x + bar.width / 2} 
              y={height - 8} 
              fill="#8b9bb4" 
              fontSize={10} 
              textAnchor="middle"
              fontFamily="Outfit"
            >
              {bar.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Custom SVG-based Donut (Pie) Chart for Defect types.
 */
export function DonutChart({ data }) {
  // data: {"Scratch": 5, "Dent": 2, ...}
  const keys = Object.keys(data).filter(k => data[k] > 0);
  const values = keys.map(k => data[k]);
  const total = values.reduce((sum, v) => sum + v, 0);

  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#8b9bb4', fontSize: '0.9rem' }}>
        No defects recorded yet
      </div>
    );
  }

  // Predefined color theme
  const colorsList = [
    "#dc2626", "#ef4444", "#b91c1c", "#f59e0b",
    "#10b981", "#f87171", "#fca5a5", "#991b1b"
  ];

  // Calculate percentages and angles
  let accumulatedPercent = 0;
  const segments = keys.map((key, idx) => {
    const val = data[key];
    const percent = val / total;
    const startAngle = accumulatedPercent * 360;
    accumulatedPercent += percent;
    const endAngle = accumulatedPercent * 360;

    return {
      key,
      val,
      percent: Math.round(percent * 100),
      startAngle,
      endAngle,
      color: colorsList[idx % colorsList.length]
    };
  });

  // Calculate SVG arc paths
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  let cumulativePercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', padding: '10px 0' }}>
      <svg width={140} height={140} viewBox="-1.1 -1.1 2.2 2.2" style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((seg, idx) => {
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += (seg.val / total);
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = (seg.val / total) > 0.5 ? 1 : 0;
          
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          return (
            <path 
              key={idx} 
              d={pathData} 
              fill={seg.color} 
              stroke="#050505"
              strokeWidth={0.02}
            />
          );
        })}
        {/* Hollow center to make it a donut */}
        <circle cx={0} cy={0} r={0.65} fill="#111111" />
      </svg>

      {/* Legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
        {segments.map((seg, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: seg.color }}></span>
            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{seg.key}</span>
            <span style={{ color: '#8b9bb4' }}>({seg.val} • {seg.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Custom horizontal breakdown list for Severity Levels.
 */
export function SeverityBarChart({ data }) {
  const lowVal = data.Minor || data.Low || 0;
  const medVal = data.Moderate || data.Medium || 0;
  const highVal = data.Severe || data.High || 0;
  const total = lowVal + medVal + highVal;

  const lowPercent = total > 0 ? Math.round((lowVal / total) * 100) : 0;
  const medPercent = total > 0 ? Math.round((medVal / total) * 100) : 0;
  const highPercent = total > 0 ? Math.round((highVal / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
      {/* Low / Minor */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
          <span style={{ color: '#10b981', fontWeight: '600' }}>Minor Severity Damage</span>
          <span style={{ color: '#e2e8f0' }}>{lowVal} inspections ({lowPercent}%)</span>
        </div>
        <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${lowPercent}%`, backgroundColor: '#10b981', borderRadius: '4px', boxShadow: '0 0 8px #10b981' }}></div>
        </div>
      </div>

      {/* Medium / Moderate */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
          <span style={{ color: '#f59e0b', fontWeight: '600' }}>Moderate Severity Damage</span>
          <span style={{ color: '#e2e8f0' }}>{medVal} inspections ({medPercent}%)</span>
        </div>
        <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${medPercent}%`, backgroundColor: '#f59e0b', borderRadius: '4px', boxShadow: '0 0 8px #f59e0b' }}></div>
        </div>
      </div>

      {/* High / Severe */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
          <span style={{ color: '#ef4444', fontWeight: '600' }}>Severe Severity Damage</span>
          <span style={{ color: '#e2e8f0' }}>{highVal} inspections ({highPercent}%)</span>
        </div>
        <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${highPercent}%`, backgroundColor: '#ef4444', borderRadius: '4px', boxShadow: '0 0 8px #ef4444' }}></div>
        </div>
      </div>
    </div>
  );
}
