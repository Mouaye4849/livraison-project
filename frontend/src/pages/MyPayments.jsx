import { useEffect, useState } from "react";
import api from "../api";
import {
    CreditCard,
    Calendar,
    Tag,
    Hash,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Inbox,
} from "lucide-react";

export default function MyPayments() {

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPayments = async () => {
        try {
            const res = await api.get("/paiements/me");
            setPayments(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const getStatus = (status) => {
        switch (status) {
            case "SUCCES":
                return { style: "bg-green-500/20 text-green-400", icon: <CheckCircle size={14} /> };
            case "EN_ATTENTE":
                return { style: "bg-yellow-500/20 text-yellow-400", icon: <Clock size={14} /> };
            case "ECHEC":
                return { style: "bg-red-500/20 text-red-400", icon: <XCircle size={14} /> };
            default:
                return { style: "bg-gray-500/20 text-gray-400", icon: null };
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    };

    const total     = payments.length;
    const succes    = payments.filter(p => p.statut === "SUCCES").length;
    const enAttente = payments.filter(p => p.statut === "EN_ATTENTE").length;
    const echec     = payments.filter(p => p.statut === "ECHEC").length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-[#1e3a8a]" />
                <p className="text-gray-500 text-sm">Chargement des paiements...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 flex items-center justify-center shrink-0">
                    <CreditCard size={20} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                        Mes paiements
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Historique de vos transactions et paiements
                    </p>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#1e3a8a] transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total</p>
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a8a]/20 flex items-center justify-center">
                            <CreditCard size={14} className="text-blue-400" />
                        </div>
                    </div>
                    <p className="dark:text-white text-gray-900 text-2xl font-bold">{total}</p>
                </div>

                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-green-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Réussis</p>
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle size={14} className="text-green-400" />
                        </div>
                    </div>
                    <p className="text-green-400 text-2xl font-bold">{succes}</p>
                </div>

                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-yellow-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">En attente</p>
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Clock size={14} className="text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-yellow-400 text-2xl font-bold">{enAttente}</p>
                </div>

                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-red-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Échoués</p>
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <XCircle size={14} className="text-red-400" />
                        </div>
                    </div>
                    <p className="text-red-400 text-2xl font-bold">{echec}</p>
                </div>
            </div>

            {/* EMPTY STATE */}
            {payments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5">
                        <Inbox size={28} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                        <p className="dark:text-white text-gray-900 font-semibold text-base">Aucun paiement trouvé</p>
                        <p className="text-gray-500 text-sm mt-1">Vos transactions apparaîtront ici</p>
                    </div>
                </div>
            )}

            {/* PAYMENT CARDS */}
            {payments.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payments.map((p) => {
                        const status = getStatus(p.statut);

                        return (
                            <div
                                key={p.id}
                                className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg hover:border-[#1e3a8a] hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
                            >
                                {/* AMOUNT */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#1e3a8a]/20 flex items-center justify-center shrink-0">
                                            <CreditCard size={15} className="text-blue-400" />
                                        </div>
                                        <span className="dark:text-white text-gray-900 text-lg font-bold">
                                            {p.montantMRU} <span className="text-gray-500 text-sm font-medium">MRU</span>
                                        </span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.style}`}>
                                        {status.icon}
                                        {p.statut}
                                    </span>
                                </div>

                                {/* DIVIDER */}
                                <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                                {/* META */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={13} className="text-gray-400 shrink-0" />
                                        <span className="text-gray-500 text-xs">
                                            {formatDate(p.dateConfirmation)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Tag size={13} className="text-gray-400 shrink-0" />
                                        <span className="text-gray-500 text-xs">{p.typePaiement}</span>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Hash size={12} className="text-gray-400 shrink-0 mt-0.5" />
                                        <span className="text-gray-500 text-xs break-all leading-relaxed">
                                            {p.referenceTransaction}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
