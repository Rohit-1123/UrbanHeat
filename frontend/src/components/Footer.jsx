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
            Smart environmental intelligence & microclimate monitoring platform to analyze urban heat island impacts, calculate heat risk vulnerability, and discover shaded cool routes.
          </p>
        </div>

        <div className="footer-links-col">
          <h4>Platform Navigation</h4>
          <ul>
            <li><button onClick={() => onNavigate('home')}>Home</button></li>
            <li><button onClick={() => onNavigate('map')}>Interactive Heat Map</button></li>
            <li><button onClick={() => onNavigate('routes')}>Cool Route Finder</button></li>
            <li><button onClick={() => onNavigate('analytics')}>Analytics & Risk Hub</button></li>
            <li><button onClick={() => onNavigate('insights')}>Insights & Guide</button></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4>Features & Tools</h4>
          <ul>
            <li><button onClick={() => onNavigate('routes')}>Shaded Walking Navigation</button></li>
            <li><button onClick={() => onNavigate('simulator')}>ML Risk Simulator</button></li>
            <li><button onClick={() => onNavigate('risk')}>Vulnerability Assessment</button></li>
            <li><button onClick={() => onNavigate('recommendations')}>Cooling Recommendations</button></li>
            <li><button onClick={() => onNavigate('learn')}>UHI Science & Education</button></li>
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
