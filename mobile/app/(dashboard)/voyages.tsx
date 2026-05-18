import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AxiosError } from 'axios';
import { trajetService } from '@/services/trajet.service';
import { colisService } from '@/services/colis.service';
import { useLocalSearchParams } from 'expo-router';
import { authService } from '@/services/auth.service';
import type { Trajet, TrajetRequest, Colis, ApiError } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#0a0a0a',
  card:   '#141414',
  input:  '#1a1a1a',
  bd:     'rgba(255,255,255,0.07)',
  red:    '#dc2626',
  redDim: 'rgba(220,38,38,0.12)',
  wh:     '#ffffff',
  gr:     '#9ca3af',
  dim:    '#4b5563',
  grn:    '#22c55e',
  grnDim: 'rgba(34,197,94,0.13)',
  ylw:    '#facc15',
  ylwDim: 'rgba(250,204,21,0.13)',
  blu:    '#3b82f6',
  bluDim: 'rgba(59,130,246,0.13)',
  pur:    '#a855f7',
  purDim: 'rgba(168,85,247,0.13)',
} as const;

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: 'En attente', color: C.gr,  bg: 'rgba(156,163,175,0.12)' },
  OUVERT:     { label: 'Ouvert',     color: C.grn,  bg: C.grnDim },
  COMPLET:    { label: 'Complet',    color: C.ylw,  bg: C.ylwDim },
  EN_COURS:   { label: 'En cours',   color: C.blu,  bg: C.bluDim },
  TERMINE:    { label: 'Terminé',    color: C.pur,  bg: C.purDim },
  ANNULE:     { label: 'Annulé',     color: C.dim,  bg: 'rgba(255,255,255,0.05)' },
  REFUSE:     { label: 'Refusé',     color: C.red,  bg: C.redDim },
};

const COLIS_STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  BROUILLON: { label: 'Brouillon', color: C.gr,  bg: 'rgba(156,163,175,0.12)' },
  PUBLIE:    { label: 'Publié',    color: C.blu,  bg: C.bluDim },
  ACCEPTE:   { label: 'Accepté',  color: C.ylw,  bg: C.ylwDim },
  EN_COURS:  { label: 'En cours', color: C.red,   bg: C.redDim },
  LIVRE:     { label: 'Livré',    color: C.grn,   bg: C.grnDim },
  TERMINE:   { label: 'Terminé',  color: C.pur,   bg: C.purDim },
  ANNULE:    { label: 'Annulé',   color: C.dim,   bg: 'rgba(255,255,255,0.05)' },
};

type TabKey = 'public' | 'mine';

// ─── TrajetCard ───────────────────────────────────────────────────────────────
function TrajetCard({ item, isOwner, onCancel, onAssignColis, onStartColis, onFinishColis }: {
  item: Trajet;
  isOwner: boolean;
  onCancel: (id: string) => void;
  onAssignColis: (trajet: Trajet) => void;
  onStartColis: (colisId: string) => void;
  onFinishColis: (colisId: string) => void;
}) {
  const cfg = STATUT_CFG[item.statut] ?? STATUT_CFG.EN_ATTENTE;
  const date = item.dateDepart
    ? new Date(item.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <View style={S.card}>
      <View style={S.cardTop}>
        <View style={S.routeBlock}>
          <View style={S.routePin}>
            <Ionicons name="radio-button-on" size={14} color={C.grn} />
            <Text style={S.routeCity} numberOfLines={1}>{item.origine}</Text>
          </View>
          <View style={S.routeLine} />
          <View style={S.routePin}>
            <Ionicons name="location" size={14} color={C.red} />
            <Text style={S.routeCity} numberOfLines={1}>{item.destination}</Text>
          </View>
        </View>
        <View style={[S.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[S.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={S.cardDetails}>
        <View style={S.detail}>
          <Ionicons name="calendar-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>{date}</Text>
        </View>
        <View style={S.detail}>
          <Ionicons name="scale-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>{item.capaciteKg} kg dispo.</Text>
        </View>
        {item.colis && item.colis.length > 0 && (
          <View style={S.detail}>
            <Ionicons name="cube-outline" size={13} color={C.gr} />
            <Text style={S.detailTxt}>{item.colis.length} colis</Text>
          </View>
        )}
      </View>

      {isOwner && item.statut === 'OUVERT' && (
        <TouchableOpacity
          style={S.assignBtn}
          activeOpacity={0.85}
          onPress={() => onAssignColis(item)}
        >
          <Ionicons name="cube-outline" size={15} color={C.wh} />
          <Text style={S.assignBtnTxt}>Gérer les colis</Text>
        </TouchableOpacity>
      )}

      {/* ── Colis delivery management (TrajetsWithColis flow) */}
      {isOwner && item.colis && item.colis.length > 0 && (
        <View style={S.colisSection}>
          <View style={S.colisSectionHeader}>
            <Ionicons name="cube-outline" size={12} color={C.gr} />
            <Text style={S.colisSectionLabel}>
              {item.colis.length} colis assigné{item.colis.length > 1 ? 's' : ''}
            </Text>
          </View>
          {item.colis.map(c => {
            const ccfg = COLIS_STATUT_CFG[c.statut] ?? COLIS_STATUT_CFG.BROUILLON;
            return (
              <View key={c.id} style={S.colisRow}>
                <View style={S.colisRowInfo}>
                  <Text style={S.colisRowName} numberOfLines={1}>{c.nom}</Text>
                  <View style={[S.colisBadge, { backgroundColor: ccfg.bg }]}>
                    <Text style={[S.colisBadgeTxt, { color: ccfg.color }]}>{ccfg.label}</Text>
                  </View>
                </View>
                {c.statut === 'ACCEPTE' && (
                  <TouchableOpacity
                    style={S.deliveryStartBtn}
                    activeOpacity={0.85}
                    onPress={() => onStartColis(c.id)}
                  >
                    <Ionicons name="play" size={11} color={C.wh} />
                    <Text style={S.deliveryBtnTxt}>Démarrer</Text>
                  </TouchableOpacity>
                )}
                {c.statut === 'EN_COURS' && (
                  <TouchableOpacity
                    style={S.deliveryFinishBtn}
                    activeOpacity={0.85}
                    onPress={() => onFinishColis(c.id)}
                  >
                    <Ionicons name="checkmark" size={11} color={C.wh} />
                    <Text style={S.deliveryBtnTxt}>Livré</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {isOwner && (item.statut === 'EN_ATTENTE' || item.statut === 'OUVERT') && (
        <TouchableOpacity
          style={S.cancelBtn}
          activeOpacity={0.85}
          onPress={() => onCancel(item.id)}
        >
          <Text style={S.cancelBtnTxt}>Annuler ce voyage</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Capacity presets ─────────────────────────────────────────────────────────
const CAPACITY_PRESETS = [5, 10, 20, 50];

// ─── CreateTrajetModal ────────────────────────────────────────────────────────
function CreateTrajetModal({ visible, onClose, onCreated }: {
  visible:   boolean;
  onClose:   () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [form, setForm]       = useState<TrajetRequest>({
    origine: '', destination: '', dateDepart: '', capaciteKg: 0,
  });

  // Animation values
  const btnScale  = useSharedValue(1);
  const shakeX    = useSharedValue(0);
  const errOpacity= useSharedValue(0);

  const btnAnim   = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const errAnim   = useAnimatedStyle(() => ({ opacity: errOpacity.value, transform: [{ translateY: (1 - errOpacity.value) * -8 }] }));

  const set = (k: keyof TrajetRequest, v: string) => {
    setForm(f => ({ ...f, [k]: k === 'capaciteKg' ? (parseFloat(v) || 0) : v }));
  };

  const adjustCapacity = (delta: number) => {
    setForm(f => ({ ...f, capaciteKg: Math.max(0, Math.min(999, f.capaciteKg + delta)) }));
  };

  const validate = (): string | null => {
    if (!form.origine.trim())     return 'La ville de départ est requise';
    if (!form.destination.trim()) return 'La destination est requise';
    if (!form.dateDepart.trim())  return 'La date de départ est requise';
    if (form.capaciteKg <= 0)     return 'La capacité doit être supérieure à 0';
    return null;
  };

  const showError = (msg: string) => {
    setErr(msg);
    errOpacity.value = withTiming(1, { duration: 250 });
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(8,  { duration: 60 }),
      withTiming(-5, { duration: 60 }),
      withTiming(5,  { duration: 60 }),
      withTiming(0,  { duration: 60 }),
    );
  };

  const handleSubmit = async () => {
    const e = validate();
    if (e) { showError(e); return; }

    btnScale.value = withSpring(0.96, { damping: 10, stiffness: 400 }, () => {
      btnScale.value = withSpring(1);
    });

    setSaving(true);
    setErr('');
    errOpacity.value = withTiming(0);
    try {
      await trajetService.create(form);
      onCreated();
      onClose();
      setForm({ origine: '', destination: '', dateDepart: '', capaciteKg: 0 });
    } catch (ex) {
      const ae = (ex as AxiosError<ApiError>).response?.data;
      showError(ae?.message ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const shakeAnim = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={SM.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={SM.sheet}
        >
          {/* Drag handle */}
          <View style={SM.handle} />

          {/* ── Header ──────────────────────────────────────── */}
          <View style={SM.header}>
            <View style={SM.headerLeft}>
              <View style={SM.headerIconWrap}>
                <Ionicons name="airplane" size={20} color={C.red} />
              </View>
              <View>
                <Text style={SM.headerTitle}>Nouveau voyage</Text>
                <Text style={SM.headerSub}>Renseignez les détails de votre trajet</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={SM.closeBtn} activeOpacity={0.75}>
              <Ionicons name="close" size={19} color={C.gr} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={SM.scroll}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Error banner ────────────────────────────── */}
            {err !== '' && (
              <Animated.View style={[SM.errBox, shakeAnim, errAnim]}>
                <View style={SM.errIconWrap}>
                  <Ionicons name="alert-circle" size={18} color={C.red} />
                </View>
                <Text style={SM.errTxt}>{err}</Text>
              </Animated.View>
            )}

            {/* ── ROUTE SECTION ───────────────────────────── */}
            <View style={SM.sectionRow}>
              <Ionicons name="map-outline" size={14} color={C.red} />
              <Text style={SM.sectionLabel}>Itinéraire</Text>
            </View>

            <View style={SM.routeCard}>
              {/* Departure row */}
              <View style={SM.routeRow}>
                <View style={SM.routeTimeline}>
                  <View style={[SM.routeDot, { backgroundColor: C.grn }]} />
                  <View style={SM.routeConnector} />
                </View>
                <View style={SM.routeFieldWrap}>
                  <Text style={SM.routeFieldLabel}>DÉPART</Text>
                  <TextInput
                    style={[SM.routeInput, focused === 'origine' && SM.routeInputActive]}
                    placeholder="Ville de départ"
                    placeholderTextColor={C.dim}
                    value={form.origine}
                    onChangeText={v => set('origine', v)}
                    onFocus={() => setFocused('origine')}
                    onBlur={() => setFocused(null)}
                    returnKeyType="next"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Destination row */}
              <View style={SM.routeRow}>
                <View style={SM.routeTimeline}>
                  <View style={[SM.routeDot, SM.routeDotDest]} />
                </View>
                <View style={SM.routeFieldWrap}>
                  <Text style={SM.routeFieldLabel}>ARRIVÉE</Text>
                  <TextInput
                    style={[SM.routeInput, focused === 'destination' && SM.routeInputActive]}
                    placeholder="Ville d'arrivée"
                    placeholderTextColor={C.dim}
                    value={form.destination}
                    onChangeText={v => set('destination', v)}
                    onFocus={() => setFocused('destination')}
                    onBlur={() => setFocused(null)}
                    returnKeyType="next"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Route preview pill */}
              {form.origine.trim() !== '' && form.destination.trim() !== '' && (
                <View style={SM.routePreview}>
                  <View style={SM.routePreviewDot} />
                  <Text style={SM.routePreviewTxt} numberOfLines={1}>
                    {form.origine.trim()} → {form.destination.trim()}
                  </Text>
                  <Ionicons name="airplane-outline" size={13} color={C.red} />
                </View>
              )}
            </View>

            {/* ── DATE SECTION ────────────────────────────── */}
            <View style={SM.sectionRow}>
              <Ionicons name="calendar-outline" size={14} color={C.red} />
              <Text style={SM.sectionLabel}>Date de départ</Text>
            </View>

            <View style={[SM.dateCard, focused === 'date' && SM.dateCardActive]}>
              <View style={SM.dateIconWrap}>
                <Ionicons name="calendar" size={20} color={C.red} />
              </View>
              <View style={SM.dateRight}>
                <TextInput
                  style={SM.dateInput}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={C.dim}
                  value={form.dateDepart}
                  onChangeText={v => set('dateDepart', v)}
                  onFocus={() => setFocused('date')}
                  onBlur={() => setFocused(null)}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  returnKeyType="next"
                />
                <Text style={SM.dateHint}>Format : 2025-06-15</Text>
              </View>
            </View>

            {/* ── CAPACITY SECTION ────────────────────────── */}
            <View style={SM.sectionRow}>
              <Ionicons name="scale-outline" size={14} color={C.red} />
              <Text style={SM.sectionLabel}>Capacité disponible</Text>
            </View>

            <View style={SM.capacityCard}>
              {/* Decrement */}
              <TouchableOpacity
                style={SM.stepBtn}
                onPress={() => adjustCapacity(-5)}
                activeOpacity={0.75}
              >
                <Ionicons name="remove" size={22} color={C.wh} />
              </TouchableOpacity>

              {/* Value display */}
              <View style={SM.capacityCenter}>
                <TextInput
                  style={SM.capacityInput}
                  value={form.capaciteKg > 0 ? String(form.capaciteKg) : ''}
                  onChangeText={v => set('capaciteKg', v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={C.dim}
                  textAlign="center"
                  maxLength={5}
                />
                <Text style={SM.capacityUnit}>kilogrammes</Text>
              </View>

              {/* Increment */}
              <TouchableOpacity
                style={SM.stepBtn}
                onPress={() => adjustCapacity(5)}
                activeOpacity={0.75}
              >
                <Ionicons name="add" size={22} color={C.wh} />
              </TouchableOpacity>
            </View>

            {/* Quick presets */}
            <View style={SM.presetsRow}>
              {CAPACITY_PRESETS.map(kg => (
                <TouchableOpacity
                  key={kg}
                  style={[SM.preset, form.capaciteKg === kg && SM.presetActive]}
                  onPress={() => setForm(f => ({ ...f, capaciteKg: kg }))}
                  activeOpacity={0.75}
                >
                  <Text style={[SM.presetTxt, form.capaciteKg === kg && SM.presetTxtActive]}>
                    {kg} kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── TRIP SUMMARY ────────────────────────────── */}
            {form.origine.trim() && form.destination.trim() && form.dateDepart.trim() && form.capaciteKg > 0 && (
              <View style={SM.summaryCard}>
                <View style={SM.summaryRow}>
                  <Ionicons name="checkmark-circle" size={16} color={C.grn} />
                  <Text style={SM.summaryTxt}>
                    {form.origine} → {form.destination} · {form.dateDepart} · {form.capaciteKg} kg
                  </Text>
                </View>
              </View>
            )}

            {/* ── SUBMIT ──────────────────────────────────── */}
            <Animated.View style={btnAnim}>
              <TouchableOpacity
                style={[SM.submitBtn, saving && { opacity: 0.65 }]}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.88}
              >
                {saving ? (
                  <ActivityIndicator color={C.wh} size="small" />
                ) : (
                  <>
                    <Ionicons name="airplane" size={18} color={C.wh} />
                    <Text style={SM.submitTxt}>Publier mon voyage</Text>
                    <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.65)" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Legal note */}
            <Text style={SM.legalTxt}>
              En publiant, vous acceptez les{' '}
              <Text style={{ color: 'rgba(220,38,38,0.75)', fontWeight: '600' }}>
                conditions WASALI
              </Text>
            </Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── AssignColisModal ─────────────────────────────────────────────────────────
function AssignColisModal({ trajet, visible, onClose, onAssigned }: {
  trajet:     Trajet | null;
  visible:    boolean;
  onClose:    () => void;
  onAssigned: () => void;
}) {
  const [available, setAvailable]     = useState<Colis[]>([]);
  const [selected,  setSelected]      = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [assigning,   setAssigning]   = useState(false);
  const [err,  setErr]                = useState('');
  const [done, setDone]               = useState(false);

  useEffect(() => {
    if (visible && trajet) {
      setSelected(null);
      setErr('');
      setDone(false);
      setAvailable([]);
      setLoadingList(true);
      loadAvailable(trajet.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, trajet]);

  const loadAvailable = async (trajetId: string) => {
    setLoadingList(true);
    try {
      const data = await colisService.getAvailableForTrajet(trajetId);
      setAvailable(data);
    } catch {
      setErr('Impossible de charger les colis compatibles');
    } finally {
      setLoadingList(false);
    }
  };

  const handleAssign = async () => {
    if (!trajet || !selected) return;
    setAssigning(true);
    setErr('');
    try {
      await colisService.assignToTrajet(selected, trajet.id);
      setDone(true);
      onAssigned();
      setTimeout(() => { onClose(); setDone(false); }, 1400);
    } catch (ex) {
      const ae = (ex as AxiosError<ApiError>).response?.data;
      setErr(
        ae?.message ??
        (ex as AxiosError).message ??
        'Erreur lors de l\'assignation',
      );
    } finally {
      setAssigning(false);
    }
  };

  if (!trajet) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={SA.overlay}>
        <View style={SA.sheet}>
          {/* ── Drag handle */}
          <View style={SA.handle} />

          {/* ── Header */}
          <View style={SA.header}>
            <View style={SA.headerLeft}>
              <View style={SA.iconWrap}>
                <Ionicons name="cube" size={20} color={C.grn} />
              </View>
              <View>
                <Text style={SA.title}>Colis disponibles</Text>
                <Text style={SA.subtitle} numberOfLines={1}>
                  {trajet.origine} → {trajet.destination}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={SA.closeBtn} activeOpacity={0.75}>
              <Ionicons name="close" size={19} color={C.gr} />
            </TouchableOpacity>
          </View>

          {/* ── Trajet info row */}
          <View style={SA.trajetInfo}>
            <View style={SA.trajetPill}>
              <Ionicons name="scale-outline" size={12} color={C.gr} />
              <Text style={SA.trajetPillTxt}>{trajet.capaciteKg} kg disponibles</Text>
            </View>
            <View style={SA.trajetPill}>
              <Ionicons name="calendar-outline" size={12} color={C.gr} />
              <Text style={SA.trajetPillTxt}>
                {new Date(trajet.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={SA.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Feedback banners */}
            {err !== '' && (
              <View style={SA.errBox}>
                <Ionicons name="alert-circle" size={16} color={C.red} />
                <Text style={SA.errTxt}>{err}</Text>
              </View>
            )}

            {done && (
              <View style={SA.successBox}>
                <Ionicons name="checkmark-circle" size={16} color={C.grn} />
                <Text style={SA.successTxt}>Colis assigné avec succès !</Text>
              </View>
            )}

            {/* ── Content */}
            {loadingList ? (
              <View style={SA.center}>
                <ActivityIndicator color={C.grn} size="large" />
                <Text style={SA.loadingTxt}>Chargement des colis compatibles…</Text>
              </View>
            ) : available.length === 0 ? (
              <View style={SA.empty}>
                <View style={SA.emptyIconWrap}>
                  <Ionicons name="cube-outline" size={36} color={C.dim} />
                </View>
                <Text style={SA.emptyTitle}>Aucun colis compatible</Text>
                <Text style={SA.emptyTxt}>
                  Aucun colis publié ne correspond à ce trajet ({trajet.origine} → {trajet.destination}).
                </Text>
              </View>
            ) : (
              <>
                <Text style={SA.sectionLabel}>{available.length} colis compatibles</Text>
                {available.map(c => {
                  const isSelected = c.id === selected;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[SA.colisCard, isSelected && SA.colisCardSelected]}
                      onPress={() => setSelected(isSelected ? null : c.id)}
                      activeOpacity={0.85}
                    >
                      {/* Selection indicator */}
                      <View style={[SA.radio, isSelected && SA.radioSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color={C.wh} />}
                      </View>

                      {/* Colis info */}
                      <View style={SA.colisInfo}>
                        <Text style={SA.colisName} numberOfLines={1}>{c.nom}</Text>
                        <Text style={SA.colisRoute} numberOfLines={1}>
                          {c.villeDepart} → {c.villeArrivee}
                        </Text>
                      </View>

                      {/* Colis meta */}
                      <View style={SA.colisMeta}>
                        <View style={SA.metaRow}>
                          <Ionicons name="scale-outline" size={11} color={C.gr} />
                          <Text style={SA.metaTxt}>{c.poidsKg} kg</Text>
                        </View>
                        <View style={SA.metaRow}>
                          <Ionicons name="cash-outline" size={11} color={C.gr} />
                          <Text style={SA.metaTxt}>{c.prixProposeMRU} MRU</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ── Assign button */}
            {!loadingList && available.length > 0 && (
              <TouchableOpacity
                style={[SA.assignBtn, (!selected || assigning || done) && SA.assignBtnDisabled]}
                onPress={handleAssign}
                disabled={!selected || assigning || done}
                activeOpacity={0.88}
              >
                {assigning ? (
                  <ActivityIndicator color={C.wh} size="small" />
                ) : (
                  <>
                    <Ionicons name="link" size={18} color={C.wh} />
                    <Text style={SA.assignBtnTxt}>
                      {selected ? 'Assigner ce colis' : 'Sélectionnez un colis'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── VoyagesScreen ────────────────────────────────────────────────────────────
export default function VoyagesScreen() {
  const params = useLocalSearchParams<{ create?: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('public');
  const [publicTrajets, setPublic] = useState<Trajet[]>([]);
  const [myTrajets, setMine]       = useState<Trajet[]>([]);
  const [loading, setLoading]      = useState(true);
  const [refresh, setRefresh]      = useState(false);
  const [showCreate,   setCreate]     = useState(false);
  const [assignTrajet, setAssignTrajet] = useState<Trajet | null>(null);
  const [isVoyageur,  setIsVoyageur]  = useState(false);
  const [myEmail,     setMyEmail]     = useState('');
  const lastCreate = React.useRef('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoading(true);
    try {
      const session = await authService.getSession();
      const voy = session?.role === 'ROLE_VOYAGEUR';
      setIsVoyageur(voy);
      setMyEmail(session?.email ?? '');

      const [pub, mine] = await Promise.all([
        trajetService.getPublicTrajets().catch(() => [] as Trajet[]),
        voy ? trajetService.getMyTrajets().catch(() => [] as Trajet[]) : Promise.resolve([] as Trajet[]),
      ]);
      setPublic(pub);
      setMine(mine);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.create && params.create !== lastCreate.current && isVoyageur && !loading) {
      lastCreate.current = params.create;
      setCreate(true);
    }
  }, [params.create, isVoyageur, loading]);

  const handleCancel = (id: string) => {
    Alert.alert('Confirmer', 'Annuler ce voyage ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: async () => {
        try { await trajetService.cancel(id); await load(); }
        catch { Alert.alert('Erreur', 'Impossible d\'annuler ce voyage'); }
      }},
    ]);
  };

  const handleStartColis = async (colisId: string) => {
    try { await colisService.startDelivery(colisId); await load(); }
    catch { Alert.alert('Erreur', 'Impossible de démarrer la livraison'); }
  };

  const handleFinishColis = async (colisId: string) => {
    try { await colisService.finishDelivery(colisId); await load(); }
    catch { Alert.alert('Erreur', 'Impossible de marquer comme livré'); }
  };

  const displayedTrajets = activeTab === 'public' ? publicTrajets : myTrajets;

  return (
    <View style={S.root}>
      <StatusBar style="light" />
      <SafeAreaView style={S.safe} edges={['top']}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Voyages</Text>
          {isVoyageur && (
            <TouchableOpacity
              style={S.addBtn}
              activeOpacity={0.85}
              onPress={() => setCreate(true)}
            >
              <Ionicons name="add" size={22} color={C.wh} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab bar */}
        <View style={S.tabRow}>
          <TouchableOpacity
            style={[S.tabBtn, activeTab === 'public' && S.tabBtnActive]}
            onPress={() => setActiveTab('public')}
            activeOpacity={0.8}
          >
            <Text style={[S.tabTxt, activeTab === 'public' && S.tabTxtActive]}>
              Voyages disponibles
            </Text>
          </TouchableOpacity>
          {isVoyageur && (
            <TouchableOpacity
              style={[S.tabBtn, activeTab === 'mine' && S.tabBtnActive]}
              onPress={() => setActiveTab('mine')}
              activeOpacity={0.8}
            >
              <Text style={[S.tabTxt, activeTab === 'mine' && S.tabTxtActive]}>
                Mes voyages
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color={C.red} size="large" />
          </View>
        ) : (
          <FlatList
            data={displayedTrajets}
            keyExtractor={i => i.id}
            contentContainerStyle={S.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refresh}
                onRefresh={() => load(true)}
                tintColor={C.red}
                colors={[C.red]}
              />
            }
            ListEmptyComponent={
              <View style={S.empty}>
                <Ionicons name="airplane-outline" size={48} color={C.dim} />
                <Text style={S.emptyTitle}>Aucun voyage</Text>
                <Text style={S.emptyTxt}>
                  {activeTab === 'mine'
                    ? 'Créez votre premier voyage avec le bouton +'
                    : 'Aucun voyage disponible pour le moment'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TrajetCard
                item={item}
                isOwner={item.voyageurEmail === myEmail}
                onCancel={handleCancel}
                onAssignColis={t => setAssignTrajet(t)}
                onStartColis={handleStartColis}
                onFinishColis={handleFinishColis}
              />
            )}
          />
        )}
      </SafeAreaView>

      {isVoyageur && (
        <CreateTrajetModal
          visible={showCreate}
          onClose={() => setCreate(false)}
          onCreated={() => load()}
        />
      )}

      <AssignColisModal
        trajet={assignTrajet}
        visible={assignTrajet !== null}
        onClose={() => setAssignTrajet(null)}
        onAssigned={() => load()}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { color: C.wh, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },

  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.bd,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: C.redDim, borderColor: 'rgba(220,38,38,0.35)' },
  tabTxt:       { color: C.gr,  fontSize: 13, fontWeight: '600' },
  tabTxtActive: { color: C.red, fontSize: 13, fontWeight: '700' },

  list: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  cardTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  routeBlock: { flex: 1, gap: 6 },
  routePin:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeCity:  { color: C.wh, fontSize: 14, fontWeight: '600', flex: 1 },
  routeLine: {
    width: 1,
    height: 14,
    backgroundColor: C.bd,
    marginLeft: 7,
  },
  badge:    { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },

  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 4 },
  detail:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailTxt:   { color: C.gr, fontSize: 12, fontWeight: '500' },

  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.30)',
  },
  assignBtnTxt: { color: C.grn, fontSize: 13, fontWeight: '700' },

  cancelBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.30)',
    alignItems: 'center',
  },
  cancelBtnTxt: { color: C.red, fontSize: 13, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: C.wh, fontSize: 18, fontWeight: '700' },
  emptyTxt:   { color: C.gr, fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 },

  // ── Colis delivery section (inside trajet card)
  colisSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    gap: 6,
  },
  colisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  colisSectionLabel: {
    color: C.dim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  colisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  colisRowInfo: { flex: 1, gap: 4 },
  colisRowName: { color: C.wh, fontSize: 12, fontWeight: '600' },
  colisBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  colisBadgeTxt: { fontSize: 10, fontWeight: '700' },
  deliveryStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.grn,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deliveryFinishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.blu,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deliveryBtnTxt: { color: C.wh, fontSize: 11, fontWeight: '700' },
});

const SM = StyleSheet.create({
  // ── Sheet shell
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '93%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.55, shadowRadius: 24 },
      android: { elevation: 32 },
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: C.wh, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:   { color: C.gr, fontSize: 12, fontWeight: '400', marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll
  scroll: { padding: 20, gap: 14, paddingBottom: 44 },

  // ── Error
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(220,38,38,0.10)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
  },
  errIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(220,38,38,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errTxt: { color: C.red, fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  // ── Section labels
  sectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4, marginBottom: 2 },
  sectionLabel:{ color: C.wh, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  // ── Route card
  routeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  routeTimeline: { width: 28, alignItems: 'center', paddingTop: 20 },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.grn,
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.30)',
  },
  routeDotDest: {
    backgroundColor: C.red,
    borderColor: 'rgba(220,38,38,0.30)',
  },
  routeConnector: {
    width: 2,
    flex: 1,
    minHeight: 18,
    marginTop: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
  },
  routeFieldWrap: { flex: 1, paddingLeft: 4 },
  routeFieldLabel: {
    color: C.dim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  routeInput: {
    color: C.wh,
    fontSize: 16,
    fontWeight: '600',
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  routeInputActive: { borderBottomColor: C.red },
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 2,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.15)',
  },
  routePreviewDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  routePreviewTxt: { flex: 1, color: C.gr, fontSize: 12, fontWeight: '500' },

  // ── Date card
  dateCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  dateCardActive: {
    borderColor: 'rgba(220,38,38,0.40)',
    backgroundColor: '#1f1515',
  },
  dateIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(220,38,38,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRight: { flex: 1 },
  dateInput: { color: C.wh, fontSize: 16, fontWeight: '600' },
  dateHint:  { color: C.dim, fontSize: 11, fontWeight: '400', marginTop: 3 },

  // ── Capacity stepper
  capacityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(220,38,38,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityCenter: { flex: 1, alignItems: 'center', gap: 2 },
  capacityInput: {
    color: C.wh,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
    minWidth: 80,
  },
  capacityUnit: { color: C.dim, fontSize: 12, fontWeight: '500' },

  // ── Presets
  presetsRow: { flexDirection: 'row', gap: 8, marginTop: -2 },
  preset: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  presetActive: {
    backgroundColor: 'rgba(220,38,38,0.13)',
    borderColor: 'rgba(220,38,38,0.35)',
  },
  presetTxt:       { color: C.dim, fontSize: 13, fontWeight: '600' },
  presetTxtActive: { color: C.red, fontWeight: '700' },

  // ── Summary card
  summaryCard: {
    backgroundColor: 'rgba(34,197,94,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.22)',
    padding: 13,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  summaryTxt: { color: C.grn, fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  // ── Submit
  submitBtn: {
    backgroundColor: C.red,
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 18 },
      android: { elevation: 14 },
    }),
  },
  submitTxt: { color: C.wh, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // ── Legal
  legalTxt: { color: C.dim, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: -4 },
});

// ─── AssignColisModal styles ──────────────────────────────────────────────────
const SA = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.55, shadowRadius: 24 },
      android: { elevation: 32 },
    }),
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { color: C.wh, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: C.gr, fontSize: 12, fontWeight: '400', marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Trajet info row
  trajetInfo: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  trajetPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  trajetPillTxt: { color: C.gr, fontSize: 12, fontWeight: '500' },

  // ── Scroll
  scroll: { padding: 20, gap: 12, paddingBottom: 44 },

  // ── Feedback
  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(220,38,38,0.10)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)',
  },
  errTxt: { color: C.red, fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
  },
  successTxt: { color: C.grn, fontSize: 13, fontWeight: '600', flex: 1 },

  // ── States
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingTxt: { color: C.gr, fontSize: 13, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: C.wh, fontSize: 16, fontWeight: '700' },
  emptyTxt:   { color: C.gr, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // ── Section label
  sectionLabel: { color: C.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  // ── Colis card
  colisCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  colisCardSelected: {
    borderColor: 'rgba(34,197,94,0.50)',
    backgroundColor: 'rgba(34,197,94,0.06)',
  },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: C.grn, borderColor: C.grn,
  },

  colisInfo: { flex: 1 },
  colisName:  { color: C.wh, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  colisRoute: { color: C.gr, fontSize: 12, fontWeight: '400' },

  colisMeta: { alignItems: 'flex-end', gap: 4 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:   { color: C.gr, fontSize: 11, fontWeight: '500' },

  // ── Assign button
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.grn,
    borderRadius: 18, paddingVertical: 17,
    marginTop: 4,
    ...Platform.select({
      ios:     { shadowColor: C.grn, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  assignBtnDisabled: { backgroundColor: '#1a1a1a', opacity: 0.55 },
  assignBtnTxt: { color: C.wh, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
});
