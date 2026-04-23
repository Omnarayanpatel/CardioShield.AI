import { useEffect, useState } from "react";

import api, { downloadFromApi, getAuth } from "../api";

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

function History() {
  const role = getAuth()?.user?.role;
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const [mainFilter, setMainFilter] = useState("");

  const fetchHistory = async (q = mainFilter) => {
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      const res = await api.get("/history", { params });
      setRecords(res.data);
      setError("");
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 401) {
        setError("Session expired or unauthorized. Please login again.");
        return;
      }
      if (status === 500) {
        setError(`Internal server error: ${detail || "Check backend logs."}`);
        return;
      }
      setError(detail || "Unable to load history.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(mainFilter);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainFilter]);

  const downloadWithMainFilter = () => {
    const query = new URLSearchParams({ format: downloadFormat });
    if (mainFilter.trim()) query.set("q", mainFilter.trim());
    downloadFromApi(`/history/export?${query.toString()}`, `history.${downloadFormat}`);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {role === "doctor" ? "Patient History" : role === "admin" ? "System History" : "Prediction History"}
          </h2>
          <p className="text-sm text-slate-500">
            {role === "doctor"
              ? "All accessible cardiovascular risk assessments."
              : role === "admin"
                ? "System-wide cardiovascular risk assessments."
                : "Your past cardiovascular risk assessments."}
          </p>
        </div>
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
            placeholder={
              role === "patient"
                ? "Main Search: risk, probability, BP, factors, recommendation..."
                : "Main Search: email, risk, probability, BP, factors, recommendation..."
            }
          />
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3">Date</th>
              {role === "doctor" || role === "admin" ? <th className="py-3">Patient Email</th> : null}
              <th className="py-3">Risk</th>
              <th className="py-3">Probability</th>
              <th className="py-3">BP</th>
              <th className="py-3">Top Factors</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3">{formatDate(row.created_at)}</td>
                {role === "doctor" || role === "admin" ? <td className="py-3">{row.user_email || "-"}</td> : null}
                <td className="py-3">{categoryLabel(row.risk_category)}</td>
                <td className="py-3">{formatProbability(row.risk_probability)}</td>
                <td className="py-3">
                  {row.ap_hi}/{row.ap_lo}
                </td>
                <td className="py-3">{(row.top_risk_factors || []).join(", ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!error && records.length === 0 ? <p className="mt-5 text-sm text-slate-500">No predictions found.</p> : null}
    </div>
  );
}

export default History;
