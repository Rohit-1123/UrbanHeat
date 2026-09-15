import React from 'react';
import { Leaf, Sun, Thermometer, ShieldCheck, Cpu, MapPin } from 'lucide-react';

const AboutView = () => {
  return (
    <div className="view-container centered-view">
      <div className="about-container-light">
        <div className="about-hero">
          <div className="icon-circle hero-icon">
            <Leaf size={28} className="text-emerald" />
          </div>
          <h2>About UrbanHeat CoolRoute</h2>
          <p>
            An AI & ML powered heat-aware urban navigation system designed to minimize human thermal stress and combat Urban Heat Island (UHI) effects.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <div className="card-icon-head"><Sun size={20} className="text-amber" /> <h3>Urban Heat Islands</h3></div>
            <p>
              Dense urban infrastructure traps solar radiation, resulting in localized temperature spikes of up to 4°C to 8°C compared to surrounding vegetated zones.
            </p>
          </div>

          <div className="about-card">
            <div className="card-icon-head"><Thermometer size={20} className="text-emerald" /> <h3>Tree Canopy Cooling</h3></div>
            <p>
              Continuous tree canopy cover provides shade and evapotranspiration, dropping pedestrian heat stress levels dramatically along designated green corridors.
            </p>
          </div>

          <div className="about-card">
            <div className="card-icon-head"><Cpu size={20} className="text-blue" /> <h3>Machine Learning Engine</h3></div>
            <p>
              Our model evaluates microclimate features (temperature, humidity, UV index, NDVI vegetation, and building density) to dynamically rank safest travel paths.
            </p>
          </div>

          <div className="about-card">
            <div className="card-icon-head"><MapPin size={20} className="text-purple" /> <h3>Smart Routing Algorithm</h3></div>
            <p>
              Integrates graph algorithms with environmental heat weights to construct three personalized routes: Coolest, Balanced, and Fastest.
            </p>
          </div>
        </div>

        <div className="about-footer-card">
          <ShieldCheck size={20} className="text-emerald" />
          <span>Developed for Urban Heat Island Mitigation & Climate-Resilient Smart Cities.</span>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
