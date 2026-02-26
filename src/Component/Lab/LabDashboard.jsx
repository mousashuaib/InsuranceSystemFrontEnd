// src/Component/Lab/LabDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { api, getToken, clearAuthData } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { ROLES } from "../../config/roles";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import logger from "../../utils/logger";

import LabSidebar from "./LabSidebar";
import LabHeader from "./LabHeader";
import LabRequestList from "./LabRequestList";
import LabProfile from "../Profile/LabProfile";
import NotificationsList from "../Notification/NotificationsList";
import LogoutDialog from "../Auth/LogoutDialog";
import HealthcareProviderMyClaims from "../Shared/HealthcareProviderMyClaims";
import FinancialReport from "../Doctor/FinancialReport";

import {
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScienceIcon from "@mui/icons-material/Science";

const LabDashboard = () => {
  const token = getToken();
  const { language, isRTL } = useLanguage();

  // ✅ Safe JSON parse helper to handle corrupted localStorage
  const safeJsonParse = (str, fallback) => {
    try {
      if (!str || str === "undefined" || str === "null") return fallback;
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  // Active view
  const [activeView, setActiveView] = useState(
    localStorage.getItem("labActiveView") || "dashboard"
  );
  useEffect(() => {
    localStorage.setItem("labActiveView", activeView);
  }, [activeView]);

  // User
  const [userInfo, setUserInfo] = useState(() => {
    return safeJsonParse(localStorage.getItem("labUserInfo"), {
      fullName: "Lab Tech",
      roles: ["LAB_TECH"],
      status: "ACTIVE",
    });
  });
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("labProfileImage") || null
  );

  // ✅ Stats
  const [stats, setStats] = useState(() => {
    return safeJsonParse(localStorage.getItem("labStats"), {
      pending: 0,
      completed: 0,
      total: 0,
    });
  });

  const [requests, setRequests] = useState(() => {
    return safeJsonParse(localStorage.getItem("labRequests"), []);
  });

  // ✅ Notifications
  const [unreadCount, setUnreadCount] = useState(
    Number(localStorage.getItem("labUnreadCount")) || 0
  );

  // ✅ Header Menu State
  const [openLogout, setOpenLogout] = useState(false);
  
  // Store claim data for document submission
  const [currentLabClaimData, setCurrentLabClaimData] = useState(null);
  
  // Refresh key for My Claims component
  const [claimsRefreshKey, setClaimsRefreshKey] = useState(0);

  // ✅ Fast refresh for notification counter only
  const refreshUnreadCount = useCallback(async () => {
    try {
      // api.get() returns data directly, not wrapped in .data
      const notifData = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const count = typeof notifData === 'number' ? notifData : parseInt(notifData) || 0;
      setUnreadCount(count);
      localStorage.setItem("labUnreadCount", count);
    } catch (err) {
      logger.error("Error fetching unread count:", err);
    }
  }, []);

  // ✅ Fetch Data
  const fetchData = useCallback(async () => {
    try {
      // User - api.get() returns data directly, not wrapped in .data
      const userData = await api.get(API_ENDPOINTS.AUTH.ME);
      if (userData) {
        setUserInfo(userData);
        localStorage.setItem("labUserInfo", JSON.stringify(userData));

        // Handle both single image and array format
        let imgPath = userData.universityCardImage || "";
        if (!imgPath && userData.universityCardImages && userData.universityCardImages.length > 0) {
          imgPath = userData.universityCardImages[userData.universityCardImages.length - 1];
        }

        if (imgPath) {
          const fullPath = imgPath.startsWith("http")
            ? imgPath
            : `${API_BASE_URL}${imgPath}`;
          const withTimestamp = `${fullPath}?t=${Date.now()}`;
          setProfileImage(withTimestamp);
          localStorage.setItem("labProfileImage", withTimestamp);
        } else {
          setProfileImage(null);
        }
      }

      // Requests - جلب الطلبات المعلقة أولاً
      let uniqueRequests = [];
      try {
        // api.get() returns data directly
        const pendingData = await api.get("/api/labs/pending");
        const pendingList = Array.isArray(pendingData) ? pendingData : [];

        // ثم الطلبات الخاصة به
        const myData = await api.get("/api/labs/my-requests");
        const myList = Array.isArray(myData) ? myData : myData?.content || myData?.results || [];

        // دمج الطلبات (الطلبات المعلقة + طلباته الخاصة)
        const allRequests = [...pendingList, ...myList];

        // حذف التكرار
        uniqueRequests = Array.from(
          new Map(allRequests.map(item => [item.id, item])).values()
        );

        setRequests(uniqueRequests);
        localStorage.setItem("labRequests", JSON.stringify(uniqueRequests));

        // Stats - Calculate from actual requests data
        // Pending: All pending requests (available for this lab tech)
        const pendingCount = pendingList.length;
        // Completed: Only completed requests from my requests
        const completedCount = myList.filter(
          (r) => r.status?.toLowerCase() === "completed"
        ).length;
        // Total: All requests (pending + my requests, without duplicates)
        const totalCount = uniqueRequests.length;

        const calculatedStats = {
          pending: pendingCount,
          completed: completedCount,
          total: totalCount,
        };

        setStats(calculatedStats);
        localStorage.setItem("labStats", JSON.stringify(calculatedStats));
      } catch (err) {
        logger.error("Error fetching requests:", err);
        setRequests([]);
        setStats({ pending: 0, completed: 0, total: 0 });
      }

      // Notifications - api.get() returns data directly
      const notifData = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const count = typeof notifData === 'number' ? notifData : parseInt(notifData) || 0;
      setUnreadCount(count);
      localStorage.setItem("labUnreadCount", count);
    } catch (err) {
      logger.error("Error fetching data:", err);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  // ✅ Periodic refresh of unread notification count (every 5 seconds for fast updates)
  useEffect(() => {
    if (!token) return;
    refreshUnreadCount();
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 5000); // 5 seconds for fast notification updates
    return () => clearInterval(interval);
  }, [token]);

  // ✅ Submit Lab Claim with Document
  const handleLabSubmitClaim = async (document, claimDataParam) => {
   
    
    // ✅ تحديد claimData للاستخدام - الأولوية: claimDataParam > currentLabClaimData > window.labClaimData
    let claimDataToUse = null;
    
    // 1. استخدام claimDataParam إذا موجود وصحيح (الأولوية الأولى)
    if (claimDataParam && typeof claimDataParam === 'object' && claimDataParam !== null && claimDataParam.clientId) {
     
      claimDataToUse = claimDataParam;
    }
    // 2. استخدام currentLabClaimData (state) إذا كان موجوداً
    else if (currentLabClaimData && typeof currentLabClaimData === 'object' && currentLabClaimData !== null && currentLabClaimData.clientId) {
     
      claimDataToUse = currentLabClaimData;
    }
    // 3. استخدام window.labClaimData كـ fallback
    else if (typeof window !== 'undefined' && window.labClaimData && typeof window.labClaimData === 'object' && window.labClaimData.clientId) {
    
      claimDataToUse = window.labClaimData;
    }
    
    // ✅ التحقق من وجود claimData صالح قبل المتابعة
    if (!claimDataToUse || !claimDataToUse.clientId) {
      const errorMsg = "Claim data not available. clientId is missing. Please upload the result again.";
      logger.error(errorMsg);
      logger.error("Available data sources:", {
        claimDataParam: claimDataParam ? { clientId: claimDataParam.clientId } : null,
        currentLabClaimData: currentLabClaimData ? { clientId: currentLabClaimData.clientId } : null,
        windowLabClaimData: typeof window !== 'undefined' && window.labClaimData ? { clientId: window.labClaimData.clientId } : null
      });
      throw new Error(errorMsg);
    }

    logger.log("Using claim data:", {
      clientId: claimDataToUse.clientId,
      amount: claimDataToUse.amount,
      description: claimDataToUse.description
    });

    const formData = new FormData();
    formData.append("data", JSON.stringify(claimDataToUse));
    
    if (document) {
      formData.append("document", document);
    
    } else {
      // No document to upload
    }

    try {
      // api.post() returns data directly
      const claimResult = await api.post(
        API_ENDPOINTS.HEALTHCARE_CLAIMS.SUBMIT,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );



      // ✅ تنظيف currentLabClaimData بعد النجاح
      setCurrentLabClaimData(null);

      if (typeof window !== 'undefined') {
        if (window.labClaimData) {
          delete window.labClaimData;
        }
        if (window.labClaimDataMap) {
          window.labClaimDataMap = {};
        }
      }

      // Refresh My Claims component
      setClaimsRefreshKey(prev => prev + 1);

      return claimResult;
    } catch (error) {
      logger.error("Error submitting claim:", error);
      logger.error("Error response data:", error.response?.data);

      // تنظيف currentLabClaimData بعد الفشل
      setCurrentLabClaimData(null);
      
      if (typeof window !== 'undefined') {
        if (window.labClaimData) {
          delete window.labClaimData;
        }
      }
      
      throw error;
    }
  };

  // ✅ Helper icon by type
  const _getTypeIcon = (type) => {
    switch (type) {
      case "LAB":
        return <ScienceIcon sx={{ fontSize: 40, color: "#1976d2" }} />;
      case "RECORD":
        return <AssignmentIcon sx={{ fontSize: 40, color: "#6a1b9a" }} />;
      default:
        return <SearchIcon sx={{ fontSize: 40, color: "#555" }} />;
    }
  };

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
      <LabSidebar activeView={activeView} setActiveView={setActiveView} />

      <Box
        component="main"
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#FAF8F5",
          height: "100vh",
          marginLeft: isRTL ? 0 : "240px",
          marginRight: isRTL ? "240px" : 0,
          transition: "margin 0.3s ease",
          "@media (max-width: 600px)": {
            marginLeft: isRTL ? 0 : "75px",
            marginRight: isRTL ? "75px" : 0,
          },
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
        <LabHeader
          userInfo={userInfo}
          profileImage={profileImage}
          unreadCount={unreadCount}
          onNotificationsClick={() => setActiveView("notifications")}
          onProfileClick={() => setActiveView("profile")}
          onLogoClick={() => setActiveView("dashboard")}
          onLogoutClick={() => setOpenLogout(true)}
        />

        {/* Dashboard */}
        {activeView === "dashboard" && (
          <Box sx={{ px: { xs: 2, md: 4 }, py: 4, minHeight: "100vh", background: "linear-gradient(to bottom, #FAF8F5 0%, #ffffff 100%)" }}>
            {/* Welcome Section - Enhanced */}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, position: "relative", zIndex: 1 }}>
                <Box
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ScienceIcon sx={{ fontSize: { xs: 40, md: 56 }, color: "white" }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                      fontSize: { xs: "1.75rem", md: "2.125rem" },
                      textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {t("welcome", language)}, {userInfo?.fullName || t("labTechnician", language)}!
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
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

            {/* Stats Cards - Enhanced */}
            <Grid container spacing={3} sx={{ mb: 5 }} justifyContent="center">
              {/* Pending Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(255, 152, 0, 0.3), 0 8px 30px rgba(255, 152, 0, 0.2)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "-50%",
                      right: "-50%",
                      width: "200%",
                      height: "200%",
                      background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                      transition: "all 0.4s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-12px) scale(1.02)",
                      boxShadow: "0 8px 30px rgba(255, 152, 0, 0.4), 0 12px 40px rgba(255, 152, 0, 0.3)",
                      "&::before": {
                        transform: "rotate(45deg)",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 2,
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                      borderRadius: "50%",
                      width: { xs: 70, md: 90 },
                      height: { xs: 70, md: 90 },
                      mx: "auto",
                      alignItems: "center",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    }}
                  >
                    <HourglassEmptyIcon sx={{ fontSize: { xs: 35, md: 50 } }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: { xs: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("pending", language)} {t("labRequests", language)}
                  </Typography>
                  <Typography 
                    variant="h2" 
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "2rem", md: "3rem" },
                      textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {stats.pending || 0}
                  </Typography>
                </Paper>
              </Grid>

              {/* Completed Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(76, 175, 80, 0.3), 0 8px 30px rgba(76, 175, 80, 0.2)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "-50%",
                      right: "-50%",
                      width: "200%",
                      height: "200%",
                      background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                      transition: "all 0.4s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-12px) scale(1.02)",
                      boxShadow: "0 8px 30px rgba(76, 175, 80, 0.4), 0 12px 40px rgba(76, 175, 80, 0.3)",
                      "&::before": {
                        transform: "rotate(45deg)",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 2,
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                      borderRadius: "50%",
                      width: { xs: 70, md: 90 },
                      height: { xs: 70, md: 90 },
                      mx: "auto",
                      alignItems: "center",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: { xs: 35, md: 50 } }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: { xs: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("completed", language)} {t("labRequests", language)}
                  </Typography>
                  <Typography 
                    variant="h2" 
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "2rem", md: "3rem" },
                      textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {stats.completed || 0}
                  </Typography>
                </Paper>
              </Grid>

              {/* Total Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #556B2F 0%, #7B8B5E 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(85, 107, 47, 0.3), 0 8px 30px rgba(85, 107, 47, 0.2)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "-50%",
                      right: "-50%",
                      width: "200%",
                      height: "200%",
                      background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                      transition: "all 0.4s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-12px) scale(1.02)",
                      boxShadow: "0 8px 30px rgba(85, 107, 47, 0.4), 0 12px 40px rgba(85, 107, 47, 0.3)",
                      "&::before": {
                        transform: "rotate(45deg)",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 2,
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                      borderRadius: "50%",
                      width: { xs: 70, md: 90 },
                      height: { xs: 70, md: 90 },
                      mx: "auto",
                      alignItems: "center",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    }}
                  >
                    <BarChartIcon sx={{ fontSize: { xs: 35, md: 50 } }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: { xs: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("total", language)} {t("labRequests", language)}
                  </Typography>
                  <Typography 
                    variant="h2" 
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "2rem", md: "3rem" },
                      textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {stats.total || 0}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Quick Actions - Enhanced */}
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
                <Grid item xs={12} sm={6} md={4}>
                  <Box
                    onClick={() => setActiveView("requests")}
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
                        <AssignmentIcon sx={{ color: "white", fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#2E3B2D", mb: 0.5 }}>
                          {t("view", language)} {t("labRequests", language)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t("labRequestsList", language)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
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
                        <Typography variant="body2" color="text.secondary">
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

        {/* باقي الصفحات */}
        {activeView === "requests" && (
          <LabRequestList
            requests={requests}
            userInfo={userInfo}
            onSetClaimData={setCurrentLabClaimData}
            onSubmitClaim={handleLabSubmitClaim}
            onUploaded={(updatedReq) => {
              setRequests((prev) =>
                prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
              );
              fetchData();
            }}
          />
        )}
        {activeView === "notifications" && (
          <NotificationsList refresh={refreshUnreadCount} />
        )}
        {activeView === "my-claims" && (
          <HealthcareProviderMyClaims key={claimsRefreshKey} userRole={ROLES.LAB_TECH} />
        )}
        {activeView === "financial-report" && <FinancialReport />}

        {activeView === "profile" && (
          <LabProfile userInfo={userInfo} setUser={setUserInfo} refresh={fetchData} />
        )}
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

export default LabDashboard;
