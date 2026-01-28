// src/Component/Sidebar/PharmacistSidebar.jsx
import React, { useState, useRef, useEffect, memo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaidIcon from "@mui/icons-material/Paid";
import AssessmentIcon from "@mui/icons-material/Assessment";

import LogoutDialog from "../Auth/LogoutDialog";

const PharmacistSidebar = memo(function PharmacistSidebar({ activeView, setActiveView }) {
  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isTabletScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { language, isRTL } = useLanguage();

  // On mobile, sidebar is closed by default; on tablet, collapsed; on desktop, expanded
  const [open, setOpen] = useState(!isTabletScreen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openLogout, setOpenLogout] = useState(false);
  const sidebarRef = useRef(null);

  // Update open state when screen size changes
  useEffect(() => {
    if (isMobileScreen) {
      setOpen(false);
    } else if (isTabletScreen) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobileScreen, isTabletScreen]);

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavClick = (view) => {
    setActiveView(view);
    if (isMobileScreen) {
      setMobileOpen(false);
    }
  };

  // Restore last scroll
  useEffect(() => {
    const savedScroll = localStorage.getItem("pharmacistSidebarScroll");
    if (savedScroll && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const handleScroll = () => {
    if (sidebarRef.current) {
      localStorage.setItem("pharmacistSidebarScroll", sidebarRef.current.scrollTop);
    }
  };

  // Sidebar content component for reuse
  const sidebarContent = (isDrawer = false) => (
    <Box
      ref={!isDrawer ? sidebarRef : null}
      onScroll={!isDrawer ? handleScroll : undefined}
      sx={{
        width: isDrawer ? 280 : (open ? 240 : 70),
        height: "100%",
        background: "linear-gradient(180deg, #556B2F 0%, #3D4F23 100%)",
        color: "#fff",
        p: 2,
        overflowY: "auto",
        transition: "width 0.3s ease",
        fontFamily: "'Inter', 'Roboto', sans-serif",
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(255,255,255,0.3)",
          borderRadius: "6px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "rgba(255,255,255,0.5)",
        },
        "&::-webkit-scrollbar-track": { backgroundColor: "rgba(0,0,0,0.1)" },
      }}
    >
      {/* Toggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: (open || isDrawer) ? "space-between" : "center",
          alignItems: "center",
          mb: 3,
        }}
      >
        {(open || isDrawer) && (
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: "1rem", letterSpacing: 0.3, opacity: 0.9 }}
          >
            {t("pharmacistDashboard", language)}
          </Typography>
        )}
        {isDrawer ? (
          <IconButton
            onClick={handleMobileDrawerToggle}
            sx={{
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            onClick={() => setOpen(!open)}
            sx={{
              color: "#fff",
              transition: "transform 0.2s ease",
              display: { xs: "none", sm: "flex" },
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)", transform: "rotate(90deg)" },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <List
        sx={{
          "& .MuiListItemButton-root": {
            borderRadius: "8px",
            py: { xs: 1, sm: 0.8 },
            mb: 0.3,
            transition: "all 0.2s ease",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)", transform: "translateX(3px)" },
          },
          "& .MuiListItemIcon-root": { minWidth: { xs: 48, sm: 42 }, color: "#fff" },
          "& .MuiListItemText-primary": { fontSize: { xs: "1rem", sm: "0.9rem" }, fontWeight: 400, letterSpacing: "0.2px", color: "#FFFFFF" },
          "& .MuiListItemText-root": { color: "#FFFFFF" },
        }}
      >
        {/* Dashboard */}
        <Tooltip title={t("dashboard", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton
            onClick={() => handleNavClick("dashboard")}
            selected={activeView === "dashboard"}
            sx={{ "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.2)" } }}
          >
            <ListItemIcon>
              <DashboardIcon sx={{ color: "#FFD700", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("mainDashboard", language)} />}
          </ListItemButton>
        </Tooltip>
        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.2)" }} />


        {/* My Items Section */}
        {(open || isDrawer) && (
          <Typography variant="body2" sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}>
            {t("myItems", language)}
          </Typography>
        )}

        {/* Prescriptions */}
        <Tooltip title={t("prescriptions", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton
            onClick={() => handleNavClick("prescriptions")}
            selected={activeView === "prescriptions"}
            sx={{ "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.2)" } }}
          >
            <ListItemIcon>
              <MedicalServicesIcon sx={{ color: "#4CAF50", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("prescriptions", language)} />}
          </ListItemButton>
        </Tooltip>

        {/* My Claims */}
        <Tooltip title={t("myClaims", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton
            onClick={() => handleNavClick("my-claims")}
            selected={activeView === "my-claims"}
            sx={{ "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.2)" } }}
          >
            <ListItemIcon>
              <ReceiptIcon sx={{ color: "#FFA500", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("myClaims", language)} />}
          </ListItemButton>
        </Tooltip>

        {/* Financial Report */}
        <Tooltip title={t("financialReport", language) || "Financial Report"} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton
            onClick={() => handleNavClick("financial-report")}
            selected={activeView === "financial-report"}
            sx={{ "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.2)" } }}
          >
            <ListItemIcon>
              <AssessmentIcon sx={{ color: "#81C784", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("financialReport", language) || "Financial Report"} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.2)" }} />

        {/* Account Section */}
        {(open || isDrawer) && (
          <Typography variant="body2" sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}>
            {t("account", language)}
          </Typography>
        )}

        {/* Profile */}
        <Tooltip title={t("profile", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton
            onClick={() => handleNavClick("profile")}
            selected={activeView === "profile"}
            sx={{ "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.2)" } }}
          >
            <ListItemIcon>
              <AccountCircleIcon sx={{ color: "#fff", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("profile", language)} />}
          </ListItemButton>
        </Tooltip>

        {/* Logout */}
        <Tooltip title={t("logout", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton onClick={() => setOpenLogout(true)}>
            <ListItemIcon>
              <ExitToAppIcon sx={{ color: "#FF5252", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("logout", language)} />}
          </ListItemButton>
        </Tooltip>
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile App Bar with Menu Button */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: "flex", sm: "none" },
          background: "linear-gradient(90deg, #556B2F 0%, #3D4F23 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Toolbar sx={{ minHeight: "56px !important" }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleMobileDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            {t("pharmacistDashboard", language)}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor={isRTL ? "right" : "left"}
        open={mobileOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            background: "transparent",
          },
        }}
      >
        {sidebarContent(true)}
      </Drawer>

      {/* Desktop/Tablet Fixed Sidebar */}
      <Box
        sx={{
          display: { xs: "none", sm: "block" },
          position: "fixed",
          left: isRTL ? "auto" : 0,
          right: isRTL ? 0 : "auto",
          top: 0,
          bottom: 0,
          width: open ? 240 : 70,
          height: "100vh",
          transition: "width 0.3s ease",
          zIndex: 1200,
        }}
      >
        {sidebarContent(false)}
      </Box>

      {/* Logout Dialog */}
      <LogoutDialog
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        onConfirm={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("pharmacistSidebarScroll");
          window.location.href = "/LandingPage";
        }}
      />
    </>
  );
});

PharmacistSidebar.propTypes = {
  activeView: PropTypes.string,
  setActiveView: PropTypes.func.isRequired,
  isMobile: PropTypes.bool,
};

export default PharmacistSidebar;
