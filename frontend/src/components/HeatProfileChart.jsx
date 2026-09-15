import React from 'react';

const HeatProfileChart = ({ profile, color = '#10b981', height = 100 }) => {
  if (!profile || profile.length < 2) {
    profile = [
      { position: 0, score: 20 },
      { position: 25, score: 35 },
      { position: 50, score: 65 },
      { position: 75, score: 40 },
      { position: 100, score: 75 }
    ];
  }

  const width = 320;
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
  const reactId = React.useId();
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
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Curve stroke */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />

        {/* Markers */}
        {points.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke={color} strokeWidth="2" />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '-8px' }}>
        <span>Start Point</span>
        <span>Midpoint</span>
        <span>Destination</span>
      </div>
    </div>
  );
};

export default HeatProfileChart;
