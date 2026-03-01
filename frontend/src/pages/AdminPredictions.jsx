import { useEffect, useState } from "react";

import api from "../api";

function AdminPredictions() {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    api.get("/admin/predictions").then((res) => setPredictions(res.data));
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">System Predictions</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3">Date</th>
              <th className="py-3">User ID</th>
              <th className="py-3">Probability</th>
              <th className="py-3">Category</th>
              <th className="py-3">Escalation</th>
              <th className="py-3">Top Factors</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3">{new Date(row.created_at).toLocaleString()}</td>
                <td className="py-3">{row.user_id ?? "-"}</td>
                <td className="py-3">{(row.risk_probability * 100).toFixed(2)}%</td>
                <td className="py-3">{row.risk_category === 0 ? "Low" : row.risk_category === 1 ? "Moderate" : "High"}</td>
                <td className="py-3">{row.escalation_required ? "Yes" : "No"}</td>
                <td className="py-3">{(row.top_risk_factors || []).join(", ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPredictions;
