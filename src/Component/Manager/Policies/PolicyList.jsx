import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EventIcon from "@mui/icons-material/Event";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import GavelIcon from "@mui/icons-material/Gavel";
import ListAltIcon from "@mui/icons-material/ListAlt";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

import Header from "../Header";
import Sidebar from "../Sidebar";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS } from "../../../config/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const PolicyList = () => {
  const { language, isRTL } = useLanguage();
  const [policies, setPolicies] = useState([]);
  const [openPolicyDialog, setOpenPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // COVERAGE
  const [openCoverageDialog, setOpenCoverageDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [coverages, setCoverages] = useState([]);
  const [editingCoverage, setEditingCoverage] = useState(null);

  // BULK OPERATIONS
  const [selectedPolicies, setSelectedPolicies] = useState([]);

  // PROVIDER ASSIGNMENT
  const [openProviderDialog, setOpenProviderDialog] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [providerRoleFilter, setProviderRoleFilter] = useState("");
  const [assigningPolicy, setAssigningPolicy] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [errors, setErrors] = useState({});

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.POLICIES.ALL);
      setPolicies(res || []);
    } catch (err) {
      console.error("❌ Failed to fetch policies:", err);
    }
  };

  // ==========================
  // BULK OPERATIONS
  // ==========================
  const handleSelectPolicy = (policyId) => {
    setSelectedPolicies((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPolicies.length === policies.length) {
      setSelectedPolicies([]);
    } else {
      setSelectedPolicies(policies.map((p) => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPolicies.length === 0) return;

    const confirmMsg = language === "ar"
      ? `هل أنت متأكد من حذف ${selectedPolicies.length} بوليصة؟`
      : `Are you sure you want to delete ${selectedPolicies.length} policies?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post(API_ENDPOINTS.POLICIES.BULK_DELETE, {
        policyIds: selectedPolicies,
      });

      if (res.success) {
        setPolicies((prev) =>
          prev.filter((p) => !selectedPolicies.includes(p.id))
        );
        setSelectedPolicies([]);
        setSnackbar({
          open: true,
          message: res.message || (language === "ar" ? "تم الحذف بنجاح" : "Deleted successfully"),
          severity: "success",
        });

        if (res.errors && res.errors.length > 0) {
          console.warn("Some policies failed to delete:", res.errors);
        }
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || (language === "ar" ? "فشل الحذف" : "Delete failed");
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  // ==========================
  // PROVIDER ASSIGNMENT
  // ==========================
  const fetchProviders = async (role = "") => {
    setLoadingProviders(true);
    try {
      const url = role
        ? `${API_ENDPOINTS.CLIENTS.HEALTHCARE_PROVIDERS}?role=${role}`
        : API_ENDPOINTS.CLIENTS.HEALTHCARE_PROVIDERS;
      const res = await api.get(url);
      setProviders(res || []);
    } catch (err) {
      console.error("❌ Failed to fetch providers:", err);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleOpenProviderDialog = (policy) => {
    setAssigningPolicy(policy);
    setSelectedProviders([]);
    setProviderRoleFilter("");
    fetchProviders();
    setOpenProviderDialog(true);
  };

  const handleCloseProviderDialog = () => {
    setOpenProviderDialog(false);
    setAssigningPolicy(null);
    setSelectedProviders([]);
    setProviders([]);
  };

  const handleProviderRoleFilterChange = (role) => {
    setProviderRoleFilter(role);
    fetchProviders(role);
  };

  const handleSelectProvider = (providerId) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleSelectAllProviders = () => {
    if (selectedProviders.length === providers.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(providers.map((p) => p.id));
    }
  };

  const handleBulkAssignPolicy = async () => {
    if (selectedProviders.length === 0 || !assigningPolicy) return;

    try {
      const res = await api.post(API_ENDPOINTS.CLIENTS.BULK_ASSIGN_POLICY, {
        providerIds: selectedProviders,
        policyId: assigningPolicy.id,
      });

      if (res.success) {
        setSnackbar({
          open: true,
          message: res.message || (language === "ar" ? "تم التعيين بنجاح" : "Assignment successful"),
          severity: "success",
        });
        handleCloseProviderDialog();
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || (language === "ar" ? "فشل التعيين" : "Assignment failed");
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const handleRemoveProviderPolicy = async () => {
    if (selectedProviders.length === 0) return;

    try {
      const res = await api.post(API_ENDPOINTS.CLIENTS.BULK_ASSIGN_POLICY, {
        providerIds: selectedProviders,
        policyId: null, // Remove policy
      });

      if (res.success) {
        setSnackbar({
          open: true,
          message: language === "ar" ? "تم إزالة البوليصة بنجاح" : "Policy removed successfully",
          severity: "success",
        });
        fetchProviders(providerRoleFilter);
        setSelectedProviders([]);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || (language === "ar" ? "فشل الإزالة" : "Removal failed");
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  // ==========================
  // OPEN POLICY DIALOG
  // ==========================
  const handleOpenPolicyDialog = (policy = null) => {
    setEditingPolicy(
      policy || {
        policyNo: "",
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        coverageLimit: "",
        deductible: "",
        emergencyRules: "",
        status: "ACTIVE",
      }
    );
    setOpenPolicyDialog(true);
  };

  const handleClosePolicyDialog = () => {
    setEditingPolicy(null);
    setOpenPolicyDialog(false);
  };

  // ==========================
  // VALIDATE POLICY
  // ==========================
  const validatePolicy = () => {
    const newErrors = {};

    if (!editingPolicy.policyNo) newErrors.policyNo = "Required";
    if (!editingPolicy.name) newErrors.name = "Required";
    if (!editingPolicy.startDate) newErrors.startDate = "Required";
    if (!editingPolicy.endDate) newErrors.endDate = "Required";
    if (editingPolicy.coverageLimit < 0)
      newErrors.coverageLimit = "Must be positive";
    if (editingPolicy.deductible < 0)
      newErrors.deductible = "Must be positive";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================
  // SAVE POLICY
  // ==========================
  const handleSavePolicy = async () => {
    if (!validatePolicy()) return;

    try {
      const isEdit = Boolean(editingPolicy.id);

      let res;
      if (isEdit) {
        res = await api.patch(API_ENDPOINTS.POLICIES.UPDATE(editingPolicy.id), editingPolicy);
      } else {
        res = await api.post(API_ENDPOINTS.POLICIES.CREATE, editingPolicy);
      }

      // api methods return response.data directly
      if (isEdit) {
        setPolicies((prev) =>
          prev.map((p) => (p.id === editingPolicy.id ? res : p))
        );
      } else {
        setPolicies((prev) => [...prev, res]);
      }

      setSnackbar({
        open: true,
        message: isEdit ? t("policyUpdated", language) : t("policyCreated", language),
        severity: "success",
      });

      handleClosePolicyDialog();
    } catch {
      setSnackbar({
        open: true,
        message: t("failedSavePolicy", language),
        severity: "error",
      });
    }
  };

  // ==========================
  // DELETE POLICY
  // ==========================
  const handleDeletePolicy = async (id) => {
    if (!window.confirm(t("deleteThisPolicy", language))) return;

    try {
      await api.delete(API_ENDPOINTS.POLICIES.DELETE(id));

      setPolicies((prev) => prev.filter((p) => p.id !== id));

      setSnackbar({
        open: true,
        message: t("policyDeleted", language),
        severity: "info",
      });
    } catch (err) {
      // Try to get error message from server response
      const errorMessage = err?.response?.data?.error || t("deleteFailed", language);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  // ==========================
  // COVERAGE DIALOG
  // ==========================
  const handleOpenCoverageDialog = async (policy) => {
    setSelectedPolicy(policy);

    try {
      // api.get returns response.data directly
      const coveragesData = await api.get(API_ENDPOINTS.POLICIES.COVERAGES(policy.id));
      setCoverages(coveragesData || []);
    } catch {
      setCoverages([]);
    }

    setOpenCoverageDialog(true);
  };

  const handleCloseCoverageDialog = () => {
    setEditingCoverage(null);
    setSelectedPolicy(null);
    setOpenCoverageDialog(false);
  };

  const validateCoverage = () => {
    const newErrors = {};

    if (!editingCoverage.serviceName)
      newErrors.serviceName = "Service name required";

    if (editingCoverage.amount < 0) newErrors.amount = "Must be positive";

    if (
      editingCoverage.coveragePercent < 0 ||
      editingCoverage.coveragePercent > 100
    )
      newErrors.coveragePercent = "0 - 100";

    if (editingCoverage.maxLimit < 0)
      newErrors.maxLimit = "Must be positive";

    if (editingCoverage.minimumDeductible < 0)
      newErrors.minimumDeductible = "Must be positive";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCoverage = async () => {
    if (!validateCoverage()) return;

    try {
      const isEdit = Boolean(editingCoverage.id);

      let res;
      if (isEdit) {
        res = await api.patch(API_ENDPOINTS.COVERAGES.UPDATE(editingCoverage.id), editingCoverage);
      } else {
        res = await api.post(API_ENDPOINTS.POLICIES.ADD_COVERAGE(selectedPolicy.id), editingCoverage);
      }

      // api methods return response.data directly
      if (isEdit) {
        setCoverages((prev) =>
          prev.map((c) => (c.id === editingCoverage.id ? res : c))
        );
      } else {
        setCoverages((prev) => [...prev, res]);
      }

      setEditingCoverage(null);

      setSnackbar({
        open: true,
        message: isEdit ? t("coverageUpdated", language) : t("coverageAdded", language),
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: t("failedSaveCoverage", language),
        severity: "error",
      });
    }
  };

  const handleDeleteCoverage = async (id) => {
    if (!window.confirm(t("deleteCoverage", language))) return;

    try {
      await api.delete(API_ENDPOINTS.COVERAGES.DELETE(id));

      setCoverages((prev) => prev.filter((c) => c.id !== id));

      setSnackbar({
        open: true,
        message: t("coverageDeleted", language),
        severity: "info",
      });
    } catch {
      setSnackbar({
        open: true,
        message: t("deleteFailed", language),
        severity: "error",
      });
    }
  };

  // ==========================
  // EXPORT FUNCTIONS
  // ==========================
  const handleExportExcel = async () => {
    try {
      const blob = await api.download("/api/export/policies/excel");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "policies_and_coverages.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: language === "ar" ? "تم تصدير الملف بنجاح" : "Export successful",
        severity: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: language === "ar" ? "فشل التصدير" : "Export failed",
        severity: "error",
      });
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await api.download("/api/export/policies/pdf");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "policies_and_coverages.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: language === "ar" ? "تم تصدير الملف بنجاح" : "Export successful",
        severity: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: language === "ar" ? "فشل التصدير" : "Export failed",
        severity: "error",
      });
    }
  };

  // ==========================
  // UI
  // ==========================
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />

      <Box
        dir={isRTL ? "rtl" : "ltr"}
        sx={{
          flexGrow: 1,
          backgroundColor: "#f4f6f9",
          minHeight: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          transition: "margin 0.3s ease",
        }}
      >
        <Header />

        <Box sx={{ p: 3 }} dir={isRTL ? "rtl" : "ltr"}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: "#120460" }}
            >
              {t("policiesManagement", language)}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 2 }}
                onClick={handleExportExcel}
              >
                {language === "ar" ? "تصدير Excel" : "Export Excel"}
              </Button>

              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                sx={{ borderRadius: 2 }}
                onClick={handleExportPdf}
              >
                {language === "ar" ? "تصدير PDF" : "Export PDF"}
              </Button>

              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                sx={{ borderRadius: 2 }}
                onClick={() => handleOpenPolicyDialog()}
              >
                {t("createPolicy", language)}
              </Button>
            </Box>
          </Box>

          {/* Bulk Operations Bar */}
          {policies.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedPolicies.length === policies.length && policies.length > 0}
                    indeterminate={selectedPolicies.length > 0 && selectedPolicies.length < policies.length}
                    onChange={handleSelectAll}
                  />
                }
                label={language === "ar" ? "تحديد الكل" : "Select All"}
              />

              {selectedPolicies.length > 0 && (
                <>
                  <Chip
                    label={`${selectedPolicies.length} ${language === "ar" ? "محدد" : "selected"}`}
                    color="primary"
                  />

                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDelete}
                  >
                    {language === "ar" ? "حذف المحدد" : "Delete Selected"}
                  </Button>
                </>
              )}
            </Paper>
          )}

          {policies.map((policy) => (
            <Paper
              key={policy.id}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                boxShadow: selectedPolicies.includes(policy.id) ? "0 0 0 2px #1976d2" : 4,
                backgroundColor: selectedPolicies.includes(policy.id) ? "#e3f2fd" : "#fff",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Checkbox
                  checked={selectedPolicies.includes(policy.id)}
                  onChange={() => handleSelectPolicy(policy.id)}
                />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AssignmentIndIcon />}
                    onClick={() => handleOpenProviderDialog(policy)}
                    color="secondary"
                  >
                    {language === "ar" ? "تعيين مقدمي الخدمة" : "Assign Providers"}
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ListAltIcon />}
                    onClick={() => handleOpenCoverageDialog(policy)}
                  >
                    {t("manageCoverages", language)}
                  </Button>

                  <IconButton
                    color="primary"
                    onClick={() => handleOpenPolicyDialog(policy)}
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    color="error"
                    onClick={() => handleDeletePolicy(policy.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography
                    sx={{ fontWeight: "bold", color: "#1E8EAB", mb: 1 }}
                  >
                    {t("generalInformation", language)}
                  </Typography>
                  <Typography>
                    <b>{t("policyNo", language)}:</b> {policy.policyNo}
                  </Typography>
                  <Typography>
                    <b>{t("name", language)}:</b> {policy.name}
                  </Typography>
                  <Typography>
                    <b>{t("description", language)}:</b> {policy.description}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    sx={{ fontWeight: "bold", color: "#1E8EAB", mb: 1 }}
                  >
                    {t("datesAndStatus", language)}
                  </Typography>

                  <Typography>
                    <EventIcon sx={{ fontSize: 18, mr: 1 }} />
                    <b>{t("start", language)}:</b> {policy.startDate}
                  </Typography>

                  <Typography>
                    <EventIcon sx={{ fontSize: 18, mr: 1 }} />
                    <b>{t("end", language)}:</b> {policy.endDate}
                  </Typography>

                  <Chip
                    label={policy.status}
                    color={
                      policy.status === "ACTIVE" ? "success" : "default"
                    }
                    sx={{ mt: 1 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    sx={{ fontWeight: "bold", color: "#1E8EAB", mb: 1 }}
                  >
                    {t("financialCoverage", language)}
                  </Typography>

                  <Typography>
                    <MonetizationOnIcon
                      sx={{ fontSize: 18, mr: 1, color: "green" }}
                    />
                    <b>{t("limit", language)}:</b> ${policy.coverageLimit}
                  </Typography>

                  <Typography>
                    <MonetizationOnIcon
                      sx={{ fontSize: 18, mr: 1, color: "red" }}
                    />
                    <b>{t("deductible", language)}:</b> ${policy.deductible}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    sx={{ fontWeight: "bold", color: "#1E8EAB", mb: 1 }}
                  >
                    {t("emergencyRules", language)}
                  </Typography>
                  <Typography>
                    <GavelIcon
                      sx={{ fontSize: 18, mr: 1, color: "orange" }}
                    />
                    {policy.emergencyRules}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* =======================================
          POLICY DIALOG
      ======================================= */}
      <Dialog open={openPolicyDialog} onClose={handleClosePolicyDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "20px" }}>
          {editingPolicy?.id ? t("editPolicyTitle", language) : t("createNewPolicy", language)}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t("policyNumber", language)}
                value={editingPolicy?.policyNo || ""}
                error={!!errors.policyNo}
                helperText={errors.policyNo}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, policyNo: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t("policyName", language)}
                value={editingPolicy?.name || ""}
                error={!!errors.name}
                helperText={errors.name}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, name: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("description", language)}
                multiline
                rows={3}
                value={editingPolicy?.description || ""}
                onChange={(e) =>
                  setEditingPolicy({
                    ...editingPolicy,
                    description: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                type="date"
                fullWidth
                label={t("startDate", language)}
                InputLabelProps={{ shrink: true }}
                value={editingPolicy?.startDate || ""}
                error={!!errors.startDate}
                helperText={errors.startDate}
                onChange={(e) =>
                  setEditingPolicy({
                    ...editingPolicy,
                    startDate: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                type="date"
                fullWidth
                label={t("endDate", language)}
                InputLabelProps={{ shrink: true }}
                value={editingPolicy?.endDate || ""}
                error={!!errors.endDate}
                helperText={errors.endDate}
                onChange={(e) =>
                  setEditingPolicy({
                    ...editingPolicy,
                    endDate: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t("coverageLimit", language)}
                type="number"
                value={editingPolicy?.coverageLimit || ""}
                error={!!errors.coverageLimit}
                helperText={errors.coverageLimit}
                onChange={(e) =>
                  setEditingPolicy({
                    ...editingPolicy,
                    coverageLimit: Number(e.target.value),
                  })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t("deductible", language)}
                type="number"
                value={editingPolicy?.deductible || ""}
                error={!!errors.deductible}
                helperText={errors.deductible}
                onChange={(e) =>
                  setEditingPolicy({
                    ...editingPolicy,
                    deductible: Number(e.target.value),
                  })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("emergencyRules", language)}
                multiline
                rows={2}
                value={editingPolicy?.emergencyRules || ""}
                onChange={(e) =>
                  setEditingPolicy({
                    ...editingPolicy,
                    emergencyRules: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t("status", language)}</InputLabel>
                <Select
                  value={editingPolicy?.status || "ACTIVE"}
                  label={t("status", language)}
                  onChange={(e) =>
                    setEditingPolicy({
                      ...editingPolicy,
                      status: e.target.value,
                    })
                  }
                >
                  <MenuItem value="ACTIVE">{t("active", language)}</MenuItem>
                  <MenuItem value="INACTIVE">{t("inactive", language)}</MenuItem>
                  <MenuItem value="EXPIRED">{t("expired", language)}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePolicyDialog}>{t("cancel", language)}</Button>
          <Button variant="contained" onClick={handleSavePolicy}>
            {t("save", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================
          COVERAGE DIALOG
      ======================================= */}

      <Dialog open={openCoverageDialog} onClose={handleCloseCoverageDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "20px" }}>
          {t("coverageManagement", language)} — {selectedPolicy?.name}
        </DialogTitle>

        <DialogContent dividers>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            sx={{ mb: 2 }}
            onClick={() =>
  setEditingCoverage({
    serviceName: "",
    description: "",
    amount: 0,
    emergencyEligible: false,
    covered: true,
    coveragePercent: 100,
    maxLimit: 0,
    coverageType: "OUTPATIENT",
    minimumDeductible: 0,
    requiresReferral: false,
  })
}

          >
            {t("addCoverage", language)}
          </Button>

          {coverages.map((cov) => (
            <Paper key={cov.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">{cov.serviceName}</Typography>

                <Box>
                  <IconButton color="primary" onClick={() => setEditingCoverage(cov)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteCoverage(cov.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Typography sx={{ mt: 1 }}>
                <b>{t("description", language)}:</b> {cov.description}
              </Typography>

              <Typography sx={{ mt: 1 }}>
                <b>{t("amount", language)}:</b> ${cov.amount}
              </Typography>

              <Typography sx={{ mt: 1 }}>
                <b>{t("coverage", language)}:</b> {cov.coveragePercent}% — {t("max", language)}: {cov.maxLimit}
              </Typography>
              <Typography sx={{ mt: 1 }}>
  <b>{t("coverageType", language)}:</b> {cov.coverageType}
</Typography>

<Typography sx={{ mt: 1 }}>
  <b>{t("minimumDeductible", language)}:</b> {cov.minimumDeductible}
</Typography>

<Chip
  label={cov.requiresReferral ? t("requiresReferral", language) : t("noReferral", language)}
  color={cov.requiresReferral ? "warning" : "info"}
  sx={{ mt: 1 }}
/>


              <Chip
                label={cov.emergencyEligible ? t("emergencyEligible", language) : t("regular", language)}
                color={cov.emergencyEligible ? "error" : "info"}
                sx={{ mt: 1 }}
              />

              <Chip
                label={cov.covered ? t("covered", language) : t("notCovered", language)}
                color={cov.covered ? "success" : "warning"}
                sx={{ mt: 1, ml: 1 }}
              />
            </Paper>
          ))}

          {editingCoverage && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight="bold">
                {editingCoverage.id ? t("editCoverage", language) : t("addCoverage", language)}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={t("serviceName", language)}
                    value={editingCoverage.serviceName}
                    error={!!errors.serviceName}
                    helperText={errors.serviceName}
                    onChange={(e) =>
                      setEditingCoverage({
                        ...editingCoverage,
                        serviceName: e.target.value,
                      })
                    }
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={t("amount", language)}
                    type="number"
                    value={editingCoverage.amount}
                    error={!!errors.amount}
                    helperText={errors.amount}
                    onChange={(e) =>
                      setEditingCoverage({
                        ...editingCoverage,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={t("coveragePercentLabel", language)}
                    type="number"
                    value={editingCoverage.coveragePercent}
                    error={!!errors.coveragePercent}
                    helperText={errors.coveragePercent}
                    onChange={(e) =>
                      setEditingCoverage({
                        ...editingCoverage,
                        coveragePercent: Number(e.target.value),
                      })
                    }
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={t("maxLimit", language)}
                    type="number"
                    value={editingCoverage.maxLimit}
                    error={!!errors.maxLimit}
                    helperText={errors.maxLimit}
                    onChange={(e) =>
                      setEditingCoverage({
                        ...editingCoverage,
                        maxLimit: Number(e.target.value),
                      })
                    }
                  />
                </Grid>
                <Grid item xs={6}>
  <FormControl fullWidth>
    <InputLabel>{t("coverageType", language)}</InputLabel>
    <Select
      value={editingCoverage.coverageType || "OUTPATIENT"}
      label={t("coverageType", language)}
      onChange={(e) =>
        setEditingCoverage({
          ...editingCoverage,
          coverageType: e.target.value,
        })
      }
    >
      <MenuItem value="OUTPATIENT">OUTPATIENT</MenuItem>
      <MenuItem value="INPATIENT">INPATIENT</MenuItem>
      <MenuItem value="DENTAL">DENTAL</MenuItem>
      <MenuItem value="OPTICAL">OPTICAL</MenuItem>
      <MenuItem value="EMERGENCY">EMERGENCY</MenuItem>
      <MenuItem value="LAB">LAB</MenuItem>
      <MenuItem value="XRAY">XRAY</MenuItem>
    </Select>
  </FormControl>
</Grid>

<Grid item xs={6}>
 <TextField
  fullWidth
  label={t("minimumDeductible", language)}
  type="number"
  value={editingCoverage.minimumDeductible || 0}
  error={!!errors.minimumDeductible}
  helperText={errors.minimumDeductible}
  onChange={(e) =>
    setEditingCoverage({
      ...editingCoverage,
      minimumDeductible: Number(e.target.value),
    })
  }
/>

</Grid>

<Grid item xs={12}>
  <FormControlLabel
    control={
      <Switch
        checked={editingCoverage.requiresReferral || false}
        onChange={(e) =>
          setEditingCoverage({
            ...editingCoverage,
            requiresReferral: e.target.checked,
          })
        }
      />
    }
    label={t("requiresReferral", language)}
  />
</Grid>


                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t("description", language)}
                    multiline
                    rows={3}
                    value={editingCoverage.description}
                    onChange={(e) =>
                      setEditingCoverage({
                        ...editingCoverage,
                        description: e.target.value,
                      })
                    }
                  />
                </Grid>

                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingCoverage.emergencyEligible}
                        onChange={(e) =>
                          setEditingCoverage({
                            ...editingCoverage,
                            emergencyEligible: e.target.checked,
                          })
                        }
                      />
                    }
                    label={t("emergencyEligible", language)}
                  />
                </Grid>

                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingCoverage.covered}
                        onChange={(e) =>
                          setEditingCoverage({
                            ...editingCoverage,
                            covered: e.target.checked,
                          })
                        }
                      />
                    }
                    label={t("covered", language)}
                  />
                </Grid>
              </Grid>

              <Button variant="contained" sx={{ mt: 2 }} onClick={handleSaveCoverage}>
                {t("saveCoverage", language)}
              </Button>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCoverageDialog}>{t("close", language)}</Button>
        </DialogActions>
      </Dialog>

      {/* =======================================
          PROVIDER ASSIGNMENT DIALOG
      ======================================= */}
      <Dialog
        open={openProviderDialog}
        onClose={handleCloseProviderDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "20px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIndIcon color="primary" />
            {language === "ar"
              ? `تعيين مقدمي الخدمة للبوليصة: ${assigningPolicy?.name || ""}`
              : `Assign Providers to Policy: ${assigningPolicy?.name || ""}`}
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Role Filter Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={providerRoleFilter}
              onChange={(e, val) => handleProviderRoleFilterChange(val)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                value=""
                label={language === "ar" ? "الكل" : "All"}
              />
              <Tab
                value="DOCTOR"
                label={language === "ar" ? "الأطباء" : "Doctors"}
              />
              <Tab
                value="PHARMACIST"
                label={language === "ar" ? "الصيادلة" : "Pharmacists"}
              />
              <Tab
                value="LAB_TECH"
                label={language === "ar" ? "فنيو المختبر" : "Lab Techs"}
              />
              <Tab
                value="RADIOLOGIST"
                label={language === "ar" ? "فنيو الأشعة" : "Radiologists"}
              />
            </Tabs>
          </Box>

          {/* Bulk Actions */}
          {providers.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedProviders.length === providers.length && providers.length > 0}
                    indeterminate={selectedProviders.length > 0 && selectedProviders.length < providers.length}
                    onChange={handleSelectAllProviders}
                  />
                }
                label={language === "ar" ? "تحديد الكل" : "Select All"}
              />

              {selectedProviders.length > 0 && (
                <>
                  <Chip
                    label={`${selectedProviders.length} ${language === "ar" ? "محدد" : "selected"}`}
                    color="primary"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    onClick={handleRemoveProviderPolicy}
                  >
                    {language === "ar" ? "إزالة البوليصة" : "Remove Policy"}
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* Providers Table */}
          {loadingProviders ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : providers.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", p: 4 }}>
              {language === "ar" ? "لا يوجد مقدمي خدمة" : "No providers found"}
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProviders.length === providers.length}
                        indeterminate={selectedProviders.length > 0 && selectedProviders.length < providers.length}
                        onChange={handleSelectAllProviders}
                      />
                    </TableCell>
                    <TableCell>{language === "ar" ? "الاسم" : "Name"}</TableCell>
                    <TableCell>{language === "ar" ? "البريد الإلكتروني" : "Email"}</TableCell>
                    <TableCell>{language === "ar" ? "الدور" : "Role"}</TableCell>
                    <TableCell>{language === "ar" ? "التخصص/الموقع" : "Specialization/Location"}</TableCell>
                    <TableCell>{language === "ar" ? "البوليصة الحالية" : "Current Policy"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow
                      key={provider.id}
                      hover
                      selected={selectedProviders.includes(provider.id)}
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleSelectProvider(provider.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedProviders.includes(provider.id)} />
                      </TableCell>
                      <TableCell>{provider.fullName}</TableCell>
                      <TableCell>{provider.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={provider.roles?.[0] || provider.requestedRole || "-"}
                          size="small"
                          color={
                            provider.roles?.includes("DOCTOR")
                              ? "primary"
                              : provider.roles?.includes("PHARMACIST")
                              ? "secondary"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {provider.specialization ||
                          provider.pharmacyName ||
                          provider.labName ||
                          provider.radiologyName ||
                          "-"}
                      </TableCell>
                      <TableCell>
                        {provider.policyName ? (
                          <Chip label={provider.policyName} size="small" color="success" />
                        ) : (
                          <Chip
                            label={language === "ar" ? "غير معين" : "Not Assigned"}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseProviderDialog}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkAssignPolicy}
            disabled={selectedProviders.length === 0}
            startIcon={<AssignmentIndIcon />}
          >
            {language === "ar"
              ? `تعيين ${selectedProviders.length} مقدم خدمة`
              : `Assign ${selectedProviders.length} Provider(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PolicyList;
