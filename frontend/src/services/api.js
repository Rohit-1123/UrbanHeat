const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Classifies every failed request into a stable errorType and a clean,
// user-safe message — without ever exposing stack traces or raw backend
// error detail to the UI in production. Full detail is still logged to the
// console, but only in development.
const failure = (error, status, detail, method, url) => {
  let errorType = 'unknown';
  let friendlyMessage = 'Something went wrong. Please try again.';

  if (error?.name === 'TimeoutError') {
    errorType = 'timeout';
    friendlyMessage = 'The request took too long to respond. Please try again.';
  } else if (!status) {
    // No response at all: either a network failure or the request was
    // blocked by CORS before a response could be read.
    errorType = 'network';
    friendlyMessage = 'Could not reach the UrbanHeat server. Check your connection and try again.';
  } else if (status >= 500) {
    errorType = 'server';
    friendlyMessage = 'The UrbanHeat server encountered an error. Please try again shortly.';
  } else if (status >= 400) {
    errorType = 'client';
    // Backend error details (e.g. "outside SRM campus boundary") are
    // safe, user-facing validation messages defined in the API itself —
    // surface them as-is rather than a generic message.
    if (detail && !Array.isArray(detail)) friendlyMessage = String(detail);
  }

  if (import.meta.env.DEV) {
    console.error(`[api] ${errorType} error on ${method} ${url}:`, error);
  }
  return Object.assign(error || new Error(friendlyMessage), { errorType, friendlyMessage });
};

const request = async (method, path, { params, body } = {}) => {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}${query}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(45000),
    });
  } catch (e) {
    throw failure(e, 0, null, method, path);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw failure(new Error(`HTTP ${res.status}`), res.status, data?.detail, method, path);
  return data;
};

const apiClient = {
  get: async (path, opts) => ({ data: await request('GET', path, opts) }),
  post: async (path, body) => ({ data: await request('POST', path, { body }) }),
};

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

export const submitFeedback = async (payload) => {
  const response = await apiClient.post('/api/feedback', payload);
  return response.data;
};
