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
  Dimensions,
  StatusBar,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import { authService } from '@/services/auth.service';
import type { ApiError } from '@/types';

const { width } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#09080b',
  surface:     '#130f16',
  card:        '#1b1420',
  border:      'rgba(255,255,255,0.07)',
  borderFocus: 'rgba(220,38,38,0.50)',
  sep:         'rgba(255,255,255,0.05)',
  red:         '#dc2626',
  redDim:      'rgba(220,38,38,0.12)',
  redBorder:   'rgba(220,38,38,0.32)',
  white:       '#ffffff',
  gray:        '#9ca3af',
  dim:         '#5a5a5a',
  check:       '#22c55e',
} as const;

type Role = 'CLIENT' | 'VOYAGEUR';

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(name: string, email: string, password: string): string | null {
  if (!name.trim() || name.trim().length < 2)          return 'Le nom doit contenir au moins 2 caractères';
  if (!email.trim() || !/\S+@\S+\.\S+/.test(email))   return 'Adresse email invalide';
  if (!password || password.length < 6)                return 'Mot de passe trop court (min. 6 caractères)';
  return null;
}

// ─── FadeUp ───────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(26);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) }));
    ty.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 115 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

// ─── SlideIn (from left or right) ────────────────────────────────────────────
function SlideIn({ children, delay = 0, from = 1 }: { children: React.ReactNode; delay?: number; from?: 1 | -1 }) {
  const op = useSharedValue(0);
  const tx = useSharedValue(40 * from);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    tx.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 120 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: tx.value }],
  }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────
function ErrorBanner({ text }: { text: string }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(-8);

  useEffect(() => {
    op.value = withTiming(1, { duration: 200 });
    ty.value = withSpring(0, { damping: 16, stiffness: 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[ST.errBox, s]}>
      <Ionicons name="warning-outline" size={15} color={C.red} />
      <Text style={ST.errTxt}>{text}</Text>
    </Animated.View>
  );
}

// ─── RoleCard ─────────────────────────────────────────────────────────────────
interface RoleCardProps {
  role:      Role;
  selected:  Role;
  onSelect:  (r: Role) => void;
  icon:      string;
  label:     string;
  desc:      string;
}

function RoleCard({ role, selected, onSelect, icon, label, desc }: RoleCardProps) {
  const active = selected === role;
  const sc = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));

  return (
    <Animated.View style={[{ flex: 1 }, anim]}>
      <TouchableOpacity
        style={[ST.roleCard, active && ST.roleCardActive]}
        onPress={() => {
          sc.value = withSpring(0.95, { damping: 10, stiffness: 400 }, () => {
            sc.value = withSpring(1, { damping: 14, stiffness: 300 });
          });
          onSelect(role);
        }}
        activeOpacity={0.9}
      >
        {/* Selection indicator */}
        <View style={[ST.roleCheck, active && ST.roleCheckActive]}>
          {active && <Ionicons name="checkmark" size={11} color={C.white} />}
        </View>

        {/* Icon area */}
        <View style={[ST.roleIconWrap, active && ST.roleIconWrapActive]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={28}
            color={active ? C.red : C.dim}
          />
        </View>

        <Text style={[ST.roleLabel, active && ST.roleLabelActive]}>{label}</Text>
        <Text style={ST.roleDesc}>{desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── FieldRow ─────────────────────────────────────────────────────────────────
interface FieldRowProps {
  icon:             keyof typeof Ionicons.glyphMap;
  placeholder:      string;
  value:            string;
  onChangeText:     (v: string) => void;
  secureTextEntry?: boolean;
  rightElement?:    React.ReactNode;
  keyboardType?:    'default' | 'email-address';
  returnKeyType?:   'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
  inputRef?:        React.RefObject<RNTextInput | null>;
  last?:            boolean;
}

function FieldRow({
  icon, placeholder, value, onChangeText,
  secureTextEntry = false, rightElement,
  keyboardType = 'default', returnKeyType = 'next',
  onSubmitEditing, inputRef, last = false,
}: FieldRowProps) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <View style={[ST.fieldRow, focused && ST.fieldRowFocused]}>
        <Ionicons
          name={icon}
          size={17}
          color={focused ? C.red : C.dim}
          style={{ marginRight: 12 }}
        />
        <TextInput
          ref={inputRef}
          style={ST.fieldInput}
          placeholder={placeholder}
          placeholderTextColor={C.dim}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {rightElement}
      </View>
      {!last && <View style={ST.fieldSep} />}
    </>
  );
}

// ─── RegisterScreen ───────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [role,     setRole]     = useState<Role>('CLIENT');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const emailRef = useRef<RNTextInput>(null);
  const pwdRef   = useRef<RNTextInput>(null);

  const btnScale = useSharedValue(1);
  const btnAnim  = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const clearError = () => setError(null);

  const handleRegister = async () => {
    const msg = validate(name, email, password);
    if (msg) { setError(msg); return; }

    setError(null);
    setLoading(true);
    try {
      const payload = {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password,
      };
      if (role === 'CLIENT') {
        await authService.registerClient(payload);
      } else {
        await authService.registerVoyageur(payload);
      }
      router.replace({ pathname: '/login', params: { registered: '1' } } as any);
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
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={{ flex: 1, backgroundColor: C.bg }}>

        {/* ── Background blobs ────────────────────────── */}
        <View style={[ST.blob, { top: -80, left: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(100,10,120,0.09)' }]} />
        <View style={[ST.blob, { bottom: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(180,15,15,0.10)' }]} />
        <View style={[ST.blob, { top: '40%', right: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(220,38,38,0.05)' }]} />

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
                    <Text style={ST.headerTitle}>Créer un compte</Text>
                    <View style={ST.headerBrand}>
                      <View style={ST.brandDot} />
                      <Text style={ST.brandName}>WASALI</Text>
                    </View>
                  </View>

                  {/* Step indicator */}
                  <View style={ST.steps}>
                    <View style={[ST.step, ST.stepActive]} />
                    <View style={ST.step} />
                  </View>
                </View>
              </FadeUp>

              {/* ── TAGLINE ─────────────────────────────── */}
              <FadeUp delay={80}>
                <View style={ST.tagline}>
                  <Text style={ST.taglineText}>
                    Rejoignez <Text style={{ color: C.red }}>+10 000</Text> utilisateurs en Mauritanie
                  </Text>
                </View>
              </FadeUp>

              {/* ── ROLE SELECTOR ───────────────────────── */}
              <FadeUp delay={140}>
                <View style={ST.section}>
                  <View style={ST.sectionHeader}>
                    <View style={ST.sectionLine} />
                    <Text style={ST.sectionLabel}>Je suis un</Text>
                    <View style={ST.sectionLine} />
                  </View>

                  <View style={ST.roleRow}>
                    <SlideIn delay={200} from={-1}>
                      <RoleCard
                        role="CLIENT"
                        selected={role}
                        onSelect={(r) => { setRole(r); clearError(); }}
                        icon="package-variant-closed"
                        label="Client"
                        desc={"J'envoie\ndes colis"}
                      />
                    </SlideIn>

                    <View style={{ width: 12 }} />

                    <SlideIn delay={200} from={1}>
                      <RoleCard
                        role="VOYAGEUR"
                        selected={role}
                        onSelect={(r) => { setRole(r); clearError(); }}
                        icon="truck-fast-outline"
                        label="Voyageur"
                        desc={"Je transporte\ndes colis"}
                      />
                    </SlideIn>
                  </View>
                </View>
              </FadeUp>

              {/* ── FORM ────────────────────────────────── */}
              <FadeUp delay={280}>
                <View style={ST.section}>
                  <View style={ST.sectionHeader}>
                    <View style={ST.sectionLine} />
                    <Text style={ST.sectionLabel}>Vos informations</Text>
                    <View style={ST.sectionLine} />
                  </View>

                  <View style={ST.fieldCard}>
                    <FieldRow
                      icon="person-outline"
                      placeholder="Nom complet"
                      value={name}
                      onChangeText={(v) => { setName(v); clearError(); }}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                    <FieldRow
                      icon="mail-outline"
                      placeholder="votre@email.com"
                      value={email}
                      onChangeText={(v) => { setEmail(v); clearError(); }}
                      keyboardType="email-address"
                      returnKeyType="next"
                      onSubmitEditing={() => pwdRef.current?.focus()}
                      inputRef={emailRef}
                    />
                    <FieldRow
                      icon="lock-closed-outline"
                      placeholder="Mot de passe (min. 6)"
                      value={password}
                      onChangeText={(v) => { setPassword(v); clearError(); }}
                      secureTextEntry={!showPwd}
                      returnKeyType="go"
                      onSubmitEditing={handleRegister}
                      inputRef={pwdRef}
                      last
                      rightElement={
                        <TouchableOpacity
                          onPress={() => setShowPwd((p) => !p)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                            size={17}
                            color={C.dim}
                          />
                        </TouchableOpacity>
                      }
                    />
                  </View>
                </View>
              </FadeUp>

              {/* ── PASSWORD HINT ───────────────────────── */}
              <FadeUp delay={340}>
                <View style={ST.hintRow}>
                  <Ionicons name="shield-checkmark-outline" size={13} color={C.dim} />
                  <Text style={ST.hintText}>
                    Votre mot de passe est chiffré et sécurisé
                  </Text>
                </View>
              </FadeUp>

              {/* ── ERROR ───────────────────────────────── */}
              {error && <ErrorBanner key={error} text={error} />}

              {/* ── SUBMIT ──────────────────────────────── */}
              <FadeUp delay={400}>
                <Animated.View style={[ST.btnWrap, btnAnim]}>
                  <TouchableOpacity
                    style={[ST.btn, loading && { opacity: 0.75 }]}
                    onPress={handleRegister}
                    onPressIn={() => { btnScale.value = withTiming(0.97, { duration: 80 }); }}
                    onPressOut={() => { btnScale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
                    disabled={loading}
                    activeOpacity={1}
                  >
                    {loading ? (
                      <ActivityIndicator color={C.white} size="small" />
                    ) : (
                      <>
                        <Text style={ST.btnTxt}>Créer mon compte</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color={C.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </FadeUp>

              {/* ── ROLE BADGE BELOW BUTTON ─────────────── */}
              <FadeUp delay={440}>
                <View style={ST.roleBadge}>
                  <View style={ST.roleBadgeDot} />
                  <Text style={ST.roleBadgeText}>
                    Inscription en tant que{' '}
                    <Text style={{ color: C.red, fontWeight: '700' }}>
                      {role === 'CLIENT' ? 'Client' : 'Voyageur'}
                    </Text>
                  </Text>
                </View>
              </FadeUp>

              {/* ── LOGIN LINK ──────────────────────────── */}
              <FadeUp delay={480}>
                <View style={ST.footer}>
                  <Text style={ST.footerTxt}>Déjà un compte ?</Text>
                  <TouchableOpacity
                    onPress={() => router.replace('/login')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={ST.footerLink}> Se connecter</Text>
                  </TouchableOpacity>
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
const CARD_W = (width - 48 - 12) / 2;

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

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: C.red,
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
    backgroundColor: C.red,
    width: 28,
  },

  // TAGLINE
  tagline: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  taglineText: {
    color: C.gray,
    fontSize: 13.5,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // SECTION
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.sep,
  },
  sectionLabel: {
    color: C.dim,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ROLE CARDS
  roleRow: {
    flexDirection: 'row',
  },
  roleCard: {
    width: CARD_W,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 8,
    position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  roleCardActive: {
    borderColor: C.red,
    backgroundColor: 'rgba(220,38,38,0.08)',
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  roleCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheckActive: {
    backgroundColor: C.red,
    borderColor: C.red,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  roleIconWrapActive: {
    backgroundColor: C.redDim,
    borderColor: C.redBorder,
  },
  roleLabel: {
    color: C.gray,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  roleLabelActive: {
    color: C.white,
  },
  roleDesc: {
    color: C.dim,
    fontSize: 11,
    lineHeight: 16,
  },

  // FIELD CARD
  fieldCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.20, shadowRadius: 14 },
      android: { elevation: 4 },
    }),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
  },
  fieldRowFocused: {
    backgroundColor: 'rgba(220,38,38,0.04)',
  },
  fieldSep: {
    height: 1,
    backgroundColor: C.sep,
    marginHorizontal: 16,
  },
  fieldInput: {
    flex: 1,
    color: C.white,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // HINT
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  hintText: {
    color: C.dim,
    fontSize: 11,
    lineHeight: 15,
  },

  // ERROR
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220,38,38,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
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

  // BUTTON
  btnWrap: {
    marginBottom: 12,
  },
  btn: {
    backgroundColor: C.red,
    borderRadius: 16,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
  },
  btnTxt: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ROLE BADGE
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  roleBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.check,
  },
  roleBadgeText: {
    color: C.dim,
    fontSize: 12,
    fontWeight: '500',
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerTxt: {
    color: C.dim,
    fontSize: 14,
  },
  footerLink: {
    color: C.red,
    fontSize: 14,
    fontWeight: '700',
  },
});
