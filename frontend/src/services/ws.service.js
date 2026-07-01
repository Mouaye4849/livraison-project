import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Vite proxies /chat → http://localhost:8080/chat (with ws: true for WebSocket upgrades)
const SOCKJS_ENDPOINT =
    "https://livraison-backend-j76m.onrender.com/chat";

/**
 * Creates a new STOMP client connected via SockJS.
 * Each caller manages its own client lifecycle (activate/deactivate in useEffect).
 *
 * @param {() => void} onConnect  - Called when the STOMP session is established.
 * @returns {Client}
 */
export function createStompClient(onConnect) {
    const client = new Client({
        webSocketFactory: () => new SockJS(SOCKJS_ENDPOINT),
        reconnectDelay: 3_000,
        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,
        onConnect,
        onDisconnect: () => {
            console.log("[GPS-WS] STOMP disconnected — will reconnect");
        },
        onStompError: (frame) => {
            console.error("[GPS-WS] STOMP error:", frame.headers?.message, frame.body);
        },
    });
    return client;
}
