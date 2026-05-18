import { useEffect, useState, useCallback } from "react";
import { Users, Search, X, RefreshCw, ShieldCheck, User, Truck, TrendingUp, TrendingDown, Ban, CheckCircle, Trash2, AlertCircle } from "lucide-react";
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
  pur:    "#a855f7",
  purDim: "rgba(168,85,247,0.12)",
  wh:     "#ffffff",
  gr:     "#9ca3af",
  dim:    "#4b5563",
};

const ROLE_CFG = {
  ROLE_ADMIN:    { label: "Admin",     color: C.blu, bg: C.bluDim, Icon: ShieldCheck },
  ROLE_VOYAGEUR: { label: "Voyageur",  color: C.grn, bg: C.grnDim, Icon: Truck      },
  ROLE_USER:     { label: "Client",    color: C.gr,  bg: "rgba(156,163,175,0.12)", Icon: User },
};

const ROLE_FILTERS = [
  { key: "TOUS",          label: "Tous"       },
  { key: "ROLE_ADMIN",    label: "Admins"     },
  { key: "ROLE_VOYAGEUR", label: "Voyageurs"  },
  { key: "ROLE_USER",     label: "Clients"    },
];

function initials(email = "") {
  return email.charAt(0).toUpperCase() || "?";
}

export default function AdminPanelUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState("TOUS");
  const [query,      setQuery]      = useState("");
  const [busy,       setBusy]       = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const { data } = await adminApi.get("/admin/users?page=0&size=200");
      setUsers(Array.isArray(data) ? data : data.content ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
        "Impossible de charger les utilisateurs. Vérifiez la connexion et les CORS."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // initial load
  useEffect(() => { load(); }, [load]);

  // auto-refresh when the browser tab regains focus
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const action = async (label, fn) => {
    if (busy) return;
    setBusy(label);
    try { await fn(); await load(); }
    catch { alert("Action impossible."); }
    finally { setBusy(null); }
  };

  const confirm = (msg, fn) => { if (window.confirm(msg)) fn(); };

  const displayed = users.filter(u => {
    if (filter !== "TOUS" && u.role !== filter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return (u.email ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const total     = users.length;
  const admins    = users.filter(u => u.role === "ROLE_ADMIN").length;
  const voyageurs = users.filter(u => u.role === "ROLE_VOYAGEUR").length;
  const clients   = users.filter(u => u.role === "ROLE_USER").length;

  return (
    <div style={{ background: C.bg, minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* header */}
      <div style={{ padding: "16px 20px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, color: C.wh, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, flex: 1 }}>Comptes</h1>
        <div style={{ background: C.bluDim, borderRadius: 10, padding: "4px 10px" }}>
          <span style={{ color: C.blu, fontSize: 13, fontWeight: 700 }}>{displayed.length}</span>
        </div>
        <button onClick={() => load(true)} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.bd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.gr }}>
          <RefreshCw size={15} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
        </button>
      </div>

      {/* stats strip */}
      <div style={{ margin: "0 16px 12px", background: C.card, borderRadius: 16, border: `1px solid ${C.bd}`, display: "flex", padding: "14px 0" }}>
        {[
          { label: "Total",      value: total,     color: C.wh  },
          { label: "Admins",     value: admins,    color: C.blu },
          { label: "Voyageurs",  value: voyageurs, color: C.grn },
          { label: "Clients",    value: clients,   color: C.gr  },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: i < arr.length - 1 ? `1px solid ${C.bd}` : "none" }}>
            <span style={{ color, fontSize: 18, fontWeight: 800 }}>{value}</span>
            <span style={{ color: C.dim, fontSize: 10, fontWeight: 500, marginTop: 2 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* search */}
      <div style={{ margin: "0 16px 10px", background: C.input, borderRadius: 14, border: `1px solid ${C.bd}`, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 44 }}>
        <Search size={16} color={C.dim} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher par email…"
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
        {ROLE_FILTERS.map(f => (
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

      {/* error banner */}
      {error && (
        <div style={{
          margin: "0 16px 10px", display: "flex", alignItems: "center", gap: 8,
          background: C.redDim, border: `1px solid rgba(220,38,38,0.3)`,
          borderRadius: 12, padding: "11px 14px",
        }}>
          <AlertCircle size={15} color={C.red} style={{ flexShrink: 0 }} />
          <span style={{ color: "#f87171", fontSize: 13 }}>{error}</span>
        </div>
      )}

      {/* list */}
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <RefreshCw size={26} color={C.blu} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 10 }}>
            <Users size={44} color={C.dim} />
            <span style={{ color: C.gr, fontSize: 14 }}>Aucun utilisateur trouvé</span>
          </div>
        )}

        {!loading && displayed.map(user => {
          const roleCfg = ROLE_CFG[user.role] ?? ROLE_CFG.ROLE_USER;
          const isAdmin = user.role === "ROLE_ADMIN";
          const userId  = user.id;

          return (
            <div key={userId} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.bd}`, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>

              {/* top */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: roleCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: roleCfg.color, fontWeight: 800, fontSize: 15 }}>{initials(user.email)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: C.wh, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ background: roleCfg.bg, borderRadius: 6, padding: "2px 7px", color: roleCfg.color, fontSize: 10, fontWeight: 700 }}>{roleCfg.label}</span>
                    <span style={{
                      background: user.enabled ? C.grnDim : C.redDim,
                      borderRadius: 6, padding: "2px 7px",
                      color: user.enabled ? C.grn : C.red,
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {user.enabled ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                </div>
              </div>

              {/* actions */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {!isAdmin && (
                  <ActionBtn
                    Icon={TrendingUp} label="Promouvoir" color={C.blu} bg={C.bluDim}
                    onClick={() => confirm(`Promouvoir ${user.email} en admin ?`, () =>
                      action(`promote-${userId}`, () => adminApi.put(`/admin/users/${userId}/promote`))
                    )}
                  />
                )}
                {isAdmin && (
                  <ActionBtn
                    Icon={TrendingDown} label="Rétrograder" color={C.ylw} bg={C.ylwDim}
                    onClick={() => confirm(`Rétrograder ${user.email} ?`, () =>
                      action(`demote-${userId}`, () => adminApi.put(`/admin/users/${userId}/demote`))
                    )}
                  />
                )}
                {user.enabled ? (
                  <ActionBtn
                    Icon={Ban} label="Désactiver" color={C.red} bg={C.redDim}
                    onClick={() => confirm(`Désactiver ${user.email} ?`, () =>
                      action(`disable-${userId}`, () => adminApi.put(`/admin/users/${userId}/disable`))
                    )}
                  />
                ) : (
                  <ActionBtn
                    Icon={CheckCircle} label="Activer" color={C.grn} bg={C.grnDim}
                    onClick={() => action(`enable-${userId}`, () => adminApi.put(`/admin/users/${userId}/enable`))}
                  />
                )}
                {!isAdmin && (
                  <ActionBtn
                    Icon={Trash2} label="Supprimer" color={C.red} bg={C.redDim}
                    onClick={() => confirm(`Supprimer définitivement ${user.email} ?`, () =>
                      action(`delete-${userId}`, () => adminApi.delete(`/admin/users/${userId}`))
                    )}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ActionBtn({ Icon, label, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        background: bg, border: `1px solid ${color}30`, borderRadius: 9,
        padding: "7px 12px", cursor: "pointer", color, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
      }}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
