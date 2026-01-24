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
} from "@mui/material";
import Header from "../Header";
import Sidebar from "../Sidebar";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import UploadIcon from "@mui/icons-material/Upload";
import axios from "axios";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const ClientList = () => {
  const { language, isRTL } = useLanguage();
  const [clients, setClients] = useState([]);
  const [editClient, setEditClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState(null); // 👈 صورة للعرض المؤقت
  const [openDialog, setOpenDialog] = useState(false);   // 👈 نافذة تكبير الصورة

  // ✅ جلب البيانات
  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠️ Please login again.");
        return;
      }

      try {
        const res = await axios.get("http://localhost:8080/api/Clients/list", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // استثناء المدير
        const filtered = res.data.filter(
          (client) => !client.roles.includes("INSURANCE_MANAGER")
        );
        setClients(filtered);
      } catch (err) {
        console.error("❌ Failed to load clients:", err.response?.data || err.message);
      }
    };

    fetchClients();
  }, []);

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Please login again.");
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/api/Clients/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("❌ Delete failed:", err.response?.data || err.message);
      alert("Delete failed, check console.");
    }
  };

  // ✅ فتح نافذة التعديل
  const handleEditOpen = (client) => {
    setEditClient(client);
    setFormData({
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      universityCardImage: null,
    });
    setPreviewImage(null);
  };

  const handleEditClose = () => {
    setEditClient(null);
    setFormData({});
    setPreviewImage(null);
  };

  // ✅ تحديث
  const handleEditSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Please login again.");
      return;
    }

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

      if (formData.universityCardImage) {
        data.append("universityCard", formData.universityCardImage);
      }

      const res = await axios.patch(
        `http://localhost:8080/api/Clients/update/${editClient.id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setClients((prev) =>
        prev.map((c) => (c.id === editClient.id ? res.data : c))
      );

      handleEditClose();
    } catch (err) {
      console.error("❌ Update failed:", err.response?.data || err.message);
      alert("Update failed, check console.");
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        dir={isRTL ? "rtl" : "ltr"}
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

          <Divider sx={{ my: 3 }} />

          {clients.map((client) => (
            <Paper
              key={client.id}
              sx={{ p: 3, borderRadius: 3, boxShadow: 3, mb: 3 }}
            >
              <Grid container spacing={3}>
                {/* General Info */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ color: "#1E8EAB" }}
                  >
                    {t("generalInformationTitle", language)}
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">
                        <b>Status:</b>
                      </Typography>
                      <Chip
                        label={client.status}
                        color={client.status === "ACTIVE" ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>

                {/* Extra Info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    <b>Requested Role:</b> {client.requestedRole || "None"}
                  </Typography>
                  <Typography variant="subtitle2">
                    <b>Role Request Status:</b> {client.roleRequestStatus}
                  </Typography>
                  <Typography variant="body2" color="gray">
                    <b>Created At:</b>{" "}
                    {new Date(client.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="gray">
                    <b>Updated At:</b>{" "}
                    {new Date(client.updatedAt).toLocaleString()}
                  </Typography>
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
                  {client.universityCardImage ? (
                    <>
                      <Avatar
                        src={`http://localhost:8080${client.universityCardImage}`}
                        alt="University Card"
                        variant="rounded"
                        sx={{ width: 80, height: 100, cursor: "pointer" }}
                        onClick={() => {
                          setPreviewImage(
                            `http://localhost:8080${client.universityCardImage}`
                          );
                          setOpenDialog(true);
                        }}
                      />
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No card uploaded
                    </Typography>
                  )}
                </Grid>
              </Grid>

              {/* Actions */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleEditOpen(client)}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDelete(client.id)}
                >
                  Delete
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Edit Dialog */}
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

            {/* Upload Image */}
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
                    setFormData({ ...formData, universityCardImage: file });
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

      {/* Image Preview Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        <DialogTitle>University Card</DialogTitle>
        <DialogContent dividers>
          {previewImage && (
            <img
              src={previewImage}
              alt="University Card Full"
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "10px",
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientList;
