import React, {
  useEffect, useState, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Modal,
  TextInput, KeyboardAvoidingView, Image, Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { colisService } from '@/services/colis.service';
import { trajetService } from '@/services/trajet.service';
import { chatService } from '@/services/chat.service';
import { authService } from '@/services/auth.service';
import type { Colis, ChatMessage } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     '#0a0a0a',
  card:   '#141414',
  input:  '#1e1e1e',
  bd:     'rgba(255,255,255,0.07)',
  red:    '#dc2626',
  redDim: 'rgba(220,38,38,0.12)',
  wh:     '#ffffff',
  gr:     '#9ca3af',
  dim:    '#4b5563',
  grn:    '#22c55e',
  grnDim: 'rgba(34,197,94,0.13)',
  blu:    '#3b82f6',
  bluDim: 'rgba(59,130,246,0.13)',
  ylw:    '#facc15',
  ylwDim: 'rgba(250,204,21,0.13)',
} as const;

const STATUT_DOT: Record<string, string> = {
  ACCEPTE:  C.blu,
  EN_COURS: C.red,
  LIVRE:    C.grn,
  TERMINE:  C.dim,
};

const POLL_MS = 3_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMsgTime(m: ChatMessage): Date {
  const raw = m.createdAt ?? m.timestamp;
  return raw ? new Date(raw) : new Date();
}

function formatMsgTime(m: ChatMessage): string {
  try {
    return getMsgTime(m).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function timeAgoShort(m: ChatMessage): string {
  const diff = Date.now() - getMsgTime(m).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'maintenant';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return getMsgTime(m).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function toDateLabel(m: ChatMessage): string {
  const d = getMsgTime(m);
  const today  = new Date(); today.setHours(0,0,0,0);
  const yest   = new Date(today); yest.setDate(yest.getDate() - 1);
  const msgDay = new Date(d); msgDay.setHours(0,0,0,0);
  if (msgDay.getTime() === today.getTime()) return "Aujourd'hui";
  if (msgDay.getTime() === yest.getTime())  return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

type ListItem =
  | { kind: 'separator'; label: string; key: string }
  | { kind: 'message';   msg: ChatMessage };

function buildListItems(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastLabel = '';
  for (const msg of messages) {
    const label = toDateLabel(msg);
    if (label !== lastLabel) {
      items.push({ kind: 'separator', label, key: `sep-${label}` });
      lastLabel = label;
    }
    items.push({ kind: 'message', msg });
  }
  return items;
}

// ─── AudioPlayer bubble ───────────────────────────────────────────────────────
function AudioPlayer({ url, isMe }: { url: string; isMe: boolean }) {
  const [sound,    setSound]    = useState<Audio.Sound | null>(null);
  const [playing,  setPlaying]  = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const load = useCallback(async () => {
    if (sound) return;
    try {
      const { sound: s, status } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false },
        (st) => {
          if (st.isLoaded) {
            setPosition(st.positionMillis ?? 0);
            setDuration(st.durationMillis ?? 0);
            if (st.didJustFinish) {
              setPlaying(false);
              setPosition(0);
              s.setPositionAsync(0);
            }
          }
        }
      );
      setSound(s);
      if (status.isLoaded) setDuration(status.durationMillis ?? 0);
    } catch {}
  }, [url, sound]);

  useEffect(() => {
    load();
    return () => { sound?.unloadAsync(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    if (!sound) { await load(); return; }
    if (playing) {
      await sound.pauseAsync();
      setPlaying(false);
    } else {
      await sound.playAsync();
      setPlaying(true);
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={[AP.wrap, isMe ? AP.wrapMe : AP.wrapThem]}>
      <TouchableOpacity onPress={toggle} style={AP.btn} activeOpacity={0.8}>
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={18}
          color={isMe ? C.wh : C.gr}
        />
      </TouchableOpacity>
      <View style={AP.right}>
        <View style={AP.bar}>
          <View style={[AP.fill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
        </View>
        <Text style={[AP.time, isMe ? AP.timeMe : AP.timeThem]}>
          {duration > 0
            ? `${formatDuration(position)} / ${formatDuration(duration)}`
            : '…'}
        </Text>
      </View>
    </View>
  );
}

const AP = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180 },
  wrapMe:  {},
  wrapThem:{},
  btn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  right:   { flex: 1, gap: 4 },
  bar: {
    height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  fill:    { height: '100%', backgroundColor: C.wh, borderRadius: 2 },
  time:    { fontSize: 10 },
  timeMe:  { color: 'rgba(255,255,255,0.55)' },
  timeThem:{ color: C.dim },
});

// ─── ConversationCard ─────────────────────────────────────────────────────────
function getPreviewText(msg: ChatMessage | null | undefined, myEmail: string): string {
  if (!msg) return 'Appuyez pour démarrer la conversation';
  const prefix = msg.senderEmail === myEmail ? 'Vous : ' : '';
  if (msg.type === 'IMAGE') return `${prefix}📷 Photo`;
  if (msg.type === 'AUDIO') return `${prefix}🎵 Message vocal`;
  return `${prefix}${msg.content}`;
}

function ConversationCard({ item, myEmail, lastMsg, isUnread, onPress }: {
  item:     Colis;
  myEmail:  string;
  lastMsg:  ChatMessage | null | undefined;
  isUnread: boolean;
  onPress:  () => void;
}) {
  const dot         = STATUT_DOT[item.statut] ?? C.dim;
  const preview     = getPreviewText(lastMsg, myEmail);
  const previewTime = lastMsg ? timeAgoShort(lastMsg) : '';

  return (
    <TouchableOpacity style={[S.convCard, isUnread && S.convCardUnread]} activeOpacity={0.8} onPress={onPress}>
      <View style={[S.convAvatar, isUnread && S.convAvatarUnread]}>
        <Ionicons name="cube" size={20} color={isUnread ? C.blu : C.red} />
        {isUnread && <View style={S.unreadAvatarDot} />}
      </View>
      <View style={S.convBody}>
        <View style={S.convRow1}>
          <Text style={[S.convName, isUnread && S.convNameUnread]} numberOfLines={1}>
            {item.nom}
          </Text>
          {previewTime !== '' && (
            <Text style={[S.convTime, isUnread && S.convTimeUnread]}>{previewTime}</Text>
          )}
        </View>
        <View style={S.convRow2}>
          <Text style={[S.convPreview, isUnread && S.convPreviewUnread]} numberOfLines={1}>
            {preview}
          </Text>
          <View style={S.convRight}>
            <View style={[S.statusDot, { backgroundColor: dot }]} />
            {isUnread && <View style={S.unreadBadge}><Text style={S.unreadBadgeTxt}>N</Text></View>}
          </View>
        </View>
        <Text style={S.convRoute} numberOfLines={1}>{item.villeDepart} → {item.villeArrivee}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── ChatModal ────────────────────────────────────────────────────────────────
function ChatModal({ colis, myEmail, onClose }: {
  colis:   Colis;
  myEmail: string;
  onClose: () => void;
}) {
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [text,       setText]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);
  const [recording,  setRecording]  = useState(false);
  const [recDurMs,   setRecDurMs]   = useState(0);

  const listRef      = useRef<FlatList<ListItem>>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const recIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLen      = useRef(0);
  const recRef       = useRef<Audio.Recording | null>(null);
  const recStartRef  = useRef(0);

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const data = await chatService.getMessages(colis.id);
      setMessages(data);
      if (data.length > prevLen.current) {
        prevLen.current = data.length;
        setTimeout(() => listRef.current?.scrollToEnd({ animated: !silent }), 100);
      }
    } catch {}
    finally { setLoading(false); }
  }, [colis.id]);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(() => fetchMessages(true), POLL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMessages]);

  // ── Optimistic helpers ─────────────────────────────────────────────────────
  const addOptimistic = (partial: Partial<ChatMessage> & { type: ChatMessage['type'] }): string => {
    const tempId = `opt-${Date.now()}`;
    const msg: ChatMessage = {
      id:          tempId,
      colisId:     colis.id,
      senderEmail: myEmail,
      content:     '',
      timestamp:   new Date().toISOString(),
      ...partial,
    };
    setMessages(prev => [...prev, msg]);
    prevLen.current += 1;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return tempId;
  };

  const confirmOptimistic = (tempId: string, confirmed: ChatMessage) => {
    setMessages(prev => prev.map(m => m.id === tempId ? confirmed : m));
  };

  const removeOptimistic = (tempId: string) => {
    setMessages(prev => prev.filter(m => m.id !== tempId));
    prevLen.current -= 1;
  };

  // ── Send text ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    const tempId = addOptimistic({ type: 'TEXT', content });
    setText('');
    setSending(true);
    try {
      const confirmed = await chatService.sendMessage(colis.id, content);
      confirmOptimistic(tempId, confirmed);
    } catch {
      removeOptimistic(tempId);
      setText(content);
    } finally {
      setSending(false);
    }
  };

  // ── Pick image from gallery ────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour envoyer des photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      await uploadAndSendImage(result.assets[0].uri);
    }
  };

  // ── Take photo with camera ─────────────────────────────────────────────────
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la caméra pour prendre des photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      await uploadAndSendImage(result.assets[0].uri);
    }
  };

  const uploadAndSendImage = async (uri: string) => {
    const tempId = addOptimistic({ type: 'IMAGE', fileUrl: uri });
    setUploading(true);
    setUploadPct(0);

    // Fake incremental progress while uploading
    const prog = setInterval(() => setUploadPct(p => Math.min(p + 15, 85)), 200);
    try {
      const ext  = uri.split('.').pop() ?? 'jpg';
      const mime = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
      const url  = await chatService.uploadFile(uri, mime, `image_${Date.now()}.${ext}`);
      clearInterval(prog);
      setUploadPct(100);
      const confirmed = await chatService.sendMedia(colis.id, 'IMAGE', url);
      confirmOptimistic(tempId, confirmed);
    } catch {
      clearInterval(prog);
      removeOptimistic(tempId);
      Alert.alert('Erreur', 'Impossible d\'envoyer la photo.');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  // ── Image picker action sheet ──────────────────────────────────────────────
  const showImageOptions = () => {
    Alert.alert('Envoyer une image', '', [
      { text: 'Galerie',  onPress: pickImage },
      { text: 'Caméra',   onPress: takePhoto },
      { text: 'Annuler',  style: 'cancel' },
    ]);
  };

  // ── Audio recording ────────────────────────────────────────────────────────
  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès au microphone pour envoyer des messages vocaux.');
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recRef.current      = recording;
      recStartRef.current = Date.now();
      setRecording(true);
      setRecDurMs(0);
      recIntervalRef.current = setInterval(
        () => setRecDurMs(Date.now() - recStartRef.current),
        500,
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  const stopRecording = async () => {
    if (!recRef.current) return;
    if (recIntervalRef.current) clearInterval(recIntervalRef.current);
    setRecording(false);
    setRecDurMs(0);

    const rec = recRef.current;
    recRef.current = null;

    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      if (!uri) return;

      const tempId = addOptimistic({ type: 'AUDIO', fileUrl: uri });
      setUploading(true);
      setUploadPct(0);
      const prog = setInterval(() => setUploadPct(p => Math.min(p + 15, 85)), 200);
      try {
        const url  = await chatService.uploadFile(uri, 'audio/m4a', `audio_${Date.now()}.m4a`);
        clearInterval(prog);
        setUploadPct(100);
        const confirmed = await chatService.sendMedia(colis.id, 'AUDIO', url);
        confirmOptimistic(tempId, confirmed);
      } catch {
        clearInterval(prog);
        removeOptimistic(tempId);
        Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal.');
      } finally {
        setUploading(false);
        setUploadPct(0);
      }
    } catch {
      Alert.alert('Erreur', 'Enregistrement invalide.');
    }
  };

  // ── Render message ─────────────────────────────────────────────────────────
  const listItems = useMemo(() => buildListItems(messages), [messages]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'separator') {
      return (
        <View style={CM.separator}>
          <View style={CM.sepLine} />
          <Text style={CM.sepLabel}>{item.label}</Text>
          <View style={CM.sepLine} />
        </View>
      );
    }

    const msg   = item.msg;
    const isMe  = msg.senderEmail === myEmail;
    const isOpt = msg.id.startsWith('opt-');

    return (
      <View style={[CM.bubbleWrap, isMe ? CM.bubbleWrapMe : CM.bubbleWrapThem]}>
        <View style={[CM.bubble, isMe ? CM.bubbleMe : CM.bubbleThem, isOpt && CM.bubbleOptimistic]}>

          {msg.type === 'TEXT' && (
            <Text style={[CM.msgTxt, isMe ? CM.msgTxtMe : CM.msgTxtThem]}>
              {msg.content}
            </Text>
          )}

          {msg.type === 'IMAGE' && msg.fileUrl && (
            <View style={CM.imageBubble}>
              <Image
                source={{ uri: msg.fileUrl }}
                style={CM.image}
                resizeMode="cover"
              />
              {isOpt && (
                <View style={CM.imageOverlay}>
                  <ActivityIndicator color={C.wh} />
                </View>
              )}
            </View>
          )}

          {msg.type === 'AUDIO' && msg.fileUrl && !isOpt && (
            <AudioPlayer url={msg.fileUrl} isMe={isMe} />
          )}

          {msg.type === 'AUDIO' && isOpt && (
            <View style={CM.audioOptimistic}>
              <Ionicons name="mic" size={16} color={C.wh} />
              <ActivityIndicator color={C.wh} size="small" />
              <Text style={CM.audioOptTxt}>Envoi…</Text>
            </View>
          )}
        </View>

        <View style={[CM.metaRow, isMe && CM.metaRowMe]}>
          <Text style={CM.timeStamp}>{formatMsgTime(msg)}</Text>
          {isMe && (
            isOpt
              ? <Ionicons name="time-outline"   size={11} color="rgba(255,255,255,0.35)" />
              : <Ionicons name="checkmark-done" size={11} color="rgba(255,255,255,0.50)" />
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={CM.root}>
        <StatusBar style="light" />
        <SafeAreaView style={CM.safe} edges={['top']}>

          {/* ── Header */}
          <View style={CM.header}>
            <TouchableOpacity onPress={onClose} style={CM.backBtn} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={22} color={C.wh} />
            </TouchableOpacity>
            <View style={CM.headerInfo}>
              <View style={CM.headerTitleRow}>
                <Text style={CM.headerTitle} numberOfLines={1}>{colis.nom}</Text>
                <View style={CM.liveIndicator}>
                  <View style={CM.liveDot} />
                  <Text style={CM.liveTxt}>live</Text>
                </View>
              </View>
              <Text style={CM.headerSub}>{colis.villeDepart} → {colis.villeArrivee}</Text>
            </View>
          </View>

          {/* ── Upload progress bar */}
          {uploading && (
            <View style={CM.uploadBar}>
              <View style={[CM.uploadFill, { width: `${uploadPct}%` as `${number}%` }]} />
            </View>
          )}

          {/* ── Recording indicator */}
          {recording && (
            <View style={CM.recIndicator}>
              <View style={CM.recDot} />
              <Text style={CM.recTxt}>
                Enregistrement… {formatDuration(recDurMs)}
              </Text>
              <Text style={CM.recHint}>Relâcher le bouton pour envoyer</Text>
            </View>
          )}

          {/* ── Messages */}
          {loading ? (
            <View style={CM.center}>
              <ActivityIndicator color={C.red} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={listItems}
              keyExtractor={i => i.kind === 'separator' ? i.key : i.msg.id}
              contentContainerStyle={CM.messageList}
              showsVerticalScrollIndicator={false}
              onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={CM.empty}>
                  <View style={CM.emptyIconWrap}>
                    <Ionicons name="chatbubbles-outline" size={36} color={C.dim} />
                  </View>
                  <Text style={CM.emptyTitle}>Démarrez la conversation</Text>
                  <Text style={CM.emptyTxt}>
                    Envoyez un message pour commencer l'échange avec l'autre partie.
                  </Text>
                </View>
              }
              renderItem={renderItem}
            />
          )}

          {/* ── Input bar */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <SafeAreaView edges={['bottom']}>
              <View style={CM.inputRow}>

                {/* Image attach */}
                <TouchableOpacity
                  style={CM.iconBtn}
                  onPress={showImageOptions}
                  disabled={uploading || recording}
                  activeOpacity={0.75}
                >
                  <Ionicons name="image-outline" size={20} color={uploading || recording ? C.dim : C.gr} />
                </TouchableOpacity>

                {/* Text input */}
                <TextInput
                  style={CM.input}
                  placeholder="Votre message…"
                  placeholderTextColor={C.dim}
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={handleSend}
                  editable={!recording}
                />

                {/* Mic / Stop-recording */}
                <Pressable
                  style={[CM.iconBtn, recording && CM.iconBtnRec]}
                  onPress={recording ? stopRecording : startRecording}
                  disabled={uploading}
                >
                  <Ionicons
                    name={recording ? 'stop-circle' : 'mic-outline'}
                    size={22}
                    color={recording ? C.red : uploading ? C.dim : C.gr}
                  />
                </Pressable>

                {/* Send text — only visible when there's text */}
                {text.trim().length > 0 && !recording && (
                  <TouchableOpacity
                    style={[CM.sendBtn, (!text.trim() || sending) && CM.sendBtnDis]}
                    onPress={handleSend}
                    disabled={!text.trim() || sending}
                    activeOpacity={0.85}
                  >
                    {sending
                      ? <ActivityIndicator color={C.wh} size="small" />
                      : <Ionicons name="send" size={18} color={C.wh} />
                    }
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>

        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── MessagesScreen ───────────────────────────────────────────────────────────
export default function MessagesScreen() {
  const [conversations, setConvs]   = useState<Colis[]>([]);
  const [myEmail,    setMyEmail]     = useState('');
  const [isVoyageur, setIsVoyageur] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [refresh,    setRefresh]    = useState(false);
  const [selected,   setSelected]   = useState<Colis | null>(null);

  const [lastMsgs,  setLastMsgs]  = useState<Record<string, ChatMessage | null>>({});
  const [unreadSet, setUnreadSet] = useState<Set<string>>(new Set());

  const loadConversations = useCallback(async (isRefresh = false): Promise<Colis[]> => {
    isRefresh ? setRefresh(true) : setLoading(true);
    try {
      const session = await authService.getSession();
      const email   = session?.email ?? '';
      const voy     = session?.role === 'ROLE_VOYAGEUR';
      setMyEmail(email);
      setIsVoyageur(voy);

      let convs: Colis[];
      if (voy) {
        const trajets = await trajetService.getMyTrajets().catch(() => []);
        convs = trajets.flatMap(t => t.colis ?? []);
        convs = Array.from(new Map(convs.map(c => [c.id, c])).values());
      } else {
        const all = await colisService.getMyColis().catch(() => []);
        convs = all.filter(c => ['ACCEPTE', 'EN_COURS', 'LIVRE'].includes(c.statut) || !!c.trajetId);
      }

      setConvs(convs);
      return convs;
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  const loadPreviews = useCallback(async (convs: Colis[], email: string) => {
    if (convs.length === 0) return;
    const results = await Promise.allSettled(convs.map(c => chatService.getMessages(c.id)));
    const nextLastMsgs: Record<string, ChatMessage | null> = {};
    const nextUnread   = new Set<string>();

    convs.forEach((c, i) => {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.length > 0) {
        const last = r.value[r.value.length - 1];
        nextLastMsgs[c.id] = last;
        if (last.senderEmail !== email) nextUnread.add(c.id);
      } else {
        nextLastMsgs[c.id] = null;
      }
    });

    setLastMsgs(nextLastMsgs);
    setUnreadSet(nextUnread);
  }, []);

  useEffect(() => {
    loadConversations().then(convs => {
      authService.getSession().then(s => loadPreviews(convs, s?.email ?? ''));
    });
  }, [loadConversations, loadPreviews]);

  const handleRefresh = async () => {
    const convs = await loadConversations(true);
    const s     = await authService.getSession();
    await loadPreviews(convs, s?.email ?? '');
  };

  const openConversation = (colis: Colis) => {
    setSelected(colis);
    setUnreadSet(prev => { const n = new Set(prev); n.delete(colis.id); return n; });
  };

  const closeConversation = () => {
    setSelected(null);
    authService.getSession().then(s =>
      loadPreviews(conversations, s?.email ?? '')
    );
  };

  const unreadTotal = unreadSet.size;

  return (
    <View style={S.root}>
      <StatusBar style="light" />
      <SafeAreaView style={S.safe} edges={['top']}>

        <View style={S.header}>
          <View>
            <Text style={S.title}>Messages</Text>
            {unreadTotal > 0 && (
              <Text style={S.subtitle}>{unreadTotal} non lu{unreadTotal > 1 ? 's' : ''}</Text>
            )}
          </View>
          {unreadTotal > 0 && (
            <View style={S.countBadge}>
              <Text style={S.countBadgeTxt}>{unreadTotal}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color={C.red} size="large" />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={i => i.id}
            contentContainerStyle={S.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refresh} onRefresh={handleRefresh} tintColor={C.red} colors={[C.red]} />
            }
            ListHeaderComponent={
              conversations.length > 0 ? (
                <View style={S.infoBox}>
                  <Ionicons name="radio-outline" size={14} color={C.grn} />
                  <Text style={S.infoTxt}>
                    Actualisation automatique toutes les {POLL_MS / 1000} secondes dans les conversations
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={S.empty}>
                <View style={S.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={44} color={C.dim} />
                </View>
                <Text style={S.emptyTitle}>Aucune conversation</Text>
                <Text style={S.emptyTxt}>
                  {isVoyageur
                    ? 'Les conversations apparaissent ici lorsque vous avez des colis assignés à vos voyages.'
                    : "Les conversations apparaissent lorsqu'un voyageur accepte votre colis."}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ConversationCard
                item={item}
                myEmail={myEmail}
                lastMsg={lastMsgs[item.id]}
                isUnread={unreadSet.has(item.id)}
                onPress={() => openConversation(item)}
              />
            )}
          />
        )}
      </SafeAreaView>

      {selected && (
        <ChatModal colis={selected} myEmail={myEmail} onClose={closeConversation} />
      )}
    </View>
  );
}

// ─── Conversation list styles ─────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
  },
  title:    { color: C.wh, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: C.gr, fontSize: 12, fontWeight: '500', marginTop: 2 },
  countBadge: {
    minWidth: 28, height: 28, borderRadius: 14,
    backgroundColor: C.blu, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countBadgeTxt: { color: C.wh, fontSize: 13, fontWeight: '800' },

  list: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(34,197,94,0.07)',
    borderRadius: 12, padding: 11, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.18)',
  },
  infoTxt: { color: C.grn, fontSize: 12, fontWeight: '500', flex: 1 },

  convCard: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.bd,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  convCardUnread: { borderColor: 'rgba(59,130,246,0.30)', backgroundColor: 'rgba(59,130,246,0.05)' },
  convAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: C.redDim,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  convAvatarUnread: { backgroundColor: 'rgba(59,130,246,0.15)' },
  unreadAvatarDot: {
    position: 'absolute', top: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.blu, borderWidth: 1.5, borderColor: C.bg,
  },

  convBody:    { flex: 1, gap: 3 },
  convRow1:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convRow2:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convName:    { color: C.wh, fontSize: 15, fontWeight: '700', flex: 1 },
  convNameUnread: { color: C.wh, fontWeight: '800' },
  convTime:    { color: C.dim, fontSize: 11, fontWeight: '500', marginLeft: 8 },
  convTimeUnread: { color: C.blu, fontWeight: '700' },
  convPreview: { color: C.gr, fontSize: 12, fontWeight: '400', flex: 1 },
  convPreviewUnread: { color: C.wh, fontWeight: '500' },
  convRoute:   { color: C.dim, fontSize: 11 },
  convRight:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  unreadBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.blu, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeTxt: { color: C.wh, fontSize: 9, fontWeight: '900' },

  empty: { alignItems: 'center', paddingTop: 70, gap: 14 },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: C.wh, fontSize: 18, fontWeight: '700' },
  emptyTxt:   { color: C.gr, fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 },
});

// ─── Chat modal styles ────────────────────────────────────────────────────────
const CM = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: C.bd,
    backgroundColor: '#0d0d0d',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: C.bd,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo:     { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:    { color: C.wh, fontSize: 16, fontWeight: '800' },
  liveIndicator:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.grn },
  liveTxt:        { color: C.grn, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  headerSub:      { color: C.gr, fontSize: 12, marginTop: 2 },

  // Upload progress strip
  uploadBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.07)' },
  uploadFill: { height: '100%', backgroundColor: C.blu },

  // Recording indicator
  recIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderBottomWidth: 1, borderColor: 'rgba(220,38,38,0.18)',
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  recTxt: { color: C.red, fontSize: 13, fontWeight: '700', flex: 1 },
  recHint:{ color: 'rgba(220,38,38,0.55)', fontSize: 11 },

  messageList: { padding: 16, gap: 4, paddingBottom: 20 },

  separator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  sepLine:   { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  sepLabel:  { color: C.dim, fontSize: 11, fontWeight: '600' },

  bubbleWrap:     { marginBottom: 4 },
  bubbleWrapMe:   { alignItems: 'flex-end' },
  bubbleWrapThem: { alignItems: 'flex-start' },

  bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: {
    backgroundColor: C.red, borderBottomRightRadius: 5,
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.30, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  bubbleThem: {
    backgroundColor: '#1e1e1e', borderBottomLeftRadius: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  bubbleOptimistic: { opacity: 0.75 },

  msgTxt:     { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  msgTxtMe:   { color: C.wh },
  msgTxtThem: { color: C.wh },

  // Image bubble
  imageBubble: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  image: {
    width: 220, height: 160, borderRadius: 12,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Audio optimistic placeholder
  audioOptimistic: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4,
  },
  audioOptTxt: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },

  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, paddingHorizontal: 4 },
  metaRowMe: { justifyContent: 'flex-end' },
  timeStamp: { fontSize: 10, color: 'rgba(255,255,255,0.40)' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: C.gr, fontSize: 15, fontWeight: '600' },
  emptyTxt:   { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30 },

  // Input bar
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderColor: C.bd,
    backgroundColor: '#0d0d0d',
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnRec: { backgroundColor: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.30)' },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: C.wh,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.red, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.40, shadowRadius: 10 },
      android: { elevation: 7 },
    }),
  },
  sendBtnDis: { backgroundColor: '#2a2a2a', opacity: 0.5 },
});
