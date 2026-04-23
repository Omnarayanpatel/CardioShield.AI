import { useEffect, useMemo, useState } from "react";

import api from "../api";

function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", is_active: true });
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [createState, setCreateState] = useState({ loading: false, message: "", temporaryPassword: "" });

  const loadPatients = async () => {
    const res = await api.get("/doctor/patients");
    setPatients(res.data);
  };

  useEffect(() => {
    loadPatients().catch(() => setMessage("Unable to load patients."));
  }, []);

  const startEdit = (patient) => {
    setEditingId(patient.id);
    setForm({
      name: patient.name || "",
      email: patient.email || "",
      password: "",
      is_active: !!patient.is_active,
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", email: "", password: "", is_active: true });
  };

  const savePatient = async (patientId) => {
    setLoading(true);
    setMessage("");
    try {
      await api.patch(`/doctor/patients/${patientId}`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim() || null,
        is_active: form.is_active,
      });
      await loadPatients();
      cancelEdit();
      setMessage("Patient updated successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Unable to update patient.");
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (patient) => {
    const confirmed = window.confirm(`Delete ${patient.email}? This will remove the patient from your roster.`);
    if (!confirmed) return;
    setLoading(true);
    setMessage("");
    try {
      await api.delete(`/doctor/patients/${patient.id}`);
      await loadPatients();
      if (editingId === patient.id) cancelEdit();
      setMessage("Patient deleted successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Unable to delete patient.");
    } finally {
      setLoading(false);
    }
  };

  const createPatient = async (event) => {
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
      setCreateState({
        loading: false,
        message: err?.response?.data?.detail || "Unable to create patient.",
        temporaryPassword: "",
      });
    }
  };

  const activeCount = useMemo(() => patients.filter((item) => item.is_active).length, [patients]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Doctor Scope</p>
            <h2 className="text-3xl font-semibold text-slate-900">My Patients</h2>
            <p className="text-sm text-slate-600">Manage only the patients assigned to you.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Total: {patients.length}</span>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-700">Active: {activeCount}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <form onSubmit={createPatient} className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 lg:grid-cols-4">
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">{createState.message}</p>
            {createState.temporaryPassword ? (
              <p className="mt-1 text-xs text-emerald-800">
                Temporary password: <span className="font-mono font-semibold">{createState.temporaryPassword}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {message ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p> : null}

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    {editingId === patient.id ? (
                      <input
                        className="input max-w-[220px] py-2"
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    ) : (
                      <span className="font-medium text-slate-900">{patient.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editingId === patient.id ? (
                      <input
                        type="email"
                        className="input max-w-[260px] py-2"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    ) : (
                      <span className="text-slate-700">{patient.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editingId === patient.id ? (
                      <select
                        className="input max-w-[140px] py-2"
                        value={form.is_active ? "active" : "inactive"}
                        onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.value === "active" }))}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          patient.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {patient.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {patient.created_at ? new Date(patient.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      {editingId === patient.id ? (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => savePatient(patient.id)}
                            className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={cancelEdit}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => startEdit(patient)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => deletePatient(patient)}
                            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No patients assigned yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default DoctorPatients;
