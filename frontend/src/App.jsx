import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import HeatMapPage from './pages/HeatMapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import RecommendationsPage from './pages/RecommendationsPage';
import LearnPage from './pages/LearnPage';
import AboutPage from './pages/AboutPage';

import { fetchLocations, fetchHeatPoints, fetchCurrentHeatData } from './services/heatService';
import { estimateMicroclimateForCoords } from './utils/riskCalculator';
import './App.css';

const App = () => {
  const [activePage, setActivePage] = useState('home');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('urbanheat-theme') || 'light';
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);

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

  const handleSelectLocation = (location) => {
    setCurrentLocation(location);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
      (err) => alert(`Geolocation error: ${err.message}`)
    );
  };

  return (
    <div className="app-root-layout">
      {/* Top Navigation Bar */}
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

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

        {activePage === 'analytics' && (
          <AnalyticsPage currentLocation={currentLocation} />
        )}

        {activePage === 'risk' && (
          <RiskAssessmentPage currentLocation={currentLocation} />
        )}

        {activePage === 'recommendations' && (
          <RecommendationsPage currentLocation={currentLocation} />
        )}

        {activePage === 'learn' && (
          <LearnPage />
        )}

        {activePage === 'about' && (
          <AboutPage />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={setActivePage} />
    </div>
  );
};

export default App;
