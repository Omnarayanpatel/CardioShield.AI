import { useEffect, useState } from "react";

import api, { downloadFromApi } from "../api";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "patient", is_active: true });

  const loadUsers = async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleActive = async (user) => {
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
      loadUsers();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "patient",
      is_active: !!user.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", role: "patient", is_active: true });
  };

  const saveEdit = async (userId) => {
    setLoading(true);
    try {
      await api.patch(`/admin/users/${userId}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
        is_active: editForm.is_active,
      });
      await loadUsers();
      cancelEdit();
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(`Delete ${user.email}? This action cannot be undone.`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await api.delete(`/admin/users/${user.id}`);
      await loadUsers();
      if (editingId === user.id) {
        cancelEdit();
      }
    } finally {
      setLoading(false);
    }
  };

  const activeCount = users.filter((item) => item.is_active).length;
  const doctorCount = users.filter((item) => item.role === "doctor").length;
  const patientCount = users.filter((item) => item.role === "patient").length;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">CardioShield Control</p>
            <h2 className="text-3xl font-semibold text-slate-900">User Management</h2>
            <p className="text-sm text-slate-600">Manage doctor and patient accounts with secure role controls.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input max-w-[110px] bg-white/90 py-2"
              value={downloadFormat}
              onChange={(event) => setDownloadFormat(event.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="txt">TXT</option>
            </select>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
              onClick={() => downloadFromApi(`/admin/users/export?format=${downloadFormat}`, `users.${downloadFormat}`)}
            >
              Download
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total Users" value={users.length} />
          <MetricCard label="Active Users" value={activeCount} />
          <MetricCard label="Doctors / Patients" value={`${doctorCount} / ${patientCount}`} />
        </div>
      </div>

      <div className="p-6 pt-5">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 align-middle hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    {editingId === user.id ? (
                      <input
                        className="input max-w-[190px] py-2"
                        value={editForm.name}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    ) : (
                      <span className="font-medium text-slate-900">{user.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editingId === user.id ? (
                      <input
                        type="email"
                        className="input max-w-[240px] py-2"
                        value={editForm.email}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    ) : (
                      <span className="text-slate-700">{user.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editingId === user.id ? (
                      <select
                        className="input max-w-[140px] py-2"
                        value={editForm.role}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.role === "doctor" ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {user.role === "doctor" ? "Doctor" : "Patient"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editingId === user.id ? (
                      <select
                        className="input max-w-[140px] py-2"
                        value={editForm.is_active ? "active" : "inactive"}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, is_active: event.target.value === "active" }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      {editingId === user.id ? (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => saveEdit(user.id)}
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
                            onClick={() => startEdit(user)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => toggleActive(user)}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => deleteUser(user)}
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No users found.
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

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default AdminUsers;
