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

function categoryBadgeClass(code) {
  if (code === 2) return "bg-rose-100 text-rose-700";
  if (code === 1) return "bg-amber-100 text-amber-700";
  if (code === 0) return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
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

  const highRiskCount = predictions.filter((row) => row.risk_category === 2).length;
  const moderateRiskCount = predictions.filter((row) => row.risk_category === 1).length;
  const lowRiskCount = predictions.filter((row) => row.risk_category === 0).length;
  const escalationCount = predictions.filter((row) => row.escalation_required).length;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">System Predictions</h2>
            <p className="text-sm text-slate-600">Live cardiovascular risk monitoring dashboard.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input max-w-[110px] bg-white/90 py-2"
              value={downloadFormat}
              onChange={(event) => setDownloadFormat(event.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="txt">TXT</option>
            </select>
            <button
              type="button"
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
              onClick={downloadWithMainFilter}
            >
              Download
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">Total {predictions.length}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Low {lowRiskCount}</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Moderate {moderateRiskCount}</span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">High {highRiskCount}</span>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">Escalations {escalationCount}</span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <input
            className="input border-slate-300 bg-white"
            name="mainFilter"
            value={mainFilter}
            onChange={(event) => setMainFilter(event.target.value)}
            placeholder="Search user id/email, risk category, probability, BP, escalation, factors..."
          />
        </div>
        {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-100/80">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">User ID</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Probability</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Escalation</th>
                <th className="px-3 py-2.5">Top Factors</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-middle hover:bg-cyan-50/40">
                  <td className="px-3 py-2.5 text-slate-700">{formatDate(row.created_at)}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.user_id ?? "-"}</td>
                  <td className="px-3 py-2.5 text-slate-700">{row.user_email ?? "-"}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{formatProbability(row.risk_probability)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(row.risk_category)}`}>
                      {categoryLabel(row.risk_category)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.escalation_required ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {row.escalation_required ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{(row.top_risk_factors || []).join(", ") || "-"}</td>
                </tr>
              ))}
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No predictions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminPredictions;
