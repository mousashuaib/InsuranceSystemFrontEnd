<<<<<<< HEAD
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
=======
import Header from "./Header.jsx";

function App() {
  return (
    <Header />
>>>>>>> 63b3b22b215bb7200a8e0d610b9fcf114a02b5bc
  );
}

export default App;
