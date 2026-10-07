import { healthCheck, getHeatmapData, getLocationHeatDetail } from './api';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';
import { estimateMicroclimateForCoords } from '../utils/riskCalculator';

// Default starting location shown before the user searches or selects a
// place: the SRM campus centroid. Its environmental values always come from
// a real backend call, or (only if the backend is unreachable) the same
// calculated microclimate formula used elsewhere in the app — never a
// hardcoded/mocked reading.
const DEFAULT_LOCATION_ID = 'srm-campus-centroid';

// Single mapping from /api/location-heat-detail to the app's location fields.
// `vegetation_cover`/`building_density` in the response are display strings;
// the numeric 0-1 ratios come from `detail.environment`.
export function locationFromDetail(detail) {
  const env = detail.environment || {};
  const level = detail.risk_level?.replace(/ Heat Risk$/i, '');
  return {
    ...detail,
    uv_index: env.uv_index,
    vegetation_index: env.vegetation_index,
    vegetationIndex: env.vegetation_index,
    vegetation: env.vegetation_index > 0.6 ? 'High' : env.vegetation_index > 0.3 ? 'Moderate' : 'Low',
    building_density: env.building_density,
    builtUpDensity: env.building_density,
    builtUpDensityLevel: env.building_density > 0.7 ? 'High' : env.building_density > 0.4 ? 'Moderate' : 'Low',
    shade_score: env.shade_score,
    recommendedAction: detail.warning_message,
    heatRiskScore: detail.heat_risk_score,
    heat_risk: detail.heat_risk_score,
    riskLevel: level,
    risk_level: level,
  };
}

export async function fetchCurrentHeatData() {
  const [lat, lon] = SRM_CAMPUS.center;
  const base = {
    id: DEFAULT_LOCATION_ID,
    city: 'SRM Kattankulathur',
    area: 'SRM Institute Campus',
    latitude: lat,
    longitude: lon,
    lat,
    lon,
  };

  try {
    const detail = await getLocationHeatDetail(lat, lon, base.area);
    return { ...base, ...locationFromDetail(detail) };
  } catch (err) {
    console.warn('Backend unavailable for default location, using calculated microclimate estimate:', err);
    const estimated = estimateMicroclimateForCoords(lat, lon);
    return { ...base, ...estimated, isLive: false, source: 'Calibrated Microclimate Engine' };
  }
}

// Returns real heat points from the backend. Throws on failure so callers
// can show an explicit "live data unavailable" state instead of silently
// substituting fabricated points.
export async function fetchHeatPoints() {
  const livePoints = await getHeatmapData({
    min_lat: SRM_CAMPUS.bounds[0][0],
    max_lat: SRM_CAMPUS.bounds[1][0],
    min_lon: SRM_CAMPUS.bounds[0][1],
    max_lon: SRM_CAMPUS.bounds[1][1]
  });

  return (livePoints || []).map((pt, idx) => {
    const heatRisk = pt.heat_risk;
    let heatIntensity = 'Moderate';
    if (heatRisk > 75) heatIntensity = 'Extreme';
    else if (heatRisk > 50) heatIntensity = 'High';
    else if (heatRisk > 25) heatIntensity = 'Moderate';
    else heatIntensity = 'Cool';

    return {
      id: pt.id ?? idx + 1,
      latitude: pt.latitude,
      longitude: pt.longitude,
      heat_risk: heatRisk,
      heatRiskScore: heatRisk,
      risk_level: pt.risk_level,
      riskLevel: pt.risk_level,
      heat_intensity: heatIntensity,
      heatIntensity,
      temperature: pt.temperature,
      humidity: pt.humidity,
      uv_index: pt.uv_index,
      vegetation_index: pt.vegetation_index,
      vegetation: pt.vegetation_index > 0.6 ? 'High' : pt.vegetation_index > 0.3 ? 'Moderate' : 'Low',
      building_density: pt.building_density,
      builtUpDensityLevel: pt.building_density > 0.7 ? 'High' : pt.building_density > 0.4 ? 'Moderate' : 'Low',
      shade_score: pt.shade_score,
      name: `Zone Point #${idx + 1}`,
      zoneType: 'Urban Microclimate Zone',
      lastUpdated: pt.timestamp || 'Unknown'
    };
  }).filter((point) => isWithinSrmCampus(point.latitude, point.longitude));
}

// Real backend health check — used for the connection-status indicator.
// Not polled on an interval; call it once per app load.
export async function checkBackendStatus() {
  try {
    await healthCheck();
    return true;
  } catch {
    return false;
  }
}
