import { useState, useEffect } from "react";
import api from "../api";
import {
    Truck,
    Package,
    PlayCircle,
    CheckCircle,
    Loader2,
    MapPin,
    ArrowRight,
    Inbox,
} from "lucide-react";
import GpsShareBadge from "../components/GpsShareBadge";
import { useI18n } from "../i18n/index.jsx";

export default function TrajetsWithColis() {
    const { t } = useI18n();

    const [trajets, setTrajets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [message, setMessage] = useState(null);


    const fetchTrajets = async () => {
        try {
            setLoading(true);
            const res = await api.get("/trajets/me");
            setTrajets(res.data);
        } catch (err) {
            console.error(err);
            setMessage(t("trajetsWithColis.loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrajets();
    }, []);


    const handleStart = async (Id) => {
        try {
            setProcessing(prev => ({ ...prev, [Id]: true }));
            setMessage(null);
            await api.put(`/colis/${Id}/start`);
            setMessage(t("trajetsWithColis.startSuccess"));
            fetchTrajets();
        } catch (err) {
            setMessage(t("trajetsWithColis.genericError"));
        } finally {
            setProcessing(prev => ({ ...prev, [Id]: false }));
        }
    };


    const handleFinish = async (Id) => {
        try {
            setProcessing(prev => ({ ...prev, [Id]: true }));
            setMessage(null);
            await api.put(`/colis/${Id}/finish`);
            setMessage(t("trajetsWithColis.finishSuccess"));
            fetchTrajets();
        } catch (err) {
            setMessage(t("trajetsWithColis.genericError"));
        } finally {
            setProcessing(prev => ({ ...prev, [Id]: false }));
        }
    };


    const getStatusStyle = (status) => {
        switch (status) {
            case "ACCEPTE":  return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
            case "EN_COURS": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
            case "LIVRE":    return "bg-green-500/10 text-green-400 border border-green-500/20";
            case "TERMINE":  return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
            default:         return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "ACCEPTE":  return t("trajetsWithColis.statusAccepte");
            case "EN_COURS": return t("trajetsWithColis.statusEnCours");
            case "LIVRE":    return t("trajetsWithColis.statusLivre");
            case "TERMINE":  return t("trajetsWithColis.statusTermine");
            default:         return status;
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-[#1e3a8a]" />
                <p className="text-gray-500 text-sm">{t("trajetsWithColis.loading")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 flex items-center justify-center shrink-0">
                    <Truck size={20} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">
                        {t("trajetsWithColis.title")}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {trajets.length} {trajets.length !== 1 ? t("trajetsWithColis.countPlural") : t("trajetsWithColis.countSingular")}
                    </p>
                </div>
            </div>

            {/* MESSAGE */}
            {message && (
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-xl px-5 py-3 text-sm dark:text-gray-300 text-gray-600">
                    {message}
                </div>
            )}

            {/* EMPTY STATE */}
            {trajets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5">
                        <Inbox size={28} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                        <p className="dark:text-white text-gray-900 font-semibold text-base">{t("trajetsWithColis.emptyTitle")}</p>
                        <p className="text-gray-500 text-sm mt-1">{t("trajetsWithColis.emptyDesc")}</p>
                    </div>
                </div>
            )}

            {/* TRAJETS */}
            <div className="space-y-6">
                {trajets.map((trajet) => (
                    <div
                        key={trajet.id}
                        className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-6 shadow-lg transition-all duration-200 hover:border-[#1e3a8a]"
                    >
                        {/* ROUTE HEADER */}
                        <div className="flex items-center gap-3 pb-5 dark:border-b dark:border-[#1a1a1a] border-b border-gray-100">
                            <MapPin size={16} className="text-[#f97316] shrink-0" />
                            <span className="text-lg font-semibold dark:text-white text-gray-900">
                                {trajet.origine}
                            </span>
                            <ArrowRight size={14} className="text-gray-400 shrink-0" />
                            <span className="text-lg font-semibold dark:text-white text-gray-900">
                                {trajet.destination}
                            </span>
                        </div>

                        {/* COLIS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                            {trajet.colis?.length > 0 ? (
                                trajet.colis.map((colis) => {
                                    const isProcessing = processing[colis.id];

                                    return (
                                        <div
                                            key={colis.id}
                                            className="dark:bg-[#0f0f0f] bg-gray-50 dark:border-[#1f1f1f] border-gray-200 border rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-[#1e3a8a]"
                                        >
                                            {/* NAME */}
                                            <div className="flex items-center gap-2">
                                                <Package size={15} className="text-gray-400 shrink-0" />
                                                <h4 className="font-semibold dark:text-white text-gray-900 text-sm truncate">
                                                    {colis.nom}
                                                </h4>
                                            </div>

                                            {/* STATUS */}
                                            <div>
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(colis.statut)}`}>
                                                    {getStatusLabel(colis.statut)}
                                                </span>
                                            </div>

                                            {/* GPS sharing — auto-starts when EN_COURS */}
                                            {colis.statut === "EN_COURS" && (
                                                <GpsShareBadge colisId={colis.id} />
                                            )}

                                            {/* ACTIONS */}
                                            <div>
                                                {colis.statut === "ACCEPTE" && (
                                                    <button
                                                        onClick={() => handleStart(colis.id)}
                                                        disabled={isProcessing}
                                                        className="w-full h-11 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
                                                    >
                                                        {isProcessing
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <PlayCircle size={14} />
                                                        }
                                                        {t("trajetsWithColis.start")}
                                                    </button>
                                                )}

                                                {colis.statut === "EN_COURS" && (
                                                    <button
                                                        onClick={() => handleFinish(colis.id)}
                                                        disabled={isProcessing}
                                                        className="w-full h-11 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
                                                    >
                                                        {isProcessing
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <CheckCircle size={14} />
                                                        }
                                                        {t("trajetsWithColis.finish")}
                                                    </button>
                                                )}

                                                {colis.statut === "LIVRE" && (
                                                    <div className="h-11 flex items-center gap-2 text-green-400 text-sm font-medium">
                                                        <CheckCircle size={14} />
                                                        {t("trajetsWithColis.delivered")}
                                                    </div>
                                                )}

                                                {colis.statut === "TERMINE" && (
                                                    <div className="h-11 flex items-center gap-2 text-purple-400 text-sm font-medium">
                                                        <CheckCircle size={14} />
                                                        {t("trajetsWithColis.completed")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full flex items-center gap-2 py-4 text-gray-400 text-sm">
                                    <Package size={14} />
                                    {t("trajetsWithColis.noColisForTrajet")}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
