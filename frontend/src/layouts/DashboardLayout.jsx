import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import {
    LayoutDashboard, Package, PlusCircle, Globe, Truck, Link,
    CreditCard, Layers, Route, ChevronLeft, ChevronRight, Search,
    LogOut, Settings, ChevronDown, MessageCircle, Sun, Moon,
} from "lucide-react";
import { useI18n, LanguageSelector } from "../i18n/index.jsx";
import { getToken } from "../utils/auth";
import { getUserRole } from "../utils/jwt";

function getUserEmail() {
    try {
        const u = localStorage.getItem("user");
        if (u) return JSON.parse(u).email ?? "";
    } catch { }
    return localStorage.getItem("email") ?? "";
}

function getInitials(email) {
    const name = email ? email.split("@")[0] : "U";
    return name.slice(0, 2).toUpperCase();
}

// ─── Nav config (function so it uses translated labels) ───────────────────────

function getNavSections(t, role) {

    const sections = [
        {
            key: "overview",
            label: t("layout.sections.overview"),
            items: [
                {
                    path: "/dashboard",
                    icon: LayoutDashboard,
                    label: t("layout.nav.dashboard")
                },
            ],
        },
    ];

    // USER
    if (role === "ROLE_USER") {

        sections.push({
            key: "colis",
            label: t("layout.sections.colis"),
            items: [
                {
                    path: "/dashboard/my-colis",
                    icon: Package,
                    label: t("layout.nav.myColis")
                },
                {
                    path: "/dashboard/colis/create",
                    icon: PlusCircle,
                    label: t("layout.nav.createColis")
                },

            ],
        });

        sections.push({
            key: "management",
            label: t("layout.sections.management"),
            items: [
                {
                    path: "/dashboard/payments",
                    icon: CreditCard,
                    label: t("layout.nav.payments")
                },
            ],
        });
    }

    // VOYAGEUR
    if (role === "ROLE_VOYAGEUR") {

        sections.push({
            key: "trajets",
            label: t("layout.sections.trajets"),
            items: [
                {
                    path: "/dashboard/trajets",
                    icon: Truck,
                    label: t("layout.nav.myTrajets")
                },
                {
                    path: "/dashboard/trajets/create",
                    icon: Route,
                    label: t("layout.nav.createTrajet")
                },
                {
                    path: "/dashboard/trajets/with-colis",
                    icon: Layers,
                    label: t("layout.nav.trajetsWithColis")
                },
                {
                    path: "/dashboard/colis/public",
                    icon: Globe,
                    label: t("layout.nav.publicColis")
                },
            ],
        });

        sections.push({
            key: "management",
            label: t("layout.sections.management"),
            items: [
                {
                    path: "/dashboard/assign",
                    icon: Link,
                    label: t("layout.nav.assignColis")
                },
                {
                    path: "/dashboard/payments",
                    icon: CreditCard,
                    label: t("layout.nav.payments")
                },
            ],
        });
    }

    sections.push({
        key: "communication",
        label: t("layout.sections.communication"),
        items: [
            {
                path: "/dashboard/messages",
                icon: MessageCircle,
                label: t("layout.nav.messages")
            },
        ],
    });

    return sections;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle, role }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useI18n();
    const isActive = (path) => location.pathname === path;
    const sections = getNavSections(t, role);

    return (
        <aside
            style={{ width: collapsed ? "66px" : "234px" }}
            className="
                relative flex flex-col h-screen shrink-0
                transition-all duration-300 ease-in-out
                dark:bg-[#080808] bg-white
                dark:border-e dark:border-white/[0.05] border-e border-gray-100
            "
        >
            {/* ── Logo ── */}
            <div className="
                flex items-center gap-3 px-3.5 h-[60px] overflow-hidden
                dark:border-b dark:border-white/[0.05] border-b border-gray-100
            ">
                <div className="
                    flex items-center justify-center w-8 h-8 rounded-xl shrink-0
                    bg-gradient-to-br from-red-500 to-red-700
                    shadow-lg shadow-red-600/25
                ">
                    <Truck size={15} className="text-white" />
                </div>

                {!collapsed && (
                    <div className="overflow-hidden">
                        <p className="dark:text-white text-gray-900 font-bold text-[15px] tracking-tight whitespace-nowrap leading-tight">
                            Wasali
                        </p>
                        <p className="text-[9px] dark:text-gray-600 text-gray-400 uppercase tracking-[0.15em] font-semibold">
                            Delivery
                        </p>
                    </div>
                )}
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
                {sections.map((section) => (
                    <div key={section.key}>
                        {!collapsed && (
                            <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] dark:text-gray-600 text-gray-400">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map(({ path, icon: Icon, label }) => {
                                const active = isActive(path);
                                return (
                                    <button
                                        key={path}
                                        onClick={() => navigate(path)}
                                        title={collapsed ? label : undefined}
                                        className={`
                                            group relative flex items-center gap-3 w-full
                                            px-2.5 py-2.5 rounded-xl text-[13px] font-medium
                                            transition-all duration-150
                                            ${active
                                                ? "dark:bg-red-950/50 bg-red-50 dark:text-red-400 text-red-600"
                                                : "dark:text-gray-500 text-gray-500 dark:hover:text-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.04] hover:bg-gray-50"
                                            }
                                        `}
                                    >
                                        {/* Active left pill */}
                                        {active && (
                                            <span className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-red-400 to-red-600" />
                                        )}

                                        <Icon
                                            size={16}
                                            className={`shrink-0 transition-all duration-150 ${active
                                                ? "dark:text-red-400 text-red-500"
                                                : "dark:text-gray-600 text-gray-400 group-hover:scale-110"
                                                }`}
                                        />

                                        {!collapsed && (
                                            <span className="whitespace-nowrap truncate">{label}</span>
                                        )}

                                        {/* Tooltip when collapsed */}
                                        {collapsed && (
                                            <span className="
                                                pointer-events-none absolute start-full ms-3 px-2.5 py-1.5
                                                rounded-lg z-50 whitespace-nowrap text-xs font-medium
                                                dark:bg-[#1c1c1c] bg-white
                                                dark:border dark:border-white/[0.08] border border-gray-100
                                                dark:text-gray-200 text-gray-800
                                                dark:shadow-2xl shadow-lg
                                                opacity-0 group-hover:opacity-100
                                                translate-x-1 group-hover:translate-x-0
                                                transition-all duration-150
                                            ">
                                                {label}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── Collapse toggle ── */}
            <div className="p-2 dark:border-t dark:border-white/[0.05] border-t border-gray-100">
                <button
                    onClick={onToggle}
                    className="
                        flex items-center justify-center w-full h-9 rounded-xl
                        dark:text-gray-600 text-gray-400
                        dark:hover:text-gray-300 hover:text-gray-700
                        dark:hover:bg-white/[0.04] hover:bg-gray-100
                        transition-all duration-150
                    "
                >
                    {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                </button>
            </div>
        </aside>
    );
}

// ─── Dropdown item ────────────────────────────────────────────────────────────

function DropdownItem({ icon: Icon, label, onClick, danger }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-3 w-full px-3 py-2 text-[13px] rounded-xl font-medium
                transition-all duration-150
                ${danger
                    ? "dark:text-red-400 text-red-500 dark:hover:bg-red-500/10 hover:bg-red-50"
                    : "dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/[0.04] hover:bg-gray-50"
                }
            `}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ onLogout, theme, onToggleTheme }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const dropdownRef = useRef(null);
    const userEmail = getUserEmail();
    const initials = getInitials(userEmail);
    const { t } = useI18n();

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <header className="
            sticky top-0 z-30 h-[60px]
            dark:bg-[#080808]/90 bg-white/90
            backdrop-blur-2xl backdrop-saturate-150
            dark:border-b dark:border-white/[0.05] border-b border-gray-100
            dark:shadow-[0_1px_0_rgba(255,255,255,0.03)] shadow-sm
        ">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            <div className="flex items-center gap-3 h-full px-5">

                {/* ── Search ── */}
                <div className="relative flex-1 max-w-sm">
                    <Search
                        size={13}
                        className={`absolute start-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150 ${searchFocused ? "dark:text-red-400 text-red-500" : "dark:text-gray-600 text-gray-400"
                            }`}
                    />
                    <input
                        type="text"
                        placeholder={t("layout.search")}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="
                            w-full ps-9 pe-10 py-2 text-[13px] rounded-xl
                            dark:bg-white/[0.04] bg-gray-50
                            dark:border dark:border-white/[0.06] border border-gray-200
                            dark:text-gray-300 text-gray-700
                            dark:placeholder-gray-600 placeholder-gray-400
                            focus:outline-none
                            dark:focus:border-red-500/40 focus:border-red-300
                            dark:focus:bg-white/[0.07] focus:bg-white
                            focus:ring-2 dark:focus:ring-red-500/10 focus:ring-red-200/40
                            transition-all duration-200
                        "
                    />
                    <span className="
                        absolute end-2.5 top-1/2 -translate-y-1/2
                        text-[9px] font-semibold tracking-wide
                        dark:text-gray-700 text-gray-400
                        dark:bg-white/[0.05] bg-gray-100
                        px-1.5 py-0.5 rounded-md
                        pointer-events-none
                    ">⌘K</span>
                </div>

                {/* ── Right actions ── */}
                <div className="ms-auto flex items-center gap-1">

                    {/* Notification bell */}
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl dark:hover:bg-white/[0.05] hover:bg-gray-100 transition-colors duration-150">
                        <NotificationBell />
                    </div>

                    {/* ── Theme toggle ── */}
                    <button
                        onClick={onToggleTheme}
                        aria-label={theme === "dark" ? t("layout.lightMode") : t("layout.darkMode")}
                        className="
                            relative flex items-center justify-center w-9 h-9 rounded-xl
                            transition-all duration-200 group overflow-hidden
                            dark:text-gray-400 text-gray-500
                            dark:hover:text-yellow-300 hover:text-gray-800
                            dark:hover:bg-yellow-400/10 hover:bg-amber-50
                        "
                    >
                        <span className={`absolute transition-all duration-300 ${theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}><Sun size={16} /></span>
                        <span className={`absolute transition-all duration-300 ${theme === "light" ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}><Moon size={16} /></span>
                    </button>

                    {/* ── Language selector ── */}
                    <LanguageSelector variant="dashboard" />

                    {/* Divider */}
                    <div className="w-px h-5 dark:bg-white/[0.07] bg-gray-200 mx-1.5" />

                    {/* ── Profile dropdown ── */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProfileOpen((p) => !p)}
                            className="
                                flex items-center gap-2.5 ps-1.5 pe-2.5 py-1.5 rounded-xl
                                dark:hover:bg-white/[0.05] hover:bg-gray-100
                                transition-all duration-150
                            "
                        >
                            <div className="relative shrink-0">
                                <div className="
                                    w-7 h-7 rounded-lg
                                    bg-gradient-to-br from-red-400 via-red-600 to-red-800
                                    flex items-center justify-center
                                    shadow-md shadow-red-500/30
                                    ring-1 dark:ring-white/10 ring-black/[0.06]
                                ">
                                    <span className="text-white text-[11px] font-bold leading-none">{initials}</span>
                                </div>
                                <span className="absolute -bottom-0.5 -end-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-[1.5px] dark:ring-[#080808] ring-white" />
                            </div>

                            <div className="hidden sm:flex flex-col items-start leading-none">
                                <span className="text-[12px] dark:text-gray-200 text-gray-800 font-semibold">
                                    {userEmail ? userEmail.split("@")[0] : "Mon compte"}
                                </span>
                                <span className="text-[10px] dark:text-gray-600 text-gray-400 mt-0.5">
                                    {t("layout.client")}
                                </span>
                            </div>

                            <ChevronDown size={12} className={`dark:text-gray-600 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                        </button>

                        {/* Dropdown panel */}
                        {profileOpen && (
                            <div className="
                                dropdown-enter
                                absolute end-0 mt-2 w-56 z-50 rounded-2xl overflow-hidden
                                dark:bg-[#111111] bg-white
                                dark:border dark:border-white/[0.08] border border-gray-100
                                dark:shadow-[0_20px_60px_-4px_rgba(0,0,0,0.9)] shadow-xl shadow-gray-200
                            ">
                                {/* User card */}
                                <div className="px-4 py-3.5 dark:border-b dark:border-white/[0.06] border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl shrink-0 bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center shadow-md shadow-red-500/20">
                                            <span className="text-white text-[12px] font-bold">{initials}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] dark:text-white text-gray-900 font-semibold truncate">
                                                {userEmail || "Utilisateur"}
                                            </p>
                                            <p className="text-[11px] dark:text-gray-500 text-gray-400">
                                                {t("layout.wasaliClient")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Theme toggle row */}
                                <div className="px-3 py-2.5 dark:border-b dark:border-white/[0.06] border-b border-gray-100">
                                    <button
                                        onClick={onToggleTheme}
                                        className="
                                            flex items-center justify-between w-full px-3 py-2 rounded-xl
                                            dark:text-gray-400 text-gray-600
                                            dark:hover:bg-white/[0.04] hover:bg-gray-50
                                            text-[13px] font-medium
                                            transition-colors duration-150
                                        "
                                    >
                                        <div className="flex items-center gap-3">
                                            {theme === "dark"
                                                ? <Sun size={14} className="text-yellow-400" />
                                                : <Moon size={14} className="text-indigo-400" />
                                            }
                                            <span>{theme === "dark" ? t("layout.lightMode") : t("layout.darkMode")}</span>
                                        </div>
                                        <div
                                            className={`w-8 rounded-full relative transition-colors duration-200 ${theme === "dark" ? "bg-gray-700" : "bg-red-500"}`}
                                            style={{ height: "18px" }}
                                        >
                                            <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${theme === "dark" ? "translate-x-0.5" : "translate-x-[18px]"}`} />
                                        </div>
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="p-1.5">
                                    <DropdownItem icon={Settings} label={t("layout.settings")} />
                                    <DropdownItem icon={LogOut} label={t("layout.logout")} onClick={onLogout} danger />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

// ─── DashboardLayout ──────────────────────────────────────────────────────────

export default function DashboardLayout() {
    const navigate = useNavigate();

    const token = getToken();
    const role = getUserRole(token);
    const [collapsed, setCollapsed] = useState(false);

    const [theme, setTheme] = useState(() =>
        localStorage.getItem("wasali-theme") || "dark"
    );

    useEffect(() => {
        localStorage.setItem("wasali-theme", theme);
        document.documentElement.classList.add("theme-transitioning");
        const t = setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 400);
        return () => clearTimeout(t);
    }, [theme]);

    const toggleTheme = useCallback(() =>
        setTheme((t) => (t === "dark" ? "light" : "dark")), []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
    };

    return (
        <div className={`${theme === "dark" ? "dark" : ""} flex h-screen dark:bg-[#080808] bg-gray-50 overflow-hidden`}>
            <Sidebar collapsed={collapsed} role={role} onToggle={() => setCollapsed((c) => !c)} />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Navbar onLogout={logout} theme={theme} onToggleTheme={toggleTheme} />
                <main className="flex-1 overflow-y-auto dark:bg-[#080808] bg-gray-50">
                    <div className="p-6 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
