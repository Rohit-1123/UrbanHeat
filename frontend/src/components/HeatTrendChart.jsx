import React from 'react';

const HeatTrendChart = () => {
  const hourlyData = [
    { hour: '6 AM', temp: 26, risk: 'Low', color: '#5F8F6B' },
    { hour: '9 AM', temp: 30, risk: 'Moderate', color: '#E69A2D' },
    { hour: '12 PM', temp: 35, risk: 'High', color: '#D96C2F' },
    { hour: '3 PM', temp: 37, risk: 'Severe', color: '#C94C4C' },
    { hour: '6 PM', temp: 33, risk: 'High', color: '#D96C2F' },
    { hour: '9 PM', temp: 29, risk: 'Moderate', color: '#E69A2D' },
  ];

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
        <span className="tip-icon">🔥</span>
        <span>Peak thermal exposure occurs between <strong>12:00 PM and 3:30 PM</strong>. Limit intense physical activity during this 3.5 hour window.</span>
      </div>
    </div>
  );
};

export default HeatTrendChart;
