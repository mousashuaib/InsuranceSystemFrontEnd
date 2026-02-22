import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Avatar,
  Button,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  CircularProgress,
} from "@mui/material";
import Header from "../MedicalAdminHeader";
import Sidebar from "../MedicalAdminSidebar";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import UploadIcon from "@mui/icons-material/Upload";
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
import BadgeIcon from "@mui/icons-material/Badge";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import WcIcon from "@mui/icons-material/Wc";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import RefreshIcon from "@mui/icons-material/Refresh";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../../config/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const ClientListFinal = () => {
  const { language, isRTL } = useLanguage();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("INSURANCE_CLIENT");
  const [editClient, setEditClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [openFamilyDialog, setOpenFamilyDialog] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyClient, setFamilyClient] = useState(null);
  const [pendingFamily, setPendingFamily] = useState([]);

  // View and pagination states
  const [viewMode, setViewMode] = useState("table");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [5, 10, 25, 50, 100];

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("dateDesc");

  const [tabValue, setTabValue] = useState(0);

  const getUniversityCardSrc = (client) => {
    const imgs = client?.universityCardImages || [];
    const last = imgs[imgs.length - 1];
    return last ? `${API_BASE_URL}${last}?t=${client.updatedAt || Date.now()}` : null;
  };

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await api.get(API_ENDPOINTS.CLIENTS.LIST);
        const clientsData = res || [];

        const filtered = clientsData.filter((client) => {
          const roles = (client.roles || []).map((r) => r.toUpperCase());
          const requestedRole = client.requestedRole?.toUpperCase();

          if (client.status === "ACTIVE") {
            return roles.includes("INSURANCE_CLIENT");
          }

          if (client.status === "INACTIVE") {
            return requestedRole === "INSURANCE_CLIENT";
          }

          return false;
        });

        const sorted = filtered.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setAllClients(sorted);
        setClients(sorted);
      } catch (err) {
        console.error("Failed to load clients:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch pending family
  useEffect(() => {
    const fetchPendingFamily = async () => {
      try {
        const res = await api.get("/api/family-members/pending");
        setPendingFamily(res || []);
      } catch (err) {
        console.error("Failed to fetch pending family updates", err);
      }
    };

    fetchPendingFamily();
  }, []);

  // Get unique values for filters
  const uniqueFaculties = useMemo(() => {
    const faculties = [...new Set(allClients.map(c => c.faculty).filter(Boolean))];
    return faculties.sort();
  }, [allClients]);

  const uniqueDepartments = useMemo(() => {
    const departments = [...new Set(allClients.map(c => c.department).filter(Boolean))];
    return departments.sort();
  }, [allClients]);

  // Sort options
  const sortOptions = [
    { value: "dateDesc", label: t("newestFirst", language) || "Newest First" },
    { value: "dateAsc", label: t("oldestFirst", language) || "Oldest First" },
    { value: "nameAsc", label: t("nameAZ", language) || "Name (A-Z)" },
    { value: "nameDesc", label: t("nameZA", language) || "Name (Z-A)" },
    { value: "employeeId", label: t("employeeId", language) || "Employee ID" },
  ];

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = [...allClients];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.fullName || "").toLowerCase().includes(query) ||
        (c.email || "").toLowerCase().includes(query) ||
        (c.nationalId || "").toLowerCase().includes(query) ||
        (c.employeeId || "").toLowerCase().includes(query) ||
        (c.phone || "").toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (genderFilter !== "all") {
      result = result.filter(c => c.gender === genderFilter);
    }

    // Faculty filter
    if (facultyFilter !== "all") {
      result = result.filter(c => c.faculty === facultyFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      result = result.filter(c => c.department === departmentFilter);
    }

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(c => new Date(c.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(c => new Date(c.createdAt) <= toDate);
    }

    // Sort
    switch (sortBy) {
      case "dateAsc":
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "nameAsc":
        result.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        break;
      case "nameDesc":
        result.sort((a, b) => (b.fullName || "").localeCompare(a.fullName || ""));
        break;
      case "employeeId":
        result.sort((a, b) => (a.employeeId || "").localeCompare(b.employeeId || ""));
        break;
      default: // dateDesc
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [allClients, searchQuery, genderFilter, facultyFilter, departmentFilter, dateFrom, dateTo, sortBy]);

  // Split by status
  const activeClients = useMemo(() => filteredClients.filter(c => c.status === "ACTIVE"), [filteredClients]);
  const deactivatedClients = useMemo(() => filteredClients.filter(c => c.status === "INACTIVE"), [filteredClients]);

  // Get current tab clients
  const currentClients = tabValue === 0 ? activeClients : deactivatedClients;

  // Check active filters
  const hasActiveFilters = searchQuery || genderFilter !== "all" || facultyFilter !== "all" || departmentFilter !== "all" || dateFrom || dateTo || sortBy !== "dateDesc";

  const activeFilterCount = [
    searchQuery,
    genderFilter !== "all",
    facultyFilter !== "all",
    departmentFilter !== "all",
    dateFrom || dateTo,
    sortBy !== "dateDesc",
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setGenderFilter("all");
    setFacultyFilter("all");
    setDepartmentFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("dateDesc");
    setPage(0);
  }, []);

  // Edit handlers
  const handleEditOpen = (client) => {
    setEditClient(client);
    setFormData({
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      universityCardFile: null,
    });
    setPreviewImage(null);
  };

  const handleEditClose = () => {
    setEditClient(null);
    setFormData({});
    setPreviewImage(null);
  };

  const handleEditSave = async () => {
    try {
      const data = new FormData();
      data.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
            }),
          ],
          { type: "application/json" }
        )
      );

      if (formData.universityCardFile) {
        data.append("universityCard", formData.universityCardFile);
      }

      const res = await api.patch(
        `/api/clients/update/${editClient.id}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedClient = res;
      setAllClients((prev) =>
        prev.map((c) => (c.id === editClient.id ? updatedClient : c))
      );
      setClients((prev) =>
        prev.map((c) => (c.id === editClient.id ? updatedClient : c))
      );

      handleEditClose();
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      alert(t("updateFailedCheckConsole", language));
    }
  };

  const approveFamily = async (id) => {
    await api.patch(`/api/family-members/${id}/approve`);
    setPendingFamily((prev) => prev.filter((m) => m.id !== id));
  };

  const rejectFamily = async (id) => {
    await api.patch(`/api/family-members/${id}/reject`, { reason: "Rejected by admin" });
    setPendingFamily((prev) => prev.filter((m) => m.id !== id));
  };

  const handleDeactivateOpen = (client) => {
    setSelectedClient(client);
    setDeactivateReason("");
    setOpenDeactivateDialog(true);
  };

  const handleDeactivateClose = () => {
    setSelectedClient(null);
    setDeactivateReason("");
    setOpenDeactivateDialog(false);
  };

  const handleDeactivateConfirm = async () => {
    try {
      await api.patch(
        `/api/clients/${selectedClient.id}/deactivate`,
        { reason: deactivateReason }
      );

      const updatedClient = { ...selectedClient, status: "INACTIVE" };
      setAllClients((prev) =>
        prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
      );
      setClients((prev) =>
        prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
      );

      alert(t("clientDeactivatedSuccess", language).replace("{name}", selectedClient.fullName));
      handleDeactivateClose();
    } catch (err) {
      console.error("Deactivate failed:", err.response?.data || err.message);
      alert(t("deactivateFailedCheckConsole", language));
    }
  };

  const handleReactivate = async (client) => {
    try {
      await api.patch(`/api/clients/${client.id}/reactivate`);

      const updatedClient = { ...client, status: "ACTIVE" };
      setAllClients((prev) =>
        prev.map((c) => (c.id === client.id ? updatedClient : c))
      );
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? updatedClient : c))
      );

      alert(t("clientReactivatedSuccess", language).replace("{name}", client.fullName));
    } catch (err) {
      console.error("Reactivate failed:", err.response?.data || err.message);
      alert(t("reactivateFailedCheckConsole", language));
    }
  };

  const fetchClientFamily = async (client) => {
    setFamilyClient(client);
    setOpenFamilyDialog(true);
    setFamilyLoading(true);

    try {
      const res = await api.get(API_ENDPOINTS.FAMILY_MEMBERS.BY_CLIENT(client.id));
      setFamilyMembers(res || []);
    } catch (err) {
      console.error("Failed to fetch family:", err);
      setFamilyMembers([]);
    } finally {
      setFamilyLoading(false);
    }
  };

  const activePendingFamily = (pendingFamily || []).filter(
    (member) => member.clientStatus === "ACTIVE"
  );

  const groupedPendingFamily = activePendingFamily.reduce((acc, member) => {
    const clientId = member.clientId;

    if (!acc[clientId]) {
      acc[clientId] = {
        clientId,
        clientFullName: member.clientFullName,
        clientNationalId: member.clientNationalId,
        members: [],
      };
    }

    acc[clientId].members.push(member);
    return acc;
  }, {});

  // Render client card
  const renderClientCard = (client) => {
    const isActive = client.status === "ACTIVE";
    return (
      <Card
        key={client.id}
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: isActive ? "1px solid #e2e8f0" : "2px solid #ef4444",
          bgcolor: isActive ? "#fff" : "#fef2f2",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={getUniversityCardSrc(client)}
                sx={{ width: 56, height: 56, bgcolor: "#556B2F" }}
              >
                {client.fullName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#3D4F23" }}>
                  {client.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {client.employeeId}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={client.status}
              color={isActive ? "success" : "error"}
              size="small"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Details */}
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EmailIcon sx={{ color: "#6B7280", fontSize: 18 }} />
              <Typography variant="body2" noWrap>{client.email}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PhoneIcon sx={{ color: "#6B7280", fontSize: 18 }} />
              <Typography variant="body2">{client.phone || "N/A"}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BadgeIcon sx={{ color: "#6B7280", fontSize: 18 }} />
              <Typography variant="body2">{client.nationalId}</Typography>
            </Box>
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
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FamilyRestroomIcon />}
              onClick={() => fetchClientFamily(client)}
              sx={{ textTransform: "none" }}
            >
              {t("viewFamily", language)}
            </Button>
            {isActive ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditOpen(client)}
                  sx={{ textTransform: "none", bgcolor: "#556B2F", "&:hover": { bgcolor: "#3D4F23" } }}
                >
                  {t("edit", language)}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={<BlockIcon />}
                  onClick={() => handleDeactivateOpen(client)}
                  sx={{ textTransform: "none" }}
                >
                  {t("deactivate", language)}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleReactivate(client)}
                sx={{ textTransform: "none" }}
              >
                {t("reactivate", language)}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
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
          {/* Page Title */}
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#3D4F23", display: "flex", alignItems: "center" }}
          >
            <AssignmentIndIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 35, color: "#556B2F" }} />
            {t("clients", language)}
          </Typography>

          {/* Search and Filter Bar */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t("searchClients", language) || "Search by name, email, ID..."}
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
                        <IconButton size="small" onClick={() => { setSearchQuery(""); setPage(0); }}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAFAFA" } }}
                />
              </Grid>

              {/* Gender Filter */}
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("gender", language) || "Gender"}</InputLabel>
                  <Select
                    value={genderFilter}
                    label={t("gender", language) || "Gender"}
                    onChange={(e) => { setGenderFilter(e.target.value); setPage(0); }}
                    sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}
                  >
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
                  <Select
                    value={sortBy}
                    label={t("sortBy", language) || "Sort By"}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Filters Toggle */}
              <Grid item xs={6} md={2}>
                <Button
                  fullWidth
                  variant={showFilters ? "contained" : "outlined"}
                  startIcon={<FilterListIcon />}
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
                  {t("filters", language) || "Filters"} {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </Grid>

              {/* Clear Filters */}
              <Grid item xs={6} md={2}>
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
                    <Select
                      value={facultyFilter}
                      label={t("faculty", language) || "Faculty"}
                      onChange={(e) => { setFacultyFilter(e.target.value); setPage(0); }}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">{t("all", language) || "All"}</MenuItem>
                      {uniqueFaculties.map((faculty) => (
                        <MenuItem key={faculty} value={faculty}>{faculty}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Department Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("department", language) || "Department"}</InputLabel>
                    <Select
                      value={departmentFilter}
                      label={t("department", language) || "Department"}
                      onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">{t("all", language) || "All"}</MenuItem>
                      {uniqueDepartments.map((dept) => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date From */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label={t("registeredFrom", language) || "Registered From"}
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>

                {/* Date To */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label={t("registeredTo", language) || "Registered To"}
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
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
              {departmentFilter !== "all" && <Chip size="small" label={`Dept: ${departmentFilter}`} onDelete={() => setDepartmentFilter("all")} sx={{ bgcolor: "#F3E5F5" }} />}
              {(dateFrom || dateTo) && <Chip size="small" label={`Date: ${dateFrom || "..."} to ${dateTo || "..."}`} onDelete={() => { setDateFrom(""); setDateTo(""); }} sx={{ bgcolor: "#FFEBEE" }} />}
            </Box>
          )}

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => { setTabValue(newValue); setPage(0); }}
            textColor="primary"
            indicatorColor="primary"
            sx={{ backgroundColor: "#fff", borderRadius: 2, mb: 2, boxShadow: 1 }}
          >
            <Tab label={`${t("activeClients", language)} (${activeClients.length})`} />
            <Tab label={`${t("deactivatedClients", language)} (${deactivatedClients.length})`} />
            <Tab label={`${t("pendingFamilyUpdates", language)} (${pendingFamily.length})`} />
          </Tabs>

          {/* Results Count and View Controls */}
          {tabValue !== 2 && (
            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                {t("showing", language) || "Showing"} <b>{Math.min(rowsPerPage, currentClients.length - page * rowsPerPage)}</b> {t("of", language) || "of"} <b>{currentClients.length}</b> {t("clients", language) || "clients"}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                {/* Rows per page */}
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>{t("perPage", language) || "Per Page"}</InputLabel>
                  <Select
                    value={rowsPerPage}
                    label={t("perPage", language) || "Per Page"}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    sx={{ borderRadius: 2, bgcolor: "#FAFAFA" }}
                  >
                    {rowsPerPageOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* View mode toggle */}
                <Stack direction="row" sx={{ bgcolor: "#f1f5f9", borderRadius: 2, p: 0.5 }}>
                  <Tooltip title={t("tableView", language) || "Table View"}>
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
                  <Tooltip title={t("cardView", language) || "Card View"}>
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
          )}

          {/* Pending Family Tab Content */}
          {tabValue === 2 && (
            <Stack spacing={3}>
              {Object.values(groupedPendingFamily).length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <Typography color="text.secondary">
                    {t("noPendingFamilyUpdates", language)}
                  </Typography>
                </Paper>
              ) : (
                Object.values(groupedPendingFamily).map((group) => (
                  <Paper key={group.clientId} sx={{ p: 3, borderRadius: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="#1E8EAB" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon /> {group.clientFullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        National ID: {group.clientNationalId}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={2}>
                      {group.members.map((member) => (
                        <Paper key={member.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {member.documentImages?.map((img, i) => (
                                  <Avatar
                                    key={i}
                                    src={`${API_BASE_URL}${img}`}
                                    variant="rounded"
                                    sx={{ width: 70, height: 70 }}
                                  />
                                ))}
                              </Stack>
                            </Grid>

                            <Grid item xs={12} md={9}>
                              <Typography fontWeight="bold">{member.fullName}</Typography>
                              <Typography variant="body2"><b>Relation:</b> {member.relation}</Typography>
                              <Typography variant="body2"><b>National ID:</b> {member.nationalId}</Typography>
                              <Typography variant="body2"><b>Insurance #:</b> {member.insuranceNumber || "N/A"}</Typography>
                              <Typography variant="body2"><b>Gender:</b> {member.gender}</Typography>
                              <Typography variant="body2"><b>Date of Birth:</b> {member.dateOfBirth}</Typography>

                              <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
                                <Button size="small" variant="contained" color="success" onClick={() => approveFamily(member.id)}>
                                  {t("approve", language)}
                                </Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => rejectFamily(member.id)}>
                                  {t("reject", language)}
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          )}

          {/* Clients Content */}
          {tabValue !== 2 && (
            <>
              {loading ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <CircularProgress sx={{ color: "#556B2F" }} />
                </Box>
              ) : currentClients.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <SearchIcon sx={{ fontSize: 60, color: "#BDBDBD", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {hasActiveFilters ? t("noClientsMatchFilters", language) || "No clients match your filters" : t("noClientsFound", language) || "No clients found"}
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
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("name", language) || "Name"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("email", language) || "Email"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("employeeId", language) || "Employee ID"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("faculty", language) || "Faculty"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("gender", language) || "Gender"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>{t("status", language) || "Status"}</TableCell>
                        <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>{t("actions", language) || "Actions"}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentClients
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((client) => (
                          <TableRow key={client.id} hover>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Avatar src={getUniversityCardSrc(client)} sx={{ width: 36, height: 36, bgcolor: "#556B2F" }}>
                                  {client.fullName?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight="500">{client.fullName}</Typography>
                                  <Typography variant="caption" color="text.secondary">{client.nationalId}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.employeeId}</TableCell>
                            <TableCell>{client.faculty || "N/A"}</TableCell>
                            <TableCell>{client.gender}</TableCell>
                            <TableCell>
                              <Chip label={client.status} color={client.status === "ACTIVE" ? "success" : "error"} size="small" />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title={t("viewFamily", language) || "View Family"}>
                                  <IconButton size="small" onClick={() => fetchClientFamily(client)} sx={{ color: "#1976D2" }}>
                                    <FamilyRestroomIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {client.status === "ACTIVE" ? (
                                  <>
                                    <Tooltip title={t("edit", language) || "Edit"}>
                                      <IconButton size="small" onClick={() => handleEditOpen(client)} sx={{ color: "#556B2F" }}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t("deactivate", language) || "Deactivate"}>
                                      <IconButton size="small" onClick={() => handleDeactivateOpen(client)} sx={{ color: "#ed6c02" }}>
                                        <BlockIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Tooltip title={t("reactivate", language) || "Reactivate"}>
                                    <IconButton size="small" onClick={() => handleReactivate(client)} sx={{ color: "#2e7d32" }}>
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
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
                  {currentClients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((client) => (
                      <Grid item xs={12} sm={6} lg={4} key={client.id}>
                        {renderClientCard(client)}
                      </Grid>
                    ))}
                </Grid>
              )}

              {/* Pagination */}
              {currentClients.length > 0 && (
                <Paper sx={{ mt: 3, p: 2, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("page", language) || "Page"} {page + 1} {t("of", language) || "of"} {Math.ceil(currentClients.length / rowsPerPage)} ({currentClients.length} {t("total", language) || "total"})
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={t("firstPage", language) || "First Page"}>
                      <span>
                        <IconButton onClick={() => setPage(0)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}>
                          <FirstPageIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t("previousPage", language) || "Previous"}>
                      <span>
                        <IconButton onClick={() => setPage(page - 1)} disabled={page === 0} size="small" sx={{ bgcolor: "#f1f5f9" }}>
                          <NavigateBeforeIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    {Array.from({ length: Math.min(5, Math.ceil(currentClients.length / rowsPerPage)) }, (_, i) => {
                      const totalPages = Math.ceil(currentClients.length / rowsPerPage);
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
                            "&:hover": { bgcolor: page === pageNum ? "#3D4F23" : "rgba(85, 107, 47, 0.1)" },
                          }}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}

                    <Tooltip title={t("nextPage", language) || "Next"}>
                      <span>
                        <IconButton onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(currentClients.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}>
                          <NavigateNextIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t("lastPage", language) || "Last Page"}>
                      <span>
                        <IconButton onClick={() => setPage(Math.ceil(currentClients.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(currentClients.length / rowsPerPage) - 1} size="small" sx={{ bgcolor: "#f1f5f9" }}>
                          <LastPageIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onClose={handleEditClose}>
        <DialogTitle>{t("editClient", language)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t("fullName", language)}
              value={formData.fullName || ""}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              fullWidth
            />
            <TextField
              label={t("email", language)}
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label={t("phone", language)}
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />

            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
              {t("uploadUniversityCard", language)}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData({ ...formData, universityCardFile: file });
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }}
              />
            </Button>
            {previewImage && (
              <Avatar src={previewImage} alt="Preview" variant="rounded" sx={{ width: 100, height: 120 }} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>{t("cancel", language)}</Button>
          <Button onClick={handleEditSave} variant="contained" color="success">
            {t("save", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        <DialogTitle>{t("universityCard", language)}</DialogTitle>
        <DialogContent dividers>
          {previewImage && (
            <img src={previewImage} alt="University Card Full" style={{ width: "100%", height: "auto", borderRadius: "10px" }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            {t("close", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={openDeactivateDialog} onClose={handleDeactivateClose}>
        <DialogTitle>{t("deactivateClient", language)}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("enterDeactivateReason", language)} <strong>{selectedClient?.fullName}</strong>:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t("reasonLabel", language)}
            type="text"
            fullWidth
            variant="outlined"
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeactivateClose}>{t("cancel", language)}</Button>
          <Button color="warning" variant="contained" onClick={handleDeactivateConfirm}>
            {t("confirmDeactivate", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Family Dialog */}
      <Dialog open={openFamilyDialog} onClose={() => setOpenFamilyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {t("familyMembersOf", language)} {familyClient?.fullName}
        </DialogTitle>

        <DialogContent dividers>
          {familyLoading ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : familyMembers.length === 0 ? (
            <Typography color="text.secondary">
              {t("noFamilyMembersRegistered", language)}
            </Typography>
          ) : (
            <Stack spacing={2}>
              {familyMembers.map((member) => (
                <Paper key={member.id} sx={{ p: 2, borderRadius: 2 }}>
                  <Typography fontWeight="bold">{member.fullName}</Typography>
                  <Typography variant="body2"><b>{t("relationLabel", language)}</b> {member.relation}</Typography>
                  <Typography variant="body2"><b>{t("nationalIdLabel", language)}</b> {member.nationalId}</Typography>
                  <Typography variant="body2"><b>{t("insuranceNumberLabel", language)}</b> {member.insuranceNumber || t("notAssigned", language)}</Typography>
                  <Typography variant="body2"><b>{t("dateOfBirthLabel", language)}</b> {member.dateOfBirth}</Typography>

                  <Chip
                    label={member.status}
                    color={member.status === "APPROVED" ? "success" : member.status === "REJECTED" ? "error" : "warning"}
                    size="small"
                    sx={{ mt: 1 }}
                  />

                  <Divider sx={{ my: 1 }} />

                  {member.documentImages && member.documentImages.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {member.documentImages.map((imagePath, index) => (
                        <Avatar
                          key={index}
                          src={`${API_BASE_URL}${imagePath}`}
                          variant="rounded"
                          sx={{ width: 80, height: 80, cursor: "pointer", border: "1px solid #ddd" }}
                          onClick={() => {
                            setPreviewImage(`${API_BASE_URL}${imagePath}`);
                            setOpenDialog(true);
                          }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t("noDocumentsUploaded", language)}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenFamilyDialog(false)}>{t("close", language)}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientListFinal;
