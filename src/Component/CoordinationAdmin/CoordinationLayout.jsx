import { Box } from "@mui/material";
import CoordinationSidebar from "./CoordinationSidebar";
import CoordinationHeader from "./CoordinationHeader";
import { useLanguage } from "../../context/LanguageContext";

const CoordinationLayout = ({ children }) => {
  const { isRTL } = useLanguage();

  return (
    <Box sx={{ display: "flex" }} dir={isRTL ? "rtl" : "ltr"}>
      <CoordinationSidebar />

      <Box sx={{
        marginLeft: isRTL ? 0 : { xs: 0, sm: "72px", md: "240px" },
        marginRight: isRTL ? { xs: 0, sm: "72px", md: "240px" } : 0,
        pt: { xs: "56px", sm: 0 },
        transition: "margin 0.3s ease",
        width: "100%"
      }}>
        <CoordinationHeader />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default CoordinationLayout;
