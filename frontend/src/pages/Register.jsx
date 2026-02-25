import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
console.log("Clicked");
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      console.log("Sending request...");
      const res = await axios.post("http://127.0.0.1:8000/register", {
        name: formData.first_name + " " + formData.last_name,
        email: formData.email,
        password: formData.password
      });

        console.log("API Success :", response.data);
      navigate("/", { replace: true });

    } catch (error) {
      console.log("FULL ERROR:", error);
  console.log("RESPONSE DATA:", error.response);
  console.log("Response data:", error.response?.data);
  alert(JSON.stringify(error.response?.data));
    }
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Patient Registration
        </h2>

        <input name="first_name" placeholder="First Name"
          className="w-full mb-3 p-3 border rounded-lg"
          onChange={handleChange} required />

        <input name="last_name" placeholder="Last Name"
          className="w-full mb-3 p-3 border rounded-lg"
          onChange={handleChange} required />

        <input type="email" name="email" placeholder="Gmail Address"
          className="w-full mb-3 p-3 border rounded-lg"
          onChange={handleChange} required />

        {/* <input name="mobile" placeholder="Mobile Number"
          className="w-full mb-3 p-3 border rounded-lg"
          onChange={handleChange} required /> */}

        <input type="password" name="password" placeholder="Password"
          className="w-full mb-3 p-3 border rounded-lg"
          onChange={handleChange} required />

        <input type="password" name="confirmPassword" placeholder="Confirm Password"
          className="w-full mb-4 p-3 border rounded-lg"
          onChange={handleChange} required />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Register
        </button>
      </form>

    </div>
  );
}

export default Register;