import { useEffect, useState } from "react";

import api, { downloadFromApi } from "../api";

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function formatProbability(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
}

function categoryLabel(code) {
  if (code === 0) return "Low";
  if (code === 1) return "Moderate";
  if (code === 2) return "High";
  return "-";
}

function AdminPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState("");
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const [mainFilter, setMainFilter] = useState("");

  const fetchPredictions = async (q = mainFilter) => {
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      const res = await api.get("/admin/predictions", { params });
      setPredictions(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load predictions.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPredictions(mainFilter);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainFilter]);

  const downloadWithMainFilter = () => {
    const query = new URLSearchParams({ format: downloadFormat });
    if (mainFilter.trim()) query.set("q", mainFilter.trim());
    downloadFromApi(`/admin/predictions/export?${query.toString()}`, `admin_predictions.${downloadFormat}`);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">System Predictions</h2>
        <div className="flex items-center gap-2">
          <select className="input max-w-[120px]" value={downloadFormat} onChange={(event) => setDownloadFormat(event.target.value)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="txt">TXT</option>
          </select>
          <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700" onClick={downloadWithMainFilter}>
            Download
          </button>
        </div>
      </div>

      <div className="mb-5">
        <input
          className="input"
          name="mainFilter"
          value={mainFilter}
          onChange={(event) => setMainFilter(event.target.value)}
          placeholder="Main Search: user id/email, risk, probability, BP, escalation, factors..."
        />
      </div>
      {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3">Date</th>
              <th className="py-3">User ID</th>
              <th className="py-3">Email</th>
              <th className="py-3">Probability</th>
              <th className="py-3">Category</th>
              <th className="py-3">Escalation</th>
              <th className="py-3">Top Factors</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3">{formatDate(row.created_at)}</td>
                <td className="py-3">{row.user_id ?? "-"}</td>
                <td className="py-3">{row.user_email ?? "-"}</td>
                <td className="py-3">{formatProbability(row.risk_probability)}</td>
                <td className="py-3">{categoryLabel(row.risk_category)}</td>
                <td className="py-3">{row.escalation_required ? "Yes" : "No"}</td>
                <td className="py-3">{(row.top_risk_factors || []).join(", ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {predictions.length === 0 ? <p className="mt-4 text-sm text-slate-500">No predictions found.</p> : null}
    </div>
  );
}

export default AdminPredictions;
