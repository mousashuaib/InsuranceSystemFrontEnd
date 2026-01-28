// src/Component/Pharmacist/PrescriptionCard.jsx
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
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import PersonIcon from "@mui/icons-material/Person";
import MedicationIcon from "@mui/icons-material/Medication";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";

const PrescriptionCard = memo(({
  prescription,
  index,
  status,
  patientEmployeeId,
  familyMemberInfo,
  isFamilyMember,
  displayAge,
  displayGender,
  formatDate,
  onVerify,
  onReject,
}) => {
  const { language } = useLanguage();
  const p = prescription;
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Get patient display info
  const patientName = isFamilyMember ? familyMemberInfo?.name : p.memberName;
  const patientAge = isFamilyMember ? familyMemberInfo?.age : displayAge;
  const patientGender = isFamilyMember ? familyMemberInfo?.gender : displayGender;

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: `2px solid ${status.textColor}30`,
          bgcolor: "#fff",
          overflow: "hidden",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: `0 12px 32px ${status.textColor}20`,
            borderColor: status.textColor,
          },
        }}
      >
        {/* Compact Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${status.textColor} 0%, ${status.textColor}dd 100%)`,
            px: 2,
            py: 1.5,
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <MedicationIcon sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                #{index + 1}
              </Typography>
              {p.isChronic && (
                <Chip
                  label={language === "ar" ? "مزمن" : "Chronic"}
                  size="small"
                  sx={{
                    bgcolor: "#dc2626",
                    color: "white",
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}
                />
              )}
            </Stack>
            <Chip
              label={status.label}
              size="small"
              sx={{
                bgcolor: "white",
                color: status.textColor,
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
            <Avatar sx={{ bgcolor: status.textColor, width: 44, height: 44 }}>
              <PersonIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" fontWeight={700} noWrap sx={{ color: "#1e293b" }}>
                {patientName || "Unknown"}
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
          {(patientEmployeeId || p.employeeId) && (
            <Box sx={{ mb: 2, px: 1.5, py: 1, bgcolor: "#f1f5f9", borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" fontWeight={600} color="#475569">
                {t("employeeId", language)}: {patientEmployeeId || p.employeeId}
              </Typography>
            </Box>
          )}

          {/* Family Member Indicator */}
          {isFamilyMember && (
            <Chip
              label={`${familyMemberInfo?.relation} ${language === "ar" ? "لـ" : "of"} ${p.memberName}`}
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

          {/* Medicine Count + View Button */}
          <Box sx={{ mb: 2, flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" fontWeight={700} color="#556B2F" sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t("medicines", language)}
              </Typography>
              <Chip
                label={p.items?.length || 0}
                size="small"
                sx={{ bgcolor: status.textColor, color: "white", height: 22, fontWeight: 700 }}
              />
            </Stack>
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
              {language === "ar" ? "عرض الأدوية" : "View Medicines"}
            </Button>
          </Box>

          {/* Issue Date - Compact */}
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ pt: 1, borderTop: "1px solid #f1f5f9" }}>
            <CalendarTodayIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {language === "ar" ? "تاريخ الإصدار:" : "Issued:"} {formatDate(p.createdAt)}
            </Typography>
          </Stack>
        </CardContent>

        {/* Action Buttons - Only for PENDING */}
        {p.status?.toLowerCase() === "pending" && (
          <Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="medium"
              fullWidth
              onClick={() => onVerify(p)}
              sx={{
                bgcolor: "#10b981",
                fontWeight: 600,
                py: 1,
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              💊 {language === "ar" ? "صرف" : "Dispense"}
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => onReject(p.id)}
              sx={{
                borderColor: "#ef4444",
                color: "#ef4444",
                minWidth: 48,
                py: 1,
                "&:hover": { bgcolor: "#fef2f2", borderColor: "#dc2626" },
              }}
            >
              ❌
            </Button>
          </Box>
        )}
      </Card>

      {/* View Medicines Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#556B2F", color: "white", fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MedicationIcon />
            <span>{language === "ar" ? "قائمة الأدوية" : "Medicines List"}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {language === "ar" ? "المريض:" : "Patient:"} <b>{patientName}</b>
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {p.items && p.items.length > 0 ? (
            <Stack spacing={1.5}>
              {p.items.map((item, idx) => (
                <Box key={idx} sx={{ p: 1.5, bgcolor: "#fafaf5", borderRadius: 2, border: "1px solid #e8ede0" }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#556B2F", flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="#1e293b">
                        {item.medicineName}
                      </Typography>
                      {item.scientificName && (
                        <Typography variant="caption" color="text.secondary">
                          {item.scientificName}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
              {language === "ar" ? "لا توجد أدوية" : "No medicines"}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained" sx={{ bgcolor: "#556B2F" }}>
            {language === "ar" ? "إغلاق" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

PrescriptionCard.propTypes = {
  prescription: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  status: PropTypes.shape({
    label: PropTypes.string,
    icon: PropTypes.node,
    bgcolor: PropTypes.string,
    textColor: PropTypes.string,
  }).isRequired,
  patientEmployeeId: PropTypes.string,
  familyMemberInfo: PropTypes.object,
  isFamilyMember: PropTypes.bool,
  displayAge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayGender: PropTypes.string,
  formatDate: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};

export default PrescriptionCard;
