import React from 'react';
import { Thermometer, ShieldAlert, Flame, Lightbulb, ChevronRight } from 'lucide-react';
import { getRiskColor } from '../utils/riskCalculator';

const HeatOverviewCard = ({ locationData, onNavigate }) => {
  const data = locationData || {
    temperature: 34,
    feelsLike: 39,
    heatRiskScore: 68,
    riskLevel: 'High',
    hottestZone: 'Central Urban Area',
    recommendedAction: 'Stay hydrated and limit prolonged outdoor exposure between 12 PM and 4 PM.'
  };

  const riskColor = getRiskColor(data.heatRiskScore);

  return (
    <div className="overview-cards-grid">
      {/* 1. Current Temperature Card */}
      <div className="overview-card clickable" onClick={() => onNavigate('analytics')}>
        <div className="card-top-row">
          <div className="card-icon-badge temp-badge">
            <Thermometer size={20} />
          </div>
          <span className="card-link-hint">Analytics <ChevronRight size={14} /></span>
        </div>
        <div className="card-main-val">
          <span className="val-number">{data.temperature}°C</span>
          <span className="val-sub">Feels Like {data.feelsLike}°C</span>
        </div>
        <div className="card-label">Current Temperature</div>
      </div>

      {/* 2. Heat Risk Card */}
      <div className="overview-card clickable" onClick={() => onNavigate('risk')}>
        <div className="card-top-row">
          <div className="card-icon-badge risk-badge" style={{ backgroundColor: `${riskColor}15`, color: riskColor }}>
            <ShieldAlert size={20} />
          </div>
          <span className="card-link-hint">Risk Details <ChevronRight size={14} /></span>
        </div>
        <div className="card-main-val">
          <span className="risk-level-tag" style={{ backgroundColor: `${riskColor}20`, color: riskColor, borderColor: `${riskColor}40` }}>
            {data.riskLevel} Risk
          </span>
          <span className="val-sub">Score {data.heatRiskScore}/100</span>
        </div>
        <div className="card-label">Heat Risk Status</div>
      </div>

      {/* 3. Hottest Zone Card */}
      <div className="overview-card clickable" onClick={() => onNavigate('map')}>
        <div className="card-top-row">
          <div className="card-icon-badge hot-badge">
            <Flame size={20} />
          </div>
          <span className="card-link-hint">View Map <ChevronRight size={14} /></span>
        </div>
        <div className="card-main-val">
          <span className="val-title-sm">{data.hottestZone}</span>
          <span className="val-sub">Highest localized thermal intensity</span>
        </div>
        <div className="card-label">Hottest Urban Zone</div>
      </div>

      {/* 4. Recommended Action Card */}
      <div className="overview-card clickable" onClick={() => onNavigate('recommendations')}>
        <div className="card-top-row">
          <div className="card-icon-badge action-badge">
            <Lightbulb size={20} />
          </div>
          <span className="card-link-hint">Actions <ChevronRight size={14} /></span>
        </div>
        <div className="card-main-val">
          <p className="val-text-desc">{data.recommendedAction}</p>
        </div>
        <div className="card-label">Primary Safety Action</div>
      </div>
    </div>
  );
};

export default HeatOverviewCard;
