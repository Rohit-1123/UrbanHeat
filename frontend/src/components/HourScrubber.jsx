import React, { useState } from 'react';
import { getRiskColor } from '../utils/riskCalculator';

// Scrub through the selected place's model forecast ("Now" + diurnal hours).
// Parent should key this by location so it resets to "Now" on a new place.
const HourScrubber = ({ forecast = [] }) => {
  const [index, setIndex] = useState(0);
  if (forecast.length < 2) return null;

  const hour = forecast[Math.min(index, forecast.length - 1)];
  const color = getRiskColor(hour.heat_risk);

  return (
    <section className="hour-scrubber" aria-label="Heat at this place by time of day">
      <div className="hour-scrubber-top">
        <div className="hour-scrubber-temp">{hour.temp}<span>°C</span></div>
        <div className="hour-scrubber-risk">
          <small>{hour.time === 'Now' ? 'Right now' : `Typical at ${hour.time}`}</small>
          <strong style={{ color }}>{hour.risk_level} · {hour.heat_risk}</strong>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={forecast.length - 1}
        step={1}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        aria-valuetext={`${hour.time}: ${hour.temp} degrees, heat risk ${hour.heat_risk}`}
        style={{ '--fill': `${(index / (forecast.length - 1)) * 100}%`, '--thumb': color }}
      />
      <div className="hour-scrubber-ticks" aria-hidden="true">
        {forecast.map((f, i) => (
          <button key={f.time} type="button" tabIndex={-1} className={i === index ? 'on' : ''} onClick={() => setIndex(i)}>
            {f.time}
          </button>
        ))}
      </div>
    </section>
  );
};

export default HourScrubber;
