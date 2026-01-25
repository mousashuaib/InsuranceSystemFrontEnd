import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Grid,
  Box,
  Typography,
  Container,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  FormControl,
  FormHelperText,
  Collapse,
  Stack,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import LockIcon from "@mui/icons-material/Lock";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { api } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import logger from "../../utils/logger";

const SESSION_KEY = "signupFormData";

const getGenders = (language) => [
  { value: "MALE", label: t("male", language) },
  { value: "FEMALE", label: t("female", language) },
];

const getRelationTypes = (language) => [
  { value: "WIFE", label: t("wife", language) },
  { value: "SON", label: t("son", language) },
  { value: "DAUGHTER", label: t("daughter", language) },
  { value: "FATHER", label: t("fatherRelation", language) },
  { value: "MOTHER", label: t("motherRelation", language) },
];

const getChronicDiseasesList = (language) => [
  { value: "DIABETES", label: t("diabetesDisease", language) },
  { value: "HYPERTENSION", label: t("highBloodPressure", language) },
  { value: "ASTHMA", label: t("asthmaDisease", language) },
  { value: "HEART_DISEASE", label: t("heartDisease", language) },
  { value: "KIDNEY_DISEASE", label: t("kidneyDisease", language) },
  { value: "THYROID", label: t("thyroidDisorder", language) },
  { value: "EPILEPSY", label: t("epilepsyDisease", language) },
];

const calculateAge = (dob) => {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : "";
};

const isFamilyMemberComplete = (m) =>
  m.firstName?.trim() &&
  m.lastName?.trim() &&
  m.nationalId?.trim() &&
  m.dateOfBirth &&
  m.gender &&
  m.relationType;

const buildFullName = (firstName, middleName, lastName) =>
  [firstName, middleName, lastName]
    .map((x) => (x || "").trim())
    .filter(Boolean)
    .join(" ");

const isValidEmail = (value) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);

const isValidPassword = (value) => {
  if (!value) return false;
  const clean = value.trim();
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])[^\s]{8,}$/;
  return regex.test(clean);
};

const isValidPhone = (value) => /^05\d{8}$/.test(value);

const getStepLabels = (language) => [
  t("personalInfo", language) || "Personal Info",
  t("accountInfo", language) || "Account Info",
  t("roleSelection", language) || "Role Selection",
  t("documents", language) || "Documents",
];

const SignUp = memo(function SignUp({ setMode, setPendingEmail }) {
  const { language, isRTL } = useLanguage();

  // Current step (0-3)
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedRole, setSelectedRole] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [pharmacyCode, setPharmacyCode] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyLocation, setPharmacyLocation] = useState("");
  const [labCode, setLabCode] = useState("");
  const [labName, setLabName] = useState("");
  const [labLocation, setLabLocation] = useState("");
  const [radiologyCode, setRadiologyCode] = useState("");
  const [radiologyName, setRadiologyName] = useState("");
  const [radiologyLocation, setRadiologyLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [hasChronicDiseases, setHasChronicDiseases] = useState(false);
  const [chronicDiseases, setChronicDiseases] = useState([]);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [chronicDocuments, setChronicDocuments] = useState([]);
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showFamilySection, setShowFamilySection] = useState(false);

  const [specializations, setSpecializations] = useState([]);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);

  const [errors, setErrors] = useState({});

  const universityCardRef = useRef(null);
  const chronicDocsRef = useRef(null);

  const hasUniversityCard = uploadedFiles.length > 0;
  const passwordsMatch = () => password === confirmPassword;

  // Load cached data from sessionStorage on mount
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        setActiveStep(data.activeStep || 0);
        setFirstName(data.firstName || "");
        setMiddleName(data.middleName || "");
        setLastName(data.lastName || "");
        setNationalId(data.nationalId || "");
        setDateOfBirth(data.dateOfBirth || "");
        setGender(data.gender || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setPassword(data.password || "");
        setConfirmPassword(data.confirmPassword || "");
        setSelectedRole(data.selectedRole || "");
        setEmployeeId(data.employeeId || "");
        setSelectedSpecialization(data.selectedSpecialization || "");
        setClinicLocation(data.clinicLocation || "");
        setPharmacyCode(data.pharmacyCode || "");
        setPharmacyName(data.pharmacyName || "");
        setPharmacyLocation(data.pharmacyLocation || "");
        setLabCode(data.labCode || "");
        setLabName(data.labName || "");
        setLabLocation(data.labLocation || "");
        setRadiologyCode(data.radiologyCode || "");
        setRadiologyName(data.radiologyName || "");
        setRadiologyLocation(data.radiologyLocation || "");
        setDepartment(data.department || "");
        setFaculty(data.faculty || "");
        setHasChronicDiseases(data.hasChronicDiseases || false);
        setChronicDiseases(data.chronicDiseases || []);
        setAgreeToPolicy(data.agreeToPolicy || false);
        setFamilyMembers(data.familyMembers || []);
        setShowFamilySection(data.showFamilySection || false);
      }
    } catch (err) {
      logger.warn("Failed to load cached signup data:", err);
    }
  }, []);

  // Save to sessionStorage whenever form data changes
  const saveToSession = useCallback(() => {
    try {
      const data = {
        activeStep,
        firstName,
        middleName,
        lastName,
        nationalId,
        dateOfBirth,
        gender,
        email,
        phone,
        password,
        confirmPassword,
        selectedRole,
        employeeId,
        selectedSpecialization,
        clinicLocation,
        pharmacyCode,
        pharmacyName,
        pharmacyLocation,
        labCode,
        labName,
        labLocation,
        radiologyCode,
        radiologyName,
        radiologyLocation,
        department,
        faculty,
        hasChronicDiseases,
        chronicDiseases,
        agreeToPolicy,
        familyMembers,
        showFamilySection,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (err) {
      logger.warn("Failed to save signup data to session:", err);
    }
  }, [
    activeStep, firstName, middleName, lastName, nationalId, dateOfBirth, gender,
    email, phone, password, confirmPassword, selectedRole, employeeId,
    selectedSpecialization, clinicLocation, pharmacyCode, pharmacyName, pharmacyLocation,
    labCode, labName, labLocation, radiologyCode, radiologyName, radiologyLocation,
    department, faculty, hasChronicDiseases, chronicDiseases, agreeToPolicy,
    familyMembers, showFamilySection
  ]);

  useEffect(() => {
    saveToSession();
  }, [saveToSession]);

  // Fetch specializations from API when DOCTOR
  useEffect(() => {
    const fetchSpecializations = async () => {
      if (selectedRole === "DOCTOR") {
        setLoadingSpecializations(true);
        try {
          // api.get returns response.data directly
          const specializationsData = await api.get(API_ENDPOINTS.DOCTOR.SPECIALIZATIONS);
          setSpecializations(specializationsData || []);
        } catch (err) {
          logger.error("Error fetching specializations:", err);
          setSpecializations([]);
        } finally {
          setLoadingSpecializations(false);
        }
      } else {
        setSpecializations([]);
        setSelectedSpecialization("");
      }
    };
    fetchSpecializations();
  }, [selectedRole]);

  const clearSessionCache = () => {
    sessionStorage.removeItem(SESSION_KEY);
  };

  const passwordStatus = () => {
    if (password === "") return "empty";
    if (isValidPassword(password)) return "valid";
    return "invalid";
  };

  const generatePreviewInsuranceNumber = (index) => {
    if (!employeeId) return t("autoGenerated", language);
    return `${employeeId}.${String(index + 1).padStart(2, "0")}`;
  };

  // Validation functions for each step
  const validateStep1 = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = t("firstNameRequired", language) || "First name is required";
    }
    if (!lastName.trim()) {
      newErrors.lastName = t("lastNameRequired", language) || "Last name is required";
    }
    if (!nationalId || nationalId.trim().length < 9) {
      newErrors.nationalId = t("enterValidNationalId", language) || "Enter valid national ID";
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = t("enterDateOfBirth", language) || "Date of birth is required";
    } else if (calculateAge(dateOfBirth) < 18) {
      newErrors.dateOfBirth = t("ageMustBe18", language) || "You must be at least 18 years old";
    }
    if (!gender) {
      newErrors.gender = t("pleaseSelectGender", language) || "Please select gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t("emailRequired", language) || "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = t("validEmailFormat", language) || "Enter valid email format";
    }
    if (!phone.trim()) {
      newErrors.phone = t("phoneRequired", language) || "Phone is required";
    } else if (!isValidPhone(phone)) {
      newErrors.phone = t("mustBe10DigitsStartWith05", language) || "Phone must be 10 digits starting with 05";
    }
    if (!password) {
      newErrors.password = t("passwordRequired", language) || "Password is required";
    } else if (!isValidPassword(password)) {
      newErrors.password = t("passwordNotMeetRequirements", language) || "Password does not meet requirements";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = t("confirmPasswordRequired", language) || "Confirm password is required";
    } else if (!passwordsMatch()) {
      newErrors.confirmPassword = t("passwordsDoNotMatch", language) || "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!selectedRole) {
      newErrors.selectedRole = t("selectRoleRequired", language) || "Please select a role";
      setErrors(newErrors);
      return false;
    }

    if (selectedRole === "LAB_TECH") {
      if (!labCode.trim()) {
        newErrors.labCode = t("labCodeRequired", language) || "Lab code is required";
      }
      if (!labName.trim()) {
        newErrors.labName = t("labNameRequired", language) || "Lab name is required";
      }
    }

    if (selectedRole === "RADIOLOGIST") {
      if (!radiologyCode.trim()) {
        newErrors.radiologyCode = t("radiologyCodeRequired", language) || "Radiology code is required";
      }
      if (!radiologyName.trim()) {
        newErrors.radiologyName = t("radiologyNameRequired", language) || "Radiology center name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};

    if (selectedRole === "INSURANCE_CLIENT") {
      if (!agreeToPolicy) {
        newErrors.agreeToPolicy = t("mustAgreeToPolicy", language) || "You must agree to the policy";
      }
      if (!hasUniversityCard) {
        newErrors.universityCard = t("universityCardMandatory", language) || "University card is required";
      }
      if (hasChronicDiseases && chronicDiseases.length === 0) {
        newErrors.chronicDiseases = t("selectAtLeastOneChronicDisease", language) || "Select at least one chronic disease";
      }
      if (hasChronicDiseases && chronicDocuments.length === 0) {
        newErrors.chronicDocuments = t("uploadChronicDiseaseProof", language) || "Upload chronic disease documents";
      }

      // Validate family members if any
      if (familyMembers.length > 0) {
        for (let i = 0; i < familyMembers.length; i++) {
          const m = familyMembers[i];
          if (!isFamilyMemberComplete(m)) {
            newErrors.familyMembers = t("completeFamilyMemberFields", language) || "Complete all family member fields";
            break;
          }

          const age = calculateAge(m.dateOfBirth);
          if (age !== "") {
            if (["SON", "DAUGHTER"].includes(m.relationType) && age > 22) {
              newErrors.familyMembers = t("childrenAllowedUpTo22", language) || "Children allowed up to 22 years";
              break;
            }
            if (["FATHER", "MOTHER"].includes(m.relationType) && age > 100) {
              newErrors.familyMembers = t("parentsAllowedUpTo100", language) || "Parents allowed up to 100 years";
              break;
            }
          }
        }

        const ids = familyMembers.map((m) => m.nationalId);
        if (new Set(ids).size !== ids.length) {
          newErrors.familyMembers = t("familyNationalIdUnique", language) || "Family member IDs must be unique";
        }
        if (ids.includes(nationalId)) {
          newErrors.familyMembers = t("familyNationalIdCannotMatchMain", language) || "Family ID cannot match your ID";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (activeStep) {
      case 0:
        isValid = validateStep1();
        break;
      case 1:
        isValid = validateStep2();
        break;
      case 2:
        isValid = validateStep3();
        break;
      case 3:
        isValid = validateStep4();
        if (isValid) {
          handleSubmit();
          return;
        }
        break;
      default:
        isValid = true;
    }

    if (isValid && activeStep < 3) {
      setActiveStep((prev) => prev + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const addFamilyMember = () => {
    if (familyMembers.length > 0) {
      const last = familyMembers[familyMembers.length - 1];
      if (!isFamilyMemberComplete(last)) {
        alert(t("completeCurrentMemberFirst", language));
        return;
      }
    }
    setFamilyMembers((prev) => [
      ...prev,
      {
        firstName: "",
        middleName: "",
        lastName: "",
        nationalId: "",
        dateOfBirth: "",
        gender: "",
        relationType: "",
        documents: [],
      },
    ]);
  };

  const updateFamilyMember = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index) => {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const fullName = buildFullName(firstName, middleName, lastName);

    const payload = {
      fullName,
      nationalId: nationalId.trim(),
      email: email.trim(),
      phone,
      password,
      desiredRole: selectedRole,
      dateOfBirth,
      gender,
    };

    if (selectedRole === "INSURANCE_CLIENT") {
      payload.agreeToPolicy = agreeToPolicy;
      payload.employeeId = employeeId;
      payload.department = department;
      payload.faculty = faculty;
      payload.hasChronicDiseases = hasChronicDiseases;
      payload.chronicDiseases = chronicDiseases;
    } else if (selectedRole === "DOCTOR") {
      payload.employeeId = employeeId;
      payload.specialization = selectedSpecialization;
      payload.clinicLocation = clinicLocation;
      payload.agreeToPolicy = false;
    } else if (selectedRole === "PHARMACIST") {
      payload.employeeId = employeeId.trim();
      payload.pharmacyCode = pharmacyCode;
      payload.pharmacyName = pharmacyName;
      payload.pharmacyLocation = pharmacyLocation;
      payload.agreeToPolicy = false;
    } else if (selectedRole === "LAB_TECH") {
      payload.employeeId = employeeId.trim();
      payload.labCode = labCode.trim();
      payload.labName = labName.trim();
      if (labLocation) payload.labLocation = labLocation.trim();
      payload.agreeToPolicy = false;
    } else if (selectedRole === "RADIOLOGIST") {
      payload.employeeId = employeeId.trim();
      payload.radiologyCode = radiologyCode.trim();
      payload.radiologyName = radiologyName.trim();
      if (radiologyLocation) payload.radiologyLocation = radiologyLocation.trim();
      payload.agreeToPolicy = false;
    }

    payload.familyMembers = familyMembers
      .filter(isFamilyMemberComplete)
      .map((m) => ({
        fullName: buildFullName(m.firstName, m.middleName, m.lastName),
        nationalId: m.nationalId,
        dateOfBirth: m.dateOfBirth,
        gender: m.gender,
        relation: m.relationType,
      }));

    try {
      const data = new FormData();

      uploadedFiles.forEach((f) => data.append("universityCard", f));

      data.append(
        "data",
        new Blob([JSON.stringify(payload)], {
          type: "application/json",
        })
      );

      const owners = [];
      familyMembers
        .filter(isFamilyMemberComplete)
        .forEach((m) => {
          (m.documents || []).forEach((file) => {
            data.append("familyDocuments", file);
            owners.push(m.nationalId);
          });
        });

      if (owners.length > 0) {
        data.append("familyDocumentsOwners", JSON.stringify(owners));
      }

      chronicDocuments.forEach((f) => {
        data.append("chronicDocuments", f);
      });

      await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
      clearSessionCache();
      setPendingEmail(email);
      setMode("verify-email");

    } catch (err) {
      logger.error("Error:", err.response?.data || err.message);
      const msg = err.response?.data?.message || "";

      if (msg.includes("not verified")) {
        alert(t("emailAlreadyRegisteredNotVerified", language));
        setPendingEmail(email);
        setMode("verify-email");
        return;
      }

      if (msg.includes("already exists")) {
        alert(t("emailAlreadyRegistered", language));
        setMode("signin");
        return;
      }

      alert(t("registrationFailed", language));
    }
  };

  // Step 1: Personal Information
  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#556B2F" }}>
        {t("personalInformation", language) || "Personal Information"}
      </Typography>

      <TextField
        margin="normal"
        size="small"
        required
        fullWidth
        label={t("firstName", language)}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        error={!!errors.firstName}
        helperText={errors.firstName}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />

      <TextField
        margin="normal"
        size="small"
        fullWidth
        label={t("middleName", language)}
        value={middleName}
        onChange={(e) => setMiddleName(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />

      <TextField
        margin="normal"
        size="small"
        required
        fullWidth
        label={t("lastName", language)}
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        error={!!errors.lastName}
        helperText={errors.lastName}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />

      <TextField
        margin="normal"
        size="small"
        required
        fullWidth
        label={t("nationalId", language)}
        value={nationalId}
        onChange={(e) => setNationalId(e.target.value)}
        error={!!errors.nationalId}
        helperText={errors.nationalId}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <BadgeIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />

      <TextField
        margin="normal"
        size="small"
        required
        fullWidth
        label={t("dateOfBirthLabel", language)}
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        error={!!errors.dateOfBirth}
        helperText={errors.dateOfBirth || (dateOfBirth ? `${t("age", language) || "Age"}: ${calculateAge(dateOfBirth)}` : "")}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />

      <TextField
        select
        fullWidth
        size="small"
        margin="normal"
        label={t("gender", language)}
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        error={!!errors.gender}
        helperText={errors.gender}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      >
        <MenuItem value="">{t("selectGender", language) || "Select Gender"}</MenuItem>
        {getGenders(language).map((g) => (
          <MenuItem key={g.value} value={g.value}>
            {g.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );

  // Step 2: Account Information
  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#556B2F" }}>
        {t("accountInformation", language) || "Account Information"}
      </Typography>

      <TextField
        margin="normal"
        size="small"
        required
        fullWidth
        label={t("emailAddress", language)}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />

      <TextField
        margin="normal"
        size="small"
        required
        fullWidth
        label={t("phoneNumber", language)}
        value={phone}
        placeholder="05XXXXXXXX"
        onChange={(e) => {
          let val = e.target.value.replace(/\D/g, "");
          if (val.length > 10) val = val.slice(0, 10);
          setPhone(val);
        }}
        error={!!errors.phone}
        helperText={errors.phone}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
          inputMode: "numeric",
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />

      <Tooltip
        title={
          passwordStatus() === "invalid"
            ? t("passwordInvalidMsg", language)
            : passwordStatus() === "valid"
            ? t("strongPassword", language)
            : ""
        }
        placement="right"
        arrow
      >
        <TextField
          margin="normal"
          size="small"
          required
          fullWidth
          label={t("password", language)}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
          error={!!errors.password || passwordStatus() === "invalid"}
          helperText={errors.password || (passwordStatus() === "valid" ? t("passwordValidMsg", language) : "")}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon
                  sx={{
                    color:
                      passwordStatus() === "empty"
                        ? "#7B8B5E"
                        : passwordStatus() === "valid"
                        ? "success.main"
                        : "error.main",
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor:
                  passwordStatus() === "empty"
                    ? undefined
                    : passwordStatus() === "valid"
                    ? "success.main"
                    : "error.main",
              },
            },
          }}
          InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
        />
      </Tooltip>

      <TextField
        margin="normal"
        size="small"
        required
        fullWidth
        label={t("confirmPassword", language)}
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ""))}
        error={!!errors.confirmPassword || (confirmPassword !== "" && !passwordsMatch())}
        helperText={errors.confirmPassword || (confirmPassword !== "" && !passwordsMatch() ? t("passwordsDoNotMatch", language) : "")}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon
                sx={{
                  color:
                    confirmPassword === ""
                      ? "#7B8B5E"
                      : passwordsMatch()
                      ? "success.main"
                      : "error.main",
                }}
              />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      />
    </Box>
  );

  // Step 3: Role Selection
  const renderStep3 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#556B2F" }}>
        {t("roleSelectionTitle", language) || "Select Your Role"}
      </Typography>

      <TextField
        margin="normal"
        size="small"
        select
        fullWidth
        required
        label={t("desiredRole", language)}
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        error={!!errors.selectedRole}
        helperText={errors.selectedRole}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <WorkIcon sx={{ color: "#7B8B5E" }} />
            </InputAdornment>
          ),
        }}
        InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
      >
        <MenuItem value="">{t("selectRoleOption", language)}</MenuItem>
        <MenuItem value="INSURANCE_CLIENT">{t("insuranceClient", language)}</MenuItem>
        <MenuItem value="DOCTOR">{t("doctor", language)}</MenuItem>
        <MenuItem value="PHARMACIST">{t("pharmacist", language)}</MenuItem>
        <MenuItem value="LAB_TECH">{t("labEmployee", language)}</MenuItem>
        <MenuItem value="RADIOLOGIST">{t("radiologist", language)}</MenuItem>
      </TextField>

      {/* INSURANCE_CLIENT fields */}
      <Collapse in={selectedRole === "INSURANCE_CLIENT"}>
        <Box sx={{ mt: 2, p: 2, border: "1px solid #E8EDE0", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#556B2F" }}>
            {t("clientDetails", language) || "Client Details"}
          </Typography>

          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("employeeId", language)}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("department", language)}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("faculty", language)}
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
        </Box>
      </Collapse>

      {/* DOCTOR fields */}
      <Collapse in={selectedRole === "DOCTOR"}>
        <Box sx={{ mt: 2, p: 2, border: "1px solid #E8EDE0", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#556B2F" }}>
            {t("doctorDetails", language) || "Doctor Details"}
          </Typography>

          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("employeeId", language)}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            select
            fullWidth
            label={t("specialization", language)}
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            disabled={loadingSpecializations}
            helperText={loadingSpecializations ? t("loadingSpecializations", language) : ""}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          >
            <MenuItem value="">{t("selectSpecializationPlaceholder", language)}</MenuItem>
            {specializations.map((spec) => (
              <MenuItem key={spec.id || spec.displayName || spec.name} value={spec.name || spec.displayName}>
                {spec.displayName || spec.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("clinicLocation", language)}
            value={clinicLocation}
            onChange={(e) => setClinicLocation(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
        </Box>
      </Collapse>

      {/* PHARMACIST fields */}
      <Collapse in={selectedRole === "PHARMACIST"}>
        <Box sx={{ mt: 2, p: 2, border: "1px solid #E8EDE0", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#556B2F" }}>
            {t("pharmacistDetails", language) || "Pharmacist Details"}
          </Typography>

          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("employeeId", language)}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("pharmacyCode", language)}
            value={pharmacyCode}
            onChange={(e) => setPharmacyCode(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("pharmacyName", language)}
            value={pharmacyName}
            onChange={(e) => setPharmacyName(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("pharmacyLocation", language)}
            value={pharmacyLocation}
            onChange={(e) => setPharmacyLocation(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
        </Box>
      </Collapse>

      {/* LAB_TECH fields */}
      <Collapse in={selectedRole === "LAB_TECH"}>
        <Box sx={{ mt: 2, p: 2, border: "1px solid #E8EDE0", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#556B2F" }}>
            {t("labTechDetails", language) || "Lab Technician Details"}
          </Typography>

          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("employeeId", language)}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            required
            fullWidth
            label={t("labCode", language)}
            value={labCode}
            onChange={(e) => setLabCode(e.target.value)}
            error={!!errors.labCode}
            helperText={errors.labCode}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            required
            fullWidth
            label={t("labName", language)}
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            error={!!errors.labName}
            helperText={errors.labName}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("labLocation", language)}
            value={labLocation}
            onChange={(e) => setLabLocation(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
        </Box>
      </Collapse>

      {/* RADIOLOGIST fields */}
      <Collapse in={selectedRole === "RADIOLOGIST"}>
        <Box sx={{ mt: 2, p: 2, border: "1px solid #E8EDE0", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#556B2F" }}>
            {t("radiologistDetails", language) || "Radiologist Details"}
          </Typography>

          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("employeeId", language)}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            required
            fullWidth
            label={t("radiologyCode", language)}
            value={radiologyCode}
            onChange={(e) => setRadiologyCode(e.target.value)}
            error={!!errors.radiologyCode}
            helperText={errors.radiologyCode}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            required
            fullWidth
            label={t("radiologyCenterName", language)}
            value={radiologyName}
            onChange={(e) => setRadiologyName(e.target.value)}
            error={!!errors.radiologyName}
            helperText={errors.radiologyName}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
          <TextField
            margin="normal"
            size="small"
            fullWidth
            label={t("radiologyCenterLocation", language)}
            value={radiologyLocation}
            onChange={(e) => setRadiologyLocation(e.target.value)}
            InputLabelProps={{ shrink: true, style: { color: "#000", fontWeight: "bold" } }}
          />
        </Box>
      </Collapse>
    </Box>
  );

  // Step 4: Documents
  const renderStep4 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#556B2F" }}>
        {t("documentsUpload", language) || "Upload Documents"}
      </Typography>

      {/* University Card Upload */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          {t("universityCard", language) || "University Card"} {selectedRole === "INSURANCE_CLIENT" && "*"}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            component="label"
            variant={hasUniversityCard ? "contained" : "outlined"}
            fullWidth
            sx={{
              borderColor: hasUniversityCard ? "success.main" : errors.universityCard ? "error.main" : "#7B8B5E",
              color: hasUniversityCard ? "#fff" : "#7B8B5E",
              backgroundColor: hasUniversityCard ? "success.main" : "transparent",
              borderRadius: "10px",
              fontWeight: "bold",
              textTransform: "none",
              minHeight: { xs: 48, md: 44 },
              "&:hover": {
                backgroundColor: hasUniversityCard ? "success.dark" : "#f4f7ff",
              },
            }}
          >
            {hasUniversityCard
              ? `${uploadedFiles.length} ${t("filesSelected", language)}`
              : t("uploadUniversityCard", language)}

            <input
              type="file"
              hidden
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              ref={universityCardRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                setUploadedFiles((prev) => [...prev, ...files]);
                if (universityCardRef.current) universityCardRef.current.value = "";
              }}
            />
          </Button>

          {hasUniversityCard && (
            <Tooltip title={t("clearAll", language)}>
              <Button
                variant="outlined"
                color="error"
                sx={{ minWidth: { xs: "60px", md: "90px" }, fontWeight: "bold" }}
                onClick={() => {
                  setUploadedFiles([]);
                  if (universityCardRef.current) universityCardRef.current.value = "";
                }}
              >
                X
              </Button>
            </Tooltip>
          )}
        </Stack>
        {errors.universityCard && (
          <FormHelperText error>{errors.universityCard}</FormHelperText>
        )}
      </Box>

      {/* Insurance Client specific documents */}
      {selectedRole === "INSURANCE_CLIENT" && (
        <>
          {/* Chronic Diseases Section */}
          <Box sx={{ mb: 3, p: 2, border: "1px solid #E8EDE0", borderRadius: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasChronicDiseases}
                  onChange={(e) => {
                    setHasChronicDiseases(e.target.checked);
                    if (!e.target.checked) {
                      setChronicDiseases([]);
                      setChronicDocuments([]);
                      if (chronicDocsRef.current) chronicDocsRef.current.value = "";
                    }
                  }}
                />
              }
              label={t("doYouHaveChronicDiseases", language)}
            />

            <Collapse in={hasChronicDiseases}>
              <Box sx={{ mt: 2 }}>
                <Autocomplete
                  multiple
                  options={getChronicDiseasesList(language)}
                  value={getChronicDiseasesList(language).filter((x) => chronicDiseases.includes(x.value))}
                  onChange={(_, newValues) => {
                    setChronicDiseases(newValues.map((x) => x.value));
                  }}
                  getOptionLabel={(option) => option.label}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.label}
                          {...tagProps}
                          sx={{ borderRadius: 2, fontWeight: "bold" }}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("chronicDiseases", language)}
                      placeholder={t("typeAndSelect", language)}
                      size="small"
                      error={!!errors.chronicDiseases}
                      helperText={errors.chronicDiseases || t("selectOneOrMoreDiseases", language)}
                    />
                  )}
                />

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    component="label"
                    variant={chronicDocuments.length ? "contained" : "outlined"}
                    fullWidth
                    sx={{
                      borderColor: chronicDocuments.length ? "success.main" : errors.chronicDocuments ? "error.main" : "#7B8B5E",
                      color: chronicDocuments.length ? "#fff" : "#7B8B5E",
                      backgroundColor: chronicDocuments.length ? "success.main" : "transparent",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: chronicDocuments.length ? "success.dark" : "#f4f7ff",
                      },
                    }}
                  >
                    {chronicDocuments.length
                      ? `${chronicDocuments.length} ${t("filesSelected", language)}`
                      : t("uploadChronicDocuments", language)}
                    <input
                      hidden
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      ref={chronicDocsRef}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        setChronicDocuments((prev) => [...prev, ...files]);
                        if (chronicDocsRef.current) chronicDocsRef.current.value = "";
                      }}
                    />
                  </Button>

                  {chronicDocuments.length > 0 && (
                    <Tooltip title={t("clearAll", language)}>
                      <Button
                        variant="outlined"
                        color="error"
                        sx={{ minWidth: "90px", fontWeight: "bold" }}
                        onClick={() => {
                          setChronicDocuments([]);
                          if (chronicDocsRef.current) chronicDocsRef.current.value = "";
                        }}
                      >
                        X
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
                {errors.chronicDocuments && (
                  <FormHelperText error>{errors.chronicDocuments}</FormHelperText>
                )}

                {chronicDocuments.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {chronicDocuments.map((f, idx) => (
                      <Stack
                        key={`${f.name}-${idx}`}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          p: 1,
                          mb: 1,
                          border: "1px solid #E8EDE0",
                          borderRadius: 2,
                          backgroundColor: "#fff",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {f.name}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() =>
                            setChronicDocuments((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          {t("remove", language)}
                        </Button>
                      </Stack>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* Family Members Section */}
          <Box sx={{ mb: 3, p: 2, border: "1px dashed #7B8B5E", borderRadius: 2 }}>
            <Button
              variant="text"
              onClick={() => setShowFamilySection(!showFamilySection)}
              sx={{ mb: 1, fontWeight: "bold", color: "#556B2F" }}
            >
              {showFamilySection ? "▼" : "►"} {t("familyMembers", language)} ({familyMembers.length})
            </Button>

            <Collapse in={showFamilySection}>
              {familyMembers.length === 0 && (
                <Typography variant="body2" sx={{ color: "#5d6b5d", mb: 2 }}>
                  {t("noFamilyMembersAdded", language)}
                </Typography>
              )}

              {familyMembers.map((member, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {t("memberNumber", language)} #{index + 1}
                    </Typography>
                    <Tooltip title={t("removeMember", language)}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => removeFamilyMember(index)}
                      >
                        X
                      </Button>
                    </Tooltip>
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label={t("insuranceNumberLabel", language)}
                    value={generatePreviewInsuranceNumber(index)}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("firstName", language)}
                    value={member.firstName || ""}
                    onChange={(e) => updateFamilyMember(index, "firstName", e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("middleName", language)}
                    value={member.middleName || ""}
                    onChange={(e) => updateFamilyMember(index, "middleName", e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("lastName", language)}
                    value={member.lastName || ""}
                    onChange={(e) => updateFamilyMember(index, "lastName", e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("nationalId", language)}
                    value={member.nationalId}
                    onChange={(e) => updateFamilyMember(index, "nationalId", e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label={t("dateOfBirthLabel", language)}
                    InputLabelProps={{ shrink: true }}
                    value={member.dateOfBirth}
                    onChange={(e) => updateFamilyMember(index, "dateOfBirth", e.target.value)}
                    helperText={member.dateOfBirth ? `${t("age", language)}: ${calculateAge(member.dateOfBirth)}` : ""}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={t("gender", language)}
                    value={member.gender}
                    onChange={(e) => updateFamilyMember(index, "gender", e.target.value)}
                    sx={{ mb: 1 }}
                  >
                    {getGenders(language).map((g) => (
                      <MenuItem key={g.value} value={g.value}>
                        {g.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={t("relation", language)}
                    value={member.relationType}
                    onChange={(e) => updateFamilyMember(index, "relationType", e.target.value)}
                    sx={{ mb: 1 }}
                  >
                    {getRelationTypes(language).map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      component="label"
                      variant={(member.documents?.length || 0) > 0 ? "contained" : "outlined"}
                      fullWidth
                      sx={{
                        borderColor: (member.documents?.length || 0) > 0 ? "success.main" : "#7B8B5E",
                        color: (member.documents?.length || 0) > 0 ? "#fff" : "#7B8B5E",
                        backgroundColor: (member.documents?.length || 0) > 0 ? "success.main" : "transparent",
                        fontWeight: "bold",
                        textTransform: "none",
                      }}
                    >
                      {member.documents?.length ? `${member.documents.length} ${t("filesSelected", language)}` : t("uploadDocuments", language)}
                      <input
                        hidden
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          updateFamilyMember(index, "documents", [
                            ...(member.documents || []),
                            ...files,
                          ]);
                          e.target.value = "";
                        }}
                      />
                    </Button>

                    {(member.documents?.length || 0) > 0 && (
                      <Tooltip title={t("clearAll", language)}>
                        <Button
                          variant="outlined"
                          color="error"
                          sx={{ minWidth: "90px", fontWeight: "bold" }}
                          onClick={() => updateFamilyMember(index, "documents", [])}
                        >
                          X
                        </Button>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              ))}

              {errors.familyMembers && (
                <FormHelperText error sx={{ mb: 1 }}>{errors.familyMembers}</FormHelperText>
              )}

              <Button
                variant="contained"
                onClick={addFamilyMember}
                sx={{ mt: 1 }}
                disabled={
                  familyMembers.length > 0 &&
                  !isFamilyMemberComplete(familyMembers[familyMembers.length - 1])
                }
              >
                {t("addMemberBtn", language)}
              </Button>
            </Collapse>
          </Box>

          {/* Policy Agreement */}
          <FormControl error={!!errors.agreeToPolicy} component="fieldset">
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToPolicy}
                  onChange={(e) => setAgreeToPolicy(e.target.checked)}
                  sx={{
                    color: "#7B8B5E",
                    "&.Mui-checked": { color: "#556B2F" },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "#2E3D2F" }}>
                  {t("agreeToPolicy", language)}
                </Typography>
              }
            />
            {errors.agreeToPolicy && (
              <FormHelperText>{errors.agreeToPolicy}</FormHelperText>
            )}
          </FormControl>
        </>
      )}
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  const stepLabels = getStepLabels(language);

  return (
    <Container component="main" maxWidth={false} disableGutters dir={isRTL ? "rtl" : "ltr"}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(145deg, #FFFFFF, #E8EDE0)",
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: "12px", sm: "15px", md: "18px" },
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          border: "1px solid #e0e6ed",
          maxWidth: { xs: "100%", sm: "500px", md: "550px" },
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "#556B2F", width: { xs: 48, sm: 52, md: 56 }, height: { xs: 48, sm: 52, md: 56 } }}>
          <LockOutlinedIcon fontSize="medium" />
        </Avatar>

        <Typography component="h1" variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#556B2F", fontSize: { xs: "1.25rem", sm: "1.4rem", md: "1.5rem" } }}>
          {t("signUp", language)}
        </Typography>

        {/* Stepper Progress Indicator */}
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            width: "100%",
            mb: 3,
            "& .MuiStepLabel-label": {
              fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.875rem" },
            },
            "& .MuiStepIcon-root.Mui-active": {
              color: "#556B2F",
            },
            "& .MuiStepIcon-root.Mui-completed": {
              color: "#556B2F",
            },
          }}
        >
          {stepLabels.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ width: "100%", minHeight: "300px" }}>
          {renderStepContent()}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", mt: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
            sx={{
              flex: 1,
              minHeight: { xs: 44, md: 48 },
              fontWeight: "bold",
              borderColor: "#7B8B5E",
              color: "#7B8B5E",
              "&:hover": {
                borderColor: "#556B2F",
                backgroundColor: "#f4f7ff",
              },
              "&:disabled": {
                borderColor: "#ccc",
                color: "#ccc",
              },
            }}
          >
            {t("back", language) || "Back"}
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            sx={{
              flex: 1,
              minHeight: { xs: 44, md: 48 },
              fontWeight: "bold",
              backgroundColor: "#556B2F",
              "&:hover": {
                backgroundColor: "#3d4d22",
              },
            }}
          >
            {activeStep === 3 ? (t("completeRegistration", language) || "Complete Registration") : (t("next", language) || "Next")}
          </Button>
        </Box>

        {/* Already have account */}
        <Grid container justifyContent="center">
          <Grid item>
            <Typography variant="body2" sx={{ mt: 2, fontSize: { xs: "0.85rem", md: "0.875rem" } }}>
              {t("alreadyHaveAccount", language)}{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  clearSessionCache();
                  setMode("signin");
                }}
                style={{ color: "#556B2F", fontWeight: "600", textDecoration: "none" }}
              >
                {t("signIn", language)}
              </a>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
});

SignUp.propTypes = {
  setMode: PropTypes.func.isRequired,
  setPendingEmail: PropTypes.func.isRequired,
};

export default SignUp;
