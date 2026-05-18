import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    Package,
    ArrowRight,
    ChevronRight,
    MapPin,
} from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

export default function MessagesPage() {
    const navigate = useNavigate();
    const [colis, setColis] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user"));

            let chats = [];

            if (user.role === "ROLE_USER") {
                const res = await fetch("http://localhost:8080/api/colis/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                chats = data.filter(c => c.statut === "ACCEPTE");
            }

            if (user.role === "ROLE_VOYAGEUR") {
                const res = await fetch("http://localhost:8080/api/trajets/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const trajets = await res.json();
                chats = trajets.flatMap(t => t.colis || []);
            }

            setColis(chats);
            setLoading(false);
        };

        fetchChats();
    }, []);

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* HEADER */}
            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="flex items-center gap-4"
            >
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                    <MessageCircle size={20} className="text-red-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">Messages</h1>
                        {!loading && colis.length > 0 && (
                            <span className="bg-red-600/20 border border-red-600/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {colis.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-gray-500">Conversations actives</span>
                    </div>
                </div>
            </motion.div>

            {/* INTRO */}
            <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-gray-500 text-sm leading-relaxed"
            >
                Discutez facilement avec vos clients et voyageurs en temps réel.
            </motion.p>

            {/* LOADING SKELETONS */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="dark:bg-white/[0.04] bg-gray-100 dark:border-white/8 border-gray-200 border rounded-2xl p-4 flex items-center gap-4 animate-pulse"
                        >
                            <div className="w-11 h-11 rounded-xl dark:bg-white/10 bg-gray-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 dark:bg-white/10 bg-gray-200 rounded-full w-2/5" />
                                <div className="h-3 dark:bg-white/6 bg-gray-200 rounded-full w-3/5" />
                            </div>
                            <div className="w-8 h-8 rounded-lg dark:bg-white/8 bg-gray-200 shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && colis.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center py-20 gap-5 text-center"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-2xl dark:bg-white/[0.04] bg-gray-100 dark:border-white/10 border-gray-200 border flex items-center justify-center"
                    >
                        <MessageCircle size={28} className="text-gray-400" />
                    </motion.div>
                    <div>
                        <p className="dark:text-white/60 text-gray-600 font-semibold text-base">
                            Aucune conversation disponible
                        </p>
                        <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto leading-relaxed">
                            Vos conversations avec voyageurs et clients apparaîtront ici
                        </p>
                    </div>
                </motion.div>
            )}

            {/* CONVERSATION LIST */}
            {!loading && colis.length > 0 && (
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                >
                    <AnimatePresence>
                        {colis.map((c, i) => (
                            <motion.div
                                key={c.id}
                                variants={fadeUp}
                                custom={i}
                                whileHover={{ y: -2, borderColor: "rgba(220,38,38,0.35)" }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => navigate(`/dashboard/chat/${c.id}`)}
                                className="group flex items-center gap-4 dark:bg-white/[0.03] bg-white dark:border-white/8 border-gray-200 border rounded-2xl p-4 cursor-pointer transition-all duration-200 dark:hover:bg-white/[0.06] hover:bg-gray-50 hover:shadow-sm"
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-11 h-11 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center group-hover:bg-red-600/20 transition-colors duration-200">
                                        <Package size={20} className="text-red-400" />
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 dark:border-2 dark:border-[#0a0a0a] border-2 border-white rounded-full" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="dark:text-white text-gray-900 font-semibold text-sm truncate">
                                        {c.nom}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <MapPin size={11} className="text-red-500/70 shrink-0" />
                                        <p className="text-gray-400 text-xs truncate">{c.origine}</p>
                                        <ArrowRight size={10} className="text-gray-300 shrink-0" />
                                        <p className="text-gray-400 text-xs truncate">{c.destination}</p>
                                    </div>
                                </div>

                                {/* Badge + Chevron */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                                        Actif
                                    </span>
                                    <div className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 dark:border-white/8 border-gray-200 border flex items-center justify-center group-hover:bg-red-600/15 group-hover:border-red-600/25 transition-all duration-200">
                                        <ChevronRight size={14} className="text-gray-400 group-hover:text-red-400 transition-colors duration-200" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

        </div>
    );
}
