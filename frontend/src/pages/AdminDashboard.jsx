import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api";

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function formatDayLabel(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

function AdminDashboard() {
  const navigate = useNavigate();
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
    const lowRisk = predictions.filter((item) => item.risk_category === 0).length;
    const moderateRisk = predictions.filter((item) => item.risk_category === 1).length;
    const highRisk = predictions.filter((item) => item.risk_category === 2).length;
    const escalations = predictions.filter((item) => item.escalation_required).length;
    return {
      activeUsers,
      totalUsers: users.length,
      totalPredictions: predictions.length,
      lowRisk,
      moderateRisk,
      highRisk,
      escalations,
    };
  }, [users, predictions]);

  const recentHighRisk = useMemo(
    () =>
      predictions
        .filter((item) => item.risk_category === 2)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 6),
    [predictions],
  );

  const totalForRiskBar = Math.max(summary.totalPredictions, 1);

  const trendData = useMemo(() => {
    const map = new Map();
    predictions.forEach((item) => {
      if (!item.created_at) return;
      const day = new Date(item.created_at);
      if (Number.isNaN(day.getTime())) return;
      const key = day.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { date: key, total: 0, high: 0, escalations: 0 });
      }
      const row = map.get(key);
      row.total += 1;
      if (item.risk_category === 2) row.high += 1;
      if (item.escalation_required) row.escalations += 1;
    });
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);
  }, [predictions]);

  const categoryChartData = useMemo(
    () => [
      { name: "Low", value: summary.lowRisk, fill: "#10b981" },
      { name: "Moderate", value: summary.moderateRisk, fill: "#f59e0b" },
      { name: "High", value: summary.highRisk, fill: "#e11d48" },
    ],
    [summary.highRisk, summary.lowRisk, summary.moderateRisk],
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-800/10 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">CardioShield AI</p>
            <h2 className="mt-1 text-3xl font-semibold text-white">Admin Dashboard</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">Governance, account control, fairness monitoring, and system-wide oversight.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/predictions")}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Open Predictions
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Manage Users
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Users" value={summary.totalUsers} tone="info" />
        <KpiCard title="Active Users" value={summary.activeUsers} tone="success" />
        <KpiCard title="Total Predictions" value={summary.totalPredictions} tone="primary" />
        <KpiCard title="High Risk Cases" value={summary.highRisk} tone="alert" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">Risk Distribution</h3>
          <p className="mt-1 text-sm text-slate-500">Current prediction mix by risk category.</p>
          <div className="mt-4 space-y-3">
            <RiskRow label="Low" value={summary.lowRisk} total={totalForRiskBar} color="bg-emerald-500" />
            <RiskRow label="Moderate" value={summary.moderateRisk} total={totalForRiskBar} color="bg-amber-500" />
            <RiskRow label="High" value={summary.highRisk} total={totalForRiskBar} color="bg-rose-500" />
            <RiskRow label="Escalations" value={summary.escalations} total={totalForRiskBar} color="bg-cyan-600" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Quick Notes</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>High risk cases should be reviewed first.</li>
            <li>Escalation queue indicates specialist follow-up needs.</li>
            <li>Use Fairness page before final model demo.</li>
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="chart-card relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="chart-card-ecg" aria-hidden="true">
            <svg viewBox="0 0 1200 120" className="chart-card-ecg-line">
              <polyline
                fill="none"
                strokeWidth="2"
                points="0,80 85,80 120,80 145,38 170,100 195,68 240,80 380,80 415,80 440,38 465,100 490,68 535,80 675,80 710,80 735,38 760,100 785,68 830,80 970,80 1005,80 1030,38 1055,100 1080,68 1125,80 1200,80"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900">Prediction Trend (Last 10 Days)</h3>
          <p className="mt-1 text-sm text-slate-500">Line chart for total, high-risk, and escalated predictions.</p>
          <div className="mt-4 h-72 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatDayLabel} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip labelFormatter={formatDayLabel} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#334155" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="high" name="High Risk" stroke="#e11d48" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="escalations" name="Escalations" stroke="#0e7490" strokeWidth={2.2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Risk Mix</h3>
          <p className="mt-1 text-sm text-slate-500">Bar chart by category.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Recent High-Risk Queue</h3>
          <button
            type="button"
            onClick={() => navigate("/admin/predictions")}
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
          >
            View all
          </button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Probability</th>
                <th className="px-3 py-2.5">Escalation</th>
              </tr>
            </thead>
            <tbody>
              {recentHighRisk.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5">{formatDate(row.created_at)}</td>
                  <td className="px-3 py-2.5">{row.user_email || "-"}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">
                    {Number.isFinite(Number(row.risk_probability)) ? `${(Number(row.risk_probability) * 100).toFixed(2)}%` : "-"}
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
                </tr>
              ))}
              {recentHighRisk.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    No high-risk records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RiskRow({ label, value, total, color }) {
  const percent = Math.max(0, Math.min(100, (value / total) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function KpiCard({ title, value, tone = "normal" }) {
  const toneStyles = {
    normal: "bg-white border border-slate-200 text-slate-900",
    primary: "bg-sky-50 border border-sky-100 text-slate-900",
    info: "bg-cyan-50 border border-cyan-100 text-slate-900",
    success: "bg-emerald-50 border border-emerald-100 text-slate-900",
    alert: "bg-rose-50 border border-rose-100 text-rose-700",
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm ${toneStyles[tone] || toneStyles.normal}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${tone === "alert" ? "text-rose-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

export default AdminDashboard;
