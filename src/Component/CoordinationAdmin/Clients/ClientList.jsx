import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Avatar,
  Button,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import Header from "../CoordinationHeader";
import Sidebar from "../CoordinationSidebar";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import UploadIcon from "@mui/icons-material/Upload";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../../config/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const getUniversityCardSrc = (client) => {
  const imgs = client?.universityCardImages || [];
  const last = imgs[imgs.length - 1];
  return last ? `${API_BASE_URL}${last}?t=${client.updatedAt || Date.now()}` : null;
};

const ClientList = () => {
  const { language, isRTL } = useLanguage();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]); // Store all clients for filtering
  const [filterRole, setFilterRole] = useState("ALL"); // Filter by role
  const [editClient, setEditClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  // ✅ تمت الإضافة
  const [tabValue, setTabValue] = useState(0); // 0 = Active, 1 = Deactivated

  // ✅ جلب البيانات
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.CLIENTS.LIST);
const filtered = res.data.filter((client) => {
  const roles = (client.roles || []).map((r) => r.toUpperCase());
  const requestedRole = client.requestedRole?.toUpperCase();

  // ✅ الحسابات المعطلة: نعرضها فقط إذا لم تكن Client
  if (client.status === "INACTIVE") {
    return requestedRole !== "INSURANCE_CLIENT";
  }

  // ✅ الحسابات النشطة: نعرض غير الكلاينت وغير المدراء
  return (
    roles.length > 0 &&
    !roles.includes("INSURANCE_CLIENT") &&
    !roles.includes("INSURANCE_MANAGER") &&
    !roles.includes("COORDINATION_ADMIN")
  );
});

const sorted = filtered.sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
);
setAllClients(sorted);
setClients(sorted);


      } catch (err) {
        console.error(
          "❌ Failed to load clients:",
          err.response?.data || err.message
        );
      }
    };

    fetchClients();
  }, []);

  // ✅ فتح نافذة التعديل
  const handleEditOpen = (client) => {
    setEditClient(client);
    setFormData({
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
  universityCardFile: null, // اسم واضح (File)
    });
    setPreviewImage(null);
  };

  const handleEditClose = () => {
    setEditClient(null);
    setFormData({});
    setPreviewImage(null);
  };

  // ✅ تحديث البيانات
  const handleEditSave = async () => {
    try {
      const data = new FormData();
      data.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
            }),
          ],
          { type: "application/json" }
        )
      );

     if (formData.universityCardFile) {
  data.append("universityCard", formData.universityCardFile);
}


      const res = await api.patch(
        `/api/clients/update/${editClient.id}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedClient = res.data;
      setAllClients((prev) =>
        prev.map((c) => (c.id === editClient.id ? updatedClient : c))
      );
      setClients((prev) =>
        prev.map((c) => (c.id === editClient.id ? updatedClient : c))
      );

      handleEditClose();
    } catch (err) {
      console.error("❌ Update failed:", err.response?.data || err.message);
      alert("Update failed, check console.");
    }
  };



  // ✅ فتح نافذة التعطيل
  const handleDeactivateOpen = (client) => {
    setSelectedClient(client);
    setDeactivateReason("");
    setOpenDeactivateDialog(true);
  };

  const handleDeactivateClose = () => {
    setSelectedClient(null);
    setDeactivateReason("");
    setOpenDeactivateDialog(false);
  };

  // ✅ تنفيذ التعطيل
  const handleDeactivateConfirm = async () => {
    try {
  await api.patch(
    `/api/clients/${selectedClient.id}/deactivate`,
    { reason: deactivateReason }
  );

  const updatedClient = { ...selectedClient, status: "DEACTIVATED" };
  setAllClients((prev) =>
    prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
  );
  setClients((prev) =>
    prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
  );

  alert(`✅ ${selectedClient.fullName} has been deactivated.`);
  handleDeactivateClose();
} catch (err) {
  console.error("❌ Deactivate failed:", err.response?.data || err.message);
  alert("Deactivate failed, check console.");
}

  };

  // ✅ إعادة التفعيل
  const handleReactivate = async (client) => {
    try {
      await api.patch(`/api/clients/${client.id}/reactivate`, {});

      const updatedClient = { ...client, status: "ACTIVE" };
      setAllClients((prev) =>
        prev.map((c) => (c.id === client.id ? updatedClient : c))
      );
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? updatedClient : c))
      );

      alert(`✅ ${client.fullName} has been reactivated.`);
    } catch (err) {
      console.error("❌ Reactivate failed:", err.response?.data || err.message);
      alert("Reactivate failed, check console.");
    }
  };

  // Filter clients by role using useMemo
  const filteredClients = useMemo(() => {
    if (filterRole === "ALL") {
      return allClients;
    }
    return allClients.filter((client) => {
      const roles = client.roles || [];
      return roles.some(
        (role) => role.toUpperCase() === filterRole.toUpperCase()
      );
    });
  }, [filterRole, allClients]);

  // Update clients state when filtered changes
  useEffect(() => {
    setClients(filteredClients);
  }, [filteredClients]);

  // Memoized client separation by status
  const activeClients = useMemo(() => clients.filter((c) => c.status === "ACTIVE"), [clients]);
  const deactivatedClients = useMemo(() => clients.filter((c) => c.status === "INACTIVE"), [clients]);

  // Memoized role filter counts
  const roleFilterCounts = useMemo(() => ({
    all: allClients.length,
    doctor: allClients.filter((c) => (c.roles || []).some((r) => r.toUpperCase() === "DOCTOR")).length,
    pharmacist: allClients.filter((c) => (c.roles || []).some((r) => r.toUpperCase() === "PHARMACIST")).length,
    radiologist: allClients.filter((c) => (c.roles || []).some((r) => r.toUpperCase() === "RADIOLOGIST")).length,
    labTech: allClients.filter((c) => (c.roles || []).some((r) => r.toUpperCase() === "LAB_TECH")).length,
  }), [allClients]);



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
            gutterBottom
            sx={{ color: "#120460", display: "flex", alignItems: "center" }}
          >
            <AssignmentIndIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 35, color: "#1E8EAB" }} />
            {t("clients", language)}
          </Typography>

          {/* Role Filter */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
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
              {t("filterByRole", language)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { role: "ALL", label: t("all", language), count: roleFilterCounts.all },
                { role: "DOCTOR", label: t("doctor", language), count: roleFilterCounts.doctor },
                { role: "PHARMACIST", label: t("pharmacist", language), count: roleFilterCounts.pharmacist },
                { role: "RADIOLOGIST", label: t("radiologist", language), count: roleFilterCounts.radiologist },
                { role: "LAB_TECH", label: t("labTech", language), count: roleFilterCounts.labTech },
              ].map(({ role, label, count }) => (
                <Chip
                  key={role}
                  label={`${label} (${count})`}
                  onClick={() => setFilterRole(role)}
                  variant={filterRole === role ? "filled" : "outlined"}
                  color={filterRole === role ? "primary" : "default"}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                />
              ))}
            </Stack>
          </Paper>

          {/* Results Count */}
          <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
            {t("showingClients", language)} <strong>{clients.length}</strong> {clients.length !== 1 ? t("clientsCount", language) : t("clientCount", language)}
            {filterRole !== "ALL" && ` ${t("withRole", language)} ${filterRole.replace('_', ' ')} ${t("role", language)}`}
          </Typography>

          {/* ✅ التبويبين */}
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              mb: 2,
              boxShadow: 1,
            }}
          >
            <Tab label={`${t("activeClients", language)} (${activeClients.length})`} />
            <Tab label={`${t("deactivatedClients", language)} (${deactivatedClients.length})`} />
    </Tabs>



          <Divider sx={{ my: 3 }} />
{tabValue !== 2 &&
  (tabValue === 0 ? activeClients : deactivatedClients).map(

            (client) => (
              <Paper
                key={client.id}
                sx={{ p: 3, borderRadius: 3, boxShadow: 3, mb: 3 }}
              >
                <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#1E8EAB" }}>
    General Info
  </Typography>
  <Stack spacing={1}>
    {/* عرض البيانات العامة */}
    <Typography variant="body2">
      <PersonIcon sx={{ fontSize: 18, mr: 0.5 }} />
      <b>Name:</b> {client.fullName}
    </Typography>
    <Typography variant="body2">
      <EmailIcon sx={{ fontSize: 18, mr: 0.5 }} />
      <b>Email:</b> {client.email}
    </Typography>
    <Typography variant="body2">
      <b>Gender:</b> {client.gender}
    </Typography>
    <Typography variant="body2">
      <b>Date of Birth:</b> {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : 'Not available'}
    </Typography>
    <Typography variant="body2">
      <b>National ID:</b> {client.nationalId}
    </Typography>
    <Typography variant="body2">
      <b>Employee ID:</b> {client.employeeId}
    </Typography>

    {/* عرض بيانات إضافية بناءً على الدور */}
    {client.roles && client.roles.includes("DOCTOR") && (
      <>
        <Typography variant="body2">
          <b>Specialization:</b> {client.specialization || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Doctor Specialization:</b> {client.doctorSpecialization?.name || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Clinic Location:</b> {client.clinicLocation || "N/A"}
        </Typography>
      </>
    )}

    {client.roles && client.roles.includes("RADIOLOGIST") && (
      <>
        <Typography variant="body2">
          <b>Radiology Code:</b> {client.radiologyCode || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Radiology Name:</b> {client.radiologyName || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Radiology Location:</b> {client.radiologyLocation || "N/A"}
        </Typography>
      </>
    )}

    {client.roles && client.roles.includes("LAB_TECH") && (
      <>
        <Typography variant="body2">
          <b>Lab Code:</b> {client.labCode || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Lab Name:</b> {client.labName || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Lab Location:</b> {client.labLocation || "N/A"}
        </Typography>
      </>
    )}

    {client.roles && client.roles.includes("PHARMACIST") && (
      <>
        <Typography variant="body2">
          <b>Pharmacy Code:</b> {client.pharmacyCode || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Pharmacy Name:</b> {client.pharmacyName || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Pharmacy Location:</b> {client.pharmacyLocation || "N/A"}
        </Typography>
      </>
    )}

    
  </Stack>
</Grid>


                  {/* Contact Info */}
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ color: "#1E8EAB" }}
                    >
                      Contact Info
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <PhoneIcon sx={{ fontSize: 18, mr: 0.5 }} />
                        <b>Phone:</b> {client.phone}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2">
                          <b>Status:</b>
                        </Typography>
                        <Chip
                          label={client.status}
                          color={
                            client.status === "ACTIVE" ? "success" : "error"
                          }
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Extra Info */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 1, color: "#1E8EAB" }}
                      >
                        Roles
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        {client.roles && client.roles.length > 0 ? (
                          client.roles.map((role, i) => (
                            <Chip key={i} label={role} color="primary" size="small" />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No roles assigned
                          </Typography>
                        )}
                      </Stack>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">
                        <b>Requested Role:</b> {client.requestedRole || "None"}
                      </Typography>
                      <Typography variant="subtitle2">
                        <b>Role Request Status:</b> {client.roleRequestStatus || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="gray" sx={{ mt: 1 }}>
                        <b>Created At:</b>{" "}
                        {new Date(client.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="gray">
                        <b>Updated At:</b>{" "}
                        {new Date(client.updatedAt).toLocaleString()}
                      </Typography>
                    </Paper>
                    
                  </Grid>

                  {/* University Card */}
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ color: "#1E8EAB" }}
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
      setOpenDialog(true);
    }}
  />
) : (
  <Typography variant="body2" color="text.secondary">
    No card uploaded
  </Typography>
)}

                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
  

  {client.status === "ACTIVE" ? (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleEditOpen(client)}
      >
        Edit
      </Button>

      <Button
        variant="contained"
        color="warning"
        onClick={() => handleDeactivateOpen(client)}
      >
        Deactivate
      </Button>
    </>
  ) : (
    <Button
      variant="contained"
      color="success"
      onClick={() => handleReactivate(client)}
    >
      Reactivate
    </Button>
  )}
</Box>

              </Paper>
            )
          )}
        </Box>
      </Box>

      {/* باقي النوافذ بدون تغيير */}
      <Dialog open={!!editClient} onClose={handleEditClose}>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              value={formData.fullName || ""}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              fullWidth
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload University Card
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
setFormData({ ...formData, universityCardFile: file });
setPreviewImage(URL.createObjectURL(file));
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }}
              />
            </Button>
            {previewImage && (
              <Avatar
                src={previewImage}
                alt="Preview"
                variant="rounded"
                sx={{ width: 100, height: 120 }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="success">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* عرض البطاقة */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        <DialogTitle>University Card</DialogTitle>
        <DialogContent dividers>
          {previewImage && (
            <img
              src={previewImage}
              alt="University Card Full"
              style={{ width: "100%", height: "auto", borderRadius: "10px" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة سبب التعطيل */}
      <Dialog open={openDeactivateDialog} onClose={handleDeactivateClose}>
        <DialogTitle>Deactivate Client</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Please enter a reason for deactivating{" "}
            <strong>{selectedClient?.fullName}</strong>:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeactivateClose}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleDeactivateConfirm}
          >
            Confirm Deactivate
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ClientList;
