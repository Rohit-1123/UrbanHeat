import React from 'react';
import { Leaf, Home, Map, Navigation, BarChart3, BookOpen, Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import InstallAppButton from './InstallAppButton';

const BACKEND_STATUS_META = {
  checking: { label: 'Connecting…', className: 'checking' },
  connected: { label: 'Backend Connected', className: 'connected' },
  disconnected: { label: 'Backend Offline', className: 'disconnected' },
};

const Navbar = ({ activePage, onNavigate, theme, onToggleTheme, backendStatus = 'checking' }) => {
  // Primary topics. Settings intentionally lives only in the header's gear
  // icon (navbar-actions below), not here and not in the mobile bottom nav —
  // it's secondary, not a top-level destination.
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'map', label: 'Heat Map', icon: Map },
    { id: 'routes', label: 'Cool Routes', icon: Navigation },
    { id: 'analytics', label: 'Analytics & Risk', icon: BarChart3 },
    { id: 'insights', label: 'Insights & Guide', icon: BookOpen },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
  };

  // Helper to determine if a grouped route is active
  const isNavActive = (id) => {
    if (activePage === id) return true;
    if (id === 'analytics' && (activePage === 'risk' || activePage === 'simulator')) return true;
    if (id === 'insights' && (activePage === 'recommendations' || activePage === 'learn' || activePage === 'about')) return true;
    return false;
  };

  return (
    <header className="app-navbar">
      <div className="navbar-content">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => handleNavClick('home')}>
          <div className="brand-logo-icon">
            <Leaf size={22} className="logo-leaf" />
          </div>
          <div className="brand-title-wrap">
            <span className="brand-main-title">Urban<span className="text-accent">Heat</span></span>
            <span className="brand-sub-badge">PLATFORM</span>
          </div>
        </div>

        {/* Desktop Navigation Links (Clean 5 topics) */}
        <nav className="desktop-nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                className={`nav-link-btn ${active ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                title={item.label}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Install, Backend Status, Settings & Theme Toggle
            (mobile uses the bottom nav for Home/Map/Routes/Insights;
            Settings and Install live here in the header on every width). */}
        <div className="navbar-actions">
          <InstallAppButton variant="header" />

          <span
            className={`backend-status-badge ${BACKEND_STATUS_META[backendStatus].className}`}
            title={BACKEND_STATUS_META[backendStatus].label}
          >
            <span className="backend-status-dot" />
            <span className="backend-status-label">{BACKEND_STATUS_META[backendStatus].label}</span>
          </span>

          <button
            type="button"
            className={`navbar-settings-btn ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            aria-label="Settings"
            aria-current={activePage === 'settings' ? 'page' : undefined}
            title="Settings"
          >
            <Settings size={18} />
          </button>

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
