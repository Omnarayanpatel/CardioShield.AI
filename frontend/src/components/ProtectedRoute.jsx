import { Navigate } from "react-router-dom";
import { getAuth } from "../api";

function ProtectedRoute({ children, allowRoles = [] }) {
  const auth = getAuth();
  const token = auth?.token;
  const role = auth?.user?.role;

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowRoles.length > 0 && !allowRoles.includes(role)) {
    const target = role === "admin" ? "/admin/dashboard" : role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
    return <Navigate to={target} replace />;
  }

  return children;
}

export default ProtectedRoute;
