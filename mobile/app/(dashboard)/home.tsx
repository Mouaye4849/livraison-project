import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { authService } from '@/services/auth.service';
import { colisService } from '@/services/colis.service';
import { notificationService } from '@/services/notification.service';
import { API_BASE_URL } from '@/constants/config';
import type { StoredUser, Colis } from '@/types';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2; // (screen - 2*pad - gap) / 2

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#eef1ee',
  card:    '#ffffff',
  card2:   '#f5f8f5',
  bd:      'rgba(0,0,0,0.08)',
  bd2:     'rgba(0,0,0,0.04)',
  grn:     '#22c55e',
  grnDk:   '#166534',
  grnDim:  'rgba(34,197,94,0.12)',
  grnBd:   'rgba(34,197,94,0.25)',
  wh:      '#1a2e1a',
  gr:      '#6b7280',
  dim:     '#9ca3af',
  dim2:    '#d1d5db',
  red:     '#dc2626',
  redDim:  'rgba(220,38,38,0.10)',
  redSoft: 'rgba(220,38,38,0.07)',
  ylw:     '#d97706',
  ylwDim:  'rgba(217,119,6,0.10)',
  blu:     '#2563eb',
  bluDim:  'rgba(37,99,235,0.10)',
  pur:     '#7c3aed',
  purDim:  'rgba(124,58,237,0.10)',
} as const;

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  BROUILLON: { label: 'Brouillon', color: C.gr,  bg: 'rgba(139,148,158,0.10)' },
  PUBLIE:    { label: 'Publié',    color: C.blu,  bg: C.bluDim },
  ACCEPTE:   { label: 'Accepté',  color: C.ylw,  bg: C.ylwDim },
  EN_COURS:  { label: 'En cours', color: C.red,   bg: C.redDim },
  LIVRE:     { label: 'Livré',    color: C.grn,   bg: C.grnDim },
  TERMINE:   { label: 'Terminé',  color: C.grn,   bg: C.grnDim },
  ANNULE:    { label: 'Annulé',   color: C.dim,   bg: C.bd2    },
};

// ─── Service cards data ───────────────────────────────────────────────────────
const SERVICES = [
  {
    icon:  'cube',
    color: C.grn,
    bg:    C.grnDim,
    title: 'Mes Colis',
    sub:   'Gérer vos envois',
    route: '/(dashboard)/colis',
  },
  {
    icon:  'airplane',
    color: C.blu,
    bg:    C.bluDim,
    title: 'Voyages',
    sub:   'Trouver un voyageur',
    route: '/(dashboard)/voyages',
  },
  {
    icon:  'location',
    color: C.ylw,
    bg:    C.ylwDim,
    title: 'Tracking',
    sub:   'Suivre vos colis',
    route: '/(dashboard)/colis',
  },
  {
    icon:  'chatbubble',
    color: C.pur,
    bg:    C.purDim,
    title: 'Messages',
    sub:   'Vos conversations',
    route: '/(dashboard)/messages',
  },
] as const;

// ─── Category strip data ──────────────────────────────────────────────────────
const CATEGORIES = [
  { icon: 'cube-outline',      label: 'Colis',    color: C.grn,  bg: C.grnDim,  route: '/(dashboard)/colis'    },
  { icon: 'airplane-outline',  label: 'Voyages',  color: C.blu,  bg: C.bluDim,  route: '/(dashboard)/voyages'  },
  { icon: 'chatbubble-outline',label: 'Messages', color: C.pur,  bg: C.purDim,  route: '/(dashboard)/messages' },
  { icon: 'person-outline',    label: 'Profil',   color: C.ylw,  bg: C.ylwDim,  route: '/(dashboard)/profile'  },
] as const;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
const NOTIF_POLL = 10_000; // 10 s — same as web

export default function HomeScreen() {
  const [user, setUser]           = useState<StoredUser | null>(null);
  const [colis, setColis]         = useState<Colis[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refresh, setRefresh]     = useState(false);
  const [unreadCount, setUnread]  = useState(0);
  const notifInterval             = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoading(true);
    try {
      const [session, myCol] = await Promise.all([
        authService.getSession(),
        colisService.getMyColis().catch(() => [] as Colis[]),
      ]);
      setUser(session);
      setColis(myCol);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  const pollUnread = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnread(count);
    } catch {
      // silently ignore — stale count is fine
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll unread count every 10 s (same cadence as web NotificationBell)
  useEffect(() => {
    pollUnread();
    notifInterval.current = setInterval(pollUnread, NOTIF_POLL);
    return () => {
      if (notifInterval.current) clearInterval(notifInterval.current);
    };
  }, [pollUnread]);

  const activeCount = colis.filter(c => ['PUBLIE', 'ACCEPTE', 'EN_COURS'].includes(c.statut)).length;
  const recentColis = colis.slice(0, 4);

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Utilisateur';
  const initials    = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <View style={[S.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={C.grn} size="large" />
      </View>
    );
  }

  return (
    <View style={S.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={S.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={() => load(true)}
              tintColor={C.grn}
              colors={[C.grn]}
            />
          }
        >

          {/* ── HEADER ──────────────────────────────────────── */}
          <View style={S.header}>
            <View style={S.headerLeft}>
              <View style={S.avatar}>
                <Text style={S.avatarTxt}>{initials}</Text>
              </View>
              <View>
                <Text style={S.greeting}>{getGreeting()}</Text>
                <Text style={S.userName} numberOfLines={1}>{displayName}</Text>
              </View>
            </View>
            <View style={S.headerRight}>
              <TouchableOpacity style={S.iconBtn} activeOpacity={0.75}>
                <Ionicons name="search-outline" size={20} color={C.wh} />
              </TouchableOpacity>
              <TouchableOpacity
                style={S.iconBtn}
                activeOpacity={0.75}
                onPress={() => router.push('/(dashboard)/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={20} color={C.wh} />
                {unreadCount > 0 && (
                  unreadCount <= 9 ? (
                    <View style={S.notifBadge}>
                      <Text style={S.notifBadgeTxt}>{unreadCount}</Text>
                    </View>
                  ) : (
                    <View style={[S.notifBadge, S.notifBadgeLarge]}>
                      <Text style={S.notifBadgeTxt}>9+</Text>
                    </View>
                  )
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── ADMIN PORTAL CARD (ROLE_ADMIN only) ─────────── */}
          {user?.role === 'ROLE_ADMIN' && (
            <TouchableOpacity
              style={S.adminCard}
              activeOpacity={0.82}
              onPress={() => Linking.openURL(API_BASE_URL.replace(/\/api$/, '/m-admin/login'))}
            >
              <View style={S.adminIconWrap}>
                <Ionicons name="shield-checkmark" size={20} color={C.blu} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.adminCardTitle}>Panneau Admin</Text>
                <Text style={S.adminCardSub}>Ouvrir le tableau de bord admin</Text>
              </View>
              <View style={S.adminBadge}>
                <Text style={S.adminBadgeTxt}>ADMIN</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── SUMMARY CARD ("Check Balance" equivalent) ───── */}
          <TouchableOpacity
            style={S.summaryCard}
            activeOpacity={0.82}
            onPress={() => router.navigate('/(dashboard)/colis' as any)}
          >
            <View style={S.summaryIconWrap}>
              <Ionicons name="cube" size={22} color={C.grn} />
            </View>
            <View style={S.summaryBody}>
              <Text style={S.summaryLabel}>Livraisons actives</Text>
              <Text style={S.summaryValue}>
                {activeCount > 0 ? `${activeCount} colis en cours` : 'Aucun colis actif'}
              </Text>
            </View>
            <View style={S.summaryChevron}>
              <Ionicons name="chevron-forward" size={18} color={C.dim} />
            </View>
          </TouchableOpacity>

          {/* ── SERVICES SECTION ────────────────────────────── */}
          <View style={S.sectionRow}>
            <Text style={S.sectionTitle}>Services</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={S.seeAllLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {/* 2×2 Service card grid */}
          <View style={S.serviceGrid}>
            {SERVICES.map((s) => (
              <TouchableOpacity
                key={s.title}
                style={S.serviceCard}
                activeOpacity={0.78}
                onPress={() => router.navigate(s.route as any)}
              >
                {/* Diagonal arrow — top right corner */}
                <View style={S.serviceArrow}>
                  <Ionicons name="arrow-forward-outline" size={14} color={C.dim2} />
                </View>
                {/* Icon */}
                <View style={[S.serviceIconWrap, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={26} color={s.color} />
                </View>
                {/* Text */}
                <Text style={S.serviceTitle}>{s.title}</Text>
                <Text style={S.serviceSub}>{s.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── CREATE TRAJET CTA ───────────────────────────── */}
          <TouchableOpacity
            style={S.ctaCard}
            activeOpacity={0.82}
            onPress={() => router.navigate({ pathname: '/(dashboard)/voyages', params: { create: Date.now().toString() } } as any)}
          >
              <View style={S.ctaIconWrap}>
                <Ionicons name="airplane" size={22} color={C.wh} />
              </View>
              <View style={S.ctaBody}>
                <Text style={S.ctaTitle}>Publier un voyage</Text>
                <Text style={S.ctaSub}>Proposer de transporter des colis</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={26} color="rgba(15,20,25,0.45)" />
          </TouchableOpacity>

          {/* ── CATEGORIES SECTION ──────────────────────────── */}
          <View style={S.catCard}>
            <View style={S.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  style={S.catItem}
                  activeOpacity={0.78}
                  onPress={() => router.navigate(cat.route as any)}
                >
                  <View style={[S.catIconWrap, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text style={S.catLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* See all categories button */}
          <TouchableOpacity
            style={S.seeAllBtn}
            activeOpacity={0.80}
            onPress={() => router.navigate('/(dashboard)/colis' as any)}
          >
            <Text style={S.seeAllBtnTxt}>Voir toutes les catégories</Text>
          </TouchableOpacity>

          {/* ── RECENT ACTIVITY ─────────────────────────────── */}
          <View style={S.sectionRow}>
            <Text style={S.sectionTitle}>Activité récente</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.navigate('/(dashboard)/colis' as any)}>
              <Text style={S.seeAllLink}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          {recentColis.length === 0 ? (
            <View style={S.emptyCard}>
              <Ionicons name="cube-outline" size={32} color={C.dim} />
              <Text style={S.emptyTxt}>Aucun colis pour le moment</Text>
              <TouchableOpacity
                style={S.emptyBtn}
                activeOpacity={0.85}
                onPress={() => router.navigate('/(dashboard)/colis' as any)}
              >
                <Text style={S.emptyBtnTxt}>Créer un colis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={S.actList}>
              {recentColis.map((c) => {
                const cfg = STATUT_CFG[c.statut] ?? STATUT_CFG.BROUILLON;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={S.actRow}
                    activeOpacity={0.8}
                    onPress={() => router.navigate('/(dashboard)/colis' as any)}
                  >
                    <View style={[S.actDot, { backgroundColor: cfg.bg }]}>
                      <Ionicons name="cube" size={15} color={cfg.color} />
                    </View>
                    <View style={S.actInfo}>
                      <Text style={S.actName} numberOfLines={1}>{c.nom}</Text>
                      <Text style={S.actRoute}>{c.villeDepart} → {c.villeArrivee}</Text>
                    </View>
                    <View style={[S.badge, { backgroundColor: cfg.bg }]}>
                      <Text style={[S.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },
  safe:  { flex: 1 },
  scroll:{ paddingBottom: 28 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.grnDim,
    borderWidth: 2,
    borderColor: C.grn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: C.grn, fontSize: 15, fontWeight: '800' },
  greeting:  { color: C.gr,  fontSize: 12, fontWeight: '500', marginBottom: 1 },
  userName:  { color: C.wh,  fontSize: 16, fontWeight: '700', maxWidth: width * 0.45 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.bd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.grn,
    borderWidth: 1.5,
    borderColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeLarge: {
    minWidth: 20,
    borderRadius: 10,
  },
  notifBadgeTxt: {
    color: C.wh,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },

  // ── Admin portal card
  adminCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${C.blu}40`,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  adminIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.bluDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminCardTitle: { color: C.wh, fontSize: 14, fontWeight: '700' },
  adminCardSub:   { color: C.dim, fontSize: 11, marginTop: 2 },
  adminBadge: {
    backgroundColor: C.bluDim,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adminBadgeTxt: { color: C.blu, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  // ── Summary card
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 26,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.bd,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  summaryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.grnDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody:   { flex: 1 },
  summaryLabel:  { color: C.gr,  fontSize: 12, fontWeight: '500', marginBottom: 3 },
  summaryValue:  { color: C.wh,  fontSize: 15, fontWeight: '700' },
  summaryChevron:{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.bd2, alignItems: 'center', justifyContent: 'center' },

  // ── Section headers
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { color: C.wh, fontSize: 17, fontWeight: '700' },
  seeAllLink:   { color: C.grn, fontSize: 13, fontWeight: '600' },

  // ── Service grid
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 26,
  },
  serviceCard: {
    width: CARD_W,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 16,
    paddingTop: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  serviceArrow: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.bd2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  serviceTitle: { color: C.wh, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  serviceSub:   { color: C.gr, fontSize: 11, fontWeight: '400', lineHeight: 15 },

  // ── Categories
  catCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 18,
    marginBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  catRow:    { flexDirection: 'row', justifyContent: 'space-around' },
  catItem:   { alignItems: 'center', gap: 8 },
  catIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { color: C.gr, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // ── See all categories
  seeAllBtn: {
    marginHorizontal: 20,
    marginBottom: 26,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.bd,
    paddingVertical: 15,
    alignItems: 'center',
  },
  seeAllBtnTxt: { color: C.gr, fontSize: 14, fontWeight: '600' },

  // ── Recent activity
  actList: { paddingHorizontal: 20, gap: 8 },
  actRow: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actDot:    { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actInfo:   { flex: 1 },
  actName:   { color: C.wh, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  actRoute:  { color: C.gr, fontSize: 12 },
  badge:     { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  badgeTxt:  { fontSize: 11, fontWeight: '700' },

  // ── Empty state
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyTxt:    { color: C.gr, fontSize: 14, fontWeight: '500' },
  emptyBtn:    { marginTop: 4, backgroundColor: C.grnDim, borderRadius: 11, paddingHorizontal: 18, paddingVertical: 10 },
  emptyBtnTxt: { color: C.grn, fontSize: 13, fontWeight: '700' },

  // ── Voyageur CTA
  ctaCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: C.grn,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...Platform.select({
      ios:     { shadowColor: C.grnDk, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.50, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  ctaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(15,20,25,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBody:  { flex: 1 },
  ctaTitle: { color: '#0f1419', fontSize: 15, fontWeight: '800' },
  ctaSub:   { color: 'rgba(15,20,25,0.65)', fontSize: 12, marginTop: 2 },
});
