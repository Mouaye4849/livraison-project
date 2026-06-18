import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#eef1ee',
  card:   '#ffffff',
  bd:     'rgba(0,0,0,0.08)',
  grn:    '#22c55e',
  grnDk:  '#166534',
  grnDim: 'rgba(34,197,94,0.12)',
  soft:   'rgba(34,197,94,0.10)',
  wh:     '#1a2e1a',
  gr:     '#6b7280',
  dim:    '#9ca3af',
} as const;

const ILLUS   = Math.min(width * 0.68, 260);
const ORBIT_R = ILLUS * 0.44;
const CTR_R   = (ILLUS * 0.46) / 2;
const PLANE_R = ILLUS * 0.48;

// ─── FadeUp ───────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(28);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    ty.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 120 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

// ─── FadeIn (scale + opacity) ─────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0.84);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
    sc.value = withDelay(delay, withSpring(1, { damping: 18, stiffness: 90 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: sc.value }],
  }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

// ─── Illustration ─────────────────────────────────────────────────────────────
function Illustration() {
  const orbit  = useSharedValue(0);
  const pulse  = useSharedValue(1);
  const floatA = useSharedValue(0);
  const floatB = useSharedValue(0);
  const truckX = useSharedValue(0);
  const plane  = useSharedValue(0);

  useEffect(() => {
    orbit.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 2600 }), withTiming(1, { duration: 2600 })),
      -1, true,
    );
    floatA.value = withRepeat(
      withSequence(withTiming(-8, { duration: 2200 }), withTiming(0, { duration: 2200 })),
      -1, true,
    );
    floatB.value = withRepeat(
      withSequence(withTiming(7, { duration: 1800 }), withTiming(0, { duration: 1800 })),
      -1, true,
    );
    truckX.value = withRepeat(
      withSequence(withTiming(6, { duration: 2000 }), withTiming(-6, { duration: 2000 })),
      -1, true,
    );
    plane.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // string concatenation — no template literals in worklets
  const orbitS  = useAnimatedStyle(() => ({ transform: [{ rotate: orbit.value + 'deg' }] }));
  const pulseS  = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const floatAS = useAnimatedStyle(() => ({ transform: [{ translateY: floatA.value }] }));
  const floatBS = useAnimatedStyle(() => ({ transform: [{ translateY: floatB.value }] }));
  const truckS  = useAnimatedStyle(() => ({ transform: [{ translateX: truckX.value }] }));
  const planeAnim = useAnimatedStyle(() => {
    const rad = (plane.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: PLANE_R * Math.sin(rad) },
        { translateY: PLANE_R * 0.56 * -Math.cos(rad) },
        { rotate: plane.value + 'deg' },
      ],
    };
  });

  // pixel-accurate dot positions — no percentage strings
  const topDotL    = ORBIT_R - 4;
  const bottomDotL = ORBIT_R - 3;
  const rightDotT  = ORBIT_R - 4;

  return (
    <View style={{ width: ILLUS, height: ILLUS, alignItems: 'center', justifyContent: 'center' }}>

      {/* Pulsing outer glow */}
      <Animated.View style={[
        S.ring,
        { width: ILLUS, height: ILLUS, borderRadius: ILLUS / 2, backgroundColor: C.soft },
        pulseS,
      ]} />

      {/* Concentric rings */}
      <View style={[S.ring, { width: ILLUS * 0.82, height: ILLUS * 0.82, borderRadius: ILLUS * 0.41, borderWidth: 1, borderColor: 'rgba(74,222,128,0.18)' }]} />
      <View style={[S.ring, { width: ILLUS * 0.62, height: ILLUS * 0.62, borderRadius: ILLUS * 0.31, borderWidth: 1, borderColor: 'rgba(74,222,128,0.30)' }]} />

      {/* Elliptical flight path — subtle globe-tilt feel */}
      <View style={[S.ring, { width: PLANE_R * 2, height: PLANE_R * 2 * 0.56, borderRadius: PLANE_R, borderWidth: 1, borderColor: 'rgba(74,222,128,0.13)' }]} />

      {/* Rotating orbit ring with dots */}
      <Animated.View style={[
        S.ring,
        { width: ILLUS * 0.88, height: ILLUS * 0.88, borderRadius: ORBIT_R },
        orbitS,
      ]}>
        <View style={{ position: 'absolute', top: -4,         left: topDotL,    width: 8, height: 8, borderRadius: 4, backgroundColor: C.grn }} />
        <View style={{ position: 'absolute', bottom: -3,      left: bottomDotL, width: 6, height: 6, borderRadius: 3, backgroundColor: C.grn }} />
        <View style={{ position: 'absolute', right: -4,       top: rightDotT,   width: 8, height: 8, borderRadius: 4, backgroundColor: '#facc15' }} />
      </Animated.View>

      {/* Central stage with delivery truck */}
      <View style={S.stage}>
        <Animated.View style={truckS}>
          <MaterialCommunityIcons name="truck-fast-outline" size={52} color={C.grn} />
        </Animated.View>
      </View>

      {/* Floating location pill */}
      <Animated.View style={[S.pill, { position: 'absolute', top: ILLUS * 0.08, left: -18 }, floatAS]}>
        <Ionicons name="location" size={13} color={C.grn} />
        <Text style={S.pillTxt}>Nouakchott</Text>
      </Animated.View>

      {/* Floating delivered pill */}
      <Animated.View style={[S.pill, { position: 'absolute', bottom: ILLUS * 0.08, right: -18 }, floatBS]}>
        <Ionicons name="checkmark-circle" size={13} color={C.grn} />
        <Text style={[S.pillTxt, { color: C.grn }]}>Livré !</Text>
      </Animated.View>

      {/* Floating express pill */}
      <Animated.View style={[S.pill, { position: 'absolute', top: ILLUS * 0.08, right: -10 }, floatBS]}>
        <Ionicons name="flash" size={13} color="#facc15" />
        <Text style={[S.pillTxt, { color: '#facc15' }]}>Express</Text>
      </Animated.View>

      {/* Orbiting airplane */}
      <Animated.View style={[{ position: 'absolute' }, planeAnim]}>
        <Ionicons name="airplane" size={14} color={C.grn} />
      </Animated.View>

    </View>
  );
}

// ─── LandingScreen ────────────────────────────────────────────────────────────
export default function LandingScreen() {
  const sc1 = useSharedValue(1);
  const sc2 = useSharedValue(1);

  const btn1 = useAnimatedStyle(() => ({ transform: [{ scale: sc1.value }] }));
  const btn2 = useAnimatedStyle(() => ({ transform: [{ scale: sc2.value }] }));

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Ambient gradient blobs */}
      <View style={[S.blob, { top: -140, right: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(180,14,14,0.11)' }]} />
      <View style={[S.blob, { bottom: -80, left: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(140,10,10,0.08)' }]} />

      <SafeAreaView style={S.safe} edges={['top', 'bottom']}>
        <View style={S.inner}>

          {/* ── LOGO ──────────────────────────────────── */}
          <FadeIn delay={0}>
            <View style={S.logoSection}>
              <View style={S.logoGlow} />
              <View style={S.logoCard}>
                <Image
                  source={require('../../assets/images/wasali-logo.png')}
                  style={S.logoImg}
                  resizeMode="contain"
                />
              </View>
            </View>
          </FadeIn>

          {/* ── ILLUSTRATION ──────────────────────────── */}
          <FadeIn delay={120}>
            <View style={{ alignItems: 'center' }}>
              <Illustration />
            </View>
          </FadeIn>

          {/* ── MARKETING TEXT + STATS ────────────────── */}
          <FadeUp delay={300}>
            <View style={S.textSection}>
              <Text style={S.headline}>
                {'Livrez partout en\n'}
                <Text style={{ color: C.grn }}>Mauritanie</Text>
              </Text>
              <Text style={S.sub}>
                Connectez-vous avec des voyageurs de confiance.{'\n'}Rapide, sécurisé, partout.
              </Text>

              <View style={S.statsRow}>
                {STATS.map(({ val, lbl }, i) => (
                  <React.Fragment key={i}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={S.statVal}>{val}</Text>
                      <Text style={S.statLbl}>{lbl}</Text>
                    </View>
                    {i < STATS.length - 1 && (
                      <View style={{ width: 1, height: 28, backgroundColor: C.bd }} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </FadeUp>

          {/* ── CTA BUTTONS ───────────────────────────── */}
          <FadeUp delay={460}>
            <View style={S.btnSection}>

              <Animated.View style={btn1}>
                <TouchableOpacity
                  style={S.btnLogin}
                  activeOpacity={1}
                  onPressIn={() => { sc1.value = withTiming(0.96, { duration: 80 }); }}
                  onPressOut={() => { sc1.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
                  onPress={() => router.push('/login')}
                >
                  <Text style={S.btnLoginTxt}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={18} color="rgba(15,20,25,0.60)" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={btn2}>
                <TouchableOpacity
                  style={S.btnRegister}
                  activeOpacity={1}
                  onPressIn={() => { sc2.value = withTiming(0.96, { duration: 80 }); }}
                  onPressOut={() => { sc2.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
                  onPress={() => router.push('/register' as Href)}
                >
                  <Text style={S.btnRegisterTxt}>Créer un compte</Text>
                </TouchableOpacity>
              </Animated.View>

              <Text style={S.legal}>
                {'En continuant, vous acceptez nos '}
                <Text style={{ color: 'rgba(74,222,128,0.85)', fontWeight: '600' }}>
                  {"Conditions d'utilisation"}
                </Text>
              </Text>

            </View>
          </FadeUp>

        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────
const STATS = [
  { val: '10K+', lbl: 'Livraisons'  },
  { val: '500+', lbl: 'Voyageurs'   },
  { val: '98%',  lbl: 'Satisfaction' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  blob: {
    position: 'absolute',
  },

  // ── LOGO
  logoSection: {
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: 8,
    width: 210,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(74,222,128,0.17)',
  },
  logoCard: {
    backgroundColor: C.wh,
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingVertical: 13,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.28, shadowRadius: 22 },
      android: { elevation: 11 },
    }),
  },
  logoImg: {
    width: 158,
    height: 54,
  },

  // ── ILLUSTRATION
  ring: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    position: 'absolute',
    width: ILLUS * 0.46,
    height: ILLUS * 0.46,
    borderRadius: CTR_R,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.grn, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  pillTxt: {
    color: C.wh,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── TEXT
  textSection: {
    alignItems: 'center',
  },
  headline: {
    color: C.wh,
    fontSize: Math.min(width * 0.078, 30),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: Math.min(width * 0.078, 30) * 1.28,
    marginBottom: 10,
  },
  sub: {
    color: C.gr,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.bd,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
  },
  statVal: {
    color: C.wh,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statLbl: {
    color: C.dim,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── BUTTONS
  btnSection: {
    gap: 11,
  },
  btnLogin: {
    height: 58,
    backgroundColor: C.grn,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...Platform.select({
      ios:     { shadowColor: C.grnDk, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
  },
  btnLoginTxt: {
    color: '#0f1419',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnRegister: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRegisterTxt: {
    color: C.wh,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  legal: {
    color: C.dim,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
