import React, { useState } from 'react';
import { getRiskColor } from '../utils/riskCalculator';

// Thin full-width heat-risk curve across the day (the backend's model-driven
// diurnal forecast). Curve is SVG; points/labels are HTML so they stay crisp
// and keyboard-focusable at any width.
const W = 1000;
const H = 190;
const TOP = 46;
const BOTTOM = 150;

const smoothPath = (pts) => pts.reduce((d, p, i) => {
  if (i === 0) return `M${p.x},${p.y}`;
  const p0 = pts[i - 2] || pts[i - 1];
  const p1 = pts[i - 1];
  const p3 = pts[i + 1] || p;
  const c1x = p1.x + (p.x - p0.x) / 6;
  const c1y = p1.y + (p.y - p0.y) / 6;
  const c2x = p.x - (p3.x - p1.x) / 6;
  const c2y = p.y - (p3.y - p1.y) / 6;
  return `${d} C${c1x},${c1y} ${c2x},${c2y} ${p.x},${p.y}`;
}, '');

const HeatWave = ({ forecast = [] }) => {
  const hours = forecast.filter((f) => f.time !== 'Now');
  const peakIndex = hours.reduce((best, f, i) => (f.heat_risk > hours[best].heat_risk ? i : best), 0);
  const [active, setActive] = useState(null);

  if (hours.length < 2) return null;

  const risks = hours.map((f) => f.heat_risk);
  const min = Math.min(...risks);
  const span = Math.max(...risks) - min || 1;
  const step = W / hours.length;
  const pts = hours.map((f, i) => ({
    x: step * (i + 0.5),
    y: BOTTOM - ((f.heat_risk - min) / span) * (BOTTOM - TOP),
  }));
  // Run the curve edge to edge.
  const full = [{ x: 0, y: pts[0].y }, ...pts, { x: W, y: pts[pts.length - 1].y }];
  const line = smoothPath(full);
  const shown = active ?? peakIndex;
  const peakColor = getRiskColor(hours[peakIndex].heat_risk);

  return (
    <section className="sky-wave" aria-label="Heat risk through the day">
      <div className="sky-wave-head">
        <h2>Heat through the day</h2>
        <span>Model-predicted heat risk, 0–100</span>
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sky-wave-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={peakColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={peakColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line className="grid" x1="0" x2={W} y1={TOP} y2={TOP} vectorEffect="non-scaling-stroke" />
          <line className="grid" x1="0" x2={W} y1={BOTTOM} y2={BOTTOM} vectorEffect="non-scaling-stroke" />
          <path className="area" d={`${line} L${W},${H} L0,${H} Z`} fill="url(#sky-wave-fill)" />
          <path className="curve" d={line} vectorEffect="non-scaling-stroke" />
        </svg>

        {hours.map((f, i) => {
          const isOn = i === shown;
          const color = getRiskColor(f.heat_risk);
          return (
            <button
              key={f.time}
              type="button"
              className="sky-wave-point"
              style={{ left: `${(pts[i].x / W) * 100}%`, top: `${(pts[i].y / H) * 100}%` }}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
              aria-label={`${f.time}: ${f.temp}°C, heat risk ${f.heat_risk} (${f.risk_level})`}
            >
              <span className="sky-wave-dot" style={{ background: color, transform: `scale(${isOn ? 1.6 : 1})` }} />
              <span className={`sky-wave-tag ${isOn ? 'on' : ''}`}>
                {i === peakIndex ? 'Peak · ' : ''}{f.temp}°
                <em>{f.risk_level} {f.heat_risk}</em>
              </span>
              <span className="sky-wave-hour">{f.time}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default HeatWave;
