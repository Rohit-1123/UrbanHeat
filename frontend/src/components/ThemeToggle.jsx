import React from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <button
      className="theme-toggle-btn"
      onClick={onToggle}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <Moon size={18} className="theme-icon moon" />
      ) : (
        <Sun size={18} className="theme-icon sun" />
      )}
      <span className="theme-toggle-text">{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeToggle;
