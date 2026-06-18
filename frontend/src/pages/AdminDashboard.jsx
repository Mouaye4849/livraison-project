import { useEffect, useState } from "react";
import api from "../api";
import { useI18n } from "../i18n";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

import {
    Package,
    Truck,
    DollarSign,
    TrendingUp,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Boxes,
} from "lucide-react";

/* ─── SKELETON ─── */
function Skeleton({ className = "" }) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] ${className}`}
            style={{ animation: "shimmer 1.6s ease-in-out infinite", backgroundSize: "400% 100%" }}
        />
    );
}

/* ─── CUSTOM TOOLTIP ─── */
function CustomTooltip({
    active,
    payload,
    label,
    packageLabel,
}) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2.5 text-sm">
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-indigo-600 font-bold mt-0.5">
                    {payload[0].value} {packageLabel}
                </p>
            </div>
        );
    }
    return null;
}

const CARD_COLORS = [
    { icon: "bg-indigo-100", iconText: "text-indigo-600", accent: "#6366f1" },
    { icon: "bg-sky-100", iconText: "text-sky-600", accent: "#0ea5e9" },
    { icon: "bg-emerald-100", iconText: "text-emerald-600", accent: "#10b981" },
    { icon: "bg-violet-100", iconText: "text-violet-600", accent: "#8b5cf6" },
    { icon: "bg-rose-100", iconText: "text-rose-600", accent: "#f43f5e" },
];

/* ─── CHART COLORS ─── */
const BAR_COLORS = ["#818cf8", "#6366f1", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];

export default function AdminDashboard() {
    const [stats, setStats] = useState({});
    const [colis, setColis] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [filter, setFilter] = useState("TOUS");
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState(0);
    const [transactions, setTransactions] = useState(0);
    const { t } = useI18n();

    const STATUS_CONFIG = {
        EN_COURS: {
            label: t("admin.statusInProgress"),
            bg: "bg-amber-50",
            text: "text-amber-700",
            dot: "bg-amber-400",
            border: "border-amber-200",
        },
        ACCEPTE: {
            label: t("admin.statusAccepted"),
            bg: "bg-blue-50",
            text: "text-blue-700",
            dot: "bg-blue-400",
            border: "border-blue-200",
        },
        LIVRE: {
            label: t("admin.statusDelivered"),
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            dot: "bg-emerald-400",
            border: "border-emerald-200",
        },
        ANNULE: {
            label: t("admin.statusCancelled"),
            bg: "bg-rose-50",
            text: "text-rose-700",
            dot: "bg-rose-400",
            border: "border-rose-200",
        },
        PUBLIE: {
            label: t("admin.statusPublished"),
            bg: "bg-violet-50",
            text: "text-violet-700",
            dot: "bg-violet-400",
            border: "border-violet-200",
        },
    };

    const FILTER_LABELS = {
        TOUS: t("admin.all"),
        PUBLIE: t("admin.statusPublished"),
        EN_COURS: t("admin.statusInProgress"),
        ACCEPTE: t("admin.statusAccepted"),
        LIVRE: t("admin.statusDelivered"),
        ANNULE: t("admin.statusCancelled"),
    };

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try { const r = await api.get("/colis"); setColis(r.data); setFiltered(r.data); } catch { }
        try { const r = await api.get("/admin/stats"); setStats(r.data); } catch { }
        try { const r = await api.get("/paiements/admin/revenue"); setRevenue(r.data); } catch { }
        try { const r = await api.get("/paiements/admin/transactions"); setTransactions(r.data); } catch { }
        setLoading(false);
    };

    const handleFilter = (status) => {
        setFilter(status);
        setFiltered(status === "TOUS" ? colis : colis.filter(c => c.statut === status));
    };

    const formatId = (id) => "#CMD-" + id.slice(0, 6).toUpperCase();

    const chartData = stats.colisParJour?.map((v, i) => ({
        name: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][i],
        value: v,
    })) || [];

    const croissance = stats.croissance || 0;
    const isPositive = croissance >= 0;

    /* ─── CARD DATA ─── */
    const cards = [
        { title: t("admin.totalColis"), value: stats.totalColis, icon: Package, idx: 0 },
        { title: t("admin.activeTrajets"), value: stats.totalTrajets, icon: Truck, idx: 1 },
        { title: t("admin.revenue"), value: `${revenue} MRU`, icon: DollarSign, idx: 2 },
        { title: t("admin.transactions"), value: transactions, icon: CreditCard, idx: 3 },
        { title: t("admin.growth"), value: `${croissance}%`, icon: TrendingUp, idx: 4 },
    ];

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.4s ease both; }
                .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.1); }
                .pill-active { box-shadow: 0 2px 8px rgba(99,102,241,0.35); }
                .row-hover:hover td { background: #f8f8ff; }
                .adash-th { padding: 12px 16px; }
                .adash-td { padding: 14px 16px; }
                @media (max-width: 639px) {
                    .adash-th { padding: 10px 10px; }
                    .adash-td { padding: 11px 10px; }
                }
            `}</style>

            <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen font-sans">

                {/* ── HEADER ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 fade-up">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {t("admin.dashboard")}
                        </h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            {t("admin.dashboardSubtitle")}
                        </p>
                    </div>

                    {/* Growth badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border
                        ${isPositive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                        {isPositive
                            ? <ArrowUpRight size={15} />
                            : <ArrowDownRight size={15} />
                        }
                        {isPositive ? "+" : ""}{croissance}% {t("admin.weeklyGrowth")}
                    </div>
                </div>

                {/* ── CARDS ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-[90px] rounded-2xl" />
                        ))
                        : cards.map((c, i) => (
                            <Card key={c.title} {...c} delay={i * 60} />
                        ))
                    }
                </div>

                {/* ── CHART ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 fade-up">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">{t("admin.weeklyActivity")}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{t("admin.packagesPerDay")}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Boxes size={16} className="text-indigo-500" />
                        </div>
                    </div>

                    {loading ? (
                        <Skeleton className="h-[220px] rounded-xl" />
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} barSize={32}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                                    width={28}
                                />
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            packageLabel={t("admin.packages")}
                                        />
                                    }
                                    cursor={{ fill: "#f5f3ff", radius: 8 }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {chartData.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ── FILTERS ── */}
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(FILTER_LABELS).map(([key, label]) => {
                        const active = filter === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handleFilter(key)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
                                    ${active
                                        ? "bg-indigo-600 text-white border-indigo-600 pill-active"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                                    }`}
                            >
                                {label}
                                {key !== "TOUS" && (
                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                                        ${active ? "bg-indigo-500 text-indigo-100" : "bg-gray-100 text-gray-500"}`}>
                                        {colis.filter(c => c.statut === key).length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── TABLE ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-up">
                    <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">{t("admin.colisList")}</h2>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                            {filtered.length} résultat{filtered.length} {t("admin.results")}
                        </span>
                    </div>

                    {loading && (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 rounded-lg" />
                            ))}
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                                <Package size={22} className="text-gray-300" />
                            </div>
                            <p className="text-gray-700 font-medium">{t("admin.noPackages")}</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {filter === "TOUS"
                                    ? t("admin.noPackagesRegistered")
                                    : `Aucun colis avec le statut « ${FILTER_LABELS[filter]} ».`}
                            </p>
                            {filter !== "TOUS" && (
                                <button
                                    onClick={() => handleFilter("TOUS")}
                                    className="mt-4 text-sm text-indigo-600 font-medium hover:underline"
                                >
                                    {t("admin.showAllColis")}
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left bg-gray-50/60 border-b border-gray-100">
                                        <th className="adash-th text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("admin.order")}</th>
                                        <th className="adash-th text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("admin.route")}</th>
                                        <th className="adash-th text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("admin.status")}</th>
                                        <th className="adash-th text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("admin.price")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((c) => {
                                        const cfg = STATUS_CONFIG[c.statut] || {
                                            label: c.statut,
                                            bg: "bg-gray-50", text: "text-gray-600",
                                            dot: "bg-gray-300", border: "border-gray-100",
                                        };
                                        return (
                                            <tr key={c.id} className="row-hover transition-colors duration-150">
                                                <td className="adash-td font-mono font-medium text-gray-800 text-xs whitespace-nowrap">
                                                    {formatId(c.id)}
                                                </td>
                                                <td className="adash-td text-gray-600">
                                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <span className="font-medium text-gray-800">{c.villeDepart}</span>
                                                        <span className="text-gray-300 text-xs">→</span>
                                                        <span>{c.villeArrivee}</span>
                                                    </span>
                                                </td>
                                                <td className="adash-td">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap
                                                        ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="adash-td text-gray-800 font-semibold whitespace-nowrap">
                                                    {c.prixProposeMRU != null
                                                        ? <span>{c.prixProposeMRU} <span className="text-gray-400 font-normal text-xs">MRU</span></span>
                                                        : <span className="text-gray-300">—</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}

/* ─── CARD ─── */
function Card({ title, value, icon: Icon, idx, delay = 0 }) {
    const color = CARD_COLORS[idx] || CARD_COLORS[0];
    return (
        <div
            className="card-hover bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between fade-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-xl font-bold text-gray-900 leading-none">{value ?? 0}</h3>
            </div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${color.icon} shrink-0`}>
                <Icon size={18} className={color.iconText} />
            </div>
        </div>
    );
}