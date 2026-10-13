import React, { useEffect, useState } from 'react';
import { MapPin, Target } from 'lucide-react';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';
import { searchCampusLocations } from '../services/api';

// Text box for one end of a route: type a place name to pick from the area list
// and live map search, or tap the target button to use GPS.
const PlaceInput = ({ which, label, active, onActivate, onPick, onUseLocation }) => {
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [remote, setRemote] = useState([]);
  const [searching, setSearching] = useState(false);

  const q = text.trim().toLowerCase();
  const local = q ? SRM_CAMPUS.places.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5) : [];

  useEffect(() => {
    if (!editing || q.length < 2) { setRemote([]); return undefined; }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchCampusLocations(text.trim());
        setRemote(results.filter((r) => isWithinSrmCampus(r.lat, r.lon)));
      } catch {
        setRemote([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [text, editing]);

  const pick = (name, lat, lon) => {
    setEditing(false);
    setText('');
    onPick({ lat, lon }, name);
  };

  return (
    <div className={`journey-row ${active ? 'placing' : ''}`} style={{ position: 'relative' }}>
      <span className={`journey-dot ${which}`} />
      <div className="journey-place" style={{ cursor: 'text' }}>
        <small>{which === 'start' ? 'From' : 'To'}</small>
        <input
          type="text"
          className="journey-input"
          value={editing ? text : ''}
          placeholder={label}
          aria-label={which === 'start' ? 'Start place' : 'Destination place'}
          onFocus={() => { setEditing(true); onActivate(); }}
          onBlur={() => window.setTimeout(() => setEditing(false), 150)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            const first = remote[0] ? [remote[0].name, remote[0].lat, remote[0].lon] : local[0] && [local[0].name, local[0].lat, local[0].lon];
            if (e.key === 'Enter' && first) pick(...first);
          }}
        />
      </div>
      <button type="button" className="sky-icon-btn" onClick={onUseLocation} title="Use my GPS location" aria-label={`Use my GPS location as ${which === 'start' ? 'start' : 'destination'}`}>
        <Target size={13} />
      </button>
      {editing && q.length > 0 && (
        <div className="search-dropdown" style={{ top: '100%' }}>
          {[...local.map((p) => ({ id: `l-${p.name}`, name: p.name, sub: p.category, lat: p.lat, lon: p.lon })),
            ...remote.map((r) => ({ id: r.id, name: r.name, sub: 'OpenStreetMap', lat: r.lat, lon: r.lon }))].map((o) => (
            <div key={o.id} className="dropdown-item" onMouseDown={() => pick(o.name, o.lat, o.lon)}>
              <MapPin size={16} className="item-icon" />
              <div className="item-info"><strong>{o.name}</strong><span>{o.sub}</span></div>
            </div>
          ))}
          {searching && <div className="dropdown-empty">Searching places...</div>}
          {!searching && !local.length && !remote.length && <div className="dropdown-empty">No matching place found</div>}
        </div>
      )}
    </div>
  );
};

export default PlaceInput;
