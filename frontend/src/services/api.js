import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Classifies every failed request into a stable errorType and a clean,
// user-safe message — without ever exposing stack traces or raw backend
// error detail to the UI in production. Full detail is still logged to the
// console, but only in development.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorType = 'unknown';
    let friendlyMessage = 'Something went wrong. Please try again.';

    if (error.code === 'ECONNABORTED') {
      errorType = 'timeout';
      friendlyMessage = 'The request took too long to respond. Please try again.';
    } else if (!error.response) {
      // No response at all: either a network failure or the request was
      // blocked by CORS before a response could be read.
      errorType = 'network';
      friendlyMessage = 'Could not reach the UrbanHeat server. Check your connection and try again.';
    } else {
      const status = error.response.status;
      if (status >= 500) {
        errorType = 'server';
        friendlyMessage = 'The UrbanHeat server encountered an error. Please try again shortly.';
      } else if (status >= 400) {
        errorType = 'client';
        // Backend error details (e.g. "outside SRM campus boundary") are
        // safe, user-facing validation messages defined in the API itself —
        // surface them as-is rather than a generic message.
        friendlyMessage = error.response.data?.detail
          ? (Array.isArray(error.response.data.detail) ? friendlyMessage : String(error.response.data.detail))
          : friendlyMessage;
      }
    }

    if (import.meta.env.DEV) {
      console.error(`[api] ${errorType} error on ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error);
    }

    error.errorType = errorType;
    error.friendlyMessage = friendlyMessage;
    return Promise.reject(error);
  }
);

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
