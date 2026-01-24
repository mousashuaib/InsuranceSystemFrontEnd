import React, { useEffect, useState, useCallback, memo } from "react";
import PropTypes from "prop-types";
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
  Stack,
  CircularProgress,
  Fade,
  Tooltip,
  IconButton,
  Grid,
  Divider,
  Link,
} from "@mui/material";
import Header from "../Manager/Header";
import Sidebar from "../Manager/Sidebar";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import DescriptionIcon from "@mui/icons-material/Description";
import BadgeIcon from "@mui/icons-material/Badge";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PersonIcon from "@mui/icons-material/Person";
import MapIcon from "@mui/icons-material/Map";
import ArticleIcon from "@mui/icons-material/Article";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import BusinessIcon from "@mui/icons-material/Business";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

// Memoized Profile Card component - simplified to show only essential info
const ProfileCard = memo(function ProfileCard({
  profile,
  loadingId,
  onApprove,
  onReject,
  onViewDetails,
  getTypeIcon,
  language
}) {
  return (
    <Fade in>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(25,118,210,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "0.3s",
          "&:hover": {
            transform: "scale(1.01)",
            boxShadow: "0 6px 25px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* Left: Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {getTypeIcon(profile.type)}
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {profile.name}
            </Typography>
            <Chip
              label={profile.type}
              size="small"
              sx={{
                backgroundColor: "#556B2F",
                color: "white",
                mt: 0.5,
              }}
            />
          </Box>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title={t("viewDetails", language) || "View Profile Details"}>
            <IconButton
              onClick={() => onViewDetails(profile)}
              sx={{
                color: "#556B2F",
                backgroundColor: "rgba(85, 107, 47, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(85, 107, 47, 0.2)",
                },
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("approveThisProfile", language)}>
            <Button
              variant="contained"
              color="success"
              disabled={loadingId === profile.id}
              onClick={() => onApprove(profile)}
              sx={{ minWidth: 100 }}
            >
              {loadingId === profile.id ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                t("approve", language)
              )}
            </Button>
          </Tooltip>
          <Tooltip title={t("rejectThisProfile", language)}>
            <Button
              variant="outlined"
              color="error"
              disabled={loadingId === profile.id}
              onClick={() => onReject(profile)}
              sx={{ minWidth: 100 }}
            >
              {t("reject", language)}
            </Button>
          </Tooltip>
        </Box>
      </Paper>
    </Fade>
  );
});

ProfileCard.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    address: PropTypes.string,
    contactInfo: PropTypes.string,
    rejectionReason: PropTypes.string,
  }).isRequired,
  loadingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  getTypeIcon: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
};

// Document Link Component with authenticated download
const DocumentLink = ({ filename, label, icon, language }) => {
  const [loading, setLoading] = useState(false);

  // Handle authenticated file view/download
  const handleFileAction = async (action) => {
    if (!filename) return;

    setLoading(true);
    try {
      const response = await api.download(API_ENDPOINTS.SEARCH_PROFILES.FILE(filename));

      // Create blob URL
      const blob = new Blob([response], { type: response.type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);

      if (action === 'view') {
        // Open in new tab
        window.open(url, '_blank');
      } else {
        // Download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Clean up blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error fetching file:', err);
      alert(t("errorLoadingDocument", language) || "Error loading document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!filename) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: "#FFF8E1",
          border: "1px dashed #FFB74D",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: "rgba(255, 183, 77, 0.2)",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {label}
          </Typography>
          <Typography variant="caption" color="warning.main">
            {t("notProvided", language) || "Not provided"}
          </Typography>
        </Box>
        <CancelIcon sx={{ color: "#FFB74D" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: "#E8F5E9",
        border: "1px solid #81C784",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          backgroundColor: "rgba(76, 175, 80, 0.2)",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Tooltip title={t("viewDocument", language) || "View Document"}>
          <IconButton
            onClick={() => handleFileAction('view')}
            disabled={loading}
            sx={{
              color: "#556B2F",
              backgroundColor: "rgba(85, 107, 47, 0.1)",
              "&:hover": { backgroundColor: "rgba(85, 107, 47, 0.2)" },
            }}
          >
            {loading ? <CircularProgress size={18} /> : <OpenInNewIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t("downloadDocument", language) || "Download Document"}>
          <IconButton
            onClick={() => handleFileAction('download')}
            disabled={loading}
            sx={{
              color: "#1976D2",
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
            }}
          >
            {loading ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
      <CheckCircleIcon sx={{ color: "#4CAF50" }} />
    </Box>
  );
};

// Profile Details Dialog Component - COMPREHENSIVE VIEW
const ProfileDetailsDialog = memo(function ProfileDetailsDialog({
  open,
  profile,
  onClose,
  onApprove,
  onReject,
  loadingId,
  getTypeIcon,
  language,
  isRTL,
}) {
  if (!profile) return null;

  const DetailRow = ({ icon, label, value, fullWidth = false }) => (
    <Grid item xs={12} md={fullWidth ? 12 : 6}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, py: 1.5 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: "rgba(85, 107, 47, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {label}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {value || "-"}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );

  // Get profile type label
  const getProfileTypeLabel = (type) => {
    const types = {
      CLINIC: t("clinic", language) || "Clinic",
      PHARMACY: t("pharmacy", language) || "Pharmacy",
      LAB: t("laboratory", language) || "Laboratory",
      DOCTOR: t("doctor", language) || "Doctor",
      RADIOLOGY: t("radiology", language) || "Radiology Center",
    };
    return types[type] || type;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
          p: 3,
          color: "white",
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "white",
            backgroundColor: "rgba(255,255,255,0.1)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.2)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(getTypeIcon(profile.type), {
              sx: { fontSize: 50, color: "white" },
            })}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {profile.name}
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <Chip
                label={getProfileTypeLabel(profile.type)}
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
              <Chip
                label={profile.status}
                size="small"
                sx={{
                  backgroundColor:
                    profile.status === "PENDING"
                      ? "rgba(255, 193, 7, 0.3)"
                      : profile.status === "APPROVED"
                      ? "rgba(76, 175, 80, 0.3)"
                      : "rgba(244, 67, 54, 0.3)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0, overflow: "auto" }} dir={isRTL ? "rtl" : "ltr"}>
        {/* Basic Information Section */}
        <Box sx={{ p: 3, backgroundColor: "#fff" }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <BadgeIcon sx={{ color: "#556B2F" }} />
            {t("basicInformation", language) || "Basic Information"}
          </Typography>

          <Grid container spacing={1}>
            <DetailRow
              icon={<BusinessIcon sx={{ color: "#556B2F" }} />}
              label={t("profileName", language) || "Profile Name"}
              value={profile.name}
            />
            <DetailRow
              icon={<PersonIcon sx={{ color: "#556B2F" }} />}
              label={t("ownerName", language) || "Owner Name"}
              value={profile.ownerName}
            />
            <DetailRow
              icon={<LocationOnIcon sx={{ color: "#556B2F" }} />}
              label={t("address", language) || "Address"}
              value={profile.address}
            />
            <DetailRow
              icon={<PhoneIcon sx={{ color: "#556B2F" }} />}
              label={t("contactInfo", language) || "Contact Information"}
              value={profile.contactInfo}
            />
          </Grid>
        </Box>

        <Divider />

        {/* Location Section */}
        <Box sx={{ p: 3, backgroundColor: "#FAFAFA" }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <MapIcon sx={{ color: "#556B2F" }} />
            {t("locationDetails", language) || "Location Details"}
          </Typography>

          <Grid container spacing={1}>
            <DetailRow
              icon={<MapIcon sx={{ color: "#556B2F" }} />}
              label={t("latitude", language) || "Latitude"}
              value={profile.locationLat ? profile.locationLat.toFixed(6) : null}
            />
            <DetailRow
              icon={<MapIcon sx={{ color: "#556B2F" }} />}
              label={t("longitude", language) || "Longitude"}
              value={profile.locationLng ? profile.locationLng.toFixed(6) : null}
            />
          </Grid>

          {profile.locationLat && profile.locationLng && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                component={Link}
                href={`https://www.google.com/maps?q=${profile.locationLat},${profile.locationLng}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderColor: "#556B2F",
                  color: "#556B2F",
                  "&:hover": {
                    borderColor: "#3D4F23",
                    backgroundColor: "rgba(85, 107, 47, 0.1)",
                  },
                }}
              >
                {t("viewOnGoogleMaps", language) || "View on Google Maps"}
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Description Section */}
        <Box sx={{ p: 3, backgroundColor: "#fff" }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <DescriptionIcon sx={{ color: "#556B2F" }} />
            {t("description", language) || "Description"}
          </Typography>

          {profile.description ? (
            <Paper
              sx={{
                p: 2,
                backgroundColor: "#FAF8F5",
                borderRadius: 2,
                border: "1px solid #E8EDE0",
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {profile.description}
              </Typography>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              {t("noDescriptionProvided", language) || "No description provided"}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Documents Section - CRITICAL FOR REVIEW */}
        <Box sx={{ p: 3, backgroundColor: "#FAFAFA" }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: "#3D4F23", mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <InsertDriveFileIcon sx={{ color: "#556B2F" }} />
            {t("uploadedDocuments", language) || "Uploaded Documents"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("reviewDocumentsBeforeApproval", language) || "Please review all documents carefully before approving this profile"}
          </Typography>

          <Stack spacing={2}>
            {/* Medical License - Required */}
            <DocumentLink
              filename={profile.medicalLicense}
              label={t("medicalLicense", language) || "Medical/Professional License"}
              icon={<ArticleIcon sx={{ color: "#556B2F" }} />}
              language={language}
            />

            {/* University Degree - Required */}
            <DocumentLink
              filename={profile.universityDegree}
              label={t("universityDegree", language) || "University Degree Certificate"}
              icon={<SchoolIcon sx={{ color: "#556B2F" }} />}
              language={language}
            />

            {/* ID or Passport Copy - Required */}
            <DocumentLink
              filename={profile.idOrPassportCopy}
              label={t("idPassportCopy", language) || "ID / Passport Copy"}
              icon={<AssignmentIndIcon sx={{ color: "#556B2F" }} />}
              language={language}
            />

            {/* Clinic/Pharmacy Registration - Optional */}
            <DocumentLink
              filename={profile.clinicRegistration}
              label={
                profile.type === "PHARMACY"
                  ? t("pharmacyRegistration", language) || "Pharmacy Registration"
                  : t("clinicRegistration", language) || "Clinic/Facility Registration"
              }
              icon={<BusinessIcon sx={{ color: "#556B2F" }} />}
              language={language}
            />
          </Stack>
        </Box>
      </DialogContent>

      {/* Actions Footer */}
      <DialogActions
        sx={{
          p: 3,
          backgroundColor: "#FAF8F5",
          borderTop: "1px solid #E8EDE0",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: "#7B8B5E",
            color: "#7B8B5E",
            "&:hover": {
              borderColor: "#556B2F",
              backgroundColor: "rgba(85, 107, 47, 0.1)",
            },
          }}
        >
          {t("close", language) || "Close"}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          color="error"
          onClick={() => onReject(profile)}
          disabled={loadingId === profile.id}
          startIcon={<CancelIcon />}
          sx={{ minWidth: 120 }}
        >
          {t("reject", language) || "Reject"}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => onApprove(profile)}
          disabled={loadingId === profile.id}
          startIcon={loadingId === profile.id ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
          sx={{ minWidth: 120 }}
        >
          {t("approve", language) || "Approve"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ProfileDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  profile: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  loadingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  getTypeIcon: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  isRTL: PropTypes.bool.isRequired,
};

const PendingSearchProfile = () => {
  const { language, isRTL } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch only pending profiles on mount
  const fetchProfiles = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.SEARCH_PROFILES.PENDING);
      const data = res || [];
      const sorted = data.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setProfiles(sorted);
    } catch (err) {
      console.error("Fetch failed:", err.response?.data || err.message);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Memoized approve handler
  const handleApprove = useCallback(async (profile) => {
    setLoadingId(profile.id);
    try {
      await api.put(API_ENDPOINTS.SEARCH_PROFILES.APPROVE(profile.id), {});
      // Remove from pending list after approval
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      setOpenDetailsDialog(false);
      setSnackbar({
        open: true,
        message: `${profile.name} ${t("profileApproved", language) || "has been approved"}.`,
        severity: "success",
      });
    } catch (err) {
      console.error("Approval failed:", err);
      setSnackbar({
        open: true,
        message: t("approvalFailed", language) || "Approval failed",
        severity: "error",
      });
    } finally {
      setLoadingId(null);
    }
  }, [language]);

  // Memoized reject click handler
  const handleRejectClick = useCallback((profile) => {
    setSelectedProfile(profile);
    setOpenRejectDialog(true);
  }, []);

  // View details handler
  const handleViewDetails = useCallback((profile) => {
    setSelectedProfile(profile);
    setOpenDetailsDialog(true);
  }, []);

  // Memoized reject confirm handler
  const handleRejectConfirm = useCallback(async () => {
    if (!selectedProfile) return;
    setLoadingId(selectedProfile.id);
    try {
      await api.put(
        API_ENDPOINTS.SEARCH_PROFILES.REJECT(selectedProfile.id),
        { reason: rejectReason }
      );
      // Remove from pending list after rejection
      setProfiles((prev) => prev.filter((p) => p.id !== selectedProfile.id));
      setOpenDetailsDialog(false);
      setSnackbar({
        open: true,
        message: `${selectedProfile.name} ${t("profileRejected", language) || "has been rejected"}.`,
        severity: "warning",
      });
    } catch (err) {
      console.error("Reject:", err);
      setSnackbar({
        open: true,
        message: t("rejectFailed", language) || "Rejection failed",
        severity: "error",
      });
    } finally {
      setLoadingId(null);
      setOpenRejectDialog(false);
      setRejectReason("");
    }
  }, [selectedProfile, rejectReason, language]);

  // Memoized type icon getter
  const getTypeIcon = useCallback((type) => {
    const iconStyle = { fontSize: 45 };
    switch (type) {
      case "CLINIC":
        return <LocalHospitalIcon sx={{ ...iconStyle, color: "#556B2F" }} />;
      case "PHARMACY":
        return <LocalPharmacyIcon sx={{ ...iconStyle, color: "#7B8B5E" }} />;
      case "LAB":
        return <ScienceIcon sx={{ ...iconStyle, color: "#3D4F23" }} />;
      case "DOCTOR":
        return <AccountCircleIcon sx={{ ...iconStyle, color: "#556B2F" }} />;
      case "RADIOLOGY":
        return <MonitorHeartIcon sx={{ ...iconStyle, color: "#556B2F" }} />;
      default:
        return <AccountCircleIcon sx={iconStyle} />;
    }
  }, []);

  // Pending count
  const pendingCount = profiles.length;

  // Memoized snackbar close handler
  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        dir={isRTL ? "rtl" : "ltr"}
        sx={{
          flexGrow: 1,
          background: "linear-gradient(180deg, #FAF8F5 0%, #ffffff 100%)",
          minHeight: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          transition: "margin 0.3s ease",
        }}
      >
        <Header />
        <Box sx={{ p: 4 }} dir={isRTL ? "rtl" : "ltr"}>
          {/* Page Title with Pending Counter */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PendingActionsIcon sx={{ fontSize: 35, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: "#3D4F23" }}>
                  {t("pendingSearchProfiles", language) || "Pending Search Profiles"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("reviewAndApproveProfiles", language) || "Review and approve healthcare provider profiles"}
                </Typography>
              </Box>
            </Box>

            {/* Pending Counter */}
            <Paper
              elevation={3}
              sx={{
                p: 2.5,
                px: 4,
                textAlign: "center",
                borderRadius: 3,
                background: "linear-gradient(135deg, #7B8B5E 0%, #556B2F 100%)",
                color: "white",
                minWidth: 150,
              }}
            >
              <Typography variant="h3" fontWeight="bold">
                {pendingCount}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t("pending", language) || "Pending"}
              </Typography>
            </Paper>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress sx={{ color: "#556B2F" }} />
            </Box>
          ) : pendingCount === 0 ? (
            /* Empty State */
            <Paper
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 3,
                backgroundColor: "#FAF8F5",
              }}
            >
              <PendingActionsIcon sx={{ fontSize: 80, color: "#7B8B5E", mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#3D4F23", mb: 1 }}>
                {t("noPendingProfiles", language) || "No Pending Profiles"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t("allProfilesReviewed", language) || "All profiles have been reviewed. Check back later for new submissions."}
              </Typography>
            </Paper>
          ) : (
            /* Profile List */
            <Stack spacing={2}>
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  loadingId={loadingId}
                  onApprove={handleApprove}
                  onReject={handleRejectClick}
                  onViewDetails={handleViewDetails}
                  getTypeIcon={getTypeIcon}
                  language={language}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Profile Details Dialog */}
      <ProfileDetailsDialog
        open={openDetailsDialog}
        profile={selectedProfile}
        onClose={() => setOpenDetailsDialog(false)}
        onApprove={handleApprove}
        onReject={handleRejectClick}
        loadingId={loadingId}
        getTypeIcon={getTypeIcon}
        language={language}
        isRTL={isRTL}
      />

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>{t("rejectProfile", language) || "Reject Profile"}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("provideReasonForRejecting", language) || "Please provide a reason for rejecting"}{" "}
            <strong>{selectedProfile?.name}</strong>:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t("reason", language) || "Reason"}
            type="text"
            fullWidth
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>{t("cancel", language) || "Cancel"}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleRejectConfirm}
            disabled={!rejectReason.trim()}
          >
            {t("confirmReject", language) || "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingSearchProfile;
