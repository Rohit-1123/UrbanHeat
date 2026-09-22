import React from 'react';
import {
  Thermometer,
  Flame,
  ShieldAlert,
  TreePine,
  Building2,
  Droplets,
  Sun,
  Clock,
  MapPin,
  Compass,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { getRiskColor } from '../utils/riskCalculator';

const SelectedLocationPanel = ({
  location,
  onCenterMap,
  onNavigate
}) => {
  if (!location) {
    return (
      <div className="selected-location-empty-card">
        <div className="empty-icon-wrap">
          <MapPin size={28} className="text-muted" />
        </div>
        <h4>No Area Selected</h4>
        <p>Click on any heat zone marker or search a location above to view microclimate details.</p>
      </div>
    );
  }

  const name = location.area || location.name || 'Selected Location';
  const city = location.city || 'SRM Kattankulathur';
  const zoneType = location.zoneType || 'Urban Microclimate Zone';
  const temp = location.temperature ?? 34;
  const feelsLike = location.feelsLike ?? (temp + 5);
  const surfaceTemp = location.surfaceTemp ?? (temp + 4.5);
  const heatIntensity = location.heatIntensity || location.heat_intensity || 'Moderate';
  const riskLevel = location.riskLevel || location.risk_level || 'Moderate';
  const riskScore = location.heatRiskScore || location.heat_risk || 50;
  const vegIndex = location.vegetationIndex ?? location.vegetation_index ?? 0.35;
  const vegLevel = location.vegetation || (vegIndex > 0.6 ? 'High' : vegIndex > 0.3 ? 'Moderate' : 'Low');
  const builtDensity = location.builtUpDensity ?? location.building_density ?? 0.75;
  const densityLevel = location.builtUpDensityLevel || (builtDensity > 0.7 ? 'High' : builtDensity > 0.4 ? 'Moderate' : 'Low');
  const humidity = location.humidity ?? 60;
  const uvIndex = location.uv_index ?? 8.0;
  const lastUpdated = location.lastUpdated || 'Today, 01:30 PM';
  const action = location.recommendedAction || 'Stay hydrated and limit direct sun exposure during peak afternoon hours.';
  const factorNote = location.hottestZone
    ? `Highest heat retention localized near ${location.hottestZone}.`
    : (builtDensity > 0.7 ? 'Dense asphalt & concrete surfaces amplify thermal trapping.' : 'Moderate tree canopy helps mitigate extreme heat spikes.');

  // Color mapping based on risk score / intensity
  const riskColor = getRiskColor(riskScore);

  const getIntensityBadgeClass = (intensity) => {
    switch (intensity.toLowerCase()) {
      case 'cool': return 'badge-intensity-cool';
      case 'moderate': return 'badge-intensity-moderate';
      case 'high': return 'badge-intensity-high';
      case 'severe':
      case 'extreme': return 'badge-intensity-severe';
      default: return 'badge-intensity-moderate';
    }
  };

  return (
    <div className="selected-location-panel">
      {/* Header */}
      <div className="selected-panel-header">
        <div className="header-meta">
          <span className="location-type-pill">{zoneType}</span>
          <div className="timestamp-badge">
            <Clock size={12} />
            <span>Updated: {lastUpdated}</span>
          </div>
        </div>

        <div className="header-title-row">
          <div className="title-left">
            <MapPin size={20} className="pin-accent" />
            <div>
              <h3 className="location-name">{name}</h3>
              <span className="location-city">{city} • Lat: {Number(location.lat || location.latitude).toFixed(4)}, Lon: {Number(location.lon || location.longitude).toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Strip */}
      <div className="selected-badges-row">
        <div className={`intensity-badge ${getIntensityBadgeClass(heatIntensity)}`}>
          <Flame size={14} />
          <span>Heat Intensity: <strong>{heatIntensity}</strong></span>
        </div>

        <div
          className="risk-badge-custom"
          style={{
            backgroundColor: `${riskColor}18`,
            borderColor: riskColor,
            color: riskColor
          }}
        >
          <ShieldAlert size={14} />
          <span>Risk Level: <strong>{riskLevel} ({riskScore}/100)</strong></span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="selected-metrics-grid">
        <div className="metric-stat-card highlight">
          <div className="stat-label">
            <Thermometer size={14} className="icon-temp" />
            <span>Air Temperature</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-value">{temp}°C</span>
            <span className="stat-sub">Feels Like {feelsLike}°C</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-label">
            <Flame size={14} className="icon-surface" />
            <span>Surface Temp</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-value">{surfaceTemp}°C</span>
            <span className="stat-sub">{surfaceTemp > 40 ? 'Severe Heat Trapping' : 'Moderate Radiation'}</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-label">
            <TreePine size={14} className="icon-tree" />
            <span>Vegetation (NDVI)</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-value">{Math.round(vegIndex * 100)}%</span>
            <span className="stat-sub">{vegLevel} Canopy</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-label">
            <Building2 size={14} className="icon-building" />
            <span>Built-up Density</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-value">{Math.round(builtDensity * 100)}%</span>
            <span className="stat-sub">{densityLevel} Impervious</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-label">
            <Droplets size={14} className="icon-humidity" />
            <span>Humidity</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-value">{humidity}%</span>
            <span className="stat-sub">Relative</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-label">
            <Sun size={14} className="icon-uv" />
            <span>UV Radiation</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-value">{uvIndex}</span>
            <span className="stat-sub">{uvIndex > 8 ? 'Very High' : 'Moderate'} UV</span>
          </div>
        </div>
      </div>

      {/* Factor Note & Recommended Action */}
      <div className="selected-action-box">
        <div className="factor-line">
          <AlertTriangle size={14} className="factor-icon" />
          <span><strong>Microclimate Factor:</strong> {factorNote}</span>
        </div>
        <p className="action-text">
          <strong>Advisory:</strong> {action}
        </p>
      </div>

      {/* Actions footer */}
      <div className="selected-panel-footer">
        {onCenterMap && (
          <button
            className="btn-panel-action secondary"
            onClick={() => onCenterMap(location)}
            title="Recenter map on this location"
          >
            <Compass size={15} />
            <span>Recenter View</span>
          </button>
        )}

        {onNavigate && (
          <button
            className="btn-panel-action primary"
            onClick={() => onNavigate('risk')}
            title="Open comprehensive risk breakdown"
          >
            <span>Full Risk Assessment</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectedLocationPanel;
