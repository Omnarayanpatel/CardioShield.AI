import { useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../api";

function Navbar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth?.user;

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">CardioShield AI</h1>
        <p className="text-sm text-slate-500">Early cardiovascular risk stratification</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-slate-500">{user?.role ?? "guest"}</p>
          <p className="text-sm font-semibold text-slate-800">{user?.name ?? "User"}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
