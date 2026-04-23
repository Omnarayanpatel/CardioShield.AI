import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api";
import BrandMark from "../components/BrandMark";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        invite_code: form.role === "doctor" ? form.inviteCode : undefined,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_40%),linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#134e4a_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/assets/heart_login.jfif"
          alt=""
          className="h-full w-full object-cover opacity-45 brightness-110 saturate-125 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.38),rgba(15,23,42,0.18),rgba(2,6,23,0.52))]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center">
        <form onSubmit={handleSubmit} className="relative rounded-[2rem] bg-white p-8 shadow-2xl">
          <div className="absolute right-5 top-5 sm:right-6 sm:top-6">
            <BrandMark className="shadow-none" sizeClass="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Register</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Create Account</h2>
            <p className="mt-2 text-sm text-slate-500">Set up your CardioShield workspace in a few steps.</p>
          </div>

          {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

          <div className="grid grid-cols-1 gap-4">
            <input className="input" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <input
              className="input"
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Account type</label>
              <select className="input" name="role" value={form.role} onChange={handleChange}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            {form.role === "doctor" ? (
              <div className="space-y-1">
                <input
                  className="input"
                  type="text"
                  name="inviteCode"
                  placeholder="Doctor invite code"
                  value={form.inviteCode}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-slate-500">Ask an existing admin for the doctor invite code.</p>
              </div>
            ) : null}
            <input
              className="input"
              type="password"
              name="password"
              placeholder="Password (8+ chars)"
              value={form.password}
              onChange={handleChange}
              required
            />
            <input
              className="input"
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              className="rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
          <div className="mt-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-cyan-800">Account logic</p>
            <p className="mt-1 text-sm leading-6">
              Patients can self-register. Doctors need an invite code. Admin accounts are created from the bootstrap environment settings.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <RoleNote title="Doctor" text="Invite-code gated access for clinician workflows and patient oversight." />
              <RoleNote title="Admin" text="Bootstrap-created access for governance and account control." />
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function RoleNote({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

export default Register;
