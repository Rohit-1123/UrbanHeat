import React from 'react';
import { Thermometer, ShieldAlert, Flame, Lightbulb, ChevronRight, Loader2 } from 'lucide-react';
import { getRiskColor } from '../utils/riskCalculator';

const HeatOverviewCard = ({ locationData, onNavigate }) => {
  // No fabricated fallback numbers: while the real location/heat data is
  // still loading, show an explicit loading state instead of a fake
  // temperature/risk score.
  if (!locationData) {
    return (
      <div className="overview-cards-grid">
        <div className="overview-card overview-card-loading">
          <Loader2 size={20} className="animate-spin text-emerald" />
          <span>Loading live environmental data...</span>
        </div>
      </div>
    );
  }

  const data = locationData;
  const temperature = data.temperature ?? data.airTemp;
  const feelsLike = data.feelsLike ?? (Number.isFinite(temperature) ? temperature + 5 : undefined);
  const heatRiskScore = data.heatRiskScore ?? data.heat_risk;
  const riskLevel = data.riskLevel ?? data.risk_level;
  const hottestZone = data.hottestZone ?? data.area ?? 'Selected SRM Campus Place';
  const recommendedAction = data.recommendedAction ?? 'Use shaded campus paths and maintain regular hydration.';
  const riskColor = getRiskColor(heatRiskScore ?? 0);

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
          <span className="val-number">{Number.isFinite(temperature) ? `${temperature}°C` : 'N/A'}</span>
          <span className="val-sub">{Number.isFinite(feelsLike) ? `Feels Like ${feelsLike}°C` : 'Feels-like data unavailable'}</span>
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
            {riskLevel || 'Unknown'} Risk
          </span>
          <span className="val-sub">{Number.isFinite(heatRiskScore) ? `Score ${heatRiskScore}/100` : 'Score unavailable'}</span>
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
          <span className="val-title-sm">{hottestZone}</span>
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
            <p className="val-text-desc">{recommendedAction}</p>
        </div>
        <div className="card-label">Primary Safety Action</div>
      </div>
    </div>
  );
};

export default HeatOverviewCard;
