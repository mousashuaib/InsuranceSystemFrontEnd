import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import BlockIcon from "@mui/icons-material/Block";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import EmergencySidebar from "./EmergencySidebar";
import EmergencyHeader from "./EmergencyHeader";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const EmergencyDashboard = () => {
  const { language, isRTL } = useLanguage();
  const [stats, setStats] = useState({
    pendingEmergencies: 0,
    approvedEmergencies: 0,
    rejectedEmergencies: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      // api.get returns response.data directly
      const data = await api.get(API_ENDPOINTS.EMERGENCIES.ALL) || [];
      setStats({
        pendingEmergencies: data.filter((r) => r.status === "PENDING").length,
        approvedEmergencies: data.filter((r) => r.status === "APPROVED").length,
        rejectedEmergencies: data.filter((r) => r.status === "REJECTED").length,
      });
    } catch (err) {
      console.error("Failed to fetch emergency stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      // api.get returns response.data directly
      const searchResults = await api.get(`${API_ENDPOINTS.SEARCH_PROFILES.BY_NAME}?name=${value}`);
      setResults(searchResults || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🏥 أيقونات البحث
  const getTypeIcon = (type) => {
    switch (type) {
      case "CLINIC":
        return <LocalHospitalIcon sx={{ fontSize: 40, color: "#1976d2" }} />;
      case "PHARMACY":
        return <LocalPharmacyIcon sx={{ fontSize: 40, color: "#2e7d32" }} />;
      case "LAB":
        return <ScienceIcon sx={{ fontSize: 40, color: "#d32f2f" }} />;
      default:
        return <SearchIcon sx={{ fontSize: 40, color: "#555" }} />;
    }
  };

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <EmergencySidebar />
      <Box
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
        <EmergencyHeader />

        {/* Search Bar */}
        <Box
          sx={{
            px: 3,
            py: 5,
            background: "linear-gradient(90deg, #556B2F, #7B8B5E)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <TextField
            placeholder={t("searchForProvider", language)}
            variant="outlined"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#556B2F" }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <IconButton onClick={() => handleSearch("")}>
                  <CloseIcon />
                </IconButton>
              ),
            }}
            sx={{
              maxWidth: 650,
              backgroundColor: "#fff",
              borderRadius: 3,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                fontSize: "1rem",
              },
            }}
          />
        </Box>

        {/* ✅ Search Results */}
        {searchTerm && (
          <Box sx={{ p: 4 }}>
            {loading ? (
              <Box sx={{ textAlign: "center", mt: 5 }}>
                <CircularProgress />
              </Box>
            ) : results.length > 0 ? (
              <>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {t("searchResults", language)}
                </Typography>
                <Grid container spacing={3}>
                  {results.map((profile) => (
                    <Grid item xs={12} md={6} lg={4} key={profile.id}>
                      <Paper
                        sx={{
                          p: 3,
                          borderRadius: 4,
                          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                          transition: "0.3s",
                          "&:hover": {
                            transform: "scale(1.05)",
                            boxShadow: "0 12px 25px rgba(0,0,0,0.25)",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          {getTypeIcon(profile.type)}
                          <Typography variant="h6" fontWeight="bold" sx={{ ml: 2 }}>
                            {profile.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          <b>{t("type", language)}:</b> {profile.type}
                        </Typography>
                        <Typography variant="body2">
                          <b>{t("address", language)}:</b> {profile.address}
                        </Typography>
                        <Typography variant="body2">
                          <b>{t("contact", language)}:</b> {profile.contactInfo}
                        </Typography>
                        <Typography variant="body2">
                          <b>{t("owner", language)}:</b> {profile.ownerName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {profile.description}
                        </Typography>

                        {/* On Map Button */}
                        {profile.locationLat && profile.locationLng && (
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              mt: 2,
                              backgroundColor: "#2e7d32",
                              color: "#fff",
                              fontWeight: "bold",
                              textTransform: "none",
                              "&:hover": { backgroundColor: "#1b5e20" },
                            }}
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps?q=${profile.locationLat},${profile.locationLng}`,
                                "_blank"
                              )
                            }
                          >
                            {t("onMap", language)}
                          </Button>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
                sx={{ mt: 3 }}
              >
                {t("noResultsFor", language)} "{searchTerm}"
              </Typography>
            )}
          </Box>
        )}

        {/* Dashboard (when no search) */}
        {!searchTerm && (
          <Box
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
              {t("emergencyManagerDashboard", language)}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {t("welcomeEmergencyManager", language)}
            </Typography>

            <Grid container spacing={4} justifyContent="center" sx={{ mt: 3 }}>
              {/* Pending Requests */}
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 5,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #556B2F 0%, #7B8B5E 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                    "&:hover": { transform: "scale(1.05)" },
                  }}
                >
                  <WarningIcon sx={{ fontSize: 55, mb: 1 }} />
                  <Typography variant="h6">{t("pendingEmergencies", language)}</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.pendingEmergencies}
                  </Typography>
                </Paper>
              </Grid>

              {/* Approved Requests */}
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 5,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #8B9A46 0%, #A8B56B 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                    "&:hover": { transform: "scale(1.05)" },
                  }}
                >
                  <DoneAllIcon sx={{ fontSize: 55, mb: 1 }} />
                  <Typography variant="h6">{t("approvedEmergencies", language)}</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.approvedEmergencies}
                  </Typography>
                </Paper>
              </Grid>

              {/* Rejected Requests */}
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 5,
                    textAlign: "center",
                    background: "linear-gradient(135deg, #C9A646 0%, #DDB85C 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                    "&:hover": { transform: "scale(1.05)" },
                  }}
                >
                  <BlockIcon sx={{ fontSize: 55, mb: 1 }} />
                  <Typography variant="h6">{t("rejectedEmergencies", language)}</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.rejectedEmergencies}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EmergencyDashboard;
