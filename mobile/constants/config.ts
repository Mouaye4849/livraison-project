import Constants from 'expo-constants';

const VITE_PORT       = '5173';   // Vite dev server (REST proxy + WS proxy)
const BACKEND_PORT    = '8080';   // Spring Boot direct
const FALLBACK_LAN_IP = '10.10.177.251';

function getIp(): string {
    return Constants.expoConfig?.hostUri?.split(':')[0] ?? FALLBACK_LAN_IP;
}

// ── REST base URL ─────────────────────────────────────────────────────────────
// Vite now serves HTTPS only (basic-ssl). The mobile app cannot use the Vite
// proxy (port 5173) because React Native / Axios rejects the self-signed cert
// and plain HTTP on 5173 is no longer served. Go directly to Spring Boot instead.
function resolveBaseUrl(): string {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    return `http://${getIp()}:${BACKEND_PORT}/api`;
}

// ── WebSocket primary — direct to Spring Boot (port 8080 reachable from Android)
// Vite's ws proxy on port 5173 requires WSS after enabling HTTPS. Pointing
// directly to the backend avoids the cert and protocol mismatch entirely.
function resolveWsUrl(): string {
    if (process.env.EXPO_PUBLIC_WS_URL) return process.env.EXPO_PUBLIC_WS_URL;
    return `ws://${getIp()}:${BACKEND_PORT}/ws`;
}

// ── WebSocket fallback — direct to Spring Boot (works if port 8080 is open) ──
function resolveWsDirectUrl(): string {
    if (process.env.EXPO_PUBLIC_WS_DIRECT_URL) return process.env.EXPO_PUBLIC_WS_DIRECT_URL;
    return `ws://${getIp()}:${BACKEND_PORT}/ws`;
}

export const API_BASE_URL   = resolveBaseUrl();
export const WS_BASE_URL    = resolveWsUrl();
export const WS_DIRECT_URL  = resolveWsDirectUrl();
export const API_TIMEOUT    = 15_000;

if (__DEV__) {
    const _ip = getIp();
    console.log('[CONFIG] ══════════════════════════════════════');
    console.log('[CONFIG] ip            =', _ip);
    console.log('[CONFIG] API_BASE_URL  =', API_BASE_URL);
    console.log('[CONFIG] WS_BASE_URL   =', WS_BASE_URL,   '  ← primary');
    console.log('[CONFIG] WS_DIRECT_URL =', WS_DIRECT_URL, '  ← fallback');
    console.log('[CONFIG] ══════════════════════════════════════');
}
