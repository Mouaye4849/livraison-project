import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
    Package,
    Weight,
    Hash,
    DollarSign,
    MapPin,
    Truck,
    CheckCircle,
    Loader2,
    ArrowRight,
    Inbox,
    ShieldOff,
} from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

export default function PublicColis() {
    const { t } = useI18n();

    const [colis, setColis] = useState([]);
    const [trajets, setTrajets] = useState([]);
    const [selectedTrajet, setSelectedTrajet] = useState({});
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [message, setMessage] = useState(null);

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [colisRes, trajetsRes] = await Promise.all([
                api.get("/colis/public"),
                api.get("/trajets/me")
            ]);
            setColis(colisRes.data);
            setTrajets(trajetsRes.data);
        } catch (err) {
            console.error(err);
            setMessage(t("publicColis.loadError"));
        } finally {
            setLoading(false);
        }
    };


    const handleAccept = async (colisId) => {
        const trajetId = selectedTrajet[colisId];
        if (!trajetId) {
            return setMessage(t("publicColis.selectTrajetError"));
        }

        try {
            setProcessing(prev => ({ ...prev, [colisId]: true }));
            setMessage(null);
            await api.put(`/colis/${colisId}/assign/${trajetId}`);
            setMessage(t("publicColis.acceptSuccess"));
            setTimeout(() => navigate("/dashboard/trajets/with-colis"), 1200);
        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || t("publicColis.genericError"));
        } finally {
            setProcessing(prev => ({ ...prev, [colisId]: false }));
        }
    };


    if (role !== "ROLE_VOYAGEUR") {
        return (
            <div className="flex items-center justify-center py-20 px-4">
                <div className="dark:bg-[#111111] bg-white dark:border border-red-500/20 rounded-2xl p-8 flex flex-col items-center gap-4 text-center shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <ShieldOff size={22} className="text-red-400" />
                    </div>
                    <div>
                        <p className="dark:text-white text-gray-900 font-semibold text-base">{t("publicColis.accessDenied")}</p>
                        <p className="text-gray-500 text-sm mt-1">{t("publicColis.accessDeniedDesc")}</p>
                    </div>
                </div>
            </div>
        );
    }


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-[#1e3a8a]" />
                <p className="text-gray-500 text-sm">{t("publicColis.loading")}</p>
            </div>
        );
    }

    const isSuccess = typeof message === "string" && message.includes("✅");

    return (
        <div className="space-y-6">
            <style>{`
                .public-select {
                    background-color: transparent;
                    border: 1.5px solid;
                    border-radius: 10px;
                    padding: 10px 12px;
                    width: 100%;
                    font-size: 13px;
                    outline: none;
                    appearance: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .dark .public-select {
                    border-color: #1f1f1f;
                    color: #fff;
                }
                .public-select {
                    border-color: #e5e7eb;
                    color: #111827;
                }
                .public-select:focus {
                    border-color: #1e3a8a;
                    box-shadow: 0 0 0 3px rgba(30,58,138,0.2);
                }
                .public-select.selected {
                    border-color: rgba(74,222,128,0.5);
                }
                .dark .public-select option { background: #111111; color: #e5e7eb; }
                .public-select option { background: #fff; color: #111827; }
            `}</style>

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 flex items-center justify-center shrink-0">
                    <Package size={20} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                        {t("publicColis.title")}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {t("publicColis.subtitle")}
                    </p>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#1e3a8a] transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{t("publicColis.statTotal")}</p>
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a8a]/20 flex items-center justify-center">
                            <Package size={14} className="text-blue-400" />
                        </div>
                    </div>
                    <p className="dark:text-white text-gray-900 text-2xl font-bold">{colis.length}</p>
                </div>

                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-green-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{t("publicColis.statAvailable")}</p>
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle size={14} className="text-green-400" />
                        </div>
                    </div>
                    <p className="text-green-400 text-2xl font-bold">{colis.length}</p>
                </div>

                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#f97316]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{t("publicColis.statTrajets")}</p>
                        <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
                            <Truck size={14} className="text-[#f97316]" />
                        </div>
                    </div>
                    <p className="text-[#f97316] text-2xl font-bold">{trajets.length}</p>
                </div>

                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#1e3a8a] transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{t("publicColis.statSelected")}</p>
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a8a]/20 flex items-center justify-center">
                            <MapPin size={14} className="text-blue-400" />
                        </div>
                    </div>
                    <p className="dark:text-white text-gray-900 text-2xl font-bold">
                        {Object.values(selectedTrajet).filter(Boolean).length}
                    </p>
                </div>
            </div>

            {/* MESSAGE */}
            {message && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                    isSuccess
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                    {isSuccess
                        ? <CheckCircle size={15} className="shrink-0" />
                        : <ShieldOff size={15} className="shrink-0" />
                    }
                    {message}
                </div>
            )}

            {/* EMPTY STATE */}
            {colis.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5">
                        <Inbox size={28} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                        <p className="dark:text-white text-gray-900 font-semibold text-base">{t("publicColis.emptyTitle")}</p>
                        <p className="text-gray-500 text-sm mt-1">{t("publicColis.emptyDesc")}</p>
                    </div>
                </div>
            )}

            {/* GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {colis.map((c) => {

                    const isProcessing = processing[c.id];
                    const isSelected = !!selectedTrajet[c.id];

                    return (
                        <div
                            key={c.id}
                            className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#1e3a8a] hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#1e3a8a]/20 flex items-center justify-center shrink-0">
                                    <Package size={15} className="text-blue-400" />
                                </div>
                                <h3 className="dark:text-white text-gray-900 font-semibold text-base truncate">
                                    {c.nom}
                                </h3>
                            </div>

                            {/* DIVIDER */}
                            <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                            {/* META */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <MapPin size={13} className="text-[#f97316] shrink-0" />
                                    <span className="dark:text-gray-300 text-gray-600 text-sm">{c.villeDepart}</span>
                                    <ArrowRight size={11} className="text-gray-400 shrink-0" />
                                    <span className="dark:text-gray-300 text-gray-600 text-sm">{c.villeArrivee}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Weight size={13} className="text-gray-400 shrink-0" />
                                    <span className="text-gray-500 text-sm">{c.poidsKg} kg</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Hash size={13} className="text-gray-400 shrink-0" />
                                    <span className="text-gray-500 text-sm">{t("publicColis.qty")} {c.quantite ?? "—"}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <DollarSign size={13} className="text-green-500 shrink-0" />
                                    <span className="text-green-400 font-semibold text-sm">
                                        {c.prixProposeMRU ?? "—"} MRU
                                    </span>
                                </div>
                            </div>

                            {/* DIVIDER */}
                            <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                            {/* SELECT TRAJET */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <Truck size={12} className="text-gray-400" />
                                    <span className="text-gray-500 text-xs">{t("publicColis.chooseTrajet")}</span>
                                </div>
                                <select
                                    value={selectedTrajet[c.id] || ""}
                                    className={`public-select${isSelected ? " selected" : ""}`}
                                    onChange={(e) =>
                                        setSelectedTrajet({
                                            ...selectedTrajet,
                                            [c.id]: e.target.value
                                        })
                                    }
                                >
                                    <option value="">{t("publicColis.selectTrajetPlaceholder")}</option>
                                    {trajets.map((trj) => (
                                        <option key={trj.id} value={trj.id}>
                                            {trj.origine} → {trj.destination}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* BUTTON */}
                            <button
                                onClick={() => handleAccept(c.id)}
                                disabled={!isSelected || isProcessing}
                                className={`w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                                    isSelected && !isProcessing
                                        ? "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-lg"
                                        : "dark:bg-[#1a1a1a] bg-gray-100 dark:border-[#2a2a2a] border-gray-200 border dark:text-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                                }`}
                            >
                                {isProcessing ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <CheckCircle size={16} />
                                )}
                                {isProcessing ? t("publicColis.processing") : t("publicColis.accept")}
                            </button>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}
