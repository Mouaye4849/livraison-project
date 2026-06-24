import { Navigate } from "react-router-dom";
import { getToken, removeToken } from "../utils/auth";
import { isTokenValid, getUserRole } from "../utils/jwt";

export default function UserRoute({ children }) {

    const token = getToken();

    if (!token || !isTokenValid(token)) {
        removeToken();
        return <Navigate to="/login" />;
    }

    const role = getUserRole(token);

    if (role !== "ROLE_USER") {
        return <Navigate to="/" />;
    }

    return children;
}