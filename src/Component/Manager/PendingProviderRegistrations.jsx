import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  InputAdornment,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SearchIcon from "@mui/icons-material/Search";
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BadgeIcon from "@mui/icons-material/Badge";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const PendingProviderRegistrations = () => {
  const { language, isRTL } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("ALL");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Enhanced filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all");
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

  // Fetch pending healthcare provider registrations
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const res = await api.get(API_ENDPOINTS.CLIENTS.LIST);
        const data = res || [];
        const filtered = data.filter(
          (u) =>
            u.roleRequestStatus === "PENDING" &&
            ["DOCTOR", "PHARMACIST", "LAB_TECH", "RADIOLOGIST"].includes(
              u.requestedRole?.toUpperCase()
            )
        );

        const sorted = filtered.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setAllProviders(sorted);
      } catch (err) {
        console.error("Fetch failed:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    let result = [...allProviders];

    // Filter by role
    if (filterRole !== "ALL") {
      result = result.filter(
        (provider) => provider.requestedRole?.toUpperCase() === filterRole
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.fullName || "").toLowerCase().includes(query) ||
        (p.email || "").toLowerCase().includes(query) ||
        (p.nationalId || "").toLowerCase().includes(query) ||
        (p.phone || "").toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (genderFilter !== "all") {
      result = result.filter(p => p.gender === genderFilter);
    }

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(p => new Date(p.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.createdAt) <= toDate);
    }

    // Sort
    result.sort((a, b) => {
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
    });

    return result;
  }, [allProviders, filterRole, searchQuery, genderFilter, dateFrom, dateTo, sortBy]);

  // Paginated data
  const paginatedProviders = filteredProviders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Check active filters
  const hasActiveFilters = searchQuery || genderFilter !== "all" || dateFrom || dateTo || sortBy !== "dateDesc";
  const activeFilterCount = [searchQuery, genderFilter !== "all", dateFrom || dateTo, sortBy !== "dateDesc"].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setGenderFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("dateDesc");
    setPage(0);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const getRoleIcon = (role) => {
    const iconStyle = { fontSize: 40, color: "#556B2F" };
    switch (role?.toUpperCase()) {
      case "DOCTOR":
        return <LocalHospitalIcon sx={iconStyle} />;
      case "PHARMACIST":
        return <LocalPharmacyIcon sx={iconStyle} />;
      case "LAB_TECH":
        return <ScienceIcon sx={iconStyle} />;
      case "RADIOLOGIST":
        return <MonitorHeartIcon sx={iconStyle} />;
      default:
        return <MedicalServicesIcon sx={iconStyle} />;
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      DOCTOR: t("doctor", language) || "Doctor",
      PHARMACIST: t("pharmacist", language) || "Pharmacist",
      LAB_TECH: t("labTechnician", language) || "Lab Technician",
      RADIOLOGIST: t("radiologist", language) || "Radiologist",
    };
    return roles[role?.toUpperCase()] || role;
  };

  const handleApprove = async (provider) => {
    setLoadingId(provider.id);
    try {
      await api.patch(`/api/clients/${provider.id}/role-requests/approve`);

      setAllProviders((prev) => prev.filter((c) => c.id !== provider.id));
      setProviders((prev) => prev.filter((c) => c.id !== provider.id));

      setSnackbar({
        open: true,
        message: t("requestApprovedFor", language).replace(
          "{name}",
          provider.fullName
        ),
        severity: "success",
      });
    } catch (err) {
      console.error("❌ Approval failed:", err.response?.data || err.message);
      setSnackbar({
        open: true,
        message: t("approvalFailed", language),
        severity: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectClick = (provider) => {
    setSelectedProvider(provider);
    setOpenDialog(true);
  };

  const handleRejectConfirm = async () => {
    setLoadingId(selectedProvider.id);
    try {
      await api.patch(API_ENDPOINTS.CLIENTS.REJECT(selectedProvider.id), {
        reason: rejectReason,
      });

      setAllProviders((prev) => prev.filter((c) => c.id !== selectedProvider.id));
      setProviders((prev) => prev.filter((c) => c.id !== selectedProvider.id));

      setSnackbar({
        open: true,
        message: t("requestRejectedFor", language).replace(
          "{name}",
          selectedProvider.fullName
        ),
        severity: "error",
      });
    } catch (err) {
      console.error("❌ Reject failed:", err.response?.data || err.message);
      setSnackbar({
        open: true,
        message: t("rejectFailed", language),
        severity: "error",
      });
    } finally {
      setLoadingId(null);
      setOpenDialog(false);
      setRejectReason("");
    }
  };

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "#FAF8F5",
          minHeight: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          transition: "margin 0.3s ease",
        }}
      >
        <Header />
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#3D4F23", display: "flex", alignItems: "center" }}>
            <PendingActionsIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 35, color: "#556B2F" }} />
            {t("healthcareProviderRegistrations", language) || "Healthcare Provider Registrations"}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t("reviewProviderRegistrations", language) || "Review and approve healthcare provider account registrations"}
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

          {/* Role Filter Chips */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "#1e293b", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
              {t("filterByRole", language) || "Filter by Role"}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { role: "ALL", label: t("allRoles", language) || "All", count: allProviders.length, icon: <MedicalServicesIcon /> },
                { role: "DOCTOR", label: t("doctors", language) || "Doctors", count: allProviders.filter((c) => c.requestedRole?.toUpperCase() === "DOCTOR").length, icon: <LocalHospitalIcon /> },
                { role: "PHARMACIST", label: t("pharmacists", language) || "Pharmacists", count: allProviders.filter((c) => c.requestedRole?.toUpperCase() === "PHARMACIST").length, icon: <LocalPharmacyIcon /> },
                { role: "LAB_TECH", label: t("labTechnicians", language) || "Lab Techs", count: allProviders.filter((c) => c.requestedRole?.toUpperCase() === "LAB_TECH").length, icon: <ScienceIcon /> },
                { role: "RADIOLOGIST", label: t("radiologists", language) || "Radiologists", count: allProviders.filter((c) => c.requestedRole?.toUpperCase() === "RADIOLOGIST").length, icon: <MonitorHeartIcon /> },
              ].map(({ role, label, count, icon }) => (
                <Chip key={role} label={`${label} (${count})`} icon={icon} onClick={() => { setFilterRole(role); setPage(0); }} variant={filterRole === role ? "filled" : "outlined"} color={filterRole === role ? "primary" : "default"}
                  sx={{ fontWeight: 600, borderRadius: 2, cursor: "pointer" }}
                />
              ))}
            </Stack>
          </Paper>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#6B7280", mr: 1 }}>{t("activeFilters", language) || "Active filters"}:</Typography>
              {searchQuery && <Chip size="small" label={`Search: "${searchQuery}"`} onDelete={() => setSearchQuery("")} sx={{ bgcolor: "#E8F5E9" }} />}
              {genderFilter !== "all" && <Chip size="small" label={`Gender: ${genderFilter}`} onDelete={() => setGenderFilter("all")} sx={{ bgcolor: "#E3F2FD" }} />}
              {(dateFrom || dateTo) && <Chip size="small" label={`Date: ${dateFrom || "..."} to ${dateTo || "..."}`} onDelete={() => { setDateFrom(""); setDateTo(""); }} sx={{ bgcolor: "#FFEBEE" }} />}
            </Box>
          )}

          {/* Results Count and View Controls */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              {t("showing", language) || "Showing"} <b>{Math.min(rowsPerPage, filteredProviders.length - page * rowsPerPage)}</b> {t("of", language) || "of"} <b>{filteredProviders.length}</b> {t("requests", language) || "requests"}
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
          ) : filteredProviders.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <SearchIcon sx={{ fontSize: 60, color: "#BDBDBD", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t("noPendingRequestsFound", language) || "No pending requests found"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hasActiveFilters ? t("noResultsForSearch", language) || "No results match your search criteria" : t("noPendingProviderRequests", language) || "No pending healthcare provider registration requests"}
              </Typography>
              {hasActiveFilters && (
                <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearAllFilters} sx={{ mt: 2, textTransform: "none" }}>
                  {t("clearAllFilters", language) || "Clear all filters"}
                </Button>
              )}
            </Paper>
          ) : viewMode === "table" ? (
            /* TABLE VIEW */
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#556B2F" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("provider", language) || "Provider"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("role", language) || "Role"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("contact", language) || "Contact"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("nationalId", language) || "National ID"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("submittedDate", language) || "Submitted"}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>{t("actions", language) || "Actions"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProviders.map((provider) => (
                    <TableRow key={provider.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: "#556B2F" }}>{provider.fullName?.charAt(0)}</Avatar>
                          <Box>
                            <Typography fontWeight="500">{provider.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{provider.gender}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip icon={getRoleIcon(provider.requestedRole)} label={getRoleLabel(provider.requestedRole)} size="small" color="primary" sx={{ "& .MuiChip-icon": { fontSize: 18 } }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{provider.email}</Typography>
                        <Typography variant="caption" color="text.secondary">{provider.phone}</Typography>
                      </TableCell>
                      <TableCell>{provider.nationalId}</TableCell>
                      <TableCell>{new Date(provider.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title={t("approve", language) || "Approve"}>
                            <IconButton size="small" onClick={() => handleApprove(provider)} disabled={loadingId === provider.id} sx={{ color: "#4CAF50" }}>
                              {loadingId === provider.id ? <CircularProgress size={18} /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("reject", language) || "Reject"}>
                            <IconButton size="small" onClick={() => handleRejectClick(provider)} disabled={loadingId === provider.id} sx={{ color: "#F44336" }}>
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
            paginatedProviders.map((provider) => (
              <Paper
                key={provider.id}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 4,
                  mb: 4,
                  borderLeft: `6px solid #1E8EAB`,
                  backgroundColor: "white",
                  transition: "0.3s ease-in-out",
                }}
              >
                <Grid container spacing={3}>
                  {/* General Info */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 1, color: "#556B2F" }}
                      >
                        {t("generalInformationTitle", language) || "General Information"}
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {getRoleIcon(provider.requestedRole)}
                          <Chip
                            label={getRoleLabel(provider.requestedRole)}
                            color="primary"
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2">
                          <PersonIcon
                            sx={{ fontSize: 18, mr: isRTL ? 0 : 0.5, ml: isRTL ? 0.5 : 0 }}
                          />
                          <b>{t("nameLabel", language) || "Name"}:</b> {provider.fullName}
                        </Typography>

                        <Typography variant="body2">
                          <EmailIcon
                            sx={{ fontSize: 18, mr: isRTL ? 0 : 0.5, ml: isRTL ? 0.5 : 0 }}
                          />
                          <b>{t("emailLabel", language) || "Email"}:</b> {provider.email}
                        </Typography>

                        <Typography variant="body2">
                          <PhoneIcon
                            sx={{ fontSize: 18, mr: isRTL ? 0 : 0.5, ml: isRTL ? 0.5 : 0 }}
                          />
                          <b>{t("phoneLabel", language) || "Phone"}:</b> {provider.phone}
                        </Typography>

                        <Typography variant="body2">
                          <b>{t("nationalIdLabel", language) || "National ID"}:</b>{" "}
                          {provider.nationalId}
                        </Typography>

                        <Typography variant="body2">
                          <b>{t("genderLabel", language) || "Gender"}:</b> {provider.gender}
                        </Typography>

                        <Typography variant="body2">
                          <b>{t("dateOfBirthLabel", language) || "Date of Birth"}:</b>{" "}
                          {provider.dateOfBirth
                            ? new Date(provider.dateOfBirth).toLocaleDateString()
                            : t("notAvailable", language) || "N/A"}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Role-specific Info */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 1, color: "#556B2F" }}
                      >
                        {t("professionalDetails", language) || "Professional Details"}
                      </Typography>
                      <Stack spacing={1}>
                        {provider.requestedRole === "DOCTOR" && (
                          <>
                            <Typography variant="body2">
                              <b>{t("specialization", language) || "Specialization"}:</b>{" "}
                              {provider.specialization || t("notProvided", language)}
                            </Typography>
                            <Typography variant="body2">
                              <b>{t("clinicLocation", language) || "Clinic Location"}:</b>{" "}
                              {provider.clinicLocation || t("notProvided", language)}
                            </Typography>
                          </>
                        )}

                        {provider.requestedRole === "PHARMACIST" && (
                          <>
                            <Typography variant="body2">
                              <b>{t("pharmacyCode", language) || "Pharmacy Code"}:</b>{" "}
                              {provider.pharmacyCode || t("notProvided", language)}
                            </Typography>
                            <Typography variant="body2">
                              <b>{t("pharmacyName", language) || "Pharmacy Name"}:</b>{" "}
                              {provider.pharmacyName || t("notProvided", language)}
                            </Typography>
                            <Typography variant="body2">
                              <b>{t("pharmacyLocation", language) || "Location"}:</b>{" "}
                              {provider.pharmacyLocation || t("notProvided", language)}
                            </Typography>
                          </>
                        )}

                        {provider.requestedRole === "LAB_TECH" && (
                          <>
                            <Typography variant="body2">
                              <b>{t("labCode", language) || "Lab Code"}:</b>{" "}
                              {provider.labCode || t("notProvided", language)}
                            </Typography>
                            <Typography variant="body2">
                              <b>{t("labName", language) || "Lab Name"}:</b>{" "}
                              {provider.labName || t("notProvided", language)}
                            </Typography>
                            <Typography variant="body2">
                              <b>{t("labLocation", language) || "Location"}:</b>{" "}
                              {provider.labLocation || t("notProvided", language)}
                            </Typography>
                          </>
                        )}

                        {provider.requestedRole === "RADIOLOGIST" && (
                          <>
                            <Typography variant="body2">
                              <b>{t("radiologyCode", language) || "Radiology Code"}:</b>{" "}
                              {provider.radiologyCode || t("notProvided", language)}
                            </Typography>
                            <Typography variant="body2">
                              <b>{t("radiologyName", language) || "Radiology Center Name"}:</b>{" "}
                              {provider.radiologyName || t("notProvided", language)}
                            </Typography>
                            <Typography variant="body2">
                              <b>{t("radiologyLocation", language) || "Location"}:</b>{" "}
                              {provider.radiologyLocation || t("notProvided", language)}
                            </Typography>
                          </>
                        )}

                        {/* Status */}
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={provider.roleRequestStatus}
                            color={getStatusColor(provider.roleRequestStatus)}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Medical License Documents (for Doctors) */}
                  {provider.requestedRole === "DOCTOR" &&
                    provider.doctorDocumentPaths &&
                    provider.doctorDocumentPaths.length > 0 && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, borderRadius: 2 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{ mb: 1, color: "#556B2F" }}
                          >
                            {t("medicalLicense", language) || "Medical License & Certifications"}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {provider.doctorDocumentPaths.map((doc, index) => (
                              <Avatar
                                key={index}
                                src={`${API_BASE_URL}${doc}`}
                                alt={`${t("document", language)} ${index + 1}`}
                                variant="rounded"
                                sx={{
                                  width: 100,
                                  height: 100,
                                  cursor: "pointer",
                                  border: "2px solid #556B2F",
                                }}
                                onClick={() => {
                                  setPreviewImage(`${API_BASE_URL}${doc}`);
                                  setOpenImageDialog(true);
                                }}
                              />
                            ))}
                          </Stack>
                        </Paper>
                      </Grid>
                    )}
                </Grid>

                {provider.roleRequestStatus === "PENDING" && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: isRTL ? "flex-start" : "flex-end",
                        gap: 2,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        disabled={loadingId === provider.id}
                        onClick={() => handleApprove(provider)}
                        startIcon={
                          loadingId === provider.id ? (
                            <CircularProgress size={18} />
                          ) : null
                        }
                      >
                        {loadingId === provider.id
                          ? t("approving", language) || "Approving..."
                          : t("approve", language) || "Approve"}
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleRejectClick(provider)}
                      >
                        {t("reject", language) || "Reject"}
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>
            ))
          )}

          {/* Pagination */}
          {!loading && filteredProviders.length > 0 && (
            <Paper sx={{ mt: 3, p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("page", language) || "Page"} {page + 1} {t("of", language) || "of"} {Math.ceil(filteredProviders.length / rowsPerPage)} ({filteredProviders.length} {t("total", language) || "total"})
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={t("firstPage", language) || "First Page"}>
                  <span><IconButton onClick={() => setPage(0)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><FirstPageIcon /></IconButton></span>
                </Tooltip>
                <Tooltip title={t("previousPage", language) || "Previous"}>
                  <span><IconButton onClick={() => setPage(page - 1)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateBeforeIcon /></IconButton></span>
                </Tooltip>
                {Array.from({ length: Math.min(5, Math.ceil(filteredProviders.length / rowsPerPage)) }, (_, i) => {
                  const totalPages = Math.ceil(filteredProviders.length / rowsPerPage);
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
                  <span><IconButton onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(filteredProviders.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateNextIcon /></IconButton></span>
                </Tooltip>
                <Tooltip title={t("lastPage", language) || "Last Page"}>
                  <span><IconButton onClick={() => setPage(Math.ceil(filteredProviders.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(filteredProviders.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><LastPageIcon /></IconButton></span>
                </Tooltip>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Reject Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{t("rejectRequest", language) || "Reject Request"}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("pleaseProvideReasonRejecting", language) ||
              "Please provide a reason for rejecting"}{" "}
            <strong>{selectedProvider?.fullName}</strong>:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t("reasonLabel", language) || "Reason"}
            type="text"
            fullWidth
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t("cancel", language) || "Cancel"}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleRejectConfirm}
          >
            {t("confirmReject", language) || "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

      {/* Image Preview Dialog */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="md"
      >
        <DialogTitle>{t("documentPreview", language) || "Document Preview"}</DialogTitle>
        <DialogContent dividers>
          {previewImage && (
            <img
              src={previewImage}
              alt={t("documentPreview", language) || "Document"}
              style={{ width: "100%", height: "auto", borderRadius: "10px" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)} color="primary">
            {t("close", language) || "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingProviderRegistrations;
