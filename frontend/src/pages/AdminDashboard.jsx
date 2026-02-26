import { useEffect, useState } from "react";
import api from "../api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    api.get("/admin/users")
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));

    api.get("/admin/predictions")
      .then(res => setPredictions(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <h2>Total Users</h2>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>

        <div className="bg-green-100 p-6 rounded-xl shadow">
          <h2>Total Predictions</h2>
          <p className="text-2xl font-bold">{predictions.length}</p>
        </div>

        <div className="bg-red-100 p-6 rounded-xl shadow">
          <h2>High Risk Cases</h2>
          <p className="text-2xl font-bold">
            {predictions.filter(p => p.risk_category === 2).length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;