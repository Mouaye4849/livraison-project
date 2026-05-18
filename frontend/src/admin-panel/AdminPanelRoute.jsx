import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ADMIN_TOKEN_KEY } from "./adminApi";

function isValidAdminToken(token) {
  if (!token) return false;
  try {
    const d = jwtDecode(token);
    return d.exp * 1000 > Date.now() && d.role === "ROLE_ADMIN";
  } catch {
    return false;
  }
}

export default function AdminPanelRoute({ children }) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!isValidAdminToken(token)) {
    return <Navigate to="/m-admin/login" replace />;
  }
  return children;
}
