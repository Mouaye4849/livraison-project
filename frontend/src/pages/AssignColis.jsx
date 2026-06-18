import { useEffect, useState } from "react";
import api from "../api";
import {
    Package,
    Truck,
    CheckCircle,
    Loader2,
    AlertCircle,
    MapPin,
    ArrowRight,
    ShieldOff,
} from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

export default function AssignColis() {
    const { t } = useI18n();

    const [colis, setColis] = useState([]);
    const [trajets, setTrajets] = useState([]);
    const [colisId, setColisId] = useState("");
    const [trajetId, setTrajetId] = useState("");
    const [role, setRole] = useState(null);

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        setRole(user?.role);
    }, []);

    useEffect(() => {
        fetchTrajets();
    }, []);

    const fetchTrajets = async () => {
        try {
            setLoading(true);
            const res = await api.get("/trajets/me");
            setTrajets(res.data);
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: t("assignColis.loadTrajetsError") });
        } finally {
            setLoading(false);
        }
    };

    const fetchColisByTrajet = async (trajetId) => {
        try {
            setLoading(true);
            const res = await api.get(`/colis/available/${trajetId}`);
            setColis(res.data);
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: t("assignColis.loadColisError") });
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!colisId || !trajetId) {
            return setMessage({ type: "error", text: t("assignColis.selectBothError") });
        }

        try {
            setProcessing(true);
            setMessage(null);
            await api.put(`/colis/${colisId}/assign/${trajetId}`);
            setMessage({ type: "success", text: t("assignColis.assignSuccess") });
            setColisId("");
            setTrajetId("");
            setColis([]);
            fetchTrajets();
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: err.response?.data || t("assignColis.serverError") });
        } finally {
            setProcessing(false);
        }
    };

    if (role === null || loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-[#1e3a8a]" />
                <p className="text-gray-500 text-sm">{t("assignColis.loading")}</p>
            </div>
        );
    }

    if (role !== "ROLE_VOYAGEUR") {
        return (
            <div className="flex items-center justify-center py-20 px-4">
                <div className="dark:bg-[#111111] bg-white border border-red-500/20 rounded-2xl p-8 flex flex-col items-center gap-4 text-center shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <ShieldOff size={22} className="text-red-400" />
                    </div>
                    <div>
                        <p className="dark:text-white text-gray-900 font-semibold text-base">{t("assignColis.accessDenied")}</p>
                        <p className="text-gray-500 text-sm mt-1">{t("assignColis.accessDeniedDesc")}</p>
                    </div>
                </div>
            </div>
        );
    }

    const canAssign = !!colisId && !!trajetId && !processing;

    return (
        <div className="space-y-6">
            <style>{`
                .assign-select {
                    background-color: transparent;
                    border: 1.5px solid;
                    border-radius: 12px;
                    padding: 11px 14px;
                    width: 100%;
                    font-size: 14px;
                    outline: none;
                    appearance: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .dark .assign-select { border-color: #1f1f1f; color: #fff; }
                .assign-select { border-color: #e5e7eb; color: #111827; }
                .assign-select:focus {
                    border-color: #1e3a8a;
                    box-shadow: 0 0 0 3px rgba(30,58,138,0.2);
                }
                .assign-select:disabled { opacity: 0.45; cursor: not-allowed; }
                .dark .assign-select option { background: #111111; color: #e5e7eb; }
                .assign-select option { background: #fff; color: #111827; }
            `}</style>

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 flex items-center justify-center shrink-0">
                    <Package size={20} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                        {t("assignColis.title")}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {t("assignColis.subtitle")}
                    </p>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#1e3a8a] transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{t("assignColis.statTrajetsAvailable")}</p>
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a8a]/20 flex items-center justify-center">
                            <Truck size={15} className="text-blue-400" />
                        </div>
                    </div>
                    <p className="dark:text-white text-gray-900 text-2xl font-bold">{trajets.length}</p>
                </div>
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#1e3a8a] transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{t("assignColis.statCompatibleColis")}</p>
                        <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
                            <Package size={15} className="text-[#f97316]" />
                        </div>
                    </div>
                    <p className="dark:text-white text-gray-900 text-2xl font-bold">{trajetId ? colis.length : "—"}</p>
                </div>
            </div>

            {/* MESSAGE */}
            {message && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                    message.type === "success"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                    {message.type === "success"
                        ? <CheckCircle size={16} className="shrink-0" />
                        : <AlertCircle size={16} className="shrink-0" />
                    }
                    {message.text}
                </div>
            )}

            {/* MAIN CARD */}
            <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl shadow-lg p-6 space-y-5 max-w-xl">

                {/* TRAJET SELECT */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-[#f97316]" />
                        <label className="text-sm font-medium text-gray-400">{t("assignColis.chooseTrajet")}</label>
                    </div>
                    <select
                        value={trajetId}
                        onChange={(e) => {
                            const id = e.target.value;
                            setTrajetId(id);
                            setColisId("");
                            if (id) fetchColisByTrajet(id);
                            else setColis([]);
                        }}
                        className="assign-select"
                    >
                        <option value="">{t("assignColis.selectTrajetPlaceholder")}</option>
                        {trajets.map((trj) => (
                            <option key={trj.id} value={trj.id}>
                                {trj.origine} → {trj.destination}
                            </option>
                        ))}
                    </select>

                    {trajetId && (() => {
                        const trj = trajets.find(x => x.id === trajetId);
                        return trj ? (
                            <div className="flex items-center gap-2 px-3 py-2 dark:bg-[#0f0f0f] bg-gray-50 dark:border-[#1f1f1f] border-gray-200 border rounded-xl">
                                <MapPin size={12} className="text-[#f97316] shrink-0" />
                                <span className="dark:text-white text-gray-900 text-sm font-medium">{trj.origine}</span>
                                <ArrowRight size={11} className="text-gray-400 shrink-0" />
                                <span className="dark:text-white text-gray-900 text-sm font-medium">{trj.destination}</span>
                            </div>
                        ) : null;
                    })()}
                </div>

                {/* DIVIDER */}
                <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                {/* COLIS SELECT */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Package size={13} className="text-blue-400" />
                        <label className="text-sm font-medium text-gray-400">{t("assignColis.chooseColis")}</label>
                    </div>
                    <select
                        value={colisId}
                        onChange={(e) => setColisId(e.target.value)}
                        disabled={!trajetId}
                        className="assign-select"
                    >
                        <option value="">
                            {trajetId ? t("assignColis.selectColisPlaceholder") : t("assignColis.selectTrajetFirst")}
                        </option>

                        {colis.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nom} ({c.poidsKg} kg)
                            </option>
                        ))}
                    </select>

                    {trajetId && colis.length === 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <AlertCircle size={13} className="text-yellow-400 shrink-0" />
                            <p className="text-yellow-400 text-xs font-medium">
                                {t("assignColis.noCompatibleColis")}
                            </p>
                        </div>
                    )}
                </div>

                {/* ASSIGN BUTTON */}
                <button
                    onClick={handleAssign}
                    disabled={!canAssign}
                    className={`w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        canAssign
                            ? "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-lg"
                            : "dark:bg-[#111111] bg-gray-100 dark:border-[#1f1f1f] border-gray-200 border dark:text-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                >
                    {processing ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <CheckCircle size={16} />
                    )}
                    {processing ? t("assignColis.assigning") : t("assignColis.assign")}
                </button>

            </div>

        </div>
    );
}
