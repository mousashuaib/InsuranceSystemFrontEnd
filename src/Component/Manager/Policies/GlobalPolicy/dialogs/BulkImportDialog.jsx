import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";

const BulkImportDialog = ({ open, onClose, policyId, categories, onImported }) => {
  const { language } = useLanguage();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState("");

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split("\n").filter(line => line.trim());

        if (lines.length < 2) {
          setErrors([language === "ar" ? "الملف فارغ أو لا يحتوي على بيانات" : "File is empty or has no data"]);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const requiredHeaders = ["servicename", "price"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setErrors([`${language === "ar" ? "أعمدة مطلوبة مفقودة:" : "Missing required columns:"} ${missingHeaders.join(", ")}`]);
          return;
        }

        const data = [];
        const parseErrors = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row = {};

          headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || "";
          });

          // Validate row
          if (!row.servicename) {
            parseErrors.push(`${language === "ar" ? "صف" : "Row"} ${i + 1}: ${language === "ar" ? "اسم الخدمة مطلوب" : "Service name is required"}`);
            continue;
          }

          const price = parseFloat(row.price);
          if (isNaN(price) || price <= 0) {
            parseErrors.push(`${language === "ar" ? "صف" : "Row"} ${i + 1}: ${language === "ar" ? "السعر غير صالح" : "Invalid price"}`);
            continue;
          }

          // Map to service object
          data.push({
            serviceName: row.servicename,
            medicalName: row.medicalname || "",
            description: row.description || "",
            standardPrice: price,
            coveragePercent: parseFloat(row.coveragepercent) || 100,
            coverageStatus: row.coveragestatus?.toUpperCase() || "COVERED",
            maxCoverageAmount: parseFloat(row.maxcoverage) || null,
            minAge: parseInt(row.minage) || null,
            maxAge: parseInt(row.maxage) || null,
            allowedGender: row.gender?.toUpperCase() || "ALL",
            frequencyLimit: parseInt(row.frequencylimit) || null,
            frequencyPeriod: row.frequencyperiod?.toUpperCase() || null,
            requiresReferral: row.requiresreferral?.toLowerCase() === "true",
            isActive: row.active?.toLowerCase() !== "false",
            categoryName: row.category || "",
          });
        }

        setParsedData(data);
        setErrors(parseErrors);
        setImportResult(null);
      } catch (err) {
        setErrors([language === "ar" ? "فشل قراءة الملف" : "Failed to parse file"]);
      }
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Map category names to IDs
      const servicesWithCategories = parsedData.map(service => {
        let categoryId = defaultCategoryId || null;

        if (service.categoryName) {
          const matchedCategory = categories.find(
            c => c.name.toLowerCase() === service.categoryName.toLowerCase()
          );
          if (matchedCategory) {
            categoryId = matchedCategory.id;
          }
        }

        return {
          policyId,
          serviceName: service.serviceName,
          medicalName: service.medicalName,
          description: service.description,
          standardPrice: service.standardPrice,
          coveragePercent: service.coveragePercent,
          coverageStatus: service.coverageStatus,
          maxCoverageAmount: service.maxCoverageAmount,
          minAge: service.minAge,
          maxAge: service.maxAge,
          allowedGender: service.allowedGender,
          frequencyLimit: service.frequencyLimit,
          frequencyPeriod: service.frequencyPeriod,
          requiresReferral: service.requiresReferral,
          isActive: service.isActive,
          categoryId,
        };
      });

      const result = await api.post(`/api/policy/services/bulk?policyId=${policyId}`, servicesWithCategories);

      setImportProgress(100);
      setImportResult({
        success: true,
        count: result.length,
      });

      setTimeout(() => {
        onImported();
      }, 1500);
    } catch (err) {
      console.error("Import failed:", err);
      setImportResult({
        success: false,
        error: err.message || (language === "ar" ? "فشل الاستيراد" : "Import failed"),
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `serviceName,medicalName,description,price,coveragePercent,coverageStatus,maxCoverage,minAge,maxAge,gender,frequencyLimit,frequencyPeriod,requiresReferral,active,category
General Checkup,Physical Examination,Annual health checkup,150,100,COVERED,,18,65,ALL,1,YEARLY,false,true,General
Blood Test,CBC,Complete blood count,80,80,PARTIAL,100,,,ALL,4,YEARLY,true,true,Laboratory
X-Ray,Radiography,Diagnostic imaging,200,70,PARTIAL,300,,,ALL,2,YEARLY,true,true,Radiology`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "services_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {language === "ar" ? "استيراد الخدمات من ملف" : "Import Services from File"}
      </DialogTitle>
      <DialogContent dividers>
        {/* Instructions */}
        <Alert severity="info" sx={{ mb: 2 }}>
          {language === "ar"
            ? "قم بتحميل ملف CSV يحتوي على الخدمات. الأعمدة المطلوبة: serviceName, price. الأعمدة الاختيارية: medicalName, description, coveragePercent, coverageStatus, maxCoverage, minAge, maxAge, gender, frequencyLimit, frequencyPeriod, requiresReferral, active, category"
            : "Upload a CSV file with services. Required columns: serviceName, price. Optional: medicalName, description, coveragePercent, coverageStatus, maxCoverage, minAge, maxAge, gender, frequencyLimit, frequencyPeriod, requiresReferral, active, category"}
        </Alert>

        {/* Upload Area */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
          >
            {language === "ar" ? "تحميل القالب" : "Download Template"}
          </Button>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            {language === "ar" ? "اختيار ملف CSV" : "Select CSV File"}
          </Button>

          {file && (
            <Chip
              label={file.name}
              onDelete={handleClear}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Default Category */}
        {parsedData.length > 0 && (
          <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
            <InputLabel>{language === "ar" ? "الفئة الافتراضية" : "Default Category"}</InputLabel>
            <Select
              value={defaultCategoryId}
              onChange={(e) => setDefaultCategoryId(e.target.value)}
              label={language === "ar" ? "الفئة الافتراضية" : "Default Category"}
            >
              <MenuItem value="">{language === "ar" ? "بدون فئة" : "No Category"}</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {language === "ar" ? "تحذيرات:" : "Warnings:"}
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {errors.length > 5 && (
                <li>{language === "ar" ? `و ${errors.length - 5} تحذيرات أخرى...` : `and ${errors.length - 5} more...`}</li>
              )}
            </ul>
          </Alert>
        )}

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ p: 1.5, backgroundColor: "#f5f5f5" }}>
              {language === "ar" ? `معاينة ${parsedData.length} خدمة` : `Preview ${parsedData.length} services`}
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>{language === "ar" ? "اسم الخدمة" : "Service Name"}</TableCell>
                    <TableCell>{language === "ar" ? "السعر" : "Price"}</TableCell>
                    <TableCell>{language === "ar" ? "التغطية" : "Coverage"}</TableCell>
                    <TableCell>{language === "ar" ? "الحالة" : "Status"}</TableCell>
                    <TableCell>{language === "ar" ? "الفئة" : "Category"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedData.slice(0, 20).map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {service.serviceName}
                        {service.medicalName && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {service.medicalName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>₪{service.standardPrice}</TableCell>
                      <TableCell>{service.coveragePercent}%</TableCell>
                      <TableCell>
                        <Chip
                          label={service.coverageStatus}
                          size="small"
                          color={
                            service.coverageStatus === "COVERED" ? "success" :
                            service.coverageStatus === "PARTIAL" ? "warning" : "error"
                          }
                        />
                      </TableCell>
                      <TableCell>{service.categoryName || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {parsedData.length > 20 && (
              <Typography variant="caption" sx={{ p: 1, display: "block", textAlign: "center" }}>
                {language === "ar" ? `عرض أول 20 من ${parsedData.length} خدمة` : `Showing first 20 of ${parsedData.length} services`}
              </Typography>
            )}
          </Paper>
        )}

        {/* Import Progress */}
        {importing && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={importProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {language === "ar" ? "جاري الاستيراد..." : "Importing..."}
            </Typography>
          </Box>
        )}

        {/* Import Result */}
        {importResult && (
          <Alert
            severity={importResult.success ? "success" : "error"}
            icon={importResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
          >
            {importResult.success
              ? (language === "ar"
                  ? `تم استيراد ${importResult.count} خدمة بنجاح!`
                  : `Successfully imported ${importResult.count} services!`)
              : importResult.error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {language === "ar" ? "إغلاق" : "Close"}
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={parsedData.length === 0 || importing || importResult?.success}
          startIcon={importing ? <CircularProgress size={16} /> : null}
        >
          {importing
            ? (language === "ar" ? "جاري الاستيراد..." : "Importing...")
            : (language === "ar" ? `استيراد ${parsedData.length} خدمة` : `Import ${parsedData.length} Services`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkImportDialog;
