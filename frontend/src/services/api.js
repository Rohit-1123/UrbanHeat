import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getHeatmapData = async (params = {}) => {
  const response = await apiClient.get('/api/heatmap', { params });
  return response.data;
};

export const searchCampusLocations = async (query) => {
  const response = await apiClient.get('/api/location-search', { params: { q: query } });
  return response.data;
};

export const predictHeat = async (environmentalData) => {
  const response = await apiClient.post('/api/predict-heat', environmentalData);
  return response.data;
};

export const recommendRoute = async (start_lat, start_lon, end_lat, end_lon) => {
  const response = await apiClient.post('/api/recommend-route', {
    start_lat: parseFloat(start_lat),
    start_lon: parseFloat(start_lon),
    end_lat: parseFloat(end_lat),
    end_lon: parseFloat(end_lon),
  });
  return response.data;
};

export const getRouteHeatDetails = async (coordinates) => {
  const response = await apiClient.post('/api/route-heat', { coordinates });
  return response.data;
};

export const getLocationHeatDetail = async (lat, lon, location_name = 'City Center') => {
  const response = await apiClient.post('/api/location-heat-detail', {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    location_name,
  });
  return response.data;
};

export const getHeatTrend = async (lat, lon, location_name = 'Selected Area') => {
  const response = await apiClient.get('/api/heat-trend', {
    params: { lat: parseFloat(lat), lon: parseFloat(lon), location_name },
  });
  return response.data;
};

export const getRecommendations = async (lat, lon, location_name = 'Selected Area') => {
  const response = await apiClient.get('/api/recommendations', {
    params: { lat: parseFloat(lat), lon: parseFloat(lon), location_name },
  });
  return response.data;
};
