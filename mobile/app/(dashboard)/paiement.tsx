import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AxiosError } from 'axios';
import { colisService } from '@/services/colis.service';
import { paiementService } from '@/services/paiement.service';
import type { PaiementRequest } from '@/services/paiement.service';
import type { Colis, TypePaiement, Paiement, ApiError } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#eef1ee',
  card:   '#ffffff',
  card2:  '#f5f8f5',
  input:  '#f0f4f0',
  bd:     'rgba(0,0,0,0.08)',
  bd2:    'rgba(0,0,0,0.04)',
  bdFoc:  'rgba(34,197,94,0.50)',
  red:    '#dc2626',
  redDim: 'rgba(220,38,38,0.10)',
  wh:     '#1a2e1a',
  gr:     '#6b7280',
  dim:    '#9ca3af',
  grn:    '#22c55e',
  grnDk:  '#166534',
  grnDim: 'rgba(34,197,94,0.12)',
  grnBd:  'rgba(34,197,94,0.25)',
  ylw:    '#d97706',
  ylwDim: 'rgba(217,119,6,0.10)',
  blu:    '#2563eb',
  bluDim: 'rgba(37,99,235,0.10)',
} as const;

// ─── Payment methods ──────────────────────────────────────────────────────────
const METHODS: { value: TypePaiement; label: string; icon: string; sub: string }[] = [
  { value: 'CASH',         label: 'Cash',         icon: 'cash-outline',           sub: 'En espèces'    },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: 'phone-portrait-outline', sub: 'Bankily'       },
  { value: 'CARTE',        label: 'Carte',        icon: 'card-outline',           sub: 'Carte bancaire' },
];

// ─── PaiementScreen ───────────────────────────────────────────────────────────
export default function PaiementScreen() {
  const params  = useLocalSearchParams<{ colisId: string }>();
  const colisId = Array.isArray(params.colisId) ? params.colisId[0] : params.colisId;

  const [colis,       setColis]       = useState<Colis | null>(null);
  const [type,        setType]        = useState<TypePaiement>('CASH');
  const [clientPhone, setClientPhone] = useState('');
  const [passcode,    setPasscode]    = useState('');
  const [phoneActive, setPhoneActive] = useState(false);
  const [codeActive,  setCodeActive]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [paying,      setPaying]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [result,      setResult]      = useState<Paiement | null>(null);

  useEffect(() => {
    if (!colisId) { setLoading(false); return; }
    colisService.getById(colisId)
      .then(setColis)
      .catch(() => setError('Impossible de charger le colis.'))
      .finally(() => setLoading(false));
  }, [colisId]);

  const handlePay = async () => {
    if (!colisId || paying || result) return;
    if (type === 'MOBILE_MONEY') {
      if (!clientPhone.trim()) { setError('Veuillez entrer votre numéro de téléphone Bankily.'); return; }
      if (!passcode.trim())    { setError('Veuillez entrer votre code secret Bankily.');         return; }
    }
    setError(null);
    setPaying(true);
    try {
      const request: PaiementRequest = {
        typePaiement: type,
        clientPhone:  type === 'MOBILE_MONEY' ? clientPhone.trim() : undefined,
        passcode:     type === 'MOBILE_MONEY' ? passcode.trim()    : undefined,
      };
      const data = await paiementService.pay(colisId, request);
      setResult(data);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? 'Paiement échoué. Veuillez réessayer.');
    } finally {
      setPaying(false);
    }
  };

  const commission = colis ? +(colis.prixProposeMRU * 0.10).toFixed(2) : 0;

  // ── Loading state
  if (loading) {
    return (
      <View style={[S.root, S.center]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={C.grn} size="large" />
      </View>
    );
  }

  // ── Success confirmation
  if (result) {
    return (
      <View style={S.root}>
        <StatusBar style="dark" />
        <SafeAreaView style={S.safe} edges={['top', 'bottom']}>
          <View style={S.header}>
            <View style={S.headerSpacer} />
            <Text style={S.headerTitle}>Confirmation</Text>
            <View style={S.headerSpacer} />
          </View>

          <ScrollView contentContainerStyle={[S.scroll, { paddingTop: 24 }]} showsVerticalScrollIndicator={false}>
            {/* Success icon */}
            <View style={SR.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color={C.grn} />
            </View>
            <Text style={SR.successTitle}>Paiement réussi !</Text>
            <Text style={SR.successSub}>Votre transaction a été confirmée avec succès.</Text>

            {/* Breakdown card */}
            <View style={SR.card}>
              <View style={SR.row}>
                <Text style={SR.lbl}>Montant payé</Text>
                <Text style={SR.val}>{result.montantMRU} MRU</Text>
              </View>
              <View style={SR.row}>
                <Text style={SR.lbl}>Commission (10%)</Text>
                <Text style={[SR.val, { color: C.gr }]}>{result.commissionAdmin} MRU</Text>
              </View>
              <View style={SR.row}>
                <Text style={SR.lbl}>Voyageur reçoit</Text>
                <Text style={[SR.val, { color: C.grn }]}>{result.montantVoyageur} MRU</Text>
              </View>
              {result.referenceTransaction ? (
                <>
                  <View style={SR.divider} />
                  <View style={SR.refRow}>
                    <Ionicons name="code-slash-outline" size={13} color={C.dim} />
                    <Text style={SR.refTxt} numberOfLines={2}>{result.referenceTransaction}</Text>
                  </View>
                </>
              ) : null}
            </View>

            <TouchableOpacity
              style={SR.btn}
              onPress={() => router.replace('/(dashboard)/paiements' as any)}
              activeOpacity={0.85}
            >
              <Text style={SR.btnTxt}>Voir mes paiements</Text>
              <Ionicons name="arrow-forward" size={18} color='#0f1419' />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Payment form
  return (
    <View style={S.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={S.safe} edges={['top', 'bottom']}>

        {/* HEADER */}
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
          {/* ERROR BANNER */}
          {error && (
            <View style={S.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={C.red} />
              <Text style={S.errorTxt}>{error}</Text>
            </View>
          )}

          {/* COLIS CARD */}
          {colis ? (
            <View style={S.colisCard}>
              <View style={S.colisHeader}>
                <View style={S.colisIconWrap}>
                  <Ionicons name="cube" size={20} color={C.grn} />
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

          {/* PAYMENT METHODS */}
          <Text style={S.sectionLabel}>Méthode de paiement</Text>

          <View style={S.methodList}>
            {METHODS.map((m, idx) => {
              const active = type === m.value;
              const isLast = idx === METHODS.length - 1;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[S.methodRow, active && S.methodRowActive, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => { setType(m.value); setError(null); }}
                  activeOpacity={0.78}
                >
                  <View style={[S.methodIconWrap, active && S.methodIconWrapActive]}>
                    <Ionicons name={m.icon as any} size={20} color={active ? C.grn : C.dim} />
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

          {/* BANKILY CREDENTIALS */}
          {type === 'MOBILE_MONEY' && (
            <View style={S.bankilyCard}>
              <View style={S.bankilyHeader}>
                <Ionicons name="shield-checkmark-outline" size={15} color={C.grn} />
                <Text style={S.bankilyTitle}>Informations Bankily</Text>
              </View>

              {/* Phone */}
              <View style={S.fieldWrap}>
                <Text style={S.fieldLabel}>Numéro de téléphone</Text>
                <View style={[S.inputWrap, phoneActive && S.inputWrapFoc]}>
                  <Ionicons name="phone-portrait-outline" size={16} color={phoneActive ? C.grn : C.dim} style={S.inputIcon} />
                  <TextInput
                    style={S.input}
                    value={clientPhone}
                    onChangeText={setClientPhone}
                    placeholder="ex: 22xxxxxxxx"
                    placeholderTextColor={C.dim}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    onFocus={() => setPhoneActive(true)}
                    onBlur={() => setPhoneActive(false)}
                  />
                </View>
              </View>

              {/* Passcode */}
              <View style={S.fieldWrap}>
                <Text style={S.fieldLabel}>Code secret (passcode)</Text>
                <View style={[S.inputWrap, codeActive && S.inputWrapFoc]}>
                  <Ionicons name="lock-closed-outline" size={16} color={codeActive ? C.grn : C.dim} style={S.inputIcon} />
                  <TextInput
                    style={[S.input, { letterSpacing: 4 }]}
                    value={passcode}
                    onChangeText={setPasscode}
                    placeholder="••••••"
                    placeholderTextColor={C.dim}
                    secureTextEntry
                    maxLength={6}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onFocus={() => setCodeActive(true)}
                    onBlur={() => setCodeActive(false)}
                  />
                </View>
              </View>

              <View style={S.secureNote}>
                <Ionicons name="lock-closed" size={11} color={C.dim} />
                <Text style={S.secureNoteTxt}>
                  Vos identifiants sont chiffrés et ne sont jamais stockés.
                </Text>
              </View>
            </View>
          )}

          {/* PRICE SUMMARY */}
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
                <Text style={S.summaryLblTotal}>Total à payer</Text>
                <Text style={S.summaryValTotal}>{colis.prixProposeMRU} MRU</Text>
              </View>
            </View>
          )}

          {/* CONFIRM BUTTON */}
          <TouchableOpacity
            style={[S.confirmBtn, (paying || !colis) && S.confirmBtnDis]}
            onPress={handlePay}
            disabled={paying || !colis}
            activeOpacity={0.85}
          >
            {paying ? (
              <ActivityIndicator color="#0f1419" size="small" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color="#0f1419" />
                <Text style={S.confirmBtnTxt}>Confirmer le paiement</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={S.legalNote}>
            Paiement sécurisé · Vous ne serez débité qu'après confirmation.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Success styles ───────────────────────────────────────────────────────────
const SR = StyleSheet.create({
  successIcon:  { alignItems: 'center', marginBottom: 12 },
  successTitle: { color: '#1a2e1a', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  successSub:   { color: '#6b7280', fontSize: 14, textAlign: 'center', marginBottom: 28 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 18,
    gap: 12,
    marginBottom: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lbl:    { color: '#6b7280', fontSize: 13 },
  val:    { color: '#1a2e1a', fontSize: 14, fontWeight: '700' },
  divider:{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  refRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  refTxt: { color: '#9ca3af', fontSize: 11, flex: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  btn: {
    backgroundColor: '#22c55e',
    borderRadius: 18,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios:     { shadowColor: '#22c55e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  btnTxt: { color: '#0f1419', fontSize: 16, fontWeight: '700' },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#eef1ee' },
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
  headerTitle:  { flex: 1, textAlign: 'center', color: C.wh, fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 38 },

  // ── Error banner
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorTxt: { color: '#dc2626', fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

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
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  colisHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colisIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.grnDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colisMeta:      { flex: 1 },
  colisName:      { color: C.wh, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  colisRoute:     { color: C.gr, fontSize: 12 },
  colisDivider:   { height: 1, backgroundColor: C.bd2 },
  colisDetails:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colisDetail:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
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
  priceLabel:    { color: C.gr,  fontSize: 13 },
  priceValue:    { color: C.grn, fontSize: 18, fontWeight: '800' },
  priceCurrency: { color: C.gr,  fontSize: 13, fontWeight: '500' },

  // ── Section label
  sectionLabel: {
    color: C.dim,
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
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
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
  methodRowActive:      { backgroundColor: C.grnDim },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconWrapActive: { backgroundColor: 'rgba(34,197,94,0.18)' },
  methodBody:           { flex: 1 },
  methodLabel:          { color: C.gr,  fontSize: 14, fontWeight: '600' },
  methodLabelActive:    { color: C.wh },
  methodSub:            { color: C.dim, fontSize: 11, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: C.grn },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: C.grn },

  // ── Bankily credentials card
  bankilyCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.grnBd,
    padding: 18,
    gap: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  bankilyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bankilyTitle:  { color: C.grn, fontSize: 13, fontWeight: '700' },

  fieldWrap:  { gap: 6 },
  fieldLabel: { color: C.gr, fontSize: 12, fontWeight: '500' },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.bd,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapFoc: { borderColor: C.bdFoc, backgroundColor: 'rgba(34,197,94,0.05)' },
  inputIcon:    { marginRight: 8 },
  input: {
    flex: 1,
    color: C.wh,
    fontSize: 14,
    fontWeight: '500',
  },

  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -4,
  },
  secureNoteTxt: { color: C.dim, fontSize: 11, flex: 1, lineHeight: 16 },

  // ── Summary
  summaryCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 18,
    gap: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLbl:      { color: C.gr,  fontSize: 13 },
  summaryVal:      { color: C.wh,  fontSize: 13, fontWeight: '600' },
  summaryDivider:  { height: 1, backgroundColor: C.bd2 },
  summaryLblTotal: { color: C.wh,  fontSize: 15, fontWeight: '700' },
  summaryValTotal: { color: C.grn, fontSize: 18, fontWeight: '800' },

  // ── Confirm button
  confirmBtn: {
    backgroundColor: C.grn,
    borderRadius: 18,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios:     { shadowColor: C.grn, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
  },
  confirmBtnDis: { opacity: 0.55 },
  confirmBtnTxt: { color: '#0f1419', fontSize: 16, fontWeight: '700' },

  legalNote: {
    color: C.dim,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
