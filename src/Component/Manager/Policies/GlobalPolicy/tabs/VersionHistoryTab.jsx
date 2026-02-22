import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";

const VersionHistoryTab = ({ policy, showSnackbar }) => {
  const { language } = useLanguage();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (policy?.id) {
      fetchVersions();
    }
  }, [policy?.id]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/policy/versions?policyId=${policy.id}`);
      setVersions(res || []);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (version) => {
    setSelectedVersion(version);
    setDetailDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseSnapshot = (snapshot) => {
    try {
      return JSON.parse(snapshot);
    } catch {
      return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          {language === "ar" ? "سجل الإصدارات" : "Version History"}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : versions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <HistoryIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography color="text.secondary">
            {language === "ar" ? "لا يوجد سجل إصدارات بعد" : "No version history yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {language === "ar"
              ? "سيتم إنشاء نسخة عند تفعيل البوليصة"
              : "A snapshot will be created when the policy is activated"}
          </Typography>
        </Paper>
      ) : (
        <Timeline position="alternate">
          {versions.map((version, index) => (
            <TimelineItem key={version.id}>
              <TimelineSeparator>
                <TimelineDot color={index === 0 ? "primary" : "grey"}>
                  <HistoryIcon fontSize="small" />
                </TimelineDot>
                {index < versions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {version.version}
                    </Typography>
                    {index === 0 && (
                      <Chip
                        label={language === "ar" ? "الأحدث" : "Latest"}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(version.createdAt)}
                  </Typography>
                  {version.changedByName && (
                    <Typography variant="body2" color="text.secondary">
                      {language === "ar" ? "بواسطة:" : "By:"} {version.changedByName}
                    </Typography>
                  )}
                  {version.changeReason && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                      "{version.changeReason}"
                    </Typography>
                  )}
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewDetails(version)}
                    sx={{ mt: 1 }}
                  >
                    {language === "ar" ? "عرض التفاصيل" : "View Details"}
                  </Button>
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}

      {/* Version Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {language === "ar" ? "تفاصيل الإصدار" : "Version Details"} - {selectedVersion?.version}
        </DialogTitle>
        <DialogContent dividers>
          {selectedVersion && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                {formatDate(selectedVersion.createdAt)}
                {selectedVersion.changedByName && ` - ${selectedVersion.changedByName}`}
              </Typography>

              {selectedVersion.changeReason && (
                <Paper sx={{ p: 2, mb: 2, backgroundColor: "#f5f5f5" }}>
                  <Typography variant="body2">
                    <strong>{language === "ar" ? "السبب:" : "Reason:"}</strong> {selectedVersion.changeReason}
                  </Typography>
                </Paper>
              )}

              {selectedVersion.snapshot && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {language === "ar" ? "لقطة البوليصة:" : "Policy Snapshot:"}
                  </Typography>
                  <Paper sx={{ p: 2, maxHeight: 400, overflow: "auto", backgroundColor: "#fafafa" }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "12px" }}>
                      {JSON.stringify(parseSnapshot(selectedVersion.snapshot), null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            {language === "ar" ? "إغلاق" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VersionHistoryTab;
