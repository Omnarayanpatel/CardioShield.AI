import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api, { saveAuth } from "../api";
import BrandMark from "../components/BrandMark";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/json" },
      });

      saveAuth({ token: data.access_token, user: data.user });
      const redirectTo =
        data.user.role === "admin" ? "/admin/dashboard" : data.user.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_40%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#164e63_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/assets/heart_login.jfif"
          alt=""
          className="h-full w-full object-cover opacity-45 brightness-110 saturate-125 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.38),rgba(2,6,23,0.18),rgba(2,6,23,0.52))]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center">
        <div className="relative w-full rounded-[2rem] bg-white p-8 shadow-2xl">
          <div className="absolute right-5 top-5 sm:right-6 sm:top-6">
            <BrandMark className="shadow-none" sizeClass="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Sign In</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Access CardioShield</h2>
            <p className="mt-2 text-sm text-slate-500">Use your registered email and password.</p>
          </div>

          {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <LoginNote title="Patient" text="See your history, predictions, and care plan." />
              <LoginNote title="Doctor" text="Review assigned patients and summaries." />
              <LoginNote title="Admin" text="Manage users, predictions, and fairness reports." />
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">
            First time user?{" "}
            <Link to="/register" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginNote({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

export default Login;
