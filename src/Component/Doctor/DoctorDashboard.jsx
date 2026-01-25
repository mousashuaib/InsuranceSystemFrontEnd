import React, { useState, useEffect, useCallback } from "react";
import { api, getToken, clearAuthData } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { ROLES } from "../../config/roles";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import logger from "../../utils/logger";

import NotificationsList from "../Notification/NotificationsList";
import AddSearchProfileDoctor from "./AddSearchProfile";
import DoctorCreateCenter from "./DoctorCreateCenter";
import UnifiedCreateRequest from "./UnifiedCreateRequest";
import DoctorHeader from "./DoctorHeader";

import HealthcareProviderMyClaims from "../Shared/HealthcareProviderMyClaims";
import ConsultationPrices from "../Shared/ConsultationPrices";

import Profile from "../Profile/DoctorProfile";
import DoctorSidebar from "./DoctorSidebar";
import LogoutDialog from "../Auth/LogoutDialog";

import {
  Box,
  Grid,
  Paper,
  Typography,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MyProfile from "./MyProfile";

const DoctorDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const _isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const token = getToken();
  const { language, isRTL } = useLanguage();

  const [activeView, setActiveView] = useState(
    localStorage.getItem("doctorActiveView") || "dashboard"
  );

  useEffect(() => {
    localStorage.setItem("doctorActiveView", activeView);
  }, [activeView]);

  const [userInfo, setUserInfo] = useState(() => {
    try {
      const stored = localStorage.getItem("doctorUserInfo");
      if (stored && stored !== "undefined") {
        return JSON.parse(stored);
      }
    } catch {
      // Invalid JSON in localStorage
    }
    return {
      fullName: "Doctor",
      roles: ["DOCTOR"],
      status: "ACTIVE",
    };
  });

  const getImagePathFromUserData = (userData) => {
    if (!userData) return null;
    if (userData.universityCardImage) {
      return userData.universityCardImage;
    }
    if (userData.universityCardImages && userData.universityCardImages.length > 0) {
      return userData.universityCardImages[userData.universityCardImages.length - 1];
    }
    return null;
  };

  const getInitialProfileImage = () => {
    let savedUserInfo = {};
    try {
      const stored = localStorage.getItem("doctorUserInfo");
      if (stored && stored !== "undefined") {
        savedUserInfo = JSON.parse(stored);
      }
    } catch {
      // Invalid JSON
    }
    const imgPath = getImagePathFromUserData(savedUserInfo);
    if (imgPath) {
      const fullPath = imgPath.startsWith("http")
        ? imgPath
        : `${API_BASE_URL}${imgPath}`;
      return `${fullPath}?t=${Date.now()}`;
    }
    return localStorage.getItem("doctorProfileImage") || null;
  };
  
  const [profileImage, setProfileImage] = useState(getInitialProfileImage());

  const getInitialStats = () => {
    try {
      const saved = localStorage.getItem("doctorStats");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.prescriptions !== undefined && parsed.total === undefined) {
          return {
            total: parsed.prescriptions || 0,
            pending: parsed.pending || 0,
            verified: parsed.verified || 0,
            rejected: parsed.rejected || 0,
            labRequests: parsed.labRequests || 0,
            radiologyRequests: parsed.radiologyRequests || 0,
          };
        }
        return {
          total: Number(parsed.total) || 0,
          pending: Number(parsed.pending) || 0,
          verified: Number(parsed.verified) || 0,
          rejected: Number(parsed.rejected) || 0,
          labRequests: Number(parsed.labRequests) || 0,
          radiologyRequests: Number(parsed.radiologyRequests) || 0,
        };
      }
    } catch {
      // Invalid JSON in localStorage, return defaults
    }

    return {
      total: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
      labRequests: 0,
      radiologyRequests: 0,
    };
  };

  const [stats, setStats] = useState(getInitialStats());

  const [unreadCount, setUnreadCount] = useState(
    Number(localStorage.getItem("doctorUnreadCount")) || 0
  );

  const [openLogout, setOpenLogout] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.AUTH.ME);
      // api.get() returns response.data directly, so use res directly
      setUserInfo(res);
      localStorage.setItem("doctorUserInfo", JSON.stringify(res));

      const imgPath = getImagePathFromUserData(res);
      if (imgPath) {
        const fullPath = imgPath.startsWith("http")
          ? imgPath
          : `${API_BASE_URL}${imgPath}`;
        const withTimestamp = `${fullPath}?t=${Date.now()}`;
        setProfileImage(withTimestamp);
        localStorage.setItem("doctorProfileImage", withTimestamp);
      } else {
        setProfileImage(null);
        localStorage.removeItem("doctorProfileImage");
      }
    } catch (err) {
      logger.error("Error fetching user:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to load user information";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      // api.get() returns response.data directly, so use res directly
      const count = typeof res === 'number' ? res : parseInt(res) || 0;
      setUnreadCount(count);
      localStorage.setItem("doctorUnreadCount", count);
    } catch (err) {
      logger.error("Error fetching unread count:", err);
      // Silently fail for notification count - not critical enough to show error to user
    }
  }, []);

  const fetchUnreadCount = refreshUnreadCount;

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.MEDICAL_RECORDS.STATS);
      // api.get() returns response.data directly, so use res directly
      if (res && typeof res === 'object') {
        setStats(prev => ({
          ...prev,
          total: res.total ?? res.prescriptions ?? prev?.total ?? 0,
          pending: res.pending ?? prev?.pending ?? 0,
          verified: res.verified ?? prev?.verified ?? 0,
          rejected: res.rejected ?? prev?.rejected ?? 0,
          labRequests: res.labRequests ?? prev?.labRequests ?? 0,
          radiologyRequests: res.radiologyRequests ?? prev?.radiologyRequests ?? 0,
        }));
        localStorage.setItem("doctorStats", JSON.stringify(res));
      }
    } catch (err) {
      logger.error("Error fetching stats:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to load dashboard statistics";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  }, []);

  const fetchRadiologyCount = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.RADIOLOGY_REQUESTS.MY);
      // api.get() returns response.data directly, so use res directly
      const count = Array.isArray(res) ? res.length : 0;
      setStats(prev => ({
        ...prev,
        radiologyRequests: count
      }));
    } catch (err) {
      logger.error("Error fetching radiology count:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to load radiology requests";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  }, []);

  const fetchLabCount = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.LAB_REQUESTS.MY);
      // api.get() returns response.data directly, so use res directly
      const count = Array.isArray(res) ? res.length : 0;
      setStats(prev => ({
        ...prev,
        labRequests: count
      }));
    } catch (err) {
      logger.error("Error fetching lab count:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to load lab requests";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  }, []);

  const fetchAll = async () => {
    // Run all API calls in parallel for better performance
    await Promise.all([
      fetchUser(),
      fetchUnreadCount(),
      fetchStats(),
      fetchRadiologyCount(),
      fetchLabCount(),
    ]);
  };

  useEffect(() => {
    const imagePath = getImagePathFromUserData(userInfo);

    if (imagePath) {
      const imgPath = imagePath.startsWith("http")
        ? imagePath
        : `${API_BASE_URL}${imagePath}`;
      const cleanPath = imgPath.split('?')[0];
      const withTimestamp = `${cleanPath}?t=${new Date().getTime()}`;
      setProfileImage(withTimestamp);
      localStorage.setItem("doctorProfileImage", withTimestamp);
    } else {
      setProfileImage(null);
    }
  }, [userInfo]);

  useEffect(() => {
    if (!token) return;
    fetchAll();
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

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
      <DoctorSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#FAF8F5",
          height: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "70px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "70px", md: "240px" } : 0,
          transition: "margin 0.3s ease",
          pt: { xs: "56px", sm: 0 },
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#7B8B5E",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#556B2F",
          },
        }}
      >
        <DoctorHeader
          userInfo={userInfo}
          profileImage={profileImage}
          unreadCount={unreadCount}
          onNotificationsClick={() => setActiveView("notifications")}
          onProfileClick={() => setActiveView("profile")}
          onLogoClick={() => setActiveView("dashboard")}
          onLogoutClick={() => setOpenLogout(true)}
        />

        {activeView === "dashboard" && (
          <Box sx={{ px: { xs: 2, md: 4 }, py: 4, minHeight: "100vh", background: "linear-gradient(to bottom, #FAF8F5 0%, #ffffff 100%)" }}>
                  <Paper
              elevation={0}
                    sx={{
                p: { xs: 3, md: 5 },
                mb: 4,
                borderRadius: 4,
                background: "linear-gradient(135deg, #556B2F 0%, #7B8B5E 50%, #8B9A46 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "200px",
                  height: "200px",
                  background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                  borderRadius: "50%",
                },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 2, md: 3 }, position: "relative", zIndex: 1 }}>
                <Box
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    p: { xs: 1.5, md: 2 },
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LocalHospitalIcon sx={{ fontSize: { xs: 40, md: 56 }, color: "white" }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                      fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2.125rem" },
                      textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      wordBreak: "break-word",
                    }}
                  >
                    {t("welcomeBackDr", language)} {userInfo?.fullName || t("doctor", language)}!
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "inherit",
                      opacity: 0.95,
                      fontSize: { xs: "0.95rem", md: "1.1rem" },
                      mt: 1,
                    }}
                  >
                    {t("overviewMedicalRecords", language)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                bgcolor: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    bgcolor: "#556B2F",
                    borderRadius: "50%",
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AssignmentIcon sx={{ color: "white", fontSize: 28 }} />
            </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: "#2E3B2D" }}
                >
                  {t("quickActions", language)}
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    onClick={() => setActiveView("unified-create-request")}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "2px solid #E8EBE0",
                      bgcolor: "#F5F7F0",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(85, 107, 47, 0.1), transparent)",
                        transition: "left 0.5s ease",
                      },
                      "&:hover": {
                        borderColor: "#556B2F",
                        bgcolor: "#E8EBE0",
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(85, 107, 47, 0.15)",
                        "&::before": {
                          left: "100%",
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          bgcolor: "#556B2F",
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LocalHospitalIcon sx={{ color: "white", fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#2E3B2D", mb: 0.5 }}>
                          {t("createRequest", language)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#5d6b5d" }}>
                          {t("createPrescriptionOrRequest", language)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    onClick={() => setActiveView("doctor-searchprofile-add")}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "2px solid #E8EBE0",
                      bgcolor: "#F5F7F0",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(85, 107, 47, 0.1), transparent)",
                        transition: "left 0.5s ease",
                      },
                      "&:hover": {
                        borderColor: "#556B2F",
                        bgcolor: "#E8EBE0",
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(85, 107, 47, 0.15)",
                        "&::before": {
                          left: "100%",
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          bgcolor: "#556B2F",
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PersonAddIcon sx={{ color: "white", fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#2E3B2D", mb: 0.5 }}>
                          {t("addProfile", language)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#5d6b5d" }}>
                          {t("registerYourProfile", language)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    onClick={() => setActiveView("my-claims")}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "2px solid #E8EBE0",
                      bgcolor: "#F5F7F0",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(85, 107, 47, 0.1), transparent)",
                        transition: "left 0.5s ease",
                      },
                      "&:hover": {
                        borderColor: "#556B2F",
                        bgcolor: "#E8EBE0",
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(85, 107, 47, 0.15)",
                        "&::before": {
                          left: "100%",
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          bgcolor: "#556B2F",
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BarChartIcon sx={{ color: "white", fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#2E3B2D", mb: 0.5 }}>
                          {t("myClaims", language)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#5d6b5d" }}>
                          {t("viewSubmittedClaims", language)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {activeView === "doctor-searchprofile-my" && <MyProfile />}
        {activeView === "profile" && (
          <Profile userInfo={userInfo} setUser={setUserInfo} refresh={fetchAll} />
        )}
        {activeView === "notifications" && <NotificationsList refresh={fetchUnreadCount} />}
        {activeView === "doctor-searchprofile-add" && (
          <AddSearchProfileDoctor refresh={fetchAll} />
        )}
        {activeView === "create-center" && (
          <DoctorCreateCenter refresh={fetchAll} />
        )}
        {activeView === "unified-create-request" && (
          <UnifiedCreateRequest refresh={fetchAll} />
        )}
        {activeView === "my-claims" && (
          <HealthcareProviderMyClaims userRole={ROLES.DOCTOR} />
        )}
        {activeView === "consultation-prices" && <ConsultationPrices />}
      </Box>

      <LogoutDialog
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        onConfirm={() => {
          clearAuthData();
          window.location.href = "/LandingPage";
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DoctorDashboard;