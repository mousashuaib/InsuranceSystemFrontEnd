import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./Component/Auth/LandingPage";
import ManagerDashboard from "./Component/Manager/ManagerDashboard";
import PendingRequests from "./Component/Manager/Clients/PendingRequests"; 
import ClientList from "./Component/Manager/Clients/ClientList"; 
import PolicyList from "./Component/Manager/Policies/PolicyList";
import ClaimsList from "./Component/Manager/Claims/ClaimsList";
import ClaimsManage from "./Component/Manager/Claims/ClaimsManage";
import ManageNotifications from "./Component/Manager/Notifications/ManageNotifications";
import ClaimsReport from "./Component/Manager/Reports/ClaimsReport";
import UsageReport from "./Component/Manager/Reports/UsageReport";
import PoliciesReport from "./Component/Manager/Reports/PoliciesReport";
import ProvidersReport from "./Component/Manager/Reports/ProvidersReport";
import MembersActivityReport from "./Component/Manager/Reports/MembersActivityReport";
import FinancialReport from "./Component/Manager/Reports/FinancialReport";
import PendingEmergencyRequests from "./Component/Manager/Emergency Request/PendingEmergencyRequests";
import Profile from "./Component/Manager/Profile";
import PrivateRoute from "./PrivateRoute"; 
import EmergencyDashboard from "./Component/EmergencyManager/EmergencyDashboard";
import EmergencyProfile from "./Component/EmergencyManager/EmergencyProfile";
import EmergencyNotifications from "./Component/EmergencyManager/EmergencyNotifications";
import ResetPassword from "./Component/Auth/ResetPassword";
import About from "./About"; 
import ClientDashboard from "./Component/Client/ClientDashboard";
import DoctorDashboard from "./Component/Doctor/DoctorDashboard";
import PharmacistDashboard from "./Component/Pharmacist/PharmacistDashboard";
import LabDashboard from "./Component/Lab/LabDashboard";
import Header from "./Header.jsx";

function App() {
  return (
    <>
      <Header />

      <Routes>
        {/* الصفحات المفتوحة */}
        <Route path="/" element={<Login />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/About" element={<About />} />

        {/* الصفحات المحمية (Manager + Emergency) */}
        <Route element={<PrivateRoute />}>
          <Route path="/ManagerDashboard" element={<ManagerDashboard />} />
          <Route path="/PendingRequests" element={<PendingRequests />} />
          <Route path="/ClientList" element={<ClientList />} />
          <Route path="/PolicyList" element={<PolicyList />} />
          <Route path="/ClaimsList" element={<ClaimsList />} />
          <Route path="/ClaimsManage" element={<ClaimsManage />} />
          <Route path="/ManageNotifications" element={<ManageNotifications />} />

          <Route path="/ClaimsReport" element={<ClaimsReport />} />
          <Route path="/UsageReport" element={<UsageReport />} />
          <Route path="/PoliciesReport" element={<PoliciesReport />} />
          <Route path="/ProvidersReport" element={<ProvidersReport />} />
          <Route path="/MembersActivityReport" element={<MembersActivityReport />} />
          <Route path="/FinancialReport" element={<FinancialReport />} />
          <Route path="/PendingEmergencyRequests" element={<PendingEmergencyRequests />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/EmergencyDashboard" element={<EmergencyDashboard />} />
          <Route path="/EmergencyProfile" element={<EmergencyProfile />} />
          <Route path="/EmergencyNotifications" element={<EmergencyNotifications />} />
        </Route>

        {/* الصفحات المحمية (Client, Doctor, Pharmacist, Lab) */}
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
    </>
  );
}

export default App;
