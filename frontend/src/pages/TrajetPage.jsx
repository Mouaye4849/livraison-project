import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
    MapPin,
    Calendar,
    Weight,
    Send,
    Loader2,
    Truck,
    ArrowRight,
    CheckCircle2,
    XCircle,
} from "lucide-react";

/* ─── InputField ───────────────────────────── */
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
                        ? "border-[#1e3a8a] ring-2 ring-[#1e3a8a]/20"
                        : hasValue
                            ? "dark:border-[#2a2a2a] border-gray-300"
                            : "dark:border-[#1f1f1f] border-gray-200"
                    }
                `}
            >
                <Icon size={16} className={`shrink-0 ${focused ? "text-[#1e3a8a]" : "text-gray-400"}`} />
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

/* ─── Section ───────────────────────────── */
function FormSection({ title, description, children }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <h3 className="text-sm font-semibold dark:text-white text-gray-900">{title}</h3>
                    <p className="text-xs dark:text-gray-600 text-gray-400">{description}</p>
                </div>
                <div className="h-px flex-1 dark:bg-[#1f1f1f] bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children}
            </div>
        </div>
    );
}

/* ─── Alert ───────────────────────────── */
function Alert({ type, text }) {
    const isSuccess = type === "success";

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-xl border text-sm font-medium
                ${isSuccess
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }
            `}
        >
            {isSuccess
                ? <CheckCircle2 size={16} className="mt-0.5" />
                : <XCircle size={16} className="mt-0.5" />
            }
            {text}
        </div>
    );
}

/* ─── MAIN ───────────────────────────── */
export default function TrajetPage() {

    const navigate = useNavigate();
    const firstRef = useRef(null);

    const [form, setForm] = useState({
        origine: "",
        destination: "",
        dateDepart: "",
        capaciteKg: ""
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        firstRef.current?.focus();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage(null);

            await api.post("/trajets", {
                ...form,
                capaciteKg: Number(form.capaciteKg)
            });

            setMessage({ type: "success", text: "Trajet créé avec succès ! Redirection..." });

            setTimeout(() => {
                navigate("/dashboard/trajets");
            }, 1200);

        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Erreur création trajet"
            });
        } finally {
            setLoading(false);
        }
    };

    const isValid =
        form.origine &&
        form.destination &&
        form.dateDepart &&
        form.capaciteKg;

    return (
        <div className="max-w-2xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30">
                        <Truck size={18} className="text-[#1e3a8a]" />
                    </div>
                    <h1 className="text-xl font-bold dark:text-white text-gray-900">
                        Créer un trajet
                    </h1>
                </div>
                <p className="ml-12 text-sm text-gray-500">
                    Publiez votre itinéraire de transport
                </p>
            </div>

            {/* ALERT */}
            {message && (
                <div className="mb-6">
                    <Alert type={message.type} text={message.text} />
                </div>
            )}

            {/* FORM */}
            <form
                onSubmit={handleSubmit}
                className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl p-6 space-y-8 shadow-lg dark:shadow-black/40"
            >

                <FormSection title="Itinéraire" description="Ville de départ et d'arrivée">
                    <InputField
                        icon={MapPin}
                        label="Ville de départ"
                        name="origine"
                        value={form.origine}
                        onChange={handleChange}
                        ref={firstRef}
                        required
                    />

                    <div className="relative">
                        <InputField
                            icon={MapPin}
                            label="Ville d'arrivée"
                            name="destination"
                            value={form.destination}
                            onChange={handleChange}
                            required
                        />
                        <ArrowRight
                            size={14}
                            className="absolute -left-5 top-[38px] text-[#f97316] hidden sm:block"
                        />
                    </div>
                </FormSection>

                <div className="dark:border-t dark:border-[#1a1a1a] border-t border-gray-100" />

                <FormSection title="Détails du trajet" description="Date et capacité disponible">
                    <InputField
                        icon={Calendar}
                        label="Date de départ"
                        name="dateDepart"
                        type="date"
                        value={form.dateDepart}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                    />

                    <InputField
                        icon={Weight}
                        label="Capacité (kg)"
                        name="capaciteKg"
                        type="number"
                        value={form.capaciteKg}
                        onChange={handleChange}
                        min="0"
                        required
                    />
                </FormSection>

                {/* SUBMIT */}
                <button
                    type="submit"
                    disabled={!isValid || loading}
                    className={`
                        w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold
                        transition-all duration-200
                        ${isValid && !loading
                            ? "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-lg"
                            : "dark:bg-[#1a1a1a] bg-gray-100 dark:text-gray-600 text-gray-400 cursor-not-allowed dark:border-[#2a2a2a] border-gray-200 border"
                        }
                    `}
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Création en cours…
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            Créer le trajet
                        </>
                    )}
                </button>

            </form>
        </div>
    );
}
