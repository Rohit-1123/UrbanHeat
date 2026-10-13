import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';
import { getRiskColor } from '../utils/riskCalculator';

// Minimal pins drawn in CSS (theme.css .route-pin) instead of remote PNG markers.
const pinIcon = (kind) => L.divIcon({
  className: '',
  html: `<span class="route-pin route-pin-${kind}"><i></i></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
const START_ICON = pinIcon('start');
const END_ICON = pinIcon('end');

const FitToRoute = ({ start, end, geometry }) => {
  const map = useMap();
  useEffect(() => {
    const points = [...(geometry || [])];
    if (start) points.push([start.lat, start.lon]);
    if (end) points.push([end.lat, end.lon]);
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 17 });
  }, [start, end, geometry, map]);
  return null;
};

const MapClickHandler = ({ onMapClick, onOutsideCampusClick }) => {
  useMapEvents({
    click(e) {
      if (isWithinSrmCampus(e.latlng.lat, e.latlng.lng)) onMapClick?.({ lat: e.latlng.lat, lon: e.latlng.lng });
      else onOutsideCampusClick?.();
    }
  });
  return null;
};

const ROUTE_KEYS = { coolest: 'coolest_route', balanced: 'balanced_route', fastest: 'fastest_route' };

const MapView = ({
  startCoords,
  endCoords,
  routes,
  selectedRouteType = 'coolest',
  onMapClick,
  onOutsideCampusClick,
  onPinMove,
}) => {
  const active = routes?.[ROUTE_KEYS[selectedRouteType]];
  const others = Object.entries(ROUTE_KEYS)
    .filter(([type]) => type !== selectedRouteType)
    .map(([, key]) => routes?.[key]?.geometry)
    .filter((g) => g?.length);

  // Refit only when the active path itself changes, not on every re-render.
  const activeGeometry = useMemo(() => active?.geometry, [active]);

  const dragHandlers = (which) => ({
    dragend: (e) => {
      const { lat, lng } = e.target.getLatLng();
      if (isWithinSrmCampus(lat, lng)) onPinMove?.(which, { lat, lon: lng });
      else onOutsideCampusClick?.();
    },
  });

  return (
    <div className="desktop-map-center-container">
      <MapContainer
        center={SRM_CAMPUS.center}
        zoom={11}
        className="leaflet-map-wrapper"
        scrollWheelZoom
        maxBounds={SRM_CAMPUS.bounds}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToRoute start={startCoords} end={endCoords} geometry={activeGeometry} />
        <MapClickHandler onMapClick={onMapClick} onOutsideCampusClick={onOutsideCampusClick} />

        {/* Alternatives: faint, so the chosen route reads first. */}
        {others.map((geometry, i) => (
          <Polyline key={i} positions={geometry} pathOptions={{ color: '#5b6f8c', weight: 3, opacity: 0.35, dashArray: '2 6' }} />
        ))}

        {/* Chosen route, coloured edge by edge by predicted heat. */}
        {active?.heat_segments?.length
          ? active.heat_segments.map((seg, i) => (
            <Polyline
              key={`${selectedRouteType}-${i}`}
              positions={seg.coords}
              pathOptions={{ color: getRiskColor(seg.heat_risk), weight: 6, opacity: 0.95, lineCap: 'round' }}
            />
          ))
          : active?.geometry?.length > 0 && (
            <Polyline positions={active.geometry} pathOptions={{ color: '#2a63c9', weight: 5 }} />
          )}

        {startCoords && (
          <Marker position={[startCoords.lat, startCoords.lon]} icon={START_ICON} draggable eventHandlers={dragHandlers('start')} />
        )}
        {endCoords && (
          <Marker position={[endCoords.lat, endCoords.lon]} icon={END_ICON} draggable eventHandlers={dragHandlers('end')} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
