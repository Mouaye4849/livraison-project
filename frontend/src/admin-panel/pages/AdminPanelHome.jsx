import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Package, Plane, DollarSign, CreditCard,
  Clock, LogOut, RefreshCw, Bell, ChevronRight,
} from "lucide-react";
import adminApi, { ADMIN_TOKEN_KEY } from "../adminApi";

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
  pur:    "#a855f7",
  purDim: "rgba(168,85,247,0.12)",
  wh:     "#ffffff",
  gr:     "#9ca3af",
  dim:    "#4b5563",
};

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      flex: "1 1 calc(50% - 6px)", minWidth: 0,
      background: C.card, borderRadius: 18, border: `1px solid ${color}22`,
      padding: 16, display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={color} strokeWidth={1.8} />
      </div>
      <span style={{ color, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </span>
      <span style={{ color: C.gr, fontSize: 11, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export default function AdminPanelHome() {
  const navigate  = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [revenue,  setRevenue]  = useState(0);
  const [tx,       setTx]       = useState(0);
  const [pending,  setPending]  = useState(0);
  const [notifs,   setNotifs]   = useState([]);
  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [spinning, setSpinning] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (token) { try { setEmail(jwtDecode(token).sub ?? ""); } catch {} }

      const [st, rev, txCount, pend, ns] = await Promise.allSettled([
        adminApi.get("/admin/stats"),
        adminApi.get("/paiements/admin/revenue"),
        adminApi.get("/paiements/admin/count"),
        adminApi.get("/admin/trajets/pending"),
        adminApi.get("/notifications"),
      ]);

      if (st.status === "fulfilled")      setStats(st.value.data);
      if (rev.status === "fulfilled")     setRevenue(rev.value.data ?? 0);
      if (txCount.status === "fulfilled") setTx(txCount.value.data ?? 0);
      if (pend.status === "fulfilled")    setPending(Array.isArray(pend.value.data) ? pend.value.data.length : 0);
      if (ns.status === "fulfilled")      setNotifs((ns.value.data ?? []).filter(n => n.statut !== "LU").slice(0, 5));
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { setSpinning(true); load(); };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate("/m-admin/login", { replace: true });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={28} color={C.blu} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: "0 0 16px", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* header */}
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, color: C.dim, fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Administration</p>
          <h1 style={{ margin: 0, color: C.wh, fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>WASALI Admin</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={refresh} style={{ width: 38, height: 38, borderRadius: 11, background: C.card, border: `1px solid ${C.bd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.gr }}>
            <RefreshCw size={16} style={spinning ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
          <button onClick={logout} style={{ width: 38, height: 38, borderRadius: 11, background: C.redDim, border: `1px solid rgba(220,38,38,0.2)`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogOut size={16} color={C.red} />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* admin info card */}
        <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.bd}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: C.bluDim, border: `1px solid rgba(59,130,246,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: C.blu, fontSize: 16, fontWeight: 800 }}>{email.charAt(0).toUpperCase() || "A"}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: C.wh, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email || "admin@wasali.mr"}</p>
            <p style={{ margin: 0, color: C.dim, fontSize: 11 }}>Administrateur système</p>
          </div>
          <div style={{ background: C.bluDim, border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 8, padding: "4px 10px" }}>
            <span style={{ color: C.blu, fontSize: 10, fontWeight: 800, letterSpacing: "0.06em" }}>ADMIN</span>
          </div>
        </div>

        {/* pending alert */}
        {pending > 0 && (
          <button
            onClick={() => navigate("/m-admin/trajets")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              background: C.ylwDim, border: `1px solid rgba(250,204,21,0.35)`,
              borderRadius: 16, padding: "13px 14px", cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(250,204,21,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Clock size={18} color={C.ylw} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: C.ylw, fontSize: 14, fontWeight: 700 }}>
                {pending} trajet{pending > 1 ? "s" : ""} en attente
              </p>
              <p style={{ margin: 0, color: `${C.ylw}aa`, fontSize: 11, marginTop: 2 }}>Approbation requise</p>
            </div>
            <ChevronRight size={16} color={C.ylw} />
          </button>
        )}

        {/* section label */}
        <p style={{ margin: 0, color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Statistiques</p>

        {/* stats grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <StatCard icon={Package}     label="Total colis"   value={stats?.totalColis   ?? 0} color={C.red} bg={C.redDim} />
          <StatCard icon={Plane}       label="Total trajets" value={stats?.totalTrajets ?? 0} color={C.grn} bg={C.grnDim} />
          <StatCard icon={DollarSign}  label="Revenus (MRU)" value={revenue}                  color={C.pur} bg={C.purDim} />
          <StatCard icon={CreditCard}  label="Transactions"  value={tx}                       color={C.blu} bg={C.bluDim} />
        </div>

        {/* quick actions */}
        <p style={{ margin: 0, color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Actions rapides</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[
            { label: "Colis",    icon: Package, color: C.red, bg: C.redDim, path: "/m-admin/colis"   },
            { label: "Trajets",  icon: Plane,   color: C.grn, bg: C.grnDim, path: "/m-admin/trajets" },
            { label: "Comptes",  icon: Bell,    color: C.blu, bg: C.bluDim, path: "/m-admin/users"   },
            { label: "Attente",  icon: Clock,   color: C.ylw, bg: C.ylwDim, path: "/m-admin/trajets" },
          ].map(({ label, icon: Icon, color, bg, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{
                flex: "1 1 calc(50% - 6px)", minWidth: 0,
                background: C.card, border: `1px solid ${C.bd}`, borderRadius: 18,
                padding: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} color={color} strokeWidth={1.8} />
              </div>
              <span style={{ color: C.wh, fontSize: 14, fontWeight: 700 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* notifications */}
        {notifs.length > 0 && (
          <>
            <p style={{ margin: 0, color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Notifications récentes</p>
            <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.bd}`, overflow: "hidden" }}>
              {notifs.map((n, i) => (
                <div key={n.id ?? i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: 14, borderBottom: i < notifs.length - 1 ? `1px solid ${C.bd2}` : "none",
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.blu, marginTop: 5, flexShrink: 0 }} />
                  <p style={{ margin: 0, color: C.gr, fontSize: 13, lineHeight: 1.5 }}>{n.message}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
