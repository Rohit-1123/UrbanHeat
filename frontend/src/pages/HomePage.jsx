import React, { useState, useEffect } from 'react';
import LocationSearch from '../components/LocationSearch';
import HeatOverviewCard from '../components/HeatOverviewCard';
import InstallAppButton from '../components/InstallAppButton';
import { MapPin, Database, Cpu, ShieldAlert, Lightbulb, ArrowRight, Sparkles, Map, Loader2, Navigation, Droplets, Thermometer } from 'lucide-react';
import { fetchLiveWeather } from '../services/weatherService';
import { getRiskColor } from '../utils/riskCalculator';

const HomePage = ({ currentLocation, onSelectLocation, onUseMyLocation, onNavigate }) => {
  const [syncingWeather, setSyncingWeather] = useState(false);

  const handleSyncWeather = async () => {
    setSyncingWeather(true);
    try {
      const lat = currentLocation?.latitude ?? currentLocation?.lat ?? 12.8232;
      const lon = currentLocation?.longitude ?? currentLocation?.lon ?? 80.0450;
      const live = await fetchLiveWeather(lat, lon);
      onSelectLocation({
        ...currentLocation,
        ...live,
        // fetchLiveWeather's response carries no coordinates, and currentLocation
        // may still be null at auto-load time (this effect can fire before the
        // app has set an initial location) — always set these explicitly so the
        // map/route views never receive a location with missing lat/lon.
        latitude: lat,
        longitude: lon,
        lat,
        lon,
        area: currentLocation?.area || 'Local Area',
        city: currentLocation?.city || 'SRM Kattankulathur'
      });
    } finally {
      setSyncingWeather(false);
    }
  };

  // Auto-load live weather for the default/current location on first mount,
  // so the overview card shows real data without requiring a manual sync click.
  useEffect(() => {
    if (!currentLocation?.source) {
      handleSyncWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    {
      num: 1,
      title: 'Select Location',
      desc: 'Choose an SRM campus zone to inspect microclimate data.',
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

  // Real fields only — mirrors the field-fallback pattern already used by
  // HeatOverviewCard/HeatAlertBanner. No fabricated defaults: undefined
  // fields render as "—" rather than a made-up number.
  const temperature = currentLocation?.temperature;
  const heatRiskScore = currentLocation?.heatRiskScore ?? currentLocation?.heat_risk;
  const riskLevel = currentLocation?.riskLevel ?? currentLocation?.risk_level;
  const humidity = currentLocation?.humidity;
  const riskColor = getRiskColor(heatRiskScore ?? 0);

  return (
    <div className="page-container home-page">
      {/* Mobile-only compact status summary — shown instead of the desktop
          hero at phone widths (see .mobile-home-summary in App.css). Reads
          the same currentLocation prop, no separate data fetch. */}
      <section className="mobile-home-summary">
        <div className="mobile-home-location">
          <MapPin size={15} className="text-emerald" />
          <span>{currentLocation?.area || 'SRM Kattankulathur Campus'}</span>
        </div>

        {!currentLocation ? (
          <div className="mobile-home-status-card mobile-home-status-loading">
            <Loader2 size={20} className="animate-spin text-emerald" />
            <span>Loading live environmental data...</span>
          </div>
        ) : (
          <div className="mobile-home-status-card">
            <div className="mobile-home-status-top">
              <div className="mobile-home-metric">
                <Thermometer size={18} className="text-red" />
                <span className="mobile-home-metric-val">{Number.isFinite(temperature) ? `${temperature}°C` : '—'}</span>
              </div>
              <div className="mobile-home-metric">
                <Droplets size={18} className="text-blue" />
                <span className="mobile-home-metric-val">{Number.isFinite(humidity) ? `${humidity}%` : '—'}</span>
              </div>
              <span
                className="mobile-home-risk-pill"
                style={{ backgroundColor: `${riskColor}20`, color: riskColor, borderColor: `${riskColor}40` }}
              >
                {riskLevel || 'Unknown'} Risk
              </span>
            </div>

            {currentLocation?.recommendedAction && (
              <p className="mobile-home-action">{currentLocation.recommendedAction}</p>
            )}
          </div>
        )}

        <div className="mobile-home-cta-row">
          <button className="mobile-home-cta-primary" onClick={() => onNavigate('routes')}>
            <Navigation size={17} />
            <span>Find a Cooler Route</span>
          </button>
          <button className="mobile-home-cta-secondary" onClick={() => onNavigate('map')}>
            <Map size={17} />
            <span>Open Heat Map</span>
          </button>
        </div>

        <InstallAppButton variant="banner" />
      </section>

      {/* Hero Section (desktop) */}
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
          <h2>Explore SRM Campus</h2>
          <p>Inspect heat conditions and land surface temperatures across the SRM Institute campus.</p>
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
            <div className="section-title-tag-wrap">
              <h2>Current Heat Overview</h2>
              {currentLocation?.source && (
                <span className="source-live-badge">
                  <span className="live-dot" /> {currentLocation.source}
                </span>
              )}
            </div>
            <p>Summary for <strong>{currentLocation?.area || 'Selected Urban Zone'}</strong> ({currentLocation?.city || 'City'})</p>
          </div>

          <div className="header-actions-wrap">
            <button
              className="btn-sync-live"
              onClick={handleSyncWeather}
              disabled={syncingWeather}
              title="Sync real-time atmospheric data from Open-Meteo"
            >
              {syncingWeather ? (
                <>
                  <Loader2 size={15} className="animate-spin text-emerald" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Sync Live Weather</span>
                </>
              )}
            </button>

            <button className="btn-text-link-lg" onClick={() => onNavigate('analytics')}>
              <span>Detailed Analytics</span>
              <ArrowRight size={16} />
            </button>
          </div>
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
