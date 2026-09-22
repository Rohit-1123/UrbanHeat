import React, { useState } from 'react';
import TemperatureChart from '../components/TemperatureChart';
import HeatTrendChart from '../components/HeatTrendChart';
import AreaComparison from '../components/AreaComparison';
import SimulatorView from '../components/SimulatorView';
import ExportReportModal from '../components/ExportReportModal';
import { MOCK_TREND_DATA } from '../data/mockData';
import { calculateHeatRisk, getRiskColor } from '../utils/riskCalculator';
import {
  Lightbulb,
  TrendingUp,
  Sun,
  Building,
  TreeDeciduous,
  BarChart3,
  ShieldAlert,
  SlidersHorizontal,
  FileDown,
  Thermometer,
  Droplets,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react';

const AnalyticsPage = ({ currentLocation, initialTab = 'trends' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const loc = currentLocation || {
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

  const insights = [
    {
      id: 1,
      icon: Sun,
      color: '#f59e0b',
      title: 'Afternoon Heat Spikes',
      desc: 'Peak thermal intensity is consistently observed between 12:00 PM and 3:30 PM across urban corridors.'
    },
    {
      id: 2,
      icon: TreeDeciduous,
      color: '#10b981',
      title: 'Canopy Cooling Effect',
      desc: 'Areas with >60% tree canopy (NDVI) maintain surface temperatures 4.2°C lower than adjacent concrete roads.'
    },
    {
      id: 3,
      icon: Building,
      color: '#ef4444',
      title: 'Nocturnal Heat Retention',
      desc: 'High building density zones radiate stored thermal energy back into the atmosphere at night, delaying evening cooling.'
    }
  ];

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
    { time: '09:00 PM', risk: 'Moderate', score: 35, color: '#eab308' }
  ];

  return (
    <div className="page-container analytics-page-hub">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="hub-header-container">
        <div>
          <h1 className="page-title">Analytics, Risk & Climate Modeling</h1>
          <p className="page-subtitle">
            Comprehensive microclimate data, vulnerability scoring, and ML simulation for <strong>{loc.area}</strong>
          </p>
        </div>

        {/* Sub-Tab Switcher Pills */}
        <div className="hub-subtabs-pill-bar">
          <button
            className={`hub-tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            <BarChart3 size={16} />
            <span>Trends & Analytics</span>
          </button>

          <button
            className={`hub-tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            <ShieldAlert size={16} />
            <span>Risk Vulnerability</span>
          </button>

          <button
            className={`hub-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <SlidersHorizontal size={16} />
            <span>ML Simulator</span>
          </button>
        </div>
      </div>

      {/* 1. Trends & Analytics Sub-Tab */}
      {activeTab === 'trends' && (
        <div className="analytics-grid-layout">
          <div className="grid-full">
            <TemperatureChart trendData={MOCK_TREND_DATA} />
          </div>

          <div className="grid-half">
            <HeatTrendChart />
          </div>
          <div className="grid-half">
            <AreaComparison />
          </div>

          <div className="grid-full section-block">
            <div className="section-header-inline">
              <div>
                <h2>Key Environmental Insights</h2>
                <p>Generated dynamically based on land surface temperature and vegetation coverage analytics.</p>
              </div>
            </div>

            <div className="insights-cards-grid">
              {insights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="insight-card">
                    <div className="insight-icon" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      <Icon size={20} />
                    </div>
                    <div className="insight-body">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Risk Vulnerability Assessment Sub-Tab */}
      {activeTab === 'risk' && (
        <div className="risk-grid-layout">
          <div className="page-header-row grid-full">
            <div>
              <h2 className="section-title-md">Vulnerability & Health Impact Indicator</h2>
              <p className="subtext">Physiological heat stress modeling based on NOAA Rothfusz equations</p>
            </div>
            <button className="btn-export-report" onClick={() => setReportModalOpen(true)}>
              <FileDown size={17} />
              <span>Export Heat Bulletin</span>
            </button>
          </div>

          {/* Risk Score Indicator Card */}
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

          {/* Factors Breakdown */}
          <div className="card-full section-block">
            <h3 className="section-subtitle">Environmental Contributing Risk Factors</h3>
            <div className="factors-grid">
              <div className="factor-card">
                <div className="factor-header">
                  <Thermometer size={18} className="text-red" />
                  <span>Ambient Air Temp</span>
                </div>
                <div className="factor-val">{loc.temperature}°C</div>
                <p className="factor-desc">Elevated air temperature accelerates convective heat buildup.</p>
              </div>

              <div className="factor-card">
                <div className="factor-header">
                  <Droplets size={18} className="text-blue" />
                  <span>Relative Humidity</span>
                </div>
                <div className="factor-val">{loc.humidity}%</div>
                <p className="factor-desc">Higher moisture restricts evaporative cooling efficiency.</p>
              </div>

              <div className="factor-card">
                <div className="factor-header">
                  <TreeDeciduous size={18} className="text-emerald" />
                  <span>Tree Canopy (NDVI)</span>
                </div>
                <div className="factor-val">{Math.round((loc.vegetationIndex || 0.35) * 100)}%</div>
                <p className="factor-desc">Natural shade protection and evapotranspiration capacity.</p>
              </div>

              <div className="factor-card">
                <div className="factor-header">
                  <Building size={18} className="text-purple" />
                  <span>Built Density</span>
                </div>
                <div className="factor-val">{Math.round((loc.builtUpDensity || 0.75) * 100)}%</div>
                <p className="factor-desc">Dense concrete & asphalt surfaces absorb and re-radiate heat.</p>
              </div>
            </div>
          </div>

          {/* Timeline & Vulnerable Groups */}
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
                    <div className="progress-bar-fill" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="risk-lbl" style={{ color: item.color }}>{item.risk} ({item.score}/100)</span>
                </div>
              ))}
            </div>
          </div>

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
      )}

      {/* 3. ML Simulator Sub-Tab */}
      {activeTab === 'simulator' && (
        <div className="simulator-tab-content">
          <SimulatorView />
        </div>
      )}

      {/* Export Report Bulletin Modal */}
      <ExportReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        locationData={loc}
      />
    </div>
  );
};

export default AnalyticsPage;
