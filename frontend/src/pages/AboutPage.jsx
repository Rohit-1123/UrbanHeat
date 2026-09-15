import React from 'react';
import { Leaf, Target, Cpu, Database, Rocket, ShieldCheck } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="page-container about-page">
      <div className="page-header">
        <h1 className="page-title">About UrbanHeat Platform</h1>
        <p className="page-subtitle">Smart environmental intelligence for Urban Heat Island monitoring and climate-resilient urban planning</p>
      </div>

      <div className="about-sections-wrapper">
        {/* Purpose */}
        <section className="about-block">
          <div className="about-block-head">
            <Leaf size={22} className="text-emerald" />
            <h2>Platform Purpose</h2>
          </div>
          <p>
            <strong>UrbanHeat</strong> is an environmental monitoring and awareness platform designed to help citizens, urban planners, and researchers explore urban temperature patterns, understand localized thermal stress, identify high-risk areas, and implement practical solutions for cooler, more sustainable cities.
          </p>
        </section>

        {/* Objectives & How It Works Grid */}
        <div className="about-two-col">
          <section className="about-block">
            <div className="about-block-head">
              <Target size={20} className="text-blue" />
              <h3>Project Objectives</h3>
            </div>
            <ul className="about-list">
              <li>Provide intuitive spatial heat intensity visualization for urban zones.</li>
              <li>Analyze diurnal microclimate trends and land surface temperatures.</li>
              <li>Deliver actionable health safety advisories during extreme heat periods.</li>
              <li>Promote sustainable urban planning solutions like green canopy corridors and reflective roofs.</li>
            </ul>
          </section>

          <section className="about-block">
            <div className="about-block-head">
              <Cpu size={20} className="text-purple" />
              <h3>Technologies Used</h3>
            </div>
            <ul className="about-list">
              <li><strong>Frontend:</strong> React 18, Vite, Custom Light/Dark Theme System</li>
              <li><strong>Geographical Maps:</strong> Leaflet & OpenStreetMap GIS engine</li>
              <li><strong>Backend Engine:</strong> FastAPI, Python, Random Forest ML model</li>
              <li><strong>Icons & Styling:</strong> Lucide React & Modern Responsive CSS Architecture</li>
            </ul>
          </section>
        </div>

        {/* Data Sources & Future Scope */}
        <div className="about-two-col">
          <section className="about-block">
            <div className="about-block-head">
              <Database size={20} className="text-amber" />
              <h3>Data Sources & Architecture</h3>
            </div>
            <p className="about-text-sm">
              The platform integrates environmental indicator layers including ambient air temperature, relative humidity, UV index, satellite vegetation cover (NDVI), and land built-up density. A modular service abstraction seamlessly bridges local environmental datasets with live API endpoints.
            </p>
          </section>

          <section className="about-block">
            <div className="about-block-head">
              <Rocket size={20} className="text-emerald" />
              <h3>Future Roadmap</h3>
            </div>
            <ul className="about-list">
              <li>Real-time satellite infrared thermal imagery integration.</li>
              <li>IoT urban sensor network connectivity for live block-level monitoring.</li>
              <li>Community heat report crowdsourcing & cooling shelter mapping.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
