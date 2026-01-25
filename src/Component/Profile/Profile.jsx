// src/Component/Profile/Profile.jsx
import React, { useState, memo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Snackbar,
  Button,
  Avatar,
  Chip,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { api } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import ClientFamily from "../Profile/ClientFamily";
import Slide from "@mui/material/Slide";
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
import VerifiedIcon from "@mui/icons-material/Verified";

const ProfileComponent = ({ userInfo, setUser }) => {
  const { language, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    employeeId: userInfo?.employeeId || "",
    fullName: userInfo?.fullName || "",
    email: userInfo?.email || "",
    phone: userInfo?.phone || "",
   // ✅ معلومات إضافية من DB
  nationalId: userInfo?.nationalId || "",
  dateOfBirth: userInfo?.dateOfBirth || "",
  faculty: userInfo?.faculty || "",
  department: userInfo?.department || "",
  clinicLocation: userInfo?.clinicLocation || "",
hasChronicDiseases: userInfo?.hasChronicDiseases || false,
  chronicDiseases: userInfo?.chronicDiseases || [],
universityCardImages: userInfo?.universityCardImages || [],
});
const [activeSection, setActiveSection] = useState("profile");

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
const [, setIsImageLoading] = useState(false);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState("");

  // ✅ تعديل النصوص
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setIsImageLoading(true);  // بدأ تحميل الصورة
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));

    // قم بتحديث حالة التحميل بعد المعالجة
    setIsImageLoading(false);
  }
};


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
    const responseData = await api.patch(
      API_ENDPOINTS.CLIENTS.ME_UPDATE,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setUser(responseData);
    localStorage.setItem("clientUser", JSON.stringify(responseData));

    setFormData((prev) => ({
      ...prev,
      universityCardImages: responseData.universityCardImages || [],
    }));

    const imgs = responseData.universityCardImages || [];
    const lastImg = imgs[imgs.length - 1];
    if (lastImg) {
      setPreviewImage(`${API_BASE_URL}${lastImg}?t=${Date.now()}`);
    }

    setEditMode(false);
    setSelectedFile(null);

    setSnackbarMessage(t("profileUpdatedSuccessfully", language));
    setSnackbarOpen(true);
  } catch (err) {
    console.error("Error updating profile:", err.response || err);
    setSnackbarMessage(t("errorUpdatingProfile", language));
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};

const getAvatarSrc = () => {
  if (previewImage) return previewImage;

  const imgs = formData.universityCardImages || [];
  const last = imgs[imgs.length - 1];

  if (!last || last.includes("prس") || last.includes("%D8")) {
    return undefined;
  }

  return `${API_BASE_URL}${last}`;
};



  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center" }} dir={isRTL ? "rtl" : "ltr"}>

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

      <Slide
  direction="left"
  in={activeSection === "profile"}
  mountOnEnter
  unmountOnExit
>
  <Box>

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
          {t("clientProfile", language)}
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* صورة البروفايل */}
          <Grid xs={12} md={4} sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ position: "relative" }}>


            
           <Avatar
  src={getAvatarSrc()}
  alt="Profile"
  sx={{ width: 140, height: 140, border: "4px solid #556B2F" }}
/>


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
          <Grid xs={12} md={8}>
            <Grid container spacing={3}>

              <Grid xs={12} md={6}>
                <TextField
                  label={t("employeeId", language)}
                  value={formData.employeeId}
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

              <Grid xs={12} md={6}>
  <TextField
    label={t("nationalId", language)}
    value={formData.nationalId}
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

<Snackbar
  open={snackbarOpen}
  autoHideDuration={3000}
  onClose={() => setSnackbarOpen(false)}
  message={snackbarMessage}
/>


<Grid xs={12} md={6}>
  <TextField
    label={t("department", language)}
    value={formData.department}
    fullWidth
    disabled
  />
</Grid>



<Grid xs={12} md={6}>
  <TextField
    label={t("faculty", language)}
    value={formData.faculty}
    fullWidth
    disabled
  />
</Grid>



<Grid xs={12} md={6}>
  <TextField
    label={t("dateOfBirth", language)}
    value={formData.dateOfBirth}
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

<Grid xs={12}>
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 3,
      background: "#f8fafc",
      border: "1px solid #E8EDE0",
    }}
  >
    <Typography
      variant="subtitle1"
      fontWeight="bold"
      sx={{ color: "#556B2F", mb: 2 }}
    >
      {t("chronicMedicalConditions", language)}
    </Typography>

    {!formData.hasChronicDiseases ? (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          background: "#e8f5e9",
          color: "#2e7d32",
          fontWeight: "bold",
          display: "inline-block",
        }}
      >
        {t("noChronicDiseases", language)}
      </Box>
    ) : (
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {formData.chronicDiseases.map((disease, index) => (
          <Chip
            key={index}
            label={disease.replaceAll("_", " ")}
            sx={{
              background: "#fff3e0",
              color: "#e65100",
              fontWeight: "bold",
              border: "1px solid #ffcc80",
            }}
          />
        ))}
      </Box>
    )}

    <Typography
      variant="caption"
      sx={{ display: "block", mt: 2, color: "gray" }}
    >
      {t("medicalConditionsManagedByAdmin", language)}
    </Typography>
  </Paper>
</Grid>


{userInfo?.policyName && (
  <Grid xs={12}>
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: "linear-gradient(135deg,#7B8B5E,#3D4F23)",
        color: "#fff",
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        {t("insuranceCoverage", language)}
      </Typography>

      <Typography
        variant="h6"
        sx={{ mt: 1, fontWeight: "bold" }}
      >
        {userInfo.policyName}
      </Typography>

      <Typography
        variant="caption"
        sx={{ opacity: 0.9, display: "block", mt: 1 }}
      >
        {t("policyManagedByAdmin", language)}
      </Typography>
    </Paper>
  </Grid>
)}


              <Grid xs={12} md={6}>
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

              <Grid xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("role", language)}
                </Typography>
                <Chip
                  label={userInfo?.roles?.[0] || "INSURANCE_CLIENT"}
                  sx={{
                    mr: 1,
                    background: "#556B2F",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                />
              </Grid>

              <Grid xs={12} md={6}>
                <Typography variant="body2" color="gray">
                  <AccessTimeIcon fontSize="small" /> {t("createdAt", language)}:{" "}
                  {userInfo?.createdAt || t("na", language)}
                </Typography>
              </Grid>

              <Grid xs={12} md={6}>
                <Typography variant="body2" color="gray">
                  <AccessTimeIcon fontSize="small" /> {t("updatedAt", language)}:{" "}
                  {userInfo?.updatedAt || t("na", language)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        

    <Box
  sx={{
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    mt: 4,
    gap: 2,
  }}
>
  {!editMode ? (
    <>
      {/* 🔹 زر عرض العائلة */}
      <Button
        variant="outlined"
        sx={{
          borderRadius: 3,
          fontWeight: "bold",
          color: "#556B2F",
          borderColor: "#556B2F",
        }}
onClick={() => setActiveSection("family")}
      >
        {t("familyMembers", language)}
      </Button>

      {/* 🔹 زر تعديل البروفايل */}
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
    </>
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
  </Box>
</Slide>
<Slide
  direction="right"
  in={activeSection === "family" && !editMode}
  mountOnEnter
  unmountOnExit
>

  <Box>
    <Button
      variant="outlined"
      sx={{ mb: 3 }}
      onClick={() => setActiveSection("profile")}
    >
      {t("backToProfile", language)}
    </Button>

    <ClientFamily />
  </Box>
</Slide>


      </Paper>
    </Box>
  );
};

ProfileComponent.propTypes = {
  userInfo: PropTypes.shape({
    employeeId: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    nationalId: PropTypes.string,
    dateOfBirth: PropTypes.string,
    faculty: PropTypes.string,
    department: PropTypes.string,
    clinicLocation: PropTypes.string,
    hasChronicDiseases: PropTypes.bool,
    chronicDiseases: PropTypes.arrayOf(PropTypes.string),
    universityCardImages: PropTypes.arrayOf(PropTypes.string),
    policyName: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }),
  setUser: PropTypes.func.isRequired,
};

ProfileComponent.defaultProps = {
  userInfo: null,
};

const Profile = memo(ProfileComponent);

export default Profile;
