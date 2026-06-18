import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Platform, Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region, type Details } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGpsTracking } from '@/hooks/useGpsTracking';

// ─── Design tokens ────────────────────────────────────────────────────────────
const G = {
  glass:    'rgba(10,13,18,0.84)',
  glassMd:  'rgba(10,13,18,0.72)',
  overlay:  'rgba(10,13,18,0.93)',
  bd:       'rgba(255,255,255,0.08)',
  wh:       '#f0f6fc',
  gr:       '#9ca3af',
  dim:      '#6b7280',
  grn:      '#22c55e',
  grnDim:   'rgba(34,197,94,0.14)',
  grnBd:    'rgba(34,197,94,0.30)',
  red:      '#dc2626',
  redDim:   'rgba(220,38,38,0.10)',
  blu:      '#3b82f6',
  ylw:      '#f59e0b',
  pur:      '#8b5cf6',
} as const;

// ─── Vehicle types ────────────────────────────────────────────────────────────
export type VehicleType = 'truck' | 'car' | 'motorcycle' | 'airplane';

const VEHICLE: Record<VehicleType, {
  icon: string;
  lib: 'mci' | 'ion';
  color: string;
  bg: string;
  bd: string;
  label: string;
}> = {
  truck: {
    icon: 'truck-delivery',
    lib:  'mci',
    color: '#22c55e',
    bg:   'rgba(34,197,94,0.15)',
    bd:   'rgba(34,197,94,0.40)',
    label: 'Livraison',
  },
  car: {
    icon: 'car-sport',
    lib:  'ion',
    color: '#3b82f6',
    bg:   'rgba(59,130,246,0.15)',
    bd:   'rgba(59,130,246,0.40)',
    label: 'Voiture',
  },
  motorcycle: {
    icon: 'bicycle',
    lib:  'ion',
    color: '#f59e0b',
    bg:   'rgba(245,158,11,0.15)',
    bd:   'rgba(245,158,11,0.40)',
    label: 'Moto',
  },
  airplane: {
    icon: 'airplane',
    lib:  'ion',
    color: '#8b5cf6',
    bg:   'rgba(139,92,246,0.15)',
    bd:   'rgba(139,92,246,0.40)',
    label: 'Vol',
  },
};

export interface GpsMapProps {
  colisId: string;
  onBack?: () => void;
  vehicleType?: VehicleType;
}

// ─── VehicleMarker ─────────────────────────────────────────────────────────────
// Fully self-contained: runs its own pulse loop internally.
// React.memo + no dynamic props → zero re-renders from the parent.
interface VehicleMarkerProps {
  vehicleType: VehicleType;
}

const VehicleMarker = React.memo(function VehicleMarker({ vehicleType }: VehicleMarkerProps) {
  const cfg = VEHICLE[vehicleType];

  // Single lightweight pulse: outer ring expands + fades, inner bubble stays static.
  // useNativeDriver: true → runs on the UI thread, zero JS involvement.
  const ringScale   = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 2.0,  duration: 1600, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0,    duration: 1600, useNativeDriver: true }),
        ]),
        // Reset instantly, then pause
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 1.0, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.65, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(600),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []); // mount-once — safe because this component never remounts

  return (
    <View style={vm.root}>
      {/* Pulse ring — Animated.View keeps this off the JS bridge */}
      <Animated.View
        style={[
          vm.ring,
          {
            borderColor:     cfg.color,
            backgroundColor: cfg.bg,
            transform:       [{ scale: ringScale }],
            opacity:         ringOpacity,
          },
        ]}
      />

      {/* Icon bubble — static after mount. Solid fill + white border for
          maximum contrast against both light and dark map tiles. */}
      <View style={[vm.bubble, { backgroundColor: cfg.color }]}>
        <Ionicons
            name="location"
            size={28}
            color="#ffffff"
        />
      </View>

      {/* Shadow dot under the bubble for depth */}
      <View style={[vm.shadow, { backgroundColor: cfg.color }]} />
    </View>
  );
});

const vm = StyleSheet.create({
  root: {
    width: 72, height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 64, height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  bubble: {
    width: 54, height: 54,
    borderRadius: 27,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    // Depth shadow
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
    }),
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    width: 28, height: 7,
    borderRadius: 14,
    opacity: 0.3,
    zIndex: 1,
  },
});

// ─── GpsMap ───────────────────────────────────────────────────────────────────
export function GpsMap({ colisId, onBack, vehicleType = 'truck' }: GpsMapProps) {
  const insets = useSafeAreaInsets();

  // ── GPS data — unchanged from existing realtime system ────────────────────
  const { gpsData, loading, error, refresh } = useGpsTracking(colisId);

  // ── Map ref for camera animation ──────────────────────────────────────────
  const mapRef = useRef<MapView>(null);

  // True while the user is manually panning — camera auto-follow is paused.
  const userPanningRef  = useRef(false);
  const resumeTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Marker coordinate — set on first GPS fix, updated on every change ────
  const [markerCoord, setMarkerCoord] = useState<{ latitude: number; longitude: number } | null>(null);

  // tracksViewChanges is kept permanently true on Android Fabric (react-native
  // 0.81.5). On Fabric, setting tracksViewChanges=false stops the native layer
  // from propagating coordinate prop changes → marker freezes even when
  // setMarkerCoord() is called. The animation in VehicleMarker also requires
  // the native layer to keep reading the view to remain visible.

  // ── Update marker position + camera on every GPS fix ─────────────────────
  useEffect(() => {
    if (!gpsData) return;

    console.log('══════════════════════════════════════════════');
    console.log('[GPS-MAP] ► gpsData changed');
    console.log('[GPS-MAP]   lat          =', gpsData.latitude);
    console.log('[GPS-MAP]   lon          =', gpsData.longitude);
    console.log('[GPS-MAP]   userPanning  =', userPanningRef.current);
    console.log('[GPS-MAP]   mapRef ready =', !!mapRef.current);

    setMarkerCoord({ latitude: gpsData.latitude, longitude: gpsData.longitude });
    console.log('[GPS-MAP]   → markerCoord updated');

    if (!userPanningRef.current && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude:       gpsData.latitude,
          longitude:      gpsData.longitude,
          latitudeDelta:  0.009,
          longitudeDelta: 0.009,
        },
        300,
      );
      console.log('[GPS-MAP]   → animateToRegion ✓');
    } else {
      console.warn('[GPS-MAP]   → animateToRegion SKIPPED',
        '(userPanning =', userPanningRef.current,
        ', mapRef =', !!mapRef.current, ')');
    }
    console.log('══════════════════════════════════════════════');
  }, [gpsData]);

  // ── Mount/unmount lifecycle log ───────────────────────────────────────────
  useEffect(() => {
    console.log('[GPS-MAP] ══ MOUNT  colisId =', colisId);
    return () => {
      console.log('[GPS-MAP] ══ UNMOUNT  colisId =', colisId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Panning detection via isGesture (react-native-maps 1.20.1) ───────────
  // onPanDrag is intentionally NOT used. On Android, animateToRegion() fires
  // onPanDrag asynchronously AFTER onRegionChangeComplete. Any isProgrammatic
  // flag is already reset by then → false positive "user pan" → auto-follow
  // blocked forever. isGesture is the native ground truth:
  //   true      → user gesture
  //   false     → programmatic animateToRegion
  //   undefined → Apple Maps fallback (treated as non-gesture)

  // Fires every frame during a drag OR animation. We only care about gestures.
  const onRegionChange = useCallback((_region: Region, details: Details) => {
    if (details.isGesture && !userPanningRef.current) {
      console.log('[GPS-MAP] onRegionChange  USER pan started → pause auto-follow');
      userPanningRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    }
  }, []);

  // Fires once when the drag or animation fully stops.
  const onRegionChangeComplete = useCallback((_region: Region, details: Details) => {
    console.log('[GPS-MAP] onRegionChangeComplete  isGesture =', details.isGesture);
    if (details.isGesture === true) {
      // User released the map — resume auto-follow after 6 s of inactivity.
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        console.log('[GPS-MAP] → auto-follow resumed (6 s since last pan)');
        userPanningRef.current = false;
      }, 6_000);
    } else {
      // Programmatic animateToRegion ended (isGesture=false or undefined).
      // Android fires onRegionChange with isGesture=true during animateToRegion
      // (false positive) which permanently sets userPanningRef=true.
      // This is the reliable reset point: clear the false-positive flag
      // so the next GPS update can call animateToRegion again.
      userPanningRef.current = false;
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    }
  }, []);

  const topOff = insets.top + 14;
  const cfg    = VEHICLE[vehicleType];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={S.root}>

      {/* Dark canvas behind the map */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0a0d12' }]} />

      
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude:       gpsData?.latitude  ?? 20,
          longitude:      gpsData?.longitude ?? 0,
          latitudeDelta:  gpsData ? 0.009 : 60,
          longitudeDelta: gpsData ? 0.009 : 60,
        }}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {/* Vehicle marker — only rendered once first GPS fix arrives */}
        {markerCoord && (
          <Marker
            coordinate={markerCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges
            zIndex={10}
          >
            <VehicleMarker vehicleType={vehicleType} />
          </Marker>
        )}
      </MapView>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <View style={S.overlay}>
          <View style={S.overlayCard}>
            <ActivityIndicator color={G.grn} size="large" />
          </View>
          <Text style={S.overlayText}>Localisation du {cfg.label.toLowerCase()}…</Text>
        </View>
      )}

      {/* ── No GPS toast — non-blocking, floats over the map ─────────────── */}
      {!loading && error === 'no_gps' && (
        <View style={[S.noGpsToast, { top: topOff + 72 }]}>
          <Ionicons name="navigate-outline" size={14} color={G.dim} />
          <Text style={S.noGpsTxt}>En attente du {cfg.label.toLowerCase()}…</Text>
        </View>
      )}

      {/* ── Error overlay ─────────────────────────────────────────────────── */}
      {!loading && error === 'error' && (
        <View style={S.overlay}>
          <View style={[S.overlayCard, S.overlayCardRed]}>
            <Ionicons name="alert-circle-outline" size={32} color={G.red} />
          </View>
          <Text style={[S.overlayText, { color: G.red, marginTop: 4 }]}>Connexion GPS perdue</Text>
          <TouchableOpacity style={S.retryBtn} onPress={refresh} activeOpacity={0.8}>
            <Ionicons name="refresh" size={13} color={G.grn} />
            <Text style={S.retryTxt}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Back button — always accessible ──────────────────────────────── */}
      {onBack && (
        <TouchableOpacity
          style={[S.backBtn, { top: topOff, left: 14 }]}
          onPress={onBack}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={18} color={G.wh} />
        </TouchableOpacity>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0d12' },

  // ── Overlays ──────────────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    backgroundColor: G.overlay,
    zIndex: 20,
  },
  overlayCard: {
    width: 64, height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: G.bd,
  },
  overlayCardRed: {
    backgroundColor: G.redDim,
    borderColor: 'rgba(220,38,38,0.20)',
  },
  overlayText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── No GPS toast ──────────────────────────────────────────────────────────
  noGpsToast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: G.glass,
    borderWidth: 1,
    borderColor: G.bd,
    zIndex: 30,
    ...Platform.select({ android: { elevation: 6 } }),
  },
  noGpsTxt: {
    color: G.dim,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Retry button ──────────────────────────────────────────────────────────
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: G.grnDim,
    borderWidth: 1,
    borderColor: G.grnBd,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 2,
  },
  retryTxt: { color: G.grn, fontSize: 13, fontWeight: '700' },

  // ── Back button ───────────────────────────────────────────────────────────
  backBtn: {
    position: 'absolute',
    zIndex: 40,
    width: 38, height: 38,
    borderRadius: 13,
    backgroundColor: G.glass,
    borderWidth: 1,
    borderColor: G.bd,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ android: { elevation: 8 } }),
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    left: 14, right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.glass,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: G.bd,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 30,
    ...Platform.select({
      android: { elevation: 10 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.40, shadowRadius: 16 },
    }),
  },
  topBarSide: { width: 52, alignItems: 'flex-end' },
  topBarCenter: { flex: 1, alignItems: 'center', gap: 1 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: G.bd,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  topBarTitle: { color: G.wh, fontSize: 13, fontWeight: '800', letterSpacing: -0.3 },
  topBarSub: {
    color: G.dim, fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timeChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: G.bd,
    paddingHorizontal: 7, paddingVertical: 4,
  },
  timeTxt: {
    color: G.gr, fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ── FABs ──────────────────────────────────────────────────────────────────
  fabCol: {
    position: 'absolute',
    right: 14,
    zIndex: 30,
    gap: 10,
  },
  fab: {
    width: 42, height: 42,
    borderRadius: 15,
    backgroundColor: G.glassMd,
    borderWidth: 1,
    borderColor: G.bd,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 7 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
    }),
  },
  fabLiveDot: { width: 10, height: 10, borderRadius: 5 },

});
