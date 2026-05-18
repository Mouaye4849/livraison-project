import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Vite dev server port — all API requests are proxied through it to avoid
// CORS issues and Windows Firewall blocking port 8080 directly.
// The Vite proxy intercepts /api/* and forwards to http://localhost:8080.
const VITE_PORT = '5173';

const FALLBACK_LAN_IP = '192.168.100.135'; // IP LAN de la machine de dev

function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:${VITE_PORT}/api`;
    }

    return `http://${FALLBACK_LAN_IP}:${VITE_PORT}/api`;
  }

  return `http://${FALLBACK_LAN_IP}:${VITE_PORT}/api`;
}

export const API_BASE_URL = resolveBaseUrl();
export const API_TIMEOUT = 15_000;
