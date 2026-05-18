import { Navigate } from "react-router-dom";
import { getToken, removeToken } from "../utils/auth";
import { isTokenValid } from "../utils/jwt";

export default function PrivateRoute({ children }) {

    const token = getToken();

    if (!token || !isTokenValid(token)) {
        removeToken();
        return <Navigate to="/login" replace />;
    }

    return children;
}