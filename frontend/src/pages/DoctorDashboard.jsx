import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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

function DoctorDashboard() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [createState, setCreateState] = useState({ loading: false, message: "", temporaryPassword: "" });

  useEffect(() => {
    Promise.all([api.get("/history"), api.get("/doctor/patients")])
      .then(([historyRes, patientsRes]) => {
        setRecords(historyRes.data);
        setPatients(patientsRes.data);
      })
      .catch(() => setError("Unable to fetch patient history."));
  }, []);

  const stats = useMemo(() => {
    const low = records.filter((row) => row.risk_category === 0).length;
    const moderate = records.filter((row) => row.risk_category === 1).length;
    const high = records.filter((row) => row.risk_category === 2).length;
    const escalations = records.filter((row) => row.escalation_required).length;
    return { low, moderate, high, total: records.length, escalations };
  }, [records]);

  const trendData = useMemo(() => {
    const map = new Map();
    records.forEach((item) => {
      if (!item.created_at) return;
      const date = new Date(item.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { date: key, total: 0, high: 0, escalations: 0 });
      }
      const row = map.get(key);
      row.total += 1;
      if (item.risk_category === 2) row.high += 1;
      if (item.escalation_required) row.escalations += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  }, [records]);

  const pieData = [
    { name: "Low", value: stats.low, color: "#10b981" },
    { name: "Moderate", value: stats.moderate, color: "#f59e0b" },
    { name: "High", value: stats.high, color: "#ef4444" },
  ];

  const recentRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 6),
    [records],
  );

  const recentPatients = useMemo(
    () => [...patients].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8),
    [patients],
  );

  const topFactors = useMemo(() => {
    const counts = new Map();
    records.forEach((row) => {
      (row.top_risk_factors || []).forEach((factor) => counts.set(factor, (counts.get(factor) || 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [records]);

  const handleCreatePatient = async (event) => {
    event.preventDefault();
    setCreateState({ loading: true, message: "", temporaryPassword: "" });
    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
      };
      if (createForm.password.trim()) {
        payload.password = createForm.password.trim();
      }
      const res = await api.post("/doctor/patients", payload);
      setPatients((prev) => [res.data.user, ...prev.filter((item) => item.id !== res.data.user.id)]);
      setCreateForm({ name: "", email: "", password: "" });
      setCreateState({
        loading: false,
        message: res.data.message || "Patient created successfully.",
        temporaryPassword: res.data.temporary_password || "",
      });
    } catch (err) {
      const detail = err?.response?.data?.detail || "Unable to create patient.";
      setCreateState({ loading: false, message: detail, temporaryPassword: "" });
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Clinician Workspace</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">Doctor Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Clinical overview of patient predictions, escalation signals, and risk drivers.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Assigned Patients: {patients.length}</span>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-700">Patient Records: {records.length}</span>
        </div>
      </section>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">New Patient</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">Create a patient under your care</h3>
            <p className="mt-1 text-sm text-slate-600">The patient account will be assigned to you automatically.</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Your roster updates instantly</p>
            <p className="text-xs text-emerald-700">No admin step needed for assignment.</p>
          </div>
        </div>

        <form onSubmit={handleCreatePatient} className="mt-5 grid gap-3 lg:grid-cols-4">
          <input
            className="input py-3"
            placeholder="Patient name"
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            type="email"
            className="input py-3"
            placeholder="Patient email"
            value={createForm.email}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <input
            type="text"
            className="input py-3"
            placeholder="Temporary password (optional)"
            value={createForm.password}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <button
            type="submit"
            disabled={createState.loading}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {createState.loading ? "Creating..." : "Create Patient"}
          </button>
        </form>

        {createState.message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">{createState.message}</p>
            {createState.temporaryPassword ? (
              <p className="mt-1 text-xs text-emerald-800">
                Temporary password: <span className="font-mono font-semibold">{createState.temporaryPassword}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Records" value={stats.total} tone="slate" />
        <SummaryCard title="Low Risk" value={stats.low} tone="green" />
        <SummaryCard title="Moderate Risk" value={stats.moderate} tone="amber" />
        <SummaryCard title="High Risk" value={stats.high} tone="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Risk Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Escalation Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip labelFormatter={formatDay} />
                <Area yAxisId="right" type="monotone" dataKey="high" name="High Risk" fill="#fecaca" fillOpacity={0.35} stroke="#ef4444" />
                <Line yAxisId="left" type="monotone" dataKey="escalations" name="Escalations" stroke="#0f172a" strokeWidth={2.2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Top Risk Drivers</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFactors} layout="vertical" margin={{ left: 8, right: 8 }}>
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
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Assigned Patients</h3>
          <div className="space-y-2">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                <p className="text-xs text-slate-600">{patient.email}</p>
              </div>
            ))}
            {patients.length === 0 ? <p className="text-sm text-slate-500">No patients assigned yet.</p> : null}
          </div>
          <h3 className="mb-4 mt-6 text-lg font-semibold text-slate-800">Recent Patient Records</h3>
          <div className="space-y-2">
            {recentRecords.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{formatDay(row.created_at)}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {row.user_email || "Unknown user"} | {(Number(row.risk_probability) * 100).toFixed(1)}%
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

export default DoctorDashboard;
