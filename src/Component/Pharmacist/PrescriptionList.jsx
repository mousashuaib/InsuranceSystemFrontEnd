// src/Component/Pharmacist/PrescriptionList.jsx
import React, { useState, useEffect } from "react";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Stack,
  Button,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import BadgeIcon from "@mui/icons-material/Badge";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ClearIcon from "@mui/icons-material/Clear";
import PrescriptionCard from "./PrescriptionCard";
import PrescriptionDialogs from "./PrescriptionDialogs";

const PrescriptionList = ({ prescriptions, onVerify, onReject, onSubmitClaim, onBill }) => {
  const { language, isRTL } = useLanguage();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // "all", "pending", "verified" - Default to pending only
  const [_employeeIdToNameMap, setEmployeeIdToNameMap] = useState({});
  const [nameToEmployeeIdMap, setNameToEmployeeIdMap] = useState({}); // Map patient names to employee IDs
  const [_clientInfoMap, _setClientInfoMap] = useState({}); // Map member names to client info (age, gender)
  const _token = getToken();

  // New state for search functionality
  const [searchType, setSearchType] = useState("employeeId"); // "employeeId" or "nationalId"
  const [searchInput, setSearchInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [verifyDialog, setVerifyDialog] = useState({
    open: false,
    prescription: null,
    prices: [],
  });
  const [documentDialog, setDocumentDialog] = useState({
    open: false,
    loading: false,
    document: null,
    description: "",
  });
  const [imageDialog, setImageDialog] = useState({
    open: false,
    imageUrl: null,
  });

  // Family member filter state
  const [familyMemberFilter, setFamilyMemberFilter] = useState("all"); // "all", "main", or family member name

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Calculate age from date of birth
  const _calculateAgeFromDOB = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? `${age} years` : null;
    } catch {
      return null;
    }
  };

  // Get family member info from DTO (extracted by mapper) or parse from treatment field
  const getFamilyMemberInfo = (prescription) => {
    // First, try to use DTO fields (if mapper has extracted them)
    if (prescription.isFamilyMember === true && prescription.familyMemberName) {
      const info = {
        name: prescription.familyMemberName,
        relation: prescription.familyMemberRelation,
        insuranceNumber: prescription.familyMemberInsuranceNumber,
        age: prescription.familyMemberAge || null,
        gender: prescription.familyMemberGender || null,
        nationalId: prescription.familyMemberNationalId || null,
      };
      return info;
    }
    
    // Fallback: Parse from treatment field (for backward compatibility or if mapper hasn't extracted yet)
    if (prescription.treatment) {
      // Backend format: "\nFamily Member: [Name] ([Relation]) - Insurance: [Insurance Number] - Age: [Age] - Gender: [Gender]"
      // The pattern starts with optional newline/whitespace
      
      // Pattern 1: With age and gender (new format)
      // Backend format: "\nFamily Member: Name (Relation) - Insurance: Number - Age: Age - Gender: Gender"
      // Match anywhere in the string, handle optional whitespace
      let familyMemberPattern = /Family\s+Member:\s*([^-]+?)\s*\(([^)]+)\)\s*-\s*Insurance:\s*([^-]+?)\s*-\s*Age:\s*([^-]+?)\s*-\s*Gender:\s*([^\n\r]+?)(?:\n|$|$)/i;
      let match = prescription.treatment.match(familyMemberPattern);
      
      if (match && match.length >= 6) {
        let age = match[4] ? match[4].trim() : null;
        let gender = match[5] ? match[5].trim() : null;
        
        // Handle "N/A" or empty values
        if (!age || age === "N/A" || age === "N/A years" || age === "null" || age === "") age = null;
        if (!gender || gender === "N/A" || gender === "null" || gender === "") gender = null;
        
        const info = {
          name: match[1].trim(),
          relation: match[2].trim(),
          insuranceNumber: match[3].trim(),
          age: age,
          gender: gender,
          nationalId: null, // Not available from treatment field parsing
        };
        return info;
      }
      
      // Pattern 2: Without age and gender (old format)
      familyMemberPattern = /Family\s+Member:\s*([^-]+?)\s*\(([^)]+)\)\s*-\s*Insurance:\s*([^\n\r]+?)(?:\n|$)/i;
      match = prescription.treatment.match(familyMemberPattern);
      
      if (match) {
        const info = {
          name: match[1].trim(),
          relation: match[2].trim(),
          insuranceNumber: match[3].trim(),
          age: null, // Not available in old format
          gender: null, // Not available in old format
          nationalId: null, // Not available in old format
        };
        return info;
      }
    }
    
    return null;
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          color: "warning",
          label: t("pending", language),
          bgcolor: "#FFF3E0",
          textColor: "#E65100",
          icon: "⏳",
        };
      case "verified":
        return {
          color: "success",
          label: t("verified", language),
          bgcolor: "#E8F5E9",
          textColor: "#2E7D32",
          icon: "✅",
        };
      case "rejected":
        return {
          color: "error",
          label: t("rejected", language),
          bgcolor: "#FFEBEE",
          textColor: "#C62828",
          icon: "❌",
        };
      case "billed":
        return {
          color: "info",
          label: t("billed", language),
          bgcolor: "#E3F2FD",
          textColor: "#1565C0",
          icon: "💰",
        };
      default:
        return {
          color: "default",
          label: t("noData", language),
          bgcolor: "#F5F5F5",
          textColor: "#757575",
          icon: "❓",
        };
    }
  };

  // Helper function to detect form from medicine name (fallback)
  const detectFormFromName = (medicineName) => {
    if (!medicineName) return null;
    const nameUpper = medicineName.toUpperCase();
    // Check for Arabic "سائل" or English "liquid" or "syrup"
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

  // Helper functions to get dosage unit labels based on medicine form
  const getDosageUnit = (form, medicineName = null) => {
    // If form is null, try to detect from medicine name
    if (!form && medicineName) {
      const detectedForm = detectFormFromName(medicineName);
      if (detectedForm) {
        form = detectedForm;
      }
    }
    if (!form) return { ar: "وحدة", en: "unit(s)" };
    const formUpper = form.toUpperCase();
    if (formUpper === "TABLET") return { ar: "حبة", en: "pill(s)" };
    if (formUpper === "SYRUP" || formUpper === "LIQUID PACKAGE") return { ar: "مل", en: "ml" };
    if (formUpper === "CREAM") return { ar: "جم", en: "g" };
    if (formUpper === "DROPS") return { ar: "قطرة", en: "drops" };
    if (formUpper === "INJECTION") return { ar: "مل", en: "ml" };
    return { ar: "وحدة", en: "unit(s)" };
  };

  const getDailyUnit = (form, medicineName = null) => {
    // If form is null, try to detect from medicine name
    if (!form && medicineName) {
      const detectedForm = detectFormFromName(medicineName);
      if (detectedForm) {
        form = detectedForm;
      }
    }
    if (!form) return { ar: "وحدة/يوم", en: "units/day" };
    const formUpper = form.toUpperCase();
    if (formUpper === "TABLET") return { ar: "حبة/يوم", en: "pills/day" };
    if (formUpper === "SYRUP" || formUpper === "LIQUID PACKAGE") return { ar: "مل/يوم", en: "ml/day" };
    if (formUpper === "CREAM") return { ar: "جم/يوم", en: "g/day" };
    if (formUpper === "DROPS") return { ar: "قطرة/يوم", en: "drops/day" };
    if (formUpper === "INJECTION") return { ar: "مل/يوم", en: "ml/day" };
    return { ar: "وحدة/يوم", en: "units/day" };
  };

  // Helper function to get quantity unit label (for display in calculated quantity)
  // للسائل/الكريم/القطرة: علبة، للحبوب/الحقن: حبة/حقنة
  const getQuantityUnit = (form, medicineName = null) => {
    if (!form && medicineName) {
      const detectedForm = detectFormFromName(medicineName);
      if (detectedForm) {
        form = detectedForm;
      }
    }
    if (!form) return { ar: "وحدة", en: "unit" };
    const formUpper = form.toUpperCase();
    // للسائل/الكريم/القطرة: علبة كاملة
    if (formUpper === "SYRUP" || formUpper === "LIQUID PACKAGE") return { ar: "علبة", en: "bottle" };
    if (formUpper === "CREAM" || formUpper === "OINTMENT") return { ar: "علبة", en: "tube" };
    if (formUpper === "DROPS") return { ar: "علبة", en: "bottle" };
    // للحبوب/الحقن: حبة/حقنة
    if (formUpper === "TABLET" || formUpper === "CAPSULE") return { ar: "حبة", en: "pill" };
    if (formUpper === "INJECTION") return { ar: "حقنة", en: "injection" };
    return { ar: "وحدة", en: "unit" };
  };

  const _isLiquidMedicine = (form, medicineName = null) => {
    // If form is null, try to detect from medicine name
    if (!form && medicineName) {
      const detectedForm = detectFormFromName(medicineName);
      if (detectedForm) {
        form = detectedForm;
      }
    }
    if (!form) return false;
    const formUpper = form.toUpperCase();
    return formUpper === "SYRUP" || formUpper === "LIQUID PACKAGE";
  };

  const openVerifyDialog = (prescription) => {
    // الصيدلي يرى: الجرعة، كم مرة باليوم، المدة، الكمية المحسوبة
    // الصيدلي يدخل: السعر فقط + اختيار الأدوية المتوفرة
    const prices = prescription.items.map((item) => ({
      id: item.id,
      medicineName: item.medicineName,
      scientificName: item.scientificName,
      dosage: item.dosage, // الجرعة
      timesPerDay: item.timesPerDay, // كم مرة باليوم
      duration: item.duration, // المدة
      calculatedQuantity: item.calculatedQuantity || 0, // الكمية المحسوبة
      unionPrice: item.unionPrice || 0,
      unionPricePerUnit: item.unionPricePerUnit || 0,
      pharmacistPrice: item.pharmacistPrice || "", // الصيدلي يدخل السعر فقط
      form: item.form || null,
      fulfilled: true, // Default: all items are fulfilled (partial fulfillment support)
    }));
    setVerifyDialog({ open: true, prescription, prices });
  };

  const handlePriceChange = (itemId, value) => {
    setVerifyDialog((prev) => ({
      ...prev,
      prices: prev.prices.map((p) =>
        p.id === itemId ? { ...p, pharmacistPrice: parseFloat(value) || 0 } : p
      ),
    }));
  };

  // Handle fulfilled change - partial fulfillment support
  const handleFulfilledChange = (itemId, fulfilled) => {
    setVerifyDialog((prev) => ({
      ...prev,
      prices: prev.prices.map((p) =>
        p.id === itemId ? { ...p, fulfilled } : p
      ),
    }));
  };

  const handleVerifySubmit = async () => {
    const { prescription, prices } = verifyDialog;

    // Filter only fulfilled items (partial fulfillment support)
    const fulfilledItems = prices.filter((p) => p.fulfilled !== false);

    // Check if at least one item is fulfilled
    if (fulfilledItems.length === 0) {
      setSnackbar({
        open: true,
        message: language === "ar" ? "يجب اختيار دواء واحد على الأقل" : "You must select at least one medicine to dispense",
        severity: "warning",
      });
      return;
    }

    // Only validate prices for fulfilled items
    const invalidPrice = fulfilledItems.find((p) => !p.pharmacistPrice || p.pharmacistPrice <= 0);
    if (invalidPrice) {
      setSnackbar({
        open: true,
        message: t("pleaseEnterValidPrices", language),
        severity: "warning",
      });
      return;
    }

    // Prepare only fulfilled items with prices
    // Backend will use calculatedQuantity and calculate the final claim amount
    const itemsWithPrices = fulfilledItems.map((p) => {
      const pharmacistPrice = parseFloat(p.pharmacistPrice) || 0;

      return {
        id: p.id,
        pharmacistPrice: pharmacistPrice, // السعر الكلي للكمية المحسوبة
        fulfilled: true, // Mark as fulfilled for backend
      };
    });

    try {
      // Pass fulfilled items info to parent for claim creation
      await onVerify(prescription.id, itemsWithPrices, prescription, fulfilledItems);
      setVerifyDialog({ open: false, prescription: null, prices: [] });
      
      // فتح dialog لإضافة document
      setDocumentDialog({ open: true, loading: false, document: null, description: "" });
      
      setSnackbar({
        open: true,
        message: t("prescriptionVerifiedSuccessfully", language),
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("failedToVerifyPrescription", language),
        severity: "error",
      });
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm(t("confirmRejectPrescription", language))) {
      return;
    }

    try {
      await onReject(id);
      setSnackbar({
        open: true,
        message: t("prescriptionRejectedSuccessfully", language),
        severity: "warning",
      });
    } catch {
      setSnackbar({
        open: true,
        message: t("failedToRejectPrescription", language),
        severity: "error",
      });
    }
  };

  const handleBill = async (id) => {
    if (!window.confirm(t("confirmMarkAsBilled", language))) {
      return;
    }

    try {
      await onBill(id);

      setSnackbar({
        open: true,
        message: t("prescriptionMarkedAsBilledSuccessfully", language),
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("failedToMarkAsBilled", language),
        severity: "error",
      });
    }
  };

  const _handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentDialog((prev) => ({ ...prev, document: file }));
    }
  };

  const handleDocumentSubmit = async () => {
    setDocumentDialog((prev) => ({ ...prev, loading: true }));
    
    try {
      // إرسال الـ claim مع الـ document والـ description
      if (onSubmitClaim) {
        await onSubmitClaim({
          document: documentDialog.document,
          description: documentDialog.description,
        });
       
      }
      
      setDocumentDialog({ open: false, loading: false, document: null, description: "" });
      setSnackbar({
        open: true,
        message: t("claimSubmittedSuccessfully", language),
        severity: "success",
      });
    } catch (err) {
      console.error("Error submitting claim:", err);
      const errorMsg = err.response?.data?.message || err.message || t("failedToSubmitClaim", language);
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error",
      });
    } finally {
      setDocumentDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ✅ Fetch Employee IDs for all unique patients when prescriptions load
  // NOTE: This hook must be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    const fetchEmployeeIdsForPatients = async () => {
      if (!prescriptions || prescriptions.length === 0) {
        return;
      }
      
      // First, check if any prescriptions already have employee ID in data
      const prescriptionsWithEmployeeId = prescriptions.filter(p => p.memberEmployeeId || p.employeeId);
      
      // Build map from data that already has employee ID
      const mapFromData = {};
      prescriptionsWithEmployeeId.forEach(p => {
        if (p.memberName && (p.memberEmployeeId || p.employeeId)) {
          const name = p.memberName.toLowerCase();
          const employeeId = p.memberEmployeeId || p.employeeId;
          mapFromData[name] = employeeId;
        }
      });
      
      if (Object.keys(mapFromData).length > 0) {
        setNameToEmployeeIdMap(prev => ({ ...prev, ...mapFromData }));
      }

      // Get unique patient names (that don't already have employee ID in data)
      const uniquePatients = Array.from(
        new Set(
          prescriptions
            .filter(p => p.memberName && !p.memberEmployeeId && !p.employeeId)
            .map(p => ({
              name: p.memberName?.toLowerCase(),
              memberId: p.memberId,
              originalName: p.memberName // Keep original for matching
            }))
            .filter(p => p.name && p.memberId)
        )
      );

      if (uniquePatients.length === 0) {
        return;
      }

      // Use /api/clients/search/name/{fullName} to get employee IDs
      // This endpoint is authorized for PHARMACIST role
      try {
        const searchPromises = uniquePatients.slice(0, 20).map(async (patient) => {
          try {
            const response = await api.get(
              API_ENDPOINTS.CLIENTS.SEARCH_BY_NAME(encodeURIComponent(patient.originalName))
            );

            // api.get() returns data directly
            if (response && response.employeeId) {
              return { name: patient.name, employeeId: response.employeeId };
            }
          } catch {
            // Ignore individual errors (404, 403, etc.)
          }
          return null;
        });

        const results = await Promise.all(searchPromises);
        const validResults = results.filter(r => r !== null);

        if (validResults.length > 0) {
          const newMap = {};
          validResults.forEach(r => {
            newMap[r.name] = r.employeeId;
          });
          setNameToEmployeeIdMap(prev => ({ ...prev, ...newMap }));
        }
      } catch {
        // Search failed, ignore
      }
    };

    fetchEmployeeIdsForPatients();
  }, [prescriptions]);

  // Early return for loading state - must be after all hooks
  if (!Array.isArray(prescriptions)) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }} dir={isRTL ? "rtl" : "ltr"}>
        <Typography variant="h6" fontWeight="bold" color="text.secondary">
          {t("loading", language)}
        </Typography>
      </Box>
    );
  }

  // ✅ Sorting and filtering
  // Filter prescriptions - ONLY show PENDING prescriptions on this page
  const activePrescriptions = prescriptions.filter(
    (p) => {
      const status = p.status?.toLowerCase();
      // Only show PENDING prescriptions
      return status === "pending";
    }
  );

  const sortedPrescriptions = [...activePrescriptions].sort(
    (a, b) => {
      // Sort: PENDING first, then VERIFIED, then by date
      if (a.status?.toLowerCase() === "pending" && b.status?.toLowerCase() !== "pending") {
        return -1;
      }
      if (a.status?.toLowerCase() !== "pending" && b.status?.toLowerCase() === "pending") {
        return 1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  );

  // ✅ Lookup employee ID to name mapping - only when user presses Enter or leaves the field
  const handleEmployeeIdLookup = async (employeeId) => {
    if (!employeeId || !employeeId.trim()) {
      return;
    }

    const trimmedSearch = employeeId.trim();
    const looksLikeEmployeeId = /^[A-Za-z0-9]{3,}$/.test(trimmedSearch);
    
    if (looksLikeEmployeeId) {
      try {
        const response = await api.get(
          API_ENDPOINTS.CLIENTS.SEARCH_BY_EMPLOYEE_ID(encodeURIComponent(trimmedSearch))
        );

        // Check if response is successful and has fullName (not an error message)
        if (response.status === 200 && response.data && response.data.fullName && !response.data.error) {
          const employeeIdLower = trimmedSearch.toLowerCase();
          const patientName = response.data.fullName.toLowerCase();
          const actualEmployeeId = response.data.employeeId || trimmedSearch;
          
          // Map employee ID to patient name (for search)
          setEmployeeIdToNameMap(prev => ({
            ...prev,
            [employeeIdLower]: patientName
          }));
          
          // Map patient name to employee ID (for display in cards)
          setNameToEmployeeIdMap(prev => ({
            ...prev,
            [patientName]: actualEmployeeId
          }));
        } else {
          // Clear only this employee ID from map, keep others
          setEmployeeIdToNameMap(prev => {
            const newMap = { ...prev };
            delete newMap[trimmedSearch.toLowerCase()];
            return newMap;
          });
        }
      } catch {
        // Employee ID not found (404) or other error - silently handle
        // Clear only this employee ID from map, keep others
        setEmployeeIdToNameMap(prev => {
          const newMap = { ...prev };
          delete newMap[trimmedSearch.toLowerCase()];
          return newMap;
        });
      }
    }
  };


  // Handler for searching patient
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseEnterSearchTerm", language),
        severity: "warning",
      });
      return;
    }

    setSearchLoading(true);
    try {
      // Lookup the client to verify they exist
      const endpoint = searchType === "employeeId"
        ? `/api/clients/search/employeeId/${searchInput.trim()}`
        : `/api/clients/search/nationalId/${searchInput.trim()}`;

      const clientData = await api.get(endpoint);

      if (clientData) {
        setSearchTerm(searchInput.trim());
        setHasSearched(true);
        setSnackbar({
          open: true,
          message: language === "ar" ? `تم العثور على وصفات للعميل: ${clientData.fullName}` : `Found prescriptions for: ${clientData.fullName}`,
          severity: "success",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: language === "ar" ? "لم يتم العثور على عميل بهذا المعرف" : "Client not found with this ID",
        severity: "error",
      });
      setHasSearched(false);
      setSearchTerm("");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setHasSearched(false);
    setFamilyMemberFilter("all"); // Reset family member filter when clearing search
  };

  // First filter by search term
  const searchFilteredPrescriptions = sortedPrescriptions.filter(
    (p) => {
      // Only show prescriptions if search has been performed
      if (!hasSearched || !searchTerm.trim()) return false;

      const searchLower = searchTerm.toLowerCase();

      // Search by patient name (main client)
      const matchesName = p.memberName?.toLowerCase().includes(searchLower);

      // Search by Employee ID (main client)
      const matchesEmployeeId = p.employeeId?.toLowerCase().includes(searchLower);

      // Search by National ID (main client)
      const matchesNationalId = p.nationalId?.toLowerCase().includes(searchLower);

      // Search by family member info if exists
      const familyMemberInfo = getFamilyMemberInfo(p);
      const matchesFamilyMemberName = familyMemberInfo?.name?.toLowerCase().includes(searchLower);
      const matchesFamilyMemberInsuranceNumber = familyMemberInfo?.insuranceNumber?.toLowerCase().includes(searchLower);
      const matchesFamilyMemberNationalId = familyMemberInfo?.nationalId?.toLowerCase().includes(searchLower);

      return matchesName || matchesEmployeeId || matchesNationalId || matchesFamilyMemberName || matchesFamilyMemberInsuranceNumber || matchesFamilyMemberNationalId;
    }
  );

  // Extract unique family members from search results
  const getUniqueFamilyMembers = () => {
    const mainClientName = searchFilteredPrescriptions.length > 0 ? searchFilteredPrescriptions[0].memberName : null;
    const familyMembers = new Map();

    searchFilteredPrescriptions.forEach(p => {
      const familyInfo = getFamilyMemberInfo(p);
      if (familyInfo && familyInfo.name) {
        // Add family member with their relation
        familyMembers.set(familyInfo.name, familyInfo.relation || "Family");
      }
    });

    return { mainClientName, familyMembers: Array.from(familyMembers.entries()) };
  };

  const { mainClientName, familyMembers } = getUniqueFamilyMembers();
  const hasFamilyMembers = familyMembers.length > 0;

  // Apply family member filter
  const filteredPrescriptions = searchFilteredPrescriptions.filter((p) => {
    if (familyMemberFilter === "all") return true;

    const familyInfo = getFamilyMemberInfo(p);
    const isFamilyMemberPrescription = familyInfo !== null;

    if (familyMemberFilter === "main") {
      // Show only main client prescriptions (not family members)
      return !isFamilyMemberPrescription;
    } else {
      // Show only specific family member prescriptions
      return isFamilyMemberPrescription && familyInfo?.name === familyMemberFilter;
    }
  });

  if (prescriptions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }} dir={isRTL ? "rtl" : "ltr"}>
        <Typography variant="h5" fontWeight="bold" color="text.secondary">
          {t("noPrescriptionsFound", language)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t("noData", language)}
        </Typography>
      </Box>
    );
  }

  // Remove the old search interface - we always show the new one with toggle buttons

  const pendingCount = prescriptions.filter(
    (p) => p.status?.toLowerCase() === "pending"
  ).length;
  const verifiedCount = prescriptions.filter(
    (p) => p.status?.toLowerCase() === "verified"
  ).length;
  const billedCount = prescriptions.filter(
    (p) => p.status?.toLowerCase() === "billed"
  ).length;
  const _rejectedCount = activePrescriptions.filter(
    (p) => p.status?.toLowerCase() === "rejected"
  ).length;

  return (
    <Box dir={isRTL ? "rtl" : "ltr"} sx={{ px: { xs: 2, md: 4 }, py: 3, backgroundColor: "#FAF8F5", minHeight: "100vh" }}>
      <Box>
        {/* 📌 Header Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background: "linear-gradient(135deg, #556B2F 0%, #7B8B5E 100%)",
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                width: 56,
                height: 56,
              }}
            >
              <DescriptionIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
                {t("pendingPrescriptions", language)}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {t("prescriptionList", language)}
              </Typography>
            </Box>
          </Stack>

          {/* Stats Summary - Show only PENDING count */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  p: 2,
                  borderRadius: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="h4" fontWeight="700">
                  {pendingCount}
                </Typography>
                <Typography variant="body2">{t("pendingPrescriptions", language)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  p: 2,
                  borderRadius: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="h4" fontWeight="700">
                  {verifiedCount}
                </Typography>
                <Typography variant="body2">{t("verified", language)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Patient Search Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: "#f0f9ff" }} dir={isRTL ? "rtl" : "ltr"}>
          <Typography variant="h6" fontWeight={600} mb={3} color="#0284c7">
            {language === "ar" ? "بحث عن وصفات العميل" : "Search Patient Prescriptions"}
          </Typography>

          {/* Search Type Toggle */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="#0284c7">
              {language === "ar" ? "اختر نوع البحث:" : "Select Search Type:"}
            </Typography>
            <ToggleButtonGroup
              value={searchType}
              exclusive
              onChange={(event, newSearchType) => {
                if (newSearchType !== null) {
                  setSearchType(newSearchType);
                  setSearchInput("");
                }
              }}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  fontSize: "1rem",
                  border: "2px solid #cbd5e1",
                  "&.Mui-selected": {
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    border: "2px solid #667eea",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="employeeId">
                <BadgeIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 22 }} />
                {t("employeeId", language)}
              </ToggleButton>
              <ToggleButton value="nationalId">
                <CreditCardIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, fontSize: 22 }} />
                {t("nationalId", language)}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={hasSearched ? 8 : 10}>
              <TextField
                label={searchType === "employeeId" ? `🆔 ${t("employeeId", language)}` : `🪪 ${t("nationalId", language)}`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !searchLoading && searchInput.trim()) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={searchType === "employeeId" ? t("enterEmployeeId", language) : t("enterNationalId", language)}
                fullWidth
                required
                disabled={searchLoading}
                InputProps={{
                  endAdornment: hasSearched && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClearSearch}
                        edge="end"
                        size="small"
                        sx={{ color: "#dc2626" }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {hasSearched && (
              <Grid item xs={12} md={2}>
                <Button
                  onClick={handleClearSearch}
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: "#dc2626",
                    color: "#dc2626",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    padding: "12px 16px",
                    borderRadius: 2.5,
                    "&:hover": {
                      borderColor: "#b91c1c",
                      bgcolor: "#fee2e2",
                    },
                  }}
                >
                  {language === "ar" ? "مسح" : "Clear"}
                </Button>
              </Grid>
            )}

            <Grid item xs={12} md={hasSearched ? 2 : 2} sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                onClick={handleSearch}
                variant="contained"
                fullWidth
                disabled={searchLoading || !searchInput}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff !important",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  padding: "12px 16px",
                  borderRadius: 2.5,
                }}
              >
                {searchLoading ? (language === "ar" ? "جاري البحث..." : "Searching...") : `🔍 ${language === "ar" ? "بحث" : "Search"}`}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Search Section - Only show if search has been performed */}
        {hasSearched && (
        <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0", mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            {/* Search Bar */}
            <TextField
              placeholder={t("searchPlaceholder", language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#FAF8F5",
                },
              }}
            />
          </CardContent>
        </Card>
        )}

        {/* Family Member Filter - Only show if search has been performed AND there are family members */}
        {hasSearched && hasFamilyMembers && (
          <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0", mb: 4, bgcolor: "#fef3c7" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FamilyRestroomIcon sx={{ color: "#92400e" }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#92400e">
                    {language === "ar" ? "تصفية حسب أفراد العائلة:" : "Filter by Family Member:"}
                  </Typography>
                </Stack>
                <FormControl size="small" sx={{ minWidth: 200, bgcolor: "white", borderRadius: 1 }}>
                  <Select
                    value={familyMemberFilter}
                    onChange={(e) => setFamilyMemberFilter(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value="all">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>{language === "ar" ? "🔍 الكل" : "🔍 All"}</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="main">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon sx={{ fontSize: 18, color: "#556B2F" }} />
                        <span>{mainClientName || (language === "ar" ? "العميل الرئيسي" : "Main Client")}</span>
                      </Stack>
                    </MenuItem>
                    {familyMembers.map(([name, relation]) => (
                      <MenuItem key={name} value={name}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <FamilyRestroomIcon sx={{ fontSize: 18, color: "#92400e" }} />
                          <span>{name}</span>
                          <Chip label={relation} size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#fde68a" }} />
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {familyMemberFilter !== "all" && (
                  <Button
                    size="small"
                    onClick={() => setFamilyMemberFilter("all")}
                    sx={{ color: "#92400e", textTransform: "none" }}
                  >
                    {language === "ar" ? "إظهار الكل" : "Show All"}
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Results Count - Only show if search has been performed */}
        {hasSearched && (
        <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
          {t("showing", language)} <strong>{filteredPrescriptions.length}</strong> {t("prescriptionsLabel", language)}
          {statusFilter === "all" && ` (${pendingCount} ${t("pending", language)}, ${verifiedCount} ${t("verified", language)}, ${billedCount} ${t("billed", language)})`}
          {statusFilter === "pending" && ` (${pendingCount} ${t("pending", language)})`}
          {statusFilter === "verified" && ` (${verifiedCount} ${t("verified", language)} - ${t("availableToBill", language)})`}
        </Typography>
        )}

        {/* Grid of Cards - Only show if search has been performed */}
        {hasSearched && (
        <>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            "@media (max-width: 1200px)": {
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            },
            "@media (max-width: 600px)": {
              gridTemplateColumns: "1fr",
            },
          }}
        >
          {filteredPrescriptions.map((p, index) => {
            const status = getStatusStyle(p.status);
            
            // Get employee ID for this patient - prioritize data from backend, then from search map
            const patientEmployeeId = (p.memberEmployeeId || 
                                     p.employeeId || 
                                     nameToEmployeeIdMap[p.memberName?.toLowerCase()] ||
                                     null);
            
            // Get family member info from DTO (extracted by mapper) or parse from treatment field
            const familyMemberInfo = getFamilyMemberInfo(p);
            const isFamilyMember = familyMemberInfo !== null;
            
            // Get university card image (first image from list or single image)
            const universityCardImage = p.universityCardImage || 
                                      (p.universityCardImages && p.universityCardImages.length > 0 ? p.universityCardImages[0] : null);
            
            // استخدام البيانات مباشرة من p.memberAge و p.memberGender (من الـ backend)
            let displayAge = p.memberAge || null;
            let displayGender = p.memberGender || null;
            
            // Ensure we have string format for age (e.g., "26 years")
            if (displayAge && typeof displayAge === 'number') {
              displayAge = `${displayAge} years`;
            }
            
            // Clean up age string (remove extra spaces, ensure format)
            if (displayAge && typeof displayAge === 'string') {
              displayAge = displayAge.trim();
              if (/^\d+$/.test(displayAge)) {
                displayAge = `${displayAge} years`;
              }
            }
            
            // Clean up gender string
            if (displayGender && typeof displayGender === 'string') {
              displayGender = displayGender.trim();
              if (displayGender.length > 0) {
                displayGender = displayGender.charAt(0).toUpperCase() + displayGender.slice(1).toLowerCase();
              }
            }

            return (
              <PrescriptionCard
                key={p.id}
                prescription={p}
                index={index}
                status={status}
                patientEmployeeId={patientEmployeeId}
                familyMemberInfo={familyMemberInfo}
                isFamilyMember={isFamilyMember}
                displayAge={displayAge}
                displayGender={displayGender}
                formatDate={formatDate}
                onVerify={openVerifyDialog}
                onReject={handleReject}
              />
            );
          })}
        </Box>

        {/* No Results Message */}
        {filteredPrescriptions.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed #d1d5db",
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: "#cbd5e0", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {language === "ar" ? "لا توجد وصفات لهذا العميل" : "No prescriptions found for this patient"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {language === "ar" ? "قد لا يكون لدى هذا العميل أي وصفات معلقة" : "This patient may not have any prescriptions"}
            </Typography>
          </Paper>
        )}
        </>
        )}
      </Box>

      <PrescriptionDialogs
        verifyDialog={verifyDialog}
        documentDialog={documentDialog}
        imageDialog={imageDialog}
        snackbar={snackbar}
        getDosageUnit={getDosageUnit}
        getDailyUnit={getDailyUnit}
        getQuantityUnit={getQuantityUnit}
        onVerifyClose={() => setVerifyDialog({ open: false, prescription: null, prices: [] })}
        onVerifySubmit={handleVerifySubmit}
        onPriceChange={handlePriceChange}
        onFulfilledChange={handleFulfilledChange}
        onDocumentClose={() => setDocumentDialog({ open: false, loading: false, document: null, description: "" })}
        onDocumentChange={(type, value) => {
          if (type === 'description') {
            setDocumentDialog((prev) => ({ ...prev, description: value }));
          } else if (type === 'file') {
            setDocumentDialog((prev) => ({ ...prev, document: value }));
          }
        }}
        onDocumentSubmit={handleDocumentSubmit}
        onImageClose={() => setImageDialog({ open: false, imageUrl: null })}
        onSnackbarClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default PrescriptionList;
