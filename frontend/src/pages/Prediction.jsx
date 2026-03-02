import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

function riskTone(category) {
  const key = String(category || "").toLowerCase();
  if (key === "high") {
    return {
      badge: "bg-rose-100 text-rose-700 border border-rose-200",
      bar: "from-rose-500 via-rose-500 to-pink-600",
      ring: "ring-rose-200",
      modal: "from-rose-50/80 via-white to-pink-50/70",
    };
  }
  if (key === "moderate") {
    return {
      badge: "bg-amber-100 text-amber-700 border border-amber-200",
      bar: "from-amber-500 via-orange-500 to-amber-600",
      ring: "ring-amber-200",
      modal: "from-amber-50/80 via-white to-orange-50/70",
    };
  }
  return {
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bar: "from-emerald-500 via-teal-500 to-cyan-600",
    ring: "ring-emerald-200",
    modal: "from-emerald-50/80 via-white to-cyan-50/70",
  };
}

function Prediction() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
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
      setShowResultModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const probabilityPercent = result ? Math.max(0, Math.min(100, Number(result.risk_probability) * 100)) : 0;
  const tone = riskTone(result?.risk_category);

  return (
    <div className="panel relative overflow-hidden">
      <div className="ecg-bg" aria-hidden="true">
        <svg viewBox="0 0 1200 120" className="ecg-line">
          <polyline
            fill="none"
            strokeWidth="2.2"
            points="0,80 90,80 120,80 145,35 170,100 195,70 250,80 390,80 420,80 445,35 470,100 495,70 550,80 690,80 720,80 745,35 770,100 795,70 850,80 990,80 1020,80 1045,35 1070,100 1095,70 1200,80"
          />
        </svg>
      </div>

      <div className="mb-6 border-b border-slate-200 pb-4 relative z-10">
        <h2 className="text-2xl font-semibold text-slate-900 mb-1">New Risk Prediction</h2>
        <p className="text-sm text-slate-500">Enter low-cost clinical inputs for 5-10 year risk estimation.</p>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 relative z-10">
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
        <div className={`mt-6 rounded-2xl border border-slate-200 bg-white/95 p-5 ring-2 ${tone.ring} relative z-10`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Latest result ready</p>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setShowResultModal(true)}
            >
              Open Result Popup
            </button>
          </div>
        </div>
      ) : null}

      {result && showResultModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className={`prediction-modal w-full max-w-5xl rounded-2xl border border-slate-200 bg-gradient-to-br ${tone.modal} p-5 shadow-xl ring-2 ${tone.ring}`}>
            <div className="prediction-modal-ecg" aria-hidden="true">
              <svg viewBox="0 0 1200 120" className="prediction-modal-ecg-line">
                <polyline
                  fill="none"
                  strokeWidth="2.2"
                  points="0,78 100,78 130,78 160,36 190,96 220,68 260,78 420,78 450,78 480,36 510,96 540,68 580,78 740,78 770,78 800,36 830,96 860,68 900,78 1060,78 1090,78 1120,36 1150,96 1180,68 1200,78"
                />
              </svg>
            </div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Prediction Result</h3>
                <p className="text-sm text-slate-500">5-10 year cardiovascular risk stratification output.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>{result.risk_category} Risk</span>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowResultModal(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Risk Probability</span>
                <span className="font-semibold text-slate-900">{probabilityPercent.toFixed(2)}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className={`h-3 rounded-full bg-gradient-to-r ${tone.bar}`} style={{ width: `${probabilityPercent}%` }} />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {(result.confidence_interval.low * 100).toFixed(1)}% - {(result.confidence_interval.high * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Escalation</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{result.escalation_required ? "Required" : "Not required"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cardio Flag</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{result.cardio_flag === 1 ? "Positive" : "Negative"}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-700">
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
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setShowResultModal(false);
                  navigate("/patient/care-plan");
                }}
              >
                View Care Plan
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

export default Prediction;
