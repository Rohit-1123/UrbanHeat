import React from 'react';
import InteractiveHeatMap from '../components/InteractiveHeatMap';
import LocationSearch from '../components/LocationSearch';
import SelectedLocationPanel from '../components/SelectedLocationPanel';
import HourScrubber from '../components/HourScrubber';
import { AlertCircle } from 'lucide-react';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';

const HeatMapPage = ({
  currentLocation,
  heatPoints = [],
  heatPointsError = null,
  onSelectLocation,
  onUseMyLocation,
  onNavigate,
  theme = 'light'
}) => {
  // Real, hand-curated SRM campus places (name + coordinates) — not mock data.
  const campusLocations = SRM_CAMPUS.places.filter((location) => isWithinSrmCampus(location.lat, location.lon));

  const handleSelectLocation = (loc) => onSelectLocation?.(loc);

  const handleSelectPointFromMap = (pt) => {
    // Borrow the human-friendly place name/category from the real SRM campus
    // place list when this heatmap point sits near a named location, but
    // always source the actual metrics from the live heatmap point itself.
    const matched = campusLocations.find(
      (l) => Math.abs(l.lat - pt.latitude) < 0.005 && Math.abs(l.lon - pt.longitude) < 0.005
    );

    const target = {
      id: `pt-${pt.id}`,
      city: 'SRM Kattankulathur',
      area: matched?.name || pt.name,
      category: matched?.category,
      lat: pt.latitude,
      lon: pt.longitude,
      latitude: pt.latitude,
      longitude: pt.longitude,
      temperature: pt.temperature,
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

    handleSelectLocation(target);
  };

  const selectedArea = currentLocation || campusLocations[0];

  return (
    <div className="page-container heatmap-page">
      <div className="page-header-row">
        <div className="page-title-group">
          <h1 className="page-title">Campus Heat Map</h1>
          <p className="page-subtitle">Tap anywhere on campus to inspect its heat conditions.</p>
        </div>
      </div>

      {/* Live Data Unavailable Toast — real backend failure, never a fake/mock substitute */}
      {heatPointsError && (
        <div className="map-alert-toast">
          <AlertCircle size={16} />
          <span>{heatPointsError}</span>
        </div>
      )}

      {/* Location Search Bar */}
      <div className="map-search-bar-wrap">
        <LocationSearch
          currentLocation={selectedArea}
          onSelectLocation={handleSelectLocation}
          onUseMyLocation={onUseMyLocation}
        />
      </div>

      {/* Main Map + Selected Location Grid Layout */}
      <div className="map-interactive-layout">
        {/* Left/Main Column: Map Frame */}
        <div className="map-frame-column">
          <div className="map-frame">
            {/* Interactive Leaflet Map */}
            <InteractiveHeatMap
              points={heatPoints}
              centerLocation={currentLocation}
              selectedLocation={selectedArea}
              onSelectPoint={handleSelectPointFromMap}
              onUseMyLocation={onUseMyLocation}
              theme={theme}
            />
          </div>
        </div>

        {/* Right Column: Selected Location Information Panel */}
        <div className="map-sidebar-column">
          <HourScrubber
            key={`${selectedArea?.lat ?? selectedArea?.latitude},${selectedArea?.lon ?? selectedArea?.longitude}`}
            forecast={selectedArea?.forecast}
          />
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
