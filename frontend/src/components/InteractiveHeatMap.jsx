import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus, Maximize2, Crosshair } from 'lucide-react';
import { SRM_CAMPUS } from '../config/campus';

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

  const lat = centerLocation?.lat ?? centerLocation?.latitude;
  const lon = centerLocation?.lon ?? centerLocation?.longitude;
  // Keyed on coordinates, not the object, so data refreshes don't restart the fly-to.
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) map.flyTo([lat, lon], 14, { duration: 1.2, easeLinearity: 0.25 });
  }, [lat, lon, map]);

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

// Clicking selects exactly the clicked spot; the backend returns the heat at those coordinates.
const HeatClickHandler = ({ onSelectPoint }) => {
  useMapEvents({
    click(e) {
      onSelectPoint?.({ lat: e.latlng.lat, lon: e.latlng.lng });
    }
  });
  return null;
};

const InteractiveHeatMap = ({
  points = [],
  centerLocation = null,
  selectedLocation = null,
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
        zoom={11}
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

        <HeatClickHandler onSelectPoint={onSelectPoint} />

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
              color: '#2a63c9',
              weight: 3,
              dashArray: '3, 3',
              opacity: 0.95
            }}
          />
        )}
        {/* GPS fix uncertainty: the real position is somewhere inside this circle. */}
        {selectedLocation?.accuracy > 0 && (
          <Circle
            center={[selectedLocation.lat ?? selectedLocation.latitude, selectedLocation.lon ?? selectedLocation.longitude]}
            radius={selectedLocation.accuracy}
            pathOptions={{ color: '#2a63c9', weight: 1, fillOpacity: 0.12 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default InteractiveHeatMap;
