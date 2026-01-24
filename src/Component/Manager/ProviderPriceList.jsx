import React, { useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";

import Sidebar from "../Manager/Sidebar";
import Header from "../Manager/Header";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const ProviderPriceList = () => {
  const { language, isRTL } = useLanguage();
  const [tab, setTab] = useState(0);
  const [prices, setPrices] = useState([]);

  const [open, setOpen] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsData, setDetailsData] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  // Doctor Specialization Management State
  const [doctorSpecializations, setDoctorSpecializations] = useState([]);
  const [openSpecDialog, setOpenSpecDialog] = useState(false);
  const [isEditSpec, setIsEditSpec] = useState(false);
  const [specForm, setSpecForm] = useState({
    displayName: "",
    consultationPrice: "",
    diagnoses: [],
    treatmentPlans: [],
    allowedGenders: [],
    minAge: "",
    maxAge: "",
    gender: "",
  });
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [selectedTreatmentPlans, setSelectedTreatmentPlans] = useState([]);
  const [allAvailableDiagnoses, setAllAvailableDiagnoses] = useState([]);
  const [allAvailableTreatments, setAllAvailableTreatments] = useState([]);
  const [newDiagnosisInput, setNewDiagnosisInput] = useState("");
  const [newTreatmentInput, setNewTreatmentInput] = useState("");
  // Diagnosis-Treatment Mappings: { "Diagnosis A": ["Treatment 1", "Treatment 2"] }
  const [diagnosisTreatmentMappings, setDiagnosisTreatmentMappings] = useState({});
  // Global mappings aggregated from all specializations
  const [globalDiagnosisTreatmentMappings, setGlobalDiagnosisTreatmentMappings] = useState({});
  const [selectedSpecGenders, setSelectedSpecGenders] = useState([]);
  const [allowAllSpecGenders, setAllowAllSpecGenders] = useState(true);

  // Specializations state
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState([]);
  const [allowAllSpecializations, setAllowAllSpecializations] = useState(true);
  const [selectOpen, setSelectOpen] = useState(false);

  // Gender and Age restrictions state
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [allowAllGenders, setAllowAllGenders] = useState(true);
  const [genderSelectOpen, setGenderSelectOpen] = useState(false);

  // FORM STATE
  const [form, setForm] = useState({
    serviceName: "",
    serviceCode: "",
    price: "",
    quantity: "",
    notes: "",
    serviceDetails: {},
    allowedSpecializationIds: [],
    allowedGenders: [],
    minAge: "",
    maxAge: "",
  });

  // Memoized constants
  const providerTypes = useMemo(() => [
    { label: "PHARMACIES", type: "PHARMACY" },
    { label: "DOCTORS", type: "DOCTOR" },
    { label: "LABS", type: "LAB" },
    { label: "RADIOLOGY", type: "RADIOLOGY" },
  ], []);

  const genderOptions = useMemo(() => [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
  ], []);

  // Fetch specializations on component mount
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.DOCTOR.SPECIALIZATIONS);
        setSpecializations(res || []);
      } catch (err) {
        console.error("Error fetching specializations:", err);
      }
    };
    fetchSpecializations();
  }, []);

  // Memoized fetch doctor specializations
  const fetchDoctorSpecializations = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.DOCTOR.SPECIALIZATIONS_MANAGER_ALL);
      setDoctorSpecializations(res || []);
    } catch (err) {
      console.error("Error fetching doctor specializations:", err);
      setDoctorSpecializations([]);
    }
  }, []);

  // Fetch doctor specializations when DOCTOR tab is selected
  useEffect(() => {
    if (providerTypes[tab].type === "DOCTOR") {
      fetchDoctorSpecializations();
    }
  }, [tab, providerTypes, fetchDoctorSpecializations]);

  // Aggregate all available diagnoses, treatments, and mappings from existing specializations
  useEffect(() => {
    if (doctorSpecializations && doctorSpecializations.length > 0) {
      const allDiagnoses = new Set();
      const allTreatments = new Set();
      const globalMappings = {};

      doctorSpecializations.forEach((spec) => {
        if (Array.isArray(spec.diagnoses)) {
          spec.diagnoses.forEach((d) => allDiagnoses.add(d));
        }
        if (Array.isArray(spec.treatmentPlans)) {
          spec.treatmentPlans.forEach((t) => allTreatments.add(t));
        }
        // Aggregate diagnosis-treatment mappings
        if (spec.diagnosisTreatmentMappings && typeof spec.diagnosisTreatmentMappings === 'object') {
          Object.entries(spec.diagnosisTreatmentMappings).forEach(([diagnosis, treatments]) => {
            if (!globalMappings[diagnosis]) {
              globalMappings[diagnosis] = new Set();
            }
            if (Array.isArray(treatments)) {
              treatments.forEach((t) => globalMappings[diagnosis].add(t));
            }
          });
        }
      });

      // Convert Sets to Arrays in globalMappings
      const finalMappings = {};
      Object.entries(globalMappings).forEach(([diagnosis, treatmentsSet]) => {
        finalMappings[diagnosis] = Array.from(treatmentsSet).sort();
      });

      setAllAvailableDiagnoses(Array.from(allDiagnoses).sort());
      setAllAvailableTreatments(Array.from(allTreatments).sort());
      setGlobalDiagnosisTreatmentMappings(finalMappings);
    }
  }, [doctorSpecializations]);

  // Memoized form options
  const formOptions = useMemo(() => [
    { value: "Tablet", label: "Tablet", strengthUnit: "mg" },
    { value: "Syrup", label: "Syrup", strengthUnit: "ml" },
    { value: "Injection", label: "Injection", strengthUnit: "ml" },
    { value: "Cream", label: "Cream", strengthUnit: "g" },
    { value: "Drops", label: "Drops", strengthUnit: "ml" },
  ], []);

  // Memoized field configuration
  const fieldConfig = useMemo(() => ({
    PHARMACY: [
      { key: "drugName", label: "Drug Name" },
      { key: "scientificName", label: "Scientific Name" },
      { key: "form", label: "Form", type: "select", options: formOptions },
      { key: "strength", label: "Strength", dynamicLabel: true },
      { key: "description", label: "Description" },
    ],
    DOCTOR: [
      { key: "consultationType", label: "Consultation Type" },
      { key: "durationMinutes", label: "Duration (Minutes)" },
      { key: "specialization", label: "Specialization" },
    ],
    LAB: [
      { key: "testName", label: "Test Name" },
      { key: "testCode", label: "Test Code" },
      { key: "sampleType", label: "Sample Type" },
      { key: "resultTime", label: "Result Time (Hours)" },
    ],
    RADIOLOGY: [
      { key: "scanName", label: "Scan Name" },
      { key: "cptCode", label: "CPT Code" },
      { key: "radiationLevel", label: "Radiation Level" },
    ],
  }), [formOptions]);

  // Memoized helper function to parse price list data
  const parsePriceListData = useCallback((data) => {
    return data.map((p) => {
      // Handle allowedSpecializations - could be array of objects or null/undefined
      let allowedIds = [];

      if (p.allowedSpecializations) {
        if (Array.isArray(p.allowedSpecializations) && p.allowedSpecializations.length > 0) {
          // If it's an array of objects with id property
          allowedIds = p.allowedSpecializations.map((s) => {
            if (typeof s === 'object' && s !== null) {
              // Try different possible property names
              return s.id || s.specializationId || s;
            }
            return s;
          }).filter(id => id != null); // Remove null/undefined values
        } else if (typeof p.allowedSpecializations === 'object' && !Array.isArray(p.allowedSpecializations)) {
          // If it's a single object, wrap it in an array
          allowedIds = [p.allowedSpecializations.id || p.allowedSpecializations];
        }
      }

      return {
        ...p,
        serviceDetails:
          typeof p.serviceDetails === "string"
            ? JSON.parse(p.serviceDetails)
            : p.serviceDetails,
        allowedSpecializationIds: allowedIds,
        allowedGenders: p.allowedGenders || [],
        minAge: p.minAge || null,
        maxAge: p.maxAge || null,
      };
    });
  }, []);

  // LOAD PRICES BY TYPE
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.PRICELIST.BY_TYPE(providerTypes[tab].type));
        setPrices(parsePriceListData(res || []));
      } catch (err) {
        console.error(err);
      }
    };

    loadPrices();
  }, [tab, providerTypes, parsePriceListData]);

  // OPEN ADD FORM - memoized
  const openAddForm = useCallback(() => {
    setIsEdit(false);
    setForm({
      serviceName: "",
      serviceCode: "",
      price: "",
      quantity: "",
      notes: "",
      serviceDetails: {},
      allowedSpecializationIds: [],
      allowedGenders: [],
      minAge: "",
      maxAge: "",
    });
    setSelectedSpecializationIds([]);
    setAllowAllSpecializations(true);
    setSelectedGenders([]);
    setAllowAllGenders(true);
    setOpen(true);
  }, []);

  // OPEN EDIT FORM - memoized
  const openEditForm = useCallback((item) => {
    setIsEdit(true);
    const allowedIds = item.allowedSpecializationIds || [];
    const hasRestrictions = allowedIds.length > 0;
    const allowedGendersData = item.allowedGenders || [];
    const hasGenderRestrictions = allowedGendersData.length > 0;

    setForm({
      id: item.id,
      serviceName: item.serviceName,
      serviceCode: item.serviceCode,
      price: item.price,
      quantity: item.quantity || "",
      notes: item.notes,
      serviceDetails: item.serviceDetails || {},
      allowedSpecializationIds: allowedIds,
      allowedGenders: allowedGendersData,
      minAge: item.minAge || "",
      maxAge: item.maxAge || "",
    });
    setSelectedSpecializationIds(allowedIds);
    setAllowAllSpecializations(!hasRestrictions);
    setSelectedGenders(allowedGendersData);
    setAllowAllGenders(!hasGenderRestrictions);
    setOpen(true);
  }, []);

  // SAVE FORM - memoized
  const saveForm = useCallback(async () => {
    try {
      const currentType = providerTypes[tab].type;
      const payload = {
        providerType: currentType,
        serviceName: form.serviceName,
        serviceCode: form.serviceCode,
        price: Number(form.price),
        quantity: form.quantity ? Number(form.quantity) : null,
        notes: form.notes,
        serviceDetails: JSON.stringify(form.serviceDetails),
      };

      // Add restrictions for LAB, PHARMACY, and RADIOLOGY
      if (currentType === "LAB" || currentType === "PHARMACY" || currentType === "RADIOLOGY") {
        // If "Allow All" is checked, send empty array (or null) to indicate no restrictions
        // If specific specializations are selected, send those IDs
        payload.allowedSpecializationIds = allowAllSpecializations ? [] : selectedSpecializationIds;
        
        // Debug: log what we're sending
        console.log("Saving with allowedSpecializationIds:", payload.allowedSpecializationIds);
        console.log("allowAllSpecializations:", allowAllSpecializations);
        console.log("selectedSpecializationIds:", selectedSpecializationIds);
      }

      // Add gender restrictions (for all provider types)
      payload.allowedGenders = allowAllGenders ? [] : selectedGenders;

      // Add age restrictions (for all provider types)
      if (form.minAge !== "" && form.minAge != null) {
        payload.minAge = Number(form.minAge);
      }
      if (form.maxAge !== "" && form.maxAge != null) {
        payload.maxAge = Number(form.maxAge);
      }

      let response;
      if (!isEdit) {
        response = await api.post(API_ENDPOINTS.PRICELIST.BASE, payload);
      } else {
        response = await api.patch(API_ENDPOINTS.PRICELIST.BY_ID(form.id), payload);
      }

      // Debug: log the response
      console.log("Save response:", response);

      // Close dialog
      setOpen(false);

      // Reload prices immediately after save
      try {
        const res = await api.get(API_ENDPOINTS.PRICELIST.BY_TYPE(currentType));
        const parsedData = parsePriceListData(res || []);
        setPrices(parsedData);
      } catch (reloadErr) {
        console.error("Error reloading prices after save:", reloadErr);
      }
    } catch (err) {
      console.error(err);
    }
  }, [tab, providerTypes, form, isEdit, allowAllSpecializations, selectedSpecializationIds, allowAllGenders, selectedGenders, parsePriceListData]);

  // DELETE - memoized
  const deletePrice = useCallback(async (id) => {
    try {
      await api.delete(API_ENDPOINTS.PRICELIST.BY_ID(id));
      const res = await api.get(API_ENDPOINTS.PRICELIST.BY_TYPE(providerTypes[tab].type));
      setPrices(parsePriceListData(res || []));
    } catch (err) {
      console.error(err);
    }
  }, [tab, providerTypes, parsePriceListData]);

  // DOCTOR SPECIALIZATION MANAGEMENT - memoized
  const openAddSpecForm = useCallback(() => {
    setIsEditSpec(false);
    setSpecForm({
      displayName: "",
      consultationPrice: "",
      diagnoses: [],
      treatmentPlans: [],
      allowedGenders: [],
      minAge: "",
      maxAge: "",
      gender: "",
    });
    setSelectedDiagnoses([]);
    setSelectedTreatmentPlans([]);
    setDiagnosisTreatmentMappings({});
    setNewDiagnosisInput("");
    setNewTreatmentInput("");
    setSelectedSpecGenders([]);
    setAllowAllSpecGenders(true);
    setOpenSpecDialog(true);
  }, []);

  const openEditSpecForm = useCallback((spec) => {
    setIsEditSpec(true);
    setSpecForm({
      id: spec.id,
      displayName: spec.displayName || "",
      consultationPrice: spec.consultationPrice || "",
      diagnoses: spec.diagnoses || [],
      treatmentPlans: spec.treatmentPlans || [],
      allowedGenders: spec.allowedGenders || [],
      minAge: spec.minAge || "",
      maxAge: spec.maxAge || "",
      gender: spec.gender || "",
    });
    setSelectedDiagnoses(Array.isArray(spec.diagnoses) ? spec.diagnoses : []);
    setSelectedTreatmentPlans(Array.isArray(spec.treatmentPlans) ? spec.treatmentPlans : []);
    // Load existing diagnosis-treatment mappings
    setDiagnosisTreatmentMappings(
      spec.diagnosisTreatmentMappings && typeof spec.diagnosisTreatmentMappings === 'object'
        ? spec.diagnosisTreatmentMappings
        : {}
    );
    setNewDiagnosisInput("");
    setNewTreatmentInput("");
    const specAllowedGenders = spec.allowedGenders || [];
    setSelectedSpecGenders(specAllowedGenders);
    setAllowAllSpecGenders(specAllowedGenders.length === 0);
    setOpenSpecDialog(true);
  }, []);

  const saveSpecForm = useCallback(async () => {
    try {
      if (!specForm.displayName || !specForm.consultationPrice) {
        alert("Please fill in all required fields");
        return;
      }

      // Use the selected diagnoses and treatment plans directly
      const diagnoses = selectedDiagnoses.filter((d) => d && d.trim().length > 0);
      const treatmentPlans = selectedTreatmentPlans.filter((t) => t && t.trim().length > 0);

      // Clean up mappings - only include diagnoses that are selected
      const cleanedMappings = {};
      diagnoses.forEach((diagnosis) => {
        if (diagnosisTreatmentMappings[diagnosis]) {
          // Only include treatments that are in the treatmentPlans list
          const validTreatments = diagnosisTreatmentMappings[diagnosis].filter(
            (t) => treatmentPlans.includes(t)
          );
          if (validTreatments.length > 0) {
            cleanedMappings[diagnosis] = validTreatments;
          }
        }
      });

      const payload = {
        displayName: specForm.displayName,
        consultationPrice: Number(specForm.consultationPrice),
        diagnoses: diagnoses,
        treatmentPlans: treatmentPlans,
        diagnosisTreatmentMappings: Object.keys(cleanedMappings).length > 0 ? cleanedMappings : null,
        allowedGenders: allowAllSpecGenders ? [] : selectedSpecGenders,
        minAge: specForm.minAge ? Number(specForm.minAge) : null,
        maxAge: specForm.maxAge ? Number(specForm.maxAge) : null,
        gender: specForm.gender || null,
      };

      if (!isEditSpec) {
        await api.post(API_ENDPOINTS.DOCTOR.SPECIALIZATIONS, payload);
      } else {
        await api.put(`${API_ENDPOINTS.DOCTOR.SPECIALIZATIONS}/${specForm.id}`, payload);
      }

      setOpenSpecDialog(false);
      fetchDoctorSpecializations();
    } catch (err) {
      console.error("Error saving specialization:", err);
      alert("Failed to save specialization");
    }
  }, [specForm, selectedDiagnoses, selectedTreatmentPlans, diagnosisTreatmentMappings, allowAllSpecGenders, selectedSpecGenders, isEditSpec, fetchDoctorSpecializations]);

  const deleteSpec = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this specialization?")) {
      return;
    }

    try {
      await api.delete(`${API_ENDPOINTS.DOCTOR.SPECIALIZATIONS}/${id}`);
      fetchDoctorSpecializations();
    } catch (err) {
      console.error("Error deleting specialization:", err);
      alert("Failed to delete specialization");
    }
  }, [fetchDoctorSpecializations]);

  // Memoized tab change handler
  const handleTabChange = useCallback((e, v) => {
    setTab(v);
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />

      <Box dir={isRTL ? "rtl" : "ltr"} sx={{ flexGrow: 1, background: "#FAF8F5", marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" }, marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0, pt: { xs: "56px", sm: 0 }, transition: "margin 0.3s ease", minHeight: "100vh" }}>
        <Header />

        <Box sx={{ p: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            {t("providerPriceManagement", language)}
          </Typography>

          <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
            {providerTypes.map((p) => (
              <Tab key={p.type} label={p.label} />
            ))}
          </Tabs>

          {/* DOCTOR SPECIALIZATION MANAGEMENT */}
          {providerTypes[tab].type === "DOCTOR" ? (
            <Paper 
              elevation={3}
              sx={{ 
                p: 3,
                borderRadius: 3,
                background: "linear-gradient(135deg, #ffffff 0%, #FAF8F5 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}
                >
                  {t("doctorSpecializationsManagement", language)}
                </Typography>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={openAddSpecForm}
                  sx={{
                    background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
                    color: "white",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: "0 4px 15px rgba(85, 107, 47, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #3D4F23 0%, #556B2F 100%)",
                      boxShadow: "0 6px 20px rgba(85, 107, 47, 0.5)",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease"
                  }}
                >
                  + {t("addNewSpecialization", language)}
                </Button>
              </Box>

              <Table 
                size="small" 
                sx={{ 
                  "& .MuiTableCell-root": { 
                    padding: "12px 16px", 
                    fontSize: "0.875rem",
                    borderBottom: "1px solid #E8EDE0"
                  },
                  "& .MuiTableHead-root": {
                    backgroundColor: "#f5f7fa"
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("displayName", language)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("price", language)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("diagnoses", language)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("treatmentPlans", language)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("genders", language)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("age", language)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("genderRestriction", language)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("actions", language)}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctorSpecializations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          {t("noSpecializationsFound", language)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (doctorSpecializations || []).map((spec) => {
                      const diagnoses = Array.isArray(spec.diagnoses) ? spec.diagnoses : [];
                      const treatmentPlans = Array.isArray(spec.treatmentPlans) ? spec.treatmentPlans : [];
                      const allowedGenders = Array.isArray(spec.allowedGenders) ? spec.allowedGenders : [];

                      return (
                        <TableRow 
                          key={spec.id} 
                          hover
                          sx={{
                            "&:hover": {
                              backgroundColor: "#FAF8F5",
                              transition: "background-color 0.2s ease"
                            },
                            "&:nth-of-type(even)": {
                              backgroundColor: "#fafbfc"
                            }
                          }}
                        >
                          <TableCell sx={{ py: 1.5, fontWeight: 600, color: "#2d3748" }}>{spec.displayName}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={`${spec.consultationPrice} ₪`}
                              size="small"
                              sx={{
                                backgroundColor: "#e8f5e9",
                                color: "#2e7d32",
                                fontWeight: 600,
                                fontSize: "0.8rem"
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1.5, maxWidth: "250px" }}>
                            {diagnoses.length > 0 ? (
                              <Stack spacing={0.5}>
                                {diagnoses.slice(0, 2).map((d, idx) => (
                                  <Chip 
                                    key={idx} 
                                    label={d.length > 35 ? d.substring(0, 35) + "..." : d} 
                                    size="small" 
                                    sx={{ 
                                      fontSize: "0.75rem", 
                                      height: "24px",
                                      backgroundColor: "#e3f2fd",
                                      color: "#1565c0",
                                      border: "1px solid #90caf9",
                                      fontWeight: 500
                                    }} 
                                  />
                                ))}
                                {diagnoses.length > 2 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", fontStyle: "italic" }}>
                                    +{diagnoses.length - 2} more
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>-</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1.5, maxWidth: "250px" }}>
                            {treatmentPlans.length > 0 ? (
                              <Stack spacing={0.5}>
                                {treatmentPlans.slice(0, 2).map((t, idx) => (
                                  <Chip 
                                    key={idx} 
                                    label={t.length > 35 ? t.substring(0, 35) + "..." : t} 
                                    size="small" 
                                    sx={{ 
                                      fontSize: "0.75rem", 
                                      height: "24px",
                                      backgroundColor: "#fff3e0",
                                      color: "#e65100",
                                      border: "1px solid #ffb74d",
                                      fontWeight: 500
                                    }} 
                                  />
                                ))}
                                {treatmentPlans.length > 2 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", fontStyle: "italic" }}>
                                    +{treatmentPlans.length - 2} more
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>-</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            {allowedGenders.length > 0 ? (
                              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                {allowedGenders.map((g) => {
                                  const genderOption = genderOptions.find((opt) => opt.value === g);
                                  return (
                                    <Chip
                                      key={g}
                                      label={genderOption?.label || g}
                                      size="small"
                                      sx={{ 
                                        fontSize: "0.75rem", 
                                        height: "24px",
                                        backgroundColor: "#f3e5f5",
                                        color: "#7b1fa2",
                                        border: "1px solid #ba68c8",
                                        fontWeight: 500
                                      }}
                                    />
                                  );
                                })}
                              </Stack>
                            ) : (
                              <Chip 
                                label="All" 
                                size="small" 
                                sx={{ 
                                  fontSize: "0.75rem", 
                                  height: "24px",
                                  backgroundColor: "#e8f5e9",
                                  color: "#2e7d32",
                                  border: "1px solid #81c784",
                                  fontWeight: 500
                                }} 
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            {spec.minAge || spec.maxAge ? (
                              <Chip
                                label={`${spec.minAge || ""}${spec.minAge && spec.maxAge ? "-" : ""}${spec.maxAge || ""}`}
                                size="small"
                                sx={{
                                  fontSize: "0.75rem",
                                  height: "24px",
                                  backgroundColor: "#e1f5fe",
                                  color: "#0277bd",
                                  fontWeight: 500
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>-</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            {spec.gender ? (
                              <Chip
                                label={spec.gender === "ALL" ? "All" : spec.gender === "MALE" ? "Male" : "Female"}
                                size="small"
                                sx={{
                                  fontSize: "0.75rem",
                                  height: "24px",
                                  backgroundColor: spec.gender === "ALL" ? "#e8f5e9" : spec.gender === "MALE" ? "#e3f2fd" : "#fce4ec",
                                  color: spec.gender === "ALL" ? "#2e7d32" : spec.gender === "MALE" ? "#1565c0" : "#c2185b",
                                  fontWeight: 500
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>-</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Stack direction="row" spacing={0.75}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => openEditSpecForm(spec)}
                                sx={{
                                  fontSize: "0.75rem",
                                  padding: "6px 16px",
                                  background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
                                  color: "white",
                                  fontWeight: 600,
                                  borderRadius: 1.5,
                                  boxShadow: "0 2px 8px rgba(85, 107, 47, 0.3)",
                                  "&:hover": {
                                    background: "linear-gradient(135deg, #3D4F23 0%, #556B2F 100%)",
                                    boxShadow: "0 4px 12px rgba(85, 107, 47, 0.4)",
                                    transform: "translateY(-1px)",
                                  },
                                  transition: "all 0.2s ease"
                                }}
                              >
                                {t("edit", language)}
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => deleteSpec(spec.id)}
                                sx={{
                                  fontSize: "0.75rem",
                                  padding: "6px 16px",
                                  backgroundColor: "#ef5350",
                                  color: "white",
                                  fontWeight: 600,
                                  borderRadius: 1.5,
                                  boxShadow: "0 2px 8px rgba(239, 83, 80, 0.3)",
                                  "&:hover": {
                                    backgroundColor: "#e53935",
                                    boxShadow: "0 4px 12px rgba(239, 83, 80, 0.4)",
                                    transform: "translateY(-1px)",
                                  },
                                  transition: "all 0.2s ease"
                                }}
                              >
                                {t("delete", language)}
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Paper>
          ) : (
            /* PRICE LIST */
          <Paper 
            elevation={3}
            sx={{ 
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #ffffff 0%, #FAF8F5 100%)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                {t("prices", language)} — {providerTypes[tab].label}
              </Typography>
              <Button
                variant="contained"
                size="medium"
                onClick={openAddForm}
                sx={{
                  background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
                  color: "white",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: "0 4px 15px rgba(85, 107, 47, 0.4)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #3D4F23 0%, #556B2F 100%)",
                    boxShadow: "0 6px 20px rgba(85, 107, 47, 0.5)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease"
                }}
              >
                + {t("addNewPrice", language)}
              </Button>
            </Box>

            <Table 
              size={providerTypes[tab].type === "PHARMACY" ? "small" : "medium"} 
              sx={{ 
                "& .MuiTableCell-root": { 
                  padding: providerTypes[tab].type === "PHARMACY" ? "10px 14px" : "12px 16px", 
                  fontSize: providerTypes[tab].type === "PHARMACY" ? "0.85rem" : "0.875rem",
                  borderBottom: "1px solid #E8EDE0"
                },
                "& .MuiTableHead-root": {
                  backgroundColor: "#f5f7fa"
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("serviceName", language)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("code", language)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("price", language)}</TableCell>
                  {providerTypes[tab].type === "PHARMACY" && (
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("quantity", language)}</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("notes", language)}</TableCell>
                  {(providerTypes[tab].type === "LAB" || providerTypes[tab].type === "PHARMACY" || providerTypes[tab].type === "RADIOLOGY") && (
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("allowedSpecializations", language)}</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("allowedGenders", language)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("ageRange", language)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("details", language)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.9rem", py: 1.5, color: "#2d3748" }}>{t("actions", language)}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(prices || []).map((item) => {
                  const allowedIds = item.allowedSpecializationIds || [];
                  // Convert to numbers for comparison (backend might return strings)
                  const allowedIdsNum = allowedIds.map(id => Number(id));
                  const hasRestrictions = allowedIdsNum.length > 0;
                  
                  // Debug for this specific item
                  if (item.serviceName) {
                    console.log(`Item ${item.serviceName}:`, {
                      allowedIds,
                      allowedIdsNum,
                      hasRestrictions,
                      specializations: (specializations || []).map(s => ({ id: s.id, displayName: s.displayName }))
                    });
                  }
                  
                  const allowedSpecs = hasRestrictions
                    ? (specializations || [])
                        .filter((s) => allowedIdsNum.includes(Number(s.id)))
                        .map((s) => s.displayName)
                    : [];

                  const allowedGenders = item.allowedGenders || [];
                  const hasGenderRestrictions = allowedGenders.length > 0;
                  const ageRange = [];
                  if (item.minAge != null) ageRange.push(`Min: ${item.minAge}`);
                  if (item.maxAge != null) ageRange.push(`Max: ${item.maxAge}`);

                  return (
                    <TableRow key={item.id}>
                      <TableCell sx={providerTypes[tab].type === "PHARMACY" ? { py: 1 } : {}}>{item.serviceName}</TableCell>
                      <TableCell sx={providerTypes[tab].type === "PHARMACY" ? { py: 1 } : {}}>{item.serviceCode || "-"}</TableCell>
                      <TableCell sx={providerTypes[tab].type === "PHARMACY" ? { py: 1 } : {}}>{item.price} ₪</TableCell>
                      {providerTypes[tab].type === "PHARMACY" && (
                        <TableCell sx={{ py: 1 }}>
                          {item.quantity ? (
                            (() => {
                              const form = item.serviceDetails?.form || "";
                              if (form === "Tablet") return `${item.quantity} pills`;
                              if (form === "Syrup") return `${item.quantity} ml`;
                              if (form === "Injection") return `${item.quantity} injections`;
                              if (form === "Cream") return `${item.quantity} g`;
                              if (form === "Drops") return `${item.quantity} ml`;
                              return item.quantity;
                            })()
                          ) : "-"}
                        </TableCell>
                      )}
                      <TableCell sx={providerTypes[tab].type === "PHARMACY" ? { py: 1, maxWidth: "150px" } : {}}>
                        <Typography variant={providerTypes[tab].type === "PHARMACY" ? "caption" : "body2"} sx={{ fontSize: providerTypes[tab].type === "PHARMACY" ? "0.75rem" : "0.875rem" }}>
                          {item.notes || "-"}
                        </Typography>
                      </TableCell>

                      {(providerTypes[tab].type === "LAB" || providerTypes[tab].type === "PHARMACY" || providerTypes[tab].type === "RADIOLOGY") && (
                        <TableCell sx={{ py: 1.5 }}>
                          {hasRestrictions && allowedSpecs.length > 0 ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                              {allowedSpecs.map((specName) => (
                                <Chip
                                  key={specName}
                                  label={specName.length > 25 ? specName.substring(0, 25) + "..." : specName}
                                  size="small"
                                  sx={{
                                    fontSize: "0.75rem",
                                    height: "24px",
                                    backgroundColor: "#e3f2fd",
                                    color: "#1565c0",
                                    border: "1px solid #90caf9",
                                    fontWeight: 500
                                  }}
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Chip
                              label={t("allSpecializations", language)}
                              size="small"
                              sx={{
                                fontSize: "0.75rem",
                                height: "24px",
                                backgroundColor: "#e8f5e9",
                                color: "#2e7d32",
                                border: "1px solid #81c784",
                                fontWeight: 500
                              }}
                            />
                          )}
                        </TableCell>
                      )}

                      <TableCell sx={{ py: 1.5 }}>
                        {hasGenderRestrictions && allowedGenders.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {allowedGenders.map((gender) => {
                              const genderOption = genderOptions.find(g => g.value === gender);
                              return (
                                <Chip
                                  key={gender}
                                  label={genderOption?.label || gender}
                                  size="small"
                                  sx={{
                                    fontSize: "0.75rem",
                                    height: "24px",
                                    backgroundColor: "#f3e5f5",
                                    color: "#7b1fa2",
                                    border: "1px solid #ba68c8",
                                    fontWeight: 500
                                  }}
                                />
                              );
                            })}
                          </Stack>
                        ) : (
                          <Chip
                            label={t("allGenders", language)}
                            size="small"
                            sx={{
                              fontSize: "0.75rem",
                              height: "24px",
                              backgroundColor: "#e8f5e9",
                              color: "#2e7d32",
                              border: "1px solid #81c784",
                              fontWeight: 500
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        {ageRange.length > 0 ? (
                          <Chip
                            label={ageRange.join(", ")}
                            size="small"
                            sx={{
                              fontSize: "0.75rem",
                              height: "24px",
                              backgroundColor: "#e1f5fe",
                              color: "#0277bd",
                              fontWeight: 500
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>-</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setDetailsData(item.serviceDetails);
                            setOpenDetails(true);
                          }}
                          sx={{
                            fontSize: "0.75rem",
                            padding: "6px 12px",
                            borderColor: "#556B2F",
                            color: "#556B2F",
                            "&:hover": {
                              borderColor: "#3D4F23",
                              backgroundColor: "rgba(85, 107, 47, 0.08)",
                            }
                          }}
                        >
                          {t("view", language)}
                        </Button>
                      </TableCell>

                    <TableCell sx={{ py: 1.5 }}>
                      <Stack direction="row" spacing={0.75}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => openEditForm(item)}
                          sx={{
                            fontSize: "0.75rem",
                            padding: "6px 16px",
                            background: "linear-gradient(135deg, #556B2F 0%, #3D4F23 100%)",
                            color: "white",
                            fontWeight: 600,
                            borderRadius: 1.5,
                            boxShadow: "0 2px 8px rgba(85, 107, 47, 0.3)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #3D4F23 0%, #556B2F 100%)",
                              boxShadow: "0 4px 12px rgba(85, 107, 47, 0.4)",
                              transform: "translateY(-1px)",
                            },
                            transition: "all 0.2s ease"
                          }}
                        >
                          {t("edit", language)}
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => deletePrice(item.id)}
                          sx={{
                            fontSize: "0.75rem",
                            padding: "6px 16px",
                            backgroundColor: "#ef5350",
                            color: "white",
                            fontWeight: 600,
                            borderRadius: 1.5,
                            boxShadow: "0 2px 8px rgba(239, 83, 80, 0.3)",
                            "&:hover": {
                              backgroundColor: "#e53935",
                              boxShadow: "0 4px 12px rgba(239, 83, 80, 0.4)",
                              transform: "translateY(-1px)",
                            },
                            transition: "all 0.2s ease"
                          }}
                        >
                          {t("delete", language)}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
          )}

        </Box>
      </Box>

      {/* ADD/EDIT FORM */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>
          {isEdit ? t("editPrice", language) : t("addPrice", language)} ({providerTypes[tab].label})
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={t("serviceName", language)}
              value={form.serviceName}
              onChange={(e) =>
                setForm({ ...form, serviceName: e.target.value })
              }
            />

            <TextField
              label={t("serviceCode", language)}
              value={form.serviceCode}
              onChange={(e) =>
                setForm({ ...form, serviceCode: e.target.value })
              }
            />

            <TextField
              label={t("price", language)}
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            {/* Quantity field - only for PHARMACY */}
            {providerTypes[tab].type === "PHARMACY" && (
              <TextField
                label={(() => {
                  const selectedForm = form.serviceDetails.form || "";
                  const formOption = formOptions.find(opt => opt.value === selectedForm);
                  if (formOption) {
                    if (formOption.value === "Tablet") return "Quantity (Number of pills in package)";
                    if (formOption.value === "Syrup") return "Quantity (Volume in ml)";
                    if (formOption.value === "Injection") return "Quantity (Number of injections in package)";
                    if (formOption.value === "Cream") return "Quantity (Weight in grams)";
                    if (formOption.value === "Drops") return "Quantity (Volume in ml)";
                  }
                  return "Quantity";
                })()}
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder={(() => {
                  const selectedForm = form.serviceDetails.form || "";
                  const formOption = formOptions.find(opt => opt.value === selectedForm);
                  if (formOption) {
                    if (formOption.value === "Tablet") return "e.g., 20, 30 pills";
                    if (formOption.value === "Syrup") return "e.g., 100, 200 ml";
                    if (formOption.value === "Injection") return "e.g., 5, 10 injections";
                    if (formOption.value === "Cream") return "e.g., 50, 100 g";
                    if (formOption.value === "Drops") return "e.g., 10, 15 ml";
                  }
                  return "Enter quantity";
                })()}
                helperText={(() => {
                  const selectedForm = form.serviceDetails.form || "";
                  const formOption = formOptions.find(opt => opt.value === selectedForm);
                  if (formOption) {
                    if (formOption.value === "Tablet") return "عدد الحبوب في البكيت (Number of pills in the package)";
                    if (formOption.value === "Syrup") return "حجم العبوة بالمل (Package volume in ml)";
                    if (formOption.value === "Injection") return "عدد الحقن في البكيت (Number of injections in the package)";
                    if (formOption.value === "Cream") return "الوزن بالغرام (Weight in grams)";
                    if (formOption.value === "Drops") return "الحجم بالمل (Volume in ml)";
                  }
                  return "Enter the quantity based on the medicine form";
                })()}
                inputProps={{ min: 1 }}
              />
            )}

            <TextField
              label={t("notes", language)}
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            {/* Dynamic Fields */}
            {fieldConfig[providerTypes[tab].type].map((field) => {
              if (field.type === "select" && field.options) {
                return (
                  <TextField
                    key={field.key}
                    select
                    label={field.label}
                    value={form.serviceDetails[field.key] || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        serviceDetails: {
                          ...form.serviceDetails,
                          [field.key]: e.target.value,
                        },
                      })
                    }
                  >
                    {field.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }
              
              // Handle dynamic label for strength field based on selected form
              let fieldLabel = field.label;
              if (field.dynamicLabel && field.key === "strength" && providerTypes[tab].type === "PHARMACY") {
                const selectedForm = form.serviceDetails.form || "";
                const formOption = formOptions.find(opt => opt.value === selectedForm);
                if (formOption && formOption.strengthUnit) {
                  fieldLabel = `Strength (${formOption.strengthUnit})`;
                } else {
                  fieldLabel = "Strength";
                }
              }
              
              return (
                <TextField
                  key={field.key}
                  label={fieldLabel}
                  value={form.serviceDetails[field.key] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      serviceDetails: {
                        ...form.serviceDetails,
                        [field.key]: e.target.value,
                      },
                    })
                  }
                />
              );
            })}

            {/* Specialization Restrictions - For LAB, PHARMACY, and RADIOLOGY */}
            {(providerTypes[tab].type === "LAB" || providerTypes[tab].type === "PHARMACY" || providerTypes[tab].type === "RADIOLOGY") && (
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allowAllSpecializations}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAllowAllSpecializations(checked);
                        if (checked) {
                          // Clear selection when "Allow All" is checked
                          setSelectedSpecializationIds([]);
                        }
                      }}
                    />
                  }
                  label={t("allowAllSpecializationsNoRestrictions", language)}
                />
                
                <FormControl fullWidth sx={{ mt: 2 }} disabled={allowAllSpecializations}>
                  <InputLabel>{t("allowedDoctorSpecializations", language)}</InputLabel>
                  <Select
                    multiple
                    open={selectOpen}
                    onOpen={() => setSelectOpen(true)}
                    onClose={() => setSelectOpen(false)}
                    value={selectedSpecializationIds}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Filter out the "DONE_BUTTON" value if present
                      const filteredValue = Array.isArray(value) 
                        ? value.filter(v => v !== "DONE_BUTTON")
                        : (typeof value === "string" ? value.split(",").filter(v => v !== "DONE_BUTTON") : value);
                      const newIds = typeof filteredValue === "string" ? filteredValue.split(",") : filteredValue;
                      setSelectedSpecializationIds(newIds);
                      // If user selects something, uncheck "Allow All"
                      if (newIds.length > 0) {
                        setAllowAllSpecializations(false);
                      }
                      // If "DONE_BUTTON" was clicked, close the dropdown
                      if (Array.isArray(value) && value.includes("DONE_BUTTON")) {
                        setSelectOpen(false);
                      }
                    }}
                    input={<OutlinedInput label={t("allowedDoctorSpecializations", language)} />}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return <Typography sx={{ color: "text.secondary" }}>{t("selectSpecializations", language)}</Typography>;
                      }
                      return (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {(selected || []).map((id) => {
                            const spec = specializations.find((s) => s.id === id);
                            return (
                              <Chip
                                key={id}
                                label={spec?.displayName || id}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                      );
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {(specializations || []).map((spec) => (
                      <MenuItem key={spec.id} value={spec.id}>
                        <Checkbox checked={selectedSpecializationIds.includes(spec.id)} />
                        {spec.displayName}
                      </MenuItem>
                    ))}
                    {/* Done button as MenuItem */}
                    <MenuItem
                      value="DONE_BUTTON"
                      sx={{
                        borderTop: "1px solid #E8EDE0",
                        bgcolor: "#f5f5f5",
                        justifyContent: "flex-end",
                        "&:hover": {
                          bgcolor: "#E8EDE0",
                        },
                        "& .MuiCheckbox-root": {
                          display: "none",
                        },
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ minWidth: 80 }}
                      >
                        {t("done", language)}
                      </Button>
                    </MenuItem>
                  </Select>

                  <Typography variant="caption" sx={{ mt: 0.5, color: "text.secondary", display: "block" }}>
                    {allowAllSpecializations
                      ? t("serviceAvailableToAllSpecializations", language)
                      : selectedSpecializationIds.length > 0
                      ? `${t("selected", language)}: ${selectedSpecializationIds.length} ${t("specializationsCount", language)}`
                      : t("pleaseSelectSpecializationOrAllowAll", language)}
                  </Typography>
                </FormControl>
              </Box>
            )}

            {/* Gender Restrictions - For all provider types */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowAllGenders}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAllowAllGenders(checked);
                      if (checked) {
                        setSelectedGenders([]);
                      }
                    }}
                  />
                }
                label={t("allowAllGendersNoRestrictions", language)}
              />

              <FormControl fullWidth sx={{ mt: 2 }} disabled={allowAllGenders}>
                <InputLabel>{t("allowedGenders", language)}</InputLabel>
                <Select
                  multiple
                  open={genderSelectOpen}
                  onOpen={() => setGenderSelectOpen(true)}
                  onClose={() => setGenderSelectOpen(false)}
                  value={selectedGenders}
                  onChange={(e) => {
                    const value = e.target.value;
                    const filteredValue = Array.isArray(value) 
                      ? value.filter(v => v !== "DONE_BUTTON")
                      : (typeof value === "string" ? value.split(",").filter(v => v !== "DONE_BUTTON") : value);
                    const newGenders = typeof filteredValue === "string" ? filteredValue.split(",") : filteredValue;
                    setSelectedGenders(newGenders);
                    if (newGenders.length > 0) {
                      setAllowAllGenders(false);
                    }
                    if (Array.isArray(value) && value.includes("DONE_BUTTON")) {
                      setGenderSelectOpen(false);
                    }
                  }}
                  input={<OutlinedInput label={t("allowedGenders", language)} />}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <Typography sx={{ color: "text.secondary" }}>{t("selectGenders", language)}</Typography>;
                    }
                    return (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(selected || []).map((gender) => {
                          const genderOption = genderOptions.find(g => g.value === gender);
                          return (
                            <Chip
                              key={gender}
                              label={genderOption?.label || gender}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    );
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {(genderOptions || []).map((gender) => (
                    <MenuItem key={gender.value} value={gender.value}>
                      <Checkbox checked={selectedGenders.includes(gender.value)} />
                      {gender.label}
                    </MenuItem>
                  ))}
                  <MenuItem
                    value="DONE_BUTTON"
                    sx={{
                      borderTop: "1px solid #E8EDE0",
                      bgcolor: "#f5f5f5",
                      justifyContent: "flex-end",
                      "&:hover": {
                        bgcolor: "#E8EDE0",
                      },
                      "& .MuiCheckbox-root": {
                        display: "none",
                      },
                    }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ minWidth: 80 }}
                    >
                      {t("done", language)}
                    </Button>
                  </MenuItem>
                </Select>

                <Typography variant="caption" sx={{ mt: 0.5, color: "text.secondary", display: "block" }}>
                  {allowAllGenders
                    ? t("serviceAvailableToAllGenders", language)
                    : selectedGenders.length > 0
                    ? `${t("selected", language)}: ${selectedGenders.length} ${t("gendersCount", language)}`
                    : t("pleaseSelectGenderOrAllowAll", language)}
                </Typography>
              </FormControl>
            </Box>

            {/* Age Restrictions - For all provider types */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                {t("ageRestrictions", language)}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t("minimumAge", language)}
                  type="number"
                  value={form.minAge}
                  onChange={(e) => setForm({ ...form, minAge: e.target.value })}
                  helperText={t("leaveEmptyNoMinAge", language)}
                  fullWidth
                />
                <TextField
                  label={t("maximumAge", language)}
                  type="number"
                  value={form.maxAge}
                  onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
                  helperText={t("leaveEmptyNoMaxAge", language)}
                  fullWidth
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel", language)}</Button>
          <Button variant="contained" onClick={saveForm}>
            {t("save", language)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAILS POPUP */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} fullWidth>
        <DialogTitle>{t("serviceDetails", language)}</DialogTitle>

        <DialogContent>
          {Object.entries(detailsData).map(([key, value]) => (
            <Typography key={key} sx={{ mb: 1 }}>
              <strong>{key}:</strong> {value}
            </Typography>
          ))}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>{t("close", language)}</Button>
        </DialogActions>
      </Dialog>

      {/* DOCTOR SPECIALIZATION DIALOG */}
      <Dialog open={openSpecDialog} onClose={() => setOpenSpecDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {isEditSpec ? t("editSpecialization", language) : t("addNewSpecialization", language)}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label={`${t("displayName", language)} *`}
              value={specForm.displayName}
              onChange={(e) =>
                setSpecForm({ ...specForm, displayName: e.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label={`${t("consultationPrice", language)} *`}
              type="number"
              value={specForm.consultationPrice}
              onChange={(e) =>
                setSpecForm({ ...specForm, consultationPrice: e.target.value })
              }
              fullWidth
              required
              inputProps={{ step: "0.01", min: "0" }}
            />

            {/* Diagnoses Autocomplete with Add New */}
            <Box>
              <Autocomplete
                multiple
                freeSolo
                options={allAvailableDiagnoses}
                value={selectedDiagnoses}
                onChange={(event, newValue) => {
                  setSelectedDiagnoses(newValue);
                  // Auto-populate treatments from global mappings for newly added diagnoses
                  newValue.forEach((diagnosis) => {
                    if (!diagnosisTreatmentMappings[diagnosis] && globalDiagnosisTreatmentMappings[diagnosis]) {
                      // Pre-fill with existing mapped treatments
                      setDiagnosisTreatmentMappings((prev) => ({
                        ...prev,
                        [diagnosis]: globalDiagnosisTreatmentMappings[diagnosis],
                      }));
                      // Also add these treatments to selectedTreatmentPlans
                      globalDiagnosisTreatmentMappings[diagnosis].forEach((treatment) => {
                        if (!selectedTreatmentPlans.includes(treatment)) {
                          setSelectedTreatmentPlans((prev) => [...prev, treatment]);
                        }
                      });
                    }
                  });
                }}
                inputValue={newDiagnosisInput}
                onInputChange={(event, newInputValue) => {
                  setNewDiagnosisInput(newInputValue);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option}
                        {...tagProps}
                        sx={{
                          backgroundColor: "#e3f2fd",
                          color: "#1565c0",
                          fontWeight: 500,
                          "& .MuiChip-deleteIcon": {
                            color: "#1565c0",
                            "&:hover": { color: "#0d47a1" },
                          },
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("diagnoses", language)}
                    placeholder={t("selectOrTypeNewDiagnosis", language) || "Select or type new diagnosis..."}
                    helperText={t("selectFromListOrTypeNew", language) || "Select from list or type new and press Enter"}
                  />
                )}
                filterOptions={(options, params) => {
                  const filtered = options.filter((option) =>
                    option.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  // Add option to create new if input doesn't match any existing
                  if (params.inputValue !== "" && !filtered.includes(params.inputValue)) {
                    filtered.push(params.inputValue);
                  }
                  return filtered;
                }}
                sx={{
                  "& .MuiAutocomplete-tag": {
                    margin: "2px",
                  },
                }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  placeholder={t("addNewDiagnosis", language) || "Add new diagnosis..."}
                  value={newDiagnosisInput}
                  onChange={(e) => setNewDiagnosisInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newDiagnosisInput.trim()) {
                      e.preventDefault();
                      if (!selectedDiagnoses.includes(newDiagnosisInput.trim())) {
                        setSelectedDiagnoses([...selectedDiagnoses, newDiagnosisInput.trim()]);
                      }
                      setNewDiagnosisInput("");
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (newDiagnosisInput.trim() && !selectedDiagnoses.includes(newDiagnosisInput.trim())) {
                      setSelectedDiagnoses([...selectedDiagnoses, newDiagnosisInput.trim()]);
                      setNewDiagnosisInput("");
                    }
                  }}
                  sx={{
                    borderColor: "#556B2F",
                    color: "#556B2F",
                    "&:hover": { borderColor: "#3D4F23", backgroundColor: "rgba(85, 107, 47, 0.08)" },
                  }}
                >
                  {t("add", language)}
                </Button>
              </Stack>
            </Box>

            {/* Diagnosis-Treatment Mapping Section */}
            {selectedDiagnoses.length > 0 && (
              <Box sx={{ mt: 2, p: 2, border: "1px dashed #7B8B5E", borderRadius: 2, backgroundColor: "#fafafa" }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold", color: "#556B2F" }}>
                  {t("linkTreatmentsToDiagnoses", language) || "Link Treatments to Diagnoses"}
                </Typography>

                {selectedDiagnoses.map((diagnosis) => {
                  // Get treatments linked to this diagnosis
                  const linkedTreatments = diagnosisTreatmentMappings[diagnosis] || [];
                  // Get suggested treatments from global mappings
                  const suggestedTreatments = globalDiagnosisTreatmentMappings[diagnosis] || [];
                  // Combine all available treatments with suggested ones first
                  const treatmentOptions = [
                    ...suggestedTreatments,
                    ...allAvailableTreatments.filter((t) => !suggestedTreatments.includes(t)),
                  ];

                  return (
                    <Box
                      key={diagnosis}
                      sx={{
                        mb: 2,
                        p: 1.5,
                        border: "1px solid #E8EDE0",
                        borderRadius: 1,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#1565c0", mb: 1 }}>
                        {diagnosis}
                      </Typography>
                      <Autocomplete
                        multiple
                        freeSolo
                        size="small"
                        options={treatmentOptions}
                        value={linkedTreatments}
                        onChange={(event, newValue) => {
                          // Update mappings for this diagnosis
                          setDiagnosisTreatmentMappings((prev) => ({
                            ...prev,
                            [diagnosis]: newValue,
                          }));
                          // Also ensure these treatments are in selectedTreatmentPlans
                          newValue.forEach((treatment) => {
                            if (!selectedTreatmentPlans.includes(treatment)) {
                              setSelectedTreatmentPlans((prev) => [...prev, treatment]);
                            }
                          });
                        }}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return (
                              <Chip
                                key={key}
                                label={option}
                                size="small"
                                {...tagProps}
                                sx={{
                                  backgroundColor: "#fff3e0",
                                  color: "#e65100",
                                  fontWeight: 500,
                                  "& .MuiChip-deleteIcon": {
                                    color: "#e65100",
                                    "&:hover": { color: "#bf360c" },
                                  },
                                }}
                              />
                            );
                          })
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={t("selectTreatmentsForDiagnosis", language) || "Select treatments for this diagnosis..."}
                          />
                        )}
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          const isSuggested = suggestedTreatments.includes(option);
                          return (
                            <li key={key} {...otherProps}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {option}
                                {isSuggested && (
                                  <Chip
                                    label={t("suggested", language) || "Suggested"}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#e8f5e9",
                                      color: "#2e7d32",
                                      fontSize: "0.7rem",
                                      height: "20px",
                                    }}
                                  />
                                )}
                              </Box>
                            </li>
                          );
                        }}
                        filterOptions={(options, params) => {
                          const filtered = options.filter((option) =>
                            option.toLowerCase().includes(params.inputValue.toLowerCase())
                          );
                          if (params.inputValue !== "" && !filtered.includes(params.inputValue)) {
                            filtered.push(params.inputValue);
                          }
                          return filtered;
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* All Treatment Plans (Combined View) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#556B2F" }}>
                {t("allTreatmentPlans", language) || "All Treatment Plans"}
              </Typography>
              <Autocomplete
                multiple
                freeSolo
                options={allAvailableTreatments}
                value={selectedTreatmentPlans}
                onChange={(event, newValue) => {
                  setSelectedTreatmentPlans(newValue);
                }}
                inputValue={newTreatmentInput}
                onInputChange={(event, newInputValue) => {
                  setNewTreatmentInput(newInputValue);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    // Check if this treatment is linked to any selected diagnosis
                    const isLinked = selectedDiagnoses.some(
                      (d) => diagnosisTreatmentMappings[d]?.includes(option)
                    );
                    return (
                      <Chip
                        key={key}
                        label={option}
                        {...tagProps}
                        sx={{
                          backgroundColor: isLinked ? "#e8f5e9" : "#fff3e0",
                          color: isLinked ? "#2e7d32" : "#e65100",
                          fontWeight: 500,
                          "& .MuiChip-deleteIcon": {
                            color: isLinked ? "#2e7d32" : "#e65100",
                            "&:hover": { color: isLinked ? "#1b5e20" : "#bf360c" },
                          },
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("treatmentPlans", language)}
                    placeholder={t("selectOrTypeNewTreatment", language) || "Select or type new treatment..."}
                    helperText={t("greenTreatmentsLinkedToDiagnoses", language) || "Green = linked to a diagnosis, Orange = standalone"}
                  />
                )}
                filterOptions={(options, params) => {
                  const filtered = options.filter((option) =>
                    option.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  if (params.inputValue !== "" && !filtered.includes(params.inputValue)) {
                    filtered.push(params.inputValue);
                  }
                  return filtered;
                }}
                sx={{
                  "& .MuiAutocomplete-tag": {
                    margin: "2px",
                  },
                }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  placeholder={t("addNewTreatment", language) || "Add new treatment..."}
                  value={newTreatmentInput}
                  onChange={(e) => setNewTreatmentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newTreatmentInput.trim()) {
                      e.preventDefault();
                      if (!selectedTreatmentPlans.includes(newTreatmentInput.trim())) {
                        setSelectedTreatmentPlans([...selectedTreatmentPlans, newTreatmentInput.trim()]);
                      }
                      setNewTreatmentInput("");
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (newTreatmentInput.trim() && !selectedTreatmentPlans.includes(newTreatmentInput.trim())) {
                      setSelectedTreatmentPlans([...selectedTreatmentPlans, newTreatmentInput.trim()]);
                      setNewTreatmentInput("");
                    }
                  }}
                  sx={{
                    borderColor: "#556B2F",
                    color: "#556B2F",
                    "&:hover": { borderColor: "#3D4F23", backgroundColor: "rgba(85, 107, 47, 0.08)" },
                  }}
                >
                  {t("add", language)}
                </Button>
              </Stack>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowAllSpecGenders}
                    onChange={(e) => {
                      setAllowAllSpecGenders(e.target.checked);
                      if (e.target.checked) {
                        setSelectedSpecGenders([]);
                      }
                    }}
                  />
                }
                label={t("allowAllGenders", language)}
              />
              <FormControl
                fullWidth
                sx={{ mt: 2 }}
                disabled={allowAllSpecGenders}
              >
                <InputLabel>{t("allowedGenders", language)}</InputLabel>
                <Select
                  multiple
                  value={selectedSpecGenders}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedSpecGenders(
                      typeof value === "string" ? value.split(",") : value
                    );
                    if (value.length > 0) {
                      setAllowAllSpecGenders(false);
                    }
                  }}
                  input={<OutlinedInput label={t("allowedGenders", language)} />}
                  renderValue={(selected) =>
                    selected
                      .map(
                        (g) =>
                          genderOptions.find((opt) => opt.value === g)?.label ||
                          g
                      )
                      .join(", ")
                  }
                >
                  {(genderOptions || []).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox
                        checked={selectedSpecGenders.includes(option.value)}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Stack direction="row" spacing={2}>
              <TextField
                label={t("minimumAge", language)}
                type="number"
                value={specForm.minAge}
                onChange={(e) =>
                  setSpecForm({ ...specForm, minAge: e.target.value })
                }
                fullWidth
                inputProps={{ min: "0" }}
              />
              <TextField
                label={t("maximumAge", language)}
                type="number"
                value={specForm.maxAge}
                onChange={(e) =>
                  setSpecForm({ ...specForm, maxAge: e.target.value })
                }
                fullWidth
                inputProps={{ min: "0" }}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>{t("genderRestriction", language)}</InputLabel>
              <Select
                value={specForm.gender || ""}
                onChange={(e) =>
                  setSpecForm({ ...specForm, gender: e.target.value })
                }
                label={t("genderRestriction", language)}
              >
                <MenuItem value="ALL">{t("allGenders", language)}</MenuItem>
                <MenuItem value="MALE">{t("maleOnly", language)}</MenuItem>
                <MenuItem value="FEMALE">{t("femaleOnly", language)}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSpecDialog(false)}>{t("cancel", language)}</Button>
          <Button onClick={saveSpecForm} variant="contained" color="primary">
            {isEditSpec ? t("update", language) : t("create", language)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProviderPriceList;
