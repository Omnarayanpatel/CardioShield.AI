import { useState } from "react";

import api, { downloadFromApi } from "../api";

const initialForm = {
  dob: "",
  gender: "",
  height: "",
  weight: "",
  ap_hi: "",
  ap_lo: "",
  cholesterol: "",
  gluc: "",
  smoke: "",
  alco: "",
  active: "",
};

function Prediction() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("csv");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const dobDate = new Date(form.dob);
      if (Number.isNaN(dobDate.getTime())) {
        setError("Please select a valid date of birth.");
        setLoading(false);
        return;
      }

      const now = new Date();
      const ageMs = now.getTime() - dobDate.getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      if (ageDays < 0 || ageDays > 130 * 365) {
        setError("Please enter a valid date of birth.");
        setLoading(false);
        return;
      }

      const payload = {
        age: ageDays,
        gender: Number(form.gender),
        height: Number(form.height),
        weight: Number(form.weight),
        ap_hi: Number(form.ap_hi),
        ap_lo: Number(form.ap_lo),
        cholesterol: Number(form.cholesterol),
        gluc: Number(form.gluc),
        smoke: Number(form.smoke),
        alco: Number(form.alco),
        active: Number(form.active),
      };
      const { data } = await api.post("/predict", payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-semibold text-slate-900 mb-1">New Risk Prediction</h2>
        <p className="text-sm text-slate-500">Enter low-cost clinical inputs for 5-10 year risk estimation.</p>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <input
          className="input"
          name="dob"
          type="date"
          value={form.dob}
          onChange={handleChange}
          required
        />
        <select className="input" name="gender" onChange={handleChange} required>
          <option value="">Gender</option>
          <option value="1">Female</option>
          <option value="2">Male</option>
        </select>
        <input className="input" name="height" placeholder="Height (cm)" onChange={handleChange} required />
        <input className="input" name="weight" placeholder="Weight (kg)" onChange={handleChange} required />
        <input className="input" name="ap_hi" placeholder="Systolic BP" onChange={handleChange} required />
        <input className="input" name="ap_lo" placeholder="Diastolic BP" onChange={handleChange} required />
        <select className="input" name="cholesterol" onChange={handleChange} required>
          <option value="">Cholesterol</option>
          <option value="1">Normal</option>
          <option value="2">Above normal</option>
          <option value="3">Well above normal</option>
        </select>
        <select className="input" name="gluc" onChange={handleChange} required>
          <option value="">Glucose</option>
          <option value="1">Normal</option>
          <option value="2">Above normal</option>
          <option value="3">Well above normal</option>
        </select>
        <select className="input" name="smoke" onChange={handleChange} required>
          <option value="">Smoking</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
        <select className="input" name="alco" onChange={handleChange} required>
          <option value="">Alcohol intake</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
        <select className="input" name="active" onChange={handleChange} required>
          <option value="">Physically active</option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Running..." : "Predict"}
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Prediction Result</h3>
          <p className="mt-2 text-sm text-slate-700">
            Risk: <span className="font-semibold">{result.risk_category}</span> (
            {(result.risk_probability * 100).toFixed(2)}%)
          </p>
          <p className="text-sm text-slate-700">
            Confidence interval: {(result.confidence_interval.low * 100).toFixed(1)}% -{" "}
            {(result.confidence_interval.high * 100).toFixed(1)}%
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Top factors: <span className="font-medium">{result.top_risk_factors.join(", ") || "None"}</span>
          </p>
          <p className="mt-2 text-sm text-slate-700">{result.explanation_text}</p>
          <p className="mt-2 text-sm text-slate-700">{result.recommendation}</p>
          <p className="mt-2 text-xs text-slate-500">{result.disclaimer}</p>
          <div className="mt-4 flex items-center gap-3">
            <select
              className="input max-w-[130px]"
              value={downloadFormat}
              onChange={(event) => setDownloadFormat(event.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="txt">TXT</option>
            </select>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                downloadFromApi(
                  `/predictions/${result.prediction_id}/export?format=${downloadFormat}`,
                  `prediction_report.${downloadFormat}`
                )
              }
            >
              Download Report
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Prediction;
