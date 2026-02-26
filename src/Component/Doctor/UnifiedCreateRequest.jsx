import React, { useState, useEffect } from "react";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Divider,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import MedicationIcon from "@mui/icons-material/Medication";
import ScienceIcon from "@mui/icons-material/Science";
import RadiologistIcon from "@mui/icons-material/ImageSearch";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

// Import sub-components
import PatientInfoSection from "./UnifiedRequest/PatientInfoSection";
import MedicineList from "./UnifiedRequest/MedicineList";
import TestsSection from "./UnifiedRequest/TestsSection";
import DiagnosisTreatmentSection from "./UnifiedRequest/DiagnosisTreatmentSection";
import ClaimFormSection from "./UnifiedRequest/ClaimFormSection";

// Import custom hooks
import { useMedicineValidation, usePatientLookup } from "./UnifiedRequest/medicineValidation.jsx";
import { useSubmissions } from "./UnifiedRequest/useSubmissions.jsx";
import { useDataFetching } from "./UnifiedRequest/useDataFetching.jsx";

// Import utilities
import { filterByRestrictions } from "./UnifiedRequest/requestHelpers.jsx";
import { useRequestSubmitHandler, useClaimSubmitHandler } from "./UnifiedRequest/useRequestHandlers.jsx";

const UnifiedCreateRequest = () => {
  // Responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const _isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { language, isRTL: _isRTL } = useLanguage();

  // Get authentication token
  const token = getToken() || "";

  // Snackbar state (needed early for showSuccess/showError)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: "success" });
  };

  const showError = (message) => {
    // Ensure message is a string
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    if (!messageStr || messageStr.trim() === '') {
      console.warn("⚠️ Empty message passed to showError");
      return;
    }
    setSnackbar({ open: true, message: messageStr, severity: "error" });
  };

  // Patient & Diagnosis
  const [patientForm, setPatientForm] = useState({
    employeeId: "",
    nationalId: "",
    memberId: "",
    memberName: "",
    phone: "",
    age: "",
    gender: "",
    diagnosis: "",
    treatment: "",
  });

  // Flag to indicate if diagnosis/treatment are not needed
  const [noDiagnosisTreatment, setNoDiagnosisTreatment] = useState(false);

  // Family Members
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  
  // Use patient lookup custom hook
  const {
    lookupLoading,
    patientInfoLoaded,
    mainClientInfo,
    familyMembers,
    chronicDiseases,
    setPatientInfoLoaded: _setPatientInfoLoaded,
    lookupPatient,
    lookupPatientByNationalId,
    calculateAge,
  } = usePatientLookup();

  // Use medicine validation hook
  const { checkActivePrescription } = useMedicineValidation(selectedFamilyMember, patientForm);

  // Doctor ID for visit creation
  const [doctorId, setDoctorId] = useState(null);

  // Use submissions hook for visit creation and request submission
  const { loading: _submissionLoading, createVisit: _createVisit, submitRequests: _submitRequests, submitClaim: _submitClaim } = useSubmissions(
    showSuccess,
    showError
  );

  // Use data fetching hook for specializations
  const {
    specializations: specializationsFromHook,
    loadingSpecializations: _loadingSpecializations,
    fetchSpecializations: fetchSpecializationsFromHook,
    checkFollowUpVisit: _checkFollowUpVisitFromHook,
    checkSameSpecializationSameDay: _checkSameSpecializationSameDayFromHook,
  } = useDataFetching(doctorId, showError);

  // Specialization state
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedSpecializationData, setSelectedSpecializationData] = useState(null); // Store full specialization data including restrictions
  const [availableDiagnoses, setAvailableDiagnoses] = useState([]);
  const [availableTreatments, setAvailableTreatments] = useState([]);
  const [diagnosisTreatmentMappings, setDiagnosisTreatmentMappings] = useState({}); // Mappings from diagnosis to treatments
  
  // Track if specialization restrictions are not met
  const [specializationRestrictionFailed, setSpecializationRestrictionFailed] = useState(false);
  const [restrictionFailureReason, setRestrictionFailureReason] = useState("");
  
  // Track if patient has same specialization restriction (visited another doctor with same specialization today)
  const [hasSameSpecializationRestriction, setHasSameSpecializationRestriction] = useState(false);

  // Items Lists
  const [_medicines, _setMedicines] = useState([]);
  const [_labTests, _setLabTests] = useState([]);
  const [_radiologyTests, _setRadiologyTests] = useState([]);

  // Selected Items
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState([]);

  // Available Options
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [availableLabTests, setAvailableLabTests] = useState([]);
  const [availableRadiologyTests, setAvailableRadiologyTests] = useState([]);

  // Store raw data for re-filtering when patient info changes
  const [rawMedicines, setRawMedicines] = useState([]);
  const [rawLabTests, setRawLabTests] = useState([]);
  const [rawRadiologyTests, setRawRadiologyTests] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [requestCreated, setRequestCreated] = useState(false);
  
  // Follow-up visit state
  const [isFollowUpVisit, setIsFollowUpVisit] = useState(false);
  const [_followUpMessage, setFollowUpMessage] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    message: "",
    index: null,
    medicine: null,
  });
  
  // Autocomplete values for reset
  const [selectedMedicineValue, setSelectedMedicineValue] = useState(null);
  const [selectedMedicineInput, setSelectedMedicineInput] = useState(""); // For input text clearing
  const [selectedLabTestValue, setSelectedLabTestValue] = useState(null);
  const [selectedRadiologyTestValue, setSelectedRadiologyTestValue] = useState(null);

  const [claimForm, setClaimForm] = useState({
    description: "",
    amount: "",
    document: null,
  });

  // calculateAge is now provided by usePatientLookup hook

  // Sync specializations from hook to local state
  useEffect(() => {
    if (specializationsFromHook && specializationsFromHook.length > 0) {
      setSpecializations(specializationsFromHook);
    }
  }, [specializationsFromHook]);

  // Fetch available options on mount
  useEffect(() => {
    if (!token) return;
    fetchAvailableOptions();
    fetchDoctorSpecialization();
    fetchSpecializationsFromHook(); // Use hook's function instead of local function
  }, [token]);

  // Re-filter available options when patient age, gender, selected family member, or specialization changes
  useEffect(() => {
    // Don't filter if raw data hasn't been loaded yet (check for undefined or empty arrays)
    const hasMedicines = rawMedicines && rawMedicines.length > 0;
    const hasLabTests = rawLabTests && rawLabTests.length > 0;
    const hasRadiologyTests = rawRadiologyTests && rawRadiologyTests.length > 0;

    if (!hasMedicines && !hasLabTests && !hasRadiologyTests) {
      return;
    }

    // Re-apply filters with current patient info (main client or selected family member) and specialization restrictions
    const filteredMedicines = hasMedicines ? filterByRestrictionsWrapper(rawMedicines, "medicine") : [];
    const filteredLabTests = hasLabTests ? filterByRestrictionsWrapper(rawLabTests, "lab") : [];
    const filteredRadiologyTests = hasRadiologyTests ? filterByRestrictionsWrapper(rawRadiologyTests, "radiology") : [];

    setAvailableMedicines(filteredMedicines);
    setAvailableLabTests(filteredLabTests);
    setAvailableRadiologyTests(filteredRadiologyTests);
  }, [patientForm.age, patientForm.gender, selectedFamilyMember, selectedSpecializationData]);

  // Handle specialization change
  const _handleSpecializationChange = (event) => {
    const specDisplayName = event.target.value;
    setSelectedSpecialization(specDisplayName);

    // Reset restriction failure state when specialization changes
    setSpecializationRestrictionFailed(false);
    setRestrictionFailureReason("");

    // Add null safety check for specializations array
    const selectedSpec = (specializations || []).find(s => s.displayName === specDisplayName);
    if (selectedSpec) {
      // Store full specialization data including restrictions
      setSelectedSpecializationData(selectedSpec);
          setAvailableDiagnoses(selectedSpec.diagnoses || []);
          setAvailableTreatments(selectedSpec.treatmentPlans || []);
          // Set diagnosis-treatment mappings
          setDiagnosisTreatmentMappings(selectedSpec.diagnosisTreatmentMappings || {});
          // Clear diagnosis and treatment when specialization changes
          setPatientForm(prev => ({ ...prev, diagnosis: "", treatment: "" }));

        } else {
          setSelectedSpecializationData(null);
          setAvailableDiagnoses([]);
          setAvailableTreatments([]);
          setDiagnosisTreatmentMappings({});
        }
      };

  // Wrapper for filterByRestrictions utility function
  const filterByRestrictionsWrapper = (items, itemType = "medicine") => {
    return filterByRestrictions(
      items,
      itemType,
      selectedFamilyMember,
      patientForm,
      selectedSpecializationData,
      setSpecializationRestrictionFailed,
      setRestrictionFailureReason,
      calculateAge
    );
  };

  const fetchAvailableOptions = async () => {
    try {
      // These endpoints automatically apply restrictions based on doctor's specialization
      // The backend filters out services that are not allowed for the doctor's specialization
      const [medRes, labRes, radRes] = await Promise.all([
        api.get(API_ENDPOINTS.PRICELIST.BY_TYPE("PHARMACY")),
        api.get("/api/pricelist/lab/tests"),
        api.get("/api/pricelist/radiology/tests"),
      ]);

      // Format medicines and keep full item data for filtering
      // Note: api.get() returns response.data directly, so medRes IS the data array
      const formattedMedicines = (medRes || []).map((item) => ({
        id: item.id,
        name: item.serviceName,
        scientificName: item.serviceDetails?.scientificName || "",
        quantity: item.serviceDetails?.quantity || 0,
        unionPrice: item.price,
        form: item.serviceDetails?.form || "",
        coverageStatus: item.serviceDetails?.coverageStatus || "COVERED",
        coveragePercentage: item.serviceDetails?.coveragePercentage || 100,
        fullItem: item, // Keep full item for filtering
      }));

      // Format lab tests and keep full item data for filtering
      const formattedLabTests = (labRes || []).map((item) => ({
        id: item.id,
        name: item.serviceName || item.testName,
        fullItem: item, // Keep full item for filtering (includes allowedGenders, minAge, maxAge)
      }));

      // Format radiology tests and keep full item data for filtering
      const formattedRadiologyTests = (radRes || []).map((item) => ({
        id: item.id,
        name: item.serviceName || item.scanName,
        fullItem: item, // Keep full item for filtering (includes allowedGenders, minAge, maxAge)
      }));

      // Store raw data for re-filtering (includes allowedGenders, minAge, maxAge from backend)
      setRawMedicines(formattedMedicines);
      setRawLabTests(formattedLabTests); // Lab tests with restrictions
      setRawRadiologyTests(formattedRadiologyTests); // Radiology tests with restrictions

      // Apply gender and age restrictions to all types (medicines, lab tests, radiology)
      // This applies BOTH specialization restrictions AND item-level restrictions
      const filteredMedicines = filterByRestrictionsWrapper(formattedMedicines, "medicine");
      const filteredLabTests = filterByRestrictionsWrapper(formattedLabTests, "lab");
      const filteredRadiologyTests = filterByRestrictionsWrapper(formattedRadiologyTests, "radiology");

      setAvailableMedicines(filteredMedicines);
      setAvailableLabTests(filteredLabTests);
      setAvailableRadiologyTests(filteredRadiologyTests);
      
      // Show info if no items available (might be due to restrictions)
      if (filteredMedicines.length === 0 && formattedMedicines.length > 0) {
        // No medicines available after filtering
      }
      if (filteredLabTests.length === 0 && formattedLabTests.length > 0) {
        // No lab tests available after filtering
      }
      if (filteredRadiologyTests.length === 0 && formattedRadiologyTests.length > 0) {
        // No radiology tests available after filtering
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || "Failed to load available options";
      showError(`Failed to load available options: ${errorMessage}`);
    }
  };

  // Check if current visit is a follow-up visit
  // Check if patient can visit same specialization on same day
  const checkSameSpecializationSameDay = async (patientId, familyMemberId) => {
    if (!patientId && !familyMemberId) {
      setHasSameSpecializationRestriction(false);
      return; // Can't check without patient
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      // Get doctor's specialization
      // Note: api.get() returns response.data directly
      let currentDoctorId = doctorId;
      let doctorSpecialization = null;

      if (!currentDoctorId) {
        const doctorData = await api.get(API_ENDPOINTS.AUTH.ME);
        if (doctorData?.id) {
          currentDoctorId = doctorData.id;
          setDoctorId(currentDoctorId);
        }
        doctorSpecialization = doctorData?.specialization;
      } else {
        const doctorData = await api.get(API_ENDPOINTS.AUTH.ME);
        doctorSpecialization = doctorData?.specialization;
      }

      if (!doctorSpecialization || !currentDoctorId) {
        setHasSameSpecializationRestriction(false);
        return; // Can't check without specialization or doctor ID
      }

      // Get patient's visits for today
      // Note: api.get() returns response.data directly
      const visitsData = await api.get(
        `/api/visits/patient/year?${patientId ? `patientId=${patientId}` : `familyMemberId=${familyMemberId}`}&year=${new Date().getFullYear()}`
      );

      if (visitsData && Array.isArray(visitsData)) {
        // Filter visits from today with same specialization but different doctor
        const todayVisits = visitsData.filter(v => {
          const visitDate = new Date(v.visitDate).toISOString().split("T")[0];
          return visitDate === today &&
                 v.doctorSpecialization === doctorSpecialization &&
                 v.doctorId !== currentDoctorId;
        });

        if (todayVisits.length > 0) {
          setHasSameSpecializationRestriction(true);
          showError("You couldn't visit two doctors on the same day with the same specialization.");
          return;
        } else {
          setHasSameSpecializationRestriction(false);
        }
      } else {
        setHasSameSpecializationRestriction(false);
      }
    } catch {
      setHasSameSpecializationRestriction(false);
      // Don't show error if check fails - let backend handle it
    }
  };

  const checkFollowUpVisit = async (patientId, familyMemberId) => {
    // If doctor ID is not loaded yet, wait a bit and try again
    // Note: api.get() returns response.data directly
    let currentDoctorId = doctorId;
    if (!currentDoctorId) {
      try {
        const doctorData = await api.get(API_ENDPOINTS.AUTH.ME);
        if (doctorData?.id) {
          currentDoctorId = doctorData.id;
          setDoctorId(currentDoctorId);
        }
      } catch {
        // Error fetching doctor ID
      }
    }

    if (!currentDoctorId || (!patientId && !familyMemberId)) {
      setIsFollowUpVisit(false);
      setFollowUpMessage("");
      return;
    }

    try {
      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Create a temporary visit to check if it would be a follow-up
      // We'll check the last visit with same doctor
      // Note: api.get() returns response.data directly
      const visitsData = await api.get(
        `/api/visits/patient/year?${patientId ? `patientId=${patientId}` : `familyMemberId=${familyMemberId}`}&year=${new Date().getFullYear()}`
      );

      if (visitsData && Array.isArray(visitsData)) {
        // Find last visit with same doctor
        const lastVisitWithSameDoctor = visitsData
          .filter(v => v.doctorId === currentDoctorId)
          .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))[0];

        if (lastVisitWithSameDoctor) {
          const lastVisitDate = new Date(lastVisitWithSameDoctor.visitDate);
          const todayDate = new Date(today);
          const daysDiff = Math.floor((todayDate - lastVisitDate) / (1000 * 60 * 60 * 24));

          // Check if same day or within 14 days
          if (daysDiff === 0 || (daysDiff > 0 && daysDiff <= 14)) {
            setIsFollowUpVisit(true);
            setFollowUpMessage("⚠️ This is a Follow-up visit. Cannot create prescriptions or tests in a follow-up visit. Only visit registration is allowed.");
            return;
          }
        }
      }

      // Not a follow-up
      setIsFollowUpVisit(false);
      setFollowUpMessage("");
    } catch {
      // If error, assume not follow-up
      setIsFollowUpVisit(false);
      setFollowUpMessage("");
    }
  };

  const fetchDoctorSpecialization = async () => {
    try {
      // Note: api.get() returns response.data directly
      const doctorData = await api.get(API_ENDPOINTS.AUTH.ME);

      // Store doctor ID for visit creation
      if (doctorData?.id) {
        setDoctorId(doctorData.id);

        // Re-check follow-up if patient is already loaded
        if (patientInfoLoaded) {
          if (selectedFamilyMember) {
            await checkFollowUpVisit(null, selectedFamilyMember.id);
          } else if (patientForm.memberId) {
            await checkFollowUpVisit(patientForm.memberId, null);
          }
        }
      }

      const doctorSpecName = doctorData?.specialization; // This could be displayName or enum name
      if (doctorSpecName && Array.isArray(specializations) && specializations.length > 0) {
        // Find the specialization by displayName (or try to match if it's an enum name)
        const matched = specializations.find((s) =>
          s.displayName === doctorSpecName ||
          s.displayName?.toLowerCase() === doctorSpecName?.toLowerCase()
        );
        if (matched) {
          // Set consultation price for claim form
          if (matched.consultationPrice !== undefined) {
            setClaimForm((prev) => ({ ...prev, amount: String(matched.consultationPrice) }));
          }
          // Auto-select doctor's specialization and populate diagnoses/treatments
          setSelectedSpecialization(matched.displayName);
          // Store full specialization data including restrictions (allowedGenders, minAge, maxAge)
          setSelectedSpecializationData(matched);
          setAvailableDiagnoses(matched.diagnoses || []);
          setAvailableTreatments(matched.treatmentPlans || []);
          // Set diagnosis-treatment mappings
          setDiagnosisTreatmentMappings(matched.diagnosisTreatmentMappings || {});
        }
      }
    } catch {
      // Error fetching doctor specialization
    }
  };

  // Update when specializations are loaded to auto-select doctor's specialization
  useEffect(() => {
    if (specializations.length > 0 && token) {
      fetchDoctorSpecialization();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specializations]);

  // Initialize submission handlers using custom hooks
  const handleSubmit = useRequestSubmitHandler({
    token,
    showError,
    showSuccess,
    setLoading,
    setRequestCreated,
    hasSameSpecializationRestriction,
    noDiagnosisTreatment,
    patientForm,
    selectedMedicines,
    selectedLabTests,
    selectedRadiologyTests,
    selectedFamilyMember,
    doctorId,
    setDoctorId,
    selectedSpecializationData,
    language,
  });

  const handleClaimSubmit = useClaimSubmitHandler({
    token,
    showError,
    showSuccess,
    claimForm,
    patientForm,
    selectedFamilyMember,
    isFollowUpVisit,
    selectedSpecialization,
    selectedSpecializationData,
    specializations,
  });

  // Validate if patient matches doctor's specialization restrictions
  const validatePatientForSpecialization = (patientAge, patientGender) => {
    if (!selectedSpecializationData) {
      return { valid: true };
    }

    const spec = selectedSpecializationData;

    // Check gender restrictions
    if (spec.allowedGenders && spec.allowedGenders.length > 0) {
      const normalizedPatientGender = patientGender?.toUpperCase();
      const normalizedAllowedGenders = spec.allowedGenders.map(g => g.toUpperCase());

      if (!normalizedAllowedGenders.includes(normalizedPatientGender)) {
        const genderMessage = language === "ar"
          ? `هذا التخصص (${spec.displayName}) مخصص فقط للمرضى من جنس: ${spec.allowedGenders.join(", ")}`
          : `This specialization (${spec.displayName}) is only for patients of gender: ${spec.allowedGenders.join(", ")}`;
        return { valid: false, message: genderMessage };
      }
    }

    // Check age restrictions
    const age = parseInt(patientAge);
    if (!isNaN(age)) {
      if (spec.minAge !== null && spec.minAge !== undefined && age < spec.minAge) {
        const ageMessage = language === "ar"
          ? `هذا التخصص (${spec.displayName}) مخصص للمرضى من عمر ${spec.minAge} سنة فأكثر. عمر المريض: ${age} سنة`
          : `This specialization (${spec.displayName}) is for patients aged ${spec.minAge} years and above. Patient age: ${age} years`;
        return { valid: false, message: ageMessage };
      }

      if (spec.maxAge !== null && spec.maxAge !== undefined && age > spec.maxAge) {
        const ageMessage = language === "ar"
          ? `هذا التخصص (${spec.displayName}) مخصص للمرضى حتى عمر ${spec.maxAge} سنة. عمر المريض: ${age} سنة`
          : `This specialization (${spec.displayName}) is for patients up to ${spec.maxAge} years old. Patient age: ${age} years`;
        return { valid: false, message: ageMessage };
      }
    }

    return { valid: true };
  };

  const handleEmployeeIdLookup = async () => {
    const clientData = await lookupPatient(patientForm.employeeId, showError);

    if (clientData) {
      setPatientForm((prev) => ({
        ...prev,
        memberId: clientData.id,
        memberName: clientData.fullName,
        phone: clientData.phone,
        age: clientData.age,
        gender: clientData.gender,
        employeeId: clientData.employeeId || prev.employeeId,
        nationalId: clientData.nationalId || "",
      }));
      setSelectedFamilyMember(null);
      setHasSameSpecializationRestriction(false);

      // Check if patient can visit same specialization on same day
      await checkSameSpecializationSameDay(clientData.id, null);

      // Check if this is a follow-up visit
      await checkFollowUpVisit(clientData.id, null);

      showSuccess("✅ Patient information loaded successfully!");
    }
  };

  const handleNationalIdLookup = async () => {
    const clientData = await lookupPatientByNationalId(patientForm.nationalId, showError);

    if (clientData) {
      setPatientForm((prev) => ({
        ...prev,
        memberId: clientData.id,
        memberName: clientData.fullName,
        phone: clientData.phone,
        age: clientData.age,
        gender: clientData.gender,
        employeeId: clientData.employeeId || "",
        nationalId: clientData.nationalId || prev.nationalId,
      }));
      setSelectedFamilyMember(null);
      setHasSameSpecializationRestriction(false);

      // Check if patient can visit same specialization on same day
      await checkSameSpecializationSameDay(clientData.id, null);

      // Check if this is a follow-up visit
      await checkFollowUpVisit(clientData.id, null);

      showSuccess("✅ Patient information loaded successfully!");
    }
  };

  const handleAddMedicine = async (medicine) => {
    // Check for active prescriptions FIRST before adding
    const memberNameToCheck = selectedFamilyMember ? selectedFamilyMember.fullName : patientForm.memberName;
    
    if (memberNameToCheck) {
      const { canProceed, message } = await checkActivePrescription(medicine, memberNameToCheck);
      
      if (!canProceed) {
        showError(message);
        return;
      }
      
      if (message && canProceed) {
        // Show confirmation dialog
        setConfirmDialog({
          open: true,
          message,
          index: selectedMedicines.length,
          medicine: medicine,
        });
        return;
      }
    }

    // Add medicine if no active prescription or user confirmed
    const medicineForm = medicine.form || medicine.fullItem?.serviceDetails?.form || "";
    const updated = [
      ...selectedMedicines,
      { 
        medicineId: medicine.id, 
        medicine, 
        form: medicineForm,
        dosage: 1, 
        timesPerDay: 2, 
        duration: "",
        noDosage: false
      },
    ];
    setSelectedMedicines(updated);
    setActiveTab(0);
  };

  const handleRemoveMedicine = (index) => {
    if (selectedMedicines.length === 1) {
      showError("Prescription must have at least one medicine");
      return;
    }
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index, field, value) => {
    const updated = [...selectedMedicines];
    updated[index][field] = value;
    setSelectedMedicines(updated);
  };

  const _handleMedicineChange = async (index, field, value) => {
    // Check for active prescriptions when medicine is being changed
    const memberNameToCheck = selectedFamilyMember ? selectedFamilyMember.fullName : patientForm.memberName;
    
    if (field === "medicine" && value && memberNameToCheck) {
      const result = await checkActivePrescription(value, memberNameToCheck);
      
      if (!result.canProceed) {
        // Show error and don't update medicine
        showError(result.message || "Medicine is blocked due to active prescription");
        return;
      }

      if (result.message) {
        // Show confirmation dialog if there's a message (user can proceed but with warning)
        setConfirmDialog({
          open: true,
          message: result.message,
          index,
          medicine: value,
        });
        return;
      }
    }

    // Update medicine if no active prescription or user confirmed
    const updated = [...selectedMedicines];
    updated[index][field] = value;
    
    // If medicine is being changed, update the form as well
    if (field === "medicine" && value) {
      const medicineForm = value.form || value.fullItem?.serviceDetails?.form || "";
      updated[index].form = medicineForm;
    }
    
    setSelectedMedicines(updated);
  };

  const handleConfirmCancel = () => {
    // Reset the medicine to null (like AddPrescription does)
    const updated = [...selectedMedicines];
    updated[confirmDialog.index] = {
      medicineId: null,
      medicine: null,
      dosage: 1,
      timesPerDay: 2,
      duration: "",
    };
    setSelectedMedicines(updated);
    setConfirmDialog({ open: false, message: "", index: null, medicine: null });
  };

  const handleConfirmContinue = () => {
    // Medicine is already set, just close the dialog (like AddPrescription)
    setConfirmDialog({ open: false, message: "", index: null, medicine: null });
  };

  const handleAddLabTest = (test) => {
    setSelectedLabTests([...selectedLabTests, { testId: test.id, test }]);
    setActiveTab(1);
  };

  const handleAddRadiologyTest = (test) => {
    setSelectedRadiologyTests([...selectedRadiologyTests, { testId: test.id, test }]);
    setActiveTab(2);
  };

  const handleRemoveLabTest = (index) => {
    setSelectedLabTests(selectedLabTests.filter((_, i) => i !== index));
  };

  const handleRemoveRadiologyTest = (index) => {
    setSelectedRadiologyTests(selectedRadiologyTests.filter((_, i) => i !== index));
  };

  const _toLatinDigits = (input) => {
    if (input === null || input === undefined) return "";
    const s = String(input);
    const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
    const latin = "0123456789";
    return s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (ch) => latin[arabicIndic.indexOf(ch)]);
  };

  if (requestCreated) {
    return (
      <ClaimFormSection
        claimForm={claimForm}
        setClaimForm={setClaimForm}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
        onClaimSubmit={handleClaimSubmit}
        isFollowUpVisit={isFollowUpVisit}
        onSkipClaim={() => {
          localStorage.setItem("doctorActiveView", "create-center");
          window.location.href = "/DoctorDashboard";
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        background: "linear-gradient(180deg,#ffffff 0%,#ecfeff 100%)",
        border: "1px solid rgba(125,211,252,0.4)",
        borderRadius: { xs: 2, md: 3 },
        px: { xs: 1.5, sm: 2, md: 3.2 },
        py: { xs: 2, sm: 2.5, md: 3.3 },
        mx: { xs: 1, sm: 2, md: 0 },
        boxShadow: { xs: "0 8px 24px rgba(13,148,136,0.08)", md: "0 22px 48px rgba(13,148,136,0.12)" },
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, md: 2 }} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Avatar
            sx={{
              bgcolor: "rgba(14,165,233,0.12)",
              color: "#0284c7",
              width: { xs: 48, md: 56 },
              height: { xs: 48, md: 56 },
              display: { xs: "none", sm: "flex" },
            }}
          >
            <LocalPharmacyIcon sx={{ fontSize: { xs: 26, md: 32 } }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              fontWeight={700}
              color="#0f172a"
              sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" } }}
            >
              {t("unifiedMedicalRequests", language)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#5d6b5d", fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, display: { xs: "none", sm: "block" } }}
            >
              {t("unifiedMedicalRequestsDesc", language)}
            </Typography>
          </Box>
          <Chip
            icon={<DoneAllIcon fontSize="small" />}
            label={t("allInOne", language)}
            size={isMobile ? "small" : "medium"}
            sx={{
              backgroundColor: "rgba(14,165,233,0.12)",
              color: "#0ea5e9",
              fontWeight: 600,
              px: { xs: 1, md: 2 },
              py: { xs: 1.5, md: 2.5 },
              display: { xs: "none", sm: "flex" },
            }}
          />
        </Stack>

        <Divider sx={{ borderColor: "rgba(14,165,233,0.18)" }} />

        {/* Patient Info Section */}
        <PatientInfoSection
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          lookupLoading={lookupLoading}
          patientInfoLoaded={patientInfoLoaded}
          mainClientInfo={mainClientInfo}
          familyMembers={familyMembers}
          selectedFamilyMember={selectedFamilyMember}
          setSelectedFamilyMember={setSelectedFamilyMember}
          chronicDiseases={chronicDiseases}
          isFollowUpVisit={isFollowUpVisit}
          hasSameSpecializationRestriction={hasSameSpecializationRestriction}
          calculateAge={calculateAge}
          handleEmployeeIdLookup={handleEmployeeIdLookup}
          handleNationalIdLookup={handleNationalIdLookup}
          validatePatient={validatePatientForSpecialization}
          showError={showError}
          onPatientChange={(patientId, familyMemberId) => {
            // Reset restriction failure state when changing patient
            setSpecializationRestrictionFailed(false);
            setRestrictionFailureReason("");
            setHasSameSpecializationRestriction(false);
            
            // Check if patient can visit same specialization on same day
            if (patientId || familyMemberId) {
              checkSameSpecializationSameDay(patientId, familyMemberId);
            }
            
            // Check follow-up for selected patient
            if (doctorId && (patientId || familyMemberId)) {
              checkFollowUpVisit(patientId, familyMemberId);
            }
          }}
        />

        {patientInfoLoaded && (
          <>
            {/* Diagnosis & Treatment */}
            <DiagnosisTreatmentSection
              noDiagnosisTreatment={noDiagnosisTreatment}
              setNoDiagnosisTreatment={setNoDiagnosisTreatment}
              patientForm={patientForm}
              setPatientForm={setPatientForm}
              selectedSpecialization={selectedSpecialization}
              specializations={specializations}
              availableDiagnoses={availableDiagnoses}
              availableTreatments={availableTreatments}
              diagnosisTreatmentMappings={diagnosisTreatmentMappings}
              hasSameSpecializationRestriction={hasSameSpecializationRestriction}
              specializationRestrictionFailed={specializationRestrictionFailed}
              restrictionFailureReason={restrictionFailureReason}
              selectedFamilyMember={selectedFamilyMember}
            />

            {/* Tabs for Adding Items */}
            <Paper elevation={2} sx={{ borderRadius: { xs: 1.5, md: 2 }, opacity: hasSameSpecializationRestriction ? 0.6 : 1, overflow: "hidden" }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  "& .MuiTab-root": {
                    minWidth: { xs: "auto", sm: 120 },
                    px: { xs: 1, sm: 2 },
                    py: { xs: 1, sm: 1.5 },
                    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                  },
                  "& .MuiTabs-flexContainer": {
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                  },
                }}
                disabled={hasSameSpecializationRestriction}
                variant={isMobile ? "fullWidth" : "standard"}
              >
                <Tab
                  icon={<MedicationIcon sx={{ fontSize: { xs: 18, sm: 20, md: 24 } }} />}
                  label={isMobile ? `(${selectedMedicines.length})` : `${t("medicines", language)} (${selectedMedicines.length})`}
                  sx={{ textTransform: "none" }}
                  iconPosition={isMobile ? "start" : "top"}
                />
                <Tab
                  icon={<ScienceIcon sx={{ fontSize: { xs: 18, sm: 20, md: 24 } }} />}
                  label={isMobile ? `(${selectedLabTests.length})` : `${t("labTests", language)} (${selectedLabTests.length})`}
                  sx={{ textTransform: "none" }}
                  iconPosition={isMobile ? "start" : "top"}
                />
                <Tab
                  icon={<RadiologistIcon sx={{ fontSize: { xs: 18, sm: 20, md: 24 } }} />}
                  label={isMobile ? `(${selectedRadiologyTests.length})` : `${t("radiology", language)} (${selectedRadiologyTests.length})`}
                  sx={{ textTransform: "none" }}
                  iconPosition={isMobile ? "start" : "top"}
                />
              </Tabs>

              <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                {/* Medicines Tab */}
                {activeTab === 0 && (
                  <MedicineList
                    selectedMedicines={selectedMedicines}
                    availableMedicines={availableMedicines}
                    selectedMedicineValue={selectedMedicineValue}
                    selectedMedicineInput={selectedMedicineInput}
                    setSelectedMedicineValue={setSelectedMedicineValue}
                    setSelectedMedicineInput={setSelectedMedicineInput}
                    hasSameSpecializationRestriction={hasSameSpecializationRestriction}
                    onAddMedicine={handleAddMedicine}
                    onRemoveMedicine={handleRemoveMedicine}
                    onUpdateMedicine={handleUpdateMedicine}
                  />
                )}

                {/* Lab and Radiology Tests Tab */}
                {(activeTab === 1 || activeTab === 2) && (
                  <TestsSection
                    selectedLabTests={selectedLabTests}
                    selectedRadiologyTests={selectedRadiologyTests}
                    availableLabTests={availableLabTests}
                    availableRadiologyTests={availableRadiologyTests}
                    selectedLabTestValue={selectedLabTestValue}
                    selectedRadiologyTestValue={selectedRadiologyTestValue}
                    setSelectedLabTestValue={setSelectedLabTestValue}
                    setSelectedRadiologyTestValue={setSelectedRadiologyTestValue}
                    hasSameSpecializationRestriction={hasSameSpecializationRestriction}
                    onAddLabTest={handleAddLabTest}
                    onAddRadiologyTest={handleAddRadiologyTest}
                    onRemoveLabTest={handleRemoveLabTest}
                    onRemoveRadiologyTest={handleRemoveRadiologyTest}
                    activeSubTab={activeTab === 1 ? 0 : 1}
                  />
                )}
              </Box>
            </Paper>

            {/* Submit */}
            {!specializationRestrictionFailed && (
              <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: { xs: 1.5, md: 2 }, bgcolor: "#f0f9ff", border: "2px solid #0ea5e9" }}>
                <Stack spacing={{ xs: 1.5, md: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <InfoIcon sx={{ color: "#0ea5e9", fontSize: { xs: 18, md: 24 } }} />
                    <Typography variant="body2" color="#0f172a" fontWeight={500} sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" } }}>
                      {t("allRequestsSentToProviders", language)}
                    </Typography>
                  </Stack>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || hasSameSpecializationRestriction}
                    size={isMobile ? "medium" : "large"}
                    fullWidth={isMobile}
                    sx={{
                      px: { xs: 3, md: 5 },
                      py: { xs: 1.2, md: 1.8 },
                      borderRadius: { xs: 2, md: 3 },
                      fontWeight: 700,
                      fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                      background: "linear-gradient(90deg,#0ea5e9,#14b8a6)",
                      boxShadow: { xs: "0 8px 16px rgba(14,165,233,0.2)", md: "0 14px 28px rgba(14,165,233,0.3)" },
                      "&:hover": {
                        background: "linear-gradient(90deg,#14b8a6,#0ea5e9)",
                        boxShadow: { xs: "0 12px 24px rgba(14,165,233,0.3)", md: "0 18px 36px rgba(14,165,233,0.4)" },
                      },
                      "&:disabled": {
                        background: "#C8D4C0",
                      },
                    }}
                  >
                    {loading ? t("creatingRequests", language) : `📝 ${t("createAllRequests", language)}`}
                  </Button>
                </Stack>
              </Paper>
            )}
          </>
        )}
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
            whiteSpace: "pre-line", // Allow line breaks in message
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

      <Dialog open={confirmDialog.open} onClose={handleConfirmCancel}>
        <DialogTitle sx={{ fontWeight: 700, color: "#b91c1c" }}>
          ⚠️ {t("warningActivePrescription", language)}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "1rem", color: "#1f2937" }}>
            {confirmDialog.message}
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: 600 }}>
            {t("continuePrescibing", language)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleConfirmCancel}
            sx={{ color: "#b91c1c", fontWeight: 700 }}
          >
            {t("cancel", language)}
          </Button>
          <Button
            onClick={handleConfirmContinue}
            sx={{ fontWeight: 700 }}
            color="primary"
          >
            {t("continue", language)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnifiedCreateRequest;

