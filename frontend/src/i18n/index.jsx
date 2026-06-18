import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Globe, Check } from "lucide-react";
import fr from "./fr";
import ar from "./ar";

const translations = { fr, ar };

// ─── Context ──────────────────────────────────────────────────────────────────

const I18nContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function I18nProvider({ children }) {
    const [locale, setLocale] = useState(
        () => localStorage.getItem("wasali-locale") || "fr"
    );

    const changeLocale = (lang) => {
        setLocale(lang);
        localStorage.setItem("wasali-locale", lang);
    };

    // Recursive key lookup: t('home.hero.title1')
    const t = (key) => {
        const keys = key.split(".");
        let result = translations[locale];
        for (const k of keys) {
            result = result?.[k];
        }
        return result ?? key;
    };

    // Apply dir and lang to <html> on every locale change
    useEffect(() => {
        const isRtl = locale === "ar";
        document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
        document.documentElement.setAttribute("lang", locale);
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, changeLocale, t, isRtl: locale === "ar" }}>
            {children}
        </I18nContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n() {
    return useContext(I18nContext);
}

// ─── LanguageSelector ─────────────────────────────────────────────────────────
// variant="public"    → white text, for dark landing pages
// variant="dashboard" → follows dashboard color system (dark/light theme)

export function LanguageSelector({ variant = "dashboard" }) {
    const { locale, changeLocale } = useI18n();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const LANGS = [
        { code: "fr", label: "Français", short: "FR" },
        { code: "ar", label: "العربية",  short: "ع"  },
    ];

    const isPublic = variant === "public";

    const triggerCls = isPublic
        ? "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
        : "relative flex items-center justify-center gap-1.5 px-2.5 h-9 rounded-xl transition-all duration-200 dark:text-gray-400 text-gray-500 dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/[0.05] hover:bg-gray-100 text-[13px] font-medium";

    const dropdownCls = isPublic
        ? "absolute top-full mt-2 end-0 w-36 rounded-xl overflow-hidden bg-[#111]/95 backdrop-blur border border-white/10 shadow-xl shadow-black/40 z-50"
        : "absolute top-full mt-2 end-0 w-36 rounded-xl overflow-hidden z-50 dark:bg-[#111111] bg-white dark:border dark:border-white/[0.08] border border-gray-100 dark:shadow-[0_20px_60px_-4px_rgba(0,0,0,0.9)] shadow-xl";

    const itemCls = (active) =>
        isPublic
            ? `flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors duration-150 ${active ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`
            : `flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 ${active ? "dark:text-white text-gray-900 dark:bg-white/[0.06] bg-gray-50" : "dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/[0.04] hover:bg-gray-50"}`;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Sélectionner la langue"
                className={triggerCls}
            >
                <Globe size={15} />
                <span className="font-semibold">
                    {LANGS.find((l) => l.code === locale)?.short}
                </span>
            </button>

            {open && (
                <div className={dropdownCls}>
                    {LANGS.map(({ code, label }) => (
                        <button
                            key={code}
                            onClick={() => { changeLocale(code); setOpen(false); }}
                            className={itemCls(locale === code)}
                        >
                            <span dir={code === "ar" ? "rtl" : "ltr"}>{label}</span>
                            {locale === code && <Check size={13} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
