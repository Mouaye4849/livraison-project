import { useEffect, useState, useRef } from "react";
import api from "../api";
import { Bell, Loader2 } from "lucide-react";

export default function AdminNavbar() {

    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const ref = useRef();

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // ✅ CLOSE ON CLICK OUTSIDE
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);

            const res = await api.get("/admin/notifications");

            setNotifications(res.data);

            const unreadCount = res.data.filter(
                (n) => n.statut !== "LU"
            ).length;

            setUnread(unreadCount);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-between items-center px-6 py-4 
            bg-gray-900 border-b border-gray-700 shadow-md text-white">

            {/* LEFT */}
            <h1 className="text-lg font-bold">
                Admin Dashboard
            </h1>

            {/* RIGHT */}
            <div className="relative" ref={ref}>

                {/* 🔔 BUTTON */}
                <button
                    onClick={() => setOpen(!open)}
                    className="relative text-gray-300 hover:text-white hover:scale-110 transition"
                >
                    <Bell size={22} />

                    {/* 🔴 BADGE */}
                    {unread > 0 && (
                        <span className="absolute -top-2 -right-2 
                            bg-red-500 text-white text-xs 
                            px-1.5 py-0.5 rounded-full shadow">
                            {unread}
                        </span>
                    )}
                </button>

                {/* 📥 DROPDOWN */}
                {open && (
                    <div className="absolute right-0 mt-3 w-80 
                        bg-gray-900 border border-gray-700 
                        rounded-xl shadow-xl p-4 z-50">

                        <h3 className="font-semibold mb-3 text-sm text-gray-200">
                            🔔 Notifications
                        </h3>

                        {/* ⏳ LOADING */}
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (

                            <p className="text-gray-400 text-sm text-center py-4">
                                Aucune notification
                            </p>

                        ) : (
                            <div className="max-h-80 overflow-y-auto space-y-2">

                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-3 rounded-lg text-sm transition
                                        ${n.statut === "LU"
                                                ? "bg-gray-800 text-gray-400"
                                                : "bg-blue-600/20 text-white"
                                            }`}
                                    >
                                        <p>{n.message}</p>

                                        <span className="text-xs text-gray-400 block mt-1">
                                            {new Date(n.dateEnvoi).toLocaleString()}
                                        </span>
                                    </div>
                                ))}

                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}