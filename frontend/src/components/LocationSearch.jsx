import React, { useEffect, useState } from 'react';
import { Search, MapPin, Target, ChevronRight } from 'lucide-react';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';
import { searchCampusLocations } from '../services/api';

const POPULAR = ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Coimbatore', 'Madurai'];

const LocationSearch = ({ currentLocation, onSelectLocation, onUseMyLocation }) => {
  const [query, setQuery] = useState('');
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [remoteResults, setRemoteResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const campusLocations = SRM_CAMPUS.places
    .filter((place) => isWithinSrmCampus(place.lat, place.lon))
    .map((place) => ({
      id: `campus-${place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      area: place.name,
      city: 'Tamil Nadu',
      latitude: place.lat,
      longitude: place.lon,
      lat: place.lat,
      lon: place.lon,
      zoneType: place.category,
      temperature: null,
    }));
  const filtered = campusLocations.filter((l) =>
    l.area.toLowerCase().includes(query.toLowerCase()) ||
    l.city.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (query.trim().length < 2) {
      setRemoteResults([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchCampusLocations(query.trim());
        setRemoteResults(results.filter((result) => isWithinSrmCampus(result.lat, result.lon)));
      } catch {
        setRemoteResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc) => {
    onSelectLocation(loc);
    setQuery('');
    setIsOpen(false);
  };

  const handleRemoteSelect = (loc) => {
    onSelectLocation({
      id: loc.id,
      city: 'Tamil Nadu',
      area: loc.name,
      latitude: loc.lat,
      longitude: loc.lon,
      lat: loc.lat,
      lon: loc.lon,
      zoneType: 'Tamil Nadu location',
      source: loc.source,
    });
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
          placeholder="Search a place in Chennai or Tamil Nadu..."
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
        {(showAllPlaces ? campusLocations : campusLocations.filter((loc) => POPULAR.includes(loc.area))).map((loc) => (
          <button
            key={loc.id}
            className={`preset-chip ${currentLocation?.id === loc.id ? 'active' : ''}`}
            onClick={() => handleSelect(loc)}
          >
            <MapPin size={12} />
            <span>{loc.area}</span>
          </button>
        ))}
        <button type="button" className="preset-chip preset-chip-more" onClick={() => setShowAllPlaces((v) => !v)} aria-expanded={showAllPlaces}>
          <span>{showAllPlaces ? 'Fewer places' : `All ${campusLocations.length} places`}</span>
        </button>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && query.length > 0 && (
        <div className="search-dropdown">
          {searching ? (
            <div className="dropdown-empty">Searching places...</div>
          ) : filtered.length > 0 || remoteResults.length > 0 ? (
            <>
              {remoteResults.map((loc) => (
                <div key={loc.id} className="dropdown-item" onClick={() => handleRemoteSelect(loc)}>
                  <MapPin size={16} className="item-icon" />
                  <div className="item-info">
                    <strong>{loc.name}</strong>
                    <span>{loc.source} • Tamil Nadu</span>
                  </div>
                  <ChevronRight size={16} className="chevron-icon" />
                </div>
              ))}
              {filtered.map((loc) => (
              <div
                key={loc.id}
                className="dropdown-item"
                onClick={() => handleSelect(loc)}
              >
                <MapPin size={16} className="item-icon" />
                <div className="item-info">
                  <strong>{loc.area}</strong>
                  <span>{loc.city} • {loc.zoneType}</span>
                </div>
                <ChevronRight size={16} className="chevron-icon" />
              </div>
              ))}
            </>
          ) : (
            <div className="dropdown-empty">No matching place found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
