import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGpsSharing, type GpsShareStatus } from '@/hooks/useGpsSharing';

interface StatusConfig {
  bg:           string;
  border:       string;
  color:        string;
  label:        string;
  showPulse?:   boolean;
  showSpinner?: boolean;
  icon?:        keyof typeof Ionicons.glyphMap;
}

const STATUS_CONFIG: Record<GpsShareStatus, StatusConfig> = {
  requesting: {
    bg:          'rgba(59,130,246,0.08)',
    border:      'rgba(59,130,246,0.22)',
    color:       '#3b82f6',
    label:       'Localisation en cours…',
    showSpinner: true,
  },
  active: {
    // GPS works AND STOMP is connected and publishing
    bg:        'rgba(34,197,94,0.08)',
    border:    'rgba(34,197,94,0.22)',
    color:     '#22c55e',
    label:     'GPS actif',
    showPulse: true,
  },
  gps_only: {
    // GPS fix obtained and publish() called — waiting for backend ACK
    bg:        'rgba(217,119,6,0.08)',
    border:    'rgba(217,119,6,0.22)',
    color:     '#d97706',
    label:     'GPS en attente backend…',
    showSpinner: true,
  },
  permission_denied: {
    bg:     'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.22)',
    color:  '#dc2626',
    label:  'Permission GPS refusée',
    icon:   'location-off-outline' as any,
  },
  unavailable: {
    bg:     'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.22)',
    color:  '#9ca3af',
    label:  'GPS non disponible',
    icon:   'location-outline',
  },
  error: {
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)',
    color:  '#f59e0b',
    label:  'Erreur GPS/réseau',
    icon:   'warning-outline',
  },
};

interface Props {
  colisId: string;
}

export function GpsShareBadge({ colisId }: Props) {
  const { status, coords } = useGpsSharing(colisId, true);
  const cfg = STATUS_CONFIG[status];

  const label =
    status === 'active' && coords
      ? `GPS actif · ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
      : cfg.label;

  return (
    <View style={[S.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {cfg.showPulse && (
        <View style={S.pulseOuter}>
          <View style={[S.pulseDot, { backgroundColor: cfg.color }]} />
        </View>
      )}
      {cfg.showSpinner && (
        <ActivityIndicator size={11} color={cfg.color} />
      )}
      {cfg.icon && (
        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
      )}
      <Text style={[S.label, { color: cfg.color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             6,
    borderRadius:   10,
    borderWidth:     1,
    paddingHorizontal: 10,
    paddingVertical:    6,
  },
  pulseOuter: {
    width: 10, height: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pulseDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  label: {
    fontSize:   11,
    fontWeight: '600',
    flexShrink: 1,
  },
});
