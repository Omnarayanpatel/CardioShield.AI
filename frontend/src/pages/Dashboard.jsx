import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

function Dashboard() {

  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/history")
      .then(res => setHistory(res.data))
      .catch(err => console.error(err));
  }, []);

  const low = history.filter(item => item.risk_category === 0).length;
  const medium = history.filter(item => item.risk_category === 1).length;
  const high = history.filter(item => item.risk_category === 2).length;

  const total = history.length;

  const data = [
    { name: "Low Risk", value: low },
    { name: "Moderate Risk", value: medium },
    { name: "High Risk", value: high },
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <h1 className="text-4xl font-bold mb-8 text-blue-600">
        CardioShield AI Analytics
      </h1>

      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-4 gap-6 mb-12">

        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg">Total Predictions</h2>
          <p className="text-3xl font-bold mt-2">{total}</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg">Low Risk</h2>
          <p className="text-3xl font-bold mt-2">{low}</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg">Moderate Risk</h2>
          <p className="text-3xl font-bold mt-2">{medium}</p>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg">High Risk</h2>
          <p className="text-3xl font-bold mt-2">{high}</p>
        </div>

      </div>

      {/* ================= PIE CHART SECTION ================= */}

      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">

        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          Risk Distribution Overview
        </h2>

        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={150}
              innerRadius={70}
              paddingAngle={5}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

      </div>

      {/* ================= AI INSIGHT SECTION ================= */}

      {total > 0 && (
        <div className="mt-10 bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-4">
            AI Insight Summary
          </h2>

          <p className="text-lg">
            {high / total > 0.4
              ? "⚠ High cardiovascular risk ratio detected. Preventive health programs recommended."
              : medium / total > 0.4
              ? "Moderate risk population is dominant. Lifestyle awareness initiatives suggested."
              : "Overall population shows stable cardiovascular health trends."}
          </p>

          <p className="mt-4 font-semibold">
            High Risk Percentage: {((high / total) * 100).toFixed(2)}%
          </p>
        </div>
      )}

    </div>
  );
}

export default Dashboard;