import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  InputAdornment,
  Checkbox,
  Menu,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";
import ServiceDialog from "../dialogs/ServiceDialog";
import BulkImportDialog from "../dialogs/BulkImportDialog";

const CoverageStatusChip = ({ status }) => {
  const colors = {
    COVERED: "success",
    PARTIAL: "warning",
    NOT_COVERED: "error",
  };
  return <Chip label={status} size="small" color={colors[status] || "default"} />;
};

const ServiceCoverageTab = ({ policy, categories, showSnackbar }) => {
  const { language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverageFilter, setCoverageFilter] = useState("ALL");
  const [selected, setSelected] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (policy?.id) {
      fetchServices();
    }
  }, [policy?.id, page, rowsPerPage, searchTerm, selectedCategory, coverageFilter]);

  const filteredServices = services.filter((service) => {
    if (coverageFilter === "ALL") return true;
    return service.coverageStatus === coverageFilter;
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        policyId: policy.id,
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("categoryId", selectedCategory);

      const res = await api.get(`/api/policy/services/paginated?${params}`);
      setServices(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(filteredServices.map((s) => s.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAddService = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm(language === "ar" ? "هل أنت متأكد من حذف هذه الخدمة؟" : "Are you sure you want to delete this service?")) {
      return;
    }
    try {
      await api.delete(`/api/policy/services/${id}`);
      showSnackbar(language === "ar" ? "تم حذف الخدمة بنجاح" : "Service deleted successfully", "success");
      fetchServices();
    } catch (err) {
      showSnackbar(language === "ar" ? "فشل حذف الخدمة" : "Failed to delete service", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(language === "ar" ? `هل أنت متأكد من حذف ${selected.length} خدمة؟` : `Are you sure you want to delete ${selected.length} services?`)) {
      return;
    }
    try {
      await api.post("/api/policy/services/bulk-delete", { serviceIds: selected });
      showSnackbar(language === "ar" ? "تم حذف الخدمات بنجاح" : "Services deleted successfully", "success");
      setSelected([]);
      fetchServices();
    } catch (err) {
      showSnackbar(language === "ar" ? "فشل حذف الخدمات" : "Failed to delete services", "error");
    }
    setAnchorEl(null);
  };

  const handleBulkStatusChange = async (isActive) => {
    if (selected.length === 0) return;
    try {
      await api.post("/api/policy/services/bulk-status", {
        serviceIds: selected,
        isActive,
      });
      showSnackbar(
        isActive
          ? (language === "ar" ? "تم تفعيل الخدمات" : "Services enabled")
          : (language === "ar" ? "تم تعطيل الخدمات" : "Services disabled"),
        "success"
      );
      setSelected([]);
      fetchServices();
    } catch (err) {
      showSnackbar(language === "ar" ? "فشل تحديث الحالة" : "Failed to update status", "error");
    }
    setAnchorEl(null);
  };

  const handleServiceSaved = () => {
    setDialogOpen(false);
    setEditingService(null);
    fetchServices();
    showSnackbar(
      editingService
        ? (language === "ar" ? "تم تحديث الخدمة بنجاح" : "Service updated successfully")
        : (language === "ar" ? "تم إضافة الخدمة بنجاح" : "Service added successfully"),
      "success"
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {language === "ar" ? "إدارة التغطية" : "Coverage Management"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => setBulkImportOpen(true)}
          >
            {language === "ar" ? "استيراد من ملف" : "Import from File"}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddService}
          >
            {language === "ar" ? "إضافة خدمة" : "Add Service"}
          </Button>
          {selected.length > 0 && (
            <>
              <Button
                variant="outlined"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                endIcon={<MoreVertIcon />}
              >
                {language === "ar" ? "إجراءات جماعية" : "Bulk Actions"} ({selected.length})
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => handleBulkStatusChange(true)}>
                  {language === "ar" ? "تفعيل المحدد" : "Enable Selected"}
                </MenuItem>
                <MenuItem onClick={() => handleBulkStatusChange(false)}>
                  {language === "ar" ? "تعطيل المحدد" : "Disable Selected"}
                </MenuItem>
                <MenuItem onClick={handleBulkDelete} sx={{ color: "error.main" }}>
                  {language === "ar" ? "حذف المحدد" : "Delete Selected"}
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {/* Coverage Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={coverageFilter}
          onChange={(e, val) => setCoverageFilter(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab value="ALL" label={language === "ar" ? "كل الخدمات" : "All Services"} />
          <Tab value="COVERED" label={language === "ar" ? "مغطى" : "Covered"} />
          <Tab value="PARTIAL" label={language === "ar" ? "جزئي" : "Partial"} />
          <Tab value="NOT_COVERED" label={language === "ar" ? "غير مغطى" : "Not Covered"} />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder={language === "ar" ? "بحث في الخدمات..." : "Search services..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{language === "ar" ? "الفئة" : "Category"}</InputLabel>
          <Select
            value={selectedCategory}
            label={language === "ar" ? "الفئة" : "Category"}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <MenuItem value="">{language === "ar" ? "كل الفئات" : "All Categories"}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper elevation={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.length === filteredServices.length && filteredServices.length > 0}
                        indeterminate={selected.length > 0 && selected.length < filteredServices.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{language === "ar" ? "اسم الخدمة" : "Service Name"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{language === "ar" ? "الفئة" : "Category"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{language === "ar" ? "التغطية" : "Coverage"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{language === "ar" ? "السعر" : "Price"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{language === "ar" ? "الحالة" : "Status"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{language === "ar" ? "الإجراءات" : "Actions"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow
                      key={service.id}
                      hover
                      selected={selected.includes(service.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(service.id)}
                          onChange={() => handleSelect(service.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {service.serviceName}
                        </Typography>
                        {service.medicalName && (
                          <Typography variant="caption" color="text.secondary">
                            {service.medicalName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.category ? (
                          <Chip
                            label={service.category.name}
                            size="small"
                            sx={{ backgroundColor: service.category.color, color: "#fff" }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold" color={
                            service.coveragePercent === 100 ? "success.main" :
                            service.coveragePercent >= 70 ? "warning.main" : "error.main"
                          }>
                            {service.coveragePercent}%
                          </Typography>
                          <CoverageStatusChip status={service.coverageStatus} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">₪{service.standardPrice}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={service.isActive ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "معطل" : "Inactive")}
                          size="small"
                          color={service.isActive ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditService(service)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteService(service.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredServices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {language === "ar" ? "لا توجد خدمات" : "No services found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage={language === "ar" ? "صفوف لكل صفحة:" : "Rows per page:"}
          />
        </>
      )}

      {/* Service Dialog */}
      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        service={editingService}
        policyId={policy?.id}
        categories={categories}
        onSaved={handleServiceSaved}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        policyId={policy?.id}
        categories={categories}
        onImported={() => {
          setBulkImportOpen(false);
          fetchServices();
          showSnackbar(language === "ar" ? "تم استيراد الخدمات بنجاح" : "Services imported successfully", "success");
        }}
      />
    </Box>
  );
};

export default ServiceCoverageTab;
