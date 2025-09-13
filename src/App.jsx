import { Routes, Route } from "react-router-dom";
import Login from "./Login"; // ✅ انتبه لحجم الحروف
import PrivateRoute from "./PrivateRoute";

import ClientDashboard from "./Component/Client/ClientDashboard";
import DoctorDashboard from "./Component/Doctor/DoctorDashboard";
import PharmacistDashboard from "./Component/Pharmacist/PharmacistDashboard";
import LabDashboard from "./Component/Lab/LabDashboard";

function App() {
  return (
    <Routes>
      {/* صفحة تسجيل الدخول */}
      <Route path="/" element={<Login />} />

      {/* صفحات محمية */}
      <Route
        path="/client"
        element={
          <PrivateRoute role="INSURANCE_CLIENT">
            <ClientDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <PrivateRoute role="DOCTOR">
            <DoctorDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/pharmacist"
        element={
          <PrivateRoute role="PHARMACIST">
            <PharmacistDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/lab"
        element={
          <PrivateRoute role="LAB_TECH">
            <LabDashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
