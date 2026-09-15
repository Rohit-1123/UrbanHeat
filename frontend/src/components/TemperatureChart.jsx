import React, { useState } from 'react';

const TemperatureChart = ({ trendData }) => {
  const [activeRange, setActiveRange] = useState('today');

  const data = trendData[activeRange] || trendData['today'];
  
  const width = 600;
  const height = 240;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const temps = data.map((d) => d.temp || d.avgTemp);
  const minTemp = Math.min(...temps) - 2;
  const maxTemp = Math.max(...temps) + 2;

  const points = data.map((d, i) => {
    const val = d.temp || d.avgTemp;
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = height - padding - ((val - minTemp) / (maxTemp - minTemp)) * chartHeight;
    return { x, y, val, label: d.time };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = curr.x + (next.x - curr.x) / 2;
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const gradId = `tempGrad-${activeRange}`;

  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  const highestTemp = Math.max(...temps);
  const lowestTemp = Math.min(...temps);

  return (
    <div className="chart-card-wrapper">
      <div className="chart-card-header">
        <div>
          <h3>Temperature Trend Over Time</h3>
          <p className="subtext">Historical ambient & surface thermal readings</p>
        </div>

        <div className="range-filter-buttons">
          <button
            className={`btn-filter ${activeRange === 'today' ? 'active' : ''}`}
            onClick={() => setActiveRange('today')}
          >
            Today
          </button>
          <button
            className={`btn-filter ${activeRange === 'days7' ? 'active' : ''}`}
            onClick={() => setActiveRange('days7')}
          >
            7 Days
          </button>
          <button
            className={`btn-filter ${activeRange === 'days30' ? 'active' : ''}`}
            onClick={() => setActiveRange('days30')}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="metrics-summary-bar">
        <div className="metric-pill">
          <span className="metric-lbl">Average Temp</span>
          <strong className="metric-val text-teal">{avgTemp}°C</strong>
        </div>
        <div className="metric-pill">
          <span className="metric-lbl">Max Peak Temp</span>
          <strong className="metric-val text-red">{highestTemp}°C</strong>
        </div>
        <div className="metric-pill">
          <span className="metric-lbl">Min Temp</span>
          <strong className="metric-val text-emerald">{lowestTemp}°C</strong>
        </div>
      </div>

      <div className="svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--heat-orange)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--heat-orange)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + chartHeight * ratio}
              x2={width - padding}
              y2={padding + chartHeight * ratio}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area Fill */}
          <path d={areaD} fill={`url(#${gradId})`} />

          {/* Line Stroke */}
          <path d={pathD} fill="none" stroke="var(--heat-orange)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="5" fill="var(--surface)" stroke="var(--heat-orange)" strokeWidth="2.5" />
              <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)">
                {pt.val}°C
              </text>
              <text x={pt.x} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default TemperatureChart;
