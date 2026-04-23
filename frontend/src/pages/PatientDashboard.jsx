import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api";

function formatDay(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/history")
      .then((res) => setRecords(res.data))
      .catch(() => setError("Unable to fetch history."));
  }, []);

  const stats = useMemo(() => {
    const low = records.filter((row) => row.risk_category === 0).length;
    const moderate = records.filter((row) => row.risk_category === 1).length;
    const high = records.filter((row) => row.risk_category === 2).length;
    const escalations = records.filter((row) => row.escalation_required).length;
    const avgProbability =
      records.length > 0
        ? records.reduce((sum, row) => sum + (Number(row.risk_probability) || 0), 0) / records.length
        : 0;
    return { low, moderate, high, total: records.length, escalations, avgProbability };
  }, [records]);

  const latestRecord = useMemo(() => {
    if (!records.length) return null;
    return [...records].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
  }, [records]);

  const chartData = [
    { name: "Low", value: stats.low, color: "#10b981" },
    { name: "Moderate", value: stats.moderate, color: "#f59e0b" },
    { name: "High", value: stats.high, color: "#ef4444" },
  ];

  const trendData = useMemo(() => {
    const map = new Map();
    records.forEach((item) => {
      if (!item.created_at) return;
      const date = new Date(item.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { date: key, predictions: 0, avgProbability: 0, totalProbability: 0 });
      }
      const row = map.get(key);
      row.predictions += 1;
      row.totalProbability += Number(item.risk_probability) || 0;
      row.avgProbability = row.totalProbability / row.predictions;
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);
  }, [records]);
  const hasTrend = trendData.length > 1;
  const lastTrendPoint = trendData.length ? trendData[trendData.length - 1] : null;

  const topFactorsData = useMemo(() => {
    const counts = new Map();
    records.forEach((row) => {
      (row.top_risk_factors || []).forEach((factor) => {
        counts.set(factor, (counts.get(factor) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [records]);

  const recentRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5),
    [records],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/40 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Patient Journey</p>
        <h2 className="text-2xl font-semibold text-slate-900">Patient Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Track your cardiovascular risk trends, results, and preventive actions.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Avg Probability: {(stats.avgProbability * 100).toFixed(1)}%
          </span>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">Escalations: {stats.escalations}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            Latest: {latestRecord ? formatDay(latestRecord.created_at) : "-"}
          </span>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Records" value={stats.total} tone="slate" />
        <SummaryCard title="Low Risk" value={stats.low} tone="green" />
        <SummaryCard title="Moderate Risk" value={stats.moderate} tone="amber" />
        <SummaryCard title="High Risk" value={stats.high} tone="red" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Risk Distribution</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50/40 p-3">
            <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">Days tracked: {trendData.length}</span>
              <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-cyan-700">
                Latest records: {lastTrendPoint ? lastTrendPoint.predictions : 0}
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">
                Latest avg prob: {lastTrendPoint ? `${(lastTrendPoint.avgProbability * 100).toFixed(1)}%` : "0.0%"}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis yAxisId="left" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    labelFormatter={formatDay}
                    formatter={(value, name) => (name === "avgProbability" ? `${(Number(value) * 100).toFixed(1)}%` : value)}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgProbability"
                    name="Avg Probability"
                    fill="#67e8f9"
                    fillOpacity={0.3}
                    stroke="#0891b2"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="predictions"
                    name="Records"
                    stroke="#0f172a"
                    strokeWidth={2.2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {!hasTrend ? (
              <p className="mt-2 text-xs text-slate-500">
                Trend line needs data from multiple dates. Keep making predictions to see clear movement over time.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Top Risk Drivers</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFactorsData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fill: "#475569", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Recent Records</h3>
          <div className="space-y-2">
            {recentRecords.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{formatDay(row.created_at)}</p>
                <p className="text-sm font-semibold text-slate-900">
                  Risk {row.risk_category === 2 ? "High" : row.risk_category === 1 ? "Moderate" : "Low"} | {(Number(row.risk_probability) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-600">{(row.top_risk_factors || []).slice(0, 2).join(", ") || "No factor data"}</p>
              </div>
            ))}
            {recentRecords.length === 0 ? <p className="text-sm text-slate-500">No history yet.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone }) {
  const tones = {
    slate: "from-slate-700 to-slate-800",
    green: "from-emerald-500 to-green-600",
    amber: "from-amber-500 to-orange-500",
    red: "from-rose-500 to-red-600",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${tones[tone]} p-5 text-white shadow`}>
      <p className="text-sm opacity-90">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default PatientDashboard;
