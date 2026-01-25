import React, { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
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
  IconButton,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DescriptionIcon from "@mui/icons-material/Description";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventIcon from "@mui/icons-material/Event";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SendIcon from "@mui/icons-material/Send";
import HealingIcon from "@mui/icons-material/Healing";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SearchIcon from "@mui/icons-material/Search";

const CoordinatorAddClaim = ({ onAdded }) => {
  const { language, isRTL } = useLanguage();
  const [newClaim, setNewClaim] = useState({
    description: "",
    diagnosis: "",
    treatmentDetails: "",
    amount: "",
    serviceDate: "",
    providerName: "",
    doctorName: "",
    invoiceImagePath: [],
  });

  const [employeeId, setEmployeeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("myself");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Handle input change including multiple image files
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "invoiceImagePath") {
      const files = Array.from(e.target.files);
      setNewClaim((prev) => ({
        ...prev,
        invoiceImagePath: [...prev.invoiceImagePath, ...files],
      }));
      return;
    }

    setNewClaim((prev) => ({ ...prev, [name]: value }));
  };

  // Remove one image
  const handleRemoveImage = (index) => {
    setNewClaim((prev) => ({
      ...prev,
      invoiceImagePath: prev.invoiceImagePath.filter((_, i) => i !== index),
    }));
  };

  // Lookup client by employee ID first
  const handleLookupByEmployeeId = async () => {
    if (!employeeId || !employeeId.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseEnterEmployeeId", language),
        severity: "error",
      });
      return;
    }

    setSearching(true);
    try {
      // api.get returns response.data directly
      const clientData = await api.get(API_ENDPOINTS.CLIENTS.SEARCH_BY_EMPLOYEE_ID(employeeId));

      setSelectedClient(clientData);
      setClientId(clientData.id);

      // Fetch family members for this client
      try {
        // api.get returns response.data directly
        const familyData = await api.get(API_ENDPOINTS.FAMILY_MEMBERS.BY_CLIENT(clientData.id));
        const approvedMembers = (familyData || []).filter(
          (member) => member.status === "APPROVED"
        );
        setFamilyMembers(approvedMembers);
      } catch (err) {
        console.error("Error fetching family members:", err);
        setFamilyMembers([]);
      }

      setSnackbar({
        open: true,
        message: t("clientFoundSuccess", language),
        severity: "success",
      });
    } catch (err) {
      setSelectedClient(null);
      setClientId("");
      setFamilyMembers([]);
      setSelectedMemberId("myself");

      setSnackbar({
        open: true,
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          t("clientNotFoundEmployeeId", language),
        severity: "error",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      if (!clientId) {
        setSnackbar({
          open: true,
          message: t("pleaseSelectClientFirst", language),
          severity: "error",
        });
        setLoading(false);
        return;
      }

      if (!newClaim.amount || isNaN(newClaim.amount)) {
        setSnackbar({
          open: true,
          message: t("pleaseEnterValidAmount", language),
          severity: "error",
        });
        setLoading(false);
        return;
      }

      const claimData = {
        description: newClaim.description,
        diagnosis: newClaim.diagnosis || null,
        treatmentDetails: newClaim.treatmentDetails || null,
        amount: parseFloat(newClaim.amount),
        serviceDate: newClaim.serviceDate,
      };

      // Set client ID - either main client or family member
      if (selectedMemberId !== "myself") {
        claimData.clientId = selectedMemberId;
      } else {
        claimData.clientId = clientId;
      }

      // Include provider and doctor name
      if (newClaim.providerName || newClaim.doctorName) {
        claimData.roleSpecificData = JSON.stringify({
          providerName: newClaim.providerName,
          doctorName: newClaim.doctorName,
        });
      }

      formData.append("data", JSON.stringify(claimData));

      // Append document
      if (newClaim.invoiceImagePath.length > 0) {
        formData.append("document", newClaim.invoiceImagePath[0]);
      }

      // api.post returns response.data directly
      const responseData = await api.post(
        "/api/healthcare-provider-claims/admin/create-direct",
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
        message: t("claimCreatedSuccess", language),
        severity: "success",
      });

      // Reset
      setNewClaim({
        description: "",
        diagnosis: "",
        treatmentDetails: "",
        amount: "",
        serviceDate: "",
        providerName: "",
        doctorName: "",
        invoiceImagePath: [],
      });
      setEmployeeId("");
      setClientId("");
      setSelectedClient(null);
      setFamilyMembers([]);
      setSelectedMemberId("myself");
    } catch (err) {
      console.error("❌ Error submitting claim:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("errorCreatingClaim", language),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ px: 4, py: 3, backgroundColor: "#FAF8F5", minHeight: "100vh" }} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: "linear-gradient(135deg, #150380 0%, #311B92 100%)",
          color: "white",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 64, height: 64 }}>
            <ReceiptIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="700">
              {t("createClaimCoordinator", language)}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {t("searchByEmployeeIdCreateClaim", language)}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Form */}
      <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0" }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {/* Employee ID Search - Priority */}
              <Box>
                <Typography variant="h6" fontWeight="700" mb={2}>
                  {t("searchClientByEmployeeId", language)}
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <TextField
                      label={t("employeeId", language)}
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      fullWidth
                      required
                      placeholder={t("enterEmployeeIdSearch", language)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: "#150380" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="contained"
                      onClick={handleLookupByEmployeeId}
                      disabled={searching || !employeeId}
                      startIcon={<SearchIcon />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        background: "linear-gradient(135deg, #150380 0%, #311B92 100%)",
                      }}
                    >
                      {searching ? t("searching", language) : t("searchClient", language)}
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />
              </Box>

              {/* Selected Client Information */}
              {selectedClient && (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <Avatar sx={{ bgcolor: "#0ea5e9", width: 40, height: 40 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="700">
                        {t("clientInformation", language)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("selectedClientDetails", language)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label={t("fullName", language)}
                        value={selectedClient.fullName || ""}
                        fullWidth
                        disabled
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        label={t("employeeId", language)}
                        value={selectedClient.employeeId || ""}
                        fullWidth
                        disabled
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        label={t("nationalId", language)}
                        value={selectedClient.nationalId || ""}
                        fullWidth
                        disabled
                      />
                    </Grid>

                    {selectedClient.department && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          label={t("department", language)}
                          value={selectedClient.department}
                          fullWidth
                          disabled
                        />
                      </Grid>
                    )}

                    {selectedClient.faculty && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          label={t("faculty", language)}
                          value={selectedClient.faculty}
                          fullWidth
                          disabled
                        />
                      </Grid>
                    )}
                  </Grid>

                  <Divider sx={{ my: 4 }} />
                </Box>
              )}

              {/* Family Member Selection */}
              {selectedClient && familyMembers.length > 0 && (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <Avatar sx={{ bgcolor: "#8b5cf6", width: 40, height: 40 }}>
                      <FamilyRestroomIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="700" color="#1e293b">
                        {t("selectClaimBeneficiary", language)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("chooseClientOrFamilyMember", language)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label={t("beneficiary", language)}
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        fullWidth
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: "#8b5cf6" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                        }}
                      >
                        <MenuItem value="myself">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PersonIcon fontSize="small" />
                            <Typography>
                              {selectedClient.fullName} ({t("mainClient", language)})
                            </Typography>
                          </Stack>
                        </MenuItem>
                        {familyMembers.map((member) => (
                          <MenuItem key={member.id} value={member.id}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <FamilyRestroomIcon fontSize="small" />
                              <Typography>
                                {member.fullName} ({member.relation})
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {selectedMemberId !== "myself" && (
                      <Grid item xs={12} md={6}>
                        {(() => {
                          const selectedMember = familyMembers.find(
                            (m) => m.id === selectedMemberId
                          );
                          return selectedMember ? (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: "#f0f9ff",
                                border: "1px solid #bae6fd",
                              }}
                            >
                              <Stack spacing={1}>
                                <Typography variant="body2" fontWeight={600}>
                                  {t("selectedFamilyMember", language)}:
                                </Typography>
                                <Typography variant="body2">
                                  <strong>{t("name", language)}:</strong> {selectedMember.fullName}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>{t("relation", language)}:</strong> {selectedMember.relation}
                                </Typography>
                                {selectedMember.insuranceNumber && (
                                  <Typography variant="body2">
                                    <strong>{t("insuranceNumber", language)}:</strong> {selectedMember.insuranceNumber}
                                  </Typography>
                                )}
                              </Stack>
                            </Paper>
                          ) : null;
                        })()}
                      </Grid>
                    )}
                  </Grid>

                  <Divider sx={{ my: 4 }} />
                </Box>
              )}

              {/* MEDICAL SECTION */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Avatar sx={{ bgcolor: "#8b5cf6", width: 40, height: 40 }}>
                    <MedicalServicesIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="700" color="#1e293b">
                      {t("medicalInformation", language)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("provideMedicalDetails", language)}
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label={t("description", language)}
                      name="description"
                      value={newClaim.description}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      multiline
                      rows={3}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mt: 2 }}>
                            <DescriptionIcon sx={{ color: "#8b5cf6" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t("diagnosis", language)}
                      name="diagnosis"
                      value={newClaim.diagnosis}
                      onChange={handleInputChange}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <HealingIcon sx={{ color: "#8b5cf6" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t("treatmentDetails", language)}
                      name="treatmentDetails"
                      value={newClaim.treatmentDetails}
                      onChange={handleInputChange}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MedicalServicesIcon sx={{ color: "#8b5cf6" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* FINANCIAL SECTION */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Avatar sx={{ bgcolor: "#10b981", width: 40, height: 40 }}>
                    <AttachMoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="700" color="#1e293b">
                      {t("providerFinancialDetails", language)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("serviceProviderCost", language)}
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t("providerName", language)}
                      name="providerName"
                      value={newClaim.providerName}
                      onChange={handleInputChange}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: "#10b981" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t("doctorName", language)}
                      name="doctorName"
                      value={newClaim.doctorName}
                      onChange={handleInputChange}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: "#10b981" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t("claimAmountShekels", language)}
                      type="number"
                      name="amount"
                      value={newClaim.amount}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalOfferIcon sx={{ color: "#10b981" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography fontWeight={600}>{t("shekels", language)}</Typography>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t("serviceDate", language)}
                      type="date"
                      name="serviceDate"
                      value={newClaim.serviceDate}
                      onChange={handleInputChange}
                      required
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventIcon sx={{ color: "#10b981" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FAF8F5" },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* UPLOAD SECTION */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Avatar sx={{ bgcolor: "#06b6d4", width: 40, height: 40 }}>
                    <UploadFileIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="700" color="#1e293b">
                      {t("supportingDocuments", language)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("uploadInvoiceDocument", language)}
                    </Typography>
                  </Box>
                </Stack>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: newClaim.invoiceImagePath.length
                      ? "2px solid #10b981"
                      : "2px dashed #cbd5e0",
                    bgcolor: newClaim.invoiceImagePath.length ? "#f0fdf4" : "#FAF8F5",
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
                        fontWeight: 600,
                        background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                      }}
                    >
                      {t("uploadInvoice", language)}
                      <input
                        type="file"
                        name="invoiceImagePath"
                        hidden
                        multiple
                        onChange={handleInputChange}
                      />
                    </Button>

                    {newClaim.invoiceImagePath.length > 0 && (
                      <Grid container spacing={2}>
                        {newClaim.invoiceImagePath.map((file, i) => (
                          <Grid item key={i}>
                            <Stack
                              alignItems="center"
                              sx={{
                                p: 1,
                                border: "1px solid #d1fae5",
                                borderRadius: 2,
                                bgcolor: "white",
                                width: 120,
                              }}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "90px",
                                  objectFit: "cover",
                                  borderRadius: 6,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 1,
                                  textAlign: "center",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {file.name}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveImage(i)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                </Paper>
              </Box>

              {/* SUBMIT */}
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !selectedClient}
                size="large"
                endIcon={<SendIcon />}
                sx={{
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #150380 0%, #311B92 100%)",
                }}
              >
                {loading ? t("creatingClaim", language) : t("createAndApproveClaim", language)}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CoordinatorAddClaim;

