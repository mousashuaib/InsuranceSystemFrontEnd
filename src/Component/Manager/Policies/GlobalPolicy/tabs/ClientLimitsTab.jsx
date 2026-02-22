import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  InputAdornment,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";

const LimitCard = ({ title, icon, children }) => (
  <Paper sx={{ p: 3, height: "100%" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

const ClientLimitsTab = ({ policy, onUpdate, showSnackbar }) => {
  const { language } = useLanguage();
  const [limits, setLimits] = useState({
    maxVisitsPerMonth: "",
    maxVisitsPerYear: "",
    maxSpendingPerMonth: "",
    maxSpendingPerYear: "",
    annualDeductible: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (policy?.clientLimits) {
      setLimits({
        maxVisitsPerMonth: policy.clientLimits.maxVisitsPerMonth || "",
        maxVisitsPerYear: policy.clientLimits.maxVisitsPerYear || "",
        maxSpendingPerMonth: policy.clientLimits.maxSpendingPerMonth || "",
        maxSpendingPerYear: policy.clientLimits.maxSpendingPerYear || "",
        annualDeductible: policy.clientLimits.annualDeductible || "",
      });
    }
  }, [policy]);

  const handleChange = (field) => (e) => {
    const value = e.target.value === "" ? "" : Number(e.target.value);
    setLimits({ ...limits, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/api/policy/client-limits?policyId=${policy.id}`, limits);
      onUpdate({ ...policy, clientLimits: res });
      showSnackbar(
        language === "ar" ? "تم حفظ حدود العملاء بنجاح" : "Client limits saved successfully",
        "success"
      );
    } catch (err) {
      showSnackbar(
        language === "ar" ? "فشل حفظ حدود العملاء" : "Failed to save client limits",
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
          {language === "ar" ? "حدود العملاء" : "Client Limits"}
        </Typography>
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

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {language === "ar"
          ? "هذه الحدود تنطبق على جميع العملاء المشمولين بهذه البوليصة"
          : "These limits apply to all clients covered by this policy"}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Visit Limits */}
        <Grid item xs={12} md={6}>
          <LimitCard
            title={language === "ar" ? "حدود الزيارات" : "Visit Limits"}
            icon={<PersonIcon color="primary" />}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label={language === "ar" ? "الحد الأقصى للزيارات الشهرية" : "Max Visits Per Month"}
                  value={limits.maxVisitsPerMonth}
                  onChange={handleChange("maxVisitsPerMonth")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  helperText={language === "ar" ? "اتركه فارغاً للتحديد غير محدود" : "Leave empty for unlimited"}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label={language === "ar" ? "الحد الأقصى للزيارات السنوية" : "Max Visits Per Year"}
                  value={limits.maxVisitsPerYear}
                  onChange={handleChange("maxVisitsPerYear")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  helperText={language === "ar" ? "اتركه فارغاً للتحديد غير محدود" : "Leave empty for unlimited"}
                />
              </Grid>
            </Grid>
          </LimitCard>
        </Grid>

        {/* Spending Limits */}
        <Grid item xs={12} md={6}>
          <LimitCard
            title={language === "ar" ? "حدود الإنفاق" : "Spending Limits"}
            icon={<AttachMoneyIcon color="success" />}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label={language === "ar" ? "الحد الأقصى للإنفاق الشهري" : "Max Spending Per Month"}
                  value={limits.maxSpendingPerMonth}
                  onChange={handleChange("maxSpendingPerMonth")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₪</InputAdornment>
                    ),
                  }}
                  helperText={language === "ar" ? "اتركه فارغاً للتحديد غير محدود" : "Leave empty for unlimited"}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label={language === "ar" ? "الحد الأقصى للإنفاق السنوي" : "Max Spending Per Year"}
                  value={limits.maxSpendingPerYear}
                  onChange={handleChange("maxSpendingPerYear")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₪</InputAdornment>
                    ),
                  }}
                  helperText={language === "ar" ? "اتركه فارغاً للتحديد غير محدود" : "Leave empty for unlimited"}
                />
              </Grid>
            </Grid>
          </LimitCard>
        </Grid>

        {/* Deductible */}
        <Grid item xs={12} md={6}>
          <LimitCard
            title={language === "ar" ? "الخصم السنوي" : "Annual Deductible"}
            icon={<AttachMoneyIcon color="error" />}
          >
            <TextField
              fullWidth
              type="number"
              label={language === "ar" ? "مبلغ الخصم السنوي" : "Annual Deductible Amount"}
              value={limits.annualDeductible}
              onChange={handleChange("annualDeductible")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₪</InputAdornment>
                ),
              }}
              helperText={language === "ar"
                ? "المبلغ الذي يدفعه العميل قبل بدء التغطية"
                : "Amount client pays before coverage begins"}
            />
          </LimitCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClientLimitsTab;
