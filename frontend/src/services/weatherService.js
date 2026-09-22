import { estimateMicroclimateForCoords, calculateHeatRisk } from '../utils/riskCalculator';

/**
 * Fetches real-time weather and meteorological data from the free Open-Meteo API.
 * Falls back cleanly to calibrated local microclimate equations if network fails.
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
    const currentUV = hourly?.uv_index?.[currentHourIndex] ?? 7.5;

    // Calculate microclimate risk score with live inputs
    const microclimate = estimateMicroclimateForCoords(lat, lon);
    const risk = calculateHeatRisk({
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      vegetationIndex: microclimate.vegetationIndex,
      builtUpDensity: microclimate.builtUpDensity
    });

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
      uvIndex: Math.round(currentUV * 10) / 10,
      heatRiskScore: risk.score,
      riskLevel: risk.riskLevel,
      forecast24h,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    console.warn('Open-Meteo API unreachable, using calibrated local microclimate model:', err);
    const estimated = estimateMicroclimateForCoords(lat, lon);
    return {
      isLive: false,
      source: 'Calibrated Microclimate Engine',
      temperature: estimated.temperature,
      feelsLike: estimated.feelsLike,
      humidity: estimated.humidity,
      windSpeed: 8.5,
      uvIndex: estimated.uvIndex,
      heatRiskScore: estimated.heatRiskScore,
      riskLevel: estimated.riskLevel,
      forecast24h: [
        { time: '09:00 AM', temp: estimated.temperature - 3, feelsLike: estimated.feelsLike - 4, uv: 5.5 },
        { time: '12:00 PM', temp: estimated.temperature + 2, feelsLike: estimated.feelsLike + 3, uv: 9.2 },
        { time: '03:00 PM', temp: estimated.temperature + 1, feelsLike: estimated.feelsLike + 2, uv: 7.8 },
        { time: '06:00 PM', temp: estimated.temperature - 2, feelsLike: estimated.feelsLike - 3, uv: 2.1 },
        { time: '09:00 PM', temp: estimated.temperature - 5, feelsLike: estimated.feelsLike - 6, uv: 0 },
      ],
      lastUpdated: 'Just now'
    };
  }
}
