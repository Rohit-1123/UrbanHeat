import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Droplets, Sun, TreeDeciduous, Umbrella, Clock, Building2,
  Lightbulb, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import { getRecommendations } from '../services/api';

const ICON_MAP = {
  tree: TreeDeciduous,
  building: Building2,
  umbrella: Umbrella,
  sun: Sun,
  water: Droplets,
  clock: Clock,
};

const RecommendationsPage = ({ currentLocation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [riskScore, setRiskScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lat = currentLocation?.latitude ?? currentLocation?.lat;
  const lon = currentLocation?.longitude ?? currentLocation?.lon;
  const areaName = currentLocation?.area || currentLocation?.name || 'Your Selected Urban Zone';

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRecommendations(lat, lon, areaName)
      .then((data) => {
        if (cancelled) return;
        setRecommendations(data.recommendations || []);
        setRiskScore(data.heat_risk_score);
        setRiskLevel(data.risk_level);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load live recommendations for this location. Please try again shortly.');
        setRecommendations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lat, lon, areaName]);

  return (
    <div className="page-container recommendations-page">
      <div className="page-header">
        <h1 className="page-title">Practical Heat Mitigation & Recommendations</h1>
        <p className="page-subtitle">Actionable solutions ranked by the real environmental risk factors at your selected location</p>
      </div>

      {/* Personalized Recommendation Banner for Selected Area */}
      <div className="personalized-banner-card">
        <div className="banner-icon-circle">
          <Lightbulb size={24} className="text-emerald" />
        </div>
        <div className="banner-text">
          <h3>Recommended for {areaName}</h3>
          <p>
            {riskLevel
              ? `Predicted heat risk here is ${riskScore}/100 (${riskLevel}). See prioritized actions below.`
              : 'Select a location on the map or via search to see recommendations tailored to its real heat-risk factors.'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="rec-status-row">
          <Loader2 size={18} className="animate-spin text-emerald" />
          <span>Computing recommendations for this location...</span>
        </div>
      )}

      {!loading && error && (
        <div className="rec-status-row">
          <AlertCircle size={18} className="text-red" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && !Number.isFinite(lat) && (
        <div className="rec-status-row">
          <AlertCircle size={18} />
          <span>No location selected yet. Choose a campus location from the map or search to get personalized recommendations.</span>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {recommendations.length > 0 && (
        <div className="recommendations-grid">
          {recommendations.map((rec, idx) => {
            const Icon = ICON_MAP[rec.icon] || ShieldCheck;

            return (
              <div key={`${rec.title}-${idx}`} className="recommendation-card">
                <div className="rec-card-top">
                  <div className="rec-icon-box">
                    <Icon size={20} className="text-emerald" />
                  </div>
                  <span className={`impact-badge ${rec.priority}`}>
                    <CheckCircle2 size={12} /> Priority: {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                  </span>
                </div>

                <h4 className="rec-title">{rec.title}</h4>
                <p className="rec-desc">{rec.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
