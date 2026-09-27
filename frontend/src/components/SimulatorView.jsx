import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Thermometer, Droplets, TreeDeciduous, Building, Loader2, ShieldCheck, WifiOff } from 'lucide-react';
import { predictHeat } from '../services/api';
import { calculateHeatRisk } from '../utils/riskCalculator';

const SimulatorView = () => {
  const [simTemp, setSimTemp] = useState(36);
  const [simHumidity, setSimHumidity] = useState(62);
  const [simVeg, setSimVeg] = useState(0.35);
  const [simBld, setSimBld] = useState(0.75);

  // No fabricated starting score: null until the first real prediction
  // (live model, or the calculated offline formula) resolves.
  const [livePredictedRisk, setLivePredictedRisk] = useState(null);
  const [liveRiskLevel, setLiveRiskLevel] = useState(null);
  const [simLoading, setSimLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const requestIdRef = useRef(0);

  const runSimulation = async (temp, hum, veg, bld) => {
    const requestId = ++requestIdRef.current;
    setSimLoading(true);
    try {
      const res = await predictHeat({
        temperature: temp,
        humidity: hum,
        uv_index: 8.5,
        vegetation_index: veg,
        building_density: bld,
        shade_score: veg * 0.75
      });
      if (requestId !== requestIdRef.current) return;
      setLivePredictedRisk(res.predicted_heat_risk);
      setLiveRiskLevel(res.risk_level);
      setIsOffline(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      // Backend unreachable: fall back to the same calculated NOAA-style
      // heat-index formula used elsewhere in the app (never a fabricated
      // number), and label it clearly as an offline estimate.
      const calc = calculateHeatRisk({
        temperature: temp,
        humidity: hum,
        vegetationIndex: veg,
        builtUpDensity: bld
      });
      setLivePredictedRisk(calc.score);
      setLiveRiskLevel(calc.riskLevel);
      setIsOffline(true);
    } finally {
      if (requestId === requestIdRef.current) setSimLoading(false);
    }
  };

  // Run a real prediction for the default slider values on mount, instead
  // of showing a hardcoded starting score.
  useEffect(() => {
    runSimulation(simTemp, simHumidity, simVeg, simBld);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const riskBand = livePredictedRisk > 60 ? 'high' : livePredictedRisk > 40 ? 'moderate' : 'low';

  const sliders = [
    {
      key: 'temp',
      icon: Thermometer,
      colorClass: 'red',
      label: 'Ambient Temperature',
      value: simTemp,
      display: `${simTemp}°C`,
      min: 25,
      max: 45,
      step: 1,
      onChange: (val) => { setSimTemp(val); runSimulation(val, simHumidity, simVeg, simBld); }
    },
    {
      key: 'humidity',
      icon: Droplets,
      colorClass: 'blue',
      label: 'Relative Humidity',
      value: simHumidity,
      display: `${simHumidity}%`,
      min: 30,
      max: 90,
      step: 1,
      onChange: (val) => { setSimHumidity(val); runSimulation(simTemp, val, simVeg, simBld); }
    },
    {
      key: 'veg',
      icon: TreeDeciduous,
      colorClass: 'green',
      label: 'Tree Canopy Coverage (NDVI)',
      value: simVeg,
      display: `${Math.round(simVeg * 100)}%`,
      min: 0.05,
      max: 0.95,
      step: 0.05,
      onChange: (val) => { setSimVeg(val); runSimulation(simTemp, simHumidity, val, simBld); }
    },
    {
      key: 'bld',
      icon: Building,
      colorClass: 'purple',
      label: 'Urban Infrastructure Density',
      value: simBld,
      display: `${Math.round(simBld * 100)}%`,
      min: 0.1,
      max: 0.95,
      step: 0.05,
      onChange: (val) => { setSimBld(val); runSimulation(simTemp, simHumidity, simVeg, val); }
    }
  ];

  return (
    <div className="simulator-card-wide">
      <div className="card-top-header">
        <div className="icon-circle shadow-emerald">
          <Sliders size={22} className="text-emerald" />
        </div>
        <div>
          <h2>Microclimate ML Risk Simulator</h2>
          <p>Adjust environmental factors to predict heat vulnerability score instantly.</p>
        </div>
      </div>

      <div className="simulator-grid">
        {/* Sliders Area */}
        <div className="sliders-column">
          {sliders.map(({ key, icon: Icon, colorClass, label, value, display, min, max, step, onChange }) => {
            const pct = ((value - min) / (max - min)) * 100;
            return (
              <div className="slider-card-light" key={key}>
                <div className="slider-card-header">
                  <span className="slider-label"><Icon size={16} className={`text-${colorClass === 'green' ? 'emerald' : colorClass === 'purple' ? 'purple' : colorClass}`} /> {label}</span>
                  <span className={`slider-val-badge ${colorClass}`}>{display}</span>
                </div>
                <input
                  type="range"
                  className={`sim-slider sim-slider-${colorClass}`}
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  style={{ '--fill-pct': `${pct}%` }}
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  aria-label={label}
                />
              </div>
            );
          })}
        </div>

        {/* Results Prediction Card */}
        <div className="result-column">
          <div className="prediction-box-light">
            <span className="prediction-label">ML Predicted Thermal Risk</span>

            {simLoading && livePredictedRisk === null ? (
              <div className="loading-prediction">
                <Loader2 size={24} className="animate-spin text-emerald" />
                <span>Computing Random Forest Risk...</span>
              </div>
            ) : (
              <>
                <div className={`risk-score-display ${riskBand}`}>
                  {simLoading ? <Loader2 size={22} className="animate-spin" /> : livePredictedRisk}
                  {!simLoading && <span className="risk-denom">/ 100</span>}
                </div>
                <div className={`risk-pill pill-${riskBand === 'high' ? 'red' : riskBand === 'moderate' ? 'amber' : 'green'}`}>
                  <ShieldCheck size={14} />
                  <span>{liveRiskLevel} Thermal Vulnerability</span>
                </div>
                {isOffline && (
                  <div className="sim-offline-note">
                    <WifiOff size={13} />
                    <span>Backend unavailable — showing an offline calculated estimate.</span>
                  </div>
                )}
              </>
            )}

            <p className="prediction-desc">
              High tree canopy coverage (NDVI) significantly attenuates thermal radiation, reducing localized risk by up to 30%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorView;
