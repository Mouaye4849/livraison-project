import { useEffect, useState, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "../api";
import { Bell, Loader2 } from "lucide-react";

// Mirror the backend's encodeEmail() helper so the topic path matches exactly.
function encodeEmail(email) {
    return email.replace(/@/g, "__at__").replace(/\./g, "__dot__");
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const containerRef = useRef(null);
    const stompClientRef = useRef(null);

    // ── Determine which endpoint to call based on role ─────────────────────────
    const isAdmin = localStorage.getItem("role") === "ROLE_ADMIN";
    // Admin endpoint: GET /api/admin/notifications (fixed — was /notifications/notifications)
    // Regular users:  GET /api/notifications/me
    const notifUrl = isAdmin ? "/admin/notifications" : "/notifications/me";

    // ── Fetch (REST) ───────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(notifUrl);
            setNotifications(res.data);
            setUnread(res.data.filter((n) => n.statut !== "LU").length);
        } catch (err) {
            console.error("Notification fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [notifUrl]);

    // ── Polling (10 s) — fallback / initial load ───────────────────────────────
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // ── STOMP / WebSocket (real-time push) ─────────────────────────────────────
    useEffect(() => {
        const userRaw = localStorage.getItem("user");
        const email = userRaw ? JSON.parse(userRaw)?.email : null;
        if (!email) return;

        const topic = `/topic/notif/${encodeEmail(email)}`;

        const client = new Client({
            // Use the Vite-proxied path so the request is same-origin (no CORS,
            // no direct connection to :8080, works in production behind a reverse proxy).
            webSocketFactory: () =>
                new SockJS("https://livraison-backend-j76m.onrender.com/chat"),
            reconnectDelay: 5_000,
            onConnect: () => {
                client.subscribe(topic, (frame) => {
                    try {
                        const incoming = JSON.parse(frame.body);
                        // Prepend the new notification at the top
                        setNotifications((prev) => {
                            // Avoid duplicates if REST poll already picked it up
                            if (prev.some((n) => n.id === incoming.id)) return prev;
                            return [incoming, ...prev];
                        });
                        setUnread((prev) => prev + 1);
                    } catch (e) {
                        console.error("STOMP notification parse error:", e);
                    }
                });
            },
            onStompError: (frame) => {
                console.warn("STOMP error (will retry):", frame.headers?.message);
            },
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, []); // run once on mount; email from localStorage is stable

    // ── Close dropdown on outside click ────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Mark as read ───────────────────────────────────────────────────────────
    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, statut: "LU" } : n))
            );
            setUnread((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Mark-as-read error:", err);
        }
    };

    // ── UI ─────────────────────────────────────────────────────────────────────
    return (
        <div className="relative" ref={containerRef}>

            {/* Bell button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 dark:hover:text-white hover:text-gray-700 dark:hover:bg-white/5 hover:bg-gray-100 transition"
            >
                <Bell size={18} />

                {/* Unread badge */}
                {unread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="dropdown-enter absolute right-0 mt-3 w-80 dark:bg-[#111111] bg-white dark:border-white/10 border-gray-200 border rounded-xl shadow-xl p-4 z-50">

                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm dark:text-white text-gray-900">
                            Notifications
                        </h3>
                        {unread > 0 && (
                            <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">
                                {unread} non lu{unread > 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {loading && notifications.length === 0 ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="animate-spin text-gray-400" size={20} />
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">
                            Aucune notification
                        </p>
                    ) : (
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => n.statut !== "LU" && markAsRead(n.id)}
                                    className={`p-3 rounded-lg transition text-sm ${n.statut === "LU"
                                            ? "dark:bg-white/5 bg-gray-50 text-gray-400 cursor-default"
                                            : "bg-blue-500/20 dark:text-white text-gray-900 hover:bg-blue-500/30 cursor-pointer"
                                        }`}
                                >
                                    <p className="leading-snug">{n.message}</p>
                                    <span className="text-xs text-gray-400 block mt-1">
                                        {new Date(n.dateEnvoi).toLocaleString("fr-FR", {
                                            day: "2-digit",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
