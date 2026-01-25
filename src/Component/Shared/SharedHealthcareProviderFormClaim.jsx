import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Snackbar,
  Alert,
  Paper,
  Grid,
  Avatar,
  Divider,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptIcon from "@mui/icons-material/Receipt";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventIcon from "@mui/icons-material/Event";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SendIcon from "@mui/icons-material/Send";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import MedicationIcon from "@mui/icons-material/Medication";
import SearchIcon from "@mui/icons-material/Search";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

/**
 * موحد Form لجميع مقدمي الخدمات الصحيين
 * يدعم:
 * - DOCTOR (دكتور)
 * - PHARMACIST (صيدلي)
 * - LAB_TECH (فني مختبرات)
 * - RADIOLOGIST (أخصائي أشعة)
 */
const SharedHealthcareProviderFormClaim = ({ userRole = "DOCTOR", onAdded }) => {
  const [claim, setClaim] = useState({
    clientFullName: "",
    clientId: null,
    description: "",
    amount: "",
    serviceDate: new Date().toISOString().split("T")[0],
    notes: "",
    document: null,
  });

  const [documentFileName, setDocumentFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingClient, setCheckingClient] = useState(false);
  const [clientStatus, setClientStatus] = useState(null); // { found: true/false, message: "" }
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // AbortController ref to cancel pending requests on unmount
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ التحقق من وجود المريض بناءً على الاسم الكامل
  const checkClientExists = async (fullName) => {
    if (!fullName.trim()) {
      setClientStatus(null);
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setCheckingClient(true);
      const res = await api.get(
        `/api/healthcare-provider-claims/clients/by-name?fullName=${encodeURIComponent(fullName)}`,
        { signal: abortControllerRef.current.signal }
      );

      // api.get returns response.data directly
      if (res && res.id) {
        setClientStatus({
          found: true,
          message: `✅ Patient found: ${res.fullName}`,
          clientData: res,
        });
        setClaim((prev) => ({ ...prev, clientId: res.id }));
      } else {
        setClientStatus({
          found: false,
          message: "❌ Patient not found in the system",
          clientData: null,
        });
        setClaim((prev) => ({ ...prev, clientId: null }));
      }
    } catch (err) {
      // Don't update state if the request was aborted
      if (err.name === "AbortError" || err.name === "CanceledError") {
        return;
      }
      console.error("❌ Error checking client:", err);
      setClientStatus({
        found: false,
        message: `❌ Error: ${err.response?.data?.message || err.message}`,
        clientData: null,
      });
      setClaim((prev) => ({ ...prev, clientId: null }));
    } finally {
      setCheckingClient(false);
    }
  };

  // تحديد معلومات الدور
  const getRoleConfig = () => {
    const configs = {
      DOCTOR: {
        title: "Doctor Claim",
        icon: MedicalServicesIcon,
        color: "#556B2F",
        bgColor: "#F5F5DC",
      },
      PHARMACIST: {
        title: "Pharmacist Claim",
        icon: LocalPharmacyIcon,
        color: "#7B8B5E",
        bgColor: "#F5F5DC",
      },
      LAB_TECH: {
        title: "Lab Technician Claim",
        icon: ScienceIcon,
        color: "#8B9A46",
        bgColor: "#F5F5DC",
      },
      RADIOLOGIST: {
        title: "Radiologist Claim",
        icon: ImageSearchIcon,
        color: "#3D4F23",
        bgColor: "#F5F5DC",
      },
    };
    return configs[userRole] || configs.DOCTOR;
  };

  // الحقول الموحدة لجميع الأدوار
  const commonFields = [
    { label: "📝 Service Description", name: "description", multiline: true, rows: 3, required: true },
    { label: "📅 Service Date", name: "serviceDate", type: "date", required: true },
    { label: "💰 Amount (JD)", name: "amount", type: "number", required: true },
    { label: "📌 Notes", name: "notes", multiline: true, rows: 2 },
  ];

  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "document") {
      const file = files[0];
      if (file) {
        setClaim((prev) => ({ ...prev, document: file }));
        setDocumentFileName(file.name);
      }
    } else if (name === "clientFullName") {
      setClaim((prev) => ({ ...prev, [name]: value }));
    } else {
      setClaim((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClientNameBlur = () => {
    if (claim.clientFullName.trim()) {
      checkClientExists(claim.clientFullName);
    }
  };

  const buildClaimData = () => {
    if (!claim.clientId) {
      throw new Error("Please select a patient (client)");
    }

    const data = {
      clientId: typeof claim.clientId === 'object' ? claim.clientId.id : claim.clientId,
      description: claim.description,
      amount: claim.amount,
      serviceDate: claim.serviceDate,
    };

    // بيانات موحدة لجميع الأدوار
    const roleData = {
      notes: claim.notes,
    };

    data.roleSpecificData = JSON.stringify(roleData);
    return data;
  };

  // Validate form fields before submission
  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split("T")[0];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const minDate = oneYearAgo.toISOString().split("T")[0];

    // Validate client selection
    if (!claim.clientId) {
      newErrors.clientFullName = "Please select a valid patient";
    }
    if (!clientStatus?.found) {
      newErrors.clientFullName = "Patient not verified - please search and select a patient";
    }

    // Validate description
    if (!claim.description?.trim()) {
      newErrors.description = "Description is required";
    } else if (claim.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    // Validate amount
    const amount = parseFloat(claim.amount);
    if (!claim.amount || isNaN(amount)) {
      newErrors.amount = "Amount is required";
    } else if (amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (amount > 100000) {
      newErrors.amount = "Amount exceeds maximum allowed (100,000)";
    }

    // Validate service date
    if (!claim.serviceDate) {
      newErrors.serviceDate = "Service date is required";
    } else if (claim.serviceDate > today) {
      newErrors.serviceDate = "Service date cannot be in the future";
    } else if (claim.serviceDate < minDate) {
      newErrors.serviceDate = "Service date cannot be more than 1 year ago";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double-click submission
    if (isSubmitting || loading) return;

    // Validate form before submission
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please fix the errors before submitting",
        severity: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const formData = new FormData();
      const claimData = buildClaimData();

      formData.append("data", JSON.stringify(claimData));

      if (claim.document) {
        formData.append("document", claim.document);
      }

      // api.post returns response.data directly
      const responseData = await api.post(
        API_ENDPOINTS.HEALTHCARE_CLAIMS.SUBMIT,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (onAdded) onAdded(responseData);

      setSnackbar({
        open: true,
        message: `${roleConfig.title} submitted successfully!`,
        severity: "success",
      });

      // Reset form
      setClaim({
        clientFullName: "",
        clientId: null,
        description: "",
        amount: "",
        serviceDate: new Date().toISOString().split("T")[0],
        notes: "",
        document: null,
      });
      setDocumentFileName("");
      setClientStatus(null);
      setErrors({});
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || err.message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const getGradient = () => {
    const gradients = {
      DOCTOR: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
      PHARMACIST: "linear-gradient(135deg, #7B8B5E 0%, #556B2F 100%)",
      LAB_TECH: "linear-gradient(135deg, #8B9A46 0%, #7B8B5E 100%)",
      RADIOLOGIST: "linear-gradient(135deg, #3D4F23 0%, #556B2F 100%)",
    };
    return gradients[userRole] || gradients.DOCTOR;
  };

  return (
    <Box sx={{ px: 4, py: 3, backgroundColor: "#FAF8F5", minHeight: "100vh" }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: getGradient(),
          color: "white",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              width: 64,
              height: 64,
            }}
          >
            <RoleIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
              {roleConfig.title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Submit your service claim
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Form Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid #E8EDE0",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Patient Name Input */}
              <Box>
                <TextField
                  label="👤 Patient Full Name *"
                  name="clientFullName"
                  value={claim.clientFullName}
                  onChange={handleInputChange}
                  onBlur={handleClientNameBlur}
                  required
                  fullWidth
                  placeholder="Enter patient's full name"
                  disabled={checkingClient || isSubmitting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {checkingClient ? (
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : (
                          <PersonIcon sx={{ color: roleConfig.color }} />
                        )}
                      </InputAdornment>
                    ),
                    endAdornment: clientStatus?.found && (
                      <InputAdornment position="end">
                        <CheckCircleIcon sx={{ color: "#8B9A46", fontSize: 22 }} />
                      </InputAdornment>
                    ),
                  }}
                  error={(clientStatus !== null && !clientStatus.found) || !!errors.clientFullName}
                  helperText={errors.clientFullName || clientStatus?.message}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#FAF8F5",
                      transition: "all 0.2s ease",
                      "&:focus-within": {
                        bgcolor: "white",
                        boxShadow: `0 0 8px ${roleConfig.color}40`,
                      },
                    },
                  }}
                />
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Dynamic Fields */}
              {commonFields.map((field, index) => {
                const getFieldIcon = () => {
                  if (field.name.includes("amount")) return <LocalOfferIcon sx={{ color: roleConfig.color }} />;
                  if (field.name.includes("Date")) return <EventIcon sx={{ color: roleConfig.color }} />;
                  if (field.name.includes("description")) return <DescriptionIcon sx={{ color: roleConfig.color }} />;
                  if (field.name.includes("medicines")) return <MedicationIcon sx={{ color: roleConfig.color }} />;
                  if (field.name.includes("dosage")) return <MedicationIcon sx={{ color: roleConfig.color }} />;
                  if (field.name.includes("test")) return <ScienceIcon sx={{ color: roleConfig.color }} />;
                  if (field.name.includes("imaging")) return <ImageSearchIcon sx={{ color: roleConfig.color }} />;
                  if (field.name.includes("notes")) return <DescriptionIcon sx={{ color: roleConfig.color }} />;
                  return <MedicalServicesIcon sx={{ color: roleConfig.color }} />;
                };

                const endAdornmentText = field.label.includes("EGP") || field.label.includes("Amount") ? "JD" : null;

                return (
                  <Box key={index}>
                    <TextField
                      label={field.label}
                      name={field.name}
                      type={field.type || "text"}
                      value={claim[field.name] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                      fullWidth
                      multiline={field.multiline || false}
                      rows={field.rows || 1}
                      disabled={isSubmitting}
                      error={!!errors[field.name]}
                      helperText={errors[field.name]}
                      InputLabelProps={field.type === "date" ? { shrink: true } : {}}
                      inputProps={
                        field.name === "amount"
                          ? { min: "0.01", max: "100000", step: "0.01" }
                          : field.type === "date"
                          ? { max: new Date().toISOString().split("T")[0] }
                          : {}
                      }
                      InputProps={
                        field.type !== "date"
                          ? {
                              startAdornment: (
                                <InputAdornment position="start">
                                  {getFieldIcon()}
                                </InputAdornment>
                              ),
                              endAdornment: endAdornmentText && (
                                <InputAdornment position="end">
                                  <Typography variant="body2" fontWeight="600" sx={{ color: roleConfig.color }}>
                                    {endAdornmentText}
                                  </Typography>
                                </InputAdornment>
                              ),
                            }
                          : {}
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#FAF8F5",
                          transition: "all 0.2s ease",
                          "&:focus-within": {
                            bgcolor: "white",
                            boxShadow: `0 0 8px ${roleConfig.color}40`,
                          },
                        },
                      }}
                    />
                  </Box>
                );
              })}

              <Divider sx={{ my: 2 }} />

              {/* Document Upload Section */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Avatar sx={{ bgcolor: roleConfig.color, width: 40, height: 40 }}>
                    <UploadFileIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="700" color="#1e293b">
                      Supporting Document
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Upload invoice or receipt (optional)
                    </Typography>
                  </Box>
                </Stack>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: claim.document ? `2px solid ${roleConfig.color}` : "2px dashed #cbd5e0",
                    bgcolor: claim.document ? roleConfig.bgColor : "#FAF8F5",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<UploadFileIcon />}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 3,
                        fontWeight: "600",
                        textTransform: "none",
                        fontSize: "1rem",
                        background: getGradient(),
                        "&:hover": {
                          opacity: 0.8,
                        },
                      }}
                    >
                      {claim.document ? "Change Document" : "Upload Document"}
                      <input
                        type="file"
                        name="document"
                        hidden
                        onChange={handleInputChange}
                      />
                    </Button>

                    {documentFileName && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          bgcolor: "white",
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${roleConfig.color}`,
                        }}
                      >
                        <CheckCircleIcon sx={{ color: roleConfig.color, fontSize: 20 }} />
                        <Typography variant="body2" fontWeight="600" color={roleConfig.color}>
                          {documentFileName}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                disabled={loading || isSubmitting || !clientStatus?.found}
                size="large"
                endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{
                  py: 2,
                  borderRadius: 3,
                  fontWeight: "700",
                  fontSize: "1.1rem",
                  textTransform: "none",
                  background: getGradient(),
                  boxShadow: `0 8px 24px rgba(0,0,0,0.15)`,
                  "&:hover": {
                    opacity: 0.95,
                  },
                  "&:disabled": {
                    background: "#cbd5e0",
                    color: "#64748b",
                  },
                  mt: 4,
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Claim"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{
            width: "100%",
            borderRadius: 2,
            fontWeight: "600",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

SharedHealthcareProviderFormClaim.propTypes = {
  userRole: PropTypes.string,
  onAdded: PropTypes.func,
};

export default SharedHealthcareProviderFormClaim;



