import React from 'react';
import SimulatorView from '../components/SimulatorView';

const SimulatorPage = () => {
  return (
    <div className="page-container simulator-page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Microclimate Thermal Simulator</h1>
        <p className="page-subtitle">
          Test different urban environmental scenarios by adjusting temperature, relative humidity, green canopy coverage, and built infrastructure density.
        </p>
      </div>

      <SimulatorView />
    </div>
  );
};

export default SimulatorPage;
