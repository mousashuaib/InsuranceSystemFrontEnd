import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Stack,
  IconButton,
  Divider,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  createFilterOptions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const filter = createFilterOptions();

// Helper function to get coverage status display info
const getCoverageStatusInfo = (coverageStatus, coveragePercentage, language) => {
  switch (coverageStatus) {
    case "COVERED":
      return {
        label: language === "ar" ? `مغطى ${coveragePercentage || 100}%` : `Covered ${coveragePercentage || 100}%`,
        color: "success",
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
        bgColor: "#e8f5e9",
        borderColor: "#4caf50",
      };
    case "REQUIRES_APPROVAL":
      return {
        label: language === "ar" ? "يحتاج موافقة" : "Requires Approval",
        color: "warning",
        icon: <WarningIcon sx={{ fontSize: 16 }} />,
        bgColor: "#fff3e0",
        borderColor: "#ff9800",
      };
    case "NOT_COVERED":
      return {
        label: language === "ar" ? "غير مغطى" : "Not Covered",
        color: "error",
        icon: <CancelIcon sx={{ fontSize: 16 }} />,
        bgColor: "#ffebee",
        borderColor: "#f44336",
      };
    default:
      return {
        label: language === "ar" ? "مغطى" : "Covered",
        color: "success",
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
        bgColor: "#e8f5e9",
        borderColor: "#4caf50",
      };
  }
};

const TestsSection = ({
  selectedLabTests,
  selectedRadiologyTests,
  availableLabTests,
  availableRadiologyTests,
  selectedLabTestValue,
  selectedRadiologyTestValue,
  setSelectedLabTestValue,
  setSelectedRadiologyTestValue,
  hasSameSpecializationRestriction,
  onAddLabTest,
  onAddRadiologyTest,
  onRemoveLabTest,
  onRemoveRadiologyTest,
  activeSubTab,
}) => {
  const { language, isRTL } = useLanguage();

  // State for custom lab test dialog
  const [addLabTestDialogOpen, setAddLabTestDialogOpen] = useState(false);
  const [newLabTestName, setNewLabTestName] = useState("");

  // State for custom radiology test dialog
  const [addRadiologyTestDialogOpen, setAddRadiologyTestDialogOpen] = useState(false);
  const [newRadiologyTestName, setNewRadiologyTestName] = useState("");

  // Handler for adding custom lab test
  const handleAddCustomLabTest = () => {
    if (newLabTestName.trim()) {
      const customLabTest = {
        id: `custom-lab-${Date.now()}`,
        serviceName: newLabTestName.trim(),
        name: newLabTestName.trim(),
        coverageStatus: "NOT_COVERED",
        coveragePercentage: 0,
        isCustom: true,
      };
      onAddLabTest(customLabTest);
      setNewLabTestName("");
      setAddLabTestDialogOpen(false);
      setSelectedLabTestValue(null);
    }
  };

  // Handler for adding custom radiology test
  const handleAddCustomRadiologyTest = () => {
    if (newRadiologyTestName.trim()) {
      const customRadiologyTest = {
        id: `custom-radiology-${Date.now()}`,
        serviceName: newRadiologyTestName.trim(),
        name: newRadiologyTestName.trim(),
        coverageStatus: "NOT_COVERED",
        coveragePercentage: 0,
        isCustom: true,
      };
      onAddRadiologyTest(customRadiologyTest);
      setNewRadiologyTestName("");
      setAddRadiologyTestDialogOpen(false);
      setSelectedRadiologyTestValue(null);
    }
  };

  return (
    <>
      {/* Lab Tests */}
      {activeSubTab === 0 && (
        <Stack spacing={3} dir={isRTL ? "rtl" : "ltr"}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              {t("addLabTest", language)}
              {availableLabTests.length === 0 && (
                <Typography variant="caption" color="warning.main" sx={{ ml: isRTL ? 0 : 1, mr: isRTL ? 1 : 0 }}>
                  ({t("noLabTestsAvailable", language)})
                </Typography>
              )}
            </Typography>
            <Autocomplete
              value={selectedLabTestValue}
              options={availableLabTests}
              freeSolo
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                if (option.inputValue) return option.inputValue;
                return option.serviceName || option.name || "";
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(event, newValue) => {
                if (typeof newValue === "string") {
                  // User typed something and pressed enter
                  setNewLabTestName(newValue);
                  setAddLabTestDialogOpen(true);
                } else if (newValue && newValue.inputValue) {
                  // User selected "Add new" option
                  setNewLabTestName(newValue.inputValue);
                  setAddLabTestDialogOpen(true);
                } else if (newValue) {
                  onAddLabTest(newValue);
                  setSelectedLabTestValue(null);
                }
              }}
              disabled={hasSameSpecializationRestriction}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Check if any option matches the input exactly
                const isExisting = options.some(
                  (option) =>
                    (option.serviceName || option.name || "").toLowerCase() === inputValue.toLowerCase()
                );

                // Show "Add new" option if input doesn't match any existing option
                if (inputValue !== "" && !isExisting) {
                  filtered.push({
                    inputValue,
                    serviceName: `${language === "ar" ? "إضافة" : "Add"} "${inputValue}"`,
                    isAddNew: true,
                  });
                }

                return filtered;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("selectLabTest", language)}
                  placeholder={
                    availableLabTests.length === 0
                      ? t("noLabTestsAvailable", language)
                      : t("searchSelectLabTest", language)
                  }
                  variant="outlined"
                  disabled={hasSameSpecializationRestriction}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props;
                if (option.isAddNew) {
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...restProps}
                      sx={{
                        fontSize: "0.95rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#556B2F",
                        fontWeight: 600,
                      }}
                    >
                      <AddIcon sx={{ fontSize: 20 }} />
                      <span>{option.serviceName}</span>
                    </Box>
                  );
                }
                const statusInfo = getCoverageStatusInfo(option.coverageStatus, option.coveragePercentage, language);
                return (
                  <Box
                    component="li"
                    key={key}
                    {...restProps}
                    sx={{
                      fontSize: "0.95rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <span>{option.serviceName || option.name || t("labTestNumber", language)}</span>
                    <Chip
                      size="small"
                      label={statusInfo.label}
                      color={statusInfo.color}
                      icon={statusInfo.icon}
                      sx={{
                        fontSize: "0.7rem",
                        height: 22,
                        "& .MuiChip-icon": { fontSize: 14 }
                      }}
                    />
                  </Box>
                );
              }}
              sx={{ width: "100%" }}
            />
          </Box>

          {selectedLabTests.length > 0 && (
            <>
              <Divider />
              <Box sx={{ width: "100%", display: "block" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  mb={2}
                  sx={{ color: "#1f2937", fontSize: "0.95rem" }}
                >
                  ✅ {t("selectedLabTestsCount", language)} ({selectedLabTests.length})
                </Typography>
                <Stack spacing={2} sx={{ width: "100%" }}>
                  {selectedLabTests.map((lab, idx) => {
                    const statusInfo = getCoverageStatusInfo(
                      lab.test?.coverageStatus,
                      lab.test?.coveragePercentage,
                      language
                    );
                    return (
                      <Paper
                        key={idx}
                        sx={{
                          p: 2.5,
                          bgcolor: statusInfo.bgColor,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: "50px",
                          border: `1px solid ${statusInfo.borderColor}`,
                          borderRadius: 1,
                          "&:hover": {
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                          <Typography
                            sx={{ fontSize: "0.95rem", color: "#374151", wordBreak: "break-word" }}
                          >
                            {lab.test?.serviceName || lab.test?.name || `${t("labTestNumber", language)} ${idx + 1}`}
                          </Typography>
                          <Chip
                            size="small"
                            label={statusInfo.label}
                            color={statusInfo.color}
                            icon={statusInfo.icon}
                            sx={{
                              fontSize: "0.7rem",
                              height: 22,
                              width: "fit-content",
                              "& .MuiChip-icon": { fontSize: 14 }
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRemoveLabTest(idx)}
                          sx={{ ml: isRTL ? 0 : 2, mr: isRTL ? 2 : 0, flexShrink: 0 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      )}

      {/* Radiology Tests */}
      {activeSubTab === 1 && (
        <Stack spacing={3} dir={isRTL ? "rtl" : "ltr"}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              {t("addRadiologyTest", language)}
            </Typography>
            <Autocomplete
              value={selectedRadiologyTestValue}
              options={availableRadiologyTests}
              freeSolo
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                if (option.inputValue) return option.inputValue;
                return option.serviceName || option.name || "";
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(event, newValue) => {
                if (typeof newValue === "string") {
                  // User typed something and pressed enter
                  setNewRadiologyTestName(newValue);
                  setAddRadiologyTestDialogOpen(true);
                } else if (newValue && newValue.inputValue) {
                  // User selected "Add new" option
                  setNewRadiologyTestName(newValue.inputValue);
                  setAddRadiologyTestDialogOpen(true);
                } else if (newValue) {
                  onAddRadiologyTest(newValue);
                  setSelectedRadiologyTestValue(null);
                }
              }}
              disabled={hasSameSpecializationRestriction}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Check if any option matches the input exactly
                const isExisting = options.some(
                  (option) =>
                    (option.serviceName || option.name || "").toLowerCase() === inputValue.toLowerCase()
                );

                // Show "Add new" option if input doesn't match any existing option
                if (inputValue !== "" && !isExisting) {
                  filtered.push({
                    inputValue,
                    serviceName: `${language === "ar" ? "إضافة" : "Add"} "${inputValue}"`,
                    isAddNew: true,
                  });
                }

                return filtered;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("selectRadiologyTest", language)}
                  placeholder={t("searchSelectRadiologyTest", language)}
                  variant="outlined"
                  disabled={hasSameSpecializationRestriction}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props;
                if (option.isAddNew) {
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...restProps}
                      sx={{
                        fontSize: "0.95rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#556B2F",
                        fontWeight: 600,
                      }}
                    >
                      <AddIcon sx={{ fontSize: 20 }} />
                      <span>{option.serviceName}</span>
                    </Box>
                  );
                }
                const statusInfo = getCoverageStatusInfo(option.coverageStatus, option.coveragePercentage, language);
                return (
                  <Box
                    component="li"
                    key={key}
                    {...restProps}
                    sx={{
                      fontSize: "0.95rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <span>{option.serviceName || option.name || t("radiologyTestNumber", language)}</span>
                    <Chip
                      size="small"
                      label={statusInfo.label}
                      color={statusInfo.color}
                      icon={statusInfo.icon}
                      sx={{
                        fontSize: "0.7rem",
                        height: 22,
                        "& .MuiChip-icon": { fontSize: 14 }
                      }}
                    />
                  </Box>
                );
              }}
              sx={{ width: "100%" }}
            />
          </Box>

          {selectedRadiologyTests.length > 0 && (
            <>
              <Divider />
              <Box sx={{ width: "100%", display: "block" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  mb={2}
                  sx={{ color: "#1f2937", fontSize: "0.95rem" }}
                >
                  ✅ {t("selectedRadiologyTestsCount", language)} ({selectedRadiologyTests.length})
                </Typography>
                <Stack spacing={2} sx={{ width: "100%" }}>
                  {selectedRadiologyTests.map((rad, idx) => {
                    const statusInfo = getCoverageStatusInfo(
                      rad.test?.coverageStatus,
                      rad.test?.coveragePercentage,
                      language
                    );
                    return (
                      <Paper
                        key={idx}
                        sx={{
                          p: 2.5,
                          bgcolor: statusInfo.bgColor,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: "50px",
                          border: `1px solid ${statusInfo.borderColor}`,
                          borderRadius: 1,
                          "&:hover": {
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                          <Typography
                            sx={{ fontSize: "0.95rem", color: "#374151", wordBreak: "break-word" }}
                          >
                            {rad.test?.serviceName || rad.test?.name || `${t("radiologyTestNumber", language)} ${idx + 1}`}
                          </Typography>
                          <Chip
                            size="small"
                            label={statusInfo.label}
                            color={statusInfo.color}
                            icon={statusInfo.icon}
                            sx={{
                              fontSize: "0.7rem",
                              height: 22,
                              width: "fit-content",
                              "& .MuiChip-icon": { fontSize: 14 }
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRemoveRadiologyTest(idx)}
                          sx={{ ml: isRTL ? 0 : 2, mr: isRTL ? 2 : 0, flexShrink: 0 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      )}

      {/* Add Custom Lab Test Dialog */}
      <Dialog
        open={addLabTestDialogOpen}
        onClose={() => {
          setAddLabTestDialogOpen(false);
          setNewLabTestName("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#556B2F", color: "white", fontWeight: 700 }}>
          {language === "ar" ? "إضافة فحص مختبر مخصص" : "Add Custom Lab Test"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {language === "ar"
              ? "هذا الفحص غير موجود في القائمة. سيتم إضافته كفحص غير مغطى."
              : "This test is not in the list. It will be added as a non-covered test."}
          </Typography>
          <TextField
            fullWidth
            label={language === "ar" ? "اسم الفحص" : "Test Name"}
            value={newLabTestName}
            onChange={(e) => setNewLabTestName(e.target.value)}
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddLabTestDialogOpen(false);
              setNewLabTestName("");
            }}
            color="inherit"
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleAddCustomLabTest}
            variant="contained"
            disabled={!newLabTestName.trim()}
            sx={{ bgcolor: "#556B2F", "&:hover": { bgcolor: "#6B8B4E" } }}
          >
            {language === "ar" ? "إضافة" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Custom Radiology Test Dialog */}
      <Dialog
        open={addRadiologyTestDialogOpen}
        onClose={() => {
          setAddRadiologyTestDialogOpen(false);
          setNewRadiologyTestName("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#556B2F", color: "white", fontWeight: 700 }}>
          {language === "ar" ? "إضافة فحص أشعة مخصص" : "Add Custom Radiology Test"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {language === "ar"
              ? "هذا الفحص غير موجود في القائمة. سيتم إضافته كفحص غير مغطى."
              : "This test is not in the list. It will be added as a non-covered test."}
          </Typography>
          <TextField
            fullWidth
            label={language === "ar" ? "اسم الفحص" : "Test Name"}
            value={newRadiologyTestName}
            onChange={(e) => setNewRadiologyTestName(e.target.value)}
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddRadiologyTestDialogOpen(false);
              setNewRadiologyTestName("");
            }}
            color="inherit"
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleAddCustomRadiologyTest}
            variant="contained"
            disabled={!newRadiologyTestName.trim()}
            sx={{ bgcolor: "#556B2F", "&:hover": { bgcolor: "#6B8B4E" } }}
          >
            {language === "ar" ? "إضافة" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TestsSection;
