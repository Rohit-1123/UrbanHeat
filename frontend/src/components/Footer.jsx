import React from 'react';
import { Leaf, ShieldCheck, Heart } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-brand-col">
          <div className="footer-logo">
            <Leaf size={20} className="text-emerald" />
            <span>UrbanHeat</span>
          </div>
          <p className="footer-desc">
            Smart environmental intelligence & heat monitoring platform to analyze urban heat island impacts, assess microclimate vulnerabilities, and empower climate-resilient cities.
          </p>
        </div>

        <div className="footer-links-col">
          <h4>Platform Navigation</h4>
          <ul>
            <li><button onClick={() => onNavigate('home')}>Home</button></li>
            <li><button onClick={() => onNavigate('map')}>Urban Heat Map</button></li>
            <li><button onClick={() => onNavigate('analytics')}>Analytics & Trends</button></li>
            <li><button onClick={() => onNavigate('risk')}>Risk Assessment</button></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4>Insights & Guidance</h4>
          <ul>
            <li><button onClick={() => onNavigate('recommendations')}>Recommendations</button></li>
            <li><button onClick={() => onNavigate('learn')}>Learn UHI Science</button></li>
            <li><button onClick={() => onNavigate('about')}>About Platform</button></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <span>&copy; {new Date().getFullYear()} UrbanHeat Intelligence Platform. All rights reserved.</span>
          <span className="footer-tagline"><ShieldCheck size={14} className="text-emerald" /> Designed for Resilient & Cool Cities</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
