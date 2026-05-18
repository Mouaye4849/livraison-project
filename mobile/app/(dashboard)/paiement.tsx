import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AxiosError } from 'axios';
import { colisService } from '@/services/colis.service';
import { paiementService } from '@/services/paiement.service';
import type { Colis, TypePaiement, ApiError } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#0a0a0a',
  card:   '#141414',
  card2:  '#1a1a1a',
  bd:     'rgba(255,255,255,0.07)',
  bd2:    'rgba(255,255,255,0.04)',
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
} as const;

// ─── Payment methods ──────────────────────────────────────────────────────────
const METHODS: { value: TypePaiement; label: string; icon: string; sub: string }[] = [
  { value: 'CASH',         label: 'Cash',         icon: 'cash-outline',           sub: 'En espèces'         },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: 'phone-portrait-outline', sub: 'Via opérateur'      },
  { value: 'CARTE',        label: 'Carte',        icon: 'card-outline',           sub: 'Carte bancaire'     },
];

// ─── PaiementScreen ───────────────────────────────────────────────────────────
export default function PaiementScreen() {
  const { colisId } = useLocalSearchParams<{ colisId: string }>();

  const [colis,   setColis]   = useState<Colis | null>(null);
  const [type,    setType]    = useState<TypePaiement>('CASH');
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!colisId) { setLoading(false); return; }
    colisService.getById(colisId)
      .then(setColis)
      .catch(() => setError('Impossible de charger le colis.'))
      .finally(() => setLoading(false));
  }, [colisId]);

  const handlePay = async () => {
    if (!colisId || paying || success) return;
    setError(null);
    setPaying(true);
    try {
      await paiementService.pay(colisId, type);
      setSuccess(true);
      setTimeout(() => router.replace('/(dashboard)/paiements' as any), 1400);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? 'Paiement échoué. Veuillez réessayer.');
    } finally {
      setPaying(false);
    }
  };

  const commission = colis ? +(colis.prixProposeMRU * 0.10).toFixed(2) : 0;

  if (loading) {
    return (
      <View style={[S.root, S.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color={C.red} size="large" />
      </View>
    );
  }

  return (
    <View style={S.root}>
      <StatusBar style="light" />
      <SafeAreaView style={S.safe} edges={['top', 'bottom']}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <View style={S.header}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color={C.wh} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Paiement</Text>
          <View style={S.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={S.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── SUCCESS BANNER ──────────────────────────────── */}
          {success && (
            <View style={S.successBox}>
              <Ionicons name="checkmark-circle" size={18} color={C.grn} />
              <Text style={S.successTxt}>Paiement effectué avec succès !</Text>
            </View>
          )}

          {/* ── ERROR BANNER ────────────────────────────────── */}
          {error && (
            <View style={S.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={C.red} />
              <Text style={S.errorTxt}>{error}</Text>
            </View>
          )}

          {/* ── COLIS CARD ──────────────────────────────────── */}
          {colis ? (
            <View style={S.colisCard}>
              <View style={S.colisHeader}>
                <View style={S.colisIconWrap}>
                  <Ionicons name="cube" size={20} color={C.red} />
                </View>
                <View style={S.colisMeta}>
                  <Text style={S.colisName} numberOfLines={1}>{colis.nom}</Text>
                  <Text style={S.colisRoute} numberOfLines={1}>
                    {colis.villeDepart} → {colis.villeArrivee}
                  </Text>
                </View>
              </View>

              <View style={S.colisDivider} />

              <View style={S.colisDetails}>
                <View style={S.colisDetail}>
                  <Ionicons name="scale-outline" size={13} color={C.dim} />
                  <Text style={S.colisDetailTxt}>{colis.poidsKg} kg</Text>
                </View>
                <View style={S.colisDetail}>
                  <Ionicons name="layers-outline" size={13} color={C.dim} />
                  <Text style={S.colisDetailTxt}>×{colis.quantite}</Text>
                </View>
                <View style={S.colisDetail}>
                  <Ionicons name="person-outline" size={13} color={C.dim} />
                  <Text style={S.colisDetailTxt} numberOfLines={1}>{colis.nomDestinataire}</Text>
                </View>
              </View>

              <View style={S.priceRow}>
                <Text style={S.priceLabel}>Montant à payer</Text>
                <Text style={S.priceValue}>
                  {colis.prixProposeMRU}
                  <Text style={S.priceCurrency}> MRU</Text>
                </Text>
              </View>
            </View>
          ) : (
            <View style={[S.colisCard, S.center, { minHeight: 80 }]}>
              <Text style={{ color: C.gr, fontSize: 14 }}>Colis introuvable</Text>
            </View>
          )}

          {/* ── PAYMENT METHODS ─────────────────────────────── */}
          <Text style={S.sectionLabel}>Méthode de paiement</Text>

          <View style={S.methodList}>
            {METHODS.map((m) => {
              const active = type === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[S.methodRow, active && S.methodRowActive]}
                  onPress={() => setType(m.value)}
                  activeOpacity={0.78}
                >
                  <View style={[S.methodIconWrap, active && S.methodIconWrapActive]}>
                    <Ionicons name={m.icon as any} size={20} color={active ? C.red : C.dim} />
                  </View>
                  <View style={S.methodBody}>
                    <Text style={[S.methodLabel, active && S.methodLabelActive]}>{m.label}</Text>
                    <Text style={S.methodSub}>{m.sub}</Text>
                  </View>
                  <View style={[S.radio, active && S.radioActive]}>
                    {active && <View style={S.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── PRICE SUMMARY ───────────────────────────────── */}
          {colis && (
            <View style={S.summaryCard}>
              <View style={S.summaryRow}>
                <Text style={S.summaryLbl}>Montant colis</Text>
                <Text style={S.summaryVal}>{colis.prixProposeMRU} MRU</Text>
              </View>
              <View style={S.summaryRow}>
                <Text style={S.summaryLbl}>Commission (10%)</Text>
                <Text style={[S.summaryVal, { color: C.gr }]}>{commission} MRU</Text>
              </View>
              <View style={S.summaryDivider} />
              <View style={S.summaryRow}>
                <Text style={S.summaryLblTotal}>Total</Text>
                <Text style={S.summaryValTotal}>{colis.prixProposeMRU} MRU</Text>
              </View>
            </View>
          )}

          {/* ── CONFIRM BUTTON ──────────────────────────────── */}
          <TouchableOpacity
            style={[S.confirmBtn, (paying || success || !colis) && S.confirmBtnDis]}
            onPress={handlePay}
            disabled={paying || success || !colis}
            activeOpacity={0.85}
          >
            {paying ? (
              <ActivityIndicator color={C.wh} size="small" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color={C.wh} />
                <Text style={S.confirmBtnTxt}>Confirmer le paiement</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={S.legalNote}>
            Paiement sécurisé · Vous ne serez débité qu'après confirmation du paiement.
          </Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  safe:   { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 36, gap: 16 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.bd,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.bd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: C.wh,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: { width: 38 },

  // ── Banners
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.grnDim,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successTxt: { color: C.grn, fontSize: 13, fontWeight: '600', flex: 1 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorTxt: { color: '#f87171', fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  // ── Colis card
  colisCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 18,
    gap: 12,
    marginTop: 4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  colisHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colisIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.redDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colisMeta:    { flex: 1 },
  colisName:    { color: C.wh, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  colisRoute:   { color: C.gr, fontSize: 12 },
  colisDivider: { height: 1, backgroundColor: C.bd2 },
  colisDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colisDetail:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  colisDetailTxt: { color: C.gr, fontSize: 12 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  priceLabel:    { color: C.gr, fontSize: 13 },
  priceValue:    { color: C.wh, fontSize: 18, fontWeight: '800' },
  priceCurrency: { color: C.gr, fontSize: 13, fontWeight: '500' },

  // ── Section label
  sectionLabel: {
    color: C.gr,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: -8,
  },

  // ── Payment methods
  methodList: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.bd,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.bd2,
  },
  methodRowActive: { backgroundColor: C.redDim },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconWrapActive: { backgroundColor: 'rgba(220,38,38,0.18)' },
  methodBody:       { flex: 1 },
  methodLabel:      { color: C.gr, fontSize: 14, fontWeight: '600' },
  methodLabelActive:{ color: C.wh },
  methodSub:        { color: C.dim, fontSize: 11, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: C.red },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },

  // ── Summary
  summaryCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 18,
    gap: 10,
  },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLbl:      { color: C.gr, fontSize: 13 },
  summaryVal:      { color: C.wh, fontSize: 13, fontWeight: '600' },
  summaryDivider:  { height: 1, backgroundColor: C.bd2 },
  summaryLblTotal: { color: C.wh, fontSize: 15, fontWeight: '700' },
  summaryValTotal: { color: C.red, fontSize: 18, fontWeight: '800' },

  // ── Confirm button
  confirmBtn: {
    backgroundColor: C.red,
    borderRadius: 18,
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
  confirmBtnDis: { opacity: 0.55 },
  confirmBtnTxt: { color: C.wh, fontSize: 16, fontWeight: '700' },

  legalNote: {
    color: C.dim,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
