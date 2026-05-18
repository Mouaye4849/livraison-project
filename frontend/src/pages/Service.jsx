import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Package,
    MapPin,
    Truck,
    Shield,
    Zap,
    CreditCard,
    PackageCheck,
    ArrowRight,
    ChevronDown,
    Star,
    Users,
    Globe,
    CheckCircle,
    Clock,
    BadgeCheck,
    Headphones,
} from "lucide-react";
import Footer from "../components/Footer";

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Data ────────────────────────────────────────────────────────────────────
const SERVICES = [
    {
        icon: Zap,
        title: "Livraison Express",
        desc: "Colis livrés en un temps record grâce à notre réseau de voyageurs actifs en Mauritanie.",
        badge: "Ultra rapide",
    },
    {
        icon: Truck,
        title: "Transport National",
        desc: "Couverture complète des 13 wilayas mauritaniennes pour vos envois locaux et régionaux.",
        badge: "13 wilayas",
    },
    {
        icon: MapPin,
        title: "Suivi en Temps Réel",
        desc: "Suivez chaque étape de votre livraison instantanément depuis votre tableau de bord.",
        badge: "Live tracking",
    },
    {
        icon: Shield,
        title: "Livraison Sécurisée",
        desc: "Chaque colis est assuré et chaque livreur est vérifié pour garantir votre sérénité.",
        badge: "Assuré",
    },
    {
        icon: BadgeCheck,
        title: "Voyageurs Vérifiés",
        desc: "Tous nos livreurs passent par un processus de vérification strict avant d'être acceptés.",
        badge: "Certifiés",
    },
    {
        icon: CreditCard,
        title: "Paiement Protégé",
        desc: "Transactions sécurisées et transparentes. Payez uniquement quand votre colis est livré.",
        badge: "Sécurisé",
    },
];

const STEPS = [
    {
        num: "01",
        icon: PackageCheck,
        title: "Publiez votre colis",
        desc: "Décrivez votre colis, indiquez la destination et proposez un tarif. En moins de 2 minutes.",
    },
    {
        num: "02",
        icon: Users,
        title: "Un voyageur accepte",
        desc: "Un voyageur vérifié sur votre route accepte la livraison et confirme la prise en charge.",
    },
    {
        num: "03",
        icon: CheckCircle,
        title: "Livraison confirmée",
        desc: "Votre colis est livré à destination. Vous êtes notifié en temps réel à chaque étape.",
    },
];

const STATS = [
    { value: "10K+", label: "Livraisons effectuées", icon: Package },
    { value: "500+", label: "Voyageurs actifs", icon: Users },
    { value: "98%", label: "Satisfaction client", icon: Star },
    { value: "13", label: "Wilayas couvertes", icon: Globe },
];

const ADVANTAGES = [
    {
        icon: Zap,
        title: "Livraison rapide",
        desc: "Vos colis livrés en un temps record grâce à notre réseau de voyageurs partout en Mauritanie.",
    },
    {
        icon: Shield,
        title: "Sécurité maximale",
        desc: "Chaque livraison est tracée et assurée. Nos livreurs sont vérifiés et certifiés.",
    },
    {
        icon: Globe,
        title: "Couverture nationale",
        desc: "De Nouakchott à Zouérate, nous couvrons l'ensemble du territoire mauritanien.",
    },
    {
        icon: Headphones,
        title: "Support réactif",
        desc: "Notre équipe est disponible 7j/7 pour répondre à toutes vos questions et résoudre vos problèmes.",
    },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Services() {
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="bg-[#0a0a0a] text-white min-h-screen font-sans overflow-x-hidden">

            {/* ── HERO ─────────────────────────────────────────────────────────── */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden px-6">

                {/* Background image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7"
                        alt="services livraison"
                        className="w-full h-full object-cover opacity-15"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/50 to-[#0a0a0a]" />
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-1/3 left-1/5 w-80 h-80 bg-red-700/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-red-900/15 rounded-full blur-[140px] pointer-events-none" />

                {/* Content */}
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="relative z-10 max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div
                        variants={fadeUp}
                        custom={0}
                        className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/70 mb-8 backdrop-blur-sm"
                    >
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        Services professionnels WASALI
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={fadeUp}
                        custom={1}
                        className="text-5xl md:text-7xl font-black leading-[1.08] tracking-tight mb-6"
                        style={{ fontFamily: "'Sora', 'Manrope', sans-serif" }}
                    >
                        Des solutions de livraison
                        <br />
                        <span className="text-red-500">intelligentes</span> pour toute
                        <br />
                        la Mauritanie
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed"
                    >
                        Rapide, sécurisé et accessible partout — WASALI connecte expéditeurs et voyageurs pour des livraisons sans frontières.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        variants={fadeUp}
                        custom={3}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <motion.button
                            onClick={() => navigate("/register", { state: { role: "CLIENT" } })}
                            whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(185,28,28,0.35)" }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-red-600 text-white font-bold px-8 py-4 rounded-xl text-base flex items-center gap-3 shadow-xl shadow-red-700/30 transition-all"
                        >
                            <Package size={18} />
                            Envoyer un colis
                            <ArrowRight size={16} />
                        </motion.button>

                        <motion.button
                            onClick={() => navigate("/register", { state: { role: "VOYAGEUR" } })}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="border border-white/15 bg-white/5 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl text-base flex items-center gap-3 hover:bg-white/10 hover:border-white/25 transition-all"
                        >
                            <Truck size={18} />
                            Devenir voyageur
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.button
                    onClick={() => scrollToSection("services-cards")}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition"
                >
                    <span className="text-[10px] uppercase tracking-widest">Découvrir</span>
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                        <ChevronDown size={16} />
                    </motion.div>
                </motion.button>
            </section>

            {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
            <section className="border-y border-white/5 bg-white/[0.02] py-10 px-6 md:px-12">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    {STATS.map(({ value, label, icon: Icon }, i) => (
                        <motion.div
                            key={label}
                            variants={fadeUp}
                            custom={i}
                            className="flex flex-col items-center text-center gap-2"
                        >
                            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-1">
                                <Icon size={18} className="text-red-500" />
                            </div>
                            <span className="text-3xl font-black text-white">{value}</span>
                            <span className="text-xs text-white/40 leading-snug">{label}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ── SERVICES CARDS ───────────────────────────────────────────────── */}
            <section id="services-cards" className="py-24 px-6 md:px-12">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="max-w-6xl mx-auto"
                >
                    <motion.div variants={fadeUp} className="text-center mb-16">
                        <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Ce que nous offrons</span>
                        <h2 className="text-3xl md:text-5xl font-black mt-3 text-white">
                            Nos services premium
                        </h2>
                        <p className="text-white/40 text-base mt-4 max-w-xl mx-auto leading-relaxed">
                            Tout ce dont vous avez besoin pour gérer vos livraisons en Mauritanie, dans une seule plateforme.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SERVICES.map(({ icon: Icon, title, desc, badge }, i) => (
                            <motion.div
                                key={title}
                                variants={fadeUp}
                                custom={i}
                                whileHover={{ y: -6, borderColor: "rgba(220,38,38,0.4)" }}
                                className="group relative bg-white/[0.03] border border-white/8 rounded-2xl p-7 transition-all duration-300 cursor-default overflow-hidden"
                            >
                                {/* Glow on hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-red-600/5 to-transparent rounded-2xl pointer-events-none" />

                                <div className="relative z-10">
                                    {/* Icon + Badge */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center group-hover:bg-red-600/20 transition-colors duration-300">
                                            <Icon size={22} className="text-red-500" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 bg-red-600/10 border border-red-600/20 px-2.5 py-1 rounded-full">
                                            {badge}
                                        </span>
                                    </div>

                                    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                                    <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
            <section className="py-24 px-6 md:px-12 border-t border-white/5">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto"
                >
                    <motion.div variants={fadeUp} className="text-center mb-16">
                        <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Simple & rapide</span>
                        <h2 className="text-3xl md:text-5xl font-black mt-3 text-white">
                            Comment ça marche ?
                        </h2>
                        <p className="text-white/40 text-base mt-4 max-w-xl mx-auto">
                            Trois étapes suffisent pour envoyer votre colis partout en Mauritanie.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-red-600/30 via-red-500/50 to-red-600/30 pointer-events-none" />

                        {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
                            <motion.div
                                key={num}
                                variants={fadeUp}
                                custom={i}
                                whileHover={{ y: -4 }}
                                className="group relative bg-white/[0.03] border border-white/8 rounded-2xl p-7 text-center transition-all duration-300 hover:border-red-600/30"
                            >
                                {/* Step number */}
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-6xl font-black text-white/5 select-none pointer-events-none leading-none">
                                    {num}
                                </div>

                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-red-600/20 transition-colors duration-300">
                                        <Icon size={26} className="text-red-500" />
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 bg-red-600/10 border border-red-600/20 rounded-full px-3 py-1 text-[10px] text-red-400 font-bold uppercase tracking-widest mb-4">
                                        Étape {num}
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-3">{title}</h3>
                                    <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── ADVANTAGES ───────────────────────────────────────────────────── */}
            <section className="py-24 px-6 md:px-12 border-t border-white/5">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto"
                >
                    <motion.div variants={fadeUp} className="text-center mb-16">
                        <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Nos atouts</span>
                        <h2 className="text-3xl md:text-5xl font-black mt-3 text-white">
                            Pourquoi choisir <span className="text-red-500">WASALI</span> ?
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {ADVANTAGES.map(({ icon: Icon, title, desc }, i) => (
                            <motion.div
                                key={title}
                                variants={fadeUp}
                                custom={i}
                                whileHover={{ y: -4, borderColor: "rgba(220,38,38,0.4)" }}
                                className="group flex items-start gap-5 bg-white/[0.03] border border-white/8 rounded-2xl p-7 transition-all duration-300 cursor-default"
                            >
                                <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/20 transition-colors duration-300">
                                    <Icon size={22} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-base mb-2">{title}</h3>
                                    <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
            <section className="py-24 px-6 md:px-12">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="max-w-4xl mx-auto"
                >
                    <motion.div
                        variants={fadeUp}
                        className="relative rounded-3xl overflow-hidden border border-red-600/20 bg-gradient-to-br from-red-950/60 via-[#0a0a0a] to-[#0a0a0a] p-12 md:p-16 text-center"
                    >
                        {/* Background glow */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-red-700/20 rounded-full blur-[80px]" />
                        </div>

                        <div className="relative z-10">
                            <motion.div
                                variants={fadeUp}
                                custom={0}
                                className="inline-flex items-center gap-2 bg-red-600/15 border border-red-600/25 rounded-full px-4 py-1.5 text-xs text-red-400 font-bold uppercase tracking-widest mb-8"
                            >
                                <Clock size={12} />
                                Rejoignez WASALI dès aujourd'hui
                            </motion.div>

                            <motion.h2
                                variants={fadeUp}
                                custom={1}
                                className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
                            >
                                Prêt à révolutionner
                                <br />
                                <span className="text-red-500">vos livraisons ?</span>
                            </motion.h2>

                            <motion.p
                                variants={fadeUp}
                                custom={2}
                                className="text-white/50 text-lg mb-12 max-w-xl mx-auto leading-relaxed"
                            >
                                Rejoignez des milliers d'utilisateurs qui font confiance à WASALI pour leurs livraisons en Mauritanie.
                            </motion.p>

                            <motion.div
                                variants={fadeUp}
                                custom={3}
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                            >
                                <motion.button
                                    onClick={() => navigate("/register", { state: { role: "CLIENT" } })}
                                    whileHover={{ scale: 1.05, boxShadow: "0 24px 48px rgba(185,28,28,0.4)" }}
                                    whileTap={{ scale: 0.97 }}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl text-base flex items-center gap-3 shadow-2xl shadow-red-700/30 transition-all"
                                >
                                    <Package size={18} />
                                    Commencer maintenant
                                    <ArrowRight size={16} />
                                </motion.button>

                                <motion.button
                                    onClick={() => navigate("/contact")}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="border border-white/15 bg-white/5 backdrop-blur-sm text-white font-semibold px-10 py-4 rounded-xl text-base flex items-center gap-3 hover:bg-white/10 hover:border-white/25 transition-all"
                                >
                                    <Headphones size={18} />
                                    Contacter l'équipe
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────────────── */}
            <Footer />
        </div>
    );
}
