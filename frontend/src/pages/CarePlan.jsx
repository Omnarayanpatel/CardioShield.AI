import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api";

const HIGH_RISK_DAILY_TRACKING = [
  "Morning BP reading logged",
  "Evening BP reading logged",
  "Medicines taken on time",
  "30 min safe activity completed",
  "No smoking or alcohol today",
];

function categoryLabel(code) {
  if (code === 0) return "Low";
  if (code === 1) return "Moderate";
  if (code === 2) return "High";
  return "Unknown";
}

function categoryTone(code) {
  if (code === 2) return "bg-rose-100 text-rose-700 border border-rose-200";
  if (code === 1) return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}

function planByRisk(code) {
  if (code === 2) {
    return {
      title: "High-Risk Care Plan",
      immediate: [
        "Schedule cardiologist consult within 24-72 hours.",
        "Monitor BP and pulse twice daily; log readings.",
        "Avoid smoking and alcohol immediately.",
      ],
      daily: [
        "30 minutes light walking (if clinically safe).",
        "Low-salt meals, avoid fried and processed food.",
        "Sleep 7-8 hours, avoid late-night stress triggers.",
      ],
      weekly: [
        "One tele-consult or physical follow-up check.",
        "Review medicine adherence and BP trend chart.",
      ],
      warning: "If chest pain, severe breathlessness, left arm/jaw pain, or fainting occurs, seek emergency care immediately.",
    };
  }
  if (code === 1) {
    return {
      title: "Moderate-Risk Care Plan",
      immediate: [
        "Book physician review within 1-2 weeks.",
        "Start daily BP checks at a fixed time.",
        "Reduce sugar and sodium intake from today.",
      ],
      daily: [
        "40 minutes brisk walk or cycling.",
        "At least 2 fruits + high-fiber meals.",
        "No tobacco; limit alcohol to zero or minimal.",
      ],
      weekly: [
        "Track weight and waist circumference.",
        "Recheck glucose and BP trend weekly.",
      ],
      warning: "If repeated chest discomfort or unusual fatigue appears, do early medical review.",
    };
  }
  return {
    title: "Low-Risk Maintenance Plan",
    immediate: [
      "Continue current healthy habits consistently.",
      "Keep annual cardiovascular screening schedule.",
      "Avoid new smoking/alcohol habits.",
    ],
    daily: [
      "30-45 minutes physical activity.",
      "Balanced meals with low trans-fat and low salt.",
      "Hydration + consistent sleep cycle.",
    ],
    weekly: [
      "One day stress reset: yoga, breathing, or meditation.",
      "Review activity and meal consistency.",
    ],
    warning: "If new symptoms appear (chest pain, breathlessness), do not ignore and consult early.",
  };
}

function readHighRiskState(checkStorageKey, followUpKey) {
  if (typeof window === "undefined") {
    return { checks: {}, followUpDone: false };
  }

  try {
    const savedChecks = window.localStorage.getItem(checkStorageKey);
    const savedFollowUp = window.localStorage.getItem(followUpKey);
    return {
      checks: savedChecks ? JSON.parse(savedChecks) : {},
      followUpDone: savedFollowUp === "done",
    };
  } catch {
    return { checks: {}, followUpDone: false };
  }
}

function CarePlan() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/history")
      .then((res) => setRecords(res.data))
      .catch(() => setError("Unable to load latest risk data."));
  }, []);

  const latest = useMemo(() => {
    if (!records.length) return null;
    return [...records].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
  }, [records]);

  const riskCode = latest?.risk_category ?? 0;
  const isHighRisk = riskCode === 2;
  const plan = planByRisk(riskCode);
  const riskPercent = latest ? `${((Number(latest.risk_probability) || 0) * 100).toFixed(1)}%` : "-";
  const latestDate = latest?.created_at ? new Date(latest.created_at) : new Date();
  const followUpDue = new Date(latestDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  const todayKey = new Date().toISOString().slice(0, 10);
  const checkStorageKey = `cardio_daily_checks_${todayKey}`;
  const followUpKey = `cardio_follow_up_${followUpDue.toISOString().slice(0, 10)}`;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Personal Care Plan</h2>
            <p className="mt-1 text-sm text-slate-500">Precautions and routine guidance based on your latest risk result.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/patient/prediction")}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            New Prediction
          </button>
        </div>
      </section>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      {isHighRisk ? (
        <section className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">High Risk Alert</p>
          <h3 className="mt-1 text-lg font-semibold text-rose-900">Immediate preventive action required</h3>
          <p className="mt-1 text-sm text-rose-800">
            Your latest prediction indicates high cardiovascular risk. Please follow urgent precautions and specialist review timeline.
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryTone(riskCode)}`}>
            {categoryLabel(riskCode)} Risk
          </span>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Probability {riskPercent}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Top factors: {(latest?.top_risk_factors || []).slice(0, 2).join(", ") || "N/A"}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{plan.title}</h3>
      </section>

      {isHighRisk ? (
        <HighRiskTracker
          key={`${checkStorageKey}:${followUpKey}`}
          checkStorageKey={checkStorageKey}
          followUpKey={followUpKey}
          followUpDue={followUpDue}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <PlanCard title="Immediate Precautions" items={plan.immediate} tone="rose" />
        <PlanCard title="Daily Routine" items={plan.daily} tone="cyan" />
        <PlanCard title="Weekly Checklist" items={plan.weekly} tone="emerald" />
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-800">Warning Signs</h4>
        <p className="mt-1 text-sm text-amber-900">{plan.warning}</p>
      </section>
    </div>
  );
}

function HighRiskTracker({ checkStorageKey, followUpKey, followUpDue }) {
  const initialState = readHighRiskState(checkStorageKey, followUpKey);
  const [dailyChecks, setDailyChecks] = useState(initialState.checks);
  const [followUpDone, setFollowUpDone] = useState(initialState.followUpDone);

  const completedDailyChecks = Object.values(dailyChecks).filter(Boolean).length;
  const allDailyDone = completedDailyChecks === HIGH_RISK_DAILY_TRACKING.length;
  const followUpOverdue = !followUpDone && new Date() > followUpDue;

  useEffect(() => {
    window.localStorage.setItem(checkStorageKey, JSON.stringify(dailyChecks));
  }, [dailyChecks, checkStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(followUpKey, followUpDone ? "done" : "pending");
  }, [followUpDone, followUpKey]);

  const toggleDailyCheck = (item) => {
    setDailyChecks((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Urgent Follow-Up Reminder</h3>
        <p className="mt-2 text-sm text-slate-700">
          Specialist consult due by <span className="font-semibold text-slate-900">{followUpDue.toLocaleDateString()}</span>
        </p>
        <p className={`mt-1 text-sm font-medium ${followUpOverdue ? "text-rose-700" : "text-amber-700"}`}>
          {followUpDone ? "Marked done." : followUpOverdue ? "Overdue: please consult immediately." : "Pending follow-up."}
        </p>
        <button
          type="button"
          onClick={() => setFollowUpDone((prev) => !prev)}
          className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
            followUpDone ? "bg-slate-700 hover:bg-slate-600" : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {followUpDone ? "Mark as Pending" : "Mark Follow-Up Done"}
        </button>
      </div>

      <div className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Mandatory Daily Tracking</h3>
        <p className="mt-1 text-sm text-slate-600">
          Completion: <span className="font-semibold text-slate-900">{completedDailyChecks}/{HIGH_RISK_DAILY_TRACKING.length}</span>
        </p>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            style={{ width: `${(completedDailyChecks / HIGH_RISK_DAILY_TRACKING.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 space-y-2">
          {HIGH_RISK_DAILY_TRACKING.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
              <input type="checkbox" checked={Boolean(dailyChecks[item])} onChange={() => toggleDailyCheck(item)} />
              <span className={`${dailyChecks[item] ? "line-through text-slate-500" : "text-slate-700"}`}>{item}</span>
            </label>
          ))}
        </div>
        {allDailyDone ? (
          <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm font-medium text-emerald-700">Great. All mandatory tracking items completed for today.</p>
        ) : null}
      </div>
    </section>
  );
}

function PlanCard({ title, items, tone }) {
  const tones = {
    rose: "bg-rose-50 border-rose-100",
    cyan: "bg-cyan-50 border-cyan-100",
    emerald: "bg-emerald-50 border-emerald-100",
  };
  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${tones[tone] || "bg-white border-slate-200"}`}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="rounded-lg bg-white/80 p-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CarePlan;
