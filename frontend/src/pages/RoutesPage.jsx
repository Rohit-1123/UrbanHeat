import React, { useRef, useState, useEffect } from 'react';
import RouteFinderView from '../components/RouteFinderView';
import { recommendRoute } from '../services/api';
import { isWithinSrmCampus } from '../config/campus';

const RoutesPage = ({ currentLocation }) => {
  const initialStart = currentLocation?.lat && currentLocation?.lon
    ? { lat: currentLocation.lat, lon: currentLocation.lon }
    : { lat: 12.8232, lon: 80.0450 };
  const [startCoords, setStartCoords] = useState(initialStart);
  const [endCoords, setEndCoords] = useState({ lat: 12.8246527, lon: 80.0452877 });
  const [selectedRouteType, setSelectedRouteType] = useState('coolest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routesData, setRoutesData] = useState(null);
  const requestIdRef = useRef(0);

  const isValidCoordinate = (latitude, longitude) => (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
  );

  const isValidCampusCoordinate = (latitude, longitude) => (
    isValidCoordinate(latitude, longitude) && isWithinSrmCampus(latitude, longitude)
  );

  // Generate route calculations either from backend or local fallback model
  const calculateRoutes = async (startLat, startLon, endLat, endLon) => {
    const requestId = ++requestIdRef.current;

    if (!isValidCampusCoordinate(startLat, startLon) || !isValidCampusCoordinate(endLat, endLon)) {
      setError('Cool Routes is limited to the SRM Kattankulathur campus area. Choose pins inside the campus map.');
      setRoutesData(null);
      return;
    }

    if (Math.abs(startLat - endLat) < 1e-6 && Math.abs(startLon - endLon) < 1e-6) {
      setError('Start and destination must be different locations.');
      setRoutesData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await recommendRoute(startLat, startLon, endLat, endLon);
      if (requestId !== requestIdRef.current) return;
      setRoutesData(res);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const unavailableRoute = {
        route_name: 'No verified campus route',
        duration_minutes: 0,
        distance_km: 0,
        average_heat_risk: 0,
        maximum_heat_risk: 0,
        heat_risk_level: 'Unavailable',
        shaded_area_percentage: 0,
        geometry: [],
        heat_profile: [{ position: 0, score: 0 }, { position: 100, score: 0 }],
        turn_by_turn: []
      };
      setRoutesData({
        coolest_route: { ...unavailableRoute, route_type: 'coolest' },
        balanced_route: { ...unavailableRoute, route_type: 'balanced' },
        fastest_route: { ...unavailableRoute, route_type: 'fastest' },
        recommended_route: 'coolest_route',
        comparison: { alternatives_available: false }
      });
      const status = err.response?.status;
      setError(status === 400
        ? 'Both route points must be inside the SRM campus boundary.'
        : 'Could not calculate a verified walking route for these campus points. Try a nearby mapped road or landmark.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    calculateRoutes(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
  }, []);

  useEffect(() => {
    if (currentLocation?.id !== 'custom-gps-location' || !isWithinSrmCampus(currentLocation.lat, currentLocation.lon)) return;
    setStartCoords({ lat: currentLocation.lat, lon: currentLocation.lon });
    calculateRoutes(currentLocation.lat, currentLocation.lon, endCoords.lat, endCoords.lon);
  }, [currentLocation]);

  const handleSearch = ({ start_lat, start_lon, end_lat, end_lon }) => {
    if (![start_lat, start_lon, end_lat, end_lon].every(Number.isFinite)) {
      setError('Please enter numeric coordinates before calculating a route.');
      return;
    }
    if (!isWithinSrmCampus(start_lat, start_lon) || !isWithinSrmCampus(end_lat, end_lon)) {
      setError('Both pins must be inside the SRM Kattankulathur campus area.');
      return;
    }
    setStartCoords({ lat: start_lat, lon: start_lon });
    setEndCoords({ lat: end_lat, lon: end_lon });
    calculateRoutes(start_lat, start_lon, end_lat, end_lon);
  };

  const handleUseLocation = (type) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported. Place the start or destination pin on the SRM campus map.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isWithinSrmCampus(pos.coords.latitude, pos.coords.longitude)) {
          setError('Your current location is outside the SRM campus routing area.');
          return;
        }
        if (type === 'start') {
          setStartCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          calculateRoutes(pos.coords.latitude, pos.coords.longitude, endCoords.lat, endCoords.lon);
        } else {
          setEndCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          calculateRoutes(startCoords.lat, startCoords.lon, pos.coords.latitude, pos.coords.longitude);
        }
      },
      (err) => setError(err.code === 1
        ? 'Location permission was denied. Allow location access in your browser, or place the start pin on the SRM map.'
        : `Unable to retrieve your location: ${err.message}`)
    );
  };

  const handleSelectPreset = (preset) => {
    setStartCoords(preset.start);
    setEndCoords(preset.end);
    calculateRoutes(preset.start.lat, preset.start.lon, preset.end.lat, preset.end.lon);
  };

  return (
    <div className="page-container routes-page-wrapper">
      <div className="page-header">
        <h1 className="page-title">SRM Campus Cool Routes</h1>
        <p className="page-subtitle">
          Compare mapped walking paths inside SRM Institute of Science and Technology, Kattankulathur, using campus heat data.
        </p>
      </div>

      <RouteFinderView
        startCoords={startCoords}
        endCoords={endCoords}
        routesData={routesData}
        loading={loading}
        error={error}
        selectedRouteType={selectedRouteType}
        onSelectRouteType={setSelectedRouteType}
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        onSelectPreset={handleSelectPreset}
        onOutsideCampusClick={() => setError('That point is outside the SRM campus boundary. Choose a location inside the dashed campus area.')}
      />
    </div>
  );
};

export default RoutesPage;
