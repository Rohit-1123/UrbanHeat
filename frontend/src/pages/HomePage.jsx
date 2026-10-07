import React, { useState, useEffect } from 'react';
import LocationSearch from '../components/LocationSearch';
import HeatWave from '../components/HeatWave';
import { MapPin, Navigation, Map, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { fetchLiveWeather } from '../services/weatherService';
import { getRiskColor } from '../utils/riskCalculator';
import { SRM_CAMPUS } from '../config/campus';

const HEADLINES = {
  Low: ['Comfortable', 'across campus right now'],
  Moderate: ['Warm', 'keep to shaded paths'],
  High: ['Hot', 'limit time in direct sun'],
  Extreme: ['Extreme heat', 'avoid outdoor exertion'],
};

const EXPLORE = [
  { id: 'analytics', title: 'Trends & analytics', desc: 'How heat builds across the day' },
  { id: 'risk', title: 'Risk assessment', desc: 'What is driving the score here' },
  { id: 'simulator', title: 'What-if simulator', desc: 'Try more shade or greenery' },
  { id: 'recommendations', title: 'Cooling actions', desc: 'Ranked advice for this spot' },
];

const STEPS = [
  ['Pick a place', 'Search, tap the map or use your location.'],
  ['Read conditions', 'Temperature, humidity, UV, canopy and building density.'],
  ['Predict risk', 'A trained model scores heat risk from 0 to 100.'],
  ['Compare routes', 'Walking routes ranked by heat exposure.'],
  ['Act', 'Location-specific advice to stay cool.'],
];

const fmt = (n, unit = '') => (Number.isFinite(n) ? `${Math.round(n)}${unit}` : '—');

const HomePage = ({ currentLocation, onSelectLocation, onUseMyLocation, onNavigate }) => {
  const [syncingWeather, setSyncingWeather] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncWeather = async () => {
    setSyncingWeather(true);
    try {
      const lat = currentLocation?.latitude ?? currentLocation?.lat ?? SRM_CAMPUS.center[0];
      const lon = currentLocation?.longitude ?? currentLocation?.lon ?? SRM_CAMPUS.center[1];
      const live = await fetchLiveWeather(lat, lon);
      onSelectLocation({
        ...currentLocation,
        ...live,
        latitude: lat,
        longitude: lon,
        lat,
        lon,
        area: currentLocation?.area || 'SRM Institute Campus',
        city: currentLocation?.city || 'SRM Kattankulathur'
      });
    } finally {
      setSyncingWeather(false);
    }
  };

  // Load live weather once on first visit so the hero shows real readings.
  useEffect(() => {
    if (!currentLocation?.source) handleSyncWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loc = currentLocation || {};
  const score = loc.heatRiskScore ?? loc.heat_risk;
  const level = loc.riskLevel ?? loc.risk_level;
  const [headline, subline] = HEADLINES[level] || ['Checking', 'campus conditions'];
  const riskColor = getRiskColor(score ?? 0);
  const uv = loc.uvIndex ?? loc.uv_index;
  const ring = 2 * Math.PI * 21;

  const hours = (loc.forecast24h || []).filter((_, i) => i % 3 === 0).slice(0, 8);

  return (
    <div className="page-container home-sky">
      <section className="sky-hero">
        <div>
          <span className="sky-eyebrow">
            <MapPin size={14} />
            {loc.area || 'SRM Kattankulathur'} · {now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {currentLocation ? (
            <h1 className="sky-headline">{headline}<span>{subline}</span></h1>
          ) : (
            <h1 className="sky-headline sky-loading"><Loader2 size={28} className="animate-spin" /> Reading the sky…</h1>
          )}

          {loc.recommendedAction && <p className="sky-advice">{loc.recommendedAction}</p>}

          <div className="sky-actions">
            <button type="button" className="sky-btn primary" onClick={() => onNavigate('routes')}>
              <Navigation size={16} /> Find a cooler route
            </button>
            <button type="button" className="sky-btn" onClick={() => onNavigate('map')}>
              <Map size={16} /> Open heat map
            </button>
          </div>
        </div>

        <div className="sky-now">
          <div className="sky-temp" aria-label={`Temperature ${fmt(loc.temperature)} degrees Celsius`}>
            {fmt(loc.temperature)}<sup>°C</sup>
          </div>

          <dl className="sky-facts">
            <dt>Feels like</dt><dd>{fmt(loc.feelsLike, '°')}</dd>
            <dt>Humidity</dt><dd>{fmt(loc.humidity, '%')}</dd>
            <dt>UV index</dt><dd>{Number.isFinite(uv) ? uv : '—'}</dd>
            {Number.isFinite(loc.windSpeed) && <><dt>Wind</dt><dd>{loc.windSpeed} km/h</dd></>}
          </dl>

          <button type="button" className="sky-risk" onClick={() => onNavigate('risk')} aria-label="Open risk assessment">
            <svg className="sky-risk-ring" viewBox="0 0 48 48" aria-hidden="true">
              <circle className="track" cx="24" cy="24" r="21" />
              <circle
                className="value"
                cx="24"
                cy="24"
                r="21"
                stroke={riskColor}
                strokeDasharray={`${((score ?? 0) / 100) * ring} ${ring}`}
              />
            </svg>
            <span>
              <small>Heat risk</small>
              <strong>{Number.isFinite(score) ? `${Math.round(score)} · ${level}` : '—'}</strong>
            </span>
          </button>

          <div className="sky-meta-row">
            <span className={`sky-live-dot ${loc.isLive ? '' : 'off'}`} />
            <span>{loc.isLive ? `Live weather · ${loc.lastUpdated}` : 'Campus dataset'}</span>
            <button type="button" className="sky-icon-btn" onClick={handleSyncWeather} disabled={syncingWeather} title="Sync live weather from Open-Meteo">
              <RefreshCw size={12} className={syncingWeather ? 'animate-spin' : ''} />
              {syncingWeather ? 'Syncing' : 'Sync'}
            </button>
          </div>
        </div>
      </section>

      <HeatWave forecast={loc.forecast} />

      {hours.length > 0 && (
        <section aria-label="Next hours">
          <h2 className="sky-section-title">Next hours</h2>
          <div className="sky-hours">
            {hours.map((h, i) => (
              <div key={h.time} className="sky-hour">
                <span>{i === 0 ? 'Now' : h.time}</span>
                <strong>{h.temp}°</strong>
                <span>feels {h.feelsLike}°</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="sky-split">
        <div>
          <h2 className="sky-section-title">Check another place</h2>
          <LocationSearch
            currentLocation={currentLocation}
            onSelectLocation={onSelectLocation}
            onUseMyLocation={onUseMyLocation}
          />
        </div>

        <nav className="sky-links" aria-label="Explore">
          <h2 className="sky-section-title">Explore</h2>
          {EXPLORE.map((item) => (
            <button key={item.id} type="button" className="sky-link" onClick={() => onNavigate(item.id)}>
              <span>{item.title}<small>{item.desc}</small></span>
              <ArrowRight size={16} />
            </button>
          ))}
        </nav>
      </section>

      <section aria-label="How UrbanHeat works">
        <h2 className="sky-section-title">How it works</h2>
        <ol className="sky-steps">
          {STEPS.map(([title, desc]) => (
            <li key={title}><strong>{title}</strong>{desc}</li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default HomePage;
