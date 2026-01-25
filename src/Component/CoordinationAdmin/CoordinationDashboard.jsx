import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";

import CoordinationSidebar from "./CoordinationSidebar";
import CoordinationHeader from "./CoordinationHeader";
import HealthcareProvidersMapOnly from "../Shared/HealthcareProvidersMapOnly";
import HealthcareProvidersFilter from "../Shared/HealthcareProvidersFilter";

import { api } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import logger from "../../utils/logger";

const CoordinationDashboard = () => {
  const { language, isRTL } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [providerFilter, setProviderFilter] = useState("ALL");

  // ===============================
  // FETCH PROVIDERS FOR MAP
  // ===============================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch providers for map - api.get returns response.data directly
        const providersData = await api.get(API_ENDPOINTS.SEARCH_PROFILES.APPROVED);
        const withLocations = (providersData || []).filter(
          (p) => p.locationLat && p.locationLng
        );
        setProviders(withLocations);
      } catch (e) {
        logger.error("Dashboard error", e);
      }
    };

    fetchData();
  }, []);


  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <CoordinationSidebar />

      <Box
        sx={{
          flexGrow: 1,
          background: "linear-gradient(180deg, #FAF8F5, #F5F3EE)",
          minHeight: "100vh",
          ml: isRTL ? 0 : "240px",
          mr: isRTL ? "240px" : 0,
        }}
      >
        <CoordinationHeader />

        <Box sx={{ p: 4 }}>
          {/* Filter */}
          <HealthcareProvidersFilter 
            providers={providers}
            providerFilter={providerFilter}
            setProviderFilter={setProviderFilter}
          />

          {/* 🗺️ Healthcare Providers Map */}
          <Box sx={{ mt: 4 }}>
            <HealthcareProvidersMapOnly 
              filteredProviders={providers.filter(p => 
                providerFilter === "ALL" || p.type === providerFilter
              )}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CoordinationDashboard;
