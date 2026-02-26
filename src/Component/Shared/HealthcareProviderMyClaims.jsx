import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Avatar,
  Stack,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Tooltip,
} from "@mui/material";
import { api, getToken } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS, CURRENCY } from "../../config/api";
import { CLAIM_STATUS, getStatusColor, getStatusLabel, getStatusConfig } from "../../config/claimStateMachine";
import { ROLES, normalizeRole } from "../../config/roles";
import { formatDate, safeJsonParse } from "../../utils/helpers";
import { sanitizeString } from "../../utils/sanitize";
import { useLanguage } from "../../context/LanguageContext";
import logger from "../../utils/logger";
import { t } from "../../config/translations";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import DownloadIcon from "@mui/icons-material/Download";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoIcon from "@mui/icons-material/Info";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Divider from "@mui/material/Divider";

const HealthcareProviderMyClaims = ({ userRole = "DOCTOR", refreshTrigger = null }) => {
  const { language, isRTL } = useLanguage();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [openImage, setOpenImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // New states for enhanced features
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  const [showFilters, setShowFilters] = useState(true); // Show filters by default
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50); // 50 for table view
  const [cardsPerPage] = useState(10); // 10 for card view

  // View Details Dialog state
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimPrescriptions, setClaimPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Normalize userRole for consistent comparison
  const normalizedRole = useMemo(() => normalizeRole(userRole), [userRole]);

  const handleOpenImage = useCallback((imagePath) => {
    if (!imagePath) return;

    let path = imagePath;

    // If Array, take first element
    if (Array.isArray(imagePath)) {
      path = imagePath[0];
    }

    if (!path) return;

    const fullUrl = path.startsWith("http")
      ? path
      : `${API_BASE_URL}${path}`;

    setSelectedImage(fullUrl);
    setOpenImage(true);
  }, []);



  const handleCloseImage = useCallback(() => {
    setOpenImage(false);
    setSelectedImage(null);
  }, []);

  // View Details handlers
  const handleOpenDetails = useCallback(async (claim) => {
    setSelectedClaim(claim);
    setOpenDetails(true);
    setClaimPrescriptions([]);

    // Check if roleSpecificData already has medicines (new claims)
    const roleData = safeJsonParse(claim.roleSpecificData, {});
    if (roleData.medicines && roleData.medicines.length > 0) {
      // New claim format - medicines already in roleSpecificData
      return;
    }

    // For old claims (doctors only), try to fetch prescriptions
    if (normalizedRole === ROLES.DOCTOR) {
      try {
        setLoadingPrescriptions(true);
        // Use doctor/my endpoint to get all prescriptions by this doctor
        const prescriptions = await api.get("/api/prescriptions/doctor/my");

        if (prescriptions && Array.isArray(prescriptions)) {
          // Filter prescriptions by patient name AND service date
          const claimDate = new Date(claim.serviceDate);
          const patientName = claim.familyMemberName || claim.clientName;

          const matchingPrescriptions = prescriptions.filter(p => {
            const prescDate = new Date(p.createdAt || p.prescriptionDate);
            const sameDay = prescDate.toDateString() === claimDate.toDateString();
            const samePatient = p.memberName === patientName || p.clientName === patientName;
            return sameDay && samePatient;
          });

          setClaimPrescriptions(matchingPrescriptions);
        }
      } catch (err) {
        logger.error("Error fetching prescriptions:", err);
      } finally {
        setLoadingPrescriptions(false);
      }
    }
  }, [normalizedRole]);

  const handleCloseDetails = useCallback(() => {
    setOpenDetails(false);
    setSelectedClaim(null);
    setClaimPrescriptions([]);
  }, []);

  // Fetch claims function using centralized API service
  const fetchClaims = useCallback(async () => {
    const authToken = getToken();

    if (!authToken) {
      logger.error("No token found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.HEALTHCARE_CLAIMS.MY_CLAIMS);
      setClaims(res || []);
    } catch (err) {
      logger.error("Error fetching claims:", err);
      setClaims([]); // Set empty array on error to avoid showing stale data
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch claims on mount
  useEffect(() => {
    const currentToken = getToken();
    if (currentToken) {
      fetchClaims();
    }
  }, [fetchClaims]);

  // Refresh claims when refreshTrigger changes (e.g., after creating a new claim)
  useEffect(() => {
    if (refreshTrigger !== null && refreshTrigger !== undefined) {
      const currentToken = getToken();
      if (currentToken) {
        fetchClaims();
      }
    }
  }, [refreshTrigger, fetchClaims]);

  // Handle search/filter button click
  const handleSearch = useCallback(() => {
    const currentToken = getToken();
    if (currentToken) {
      setPage(0); // Reset to first page when searching
      fetchClaims();
    }
  }, [fetchClaims]);

  // Use centralized status functions from claimStateMachine
  const getClaimStatusColor = useCallback((status) => {
    return getStatusColor(status);
  }, []);

  const getClaimStatusLabel = useCallback((status) => {
    return getStatusLabel(status, true); // short label
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case CLAIM_STATUS.APPROVED_FINAL:
        return <CheckCircleIcon sx={{ fontSize: 18, mr: 0.5 }} />;
      case CLAIM_STATUS.REJECTED_FINAL:
      case CLAIM_STATUS.REJECTED_MEDICAL:
        return <ErrorIcon sx={{ fontSize: 18, mr: 0.5 }} />;
      case CLAIM_STATUS.PENDING_MEDICAL:
      case CLAIM_STATUS.RETURNED_FOR_REVIEW:
      case CLAIM_STATUS.APPROVED_MEDICAL:
      case CLAIM_STATUS.PENDING_COORDINATION:
        return <HourglassTopIcon sx={{ fontSize: 18, mr: 0.5 }} />;
      default:
        return null;
    }
  }, []);


  const getRoleConfig = useMemo(() => {
    const configs = {
      [ROLES.DOCTOR]: {
        title: t("doctorClaims", language),
        icon: "👨‍⚕️",
        color: "#556B2F",
        bgColor: "#F5F5DC",
      },
      [ROLES.PHARMACIST]: {
        title: t("pharmacistClaims", language),
        icon: "💊",
        color: "#7B8B5E",
        bgColor: "#F5F5DC",
      },
      [ROLES.LAB_TECH]: {
        title: t("labTechnicianClaims", language),
        icon: "🧪",
        color: "#8B9A46",
        bgColor: "#F5F5DC",
      },
      [ROLES.RADIOLOGIST]: {
        title: t("radiologistClaims", language),
        icon: "🔍",
        color: "#3D4F23",
        bgColor: "#F5F5DC",
      },
      [ROLES.INSURANCE_CLIENT]: {
        title: t("clientClaims", language),
        icon: "👤",
        color: "#556B2F",
        bgColor: "#F5F5DC",
      },
    };
    return configs[normalizedRole] || configs[ROLES.DOCTOR];
  }, [normalizedRole, language]);

  const getRoleSpecificInfo = useCallback((claim) => {
    return safeJsonParse(claim.roleSpecificData, {});
  }, []);

  // Format description for better readability (especially for client claims)
  const formatDescription = (description, isClient = false) => {
    if (!description) return null;
    
    if (!isClient) {
      // For non-client claims, return as is
      return description;
    }

    // Parse client claim description which can have multiple formats
    const parts = {
      description: '',
      provider: '',
      doctor: '',
      warning: ''
    };

    // First try splitting by newlines
    const lines = description.split('\n').map(l => l.trim()).filter(l => l);
    
    if (lines.length > 1) {
      // Multi-line format
      lines.forEach(line => {
        if (line.match(/^Description\s*:/i)) {
          parts.description = line.replace(/^Description\s*:/i, '').trim();
        } else if (line.match(/Provider\/Center\s*[:\u061B]/i)) {
          parts.provider = line.replace(/Provider\/Center\s*[:\u061B]\s*/i, '').trim();
        } else if (line.match(/Doctor\s*[:\u061B]/i)) {
          parts.doctor = line.replace(/Doctor\s*[:\u061B]\s*/i, '').trim();
        } else if (line.includes('Out of Network') || line.includes('خارج الشبكة')) {
          parts.warning = line.replace(/⚠️\s*/g, '').trim();
        }
      });
    } else {
      // Single line format - need to parse carefully
      const fullText = description.trim();
      
      // Extract description (everything before Provider/Center or first meaningful separator)
      const descEnd = fullText.search(/Provider\/Center|اسم\s*المركز|Doctor\s*[:\u061B]|الطبيب/i);
      if (descEnd > 0) {
        parts.description = fullText.substring(0, descEnd)
          .replace(/^Description\s*:\s*/i, '')
          .trim();
      } else {
        // No separator found, take everything until Out of Network
        const outOfNetworkIndex = fullText.search(/Out of Network|خارج الشبكة/i);
        if (outOfNetworkIndex > 0) {
          parts.description = fullText.substring(0, outOfNetworkIndex)
            .replace(/^Description\s*:\s*/i, '')
            .trim();
        }
      }

      // Extract Provider/Center
      const providerMatch = fullText.match(/Provider\/Center\s*[:\u061B]\s*([^D\n]*?)(?:\s*Doctor\s*[:\u061B]|$)/i) ||
                           fullText.match(/اسم\s*[:\u061B]?\s*\(?Provider\/Center\)?\s*اسم\s*المركز\s*([^الطبيب\n]*?)(?:\s*الطبيب|$)/i);
      if (providerMatch) {
        parts.provider = providerMatch[1].trim();
      }

      // Extract Doctor
      const doctorMatch = fullText.match(/Doctor\s*[:\u061B]\s*([^O\n]*?)(?:\s*Out|$)/i) ||
                         fullText.match(/الطبيب\s*[:\u061B]\s*([^خارج\n]*?)(?:\s*خارج|$)/i);
      if (doctorMatch) {
        parts.doctor = doctorMatch[1].trim();
      }

      // Extract warning
      const warningMatch = fullText.match(/(Out of Network[^]*?)$/i) ||
                          fullText.match(/(خارج الشبكة[^]*?)$/i);
      if (warningMatch) {
        parts.warning = warningMatch[1].trim();
      }
    }

    // Fallback: if description is empty but we have text, use first part
    if (!parts.description) {
      const firstPart = description.split(/Provider\/Center|اسم\s*المركز|Doctor\s*[:\u061B]|الطبيب/i)[0];
      parts.description = firstPart.replace(/^Description\s*:\s*/i, '').trim();
    }

    // Clean up extracted values - remove extra spaces and colons
    parts.description = parts.description.replace(/[:\u061B]\s*$/, '').trim();
    parts.provider = parts.provider.replace(/[:\u061B]\s*$/, '').trim();
    parts.doctor = parts.doctor.replace(/[:\u061B]\s*$/, '').trim();
    
    // Clean warning text
    if (parts.warning) {
      parts.warning = parts.warning.replace(/^⚠️\s*/, '').trim();
      if (parts.warning.includes('Client submitted claim')) {
        parts.warning = 'Out of Network - Client submitted claim for services outside the insurance network';
      } else if (parts.warning.includes('تم إرسال المطالبة')) {
        parts.warning = 'خارج الشبكة - تم إرسال المطالبة من قبل العميل لخدمات خارج شبكة التأمين';
      }
    }

    return parts;
  };

  // Use centralized formatDate from helpers - now using formatDate imported from helpers
  const formatClaimDate = useCallback((dateString) => {
    return formatDate(dateString, 'short');
  }, []);

  const roleConfig = getRoleConfig;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setFilterStatus("ALL");
    setDateFrom("");
    setDateTo("");
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || filterStatus !== "ALL" || dateFrom !== "" || dateTo !== "";
  }, [searchTerm, filterStatus, dateFrom, dateTo]);

  const filteredClaims = claims
    .filter((claim) => {
      const roleData = getRoleSpecificInfo(claim);
      const matchSearch =
        claim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(roleData).toLowerCase().includes(searchTerm.toLowerCase());

      const matchFilter = filterStatus === "ALL" || claim.status === filterStatus;

      // Date filtering
      let matchDate = true;
      if (dateFrom) {
        const claimDate = new Date(claim.serviceDate);
        const fromDate = new Date(dateFrom);
        matchDate = matchDate && claimDate >= fromDate;
      }
      if (dateTo) {
        const claimDate = new Date(claim.serviceDate);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end day
        matchDate = matchDate && claimDate <= toDate;
      }

      return matchSearch && matchFilter && matchDate;
    })
    .sort((a, b) => {
      // ترتيب من الأحدث للأقدم
      const dateA = new Date(a.serviceDate);
      const dateB = new Date(b.serviceDate);
      return dateB - dateA;
    });

  // Handle page change for table view
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  // Handle rows per page change
  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <Box dir={isRTL ? "rtl" : "ltr"} sx={{ px: { xs: 2, md: 4 }, py: 3, backgroundColor: "#FAF8F5", minHeight: "100vh" }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.color}dd 100%)`,
          color: "white",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              width: 64,
              height: 64,
              fontSize: 32,
            }}
          >
            {roleConfig.icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
              {roleConfig.title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {t("viewManageSubmittedClaims", language)}
            </Typography>
          </Box>
        </Stack>

        {/* Stats Summary */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="h4" fontWeight="700">
                {claims.length}
              </Typography>
              <Typography variant="body2">{t("total", language)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="h4" fontWeight="700">
                {claims.filter((c) => c.status === CLAIM_STATUS.PENDING_MEDICAL).length}
              </Typography>
              <Typography variant="body2">{t("pendingMedicalStatus", language)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="h4" fontWeight="700">
                {claims.filter((c) => c.status === CLAIM_STATUS.APPROVED_FINAL).length}
              </Typography>
              <Typography variant="body2">{t("approved", language)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="h4" fontWeight="700">
                {claims.filter((c) => c.status === CLAIM_STATUS.REJECTED_FINAL).length}
              </Typography>
              <Typography variant="body2">{t("rejected", language)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter & Search Section */}
      <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0", mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Top Row: Search, View Toggle, Filter Toggle */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              {/* Search Bar */}
              <TextField
                placeholder={t("searchClaimsPlaceholder", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "#FAF8F5",
                  },
                }}
              />

              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
                sx={{ bgcolor: "#FAF8F5", borderRadius: 2 }}
              >
                <ToggleButton value="cards" sx={{ px: 2 }}>
                  <Tooltip title={t("cardView", language) || "Card View"}>
                    <ViewModuleIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="table" sx={{ px: 2 }}>
                  <Tooltip title={t("tableView", language) || "Table View"}>
                    <ViewListIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Filter Toggle Button */}
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterListIcon />}
                endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  minWidth: 120,
                  bgcolor: showFilters ? roleConfig.color : "transparent",
                  borderColor: roleConfig.color,
                  color: showFilters ? "white" : roleConfig.color,
                  "&:hover": {
                    bgcolor: showFilters ? roleConfig.color : `${roleConfig.color}10`,
                    borderColor: roleConfig.color,
                  },
                }}
              >
                {t("filters", language) || "Filters"}
                {hasActiveFilters && (
                  <Chip
                    size="small"
                    label="!"
                    sx={{
                      ml: 1,
                      height: 18,
                      minWidth: 18,
                      bgcolor: showFilters ? "white" : roleConfig.color,
                      color: showFilters ? roleConfig.color : "white",
                      fontSize: "0.7rem",
                    }}
                  />
                )}
              </Button>
            </Stack>

            {/* Collapsible Filters Panel */}
            <Collapse in={showFilters}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2, mt: 1 }}>
                <Grid container spacing={2} alignItems="flex-end">
                  {/* Date From */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", mb: 0.5, display: "block" }}>
                      {t("dateFrom", language) || "Date From"}
                    </Typography>
                    <TextField
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                  </Grid>

                  {/* Date To */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", mb: 0.5, display: "block" }}>
                      {t("dateTo", language) || "Date To"}
                    </Typography>
                    <TextField
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                  </Grid>

                  {/* Search Button */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleSearch}
                      disabled={loading}
                      fullWidth
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: roleConfig.color,
                        "&:hover": {
                          bgcolor: roleConfig.color,
                          opacity: 0.9,
                        },
                      }}
                    >
                      {loading ? (t("loading", language) || "Loading...") : (t("searchClaims", language) || "Search Claims")}
                    </Button>
                  </Grid>

                  {/* Clear Filters Button */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearAllFilters}
                      disabled={!hasActiveFilters}
                      fullWidth
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        borderColor: "#94a3b8",
                        color: "#64748b",
                        "&:hover": {
                          borderColor: "#64748b",
                          bgcolor: "#f1f5f9",
                        },
                      }}
                    >
                      {t("clearFilters", language) || "Clear Filters"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>

            {/* Status Filter Chips */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  mb: 1.5,
                  color: "#1e293b",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                }}
              >
                {t("filterByStatusLabel", language)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[
                  { status: "ALL", label: t("all", language), count: claims.length },
                  {
                    status: CLAIM_STATUS.PENDING_MEDICAL,
                    label: t("pendingMedicalStatus", language),
                    count: claims.filter(c => c.status === CLAIM_STATUS.PENDING_MEDICAL).length
                  },
                  {
                    status: CLAIM_STATUS.RETURNED_FOR_REVIEW,
                    label: t("returnedForReview", language),
                    count: claims.filter(c => c.status === CLAIM_STATUS.RETURNED_FOR_REVIEW).length
                  },
                  {
                    status: CLAIM_STATUS.APPROVED_FINAL,
                    label: t("approved", language),
                    count: claims.filter(c => c.status === CLAIM_STATUS.APPROVED_FINAL).length
                  },
                  {
                    status: CLAIM_STATUS.REJECTED_FINAL,
                    label: t("rejected", language),
                    count: claims.filter(c => c.status === CLAIM_STATUS.REJECTED_FINAL).length
                  },
                ].map(({ status, label, count }) => (
                  <Chip
                    key={status}
                    label={`${label} (${count})`}
                    onClick={() => setFilterStatus(status)}
                    variant={filterStatus === status ? "filled" : "outlined"}
                    color={
                      status === "ALL"
                        ? filterStatus === "ALL" ? "primary" : "default"
                        : status === CLAIM_STATUS.APPROVED_FINAL ? "success"
                        : status === CLAIM_STATUS.REJECTED_FINAL ? "error"
                        : status === CLAIM_STATUS.RETURNED_FOR_REVIEW ? "info"
                        : "warning"
                    }
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Results Count */}
      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        {t("showingClaims", language)} <strong>{filteredClaims.length}</strong> {filteredClaims.length !== 1 ? t("claimPlural", language) : t("claimSingular", language)}
      </Typography>

      {/* Claims Display - Table or Card View */}
      {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredClaims.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                borderRadius: 4,
                fontSize: "1rem",
                "& .MuiAlert-icon": { fontSize: 28 },
              }}
            >
              {claims.length === 0 ? t("noClaimsSubmitted", language) : t("noClaimsMatch", language)}
            </Alert>
          ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E8EDE0", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: roleConfig.color }}>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("patient", language) || "Patient"}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("description", language) || "Description"}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("amount", language) || "Amount"}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("date", language) || "Date"}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("status", language) || "Status"}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, textAlign: "center" }}>{t("actions", language) || "Actions"}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClaims
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((claim, index) => {
                    const statusConfig = getStatusConfig(claim.status);
                    return (
                      <TableRow
                        key={claim.id}
                        sx={{
                          "&:hover": { bgcolor: "#f8fafc" },
                          borderLeft: `4px solid ${statusConfig.borderColor}`,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" fontWeight={600}>
                              {claim.familyMemberName || claim.clientName || "N/A"}
                            </Typography>
                            {claim.familyMemberName && claim.familyMemberRelation && (
                              <Typography variant="caption" color="text.secondary">
                                ({claim.familyMemberRelation})
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 250 }}>
                          <Typography variant="body2" noWrap title={claim.description}>
                            {claim.description ? sanitizeString(claim.description).substring(0, 50) + (claim.description.length > 50 ? "..." : "") : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color={roleConfig.color}>
                            {parseFloat(claim.amount || 0).toFixed(2)} {CURRENCY.SYMBOL}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatClaimDate(claim.serviceDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(claim.status)}
                            label={getClaimStatusLabel(claim.status)}
                            color={getClaimStatusColor(claim.status)}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {/* View Details Button */}
                            <Tooltip title={t("viewDetails", language) || "View Details"}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDetails(claim)}
                                sx={{ color: "#1976d2" }}
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {/* View Document Button */}
                            {(Array.isArray(claim.invoiceImagePath)
                              ? claim.invoiceImagePath.length > 0
                              : !!claim.invoiceImagePath) && (
                              <Tooltip title={t("viewDocument", language) || "View Document"}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenImage(claim.invoiceImagePath)}
                                  sx={{ color: roleConfig.color }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredClaims.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t("rowsPerPage", language) || "Rows per page:"}
            sx={{ borderTop: "1px solid #E8EDE0" }}
          />
        </Paper>
      ) : (
        /* CARD VIEW */
        <>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            "@media (max-width: 900px)": {
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            },
            "@media (max-width: 600px)": {
              gridTemplateColumns: "1fr",
            },
          }}
        >
          {filteredClaims
            .slice(page * cardsPerPage, page * cardsPerPage + cardsPerPage)
            .map((claim, index) => {
            const roleData = getRoleSpecificInfo(claim);
            const isChronicPrescription = roleData?.isChronic === true; // ✅ للوصفات المزمنة
            const statusConfig = getStatusConfig(claim.status);
            const actualIndex = page * cardsPerPage + index;

            // ✅ Debug: Log isChronic for each claim
            if (userRole === "PHARMACIST") {
              logger.log(`Claim ${actualIndex + 1} (ID: ${claim.id}) - isChronicPrescription:`, isChronicPrescription, "roleData.isChronic:", roleData?.isChronic, "roleData:", roleData);
            }

            return (
              <Card
                key={claim.id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  minHeight: 420,
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: `6px solid ${statusConfig.borderColor}`,
                  borderTop: "1px solid #E8EDE0",
                  borderRight: "1px solid #E8EDE0",
                  borderBottom: "1px solid #E8EDE0",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  backgroundColor: `${statusConfig.bgColor}30`,
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: `0 12px 40px ${statusConfig.borderColor}40`,
                    borderLeftColor: statusConfig.borderColor,
                  },
                }}
              >
                {/* Card Header with Claim Number and Icon Background */}
                <Box
                  sx={{
                    background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.color}dd 100%)`,
                    p: 1.5,
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Icon Background */}
                  <Box
                    sx={{
                      position: "absolute",
                      right: -10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "3.5rem",
                      opacity: 0.15,
                    }}
                  >
                    {roleConfig.icon}
                  </Box>

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ position: "relative", zIndex: 1 }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "700",
                        fontSize: "1.1rem",
                        color: "white",
                      }}
                    >
                      {t("claimLabel", language)} {actualIndex + 1}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(claim.status)}
                      label={getClaimStatusLabel(claim.status)}
                      color={getClaimStatusColor(claim.status)}
                      variant="filled"
                      size="small"
                      sx={{
                        fontWeight: "700",
                        fontSize: "0.65rem",
                        height: 24,
                      }}
                    />
                  </Stack>
                </Box>

                <CardContent
                  sx={{
                    flexGrow: 1,
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.8,
                  }}
                >
                  {/* Patient/Client Information - Different display for clients vs providers */}
                  {normalizedRole !== ROLES.INSURANCE_CLIENT ? (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: "#F5F5DC",
                        border: "1px solid #7B8B5E",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: "#E8E8D0",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PersonIcon sx={{ fontSize: 16, color: roleConfig.color }} />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: "700",
                              color: roleConfig.color,
                              fontSize: "0.58rem",
                              letterSpacing: "0.3px",
                              textTransform: "uppercase",
                            }}
                          >
                            {t("patientInformation", language) || "Patient Information"}
                          </Typography>
                        </Stack>
                        
                        {/* Family Member Info (if claim is for family member) */}
                        {claim.familyMemberName && (
                          <Box sx={{ pl: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem", mb: 0.5 }}>
                              {claim.familyMemberName}
                              {claim.familyMemberRelation && ` (${claim.familyMemberRelation})`}
                            </Typography>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap">
                              {claim.familyMemberAge && (
                                <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                  {t("age", language) || "Age"}: {typeof claim.familyMemberAge === 'number' ? `${claim.familyMemberAge} ${t("years", language) || "years"}` : claim.familyMemberAge}
                                </Typography>
                              )}
                              {claim.familyMemberGender && (
                                <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                  {t("gender", language) || "Gender"}: {claim.familyMemberGender}
                                </Typography>
                              )}
                              {claim.clientEmployeeId && (
                                <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                  {t("employeeId", language) || "Emp ID"}: {claim.clientEmployeeId}
                                </Typography>
                              )}
                            </Stack>

                            {/* Main Client Info (shown when claim is for family member) - hidden for simplified view */}
                            {claim.clientName && normalizedRole !== ROLES.PHARMACIST && normalizedRole !== ROLES.LAB_TECH && normalizedRole !== ROLES.RADIOLOGIST && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid #7B8B5E" }}>
                                <Typography variant="caption" sx={{ fontWeight: "600", color: "#556B2F", fontSize: "0.65rem", textTransform: "uppercase" }}>
                                  {t("mainClient", language) || "Main Client"}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: "600", color: "#3D4F23", fontSize: "0.8rem", mt: 0.3 }}>
                                  {claim.clientName}
                                </Typography>
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                  {claim.clientAge && (
                                    <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                      {t("age", language) || "Age"}: {typeof claim.clientAge === 'number' ? `${claim.clientAge} ${t("years", language) || "years"}` : claim.clientAge}
                                    </Typography>
                                  )}
                                  {claim.clientGender && (
                                    <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                      {t("gender", language) || "Gender"}: {claim.clientGender}
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        )}
                        
                        {/* Client Info (if claim is for client directly, not family member) */}
                        {!claim.familyMemberName && claim.clientName && (
                          <Box sx={{ pl: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem", mb: 0.5 }}>
                              {claim.clientName}
                            </Typography>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap">
                              {claim.clientAge && (
                                <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                  {t("age", language) || "Age"}: {typeof claim.clientAge === 'number' ? `${claim.clientAge} ${t("years", language) || "years"}` : claim.clientAge}
                                </Typography>
                              )}
                              {claim.clientGender && (
                                <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                  {t("gender", language) || "Gender"}: {claim.clientGender}
                                </Typography>
                              )}
                              {claim.clientEmployeeId && (
                                <Typography variant="caption" sx={{ color: "#556B2F", fontSize: "0.7rem" }}>
                                  {t("employeeId", language) || "Emp ID"}: {claim.clientEmployeeId}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  ) : (
                    // Client-specific display: Show if claim is for themselves or family member
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: claim.familyMemberName ? "#F5F5DC" : "#F5F5DC",
                        border: claim.familyMemberName ? "1px solid #8B9A46" : "1px solid #7B8B5E",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: claim.familyMemberName ? "#E8E8D0" : "#E8E8D0",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {claim.familyMemberName ? (
                            <FamilyRestroomIcon sx={{ fontSize: 16, color: "#8B9A46" }} />
                          ) : (
                            <PersonIcon sx={{ fontSize: 16, color: "#556B2F" }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: "700",
                              color: claim.familyMemberName ? "#8B9A46" : "#556B2F",
                              fontSize: "0.58rem",
                              letterSpacing: "0.3px",
                              textTransform: "uppercase",
                            }}
                          >
                            {claim.familyMemberName ? "Family Member Claim" : "My Claim"}
                          </Typography>
                        </Stack>
                        
                        {/* Family Member Info (if claim is for family member) */}
                        {claim.familyMemberName ? (
                          <Box sx={{ pl: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem", mb: 0.5 }}>
                              {claim.familyMemberName}
                              {claim.familyMemberRelation && ` (${claim.familyMemberRelation})`}
                            </Typography>
                            {/* Age, Gender, and Insurance Number hidden for clients */}
                          </Box>
                        ) : (
                          // Claim for themselves
                          <Box sx={{ pl: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem", mb: 0.5 }}>
                              {claim.clientName || "Myself"}
                            </Typography>
                            {/* Age, Gender, and Employee ID hidden for clients */}
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  )}

                  {/* Description - Only for DOCTOR and CLIENT roles */}
                  {claim.description && normalizedRole !== ROLES.PHARMACIST && normalizedRole !== ROLES.LAB_TECH && normalizedRole !== ROLES.RADIOLOGIST && (() => {
                    const isClient = normalizedRole === ROLES.INSURANCE_CLIENT;
                    const formatted = formatDescription(claim.description, isClient);
                    // ✅ Use roleData.isChronic directly to ensure correct value for each claim
                    const isChronicPrescription = roleData?.isChronic === true; // ✅ للوصفات المزمنة
                    
                    
                    if (isClient && formatted && typeof formatted === 'object') {
                      // Display formatted description for clients with better organization
                      return (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.8,
                            borderRadius: 1.5,
                            bgcolor: "#FAF8F5",
                            border: "1px solid #e5e7eb",
                            minHeight: 60,
                          }}
                        >
                          <Stack spacing={1.5}>
                            {formatted.description && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: "700",
                                    color: "#475569",
                                    fontSize: "0.6rem",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                    display: "block",
                                    mb: 0.8,
                                  }}
                                >
                                  Description
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#1e293b",
                                    fontSize: "0.8rem",
                                    lineHeight: 1.7,
                                    fontWeight: "500",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {sanitizeString(formatted.description)}
                                </Typography>
                              </Box>
                            )}
                            
                            {(formatted.provider || formatted.doctor) && (
                              <Box
                                sx={{
                                  pt: 1.2,
                                  borderTop: "1px solid #e5e7eb",
                                }}
                              >
                                <Stack spacing={1.2}>
                                  {formatted.provider && (
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: "700",
                                          color: "#475569",
                                          fontSize: "0.6rem",
                                          letterSpacing: "0.5px",
                                          textTransform: "uppercase",
                                          display: "block",
                                          mb: 0.5,
                                        }}
                                      >
                                        Provider/Center
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "#1e293b",
                                          fontSize: "0.8rem",
                                          fontWeight: "600",
                                          dir: "auto",
                                        }}
                                      >
                                        {sanitizeString(formatted.provider)}
                                      </Typography>
                                    </Box>
                                  )}
                                  {formatted.doctor && (
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: "700",
                                          color: "#475569",
                                          fontSize: "0.6rem",
                                          letterSpacing: "0.5px",
                                          textTransform: "uppercase",
                                          display: "block",
                                          mb: 0.5,
                                        }}
                                      >
                                        {isChronicPrescription ? "Medical Admin" : "Doctor"}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "#1e293b",
                                          fontSize: "0.8rem",
                                          fontWeight: "600",
                                          dir: "auto",
                                        }}
                                      >
                                        {sanitizeString(formatted.doctor)}
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                            )}
                            
                          </Stack>
                        </Paper>
                      );
                    } else {
                      // Default display for non-client claims
                      return (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.3,
                            borderRadius: 1.5,
                            bgcolor: "#FAF8F5",
                            border: "1px dashed #d1d5db",
                            minHeight: 60,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: "700",
                              color: "#64748b",
                              fontSize: "0.58rem",
                              letterSpacing: "0.3px",
                              textTransform: "uppercase",
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            Description
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#334155",
                              fontSize: "0.72rem",
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {sanitizeString(claim.description)}
                          </Typography>
                        </Paper>
                      );
                    }
                  })()}

                  {/* Provider Name - Only for DOCTOR and CLIENT roles */}
                  {roleData.providerName && normalizedRole !== ROLES.PHARMACIST && normalizedRole !== ROLES.LAB_TECH && normalizedRole !== ROLES.RADIOLOGIST && (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 1.5,
      bgcolor: "#f0f9ff",
      border: "1px solid #bae6fd",
    }}
  >
    <Stack spacing={0.5}>
      <Typography variant="caption" fontWeight="700" fontSize="0.6rem">
        Provider / Center
      </Typography>
      <Typography variant="body2" fontWeight="600">
        {sanitizeString(roleData.providerName)}
      </Typography>
    </Stack>
  </Paper>
)}

{/* Doctor Name - Only for DOCTOR and CLIENT roles */}
{roleData.doctorName && normalizedRole !== ROLES.PHARMACIST && normalizedRole !== ROLES.LAB_TECH && normalizedRole !== ROLES.RADIOLOGIST && (() => {
  // Parse roleSpecificData to check if chronic prescription
  const parsedData = safeJsonParse(claim.roleSpecificData, {});
  const isChronic = parsedData?.isChronic === true || parsedData?.isChronic === "true";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.2,
        borderRadius: 1.5,
        bgcolor: "#f0fdf4",
        border: "1px solid #bbf7d0",
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="caption" fontWeight="700" fontSize="0.6rem">
          {isChronic ? "Medical Admin" : "Doctor"}
        </Typography>
        <Typography variant="body2" fontWeight="600">
          {sanitizeString(roleData.doctorName)}
        </Typography>
      </Stack>
    </Paper>
  );
})()}

                  {/* Medicines List - For Pharmacist Claims */}
                  {normalizedRole === ROLES.PHARMACIST && (() => {
                    // Check for both 'items' (current format) and 'medicines' (legacy format)
                    const medicinesList = roleData?.items || roleData?.medicines;
                    if (!medicinesList || !Array.isArray(medicinesList) || medicinesList.length === 0) return null;

                    return (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 0,
                          borderRadius: 2,
                          bgcolor: "#fff",
                          border: "1px solid #e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        {/* Table Header */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            px: 2,
                            py: 1,
                            bgcolor: "#556B2F",
                            color: "white",
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocalPharmacyIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                              {language === "ar" ? "الدواء" : "Medicine"}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {language === "ar" ? "السعر" : "Price"}
                          </Typography>
                        </Box>
                        {/* Table Body */}
                        <Box sx={{ px: 2 }}>
                          {medicinesList.map((med, idx) => (
                            <Box
                              key={`${med?.name || med?.medicineName || "med"}-${idx}`}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 1,
                                borderBottom: idx < medicinesList.length - 1 ? "1px solid #e2e8f0" : "none",
                              }}
                            >
                              <Typography variant="body2" fontWeight={600} color="#1e293b">
                                {med?.name || med?.medicineName || "Medicine"}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="#556B2F">
                                {med?.price != null && med.price > 0
                                  ? `${parseFloat(med.price).toFixed(2)} ${CURRENCY.SYMBOL}`
                                  : "-"}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                        {/* Billing Date Footer */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            px: 2,
                            py: 1,
                            bgcolor: "#f8fafc",
                            borderTop: "1px solid #e2e8f0",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {language === "ar" ? "تاريخ الفوترة:" : "Billing Date:"}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} color="#556B2F">
                            {formatClaimDate(claim.serviceDate)}
                          </Typography>
                        </Box>
                      </Paper>
                    );
                  })()}

                  {/* Lab Tests - For Lab Tech Claims */}
                  {normalizedRole === ROLES.LAB_TECH && (roleData?.testName || (roleData?.items && roleData.items.length > 0)) && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        borderRadius: 2,
                        bgcolor: "#fff",
                        border: "1px solid #e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      {/* Table Header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          px: 2,
                          py: 1,
                          bgcolor: "#1d4ed8",
                          color: "white",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <ScienceIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {language === "ar" ? "الفحص المخبري" : "Lab Test"}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {language === "ar" ? "السعر" : "Price"}
                        </Typography>
                      </Box>
                      {/* Table Body */}
                      <Box sx={{ px: 2 }}>
                        {roleData?.items && roleData.items.length > 0 ? (
                          roleData.items.map((item, idx) => (
                            <Box
                              key={`lab-${item?.name || item?.testName || "item"}-${idx}`}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 1,
                                borderBottom: idx < roleData.items.length - 1 ? "1px solid #e2e8f0" : "none",
                              }}
                            >
                              <Typography variant="body2" fontWeight={600} color="#1e293b">
                                {item?.name || item?.testName || "Lab Test"}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="#1d4ed8">
                                {item?.price != null && item.price > 0
                                  ? `${parseFloat(item.price).toFixed(2)} ${CURRENCY.SYMBOL}`
                                  : "-"}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600} color="#1e293b">
                              {roleData.testName}
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="#1d4ed8">
                              {roleData.finalPrice || roleData.enteredPrice
                                ? `${parseFloat(roleData.finalPrice || roleData.enteredPrice).toFixed(2)} ${CURRENCY.SYMBOL}`
                                : "-"}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      {/* Billing Date Footer */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          px: 2,
                          py: 1,
                          bgcolor: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {language === "ar" ? "تاريخ الفوترة:" : "Billing Date:"}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="#1d4ed8">
                          {formatClaimDate(claim.serviceDate)}
                        </Typography>
                      </Box>
                    </Paper>
                  )}

                  {/* Radiology Tests - For Radiologist Claims */}
                  {normalizedRole === ROLES.RADIOLOGIST && (roleData?.testName || (roleData?.items && roleData.items.length > 0)) && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        borderRadius: 2,
                        bgcolor: "#fff",
                        border: "1px solid #e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      {/* Table Header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          px: 2,
                          py: 1,
                          bgcolor: "#7c3aed",
                          color: "white",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <ImageSearchIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {language === "ar" ? "فحص الأشعة" : "Radiology Test"}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {language === "ar" ? "السعر" : "Price"}
                        </Typography>
                      </Box>
                      {/* Table Body */}
                      <Box sx={{ px: 2 }}>
                        {roleData?.items && roleData.items.length > 0 ? (
                          roleData.items.map((item, idx) => (
                            <Box
                              key={`rad-${item?.name || item?.testName || "item"}-${idx}`}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 1,
                                borderBottom: idx < roleData.items.length - 1 ? "1px solid #e2e8f0" : "none",
                              }}
                            >
                              <Typography variant="body2" fontWeight={600} color="#1e293b">
                                {item?.name || item?.testName || "Radiology Test"}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="#7c3aed">
                                {item?.price != null && item.price > 0
                                  ? `${parseFloat(item.price).toFixed(2)} ${CURRENCY.SYMBOL}`
                                  : "-"}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600} color="#1e293b">
                              {roleData.testName}
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="#7c3aed">
                              {roleData.finalPrice || roleData.approvedPrice || roleData.enteredPrice
                                ? `${parseFloat(roleData.finalPrice || roleData.approvedPrice || roleData.enteredPrice).toFixed(2)} ${CURRENCY.SYMBOL}`
                                : "-"}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      {/* Billing Date Footer */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          px: 2,
                          py: 1,
                          bgcolor: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {language === "ar" ? "تاريخ الفوترة:" : "Billing Date:"}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="#7c3aed">
                          {formatClaimDate(claim.serviceDate)}
                        </Typography>
                      </Box>
                    </Paper>
                  )}

                  {/* Amount & Date */}
                  <Grid container spacing={1}>
                    {/* Amount */}
                    <Grid item xs={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.2,
                          borderRadius: 1.5,
                          bgcolor: "#F5F5DC",
                          border: "1px solid #A8B56B",
                          transition: "all 0.3s ease",
                          minHeight: 65,
                          "&:hover": {
                            bgcolor: "#E8E8D0",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <MonetizationOnIcon sx={{ fontSize: 16, color: "#8B9A46" }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "700",
                                color: "#8B9A46",
                                fontSize: "0.55rem",
                                letterSpacing: "0.3px",
                                textTransform: "uppercase",
                              }}
                            >
                              {t("total", language) || "Total"}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "700",
                                color: "#8B9A46",
                                fontSize: "0.8rem",
                              }}
                            >
                              {parseFloat(claim.amount || 0).toFixed(2)} {CURRENCY.SYMBOL}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Date */}
                    <Grid item xs={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.2,
                          borderRadius: 1.5,
                          bgcolor: "#FAF8F5",
                          border: "1px solid #7B8B5E",
                          transition: "all 0.3s ease",
                          minHeight: 65,
                          "&:hover": {
                            bgcolor: "#E8E8D0",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AccessTimeIcon sx={{ fontSize: 16, color: "#7B8B5E" }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "700",
                                color: "#7B8B5E",
                                fontSize: "0.55rem",
                                letterSpacing: "0.3px",
                                textTransform: "uppercase",
                              }}
                            >
                              {t("date", language) || "Date"}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "600",
                                color: "#1e293b",
                                fontSize: "0.8rem",
                              }}
                            >
                              {formatClaimDate(claim.serviceDate)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Action Buttons */}
                  <Box sx={{ mt: "auto" }}>
                    <Stack spacing={1}>
                      {/* View Details Button - Only for DOCTOR and CLIENT roles */}
                      {normalizedRole !== ROLES.PHARMACIST && normalizedRole !== ROLES.LAB_TECH && normalizedRole !== ROLES.RADIOLOGIST && (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<InfoIcon />}
                        onClick={() => handleOpenDetails(claim)}
                        sx={{
                          py: 1,
                          textTransform: "none",
                          fontWeight: "600",
                          borderRadius: 2,
                          borderColor: "#1976d2",
                          color: "#1976d2",
                          "&:hover": {
                            borderColor: "#1565c0",
                            bgcolor: "#e3f2fd",
                            transform: "translateY(-2px)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        {t("viewDetails", language) || "View Details"}
                      </Button>
                      )}

                      {/* View Document Button - only show when document exists */}
                      {(Array.isArray(claim.invoiceImagePath)
                        ? claim.invoiceImagePath.length > 0
                        : !!claim.invoiceImagePath) && (
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<InsertDriveFileIcon />}
                          onClick={() => handleOpenImage(claim.invoiceImagePath)}
                          sx={{
                            py: 1,
                            textTransform: "none",
                            fontWeight: "600",
                            borderRadius: 2,
                            backgroundColor: roleConfig.color,
                            "&:hover": {
                              backgroundColor: roleConfig.color,
                              opacity: 0.9,
                              transform: "translateY(-2px)",
                              boxShadow: `0 4px 12px ${roleConfig.color}40`,
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          {t("viewDocument", language) || "View Document"}
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Card View Pagination */}
        {filteredClaims.length > cardsPerPage && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              mt: 4,
              py: 2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ChevronLeftIcon />}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor: roleConfig.color,
                color: roleConfig.color,
                "&:hover": {
                  borderColor: roleConfig.color,
                  bgcolor: `${roleConfig.color}10`,
                },
                "&.Mui-disabled": {
                  borderColor: "#ccc",
                  color: "#ccc",
                },
              }}
            >
              {t("previous", language) || "Previous"}
            </Button>

            <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary", minWidth: 120, textAlign: "center" }}>
              {t("page", language) || "Page"} {page + 1} / {Math.ceil(filteredClaims.length / cardsPerPage)}
            </Typography>

            <Button
              variant="outlined"
              endIcon={<ChevronRightIcon />}
              onClick={() => setPage(prev => Math.min(Math.ceil(filteredClaims.length / cardsPerPage) - 1, prev + 1))}
              disabled={page >= Math.ceil(filteredClaims.length / cardsPerPage) - 1}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor: roleConfig.color,
                color: roleConfig.color,
                "&:hover": {
                  borderColor: roleConfig.color,
                  bgcolor: `${roleConfig.color}10`,
                },
                "&.Mui-disabled": {
                  borderColor: "#ccc",
                  color: "#ccc",
                },
              }}
            >
              {t("next", language) || "Next"}
            </Button>
          </Box>
        )}
        </>
      )}

      {/* Image Viewer Dialog */}
      <Dialog
        open={openImage}
        onClose={handleCloseImage}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight="700">
            Document Viewer
          </Typography>
          <IconButton
            onClick={handleCloseImage}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                py: 2,
              }}
            >
              <img
                src={selectedImage}
                alt="Document"
                style={{
                  maxWidth: "100%",
                  maxHeight: "600px",
                  borderRadius: "8px",
                }}
                onError={(e) => {
                  e.target.src = "";
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim Details Dialog */}
      <Dialog
        open={openDetails}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: roleConfig.color,
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <InfoIcon />
            <Typography variant="h6" fontWeight="700">
              {t("claimDetails", language) || "Claim Details"}
            </Typography>
          </Stack>
          <IconButton
            onClick={handleCloseDetails}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedClaim && (() => {
            const detailsRoleData = safeJsonParse(selectedClaim.roleSpecificData, {});
            const statusConfig = getStatusConfig(selectedClaim.status);

            return (
              <Box sx={{ p: 3 }}>
                {/* Status Badge */}
                <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                  <Chip
                    icon={getStatusIcon(selectedClaim.status)}
                    label={getClaimStatusLabel(selectedClaim.status)}
                    color={getClaimStatusColor(selectedClaim.status)}
                    sx={{ fontWeight: 700, fontSize: "0.9rem", py: 2.5, px: 1 }}
                  />
                </Box>

                <Grid container spacing={3}>
                  {/* Patient Information */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0", height: "100%" }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <PersonIcon sx={{ color: roleConfig.color }} />
                        <Typography variant="subtitle1" fontWeight={700} color={roleConfig.color}>
                          {t("patientInformation", language) || "Patient Information"}
                        </Typography>
                      </Stack>
                      <Divider sx={{ mb: 1.5 }} />
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t("name", language) || "Name"}</Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {selectedClaim.familyMemberName || selectedClaim.clientName || "N/A"}
                          </Typography>
                        </Box>
                        {selectedClaim.familyMemberName && selectedClaim.familyMemberRelation && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("relation", language) || "Relation"}</Typography>
                            <Typography variant="body2">{selectedClaim.familyMemberRelation}</Typography>
                          </Box>
                        )}
                        {(selectedClaim.clientAge || selectedClaim.familyMemberAge) && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("age", language) || "Age"}</Typography>
                            <Typography variant="body2">{selectedClaim.familyMemberAge || selectedClaim.clientAge} {t("years", language) || "years"}</Typography>
                          </Box>
                        )}
                        {(selectedClaim.clientGender || selectedClaim.familyMemberGender) && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("gender", language) || "Gender"}</Typography>
                            <Typography variant="body2">{selectedClaim.familyMemberGender || selectedClaim.clientGender}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Claim Summary */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0", height: "100%" }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <ReceiptIcon sx={{ color: roleConfig.color }} />
                        <Typography variant="subtitle1" fontWeight={700} color={roleConfig.color}>
                          {t("claimSummary", language) || "Claim Summary"}
                        </Typography>
                      </Stack>
                      <Divider sx={{ mb: 1.5 }} />
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t("serviceDate", language) || "Service Date"}</Typography>
                          <Typography variant="body1" fontWeight={600}>{formatClaimDate(selectedClaim.serviceDate)}</Typography>
                        </Box>
                        {selectedClaim.submittedAt && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("submittedAt", language) || "Submitted At"}</Typography>
                            <Typography variant="body1" fontWeight={600}>{formatClaimDate(selectedClaim.submittedAt)}</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t("amount", language) || "Amount"}</Typography>
                          <Typography variant="body1" fontWeight={700} color={roleConfig.color}>
                            {parseFloat(selectedClaim.amount || 0).toFixed(2)} {CURRENCY.SYMBOL}
                          </Typography>
                        </Box>
                        {selectedClaim.description && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("description", language) || "Description"}</Typography>
                            <Typography variant="body2">{sanitizeString(selectedClaim.description)}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Diagnosis Section */}
                  {(selectedClaim.diagnosis || detailsRoleData.diagnosis) && (
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#fef3c7", borderRadius: 2, border: "1px solid #fde68a" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <MedicalServicesIcon sx={{ color: "#92400e" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#92400e">
                            {t("diagnosis", language) || "Diagnosis"}
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 1.5, borderColor: "#fde68a" }} />
                        {(() => {
                          const diagnosisData = selectedClaim.diagnosis || detailsRoleData.diagnosis;
                          if (Array.isArray(diagnosisData)) {
                            return (
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {diagnosisData.map((d, idx) => (
                                  <Chip key={idx} label={d} size="small" sx={{ bgcolor: "#fef9c3", fontWeight: 600 }} />
                                ))}
                              </Stack>
                            );
                          }
                          return <Typography variant="body1">{sanitizeString(String(diagnosisData))}</Typography>;
                        })()}
                      </Paper>
                    </Grid>
                  )}

                  {/* Medicines Section - from roleSpecificData or fetched prescriptions */}
                  {(() => {
                    // Check if we have medicines in roleSpecificData (new format)
                    const embeddedMedicines = detailsRoleData.medicines || detailsRoleData.items;
                    const hasMedicines = embeddedMedicines && Array.isArray(embeddedMedicines) && embeddedMedicines.length > 0;

                    // Check if we have fetched prescriptions (old format)
                    const hasPrescriptions = claimPrescriptions && claimPrescriptions.length > 0;

                    if (!hasMedicines && !hasPrescriptions && !loadingPrescriptions) return null;

                    // Get all medicine items from prescriptions
                    const prescriptionItems = hasPrescriptions
                      ? claimPrescriptions.flatMap(p => p.items || [])
                      : [];

                    const allMedicines = hasMedicines ? embeddedMedicines : prescriptionItems;
                    const totalCount = allMedicines.length;

                    if (totalCount === 0 && !loadingPrescriptions) return null;

                    return (
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: "#ecfdf5", borderRadius: 2, border: "1px solid #a7f3d0" }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                            <LocalPharmacyIcon sx={{ color: "#047857" }} />
                            <Typography variant="subtitle1" fontWeight={700} color="#047857">
                              {t("medicines", language) || "Medicines"} {totalCount > 0 && `(${totalCount})`}
                            </Typography>
                            {loadingPrescriptions && <CircularProgress size={16} sx={{ color: "#047857" }} />}
                          </Stack>
                          <Divider sx={{ mb: 1.5, borderColor: "#a7f3d0" }} />
                          {loadingPrescriptions ? (
                            <Typography variant="body2" color="text.secondary">{t("loading", language) || "Loading..."}</Typography>
                          ) : (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#d1fae5" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("medicineName", language) || "Medicine Name"}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("form", language) || "Form"}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("quantity", language) || "Quantity"}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("dosage", language) || "Dosage"}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("duration", language) || "Duration"}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("price", language) || "Price"}</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {allMedicines.map((med, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell sx={{ fontWeight: 600 }}>{med.name || med.medicineName || med.medicine?.serviceName || "N/A"}</TableCell>
                                      <TableCell>{med.form || "-"}</TableCell>
                                      <TableCell>{med.calculatedQuantity || med.quantity || "-"}</TableCell>
                                      <TableCell>{med.dosage ? `${med.dosage} x ${med.timesPerDay || 1}/day` : "-"}</TableCell>
                                      <TableCell>{med.duration ? `${med.duration} days` : "-"}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: roleConfig.color }}>
                                        {med.price || med.medicine?.basePrice ? `${parseFloat(med.price || med.medicine?.basePrice || 0).toFixed(2)} ${CURRENCY.SYMBOL}` : "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })()}

                  {/* Lab Tests Section */}
                  {detailsRoleData.labTests && Array.isArray(detailsRoleData.labTests) && detailsRoleData.labTests.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#eff6ff", borderRadius: 2, border: "1px solid #bfdbfe" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <ScienceIcon sx={{ color: "#1d4ed8" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#1d4ed8">
                            {t("labTests", language) || "Lab Tests"} ({detailsRoleData.labTests.length})
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 1.5, borderColor: "#bfdbfe" }} />
                        <Stack spacing={1}>
                          {detailsRoleData.labTests.map((test, idx) => (
                            <Paper key={idx} elevation={0} sx={{ p: 1.5, bgcolor: "#dbeafe", borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{test.name || test.testName || test}</Typography>
                              {test.price && (
                                <Typography variant="caption" color="text.secondary">
                                  {t("price", language) || "Price"}: {parseFloat(test.price).toFixed(2)} {CURRENCY.SYMBOL}
                                </Typography>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Radiology Tests Section */}
                  {detailsRoleData.radiologyTests && Array.isArray(detailsRoleData.radiologyTests) && detailsRoleData.radiologyTests.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#fdf4ff", borderRadius: 2, border: "1px solid #e9d5ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <ImageSearchIcon sx={{ color: "#7c3aed" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#7c3aed">
                            {t("radiologyTests", language) || "Radiology Tests"} ({detailsRoleData.radiologyTests.length})
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 1.5, borderColor: "#e9d5ff" }} />
                        <Stack spacing={1}>
                          {detailsRoleData.radiologyTests.map((test, idx) => (
                            <Paper key={idx} elevation={0} sx={{ p: 1.5, bgcolor: "#f3e8ff", borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{test.name || test.testName || test}</Typography>
                              {test.price && (
                                <Typography variant="caption" color="text.secondary">
                                  {t("price", language) || "Price"}: {parseFloat(test.price).toFixed(2)} {CURRENCY.SYMBOL}
                                </Typography>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Treatment Notes */}
                  {(selectedClaim.treatmentDetails || selectedClaim.treatment || detailsRoleData.treatment || detailsRoleData.treatmentNotes) && (
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0" }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#166534" sx={{ mb: 1 }}>
                          {t("treatmentNotes", language) || "Treatment Notes"}
                        </Typography>
                        <Typography variant="body2">
                          {sanitizeString(selectedClaim.treatmentDetails || selectedClaim.treatment || detailsRoleData.treatment || detailsRoleData.treatmentNotes)}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* View Document Button */}
                  {(Array.isArray(selectedClaim.invoiceImagePath)
                    ? selectedClaim.invoiceImagePath.length > 0
                    : !!selectedClaim.invoiceImagePath) && (
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<InsertDriveFileIcon />}
                        onClick={() => {
                          handleCloseDetails();
                          handleOpenImage(selectedClaim.invoiceImagePath);
                        }}
                        sx={{
                          py: 1.5,
                          textTransform: "none",
                          fontWeight: "600",
                          borderRadius: 2,
                          backgroundColor: roleConfig.color,
                          "&:hover": {
                            backgroundColor: roleConfig.color,
                            opacity: 0.9,
                          },
                        }}
                      >
                        {t("viewDocument", language) || "View Document"}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

HealthcareProviderMyClaims.propTypes = {
  userRole: PropTypes.string,
  refreshTrigger: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default HealthcareProviderMyClaims;

