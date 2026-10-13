import React from 'react';
import InteractiveHeatMap from '../components/InteractiveHeatMap';
import LocationSearch from '../components/LocationSearch';
import SelectedLocationPanel from '../components/SelectedLocationPanel';
import HourScrubber from '../components/HourScrubber';
import { AlertCircle } from 'lucide-react';
import { SRM_CAMPUS, isWithinSrmCampus, nearestPlaceName } from '../config/campus';

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

  // Map tap: use the exact tapped coordinates (the backend computes the heat there).
  const handleSelectPointFromMap = ({ lat, lon }) => {
    if (!isWithinSrmCampus(lat, lon)) return;
    const near = nearestPlaceName(lat, lon);
    handleSelectLocation({
      id: `pin-${lat.toFixed(5)}-${lon.toFixed(5)}`,
      city: 'Tamil Nadu',
      area: near ? `Near ${near}` : 'Dropped pin',
      lat,
      lon,
      latitude: lat,
      longitude: lon,
    });
  };

  const selectedArea = currentLocation || campusLocations[0];

  return (
    <div className="page-container heatmap-page">
      <div className="page-header-row">
        <div className="page-title-group">
          <h1 className="page-title">Heat Map</h1>
          <p className="page-subtitle">Tap anywhere in Tamil Nadu to inspect its heat conditions.</p>
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
