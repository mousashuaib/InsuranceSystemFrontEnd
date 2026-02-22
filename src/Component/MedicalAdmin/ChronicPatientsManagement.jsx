// src/Component/MedicalAdmin/ChronicPatientsManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Autocomplete,
  Divider,
  InputAdornment,
  Tooltip,
  Collapse,
  Avatar,
} from "@mui/material";
import Header from "./MedicalAdminHeader";
import Sidebar from "./MedicalAdminSidebar";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import PersonIcon from "@mui/icons-material/Person";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
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
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import WcIcon from "@mui/icons-material/Wc";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CakeIcon from "@mui/icons-material/Cake";

const ChronicPatientsManagement = () => {
  const { language, isRTL } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [scheduleType, setScheduleType] = useState("PRESCRIPTION"); // PRESCRIPTION, LAB
  const [scheduleData, setScheduleData] = useState({
    medicationName: "",
    medicationQuantity: 1,
    labTestName: "",
    intervalMonths: 1,
    notes: "",
  });
  const [medications, setMedications] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [loadingLabTests, setLoadingLabTests] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [patientDetailsDialog, setPatientDetailsDialog] = useState({
    open: false,
    patient: null,
  });
  const [documentDialog, setDocumentDialog] = useState({
    open: false,
    imageUrl: null,
  });

  // Filter states for Patients tab
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [diseaseFilter, setDiseaseFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nameAsc");

  // View and pagination states for Patients tab
  const [viewMode, setViewMode] = useState("cards");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [5, 10, 25, 50, 100];

  // Filter states for Schedules tab
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState("all");
  const [schedulePage, setSchedulePage] = useState(0);
  const [scheduleRowsPerPage, setScheduleRowsPerPage] = useState(10);

  // Sort options
  const sortOptions = [
    { value: "nameAsc", label: t("nameAZ", language) || "Name (A-Z)" },
    { value: "nameDesc", label: t("nameZA", language) || "Name (Z-A)" },
    { value: "diseasesDesc", label: t("mostDiseases", language) || "Most Diseases" },
    { value: "diseasesAsc", label: t("fewestDiseases", language) || "Fewest Diseases" },
  ];


  useEffect(() => {
    fetchChronicPatients();
    fetchSchedules();
  }, []);

  // جلب الأدوية والفحوصات عند فتح Dialog أو تغيير نوع الجدول
  useEffect(() => {
    if (openDialog) {
      if (scheduleType === "PRESCRIPTION" && medications.length === 0) {
        fetchMedications();
      } else if (scheduleType === "LAB" && labTests.length === 0) {
        fetchLabTests();
      }
    }
  }, [scheduleType, openDialog]);

  const fetchMedications = async () => {
    try {
      setLoadingMedications(true);
      const res = await api.get(API_ENDPOINTS.PRICELIST.BY_TYPE("PHARMACY"));
      // api.get returns response.data directly
      const medicationNames = (res || [])
        .map(item => item.serviceName)
        .filter(Boolean)
        .sort();
      setMedications(medicationNames);
    } catch (err) {
      console.error("Error fetching medications:", err);
      setSnackbar({
        open: true,
        message: "فشل في جلب قائمة الأدوية",
        severity: "error",
      });
    } finally {
      setLoadingMedications(false);
    }
  };

  const fetchLabTests = async () => {
    try {
      setLoadingLabTests(true);
      const res = await api.get(API_ENDPOINTS.PRICELIST.BY_TYPE("LAB"));
      // api.get returns response.data directly
      const testNames = (res || [])
        .map(item => item.serviceName)
        .filter(Boolean)
        .sort();
      setLabTests(testNames);
    } catch (err) {
      console.error("Error fetching lab tests:", err);
      setSnackbar({
        open: true,
        message: "Failed to fetch lab tests list",
        severity: "error",
      });
    } finally {
      setLoadingLabTests(false);
    }
  };

  const fetchChronicPatients = async () => {
    try {
      const res = await api.get("/api/medical-admin/chronic-patients");
      // api.get returns response.data directly
      console.log("📋 Chronic patients data:", res);
      const patientsWithFullData = (res || []).map(patient => {
        console.log("🔍 Patient data:", patient);
        return {
          ...patient,
          phone: patient.phone || "",
          nationalId: patient.nationalId || "",
          department: patient.department || "",
          faculty: patient.faculty || "",
          gender: patient.gender || "",
          dateOfBirth: patient.dateOfBirth || "",
          age: patient.age || null,
          chronicDocumentPaths: patient.chronicDocumentPaths || [],
        };
      });
      setPatients(patientsWithFullData);
    } catch (err) {
      console.error("Error fetching chronic patients:", err);
      setSnackbar({
        open: true,
        message: "Failed to fetch chronic patients",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/api/medical-admin/chronic-schedules");
      // api.get returns response.data directly
      console.log("Chronic schedules sample", res?.[0]);
      setSchedules(res || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  // Get unique faculties for filter
  const uniqueFaculties = useMemo(() => {
    const faculties = [...new Set(patients.map(p => p.faculty).filter(Boolean))];
    return faculties.sort();
  }, [patients]);

  // Get unique diseases for filter
  const uniqueDiseases = useMemo(() => {
    const diseases = new Set();
    patients.forEach(p => {
      (p.chronicDiseases || []).forEach(d => diseases.add(d));
    });
    return [...diseases].sort();
  }, [patients]);

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.fullName || "").toLowerCase().includes(query) ||
        (p.email || "").toLowerCase().includes(query) ||
        (p.employeeId || "").toLowerCase().includes(query) ||
        (p.nationalId || "").toLowerCase().includes(query) ||
        (p.chronicDiseases || []).some(d => d.toLowerCase().includes(query))
      );
    }

    // Gender filter
    if (genderFilter !== "all") {
      result = result.filter(p => p.gender === genderFilter);
    }

    // Faculty filter
    if (facultyFilter !== "all") {
      result = result.filter(p => p.faculty === facultyFilter);
    }

    // Disease filter
    if (diseaseFilter !== "all") {
      result = result.filter(p => (p.chronicDiseases || []).includes(diseaseFilter));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "nameDesc":
          return (b.fullName || "").localeCompare(a.fullName || "");
        case "diseasesDesc":
          return (b.chronicDiseases?.length || 0) - (a.chronicDiseases?.length || 0);
        case "diseasesAsc":
          return (a.chronicDiseases?.length || 0) - (b.chronicDiseases?.length || 0);
        default: // nameAsc
          return (a.fullName || "").localeCompare(b.fullName || "");
      }
    });

    return result;
  }, [patients, searchQuery, genderFilter, facultyFilter, diseaseFilter, sortBy]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    let result = [...schedules];

    // Search filter
    if (scheduleSearchQuery.trim()) {
      const query = scheduleSearchQuery.toLowerCase();
      result = result.filter(s =>
        (s.patientName || "").toLowerCase().includes(query) ||
        (s.medicationName || "").toLowerCase().includes(query) ||
        (s.labTestName || "").toLowerCase().includes(query)
      );
    }

    // Type filter
    if (scheduleTypeFilter !== "all") {
      result = result.filter(s => s.scheduleType === scheduleTypeFilter);
    }

    return result;
  }, [schedules, scheduleSearchQuery, scheduleTypeFilter]);

  // Paginated data
  const paginatedPatients = filteredPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const paginatedSchedules = filteredSchedules.slice(schedulePage * scheduleRowsPerPage, schedulePage * scheduleRowsPerPage + scheduleRowsPerPage);

  // Check active filters
  const hasActiveFilters = searchQuery || genderFilter !== "all" || facultyFilter !== "all" || diseaseFilter !== "all" || sortBy !== "nameAsc";
  const activeFilterCount = [searchQuery, genderFilter !== "all", facultyFilter !== "all", diseaseFilter !== "all", sortBy !== "nameAsc"].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setGenderFilter("all");
    setFacultyFilter("all");
    setDiseaseFilter("all");
    setSortBy("nameAsc");
    setPage(0);
  }, []);

  const clearScheduleFilters = useCallback(() => {
    setScheduleSearchQuery("");
    setScheduleTypeFilter("all");
    setSchedulePage(0);
  }, []);

  const handleOpenDialog = (patient) => {
    setSelectedPatient(patient);
    setOpenDialog(true);
    setScheduleData({
      medicationName: "",
      medicationQuantity: 1,
      labTestName: "",
      intervalMonths: 1,
      notes: "",
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
  };

  const handleCreateSchedule = async () => {
    if (!selectedPatient) return;

    try {
      const payload = {
        patientId: selectedPatient.id,
        scheduleType: scheduleType,
        intervalMonths: scheduleData.intervalMonths,
        notes: scheduleData.notes,
      };

      if (scheduleType === "PRESCRIPTION") {
        payload.medicationName = scheduleData.medicationName;
        payload.medicationQuantity = scheduleData.medicationQuantity || 1;
      } else if (scheduleType === "LAB") {
        payload.labTestName = scheduleData.labTestName;
      }

      await api.post("/api/medical-admin/create-chronic-schedule", payload);

      setSnackbar({
        open: true,
        message: "تم إنشاء الجدول بنجاح",
        severity: "success",
      });
      handleCloseDialog();
      fetchSchedules();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to create schedule",
        severity: "error",
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await api.delete(`/api/medical-admin/delete-chronic-schedule/${scheduleId}`);

      setSnackbar({
        open: true,
        message: "Schedule deleted successfully",
        severity: "success",
      });
      fetchSchedules();
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to delete schedule",
        severity: "error",
      });
    }
  };

  const getScheduleTypeLabel = (type) => {
    switch (type) {
      case "PRESCRIPTION":
        return "وصفة طبية";
      case "LAB":
        return "فحص مختبر";
      default:
        return type;
    }
  };

  const getScheduleTypeIcon = (type) => {
    switch (type) {
      case "PRESCRIPTION":
        return <LocalPharmacyIcon />;
      case "LAB":
        return <ScienceIcon />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#FAF8F5" }} dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" }, marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0, pt: { xs: "56px", sm: 0 }, p: 3, transition: "margin 0.3s ease" }}>
        <Header />

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <MonitorHeartIcon sx={{ fontSize: 40, color: "#556B2F" }} />
            <Box>
              <Typography variant="h4" fontWeight="700" color="#3D4F23">
                {t("chronicPatientsManagement", language)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("automaticMedicationLabScheduling", language)}
              </Typography>
            </Box>
          </Stack>

          <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); setPage(0); setSchedulePage(0); }} sx={{ mb: 3 }}>
            <Tab label={`${t("chronicPatients", language)} (${patients.length})`} />
            <Tab label={`${t("activeSchedules", language)} (${schedules.length})`} />
          </Tabs>

          {/* ============== PATIENTS TAB ============== */}
          {tabValue === 0 && (
            <>
              {/* Search and Filter Bar */}
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "#FAFAFA" }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Search */}
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" placeholder={t("searchByNameEmailId", language) || "Search by name, email, ID, disease..."} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#7B8B5E" }} /></InputAdornment>,
                        endAdornment: searchQuery && <InputAdornment position="end"><IconButton size="small" onClick={() => { setSearchQuery(""); setPage(0); }}><ClearIcon fontSize="small" /></IconButton></InputAdornment>,
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
                    />
                  </Grid>

                  {/* Gender Filter */}
                  <Grid item xs={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t("gender", language) || "Gender"}</InputLabel>
                      <Select value={genderFilter} label={t("gender", language) || "Gender"} onChange={(e) => { setGenderFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2, bgcolor: "#fff" }}>
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
                      <Select value={sortBy} label={t("sortBy", language) || "Sort By"} onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2, bgcolor: "#fff" }}>
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
                    <Grid item xs={12} sm={6} md={4}>
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

                    {/* Disease Filter */}
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{t("chronicDisease", language) || "Chronic Disease"}</InputLabel>
                        <Select value={diseaseFilter} label={t("chronicDisease", language) || "Chronic Disease"} onChange={(e) => { setDiseaseFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                          <MenuItem value="all">{t("all", language) || "All"}</MenuItem>
                          {uniqueDiseases.map((disease) => (
                            <MenuItem key={disease} value={disease}>{disease}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Collapse>
              </Paper>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                  <Typography variant="body2" sx={{ color: "#6B7280", mr: 1 }}>{t("activeFilters", language) || "Active filters"}:</Typography>
                  {searchQuery && <Chip size="small" label={`Search: "${searchQuery}"`} onDelete={() => setSearchQuery("")} sx={{ bgcolor: "#E8F5E9" }} />}
                  {genderFilter !== "all" && <Chip size="small" label={`Gender: ${genderFilter}`} onDelete={() => setGenderFilter("all")} sx={{ bgcolor: "#E3F2FD" }} />}
                  {facultyFilter !== "all" && <Chip size="small" label={`Faculty: ${facultyFilter}`} onDelete={() => setFacultyFilter("all")} sx={{ bgcolor: "#FFF3E0" }} />}
                  {diseaseFilter !== "all" && <Chip size="small" label={`Disease: ${diseaseFilter}`} onDelete={() => setDiseaseFilter("all")} sx={{ bgcolor: "#FFEBEE" }} />}
                </Box>
              )}

              {/* Results Count and View Controls */}
              <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Typography variant="body2" sx={{ color: "#6B7280" }}>
                  {t("showing", language) || "Showing"} <b>{Math.min(rowsPerPage, filteredPatients.length - page * rowsPerPage)}</b> {t("of", language) || "of"} <b>{filteredPatients.length}</b> {t("patients", language) || "patients"}
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

              {/* Content */}
              {filteredPatients.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <SearchIcon sx={{ fontSize: 60, color: "#BDBDBD", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t("noChronicPatientsFound", language) || "No chronic patients found"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hasActiveFilters ? t("noResultsForSearch", language) || "No results match your search criteria" : t("noChronicPatientsRegistered", language) || "No chronic patients registered yet"}
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
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("patient", language) || "Patient"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("employeeId", language) || "Employee ID"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("faculty", language) || "Faculty"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("chronicDiseases", language) || "Chronic Diseases"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("documents", language) || "Documents"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>{t("actions", language) || "Actions"}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPatients.map((patient) => (
                        <TableRow key={patient.id} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 36, height: 36, bgcolor: "#556B2F" }}>{patient.fullName?.charAt(0)}</Avatar>
                              <Box>
                                <Typography fontWeight="500">{patient.fullName}</Typography>
                                <Typography variant="caption" color="text.secondary">{patient.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{patient.employeeId}</TableCell>
                          <TableCell>{patient.faculty || "-"}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {(patient.chronicDiseases || []).slice(0, 2).map((disease, idx) => (
                                <Chip key={idx} label={disease} size="small" color="error" sx={{ mb: 0.5 }} />
                              ))}
                              {(patient.chronicDiseases || []).length > 2 && (
                                <Chip label={`+${patient.chronicDiseases.length - 2}`} size="small" variant="outlined" sx={{ mb: 0.5 }} />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {patient.chronicDocumentPaths?.length || 0} {t("files", language) || "files"}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title={t("viewDetails", language) || "View Details"}>
                                <IconButton size="small" onClick={() => setPatientDetailsDialog({ open: true, patient })} sx={{ color: "#556B2F" }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t("addSchedule", language) || "Add Schedule"}>
                                <IconButton size="small" onClick={() => handleOpenDialog(patient)} sx={{ color: "#1976D2" }}>
                                  <AddIcon fontSize="small" />
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
                <Grid container spacing={3}>
                  {paginatedPatients.map((patient) => (
                    <Grid item xs={12} md={6} lg={4} key={patient.id}>
                      <Card elevation={2} sx={{ borderRadius: 2, transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" } }}>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                            <Avatar sx={{ width: 48, height: 48, bgcolor: "#556B2F" }}>{patient.fullName?.charAt(0)}</Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" fontWeight="600">{patient.fullName}</Typography>
                              <Typography variant="body2" color="text.secondary">{patient.employeeId}</Typography>
                            </Box>
                          </Stack>

                          {patient.faculty && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                              <SchoolIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                              <Typography variant="body2">{patient.faculty}</Typography>
                            </Box>
                          )}

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                              {t("chronicDiseases", language)}:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {patient.chronicDiseases?.map((disease, idx) => (
                                <Chip key={idx} label={disease} size="small" color="error" sx={{ mb: 0.5 }} />
                              ))}
                            </Stack>
                          </Box>

                          {patient.chronicDocumentPaths && patient.chronicDocumentPaths.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                {t("documents", language) || "Documents"}: {patient.chronicDocumentPaths.length} {t("files", language) || "file(s)"}
                              </Typography>
                            </Box>
                          )}

                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Button variant="outlined" fullWidth startIcon={<VisibilityIcon />} onClick={() => setPatientDetailsDialog({ open: true, patient })} sx={{ textTransform: "none", borderColor: "#556B2F", color: "#556B2F" }}>
                              {t("details", language)}
                            </Button>
                            <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={() => handleOpenDialog(patient)} sx={{ textTransform: "none", bgcolor: "#556B2F", "&:hover": { bgcolor: "#3D4F23" } }}>
                              {t("addSchedule", language)}
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Pagination */}
              {filteredPatients.length > 0 && (
                <Paper sx={{ mt: 3, p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("page", language) || "Page"} {page + 1} {t("of", language) || "of"} {Math.ceil(filteredPatients.length / rowsPerPage)} ({filteredPatients.length} {t("total", language) || "total"})
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={t("firstPage", language) || "First Page"}>
                      <span><IconButton onClick={() => setPage(0)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><FirstPageIcon /></IconButton></span>
                    </Tooltip>
                    <Tooltip title={t("previousPage", language) || "Previous"}>
                      <span><IconButton onClick={() => setPage(page - 1)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateBeforeIcon /></IconButton></span>
                    </Tooltip>
                    {Array.from({ length: Math.min(5, Math.ceil(filteredPatients.length / rowsPerPage)) }, (_, i) => {
                      const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
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
                      <span><IconButton onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(filteredPatients.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateNextIcon /></IconButton></span>
                    </Tooltip>
                    <Tooltip title={t("lastPage", language) || "Last Page"}>
                      <span><IconButton onClick={() => setPage(Math.ceil(filteredPatients.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(filteredPatients.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><LastPageIcon /></IconButton></span>
                    </Tooltip>
                  </Stack>
                </Paper>
              )}
            </>
          )}

          {/* ============== SCHEDULES TAB ============== */}
          {tabValue === 1 && (
            <>
              {/* Search and Filter Bar for Schedules */}
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "#FAFAFA" }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Search */}
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" placeholder={t("searchByPatientMedication", language) || "Search by patient, medication, or test..."} value={scheduleSearchQuery} onChange={(e) => { setScheduleSearchQuery(e.target.value); setSchedulePage(0); }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#7B8B5E" }} /></InputAdornment>,
                        endAdornment: scheduleSearchQuery && <InputAdornment position="end"><IconButton size="small" onClick={() => { setScheduleSearchQuery(""); setSchedulePage(0); }}><ClearIcon fontSize="small" /></IconButton></InputAdornment>,
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
                    />
                  </Grid>

                  {/* Type Filter */}
                  <Grid item xs={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t("scheduleType", language) || "Type"}</InputLabel>
                      <Select value={scheduleTypeFilter} label={t("scheduleType", language) || "Type"} onChange={(e) => { setScheduleTypeFilter(e.target.value); setSchedulePage(0); }} sx={{ borderRadius: 2, bgcolor: "#fff" }}>
                        <MenuItem value="all">{t("all", language) || "All"}</MenuItem>
                        <MenuItem value="PRESCRIPTION">{t("prescription", language) || "Prescription"}</MenuItem>
                        <MenuItem value="LAB">{t("labTest", language) || "Lab Test"}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Rows per page */}
                  <Grid item xs={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t("perPage", language) || "Per Page"}</InputLabel>
                      <Select value={scheduleRowsPerPage} label={t("perPage", language) || "Per Page"} onChange={(e) => { setScheduleRowsPerPage(parseInt(e.target.value, 10)); setSchedulePage(0); }} sx={{ borderRadius: 2, bgcolor: "#fff" }}>
                        {rowsPerPageOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Clear Filters */}
                  <Grid item xs={12} md={3}>
                    <Button fullWidth variant="outlined" startIcon={<ClearIcon />} onClick={clearScheduleFilters} disabled={!scheduleSearchQuery && scheduleTypeFilter === "all"}
                      sx={{ borderRadius: 2, textTransform: "none", borderColor: "#D32F2F", color: "#D32F2F", "&:hover": { bgcolor: "rgba(211, 47, 47, 0.1)", borderColor: "#B71C1C" }, "&:disabled": { borderColor: "#BDBDBD", color: "#BDBDBD" } }}>
                      {t("clearFilters", language) || "Clear Filters"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Results count */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#6B7280" }}>
                  {t("showing", language) || "Showing"} <b>{Math.min(scheduleRowsPerPage, filteredSchedules.length - schedulePage * scheduleRowsPerPage)}</b> {t("of", language) || "of"} <b>{filteredSchedules.length}</b> {t("schedules", language) || "schedules"}
                </Typography>
              </Box>

              {/* Schedules Table */}
              {filteredSchedules.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <SearchIcon sx={{ fontSize: 60, color: "#BDBDBD", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t("noSchedulesFound", language) || "No schedules found"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {scheduleSearchQuery || scheduleTypeFilter !== "all" ? t("noResultsForSearch", language) || "No results match your search criteria" : t("noActiveSchedules", language) || "No active schedules yet"}
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#556B2F" }}>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("patient", language)}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("type", language)}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("details", language)}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("everyMonth", language)}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("lastSent", language)}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>{t("actions", language)}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedSchedules.map((schedule) => (
                        <TableRow key={schedule.id} hover>
                          <TableCell>
                            <Typography fontWeight="500">{schedule.patientName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getScheduleTypeIcon(schedule.scheduleType)}
                              label={getScheduleTypeLabel(schedule.scheduleType)}
                              size="small"
                              sx={{ bgcolor: schedule.scheduleType === "PRESCRIPTION" ? "#E8F5E9" : "#E3F2FD", color: schedule.scheduleType === "PRESCRIPTION" ? "#2E7D32" : "#1565C0" }}
                            />
                          </TableCell>
                          <TableCell>{schedule.medicationName || schedule.labTestName}</TableCell>
                          <TableCell>
                            <Chip label={`${schedule.intervalMonths} ${t("months", language) || "months"}`} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            {schedule.lastSentAt
                              ? new Date(schedule.lastSentAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
                              : <Typography variant="body2" color="text.secondary">{t("notSentYet", language) || "Not sent yet"}</Typography>}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={t("deleteSchedule", language) || "Delete Schedule"}>
                              <IconButton color="error" size="small" onClick={() => handleDeleteSchedule(schedule.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination for Schedules */}
              {filteredSchedules.length > 0 && (
                <Paper sx={{ mt: 3, p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("page", language) || "Page"} {schedulePage + 1} {t("of", language) || "of"} {Math.ceil(filteredSchedules.length / scheduleRowsPerPage)} ({filteredSchedules.length} {t("total", language) || "total"})
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={t("firstPage", language) || "First Page"}>
                      <span><IconButton onClick={() => setSchedulePage(0)} disabled={schedulePage === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><FirstPageIcon /></IconButton></span>
                    </Tooltip>
                    <Tooltip title={t("previousPage", language) || "Previous"}>
                      <span><IconButton onClick={() => setSchedulePage(schedulePage - 1)} disabled={schedulePage === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateBeforeIcon /></IconButton></span>
                    </Tooltip>
                    {Array.from({ length: Math.min(5, Math.ceil(filteredSchedules.length / scheduleRowsPerPage)) }, (_, i) => {
                      const totalPages = Math.ceil(filteredSchedules.length / scheduleRowsPerPage);
                      let pageNum;
                      if (totalPages <= 5) { pageNum = i; }
                      else if (schedulePage < 3) { pageNum = i; }
                      else if (schedulePage > totalPages - 4) { pageNum = totalPages - 5 + i; }
                      else { pageNum = schedulePage - 2 + i; }
                      return (
                        <Button key={pageNum} variant={schedulePage === pageNum ? "contained" : "outlined"} size="small" onClick={() => setSchedulePage(pageNum)}
                          sx={{ minWidth: 36, bgcolor: schedulePage === pageNum ? "#556B2F" : "transparent", borderColor: "#556B2F", color: schedulePage === pageNum ? "#fff" : "#556B2F", "&:hover": { bgcolor: schedulePage === pageNum ? "#3D4F23" : "rgba(85, 107, 47, 0.1)" } }}>
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                    <Tooltip title={t("nextPage", language) || "Next"}>
                      <span><IconButton onClick={() => setSchedulePage(schedulePage + 1)} disabled={schedulePage >= Math.ceil(filteredSchedules.length / scheduleRowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><NavigateNextIcon /></IconButton></span>
                    </Tooltip>
                    <Tooltip title={t("lastPage", language) || "Last Page"}>
                      <span><IconButton onClick={() => setSchedulePage(Math.ceil(filteredSchedules.length / scheduleRowsPerPage) - 1)} disabled={schedulePage >= Math.ceil(filteredSchedules.length / scheduleRowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}><LastPageIcon /></IconButton></span>
                    </Tooltip>
                  </Stack>
                </Paper>
              )}
            </>
          )}
        </Paper>

        {/* Dialog for creating schedule */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{t("createNewAutomaticSchedule", language)}</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("patient", language)}: <strong>{selectedPatient?.fullName}</strong>
              </Typography>

              <FormControl fullWidth>
                <InputLabel>{t("scheduleType", language)}</InputLabel>
                <Select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  label={t("scheduleType", language)}
                >
                  <MenuItem value="PRESCRIPTION">{t("prescription", language)}</MenuItem>
                  <MenuItem value="LAB">{t("labTest", language)}</MenuItem>
                </Select>
              </FormControl>

              {scheduleType === "PRESCRIPTION" && (
                <>
                  <Autocomplete
                    options={medications}
                    value={scheduleData.medicationName || null}
                    onChange={(event, newValue) => {
                      setScheduleData({ ...scheduleData, medicationName: newValue || "" });
                    }}
                    loading={loadingMedications}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Medication Name"
                        required
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingMedications ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    fullWidth
                    freeSolo={false}
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    value={scheduleData.medicationQuantity || 1}
                    onChange={(e) =>
                      setScheduleData({ ...scheduleData, medicationQuantity: parseInt(e.target.value) || 1 })
                    }
                    fullWidth
                    inputProps={{ min: 1 }}
                    required
                    helperText="Number of medication units/packages needed"
                  />
                </>
              )}

              {scheduleType === "LAB" && (
                <Autocomplete
                  options={labTests}
                  value={scheduleData.labTestName || null}
                  onChange={(event, newValue) => {
                    setScheduleData({ ...scheduleData, labTestName: newValue || "" });
                  }}
                  loading={loadingLabTests}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Lab Test Name"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingLabTests ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  fullWidth
                  freeSolo={false}
                />
              )}

              <TextField
                label="Every (Months)"
                type="number"
                value={scheduleData.intervalMonths}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, intervalMonths: parseInt(e.target.value) })
                }
                fullWidth
                inputProps={{ min: 1, max: 12 }}
                required
                helperText="Example: 1 = every month, 2 = every 2 months"
              />

              <TextField
                label="Notes (Optional)"
                value={scheduleData.notes}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, notes: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t("cancel", language)}</Button>
            <Button variant="contained" onClick={handleCreateSchedule}>
              {t("create", language)}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for patient details */}
        <Dialog
          open={patientDetailsDialog.open}
          onClose={() => setPatientDetailsDialog({ open: false, patient: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{t("completePatientInformation", language)}</DialogTitle>
          <DialogContent>
            {patientDetailsDialog.patient && (
              <Stack spacing={3} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Full Name"
                      value={patientDetailsDialog.patient.fullName || ""}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Employee ID"
                      value={patientDetailsDialog.patient.employeeId || ""}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email"
                      value={patientDetailsDialog.patient.email || ""}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Phone"
                      value={patientDetailsDialog.patient.phone || "Not specified"}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="National ID"
                      value={patientDetailsDialog.patient.nationalId || "Not specified"}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Department"
                      value={patientDetailsDialog.patient.department || "Not specified"}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Faculty"
                      value={patientDetailsDialog.patient.faculty || "Not specified"}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Gender"
                      value={patientDetailsDialog.patient.gender || "Not specified"}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Date of Birth"
                      value={patientDetailsDialog.patient.dateOfBirth 
                        ? (typeof patientDetailsDialog.patient.dateOfBirth === 'string' 
                            ? patientDetailsDialog.patient.dateOfBirth 
                            : patientDetailsDialog.patient.dateOfBirth.toString())
                        : "Not specified"}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Age"
                      value={patientDetailsDialog.patient.age 
                        ? `${patientDetailsDialog.patient.age} years` 
                        : "Not specified"}
                      fullWidth
                      disabled
                    />
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Chronic Diseases
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {patientDetailsDialog.patient.chronicDiseases?.map((disease, idx) => (
                      <Chip
                        key={idx}
                        label={disease}
                        color="error"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>

                {patientDetailsDialog.patient.chronicDocumentPaths && 
                 patientDetailsDialog.patient.chronicDocumentPaths.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Chronic Disease Documents
                    </Typography>
                    <Grid container spacing={2}>
                      {patientDetailsDialog.patient.chronicDocumentPaths.map((docPath, idx) => {
                        const fullUrl = docPath.startsWith("http")
                          ? docPath
                          : `${API_BASE_URL}${docPath}`;
                        return (
                          <Grid item xs={12} sm={6} md={4} key={idx}>
                            <Card elevation={2}>
                              <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <DescriptionIcon sx={{ fontSize: 40, color: "#556B2F" }} />
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight="600">
                                      Document {idx + 1}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {docPath.split("/").pop()}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => setDocumentDialog({ open: true, imageUrl: fullUrl })}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    href={fullUrl}
                                    download
                                  >
                                    Download
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPatientDetailsDialog({ open: false, patient: null })}>
              {t("close", language)}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for viewing documents */}
        <Dialog
          open={documentDialog.open}
          onClose={() => setDocumentDialog({ open: false, imageUrl: null })}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.9)",
            },
          }}
        >
          <DialogContent sx={{ p: 0, position: "relative" }}>
            {documentDialog.imageUrl && (
              <Box
                component="img"
                src={documentDialog.imageUrl}
                alt="Chronic Disease Document"
                sx={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ bgcolor: "rgba(0, 0, 0, 0.9)", p: 1 }}>
            <Button
              onClick={() => setDocumentDialog({ open: false, imageUrl: null })}
              sx={{ color: "white" }}
            >
              {t("close", language)}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ChronicPatientsManagement;

