import React, { useState } from 'react';
import { Leaf, Menu, X, Home, Map, Navigation, BarChart3, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ activePage, onNavigate, theme, onToggleTheme }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Minimal, focused top-level topics
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'map', label: 'Heat Map', icon: Map },
    { id: 'routes', label: 'Cool Routes', icon: Navigation },
    { id: 'analytics', label: 'Analytics & Risk', icon: BarChart3 },
    { id: 'insights', label: 'Insights & Guide', icon: BookOpen },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
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
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Theme Toggle & Mobile Hamburger */}
        <div className="navbar-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                className={`mobile-nav-link ${active ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;
