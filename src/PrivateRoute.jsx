import { Navigate } from "react-router-dom";

const PrivateRoute = ({ role, children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  // ✅ roles Array, بتشيك إذا الدور موجود
  if (!user.roles || !user.roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
