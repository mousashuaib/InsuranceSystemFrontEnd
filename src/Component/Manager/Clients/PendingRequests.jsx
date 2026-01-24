import React, { useState, useEffect, useCallback, memo } from "react";
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
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  Fade,
} from "@mui/material";
import Header from "../Header";
import Sidebar from "../Sidebar";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArticleIcon from "@mui/icons-material/Article";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS } from "../../../config/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

// Request type constants
const REQUEST_TYPES = {
  FAMILY_MEMBER: "FAMILY_MEMBER",
};

// Document Link Component with authenticated download
const DocumentLink = memo(function DocumentLink({ filename, label, icon, language, endpoint }) {
  const [loading, setLoading] = useState(false);

  const handleFileAction = async (action) => {
    if (!filename) return;

    setLoading(true);
    try {
      const response = await api.download(endpoint);
      const blob = new Blob([response], { type: response.type || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);

      if (action === "view") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Error fetching file:", err);
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
        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: "rgba(255, 183, 77, 0.2)" }}>
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
      <Box sx={{ p: 1, borderRadius: 2, backgroundColor: "rgba(76, 175, 80, 0.2)" }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {filename}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Tooltip title={t("viewDocument", language) || "View Document"}>
          <IconButton
            onClick={() => handleFileAction("view")}
            disabled={loading}
            sx={{ color: "#556B2F", backgroundColor: "rgba(85, 107, 47, 0.1)", "&:hover": { backgroundColor: "rgba(85, 107, 47, 0.2)" } }}
          >
            {loading ? <CircularProgress size={18} /> : <OpenInNewIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t("downloadDocument", language) || "Download Document"}>
          <IconButton
            onClick={() => handleFileAction("download")}
            disabled={loading}
            sx={{ color: "#1976D2", backgroundColor: "rgba(25, 118, 210, 0.1)", "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" } }}
          >
            {loading ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
      <CheckCircleIcon sx={{ color: "#4CAF50" }} />
    </Box>
  );
});

// Family Member Details Dialog
const FamilyMemberDetailsDialog = memo(function FamilyMemberDetailsDialog({
  open,
  member,
  onClose,
  onApprove,
  onReject,
  loadingId,
  language,
  isRTL,
}) {
  if (!member) return null;

  const getRelationLabel = (relation) => {
    const relationMap = {
      SON: t("son", language) || "Son",
      DAUGHTER: t("daughter", language) || "Daughter",
      FATHER: t("father", language) || "Father",
      MOTHER: t("mother", language) || "Mother",
      WIFE: t("wife", language) || "Wife",
      HUSBAND: t("husband", language) || "Husband",
    };
    return relationMap[relation] || relation;
  };

  const DetailRow = ({ icon, label, value, fullWidth = false }) => (
    <Grid item xs={12} md={fullWidth ? 12 : 6}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, py: 1.5 }}>
        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: "rgba(85, 107, 47, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "90vh" } }}>
      {/* Header */}
      <Box sx={{ background: "linear-gradient(135deg, #7B8B5E 0%, #556B2F 100%)", p: 3, color: "white", position: "relative" }}>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 16, top: 16, color: "white", backgroundColor: "rgba(255,255,255,0.1)", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ p: 2, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FamilyRestroomIcon sx={{ fontSize: 50, color: "white" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {member.fullName}
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <Chip label={getRelationLabel(member.relation)} size="small" sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }} />
              <Chip label={t("familyMemberAddition", language) || "Family Member Addition"} size="small" sx={{ backgroundColor: "rgba(255, 193, 7, 0.3)", color: "white", fontWeight: 600 }} />
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0, overflow: "auto" }} dir={isRTL ? "rtl" : "ltr"}>
        {/* Family Member Information */}
        <Box sx={{ p: 3, backgroundColor: "#fff" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: "#556B2F" }} />
            {t("familyMemberInformation", language) || "Family Member Information"}
          </Typography>
          <Grid container spacing={1}>
            <DetailRow icon={<PersonIcon sx={{ color: "#556B2F" }} />} label={t("fullName", language) || "Full Name"} value={member.fullName} />
            <DetailRow icon={<BadgeIcon sx={{ color: "#556B2F" }} />} label={t("nationalId", language) || "National ID"} value={member.nationalId} />
            <DetailRow icon={<FavoriteIcon sx={{ color: "#556B2F" }} />} label={t("relation", language) || "Relation"} value={getRelationLabel(member.relation)} />
            <DetailRow icon={<WcIcon sx={{ color: "#556B2F" }} />} label={t("gender", language) || "Gender"} value={member.gender === "MALE" ? t("male", language) || "Male" : t("female", language) || "Female"} />
            <DetailRow icon={<CakeIcon sx={{ color: "#556B2F" }} />} label={t("dateOfBirth", language) || "Date of Birth"} value={member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : "-"} />
            <DetailRow icon={<AssignmentIndIcon sx={{ color: "#556B2F" }} />} label={t("insuranceNumber", language) || "Insurance Number"} value={member.insuranceNumber} />
          </Grid>
        </Box>

        <Divider />

        {/* Parent Client Information */}
        <Box sx={{ p: 3, backgroundColor: "#FAFAFA" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: "#556B2F" }} />
            {t("parentClientInformation", language) || "Parent Client Information"}
          </Typography>
          <Grid container spacing={1}>
            <DetailRow icon={<PersonIcon sx={{ color: "#556B2F" }} />} label={t("clientName", language) || "Client Name"} value={member.clientFullName || member.client?.fullName} />
            <DetailRow icon={<AssignmentIndIcon sx={{ color: "#556B2F" }} />} label={t("clientEmployeeId", language) || "Client Employee ID"} value={member.clientEmployeeId || member.client?.employeeId} />
          </Grid>
        </Box>

        <Divider />

        {/* Submitted Documents */}
        {member.documentImages && member.documentImages.length > 0 && (
          <Box sx={{ p: 3, backgroundColor: "#fff" }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <ArticleIcon sx={{ color: "#556B2F" }} />
              {t("submittedDocuments", language) || "Submitted Documents"}
            </Typography>
            <Stack spacing={2}>
              {member.documentImages.map((doc, index) => (
                <DocumentLink
                  key={index}
                  filename={doc}
                  label={`${t("document", language) || "Document"} ${index + 1}`}
                  icon={<ArticleIcon sx={{ color: "#556B2F" }} />}
                  language={language}
                  endpoint={API_ENDPOINTS.FAMILY_MEMBERS.FILE(doc)}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Submission Date */}
        <Box sx={{ p: 3, backgroundColor: "#FAFAFA" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CalendarTodayIcon sx={{ color: "#556B2F" }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("submittedOn", language) || "Submitted On"}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {member.createdAt ? new Date(member.createdAt).toLocaleString() : "-"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {/* Actions Footer */}
      <DialogActions sx={{ p: 3, backgroundColor: "#FAF8F5", borderTop: "1px solid #E8EDE0", gap: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: "#7B8B5E", color: "#7B8B5E", "&:hover": { borderColor: "#556B2F", backgroundColor: "rgba(85, 107, 47, 0.1)" } }}>
          {t("close", language) || "Close"}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" color="error" onClick={() => onReject(member)} disabled={loadingId === member.id} startIcon={<CancelIcon />} sx={{ minWidth: 120 }}>
          {t("reject", language) || "Reject"}
        </Button>
        <Button variant="contained" color="success" onClick={() => onApprove(member)} disabled={loadingId === member.id} startIcon={loadingId === member.id ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />} sx={{ minWidth: 120 }}>
          {t("approve", language) || "Approve"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// Family Member Request Card Component
const RequestCard = memo(function RequestCard({ request, requestType, loadingId, onApprove, onReject, onViewDetails, language }) {
  const getRelationLabel = (relation) => {
    const relationMap = {
      SON: t("son", language) || "Son",
      DAUGHTER: t("daughter", language) || "Daughter",
      FATHER: t("father", language) || "Father",
      MOTHER: t("mother", language) || "Mother",
      WIFE: t("wife", language) || "Wife",
      HUSBAND: t("husband", language) || "Husband",
    };
    return relationMap[relation] || relation;
  };

  return (
    <Fade in>
      <Card sx={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)", transition: "0.3s", "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.15)" } }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Left: Icon and Info */}
            <Grid item xs={12} md={8}>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #7B8B5E 0%, #556B2F 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FamilyRestroomIcon sx={{ fontSize: 30, color: "white" }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {request.fullName}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={0.5}>
                      <Chip
                        label={getRelationLabel(request.relation)}
                        size="small"
                        sx={{ backgroundColor: "#556B2F", color: "white", fontWeight: "bold" }}
                      />
                      <Chip
                        label={t("familyMember", language) || "Family Member"}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: "#7B8B5E", color: "#7B8B5E" }}
                      />
                    </Stack>
                  </Box>
                </Box>

                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BadgeIcon sx={{ color: "#7B8B5E", fontSize: 18 }} />
                      <Typography variant="body2">{request.nationalId}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PersonIcon sx={{ color: "#7B8B5E", fontSize: 18 }} />
                      <Typography variant="body2">
                        {t("parentClient", language) || "Parent"}: {request.clientFullName || request.client?.fullName || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CakeIcon sx={{ color: "#7B8B5E", fontSize: 18 }} />
                      <Typography variant="body2">
                        {request.dateOfBirth ? new Date(request.dateOfBirth).toLocaleDateString() : "-"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary">
                  {t("submittedOn", language) || "Submitted On"}: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                </Typography>
              </Stack>
            </Grid>

            {/* Right: Actions */}
            <Grid item xs={12} md={4}>
              <Stack spacing={1}>
                <Tooltip title={t("viewDetails", language) || "View Details"}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<VisibilityIcon />}
                    onClick={() => onViewDetails(request, requestType)}
                    sx={{ borderColor: "#556B2F", color: "#556B2F", "&:hover": { borderColor: "#3D4F23", backgroundColor: "rgba(85, 107, 47, 0.1)" } }}
                  >
                    {t("viewDetails", language) || "View Details"}
                  </Button>
                </Tooltip>
                <Button variant="contained" color="success" fullWidth disabled={loadingId === request.id} onClick={() => onApprove(request, requestType)}>
                  {loadingId === request.id ? <CircularProgress size={20} color="inherit" /> : t("approve", language) || "Approve"}
                </Button>
                <Button variant="outlined" color="error" fullWidth disabled={loadingId === request.id} onClick={() => onReject(request, requestType)}>
                  {t("reject", language) || "Reject"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Fade>
  );
});

const PendingRequests = () => {
  const { language, isRTL } = useLanguage();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Dialogs
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [openFamilyDetailsDialog, setOpenFamilyDetailsDialog] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Fetch data - Only family members (role requests are handled in separate Pending Accounts page)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const familyRes = await api.get(API_ENDPOINTS.FAMILY_MEMBERS.PENDING).catch(() => []);
      const sortedFamily = (familyRes || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setFamilyMembers(sortedFamily);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
      setSnackbar({ open: true, message: t("fetchFailed", language) || "Failed to fetch data", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter family member requests only
  const getFilteredRequests = useCallback(() => {
    let filtered = familyMembers.map((f) => ({ ...f, _requestType: REQUEST_TYPES.FAMILY_MEMBER }));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const name = (r.fullName || "").toLowerCase();
        const nationalId = (r.nationalId || "").toLowerCase();
        const clientName = (r.clientFullName || "").toLowerCase();
        return name.includes(query) || nationalId.includes(query) || clientName.includes(query);
      });
    }

    // Apply date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((r) => r.createdAt && new Date(r.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => r.createdAt && new Date(r.createdAt) <= toDate);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return filtered;
  }, [familyMembers, searchQuery, dateFrom, dateTo]);

  const filteredRequests = getFilteredRequests();

  // Handlers
  const handleApprove = useCallback(
    async (request, requestType) => {
      setLoadingId(request.id);
      try {
        await api.patch(API_ENDPOINTS.FAMILY_MEMBERS.APPROVE(request.id), {});
        setFamilyMembers((prev) => prev.filter((f) => f.id !== request.id));
        setOpenFamilyDetailsDialog(false);
        setSnackbar({ open: true, message: `${request.fullName} ${t("approved", language) || "has been approved"}`, severity: "success" });
      } catch (err) {
        console.error("Approval failed:", err);
        setSnackbar({ open: true, message: t("approvalFailed", language) || "Approval failed", severity: "error" });
      } finally {
        setLoadingId(null);
      }
    },
    [language]
  );

  const handleRejectClick = useCallback((request, requestType) => {
    setSelectedRequest(request);
    setSelectedRequestType(requestType);
    setOpenRejectDialog(true);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      setSnackbar({ open: true, message: t("pleaseProvideReason", language) || "Please provide a reason", severity: "warning" });
      return;
    }

    setLoadingId(selectedRequest.id);
    try {
      await api.patch(API_ENDPOINTS.FAMILY_MEMBERS.REJECT(selectedRequest.id), { reason: rejectReason });
      setFamilyMembers((prev) => prev.filter((f) => f.id !== selectedRequest.id));
      setOpenFamilyDetailsDialog(false);
      setSnackbar({ open: true, message: `${selectedRequest.fullName} ${t("rejected", language) || "has been rejected"}`, severity: "info" });
      setOpenRejectDialog(false);
      setRejectReason("");
    } catch (err) {
      console.error("Rejection failed:", err);
      setSnackbar({ open: true, message: t("rejectFailed", language) || "Rejection failed", severity: "error" });
    } finally {
      setLoadingId(null);
    }
  }, [selectedRequest, rejectReason, language]);

  const handleViewDetails = useCallback((request, requestType) => {
    setSelectedRequest(request);
    setSelectedRequestType(requestType);
    setOpenFamilyDetailsDialog(true);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDateFrom(null);
    setDateTo(null);
  }, []);

  // Stats - Only family members now
  const totalPending = familyMembers.length;

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box dir={isRTL ? "rtl" : "ltr"} sx={{ flexGrow: 1, background: "linear-gradient(180deg, #FAF8F5 0%, #ffffff 100%)", minHeight: "100vh", marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" }, marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0, pt: { xs: "56px", sm: 0 }, transition: "margin 0.3s ease" }}>
        <Header />
        <Box sx={{ p: 4 }} dir={isRTL ? "rtl" : "ltr"}>
            {/* Page Title */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 3, background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PendingActionsIcon sx={{ fontSize: 35, color: "white" }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: "#3D4F23" }}>
                    {t("pendingFamilyMemberRequests", language) || "Pending Family Member Requests"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("reviewAndApproveFamilyRequests", language) || "Review and approve family member addition requests from clients"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Statistics Card */}
            <Paper sx={{ p: 3, mb: 3, borderLeft: "5px solid #556B2F", borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FamilyRestroomIcon sx={{ fontSize: 40, color: "#556B2F" }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t("pendingFamilyMemberRequests", language) || "Pending Family Member Requests"}
                  </Typography>
                  <Typography variant="h4" color="#556B2F" fontWeight="bold">
                    {totalPending}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                <TextField
                  placeholder={t("searchByNameNationalIdClient", language) || "Search by name, national ID, client name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  sx={{ flex: 1, minWidth: 250 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#7B8B5E" }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery("")}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant={showFilters ? "contained" : "outlined"}
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    borderColor: "#556B2F",
                    color: showFilters ? "white" : "#556B2F",
                    backgroundColor: showFilters ? "#556B2F" : "transparent",
                    "&:hover": { borderColor: "#3D4F23", backgroundColor: showFilters ? "#3D4F23" : "rgba(85, 107, 47, 0.1)" },
                  }}
                >
                  {t("filters", language) || "Filters"}
                </Button>
                {(searchQuery || dateFrom || dateTo) && (
                  <Button variant="text" startIcon={<ClearIcon />} onClick={clearFilters} sx={{ color: "#d32f2f" }}>
                    {t("clearFilters", language) || "Clear Filters"}
                  </Button>
                )}
              </Stack>

              {/* Date Filters */}
              {showFilters && (
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #E8EDE0" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="date"
                        label={t("fromDate", language) || "From Date"}
                        value={dateFrom || ""}
                        onChange={(e) => setDateFrom(e.target.value || null)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="date"
                        label={t("toDate", language) || "To Date"}
                        value={dateTo || ""}
                        onChange={(e) => setDateTo(e.target.value || null)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>

            {/* Requests List */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress sx={{ color: "#556B2F" }} />
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3, backgroundColor: "#FAF8F5" }}>
                <PendingActionsIcon sx={{ fontSize: 80, color: "#7B8B5E", mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" sx={{ color: "#3D4F23", mb: 1 }}>
                  {t("noPendingRequests", language) || "No Pending Requests"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t("allRequestsReviewed", language) || "All requests have been reviewed. Check back later for new submissions."}
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={`${request._requestType}-${request.id}`}
                    request={request}
                    requestType={request._requestType}
                    loadingId={loadingId}
                    onApprove={handleApprove}
                    onReject={handleRejectClick}
                    onViewDetails={handleViewDetails}
                    language={language}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Box>

        {/* Family Member Details Dialog */}
        <FamilyMemberDetailsDialog
          open={openFamilyDetailsDialog}
          member={selectedRequest}
          onClose={() => setOpenFamilyDetailsDialog(false)}
          onApprove={(member) => handleApprove(member, REQUEST_TYPES.FAMILY_MEMBER)}
          onReject={(member) => handleRejectClick(member, REQUEST_TYPES.FAMILY_MEMBER)}
          loadingId={loadingId}
          language={language}
          isRTL={isRTL}
        />

        {/* Reject Dialog */}
        <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t("rejectRequest", language) || "Reject Request"}</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              {t("provideReasonForRejecting", language) || "Please provide a reason for rejecting"} <strong>{selectedRequest?.fullName}</strong>:
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label={t("reason", language) || "Reason"}
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRejectDialog(false)}>{t("cancel", language) || "Cancel"}</Button>
            <Button color="error" variant="contained" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>
              {t("confirmReject", language) || "Confirm Reject"}
            </Button>
          </DialogActions>
        </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingRequests;
