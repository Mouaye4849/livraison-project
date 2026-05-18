import { useEffect, useState } from "react";
import { Users, Shield, Truck, User, Search, Inbox, Trash2, ArrowUpCircle, UserX, UserCheck } from "lucide-react";
import {
    getUsers,
    deleteUser,
    promoteUser,
    disableUser,
    enableUser
} from "../services/adminService";

/* ─────────────────────────────────────────────
   THEMES
───────────────────────────────────────────── */
const THEMES = {
    dark: {
        surface:   "#111128",
        inputBg:   "#0a0a1a",
        border:    "#1e1e30",
        muted:     "#1c1c2e",
        text:      "#e8e8f5",
        textMid:   "#9494b8",
        sub:       "#5a5a7a",
        accent:    "#6366f1",
        accentBg:  "#6366f118",
        red:       "#f87171",
        redBg:     "#f8717118",
        green:     "#4ade80",
        greenBg:   "#4ade8018",
        yellow:    "#fbbf24",
        yellowBg:  "#fbbf2418",
        orange:    "#fb923c",
        orangeBg:  "#fb923c18",
        purple:    "#c084fc",
        purpleBg:  "#c084fc18",
        blue:      "#60a5fa",
        blueBg:    "#60a5fa18",
        shadow:    "0 4px 24px rgba(0,0,0,0.45)",
        shadowSm:  "0 1px 6px rgba(0,0,0,0.25)",
    },
    light: {
        surface:   "#ffffff",
        inputBg:   "#f8f9fc",
        border:    "#e5e7eb",
        muted:     "#f3f4f6",
        text:      "#0f172a",
        textMid:   "#374151",
        sub:       "#6b7280",
        accent:    "#6366f1",
        accentBg:  "#ede9fe",
        red:       "#ef4444",
        redBg:     "#fee2e2",
        green:     "#16a34a",
        greenBg:   "#dcfce7",
        yellow:    "#d97706",
        yellowBg:  "#fef3c7",
        orange:    "#ea580c",
        orangeBg:  "#ffedd5",
        purple:    "#7e22ce",
        purpleBg:  "#f3e8ff",
        blue:      "#1d4ed8",
        blueBg:    "#dbeafe",
        shadow:    "0 4px 24px rgba(0,0,0,0.07)",
        shadowSm:  "0 1px 4px rgba(0,0,0,0.05)",
    },
};

const ROLE_BADGE = {
    dark: {
        ROLE_ADMIN:    { background: "#2e1a4a55", color: "#c084fc" },
        ROLE_VOYAGEUR: { background: "#1e3a5f55", color: "#60a5fa" },
        ROLE_USER:     { background: "#1c1c2e",   color: "#5a5a7a" },
    },
    light: {
        ROLE_ADMIN:    { background: "#f3e8ff", color: "#7e22ce" },
        ROLE_VOYAGEUR: { background: "#dbeafe", color: "#1d4ed8" },
        ROLE_USER:     { background: "#f3f4f6", color: "#6b7280" },
    },
};

const FILTER_LABELS = {
    TOUS: "Tous", ROLE_ADMIN: "Admin", ROLE_VOYAGEUR: "Voyageur", ROLE_USER: "Utilisateur",
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
            <style>{`@keyframes _spinu { to { transform: rotate(360deg); } }`}</style>
            <div style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "3px solid transparent",
                borderTopColor: color, borderRightColor: color,
                animation: "_spinu 0.75s linear infinite",
            }} />
        </>
    );
}

function StatCard({ label, value, icon: Icon, iconColor, iconBg, valueColor, theme }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: theme.surface,
                borderRadius: 16,
                padding: "20px 22px",
                boxShadow: hovered ? theme.shadow : theme.shadowSm,
                border: `1px solid ${hovered ? iconColor + "50" : theme.border}`,
                transition: "all 0.22s ease",
                transform: hovered ? "translateY(-3px)" : "translateY(0)",
                cursor: "default",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
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
            <div style={{ fontSize: 32, fontWeight: 700, color: valueColor ?? theme.text, lineHeight: 1, letterSpacing: "-1px" }}>
                {value}
            </div>
        </div>
    );
}

function ActionBtn({ label, icon: Icon, onClick, disabled, isLoading, color, bg }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
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
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 500,
                transition: "all 0.15s",
                opacity: disabled ? 0.45 : 1,
                whiteSpace: "nowrap",
            }}
        >
            {isLoading
                ? <span style={{ fontSize: 11, letterSpacing: "0.1em" }}>···</span>
                : <><Icon size={13} />{label}</>
            }
        </button>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function AdminUsers() {
    const { theme, mode } = useTheme();

    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("TOUS");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [deletingId, setDeletingId] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rowHover, setRowHover] = useState(null);
    const [filterHover, setFilterHover] = useState(null);

    /* ── business logic (unchanged) ── */
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers(0, 10);
            let data = [];
            if (Array.isArray(res.data)) {
                data = res.data;
            } else if (Array.isArray(res.data.content)) {
                data = res.data.content;
            }
            setUsers(data);
            setFiltered(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("❌ Erreur lors du chargement des utilisateurs");
            setUsers([]);
            setFiltered([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (value) => {
        setSearch(value);
        const result = users.filter(u =>
            u.email?.toLowerCase().includes(value.toLowerCase())
        );
        setFiltered(result);
    };

    const handleFilter = (role) => {
        setFilter(role);
        if (role === "TOUS") {
            setFiltered(users);
        } else {
            setFiltered(users.filter(u => u.role === role));
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("⚠️ Supprimer cet utilisateur ?");
        if (!confirmDelete) return;
        try {
            setDeletingId(id);
            await deleteUser(id);
            const updated = users.filter(u => u.id !== id);
            setUsers(updated);
            setFiltered(
                filter === "TOUS" ? updated : updated.filter(u => u.role === filter)
            );
        } catch (err) {
            console.error(err);
            alert("❌ Erreur suppression");
        } finally {
            setDeletingId(null);
        }
    };

    const handlePromote = async (id) => {
        try {
            setActionLoading(id);
            await promoteUser(id);
            fetchUsers();
        } catch {
            alert("❌ Error promote");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDisable = async (id) => {
        try {
            setActionLoading(id);
            await disableUser(id);
            fetchUsers();
        } catch {
            alert("❌ Error disable");
        } finally {
            setActionLoading(null);
        }
    };

    const handleEnable = async (id) => {
        try {
            setActionLoading(id);
            await enableUser(id);
            fetchUsers();
        } catch {
            alert("❌ Error enable");
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleBadge = (role) => {
        const map = ROLE_BADGE[mode] ?? ROLE_BADGE.dark;
        return map[role] ?? { background: theme.muted, color: theme.sub };
    };

    const total     = users.length;
    const admins    = users.filter(u => u.role === "ROLE_ADMIN").length;
    const voyageurs = users.filter(u => u.role === "ROLE_VOYAGEUR").length;
    const clients   = users.filter(u => u.role === "ROLE_USER").length;

    const theadBg = mode === "dark" ? "#0a0a1a60" : "#f8f9fc";

    /* ── render ── */
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
            animation: "usersPageIn 0.25s ease",
        }}>
            <style>{`
                @keyframes usersPageIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
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
                    <Users size={20} color="#fff" strokeWidth={2} />
                </div>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: 0, letterSpacing: "-0.4px" }}>
                        Gestion des utilisateurs
                    </h1>
                    <p style={{ fontSize: 12, color: theme.sub, margin: 0, marginTop: 2 }}>
                        {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} · mise à jour en temps réel
                    </p>
                </div>
            </div>

            {/* ── ERROR BANNER ── */}
            {error && (
                <div style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: theme.redBg,
                    border: `1px solid ${theme.red}30`,
                    color: theme.red,
                    fontSize: 13,
                    fontWeight: 500,
                }}>
                    {error}
                </div>
            )}

            {/* ── STATS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                <StatCard label="Total"         value={total}     icon={Users}  iconColor={theme.accent} iconBg={theme.accentBg} theme={theme} />
                <StatCard label="Admins"        value={admins}    icon={Shield} iconColor={theme.purple} iconBg={theme.purpleBg} valueColor={theme.purple} theme={theme} />
                <StatCard label="Voyageurs"     value={voyageurs} icon={Truck}  iconColor={theme.blue}   iconBg={theme.blueBg}   valueColor={theme.blue}   theme={theme} />
                <StatCard label="Utilisateurs"  value={clients}   icon={User}   iconColor={theme.sub}    iconBg={theme.muted}    theme={theme} />
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
                        placeholder="Rechercher par email..."
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
                    {["TOUS", "ROLE_ADMIN", "ROLE_VOYAGEUR", "ROLE_USER"].map((role) => {
                        const active  = filter === role;
                        const hovered = filterHover === role;
                        const badge   = ROLE_BADGE[mode]?.[role];
                        return (
                            <button
                                key={role}
                                onClick={() => handleFilter(role)}
                                onMouseEnter={() => setFilterHover(role)}
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
                                {FILTER_LABELS[role] ?? role}
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
                        <p style={{ fontSize: 13, color: theme.sub, margin: 0 }}>Chargement des utilisateurs...</p>
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
                                Aucun utilisateur trouvé
                            </p>
                            <p style={{ fontSize: 12, color: theme.sub, margin: 0 }}>
                                Modifiez vos filtres ou votre recherche
                            </p>
                        </div>
                    </div>
                )}

                {/* Table */}
                {!loading && filtered.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>

                            <thead>
                                <tr style={{ background: theadBg, borderBottom: `1px solid ${theme.border}` }}>
                                    {["ID", "Email", "Rôle", "Statut", "Actions"].map(h => (
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
                                {filtered.map((u) => (
                                    <tr
                                        key={u.id}
                                        onMouseEnter={() => setRowHover(u.id)}
                                        onMouseLeave={() => setRowHover(null)}
                                        style={{
                                            borderBottom: `1px solid ${theme.border}`,
                                            background: rowHover === u.id ? theme.muted : "transparent",
                                            opacity: u.enabled === false ? 0.5 : 1,
                                            transition: "background 0.15s, opacity 0.2s",
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
                                                #{u.id?.slice(0, 6).toUpperCase()}
                                            </span>
                                        </td>

                                        {/* Email */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                }}>
                                                    {(u.email?.[0] ?? "?").toUpperCase()}
                                                </div>
                                                <span style={{ color: theme.textMid, fontSize: 13 }}>{u.email}</span>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <span style={{
                                                ...getRoleBadge(u.role),
                                                display: "inline-block",
                                                padding: "4px 11px",
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.03em",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {u.role?.replace("ROLE_", "") ?? "—"}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: "15px 16px" }}>
                                            {u.enabled === false ? (
                                                <span style={{
                                                    display: "inline-block",
                                                    padding: "4px 11px",
                                                    borderRadius: 20,
                                                    background: theme.redBg,
                                                    color: theme.red,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                }}>
                                                    Désactivé
                                                </span>
                                            ) : (
                                                <span style={{
                                                    display: "inline-block",
                                                    padding: "4px 11px",
                                                    borderRadius: 20,
                                                    background: theme.greenBg,
                                                    color: theme.green,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                }}>
                                                    Actif
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: "15px 16px" }}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>

                                                {u.role !== "ROLE_ADMIN" && (
                                                    <ActionBtn
                                                        label="Supprimer"
                                                        icon={Trash2}
                                                        onClick={() => handleDelete(u.id)}
                                                        disabled={deletingId === u.id}
                                                        isLoading={deletingId === u.id}
                                                        color={theme.red}
                                                        bg={theme.redBg}
                                                    />
                                                )}

                                                {u.role !== "ROLE_ADMIN" && (
                                                    <ActionBtn
                                                        label="Promouvoir"
                                                        icon={ArrowUpCircle}
                                                        onClick={() => handlePromote(u.id)}
                                                        disabled={actionLoading === u.id}
                                                        isLoading={actionLoading === u.id}
                                                        color={theme.purple}
                                                        bg={theme.purpleBg}
                                                    />
                                                )}

                                                {u.enabled && (
                                                    <ActionBtn
                                                        label="Désactiver"
                                                        icon={UserX}
                                                        onClick={() => handleDisable(u.id)}
                                                        disabled={actionLoading === u.id}
                                                        isLoading={actionLoading === u.id}
                                                        color={theme.orange}
                                                        bg={theme.orangeBg}
                                                    />
                                                )}

                                                {!u.enabled && (
                                                    <ActionBtn
                                                        label="Activer"
                                                        icon={UserCheck}
                                                        onClick={() => handleEnable(u.id)}
                                                        disabled={actionLoading === u.id}
                                                        isLoading={actionLoading === u.id}
                                                        color={theme.green}
                                                        bg={theme.greenBg}
                                                    />
                                                )}

                                            </div>
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
