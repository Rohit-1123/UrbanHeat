import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, X, Droplets, Sun, Wind, Clock } from 'lucide-react';

const HeatAlertBanner = ({ currentLocation, onNavigate }) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hour = new Date().getHours();
  const isPeakHours = hour >= 11 && hour <= 16;
  const riskScore = currentLocation?.heatRiskScore || 65;
  const isHighRisk = riskScore >= 60;

  // If dismissed or risk is low & not peak hours, don't show
  if (dismissed || (!isHighRisk && !isPeakHours)) {
    return null;
  }

  const alertType = riskScore >= 75 ? 'danger' : 'warning';
  const alertTitle = riskScore >= 75
    ? 'SEVERE HEAT ADVISORY ACTIVE'
    : 'MODERATE-TO-HIGH THERMAL STRESS NOTICE';

  return (
    <aside className={`heat-alert-banner ${alertType}`} role="alert" aria-label="Urban Heat Weather Advisory">
      <div className="heat-alert-content">
        <div className="heat-alert-main">
          <div className="heat-alert-icon-wrap">
            <ShieldAlert size={20} className="alert-pulse-icon" />
          </div>

          <div className="heat-alert-text">
            <div className="heat-alert-heading">
              <span className="alert-badge">{alertTitle}</span>
              <span className="alert-location">
                {currentLocation?.area || 'SRM Campus'} · Temp: {currentLocation?.temperature || 34}°C (Feels like {currentLocation?.feelsLike || 39}°C)
              </span>
            </div>
            <p className="alert-summary">
              {isPeakHours
                ? 'Peak solar radiation window (11:30 AM – 4:00 PM). Surface pavement temperatures are elevated.'
                : 'Elevated urban heat index detected. Hydration and shade precautions advised.'}
            </p>
          </div>
        </div>

        <div className="heat-alert-actions">
          <button
            className="alert-btn-action"
            onClick={() => onNavigate('routes')}
            title="Find shaded walking path"
          >
            <Sun size={14} />
            <span>Find Cool Route</span>
          </button>

          <button
            className="alert-btn-details"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <span>{expanded ? 'Hide Advisory' : 'Quick Tips'}</span>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          <button
            className="alert-btn-close"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss alert banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="heat-alert-expanded">
          <div className="alert-guideline-grid">
            <div className="alert-tip-card">
              <div className="tip-header">
                <Droplets size={16} className="text-blue" />
                <strong>Hydration Mandate</strong>
              </div>
              <p>Drink at least 250ml of water or electrolyte solution every 30–45 minutes.</p>
            </div>

            <div className="alert-tip-card">
              <div className="tip-header">
                <Sun size={16} className="text-amber" />
                <strong>Shade Navigation</strong>
              </div>
              <p>Use tree-canopied corridors and covered walkways to avoid direct UV exposure.</p>
            </div>

            <div className="alert-tip-card">
              <div className="tip-header">
                <Clock size={16} className="text-emerald" />
                <strong>Activity Timing</strong>
              </div>
              <p>Reschedule heavy athletic or outdoor work to after 5:30 PM.</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default HeatAlertBanner;
