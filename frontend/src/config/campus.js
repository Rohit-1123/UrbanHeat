import areas from './areas.json';

// Service area: all of Tamil Nadu, including Chennai metro. Export names keep
// the old SRM_CAMPUS spelling so existing imports keep working. areas.json is a
// copy of backend/data/areas.json (a backend test checks they match).
export const SRM_CAMPUS = {
  center: [13.0827, 80.2707],
  bounds: [
    [7.9, 76.1],
    [13.7, 80.5]
  ],
  places: areas.map(({ name, lat, lon, group }) => ({ name, lat, lon, category: group })),
  // Preset walks; each is a few km so OSRM returns real alternatives.
  landmarks: [
    { name: 'T. Nagar to Anna Nagar', start: { lat: 13.0418, lon: 80.2341 }, end: { lat: 13.0850, lon: 80.2101 } },
    { name: 'Adyar to Mylapore', start: { lat: 13.0012, lon: 80.2565 }, end: { lat: 13.0368, lon: 80.2676 } },
    { name: 'Egmore to Marina Beach', start: { lat: 13.0732, lon: 80.2609 }, end: { lat: 13.0500, lon: 80.2824 } },
    { name: 'Velachery to Guindy', start: { lat: 12.9815, lon: 80.2180 }, end: { lat: 13.0067, lon: 80.2206 } },
    { name: 'Tambaram to Chromepet', start: { lat: 12.9249, lon: 80.1000 }, end: { lat: 12.9516, lon: 80.1462 } },
  ]
};

export const isWithinSrmCampus = (lat, lon) => (
  Number.isFinite(lat)
  && Number.isFinite(lon)
  && lat >= SRM_CAMPUS.bounds[0][0]
  && lat <= SRM_CAMPUS.bounds[1][0]
  && lon >= SRM_CAMPUS.bounds[0][1]
  && lon <= SRM_CAMPUS.bounds[1][1]
);

// Name of the closest listed area, or null if none is within ~3 km.
export const nearestPlaceName = (lat, lon) => {
  let best = null;
  let bestDist = Infinity;
  for (const place of SRM_CAMPUS.places) {
    const d = Math.hypot((place.lat - lat) * 111000, (place.lon - lon) * 108500);
    if (d < bestDist) { bestDist = d; best = place; }
  }
  return bestDist <= 3000 ? best.name : null;
};
