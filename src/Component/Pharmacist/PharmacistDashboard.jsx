// src/Component/Pharmacist/PharmacistDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { api, getToken, clearAuthData } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { ROLES } from "../../config/roles";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import logger from "../../utils/logger";

import PharmacistSidebar from "./PharmacistSidebar";
import PharmacistHeader from "./PharmacistHeader";
import PrescriptionList from "./PrescriptionList";
import PharmacistProfile from "../Profile/PharmacistProfile";
import NotificationsList from "../Notification/NotificationsList";
import LogoutDialog from "../Auth/LogoutDialog";
import AddSearchProfilePharmacist from "./AddSearchProfilePharmacist";
import HealthcareProviderMyClaims from "../Shared/HealthcareProviderMyClaims";
import ConsultationPrices from "../Shared/ConsultationPrices";
import FinancialReport from "../Doctor/FinancialReport";

import {
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";

const PharmacistDashboard = () => {
  const { language, isRTL } = useLanguage();
  const token = getToken();

  // Active view
  const [activeView, setActiveView] = useState(
    localStorage.getItem("pharmacistActiveView") || "dashboard"
  );
  useEffect(() => {
    localStorage.setItem("pharmacistActiveView", activeView);
  }, [activeView]);

  // Safe JSON parse helper
  const safeJsonParse = (str, fallback) => {
    try {
      if (!str || str === "undefined" || str === "null") return fallback;
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  // User
  const [user, setUser] = useState(() => {
    return safeJsonParse(localStorage.getItem("pharmacistUser"), {
      fullName: "Pharmacist",
      roles: ["PHARMACIST"],
      status: "ACTIVE",
    });
  });
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("pharmacistProfileImage") || null
  );

  // Data
  const [prescriptions, setPrescriptions] = useState(() => {
    return safeJsonParse(localStorage.getItem("pharmacistPrescriptions"), []);
  });
  const [stats, setStats] = useState(() => {
    return safeJsonParse(localStorage.getItem("pharmacistStats"), {
      pending: 0,
      verified: 0,
      rejected: 0,
      total: 0,
    });
  });
  const [unreadCount, setUnreadCount] = useState(
    Number(localStorage.getItem("pharmacistUnreadCount")) || 0
  );


  // Menu
  const [openLogout, setOpenLogout] = useState(false);

  // ✅ Fast refresh for notification counter only
  const refreshUnreadCount = useCallback(async () => {
    try {
      const notifRes = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      // api.get() returns data directly
      const count = typeof notifRes === 'number' ? notifRes : parseInt(notifRes) || 0;
      setUnreadCount(count);
      localStorage.setItem("pharmacistUnreadCount", count);
    } catch (err) {
      logger.error("Error fetching unread count:", err);
    }
  }, []);


  // ✅ Fetch data
  const fetchData = useCallback(async () => {
    try {
      // User - api.get() returns data directly
      const userData = await api.get(API_ENDPOINTS.AUTH.ME);
      if (userData) {
        setUser(userData);
        localStorage.setItem("pharmacistUser", JSON.stringify(userData));

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
          localStorage.setItem("pharmacistProfileImage", withTimestamp);
        } else {
          setProfileImage(null);
        }
      }

      // Stats ✅ - api.get() returns data directly
      const statsData = await api.get("/api/prescriptions/pharmacist/stats");
      if (statsData) {
        setStats(statsData);
        localStorage.setItem("pharmacistStats", JSON.stringify(statsData));
      }

      // Notifications - api.get() returns data directly
      const notifRes = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const count = typeof notifRes === 'number' ? notifRes : parseInt(notifRes) || 0;
      setUnreadCount(count);
      localStorage.setItem("pharmacistUnreadCount", count);
    } catch (err) {
      logger.error("Error fetching pharmacist data:", err);
    }
  }, []);

  // ✅ Fetch prescriptions based on activeView
  const fetchPrescriptions = useCallback(async () => {
    try {
      // جيب الوصفات المعلقة (PENDING) و كل الوصفات اللي تعامل معها
      // api.get() returns data directly
      const [pendingData, allData] = await Promise.all([
        api.get("/api/prescriptions/pending"),
        api.get("/api/prescriptions/all")
      ]);

      // دمج: المعلقة + اللي تعامل معها (verified/rejected/billed) - جميع الحالات
      const pendingPrescriptions = pendingData || [];
      const myPrescriptions = allData || []; // Include all prescriptions including BILLED

      // إزالة التكرار (في حال pending موجودة في all)
      const allUnique = myPrescriptions.filter(
        p => !pendingPrescriptions.some(pending => pending.id === p.id)
      );

      const combined = [...pendingPrescriptions, ...allUnique];

      setPrescriptions(combined);
      localStorage.setItem(
        "pharmacistPrescriptions",
        JSON.stringify(combined)
      );
    } catch (err) {
      logger.error("Error fetching prescriptions:", err);
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

  // ✅ Fetch prescriptions when activeView changes
  useEffect(() => {
    if (!token) return;
    fetchPrescriptions();
  }, [activeView, token]);

  // ✅ تحديث الصورة عند أي تغيير في user
  useEffect(() => {
    // Handle both single image and array format
    let imagePath = user?.universityCardImage || "";
    if (!imagePath && user?.universityCardImages && user.universityCardImages.length > 0) {
      imagePath = user.universityCardImages[user.universityCardImages.length - 1];
    }

    if (imagePath) {
      const imgPath = imagePath.startsWith("http")
        ? imagePath
        : `${API_BASE_URL}${imagePath}`;
      const cleanPath = imgPath.split('?')[0];
      const withTimestamp = `${cleanPath}?t=${new Date().getTime()}`;
      setProfileImage(withTimestamp);
      localStorage.setItem("pharmacistProfileImage", withTimestamp);
    } else {
      setProfileImage(null);
    }
  }, [user]);

  // Store claim data for document submission
  const [currentClaimData, setCurrentClaimData] = useState(null);
  const [claimsRefreshTrigger, setClaimsRefreshTrigger] = useState(0);

  // ✅ Verify (مع تحديث stats محليًا + إنشاء claim تلقائي)
  // fulfilledItems: only the items that were actually dispensed (partial fulfillment support)
  const handleVerify = async (id, itemsWithPrices, prescriptionData, fulfilledItems = null) => {
    try {
      // 1️⃣ التحقق من الوصفة والحصول على الوصفة المحدثة مع finalPrice
      const verifyResponse = await api.patch(
        `/api/prescriptions/${id}/verify`,
        itemsWithPrices
      );

      // 2️⃣ استخدام البيانات المرسلة من الـ prescription
      const prescription = prescriptionData || {};
      
      // 3️⃣ استخدام totalPrice من الوصفة المحفوظة (التي تم حسابها في الـ backend مع المقارنة)
      // Use totalPrice from saved prescription (calculated in backend with comparison)
      // api.patch() returns data directly
      const verifiedPrescription = verifyResponse || {};
      const totalPrice = verifiedPrescription.totalPrice || 0;
      
      logger.log("💰 [VERIFY] Using totalPrice from backend:", totalPrice);
      logger.log("📋 [VERIFY] Prescription data:", {
        memberId: prescription.memberId,
        memberName: prescription.memberName,
        fullPrescription: prescription
      });
      logger.log("📋 [VERIFY] Verified prescription data:", {
        memberId: verifiedPrescription.memberId,
        memberName: verifiedPrescription.memberName,
        isFamilyMember: verifiedPrescription.isFamilyMember,
        familyMemberName: verifiedPrescription.familyMemberName,
        familyMemberAge: verifiedPrescription.familyMemberAge,
        familyMemberGender: verifiedPrescription.familyMemberGender,
        isChronic: verifiedPrescription.isChronic, // Log isChronic from verified prescription
        "isChronic type": typeof verifiedPrescription.isChronic,
        "isChronic === true": verifiedPrescription.isChronic === true
      });
      logger.log("📋 [VERIFY] Original prescription.isChronic:", prescription.isChronic, "type:", typeof prescription.isChronic);

      // 4️⃣ إنشاء claim تلقائي (Healthcare Provider Claim) - بدون إرسال الآن
      // Use memberId from verifiedPrescription if available, otherwise use prescription.memberId
      const memberIdToUse = verifiedPrescription.memberId || prescription.memberId;
      const memberNameToUse = verifiedPrescription.memberName || prescription.memberName;
      
      logger.log("🔍 [VERIFY] Using memberId for claim:", memberIdToUse);
      logger.log("🔍 [VERIFY] Using memberName for claim:", memberNameToUse);
      
      // Determine which items to include in the claim (partial fulfillment support)
      const originalItemCount = prescription.items?.length || 0;
      const fulfilledItemCount = fulfilledItems?.length || originalItemCount;
      const isPartialFulfillment = fulfilledItems && fulfilledItems.length < originalItemCount;

      // Get the fulfilled item IDs for filtering
      const fulfilledItemIds = fulfilledItems ? fulfilledItems.map(item => item.id) : null;

      // Filter items to only include fulfilled ones
      const itemsToInclude = fulfilledItemIds
        ? (verifiedPrescription.items || prescription.items || []).filter(item => fulfilledItemIds.includes(item.id))
        : (verifiedPrescription.items || prescription.items || []);

      const claimData = {
        clientId: memberIdToUse, // ID المريض من الوصفة (يمكن أن يكون family member ID أو main client ID)
        memberName: memberNameToUse || "", // ✅ إضافة memberName مثل الدكتور
        description: isPartialFulfillment
          ? `Pharmacy verification for prescription - ${fulfilledItemCount} of ${originalItemCount} items dispensed (partial)`
          : `Pharmacy verification for prescription - ${fulfilledItemCount} items verified`,
        amount: totalPrice,
        serviceDate: new Date().toISOString().split('T')[0],
        diagnosis: prescription.diagnosis || "", // ⭐ إضافة diagnosis من الوصفة
        treatmentDetails: prescription.treatment || "", // ⭐ إضافة treatment من الوصفة
        roleSpecificData: JSON.stringify({
          prescriptionId: id,
          patientName: prescription.memberName,
          doctorName: prescription.doctorName,
          diagnosis: prescription.diagnosis || "",
          treatment: prescription.treatment || "",
          isChronic: (verifiedPrescription.isChronic === true || verifiedPrescription.isChronic === "true")
                     ? true
                     : (prescription.isChronic === true || prescription.isChronic === "true")
                       ? true
                       : false, // ✅ استخدام isChronic من verifiedPrescription أولاً مع التحقق الصحيح
          isPartialFulfillment: isPartialFulfillment,
          originalItemCount: originalItemCount,
          itemsCount: fulfilledItemCount,
          items: itemsToInclude.map(item => {
            const isChronic = verifiedPrescription.isChronic || prescription.isChronic || false;
            // ✅ للوصفات المزمنة: لا نرسل dosage و timesPerDay
            if (isChronic) {
              return {
                name: item.medicineName,
                price: item.finalPrice || 0,
                calculatedQuantity: item.calculatedQuantity || null,
                form: item.form || null,
                // لا نرسل dosage و timesPerDay للوصفات المزمنة
              };
            } else {
              return {
                name: item.medicineName,
                price: item.finalPrice || 0,
                dosage: item.dosage || null,
                calculatedQuantity: item.calculatedQuantity || null,
                form: item.form || null,
                timesPerDay: item.timesPerDay || null,
                duration: item.duration || null
              };
            }
          }),
          notes: isPartialFulfillment
            ? `Partially dispensed (${fulfilledItemCount}/${originalItemCount} items) by ${user?.fullName || "Pharmacist"}`
            : `Verified and dispensed by ${user?.fullName || "Pharmacist"}`
        })
      };
      
      setCurrentClaimData(claimData);
      logger.log("📤 Claim data prepared:", claimData);

      // Refresh prescriptions (جميع الوصفات) و stats
      // api.get() returns data directly
      const [pendingData, allData, statsData] = await Promise.all([
        api.get("/api/prescriptions/pending"),
        api.get("/api/prescriptions/all"),
        api.get("/api/prescriptions/pharmacist/stats"),
      ]);

      // دمج: المعلقة + اللي تعامل معها (verified/rejected/billed) - جميع الحالات
      const pendingPrescriptions = pendingData || [];
      const myPrescriptions = allData || []; // Include all prescriptions including BILLED
      const allUnique = myPrescriptions.filter(
        p => !pendingPrescriptions.some(pending => pending.id === p.id)
      );
      const combined = [...pendingPrescriptions, ...allUnique];

      setPrescriptions(combined);
      if (statsData) setStats(statsData);
      localStorage.setItem("pharmacistPrescriptions", JSON.stringify(combined));
      if (statsData) localStorage.setItem("pharmacistStats", JSON.stringify(statsData));
    } catch (err) {
      logger.error("Error verifying prescription:", err);
      logger.error("Error details:", err.response?.data);
      alert(t("failedToVerifyPrescription", language));
      throw err;
    }
  };

  // ❌ Reject (مع تحديث stats محليًا)
  const handleReject = async (id) => {
    try {
      await api.patch(`/api/prescriptions/${id}/reject`, {});

      // Refresh prescriptions (جميع الوصفات) و stats
      // api.get() returns data directly
      const [pendingData, allData, statsData] = await Promise.all([
        api.get("/api/prescriptions/pending"),
        api.get("/api/prescriptions/all"),
        api.get("/api/prescriptions/pharmacist/stats"),
      ]);

      // دمج: المعلقة + اللي تعامل معها (verified/rejected)
      const pendingPrescriptions = pendingData || [];
      const myPrescriptions = allData || [];
      const allUnique = myPrescriptions.filter(
        p => !pendingPrescriptions.some(pending => pending.id === p.id)
      );
      const combined = [...pendingPrescriptions, ...allUnique];

      setPrescriptions(combined);
      if (statsData) setStats(statsData);
      localStorage.setItem("pharmacistPrescriptions", JSON.stringify(combined));
      if (statsData) localStorage.setItem("pharmacistStats", JSON.stringify(statsData));
    } catch (err) {
      logger.error("Error rejecting prescription:", err);
      alert(t("failedToRejectPrescription", language));
      throw err;
    }
  };

  // 💰 Mark as Billed (مع تحديث stats محليًا)
  const handleBill = async (id) => {
    try {
      await api.patch(`/api/prescriptions/${id}/bill`, {});

      // Refresh prescriptions (جميع الوصفات) و stats
      // api.get() returns data directly
      const [pendingData, allData, statsData] = await Promise.all([
        api.get("/api/prescriptions/pending"),
        api.get("/api/prescriptions/all"),
        api.get("/api/prescriptions/pharmacist/stats"),
      ]);

      // دمج: المعلقة + اللي تعامل معها (verified/rejected/billed) - جميع الحالات
      const pendingPrescriptions = pendingData || [];
      const myPrescriptions = allData || []; // Include all prescriptions including BILLED
      const allUnique = myPrescriptions.filter(
        p => !pendingPrescriptions.some(pending => pending.id === p.id)
      );
      const combined = [...pendingPrescriptions, ...allUnique];

      setPrescriptions(combined);
      if (statsData) setStats(statsData);
      localStorage.setItem("pharmacistPrescriptions", JSON.stringify(combined));
      if (statsData) localStorage.setItem("pharmacistStats", JSON.stringify(statsData));
    } catch (err) {
      logger.error("Error marking prescription as billed:", err);
      alert(t("failedToMarkAsBilled", language));
      throw err;
    }
  };

  // ✅ Submit Claim with Document
  const handleSubmitClaim = async (claimSubmission) => {
    if (!currentClaimData) {
      throw new Error(t("claimDataNotAvailable", language));
    }

    // 🔄 Use entered description if provided, otherwise use automatic one
    const updatedClaimData = {
      ...currentClaimData,
      description: claimSubmission.description || currentClaimData.description
    };

    // Remove extra fields not expected by backend DTO
    const { memberName, ...claimPayload } = updatedClaimData;

    const formData = new FormData();
    formData.append("data", JSON.stringify(claimPayload));

    if (claimSubmission.document) {
      formData.append("document", claimSubmission.document);
    }

    logger.log("📤 [SUBMIT CLAIM] Sending claim data:", claimPayload);

    await api.post(
      API_ENDPOINTS.HEALTHCARE_CLAIMS.SUBMIT,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setCurrentClaimData(null); // Reset
    // ✅ Refresh claims list immediately after creating a new claim
    setClaimsRefreshTrigger(prev => prev + 1);
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
      <PharmacistSidebar activeView={activeView} setActiveView={setActiveView} />

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
        <PharmacistHeader
          userInfo={user}
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
                  <LocalPharmacyIcon sx={{ fontSize: { xs: 40, md: 56 }, color: "white" }} />
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
                    {t("welcome", language)}, {user?.fullName || t("pharmacist", language)}!
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.95,
                      fontSize: { xs: "0.95rem", md: "1.1rem" },
                      mt: 1,
                    }}
                  >
                    {t("prescriptionList", language)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Stats Cards - Enhanced */}
            <Grid container spacing={3} sx={{ mb: 5 }} justifyContent="center">
              {/* Pending Card */}
              <Grid item xs={12} sm={6} md={3}>
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
                    <AssignmentIcon sx={{ fontSize: { xs: 35, md: 50 } }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 1.5, 
                      fontWeight: 600,
                      fontSize: { xs: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("pending", language)}
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

              {/* Verified Card */}
              <Grid item xs={12} sm={6} md={3}>
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
                    {t("verified", language)}
                  </Typography>
                  <Typography 
                    variant="h2" 
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "2rem", md: "3rem" },
                      textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {stats.verified || 0}
                  </Typography>
                </Paper>
              </Grid>

              {/* Rejected Card */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(220, 38, 38, 0.3), 0 8px 30px rgba(220, 38, 38, 0.2)",
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
                      boxShadow: "0 8px 30px rgba(220, 38, 38, 0.4), 0 12px 40px rgba(220, 38, 38, 0.3)",
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
                    <WarningIcon sx={{ fontSize: { xs: 35, md: 50 } }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 1.5, 
                      fontWeight: 600,
                      fontSize: { xs: "1rem", md: "1.25rem" },
                    }}
                  >
                    {t("rejected", language)}
                  </Typography>
                  <Typography 
                    variant="h2" 
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "2rem", md: "3rem" },
                      textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {stats.rejected || 0}
                  </Typography>
                </Paper>
              </Grid>

              {/* Total Card */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #C9A646 0%, #DDB85C 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(201, 166, 70, 0.3), 0 8px 30px rgba(201, 166, 70, 0.2)",
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
                      boxShadow: "0 8px 30px rgba(201, 166, 70, 0.4), 0 12px 40px rgba(201, 166, 70, 0.3)",
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
                    {t("total", language)}
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
                    onClick={() => setActiveView("prescriptions")}
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
                          {t("prescriptions", language)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t("prescriptionList", language)}
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

        {activeView === "prescriptions" && (
          <PrescriptionList
            prescriptions={prescriptions}
            onVerify={handleVerify}
            onReject={handleReject}
            onSubmitClaim={handleSubmitClaim}
            onBill={handleBill}
            onPrint={(id) => logger.log("Print", id)}
            onDetails={(id) => logger.log("Details", id)}
          />
        )}

        {activeView === "notifications" && (
          <NotificationsList refresh={refreshUnreadCount} />
        )}
        {activeView === "my-claims" && (
          <HealthcareProviderMyClaims userRole={ROLES.PHARMACIST} refreshTrigger={claimsRefreshTrigger} />
        )}
        {activeView === "financial-report" && <FinancialReport />}

        {activeView === "profile" && (
          <PharmacistProfile userInfo={user} setUser={setUser} />
        )}
      </Box>

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

export default PharmacistDashboard;
