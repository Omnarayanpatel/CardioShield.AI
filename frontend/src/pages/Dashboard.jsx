import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function Dashboard() {

  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/history")
      .then(res => setHistory(res.data))
      .catch(err => console.error(err));
  }, []);

  // Count risks
  const low = history.filter(item => item.risk_category === 0).length;
  const medium = history.filter(item => item.risk_category === 1).length;
  const high = history.filter(item => item.risk_category === 2).length;

  const data = [
    { name: "Low Risk", value: low },
    { name: "Medium Risk", value: medium },
    { name: "High Risk", value: high },
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  return (
    <div className="p-6 overflow-y-hidden">

      <h1 className="text-3xl font-bold mb-6">
        Health Analytics Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold">Total Predictions</h2>
          <p className="text-3xl font-bold mt-2">{history.length}</p>
        </div>

        <div className="bg-green-100 shadow-lg rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold">Low Risk</h2>
          <p className="text-3xl font-bold mt-2">{low}</p>
        </div>

        <div className="bg-red-100 shadow-lg rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold">High Risk</h2>
          <p className="text-3xl font-bold mt-2">{high}</p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="flex justify-center">
        <PieChart width={400} height={400}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={150}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

    </div>
  );
}

export default Dashboard;