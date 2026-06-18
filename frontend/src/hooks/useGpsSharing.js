import { useEffect, useRef, useState, useCallback } from "react";
import { createStompClient } from "../services/ws.service";

const SEND_INTERVAL_MS = 5_000;

/**
 * Watches the browser's Geolocation API and streams position updates to the
 * backend via STOMP/WebSocket instead of repeated REST calls.
 * Sends every 5 seconds and immediately on first GPS fix.
 * Auto-reconnects if the WebSocket drops.
 *
 * @param {string}  colisId  UUID of the colis being delivered.
 * @param {boolean} enabled  Pass false to skip tracking (e.g. colis not EN_COURS).
 * @returns {{ status: string, coords: {latitude, longitude} | null }}
 */
export function useGpsSharing(colisId, enabled = true) {

    const [status, setStatus] = useState("requesting");
    const [coords, setCoords] = useState(null);

    const latestCoordsRef = useRef(null);
    const watchIdRef      = useRef(null);
    const intervalIdRef   = useRef(null);
    const stompClientRef  = useRef(null);
    const connectedRef    = useRef(false);
    // Keep only the most recent position buffered while disconnected
    const pendingRef      = useRef(null);

    const publishGps = useCallback((latitude, longitude) => {
        const client = stompClientRef.current;
        if (!client) return;

        const body = JSON.stringify({ colisId, latitude, longitude });

        if (connectedRef.current) {
            client.publish({ destination: "/app/gps/update", body });
        } else {
            pendingRef.current = { latitude, longitude };
        }
    }, [colisId]);

    useEffect(() => {
        if (!enabled || !colisId) return;

        if (!navigator?.geolocation) {
            setStatus("unavailable");
            return;
        }

        // Mobile browsers (Chrome, Safari) enforce the Secure Context policy:
        // navigator.geolocation is blocked on plain HTTP origins (non-localhost).
        // The browser returns PERMISSION_DENIED (code 1) without prompting the user.
        // Desktop browsers are more lenient. Detect this early so the badge shows
        // a useful message instead of the generic "Permission refusée".
        if (!window.isSecureContext) {
            setStatus("insecure_context");
            return;
        }

        let mounted  = true;
        let firstSent = false;

        // ── STOMP client (via SockJS proxy) ───────────────────────────────────
        const client = createStompClient(() => {
            if (!mounted) return;
            connectedRef.current = true;
            // Flush any position buffered during reconnect
            if (pendingRef.current) {
                const { latitude, longitude } = pendingRef.current;
                pendingRef.current = null;
                client.publish({
                    destination: "/app/gps/update",
                    body: JSON.stringify({ colisId, latitude, longitude }),
                });
            }
        });
        client.onDisconnect = () => { connectedRef.current = false; };
        client.activate();
        stompClientRef.current = client;

        // ── Geolocation watch ─────────────────────────────────────────────────
        const onSuccess = ({ coords: { latitude, longitude } }) => {
            if (!mounted) return;
            latestCoordsRef.current = { latitude, longitude };
            setCoords({ latitude, longitude });
            setStatus("active");

            if (!firstSent) {
                firstSent = true;
                publishGps(latitude, longitude);
            }
        };

        const onError = ({ code }) => {
            if (!mounted) return;
            setStatus(code === 1 ? "permission_denied" : "error");
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout:    10_000,
            maximumAge:       0,
        });

        // ── 5-second interval ─────────────────────────────────────────────────
        intervalIdRef.current = setInterval(() => {
            if (!latestCoordsRef.current) return;
            const { latitude, longitude } = latestCoordsRef.current;
            publishGps(latitude, longitude);
        }, SEND_INTERVAL_MS);

        return () => {
            mounted = false;
            connectedRef.current = false;
            client.deactivate();
            stompClientRef.current = null;
            navigator.geolocation.clearWatch(watchIdRef.current);
            clearInterval(intervalIdRef.current);
            watchIdRef.current  = null;
            intervalIdRef.current = null;
        };
    }, [colisId, enabled, publishGps]);

    return { status, coords };
}
