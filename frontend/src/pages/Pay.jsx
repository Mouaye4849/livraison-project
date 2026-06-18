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
    Loader2,
    Phone,
    Lock,
    Hash,
    TrendingDown,
    AlertCircle,
    ArrowRight,
} from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

export default function Pay() {
    const { t } = useI18n();
    const { colisId } = useParams();
    const navigate = useNavigate();

    const [colis,       setColis]       = useState(null);
    const [type,        setType]        = useState("CASH");
    const [clientPhone, setClientPhone] = useState("");
    const [passcode,    setPasscode]    = useState("");
    const [colisLoading, setColisLoading] = useState(true);
    const [loading,     setLoading]     = useState(false);
    const [message,     setMessage]     = useState(null);
    const [result,      setResult]      = useState(null); // PaiementDTO on success

    useEffect(() => { fetchColis(); }, []);

    const fetchColis = async () => {
        setColisLoading(true);
        try {
            const res = await api.get(`/colis/${colisId}`);
            setColis(res.data);
        } catch {
            setMessage({ type: "error", text: t("pay.loadColisError") });
        } finally {
            setColisLoading(false);
        }
    };

    const handlePay = async () => {
        if (loading || !colis) return;
        if (type === "MOBILE_MONEY") {
            if (!clientPhone.trim()) {
                setMessage({ type: "error", text: t("pay.phoneRequired") });
                return;
            }
            if (!passcode.trim()) {
                setMessage({ type: "error", text: t("pay.passcodeRequired") });
                return;
            }
        }
        setLoading(true);
        setMessage(null);
        try {
            const body = {
                typePaiement: type,
                clientPhone:  type === "MOBILE_MONEY" ? clientPhone.trim()  : null,
                passcode:     type === "MOBILE_MONEY" ? passcode.trim()     : null,
            };
            const res = await api.post(`/paiements/${colisId}`, body);
            setResult(res.data);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || t("pay.payError"),
            });
        } finally {
            setLoading(false);
        }
    };

    const METHODS = [
        { value: "CASH",         label: t("pay.methodCash"),   Icon: Banknote,   desc: t("pay.methodCashDesc")   },
        { value: "MOBILE_MONEY", label: t("pay.methodMobile"), Icon: Smartphone, desc: t("pay.methodMobileDesc") },
        { value: "CARTE",        label: t("pay.methodCard"),   Icon: CreditCard, desc: t("pay.methodCardDesc")   },
    ];

    const commission      = colis ? +(colis.prixProposeMRU * 0.10).toFixed(2) : 0;

    // ── Loading colis
    if (colisLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-green-500" />
                <p className="text-gray-500 text-sm">{t("pay.loadingColis")}</p>
            </div>
        );
    }

    // ── Success confirmation
    if (result) {
        return (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-8 shadow-lg space-y-6">
                    {/* Icon + title */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-400/30 flex items-center justify-center">
                            <CheckCircle size={32} className="text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white text-gray-900">{t("pay.successTitle")}</h2>
                            <p className="text-gray-500 text-sm mt-1">{t("pay.successDesc")}</p>
                        </div>
                    </div>

                    <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                    {/* Breakdown */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{t("pay.amountPaid")}</span>
                            <span className="dark:text-white text-gray-900 font-bold">{result.montantMRU} MRU</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{t("pay.commission")}</span>
                            <span className="text-gray-400">{result.commissionAdmin} MRU</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{t("pay.travelerReceives")}</span>
                            <span className="text-green-400 font-semibold">{result.montantVoyageur} MRU</span>
                        </div>
                        {result.referenceTransaction && (
                            <div className="flex items-start gap-2 mt-1 p-3 rounded-xl dark:bg-[#0a0a0a] bg-gray-50 border dark:border-[#1a1a1a] border-gray-100">
                                <Hash size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                <span className="text-gray-400 text-xs break-all font-mono leading-relaxed">
                                    {result.referenceTransaction}
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/dashboard/payments")}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-700/20"
                    >
                        {t("pay.viewPayments")}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // ── Payment form
    return (
        <div className="max-w-xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-400/30 flex items-center justify-center shrink-0">
                    <CreditCard size={20} className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                    {t("pay.title")}
                </h2>
            </div>

            {/* ALERT */}
            {message && (
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm font-medium ${
                    message.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {message.text}
                </div>
            )}

            {/* COLIS CARD */}
            {colis ? (
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-400/20 flex items-center justify-center shrink-0">
                            <Package size={18} className="text-green-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold dark:text-white text-gray-900 text-base truncate">{colis.nom}</h3>
                            <p className="text-gray-500 text-xs mt-0.5">
                                {colis.villeDepart} → {colis.villeArrivee}
                            </p>
                        </div>
                    </div>

                    <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                    <div className="flex items-center gap-5 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <Weight size={13} /> {colis.poidsKg} kg
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Package size={13} /> ×{colis.quantite}
                        </span>
                    </div>

                    <div className="flex items-center justify-between dark:bg-[#0a0a0a] bg-gray-50 rounded-xl px-4 py-3 border dark:border-[#1a1a1a] border-gray-100">
                        <span className="text-gray-500 text-sm">{t("pay.amountToPay")}</span>
                        <span className="text-green-400 font-bold text-lg">{colis.prixProposeMRU} MRU</span>
                    </div>
                </div>
            ) : (
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg text-center">
                    <p className="text-gray-500 text-sm">{t("pay.colisNotFound")}</p>
                </div>
            )}

            {/* PAYMENT METHODS */}
            <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg space-y-4">
                <p className="text-sm text-gray-500 font-medium">{t("pay.paymentMethod")}</p>

                <div className="grid grid-cols-3 gap-3">
                    {METHODS.map(({ value, label, Icon, desc }) => {
                        const isSelected = type === value;
                        return (
                            <button
                                key={value}
                                onClick={() => { setType(value); setMessage(null); }}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-150 ${
                                    isSelected
                                        ? "bg-green-500/15 border-green-400/50 text-green-400"
                                        : "dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-gray-400 text-gray-600 dark:hover:bg-white/10 hover:bg-gray-100"
                                }`}
                            >
                                <Icon size={18} />
                                <span className="text-sm font-medium">{label}</span>
                                <span className={`text-xs font-normal ${isSelected ? "text-green-400/70" : "text-gray-400"}`}>
                                    {desc}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* BANKILY CREDENTIALS — shown only for MOBILE_MONEY */}
                {type === "MOBILE_MONEY" && (
                    <div className="space-y-3 pt-1">
                        <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                            {t("pay.bankilyInfo")}
                        </p>

                        {/* Phone */}
                        <label className="block space-y-1.5">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Phone size={11} /> {t("pay.phoneNumber")}
                            </span>
                            <input
                                type="tel"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                placeholder={t("pay.phonePlaceholder")}
                                className="w-full px-4 py-2.5 rounded-xl dark:bg-[#0a0a0a] bg-gray-50 border dark:border-[#2a2a2a] border-gray-200 dark:text-white text-gray-900 dark:placeholder:text-gray-600 placeholder:text-gray-400 text-sm focus:outline-none focus:border-green-400/60 transition-colors"
                            />
                        </label>

                        {/* Passcode */}
                        <label className="block space-y-1.5">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Lock size={11} /> {t("pay.passcode")}
                            </span>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="••••••"
                                maxLength={6}
                                className="w-full px-4 py-2.5 rounded-xl dark:bg-[#0a0a0a] bg-gray-50 border dark:border-[#2a2a2a] border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-green-400/60 transition-colors tracking-widest"
                            />
                        </label>

                        <p className="text-xs text-gray-400/70 flex items-center gap-1.5">
                            <Lock size={10} />
                            {t("pay.encryptedNote")}
                        </p>
                    </div>
                )}
            </div>

            {/* PRICE SUMMARY */}
            {colis && (
                <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-5 shadow-lg space-y-3">
                    <p className="text-sm text-gray-500 font-medium">{t("pay.summary")}</p>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{t("pay.colisAmount")}</span>
                        <span className="dark:text-white text-gray-900 font-semibold">{colis.prixProposeMRU} MRU</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                            <TrendingDown size={13} /> {t("pay.commission")}
                        </span>
                        <span className="text-gray-400">{commission} MRU</span>
                    </div>

                    <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                    <div className="flex justify-between items-center">
                        <span className="dark:text-white text-gray-900 font-semibold text-sm">{t("pay.totalToPay")}</span>
                        <span className="text-green-400 font-bold text-lg">{colis.prixProposeMRU} MRU</span>
                    </div>
                </div>
            )}

            {/* CONFIRM BUTTON */}
            <button
                onClick={handlePay}
                disabled={loading || !colis}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-green-700/20"
            >
                {loading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        {t("pay.processing")}
                    </>
                ) : (
                    <>
                        <CheckCircle size={16} />
                        {t("pay.confirm")}
                    </>
                )}
            </button>

            <p className="text-center text-gray-400 text-xs pb-2">
                {t("pay.secureNote")}
            </p>
        </div>
    );
}
