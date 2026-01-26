import React, { useState, useEffect, memo } from "react";
import {
  Box,
  Typography,
  Container,
  CssBaseline,
  Button,
  Grid,
  Paper,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SignIn from "../Auth/SignIn.jsx";
import SignUp from "../Auth/SignUp.jsx";
import ForgotPassword from "../Auth/ForgotPassword.jsx";
import VerifyEmail from "../Auth/VerifyEmail.jsx";
import LanguageToggle from "../Shared/LanguageToggle.jsx";
import birzeitLogo from "../../images/Birzeit Logo.png";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../config/translations";

// Icons
import SecurityIcon from "@mui/icons-material/Security";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import GroupsIcon from "@mui/icons-material/Groups";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SpeedIcon from "@mui/icons-material/Speed";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import SchoolIcon from "@mui/icons-material/School";

// Olive Green Theme Colors
const oliveTheme = {
  primary: "#556B2F",
  primaryLight: "#7B8B5E",
  primaryDark: "#3D4F23",
  secondary: "#8B9A46",
  accent: "#C9A646",
  background: "#FAF8F5",
  textPrimary: "#2E3B2D",
  textSecondary: "#5A6B5A",
  white: "#FFFFFF",
  cream: "#F5F3EF",
};

const LandingPage = memo(function LandingPage() {
  const [mode, setMode] = useState(localStorage.getItem("authMode") || "signin");
  const [pendingEmail, setPendingEmail] = useState("");
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const _isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { language } = useLanguage();

  useEffect(() => {
    localStorage.setItem("authMode", mode);
  }, [mode]);

  useEffect(() => {
    const savedMode = localStorage.getItem("authMode");
    if (savedMode) {
      setMode(savedMode);
    } else {
      setMode("signin");
    }
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Feature cards data
  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: { xs: 36, sm: 42, md: 48 }, color: oliveTheme.primary }} />,
      title: t("streamlinedClaims", language),
      description: t("streamlinedClaimsDesc", language),
    },
    {
      icon: <LocationOnIcon sx={{ fontSize: { xs: 36, sm: 42, md: 48 }, color: oliveTheme.primary }} />,
      title: t("providerNetwork", language),
      description: t("providerNetworkDesc", language),
    },
    {
      icon: <DescriptionIcon sx={{ fontSize: { xs: 36, sm: 42, md: 48 }, color: oliveTheme.primary }} />,
      title: t("comprehensiveCoverage", language),
      description: t("comprehensiveCoverageDesc", language),
    },
  ];

  // Trust indicators data
  const trustIndicators = [
    {
      icon: <LocalHospitalIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: oliveTheme.primary }} />,
      number: "500+",
      label: t("healthcareProviders", language),
    },
    {
      icon: <GroupsIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: oliveTheme.primary }} />,
      number: "10,000+",
      label: t("satisfiedMembers", language),
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: oliveTheme.primary }} />,
      number: "24/7",
      label: t("emergencySupport", language),
    },
    {
      icon: <SpeedIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: oliveTheme.primary }} />,
      number: t("fast", language),
      label: t("claimProcessing", language),
    },
  ];

  // How it works steps
  const steps = [
    {
      icon: <PersonAddIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, color: oliveTheme.white }} />,
      title: t("register", language),
      description: t("registerDesc", language),
    },
    {
      icon: <AccountCircleIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, color: oliveTheme.white }} />,
      title: t("completeProfile", language),
      description: t("completeProfileDesc", language),
    },
    {
      icon: <FamilyRestroomIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, color: oliveTheme.white }} />,
      title: t("addFamily", language),
      description: t("addFamilyDesc", language),
    },
    {
      icon: <VerifiedUserIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, color: oliveTheme.white }} />,
      title: t("startUsing", language),
      description: t("startUsingDesc", language),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: oliveTheme.background,
      }}
    >
      <CssBaseline />

      {/* ==================== HERO SECTION ==================== */}
      <Box
        id="hero"
        sx={{
          background: `linear-gradient(135deg, ${oliveTheme.primaryDark} 0%, ${oliveTheme.primary} 50%, ${oliveTheme.primaryLight} 100%)`,
          minHeight: { xs: "auto", md: "100vh" },
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Navigation Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, md: 6 },
            py: 2,
            backgroundColor: "#1E2D14",
            borderBottom: `1px solid rgba(255,255,255,0.1)`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
            }}
            onClick={() => scrollToSection("hero")}
          >
            <Box
              component="img"
              src={birzeitLogo}
              alt="Birzeit Logo"
              sx={{
                width: { xs: 40, md: 50 },
                height: "auto",
                filter: "brightness(0) invert(1)",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: oliveTheme.white,
                fontWeight: "bold",
                display: { xs: "none", sm: "block" },
              }}
            >
              {t("systemName", language)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={{ xs: 0.5, sm: 1, md: 3 }} alignItems="center">
            <Button
              onClick={() => scrollToSection("features")}
              sx={{
                color: oliveTheme.white,
                fontWeight: 500,
                textTransform: "none",
                fontSize: { xs: "0.7rem", sm: "0.85rem", md: "1rem" },
                minHeight: { xs: 44, md: 40 },
                px: { xs: 1, sm: 1.5, md: 2 },
                display: { xs: "none", sm: "inline-flex" },
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              {t("features", language)}
            </Button>
            <Button
              onClick={() => scrollToSection("how-it-works")}
              sx={{
                color: oliveTheme.white,
                fontWeight: 500,
                textTransform: "none",
                fontSize: { xs: "0.7rem", sm: "0.85rem", md: "1rem" },
                minHeight: { xs: 44, md: 40 },
                px: { xs: 1, sm: 1.5, md: 2 },
                display: { xs: "none", sm: "inline-flex" },
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              {t("howItWorks", language)}
            </Button>
            <LanguageToggle
              sx={{
                color: oliveTheme.white,
                backgroundColor: "rgba(255,255,255,0.1)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                },
              }}
            />
            <Button
              onClick={() => {
                setMode("signin");
                scrollToSection("auth-section");
              }}
              sx={{
                color: oliveTheme.primaryDark,
                backgroundColor: oliveTheme.accent,
                fontWeight: 600,
                textTransform: "none",
                px: { xs: 2, sm: 2.5, md: 3 },
                py: { xs: 1, md: 0.75 },
                minHeight: { xs: 44, md: 40 },
                borderRadius: 2,
                fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
                "&:hover": {
                  backgroundColor: "#D4B35A",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {t("login", language)}
            </Button>
          </Stack>
        </Box>

        {/* Hero Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            py: { xs: 4, md: 0 },
            px: { xs: 2, md: 8, lg: 12 },
            width: "100%",
          }}
        >
            {/* Left Side - Text Content */}
            <Box
              sx={{
                flex: { xs: "1", md: "0 0 auto" },
                textAlign: { xs: "center", md: "left" },
                mb: { xs: 4, md: 0 },
              }}
            >
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    color: oliveTheme.white,
                    fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem", lg: "4rem" },
                    lineHeight: 1.2,
                    mb: 2,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {t("yourHealth", language)}
                  <br />
                  <Box
                    component="span"
                    sx={{
                      color: oliveTheme.accent,
                    }}
                  >
                    {t("ourPriority", language)}
                  </Box>
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    mb: 4,
                    lineHeight: 1.7,
                    fontSize: { xs: "1rem", md: "1.15rem" },
                    maxWidth: 500,
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  {t("heroDescription", language)}
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent={{ xs: "center", md: "flex-start" }}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      setMode("signup");
                      scrollToSection("auth-section");
                    }}
                    sx={{
                      background: "#FFFFFF !important",
                      backgroundColor: "#FFFFFF !important",
                      color: "#3D4F23 !important",
                      fontWeight: 700,
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.5, md: 1.5 },
                      minHeight: { xs: 48, md: 44 },
                      borderRadius: 2,
                      fontSize: { xs: "1rem", sm: "1.05rem", md: "1.1rem" },
                      boxShadow: "0 4px 14px rgba(255, 255, 255, 0.4)",
                      width: { xs: "100%", sm: "auto" },
                      "&:hover": {
                        background: "#F5F3EF !important",
                        backgroundColor: "#F5F3EF !important",
                        transform: "translateY(-3px)",
                        boxShadow: "0 6px 20px rgba(255, 255, 255, 0.5)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {t("getStarted", language)}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => scrollToSection("features")}
                    sx={{
                      borderColor: oliveTheme.white,
                      color: oliveTheme.white,
                      fontWeight: 600,
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.5, md: 1.5 },
                      minHeight: { xs: 48, md: 44 },
                      borderRadius: 2,
                      fontSize: { xs: "1rem", sm: "1.05rem", md: "1.1rem" },
                      borderWidth: 2,
                      width: { xs: "100%", sm: "auto" },
                      "&:hover": {
                        borderColor: oliveTheme.accent,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        transform: "translateY(-3px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {t("learnMore", language)}
                  </Button>
                </Stack>
            </Box>

            {/* Right Side - Auth Forms */}
            <Box
              id="auth-section"
              sx={{
                flex: { xs: "1", md: "0 0 auto" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                pb: { xs: 4, md: 8 },
              }}
            >
                {/* Logo Above Sign In Form - Centered */}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 480,
                    display: "flex",
                    justifyContent: "center",
                    mt: 6,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 4,
                      p: 2,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={birzeitLogo}
                      alt="Birzeit University Logo"
                      sx={{
                        width: { xs: 80, md: 100 },
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </Box>
                </Box>

                <Paper
                  elevation={24}
                  sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", sm: 420, md: 480 },
                    borderRadius: { xs: 2, sm: 3, md: 4 },
                    overflow: "hidden",
                    backgroundColor: oliveTheme.white,
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                    mx: { xs: 1, sm: 2, md: 0 },
                  }}
                >
                  {/* Auth Form Header */}
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${oliveTheme.primary} 0%, ${oliveTheme.primaryLight} 100%)`,
                      py: 2,
                      px: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: oliveTheme.white,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {mode === "signin"
                        ? t("welcomeBack", language)
                        : mode === "signup"
                        ? t("createAccount", language)
                        : mode === "verify-email"
                        ? t("verifyEmailTitle", language)
                        : t("resetPassword", language)}
                    </Typography>
                  </Box>

                  {/* Auth Form Content */}
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {mode === "signin" ? (
                      <SignIn setMode={setMode} setPendingEmail={setPendingEmail} />
                    ) : mode === "signup" ? (
                      <SignUp setMode={setMode} setPendingEmail={setPendingEmail} />
                    ) : mode === "verify-email" ? (
                      <VerifyEmail setMode={setMode} presetEmail={pendingEmail} />
                    ) : (
                      <ForgotPassword setMode={setMode} />
                    )}
                  </Box>
                </Paper>
            </Box>
        </Box>

        {/* Decorative Elements */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            right: "5%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: { xs: "none", lg: "block" },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "15%",
            left: "3%",
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            display: { xs: "none", lg: "block" },
          }}
        />
      </Box>

      {/* ==================== FEATURES SECTION ==================== */}
      <Box
        id="features"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: oliveTheme.background,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: oliveTheme.primary,
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: "0.9rem",
              }}
            >
              {t("whyChooseUs", language)}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: oliveTheme.textPrimary,
                mt: 1,
                mb: 2,
                fontSize: { xs: "1.8rem", md: "2.5rem" },
              }}
            >
              {t("comprehensiveInsuranceFeatures", language)}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: oliveTheme.textSecondary,
                maxWidth: 600,
                mx: "auto",
                fontSize: "1.1rem",
              }}
            >
              {t("everythingYouNeed", language)}
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center" alignItems="stretch">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: "flex" }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3, md: 4 },
                    width: "100%",
                    borderRadius: { xs: 2, sm: 3, md: 4 },
                    backgroundColor: oliveTheme.white,
                    border: `1px solid ${oliveTheme.cream}`,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: { xs: "none", md: "translateY(-8px)" },
                      boxShadow: { xs: "none", md: "0 20px 40px rgba(85, 107, 47, 0.15)" },
                      borderColor: oliveTheme.primaryLight,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 70, sm: 80, md: 90 },
                      height: { xs: 70, sm: 80, md: 90 },
                      borderRadius: "50%",
                      backgroundColor: `${oliveTheme.primary}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: { xs: 2, md: 3 },
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: oliveTheme.textPrimary,
                      mb: { xs: 1.5, md: 2 },
                      fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" },
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: oliveTheme.textSecondary,
                      lineHeight: 1.7,
                      flex: 1,
                      fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ==================== TRUST INDICATORS SECTION ==================== */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          backgroundColor: oliveTheme.cream,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
            {trustIndicators.map((indicator, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: { xs: 2, sm: 2.5, md: 3 },
                    borderRadius: { xs: 2, md: 3 },
                    backgroundColor: oliveTheme.white,
                    boxShadow: "0 4px 20px rgba(85, 107, 47, 0.08)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: { xs: "none", md: "translateY(-5px)" },
                      boxShadow: { xs: "0 4px 20px rgba(85, 107, 47, 0.08)", md: "0 8px 30px rgba(85, 107, 47, 0.15)" },
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 50, sm: 60, md: 70 },
                      height: { xs: 50, sm: 60, md: 70 },
                      borderRadius: "50%",
                      backgroundColor: `${oliveTheme.primary}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: { xs: 1.5, md: 2 },
                    }}
                  >
                    {indicator.icon}
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: oliveTheme.primary,
                      mb: 0.5,
                      fontSize: { xs: "1.2rem", sm: "1.5rem", md: "2rem" },
                    }}
                  >
                    {indicator.number}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: oliveTheme.textSecondary,
                      fontWeight: 500,
                      fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                    }}
                  >
                    {indicator.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ==================== HOW IT WORKS SECTION ==================== */}
      <Box
        id="how-it-works"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: oliveTheme.background,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: oliveTheme.primary,
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: "0.9rem",
              }}
            >
              {t("gettingStarted", language)}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: oliveTheme.textPrimary,
                mt: 1,
                mb: 2,
                fontSize: { xs: "1.8rem", md: "2.5rem" },
              }}
            >
              {t("howItWorks", language)}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: oliveTheme.textSecondary,
                maxWidth: 600,
                mx: "auto",
                fontSize: "1.1rem",
              }}
            >
              {t("fourSimpleSteps", language)}
            </Typography>
          </Box>

          <Box sx={{ position: "relative" }}>
            {/* Connection Line */}
            <Box
              sx={{
                display: { xs: "none", md: "block" },
                position: "absolute",
                top: "50px",
                left: "15%",
                right: "15%",
                height: 4,
                backgroundColor: `${oliveTheme.primaryLight}40`,
                zIndex: 0,
              }}
            />

            <Grid container spacing={{ xs: 3, sm: 3, md: 4 }} justifyContent="center" sx={{ position: "relative", zIndex: 1 }}>
              {steps.map((step, index) => (
                <Grid item xs={6} sm={6} md={3} key={index}>
                  <Box
                    sx={{
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    {/* Step Number */}
                    <Box
                      sx={{
                        width: { xs: 70, sm: 85, md: 100 },
                        height: { xs: 70, sm: 85, md: 100 },
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${oliveTheme.primary} 0%, ${oliveTheme.primaryDark} 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: { xs: 2, md: 3 },
                        boxShadow: `0 10px 30px ${oliveTheme.primary}40`,
                        position: "relative",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: { xs: "none", md: "scale(1.1)" },
                          boxShadow: { xs: `0 10px 30px ${oliveTheme.primary}40`, md: `0 15px 40px ${oliveTheme.primary}50` },
                        },
                      }}
                    >
                      {step.icon}
                      <Box
                        sx={{
                          position: "absolute",
                          top: { xs: -8, md: -10 },
                          right: { xs: -8, md: -10 },
                          width: { xs: 28, sm: 32, md: 35 },
                          height: { xs: 28, sm: 32, md: 35 },
                          borderRadius: "50%",
                          backgroundColor: oliveTheme.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          color: oliveTheme.primaryDark,
                          fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
                          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                        }}
                      >
                        {index + 1}
                      </Box>
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: oliveTheme.textPrimary,
                        mb: { xs: 0.5, md: 1 },
                        fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" },
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: oliveTheme.textSecondary,
                        maxWidth: { xs: 150, sm: 180, md: 200 },
                        mx: "auto",
                        fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* CTA Button */}
          <Box sx={{ textAlign: "center", mt: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 0 } }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                setMode("signup");
                scrollToSection("auth-section");
              }}
              sx={{
                backgroundColor: oliveTheme.primary,
                color: oliveTheme.white,
                fontWeight: 700,
                px: { xs: 3, sm: 4, md: 5 },
                py: { xs: 1.5, md: 1.5 },
                minHeight: { xs: 48, md: 44 },
                borderRadius: 2,
                fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
                boxShadow: `0 4px 14px ${oliveTheme.primary}40`,
                width: { xs: "100%", sm: "auto" },
                "&:hover": {
                  backgroundColor: oliveTheme.primaryDark,
                  transform: "translateY(-3px)",
                  boxShadow: `0 6px 20px ${oliveTheme.primary}50`,
                },
                transition: "all 0.3s ease",
              }}
            >
              {t("startYourRegistration", language)}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ==================== FOOTER SECTION ==================== */}
      <Box
        component="footer"
        sx={{
          backgroundColor: oliveTheme.primaryDark,
          color: oliveTheme.white,
          pt: { xs: 4, sm: 6, md: 8 },
          pb: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3, md: 0 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, sm: 3, md: 4 }}>
            {/* Brand Column */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, md: 2 }, mb: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
                <Box
                  component="img"
                  src={birzeitLogo}
                  alt="Birzeit Logo"
                  sx={{
                    width: { xs: 40, sm: 45, md: 50 },
                    height: "auto",
                    filter: "brightness(0) invert(1)",
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" } }}>
                  {t("birzeitInsurance", language)}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  mb: { xs: 2, md: 3 },
                  lineHeight: 1.7,
                  textAlign: { xs: "center", md: "left" },
                  fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.875rem" },
                }}
              >
                {t("footerDescription", language)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, justifyContent: { xs: "center", md: "flex-start" } }}>
                <SchoolIcon sx={{ fontSize: { xs: 18, md: 20 }, color: oliveTheme.accent }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.8rem", md: "0.875rem" } }}>
                  {t("birzeitUniversityAffiliated", language)}
                </Typography>
              </Box>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={6} md={2}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: { xs: 1.5, md: 2 }, color: oliveTheme.accent, fontSize: { xs: "0.9rem", md: "1rem" } }}
              >
                {t("quickLinks", language)}
              </Typography>
              <Stack spacing={{ xs: 0.75, md: 1 }}>
                {[
                  { key: "home", section: "hero" },
                  { key: "features", section: "features" },
                  { key: "howItWorks", section: "how-it-works" },
                  { key: "contactUs", section: "contact" }
                ].map((link) => (
                  <Typography
                    key={link.key}
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      transition: "color 0.2s",
                      fontSize: { xs: "0.8rem", md: "0.875rem" },
                      py: { xs: 0.25, md: 0 },
                      "&:hover": { color: oliveTheme.white },
                    }}
                    onClick={() => scrollToSection(link.section)}
                  >
                    {t(link.key, language)}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            {/* Services */}
            <Grid item xs={6} md={2}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: { xs: 1.5, md: 2 }, color: oliveTheme.accent, fontSize: { xs: "0.9rem", md: "1rem" } }}
              >
                {t("services", language)}
              </Typography>
              <Stack spacing={{ xs: 0.75, md: 1 }}>
                {[
                  "claimsManagement",
                  "prescriptions",
                  "labRequests",
                  "emergencyCare",
                ].map((serviceKey) => (
                  <Typography
                    key={serviceKey}
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                  >
                    {t(serviceKey, language)}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: { xs: 1.5, md: 2 }, color: oliveTheme.accent, fontSize: { xs: "0.9rem", md: "1rem" }, textAlign: { xs: "center", md: "left" } }}
              >
                {t("contactUs", language)}
              </Typography>
              <Stack spacing={{ xs: 1.5, md: 2 }} alignItems={{ xs: "center", md: "flex-start" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, md: 2 } }}>
                  <EmailIcon sx={{ fontSize: { xs: 18, md: 20 }, color: oliveTheme.accent }} />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.8rem", md: "0.875rem" } }}>
                    InsuranceSystem700@gmail.com
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, md: 2 } }}>
                  <PhoneIcon sx={{ fontSize: { xs: 18, md: 20 }, color: oliveTheme.accent }} />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.8rem", md: "0.875rem" } }}>
                    22982000 - 5111
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, md: 2 } }}>
                  <LanguageIcon sx={{ fontSize: { xs: 18, md: 20 }, color: oliveTheme.accent }} />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontSize: { xs: "0.8rem", md: "0.875rem" } }}>
                    www.birzeit-insurance.com
                  </Typography>
                </Box>
              </Stack>

              {/* Social Icons */}
              <Box sx={{ mt: { xs: 2, md: 3 }, textAlign: { xs: "center", md: "left" } }}>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.7)", mb: 1, fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                >
                  {t("followUs", language)}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent={{ xs: "center", md: "flex-start" }}>
                  {[FacebookIcon, TwitterIcon, InstagramIcon, LinkedInIcon].map(
                    (Icon, index) => (
                      <IconButton
                        key={index}
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                          color: oliveTheme.white,
                          minWidth: { xs: 40, md: 36 },
                          minHeight: { xs: 40, md: 36 },
                          "&:hover": {
                            backgroundColor: oliveTheme.accent,
                            color: oliveTheme.primaryDark,
                          },
                          transition: "all 0.3s ease",
                        }}
                        size="small"
                      >
                        <Icon fontSize="small" />
                      </IconButton>
                    )
                  )}
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* Bottom Bar */}
          <Box
            sx={{
              mt: { xs: 3, sm: 4, md: 6 },
              pt: { xs: 2, md: 3 },
              borderTop: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" } }}>
              &copy; {new Date().getFullYear()} {t("systemName", language)}.
              {t("allRightsReserved", language)}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
});

export default LandingPage;
