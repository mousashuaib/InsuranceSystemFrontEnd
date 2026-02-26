// src/Component/Lab/LabRequestCard.jsx
import React, { memo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const LabRequestCard = memo(({
  request,
  index,
  status,
  familyMemberInfo,
  patientEmployeeId,
  displayAge,
  displayGender,
  formatDate,
  onOpenUploadDialog,
}) => {
  const { language } = useLanguage();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Get patient display info
  const isFamilyMember = !!familyMemberInfo;
  const patientName = isFamilyMember ? familyMemberInfo?.name : request.memberName;
  const patientAge = isFamilyMember ? familyMemberInfo?.age : displayAge;
  const patientGender = isFamilyMember ? familyMemberInfo?.gender : displayGender;

  // Get status-based styling
  const getStatusCardStyle = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case "pending":
        return { borderColor: "#FF9800", textColor: "#E65100" };
      case "in_progress":
        return { borderColor: "#2196F3", textColor: "#1565C0" };
      case "completed":
        return { borderColor: "#4CAF50", textColor: "#2E7D32" };
      case "rejected":
        return { borderColor: "#F44336", textColor: "#C62828" };
      default:
        return { borderColor: "#556B2F", textColor: "#556B2F" };
    }
  };

  const cardStyle = getStatusCardStyle(request.status);

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: `2px solid ${cardStyle.borderColor}30`,
          bgcolor: "#fff",
          overflow: "hidden",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: `0 12px 32px ${cardStyle.borderColor}20`,
            borderColor: cardStyle.borderColor,
          },
        }}
      >
        {/* Compact Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${cardStyle.borderColor} 0%, ${cardStyle.borderColor}dd 100%)`,
            px: 2,
            py: 1.5,
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <ScienceIcon sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                #{index + 1}
              </Typography>
            </Stack>
            <Chip
              label={status.label}
              size="small"
              sx={{
                bgcolor: "white",
                color: cardStyle.borderColor,
                fontWeight: 600,
                height: 24,
                fontSize: "0.7rem",
              }}
            />
          </Stack>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column" }}>
          {/* Patient Info - Compact */}
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
            <Avatar sx={{ bgcolor: cardStyle.borderColor, width: 44, height: 44 }}>
              <PersonIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" fontWeight={700} noWrap sx={{ color: "#1e293b" }}>
                {patientName || t("unknown", language)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                {patientAge && (
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {patientAge}
                  </Typography>
                )}
                {patientAge && patientGender && (
                  <Typography variant="caption" color="text.secondary">•</Typography>
                )}
                {patientGender && (
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {patientGender}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>

          {/* Employee ID */}
          {(patientEmployeeId || request.employeeId) && (
            <Box sx={{ mb: 2, px: 1.5, py: 1, bgcolor: "#f1f5f9", borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" fontWeight={600} color="#475569">
                {t("employeeId", language)}: {patientEmployeeId || request.employeeId}
              </Typography>
            </Box>
          )}

          {/* Family Member Indicator */}
          {isFamilyMember && (
            <Chip
              label={`${familyMemberInfo?.relation} ${t("ofRelation", language)} ${request.memberName}`}
              size="small"
              sx={{
                mb: 2,
                bgcolor: "#fef3c7",
                color: "#92400e",
                fontSize: "0.7rem",
                height: 24,
                fontWeight: 600,
              }}
            />
          )}

          {/* Lab Test + View Button */}
          <Box sx={{ mb: 2, flex: 1 }}>
            <Typography variant="caption" fontWeight={700} color="#556B2F" sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t("labTest", language)}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<VisibilityIcon />}
              onClick={() => setViewDialogOpen(true)}
              sx={{
                borderColor: "#556B2F",
                color: "#556B2F",
                textTransform: "none",
                "&:hover": { bgcolor: "#f5f5dc", borderColor: "#3D4F23" },
              }}
            >
              {t("viewTest", language)}
            </Button>
          </Box>

          {/* Issue Date - Compact */}
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ pt: 1, borderTop: "1px solid #f1f5f9" }}>
            <CalendarTodayIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {t("issued", language)}: {formatDate(request.createdAt)}
            </Typography>
          </Stack>
        </CardContent>

        {/* Action Buttons - Only for PENDING */}
        {(request.status?.toLowerCase() === "pending" || request.status?.toLowerCase() === "in_progress") && (
          <Box sx={{ p: 2, pt: 0 }}>
            <Button
              variant="contained"
              size="medium"
              fullWidth
              startIcon={<FileUploadIcon />}
              onClick={() => onOpenUploadDialog(request)}
              sx={{
                bgcolor: "#556B2F",
                fontWeight: 600,
                py: 1,
                "&:hover": { bgcolor: "#3D4F23" },
              }}
            >
              {t("uploadResult", language)}
            </Button>
          </Box>
        )}

        {/* Completed Status */}
        {request.status?.toLowerCase() === "completed" && (
          <Box sx={{ p: 2, pt: 0 }}>
            <Chip
              label={t("resultsSubmitted", language)}
              color="success"
              variant="outlined"
              sx={{ width: "100%" }}
            />
          </Box>
        )}
      </Card>

      {/* View Test Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#556B2F", color: "white", fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ScienceIcon />
            <span>{t("testDetails", language)}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t("patient", language)}: <b>{patientName}</b>
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ p: 2, bgcolor: "#fafaf5", borderRadius: 2, border: "1px solid #e8ede0" }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t("testName", language)}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="#1e293b">
                  {request.testName || t("unknownTest", language)}
                </Typography>
              </Box>
              {request.testType && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("testType", language)}
                  </Typography>
                  <Typography variant="body2" color="#1e293b">
                    {request.testType}
                  </Typography>
                </Box>
              )}
              {request.doctorName && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("requestingDoctor", language)}
                  </Typography>
                  <Typography variant="body2" color="#1e293b">
                    {language === "ar" ? `د. ${request.doctorName}` : `Dr. ${request.doctorName}`}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained" sx={{ bgcolor: "#556B2F" }}>
            {t("close", language)}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

LabRequestCard.propTypes = {
  request: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  status: PropTypes.shape({
    label: PropTypes.string,
    icon: PropTypes.node,
  }).isRequired,
  familyMemberInfo: PropTypes.object,
  patientEmployeeId: PropTypes.string,
  displayAge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayGender: PropTypes.string,
  formatDate: PropTypes.func.isRequired,
  onOpenUploadDialog: PropTypes.func.isRequired,
};

export default LabRequestCard;
