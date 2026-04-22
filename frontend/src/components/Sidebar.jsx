import { NavLink } from "react-router-dom";
import { getAuth } from "../api";
import BrandMark from "./BrandMark";

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const role = getAuth()?.user?.role;
  const patientLinks = [
    { to: "/patient/dashboard", label: "Dashboard" },
    { to: "/patient/prediction", label: "New Prediction" },
    { to: "/patient/care-plan", label: "Care Plan" },
    { to: "/patient/history", label: "History" },
  ];
  const adminLinks = [
    { to: "/admin/dashboard", label: "Overview" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/predictions", label: "Predictions" },
    { to: "/admin/care-protocols", label: "Care Protocols" },
    { to: "/admin/fairness", label: "Fairness" },
  ];
  const links = role === "doctor" ? adminLinks : patientLinks;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 p-6 text-slate-100 shadow-lg transition-transform duration-200
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:z-auto lg:min-h-screen lg:translate-x-0`}
    >
      <div className="mb-8 flex items-center gap-3">
        <BrandMark className="border-cyan-300/20 shadow-cyan-500/10" />
        <div>
          <h2 className="text-xl font-bold text-cyan-300">CardioShield AI</h2>
          <p className="text-xs uppercase tracking-wide text-slate-400">{role ?? "patient"} workspace</p>
        </div>
      </div>
      <nav className="flex flex-col gap-3 text-sm">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 transition ${
                isActive ? "bg-cyan-500 text-slate-950 font-semibold" : "hover:bg-slate-800"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
