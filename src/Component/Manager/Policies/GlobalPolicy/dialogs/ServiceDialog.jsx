import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Typography,
  Divider,
} from "@mui/material";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";

const ServiceDialog = ({ open, onClose, service, policyId, categories, onSaved }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    serviceName: "",
    medicalName: "",
    description: "",
    categoryId: "",
    coverageStatus: "COVERED",
    coveragePercent: 100,
    standardPrice: 0,
    maxCoverageAmount: "",
    minAge: "",
    maxAge: "",
    allowedGender: "ALL",
    requiresReferral: false,
    frequencyLimit: "",
    frequencyPeriod: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (service) {
      setFormData({
        serviceName: service.serviceName || "",
        medicalName: service.medicalName || "",
        description: service.description || "",
        categoryId: service.category?.id || "",
        coverageStatus: service.coverageStatus || "COVERED",
        coveragePercent: service.coveragePercent || 100,
        standardPrice: service.standardPrice || 0,
        maxCoverageAmount: service.maxCoverageAmount || "",
        minAge: service.minAge || "",
        maxAge: service.maxAge || "",
        allowedGender: service.allowedGender || "ALL",
        requiresReferral: service.requiresReferral || false,
        frequencyLimit: service.frequencyLimit || "",
        frequencyPeriod: service.frequencyPeriod || "",
        isActive: service.isActive !== false,
      });
    } else {
      setFormData({
        serviceName: "",
        medicalName: "",
        description: "",
        categoryId: "",
        coverageStatus: "COVERED",
        coveragePercent: 100,
        standardPrice: 0,
        maxCoverageAmount: "",
        minAge: "",
        maxAge: "",
        allowedGender: "ALL",
        requiresReferral: false,
        frequencyLimit: "",
        frequencyPeriod: "",
        isActive: true,
      });
    }
    setErrors({});
  }, [service, open]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.serviceName.trim()) {
      newErrors.serviceName = language === "ar" ? "اسم الخدمة مطلوب" : "Service name is required";
    }
    if (formData.standardPrice <= 0) {
      newErrors.standardPrice = language === "ar" ? "السعر يجب أن يكون أكبر من صفر" : "Price must be greater than 0";
    }
    if (formData.coveragePercent < 0 || formData.coveragePercent > 100) {
      newErrors.coveragePercent = language === "ar" ? "النسبة يجب أن تكون بين 0 و 100" : "Percentage must be between 0 and 100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        policyId,
        categoryId: formData.categoryId || null,
        maxCoverageAmount: formData.maxCoverageAmount || null,
        minAge: formData.minAge || null,
        maxAge: formData.maxAge || null,
        frequencyLimit: formData.frequencyLimit || null,
        frequencyPeriod: formData.frequencyPeriod || null,
      };

      if (service?.id) {
        await api.patch(`/api/policy/services/${service.id}`, payload);
      } else {
        await api.post("/api/policy/services", payload);
      }
      onSaved();
    } catch (err) {
      console.error("Failed to save service:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {service
          ? (language === "ar" ? "تعديل الخدمة" : "Edit Service")
          : (language === "ar" ? "إضافة خدمة جديدة" : "Add New Service")}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Basic Info */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              {language === "ar" ? "المعلومات الأساسية" : "Basic Information"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={language === "ar" ? "اسم الخدمة" : "Service Name"}
              value={formData.serviceName}
              onChange={handleChange("serviceName")}
              error={!!errors.serviceName}
              helperText={errors.serviceName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={language === "ar" ? "الاسم الطبي" : "Medical Name"}
              value={formData.medicalName}
              onChange={handleChange("medicalName")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{language === "ar" ? "الفئة" : "Category"}</InputLabel>
              <Select
                value={formData.categoryId}
                onChange={handleChange("categoryId")}
                label={language === "ar" ? "الفئة" : "Category"}
              >
                <MenuItem value="">{language === "ar" ? "بدون فئة" : "No Category"}</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
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

          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

          {/* Coverage Rules */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              {language === "ar" ? "قواعد التغطية" : "Coverage Rules"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{language === "ar" ? "حالة التغطية" : "Coverage Status"}</InputLabel>
              <Select
                value={formData.coverageStatus}
                onChange={handleChange("coverageStatus")}
                label={language === "ar" ? "حالة التغطية" : "Coverage Status"}
              >
                <MenuItem value="COVERED">{language === "ar" ? "مغطى" : "Covered"}</MenuItem>
                <MenuItem value="PARTIAL">{language === "ar" ? "جزئي" : "Partial"}</MenuItem>
                <MenuItem value="NOT_COVERED">{language === "ar" ? "غير مغطى" : "Not Covered"}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={language === "ar" ? "نسبة التغطية %" : "Coverage %"}
              value={formData.coveragePercent}
              onChange={handleChange("coveragePercent")}
              error={!!errors.coveragePercent}
              helperText={errors.coveragePercent}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={language === "ar" ? "السعر القياسي" : "Standard Price"}
              value={formData.standardPrice}
              onChange={handleChange("standardPrice")}
              error={!!errors.standardPrice}
              helperText={errors.standardPrice}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">₪</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label={language === "ar" ? "الحد الأقصى للتغطية" : "Max Coverage Amount"}
              value={formData.maxCoverageAmount}
              onChange={handleChange("maxCoverageAmount")}
              InputProps={{
                startAdornment: <InputAdornment position="start">₪</InputAdornment>,
              }}
              helperText={language === "ar" ? "اتركه فارغاً لعدم التحديد" : "Leave empty for no limit"}
            />
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

          {/* Restrictions */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              {language === "ar" ? "القيود" : "Restrictions"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={language === "ar" ? "الحد الأدنى للعمر" : "Min Age"}
              value={formData.minAge}
              onChange={handleChange("minAge")}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={language === "ar" ? "الحد الأقصى للعمر" : "Max Age"}
              value={formData.maxAge}
              onChange={handleChange("maxAge")}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{language === "ar" ? "الجنس المسموح" : "Allowed Gender"}</InputLabel>
              <Select
                value={formData.allowedGender}
                onChange={handleChange("allowedGender")}
                label={language === "ar" ? "الجنس المسموح" : "Allowed Gender"}
              >
                <MenuItem value="ALL">{language === "ar" ? "الجميع" : "All"}</MenuItem>
                <MenuItem value="MALE">{language === "ar" ? "ذكر" : "Male"}</MenuItem>
                <MenuItem value="FEMALE">{language === "ar" ? "أنثى" : "Female"}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.requiresReferral}
                  onChange={handleChange("requiresReferral")}
                />
              }
              label={language === "ar" ? "يتطلب تحويل" : "Requires Referral"}
            />
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

          {/* Usage Limits */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              {language === "ar" ? "حدود الاستخدام" : "Usage Limits"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label={language === "ar" ? "حد التكرار" : "Frequency Limit"}
              value={formData.frequencyLimit}
              onChange={handleChange("frequencyLimit")}
              helperText={language === "ar" ? "عدد المرات المسموح بها" : "Number of times allowed"}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{language === "ar" ? "فترة التكرار" : "Frequency Period"}</InputLabel>
              <Select
                value={formData.frequencyPeriod}
                onChange={handleChange("frequencyPeriod")}
                label={language === "ar" ? "فترة التكرار" : "Frequency Period"}
              >
                <MenuItem value="">{language === "ar" ? "غير محدد" : "Not Set"}</MenuItem>
                <MenuItem value="DAILY">{language === "ar" ? "يومياً" : "Daily"}</MenuItem>
                <MenuItem value="WEEKLY">{language === "ar" ? "أسبوعياً" : "Weekly"}</MenuItem>
                <MenuItem value="MONTHLY">{language === "ar" ? "شهرياً" : "Monthly"}</MenuItem>
                <MenuItem value="YEARLY">{language === "ar" ? "سنوياً" : "Yearly"}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {language === "ar" ? "إلغاء" : "Cancel"}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving
            ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
            : (language === "ar" ? "حفظ" : "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceDialog;
