/**
 * components/ui.jsx
 * ─────────────────────────────────────────────
 * Lightweight UI primitives used only by TrajetPage.
 * Kept together because each one is tiny (<30 lines).
 *
 * Exports:
 *   AmbientOrbs   – fixed decorative background orbs
 *   SwapButton    – origin ↔ destination toggle
 *   SubmitButton  – gradient CTA with shimmer + press effect
 *   SectionLabel  – ALL-CAPS section divider with a rule line
 *   Divider       – thin horizontal rule
 */
import { useState } from "react";
import { ArrowUpDown, Send, ChevronRight, Loader2 } from "lucide-react";

/* ── AmbientOrbs ──────────────────────────────────────────────────── */
export function AmbientOrbs() {
    return (
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
            <div style={{
                position: "absolute", width: 640, height: 640, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(37,99,235,.07) 0%, transparent 70%)",
                top: "5%", left: "15%",
                animation: "orb1 13s ease-in-out infinite",
            }} />
            <div style={{
                position: "absolute", width: 520, height: 520, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(249,115,22,.06) 0%, transparent 70%)",
                bottom: "10%", right: "12%",
                animation: "orb2 16s ease-in-out infinite",
            }} />
        </div>
    );
}

/* ── SwapButton ───────────────────────────────────────────────────── */
export function SwapButton({ spinning, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title="Inverser origine ↔ destination"
            aria-label="Inverser origine et destination"
            style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",

                background: hovered ? "var(--orange-lo)" : "var(--blue-lo)",
                color: hovered ? "var(--orange)" : "var(--blue)",
                border: hovered
                    ? "1.5px solid rgba(249,115,22,.4)"
                    : "1.5px solid rgba(37,99,235,.3)",

                // separate duration so the spin takes its own timing
                transitionProperty: "background, border, color, transform",
                transitionDuration: spinning ? ".4s, .22s, .22s, .4s" : ".22s",
                transform: spinning ? "rotate(180deg)" : "rotate(0deg)",
            }}
        >
            <ArrowUpDown size={15} />
        </button>
    );
}

/* ── SubmitButton ─────────────────────────────────────────────────── */
export function SubmitButton({ loading, disabled, onClick }) {
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);

    const isInteractive = !disabled && !loading;

    const boxShadow = isInteractive && hovered
        ? "0 16px 48px rgba(37,99,235,.4), 0 4px 16px rgba(249,115,22,.2), inset 0 1px 0 rgba(255,255,255,.12)"
        : isInteractive
            ? "0 8px 28px rgba(37,99,235,.28), inset 0 1px 0 rgba(255,255,255,.09)"
            : "none";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading || disabled}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                width: "100%", height: 58, borderRadius: 16, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontFamily: "var(--font)", fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
                position: "relative", overflow: "hidden",
                cursor: disabled || loading ? "not-allowed" : "pointer",
                opacity: disabled ? 0.38 : 1,
                transition: "transform .15s, box-shadow .2s, opacity .2s",
                transform: pressed && isInteractive ? "scale(0.983)" : "scale(1)",
                boxShadow,

                background: disabled
                    ? "rgba(255,255,255,.05)"
                    : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #ea580c 100%)",
                backgroundSize: "200% 200%",
                animation: !disabled ? "gradShift 5s ease infinite" : "none",
                color: disabled ? "var(--muted)" : "#fff",
            }}
        >
            {/* shimmer overlay on hover */}
            {isInteractive && hovered && (
                <span style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,.13) 50%, transparent 70%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer .75s ease",
                }} />
            )}

            {loading ? (
                <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                    Publication en cours…
                </>
            ) : (
                <>
                    <Send size={16} style={{ flexShrink: 0 }} />
                    Publier le trajet
                    {!disabled && <ChevronRight size={15} style={{ opacity: .55, marginLeft: -2 }} />}
                </>
            )}
        </button>
    );
}

/* ── SectionLabel ─────────────────────────────────────────────────── */
export function SectionLabel({ label, delay = 0 }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
            animation: `fadeUp .5s ${delay}ms ease both`,
        }}>
            <span style={{
                fontSize: 9.5, fontWeight: 900, letterSpacing: "0.13em",
                textTransform: "uppercase", color: "rgba(255,255,255,.22)",
                fontFamily: "var(--font)", whiteSpace: "nowrap",
            }}>
                {label}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
    );
}

/* ── Divider ──────────────────────────────────────────────────────── */
export function Divider() {
    return <div style={{ height: 1, background: "var(--border)", margin: "22px 0" }} />;
}