import { api } from "../../../utils/apiService";
import { API_ENDPOINTS } from "../../../config/api";

/**
 * Custom hook for handling unified request submission
 * Handles visit creation, prescription, lab tests, and radiology requests
 */
export const useRequestSubmitHandler = ({
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
}) => {
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if there's a same specialization restriction
    if (hasSameSpecializationRestriction) {
      showError("You couldn't visit two doctors on the same day with the same specialization.");
      return;
    }

    // Validate patient against specialization restrictions before submitting
    if (selectedSpecializationData) {
      const patientAge = selectedFamilyMember
        ? selectedFamilyMember.age || patientForm.age
        : patientForm.age;
      const patientGender = selectedFamilyMember
        ? selectedFamilyMember.gender
        : patientForm.gender;

      // Check gender restrictions
      if (selectedSpecializationData.allowedGenders && selectedSpecializationData.allowedGenders.length > 0) {
        const normalizedPatientGender = patientGender?.toUpperCase();
        const normalizedAllowedGenders = selectedSpecializationData.allowedGenders.map(g => g.toUpperCase());

        if (!normalizedAllowedGenders.includes(normalizedPatientGender)) {
          const genderMessage = language === "ar"
            ? `هذا التخصص (${selectedSpecializationData.displayName}) مخصص فقط للمرضى من جنس: ${selectedSpecializationData.allowedGenders.join(", ")}`
            : `This specialization (${selectedSpecializationData.displayName}) is only for patients of gender: ${selectedSpecializationData.allowedGenders.join(", ")}`;
          showError(genderMessage);
          return;
        }
      }

      // Check age restrictions
      const age = parseInt(patientAge);
      if (!isNaN(age)) {
        if (selectedSpecializationData.minAge !== null && selectedSpecializationData.minAge !== undefined && age < selectedSpecializationData.minAge) {
          const ageMessage = language === "ar"
            ? `هذا التخصص (${selectedSpecializationData.displayName}) مخصص للمرضى من عمر ${selectedSpecializationData.minAge} سنة فأكثر. عمر المريض: ${age} سنة`
            : `This specialization (${selectedSpecializationData.displayName}) is for patients aged ${selectedSpecializationData.minAge} years and above. Patient age: ${age} years`;
          showError(ageMessage);
          return;
        }

        if (selectedSpecializationData.maxAge !== null && selectedSpecializationData.maxAge !== undefined && age > selectedSpecializationData.maxAge) {
          const ageMessage = language === "ar"
            ? `هذا التخصص (${selectedSpecializationData.displayName}) مخصص للمرضى حتى عمر ${selectedSpecializationData.maxAge} سنة. عمر المريض: ${age} سنة`
            : `This specialization (${selectedSpecializationData.displayName}) is for patients up to ${selectedSpecializationData.maxAge} years old. Patient age: ${age} years`;
          showError(ageMessage);
          return;
        }
      }
    }

    setLoading(true);

    // Check diagnosis and treatment only if they are required
    if (!noDiagnosisTreatment && (!patientForm.diagnosis.trim() || !patientForm.treatment.trim())) {
      showError("Please enter diagnosis and treatment");
      setLoading(false);
      return;
    }

    // Filter out invalid items before checking (with null safety)
    const validMedicines = (selectedMedicines || []).filter((m) => m.medicineId && m.medicine);
    const validLabTests = (selectedLabTests || []).filter((lab) => lab.testId && lab.test);
    const validRadiologyTests = (selectedRadiologyTests || []).filter((rad) => rad.testId && rad.test);

    // Check if we have at least one valid item type
    if (
      validMedicines.length === 0 &&
      validLabTests.length === 0 &&
      validRadiologyTests.length === 0
    ) {
      showError("Please add at least one valid medicine, lab test, or radiology test");
      setLoading(false);
      return;
    }

    // Check required patient information based on what's being submitted
    if (validMedicines.length > 0 && !patientForm.memberName) {
      showError("Member name is required for prescriptions. Please lookup the patient using Employee ID first.");
      setLoading(false);
      return;
    }

    if (validLabTests.length > 0 && !patientForm.memberName) {
      showError("Member name is required for lab tests. Please lookup the patient using Employee ID first.");
      setLoading(false);
      return;
    }

    if (validRadiologyTests.length > 0 && !patientForm.memberId) {
      showError("Member ID is required for radiology tests. Please lookup the patient using Employee ID first.");
      setLoading(false);
      return;
    }

    // Validate doctor ID is available, fetch if missing
    let currentDoctorId = doctorId;
    if (!currentDoctorId) {
      try {
        // api.get() returns data directly, not wrapped in .data
        const doctorRes = await api.get(API_ENDPOINTS.AUTH.ME);
        if (doctorRes?.id) {
          currentDoctorId = doctorRes.id;
          setDoctorId(currentDoctorId);
        } else {
          showError("Doctor information not available. Please refresh the page and try again.");
          setLoading(false);
          return;
        }
      } catch {
        showError("Failed to load doctor information. Please refresh the page and try again.");
        setLoading(false);
        return;
      }
    }

    // Validate patient information is available for visit creation
    if (!selectedFamilyMember && !patientForm.memberId) {
      showError("Patient information is required. Please lookup the patient using Employee ID first.");
      setLoading(false);
      return;
    }

    try {
      // Create visit first (before other requests)
      // This will validate visit rules (12 visits/year, same-day same-specialization restriction, etc.)
      const visitNotes = noDiagnosisTreatment 
        ? "No diagnosis/treatment required"
        : `Diagnosis: ${patientForm.diagnosis}\nTreatment: ${patientForm.treatment}`;

      const visitData = {
        doctorId: currentDoctorId,
        visitDate: new Date().toISOString().split("T")[0], // Today's date
        notes: visitNotes,
        ...(selectedFamilyMember 
          ? { familyMemberId: selectedFamilyMember.id }
          : { patientId: patientForm.memberId }
        )
      };

      let visitResponse = null;
      try {
        // api.post() returns data directly, not wrapped in .data
        visitResponse = await api.post("/api/visits/create", visitData);

        // Show success message for visits
        if (visitResponse?.visitType === "FOLLOW_UP") {
          showSuccess(`✅ Visit recorded as FOLLOW-UP (not counted towards yearly limit). Remaining visits: ${visitResponse?.remainingVisits ?? 'N/A'}`);
        } else {
          showSuccess(`✅ Visit recorded. Remaining visits for this year: ${visitResponse?.remainingVisits ?? 'N/A'}`);
        }
      } catch (visitErr) {
        // Visit creation failed - show error and stop the process
        const errorMessage = visitErr.response?.data?.message || visitErr.message || "Failed to create visit";
        showError(`Visit creation failed: ${errorMessage}`);
        setLoading(false);
        return; // Stop here - don't create other requests if visit fails
      }

      // Create all requests in parallel (after visit is created successfully and is NOT follow-up)
      const promises = [];

      // Create prescriptions
      if (validMedicines.length > 0) {
        const items = validMedicines.map((m) => {
          // If medicine doesn't need dosage, send null values
          if (m.noDosage) {
            return {
              medicineId: m.medicineId,
              dosage: null,
              timesPerDay: null,
              duration: m.duration ? parseInt(m.duration) : null,
              noDosage: true,
              form: m.form || m.medicine?.form || null, // Include form
            };
          }
          // For medicines that need dosage, send the actual values
          return {
            medicineId: m.medicineId,
            dosage: m.dosage ? parseInt(m.dosage) : null,
            timesPerDay: m.timesPerDay ? parseInt(m.timesPerDay) : null,
            duration: m.duration ? parseInt(m.duration) : null,
            noDosage: false,
            form: m.form || m.medicine?.form || null, // Include form
          };
        });

        // Combine diagnosis and treatment in notes so pharmacist can see them
        // Include family member info if selected
        let notes = "";
        if (!noDiagnosisTreatment) {
          notes = `Diagnosis: ${patientForm.diagnosis}\nTreatment: ${patientForm.treatment}`;
        } else {
          notes = "No diagnosis/treatment required";
        }
        if (selectedFamilyMember) {
          notes += `\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`;
        }
        
        // Use memberId if available (for family members), otherwise use memberName
        const prescriptionData = selectedFamilyMember 
          ? {
              memberId: selectedFamilyMember.id, // Use family member ID
              diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
              treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
              notes: notes,
              items,
            }
          : {
              memberName: patientForm.memberName, // Use main client name
              diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
              treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
              notes: notes,
              items,
            };
        
        promises.push(
          api.post("/api/prescriptions/create", prescriptionData)
        );
      }

      // Create lab requests
      if (validLabTests.length > 0) {
        validLabTests.forEach((lab) => {
          const labNotes = noDiagnosisTreatment 
            ? (selectedFamilyMember 
                ? `No diagnosis/treatment required\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
                : "No diagnosis/treatment required")
            : (selectedFamilyMember 
                ? `${patientForm.diagnosis}\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
                : patientForm.diagnosis);

          const labData = selectedFamilyMember
            ? {
                testId: lab.testId,
                testName: lab.test.serviceName,
                memberName: selectedFamilyMember.fullName,
                memberId: selectedFamilyMember.id,
                notes: labNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
              }
            : {
                testId: lab.testId,
                testName: lab.test.serviceName,
                memberName: patientForm.memberName,
                notes: labNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
              };
          
          promises.push(
            api.post("/api/labs/create", labData)
          );
        });
      }

      // Create radiology requests
      if (validRadiologyTests.length > 0) {
        validRadiologyTests.forEach((rad) => {
          const radiologyNotes = noDiagnosisTreatment 
            ? (selectedFamilyMember 
                ? `No diagnosis/treatment required\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
                : "No diagnosis/treatment required")
            : (selectedFamilyMember 
                ? `${patientForm.diagnosis}\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
                : patientForm.diagnosis);

          const radiologyData = selectedFamilyMember
            ? {
                testId: rad.testId,
                memberId: selectedFamilyMember.id, // Use family member ID
                notes: radiologyNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
              }
            : {
                testId: rad.testId,
                memberId: patientForm.memberId, // Use main client ID
                notes: radiologyNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
              };
          
          promises.push(
            api.post("/api/radiology/create", radiologyData)
          );
        });
      }

      await Promise.all(promises);
      showSuccess("✅ Requests created successfully!");

      // Auto-submit claim for the visit
      try {
        let clientId;

        // Get client ID (family member or main client)
        if (selectedFamilyMember) {
          clientId = selectedFamilyMember.id;
        } else {
          clientId = patientForm.memberId;
        }

        // Get consultation price from specialization
        const consultationPrice = selectedSpecializationData?.consultationPrice || 0;

        // Build roleSpecificData with medicines, lab tests, and radiology tests
        const roleSpecificData = {
          notes: "Auto-submitted claim from doctor visit",
          specialization: selectedSpecializationData?.displayName || 'General',
          // Include medicines with details
          medicines: validMedicines.map((m) => ({
            name: m.medicine?.serviceName || m.medicine?.name || "Unknown",
            form: m.form || m.medicine?.form || "",
            dosage: m.dosage || null,
            timesPerDay: m.timesPerDay || null,
            duration: m.duration || null,
            noDosage: m.noDosage || false,
            price: m.medicine?.basePrice || m.medicine?.price || 0,
          })),
          // Include lab tests with details
          labTests: validLabTests.map((lab) => ({
            name: lab.test?.serviceName || lab.test?.name || "Unknown",
            price: lab.test?.basePrice || lab.test?.price || 0,
          })),
          // Include radiology tests with details
          radiologyTests: validRadiologyTests.map((rad) => ({
            name: rad.test?.serviceName || rad.test?.name || "Unknown",
            price: rad.test?.basePrice || rad.test?.price || 0,
          })),
        };

        // Create claim data
        const claimData = {
          clientId: clientId,
          description: `Medical consultation - ${selectedSpecializationData?.displayName || 'General'}`,
          amount: consultationPrice,
          serviceDate: new Date().toISOString().split("T")[0],
          diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
          treatmentDetails: noDiagnosisTreatment ? "" : patientForm.treatment,
          roleSpecificData: JSON.stringify(roleSpecificData),
        };

        // Create FormData for multipart/form-data request
        const formData = new FormData();
        formData.append("data", JSON.stringify(claimData));
        // No document needed for auto-submitted claims

        // Submit claim automatically using multipart/form-data
        await api.post("/api/healthcare-provider-claims/create", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        showSuccess("✅ Claim submitted successfully!");

        // Redirect to dashboard
        setTimeout(() => {
          localStorage.setItem("doctorActiveView", "create-center");
          window.location.href = "/DoctorDashboard";
        }, 1500);
      } catch (claimErr) {
        showError("Requests created but claim submission failed: " + (claimErr.response?.data?.message || claimErr.message));
        // Still consider it a success since requests were created
        setTimeout(() => {
          localStorage.setItem("doctorActiveView", "create-center");
          window.location.href = "/DoctorDashboard";
        }, 2000);
      }
    } catch (err) {
      showError("Error creating requests: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return handleSubmit;
};

/**
 * Custom hook for handling claim submission
 * Handles claim creation with document upload for follow-up and regular visits
 */
export const useClaimSubmitHandler = ({
  showError,
  showSuccess,
  claimForm,
  patientForm,
  selectedFamilyMember,
  isFollowUpVisit,
  selectedSpecialization,
  selectedSpecializationData,
  specializations,
}) => {
  const handleClaimSubmit = async (e) => {
    e.preventDefault();

    if (!claimForm.description.trim() || !claimForm.amount || !claimForm.document) {
      showError("Please fill in all claim fields including uploading a document");
      return;
    }

    try {
      let clientId;
      let memberName;

      // If family member is selected, use family member ID directly
      if (selectedFamilyMember) {
        clientId = selectedFamilyMember.id;
        memberName = selectedFamilyMember.fullName;
      } else {
        // Otherwise, search for main client by name
        // api.get() returns data directly, not wrapped in .data
        const clientRes = await api.get(
          `/api/healthcare-provider-claims/clients/by-name?fullName=${encodeURIComponent(
            patientForm.memberName
          )}`
        );

        if (!clientRes || !clientRes.id) {
          showError("❌ Patient not found in system");
          return;
        }

        clientId = clientRes.id;
        memberName = patientForm.memberName;
      }

      // Check if this is a follow-up visit
      let isFollowUp = false;
      if (isFollowUpVisit) {
        isFollowUp = true;
        // Show warning message
        const confirmMessage = "⚠️ This is a Follow-up visit. The patient must pay the examination fee. Insurance will not cover the examination fee. Do you want to continue?";
        if (!window.confirm(confirmMessage)) {
          return; // User cancelled
        }
      }

      // Store original consultation fee if follow-up (convert to number)
      // This should be the doctor's consultation price from claimForm.amount (e.g., 50), not 0
      // Priority: 1) claimForm.amount (from form), 2) selectedSpecializationData.consultationPrice, 3) find from specializations
      let consultationPrice = 0;
      
      // First priority: Get from claimForm.amount (this is what the user entered in the form)
      if (claimForm.amount) {
        consultationPrice = parseFloat(claimForm.amount) || 0;
      }
      
      // If still 0, try from selectedSpecializationData
      if (consultationPrice === 0 && selectedSpecializationData && selectedSpecializationData.consultationPrice !== undefined) {
        consultationPrice = parseFloat(selectedSpecializationData.consultationPrice) || 0;
      }
      
      // If still 0, try to get it from the doctor's specialization list
      if (consultationPrice === 0 && selectedSpecialization && Array.isArray(specializations) && specializations.length > 0) {
        const matched = specializations.find(s =>
          s.displayName === selectedSpecialization ||
          s.displayName?.toLowerCase() === selectedSpecialization?.toLowerCase()
        );
        if (matched && matched.consultationPrice !== undefined && matched.consultationPrice > 0) {
          consultationPrice = parseFloat(matched.consultationPrice) || 0;
        }
      }
      
      // For follow-up, originalConsultationFee must be the doctor's consultation price from claimForm.amount (not 0)
      const originalConsultationFee = isFollowUp && consultationPrice > 0 ? consultationPrice : (isFollowUp ? null : null);
      
      // Validate that we have the consultation price for follow-up visits
      if (isFollowUp && (!originalConsultationFee || originalConsultationFee === 0)) {
        showError("⚠️ Error: Examination fee not found. Please ensure the examination fee is properly set in the Amount field.");
        return;
      }

      const roleData = {
        notes: isFollowUp 
          ? "⚠️ FOLLOW-UP VISIT: Patient must pay consultation fee. Insurance does not cover consultation fee for follow-up visits."
          : "Unified request claim created automatically",
        isFollowUp: isFollowUp,
        originalConsultationFee: originalConsultationFee, // Store original fee for display
      };

      const claimData = {
        clientId: clientId, // This can be either main client ID or family member ID
        memberName: memberName,
        description: claimForm.description,
        amount: isFollowUp ? 0 : parseFloat(claimForm.amount), // Set amount to 0 for follow-up (patient pays, insurance doesn't)
        serviceDate: new Date().toISOString().split("T")[0],
        diagnosis: patientForm.diagnosis,
        treatmentDetails: patientForm.treatment,
        roleSpecificData: JSON.stringify(roleData), // Include roleSpecificData in the claimData JSON
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(claimData));
      formData.append("document", claimForm.document);

      await api.post(API_ENDPOINTS.HEALTHCARE_CLAIMS.SUBMIT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showSuccess("✅ Claim sent successfully!");
      setTimeout(() => {
        localStorage.setItem("doctorActiveView", "create-center");
        window.location.href = "/DoctorDashboard";
      }, 2000);
    } catch (err) {
      showError(`❌ ${err.response?.data?.message || err.message}`);
    }
  };

  return handleClaimSubmit;
};
