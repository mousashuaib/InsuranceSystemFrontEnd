import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { api } from "../../../../../utils/apiService";
import { useLanguage } from "../../../../../context/LanguageContext";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {Icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            <Icon />
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);

const ReportsTab = ({ policy, showSnackbar }) => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [quickStats, setQuickStats] = useState(null);
  const [report, setReport] = useState(null);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const stats = await api.get("/api/policy/reports/quick-stats");
      setQuickStats(stats);
    } catch (err) {
      console.error("Failed to fetch quick stats:", err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/policy/reports/usage?fromDate=${fromDate}&toDate=${toDate}`);
      setReport(data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      showSnackbar(language === "ar" ? "فشل تحميل التقرير" : "Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const csvContent = [
      ["Policy Usage Report"],
      [`Policy: ${report.policyName} (${report.policyVersion})`],
      [`Period: ${fromDate} to ${toDate}`],
      [],
      ["Summary"],
      [`Total Claims,${report.totalClaims}`],
      [`Insurance Paid,${report.totalInsurancePaid}`],
      [`Unique Clients,${report.uniqueClients}`],
      [`Services Used,${report.servicesUsed}/${report.totalServicesInPolicy}`],
      [],
      ["Top Services"],
      ["Service Name", "Usage Count", "Insurance Paid"],
      ...(report.topServices || []).map((s) => [s.serviceName, s.usageCount, s.insurancePaid]),
      [],
      ["Top Clients"],
      ["Client Name", "Claims", "Total Spent"],
      ...(report.topClients || []).map((c) => [c.clientName, c.claimCount, c.totalSpent]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy_usage_report_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Quick Stats */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {language === "ar" ? "نظرة سريعة" : "Quick Overview"}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={language === "ar" ? "مطالبات هذا الشهر" : "Claims This Month"}
            value={quickStats?.monthClaims || 0}
            icon={ReceiptIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={language === "ar" ? "إنفاق هذا الشهر" : "Spending This Month"}
            value={`₪${quickStats?.monthSpending?.toLocaleString() || 0}`}
            icon={AccountBalanceIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={language === "ar" ? "مطالبات هذا العام" : "Claims This Year"}
            value={quickStats?.yearClaims || 0}
            icon={TrendingUpIcon}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={language === "ar" ? "إجمالي الخدمات" : "Total Services"}
            value={quickStats?.totalServices || 0}
            subtitle={quickStats?.policyName}
            icon={PeopleIcon}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Detailed Report */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          {language === "ar" ? "تقرير الاستخدام المفصل" : "Detailed Usage Report"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            type="date"
            size="small"
            label={language === "ar" ? "من تاريخ" : "From Date"}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label={language === "ar" ? "إلى تاريخ" : "To Date"}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={fetchReport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {language === "ar" ? "تحميل" : "Load"}
          </Button>
          {report && (
            <Button variant="outlined" onClick={exportReport} startIcon={<DownloadIcon />}>
              {language === "ar" ? "تصدير" : "Export"}
            </Button>
          )}
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {report && !loading && (
        <Grid container spacing={3}>
          {/* Summary Stats */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {language === "ar" ? "ملخص الفترة" : "Period Summary"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {language === "ar" ? "إجمالي المطالبات" : "Total Claims"}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {report.totalClaims}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {language === "ar" ? "التأمين دفع" : "Insurance Paid"}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    ₪{report.totalInsurancePaid?.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {language === "ar" ? "عملاء فريدون" : "Unique Clients"}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {report.uniqueClients}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {language === "ar" ? "الخدمات المستخدمة" : "Services Used"}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {report.servicesUsed}/{report.totalServicesInPolicy}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Top Services Chart */}
          {report.topServices && report.topServices.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {language === "ar" ? "أكثر الخدمات استخداماً" : "Top Services by Usage"}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.topServices.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="serviceName" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usageCount" fill="#1976d2" name={language === "ar" ? "الاستخدام" : "Usage"} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* Top Services Table */}
          {report.topServices && report.topServices.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {language === "ar" ? "تفاصيل الخدمات" : "Service Details"}
                </Typography>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>{language === "ar" ? "الخدمة" : "Service"}</TableCell>
                        <TableCell align="right">{language === "ar" ? "الاستخدام" : "Usage"}</TableCell>
                        <TableCell align="right">{language === "ar" ? "التأمين دفع" : "Ins. Paid"}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.topServices.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell>{service.serviceName}</TableCell>
                          <TableCell align="right">
                            <Chip label={service.usageCount} size="small" />
                          </TableCell>
                          <TableCell align="right">₪{service.insurancePaid?.toLocaleString() || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* Top Clients */}
          {report.topClients && report.topClients.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {language === "ar" ? "أعلى العملاء استخداماً" : "Top Clients by Usage"}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{language === "ar" ? "العميل" : "Client"}</TableCell>
                        <TableCell align="right">{language === "ar" ? "المطالبات" : "Claims"}</TableCell>
                        <TableCell align="right">{language === "ar" ? "المبلغ" : "Amount"}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.topClients.map((client, index) => (
                        <TableRow key={index}>
                          <TableCell>{client.clientName}</TableCell>
                          <TableCell align="right">
                            <Chip label={client.claimCount} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">₪{client.totalSpent?.toLocaleString() || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {!report && !loading && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {language === "ar"
              ? "حدد نطاق التاريخ واضغط تحميل لعرض التقرير"
              : "Select date range and click Load to view report"}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReportsTab;
