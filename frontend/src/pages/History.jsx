import { useEffect, useState } from "react";
import axios from "axios";

function History() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/history");
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold mb-6 text-blue-600">
        Prediction History
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <th className="py-3 px-4 text-left">Age</th>
              <th className="py-3 px-4 text-left">Gender</th>
              <th className="py-3 px-4 text-left">BP</th>
              <th className="py-3 px-4 text-left">Cholesterol</th>
              <th className="py-3 px-4 text-left">Probability</th>
              <th className="py-3 px-4 text-left">Risk</th>
            </tr>
          </thead>

          <tbody>
            {records.map((item, index) => (
              <tr
                key={index}
                className="border-b hover:bg-gray-100 transition"
              >
                <td className="py-3 px-4">
                  {(item.age / 365).toFixed(1)} yrs
                </td>

                <td className="py-3 px-4">
                  {item.gender === 1 ? "Female" : "Male"}
                </td>

                <td className="py-3 px-4">
                  {item.ap_hi}/{item.ap_lo}
                </td>

                <td className="py-3 px-4">
                  {item.cholesterol}
                </td>

                <td className="py-3 px-4 font-semibold">
                  {(item.risk_probability * 100).toFixed(2)}%
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm
                    ${
                      item.risk_category === 0
                        ? "bg-green-500"
                        : item.risk_category === 1
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    {item.risk_category === 0
                      ? "Low"
                      : item.risk_category === 1
                      ? "Moderate"
                      : "High"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {records.length === 0 && (
        <p className="text-gray-500 mt-6">No predictions yet.</p>
      )}
    </div>
  );
}

export default History;