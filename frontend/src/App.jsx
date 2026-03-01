import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPredictions from "./pages/AdminPredictions";
import AdminUsers from "./pages/AdminUsers";
import FairnessReport from "./pages/FairnessReport";
import History from "./pages/History";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import Prediction from "./pages/Prediction";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowRoles={["patient"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="prediction" element={<Prediction />} />
        <Route path="history" element={<History />} />
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowRoles={["doctor"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="predictions" element={<AdminPredictions />} />
        <Route path="fairness" element={<FairnessReport />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
