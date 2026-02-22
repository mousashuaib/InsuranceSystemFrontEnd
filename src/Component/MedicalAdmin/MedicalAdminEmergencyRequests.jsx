// src/Component/MedicalAdmin/MedicalAdminEmergencyRequests.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Avatar,
  IconButton,
  InputAdornment,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import Header from "./MedicalAdminHeader";
import Sidebar from "./MedicalAdminSidebar";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import { sanitizeString } from "../../utils/sanitize";

import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import EventIcon from "@mui/icons-material/Event";
import NoteIcon from "@mui/icons-material/Note";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import WarningIcon from "@mui/icons-material/Warning";
import SearchIcon from "@mui/icons-material/Search";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import VisibilityIcon from "@mui/icons-material/Visibility";

const MedicalAdminEmergencyRequests = () => {
  const { language, isRTL } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]); // Store found clients by employee ID
  const [searchLoading, setSearchLoading] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Enhanced filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("dateDesc");

  // View and pagination states
  const [viewMode, setViewMode] = useState("cards");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [5, 10, 25, 50, 100];

  // Sort options
  const sortOptions = [
    { value: "dateDesc", label: t("newestFirst", language) || "Newest First" },
    { value: "dateAsc", label: t("oldestFirst", language) || "Oldest First" },
    { value: "nameAsc", label: t("nameAZ", language) || "Name (A-Z)" },
    { value: "nameDesc", label: t("nameZA", language) || "Name (Z-A)" },
  ];


  // Status tabs configuration
  const statusTabs = [
    {
      label: t("pending", language),
      status: "PENDING_MEDICAL",
      icon: <PendingIcon />,
      color: "#ff9800",
    },
    {
      label: t("approved", language),
      status: "APPROVED_BY_MEDICAL",
      icon: <CheckCircleIcon />,
      color: "#4caf50",
    },
    {
      label: t("rejected", language),
      status: "REJECTED_BY_MEDICAL",
      icon: <CancelIcon />,
      color: "#f44336",
    },
    {
      label: t("all", language),
      status: "ALL",
      icon: <LocalHospitalIcon />,
      color: "#556B2F",
    },
  ];

  // Fetch emergency requests
  useEffect(() => {
    fetchRequests();
  }, []);

  // Search for client by employee ID or name
  useEffect(() => {
    const searchClient = async () => {
      if (!searchTerm || searchTerm.trim() === "") {
        setSearchResults([]);
        return;
      }

      const trimmedSearch = searchTerm.trim();
      
      // If it looks like an employee ID (numbers), search by employee ID
      if (/^\d+$/.test(trimmedSearch)) {
        setSearchLoading(true);
        try {
          const res = await api.get(API_ENDPOINTS.CLIENTS.SEARCH_BY_EMPLOYEE_ID(trimmedSearch));

          // api.get returns response.data directly
          if (res && res.fullName) {
            setSearchResults([res]);
          } else {
            setSearchResults([]);
          }
        } catch (err) {
          console.error("Error searching by employee ID:", err);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        // For text search, we'll filter by name in the frontend
        setSearchResults([]);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(searchClient, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filter requests based on selected tab and search term
  useEffect(() => {
    let filtered = [...requests];

    // Filter by status
    if (selectedTab < statusTabs.length - 1) {
      const selectedStatus = statusTabs[selectedTab].status;
      filtered = filtered.filter((req) => req.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();

      // If we found a client by employee ID search, match by that client's name or ID
      if (searchResults.length > 0) {
        const foundClient = searchResults[0];
        filtered = filtered.filter((req) =>
          req.memberName?.toLowerCase() === foundClient.fullName?.toLowerCase() ||
          req.memberId?.toString() === foundClient.id?.toString() ||
          req.employeeId?.toLowerCase() === foundClient.employeeId?.toLowerCase()
        );
      } else {
        // Regular search by name or employee ID
        filtered = filtered.filter(
          (req) =>
            req.memberName?.toLowerCase().includes(searchLower) ||
            req.employeeId?.toLowerCase().includes(searchLower) ||
            (req.memberId && req.memberId.toString().toLowerCase().includes(searchLower)) ||
            (req.location && req.location.toLowerCase().includes(searchLower)) ||
            (req.description && req.description.toLowerCase().includes(searchLower))
        );
      }
    }

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(req => new Date(req.submittedAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(req => new Date(req.submittedAt) <= toDate);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dateAsc":
          return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
        case "nameAsc":
          return (a.memberName || "").localeCompare(b.memberName || "");
        case "nameDesc":
          return (b.memberName || "").localeCompare(a.memberName || "");
        default: // dateDesc
          return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
      }
    });

    setFilteredRequests(filtered);
    setPage(0); // Reset page when filters change
  }, [requests, selectedTab, searchTerm, searchResults, dateFrom, dateTo, sortBy]);

  // Paginated data
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRequests, page, rowsPerPage]);

  // Check active filters
  const hasActiveFilters = searchTerm || dateFrom || dateTo || sortBy !== "dateDesc";
  const activeFilterCount = [searchTerm, dateFrom || dateTo, sortBy !== "dateDesc"].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setSortBy("dateDesc");
    setPage(0);
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.EMERGENCIES.ALL);
      // api.get returns response.data directly
      setRequests(res || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching emergency requests:", err.response || err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch emergency requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED_BY_MEDICAL":
        return <CheckCircleIcon sx={{ color: "#4caf50", mr: 1 }} />;
      case "REJECTED_BY_MEDICAL":
        return <CancelIcon sx={{ color: "#f44336", mr: 1 }} />;
      case "PENDING_MEDICAL":
        return <PendingIcon sx={{ color: "#ff9800", mr: 1 }} />;
      default:
        return <WarningIcon sx={{ color: "#5d6b5d", mr: 1 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED_BY_MEDICAL":
        return "#4caf50";
      case "REJECTED_BY_MEDICAL":
        return "#f44336";
      case "PENDING_MEDICAL":
        return "#ff9800";
      default:
        return "#5d6b5d";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "APPROVED_BY_MEDICAL":
        return t("approvedByMedicalAdmin", language);
      case "REJECTED_BY_MEDICAL":
        return t("rejectedByMedicalAdmin", language);
      case "PENDING_MEDICAL":
        return t("pendingMedicalReview", language);
      default:
        return status;
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await api.patch(API_ENDPOINTS.EMERGENCIES.APPROVE(id));
      // api.patch returns response.data directly
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? res : req))
      );
      setSnackbar({
        open: true,
        message: t("emergencyRequestApprovedSuccess", language),
        severity: "success",
      });
      // Refresh the list
      setTimeout(() => fetchRequests(), 500);
    } catch (err) {
      console.error("Error approving request:", err.response || err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to approve request!";
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: "error",
      });
    }
  };

  const handleReject = (id) => {
    setCurrentRequestId(id);
    setOpenRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseProvideRejectionReason", language),
        severity: "warning",
      });
      return;
    }

    try {
      const res = await api.patch(API_ENDPOINTS.EMERGENCIES.REJECT(currentRequestId), {
        reason: rejectReason,
      });
      // api.patch returns response.data directly
      setRequests((prev) =>
        prev.map((req) => (req.id === currentRequestId ? res : req))
      );
      setSnackbar({
        open: true,
        message: t("emergencyRequestRejectedSuccess", language),
        severity: "success",
      });
      // Refresh the list
      setTimeout(() => fetchRequests(), 500);
    } catch (err) {
      console.error("Error rejecting request:", err.response || err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to reject request!";
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: "error",
      });
    } finally {
      setOpenRejectDialog(false);
      setRejectReason("");
      setCurrentRequestId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getPendingCount = () => {
    return requests.filter((req) => req.status === "PENDING_MEDICAL").length;
  };

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          background: "#FAF8F5",
          minHeight: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          display: "flex",
          flexDirection: "column",
          transition: "margin 0.3s ease",
        }}
      >
        <Header />

        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#3D4F23", mb: 1, display: "flex", alignItems: "center" }}>
              <LocalHospitalIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 35, color: "#F44336" }} />
              {t("emergencyRequestsManagement", language)}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {t("reviewManageEmergencyRequests", language)}
            </Typography>
          </Box>

          {/* Enhanced Search and Filter Bar */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Grid container spacing={2} alignItems="center">
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" placeholder={t("searchByPatientNameOrEmployeeId", language)} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{searchLoading ? <CircularProgress size={20} sx={{ color: "#999" }} /> : <SearchIcon sx={{ color: "#7B8B5E" }} />}</InputAdornment>,
                    endAdornment: searchTerm && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm("")}><ClearIcon fontSize="small" /></IconButton></InputAdornment>,
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAFAFA" } }}
                />
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

              {/* Per Page */}
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("perPage", language) || "Per Page"}</InputLabel>
                  <Select value={rowsPerPage} label={t("perPage", language) || "Per Page"} onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}>
                    {rowsPerPageOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Advanced Filters */}
            <Collapse in={showFilters}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {/* Date From */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" type="date" label={t("submittedFrom", language) || "Submitted From"} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>

                {/* Date To */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" type="date" label={t("submittedTo", language) || "Submitted To"} value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Status Tabs */}
          <Paper sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Tabs value={selectedTab} onChange={(e, newValue) => { setSelectedTab(newValue); setPage(0); }} variant="scrollable" scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 64 } }}>
              {statusTabs.map((tab, index) => (
                <Tab key={tab.status}
                  label={
                    <Badge badgeContent={index === 0 ? getPendingCount() : null} color="error">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {tab.icon}
                        {tab.label}
                      </Box>
                    </Badge>
                  }
                  sx={{ color: index === selectedTab ? tab.color : "#666", "&.Mui-selected": { color: tab.color } }}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#6B7280", mr: 1 }}>{t("activeFilters", language) || "Active filters"}:</Typography>
              {searchTerm && <Chip size="small" label={`Search: "${searchTerm}"`} onDelete={() => setSearchTerm("")} sx={{ bgcolor: "#E8F5E9" }} />}
              {(dateFrom || dateTo) && <Chip size="small" label={`Date: ${dateFrom || "..."} to ${dateTo || "..."}`} onDelete={() => { setDateFrom(""); setDateTo(""); }} sx={{ bgcolor: "#FFEBEE" }} />}
            </Box>
          )}

          {/* Results Count and View Controls */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              {t("showing", language) || "Showing"} <b>{Math.min(rowsPerPage, filteredRequests.length - page * rowsPerPage)}</b> {t("of", language) || "of"} <b>{filteredRequests.length}</b> {t("requests", language) || "requests"}
            </Typography>

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
          </Box>

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
              <CircularProgress sx={{ color: "#556B2F" }} />
            </Box>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          {/* Empty State */}
          {!loading && !error && filteredRequests.length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <WarningIcon sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "#999", mb: 1 }}>
                {t("noEmergencyRequestsFound", language)}
              </Typography>
              <Typography variant="body2" sx={{ color: "#999" }}>
                {hasActiveFilters ? t("tryAdjustingSearchCriteria", language) : t("noEmergencyRequestsWithStatus", language)}
              </Typography>
              {hasActiveFilters && (
                <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearAllFilters} sx={{ mt: 2, textTransform: "none" }}>
                  {t("clearAllFilters", language) || "Clear all filters"}
                </Button>
              )}
            </Paper>
          )}

          {/* TABLE VIEW */}
          {!loading && !error && filteredRequests.length > 0 && viewMode === "table" && (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#556B2F" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("patient", language) || "Patient"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("status", language) || "Status"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("location", language) || "Location"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("description", language) || "Description"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("submittedDate", language) || "Submitted"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>{t("actions", language) || "Actions"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRequests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar
                            src={req.universityCardImage ? (req.universityCardImage.startsWith("http") ? req.universityCardImage : `${API_BASE_URL}${req.universityCardImage}`) : undefined}
                            sx={{ width: 36, height: 36, bgcolor: "#556B2F", cursor: req.universityCardImage ? "pointer" : "default" }}
                            onClick={() => {
                              if (req.universityCardImage) {
                                const imageUrl = req.universityCardImage.startsWith("http") ? req.universityCardImage : `${API_BASE_URL}${req.universityCardImage}`;
                                setSelectedImage(imageUrl);
                                setImageViewerOpen(true);
                              }
                            }}
                          >
                            {!req.universityCardImage && <PersonIcon />}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="500">{req.memberName || "Unknown"}</Typography>
                            <Typography variant="caption" color="text.secondary">{req.employeeId || req.contactPhone}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip icon={getStatusIcon(req.status)} label={getStatusLabel(req.status)} size="small" sx={{ backgroundColor: `${getStatusColor(req.status)}20`, color: getStatusColor(req.status), fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150 }} noWrap>{req.location || "-"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>{req.description || "-"}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(req.submittedAt)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {req.status === "PENDING_MEDICAL" && (
                            <>
                              <Tooltip title={t("approve", language) || "Approve"}>
                                <IconButton size="small" onClick={() => handleApprove(req.id)} sx={{ color: "#4CAF50" }}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t("reject", language) || "Reject"}>
                                <IconButton size="small" onClick={() => handleReject(req.id)} sx={{ color: "#F44336" }}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* CARD VIEW - Requests List */}
          {!loading && !error && filteredRequests.length > 0 && viewMode === "cards" && (
            <Grid container spacing={3}>
              {paginatedRequests.map((req) => (
                <Grid item xs={12} key={req.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      borderLeft: `4px solid ${getStatusColor(req.status)}`,
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box sx={{ position: "relative" }}>
                            <Avatar
                              src={
                                req.universityCardImage
                                  ? req.universityCardImage.startsWith("http")
                                    ? req.universityCardImage
                                    : `${API_BASE_URL}${req.universityCardImage}`
                                  : undefined
                              }
                              onClick={() => {
                                if (req.universityCardImage) {
                                  const imageUrl = req.universityCardImage.startsWith("http")
                                    ? req.universityCardImage
                                    : `${API_BASE_URL}${req.universityCardImage}`;
                                  setSelectedImage(imageUrl);
                                  setImageViewerOpen(true);
                                }
                              }}
                              sx={{
                                bgcolor: "#556B2F",
                                width: 56,
                                height: 56,
                                border: "2px solid #7B8B5E",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                cursor: req.universityCardImage ? "pointer" : "default",
                                transition: "all 0.2s ease",
                                "&:hover": req.universityCardImage ? {
                                  transform: "scale(1.05)",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                                } : {},
                              }}
                            >
                              {!req.universityCardImage && (
                                <PersonIcon sx={{ fontSize: 28 }} />
                              )}
                            </Avatar>
                            {req.universityCardImage && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: -4,
                                  right: -4,
                                  bgcolor: "#7B8B5E",
                                  borderRadius: "50%",
                                  p: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "2px solid white",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                              >
                                <ZoomInIcon sx={{ fontSize: 14, color: "white" }} />
                              </Box>
                            )}
                          </Box>
                          <Box>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{ color: "#3D4F23", mb: 0.5 }}
                            >
                              {req.memberName || "Unknown Patient"}
                            </Typography>
                            <Chip
                              icon={getStatusIcon(req.status)}
                              label={getStatusLabel(req.status)}
                              size="small"
                              sx={{
                                backgroundColor: `${getStatusColor(req.status)}20`,
                                color: getStatusColor(req.status),
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ color: "#999" }}>
                          {formatDate(req.submittedAt)}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        {/* General Information */}
                        <Grid item xs={12} md={4}>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              sx={{ color: "#556B2F", mb: 1 }}
                            >
                              Patient Information
                            </Typography>
                            <Stack spacing={1}>
                              {(() => {
                                // Check if notes contain family member information
                                const notes = req.notes || "";
                                const isFamilyMember = notes.includes("Family Member:");
                                
                                if (isFamilyMember) {
                                  // Parse family member info from notes
                                  const familyMatch = notes.match(/Family Member:\s*([^(]+)\s*\(([^)]+)\)/);
                                  const insuranceMatch = notes.match(/Insurance:\s*([^-]+)/);
                                  const ageMatch = notes.match(/Age:\s*([^-]+)/);
                                  const genderMatch = notes.match(/Gender:\s*([^\n]+)/);
                                  
                                  const familyName = familyMatch ? familyMatch[1].trim() : req.memberName;
                                  const relation = familyMatch ? familyMatch[2].trim() : "";
                                  const insuranceNumber = insuranceMatch ? insuranceMatch[1].trim() : "";
                                  const age = ageMatch ? ageMatch[1].trim() : "";
                                  const gender = genderMatch ? genderMatch[1].trim() : "";
                                  
                                  return (
                                    <>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <PersonIcon sx={{ mr: 1, color: "#666", fontSize: 20 }} />
                                        <Typography variant="body2">
                                          <strong>Patient:</strong> {familyName}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Typography variant="body2" sx={{ ml: 4 }}>
                                          <strong>Relation:</strong> {relation}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Typography variant="body2" sx={{ ml: 4 }}>
                                          <strong>Insurance #:</strong> {insuranceNumber || "N/A"}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Typography variant="body2" sx={{ ml: 4 }}>
                                          <strong>Age:</strong> {age || "N/A"}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Typography variant="body2" sx={{ ml: 4 }}>
                                          <strong>Gender:</strong> {gender || "N/A"}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <PhoneIcon sx={{ mr: 1, color: "#666", fontSize: 20 }} />
                                        <Typography variant="body2">
                                          <strong>Phone:</strong> {req.contactPhone || "-"}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <LocationOnIcon
                                          sx={{ mr: 1, color: "#666", fontSize: 20 }}
                                        />
                                        <Typography variant="body2">
                                          <strong>Location:</strong> {req.location || "-"}
                                        </Typography>
                                      </Box>
                                    </>
                                  );
                                } else {
                                  // Main client information
                                  return (
                                    <>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <PersonIcon sx={{ mr: 1, color: "#666", fontSize: 20 }} />
                                        <Typography variant="body2">
                                          <strong>Patient:</strong> {req.memberName || "-"}
                                        </Typography>
                                      </Box>
                                      {req.employeeId && (
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                          <Typography variant="body2" sx={{ ml: 4 }}>
                                            <strong>Employee ID:</strong> {req.employeeId}
                                          </Typography>
                                        </Box>
                                      )}
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <PhoneIcon sx={{ mr: 1, color: "#666", fontSize: 20 }} />
                                        <Typography variant="body2">
                                          <strong>Phone:</strong> {req.contactPhone || "-"}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <LocationOnIcon
                                          sx={{ mr: 1, color: "#666", fontSize: 20 }}
                                        />
                                        <Typography variant="body2">
                                          <strong>Location:</strong> {req.location || "-"}
                                        </Typography>
                                      </Box>
                                    </>
                                  );
                                }
                              })()}
                            </Stack>
                          </Box>
                        </Grid>

                        {/* Emergency Details */}
                        <Grid item xs={12} md={4}>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              sx={{ color: "#556B2F", mb: 1 }}
                            >
                              Emergency Details
                            </Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                                <DescriptionIcon
                                  sx={{ mr: 1, color: "#666", fontSize: 20, mt: 0.5 }}
                                />
                                <Typography variant="body2">
                                  <strong>Description:</strong> {req.description || "-"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <EventIcon sx={{ mr: 1, color: "#666", fontSize: 20 }} />
                                <Typography variant="body2">
                                  <strong>Incident Date:</strong>{" "}
                                  {req.incidentDate || "-"}
                                </Typography>
                              </Box>
                              {req.notes && (
                                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                                  <NoteIcon
                                    sx={{ mr: 1, color: "#666", fontSize: 20, mt: 0.5 }}
                                  />
                                  <Typography variant="body2">
                                    <strong>Notes:</strong> {req.notes}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Grid>

                        {/* Status & Metadata */}
                        <Grid item xs={12} md={4}>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              sx={{ color: "#556B2F", mb: 1 }}
                            >
                              Status & Timeline
                            </Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <AccessTimeIcon
                                  sx={{ mr: 1, color: "#666", fontSize: 20 }}
                                />
                                <Typography variant="body2">
                                  <strong>Submitted:</strong> {formatDate(req.submittedAt)}
                                </Typography>
                              </Box>
                              {req.approvedAt && (
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <CheckCircleIcon
                                    sx={{ mr: 1, color: "#4caf50", fontSize: 20 }}
                                  />
                                  <Typography variant="body2">
                                    <strong>Approved:</strong> {formatDate(req.approvedAt)}
                                  </Typography>
                                </Box>
                              )}
                              {req.rejectedAt && (
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <CancelIcon
                                    sx={{ mr: 1, color: "#f44336", fontSize: 20 }}
                                  />
                                  <Typography variant="body2">
                                    <strong>Rejected:</strong> {formatDate(req.rejectedAt)}
                                  </Typography>
                                </Box>
                              )}
                              {req.rejectionReason && (
                                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                                  <NoteIcon
                                    sx={{ mr: 1, color: "#f44336", fontSize: 20, mt: 0.5 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#f44336", fontStyle: "italic" }}
                                  >
                                    <strong>Reason:</strong> {sanitizeString(req.rejectionReason)}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Actions */}
                      {req.status === "PENDING_MEDICAL" && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                            mt: 3,
                            pt: 2,
                            borderTop: 1,
                            borderColor: "divider",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleApprove(req.id)}
                            startIcon={<CheckCircleIcon />}
                            sx={{ px: 3, textTransform: "none", fontWeight: 600 }}
                          >
                            {t("approve", language)}
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleReject(req.id)}
                            startIcon={<CancelIcon />}
                            sx={{ px: 3, textTransform: "none", fontWeight: 600 }}
                          >
                            {t("reject", language)}
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {!loading && !error && filteredRequests.length > 0 && (
            <Paper sx={{ mt: 3, p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("page", language) || "Page"} {page + 1} {t("of", language) || "of"} {Math.ceil(filteredRequests.length / rowsPerPage)} ({filteredRequests.length} {t("total", language) || "total"})
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={t("firstPage", language) || "First Page"}>
                  <span><IconButton onClick={() => setPage(0)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><FirstPageIcon /></IconButton></span>
                </Tooltip>
                <Tooltip title={t("previousPage", language) || "Previous"}>
                  <span><IconButton onClick={() => setPage(page - 1)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateBeforeIcon /></IconButton></span>
                </Tooltip>
                {Array.from({ length: Math.min(5, Math.ceil(filteredRequests.length / rowsPerPage)) }, (_, i) => {
                  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
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
                  <span><IconButton onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(filteredRequests.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateNextIcon /></IconButton></span>
                </Tooltip>
                <Tooltip title={t("lastPage", language) || "Last Page"}>
                  <span><IconButton onClick={() => setPage(Math.ceil(filteredRequests.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(filteredRequests.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><LastPageIcon /></IconButton></span>
                </Tooltip>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Reject Dialog */}
      <Dialog
        open={openRejectDialog}
        onClose={() => {
          setOpenRejectDialog(false);
          setRejectReason("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("rejectEmergencyRequest", language)}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
            {t("provideRejectionReason", language)}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t("rejectionReason", language)}
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenRejectDialog(false);
              setRejectReason("");
            }}
          >
            {t("cancel", language)}
          </Button>
          <Button
            color="error"
            onClick={handleConfirmReject}
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            {t("reject", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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

      {/* Image Viewer Dialog */}
      <Dialog
        open={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false);
          setSelectedImage(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.9)",
            borderRadius: 2,
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
          }}
        >
          <IconButton
            onClick={() => {
              setImageViewerOpen(false);
              setSelectedImage(null);
            }}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(255,255,255,0.1)",
              color: "white",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="University Card"
              sx={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MedicalAdminEmergencyRequests;

