// src/Component/CoordinationAdmin/CoordinationNotifications.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";

import CoordinationHeader from "./CoordinationHeader";
import CoordinationSidebar from "./CoordinationSidebar";

import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningIcon from "@mui/icons-material/Warning";
import DescriptionIcon from "@mui/icons-material/Description";

import { api } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const CoordinationNotifications = () => {
  const { language, isRTL } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openReplyDialog, setOpenReplyDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingId, setLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================
  //  FETCH ALL NOTIFICATIONS
  // ============================
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.NOTIFICATIONS.BASE);

      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(sorted);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setSnackbar({
        open: true,
        message: t("failedLoadNotifications", language),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ============================
  //  FETCH UNREAD COUNT
  // ============================
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      setUnreadCount(res.data);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ============================
  //  MARK ONE AS READ
  // ============================
  const markAsRead = useCallback(async (id) => {
    try {
      setLoadingId(id);

      await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to mark as read:", err);
      setSnackbar({
        open: true,
        message: t("failedUpdateNotification", language),
        severity: "error",
      });
    } finally {
      setLoadingId(null);
    }
  }, [language]);

  // ============================
  //  MARK ALL AS READ
  // ============================
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      setSnackbar({
        open: true,
        message: t("allNotificationsMarkedRead", language),
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setSnackbar({
        open: true,
        message: t("failedMarkAllRead", language),
        severity: "error",
      });
    }
  }, [language]);

  // ============================
  //  REPLY SYSTEM
  // ============================
  const handleReply = useCallback((n) => {
    setSelectedNotification(n);
    setReplyMessage("");
    setOpenReplyDialog(true);
  }, []);

  const handleConfirmReply = useCallback(async () => {
    if (!replyMessage.trim()) {
      return setSnackbar({
        open: true,
        message: t("replyCannotBeEmpty", language),
        severity: "error",
      });
    }

    try {
      setLoadingId(selectedNotification.id);

      await api.post(
        `/api/notifications/${selectedNotification.id}/reply`,
        {
          recipientId: selectedNotification.senderId,
          message: replyMessage,
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === selectedNotification.id
            ? { ...n, read: true, replied: true }
            : n
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));

      setSnackbar({
        open: true,
        message: t("replySentSuccess", language),
        severity: "success",
      });

      setOpenReplyDialog(false);
    } catch (err) {
      console.error("Reply failed:", err);
      setSnackbar({
        open: true,
        message: t("failedSendReply", language),
        severity: "error",
      });
    } finally {
      setLoadingId(null);
    }
  }, [replyMessage, selectedNotification, language]);

  // ============================
  // COLORS + ICONS
  // ============================
  const getIconAndColor = (type) => {
    switch (type) {
      case "MANUAL_MESSAGE":
        return { icon: <ChatIcon sx={{ color: "#6A1B9A" }} />, bar: "#6A1B9A" };

      case "CLAIM":
        return { icon: <DescriptionIcon sx={{ color: "#388E3C" }} />, bar: "#2E7D32" };

      case "EMERGENCY":
        return { icon: <WarningIcon sx={{ color: "#D32F2F" }} />, bar: "#C62828" };

      default:
        return { icon: <PersonAddIcon sx={{ color: "#1976D2" }} />, bar: "#1976D2" };
    }
  };

  // ============================
  //  UI LAYOUT
  // ============================
  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <CoordinationSidebar />

      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "#f4f6f9",
          minHeight: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          transition: "margin 0.3s ease",
        }}
      >
        <CoordinationHeader />

        <Box sx={{ p: 3 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: "#311B92", display: "flex", alignItems: "center" }}
          >
            <NotificationsIcon sx={{ mr: 1, fontSize: 35, color: "#7E57C2" }} />
            {t("notifications", language)}
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t("viewRespondMessages", language)}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {t("unread", language)}: {unreadCount}
            </Typography>

            {unreadCount > 0 && (
              <Button variant="contained" color="success" onClick={markAllAsRead}>
                {t("markAllAsRead", language)}
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* LOADING */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography>{t("noNotificationsFound", language)}</Typography>
          ) : (
            notifications.map((n) => {
              const { icon, bar } = getIconAndColor(n.type);

              const bg = n.read
                ? "linear-gradient(145deg, #ffffff 0%, #FAF8F5 100%)"
                : n.type === "MANUAL_MESSAGE"
                ? "linear-gradient(145deg, #f3e5f5 0%, #ede7f6 100%)"
                : n.type === "EMERGENCY"
                ? "linear-gradient(145deg, #ffebee 0%, #ffcdd2 100%)"
                : "linear-gradient(145deg, #e8eaf6 0%, #c5cae9 100%)";

              return (
                <Box key={n.id} sx={{ display: "flex", justifyContent: "center" }}>
                  <Paper
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                    }}
                    sx={{
                      position: "relative",
                      width: "80%",
                      maxWidth: 800,
                      p: 2,
                      mb: 3,
                      borderRadius: 3,
                      boxShadow: n.read ? 2 : 6,
                      transition: "0.3s",
                      cursor: "pointer",
                      background: bg,
                      "&:hover": {
                        transform: n.read ? "none" : "scale(1.01)",
                      },
                      opacity: loadingId === n.id ? 0.5 : 1,
                    }}
                  >
                    {/* Colored Left Border */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 6,
                        height: "100%",
                        backgroundColor: bar,
                        borderRadius: "3px 0 0 3px",
                      }}
                    />

                    {/* Header */}
                    <Box sx={{ display: "flex", ml: 2, alignItems: "center" }}>
                      {icon}
                      <Typography sx={{ ml: 1, fontWeight: "bold", color: "#311B92" }}>
                        {n.senderName || t("system", language)}
                      </Typography>
                    </Box>

                    <Chip
                      label={n.type}
                      size="small"
                      sx={{ ml: 2, mt: 1 }}
                      color="secondary"
                    />

                    <Typography sx={{ ml: 2, mt: 1 }}>{n.message}</Typography>

                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{
                        ml: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption">
                        {new Date(n.createdAt).toLocaleString()}
                      </Typography>

                      <Chip
                        label={n.read ? t("read", language) : t("unread", language)}
                        color={n.read ? "default" : "success"}
                        size="small"
                      />
                    </Box>

                    {/* Reply Button */}
                    {n.type === "MANUAL_MESSAGE" && !n.replied && (
                      <Box sx={{ mt: 1, pr: 2, display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end" }}>
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          onClick={() => handleReply(n)}
                        >
                          {t("reply", language)}
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* REPLY DIALOG */}
      <Dialog open={openReplyDialog} onClose={() => setOpenReplyDialog(false)}>
        <DialogTitle>{t("replyToNotification", language)}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("message", language)}: {selectedNotification?.message}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label={t("yourReply", language)}
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenReplyDialog(false)}>{t("cancel", language)}</Button>
          <Button
            onClick={handleConfirmReply}
            variant="contained"
            disabled={loadingId === selectedNotification?.id}
          >
            {loadingId === selectedNotification?.id ? t("sending", language) : t("sendReply", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CoordinationNotifications;
