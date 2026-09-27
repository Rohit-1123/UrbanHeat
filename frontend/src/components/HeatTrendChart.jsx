import React from 'react';
import { Flame, Loader2 } from 'lucide-react';

const RISK_LEVEL_COLOR = {
  Low: '#5F8F6B',
  Moderate: '#E69A2D',
  High: '#D96C2F',
  Severe: '#C94C4C',
  Extreme: '#C94C4C',
};

const FALLBACK_TREND = [
  { hour: '6 AM', temp: 26, risk: 'Low', color: '#5F8F6B' },
  { hour: '9 AM', temp: 30, risk: 'Moderate', color: '#E69A2D' },
  { hour: '12 PM', temp: 35, risk: 'High', color: '#D96C2F' },
  { hour: '3 PM', temp: 37, risk: 'Severe', color: '#C94C4C' },
  { hour: '6 PM', temp: 33, risk: 'High', color: '#D96C2F' },
  { hour: '9 PM', temp: 29, risk: 'Moderate', color: '#E69A2D' },
];

const HeatTrendChart = ({ points, loading }) => {
  // `points` comes from GET /api/heat-trend: [{ hour, temperature, heat_risk, risk_level }]
  const hourlyData = points && points.length > 0
    ? points.map((p) => ({
        hour: p.hour,
        temp: p.temperature,
        risk: p.risk_level,
        color: RISK_LEVEL_COLOR[p.risk_level] || '#E69A2D',
      }))
    : FALLBACK_TREND;

  if (loading) {
    return (
      <div className="chart-card-wrapper">
        <div className="chart-card-header">
          <div>
            <h3>Diurnal Heat Pattern Analysis</h3>
            <p className="subtext">Loading model-predicted trend for this location...</p>
          </div>
        </div>
        <div className="hourly-bars-grid" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '160px' }}>
          <Loader2 size={24} className="animate-spin text-emerald" />
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card-wrapper">
      <div className="chart-card-header">
        <div>
          <h3>Diurnal Heat Pattern Analysis</h3>
          <p className="subtext">Peak thermal stress window during typical summer day</p>
        </div>
      </div>

      <div className="hourly-bars-grid">
        {hourlyData.map((d, i) => (
          <div key={i} className="hourly-bar-col">
            <span className="bar-temp">{d.temp}°C</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  height: `${(d.temp / 40) * 100}%`,
                  backgroundColor: d.color
                }}
              />
            </div>
            <span className="bar-hour">{d.hour}</span>
            <span className="bar-risk-tag" style={{ color: d.color }}>{d.risk}</span>
          </div>
        ))}
      </div>

      <div className="heat-pattern-footer-tip">
        <span className="tip-icon"><Flame size={16} /></span>
        <span>Peak thermal exposure occurs between <strong>12:00 PM and 3:30 PM</strong>. Limit intense physical activity during this 3.5 hour window.</span>
      </div>
    </div>
  );
};

export default HeatTrendChart;
