// src/Component/Lab/LabRequestList.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Stack,
  Card,
  CardContent,
  InputAdornment,
  Grid,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Button,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DescriptionIcon from "@mui/icons-material/Description";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PersonIcon from "@mui/icons-material/Person";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import LabRequestCard from "./LabRequestCard";
import LabRequestDialogs from "./LabRequestDialogs";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const LabRequestList = ({ requests, userInfo, onSetClaimData, onSubmitClaim, onUploaded }) => {
  const { language, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [_employeeIdToNameMap, setEmployeeIdToNameMap] = useState({});
  const [nameToEmployeeIdMap, setNameToEmployeeIdMap] = useState({}); // Map patient names to employee IDs
  const [_clientInfoMap, _setClientInfoMap] = useState({}); // Map member names to client info (age, gender)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
    icon: null,
  });
  const [uploadDialog, setUploadDialog] = useState({
    open: false,
    request: null,
  });
  const [imageDialog, setImageDialog] = useState({
    open: false,
    imageUrl: null,
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [enteredPrice, setEnteredPrice] = useState("");

  // Family member filter state
  const [familyMemberFilter, setFamilyMemberFilter] = useState("all"); // "all", "main", or family member name
  
  // ✅ استخدام useRef لحفظ claimData بشكل موثوق (لا يتأثر بـ re-renders)
  const claimDataRef = useRef(null);
  // ✅ منع الاستدعاء المزدوج للـ claim
  const isSubmittingClaimRef = useRef(false);

  const _token = getToken();

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

  // Get family member info from DTO (extracted by mapper) or parse from notes field
  const getFamilyMemberInfo = (request) => {
    // First, try to use DTO fields (if mapper has extracted them)
    if (request.isFamilyMember === true && request.familyMemberName) {
      const info = {
        name: request.familyMemberName,
        relation: request.familyMemberRelation,
        insuranceNumber: request.familyMemberInsuranceNumber,
        age: request.familyMemberAge || null,
        gender: request.familyMemberGender || null,
        nationalId: request.familyMemberNationalId || null,
      };
      console.log("Using DTO fields:", info);
      return info;
    }
    
    // Fallback: Parse from notes field (for backward compatibility or if mapper hasn't extracted yet)
    if (request.notes) {
      // Backend format: "\nFamily Member: [Name] ([Relation]) - Insurance: [Insurance Number] - Age: [Age] - Gender: [Gender]"
      let familyMemberPattern = /Family\s+Member:\s*([^-]+?)\s*\(([^)]+)\)\s*-\s*Insurance:\s*([^-]+?)\s*-\s*Age:\s*([^-]+?)\s*-\s*Gender:\s*([^\n\r]+?)(?:\n|$|$)/i;
      let match = request.notes.match(familyMemberPattern);
      
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
        };
        console.log("✅ Parsed family member info (with age/gender):", info);
        return info;
      }
      
      // Pattern 2: Without age and gender (old format)
      familyMemberPattern = /Family\s+Member:\s*([^-]+?)\s*\(([^)]+)\)\s*-\s*Insurance:\s*([^\n\r]+?)(?:\n|$)/i;
      match = request.notes.match(familyMemberPattern);
      
      if (match) {
        const info = {
          name: match[1].trim(),
          relation: match[2].trim(),
          insuranceNumber: match[3].trim(),
          age: null,
          gender: null,
        };
        console.log("✅ Parsed family member info (old format):", info);
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
      case "in_progress":
        return {
          color: "info",
          label: t("inProgress", language),
          bgcolor: "#E3F2FD",
          textColor: "#1565C0",
          icon: "🔄",
        };
      case "completed":
        return {
          color: "success",
          label: t("completed", language),
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
      default:
        return {
          color: "default",
          label: status || "Unknown",
          bgcolor: "#F5F5F5",
          textColor: "#757575",
          icon: "❓",
        };
    }
  };

  const handleOpenUploadDialog = (request) => {
    setUploadDialog({ open: true, request });
    setUploadFile(null);
    setEnteredPrice("");
    // ✅ إعادة تعيين flag عند فتح حوار جديد
    isSubmittingClaimRef.current = false;
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setSnackbar({
        open: true,
        message: t("pleaseSelectFileToUpload", language),
        severity: "warning",
        icon: <ErrorIcon fontSize="inherit" />,
      });
      return;
    }

    if (!enteredPrice || parseFloat(enteredPrice) <= 0) {
      setSnackbar({
        open: true,
        message: t("pleaseEnterValidPrice", language),
        severity: "warning",
        icon: <ErrorIcon fontSize="inherit" />,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("price", parseFloat(enteredPrice));

    try {
      setUploading(true);
      const response = await api.patch(
        API_ENDPOINTS.LABS.UPLOAD(uploadDialog.request.id),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

     
      const unionPrice = parseFloat(uploadDialog.request.unionPrice) || 0;
      const enteredPriceNum = parseFloat(enteredPrice) || 0;
      const finalAmount = unionPrice > 0 ? Math.min(unionPrice, enteredPriceNum) : enteredPriceNum;
      
    
      // ✅ إنشاء unique key لهذا upload (لتجنب تضارب البيانات مع uploads أخرى)
      const uploadId = `${uploadDialog.request.id}_${Date.now()}`;
      
      // ✅ Extract diagnosis and treatment - try multiple field name variations
      // First try direct fields, then check notes field as fallback
      let diagnosis = uploadDialog.request.diagnosis || uploadDialog.request.Diagnosis || "";
      let treatment = uploadDialog.request.treatment || uploadDialog.request.Treatment || "";
      
      // ✅ Fallback: If diagnosis/treatment are empty, try to extract from notes
      // Notes format might be: "Diagnosis: ...\nTreatment: ..." or just diagnosis
      if (!diagnosis && uploadDialog.request.notes) {
        const notesMatch = uploadDialog.request.notes.match(/Diagnosis:\s*(.+?)(?:\n|$)/i);
        if (notesMatch) {
          diagnosis = notesMatch[1].trim();
        } else if (uploadDialog.request.notes && !uploadDialog.request.notes.includes("Treatment:")) {
          // If notes doesn't have "Treatment:", it might just be diagnosis
          diagnosis = uploadDialog.request.notes.trim();
        }
      }
      
      if (!treatment && uploadDialog.request.notes) {
        const treatmentMatch = uploadDialog.request.notes.match(/Treatment:\s*(.+?)(?:\n|$)/i);
        if (treatmentMatch) {
          treatment = treatmentMatch[1].trim();
        }
      }
      
      // ✅ Debug: Log to ensure diagnosis and treatment are captured
      console.log("🔍 Lab Request - Diagnosis:", diagnosis);
      console.log("🔍 Lab Request - Treatment:", treatment);
      console.log("🔍 Request Notes:", uploadDialog.request.notes);
      console.log("🔍 Full Request Object:", uploadDialog.request);
      
      // ✅ Determine the correct clientId: use familyMemberId if lab request is for a family member
      let clientIdToUse = uploadDialog.request.memberId; // Default to main client ID
      let memberNameToUse = uploadDialog.request.memberName || "";
      
      if (uploadDialog.request.isFamilyMember === true && uploadDialog.request.familyMemberId) {
        // Lab request is for a family member - use family member ID
        clientIdToUse = uploadDialog.request.familyMemberId;
        memberNameToUse = uploadDialog.request.familyMemberName || uploadDialog.request.memberName || "";
        console.log("✅ Using family member ID for claim:", clientIdToUse, "Name:", memberNameToUse);
      } else {
        console.log("✅ Using main client ID for claim:", clientIdToUse, "Name:", memberNameToUse);
      }
      
      const claimData = {
        clientId: clientIdToUse, // ✅ Now correctly uses family member ID if applicable
        memberName: memberNameToUse, // ✅ Use family member name if applicable
        description: `Lab test completed - ${uploadDialog.request.testName || "Lab Result"}`,
        amount: finalAmount,
        serviceDate: new Date().toISOString().split('T')[0],
        diagnosis: diagnosis, // ✅ Send diagnosis to medical admin
        treatmentDetails: treatment, // ✅ Send treatment to medical admin
        roleSpecificData: JSON.stringify({
          testId: uploadDialog.request.id,
          testName: uploadDialog.request.testName,
          patientName: uploadDialog.request.memberName,
          unionPrice: unionPrice,
          enteredPrice: enteredPriceNum,
          finalPrice: finalAmount,
          diagnosis: diagnosis, // ✅ Include diagnosis in roleSpecificData
          treatment: treatment, // ✅ Include treatment in roleSpecificData
          notes: `Test performed by ${userInfo?.fullName || "Lab Technician"}`
        }),
        _uploadId: uploadId // ✅ حفظ uploadId للتمييز بين uploads
      };
     
      
      if (!claimData.clientId) {
        console.error("❌ ERROR: clientId is missing!");
      }
      
      
      onSetClaimData(JSON.parse(JSON.stringify(claimData))); // Deep copy
      
      
      // ✅ تأخير بسيط بعد تحديث state للتأكد من اكتمال العملية
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ حفظ الـ claim data في useRef (موثوق ولا يتأثر بـ re-renders)
      claimDataRef.current = JSON.parse(JSON.stringify(claimData)); // Deep copy
     
      
      // ✅ حفظ في window مع unique key لكل upload (لتجنب تضارب البيانات)
      if (typeof window !== 'undefined') {
        // ✅ حفظ في window.labClaimData (global fallback)
        window.labClaimData = JSON.parse(JSON.stringify(claimData)); // Deep copy
      
        
        // ✅ حفظ أيضاً مع unique key (محمي من interference)
        if (!window.labClaimDataMap) {
          window.labClaimDataMap = {};
        }
        window.labClaimDataMap[uploadId] = JSON.parse(JSON.stringify(claimData)); // Deep copy
        
      }

      // حفظ الملف قبل إعادة التعيين (قبل أي state updates)
      const fileToSubmit = uploadFile;
      const claimDataToUse = JSON.parse(JSON.stringify(claimData)); // Deep copy محفوظ محلياً
      const uploadIdForThisUpload = claimDataToUse._uploadId || claimData._uploadId;
      
     
      
      // ✅ حفظ window.labClaimData قبل أي state updates (لتجنب المسح)
      if (typeof window !== 'undefined') {
        window.labClaimData = JSON.parse(JSON.stringify(claimDataToUse)); // Deep copy
      
        
        if (!window.labClaimDataMap) {
          window.labClaimDataMap = {};
        }
        window.labClaimDataMap[uploadIdForThisUpload] = JSON.parse(JSON.stringify(claimDataToUse));
       
      }

     
      setSnackbar({
        open: true,
        message: t("labResultUploadedSuccess", language),
        severity: "success",
        icon: <CheckCircleIcon fontSize="inherit" />,
      });

      
      onUploaded?.(response.data);
      
      
      setUploadDialog({ open: false, request: null });
      
      setUploadFile(null);
      setEnteredPrice("");
      
      // ✅ إعادة تعيين flag عند إغلاق الحوار
      isSubmittingClaimRef.current = false;
      
      // ✅ تأخير بسيط للتأكد من تحديث state قبل الاستدعاء
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      // ✅ إعادة حفظ window.labClaimData بعد state updates (للتأكد)
      if (typeof window !== 'undefined') {
        window.labClaimData = JSON.parse(JSON.stringify(claimDataToUse)); // Deep copy
      
      }
      
    
      // ✅ منع الاستدعاء المزدوج - التحقق من أن claim لم يتم إرساله بالفعل
      if (isSubmittingClaimRef.current) {
       
        return;
      }
      
      if (onSubmitClaim && fileToSubmit && claimDataToUse) {
        // ✅ استخدام claimDataToUse المحفوظ محلياً (لا يتأثر بـ state updates)
        const claimDataCopy = JSON.parse(JSON.stringify(claimDataToUse)); // Deep copy
        
      
        
        // ✅ التأكد من claimData موجود وبه clientId
        if (!claimDataCopy || !claimDataCopy.clientId) {
          console.error("❌ ERROR: Invalid claim data!", claimDataCopy);
          setSnackbar({
            open: true,
            message: t("invalidClaimDataMissingClientId", language),
            severity: "error",
            icon: <ErrorIcon fontSize="inherit" />,
          });
          return;
        }
        
        // ✅ تعيين flag لمنع الاستدعاء المزدوج
        isSubmittingClaimRef.current = true;
        
        // ✅ حفظ claimData في window قبل الاستدعاء
        if (typeof window !== 'undefined') {
          window.labClaimData = JSON.parse(JSON.stringify(claimDataCopy));
        
        }
        
        // ✅ تحديث state قبل الاستدعاء
        if (onSetClaimData) {
          onSetClaimData(JSON.parse(JSON.stringify(claimDataCopy)));
        
        }
        
        // ✅ تأخير بسيط للتأكد من تحديث state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // ✅ إرسال الـ claim تلقائياً مع الملف كـ document
        try {
       
          const _claimResult = await onSubmitClaim(fileToSubmit, claimDataCopy);
          
         
          
          // ✅ إعادة تعيين flag بعد النجاح
          isSubmittingClaimRef.current = false;
          
          // ✅ تنظيف بعد النجاح
          claimDataRef.current = null;
          if (typeof window !== 'undefined') {
            delete window.labClaimData;
          }
          
          // إظهار رسالة نجاح
          setSnackbar({
            open: true,
            message: t("labResultAndClaimSubmittedSuccess", language),
            severity: "success",
            icon: <CheckCircleIcon fontSize="inherit" />,
          });
        } catch (claimErr) {
          console.error("❌ Error submitting claim:", claimErr);
          
          // ✅ إعادة تعيين flag بعد الفشل
          isSubmittingClaimRef.current = false;
          
          // إظهار رسالة خطأ واضحة (لكن الـ upload نجح)
          setSnackbar({
            open: true,
            message: `${t("uploadSucceededButClaimFailed", language)}: ${claimErr.response?.data?.message || claimErr.message || t("unknownError", language)}`,
            severity: "warning",
            icon: <ErrorIcon fontSize="inherit" />,
          });
        }
      } else {
        if (!onSubmitClaim) {
          console.error("❌ ERROR: onSubmitClaim callback not provided!");
        } else if (!fileToSubmit) {
          console.error("❌ ERROR: Upload file is missing!");
        } else if (!claimDataToUse) {
          console.error("❌ ERROR: Claim data is missing!");
        }
        
        setSnackbar({
          open: true,
          message: t("uploadSucceededButClaimFailedMissingData", language),
          severity: "warning",
          icon: <ErrorIcon fontSize="inherit" />,
        });
      }
    } catch (err) {
      // ✅ إعادة تعيين flag عند حدوث خطأ
      isSubmittingClaimRef.current = false;
      
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("failedToUploadResult", language),
        severity: "error",
        icon: <ErrorIcon fontSize="inherit" />,
      });
    } finally {
      setUploading(false);
      // ✅ التأكد من إعادة تعيين flag في finally (في حالة الخطأ)
      if (isSubmittingClaimRef.current) {
        isSubmittingClaimRef.current = false;
      }
    }
  };

  // ✅ Fetch Employee IDs for all unique patients when requests load
  // NOTE: This hook must be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    const fetchEmployeeIdsForPatients = async () => {
      if (!requests || requests.length === 0) {
        console.log("No requests to process for employee IDs");
        return;
      }

      console.log("🔄 Processing", requests.length, "requests for employee IDs");
      
      // First, check if any requests already have employee ID in data
      const requestsWithEmployeeId = requests.filter(req => req.memberEmployeeId || req.employeeId);
      console.log("📋 Requests with employee ID in data:", requestsWithEmployeeId.length);
      
      // Build map from data that already has employee ID
      const mapFromData = {};
      requestsWithEmployeeId.forEach(req => {
        if (req.memberName && (req.memberEmployeeId || req.employeeId)) {
          const name = req.memberName.toLowerCase();
          const employeeId = req.memberEmployeeId || req.employeeId;
          mapFromData[name] = employeeId;
        }
      });
      
      if (Object.keys(mapFromData).length > 0) {
        console.log("✅ Found employee IDs in data:", mapFromData);
        setNameToEmployeeIdMap(prev => ({ ...prev, ...mapFromData }));
      }

      // Get unique patient names (that don't already have employee ID in data)
      const uniquePatients = Array.from(
        new Set(
          requests
            .filter(req => req.memberName && !req.memberEmployeeId && !req.employeeId)
            .map(req => ({
              name: req.memberName?.toLowerCase(),
              memberId: req.memberId,
              originalName: req.memberName // Keep original for matching
            }))
            .filter(p => p.name && p.memberId)
        )
      );

      console.log("Unique patients to fetch from API:", uniquePatients.length, uniquePatients);

      if (uniquePatients.length === 0) {
        console.log("✅ All patients already have employee IDs from data");
        return;
      }

      // Use /api/clients/search/name/{fullName} to get employee IDs
      // Note: /api/clients/list is only accessible to INSURANCE_MANAGER, so we use search endpoint
      try {
        console.log("🔄 Using /api/clients/search/name/{fullName} endpoint for employee IDs...");

        const searchPromises = uniquePatients.slice(0, 20).map(async (patient) => {
          try {
            // api.get() returns data directly
            const response = await api.get(
              API_ENDPOINTS.CLIENTS.SEARCH_BY_NAME(encodeURIComponent(patient.originalName))
            );

            // api.get() returns data directly, not wrapped in .data
            if (response && response.employeeId) {
              return { name: patient.name, employeeId: response.employeeId };
            }
          } catch (e) {
            // Ignore individual errors (404, 403, etc.)
            console.log(`Could not find employee ID for ${patient.originalName}:`, e.response?.status);
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
          console.log("✅ Found employee IDs using name search:", newMap);
          setNameToEmployeeIdMap(prev => ({ ...prev, ...newMap }));
        } else {
          console.log("⚠️ No employee IDs found using name search. Employee IDs will only appear after search.");
        }
      } catch (searchErr) {
        console.error("❌ Could not use name search endpoint:", searchErr.response?.status, searchErr.message);
        console.log("⚠️ Employee IDs will only appear after search.");
      }
    };

    fetchEmployeeIdsForPatients();
  }, [requests]);

  // Early return for loading state - must be after all hooks
  if (!Array.isArray(requests)) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" fontWeight="bold" color="text.secondary">
          {t("loading", language)}
        </Typography>
      </Box>
    );
  }

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

  // ✅ Sorting and filtering - Only show PENDING requests
  const activeRequests = requests.filter(
    (r) => {
      const status = r.status?.toLowerCase();
      // Only show PENDING requests on this page
      return status === "pending";
    }
  );

  const sortedRequests = [...activeRequests].sort(
    (a, b) => {
      // Sort by status priority first (pending first), then by date (newest first)
      const statusPriority = { pending: 0, in_progress: 1, completed: 2, rejected: 3 };
      const aStatus = a.status?.toLowerCase() || "pending";
      const bStatus = b.status?.toLowerCase() || "pending";
      const priorityDiff = (statusPriority[aStatus] ?? 4) - (statusPriority[bStatus] ?? 4);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  );

  // First filter by search term
  const searchFilteredRequests = sortedRequests.filter(
    (r) => {
      // Filter by search term: full name, employee ID, and insurance number
      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase();

      // Search by patient name (main client)
      const matchesName = r.memberName?.toLowerCase().includes(searchLower);

      // Search by Employee ID (main client)
      const matchesEmployeeId = r.employeeId?.toLowerCase().includes(searchLower);

      // Search by family member info if exists
      const familyMemberInfo = getFamilyMemberInfo(r);
      const matchesFamilyMemberName = familyMemberInfo?.name?.toLowerCase().includes(searchLower);
      const matchesFamilyMemberInsuranceNumber = familyMemberInfo?.insuranceNumber?.toLowerCase().includes(searchLower);

      return matchesName || matchesEmployeeId || matchesFamilyMemberName || matchesFamilyMemberInsuranceNumber;
    }
  );

  // Extract unique family members from filtered requests
  const getUniqueFamilyMembers = () => {
    const mainClientName = searchFilteredRequests.length > 0 ? searchFilteredRequests[0].memberName : null;
    const familyMembers = new Map();

    searchFilteredRequests.forEach(r => {
      const familyInfo = getFamilyMemberInfo(r);
      if (familyInfo && familyInfo.name) {
        // Add family member with their relation
        familyMembers.set(familyInfo.name, familyInfo.relation || "Family");
      }
    });

    return { mainClientName, familyMembers: Array.from(familyMembers.entries()) };
  };

  const { mainClientName, familyMembers } = getUniqueFamilyMembers();
  const hasFamilyMembers = familyMembers.length > 0 && searchTerm.trim();

  // Apply family member filter
  const filteredRequests = searchFilteredRequests.filter((r) => {
    if (familyMemberFilter === "all") return true;

    const familyInfo = getFamilyMemberInfo(r);
    const isFamilyMemberRequest = familyInfo !== null;

    if (familyMemberFilter === "main") {
      // Show only main client requests (not family members)
      return !isFamilyMemberRequest;
    } else {
      // Show only specific family member requests
      return isFamilyMemberRequest && familyInfo?.name === familyMemberFilter;
    }
  });

  if (requests.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <ScienceIcon sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" color="text.secondary">
          {t("noLabRequestsFound", language)}
        </Typography>
      </Box>
    );
  }

  const _pendingCount = activeRequests.length; // All are PENDING

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
                {t("labRequestsList", language)}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {t("viewTrackLabRequests", language)}
              </Typography>
            </Box>
          </Stack>

          {/* Stats Summary */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  p: 2,
                  borderRadius: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="h4" fontWeight="700">
                  {activeRequests.length}
                </Typography>
                <Typography variant="body2">{t("totalRequests", language)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Search Section - No Filter (like PrescriptionList) */}
        <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0", mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              {/* Search Bar - Only by patient name and employee ID */}
              <TextField
                placeholder={t("searchByTestDoctorLabTech", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  // If Enter is pressed and search term looks like employee ID, lookup
                  if (e.key === 'Enter') {
                    const trimmedSearch = searchTerm.trim();
                    const looksLikeEmployeeId = /^[A-Za-z0-9]{3,}$/.test(trimmedSearch);
                    if (looksLikeEmployeeId) {
                      handleEmployeeIdLookup(trimmedSearch);
                    }
                  }
                }}
                onBlur={() => {
                  // When user leaves the field, if search term looks like employee ID, lookup
                  const trimmedSearch = searchTerm.trim();
                  const looksLikeEmployeeId = /^[A-Za-z0-9]{3,}$/.test(trimmedSearch);
                  if (looksLikeEmployeeId) {
                    handleEmployeeIdLookup(trimmedSearch);
                  }
                }}
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
            </Stack>
          </CardContent>
        </Card>

        {/* Family Member Filter - Only show if there are family members in the results */}
        {hasFamilyMembers && (
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

        {/* Results Count */}
        <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
          {filteredRequests.length === 0 && activeRequests.length > 0
            ? `${t("noLabRequestsFound", language)}`
            : `${t("showing", language)} ${filteredRequests.length} ${t("labRequests", language)}`}
        </Typography>

        {/* Grid of Cards - 3 columns */}
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
          {filteredRequests.map((req, index) => {
            const status = getStatusStyle(req.status);
            const familyMemberInfo = getFamilyMemberInfo(req);
            const patientEmployeeId = req.memberEmployeeId || req.employeeId || nameToEmployeeIdMap[req.memberName?.toLowerCase()];
            const universityCardImage = req.universityCardImage || 
                          (req.universityCardImages && req.universityCardImages.length > 0 ? req.universityCardImages[0] : null);
            
            let displayAge = req.memberAge || null;
            let displayGender = req.memberGender || null;
            
            if (displayAge && typeof displayAge === 'number') {
              displayAge = `${displayAge} years`;
            }
            
            if (displayAge && typeof displayAge === 'string') {
              displayAge = displayAge.replace(/\s+/g, ' ').trim();
              if (!displayAge.includes('year')) {
                const ageNum = parseInt(displayAge);
                if (!isNaN(ageNum)) {
                  displayAge = `${ageNum} years`;
                }
              }
            }

            return (
              <LabRequestCard
                key={req.id}
                request={req}
                index={index}
                status={status}
                familyMemberInfo={familyMemberInfo}
                patientEmployeeId={patientEmployeeId}
                displayAge={displayAge}
                displayGender={displayGender}
                formatDate={formatDate}
                onOpenUploadDialog={handleOpenUploadDialog}
              />
            );
          })}
        </Box>

        {/* No Results Message */}
        {filteredRequests.length === 0 && searchTerm && (
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
              {t("noLabRequestsFound", language)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("tryAdjustingSearch", language)}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Dialogs */}
      <LabRequestDialogs
        uploadDialog={uploadDialog}
        imageDialog={imageDialog}
        snackbar={snackbar}
        uploadFile={uploadFile}
        uploading={uploading}
        enteredPrice={enteredPrice}
        onUploadDialogClose={() => {
          setUploadDialog({ open: false, request: null });
          setEnteredPrice("");
        }}
        onImageDialogClose={() => setImageDialog({ open: false, imageUrl: null })}
        onSnackbarClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        onFileChange={handleFileChange}
        onPriceChange={(e) => setEnteredPrice(e.target.value)}
        onUploadSubmit={handleUploadSubmit}
      />
    </Box>
  );
};

export default LabRequestList;
