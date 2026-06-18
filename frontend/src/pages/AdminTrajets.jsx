import { useEffect, useState } from "react";
import { Truck, MapPin, Package, Search, Inbox, Trash2, CheckCircle, ArrowRight } from "lucide-react";
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
        orange: "#fb923c",
        orangeBg: "#fb923c18",
        purple: "#c084fc",
        purpleBg: "#c084fc18",
        blue: "#60a5fa",
        blueBg: "#60a5fa18",
        shadow: "0 4px 24px rgba(0,0,0,0.45)",
        shadowSm: "0 1px 6px rgba(0,0,0,0.25)",
    },
    light: {
        surface: "#ffffff",
        inputBg: "#f8f9fc",
        border: "#e5e7eb",
        muted: "#f3f4f6",
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
        orange: "#ea580c",
        orangeBg: "#ffedd5",
        purple: "#7e22ce",
        purpleBg: "#f3e8ff",
        blue: "#1d4ed8",
        blueBg: "#dbeafe",
        shadow: "0 4px 24px rgba(0,0,0,0.07)",
        shadowSm: "0 1px 4px rgba(0,0,0,0.05)",
    },
};

const STATUS_BADGE = {
    dark: {
        OUVERT: { background: "#4ade8018", color: "#4ade80" },
        COMPLET: { background: "#f8717118", color: "#f87171" },
    },
    light: {
        OUVERT: { background: "#dcfce7", color: "#16a34a" },
        COMPLET: { background: "#fee2e2", color: "#ef4444" },
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
            <style>{`@keyframes _spint { to { transform: rotate(360deg); } }`}</style>
            <div style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "3px solid transparent",
                borderTopColor: color, borderRightColor: color,
                animation: "_spint 0.75s linear infinite",
            }} />
        </>
    );
}

function StatCard({ label, value, icon: Icon, iconColor, iconBg, valueColor, theme }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="atrajets-stat-card"
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
                    width: 36, height: 36, borderRadius: 10,
                    background: iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <Icon size={17} color={iconColor} strokeWidth={2} />
                </div>
            </div>
            <div className="atrajets-stat-val" style={{ color: valueColor ?? theme.text }}>
                {value}
            </div>
        </div>
    );
}

function ActionBtn({ label, icon: Icon, onClick, color, bg }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 8,
                border: `1px solid ${hovered ? color + "55" : color + "28"}`,
                background: hovered ? bg : color + "12",
                color,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
            }}
        >
            <Icon size={13} />{label}
        </button>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function AdminTrajets() {
    const { theme, mode } = useTheme();
    const { t } = useI18n();

    const FILTER_LABELS = {
        TOUS: t("admin.all"),
        OUVERT: t("admin.open"),
        COMPLET: t("admin.completed"),
    };

    const [trajets, setTrajets] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("TOUS");
    const [loading, setLoading] = useState(true);

    const [rowHover, setRowHover] = useState(null);
    const [filterHover, setFilterHover] = useState(null);


    const fetchTrajets = async () => {
        try {
            const res = await api.get("/trajets"); // ADMIN
            setTrajets(res.data);
            setFiltered(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrajets();
    }, []);

    // =============================
    // 🔎 SEARCH
    // =============================
    const handleSearch = (value) => {
        setSearch(value);

        const data = trajets.filter(T =>
            T.origine?.toLowerCase().includes(value.toLowerCase()) ||
            T.destination?.toLowerCase().includes(value.toLowerCase()) ||
            T.voyageurEmail?.toLowerCase().includes(value.toLowerCase())
        );

        setFiltered(data);
    };

    // =============================
    // 🔍 FILTER
    // =============================
    const handleFilter = (status) => {
        setFilter(status);

        if (status === "TOUS") {
            setFiltered(trajets);
        } else {
            setFiltered(trajets.filter(T => T.statut === status));
        }
    };

    // =============================
    // ❌ DELETE
    // =============================
    const handleDelete = async (id) => {
        if (!window.confirm(t("admin.confirmDeleteTrajet"))) return;

        try {
            await api.delete(`/trajets/${id}`);
            fetchTrajets();
        } catch (err) {
            alert(t("admin.deleteError"));
        }
    };


    const formatId = (id) => "#TRJ-" + id.slice(0, 6).toUpperCase();

    // =============================
    // 📊 STATS
    // =============================
    const total = trajets.length;
    const ouverts = trajets.filter(T => T.statut === "OUVERT").length;
    const complets = trajets.filter(T => T.statut === "COMPLET").length;

    const getStatusBadge = (statut) => {
        const map = STATUS_BADGE[mode] ?? STATUS_BADGE.dark;
        return map[statut] ?? { background: theme.muted, color: theme.sub };
    };

    const theadBg = mode === "dark" ? "#0a0a1a60" : "#f8f9fc";

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
            animation: "trajetsAdminPageIn 0.25s ease",
        }}>
            <style>{`
                @keyframes trajetsAdminPageIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .atrajets-stat-card { padding: 20px 22px; }
                .atrajets-stat-val  { font-size: 32px; font-weight: 700; line-height: 1; letter-spacing: -1px; }
                @media (max-width: 639px) {
                    .atrajets-stat-card { padding: 12px 14px; }
                    .atrajets-stat-val  { font-size: 22px; }
                }
            `}</style>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px #6366f130",
                }}>
                    <Truck size={20} color="#fff" strokeWidth={2} />
                </div>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: 0, letterSpacing: "-0.4px" }}>
                        {t("admin.trajetsManagement")}
                    </h1>
                    <p style={{ fontSize: 12, color: theme.sub, margin: 0, marginTop: 2 }}>
                        {filtered.length} résultat{filtered.length} {t("admin.results")} · {t("admin.trajetsManagementSubtitle")}
                    </p>
                </div>
            </div>

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 14 }}>
                <StatCard label={t("admin.totalTrajets")} value={total} icon={Truck} iconColor={theme.accent} iconBg={theme.accentBg} theme={theme} />
                <StatCard label={t("admin.openTrajets")} value={ouverts} icon={CheckCircle} iconColor={theme.green} iconBg={theme.greenBg} valueColor={theme.green} theme={theme} />
                <StatCard label={t("admin.completedTrajets")} value={complets} icon={Package} iconColor={theme.red} iconBg={theme.redBg} valueColor={theme.red} theme={theme} />
            </div>

            {/* ── SEARCH + FILTERS ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Search */}
                <div style={{ position: "relative" }}>
                    <Search size={15} color={theme.sub} style={{
                        position: "absolute", left: 14, top: "50%",
                        transform: "translateY(-50%)", pointerEvents: "none",
                    }} />
                    <input
                        type="text"
                        placeholder={t("admin.searchTrajets")}
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
                    {["TOUS", "OUVERT", "COMPLET"].map((status) => {
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
                                    background: active ? theme.accent : hovered ? theme.muted : "transparent",
                                    color: active ? "#fff" : (badge?.color ?? theme.sub),
                                    cursor: "pointer",
                                    transition: "all 0.18s",
                                    letterSpacing: "0.01em",
                                }}
                            >
                                {FILTER_LABELS[status] ?? status}
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 16 }}>
                        <Spinner color={theme.accent} />
                        <p style={{ fontSize: 13, color: theme.sub, margin: 0 }}>{t("admin.loadingTrajets")}</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 14 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: 18,
                            background: theme.muted, border: `1px solid ${theme.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Inbox size={26} color={theme.sub} strokeWidth={1.5} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: theme.text, margin: "0 0 5px" }}>
                                {t("admin.noTrajetsFound")}
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
                                    {["ID", t("admin.traveler"), t("admin.route"), t("admin.date"), t("admin.capacity"), t("admin.status"), t("admin.packages"), t("admin.actions")].map(h => (
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
                                {filtered.map((T) => (
                                    <tr
                                        key={T.id}
                                        onMouseEnter={() => setRowHover(T.id)}
                                        onMouseLeave={() => setRowHover(null)}
                                        style={{
                                            borderBottom: `1px solid ${theme.border}`,
                                            background: rowHover === T.id ? theme.muted : "transparent",
                                            transition: "background 0.15s",
                                        }}
                                    >
                                        {/* ID */}
                                        <td style={{ padding: "15px 16px" }}>
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
                                                {formatId(T.id)}
                                            </span>
                                        </td>

                                        {/* Voyageur */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                }}>
                                                    {(t.voyageurEmail?.[0] ?? "?").toUpperCase()}
                                                </div>
                                                <span style={{ color: theme.textMid, fontSize: 13 }}>{t.voyageurEmail}</span>
                                            </div>
                                        </td>

                                        {/* Route */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <MapPin size={13} color={theme.orange} style={{ flexShrink: 0 }} />
                                                <span style={{ color: theme.text, fontWeight: 500 }}>{t.origine}</span>
                                                <ArrowRight size={12} color={theme.sub} style={{ flexShrink: 0 }} />
                                                <span style={{ color: theme.text, fontWeight: 500 }}>{t.destination}</span>
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td style={{ padding: "15px 16px", color: theme.textMid, whiteSpace: "nowrap" }}>
                                            {t.dateDepart}
                                        </td>

                                        {/* Capacité */}
                                        <td style={{ padding: "15px 16px", color: theme.textMid }}>
                                            {t.capaciteKg} {t("admin.kg")}
                                        </td>

                                        {/* Statut */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <span style={{
                                                ...getStatusBadge(t.statut),
                                                display: "inline-block",
                                                padding: "4px 11px",
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.03em",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {t.statut === "OUVERT" ? t("admin.open") : t("admin.completed")}
                                            </span>
                                        </td>

                                        {/* Colis count */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <span style={{
                                                display: "inline-block",
                                                padding: "3px 10px",
                                                borderRadius: 12,
                                                background: theme.accentBg,
                                                color: theme.accent,
                                                fontSize: 12,
                                                fontWeight: 600,
                                            }}>
                                                {t.colis?.length || 0}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <ActionBtn
                                                label={t("admin.delete")}
                                                icon={Trash2}
                                                onClick={() => handleDelete(t.id)}
                                                color={theme.red}
                                                bg={theme.redBg}
                                            />
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
