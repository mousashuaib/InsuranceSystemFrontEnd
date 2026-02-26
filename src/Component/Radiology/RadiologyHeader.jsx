import React, { memo } from "react";
import PropTypes from "prop-types";
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
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Logout from "@mui/icons-material/Logout";
import logo from "../../images/image.jpg";
import LanguageToggle from "../Shared/LanguageToggle";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const RadiologyHeader = memo(function RadiologyHeader({
  userInfo,
  profileImage,
  unreadCount,
  onNotificationsClick,
  onProfileClick,
  onLogoClick,
  onLogoutClick,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { language, isRTL } = useLanguage();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    onProfileClick?.();
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    onLogoutClick?.();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #E8EDE0",
        color: "#333",
        mb: 3,
        width: "100%",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          px: 2,
        }}
      >
        {/* Logo + System Name */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            paddingInlineStart: 2,
          }}
          onClick={onLogoClick}
        >
          <img
            src={logo}
            alt="System Logo"
            style={{ height: 40, width: 40, borderRadius: "50%" }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "#556B2F" }}
          >
            {t("birzeitInsuranceSystem", language)}
          </Typography>
        </Box>

        {/* Right Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, paddingInlineEnd: 2 }}>
          {/* Language Toggle */}
          <LanguageToggle />

          {/* Notifications */}
          <IconButton onClick={onNotificationsClick}>
            <Badge color="error" badgeContent={unreadCount || null}>
              <NotificationsIcon sx={{ color: "#FFD700" }} />
            </Badge>
          </IconButton>

          {/* User Info */}
          <Box sx={{ textAlign: isRTL ? "left" : "right" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {userInfo?.fullName || "Radiologist"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "gray", fontStyle: "italic" }}
            >
              {userInfo?.roles?.[0] || "RADIOLOGY_WORKER"}
            </Typography>
          </Box>

          {/* Avatar + Menu */}
          <IconButton onClick={handleMenuOpen}>
            <Avatar
              src={profileImage || undefined}
              sx={{
                bgcolor: "#556B2F",
                width: 42,
                height: 42,
                border: "2px solid #7B8B5E",
              }}
            >
              {!profileImage && userInfo?.fullName?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              {t("profile", language)}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogoutClick}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: "red" }} />
              </ListItemIcon>
              {t("logout", language)}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
});

RadiologyHeader.propTypes = {
  userInfo: PropTypes.shape({
    fullName: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
  }),
  profileImage: PropTypes.string,
  unreadCount: PropTypes.number,
  onNotificationsClick: PropTypes.func,
  onProfileClick: PropTypes.func,
  onLogoClick: PropTypes.func,
  onLogoutClick: PropTypes.func,
};

export default RadiologyHeader;
