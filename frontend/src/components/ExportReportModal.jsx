import React from 'react';
import { X, Printer, Download, ShieldCheck, Thermometer, Droplets, TreeDeciduous, Building, AlertTriangle, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { calculateHeatRisk, getRiskColor } from '../utils/riskCalculator';

const ExportReportModal = ({ isOpen, onClose, locationData }) => {
  if (!isOpen) return null;

  const loc = locationData || {
    area: 'SRM Campus Urban Hub',
    city: 'SRM Kattankulathur',
    temperature: 34,
    humidity: 62,
    vegetationIndex: 0.35,
    builtUpDensity: 0.75,
    feelsLike: 39,
    surfaceTemp: 38.5,
    uvIndex: 8.5
  };

  const riskResult = calculateHeatRisk({
    temperature: loc.temperature,
    humidity: loc.humidity,
    vegetationIndex: loc.vegetationIndex,
    builtUpDensity: loc.builtUpDensity
  });

  const riskColor = getRiskColor(riskResult.score);
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const reportTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="report-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="report-modal-toolbar no-print">
          <div className="toolbar-left">
            <span className="toolbar-title">Heat Advisory Risk Bulletin</span>
            <span className="toolbar-badge">Ready for Export</span>
          </div>
          <div className="toolbar-actions">
            <button className="btn-print-action" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print / Save as PDF</span>
            </button>
            <button className="btn-modal-close" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="report-printable-sheet" id="printable-heat-bulletin">
          {/* Header */}
          <div className="bulletin-header">
            <div className="bulletin-brand">
              <div className="brand-badge-doc">URBANHEAT INTELLIGENCE REPORT</div>
              <h1 className="bulletin-title">Microclimate Thermal Vulnerability Assessment</h1>
              <p className="bulletin-meta">
                <MapPin size={14} className="inline-icon" /> <strong>{loc.area}</strong>, {loc.city} &nbsp;|&nbsp;
                <Calendar size={14} className="inline-icon" /> Issued: {reportDate} at {reportTime}
              </p>
            </div>
            <div className="bulletin-stamp">
              <span className="stamp-label">RISK STATUS</span>
              <span className="stamp-value" style={{ color: riskColor }}>
                {riskResult.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="bulletin-summary-grid">
            <div className="summary-stat-box">
              <span className="stat-label">Heat Risk Score</span>
              <span className="stat-value" style={{ color: riskColor }}>{riskResult.score} / 100</span>
              <span className="stat-sub">{riskResult.riskLevel} Thermal Hazard</span>
            </div>

            <div className="summary-stat-box">
              <span className="stat-label">Ambient Temperature</span>
              <span className="stat-value">{loc.temperature}°C</span>
              <span className="stat-sub">Feels Like: {loc.feelsLike || (loc.temperature + 5)}°C</span>
            </div>

            <div className="summary-stat-box">
              <span className="stat-label">Relative Humidity</span>
              <span className="stat-value">{loc.humidity}%</span>
              <span className="stat-sub">High Moisture Index</span>
            </div>

            <div className="summary-stat-box">
              <span className="stat-label">Tree Canopy (NDVI)</span>
              <span className="stat-value">{Math.round((loc.vegetationIndex || 0.35) * 100)}%</span>
              <span className="stat-sub">Built Density: {Math.round((loc.builtUpDensity || 0.75) * 100)}%</span>
            </div>
          </div>

          {/* Environmental Analysis Section */}
          <div className="bulletin-section">
            <h2 className="bulletin-section-heading">1. Environmental Factor Breakdown</h2>
            <table className="bulletin-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Observed Value</th>
                  <th>Physical Risk Contribution</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Ambient Air Temperature</strong></td>
                  <td>{loc.temperature}°C</td>
                  <td>Elevated convective thermal transfer to pedestrian zone</td>
                  <td><span className="badge-bulletin warn">Active Heat Spike</span></td>
                </tr>
                <tr>
                  <td><strong>Apparent Surface Temp (LST)</strong></td>
                  <td>{loc.surfaceTemp || 38.5}°C</td>
                  <td>Asphalt and concrete solar absorption re-radiation</td>
                  <td><span className="badge-bulletin warn">High Re-Radiation</span></td>
                </tr>
                <tr>
                  <td><strong>Relative Humidity</strong></td>
                  <td>{loc.humidity}%</td>
                  <td>Inhibits evaporative perspiration efficiency</td>
                  <td><span className="badge-bulletin info">Moderate Moisture</span></td>
                </tr>
                <tr>
                  <td><strong>Vegetation Green Cover</strong></td>
                  <td>{Math.round((loc.vegetationIndex || 0.35) * 100)}% NDVI</td>
                  <td>Natural evapotranspiration cooling capacity</td>
                  <td><span className="badge-bulletin info">Canopy Deficit</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Public Safety & Mitigation Guidelines */}
          <div className="bulletin-section">
            <h2 className="bulletin-section-heading">2. Recommended Community Safety Actions</h2>
            <div className="bulletin-recommendations-list">
              <div className="bulletin-rec-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <div>
                  <strong>Mandatory Hydration Intervals:</strong> Drink 250–300ml of mineralized water every 45 minutes of outdoor activity.
                </div>
              </div>
              <div className="bulletin-rec-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <div>
                  <strong>Shaded Corridor Prioritization:</strong> Pedestrians should utilize green-canopied side streets (reducing thermal radiation exposure by ~3.2°C).
                </div>
              </div>
              <div className="bulletin-rec-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <div>
                  <strong>Workplace & Athletic Rest Periods:</strong> Enforce 15-minute shaded rest breaks for outdoor laborers and campus students between 11:30 AM and 3:30 PM.
                </div>
              </div>
            </div>
          </div>

          {/* Footer of Bulletin */}
          <div className="bulletin-doc-footer">
            <div className="disclaimer-text">
              Generated by UrbanHeat Platform · Atmospheric & Microclimate Modeling System · NOAA Rothfusz Heat Engine
            </div>
            <div className="page-number">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
