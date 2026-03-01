import { useEffect, useState } from "react";

import api from "../api";

function History() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/history")
      .then((res) => setRecords(res.data))
      .catch((err) => {
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
      });
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-semibold text-slate-900">Prediction History</h2>
      <p className="text-sm text-slate-500 mb-5">Your past cardiovascular risk assessments.</p>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3">Date</th>
              <th className="py-3">Risk</th>
              <th className="py-3">Probability</th>
              <th className="py-3">BP</th>
              <th className="py-3">Top Factors</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3">{new Date(row.created_at).toLocaleString()}</td>
                <td className="py-3">{row.risk_category === 0 ? "Low" : row.risk_category === 1 ? "Moderate" : "High"}</td>
                <td className="py-3">{(row.risk_probability * 100).toFixed(2)}%</td>
                <td className="py-3">
                  {row.ap_hi}/{row.ap_lo}
                </td>
                <td className="py-3">{(row.top_risk_factors || []).join(", ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!error && records.length === 0 ? <p className="mt-5 text-sm text-slate-500">No predictions yet.</p> : null}
    </div>
  );
}

export default History;
