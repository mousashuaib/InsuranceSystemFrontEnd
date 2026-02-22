import React, { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";

// Import ROLES constants for consistent role checking
import { ROLES } from "./config/roles";

// Loading fallback component
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      gap: 2,
    }}
  >
    <CircularProgress size={48} />
    <Typography color="text.secondary">Loading...</Typography>
  </Box>
);

// =====================================================
// LAZY LOADED COMPONENTS - Code Splitting for Performance
// Each role's components are bundled separately
// This reduces initial bundle size by 60-80%
// =====================================================

// Auth Components (loaded immediately - small bundle)
import LandingPage from "./Component/Auth/LandingPage";
import ResetPassword from "./Component/Auth/ResetPassword";
import PrivateRoute from "./PrivateRoute";

// Public Pages (loaded immediately)
import About from "./About";
import Help from "../src/Help";

// Manager Components (lazy loaded)
const ManagerDashboard = lazy(() => import("./Component/Manager/ManagerDashboard"));
const PolicyManagement = lazy(() => import("./Component/Manager/Policies/GlobalPolicy/PolicyManagement"));
const ManageNotifications = lazy(() => import("./Component/Manager/Notifications/ManageNotifications"));
const ClaimsReport = lazy(() => import("./Component/Manager/Reports/ClaimsReport"));
const FinancialReport = lazy(() => import("./Component/Manager/Reports/FinancialReport"));
const Profile = lazy(() => import("./Component/Manager/Profile"));
const PendingProviderRegistrations = lazy(() => import("./Component/Manager/PendingProviderRegistrations"));
const ManagerPendingRequests = lazy(() => import("./Component/Manager/Clients/PendingRequests"));
const AdminRegisterAccounts = lazy(() => import("./Component/Manager/Accounts/AdminRegisterAccounts"));
const ProviderPriceList = lazy(() => import("./Component/Manager/ProviderPriceList"));

// Manager Admin Functions Components (lazy loaded) - Uses Manager sidebar for admin functions
const ManagerMedicalClaimsReview = lazy(() => import("./Component/Manager/AdminFunctions/ManagerMedicalClaimsReview"));
const ManagerMedicalDecisionsList = lazy(() => import("./Component/Manager/AdminFunctions/ManagerMedicalDecisionsList"));
const ManagerClaimsManage = lazy(() => import("./Component/Manager/AdminFunctions/ManagerClaimsManage"));
const ManagerEmergencyRequests = lazy(() => import("./Component/Manager/AdminFunctions/ManagerEmergencyRequests"));

// Manager Data Import Components (lazy loaded)
const DataImport = lazy(() => import("./Component/Manager/DataImport/DataImport"));
const CoverageManagement = lazy(() => import("./Component/Manager/DataImport/CoverageManagement"));

// Manager Doctor Medicine Assignment (lazy loaded)
const DoctorMedicineAssignment = lazy(() => import("./Component/Manager/DoctorMedicines/DoctorMedicineAssignment"));

// Manager Doctor Test Assignment (lazy loaded)
const DoctorTestAssignment = lazy(() => import("./Component/Manager/DoctorTests/DoctorTestAssignment"));

// Manager Consultation Prices (lazy loaded)
const ManagerConsultationPrices = lazy(() => import("./Component/Manager/ManagerConsultationPrices"));

// Coordination Admin Components (lazy loaded)
const ClientList = lazy(() => import("./Component/CoordinationAdmin/Clients/ClientList"));
const CoordinationPendingRequests = lazy(() => import("./Component/CoordinationAdmin/Clients/PendingRequests"));
const ClaimsList = lazy(() => import("./Component/CoordinationAdmin/Claims/ClaimsList"));
const ClaimsManage = lazy(() => import("./Component/CoordinationAdmin/Claims/ClaimsManage"));
const CoordinationDashboard = lazy(() => import("./Component/CoordinationAdmin/CoordinationDashboard"));
const CoordinationHeader = lazy(() => import("./Component/CoordinationAdmin/CoordinationHeader"));
const CoordinationSidebar = lazy(() => import("./Component/CoordinationAdmin/CoordinationSidebar"));
const CoordinationProfile = lazy(() => import("./Component/CoordinationAdmin/CoordinationProfile"));
const CoordinationNotifications = lazy(() => import("./Component/CoordinationAdmin/CoordinationNotifications"));
const CoordinationLayout = lazy(() => import("./Component/CoordinationAdmin/CoordinationLayout"));
const CoordinatorAddClaim = lazy(() => import("./Component/CoordinationAdmin/CoordinatorAddClaim"));

// Medical Admin Components (lazy loaded)
const MedicalAdminDashboard = lazy(() => import("./Component/MedicalAdmin/MedicalAdminDashboard"));
const MedicalAdminProfile = lazy(() => import("./Component/MedicalAdmin/MedicalAdminProfile"));
const MedicalAdminNotifications = lazy(() => import("./Component/MedicalAdmin/MedicalAdminNotifications"));
const MedicalClaimsReview = lazy(() => import("./Component/MedicalAdmin/MedicalClaimsReview"));
const MedicalDecisionsList = lazy(() => import("./Component/MedicalAdmin/MedicalDecisionsList"));
const MedicalAdminEmergencyRequests = lazy(() => import("./Component/MedicalAdmin/MedicalAdminEmergencyRequests"));
const ChronicPatientsManagement = lazy(() => import("./Component/MedicalAdmin/ChronicPatientsManagement"));
const ClientListFinal = lazy(() => import("./Component/MedicalAdmin/Clients/ClientListFinal"));
const PendingRequestsClients = lazy(() => import("./Component/MedicalAdmin/Clients/PendingRequestsClients"));

// Client Components (lazy loaded)
const ClientDashboard = lazy(() => import("./Component/Client/ClientDashboard"));

// Doctor Components (lazy loaded)
const DoctorDashboard = lazy(() => import("./Component/Doctor/DoctorDashboard"));

// Pharmacist Components (lazy loaded)
const PharmacistDashboard = lazy(() => import("./Component/Pharmacist/PharmacistDashboard"));

// Lab Components (lazy loaded)
const LabDashboard = lazy(() => import("./Component/Lab/LabDashboard"));

// Radiology Components (lazy loaded)
const RadiologyDashboard = lazy(() => import("./Component/Radiology/RadiologyDashboard"));

// Chat Components (lazy loaded)
const UserChat = lazy(() => import("./Component/Chat/UserChat"));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Navigate to="/LandingPage" replace />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/About" element={<About />} />
        <Route path="/Help" element={<Help />} />
        <Route path="/Chat" element={<UserChat />} />


        {/* Manager Routes - Protected with INSURANCE_MANAGER role */}
        <Route
          path="/ManagerDashboard"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManagerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/PendingRequests"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManagerPendingRequests />
            </PrivateRoute>
          }
        />
        <Route
          path="/PolicyManagement"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <PolicyManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/PendingProviderRegistrations"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <PendingProviderRegistrations />
            </PrivateRoute>
          }
        />
        <Route
          path="/AdminRegisterAccounts"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <AdminRegisterAccounts />
            </PrivateRoute>
          }
        />
        <Route
          path="/ManageNotifications"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManageNotifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/ProviderPriceList"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ProviderPriceList />
            </PrivateRoute>
          }
        />
        <Route
          path="/ClaimsReport"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ClaimsReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/FinancialReport"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <FinancialReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/Profile"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Manager Admin Functions Routes - Uses Manager Sidebar */}
        <Route
          path="/Manager/MedicalClaimsReview"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManagerMedicalClaimsReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/Manager/MedicalDecisionsList"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManagerMedicalDecisionsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/Manager/ClaimsManage"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManagerClaimsManage />
            </PrivateRoute>
          }
        />
        <Route
          path="/Manager/EmergencyRequests"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManagerEmergencyRequests />
            </PrivateRoute>
          }
        />
        <Route
          path="/Manager/ConsultationPrices"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <ManagerConsultationPrices />
            </PrivateRoute>
          }
        />

        {/* Manager Data Import Routes */}
        <Route
          path="/Manager/DataImport"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <DataImport />
            </PrivateRoute>
          }
        />
        <Route
          path="/Manager/CoverageManagement"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <CoverageManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/Manager/DoctorMedicineAssignment"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <DoctorMedicineAssignment />
            </PrivateRoute>
          }
        />
        <Route
          path="/Manager/DoctorTestAssignment"
          element={
            <PrivateRoute role={ROLES.INSURANCE_MANAGER}>
              <DoctorTestAssignment />
            </PrivateRoute>
          }
        />

        {/* Medical Admin Routes - God mode access (INSURANCE_MANAGER + MEDICAL_ADMIN) */}
        <Route
          path="/MedicalAdminDashboard"
          element={
            <PrivateRoute roles={[ROLES.MEDICAL_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <MedicalAdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/MedicalClaimsReview"
          element={
            <PrivateRoute roles={[ROLES.MEDICAL_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <MedicalClaimsReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/MedicalDecisionsList"
          element={
            <PrivateRoute roles={[ROLES.MEDICAL_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <MedicalDecisionsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/PendingRequestsClients"
          element={
            <PrivateRoute roles={[ROLES.MEDICAL_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <PendingRequestsClients />
            </PrivateRoute>
          }
        />
        <Route
          path="/ClientListFinal"
          element={
            <PrivateRoute roles={[ROLES.MEDICAL_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <ClientListFinal />
            </PrivateRoute>
          }
        />

        {/* Coordination Admin Routes - God mode access (INSURANCE_MANAGER + COORDINATION_ADMIN) */}
        <Route
          path="/CoordinationDashboard"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <CoordinationDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/CoordinationProfile"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <CoordinationProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/CoordinationNotifications"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <CoordinationNotifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/CoordinationPendingRequests"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <CoordinationPendingRequests />
            </PrivateRoute>
          }
        />
        <Route
          path="/ClientList"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <ClientList />
            </PrivateRoute>
          }
        />
        <Route
          path="/ClaimsList"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <ClaimsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/ClaimsManage"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <ClaimsManage />
            </PrivateRoute>
          }
        />
        <Route
          path="/CoordinationSidebar"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <CoordinationSidebar />
            </PrivateRoute>
          }
        />
        <Route
          path="/CoordinationHeader"
          element={
            <PrivateRoute roles={[ROLES.COORDINATION_ADMIN, ROLES.INSURANCE_MANAGER]}>
              <CoordinationHeader />
            </PrivateRoute>
          }
        />

        {/* Protected Routes - Client, Doctor, Pharmacist, Lab, Radiologist */}
        <Route
          path="/ClientDashboard"
          element={
            <PrivateRoute role={ROLES.INSURANCE_CLIENT}>
              <ClientDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/DoctorDashboard"
          element={
            <PrivateRoute role={ROLES.DOCTOR}>
              <DoctorDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/PharmacistDashboard"
          element={
            <PrivateRoute role={ROLES.PHARMACIST}>
              <PharmacistDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/LabDashboard"
          element={
            <PrivateRoute role={ROLES.LAB_TECH}>
              <LabDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/RadiologyDashboard"
          element={
            <PrivateRoute role={ROLES.RADIOLOGIST}>
              <RadiologyDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/MedicalAdminProfile"
          element={
            <PrivateRoute role={ROLES.MEDICAL_ADMIN}>
              <MedicalAdminProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/AddClaim"
          element={
            <PrivateRoute roles={[ROLES.INSURANCE_CLIENT, ROLES.COORDINATION_ADMIN]}>
              <CoordinationLayout>
                <CoordinatorAddClaim />
              </CoordinationLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/MedicalAdminNotifications"
          element={
            <PrivateRoute role={ROLES.MEDICAL_ADMIN}>
              <MedicalAdminNotifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/MedicalAdminEmergencyRequests"
          element={
            <PrivateRoute role={ROLES.MEDICAL_ADMIN}>
              <MedicalAdminEmergencyRequests />
            </PrivateRoute>
          }
        />
        <Route
          path="/ChronicPatientsManagement"
          element={
            <PrivateRoute role={ROLES.MEDICAL_ADMIN}>
              <ChronicPatientsManagement />
            </PrivateRoute>
          }
        />

      </Routes>
    </Suspense>
  );
}

export default App;
