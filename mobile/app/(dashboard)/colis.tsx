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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AxiosError } from 'axios';
import { colisService } from '@/services/colis.service';
import { trajetService } from '@/services/trajet.service';
import { authService } from '@/services/auth.service';
import type { Colis, ColisRequest, Trajet, ApiError } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#eef1ee',
  card:   '#ffffff',
  input:  '#f0f4f0',
  bd:     'rgba(0,0,0,0.08)',
  bdFoc:  'rgba(34,197,94,0.50)',
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
} as const;

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  BROUILLON: { label: 'Brouillon', color: C.gr,  bg: 'rgba(156,163,175,0.12)', icon: 'document-outline'      },
  PUBLIE:    { label: 'Publié',    color: C.blu,  bg: C.bluDim,                icon: 'megaphone-outline'      },
  ACCEPTE:   { label: 'Accepté',  color: C.ylw,  bg: C.ylwDim,                icon: 'checkmark-circle-outline'},
  EN_COURS:  { label: 'En cours', color: C.red,   bg: C.redDim,                icon: 'bicycle-outline'         },
  LIVRE:     { label: 'Livré',    color: C.grn,   bg: C.grnDim,                icon: 'checkmark-done-outline'  },
  TERMINE:   { label: 'Terminé',  color: C.grn,   bg: C.grnDim,                icon: 'trophy-outline'          },
  ANNULE:    { label: 'Annulé',   color: C.dim,   bg: 'rgba(0,0,0,0.05)',icon: 'close-circle-outline'    },
};

type FilterKey = 'all' | 'actifs' | 'livres' | 'annules';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'Tous'    },
  { key: 'actifs',  label: 'Actifs'  },
  { key: 'livres',  label: 'Livrés'  },
  { key: 'annules', label: 'Annulés' },
];

function filterColis(colis: Colis[], key: FilterKey): Colis[] {
  switch (key) {
    case 'actifs':  return colis.filter(c => ['PUBLIE', 'ACCEPTE', 'EN_COURS'].includes(c.statut));
    case 'livres':  return colis.filter(c => ['LIVRE', 'TERMINE'].includes(c.statut));
    case 'annules': return colis.filter(c => c.statut === 'ANNULE');
    default:        return colis;
  }
}

// ─── ColisCard ────────────────────────────────────────────────────────────────
function ColisCard({ item, onPublish, onCancel }: {
  item: Colis;
  onPublish: (id: string) => void;
  onCancel:  (id: string) => void;
}) {
  const cfg = STATUT_CFG[item.statut] ?? STATUT_CFG.BROUILLON;
  return (
    <View style={S.card}>
      <View style={S.cardTop}>
        <View style={[S.cardIcon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
        </View>
        <View style={S.cardMeta}>
          <Text style={S.cardName} numberOfLines={1}>{item.nom}</Text>
          <Text style={S.cardRoute}>{item.villeDepart} → {item.villeArrivee}</Text>
        </View>
        <View style={[S.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[S.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={S.cardDetails}>
        <View style={S.detail}>
          <Ionicons name="scale-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>{item.poidsKg} kg</Text>
        </View>
        <View style={S.detail}>
          <Ionicons name="layers-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>x{item.quantite}</Text>
        </View>
        <View style={S.detail}>
          <Ionicons name="cash-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>{item.prixProposeMRU} MRU</Text>
        </View>
        {item.nomDestinataire ? (
          <View style={S.detail}>
            <Ionicons name="person-outline" size={13} color={C.gr} />
            <Text style={S.detailTxt} numberOfLines={1}>{item.nomDestinataire}</Text>
          </View>
        ) : null}
      </View>

      {/* Linked trajet banner — shown when a voyageur has accepted this colis */}
      {item.trajetId && ['ACCEPTE', 'EN_COURS', 'LIVRE'].includes(item.statut) && (
        <View style={S.trajetBanner}>
          <Ionicons name="airplane" size={13} color={C.grn} />
          <Text style={S.trajetBannerTxt}>Voyage en cours de livraison</Text>
          <View style={S.trajetBannerDot} />
        </View>
      )}

      {/* GPS live tracking button — EN_COURS only */}
      {item.statut === 'EN_COURS' && item.trajetId && (
        <TouchableOpacity
          style={S.gpsBtn}
          activeOpacity={0.85}
          onPress={() => router.push({
            pathname: '/(dashboard)/tracking/[colisId]',
            params: { colisId: item.id },
          } as any)}
        >
          <Ionicons name="map" size={14} color={C.blu} />
          <Text style={S.gpsBtnTxt}>Suivre en direct</Text>
        </TouchableOpacity>
      )}

      {item.statut === 'BROUILLON' && (
        <View style={S.cardActions}>
          <TouchableOpacity
            style={S.publishBtn}
            activeOpacity={0.85}
            onPress={() => onPublish(item.id)}
          >
            <Ionicons name="megaphone-outline" size={14} color={C.wh} />
            <Text style={S.publishBtnTxt}>Publier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={S.cancelBtn}
            activeOpacity={0.85}
            onPress={() => onCancel(item.id)}
          >
            <Text style={S.cancelBtnTxt}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.statut === 'LIVRE' && !item.paid && (
        <TouchableOpacity
          style={S.payBtn}
          activeOpacity={0.85}
          onPress={() => router.navigate({
            pathname: '/(dashboard)/paiement',
            params: { colisId: item.id },
          } as any)}
        >
          <Ionicons name="card-outline" size={15} color={C.wh} />
          <Text style={S.payBtnTxt}>Payer maintenant</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── CreateModal ──────────────────────────────────────────────────────────────
function CreateModal({ visible, onClose, onCreated }: {
  visible:   boolean;
  onClose:   () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const [form, setForm]     = useState<ColisRequest>({
    nom: '', poidsKg: 0, quantite: 1, prixProposeMRU: 0,
    villeDepart: '', villeArrivee: '',
    nomDestinataire: '', numDestinataire: '',
  });

  const set = (k: keyof ColisRequest, v: string) => {
    const numFields: (keyof ColisRequest)[] = ['poidsKg', 'quantite', 'prixProposeMRU'];
    setForm(f => ({ ...f, [k]: numFields.includes(k) ? (parseFloat(v) || 0) : v }));
  };

  const validate = (): string | null => {
    if (!form.nom.trim())              return 'Le nom du colis est requis';
    if (form.poidsKg <= 0)             return 'Le poids doit être supérieur à 0';
    if (form.quantite < 1)             return 'La quantité doit être au moins 1';
    if (form.prixProposeMRU <= 0)      return 'Le prix doit être supérieur à 0';
    if (!form.villeDepart.trim())      return 'La ville de départ est requise';
    if (!form.villeArrivee.trim())     return 'La ville d\'arrivée est requise';
    if (!form.nomDestinataire.trim())  return 'Le nom du destinataire est requis';
    if (!form.numDestinataire.trim())  return 'Le numéro du destinataire est requis';
    return null;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (e) { setErr(e); return; }
    setSaving(true);
    setErr('');
    try {
      await colisService.create(form);
      onCreated();
      onClose();
      setForm({ nom: '', poidsKg: 0, quantite: 1, prixProposeMRU: 0, villeDepart: '', villeArrivee: '', nomDestinataire: '', numDestinataire: '' });
    } catch (ex) {
      const ae = (ex as AxiosError<ApiError>).response?.data;
      setErr(ae?.message ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={SM.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={SM.sheet}
        >
          <View style={SM.handle} />
          <View style={SM.sheetHeader}>
            <Text style={SM.sheetTitle}>Nouveau colis</Text>
            <TouchableOpacity onPress={onClose} style={SM.closeBtn}>
              <Ionicons name="close" size={20} color={C.gr} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={SM.scrollContent}>
            {err !== '' && (
              <View style={SM.errBox}>
                <Ionicons name="warning-outline" size={16} color={C.red} />
                <Text style={SM.errTxt}>{err}</Text>
              </View>
            )}

            {([
              { label: 'Nom du colis',        key: 'nom',              placeholder: 'Ex: Livres, Vêtements...',  kbd: 'default'  },
              { label: 'Poids (kg)',           key: 'poidsKg',          placeholder: '0.5',                        kbd: 'decimal'  },
              { label: 'Quantité',             key: 'quantite',         placeholder: '1',                          kbd: 'numeric'  },
              { label: 'Prix proposé (MRU)',   key: 'prixProposeMRU',   placeholder: '500',                        kbd: 'numeric'  },
              { label: 'Ville de départ',      key: 'villeDepart',      placeholder: 'Nouakchott',                 kbd: 'default'  },
              { label: 'Ville d\'arrivée',     key: 'villeArrivee',     placeholder: 'Nouadhibou',                 kbd: 'default'  },
              { label: 'Nom du destinataire',  key: 'nomDestinataire',  placeholder: 'Mohamed Ould...',            kbd: 'default'  },
              { label: 'Tél. destinataire',    key: 'numDestinataire',  placeholder: '+222 XX XX XX XX',           kbd: 'phone-pad'},
            ] as const).map(f => (
              <View key={f.key} style={SM.field}>
                <Text style={SM.label}>{f.label}</Text>
                <TextInput
                  style={SM.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.dim}
                  keyboardType={f.kbd as any}
                  value={String(form[f.key] === 0 ? '' : form[f.key])}
                  onChangeText={v => set(f.key, v)}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[SM.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving
                ? <ActivityIndicator color={C.wh} size="small" />
                : <Text style={SM.submitTxt}>Créer le colis</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── PublicColisCard ──────────────────────────────────────────────────────────
function PublicColisCard({ item, onAssign }: {
  item: Colis;
  onAssign: (colis: Colis) => void;
}) {
  return (
    <View style={S.card}>
      <View style={S.cardTop}>
        <View style={[S.cardIcon, { backgroundColor: C.bluDim }]}>
          <Ionicons name="megaphone-outline" size={20} color={C.blu} />
        </View>
        <View style={S.cardMeta}>
          <Text style={S.cardName} numberOfLines={1}>{item.nom}</Text>
          <Text style={S.cardRoute}>{item.villeDepart} → {item.villeArrivee}</Text>
        </View>
        <View style={[S.badge, { backgroundColor: C.bluDim }]}>
          <Text style={[S.badgeTxt, { color: C.blu }]}>Publié</Text>
        </View>
      </View>

      <View style={S.cardDetails}>
        <View style={S.detail}>
          <Ionicons name="scale-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>{item.poidsKg} kg</Text>
        </View>
        <View style={S.detail}>
          <Ionicons name="layers-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>x{item.quantite}</Text>
        </View>
        <View style={S.detail}>
          <Ionicons name="cash-outline" size={13} color={C.gr} />
          <Text style={S.detailTxt}>{item.prixProposeMRU} MRU</Text>
        </View>
      </View>

      <TouchableOpacity
        style={S.accepterBtn}
        activeOpacity={0.85}
        onPress={() => onAssign(item)}
      >
        <Ionicons name="link-outline" size={15} color={C.wh} />
        <Text style={S.accepterBtnTxt}>Assigner à un voyage</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── SelectTrajetModal ────────────────────────────────────────────────────────
// Colis-first assignment flow (mirrors web PublicColis.jsx):
// voyageur picks one of their OUVERT trajets to assign a specific public colis to.
function SelectTrajetModal({ colis, trajets, visible, onClose, onAssigned }: {
  colis:      Colis | null;
  trajets:    Trajet[];
  visible:    boolean;
  onClose:    () => void;
  onAssigned: () => void;
}) {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [err,  setErr]            = useState('');
  const [done, setDone]           = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(null);
      setErr('');
      setDone(false);
      setAssigning(false);
    }
  }, [visible, colis]);

  const ouvertTrajets = trajets.filter(t => t.statut === 'OUVERT');

  const handleAssign = async () => {
    if (!colis || !selected) return;
    setAssigning(true);
    setErr('');
    try {
      await colisService.assignToTrajet(colis.id, selected);
      setDone(true);
      onAssigned();
      setTimeout(() => { onClose(); setDone(false); }, 1400);
    } catch (ex) {
      const ae = (ex as AxiosError<ApiError>).response?.data;
      setErr(ae?.message ?? (ex as AxiosError).message ?? 'Erreur lors de l\'assignation');
    } finally {
      setAssigning(false);
    }
  };

  if (!colis) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ST.overlay}>
        <View style={ST.sheet}>
          <View style={ST.handle} />

          {/* ── Header */}
          <View style={ST.header}>
            <View style={ST.headerLeft}>
              <View style={ST.iconWrap}>
                <Ionicons name="airplane" size={20} color={C.red} />
              </View>
              <View>
                <Text style={ST.title}>Choisir un voyage</Text>
                <Text style={ST.subtitle} numberOfLines={1}>{colis.nom}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={ST.closeBtn} activeOpacity={0.75}>
              <Ionicons name="close" size={19} color={C.gr} />
            </TouchableOpacity>
          </View>

          {/* ── Colis info row */}
          <View style={ST.colisInfo}>
            <View style={ST.colisPill}>
              <Ionicons name="navigate-outline" size={12} color={C.gr} />
              <Text style={ST.colisPillTxt}>{colis.villeDepart} → {colis.villeArrivee}</Text>
            </View>
            <View style={ST.colisPill}>
              <Ionicons name="scale-outline" size={12} color={C.gr} />
              <Text style={ST.colisPillTxt}>{colis.poidsKg} kg</Text>
            </View>
            <View style={ST.colisPill}>
              <Ionicons name="cash-outline" size={12} color={C.gr} />
              <Text style={ST.colisPillTxt}>{colis.prixProposeMRU} MRU</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={ST.scroll} showsVerticalScrollIndicator={false}>
            {/* ── Feedback banners */}
            {err !== '' && (
              <View style={ST.errBox}>
                <Ionicons name="alert-circle" size={16} color={C.red} />
                <Text style={ST.errTxt}>{err}</Text>
              </View>
            )}
            {done && (
              <View style={ST.successBox}>
                <Ionicons name="checkmark-circle" size={16} color={C.grn} />
                <Text style={ST.successTxt}>Colis assigné avec succès !</Text>
              </View>
            )}

            {/* ── Trajet list */}
            {ouvertTrajets.length === 0 ? (
              <View style={ST.empty}>
                <View style={ST.emptyIconWrap}>
                  <Ionicons name="airplane-outline" size={36} color={C.dim} />
                </View>
                <Text style={ST.emptyTitle}>Aucun voyage ouvert</Text>
                <Text style={ST.emptyTxt}>
                  Vous n'avez aucun voyage ouvert disponible. Créez un voyage dans l'onglet Voyages.
                </Text>
              </View>
            ) : (
              <>
                <Text style={ST.sectionLabel}>{ouvertTrajets.length} voyage{ouvertTrajets.length > 1 ? 's' : ''} ouvert{ouvertTrajets.length > 1 ? 's' : ''}</Text>
                {ouvertTrajets.map(t => {
                  const isSelected = t.id === selected;
                  const date = t.dateDepart
                    ? new Date(t.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                    : '—';
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[ST.trajetCard, isSelected && ST.trajetCardSelected]}
                      onPress={() => setSelected(isSelected ? null : t.id)}
                      activeOpacity={0.85}
                    >
                      {/* Radio */}
                      <View style={[ST.radio, isSelected && ST.radioSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color={C.wh} />}
                      </View>

                      {/* Route */}
                      <View style={ST.trajetInfo}>
                        <Text style={ST.trajetRoute} numberOfLines={1}>
                          {t.origine} → {t.destination}
                        </Text>
                        <Text style={ST.trajetMeta}>{date} · {t.capaciteKg} kg dispo.</Text>
                      </View>

                      {/* Arrow */}
                      <Ionicons name="chevron-forward" size={16} color={isSelected ? C.red : C.dim} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ── Assign button */}
            {ouvertTrajets.length > 0 && (
              <TouchableOpacity
                style={[ST.assignBtn, (!selected || assigning || done) && ST.assignBtnDisabled]}
                onPress={handleAssign}
                disabled={!selected || assigning || done}
                activeOpacity={0.88}
              >
                {assigning ? (
                  <ActivityIndicator color={C.wh} size="small" />
                ) : (
                  <>
                    <Ionicons name="link" size={18} color={C.wh} />
                    <Text style={ST.assignBtnTxt}>
                      {selected ? 'Accepter ce colis' : 'Sélectionnez un voyage'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── ColisScreen ──────────────────────────────────────────────────────────────
export default function ColisScreen() {
  const [colis, setColis]           = useState<Colis[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refresh, setRefresh]       = useState(false);
  const [filter, setFilter]         = useState<FilterKey>('all');
  const [showCreate, setCreate]     = useState(false);

  // Voyageur-only
  const [isVoyageur,   setIsVoyageur]   = useState(false);
  const [activeTab,    setActiveTab]    = useState<'mine' | 'public'>('mine');
  const [publicColis,  setPublicColis]  = useState<Colis[]>([]);
  const [myTrajets,    setMyTrajets]    = useState<Trajet[]>([]);
  const [loadingPub,   setLoadingPub]   = useState(false);
  const [assignTarget, setAssignTarget] = useState<Colis | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoading(true);
    try {
      const session = await authService.getSession();
      const voy = session?.role === 'ROLE_VOYAGEUR';
      setIsVoyageur(voy);

      const data = await colisService.getMyColis();
      setColis(data);
    } catch {
      setColis([]);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  const loadPublic = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoadingPub(true);
    try {
      const [pub, trajets] = await Promise.all([
        colisService.getPublicColis().catch(() => [] as Colis[]),
        trajetService.getMyTrajets().catch(() => [] as Trajet[]),
      ]);
      setPublicColis(pub);
      setMyTrajets(trajets);
    } finally {
      setLoadingPub(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isVoyageur && activeTab === 'public') loadPublic();
  }, [isVoyageur, activeTab, loadPublic]);

  const handlePublish = async (id: string) => {
    try {
      await colisService.publish(id);
      await load();
    } catch {
      Alert.alert('Erreur', 'Impossible de publier ce colis');
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert('Confirmer', 'Annuler ce colis ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, annuler', style: 'destructive', onPress: async () => {
        try { await colisService.cancel(id); await load(); }
        catch { Alert.alert('Erreur', 'Impossible d\'annuler'); }
      }},
    ]);
  };

  const displayed = filterColis(colis, filter);

  return (
    <View style={S.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={S.safe} edges={['top']}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>{activeTab === 'public' ? 'Colis disponibles' : 'Mes Colis'}</Text>
          {activeTab === 'mine' && (
            <TouchableOpacity
              style={S.addBtn}
              activeOpacity={0.85}
              onPress={() => setCreate(true)}
            >
              <Ionicons name="add" size={22} color={C.wh} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab bar — voyageur only */}
        {isVoyageur && (
          <View style={S.tabRow}>
            <TouchableOpacity
              style={[S.tabBtn, activeTab === 'mine' && S.tabBtnActive]}
              onPress={() => setActiveTab('mine')}
              activeOpacity={0.8}
            >
              <Text style={[S.tabTxt, activeTab === 'mine' && S.tabTxtActive]}>Mes colis</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.tabBtn, activeTab === 'public' && S.tabBtnActive]}
              onPress={() => setActiveTab('public')}
              activeOpacity={0.8}
            >
              <Text style={[S.tabTxt, activeTab === 'public' && S.tabTxtActive]}>Disponibles</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── "Mes colis" tab */}
        {activeTab === 'mine' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.filterRow}
            >
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[S.filterTab, filter === f.key && S.filterTabActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[S.filterTxt, filter === f.key && S.filterTxtActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <View style={S.center}>
                <ActivityIndicator color={C.grn} size="large" />
              </View>
            ) : (
              <FlatList
                data={displayed}
                keyExtractor={i => i.id}
                contentContainerStyle={S.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refresh}
                    onRefresh={() => load(true)}
                    tintColor={C.grn}
                    colors={[C.grn]}
                  />
                }
                ListEmptyComponent={
                  <View style={S.empty}>
                    <Ionicons name="cube-outline" size={48} color={C.dim} />
                    <Text style={S.emptyTitle}>Aucun colis</Text>
                    <Text style={S.emptyTxt}>
                      {filter === 'all'
                        ? 'Créez votre premier colis en appuyant sur +'
                        : 'Aucun colis dans cette catégorie'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <ColisCard item={item} onPublish={handlePublish} onCancel={handleCancel} />
                )}
              />
            )}
          </>
        )}

        {/* ── "Disponibles" tab (voyageur: colis-first assignment) */}
        {activeTab === 'public' && (
          loadingPub ? (
            <View style={S.center}>
              <ActivityIndicator color={C.grn} size="large" />
            </View>
          ) : (
            <FlatList
              data={publicColis}
              keyExtractor={i => i.id}
              contentContainerStyle={S.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refresh}
                  onRefresh={() => loadPublic(true)}
                  tintColor={C.red}
                  colors={[C.red]}
                />
              }
              ListEmptyComponent={
                <View style={S.empty}>
                  <Ionicons name="megaphone-outline" size={48} color={C.dim} />
                  <Text style={S.emptyTitle}>Aucun colis disponible</Text>
                  <Text style={S.emptyTxt}>
                    Aucun colis publié ne correspond pour le moment.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <PublicColisCard item={item} onAssign={c => setAssignTarget(c)} />
              )}
            />
          )
        )}
      </SafeAreaView>

      <CreateModal
        visible={showCreate}
        onClose={() => setCreate(false)}
        onCreated={() => load()}
      />

      <SelectTrajetModal
        colis={assignTarget}
        trajets={myTrajets}
        visible={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => loadPublic()}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },
  safe:  { flex: 1 },
  center:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { color: C.wh, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.grn,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.grnDk, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },

  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 14 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.bd,
  },
  filterTabActive: { backgroundColor: C.grnDim, borderColor: 'rgba(74,222,128,0.35)' },
  filterTxt:       { color: C.gr,  fontSize: 13, fontWeight: '600' },
  filterTxtActive: { color: C.grn, fontSize: 13, fontWeight: '700' },

  list: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.bd,
    padding: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardName: { color: C.wh, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cardRoute:{ color: C.gr, fontSize: 12 },
  badge:    { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },

  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  detail:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailTxt:   { color: C.gr, fontSize: 12, fontWeight: '500' },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.grn,
    borderRadius: 12,
    paddingVertical: 11,
  },
  publishBtnTxt: { color: '#0f1419', fontSize: 13, fontWeight: '700' },
  cancelBtn:     { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: C.bd },
  cancelBtnTxt:  { color: C.gr, fontSize: 13, fontWeight: '600' },

  trajetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.22)',
  },
  trajetBannerTxt: { color: C.grn, fontSize: 12, fontWeight: '600', flex: 1 },
  trajetBannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.grn },

  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.grn,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 4,
    ...Platform.select({
      ios:     { shadowColor: C.grn, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  payBtnTxt: { color: C.wh, fontSize: 14, fontWeight: '700' },

  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.30)',
  },
  gpsBtnTxt: { color: C.blu, fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: C.wh, fontSize: 18, fontWeight: '700' },
  emptyTxt:   { color: C.gr, fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 },

  // ── Voyageur tab bar
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.bd,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: C.grnDim, borderColor: 'rgba(74,222,128,0.35)' },
  tabTxt:       { color: C.gr,  fontSize: 13, fontWeight: '600' },
  tabTxtActive: { color: C.grn, fontSize: 13, fontWeight: '700' },

  // ── Public colis card "Assigner" button
  accepterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(220,38,38,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.30)',
  },
  accepterBtnTxt: { color: C.red, fontSize: 13, fontWeight: '700' },
});

// ─── SelectTrajetModal styles ─────────────────────────────────────────────────
const ST = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.55, shadowRadius: 24 },
      android: { elevation: 32 },
    }),
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.12)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { color: C.wh, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: C.gr, fontSize: 12, fontWeight: '400', marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

  colisInfo: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  colisPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  colisPillTxt: { color: C.gr, fontSize: 12, fontWeight: '500' },

  scroll: { padding: 20, gap: 12, paddingBottom: 44 },

  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(220,38,38,0.10)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)',
  },
  errTxt: { color: C.red, fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
  },
  successTxt: { color: C.grn, fontSize: 13, fontWeight: '600', flex: 1 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: C.wh, fontSize: 16, fontWeight: '700' },
  emptyTxt:   { color: C.gr, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  sectionLabel: { color: C.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  trajetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f5f8f5',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  trajetCardSelected: {
    borderColor: 'rgba(220,38,38,0.50)',
    backgroundColor: 'rgba(220,38,38,0.06)',
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { backgroundColor: C.red, borderColor: C.red },

  trajetInfo: { flex: 1 },
  trajetRoute: { color: C.wh, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  trajetMeta:  { color: C.gr, fontSize: 12, fontWeight: '400' },

  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.red,
    borderRadius: 18, paddingVertical: 17,
    marginTop: 4,
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  assignBtnDisabled: { backgroundColor: '#f5f8f5', opacity: 0.55 },
  assignBtnTxt: { color: C.wh, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
});

const SM = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  sheetTitle:  { color: C.wh, fontSize: 19, fontWeight: '800' },
  closeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(220,38,38,0.12)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)' },
  errTxt: { color: C.red, fontSize: 13, fontWeight: '500', flex: 1 },

  field: { gap: 7 },
  label: { color: C.gr, fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  input: {
    backgroundColor: C.input,
    borderWidth: 1,
    borderColor: C.bd,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: C.wh,
    fontSize: 15,
  },

  submitBtn: {
    backgroundColor: C.grn,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios:     { shadowColor: C.grnDk, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 14 },
      android: { elevation: 10 },
    }),
  },
  submitTxt: { color: '#0f1419', fontSize: 16, fontWeight: '700' },
});
