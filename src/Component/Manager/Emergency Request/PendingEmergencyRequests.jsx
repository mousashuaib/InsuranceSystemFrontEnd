import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import axios from "axios";

import ManagerSidebar from "../Sidebar";
import ManagerHeader from "../Header";

import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import EventIcon from "@mui/icons-material/Event";
import NoteIcon from "@mui/icons-material/Note";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/HourglassEmpty";

const PendingEmergencyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ حالة تحميل
  const [error, setError] = useState(null); // ✅ حالة خطأ
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState(null);

  // Note: EMERGENCY_MANAGER role was removed - this component is now Manager-only

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://localhost:8080", // عدل حسب سيرفرك
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/api/emergencies/all");
        setRequests(res.data);
      } catch (err) {
        console.error("❌ Error fetching emergency requests:", err.response || err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch emergency requests"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircleIcon sx={{ color: "green", mr: 1 }} />;
      case "REJECTED":
        return <CancelIcon sx={{ color: "red", mr: 1 }} />;
      default:
        return <PendingIcon sx={{ color: "orange", mr: 1 }} />;
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await api.patch(`/api/emergencies/${id}/approve`);
      setRequests((prev) => prev.map((req) => (req.id === id ? res.data : req)));
    } catch (err) {
      console.error("❌ Error approving request:", err.response || err);
      alert("Failed to approve request!");
    }
  };

  const handleReject = (id) => {
    setCurrentRequestId(id);
    setOpenRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    try {
      const res = await api.patch(`/api/emergencies/${currentRequestId}/reject`, {
        reason: rejectReason,
      });
      setRequests((prev) =>
        prev.map((req) => (req.id === currentRequestId ? res.data : req))
      );
    } catch (err) {
      console.error("❌ Error rejecting request:", err.response || err);
      alert("Failed to reject request!");
    } finally {
      setOpenRejectDialog(false);
      setRejectReason("");
      setCurrentRequestId(null);
    }
  };

  // ✅ عرض الحالة حسب الوضع
  if (loading) {
    return <Typography sx={{ p: 3 }}>⏳ Loading Pending Emergency Requests...</Typography>;
  }

  if (error) {
    return (
      <Typography sx={{ p: 3, color: "red" }}>
        ⚠️ Error: {error}
      </Typography>
    );
  }

  if (!requests.length) {
    return <Typography sx={{ p: 3 }}>📭 No pending emergency requests found.</Typography>;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <ManagerSidebar />

      <Box sx={{ flexGrow: 1, background: "#f9fafc", minHeight: "100vh", marginLeft: "240px" }}>
        <ManagerHeader />

        <Box sx={{ p: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#120460", mb: 3 }}>
            Pending Emergency Requests
          </Typography>

          {requests.map((req) => (
            <Paper key={req.id} sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
              <Grid container spacing={3}>
                {/* General Info */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#1E8EAB", mb: 1 }}>
                      General Information
                    </Typography>
                    <Typography><PersonIcon sx={{ mr: 1 }} /> <b>Member:</b> {req.memberName}</Typography>
                    <Typography><PhoneIcon sx={{ mr: 1 }} /> <b>Phone:</b> {req.contactPhone}</Typography>
                    <Typography><LocationOnIcon sx={{ mr: 1 }} /> <b>Location:</b> {req.location}</Typography>
                  </Paper>
                </Grid>

                {/* Emergency Details */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#1E8EAB", mb: 1 }}>
                      Emergency Details
                    </Typography>
                    <Typography><DescriptionIcon sx={{ mr: 1 }} /> <b>Description:</b> {req.description}</Typography>
                    <Typography><EventIcon sx={{ mr: 1 }} /> <b>Incident Date:</b> {req.incidentDate}</Typography>
                    <Typography><NoteIcon sx={{ mr: 1 }} /> <b>Notes:</b> {req.notes}</Typography>
                  </Paper>
                </Grid>

                {/* Status & Metadata */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#1E8EAB", mb: 1 }}>
                      Status & Metadata
                    </Typography>
                    <Typography>
                      {getStatusIcon(req.status)} <b>Status:</b>{" "}
                      <span style={{ color: req.status === "APPROVED" ? "green" : req.status === "REJECTED" ? "red" : "orange", fontWeight: "bold" }}>
                        {req.status}
                      </span>
                    </Typography>
                    <Typography><AccessTimeIcon sx={{ mr: 1 }} /> <b>Submitted At:</b> {new Date(req.submittedAt).toLocaleString()}</Typography>
                    {req.approvedAt && <Typography><CheckCircleIcon sx={{ mr: 1 }} /> <b>Approved At:</b> {new Date(req.approvedAt).toLocaleString()}</Typography>}
                    {req.rejectedAt && <Typography><CancelIcon sx={{ mr: 1 }} /> <b>Rejected At:</b> {new Date(req.rejectedAt).toLocaleString()}</Typography>}
                    {req.rejectionReason && <Typography sx={{ color: "red" }}><NoteIcon sx={{ mr: 1 }} /> <b>Reason:</b> {req.rejectionReason}</Typography>}
                  </Paper>
                </Grid>
              </Grid>

              {/* Actions */}
              {req.status === "PENDING" && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
                  <Button variant="contained" color="success" onClick={() => handleApprove(req.id)} sx={{ px: 4 }}>
                    Approve
                  </Button>
                  <Button variant="contained" color="error" onClick={() => handleReject(req.id)} sx={{ px: 4 }}>
                    Reject
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>Reject Emergency Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button color="error" onClick={handleConfirmReject}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingEmergencyRequests;
