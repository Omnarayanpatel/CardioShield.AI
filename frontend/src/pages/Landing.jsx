import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";

function Landing() {
  return (
    <div className="min-h-screen bg-[#041426] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_18%_0%,rgba(45,212,191,0.34),transparent_48%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.22),transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.35),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] bg-[radial-gradient(circle_at_50%_100%,rgba(14,116,144,0.22),transparent_55%)]" />

      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="shadow-cyan-500/10" sizeClass="h-11 w-11 sm:h-12 sm:w-12" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">CardioShield AI</p>
              <p className="text-sm text-slate-300">Early Risk Stratification Platform</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/contact" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
              Contact
            </Link>
            <Link to="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
              Sign In
            </Link>
            <Link to="/register" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
              Clinician-ready AI workflow
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                Predict cardiovascular risk
                <span className="block text-cyan-300">before the event happens.</span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                CardioShield AI helps doctors and care teams identify low, moderate, and high-risk patients with explainable outputs,
                practical recommendations, and downloadable clinical reports.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300">
                Start Screening
              </Link>
              <Link to="/login" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
                Open Dashboard
              </Link>
              <Link to="/contact" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
                Contact Team
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Prediction Latency" value="< 1 second" />
              <Stat label="Risk Bands" value="Low / Moderate / High" />
              <Stat label="Explainability" value="Top risk drivers" />
              <Stat label="Export Ready" value="CSV / JSON / TXT" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.26),transparent_55%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-4 shadow-2xl backdrop-blur">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/40">
                <img
                  src="/assets/heart_landing.jfif"
                  alt="Heart protection illustration"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-cyan-200/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Ready for care teams</p>
                  <p className="mt-2 text-sm text-slate-200">Patient, doctor, and admin workflows with clear role boundaries.</p>
                </div>
                <div className="rounded-2xl border border-cyan-200/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Clinical signal</p>
                  <p className="mt-2 text-sm text-slate-200">Actionable recommendations and escalation guidance.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-4">
          <FeatureCard title="Input" text="Low-cost vitals and lifestyle fields." />
          <FeatureCard title="Predict" text="Calibrated probability and risk category." />
          <FeatureCard title="Explain" text="Top contributing factors in plain language." />
          <FeatureCard title="Act" text="Recommendation and escalation guidance." />
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold text-cyan-200">For Patients</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">Run prediction, track history, and download personal reports.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold text-cyan-200">For Doctors</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">Monitor patient risk, review assigned cases, and export decision-ready data.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </div>
  );
}

export default Landing;
