import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  HeartPulse,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  AlertCircle,
  Shuffle,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { FEATURE_METADATA } from './model';
import { PRESETS } from './presets';
import { predictRisk, checkApiHealth } from './api';

export default function App() {
  // Default feature state
  const defaultValues = useMemo(() => {
    const init = {};
    Object.keys(FEATURE_METADATA).forEach((key) => {
      init[key] = FEATURE_METADATA[key].default;
    });
    return init;
  }, []);

  const [inputs, setInputs] = useState(defaultValues);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ checked: false, online: false, url: '' });
  const [activePresetId, setActivePresetId] = useState(null);

  // Check backend health on initial load
  useEffect(() => {
    async function verifyBackend() {
      const status = await checkApiHealth();
      setApiStatus({ checked: true, online: status.online, url: status.url });
    }
    verifyBackend();
  }, []);

  // Compute prediction whenever inputs change
  useEffect(() => {
    let isCancelled = false;
    async function runPrediction() {
      setLoading(true);
      try {
        const res = await predictRisk(inputs);
        if (!isCancelled) {
          setResult(res);
        }
      } catch (err) {
        console.error('Prediction error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    runPrediction();

    return () => {
      isCancelled = true;
    };
  }, [inputs]);

  // Handle individual input changes
  const handleInputChange = (feature, value) => {
    setActivePresetId(null);
    const num = parseFloat(value);
    setInputs((prev) => ({
      ...prev,
      [feature]: isNaN(num) ? 0 : num
    }));
  };

  // Load a preset
  const handleLoadPreset = (preset) => {
    setActivePresetId(preset.id);
    setInputs({ ...preset.values });
  };

  // Reset to default
  const handleReset = () => {
    setActivePresetId(null);
    setInputs(defaultValues);
  };

  // Random sample generator
  const handleRandomSample = () => {
    setActivePresetId('random');
    const randomPreset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    const randomized = {};
    Object.keys(randomPreset.values).forEach((key) => {
      const val = randomPreset.values[key];
      const delta = (Math.random() - 0.5) * (val * 0.2);
      const meta = FEATURE_METADATA[key];
      const newVal = Math.max(meta.min, Math.min(meta.max, Math.round((val + delta) * 10) / 10));
      randomized[key] = meta.step === 1 ? Math.round(newVal) : newVal;
    });
    setInputs(randomized);
  };

  // Circular gauge math
  const gaugePercent = result ? result.percentage : 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gaugePercent / 100) * circumference;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-section">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <HeartPulse size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="brand-title">Diabetes Risk Assessment</h1>
            <p className="brand-subtitle">
              Interactive Diagnostic Predictor & Clinical Decision Support
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="status-badge-group">
          {apiStatus.online ? (
            <div className="status-badge live" title={`Connected to FastAPI backend at ${apiStatus.url}`}>
              <span className="dot-indicator"></span>
              FastAPI Live ({apiStatus.url})
            </div>
          ) : (
            <div
              className="status-badge local"
              title="FastAPI server offline. Running built-in scikit-learn model engine in browser."
            >
              <span className="dot-indicator"></span>
              Client-Side ML Engine (Offline Ready)
            </div>
          )}

          <button
            className="status-badge"
            style={{ background: 'rgba(255,255,255,0.06)', cursor: 'pointer', color: '#cbd5e1' }}
            onClick={async () => {
              const s = await checkApiHealth();
              setApiStatus({ checked: true, online: s.online, url: s.url });
            }}
            title="Check API status again"
          >
            <RefreshCw size={12} />
            Ping API
          </button>
        </div>
      </header>

      {/* Redesigned Quick Clinical Presets Section */}
      <section className="presets-container">
        <div className="presets-header-bar">
          <div className="presets-heading">
            <Sparkles size={16} color="#38bdf8" />
            Quick Clinical Presets (1-Click Test)
          </div>
        </div>

        <div className="presets-cards-grid">
          {/* Preset 1: Low Risk */}
          <button
            className={`preset-card-btn ${activePresetId === 'low_risk' ? 'active-low' : ''}`}
            onClick={() => handleLoadPreset(PRESETS[0])}
          >
            <div className="preset-card-top">
              <div className="preset-title-wrap">
                <div className="preset-icon-badge icon-low">
                  <ShieldCheck size={18} />
                </div>
                <span className="preset-card-title">{PRESETS[0].name}</span>
              </div>
              <span className="preset-tag tag-low">{PRESETS[0].category}</span>
            </div>
            <p className="preset-desc">{PRESETS[0].description}</p>
          </button>

          {/* Preset 2: Moderate Risk */}
          <button
            className={`preset-card-btn ${activePresetId === 'moderate_risk' ? 'active-moderate' : ''}`}
            onClick={() => handleLoadPreset(PRESETS[1])}
          >
            <div className="preset-card-top">
              <div className="preset-title-wrap">
                <div className="preset-icon-badge icon-moderate">
                  <AlertCircle size={18} />
                </div>
                <span className="preset-card-title">{PRESETS[1].name}</span>
              </div>
              <span className="preset-tag tag-moderate">{PRESETS[1].category}</span>
            </div>
            <p className="preset-desc">{PRESETS[1].description}</p>
          </button>

          {/* Preset 3: High Risk */}
          <button
            className={`preset-card-btn ${activePresetId === 'high_risk' ? 'active-high' : ''}`}
            onClick={() => handleLoadPreset(PRESETS[2])}
          >
            <div className="preset-card-top">
              <div className="preset-title-wrap">
                <div className="preset-icon-badge icon-high">
                  <AlertTriangle size={18} />
                </div>
                <span className="preset-card-title">{PRESETS[2].name}</span>
              </div>
              <span className="preset-tag tag-high">{PRESETS[2].category}</span>
            </div>
            <p className="preset-desc">{PRESETS[2].description}</p>
          </button>

          {/* Random Profile Card */}
          <button
            className={`preset-card-btn ${activePresetId === 'random' ? 'active-random' : ''}`}
            onClick={handleRandomSample}
          >
            <div className="preset-card-top">
              <div className="preset-title-wrap">
                <div className="preset-icon-badge icon-random">
                  <Shuffle size={18} />
                </div>
                <span className="preset-card-title">Random Profile</span>
              </div>
              <span className="preset-tag tag-random">Shuffle</span>
            </div>
            <p className="preset-desc">Generate random clinical parameters within physiological limits</p>
          </button>
        </div>
      </section>

      {/* Main Assessment Grid */}
      <div className="dashboard-grid">
        {/* Input Form Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">
              <SlidersHorizontal size={20} color="#38bdf8" />
              Patient Clinical Measurements
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              8 Diagnostic Markers
            </span>
          </div>

          <div className="inputs-grid">
            {Object.keys(FEATURE_METADATA).map((featureKey) => {
              const meta = FEATURE_METADATA[featureKey];
              const val = inputs[featureKey] !== undefined ? inputs[featureKey] : meta.default;

              return (
                <div key={featureKey} className="feature-field">
                  <div className="feature-label-row">
                    <label className="feature-label" title={meta.clinicalNote}>
                      {meta.label}
                    </label>
                    <span className="feature-ref" title="Normal reference range">
                      Ref: {meta.normalRange}
                    </span>
                  </div>

                  <div className="feature-input-row">
                    <input
                      type="range"
                      className="range-slider"
                      min={meta.min}
                      max={meta.max}
                      step={meta.step}
                      value={val}
                      onChange={(e) => handleInputChange(featureKey, e.target.value)}
                    />
                    <input
                      type="number"
                      className="feature-number-input"
                      min={meta.min}
                      max={meta.max}
                      step={meta.step}
                      value={val}
                      onChange={(e) => handleInputChange(featureKey, e.target.value)}
                    />
                    <span className="feature-unit">{meta.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="actions-row">
            <button className="btn-secondary" onClick={handleReset}>
              Reset Defaults
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                setLoading(true);
                const res = await predictRisk(inputs);
                setResult(res);
                setLoading(false);
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Recalculate Assessment
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">
              <Activity size={20} color="#10b981" />
              Risk Classification Result
            </h2>
            {result && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {result.source === 'fastapi-live' ? 'FastAPI API' : 'Scikit-Learn (Local)'}
              </span>
            )}
          </div>

          {result && (
            <div className="result-gauge-card">
              {/* Circular Gauge */}
              <div className="risk-circle-wrapper">
                <svg className="risk-circle-svg" viewBox="0 0 160 160">
                  <circle className="circle-bg" cx="80" cy="80" r={radius} />
                  <circle
                    className={`circle-progress ${result.riskLevel}`}
                    cx="80"
                    cy="80"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="circle-content">
                  <div className="risk-percent">{result.percentage}%</div>
                  <div className="risk-percent-label">Risk Probability</div>
                </div>
              </div>

              {/* Prediction Pill */}
              <div className={`prediction-pill ${result.riskLevel}`}>
                {result.prediction === 'Diabetic' ? (
                  <AlertOctagon size={20} />
                ) : result.riskLevel === 'moderate' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                Outcome: {result.prediction} ({result.riskCategory})
              </div>

              {/* Clinical Commentary */}
              <p className="clinical-summary-text">
                {result.riskLevel === 'high' &&
                  'The patient exhibits multiple high-impact diabetic markers (notably plasma glucose and BMI). Comprehensive diagnostic follow-up and HbA1c testing is strongly indicated.'}
                {result.riskLevel === 'moderate' &&
                  'Elevated risk score detected. One or more clinical markers exceed normal fasting ranges. Lifestyle modification and metabolic monitoring recommended.'}
                {result.riskLevel === 'low' &&
                  'Diagnostic parameters fall primarily within normal clinical ranges. Low immediate probability of diabetes based on standard Pima cohort features.'}
              </p>

              {/* Feature Breakdown / Explainability */}
              <div className="factors-section">
                <div className="factors-title">Top Diagnostic Drivers (Model Explainability)</div>
                {result.contributions.slice(0, 5).map((item) => {
                  const isPositive = item.contribution >= 0;
                  const maxImpact = 2.0;
                  const barWidth = Math.min(100, Math.round((Math.abs(item.contribution) / maxImpact) * 100));

                  return (
                    <div key={item.feature} className="factor-item">
                      <span className="factor-name">
                        {isPositive ? (
                          <ArrowUpRight size={14} color="#f87171" />
                        ) : (
                          <ArrowDownRight size={14} color="#34d399" />
                        )}
                        {item.label} ({item.rawVal} {item.unit})
                      </span>

                      <div className="factor-bar-wrapper">
                        <div
                          className={`factor-bar ${isPositive ? 'risk-up' : 'risk-down'}`}
                          style={{ width: `${Math.max(8, barWidth)}%` }}
                        ></div>
                      </div>

                      <span className={`factor-impact ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}
                        {item.contribution.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        Diabetes Risk Assessment Application • Full-Stack ML Project
      </footer>
    </div>
  );
}
