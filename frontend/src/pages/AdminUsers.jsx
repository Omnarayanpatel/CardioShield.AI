import { useEffect, useState } from "react";

import api, { downloadFromApi } from "../api";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("csv");

  const loadUsers = () => {
    api.get("/admin/users").then((res) => setUsers(res.data));
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

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">User Management</h2>
        <div className="flex items-center gap-2">
          <select
            className="input max-w-[120px]"
            value={downloadFormat}
            onChange={(event) => setDownloadFormat(event.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="txt">TXT</option>
          </select>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            onClick={() => downloadFromApi(`/admin/users/export?format=${downloadFormat}`, `users.${downloadFormat}`)}
          >
            Download
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3">Name</th>
              <th className="py-3">Email</th>
              <th className="py-3">Role</th>
              <th className="py-3">Status</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100">
                <td className="py-3">{user.name}</td>
                <td className="py-3">{user.email}</td>
                <td className="py-3 capitalize">{user.role}</td>
                <td className="py-3">{user.is_active ? "Active" : "Inactive"}</td>
                <td className="py-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => toggleActive(user)}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
