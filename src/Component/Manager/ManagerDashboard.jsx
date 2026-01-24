import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import PolicyIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Sidebar from "./Sidebar";
import Header from "./Header";
import HealthcareProvidersFilter from "../Shared/HealthcareProvidersFilter";
import HealthcareProvidersMapOnly from "../Shared/HealthcareProvidersMapOnly";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import logger from "../../utils/logger";

// Memoized StatCard component for performance
const StatCard = memo(function StatCard({ icon, title, value, gradient }) {
  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 5,
        textAlign: "center",
        background: gradient,
        color: "#fff",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        "&:hover": { transform: "scale(1.05)" },
      }}
    >
      {icon}
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h3" fontWeight="bold">
        {value}
      </Typography>
    </Paper>
  );
});

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  gradient: PropTypes.string.isRequired,
};

const ManagerDashboard = () => {
  const { language, isRTL } = useLanguage();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPolicies: 0,
    pendingClaims: 0,
  });

  // Healthcare Providers
  const [providers, setProviders] = useState([]);
  const [providerFilter, setProviderFilter] = useState("ALL");

  // ✅ Fetch Healthcare Providers
  const fetchProviders = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await api.get(API_ENDPOINTS.SEARCH_PROFILES.APPROVED);
      const withLocations = (res || []).filter(
        (p) => p.locationLat && p.locationLng
      );
      setProviders(withLocations);
    } catch (err) {
      logger.error("Failed to fetch providers:", err);
    }
  }, []);

  // جلب الإحصائيات
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        logger.warn("No token found, skipping stats fetch");
        return;
      }

      const res = await api.get(API_ENDPOINTS.DASHBOARD.MANAGER_STATS);
      // api.get already returns response.data, so use res directly
      if (res) {
        setStats({
          totalClients: res.totalClients ?? 0,
          totalPolicies: res.totalPolicies ?? 0,
          pendingClaims: res.pendingClaims ?? 0,
        });
      }
    } catch (err) {
      logger.error("Failed to fetch dashboard stats:", err);
      // Keep default values on error
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchProviders();
  }, [fetchStats, fetchProviders]);

  // Memoize filtered providers to avoid recalculation on every render
  const filteredProviders = useMemo(() => {
    return providerFilter === "ALL"
      ? providers
      : providers.filter(p => p.type === providerFilter);
  }, [providers, providerFilter]);

  // Memoize stat cards configuration
  const statCards = useMemo(() => [
    {
      icon: <PeopleIcon sx={{ fontSize: 55, mb: 1 }} />,
      title: t("totalClients", language),
      value: stats.totalClients,
      gradient: "linear-gradient(135deg, #556B2F 0%, #7B8B5E 100%)",
    },
    {
      icon: <PolicyIcon sx={{ fontSize: 55, mb: 1 }} />,
      title: t("totalPolicies", language),
      value: stats.totalPolicies,
      gradient: "linear-gradient(135deg, #8B9A46 0%, #A8B56B 100%)",
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 55, mb: 1 }} />,
      title: t("pendingClaimsLabel", language),
      value: stats.pendingClaims,
      gradient: "linear-gradient(135deg, #C9A646 0%, #DDB85C 100%)",
    },
  ], [stats.totalClients, stats.totalPolicies, stats.pendingClaims, language]);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        dir={isRTL ? "rtl" : "ltr"}
        sx={{
          flexGrow: 1,
          background: "#FAF8F5",
          minHeight: "100vh",
          marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
          marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
          pt: { xs: "56px", sm: 0 },
          transition: "margin 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        {/* 1 Filter Buttons */}
        <Box sx={{ mt: 3, px: 3 }}>
          <HealthcareProvidersFilter
            providers={providers}
            providerFilter={providerFilter}
            setProviderFilter={setProviderFilter}
          />
        </Box>

        {/* 2 Stats Cards */}
        <Box
          dir={isRTL ? "rtl" : "ltr"}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {t("mainDashboardTitle", language)}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t("welcomeManagerDashboard", language)}
          </Typography>

          <Grid container spacing={4} justifyContent="center" sx={{ mt: 3 }}>
            {statCards.map((card, index) => (
              <Grid item xs={12} md={3} key={index}>
                <StatCard
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  gradient={card.gradient}
                />
              </Grid>
            ))}
          </Grid>

          {/* 3 Map */}
          <Box sx={{ mt: 4, width: "100%" }}>
            <HealthcareProvidersMapOnly
              filteredProviders={filteredProviders}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ManagerDashboard;
