import { useState, useEffect } from "react";
import "./AIDiagnostic.css";

const API_BASE = "http://127.0.0.1:8000/api";

const SEVERITY_COLOR = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#7c3aed",
};

export default function AIDiagnostic({ token = null, onClose = null, inModal = false }) {
  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);

  const [form, setForm] = useState({
    vehicle_type: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    mileage: "",
    fuel_type: "",
    transmission: "",
    engine_size_cc: "",
    severity_level: "medium",
    symptoms: "",
    probable_cause: "",
  });

  const [predictions, setPredictions] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);
  const [predictErrorDetails, setPredictErrorDetails] = useState([]);

  const buildHeaders = () => {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch(`${API_BASE}/ai/options`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to load AI options");
        const data = await res.json();
        setOptions(data);
      } catch (err) {
        setOptionsError(err.message);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPredicting(true);
    setPredictError(null);
    setPredictErrorDetails([]);
    setPredictions(null);

    const payload = {
      ...form,
      year: parseInt(form.year),
      mileage: parseInt(form.mileage),
      engine_size_cc: parseInt(form.engine_size_cc),
      symptoms: form.symptoms.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/ai/predict`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPredictError(data.error || "Prediction failed");
        setPredictErrorDetails(data.details || []);
        return;
      }

      setPredictions(data.predictions);
    } catch (err) {
      setPredictError("Could not reach the AI service. Make sure Flask is running on port 5000.");
      setPredictErrorDetails([]);
    } finally {
      setPredicting(false);
    }
  };

  const reset = () => {
    setPredictions(null);
    setPredictError(null);
    setPredictErrorDetails([]);
    setForm((prev) => ({ ...prev, symptoms: "", probable_cause: "" }));
  };

  if (loadingOptions) {
    return (
      <div className={inModal ? "ai-overlay" : "ai-inline-wrapper"}>
        <div className="ai-modal ai-modal--loading">
          <div className="ai-spinner" />
          <p>Loading AI Diagnostic…</p>
        </div>
      </div>
    );
  }

  if (optionsError) {
    return (
      <div className={inModal ? "ai-overlay" : "ai-inline-wrapper"}>
        <div className="ai-modal ai-modal--error">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> AI Service Unavailable</h2>
          <p>{optionsError}</p>
          <p className="ai-hint">Make sure the Flask server is running on port 5000.</p>
          {onClose && (
            <button className="ai-btn ai-btn--secondary" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    );
  }

  const vehicleTypeList  = options?.vehicle_type    || [];
  const makeList         = options?.make            || [];
  const fuelTypeList     = options?.fuel_type       || [];
  const transmissionList = options?.transmission    || [];
  const causeList        = options?.probable_causes || [];

  if (predictions) {
    return (
      <div className={inModal ? "ai-overlay" : "ai-inline-wrapper"}>
        <div className="ai-modal">
          {inModal && onClose && (
            <button className="ai-close" onClick={onClose}>✕</button>
          )}
          <div className="ai-results-header">
            <span className="ai-badge"><i class="fa-solid fa-robot"></i> AI Diagnosis Complete</span>
            <h2>Top Repair Predictions</h2>
          </div>

          <div className="ai-predictions">
            {predictions.map((p, i) => (
              <div key={i} className={`ai-prediction-card ai-card--rank-${i + 1}`}>
                <div className="ai-card-rank">#{i + 1}</div>
                <div className="ai-card-body">
                  <h3 className="ai-card-title">{p.repair}</h3>
                  <div className="ai-confidence-bar">
                    <div
                      className="ai-confidence-fill"
                      style={{ width: `${p.confidence_percent}%` }}
                    />
                  </div>
                  <div className="ai-card-meta">
                    <span className="ai-confidence-label">
                      {p.confidence_percent.toFixed(1)}% confidence
                    </span>
                    <span className="ai-cost-range">
                      <i class="fa-solid fa-dollar-sign"></i> {p.cost_min_mad.toLocaleString()} – {p.cost_max_mad.toLocaleString()} MAD
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ai-results-actions">
            <button className="ai-btn ai-btn--secondary" onClick={reset}>
              <i class="fa-solid fa-arrows-rotate"></i> New Diagnosis
            </button>
            {inModal && onClose && (
              <button className="ai-btn ai-btn--primary" onClick={onClose}>
                ✓ Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={inModal ? "ai-overlay" : "ai-inline-wrapper"}>
      <div className="ai-modal ai-modal--form">
        {inModal && onClose && (
          <button className="ai-close" onClick={onClose}>✕</button>
        )}


        <form onSubmit={handleSubmit} className="ai-form">

          <fieldset className="ai-fieldset">
            <legend>Vehicle Information</legend>
            <div className="ai-grid ai-grid--3">

              <div className="ai-field">
                <label>Vehicle Type</label>
                <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} required>
                  <option value="">Select…</option>
                  {vehicleTypeList.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="ai-field">
                <label>Make</label>
                <select name="make" value={form.make} onChange={handleChange} required>
                  <option value="">Select…</option>
                  {makeList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="ai-field">
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  placeholder="e.g. Corolla"
                  value={form.model}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="ai-field">
                <label>Year</label>
                <input
                  type="number"
                  name="year"
                  min="1980"
                  max={new Date().getFullYear()}
                  value={form.year}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="ai-field">
                <label>Mileage (km)</label>
                <input
                  type="number"
                  name="mileage"
                  placeholder="e.g. 95000"
                  min="0"
                  value={form.mileage}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="ai-field">
                <label>Engine Size (cc)</label>
                <input
                  type="number"
                  name="engine_size_cc"
                  placeholder="e.g. 1600"
                  min="50"
                  value={form.engine_size_cc}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="ai-field">
                <label>Fuel Type</label>
                <select name="fuel_type" value={form.fuel_type} onChange={handleChange} required>
                  <option value="">Select…</option>
                  {fuelTypeList.map((f) => (
                    <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="ai-field">
                <label>Transmission</label>
                <select name="transmission" value={form.transmission} onChange={handleChange} required>
                  <option value="">Select…</option>
                  {transmissionList.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="ai-field">
                <label>Severity Level</label>
                <select name="severity_level" value={form.severity_level} onChange={handleChange} required>
                  {["low", "medium", "high", "critical"].map((s) => (
                    <option key={s} value={s} style={{ color: SEVERITY_COLOR[s] }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </fieldset>

          <fieldset className="ai-fieldset">
            <legend>Symptoms</legend>
            <div className="ai-field">
              <label>Describe the symptoms (separate multiple with commas)</label>
              <textarea
                name="symptoms"
                className="ai-textarea"
                placeholder="e.g. engine noise, vibration when braking, oil leak…"
                value={form.symptoms}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>
          </fieldset>

          <fieldset className="ai-fieldset">
            <legend>Probable Cause <span className="ai-legend-hint">(optional)</span></legend>
            <div className="ai-field">
              <select name="probable_cause" value={form.probable_cause} onChange={handleChange}>
                <option value="">Unknown / Let AI decide</option>
                {causeList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </fieldset>

          {predictError && (
            <div className="ai-error-banner">
              <strong><i class="fa-solid fa-triangle-exclamation"></i> {predictError}</strong>
              {predictErrorDetails.length > 0 && (
                <ul className="ai-error-details">
                  {predictErrorDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="ai-form-actions">
            {inModal && onClose && (
              <button type="button" className="ai-btn ai-btn--secondary" onClick={onClose}>
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="ai-btn ai-btn--primary"
              disabled={predicting || !form.symptoms.trim()}
            >
              {predicting ? (
                <><span className="ai-btn-spinner" /> Analysing…</>
              ) : (
                <><i className="fa-brands fa-searchengin"></i> Get AI Diagnosis</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}