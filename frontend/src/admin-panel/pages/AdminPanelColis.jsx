import { useEffect, useState, useCallback } from "react";
import { Package, Search, X, Trash2, RefreshCw, MapPin, Weight, Banknote, CheckCircle, Circle } from "lucide-react";
import adminApi from "../adminApi";

const C = {
  bg:     "#08080a",
  card:   "#111113",
  input:  "#18181b",
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

const STATUS_CFG = {
  BROUILLON: { label: "Brouillon", color: C.gr,  bg: "rgba(156,163,175,0.12)" },
  PUBLIE:    { label: "Publié",    color: C.blu,  bg: C.bluDim  },
  ACCEPTE:   { label: "Accepté",  color: C.ylw,  bg: C.ylwDim  },
  EN_COURS:  { label: "En cours", color: C.red,   bg: C.redDim  },
  LIVRE:     { label: "Livré",    color: C.grn,   bg: C.grnDim  },
  TERMINE:   { label: "Terminé",  color: C.grn,   bg: C.grnDim  },
  ANNULE:    { label: "Annulé",   color: C.dim,   bg: C.bd2     },
};

const FILTERS = [
  { key: "TOUS",     label: "Tous"     },
  { key: "PUBLIE",   label: "Publiés"  },
  { key: "EN_COURS", label: "En cours" },
  { key: "ACCEPTE",  label: "Acceptés" },
  { key: "LIVRE",    label: "Livrés"   },
  { key: "ANNULE",   label: "Annulés"  },
];

function applyFilter(list, key, q) {
  let r = key === "TOUS" ? list : list.filter(c => c.statut === key);
  if (q.trim()) {
    const lq = q.trim().toLowerCase();
    r = r.filter(c =>
      (c.nom ?? "").toLowerCase().includes(lq) ||
      (c.villeDepart ?? "").toLowerCase().includes(lq) ||
      (c.villeArrivee ?? "").toLowerCase().includes(lq) ||
      (c.userEmail ?? "").toLowerCase().includes(lq)
    );
  }
  return r;
}

export default function AdminPanelColis() {
  const [colis,   setColis]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("TOUS");
  const [query,   setQuery]   = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/colis");
      setColis(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      setColis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ? Cette action est irréversible.`)) return;
    setDeleting(id);
    try {
      await adminApi.delete(`/colis/${id}`);
      await load();
    } catch {
      alert("Impossible de supprimer ce colis.");
    } finally {
      setDeleting(null);
    }
  };

  const displayed = applyFilter(colis, filter, query);
  const total     = colis.length;
  const enCours   = colis.filter(c => ["PUBLIE","ACCEPTE","EN_COURS"].includes(c.statut)).length;
  const livres    = colis.filter(c => ["LIVRE","TERMINE"].includes(c.statut)).length;

  return (
    <div style={{ background: C.bg, minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* header */}
      <div style={{ padding: "16px 20px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, color: C.wh, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, flex: 1 }}>Colis</h1>
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
          { label: "Total",    value: total,   color: C.wh  },
          { label: "En cours", value: enCours, color: C.red },
          { label: "Livrés",   value: livres,  color: C.grn },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: i < arr.length - 1 ? `1px solid ${C.bd}` : "none" }}>
            <span style={{ color, fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{value}</span>
            <span style={{ color: C.gr, fontSize: 11, fontWeight: 500, marginTop: 3 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* search */}
      <div style={{ margin: "0 16px 10px", background: C.input, borderRadius: 14, border: `1px solid ${C.bd}`, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 44 }}>
        <Search size={16} color={C.dim} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher nom, ville, email…"
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.wh, fontSize: 14, fontFamily: "inherit" }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.dim, display: "flex" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* filter chips */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 20, cursor: "pointer",
              background: filter === f.key ? C.bluDim : C.card,
              border: `1px solid ${filter === f.key ? C.blu + "55" : C.bd}`,
              color: filter === f.key ? C.blu : C.dim, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            {f.label}
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
            <Package size={44} color={C.dim} />
            <span style={{ color: C.gr, fontSize: 14 }}>Aucun colis trouvé</span>
          </div>
        )}

        {!loading && displayed.map(item => {
          const cfg = STATUS_CFG[item.statut] ?? STATUS_CFG.BROUILLON;
          return (
            <div key={item.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.bd}`, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>

              {/* top row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Package size={17} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: C.wh, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nom}</p>
                  <p style={{ margin: 0, color: C.dim, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.userEmail ?? "—"}</p>
                </div>
                <div style={{ background: cfg.bg, borderRadius: 8, padding: "4px 8px", flexShrink: 0 }}>
                  <span style={{ color: cfg.color, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
                </div>
              </div>

              {/* details */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { Icon: MapPin,   text: `${item.villeDepart} → ${item.villeArrivee}` },
                  { Icon: Weight,   text: `${item.poidsKg} kg`                         },
                  { Icon: Banknote, text: `${item.prixProposeMRU} MRU`                  },
                ].map(({ Icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon size={12} color={C.dim} />
                    <span style={{ color: C.gr, fontSize: 12 }}>{text}</span>
                  </div>
                ))}
                {item.paid !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {item.paid
                      ? <CheckCircle size={12} color={C.grn} />
                      : <Circle size={12} color={C.dim} />
                    }
                    <span style={{ color: item.paid ? C.grn : C.dim, fontSize: 12 }}>
                      {item.paid ? "Payé" : "Impayé"}
                    </span>
                  </div>
                )}
              </div>

              {/* delete */}
              <button
                onClick={() => handleDelete(item.id, item.nom)}
                disabled={deleting === item.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: C.redDim, border: `1px solid rgba(220,38,38,0.3)`, borderRadius: 10,
                  padding: "9px 0", cursor: "pointer", color: C.red, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                  opacity: deleting === item.id ? 0.6 : 1,
                }}
              >
                <Trash2 size={14} />
                {deleting === item.id ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
