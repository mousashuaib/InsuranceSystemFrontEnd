import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Stack,
  CircularProgress,
} from "@mui/material";
import Header from "../MedicalAdminHeader";
import Sidebar from "../MedicalAdminSidebar";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../../config/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const getUniversityCardSrc = (client) => {
  const imgs = client?.universityCardImages || [];
  const last = imgs[imgs.length - 1];
  return last ? `${API_BASE_URL}${last}?t=${client.updatedAt || Date.now()}` : null;
};

const PendingRequestsClients = () => {
  const { language, isRTL } = useLanguage();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]); // Store all clients for filtering
const [filterRole, setFilterRole] = useState("INSURANCE_CLIENT");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
const [openFamilyDialog, setOpenFamilyDialog] = useState(false);
const [familyLoading, setFamilyLoading] = useState(false);
const [familyMembers, setFamilyMembers] = useState([]);

  // ✅ جلب البيانات من الباك اند
  useEffect(() => {
    const fetchAllRequests = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.CLIENTS.LIST);
const filtered = res.data.filter(
  (u) =>
    u.roleRequestStatus === "PENDING" &&
    u.requestedRole?.toUpperCase() === "INSURANCE_CLIENT"
);

        const sorted = filtered.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setAllClients(sorted);
        setClients(sorted);
      } catch (err) {
        console.error("❌ Fetch failed:", err.response?.data || err.message);
      }
    };

    fetchAllRequests();
  }, []);

  // ✅ Color the card based on status
  const getCardColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "#E6F4EA"; // Green light
      case "REJECTED":
        return "#FDECEA"; // Red light
      default:
        return "white"; // Default white
    }
  };

  // ✅ Color the status
  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  // ✅ Handle approve request
  const handleApprove = async (client) => {
    setLoadingId(client.id);
    try {
      await api.patch(`/api/clients/${client.id}/role-requests/approve`);

      // 🟢 Remove approved client from list
      setAllClients((prev) => prev.filter((c) => c.id !== client.id));
      setClients((prev) => prev.filter((c) => c.id !== client.id));

      setSnackbar({
        open: true,
        message: `Request for ${client.fullName} approved.`,
        severity: "success",
      });
    } catch (err) {
      console.error("❌ Approval failed:", err.response?.data || err.message);
      setSnackbar({
        open: true,
        message: "Approval failed.",
        severity: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  // ✅ Handle reject request click
  const handleRejectClick = (client) => {
    setSelectedClient(client);
    setOpenDialog(true);
  };

  // ✅ Filter clients by requested role
 useEffect(() => {
  setClients(
    allClients.filter(
      (client) => client.requestedRole?.toUpperCase() === "INSURANCE_CLIENT"
    )
  );
}, [filterRole, allClients]);

  // ✅ Handle reject request confirmation
  const handleRejectConfirm = async () => {
    setLoadingId(selectedClient.id);
    try {
      await api.patch(
        API_ENDPOINTS.CLIENTS.REJECT(selectedClient.id),
        { reason: rejectReason }
      );

      // 🟢 Remove rejected client from list
      setAllClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));

      setSnackbar({
        open: true,
        message: `Request for ${selectedClient.fullName} rejected.`,
        severity: "error",
      });
    } catch (err) {
      console.error(
        "❌ Reject failed:",
        err.response?.status,
        err.response?.data || err.message
      );
      setSnackbar({
        open: true,
        message:
          err.response?.status === 401
            ? "Unauthorized – login again"
            : "Reject failed due to server error",
        severity: "error",
      });
    } finally {
      setLoadingId(null);
      setOpenDialog(false);
      setRejectReason("");
    }
  };
const fetchClientFamily = async (client) => {
  setSelectedClient(client);
  setOpenFamilyDialog(true);
  setFamilyLoading(true);

  try {
    const res = await api.get(API_ENDPOINTS.FAMILY_MEMBERS.BY_CLIENT(client.id));

    setFamilyMembers(res.data);
  } catch (err) {
    console.error("❌ Failed to fetch family:", err);
    setFamilyMembers([]);
  } finally {
    setFamilyLoading(false);
  }
};

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <Box
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
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: "#120460", display: "flex", alignItems: "center" }}
          >
            <GroupAddIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 35, color: "#1E8EAB" }} />
            {t("clientRoleRequests", language)}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t("reviewManageClientRequests", language)}
          </Typography>

          {/* Role Filter */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: "#1e293b",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
              }}
            >
              Requested Role
            </Typography>
           <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
  {[
    {
      role: "INSURANCE_CLIENT",
      label: "Insurance Client",
      count: allClients.filter(
        (c) => c.requestedRole?.toUpperCase() === "INSURANCE_CLIENT"
      ).length,
    },
  ].map(({ role, label, count }) => (
    <Chip
      key={role}
      label={`${label} (${count})`}
      onClick={() => setFilterRole(role)}
      variant="filled"
      color="primary"
      sx={{ fontWeight: 600, borderRadius: 2, cursor: "pointer" }}
    />
  ))}
</Stack>
          </Paper>

          {/* Results Count */}
          <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
            Showing <strong>{clients.length}</strong> request{clients.length !== 1 ? 's' : ''}
            {filterRole !== "ALL" && ` for ${filterRole.replace('_', ' ')}`}
          </Typography>

          {clients.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t("noPendingRequestsFound", language)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filterRole !== "ALL"
                  ? t("noPendingRequestsForRole", language)
                  : t("noPendingRoleRequests", language)}
              </Typography>
            </Paper>
          ) : (
            clients.map((client) => (
            <Paper
              key={client.id}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: 4,
                mb: 4,
                borderLeft: `6px solid ${
                  client.roleRequestStatus === "APPROVED"
                    ? "#2e7d32"
                    : client.roleRequestStatus === "REJECTED"
                    ? "#d32f2f"
                    : "#1E8EAB"
                }`,
                backgroundColor: getCardColor(client.roleRequestStatus),
                transition: "0.3s ease-in-out",
              }}
            >
              <Grid container spacing={3}>
              {/* General Info */}
{/* General Info */}
<Grid item xs={12} md={6}>
  <Paper sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#1E8EAB" }}>
      General Information
    </Typography>
    <Stack spacing={1}>
      <Typography variant="body2">
        <PersonIcon sx={{ fontSize: 18, mr: 0.5 }} />
        <b>Name:</b> {client.fullName}
      </Typography>

      <Typography variant="body2">
        <EmailIcon sx={{ fontSize: 18, mr: 0.5 }} />
        <b>Email:</b> {client.email}
      </Typography>

      {/* إخفاء الكلية والقسم للجميع إلا العميل */}
      {client.requestedRole === "INSURANCE_CLIENT" && (
        <>
          <Typography variant="body2">
            <b>Faculty:</b> {client.faculty}
          </Typography>

          <Typography variant="body2">
            <b>Department:</b> {client.department}
          </Typography>
        </>
      )}
      
      <Typography variant="body2">
        <b>Employee ID:</b> {client.employeeId}
      </Typography>

      <Typography variant="body2">
        <b>Gender:</b> {client.gender}
      </Typography>

      <Typography variant="body2">
        <b>National ID:</b> {client.nationalId}
      </Typography>

      <Typography variant="body2">
        <b>Date of Birth:</b> {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : 'Not available'}
      </Typography>
    </Stack>
  </Paper>
</Grid>

<Grid item xs={12} md={6}>
  {/* فقط عرض هذا القسم للعميل الذي يمتلك دور INSURANCE_CLIENT */}
  {client.requestedRole === "INSURANCE_CLIENT" && (
    <>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#1E8EAB" }}>
        Chronic Diseases
      </Typography>
      <Stack spacing={1}>
        {/* عرض الأمراض المزمنة */}
        {client.chronicDiseases && client.chronicDiseases.length > 0 ? (
          client.chronicDiseases.map((disease, index) => (
            <Paper key={index} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
              {/* Disease Name */}
              <Typography variant="body2" fontWeight="bold">
                <b>{disease}</b>
              </Typography>

              {/* Disease Document Images */}
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {client.chronicDocumentPaths && client.chronicDocumentPaths.length > 0 ? (
                  client.chronicDocumentPaths.map((document, docIndex) => (
                    <Avatar
                      key={docIndex}
                      src={`${API_BASE_URL}${document}`}
                      alt={`Document ${docIndex + 1}`}
                      variant="rounded"
                      sx={{
                        width: 80,
                        height: 80,
                        cursor: "pointer",
                        border: "1px solid #ddd",
                      }}
                      onClick={() => {
                        setPreviewImage(`${API_BASE_URL}${document}`);
                        setOpenImageDialog(true); // Show the document in a dialog
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No documents uploaded
                  </Typography>
                )}
              </Stack>
            </Paper>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No chronic diseases listed
          </Typography>
        )}
      </Stack>
    </>
  )}
</Grid>

{/* Dialog to display enlarged image */}
<Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)} maxWidth="md">
  <DialogTitle>Document Preview</DialogTitle>
  <DialogContent dividers>
    {previewImage && (
      <img
        src={previewImage}
        alt="Document Preview"
        style={{ width: "100%", height: "auto", borderRadius: "10px" }}
      />
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenImageDialog(false)} color="primary">
      Close
    </Button>
  </DialogActions>
</Dialog>

                
                {/* Contact Info */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 1, color: "#1E8EAB" }}
                    >
                      Contact Info
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <PhoneIcon sx={{ fontSize: 18, mr: 0.5 }} />
                        <b>Phone:</b> {client.phone}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2">
                          <b>Status:</b>
                        </Typography>
                        <Chip
                          label={client.status}
                          color={client.status === "ACTIVE" ? "success" : "warning"}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>


                {/* Requested Role */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 1, color: "#1E8EAB" }}
                    >
                      Requested Role
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip label={client.requestedRole} color="secondary" />
                    </Box>
                  </Paper>
                </Grid>

                {/* University Card */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 1, color: "#1E8EAB" }}
                    >
                      University Card
                    </Typography>

                    {getUniversityCardSrc(client) ? (
                      <Avatar
                        src={getUniversityCardSrc(client)}
                        alt="University Card"
                        variant="rounded"
                        sx={{ width: 80, height: 100, cursor: "pointer" }}
                        onClick={() => {
                          setPreviewImage(getUniversityCardSrc(client));
                          setOpenImageDialog(true);
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No card uploaded
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Request Status */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 1, color: "#1E8EAB" }}
                    >
                      Request Status
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={client.roleRequestStatus}
                        color={getStatusColor(client.roleRequestStatus)}
                      />
                    </Box>
                    {client.roleRequestStatus === "REJECTED" && client.rejectReason && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mt: 1, fontStyle: "italic" }}
                      >
                        <b>Reason:</b> {client.rejectReason}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>

    {client.roleRequestStatus === "PENDING" && (
  <>
    <Divider sx={{ my: 2 }} />

    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => fetchClientFamily(client)}
      >
        👨‍👩‍👧‍👦 View Family
      </Button>

      <Button
        variant="contained"
        color="success"
        disabled={loadingId === client.id}
        onClick={() => handleApprove(client)}
        startIcon={
          loadingId === client.id ? <CircularProgress size={18} /> : null
        }
      >
        {loadingId === client.id ? "Approving..." : "Approve"}
      </Button>

      <Button
        variant="outlined"
        color="error"
        onClick={() => handleRejectClick(client)}
      >
        Reject
      </Button>
    </Box>
  </>
)}

            </Paper>
            ))
          )}
        </Box>
      </Box>

      {/* Reject Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Please provide a reason for rejecting{" "}
            <strong>{selectedClient?.fullName}</strong>:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleRejectConfirm}>
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Image Preview */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="md"
      >
        <DialogTitle>University Card</DialogTitle>
        <DialogContent dividers>
          {previewImage && (
            <img
              src={previewImage}
              alt="University Card"
              style={{ width: "100%", height: "auto", borderRadius: "10px" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
  open={openFamilyDialog}
  onClose={() => setOpenFamilyDialog(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>
    Family Members of {selectedClient?.fullName}
  </DialogTitle>

  <DialogContent dividers>
    {familyLoading ? (
      <Box textAlign="center">
        <CircularProgress />
      </Box>
    ) : familyMembers.length === 0 ? (
      <Typography color="text.secondary">
        No family members registered.
      </Typography>
    ) : (
      <Stack spacing={2}>
        {familyMembers.map((member) => (
         <Paper key={member.id} sx={{ p: 2, borderRadius: 2 }}>
  <Typography fontWeight="bold">
    {member.fullName}
  </Typography>

  <Typography variant="body2">
    <b>Relation:</b> {member.relation}
  </Typography>

  <Typography variant="body2">
    <b>National ID:</b> {member.nationalId}
  </Typography>

  {/* ✅ رقم التأمين */}
  <Typography variant="body2">
    <b>Insurance Number:</b>{" "}
    {member.insuranceNumber || "Not assigned"}
  </Typography>

  <Typography variant="body2">
    <b>Date of Birth:</b> {member.dateOfBirth}
  </Typography>

  {/* ✅ الحالة */}
  <Chip
    label={member.status}
    color={
      member.status === "APPROVED"
        ? "success"
        : member.status === "REJECTED"
        ? "error"
        : "warning"
    }
    size="small"
    sx={{ mt: 1 }}
  />

  {/* ✅ صور الوثائق */}
  <Divider sx={{ my: 1 }} />

  {member.documentImages && member.documentImages.length > 0 ? (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {member.documentImages.map((imagePath, index) => (
        <Avatar
          key={index}
          src={`${API_BASE_URL}${imagePath}`}
          variant="rounded"
          sx={{
            width: 80,
            height: 80,
            cursor: "pointer",
            border: "1px solid #ddd",
          }}
          onClick={() => {
            setPreviewImage(`${API_BASE_URL}${imagePath}`);
            setOpenImageDialog(true);
          }}
        />
      ))}
    </Stack>
  ) : (
    <Typography variant="body2" color="text.secondary">
      No documents uploaded
    </Typography>
  )}
</Paper>

        ))}
      </Stack>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenFamilyDialog(false)}>Close</Button>
  </DialogActions>
</Dialog>

    </Box>
  );
};

export default PendingRequestsClients;
