import { MOCK_LOCATIONS, MOCK_HEAT_POINTS, MOCK_TREND_DATA, MOCK_RECOMMENDATIONS } from '../data/mockData';
import { healthCheck, getHeatmapData, predictHeat } from './api';
import { SRM_CAMPUS, isWithinSrmCampus } from '../config/campus';

export async function fetchLocations() {
  return MOCK_LOCATIONS.filter((location) => (
    isWithinSrmCampus(
      location.latitude ?? location.lat,
      location.longitude ?? location.lon
    )
  ));
}

export async function fetchCurrentHeatData(locationId = 'srm-hub') {
  const found = MOCK_LOCATIONS.find((l) => l.id === locationId);
  return found || MOCK_LOCATIONS.find((location) => location.id === 'srm-hub') || {
    id: 'srm-hub',
    city: 'SRM Kattankulathur',
    area: 'SRM Institute campus',
    latitude: SRM_CAMPUS.center[0],
    longitude: SRM_CAMPUS.center[1]
  };
}

export async function fetchHeatPoints() {
  try {
    const livePoints = await getHeatmapData({
      min_lat: SRM_CAMPUS.bounds[0][0],
      max_lat: SRM_CAMPUS.bounds[1][0],
      min_lon: SRM_CAMPUS.bounds[0][1],
      max_lon: SRM_CAMPUS.bounds[1][1]
    });
    if (livePoints && livePoints.length > 0) {
      return livePoints.map((pt, idx) => {
        const heatRisk = pt.heat_risk || pt.heatRiskScore || 50;
        let heatIntensity = 'Moderate';
        if (heatRisk > 75) heatIntensity = 'Severe';
        else if (heatRisk > 50) heatIntensity = 'High';
        else if (heatRisk > 25) heatIntensity = 'Moderate';
        else heatIntensity = 'Cool';

        return {
          id: pt.id || idx + 1,
          latitude: pt.latitude || pt.lat,
          longitude: pt.longitude || pt.lon,
          heat_risk: heatRisk,
          heatRiskScore: heatRisk,
          risk_level: pt.risk_level || (heatRisk > 75 ? 'Severe' : heatRisk > 50 ? 'High' : heatRisk > 25 ? 'Moderate' : 'Low'),
          riskLevel: pt.riskLevel || (heatRisk > 75 ? 'Severe' : heatRisk > 50 ? 'High' : heatRisk > 25 ? 'Moderate' : 'Low'),
          heat_intensity: pt.heat_intensity || heatIntensity,
          heatIntensity: pt.heatIntensity || heatIntensity,
          temperature: pt.temperature || 34,
          feelsLike: pt.feelsLike || (pt.temperature ? pt.temperature + 5 : 39),
          surfaceTemp: pt.surfaceTemp || (pt.temperature ? pt.temperature + 4.5 : 38.5),
          humidity: pt.humidity || 60,
          uv_index: pt.uv_index || 8.0,
          vegetation_index: pt.vegetation_index !== undefined ? pt.vegetation_index : 0.35,
          vegetation: pt.vegetation || (pt.vegetation_index > 0.6 ? 'High' : pt.vegetation_index > 0.3 ? 'Moderate' : 'Low'),
          building_density: pt.building_density !== undefined ? pt.building_density : 0.75,
          builtUpDensityLevel: pt.builtUpDensityLevel || (pt.building_density > 0.7 ? 'High' : pt.building_density > 0.4 ? 'Moderate' : 'Low'),
          shade_score: pt.shade_score !== undefined ? pt.shade_score : 0.3,
          name: pt.name || pt.location_name || pt.area || `Zone Point #${idx + 1}`,
          zoneType: pt.zoneType || 'Urban Microclimate Zone',
          lastUpdated: pt.lastUpdated || 'Just now'
        };
      });
    }
  } catch (err) {
    console.warn('Backend heatmap endpoint offline, using mock heat points:', err);
  }
  return MOCK_HEAT_POINTS.filter((point) => isWithinSrmCampus(point.latitude, point.longitude));
}

export async function fetchTrendData(range = 'today') {
  return MOCK_TREND_DATA[range] || MOCK_TREND_DATA['today'];
}

export async function fetchRecommendations() {
  return MOCK_RECOMMENDATIONS;
}

export async function checkBackendStatus() {
  try {
    await healthCheck();
    return true;
  } catch {
    return false;
  }
}
