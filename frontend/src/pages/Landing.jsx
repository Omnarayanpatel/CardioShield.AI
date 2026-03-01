import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
          AI-Powered Early Risk Stratification
        </p>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
          CardioShield AI
          <span className="block text-cyan-300">Predict Early. Act Faster.</span>
        </h1>
        <p className="mt-6 max-w-3xl text-slate-300 text-lg">
          Clinician-friendly cardiovascular risk screening platform built for underserved communities with explainable,
          bias-aware predictions.
        </p>
        <div className="mt-8 flex gap-4">
          <Link to="/register" className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
            Get Started
          </Link>
          <Link to="/login" className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold hover:border-cyan-400 hover:text-cyan-300">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;
