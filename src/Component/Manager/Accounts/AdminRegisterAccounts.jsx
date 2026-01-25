import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Avatar,
  Fade,
} from "@mui/material";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS } from "../../../config/api";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import WorkIcon from "@mui/icons-material/Work";
import ScienceIcon from "@mui/icons-material/Science";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import SchoolIcon from "@mui/icons-material/School";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";


const roles = [
  { label: "Insurance Client", value: "INSURANCE_CLIENT", icon: <SchoolIcon sx={{ mr: 1 }} /> },
  { label: "Doctor", value: "DOCTOR", icon: <LocalHospitalIcon sx={{ mr: 1 }} /> },
  { label: "Pharmacist", value: "PHARMACIST", icon: <LocalPharmacyIcon sx={{ mr: 1 }} /> },
  { label: "Lab Technician", value: "LAB_TECH", icon: <ScienceIcon sx={{ mr: 1 }} /> },
  { label: "Radiologist", value: "RADIOLOGIST", icon: <ScienceIcon sx={{ mr: 1 }} /> },
  { label: "Medical Admin", value: "MEDICAL_ADMIN", icon: <WorkIcon sx={{ mr: 1 }} /> },
  { label: "Coordination Admin", value: "COORDINATION_ADMIN", icon: <WorkIcon sx={{ mr: 1 }} /> },
  { label: "Hospital (Front Only)", value: "HOSPITAL", icon: <WorkIcon sx={{ mr: 1 }} /> },
];
const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  employeeId: "",
  nationalId: "",
  dateOfBirth: "",
  gender: "",
  desiredRole: "",
  department: "",
  faculty: "",
  specialization: "",
  clinicLocation: "",
  pharmacyCode: "",
  pharmacyName: "",
  pharmacyLocation: "",
  labCode: "",
  labName: "",
  labLocation: "",
  radiologyCode: "",
  radiologyName: "",
  radiologyLocation: "",

};


const AdminRegisterAccounts = () => {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
const [firstName, setFirstName] = useState("");
const [middleName, setMiddleName] = useState("");
const [lastName, setLastName] = useState("");
const [specializations, setSpecializations] = useState([]); // eslint-disable-line no-unused-vars
const [loadingSpecs, setLoadingSpecs] = useState(false); // eslint-disable-line no-unused-vars

const [hasChronicDiseases, setHasChronicDiseases] = useState(false);
const [chronicDiseases, setChronicDiseases] = useState([]); // codes أو ids
const [chronicDocuments, setChronicDocuments] = useState([]);
const [chronicDiseasesOptions, setChronicDiseasesOptions] = useState([]);
const [loadingChronic, setLoadingChronic] = useState(false);
const chronicDocsRef = useRef(null);
const [familyMembers, setFamilyMembers] = useState([]);


const removeFamilyMember = (index) => {
  setFamilyMembers((prev) => prev.filter((_, i) => i !== index));
};

const isValidNationalId = (value) => /^\d{9}$/.test(value);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);
const isValidPhone = (value) => /^05\d{8}$/.test(value);

const isValidEmail = (value) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);


const isValidPassword = (value) => {
  if (!value) return false;
  const clean = value.trim();
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])[^\s]{8,}$/;
  return regex.test(clean);
};
const updateFamilyMember = (index, field, value) => {
  setFamilyMembers((prev) => {
    const updated = [...prev];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    return updated;
  });
};

const isFamilyMemberComplete = (m) => {
  return (
    m.firstName?.trim() &&
    m.lastName?.trim() &&
    m.nationalId &&
    m.dateOfBirth &&
    m.gender &&
    m.relation
  );
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim()) {
  setErrorMsg("First Name and Last Name are required");
  setLoading(false);
  return;
}


const fullName = [firstName, middleName, lastName]
  .map((x) => (x || "").trim())
  .filter(Boolean)
  .join(" ");


// 📞 Phone
if (!isValidPhone(form.phone)) {
  setErrorMsg("Phone number must start with 05 and be exactly 10 digits");
  setLoading(false);
  return;
}
// 🆔 National ID
if (!isValidNationalId(form.nationalId)) {
  setErrorMsg("National ID must be exactly 9 digits");
  setLoading(false);
  return;
}

// 📧 Email
if (!isValidEmail(form.email)) {
  setErrorMsg("Please enter a valid email (example@domain.com)");
  setLoading(false);
  return;
}
if (hasChronicDiseases && chronicDiseases.length === 0) {
  setErrorMsg("Please select at least one chronic disease.");
  setLoading(false);
  return;
}

if (hasChronicDiseases && chronicDocuments.length === 0) {
  setErrorMsg("Please upload chronic disease documents.");
  setLoading(false);
  return;
}

// 🔐 Password
if (!isValidPassword(form.password)) {
  setErrorMsg(
    "Password must be at least 8 characters and include letters, numbers, and symbols"
  );
  setLoading(false);
  return;
}

// 🔐 Confirm Password
if (form.password !== form.confirmPassword) {
  setErrorMsg("Passwords do not match");
  setLoading(false);
  return;
}

// 🎭 Role (يبقى كما هو)
if (!form.desiredRole) {
  setErrorMsg("Please select a role before submitting.");
  setLoading(false);
  return;
}

// LAB_TECH validation
if (form.desiredRole === "LAB_TECH") {
  if (!form.labCode || !form.labCode.trim()) {
    setErrorMsg("Lab Code is required for Lab Technician");
    setLoading(false);
    return;
  }
  if (!form.labName || !form.labName.trim()) {
    setErrorMsg("Lab Name is required for Lab Technician");
    setLoading(false);
    return;
  }
}

// RADIOLOGIST validation
if (form.desiredRole === "RADIOLOGIST") {
  if (!form.radiologyCode || !form.radiologyCode.trim()) {
    setErrorMsg("Radiology Code is required for Radiologist");
    setLoading(false);
    return;
  }
  if (!form.radiologyName || !form.radiologyName.trim()) {
    setErrorMsg("Radiology Center Name is required for Radiologist");
    setLoading(false);
    return;
  }
}

  const calculateAge = (dob) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
};

if (form.desiredRole === "INSURANCE_CLIENT") {
  const ids = familyMembers.map((m) => m.nationalId);
const uniqueIds = new Set(ids);

if (ids.length !== uniqueIds.size) {
  setErrorMsg("Duplicate National ID found among family members");
  setLoading(false);
  return;
}

  for (const m of familyMembers) {
    if (
      !m.firstName?.trim() ||
      !m.lastName?.trim() ||
      !m.nationalId ||
      !m.dateOfBirth ||
      !m.gender ||
      !m.relation
    ) {
      setErrorMsg("Please complete all family member fields");
      setLoading(false);
      return;
    }

    const age = calculateAge(m.dateOfBirth);

    if (["SON", "DAUGHTER"].includes(m.relation) && age > 25) {
      setErrorMsg("Child must be under 25 years old");
      setLoading(false);
      return;
    }

    if (!["SON", "DAUGHTER"].includes(m.relation) && age < 18) {
      setErrorMsg("Adult family member must be at least 18 years old");
      setLoading(false);
      return;
    }
  }
}


    try {
      // 🔹 build family payload
const familyPayload = familyMembers.map((m) => ({
  fullName: [m.firstName, m.middleName, m.lastName]
    .filter(Boolean)
    .join(" "),
  nationalId: m.nationalId,
  dateOfBirth: m.dateOfBirth,
  gender: m.gender,
  relation: m.relation,
}));

// 🔹 build final form (لا تعدّل form مباشرة)
const finalForm = {
  ...form,
  fullName,
  hasChronicDiseases,
  chronicDiseases,
  familyMembers: familyPayload,
};
const data = new FormData();
data.append("data", JSON.stringify(finalForm));

// 👨‍👩‍👧‍👦 family documents
const owners = [];

familyMembers.forEach((m) => {
  (m.documents || []).forEach((file) => {
    data.append("familyDocuments", file);
    owners.push(m.nationalId);
  });
});

if (owners.length > 0) {
  data.append("familyDocumentsOwners", JSON.stringify(owners));
}

      if (file) data.append("universityCard", file);

      chronicDocuments.forEach((file) => {
  data.append("chronicDocuments", file);
});




      const res = await api.post(`${API_ENDPOINTS.AUTH.REGISTER}/admin`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg(res.message || "✅ Account created successfully!");
      setForm(initialForm);
      setFile(null);
      setFamilyMembers([]);
setHasChronicDiseases(false);
setChronicDiseases([]);
setChronicDocuments([]);

    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  if (form.desiredRole === "INSURANCE_CLIENT" && hasChronicDiseases) {
    const fetchChronicDiseases = async () => {
      setLoadingChronic(true);
      try {
        const res = await api.get("/api/chronic-diseases");
        setChronicDiseasesOptions(res || []);
      } catch (err) {
        console.error("Failed to load chronic diseases", err);
        setChronicDiseasesOptions([]);
      } finally {
        setLoadingChronic(false);
      }
    };

    fetchChronicDiseases();
  }
}, [form.desiredRole, hasChronicDiseases]);

useEffect(() => {
  if (form.desiredRole !== "INSURANCE_CLIENT") {
    setFamilyMembers([]);
    setHasChronicDiseases(false);
    setChronicDiseases([]);
    setChronicDocuments([]);
    if (chronicDocsRef.current) chronicDocsRef.current.value = "";
  }
}, [form.desiredRole]);

useEffect(() => {
  const fetchSpecializations = async () => {
    if (form.desiredRole === "DOCTOR") {
      setLoadingSpecs(true);
      try {
        const res = await api.get(API_ENDPOINTS.DOCTOR.SPECIALIZATIONS);
        setSpecializations(res || []);
      } catch (err) {
        console.error("Failed to load specializations", err);
        setSpecializations([]);
      } finally {
        setLoadingSpecs(false);
      }
    } else {
      setSpecializations([]);
      setForm((prev) => ({ ...prev, specialization: "" }));
    }
  };
  fetchSpecializations();
}, [form.desiredRole]);

  const renderRoleFields = () => {
    switch (form.desiredRole) {
    case "INSURANCE_CLIENT":
  return (
    <>
      <TextField
        fullWidth
        label="Department"
        name="department"
        value={form.department}
        onChange={handleChange}
      />
     


      <TextField
        fullWidth
        label="Faculty"
        name="faculty"
        value={form.faculty}
        onChange={handleChange}
      />

  <Box sx={{ mt: 3, p: 2, border: "1px dashed #1E8EAB", borderRadius: 2 }}>
    <Typography variant="subtitle1" fontWeight="bold">
      Family Members
    </Typography>

    {familyMembers.map((m, index) => (
      
      <Box key={index} sx={{ mt: 2, p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
  <Typography fontWeight="bold">
    Family Member #{index + 1}
  </Typography>

  <Button
    color="error"
    size="small"
onClick={() => {
  if (window.confirm("Are you sure you want to remove this family member?")) {
    removeFamilyMember(index);
  }
}}
  >
    🗑️ Remove
  </Button>
</Box>

        <TextField
          fullWidth
          label="First Name"
          value={m.firstName}
          onChange={(e) => updateFamilyMember(index, "firstName", e.target.value)}
        />
        <TextField
          fullWidth
          label="Last Name"
          value={m.lastName}
          onChange={(e) => updateFamilyMember(index, "lastName", e.target.value)}
        />
        <TextField
          fullWidth
          label="National ID"
          value={m.nationalId}
onChange={(e) => {
  let val = e.target.value.replace(/\D/g, "");
  if (val.length > 9) val = val.slice(0, 9);
  updateFamilyMember(index, "nationalId", val);
}}
        />
        <TextField
          type="date"
          fullWidth
          label="Date of Birth"
          InputLabelProps={{ shrink: true }}
          value={m.dateOfBirth}
          onChange={(e) => updateFamilyMember(index, "dateOfBirth", e.target.value)}
        />

        <TextField
          select
          fullWidth
          label="Gender"
          value={m.gender}
          onChange={(e) => updateFamilyMember(index, "gender", e.target.value)}
        >
          <MenuItem value="MALE">Male</MenuItem>
          <MenuItem value="FEMALE">Female</MenuItem>
        </TextField>

        <TextField
          select
          fullWidth
          label="Relation"
          value={m.relation}
          onChange={(e) => updateFamilyMember(index, "relation", e.target.value)}
        >
          <MenuItem value="WIFE">Wife</MenuItem>
          <MenuItem value="HUSBAND">Husband</MenuItem>
          <MenuItem value="SON">Son</MenuItem>
          <MenuItem value="DAUGHTER">Daughter</MenuItem>
          <MenuItem value="FATHER">Father</MenuItem>
          <MenuItem value="MOTHER">Mother</MenuItem>
        </TextField>

        <Button
          component="label"
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Upload Documents
          <input
            hidden
            type="file"
            multiple
            onChange={(e) =>
              updateFamilyMember(index, "documents", [
                ...(m.documents || []),
                ...Array.from(e.target.files || []),
              ])
            }
          />
        </Button>
        {m.documents?.length > 0 && (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      Uploaded Documents:
    </Typography>

    <Stack direction="row" spacing={2} flexWrap="wrap">
      {m.documents.map((file, fileIndex) => {
        const isImage = file.type.startsWith("image/");
        const previewUrl = URL.createObjectURL(file);

        return (
          <Box
            key={fileIndex}
            sx={{
              position: "relative",
              width: 120,
              height: 120,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #ccc",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  textAlign: "center",
                  p: 1,
                }}
              >
                {file.name}
              </Box>
            )}

            {/* زر الحذف */}
            <Button
              size="small"
              color="error"
              onClick={() => {
                updateFamilyMember(
                  index,
                  "documents",
                  m.documents.filter((_, i) => i !== fileIndex)
                );
              }}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                minWidth: 0,
                padding: "2px 6px",
                fontSize: 12,
                background: "rgba(255,255,255,0.8)",
              }}
            >
              ✕
            </Button>
          </Box>
        );
      })}
    </Stack>
  </Box>
)}

        {m.documents?.length > 0 && (
  <Typography variant="caption" sx={{ ml: 1 }}>
    {m.documents.length} file(s) uploaded
  </Typography>
)}

      </Box>
    ))}

 <Button
  sx={{ mt: 2 }}
  variant="contained"
  onClick={() => {
    if (familyMembers.length > 0) {
      const last = familyMembers[familyMembers.length - 1];
      if (!isFamilyMemberComplete(last)) {
        setErrorMsg("Please complete the current family member before adding a new one");
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
        relation: "",
        documents: [],
      },
    ]);
  }}
>
  ➕ Add Family Member
</Button>

  </Box>


      <FormControlLabel
        sx={{ mt: 1 }}
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
        label="Has Chronic Diseases?"
      />

      <Collapse in={hasChronicDiseases}>
        <Autocomplete
          multiple
          loading={loadingChronic}
          options={chronicDiseasesOptions}
          value={chronicDiseasesOptions.filter((d) =>
            chronicDiseases.includes(d.code)
          )}
          onChange={(_, values) =>
            setChronicDiseases(values.map((v) => v.code))
          }
          getOptionLabel={(option) => option.name}
        renderTags={(value, getTagProps) =>
  value.map((option, index) => {
    const { key, ...chipProps } = getTagProps({ index });

    return (
      <Chip
        key={key}              // ✅ key مباشر
        label={option.name}
        {...chipProps}         // ✅ بدون key
      />
    );
  })
}

          renderInput={(params) => (
            <TextField
              {...params}
              label="Chronic Diseases"
              margin="normal"
            />
          )}
        />

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button component="label" variant="outlined" fullWidth>
            Upload Chronic Documents
            <input
              hidden
              type="file"
              multiple
              accept=".jpg,.png,.pdf"
              ref={chronicDocsRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setChronicDocuments((prev) => [...prev, ...files]);
                e.target.value = "";
              }}
            />
          </Button>

          {chronicDocuments.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setChronicDocuments([]);
                if (chronicDocsRef.current)
                  chronicDocsRef.current.value = "";
              }}
            >
              ❌
            </Button>
          )}
        </Stack>
        {chronicDocuments.length > 0 && (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      Uploaded Chronic Documents:
    </Typography>

    <Stack direction="row" spacing={2} flexWrap="wrap">
      {chronicDocuments.map((file, index) => {
        const isImage = file.type.startsWith("image/");
        const previewUrl = URL.createObjectURL(file);

        return (
          <Box
            key={index}
            sx={{
              position: "relative",
              width: 120,
              height: 120,
              border: "1px solid #ccc",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  textAlign: "center",
                  p: 1,
                }}
              >
                {file.name}
              </Box>
            )}

            <Button
              size="small"
              color="error"
              onClick={() =>
                setChronicDocuments((prev) =>
                  prev.filter((_, i) => i !== index)
                )
              }
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 0,
                padding: "2px 6px",
                fontSize: 12,
              }}
            >
              ✕
            </Button>
          </Box>
        );
      })}
    </Stack>
  </Box>
)}

      </Collapse>
    </>
  );


        case "COORDINATION_ADMIN":
  return null;


      case "DOCTOR":
        return (
          <>
<TextField
  select
  fullWidth
  required
  label="Specialization"
  name="specialization"
  value={form.specialization}
  onChange={handleChange}
  disabled={loadingSpecs}
  helperText={loadingSpecs ? "Loading specializations..." : ""}
>
  <MenuItem value="">
    -- Select Specialization --
  </MenuItem>

  {specializations.map((spec) => (
    <MenuItem
      key={spec.id}
      value={spec.name}   // أو spec.code حسب الـ backend
    >
      {spec.displayName || spec.name}
    </MenuItem>
  ))}
</TextField>
            <TextField fullWidth label="Clinic Location" name="clinicLocation" value={form.clinicLocation} onChange={handleChange} />
          </>
        );
      case "PHARMACIST":
        return (
          <>
            <TextField fullWidth label="Pharmacy Code" name="pharmacyCode" value={form.pharmacyCode} onChange={handleChange} />
            <TextField fullWidth label="Pharmacy Name" name="pharmacyName" value={form.pharmacyName} onChange={handleChange} />
            <TextField
  fullWidth
  label="Pharmacy Location"
  name="pharmacyLocation"
  value={form.pharmacyLocation}
  onChange={handleChange}
/>
          </>
        );
      case "LAB_TECH":
        return (
          <>
            <TextField fullWidth required label="Lab Code" name="labCode" value={form.labCode} onChange={handleChange} />
            <TextField fullWidth required label="Lab Name" name="labName" value={form.labName} onChange={handleChange} />
            <TextField
  fullWidth
  label="Lab Location"
  name="labLocation"
  value={form.labLocation}
  onChange={handleChange}
/>

          </>
        );
      case "RADIOLOGIST":
        return (
          <>
<TextField
  fullWidth
  required
  label="Radiology Code"
  name="radiologyCode"
  value={form.radiologyCode}
  onChange={handleChange}
/>

<TextField
  fullWidth
  required
  label="Radiology Center Name"
  name="radiologyName"
  value={form.radiologyName}
  onChange={handleChange}
/>

<TextField
  fullWidth
  label="Radiology Location"
  name="radiologyLocation"
  value={form.radiologyLocation}
  onChange={handleChange}
/>
          </>
        );
      case "MEDICAL_ADMIN":
  return null;

    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          background: "linear-gradient(180deg, #f3f7ff 0%, #e8effc 100%)",
          minHeight: "100vh",
          ml: "240px",
        }}
      >
        <Header />

        <Box sx={{ textAlign: "center", mt: 5, mb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#150380",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              letterSpacing: 0.5,
              textShadow: "0px 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            <LocalHospitalIcon sx={{ fontSize: 32, color: "#1E8EAB" }} />
            Birzeit Health Digital Platform
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#5e6b85",
              fontSize: "1rem",
              mt: 0.5,
              letterSpacing: 0.3,
            }}
          >
            Smart • Secure • University Integrated
          </Typography>
        </Box>

        <Fade in timeout={600}>
          <Box
            sx={{
              p: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              mt: 2,
            }}
          >
            <Paper
              elevation={10}
              sx={{
                p: 5,
                width: "100%",
                maxWidth: "920px",
                borderRadius: 6,
                background: "linear-gradient(145deg, #ffffff, #f7faff)",
                boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
                border: "1px solid rgba(30,142,171,0.15)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Avatar sx={{ bgcolor: "#1E8EAB", width: 42, height: 42 }}>
                  <PersonAddAlt1Icon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" color="#1E8EAB">
                  Admin — Register New Account
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
             <Grid item xs={12} md={4}>
  <TextField
    fullWidth
    required
    label="First Name"
    value={firstName}
    onChange={(e) => setFirstName(e.target.value)}
  />
</Grid>

<Grid item xs={12} md={4}>
  <TextField
    fullWidth
    label="Middle Name"
    value={middleName}
    onChange={(e) => setMiddleName(e.target.value)}
  />
</Grid>

<Grid item xs={12} md={4}>
  <TextField
    fullWidth
    required
    label="Last Name"
    value={lastName}
    onChange={(e) => setLastName(e.target.value)}
  />
</Grid>

 <Grid item xs={12} md={6}>
                  <TextField
  fullWidth
  required
  label="Email"
  name="email"
  value={form.email}
  onChange={handleChange}
  error={form.email !== "" && !isValidEmail(form.email)}
  helperText={
    form.email !== "" && !isValidEmail(form.email)
      ? "Email must be like example@domain.com"
      : ""
  }
/>

                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
  fullWidth
  required
  type="password"
  label="Password"
  name="password"
  value={form.password}
  onChange={(e) =>
    setForm({ ...form, password: e.target.value.replace(/\s/g, "") })
  }
  error={form.password !== "" && !isValidPassword(form.password)}
  helperText={
    form.password !== "" && !isValidPassword(form.password)
      ? "Password must be at least 8 characters and include letters, numbers, and symbols"
      : ""
  }
/>

                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
  fullWidth
  required
  type="password"
  label="Confirm Password"
  name="confirmPassword"
  value={form.confirmPassword}
  onChange={(e) =>
    setForm({ ...form, confirmPassword: e.target.value.replace(/\s/g, "") })
  }
  error={form.confirmPassword !== "" && form.password !== form.confirmPassword}
  helperText={
    form.confirmPassword !== "" && form.password !== form.confirmPassword
      ? "Passwords do not match"
      : ""
  }
/>

                </Grid>

                <Grid item xs={12} md={6}>

   <TextField
  fullWidth
  required
  label="National ID"
  name="nationalId"
  value={form.nationalId}
  onChange={(e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 9) val = val.slice(0, 9);
    setForm({ ...form, nationalId: val });
  }}
  error={form.nationalId !== "" && !isValidNationalId(form.nationalId)}
  helperText={
    form.nationalId !== "" && !isValidNationalId(form.nationalId)
      ? "National ID must be exactly 9 digits"
      : ""
  }
/>

</Grid>


<Grid item xs={12} md={6}>
  <TextField
    fullWidth
    label="Employee ID"
    name="employeeId"
    value={form.employeeId}
    onChange={handleChange}
  />
</Grid>


<Grid item xs={12} md={6}>
  <TextField
    fullWidth
    required
    type="date"
    label="Date of Birth"
    name="dateOfBirth"
    value={form.dateOfBirth}
    onChange={handleChange}
    InputLabelProps={{ shrink: true }}
  />
</Grid>


<Grid item xs={12} md={6}>
  <TextField
    select
    fullWidth
    required
    label="Gender"
    name="gender"
    value={form.gender}
    onChange={handleChange}
  >
    <MenuItem value="MALE">Male</MenuItem>
    <MenuItem value="FEMALE">Female</MenuItem>
  </TextField>
</Grid>


                <Grid item xs={12} md={6}>
                  <TextField
  fullWidth
  required
  label="Phone Number"
  name="phone"
  value={form.phone}
                  placeholder="05XXXXXXXX"
  onChange={(e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    setForm({ ...form, phone: val });
  }}
  error={form.phone !== "" && !isValidPhone(form.phone)}
  helperText={
    form.phone !== "" && !isValidPhone(form.phone)
      ? "Phone must start with 05 and be exactly 10 digits"
      : ""
  }
/>

                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Select Role"
                    name="desiredRole"
                    value={form.desiredRole}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      displayEmpty: true,
                      sx: { height: 56, display: "flex", alignItems: "center" },
                    }}
                  >
                    <MenuItem value="" disabled>
                      — Select a Role —
                    </MenuItem>
                    {roles.map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.icon}
                        {r.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Grid container spacing={2}>{renderRoleFields()}</Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{
                      textTransform: "none",
                      borderColor: "#1E8EAB",
                      color: "#1E8EAB",
                      fontWeight: "bold",
                      "&:hover": { borderColor: "#150380", color: "#150380" },
                    }}
                  >
                    Upload University Card
                    <input hidden type="file" onChange={handleFileChange} />
                  </Button>
                  {file && (
                    <Typography variant="body2" sx={{ mt: 1, color: "#333" }}>
                      📎 {file.name}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} textAlign="right" sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={handleSubmit}
                    sx={{
                      px: 6,
                      py: 1.4,
                      borderRadius: 4,
                      fontWeight: "bold",
                      fontSize: "1rem",
                      background: "linear-gradient(90deg,#150380,#1E8EAB)",
                      boxShadow: "0 4px 14px rgba(30,142,171,0.4)",
                      "&:hover": { opacity: 0.9 },
                    }}
                  >
                    {loading ? <CircularProgress size={26} color="inherit" /> : "Create Account"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Fade>

        <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg("")}>
          <Alert severity="success">{successMsg}</Alert>
        </Snackbar>
        <Snackbar open={!!errorMsg} autoHideDuration={4000} onClose={() => setErrorMsg("")}>
          <Alert severity="error">{errorMsg}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AdminRegisterAccounts;
