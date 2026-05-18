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

const C = {
  bg:   '#0a0a0a',
  bar:  '#0d0d0d',
  red:  '#dc2626',
  gray: '#4b5563',
  wh:   '#ffffff',
  bd:   'rgba(255,255,255,0.06)',
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
          color={isFocused ? C.wh : C.gray}
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authService.isAuthenticated().then((ok) => {
      if (!ok) router.replace('/(tabs)');
      else setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.red} size="large" />
      </View>
    );
  }

  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="colis" />
      <Tabs.Screen name="voyages" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="paiement"       options={{ href: null }} />
      <Tabs.Screen name="paiements"      options={{ href: null }} />
      <Tabs.Screen name="notifications"  options={{ href: null }} />
    </Tabs>
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
    backgroundColor: C.red,
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.50, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  pillLabel: {
    color: C.wh,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
