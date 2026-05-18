import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/constants/config';
import { storage } from '@/services/storage';
import type { ApiError } from '@/types';

// ─── Instance Axios ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor — attache le JWT ────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAuthRoute = config.url?.includes('/auth');
    if (!isAuthRoute) {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor — gère les erreurs globales ────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    // Only 401 (expired/invalid token) warrants clearing the session.
    // 403 means "wrong role for this endpoint" — the token is still valid.
    if (status === 401) {
      await storage.clear();
    }

    return Promise.reject(error);
  },
);

export default api;
