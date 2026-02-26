import React from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const ClaimFormSection = ({
  claimForm,
  setClaimForm,
  snackbar,
  setSnackbar,
  onClaimSubmit,
  onSkipClaim,
  isFollowUpVisit = false,
}) => {
  const { language, isRTL } = useLanguage();

  const toLatinDigits = (input) => {
    if (input === null || input === undefined) return "";
    const s = String(input);
    const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
    const latin = "0123456789";
    return s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (ch) => latin[arabicIndic.indexOf(ch)]);
  };

  return (
    <>
      <Box sx={{ mt: 3, px: { xs: 2, md: 4 } }} dir={isRTL ? "rtl" : "ltr"}>
        <Paper
          elevation={6}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            p: { xs: 3, md: 4 },
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={700}>
              ✅ {t("requestsCreated", language)}
            </Typography>
          </Stack>

          {isFollowUpVisit && (
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                p: 2,
                mb: 2,
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                border: "2px solid #f59e0b",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#92400e" }}>
                ⚠️ {t("followUpVisit", language) || "Follow-up Visit"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#78350f", mt: 0.5 }}>
                {t("followUpClaimZero", language) || "Insurance claim amount is 0. The patient pays the consultation fee directly to the doctor."}
              </Typography>
            </Paper>
          )}

          <Paper
            elevation={4}
            sx={{
              borderRadius: 4,
              p: { xs: 2, md: 3.5 },
              background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
            }}
          >
            <Box
              component="form"
              onSubmit={onClaimSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              {/* Claim Fields */}
              <TextField
                label={`📝 ${t("claimDescription", language)}`}
                name="description"
                value={claimForm.description}
                onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                placeholder={t("claimDescriptionPlaceholder", language)}
                fullWidth
                required
                multiline
                rows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    "& fieldset": { borderColor: "#10b981" },
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#10b981",
                      boxShadow: "0 0 0 2px rgba(16,185,129,0.15)",
                    },
                  },
                }}
              />

              <TextField
                label={`💰 ${t("claimAmount", language)}`}
                name="amount"
                type="text"
                value={toLatinDigits(claimForm.amount)}
                placeholder={t("autoFilledFromSpecialization", language)}
                fullWidth
                required
                InputProps={{ readOnly: true }}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    "& fieldset": { borderColor: "#10b981" },
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#10b981",
                      boxShadow: "0 0 0 2px rgba(16,185,129,0.15)",
                    },
                  },
                }}
              />

              {/* Document Upload */}
              <Box sx={{ position: "relative" }}>
                <input
                  type="file"
                  name="document"
                  onChange={(e) => setClaimForm({ ...claimForm, document: e.target.files?.[0] })}
                  required
                  accept="image/*,application/pdf"
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                />
                <Box
                  sx={{
                    padding: 3,
                    borderRadius: 2.5,
                    border: "2px dashed #10b981",
                    backgroundColor: "#ecfdf5",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#d1fae5",
                      borderColor: "#059669",
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ color: "#10b981", fontWeight: 700, mb: 1 }}>
                    📄 {t("uploadDocumentRequired", language)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#047857", mb: 1 }}>
                    {claimForm.document
                      ? `✅ ${claimForm.document.name}`
                      : t("clickToUploadImageOrPdf", language)}
                  </Typography>
                </Box>
              </Box>

              {/* Buttons */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    px: 4,
                    py: 1.4,
                    borderRadius: 3,
                    fontWeight: 700,
                    background: "linear-gradient(90deg, #10b981, #059669)",
                    boxShadow: "0 12px 24px rgba(16,185,129,0.25)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #059669, #10b981)",
                    },
                    flex: 1,
                  }}
                >
                  💳 {t("createClaim", language)}
                </Button>

                <Button
                  variant="outlined"
                  onClick={onSkipClaim}
                  sx={{
                    px: 4,
                    py: 1.4,
                    borderRadius: 3,
                    fontWeight: 700,
                    borderColor: "#10b981",
                    color: "#10b981",
                    flex: 1,
                    "&:hover": {
                      borderColor: "#059669",
                      backgroundColor: "#ecfdf5",
                    },
                  }}
                >
                  ⏭️ {t("skipClaim", language)}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? 8000 : 5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          "& .MuiSnackbar-root": {
            top: "80px !important",
          },
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{
            width: "100%",
            minWidth: "400px",
            maxWidth: "700px",
            fontSize: "1rem",
            fontWeight: 600,
            whiteSpace: "pre-line",
            borderRadius: 3,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            "& .MuiAlert-icon": {
              fontSize: "1.5rem",
            },
            ...(snackbar.severity === "error" && {
              backgroundColor: "#ef4444",
              color: "white",
              "& .MuiAlert-icon": {
                color: "white",
              },
              "& .MuiAlert-action .MuiIconButton-root": {
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              },
            }),
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClaimFormSection;
