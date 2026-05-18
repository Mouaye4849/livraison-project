import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import {
    MapPin,
    Calendar,
    Weight,
    Save,
    ArrowLeft,
    Loader2
} from "lucide-react";

export default function EditTrajet() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        origine: "",
        destination: "",
        dateDepart: "",
        capaciteKg: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                const res = await api.get(`/trajets/${id}`);
                const data = res.data;
                if (data.dateDepart) {
                    data.dateDepart = data.dateDepart.split("T")[0];
                }
                setForm(data);
            } catch (err) {
                console.error(err);
                setMessage("Erreur chargement ❌");
            } finally {
                setLoading(false);
            }
        };
        fetchTrajet();
    }, [id]);


    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            await api.put(`/trajets/${id}`, form);
            setMessage("Trajet mis à jour avec succès ✅");
            setTimeout(() => navigate("/dashboard/trajets"), 1200);
        } catch (err) {
            console.error(err);
            setMessage("Erreur lors de la mise à jour ❌");
        } finally {
            setSaving(false);
        }
    };


    const Input = ({ icon: Icon, label, ...props }) => (
        <div className="space-y-1.5">
            {label && (
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <Icon size={12} />
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Icon size={15} className="text-gray-400" />
                </div>
                <input
                    {...props}
                    className="w-full dark:bg-[#0f0f0f] bg-white dark:border-[#1f1f1f] border-gray-200 dark:text-white text-gray-900 dark:placeholder:text-gray-600 placeholder:text-gray-400 border rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 dark:hover:border-[#2a2a2a] hover:border-gray-300"
                />
            </div>
        </div>
    );


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={28} className="animate-spin text-[#1e3a8a]" />
                <p className="text-gray-500 text-sm">Chargement du trajet...</p>
            </div>
        );
    }

    const isSuccess = typeof message === "string" && message.includes("✅");

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* BACK BUTTON */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border dark:hover:bg-[#161616] hover:bg-gray-50 dark:hover:border-[#2a2a2a] hover:border-gray-300 dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 text-sm px-4 py-2 rounded-xl transition-all duration-200"
            >
                <ArrowLeft size={15} />
                Retour
            </button>

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                        Modifier le trajet
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Mettez à jour les informations de votre trajet
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
                        ? <Save size={15} className="shrink-0" />
                        : <MapPin size={15} className="shrink-0" />
                    }
                    {message}
                </div>
            )}

            {/* FORM CARD */}
            <div className="dark:bg-[#111111] bg-white dark:border-[#1f1f1f] border-gray-200 border rounded-2xl shadow-lg p-6 space-y-5">

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ROUTE */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Itinéraire</p>

                        <Input
                            icon={MapPin}
                            type="text"
                            name="origine"
                            value={form.origine}
                            onChange={handleChange}
                            placeholder="Ville de départ"
                            required
                        />

                        <Input
                            icon={MapPin}
                            type="text"
                            name="destination"
                            value={form.destination}
                            onChange={handleChange}
                            placeholder="Ville d'arrivée"
                            required
                        />
                    </div>

                    {/* DIVIDER */}
                    <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                    {/* DETAILS */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Détails</p>

                        <Input
                            icon={Calendar}
                            type="date"
                            name="dateDepart"
                            value={form.dateDepart}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            icon={Weight}
                            type="number"
                            name="capaciteKg"
                            value={form.capaciteKg}
                            onChange={handleChange}
                            placeholder="Capacité en kg"
                            required
                        />
                    </div>

                    {/* DIVIDER */}
                    <div className="h-px dark:bg-[#1a1a1a] bg-gray-100" />

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        disabled={saving}
                        className={`w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            saving
                                ? "dark:bg-[#1a1a1a] bg-gray-100 dark:border-[#2a2a2a] border-gray-200 border dark:text-gray-500 text-gray-400 cursor-not-allowed"
                                : "bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white shadow-lg"
                        }`}
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? "Enregistrement..." : "Mettre à jour"}
                    </button>

                </form>
            </div>

        </div>
    );
}
