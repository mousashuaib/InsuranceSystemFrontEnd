import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";

const GeneralSettingsTab = ({ policy, onUpdate, showSnackbar }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: policy?.name || "",
    version: policy?.version || "",
    description: policy?.description || "",
    effectiveFrom: policy?.effectiveFrom || "",
    effectiveTo: policy?.effectiveTo || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/api/policy/${policy.id}`, formData);
      onUpdate(res);
      showSnackbar(
        language === "ar" ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully",
        "success"
      );
    } catch (err) {
      showSnackbar(
        language === "ar" ? "فشل حفظ الإعدادات" : "Failed to save settings",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          {language === "ar" ? "الإعدادات العامة" : "General Settings"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label={policy.status}
            color={policy.status === "ACTIVE" ? "success" : policy.status === "DRAFT" ? "warning" : "default"}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
              : (language === "ar" ? "حفظ التغييرات" : "Save Changes")}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={language === "ar" ? "اسم البوليصة" : "Policy Name"}
            value={formData.name}
            onChange={handleChange("name")}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={language === "ar" ? "الإصدار" : "Version"}
            value={formData.version}
            onChange={handleChange("version")}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label={language === "ar" ? "الوصف" : "Description"}
            value={formData.description}
            onChange={handleChange("description")}
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label={language === "ar" ? "تاريخ البداية" : "Effective From"}
            value={formData.effectiveFrom}
            onChange={handleChange("effectiveFrom")}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label={language === "ar" ? "تاريخ الانتهاء" : "Effective To"}
            value={formData.effectiveTo || ""}
            onChange={handleChange("effectiveTo")}
            InputLabelProps={{ shrink: true }}
            helperText={language === "ar" ? "اتركه فارغاً للبوليصة المفتوحة" : "Leave empty for open-ended policy"}
          />
        </Grid>
      </Grid>

      {/* Summary Stats */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          {language === "ar" ? "ملخص البوليصة" : "Policy Summary"}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {language === "ar" ? "عدد الخدمات" : "Services Count"}
            </Typography>
            <Typography variant="h6">{policy.servicesCount || 0}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {language === "ar" ? "عدد الفئات" : "Categories Count"}
            </Typography>
            <Typography variant="h6">{policy.categoriesCount || 0}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {language === "ar" ? "تاريخ الإنشاء" : "Created At"}
            </Typography>
            <Typography variant="body1">
              {policy.createdAt ? new Date(policy.createdAt).toLocaleDateString() : "-"}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {language === "ar" ? "آخر تحديث" : "Last Updated"}
            </Typography>
            <Typography variant="body1">
              {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : "-"}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default GeneralSettingsTab;
