import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Button,
  Divider,
  Grid,
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
  IconButton,
  Tooltip,
  InputAdornment,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Header from "../MedicalAdminHeader";
import Sidebar from "../MedicalAdminSidebar";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import BadgeIcon from "@mui/icons-material/Badge";
import ArticleIcon from "@mui/icons-material/Article";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../../config/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

// Request type constants
const REQUEST_TYPES = {
  CLIENT_REGISTRATION: "CLIENT_REGISTRATION",
  FAMILY_MEMBER: "FAMILY_MEMBER",
  ALL: "ALL",
};

const getUniversityCardSrc = (client) => {
  const imgs = client?.universityCardImages || [];
  const last = imgs[imgs.length - 1];
  return last ? `${API_BASE_URL}${last}?t=${client.updatedAt || Date.now()}` : null;
};

// Document Link Component
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
      <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#FFF8E1", border: "1px dashed #FFB74D", display: "flex", alignItems: "center", gap: 2 }}>
        {icon}
        <Typography variant="body2" color="text.secondary">
          {t("noDocumentUploaded", language) || "No document uploaded"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#F1F8E9", border: "1px solid #AED581", display: "flex", alignItems: "center", gap: 2 }}>
      {icon}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={500}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{filename}</Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Tooltip title={t("viewDocument", language) || "View Document"}>
          <IconButton onClick={() => handleFileAction("view")} disabled={loading} sx={{ color: "#556B2F", backgroundColor: "rgba(85, 107, 47, 0.1)", "&:hover": { backgroundColor: "rgba(85, 107, 47, 0.2)" } }}>
            {loading ? <CircularProgress size={18} /> : <OpenInNewIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t("downloadDocument", language) || "Download Document"}>
          <IconButton onClick={() => handleFileAction("download")} disabled={loading} sx={{ color: "#1976D2", backgroundColor: "rgba(25, 118, 210, 0.1)", "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" } }}>
            {loading ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
      <CheckCircleIcon sx={{ color: "#4CAF50" }} />
    </Box>
  );
});

// Family Member Details Dialog
const FamilyMemberDetailsDialog = memo(function FamilyMemberDetailsDialog({ open, member, onClose, onApprove, onReject, loadingId, language, isRTL }) {
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
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
          <Typography variant="body1" fontWeight={500}>{value || "-"}</Typography>
        </Box>
      </Box>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "90vh" } }}>
      <Box sx={{ background: "linear-gradient(135deg, #7B8B5E 0%, #556B2F 100%)", p: 3, color: "white", position: "relative" }}>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 16, top: 16, color: "white", backgroundColor: "rgba(255,255,255,0.1)", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ p: 2, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FamilyRestroomIcon sx={{ fontSize: 50, color: "white" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">{member.fullName}</Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <Chip label={getRelationLabel(member.relation)} size="small" sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }} />
              <Chip label={t("familyMemberAddition", language) || "Family Member Addition"} size="small" sx={{ backgroundColor: "rgba(255, 193, 7, 0.3)", color: "white", fontWeight: 600 }} />
            </Stack>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, overflow: "auto" }} dir={isRTL ? "rtl" : "ltr"}>
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

        {member.documentImages && member.documentImages.length > 0 && (
          <Box sx={{ p: 3, backgroundColor: "#fff" }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <ArticleIcon sx={{ color: "#556B2F" }} />
              {t("submittedDocuments", language) || "Submitted Documents"}
            </Typography>
            <Stack spacing={2}>
              {member.documentImages.map((doc, index) => (
                <DocumentLink key={index} filename={doc} label={`${t("document", language) || "Document"} ${index + 1}`} icon={<ArticleIcon sx={{ color: "#556B2F" }} />} language={language} endpoint={API_ENDPOINTS.FAMILY_MEMBERS.FILE(doc)} />
              ))}
            </Stack>
          </Box>
        )}

        <Box sx={{ p: 3, backgroundColor: "#FAFAFA" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CalendarTodayIcon sx={{ color: "#556B2F" }} />
            <Box>
              <Typography variant="caption" color="text.secondary">{t("submittedOn", language) || "Submitted On"}</Typography>
              <Typography variant="body1" fontWeight={500}>{member.createdAt ? new Date(member.createdAt).toLocaleString() : "-"}</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

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

const PendingRequestsClients = () => {
  const { language, isRTL } = useLanguage();

  // Data states
  const [clientRegistrations, setClientRegistrations] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterType, setFilterType] = useState(REQUEST_TYPES.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("dateDesc");

  // View and pagination states
  const [viewMode, setViewMode] = useState("cards");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [5, 10, 25, 50, 100];

  // Dialog states
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [openFamilyDetailsDialog, setOpenFamilyDetailsDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [openFamilyDialog, setOpenFamilyDialog] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [clientFamilyMembers, setClientFamilyMembers] = useState([]);

  const [loadingId, setLoadingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Sort options
  const sortOptions = [
    { value: "dateDesc", label: t("newestFirst", language) || "Newest First" },
    { value: "dateAsc", label: t("oldestFirst", language) || "Oldest First" },
    { value: "nameAsc", label: t("nameAZ", language) || "Name (A-Z)" },
    { value: "nameDesc", label: t("nameZA", language) || "Name (Z-A)" },
  ];

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const clientRes = await api.get(API_ENDPOINTS.CLIENTS.LIST);
      const clientData = Array.isArray(clientRes) ? clientRes : (clientRes?.data || []);
      const filteredClients = clientData.filter(
        (u) => u.roleRequestStatus === "PENDING" && u.requestedRole?.toUpperCase() === "INSURANCE_CLIENT"
      );
      const sortedClients = filteredClients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setClientRegistrations(sortedClients);

      const familyRes = await api.get(API_ENDPOINTS.FAMILY_MEMBERS.PENDING).catch(() => []);
      const familyData = Array.isArray(familyRes) ? familyRes : (familyRes?.data || []);
      const sortedFamily = familyData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

  // Get unique faculties for filter
  const uniqueFaculties = useMemo(() => {
    const faculties = [...new Set(clientRegistrations.map(c => c.faculty).filter(Boolean))];
    return faculties.sort();
  }, [clientRegistrations]);

  // Filter and sort logic
  const getFilteredData = useMemo(() => {
    let clients = [...clientRegistrations];
    let family = [...familyMembers];

    // Type filter
    if (filterType === REQUEST_TYPES.CLIENT_REGISTRATION) {
      family = [];
    } else if (filterType === REQUEST_TYPES.FAMILY_MEMBER) {
      clients = [];
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      clients = clients.filter(c =>
        (c.fullName || "").toLowerCase().includes(query) ||
        (c.email || "").toLowerCase().includes(query) ||
        (c.employeeId || "").toLowerCase().includes(query) ||
        (c.nationalId || "").toLowerCase().includes(query)
      );
      family = family.filter(f =>
        (f.fullName || "").toLowerCase().includes(query) ||
        (f.nationalId || "").toLowerCase().includes(query) ||
        (f.clientFullName || "").toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (genderFilter !== "all") {
      clients = clients.filter(c => c.gender === genderFilter);
      family = family.filter(f => f.gender === genderFilter);
    }

    // Faculty filter (only for clients)
    if (facultyFilter !== "all") {
      clients = clients.filter(c => c.faculty === facultyFilter);
    }

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      clients = clients.filter(c => new Date(c.createdAt) >= fromDate);
      family = family.filter(f => new Date(f.createdAt || 0) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      clients = clients.filter(c => new Date(c.createdAt) <= toDate);
      family = family.filter(f => new Date(f.createdAt || 0) <= toDate);
    }

    // Sort
    const sortFn = (a, b) => {
      switch (sortBy) {
        case "dateAsc":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "nameAsc":
          return (a.fullName || "").localeCompare(b.fullName || "");
        case "nameDesc":
          return (b.fullName || "").localeCompare(a.fullName || "");
        default: // dateDesc
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    };

    clients.sort(sortFn);
    family.sort(sortFn);

    return { clients, family };
  }, [clientRegistrations, familyMembers, filterType, searchQuery, genderFilter, facultyFilter, dateFrom, dateTo, sortBy]);

  const { clients: filteredClients, family: filteredFamily } = getFilteredData;

  // Check active filters
  const hasActiveFilters = searchQuery || genderFilter !== "all" || facultyFilter !== "all" || dateFrom || dateTo || sortBy !== "dateDesc";

  const activeFilterCount = [searchQuery, genderFilter !== "all", facultyFilter !== "all", dateFrom || dateTo, sortBy !== "dateDesc"].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setGenderFilter("all");
    setFacultyFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("dateDesc");
    setPage(0);
  }, []);

  const totalCount = clientRegistrations.length + familyMembers.length;
  const filteredTotal = filteredClients.length + filteredFamily.length;

  // Handlers
  const handleApproveClient = async (client) => {
    setLoadingId(client.id);
    try {
      await api.patch(`/api/clients/${client.id}/role-requests/approve`);
      setClientRegistrations((prev) => prev.filter((c) => c.id !== client.id));
      setSnackbar({ open: true, message: t("requestApprovedFor", language).replace("{name}", client.fullName), severity: "success" });
    } catch (err) {
      console.error("Approval failed:", err.response?.data || err.message);
      setSnackbar({ open: true, message: t("approvalFailed", language), severity: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleApproveFamilyMember = async (member) => {
    setLoadingId(member.id);
    try {
      await api.patch(API_ENDPOINTS.FAMILY_MEMBERS.APPROVE(member.id), {});
      setFamilyMembers((prev) => prev.filter((f) => f.id !== member.id));
      setOpenFamilyDetailsDialog(false);
      setSnackbar({ open: true, message: `${member.fullName} ${t("approved", language) || "has been approved"}`, severity: "success" });
    } catch (err) {
      console.error("Approval failed:", err);
      setSnackbar({ open: true, message: t("approvalFailed", language), severity: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectClick = (request, type) => {
    setSelectedRequest(request);
    setSelectedRequestType(type);
    setOpenRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    setLoadingId(selectedRequest.id);
    try {
      if (selectedRequestType === REQUEST_TYPES.CLIENT_REGISTRATION) {
        await api.patch(API_ENDPOINTS.CLIENTS.REJECT(selectedRequest.id), { reason: rejectReason });
        setClientRegistrations((prev) => prev.filter((c) => c.id !== selectedRequest.id));
      } else {
        await api.patch(API_ENDPOINTS.FAMILY_MEMBERS.REJECT(selectedRequest.id), { reason: rejectReason });
        setFamilyMembers((prev) => prev.filter((f) => f.id !== selectedRequest.id));
      }
      setOpenFamilyDetailsDialog(false);
      setSnackbar({ open: true, message: t("requestRejectedFor", language).replace("{name}", selectedRequest.fullName), severity: "info" });
    } catch (err) {
      console.error("Reject failed:", err.response?.status, err.response?.data || err.message);
      setSnackbar({ open: true, message: err.response?.status === 401 ? t("unauthorizedLoginAgain", language) : t("rejectFailedServerError", language), severity: "error" });
    } finally {
      setLoadingId(null);
      setOpenRejectDialog(false);
      setRejectReason("");
    }
  };

  const fetchClientFamily = async (client) => {
    setSelectedRequest(client);
    setOpenFamilyDialog(true);
    setFamilyLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.FAMILY_MEMBERS.BY_CLIENT(client.id));
      setClientFamilyMembers(res.data || res || []);
    } catch (err) {
      console.error("Failed to fetch family:", err);
      setClientFamilyMembers([]);
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleViewFamilyDetails = (member) => {
    setSelectedRequest(member);
    setOpenFamilyDetailsDialog(true);
  };

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

  // Render client card
  const renderClientCard = (client) => (
    <Card key={client.id} sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderLeft: "6px solid #1E8EAB", mb: 3, transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" } }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar src={getUniversityCardSrc(client)} sx={{ width: 56, height: 56, bgcolor: "#1E8EAB" }}>{client.fullName?.charAt(0)}</Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23" }}>{client.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">{client.employeeId}</Typography>
            </Box>
          </Box>
          <Chip label={t("clientRegistration", language) || "Client Registration"} size="small" sx={{ bgcolor: "#E3F2FD", color: "#1565C0" }} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2" noWrap>{client.email}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BadgeIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2">{client.nationalId}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WcIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2">{client.gender}</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              {client.faculty && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SchoolIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                  <Typography variant="body2">{client.faculty}</Typography>
                </Box>
              )}
              {client.department && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WorkIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                  <Typography variant="body2">{client.department}</Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarTodayIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2">{new Date(client.createdAt).toLocaleDateString()}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button variant="outlined" size="small" startIcon={<FamilyRestroomIcon />} onClick={() => fetchClientFamily(client)} sx={{ textTransform: "none" }}>
            {t("viewFamily", language) || "View Family"}
          </Button>
          <Button variant="contained" size="small" color="success" startIcon={loadingId === client.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />} onClick={() => handleApproveClient(client)} disabled={loadingId === client.id} sx={{ textTransform: "none" }}>
            {t("approve", language) || "Approve"}
          </Button>
          <Button variant="outlined" size="small" color="error" startIcon={<CancelIcon />} onClick={() => handleRejectClick(client, REQUEST_TYPES.CLIENT_REGISTRATION)} disabled={loadingId === client.id} sx={{ textTransform: "none" }}>
            {t("reject", language) || "Reject"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  // Render family member card
  const renderFamilyCard = (member) => (
    <Card key={member.id} sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderLeft: "6px solid #7B8B5E", mb: 3, transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" } }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, background: "linear-gradient(135deg, #7B8B5E 0%, #556B2F 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FamilyRestroomIcon sx={{ fontSize: 30, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23" }}>{member.fullName}</Typography>
              <Stack direction="row" spacing={1} mt={0.5}>
                <Chip label={getRelationLabel(member.relation)} size="small" sx={{ backgroundColor: "#556B2F", color: "white", fontWeight: "bold" }} />
              </Stack>
            </Box>
          </Box>
          <Chip label={t("familyMember", language) || "Family Member"} size="small" sx={{ bgcolor: "#FFF3E0", color: "#E65100" }} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BadgeIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2">{member.nationalId}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2">{t("parentClient", language) || "Parent"}: {member.clientFullName || "-"}</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CakeIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : "-"}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarTodayIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                <Typography variant="body2">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-"}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewFamilyDetails(member)} sx={{ textTransform: "none", borderColor: "#556B2F", color: "#556B2F" }}>
            {t("viewDetails", language) || "View Details"}
          </Button>
          <Button variant="contained" size="small" color="success" startIcon={loadingId === member.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />} onClick={() => handleApproveFamilyMember(member)} disabled={loadingId === member.id} sx={{ textTransform: "none" }}>
            {t("approve", language) || "Approve"}
          </Button>
          <Button variant="outlined" size="small" color="error" startIcon={<CancelIcon />} onClick={() => handleRejectClick(member, REQUEST_TYPES.FAMILY_MEMBER)} disabled={loadingId === member.id} sx={{ textTransform: "none" }}>
            {t("reject", language) || "Reject"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  // Combined data for pagination
  const combinedData = useMemo(() => {
    const clientsWithType = filteredClients.map(c => ({ ...c, _type: "client" }));
    const familyWithType = filteredFamily.map(f => ({ ...f, _type: "family" }));
    return [...clientsWithType, ...familyWithType];
  }, [filteredClients, filteredFamily]);

  const paginatedData = combinedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, backgroundColor: "#FAF8F5", minHeight: "100vh", marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" }, marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0, pt: { xs: "56px", sm: 0 }, transition: "margin 0.3s ease" }}>
        <Header />
        <Box sx={{ p: 3 }}>
          {/* Page Title */}
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#3D4F23", display: "flex", alignItems: "center" }}>
            <GroupAddIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 35, color: "#556B2F" }} />
            {t("pendingRequests", language) || "Pending Requests"}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t("reviewManageClientRequests", language) || "Review and manage pending client and family member requests"}
          </Typography>

          {/* Search and Filter Bar */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" placeholder={t("searchByNameEmailId", language) || "Search by name, email, ID..."} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#7B8B5E" }} /></InputAdornment>,
                    endAdornment: searchQuery && <InputAdornment position="end"><IconButton size="small" onClick={() => { setSearchQuery(""); setPage(0); }}><ClearIcon fontSize="small" /></IconButton></InputAdornment>,
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAFAFA" } }}
                />
              </Grid>

              {/* Gender Filter */}
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("gender", language) || "Gender"}</InputLabel>
                  <Select value={genderFilter} label={t("gender", language) || "Gender"} onChange={(e) => { setGenderFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}>
                    <MenuItem value="all">{t("all", language) || "All"}</MenuItem>
                    <MenuItem value="MALE">{t("male", language) || "Male"}</MenuItem>
                    <MenuItem value="FEMALE">{t("female", language) || "Female"}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort */}
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("sortBy", language) || "Sort By"}</InputLabel>
                  <Select value={sortBy} label={t("sortBy", language) || "Sort By"} onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}>
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Filters Toggle */}
              <Grid item xs={6} md={2}>
                <Button fullWidth variant={showFilters ? "contained" : "outlined"} startIcon={<FilterListIcon />} endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setShowFilters(!showFilters)}
                  sx={{ borderRadius: 2, textTransform: "none", bgcolor: showFilters ? "#556B2F" : "transparent", borderColor: "#556B2F", color: showFilters ? "#fff" : "#556B2F", "&:hover": { bgcolor: showFilters ? "#3D4F23" : "rgba(85, 107, 47, 0.1)", borderColor: "#3D4F23" } }}>
                  {t("filters", language) || "Filters"} {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </Grid>

              {/* Clear Filters */}
              <Grid item xs={6} md={2}>
                <Button fullWidth variant="outlined" startIcon={<ClearIcon />} onClick={clearAllFilters} disabled={!hasActiveFilters}
                  sx={{ borderRadius: 2, textTransform: "none", borderColor: "#D32F2F", color: "#D32F2F", "&:hover": { bgcolor: "rgba(211, 47, 47, 0.1)", borderColor: "#B71C1C" }, "&:disabled": { borderColor: "#BDBDBD", color: "#BDBDBD" } }}>
                  {t("clearAll", language) || "Clear All"}
                </Button>
              </Grid>
            </Grid>

            {/* Advanced Filters */}
            <Collapse in={showFilters}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {/* Faculty Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("faculty", language) || "Faculty"}</InputLabel>
                    <Select value={facultyFilter} label={t("faculty", language) || "Faculty"} onChange={(e) => { setFacultyFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                      <MenuItem value="all">{t("all", language) || "All"}</MenuItem>
                      {uniqueFaculties.map((faculty) => (
                        <MenuItem key={faculty} value={faculty}>{faculty}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date From */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" type="date" label={t("submittedFrom", language) || "Submitted From"} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>

                {/* Date To */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" type="date" label={t("submittedTo", language) || "Submitted To"} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Filter Chips */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "#1e293b", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
              {t("filterByType", language) || "Filter by Type"}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${t("all", language) || "All"} (${totalCount})`} onClick={() => { setFilterType(REQUEST_TYPES.ALL); setPage(0); }} variant={filterType === REQUEST_TYPES.ALL ? "filled" : "outlined"} color={filterType === REQUEST_TYPES.ALL ? "primary" : "default"} sx={{ fontWeight: 600, borderRadius: 2, cursor: "pointer" }} icon={<GroupAddIcon />} />
              <Chip label={`${t("clientRegistrations", language) || "Client Registrations"} (${clientRegistrations.length})`} onClick={() => { setFilterType(REQUEST_TYPES.CLIENT_REGISTRATION); setPage(0); }} variant={filterType === REQUEST_TYPES.CLIENT_REGISTRATION ? "filled" : "outlined"} color={filterType === REQUEST_TYPES.CLIENT_REGISTRATION ? "success" : "default"} sx={{ fontWeight: 600, borderRadius: 2, cursor: "pointer" }} icon={<PersonAddIcon />} />
              <Chip label={`${t("familyMemberRequests", language) || "Family Member Requests"} (${familyMembers.length})`} onClick={() => { setFilterType(REQUEST_TYPES.FAMILY_MEMBER); setPage(0); }} variant={filterType === REQUEST_TYPES.FAMILY_MEMBER ? "filled" : "outlined"} color={filterType === REQUEST_TYPES.FAMILY_MEMBER ? "warning" : "default"} sx={{ fontWeight: 600, borderRadius: 2, cursor: "pointer" }} icon={<FamilyRestroomIcon />} />
            </Stack>
          </Paper>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#6B7280", mr: 1 }}>{t("activeFilters", language) || "Active filters"}:</Typography>
              {searchQuery && <Chip size="small" label={`Search: "${searchQuery}"`} onDelete={() => setSearchQuery("")} sx={{ bgcolor: "#E8F5E9" }} />}
              {genderFilter !== "all" && <Chip size="small" label={`Gender: ${genderFilter}`} onDelete={() => setGenderFilter("all")} sx={{ bgcolor: "#E3F2FD" }} />}
              {facultyFilter !== "all" && <Chip size="small" label={`Faculty: ${facultyFilter}`} onDelete={() => setFacultyFilter("all")} sx={{ bgcolor: "#FFF3E0" }} />}
              {(dateFrom || dateTo) && <Chip size="small" label={`Date: ${dateFrom || "..."} to ${dateTo || "..."}`} onDelete={() => { setDateFrom(""); setDateTo(""); }} sx={{ bgcolor: "#FFEBEE" }} />}
            </Box>
          )}

          {/* Results Count and View Controls */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              {t("showing", language) || "Showing"} <b>{Math.min(rowsPerPage, filteredTotal - page * rowsPerPage)}</b> {t("of", language) || "of"} <b>{filteredTotal}</b> {t("requests", language) || "requests"}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Rows per page */}
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>{t("perPage", language) || "Per Page"}</InputLabel>
                <Select value={rowsPerPage} label={t("perPage", language) || "Per Page"} onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}>
                  {rowsPerPageOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* View mode toggle */}
              <Stack direction="row" sx={{ bgcolor: "#f1f5f9", borderRadius: 2, p: 0.5 }}>
                <Tooltip title={t("tableView", language) || "Table View"}>
                  <IconButton onClick={() => setViewMode("table")} sx={{ bgcolor: viewMode === "table" ? "#556B2F" : "transparent", color: viewMode === "table" ? "#fff" : "#6B7280", "&:hover": { bgcolor: viewMode === "table" ? "#3D4F23" : "#e2e8f0" }, borderRadius: 1.5 }}>
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("cardView", language) || "Card View"}>
                  <IconButton onClick={() => setViewMode("cards")} sx={{ bgcolor: viewMode === "cards" ? "#556B2F" : "transparent", color: viewMode === "cards" ? "#fff" : "#6B7280", "&:hover": { bgcolor: viewMode === "cards" ? "#3D4F23" : "#e2e8f0" }, borderRadius: 1.5 }}>
                    <ViewModuleIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: "#556B2F" }} />
            </Box>
          ) : filteredTotal === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <SearchIcon sx={{ fontSize: 60, color: "#BDBDBD", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t("noPendingRequestsFound", language) || "No pending requests found"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hasActiveFilters ? t("noResultsForSearch", language) || "No results match your search criteria" : t("noPendingRoleRequests", language) || "There are no pending requests at this time"}
              </Typography>
              {hasActiveFilters && (
                <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearAllFilters} sx={{ mt: 2, textTransform: "none" }}>
                  {t("clearAllFilters", language) || "Clear all filters"}
                </Button>
              )}
            </Paper>
          ) : viewMode === "table" ? (
            /* TABLE VIEW */
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#556B2F" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("type", language) || "Type"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("name", language) || "Name"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("nationalId", language) || "National ID"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("details", language) || "Details"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("submittedDate", language) || "Submitted"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>{t("actions", language) || "Actions"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Chip label={item._type === "client" ? t("client", language) || "Client" : t("family", language) || "Family"} size="small" sx={{ bgcolor: item._type === "client" ? "#E3F2FD" : "#FFF3E0", color: item._type === "client" ? "#1565C0" : "#E65100" }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: item._type === "client" ? "#1E8EAB" : "#556B2F" }}>{item.fullName?.charAt(0)}</Avatar>
                          <Box>
                            <Typography fontWeight="500">{item.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{item._type === "client" ? item.email : getRelationLabel(item.relation)}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{item.nationalId}</TableCell>
                      <TableCell>
                        {item._type === "client" ? (
                          <Typography variant="body2">{item.faculty || "N/A"}</Typography>
                        ) : (
                          <Typography variant="body2">{t("parentClient", language) || "Parent"}: {item.clientFullName || "-"}</Typography>
                        )}
                      </TableCell>
                      <TableCell>{new Date(item.createdAt || 0).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {item._type === "client" ? (
                            <Tooltip title={t("viewFamily", language) || "View Family"}>
                              <IconButton size="small" onClick={() => fetchClientFamily(item)} sx={{ color: "#1976D2" }}>
                                <FamilyRestroomIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={t("viewDetails", language) || "View Details"}>
                              <IconButton size="small" onClick={() => handleViewFamilyDetails(item)} sx={{ color: "#556B2F" }}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={t("approve", language) || "Approve"}>
                            <IconButton size="small" onClick={() => item._type === "client" ? handleApproveClient(item) : handleApproveFamilyMember(item)} disabled={loadingId === item.id} sx={{ color: "#4CAF50" }}>
                              {loadingId === item.id ? <CircularProgress size={18} /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("reject", language) || "Reject"}>
                            <IconButton size="small" onClick={() => handleRejectClick(item, item._type === "client" ? REQUEST_TYPES.CLIENT_REGISTRATION : REQUEST_TYPES.FAMILY_MEMBER)} disabled={loadingId === item.id} sx={{ color: "#F44336" }}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* CARD VIEW */
            <>
              {paginatedData.map((item) => (
                item._type === "client" ? renderClientCard(item) : renderFamilyCard(item)
              ))}
            </>
          )}

          {/* Pagination */}
          {filteredTotal > 0 && (
            <Paper sx={{ mt: 3, p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("page", language) || "Page"} {page + 1} {t("of", language) || "of"} {Math.ceil(filteredTotal / rowsPerPage)} ({filteredTotal} {t("total", language) || "total"})
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={t("firstPage", language) || "First Page"}>
                  <span><IconButton onClick={() => setPage(0)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><FirstPageIcon /></IconButton></span>
                </Tooltip>
                <Tooltip title={t("previousPage", language) || "Previous"}>
                  <span><IconButton onClick={() => setPage(page - 1)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateBeforeIcon /></IconButton></span>
                </Tooltip>

                {Array.from({ length: Math.min(5, Math.ceil(filteredTotal / rowsPerPage)) }, (_, i) => {
                  const totalPages = Math.ceil(filteredTotal / rowsPerPage);
                  let pageNum;
                  if (totalPages <= 5) { pageNum = i; }
                  else if (page < 3) { pageNum = i; }
                  else if (page > totalPages - 4) { pageNum = totalPages - 5 + i; }
                  else { pageNum = page - 2 + i; }
                  return (
                    <Button key={pageNum} variant={page === pageNum ? "contained" : "outlined"} size="small" onClick={() => setPage(pageNum)}
                      sx={{ minWidth: 36, bgcolor: page === pageNum ? "#556B2F" : "transparent", borderColor: "#556B2F", color: page === pageNum ? "#fff" : "#556B2F", "&:hover": { bgcolor: page === pageNum ? "#3D4F23" : "rgba(85, 107, 47, 0.1)" } }}>
                      {pageNum + 1}
                    </Button>
                  );
                })}

                <Tooltip title={t("nextPage", language) || "Next"}>
                  <span><IconButton onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(filteredTotal / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateNextIcon /></IconButton></span>
                </Tooltip>
                <Tooltip title={t("lastPage", language) || "Last Page"}>
                  <span><IconButton onClick={() => setPage(Math.ceil(filteredTotal / rowsPerPage) - 1)} disabled={page >= Math.ceil(filteredTotal / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><LastPageIcon /></IconButton></span>
                </Tooltip>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>{t("rejectRequest", language) || "Reject Request"}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("pleaseProvideReasonRejecting", language) || "Please provide a reason for rejecting"} <strong>{selectedRequest?.fullName}</strong>:
          </Typography>
          <TextField autoFocus margin="dense" label={t("reasonLabel", language) || "Reason"} type="text" fullWidth variant="outlined" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>{t("cancel", language) || "Cancel"}</Button>
          <Button color="error" variant="contained" onClick={handleRejectConfirm}>{t("confirmReject", language) || "Confirm Reject"}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Image Preview Dialog */}
      <Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)} maxWidth="md">
        <DialogTitle>{t("documentPreview", language) || "Document Preview"}</DialogTitle>
        <DialogContent dividers>
          {previewImage && <img src={previewImage} alt={t("documentPreview", language) || "Document Preview"} style={{ width: "100%", height: "auto", borderRadius: "10px" }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)} color="primary">{t("close", language) || "Close"}</Button>
        </DialogActions>
      </Dialog>

      {/* Client Family Members Dialog */}
      <Dialog open={openFamilyDialog} onClose={() => setOpenFamilyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t("familyMembersOf", language) || "Family Members of"} {selectedRequest?.fullName}</DialogTitle>
        <DialogContent dividers>
          {familyLoading ? (
            <Box textAlign="center" py={3}><CircularProgress /></Box>
          ) : clientFamilyMembers.length === 0 ? (
            <Typography color="text.secondary">{t("noFamilyMembers", language) || "No family members found"}</Typography>
          ) : (
            <Stack spacing={2}>
              {clientFamilyMembers.map((member) => (
                <Paper key={member.id} sx={{ p: 2, borderRadius: 2 }}>
                  <Typography fontWeight="bold">{member.fullName}</Typography>
                  <Typography variant="body2"><b>{t("relationLabel", language) || "Relation:"}</b> {member.relation}</Typography>
                  <Typography variant="body2"><b>{t("nationalIdLabel", language) || "National ID:"}</b> {member.nationalId}</Typography>
                  <Typography variant="body2"><b>{t("insuranceNumberLabel", language) || "Insurance Number:"}</b> {member.insuranceNumber || t("notAssigned", language) || "Not assigned"}</Typography>
                  <Typography variant="body2"><b>{t("dateOfBirthLabel", language) || "Date of Birth:"}</b> {member.dateOfBirth}</Typography>
                  <Chip label={member.status} color={member.status === "APPROVED" ? "success" : member.status === "REJECTED" ? "error" : "warning"} size="small" sx={{ mt: 1 }} />
                  <Divider sx={{ my: 1 }} />
                  {member.documentImages && member.documentImages.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {member.documentImages.map((imagePath, index) => (
                        <Avatar key={index} src={`${API_BASE_URL}${imagePath}`} variant="rounded" sx={{ width: 80, height: 80, cursor: "pointer", border: "1px solid #ddd" }} onClick={() => { setPreviewImage(`${API_BASE_URL}${imagePath}`); setOpenImageDialog(true); }} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">{t("noDocumentsUploaded", language) || "No documents uploaded"}</Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFamilyDialog(false)}>{t("close", language) || "Close"}</Button>
        </DialogActions>
      </Dialog>

      {/* Family Member Details Dialog */}
      <FamilyMemberDetailsDialog open={openFamilyDetailsDialog} member={selectedRequest} onClose={() => setOpenFamilyDetailsDialog(false)} onApprove={handleApproveFamilyMember} onReject={(m) => handleRejectClick(m, REQUEST_TYPES.FAMILY_MEMBER)} loadingId={loadingId} language={language} isRTL={isRTL} />
    </Box>
  );
};

export default PendingRequestsClients;
