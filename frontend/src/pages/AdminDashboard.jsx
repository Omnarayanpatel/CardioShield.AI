import { useEffect, useMemo, useState } from "react";

import api from "../api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/admin/users"), api.get("/admin/predictions")])
      .then(([usersRes, predictionsRes]) => {
        setUsers(usersRes.data);
        setPredictions(predictionsRes.data);
      })
      .catch(() => {});
  }, []);

  const summary = useMemo(() => {
    const activeUsers = users.filter((item) => item.is_active).length;
    const highRisk = predictions.filter((item) => item.risk_category === 2).length;
    return { activeUsers, totalUsers: users.length, totalPredictions: predictions.length, highRisk };
  }, [users, predictions]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h2>
        <p className="text-sm text-slate-500">Clinical oversight, governance, and system-wide monitoring.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Users" value={summary.totalUsers} />
        <KpiCard title="Active Users" value={summary.activeUsers} />
        <KpiCard title="Total Predictions" value={summary.totalPredictions} />
        <KpiCard title="High Risk Cases" value={summary.highRisk} tone="alert" />
      </div>
    </div>
  );
}

function KpiCard({ title, value, tone = "normal" }) {
  return (
    <div className={`rounded-2xl p-5 shadow ${tone === "alert" ? "bg-rose-50 border border-rose-100" : "bg-white"}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${tone === "alert" ? "text-rose-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

export default AdminDashboard;
