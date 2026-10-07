import React from 'react';
import { Flame, Loader2 } from 'lucide-react';

const RISK_LEVEL_COLOR = {
  Low: '#5F8F6B',
  Moderate: '#E69A2D',
  High: '#D96C2F',
  Severe: '#C94C4C',
  Extreme: '#C94C4C',
};

const HeatTrendChart = ({ points, loading }) => {
  // `points` comes from GET /api/heat-trend: [{ hour, temperature, heat_risk, risk_level }]
  const hourlyData = (points || []).map((p) => ({
    hour: p.hour,
    temp: p.temperature,
    heatRisk: p.heat_risk,
    risk: p.risk_level,
    color: RISK_LEVEL_COLOR[p.risk_level] || '#E69A2D',
  }));
  const peak = hourlyData.reduce((best, d) => (!best || d.heatRisk > best.heatRisk ? d : best), null);

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

  if (!peak) {
    return (
      <div className="chart-card-wrapper">
        <div className="chart-card-header">
          <div>
            <h3>Diurnal Heat Pattern Analysis</h3>
            <p className="subtext">Live trend data is unavailable right now. Please try again shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card-wrapper">
      <div className="chart-card-header">
        <div>
          <h3>Diurnal Heat Pattern Analysis</h3>
          <p className="subtext">Model-predicted heat risk across a typical summer day</p>
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
        <span>Peak predicted heat risk here is at <strong>{peak.hour}</strong> ({Math.round(peak.heatRisk)}/100). Limit intense outdoor activity around that time.</span>
      </div>
    </div>
  );
};

export default HeatTrendChart;
