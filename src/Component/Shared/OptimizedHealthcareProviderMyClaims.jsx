/**
 * OptimizedHealthcareProviderMyClaims
 *
 * Performance-optimized version of HealthcareProviderMyClaims:
 * - React Query for data caching and automatic revalidation
 * - Virtual scrolling for large claim lists (handles 1000+ claims)
 * - Memoized components to prevent unnecessary re-renders
 * - Debounced search to reduce filtering overhead
 * - Skeleton loading for better perceived performance
 */

import React, { useState, useMemo, useCallback, memo } from "react";
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
  Skeleton,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api, getToken } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS, CURRENCY } from "../../config/api";
import { CLAIM_STATUS, getStatusColor, getStatusLabel } from "../../config/claimStateMachine";
import { ROLES, normalizeRole } from "../../config/roles";
import { formatDate, safeJsonParse } from "../../utils/helpers";
import { sanitizeString } from "../../utils/sanitize";
import { VirtualGrid } from "../../components/VirtualList";
import { queryKeys } from "../../config/queryClient";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PersonIcon from "@mui/icons-material/Person";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

// Debounce hook for search
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Role configuration - memoized outside component
const ROLE_CONFIGS = {
  [ROLES.DOCTOR]: {
    title: "Doctor Claims",
    icon: "👨‍⚕️",
    color: "#667eea",
    bgColor: "#e0e7ff",
  },
  [ROLES.PHARMACIST]: {
    title: "Pharmacist Claims",
    icon: "💊",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  [ROLES.LAB_TECH]: {
    title: "Lab Technician Claims",
    icon: "🧪",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  [ROLES.RADIOLOGIST]: {
    title: "Radiologist Claims",
    icon: "🔍",
    color: "#06b6d4",
    bgColor: "#cffafe",
  },
  [ROLES.INSURANCE_CLIENT]: {
    title: "Client Claims",
    icon: "👤",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
  },
};

// Memoized status icon component
const StatusIcon = memo(({ status }) => {
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
});

StatusIcon.displayName = "StatusIcon";

// Memoized claim card component for virtual rendering
const ClaimCard = memo(({ claim, roleConfig, normalizedRole, onOpenImage }) => {
  const { language } = useLanguage();
  const roleData = useMemo(() => safeJsonParse(claim.roleSpecificData, {}), [claim.roleSpecificData]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        height: "100%",
        minHeight: 380,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E8EDE0",
        overflow: "hidden",
        transition: "all 0.2s ease",
        backgroundColor: "#fff",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${roleConfig.bgColor}40`,
          borderColor: roleConfig.color,
        },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.color}dd 100%)`,
          p: 1.5,
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "3rem",
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
          <Typography variant="h6" sx={{ fontWeight: "700", fontSize: "1rem" }}>
            Claim #{claim.id}
          </Typography>
          <Chip
            icon={<StatusIcon status={claim.status} />}
            label={getStatusLabel(claim.status, true)}
            color={getStatusColor(claim.status)}
            variant="filled"
            size="small"
            sx={{ fontWeight: "700", fontSize: "0.65rem", height: 24 }}
          />
        </Stack>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Patient Information */}
        <Paper
          elevation={0}
          sx={{
            p: 1.2,
            borderRadius: 1.5,
            bgcolor: claim.familyMemberName ? "#fff7ed" : "#f0f4ff",
            border: claim.familyMemberName ? "1px solid #fed7aa" : "1px solid #e0e7ff",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {claim.familyMemberName ? (
              <FamilyRestroomIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
            ) : (
              <PersonIcon sx={{ fontSize: 16, color: roleConfig.color }} />
            )}
            <Typography variant="body2" sx={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem" }}>
              {claim.familyMemberName || claim.clientName || "Patient"}
            </Typography>
          </Stack>
        </Paper>

        {/* Description */}
        {claim.description && (
          <Paper
            elevation={0}
            sx={{
              p: 1.2,
              borderRadius: 1.5,
              bgcolor: "#FAF8F5",
              border: "1px dashed #d1d5db",
              minHeight: 50,
              maxHeight: 80,
              overflow: "hidden",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#334155",
                fontSize: "0.72rem",
                lineHeight: 1.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {sanitizeString(claim.description)}
            </Typography>
          </Paper>
        )}

        {/* Medicines count for pharmacist */}
        {normalizedRole === ROLES.PHARMACIST && roleData?.items?.length > 0 && (
          <Chip
            label={`${roleData.items.length} medicine(s)`}
            size="small"
            sx={{ alignSelf: "flex-start", bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }}
          />
        )}

        {/* Amount & Date */}
        <Grid container spacing={1} sx={{ mt: "auto" }}>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 1, borderRadius: 1.5, bgcolor: "#f0fdf4", border: "1px solid #d1fae5" }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <MonetizationOnIcon sx={{ fontSize: 14, color: "#10b981" }} />
                <Typography variant="body2" sx={{ fontWeight: "700", color: "#10b981", fontSize: "0.75rem" }}>
                  {parseFloat(claim.amount || 0).toFixed(2)} {CURRENCY.SYMBOL}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 1, borderRadius: 1.5, bgcolor: "#fef9f3", border: "1px solid #fed7aa" }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <AccessTimeIcon sx={{ fontSize: 14, color: "#f59e0b" }} />
                <Typography variant="body2" sx={{ fontWeight: "600", color: "#1e293b", fontSize: "0.75rem" }}>
                  {formatDate(claim.serviceDate, 'short')}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* View Document Button - only show when document exists */}
        {(Array.isArray(claim.invoiceImagePath) ? claim.invoiceImagePath.length > 0 : !!claim.invoiceImagePath) && (
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<InsertDriveFileIcon />}
            onClick={() => onOpenImage(claim.invoiceImagePath)}
            sx={{
              py: 1,
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
        )}
      </CardContent>
    </Card>
  );
});

ClaimCard.displayName = "ClaimCard";

// Loading skeleton
const ClaimCardSkeleton = () => (
  <Card elevation={0} sx={{ borderRadius: 3, height: 380, border: "1px solid #E8EDE0" }}>
    <Skeleton variant="rectangular" height={60} />
    <CardContent>
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={60} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width="50%" height={40} />
          <Skeleton variant="rounded" width="50%" height={40} />
        </Stack>
        <Skeleton variant="rounded" height={40} />
      </Stack>
    </CardContent>
  </Card>
);

// Stats component
const StatsBar = memo(({ claims }) => {
  const stats = useMemo(() => ({
    total: claims.length,
    pending: claims.filter(c => c.status === CLAIM_STATUS.PENDING_MEDICAL).length,
    approved: claims.filter(c => c.status === CLAIM_STATUS.APPROVED_FINAL).length,
    rejected: claims.filter(c => c.status === CLAIM_STATUS.REJECTED_FINAL).length,
  }), [claims]);

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {[
        { label: "Total", value: stats.total },
        { label: "Pending", value: stats.pending },
        { label: "Approved", value: stats.approved },
        { label: "Rejected", value: stats.rejected },
      ].map(({ label, value }) => (
        <Grid item xs={6} sm={3} key={label}>
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              p: 2,
              borderRadius: 2,
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="h4" fontWeight="700">{value}</Typography>
            <Typography variant="body2">{label}</Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
});

StatsBar.displayName = "StatsBar";

// Main component
const OptimizedHealthcareProviderMyClaims = ({ userRole = "DOCTOR", refreshTrigger = null }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [openImage, setOpenImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const normalizedRole = useMemo(() => normalizeRole(userRole), [userRole]);
  const roleConfig = useMemo(() => ROLE_CONFIGS[normalizedRole] || ROLE_CONFIGS[ROLES.DOCTOR], [normalizedRole]);

  // Fetch claims with React Query
  const { data: claims = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.claims.myClaims,
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.HEALTHCARE_CLAIMS.MY_CLAIMS);
      return res.data || [];
    },
    enabled: !!getToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Refetch on refreshTrigger change
  React.useEffect(() => {
    if (refreshTrigger !== null) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Filter and sort claims - memoized
  const filteredClaims = useMemo(() => {
    let result = claims;

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(claim => {
        const roleData = safeJsonParse(claim.roleSpecificData, {});
        return (
          claim.description?.toLowerCase().includes(searchLower) ||
          claim.clientName?.toLowerCase().includes(searchLower) ||
          JSON.stringify(roleData).toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (filterStatus !== "ALL") {
      result = result.filter(claim => claim.status === filterStatus);
    }

    // Sort by date (newest first)
    return [...result].sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
  }, [claims, debouncedSearch, filterStatus]);

  // Image handlers
  const handleOpenImage = useCallback((imagePath) => {
    if (!imagePath) return;
    let path = Array.isArray(imagePath) ? imagePath[0] : imagePath;
    if (!path) return;
    const fullUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    setSelectedImage(fullUrl);
    setOpenImage(true);
  }, []);

  const handleCloseImage = useCallback(() => {
    setOpenImage(false);
    setSelectedImage(null);
  }, []);

  // Render item for virtual grid
  const renderClaimCard = useCallback((claim) => (
    <ClaimCard
      claim={claim}
      roleConfig={roleConfig}
      normalizedRole={normalizedRole}
      onOpenImage={handleOpenImage}
    />
  ), [roleConfig, normalizedRole, handleOpenImage]);

  // Filter chip data
  const filterChips = useMemo(() => [
    { status: "ALL", label: "All", count: claims.length },
    { status: CLAIM_STATUS.PENDING_MEDICAL, label: "Pending", count: claims.filter(c => c.status === CLAIM_STATUS.PENDING_MEDICAL).length },
    { status: CLAIM_STATUS.APPROVED_FINAL, label: "Approved", count: claims.filter(c => c.status === CLAIM_STATUS.APPROVED_FINAL).length },
    { status: CLAIM_STATUS.REJECTED_FINAL, label: "Rejected", count: claims.filter(c => c.status === CLAIM_STATUS.REJECTED_FINAL).length },
  ], [claims]);

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, backgroundColor: "#FAF8F5", minHeight: "100vh" }}>
      {/* Header */}
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
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 64, height: 64, fontSize: 32 }}>
            {roleConfig.icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
              {roleConfig.title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              View and manage your submitted claims
            </Typography>
          </Box>
        </Stack>
        <StatsBar claims={claims} roleConfig={roleConfig} />
      </Paper>

      {/* Search & Filter */}
      <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0", mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" } }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {filterChips.map(({ status, label, count }) => (
                <Chip
                  key={status}
                  label={`${label} (${count})`}
                  onClick={() => setFilterStatus(status)}
                  variant={filterStatus === status ? "filled" : "outlined"}
                  color={
                    status === "ALL" ? (filterStatus === "ALL" ? "primary" : "default") :
                    status === CLAIM_STATUS.APPROVED_FINAL ? "success" :
                    status === CLAIM_STATUS.REJECTED_FINAL ? "error" : "warning"
                  }
                  sx={{ fontWeight: 600, borderRadius: 2, cursor: "pointer", fontSize: "0.75rem" }}
                />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Results Count */}
      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Showing <strong>{filteredClaims.length}</strong> claim{filteredClaims.length !== 1 ? "s" : ""}
      </Typography>

      {/* Claims Grid */}
      {isLoading ? (
        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {[...Array(6)].map((_, i) => <ClaimCardSkeleton key={i} />)}
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 4 }}>
          Failed to load claims. Please try again.
        </Alert>
      ) : filteredClaims.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 4, fontSize: "1rem" }}>
          {claims.length === 0 ? "No claims submitted yet." : "No claims match your search."}
        </Alert>
      ) : filteredClaims.length > 50 ? (
        // Use virtual scrolling for large lists
        <VirtualGrid
          items={filteredClaims}
          renderItem={renderClaimCard}
          itemHeight={400}
          columns={3}
          height={800}
          gap={24}
          emptyMessage="No claims to display"
        />
      ) : (
        // Regular grid for smaller lists
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {filteredClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              roleConfig={roleConfig}
              normalizedRole={normalizedRole}
              onOpenImage={handleOpenImage}
            />
          ))}
        </Box>
      )}

      {/* Image Viewer Dialog */}
      <Dialog
        open={openImage}
        onClose={handleCloseImage}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="700">Document Viewer</Typography>
          <IconButton onClick={handleCloseImage} sx={{ color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center", py: 2 }}>
              <img
                src={selectedImage}
                alt="Document"
                style={{ maxWidth: "100%", maxHeight: "600px", borderRadius: "8px" }}
                onError={(e) => { e.target.src = ""; }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default memo(OptimizedHealthcareProviderMyClaims);
