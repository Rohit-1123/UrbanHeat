import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import HeatMapPage from './pages/HeatMapPage';
import RoutesPage from './pages/RoutesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InsightsPage from './pages/InsightsPage';
import HeatAlertBanner from './components/HeatAlertBanner';

import { fetchHeatPoints, fetchCurrentHeatData } from './services/heatService';
import { getLocationHeatDetail } from './services/api';
import { estimateMicroclimateForCoords } from './utils/riskCalculator';
import './App.css';
import { isWithinSrmCampus } from './config/campus';

const App = () => {
  const [activePage, setActivePage] = useState('home');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('urbanheat-theme') || 'light';
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const defaultLoc = await fetchCurrentHeatData('srm-hub');
      setCurrentLocation(defaultLoc);

      const points = await fetchHeatPoints();
      setHeatPoints(points);
    };

    initialize();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('urbanheat-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSelectLocation = async (location) => {
    setCurrentLocation(location);

    const latitude = location?.latitude ?? location?.lat;
    const longitude = location?.longitude ?? location?.lon;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    try {
      const detail = await getLocationHeatDetail(latitude, longitude, location.area || location.name || 'SRM Campus Location');
      setCurrentLocation((previous) => ({
        ...previous,
        ...detail,
        latitude,
        longitude,
        lat: latitude,
        lon: longitude,
        area: location.area || location.name || detail.location_name,
        city: location.city || 'SRM Kattankulathur',
        heatRiskScore: detail.heat_risk_score,
        heat_risk: detail.heat_risk_score,
        riskLevel: detail.risk_level?.replace(/ Heat Risk$/i, ''),
        risk_level: detail.risk_level?.replace(/ Heat Risk$/i, ''),
        hottestZone: location.area || location.name || 'Selected SRM Campus Place',
      }));
    } catch {
      const estimated = estimateMicroclimateForCoords(latitude, longitude);
      setCurrentLocation((previous) => ({
        ...previous,
        ...estimated,
        latitude,
        longitude,
        area: location.area || location.name || 'SRM Campus Location',
        city: location.city || 'SRM Kattankulathur',
        hottestZone: location.area || location.name || 'Selected SRM Campus Place',
      }));
    }
  };

  const handleUseMyLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser. Use an SRM campus map pin instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isWithinSrmCampus(pos.coords.latitude, pos.coords.longitude)) {
          setLocationError('Your location is outside the SRM Kattankulathur campus area. Use a pin inside the campus boundary.');
          return;
        }
        const estimated = estimateMicroclimateForCoords(pos.coords.latitude, pos.coords.longitude);
        const customLoc = {
          id: 'custom-gps-location',
          city: 'My Location',
          area: 'Current Geolocation',
          ...estimated,
          weatherCondition: estimated.heatRiskScore > 65 ? 'High Thermal Stress' : 'Clear / Moderate Sun',
          hottestZone: estimated.builtUpDensity > 0.7 ? 'Surrounding Asphalt & Built Corridor' : 'Open Ground Area',
          recommendedAction: estimated.heatRiskScore > 70
            ? 'High heat hazard detected. Hydrate regularly and limit intense outdoor physical exertion.'
            : 'Moderate thermal conditions. Take normal hydration precautions.',
        };
        setCurrentLocation(customLoc);
      },
      (err) => setLocationError(err.code === 1
        ? 'Location permission was denied. Allow location access in browser settings, or use an SRM campus map pin.'
        : `Unable to retrieve your location: ${err.message}`)
    );
  };

  return (
    <div className="app-root-layout">
      {/* Top Navigation Bar (5 clean topics) */}
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Dynamic Heat Wave Alert Banner */}
      <HeatAlertBanner
        currentLocation={currentLocation}
        onNavigate={setActivePage}
      />

      {locationError && (
        <div className="global-location-error" role="status">
          <span>{locationError}</span>
          <button type="button" onClick={() => setLocationError(null)} aria-label="Dismiss location message">Dismiss</button>
        </div>
      )}

      {/* Main Page View Content */}
      <main className="app-main-viewport">
        {activePage === 'home' && (
          <HomePage
            currentLocation={currentLocation}
            onSelectLocation={handleSelectLocation}
            onUseMyLocation={handleUseMyLocation}
            onNavigate={setActivePage}
          />
        )}

        {activePage === 'map' && (
          <HeatMapPage
            currentLocation={currentLocation}
            heatPoints={heatPoints}
            onSelectLocation={handleSelectLocation}
            onUseMyLocation={handleUseMyLocation}
            onNavigate={setActivePage}
            theme={theme}
          />
        )}

        {activePage === 'routes' && (
          <RoutesPage currentLocation={currentLocation} />
        )}

        {/* Analytics & Risk Hub (Supports 'analytics', 'risk', 'simulator') */}
        {activePage === 'analytics' && (
          <AnalyticsPage currentLocation={currentLocation} initialTab="trends" />
        )}
        {activePage === 'risk' && (
          <AnalyticsPage currentLocation={currentLocation} initialTab="risk" />
        )}
        {activePage === 'simulator' && (
          <AnalyticsPage currentLocation={currentLocation} initialTab="simulator" />
        )}

        {/* Insights & Guide Hub (Supports 'insights', 'recommendations', 'learn', 'about') */}
        {activePage === 'insights' && (
          <InsightsPage currentLocation={currentLocation} initialTab="recommendations" />
        )}
        {activePage === 'recommendations' && (
          <InsightsPage currentLocation={currentLocation} initialTab="recommendations" />
        )}
        {activePage === 'learn' && (
          <InsightsPage currentLocation={currentLocation} initialTab="learn" />
        )}
        {activePage === 'about' && (
          <InsightsPage currentLocation={currentLocation} initialTab="about" />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={setActivePage} />
    </div>
  );
};

export default App;
