// src/Component/Client/ClientDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api, getToken, clearAuthData } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { ROLES } from "../../config/roles";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import logger from "../../utils/logger";

// Sidebar
import ClientSidebar from "./ClientSidebar";
import ClientHeader from "./ClientHeader";

// Client Components
import MyPrescriptions from "./MyPrescriptions";
import MyLabRequests from "./MyLabRequests";
import MyRadiologyRequests from "./MyRadiologyRequests";
import AddClaim from "./AddClaim";
import ConsultationPrices from "../Shared/ConsultationPrices";

// Shared Components
import HealthcareProviderMyClaims from "../Shared/HealthcareProviderMyClaims";
import HealthcareProvidersFilter from "../Shared/HealthcareProvidersFilter";
import HealthcareProvidersMapOnly from "../Shared/HealthcareProvidersMapOnly";

// Notifications
import NotificationsList from "../Notification/NotificationsList";

// Shared
import Profile from "../Profile/Profile";
import LogoutDialog from "../Auth/LogoutDialog";

// ✅ MUI
import {
  Typography,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Grid,
  Paper,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MedicationIcon from "@mui/icons-material/Medication";
import ScienceIcon from "@mui/icons-material/Science";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import ImageIcon from "@mui/icons-material/Image";

const ClientDashboard = () => {
  const token = getToken();
  const { language, isRTL } = useLanguage();

  // Active View
  const [activeView, setActiveView] = useState(
    localStorage.getItem("clientActiveView") || "dashboard"
  );
  useEffect(() => {
    localStorage.setItem("clientActiveView", activeView);
  }, [activeView]);

  // User Info
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("clientUser");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return { fullName: "Client", roles: [ROLES.INSURANCE_CLIENT], status: "ACTIVE" };
      }
    }
    return { fullName: "Client", roles: [ROLES.INSURANCE_CLIENT], status: "ACTIVE" };
  });
  const [profileImage, setProfileImage] = useState(null);


  // ✅ Data
  const [prescriptions, setPrescriptions] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [radiologyRequests, setRadiologyRequests] = useState(
    JSON.parse(localStorage.getItem("clientRadiologyRequests")) || []
  );
  const [claims, setClaims] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Healthcare Providers
  const [providers, setProviders] = useState([]);
  const [providerFilter, setProviderFilter] = useState("ALL");

  // Header State
  const [openLogout, setOpenLogout] = useState(false);

  // Fast refresh for notification counter only
  const refreshUnreadCount = useCallback(async () => {
    try {
      // api.get returns response.data directly
      const notifData = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const count = typeof notifData === 'number' ? notifData : parseInt(notifData) || 0;
      setUnreadCount(count);
    } catch (err) {
      logger.error("Error fetching unread count:", err);
      setUnreadCount(0);
    }
  }, []);

  // Fetch Healthcare Providers
  const fetchProviders = useCallback(async () => {
    try {
      // api.get returns response.data directly
      const providersData = await api.get(API_ENDPOINTS.SEARCH_PROFILES.APPROVED);
      const withLocations = (providersData || []).filter(
        (p) => p.locationLat && p.locationLng
      );
      setProviders(withLocations);
    } catch (err) {
      logger.error("Failed to fetch providers:", err);
    }
  }, []);

  // Fetch All Data
  const fetchData = useCallback(async () => {
    try {
      // api.get returns response.data directly
      const userData = await api.get(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
      localStorage.setItem("clientUser", JSON.stringify(userData));

      const imgs = userData?.universityCardImages || [];
      const lastImg = imgs[imgs.length - 1];

      if (lastImg) {
        setProfileImage(`${API_BASE_URL}${lastImg}?t=${Date.now()}`);
      } else {
        setProfileImage(null);
      }

      const prescriptionsData = await api.get(API_ENDPOINTS.PRESCRIPTIONS.GET);
      setPrescriptions(prescriptionsData || []);

      const labsData = await api.get(API_ENDPOINTS.LABS.GET_BY_MEMBER);
      setLabRequests(labsData || []);

      const radiologyData = await api.get(API_ENDPOINTS.RADIOLOGY.GET_BY_MEMBER);
      setRadiologyRequests(radiologyData || []);
      localStorage.setItem("clientRadiologyRequests", JSON.stringify(radiologyData || []));

      const claimsData = await api.get(API_ENDPOINTS.HEALTHCARE_CLAIMS.MY_CLAIMS);
      setClaims(claimsData || []);

      const unreadData = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      setUnreadCount(unreadData || 0);
    } catch (err) {
      logger.error("Error fetching client data:", err);

      if (err.response?.status === 401) {
        clearAuthData();
        window.location.href = "/LandingPage";
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchData();
    fetchProviders();
  }, [token]);

  // ✅ Poll for unread notifications every 5 seconds
  useEffect(() => {
    if (!token) return;
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Memoized stats to prevent unnecessary re-renders
  const stats = useMemo(() => [
    {
      id: 1,
      title: t("prescriptions", language),
      value: prescriptions.length,
      icon: <MedicationIcon />,
      color: "linear-gradient(135deg, #556B2F 0%, #7B8B5E 100%)",
    },
    {
      id: 2,
      title: t("labRequests", language),
      value: labRequests.length,
      icon: <ScienceIcon />,
      color: "linear-gradient(135deg, #8B9A46 0%, #A8B56B 100%)",
    },
    {
      id: 3,
      title: t("radiologyRequests", language),
      value: radiologyRequests.length,
      icon: <ImageIcon />,
      color: "linear-gradient(135deg, #6B7A32 0%, #8B9A46 100%)",
    },
    {
      id: 4,
      title: t("claims", language),
      value: claims.length,
      icon: <AssignmentIcon />,
      color: "linear-gradient(135deg, #C9A646 0%, #DDB85C 100%)",
    },
    {
      id: 5,
      title: t("total", language),
      value:
        prescriptions.length +
        labRequests.length +
        radiologyRequests.length +
        claims.length,
      icon: <BarChartIcon />,
      color: "linear-gradient(135deg, #556B2F 0%, #7B8B5E 100%)",
    },
  ], [prescriptions.length, labRequests.length, radiologyRequests.length, claims.length, language]);

  // Memoized filtered providers to prevent recalculation on every render
  const filteredProviders = useMemo(() => {
    return providerFilter === "ALL"
      ? providers
      : providers.filter(p => p.type === providerFilter);
  }, [providers, providerFilter]);

  return (
    <Box
      dir={isRTL ? "rtl" : "ltr"}
      sx={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#FAF8F5",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <ClientSidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#FAF8F5",
          height: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          transition: "margin 0.3s ease",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#555",
          },
        }}
      >
        {/* Header */}
        <ClientHeader
          userInfo={user}
          profileImage={profileImage}
          unreadCount={unreadCount}
          onNotificationsClick={() => setActiveView("notifications")}
          onProfileClick={() => setActiveView("profile")}
          onLogoClick={() => setActiveView("dashboard")}
          onLogoutClick={() => setOpenLogout(true)}
        />

        {/* باقي الكود: Dashboard + Stats + باقي الصفحات */}
        {activeView === "dashboard" && (
          <>
            {/* 1️⃣ Filter Buttons (فوق) */}
            <Box sx={{ mt: 3, px: 2 }}>
              <HealthcareProvidersFilter 
                providers={providers}
                providerFilter={providerFilter}
                setProviderFilter={setProviderFilter}
              />
            </Box>

            {/* 2️⃣ Stats Cards (في النص) */}
            <Grid container spacing={4} justifyContent="center" sx={{ px: 4 }}>
              {stats.map((stat) => (
                <Grid item xs={12} sm={6} md={2.4} key={stat.id}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      background: stat.color,
                      color: "#fff",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                      minHeight: "140px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      "&:hover": { transform: "scale(1.05)" },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                      {React.cloneElement(stat.icon, { sx: { fontSize: 40 } })}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* 3️⃣ Map (تحت) */}
            <Box sx={{ mt: 4 }}>
              <HealthcareProvidersMapOnly
                filteredProviders={filteredProviders}
              />
            </Box>
          </>
        )}

        {/* باقي الصفحات */}
        {activeView === "prescriptions" && (
          <MyPrescriptions prescriptions={prescriptions} />
        )}
        {activeView === "lab" && <MyLabRequests labRequests={labRequests} />}
        {activeView === "radiology" && <MyRadiologyRequests />}
        {activeView === "claims" && (
          <HealthcareProviderMyClaims userRole={ROLES.INSURANCE_CLIENT} />
        )}
        {activeView === "add-claims" && (
          <AddClaim
            onAdded={(newClaim) => {
              setClaims((prev) => [...prev, newClaim]);
              fetchData();
            }}
          />
        )}
        {activeView === "profile" && <Profile userInfo={user} setUser={setUser} />}
        {activeView === "notifications" && (
          <NotificationsList refresh={refreshUnreadCount} />
        )}
        {activeView === "consultation-prices" && <ConsultationPrices />}
      </Box>

      {/* Logout */}
      <LogoutDialog
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        onConfirm={() => {
          clearAuthData();
          window.location.href = "/LandingPage";
        }}
      />
    </Box>
  );
};

export default ClientDashboard;