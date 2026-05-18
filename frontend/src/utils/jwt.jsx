import { jwtDecode } from "jwt-decode";


export const isTokenValid = (token) => {
    try {
        const decoded = jwtDecode(token);

        if (!decoded.exp) return false;

        return decoded.exp * 1000 > Date.now();
    } catch (error) {
        return false;
    }
};


export const getUserFromToken = (token) => {
    try {
        return jwtDecode(token);
    } catch (error) {
        return null;
    }
};

export const getUserRole = (token) => {
    try {
        const decoded = jwtDecode(token);
        return decoded.role || null;
    } catch {
        return null;
    }
};