import React, { useState, useEffect } from "react";
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
import Header from "../MedicalAdminHeader";
import Sidebar from "../MedicalAdminSidebar";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import UploadIcon from "@mui/icons-material/Upload";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../../config/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const ClientListFinal = () => {
  const { language, isRTL } = useLanguage();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]); // Store all clients for filtering
const [filterRole, setFilterRole] = useState("INSURANCE_CLIENT");
  const [editClient, setEditClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [openFamilyDialog, setOpenFamilyDialog] = useState(false);
const [familyLoading, setFamilyLoading] = useState(false);
const [familyMembers, setFamilyMembers] = useState([]);
const [familyClient, setFamilyClient] = useState(null);
const [pendingFamily, setPendingFamily] = useState([]);

const getUniversityCardSrc = (client) => {
  const imgs = client?.universityCardImages || [];
  const last = imgs[imgs.length - 1];
  return last ? `${API_BASE_URL}${last}?t=${client.updatedAt || Date.now()}` : null;
};

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

  // ✅ Active clients → role فعلي
  if (client.status === "ACTIVE") {
    return roles.includes("INSURANCE_CLIENT");
  }

  // ✅ Inactive clients → كانوا Insurance Client
  if (client.status === "INACTIVE") {
    return requestedRole === "INSURANCE_CLIENT";
  }

  return false;
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

  const approveFamily = async (id) => {
  await api.patch(`/api/family-members/${id}/approve`);
  setPendingFamily((prev) => prev.filter((m) => m.id !== id));
};

const rejectFamily = async (id) => {
  await api.patch(`/api/family-members/${id}/reject`, { reason: "Rejected by admin" });
  setPendingFamily((prev) => prev.filter((m) => m.id !== id));
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

const updatedClient = { ...selectedClient, status: "INACTIVE" };
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
      await api.patch(`/api/clients/${client.id}/reactivate`);

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

 useEffect(() => {
  setClients(allClients); // allClients مسبقاً INSURANCE_CLIENT فقط
}, [filterRole, allClients]);

  // ✅ تقسيم العملاء حسب الحالة
  const activeClients = clients.filter((c) => c.status === "ACTIVE");
  const deactivatedClients = clients.filter((c) => c.status === "INACTIVE");
const fetchClientFamily = async (client) => {
  setFamilyClient(client);
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
useEffect(() => {
  const fetchPendingFamily = async () => {
    try {
      const res = await api.get("/api/family-members/pending");
      setPendingFamily(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch pending family updates", err);
    }
  };

  fetchPendingFamily();
}, []);

// ✅ فلترة الميمبرز بحيث نعرض فقط ميمبرز الكلاينتس ACTIVE
const activePendingFamily = pendingFamily.filter(
  (member) => member.clientStatus === "ACTIVE"
);

const groupedPendingFamily = activePendingFamily.reduce((acc, member) => {
  const clientId = member.clientId;

  if (!acc[clientId]) {
    acc[clientId] = {
      clientId,
      clientFullName: member.clientFullName,
      clientNationalId: member.clientNationalId,
      members: [],
    };
  }

  acc[clientId].members.push(member);
  return acc;
}, {});

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
              Filter by Role
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
  {[
    {
      role: "INSURANCE_CLIENT",
      label: "Insurance Client",
      count: allClients.length,
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
            Showing <strong>{clients.length}</strong> client{clients.length !== 1 ? 's' : ''}
            {filterRole !== "ALL" && ` with ${filterRole.replace('_', ' ')} role`}
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
              <Tab label={`${t("pendingFamilyUpdates", language)} (${pendingFamily.length})`} />
          </Tabs>
        {tabValue === 2 && (
  <Stack spacing={3}>
    {Object.values(groupedPendingFamily).length === 0 ? (
      <Typography color="text.secondary">
        {t("noPendingFamilyUpdates", language)}
      </Typography>
    ) : (
      Object.values(groupedPendingFamily).map((group) => (
        <Paper key={group.clientId} sx={{ p: 3, borderRadius: 3 }}>
          
          {/* 🔵 Client Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="#1E8EAB">
              👤 {group.clientFullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🆔 National ID: {group.clientNationalId}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* 👨‍👩‍👧‍👦 Family Members */}
          <Stack spacing={2}>
            {group.members.map((member) => (
              <Paper
                key={member.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2 }}
              >
                <Grid container spacing={2}>
                  {/* Documents */}
                  <Grid item xs={12} md={3}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {member.documentImages?.map((img, i) => (
                        <Avatar
                          key={i}
                          src={`${API_BASE_URL}${img}`}
                          variant="rounded"
                          sx={{ width: 70, height: 70 }}
                        />
                      ))}
                    </Stack>
                  </Grid>

                  {/* Member Info */}
                  <Grid item xs={12} md={9}>
                    <Typography fontWeight="bold">
                      {member.fullName}
                    </Typography>

                    <Typography variant="body2">
                      <b>Relation:</b> {member.relation}
                    </Typography>

                    <Typography variant="body2">
                      <b>National ID:</b> {member.nationalId}
                    </Typography>

                    <Typography variant="body2">
                      <b>Insurance #:</b>{" "}
                      {member.insuranceNumber || "N/A"}
                    </Typography>

                    <Typography variant="body2">
                      <b>Gender:</b> {member.gender}
                    </Typography>

                    <Typography variant="body2">
                      <b>Date of Birth:</b> {member.dateOfBirth}
                    </Typography>

                    <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => approveFamily(member.id)}
                      >
                        {t("approve", language)}
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => rejectFamily(member.id)}
                      >
                        {t("reject", language)}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Paper>
      ))
    )}
  </Stack>
)}



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

   

    {client.roles && client.roles.includes("INSURANCE_CLIENT") && (
      <>
        <Typography variant="body2">
          <b>Department:</b> {client.department || "N/A"}
        </Typography>
        <Typography variant="body2">
          <b>Faculty:</b> {client.faculty || "N/A"}
        </Typography>
      </>
    )}
  </Stack>
</Grid>


                  {/* Chronic Diseases Info with Documents (only for Insurance Clients) */}
{client.roles && client.roles.includes('INSURANCE_CLIENT') && (
  <Grid item xs={12} md={6}>
    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#1E8EAB" }}>
      Chronic Diseases
    </Typography>
    <Stack spacing={1}>
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
                      setOpenDialog(true); // Show the document in a dialog
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
  </Grid>
)}


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
  {/* ✅ زر عرض العائلة */}
  <Button
    variant="outlined"
    color="primary"
    onClick={() => fetchClientFamily(client)}
  >
    👨‍👩‍👧‍👦 View Family
  </Button>

  {client.status === "ACTIVE" ? (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleEditOpen(client)}
      >
        {t("edit", language)}
      </Button>

      <Button
        variant="contained"
        color="warning"
        onClick={() => handleDeactivateOpen(client)}
      >
        {t("deactivate", language)}
      </Button>
    </>
  ) : (
    <Button
      variant="contained"
      color="success"
      onClick={() => handleReactivate(client)}
    >
      {t("reactivate", language)}
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
        <DialogTitle>{t("editClient", language)}</DialogTitle>
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
          <Button onClick={handleEditClose}>{t("cancel", language)}</Button>
          <Button onClick={handleEditSave} variant="contained" color="success">
            {t("save", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* عرض البطاقة */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        <DialogTitle>{t("universityCard", language)}</DialogTitle>
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
            {t("close", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة سبب التعطيل */}
      <Dialog open={openDeactivateDialog} onClose={handleDeactivateClose}>
        <DialogTitle>{t("deactivateClient", language)}</DialogTitle>
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
          <Button onClick={handleDeactivateClose}>{t("cancel", language)}</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleDeactivateConfirm}
          >
            {t("confirmDeactivate", language)}
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
    {t("familyMembersOf", language)} {familyClient?.fullName}
  </DialogTitle>

  <DialogContent dividers>
    {familyLoading ? (
      <Typography>{t("loading", language)}</Typography>
    ) : familyMembers.length === 0 ? (
      <Typography color="text.secondary">
        {t("noFamilyMembersRegistered", language)}
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

  {/* ✅ صور الميمبر */}
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
          setOpenDialog(true);
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
    <Button onClick={() => setOpenFamilyDialog(false)}>{t("close", language)}</Button>
  </DialogActions>
</Dialog>

    </Box>
  );
};

export default ClientListFinal;
