import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeftRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getRiskColor } from '../utils/riskCalculator';
import { SRM_CAMPUS } from '../config/campus';
import { getHeatmapData } from '../services/api';

// Real, hand-curated SRM campus places (name + coordinates) — not mock data.
const CAMPUS_PLACES = SRM_CAMPUS.places;

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const findNearestHeatPoint = async (lat, lon) => {
  const boxes = [0.003, 0.01];
  for (const delta of boxes) {
    const points = await getHeatmapData({
      min_lat: lat - delta,
      max_lat: lat + delta,
      min_lon: lon - delta,
      max_lon: lon + delta,
    });
    if (points && points.length > 0) {
      return points.reduce((closest, p) => {
        const dist = haversineMeters(lat, lon, p.latitude, p.longitude);
        return !closest || dist < closest.dist ? { point: p, dist } : closest;
      }, null)?.point;
    }
  }
  return null;
};

const AreaComparison = () => {
  const [area1Name, setArea1Name] = useState(CAMPUS_PLACES[0]?.name);
  const [area2Name, setArea2Name] = useState(CAMPUS_PLACES[1]?.name || CAMPUS_PLACES[0]?.name);
  const [metrics, setMetrics] = useState({});
  const [loadingNames, setLoadingNames] = useState([]);
  const [errorNames, setErrorNames] = useState([]);

  const placeByName = useMemo(
    () => Object.fromEntries(CAMPUS_PLACES.map((p) => [p.name, p])),
    []
  );

  const loadMetricsFor = useCallback(async (name) => {
    const place = placeByName[name];
    if (!place || metrics[name] || loadingNames.includes(name)) return;

    setLoadingNames((prev) => [...prev, name]);
    setErrorNames((prev) => prev.filter((n) => n !== name));

    try {
      const point = await findNearestHeatPoint(place.lat, place.lon);
      if (!point) throw new Error('No heat data near this location');
      setMetrics((prev) => ({
        ...prev,
        [name]: {
          temperature: point.temperature,
          heatRiskScore: point.heat_risk,
          riskLevel: point.risk_level,
          vegetationIndex: point.vegetation_index,
          builtUpDensity: point.building_density,
        },
      }));
    } catch {
      setErrorNames((prev) => [...prev, name]);
    } finally {
      setLoadingNames((prev) => prev.filter((n) => n !== name));
    }
  }, [placeByName, metrics, loadingNames]);

  useEffect(() => { loadMetricsFor(area1Name); }, [area1Name]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadMetricsFor(area2Name); }, [area2Name]); // eslint-disable-line react-hooks/exhaustive-deps

  const area1 = metrics[area1Name];
  const area2 = metrics[area2Name];
  const isLoading = loadingNames.includes(area1Name) || loadingNames.includes(area2Name);
  const hasError = errorNames.includes(area1Name) || errorNames.includes(area2Name);

  const color1 = area1 ? getRiskColor(area1.heatRiskScore) : '#94a3b8';
  const color2 = area2 ? getRiskColor(area2.heatRiskScore) : '#94a3b8';

  return (
    <div className="chart-card-wrapper">
      <div className="chart-card-header">
        <div>
          <h3>Urban Microclimate Comparison Tool</h3>
          <p className="subtext">Compare concrete density, tree canopy, and thermal stress between two urban zones</p>
        </div>
      </div>

      {/* Area Selectors */}
      <div className="comparison-selectors-row">
        <div className="selector-box">
          <label className="select-label">Zone A:</label>
          <select
            className="select-light"
            value={area1Name}
            onChange={(e) => setArea1Name(e.target.value)}
          >
            {CAMPUS_PLACES.map((loc) => (
              <option key={loc.name} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div className="versus-badge">
          <ArrowLeftRight size={16} />
        </div>

        <div className="selector-box">
          <label className="select-label">Zone B:</label>
          <select
            className="select-light"
            value={area2Name}
            onChange={(e) => setArea2Name(e.target.value)}
          >
            {CAMPUS_PLACES.map((loc) => (
              <option key={loc.name} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="rec-status-row">
          <Loader2 size={18} className="animate-spin text-emerald" />
          <span>Loading real heat data for these zones...</span>
        </div>
      )}

      {!isLoading && hasError && (
        <div className="rec-status-row">
          <AlertCircle size={18} className="text-red" />
          <span>No heat data available near one of these zones yet. Try a different pair.</span>
        </div>
      )}

      {/* Side-by-Side Metrics Grid */}
      {!isLoading && area1 && area2 && (
        <>
          <div className="comparison-grid">
            <div className="comparison-card zone-a">
              <h4 className="zone-name">{area1Name}</h4>
              <span className="risk-pill-sm" style={{ backgroundColor: `${color1}20`, color: color1 }}>
                {area1.riskLevel} Risk ({area1.heatRiskScore}/100)
              </span>

              <div className="metric-row">
                <span className="metric-lbl">Ambient Air Temp</span>
                <strong className="metric-val">{area1.temperature}°C</strong>
              </div>
              <div className="metric-row">
                <span className="metric-lbl">Tree Canopy Cover</span>
                <strong className="metric-val">{Math.round(area1.vegetationIndex * 100)}%</strong>
              </div>
              <div className="metric-row">
                <span className="metric-lbl">Built Concrete Density</span>
                <strong className="metric-val">{Math.round(area1.builtUpDensity * 100)}%</strong>
              </div>
            </div>

            <div className="comparison-card zone-b">
              <h4 className="zone-name">{area2Name}</h4>
              <span className="risk-pill-sm" style={{ backgroundColor: `${color2}20`, color: color2 }}>
                {area2.riskLevel} Risk ({area2.heatRiskScore}/100)
              </span>

              <div className="metric-row">
                <span className="metric-lbl">Ambient Air Temp</span>
                <strong className="metric-val">{area2.temperature}°C</strong>
              </div>
              <div className="metric-row">
                <span className="metric-lbl">Tree Canopy Cover</span>
                <strong className="metric-val">{Math.round(area2.vegetationIndex * 100)}%</strong>
              </div>
              <div className="metric-row">
                <span className="metric-lbl">Built Concrete Density</span>
                <strong className="metric-val">{Math.round(area2.builtUpDensity * 100)}%</strong>
              </div>
            </div>
          </div>

          <div className="comparison-diff-note">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>
              <strong>Key Finding:</strong> {area1.temperature === area2.temperature
                ? `${area1Name} and ${area2Name} have similar ambient temperatures.`
                : `${area1.temperature > area2.temperature ? area2Name : area1Name} is ${Math.abs(area1.temperature - area2.temperature).toFixed(1)}°C cooler, with ${Math.round((area1.temperature > area2.temperature ? area2.vegetationIndex : area1.vegetationIndex) * 100)}% tree canopy cover vs ${Math.round((area1.temperature > area2.temperature ? area1.vegetationIndex : area2.vegetationIndex) * 100)}%.`}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default AreaComparison;
