import React, { useState, useRef, useEffect } from 'react';
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
  Image,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import { authService } from '@/services/auth.service';
import type { ApiError } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#eef1ee',
  bgCard:       '#ffffff',
  surface:      '#f0f4f0',
  border:       'rgba(0,0,0,0.08)',
  borderFocus:  'rgba(34,197,94,0.50)',
  grn:          '#22c55e',
  grnDk:        '#166534',
  grnGlow:      'rgba(34,197,94,0.18)',
  red:          '#dc2626',
  redDim:       'rgba(220,38,38,0.10)',
  white:        '#1a2e1a',
  gray:         '#6b7280',
  grayDim:      '#9ca3af',
} as const;

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(email: string, password: string): string | null {
  if (!email.trim())                       return "L'adresse email est requise";
  if (!/\S+@\S+\.\S+/.test(email.trim())) return 'Adresse email invalide';
  if (!password)                           return 'Le mot de passe est requis';
  if (password.length < 6)                return 'Mot de passe trop court (min. 6 caractères)';
  return null;
}

// ─── FadeScale ────────────────────────────────────────────────────────────────
function FadeScale({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.82);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    scale.value   = withDelay(delay, withSpring(1, { damping: 18, stiffness: 90 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── FadeUp ───────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── PulseDot ─────────────────────────────────────────────────────────────────
function PulseDot() {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, true,
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 800 }), withTiming(0.9, { duration: 800 })),
      -1, true,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseDot, animStyle]} />;
}

// ─── ErrorMessage ─────────────────────────────────────────────────────────────
function ErrorMessage({ text }: { text: string }) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(-10);

  useEffect(() => {
    opacity.value    = withTiming(1, { duration: 220 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.errorBox, style]}>
      <Ionicons name="alert-circle-outline" size={15} color={C.red} />
      <Text style={styles.errorText}>{text}</Text>
    </Animated.View>
  );
}

// ─── InputField ───────────────────────────────────────────────────────────────
interface InputFieldProps {
  icon:             keyof typeof Ionicons.glyphMap;
  placeholder:      string;
  value:            string;
  onChangeText:     (v: string) => void;
  secureTextEntry?: boolean;
  rightElement?:    React.ReactNode;
  onSubmitEditing?: () => void;
  returnKeyType?:   'done' | 'next' | 'go';
  keyboardType?:    'default' | 'email-address';
  inputRef?:        React.RefObject<RNTextInput | null>;
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  rightElement,
  onSubmitEditing,
  returnKeyType = 'done',
  keyboardType  = 'default',
  inputRef,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
      <Ionicons
        name={icon}
        size={18}
        color={focused ? C.grn : C.grayDim}
        style={styles.inputIcon}
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.grayDim}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
      />
      {rightElement}
    </View>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const params = useLocalSearchParams<{ registered?: string }>();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [successMsg] = useState<string | null>(
    params.registered === '1' ? 'Compte créé avec succès, connectez-vous.' : null,
  );

  const passwordRef = useRef<RNTextInput>(null);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const clearError = () => setError(null);

  const handleLogin = async () => {
    const validationMsg = validate(email, password);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authService.login({ email: email.trim().toLowerCase(), password });
      router.replace('/(dashboard)/home' as any);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        (axiosErr.response
          ? `Erreur serveur (${axiosErr.response.status})`
          : `Serveur inaccessible — ${axiosErr.code ?? axiosErr.message}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── Background gradient blobs ─────────────────── */}
        <View style={styles.bgBlobTopRight}   pointerEvents="none" />
        <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
        <View style={styles.bgBlobCenter}     pointerEvents="none" />

        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── LOGO HERO ─────────────────────────────────── */}
            <FadeScale delay={0}>
              <View style={styles.logoHero}>

                {/* Glow derrière le logo */}
                <View style={styles.logoGlowOuter} pointerEvents="none" />
                <View style={styles.logoGlowInner} pointerEvents="none" />

                {/* Logo card */}
                <View style={styles.logoCard}>
                  <Image
                    source={require('../assets/images/wasali-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Pulse dot */}
                <View style={styles.pulseDotRow}>
                  <PulseDot />
                </View>

                {/* Texte professionnel */}
                <Text style={styles.heroTitle}>
                  Bienvenue sur{' '}
                  <Text style={styles.heroTitleRed}>WASALI</Text>
                </Text>
                <Text style={styles.heroSub}>
                  Livraison rapide & sécurisée en Mauritanie
                </Text>

                {/* Badge */}
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Plateforme #1 en Mauritanie</Text>
                </View>

              </View>
            </FadeScale>

            {/* ── FORM ─────────────────────────────────────── */}
            <FadeUp delay={200}>
              <View style={styles.formCard}>

                <Text style={styles.formTitle}>Connexion</Text>

                {/* Email */}
                <View style={styles.field}>
                  <Text style={styles.label}>Adresse email</Text>
                  <InputField
                    icon="mail-outline"
                    placeholder="votre@email.com"
                    value={email}
                    onChangeText={(v) => { setEmail(v); clearError(); }}
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>

                {/* Password */}
                <View style={styles.field}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <InputField
                    icon="lock-closed-outline"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={(v) => { setPassword(v); clearError(); }}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    inputRef={passwordRef}
                    rightElement={
                      <TouchableOpacity
                        onPress={() => setShowPassword((p) => !p)}
                        style={styles.eyeBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={C.grayDim}
                        />
                      </TouchableOpacity>
                    }
                  />
                </View>

                {/* Success (post-register) */}
                {successMsg && (
                  <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle-outline" size={15} color="#22c55e" />
                    <Text style={styles.successText}>{successMsg}</Text>
                  </View>
                )}

                {/* Error */}
                {error && <ErrorMessage key={error} text={error} />}

                {/* Submit */}
                <Animated.View style={[styles.btnWrap, btnStyle]}>
                  <TouchableOpacity
                    style={[styles.btn, loading && styles.btnLoading]}
                    onPress={handleLogin}
                    onPressIn={() => { btnScale.value = withTiming(0.97, { duration: 80 }); }}
                    onPressOut={() => { btnScale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
                    disabled={loading}
                    activeOpacity={1}
                  >
                    {loading
                      ? <ActivityIndicator color="#0f1419" size="small" />
                      : (
                        <>
                          <Text style={styles.btnText}>Se connecter</Text>
                          <Ionicons name="arrow-forward" size={18} color="rgba(15,20,25,0.60)" />
                        </>
                      )
                    }
                  </TouchableOpacity>
                </Animated.View>

              </View>
            </FadeUp>

            {/* ── REGISTER LINK ────────────────────────────── */}
            <FadeUp delay={320}>
              <View style={styles.footer}>
                <Text style={styles.footerText}>Pas encore de compte ?</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/register' as Href)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.footerLink}> S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </FadeUp>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 52,
  },

  // ── BACKGROUND GRADIENT BLOBS
  bgBlobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  bgBlobCenter: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },

  // ── LOGO HERO
  logoHero: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 8,
  },
  logoGlowOuter: {
    position: 'absolute',
    top: 8,
    width: 220,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.grnGlow,
  },
  logoGlowInner: {
    position: 'absolute',
    top: 18,
    width: 160,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.grnGlow,
  },
  logoCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  logoImage: {
    width: 180,
    height: 70,
  },
  pulseDotRow: {
    marginBottom: 14,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.grn,
  },
  heroTitle: {
    color: C.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 30,
  },
  heroTitleRed: {
    color: C.grn,
  },
  heroSub: {
    color: C.gray,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  badgeText: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── FORM CARD
  formCard: {
    backgroundColor: C.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.20)',
    padding: 24,
    marginBottom: 20,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.30,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
    }),
  },
  formTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 18,
  },
  field: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: 'rgba(0,0,0,0.50)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── INPUT
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapFocused: {
    borderColor: C.borderFocus,
    backgroundColor: 'rgba(34,197,94,0.06)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: C.white,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  // ── SUCCESS
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },
  successText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // ── ERROR
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220,38,38,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // ── BUTTON
  btnWrap: {
    marginTop: 4,
  },
  btn: {
    backgroundColor: C.grn,
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: C.grnDk,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.55,
        shadowRadius: 18,
      },
      android: { elevation: 10 },
    }),
  },
  btnLoading: {
    opacity: 0.75,
  },
  btnText: {
    color: '#0f1419',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    color: C.grayDim,
    fontSize: 14,
  },
  footerLink: {
    color: C.grn,
    fontSize: 14,
    fontWeight: '700',
  },
});
