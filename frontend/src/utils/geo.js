import { nearestPlaceName } from '../config/campus';

// Best GPS fix within ~20 s. A single getCurrentPosition call usually returns the first,
// coarse reading (cell/Wi-Fi/IP); watching lets the receiver settle, and we stop as soon as
// a fix is within 50 m or keep the most accurate one seen. A best fix worse than maxAccuracy
// (IP/cell guess, often tens of km off) is rejected instead of silently used.
export const getPosition = ({ goodEnough = 50, maxWait = 20000, maxAccuracy = 2000 } = {}) => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject({ code: 0, message: 'Geolocation is not supported by this browser.' });
    return;
  }
  let best = null;
  let timer;
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
      if (pos.coords.accuracy <= goodEnough) done();
    },
    (err) => (err.code === 1 ? done(err) : undefined), // transient errors: keep waiting for a fix
    { enableHighAccuracy: true, timeout: maxWait, maximumAge: 0 }
  );
  function done(err) {
    navigator.geolocation.clearWatch(watchId);
    clearTimeout(timer);
    if (best && best.coords.accuracy > maxAccuracy) reject({ code: 4, message: `Only an approximate location (about ${Math.round(best.coords.accuracy / 1000)} km) was available. Turn on GPS / precise location, or place the pin on the map.` });
    else if (best) resolve(best);
    else reject(err || { code: 3, message: 'Timed out waiting for a location fix.' });
  }
  timer = setTimeout(() => done(), maxWait);
});

// Set when the fix is too coarse to trust for walking directions (typical desktop IP/Wi-Fi location).
export const approximateNote = (pos) => (
  pos.coords.accuracy > 1000
    ? `Your location is approximate (within about ${(pos.coords.accuracy / 1000).toFixed(1)} km). Turn on device GPS for an exact position, or drag the pin.`
    : null
);

export const gpsAreaName = (lat, lon) => {
  const near = nearestPlaceName(lat, lon);
  return near ? `Near ${near}` : 'Current Geolocation';
};
