import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ role, children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ لو مافي user أو token → رجوع للصفحة الرئيسية
  if (!user || !token) {
    return <Navigate to="/LandingPage" replace />;
  }

  // ✅ تحقق من الدور
  if (role && (!user.roles || !user.roles.includes(role))) {
    return <Navigate to="/LandingPage" replace />;
  }

  // ✅ يدعم الحالتين: children أو Outlet
  return children ? children : <Outlet />;
};

export default PrivateRoute;
