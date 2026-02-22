import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
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

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PolicyIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
// Admin Functions icons
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EmergencyIcon from "@mui/icons-material/Emergency";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import GavelIcon from "@mui/icons-material/Gavel";
import DashboardIcon from "@mui/icons-material/Dashboard";
// Data Import icons
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import MedicationIcon from "@mui/icons-material/Medication";
import BiotechIcon from "@mui/icons-material/Biotech";
import PaidIcon from "@mui/icons-material/Paid";
import LogoutDialog from "../Auth/LogoutDialog";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const Sidebar = () => {
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

  // Restore last scroll
  useEffect(() => {
    const savedScroll = localStorage.getItem("managerSidebarScroll");
    if (savedScroll && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const handleScroll = () => {
    if (sidebarRef.current) {
      localStorage.setItem("managerSidebarScroll", sidebarRef.current.scrollTop);
    }
  };

  // Sidebar content component for reuse
  const sidebarContent = (isDrawer = false) => (
    <Box
      ref={!isDrawer ? sidebarRef : null}
      onScroll={!isDrawer ? handleScroll : undefined}
      sx={{
        width: isDrawer ? 280 : (open ? 240 : 72),
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
      {/* Toggle Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: (open || isDrawer) ? "space-between" : "center",
          alignItems: "center",
          mb: 2,
        }}
      >
        {(open || isDrawer) && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: 0.3,
              opacity: 0.9,
            }}
          >
            {t("managerPanel", language)}
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
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                transform: "rotate(90deg)",
              },
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
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
              transform: "translateX(3px)",
            },
          },
          "& .MuiListItemIcon-root": {
            minWidth: { xs: 48, sm: 42 },
            color: "#fff",
          },
          "& .MuiListItemText-primary": {
            fontSize: { xs: "1rem", sm: "0.9rem" },
            fontWeight: 400,
            letterSpacing: "0.2px",
            color: "#FFFFFF",
          },
          "& .MuiListItemText-root": { color: "#FFFFFF" },
        }}
      >

        {/* Dashboard Button */}
        <Tooltip title={t("dashboard", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton
            component={Link}
            to="/ManagerDashboard"
            sx={{
              backgroundColor: "rgba(255,255,255,0.15)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.25) !important",
              },
            }}
          >
            <ListItemIcon>
              <DashboardIcon sx={{ color: "#FFEB3B", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("dashboard", language)} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Profiles Section */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("pendingHealthcareProvider", language)}
          </Typography>
        )}
        <Tooltip
          title={t("pendingProviderRegistrations", language) || "Pending Provider Registrations"}
          placement={isRTL ? "left" : "right"}
          disableHoverListener={open || isDrawer}
        >
          <ListItemButton component={Link} to="/PendingProviderRegistrations">
            <ListItemIcon>
              <PendingActionsIcon sx={{ color: "#FF8C00", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("pendingProviderRegistrations", language) || "Provider Registrations"} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Policies Section */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("policies", language)}
          </Typography>
        )}
        <Tooltip title={language === "ar" ? "إدارة البوليصة العامة" : "Global Policy Management"} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/PolicyManagement">
            <ListItemIcon>
              <GavelIcon sx={{ color: "#9C27B0", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={language === "ar" ? "البوليصة العامة" : "Global Policy"} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("providerPricing", language)}
          </Typography>
        )}

        <Tooltip
          title={t("providerServicesAndPrices", language)}
          placement={isRTL ? "left" : "right"}
          disableHoverListener={open || isDrawer}
        >
          <ListItemButton component={Link} to="/ProviderPriceList">
            <ListItemIcon>
              <AssignmentIcon sx={{ color: "#4DD0E1", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("providerServicesAndPrices", language)} />}
          </ListItemButton>
        </Tooltip>
        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Accounts Management */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("accountsManagement", language)}
          </Typography>
        )}
        <Tooltip title={t("registerAccounts", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/AdminRegisterAccounts">
            <ListItemIcon>
              <PeopleIcon sx={{ color: "#4DD0E1", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("registerAccounts", language)} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title={t("pendingClientRequests", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/PendingRequests">
            <ListItemIcon>
              <PendingActionsIcon sx={{ color: "#FFA726", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("pendingClientRequests", language)} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Notifications */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("notifications", language)}
          </Typography>
        )}
        <Tooltip
          title={t("viewNotifications", language)}
          placement={isRTL ? "left" : "right"}
          disableHoverListener={open || isDrawer}
        >
          <ListItemButton component={Link} to="/ManageNotifications">
            <ListItemIcon>
              <NotificationsIcon sx={{ color: "#FF5252", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("viewNotifications", language)} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Reports */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("reports", language)}
          </Typography>
        )}
        {[
          { textKey: "claimsReportNav", color: "#BA68C8", path: "/ClaimsReport" },
          { textKey: "financialReportNav", color: "#4DD0E1", path: "/FinancialReport" },
        ].map((report, i) => (
          <Tooltip
            key={i}
            title={t(report.textKey, language)}
            placement={isRTL ? "left" : "right"}
            disableHoverListener={open || isDrawer}
          >
            <ListItemButton component={Link} to={report.path}>
              <ListItemIcon>
                <AssessmentIcon sx={{ color: report.color, fontSize: { xs: 26, sm: 22 } }} />
              </ListItemIcon>
              {(open || isDrawer) && <ListItemText primary={t(report.textKey, language)} />}
            </ListItemButton>
          </Tooltip>
        ))}

        {/* Consultation Prices */}
        <Tooltip title={t("consultationPrices", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/ConsultationPrices">
            <ListItemIcon>
              <PaidIcon sx={{ color: "#4DB6AC", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("consultationPrices", language)} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Admin Functions Section - God Mode Access */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("adminFunctions", language)}
          </Typography>
        )}

        <Tooltip title={t("medicalClaimsReview", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/MedicalClaimsReview">
            <ListItemIcon>
              <LocalHospitalIcon sx={{ color: "#FF6B6B", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("medicalClaimsReview", language)} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title={t("medicalDecisionsList", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/MedicalDecisionsList">
            <ListItemIcon>
              <GavelIcon sx={{ color: "#9C27B0", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("medicalDecisionsList", language)} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title={t("coordinationClaimsManage", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/ClaimsManage">
            <ListItemIcon>
              <AssignmentTurnedInIcon sx={{ color: "#4CAF50", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("coordinationClaimsManage", language)} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title={t("emergencyRequests", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/EmergencyRequests">
            <ListItemIcon>
              <EmergencyIcon sx={{ color: "#F44336", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("emergencyRequests", language)} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Data Management Section */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("dataManagement", language)}
          </Typography>
        )}

        <Tooltip title={t("dataImport", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/DataImport">
            <ListItemIcon>
              <CloudUploadIcon sx={{ color: "#2196F3", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("dataImport", language)} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title={t("coverageManagement", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/CoverageManagement">
            <ListItemIcon>
              <VerifiedUserIcon sx={{ color: "#4CAF50", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("coverageManagement", language)} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title={t("doctorMedicineAssignment", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/DoctorMedicineAssignment">
            <ListItemIcon>
              <MedicationIcon sx={{ color: "#E91E63", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("doctorMedicines", language)} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title={t("doctorTestAssignment", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Manager/DoctorTestAssignment">
            <ListItemIcon>
              <BiotechIcon sx={{ color: "#9C27B0", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("doctorTests", language)} />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.15)" }} />

        {/* Account */}
        {(open || isDrawer) && (
          <Typography
            variant="body2"
            sx={{ ml: 1, mb: 0.7, color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.9rem", sm: "0.8rem" } }}
          >
            {t("account", language)}
          </Typography>
        )}
        <Tooltip title={t("profile", language)} placement={isRTL ? "left" : "right"} disableHoverListener={open || isDrawer}>
          <ListItemButton component={Link} to="/Profile">
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
              <ExitToAppIcon sx={{ color: "#fff", fontSize: { xs: 26, sm: 22 } }} />
            </ListItemIcon>
            {(open || isDrawer) && <ListItemText primary={t("logout", language)} />}
          </ListItemButton>
        </Tooltip>
      </List>

      {/* Logout Dialog */}
      <LogoutDialog open={openLogout} onClose={() => setOpenLogout(false)} />
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
            {t("managerPanel", language)}
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
          width: open ? 240 : 72,
          height: "100vh",
          transition: "width 0.3s ease",
          zIndex: 1200,
        }}
      >
        {sidebarContent(false)}
      </Box>
    </>
  );
};

export default Sidebar;
