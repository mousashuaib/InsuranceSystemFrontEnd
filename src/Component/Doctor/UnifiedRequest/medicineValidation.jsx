import { useState } from "react";
import { api } from "../../../utils/apiService";
import { API_ENDPOINTS } from "../../../config/api";

// Custom hook for medicine validation and active prescription checking
export const useMedicineValidation = (_selectedFamilyMember, _patientForm) => {
  const checkActivePrescription = async (medicine, memberNameToCheck) => {
    if (!memberNameToCheck || !medicine) return { canProceed: true, message: "" };

    try {
      console.log("Checking medicine:", medicine.name, "for member:", memberNameToCheck);
      // api.get() returns data directly, not wrapped in .data
      const data = await api.get(
        `/api/prescriptions/check-active/${memberNameToCheck}/${medicine.id}`
      );

      if (data && data.active === true) {
        let message = "";
        let canProceed = false;
        const memberType = data.memberType || "CLIENT";
        const memberName = data.memberName || memberNameToCheck;
        const relation = data.relation;
        const medicineName = medicine?.name || medicine?.serviceName || "Medicine";

        if (data.status === "PENDING") {
          if (memberType === "FAMILY_MEMBER" && relation) {
            message = `Medicine "${medicineName}" is blocked. Pending prescription for ${memberName} (${relation}).`;
          } else {
            message = `Medicine "${medicineName}" is blocked. Pending prescription exists.`;
          }
          canProceed = false;
        } else if (data.status === "VERIFIED") {
          // VERIFIED = pharmacist verified but not yet dispensed → block until dispensed
          if (memberType === "FAMILY_MEMBER" && relation) {
            message = `Medicine "${medicineName}" is blocked. Verified prescription for ${memberName} (${relation}), not yet dispensed.`;
          } else {
            message = `Medicine "${medicineName}" is blocked. Verified prescription exists, not yet dispensed.`;
          }
          canProceed = false;
        } else if (data.status === "BILLED") {
          if (data.allowedDate) {
            const allowedDate = new Date(data.allowedDate);
            const now = new Date();

            if (allowedDate > now || data.remainingDays > 0) {
              const remainingDays =
                data.remainingDays || Math.ceil((allowedDate - now) / (1000 * 60 * 60 * 24));
              const duration = data.duration || 0;

              const formattedDate = allowedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              if (memberType === "FAMILY_MEMBER" && relation) {
                message = `Medicine "${medicineName}" was dispensed to ${memberName} (${relation}). Duration: ${duration} days. Remaining: ${remainingDays} days. Available after ${formattedDate}.`;
              } else {
                message = `Medicine "${medicineName}" was dispensed to ${memberName}. Duration: ${duration} days. Remaining: ${remainingDays} days. Available after ${formattedDate}.`;
              }
              canProceed = false;
            } else {
              canProceed = true;
            }
          } else {
            const duration = data.duration || 30;
            if (memberType === "FAMILY_MEMBER" && relation) {
              message = `Medicine "${medicineName}" was dispensed to ${memberName} (${relation}). Duration: ${duration} days.`;
            } else {
              message = `Medicine "${medicineName}" was dispensed to ${memberName}. Duration: ${duration} days.`;
            }
            canProceed = false;
          }
        }

        return { canProceed, message, data };
      }

      return { canProceed: true, message: "" };
    } catch (err) {
      console.error("Error checking active prescriptions:", err);
      return { canProceed: true, message: "" }; // Allow if check fails
    }
  };

  return { checkActivePrescription };
};

// Custom hook for patient lookup and management
export const usePatientLookup = () => {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [patientInfoLoaded, setPatientInfoLoaded] = useState(false);
  const [mainClientInfo, setMainClientInfo] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [chronicDiseases, setChronicDiseases] = useState([]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? `${age} years` : "";
    } catch (error) {
      console.error("Error calculating age:", error);
      return "";
    }
  };

  // Helper function to process patient data and update state
  const processPatientData = async (data, showError, idType, _idValue) => {
    if (data && !data.error) {
      let age = "";
      if (data.age) {
        age = data.age;
      } else if (data.dateOfBirth || data.dateofbirth) {
        const dateOfBirth = data.dateOfBirth || data.dateofbirth;
        age = calculateAge(dateOfBirth);
      }

      const clientData = {
        id: data.id || "",
        fullName: data.fullName || "",
        phone: data.phone || "",
        employeeId: data.employeeId || "",
        nationalId: data.nationalId || "",
        insuranceNumber: data.insuranceNumber || "",
        age: age,
        gender: data.gender || "",
      };

      if (data.chronicDiseases && Array.isArray(data.chronicDiseases)) {
        setChronicDiseases(data.chronicDiseases);
      } else {
        setChronicDiseases([]);
      }

      setMainClientInfo(clientData);

      try {
        // api.get() returns data directly, not wrapped in .data
        const familyData = await api.get(API_ENDPOINTS.FAMILY_MEMBERS.BY_CLIENT(clientData.id));
        if (familyData && Array.isArray(familyData)) {
          const approvedMembers = familyData.filter((member) => member.status === "APPROVED");
          setFamilyMembers(approvedMembers);
        } else {
          setFamilyMembers([]);
        }
      } catch (familyErr) {
        console.log("Family members endpoint not available:", familyErr);
        setFamilyMembers([]);
      }

      setPatientInfoLoaded(true);
      return clientData;
    } else if (data?.error === "INVALID_ROLE") {
      setPatientInfoLoaded(false);
      showError(
        `This ${idType} does not belong to an insurance client. Please enter a ${idType} for an insurance client only.`
      );
      setMainClientInfo(null);
      setFamilyMembers([]);
      setChronicDiseases([]);
      return null;
    }
    return null;
  };

  const lookupPatient = async (employeeId, showError) => {
    if (!employeeId.trim()) {
      showError("⚠️ Please enter an Employee ID first.");
      return null;
    }

    setLookupLoading(true);
    try {
      // api.get() returns data directly, not wrapped in .data
      const data = await api.get(API_ENDPOINTS.CLIENTS.SEARCH_BY_EMPLOYEE_ID(employeeId));
      return await processPatientData(data, showError, "employee ID", employeeId);
    } catch (err) {
      console.error("Error looking up employee:", err);
      setPatientInfoLoaded(false);
      setMainClientInfo(null);
      setFamilyMembers([]);
      setChronicDiseases([]);

      if (err.response?.status === 403 || err.response?.data?.error === "INVALID_ROLE") {
        showError(
          "This employee ID does not belong to an insurance client. Please enter an employee ID for an insurance client only."
        );
      } else if (err.response?.status === 404) {
        showError("Employee ID not found. Please check and try again.");
      } else {
        showError("Error looking up employee. Please try again.");
      }
      return null;
    } finally {
      setLookupLoading(false);
    }
  };

  const lookupPatientByNationalId = async (nationalId, showError) => {
    if (!nationalId.trim()) {
      showError("⚠️ Please enter a National ID first.");
      return null;
    }

    setLookupLoading(true);
    try {
      // api.get() returns data directly, not wrapped in .data
      const data = await api.get(API_ENDPOINTS.CLIENTS.SEARCH_BY_NATIONAL_ID(nationalId));
      return await processPatientData(data, showError, "national ID", nationalId);
    } catch (err) {
      console.error("Error looking up national ID:", err);
      setPatientInfoLoaded(false);
      setMainClientInfo(null);
      setFamilyMembers([]);
      setChronicDiseases([]);

      if (err.response?.status === 403 || err.response?.data?.error === "INVALID_ROLE") {
        showError(
          "This national ID does not belong to an insurance client. Please enter a national ID for an insurance client only."
        );
      } else if (err.response?.status === 404) {
        showError("National ID not found. Please check and try again.");
      } else {
        showError("Error looking up national ID. Please try again.");
      }
      return null;
    } finally {
      setLookupLoading(false);
    }
  };

  return {
    lookupLoading,
    patientInfoLoaded,
    mainClientInfo,
    familyMembers,
    chronicDiseases,
    setMainClientInfo,
    setFamilyMembers,
    setChronicDiseases,
    setPatientInfoLoaded,
    lookupPatient,
    lookupPatientByNationalId,
    calculateAge,
  };
};
