import React from 'react';
import LocationSearch from '../components/LocationSearch';
import HeatOverviewCard from '../components/HeatOverviewCard';
import { MapPin, Database, Cpu, ShieldAlert, Lightbulb, ArrowRight, Sparkles, Map } from 'lucide-react';

const HomePage = ({ currentLocation, onSelectLocation, onUseMyLocation, onNavigate }) => {
  const steps = [
    {
      num: 1,
      title: 'Select Location',
      desc: 'Search your city or urban zone to inspect microclimate data.',
      icon: MapPin
    },
    {
      num: 2,
      title: 'Collect Environmental Data',
      desc: 'Retrieves satellite NDVI vegetation, building density, & temperature metrics.',
      icon: Database
    },
    {
      num: 3,
      title: 'Analyze Heat Conditions',
      desc: 'Evaluates localized thermal radiation spikes and surface heat retention.',
      icon: Cpu
    },
    {
      num: 4,
      title: 'Assess Heat Risk',
      desc: 'Calculates normalized 0–100 risk scores for health vulnerability.',
      icon: ShieldAlert
    },
    {
      num: 5,
      title: 'Provide Recommendations',
      desc: 'Delivers actionable personal safety guidelines & urban greening solutions.',
      icon: Lightbulb
    }
  ];

  return (
    <div className="page-container home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-emerald" />
            <span>Smart Urban Climate Intelligence</span>
          </div>

          <h1 className="hero-title">
            Understand Your City's Heat.<br />
            <span className="text-gradient">Protect Your Community.</span>
          </h1>

          <p className="hero-subheading">
            Monitor urban heat conditions, identify high-risk thermal zones, analyze microclimate patterns, and discover long-term solutions for a cooler and more sustainable city.
          </p>

          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => onNavigate('map')}>
              <Map size={18} />
              <span>Explore Heat Map</span>
            </button>

            <button className="btn-hero-secondary" onClick={() => onNavigate('risk')}>
              <ShieldAlert size={18} />
              <span>Check Heat Risk</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Location Search Section */}
      <section className="section-block">
        <div className="section-header-centered">
          <h2>Search Your City</h2>
          <p>Explore microclimate heat conditions and land surface temperatures for any urban area.</p>
        </div>

        <LocationSearch
          currentLocation={currentLocation}
          onSelectLocation={onSelectLocation}
          onUseMyLocation={onUseMyLocation}
        />
      </section>

      {/* Current Heat Overview Cards */}
      <section className="section-block">
        <div className="section-header-inline">
          <div>
            <h2>Current Heat Overview</h2>
            <p>Summary for <strong>{currentLocation?.area || 'Selected Urban Zone'}</strong> ({currentLocation?.city || 'City'})</p>
          </div>

          <button className="btn-text-link-lg" onClick={() => onNavigate('analytics')}>
            <span>Detailed Analytics</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <HeatOverviewCard locationData={currentLocation} onNavigate={onNavigate} />
      </section>

      {/* How It Works Section */}
      <section className="section-block how-it-works-section">
        <div className="section-header-centered">
          <h2>How UrbanHeat Works</h2>
          <p>A 5-step analytical journey from environmental data collection to localized cooling actions.</p>
        </div>

        <div className="how-it-works-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="process-step-card">
                <div className="step-badge">{step.num}</div>
                <div className="step-icon-wrapper">
                  <Icon size={22} className="text-emerald" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
