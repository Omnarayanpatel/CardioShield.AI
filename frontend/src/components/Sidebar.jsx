import { NavLink } from "react-router-dom";
import { getAuth } from "../api";

function Sidebar() {
  const role = getAuth()?.user?.role;
  const patientLinks = [
    { to: "/patient/dashboard", label: "Dashboard" },
    { to: "/patient/prediction", label: "New Prediction" },
    { to: "/patient/history", label: "History" },
  ];
  const adminLinks = [
    { to: "/admin/dashboard", label: "Overview" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/predictions", label: "Predictions" },
    { to: "/admin/fairness", label: "Fairness" },
  ];
  const links = role === "doctor" ? adminLinks : patientLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-cyan-300">CardioShield AI</h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-8">{role ?? "patient"} workspace</p>
      <nav className="flex flex-col gap-3 text-sm">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
