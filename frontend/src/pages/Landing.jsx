import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen bg-[#041426] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.28),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_45%)]" />

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">CardioShield AI</p>
            <p className="text-sm text-slate-300">Early Risk Stratification Platform</p>
          </div>
          <div className="flex gap-2">
            <Link to="/login" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:border-cyan-300 hover:text-cyan-200">
              Sign In
            </Link>
            <Link to="/register" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:py-16">
        <section className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex items-center rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              Clinician-ready AI workflow
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
              Predict cardiovascular risk
              <span className="block text-cyan-300">before the event happens.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              CardioShield AI helps doctors and care teams identify low, moderate, and high-risk patients with explainable
              outputs, practical recommendations, and downloadable clinical reports.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                Start Screening
              </Link>
              <Link to="/login" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold hover:border-cyan-300 hover:text-cyan-200">
                Open Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Platform Highlights</p>
            <div className="mt-4 space-y-3">
              <Stat label="Prediction Latency" value="< 1 second" />
              <Stat label="Risk Bands" value="Low / Moderate / High" />
              <Stat label="Explainability" value="Top risk drivers" />
              <Stat label="Export Ready" value="CSV / JSON / TXT" />
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-cyan-200">For Patients</h3>
            <p className="mt-2 text-sm text-slate-300">Run prediction, track history, and download personal reports.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-cyan-200">For Doctors</h3>
            <p className="mt-2 text-sm text-slate-300">Monitor population risk, apply filters, and export decision-ready data.</p>
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
