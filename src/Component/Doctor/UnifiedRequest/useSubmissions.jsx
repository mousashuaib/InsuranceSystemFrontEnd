import { useState } from "react";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS } from "../../../config/api";

// Custom hook for handling all submissions (visits, requests, claims)
export const useSubmissions = (showSuccess, showError) => {
  const [loading, setLoading] = useState(false);

  // Create visit
  const createVisit = async (visitData) => {
    try {
      // api.post() returns data directly, not wrapped in .data
      const data = await api.post("/api/visits/create", visitData);

      if (data?.visitType === "FOLLOW_UP") {
        showSuccess(
          `✅ Visit recorded as FOLLOW-UP (not counted towards yearly limit). Remaining visits: ${data?.remainingVisits ?? 'N/A'}`
        );
      } else {
        showSuccess(`✅ Visit recorded. Remaining visits for this year: ${data?.remainingVisits ?? 'N/A'}`);
      }

      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to create visit";
      showError(`Visit creation failed: ${errorMessage}`);
      throw err;
    }
  };

  // Submit all requests (prescriptions, lab tests, radiology tests)
  const submitRequests = async ({
    selectedMedicines,
    selectedLabTests,
    selectedRadiologyTests,
    patientForm,
    selectedFamilyMember,
    noDiagnosisTreatment,
  }) => {
    setLoading(true);

    try {
      const promises = [];

      // Create prescriptions
      if (selectedMedicines.length > 0) {
        const items = selectedMedicines.map((m) => {
          const isCustomMedicine = m.medicine?.isCustom === true || String(m.medicineId).startsWith("custom-");

          if (m.noDosage) {
            return {
              medicineId: isCustomMedicine ? null : m.medicineId,
              dosage: null,
              timesPerDay: null,
              duration: m.duration ? parseInt(m.duration) : null,
              noDosage: true,
              form: m.form || m.medicine?.form || null,
              // Custom medicine fields
              isCustom: isCustomMedicine,
              customMedicineName: isCustomMedicine ? (m.medicine?.name || "") : null,
              customScientificName: isCustomMedicine ? (m.medicine?.scientificName || "") : null,
            };
          }
          return {
            medicineId: isCustomMedicine ? null : m.medicineId,
            dosage: m.dosage ? parseInt(m.dosage) : null,
            timesPerDay: m.timesPerDay ? parseInt(m.timesPerDay) : null,
            duration: m.duration ? parseInt(m.duration) : null,
            noDosage: false,
            form: m.form || m.medicine?.form || null,
            // Custom medicine fields
            isCustom: isCustomMedicine,
            customMedicineName: isCustomMedicine ? (m.medicine?.name || "") : null,
            customScientificName: isCustomMedicine ? (m.medicine?.scientificName || "") : null,
          };
        });

        let notes = "";
        if (!noDiagnosisTreatment) {
          notes = `Diagnosis: ${patientForm.diagnosis}\nTreatment: ${patientForm.treatment}`;
        } else {
          notes = "No diagnosis/treatment required";
        }
        if (selectedFamilyMember) {
          notes += `\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`;
        }

        const prescriptionData = selectedFamilyMember
          ? {
              memberId: selectedFamilyMember.id,
              diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
              treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
              notes: notes,
              items,
            }
          : {
              memberName: patientForm.memberName,
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
      if (selectedLabTests.length > 0) {
        selectedLabTests.forEach((lab) => {
          const isCustomLabTest = lab.test?.isCustom === true || String(lab.testId).startsWith("custom-");
          const testName = lab.test?.serviceName || lab.test?.name || "";

          const labNotes = noDiagnosisTreatment
            ? selectedFamilyMember
              ? `No diagnosis/treatment required\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
              : "No diagnosis/treatment required"
            : selectedFamilyMember
            ? `${patientForm.diagnosis}\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
            : patientForm.diagnosis;

          const labData = selectedFamilyMember
            ? {
                testId: isCustomLabTest ? null : lab.testId,
                testName: testName,
                memberName: selectedFamilyMember.fullName,
                memberId: selectedFamilyMember.id,
                notes: labNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
                // Custom lab test fields
                isCustom: isCustomLabTest,
                customTestName: isCustomLabTest ? testName : null,
              }
            : {
                testId: isCustomLabTest ? null : lab.testId,
                testName: testName,
                memberId: patientForm.memberId,
                memberName: patientForm.memberName,
                notes: labNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
                // Custom lab test fields
                isCustom: isCustomLabTest,
                customTestName: isCustomLabTest ? testName : null,
              };

          promises.push(
            api.post("/api/labs/create", labData)
          );
        });
      }

      // Create radiology requests
      if (selectedRadiologyTests.length > 0) {
        selectedRadiologyTests.forEach((rad) => {
          const isCustomRadiologyTest = rad.test?.isCustom === true || String(rad.testId).startsWith("custom-");
          const testName = rad.test?.serviceName || rad.test?.name || "";

          const radiologyNotes = noDiagnosisTreatment
            ? selectedFamilyMember
              ? `No diagnosis/treatment required\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
              : "No diagnosis/treatment required"
            : selectedFamilyMember
            ? `${patientForm.diagnosis}\nFamily Member: ${selectedFamilyMember.fullName} (${selectedFamilyMember.relation}) - Insurance: ${selectedFamilyMember.insuranceNumber}`
            : patientForm.diagnosis;

          const radiologyData = selectedFamilyMember
            ? {
                testId: isCustomRadiologyTest ? null : rad.testId,
                testName: testName,
                memberId: selectedFamilyMember.id,
                notes: radiologyNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
                // Custom radiology test fields
                isCustom: isCustomRadiologyTest,
                customTestName: isCustomRadiologyTest ? testName : null,
              }
            : {
                testId: isCustomRadiologyTest ? null : rad.testId,
                testName: testName,
                memberId: patientForm.memberId,
                notes: radiologyNotes,
                diagnosis: noDiagnosisTreatment ? "" : patientForm.diagnosis,
                treatment: noDiagnosisTreatment ? "" : patientForm.treatment,
                // Custom radiology test fields
                isCustom: isCustomRadiologyTest,
                customTestName: isCustomRadiologyTest ? testName : null,
              };

          promises.push(
            api.post("/api/radiology/create", radiologyData)
          );
        });
      }

      await Promise.all(promises);
      showSuccess("✅ Request created successfully!");
      return true;
    } catch (err) {
      console.error("Error creating requests:", err);
      showError("Error creating requests: " + (err.response?.data?.message || err.message));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Submit claim
  const submitClaim = async ({
    claimForm,
    patientForm,
    selectedFamilyMember,
    isFollowUpVisit,
    selectedSpecializationData,
    selectedSpecialization,
    specializations,
  }) => {
    try {
      let clientId;
      let memberName;

      if (selectedFamilyMember) {
        clientId = selectedFamilyMember.id;
        memberName = selectedFamilyMember.fullName;
      } else {
        // api.get() returns data directly, not wrapped in .data
        const clientRes = await api.get(
          `/api/healthcare-provider-claims/clients/by-name?fullName=${encodeURIComponent(
            patientForm.memberName
          )}`
        );

        if (!clientRes || !clientRes.id) {
          showError("❌ Patient not found in system");
          return false;
        }

        clientId = clientRes.id;
        memberName = patientForm.memberName;
      }

      let isFollowUp = false;
      if (isFollowUpVisit) {
        isFollowUp = true;
        const confirmMessage =
          "⚠️ This is a Follow-up visit. The patient must pay the examination fee. Insurance will not cover the examination fee. Do you want to continue?";
        if (!window.confirm(confirmMessage)) {
          return false;
        }
      }

      let consultationPrice = 0;

      if (claimForm.amount) {
        consultationPrice = parseFloat(claimForm.amount) || 0;
      }

      if (consultationPrice === 0 && selectedSpecializationData && selectedSpecializationData.consultationPrice !== undefined) {
        consultationPrice = parseFloat(selectedSpecializationData.consultationPrice) || 0;
      }

      if (consultationPrice === 0 && selectedSpecialization && specializations.length > 0) {
        const matched = specializations.find(
          (s) =>
            s.displayName === selectedSpecialization ||
            s.displayName?.toLowerCase() === selectedSpecialization?.toLowerCase()
        );
        if (matched && matched.consultationPrice !== undefined && matched.consultationPrice > 0) {
          consultationPrice = parseFloat(matched.consultationPrice) || 0;
        }
      }

      const originalConsultationFee =
        isFollowUp && consultationPrice > 0 ? consultationPrice : isFollowUp ? null : null;

      if (isFollowUp && (!originalConsultationFee || originalConsultationFee === 0)) {
        showError("⚠️ Error: Examination fee not found. Please ensure the examination fee is properly set in the Amount field.");
        return false;
      }

      const roleData = {
        notes: isFollowUp
          ? "⚠️ FOLLOW-UP VISIT: Patient must pay consultation fee. Insurance does not cover consultation fee for follow-up visits."
          : "Unified request claim created automatically",
        isFollowUp: isFollowUp,
        originalConsultationFee: originalConsultationFee,
      };

      const claimData = {
        clientId: clientId,
        memberName: memberName,
        description: claimForm.description,
        amount: isFollowUp ? 0 : parseFloat(claimForm.amount),
        serviceDate: new Date().toISOString().split("T")[0],
        diagnosis: patientForm.diagnosis,
        treatmentDetails: patientForm.treatment,
        roleSpecificData: JSON.stringify(roleData),
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
      return true;
    } catch (err) {
      console.error("Error creating claim:", err);
      showError(`❌ ${err.response?.data?.message || err.message}`);
      return false;
    }
  };

  return {
    loading,
    createVisit,
    submitRequests,
    submitClaim,
  };
};
