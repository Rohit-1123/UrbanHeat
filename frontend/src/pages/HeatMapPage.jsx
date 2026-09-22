import React, { useState } from 'react';
import InteractiveHeatMap from '../components/InteractiveHeatMap';
import LocationSearch from '../components/LocationSearch';
import SelectedLocationPanel from '../components/SelectedLocationPanel';
import HeatLegend from '../components/HeatLegend';
import {
  Layers,
  MapPin,
  Info,
  Flame,
  Thermometer,
  TreePine,
  Building2,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { MOCK_LOCATIONS } from '../data/mockData';
import { estimateMicroclimateForCoords } from '../utils/riskCalculator';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';

const HeatMapPage = ({
  currentLocation,
  heatPoints = [],
  onSelectLocation,
  onUseMyLocation,
  onNavigate,
  theme = 'light'
}) => {
  const [activeLayer, setActiveLayer] = useState('heat_intensity');
  const [geoError, setGeoError] = useState(null);
  const [centerLoc, setCenterLoc] = useState(currentLocation);
  const campusLocations = MOCK_LOCATIONS.filter((location) => isWithinSrmCampus(location.latitude ?? location.lat, location.longitude ?? location.lon));

  const layers = [
    { id: 'heat_intensity', label: 'Heat Intensity', icon: Flame, desc: 'Overall urban thermal distribution' },
    { id: 'surface_temp', label: 'Surface Temperature', icon: Thermometer, desc: 'Estimated land surface heat radiation' },
    { id: 'vegetation', label: 'Vegetation (NDVI)', icon: TreePine, desc: 'Urban tree canopy & vegetative cooling' },
    { id: 'built_up', label: 'Built-Up Density', icon: Building2, desc: 'Impervious concrete & asphalt density' },
    { id: 'heat_risk', label: 'Heat Risk Level', icon: ShieldAlert, desc: 'Normalized 0–100 health vulnerability' },
  ];

  const handleSelectLocation = (loc) => {
    setCenterLoc(loc);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

  const handleSelectPointFromMap = (pt) => {
    // Check if matching location in MOCK_LOCATIONS or format new location
    const matched = campusLocations.find(
      (l) => Math.abs(l.lat - pt.latitude) < 0.005 && Math.abs(l.lon - pt.longitude) < 0.005
    );

    const target = matched || {
      id: `pt-${pt.id}`,
      city: 'SRM Kattankulathur',
      area: pt.name,
      lat: pt.latitude,
      lon: pt.longitude,
      latitude: pt.latitude,
      longitude: pt.longitude,
      temperature: pt.temperature,
      feelsLike: pt.feelsLike || pt.temperature + 5,
      surfaceTemp: pt.surfaceTemp || pt.temperature + 4.5,
      heatRiskScore: pt.heat_risk,
      heat_risk: pt.heat_risk,
      riskLevel: pt.risk_level,
      risk_level: pt.risk_level,
      heatIntensity: pt.heat_intensity,
      heat_intensity: pt.heat_intensity,
      vegetationIndex: pt.vegetation_index,
      vegetation_index: pt.vegetation_index,
      vegetation: pt.vegetation,
      builtUpDensity: pt.building_density,
      building_density: pt.building_density,
      builtUpDensityLevel: pt.builtUpDensityLevel,
      humidity: pt.humidity,
      uv_index: pt.uv_index,
      shade_score: pt.shade_score,
      zoneType: pt.zoneType,
      lastUpdated: pt.lastUpdated,
      recommendedAction: pt.heat_risk > 70
        ? 'High thermal load zone. Seek shaded structures and hydrate frequently.'
        : 'Microclimate stabilized by ambient ventilation or vegetation canopy.'
    };

    setCenterLoc(target);
    if (onSelectLocation) {
      onSelectLocation(target);
    }
  };

  const handleGeoLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isWithinSrmCampus(pos.coords.latitude, pos.coords.longitude)) {
          setGeoError('Your location is outside the SRM Kattankulathur campus area.');
          return;
        }
        const estimated = estimateMicroclimateForCoords(pos.coords.latitude, pos.coords.longitude);
        const userLoc = {
          id: 'my-gps-location',
          city: 'My Location',
          area: 'Current Geolocation',
          ...estimated,
          weatherCondition: estimated.heatRiskScore > 65 ? 'High Thermal Stress' : 'Clear / Moderate Sun',
          hottestZone: estimated.builtUpDensity > 0.7 ? 'Surrounding Built Corridor' : 'Open Ground Area',
          recommendedAction: estimated.heatRiskScore > 70
            ? 'High heat hazard detected. Hydrate regularly and seek shaded areas.'
            : 'Moderate thermal conditions. Maintain regular hydration precautions.',
        };

        handleSelectLocation(userLoc);
        if (onUseMyLocation) onUseMyLocation();
      },
      (err) => {
        setGeoError(`Unable to retrieve location (${err.message}). Showing default urban zone.`);
      },
      { timeout: 8000 }
    );
  };

  const activeLayerObj = layers.find((l) => l.id === activeLayer) || layers[0];
  const selectedArea = centerLoc || currentLocation || campusLocations[0];

  return (
    <div className="page-container heatmap-page">
      {/* Page Header with Layer Controls */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h1 className="page-title">Urban Spatial Heat Map</h1>
          <p className="page-subtitle">
            Interactive microclimate GIS mapping of thermal hotspots, canopy cover, and urban heat risk
          </p>
        </div>

        {/* Map Layer Switcher */}
        <div className="layer-control-container">
          <div className="layer-control-label">
            <Layers size={14} />
            <span>Map Layers:</span>
          </div>
          <div className="layer-control-pills">
            {layers.map((l) => {
              const Icon = l.icon;
              return (
                <button
                  key={l.id}
                  className={`layer-pill-btn ${activeLayer === l.id ? 'active' : ''}`}
                  onClick={() => setActiveLayer(l.id)}
                  title={l.desc}
                >
                  <Icon size={13} />
                  <span>{l.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Geolocation Warning Toast (if error) */}
      {geoError && (
        <div className="map-alert-toast">
          <AlertCircle size={16} />
          <span>{geoError}</span>
          <button className="toast-dismiss-btn" onClick={() => setGeoError(null)}>×</button>
        </div>
      )}

      {/* Location Search Bar */}
      <div className="map-search-bar-wrap">
        <LocationSearch
          currentLocation={selectedArea}
          onSelectLocation={handleSelectLocation}
          onUseMyLocation={handleGeoLocation}
        />
      </div>

      {/* Main Map + Selected Location Grid Layout */}
      <div className="map-interactive-layout">
        {/* Left/Main Column: Map Frame */}
        <div className="map-frame-column">
          <div className="map-frame">
            {/* Active Layer Tag Overlay */}
            <div className="active-layer-indicator">
              <span className="indicator-dot" />
              <span>Active Layer: <strong>{activeLayerObj.label}</strong></span>
            </div>

            {/* Interactive Leaflet Map */}
            <InteractiveHeatMap
              points={heatPoints}
              centerLocation={centerLoc || currentLocation}
              selectedLocation={selectedArea}
              activeLayer={activeLayer}
              onSelectPoint={handleSelectPointFromMap}
              onUseMyLocation={handleGeoLocation}
              theme={theme}
            />

            {/* Dynamic Heat Legend Overlay */}
            <HeatLegend activeLayer={activeLayer} />
          </div>

          {/* Quick Explanatory Note below map */}
          <div className="map-meta-info-strip">
            <div className="info-chip">
              <Info size={14} className="text-primary" />
              <span><strong>Interactive GIS:</strong> Click any heat circle or marker on the map to inspect its real-time microclimate conditions.</span>
            </div>
            <div className="layer-desc-chip">
              <span>Showing: {activeLayerObj.desc}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Location Information Panel */}
        <div className="map-sidebar-column">
          <SelectedLocationPanel
            location={selectedArea}
            onCenterMap={handleSelectLocation}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
};

export default HeatMapPage;
