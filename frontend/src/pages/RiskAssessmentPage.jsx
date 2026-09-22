import React, { useState } from 'react';
import { calculateHeatRisk, getRiskColor } from '../utils/riskCalculator';
import { ShieldAlert, Thermometer, Droplets, TreeDeciduous, Building, Users, Clock, AlertTriangle, FileDown, Printer } from 'lucide-react';
import ExportReportModal from '../components/ExportReportModal';

const RiskAssessmentPage = ({ currentLocation }) => {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const loc = currentLocation || {
    temperature: 34,
    humidity: 62,
    vegetationIndex: 0.35,
    builtUpDensity: 0.75,
    area: 'SRM Katangulathur Hub',
    city: 'SRM Kattankulathur'
  };

  const riskResult = calculateHeatRisk({
    temperature: loc.temperature,
    humidity: loc.humidity,
    vegetationIndex: loc.vegetationIndex,
    builtUpDensity: loc.builtUpDensity
  });

  const riskColor = getRiskColor(riskResult.score);

  const vulnerableGroups = [
    {
      title: 'Children & Infants',
      desc: 'Younger bodies produce more metabolic heat per pound and adapt slower to sudden ambient temperature spikes.',
      advice: 'Ensure frequent hydration and keep in air-conditioned or shaded play spaces during peak heat hours.'
    },
    {
      title: 'Older Adults (65+)',
      desc: 'Aging reduces physiological heat dissipation efficiency and perspiration response, elevating heat stress risks.',
      advice: 'Check in regularly on elderly relatives. Maintain indoor temperature below 28°C.'
    },
    {
      title: 'Outdoor & Industrial Workers',
      desc: 'Sustained heavy physical labor under direct sunlight rapidly exhausts body electrolytes.',
      advice: 'Mandate 15-minute rest breaks every hour in shade with electrolyte hydration.'
    }
  ];

  const riskTimeline = [
    { time: '09:00 AM', risk: 'Moderate', score: 45, color: '#eab308' },
    { time: '12:00 PM', risk: 'High', score: 78, color: '#f97316' },
    { time: '03:00 PM', risk: 'Severe', score: 88, color: '#ef4444' },
    { time: '06:00 PM', risk: 'High', score: 65, color: '#f97316' },
    { time: '09:00 PM', risk: 'Moderate', score: 35, color: '#eab308' },
  ];

  return (
    <div className="page-container risk-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Heat Risk & Health Vulnerability Assessment</h1>
          <p className="page-subtitle">Evaluation of environmental heat stress, contributing factors, and vulnerable population guidelines for <strong>{loc.area}</strong></p>
        </div>

        <button className="btn-export-report" onClick={() => setReportModalOpen(true)}>
          <FileDown size={18} />
          <span>Export Heat Bulletin</span>
        </button>
      </div>

      <ExportReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        locationData={loc}
      />

      <div className="risk-grid-layout">
        {/* Heat Risk Score Indicator Card */}
        <div className="card-full risk-score-card">
          <div className="score-badge-circle" style={{ borderColor: riskColor, color: riskColor }}>
            <span className="num">{riskResult.score}</span>
            <span className="denom">/ 100</span>
          </div>

          <div className="score-info">
            <div className="status-tag" style={{ backgroundColor: `${riskColor}20`, color: riskColor, borderColor: riskColor }}>
              <ShieldAlert size={16} />
              <span>{riskResult.riskLevel} Heat Risk Status</span>
            </div>
            <h2>Environmental Vulnerability Index</h2>
            <p className="score-desc">
              Current ambient conditions may increase the risk of heat exhaustion and physiological thermal stress during prolonged outdoor exposure.
            </p>
            <div className="disclaimer-note">
              <AlertTriangle size={14} className="text-amber" />
              <span>Note: This is an application-generated environmental risk indicator based on ambient microclimate data.</span>
            </div>
          </div>
        </div>

        {/* Contributing Factors Breakdown */}
        <div className="card-full section-block">
          <h3 className="section-subtitle">Environmental Contributing Risk Factors</h3>
          <div className="factors-grid">
            <div className="factor-card">
              <div className="factor-header">
                <Thermometer size={18} className="text-red" />
                <span>Ambient Air Temp</span>
              </div>
              <div className="factor-val">{loc.temperature}°C</div>
              <p className="factor-desc">Elevated air temperature accelerates heat buildup in urban corridors.</p>
            </div>

            <div className="factor-card">
              <div className="factor-header">
                <Droplets size={18} className="text-blue" />
                <span>Relative Humidity</span>
              </div>
              <div className="factor-val">{loc.humidity}%</div>
              <p className="factor-desc">Higher moisture restricts body sweat evaporation, increasing perceived heat index.</p>
            </div>

            <div className="factor-card">
              <div className="factor-header">
                <TreeDeciduous size={18} className="text-emerald" />
                <span>Tree Canopy (NDVI)</span>
              </div>
              <div className="factor-val">{Math.round(loc.vegetationIndex * 100)}%</div>
              <p className="factor-desc">Limited green canopy cover reduces natural shade protection and evapotranspiration.</p>
            </div>

            <div className="factor-card">
              <div className="factor-header">
                <Building size={18} className="text-purple" />
                <span>Built Concrete Density</span>
              </div>
              <div className="factor-val">{Math.round(loc.builtUpDensity * 100)}%</div>
              <p className="factor-desc">Dense concrete & asphalt surfaces absorb high solar radiation during daylight hours.</p>
            </div>
          </div>
        </div>

        {/* Daytime Risk Timeline */}
        <div className="card-half section-block">
          <div className="card-header-icon">
            <Clock size={20} className="text-emerald" />
            <h3>Daytime Risk Progression Timeline</h3>
          </div>

          <div className="risk-timeline-list">
            {riskTimeline.map((item, idx) => (
              <div key={idx} className="timeline-row">
                <span className="time-lbl">{item.time}</span>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${item.score}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="risk-lbl" style={{ color: item.color }}>{item.risk} ({item.score}/100)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerable Groups Guidance */}
        <div className="card-half section-block">
          <div className="card-header-icon">
            <Users size={20} className="text-blue" />
            <h3>Vulnerable Group Advisory</h3>
          </div>

          <div className="vulnerable-list">
            {vulnerableGroups.map((group, idx) => (
              <div key={idx} className="vulnerable-card">
                <h4>{group.title}</h4>
                <p className="vul-desc">{group.desc}</p>
                <div className="vul-advice">
                  <strong>Safety Tip:</strong> {group.advice}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentPage;
