import React, { useState } from 'react';
import RecommendationsPage from './RecommendationsPage';
import LearnPage from './LearnPage';
import AboutPage from './AboutPage';
import { ShieldCheck, BookOpen, Info, Sparkles } from 'lucide-react';

const InsightsPage = ({ currentLocation, initialTab = 'recommendations' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="page-container insights-hub-page">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="hub-header-container">
        <div>
          <h1 className="page-title">Climate Insights, Science & Actions</h1>
          <p className="page-subtitle">
            Actionable mitigation strategies, urban heat island science, and platform documentation
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="hub-subtabs-pill-bar">
          <button
            className={`hub-tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <ShieldCheck size={16} />
            <span>Mitigation Actions</span>
          </button>

          <button
            className={`hub-tab-btn ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            <BookOpen size={16} />
            <span>UHI Science</span>
          </button>

          <button
            className={`hub-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Info size={16} />
            <span>About UrbanHeat</span>
          </button>
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="hub-content-viewport">
        {activeTab === 'recommendations' && (
          <RecommendationsPage currentLocation={currentLocation} />
        )}

        {activeTab === 'learn' && (
          <LearnPage />
        )}

        {activeTab === 'about' && (
          <AboutPage />
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
