import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
    Package, Weight, Hash, DollarSign, CheckCircle, XCircle,
    Upload, Trash2, CreditCard, Rocket, Loader2, Search,
    RefreshCw, Plus, ChevronDown, Image, ChevronUp, AlertTriangle,
    Filter, ArrowUpDown, X, SortAsc
} from "lucide-react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS  (inline so no external files)
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  /* Light mode defaults */
  .mc-root {
    --bg: #f9fafb;
    --surface: #ffffff;
    --surface-2: #f3f4f6;
    --border: #e5e7eb;
    --border-hover: #d1d5db;
    --text: #111827;
    --muted: #6b7280;
    --primary: #1e3a8a;
    --primary-light: #3b5fc0;
    --accent: #f97316;
    --accent-light: #fb923c;
  }

  /* Dark mode overrides */
  .dark .mc-root {
    --bg: #0a0a0a;
    --surface: #111111;
    --surface-2: #171717;
    --border: #1f1f1f;
    --border-hover: #2d2d2d;
    --text: #f5f5f5;
    --muted: #888;
  }

  .mc-root { font-family: 'DM Sans', sans-serif; background: var(--bg); min-height: 100vh; color: var(--text); }

  /* ── SKELETON ── */
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .skeleton {
    background: linear-gradient(90deg, var(--border) 25%, var(--surface-2) 50%, var(--border) 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 8px;
  }

  /* ── TOAST ── */
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(20px)} }
  .toast-enter { animation: slideUp .3s ease forwards; }
  .toast-exit  { animation: slideDown .3s ease forwards; }

  /* ── CARD ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .card-appear { animation: fadeUp .4s ease both; }

  /* ── HOVER LIFT ── */
  .card-hover {
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px rgba(0,0,0,.5);
    border-color: var(--border-hover) !important;
  }

  /* ── MODAL ── */
  @keyframes scaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  .modal-panel { animation: scaleIn .2s ease; }

  /* ── PHOTO GRID ── */
  .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
  .photo-thumb { aspect-ratio:1; object-fit:cover; border-radius:8px; width:100%; cursor:pointer;
    transition: transform .15s; }
  .photo-thumb:hover { transform: scale(1.05); }

  /* ── SCROLL BAR ── */
  .mc-root ::-webkit-scrollbar { width: 4px; }
  .mc-root ::-webkit-scrollbar-track { background: var(--bg); }
  .mc-root ::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 4px; }
`;

/* ─────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────── */
const STATUS_CONFIG = {
    BROUILLON: { label: "Brouillon", color: "#9ca3af", bg: "rgba(156,163,175,.12)", bar: "#374151" },
    PUBLIE: { label: "Publié", color: "#60a5fa", bg: "rgba(96,165,250,.12)", bar: "#1d4ed8" },
    ACCEPTE: { label: "Accepté", color: "#fbbf24", bg: "rgba(251,191,36,.12)", bar: "#d97706" },
    EN_COURS: { label: "En cours", color: "#c084fc", bg: "rgba(192,132,252,.12)", bar: "#7c3aed" },
    LIVRE: { label: "Livré", color: "#34d399", bg: "rgba(52,211,153,.12)", bar: "#059669" },
    ANNULE: { label: "Annulé", color: "#f87171", bg: "rgba(248,113,113,.12)", bar: "#dc2626" },
};

const ALL_STATUSES = ["BROUILLON", "PUBLIE", "ACCEPTE", "EN_COURS", "LIVRE", "ANNULE"];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function MyColis() {
    const navigate = useNavigate();

    const [colis, setColis] = useState([]);
    const [photos, setPhotos] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [toastExit, setToastExit] = useState(false);
    const toastTimer = useRef(null);

    // UI state
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [sortBy, setSortBy] = useState("none"); // none | prix_asc | prix_desc
    const [expandedPhotos, setExpandedPhotos] = useState({});
    const [confirm, setConfirm] = useState(null); // { message, onConfirm }
    const [refreshing, setRefreshing] = useState(false);

    /* ── TOAST HELPER ── */
    const showToast = useCallback((type, text) => {
        clearTimeout(toastTimer.current);
        setToastExit(false);
        setToast({ type, text });
        toastTimer.current = setTimeout(() => {
            setToastExit(true);
            setTimeout(() => setToast(null), 300);
        }, 3000);
    }, []);

    /* ── API CALLS ── */
    const fetchPhotos = useCallback(async (colisId) => {
        try {
            const res = await api.get(`/photos/colis/${colisId}`);
            setPhotos(prev => ({ ...prev, [colisId]: res.data }));
        } catch { }
    }, []);

    const fetchColis = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const res = await api.get("/colis/me");
            setColis(res.data);
            res.data.forEach(c => fetchPhotos(c.id));
        } catch {
            showToast("error", "Erreur chargement colis");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchPhotos, showToast]);

    useEffect(() => { fetchColis(); }, []);

    const handleUpload = async (colisId, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        try {
            await api.post(`/photos/${colisId}`, formData);
            fetchPhotos(colisId);
            showToast("success", "Photo ajoutée ✓");
        } catch {
            showToast("error", "Upload échoué");
        }
    };

    const handleDeletePhoto = (photoId, colisId) => {
        setConfirm({
            message: "Supprimer cette photo ?",
            onConfirm: async () => {
                try {
                    await api.delete(`/photos/${photoId}`);
                    fetchPhotos(colisId);
                    showToast("success", "Photo supprimée");
                } catch {
                    showToast("error", "Suppression échouée");
                }
            }
        });
    };

    const handlePublish = async (id) => {
        try {
            await api.put(`/colis/${id}/publish`);
            fetchColis(true);
            showToast("success", "Colis publié 🚀");
        } catch {
            showToast("error", "Erreur lors de la publication");
        }
    };

    const handleCancel = (id) => {
        setConfirm({
            message: "Annuler ce colis ? Cette action est irréversible.",
            onConfirm: async () => {
                try {
                    await api.put(`/colis/${id}/cancel`);
                    fetchColis(true);
                    showToast("success", "Colis annulé");
                } catch (err) {
                    showToast("error", err.response?.data?.message || "Erreur");
                }
            }
        });
    };

    /* ── FILTERED + SORTED LIST ── */
    const displayed = colis
        .filter(c => {
            const matchSearch = c.nom?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = filterStatus === "ALL" || c.statut === filterStatus;
            return matchSearch && matchStatus;
        })
        .sort((a, b) => {
            if (sortBy === "prix_asc") return (a.prixProposeMRU ?? 0) - (b.prixProposeMRU ?? 0);
            if (sortBy === "prix_desc") return (b.prixProposeMRU ?? 0) - (a.prixProposeMRU ?? 0);
            return 0;
        });

    /* ── STATUS COUNTS ── */
    const counts = colis.reduce((acc, c) => {
        acc[c.statut] = (acc[c.statut] || 0) + 1;
        return acc;
    }, {});

    /* ─────────────────── RENDER ─────────────────── */
    return (
        <div className="mc-root">
            <style>{CSS}</style>

            {/* ── TOAST ── */}
            {toast && (
                <div
                    className={toast.type === "success" ? "toast-enter" : toastExit ? "toast-exit" : "toast-enter"}
                    style={{
                        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 18px", borderRadius: 12,
                        background: toast.type === "success" ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
                        border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}`,
                        backdropFilter: "blur(12px)", fontSize: 14, fontWeight: 500,
                        color: toast.type === "success" ? "#34d399" : "#f87171",
                        maxWidth: 340
                    }}
                >
                    {toast.type === "success"
                        ? <CheckCircle size={16} />
                        : <XCircle size={16} />}
                    {toast.text}
                    <button onClick={() => setToast(null)} style={{ marginLeft: 8, opacity: .6, cursor: "pointer" }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── CONFIRM MODAL ── */}
            {confirm && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9998,
                    background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="modal-panel" style={{
                        background: "#161616", border: "1px solid #2a2a2a",
                        borderRadius: 16, padding: "28px 32px", maxWidth: 380, width: "90%"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: "rgba(249,115,22,.15)", display: "flex",
                                alignItems: "center", justifyContent: "center"
                            }}>
                                <AlertTriangle size={18} color="#f97316" />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 16 }}>Confirmation</span>
                        </div>
                        <p style={{ color: "#aaa", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                            {confirm.message}
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setConfirm(null)} style={{
                                padding: "8px 16px", borderRadius: 8, border: "1px solid #2a2a2a",
                                background: "transparent", color: "#888", cursor: "pointer", fontSize: 13,
                                fontFamily: "'DM Sans', sans-serif", fontWeight: 500
                            }}>
                                Annuler
                            </button>
                            <button onClick={() => { confirm.onConfirm(); setConfirm(null); }} style={{
                                padding: "8px 18px", borderRadius: 8, border: "none",
                                background: "linear-gradient(135deg, #f97316, #ea580c)",
                                color: "#fff", cursor: "pointer", fontSize: 13,
                                fontFamily: "'DM Sans', sans-serif", fontWeight: 600
                            }}>
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

                {/* ══ HEADER ══ */}
                <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 16, marginBottom: 32
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: "linear-gradient(135deg, #1e3a8a, #3b5fc0)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 16px rgba(30,58,138,.4)"
                            }}>
                                <Package size={20} color="#fff" />
                            </div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.3px" }}>
                                Mes Colis
                            </h1>
                        </div>
                        <p style={{ color: "#666", fontSize: 14, marginLeft: 52 }}>
                            {loading ? "Chargement…" : `${colis.length} colis au total`}
                            {!loading && displayed.length !== colis.length &&
                                <span style={{ color: "#f97316", marginLeft: 6 }}>· {displayed.length} affichés</span>
                            }
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                            onClick={() => fetchColis(true)}
                            disabled={refreshing}
                            style={{
                                padding: "9px 14px", borderRadius: 10, border: "1px solid #1f1f1f",
                                background: "#111", color: "#888", cursor: "pointer", display: "flex",
                                alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                                transition: "all .2s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#2d2d2d"; e.currentTarget.style.color = "#ccc"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.color = "#888"; }}
                        >
                            <RefreshCw size={14} style={{
                                transform: refreshing ? "rotate(360deg)" : "none",
                                transition: refreshing ? "transform .8s linear infinite" : "none"
                            }} />
                            Actualiser
                        </button>
                        <button
                            onClick={() => navigate("/dashboard/colis/create")}
                            style={{
                                padding: "9px 18px", borderRadius: 10, border: "none",
                                background: "linear-gradient(135deg, #1e3a8a, #3b5fc0)",
                                color: "#fff", cursor: "pointer", display: "flex",
                                alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600,
                                fontFamily: "'DM Sans', sans-serif",
                                boxShadow: "0 4px 14px rgba(30,58,138,.35)",
                                transition: "all .2s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(30,58,138,.5)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(30,58,138,.35)"; }}
                        >
                            <Plus size={15} /> Créer un colis
                        </button>
                    </div>
                </div>

                {/* ══ STATUS STRIP ══ */}
                {!loading && colis.length > 0 && (
                    <div style={{
                        display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
                        marginBottom: 24, flexWrap: "wrap"
                    }}>
                        <button
                            onClick={() => setFilterStatus("ALL")}
                            style={{
                                padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", border: "1px solid",
                                borderColor: filterStatus === "ALL" ? "#3b5fc0" : "#1f1f1f",
                                background: filterStatus === "ALL" ? "rgba(59,95,192,.2)" : "transparent",
                                color: filterStatus === "ALL" ? "#60a5fa" : "#666",
                                fontFamily: "'DM Sans', sans-serif", transition: "all .15s"
                            }}
                        >
                            Tous <span style={{ opacity: .6 }}>({colis.length})</span>
                        </button>
                        {ALL_STATUSES.filter(s => counts[s]).map(s => {
                            const cfg = STATUS_CONFIG[s];
                            const active = filterStatus === s;
                            return (
                                <button key={s}
                                    onClick={() => setFilterStatus(active ? "ALL" : s)}
                                    style={{
                                        padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                                        cursor: "pointer", border: "1px solid",
                                        borderColor: active ? cfg.color : "#1f1f1f",
                                        background: active ? cfg.bg : "transparent",
                                        color: active ? cfg.color : "#666",
                                        fontFamily: "'DM Sans', sans-serif", transition: "all .15s"
                                    }}
                                >
                                    {cfg.label} <span style={{ opacity: .6 }}>({counts[s]})</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ══ SEARCH + SORT ══ */}
                {!loading && colis.length > 0 && (
                    <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                            <Search size={15} style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)", color: "#555", pointerEvents: "none"
                            }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher un colis…"
                                style={{
                                    width: "100%", padding: "9px 12px 9px 36px",
                                    background: "#111", border: "1px solid #1f1f1f",
                                    borderRadius: 10, color: "#f5f5f5", fontSize: 13, outline: "none",
                                    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                                    transition: "border-color .15s"
                                }}
                                onFocus={e => e.target.style.borderColor = "#2d2d2d"}
                                onBlur={e => e.target.style.borderColor = "#1f1f1f"}
                            />
                            {search && (
                                <button onClick={() => setSearch("")} style={{
                                    position: "absolute", right: 10, top: "50%",
                                    transform: "translateY(-50%)", background: "none", border: "none",
                                    color: "#555", cursor: "pointer"
                                }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{
                                padding: "9px 14px", background: "#111", border: "1px solid #1f1f1f",
                                borderRadius: 10, color: sortBy === "none" ? "#666" : "#f5f5f5",
                                fontSize: 13, outline: "none", cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif"
                            }}
                        >
                            <option value="none">Trier par…</option>
                            <option value="prix_asc">Prix ↑</option>
                            <option value="prix_desc">Prix ↓</option>
                        </select>
                    </div>
                )}

                {/* ══ SKELETON ══ */}
                {loading && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                                background: "#111", border: "1px solid #1f1f1f",
                                borderRadius: 16, padding: 20, overflow: "hidden"
                            }}>
                                <div className="skeleton" style={{ height: 4, width: "100%", marginBottom: 20, borderRadius: 0, margin: "-20px -20px 20px", width: "calc(100% + 40px)" }} />
                                <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 12 }} />
                                <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 12, width: "50%", marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 12, width: "35%", marginBottom: 20 }} />
                                <div style={{ display: "flex", gap: 8 }}>
                                    <div className="skeleton" style={{ height: 30, width: 80 }} />
                                    <div className="skeleton" style={{ height: 30, width: 70 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ══ EMPTY STATE ══ */}
                {!loading && displayed.length === 0 && (
                    <div style={{
                        textAlign: "center", padding: "80px 20px",
                        border: "1px dashed #1f1f1f", borderRadius: 20,
                        background: "#0d0d0d"
                    }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: 20,
                            background: "rgba(30,58,138,.15)", border: "1px solid rgba(30,58,138,.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 20px"
                        }}>
                            <Package size={32} color="#3b5fc0" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                            {search || filterStatus !== "ALL" ? "Aucun résultat" : "Aucun colis"}
                        </h3>
                        <p style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
                            {search || filterStatus !== "ALL"
                                ? "Modifiez vos filtres pour voir plus de résultats."
                                : "Vous n'avez pas encore créé de colis."}
                        </p>
                        {!search && filterStatus === "ALL" && (
                            <button
                                onClick={() => navigate("/dashboard/colis/create")}
                                style={{
                                    padding: "10px 22px", borderRadius: 10, border: "none",
                                    background: "linear-gradient(135deg, #1e3a8a, #3b5fc0)",
                                    color: "#fff", cursor: "pointer", fontWeight: 600,
                                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                    display: "inline-flex", alignItems: "center", gap: 8
                                }}
                            >
                                <Plus size={15} /> Créer mon premier colis
                            </button>
                        )}
                    </div>
                )}

                {/* ══ CARDS GRID ══ */}
                {!loading && displayed.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                        {displayed.map((c, idx) => {
                            const cfg = STATUS_CONFIG[c.statut] || {};
                            const colisPhotos = photos[c.id] || [];
                            const photosExpanded = expandedPhotos[c.id];

                            return (
                                <div
                                    key={c.id}
                                    className="card-hover card-appear"
                                    style={{
                                        background: "#111", border: "1px solid #1f1f1f",
                                        borderRadius: 16, overflow: "hidden",
                                        animationDelay: `${idx * 50}ms`
                                    }}
                                >
                                    {/* Status bar */}
                                    <div style={{ height: 3, background: cfg.bar || "#333" }} />

                                    <div style={{ padding: "18px 20px" }}>

                                        {/* Card header */}
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            alignItems: "flex-start", marginBottom: 14
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 10,
                                                    background: cfg.bg || "#1a1a1a",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0
                                                }}>
                                                    <Package size={17} color={cfg.color || "#888"} />
                                                </div>
                                                <div>
                                                    <h3 style={{
                                                        fontSize: 15, fontWeight: 600, margin: 0,
                                                        lineHeight: 1.3, letterSpacing: "-.2px"
                                                    }}>
                                                        {c.nom}
                                                    </h3>
                                                    <span style={{
                                                        fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                                                        color: "#555", letterSpacing: ".5px"
                                                    }}>
                                                        #{c.id}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Status badge */}
                                            <span style={{
                                                padding: "4px 10px", borderRadius: 999, fontSize: 11,
                                                fontWeight: 600, background: cfg.bg, color: cfg.color,
                                                border: `1px solid ${cfg.color}30`, whiteSpace: "nowrap"
                                            }}>
                                                {cfg.label || c.statut}
                                            </span>
                                        </div>

                                        {/* Info rows */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                                            {[
                                                { icon: <Weight size={13} />, label: "Poids", value: `${c.poidsKg} kg` },
                                                { icon: <Hash size={13} />, label: "Quantité", value: c.quantite ?? "—" },
                                                { icon: <DollarSign size={13} />, label: "Prix proposé", value: c.prixProposeMRU ? `${c.prixProposeMRU} MRU` : "—" },
                                            ].map(({ icon, label, value }) => (
                                                <div key={label} style={{
                                                    display: "flex", justifyContent: "space-between",
                                                    alignItems: "center", padding: "5px 0",
                                                    borderBottom: "1px solid #1a1a1a"
                                                }}>
                                                    <span style={{
                                                        display: "flex", alignItems: "center", gap: 6,
                                                        color: "#555", fontSize: 12
                                                    }}>
                                                        {icon} {label}
                                                    </span>
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#ccc" }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Paid badge */}
                                        {c.paid && (
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                padding: "7px 12px", borderRadius: 8, marginBottom: 12,
                                                background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.2)"
                                            }}>
                                                <CheckCircle size={14} color="#34d399" />
                                                <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>
                                                    Paiement confirmé
                                                </span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            {c.statut === "BROUILLON" && (
                                                <ActionBtn
                                                    variant="primary"
                                                    icon={<Rocket size={13} />}
                                                    label="Publier"
                                                    onClick={() => handlePublish(c.id)}
                                                />
                                            )}
                                            {c.statut === "LIVRE" && !c.paid && (
                                                <ActionBtn
                                                    variant="success"
                                                    icon={<CreditCard size={13} />}
                                                    label="Payer"
                                                    onClick={() => navigate(`/dashboard/pay/${c.id}`)}
                                                />
                                            )}
                                            {(c.statut === "BROUILLON" || c.statut === "PUBLIE") && (
                                                <ActionBtn
                                                    variant="danger"
                                                    icon={<XCircle size={13} />}
                                                    label="Annuler"
                                                    onClick={() => handleCancel(c.id)}
                                                />
                                            )}
                                        </div>

                                        {/* Photos section */}
                                        <div style={{ marginTop: 14 }}>
                                            <button
                                                onClick={() => setExpandedPhotos(prev => ({
                                                    ...prev, [c.id]: !prev[c.id]
                                                }))}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    background: "none", border: "none", cursor: "pointer",
                                                    color: "#555", fontSize: 12, padding: "4px 0",
                                                    fontFamily: "'DM Sans', sans-serif", width: "100%"
                                                }}
                                            >
                                                <Image size={13} />
                                                Photos {colisPhotos.length > 0 && (
                                                    <span style={{
                                                        padding: "1px 7px", borderRadius: 999,
                                                        background: "rgba(59,95,192,.2)", color: "#60a5fa",
                                                        fontSize: 11, fontWeight: 600
                                                    }}>{colisPhotos.length}</span>
                                                )}
                                                <span style={{ marginLeft: "auto" }}>
                                                    {photosExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                </span>
                                            </button>

                                            {photosExpanded && (
                                                <div style={{ marginTop: 10 }}>
                                                    {colisPhotos.length > 0 && (
                                                        <div className="photo-grid" style={{ marginBottom: 10 }}>
                                                            {colisPhotos.map(p => (
                                                                <div key={p.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                                                                    <img
                                                                        src={p.url}
                                                                        alt="photo"
                                                                        loading="lazy"
                                                                        className="photo-thumb"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleDeletePhoto(p.id, c.id)}
                                                                        style={{
                                                                            position: "absolute", top: 4, right: 4,
                                                                            width: 22, height: 22, borderRadius: 6,
                                                                            background: "rgba(0,0,0,.7)", border: "none",
                                                                            cursor: "pointer", display: "flex",
                                                                            alignItems: "center", justifyContent: "center",
                                                                            opacity: 0, transition: "opacity .15s"
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                                                        onMouseLeave={e => e.currentTarget.style.opacity = "0"}
                                                                        className="delete-photo-btn"
                                                                    >
                                                                        <Trash2 size={11} color="#f87171" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Upload */}
                                                    <label style={{
                                                        display: "flex", alignItems: "center", gap: 7,
                                                        padding: "8px 12px", borderRadius: 8,
                                                        border: "1px dashed #2a2a2a", cursor: "pointer",
                                                        color: "#555", fontSize: 12, transition: "all .15s"
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b5fc0"; e.currentTarget.style.color = "#60a5fa"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; }}
                                                    >
                                                        <Upload size={13} />
                                                        Ajouter une photo
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            style={{ display: "none" }}
                                                            onChange={e => handleUpload(c.id, e.target.files[0])}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   ACTION BUTTON  (inline sub-component)
───────────────────────────────────────────── */
const ACTION_STYLES = {
    primary: { bg: "rgba(59,95,192,.15)", color: "#60a5fa", hoverBg: "rgba(59,95,192,.3)" },
    success: { bg: "rgba(52,211,153,.1)", color: "#34d399", hoverBg: "rgba(52,211,153,.25)" },
    danger: { bg: "rgba(248,113,113,.1)", color: "#f87171", hoverBg: "rgba(248,113,113,.25)" },
};

function ActionBtn({ variant = "primary", icon, label, onClick }) {
    const s = ACTION_STYLES[variant];
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 8, border: "none",
                background: hovered ? s.hoverBg : s.bg,
                color: s.color, cursor: "pointer", fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all .15s",
                transform: hovered ? "translateY(-1px)" : "none"
            }}
        >
            {icon} {label}
        </button>
    );
}