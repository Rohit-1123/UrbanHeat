import React from 'react';
import { Home, Map, Navigation, Activity, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'routes', label: 'Routes', icon: Navigation },
  { id: 'analytics', label: 'Insights', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Fixed bottom navigation shown only on mobile widths (see .mobile-bottom-nav
// in App.css). Desktop keeps the existing top Navbar.
const MobileBottomNav = ({ activePage, onNavigate }) => {
  const isActive = (id) => {
    if (activePage === id) return true;
    if (id === 'analytics' && (activePage === 'risk' || activePage === 'simulator')) return true;
    return false;
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-bottom-nav-btn ${active ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
