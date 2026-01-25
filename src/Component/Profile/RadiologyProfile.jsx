import React, { useState, memo } from "react";
import PropTypes from "prop-types";
import { api } from "../../utils/apiService";
import { API_BASE_URL } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
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
  CircularProgress,
} from "@mui/material";

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
import VerifiedIcon from "@mui/icons-material/Verified";

const RadiologyProfileComponent = ({ userInfo, setUser, refresh }) => {
  const { language } = useLanguage();

  // Debug: Log userInfo to see all available fields
  console.log("RadiologyProfile userInfo:", userInfo);

  // Check if it's universityCardImages (array) like client or universityCardImage (string)
  const getImageFromUserInfo = () => {
    if (userInfo?.universityCardImage) {
      return userInfo.universityCardImage;
    }
    if (userInfo?.universityCardImages && userInfo.universityCardImages.length > 0) {
      return userInfo.universityCardImages[userInfo.universityCardImages.length - 1];
    }
    return "";
  };

  const [formData, setFormData] = useState({
    employeeId: userInfo?.employeeId || userInfo?.radiologyCode || "",
    fullName: userInfo?.fullName || "",
    email: userInfo?.email || "",
    phone: userInfo?.phone || "",
    nationalId: userInfo?.nationalId || "",
    dateOfBirth: userInfo?.dateOfBirth || "",
    universityCardImage: getImageFromUserInfo(),
    file: null,
  });

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);


  // ✅ Sync formData with userInfo when it changes
  React.useEffect(() => {
    if (userInfo) {
      let imgPath = userInfo.universityCardImage || "";
      if (!imgPath && userInfo.universityCardImages && userInfo.universityCardImages.length > 0) {
        imgPath = userInfo.universityCardImages[userInfo.universityCardImages.length - 1];
      }
      
      setFormData((prev) => ({
        ...prev,
        employeeId: userInfo.employeeId || userInfo.radiologyCode || prev.employeeId,
        fullName: userInfo.fullName || prev.fullName,
        email: userInfo.email || prev.email,
        phone: userInfo.phone || prev.phone,
        nationalId: userInfo.nationalId || prev.nationalId,
        dateOfBirth: userInfo.dateOfBirth || prev.dateOfBirth,
        universityCardImage: imgPath || prev.universityCardImage,
      }));
    }
  }, [userInfo]);

  // ✅ Get avatar source - handles all cases
  const getAvatarSrc = () => {
    if (previewImage) return previewImage;
    
    const imgPath = formData.universityCardImage;
    if (!imgPath) return undefined;
    
    if (imgPath.startsWith("blob:")) return imgPath;
    if (imgPath.startsWith("http")) return `${imgPath}?t=${Date.now()}`;
    
    return `${API_BASE_URL}${imgPath}?t=${Date.now()}`;
  };

  // ✅ تعديل النصوص
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ تعديل الصورة
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // يظهر مباشرة
    }
  };

  // ✅ حفظ التعديلات
  const handleSave = async () => {
    try {
      setLoading(true);

      const form = new FormData();
      form.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              fullName: formData.fullName,
              phone: formData.phone,
            }),
          ],
          { type: "application/json" }
        )
      );
      if (selectedFile) {
        form.append("universityCard", selectedFile);
      }

      // api.patch returns response.data directly
      const responseData = await api.patch("/api/radiology/me/update", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ تحديث البيانات
      setUser(responseData);
      localStorage.setItem("radiologyUserInfo", JSON.stringify(responseData));
      if (refresh) refresh();

      // Handle both single image and array format
      let newImagePath = responseData.universityCardImage || "";
      if (!newImagePath && responseData.universityCardImages && responseData.universityCardImages.length > 0) {
        newImagePath = responseData.universityCardImages[responseData.universityCardImages.length - 1];
      }

      // ✅ تحديث الصورة مباشرة مع منع الكاش
      if (newImagePath) {
        const newUrl = `${API_BASE_URL}${newImagePath}?t=${new Date().getTime()}`;
        setFormData((prev) => ({
          ...prev,
          universityCardImage: newImagePath,
        }));
        setPreviewImage(newUrl);
        localStorage.setItem("radiologyProfileImage", newUrl);
      }

      setEditMode(false);
      setSelectedFile(null);
      alert(t("profileUpdatedSuccessfully", language));
    } catch (err) {
      console.error("Error updating radiology profile:", err.response || err);
      alert(t("errorUpdatingProfile", language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
      <Paper
        sx={{
          p: 5,
          borderRadius: 4,
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
          maxWidth: "950px",
          width: "100%",
          background: "linear-gradient(145deg, #FAF8F5cc, #E8EDE0cc)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: "#556B2F",
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {t("radiologistProfile", language)}
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* صورة البروفايل */}
          <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={getAvatarSrc()}
                alt="Profile"
                sx={{
                  width: 140,
                  height: 140,
                  border: "4px solid #556B2F",
                }}
              >
                {!getAvatarSrc() && userInfo?.fullName?.charAt(0)}
              </Avatar>
              {editMode && (
                <IconButton
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    bgcolor: "#556B2F",
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
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>

              <Grid item xs={12} md={6}>
                <TextField
                  label={t("employeeId", language)}
                  value={formData.employeeId || ""}
                  fullWidth
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VerifiedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

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

              <Grid item xs={12} md={6}>
                <TextField
                  label={t("email", language)}
                  name="email"
                  value={formData.email || ""}
                  fullWidth
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

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

              <Grid item xs={12} md={6}>
                <TextField
                  label={t("nationalId", language)}
                  value={formData.nationalId || ""}
                  fullWidth
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label={t("dateOfBirth", language)}
                  value={formData.dateOfBirth || ""}
                  fullWidth
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("status", language)}
                </Typography>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={t("active", language)}
                  color="success"
                  sx={{ fontWeight: "bold" }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("role", language)}
                </Typography>
                <Chip
                  label={userInfo?.roles?.[0] || "RADIOLOGIST"}
                  sx={{
                    mr: 1,
                    background: "#556B2F",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="gray">
                  <AccessTimeIcon fontSize="small" /> {t("createdAt", language)}:{" "}
                  {userInfo?.createdAt || t("na", language)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="gray">
                  <AccessTimeIcon fontSize="small" /> {t("updatedAt", language)}:{" "}
                  {userInfo?.updatedAt || t("na", language)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* أزرار الأكشن */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
          {!editMode ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                borderRadius: 3,
                background: "linear-gradient(90deg,#3D4F23,#556B2F)",
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
                startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
                sx={{ borderRadius: 3, px: 3 }}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? t("saving", language) : t("saveChanges", language)}
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

RadiologyProfileComponent.propTypes = {
  userInfo: PropTypes.shape({
    employeeId: PropTypes.string,
    radiologyCode: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    nationalId: PropTypes.string,
    dateOfBirth: PropTypes.string,
    universityCardImage: PropTypes.string,
    universityCardImages: PropTypes.arrayOf(PropTypes.string),
    roles: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }),
  setUser: PropTypes.func.isRequired,
  refresh: PropTypes.func,
};

RadiologyProfileComponent.defaultProps = {
  userInfo: null,
  refresh: null,
};

const RadiologyProfile = memo(RadiologyProfileComponent);

export default RadiologyProfile;




























