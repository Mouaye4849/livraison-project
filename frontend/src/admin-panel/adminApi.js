import axios from "axios";

export const ADMIN_TOKEN_KEY = "wasali_admin_token";

const adminApi = axios.create({
  baseURL: "/api",
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token && !config.url.includes("/auth")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.href = "/m-admin/login";
    }
    return Promise.reject(err);
  }
);

export default adminApi;
