import React, { useState } from 'react';
import { ArrowUpDown, Loader2, X, Footprints, MapPin, ChevronRight } from 'lucide-react';
import MapView from './MapView';
import PlaceInput from './PlaceInput';
import HeatProfileChart from './HeatProfileChart';
import { SRM_CAMPUS, nearestPlaceName } from '../config/campus';
import { formatDuration } from '../utils/time';
import { getRiskColor } from '../utils/riskCalculator';

const OPTIONS = [
  { type: 'coolest', key: 'coolest_route', label: 'Coolest' },
  { type: 'balanced', key: 'balanced_route', label: 'Balanced' },
  { type: 'fastest', key: 'fastest_route', label: 'Fastest' },
];

const placeLabel = (coords) => (coords ? nearestPlaceName(coords.lat, coords.lon) || 'Pinned point' : 'Not set');
const minutes = (r) => formatDuration(r.duration_minutes);

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
  // Which pin the next map tap places; flips to the other pin after each tap.
  const [placing, setPlacing] = useState('end');
  const [showDirections, setShowDirections] = useState(false);

  const search = (start, end) => onSearch({ start_lat: start.lat, start_lon: start.lon, end_lat: end.lat, end_lon: end.lon });

  const setPin = (which, coords) => {
    if (which === 'start') search(coords, endCoords);
    else search(startCoords, coords);
  };

  const handleMapClick = (coords) => {
    setPin(placing, coords);
    setPlacing(placing === 'start' ? 'end' : 'start');
  };

  const route = routesData?.[OPTIONS.find((o) => o.type === selectedRouteType)?.key];
  const comparison = routesData?.comparison;
  const samePath = comparison?.alternatives_available === false;

  const pinRow = (which, coords) => (
    <PlaceInput
      which={which}
      label={placeLabel(coords)}
      active={placing === which}
      onActivate={() => setPlacing(which)}
      onPick={(c) => setPin(which, c)}
      onUseLocation={() => onUseLocation(which)}
    />
  );

  return (
    <div className="route-layout">
      <aside className="route-side">
        <section className="journey-card">
          {pinRow('start', startCoords)}
          <button
            type="button"
            className="journey-swap"
            onClick={() => search(endCoords, startCoords)}
            aria-label="Swap start and destination"
            title="Swap"
          >
            <ArrowUpDown size={14} />
          </button>
          {pinRow('end', endCoords)}
          <p className="journey-hint">
            Type a place, tap the target for GPS, or tap the map to set the <strong>{placing === 'start' ? 'start' : 'destination'}</strong>. Drag either pin to adjust.
          </p>
        </section>

        {route && (
          <section className="route-hero" aria-live="polite">
            <div className="route-hero-time">{minutes(route)}</div>
            <div className="route-hero-meta">
              <span>{route.distance_km} km walk</span>
              <span>
                <i style={{ background: getRiskColor(route.average_heat_risk) }} />
                Heat {route.average_heat_risk} · {route.heat_risk_level}
              </span>
              <span>{route.shaded_area_percentage}% shade</span>
            </div>
          </section>
        )}

        {routesData && !samePath && (
          <div className="route-options" role="radiogroup" aria-label="Route options">
            {OPTIONS.map(({ type, key, label }) => {
              const r = routesData[key];
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selectedRouteType === type}
                  className={`route-option ${selectedRouteType === type ? 'on' : ''}`}
                  onClick={() => onSelectRouteType(type)}
                >
                  <strong>{label}{routesData.recommended_route === key && <em>Best</em>}</strong>
                  <span>{minutes(r)} · heat {r.average_heat_risk}</span>
                </button>
              );
            })}
          </div>
        )}

        {comparison && (
          <p className="route-summary">
            {samePath ? 'Only one mapped path connects these points, so it is both the fastest and the coolest.' : comparison.summary}
          </p>
        )}

        {route && (
          <button type="button" className="sky-btn primary route-directions-btn" onClick={() => setShowDirections(true)}>
            <Footprints size={16} /> Directions
          </button>
        )}

        <nav aria-label="Popular routes">
          <h2 className="sky-section-title">Popular routes</h2>
          {SRM_CAMPUS.landmarks.map((preset) => (
            <button key={preset.name} type="button" className="sky-link" onClick={() => onSelectPreset(preset)}>
              <span>{preset.name.replace(/^SRM /, '')}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </nav>
      </aside>

      <div className="route-main">
        <div className="route-map-frame">
          <MapView
            startCoords={startCoords}
            endCoords={endCoords}
            routes={routesData}
            selectedRouteType={selectedRouteType}
            onMapClick={handleMapClick}
            onPinMove={setPin}
            onOutsideCampusClick={onOutsideCampusClick}
          />
          {loading && (
            <div className="route-float route-float-status" role="status">
              <Loader2 size={14} className="animate-spin" /> Finding routes…
            </div>
          )}
          {error && !loading && (
            <div className="route-float route-float-error" role="alert">
              <MapPin size={14} /> {error}
            </div>
          )}
        </div>

        {route?.heat_profile?.length > 1 && (
          <section className="route-profile">
            <div className="sky-wave-head">
              <h2>Heat along the way</h2>
              <span>Peak {route.maximum_heat_risk} · start to destination</span>
            </div>
            <HeatProfileChart profile={route.heat_profile} color={getRiskColor(route.maximum_heat_risk)} height={110} width={1000} />
          </section>
        )}
      </div>

      {showDirections && route && (
        <div className="modal-backdrop-overlay" onClick={() => setShowDirections(false)}>
          <div className="report-modal-dialog nav-modal-box" role="dialog" aria-label="Directions" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-toolbar">
              <span className="toolbar-title">{route.route_name} · {minutes(route)} · {route.distance_km} km</span>
              <button type="button" className="btn-modal-close" onClick={() => setShowDirections(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <ol className="route-steps">
              {route.turn_by_turn.map((step, i) => (
                <li key={i}>
                  <span>{step.instruction}</span>
                  {step.distance && <small>{step.distance}</small>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteFinderView;
