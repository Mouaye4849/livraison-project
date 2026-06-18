/**
 * STOMP singleton — v3
 * Transport: native WebSocket, NO SockJS, NO sub-protocol headers.
 *
 * Why no sub-protocols?
 *   brokerURL passes Sec-WebSocket-Protocol: v12.stomp, ... in the handshake.
 *   When Vite proxies the upgrade, http-proxy drops the server's
 *   Sec-WebSocket-Protocol response header. RFC 6455 §4.1 requires the client
 *   (OkHttp/Android) to close if it sent protocol headers and the server
 *   responded with none → instant close, "All transports failed" from old SockJS,
 *   or code=1006 with empty reason from native WS.
 *   webSocketFactory creates a plain WebSocket(url) with NO protocol list,
 *   so no header negotiation happens and the proxy works cleanly.
 *
 * URL strategy:
 *   1st attempt: ws://IP:8080/ws  (direct to Spring Boot — confirmed working)
 *   2nd attempt: ws://IP:5173/ws  (Vite proxy fallback — if port 8080 is blocked)
 *   Direct is tried first because Vite's http-proxy WebSocket upgrade forwarding
 *   is unreliable for external Android devices and causes onWebSocketError()
 *   on every initial connection attempt, adding ~3 s startup delay.
 *   Once a URL succeeds it is locked for all subsequent reconnects.
 */

import { Client } from '@stomp/stompjs';
import { WS_BASE_URL, WS_DIRECT_URL } from '@/constants/config';

// ▶▶▶ THIS LOG PROVES THIS VERSION OF THE FILE IS RUNNING IN METRO ◀◀◀
// If Metro has NOT rebuilt: this line will NOT appear. Run: npx expo start --clear
console.warn('▶▶▶ [STOMP-v3] loaded — webSocketFactory, no SockJS, no sub-protocols ◀◀◀');

// ─── State ────────────────────────────────────────────────────────────────────
let _client: Client | null = null;
let _connected = false;

// ─── URL rotation ─────────────────────────────────────────────────────────────
// Direct port 8080 first: confirmed working on Android, no Vite-proxy overhead.
// Vite proxy (5173) is the fallback in case Windows Firewall blocks 8080.
const _candidates = [WS_DIRECT_URL, WS_BASE_URL];
let _candidateIdx = 0;          // cycles when connection fails before onConnect
let _succeededUrl: string | null = null;  // locked after first successful connect
let _lastCreatedUrl = '';

function pickUrl(): string {
    if (_succeededUrl) return _succeededUrl;
    const url = _candidates[_candidateIdx % _candidates.length];
    _candidateIdx++;
    return url;
}

// ─── Exponential backoff ──────────────────────────────────────────────────────
const RECONNECT_BASE_MS = 3_000;
const RECONNECT_MAX_MS  = 30_000;
let _reconnectAttempt = 0;

function nextReconnectDelay(): number {
    const d = Math.min(RECONNECT_BASE_MS * Math.pow(2, _reconnectAttempt), RECONNECT_MAX_MS);
    _reconnectAttempt = Math.min(_reconnectAttempt + 1, 8);
    return d;
}

type Listener = () => void;
const _connectListeners    = new Set<Listener>();
const _disconnectListeners = new Set<Listener>();

// ─── Boot ─────────────────────────────────────────────────────────────────────
function boot(): Client {
    if (_client) return _client;

    console.warn('[STOMP] ══ boot()  candidates:', _candidates);

    _client = new Client({
        // Plain WebSocket — NO Sec-WebSocket-Protocol headers (avoids Vite proxy
        // sub-protocol forwarding issue that causes immediate close on Android OkHttp).
        webSocketFactory: () => {
            _lastCreatedUrl = pickUrl();
            console.warn('[STOMP] ══ webSocketFactory()');
            console.warn('[STOMP]   url      =', _lastCreatedUrl);
            console.warn('[STOMP]   attempt  =', _candidateIdx - 1);
            console.warn('[STOMP]   locked?  =', _succeededUrl ? 'yes → ' + _succeededUrl : 'no, cycling');
            return new WebSocket(_lastCreatedUrl);
        },

        // Send STOMP frames as binary WebSocket frames.
        // OkHttp/JNI truncates text frames at the STOMP null-byte terminator (\x00),
        // so the server never receives a parseable CONNECT → onConnect never fires.
        // Binary frames (opcode 2) bypass the String/JNI conversion.
        forceBinaryWSFrames: true,

        // Server sends TEXT frames back. OkHttp may truncate the trailing \x00.
        // This option appends the missing \x00 before parsing incoming frames.
        appendMissingNULLonIncoming: true,

        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,
        reconnectDelay: 3_000,

        debug: (str) => console.log('[STOMP-DBG]', str),

        onConnect: (frame) => {
            _succeededUrl = _lastCreatedUrl;   // lock to this URL
            _reconnectAttempt = 0;
            _connected = true;
            console.warn('[STOMP] ✓ onConnect()');
            console.warn('[STOMP]   url     =', _succeededUrl);
            console.warn('[STOMP]   session =', frame.headers?.session);
            console.warn('[STOMP]   version =', frame.headers?.version);
            _connectListeners.forEach((cb) => {
                try { cb(); } catch (e) { console.error('[STOMP] connect-listener error', e); }
            });
        },

        onDisconnect: () => {
            console.log('[STOMP] onDisconnect()');
            _connected = false;
            _disconnectListeners.forEach((cb) => {
                try { cb(); } catch (e) { console.error('[STOMP] disconnect-listener error', e); }
            });
        },

        onStompError: (frame) => {
            console.error('[STOMP] onStompError()  msg=', frame.headers?.message, '  body=', frame.body);
        },

        onWebSocketClose: (evt) => {
            const e = evt as CloseEvent;
            const wasConnected = _connected;
            _connected = false;
            const delay = nextReconnectDelay();
            console.warn('[STOMP] ✗ onWebSocketClose()');
            console.warn('[STOMP]   url      =', _lastCreatedUrl);
            console.warn('[STOMP]   code     =', e.code);
            console.warn('[STOMP]   reason   =', JSON.stringify(e.reason));
            console.warn('[STOMP]   wasConn  =', wasConnected);
            console.warn('[STOMP]   nextIn   =', delay, 'ms');
            if (!wasConnected) {
                // Failed BEFORE connecting → no URL is locked → cycle will pick next one
                console.warn('[STOMP]   → failed before connect, next attempt will try:', _candidates[_candidateIdx % _candidates.length]);
            }
            if (_client) _client.reconnectDelay = delay;
        },

        onWebSocketError: (evt) => {
            console.error('[STOMP] ✗ onWebSocketError()  url=', _lastCreatedUrl, '  event=', JSON.stringify(evt));
        },
    });

    console.log('[STOMP] activate()  primary=', _candidates[0], '  fallback=', _candidates[1]);
    _client.activate();
    return _client;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const stompSingleton = {
    get isConnected(): boolean { return _connected; },

    init(): void { boot(); },

    publish(destination: string, body: string): void {
        const client = boot();
        if (!_connected) {
            console.log('[STOMP] publish() — not connected, dropping');
            return;
        }
        console.log('[STOMP] publish →', destination);
        client.publish({ destination, body, headers: { 'content-type': 'application/json' } });
    },

    subscribe(destination: string, handler: (body: string) => void): () => void {
        let sub: { unsubscribe: () => void } | null = null;
        let active = true;

        const doSubscribe = () => {
            if (!active) return;
            sub?.unsubscribe();
            sub = null;
            console.warn('[STOMP] ◆ SUBSCRIBE  dest=', JSON.stringify(destination));
            sub = boot().subscribe(destination, (msg) => {
                // Low-level frame log — fires before any handler logic.
                // If this appears but [GPS-TRACK] ◉ LIVE never appears, the
                // handler itself threw; if this never appears, no frame arrived.
                console.warn('[STOMP] ◉ RAW-MSG  dest=', JSON.stringify(msg.headers.destination),
                             '  subId=', msg.headers['subscription'],
                             '  len=', msg.body?.length ?? 0);
                if (active) {
                    handler(msg.body);
                } else {
                    console.warn('[STOMP] ◉ RAW-MSG dropped — subscription already inactive');
                }
            });
            // Log the subscription ID assigned by @stomp/stompjs.
            // The backend's [WS-IN] ◆ SUBSCRIBE  subId=... must show the same value.
            // The backend's [WS-OUT] ◆ MESSAGE → subId=... must also match.
            const subId = (sub as unknown as { id?: string })?.id ?? 'unknown';
            console.warn('[STOMP] ◆ SUBSCRIBE registered  subId=', subId, '  dest=', JSON.stringify(destination));
        };

        const removeOnConnect = stompSingleton.addConnectListener(doSubscribe);

        return () => {
            active = false;
            removeOnConnect();
            if (sub) {
                console.log('[STOMP] unsubscribe ←', destination);
                sub.unsubscribe();
                sub = null;
            }
        };
    },

    addConnectListener(cb: Listener): () => void {
        _connectListeners.add(cb);
        if (_connected) {
            try { cb(); } catch (e) { console.error('[STOMP] immediate connect-listener error', e); }
        } else {
            boot();
        }
        return () => _connectListeners.delete(cb);
    },

    addDisconnectListener(cb: Listener): () => void {
        _disconnectListeners.add(cb);
        return () => _disconnectListeners.delete(cb);
    },
};
