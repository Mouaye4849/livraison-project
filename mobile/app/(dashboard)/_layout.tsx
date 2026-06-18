import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services/auth.service';
import { trajetService } from '@/services/trajet.service';
import { useGpsSharing } from '@/hooks/useGpsSharing';
import type { Colis } from '@/types';

// Invisible component — keeps GPS sharing alive for ONE EN_COURS colis
// regardless of which screen the voyageur is currently on.
function GpsBroadcastSlot({ colisId }: { colisId: string }) {
  useGpsSharing(colisId, true);
  return null;
}

const C = {
  bg:    '#eef1ee',
  bar:   'rgba(11,17,30,0.97)',
  grn:   '#22c55e',
  grnDk: '#166534',
  gray:  '#6b7280',
  wh:    '#f0f6fc',
  bd:    'rgba(255,255,255,0.09)',
} as const;

const TABS = [
  { name: 'home',     label: 'Accueil',  icon: 'home-outline',       activeIcon: 'home'       },
  { name: 'colis',    label: 'Colis',    icon: 'cube-outline',       activeIcon: 'cube'       },
  { name: 'voyages',  label: 'Voyages',  icon: 'airplane-outline',   activeIcon: 'airplane'   },
  { name: 'messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { name: 'profile',  label: 'Profil',   icon: 'person-outline',     activeIcon: 'person'     },
] as const;

type TabDef = typeof TABS[number];

function TabItem({
  tab,
  isFocused,
  onPress,
}: {
  tab: TabDef;
  isFocused: boolean;
  onPress: () => void;
}) {
  const sc = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));

  const handlePress = () => {
    sc.value = withSpring(0.88, { damping: 10, stiffness: 400 }, () => {
      sc.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={S.tabItem} activeOpacity={1}>
      <Animated.View style={[S.pill, isFocused && S.pillActive, anim]}>
        <Ionicons
          name={(isFocused ? tab.activeIcon : tab.icon) as any}
          size={20}
          color={isFocused ? '#0f1419' : C.gray}
        />
        {isFocused && <Text style={S.pillLabel}>{tab.label}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[S.tabBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {TABS.map((tab, i) => (
        <TabItem
          key={tab.name}
          tab={tab}
          isFocused={state.index === i}
          onPress={() => navigation.navigate(tab.name)}
        />
      ))}
    </View>
  );
}

export default function DashboardLayout() {
  const [ready,         setReady]         = useState(false);
  const [isVoyageur,   setIsVoyageur]     = useState(false);
  const [activeColisIds, setActiveColisIds] = useState<string[]>([]);

  // Auth check — runs once on mount
  useEffect(() => {
    authService.isAuthenticated().then(async (ok) => {
      if (!ok) { router.replace('/(tabs)'); return; }
      const session = await authService.getSession();
      setIsVoyageur(session?.role === 'ROLE_VOYAGEUR');
      setReady(true);
    });
  }, []);

  // Keep the list of EN_COURS colis up to date so GPS broadcast slots stay alive.
  // Polls every 30 s; also refreshes immediately when isVoyageur becomes true.
  useEffect(() => {
    if (!isVoyageur) return;

    const refresh = () => {
      trajetService.getMyTrajets()
        .then((trajets) => {
          const ids: string[] = [];
          trajets.forEach((t) => {
            (t.colis ?? []).forEach((c: Colis) => {
              if (c.statut === 'EN_COURS') ids.push(c.id);
            });
          });
          setActiveColisIds((prev) => {
            const same = prev.length === ids.length && prev.every((id, i) => id === ids[i]);
            return same ? prev : ids;
          });
        })
        .catch(() => { /* silent — GPS sharing continues with last known list */ });
    };

    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [isVoyageur]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.grn} size="large" />
      </View>
    );
  }

  return (
    <>
      {/* One invisible GPS broadcaster per EN_COURS colis — persists across navigation */}
      {activeColisIds.map((id) => (
        <GpsBroadcastSlot key={id} colisId={id} />
      ))}

      <Tabs
        tabBar={(props: any) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="colis" />
        <Tabs.Screen name="voyages" />
        <Tabs.Screen name="messages" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="paiement"            options={{ href: null }} />
        <Tabs.Screen name="paiements"           options={{ href: null }} />
        <Tabs.Screen name="notifications"       options={{ href: null }} />
        <Tabs.Screen name="tracking/[colisId]"  options={{ href: null }} />
      </Tabs>
    </>
  );
}

const S = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bar,
    borderTopWidth: 1,
    borderTopColor: C.bd,
    paddingTop: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.55, shadowRadius: 22 },
      android: { elevation: 30 },
    }),
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pillActive: {
    backgroundColor: C.grn,
    ...Platform.select({
      ios:     { shadowColor: C.grnDk, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.60, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  pillLabel: {
    color: '#0f1419',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
