import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import api from "../api";

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
    return { low, moderate, high, total: records.length };
  }, [records]);

  const chartData = [
    { name: "Low", value: stats.low, color: "#10b981" },
    { name: "Moderate", value: stats.moderate, color: "#f59e0b" },
    { name: "High", value: stats.high, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold text-slate-900">Patient Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Track your cardiovascular risk trends and preventive actions.</p>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Records" value={stats.total} tone="slate" />
        <SummaryCard title="Low Risk" value={stats.low} tone="green" />
        <SummaryCard title="Moderate Risk" value={stats.moderate} tone="amber" />
        <SummaryCard title="High Risk" value={stats.high} tone="red" />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Risk Distribution</h3>
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
