import React from 'react';
import { Leaf, Navigation, Map, Sliders, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const DesktopHeader = ({ activePage, onSelectPage, apiOnline }) => {
  return (
    <header className="header-light">
      {/* Brand Identity */}
      <div className="brand-light">
        <div className="brand-logo-box">
          <Leaf size={20} className="text-white" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">
            CoolRoute <span className="badge-light-green">PROTOTYPE</span>
          </h1>
        </div>
      </div>

      {/* Center Section Navigation Tabs */}
      <nav className="nav-tabs-light">
        <button
          className={`nav-tab-btn ${activePage === 'routes' ? 'active' : ''}`}
          onClick={() => onSelectPage('routes')}
        >
          <Navigation size={15} />
          <span>Route Finder</span>
        </button>

        <button
          className={`nav-tab-btn ${activePage === 'heatmap' ? 'active' : ''}`}
          onClick={() => onSelectPage('heatmap')}
        >
          <Map size={15} />
          <span>Heat Map</span>
        </button>

        <button
          className={`nav-tab-btn ${activePage === 'simulator' ? 'active' : ''}`}
          onClick={() => onSelectPage('simulator')}
        >
          <Sliders size={15} />
          <span>ML Simulator</span>
        </button>

        <button
          className={`nav-tab-btn ${activePage === 'about' ? 'active' : ''}`}
          onClick={() => onSelectPage('about')}
        >
          <Info size={15} />
          <span>About</span>
        </button>
      </nav>

      {/* Right API Status Badge */}
      <div className="status-badge-light">
        {apiOnline ? (
          <>
            <span className="dot-active green" />
            <span className="status-text">FastAPI ML Active</span>
          </>
        ) : (
          <>
            <span className="dot-active red" />
            <span className="status-text text-red">Connecting...</span>
          </>
        )}
      </div>
    </header>
  );
};

export default DesktopHeader;
