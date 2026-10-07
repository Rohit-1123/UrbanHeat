import React from 'react';

const HeatProfileChart = ({ profile, color = '#10b981', height = 100, width = 320 }) => {
  const reactId = React.useId();
  // No invented placeholder curve: nothing to draw without real data.
  if (!profile || profile.length < 2) return null;

  const padding = 16;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = profile.map((pt) => {
    const x = padding + (pt.position / 100) * chartWidth;
    const y = height - padding - (pt.score / 100) * chartHeight;
    return { x, y, score: pt.score };
  });

  // Build SVG Path d string with cubic curves
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 2;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) / 2;
    const cpY2 = next.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }

  // Area fill path string
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const gradientId = `lightHeatGrad-${reactId.replace(/:/g, '')}`;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2 6" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2 6" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.18" />

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Curve stroke */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />

        {/* Markers */}
        {points.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r="2.5" fill={color} />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-4px' }}>
        <span>Start</span>
        <span>Destination</span>
      </div>
    </div>
  );
};

export default HeatProfileChart;
