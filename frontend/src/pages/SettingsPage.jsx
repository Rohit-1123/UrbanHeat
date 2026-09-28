import React, { useEffect, useState } from 'react';
import {
  Sun,
  Moon,
  MonitorSmartphone,
  MapPin,
  Bell,
  Info,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: MonitorSmartphone },
];

const BACKEND_STATUS_META = {
  checking: { label: 'Checking…', className: 'checking' },
  connected: { label: 'Live', className: 'connected' },
  disconnected: { label: 'Offline', className: 'disconnected' },
};

const SettingsPage = ({ themePreference, onSetThemePreference, backendStatus, onNavigate, onUseMyLocation, locationError }) => {
  // Read-only permission status via the Permissions API — this never
  // triggers a browser prompt itself, it only reports whatever the browser
  // already knows (granted / denied / prompt / unsupported).
  const [locationPermission, setLocationPermission] = useState('unsupported');

  useEffect(() => {
    if (!navigator.permissions || !navigator.permissions.query) return;
    let cancelled = false;
    navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      if (cancelled) return;
      setLocationPermission(status.state);
      status.onchange = () => setLocationPermission(status.state);
    }).catch(() => setLocationPermission('unsupported'));
    return () => { cancelled = true; };
  }, []);

  const locationStatusMeta = {
    granted: { label: 'Location access granted', icon: CheckCircle2, className: 'ok' },
    denied: { label: 'Location access denied', icon: AlertCircle, className: 'bad' },
    prompt: { label: 'Not yet requested', icon: HelpCircle, className: 'neutral' },
    unsupported: { label: 'Not supported by this browser', icon: HelpCircle, className: 'neutral' },
  }[locationPermission] || { label: 'Unknown', icon: HelpCircle, className: 'neutral' };

  const statusMeta = BACKEND_STATUS_META[backendStatus] || BACKEND_STATUS_META.checking;

  return (
    <div className="page-container settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Appearance, location access, and platform information.</p>
      </div>

      {/* Appearance */}
      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-option-group" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`settings-option-row ${themePreference === id ? 'active' : ''}`}
              onClick={() => onSetThemePreference(id)}
              role="radio"
              aria-checked={themePreference === id}
            >
              <span className="settings-row-icon"><Icon size={18} /></span>
              <span className="settings-row-label">{label}</span>
              {themePreference === id && <CheckCircle2 size={18} className="settings-row-check" />}
            </button>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className="settings-section">
        <h2 className="settings-section-title">Location</h2>
        <div className="settings-card">
          <div className={`settings-status-row ${locationStatusMeta.className}`}>
            <locationStatusMeta.icon size={18} />
            <span>{locationStatusMeta.label}</span>
          </div>
          {locationError && <p className="settings-hint settings-hint-error">{locationError}</p>}
          <p className="settings-hint">
            UrbanHeat only uses your location to center the map and check whether you're inside the SRM Kattankulathur campus area. It is never stored or sent anywhere else.
          </p>
          <button type="button" className="settings-btn-primary" onClick={onUseMyLocation}>
            <MapPin size={16} />
            <span>Use My Location</span>
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="settings-section">
        <h2 className="settings-section-title">Notifications</h2>
        <div className="settings-option-row settings-row-static">
          <span className="settings-row-icon"><Bell size={18} /></span>
          <div className="settings-row-text">
            <span className="settings-row-label">Environmental Alerts</span>
            <span className="settings-row-sub">Not yet available</span>
          </div>
          <span className="settings-toggle-disabled" aria-disabled="true" title="Push notifications are not implemented yet" />
        </div>
      </section>

      {/* About */}
      <section className="settings-section">
        <h2 className="settings-section-title">About</h2>
        <div className="settings-option-group">
          <button type="button" className="settings-option-row" onClick={() => onNavigate('about')}>
            <span className="settings-row-icon"><Info size={18} /></span>
            <span className="settings-row-label">About UrbanHeat</span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
          <button type="button" className="settings-option-row" onClick={() => onNavigate('recommendations')}>
            <span className="settings-row-icon"><Lightbulb size={18} /></span>
            <span className="settings-row-label">Recommendations</span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
          <button type="button" className="settings-option-row" onClick={() => onNavigate('learn')}>
            <span className="settings-row-icon"><BookOpen size={18} /></span>
            <span className="settings-row-label">Learn: Urban Heat Islands</span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
        </div>

        <div className="settings-option-row settings-row-static">
          <span className="settings-row-icon"><ShieldCheck size={18} /></span>
          <div className="settings-row-text">
            <span className="settings-row-label">Backend API Status</span>
            <span className="settings-row-sub">Live GET /health check</span>
          </div>
          <span className={`settings-api-badge ${statusMeta.className}`}>
            <span className="settings-api-dot" />
            {statusMeta.label}
          </span>
        </div>

        <div className="settings-option-row settings-row-static">
          <span className="settings-row-label settings-version-label">Version</span>
          <span className="settings-row-sub">1.0.0</span>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
