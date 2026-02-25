import { useState } from "react";
import axios from "axios";

function Prediction() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    ap_hi: "",
    ap_lo: "",
    cholesterol: "",
    gluc: "",
    smoke: "",
    alco: "",
    active: "",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ✅ Convert all values to numbers before sending
      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        {
          age: Number(formData.age),
          gender: Number(formData.gender),
          height: Number(formData.height),
          weight: Number(formData.weight),
          ap_hi: Number(formData.ap_hi),
          ap_lo: Number(formData.ap_lo),
          cholesterol: Number(formData.cholesterol),
          gluc: Number(formData.gluc),
          smoke: Number(formData.smoke),
          alco: Number(formData.alco),
          active: Number(formData.active),
        }
      );

      setResult(response.data);
      console.log(response.data);

    } catch (error) {
      console.error(error);
      alert("Error connecting to backend");
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">New Heart Risk Prediction</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-6">

          <input name="age" placeholder="Age (in days)" onChange={handleChange} className="input" />
          <input name="height" placeholder="Height (cm)" onChange={handleChange} className="input" />
          <input name="weight" placeholder="Weight (kg)" onChange={handleChange} className="input" />
          <input name="ap_hi" placeholder="Systolic BP" onChange={handleChange} className="input" />
          <input name="ap_lo" placeholder="Diastolic BP" onChange={handleChange} className="input" />

          <select name="gender" onChange={handleChange} className="input">
            <option value="">Select Gender</option>
            <option value="1">Female</option>
            <option value="2">Male</option>
          </select>

          <select name="cholesterol" onChange={handleChange} className="input">
            <option value="">Cholesterol</option>
            <option value="1">Normal</option>
            <option value="2">Above Normal</option>
            <option value="3">Well Above Normal</option>
          </select>

          <select name="gluc" onChange={handleChange} className="input">
            <option value="">Glucose</option>
            <option value="1">Normal</option>
            <option value="2">Above Normal</option>
            <option value="3">Well Above Normal</option>
          </select>

          <select name="smoke" onChange={handleChange} className="input">
            <option value="">Smoking</option>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>

          <select name="alco" onChange={handleChange} className="input">
            <option value="">Alcohol</option>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>

          <select name="active" onChange={handleChange} className="input">
            <option value="">Physical Activity</option>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>

          <button
            type="submit"
            className="col-span-2 bg-blue-600 text-white py-3 rounded-lg"
          >
            Predict Risk
          </button>
        </div>

     {result && (
  <div
    className={`mt-8 p-8 rounded-2xl shadow-xl text-white transition-all duration-500
    ${
      result.risk_category === "Low"
        ? "bg-gradient-to-r from-green-500 to-emerald-600"
        : result.risk_category === "Moderate"
        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
        : "bg-gradient-to-r from-red-500 to-rose-600"
    }`}
  >
    <h2 className="text-2xl font-bold mb-4">Prediction Result</h2>

    <div className="space-y-3 text-lg">
      <p>
        Risk Category:
        <span className="ml-2 font-semibold">
          {result.risk_category}
        </span>
      </p>

      <p>
        Risk Probability:
        <span className="ml-2 font-semibold">
          {(result.risk_probability * 100).toFixed(2)}%
        </span>
      </p>

      <p>
        Cardio Status:
        <span className="ml-2 font-semibold">
          {result.cardio === 1
            ? "⚠ Disease Detected"
            : "✅ No Disease"}
        </span>
      </p>
    </div>
  </div>
)}
      </form>
    </div>
  );
}

export default Prediction;