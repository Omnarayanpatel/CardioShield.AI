import { useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../api";

function Navbar({ onMenuToggle = () => {} }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth?.user;

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur sm:px-4 md:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Toggle sidebar menu"
          onClick={onMenuToggle}
          className="inline-flex rounded-lg border border-slate-300 px-2.5 py-2 text-slate-700 hover:bg-slate-50 lg:hidden"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M3 5.75A.75.75 0 013.75 5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zm0 4.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm.75 3.5a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">CardioShield AI</h1>
          <p className="hidden text-xs text-slate-500 sm:block md:text-sm">Early cardiovascular risk stratification</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="text-right">
          <p className="text-xs text-slate-500 sm:text-sm">{user?.role ?? "guest"}</p>
          <p className="text-xs font-semibold text-slate-800 sm:text-sm">{user?.name ?? "User"}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 sm:px-4 sm:text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
