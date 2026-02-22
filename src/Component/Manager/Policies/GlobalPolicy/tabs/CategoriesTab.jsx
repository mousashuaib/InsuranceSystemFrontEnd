import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Collapse,
  InputAdornment,
  Divider,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import * as MuiIcons from "@mui/icons-material";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";

const CategoryCard = ({ category, limits, onEdit, onDelete, onEditLimits }) => {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const IconComponent = MuiIcons[category.icon] || MuiIcons.Category;

  const hasLimits = limits && (limits.maxVisitsPerMonth || limits.maxVisitsPerYear ||
                               limits.maxSpendingPerMonth || limits.maxSpendingPerYear);

  return (
    <Paper
      sx={{
        p: 2,
        opacity: category.isActive ? 1 : 0.6,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: category.color || "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent sx={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {category.name}
            </Typography>
            {category.nameAr && (
              <Typography variant="body2" color="text.secondary">
                {category.nameAr}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {!category.isActive && (
            <Chip
              label={language === "ar" ? "معطل" : "Disabled"}
              size="small"
              color="default"
            />
          )}
          {hasLimits && (
            <Tooltip title={language === "ar" ? "حدود مُحددة" : "Limits configured"}>
              <Chip
                icon={<MonetizationOnIcon />}
                label={language === "ar" ? "محدود" : "Limited"}
                size="small"
                color="info"
              />
            </Tooltip>
          )}
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(category)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(category.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          {language === "ar" ? "حدود الفئة" : "Category Limits"}
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <EventRepeatIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {language === "ar" ? "زيارات/شهر:" : "Visits/Month:"}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {limits?.maxVisitsPerMonth || "∞"}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <EventRepeatIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {language === "ar" ? "زيارات/سنة:" : "Visits/Year:"}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {limits?.maxVisitsPerYear || "∞"}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MonetizationOnIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {language === "ar" ? "إنفاق/شهر:" : "Spending/Month:"}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {limits?.maxSpendingPerMonth ? `₪${limits.maxSpendingPerMonth}` : "∞"}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MonetizationOnIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {language === "ar" ? "إنفاق/سنة:" : "Spending/Year:"}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {limits?.maxSpendingPerYear ? `₪${limits.maxSpendingPerYear}` : "∞"}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onEditLimits(category, limits)}
          sx={{ mt: 1 }}
        >
          {language === "ar" ? "تعديل الحدود" : "Edit Limits"}
        </Button>
      </Collapse>
    </Paper>
  );
};

const CategoriesTab = ({ categories, policyId, onUpdate, showSnackbar }) => {
  const { language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [limitsDialogOpen, setLimitsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLimits, setEditingLimits] = useState(null);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    icon: "Category",
    color: "#4CAF50",
    isActive: true,
    displayOrder: 0,
  });
  const [limitsFormData, setLimitsFormData] = useState({
    maxVisitsPerMonth: "",
    maxVisitsPerYear: "",
    maxSpendingPerMonth: "",
    maxSpendingPerYear: "",
  });

  useEffect(() => {
    if (policyId) {
      fetchCategoryLimits();
    }
  }, [policyId]);

  const fetchCategoryLimits = async () => {
    try {
      const limits = await api.get(`/api/policy/category-limits?policyId=${policyId}`);
      const limitsMap = {};
      limits.forEach(limit => {
        limitsMap[limit.categoryId] = limit;
      });
      setCategoryLimits(limitsMap);
    } catch (err) {
      console.error("Failed to fetch category limits:", err);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        nameAr: category.nameAr || "",
        description: category.description || "",
        icon: category.icon || "Category",
        color: category.color || "#4CAF50",
        isActive: category.isActive !== false,
        displayOrder: category.displayOrder || 0,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        icon: "Category",
        color: "#4CAF50",
        isActive: true,
        displayOrder: categories.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await api.patch(`/api/policy/categories/${editingCategory.id}`, formData);
        showSnackbar(
          language === "ar" ? "تم تحديث الفئة بنجاح" : "Category updated successfully",
          "success"
        );
      } else {
        await api.post("/api/policy/categories", formData);
        showSnackbar(
          language === "ar" ? "تم إضافة الفئة بنجاح" : "Category added successfully",
          "success"
        );
      }
      handleCloseDialog();
      onUpdate();
    } catch (err) {
      showSnackbar(
        language === "ar" ? "فشل حفظ الفئة" : "Failed to save category",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === "ar" ? "هل أنت متأكد من حذف هذه الفئة؟" : "Are you sure you want to delete this category?")) {
      return;
    }
    try {
      await api.delete(`/api/policy/categories/${id}`);
      showSnackbar(
        language === "ar" ? "تم حذف الفئة بنجاح" : "Category deleted successfully",
        "success"
      );
      onUpdate();
    } catch (err) {
      showSnackbar(
        language === "ar" ? "فشل حذف الفئة" : "Failed to delete category",
        "error"
      );
    }
  };

  const handleOpenLimitsDialog = (category, limits) => {
    setEditingLimits({ category, limits });
    setLimitsFormData({
      maxVisitsPerMonth: limits?.maxVisitsPerMonth || "",
      maxVisitsPerYear: limits?.maxVisitsPerYear || "",
      maxSpendingPerMonth: limits?.maxSpendingPerMonth || "",
      maxSpendingPerYear: limits?.maxSpendingPerYear || "",
    });
    setLimitsDialogOpen(true);
  };

  const handleCloseLimitsDialog = () => {
    setLimitsDialogOpen(false);
    setEditingLimits(null);
  };

  const handleLimitsChange = (field) => (e) => {
    setLimitsFormData({ ...limitsFormData, [field]: e.target.value });
  };

  const handleSaveLimits = async () => {
    try {
      const payload = {
        maxVisitsPerMonth: limitsFormData.maxVisitsPerMonth || null,
        maxVisitsPerYear: limitsFormData.maxVisitsPerYear || null,
        maxSpendingPerMonth: limitsFormData.maxSpendingPerMonth || null,
        maxSpendingPerYear: limitsFormData.maxSpendingPerYear || null,
      };
      await api.patch(
        `/api/policy/category-limits/${editingLimits.category.id}?policyId=${policyId}`,
        payload
      );
      showSnackbar(
        language === "ar" ? "تم تحديث حدود الفئة بنجاح" : "Category limits updated successfully",
        "success"
      );
      handleCloseLimitsDialog();
      fetchCategoryLimits();
    } catch (err) {
      showSnackbar(
        language === "ar" ? "فشل تحديث الحدود" : "Failed to update limits",
        "error"
      );
    }
  };

  const iconOptions = [
    "LocalHospital", "LocalPharmacy", "Science", "MonitorHeart",
    "Emergency", "MedicalServices", "Visibility", "Category",
    "HealthAndSafety", "Vaccines", "Biotech", "Psychology",
  ];

  const colorOptions = [
    "#4CAF50", "#2196F3", "#9C27B0", "#FF9800",
    "#F44336", "#00BCD4", "#607D8B", "#E91E63",
    "#3F51B5", "#009688", "#795548", "#FF5722",
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          {language === "ar" ? "فئات الخدمات" : "Service Categories"}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {language === "ar" ? "إضافة فئة" : "Add Category"}
        </Button>
      </Box>

      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <CategoryCard
              category={category}
              limits={categoryLimits[category.id]}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onEditLimits={handleOpenLimitsDialog}
            />
          </Grid>
        ))}
        {categories.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center">
              {language === "ar" ? "لا توجد فئات" : "No categories found"}
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory
            ? (language === "ar" ? "تعديل الفئة" : "Edit Category")
            : (language === "ar" ? "إضافة فئة جديدة" : "Add New Category")}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={language === "ar" ? "الاسم (بالإنجليزية)" : "Name (English)"}
                value={formData.name}
                onChange={handleChange("name")}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={language === "ar" ? "الاسم (بالعربية)" : "Name (Arabic)"}
                value={formData.nameAr}
                onChange={handleChange("nameAr")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={language === "ar" ? "الوصف" : "Description"}
                value={formData.description}
                onChange={handleChange("description")}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {language === "ar" ? "الأيقونة" : "Icon"}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {iconOptions.map((iconName) => {
                  const Icon = MuiIcons[iconName];
                  return (
                    <IconButton
                      key={iconName}
                      onClick={() => setFormData({ ...formData, icon: iconName })}
                      sx={{
                        border: formData.icon === iconName ? "2px solid" : "1px solid #ddd",
                        borderColor: formData.icon === iconName ? "primary.main" : "#ddd",
                      }}
                    >
                      <Icon />
                    </IconButton>
                  );
                })}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {language === "ar" ? "اللون" : "Color"}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {colorOptions.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      backgroundColor: color,
                      cursor: "pointer",
                      border: formData.color === color ? "3px solid #000" : "none",
                    }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange("isActive")}
                  />
                }
                label={language === "ar" ? "مفعّل" : "Active"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {language === "ar" ? "حفظ" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Limits Dialog */}
      <Dialog open={limitsDialogOpen} onClose={handleCloseLimitsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {language === "ar" ? "تعديل حدود الفئة" : "Edit Category Limits"}
          {editingLimits && (
            <Typography variant="subtitle2" color="text.secondary">
              {editingLimits.category.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {language === "ar"
              ? "حدد الحدود القصوى للزيارات والإنفاق لهذه الفئة. اتركها فارغة للسماح بغير محدود."
              : "Set maximum limits for visits and spending for this category. Leave empty for unlimited."}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                {language === "ar" ? "حدود الزيارات" : "Visit Limits"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={language === "ar" ? "الحد الأقصى للزيارات/شهر" : "Max Visits/Month"}
                value={limitsFormData.maxVisitsPerMonth}
                onChange={handleLimitsChange("maxVisitsPerMonth")}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EventRepeatIcon /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={language === "ar" ? "الحد الأقصى للزيارات/سنة" : "Max Visits/Year"}
                value={limitsFormData.maxVisitsPerYear}
                onChange={handleLimitsChange("maxVisitsPerYear")}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EventRepeatIcon /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                {language === "ar" ? "حدود الإنفاق" : "Spending Limits"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={language === "ar" ? "الحد الأقصى للإنفاق/شهر" : "Max Spending/Month"}
                value={limitsFormData.maxSpendingPerMonth}
                onChange={handleLimitsChange("maxSpendingPerMonth")}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={language === "ar" ? "الحد الأقصى للإنفاق/سنة" : "Max Spending/Year"}
                value={limitsFormData.maxSpendingPerYear}
                onChange={handleLimitsChange("maxSpendingPerYear")}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLimitsDialog}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="contained" onClick={handleSaveLimits}>
            {language === "ar" ? "حفظ الحدود" : "Save Limits"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesTab;
