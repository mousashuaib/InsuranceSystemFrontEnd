import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CategoryIcon from "@mui/icons-material/Category";
import HistoryIcon from "@mui/icons-material/History";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";

import Header from "../../Header";
import Sidebar from "../../Sidebar";
import { api } from "../../../../utils/apiService";
import { useLanguage } from "../../../../context/LanguageContext";

import GeneralSettingsTab from "./tabs/GeneralSettingsTab";
import ClientLimitsTab from "./tabs/ClientLimitsTab";
import ServiceCoverageTab from "./tabs/ServiceCoverageTab";
import CategoriesTab from "./tabs/CategoriesTab";
import VersionHistoryTab from "./tabs/VersionHistoryTab";
import ReportsTab from "./tabs/ReportsTab";

const PolicyManagement = () => {
  const { language, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const tabs = [
    { label: language === "ar" ? "الإعدادات العامة" : "General Settings", icon: <SettingsIcon /> },
    { label: language === "ar" ? "حدود العملاء" : "Client Limits", icon: <PersonIcon /> },
    { label: language === "ar" ? "تغطية الخدمات" : "Service Coverage", icon: <MedicalServicesIcon /> },
    { label: language === "ar" ? "الفئات" : "Categories", icon: <CategoryIcon /> },
    { label: language === "ar" ? "التقارير" : "Reports", icon: <AssessmentIcon /> },
    { label: language === "ar" ? "سجل الإصدارات" : "Version History", icon: <HistoryIcon /> },
  ];

  useEffect(() => {
    fetchPolicy();
    fetchCategories();
  }, []);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      // Try to get active policy first, then draft
      let res;
      try {
        res = await api.get("/api/policy");
      } catch {
        try {
          res = await api.get("/api/policy/draft");
        } catch {
          res = null;
        }
      }
      setPolicy(res);
    } catch (err) {
      console.error("Failed to fetch policy:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/policy/categories");
      setCategories(res || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const newPolicy = await api.post("/api/policy", {
        name: language === "ar" ? "بوليصة تأمين جديدة" : "New Insurance Policy",
        version: "v1.0",
        description: "",
        effectiveFrom: new Date().toISOString().split("T")[0],
      });
      setPolicy(newPolicy);
      showSnackbar(language === "ar" ? "تم إنشاء البوليصة بنجاح" : "Policy created successfully", "success");
    } catch (err) {
      showSnackbar(language === "ar" ? "فشل إنشاء البوليصة" : "Failed to create policy", "error");
    }
  };

  const handleActivatePolicy = async () => {
    if (!policy || policy.status === "ACTIVE") return;

    const confirmMsg = language === "ar"
      ? "هل أنت متأكد من تفعيل هذه البوليصة؟ سيتم إلغاء تفعيل البوليصة الحالية."
      : "Are you sure you want to activate this policy? The current active policy will be deactivated.";

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post(`/api/policy/${policy.id}/activate`, {
        reason: "Manual activation",
      });
      setPolicy(res);
      showSnackbar(language === "ar" ? "تم تفعيل البوليصة بنجاح" : "Policy activated successfully", "success");
    } catch (err) {
      showSnackbar(language === "ar" ? "فشل تفعيل البوليصة" : "Failed to activate policy", "error");
    }
  };

  const handleUpdatePolicy = (updatedPolicy) => {
    setPolicy(updatedPolicy);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const renderTabContent = () => {
    if (!policy) return null;

    switch (activeTab) {
      case 0:
        return (
          <GeneralSettingsTab
            policy={policy}
            onUpdate={handleUpdatePolicy}
            showSnackbar={showSnackbar}
          />
        );
      case 1:
        return (
          <ClientLimitsTab
            policy={policy}
            onUpdate={handleUpdatePolicy}
            showSnackbar={showSnackbar}
          />
        );
      case 2:
        return (
          <ServiceCoverageTab
            policy={policy}
            categories={categories}
            showSnackbar={showSnackbar}
          />
        );
      case 3:
        return (
          <CategoriesTab
            categories={categories}
            policyId={policy?.id}
            onUpdate={fetchCategories}
            showSnackbar={showSnackbar}
          />
        );
      case 4:
        return (
          <ReportsTab
            policy={policy}
            showSnackbar={showSnackbar}
          />
        );
      case 5:
        return (
          <VersionHistoryTab
            policy={policy}
            showSnackbar={showSnackbar}
          />
        );
      default:
        return null;
    }
  };

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
          {/* Header Section */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#120460" }}>
                {language === "ar" ? "إدارة البوليصة العامة" : "Global Policy Management"}
              </Typography>
              {policy && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {policy.name} - {policy.version}
                  </Typography>
                  <Chip
                    label={policy.status}
                    size="small"
                    color={policy.status === "ACTIVE" ? "success" : policy.status === "DRAFT" ? "warning" : "default"}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              {!policy && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreatePolicy}
                  sx={{ borderRadius: 2 }}
                >
                  {language === "ar" ? "إنشاء بوليصة" : "Create Policy"}
                </Button>
              )}
              {policy && policy.status === "DRAFT" && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleActivatePolicy}
                  sx={{ borderRadius: 2 }}
                >
                  {language === "ar" ? "تفعيل البوليصة" : "Activate Policy"}
                </Button>
              )}
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : !policy ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {language === "ar" ? "لا توجد بوليصة حالياً" : "No policy exists yet"}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreatePolicy}
              >
                {language === "ar" ? "إنشاء بوليصة جديدة" : "Create New Policy"}
              </Button>
            </Paper>
          ) : (
            <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  backgroundColor: "#fafafa",
                }}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    label={tab.label}
                    icon={tab.icon}
                    iconPosition="start"
                    sx={{ minHeight: 64 }}
                  />
                ))}
              </Tabs>

              {/* Tab Content */}
              <Box sx={{ p: 3 }}>
                {renderTabContent()}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PolicyManagement;
