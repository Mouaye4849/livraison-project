import { useEffect, useState } from "react";
import api from "../api";
import { useI18n } from "../i18n";

// ICONS
import {
    Check,
    X,
    MapPin,
    Calendar,
    Weight,
    User,
    Loader2
} from "lucide-react";

export default function AdminPendingTrajets() {

    const [trajets, setTrajets] = useState([]);
    const [loading, setLoading] = useState(false);
    const { t } = useI18n();

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/trajets/pending");
            setTrajets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.put(`/admin/trajets/${id}/approve`);
            setTrajets((prev) => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = async (id) => {
        try {
            await api.put(`/admin/trajets/${id}/reject`);
            setTrajets((prev) => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-4 sm:p-6 text-black">

            {/* HEADER */}
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-500" />
                {t("admin.pendingTrajetsTitle")}
            </h2>

            {/* LOADING */}
            {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="animate-spin" />
                    {t("admin.loading")}
                </div>
            ) : trajets.length === 0 ? (
                <p className="text-gray-400">
                    {t("admin.noPendingTrajets")}
                </p>
            ) : (
                <div className="grid gap-4">

                    {trajets.map((T) => (
                        <div
                            key={T.id}
                            className="bg-gray-900 border border-gray-700 p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-blue-500 transition"
                        >
                            {/* INFO */}
                            <div className="space-y-2 flex-1 min-w-0">

                                <p className="font-semibold text-gray-500">
                                    {T.origine} → {T.destination}
                                </p>

                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Calendar size={16} />
                                    {T.dateDepart}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Weight size={16} />
                                    {T.capaciteKg} kg
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <User size={14} />
                                    {T.voyageurEmail}
                                </div>

                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-3 flex-shrink-0">

                                <button
                                    onClick={() => handleApprove(T.id)}
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                                >
                                    <Check size={16} />
                                    {t("admin.approve")}
                                </button>

                                <button
                                    onClick={() => handleReject(T.id)}
                                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                                >
                                    <X size={16} />
                                    {t("admin.reject")}
                                </button>

                            </div>
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
}