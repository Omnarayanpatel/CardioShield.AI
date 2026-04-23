import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPredictions from "./pages/AdminPredictions";
import AdminCareProtocols from "./pages/AdminCareProtocols";
import AdminUsers from "./pages/AdminUsers";
import FairnessReport from "./pages/FairnessReport";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorPatients from "./pages/DoctorPatients";
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
        <div className="global-ecg-ambient global-ecg-ambient-left" />
        <div className="global-ecg-ambient global-ecg-ambient-right" />

        <svg viewBox="0 0 1400 180" className="global-ecg-line global-ecg-line-top">
          <polyline
            fill="none"
            strokeWidth="2.3"
            points="0,110 92,110 128,110 158,62 192,140 223,96 276,110 420,110 452,110 482,62 516,140 548,96 604,110 744,110 778,110 808,62 842,140 874,96 928,110 1070,110 1104,110 1134,62 1168,140 1200,96 1254,110 1400,110"
          />
        </svg>
        <svg viewBox="0 0 1400 180" className="global-ecg-line global-ecg-line-mid">
          <polyline
            fill="none"
            strokeWidth="1.5"
            points="0,88 110,88 150,88 180,54 218,128 245,82 302,88 450,88 492,88 522,54 560,128 588,82 648,88 786,88 828,88 858,54 896,128 924,82 982,88 1132,88 1172,88 1202,54 1240,128 1268,82 1324,88 1400,88"
          />
        </svg>
        <svg viewBox="0 0 1400 180" className="global-ecg-line global-ecg-line-bottom">
          <polyline
            fill="none"
            strokeWidth="2"
            points="0,70 86,70 121,70 151,32 186,102 216,58 266,70 390,70 426,70 456,32 491,102 521,58 571,70 696,70 732,70 762,32 797,102 827,58 877,70 1002,70 1036,70 1066,32 1101,102 1131,58 1181,70 1400,70"
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
              <ProtectedRoute allowRoles={["admin"]}>
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

          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowRoles={["doctor"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="history" element={<History />} />
            <Route path="care-protocols" element={<AdminCareProtocols />} />
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
