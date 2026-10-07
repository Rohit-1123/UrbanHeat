/**
 * Fetches real-time weather and meteorological data from the free Open-Meteo API.
 * Weather only: the heat-risk score always comes from the backend. On failure
 * returns { isLive: false } with no values, never invented readings.
 */
export async function fetchLiveWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,uv_index&timezone=auto&forecast_days=2`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.statusText}`);
    
    const data = await response.json();
    const current = data.current;
    const hourly = data.hourly;

    const currentHourIndex = new Date().getHours();
    const currentUV = hourly?.uv_index?.[currentHourIndex];

    // Format next 24 hours of forecast
    const forecast24h = [];
    if (hourly && hourly.time) {
      for (let i = currentHourIndex; i < currentHourIndex + 24 && i < hourly.time.length; i++) {
        const timeStr = new Date(hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        forecast24h.push({
          time: timeStr,
          temp: Math.round(hourly.temperature_2m[i]),
          feelsLike: Math.round(hourly.apparent_temperature[i]),
          humidity: Math.round(hourly.relative_humidity_2m[i]),
          uv: hourly.uv_index[i] !== undefined ? hourly.uv_index[i] : 0,
        });
      }
    }

    return {
      isLive: true,
      source: 'Open-Meteo Live API',
      temperature: Math.round(current.temperature_2m * 10) / 10,
      feelsLike: Math.round(current.apparent_temperature * 10) / 10,
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
      uvIndex: Number.isFinite(currentUV) ? Math.round(currentUV * 10) / 10 : undefined,
      forecast24h,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    console.warn('Open-Meteo API unreachable:', err);
    return { isLive: false };
  }
}
