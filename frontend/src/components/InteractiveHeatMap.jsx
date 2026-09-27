import React, { useEffect, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Rectangle,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Plus, Minus, Maximize2, Crosshair } from 'lucide-react';
import { SRM_CAMPUS } from '../config/campus';

// Heat-severity spectrum, matching the app's design tokens in index.css
// (--cool-teal / --heat-moderate / --hot-amber / --hot-red).
const HEAT_GRADIENT = {
  0.0: '#3FA796',
  0.4: '#D9A441',
  0.7: '#D9722C',
  1.0: '#C6432E'
};

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

// Renders the spatial heat data as one smooth continuous gradient (like a
// weather radar overlay) instead of hundreds of discrete overlapping circles.
const HeatGradientLayer = ({ points, getIntensity }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatPoints = points.map((pt) => [
      pt.latitude ?? pt.lat,
      pt.longitude ?? pt.lon,
      getIntensity(pt)
    ]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 32,
      blur: 24,
      maxZoom: 17,
      max: 1.0,
      gradient: HEAT_GRADIENT
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, getIntensity, map]);

  return null;
};

// Since the heat data is now a canvas gradient with no per-point DOM elements
// to attach click handlers to, clicking the map instead finds and selects the
// nearest underlying data point.
const HeatClickHandler = ({ points, onSelectPoint }) => {
  useMapEvents({
    click(e) {
      if (!onSelectPoint || !points || points.length === 0) return;
      let nearest = null;
      let minDist = Infinity;
      for (const pt of points) {
        const lat = pt.latitude ?? pt.lat;
        const lon = pt.longitude ?? pt.lon;
        const dist = (lat - e.latlng.lat) ** 2 + (lon - e.latlng.lng) ** 2;
        if (dist < minDist) {
          minDist = dist;
          nearest = pt;
        }
      }
      if (nearest) onSelectPoint(nearest);
    }
  });
  return null;
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
    centerLocation?.lat || centerLocation?.latitude || SRM_CAMPUS.center[0],
    centerLocation?.lon || centerLocation?.longitude || SRM_CAMPUS.center[1]
  ];

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1);
  };

  // Normalizes each point to a 0-1 intensity for the active layer, driving
  // the heat gradient's color at that spot (0 = coolest end of HEAT_GRADIENT,
  // 1 = hottest end).
  const getIntensity = useCallback((pt) => {
    if (activeLayer === 'surface_temp') {
      const sTemp = pt.surfaceTemp ?? (pt.temperature ? pt.temperature + 4.5 : 36);
      return Math.min(Math.max((sTemp - 28) / (42 - 28), 0), 1);
    }

    if (activeLayer === 'vegetation') {
      // Sparse canopy reads as "hot" on this layer, so invert vegetation ratio.
      const veg = pt.vegetation_index ?? 0.35;
      return Math.min(Math.max(1 - veg, 0), 1);
    }

    if (activeLayer === 'built_up') {
      const density = pt.building_density ?? 0.75;
      return Math.min(Math.max(density, 0), 1);
    }

    // 'heat_risk' and the default 'heat_intensity' layers both key off the
    // 0-100 heat risk score.
    const score = pt.heat_risk ?? pt.heatRiskScore ?? 50;
    return Math.min(Math.max(score / 100, 0), 1);
  }, [activeLayer]);

  // CartoDB's basemap tiles now require an API key (they render an
  // "API KEY REQUIRED" watermark without one), so use the same free,
  // no-key OpenStreetMap tile source as MapView.jsx. There's no separate
  // dark variant of these tiles, so dark mode is faked with a CSS filter
  // on the tile layer instead of a paid dark-tile provider.
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="interactive-heatmap-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="leaflet-interactive-map-root"
        zoomControl={false}
        scrollWheelZoom={true}
        maxBounds={SRM_CAMPUS.bounds}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          className={theme === 'dark' ? 'map-tile-dark-filter' : ''}
          url={tileUrl}
          attribution={tileAttribution}
          maxZoom={19}
        />

        <Rectangle
          bounds={SRM_CAMPUS.bounds}
          pathOptions={{ color: '#10b981', weight: 2, dashArray: '6 6', fillColor: '#10b981', fillOpacity: 0.04 }}
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

        {/* Smooth Spatial Heat Gradient (weather-radar style, no discrete points) */}
        <HeatGradientLayer points={points} getIntensity={getIntensity} />
        <HeatClickHandler points={points} onSelectPoint={onSelectPoint} />

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
