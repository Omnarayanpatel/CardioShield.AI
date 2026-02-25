import {Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Prediction from "./pages/Prediction";
import History from "./pages/History";
import Register from "./pages/Register";
function App() {
  return (
    
    <Routes>
      
      {/* Register page outside layout */}
      <Route path="/register" element={<Register />} />

             {/* All main pages inside layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="prediction" element={<Prediction />} />
        <Route path="history" element={<History />} />
      </Route>

    </Routes>
    
  );
}

export default App;