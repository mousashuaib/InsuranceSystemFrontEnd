// src/Component/Chat/ChatHeader.jsx
import React, { useEffect, useState, useCallback, memo } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Logout from "@mui/icons-material/Logout";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate } from "react-router-dom";
import { api, getToken } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import LogoutDialog from "../Auth/LogoutDialog";
import logo from "../../images/image.jpg";

const ChatHeader = memo(function ChatHeader() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openLogout, setOpenLogout] = useState(false);
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState([]);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      // api.get returns response.data directly
      const profileData = await api.get(API_ENDPOINTS.AUTH.ME);
      setFullName(profileData.fullName);
      setRoles(profileData.roles || []);

      if (profileData.id) localStorage.setItem("userId", profileData.id);

      if (profileData.universityCardImage) {
        const imgPath = profileData.universityCardImage;
        setProfileImage(`${API_BASE_URL}${imgPath}`);
        localStorage.setItem("profileImage", imgPath);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      // api.get returns response.data directly
      const unreadData = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      setUnreadCount(unreadData || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s instead of 5s
    return () => clearInterval(interval);
  }, [fetchProfile, fetchUnreadCount]);

  // ✅ Menu Handlers
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfile = () => {
    navigate("/Profile");
    handleMenuClose();
  };
  const handleLogoutClick = () => {
    setOpenLogout(true);
    handleMenuClose();
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "#556B2F",
          color: "#fff",
          px: 3,
          py: 0.5,
          boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* ⬅️ Back Button + Logo + Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                color: "#fff",
                "&:hover": { color: "#FFD700" },
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
              }}
              onClick={() => navigate("/Chat")}
            >
              <img
                src={logo}
                alt="System Logo"
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: "50%",
                  border: "2px solid #fff",
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Birzeit Health Insurance Chat
              </Typography>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* 🔔 Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={() => navigate("/ManageNotifications")}
                sx={{ color: "#FFD700" }}
              >
                <Badge
                  color="error"
                  badgeContent={unreadCount || null}
                  overlap="circular"
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* 👤 User Info */}
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {fullName || "Loading..."}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}
              >
                {roles.length > 0 ? roles.join(", ") : "Loading..."}
              </Typography>
            </Box>

            {/* Avatar Menu */}
            <IconButton onClick={handleMenuOpen}>
              <Avatar
                src={profileImage || undefined}
                sx={{
                  bgcolor: "#fff",
                  color: "#556B2F",
                  width: 42,
                  height: 42,
                  border: "2px solid #fff",
                  fontWeight: "bold",
                }}
              >
                {!profileImage && fullName?.charAt(0)}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 4,
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                },
              }}
            >
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogoutClick}>
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: "red" }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Logout Dialog */}
      <LogoutDialog open={openLogout} onClose={() => setOpenLogout(false)} />
    </>
  );
});

export default ChatHeader;
