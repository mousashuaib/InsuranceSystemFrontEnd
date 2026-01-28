import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Grid,
  Typography,
  Stack,
  IconButton,
  Chip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  createFilterOptions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const filter = createFilterOptions();

const MedicineList = ({
  selectedMedicines,
  availableMedicines,
  selectedMedicineValue,
  selectedMedicineInput,
  setSelectedMedicineValue,
  setSelectedMedicineInput,
  hasSameSpecializationRestriction,
  onAddMedicine,
  onRemoveMedicine,
  onUpdateMedicine,
}) => {
  const { language, isRTL } = useLanguage();

  // State for custom medicine dialog
  const [addMedicineDialogOpen, setAddMedicineDialogOpen] = useState(false);
  const [newMedicineName, setNewMedicineName] = useState("");
  const [newMedicineScientificName, setNewMedicineScientificName] = useState("");
  const [newMedicineForm, setNewMedicineForm] = useState("");

  // Available medicine forms
  const medicineFormOptions = [
    { value: "Tablet", label: language === "ar" ? "حبوب" : "Tablet" },
    { value: "Syrup", label: language === "ar" ? "شراب" : "Syrup" },
    { value: "Cream", label: language === "ar" ? "كريم" : "Cream" },
    { value: "Drops", label: language === "ar" ? "قطرة" : "Drops" },
    { value: "Injection", label: language === "ar" ? "حقن" : "Injection" },
  ];

  // Handle adding custom medicine
  const handleAddCustomMedicine = () => {
    if (newMedicineName.trim()) {
      const customMedicine = {
        id: `custom-${Date.now()}`,
        name: newMedicineName.trim(),
        scientificName: newMedicineScientificName.trim() || "",
        form: newMedicineForm || "Tablet",
        quantity: 0,
        unionPrice: 0,
        coverageStatus: "NOT_COVERED",
        coveragePercentage: 0,
        isCustom: true,
        fullItem: null,
      };

      onAddMedicine(customMedicine);
      setAddMedicineDialogOpen(false);
      setNewMedicineName("");
      setNewMedicineScientificName("");
      setNewMedicineForm("");
    }
  };

  // Helper functions
  const detectFormFromName = (medicineName) => {
    if (!medicineName) return null;
    const nameUpper = medicineName.toUpperCase();
    if (nameUpper.includes("سائل") || nameUpper.includes("LIQUID") || nameUpper.includes("SYRUP")) {
      return "Syrup";
    }
    if (nameUpper.includes("TABLET") || nameUpper.includes("حبة")) {
      return "Tablet";
    }
    if (nameUpper.includes("CREAM") || nameUpper.includes("كريم")) {
      return "Cream";
    }
    if (nameUpper.includes("DROPS") || nameUpper.includes("قطرة")) {
      return "Drops";
    }
    if (nameUpper.includes("INJECTION") || nameUpper.includes("حقن")) {
      return "Injection";
    }
    return null;
  };

  const getDosageLabel = (form, medicineName = null) => {
    if (!form && medicineName) {
      const detectedForm = detectFormFromName(medicineName);
      if (detectedForm) {
        form = detectedForm;
      }
    }
    
    if (!form) return "Dosage";
    
    const formUpper = form.toUpperCase();
    
    if (formUpper === "TABLET") return "How many tablets";
    if (formUpper === "SYRUP" || formUpper === "LIQUID PACKAGE" || formUpper === "LIQUID") {
      return "Dosage in ml";
    }
    if (formUpper === "INJECTION") return "How many injections";
    if (formUpper === "CREAM") return "How many grams";
    if (formUpper === "DROPS") return "How many drops";
    
    return "Dosage";
  };

  const getDosageHelperText = (form, medicineName = null) => {
    if (!form && medicineName) {
      const detectedForm = detectFormFromName(medicineName);
      if (detectedForm) {
        form = detectedForm;
      }
    }
    if (!form) return "Enter dosage";
    const formUpper = form.toUpperCase();
    if (formUpper === "TABLET") return "Number of tablets per dose";
    if (formUpper === "SYRUP" || formUpper === "LIQUID PACKAGE" || formUpper === "LIQUID") return "Total ml per day";
    if (formUpper === "INJECTION") return "Number of injections";
    if (formUpper === "CREAM") return "Grams per dose";
    if (formUpper === "DROPS") return "Drops per dose";
    return "Enter dosage";
  };

  const getDosagePlaceholder = (form, medicineName = null) => {
    if (!form && medicineName) {
      const detectedForm = detectFormFromName(medicineName);
      if (detectedForm) {
        form = detectedForm;
      }
    }
    if (!form) return "Enter dosage";
    const formUpper = form.toUpperCase();
    if (formUpper === "TABLET") return "e.g., 1 or 2 tablets";
    if (formUpper === "SYRUP" || formUpper === "LIQUID PACKAGE" || formUpper === "LIQUID") return "e.g., 15 or 20 ml per day";
    if (formUpper === "INJECTION") return "e.g., 1 or 2 injections";
    if (formUpper === "CREAM") return "e.g., 5 or 10 grams";
    if (formUpper === "DROPS") return "e.g., 2 or 3 drops";
    return "Enter dosage";
  };

  const calculateDuration = (medicine, dosage, timesPerDay) => {
    if (!medicine || !dosage || !timesPerDay) return null;
    const dailyConsumption = dosage * timesPerDay;
    const days = Math.floor(medicine.quantity / dailyConsumption);
    return days;
  };

  const calculateRequiredQuantity = (form, dosage, timesPerDay, duration, _packageQuantity) => {
    if (!duration || duration <= 0) return null;
    
    const formUpper = (form || "").toUpperCase();
    
    switch (formUpper) {
      case "TABLET":
      case "CAPSULE":
        if (!dosage || !timesPerDay || dosage <= 0 || timesPerDay <= 0) return null;
        return dosage * timesPerDay * duration;
        
      case "INJECTION":
        if (!dosage || !duration || dosage <= 0 || duration <= 0) return null;
        return dosage * duration;
        
      case "SYRUP":
      case "DROPS":
        return duration;
        
      case "CREAM":
      case "OINTMENT":
        if (!duration || !timesPerDay || duration <= 0 || timesPerDay <= 0) return null;
        return Math.ceil((duration * timesPerDay) / 7);
        
      default:
        if (dosage && timesPerDay && dosage > 0 && timesPerDay > 0) {
          return dosage * timesPerDay * duration;
        }
        return duration;
    }
  };

  return (
    <Stack spacing={3} dir={isRTL ? "rtl" : "ltr"}>
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          {t("addMedicineLabel", language)}
          {availableMedicines.length === 0 && (
            <Typography variant="caption" color="warning.main" sx={{ ml: isRTL ? 0 : 1, mr: isRTL ? 1 : 0 }}>
              ({t("noMedicinesAvailable", language)})
            </Typography>
          )}
        </Typography>
        <Autocomplete
          freeSolo
          value={selectedMedicineValue}
          inputValue={selectedMedicineInput}
          options={availableMedicines}
          getOptionLabel={(option) => {
            // Handle "Add new" option
            if (typeof option === 'object' && option.inputValue) {
              return option.title;
            }
            return `${option.name || ''}${option.scientificName ? ` - ${option.scientificName}` : ''}`;
          }}
          onChange={(event, newValue) => {
            // Handle custom medicine creation
            if (newValue && typeof newValue === 'object' && newValue.inputValue) {
              setNewMedicineName(newValue.inputValue);
              setAddMedicineDialogOpen(true);
              setSelectedMedicineValue(null);
              setSelectedMedicineInput("");
            } else if (newValue && typeof newValue === 'object' && newValue.name) {
              onAddMedicine(newValue);
              setSelectedMedicineValue(null);
              setSelectedMedicineInput("");
            } else if (typeof newValue === 'string' && newValue.trim()) {
              // User pressed enter with custom text
              setNewMedicineName(newValue.trim());
              setAddMedicineDialogOpen(true);
              setSelectedMedicineValue(null);
              setSelectedMedicineInput("");
            }
          }}
          onInputChange={(event, newInputValue) => {
            setSelectedMedicineInput(newInputValue);
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            const { inputValue } = params;

            // Check if input matches an existing option
            const isExisting = options.some(
              (option) => inputValue.toLowerCase() === (option.name || "").toLowerCase()
            );

            // Add "Add new" option if input doesn't match
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue,
                title: language === "ar" ? `إضافة "${inputValue}"` : `Add "${inputValue}"`,
              });
            }
            return filtered;
          }}
          disabled={hasSameSpecializationRestriction}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("selectMedicine", language)}
              placeholder={language === "ar" ? "ابحث أو أضف دواء جديد..." : "Search or add new medicine..."}
              variant="outlined"
              disabled={hasSameSpecializationRestriction}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...restProps } = props;

            // Handle "Add new" option
            if (typeof option === 'object' && option.inputValue) {
              return (
                <Box component="li" key={key} {...restProps}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AddIcon sx={{ color: "#0284c7" }} />
                    <Typography sx={{ color: "#0284c7", fontWeight: 600 }}>
                      {option.title}
                    </Typography>
                  </Stack>
                </Box>
              );
            }

            // Get coverage status info
            const coverageStatus = option.coverageStatus || "COVERED";
            const coveragePercentage = option.coveragePercentage || 100;

            // Define coverage status display properties
            const getCoverageDisplay = () => {
              switch (coverageStatus) {
                case "COVERED":
                  return {
                    label: language === "ar" ? "مغطى" : "Covered",
                    color: "#10b981",
                    bgColor: "#d1fae5",
                    icon: "✓",
                  };
                case "REQUIRES_APPROVAL":
                  return {
                    label: language === "ar" ? "يحتاج موافقة" : "Requires Approval",
                    color: "#f59e0b",
                    bgColor: "#fef3c7",
                    icon: "⚠",
                  };
                case "NOT_COVERED":
                  return {
                    label: language === "ar" ? "غير مغطى" : "Not Covered",
                    color: "#ef4444",
                    bgColor: "#fee2e2",
                    icon: "✗",
                  };
                default:
                  return {
                    label: language === "ar" ? "مغطى" : "Covered",
                    color: "#10b981",
                    bgColor: "#d1fae5",
                    icon: "✓",
                  };
              }
            };

            const coverageDisplay = getCoverageDisplay();

            return (
              <Box component="li" key={key} {...restProps} sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {option.name}
                  </Typography>
                  {option.scientificName && (
                    <Typography variant="caption" color="text.secondary">
                      {option.scientificName}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={`${coverageDisplay.icon} ${coverageDisplay.label}${coverageStatus === "COVERED" && coveragePercentage < 100 ? ` (${coveragePercentage}%)` : ""}`}
                  size="small"
                  sx={{
                    bgcolor: coverageDisplay.bgColor,
                    color: coverageDisplay.color,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: "20px",
                  }}
                />
              </Box>
            );
          }}
          sx={{ width: "100%" }}
        />
      </Box>

      {selectedMedicines.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            {t("selectedMedicines", language)}
          </Typography>
          <Stack spacing={2}>
            {selectedMedicines.map((med, idx) => {
              const _duration = calculateDuration(med.medicine, med.dosage, med.timesPerDay);
              const form = med.form || med.medicine?.form;
              const _packageQuantity = med.medicine?.quantity || med.medicine?.fullItem?.quantity || null;
              const _calculatedQty = calculateRequiredQuantity(
                form,
                med.dosage ? parseInt(med.dosage) : null,
                med.timesPerDay ? parseInt(med.timesPerDay) : null,
                med.duration ? parseInt(med.duration) : null,
                _packageQuantity
              );

              return (
                <Paper
                  key={idx}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "2px solid #e0f2fe",
                    backgroundColor: "#ffffff",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 8px 24px rgba(14,165,233,0.15)",
                    },
                  }}
                >
                  {/* Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={600} color="#0284c7">
                      {t("medicineNumber", language)} {idx + 1}
                    </Typography>
                    {selectedMedicines.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => onRemoveMedicine(idx)}
                        sx={{
                          "&:hover": {
                            bgcolor: "#fee2e2",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Stack>

                  {/* Medicine Info */}
                  {med.medicine && (
                    <>
                      <Typography variant="body1" fontWeight={700} mb={2}>
                        {med.medicine.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" mb={2}>
                        {t("scientificLabel", language)}: {med.medicine.scientificName}
                      </Typography>
                      {med.medicine.form && (
                        <Typography variant="caption" color="text.secondary" mb={2} display="block">
                          {t("formLabel", language)}: {med.medicine.form}
                        </Typography>
                      )}
                    </>
                  )}

                  {/* Medicine Form Display */}
                  {med.form && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`${t("formLabel", language)}: ${med.form}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  )}

                  {/* Dosage, Times & Duration */}
                  <Grid container spacing={2}>
                    {(() => {
                      const formValue = (med.form || med.medicine?.form || "").toUpperCase();
                      const isCream = formValue === "CREAM" || formValue === "OINTMENT";
                      const isInjection = formValue === "INJECTION";

                      if (isCream || med.noDosage) return null;

                      const xsSize = isInjection || isCream || med.noDosage ? 6 : 4;

                      return (
                        <Grid item xs={xsSize}>
                          <TextField
                            label={(() => {
                              const formValue = med.form || med.medicine?.form;
                              const medicineNameValue = med.medicine?.serviceName || med.medicineName || med.medicine?.name;
                              return getDosageLabel(formValue, medicineNameValue);
                            })()}
                            type="number"
                            size="small"
                            value={med.dosage}
                            onChange={(e) => onUpdateMedicine(idx, "dosage", e.target.value)}
                            placeholder={getDosagePlaceholder(
                              med.form || med.medicine?.form,
                              med.medicine?.serviceName || med.medicineName
                            )}
                            helperText={getDosageHelperText(
                              med.form || med.medicine?.form,
                              med.medicine?.serviceName || med.medicineName
                            )}
                            fullWidth
                            inputProps={{
                              min: med.form === "Tablet" ? 1 : 0.1,
                              step: med.form === "Tablet" ? 1 : 0.1,
                            }}
                            disabled={med.noDosage}
                            sx={
                              med.noDosage
                                ? {
                                    "& .MuiInputBase-input": {
                                      backgroundColor: "#f5f5f5",
                                      cursor: "not-allowed",
                                    },
                                  }
                                : {}
                            }
                          />
                        </Grid>
                      );
                    })()}
                    {(() => {
                      const formValue = (med.form || med.medicine?.form || "").toUpperCase();
                      const isCream = formValue === "CREAM" || formValue === "OINTMENT";
                      const isInjection = formValue === "INJECTION";

                      if (isInjection || med.noDosage) return null;

                      const xsSize = isCream ? 6 : 4;

                      return (
                        <Grid item xs={xsSize}>
                          <TextField
                            label={t("timesPerDay", language)}
                            type="number"
                            size="small"
                            value={med.timesPerDay}
                            onChange={(e) => onUpdateMedicine(idx, "timesPerDay", e.target.value)}
                            placeholder="e.g., 1, 2, 3..."
                            helperText={t("numberOfTimesPerDay", language)}
                            fullWidth
                            inputProps={{ min: 1 }}
                            disabled={med.noDosage}
                            sx={
                              med.noDosage
                                ? {
                                    "& .MuiInputBase-input": {
                                      backgroundColor: "#f5f5f5",
                                      cursor: "not-allowed",
                                    },
                                  }
                                : {}
                            }
                          />
                        </Grid>
                      );
                    })()}
                    <Grid
                      item
                      xs={(() => {
                        const formValue = (med.form || med.medicine?.form || "").toUpperCase();
                        const isCream = formValue === "CREAM" || formValue === "OINTMENT";
                        const isInjection = formValue === "INJECTION";

                        if (isCream || isInjection || med.noDosage) return 6;
                        return 4;
                      })()}
                    >
                      <TextField
                        label={t("durationInDays", language)}
                        type="number"
                        size="small"
                        value={med.duration || ""}
                        onChange={(e) => onUpdateMedicine(idx, "duration", e.target.value)}
                        placeholder="e.g., 7, 10, 14..."
                        helperText={t("treatmentDurationDays", language)}
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Custom Medicine Dialog */}
      <Dialog
        open={addMedicineDialogOpen}
        onClose={() => setAddMedicineDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#f0f9ff", color: "#0284c7" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AddIcon />
            <span>{language === "ar" ? "إضافة دواء جديد" : "Add New Medicine"}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {language === "ar"
              ? "أدخل تفاصيل الدواء. سيتم تصنيفه كـ 'غير مغطى' بشكل افتراضي."
              : "Enter medicine details. It will be marked as 'Not Covered' by default."}
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              label={language === "ar" ? "اسم الدواء" : "Medicine Name"}
              value={newMedicineName}
              onChange={(e) => setNewMedicineName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label={language === "ar" ? "الاسم العلمي (اختياري)" : "Scientific Name (Optional)"}
              value={newMedicineScientificName}
              onChange={(e) => setNewMedicineScientificName(e.target.value)}
            />
            <TextField
              select
              fullWidth
              label={language === "ar" ? "الشكل الدوائي" : "Medicine Form"}
              value={newMedicineForm}
              onChange={(e) => setNewMedicineForm(e.target.value)}
              required
            >
              {medicineFormOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setAddMedicineDialogOpen(false);
              setNewMedicineName("");
              setNewMedicineScientificName("");
              setNewMedicineForm("");
            }}
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleAddCustomMedicine}
            variant="contained"
            disabled={!newMedicineName.trim() || !newMedicineForm}
            sx={{
              bgcolor: "#0284c7",
              "&:hover": { bgcolor: "#0369a1" },
            }}
          >
            {language === "ar" ? "إضافة" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default MedicineList;
