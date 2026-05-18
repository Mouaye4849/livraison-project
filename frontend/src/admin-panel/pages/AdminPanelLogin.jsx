import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, Loader } from "lucide-react";
import axios from "axios";
import { ADMIN_TOKEN_KEY } from "../adminApi";

const C = {
  bg:      "#08080a",
  card:    "#111113",
  input:   "#18181b",
  bd:      "rgba(255,255,255,0.07)",
  bdFocus: "rgba(59,130,246,0.5)",
  blu:     "#3b82f6",
  bluDim:  "rgba(59,130,246,0.13)",
  red:     "#dc2626",
  redDim:  "rgba(220,38,38,0.12)",
  wh:      "#ffffff",
  gr:      "#9ca3af",
  dim:     "#4b5563",
};

function Field({ icon: Icon, placeholder, value, onChange, type = "text", right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: C.input, borderRadius: 14, border: `1px solid ${focused ? C.bdFocus : C.bd}`,
      paddingLeft: 14, paddingRight: 14, height: 52, transition: "border-color 0.18s",
    }}>
      <Icon size={17} color={focused ? C.blu : C.dim} strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        style={{
          flex: 1, background: "none", border: "none", outline: "none",
          color: C.wh, fontSize: 15, fontFamily: "inherit",
        }}
      />
      {right}
    </div>
  );
}

export default function AdminPanelLogin() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Renseignez l'email et le mot de passe."); return; }
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", { email: email.trim().toLowerCase(), password });
      const token = data.token;
      if (data.role !== "ROLE_ADMIN") {
        setError("Accès refusé. Ce compte n'est pas administrateur.");
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      navigate("/m-admin", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response
          ? `Erreur serveur (${err.response.status})`
          : "Serveur inaccessible. Vérifiez que Spring Boot est démarré sur le port 8080.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px 20px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* blob */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "rgba(59,130,246,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80,  width: 260, height: 260, borderRadius: "50%", background: "rgba(59,130,246,0.04)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20, margin: "0 auto 16px",
            background: C.bluDim, border: `1px solid rgba(59,130,246,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={32} color={C.blu} strokeWidth={1.8} />
          </div>
          <h1 style={{ margin: 0, color: C.wh, fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>
            WASALI <span style={{ color: C.blu }}>Admin</span>
          </h1>
          <p style={{ margin: "6px 0 0", color: C.dim, fontSize: 13 }}>
            Accès réservé aux administrateurs
          </p>
        </div>

        {/* form card */}
        <div style={{
          background: C.card, borderRadius: 24, border: `1px solid ${C.bd}`,
          padding: 24,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Email
              </label>
              <Field
                icon={Mail}
                placeholder="admin@wasali.mr"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                type="email"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Mot de passe
              </label>
              <Field
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                type={showPw ? "text" : "password"}
                right={
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: C.dim }}>
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />
            </div>

            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: C.redDim, border: `1px solid rgba(220,38,38,0.25)`,
                borderRadius: 12, padding: "10px 14px",
              }}>
                <AlertCircle size={15} color={C.red} />
                <span style={{ color: "#f87171", fontSize: 13 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                background: C.blu, color: C.wh, border: "none", borderRadius: 14,
                height: 52, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.75 : 1, transition: "opacity 0.18s",
                fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
              }}
            >
              {loading ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Se connecter"}
            </button>

          </form>
        </div>

        <p style={{ textAlign: "center", color: C.dim, fontSize: 12, marginTop: 20 }}>
          Ce panneau est accessible uniquement aux comptes ADMIN.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
