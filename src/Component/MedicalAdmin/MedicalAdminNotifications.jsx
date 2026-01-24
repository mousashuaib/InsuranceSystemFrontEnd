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
import MedicalAdminHeader from "./MedicalAdminHeader";
import MedicalAdminSidebar from "./MedicalAdminSidebar";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningIcon from "@mui/icons-material/Warning";
import DescriptionIcon from "@mui/icons-material/Description";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const MedicalAdminNotifications = () => {
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

  // ✅ Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await api.get(API_ENDPOINTS.NOTIFICATIONS.ALL);

      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setSnackbar({
        open: true,
        message: t("failedToLoadNotifications", language),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✅ Fetch Unread Count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      setUnreadCount(res.data);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Mark one as read
  const markAsRead = useCallback(async (id) => {
    try {
      const token = getToken();
      if (!token) return;
      setLoadingId(id);

      await api.patch(`${API_ENDPOINTS.NOTIFICATIONS.ALL}/${id}/read`, {});

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.status === 401
            ? t("unauthorizedPleaseLogin", language)
            : t("failedToUpdateNotification", language),
        severity: "error",
      });
    } finally {
      setLoadingId(null);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {});

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

  // Reply handling
  const handleReply = useCallback((notification) => {
    setSelectedNotification(notification);
    setReplyMessage("");
    setOpenReplyDialog(true);
  }, []);

  const handleConfirmReply = async () => {
    if (!replyMessage.trim()) {
      setSnackbar({
        open: true,
        message: t("replyCannotBeEmpty", language),
        severity: "error",
      });
      return;
    }

    try {
      const token = getToken();
      if (!token) return;
      setLoadingId(selectedNotification.id);

      await api.post(
        `${API_ENDPOINTS.NOTIFICATIONS.ALL}/${selectedNotification.id}/reply`,
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
      console.error("Failed to send reply:", err);
      setSnackbar({
        open: true,
        message: t("failedSendReply", language),
        severity: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  // ✅ Choose icon and color
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

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <MedicalAdminSidebar />
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
        <MedicalAdminHeader />
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#120460", display: "flex", alignItems: "center" }}
          >
            <NotificationsIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 35, color: "#FF1744" }} />
            {t("notifications", language)}
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t("viewRespondNotifications", language)}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {t("unreadNotifications", language)}: {unreadCount}
            </Typography>

            {unreadCount > 0 && (
              <Button variant="contained" color="success" onClick={markAllAsRead}>
                {t("markAllAsRead", language)}
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography>{t("noNotifications", language)}</Typography>
          ) : (
            notifications.map((n) => {
              const { icon, bar } = getIconAndColor(n.type);

              const getBackgroundColor = () => {
                if (n.read)
                  return "linear-gradient(145deg, #ffffff 0%, #f7f8fc 100%)";
                switch (n.type) {
                  case "MANUAL_MESSAGE":
                    return "linear-gradient(145deg, #f3e5f5 0%, #ede7f6 100%)";
                  case "EMERGENCY":
                    return "linear-gradient(145deg, #ffebee 0%, #ffcdd2 100%)";
                  default:
                    return "linear-gradient(145deg, #e3f2fd 0%, #bbdefb 100%)";
                }
              };

              return (
                <Box sx={{ display: "flex", justifyContent: "center" }} key={n.id}>
                  <Paper
                    onClick={() => {
                      if (!n.read && n.type !== "SYSTEM") markAsRead(n.id);
                    }}
                    sx={{
                      position: "relative",
                      width: "80%",
                      maxWidth: 800,
                      p: 2,
                      mb: 3,
                      borderRadius: 3,
                      boxShadow: n.read ? 2 : 4,
                      background: getBackgroundColor(),
                      transition: "all 0.3s ease",
                      cursor: !n.read ? "pointer" : "default",
                      "&:hover": !n.read
                        ? {
                            transform: "scale(1.01)",
                            boxShadow: 6,
                          }
                        : {},
                      opacity: loadingId === n.id ? 0.6 : 1,
                    }}
                  >
                    {/* ✅ Side bar color */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 6,
                        height: "100%",
                        borderRadius: "3px 0 0 3px",
                        backgroundColor: bar,
                      }}
                    />

                    {/* Header */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, ml: 2 }}>
                      {icon}
                      <Typography
                        variant="subtitle1"
                        sx={{ ml: 1, fontWeight: "bold", color: "#120460" }}
                      >
                        {n.senderName || "System"}
                      </Typography>
                    </Box>

                    <Chip
                      label={n.type || "SYSTEM"}
                      color="secondary"
                      size="small"
                      sx={{ mb: 1, ml: 2 }}
                    />

                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        ml: 2,
                        color: "#333",
                        lineHeight: 1.5,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {n.message}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{
                        ml: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {new Date(n.createdAt).toLocaleString()}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Chip
                          label={n.read ? t("read", language) : t("unread", language)}
                          color={n.read ? "default" : "success"}
                          size="small"
                        />
                        {n.replied && (
                          <Chip
                            label={t("replied", language)}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    {n.type === "MANUAL_MESSAGE" && n.senderId && !n.replied && (
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          justifyContent: "flex-end",
                          pr: 1,
                        }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          onClick={() => handleReply(n)}
                          disabled={loadingId === n.id}
                          startIcon={
                            loadingId === n.id ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : null
                          }
                        >
                          {loadingId === n.id ? t("sending", language) : t("reply", language)}
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

      {/* ✅ Reply Dialog */}
      <Dialog open={openReplyDialog} onClose={() => setOpenReplyDialog(false)}>
        <DialogTitle>{t("replyToNotification", language)}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {t("message", language)}: {selectedNotification?.message}
          </Typography>
          <TextField
            fullWidth
            label={t("yourReply", language)}
            multiline
            rows={3}
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
            color="primary"
            disabled={loadingId === selectedNotification?.id}
            startIcon={
              loadingId === selectedNotification?.id ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {loadingId === selectedNotification?.id ? t("sending", language) : t("sendReply", language)}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MedicalAdminNotifications;
