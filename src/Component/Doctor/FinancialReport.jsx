import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PaidIcon from "@mui/icons-material/Paid";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import api from "../../utils/apiService";
import { getToken } from "../../utils/apiService";
import { CURRENCY, CLAIM_STATUS } from "../../config/api";
import logger from "../../utils/logger";

const FinancialReport = () => {
  const { language, isRTL } = useLanguage();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [cardsPerPage] = useState(10);

  // Details dialog state
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Safe JSON parse helper
  const safeJsonParse = (str, fallback = {}) => {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  // Fetch paid claims
  const fetchPaidClaims = useCallback(async () => {
    const authToken = getToken();
    if (!authToken) {
      logger.error("No token found");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/api/healthcare-provider-claims/my-claims");
      // Filter only PAID claims
      const paidClaims = (res || []).filter(
        (c) => c.status === CLAIM_STATUS.PAID
      );
      setClaims(paidClaims);
    } catch (err) {
      logger.error("Error fetching claims:", err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    const currentToken = getToken();
    if (currentToken) {
      fetchPaidClaims();
    }
  }, [fetchPaidClaims]);

  // Handle search button click (refresh data)
  const handleSearch = useCallback(() => {
    fetchPaidClaims();
  }, [fetchPaidClaims]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || dateFrom !== "" || dateTo !== "";
  }, [searchTerm, dateFrom, dateTo]);

  // Filter claims based on search and date range
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Search filter
      const matchSearch =
        !searchTerm ||
        claim.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.familyMemberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Date range filter
      let matchDate = true;
      if (dateFrom || dateTo) {
        const claimDate = new Date(claim.paidAt || claim.serviceDate);
        if (dateFrom) {
          matchDate = matchDate && claimDate >= new Date(dateFrom);
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchDate = matchDate && claimDate <= toDate;
        }
      }

      return matchSearch && matchDate;
    });
  }, [claims, searchTerm, dateFrom, dateTo]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return filteredClaims.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  }, [filteredClaims]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Handle view details
  const handleOpenDetails = useCallback((claim) => {
    setSelectedClaim(claim);
    setOpenDetails(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setOpenDetails(false);
    setSelectedClaim(null);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
          borderRadius: 4,
          color: "white",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <AssessmentIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h5" fontWeight="700">
              {t("financialReport", language) || "Financial Report"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t("viewPaidClaimsDescription", language) || "View all your paid claims and earnings"}
            </Typography>
          </Box>
        </Stack>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={4}>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="h4" fontWeight="700">
                {filteredClaims.length}
              </Typography>
              <Typography variant="body2">{t("paidClaims", language) || "Paid Claims"}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="h4" fontWeight="700">
                {totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2">{t("totalEarnings", language) || "Total Earnings"} ({CURRENCY.SYMBOL})</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter Section */}
      <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0", mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Top Row: Search, View Toggle, Filter Toggle */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              {/* Search Bar */}
              <TextField
                placeholder={t("searchPlaceholder", language) || "Search by patient name, diagnosis..."}
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
                <ToggleButton value="table" sx={{ px: 2 }}>
                  <Tooltip title={t("tableView", language) || "Table View"}>
                    <ViewListIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="cards" sx={{ px: 2 }}>
                  <Tooltip title={t("cardView", language) || "Card View"}>
                    <ViewModuleIcon />
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
                  bgcolor: showFilters ? "#2E7D32" : "transparent",
                  borderColor: "#2E7D32",
                  color: showFilters ? "white" : "#2E7D32",
                  "&:hover": {
                    bgcolor: showFilters ? "#1B5E20" : "rgba(46, 125, 50, 0.1)",
                    borderColor: "#2E7D32",
                  },
                }}
              >
                {t("filters", language) || "Filters"}
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
                        bgcolor: "#2E7D32",
                        "&:hover": {
                          bgcolor: "#1B5E20",
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
                      onClick={clearFilters}
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
          </Stack>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#2E7D32" }} />
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
          {t("noPaidClaims", language) || "No paid claims found for the selected criteria."}
        </Alert>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <>
          <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
            {t("showingClaims", language) || "Showing"} <strong>{filteredClaims.length}</strong> {t("paidClaims", language) || "paid claims"}
          </Typography>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E8EDE0", overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#2E7D32" }}>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("patient", language) || "Patient"}</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("diagnosis", language) || "Diagnosis"}</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("amount", language) || "Amount"}</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("serviceDate", language) || "Service Date"}</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>{t("paidDate", language) || "Paid Date"}</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700, textAlign: "center" }}>{t("actions", language) || "Actions"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClaims
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((claim, index) => (
                      <TableRow
                        key={claim.id}
                        sx={{
                          "&:nth-of-type(odd)": { bgcolor: "#f8faf8" },
                          "&:hover": { bgcolor: "#e8f5e9" },
                        }}
                      >
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {claim.familyMemberName || claim.clientName || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {claim.diagnosis || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700} color="#2E7D32">
                            {parseFloat(claim.amount || 0).toFixed(2)} {CURRENCY.SYMBOL}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(claim.serviceDate)}</TableCell>
                        <TableCell>{formatDate(claim.paidAt)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title={t("viewDetails", language) || "View Details"}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetails(claim)}
                              sx={{ color: "#2E7D32" }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredClaims.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage={t("rowsPerPage", language) || "Rows per page:"}
            />
          </Paper>
        </>
      ) : (
        /* CARD VIEW */
        <>
          <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
            {t("showingClaims", language) || "Showing"} <strong>{filteredClaims.length}</strong> {t("paidClaims", language) || "paid claims"}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 3 }}>
            {filteredClaims
              .slice(page * cardsPerPage, page * cardsPerPage + cardsPerPage)
              .map((claim) => (
                <Card
                  key={claim.id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #E8EDE0",
                    "&:hover": {
                      boxShadow: "0 4px 20px rgba(46, 125, 50, 0.15)",
                      borderColor: "#2E7D32",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {claim.familyMemberName || claim.clientName || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(claim.serviceDate)}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<PaidIcon sx={{ fontSize: 16 }} />}
                        label={t("paid", language) || "Paid"}
                        size="small"
                        sx={{
                          bgcolor: "#e8f5e9",
                          color: "#2E7D32",
                          fontWeight: 600,
                        }}
                      />
                    </Stack>

                    {/* Diagnosis */}
                    {claim.diagnosis && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {claim.diagnosis}
                      </Typography>
                    )}

                    {/* Amount */}
                    <Box sx={{ bgcolor: "#f0fdf4", p: 2, borderRadius: 2, mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("amount", language) || "Amount"}
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="#2E7D32">
                        {parseFloat(claim.amount || 0).toFixed(2)} {CURRENCY.SYMBOL}
                      </Typography>
                    </Box>

                    {/* Paid Date */}
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {t("paidOn", language) || "Paid on"}: {formatDate(claim.paidAt)}
                      </Typography>
                    </Stack>

                    {/* View Details Button */}
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<InfoIcon />}
                      onClick={() => handleOpenDetails(claim)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        borderColor: "#2E7D32",
                        color: "#2E7D32",
                        "&:hover": {
                          borderColor: "#1B5E20",
                          bgcolor: "#e8f5e9",
                        },
                      }}
                    >
                      {t("viewDetails", language) || "View Details"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
                  borderColor: "#2E7D32",
                  color: "#2E7D32",
                  "&:hover": {
                    borderColor: "#2E7D32",
                    bgcolor: "rgba(46, 125, 50, 0.1)",
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
                  borderColor: "#2E7D32",
                  color: "#2E7D32",
                  "&:hover": {
                    borderColor: "#2E7D32",
                    bgcolor: "rgba(46, 125, 50, 0.1)",
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

      {/* Details Dialog */}
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
            bgcolor: "#2E7D32",
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <InfoIcon />
            <Typography variant="h6" fontWeight="700">
              {t("claimDetails", language) || "Claim Details"}
            </Typography>
          </Stack>
          <IconButton onClick={handleCloseDetails} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedClaim && (() => {
            const roleData = safeJsonParse(selectedClaim.roleSpecificData, {});

            return (
              <Box sx={{ p: 3 }}>
                {/* Status Badge */}
                <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                  <Chip
                    icon={<PaidIcon />}
                    label={t("paid", language) || "Paid"}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      py: 2.5,
                      px: 1,
                      bgcolor: "#e8f5e9",
                      color: "#2E7D32",
                    }}
                  />
                </Box>

                <Grid container spacing={3}>
                  {/* Patient Information */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0", height: "100%" }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <PersonIcon sx={{ color: "#2E7D32" }} />
                        <Typography variant="subtitle1" fontWeight={700} color="#2E7D32">
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
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Payment Summary */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0", height: "100%" }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <ReceiptIcon sx={{ color: "#2E7D32" }} />
                        <Typography variant="subtitle1" fontWeight={700} color="#2E7D32">
                          {t("paymentSummary", language) || "Payment Summary"}
                        </Typography>
                      </Stack>
                      <Divider sx={{ mb: 1.5, borderColor: "#bbf7d0" }} />
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t("amount", language) || "Amount"}</Typography>
                          <Typography variant="h5" fontWeight={700} color="#2E7D32">
                            {parseFloat(selectedClaim.amount || 0).toFixed(2)} {CURRENCY.SYMBOL}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t("serviceDate", language) || "Service Date"}</Typography>
                          <Typography variant="body1" fontWeight={600}>{formatDate(selectedClaim.serviceDate)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t("paidDate", language) || "Paid Date"}</Typography>
                          <Typography variant="body1" fontWeight={600}>{formatDate(selectedClaim.paidAt)}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Diagnosis Section */}
                  {(selectedClaim.diagnosis || roleData.diagnosis) && (
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#fef3c7", borderRadius: 2, border: "1px solid #fde68a" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <MedicalServicesIcon sx={{ color: "#92400e" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#92400e">
                            {t("diagnosis", language) || "Diagnosis"}
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 1.5, borderColor: "#fde68a" }} />
                        <Typography variant="body1">{selectedClaim.diagnosis || roleData.diagnosis}</Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Medicines Section */}
                  {roleData.medicines && roleData.medicines.length > 0 && (
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#ecfdf5", borderRadius: 2, border: "1px solid #a7f3d0" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <LocalPharmacyIcon sx={{ color: "#047857" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#047857">
                            {t("medicines", language) || "Medicines"} ({roleData.medicines.length})
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 1.5, borderColor: "#a7f3d0" }} />
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "#d1fae5" }}>
                                <TableCell sx={{ fontWeight: 700 }}>{t("medicineName", language) || "Medicine Name"}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t("price", language) || "Price"}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {roleData.medicines.map((med, idx) => (
                                <TableRow key={idx}>
                                  <TableCell sx={{ fontWeight: 600 }}>{med.name || "-"}</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: "#2E7D32" }}>
                                    {med.price ? `${parseFloat(med.price).toFixed(2)} ${CURRENCY.SYMBOL}` : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </Grid>
                  )}

                  {/* Lab Tests Section */}
                  {roleData.labTests && roleData.labTests.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#eff6ff", borderRadius: 2, border: "1px solid #bfdbfe" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <ScienceIcon sx={{ color: "#1d4ed8" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#1d4ed8">
                            {t("labTests", language) || "Lab Tests"} ({roleData.labTests.length})
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 1.5, borderColor: "#bfdbfe" }} />
                        <Stack spacing={1}>
                          {roleData.labTests.map((test, idx) => (
                            <Paper key={idx} elevation={0} sx={{ p: 1.5, bgcolor: "#dbeafe", borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{test.name || test}</Typography>
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
                  {roleData.radiologyTests && roleData.radiologyTests.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#fdf4ff", borderRadius: 2, border: "1px solid #e9d5ff" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <ImageSearchIcon sx={{ color: "#7c3aed" }} />
                          <Typography variant="subtitle1" fontWeight={700} color="#7c3aed">
                            {t("radiologyTests", language) || "Radiology Tests"} ({roleData.radiologyTests.length})
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 1.5, borderColor: "#e9d5ff" }} />
                        <Stack spacing={1}>
                          {roleData.radiologyTests.map((test, idx) => (
                            <Paper key={idx} elevation={0} sx={{ p: 1.5, bgcolor: "#f3e8ff", borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{test.name || test}</Typography>
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
                  {(selectedClaim.treatmentDetails || roleData.treatment) && (
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0" }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#166534" sx={{ mb: 1 }}>
                          {t("treatmentNotes", language) || "Treatment Notes"}
                        </Typography>
                        <Typography variant="body2">
                          {selectedClaim.treatmentDetails || roleData.treatment}
                        </Typography>
                      </Paper>
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

export default FinancialReport;
