import { useState, useRef, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
    Package,
    Weight,
    Hash,
    DollarSign,
    MapPin,
    User,
    Phone,
    Send,
    Loader2,
    CheckCircle2,
    XCircle,
    ArrowRight,
} from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

// ─── InputField ───────────────────────────────────────────────────────────────

function InputField({ icon: Icon, label, name, value, onChange, type = "text", ...props }) {
    const [focused, setFocused] = useState(false);
    const hasValue = value !== "" && value !== undefined && value !== null;

    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <Icon size={12} className="text-[#f97316]" />
                {label}
            </label>

            <div
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg border
                    dark:bg-[#0f0f0f] bg-white
                    transition-all duration-150
                    ${focused
                        ? "border-[#1e3a8a] ring-2 ring-[#1e3a8a]/20 shadow-lg shadow-[#1e3a8a]/5"
                        : hasValue
                            ? "dark:border-[#2a2a2a] dark:hover:border-[#333] border-gray-300 hover:border-gray-400"
                            : "dark:border-[#1f1f1f] dark:hover:border-[#2a2a2a] border-gray-200 hover:border-gray-300"
                    }
                `}
            >
                <Icon
                    size={16}
                    className={`shrink-0 transition-colors duration-150 ${focused ? "text-[#1e3a8a]" : "text-gray-400"}`}
                />
                <input
                    type={type}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 dark:placeholder-gray-700 placeholder-gray-400 outline-none"
                    {...props}
                />
            </div>
        </div>
    );
}

// ─── FormSection ──────────────────────────────────────────────────────────────

function FormSection({ title, description, children }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="flex-1 space-y-0.5">
                    <h3 className="text-sm font-semibold dark:text-white text-gray-900">{title}</h3>
                    {description && (
                        <p className="text-xs dark:text-gray-600 text-gray-400">{description}</p>
                    )}
                </div>
                <div className="h-px flex-1 dark:bg-[#1f1f1f] bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children}
            </div>
        </div>
    );
}

// ─── Alert ───────────────────────────────────────────────────────────────────

function Alert({ type, text }) {
    const isSuccess = type === "success";
    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-xl border text-sm font-medium
                animate-[fadeIn_0.2s_ease]
                ${isSuccess
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }
            `}
        >
            {isSuccess
                ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                : <XCircle size={16} className="shrink-0 mt-0.5" />
            }
            {text}
        </div>
    );
}

// ─── AddColis ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
    nom: "",
    poidsKg: "",
    quantite: "",
    prixProposeMRU: "",
    villeDepart: "",
    villeArrivee: "",
    nomDestinataire: "",
    numDestinataire: "",
};

export default function AddColis() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const firstInputRef = useRef(null);

    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => { firstInputRef.current?.focus(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage(null);
            await api.post("/colis", form);
            setMessage({ type: "success", text: t("createColis.successMsg") });
            setTimeout(() => navigate("/dashboard/my-colis"), 1200);
        } catch (err) {
            console.error(err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || t("createColis.errorMsg"),
            });
        } finally {
            setLoading(false);
        }
    };

    const isValid = form.nom && form.poidsKg && form.villeDepart && form.villeArrivee;

    return (
        <div className="max-w-2xl mx-auto">

            {/* ── Header ── */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30">
                        <Package size={18} className="text-[#1e3a8a]" />
                    </div>
                    <h1 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">{t("createColis.title")}</h1>
                </div>
                <p className="ml-12 text-sm text-gray-500">
                    {t("createColis.subtitle")}
                </p>
            </div>

            {/* ── Alert ── */}
            {message && (
                <div className="mb-6">
                    <Alert type={message.type} text={message.text} />
                </div>
            )}

            {/* ── Form card ── */}
            <form
                onSubmit={handleSubmit}
                className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-6 space-y-8 shadow-lg dark:shadow-black/40"
            >

                <FormSection title={t("createColis.sectionInfo")} description={t("createColis.sectionInfoDesc")}>
                    <InputField
                        icon={Package}
                        label={t("createColis.name")}
                        name="nom"
                        value={form.nom}
                        onChange={handleChange}
                        placeholder={t("createColis.namePlaceholder")}
                        required
                        ref={firstInputRef}
                    />
                    <InputField
                        icon={Weight}
                        label={t("createColis.weight")}
                        name="poidsKg"
                        type="number"
                        value={form.poidsKg}
                        onChange={handleChange}
                        placeholder="0.0"
                        min="0"
                        step="0.1"
                        required
                    />
                    <InputField
                        icon={Hash}
                        label={t("createColis.quantity")}
                        name="quantite"
                        type="number"
                        value={form.quantite}
                        onChange={handleChange}
                        placeholder="1"
                        min="1"
                    />
                    <InputField
                        icon={DollarSign}
                        label={t("createColis.price")}
                        name="prixProposeMRU"
                        type="number"
                        value={form.prixProposeMRU}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                    />
                </FormSection>

                <div className="dark:border-t dark:border-[#1a1a1a] border-t border-gray-100" />

                <FormSection title={t("createColis.sectionItinerary")} description={t("createColis.sectionItineraryDesc")}>
                    <InputField
                        icon={MapPin}
                        label={t("createColis.fromCity")}
                        name="villeDepart"
                        value={form.villeDepart}
                        onChange={handleChange}
                        placeholder={t("createColis.fromCityPlaceholder")}
                        required
                    />
                    <div className="relative">
                        <InputField
                            icon={MapPin}
                            label={t("createColis.toCity")}
                            name="villeArrivee"
                            value={form.villeArrivee}
                            onChange={handleChange}
                            placeholder={t("createColis.toCityPlaceholder")}
                            required
                        />
                        <ArrowRight
                            size={14}
                            className="absolute -left-5 top-[38px] text-[#f97316] hidden sm:block"
                        />
                    </div>
                </FormSection>

                <div className="dark:border-t dark:border-[#1a1a1a] border-t border-gray-100" />

                <FormSection title={t("createColis.sectionRecipient")} description={t("createColis.sectionRecipientDesc")}>
                    <InputField
                        icon={User}
                        label={t("createColis.recipientName")}
                        name="nomDestinataire"
                        value={form.nomDestinataire}
                        onChange={handleChange}
                        placeholder={t("createColis.recipientNamePlaceholder")}
                    />
                    <InputField
                        icon={Phone}
                        label={t("createColis.recipientPhone")}
                        name="numDestinataire"
                        value={form.numDestinataire}
                        onChange={handleChange}
                        placeholder={t("createColis.recipientPhonePlaceholder")}
                    />
                </FormSection>

                {/* ── Submit ── */}
                <button
                    type="submit"
                    disabled={loading || !isValid}
                    className={`
                        group relative w-full flex items-center justify-center gap-2.5
                        px-4 py-3 rounded-xl text-sm font-semibold
                        transition-all duration-200 overflow-hidden
                        ${isValid && !loading
                            ? "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-lg shadow-[#1e3a8a]/25 hover:shadow-[#1d4ed8]/30 hover:-translate-y-0.5 active:translate-y-0"
                            : "dark:bg-[#1a1a1a] bg-gray-100 dark:text-gray-600 text-gray-400 cursor-not-allowed dark:border-[#2a2a2a] border-gray-200 border"
                        }
                    `}
                >
                    {isValid && !loading && (
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    )}

                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {t("createColis.creating")}
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            {t("createColis.submit")}
                        </>
                    )}
                </button>
            </form>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
