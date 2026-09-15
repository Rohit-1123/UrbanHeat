import React, { useState } from 'react';
import { MapPin, Navigation, ArrowUpDown, Target, Sparkles, Loader2, Leaf, Shield, Zap, CheckCircle, X, Compass, ChevronRight } from 'lucide-react';
import MapView from './MapView';
import HeatProfileChart from './HeatProfileChart';
import ArcGauge from './ArcGauge';

const RouteFinderView = ({
  startCoords,
  endCoords,
  routesData,
  loading,
  error,
  selectedRouteType,
  onSelectRouteType,
  onSearch,
  onUseLocation,
  onSelectPreset
}) => {
  const [startLat, setStartLat] = useState(startCoords.lat.toString());
  const [startLon, setStartLon] = useState(startCoords.lon.toString());
  const [endLat, setEndLat] = useState(endCoords.lat.toString());
  const [endLon, setEndLon] = useState(endCoords.lon.toString());
  const [clickMode, setClickMode] = useState('end'); // 'start' | 'end'
  const [showNavModal, setShowNavModal] = useState(false);

  const presets = [
    { name: 'SRM Main Gate → Kattankulathur Station', start: { lat: 12.8232, lon: 80.0450 }, end: { lat: 12.8265, lon: 80.0382 } },
    { name: 'Potheri Lake → SRM Tech Park', start: { lat: 12.8125, lon: 80.0350 }, end: { lat: 12.8240, lon: 80.0485 } },
    { name: 'Estancia IT Park → Guduvancheri Junction', start: { lat: 12.8350, lon: 80.0550 }, end: { lat: 12.8480, lon: 80.0620 } }
  ];

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSearch({
      start_lat: parseFloat(startLat),
      start_lon: parseFloat(startLon),
      end_lat: parseFloat(endLat),
      end_lon: parseFloat(endLon)
    });
  };

  const handleSwap = () => {
    const tempLat = startLat;
    const tempLon = startLon;
    setStartLat(endLat);
    setStartLon(endLon);
    setEndLat(tempLat);
    setEndLon(tempLon);

    onSearch({
      start_lat: parseFloat(endLat),
      start_lon: parseFloat(endLon),
      end_lat: parseFloat(tempLat),
      end_lon: parseFloat(tempLon)
    });
  };

  const handleMapClick = (coords) => {
    if (clickMode === 'start') {
      setStartLat(coords.lat.toFixed(4));
      setStartLon(coords.lon.toFixed(4));
      onSearch({
        start_lat: coords.lat,
        start_lon: coords.lon,
        end_lat: parseFloat(endLat),
        end_lon: parseFloat(endLon)
      });
    } else {
      setEndLat(coords.lat.toFixed(4));
      setEndLon(coords.lon.toFixed(4));
      onSearch({
        start_lat: parseFloat(startLat),
        start_lon: parseFloat(startLon),
        end_lat: coords.lat,
        end_lon: coords.lon
      });
    }
  };

  const happiest = routesData?.coolest_route || {
    route_name: 'Coolest Route',
    duration_minutes: 15,
    distance_km: 2.4,
    average_heat_risk: 34,
    maximum_heat_risk: 48,
    heat_risk_level: 'Low',
    shaded_area_percentage: 72,
    heat_profile: []
  };

  const balanced = routesData?.balanced_route || {
    route_name: 'Balanced Route',
    duration_minutes: 12,
    distance_km: 2.1,
    average_heat_risk: 56,
    maximum_heat_risk: 68,
    heat_risk_level: 'Moderate',
    shaded_area_percentage: 48,
    heat_profile: []
  };

  const fastest = routesData?.fastest_route || {
    route_name: 'Fastest Route',
    duration_minutes: 10,
    distance_km: 1.8,
    average_heat_risk: 78,
    maximum_heat_risk: 85,
    heat_risk_level: 'High',
    shaded_area_percentage: 23,
    heat_profile: []
  };

  const getActiveRoute = (type) => type === 'coolest' ? happiest : type === 'balanced' ? balanced : fastest;
  const activeRoute = getActiveRoute(selectedRouteType);

  return (
    <div className="view-container split-view">
      {/* Left Control & Route Selection Panel */}
      <div className="side-panel">
        <div className="section-card">
          <div className="section-card-title">
            <Navigation size={18} className="text-emerald" />
            <span>Search Cool Routes</span>
          </div>

          {/* Preset Selector */}
          <div className="preset-row">
            <span className="label-sm">Presets:</span>
            <select
              className="select-light"
              onChange={(e) => {
                const selected = presets[e.target.value];
                if (selected) {
                  setStartLat(selected.start.lat.toString());
                  setStartLon(selected.start.lon.toString());
                  setEndLat(selected.end.lat.toString());
                  setEndLon(selected.end.lon.toString());
                  onSelectPreset(selected);
                }
              }}
            >
              {presets.map((p, idx) => (
                <option key={idx} value={idx}>{p.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="form-clean">
            <div className="input-field-group">
              <div className="field-header">
                <span className="field-label green">🟢 Start Location</span>
                <button type="button" className="btn-link" onClick={onUseLocation}>
                  <Target size={12} /> My Location
                </button>
              </div>
              <div className="coord-input-row">
                <MapPin size={16} className="text-emerald" />
                <input
                  type="number"
                  step="any"
                  className="input-light"
                  placeholder="Lat"
                  value={startLat}
                  onChange={(e) => setStartLat(e.target.value)}
                  required
                />
                <span className="sep">,</span>
                <input
                  type="number"
                  step="any"
                  className="input-light"
                  placeholder="Lon"
                  value={startLon}
                  onChange={(e) => setStartLon(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="swap-center">
              <button type="button" className="btn-swap-light" onClick={handleSwap}>
                <ArrowUpDown size={13} /> Swap
              </button>
            </div>

            <div className="input-field-group">
              <div className="field-header">
                <span className="field-label red">🔴 Destination</span>
              </div>
              <div className="coord-input-row">
                <MapPin size={16} className="text-red" />
                <input
                  type="number"
                  step="any"
                  className="input-light"
                  placeholder="Lat"
                  value={endLat}
                  onChange={(e) => setEndLat(e.target.value)}
                  required
                />
                <span className="sep">,</span>
                <input
                  type="number"
                  step="any"
                  className="input-light"
                  placeholder="Lon"
                  value={endLon}
                  onChange={(e) => setEndLon(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="map-picker-toggle">
              <span className="label-sm">Click map sets:</span>
              <button
                type="button"
                className={`btn-mode-toggle ${clickMode === 'start' ? 'active-green' : ''}`}
                onClick={() => setClickMode('start')}
              >
                Start Point
              </button>
              <button
                type="button"
                className={`btn-mode-toggle ${clickMode === 'end' ? 'active-red' : ''}`}
                onClick={() => setClickMode('end')}
              >
                Destination
              </button>
            </div>

            <button type="submit" className="btn-primary-emerald" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Computing Routes...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Find Coolest Route
                </>
              )}
            </button>
          </form>
        </div>

        {/* Route Cards */}
        <div className="routes-list">
          <h3 className="subheading-light">Route Recommendations</h3>

          {/* Coolest Route */}
          <div
            className={`route-card-light coolest ${selectedRouteType === 'coolest' ? 'active' : ''}`}
            onClick={() => onSelectRouteType('coolest')}
          >
            <div className="card-top">
              <div className="card-title-row">
                <Leaf size={16} className="text-emerald" />
                <span className="route-name green">Coolest Route</span>
              </div>
              <span className="badge-green"><CheckCircle size={11} /> Recommended</span>
            </div>
            <div className="stats-row">
              <div><strong>⏱️ {happiest.duration_minutes} min</strong></div>
              <div>🛣️ {happiest.distance_km} km</div>
              <div className="text-emerald"><strong>🌡️ {happiest.average_heat_risk}/100 Risk</strong></div>
              <div className="text-emerald">🍃 {happiest.shaded_area_percentage}% Shade</div>
            </div>
          </div>

          {/* Balanced Route */}
          <div
            className={`route-card-light balanced ${selectedRouteType === 'balanced' ? 'active' : ''}`}
            onClick={() => onSelectRouteType('balanced')}
          >
            <div className="card-top">
              <div className="card-title-row">
                <Shield size={16} className="text-blue" />
                <span className="route-name blue">Balanced Route</span>
              </div>
            </div>
            <div className="stats-row">
              <div><strong>⏱️ {balanced.duration_minutes} min</strong></div>
              <div>🛣️ {balanced.distance_km} km</div>
              <div className="text-blue"><strong>🌡️ {balanced.average_heat_risk}/100 Risk</strong></div>
              <div className="text-blue">🍃 {balanced.shaded_area_percentage}% Shade</div>
            </div>
          </div>

          {/* Fastest Route */}
          <div
            className={`route-card-light fastest ${selectedRouteType === 'fastest' ? 'active' : ''}`}
            onClick={() => onSelectRouteType('fastest')}
          >
            <div className="card-top">
              <div className="card-title-row">
                <Zap size={16} className="text-red" />
                <span className="route-name red">Fastest Route</span>
              </div>
            </div>
            <div className="stats-row">
              <div><strong>⏱️ {fastest.duration_minutes} min</strong></div>
              <div>🛣️ {fastest.distance_km} km</div>
              <div className="text-red"><strong>🌡️ {fastest.average_heat_risk}/100 Risk</strong></div>
              <div className="text-red">🍃 {fastest.shaded_area_percentage}% Shade</div>
            </div>
          </div>
        </div>

        {/* Heat Risk Meter & Profile */}
        <div className="section-card">
          <div className="gauge-profile-row">
            <ArcGauge score={activeRoute.average_heat_risk} />
            <div className="profile-chart-box">
              <div className="section-card-title">
                <span>Thermal Stress Profile</span>
              </div>
              <HeatProfileChart
                profile={activeRoute.heat_profile}
                color={selectedRouteType === 'coolest' ? '#10b981' : selectedRouteType === 'balanced' ? '#3b82f6' : '#ef4444'}
                height={80}
              />
            </div>
          </div>
        </div>

        {/* Navigation Action Button */}
        <button
          className="btn-start-nav-emerald"
          onClick={() => setShowNavModal(true)}
        >
          <Navigation size={16} />
          Start Turn-by-Turn Navigation
        </button>
      </div>

      {/* Main Map Display Area */}
      <div className="main-map-area">
        {error && <div className="error-alert-light">{error}</div>}
        <MapView
          startCoords={startCoords}
          endCoords={endCoords}
          routes={routesData}
          selectedRouteType={selectedRouteType}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Turn-by-Turn Navigation Modal */}
      {showNavModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="flex-center gap-2">
                <Compass size={20} className="text-emerald" />
                <h3>Navigation Guidance: {activeRoute.route_name}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowNavModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="nav-steps-list">
              <div className="nav-step-item">
                <div className="step-num green">1</div>
                <div>
                  <strong>Head east along shaded walkway</strong>
                  <p>Distance: 350m | 72% tree canopy shade</p>
                </div>
              </div>

              <div className="nav-step-item">
                <div className="step-num blue">2</div>
                <div>
                  <strong>Turn left past green corridor park</strong>
                  <p>Avoid direct asphalt pavement heat absorption</p>
                </div>
              </div>

              <div className="nav-step-item">
                <div className="step-num green">3</div>
                <div>
                  <strong>Continue straight to destination hub</strong>
                  <p>Arrive in ~{activeRoute.duration_minutes} min with minimal thermal stress</p>
                </div>
              </div>
            </div>

            <button className="btn-primary-emerald" onClick={() => setShowNavModal(false)}>
              Got It! Start Guidance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteFinderView;
