import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { api, getToken } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

// Icons
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import UploadIcon from "@mui/icons-material/Upload";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const Profile = () => {
  const { language, isRTL } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.error("No token found, please login again.");
      return;
    }

    try {
      const res = await api.get(API_ENDPOINTS.AUTH.ME);
      setProfile(res || {});
      setFormData(res || {});
    } catch (err) {
      console.error("Failed to load profile:", err.response?.data || err.message);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      alert(t("pleaseLoginFirst", language));
      return;
    }

    try {
      const multipartData = new FormData();
      multipartData.append(
        "data",
        new Blob([JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          employeeId: formData.employeeId,
          nationalId: formData.nationalId,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth
        })], { type: "application/json" })
      );

      if (selectedFile) {
        multipartData.append("universityCard", selectedFile);
      }

      const res = await api.patch(
        `${API_ENDPOINTS.CLIENTS.UPDATE}/${profile.id}`,
        multipartData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfile(res || {});
      setFormData(res || {});
      setPreviewImage(null);
      setSelectedFile(null);
      setEditMode(false);
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      alert(t("updateFailed", language));
    }
  };

  if (!profile) {
    return <Typography sx={{ p: 3 }}>{t("loading", language)}</Typography>;
  }

  const getAvatarSrc = () => {
    if (previewImage) return previewImage;

    const imgs = formData.universityCardImages || profile.universityCardImages || [];
    const last = imgs[imgs.length - 1];

    return last ? `${API_BASE_URL}${last}` : "";
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        dir={isRTL ? "rtl" : "ltr"}
        sx={{
          flexGrow: 1,
          background: "#f5f7fb",
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

        <Box sx={{ flex: 1, p: 4, display: "flex", justifyContent: "center" }} dir={isRTL ? "rtl" : "ltr"}>
          <Paper
            sx={{
              p: 5,
              borderRadius: 4,
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
              maxWidth: "950px",
              width: "100%",
              background: "linear-gradient(145deg, #ffffffcc, #bed9facc)",
              backdropFilter: "blur(6px)",
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: "#150380",
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PersonIcon sx={{ fontSize: 36, color: "#1E8EAB" }} />
              {t("profile", language)}
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={4}>
              {/* صورة البروفايل */}
              <Grid xs={12} md={4} sx={{ display: "flex", justifyContent: "center" }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={getAvatarSrc()}
                    alt="Profile"
                    sx={{ width: 140, height: 140, border: "4px solid #1E8EAB" }}
                  />

                  {editMode && (
                    <IconButton
                      component="label"
                      sx={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        bgcolor: "#1E8EAB",
                        color: "#fff",
                      }}
                    >
                      <UploadIcon />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </IconButton>
                  )}
                </Box>
              </Grid>

              {/* معلومات البروفايل */}
              <Grid xs={12} md={8}>
                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <TextField
                      label={t("fullName", language)}
                      name="fullName"
                      value={formData.fullName || ""}
                      onChange={handleChange}
                      fullWidth
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid xs={12} md={6}>
                    <TextField
                      label={t("email", language)}
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      fullWidth
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid xs={12} md={6}>
                    <TextField
                      label={t("phone", language)}
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      fullWidth
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Employee ID */}
                  <Grid xs={12} md={6}>
                    <TextField
                      label={t("employeeId", language)}
                      name="employeeId"
                      value={formData.employeeId || ""}
                      onChange={handleChange}
                      fullWidth
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* National ID */}
                  <Grid xs={12} md={6}>
                    <TextField
                      label={t("nationalId", language)}
                      name="nationalId"
                      value={formData.nationalId || ""}
                      onChange={handleChange}
                      fullWidth
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Gender */}
                  <Grid xs={12} md={6}>
                    <TextField
                      label={t("gender", language)}
                      name="gender"
                      value={formData.gender || ""}
                      onChange={handleChange}
                      fullWidth
                      disabled={!editMode}
                    />
                  </Grid>

                  {/* Date of Birth */}
                  <Grid xs={12} md={6}>
                    <TextField
                      label={t("dateOfBirth", language)}
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={handleChange}
                      fullWidth
                      disabled={!editMode}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  <Grid xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {t("status", language)}
                    </Typography>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={profile.status}
                      color={profile.status === "ACTIVE" ? "success" : "error"}
                      sx={{ fontWeight: "bold" }}
                    />
                  </Grid>

                  <Grid xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {t("roles", language)}
                    </Typography>
                    {profile.roles.map((role, i) => (
                      <Chip
                        key={i}
                        label={role}
                        sx={{
                          mr: 1,
                          background: "#1E8EAB",
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      />
                    ))}
                  </Grid>

                  <Grid xs={12} md={6}>
                    <Typography variant="body2" color="gray">
                      <AccessTimeIcon fontSize="small" /> {t("createdAt", language)}:{" "}
                      {new Date(profile.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <Typography variant="body2" color="gray">
                      <AccessTimeIcon fontSize="small" /> {t("updatedAt", language)}:{" "}
                      {new Date(profile.updatedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
              {!editMode ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    borderRadius: 3,
                    background: "linear-gradient(90deg,#150380,#1E8EAB)",
                    fontWeight: "bold",
                    px: 4,
                  }}
                  onClick={() => setEditMode(true)}
                >
                  {t("editProfile", language)}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    sx={{ borderRadius: 3, px: 3 }}
                    onClick={() => setEditMode(false)}
                  >
                    {t("cancel", language)}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 3, px: 3 }}
                    onClick={handleSave}
                  >
                    {t("saveChanges", language)}
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
