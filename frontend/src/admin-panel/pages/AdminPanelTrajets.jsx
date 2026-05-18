import { useEffect, useState, useCallback } from "react";
import { Plane, RefreshCw, Clock, Check, X, Trash2, MapPin, Calendar, User } from "lucide-react";
import adminApi from "../adminApi";

const C = {
  bg:     "#08080a",
  card:   "#111113",
  bd:     "rgba(255,255,255,0.07)",
  bd2:    "rgba(255,255,255,0.04)",
  blu:    "#3b82f6",
  bluDim: "rgba(59,130,246,0.13)",
  red:    "#dc2626",
  redDim: "rgba(220,38,38,0.12)",
  grn:    "#22c55e",
  grnDim: "rgba(34,197,94,0.12)",
  ylw:    "#facc15",
  ylwDim: "rgba(250,204,21,0.12)",
  wh:     "#ffffff",
  gr:     "#9ca3af",
  dim:    "#4b5563",
};

const STATUT_CFG = {
  EN_ATTENTE: { label: "En attente", color: C.ylw, bg: C.ylwDim },
  APPROUVE:   { label: "Approuvé",   color: C.grn, bg: C.grnDim },
  REJETE:     { label: "Rejeté",     color: C.red,  bg: C.redDim  },
  TERMINE:    { label: "Terminé",    color: C.gr,   bg: "rgba(156,163,175,0.12)" },
  EN_COURS:   { label: "En cours",   color: C.blu,  bg: C.bluDim  },
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return dateStr; }
}

export default function AdminPanelTrajets() {
  const [all,     setAll]     = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("pending");
  const [busy,    setBusy]    = useState(null);

  const load = useCallback(async () => {
    try {
      const [allRes, pendRes] = await Promise.allSettled([
        adminApi.get("/admin/trajets"),
        adminApi.get("/admin/trajets/pending"),
      ]);
      const allData  = allRes.status  === "fulfilled" ? (allRes.value.data  ?? []) : [];
      const pendData = pendRes.status === "fulfilled" ? (pendRes.value.data ?? []) : [];
      setAll(Array.isArray(allData)  ? allData  : []);
      setPending(Array.isArray(pendData) ? pendData : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (key, fn, confirmMsg) => {
    if (busy) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(key);
    try { await fn(); await load(); }
    catch { alert("Action impossible."); }
    finally { setBusy(null); }
  };

  const displayed = tab === "pending" ? pending : all;

  return (
    <div style={{ background: C.bg, minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* header */}
      <div style={{ padding: "16px 20px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, color: C.wh, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, flex: 1 }}>Trajets</h1>
        <div style={{ background: C.bluDim, borderRadius: 10, padding: "4px 10px" }}>
          <span style={{ color: C.blu, fontSize: 13, fontWeight: 700 }}>{displayed.length}</span>
        </div>
        <button onClick={load} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.bd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.gr }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* stats strip */}
      <div style={{ margin: "0 16px 12px", background: C.card, borderRadius: 16, border: `1px solid ${C.bd}`, display: "flex", padding: "14px 0" }}>
        {[
          { label: "Total",     value: all.length,     color: C.wh  },
          { label: "En attente", value: pending.length, color: C.ylw },
          { label: "Approuvés", value: all.filter(t => t.statut === "APPROUVE").length, color: C.grn },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: i < arr.length - 1 ? `1px solid ${C.bd}` : "none" }}>
            <span style={{ color, fontSize: 20, fontWeight: 800 }}>{value}</span>
            <span style={{ color: C.gr, fontSize: 11, fontWeight: 500, marginTop: 3 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
        {[
          { key: "pending", label: `En attente${pending.length > 0 ? ` (${pending.length})` : ""}` },
          { key: "all",     label: "Tous les trajets" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flexShrink: 0, padding: "7px 16px", borderRadius: 20, cursor: "pointer",
              background: tab === t.key ? C.bluDim : C.card,
              border: `1px solid ${tab === t.key ? C.blu + "55" : C.bd}`,
              color: tab === t.key ? C.blu : C.dim, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* list */}
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <RefreshCw size={26} color={C.blu} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 10 }}>
            {tab === "pending"
              ? <><Clock size={44} color={C.dim} /><span style={{ color: C.gr, fontSize: 14 }}>Aucun trajet en attente</span></>
              : <><Plane size={44} color={C.dim} /><span style={{ color: C.gr, fontSize: 14 }}>Aucun trajet trouvé</span></>
            }
          </div>
        )}

        {!loading && displayed.map(trajet => {
          const cfg       = STATUT_CFG[trajet.statut] ?? STATUT_CFG.EN_ATTENTE;
          const isPending = trajet.statut === "EN_ATTENTE";
          const id        = trajet.id;

          return (
            <div
              key={id}
              style={{
                background: C.card, borderRadius: 16, padding: 14,
                border: isPending ? `1px solid rgba(250,204,21,0.35)` : `1px solid ${C.bd}`,
                display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              {/* top */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Plane size={17} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={12} color={C.dim} />
                    <p style={{ margin: 0, color: C.wh, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {trajet.villeDepart ?? "?"} → {trajet.villeArrivee ?? "?"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {trajet.dateDepart && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, color: C.dim, fontSize: 11 }}>
                        <Calendar size={10} /> {fmt(trajet.dateDepart)}
                      </span>
                    )}
                    {trajet.userEmail && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, color: C.dim, fontSize: 11 }}>
                        <User size={10} /> {trajet.userEmail}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: cfg.bg, borderRadius: 8, padding: "4px 8px", flexShrink: 0 }}>
                  <span style={{ color: cfg.color, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
                </div>
              </div>

              {/* capacity */}
              {trajet.poidsDisponibleKg !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: C.gr, fontSize: 12 }}>Capacité : {trajet.poidsDisponibleKg} kg</span>
                  {trajet.prixParKgMRU && (
                    <span style={{ color: C.gr, fontSize: 12 }}>· {trajet.prixParKgMRU} MRU/kg</span>
                  )}
                </div>
              )}

              {/* actions */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {isPending && (
                  <>
                    <button
                      onClick={() => act(`approve-${id}`, () => adminApi.put(`/admin/trajets/${id}/approve`))}
                      disabled={!!busy}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: C.grnDim, border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 10, padding: "9px 0", cursor: "pointer", color: C.grn, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}
                    >
                      <Check size={14} /> Approuver
                    </button>
                    <button
                      onClick={() => act(`reject-${id}`, () => adminApi.put(`/admin/trajets/${id}/reject`), "Rejeter ce trajet ?")}
                      disabled={!!busy}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: C.redDim, border: `1px solid rgba(220,38,38,0.3)`, borderRadius: 10, padding: "9px 0", cursor: "pointer", color: C.red, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}
                    >
                      <X size={14} /> Rejeter
                    </button>
                  </>
                )}
                <button
                  onClick={() => act(`delete-${id}`, () => adminApi.delete(`/admin/trajets/${id}`), "Supprimer définitivement ce trajet ?")}
                  disabled={!!busy}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: C.redDim, border: `1px solid rgba(220,38,38,0.25)`, borderRadius: 10, padding: "9px 12px", cursor: "pointer", color: C.red, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}
                >
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
