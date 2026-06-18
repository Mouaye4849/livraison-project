import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Package, CheckCircle, Truck, MapPin, Clock,
    ArrowLeft, Loader2, Navigation, PackageCheck,
    XCircle, Eye, AlertTriangle,
} from "lucide-react";
import { getTrackingByColisId } from "../services/tracking.service";
import GpsMap from "../components/GpsMap";

// ─── Status → display config ──────────────────────────────────────────────────
const STATUS_CONFIG = {
    COLIS_CREE: {
        label: "Colis créé",
        Icon: Package,
        color: "text-blue-400",
        bg: "dark:bg-blue-500/15 bg-blue-50",
        border: "dark:border-blue-500/30 border-blue-200",
        dot: "bg-blue-400",
    },
    COLIS_PUBLIE: {
        label: "Colis publié",
        Icon: Eye,
        color: "text-violet-400",
        bg: "dark:bg-violet-500/15 bg-violet-50",
        border: "dark:border-violet-500/30 border-violet-200",
        dot: "bg-violet-400",
    },
    COLIS_ACCEPTE: {
        label: "Accepté par un voyageur",
        Icon: CheckCircle,
        color: "text-emerald-400",
        bg: "dark:bg-emerald-500/15 bg-emerald-50",
        border: "dark:border-emerald-500/30 border-emerald-200",
        dot: "bg-emerald-400",
    },
    EN_ROUTE: {
        label: "En route",
        Icon: Truck,
        color: "text-orange-400",
        bg: "dark:bg-orange-500/15 bg-orange-50",
        border: "dark:border-orange-500/30 border-orange-200",
        dot: "bg-orange-400",
    },
    EN_COURS: {
        label: "En cours de livraison",
        Icon: Truck,
        color: "text-orange-400",
        bg: "dark:bg-orange-500/15 bg-orange-50",
        border: "dark:border-orange-500/30 border-orange-200",
        dot: "bg-orange-400",
    },
    LIVRE: {
        label: "Livré avec succès",
        Icon: PackageCheck,
        color: "text-green-400",
        bg: "dark:bg-green-500/15 bg-green-50",
        border: "dark:border-green-500/30 border-green-200",
        dot: "bg-green-400",
    },
    ANNULE: {
        label: "Annulé",
        Icon: XCircle,
        color: "text-red-400",
        bg: "dark:bg-red-500/15 bg-red-50",
        border: "dark:border-red-500/30 border-red-200",
        dot: "bg-red-400",
    },
};

const FALLBACK_CONFIG = {
    label: null,
    Icon: Navigation,
    color: "text-gray-400",
    bg: "dark:bg-white/5 bg-gray-50",
    border: "dark:border-white/10 border-gray-200",
    dot: "bg-gray-400",
};

function formatDate(raw) {
    try {
        return new Date(raw).toLocaleString("fr-FR", {
            day: "2-digit", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    } catch { return raw ?? "—"; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TrackingPage() {
    const { colisId } = useParams();
    const navigate    = useNavigate();

    const [events,  setEvents]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        getTrackingByColisId(colisId)
            .then((res) => setEvents(res.data))
            .catch(() => setError("Impossible de charger le suivi de ce colis."))
            .finally(() => setLoading(false));
    }, [colisId]);

    const lastIndex = events.length - 1;

    return (
        <div className="pb-10">

            {/* ── Compact header ──────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto flex items-center gap-4 mb-5">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0
                               dark:bg-white/5 bg-gray-100 dark:border-white/10 border-gray-200 border
                               dark:hover:bg-white/10 hover:bg-gray-200 transition"
                >
                    <ArrowLeft size={16} className="text-gray-400" />
                </button>

                <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                            Suivi du colis
                        </h1>
                        <span className="font-mono text-xs dark:bg-white/5 bg-gray-100
                                         dark:text-gray-400 text-gray-500 px-2 py-0.5 rounded-md
                                         border dark:border-white/10 border-gray-200">
                            #{colisId?.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Carte GPS en temps réel &middot; Historique des événements
                    </p>
                </div>
            </div>

            {/* ── GPS Map — full-width hero ────────────────────────────────────── */}
            <GpsMap colisId={colisId} />

            {/* ── Timeline section ────────────────────────────────────────────── */}
            <div className="max-w-2xl mx-auto mt-8 space-y-5">

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center py-14 gap-4">
                        <Loader2 className="animate-spin text-gray-400" size={26} />
                        <p className="text-gray-500 text-sm">Chargement du suivi…</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border
                                    bg-red-500/10 border-red-500/20 text-red-400">
                        <AlertTriangle size={18} className="shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && events.length === 0 && (
                    <div className="flex flex-col items-center py-16 gap-5 text-center">
                        <div className="w-16 h-16 rounded-2xl dark:bg-white/5 bg-gray-100
                                        dark:border-white/10 border-gray-200 border
                                        flex items-center justify-center">
                            <Navigation size={26} className="text-gray-400" />
                        </div>
                        <div>
                            <p className="dark:text-white/60 text-gray-600 font-semibold text-sm">
                                Aucun événement de suivi
                            </p>
                            <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                                Le suivi sera disponible une fois votre colis pris en charge par un voyageur.
                            </p>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                {!loading && !error && events.length > 0 && (
                    <div className="relative">
                        {/* Section label */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-5 h-5 rounded-md dark:bg-white/5 bg-gray-100 border dark:border-white/10 border-gray-200 flex items-center justify-center shrink-0">
                                <Clock size={11} className="text-gray-400" />
                            </div>
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                Historique des événements
                            </span>
                        </div>

                        {/* Vertical connector */}
                        <div className="absolute left-[21px] top-10 bottom-10 w-px dark:bg-white/8 bg-gray-200" />

                        <div className="space-y-3">
                            {events.map((event, index) => {
                                const cfg    = STATUS_CONFIG[event.status] ?? FALLBACK_CONFIG;
                                const { Icon } = cfg;
                                const isLast = index === lastIndex;

                                return (
                                    <div key={index} className="relative flex gap-4 items-start">
                                        {/* Icon bubble */}
                                        <div className={`relative z-10 w-[42px] h-[42px] rounded-xl
                                                         flex items-center justify-center shrink-0 border
                                                         ${cfg.bg} ${cfg.border}
                                                         ${isLast ? `ring-2 ring-offset-2 dark:ring-offset-[#080808] ring-offset-white ${cfg.dot.replace("bg-", "ring-")}` : ""}`}>
                                            <Icon size={17} className={cfg.color} />
                                        </div>

                                        {/* Event card */}
                                        <div className={`flex-1 dark:bg-[#111111] bg-white
                                                         dark:border-[#1f1f1f] border-gray-200 border
                                                         rounded-xl p-4 transition-all duration-200
                                                         ${isLast ? "dark:border-[#2a2a2a] shadow-sm" : ""}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`font-semibold text-sm ${cfg.color}`}>
                                                    {cfg.label ?? event.status}
                                                </p>
                                                {isLast && (
                                                    <span className={`shrink-0 text-[10px] font-bold uppercase
                                                                      tracking-wider px-2 py-0.5 rounded-full
                                                                      border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                                        Actuel
                                                    </span>
                                                )}
                                            </div>

                                            {event.message && (
                                                <p className="dark:text-white/75 text-gray-700 text-sm mt-1 leading-relaxed">
                                                    {event.message}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                                                {event.locationName && (
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={11} className="text-gray-400 shrink-0" />
                                                        <span className="text-xs dark:text-gray-400 text-gray-500">
                                                            {event.locationName}
                                                        </span>
                                                    </div>
                                                )}
                                                {event.createdAt && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={11} className="text-gray-400 shrink-0" />
                                                        <span className="text-xs dark:text-gray-400 text-gray-500">
                                                            {formatDate(event.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Delivered banner */}
                        {events[lastIndex]?.status === "LIVRE" && (
                            <div className="mt-5 flex items-center gap-3 p-4 rounded-xl
                                            bg-green-500/10 border border-green-500/20">
                                <PackageCheck size={18} className="text-green-400 shrink-0" />
                                <div>
                                    <p className="text-green-400 font-semibold text-sm">Livraison confirmée</p>
                                    <p className="text-green-400/70 text-xs mt-0.5">
                                        Votre colis a été remis à destination avec succès.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
