import React, { useState } from 'react';
import { MOCK_RECOMMENDATIONS } from '../data/mockData';
import { ShieldCheck, Droplets, Sun, TreeDeciduous, Home, Leaf, GlassWater, Lightbulb, CheckCircle2 } from 'lucide-react';

const RecommendationsPage = ({ currentLocation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Personal Safety', 'Community Actions', 'Urban Planning Solutions'];

  const filtered = selectedCategory === 'All'
    ? MOCK_RECOMMENDATIONS
    : MOCK_RECOMMENDATIONS.filter((r) => r.category === selectedCategory);

  const getCategoryIcon = (cat) => {
    if (cat === 'Personal Safety') return ShieldCheck;
    if (cat === 'Community Actions') return TreeDeciduous;
    return Home;
  };

  return (
    <div className="page-container recommendations-page">
      <div className="page-header">
        <h1 className="page-title">Practical Heat Mitigation & Recommendations</h1>
        <p className="page-subtitle">Actionable solutions for personal health safety, community response, and sustainable urban infrastructure</p>
      </div>

      {/* Personalized Recommendation Banner for Selected Area */}
      <div className="personalized-banner-card">
        <div className="banner-icon-circle">
          <Lightbulb size={24} className="text-emerald" />
        </div>
        <div className="banner-text">
          <h3>Recommended for {currentLocation?.area || 'Your Selected Urban Zone'}</h3>
          <p>
            {currentLocation?.vegetationIndex < 0.3
              ? 'Low vegetation cover detected in this zone. Priority action: Expand urban tree canopy & shaded pedestrian sails.'
              : 'Moderate heat stress detected. Priority action: Maintain active hydration & avoid direct sunlight during peak 12 PM - 4 PM hours.'}
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="category-filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn-category-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="recommendations-grid">
        {filtered.map((rec) => {
          const Icon = getCategoryIcon(rec.category);

          return (
            <div key={rec.id} className="recommendation-card">
              <div className="rec-card-top">
                <div className="rec-icon-box">
                  <Icon size={20} className="text-emerald" />
                </div>
                <span className={`impact-badge ${rec.impactLevel.toLowerCase()}`}>
                  <CheckCircle2 size={12} /> Potential Impact: {rec.impactLevel}
                </span>
              </div>

              <h4 className="rec-title">{rec.title}</h4>
              <p className="rec-desc">{rec.description}</p>

              <div className="rec-card-footer">
                <span className="category-tag">{rec.category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsPage;
