import React, { useState } from 'react';
import RecommendationsPage from './RecommendationsPage';
import LearnPage from './LearnPage';
import AboutPage from './AboutPage';
import { ShieldCheck, BookOpen } from 'lucide-react';

// Two tabs: location-specific actions, and one Guide (heat science + about).
const InsightsPage = ({ currentLocation, initialTab = 'recommendations' }) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'recommendations' ? 'recommendations' : 'guide');

  return (
    <div className="page-container insights-hub-page">
      <div className="hub-header-container">
        <div>
          <h1 className="page-title">{activeTab === 'guide' ? 'Guide' : 'Cooling actions'}</h1>
          <p className="page-subtitle">
            {activeTab === 'guide'
              ? 'How urban heat works, and how UrbanHeat measures it.'
              : 'What to do about the heat where you are.'}
          </p>
        </div>

        <div className="hub-subtabs-pill-bar" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'recommendations'}
            className={`hub-tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <ShieldCheck size={16} />
            <span>Cooling actions</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'guide'}
            className={`hub-tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <BookOpen size={16} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <div className="hub-content-viewport">
        {activeTab === 'recommendations' && <RecommendationsPage currentLocation={currentLocation} />}
        {activeTab === 'guide' && (
          <>
            <LearnPage />
            <AboutPage />
          </>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
