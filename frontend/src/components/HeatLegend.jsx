import React from 'react';
import { Info, Layers } from 'lucide-react';

const HeatLegend = ({ activeLayer = 'heat_intensity' }) => {
  const renderLegendContent = () => {
    switch (activeLayer) {
      case 'surface_temp':
        return {
          title: 'Surface Temperature (°C)',
          items: [
            { label: 'Cool (<32°C)', color: '#5F8F6B' },
            { label: 'Moderate (32–35°C)', color: '#E69A2D' },
            { label: 'High (36–39°C)', color: '#D96C2F' },
            { label: 'Extreme (≥40°C)', color: '#C94C4C' },
          ]
        };
      case 'vegetation':
        return {
          title: 'Vegetation Canopy (NDVI)',
          items: [
            { label: 'Low (<30%)', color: '#C94C4C' },
            { label: 'Moderate (30–60%)', color: '#E69A2D' },
            { label: 'High Canopy (>60%)', color: '#5F8F6B' },
          ]
        };
      case 'built_up':
        return {
          title: 'Built-Up Impervious Density',
          items: [
            { label: 'Low (<40%)', color: '#5F8F6B' },
            { label: 'Moderate (40–75%)', color: '#E69A2D' },
            { label: 'Dense Asphalt (>75%)', color: '#C94C4C' },
          ]
        };
      case 'heat_risk':
        return {
          title: 'Heat Risk Score (0–100)',
          items: [
            { label: 'Low (0–25)', color: '#5F8F6B' },
            { label: 'Moderate (26–50)', color: '#E69A2D' },
            { label: 'High (51–75)', color: '#D96C2F' },
            { label: 'Severe (76–100)', color: '#C94C4C' },
          ]
        };
      case 'heat_intensity':
      default:
        return {
          title: 'Heat Intensity Scale',
          items: [
            { label: 'Cool', color: '#5F8F6B' },
            { label: 'Moderate', color: '#E69A2D' },
            { label: 'High', color: '#D96C2F' },
            { label: 'Severe', color: '#C94C4C' },
          ]
        };
    }
  };

  const legend = renderLegendContent();

  return (
    <div className="map-legend-overlay">
      <div className="legend-head-row">
        <span className="legend-title">{legend.title}</span>
      </div>
      <div className="legend-items-bar">
        {legend.items.map((item, idx) => (
          <div key={idx} className="legend-item-pill">
            <span className="legend-swatch" style={{ backgroundColor: item.color }} />
            <span className="legend-label-text">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatLegend;
