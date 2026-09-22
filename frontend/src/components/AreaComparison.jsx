import React, { useState } from 'react';
import { MOCK_LOCATIONS } from '../data/mockData';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { getRiskColor } from '../utils/riskCalculator';
import { isWithinSrmCampus } from '../config/campus';

const AreaComparison = () => {
  const campusLocations = MOCK_LOCATIONS.filter((location) => isWithinSrmCampus(location.latitude ?? location.lat, location.longitude ?? location.lon));
  const [area1Id, setArea1Id] = useState(campusLocations[0]?.id);
  const [area2Id, setArea2Id] = useState(campusLocations[1]?.id || campusLocations[0]?.id);

  const area1 = campusLocations.find((l) => l.id === area1Id) || campusLocations[0];
  const area2 = campusLocations.find((l) => l.id === area2Id) || campusLocations[1] || campusLocations[0];

  const color1 = getRiskColor(area1.heatRiskScore);
  const color2 = getRiskColor(area2.heatRiskScore);

  return (
    <div className="chart-card-wrapper">
      <div className="chart-card-header">
        <div>
          <h3>Urban Microclimate Comparison Tool</h3>
          <p className="subtext">Compare concrete density, tree canopy, and thermal stress between two urban zones</p>
        </div>
      </div>

      {/* Area Selectors */}
      <div className="comparison-selectors-row">
        <div className="selector-box">
          <label className="select-label">Zone A (Urban Asphalt):</label>
          <select
            className="select-light"
            value={area1Id}
            onChange={(e) => setArea1Id(e.target.value)}
          >
            {campusLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.area}</option>
            ))}
          </select>
        </div>

        <div className="versus-badge">
          <ArrowLeftRight size={16} />
        </div>

        <div className="selector-box">
          <label className="select-label">Zone B (Cool Canopy):</label>
          <select
            className="select-light"
            value={area2Id}
            onChange={(e) => setArea2Id(e.target.value)}
          >
            {campusLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.area}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Metrics Grid */}
      <div className="comparison-grid">
        <div className="comparison-card zone-a">
          <h4 className="zone-name">{area1.area}</h4>
          <span className="risk-pill-sm" style={{ backgroundColor: `${color1}20`, color: color1 }}>
            {area1.riskLevel} Risk ({area1.heatRiskScore}/100)
          </span>

          <div className="metric-row">
            <span className="metric-lbl">Ambient Air Temp</span>
            <strong className="metric-val">{area1.temperature}°C</strong>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Land Surface Temp</span>
            <strong className="metric-val">{area1.surfaceTemp}°C</strong>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Tree Canopy Cover</span>
            <strong className="metric-val">{Math.round(area1.vegetationIndex * 100)}%</strong>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Built Concrete Density</span>
            <strong className="metric-val">{Math.round(area1.builtUpDensity * 100)}%</strong>
          </div>
        </div>

        <div className="comparison-card zone-b">
          <h4 className="zone-name">{area2.area}</h4>
          <span className="risk-pill-sm" style={{ backgroundColor: `${color2}20`, color: color2 }}>
            {area2.riskLevel} Risk ({area2.heatRiskScore}/100)
          </span>

          <div className="metric-row">
            <span className="metric-lbl">Ambient Air Temp</span>
            <strong className="metric-val">{area2.temperature}°C</strong>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Land Surface Temp</span>
            <strong className="metric-val">{area2.surfaceTemp}°C</strong>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Tree Canopy Cover</span>
            <strong className="metric-val">{Math.round(area2.vegetationIndex * 100)}%</strong>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Built Concrete Density</span>
            <strong className="metric-val">{Math.round(area2.builtUpDensity * 100)}%</strong>
          </div>
        </div>
      </div>

      <div className="comparison-diff-note">
        <CheckCircle2 size={16} className="text-emerald" />
        <span>
          <strong>Key Finding:</strong> {area2.area} is <strong>{Math.abs(area1.temperature - area2.temperature)}°C cooler</strong> due to higher tree canopy cover ({Math.round(area2.vegetationIndex * 100)}% vs {Math.round(area1.vegetationIndex * 100)}%).
        </span>
      </div>
    </div>
  );
};

export default AreaComparison;
