import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPredictions from "./pages/AdminPredictions";
import AdminCareProtocols from "./pages/AdminCareProtocols";
import AdminUsers from "./pages/AdminUsers";
import FairnessReport from "./pages/FairnessReport";
import History from "./pages/History";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import CarePlan from "./pages/CarePlan";
import Contact from "./pages/Contact";
import PatientDashboard from "./pages/PatientDashboard";
import Prediction from "./pages/Prediction";
import Register from "./pages/Register";

function App() {
  return (
    <div className="app-shell-with-ecg">
      <div className="global-ecg-layer" aria-hidden="true">
        <svg viewBox="0 0 1400 180" className="global-ecg-line global-ecg-line-top">
          <polyline
            fill="none"
            strokeWidth="2.2"
            points="0,110 95,110 130,110 160,60 195,140 225,95 280,110 420,110 455,110 485,60 520,140 550,95 605,110 745,110 780,110 810,60 845,140 875,95 930,110 1070,110 1105,110 1135,60 1170,140 1200,95 1255,110 1400,110"
          />
        </svg>
        <svg viewBox="0 0 1400 180" className="global-ecg-line global-ecg-line-bottom">
          <polyline
            fill="none"
            strokeWidth="2"
            points="0,70 85,70 120,70 150,32 185,102 215,58 265,70 390,70 425,70 455,32 490,102 520,58 570,70 695,70 730,70 760,32 795,102 825,58 875,70 1000,70 1035,70 1065,32 1100,102 1130,58 1180,70 1400,70"
          />
        </svg>
      </div>

      <div className="app-shell-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/contact" element={<Contact />} />
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
            <Route path="care-plan" element={<CarePlan />} />
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
            <Route path="care-protocols" element={<AdminCareProtocols />} />
            <Route path="fairness" element={<FairnessReport />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
