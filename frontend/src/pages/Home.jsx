import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Phone, Mail, ArrowRight, Package, Users, Globe, Zap, ChevronDown, Shield, Star } from "lucide-react";
import Services from "./Service";
import Footer from "../components/Footer";
import { useI18n, LanguageSelector } from "../i18n/index.jsx";

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

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
    const navigate = useNavigate();
    const { t } = useI18n();

    const STATS = [
        { value: "10K+", label: t("home.stats.deliveries"), icon: Package },
        { value: "500+", label: t("home.stats.deliverers"),  icon: Users },
        { value: "13",   label: t("home.stats.wilayas"),     icon: Globe },
        { value: "98%",  label: t("home.stats.satisfaction"), icon: Star },
    ];

    const FEATURES = [
        { icon: Zap,    title: t("home.features.fast.title"),     desc: t("home.features.fast.desc") },
        { icon: Shield, title: t("home.features.secure.title"),   desc: t("home.features.secure.desc") },
        { icon: Globe,  title: t("home.features.national.title"), desc: t("home.features.national.desc") },
    ];

    const scrollToServices = () => {
        const section = document.getElementById("services");
        if (section) section.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="bg-[#0a0a0a] text-white min-h-screen font-sans overflow-x-hidden">

            {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
            <div className="bg-[#b91c1c] text-white text-xs px-6 md:px-12 py-2 flex justify-between items-center">
                <div className="flex gap-5 items-center">
                    <a href="tel:20304050" className="flex items-center gap-1.5 hover:text-red-200 transition">
                        <Phone size={12} />
                        <span>20 30 40 50</span>
                    </a>
                    <a href="mailto:wasali@gmail.com" className="flex items-center gap-1.5 hover:text-red-200 transition">
                        <Mail size={12} />
                        <span>wasali@gmail.com</span>
                    </a>
                </div>
                <span className="hidden sm:block opacity-70 tracking-widest text-[10px] uppercase">
                    {t("home.tagline")}
                </span>
            </div>

            {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4 flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-4">
                    <img
                        src="/logo.png"
                        alt="WASALI"
                        className="w-32 object-contain"
                    />
                </div>

                {/* Nav Links */}
                <div className="hidden md:flex gap-6 items-center text-sm font-medium text-white/60">
                    <button className="text-white font-semibold border-b border-red-600 pb-0.5">
                        {t("home.nav.home")}
                    </button>
                    {[
                        { key: "home.nav.becomeClient",    action: () => navigate("/register", { state: { role: "CLIENT" } }) },
                        { key: "home.nav.becomeDeliverer", action: () => navigate("/register", { state: { role: "VOYAGEUR" } }) },
                        { key: "home.nav.services",        action: scrollToServices },
                    ].map(({ key, action }) => (
                        <button
                            key={key}
                            onClick={action}
                            className="relative hover:text-white transition group"
                        >
                            {t(key)}
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
                        </button>
                    ))}

                    {/* Language selector */}
                    <LanguageSelector variant="public" />
                </div>

                {/* CTA */}
                <motion.button
                    onClick={() => navigate("/register", { state: { role: "CLIENT" } })}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition shadow-lg shadow-red-600/20"
                >
                    {t("home.nav.start")}
                    <ArrowRight size={15} />
                </motion.button>
            </nav>

            {/* ── HERO ────────────────────────────────────────────────────────────── */}
            <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center overflow-hidden px-6">

                {/* Background image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d"
                        alt="livraison"
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" />
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-700/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/15 rounded-full blur-[120px] pointer-events-none" />

                {/* Content */}
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="relative z-10 max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/70 mb-8 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        {t("home.hero.badge")}
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={fadeUp}
                        custom={1}
                        className="text-5xl md:text-7xl font-black leading-[1.08] tracking-tight mb-6"
                        style={{ fontFamily: "'Sora', 'Manrope', sans-serif" }}
                    >
                        {t("home.hero.title1")}
                        <br />
                        <span className="text-red-500">{t("home.hero.title2")}</span>
                        <br />
                        {t("home.hero.title3")}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed"
                    >
                        {t("home.hero.subtitle")}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <motion.button
                            onClick={() => navigate("/register", { state: { role: "CLIENT" } })}
                            whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(185,28,28,0.35)" }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-red-600 text-white font-bold px-8 py-4 rounded-xl text-base flex items-center gap-3 shadow-xl shadow-red-700/30 transition-all"
                        >
                            <Package size={18} />
                            {t("home.hero.clientSpace")}
                            <ArrowRight size={16} />
                        </motion.button>

                        <motion.button
                            onClick={() => navigate("/login", { state: { role: "ADMIN" } })}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="border border-white/15 bg-white/5 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl text-base flex items-center gap-3 hover:bg-white/10 hover:border-white/25 transition-all"
                        >
                            {t("home.hero.adminSpace")}
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.button
                    onClick={scrollToServices}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition"
                >
                    <span className="text-[10px] uppercase tracking-widest">{t("home.hero.discover")}</span>
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                        <ChevronDown size={16} />
                    </motion.div>
                </motion.button>
            </section>

            {/* ── STATS STRIP ─────────────────────────────────────────────────────── */}
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

            {/* ── FEATURES ────────────────────────────────────────────────────────── */}
            <section className="py-24 px-6 md:px-12">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto"
                >
                    <motion.div variants={fadeUp} className="text-center mb-16">
                        <span className="text-red-500 text-xs font-bold uppercase tracking-widest">
                            {t("home.why")}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black mt-3 text-white">
                            {t("home.whyTitle")}
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                            <motion.div
                                key={title}
                                variants={fadeUp}
                                custom={i}
                                whileHover={{ y: -4, borderColor: "rgba(220,38,38,0.4)" }}
                                className="bg-white/[0.03] border border-white/8 rounded-2xl p-7 transition-all duration-300 cursor-default group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-5 group-hover:bg-red-600/20 transition">
                                    <Icon size={22} className="text-red-500" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── SERVICES SECTION ────────────────────────────────────────────────── */}
            <div id="services">
                <Services />
            </div>

            {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
            <Footer />
        </div>
    );
}
