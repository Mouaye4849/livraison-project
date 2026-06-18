import { useEffect, useRef, useState, useCallback } from 'react';
import { stompSingleton } from '@/services/stomp.singleton';
import { gpsService } from '@/services/gps.service';
import type { GpsLocation } from '@/types';

export type GpsTrackError = 'no_gps' | 'error' | null;

export interface GpsTrackState {
  gpsData:     GpsLocation | null;
  loading:     boolean;
  error:       GpsTrackError;
  lastUpdated: Date | null;
  refresh:     () => void;
}

// If no STOMP frame arrives in 10 s, fall back to REST polling every 3 s.
const STOMP_SILENCE_MS = 10_000;
const REST_POLL_MS     = 3_000;

export function useGpsTracking(colisId: string | undefined): GpsTrackState {

  const [gpsData,     setGpsData]     = useState<GpsLocation | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<GpsTrackError>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mountedRef      = useRef(true);
  const hasLiveRef      = useRef(false);
  const noGpsTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const pollTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStompMsRef  = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(() => {
    if (!colisId) return;
    setLoading(true);
    gpsService.getLatest(colisId)
      .then((data) => {
        if (!mountedRef.current) return;
        setGpsData(data);
        setError(null);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err?.response?.status === 404 ? 'no_gps' : 'error');
      })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [colisId]);

  useEffect(() => {
    if (!colisId) {
      console.warn('[GPS-TRACK] ✗ colisId is undefined — tracking aborted');
      return;
    }

    console.log('══════════════════════════════════════════════');
    console.log('[GPS-TRACK] ══ MOUNT');
    console.log('[GPS-TRACK]   colisId          =', colisId);
    console.log('[GPS-TRACK]   STOMP connected? =', stompSingleton.isConnected);
    hasLiveRef.current     = false;
    lastStompMsRef.current = null;
    let mounted = true;

    // Java UUID.toString() is always lowercase. Normalize here to guarantee the
    // subscription topic matches the broadcast topic even if the route param
    // arrived with mixed-case characters (e.g. from a QR code or deep link).
    const topic = `/topic/gps/${colisId.toLowerCase()}`;
    console.warn('══════════════════════════════════════════════');
    console.warn('[COLISID] STEP 4/5 client    subscribe topic  =', JSON.stringify(topic));
    console.warn('[GPS-TRACK]   raw colisId (before lower)     =', JSON.stringify(colisId));
    console.warn('[GPS-TRACK]   STOMP connected at sub time?   =', stompSingleton.isConnected);
    console.warn('══════════════════════════════════════════════');

    // ── 1. REST: initial position from DB ─────────────────────────────────────
    gpsService.getLatest(colisId)
      .then((data) => {
        if (!mounted) return;
        console.log('[GPS-TRACK] REST ✓  lat =', data.latitude, ' lon =', data.longitude);
        setGpsData(data);
        setError(null);
        setLastUpdated(new Date());
        hasLiveRef.current = true;
        if (noGpsTimerRef.current) {
          clearTimeout(noGpsTimerRef.current);
          noGpsTimerRef.current = null;
        }
      })
      .catch((err) => {
        if (!mounted) return;
        const s = err?.response?.status;
        console.warn('[GPS-TRACK] REST ✗  HTTP', s,
          '— no position in DB yet, waiting for live frame');
        if (s === 404) {
          noGpsTimerRef.current = setTimeout(() => {
            if (mounted && !hasLiveRef.current) {
              console.warn('[GPS-TRACK] ✗ 8 s elapsed — no frame received on', topic);
              console.warn('[GPS-TRACK]   STOMP connected?', stompSingleton.isConnected);
              console.warn('[GPS-TRACK]   → Check backend logs for [GPS-WS] DROPPED');
              console.warn('[GPS-TRACK]   → Verify colis statut = EN_COURS in the database');
              setError('no_gps');
            }
          }, 8_000);
        } else {
          setError('error');
        }
      })
      .finally(() => { if (mounted) setLoading(false); });

    // ── 2. STOMP: live GPS frames (primary channel) ────────────────────────────
    const unsubscribe = stompSingleton.subscribe(topic, (body) => {
      if (!mounted) return;
      try {
        console.warn('══════════════════════════════════════════════');
        console.warn('[COLISID] STEP 5/5 client    received  body =', body?.slice(0, 120));
        console.warn('[GPS-TRACK] ◉ LIVE STOMP frame received');
        const data = JSON.parse(body) as GpsLocation;
        console.warn('[GPS-TRACK]   lat      =', data.latitude);
        console.warn('[GPS-TRACK]   lon      =', data.longitude);
        console.warn('[GPS-TRACK]   colisId  =', data.colisId);
        console.warn('══════════════════════════════════════════════');

        lastStompMsRef.current = Date.now();
        hasLiveRef.current = true;
        if (noGpsTimerRef.current) {
          clearTimeout(noGpsTimerRef.current);
          noGpsTimerRef.current = null;
        }
        setGpsData(data);
        setError(null);
        setLoading(false);
        setLastUpdated(new Date());
      } catch (e) {
        console.error('[GPS-TRACK] ✗ malformed STOMP body:', body, e);
      }
    });

    console.log('[GPS-TRACK] subscribe() called — STOMP connected?', stompSingleton.isConnected);

    stompSingleton.init();
    console.log('[GPS-TRACK] init() called');

    // ── 3. REST fallback polling — activates when STOMP is silent ─────────────
    // Polls every REST_POLL_MS. Self-skips while STOMP delivers frames within
    // STOMP_SILENCE_MS. Guarantees the marker always moves even if STOMP
    // is unavailable (network issue, subscription lost, backend not broadcasting).
    pollTimerRef.current = setInterval(async () => {
      if (!mounted) return;

      const lastStomp = lastStompMsRef.current;
      if (lastStomp !== null && Date.now() - lastStomp < STOMP_SILENCE_MS) {
        return; // STOMP is active — skip REST poll
      }

      try {
        const data = await gpsService.getLatest(colisId);
        if (!mounted) return;
        console.log('[GPS-TRACK] ◉ REST poll  lat =', data.latitude, ' lon =', data.longitude);
        setGpsData(data);
        setError(null);
        setLastUpdated(new Date());
      } catch {
        // silent — keep last known position on screen
      }
    }, REST_POLL_MS);

    // ── STOMP connection monitoring ────────────────────────────────────────────
    const removeConnectLog = stompSingleton.addConnectListener(() => {
      console.log('[GPS-TRACK] ✓ STOMP (re)connected — subscription active for', topic);
    });
    const removeDisconnectLog = stompSingleton.addDisconnectListener(() => {
      console.warn('[GPS-TRACK] ✗ STOMP DISCONNECTED — REST fallback activates in',
        STOMP_SILENCE_MS / 1000, 's');
    });

    // ── Cleanup ────────────────────────────────────────────────────────────────
    return () => {
      console.log('[GPS-TRACK] ══ UNMOUNT  colisId =', colisId);
      mounted = false;
      if (noGpsTimerRef.current) {
        clearTimeout(noGpsTimerRef.current);
        noGpsTimerRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      removeConnectLog();
      removeDisconnectLog();
      unsubscribe();
    };
  }, [colisId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { gpsData, loading, error, lastUpdated, refresh };
}
