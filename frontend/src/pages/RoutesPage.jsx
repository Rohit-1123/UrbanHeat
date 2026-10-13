import React, { useRef, useState, useEffect } from 'react';
import RouteFinderView from '../components/RouteFinderView';
import { recommendRoute } from '../services/api';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';
import { getPosition, approximateNote } from '../utils/geo';

const RoutesPage = ({ currentLocation }) => {
  const [startCoords, setStartCoords] = useState(SRM_CAMPUS.landmarks[0].start);
  const [endCoords, setEndCoords] = useState(SRM_CAMPUS.landmarks[0].end);
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
      setError('Cool Routes covers Tamil Nadu only. Choose pins inside the map.');
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
      // No placeholder routes: clear the result and show the backend's own reason.
      setRoutesData(null);
      setError(err.friendlyMessage || 'Could not calculate a walking route for these points.');
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
      setError('Both pins must be inside Tamil Nadu.');
      return;
    }
    setStartCoords({ lat: start_lat, lon: start_lon });
    setEndCoords({ lat: end_lat, lon: end_lon });
    calculateRoutes(start_lat, start_lon, end_lat, end_lon);
  };

  const handleUseLocation = async (type) => {
    try {
      const pos = await getPosition();
      const { latitude, longitude } = pos.coords;
      if (!isWithinSrmCampus(latitude, longitude)) {
        setError('Your current location is outside Tamil Nadu.');
        return;
      }
      const here = { lat: latitude, lon: longitude };
      if (type === 'start') {
        setStartCoords(here);
        await calculateRoutes(latitude, longitude, endCoords.lat, endCoords.lon);
      } else {
        setEndCoords(here);
        await calculateRoutes(startCoords.lat, startCoords.lon, latitude, longitude);
      }
      const note = approximateNote(pos);
      if (note) setError(note);
    } catch (err) {
      setError(err.code === 1
        ? 'Location permission was denied. Allow location access in your browser, or place the start pin on the map.'
        : err.code === 3 ? 'Getting your location took too long. Try again, or place the pin on the map.'
        : `Unable to retrieve your location: ${err.message}`);
    }
  };

  const handleSelectPreset = (preset) => {
    setStartCoords(preset.start);
    setEndCoords(preset.end);
    calculateRoutes(preset.start.lat, preset.start.lon, preset.end.lat, preset.end.lon);
  };

  return (
    <div className="page-container routes-page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Cool Routes</h1>
        <p className="page-subtitle">
          Walking routes across Chennai and Tamil Nadu, ranked by how much heat you'll be exposed to.
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
        onOutsideCampusClick={() => setError('That point is outside Tamil Nadu. Choose a point inside the map.')}
      />
    </div>
  );
};

export default RoutesPage;
