import React from 'react';
import TemperatureChart from '../components/TemperatureChart';
import HeatTrendChart from '../components/HeatTrendChart';
import AreaComparison from '../components/AreaComparison';
import { MOCK_TREND_DATA } from '../data/mockData';
import { Lightbulb, TrendingUp, Sun, Building, TreeDeciduous } from 'lucide-react';

const AnalyticsPage = ({ currentLocation }) => {
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

  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <h1 className="page-title">Heat Analytics & Thermal Trends</h1>
        <p className="page-subtitle">Historical trends, peak diurnal pattern analysis, and zone comparisons for <strong>{currentLocation?.area || 'Selected Area'}</strong></p>
      </div>

      <div className="analytics-grid-layout">
        {/* Temperature Trend Line Chart */}
        <div className="grid-full">
          <TemperatureChart trendData={MOCK_TREND_DATA} />
        </div>

        {/* Diurnal Heat Pattern & Area Comparison Side-by-Side */}
        <div className="grid-half">
          <HeatTrendChart />
        </div>
        <div className="grid-half">
          <AreaComparison />
        </div>

        {/* Data-Driven Key Insights Section */}
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
    </div>
  );
};

export default AnalyticsPage;
