import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import { authService } from '@/services/auth.service';
import type { ApiError } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_LENGTH      = 6;
const EXPIRY_SECONDS  = 10 * 60;
const RESEND_COOLDOWN = 60;

// ─── Design tokens (same palette as register/login) ───────────────────────────

const C = {
  bg:          '#eef1ee',
  surface:     '#ffffff',
  card:        '#f0f4f0',
  border:      'rgba(0,0,0,0.08)',
  borderFocus: 'rgba(34,197,94,0.55)',
  grn:         '#22c55e',
  grnDk:       '#166534',
  grnDim:      'rgba(34,197,94,0.12)',
  red:         '#dc2626',
  redDim:      'rgba(220,38,38,0.10)',
  redBorder:   'rgba(220,38,38,0.25)',
  white:       '#1a2e1a',
  gray:        '#6b7280',
  dim:         '#9ca3af',
  sep:         'rgba(0,0,0,0.04)',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Animation helpers ────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(24);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    ty.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 115 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity:   op.value,
    transform: [{ translateY: ty.value }],
  }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

function ErrorBanner({ text }: { text: string }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(-8);

  useEffect(() => {
    op.value = withTiming(1, { duration: 200 });
    ty.value = withSpring(0, { damping: 16, stiffness: 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity:   op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[ST.errBox, s]}>
      <Ionicons name="warning-outline" size={15} color={C.red} />
      <Text style={ST.errTxt}>{text}</Text>
    </Animated.View>
  );
}

function SuccessBanner({ text }: { text: string }) {
  const op = useSharedValue(0);
  useEffect(() => { op.value = withTiming(1, { duration: 300 }); }, []);
  const s = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={[ST.successBox, s]}>
      <Ionicons name="checkmark-circle-outline" size={17} color={C.grn} />
      <Text style={ST.successTxt}>{text}</Text>
    </Animated.View>
  );
}

// ─── VerifyOtpScreen ──────────────────────────────────────────────────────────

export default function VerifyOtpScreen() {
  const params    = useLocalSearchParams<{ email: string }>();
  const email     = params.email ?? '';

  const [digits,         setDigits]         = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [success,        setSuccess]        = useState(false);
  const [expiryLeft,     setExpiryLeft]     = useState(EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const btnScale  = useSharedValue(1);
  const btnAnim   = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  // Redirect if arrived without an email
  useEffect(() => {
    if (!email) router.replace('/register');
  }, [email]);

  // Expiry countdown
  useEffect(() => {
    if (expiryLeft <= 0) return;
    const t = setInterval(() => setExpiryLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [expiryLeft]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Input handlers ──────────────────────────────────────────────────────────

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    setDigits(next);
    setError(null);

    if (sanitized && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Verify ──────────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Veuillez entrer les 6 chiffres du code');
      return;
    }
    if (expiryLeft <= 0) {
      setError('Code expiré. Demandez un nouveau code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authService.verifyOtp({ email, code });

setSuccess(true);

setTimeout(() => {
  router.replace('/(dashboard)/home');
}, 1500);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        'Code incorrect. Veuillez réessayer.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ──────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      await authService.resendOtp(email);
      setResendCooldown(RESEND_COOLDOWN);
      setExpiryLeft(EXPIRY_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(
        axiosErr.response?.data?.message ||
        "Impossible d'envoyer un nouveau code.",
      );
    }
  };

  if (!email) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, backgroundColor: C.bg }}>

        {/* Background blobs */}
        <View style={[ST.blob, { top: -80, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(34,197,94,0.09)' }]} />
        <View style={[ST.blob, { bottom: -60, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(34,197,94,0.06)' }]} />

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={ST.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* ── HEADER ──────────────────────────────── */}
              <FadeUp delay={0}>
                <View style={ST.header}>
                  <TouchableOpacity
                    style={ST.backBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="arrow-back" size={20} color={C.white} />
                  </TouchableOpacity>

                  <View style={ST.headerCenter}>
                    <Text style={ST.headerTitle}>Vérification email</Text>
                    <View style={ST.headerBrand}>
                      <View style={ST.brandDot} />
                      <Text style={ST.brandName}>WASALI</Text>
                    </View>
                  </View>

                  {/* Step indicator — step 2 of 2 */}
                  <View style={ST.steps}>
                    <View style={ST.step} />
                    <View style={[ST.step, ST.stepActive]} />
                  </View>
                </View>
              </FadeUp>

              {/* ── ICON + TITLE ────────────────────────── */}
              <FadeUp delay={80}>
                <View style={ST.heroSection}>
                  <View style={ST.iconWrap}>
                    <Ionicons name="mail-open-outline" size={36} color={C.grn} />
                  </View>
                  <Text style={ST.heroTitle}>Code de vérification</Text>
                  <Text style={ST.heroSub}>
                    Nous avons envoyé un code à{'\n'}
                    <Text style={ST.heroEmail}>{email}</Text>
                  </Text>
                </View>
              </FadeUp>

              {/* ── OTP INPUTS ──────────────────────────── */}
              <FadeUp delay={160}>
                <View style={ST.otpSection}>
                  <View style={ST.otpRow}>
                    {digits.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        style={[
                          ST.otpBox,
                          digit ? ST.otpBoxFilled : null,
                        ]}
                        value={digit}
                        onChangeText={(v) => handleDigitChange(i, v)}
                        onKeyPress={(e) => handleKeyPress(i, e)}
                        keyboardType="numeric"
                        maxLength={1}
                        textContentType="oneTimeCode"
                        autoComplete="one-time-code"
                        selectTextOnFocus
                        caretHidden
                      />
                    ))}
                  </View>
                </View>
              </FadeUp>

              {/* ── TIMER ───────────────────────────────── */}
              <FadeUp delay={220}>
                <View style={ST.timerRow}>
                  {expiryLeft > 0 ? (
                    <>
                      <Ionicons name="time-outline" size={14} color={expiryLeft < 60 ? C.red : C.dim} />
                      <Text style={[ST.timerText, expiryLeft < 60 && ST.timerTextUrgent]}>
                        Expire dans{' '}
                        <Text style={ST.timerBold}>{formatTime(expiryLeft)}</Text>
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="alert-circle-outline" size={14} color={C.red} />
                      <Text style={ST.timerExpired}>Code expiré</Text>
                    </>
                  )}
                </View>
              </FadeUp>

              {/* ── SUCCESS ─────────────────────────────── */}
              {success && (
                <FadeUp delay={0}>
                  <SuccessBanner text="Email vérifié avec succès ! Redirection vers la connexion..." />
                </FadeUp>
              )}

              {/* ── ERROR ───────────────────────────────── */}
              {error && <ErrorBanner key={error} text={error} />}

              {/* ── VERIFY BUTTON ───────────────────────── */}
              {!success && (
                <FadeUp delay={280}>
                  <Animated.View style={[ST.btnWrap, btnAnim]}>
                    <TouchableOpacity
                      style={[ST.btn, (loading || expiryLeft <= 0) && ST.btnDisabled]}
                      onPress={handleVerify}
                      onPressIn={() => { btnScale.value = withTiming(0.97, { duration: 80 }); }}
                      onPressOut={() => { btnScale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
                      disabled={loading || expiryLeft <= 0}
                      activeOpacity={1}
                    >
                      {loading ? (
                        <ActivityIndicator color="#0f1419" size="small" />
                      ) : (
                        <>
                          <Text style={ST.btnTxt}>Vérifier le code</Text>
                          <Ionicons name="checkmark-circle-outline" size={20} color="#0f1419" />
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </FadeUp>
              )}

              {/* ── RESEND ──────────────────────────────── */}
              <FadeUp delay={340}>
                <View style={ST.resendRow}>
                  <Text style={ST.resendLabel}>Vous n'avez pas reçu le code ?</Text>
                  {resendCooldown > 0 ? (
                    <Text style={ST.resendCooldown}>
                      Renvoyer dans{' '}
                      <Text style={{ fontWeight: '700' }}>{resendCooldown}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResend}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={ST.resendLink}>Renvoyer le code</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </FadeUp>

              {/* ── SECURITY NOTE ───────────────────────── */}
              <FadeUp delay={400}>
                <View style={ST.hintRow}>
                  <Ionicons name="shield-checkmark-outline" size={13} color={C.dim} />
                  <Text style={ST.hintText}>
                    Le code est valide 10 minutes et à usage unique
                  </Text>
                </View>
              </FadeUp>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ST = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },

  // ── HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    gap: 3,
  },
  headerTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.grn,
  },
  brandName: {
    color: C.dim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  steps: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  step: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.border,
  },
  stepActive: {
    backgroundColor: C.grn,
    width: 28,
  },

  // ── HERO
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.grnDim,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...Platform.select({
      ios:     { shadowColor: C.grn, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 18 },
      android: { elevation: 4 },
    }),
  },
  heroTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSub: {
    color: C.gray,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  heroEmail: {
    color: C.white,
    fontWeight: '600',
  },

  // ── OTP INPUTS
  otpSection: {
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: C.white,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  otpBoxFilled: {
    borderColor: C.grn,
    backgroundColor: C.grnDim,
  },

  // ── TIMER
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  timerText: {
    color: C.dim,
    fontSize: 13,
  },
  timerTextUrgent: {
    color: C.red,
  },
  timerBold: {
    fontWeight: '700',
  },
  timerExpired: {
    color: C.red,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── SUCCESS
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.28)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  successTxt: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },

  // ── ERROR
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: C.redBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
  },
  errTxt: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // ── BUTTON
  btnWrap: {
    marginBottom: 20,
  },
  btn: {
    backgroundColor: C.grn,
    borderRadius: 16,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios:     { shadowColor: C.grnDk, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnTxt: {
    color: '#0f1419',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── RESEND
  resendRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  resendLabel: {
    color: C.dim,
    fontSize: 13,
  },
  resendCooldown: {
    color: C.dim,
    fontSize: 13,
  },
  resendLink: {
    color: C.grn,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── HINT
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  hintText: {
    color: C.dim,
    fontSize: 11,
    lineHeight: 15,
  },
});
