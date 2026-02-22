// src/Component/MedicalAdmin/MedicalClaimsReview.jsx
// Table view with View Details, Approve, and Reject actions
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  Tooltip,
  Slider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import Header from "../MedicalAdmin/MedicalAdminHeader";
import Sidebar from "../MedicalAdmin/MedicalAdminSidebar";

// Icons
import ScienceIcon from "@mui/icons-material/Science";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MedicationIcon from "@mui/icons-material/Medication";
import BiotechIcon from "@mui/icons-material/Biotech";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SortIcon from "@mui/icons-material/Sort";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RefreshIcon from "@mui/icons-material/Refresh";
import TuneIcon from "@mui/icons-material/Tune";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";

// Import utilities
import api from "../../utils/apiService";
import { API_ENDPOINTS, CURRENCY, API_BASE_URL } from "../../config/api";
import { CLAIM_STATUS, isValidTransition } from "../../config/claimStateMachine";
import { ROLES } from "../../config/roles";
import { sanitizeString } from "../../utils/sanitize";
import { timeSince, safeJsonParse } from "../../utils/helpers";
import { useLanguage } from "../../context/LanguageContext";
import logger from "../../utils/logger";
import { t } from "../../config/translations";

const MedicalClaimsReview = () => {
  const { language, isRTL } = useLanguage();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openFilesModal, setOpenFilesModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // ==========================================
  // DIAGNOSIS EDITING STATES
  // ==========================================
  const [editedDiagnosis, setEditedDiagnosis] = useState("");
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [openSaveDiagnosisDialog, setOpenSaveDiagnosisDialog] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecializationId, setSelectedSpecializationId] = useState("");
  const [isSavingDiagnosis, setIsSavingDiagnosis] = useState(false);

  // ==========================================
  // ADVANCED FILTER STATES
  // ==========================================
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountRange, setAmountRange] = useState([0, 1000]);
  const [maxAmount, setMaxAmount] = useState(1000);
  const [showReturnedOnly, setShowReturnedOnly] = useState(false);
  const [showFollowUpOnly, setShowFollowUpOnly] = useState(false);

  // View mode and pagination states
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [5, 10, 25, 50, 100];

  // Tabs Configuration
  const claimTabs = useMemo(() => [
    { label: t("doctorClaims", language), role: ROLES.DOCTOR, icon: <LocalHospitalIcon /> },
    { label: t("pharmacyClaims", language), role: ROLES.PHARMACIST, icon: <MedicationIcon /> },
    { label: t("labClaims", language), role: ROLES.LAB_TECH, icon: <BiotechIcon /> },
    { label: t("radiologyClaims", language), role: ROLES.RADIOLOGIST, icon: <MonitorHeartIcon /> },
    { label: t("clientClaims", language), role: ROLES.INSURANCE_CLIENT, icon: <PersonIcon /> },
  ], [language]);

  // Status options for filter
  const statusOptions = useMemo(() => [
    { value: "all", label: "All Statuses" },
    { value: "PENDING_MEDICAL", label: "Pending Medical Review" },
    { value: "PENDING", label: "Pending" },
    { value: "RETURNED_FOR_REVIEW", label: "Returned for Review" },
  ], []);

  // Sort options
  const sortOptions = useMemo(() => [
    { value: "dateDesc", label: "Newest First" },
    { value: "dateAsc", label: "Oldest First" },
    { value: "amountDesc", label: "Highest Amount" },
    { value: "amountAsc", label: "Lowest Amount" },
    { value: "clientName", label: "Client Name (A-Z)" },
    { value: "providerName", label: "Provider Name (A-Z)" },
  ], []);

  // Fetch pending medical claims
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.HEALTHCARE_CLAIMS.MEDICAL_REVIEW);
      const claimsData = res || [];
      setClaims(claimsData);

      // Calculate max amount for slider
      if (claimsData.length > 0) {
        const max = Math.max(...claimsData.map(c => c.amount || 0));
        setMaxAmount(Math.ceil(max / 100) * 100 || 1000);
        setAmountRange([0, Math.ceil(max / 100) * 100 || 1000]);
      }
    } catch (err) {
      logger.error("Failed to load claims:", err);
      setSnackbar({
        open: true,
        message: t("failedToLoadClaims", language),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Fetch specializations for diagnosis saving
  const fetchSpecializations = useCallback(async () => {
    try {
      const res = await api.get("/api/doctor-specializations/list");
      setSpecializations(res || []);
    } catch (err) {
      logger.error("Failed to load specializations:", err);
    }
  }, []);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  // Save custom diagnosis to specialization
  const saveDiagnosisToSystem = useCallback(async () => {
    if (!selectedSpecializationId || !editedDiagnosis.trim()) {
      setSnackbar({
        open: true,
        message: t("selectSpecializationAndDiagnosis", language) || "Please select a specialization and enter a diagnosis",
        severity: "warning",
      });
      return;
    }

    setIsSavingDiagnosis(true);
    try {
      const res = await api.post(`/api/doctor-specializations/${selectedSpecializationId}/diagnoses`, {
        diagnosis: editedDiagnosis.trim(),
      });

      if (res.alreadyExists) {
        setSnackbar({
          open: true,
          message: t("diagnosisAlreadyExists", language) || "This diagnosis already exists in the specialization",
          severity: "info",
        });
      } else {
        setSnackbar({
          open: true,
          message: t("diagnosisSavedSuccessfully", language) || "Diagnosis saved to specialization successfully",
          severity: "success",
        });
        // Refresh specializations list
        fetchSpecializations();
      }
      setOpenSaveDiagnosisDialog(false);
      setSelectedSpecializationId("");
    } catch (err) {
      logger.error("Failed to save diagnosis:", err);
      setSnackbar({
        open: true,
        message: t("failedToSaveDiagnosis", language) || "Failed to save diagnosis",
        severity: "error",
      });
    } finally {
      setIsSavingDiagnosis(false);
    }
  }, [selectedSpecializationId, editedDiagnosis, language, fetchSpecializations]);

  // Check if diagnosis is custom (not in any specialization)
  const isCustomDiagnosis = useCallback((diagnosis) => {
    if (!diagnosis || !specializations.length) return false;
    const normalizedDiagnosis = diagnosis.toLowerCase().trim();
    return !specializations.some(spec =>
      spec.diagnoses?.some(d => d.toLowerCase().trim() === normalizedDiagnosis)
    );
  }, [specializations]);

  // Check if claim is returned by coordinator
  const isReturnedByCoordinator = useCallback((claim) => {
    return claim?.status === CLAIM_STATUS.RETURNED_FOR_REVIEW;
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("dateDesc");
    setDateFrom("");
    setDateTo("");
    setAmountRange([0, maxAmount]);
    setShowReturnedOnly(false);
    setShowFollowUpOnly(false);
    setPage(0);
  }, [maxAmount]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== "" ||
      statusFilter !== "all" ||
      sortBy !== "dateDesc" ||
      dateFrom !== "" ||
      dateTo !== "" ||
      amountRange[0] !== 0 ||
      amountRange[1] !== maxAmount ||
      showReturnedOnly ||
      showFollowUpOnly
    );
  }, [searchQuery, statusFilter, sortBy, dateFrom, dateTo, amountRange, maxAmount, showReturnedOnly, showFollowUpOnly]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== "all") count++;
    if (sortBy !== "dateDesc") count++;
    if (dateFrom || dateTo) count++;
    if (amountRange[0] !== 0 || amountRange[1] !== maxAmount) count++;
    if (showReturnedOnly) count++;
    if (showFollowUpOnly) count++;
    return count;
  }, [searchQuery, statusFilter, sortBy, dateFrom, dateTo, amountRange, maxAmount, showReturnedOnly, showFollowUpOnly]);

  // Get filtered and sorted claims for current tab
  const filteredClaims = useMemo(() => {
    const currentRole = claimTabs[selectedTab]?.role;
    if (!currentRole) return [];

    let result = claims.filter((c) => c.providerRole === currentRole);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) =>
        (c.clientName || "").toLowerCase().includes(query) ||
        (c.providerName || "").toLowerCase().includes(query) ||
        (c.diagnosis || "").toLowerCase().includes(query) ||
        (c.description || "").toLowerCase().includes(query) ||
        (c.id || "").toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Apply date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter((c) => new Date(c.serviceDate) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((c) => new Date(c.serviceDate) <= toDate);
    }

    // Apply amount range filter
    result = result.filter((c) => {
      const amount = c.amount || 0;
      return amount >= amountRange[0] && amount <= amountRange[1];
    });

    // Apply returned only filter
    if (showReturnedOnly) {
      result = result.filter((c) => isReturnedByCoordinator(c));
    }

    // Apply follow-up only filter
    if (showFollowUpOnly) {
      result = result.filter((c) => c.isFollowUp || (c.providerRole === ROLES.DOCTOR && c.amount === 0));
    }

    // Apply sorting
    result.sort((a, b) => {
      // Always show returned claims first when not sorting by something else
      if (sortBy === "dateDesc" || sortBy === "dateAsc") {
        const aReturned = isReturnedByCoordinator(a);
        const bReturned = isReturnedByCoordinator(b);
        if (aReturned && !bReturned) return -1;
        if (!aReturned && bReturned) return 1;
      }

      switch (sortBy) {
        case "dateDesc":
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        case "dateAsc":
          return new Date(a.submittedAt) - new Date(b.submittedAt);
        case "amountDesc":
          return (b.amount || 0) - (a.amount || 0);
        case "amountAsc":
          return (a.amount || 0) - (b.amount || 0);
        case "clientName":
          return (a.clientName || "").localeCompare(b.clientName || "");
        case "providerName":
          return (a.providerName || "").localeCompare(b.providerName || "");
        default:
          return new Date(b.submittedAt) - new Date(a.submittedAt);
      }
    });

    return result;
  }, [claims, selectedTab, claimTabs, searchQuery, statusFilter, sortBy, dateFrom, dateTo, amountRange, showReturnedOnly, showFollowUpOnly, isReturnedByCoordinator]);

  // Get claim counts per tab (before filters)
  const tabCounts = useMemo(() => {
    return claimTabs.map(tab =>
      claims.filter(c => c.providerRole === tab.role).length
    );
  }, [claims, claimTabs]);

  // Get statistics for current tab
  const currentTabStats = useMemo(() => {
    const currentRole = claimTabs[selectedTab]?.role;
    if (!currentRole) return { total: 0, returned: 0, pending: 0, totalAmount: 0 };

    const tabClaims = claims.filter((c) => c.providerRole === currentRole);
    return {
      total: tabClaims.length,
      returned: tabClaims.filter((c) => isReturnedByCoordinator(c)).length,
      pending: tabClaims.filter((c) => c.status === "PENDING_MEDICAL" || c.status === "PENDING").length,
      totalAmount: tabClaims.reduce((sum, c) => sum + (c.amount || 0), 0),
    };
  }, [claims, selectedTab, claimTabs, isReturnedByCoordinator]);

  // Approve claim with confirmation
  const handleApprove = useCallback(async (claim) => {
    // Validate transition
    if (!isValidTransition(claim.status, CLAIM_STATUS.APPROVED_MEDICAL)) {
      setSnackbar({
        open: true,
        message: `${t("cannotApproveFromStatus", language)} ${claim.status}`,
        severity: "error",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.patch(API_ENDPOINTS.HEALTHCARE_CLAIMS.APPROVE_MEDICAL(claim.id));
      setClaims((prev) => prev.filter((c) => c.id !== claim.id));
      setSnackbar({
        open: true,
        message: t("medicalApprovalSuccess", language),
        severity: "success",
      });
      // Close details modal if open
      if (openDetailsModal) setOpenDetailsModal(false);
    } catch (err) {
      logger.error("Approve failed:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("failedToApproveClaim", language),
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, language, openDetailsModal]);

  // Open reject dialog
  const handleOpenReject = useCallback((claim) => {
    setSelectedClaim(claim);
    setRejectReason("");
    setOpenRejectDialog(true);
  }, []);

  // Confirm rejection
  const handleConfirmReject = useCallback(async () => {
    const sanitizedReason = sanitizeString(rejectReason);

    if (!sanitizedReason.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseEnterRejectionReason", language),
        severity: "error",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.patch(
        API_ENDPOINTS.HEALTHCARE_CLAIMS.REJECT_MEDICAL(selectedClaim.id),
        { reason: sanitizedReason }
      );

      setClaims((prev) => prev.filter((c) => c.id !== selectedClaim.id));
      setSnackbar({
        open: true,
        message: t("claimRejectedSuccess", language),
        severity: "warning",
      });
      setOpenRejectDialog(false);
      // Close details modal if open
      if (openDetailsModal) setOpenDetailsModal(false);
    } catch (err) {
      logger.error("Reject failed:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("failedToRejectClaim", language),
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [rejectReason, selectedClaim, isSubmitting, language, openDetailsModal]);

  // Open details modal
  const handleViewDetails = useCallback((claim) => {
    setSelectedClaim(claim);
    setOpenDetailsModal(true);
  }, []);

  // Parse role-specific data safely
  const parseRoleSpecificData = useCallback((roleSpecificData) => {
    return safeJsonParse(roleSpecificData, null);
  }, []);

  // Format amount with currency
  const formatAmount = useCallback((amount, isFollowUp = false) => {
    if (isFollowUp || amount === 0) {
      return `0 ${CURRENCY.SYMBOL}`;
    }
    return `${(amount || 0).toFixed(2)} ${CURRENCY.SYMBOL}`;
  }, []);

  // Get status chip color
  const getStatusChipProps = useCallback((status) => {
    switch (status) {
      case "RETURNED_FOR_REVIEW":
        return { color: "error", label: "Returned" };
      case "PENDING_MEDICAL":
        return { color: "warning", label: "Pending Medical" };
      case "PENDING":
        return { color: "info", label: "Pending" };
      default:
        return { color: "default", label: status?.replace(/_/g, " ") };
    }
  }, []);

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />

      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "#FAF8F5",
          minHeight: "100vh",
          ml: isRTL ? 0 : "240px",
          mr: isRTL ? "240px" : 0,
        }}
      >
        <Header />

        <Box sx={{ p: 4 }}>
          {/* PAGE TITLE */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ color: "#3D4F23", mb: 1, letterSpacing: 0.5 }}
              >
                {t("medicalClaimsReview", language)}
              </Typography>
              <Typography sx={{ color: "#6B7280" }}>
                {t("validateMedicalAccuracy", language)}
              </Typography>
            </Box>
            <Tooltip title="Refresh Claims">
              <span>
                <IconButton
                  onClick={fetchClaims}
                  disabled={loading}
                  sx={{
                    bgcolor: "#556B2F",
                    color: "#fff",
                    "&:hover": { bgcolor: "#3D4F23" },
                    "&.Mui-disabled": { bgcolor: "#9CA3AF", color: "#E5E7EB" },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* STATISTICS CARDS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ bgcolor: "#E8F5E9", borderLeft: "4px solid #4CAF50" }}>
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" fontWeight="bold" color="#2E7D32">
                    {currentTabStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Claims</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ bgcolor: "#FFF3E0", borderLeft: "4px solid #FF9800" }}>
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" fontWeight="bold" color="#E65100">
                    {currentTabStats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Pending Review</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ bgcolor: "#FFEBEE", borderLeft: "4px solid #F44336" }}>
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" fontWeight="bold" color="#C62828">
                    {currentTabStats.returned}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Returned Claims</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ bgcolor: "#E3F2FD", borderLeft: "4px solid #2196F3" }}>
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" fontWeight="bold" color="#1565C0">
                    {currentTabStats.totalAmount.toFixed(0)} {CURRENCY.SYMBOL}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* SEARCH AND FILTER BAR */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by client, provider, diagnosis..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#6B7280" }} />
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAFAFA" } }}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon sx={{ color: "#6B7280", ml: 1 }} />
                      </InputAdornment>
                    }
                    sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <Button
                  fullWidth
                  variant={showFilters ? "contained" : "outlined"}
                  startIcon={<TuneIcon />}
                  endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    bgcolor: showFilters ? "#556B2F" : "transparent",
                    borderColor: "#556B2F",
                    color: showFilters ? "#fff" : "#556B2F",
                    "&:hover": { bgcolor: showFilters ? "#3D4F23" : "rgba(85, 107, 47, 0.1)", borderColor: "#3D4F23" },
                  }}
                >
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    borderColor: "#D32F2F",
                    color: "#D32F2F",
                    "&:hover": { bgcolor: "rgba(211, 47, 47, 0.1)", borderColor: "#B71C1C" },
                    "&:disabled": { borderColor: "#BDBDBD", color: "#BDBDBD" },
                  }}
                >
                  Clear All
                </Button>
              </Grid>
            </Grid>

            {/* Advanced Filters Panel */}
            <Collapse in={showFilters}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <DateRangeIcon fontSize="small" />
                    Service Date Range
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <TextField type="date" size="small" label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                    <TextField type="date" size="small" label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <AttachMoneyIcon fontSize="small" />
                    Amount Range: {amountRange[0]} - {amountRange[1]} {CURRENCY.SYMBOL}
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={amountRange}
                      onChange={(e, newValue) => setAmountRange(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={maxAmount}
                      step={10}
                      sx={{ color: "#556B2F" }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <FilterListIcon fontSize="small" />
                    Quick Filters
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip icon={<WarningAmberIcon />} label="Returned Only" clickable color={showReturnedOnly ? "error" : "default"} variant={showReturnedOnly ? "filled" : "outlined"} onClick={() => setShowReturnedOnly(!showReturnedOnly)} sx={{ mb: 1 }} />
                    <Chip icon={<AssignmentIcon />} label="Follow-up Only" clickable color={showFollowUpOnly ? "warning" : "default"} variant={showFollowUpOnly ? "filled" : "outlined"} onClick={() => setShowFollowUpOnly(!showFollowUpOnly)} sx={{ mb: 1 }} />
                  </Stack>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#6B7280", mr: 1 }}>Active filters:</Typography>
              {searchQuery && <Chip size="small" label={`Search: "${searchQuery}"`} onDelete={() => setSearchQuery("")} sx={{ bgcolor: "#E8F5E9" }} />}
              {statusFilter !== "all" && <Chip size="small" label={`Status: ${statusOptions.find(o => o.value === statusFilter)?.label}`} onDelete={() => setStatusFilter("all")} sx={{ bgcolor: "#FFF3E0" }} />}
              {(dateFrom || dateTo) && <Chip size="small" label={`Date: ${dateFrom || "..."} to ${dateTo || "..."}`} onDelete={() => { setDateFrom(""); setDateTo(""); }} sx={{ bgcolor: "#E3F2FD" }} />}
              {(amountRange[0] !== 0 || amountRange[1] !== maxAmount) && <Chip size="small" label={`Amount: ${amountRange[0]} - ${amountRange[1]} ${CURRENCY.SYMBOL}`} onDelete={() => setAmountRange([0, maxAmount])} sx={{ bgcolor: "#F3E5F5" }} />}
              {showReturnedOnly && <Chip size="small" label="Returned Only" onDelete={() => setShowReturnedOnly(false)} color="error" variant="outlined" />}
              {showFollowUpOnly && <Chip size="small" label="Follow-up Only" onDelete={() => setShowFollowUpOnly(false)} color="warning" variant="outlined" />}
            </Box>
          )}

          {/* TABS */}
          <Tabs
            value={selectedTab}
            onChange={(e, v) => { setSelectedTab(v); setPage(0); }}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              bgcolor: "#fff",
              borderRadius: 2,
              px: 1,
              "& .MuiTab-root": { fontWeight: "bold", textTransform: "none", minHeight: 56 },
            }}
          >
            {claimTabs.map((tabItem, index) => (
              <Tab
                key={index}
                icon={
                  <Badge badgeContent={tabCounts[index]} sx={{ "& .MuiBadge-badge": { backgroundColor: "#556B2F", color: "#FFFFFF", fontWeight: "bold" } }}>
                    {tabItem.icon}
                  </Badge>
                }
                iconPosition="start"
                label={tabItem.label}
              />
            ))}
          </Tabs>

          {/* Results Count and View Controls */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              Showing <b>{Math.min(rowsPerPage, filteredClaims.length - page * rowsPerPage)}</b> of <b>{filteredClaims.length}</b> claims
              {hasActiveFilters && " (filtered)"}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Rows per page selector */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Per Page</InputLabel>
                <Select
                  value={rowsPerPage}
                  label="Per Page"
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}
                >
                  {rowsPerPageOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* View mode toggle */}
              <Stack direction="row" sx={{ bgcolor: "#f1f5f9", borderRadius: 2, p: 0.5 }}>
                <Tooltip title="Table View">
                  <IconButton
                    onClick={() => setViewMode("table")}
                    sx={{
                      bgcolor: viewMode === "table" ? "#556B2F" : "transparent",
                      color: viewMode === "table" ? "#fff" : "#6B7280",
                      "&:hover": { bgcolor: viewMode === "table" ? "#3D4F23" : "#e2e8f0" },
                      borderRadius: 1.5,
                    }}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Card View">
                  <IconButton
                    onClick={() => setViewMode("cards")}
                    sx={{
                      bgcolor: viewMode === "cards" ? "#556B2F" : "transparent",
                      color: viewMode === "cards" ? "#fff" : "#6B7280",
                      "&:hover": { bgcolor: viewMode === "cards" ? "#3D4F23" : "#e2e8f0" },
                      borderRadius: 1.5,
                    }}
                  >
                    <ViewModuleIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* CLAIMS CONTENT */}
          {loading ? (
            <Box sx={{ textAlign: "center", mt: 10 }}>
              <CircularProgress sx={{ color: "#556B2F" }} />
            </Box>
          ) : filteredClaims.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: 2 }}>
              <SearchIcon sx={{ fontSize: 60, color: "#BDBDBD", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "#6B7280", mb: 1 }}>
                {hasActiveFilters ? "No claims match your filters" : t("noPendingClaims", language)}
              </Typography>
              {hasActiveFilters && (
                <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearAllFilters} sx={{ mt: 2, textTransform: "none" }}>
                  Clear all filters
                </Button>
              )}
            </Paper>
          ) : viewMode === "table" ? (
            /* TABLE VIEW */
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#556B2F" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Client</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Provider</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Diagnosis</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Amount</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClaims
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((claim) => {
                      const isReturned = isReturnedByCoordinator(claim);
                      const isFollowUp = claim.isFollowUp || (claim.providerRole === ROLES.DOCTOR && claim.amount === 0);
                      const statusProps = getStatusChipProps(claim.status);

                      return (
                        <TableRow
                          key={claim.id}
                          hover
                          sx={{
                            bgcolor: isReturned ? "#FFF5F5" : "inherit",
                            "&:hover": { bgcolor: isReturned ? "#FFEBEE" : "#F5F5F5" },
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight="500" sx={{ color: "#3D4F23" }}>
                              {claim.clientName || "N/A"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {claim.id?.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography>{claim.providerName || "N/A"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {claim.providerRole}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography noWrap title={claim.diagnosis || "N/A"}>
                              {claim.diagnosis || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {isFollowUp ? (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography fontWeight="bold" color="text.secondary">0 {CURRENCY.SYMBOL}</Typography>
                                <Chip label="Follow-up" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontSize: "0.65rem", height: 18 }} />
                              </Stack>
                            ) : (
                              <Typography fontWeight="bold">{formatAmount(claim.amount)}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={statusProps.label} color={statusProps.color} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{claim.serviceDate || "N/A"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {timeSince(claim.submittedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="View Details">
                                <IconButton size="small" onClick={() => handleViewDetails(claim)} sx={{ color: "#1976D2" }}>
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={isReturned ? "Re-Approve" : "Approve"}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleApprove(claim)}
                                  disabled={isSubmitting}
                                  sx={{ color: "#4CAF50" }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenReject(claim)}
                                  disabled={isSubmitting}
                                  sx={{ color: "#F44336" }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* CARD VIEW */
            <Grid container spacing={3}>
              {filteredClaims
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((claim) => {
                  const isReturned = isReturnedByCoordinator(claim);
                  const isFollowUp = claim.isFollowUp || (claim.providerRole === ROLES.DOCTOR && claim.amount === 0);
                  const statusProps = getStatusChipProps(claim.status);

                  return (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={claim.id}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          border: isReturned ? "2px solid #F44336" : "1px solid #e2e8f0",
                          bgcolor: isReturned ? "#FFF5F5" : "#fff",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          {/* Header */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                            <Box>
                              <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23" }}>
                                {claim.clientName || "N/A"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {claim.id?.substring(0, 8)}...
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <Chip label={statusProps.label} color={statusProps.color} size="small" />
                              {isReturned && <Chip label="Returned" color="error" size="small" />}
                            </Stack>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {/* Details */}
                          <Stack spacing={1.5}>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="body2" color="text.secondary">Provider</Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {claim.providerName || "N/A"}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="body2" color="text.secondary">Role</Typography>
                              <Chip label={claim.providerRole} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 22 }} />
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="body2" color="text.secondary">Diagnosis</Typography>
                              <Typography variant="body2" fontWeight={500} sx={{ maxWidth: 150, textAlign: "right" }} noWrap title={claim.diagnosis || "N/A"}>
                                {claim.diagnosis || "N/A"}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography variant="body2" color="text.secondary">Amount</Typography>
                              {isFollowUp ? (
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <Typography fontWeight="bold" color="text.secondary">0 {CURRENCY.SYMBOL}</Typography>
                                  <Chip label="Follow-up" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontSize: "0.6rem", height: 18 }} />
                                </Stack>
                              ) : (
                                <Typography variant="body1" fontWeight="bold" sx={{ color: "#556B2F" }}>
                                  {formatAmount(claim.amount)}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="body2" color="text.secondary">Date</Typography>
                              <Box sx={{ textAlign: "right" }}>
                                <Typography variant="body2">{claim.serviceDate || "N/A"}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {timeSince(claim.submittedAt)}
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>

                          <Divider sx={{ my: 2 }} />

                          {/* Actions */}
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<InfoIcon />}
                              onClick={() => handleViewDetails(claim)}
                              sx={{ textTransform: "none", borderColor: "#1976D2", color: "#1976D2" }}
                            >
                              Details
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleApprove(claim)}
                              disabled={isSubmitting}
                              sx={{ textTransform: "none", bgcolor: "#4CAF50", "&:hover": { bgcolor: "#388E3C" } }}
                            >
                              {isReturned ? "Re-Approve" : "Approve"}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => handleOpenReject(claim)}
                              disabled={isSubmitting}
                              sx={{ textTransform: "none", borderColor: "#F44336", color: "#F44336" }}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          )}

          {/* PAGINATION CONTROLS */}
          {filteredClaims.length > 0 && (
            <Paper sx={{ mt: 3, p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of {Math.ceil(filteredClaims.length / rowsPerPage)} ({filteredClaims.length} total claims)
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="First Page">
                  <span>
                    <IconButton
                      onClick={() => setPage(0)}
                      disabled={page === 0}
                      size="small"
                      sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}
                    >
                      <FirstPageIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Previous Page">
                  <span>
                    <IconButton
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      size="small"
                      sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}
                    >
                      <NavigateBeforeIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* Page number buttons */}
                {Array.from({ length: Math.min(5, Math.ceil(filteredClaims.length / rowsPerPage)) }, (_, i) => {
                  const totalPages = Math.ceil(filteredClaims.length / rowsPerPage);
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setPage(pageNum)}
                      sx={{
                        minWidth: 36,
                        bgcolor: page === pageNum ? "#556B2F" : "transparent",
                        borderColor: "#556B2F",
                        color: page === pageNum ? "#fff" : "#556B2F",
                        "&:hover": {
                          bgcolor: page === pageNum ? "#3D4F23" : "rgba(85, 107, 47, 0.1)",
                        },
                      }}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}

                <Tooltip title="Next Page">
                  <span>
                    <IconButton
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(filteredClaims.length / rowsPerPage) - 1}
                      size="small"
                      sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}
                    >
                      <NavigateNextIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Last Page">
                  <span>
                    <IconButton
                      onClick={() => setPage(Math.ceil(filteredClaims.length / rowsPerPage) - 1)}
                      disabled={page >= Math.ceil(filteredClaims.length / rowsPerPage) - 1}
                      size="small"
                      sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}
                    >
                      <LastPageIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>

      {/* ==================== DETAILS MODAL ==================== */}
      <Dialog open={openDetailsModal} onClose={() => setOpenDetailsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: "#556B2F", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon />
            Claim Details
          </Box>
          {selectedClaim && isReturnedByCoordinator(selectedClaim) && (
            <Chip label="RETURNED FOR REVIEW" color="error" sx={{ fontWeight: "bold" }} />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedClaim && (
            <Box>
              {/* Returned Warning */}
              {isReturnedByCoordinator(selectedClaim) && selectedClaim.rejectionReason && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#FFEBEE", borderRadius: 2, border: "2px solid #F44336" }}>
                  <Typography fontWeight="bold" color="error.dark" sx={{ mb: 1 }}>
                    Coordination Admin Note:
                  </Typography>
                  <Typography>{sanitizeString(selectedClaim.rejectionReason)}</Typography>
                </Box>
              )}

              <Grid container spacing={3}>
                {/* Client Information */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon /> Client Information
                  </Typography>
                  <Stack spacing={1} sx={{ pl: 2, borderLeft: "3px solid #556B2F" }}>
                    <Typography><b>Name:</b> {selectedClaim.clientName || "N/A"}</Typography>
                    {selectedClaim.clientAge && <Typography><b>Age:</b> {selectedClaim.clientAge}</Typography>}
                    {selectedClaim.clientGender && <Typography><b>Gender:</b> {selectedClaim.clientGender}</Typography>}
                    {(selectedClaim.clientEmployeeId || selectedClaim.employeeId) && <Typography><b>Employee ID:</b> {selectedClaim.clientEmployeeId || selectedClaim.employeeId}</Typography>}
                    {selectedClaim.clientNationalId && <Typography><b>National ID:</b> {selectedClaim.clientNationalId}</Typography>}
                    {selectedClaim.clientFaculty && <Typography><b>Faculty:</b> {selectedClaim.clientFaculty}</Typography>}
                    {selectedClaim.clientDepartment && <Typography><b>Department:</b> {selectedClaim.clientDepartment}</Typography>}
                  </Stack>

                  {/* Family Member Info if exists */}
                  {selectedClaim.familyMemberName && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: "#FFF8E1", borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "#F57C00", mb: 1 }}>
                        Family Member Claim
                      </Typography>
                      <Typography><b>Member:</b> {selectedClaim.familyMemberName}</Typography>
                      {selectedClaim.familyMemberRelation && <Typography><b>Relation:</b> {selectedClaim.familyMemberRelation}</Typography>}
                      {selectedClaim.familyMemberAge && <Typography><b>Age:</b> {selectedClaim.familyMemberAge}</Typography>}
                      {selectedClaim.familyMemberGender && <Typography><b>Gender:</b> {selectedClaim.familyMemberGender}</Typography>}
                    </Box>
                  )}
                </Grid>

                {/* Provider Information */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <ScienceIcon /> Provider Information
                  </Typography>
                  <Stack spacing={1} sx={{ pl: 2, borderLeft: "3px solid #556B2F" }}>
                    <Typography><b>Name:</b> {selectedClaim.providerName || "N/A"}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography><b>Role:</b></Typography>
                      <Chip label={selectedClaim.providerRole} size="small" color="primary" />
                    </Box>
                    {selectedClaim.providerEmployeeId && <Typography><b>Employee ID:</b> {selectedClaim.providerEmployeeId}</Typography>}
                    {selectedClaim.providerSpecialization && <Typography><b>Specialization:</b> {selectedClaim.providerSpecialization}</Typography>}
                  </Stack>
                </Grid>

                {/* Medical Details */}
                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <LocalHospitalIcon /> Medical Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexDirection: "column" }}>
                        <Typography fontWeight="bold">Diagnosis:</Typography>
                        {isEditingDiagnosis ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                            <TextField
                              size="small"
                              fullWidth
                              value={editedDiagnosis}
                              onChange={(e) => setEditedDiagnosis(e.target.value)}
                              placeholder="Enter diagnosis..."
                            />
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setIsEditingDiagnosis(false);
                                // Update the claim's diagnosis
                                if (selectedClaim) {
                                  setSelectedClaim({ ...selectedClaim, diagnosis: editedDiagnosis });
                                }
                              }}
                              sx={{ minWidth: "auto", px: 2 }}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setIsEditingDiagnosis(false);
                                setEditedDiagnosis(selectedClaim?.diagnosis || "");
                              }}
                              sx={{ minWidth: "auto", px: 2 }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography>{selectedClaim.diagnosis || "N/A"}</Typography>
                            <Tooltip title="Edit Diagnosis">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditedDiagnosis(selectedClaim.diagnosis || "");
                                  setIsEditingDiagnosis(true);
                                }}
                              >
                                <AssignmentIcon fontSize="small" sx={{ color: "#556B2F" }} />
                              </IconButton>
                            </Tooltip>
                            {selectedClaim.diagnosis && isCustomDiagnosis(selectedClaim.diagnosis) && (
                              <Chip
                                size="small"
                                label="Custom"
                                color="warning"
                                onClick={() => {
                                  setEditedDiagnosis(selectedClaim.diagnosis);
                                  // Pre-select provider's specialization if available
                                  if (selectedClaim.providerSpecialization) {
                                    const spec = specializations.find(s => s.displayName === selectedClaim.providerSpecialization);
                                    if (spec) setSelectedSpecializationId(spec.id);
                                  }
                                  setOpenSaveDiagnosisDialog(true);
                                }}
                                sx={{ cursor: "pointer" }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography><b>Treatment:</b> {selectedClaim.treatmentDetails || "N/A"}</Typography>
                    </Grid>
                    {selectedClaim.description && (
                      <Grid size={12}>
                        <Typography><b>Description:</b> {sanitizeString(selectedClaim.description)}</Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Role-specific data */}
                  {(() => {
                    const roleData = parseRoleSpecificData(selectedClaim.roleSpecificData);
                    if (!roleData) return null;

                    // Lab/Radiology Test
                    if ((selectedClaim.providerRole === ROLES.LAB_TECH || selectedClaim.providerRole === ROLES.RADIOLOGIST) && roleData.testName) {
                      return (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "#E3F2FD", borderRadius: 2 }}>
                          <Typography><b>Test Name:</b> {roleData.testName}</Typography>
                        </Box>
                      );
                    }

                    // Pharmacy Items
                    if (selectedClaim.providerRole === ROLES.PHARMACIST && roleData.items?.length > 0) {
                      return (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "#E8F5E9", borderRadius: 2 }}>
                          <Typography fontWeight="bold" sx={{ mb: 1 }}>Medicines:</Typography>
                          {roleData.items.map((item, idx) => (
                            <Box key={idx} sx={{ mb: 1, pl: 2 }}>
                              <Typography fontWeight="500">{item.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.form && `Form: ${item.form}`}
                                {item.calculatedQuantity && ` | Qty: ${item.calculatedQuantity}`}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      );
                    }

                    return null;
                  })()}
                </Grid>

                {/* Claim Details */}
                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <EventIcon /> Claim Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">Amount</Typography>
                      <Typography fontWeight="bold" variant="h6">
                        {formatAmount(selectedClaim.amount, selectedClaim.isFollowUp || (selectedClaim.providerRole === ROLES.DOCTOR && selectedClaim.amount === 0))}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">Service Date</Typography>
                      <Typography fontWeight="bold">{selectedClaim.serviceDate || "N/A"}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">Submitted</Typography>
                      <Typography fontWeight="bold">{timeSince(selectedClaim.submittedAt)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip label={getStatusChipProps(selectedClaim.status).label} color={getStatusChipProps(selectedClaim.status).color} size="small" />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Attachments */}
                {selectedClaim.invoiceImagePath && (
                  <Grid size={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#3D4F23", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <VisibilityIcon /> Attachments
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setOpenFilesModal(true)}
                      sx={{ textTransform: "none" }}
                    >
                      View Attachment
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDetailsModal(false)} sx={{ textTransform: "none" }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => selectedClaim && handleApprove(selectedClaim)}
            disabled={isSubmitting}
            sx={{ textTransform: "none" }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : (isReturnedByCoordinator(selectedClaim) ? "Re-Approve" : "Approve")}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => selectedClaim && handleOpenReject(selectedClaim)}
            disabled={isSubmitting}
            sx={{ textTransform: "none" }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* ATTACHMENTS MODAL */}
      <Dialog open={openFilesModal} onClose={() => setOpenFilesModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{t("attachments", language)}</span>
          {selectedClaim?.invoiceImagePath && (
            <Stack direction="row" spacing={1}>
              <Tooltip title={t("openInNewTab", language) || "Open in New Tab"}>
                <IconButton
                  onClick={() => {
                    const url = selectedClaim.invoiceImagePath.startsWith("http")
                      ? selectedClaim.invoiceImagePath
                      : `${API_BASE_URL}${selectedClaim.invoiceImagePath}`;
                    window.open(url, "_blank");
                  }}
                  sx={{ color: "#556B2F" }}
                >
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("downloadDocument", language) || "Download Document"}>
                <IconButton
                  onClick={async () => {
                    try {
                      const url = selectedClaim.invoiceImagePath.startsWith("http")
                        ? selectedClaim.invoiceImagePath
                        : `${API_BASE_URL}${selectedClaim.invoiceImagePath}`;

                      // Fetch the file as blob
                      const response = await fetch(url);
                      const blob = await response.blob();

                      // Create download link
                      const downloadUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = downloadUrl;

                      // Extract filename from path or use default
                      const filename = selectedClaim.invoiceImagePath.split("/").pop() || "attachment";
                      link.download = filename;

                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(downloadUrl);
                    } catch (err) {
                      console.error("Download failed:", err);
                      setSnackbar({
                        open: true,
                        message: t("downloadFailed", language) || "Failed to download file",
                        severity: "error",
                      });
                    }
                  }}
                  sx={{ color: "#1976D2" }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedClaim?.invoiceImagePath ? (
            <Box sx={{ mb: 2 }}>
              {selectedClaim.invoiceImagePath.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={selectedClaim.invoiceImagePath.startsWith("http")
                    ? selectedClaim.invoiceImagePath
                    : `${API_BASE_URL}${selectedClaim.invoiceImagePath}`}
                  title="Invoice PDF"
                  width="100%"
                  height="500px"
                  style={{ borderRadius: 8, border: "1px solid #e0e0e0" }}
                />
              ) : (
                <img
                  src={selectedClaim.invoiceImagePath.startsWith("http")
                    ? selectedClaim.invoiceImagePath
                    : `${API_BASE_URL}${selectedClaim.invoiceImagePath}`}
                  alt="Invoice"
                  style={{ width: "100%", borderRadius: 8, marginBottom: 10 }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
            </Box>
          ) : (
            <Typography>{t("noAttachmentsFound", language)}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFilesModal(false)}>{t("close", language)}</Button>
        </DialogActions>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>{t("rejectClaim", language)}</DialogTitle>
        <DialogContent>
          <TextField
            label={t("reasonForRejection", language)}
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)} disabled={isSubmitting}>
            {t("cancel", language)}
          </Button>
          <Button color="error" onClick={handleConfirmReject} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} /> : t("reject", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SAVE DIAGNOSIS TO SYSTEM DIALOG */}
      <Dialog
        open={openSaveDiagnosisDialog}
        onClose={() => setOpenSaveDiagnosisDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#f0f9ff", color: "#0284c7", fontWeight: 600 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocalHospitalIcon />
            <span>{t("saveDiagnosisToSystem", language) || "Save Diagnosis to System"}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t("saveDiagnosisHint", language) || "This custom diagnosis will be added to the selected specialization and will be available for doctors to use in future visits."}
          </Typography>

          <TextField
            fullWidth
            label={t("diagnosisName", language) || "Diagnosis Name"}
            value={editedDiagnosis}
            onChange={(e) => setEditedDiagnosis(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth>
            <InputLabel>{t("selectSpecialization", language) || "Select Specialization"}</InputLabel>
            <Select
              value={selectedSpecializationId}
              onChange={(e) => setSelectedSpecializationId(e.target.value)}
              label={t("selectSpecialization", language) || "Select Specialization"}
            >
              {specializations.map((spec) => (
                <MenuItem key={spec.id} value={spec.id}>
                  {spec.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSpecializationId && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t("currentDiagnosesInSpecialization", language) || "Current diagnoses in this specialization:"}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                {specializations
                  .find((s) => s.id === selectedSpecializationId)
                  ?.diagnoses?.slice(0, 10)
                  .map((d, idx) => (
                    <Chip key={idx} label={d} size="small" variant="outlined" />
                  ))}
                {specializations.find((s) => s.id === selectedSpecializationId)?.diagnoses?.length > 10 && (
                  <Chip label={`+${specializations.find((s) => s.id === selectedSpecializationId).diagnoses.length - 10} more`} size="small" />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setOpenSaveDiagnosisDialog(false);
              setSelectedSpecializationId("");
            }}
            disabled={isSavingDiagnosis}
            sx={{ color: "#64748b" }}
          >
            {t("cancel", language)}
          </Button>
          <Button
            onClick={saveDiagnosisToSystem}
            variant="contained"
            disabled={isSavingDiagnosis || !selectedSpecializationId || !editedDiagnosis.trim()}
            sx={{ bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" } }}
          >
            {isSavingDiagnosis ? <CircularProgress size={20} color="inherit" /> : (t("saveToSystem", language) || "Save to System")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MedicalClaimsReview;
