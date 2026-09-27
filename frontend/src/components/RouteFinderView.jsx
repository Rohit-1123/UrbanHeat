import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Target,
  Sparkles,
  Loader2,
  Leaf,
  Shield,
  Zap,
  CheckCircle,
  X,
  Compass,
  ChevronRight,
  Sun,
  Clock,
  Footprints,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import MapView from './MapView';
import HeatProfileChart from './HeatProfileChart';
import ArcGauge from './ArcGauge';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';

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
  onSelectPreset,
  onOutsideCampusClick
}) => {
  const [startLat, setStartLat] = useState(startCoords?.lat?.toString() || '12.8232');
  const [startLon, setStartLon] = useState(startCoords?.lon?.toString() || '80.0450');
  const [endLat, setEndLat] = useState(endCoords?.lat?.toString() || '12.8246527');
  const [endLon, setEndLon] = useState(endCoords?.lon?.toString() || '80.0452877');
  const [clickMode, setClickMode] = useState('end'); // 'start' | 'end'
  const [showNavModal, setShowNavModal] = useState(false);

  useEffect(() => {
    setStartLat(startCoords?.lat?.toString() || '');
    setStartLon(startCoords?.lon?.toString() || '');
  }, [startCoords]);

  useEffect(() => {
    setEndLat(endCoords?.lat?.toString() || '');
    setEndLon(endCoords?.lon?.toString() || '');
  }, [endCoords]);

  const presets = SRM_CAMPUS.landmarks;

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
    if (!isWithinSrmCampus(coords.lat, coords.lon)) {
      return;
    }
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

  const handleOutsideCampusClick = () => {
    onOutsideCampusClick?.();
  };

  // Loading and error/empty states are checked BEFORE any route data is
  // read, so the component never falls through to rendering with missing
  // route fields. There is deliberately no fabricated fallback route here —
  // if the backend hasn't returned a real, verified route, we show an
  // explicit state instead of inventing distances, durations, or turn-by-turn
  // instructions.
  if (!routesData && loading) {
    return (
      <div className="route-state-panel" role="status">
        <Loader2 size={22} className="animate-spin text-emerald" />
        <strong>Finding the coolest mapped SRM walking route...</strong>
        <span>Snapping your pins to walkable paths and analyzing heat exposure.</span>
      </div>
    );
  }

  const hasCompleteRouteData = Boolean(
    routesData?.coolest_route
    && routesData?.balanced_route
    && routesData?.fastest_route
    && routesData.coolest_route.heat_risk_level !== 'Unavailable'
  );

  if (!hasCompleteRouteData) {
    return (
      <div className="route-state-panel route-state-error" role="alert">
        <Navigation size={22} />
        <strong>{error || 'Choose two SRM campus locations to find a verified coolest route.'}</strong>
        <span>Use the campus presets, enter coordinates, or place both pins inside the dashed SRM boundary.</span>
      </div>
    );
  }

  const happiest = routesData.coolest_route;
  const balanced = routesData.balanced_route;
  const fastest = routesData.fastest_route;

  const getActiveRoute = (type) => (type === 'coolest' ? happiest : type === 'balanced' ? balanced : fastest);
  const activeRoute = getActiveRoute(selectedRouteType);

  const handleRouteCardKeyDown = (event, routeType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectRouteType(routeType);
    }
  };

  const reductionPct = fastest.average_heat_risk > 0
    ? Math.max(0, Math.round(((fastest.average_heat_risk - happiest.average_heat_risk) / fastest.average_heat_risk) * 100))
    : 0;
  const recommendedRoute = routesData?.recommended_route || 'coolest_route';
  const sameMappedPath = routesData?.comparison?.alternatives_available === false;

  return (
    <div className="route-finder-container">
      {/* Top Banner Notice */}
      <div className="route-highlight-banner">
        <div className="banner-left">
          <div className="banner-icon-badge">
            <Leaf size={20} className="text-emerald" />
          </div>
          <div>
            <h3>Thermal-Aware Smart Walking Routing</h3>
            <p>
              Cool Routes prioritize tree canopies, covered colonnades, and green spaces to minimize direct UV radiation and land surface heat absorption.
            </p>
          </div>
        </div>
        <div className="banner-savings-tag">
          <span className="savings-val">~{reductionPct}%</span>
          <span className="savings-lbl">Less Heat Exposure</span>
        </div>
      </div>

      <div className="route-split-layout">
        {/* Left Control Panel */}
        <div className="route-control-sidebar">
          {/* Preset Quick Chooser */}
          <div className="route-card-block">
            <div className="block-header">
              <Compass size={16} className="text-emerald" />
              <span>SRM Campus Routes</span>
            </div>
            <div className="preset-pill-list">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  className="preset-pill-btn"
                  onClick={() => {
                    setStartLat(preset.start.lat.toString());
                    setStartLon(preset.start.lon.toString());
                    setEndLat(preset.end.lat.toString());
                    setEndLon(preset.end.lon.toString());
                    onSelectPreset(preset);
                  }}
                >
                  <MapPin size={12} className="text-emerald" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coordinates & Location Form */}
          <div className="route-card-block">
            <div className="block-header">
              <Navigation size={16} className="text-emerald" />
              <span>Waypoints & Locations</span>
            </div>

            <form onSubmit={handleSubmit} className="route-form">
              {/* Origin */}
              <div className="waypoint-input-group">
                <div className="waypoint-header">
                  <span className="waypoint-label green">
                    <span className="dot green" /> Start Location (Origin)
                  </span>
                  <button type="button" className="btn-use-gps" onClick={() => onUseLocation('start')}>
                    <Target size={12} /> My GPS
                  </button>
                </div>
                <div className="coord-inputs">
                  <input
                    type="number"
                    step="any"
                    className="input-coord"
                    placeholder="Latitude"
                    value={startLat}
                    onChange={(e) => setStartLat(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    className="input-coord"
                    placeholder="Longitude"
                    value={startLon}
                    onChange={(e) => setStartLon(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="swap-row">
                <button type="button" className="btn-swap-coords" onClick={handleSwap} title="Swap Start & End">
                  <ArrowUpDown size={14} />
                  <span>Swap Direction</span>
                </button>
              </div>

              {/* Destination */}
              <div className="waypoint-input-group">
                <div className="waypoint-header">
                  <span className="waypoint-label red">
                    <span className="dot red" /> Destination Point
                  </span>
                  <button type="button" className="btn-use-gps" onClick={() => onUseLocation('end')}>
                    <Target size={12} /> My GPS
                  </button>
                </div>
                <div className="coord-inputs">
                  <input
                    type="number"
                    step="any"
                    className="input-coord"
                    placeholder="Latitude"
                    value={endLat}
                    onChange={(e) => setEndLat(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    className="input-coord"
                    placeholder="Longitude"
                    value={endLon}
                    onChange={(e) => setEndLon(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Map Tap Mode Selector */}
              <div className="map-tap-mode-bar">
                <span className="tap-label">Click map to set:</span>
                <div className="tap-btn-group">
                  <button
                    type="button"
                    className={`btn-tap-mode ${clickMode === 'start' ? 'active-green' : ''}`}
                    onClick={() => setClickMode('start')}
                  >
                    Start Pin
                  </button>
                  <button
                    type="button"
                    className={`btn-tap-mode ${clickMode === 'end' ? 'active-red' : ''}`}
                    onClick={() => setClickMode('end')}
                  >
                    Destination Pin
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-calculate-routes" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Calculating Optimal Paths...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Calculate Cool Routes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Coolest Route Result */}
          <div className="route-card-block">
            <div className="block-header">
              <Leaf size={16} className="text-emerald" />
              <span>Coolest Route</span>
            </div>

            {routesData?.comparison?.alternatives_available === false && (
              <p className="route-data-note">One mapped walking path is available for these SRM pins. All three cards use that verified path, with separate cool, peak-risk, and speed values; no alternate road has been invented.</p>
            )}

            {routesData?.comparison?.pins_snapped && (
              <p className="route-data-note">Your pins were connected to the nearest mapped walking paths: {routesData.comparison.start_snap_distance_m}m at the start and {routesData.comparison.end_snap_distance_m}m at the destination.</p>
            )}

            <div className="routes-comparison-stack">
              {/* Coolest Route */}
              <div
                className={`route-choice-card coolest ${selectedRouteType === 'coolest' ? 'selected' : ''}`}
                onClick={() => onSelectRouteType('coolest')}
                onKeyDown={(event) => handleRouteCardKeyDown(event, 'coolest')}
                role="button"
                tabIndex={0}
                aria-pressed={selectedRouteType === 'coolest'}
              >
                <div className="choice-top">
                  <div className="choice-title">
                    <Leaf size={16} className="text-emerald" />
                    <strong>Coolest Route (Shaded)</strong>
                  </div>
                  {sameMappedPath && <span className="route-same-path-badge">Same mapped path</span>}
                  {recommendedRoute === 'coolest_route' && <span className="badge-best"><CheckCircle size={11} /> Recommended</span>}
                </div>
                <div className="choice-stats">
                  <span><Clock size={13} /> <strong>{happiest.duration_minutes} min</strong></span>
                  <span><Navigation size={13} /> {happiest.distance_km} km</span>
                  <span className="text-emerald"><Sun size={13} /> <strong>{happiest.average_heat_risk}/100 Risk</strong></span>
                  <span className="text-emerald"><Leaf size={13} /> {happiest.shaded_area_percentage}% Shade</span>
                </div>
              </div>

            </div>
          </div>

          {/* Navigation & Turn-by-Turn Action */}
          <button className="btn-open-navigation" onClick={() => setShowNavModal(true)}>
            <Footprints size={18} />
            <span>View Turn-by-Turn Directions ({activeRoute.route_name})</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right Map & Thermal Profile Viewport */}
        <div className="route-map-viewport">
          <div className="map-frame-card">
            <div className="map-frame-header">
              <div className="frame-meta">
                <span className="active-route-pill">
                  Active: <strong>{activeRoute.route_name}</strong>
                </span>
                  <span className="frame-hint">
                    <Info size={13} className="text-muted" /> Tap inside the SRM boundary to place pins
                </span>
              </div>
              <div className="map-legend-pills">
                <span className="legend-chip green"><span className="dot green" /> Cool Route</span>
                <span className="legend-chip blue"><span className="dot blue" /> High Risk</span>
                <span className="legend-chip red"><span className="dot red" /> Direct Sun</span>
              </div>
            </div>

            {error && <div className="route-error-banner">{error}</div>}

            <MapView
              startCoords={startCoords}
              endCoords={endCoords}
              routes={routesData}
              selectedRouteType={selectedRouteType}
              onMapClick={handleMapClick}
              onOutsideCampusClick={handleOutsideCampusClick}
            />
          </div>

          {/* Thermal Profile & Elevation Chart */}
          <div className="thermal-profile-card">
            <div className="profile-header">
              <div>
                <h4>Thermal Exposure Profile Along Path</h4>
                <p>Point-by-point microclimate risk variance over distance travelled</p>
              </div>
              <div className="profile-badge-val">
                Avg Risk: <strong style={{ color: selectedRouteType === 'coolest' ? 'var(--environment)' : selectedRouteType === 'balanced' ? 'var(--info)' : 'var(--danger)' }}>{activeRoute.average_heat_risk}/100</strong>
              </div>
            </div>

            <HeatProfileChart
              profile={activeRoute.heat_profile || []}
              color={selectedRouteType === 'coolest' ? '#10b981' : selectedRouteType === 'balanced' ? '#3b82f6' : '#ef4444'}
              height={100}
            />
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Navigation Modal */}
      {showNavModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowNavModal(false)}>
          <div className="report-modal-dialog nav-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-toolbar">
              <div className="toolbar-left">
                <Compass size={20} className="text-emerald" />
                <span className="toolbar-title">Turn-by-Turn Guidance: {activeRoute.route_name}</span>
              </div>
              <button className="btn-modal-close" onClick={() => setShowNavModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="nav-modal-body">
              <div className="nav-summary-strip">
                <div className="strip-item">
                  <span className="strip-lbl">Estimated Duration</span>
                  <span className="strip-val">{activeRoute.duration_minutes} Minutes</span>
                </div>
                <div className="strip-item">
                  <span className="strip-lbl">Walking Distance</span>
                  <span className="strip-val">{activeRoute.distance_km} km</span>
                </div>
                <div className="strip-item">
                  <span className="strip-lbl">Tree Canopy Coverage</span>
                  <span className="strip-val text-emerald">{activeRoute.shaded_area_percentage}% Shaded</span>
                </div>
              </div>

              <div className="turn-steps-container">
                {activeRoute.turn_by_turn && activeRoute.turn_by_turn.length > 0 ? (
                  activeRoute.turn_by_turn.map((step, idx) => (
                    <div key={idx} className="turn-step-card">
                      <div className="step-badge-num">{idx + 1}</div>
                      <div className="step-content">
                        <p className="step-inst"><strong>{step.instruction}</strong></p>
                        {step.distance && <span className="step-dist">Segment Distance: {step.distance}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="route-data-note">Turn-by-turn instructions are not available for this route.</p>
                )}
              </div>

              <button className="btn-start-walking" onClick={() => setShowNavModal(false)}>
                <CheckCircle size={18} />
                <span>Begin Walking Along Cool Route</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteFinderView;
