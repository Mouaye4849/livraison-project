import { Navigate } from "react-router-dom";
import { getToken, removeToken } from "../utils/auth";
import { isTokenValid, getUserRole } from "../utils/jwt";

export default function VoyageurRoute({ children }) {

    const token = getToken();

    if (!token || !isTokenValid(token)) {
        removeToken();
        return <Navigate to="/login" />;
    }

    const role = getUserRole(token);

    if (role !== "ROLE_VOYAGEUR") {
        return <Navigate to="/dashboard" />;
    }

    return children;
}