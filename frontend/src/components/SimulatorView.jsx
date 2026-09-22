import React, { useState } from 'react';
import { Sliders, Thermometer, Droplets, TreeDeciduous, Building, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { predictHeat } from '../services/api';
import { calculateHeatRisk } from '../utils/riskCalculator';

const SimulatorView = () => {
  const [simTemp, setSimTemp] = useState(36);
  const [simHumidity, setSimHumidity] = useState(62);
  const [simVeg, setSimVeg] = useState(0.35);
  const [simBld, setSimBld] = useState(0.75);

  const [livePredictedRisk, setLivePredictedRisk] = useState(68);
  const [liveRiskLevel, setLiveRiskLevel] = useState('High');
  const [simLoading, setSimLoading] = useState(false);

  const runSimulation = async (temp, hum, veg, bld) => {
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
      setLivePredictedRisk(res.predicted_heat_risk);
      setLiveRiskLevel(res.risk_level);
    } catch (err) {
      // Offline fallback using NOAA / surface energy balance equations
      const calc = calculateHeatRisk({
        temperature: temp,
        humidity: hum,
        vegetationIndex: veg,
        builtUpDensity: bld
      });
      setLivePredictedRisk(calc.score);
      setLiveRiskLevel(calc.riskLevel);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="view-container centered-view">
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
            {/* Ambient Temperature */}
            <div className="slider-card-light">
              <div className="slider-card-header">
                <span className="flex-center gap-2"><Thermometer size={16} className="text-red" /> Ambient Temperature</span>
                <span className="slider-val-badge red">{simTemp}°C</span>
              </div>
              <input
                type="range"
                min="25"
                max="45"
                value={simTemp}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSimTemp(val);
                  runSimulation(val, simHumidity, simVeg, simBld);
                }}
              />
            </div>

            {/* Relative Humidity */}
            <div className="slider-card-light">
              <div className="slider-card-header">
                <span className="flex-center gap-2"><Droplets size={16} className="text-blue" /> Relative Humidity</span>
                <span className="slider-val-badge blue">{simHumidity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={simHumidity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSimHumidity(val);
                  runSimulation(simTemp, val, simVeg, simBld);
                }}
              />
            </div>

            {/* Vegetation Index (NDVI) */}
            <div className="slider-card-light">
              <div className="slider-card-header">
                <span className="flex-center gap-2"><TreeDeciduous size={16} className="text-emerald" /> Tree Canopy Coverage (NDVI)</span>
                <span className="slider-val-badge green">{Math.round(simVeg * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={simVeg}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSimVeg(val);
                  runSimulation(simTemp, simHumidity, val, simBld);
                }}
              />
            </div>

            {/* Building Density */}
            <div className="slider-card-light">
              <div className="slider-card-header">
                <span className="flex-center gap-2"><Building size={16} className="text-purple" /> Urban Infrastructure Density</span>
                <span className="slider-val-badge purple">{Math.round(simBld * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={simBld}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSimBld(val);
                  runSimulation(simTemp, simHumidity, simVeg, val);
                }}
              />
            </div>
          </div>

          {/* Results Prediction Card */}
          <div className="result-column">
            <div className="prediction-box-light">
              <span className="prediction-label">ML Predicted Thermal Risk</span>

              {simLoading ? (
                <div className="loading-prediction">
                  <Loader2 size={24} className="animate-spin text-emerald" />
                  <span>Computing Random Forest Risk...</span>
                </div>
              ) : (
                <>
                  <div className={`risk-score-display ${livePredictedRisk > 60 ? 'high' : livePredictedRisk > 40 ? 'moderate' : 'low'}`}>
                    {livePredictedRisk}
                    <span className="risk-denom">/ 100</span>
                  </div>
                  <div className={`risk-pill ${livePredictedRisk > 60 ? 'pill-red' : livePredictedRisk > 40 ? 'pill-amber' : 'pill-green'}`}>
                    <ShieldCheck size={14} />
                    <span>{liveRiskLevel} Thermal Vulnerability</span>
                  </div>
                </>
              )}

              <p className="prediction-desc">
                High tree canopy coverage (NDVI) significantly attenuates thermal radiation, reducing localized risk by up to 30%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorView;
