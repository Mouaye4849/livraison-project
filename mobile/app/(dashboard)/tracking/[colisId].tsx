import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { GpsMap } from '@/components/GpsMap';

// ─── Screen ───────────────────────────────────────────────────────────────────
// Minimal fullscreen wrapper — all UI is inside GpsMap's floating overlay system.
export default function TrackingScreen() {
  const params   = useLocalSearchParams<{ colisId: string }>();
  const colisId  = Array.isArray(params.colisId) ? params.colisId[0] : params.colisId;

  console.log('[COLISID] STEP 5/5 screen    param colisId    =', JSON.stringify(colisId));

  if (!colisId) {
    return (
      <View style={S.errorWrap}>
        <StatusBar style="light" />
        <Text style={S.errorTxt}>ID du colis manquant.</Text>
      </View>
    );
  }

  return (
    <View style={S.root}>
      {/* Translucent status bar so the map extends under it on Android */}
      <StatusBar style="light" translucent />
      <GpsMap
        colisId={colisId}
        onBack={() => router.back()}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0d12',
  },
  errorWrap: {
    flex: 1,
    backgroundColor: '#0a0d12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTxt: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
});
