import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  FormControlLabel,
  Checkbox,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  createFilterOptions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../config/translations";

const filter = createFilterOptions();
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const DiagnosisTreatmentSection = ({
  noDiagnosisTreatment,
  setNoDiagnosisTreatment,
  patientForm,
  setPatientForm,
  selectedSpecialization,
  specializations,
  availableDiagnoses,
  availableTreatments,
  diagnosisTreatmentMappings = {},
  hasSameSpecializationRestriction,
  specializationRestrictionFailed,
  restrictionFailureReason,
  selectedFamilyMember: _selectedFamilyMember,
}) => {
  const { language, isRTL } = useLanguage();

  // State for selected diagnoses (multiple)
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);

  // Dialog state for adding new diagnosis
  const [addDiagnosisDialogOpen, setAddDiagnosisDialogOpen] = useState(false);
  const [newDiagnosisName, setNewDiagnosisName] = useState("");

  // If specialization restrictions failed, show error message
  if (specializationRestrictionFailed) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: "#fee2e2", border: "2px solid #ef4444" }} dir={isRTL ? "rtl" : "ltr"}>
        <Typography variant="h6" fontWeight={600} color="#dc2626" mb={1}>
          ⚠️ {t("specializationRestrictionsNotMet", language)}
        </Typography>
        <Typography variant="body1" color="#991b1b" mb={2}>
          {restrictionFailureReason}
        </Typography>
        <Typography variant="body2" color="#7f1d1d">
          {t("cannotDisplayMedicinesTests", language)}
        </Typography>
      </Paper>
    );
  }

  // Handle diagnosis selection change
  const handleDiagnosisChange = (event, newValue) => {
    // Check if user wants to add a new diagnosis
    const addNewOption = newValue.find(item => item.inputValue);

    if (addNewOption) {
      // Open dialog to add new diagnosis
      setNewDiagnosisName(addNewOption.inputValue);
      setAddDiagnosisDialogOpen(true);
      // Remove the "Add" option from selection
      newValue = newValue.filter(item => !item.inputValue);
    }

    // Extract string values from the selection
    const diagnosisStrings = newValue.map(item =>
      typeof item === 'string' ? item : item.title || item
    );

    setSelectedDiagnoses(diagnosisStrings);
    setPatientForm({ ...patientForm, diagnosis: diagnosisStrings.join(", ") });
  };

  // Handle adding new diagnosis
  const handleAddNewDiagnosis = () => {
    if (newDiagnosisName.trim()) {
      const newDiagnosis = newDiagnosisName.trim();

      // Add to selected diagnoses
      const updatedDiagnoses = [...selectedDiagnoses, newDiagnosis];
      setSelectedDiagnoses(updatedDiagnoses);
      setPatientForm({ ...patientForm, diagnosis: updatedDiagnoses.join(", ") });
    }
    setAddDiagnosisDialogOpen(false);
    setNewDiagnosisName("");
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: "#f0f9ff" }} dir={isRTL ? "rtl" : "ltr"}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={600} color="#0284c7">
          {t("diagnosisTreatment", language)}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={noDiagnosisTreatment}
              onChange={(e) => {
                setNoDiagnosisTreatment(e.target.checked);
                if (e.target.checked) {
                  // Clear diagnosis and treatment when checkbox is checked
                  setPatientForm((prev) => ({ ...prev, diagnosis: "", treatment: "" }));
                  setSelectedDiagnoses([]);
                }
              }}
              disabled={hasSameSpecializationRestriction}
            />
          }
          label={t("noDiagnosisTreatmentNeeded", language)}
        />
      </Stack>

      {!noDiagnosisTreatment && (
        <>
          {/* Show specialization info (read-only) */}
          {selectedSpecialization && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: "#e0f2fe", borderRadius: 1 }}>
              <Typography variant="body2" color="#0284c7" fontWeight={600}>
                {t("specialization", language)}:{" "}
                {specializations.find((s) => s.displayName === selectedSpecialization)?.displayName ||
                  selectedSpecialization}
              </Typography>
            </Box>
          )}

          {/* Diagnosis Selection - Searchable Multi-Select Autocomplete */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} color="#0284c7" mb={1}>
              {t("diagnosisLabel", language)} *
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              disableCloseOnSelect
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              id="diagnosis-autocomplete"
              options={availableDiagnoses}
              value={selectedDiagnoses}
              onChange={handleDiagnosisChange}
              disabled={!selectedSpecialization || hasSameSpecializationRestriction}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Check if the input matches any existing option
                const isExisting = options.some(
                  (option) => inputValue.toLowerCase() === option.toLowerCase()
                );

                // Add "Add new" option if input doesn't match existing options
                if (inputValue !== '' && !isExisting) {
                  filtered.push({
                    inputValue,
                    title: `${t("add", language) || "Add"} "${inputValue}"`,
                  });
                }

                return filtered;
              }}
              getOptionLabel={(option) => {
                // For "Add new" option
                if (typeof option === 'object' && option.inputValue) {
                  return option.title;
                }
                // For regular options
                return option;
              }}
              renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props;
                // Check if this is the "Add new" option
                if (typeof option === 'object' && option.inputValue) {
                  return (
                    <li key={key} {...otherProps}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AddIcon sx={{ color: "#0284c7" }} />
                        <Typography sx={{ color: "#0284c7", fontWeight: 600 }}>
                          {option.title}
                        </Typography>
                      </Stack>
                    </li>
                  );
                }
                return (
                  <li key={key} {...otherProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option}
                  </li>
                );
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option}
                      {...chipProps}
                      sx={{
                        bgcolor: "#0284c7",
                        color: "#fff",
                        "& .MuiChip-deleteIcon": {
                          color: "#fff",
                          "&:hover": {
                            color: "#e0f2fe",
                          },
                        },
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t("searchOrAddDiagnosis", language) || "Search or add diagnosis..."}
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: 1,
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: "#0284c7",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#0284c7",
                      },
                    },
                  }}
                />
              )}
              sx={{
                "& .MuiAutocomplete-tag": {
                  margin: "2px",
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {t("diagnosisHint", language) || "Type to search. If not found, you can add a new diagnosis."}
            </Typography>
          </Box>

          {/* Treatment Plan - Free Text Field */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t("treatmentPlan", language)}
            value={patientForm.treatment}
            onChange={(e) => setPatientForm({ ...patientForm, treatment: e.target.value })}
            placeholder={t("enterTreatmentPlan", language) || "Enter treatment plan..."}
            disabled={!selectedSpecialization || hasSameSpecializationRestriction}
            required
          />
        </>
      )}

      {noDiagnosisTreatment && (
        <Box sx={{ p: 2, bgcolor: "#fef3c7", borderRadius: 1, border: "1px solid #f59e0b" }}>
          <Typography variant="body2" color="#92400e" fontWeight={600}>
            ℹ️ {t("noDiagnosisTreatmentRequired", language)}
          </Typography>
        </Box>
      )}

      {/* Dialog for adding new diagnosis */}
      <Dialog
        open={addDiagnosisDialogOpen}
        onClose={() => setAddDiagnosisDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#f0f9ff", color: "#0284c7", fontWeight: 600 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AddIcon />
            <span>{t("addNewDiagnosis", language) || "Add New Diagnosis"}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t("addNewDiagnosisHint", language) || "This diagnosis will be added to your selection."}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label={t("diagnosisName", language) || "Diagnosis Name"}
            value={newDiagnosisName}
            onChange={(e) => setNewDiagnosisName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddNewDiagnosis();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAddDiagnosisDialogOpen(false)}
            sx={{ color: "#64748b" }}
          >
            {t("cancel", language)}
          </Button>
          <Button
            onClick={handleAddNewDiagnosis}
            variant="contained"
            disabled={!newDiagnosisName.trim()}
            sx={{
              bgcolor: "#0284c7",
              "&:hover": { bgcolor: "#0369a1" },
            }}
          >
            {t("add", language) || "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DiagnosisTreatmentSection;
