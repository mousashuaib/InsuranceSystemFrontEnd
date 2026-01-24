// src/Component/CoordinationAdmin/CoordinationProfile.jsx
import React, { useEffect, useState } from "react";
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

import CoordinationSidebar from "./CoordinationSidebar";
import CoordinationHeader from "./CoordinationHeader";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
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

const CoordinationProfile = () => {
  const { language, isRTL } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
const getUniversityCardSrc = (profile, previewImage) => {
  if (previewImage) return previewImage;

  const imgs = profile?.universityCardImages || [];
  const last = imgs[imgs.length - 1];

  return last
    ? `${API_BASE_URL}${last}?t=${profile.updatedAt || Date.now()}`
    : null;
};

  // FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.AUTH.ME);
        setProfile(res.data);
        setFormData(res.data);
      } catch (err) {
        console.error("❌ Failed to load profile:", err);
      }
    };

    fetchProfile();
  }, []);

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
  try {
    const multipartData = new FormData();

    multipartData.append(
      "data",
      new Blob(
        [
          JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            employeeId: formData.employeeId,
            dateOfBirth: formData.dateOfBirth,  // تم تفعيله للتعديل
            nationalId: formData.nationalId,    // تم تفعيله للتعديل
            gender: formData.gender,            // تم تعطيله من التعديل
          }),
        ],
        { type: "application/json" }
      )
    );

    if (selectedFile) multipartData.append("universityCard", selectedFile);

    const res = await api.patch(
      `/api/clients/update/${profile.id}`,
      multipartData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setProfile(res.data);
    setFormData(res.data);
    setPreviewImage(null);
    setSelectedFile(null);
    setEditMode(false);
  } catch (err) {
    console.error("❌ Update failed:", err);
    alert("Update failed.");
  }
};

  if (!profile) return <Typography sx={{ p: 3 }}>{t("loading", language)}</Typography>;

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <CoordinationSidebar />

      <Box
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
        <CoordinationHeader />

        <Box sx={{ flex: 1, p: 4, display: "flex", justifyContent: "center" }}>
          <Paper
            sx={{
              p: 5,
              borderRadius: 4,
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
              maxWidth: "950px",
              width: "100%",
              background: "linear-gradient(145deg, #ffffffcc, #dcdcfacc)",
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
              <PersonIcon sx={{ fontSize: 36, color: "#150380" }} />
              {t("coordinatorProfile", language)}
            </Typography>

            <Divider sx={{ mb: 4 }} />

          <Grid container spacing={4}>
  {/* IMAGE */}
  <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "center" }}>
    <Box sx={{ position: "relative" }}>
      <Avatar
        src={getUniversityCardSrc(profile, previewImage)}
        alt="Profile"
        sx={{ width: 140, height: 140, border: "4px solid #150380" }}
      />
      {editMode && (
        <IconButton
          component="label"
          sx={{
            position: "absolute",
            bottom: 10,
            right: 10,
            bgcolor: "#150380",
            color: "#fff",
          }}
        >
          <UploadIcon />
          <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
        </IconButton>
      )}
    </Box>
  </Grid>

  {/* FIELDS */}
  <Grid item xs={12} md={8}>
    <Grid container spacing={3}>
      {/* Full Name */}
      <Grid item xs={12} md={6}>
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

      {/* Email */}
      <Grid item xs={12} md={6}>
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

      {/* Phone */}
      <Grid item xs={12} md={6}>
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
      <Grid item xs={12} md={6}>
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

      {/* Date of Birth - Disabled */}
      <Grid item xs={12} md={6}>
        <TextField
          label={t("dateOfBirth", language)}
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth || ""}
          onChange={handleChange}
          fullWidth
          disabled
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccessTimeIcon />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>

      {/* Gender - Disabled */}
      <Grid item xs={12} md={6}>
        <TextField
          label={t("gender", language)}
          name="gender"
          value={formData.gender || ""}
          onChange={handleChange}
          fullWidth
          disabled
        />
      </Grid>

      {/* National ID - Disabled */}
      <Grid item xs={12} md={6}>
        <TextField
          label={t("nationalId", language)}
          name="nationalId"
          value={formData.nationalId || ""}
          onChange={handleChange}
          fullWidth
          disabled
        />
      </Grid>

      {/* Status */}
      <Grid item xs={12} md={6}>
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

      {/* Roles */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2">{t("roles", language)}</Typography>
        {profile.roles.map((role, i) => (
          <Chip
            key={i}
            label={role}
            sx={{
              mr: 1,
              background: "#150380",
              color: "#fff",
              fontWeight: "bold",
            }}
          />
        ))}
      </Grid>

      {/* Created and Updated At */}
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="gray">
          <AccessTimeIcon fontSize="small" /> {t("createdAt", language)}:{" "}
          {new Date(profile.createdAt).toLocaleString()}
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="gray">
          <AccessTimeIcon fontSize="small" /> {t("updatedAt", language)}:{" "}
          {new Date(profile.updatedAt).toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  </Grid>
</Grid>


            {/* ACTION BUTTONS */}
            <Box sx={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", mt: 4, gap: 2 }}>
              {!editMode ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    borderRadius: 3,
                    background: "linear-gradient(90deg,#150380,#311B92)",
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

export default CoordinationProfile;
