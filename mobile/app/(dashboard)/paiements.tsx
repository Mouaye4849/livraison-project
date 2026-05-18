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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { paiementService } from '@/services/paiement.service';
import type { Paiement, StatutPaiement } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#0a0a0a',
  card:   '#141414',
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

const STATUT_CFG: Record<StatutPaiement, { label: string; color: string; bg: string; icon: string }> = {
  SUCCES:     { label: 'Réussi',     color: C.grn, bg: C.grnDim, icon: 'checkmark-circle-outline' },
  EN_ATTENTE: { label: 'En attente', color: C.ylw, bg: C.ylwDim, icon: 'time-outline'              },
  ECHEC:      { label: 'Échoué',     color: C.red, bg: C.redDim, icon: 'close-circle-outline'      },
};

const TYPE_LABELS: Record<string, string> = {
  CASH:         'Cash',
  MOBILE_MONEY: 'Mobile Money',
  CARTE:        'Carte bancaire',
};

function formatDate(date?: string): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return '—'; }
}

// ─── StatBox ─────────────────────────────────────────────────────────────────
function StatBox({ val, label, color }: { val: number; label: string; color: string }) {
  return (
    <View style={SS.statItem}>
      <Text style={[SS.statVal, { color }]}>{val}</Text>
      <Text style={SS.statLbl}>{label}</Text>
    </View>
  );
}

// ─── PaiementsScreen ──────────────────────────────────────────────────────────
export default function PaiementsScreen() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refresh,   setRefresh]   = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoading(true);
    try {
      const data = await paiementService.getMyPaiements();
      setPaiements(data);
    } catch {
      setPaiements([]);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total     = paiements.length;
  const succes    = paiements.filter(p => p.statut === 'SUCCES').length;
  const enAttente = paiements.filter(p => p.statut === 'EN_ATTENTE').length;
  const echec     = paiements.filter(p => p.statut === 'ECHEC').length;

  if (loading) {
    return (
      <View style={[S.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style="light" />
        <ActivityIndicator color={C.red} size="large" />
      </View>
    );
  }

  return (
    <View style={S.root}>
      <StatusBar style="light" />
      <SafeAreaView style={S.safe} edges={['top']}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <View style={S.header}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color={C.wh} />
          </TouchableOpacity>
          <Text style={S.title}>Mes Paiements</Text>
          <View style={S.headerSpacer} />
        </View>

        {/* ── STATS STRIP ─────────────────────────────────── */}
        <View style={S.statsStrip}>
          <StatBox val={total}     label="Total"      color={C.blu} />
          <View style={S.statSep} />
          <StatBox val={succes}    label="Réussis"    color={C.grn} />
          <View style={S.statSep} />
          <StatBox val={enAttente} label="En attente" color={C.ylw} />
          <View style={S.statSep} />
          <StatBox val={echec}     label="Échoués"    color={C.red} />
        </View>

        {/* ── LIST ────────────────────────────────────────── */}
        <FlatList
          data={paiements}
          keyExtractor={(p) => p.id}
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
              <Ionicons name="card-outline" size={48} color={C.dim} />
              <Text style={S.emptyTitle}>Aucun paiement</Text>
              <Text style={S.emptyTxt}>Vos transactions apparaîtront ici</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = STATUT_CFG[item.statut] ?? STATUT_CFG.EN_ATTENTE;
            return (
              <View style={S.card}>

                {/* Amount + Status */}
                <View style={S.cardTop}>
                  <View style={S.amountRow}>
                    <View style={S.amountIcon}>
                      <Ionicons name="card" size={17} color={C.blu} />
                    </View>
                    <Text style={S.amount}>
                      {item.montantMRU}
                      <Text style={S.amountUnit}> MRU</Text>
                    </Text>
                  </View>
                  <View style={[S.badge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={[S.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={S.divider} />

                {/* Meta rows */}
                <View style={S.meta}>
                  <View style={S.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color={C.dim} />
                    <Text style={S.metaTxt}>{formatDate(item.dateConfirmation)}</Text>
                  </View>
                  <View style={S.metaRow}>
                    <Ionicons name="pricetag-outline" size={13} color={C.dim} />
                    <Text style={S.metaTxt}>{TYPE_LABELS[item.typePaiement] ?? item.typePaiement}</Text>
                  </View>
                  <View style={S.metaRow}>
                    <Ionicons name="code-slash-outline" size={13} color={C.dim} />
                    <Text style={[S.metaTxt, S.metaRef]} numberOfLines={1}>{item.referenceTransaction}</Text>
                  </View>
                </View>

              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SS = StyleSheet.create({
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statVal:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl:  { color: '#9ca3af', fontSize: 11, fontWeight: '500', marginTop: 3 },
});

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
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
  title:        { flex: 1, textAlign: 'center', color: C.wh, fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 38 },

  // ── Stats strip
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.bd,
    paddingVertical: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  statSep: { width: 1, backgroundColor: C.bd },

  // ── Card
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  amountRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.bluDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount:     { color: C.wh, fontSize: 18, fontWeight: '800' },
  amountUnit: { color: C.gr, fontSize: 13, fontWeight: '500' },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeTxt: { fontSize: 12, fontWeight: '600' },

  divider: { height: 1, backgroundColor: C.bd2 },

  meta:    { gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaTxt: { color: C.gr, fontSize: 12, flex: 1 },
  metaRef: { color: C.dim, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },

  // ── Empty
  empty:      { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { color: C.wh, fontSize: 18, fontWeight: '700' },
  emptyTxt:   { color: C.gr, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
