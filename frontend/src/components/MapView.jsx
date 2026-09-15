import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icons in React Vite bundle
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapAutoRecenter = ({ start, end, routes }) => {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (start) points.push([start.lat, start.lon]);
    if (end) points.push([end.lat, end.lon]);

    if (routes?.coolest_route?.geometry) routes.coolest_route.geometry.forEach((pt) => points.push(pt));
    if (routes?.balanced_route?.geometry) routes.balanced_route.geometry.forEach((pt) => points.push(pt));
    if (routes?.fastest_route?.geometry) routes.fastest_route.geometry.forEach((pt) => points.push(pt));

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [start, end, routes, map]);

  return null;
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    }
  });
  return null;
};

const getHeatColor = (score) => {
  if (score <= 25) return '#10b981';
  if (score <= 50) return '#eab308';
  if (score <= 75) return '#f97316';
  return '#ef4444';
};

const MapView = ({
  heatmapPoints,
  startCoords,
  endCoords,
  routes,
  selectedRouteType = 'coolest',
  onMapClick
}) => {
  const defaultCenter = [12.8232, 80.0450]; // SRM Katangulathur center

  const coolestPolyline = routes?.coolest_route?.geometry || [];
  const balancedPolyline = routes?.balanced_route?.geometry || [];
  const fastestPolyline = routes?.fastest_route?.geometry || [];

  return (
    <div className="desktop-map-center-container">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="leaflet-map-wrapper"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoRecenter start={startCoords} end={endCoords} routes={routes} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* Spatial Heat Points Overlay */}
        {heatmapPoints && heatmapPoints.map((pt, idx) => (
          <CircleMarker
            key={idx}
            center={[pt.latitude, pt.longitude]}
            radius={8}
            pathOptions={{
              fillColor: getHeatColor(pt.heat_risk),
              fillOpacity: 0.6,
              color: getHeatColor(pt.heat_risk),
              weight: 1.5,
              opacity: 0.95
            }}
          >
            <Popup>
              <div style={{ padding: '2px', fontFamily: 'sans-serif' }}>
                <strong style={{ color: getHeatColor(pt.heat_risk) }}>
                  Heat Risk Score: {pt.heat_risk} / 100 ({pt.risk_level})
                </strong>
                <hr style={{ margin: '4px 0', borderColor: '#e2e8f0' }} />
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  <div>Temp: <strong>{pt.temperature}°C</strong> | Humidity: <strong>{pt.humidity}%</strong></div>
                  <div>UV Index: <strong>{pt.uv_index}</strong></div>
                  <div>NDVI Vegetation: <strong>{pt.vegetation_index}</strong></div>
                  <div>Building Density: <strong>{pt.building_density}</strong></div>
                  <div>Shade Score: <strong>{pt.shade_score}</strong></div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 1. Fastest Route Polyline (Red/Crimson) */}
        {fastestPolyline.length > 0 && (
          <Polyline
            positions={fastestPolyline}
            pathOptions={{
              color: '#ef4444',
              weight: selectedRouteType === 'fastest' ? 7 : 4,
              opacity: selectedRouteType === 'fastest' ? 0.95 : 0.4,
              dashArray: '6, 6'
            }}
          >
            <Popup>
              <strong style={{ color: '#ef4444' }}>Fastest Route</strong><br />
              Distance: {routes.fastest_route.distance_km} km<br />
              Duration: {routes.fastest_route.duration_minutes} min<br />
              Heat Risk: {routes.fastest_route.average_heat_risk}/100
            </Popup>
          </Polyline>
        )}

        {/* 2. Balanced Route Polyline (Blue) */}
        {balancedPolyline.length > 0 && (
          <Polyline
            positions={balancedPolyline}
            pathOptions={{
              color: '#3b82f6',
              weight: selectedRouteType === 'balanced' ? 7 : 4,
              opacity: selectedRouteType === 'balanced' ? 0.95 : 0.4
            }}
          >
            <Popup>
              <strong style={{ color: '#3b82f6' }}>Balanced Route</strong><br />
              Distance: {routes.balanced_route.distance_km} km<br />
              Duration: {routes.balanced_route.duration_minutes} min<br />
              Heat Risk: {routes.balanced_route.average_heat_risk}/100
            </Popup>
          </Polyline>
        )}

        {/* 3. Coolest Route Polyline (Emerald Green) */}
        {coolestPolyline.length > 0 && (
          <Polyline
            positions={coolestPolyline}
            pathOptions={{
              color: '#10b981',
              weight: selectedRouteType === 'coolest' ? 8 : 4,
              opacity: selectedRouteType === 'coolest' ? 1.0 : 0.5
            }}
          >
            <Popup>
              <strong style={{ color: '#10b981' }}>Coolest Route (Shaded Canopy) ⭐ Recommended</strong><br />
              Distance: {routes.coolest_route.distance_km} km<br />
              Duration: {routes.coolest_route.duration_minutes} min<br />
              Avg Heat Risk: {routes.coolest_route.average_heat_risk}/100<br />
              Shaded Area: {routes.coolest_route.shaded_area_percentage}%
            </Popup>
          </Polyline>
        )}

        {/* Start Location Marker */}
        {startCoords && (
          <Marker position={[startCoords.lat, startCoords.lon]} icon={startIcon}>
            <Popup>
              <strong>🟢 Start Location</strong><br />
              Lat: {startCoords.lat}, Lon: {startCoords.lon}
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {endCoords && (
          <Marker position={[endCoords.lat, endCoords.lon]} icon={endIcon}>
            <Popup>
              <strong>🔴 Destination</strong><br />
              Lat: {endCoords.lat}, Lon: {endCoords.lon}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
