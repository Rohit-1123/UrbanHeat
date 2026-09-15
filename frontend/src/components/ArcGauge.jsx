import React from 'react';

const ArcGauge = ({ score = 34, level = 'Low Heat Risk' }) => {
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s <= 25) return '#10b981';
    if (s <= 50) return '#059669';
    if (s <= 75) return '#f59e0b';
    return '#ef4444';
  };

  const currentColor = getColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg viewBox="0 0 200 120" style={{ width: '170px', height: '100px' }}>
        <defs>
          <linearGradient id="lightGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="40%" stopColor="#3b82f6" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Track background */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Score arc fill */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#lightGaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>

      <div style={{ position: 'absolute', top: '44px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
          {score} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>/100</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
          Heat Risk Index
        </div>
      </div>
    </div>
  );
};

export default ArcGauge;
