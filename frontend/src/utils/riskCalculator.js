/**
 * Environmental Microclimate & Heat Risk Calculation Engine
 * Implements standard NOAA Heat Index formulas, Urban Surface Energy Balance,
 * and scientific microclimate risk assessment.
 */

/**
 * Calculates scientifically accurate "Feels Like" temperature using the NOAA Heat Index
 * @param {number} tempC - Ambient Air Temperature in Celsius
 * @param {number} humidity - Relative Humidity percentage (0 - 100)
 * @returns {number} Feels Like temperature in Celsius
 */
export function calculateFeelsLike(tempC, humidity = 60) {
  if (tempC < 20) return Math.round(tempC);

  // Convert to Fahrenheit for standard NOAA equations
  const T = tempC * 1.8 + 32;
  const RH = Math.min(Math.max(humidity, 0), 100);

  // Steadman's initial approximation
  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));

  if (HI >= 80) {
    // Rothfusz regression equation
    HI = -42.379 +
      (2.04901523 * T) +
      (10.14333127 * RH) -
      (0.22475541 * T * RH) -
      (0.00683783 * T * T) -
      (0.05481717 * RH * RH) +
      (0.00122874 * T * T * RH) +
      (0.00085282 * T * RH * RH) -
      (0.00000199 * T * T * RH * RH);

    // Adjustments for extreme low/high humidity
    if (RH < 13 && T >= 80 && T <= 112) {
      const adj = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      HI -= adj;
    } else if (RH > 85 && T >= 80 && T <= 87) {
      const adj = ((RH - 85) / 10) * ((87 - T) / 5);
      HI += adj;
    }
  }

  // Convert back to Celsius
  const feelsLikeC = (HI - 32) / 1.8;
  return Math.round(feelsLikeC);
}

/**
 * Calculates Land Surface Temperature (LST) based on ambient temperature,
 * built-up impervious fraction, canopy cover (NDVI), and UV solar radiation.
 * @param {number} tempC - Air temperature in Celsius
 * @param {number} builtUpDensity - Built density ratio (0 - 1)
 * @param {number} vegetationIndex - NDVI ratio (0 - 1)
 * @param {number} uvIndex - UV Index
 * @returns {number} Surface temperature in Celsius
 */
export function calculateSurfaceTemp(tempC, builtUpDensity = 0.75, vegetationIndex = 0.35, uvIndex = 8.0) {
  const bld = Math.min(Math.max(builtUpDensity, 0), 1);
  const veg = Math.min(Math.max(vegetationIndex, 0), 1);
  const uv = Math.min(Math.max(uvIndex, 0), 14);

  // Concrete & asphalt solar thermal absorption vs evapotranspirative vegetative cooling
  const solarThermalGain = (bld * 9.2) - (veg * 7.4) + ((uv / 10) * 1.8);
  const surfaceTemp = tempC + solarThermalGain;
  return parseFloat(surfaceTemp.toFixed(1));
}

/**
 * Calculates multi-factor normalized Heat Risk Score (0-100)
 * @param {object} params
 * @returns {object} { score, riskLevel, heatIntensity, factors }
 */
export function calculateHeatRisk({
  temperature = 34,
  humidity = 60,
  vegetationIndex = 0.35,
  builtUpDensity = 0.75,
  shadeScore = 0.30,
  uvIndex = 8.0
}) {
  const feelsLike = calculateFeelsLike(temperature, humidity);
  const surfaceTemp = calculateSurfaceTemp(temperature, builtUpDensity, vegetationIndex, uvIndex);

  // Thermal exposure component (40% weight)
  const thermalFactor = Math.min(Math.max((feelsLike - 26) * 4.2, 0), 45);

  // Surface heat retention component (25% weight)
  const surfaceFactor = Math.min(Math.max((surfaceTemp - 30) * 2.8, 0), 30);

  // Built environment impervious component (20% weight)
  const builtFactor = Math.min(Math.max(builtUpDensity * 22, 0), 22);

  // Ecological mitigation credit (vegetation + shade cooling)
  const ecologicalMitigation = (vegetationIndex * 24) + (shadeScore * 12);

  // Aggregate normalized score
  let score = Math.round(thermalFactor + surfaceFactor + builtFactor - ecologicalMitigation + 12);
  score = Math.min(Math.max(score, 10), 100);

  let riskLevel = 'Low';
  let heatIntensity = 'Cool';

  if (score > 75) {
    riskLevel = 'Severe';
    heatIntensity = 'Severe';
  } else if (score > 50) {
    riskLevel = 'High';
    heatIntensity = 'High';
  } else if (score > 25) {
    riskLevel = 'Moderate';
    heatIntensity = 'Moderate';
  } else {
    riskLevel = 'Low';
    heatIntensity = 'Cool';
  }

  return {
    score,
    riskLevel,
    heatIntensity,
    feelsLike,
    surfaceTemp,
    factors: [
      { name: 'Ambient Air Temperature', value: `${temperature}°C`, status: temperature > 34 ? 'High' : 'Normal' },
      { name: 'Perceived Heat Index', value: `${feelsLike}°C`, status: feelsLike > 38 ? 'High' : 'Normal' },
      { name: 'Land Surface Temperature', value: `${surfaceTemp}°C`, status: surfaceTemp > 40 ? 'Severe' : 'Normal' },
      { name: 'Relative Humidity', value: `${humidity}%`, status: humidity > 65 ? 'High' : 'Normal' },
      { name: 'Vegetation Canopy (NDVI)', value: `${Math.round(vegetationIndex * 100)}%`, status: vegetationIndex < 0.3 ? 'Low' : 'Good' },
      { name: 'Built Impervious Density', value: `${Math.round(builtUpDensity * 100)}%`, status: builtUpDensity > 0.7 ? 'High' : 'Normal' }
    ]
  };
}

/**
 * Standardized Risk Color Mapping
 */
export function getRiskColor(score) {
  if (score <= 25) return '#5F8F6B'; // Sage Green (Low)
  if (score <= 50) return '#E69A2D'; // Heat Amber (Moderate)
  if (score <= 75) return '#D96C2F'; // Heat Orange (High)
  return '#C94C4C'; // Coral Red (Severe)
}

/**
 * Geographically interpolates realistic microclimate properties for any given coordinates
 * (e.g. user GPS location or custom map clicks)
 */
export function estimateMicroclimateForCoords(lat, lon) {
  // SRM Kattankulathur campus anchors
  const centralLat = 12.8233;
  const centralLon = 80.0435;
  const coastLon = 80.0435;
  const forestLat = 12.8260;
  const forestLon = 80.0470;

  // Proximity calculations (Euclidean approximate degrees)
  const distToCentral = Math.sqrt((lat - centralLat) ** 2 + (lon - centralLon) ** 2);
  const distToCoast = Math.abs(lon - coastLon);
  const distToForest = Math.sqrt((lat - forestLat) ** 2 + (lon - forestLon) ** 2);

  // Interpolated ecological parameters
  let builtUpDensity = Math.min(Math.max(0.92 - distToCentral * 2.2, 0.25), 0.95);
  let vegetationIndex = Math.min(Math.max(0.15 + (distToForest < 0.05 ? 0.7 : 0.25) - (builtUpDensity * 0.3), 0.10), 0.85);

  // Coastal humidity modulation
  const coastalInfluence = Math.max(0, 1 - distToCoast * 8);
  const humidity = Math.round(55 + coastalInfluence * 18);

  // Temperature variation
  const baseTemp = 34;
  const urbanHeating = (builtUpDensity - 0.5) * 4.5;
  const coastalCooling = coastalInfluence * 2.2;
  const canopyCooling = (vegetationIndex - 0.3) * 4.0;

  const temperature = Math.round((baseTemp + urbanHeating - coastalCooling - canopyCooling) * 10) / 10;
  const uvIndex = Math.round((8.0 + builtUpDensity * 1.2 - vegetationIndex * 1.5) * 10) / 10;
  const shadeScore = parseFloat((vegetationIndex * 0.85).toFixed(2));

  const riskAnalysis = calculateHeatRisk({
    temperature,
    humidity,
    vegetationIndex,
    builtUpDensity,
    shadeScore,
    uvIndex
  });

  return {
    latitude: lat,
    longitude: lon,
    lat,
    lon,
    temperature,
    feelsLike: riskAnalysis.feelsLike,
    surfaceTemp: riskAnalysis.surfaceTemp,
    humidity,
    uv_index: uvIndex,
    vegetation_index: vegetationIndex,
    vegetationIndex,
    vegetation: vegetationIndex > 0.6 ? 'High' : vegetationIndex > 0.3 ? 'Moderate' : 'Low',
    building_density: builtUpDensity,
    builtUpDensity,
    builtUpDensityLevel: builtUpDensity > 0.7 ? 'High' : builtUpDensity > 0.4 ? 'Moderate' : 'Low',
    shade_score: shadeScore,
    heatRiskScore: riskAnalysis.score,
    heat_risk: riskAnalysis.score,
    riskLevel: riskAnalysis.riskLevel,
    risk_level: riskAnalysis.riskLevel,
    heatIntensity: riskAnalysis.heatIntensity,
    heat_intensity: riskAnalysis.heatIntensity,
    lastUpdated: 'Just now'
  };
}
