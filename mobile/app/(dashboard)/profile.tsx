import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { authService } from '@/services/auth.service';
import { colisService } from '@/services/colis.service';
import type { StoredUser, Colis } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#eef1ee',
  card:    '#ffffff',
  card2:   '#f5f8f5',
  bd:      'rgba(0,0,0,0.08)',
  bd2:     'rgba(0,0,0,0.04)',
  grn:     '#22c55e',
  grnDk:   '#166534',
  grnMid:  '#16a34a',
  grnDim:  'rgba(34,197,94,0.12)',
  grnBd:   'rgba(34,197,94,0.25)',
  wh:      '#1a2e1a',
  gr:      '#6b7280',
  dim:     '#9ca3af',
  red:     '#dc2626',
  redDim:  'rgba(220,38,38,0.10)',
  ylw:     '#d97706',
  ylwDim:  'rgba(217,119,6,0.10)',
  blu:     '#2563eb',
  bluDim:  'rgba(37,99,235,0.10)',
} as const;

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ROLE_USER:     { label: 'Client',   color: C.blu, bg: C.bluDim },
  ROLE_VOYAGEUR: { label: 'Voyageur', color: C.grn, bg: C.grnDim },
  ROLE_ADMIN:    { label: 'Admin',    color: C.ylw, bg: C.ylwDim },
};

interface MenuItem {
  icon:    string;
  label:   string;
  sub?:    string;
  onPress: () => void;
  danger?: boolean;
}

// ─── MenuRow ──────────────────────────────────────────────────────────────────
function MenuRow({ item }: { item: MenuItem }) {
  return (
    <TouchableOpacity style={S.menuRow} activeOpacity={0.72} onPress={item.onPress}>
      <View style={[S.menuIconWrap, { backgroundColor: item.danger ? 'rgba(248,81,73,0.10)' : C.bd2 }]}>
        <Ionicons
          name={item.icon as any}
          size={19}
          color={item.danger ? C.red : C.gr}
        />
      </View>
      <View style={S.menuBody}>
        <Text style={[S.menuLabel, item.danger && { color: C.red }]}>{item.label}</Text>
        {item.sub && <Text style={S.menuSub}>{item.sub}</Text>}
      </View>
      {!item.danger && (
        <View style={S.menuChevron}>
          <Ionicons name="chevron-forward" size={15} color={C.dim} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [user, setUser]       = useState<StoredUser | null>(null);
  const [colis, setColis]     = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [session, myCol] = await Promise.all([
        authService.getSession(),
        colisService.getMyColis().catch(() => [] as Colis[]),
      ]);
      setUser(session);
      setColis(myCol);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[S.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={C.grn} size="large" />
      </View>
    );
  }

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Utilisateur';
  const initials    = displayName.slice(0, 2).toUpperCase();
  const roleCfg     = ROLE_CFG[user?.role ?? 'ROLE_USER'] ?? ROLE_CFG.ROLE_USER;

  const totalColis     = colis.length;
  const activeColis    = colis.filter(c => ['PUBLIE', 'ACCEPTE', 'EN_COURS'].includes(c.statut)).length;
  const deliveredColis = colis.filter(c => c.statut === 'LIVRE' || c.statut === 'TERMINE').length;

  const MENU_ITEMS: MenuItem[] = [
    {
      icon:    'create-outline',
      label:   'Modifier le profil',
      sub:     'Nom, email, informations',
      onPress: () => {},
    },
    {
      icon:    'time-outline',
      label:   'Historique des colis',
      sub:     `${totalColis} colis au total`,
      onPress: () => router.navigate('/(dashboard)/colis' as any),
    },
    {
      icon:    'card-outline',
      label:   'Mes paiements',
      sub:     'Historique des transactions',
      onPress: () => router.navigate('/(dashboard)/paiements' as any),
    },
    {
      icon:    'notifications-outline',
      label:   'Notifications',
      sub:     'Préférences de notifications',
      onPress: () => {},
    },
    {
      icon:    'shield-checkmark-outline',
      label:   'Sécurité',
      sub:     'Mot de passe et authentification',
      onPress: () => {},
    },
    {
      icon:    'help-circle-outline',
      label:   'Aide & Support',
      sub:     'FAQ, contact, signalement',
      onPress: () => {},
    },
    {
      icon:    'information-circle-outline',
      label:   'À propos de WASALI',
      sub:     'Version 1.0.0',
      onPress: () => {},
    },
    {
      icon:    'log-out-outline',
      label:   'Se déconnecter',
      onPress: handleLogout,
      danger:  true,
    },
  ];

  return (
    <View style={S.root}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── HERO HEADER ─────────────────────────────────── */}
        <View style={S.hero}>
          {/* Decorative blobs for depth */}
          <View style={S.blobTL} />
          <View style={S.blobBR} />
          <View style={S.blobCenter} />

          {/* Safe area + top action buttons */}
          <SafeAreaView edges={['top']} style={S.heroSafe}>
            <View style={S.heroActions}>
              <TouchableOpacity style={S.heroActionBtn} activeOpacity={0.75}>
                <Ionicons name="ellipsis-horizontal" size={18} color={C.wh} />
              </TouchableOpacity>
              <TouchableOpacity style={S.heroActionBtn} activeOpacity={0.75}>
                <Ionicons name="share-outline" size={18} color={C.wh} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Avatar */}
          <View style={S.heroAvatarRing}>
            <View style={S.heroAvatar}>
              <Text style={S.heroAvatarTxt}>{initials}</Text>
            </View>
          </View>

          {/* Name + role */}
          <Text style={S.heroName}>{displayName}</Text>
          <Text style={S.heroEmail}>{user?.email}</Text>

          <View style={[S.heroBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Text style={S.heroBadgeTxt}>{roleCfg.label}</Text>
          </View>
        </View>

        {/* ── STATS STRIP ─────────────────────────────────── */}
        <View style={S.statsStrip}>
          <View style={S.statItem}>
            <Text style={S.statVal}>{totalColis}</Text>
            <Text style={S.statLbl}>Total</Text>
          </View>
          <View style={S.statSep} />
          <View style={S.statItem}>
            <Text style={[S.statVal, { color: C.ylw }]}>{activeColis}</Text>
            <Text style={S.statLbl}>Actifs</Text>
          </View>
          <View style={S.statSep} />
          <View style={S.statItem}>
            <Text style={[S.statVal, { color: C.grn }]}>{deliveredColis}</Text>
            <Text style={S.statLbl}>Livrés</Text>
          </View>
        </View>

        {/* ── MENU LIST ───────────────────────────────────── */}
        <View style={S.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.label}>
              <MenuRow item={item} />
              {idx < MENU_ITEMS.length - 1 && <View style={S.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── FOOTER ──────────────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.footerBrand}>WASALI</Text>
          <Text style={S.footerSub}>Livraisons rapides en Mauritanie · v1.0.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },
  scroll:{ paddingBottom: 36 },

  // ── Hero header
  hero: {
    backgroundColor: '#0d2818',
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: C.grnDk, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 24 },
      android: { elevation: 16 },
    }),
  },
  blobTL: {
    position: 'absolute',
    top: -70,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(74,222,128,0.10)',
  },
  blobBR: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(22,101,52,0.35)',
  },
  blobCenter: {
    position: 'absolute',
    top: '30%',
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(74,222,128,0.06)',
  },
  heroSafe:    { width: '100%' },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  heroActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarRing: {
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 3,
    borderColor: 'rgba(74,222,128,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: C.grnDk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarTxt: { color: '#f0f6fc', fontSize: 32, fontWeight: '800' },
  heroName:      { color: '#f0f6fc', fontSize: 22, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  heroEmail:     { color: 'rgba(255,255,255,0.68)', fontSize: 13, marginBottom: 14 },
  heroBadge:     { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  heroBadgeTxt:  { color: '#f0f6fc', fontSize: 12, fontWeight: '700' },

  // ── Stats strip
  statsStrip: {
    marginHorizontal: 20,
    marginTop: -1,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.bd,
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  statItem: { flex: 1, alignItems: 'center' },
  statSep:  { width: 1, backgroundColor: C.bd },
  statVal:  { color: C.wh, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl:  { color: C.gr, fontSize: 11, fontWeight: '500', marginTop: 4 },

  // ── Menu
  menuCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.bd,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody:     { flex: 1 },
  menuLabel:    { color: C.wh, fontSize: 15, fontWeight: '600' },
  menuSub:      { color: C.dim, fontSize: 12, marginTop: 2 },
  menuChevron: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.bd2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginLeft: 72 },

  // ── Footer
  footer:      { alignItems: 'center', gap: 5, paddingBottom: 8 },
  footerBrand: { color: C.dim, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  footerSub:   { color: C.dim, fontSize: 11 },
});
