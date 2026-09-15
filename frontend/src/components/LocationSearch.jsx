import React, { useState } from 'react';
import { Search, MapPin, Target, ChevronRight } from 'lucide-react';
import { MOCK_LOCATIONS } from '../data/mockData';

const LocationSearch = ({ currentLocation, onSelectLocation, onUseMyLocation }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = MOCK_LOCATIONS.filter((l) =>
    l.area.toLowerCase().includes(query.toLowerCase()) ||
    l.city.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (loc) => {
    onSelectLocation(loc);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="location-search-card">
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search your city or urban zone to explore heat conditions..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <button className="btn-location-geo" onClick={onUseMyLocation} title="Use My GPS Location">
          <Target size={16} />
          <span>My Location</span>
        </button>
      </div>

      {/* Preset Chips */}
      <div className="location-preset-chips">
        <span className="chips-label">Popular Zones:</span>
        {MOCK_LOCATIONS.map((loc) => (
          <button
            key={loc.id}
            className={`preset-chip ${currentLocation?.id === loc.id ? 'active' : ''}`}
            onClick={() => handleSelect(loc)}
          >
            <MapPin size={12} />
            <span>{loc.area}</span>
          </button>
        ))}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && query.length > 0 && (
        <div className="search-dropdown">
          {filtered.length > 0 ? (
            filtered.map((loc) => (
              <div
                key={loc.id}
                className="dropdown-item"
                onClick={() => handleSelect(loc)}
              >
                <MapPin size={16} className="item-icon" />
                <div className="item-info">
                  <strong>{loc.area}</strong>
                  <span>{loc.city} • Temp: {loc.temperature}°C</span>
                </div>
                <ChevronRight size={16} className="chevron-icon" />
              </div>
            ))
          ) : (
            <div className="dropdown-empty">No matching urban zones found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
