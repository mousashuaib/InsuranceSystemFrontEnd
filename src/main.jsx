import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";

function Root() {
  const [mode, setMode] = useState("light"); // ✅ وضع افتراضي

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme(mode)}>
        <CssBaseline />
        <App mode={mode} setMode={setMode} /> {/* تمرير للـ App */}
      </ThemeProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>

);
