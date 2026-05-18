import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import {
    CreditCard,
    Package,
    Weight,
    CheckCircle,
    Smartphone,
    Banknote,
    Loader2
} from "lucide-react";

export default function Pay() {

    const { colisId } = useParams();
    const navigate = useNavigate();

    const [colis, setColis] = useState(null);
    const [type, setType] = useState("CASH");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchColis();
    }, []);

    const fetchColis = async () => {
        try {
            const res = await api.get(`/colis/${colisId}`);
            setColis(res.data);
        } catch (err) {
            console.error(err);
        }
    };


    const handlePay = async () => {
        setLoading(true);
        setMessage(null);

        try {
            await api.post(`/paiements/${colisId}?type=${type}`);
            setMessage({ type: "success", text: "Paiement effectué avec succès ✅" });
            setTimeout(() => navigate("/dashboard/payments"), 1200);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Erreur paiement ❌"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!colis) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-[#1e3a8a]" />
                <p className="text-gray-500 text-sm">Chargement...</p>
            </div>
        );
    }

    const paymentOptions = [
        { value: "CASH",   label: "Cash",         icon: Banknote   },
        { value: "MOBILE", label: "Mobile Money",  icon: Smartphone },
        { value: "BANK",   label: "Bank",          icon: CreditCard },
    ];

    return (
        <div className="max-w-xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 flex items-center justify-center shrink-0">
                    <CreditCard size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                    Paiement
                </h2>
            </div>

            {/* MESSAGE */}
            {message && (
                <div className={`p-3 rounded-xl border text-sm font-medium ${
                    message.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                    {message.text}
                </div>
            )}

            {/* CARD */}
            <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-6 shadow-lg space-y-5">

                {/* INFO */}
                <div>
                    <h3 className="text-lg font-semibold dark:text-white text-gray-900 flex items-center gap-2">
                        <Package size={18} />
                        {colis.nom}
                    </h3>

                    <p className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <Weight size={14} />
                        {colis.poidsKg} kg
                    </p>

                    <p className="text-green-400 font-semibold mt-2">
                        💰 {colis.prixProposeMRU} MRU
                    </p>
                </div>

                <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                {/* PAYMENT METHODS */}
                <div>
                    <p className="text-sm text-gray-500 mb-3">
                        Choisissez une méthode de paiement
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        {paymentOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = type === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setType(opt.value)}
                                    className={`p-3 rounded-xl border text-sm flex flex-col items-center gap-1.5 transition-all duration-150 font-medium ${
                                        isSelected
                                            ? "bg-green-500/15 border-green-400/50 text-green-400"
                                            : "dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-gray-400 text-gray-600 dark:hover:bg-white/10 hover:bg-gray-100"
                                    }`}
                                >
                                    <Icon size={18} />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={handlePay}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-green-700/20"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Traitement...
                        </>
                    ) : (
                        <>
                            <CheckCircle size={16} />
                            Confirmer le paiement
                        </>
                    )}
                </button>

            </div>
        </div>
    );
}
