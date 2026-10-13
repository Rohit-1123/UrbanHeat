import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import OfflineBanner from './components/OfflineBanner';
import PwaUpdateToast from './components/PwaUpdateToast';

// The Home screen is the first thing every user sees, so it stays in the
// main bundle. Everything else is only fetched when actually navigated to.
import HomePage from './pages/HomePage';
const HeatMapPage = lazy(() => import('./pages/HeatMapPage'));
const RoutesPage = lazy(() => import('./pages/RoutesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));


import { fetchHeatPoints, fetchCurrentHeatData, checkBackendStatus, locationFromDetail } from './services/heatService';
import { getLocationHeatDetail } from './services/api';
import { estimateMicroclimateForCoords } from './utils/riskCalculator';
import './App.css';
import './theme.css';
import { isWithinSrmCampus } from './config/campus';
import { getPosition, approximateNote, gpsAreaName } from './utils/geo';

const PageLoadingFallback = () => (
  <div className="page-lazy-fallback" role="status">
    <div className="page-lazy-spinner" />
    <span>Loading…</span>
  </div>
);

const getSystemPrefersDark = () => (
  typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-color-scheme: dark)').matches
);

// Hash routing (#/routes, ...) so refresh, Back and shared links keep the page.
const PAGES = ['home', 'map', 'routes', 'analytics', 'risk', 'simulator', 'insights', 'recommendations', 'guide', 'learn', 'about', 'settings', 'feedback'];
const pageFromHash = () => {
  const page = window.location.hash.replace(/^#\/?/, '');
  return PAGES.includes(page) ? page : 'home';
};
const setActivePage = (page) => { window.location.hash = `/${page}`; };

const App = () => {
  const [activePage, setActivePageState] = useState(pageFromHash);

  useEffect(() => {
    const onHashChange = () => {
      setActivePageState(pageFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
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
  const selectSeq = useRef(0); // latest selection wins; stale backend replies are dropped
  const locating = useRef(false);
  const [heatPoints, setHeatPoints] = useState([]);
  const [heatPointsError, setHeatPointsError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  // 'checking' | 'connected' | 'disconnected' — reflects a single real
  // GET /health call made once on app load, never polled repeatedly.
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const initialize = async () => {
      const defaultLoc = await fetchCurrentHeatData();
      setCurrentLocation((prev) => prev ?? defaultLoc); // never clobber a location the user already picked

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

  // The background sky warms with the selected place's heat risk (theme.css).
  const skyScore = currentLocation?.heatRiskScore ?? currentLocation?.heat_risk;
  useEffect(() => {
    if (Number.isFinite(skyScore)) {
      document.documentElement.style.setProperty('--sky-warmth', (skyScore / 100).toFixed(2));
    }
  }, [skyScore]);

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
    const seq = ++selectSeq.current;
    setCurrentLocation(location);

    const latitude = location?.latitude ?? location?.lat;
    const longitude = location?.longitude ?? location?.lon;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    try {
      const detail = await getLocationHeatDetail(latitude, longitude, location.area || location.name || 'Selected Location');
      if (seq !== selectSeq.current) return;
      setCurrentLocation((previous) => ({
        ...previous,
        ...locationFromDetail(detail),
        // Keep live Open-Meteo readings over the seeded dataset's values.
        ...(location.isLive && { temperature: location.temperature, humidity: location.humidity }),
        latitude,
        longitude,
        lat: latitude,
        lon: longitude,
        accuracy: location.accuracy,
        area: location.area || location.name || detail.location_name,
        city: location.city || 'Tamil Nadu',
        hottestZone: location.area || location.name || 'Selected Place',
      }));
    } catch {
      if (seq !== selectSeq.current) return;
      const estimated = estimateMicroclimateForCoords(latitude, longitude);
      setCurrentLocation((previous) => ({
        ...previous,
        ...estimated,
        latitude,
        longitude,
        accuracy: location.accuracy,
        area: location.area || location.name || 'Selected Location',
        city: location.city || 'Tamil Nadu',
        hottestZone: location.area || location.name || 'Selected Place',
      }));
    }
  };

  const handleUseMyLocation = async () => {
    if (locating.current) return;
    locating.current = true;
    setLocationError('Finding your location... this can take up to 20 seconds.');
    try {
      const pos = await getPosition();
      const { latitude, longitude } = pos.coords;
      if (!isWithinSrmCampus(latitude, longitude)) {
        setLocationError('Your location is outside Tamil Nadu. Use a pin on the map instead.');
        return;
      }
      handleSelectLocation({
        id: 'custom-gps-location',
        city: 'My Location',
        area: gpsAreaName(latitude, longitude),
        lat: latitude,
        lon: longitude,
        latitude,
        longitude,
        accuracy: pos.coords.accuracy,
      });
      setLocationError(approximateNote(pos));
    } catch (err) {
      if (err.code === 0) setLocationError('Geolocation is not supported by this browser. Use a map pin instead.');
      else if (err.code === 1) setLocationError('Location access is unavailable. You can search for a location manually instead.');
      else if (err.code === 3) setLocationError('Getting your location took too long. You can search for a location manually instead.');
      else if (err.code === 4) setLocationError(err.message);
      else setLocationError('Your location could not be determined. You can search for a location manually instead.');
    } finally {
      locating.current = false;
    }
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

      {locationError && (
        <div className="global-location-error" role="status">
          <span>{locationError}</span>
          <button type="button" onClick={() => setLocationError(null)} aria-label="Dismiss location message">Dismiss</button>
        </div>
      )}

      {/* Real, non-hardcoded connectivity state — never assume "online". */}
      <OfflineBanner />

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

        <Suspense fallback={activePage !== 'home' ? <PageLoadingFallback /> : null}>
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
        {['guide', 'learn', 'about'].includes(activePage) && (
          <InsightsPage key="guide" currentLocation={currentLocation} initialTab="guide" />
        )}

        {activePage === 'feedback' && <FeedbackPage currentLocation={currentLocation} />}

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
        </Suspense>
      </main>

      {/* Prompts to refresh when a new deployed version's service worker is
          ready — never swaps the app out from under the user silently. */}
      <PwaUpdateToast />

      {/* Footer (hidden on mobile — replaced by the bottom nav) */}
      <Footer onNavigate={setActivePage} />

      {/* Fixed mobile bottom navigation (hidden on desktop widths) */}
      <MobileBottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default App;
