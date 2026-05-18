import api from '@/services/api';
import { storage } from '@/services/storage';
import type { AuthResponse, LoginRequest, RegisterRequest, StoredUser } from '@/types';

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    await persistSession(data);
    return data;
  },

  async registerClient(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register/client', payload);
    await persistSession(data);
    return data;
  },

  async registerVoyageur(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register/voyageur', payload);
    await persistSession(data);
    return data;
  },

  async logout(): Promise<void> {
    await storage.clear();
  },

  async getSession(): Promise<StoredUser | null> {
    return storage.getUser();
  },

  async isAuthenticated(): Promise<boolean> {
    return storage.isAuthenticated();
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function persistSession(auth: AuthResponse): Promise<void> {
  await storage.setToken(auth.token);
  await storage.setUser({ email: auth.email, role: auth.role });
}
