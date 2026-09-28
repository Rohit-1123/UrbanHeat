import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';

import HomePage from './pages/HomePage';
import HeatMapPage from './pages/HeatMapPage';
import RoutesPage from './pages/RoutesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import HeatAlertBanner from './components/HeatAlertBanner';

import { fetchHeatPoints, fetchCurrentHeatData, checkBackendStatus } from './services/heatService';
import { getLocationHeatDetail } from './services/api';
import { estimateMicroclimateForCoords } from './utils/riskCalculator';
import './App.css';
import { isWithinSrmCampus } from './config/campus';

const getSystemPrefersDark = () => (
  typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-color-scheme: dark)').matches
);

const App = () => {
  const [activePage, setActivePage] = useState('home');
  // 'light' | 'dark' | 'system' — the user's stored preference.
  const [themePreference, setThemePreference] = useState(() => (
    localStorage.getItem('urbanheat-theme') || 'light'
  ));
  // The actually-applied theme ('light' | 'dark'), resolved from the
  // preference above (and, when 'system', from the OS setting).
  const [theme, setTheme] = useState(() => {
    const pref = localStorage.getItem('urbanheat-theme') || 'light';
    return pref === 'system' ? (getSystemPrefersDark() ? 'dark' : 'light') : pref;
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const [heatPointsError, setHeatPointsError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  // 'checking' | 'connected' | 'disconnected' — reflects a single real
  // GET /health call made once on app load, never polled repeatedly.
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const initialize = async () => {
      const defaultLoc = await fetchCurrentHeatData();
      setCurrentLocation(defaultLoc);

      try {
        const points = await fetchHeatPoints();
        setHeatPoints(points);
        setHeatPointsError(null);
      } catch (err) {
        console.error('Failed to load heat map data from backend:', err);
        setHeatPoints([]);
        setHeatPointsError('Live environmental data is currently unavailable. Please try again shortly.');
      }
    };

    initialize();

    checkBackendStatus().then((isUp) => setBackendStatus(isUp ? 'connected' : 'disconnected'));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Resolve themePreference -> theme, and keep it live if the user is on
  // 'system' and the OS-level color scheme changes while the app is open.
  useEffect(() => {
    localStorage.setItem('urbanheat-theme', themePreference);

    if (themePreference !== 'system') {
      setTheme(themePreference);
      return undefined;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(media.matches ? 'dark' : 'light');
    const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [themePreference]);

  // Quick toggle used by the navbar/theme button: flips between explicit
  // light/dark based on whatever is currently applied.
  const handleToggleTheme = () => {
    setThemePreference(theme === 'light' ? 'dark' : 'light');
  };

  const handleSelectLocation = async (location) => {
    setCurrentLocation(location);

    const latitude = location?.latitude ?? location?.lat;
    const longitude = location?.longitude ?? location?.lon;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    try {
      const detail = await getLocationHeatDetail(latitude, longitude, location.area || location.name || 'SRM Campus Location');
      // getLocationHeatDetail's `vegetation_cover`/`building_density` are human-readable
      // display strings (e.g. "High (Dense Urban)"), not the 0-1 numeric ratios the rest
      // of the app expects under those same field names — spreading `detail` as-is would
      // clobber the numeric convention and produce NaN wherever it's used in math (e.g.
      // Math.round(building_density * 100)). Estimate real numeric values instead.
      const estimated = estimateMicroclimateForCoords(latitude, longitude);
      setCurrentLocation((previous) => ({
        ...previous,
        ...detail,
        latitude,
        longitude,
        lat: latitude,
        lon: longitude,
        vegetation_index: estimated.vegetationIndex,
        vegetationIndex: estimated.vegetationIndex,
        vegetation: estimated.vegetation,
        building_density: estimated.builtUpDensity,
        builtUpDensity: estimated.builtUpDensity,
        builtUpDensityLevel: estimated.builtUpDensityLevel,
        shade_score: estimated.shade_score,
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
      (err) => {
        if (err.code === 1) {
          setLocationError('Location access is unavailable. You can search for a location manually instead.');
        } else if (err.code === 3) {
          setLocationError('Getting your location took too long. You can search for a location manually instead.');
        } else {
          setLocationError('Your location could not be determined. You can search for a location manually instead.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
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
        backendStatus={backendStatus}
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
      <main className="app-main-viewport has-mobile-nav">
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
            heatPointsError={heatPointsError}
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

        {activePage === 'settings' && (
          <SettingsPage
            themePreference={themePreference}
            onSetThemePreference={setThemePreference}
            backendStatus={backendStatus}
            onNavigate={setActivePage}
            onUseMyLocation={handleUseMyLocation}
            locationError={locationError}
          />
        )}
      </main>

      {/* Footer (hidden on mobile — replaced by the bottom nav) */}
      <Footer onNavigate={setActivePage} />

      {/* Fixed mobile bottom navigation (hidden on desktop widths) */}
      <MobileBottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default App;
