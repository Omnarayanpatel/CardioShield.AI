import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen p-6 shadow-lg">
      <h2 className="text-3xl font-bold mb-10 text-blue-400">
        CardioShield AI
      </h2>

      <nav className="flex flex-col gap-6 text-lg">
        <Link to="/" className="hover:text-blue-400 transition">
          Dashboard
        </Link>
        <Link to="/prediction" className="hover:text-blue-400 transition">
          New Prediction
        </Link>
        <Link to="/history" className="hover:text-blue-400 transition">
          History
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;