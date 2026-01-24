// src/Component/Manager/ManagerConsultationPrices.jsx
// Manager wrapper for ConsultationPrices with Manager Sidebar and Header
import React, { useState, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";
import { api, getToken } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";

// Manager-specific imports
import Header from "./Header";
import Sidebar from "./Sidebar";

// Shared component
import ConsultationPrices from "../Shared/ConsultationPrices";

const ManagerConsultationPrices = () => {
  const { isRTL } = useLanguage();
  const token = getToken();

  const [userInfo, setUserInfo] = useState(() => {
    try {
      const stored = localStorage.getItem("managerUserInfo");
      if (stored && stored !== "undefined") {
        return JSON.parse(stored);
      }
    } catch {
      // Invalid JSON
    }
    return { fullName: "Manager", roles: ["INSURANCE_MANAGER"], status: "ACTIVE" };
  });

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("managerProfileImage") || null
  );

  const [unreadCount, setUnreadCount] = useState(
    Number(localStorage.getItem("managerUnreadCount")) || 0
  );

  const fetchUser = useCallback(async () => {
    try {
      const userData = await api.get(API_ENDPOINTS.AUTH.ME);
      if (userData) {
        setUserInfo(userData);
        localStorage.setItem("managerUserInfo", JSON.stringify(userData));

        let imgPath = userData.universityCardImage || "";
        if (!imgPath && userData.universityCardImages && userData.universityCardImages.length > 0) {
          imgPath = userData.universityCardImages[userData.universityCardImages.length - 1];
        }

        if (imgPath) {
          const fullPath = imgPath.startsWith("http") ? imgPath : `${API_BASE_URL}${imgPath}`;
          const withTimestamp = `${fullPath}?t=${Date.now()}`;
          setProfileImage(withTimestamp);
          localStorage.setItem("managerProfileImage", withTimestamp);
        }
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const notifData = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const count = typeof notifData === 'number' ? notifData : parseInt(notifData) || 0;
      setUnreadCount(count);
      localStorage.setItem("managerUnreadCount", count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchUser();
    refreshUnreadCount();
  }, [token, fetchUser, refreshUnreadCount]);

  return (
    <Box
      dir={isRTL ? "rtl" : "ltr"}
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#FAF8F5",
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          transition: "margin 0.3s ease",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          userInfo={userInfo}
          profileImage={profileImage}
          unreadCount={unreadCount}
        />
        <Box sx={{ flex: 1, overflowY: "auto", pt: 2 }}>
          <ConsultationPrices />
        </Box>
      </Box>
    </Box>
  );
};

export default ManagerConsultationPrices;
