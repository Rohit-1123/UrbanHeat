import React, { useState } from 'react';
import { Leaf, Menu, X, Sun, Moon, Map, BarChart3, AlertTriangle, ShieldCheck, BookOpen, Info, Home } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ activePage, onNavigate, theme, onToggleTheme }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'map', label: 'Heat Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
    { id: 'recommendations', label: 'Recommendations', icon: ShieldCheck },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
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

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-link-btn ${activePage === item.id ? 'active' : ''}`}
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
            return (
              <button
                key={item.id}
                className={`mobile-nav-link ${activePage === item.id ? 'active' : ''}`}
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
