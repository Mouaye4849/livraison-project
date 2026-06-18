import { useEffect, useState } from "react";
import { Box, Clock, CheckCircle2, Search, Inbox, Trash2 } from "lucide-react";
import api from "../api";
import { useI18n } from "../i18n";

/* ─────────────────────────────────────────────
   THEMES
───────────────────────────────────────────── */
const THEMES = {
    dark: {
        surface: "#111128",
        inputBg: "#0a0a1a",
        border: "#1e1e30",
        muted: "#1c1c2e",
        mutedHover: "#22223a",
        text: "#e8e8f5",
        textMid: "#9494b8",
        sub: "#5a5a7a",
        accent: "#6366f1",
        accentBg: "#6366f118",
        red: "#f87171",
        redBg: "#f8717118",
        green: "#4ade80",
        greenBg: "#4ade8018",
        yellow: "#fbbf24",
        yellowBg: "#fbbf2418",
        shadow: "0 4px 24px rgba(0,0,0,0.45)",
        shadowSm: "0 1px 6px rgba(0,0,0,0.25)",
    },
    light: {
        surface: "#ffffff",
        inputBg: "#f8f9fc",
        border: "#e5e7eb",
        muted: "#f3f4f6",
        mutedHover: "#e9eaec",
        text: "#0f172a",
        textMid: "#374151",
        sub: "#6b7280",
        accent: "#6366f1",
        accentBg: "#ede9fe",
        red: "#ef4444",
        redBg: "#fee2e2",
        green: "#16a34a",
        greenBg: "#dcfce7",
        yellow: "#d97706",
        yellowBg: "#fef3c7",
        shadow: "0 4px 24px rgba(0,0,0,0.07)",
        shadowSm: "0 1px 4px rgba(0,0,0,0.05)",
    },
};


const STATUS_BADGE = {
    dark: {
        PUBLIE: { background: "#1e3a5f55", color: "#60a5fa" },
        ACCEPTE: { background: "#2e1a4a55", color: "#c084fc" },
        EN_COURS: { background: "#3d2b0055", color: "#fbbf24" },
        LIVRE: { background: "#14281a55", color: "#4ade80" },
        ANNULE: { background: "#2d0f0f55", color: "#f87171" },
        default: { background: "#1c1c2e", color: "#5a5a7a" },
    },
    light: {
        PUBLIE: { background: "#dbeafe", color: "#1d4ed8" },
        ACCEPTE: { background: "#f3e8ff", color: "#7e22ce" },
        EN_COURS: { background: "#fef3c7", color: "#b45309" },
        LIVRE: { background: "#dcfce7", color: "#15803d" },
        ANNULE: { background: "#fee2e2", color: "#b91c1c" },
        default: { background: "#f3f4f6", color: "#6b7280" },
    },
};

function useTheme() {
    const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");
    useEffect(() => {
        const onStorage = () => setMode(localStorage.getItem("theme") || "dark");
        const onThemeChange = (e) => setMode(e.detail || "dark");
        window.addEventListener("storage", onStorage);
        window.addEventListener("themechange", onThemeChange);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("themechange", onThemeChange);
        };
    }, []);
    return { theme: THEMES[mode] ?? THEMES.dark, mode };
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function Spinner({ color }) {
    return (
        <>
            <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "3px solid transparent",
                borderTopColor: color,
                borderRightColor: color,
                animation: "_spin 0.75s linear infinite",
            }} />
        </>
    );
}

function StatCard({ label, value, icon: Icon, iconColor, iconBg, valueColor, theme }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="acolis-stat-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: theme.surface,
                borderRadius: 16,
                boxShadow: hovered ? theme.shadow : theme.shadowSm,
                border: `1px solid ${hovered ? iconColor + "50" : theme.border}`,
                transition: "all 0.22s ease",
                transform: hovered ? "translateY(-3px)" : "translateY(0)",
                cursor: "default",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: theme.sub, margin: 0, fontWeight: 500, letterSpacing: "0.02em" }}>
                    {label}
                </p>
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <Icon size={17} color={iconColor} strokeWidth={2} />
                </div>
            </div>
            <div className="acolis-stat-val" style={{ color: valueColor ?? theme.text }}>
                {value}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function AdminColis() {
    const { theme, mode } = useTheme();
    const { t } = useI18n();

    const [colis, setColis] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [filter, setFilter] = useState("TOUS");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [rowHover, setRowHover] = useState(null);
    const [filterHover, setFilterHover] = useState(null);
    const [deleteHover, setDeleteHover] = useState(null);

    /* ── business logic (unchanged) ── */
    const fetchColis = async () => {
        try {
            const res = await api.get("/colis"); // ADMIN
            setColis(res.data);
            setFiltered(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColis();
    }, []);

    const handleFilter = (status) => {
        setFilter(status);
        if (status === "TOUS") {
            setFiltered(colis);
        } else {
            setFiltered(colis.filter(c => c.statut === status));
        }
    };

    const handleSearch = (value) => {
        setSearch(value);
        const filteredData = colis.filter(c =>
            c.nom?.toLowerCase().includes(value.toLowerCase()) ||
            c.userEmail?.toLowerCase().includes(value.toLowerCase()) ||
            c.villeDepart?.toLowerCase().includes(value.toLowerCase()) ||
            c.villeArrivee?.toLowerCase().includes(value.toLowerCase())
        );
        setFiltered(filteredData);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t("admin.confirmDelete"))) return;

        try {
            await api.delete(`/colis/${id}`);
            fetchColis();
        } catch (err) {
            alert(t("admin.deleteError"));
        }
    };

    const getStatusStyle = (statut) => {
        const map = STATUS_BADGE[mode] ?? STATUS_BADGE.dark;
        return map[statut] ?? map.default;
    };

    const formatId = (id) => "#" + id.slice(0, 6).toUpperCase();

    const total = colis.length;
    const enCours = colis.filter(c => c.statut === "EN_COURS").length;
    const livres = colis.filter(c => c.statut === "LIVRE").length;

    const theadBg = mode === "dark" ? "#0a0a1a60" : "#f8f9fc";

    /* ── render ── */
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
            animation: "colisPageIn 0.25s ease",
        }}>
            <style>{`
                @keyframes colisPageIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .acolis-stat-card { padding: 20px 22px; }
                .acolis-stat-val  { font-size: 32px; font-weight: 700; line-height: 1; letter-spacing: -1px; }
                @media (max-width: 639px) {
                    .acolis-stat-card { padding: 12px 14px; }
                    .acolis-stat-val  { font-size: 22px; }
                }
            `}</style>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px #6366f130",
                    }}>
                        <Box size={20} color="#fff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: 0, letterSpacing: "-0.4px" }}>
                            {t("admin.colisManagement")}
                        </h1>
                        <p style={{ fontSize: 12, color: theme.sub, margin: 0, marginTop: 2 }}>
                            {filtered.length} {t(filtered.length !== 1 ? "admin.results" : "admin.result")} · {t("admin.realTimeUpdate")}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 14 }}>
                <StatCard
                    label={t("admin.allColis")}
                    value={total}
                    icon={Box}
                    iconColor={theme.accent}
                    iconBg={theme.accentBg}
                    theme={theme}
                />
                <StatCard
                    label={t("admin.inProgress")}
                    value={enCours}
                    icon={Clock}
                    iconColor={theme.yellow}
                    iconBg={theme.yellowBg}
                    valueColor={theme.yellow}
                    theme={theme}
                />
                <StatCard
                    label={t("admin.delivered")}
                    value={livres}
                    icon={CheckCircle2}
                    iconColor={theme.green}
                    iconBg={theme.greenBg}
                    valueColor={theme.green}
                    theme={theme}
                />
            </div>

            {/* ── SEARCH + FILTERS ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Search */}
                <div style={{ position: "relative" }}>
                    <Search size={15} color={theme.sub} style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                    }} />
                    <input
                        type="text"
                        placeholder={t("admin.search")}
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={e => {
                            e.target.style.borderColor = theme.accent;
                            e.target.style.boxShadow = `0 0 0 3px ${theme.accentBg}`;
                        }}
                        onBlur={e => {
                            e.target.style.borderColor = theme.border;
                            e.target.style.boxShadow = "none";
                        }}
                        style={{
                            width: "100%",
                            padding: "11px 14px 11px 42px",
                            borderRadius: 12,
                            background: theme.inputBg,
                            border: `1.5px solid ${theme.border}`,
                            color: theme.text,
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                    />
                </div>

                {/* Filter pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["TOUS", "PUBLIE", "ACCEPTE", "EN_COURS", "LIVRE", "ANNULE"].map((status) => {
                        const active = filter === status;
                        const hovered = filterHover === status;
                        const badge = STATUS_BADGE[mode]?.[status];
                        return (
                            <button
                                key={status}
                                onClick={() => handleFilter(status)}
                                onMouseEnter={() => setFilterHover(status)}
                                onMouseLeave={() => setFilterHover(null)}
                                style={{
                                    padding: "5px 14px",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: active ? 600 : 400,
                                    border: `1.5px solid ${active ? theme.accent : theme.border}`,
                                    background: active
                                        ? theme.accent
                                        : hovered ? theme.muted : "transparent",
                                    color: active ? "#fff" : (badge?.color ?? theme.sub),
                                    cursor: "pointer",
                                    transition: "all 0.18s",
                                    letterSpacing: "0.01em",
                                }}
                            >
                                {
                                    status === "TOUS" ? t("admin.all") :
                                        status === "PUBLIE" ? t("admin.statusPublished") :
                                            status === "ACCEPTE" ? t("admin.statusAccepted") :
                                                status === "EN_COURS" ? t("admin.statusInProgress") :
                                                    status === "LIVRE" ? t("admin.statusDelivered") :
                                                        status === "ANNULE" ? t("admin.statusCancelled") :
                                                            status
                                }
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── TABLE CARD ── */}
            <div style={{
                background: theme.surface,
                borderRadius: 18,
                boxShadow: theme.shadow,
                border: `1px solid ${theme.border}`,
                overflow: "hidden",
            }}>

                {/* Loading */}
                {loading && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "64px 0",
                        gap: 16,
                    }}>
                        <Spinner color={theme.accent} />
                        <p style={{ fontSize: 13, color: theme.sub, margin: 0 }}>
                            {t("admin.loadingColis")}
                        </p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "64px 0",
                        gap: 14,
                    }}>
                        <div style={{
                            width: 60,
                            height: 60,
                            borderRadius: 18,
                            background: theme.muted,
                            border: `1px solid ${theme.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Inbox size={26} color={theme.sub} strokeWidth={1.5} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: theme.text, margin: "0 0 5px" }}>
                                {t("admin.noColis")}
                            </p>
                            <p style={{ fontSize: 12, color: theme.sub, margin: 0 }}>
                                {t("admin.modifyFilters")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Table */}
                {!loading && filtered.length > 0 && (
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>

                            <thead>
                                <tr style={{ background: theadBg, borderBottom: `1px solid ${theme.border}` }}>
                                    {[t("admin.order"), t("admin.client"), t("admin.package"), t("admin.route"), t("admin.price"), t("admin.status"), t("admin.payment"), ""].map(h => (
                                        <th key={h} style={{
                                            padding: "12px 16px",
                                            textAlign: "left",
                                            color: theme.sub,
                                            fontWeight: 600,
                                            fontSize: 11,
                                            letterSpacing: "0.07em",
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((c) => (
                                    <tr
                                        key={c.id}
                                        onMouseEnter={() => setRowHover(c.id)}
                                        onMouseLeave={() => setRowHover(null)}
                                        style={{
                                            borderBottom: `1px solid ${theme.border}`,
                                            background: rowHover === c.id ? theme.muted : "transparent",
                                            transition: "background 0.15s",
                                        }}
                                    >
                                        {/* ID */}
                                        <td style={{ padding: "15px 16px", whiteSpace: "nowrap" }}>
                                            <span style={{
                                                fontFamily: "monospace",
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: theme.accent,
                                                background: theme.accentBg,
                                                padding: "3px 8px",
                                                borderRadius: 6,
                                                letterSpacing: "0.05em",
                                            }}>
                                                {formatId(c.id)}
                                            </span>
                                        </td>

                                        {/* Client */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                                <div style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {(c.userEmail?.[0] ?? "?").toUpperCase()}
                                                </div>
                                                <span style={{ color: theme.textMid, fontSize: 12 }}>
                                                    {c.userEmail}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Nom */}
                                        <td style={{ padding: "15px 16px", color: theme.text, fontWeight: 500 }}>
                                            {c.nom}
                                        </td>

                                        {/* Route */}
                                        <td style={{ padding: "15px 16px", whiteSpace: "nowrap" }}>
                                            <span style={{ color: theme.textMid, fontSize: 12 }}>{c.villeDepart}</span>
                                            <span style={{ color: theme.sub, margin: "0 7px", fontSize: 11 }}>→</span>
                                            <span style={{ color: theme.textMid, fontSize: 12 }}>{c.villeArrivee}</span>
                                        </td>

                                        {/* Prix */}
                                        <td style={{ padding: "15px 16px", color: theme.text, fontWeight: 600, whiteSpace: "nowrap" }}>
                                            {c.prixProposeMRU != null ? `${c.prixProposeMRU} MRU` : "—"}
                                        </td>

                                        {/* Statut */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <span style={{
                                                ...getStatusStyle(c.statut),
                                                display: "inline-block",
                                                padding: "4px 11px",
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.03em",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {c.statut.replace("_", " ")}
                                            </span>
                                        </td>

                                        {/* Paiement */}
                                        <td style={{ padding: "15px 16px" }}>
                                            {c.paid ? (
                                                <span style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    padding: "4px 10px",
                                                    borderRadius: 20,
                                                    background: theme.greenBg,
                                                    color: theme.green,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    ✔ {t("admin.paid")}
                                                </span>
                                            ) : (
                                                <span style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    padding: "4px 10px",
                                                    borderRadius: 20,
                                                    background: theme.redBg,
                                                    color: theme.red,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    ✕ {t("admin.unpaid")}
                                                </span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                onMouseEnter={() => setDeleteHover(c.id)}
                                                onMouseLeave={() => setDeleteHover(null)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                    padding: "5px 11px",
                                                    borderRadius: 8,
                                                    background: deleteHover === c.id ? theme.redBg : "transparent",
                                                    border: `1px solid ${deleteHover === c.id ? theme.red + "40" : "transparent"}`,
                                                    color: deleteHover === c.id ? theme.red : theme.sub,
                                                    cursor: "pointer",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    transition: "all 0.15s",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                <Trash2 size={13} />
                                                {t("admin.delete")}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
