import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoredUser } from '@/types';

const KEYS = {
  TOKEN: 'wasali_token',
  USER:  'wasali_user',
} as const;

export const storage = {
  // ─── Token ──────────────────────────────────────────────────────────────────

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  },

  // ─── User ───────────────────────────────────────────────────────────────────

  async setUser(user: StoredUser): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<StoredUser | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  // ─── Session ────────────────────────────────────────────────────────────────

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(KEYS.TOKEN);
    return token !== null && token.length > 0;
  },
};
