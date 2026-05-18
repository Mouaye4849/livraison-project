import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    BarChart3, Box, Users, Truck, LogOut, UserCog,
    ChevronDown, Menu, X, ChevronLeft, ChevronRight,
    Sun, Moon, Settings, PanelLeftClose, PanelLeft,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";

/* ─────────────────────────────────────────────
   THEMES
───────────────────────────────────────────── */
const THEMES = {
    dark: {
        bg: "#07070f",
        surface: "#0f0f1a",
        surfaceAlt: "#05050c",
        sidebarBg: "#08080d",
        headerBg: "#020211",
        border: "#1e1e30",
        muted: "#1c1c2e",
        mutedHover: "#22223a",
        text: "#e8e8f5",
        sub: "#5a5a7a",
        accent: "#6366f1",
        accentBg: "#6366f115",
        accentHover: "#6366f125",
        orange: "#f97316",
        red: "#ef4444",
        redBg: "#ef444415",
        shadow: "0 4px 24px rgba(0,0,0,0.5)",
    },
    light: {
        bg: "#eef0f6",
        surface: "#ffffff",
        surfaceAlt: "#f9fafb",
        sidebarBg: "#ffffff",
        headerBg: "#ffffff",
        border: "#e5e7eb",
        muted: "#f3f4f6",
        mutedHover: "#e9eaec",
        text: "#0f172a",
        sub: "#6b7280",
        accent: "#6366f1",
        accentBg: "#6366f110",
        accentHover: "#6366f120",
        orange: "#f97316",
        red: "#ef4444",
        redBg: "#ef444412",
        shadow: "0 4px 24px rgba(0,0,0,0.07)",
    },
};

/* ─────────────────────────────────────────────
   NAV ITEMS
───────────────────────────────────────────── */
const NAV_ITEMS = [
    { icon: BarChart3, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Box, label: "Tous les colis", path: "/admin/colis" },
    { icon: Users, label: "Utilisateurs", path: "/admin/users" },
    { icon: Truck, label: "Trajets", path: "/admin/trajets" },
    { icon: Truck, label: "Pending Trajets", path: "/admin/trajets/pending", badge: "!" },
];

const PAGE_TITLES = {
    "/admin/dashboard": "Dashboard",
    "/admin/colis": "Tous les colis",
    "/admin/users": "Utilisateurs",
    "/admin/trajets": "Trajets",
    "/admin/trajets/pending": "Pending Trajets",
};

/* ─────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────── */
function NavItem({ item, active, collapsed, theme, onClick }) {
    const [hovered, setHovered] = useState(false);

    const bg = active
        ? theme.accentBg
        : hovered
            ? theme.mutedHover
            : "transparent";

    const color = active ? theme.accent : theme.sub;
    const borderLeft = active ? `3px solid ${theme.accent}` : "3px solid transparent";

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={collapsed ? item.label : undefined}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: collapsed ? "10px 0" : "9px 12px",
                borderRadius: 10,
                marginBottom: 3,
                background: bg,
                border: "none",
                borderLeft,
                cursor: "pointer",
                color,
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                justifyContent: collapsed ? "center" : "flex-start",
                transition: "all 0.18s ease",
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
            }}
        >
            <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />

            {!collapsed && (
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                </span>
            )}

            {item.badge && !collapsed && (
                <span style={{
                    background: theme.red,
                    color: "#fff",
                    borderRadius: 20,
                    padding: "1px 7px",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                }}>
                    {item.badge}
                </span>
            )}

            {item.badge && collapsed && (
                <span style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    background: theme.red,
                    borderRadius: "50%",
                }} />
            )}
        </button>
    );
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
function Sidebar({ theme, navigate, currentPath, collapsed, toggle, logout }) {
    return (
        <aside style={{
            width: collapsed ? 68 : 230,
            minWidth: collapsed ? 68 : 230,
            background: theme.sidebarBg,
            borderRight: `1px solid ${theme.border}`,
            display: "flex",
            flexDirection: "column",
            padding: "16px 10px",
            transition: "width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1)",
            overflow: "hidden",
            position: "relative",
        }}>

            {/* LOGO */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "0 0 18px" : "0 6px 18px",
                borderBottom: `1px solid ${theme.border}`,
                marginBottom: 14,
                overflow: "hidden",
                justifyContent: collapsed ? "center" : "flex-start",
            }}>
                <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.orange})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <UserCog size={18} color="#fff" strokeWidth={2} />
                </div>
                {!collapsed && (
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, letterSpacing: "-0.3px" }}>
                            Wasali
                        </div>
                        <div style={{ fontSize: 10, color: theme.sub, marginTop: 1 }}>
                            Admin Panel
                        </div>
                    </div>
                )}
            </div>

            {/* NAV */}
            <nav style={{ flex: 1 }}>
                {!collapsed && (
                    <p style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: theme.sub,
                        letterSpacing: "0.08em",
                        padding: "0 6px",
                        marginBottom: 6,
                        textTransform: "uppercase",
                    }}>
                        Navigation
                    </p>
                )}

                {NAV_ITEMS.map(item => (
                    <NavItem
                        key={item.path}
                        item={item}
                        active={currentPath === item.path}
                        collapsed={collapsed}
                        theme={theme}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </nav>

            {/* BOTTOM */}
            <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12, marginTop: 8 }}>

                {/* LOGOUT */}
                <LogoutBtn collapsed={collapsed} theme={theme} logout={logout} />

                {/* COLLAPSE TOGGLE */}
                <button
                    onClick={toggle}
                    title={collapsed ? "Développer" : "Réduire"}
                    style={{
                        marginTop: 6,
                        width: "100%",
                        padding: "7px 0",
                        borderRadius: 8,
                        background: theme.muted,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: theme.sub,
                        transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.mutedHover}
                    onMouseLeave={e => e.currentTarget.style.background = theme.muted}
                >
                    {collapsed
                        ? <PanelLeft size={16} />
                        : <PanelLeftClose size={16} />
                    }
                </button>
            </div>
        </aside>
    );
}

function LogoutBtn({ collapsed, theme, logout }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={logout}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 10,
                background: hovered ? theme.redBg : "transparent",
                border: "none",
                color: hovered ? theme.red : theme.sub,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                justifyContent: collapsed ? "center" : "flex-start",
                transition: "all 0.18s ease",
            }}
        >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {!collapsed && "Déconnexion"}
        </button>
    );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function LayoutHeader({ title, onMenuToggle, onLogout, theme, toggleTheme, themeMode }) {
    const [dropOpen, setDropOpen] = useState(false);
    const [themeHover, setThemeHover] = useState(false);
    const ref = useRef();

    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
    })();
    const email = user.email || "admin@wasali.com";
    const role = user.role || "Administrateur";
    const initials = email.charAt(0).toUpperCase();

    useEffect(() => {
        const h = (e) => !ref.current?.contains(e.target) && setDropOpen(false);
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <header style={{
            background: theme.headerBg,
            borderBottom: `1px solid ${theme.border}`,
            padding: "0 24px",
            height: 60,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: theme.shadow,
            position: "sticky",
            top: 0,
            zIndex: 50,
        }}>

            {/* LEFT */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                    onClick={onMenuToggle}
                    style={{
                        padding: 7,
                        borderRadius: 8,
                        background: "transparent",
                        border: "none",
                        color: theme.sub,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.muted}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                    <Menu size={18} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 4,
                        height: 18,
                        borderRadius: 4,
                        background: `linear-gradient(to bottom, ${theme.accent}, ${theme.orange})`,
                    }} />
                    <h1 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: theme.text,
                        letterSpacing: "-0.3px",
                        margin: 0,
                    }}>
                        {title}
                    </h1>
                </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

                {/* THEME TOGGLE */}
                <button
                    onClick={toggleTheme}
                    onMouseEnter={() => setThemeHover(true)}
                    onMouseLeave={() => setThemeHover(false)}
                    title={themeMode === "dark" ? "Mode clair" : "Mode sombre"}
                    style={{
                        padding: 8,
                        borderRadius: 9,
                        background: themeHover ? theme.muted : theme.surfaceAlt,
                        border: `1px solid ${theme.border}`,
                        color: theme.sub,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.18s",
                    }}
                >
                    {themeMode === "dark"
                        ? <Sun size={15} />
                        : <Moon size={15} />
                    }
                </button>

                {/* NOTIFICATIONS */}
                <NotificationBell />

                {/* PROFILE DROPDOWN */}
                <div ref={ref} style={{ position: "relative" }}>
                    <button
                        onClick={() => setDropOpen(!dropOpen)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "5px 10px 5px 5px",
                            borderRadius: 10,
                            background: dropOpen ? theme.muted : theme.surfaceAlt,
                            border: `1px solid ${theme.border}`,
                            cursor: "pointer",
                            color: theme.text,
                            transition: "all 0.18s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.muted}
                        onMouseLeave={e => { if (!dropOpen) e.currentTarget.style.background = theme.surfaceAlt; }}
                    >
                        <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${theme.accent}, ${theme.orange})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            {initials}
                        </div>

                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, lineHeight: 1.3 }}>
                                {email}
                            </div>
                            <div style={{ fontSize: 10, color: theme.sub, lineHeight: 1 }}>
                                {role}
                            </div>
                        </div>

                        <ChevronDown
                            size={13}
                            color={theme.sub}
                            style={{ transition: "transform 0.2s", transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                    </button>

                    {/* DROPDOWN */}
                    {dropOpen && (
                        <div style={{
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 8px)",
                            width: 230,
                            background: theme.surface,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 14,
                            padding: 10,
                            boxShadow: theme.shadow,
                            zIndex: 100,
                            animation: "dropIn 0.15s ease",
                        }}>
                            <style>{`
                                @keyframes dropIn {
                                    from { opacity: 0; transform: translateY(-6px); }
                                    to   { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>

                            {/* INFO */}
                            <div style={{
                                padding: "8px 10px 12px",
                                borderBottom: `1px solid ${theme.border}`,
                                marginBottom: 8,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: `linear-gradient(135deg, ${theme.accent}, ${theme.orange})`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        fontSize: 14,
                                        fontWeight: 700,
                                    }}>
                                        {initials}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{email}</div>
                                        <div style={{ fontSize: 11, color: theme.sub }}>{role}</div>
                                    </div>
                                </div>
                            </div>

                            {/* SETTINGS */}
                            <DropBtn icon={Settings} label="Paramètres" theme={theme} />

                            {/* LOGOUT */}
                            <DropBtn
                                icon={LogOut}
                                label="Déconnexion"
                                theme={theme}
                                danger
                                onClick={onLogout}
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function DropBtn({ icon: Icon, label, theme, danger, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 9,
                background: danger
                    ? hovered ? theme.redBg : "transparent"
                    : hovered ? theme.muted : "transparent",
                border: "none",
                color: danger ? theme.red : theme.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontSize: 13,
                marginBottom: 2,
                transition: "all 0.15s",
                textAlign: "left",
            }}
        >
            <Icon size={15} style={{ opacity: 0.8 }} />
            {label}
        </button>
    );
}

/* ─────────────────────────────────────────────
   MAIN LAYOUT
───────────────────────────────────────────── */
export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(false);
    const [themeMode, setThemeMode] = useState(
        () => localStorage.getItem("theme") || "dark"
    );

    const theme = THEMES[themeMode];

    const toggleTheme = () => {
        const next = themeMode === "dark" ? "light" : "dark";
        setThemeMode(next);
        localStorage.setItem("theme", next);
        window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    };

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            background: theme.bg,
            color: theme.text,
            fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
            transition: "background 0.3s, color 0.3s",
        }}>

            {/* SIDEBAR */}
            <Sidebar
                theme={theme}
                navigate={navigate}
                currentPath={location.pathname}
                collapsed={collapsed}
                toggle={() => setCollapsed(c => !c)}
                logout={logout}
            />

            {/* CONTENT */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                <LayoutHeader
                    title={PAGE_TITLES[location.pathname] || "Admin"}
                    onMenuToggle={() => setCollapsed(c => !c)}
                    onLogout={logout}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    themeMode={themeMode}
                />

                <main style={{
                    flex: 1,
                    padding: "24px",
                    overflowY: "auto",
                    background: theme.bg,
                }}>
                    <Outlet />
                </main>

            </div>
        </div>
    );
}