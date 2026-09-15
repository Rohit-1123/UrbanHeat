import React, { useState } from 'react';
import MapView from './MapView';
import HeatLegend from './HeatLegend';
import { Layers, Thermometer, Info } from 'lucide-react';

const HeatMapView = ({ heatmapPoints, startCoords, endCoords }) => {
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="view-container full-map-view">
      {/* Top Banner Control Bar */}
      <div className="map-view-header">
        <div className="map-view-info">
          <Thermometer size={20} className="text-emerald" />
          <div>
            <h2>Urban Spatial Heat Map</h2>
            <p>Explore real-time thermal points, microclimate risk zones, and canopy shade metrics.</p>
          </div>
        </div>

        <button
          className="btn-secondary-light"
          onClick={() => setShowLegend(!showLegend)}
        >
          <Layers size={15} />
          {showLegend ? 'Hide Heat Legend' : 'Show Heat Legend'}
        </button>
      </div>

      {/* Map Content */}
      <div className="map-full-wrapper">
        <MapView
          heatmapPoints={heatmapPoints}
          startCoords={startCoords}
          endCoords={endCoords}
        />
        {showLegend && <HeatLegend />}
      </div>
    </div>
  );
};

export default HeatMapView;
