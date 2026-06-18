import axios from "axios";

// Use the Vite proxy (/api → http://localhost:8080/api).
// This keeps all requests same-origin → no CORS, no preflight for PUT/DELETE.
const api = axios.create({
    baseURL: "/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token && !config.url.includes("/auth")) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // [DEBUG] — remove after diagnosis
    console.log("[API] →", config.method?.toUpperCase(), config.url, "token:", token ? "present" : "MISSING");

    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status;

        // [DEBUG] — remove after diagnosis
        console.error("[API] ← ERROR", status, err.config?.url, err.response?.data);

        if (status === 401) {
            // Token absent, expired, or invalid → force re-login
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        // 403 = authenticated but not authorized for this resource.
        // Do NOT remove the token or redirect — let the component handle it.

        return Promise.reject(err);
    }
);

export default api;