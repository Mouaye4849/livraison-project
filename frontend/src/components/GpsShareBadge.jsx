import { Loader2, Navigation, WifiOff, AlertTriangle } from "lucide-react";
import { useGpsSharing } from "../hooks/useGpsSharing";

/**
 * Compact GPS-sharing status strip, embedded inside each EN_COURS colis card.
 * Mounts the tracking hook automatically — no manual start/stop needed.
 */
export default function GpsShareBadge({ colisId }) {
    const { status, coords } = useGpsSharing(colisId, true);

    /* ── Per-status config ────────────────────────────────────────────────── */
    const CONFIG = {
        requesting: {
            bg:     "dark:bg-blue-500/8  bg-blue-50",
            border: "dark:border-blue-500/20 border-blue-200",
            dot:    null,
            icon:   <Loader2 size={11} className="text-blue-400 animate-spin shrink-0" />,
            label:  "Localisation en cours…",
            color:  "text-blue-400",
        },
        active: {
            bg:     "dark:bg-green-500/8  bg-green-50",
            border: "dark:border-green-500/20 border-green-200",
            dot:    "bg-green-400",
            icon:   null,
            label:  coords
                ? `GPS actif • ${Number(coords.latitude).toFixed(4)}, ${Number(coords.longitude).toFixed(4)}`
                : "GPS actif",
            color:  "text-green-400",
        },
        permission_denied: {
            bg:     "dark:bg-red-500/8    bg-red-50",
            border: "dark:border-red-500/20 border-red-200",
            dot:    null,
            icon:   <WifiOff size={11} className="text-red-400 shrink-0" />,
            label:  "Permission GPS refusée",
            color:  "text-red-400",
        },
        insecure_context: {
            bg:     "dark:bg-orange-500/8 bg-orange-50",
            border: "dark:border-orange-500/20 border-orange-200",
            dot:    null,
            icon:   <AlertTriangle size={11} className="text-orange-400 shrink-0" />,
            label:  "GPS requiert HTTPS",
            color:  "text-orange-400",
        },
        unavailable: {
            bg:     "dark:bg-gray-500/8   bg-gray-50",
            border: "dark:border-gray-500/20 border-gray-200",
            dot:    null,
            icon:   <WifiOff size={11} className="text-gray-400 shrink-0" />,
            label:  "GPS non disponible",
            color:  "text-gray-400",
        },
        error: {
            bg:     "dark:bg-orange-500/8 bg-orange-50",
            border: "dark:border-orange-500/20 border-orange-200",
            dot:    null,
            icon:   <AlertTriangle size={11} className="text-orange-400 shrink-0" />,
            label:  "Erreur de localisation",
            color:  "text-orange-400",
        },
    };

    const cfg = CONFIG[status] ?? CONFIG.error;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium
                         ${cfg.bg} ${cfg.border}`}>

            {/* Pulsing dot (active state only) */}
            {cfg.dot && (
                <span className="relative flex shrink-0">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${cfg.dot}`} />
                    <span className={`relative inline-flex w-2 h-2 rounded-full ${cfg.dot}`} />
                </span>
            )}

            {/* Icon (non-active states) */}
            {cfg.icon}

            {/* Label */}
            <span className={`truncate ${cfg.color}`}>{cfg.label}</span>
        </div>
    );
}
