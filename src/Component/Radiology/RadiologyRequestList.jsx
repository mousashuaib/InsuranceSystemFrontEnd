// src/Component/Radiology/RadiologyRequestList.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Button,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PersonIcon from "@mui/icons-material/Person";
import { api, getToken } from "../../utils/apiService";
import { API_ENDPOINTS } from "../../config/api";
import RadiologyRequestCard from "./RadiologyRequestCard";
import RadiologyRequestDialogs from "./RadiologyRequestDialogs";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

const RadiologyRequestList = ({ requests, userInfo, onSetClaimData, onSubmitClaim, onUploaded }) => {
  const { language, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [, setEmployeeIdToNameMap] = useState({});
  const [nameToEmployeeIdMap, setNameToEmployeeIdMap] = useState({}); // Map patient names to employee IDs
  const [clientInfoMap, setClientInfoMap] = useState({}); // Map member names to client info (age, gender)
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Calculate age from date of birth
  const calculateAgeFromDOB = (dateOfBirth) => {
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
          icon: "⏳",
        };
      case "in_progress":
        return {
          color: "info",
          label: t("inProgress", language),
          icon: "🔄",
        };
      case "completed":
        return {
          color: "success",
          label: t("completed", language),
          icon: "✅",
        };
      case "rejected":
        return {
          color: "error",
          label: t("rejected", language),
          icon: "❌",
        };
      default:
        return {
          color: "default",
          label: t("unknown", language),
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

  const handleImageClick = (imageUrl) => {
    setImageDialog({ open: true, imageUrl });
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
    formData.append("testName", uploadDialog.request.testName || "");

    try {
      setUploading(true);
      const response = await api.patch(
        API_ENDPOINTS.RADIOLOGY.UPLOAD_RESULT(uploadDialog.request.id),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ✅ استخدام approvedPrice من response (الأقل بين enteredPrice و unionPrice)
      const responseData = response.data;
      const enteredPriceNum = parseFloat(enteredPrice) || 0;
      const approvedPrice = responseData?.approvedPrice || enteredPriceNum; // ✅ السعر المعتمد من Backend
      const finalAmount = approvedPrice; // ✅ نستخدم approvedPrice (الأقل)
      
      console.log("💰 Price Comparison:", {
        enteredPrice: enteredPriceNum,
        approvedPrice: approvedPrice,
        finalAmount: finalAmount
      });
      
      // ✅ التحقق من وجود memberId قبل المتابعة
      if (!uploadDialog.request?.memberId) {
        console.error("❌ ERROR: memberId is missing from request!");
        console.error("❌ Full request object:", uploadDialog.request);
        setSnackbar({
          open: true,
          message: t("errorPatientIdMissing", language),
          severity: "error",
        });
        setUploading(false);
        return;
      }
      
    
      
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
      console.log("🔍 Radiology Request - Diagnosis:", diagnosis);
      console.log("🔍 Radiology Request - Treatment:", treatment);
      console.log("🔍 Request Notes:", uploadDialog.request.notes);
      console.log("🔍 Full Request Object:", uploadDialog.request);
      
      // ✅ Determine the correct clientId: use familyMemberId if radiology request is for a family member
      let clientIdToUse = uploadDialog.request.memberId; // Default to main client ID
      let memberNameToUse = uploadDialog.request.memberName || "";
      
      if (uploadDialog.request.isFamilyMember === true && uploadDialog.request.familyMemberId) {
        // Radiology request is for a family member - use family member ID
        clientIdToUse = uploadDialog.request.familyMemberId;
        memberNameToUse = uploadDialog.request.familyMemberName || uploadDialog.request.memberName || "";
        console.log("✅ Using family member ID for radiology claim:", clientIdToUse, "Name:", memberNameToUse);
      } else {
        console.log("✅ Using main client ID for radiology claim:", clientIdToUse, "Name:", memberNameToUse);
      }
      
      const claimData = {
        clientId: clientIdToUse, // ✅ Now correctly uses family member ID if applicable
        memberName: memberNameToUse, // ✅ Use family member name if applicable
        description: `Radiology examination completed - ${uploadDialog.request.testName || "Radiology Result"}`,
        amount: finalAmount,
        serviceDate: new Date().toISOString().split('T')[0],
        diagnosis: diagnosis, // ✅ Send diagnosis to medical admin
        treatmentDetails: treatment, // ✅ Send treatment to medical admin
        roleSpecificData: JSON.stringify({
          testId: uploadDialog.request.id,
          testName: uploadDialog.request.testName,
          patientName: uploadDialog.request.memberName,
          enteredPrice: enteredPriceNum,
          approvedPrice: approvedPrice, // ✅ السعر المعتمد (الأقل)
          finalPrice: finalAmount, // ✅ نفس approvedPrice
          diagnosis: diagnosis, // ✅ Include diagnosis in roleSpecificData
          treatment: treatment, // ✅ Include treatment in roleSpecificData
          notes: `Examination performed by ${userInfo?.fullName || "Radiologist"}`
        }),
        _uploadId: uploadId
      };
      
     
      
      // ✅ تحديث state قبل أي شيء
      if (onSetClaimData) {
        onSetClaimData(JSON.parse(JSON.stringify(claimData)));
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ حفظ الـ claim data في useRef
      claimDataRef.current = JSON.parse(JSON.stringify(claimData));
      
      // ✅ حفظ في window
      if (typeof window !== 'undefined') {
        window.radiologyClaimData = JSON.parse(JSON.stringify(claimData));
      }

      // حفظ الملف قبل إعادة التعيين
      const fileToSubmit = uploadFile;
      const claimDataToUse = JSON.parse(JSON.stringify(claimData));
      
      onUploaded?.(response.data);
      
      // ✅ تأخير بسيط للتأكد من تحديث state قبل الاستدعاء
      await new Promise(resolve => setTimeout(resolve, 100));
      
      
      
      // ✅ منع الاستدعاء المزدوج
      if (isSubmittingClaimRef.current) {

        setSnackbar({
          open: true,
          message: t("radiologyResultUploadedSuccessfully", language),
          severity: "success",
        });
        return;
      }
      
      setUploadDialog({ open: false, request: null });
      setUploadFile(null);
      setEnteredPrice("");
      
    
      
      if (onSubmitClaim && fileToSubmit && claimDataToUse && claimDataToUse.clientId) {
    
        isSubmittingClaimRef.current = true;
        
        const claimDataCopy = JSON.parse(JSON.stringify(claimDataToUse));
        
        // ✅ حفظ claimData في window قبل الاستدعاء
        if (typeof window !== 'undefined') {
          window.radiologyClaimData = JSON.parse(JSON.stringify(claimDataCopy));
        }
        
        // ✅ تحديث state قبل الاستدعاء
        if (onSetClaimData) {
          onSetClaimData(JSON.parse(JSON.stringify(claimDataCopy)));
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // ✅ إرسال الـ claim تلقائياً مع الملف كـ document
        try {
        
          await onSubmitClaim(fileToSubmit, claimDataCopy);
          
       
          
          isSubmittingClaimRef.current = false;
          claimDataRef.current = null;
          
          if (typeof window !== 'undefined') {
            delete window.radiologyClaimData;
          }
          
          // ✅ إظهار رسالة نجاح شاملة (الرفع وإنشاء الـ claim)
          setSnackbar({
            open: true,
            message: t("radiologyResultAndClaimSubmittedSuccessfully", language),
            severity: "success",
            icon: <CheckCircleIcon fontSize="inherit" />,
          });
        } catch (claimErr) {
          isSubmittingClaimRef.current = false;
          
          setSnackbar({
            open: true,
            message: `${t("radiologyResultUploadedSuccessfully", language)}, ${t("butFailedToCreateClaim", language)}: ${claimErr.response?.data?.message || claimErr.message || t("unknownError", language)}`,
            severity: "warning",
            icon: <ErrorIcon fontSize="inherit" />,
          });
        }
      } else {
        
        if (!onSubmitClaim) {
          console.error("❌ onSubmitClaim callback not provided!");
          setSnackbar({
            open: true,
            message: `${t("radiologyResultUploadedSuccessfully", language)}, ${t("butClaimSubmissionFailed", language)}`,
            severity: "warning",
          });
        } else if (!fileToSubmit) {
          console.error("❌ fileToSubmit is missing!");
          setSnackbar({
            open: true,
            message: `${t("radiologyResultUploadedSuccessfully", language)}, ${t("butClaimSubmissionFailedFileMissing", language)}`,
            severity: "warning",
          });
        } else if (!claimDataToUse || !claimDataToUse.clientId) {
          console.error("❌ claimDataToUse is missing or invalid!");
          console.error("  - claimDataToUse:", claimDataToUse);
          console.error("  - claimDataToUse?.clientId:", claimDataToUse?.clientId);
          setSnackbar({
            open: true,
            message: `${t("radiologyResultUploadedSuccessfully", language)}, ${t("butClaimSubmissionFailedDataMissing", language)}`,
            severity: "warning",
          });
        }
      }
    } catch (err) {
      isSubmittingClaimRef.current = false;
      
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("failedToUploadResult", language),
        severity: "error",
        icon: <ErrorIcon fontSize="inherit" />,
      });
    } finally {
      setUploading(false);
      if (isSubmittingClaimRef.current) {
        isSubmittingClaimRef.current = false;
      }
    }
  };

  // ✅ Fetch Client Information (age, gender) for main clients using employee ID endpoint
  // NOTE: These hooks must be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    const fetchClientInfo = async () => {
      const token = getToken();
      if (!requests || requests.length === 0 || !token) {
        return;
      }

      // Get unique employee IDs for main clients (from requests or from the nameToEmployeeIdMap)
      const employeeIdToNameMap = {};
      const uniqueEmployeeIds = new Set();
      
      requests
        .filter(req => req.memberName && !req.isFamilyMember) // Only main clients
        .forEach(req => {
          // Try to get employee ID from request data first, then from map
          const employeeId = req.memberEmployeeId || req.employeeId || nameToEmployeeIdMap[req.memberName?.toLowerCase()];
          if (employeeId) {
            uniqueEmployeeIds.add(employeeId);
            employeeIdToNameMap[employeeId] = req.memberName;
          }
        });

      if (uniqueEmployeeIds.size === 0) {
        console.log("⚠️ No employee IDs found to fetch client info");
        return;
      }

      console.log("🔄 Fetching client info (age, gender) for", uniqueEmployeeIds.size, "main clients by employee ID");

      // Fetch all client info in parallel and update state as each completes
      Array.from(uniqueEmployeeIds).forEach(async (employeeId) => {
        try {
          const response = await api.get(
            API_ENDPOINTS.CLIENTS.SEARCH_BY_EMPLOYEE_ID(encodeURIComponent(employeeId))
          );
          
          if (response.data) {
            const memberName = employeeIdToNameMap[employeeId];
            if (!memberName) return;
            
            // Calculate age from dateOfBirth if available
            // Note: endpoint returns "dateofbirth" (lowercase) not "dateOfBirth"
            const dateOfBirth = response.data.dateofbirth || response.data.dateOfBirth;
            let age = null;
            if (dateOfBirth) {
              age = calculateAgeFromDOB(dateOfBirth);
            }
            
            const info = {
              age: age,
              gender: response.data.gender || null,
              dateOfBirth: dateOfBirth || null,
            };
            
            console.log("✅ Fetched client info for", memberName, "(Employee ID:", employeeId, "):", info);
            
            // Update state immediately when each request completes (incremental updates)
            setClientInfoMap(prev => ({
              ...prev,
              [memberName]: info
            }));
          }
        } catch (err) {
          const memberName = employeeIdToNameMap[employeeId];
          console.warn("⚠️ Could not fetch client info for employee ID", employeeId, ":", err.response?.data?.error || err.message);
          if (memberName) {
            // Still update state with null values so we don't retry
            setClientInfoMap(prev => ({
              ...prev,
              [memberName]: { age: null, gender: null }
            }));
          }
        }
      });
    };

    // Run immediately, no delay - fetch as soon as we have employee IDs
    fetchClientInfo();
  }, [requests, nameToEmployeeIdMap]);

  // ✅ Fetch Employee IDs for all unique patients when requests load
  useEffect(() => {
    const fetchEmployeeIdsForPatients = async () => {
      const token = getToken();
      if (!requests || requests.length === 0 || !token) {
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

      // Try to get all clients list first, then match by memberId
      try {
        console.log("Fetching clients list...");
        const clientsResponse = await api.get(API_ENDPOINTS.CLIENTS.LIST);

        console.log("Clients response:", clientsResponse.data?.length, "clients");

        if (clientsResponse.data && Array.isArray(clientsResponse.data)) {
          const clientsMap = new Map();
          clientsResponse.data.forEach(client => {
            if (client.id && client.employeeId) {
              clientsMap.set(client.id, client.employeeId);
            }
          });

          console.log("Clients map size:", clientsMap.size);

          // Map patient names to employee IDs
          const newMap = {};
          uniquePatients.forEach(patient => {
            const employeeId = clientsMap.get(patient.memberId);
            console.log(`Patient: ${patient.originalName}, memberId: ${patient.memberId}, employeeId: ${employeeId}`);
            if (employeeId && patient.name) {
              newMap[patient.name] = employeeId;
            }
          });

          console.log("New employee ID map:", newMap);

          if (Object.keys(newMap).length > 0) {
            setNameToEmployeeIdMap(prev => {
              const updated = { ...prev, ...newMap };
              console.log("Updated nameToEmployeeIdMap:", updated);
              return updated;
            });
          } else {
            console.log("No employee IDs found to map");
          }
        }
      } catch (err) {
        // Log error for debugging
        console.error("❌ Could not fetch clients list for employee IDs:", err.response?.status, err.message);
        console.log("⚠️ Endpoint /api/clients/list is not authorized.");
        console.log("💡 Employee IDs should come from backend DTO (employeeId field). If not present, they will only appear after search.");
        // Note: Employee IDs should be included in the response from backend DTO
        // If they're not present, they will only appear after user searches
      }
    };

    // Only fetch if we have requests
    if (requests && requests.length > 0) {
      console.log("🚀 Starting to fetch employee IDs...");
      fetchEmployeeIdsForPatients();
    } else {
      console.log("⏸️ Skipping fetch - no requests");
    }
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

  // ✅ Sorting and filtering - Show only PENDING (hide COMPLETED)
  // Filter out COMPLETED, REJECTED and other statuses
  const activeRequests = requests.filter(
    (r) => {
      const status = r.status?.toLowerCase();
      // Show only PENDING - hide COMPLETED requests
      return status === "pending";
    }
  );

  const sortedRequests = [...activeRequests].sort(
    (a, b) => {
      // Sort by date (newest first) - all are PENDING
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  );

  // First filter by search term - only show results after searching
  const hasSearchTerm = searchTerm.trim().length > 0;
  const searchFilteredRequests = sortedRequests.filter(
    (r) => {
      // Only show results when user has entered a search term
      if (!hasSearchTerm) return false;

      const searchLower = searchTerm.toLowerCase();

      // Search by patient name (main client)
      const matchesName = r.memberName?.toLowerCase().includes(searchLower);

      // Search by Employee ID (main client)
      const matchesEmployeeId = r.employeeId?.toLowerCase().includes(searchLower);

      // Search by National ID (main client)
      const matchesNationalId = r.memberNationalId?.toLowerCase().includes(searchLower);

      // Search by family member info if exists
      const familyInfo = getFamilyMemberInfo(r);
      const matchesFamilyMemberName = familyInfo?.name?.toLowerCase().includes(searchLower);
      const matchesFamilyMemberInsuranceNumber = familyInfo?.insuranceNumber?.toLowerCase().includes(searchLower);
      const matchesFamilyMemberNationalId = familyInfo?.nationalId?.toLowerCase().includes(searchLower);

      return matchesName || matchesEmployeeId || matchesNationalId || matchesFamilyMemberName || matchesFamilyMemberInsuranceNumber || matchesFamilyMemberNationalId;
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
        <LocalHospitalIcon sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" color="text.secondary">
          {t("noRadiologyRequestsFound", language)}
        </Typography>
      </Box>
    );
  }

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
                bgcolor: "#556B2F",
                width: 56,
                height: 56,
              }}
            >
              <LocalHospitalIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
                {t("radiologyRequests", language)}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {t("radiologyRequestList", language)}
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

        {/* Search Section - No Filter (like LabRequestList) */}
        <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E8EDE0", mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              {/* Search Bar - Only by patient name and employee ID */}
              <TextField
                placeholder={t("searchByEmployeeIdOrNationalId", language)}
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

        {/* Prompt to search - shown when no search term entered */}
        {!hasSearchTerm && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 3,
              border: "2px dashed #E8EDE0",
              bgcolor: "#fafaf5",
              mb: 4,
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: "#556B2F", mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="#556B2F" fontWeight={600} gutterBottom>
              {t("enterIdToSearch", language)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("searchToViewLabRequests", language)}
            </Typography>
          </Paper>
        )}

        {/* Results Count - only show when searching */}
        {hasSearchTerm && (
          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            {filteredRequests.length === 0
              ? `${t("noRadiologyRequestsFound", language)}`
              : `${t("showing", language)} ${filteredRequests.length} ${t("radiologyRequests", language)}`}
          </Typography>
        )}

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
            const patientEmployeeId = nameToEmployeeIdMap[req.memberName] || null;
            const universityCardImage = req.universityCardImage || 
                          (req.universityCardImages && req.universityCardImages.length > 0 ? req.universityCardImages[0] : null);
            const displayAge = clientInfoMap[req.memberName]?.age || calculateAgeFromDOB(req.dateOfBirth) || null;
            const displayGender = clientInfoMap[req.memberName]?.gender || null;

            return (
              <RadiologyRequestCard
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
              {t("noRadiologyRequestsFound", language)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("tryAdjustingSearch", language)}
            </Typography>
          </Paper>
        )}
      </Box>

      <RadiologyRequestDialogs
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
        onFileChange={handleFileChange}
        onPriceChange={(e) => setEnteredPrice(e.target.value)}
        onUploadConfirm={handleUploadSubmit}
        onImageDialogClose={() => setImageDialog({ open: false, imageUrl: null })}
        onSnackbarClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};


export default RadiologyRequestList;
