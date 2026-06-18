import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Calendar, Weight, Pencil, Trash2, Truck, Inbox, ArrowRight, Loader2,
} from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

function SpinIcon({ color }) {
    return (
        <>
            <style>{`@keyframes _spint { to { transform: rotate(360deg); } }`}</style>
            <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: `2px solid transparent`,
                borderTopColor: color, borderRightColor: color,
                animation: "_spint 0.7s linear infinite",
                flexShrink: 0,
            }} />
        </>
    );
}

export default function TrajetsList() {
    const { t } = useI18n();
    const [trajets, setTrajets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrajets = async () => {
            try {
                const response = await api.get("/trajets/me");
                setTrajets(response.data);
            } catch (err) {
                setError(t("trajetsList.loadError"));
            } finally {
                setLoading(false);
            }
        };
        fetchTrajets();
    }, []);

    const handleEdit = (trajetId) => {
        navigate(`/dashboard/trajets/${trajetId}/edit`);
    };

    const handleDelete = async (trajetId) => {
        try {
            setDeleting((prev) => ({ ...prev, [trajetId]: true }));
            await api.delete(`/trajets/${trajetId}`);
            setTrajets(trajets.filter((t) => t.id !== trajetId));
        } catch (err) {
            setError(t("trajetsList.deleteError"));
        } finally {
            setDeleting((prev) => ({ ...prev, [trajetId]: false }));
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "ACTIF":   return "bg-green-500/10 text-green-400";
            case "TERMINE": return "bg-blue-500/10 text-blue-400";
            case "ANNULE":  return "bg-red-500/10 text-red-400";
            default:        return "bg-gray-500/10 text-gray-400";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-[#1e3a8a]" />
                <p className="text-gray-500 text-sm">{t("trajetsList.loading")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20 px-4">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-3 rounded-xl text-sm text-center">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 rounded-xl p-2.5 shrink-0">
                    <Truck size={22} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="dark:text-white text-gray-900 font-bold text-xl tracking-tight">
                        {t("trajetsList.title")}
                    </h2>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {trajets.length} {trajets.length !== 1 ? t("trajetsList.countPlural") : t("trajetsList.countSingular")}
                    </p>
                </div>
            </div>

            {/* EMPTY STATE */}
            {trajets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5">
                        <Inbox size={28} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                        <p className="dark:text-white text-gray-900 font-semibold text-base">
                            {t("trajetsList.emptyTitle")}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            {t("trajetsList.emptyDesc")}
                        </p>
                    </div>
                </div>
            )}

            {/* GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trajets.map((trajet) => {
                    const isDeleting = deleting[trajet.id];

                    return (
                        <div
                            key={trajet.id}
                            className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl shadow-lg p-5 flex flex-col gap-4 hover:border-[#1e3a8a] transition-all duration-200"
                        >
                            {/* ROUTE */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <MapPin size={15} className="text-blue-400 shrink-0" />
                                <span className="dark:text-white text-gray-900 font-bold text-base">
                                    {trajet.origine}
                                </span>
                                <ArrowRight size={13} className="text-gray-400" />
                                <span className="dark:text-white text-gray-900 font-bold text-base">
                                    {trajet.destination}
                                </span>
                            </div>

                            {/* DIVIDER */}
                            <div className="h-px dark:bg-[#1f1f1f] bg-gray-100" />

                            {/* META */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar size={13} className="text-gray-400" />
                                    <span className="text-gray-500 text-xs">
                                        {new Date(trajet.dateDepart).toLocaleString("fr-FR", {
                                            day: "2-digit", month: "short", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Weight size={13} className="text-gray-400" />
                                    <span className="text-gray-500 text-xs">
                                        {t("trajetsList.capacity")}&nbsp;
                                        <strong className="dark:text-white text-gray-900 font-semibold">
                                            {trajet.capaciteKg} kg
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            {/* STATUS */}
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(trajet.statut)}`}>
                                    {trajet.statut}
                                </span>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-3 mt-1">
                                <button
                                    onClick={() => handleEdit(trajet.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white text-sm font-semibold py-2 rounded-xl transition-all duration-200"
                                >
                                    <Pencil size={14} />
                                    {t("trajetsList.edit")}
                                </button>
                                <button
                                    onClick={() => handleDelete(trajet.id)}
                                    disabled={isDeleting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                                >
                                    {isDeleting
                                        ? <SpinIcon color="#f87171" />
                                        : <Trash2 size={14} />
                                    }
                                    {t("trajetsList.delete")}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
