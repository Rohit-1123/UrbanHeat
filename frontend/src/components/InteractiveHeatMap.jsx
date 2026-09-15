import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus, Maximize2, Crosshair, MapPin } from 'lucide-react';
import { getRiskColor } from '../utils/riskCalculator';

// Fix Leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle smooth flyTo recentering
const MapController = ({ centerLocation, allPoints, resetTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (centerLocation?.lat && centerLocation?.lon) {
      map.flyTo([centerLocation.lat, centerLocation.lon], 14, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    } else if (centerLocation?.latitude && centerLocation?.longitude) {
      map.flyTo([centerLocation.latitude, centerLocation.longitude], 14, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [centerLocation, map]);

  useEffect(() => {
    if (resetTrigger && allPoints && allPoints.length > 0) {
      const bounds = L.latLngBounds(
        allPoints.map((pt) => [pt.latitude || pt.lat, pt.longitude || pt.lon])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [resetTrigger, allPoints, map]);

  return null;
};

// Custom Unobtrusive On-Map Controls
const CustomMapControls = ({ onResetView, onUseMyLocation }) => {
  const map = useMap();

  return (
    <div className="custom-map-nav-controls">
      <button
        className="map-ctrl-btn"
        onClick={() => map.zoomIn()}
        title="Zoom In"
        aria-label="Zoom In"
      >
        <Plus size={16} />
      </button>

      <button
        className="map-ctrl-btn"
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <Minus size={16} />
      </button>

      <div className="map-ctrl-divider" />

      <button
        className="map-ctrl-btn"
        onClick={onResetView}
        title="Fit All Urban Heat Zones"
        aria-label="Fit All Urban Heat Zones"
      >
        <Maximize2 size={15} />
      </button>

      {onUseMyLocation && (
        <button
          className="map-ctrl-btn highlight"
          onClick={onUseMyLocation}
          title="Pan to My Current GPS Location"
          aria-label="My Current Location"
        >
          <Crosshair size={15} />
        </button>
      )}
    </div>
  );
};

const InteractiveHeatMap = ({
  points = [],
  centerLocation = null,
  selectedLocation = null,
  activeLayer = 'heat_intensity',
  onSelectPoint = null,
  onUseMyLocation = null,
  theme = 'light'
}) => {
  const [resetTrigger, setResetTrigger] = React.useState(0);
  const defaultCenter = [
    centerLocation?.lat || centerLocation?.latitude || 13.0100,
    centerLocation?.lon || centerLocation?.longitude || 80.2200
  ];

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1);
  };

  // Color calculation helper according to active layer
  const getZoneColor = (pt) => {
    if (activeLayer === 'surface_temp') {
      const sTemp = pt.surfaceTemp || (pt.temperature ? pt.temperature + 4.5 : 36);
      if (sTemp >= 40) return '#C94C4C'; // Extreme
      if (sTemp >= 36) return '#D96C2F'; // High
      if (sTemp >= 32) return '#E69A2D'; // Moderate
      return '#5F8F6B'; // Cool
    }

    if (activeLayer === 'vegetation') {
      const veg = pt.vegetation_index !== undefined ? pt.vegetation_index : 0.35;
      if (veg >= 0.60) return '#5F8F6B'; // High Canopy (Green)
      if (veg >= 0.30) return '#E69A2D'; // Moderate (Amber)
      return '#C94C4C'; // Sparse (Red)
    }

    if (activeLayer === 'built_up') {
      const density = pt.building_density !== undefined ? pt.building_density : 0.75;
      if (density >= 0.75) return '#C94C4C'; // Dense concrete
      if (density >= 0.40) return '#E69A2D'; // Moderate
      return '#5F8F6B'; // Low density / permeable
    }

    if (activeLayer === 'heat_risk') {
      const score = pt.heat_risk || pt.heatRiskScore || 50;
      return getRiskColor(score);
    }

    // Default 'heat_intensity'
    const intensity = (pt.heat_intensity || pt.heatIntensity || '').toLowerCase();
    if (intensity === 'severe' || intensity === 'extreme') return '#C94C4C';
    if (intensity === 'high') return '#D96C2F';
    if (intensity === 'moderate') return '#E69A2D';
    if (intensity === 'cool') return '#5F8F6B';

    const fallbackScore = pt.heat_risk || pt.heatRiskScore || 50;
    return getRiskColor(fallbackScore);
  };

  // Radius helper for thermal bloom
  const getZoneRadiusMeters = (pt) => {
    const risk = pt.heat_risk || pt.heatRiskScore || 50;
    if (activeLayer === 'surface_temp') {
      const sTemp = pt.surfaceTemp || 36;
      return Math.max(sTemp * 16, 450);
    }
    return Math.max(risk * 10, 450);
  };

  // Tile URL depending on theme
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const isSelected = (pt) => {
    if (!selectedLocation && !centerLocation) return false;
    const target = selectedLocation || centerLocation;
    const lat = pt.latitude || pt.lat;
    const lon = pt.longitude || pt.lon;
    const tLat = target.lat || target.latitude;
    const tLon = target.lon || target.longitude;
    return Math.abs(lat - tLat) < 0.0001 && Math.abs(lon - tLon) < 0.0001;
  };

  return (
    <div className="interactive-heatmap-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="leaflet-interactive-map-root"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={theme} // re-mount tile layer cleanly when theme changes
          url={tileUrl}
          attribution={tileAttribution}
          maxZoom={19}
        />

        {/* Dynamic Navigation & Zoom Controls */}
        <CustomMapControls
          onResetView={handleReset}
          onUseMyLocation={onUseMyLocation}
        />

        <MapController
          centerLocation={selectedLocation || centerLocation}
          allPoints={points}
          resetTrigger={resetTrigger}
        />

        {/* Spatial Heat Layer: Radial Thermal Zones */}
        {points.map((pt) => {
          const color = getZoneColor(pt);
          const radiusMeters = getZoneRadiusMeters(pt);
          const selected = isSelected(pt);

          const temp = pt.temperature ?? 34;
          const feelsLike = pt.feelsLike ?? (temp + 5);
          const heatIntensity = pt.heatIntensity || pt.heat_intensity || 'Moderate';
          const riskLevel = pt.riskLevel || pt.risk_level || 'Moderate';
          const vegLevel = pt.vegetation || (pt.vegetation_index > 0.6 ? 'High' : pt.vegetation_index > 0.3 ? 'Moderate' : 'Low');
          const densityLevel = pt.builtUpDensityLevel || (pt.building_density > 0.7 ? 'High' : pt.building_density > 0.4 ? 'Moderate' : 'Low');
          const lastUpdated = pt.lastUpdated || 'Today, 01:30 PM';

          return (
            <React.Fragment key={`zone-group-${pt.id}`}>
              {/* Outer Translucent Thermal Plume */}
              <Circle
                center={[pt.latitude, pt.longitude]}
                radius={radiusMeters}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: selected ? 0.35 : 0.22,
                  color: color,
                  weight: selected ? 2 : 1,
                  opacity: selected ? 0.8 : 0.4,
                  dashArray: selected ? null : '4, 4'
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectPoint) onSelectPoint(pt);
                  }
                }}
              />

              {/* Inner Core Marker */}
              <CircleMarker
                center={[pt.latitude, pt.longitude]}
                radius={selected ? 11 : 8}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.95,
                  color: selected ? '#FFFFFF' : color,
                  weight: selected ? 3 : 2,
                  opacity: 1
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectPoint) onSelectPoint(pt);
                  }
                }}
              >
                <Popup className="urbanheat-custom-popup">
                  <div className="map-popup-card">
                    <div className="popup-header-row">
                      <h4 className="popup-title">{pt.name}</h4>
                      <span className="popup-zone-type">{pt.zoneType || 'Urban Area'}</span>
                    </div>

                    <div className="popup-badge-row">
                      <span
                        className="popup-risk-badge"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                          borderColor: color
                        }}
                      >
                        {riskLevel} Risk • {heatIntensity} Intensity
                      </span>
                    </div>

                    <div className="popup-stats-grid">
                      <div className="popup-stat-item">
                        <span className="stat-name">Temperature:</span>
                        <strong className="stat-val">{temp}°C</strong>
                      </div>
                      <div className="popup-stat-item">
                        <span className="stat-name">Feels Like:</span>
                        <strong className="stat-val">{feelsLike}°C</strong>
                      </div>
                      <div className="popup-stat-item">
                        <span className="stat-name">Heat Intensity:</span>
                        <strong className="stat-val">{heatIntensity}</strong>
                      </div>
                      <div className="popup-stat-item">
                        <span className="stat-name">Risk Level:</span>
                        <strong className="stat-val">{riskLevel}</strong>
                      </div>
                      <div className="popup-stat-item">
                        <span className="stat-name">Vegetation:</span>
                        <strong className="stat-val">{vegLevel} ({Math.round((pt.vegetation_index || 0.35) * 100)}%)</strong>
                      </div>
                      <div className="popup-stat-item">
                        <span className="stat-name">Built-up Density:</span>
                        <strong className="stat-val">{densityLevel} ({Math.round((pt.building_density || 0.75) * 100)}%)</strong>
                      </div>
                    </div>

                    <div className="popup-footer-row">
                      <span className="popup-updated-label">Last Updated: {lastUpdated}</span>
                      <button
                        className="popup-select-btn"
                        onClick={() => {
                          if (onSelectPoint) onSelectPoint(pt);
                        }}
                      >
                        Select Area
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Prominent Highlighting Ring for Selected Location */}
        {(selectedLocation || centerLocation) && (
          <CircleMarker
            center={[
              selectedLocation?.lat || selectedLocation?.latitude || centerLocation?.lat || centerLocation?.latitude,
              selectedLocation?.lon || selectedLocation?.longitude || centerLocation?.lon || centerLocation?.longitude
            ]}
            radius={16}
            pathOptions={{
              fillColor: 'transparent',
              fillOpacity: 0,
              color: '#147D78',
              weight: 3,
              dashArray: '3, 3',
              opacity: 0.95
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default InteractiveHeatMap;
