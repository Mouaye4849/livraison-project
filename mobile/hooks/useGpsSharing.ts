import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { stompSingleton } from '@/services/stomp.singleton';

export type GpsShareStatus =
  | 'requesting'        // Permission GPS / connexion STOMP en cours
  | 'active'            // STOMP connecté + GPS en cours de publication
  | 'gps_only'          // GPS fix OK mais STOMP non connecté
  | 'permission_denied'
  | 'unavailable'
  | 'error';

export interface GpsShareState {
  status: GpsShareStatus;
  coords: { latitude: number; longitude: number } | null;
}

const SEND_INTERVAL_MS = 5_000;

export function useGpsSharing(
  colisId: string | undefined,
  enabled: boolean = true,
): GpsShareState {

  const [status, setStatus] = useState<GpsShareStatus>('requesting');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const latestRef   = useRef<{ latitude: number; longitude: number } | null>(null);
  const pendingRef  = useRef<{ latitude: number; longitude: number } | null>(null);
  const diagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !colisId) return;

    console.log('[GPS-SHARE] ══ MOUNT  colisId =', colisId);
    console.log('[GPS-SHARE] STOMP already connected?', stompSingleton.isConnected);
    let mounted = true;

    // ── Diagnostic : logguer l'état STOMP après 6 s ──────────────────────────
    diagTimerRef.current = setTimeout(() => {
      console.warn('══════════════════════════════════════════════');
      console.warn('[GPS-SHARE] ⚠ STOMP DIAGNOSTIC — 6 s écoulées');
      console.warn('[GPS-SHARE]   stompSingleton.isConnected =', stompSingleton.isConnected);
      console.warn('[GPS-SHARE]   Si false → STOMP ne se connecte pas.');
      console.warn('[GPS-SHARE]   Chercher [STOMP DEBUG] dans Metro pour la cause.');
      console.warn('══════════════════════════════════════════════');
    }, 6_000);

    // ── publish helper ────────────────────────────────────────────────────────
    // Normalize colisId to lowercase so it matches Java UUID.toString() output.
    // The backend parses it as UUID, converts back to lowercase for the broadcast
    // topic. If this value were mixed-case, the broadcast topic would still be
    // lowercase while the client's subscription might be mixed-case → no match.
    const normalizedColisId = colisId.toLowerCase();

    const publish = (lat: number, lon: number) => {
      if (stompSingleton.isConnected) {
        console.log('[COLISID] STEP 1/5 voyageur  publish  colisId =', JSON.stringify(normalizedColisId));
        console.log('[GPS-SHARE] ► SEND  lat =', lat, ' lon =', lon);
        stompSingleton.publish(
          '/app/gps/update',
          JSON.stringify({ colisId: normalizedColisId, latitude: lat, longitude: lon }),
        );
        // STOMP connecté + GPS publie → badge "GPS actif"
        if (mounted) setStatus('active');
      } else {
        console.log('[GPS-SHARE] ✗ STOMP not connected — buffering');
        pendingRef.current = { latitude: lat, longitude: lon };
        if (mounted) setStatus('gps_only');
      }
    };

    // ── STOMP connect listener : flush le pending puis confirmer 'active' ─────
    const removeConnectListener = stompSingleton.addConnectListener(() => {
      console.log('[GPS-SHARE] ← STOMP connected');
      if (!mounted) return;
      if (pendingRef.current) {
        const { latitude, longitude } = pendingRef.current;
        pendingRef.current = null;
        console.log('[GPS-SHARE] Flushing buffered  lat =', latitude, ' lon =', longitude);
        stompSingleton.publish(
          '/app/gps/update',
          JSON.stringify({ colisId: normalizedColisId, latitude, longitude }),
        );
        if (mounted) setStatus('active');
      }
    });

    const removeDisconnectListener = stompSingleton.addDisconnectListener(() => {
      console.log('[GPS-SHARE] ✗ STOMP disconnected');
      if (mounted) setStatus('gps_only');
    });

    stompSingleton.init();

    // ── GPS watch ─────────────────────────────────────────────────────────────
    let locationSub: Location.LocationSubscription | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;

      if (perm !== 'granted') {
        console.warn('[GPS-SHARE] Permission refusée');
        setStatus('permission_denied');
        return;
      }

      console.log('[GPS-SHARE] Permission OK — watchPositionAsync démarré');

      locationSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1_000, distanceInterval: 1 },
        (loc) => {
          if (!mounted) return;
          const { latitude, longitude } = loc.coords;
          console.log('[GPS-SHARE] ◉ fix  lat =', latitude, ' lon =', longitude);
          latestRef.current = { latitude, longitude };
          setCoords({ latitude, longitude });
          publish(latitude, longitude);
        },
      );

      // Heartbeat : republier si voyageur immobile
      interval = setInterval(() => {
        if (!mounted || !latestRef.current) return;
        const { latitude, longitude } = latestRef.current;
        publish(latitude, longitude);
      }, SEND_INTERVAL_MS);
    };

    start().catch((err) => {
      console.error('[GPS-SHARE] start() error:', err);
      if (mounted) setStatus('error');
    });

    return () => {
      console.log('[GPS-SHARE] ══ UNMOUNT  colisId =', colisId);
      mounted = false;
      if (diagTimerRef.current) { clearTimeout(diagTimerRef.current); diagTimerRef.current = null; }
      removeConnectListener();
      removeDisconnectListener();
      locationSub?.remove();
      if (interval) clearInterval(interval);
      locationSub    = null;
      interval       = null;
      latestRef.current  = null;
      pendingRef.current = null;
    };
  }, [colisId, enabled]);

  return { status, coords };
}
