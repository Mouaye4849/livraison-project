import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Package, Users, Plane } from "lucide-react";

const C = {
  bg:    "#08080a",
  bar:   "#0d0d0f",
  bd:    "rgba(255,255,255,0.07)",
  blu:   "#3b82f6",
  gray:  "#4b5563",
  wh:    "#ffffff",
};

const TABS = [
  { path: "/m-admin",         label: "Tableau",  Icon: LayoutGrid },
  { path: "/m-admin/colis",   label: "Colis",    Icon: Package    },
  { path: "/m-admin/trajets", label: "Trajets",  Icon: Plane      },
  { path: "/m-admin/users",   label: "Comptes",  Icon: Users      },
];

export default function AdminPanelLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const active = (path) =>
    path === "/m-admin" ? pathname === "/m-admin" : pathname.startsWith(path);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: C.bg, maxWidth: 480, margin: "0 auto", position: "relative" }}>

      {/* scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
        <Outlet />
      </div>

      {/* bottom nav */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: C.bar,
        borderTop: `1px solid ${C.bd}`,
        display: "flex",
        alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        paddingTop: 8,
        zIndex: 100,
        boxShadow: "0 -8px 32px rgba(0,0,0,0.55)",
      }}>
        {TABS.map(({ path, label, Icon }) => {
          const isActive = active(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                borderRadius: 30,
                padding: isActive ? "6px 14px" : "6px 10px",
                background: isActive ? C.blu : "transparent",
                transition: "all 0.2s",
              }}>
                <Icon size={18} color={isActive ? C.wh : C.gray} strokeWidth={isActive ? 2.2 : 1.8} />
                {isActive && (
                  <span style={{ color: C.wh, fontSize: 11, fontWeight: 700, letterSpacing: 0.1, whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
