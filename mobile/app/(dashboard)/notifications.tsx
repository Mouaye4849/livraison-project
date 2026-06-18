import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#eef1ee',
  card:   '#ffffff',
  bd:     'rgba(0,0,0,0.08)',
  grn:    '#22c55e',
  grnDk:  '#166534',
  grnDim: 'rgba(34,197,94,0.12)',
  grnBd:  'rgba(34,197,94,0.25)',
  wh:     '#1a2e1a',
  gr:     '#6b7280',
  dim:    '#9ca3af',
  red:    '#dc2626',
  redDim: 'rgba(220,38,38,0.10)',
  ylw:    '#d97706',
  ylwDim: 'rgba(217,119,6,0.10)',
  blu:    '#2563eb',
  bluDim: 'rgba(37,99,235,0.10)',
  pur:    '#7c3aed',
  purDim: 'rgba(124,58,237,0.10)',
} as const;

const POLL_INTERVAL = 10_000; // 10 s — same as web

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Derive a contextual icon from the notification message text
function iconForMessage(msg: string): { name: string; color: string; bg: string } {
  const m = msg.toLowerCase();
  if (m.includes('colis'))           return { name: 'cube',             color: C.grn, bg: C.grnDim };
  if (m.includes('trajet') || m.includes('voyage'))
                                     return { name: 'airplane',         color: C.blu, bg: C.bluDim };
  if (m.includes('paiement') || m.includes('payé') || m.includes('mru'))
                                     return { name: 'cash',             color: C.grn, bg: C.grnDim };
  if (m.includes('message') || m.includes('chat'))
                                     return { name: 'chatbubble',       color: C.pur, bg: C.purDim };
  if (m.includes('livr'))            return { name: 'checkmark-circle', color: C.grn, bg: C.grnDim };
  if (m.includes('accepté') || m.includes('accepte'))
                                     return { name: 'checkmark-circle', color: C.grn, bg: C.grnDim };
  if (m.includes('refus') || m.includes('annul'))
                                     return { name: 'close-circle',     color: C.red, bg: C.redDim };
  return { name: 'notifications',    color: C.ylw, bg: C.ylwDim };
}

// ─── NotificationRow ──────────────────────────────────────────────────────────
function NotificationRow({ item, onPress }: { item: Notification; onPress: (n: Notification) => void }) {
  const isUnread = item.statut !== 'LU';
  const ic = iconForMessage(item.message);

  return (
    <TouchableOpacity
      style={[S.row, isUnread && S.rowUnread]}
      activeOpacity={0.80}
      onPress={() => onPress(item)}
    >
      {/* Unread indicator stripe */}
      {isUnread && <View style={S.unreadStripe} />}

      {/* Icon */}
      <View style={[S.iconWrap, { backgroundColor: ic.bg }]}>
        <Ionicons name={ic.name as any} size={20} color={ic.color} />
      </View>

      {/* Content */}
      <View style={S.content}>
        <Text style={[S.message, !isUnread && S.messageDim]} numberOfLines={3}>
          {item.message}
        </Text>
        <View style={S.meta}>
          <Ionicons
            name="time-outline"
            size={11}
            color={isUnread ? 'rgba(156,163,175,0.8)' : C.dim}
          />
          <Text style={[S.time, !isUnread && S.timeDim]}>
            {timeAgo(item.dateEnvoi)}
          </Text>
          {isUnread && (
            <View style={S.unreadBadge}>
              <Text style={S.unreadBadgeTxt}>Nouveau</Text>
            </View>
          )}
        </View>
      </View>

      {/* Read state dot */}
      {isUnread && <View style={S.dot} />}
    </TouchableOpacity>
  );
}

// ─── NotificationsScreen ──────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const [marking,  setMarking]  = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unreadCount = notifications.filter(n => n.statut !== 'LU').length;

  const fetch = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoading(prev => prev);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch {
      // silently keep previous state on poll failure
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetch();
  }, [fetch]);

  // 10-second polling — same cadence as web NotificationBell
  useEffect(() => {
    intervalRef.current = setInterval(() => fetch(), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  const handleMarkAsRead = async (item: Notification) => {
    if (item.statut === 'LU') return;
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === item.id ? { ...n, statut: 'LU' } : n)
    );
    try {
      await notificationService.markAsRead(item.id);
    } catch {
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, statut: item.statut } : n)
      );
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0 || marking) return;
    setMarking(true);
    // Optimistic: mark all as read locally
    const snapshot = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, statut: 'LU' as const })));
    try {
      await notificationService.markAllAsRead(snapshot);
    } catch {
      setNotifications(snapshot); // revert
    } finally {
      setMarking(false);
    }
  };

  return (
    <View style={S.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={S.safe} edges={['top']}>

        {/* ── Header */}
        <View style={S.header}>
          <TouchableOpacity
            style={S.backBtn}
            activeOpacity={0.75}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={C.wh} />
          </TouchableOpacity>

          <View style={S.headerCenter}>
            <Text style={S.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={S.countBadge}>
                <Text style={S.countBadgeTxt}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              style={S.markAllBtn}
              activeOpacity={0.75}
              onPress={handleMarkAll}
              disabled={marking}
            >
              {marking
                ? <ActivityIndicator size="small" color={C.grn} />
                : <Text style={S.markAllTxt}>Tout lire</Text>
              }
            </TouchableOpacity>
          ) : (
            <View style={{ width: 72 }} />
          )}
        </View>

        {/* ── Content */}
        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color={C.grn} size="large" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={i => i.id}
            contentContainerStyle={S.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refresh}
                onRefresh={() => fetch(true)}
                tintColor={C.grn}
                colors={[C.grn]}
              />
            }
            ListHeaderComponent={
              notifications.length > 0 ? (
                <View style={S.listHeader}>
                  <Text style={S.listHeaderTxt}>
                    {unreadCount > 0
                      ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                      : 'Tout est lu'}
                  </Text>
                  {unreadCount === 0 && (
                    <Ionicons name="checkmark-circle" size={14} color={C.grn} />
                  )}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={S.empty}>
                <View style={S.emptyIconWrap}>
                  <Ionicons name="notifications-off-outline" size={44} color={C.dim} />
                </View>
                <Text style={S.emptyTitle}>Aucune notification</Text>
                <Text style={S.emptyTxt}>
                  Vous serez notifié ici des mises à jour de vos colis, voyages et messages.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <NotificationRow item={item} onPress={handleMarkAsRead} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.bd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { color: C.wh, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  countBadge: {
    backgroundColor: C.grn,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeTxt: { color: '#0f1419', fontSize: 11, fontWeight: '800' },
  markAllBtn: {
    width: 72,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.grnDim,
    borderWidth: 1,
    borderColor: C.grnBd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllTxt: { color: C.grn, fontSize: 12, fontWeight: '700' },

  // ── List
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  listHeaderTxt: { color: C.dim, fontSize: 12, fontWeight: '600' },

  // ── Notification row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  rowUnread: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.22)',
  },
  unreadStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.blu,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  content: { flex: 1, gap: 5 },
  message: {
    color: C.wh,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  messageDim: { color: C.gr, fontWeight: '400' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { color: 'rgba(156,163,175,0.8)', fontSize: 11, fontWeight: '500' },
  timeDim: { color: C.dim },

  unreadBadge: {
    backgroundColor: 'rgba(59,130,246,0.20)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  unreadBadgeTxt: { color: C.blu, fontSize: 10, fontWeight: '700' },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.blu,
    flexShrink: 0,
    marginTop: 6,
  },

  // ── Empty state
  empty: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: C.wh, fontSize: 18, fontWeight: '700' },
  emptyTxt:   {
    color: C.gr,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 36,
  },
});
